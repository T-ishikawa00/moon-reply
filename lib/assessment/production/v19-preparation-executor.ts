import { randomUUID } from "node:crypto";
import { V19L5LocalApplication, type V19L5Result } from "../runtime/v19-l5-application.ts";
import { loadV19L5StageCatalog } from "../runtime/v19-l5-stage-catalog.ts";
import { createOpaqueClarificationIdV1, clarificationSourceIdentityV1 } from "../runtime/clarification-evidence-v1.ts";
import { validateStageOutput } from "../runtime/validation.ts";
import { hashJson } from "../runtime/hash.ts";
import { emptyUsageTotals } from "../runtime/cost.ts";
import { M2RuntimeError, asM2RuntimeError } from "../runtime/errors.ts";
import type { PipelineOptions, ProviderInvocationPermit } from "../runtime/pipeline.ts";
import type { AssessmentInput, AssessmentRepository, AiStageTransport, JsonObject, StageResponse } from "../runtime/types.ts";
import { V19_PRODUCTION_PREPARATION_SCHEMA_VERSION, type V19PreparationAnswer, type V19PreparationExecutionResult } from "./v19-preparation-contract.ts";

/** Authenticated preparation adapter. Only the Provider boundary is supplied;
 * lifecycle, evidence persistence and the caller's compute permits are real. */
