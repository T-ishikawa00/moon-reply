// Evaluation-only stage adapter. Reuses the existing reservation journal,
// exact HTTP transport and receipt checkpoint; never runs fulfillment/repair.
import { readFileSync, existsSync, mkdirSync } from "node:fs";
import { parseEnv, isDeepStrictEqual } from "node:util";
import { createHash, randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { loadV19L2StageCatalog } from "../../../lib/assessment/runtime/v19-l2-stage-catalog.ts";
import { loadV19L3StageCatalog } from "../../../lib/assessment/runtime/v19-l3-stage-catalog.ts";
import { PilotStop, ReservationLedger, hash, reserveNanos } from "../../guidance-quality-wave1/real-pilot/budget.mjs";
import { EvaluationTransport, durableJson } from "../../guidance-quality-wave1/real-pilot/transport.mjs";
import { acquireOneShotLock, createLiveSender } from "../../guidance-quality-wave1/real-pilot/runner.mjs";
import { reviewReceipt } from "../../guidance-quality-v19-l1/real-pilot.mjs";
import { loadFixedUpstream, captureStageRequest } from "./adapter.mjs";

export const CANDIDATE_HEAD = "cc899b92e94e26b71d83eae3a747f0b849874ddc";
export const RUN_NAME = "2026-09-08-gq29-p3-targeted";
export const CAPS = [
  { stage: "PB-05", invocationsPerSession: 1, input: 64000, outputIncludingReasoning: 8192 },
  { stage: "PB-06", invocationsPerSession: 1, input: 96000, outputIncludingReasoning: 4096 },
];
const root = fileURLToPath(new URL("../../../", import.meta.url));
const localRoot = "evals/guidance-quality-v19-l3/targeted/";
const runRelative = `evals/guidance-quality-v19-l3/runs/${RUN_NAME}`;
const conditions = ["V19-L2", "V19-L3"];
const conditionQualityCodes = new Set(["MATERIAL_SAFETY_OR_INTEGRITY_FINDING", "MATERIAL_MANUAL_INTEGRITY_OR_SAFETY"]);
const read = file => JSON.parse(readFileSync(file, "utf8"));
const git = args => execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();
const byteHash = file => createHash("sha256").update(readFileSync(file)).digest("hex");
const assert = (ok, code) => { if (!ok) throw new PilotStop(code); };

// Only the new diagnostic experiment's material quality failures are local to
// a condition. This is not a runtime classifier, finding allow-list or recovery.
// The shared ledger and every reservation remain intact. No global STOP reset.
export class ConditionLedger {
  constructor(shared) { this.shared = shared; this.qualityStops = []; }
  get manifest() { return this.shared.manifest; }
  get stopReason() { return this.shared.stopReason; }
  reserve(...args) { return this.shared.reserve(...args); }
  dispatch(...args) { return this.shared.dispatch(...args); }
  settle(...args) { return this.shared.settle(...args); }
  stop(reason) {
    if (conditionQualityCodes.has(reason)) this.qualityStops.push(reason);
    else this.shared.stop(reason);
  }
}

function identity(catalog) {
  return { catalogVersion: catalog.catalogVersion, promptBundleVersion: catalog.promptBundleVersion, schemaSetVersion: catalog.schemaSetVersion,
    definitions: catalog.definitions.map(({ stageId, promptVersion, promptHash, schemaVersion, schemaHash, schemaName }) =>
      ({ stageId, promptVersion, promptHash, schemaVersion, schemaHash, schemaName })) };
}

export async function loadConfiguration() {
  assert(path.resolve(process.cwd()) === path.resolve(root), "WRONG_CHECKOUT");
  assert(git(["rev-parse", "HEAD"]) === CANDIDATE_HEAD && git(["branch", "--show-current"]) === "release/private-ready", "AUTHORIZED_CANDIDATE_HEAD_MISMATCH");
  assert(!git(["diff", "--name-only", "HEAD"]), "TRACKED_SOURCE_CHANGED");
  const newFiles = git(["ls-files", "--others", "--exclude-standard"]).split("\n").filter(Boolean);
  const allowed = ["adapter.mjs", "runner.mjs", "verify.mjs", "verified-pricing.json", "authorization.md", "verification.json"].map(p => localRoot + p);
  assert(newFiles.every(p => allowed.includes(p)), "UNAUTHORIZED_EXECUTION_SOURCE_CHANGE");
  const preservation = read(path.join(root, "evals/guidance-quality-v19-l3/preservation-manifest.json"));
  assert(Object.keys(preservation.hashes).length > 0, "HISTORICAL_MANIFEST_EMPTY");
  for (const [file, expected] of Object.entries(preservation.hashes)) assert(byteHash(path.join(root, file)) === expected, "HISTORICAL_EVIDENCE_CHANGED");
  const catalogs = { "V19-L2": await loadV19L2StageCatalog(), "V19-L3": await loadV19L3StageCatalog() };
  for (const condition of conditions) {
    const stored = read(path.join(root, `evals/guidance-quality-${condition.toLowerCase()}/catalog-identity.json`));
    assert(isDeepStrictEqual(identity(catalogs[condition]), identity(stored)), "RUNTIME_CONTRACT_IDENTITY_MISMATCH");
  }
  assert(isDeepStrictEqual(catalogs["V19-L2"].definitions.filter(d => d.stageId !== "PB-05"), catalogs["V19-L3"].definitions.filter(d => d.stageId !== "PB-05")), "NON_PB05_CONTRACT_DIFFERENCE");
  const pricing = read(path.join(root, localRoot, "verified-pricing.json"));
  assert(pricing.model === "gpt-5.6-luna" && pricing.tier === "Standard" && pricing.usdPerMillion.input === 0.20 && pricing.usdPerMillion.cachedInput === 0.02 && pricing.usdPerMillion.cacheWrite === 0.25 && pricing.usdPerMillion.output === 1.20, "PRICING_ACCOUNTING_MISMATCH");
  assert(Number.isFinite(Date.parse(pricing.verifiedAt)) && Date.now() - Date.parse(pricing.verifiedAt) >= 0 && Date.now() - Date.parse(pricing.verifiedAt) < 24 * 3600000, "PRICING_VERIFICATION_STALE");
  const verification = read(path.join(root, localRoot, "verification.json"));
  assert(verification.pass === true && verification.realApiCalls === 0, "LOCAL_VERIFICATION_REQUIRED");
  for (const [file, expected] of Object.entries(verification.sourceHashes)) assert(byteHash(path.join(root, file)) === expected, "VERIFIED_RUNNER_SOURCE_CHANGED");
  const upstream = loadFixedUpstream();
  // Prove both PB05 user inputs match the saved upstream before the first call.
  for (const condition of conditions) {
    const captured = await captureStageRequest(catalogs[condition], upstream, "PB-05");
    assert(captured.disposition === "captured" && isDeepStrictEqual(captured.request.input, upstream.originalPB05Input), "FIXED_UPSTREAM_PREFLIGHT_MISMATCH");
  }
  const sources = [...allowed, "evals/guidance-quality-wave1/real-pilot/budget.mjs", "evals/guidance-quality-wave1/real-pilot/transport.mjs", "evals/guidance-quality-wave1/real-pilot/runner.mjs", "evals/guidance-quality-v19-l1/real-pilot.mjs"];
  const manifest = { schemaVersion: "gq29-targeted-diagnostic-v1", runName: RUN_NAME, candidateHead: CANDIDATE_HEAD,
    purpose: "Fixed synthetic upstream; PB05/PB06 diagnostic comparison only; not a fresh Blind Pilot or customer delivery",
    model: "gpt-5.6-luna", reasoning: "low", serviceTier: "default", budgetNanos: 150000000, maxHttpAttempts: 4, caps: CAPS,
    retries: 0, repairs: 0, clarificationAnswers: 0, additionalSamples: 0,
    sessions: conditions.map(condition => ({ sessionId: randomUUID(), condition, caseId: "GQ-29-P3", anonymousVariantId: condition })),
    identities: Object.fromEntries(conditions.map(c => [c, identity(catalogs[c])])), fixedUpstreamHashes: upstream.hashes,
    sourceHashes: Object.fromEntries(sources.map(p => [p, byteHash(path.join(root, p))])), pricing,
    worstReservationUsd: CAPS.reduce((n,c) => n + reserveNanos(c), 0) * 2 / 1e9,
    createdAt: new Date().toISOString(), historicalBlindMapping: "not loaded into generation; not disclosed",
    conditionQualityStopCodes: [...conditionQualityCodes], infrastructureFailure: "whole experiment STOP; no retry or reset" };
  return { directory: path.join(root, runRelative), manifest, catalogs, upstream };
}

export async function runTargeted({ directory, manifest, catalogs, upstream, send, inspect, capture = captureStageRequest }) {
  assert(manifest.sessions.length === 2 && isDeepStrictEqual(manifest.sessions.map(s => s.condition), conditions) &&
    manifest.sessions.every(s => s.caseId === "GQ-29-P3") && new Set(manifest.sessions.map(s => s.sessionId)).size === 2 &&
    manifest.maxHttpAttempts === 4 && manifest.budgetNanos <= 150000000 && manifest.budgetNanos > 0 && isDeepStrictEqual(manifest.caps, CAPS), "AUTHORIZED_SCOPE_MISMATCH");
  assert(typeof inspect === "function" && typeof send === "function", "DIAGNOSTIC_RECEIPT_INSPECTION_REQUIRED");
  mkdirSync(directory, { recursive: true }); acquireOneShotLock(directory);
  durableJson(path.join(directory, "manifest.json"), manifest);
  const ledger = new ReservationLedger(path.join(directory, "budget-ledger.jsonl"), manifest, { create: true });
  const results = []; let transportHttpCalls = 0;
  for (const session of manifest.sessions) {
    if (ledger.stopReason) break;
    const conditionDirectory = path.join(directory, session.condition); mkdirSync(conditionDirectory);
    const scoped = new ConditionLedger(ledger), repository = { stageRuns: new Map() }, manualInspections = [];
    const stages = []; let rawReport = null, failure = null;
    ledger.start(session.sessionId);
    const transport = new EvaluationTransport({ session, ledger: scoped, repository, definitions: catalogs[session.condition].definitions,
      originalInput: upstream.request, directory: conditionDirectory, send,
      reviewReceipt: async context => {
        const inspection = await inspect(context);
        assert(inspection && Array.isArray(inspection.materialFindings), "LOCAL_INSPECTION_INVALID");
        const record = { stageId: context.stageId, receiptHash: hash(context.received), ...inspection };
        durableJson(context.prefix + "-diagnostic-inspection.json", record); manualInspections.push(record);
        // PB05 material defects remain visible while the single authorized
        // PB06 call diagnoses them. No corrected report is substituted.
      } });
    try {
      for (const stageId of ["PB-05", "PB-06"]) {
        const captured = await capture(catalogs[session.condition], upstream, stageId, stageId === "PB-06" ? rawReport : undefined);
        durableJson(path.join(conditionDirectory, `${stageId}-local-capture.json`), { disposition: captured.disposition, captureChecks: captured.captureChecks, localValidation: captured.localValidation });
        assert(captured.disposition === "captured" && captured.request?.stageId === stageId, captured.localValidation?.safeCode ?? "TARGET_STAGE_NOT_REACHED");
        repository.stageRuns.clear(); repository.stageRuns.set(stageId, { stageId, status: "processing", attemptNumber: 1 });
        const response = await transport.invoke(captured.request);
        stages.push({ stageId, disposition: "response_received_and_schema_valid" });
        if (stageId === "PB-05") rawReport = response.output;
      }
    } catch (error) {
      failure = error.safeCode ?? "EVALUATION_ADAPTER_FAILURE";
      if (!conditionQualityCodes.has(failure)) ledger.stop(failure);
    }
    transportHttpCalls += transport.httpCalls;
    const pb06Receipt = transport.responses.find(r => r.stageId === "PB-06");
    // Preserve the already-authorized raw ACTION finding boundary even when
    // the unchanged classifier ignores a temporal finding. No repair follows.
    let rawActionFindings = [];
    if (pb06Receipt?.outputText && !ledger.stopReason) {
      rawActionFindings = (JSON.parse(pb06Receipt.outputText).semantic_checks ?? []).filter(f => f.finding_code === "ACTION_CONSISTENCY" && ["major", "critical"].includes(f.severity));
    }
    const qualityFailed = scoped.qualityStops.length > 0 || rawActionFindings.length > 0 || manualInspections.some(x => x.materialFindings.length > 0);
    const result = { condition: session.condition, caseId: session.caseId, sessionId: session.sessionId,
      finalDisposition: ledger.stopReason ? "infrastructure_stopped" : qualityFailed ? "diagnostic_quality_failed" : "diagnostic_stages_completed_pending_postflight",
      customerDelivery: false, stageDispositions: stages, initialDirection: upstream.originalPB05Input.decision_plan.selected_decision,
      pb05: transport.responses.find(r => r.stageId === "PB-05") ?? null, pb06: transport.responses.find(r => r.stageId === "PB-06") ?? null,
      findings: transport.findings, rawActionFindings, manualInspections, conditionStopReasons: scoped.qualityStops, errorReason: failure,
      calls: ledger.calls.filter(c => c.sessionId === session.sessionId).map(c => ({ stageId: c.stageId, dispatched: c.dispatched === true, status: c.status, reservedNanos: c.reservedNanos, accounting: c.accounting })),
      retries: 0, repairs: 0, additionalSamples: 0 };
    durableJson(path.join(conditionDirectory, "result.json"), result); results.push(result);
    ledger.finish(session.sessionId, result.finalDisposition === "diagnostic_stages_completed_pending_postflight" ? "completed" : "failed");
  }
  assert(transportHttpCalls === ledger.summary().actualHttpCalls, "HTTP_LEDGER_ACCOUNTING_MISMATCH");
  const reloaded = new ReservationLedger(path.join(directory, "budget-ledger.jsonl"), manifest);
  assert(isDeepStrictEqual(reloaded.summary(), ledger.summary()), "RELOADED_LEDGER_ACCOUNTING_MISMATCH");
  const result = { schemaVersion: "gq29-targeted-result-v1", summary: ledger.summary(), conditions: results.map(r => ({ condition: r.condition, disposition: r.finalDisposition, failure: r.errorReason })),
    globalStop: ledger.stopReason, noCustomerDelivery: true, realUpstreamCalls: 0, repairs: 0, retries: 0, additionalSamples: 0, productionOperations: 0 };
  durableJson(path.join(directory, "execution-summary.json"), result); return result;
}

async function liveInspection(context) {
  await reviewReceipt(context);
  const decision = read(context.prefix + "-inspection-decision.json");
  assert(Array.isArray(decision.materialFindings), "LOCAL_INSPECTION_INVALID");
  return { materialFindings: decision.materialFindings, observations: decision.observations ?? [], reason: decision.reason };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  if (process.argv.length !== 3 || process.argv[2] !== "--execute-human-authorized-gq29-targeted") { console.error("Exact authorized flag required; no API invoked."); process.exitCode = 1; }
  else try {
    const config = await loadConfiguration();
    // Existing private runner key loader is not exported. Same known location,
    // only here after authorization/preflight; never logged, hashed or persisted.
    const knownEnv = path.join(root, ".env.local");
    const key = process.env.GUIDANCE_PILOT_OPENAI_API_KEY || process.env.OPENAI_API_KEY || (existsSync(knownEnv) ? parseEnv(readFileSync(knownEnv, "utf8")).OPENAI_API_KEY : null);
    assert(Boolean(key), "LOCAL_OPENAI_KEY_MISSING");
    console.log(JSON.stringify(await runTargeted({ ...config, send: createLiveSender(key), inspect: liveInspection })));
  } catch (error) { console.error(JSON.stringify({ globalStop: true, reason: error.safeCode ?? "TARGETED_RUNNER_FAILURE" })); process.exitCode = 1; }
}
