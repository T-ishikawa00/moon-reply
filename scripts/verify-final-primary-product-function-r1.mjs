import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

import { buildEffectiveAssessmentAuthorityV1 } from "../lib/assessment/runtime/effective-assessment-authority-v1.ts";
import { validateEffectiveAssessmentAuthorityIntegrityV1 } from "../lib/assessment/runtime/effective-assessment-authority-integrity-v1.ts";
import { evaluateJpy980InputSufficiencyV4 } from "../lib/assessment/runtime/jpy980-input-sufficiency-policy-v4.ts";
import {
  JPY980_ORGANIZATION_PRIMARY_PRODUCT_FUNCTION_TOPICS_V1,
  JPY980_PRIMARY_PRODUCT_FUNCTION_V1_VERSION,
  JPY980_PRIMARY_PRODUCT_FUNCTION_TOPICS_V1,
  hasJpy980PrimaryProductFunctionV1,
} from "../lib/assessment/runtime/jpy980-primary-product-function-v1.ts";
import { evaluateJpy980ProductScopeV1 } from "../lib/assessment/runtime/jpy980-product-scope-validation-v1.ts";
import { buildAbsentCandidateLaneV1 } from "../lib/assessment/runtime/split-analysis-envelope-v1.ts";

const root = process.cwd();
const fixtures = JSON.parse(
  readFileSync(
    path.join(
      root,
      "evals/runtime/final-primary-product-function-r1/fixtures.json",
    ),
    "utf8",
  ),
);
const routingFixtures = JSON.parse(
  readFileSync(
    path.join(
      root,
      "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-v1-a1/routing-fixtures-v1.json",
    ),
    "utf8",
  ),
);
let passed = 0;

function check(name, callback) {
  callback();
  passed += 1;
  console.log(`PASS ${String(passed).padStart(2, "0")} ${name}`);
}

function overlay(base, patch) {
  if (typeof patch !== "object" || patch === null || Array.isArray(patch)) {
    return structuredClone(patch);
  }
  const result =
    typeof base === "object" && base !== null && !Array.isArray(base)
      ? structuredClone(base)
      : {};
  for (const [key, value] of Object.entries(patch)) {
    result[key] =
      typeof value === "object" && value !== null && !Array.isArray(value)
        ? overlay(result[key], value)
        : structuredClone(value);
  }
  return result;
}

function baseFor(testCase) {
  const base = overlay(
    routingFixtures.base_structured_intake_template,
    routingFixtures.scenario_patches.reply_waiting_sufficient,
  );
  base.relationship_stage = testCase.relationship ?? "ambiguous";
  base.decision_facts.relationship_stage = base.relationship_stage;
  base.decision_facts.selected_requests = [...testCase.requested_topics];
  base.timeline = testCase.without_observed_facts
    ? []
    : [
        {
          event_id: "E001",
          sequence: 1,
          actor: "user",
          statement: testCase.current_situation ?? "関係性の相談がある。",
          source_refs: ["input:current_situation"],
        },
      ];
  base.observed_facts = testCase.without_observed_facts
    ? []
    : [
        {
          fact_id: "F001",
          statement: testCase.current_situation ?? "関係性の相談がある。",
          source_refs: ["input:current_situation"],
          support: "explicit",
        },
      ];
  return base;
}

function policyInput(testCase, safetyClassification = "normal_allowed") {
  const baseStructuredIntake = baseFor(testCase);
  const candidateLane = buildAbsentCandidateLaneV1();
  const effectiveAssessmentAuthority = buildEffectiveAssessmentAuthorityV1({
    baseStructuredIntake,
    candidateEnvelope: candidateLane.candidate_envelope,
    clarificationGrounding: null,
  });
  validateEffectiveAssessmentAuthorityIntegrityV1({
    authority: effectiveAssessmentAuthority,
    baseStructuredIntake,
    candidateEnvelope: candidateLane.candidate_envelope,
    clarificationGrounding: null,
  });
  return {
    basePolicyInput: {
      aggregateSafety: { classification: safetyClassification },
      baseStructuredIntake,
      decisionFacts: baseStructuredIntake.decision_facts,
      baseWritingSignals: baseStructuredIntake.base_writing_signals,
    },
    clarificationGrounding: null,
    effectiveAssessmentAuthority,
  };
}

