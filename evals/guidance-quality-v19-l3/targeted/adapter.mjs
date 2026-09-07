// Targeted evaluation adapter only. Replays fixed upstream synthetic receipts
// through the existing Application and captures PB05/PB06 before any response.
// No live transport, Provider client, credentials, DB or runtime modifications.
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { isDeepStrictEqual } from "node:util";
import { AssessmentApplication } from "../../../lib/assessment/runtime/application.ts";
import { FakeAssessmentRepository, FakeAiStageTransport } from "../../../lib/assessment/runtime/fakes.ts";
import { M2RuntimeError } from "../../../lib/assessment/runtime/errors.ts";

const root = fileURLToPath(new URL("../../../", import.meta.url));
const sourceRun = "evals/guidance-quality-v19-l2/runs/2026-09-07-authorized-pilot8-v19-l2";
const sourceSession = `${sourceRun}/internal/72e7a601-b626-4544-b40f-1d90574c3450`;
const captureCode = "GQ29_TARGET_STAGE_REQUEST_CAPTURED";
const stageOrder = ["PB-01", "PB-02", "PB-03", "PB-04", "PB-05", "PB-06"];
const sha = value => createHash("sha256").update(value).digest("hex");
const jsonHash = value => sha(JSON.stringify(value));
const read = relative => JSON.parse(readFileSync(path.join(root, relative), "utf8"));
const requireCondition = (condition, code) => { if (!condition) throw new M2RuntimeError(code); };
const equal = (actual, expected, code) => requireCondition(isDeepStrictEqual(actual, expected), code);

/**
 * Return fixed GQ29-P3 input, only PB01..PB04 outputs, the original PB05 input,
 * frozen application time and hashes. Does not return source arm/version/map,
 * old PB05 text, evaluator findings, reviewer labels or editorial examples.
 */
export function loadFixedUpstream() {
  requireCondition(path.resolve(process.cwd()) === path.resolve(root), "GQ29_ADAPTER_WRONG_CHECKOUT");
  const files = {
    fixedInputs: "evals/guidance-quality-wave1/pilot-inputs.json",
    pb01Request: `${sourceSession}/call-096-request.json`,
    pb01Response: `${sourceSession}/call-096-response.json`,
    pb02Response: `${sourceSession}/call-099-response.json`,
    pb03Response: `${sourceSession}/call-102-response.json`,
    pb04Response: `${sourceSession}/call-105-response.json`,
    originalPb05Request: `${sourceSession}/call-108-request.json`,
    timingManifest: `${sourceRun}/internal/manifest.json`,
  };
  const allInputs = read(files.fixedInputs), selected = allInputs.cases.filter(c => c.id === "GQ-29-P3");
  requireCondition(selected.length === 1, "GQ29_FIXED_CASE_MISSING_OR_DUPLICATED");
  const request = structuredClone(selected[0].input);
  equal(Object.keys(request).sort(), ["currentSituation", "optionalMessage", "relationship", "requestedTopics"], "GQ29_FIXED_INPUT_KEYS_CHANGED");
  equal(request.requestedTopics, ["decide_send_or_wait", "next_three_days"], "GQ29_FIXED_REQUESTED_TOPICS_CHANGED");
  equal(request.optionalMessage, null, "GQ29_FIXED_CANDIDATE_MESSAGE_CHANGED");
  const savedInitialRequest = read(files.pb01Request);
  equal(savedInitialRequest.input, { run_mode: "initial_base", base_provider_input: {
    current_situation: request.currentSituation, relationship: request.relationship, requested_topics: request.requestedTopics,
  } }, "GQ29_FIXED_INPUT_RECEIPT_MISMATCH");
  const outputs = {};
  for (const [stageId, file] of [["PB-01", files.pb01Response], ["PB-02", files.pb02Response], ["PB-03", files.pb03Response], ["PB-04", files.pb04Response]]) {
    const receipt = read(file);
    equal(receipt.stageId, stageId, "GQ29_FROZEN_UPSTREAM_STAGE_MISMATCH");
    equal(receipt.attempt, 1, "GQ29_FROZEN_UPSTREAM_NOT_INITIAL_ATTEMPT");
    equal(receipt.status, "completed", "GQ29_FROZEN_UPSTREAM_RESPONSE_INCOMPLETE");
    equal(receipt.returnedModel, "gpt-5.6-luna", "GQ29_FROZEN_UPSTREAM_MODEL_MISMATCH");
    equal(receipt.serviceTier, "default", "GQ29_FROZEN_UPSTREAM_TIER_MISMATCH");
    requireCondition(typeof receipt.outputText === "string", "GQ29_FROZEN_UPSTREAM_OUTPUT_MISSING");
    outputs[stageId] = JSON.parse(receipt.outputText);
  }
  const originalPb05 = read(files.originalPb05Request);
  equal(originalPb05.stageId, "PB-05", "GQ29_FROZEN_PB05_STAGE_MISMATCH");
  equal(originalPb05.attempt, 1, "GQ29_FROZEN_PB05_NOT_INITIAL_ATTEMPT");
  const originalPB05Input = structuredClone(originalPb05.input);
  equal(originalPB05Input.quality_reassessment_directive, null, "GQ29_FROZEN_PB05_HAS_REASSESSMENT");
  equal(originalPB05Input.decision_plan, outputs["PB-04"], "GQ29_FROZEN_CANONICAL_PLAN_MISMATCH");
  equal(originalPB05Input.candidate_envelope.presence, false, "GQ29_FROZEN_CANDIDATE_ENVELOPE_CHANGED");
  const manifest = read(files.timingManifest);
  equal(manifest.model, "gpt-5.6-luna", "GQ29_SOURCE_MODEL_MISMATCH");
  equal(manifest.generation.reasoningEffort, "low", "GQ29_SOURCE_REASONING_MISMATCH");
  equal(manifest.generation.serviceTier, "default", "GQ29_SOURCE_TIER_MISMATCH");
  equal(manifest.generation.timeZone, "Asia/Tokyo", "GQ29_SOURCE_TIMEZONE_MISMATCH");
  const frozenNow = manifest.generation.frozenApplicationNow;
  requireCondition(typeof frozenNow === "string" && Number.isFinite(Date.parse(frozenNow)), "GQ29_FROZEN_TIME_INVALID");
  const hashes = {
    sourceFileBytes: Object.fromEntries(Object.entries(files).map(([label, file]) => [label, sha(readFileSync(path.join(root, file)))])),
    request: jsonHash(request), outputs: jsonHash(outputs), originalPB05Input: jsonHash(originalPB05Input),
    plan: jsonHash(originalPB05Input.decision_plan), frozenNow: jsonHash(frozenNow),
  };
  return { request, outputs, originalPB05Input, frozenNow, hashes };
}

