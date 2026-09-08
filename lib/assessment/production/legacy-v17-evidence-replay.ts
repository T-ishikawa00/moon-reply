import { isDeepStrictEqual } from "node:util";
import { AssessmentPipeline } from "../runtime/pipeline.ts";
import { hashJson } from "../runtime/hash.ts";
import { M2RuntimeError } from "../runtime/errors.ts";
import { loadM2P4FinalProductRecoveryRuntimeStageCatalog } from "../runtime/schema-catalog.ts";
import type { AssessmentRepository, PurchaseReadyRuntimeAuthorityV1 } from "../runtime/types.ts";
import type { RecoveryCandidate } from "./recovery-candidate.ts";

/** Read-only validation journal, not an executor or recovery mock. The real
 * pipeline recomputes its inputs/grounding/material gates using only retained
 * stage outputs. Every reconstructed request must match its original durable
 * hash. No DB row, previous validation or historical report is rewritten. */
export async function reconstructLegacyV17Evidence(candidate: RecoveryCandidate, authority: PurchaseReadyRuntimeAuthorityV1): Promise<RecoveryCandidate> {
  if (!candidate.startedAt || !candidate.request) throw new M2RuntimeError("PRODUCTION_RECOVERY_VALIDATION_EVIDENCE_REQUIRED");
  const reconstructed = structuredClone(candidate), catalog = await loadM2P4FinalProductRecoveryRuntimeStageCatalog();
  const counts = new Map<string, number>();
  const noop = async () => {};
  const forbidden = async (): Promise<never> => { throw new M2RuntimeError("PRODUCTION_RECOVERY_EVIDENCE_REPLAY_SCOPE_INVALID"); };
  const journal: AssessmentRepository = {
    createRequest: forbidden, findByIdempotencyKey: forbidden, createRun: noop, startStage: noop,
    completeStage: noop, failStage: noop, skipStage: noop, completeRun: noop,
    finalizeNeedsMoreInformation: forbidden, finalizePurchaseReadyPreparation: forbidden,
    findClarificationById: forbidden, findClarificationByRequestId: forbidden,
    acceptClarificationAndCreateResumeRun: forbidden, completeClarificationGrounding: forbidden,
    getInitialAuthorityForResume: forbidden, failRun: noop, finalizeCompletedAssessment: noop,
    getCompletedAssessment: forbidden, getAssessmentResult: forbidden,
  };
  const result = await new AssessmentPipeline({ repository: journal, definitions: catalog.definitions,
    strictMaterialDelivery: true, now: () => candidate.startedAt!, timeZone: "Asia/Tokyo", beforeProviderInvocation: noop,
    transport: { invoke: async request => {
      const attempt = (counts.get(request.stageId) ?? 0) + 1; counts.set(request.stageId, attempt);
      const stage = reconstructed.stages.find(row => row.stageId === request.stageId && row.attemptNumber === attempt);
      const definition = catalog.definitions.find(row => row.stageId === request.stageId)!;
      const expectedHash = hashJson({ stageId: request.stageId, model: request.model, promptHash: request.promptHash, schemaHash: request.schemaHash,
        attemptNumber: attempt, ...(definition.groundedSchemaHash ? { groundedSchemaHash: definition.groundedSchemaHash } : {}), input: request.input });
      if (!stage || !stage.outputJson || stage.requestHash !== expectedHash || stage.promptHash !== request.promptHash || stage.schemaHash !== request.schemaHash || stage.returnedModel !== request.model ||
        stage.inputJson !== null && !isDeepStrictEqual(stage.inputJson, request.input)) throw new M2RuntimeError("PRODUCTION_RECOVERY_VALIDATION_BINDING_MISMATCH");
      stage.inputJson = structuredClone(request.input);
      return { responseId: stage.id, returnedModel: request.model, output: structuredClone(stage.outputJson), usage: { inputTokens: 0, cachedTokens: 0, outputTokens: 0, reasoningTokens: 0 }, latencyMs: 0 };
    } },
  }).fulfillPrepared(candidate.request, authority, { requestId: candidate.requestId, runId: candidate.runId, startedAt: candidate.startedAt,
    model: "gpt-5.6-luna", promptBundleVersion: "prompt-bundle-runtime-v17.0.0", schemaSetVersion: "pipeline-schema-runtime-v6.0.0" });
  if (result.eligibility !== "ready" || !isDeepStrictEqual(result.report, candidate.reportJson) || !isDeepStrictEqual(result.decisionCard, candidate.decisionCardJson)) {
    throw new M2RuntimeError("PRODUCTION_RECOVERY_CANDIDATE_INVALID");
  }
  return reconstructed;
}
