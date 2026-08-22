import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

import {
  clarificationSourceIdentityV1,
  createOpaqueClarificationIdV1,
  validateClarificationAnswerV1,
} from "../lib/assessment/runtime/clarification-evidence-v1.ts";
import { groundClarificationEvidenceV1 } from "../lib/assessment/runtime/clarification-grounding-v1.ts";
import { validateClarificationSourceIntegrityV1 } from "../lib/assessment/runtime/clarification-source-integrity-v1.ts";
import { buildEffectiveAssessmentAuthorityV1 } from "../lib/assessment/runtime/effective-assessment-authority-v1.ts";
import { validateEffectiveAssessmentAuthorityIntegrityV1 } from "../lib/assessment/runtime/effective-assessment-authority-integrity-v1.ts";
import { evaluateJpy980InputSufficiencyV3 } from "../lib/assessment/runtime/jpy980-input-sufficiency-policy-v3.ts";
import {
  evaluateJpy980InputSufficiencyV4,
  JPY980_INPUT_SUFFICIENCY_POLICY_V4_VERSION,
  JPY980_INPUT_SUFFICIENCY_RESULT_V4_SCHEMA_VERSION,
  JPY980_SOFT_UNCERTAINTY_DIMENSIONS_V4,
} from "../lib/assessment/runtime/jpy980-input-sufficiency-policy-v4.ts";
import { buildAbsentCandidateLaneV1 } from "../lib/assessment/runtime/split-analysis-envelope-v1.ts";

const root = process.cwd();
const fixturePath =
  "evals/runtime/m1-4-clarification-product-intent-r1/fixtures.json";
const routingFixturePath =
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-v1-a1/routing-fixtures-v1.json";
let passed = 0;

function readJson(relativePath) {
  return JSON.parse(readFileSync(path.join(root, relativePath), "utf8"));
}

