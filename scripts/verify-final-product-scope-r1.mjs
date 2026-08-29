import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { POST as evaluatePublicEligibility } from "../app/api/consultations/purchase-eligibility/route.ts";
import { ProviderFreeIntakeApplication } from "../lib/assessment/production/provider-free-intake.ts";
import { evaluateJpy980ProductScopeV1 } from "../lib/assessment/runtime/jpy980-product-scope-validation-v1.ts";
import { evaluatePrepaymentSafetyV1 } from "../lib/purchase/prepayment-safety-gate-v1.ts";

process.removeAllListeners("warning");
process.on("warning", () => {});

const emptyClarificationAnswers = Object.freeze({
  submissionCount: 0,
  clarifiedContactBoundaryState: null,
  practicalPermissionExplicit: null,
  currentRequestPracticalScopeOnly: null,
  replyExplicitlyInvited: null,
  replyLimitedToExactSubject: null,
  professionalScopeLimitedToNonprofessionalOrganization: null,
  unsafeExecutionIntent: null,
  currentSafetyStatus: null,
});

const allScopeAcknowledgements = Object.freeze({
  pauseAssessmentDisclosureAcknowledged: true,
  boundarySupportOnlyDisclosureAcknowledged: true,
  scopedReplyScopeAcknowledged: true,
  businessOnlyScopeAcknowledged: true,
});

function input(overrides) {
  return Object.freeze({
    schemaVersion: "prepayment-safety-input-v1",
    adultConfirmed: true,
    currentSituation: "状況と気持ちを整理したいです。",
    latestInboundMessage: null,
    optionalMessage: null,
    relationship: "ambiguous",
    requestedTopics: ["organize_emotions"],
    contactBoundaryState: "no_restriction_known",
    requestedAssistanceGoal: "understand_and_organize",
    clarificationAnswers: emptyClarificationAnswers,
    scopeAcknowledgements: allScopeAcknowledgements,
    attestationConfirmed: true,
    safetyPolicyVersion: "prepayment-safety-policy-v1",
    ...overrides,
  });
}