/**
 * @param {object} catalog Exact caller-authorized L2 or L3 catalog.
 * @param {object} upstream The unchanged return value of loadFixedUpstream().
 * @param {"PB-05"|"PB-06"} stageId Capture target; never evaluates that stage.
 * @param {object} [newRawReport] Only a newly received PB05 output for PB06 capture.
 * @returns {Promise<object>} {disposition, request, captureChecks, localValidation}
 * A pre-target Application validation error returns request:null and its safe
 * code. No empty evaluator output is substituted and no repair is invoked.
 */
export async function captureStageRequest(catalog, upstream, stageId, newRawReport) {
  requireCondition(["PB-05", "PB-06"].includes(stageId), "GQ29_CAPTURE_TARGET_FORBIDDEN");
  requireCondition(["runtime-stage-catalog-v20.0.0", "runtime-stage-catalog-v21.0.0"].includes(catalog.catalogVersion), "GQ29_CAPTURE_CATALOG_FORBIDDEN");
  equal(catalog.schemaSetVersion, "pipeline-schema-runtime-v6.0.0", "GQ29_CAPTURE_SCHEMA_SET_MISMATCH");
  if (stageId === "PB-05") requireCondition(newRawReport === undefined, "GQ29_PB05_CAPTURE_REPORT_INPUT_FORBIDDEN");
  else requireCondition(newRawReport !== null && typeof newRawReport === "object" && !Array.isArray(newRawReport), "GQ29_NEW_RAW_REPORT_REQUIRED");
  for (const field of ["request", "outputs", "originalPB05Input", "frozenNow"]) equal(jsonHash(upstream[field]), upstream.hashes[field], "GQ29_FIXED_UPSTREAM_MUTATED");
  equal(jsonHash(upstream.originalPB05Input.decision_plan), upstream.hashes.plan, "GQ29_FIXED_PLAN_MUTATED");
  equal(Object.keys(upstream.outputs).sort(), ["PB-01", "PB-02", "PB-03", "PB-04"], "GQ29_UPSTREAM_OUTPUT_SET_CHANGED");
  const outputs = structuredClone(upstream.outputs);
  if (stageId === "PB-06") outputs["PB-05"] = structuredClone(newRawReport);
  const startedStages = [];
  class SingleAttemptRepository extends FakeAssessmentRepository {
    async startStage(record) {
      // startStage precedes transport.invoke in the unchanged pipeline. Reject
      // any repair/replay before even a fake response can be supplied.
      requireCondition((record.attemptNumber ?? 1) === 1, "GQ29_CAPTURE_REPAIR_ATTEMPT_FORBIDDEN");
      requireCondition(record.stageId === stageOrder[startedStages.length] && stageOrder.indexOf(record.stageId) <= stageOrder.indexOf(stageId), "GQ29_CAPTURE_STAGE_SEQUENCE_FORBIDDEN");
      startedStages.push(record.stageId);
      return super.startStage(record);
    }
  }
  const repository = new SingleAttemptRepository(), fake = new FakeAiStageTransport({ outputs });
  let captured = null, caught = null, result = null, pb05InputVerified = false, planVerified = false, nextUuid = 0;
  const observedRequests = [], events = [];
  const transport = {
    async invoke(q) {
      const processing = [...repository.stageRuns.values()].filter(s => s.status === "processing" && s.stageId === q.stageId);
      requireCondition(processing.length === 1 && (processing[0].attemptNumber ?? 1) === 1, "GQ29_CAPTURE_STAGE_ATTEMPT_MISMATCH");
      requireCondition(!q.input.quality_reassessment_directive, "GQ29_CAPTURE_REASSESSMENT_DIRECTIVE_FORBIDDEN");
      equal(q.model, "gpt-5.6-luna", "GQ29_CAPTURE_MODEL_MISMATCH");
      const definition = catalog.definitions.find(d => d.stageId === q.stageId);
      requireCondition(definition && ["developerPrompt", "promptVersion", "promptHash", "schemaName", "schemaVersion", "schemaHash"].every(k => q[k] === definition[k]) && isDeepStrictEqual(q.outputSchema, definition.outputSchema), "GQ29_CAPTURE_STAGE_IDENTITY_MISMATCH");
      if (q.stageId === "PB-05") {
        equal(q.input, upstream.originalPB05Input, "GQ29_CAPTURE_PB05_INPUT_CHANGED"); pb05InputVerified = true;
      }
      if (q.stageId === "PB-05" || q.stageId === "PB-06") {
        equal(q.input.decision_plan, upstream.originalPB05Input.decision_plan, "GQ29_CAPTURE_PLAN_CHANGED"); planVerified = true;
      }
      observedRequests.push({ stageId: q.stageId, attempt: 1, inputHash: jsonHash(q.input) });
      if (q.stageId === stageId) {
        requireCondition(captured === null, "GQ29_CAPTURE_DUPLICATED");
        captured = structuredClone(q);
        throw new M2RuntimeError(captureCode);
      }
      requireCondition(Object.hasOwn(outputs, q.stageId), "GQ29_FAKE_OUTPUT_NOT_AUTHORIZED");
      return fake.invoke(q);
    },
  };
  const application = new AssessmentApplication({ repository, transport, definitions: catalog.definitions, model: "gpt-5.6-luna",
    promptBundleVersion: catalog.promptBundleVersion, schemaSetVersion: catalog.schemaSetVersion,
    timeZone: "Asia/Tokyo", now: () => upstream.frozenNow,
    uuid: () => `00000000-0000-4000-8000-${String(++nextUuid).padStart(12, "0")}`,
    observe: event => { events.push(event); } });
  try { result = await application.submit(structuredClone(upstream.request), "gq29-targeted-local-stage-capture"); }
  catch (error) { caught = error; }
  equal(fake.actualProviderCalls, 0, "GQ29_CAPTURE_PROVIDER_ACTIVITY");
  equal(repository.actualSupabaseCalls, 0, "GQ29_CAPTURE_DATABASE_ACTIVITY");
  requireCondition([...repository.stageRuns.values()].every(s => (s.attemptNumber ?? 1) === 1), "GQ29_CAPTURE_REPAIR_REACHED_REPOSITORY");
  const captureChecks = {
    targetStageId: stageId, targetRequestCaptured: captured !== null, fixedPB05InputUnchanged: pb05InputVerified,
    fixedPlanUnchanged: planVerified, fakeResponseStages: [...fake.calls], startedStages, observedRequests,
    targetResponseGenerated: false, pb06ResponseGenerated: false, actualProviderCalls: 0, actualDatabaseCalls: 0,
    clarificationAnswers: 0, retryCalls: 0, repairCalls: 0,
    rawNewReportHash: stageId === "PB-06" ? jsonHash(newRawReport) : null,
    capturedGroundedReportHash: captured?.stageId === "PB-06" ? jsonHash(captured.input.report_content) : null,
    applicationGroundingChangedRawReport: captured?.stageId === "PB-06" ? !isDeepStrictEqual(captured.input.report_content, newRawReport) : null,
    preprocessing: "UNCHANGED_ASSESSMENT_APPLICATION_PIPELINE; no custom report grounding or evaluator output substitution",
    events,
  };
  if (captured !== null) {
    equal(caught?.safeCode, captureCode, "GQ29_CAPTURE_ABORT_NOT_PRESERVED");
    equal(fake.calls, stageOrder.slice(0, stageOrder.indexOf(stageId)), "GQ29_CAPTURE_UNEXPECTED_FAKE_RESPONSES");
    requireCondition(pb05InputVerified && planVerified && result === null, "GQ29_CAPTURE_INVARIANTS_NOT_VERIFIED");
    return { disposition: "captured", request: captured, captureChecks, localValidation: { disposition: "reached_target_stage_before_response", safeCode: null } };
  }
  return { disposition: "local_validation_failed", request: null, captureChecks,
    localValidation: { disposition: "target_stage_not_reached", safeCode: caught?.safeCode ?? "GQ29_APPLICATION_ENDED_BEFORE_TARGET",
      applicationResultDisposition: result?.eligibility ?? null,
      stageDispositions: [...repository.stageRuns.values()].map(s => ({ stageId: s.stageId, attempt: s.attemptNumber ?? 1, status: s.status, errorCode: s.failure?.errorCode ?? null })) } };
}
