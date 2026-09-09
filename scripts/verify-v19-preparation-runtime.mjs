// Offline runtime contract regression. Existing evidence is read, never rewritten.
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { verifyV19L5Intent } from "../evals/guidance-quality-v19-l5/verify-intent.mjs";
import { create0036MessageFixture } from "./lib/paid-delivery-step5a1-0036-message-fixture.mjs";
import { V19L5LocalApplication } from "../lib/assessment/runtime/v19-l5-application.ts";
import { loadV19L5StageCatalog } from "../lib/assessment/runtime/v19-l5-stage-catalog.ts";
import { validateClarificationAnswerV1 } from "../lib/assessment/runtime/clarification-evidence-v1.ts";
import { validateV19PreparationClarificationEvidence } from "../lib/assessment/production/v19-preparation-contract.ts";
import { hashJson } from "../lib/assessment/runtime/hash.ts";

const startedAt = new Date().toISOString(), checks = [], originalFetch = globalThis.fetch;
let networkAttempts = 0;
globalThis.fetch = async () => { networkAttempts++; throw new Error("OFFLINE_ONLY"); };
try {
  const existing = await verifyV19L5Intent();
  assert.equal(existing.status, "PASS"); assert.equal(existing.applicationCovered, true);
  checks.push({ id: "existing-submit-and-original-message-continuation", assertions: existing.assertionsPassed, status: "PASS" });
  const fixture = create0036MessageFixture({ missingOriginal: true });
  const at = "2026-09-09T00:00:00.000Z", catalog = await loadV19L5StageCatalog();
  const options = { catalog, transport: fixture.transport, now: () => at, timeZone: "Asia/Tokyo" };
  const initial = await new V19L5LocalApplication(options).prepare(fixture.request);
  assert.equal(initial.finalState, "clarification"); assert.equal(initial.clarification.target, "original_message");
  const answer = { kind: "original_message", originalMessage: fixture.originalMessage, clarificationId: "runtime-fixture",
    answerFingerprint: hashJson({ original_message: fixture.originalMessage }) };
  const beforeResume = fixture.requests.length;
  const ready = await new V19L5LocalApplication(options).resumePreparation(initial, answer, at);
  assert.equal(ready.finalState, "purchase_ready", ready.stopFinding);
  assert.deepEqual(fixture.requests.slice(beforeResume).map(q => q.stageId), ["PB-01C", "PB-02", "PB-03"]);
  assert.deepEqual(ready.evidence.preparationResume.initialCheckpoint, initial);
  const beforePaid = fixture.requests.length;
  const paid = await new V19L5LocalApplication({ ...options, now: () => "2026-09-09T00:30:00.000Z" }).fulfillPrepared(ready);
  assert.equal(paid.finalState, "completed", paid.stopFinding);
  assert.deepEqual(fixture.requests.slice(beforePaid).map(q => q.stageId), ["PB-04", "PB-05", "PB-06"]);
  const tampered = structuredClone(ready); tampered.evidence.preparationResume.answer.answerFingerprint = "0".repeat(64);
  const beforeTamper = fixture.requests.length;
  await assert.rejects(() => new V19L5LocalApplication(options).fulfillPrepared(tampered));
  assert.equal(fixture.requests.length, beforeTamper);
  checks.push({ id: "durable-original-preparation-and-paid-replay", status: "PASS", resumeProviderStages: ["PB-01C", "PB-02", "PB-03"], paidProviderStages: ["PB-04", "PB-05", "PB-06"], tamperedPaidProviderCalls: 0 });

  const cases = [
    ["material_relationship_or_communication_concern", { choice: "distance" }],
    ["latest_contact_timing", { kind: "local_datetime", localDateTime: "2026-09-08T09:00", timeZone: "Asia/Tokyo" }],
    ["usual_reply_cadence", "within_usual"],
    ["central_fear_or_decision_concern", { kind: "concern", value: "距離ができること" }],
    ["relationship_intent", { choice: "move_closer" }],
    ["requested_message_tone", { choice: "soft" }],
  ];
  for (const [target, raw] of cases) {
    const validated = validateClarificationAnswerV1({ target, answer: raw, resumeStartedAt: at });
    const evidence = { schemaVersion: "m2-p4-clarification-evidence-v1", clarificationId: "fixture", ordinal: 1,
      target, questionCode: "fixture", questionSnapshot: "fixture", provenance: "user_clarification", sourceIdentity: "clarification:fixture:answer:1",
      answer: validated.validatedAnswer, ...Object.fromEntries(Object.entries(validated).filter(([key]) => key !== "validatedAnswer")) };
    validateV19PreparationClarificationEvidence(evidence, at);
    assert.throws(() => validateV19PreparationClarificationEvidence({ ...evidence, answerFingerprint: "0".repeat(64) }, at));
    assert.throws(() => validateV19PreparationClarificationEvidence({ ...evidence, groundedNormalizedRepresentation: {} }, at));
    if (target === "latest_contact_timing") {
      assert.throws(() => validateV19PreparationClarificationEvidence(evidence, "2026-09-09T00:30:00.000Z"));
      validateV19PreparationClarificationEvidence(evidence, ready.evidence.preparationResume.resumeStartedAt);
    }
    checks.push({ id: `accepted-canonical-roundtrip-${target}`, status: "PASS" });
  }
  assert.equal(networkAttempts, 0);
  const receipt = { schemaVersion: "v19-preparation-runtime-regression-v1", status: "PASS", startedAt,
    completedAt: new Date().toISOString(), checks, realProviderCalls: 0, networkAttempts, productionOperations: 0,
    classification: "Offline contract regression; not new model quality evidence" };
  const directory = path.resolve("evals/paid-delivery-step5a1-0036/runtime", randomUUID());
  mkdirSync(directory, { recursive: true }); writeFileSync(path.join(directory, "result.json"), JSON.stringify(receipt, null, 2) + "\n");
  console.log(JSON.stringify({ status: receipt.status, checks: checks.length, receipt: path.join(directory, "result.json"), realProviderCalls: 0 }));
} finally { globalThis.fetch = originalFetch; }
