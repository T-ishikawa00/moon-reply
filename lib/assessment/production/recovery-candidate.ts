import { isDeepStrictEqual } from "node:util";
import { M2RuntimeError } from "../runtime/errors.ts";
import { canonicalizeJson, hashJson } from "../runtime/hash.ts";
import { validateStageOutput } from "../runtime/validation.ts";
import { loadM2P4FinalProductRecoveryRuntimeStageCatalog } from "../runtime/schema-catalog.ts";
import { loadV19L5StageCatalog } from "../runtime/v19-l5-stage-catalog.ts";
import { V19L5LocalApplication, type V19L5Result } from "../runtime/v19-l5-application.ts";
import { projectV19L5Message, type V19L5MessageProjection } from "../runtime/v19-l5-customer-projection.ts";
import { projectCustomerAssessmentExperienceV2, type CustomerAssessmentExperienceProjectionV2 } from "../runtime/customer-assessment-experience-projection-v2.ts";
import { hydratePersistedReadyAssessmentV1 } from "../runtime/runtime-result-normalization-v1.ts";
import { evaluateSemanticFindingsV7 } from "../runtime/semantic-disposition-v7.ts";
import { projectSplitDecisionFacts } from "../runtime/v19-l5-plan-validation.ts";
import type { AssessmentInput, JsonObject, PurchaseReadyRuntimeAuthorityV1, StageRequest, StageResponse, UsageTotals, SplitRuntimeReportV1 } from "../runtime/types.ts";
import type { CandidateEnvelopeV1 } from "../runtime/contracts/split-stage-contracts-v1.ts";
import { reconstructLegacyV17Evidence } from "./legacy-v17-evidence-replay.ts";
import { validateProductSemanticShapeV1 } from "../runtime/product-semantic-shape-v1.ts";
import { evaluateDraftSourceIntegrityV2 } from "../runtime/draft-source-integrity-v2.ts";
import { evaluateCustomerSurfaceIntegrityV1 } from "../runtime/customer-surface-integrity-v1.ts";
import { evaluateSelectedRequestProductCompletenessV2 } from "../runtime/selected-request-product-completeness-v2.ts";