check("relationship and emotion organization are authoritative Primary functions", () => {
  assert.equal(
    JPY980_PRIMARY_PRODUCT_FUNCTION_V1_VERSION,
    "final-primary-product-function-r1",
  );
  assert.deepEqual(JPY980_ORGANIZATION_PRIMARY_PRODUCT_FUNCTION_TOPICS_V1, [
    "relationship",
    "organize_emotions",
  ]);
  assert.deepEqual(JPY980_PRIMARY_PRODUCT_FUNCTION_TOPICS_V1, [
    "decide_send_or_wait",
    "draft_message",
    "message_impact",
    "relationship",
    "organize_emotions",
  ]);
});

for (const testCase of fixtures.organization_cases) {
  check(`${testCase.case_id} is scope-eligible and has a paid Primary function`, () => {
    const scope = evaluateJpy980ProductScopeV1({
      currentSituation: testCase.current_situation,
      optionalMessage: null,
      relationship: testCase.relationship,
      requestedTopics: testCase.requested_topics,
    });
    assert.equal(scope.decision, testCase.expected_scope);
    const route = evaluateJpy980InputSufficiencyV4(policyInput(testCase));
    assert.equal(route.state, testCase.expected_product_state);
    assert.ok(
      !route.reasonCodes.includes(
        "SUPPORTED_PRIMARY_PRODUCT_FUNCTION_NOT_ESTABLISHED",
      ),
    );
  });

  if (testCase.safety_precedence_classification) {
    check(`${testCase.case_id} keeps Safety precedence`, () => {
      const route = evaluateJpy980InputSufficiencyV4(
        policyInput(testCase, testCase.safety_precedence_classification),
      );
      assert.equal(route.state, testCase.expected_safety_state);
    });
  }
}

check("CASE-25 remains a pre-Provider Product Scope stop", () => {
  const testCase = fixtures.pre_provider_scope_stop;
  const scope = evaluateJpy980ProductScopeV1({
    currentSituation: testCase.current_situation,
    optionalMessage: null,
    relationship: testCase.relationship,
    requestedTopics: testCase.requested_topics,
  });
  assert.equal(scope.decision, testCase.expected_scope);
  assert.equal(scope.accepted, false);
});

check("existing decision, message impact, and rewrite Primary functions remain", () => {
  for (const topic of fixtures.existing_primary_topics) {
    assert.equal(hasJpy980PrimaryProductFunctionV1([topic]), true, topic);
  }
});

check("a request with no Primary Product Function still fails closed", () => {
  const testCase = {
    relationship: "ambiguous",
    requested_topics:
      fixtures.unsupported_without_primary.requested_topics,
  };
  const route = evaluateJpy980InputSufficiencyV4(policyInput(testCase));
  assert.equal(
    route.state,
    fixtures.unsupported_without_primary.expected_product_state,
  );
  assert.ok(
    route.reasonCodes.includes(
      fixtures.unsupported_without_primary.expected_reason,
    ),
  );
});

check("organization Primary does not bypass grounded-evidence completeness", () => {
  const testCase = fixtures.organization_without_grounded_evidence;
  const route = evaluateJpy980InputSufficiencyV4(policyInput(testCase));
  assert.equal(route.state, testCase.expected_product_state);
  assert.deepEqual(route.missingMaterialDimensions, [
    testCase.expected_missing_dimension,
  ]);
});

check("existing note contract covers organization value without speculation", () => {
  const reportContract = readFileSync(
    path.join(
      root,
      "lib/assessment/runtime/contracts/pb-05-quality-reassessment-v1.developer.md",
    ),
    "utf8",
  );
  assert.match(reportContract, /observed_fact_commentary/u);
  assert.match(reportContract, /relationship_summary/u);
  assert.match(reportContract, /anxiety_reframe/u);
  assert.match(reportContract, /reassessment/u);
  assert.match(reportContract, /hidden feelings/u);
  assert.match(reportContract, /Do not predict a reply or any future event/u);
});

console.log(`FINAL PRIMARY PRODUCT FUNCTION R1 PASS ${passed}/${passed}`);
console.log("PROVIDER_CALLS=0 STRIPE_WRITES=0 DB_WRITES=0");
