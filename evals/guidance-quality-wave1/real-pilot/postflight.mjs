// Read-only evidence verification. No client, key, retry or generation path.
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { accountUsage, hash, ReservationLedger } from "./budget.mjs";

const run = fileURLToPath(new URL("../runs/2026-09-07-authorized-pilot8/", import.meta.url));
const read = file => JSON.parse(readFileSync(file, "utf8"));
const internal = path.join(run, "internal");
const manifest = read(path.join(internal, "manifest.json"));
const summary = read(path.join(run, "technical-summary.json"));
const ledger = new ReservationLedger(path.join(internal, "reservations.jsonl"), manifest);
const frozenInputs = read(fileURLToPath(new URL("../pilot-inputs.json", import.meta.url)));
assert.equal(manifest.inputHash, hash(frozenInputs));
assert.equal(manifest.budgetNanos, 2e9);
assert.equal(manifest.maxHttpAttempts, 72);
assert.equal(manifest.model, "gpt-5.6-luna");
for (const [key, value] of Object.entries(ledger.summary())) assert.deepEqual(summary[key], value);
assert.equal(summary.sessionsCompleted, 8);
assert.equal(summary.actualHttpCalls, 36);
assert.equal(summary.stopReason, null);
assert.equal(summary.unknownUsageCalls, 0);
assert.equal(summary.completeCacheWriteUsage, true);

const records = manifest.sessions.map(session => read(path.join(internal, session.sessionId, "session.json")));
const mapping = read(path.join(internal, "mapping-SEALED-until-human-review.json"));
assert.equal(mapping.disclosureStatus, "HUMAN_REVIEW_PENDING_DO_NOT_DISPLAY");
for (const c of frozenInputs.cases) {
  const sessions = manifest.sessions.filter(s => s.caseId === c.id);
  assert.equal(sessions.length, 2);
  assert.deepEqual(sessions.map(s => s.arm).sort(), ["candidate-v18", "current-v17"]);
  assert.deepEqual(sessions.map(s => s.anonymousVariantId).sort(), ["A", "B"]);
  for (const s of sessions) assert.equal(mapping.mapping[c.id][s.anonymousVariantId], s.arm);
}

let requestCount = 0, receiptCount = 0, reviewCount = 0;
const stages = {};
const totals = { inputTokens: 0, outputTokens: 0, cachedTokens: 0, cacheWriteTokens: 0, reasoningTokens: 0 };
for (const call of ledger.calls) {
  assert.equal(call.dispatched, true);
  assert.equal(call.attempt, 1);
  const prefix = path.join(internal, call.sessionId, `call-${String(call.sequence).padStart(3, "0")}`);
  const request = read(prefix + "-request.json"); requestCount++;
  const response = read(prefix + "-response.json"); receiptCount++;
  const review = read(prefix + "-review.json"); reviewCount++;
  assert.equal(request.requestHash, call.requestHash);
  assert.equal(request.inputCeiling, call.inputCeiling);
  assert.equal(response.status, "completed");
  assert.equal(response.returnedModel, manifest.model);
  assert.equal(response.serviceTier, "default");
  assert.equal(review.stopReason, null);
  const cap = manifest.caps.find(c => c.stage === call.stageId);
  assert.deepEqual(accountUsage(response.usage, cap, call.inputCeiling), call.accounting);
  const session = manifest.sessions.find(s => s.sessionId === call.sessionId);
  const record = records.find(r => r.caseId === session.caseId && r.anonymousVariantId === session.anonymousVariantId);
  const savedResponse = record.receivedUsage.find(r => r.stageId === call.stageId && r.attempt === call.attempt);
  assert.deepEqual(savedResponse.usage, response.usage);
  const catalog = manifest.catalogs[session.arm];
  const definition = catalog.definitions.find(d => d.stageId === call.stageId);
  assert.equal(record.actualRuntimeVersion, catalog.catalogVersion);
  assert.equal(request.promptHash, definition.promptHash);
  assert.equal(request.schemaHash, definition.schemaHash);
  stages[call.stageId] = (stages[call.stageId] ?? 0) + 1;
  for (const key of Object.keys(totals)) totals[key] += call.accounting[key];
}
for (const key of ["inputTokens", "outputTokens", "cachedTokens", "reasoningTokens"]) assert.equal(totals[key], summary[key]);
assert.deepEqual(stages, { "PB-01": 8, "PB-02": 8, "PB-03": 8, "PB-04": 4, "PB-05": 4, "PB-06": 4 });
assert.equal(records.filter(r => r.initialCandidate).length, 4);
assert.equal(records.reduce((n, r) => n + r.evaluatedPairs.length, 0), 4);
assert.equal(records.reduce((n, r) => n + r.reassessment.length, 0), 0);
assert.equal(records.filter(r => r.finalDeliveryDisposition === "ready_local_only").length, 4);
assert.equal(records.filter(r => r.finalDeliveryDisposition === "needs_more_information").length, 4);
assert.equal(records.filter(r => r.errorCode).length, 0);
assert.equal(records.reduce((n, r) => n + r.repository.actualDatabaseCalls, 0), 0);

const publicHtml = readFileSync(path.join(run, "blind-review.html"), "utf8");
const publicMd = readFileSync(path.join(run, "blind-review.md"), "utf8");
const forbidden = /runtime-stage-catalog|current-v17|candidate-v18|actualRuntimeVersion|pipeline-schema-runtime|mapping-SEALED|\bV1[78]\b/u;
assert.equal(forbidden.test(publicHtml + publicMd), false);
assert.equal((publicHtml.match(/<section class="case">/gu) ?? []).length, 4);
assert.equal((publicHtml.match(/class="output-label"/gu) ?? []).length, 8);
assert.equal((publicHtml.match(/<form data-case=/gu) ?? []).length, 4);
assert.equal(/<input[^>]*\bchecked\b/u.test(publicHtml), false);
assert.equal(/<textarea[^>]*>[^<]+<\/textarea>/u.test(publicHtml), false);
assert.deepEqual(read(path.join(run, "human-review-status.json")), { status: "PENDING", answers: null, mappingDisclosed: false });
let filesScanned = 0;
function scan(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) scan(file);
    else {
      filesScanned++;
      const text = readFileSync(file, "utf8");
      // Count-only failure: never include an offending match or secret value.
      assert.equal(/\bsk-[A-Za-z0-9_-]{20,}|Bearer\s+[A-Za-z0-9._-]{20,}/u.test(text), false, "credential pattern found in evidence");
    }
  }
}
scan(run);
console.log(JSON.stringify({ verification: "PASS", mode: "READ_ONLY_NO_API", requestCount, receiptCount, reviewCount, stages, totals, reservedUsd: summary.reservedUsd, actualUsageCostUsd: summary.usageBasedCostUpperUsd, initialCandidates: 4, assessedPairs: 4, repairs: 0, ready: 4, clarification: 4, filesScanned, credentialPatternMatches: 0, mappingDisplayed: false, humanAnswersChanged: false }));