export type V19L5PurchaseReadyAuthority = {
  schemaVersion: "v19-l5-purchase-ready-authority-v1";
  runtimeIdentity: { model: "gpt-5.6-luna"; promptBundleVersion: "prompt-bundle-runtime-v23.0.0"; schemaSetVersion: "pipeline-schema-runtime-v9.0.0"; stageTopologyVersion: "split-base-candidate-v1" };
  request: AssessmentInput;
  checkpoint: V19L5Result;
};
export type PaidPurchaseAuthority = PurchaseReadyRuntimeAuthorityV1 | V19L5PurchaseReadyAuthority;
export type PaidMessageProjection = V19L5MessageProjection & { projectionSchemaVersion: "v19-l5-message-projection-v1" };
export type PaidCanonicalProjection = CustomerAssessmentExperienceProjectionV2 | PaidMessageProjection;
export type RecoveryStageEvidence = {
  id: string; stageId: string; attemptNumber: number; status: string;
  inputJson: JsonObject | null; outputJson: JsonObject | null;
  promptHash: string; schemaHash: string; requestHash: string; returnedModel: string | null;
};
export type RecoveryCandidate = {
  startedAt?: string;
  request?: import("../runtime/types.ts").PersistedAssessmentRequest;
  runId: string; requestId: string; model: string; promptBundleVersion: string; schemaSetVersion: string; stageTopologyVersion: string;
  reportJson: JsonObject; decisionCardJson: JsonObject; decision: string | null; usage: UsageTotals;
  stages: RecoveryStageEvidence[];
};
export type PaidStageCheckpoint = Pick<RecoveryCandidate, "runId" | "requestId" | "model" | "promptBundleVersion" | "schemaSetVersion" | "stageTopologyVersion" | "stages">;
export type RecoveryCandidateAttestation = {
  runtimeRunId: string; reportHash: string; validationHash: string;
  reportJson: JsonObject; validationStageId: string; validationInput: JsonObject; validationOutput: JsonObject;
  validationRequestHash: string;
  reconstructedLegacyInput: boolean;
  validationProof: string;
};
export const PAID_RECOVERY_VALIDATION_POLICY_VERSION = "paid-recovery-validation-v1" as const;
function check(value: unknown, code = "PRODUCTION_RECOVERY_CANDIDATE_INVALID"): asserts value {
  if (!value) throw new M2RuntimeError(code);
}
export function verifyPaidAuthority(authority: PaidPurchaseAuthority, request: AssessmentInput) {
  check(isDeepStrictEqual(authority.request, request), "PRODUCTION_RECOVERY_INPUT_MISMATCH");
  const identity = authority.runtimeIdentity;
  const v17 = authority.schemaVersion === "rc1-purchase-ready-runtime-authority-v1";
  check((v17 || authority.schemaVersion === "v19-l5-purchase-ready-authority-v1") &&
    identity.model === "gpt-5.6-luna" && identity.stageTopologyVersion === "split-base-candidate-v1" &&
    identity.promptBundleVersion === (v17 ? "prompt-bundle-runtime-v17.0.0" : "prompt-bundle-runtime-v23.0.0") &&
    identity.schemaSetVersion === (v17 ? "pipeline-schema-runtime-v6.0.0" : "pipeline-schema-runtime-v9.0.0"), "PRODUCTION_RECOVERY_EXECUTOR_UNAVAILABLE");
  if (!v17) {
    const resume = authority.checkpoint.evidence.preparationResume;
    const effectiveInput = structuredClone(request);
    if (resume) {
      check(isDeepStrictEqual(resume.initialCheckpoint.evidence.input, request) &&
        resume.initialCheckpoint.evidence.inputHash === hashJson(request), "PRODUCTION_RECOVERY_INPUT_MISMATCH");
      if (resume.answer.kind === "original_message") {
        check(resume.answer.answerFingerprint === hashJson({ original_message: resume.answer.originalMessage }), "PRODUCTION_RECOVERY_INPUT_MISMATCH");
        effectiveInput.optionalMessage = resume.answer.originalMessage;
      }
    }
    check(authority.checkpoint.finalState === "purchase_ready" &&
      isDeepStrictEqual(authority.checkpoint.evidence.input, effectiveInput) &&
      authority.checkpoint.evidence.inputHash === hashJson(effectiveInput), "PRODUCTION_RECOVERY_CHECKPOINT_INVALID");
  }
}
export async function prepareV19L5PaidCandidate(input: AssessmentInput, options: ConstructorParameters<typeof V19L5LocalApplication>[0]): Promise<V19L5PurchaseReadyAuthority> {
  const checkpoint = await new V19L5LocalApplication(options).prepare(input);
  check(checkpoint.finalState === "purchase_ready", "PRODUCTION_CANDIDATE_NOT_PURCHASE_READY");
  return { schemaVersion: "v19-l5-purchase-ready-authority-v1", runtimeIdentity: { model: "gpt-5.6-luna", promptBundleVersion: "prompt-bundle-runtime-v23.0.0", schemaSetVersion: "pipeline-schema-runtime-v9.0.0", stageTopologyVersion: "split-base-candidate-v1" }, request: structuredClone(input), checkpoint };
}
export async function validateRecoveryCandidate(candidate: RecoveryCandidate, authority: PaidPurchaseAuthority, requestId: string, now: string): Promise<{ projection: PaidCanonicalProjection; attestation: RecoveryCandidateAttestation }> {
  const originalReport = structuredClone(candidate.reportJson);
  const identity = authority.runtimeIdentity;
  check(candidate.requestId === requestId && candidate.model === identity.model && candidate.promptBundleVersion === identity.promptBundleVersion && candidate.schemaSetVersion === identity.schemaSetVersion && candidate.stageTopologyVersion === identity.stageTopologyVersion);
  const v19 = authority.schemaVersion === "v19-l5-purchase-ready-authority-v1";
  const reconstructedLegacyInput = !v19 && candidate.stages.some(stage => stage.stageId === "PB-06" && stage.inputJson === null);
  if (reconstructedLegacyInput && authority.schemaVersion === "rc1-purchase-ready-runtime-authority-v1") candidate = await reconstructLegacyV17Evidence(candidate, authority);
  const loaded = v19 ? await loadV19L5StageCatalog() : await loadM2P4FinalProductRecoveryRuntimeStageCatalog();
  const storedCandidate = v19 ? candidate.reportJson.result as unknown as V19L5Result : null;
  const matchesReport = (stage: RecoveryStageEvidence) => v19
    ? storedCandidate?.answerMode === "message_only"
      ? isDeepStrictEqual(stage.inputJson?.message_plan, storedCandidate.messageResult?.plan) && isDeepStrictEqual(stage.inputJson?.message_content, storedCandidate.messageResult?.content)
      : isDeepStrictEqual(stage.inputJson?.decision_plan, storedCandidate?.decisionResult?.report.decisionPlan) && isDeepStrictEqual(stage.inputJson?.report_content, storedCandidate?.decisionResult?.report.content)
    : isDeepStrictEqual(stage.inputJson?.decision_plan, candidate.reportJson.decisionPlan) && isDeepStrictEqual(stage.inputJson?.report_content, candidate.reportJson.content);
  const validations = candidate.stages.filter(stage => stage.stageId === "PB-06" && matchesReport(stage)).sort((a, b) => b.attemptNumber - a.attemptNumber);
  // A later transport failure with no judgment cannot invalidate a previously
  // verified immutable artifact. A later actual judgment about the same artifact
  // must be considered, even if its stage was marked failed by the material gate.
  const validation = validations.find(stage => stage.outputJson !== null), definition = loaded.definitions.find(def => def.stageId === "PB-06")!;
  check(validation && validation.status === "completed" && validation.inputJson && validation.outputJson && validation.returnedModel === identity.model &&
    validation.promptHash === definition.promptHash && validation.schemaHash === definition.schemaHash, "PRODUCTION_RECOVERY_VALIDATION_EVIDENCE_REQUIRED");
  validateStageOutput(definition, validation.outputJson);
  const actionClock = validation.inputJson.action_context as JsonObject;
  check(isRecoveryActionClockCurrent(actionClock, now), "PRODUCTION_RECOVERY_CANDIDATE_TEMPORAL_REVIEW_REQUIRED");
  let projection: PaidCanonicalProjection;
  if (v19) {
    const stored = candidate.reportJson.result as unknown as V19L5Result;
    check(candidate.reportJson.schemaVersion === "v19-l5-persisted-result-v1" && stored?.finalState === "completed");
    const action = validation.inputJson.action_context as JsonObject;
    check(action && typeof action.trusted_now_iso === "string" && typeof action.time_zone === "string");
    const cursors = new Map<string, number>();
    const replay = await new V19L5LocalApplication({ catalog: await loadV19L5StageCatalog(), now: () => action.trusted_now_iso as string, timeZone: action.time_zone as string,
      transport: { invoke: async (q: StageRequest): Promise<StageResponse> => {
        const attempt = (cursors.get(q.stageId) ?? 0) + 1; cursors.set(q.stageId, attempt);
        const row = candidate.stages.find(stage => stage.stageId === q.stageId && stage.attemptNumber === attempt);
        check(row && row.outputJson && isDeepStrictEqual(row.inputJson, q.input) && row.requestHash === hashJson(q) && row.promptHash === q.promptHash && row.schemaHash === q.schemaHash && row.returnedModel === q.model);
        return { responseId: row.id, returnedModel: q.model, output: row.outputJson, usage: { inputTokens: 0, cachedTokens: 0, outputTokens: 0, reasoningTokens: 0 }, latencyMs: 0 };
      } },
    }).fulfillPrepared(authority.checkpoint);
    check(replay.finalState === "completed" && replay.answerMode === stored.answerMode && isDeepStrictEqual(replay.messageResult, stored.messageResult) && isDeepStrictEqual(replay.decisionResult?.report, stored.decisionResult?.report), "PRODUCTION_RECOVERY_MATERIAL_DELIVERY_BLOCKED");
    projection = replay.answerMode === "message_only" ? { projectionSchemaVersion: "v19-l5-message-projection-v1", ...projectV19L5Message(replay) }
      : projectCustomerAssessmentExperienceV2({ ...replay.decisionResult!, requestId, runId: candidate.runId, duplicate: false }, authority.request.requestedTopics);
  } else {
    check(validation.requestHash === hashJson({ stageId: definition.stageId, model: identity.model, promptHash: definition.promptHash,
      schemaHash: definition.schemaHash, attemptNumber: validation.attemptNumber,
      ...(definition.groundedSchemaHash ? { groundedSchemaHash: definition.groundedSchemaHash } : {}), input: validation.inputJson }), "PRODUCTION_RECOVERY_VALIDATION_BINDING_MISMATCH");
    const ready = hydratePersistedReadyAssessmentV1({ requestId, runId: candidate.runId, decision: candidate.decision, reportJson: candidate.reportJson, decisionCardJson: candidate.decisionCardJson, authoritativeRequestedTopics: authority.request.requestedTopics, usage: candidate.usage });
    const report = ready.report as SplitRuntimeReportV1;
    check(isDeepStrictEqual(validation.inputJson.decision_plan, report.decisionPlan) && isDeepStrictEqual(validation.inputJson.report_content, report.content) &&
      isDeepStrictEqual(validation.inputJson.base_structured_intake, authority.baseStructuredIntake) && isDeepStrictEqual(validation.inputJson.candidate_envelope, authority.candidateEnvelope));
    validateProductSemanticShapeV1({ decisionPlan: report.decisionPlan, reportContent: report.content });
    const candidateEnvelope = authority.candidateEnvelope as unknown as CandidateEnvelopeV1;
    const localDefects = [
      ...evaluateDraftSourceIntegrityV2({ candidateEnvelope, optionalMessage: authority.request.optionalMessage,
        requestedTopics: authority.request.requestedTopics, decisionPolicy: validation.inputJson.decision_policy_result as unknown as Parameters<typeof evaluateDraftSourceIntegrityV2>[0]["decisionPolicy"], decisionPlan: report.decisionPlan }),
      ...evaluateCustomerSurfaceIntegrityV1({ decisionPlan: report.decisionPlan, reportContent: report.content }),
      ...evaluateSelectedRequestProductCompletenessV2({ requestedTopics: authority.request.requestedTopics, candidateEnvelope,
        effectiveDecisionPolicy: validation.inputJson.effective_decision_policy_result as unknown as Parameters<typeof evaluateSelectedRequestProductCompletenessV2>[0]["effectiveDecisionPolicy"], decisionPlan: report.decisionPlan, reportContent: report.content }).defects,
    ];
    check(localDefects.length === 0, "PRODUCTION_RECOVERY_MATERIAL_DELIVERY_BLOCKED");
    const disposition = evaluateSemanticFindingsV7({ validationOutput: validation.outputJson, decisionPlan: report.decisionPlan, groundedReportContent: report.content,
      decisionFacts: projectSplitDecisionFacts(authority.baseStructuredIntake, authority.candidateEnvelope as unknown as CandidateEnvelopeV1) });
    check(disposition.findingDispositions.every(f => f.disposition === "ignored" || f.finding.severity === "minor" && ["BRAND_TONE", "TEMPLATE_GENERICITY", "REPETITION"].includes(String(f.finding.finding_code))), "PRODUCTION_RECOVERY_MATERIAL_DELIVERY_BLOCKED");
    projection = projectCustomerAssessmentExperienceV2(ready, authority.request.requestedTopics);
  }
  check(isDeepStrictEqual(candidate.reportJson, originalReport), "PRODUCTION_RECOVERY_CANDIDATE_MUTATED");
  const validationEvidence = { policyVersion: PAID_RECOVERY_VALIDATION_POLICY_VERSION, input: validation.inputJson, output: validation.outputJson, promptHash: validation.promptHash, schemaHash: validation.schemaHash };
  return { projection, attestation: { runtimeRunId: candidate.runId, reportHash: hashJson(candidate.reportJson), validationHash: hashJson(validationEvidence), reportJson: candidate.reportJson, validationStageId: validation.id, validationInput: validation.inputJson, validationOutput: validation.outputJson,
    validationRequestHash: validation.requestHash, reconstructedLegacyInput, validationProof: canonicalizeJson(validationEvidence) } };
}

export function isRecoveryActionClockCurrent(actionClock: JsonObject | null | undefined, now: string) {
  if (!actionClock || typeof actionClock.trusted_now_iso !== "string" || typeof actionClock.time_zone !== "string") return false;
  const original = Date.parse(actionClock.trusted_now_iso), current = Date.parse(now), elapsed = current - original;
  if (!Number.isFinite(elapsed) || elapsed < 0 || elapsed > 60 * 60_000) return false;
  try {
    const formatter = new Intl.DateTimeFormat("en-CA", { timeZone: actionClock.time_zone, year: "numeric", month: "2-digit", day: "2-digit" });
    return formatter.format(original) === formatter.format(current);
  } catch { return false; }
}
