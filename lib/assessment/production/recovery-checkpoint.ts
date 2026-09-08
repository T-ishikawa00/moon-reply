import { isDeepStrictEqual } from "node:util";
import { hashJson } from "../runtime/hash.ts";
import { validateStageOutput } from "../runtime/validation.ts";
import { isRecoveryActionClockCurrent, type PaidPurchaseAuthority, type PaidStageCheckpoint } from "./recovery-candidate.ts";
import type { AiStageTransport, JsonObject, StageDefinition } from "../runtime/types.ts";

/** Replay only successful persisted stages whose full reconstructed input,
 * prompt/schema and request hash still agree. A missing/ambiguous stage invokes
 * the paid budget transport normally. No attempt or reservation is reset. */
export function createPaidCheckpointTransport(input: { checkpoint: PaidStageCheckpoint | null; authority: PaidPurchaseAuthority; requestId: string; now: string; definitions: StageDefinition[]; transport: AiStageTransport }) {
  const checkpoint = input.checkpoint, identity = input.authority.runtimeIdentity;
  const first = checkpoint?.stages.find(stage => stage.stageId === "PB-04" && stage.attemptNumber === 1 && stage.status === "completed");
  const actionClock = first?.inputJson?.action_context as JsonObject | undefined;
  if (!checkpoint || checkpoint.requestId !== input.requestId || checkpoint.model !== identity.model || checkpoint.promptBundleVersion !== identity.promptBundleVersion ||
    checkpoint.schemaSetVersion !== identity.schemaSetVersion || checkpoint.stageTopologyVersion !== identity.stageTopologyVersion || !isRecoveryActionClockCurrent(actionClock, input.now)) return { transport: input.transport, actionNow: input.now };
  const attempts = new Map<string, number>();
  const transport: AiStageTransport = { invoke: async request => {
    const attempt = (attempts.get(request.stageId) ?? 0) + 1; attempts.set(request.stageId, attempt);
    const stage = checkpoint.stages.find(saved => saved.stageId === request.stageId && saved.attemptNumber === attempt && saved.status === "completed");
    const definition = input.definitions.find(def => def.stageId === request.stageId);
    if (stage && definition && stage.inputJson && stage.outputJson && stage.returnedModel === request.model && stage.promptHash === request.promptHash && stage.schemaHash === request.schemaHash && isDeepStrictEqual(stage.inputJson, request.input)) {
      const expected = identity.promptBundleVersion === "prompt-bundle-runtime-v23.0.0" ? hashJson(request as unknown as JsonObject) : hashJson({ stageId: request.stageId, model: request.model,
        promptHash: request.promptHash, schemaHash: request.schemaHash, attemptNumber: attempt, ...(definition.groundedSchemaHash ? { groundedSchemaHash: definition.groundedSchemaHash } : {}), input: request.input });
      if (expected === stage.requestHash) {
        validateStageOutput(definition, stage.outputJson);
        return { responseId: stage.id, returnedModel: request.model, output: structuredClone(stage.outputJson), usage: { inputTokens: 0, cachedTokens: 0, outputTokens: 0, reasoningTokens: 0 }, latencyMs: 0 };
      }
    }
    return input.transport.invoke(request);
  } };
  return { transport, actionNow: actionClock!.trusted_now_iso as string };
}
