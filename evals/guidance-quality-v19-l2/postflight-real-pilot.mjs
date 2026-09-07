// Reconcile this fresh run only after it has terminated. Never calls a Provider,
// reads credentials, resumes a run, or reads an older run's outputs or mapping.
// Version-associated values stay in internal evidence, never in console output.
import { readFileSync, readdirSync, existsSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { isDeepStrictEqual } from "node:util";
import { CANDIDATE_HEAD, RUN_NAME } from "./real-pilot.mjs";
import { ReservationLedger, accountUsage, hash, reserveNanos, PilotStop } from "../guidance-quality-wave1/real-pilot/budget.mjs";
import { buildBody } from "../guidance-quality-wave1/real-pilot/transport.mjs";
import { loadM2P4FinalProductRecoveryRuntimeStageCatalog } from "../../lib/assessment/runtime/schema-catalog.ts";
import { loadV19L2StageCatalog } from "../../lib/assessment/runtime/v19-l2-stage-catalog.ts";
import { groundBaseStructuredIntakeV3 } from "../../lib/assessment/runtime/base-structured-intake-grounding-v3.ts";
import { projectBaseProviderInputV1 } from "../../lib/assessment/runtime/base-structured-intake-grounding-v1.ts";
import { buildAbsentCandidateLaneV1 } from "../../lib/assessment/runtime/split-analysis-envelope-v1.ts";
import { buildEffectiveAssessmentAuthorityV1 } from "../../lib/assessment/runtime/effective-assessment-authority-v1.ts";
import { evaluateJpy980InputSufficiencyV4 } from "../../lib/assessment/runtime/jpy980-input-sufficiency-policy-v4.ts";
import { evaluateV19L1InputSufficiency } from "../../lib/assessment/runtime/v19-l1-acknowledgement-policy.ts";

const root = fileURLToPath(new URL("../../", import.meta.url));
const read = file => JSON.parse(readFileSync(file, "utf8"));
const requireEvidence = (condition, code) => { if (!condition) throw new PilotStop(code); };
const equal = (actual, expected, code) => requireEvidence(isDeepStrictEqual(actual, expected), code);
const portable = file => path.relative(root, file).replaceAll("\\", "/");
const capsExpected = [
  { stage: "PB-01", invocationsPerSession: 1, input: 42000, outputIncludingReasoning: 8192 },
  { stage: "PB-01C", invocationsPerSession: 0, input: 0, outputIncludingReasoning: 0 },
  { stage: "PB-02", invocationsPerSession: 1, input: 24000, outputIncludingReasoning: 3072 },
  { stage: "PB-03", invocationsPerSession: 1, input: 24000, outputIncludingReasoning: 2048 },
  { stage: "PB-04", invocationsPerSession: 2, input: 48000, outputIncludingReasoning: 8192 },
  { stage: "PB-05", invocationsPerSession: 2, input: 64000, outputIncludingReasoning: 8192 },
  { stage: "PB-06", invocationsPerSession: 2, input: 96000, outputIncludingReasoning: 4096 },
];
const serializedIdentity = catalog => ({ catalogVersion: catalog.catalogVersion, promptBundleVersion: catalog.promptBundleVersion,
  schemaSetVersion: catalog.schemaSetVersion, definitions: catalog.definitions.map(d => ({ stageId: d.stageId,
    promptVersion: d.promptVersion, promptHash: d.promptHash, schemaVersion: d.schemaVersion, schemaHash: d.schemaHash })) });

// Match the existing renderer's outer case/output delimiters; retain the actual
// anonymous HTML instead of rebuilding or editing a completed customer answer.
function renderedFragment(html, caseId, variant) {
  const caseStart = html.indexOf(`<section class="case"><h2>Case ${caseId}</h2>`);
  if (caseStart < 0) return null;
  const followingCase = html.indexOf('<section class="case">', caseStart + 1);
  const caseHtml = html.slice(caseStart, followingCase < 0 ? html.length : followingCase);
  const marker = `<section class="output"><h3 class="output-label">Output ${variant}</h3>`;
  const start = caseHtml.indexOf(marker);
  if (start < 0) return null;
  const after = start + marker.length;
  const next = variant === "A"
    ? caseHtml.indexOf('<section class="output"><h3 class="output-label">Output B</h3>', after)
    : caseHtml.indexOf(`<form data-case="${caseId}"`, after);
  requireEvidence(next >= 0, "BLIND_RENDER_FRAGMENT_MISSING");
  const outer = caseHtml.slice(after, next);
  requireEvidence(outer.endsWith("</section>"), "BLIND_RENDER_FRAGMENT_SHAPE");
  return outer.slice(0, -"</section>".length);
}

export async function reconcileFreshPilot() {
  requireEvidence(path.resolve(process.cwd()) === path.resolve(root), "WRONG_CHECKOUT");
  const run = path.join(root, "evals/guidance-quality-v19-l2/runs", RUN_NAME), internal = path.join(run, "internal");
  // Do not create anything before terminal runner artifacts exist.
  requireEvidence(existsSync(path.join(run, "technical-summary.json")) && existsSync(path.join(run, "human-review-status.json")), "RUN_NOT_TERMINAL_OR_NOT_CREATED");
  const manifest = read(path.join(internal, "manifest.json")), summary = read(path.join(run, "technical-summary.json"));
  const inputs = read(path.join(root, "evals/guidance-quality-wave1/pilot-inputs.json"));
  const prepared = read(path.join(root, "evals/guidance-quality-v19-l2/pilot-plan.json"));
  const prices = read(path.join(root, "evals/guidance-quality-v19-l2/execution-prices.json"));
  const plan = { ...prepared, status: "HUMAN_AUTHORIZED_V19_L2_FRESH_ONCE", executionCandidateHead: CANDIDATE_HEAD,
    costApproval: "HUMAN_AUTHORIZED_USD2_HARD_CAP", prices: { ...prepared.prices,
      verifiedAt: prices.verifiedAt, provenance: prices.provenance, requiresRecheckBeforeAuthorizedRun: false } };
  const ledger = new ReservationLedger(path.join(internal, "reservations.jsonl"), manifest);
  equal(manifest.authorizedBaseline, CANDIDATE_HEAD, "EXECUTED_AUTHORITY_HEAD_MISMATCH");
  equal(manifest.executionHead, CANDIDATE_HEAD, "EXECUTED_CANDIDATE_HEAD_MISMATCH");
  equal(manifest.inputHash, hash(inputs), "FROZEN_INPUT_MISMATCH");
  equal(manifest.planHash, hash(plan), "FROZEN_AUTHORIZED_PLAN_MISMATCH");
  equal(manifest.model, "gpt-5.6-luna", "MANIFEST_MODEL_MISMATCH");
  equal(manifest.caps, capsExpected, "MANIFEST_CAPS_MISMATCH");
  equal(manifest.budgetNanos, 2e9, "MANIFEST_BUDGET_MISMATCH");
  equal(manifest.maxHttpAttempts, 72, "MANIFEST_HTTP_LIMIT_MISMATCH");
  equal(manifest.generation, plan.generation, "GENERATION_SETTINGS_MISMATCH");
  equal(manifest.prices, plan.prices, "PLANNED_PRICE_MISMATCH");
  equal(manifest.sessions.length, 8, "MANIFEST_SESSION_LIMIT_MISMATCH");
  equal(inputs.cases.map(c => c.id), ["GQ-05", "GQ-24", "GQ-13", "GQ-29-P3"], "CASE_SET_MISMATCH");
  requireEvidence(manifest.evaluationSourceHashes && Object.keys(manifest.evaluationSourceHashes).length > 0, "FROZEN_SOURCE_HASHES_MISSING");
  for (const [file, expected] of Object.entries(manifest.evaluationSourceHashes)) {
    const resolved = path.resolve(root, file);
    requireEvidence(resolved.startsWith(path.resolve(root) + path.sep), "SOURCE_PATH_OUTSIDE_CHECKOUT");
    equal(hash(readFileSync(resolved, "utf8").replace(/\r\n/gu, "\n")), expected, "EXECUTION_SOURCE_CHANGED_AFTER_FREEZE");
  }
  const catalogs = { "current-v17": await loadM2P4FinalProductRecoveryRuntimeStageCatalog(), "candidate-v19-l2": await loadV19L2StageCatalog() };
  equal(manifest.catalogs, Object.fromEntries(Object.entries(catalogs).map(([arm, c]) => [arm, serializedIdentity(c)])), "CATALOG_CONTRACT_MISMATCH");
  for (const [key, value] of Object.entries(ledger.summary())) equal(summary[key], value, "SUMMARY_LEDGER_MISMATCH");
  requireEvidence(summary.reservedUsd <= 2 && summary.actualHttpCalls <= 72 && summary.sessionsStarted <= 8, "OBSERVED_LIMIT_EXCEEDED");
  equal(capsExpected.reduce((n, cap) => n + reserveNanos(cap) * cap.invocationsPerSession, 0) * 8, 1_533_011_200, "RESERVATION_MAXIMUM_MISMATCH");
  requireEvidence(ledger.calls.every(c => c.status !== "reserved"), "UNSETTLED_RESERVATION_AT_POSTFLIGHT");
  const mapping = read(path.join(internal, "mapping-SEALED-until-human-review.json"));
  equal(mapping.disclosureStatus, "HUMAN_REVIEW_PENDING_DO_NOT_DISPLAY", "MAPPING_DISCLOSURE_STATE_MISMATCH");
  equal(Object.keys(mapping.mapping).sort(), inputs.cases.map(c => c.id).sort(), "MAPPING_CASE_SET_MISMATCH");
  equal(new Set(manifest.sessions.map(s => s.sessionId)).size, 8, "SESSION_ID_REUSE");
  requireEvidence(manifest.sessions.every(s => /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/u.test(s.sessionId)), "SESSION_ID_SHAPE_INVALID");
  const records = [];
  for (const c of inputs.cases) {
    const pair = manifest.sessions.filter(s => s.caseId === c.id);
    equal(pair.map(s => s.arm).sort(), ["candidate-v19-l2", "current-v17"], "MANIFEST_CASE_ARMS_MISMATCH");
    equal(pair.map(s => s.anonymousVariantId).sort(), ["A", "B"], "MANIFEST_BLIND_PAIR_MISMATCH");
    for (const session of pair) {
      equal(mapping.mapping[c.id][session.anonymousVariantId], session.arm, "SEALED_MAPPING_MISMATCH");
      const recordPath = path.join(internal, session.sessionId, "session.json");
      const started = ledger.sessions.has(session.sessionId);
      equal(existsSync(recordPath), started, "SESSION_RECORD_LEDGER_MISMATCH");
      const record = started ? read(recordPath) : null;
      if (record) {
        equal(record.caseId, session.caseId, "SESSION_CASE_MISMATCH");
        equal(record.anonymousVariantId, session.anonymousVariantId, "SESSION_BLIND_ID_MISMATCH");
        equal(record.actualRuntimeVersion, catalogs[session.arm].catalogVersion, "SESSION_CATALOG_MISMATCH");
        equal(record.promptBundleVersion, catalogs[session.arm].promptBundleVersion, "SESSION_BUNDLE_MISMATCH");
        equal(record.schemaSetVersion, catalogs[session.arm].schemaSetVersion, "SESSION_SCHEMA_SET_MISMATCH");
        equal(record.repository.actualDatabaseCalls, 0, "UNAUTHORIZED_DATABASE_ACTIVITY");
        equal(record.actualHttpCalls, ledger.calls.filter(call => call.sessionId === session.sessionId && call.dispatched).length, "SESSION_HTTP_COUNT_MISMATCH");
      }
      records.push({ session, record, input: c.input, recordPath });
    }
  }
  const receipts = [], rawFindingCounts = {}, technicalResponseFailures = [];
  const expectedCallPaths = new Set(ledger.calls.map(call => path.join(internal, call.sessionId, `call-${String(call.sequence).padStart(3, "0")}`)));
  for (const { session, record } of records) {
    if (!record) continue;
    const directory = path.join(internal, session.sessionId);
    for (const file of readdirSync(directory)) {
      if (!/^call-\d+-(?:request|response|review|inspection-required|inspection-decision)\.json$/u.test(file)) continue;
      const base = path.join(directory, file.replace(/-(?:request|response|review|inspection-required|inspection-decision)\.json$/u, ""));
      requireEvidence(expectedCallPaths.has(base), "ORPHAN_RECEIPT_WITHOUT_LEDGER_CALL");
    }
  }
  let inspected = 0;
  for (const call of ledger.calls) {
    const prefix = path.join(internal, call.sessionId, `call-${String(call.sequence).padStart(3, "0")}`);
    const request = read(prefix + "-request.json"), session = manifest.sessions.find(s => s.sessionId === call.sessionId);
    const definition = catalogs[session.arm].definitions.find(d => d.stageId === call.stageId), cap = manifest.caps.find(c => c.stage === call.stageId);
    equal(request.stageId, call.stageId, "REQUEST_STAGE_MISMATCH"); equal(request.attempt, call.attempt, "REQUEST_ATTEMPT_MISMATCH");
    equal(request.requestHash, call.requestHash, "REQUEST_LEDGER_HASH_MISMATCH");
    equal(request.inputCeiling, call.inputCeiling, "REQUEST_INPUT_CEILING_MISMATCH");
    equal(request.reservationNanos, call.reservedNanos, "REQUEST_RESERVATION_MISMATCH");
    equal(request.promptHash, definition.promptHash, "REQUEST_PROMPT_IDENTITY_MISMATCH");
    equal(request.schemaHash, definition.schemaHash, "REQUEST_SCHEMA_IDENTITY_MISMATCH");
    const body = buildBody({ ...definition, input: request.input }, cap);
    equal(hash(body), call.requestHash, "RECONSTRUCTED_REQUEST_HASH_MISMATCH");
    equal(Buffer.byteLength(JSON.stringify(body), "utf8") + 4096, call.inputCeiling, "RECONSTRUCTED_INPUT_CEILING_MISMATCH");
    const response = existsSync(prefix + "-response.json") ? read(prefix + "-response.json") : null;
    const review = existsSync(prefix + "-review.json") ? read(prefix + "-review.json") : null;
    let rawOutput = null, parseError = null;
    if (response) {
      equal(response.stageId, call.stageId, "RECEIPT_STAGE_MISMATCH"); equal(response.attempt, call.attempt, "RECEIPT_ATTEMPT_MISMATCH");
      if (call.accounting) equal(accountUsage(response.usage, cap, call.inputCeiling), call.accounting, "ACTUAL_USAGE_LEDGER_MISMATCH");
      try { rawOutput = JSON.parse(response.outputText); } catch { parseError = "SAVED_RESPONSE_NOT_VALID_JSON"; }
      const failures = [response.returnedModel !== "gpt-5.6-luna" ? "MODEL_IDENTITY_MISMATCH" : null,
        response.serviceTier !== "default" ? "SERVICE_TIER_MISMATCH" : null, response.status !== "completed" ? "INCOMPLETE_RESPONSE" : null,
        !response.outputText ? "PROVIDER_OUTPUT_MISSING_OR_REFUSAL" : null, parseError].filter(Boolean);
      technicalResponseFailures.push(...failures);
      requireEvidence(!failures.length || summary.stopReason, "RESPONSE_FAILURE_WITHOUT_BATCH_STOP");
    } else requireEvidence(!call.accounting && summary.stopReason, "MISSING_RECEIPT_WITHOUT_FAILED_STOP");
    const requiredFile = prefix + "-inspection-required.json", decisionFile = prefix + "-inspection-decision.json";
    const required = existsSync(requiredFile) ? read(requiredFile) : null, decision = existsSync(decisionFile) ? read(decisionFile) : null;
    if (required) {
      equal(required.receiptHash, hash(response), "INSPECTION_RECEIPT_HASH_MISMATCH");
      equal(required.stageId, call.stageId, "INSPECTION_STAGE_MISMATCH"); equal(required.attempt, call.attempt, "INSPECTION_ATTEMPT_MISMATCH");
      equal(required.caseId, session.caseId, "INSPECTION_CASE_MISMATCH");
      equal(required.anonymousVariantId, session.anonymousVariantId, "INSPECTION_BLIND_ID_MISMATCH");
    }
    if (decision) {
      requireEvidence(required, "INSPECTION_DECISION_WITHOUT_RECEIPT");
      equal(decision.receiptHash, required.receiptHash, "INSPECTION_DECISION_HASH_MISMATCH");
      equal(decision.stageId, required.stageId, "INSPECTION_DECISION_STAGE_MISMATCH");
      equal(decision.attempt, required.attempt, "INSPECTION_DECISION_ATTEMPT_MISMATCH");
      requireEvidence(["continue", "stop"].includes(decision.action) && typeof decision.reason === "string" && decision.reason.trim(), "INSPECTION_DECISION_INVALID");
      if (decision.action === "stop") requireEvidence(summary.stopReason, "INSPECTION_STOP_WITHOUT_BATCH_STOP");
      inspected++;
    } else if (required) requireEvidence(summary.stopReason, "UNRESOLVED_INSPECTION_WITHOUT_STOP");
    const record = records.find(r => r.session.sessionId === call.sessionId)?.record;
    const stageDisposition = record?.stageDispositions.find(s => s.stageId === call.stageId && (s.attemptNumber ?? 1) === call.attempt);
    const completedStage = stageDisposition?.status === "completed" ? stageDisposition : null;
    if (completedStage) requireEvidence(decision?.action === "continue", "COMPLETED_STAGE_WITHOUT_INSPECTION");
    if (call.stageId === "PB-06") for (const finding of Array.isArray(rawOutput?.semantic_checks) ? rawOutput.semantic_checks : []) rawFindingCounts[finding.finding_code] = (rawFindingCounts[finding.finding_code] ?? 0) + 1;
    receipts.push({ sessionId: call.sessionId, stageId: call.stageId, attempt: call.attempt, dispatched: !!call.dispatched,
      requestPath: portable(prefix + "-request.json"), requestHash: call.requestHash, requestInput: request.input,
      responsePath: response ? portable(prefix + "-response.json") : null, responseHash: response ? hash(response) : null,
      returnedModel: response?.returnedModel ?? null, serviceTier: response?.serviceTier ?? null, responseStatus: response?.status ?? null,
      incompleteReason: response?.incompleteReason ?? null, rawOutput, parseError, usage: response?.usage ?? null,
      accounting: call.accounting ?? null, reservationNanos: call.reservedNanos, ledgerOutcome: call.status,
      stageDisposition: stageDisposition?.status ?? null,
      review, inspection: required ? { required, decision } : null,
      stopReason: call.stopReason ?? review?.stopReason ?? (stageDisposition?.status === "failed" ? record.errorCode : null) });
  }
  const htmlPath = path.join(run, "blind-review.html"), html = readFileSync(htmlPath, "utf8"), md = readFileSync(path.join(run, "blind-review.md"), "utf8");
  requireEvidence(!/runtime-stage-catalog|current-v17|candidate-v19|actualRuntimeVersion|pipeline-schema-runtime|mapping-SEALED|\bV(?:17|18|19|20)\b/u.test(html + md), "BLIND_VERSION_IDENTITY_LEAK");
  requireEvidence(!/<input[^>]*\bchecked\b/u.test(html) && !/<textarea[^>]*>[^<]+<\/textarea>/u.test(html), "HUMAN_ANSWER_PREFILLED");
  requireEvidence(html.includes(`moon-reply-${RUN_NAME}-human-answers`), "HUMAN_REVIEW_STORAGE_KEY_MISMATCH");
  equal(read(path.join(run, "human-review-status.json")), { status: "PENDING", answers: null, mappingDisclosed: false }, "HUMAN_REVIEW_STATE_CHANGED");
  const integrity = read(path.join(run, "blind-integrity-check.json"));
  equal(integrity.mappingDisplayed, false, "BLIND_MAPPING_DISPLAYED"); equal(integrity.humanAnswersPrefilled, false, "BLIND_HUMAN_ANSWERS_PREFILLED");
  equal(integrity.realSessionsPresented, records.filter(r => r.record).length, "BLIND_SESSION_COUNT_MISMATCH");
  equal(integrity.stopped, !!summary.stopReason, "BLIND_STOP_STATE_MISMATCH");
  const observations = records.map(({ session, record, input, recordPath }) => {
    const calls = receipts.filter(r => r.sessionId === session.sessionId), raw = calls.find(r => r.stageId === "PB-01")?.rawOutput;
    const safety = calls.find(r => r.stageId === "PB-02")?.rawOutput;
    if (record) {
      equal(record.receivedUsage, calls.filter(r => r.responsePath).map(r => ({ stageId: r.stageId, attempt: r.attempt, usage: r.usage })), "SESSION_USAGE_RECEIPTS_MISMATCH");
      equal(record.costRecords, calls.map(r => ({ stageId: r.stageId, attempt: r.attempt, reservedNanos: r.reservationNanos,
        accounting: r.accounting, outcome: r.ledgerOutcome })), "SESSION_COST_LEDGER_MISMATCH");
      equal(record.evaluatedPairs, calls.filter(r => r.stageId === "PB-06").map(r => ({ attempt: r.attempt,
        decisionPlan: r.requestInput.decision_plan, reportContent: r.requestInput.report_content })), "SESSION_EVALUATED_INPUTS_MISMATCH");
      equal(record.reassessment, calls.filter(r => r.requestInput.quality_reassessment_directive).map(r => ({ stageId: r.stageId,
        attempt: r.attempt, directive: r.requestInput.quality_reassessment_directive })), "SESSION_REASSESSMENT_TRACE_MISMATCH");
      equal(record.initialCandidate, calls.find(r => r.stageId === "PB-04" && r.attempt === 1)?.rawOutput ?? null, "INITIAL_CANDIDATE_RECEIPT_MISMATCH");
    }
    let policy = null, policyError = null;
    if (raw && safety) try {
      const base = groundBaseStructuredIntakeV3(projectBaseProviderInputV1(input), raw), candidateEnvelope = buildAbsentCandidateLaneV1().candidate_envelope;
      const authority = buildEffectiveAssessmentAuthorityV1({ baseStructuredIntake: base, candidateEnvelope, clarificationGrounding: null });
      const args = { basePolicyInput: { aggregateSafety: safety, baseStructuredIntake: base, decisionFacts: base.decision_facts, baseWritingSignals: base.base_writing_signals }, clarificationGrounding: null, effectiveAssessmentAuthority: authority };
      policy = (session.arm === "candidate-v19-l2" ? evaluateV19L1InputSufficiency : evaluateJpy980InputSufficiencyV4)(args);
    } catch (error) { policyError = error.safeCode ?? "DERIVED_INPUT_TRACE_UNAVAILABLE"; }
    const plans = calls.filter(r => r.stageId === "PB-04").map(r => ({ attempt: r.attempt, responsePath: r.responsePath,
      stageDisposition: r.stageDisposition, currentDecision: r.rawOutput?.selected_decision ?? null,
      preActionCheck: r.rawOutput?.pre_action_check ?? null, recommendedActions: r.rawOutput?.actions_to_take ?? null,
      avoidActions: r.rawOutput?.actions_to_avoid ?? null, messageDraft: r.rawOutput?.recommended_message_draft ?? null,
      messageSourceMetadata: r.rawOutput?.message_draft_edit_metadata ?? null, aftercare: r.rawOutput?.aftercare_plan ?? null,
      changeConditions: r.rawOutput?.change_conditions ?? null, reviewTiming: r.rawOutput?.review_timing ?? null,
      rawOutput: r.rawOutput, reassessmentDirective: r.requestInput.quality_reassessment_directive ?? null }));
    const fragment = renderedFragment(html, session.caseId, session.anonymousVariantId);
    if (record) requireEvidence(fragment !== null, "RECORDED_SESSION_RENDER_MISSING");
    return { caseId: session.caseId, anonymousVariantId: session.anonymousVariantId, actualRuntimeVersion: catalogs[session.arm].catalogVersion,
      sessionStatus: record ? "started_and_recorded" : "not_run", sessionRecordPath: record ? portable(recordPath) : null,
      pb01Purpose: raw?.base_writing_signals?.user_goal_detail ?? null,
      pb01: calls.filter(r => r.stageId === "PB-01").map(r => ({ responsePath: r.responsePath, rawOutput: r.rawOutput, stageDisposition: r.stageDisposition })),
      inputSufficiency: { provenance: "RECOMPUTED_FROM_THIS_FRESH_RUN_SAVED_BASE_AND_SAFETY_USING_EXACT_EXECUTED_SOURCE; no model call", result: policy, error: policyError },
      observedEntryDisposition: record?.entryDisposition ?? "not_run", initialDirection: record?.initialDirection ?? null,
      pb04: plans,
      pb05: calls.filter(r => r.stageId === "PB-05").map(r => ({ attempt: r.attempt, responsePath: r.responsePath, stageDisposition: r.stageDisposition,
        rawReport: r.rawOutput, reassessmentDirective: r.requestInput.quality_reassessment_directive ?? null })),
      pb06: calls.filter(r => r.stageId === "PB-06").map(r => ({ attempt: r.attempt, responsePath: r.responsePath,
        stageDisposition: r.stageDisposition, evaluatedDecisionPlan: r.requestInput.decision_plan, evaluatedReport: r.requestInput.report_content,
        rawValidation: r.rawOutput, allSemanticFindings: r.rawOutput?.semantic_checks ?? null,
        deterministicChecks: r.rawOutput?.deterministic_checks ?? null, repairRequirement: r.rawOutput?.repair_strategy ?? null,
        evaluationReview: r.review, parseError: r.parseError, stopReason: r.stopReason })),
      reassessment: record?.reassessment ?? [], initialCandidate: record?.initialCandidate ?? null,
      evaluatedPairs: record?.evaluatedPairs ?? [], finalOutput: record?.finalOutput ?? null,
      finalDeliveryDisposition: record?.finalDeliveryDisposition ?? "not_run",
      finalRenderedOutput: { artifact: portable(htmlPath), documentSha256: hash(html), anonymousFragmentHtml: fragment, fragmentSha256: fragment === null ? null : hash(fragment) },
      usageAndCosts: calls.map(r => ({ stageId: r.stageId, attempt: r.attempt, usage: r.usage, accounting: r.accounting, reservationNanos: r.reservationNanos, outcome: r.ledgerOutcome })),
      error: record?.errorCode ?? null, savedReceipts: calls };
  });
  equal(summary.readyResults, records.filter(r => r.record?.finalDeliveryDisposition === "ready_local_only").length, "READY_RESULT_COUNT_MISMATCH");
  equal(summary.actualDatabaseCalls, 0, "UNAUTHORIZED_DATABASE_ACTIVITY"); equal(summary.actualEmailCalls, 0, "UNAUTHORIZED_EMAIL_ACTIVITY");
  let scannedFiles = 0;
  const scan = directory => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const file = path.join(directory, entry.name);
      if (entry.isDirectory()) scan(file);
      else { scannedFiles++; requireEvidence(!/\bsk-[A-Za-z0-9_-]{20,}|Bearer\s+[A-Za-z0-9._-]{20,}/u.test(readFileSync(file, "utf8")), "CREDENTIAL_PATTERN_IN_EVIDENCE"); }
    }
  };
  scan(run);
  const trace = { schemaVersion: "guidance-v19-l2-pilot-observations-v1", provenance: "DERIVED_FROM_THIS_FRESH_RUN_ONLY; prior pilot outputs and mapping not read",
    actualApiCallsAdded: 0,
    knownOpen: "F007 generated_without_candidate/preserved_meaning metadata inconsistency and the major ACTION_CONSISTENCY repair-exhaustion/ready limitation both remain open. This evaluation stops every raw major/critical ACTION_CONSISTENCY before repair; no runtime classifier/recovery change or Human vote resolves either issue.",
    observations };
  const tracePath = path.join(internal, "branch-observations.json");
  if (existsSync(tracePath)) equal(read(tracePath), trace, "DERIVED_TRACE_CHANGED_AFTER_WRITE");
  else writeFileSync(tracePath, JSON.stringify(trace, null, 2) + "\n", { flag: "wx" });
  return { verification: "PASS", completedSessions: summary.sessionsCompleted, sessionsStarted: summary.sessionsStarted, totalSlots: 8,
    httpCalls: summary.actualHttpCalls, inputTokens: summary.inputTokens, outputTokens: summary.outputTokens,
    cachedTokens: summary.cachedTokens, reasoningTokens: summary.reasoningTokens,
    costLowerUsd: summary.usageBasedCostLowerUsd, costUpperUsd: summary.usageBasedCostUpperUsd, reservedUsd: summary.reservedUsd,
    clarification: records.filter(r => r.record?.finalDeliveryDisposition === "needs_more_information").length,
    ready: summary.readyResults, stop: summary.stopReason, technicalFailures: summary.technicalFailures,
    technicalResponseFailureCounts: Object.fromEntries([...new Set(technicalResponseFailures)].map(code => [code, technicalResponseFailures.filter(v => v === code).length])),
    rawPb06FindingCounts: rawFindingCounts, materialFindingCount: summary.materialFindings.length,
    inspectedReceipts: inspected, filesScanned: scannedFiles, mappingDisplayed: false, actualApiCallsAdded: 0 };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const previousFetch = globalThis.fetch;
  globalThis.fetch = async () => { throw new PilotStop("POSTFLIGHT_NETWORK_FORBIDDEN"); };
  try { console.log(JSON.stringify(await reconcileFreshPilot())); }
  catch (error) { console.error(JSON.stringify({ verification: "FAIL", reason: error.safeCode ?? "LOCAL_EVIDENCE_RECONCILIATION_FAILED", mappingDisplayed: false, actualApiCallsAdded: 0 })); process.exitCode = 1; }
  finally { globalThis.fetch = previousFetch; }
}
