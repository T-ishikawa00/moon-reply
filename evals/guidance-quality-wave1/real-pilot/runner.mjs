// Only this evaluation entry point may construct a live client. Runtime assets
// are read unchanged; persistence is the local evaluation journal + fake repo.
import { existsSync, mkdirSync, openSync, closeSync, readFileSync, writeFileSync } from "node:fs";
import { parseEnv } from "node:util";
import { randomInt, randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";
import OpenAI from "openai";
import { AssessmentApplication } from "../../../lib/assessment/runtime/application.ts";
import { FakeAssessmentRepository } from "../../../lib/assessment/runtime/fakes.ts";
import { loadGuidanceQualityWave1StageCatalog } from "../../../lib/assessment/runtime/guidance-stage-catalog-v1.ts";
import { loadM2P4FinalProductRecoveryRuntimeStageCatalog } from "../../../lib/assessment/runtime/schema-catalog.ts";
import { PilotStop, ReservationLedger, hash, USD_NANOS } from "./budget.mjs";
import { durableJson, EvaluationTransport } from "./transport.mjs";
import { writeBlindArtifacts } from "./review.mjs";

export const AUTHORIZED_BASELINE = "5459a811e6503a3449e92733087c334659df7547";
export const RUN_NAME = "2026-09-07-authorized-pilot8";
const root = fileURLToPath(new URL("../../../", import.meta.url));
const evalRoot = path.join(root, "evals/guidance-quality-wave1");
const read = p => JSON.parse(readFileSync(p, "utf8"));
const git = args => execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();

export function acquireOneShotLock(directory) {
  const fd = openSync(path.join(directory, "execution.lock"), "wx");
  closeSync(fd); // Deliberately never removed: this authorization is one-shot.
}
export async function loadFrozenConfiguration() {
  if (path.resolve(process.cwd()) !== path.resolve(root)) throw new PilotStop("WRONG_CHECKOUT");
  if (git(["branch", "--show-current"]) !== "release/private-ready") throw new PilotStop("WRONG_BRANCH");
  if (git(["status", "--porcelain"])) throw new PilotStop("UNCOMMITTED_EXECUTION_SOURCE");
  git(["merge-base", "--is-ancestor", AUTHORIZED_BASELINE, "HEAD"]);
  // No app/runtime/schema/prompt/Production changes are part of this task.
  if (git(["diff", "--name-only", AUTHORIZED_BASELINE, "HEAD", "--", "lib", "app", "components", "ai", "supabase", "netlify", "evals/guidance-quality-r1", "evals/guidance-quality-wave1/pilot-inputs.json", "evals/guidance-quality-wave1/pilot-plan.json"])) throw new PilotStop("AUTHORIZED_CONTRACT_CHANGED");
  const plan = read(path.join(evalRoot, "pilot-plan.json")), inputs = read(path.join(evalRoot, "pilot-inputs.json"));
  if (plan.model !== "gpt-5.6-luna" || plan.maxTotalSessions !== 8 || plan.maxHttpAttempts !== 72 || plan.proposedBudgetUsd !== 2 || inputs.cases.length !== 4 || inputs.cases.some(c => c.input.optionalMessage !== null)) throw new PilotStop("AUTHORIZED_PLAN_CHANGED");
  const catalogs = { "current-v17": await loadM2P4FinalProductRecoveryRuntimeStageCatalog(), "candidate-v18": await loadGuidanceQualityWave1StageCatalog() };
  if (catalogs["current-v17"].catalogVersion !== plan.currentCatalog || catalogs["candidate-v18"].catalogVersion !== plan.candidateCatalog || catalogs["candidate-v18"].schemaSetVersion !== plan.candidateSchemaSet) throw new PilotStop("RUNTIME_CONTRACT_IDENTITY_MISMATCH");
  return { plan, inputs, catalogs, executionHead: git(["rev-parse", "HEAD"]) };
}
function loadLocalKey() {
  if (process.env.GUIDANCE_PILOT_OPENAI_API_KEY) return process.env.GUIDANCE_PILOT_OPENAI_API_KEY;
  if (process.env.OPENAI_API_KEY) return process.env.OPENAI_API_KEY;
  const p = path.join(root, ".env.local");
  const key = existsSync(p) ? parseEnv(readFileSync(p, "utf8")).OPENAI_API_KEY : null;
  if (!key) throw new PilotStop("LOCAL_OPENAI_KEY_MISSING");
  return key; // Never print, persist, hash, or put this value in a prompt.
}
export function createLiveSender(apiKey) {
  let dispatchMarker = null, inFlight = false;
  const client = new OpenAI({ apiKey, organization: null, project: null, baseURL: "https://api.openai.com/v1", maxRetries: 0, timeout: 180_000,
    fetch: async (url, options) => {
      if (String(url) !== "https://api.openai.com/v1/responses" || options?.method !== "POST" || !dispatchMarker) throw new PilotStop("UNAUTHORIZED_HTTP_DISPATCH");
      const marker = dispatchMarker; dispatchMarker = null; marker();
      return fetch(url, { ...options, redirect: "error" });
    } });
  return async (body, onDispatch) => {
    if (inFlight) throw new PilotStop("CONCURRENT_HTTP_FORBIDDEN");
    inFlight = true; dispatchMarker = onDispatch;
    try { return await client.responses.create(body, { maxRetries: 0, timeout: 180_000 }); }
    finally { inFlight = false; dispatchMarker = null; }
  };
}
export async function executeSession({ session, catalog, input, directory, ledger, send, frozenNow }) {
  ledger.start(session.sessionId);
  const repository = new FakeAssessmentRepository(), events = [];
  const transport = new EvaluationTransport({ session, ledger, repository, definitions: catalog.definitions, originalInput: input, directory, send });
  const application = new AssessmentApplication({ repository, transport, model: "gpt-5.6-luna", definitions: catalog.definitions, promptBundleVersion: catalog.promptBundleVersion,
    schemaSetVersion: catalog.schemaSetVersion, timeZone: "Asia/Tokyo", now: () => frozenNow, uuid: randomUUID, observe: event => { events.push(event); } });
  let result = null, errorCode = null;
  try {
    result = await application.submit(structuredClone(input), randomUUID());
    if (result.eligibility === "safety_blocked") { errorCode = "SAFETY_BLOCKED"; ledger.stop(errorCode); }
  } catch (error) { errorCode = ledger.stopReason ?? error.safeCode ?? "EVALUATION_SESSION_FAILURE"; ledger.stop(errorCode); }
  const evaluatedPairs = transport.requests.filter(q => q.stageId === "PB-06").map(q => ({ attempt: q.attempt, decisionPlan: q.input.decision_plan, reportContent: q.input.report_content }));
  const initialPlan = transport.responses.find(r => r.stageId === "PB-04" && r.attempt === 1);
  let initialCandidate = null; try { initialCandidate = initialPlan?.outputText ? JSON.parse(initialPlan.outputText) : null; } catch { /* raw evidence is preserved */ }
  const record = { schemaVersion: "guidance-pilot-session-evidence-v1", provenance: "REAL_MODEL_SYNTHETIC_INPUT", caseId: session.caseId, anonymousVariantId: session.anonymousVariantId,
    actualRuntimeVersion: catalog.catalogVersion, promptBundleVersion: catalog.promptBundleVersion, schemaSetVersion: catalog.schemaSetVersion,
    stageDispositions: [...repository.stageRuns.values()], events, entryDisposition: transport.requests.some(q => q.stageId === "PB-04") ? "admitted_to_product" : result?.eligibility ?? "technical_stop_before_product",
    initialDirection: initialCandidate?.selected_decision ?? null, initialCandidate, evaluatedPairs,
    reassessment: transport.requests.filter(q => q.input.quality_reassessment_directive).map(q => ({ stageId: q.stageId, attempt: q.attempt, directive: q.input.quality_reassessment_directive })),
    finalOutput: result, finalDeliveryDisposition: result?.eligibility === "ready" && !errorCode ? "ready_local_only" : result?.eligibility ?? "technical_stop",
    actualHttpCalls: transport.httpCalls, receivedUsage: transport.responses.map(r => ({ stageId: r.stageId, attempt: r.attempt, usage: r.usage })), findings: transport.findings,
    costRecords: ledger.calls.filter(c => c.sessionId === session.sessionId).map(c => ({ stageId: c.stageId, attempt: c.attempt, reservedNanos: c.reservedNanos, accounting: c.accounting ?? null, outcome: c.status })),
    errorCode, repository: { runs: [...repository.runs.values()], clarifications: [...repository.clarifications.values()], reports: [...repository.reports.values()], actualDatabaseCalls: repository.actualSupabaseCalls } };
  try { ledger.finish(session.sessionId, errorCode ? "failed" : "completed"); }
  catch (error) { record.errorCode = error.safeCode ?? "BUDGET_ACCOUNTING_FAILURE"; record.finalDeliveryDisposition = "technical_stop"; ledger.stop(record.errorCode); }
  durableJson(path.join(directory, "session.json"), record);
  return record;
}

export async function runAuthorizedPilot() {
  const config = await loadFrozenConfiguration();
  const apiKey = loadLocalKey(); // Presence already checked locally; no probe API.
  const parent = path.join(evalRoot, "runs"); mkdirSync(parent, { recursive: true });
  const runDirectory = path.join(parent, RUN_NAME);
  if (existsSync(runDirectory)) throw new PilotStop("ONE_SHOT_RUN_ALREADY_EXISTS");
  mkdirSync(runDirectory); acquireOneShotLock(runDirectory);
  const internal = path.join(runDirectory, "internal"); mkdirSync(internal);
  const mapping = Object.fromEntries(config.inputs.cases.map(c => [c.id, randomInt(2) ? { A: "current-v17", B: "candidate-v18" } : { A: "candidate-v18", B: "current-v17" }]));
  const sessions = config.plan.executionOrder.map(([caseId, arm]) => ({ sessionId: randomUUID(), caseId, arm, anonymousVariantId: Object.entries(mapping[caseId]).find(([,a]) => a === arm)[0] }));
  const manifest = { schemaVersion: "guidance-pilot8-authorized-manifest-v1", authorization: "Human authorization in this task: 8 sessions / USD2 / 72 HTTP / zero retries or extra samples", authorizedBaseline: AUTHORIZED_BASELINE,
    executionHead: config.executionHead, model: "gpt-5.6-luna", budgetNanos: 2 * USD_NANOS, maxHttpAttempts: 72, caps: config.plan.tokenCapsProposal,
    inputHash: hash(config.inputs), planHash: hash(config.plan), generation: config.plan.generation, prices: config.plan.prices,
    sessions, catalogs: Object.fromEntries(Object.entries(config.catalogs).map(([arm,c]) => [arm, { catalogVersion: c.catalogVersion, promptBundleVersion: c.promptBundleVersion, schemaSetVersion: c.schemaSetVersion,
      definitions: c.definitions.map(d => ({ stageId: d.stageId, promptVersion: d.promptVersion, promptHash: d.promptHash, schemaVersion: d.schemaVersion, schemaHash: d.schemaHash })) }])) };
  durableJson(path.join(internal, "mapping-SEALED-until-human-review.json"), { disclosureStatus: "HUMAN_REVIEW_PENDING_DO_NOT_DISPLAY", mapping });
  durableJson(path.join(internal, "manifest.json"), manifest);
  const ledger = new ReservationLedger(path.join(internal, "reservations.jsonl"), manifest, { create: true });
  const send = createLiveSender(apiKey), records = [];
  try {
    for (const session of sessions) {
      if (ledger.stopReason) break;
      const directory = path.join(internal, session.sessionId); mkdirSync(directory);
      const input = config.inputs.cases.find(c => c.id === session.caseId).input;
      records.push(await executeSession({ session, catalog: config.catalogs[session.arm], input, directory, ledger, send, frozenNow: config.plan.generation.frozenApplicationNow }));
      console.log(JSON.stringify({ sessionsFinished: records.length, totalSlots: 8, httpCalls: records.reduce((a,r) => a+r.actualHttpCalls,0), stopped: !!ledger.stopReason }));
    }
  } catch (error) { ledger.stop(error.safeCode ?? "EVALUATION_RUNNER_FAILURE"); }
  const summary = { ...ledger.summary(), totalSlots: 8, readyResults: records.filter(r => r.finalDeliveryDisposition === "ready_local_only").length,
    technicalFailures: records.filter(r => r.errorCode).map(r => r.errorCode), materialFindings: records.flatMap(r => r.findings.filter(f => f.stopReason).map(f => ({ stageId: f.stageId, reason: f.stopReason, findings: f.findings }))),
    humanReview: "PENDING_MAPPING_NOT_DISCLOSED", productionAuthorization: false, actualDatabaseCalls: 0, actualEmailCalls: 0 };
  durableJson(path.join(runDirectory, "technical-summary.json"), summary);
  await writeBlindArtifacts({ runDirectory, inputs: config.inputs, records, summary });
  // Human answers are separate, never inferred or corrected by this runner.
  writeFileSync(path.join(runDirectory, "human-review-status.json"), JSON.stringify({ status: "PENDING", answers: null, mappingDisclosed: false }, null, 2) + "\n", { flag: "wx" });
  console.log(JSON.stringify({ artifact: `${path.relative(root, runDirectory)}/blind-review.html`, ...summary }));
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  if (process.argv.length !== 3 || process.argv[2] !== "--execute-human-authorized-pilot8") { console.error("No execution: exact Human-authorized flag required."); process.exitCode = 1; }
  else try { await runAuthorizedPilot(); } catch (error) { console.error(JSON.stringify({ stopped: true, reason: error.safeCode ?? "EVALUATION_RUNNER_FAILURE", mappingDisclosed: false })); process.exitCode = 1; }
}