const cases = Object.freeze([
  {
    id: "CASE-01",
    expectedScope: "eligible",
    expectedSafety: "eligible_general",
    expectedC1: "authentication_required",
    input: input({
      relationship: "in_relationship",
      requestedTopics: ["decide_send_or_wait"],
      requestedAssistanceGoal: "decide_send_wait_or_pause",
      currentSituation:
        "付き合って3か月の彼氏に昨日の夜LINEを送りましたが、まだ返事がありません。追いLINEを送るか、もう少し待つか迷っています。",
    }),
  },
  {
    id: "CASE-08",
    expectedScope: "eligible",
    expectedSafety: "eligible_general",
    expectedC1: "authentication_required",
    input: input({
      relationship: "ambiguous",
      requestedTopics: ["relationship"],
      currentSituation:
        "半年くらい週1で会っています。付き合っているとは言われていません。この関係をどう考えればいいのか分かりません。",
    }),
  },
  {
    id: "CASE-15",
    expectedScope: "eligible",
    expectedSafety: "eligible_general",
    expectedC1: "authentication_required",
    input: input({
      relationship: "work_or_school",
      requestedTopics: ["relationship"],
      currentSituation:
        "同じサークルの人と最近よく二人で帰ります。友達としてなのか分かりません。",
    }),
  },
  {
    id: "CASE-18",
    expectedScope: "eligible",
    expectedSafety: "eligible_boundary_support_only",
    expectedC1: "authentication_required",
    input: input({
      relationship: "former_partner",
      requestedTopics: ["relationship", "organize_emotions"],
      contactBoundaryState: "relationship_closed",
      currentSituation:
        "別れたいとはっきり言われました。まだ気持ちが残っていて、どう受け止めればいいか分かりません。",
    }),
  },
  {
    id: "CASE-19",
    expectedScope: "eligible",
    expectedSafety: "needs_clarification",
    expectedC1: "safety_blocked",
    input: input({
      relationship: "other",
      requestedTopics: ["organize_emotions"],
      contactBoundaryState: "unknown",
      currentSituation:
        "昔から仲のいい友達を好きになってしまいました。今の関係を壊すのが怖いです。",
    }),
  },
  {
    id: "CASE-20",
    expectedScope: "eligible",
    expectedSafety: "unsupported_professional_request",
    expectedC1: "safety_blocked",
    input: input({
      relationship: "former_partner",
      requestedTopics: ["relationship"],
      contactBoundaryState: "business_only",
      requestedAssistanceGoal: "professional_judgment",
      currentSituation:
        "元恋人に貸している30万円が返ってきません。法的にどうやって取り返せばいいですか？",
    }),
  },
  {
    id: "CASE-21",
    expectedScope: "eligible",
    expectedSafety: "blocked_unsafe_assistance",
    expectedC1: "safety_blocked",
    input: input({
      relationship: "former_partner",
      requestedTopics: ["draft_message"],
      contactBoundaryState: "explicit_no_contact",
      requestedAssistanceGoal: "recontact_or_overcome_boundary",
      currentSituation:
        "元彼からもう連絡しないでと言われています。どういうLINEなら返事をもらえますか？",
    }),
  },
  {
    id: "CASE-22",
    expectedScope: "eligible",
    expectedSafety: "blocked_unsafe_assistance",
    expectedC1: "safety_blocked",
    input: input({
      relationship: "former_partner",
      requestedTopics: ["draft_message"],
      contactBoundaryState: "channel_restricted",
      requestedAssistanceGoal: "alternate_channel_or_third_party",
      currentSituation:
        "LINEをブロックされています。別アカウントや共通の友達から伝える方法を考えています。",
    }),
  },
  {
    id: "CASE-23",
    expectedScope: "eligible",
    expectedSafety: "blocked_unsafe_assistance",
    expectedC1: "safety_blocked",
    input: input({
      relationship: "in_relationship",
      requestedTopics: ["organize_emotions"],
      requestedAssistanceGoal: "monitor_track_or_manipulate",
      currentSituation:
        "彼氏の位置情報やSNSのログイン時間を使って、バレずに確認したいです。",
    }),
  },
  {
    id: "CASE-24",
    expectedScope: "eligible",
    expectedSafety: "urgent_safety_redirect",
    expectedC1: "safety_blocked",
    input: input({
      relationship: "in_relationship",
      requestedTopics: ["organize_emotions"],
      contactBoundaryState: "unknown",
      requestedAssistanceGoal: "urgent_safety_help",
      currentSituation:
        "彼氏が今家の前にいて、出てこないならただじゃ済まないと言っています。",
    }),
  },
  {
    id: "CASE-25",
    expectedScope: "needs_clarification",
    expectedSafety: "eligible_general",
    expectedC1: "not_full_product_candidate",
    input: input({
      relationship: "other",
      requestedTopics: ["organize_emotions"],
      currentSituation:
        "今日の晩ごはんをカレーにするかラーメンにするか迷っています。猫が昨日3回くしゃみしました。明日の株価も知りたいです。",
    }),
  },
]);

function publicRequest(value) {
  return new Request(
    "http://localhost:3000/api/consultations/purchase-eligibility",
    {
      method: "POST",
      headers: {
        origin: "http://localhost:3000",
        "content-type": "application/json",
        "sec-fetch-site": "same-origin",
      },
      body: JSON.stringify(value),
    },
  );
}

process.env.NODE_ENV = "development";

for (const fixture of cases) {
  const scope = evaluateJpy980ProductScopeV1(fixture.input);
  assert.equal(scope.decision, fixture.expectedScope, `${fixture.id} scope`);

  const safety = evaluatePrepaymentSafetyV1(fixture.input);
  assert.equal(
    safety.classification,
    fixture.expectedSafety,
    `${fixture.id} Safety`,
  );

  const response = await evaluatePublicEligibility(
    publicRequest(fixture.input),
  );
  assert.equal(response.status, 200, `${fixture.id} public status`);
  const payload = await response.json();
  assert.deepEqual(
    payload.data.productScope,
    scope,
    `${fixture.id} public/shared consistency`,
  );
  assert.equal(
    payload.data.classification,
    fixture.expectedSafety,
    `${fixture.id} public Safety precedence`,
  );
}

