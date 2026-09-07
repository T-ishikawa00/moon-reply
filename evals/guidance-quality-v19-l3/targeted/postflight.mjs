// Read-only receipt analysis plus new postflight artifacts. No Provider import.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { ReservationLedger } from "../../guidance-quality-wave1/real-pilot/budget.mjs";

const run = "evals/guidance-quality-v19-l3/runs/2026-09-08-gq29-p3-targeted";
const read = file => JSON.parse(fs.readFileSync(file, "utf8"));
const sha = file => createHash("sha256").update(fs.readFileSync(file)).digest("hex");
const writeNew = (name, value) => fs.writeFileSync(path.join(run, name), JSON.stringify(value, null, 2) + "\n", { flag: "wx" });
const manifest = read(path.join(run, "manifest.json")), execution = read(path.join(run, "execution-summary.json"));
assert.equal(execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim(), manifest.candidateHead);
assert.equal(execFileSync("git", ["diff", "--name-only", "HEAD"], { encoding: "utf8" }).trim(), "");
const preservation = read("evals/guidance-quality-v19-l3/preservation-manifest.json");
for (const [file, expected] of Object.entries(preservation.hashes)) assert.equal(sha(file), expected, file);
for (const [file, expected] of Object.entries(manifest.sourceHashes)) assert.equal(sha(file), expected, file);
const ledger = new ReservationLedger(path.join(run, "budget-ledger.jsonl"), manifest);
assert.deepEqual(ledger.summary(), execution.summary);
assert.equal(ledger.summary().actualHttpCalls, 4); assert.equal(ledger.summary().unknownUsageCalls, 0);
assert.equal(ledger.summary().stopReason, null); assert.ok(ledger.summary().reservedUsd < 0.15);
assert.equal(ledger.summary().completeCacheWriteUsage, true);
const reports = [], pairs = [];
for (const condition of ["V19-L2", "V19-L3"]) {
  const dir = path.join(run, condition), result = read(path.join(dir, "result.json"));
  assert.equal(result.initialDirection, "wait_and_reassess"); assert.equal(result.customerDelivery, false);
  assert.equal(result.finalDisposition, "diagnostic_stages_completed_pending_postflight");
  assert.deepEqual(result.manualInspections.flatMap(i => i.materialFindings), []);
  assert.deepEqual(result.rawActionFindings, []);
  const requests = fs.readdirSync(dir).filter(f => f.endsWith("-request.json")).map(f => ({ file: f, ...read(path.join(dir, f)) }));
  const q5 = requests.find(q => q.stageId === "PB-05"), q6 = requests.find(q => q.stageId === "PB-06");
  assert.equal(requests.length, 2); assert.equal(q5.attempt, 1); assert.equal(q6.attempt, 1);
  const raw = JSON.parse(result.pb05.outputText), evaluation = JSON.parse(result.pb06.outputText);
  assert.deepEqual(evaluation.semantic_checks, []);
  assert.deepEqual(q6.input.decision_plan, q5.input.decision_plan);
  assert.equal(result.pb05.returnedModel, manifest.model); assert.equal(result.pb06.returnedModel, manifest.model);
  const cap5 = read(path.join(dir, "PB-05-local-capture.json")), cap6 = read(path.join(dir, "PB-06-local-capture.json"));
  for (const capture of [cap5, cap6]) {
    assert.equal(capture.disposition, "captured"); assert.equal(capture.captureChecks.fixedPB05InputUnchanged, true);
    assert.equal(capture.captureChecks.fixedPlanUnchanged, true); assert.equal(capture.captureChecks.pb06ResponseGenerated, false);
    assert.equal(capture.captureChecks.actualProviderCalls, 0); assert.equal(capture.captureChecks.actualDatabaseCalls, 0);
    assert.equal(capture.captureChecks.repairCalls, 0);
  }
  const ownCalls = ledger.calls.filter(c => c.sessionId === result.sessionId);
  assert.equal(ownCalls.length, 2); assert.ok(ownCalls.every(c => c.dispatched && c.status === "received"));
  reports.push({ condition, pb05RequestInput: q5.input, pb06RequestInput: q6.input, raw });
  pairs.push({ condition, actualIdentity: manifest.identities[condition], finalDisposition: "targeted_diagnostic_observed_pass_with_style_reservations",
    notCustomerDelivery: true, rawEvaluatorFinalDisposition: evaluation.final_disposition,
    observedInputFacts: q5.input.base_structured_intake.observed_facts,
    factCorrespondence: raw.observed_fact_commentary.map(entry => ({ factId: entry.fact_id,
      inputFact: q5.input.base_structured_intake.observed_facts.find(f => f.fact_id === entry.fact_id)?.statement,
      pb05Wording: entry.commentary, pb06Interpretation: "No semantic finding emitted; PB06 supplied no positive explanatory verdict" })),
    decision: q5.input.decision_plan.selected_decision, pb05Reason: raw.decision_reason_summary,
    threeDayPlan: { frozenActions: q5.input.decision_plan.actions_to_take, pb05Aftercare: raw.aftercare_commentary, pb05ActionReasons: raw.action_rationales },
    rawPB06: evaluation, rawReportPath: `${condition}/${q5.file.replace("-request", "-response")}`,
    groundingChanges: Object.keys(raw).filter(k => JSON.stringify(raw[k]) !== JSON.stringify(q6.input.report_content[k])).map(k => ({ field: k, raw: raw[k], applicationGrounded: q6.input.report_content[k] })),
    usage: { input: ownCalls.reduce((n,c) => n + c.accounting.inputTokens, 0), outputIncludingReasoning: ownCalls.reduce((n,c) => n + c.accounting.outputTokens, 0),
      reasoningIncluded: ownCalls.reduce((n,c) => n + c.accounting.reasoningTokens, 0), cachedInput: ownCalls.reduce((n,c) => n + c.accounting.cachedTokens, 0),
      cacheWriteInput: ownCalls.reduce((n,c) => n + c.accounting.cacheWriteTokens, 0),
      usagePricedUsd: ownCalls.reduce((n,c) => n + c.accounting.lowerNanos, 0) / 1e9,
      usagePricedUpperUsd: ownCalls.reduce((n,c) => n + c.accounting.upperNanos, 0) / 1e9 },
    observations: result.manualInspections.flatMap(i => i.observations ?? []) });
}
assert.deepEqual(reports[0].pb05RequestInput, reports[1].pb05RequestInput);
assert.deepEqual(reports[0].pb06RequestInput.decision_plan, reports[1].pb06RequestInput.decision_plan);
const verified = { schemaVersion: "gq29-targeted-postflight-v1", verification: "PASS", realModelStageCalls: 4, unchangedHistoricalFiles: Object.keys(preservation.hashes).length,
  executionSourceHashesUnchanged: true, sharedLedgerReloadMatches: true, identicalPB05Inputs: true, identicalFrozenPlans: true,
  summary: ledger.summary(), conditions: pairs,
  manualSemanticReview: { reviewers: ["primary agent", "independent read-only source reviewer"], humanPreferenceReview: false,
    basis: "Full raw receipts plus input and unchanged Application grounding; not word-count/keyword scoring",
    observedMaterialFactStrengthening: { "V19-L2": false, "V19-L3": false },
    reasoning: "Opportunity/room to reply describes the answerable question sent by the user, not confirmed recipient delivery, reading, understanding or intentional silence. Neither report relies on such stronger facts.",
    l3MinorReservations: ["その後の3日間 has a less clear start than the requested 今後3日間; no fixed send date or missing period plan", "F101 きっかけ/余地 overlaps; cover 新しい動き/余白 is abstract; uncertainty/reason explanations repeat"],
    l3ExcessReceiptCaveatAdded: false, l3ConcreteDirectionRetained: true,
    safetyLimit: "No material Safety/boundary issue in this one fixed case; an explicit refusal case and full entrance-to-delivery regressions were not newly generated here.",
    attributionLimit: "The old L2 defect did not recur in this new L2 sample. L3 meets the targeted observation, but a causal reduction in failure rate is not established." },
  nextStep: "May proceed to a separately authorized Fresh Blind Pilot as further verification; no new API execution authorized by this postflight",
  historicalBlindMappingDisclosed: false, priorStoppedRunStillIncomplete: true, retries: 0, repairs: 0, additionalSamples: 0, productionChanges: 0, push: 0, deploy: 0 };
writeNew("postflight-evidence.json", verified);
const frozenFiles = fs.readdirSync(run, { recursive: true }).map(String).filter(f => fs.statSync(path.join(run, f)).isFile());
writeNew("evidence-hashes.json", { algorithm: "sha256/raw-bytes", files: Object.fromEntries(frozenFiles.map(f => [f.replaceAll("\\", "/"), sha(path.join(run, f))])) });
console.log(JSON.stringify({ verification: "PASS", unchangedHistoricalFiles: verified.unchangedHistoricalFiles, summary: verified.summary, costs: pairs.map(p => ({ condition: p.condition, ...p.usage })) }));
