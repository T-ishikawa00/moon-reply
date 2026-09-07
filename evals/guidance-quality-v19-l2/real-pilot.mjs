// Fresh Human-authorized profile. Reuses all execution, HTTP, budget and UI
// mechanics; no Production/runtime changes and no historical run data reads.
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { loadM2P4FinalProductRecoveryRuntimeStageCatalog } from "../../lib/assessment/runtime/schema-catalog.ts";
import { loadV19L2StageCatalog } from "../../lib/assessment/runtime/v19-l2-stage-catalog.ts";
import { runConfiguredPilot } from "../guidance-quality-wave1/real-pilot/runner.mjs";
import { PilotStop, hash, reserveNanos } from "../guidance-quality-wave1/real-pilot/budget.mjs";
import { reviewReceipt as inspectReceipt } from "../guidance-quality-v19-l1/real-pilot.mjs";

export const CANDIDATE_HEAD = "64a1321477c5b76ed946ad8ecbe0dda888f9390f";
export const RUN_NAME = "2026-09-07-authorized-pilot8-v19-l2";
const root = fileURLToPath(new URL("../../", import.meta.url));
const entryRoot = "evals/guidance-quality-v19-l2/";
export const allowedEvaluationFiles = ["real-pilot.mjs", "verify-real-pilot.mjs", "postflight-real-pilot.mjs", "pilot-authorization.md", "execution-prices.json", "execution-verification.json"].map(p => entryRoot + p);
const read = p => JSON.parse(readFileSync(path.join(root, p), "utf8"));
const git = args => execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();
const textHash = p => hash(readFileSync(path.join(root, p), "utf8").replace(/\r\n/gu, "\n"));

