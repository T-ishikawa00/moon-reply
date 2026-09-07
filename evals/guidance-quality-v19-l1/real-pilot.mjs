// V19-L1 authorized profile only. Reuses the previous runner, HTTP transport,
// durable reservation ledger and four-question blind UI. No runtime mutations.
import { readFileSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { setTimeout as sleep } from "node:timers/promises";
import { loadM2P4FinalProductRecoveryRuntimeStageCatalog } from "../../lib/assessment/runtime/schema-catalog.ts";
import { loadV19L1StageCatalog } from "../../lib/assessment/runtime/v19-l1-stage-catalog.ts";
import { PilotStop, hash, reserveNanos } from "../guidance-quality-wave1/real-pilot/budget.mjs";
import { durableJson } from "../guidance-quality-wave1/real-pilot/transport.mjs";
import { runConfiguredPilot } from "../guidance-quality-wave1/real-pilot/runner.mjs";

export const CANDIDATE_HEAD = "f5e5dc34b1a35a45652b2fd3f458ec04a541ecc6";
export const RUN_NAME = "2026-09-07-authorized-pilot8-v19-l1";
const root = fileURLToPath(new URL("../../", import.meta.url));
const priorRoot = "evals/guidance-quality-wave1/";
const entryRoot = "evals/guidance-quality-v19-l1/";
const read = relative => JSON.parse(readFileSync(path.join(root, relative), "utf8"));
const git = args => execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();
const allowedChanges = [
  `${priorRoot}real-pilot/runner.mjs`, `${priorRoot}real-pilot/transport.mjs`,
  `${entryRoot}real-pilot.mjs`, `${entryRoot}verify-real-pilot.mjs`, `${entryRoot}postflight-real-pilot.mjs`,
  `${entryRoot}pilot-authorization.md`,
];

export async function loadV19PilotConfiguration() {
  if (path.resolve(process.cwd()) !== path.resolve(root)) throw new PilotStop("WRONG_CHECKOUT");
  if (git(["rev-parse", "HEAD"]) !== CANDIDATE_HEAD || git(["branch", "--show-current"]) !== "release/private-ready") throw new PilotStop("AUTHORIZED_CANDIDATE_HEAD_MISMATCH");
  // Preserve the exact candidate commit during execution. Only the enumerated
  // evaluation files may be uncommitted; their full hashes enter the manifest.
  const changed = [...new Set([
    ...git(["diff", "--name-only", "HEAD"]).split("\n"),
    ...git(["ls-files", "--others", "--exclude-standard"]).split("\n"),
  ].filter(Boolean))];
  if (changed.some(p => !allowedChanges.includes(p))) throw new PilotStop("UNAUTHORIZED_EXECUTION_SOURCE_CHANGE");
  const prior = read(`${priorRoot}pilot-plan.json`), inputs = read(`${priorRoot}pilot-inputs.json`);
  const ids = ["GQ-05", "GQ-24", "GQ-13", "GQ-29-P3"];
  if (JSON.stringify(inputs.cases.map(c => c.id)) !== JSON.stringify(ids) || inputs.cases.some(c => c.input.optionalMessage !== null)) throw new PilotStop("AUTHORIZED_CASES_CHANGED");
  const plan = { ...prior, status: "HUMAN_AUTHORIZED_V19_L1_ONCE", candidateCatalog: "runtime-stage-catalog-v19.0.0", candidateSchemaSet: "pipeline-schema-runtime-v6.0.0",
    preparationBaseline: CANDIDATE_HEAD, arms: ["current-v17", "candidate-v19"],
    // This reservation ceiling is not a model setting. Both arms reserve the
    // same larger PB01 input bound; byte counting and generation stay unchanged.
    tokenCapsProposal: prior.tokenCapsProposal.map(cap => cap.stage === "PB-01" ? { ...cap, input: 42_000 } : cap),
    executionOrder: prior.executionOrder.map(([id, arm]) => [id, arm === "candidate-v18" ? "candidate-v19" : arm]) };
  if (plan.model !== "gpt-5.6-luna" || plan.maxTotalSessions !== 8 || plan.maxHttpAttempts !== 72 || plan.proposedBudgetUsd !== 2 ||
    plan.generation.reasoningEffort !== "low" || plan.generation.serviceTier !== "default" || plan.maximumClarificationAnswers !== 0 ||
    plan.transportRetries !== 0 || plan.applicationProviderRetries !== 0 || plan.productGenerationAttempts !== 2 || plan.samplesPerArmCase !== 1 ||
    plan.executionOrder.length !== 8 || new Set(plan.executionOrder.map(x => JSON.stringify(x))).size !== 8 ||
    plan.executionOrder.some(([id, arm]) => !ids.includes(id) || !plan.arms.includes(arm)) ||
    plan.tokenCapsProposal.reduce((n,c) => n + reserveNanos(c) * c.invocationsPerSession, 0) * 8 !== 1_533_011_200) throw new PilotStop("AUTHORIZED_PLAN_CHANGED");
  const catalogs = { "current-v17": await loadM2P4FinalProductRecoveryRuntimeStageCatalog(), "candidate-v19": await loadV19L1StageCatalog() };
  if (catalogs["current-v17"].catalogVersion !== plan.currentCatalog || catalogs["candidate-v19"].catalogVersion !== plan.candidateCatalog ||
    catalogs["candidate-v19"].schemaSetVersion !== plan.candidateSchemaSet) throw new PilotStop("RUNTIME_CONTRACT_IDENTITY_MISMATCH");
  const sources = [...allowedChanges, `${priorRoot}real-pilot/budget.mjs`, `${priorRoot}real-pilot/review.mjs`, `${priorRoot}pilot-plan.json`, `${priorRoot}pilot-inputs.json`].filter(p => existsSync(path.join(root,p)));
  return { plan, inputs, catalogs, authorizedBaseline: CANDIDATE_HEAD, executionHead: CANDIDATE_HEAD,
    runName: RUN_NAME, evaluationRoot: path.join(root,entryRoot), candidateArm: "candidate-v19",
    evaluationSourceHashes: Object.fromEntries(sources.map(p => [p, hash(readFileSync(path.join(root,p),"utf8").replace(/\r\n/gu,"\n"))])) };
}

// Agent-operated local checkpoint, not another Human review or model call.
// Resume is a one-time local decision for this receipt; it cannot retry a call.
export async function reviewReceipt({ session, stageId, attempt, prefix, received }) {
  const decisionPath = prefix + "-inspection-decision.json";
  const receiptHash = hash(received);
  durableJson(prefix + "-inspection-required.json", { caseId: session.caseId, anonymousVariantId: session.anonymousVariantId, stageId, attempt,
    receiptHash, responsePath: path.basename(prefix) + "-response.json", criteria: "Material facts, source/meaning, certainty, contact boundaries, current action contradictions. Style/completeness may use existing repair. No expected direction or Human preference." });
  console.log(JSON.stringify({ inspectionPending: true, stageId, checkpoint: path.relative(root, prefix) }));
  const deadline = Date.now() + 30 * 60_000;
  while (!existsSync(decisionPath)) {
    if (Date.now() > deadline) throw new PilotStop("LOCAL_INSPECTION_TIMEOUT");
    await sleep(500);
  }
  const decision = JSON.parse(readFileSync(decisionPath,"utf8"));
  if (!decision || decision.receiptHash !== receiptHash || decision.stageId !== stageId || decision.attempt !== attempt ||
    typeof decision.reason !== "string" || !decision.reason.trim() || !["continue", "stop"].includes(decision.action)) throw new PilotStop("LOCAL_INSPECTION_INVALID");
  if (decision.action === "stop") {
    const error = new PilotStop("MATERIAL_MANUAL_INTEGRITY_OR_SAFETY"); error.inspectionReason = decision.reason; throw error;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  if (process.argv.length !== 3 || process.argv[2] !== "--execute-human-authorized-v19-pilot8") { console.error("Exact authorized flag required; no API invoked."); process.exitCode = 1; }
  else try { const config = await loadV19PilotConfiguration(); await runConfiguredPilot({ ...config, reviewReceipt }); }
  catch (error) { console.error(JSON.stringify({ stopped: true, reason: error.safeCode ?? "EVALUATION_RUNNER_FAILURE", mappingDisclosed: false })); process.exitCode = 1; }
}
