import assert from "node:assert/strict";
import { evaluateSelectedRequestProductCompletenessV2 } from "../lib/assessment/runtime/selected-request-product-completeness-v2.ts";
import { buildCombinedProductQualityDirectiveV2 } from "../lib/assessment/runtime/quality-reassessment-v2.ts";
import { RC2_CHECKOUT_SESSION_EXPIRATION_SECONDS } from "../lib/payment/production/constants.ts";
import {
  privateRecoverySchedulerPolicy,
  runProductionPaymentReconciliationSchedule,
} from "../lib/payment/production/recovery-schedulers.ts";
import { buildStripeReconciliationEvidenceV1 } from "../lib/payment/production/stripe.ts";

const availableCandidate = {
  presence: true,
  analysis_status: "available",
  safety_status: "available",
  analysis: {
    candidate_style_profile: {
      register: "casual",
      sentence_length: "short",
      sentence_ending: "soft",
      punctuation: "standard",
      emoji_usage: "none",
      exclamation_usage: "restrained",
      softness: "high",
      directness: "balanced",
      invitation_style: "tentative",
      reply_pressure: "low",
    },
    candidate_communicative_intent: {
      gratitude_strength: "none",
      apology_strength: "medium",
      question_count: 0,
      invitation_presence: true,
      invitation_specificity: "tentative",
      affection_strength: "low",
      commitment_strength: "low",
      response_pressure: "low",
      boundary_strength: "none",
      conversation_closure: "soft",
      practical_requirement: ["none"],
    },
    candidate_language_expression: {
      primary_language: "ja",
      mixed_languages: [],
      dialect_or_regional_expression: "absent",
      intentional_nonstandard_expression: "absent",
      possible_typo: "absent",
    },
  },
};

const absentCandidate = {
  presence: false,
  analysis_status: "absent",
  safety_status: "absent",
  analysis: null,
};

const effectiveDecisionPolicy = {
  schemaVersion: "m2-p4-effective-decision-policy-v2",
  policy: {
    policy_version: "decision-policy-v2.0.0",
    message_draft_policy: "prohibited",
  },
};

const validPlan = {
  material_unknowns: [],
};
const reportWithTemperature = {
  message_temperature: {
    pressure: "low",
  },
};

const valid = evaluateSelectedRequestProductCompletenessV2({
  requestedTopics: ["message_impact"],
  candidateEnvelope: availableCandidate,
  effectiveDecisionPolicy,
  decisionPlan: validPlan,
  reportContent: reportWithTemperature,
});
assert.equal(valid.complete, true);

const contradictedPlan = {
  material_unknowns: [
    {
      unknown_code: "message_content_absent",
      summary: "Candidate content is unavailable.",
      material_to: "draft",
    },
  ],
};
const contradicted = evaluateSelectedRequestProductCompletenessV2({
  requestedTopics: ["message_impact"],
  candidateEnvelope: availableCandidate,
  effectiveDecisionPolicy,
  decisionPlan: contradictedPlan,
  reportContent: reportWithTemperature,
});
assert.deepEqual(
  contradicted.defects.map((defect) => ({
    code: defect.code,
    path: defect.jsonPath,
    ownership: defect.ownership,
  })),
  [
    {
      code: "CANDIDATE_CONTENT_FALSELY_ABSENT",
      path: "decision_plan.material_unknowns[0]",
      ownership: "plan",
    },
  ],
);
const directive = buildCombinedProductQualityDirectiveV2({
  blockingFindings: [],
  localDefects: contradicted.defects,
  decisionPlan: contradictedPlan,
  reportContent: reportWithTemperature,
});
assert.equal(directive.scope, "plan_and_report");

const genuinelyAbsent = evaluateSelectedRequestProductCompletenessV2({
  requestedTopics: ["relationship"],
  candidateEnvelope: absentCandidate,
  effectiveDecisionPolicy,
  decisionPlan: contradictedPlan,
  reportContent: { message_temperature: null },
});
assert.equal(genuinelyAbsent.complete, true);

const openSnapshot = {
  providerCheckoutSessionId: "cs_test_product_exploration_r1",
  environment: "test",
  purchaseReference: "10000000-0000-4000-8000-000000000001",
  clientReferenceId: "10000000-0000-4000-8000-000000000001",
  providerPaymentId: null,
  paymentIntentPurchaseReference: null,
  mode: "payment",
  paymentStatus: "unpaid",
  amountTotal: 980,
  currency: "jpy",
  checkoutStatus: "open",
};
const firstObservation = buildStripeReconciliationEvidenceV1(
  openSnapshot,
  "2026-08-29T12:50:00.000Z",
);
const replayedObservation = buildStripeReconciliationEvidenceV1(
  openSnapshot,
  "2026-08-29T12:50:00.000Z",
);
const laterObservation = buildStripeReconciliationEvidenceV1(
  openSnapshot,
  "2026-08-29T12:55:00.000Z",
);
assert.equal(firstObservation.providerEventId, replayedObservation.providerEventId);
assert.notEqual(firstObservation.providerEventId, laterObservation.providerEventId);
assert.equal(firstObservation.payloadSha256, laterObservation.payloadSha256);
assert.equal(firstObservation.paymentStatus, "unpaid");
assert.equal(firstObservation.providerPaymentId, null);
assert.equal(RC2_CHECKOUT_SESSION_EXPIRATION_SECONDS, 31 * 60);
assert.equal(privateRecoverySchedulerPolicy.reconciliationMaximumAttempts, 6);

async function finishForPendingObservation(attemptCount, now) {
  const finishes = [];
  await runProductionPaymentReconciliationSchedule({
    repository: {
      async claimPaymentReconciliationBatch(input) {
        assert.equal(input.maximumAttempts, 6);
        return [
          {
            paymentAttemptId: "20000000-0000-4000-8000-000000000001",
            providerCheckoutSessionId: "cs_test_product_exploration_r1",
            attemptCount,
          },
        ];
      },
      async finishPaymentReconciliation(finish) {
        finishes.push(finish);
      },
    },
    reconcileAttempt: async () => ({
      disposition: "pending",
      purchaseIntentId: "10000000-0000-4000-8000-000000000001",
      verifiedPaymentId: null,
      fulfillmentJobId: null,
    }),
    uuid: () => "30000000-0000-4000-8000-000000000001",
    now: () => now,
  });
  assert.equal(finishes.length, 1);
  return finishes[0];
}

assert.equal(
  (await finishForPendingObservation(5, "2026-08-29T13:10:00.000Z"))
    .outcome,
  "retry",
);
assert.equal(
  (await finishForPendingObservation(6, "2026-08-29T13:25:00.000Z"))
    .outcome,
  "stop",
);

console.log(
  "PRODUCT_EXPLORATION_BLOCKERS_11_13_R1: PASS; provider calls 0; Stripe writes 0; DB writes 0",
);
