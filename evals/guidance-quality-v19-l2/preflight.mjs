// Preparation only: read local catalogs and fixed synthetic input; never import
// the live runner, inspect credentials, create a real run, or dispatch HTTP.
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { loadM2P4FinalProductRecoveryRuntimeStageCatalog } from "../../lib/assessment/runtime/schema-catalog.ts";
import { loadV19L1StageCatalog } from "../../lib/assessment/runtime/v19-l1-stage-catalog.ts";
import { loadV19L2StageCatalog } from "../../lib/assessment/runtime/v19-l2-stage-catalog.ts";
import { projectBaseProviderInputV1 } from "../../lib/assessment/runtime/base-structured-intake-grounding-v1.ts";
import { buildBody } from "../guidance-quality-wave1/real-pilot/transport.mjs";
import { hash, reserveNanos } from "../guidance-quality-wave1/real-pilot/budget.mjs";

const read = p => JSON.parse(readFileSync(p, "utf8"));
const normalizedHash = p => hash(readFileSync(p, "utf8").replace(/\r\n/gu, "\n"));
const prefix = "evals/guidance-quality-v19-l2/";
const previousFetch = globalThis.fetch;
let networkCalls = 0;
globalThis.fetch = async () => { networkCalls++; throw new Error("LOCAL_ONLY_NETWORK_FORBIDDEN"); };
try {
  const plan = read(prefix + "pilot-plan.json"), identity = read(prefix + "catalog-identity.json");
  const inputs = read(plan.inputSource);
  const [baseline, predecessor, candidate] = await Promise.all([
    loadM2P4FinalProductRecoveryRuntimeStageCatalog(), loadV19L1StageCatalog(), loadV19L2StageCatalog(),
  ]);
  assert.equal(plan.status, "NOT_AUTHORIZED_NOT_RUN");
  assert.equal(plan.executionCandidateHead, null);
  assert.equal(plan.costApproval, "REQUIRED_SEPARATELY");
  assert.equal(plan.blind.mappingStatus, "NOT_CREATED");
  assert.equal(existsSync(prefix + "runs"), false, "Preparation must not create real run state");
  assert.equal(existsSync(prefix + "real-pilot.mjs"), false, "No live entry exists before fresh authorization");
  assert.equal(plan.inputSourceSha256, normalizedHash(plan.inputSource));
  assert.deepEqual(inputs.cases.map(c => c.id), ["GQ-05", "GQ-24", "GQ-13", "GQ-29-P3"]);
  for (const c of inputs.cases) {
    assert.deepEqual(Object.keys(c.input).sort(), ["currentSituation", "optionalMessage", "relationship", "requestedTopics"]);
    assert.equal(c.input.optionalMessage, null);
    for (const arm of plan.arms) assert.equal(plan.executionOrder.filter(([id, a]) => id === c.id && a === arm).length, 1);
  }
  assert.equal(plan.executionOrder.length, 8);
  assert.equal(plan.maxTotalSessions, 8); assert.equal(plan.samplesPerArmCase, 1);
  assert.equal(plan.maxHttpAttempts, 72); assert.equal(plan.proposedBudgetUsd, 2);
  assert.equal(plan.productGenerationAttempts, 2);
  for (const field of ["transportRetries", "applicationProviderRetries", "attempt3", "additionalSamples", "maximumClarificationAnswers", "actualApiCalls", "actualApiCostUsd"]) assert.equal(plan[field], 0);
  assert.equal(plan.model, "gpt-5.6-luna");
  assert.deepEqual(plan.generation, read("evals/guidance-quality-wave1/pilot-plan.json").generation);
  assert.equal(baseline.catalogVersion, plan.currentCatalog);
  assert.equal(candidate.catalogVersion, plan.candidateCatalog);
  assert.equal(candidate.promptBundleVersion, plan.candidatePromptBundle);
  assert.equal(candidate.schemaSetVersion, plan.candidateSchemaSet);
  assert.deepEqual(identity.definitions, candidate.definitions.map(d => ({ stageId: d.stageId,
    promptVersion: d.promptVersion, promptHash: d.promptHash, schemaVersion: d.schemaVersion, schemaHash: d.schemaHash, schemaName: d.schemaName })));
  for (const d of candidate.definitions) {
    const old = predecessor.definitions.find(p => p.stageId === d.stageId);
    if (d.stageId !== "PB-06") assert.deepEqual(d, old);
    else { assert.notEqual(d.promptHash, old.promptHash); assert.equal(d.schemaHash, old.schemaHash); }
  }
  const caps = plan.tokenCapsProposal;
  assert.deepEqual(caps.map(c => [c.stage, c.invocationsPerSession, c.input, c.outputIncludingReasoning]), [
    ["PB-01", 1, 42000, 8192], ["PB-01C", 0, 0, 0], ["PB-02", 1, 24000, 3072], ["PB-03", 1, 24000, 2048],
    ["PB-04", 2, 48000, 8192], ["PB-05", 2, 64000, 8192], ["PB-06", 2, 96000, 4096],
  ]);
  assert.equal(caps.reduce((n, c) => n + c.invocationsPerSession, 0) * 8, 72);
  const worstCaseNanos = caps.reduce((n, c) => n + reserveNanos(c) * c.invocationsPerSession, 0) * 8;
  assert.equal(worstCaseNanos, 1_533_011_200);
  assert.equal(plan.worstCase.usd, worstCaseNanos / 1e9);
  const byteChecks = [];
  const checkSize = (catalog, stageId, input, label, provenance) => {
    const definition = catalog.definitions.find(d => d.stageId === stageId), cap = caps.find(c => c.stage === stageId);
    const body = buildBody({ ...definition, input }, cap);
    assert.equal(body.model, plan.model); assert.equal(body.reasoning.effort, "low"); assert.equal(body.service_tier, "default");
    const inputCeiling = Buffer.byteLength(JSON.stringify(body), "utf8") + plan.tokenCounting.framingReserveTokens;
    assert.ok(inputCeiling <= cap.input, `${stageId} full request exceeds reserved input cap`);
    byteChecks.push({ label, stageId, catalog: catalog.catalogVersion, inputCeiling, cap: cap.input, provenance });
  };
  for (const catalog of [baseline, candidate]) for (const c of inputs.cases) checkSize(catalog, "PB-01",
    { run_mode: "initial_base", base_provider_input: projectBaseProviderInputV1(c.input) }, c.id, "FIXED_SYNTHETIC_INPUT_REQUEST_SIZE_ONLY");
  // The old saved request is a diagnostic local-size fixture only. It is never
  // an input/output for any session of the future fresh Human comparison.
  const evidence = read("evals/guidance-quality-r1/gq24-action-consistency/evidence.json");
  const saved = read(evidence.sources.pb06Input.path);
  assert.equal(hash(saved), evidence.sources.pb06Input.canonicalJsonSha256);
  for (const catalog of [baseline, candidate]) checkSize(catalog, "PB-06", saved.input,
    "SAVED_GQ24_LOCAL_SIZE_ONLY", "HISTORICAL_REQUEST_REUSED_OFFLINE_ONLY_NOT_NEW_COMPARISON_DATA");
  const status = read(plan.historicalRunDisposition);
  assert.equal(status.status, "diagnostic-only / incomplete");
  assert.equal(status.comparisonUse, "EXCLUDED_FROM_HUMAN_QUALITY_COMPARISON");
  assert.equal(status.originalTechnicalSummarySha256, normalizedHash("evals/guidance-quality-v19-l1/runs/2026-09-07-authorized-pilot8-v19-l1/technical-summary.json"));
  assert.equal(status.futureRun.reuseOldSessions, false); assert.equal(status.futureRun.reuseOldMapping, false);
  assert.equal(networkCalls, 0);
  console.log(JSON.stringify({ status: "PASS", preparationOnly: true, actualApiCalls: 0, actualCostUsd: 0,
    credentialReads: 0, productionOperations: 0, freshRunCreated: false, freshMappingCreated: false,
    maxSessions: 8, maxHttpAttempts: 72, hardCapUsd: 2, worstCaseReservationUsd: worstCaseNanos / 1e9,
    byteChecks, limitation: "Local request size and identity checks, not fresh real-model quality or future API authorization." }, null, 2));
} finally { globalThis.fetch = previousFetch; }