export async function loadV19L2PilotConfiguration() {
  if (path.resolve(process.cwd()) !== path.resolve(root)) throw new PilotStop("WRONG_CHECKOUT");
  if (git(["rev-parse", "HEAD"]) !== CANDIDATE_HEAD || git(["branch", "--show-current"]) !== "release/private-ready") throw new PilotStop("AUTHORIZED_CANDIDATE_HEAD_MISMATCH");
  const changed = [...new Set([...git(["diff", "--name-only", "HEAD"]).split("\n"), ...git(["ls-files", "--others", "--exclude-standard"]).split("\n")].filter(Boolean))];
  if (changed.some(p => !allowedEvaluationFiles.includes(p))) throw new PilotStop("UNAUTHORIZED_EXECUTION_SOURCE_CHANGE");
  // Even the preparation plan and every tracked old artifact stay unchanged.
  if (git(["diff", "--name-only", "HEAD"])) throw new PilotStop("AUTHORIZED_TRACKED_SOURCE_CHANGED");
  if (existsSync(path.join(root, entryRoot, "runs", RUN_NAME))) throw new PilotStop("ONE_SHOT_RUN_ALREADY_EXISTS");
  const prepared = read(entryRoot + "pilot-plan.json"), inputs = read(prepared.inputSource), prices = read(entryRoot + "execution-prices.json");
  assert.equal(prepared.status, "NOT_AUTHORIZED_NOT_RUN");
  assert.equal(textHash(prepared.inputSource), prepared.inputSourceSha256);
  assert.deepEqual(inputs.cases.map(c => c.id), ["GQ-05", "GQ-24", "GQ-13", "GQ-29-P3"]);
  for (const c of inputs.cases) {
    assert.equal(c.input.optionalMessage, null);
    assert.deepEqual(Object.keys(c.input).sort(), ["currentSituation", "optionalMessage", "relationship", "requestedTopics"]);
  }
  assert.equal(prepared.model, "gpt-5.6-luna"); assert.equal(prepared.maxTotalSessions, 8); assert.equal(prepared.maxHttpAttempts, 72); assert.equal(prepared.proposedBudgetUsd, 2);
  assert.equal(prepared.generation.reasoningEffort, "low"); assert.equal(prepared.generation.serviceTier, "default");
  assert.equal(prepared.productGenerationAttempts, 2); assert.equal(prepared.samplesPerArmCase, 1);
  for (const field of ["transportRetries", "applicationProviderRetries", "attempt3", "additionalSamples", "maximumClarificationAnswers"]) assert.equal(prepared[field], 0);
  assert.equal(prepared.executionOrder.length, 8);
  for (const c of inputs.cases) for (const arm of ["current-v17", "candidate-v19-l2"]) assert.equal(prepared.executionOrder.filter(([id,a]) => id === c.id && a === arm).length, 1);
  assert.equal(prepared.tokenCapsProposal.reduce((n,c) => n + reserveNanos(c) * c.invocationsPerSession, 0) * 8, 1_533_011_200);
  assert.equal(prices.status, "VERIFIED_PUBLIC_OFFICIAL_BEFORE_EXECUTION");
  assert.equal(prices.model, prepared.model); assert.equal(prices.serviceTier, "default");
  assert.deepEqual(prices.perMillionTokens, prepared.prices.perMillionTokens);
  const catalogs = { "current-v17": await loadM2P4FinalProductRecoveryRuntimeStageCatalog(), "candidate-v19-l2": await loadV19L2StageCatalog() };
  const candidate = catalogs["candidate-v19-l2"];
  assert.equal(catalogs["current-v17"].catalogVersion, "runtime-stage-catalog-v17.0.0");
  assert.equal(candidate.catalogVersion, "runtime-stage-catalog-v20.0.0");
  assert.equal(candidate.promptBundleVersion, "prompt-bundle-runtime-v20.0.0");
  assert.equal(candidate.schemaSetVersion, "pipeline-schema-runtime-v6.0.0");
  assert.equal(candidate.definitions.find(d => d.stageId === "PB-06").promptVersion, "v9.0.0");
  assert.deepEqual(candidate.definitions.map(d => ({ stageId: d.stageId, promptVersion: d.promptVersion, promptHash: d.promptHash, schemaVersion: d.schemaVersion, schemaHash: d.schemaHash, schemaName: d.schemaName })), read(entryRoot + "catalog-identity.json").definitions);
  const plan = { ...prepared, status: "HUMAN_AUTHORIZED_V19_L2_FRESH_ONCE", executionCandidateHead: CANDIDATE_HEAD, costApproval: "HUMAN_AUTHORIZED_USD2_HARD_CAP",
    prices: { ...prepared.prices, verifiedAt: prices.verifiedAt, provenance: prices.provenance, requiresRecheckBeforeAuthorizedRun: false } };
  const sources = [...allowedEvaluationFiles, entryRoot + "pilot-plan.json", entryRoot + "catalog-identity.json", prepared.inputSource,
    "evals/guidance-quality-wave1/real-pilot/runner.mjs", "evals/guidance-quality-wave1/real-pilot/transport.mjs", "evals/guidance-quality-wave1/real-pilot/budget.mjs",
    "evals/guidance-quality-wave1/real-pilot/review.mjs", "evals/guidance-quality-v19-l1/real-pilot.mjs"].filter(p => existsSync(path.join(root,p)));
  return { plan, inputs, catalogs, authorizedBaseline: CANDIDATE_HEAD, executionHead: CANDIDATE_HEAD,
    runName: RUN_NAME, evaluationRoot: path.join(root, entryRoot), candidateArm: "candidate-v19-l2",
    evaluationSourceHashes: Object.fromEntries(sources.map(p => [p, textHash(p)])) };
}

// The new authorization stops every raw major/critical ACTION_CONSISTENCY,
// including one the unchanged runtime classifier would ignore as temporal.
// This is evaluation termination only, never a production classifier override.
export async function reviewReceipt(receipt) {
  if (receipt.stageId === "PB-06") {
    const output = JSON.parse(receipt.received.outputText);
    const findings = output.semantic_checks.filter(f => f.finding_code === "ACTION_CONSISTENCY" && ["major", "critical"].includes(f.severity));
    if (findings.length) {
      const error = new PilotStop("MATERIAL_MANUAL_INTEGRITY_OR_SAFETY");
      error.inspectionReason = "Authorized raw PB06 ACTION_CONSISTENCY major/critical STOP before repair, regardless of classifier disposition.";
      throw error;
    }
  }
  return inspectReceipt(receipt);
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  if (process.argv.length !== 3 || process.argv[2] !== "--execute-human-authorized-v19-l2-pilot8") { console.error("Exact fresh authorization flag required; no API invoked."); process.exitCode = 1; }
  else try { const config = await loadV19L2PilotConfiguration(); await runConfiguredPilot({ ...config, reviewReceipt }); }
  catch (error) { console.error(JSON.stringify({ stopped: true, reason: error.safeCode ?? "EVALUATION_RUNNER_FAILURE", mappingDisclosed: false })); process.exitCode = 1; }
}