function overlay(base, patch) {
  if (
    typeof patch !== "object" ||
    patch === null ||
    Array.isArray(patch)
  ) {
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

function check(name, callback) {
  callback();
  passed += 1;
  console.log(`PASS ${String(passed).padStart(2, "0")} ${name}`);
}

const fixtures = readJson(fixturePath);
const routingFixtures = readJson(routingFixturePath);

function baseFor(testCase) {
  return overlay(
    overlay(
      routingFixtures.base_structured_intake_template,
      routingFixtures.scenario_patches[testCase.scenario],
    ),
    testCase.patch,
  );
}

function authorityFor(baseStructuredIntake, clarificationGrounding = null) {
  const candidateLane = buildAbsentCandidateLaneV1();
  const effectiveAssessmentAuthority = buildEffectiveAssessmentAuthorityV1({
    baseStructuredIntake,
    candidateEnvelope: candidateLane.candidate_envelope,
    clarificationGrounding,
  });
  validateEffectiveAssessmentAuthorityIntegrityV1({
    authority: effectiveAssessmentAuthority,
    baseStructuredIntake,
    candidateEnvelope: candidateLane.candidate_envelope,
    clarificationGrounding,
  });
  return { candidateLane, effectiveAssessmentAuthority };
}

function policyInput(
  baseStructuredIntake,
  safetyClassification = "normal_allowed",
  clarificationGrounding = null,
) {
  const authority = authorityFor(baseStructuredIntake, clarificationGrounding);
  return {
    basePolicyInput: {
      aggregateSafety: { classification: safetyClassification },
      baseStructuredIntake,
      decisionFacts: baseStructuredIntake.decision_facts,
      baseWritingSignals: baseStructuredIntake.base_writing_signals,
    },
    clarificationGrounding,
    effectiveAssessmentAuthority: authority.effectiveAssessmentAuthority,
  };
}

function groundingFor(initial, answer) {
  assert.ok(initial.clarification);
  const clarificationId = createOpaqueClarificationIdV1(
    new Uint8Array(32).fill(14),
  );
  const validated = validateClarificationAnswerV1({
    target: initial.clarification.target,
    answer,
    resumeStartedAt: "2026-08-22T12:00:00.000Z",
  });
  const sourceIdentity = clarificationSourceIdentityV1(clarificationId);
  const evidence = {
    schemaVersion: "m2-p4-clarification-evidence-v1",
    clarificationId,
    ordinal: 1,
    questionCode: initial.clarification.code,
    target: initial.clarification.target,
    questionSnapshot: initial.clarification.question,
    answer: validated.validatedAnswer,
    provenance: "user_clarification",
    sourceIdentity,
    groundedNormalizedRepresentation:
      validated.groundedNormalizedRepresentation,
    canonicalAnswer: validated.canonicalAnswer,
    answerFingerprint: validated.answerFingerprint,
    resolvesTarget: validated.resolvesTarget,
  };
  const grounding = groundClarificationEvidenceV1({
    evidence,
    providerOutput: {
      schema_version: "pipeline-schema-clarification-grounding-v1.0.0",
      target: evidence.target,
      source_identity: sourceIdentity,
      answer_fingerprint: evidence.answerFingerprint,
      materially_resolves_target: evidence.resolvesTarget,
      clarification_safety_result: {
        classification: "normal_allowed",
        reason_codes: [],
        response_mode: "none",
      },
    },
  });
  validateClarificationSourceIntegrityV1({ evidence, grounding });
  return grounding;
}

check("V4 identity and six soft uncertainty dimensions are exact", () => {
  assert.equal(
    JPY980_INPUT_SUFFICIENCY_POLICY_V4_VERSION,
    "m2-p4-jpy980-input-sufficiency-policy-v4",
  );
  assert.equal(
    JPY980_INPUT_SUFFICIENCY_RESULT_V4_SCHEMA_VERSION,
    "m2-p4-jpy980-input-sufficiency-result-v4",
  );
  assert.deepEqual(JPY980_SOFT_UNCERTAINTY_DIMENSIONS_V4, [
    "material_relationship_or_communication_concern",
    "latest_contact_timing",
    "usual_reply_cadence",
    "central_fear_or_decision_concern",
    "relationship_intent",
    "requested_message_tone",
  ]);
});

check("V17 selects V4 while historical V16 remains on V3", () => {
  const pipeline = readFileSync(
    path.join(root, "lib/assessment/runtime/pipeline.ts"),
    "utf8",
  );
  assert.match(
    pipeline,
    /promptBundleVersion === "prompt-bundle-runtime-v17\.0\.0"[\s\S]+evaluateJpy980InputSufficiencyV4\(policyInput\)/u,
  );
  assert.match(
    pipeline,
    /promptBundleVersion ===[\s\S]+"prompt-bundle-runtime-v16\.0\.0"[\s\S]+evaluateJpy980InputSufficiencyV3\(policyInput\)/u,
  );
});

const results = new Map();
for (const testCase of fixtures.cases) {
  check(`${testCase.case_id} routes ${testCase.expected_state}`, () => {
    const base = baseFor(testCase);
    const input = policyInput(
      base,
      testCase.safety_classification ?? "normal_allowed",
    );
    const route = evaluateJpy980InputSufficiencyV4(input);
    results.set(testCase.case_id, { base, route });
    assert.equal(route.state, testCase.expected_state);
    assert.equal(
      route.schemaVersion,
      JPY980_INPUT_SUFFICIENCY_RESULT_V4_SCHEMA_VERSION,
    );
    assert.equal(route.clarificationBudget.maximumQuestionsTotal, 1);
    if (testCase.expected_target) {
      assert.equal(route.clarification?.target, testCase.expected_target);
      assert.equal(route.clarificationBudget.questionsRemaining, 1);
    } else {
      assert.equal(route.clarification, null);
    }
  });
}

check("Cases A-D absorb soft unknowns with zero clarification", () => {
  for (const caseId of [
    "A_minimal_consultation",
    "B_standard_consultation",
    "C_detailed_consultation",
    "D_unknown_timing_and_cadence",
  ]) {
    const route = results.get(caseId).route;
    assert.equal(route.state, "full_paid_ready_candidate", caseId);
    assert.equal(route.clarification, null, caseId);
    assert.deepEqual(route.missingMaterialDimensions, [], caseId);
  }
});

check("representative Case B no longer re-asks its stated send timing", () => {
  const route = results.get("B_standard_consultation").route;
  assert.equal(route.clarification, null);
  assert.ok(
    fixtures.cases
      .find((testCase) => testCase.case_id === "B_standard_consultation")
      .consultation_text.includes("昨日夜"),
  );
});

check("Case D preserves unknown authority for conditional reassessment", () => {
  const base = results.get("D_unknown_timing_and_cadence").base;
  const contact = base.decision_facts.contact_state;
  assert.equal(contact.elapsed_since_latest_user_message_minutes, null);
  assert.equal(contact.usual_cadence_relation, "unknown");
  assert.deepEqual(base.decision_facts.information_state.unresolved_fields, [
    "contact_state.elapsed_since_latest_user_message_minutes",
    "contact_state.usual_cadence_relation",
  ]);
  assert.deepEqual(results.get("D_unknown_timing_and_cadence").route.reasonCodes, [
    "SOFT_UNCERTAINTY_ABSORBED_BY_ASSESSMENT_NOTE",
    "CONDITIONAL_REASONING_AND_REASSESSMENT_ALLOWED",
  ]);
});

check("soft draft intent and tone gaps also proceed without clarification", () => {
  const route = results.get("G_soft_draft_context").route;
  assert.equal(route.state, "full_paid_ready_candidate");
  assert.equal(route.clarification, null);
  assert.deepEqual(route.missingMaterialDimensions, []);
});

check("V3 drift is isolated and V4 supersedes it for Case B", () => {
  const base = results.get("B_standard_consultation").base;
  const input = policyInput(base);
  const v3 = evaluateJpy980InputSufficiencyV3(input);
  const v4 = evaluateJpy980InputSufficiencyV4(input);
  assert.notEqual(v3.state, "full_paid_ready_candidate");
  assert.equal(v4.state, "full_paid_ready_candidate");
  assert.equal(v4.clarification, null);
});

check("Case E uses one question only and cannot loop", () => {
  const testCase = fixtures.cases.find(
    (candidate) =>
      candidate.case_id === "E_genuinely_unusable_without_action_focus",
  );
  const initial = results.get(testCase.case_id);
  assert.deepEqual(initial.route.missingMaterialDimensions, [
    "usable_action_context",
  ]);
  const grounding = groundingFor(initial.route, testCase.answer_payload);
  const resumed = evaluateJpy980InputSufficiencyV4(
    policyInput(initial.base, "normal_allowed", grounding),
  );
  assert.equal(resumed.state, testCase.expected_resumed_state);
  assert.equal(resumed.clarification, null);
  assert.equal(resumed.clarificationBudget.questionsAlreadyUsed, 1);
  assert.equal(resumed.clarificationBudget.questionsRemaining, 0);
  assert.notEqual(resumed.state, "needs_one_clarifying_answer");
});

check("hard evidence absence remains closed without arbitrary clarification", () => {
  const base = structuredClone(results.get("A_minimal_consultation").base);
  base.observed_facts = [];
  const route = evaluateJpy980InputSufficiencyV4(policyInput(base));
  assert.equal(route.state, "not_full_product_candidate");
  assert.deepEqual(route.missingMaterialDimensions, ["grounded_evidence"]);
  assert.equal(route.clarification, null);
});

check("missing required Candidate analysis remains closed", () => {
  const base = overlay(
    routingFixtures.base_structured_intake_template,
    routingFixtures.scenario_patches.draft_material,
  );
  const route = evaluateJpy980InputSufficiencyV4(policyInput(base));
  assert.equal(route.state, "not_full_product_candidate");
  assert.deepEqual(route.missingMaterialDimensions, ["candidate_analysis"]);
  assert.equal(route.clarification, null);
});

check("Safety still precedes Product clarification", () => {
  const route = results.get("F_safety_precedence").route;
  assert.equal(route.state, "safety_blocked");
  assert.equal(route.clarification, null);
  assert.deepEqual(route.missingMaterialDimensions, []);
});

console.log(`M1-4 CLARIFICATION PRODUCT INTENT PASS ${passed}/${passed}`);
console.log("PROVIDER_CALLS=0 SUPABASE_REMOTE_OPERATIONS=0 MIGRATIONS=0 DEPLOYS=0");