export async function executeV19Preparation(input: {
  requestId: string; runId: string; input: AssessmentInput;
  repository: AssessmentRepository; transport: AiStageTransport;
  now: () => string; timeZone: string;
  beforeInvocation: NonNullable<PipelineOptions["beforeProviderInvocation"]>;
  resume?: { checkpoint: V19L5Result; answer: V19PreparationAnswer; resumeStartedAt: string };
  runAlreadyCreated?: boolean;
}): Promise<V19PreparationExecutionResult> {
  const { repository, requestId, runId, now } = input;
  const catalog = await loadV19L5StageCatalog(), written = new Set<string>();
  const upstream = catalog.definitions.filter(def => ["PB-01", "PB-01C", "PB-02", "PB-03"].includes(def.stageId));
  if (!input.runAlreadyCreated) await repository.createRun({ id: runId, requestId, requestedModel: "gpt-5.6-luna",
    promptBundleVersion: catalog.promptBundleVersion, schemaSetVersion: catalog.schemaSetVersion,
    stageTopologyVersion: catalog.stageTopologyVersion, runKind: input.resume ? "clarification_resume" : "initial", startedAt: now() });
  const skip = async (definition: typeof upstream[number], stopped = false) => {
    if (written.has(definition.stageId)) return;
    // Original-message continuation reuses the initial PB-01 receipt embedded
    // in its checkpoint. It is not a newly skipped PB-01 execution.
    if (definition.stageId === "PB-01" && input.resume?.answer.kind === "original_message") return;
    const skipReason = stopped ? "routing_stopped" : input.resume ? "reused_initial_authority" : "candidate_absent";
    await repository.skipStage({ id: randomUUID(), runId, stageId: definition.stageId, sequenceNumber: definition.sequenceNumber,
      attemptNumber: 1, requestHash: hashJson({ stageId: definition.stageId, skipReason, runId }),
      promptHash: definition.promptHash, schemaHash: definition.schemaHash, requestedModel: "gpt-5.6-luna", skipReason, createdAt: now() });
    written.add(definition.stageId);
  };
  const transport: AiStageTransport = { invoke: async request => {
    const definition = upstream.find(def => def.stageId === request.stageId);
    if (!definition || written.has(request.stageId)) throw new M2RuntimeError("PRODUCTION_PREPAYMENT_STAGE_NOT_AUTHORIZED");
    for (const prior of upstream.filter(def => def.sequenceNumber < definition.sequenceNumber)) await skip(prior);
    const id = randomUUID();
    await repository.startStage({ id, runId, stageId: request.stageId, sequenceNumber: definition.sequenceNumber, attemptNumber: 1,
      requestHash: hashJson(request as unknown as JsonObject), inputJson: request.input, promptHash: request.promptHash,
      schemaHash: request.schemaHash, requestedModel: request.model, createdAt: now() });
    written.add(request.stageId);
    let response: StageResponse | null = null, permit: void | ProviderInvocationPermit = undefined;
    try {
      permit = await input.beforeInvocation(request.stageId, 1);
      response = await input.transport.invoke(request);
      if (response.returnedModel !== request.model) throw new M2RuntimeError("M2_STAGE_MODEL_MISMATCH");
      validateStageOutput({ ...definition, ...request }, response.output);
      await repository.completeStage({ stageRunId: id, responseId: response.responseId, returnedModel: response.returnedModel,
        outputJson: response.output, usage: response.usage, latencyMs: response.latencyMs });
      return response;
    } catch (error) {
      const safe = asM2RuntimeError(error);
      await repository.failStage({ stageRunId: id, responseId: response?.responseId ?? null, returnedModel: response?.returnedModel ?? null,
        outputJson: response?.output ?? null, errorCode: safe.safeCode,
        usage: response?.usage ?? { inputTokens: 0, cachedTokens: 0, outputTokens: 0, reasoningTokens: 0 }, latencyMs: response?.latencyMs ?? 0 });
      throw safe;
    } finally { await permit?.finish(response !== null); }
  } };
  let checkpoint: V19L5Result | null = null;
  try {
    const application = new V19L5LocalApplication({ catalog, transport, now, timeZone: input.timeZone });
    checkpoint = input.resume ? await application.resumePreparation(input.resume.checkpoint, input.resume.answer, input.resume.resumeStartedAt) : await application.prepare(input.input);
    const returnedModel = checkpoint.evidence.stages.some(stage => stage.response) ? "gpt-5.6-luna" : null;
    const snapshot = { schemaVersion: V19_PRODUCTION_PREPARATION_SCHEMA_VERSION, checkpoint } as unknown as JsonObject;
    if (checkpoint.evidence.clarificationGrounding && input.resume?.answer.kind === "legacy") {
      const grounding = checkpoint.evidence.clarificationGrounding;
      await repository.completeClarificationGrounding({ clarificationId: input.resume.answer.evidence.clarificationId,
        groundedNormalizedRepresentation: grounding.normalizedValue as JsonObject,
        safetySignals: [grounding.clarificationSafety as JsonObject] });
    }
    if (checkpoint.finalState === "purchase_ready") {
      for (const definition of upstream) await skip(definition);
      await repository.finalizePurchaseReadyPreparation({ runId, requestId, returnedModel, policyResult: snapshot, completedAt: now(), ...checkpoint.usage });
      return { checkpoint, disposition: "purchase_ready" };
    }
    if (checkpoint.finalState === "clarification" && !input.resume && checkpoint.clarification) {
      for (const definition of upstream) await skip(definition);
      const specification = checkpoint.evidence.inputSufficiency?.clarification as JsonObject | undefined;
      if (!specification || typeof specification.code !== "string") throw new M2RuntimeError("PRODUCTION_CLARIFICATION_STATE_INVALID");
      const id = createOpaqueClarificationIdV1();
      const clarification = { opaqueClarificationId: id, questionCode: specification.code, target: checkpoint.clarification.target,
        question: checkpoint.clarification.question, maximumQuestionsTotal: 1 as const, questionsAlreadyUsed: 0 as const, questionsRemaining: 1 as const };
      await repository.finalizeNeedsMoreInformation({ runId, requestId, returnedModel, policyResult: snapshot, resultJson: snapshot,
        completedAt: now(), ...checkpoint.usage, clarification: { schemaVersion: "m2-p4-assessment-clarification-v1", id, requestId,
          ordinal: 1, questionCode: clarification.questionCode,
          target: clarification.target as Parameters<AssessmentRepository["finalizeNeedsMoreInformation"]>[0]["clarification"]["target"],
          questionSnapshot: clarification.question, provenance: "user_clarification", sourceIdentity: clarificationSourceIdentityV1(id), createdAt: now() } });
      return { checkpoint, disposition: "needs_more_information", clarification };
    }
    const disposition = checkpoint.stopFinding === "SAFETY_CLASSIFICATION_NOT_NORMAL" ? "safety_blocked"
      : checkpoint.stopFinding === "V19_L5_INPUT_NOT_SUFFICIENT" && checkpoint.evidence.inputSufficiency?.state === "not_full_product_candidate"
        ? "not_full_product_candidate" : null;
    if (!disposition) throw new M2RuntimeError(checkpoint.stopFinding ?? "PRODUCTION_PREPARATION_EXECUTION_FAILED");
    for (const definition of upstream) await skip(definition, true);
    await repository.completeRun({ runId, requestId, returnedModel, eligibility: disposition, decision: null,
      resultJson: snapshot, completedAt: now(), ...checkpoint.usage });
    return { checkpoint, disposition };
  } catch (error) {
    const safe = asM2RuntimeError(error);
    await repository.failRun({ runId, requestId, returnedModel: null, errorCode: safe.safeCode, completedAt: now(), ...(checkpoint?.usage ?? emptyUsageTotals()) });
    throw safe;
  }
}