for (const fixture of [
  input({
    relationship: "other",
    requestedTopics: ["draft_message"],
    currentSituation: "知人へ送る文章を整えたいです。",
  }),
  input({
    relationship: "other",
    requestedTopics: ["message_impact"],
    optionalMessage: "今日はありがとう。また話せたらうれしいです。",
    currentSituation: "気になる相手へ送る候補文を確認したいです。",
  }),
]) {
  assert.equal(evaluateJpy980ProductScopeV1(fixture).decision, "eligible");
}
assert.deepEqual(
  evaluateJpy980ProductScopeV1(
    input({
      relationship: "other",
      requestedTopics: ["message_impact"],
      currentSituation: "気になる相手へ送る候補文を確認したいです。",
    }),
  ).clarificationCode,
  "message_candidate_required",
);

let intakeCalls = 0;
const providerFree = new ProviderFreeIntakeApplication({
  runtimeRepository: {
    async findClarificationById() {
      throw new Error("unexpected clarification read");
    },
  },
  lifecycleRepository: {
    async rotateClarificationCapability() {
      throw new Error("unexpected clarification capability rotation");
    },
    async rotatePurchaseCapability() {
      throw new Error("unexpected purchase capability rotation");
    },
  },
  prepaymentComputeAuthority: {
    async beginPrepaymentIntake(record) {
      intakeCalls += 1;
      return {
        disposition: "created",
        executionDisposition: "awaiting_auth",
        preparation: {
          id: record.preparationId,
          requestId: record.requestId,
          idempotencyKeyHash: record.idempotencyKeyHash,
          consultationSnapshotHash: record.consultationSnapshotHash,
          consultationSnapshot: record.consultationSnapshot,
          assessmentInput: record.assessmentInput,
          safetyAuthority: record.safetyAuthority,
          status: "preparing",
          stopReason: null,
          clarificationId: null,
          clarificationCapabilityHash: null,
          clarificationQuestion: null,
          clarificationAnswerFingerprint: null,
          purchaseCapabilityHash: null,
          purchaseReadyAuthority: null,
          purchaseReadyAuthorityHash: null,
          lastErrorCode: null,
          createdAt: record.now,
          updatedAt: record.now,
        },
        request: {},
      };
    },
  },
  now: () => "2026-08-30T00:00:00.000Z",
  uuid: () => "10000000-0000-4000-8000-000000000001",
  capability: () => "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
});

for (const fixture of cases) {
  const callsBefore = intakeCalls;
  const outcome = await providerFree.beginProviderFreePreparation(
    {
      ...fixture.input,
      consultationSchemaVersion: "rc1-production-consultation-v1",
      privacyAcknowledged: true,
    },
    "20000000-0000-4000-8000-000000000001",
  );
  assert.equal(outcome.status, fixture.expectedC1, `${fixture.id} C1 outcome`);
  assert.equal(
    intakeCalls - callsBefore,
    fixture.expectedC1 === "authentication_required" ? 1 : 0,
    `${fixture.id} C1 durable intake boundary`,
  );
}

function source(relativePath) {
  return readFileSync(new URL(`../${relativePath}`, import.meta.url), "utf8");
}

const routeSource = source(
  "app/api/consultations/purchase-eligibility/route.ts",
);
const providerFreeSource = source(
  "lib/assessment/production/provider-free-intake.ts",
);
const applicationSource = source("lib/assessment/production/application.ts");
const requestFormSource = source("components/request/RequestForm.tsx");

assert.match(routeSource, /evaluateJpy980ProductScopeV1\(input\)/u);
assert.match(providerFreeSource, /evaluateJpy980ProductScopeV1\(consultation\)/u);
assert.match(applicationSource, /evaluateJpy980ProductScopeV1\(consultation\)/u);
assert.match(
  providerFreeSource,
  /if \(!productScope\.accepted\) \{\s*return \{ status: "not_full_product_candidate" \};/u,
);
assert.match(
  requestFormSource,
  /恋愛・相手との関係・メッセージについての相談ですか？/u,
);
assert.match(requestFormSource, /productScope\.decision === "eligible"/u);
assert.doesNotMatch(
  routeSource,
  /openai|stripe|supabase|beginPrepaymentIntake/iu,
);

console.log(
  "FINAL_PRODUCT_SCOPE_R1: PASS; CASE-01/08/15/18/19 scope normal; CASE-20 professional unchanged; CASE-21-24 Safety unchanged; CASE-25 clarification; Provider calls 0; Stripe writes 0; DB writes 0",
);
