import { randomUUID } from "node:crypto";
import { hashJson } from "../runtime/hash.ts";
import { M2RuntimeError, asM2RuntimeError } from "../runtime/errors.ts";
import { loadV19L5StageCatalog } from "../runtime/v19-l5-stage-catalog.ts";
import { V19L5LocalApplication } from "../runtime/v19-l5-application.ts";
import type { AssessmentRepository, AiStageTransport, StageRequest, StageResponse, JsonObject } from "../runtime/types.ts";
import type { V19L5PurchaseReadyAuthority } from "./recovery-candidate.ts";

/** Paid entry into the existing candidate application. Upstream is immutable
 * checkpoint replay; actual paid stage requests and outputs use the same durable
 * runtime records as V17. No selector or environmental setting is changed. */
export async function fulfillV19PaidCandidate(input: {
  authority: V19L5PurchaseReadyAuthority; requestId: string; runId: string;
  repository: AssessmentRepository; transport: AiStageTransport;
  now: () => string; timeZone: string;
  actionNow?: string;
  beforeInvocation: (request: StageRequest, attempt: 1 | 2) => Promise<void>;
}) {
  const { repository, authority, runId, requestId, now } = input;
  if (!repository.finalizeRecoveryCandidate) throw new M2RuntimeError("PRODUCTION_RECOVERY_EXECUTOR_UNAVAILABLE");
  await repository.createRun({ id: runId, requestId, requestedModel: authority.runtimeIdentity.model, promptBundleVersion: authority.runtimeIdentity.promptBundleVersion,
    schemaSetVersion: authority.runtimeIdentity.schemaSetVersion, stageTopologyVersion: authority.runtimeIdentity.stageTopologyVersion, runKind: "fulfillment_resume", startedAt: now() });
  const catalog = await loadV19L5StageCatalog(), attempts = new Map<string, number>();
  const transport: AiStageTransport = { invoke: async (request) => {
    const attempt = ((attempts.get(request.stageId) ?? 0) + 1) as 1 | 2; attempts.set(request.stageId, attempt);
    const id = randomUUID(), definition = catalog.definitions.find(def => def.stageId === request.stageId)!;
    await repository.startStage({ id, runId, stageId: request.stageId, sequenceNumber: definition.sequenceNumber, attemptNumber: attempt,
      requestHash: hashJson(request as unknown as JsonObject), inputJson: request.input, promptHash: request.promptHash, schemaHash: request.schemaHash, requestedModel: request.model, createdAt: now() });
    let response: StageResponse | null = null;
    try {
      await input.beforeInvocation(request, attempt);
      response = await input.transport.invoke(request);
      await repository.completeStage({ stageRunId: id, responseId: response.responseId, returnedModel: response.returnedModel, outputJson: response.output, usage: response.usage, latencyMs: response.latencyMs });
      return response;
    } catch (error) {
      const safe = asM2RuntimeError(error);
      await repository.failStage({ stageRunId: id, responseId: response?.responseId ?? null, returnedModel: response?.returnedModel ?? null,
        outputJson: response?.output ?? null, errorCode: safe.safeCode, usage: response?.usage ?? { inputTokens: 0, cachedTokens: 0, outputTokens: 0, reasoningTokens: 0 }, latencyMs: response?.latencyMs ?? 0 });
      throw safe;
    }
  } };
  const result = await new V19L5LocalApplication({ catalog, transport, now: input.actionNow ? () => input.actionNow! : now, timeZone: input.timeZone }).fulfillPrepared(authority.checkpoint);
  if (result.finalState !== "completed") {
    await repository.failRun({ runId, requestId, returnedModel: null, errorCode: result.stopFinding ?? "PRODUCTION_CANDIDATE_NOT_COMPLETED", completedAt: now(), ...result.usage });
    throw new M2RuntimeError(result.stopFinding ?? "PRODUCTION_CANDIDATE_NOT_COMPLETED");
  }
  await repository.finalizeRecoveryCandidate({ reportId: randomUUID(), runId, requestId, reportJson: { schemaVersion: "v19-l5-persisted-result-v1", result: result as unknown as JsonObject },
    decisionCardJson: result.decisionResult?.decisionCard as unknown as JsonObject ?? {}, decision: result.decisionResult?.decision ?? null, usage: result.usage, completedAt: now() });
  return runId;
}
