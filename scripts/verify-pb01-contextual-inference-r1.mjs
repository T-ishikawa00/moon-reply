import assert from "node:assert/strict";

const [
  { groundBaseStructuredIntakeV3 },
  { validateBaseSourceIntegrityV1 },
  { validateContextualIntakeIntegrityV3 },
  { loadM2P4FinalProductRecoveryRuntimeStageCatalog },
  { validateGroundedStageOutput, validateStageOutput },
] = await Promise.all([
  import("../lib/assessment/runtime/base-structured-intake-grounding-v3.ts"),
  import("../lib/assessment/runtime/base-source-integrity-v1.ts"),
  import("../lib/assessment/runtime/contextual-integrity-v3.ts"),
  import("../lib/assessment/runtime/schema-catalog.ts"),
  import("../lib/assessment/runtime/validation.ts"),
]);

const catalog = await loadM2P4FinalProductRecoveryRuntimeStageCatalog();
const pb01 = catalog.definitions.find(({ stageId }) => stageId === "PB-01");
assert.ok(pb01, "PB-01 definition must exist");

const historicalFailureFixtures = [
  {
    id: "CASE-02 Preparation #1",
    relationship: "in_relationship",
    requestedTopics: ["decide_send_or_wait", "organize_emotions"],
    practicalReason: { kind: "unknown", active: false, deadline: "unknown" },
    unresolvedFields: [
      "latest_direct_message.sender",
      "latest_direct_message.kind",
      "latest_direct_message.response_expectation",
      "latest_direct_message.user_reply_state",
      "contact_state.unanswered_user_message_count",
      "contact_state.elapsed_since_latest_user_message_minutes",
      "contact_state.usual_cadence_relation",
      "practical_reason.kind",
      "practical_reason.active",
      "practical_reason.deadline",
    ],
  },
  {
    id: "CASE-05",
    relationship: "in_relationship",
    requestedTopics: ["draft_message"],
    practicalReason: { kind: "none", active: false, deadline: "none" },
    unresolvedFields: [
      "latest_direct_message.sender",
      "latest_direct_message.kind",
      "latest_direct_message.response_expectation",
      "contact_state.unanswered_user_message_count",
      "contact_state.elapsed_since_latest_user_message_minutes",
      "contact_state.usual_cadence_relation",
      "practical_reason.kind",
      "practical_reason.active",
      "practical_reason.deadline",
    ],
  },
  {
    id: "CASE-17",
    relationship: "in_relationship",
    requestedTopics: ["draft_message", "message_impact"],
    practicalReason: { kind: "none", active: false, deadline: "none" },
    unresolvedFields: [
      "latest_direct_message.sender",
      "latest_direct_message.kind",
      "latest_direct_message.response_expectation",
      "contact_state.unanswered_user_message_count",
      "contact_state.elapsed_since_latest_user_message_minutes",
      "contact_state.usual_cadence_relation",
      "boundary_state.kind",
      "boundary_state.status",
      "practical_reason.kind",
      "practical_reason.active",
      "practical_reason.deadline",
    ],
  },
  {
    id: "CASE-08 final regression",
    relationship: "ambiguous",
    requestedTopics: ["relationship"],
    practicalReason: { kind: "none", active: false, deadline: "none" },
    unresolvedFields: [
      "relationship_stage",
      "contact_state.unanswered_user_message_count",
      "contact_state.elapsed_since_latest_user_message_minutes",
      "boundary_state.kind",
      "practical_reason.kind",
      "practical_reason.active",
      "practical_reason.deadline",
    ],
  },
];

const successFixtures = [
  {
    id: "CASE-01",
    relationship: "in_relationship",
    requestedTopics: ["decide_send_or_wait"],
    practicalReason: { kind: "none", active: false, deadline: "none" },
    unresolvedFields: [
      "latest_direct_message.response_expectation",
      "contact_state.elapsed_since_latest_user_message_minutes",
    ],
  },
  {
    id: "CASE-03",
    relationship: "in_relationship",
    requestedTopics: ["message_impact"],
    practicalReason: { kind: "none", active: false, deadline: "none" },
    unresolvedFields: [
      "latest_direct_message.sender",
      "latest_direct_message.kind",
      "latest_direct_message.response_expectation",
      "latest_direct_message.user_reply_state",
      "contact_state.unanswered_user_message_count",
      "contact_state.elapsed_since_latest_user_message_minutes",
      "contact_state.usual_cadence_relation",
      "boundary_state.kind",
      "boundary_state.status",
    ],
  },
  {
    id: "CASE-06",
    relationship: "dating",
    requestedTopics: ["decide_send_or_wait", "next_three_days"],
    practicalReason: { kind: "none", active: false, deadline: "none" },
    unresolvedFields: [
      "contact_state.elapsed_since_latest_user_message_minutes",
      "contact_state.usual_cadence_relation",
      "practical_reason.deadline",
    ],
  },
  {
    id: "Fresh clarification paid E2E",
    relationship: "in_relationship",
    requestedTopics: ["decide_send_or_wait", "organize_emotions"],
    practicalReason: { kind: "none", active: false, deadline: "none" },
    unresolvedFields: [
      "latest_direct_message.sender",
      "latest_direct_message.kind",
      "latest_direct_message.response_expectation",
      "latest_direct_message.user_reply_state",
      "contact_state.elapsed_since_latest_user_message_minutes",
      "contact_state.usual_cadence_relation",
    ],
  },
];

function safeCode(error) {
  return error?.safeCode ?? null;
}

function expectSafeCode(action, expected) {
  assert.throws(action, (error) => safeCode(error) === expected);
}

function inputFor(fixture) {
  return {
    current_situation: "Sanitized ordinary relationship consultation.",
    relationship: fixture.relationship,
    requested_topics: [...fixture.requestedTopics],
  };
}

function userGoalFor(requestedTopics) {
  if (requestedTopics.includes("relationship")) return "organize_relationship";
  if (requestedTopics.includes("organize_emotions")) return "organize_emotions";
  if (requestedTopics.includes("next_three_days")) return "plan_next_three_days";
  if (requestedTopics.includes("draft_message")) return "prepare_message";
  if (requestedTopics.includes("message_impact")) return "reply_to_message";
  return "decide_send_or_wait";
}

function unknownOr(unresolvedFields, fieldPath, knownValue, unknownValue) {
  return unresolvedFields.includes(fieldPath) ? unknownValue : knownValue;
}

function makeIntake(fixture) {
  const unresolvedFields = [...fixture.unresolvedFields];
  const boundaryUnknown =
    unresolvedFields.includes("boundary_state.kind") ||
    unresolvedFields.includes("boundary_state.status");
  return {
    schema_version: "pipeline-schema-base-v2.0.0",
    relationship_stage: fixture.relationship,
    user_goal: userGoalFor(fixture.requestedTopics),
    timeline: [],
    boundaries: [],
    context: [],
    observed_facts: [
      {
        fact_id: "F001",
        statement: "The consultation contains concrete relationship facts.",
        source_refs: ["input:current_situation"],
        support: "explicit",
      },
    ],
    user_assumptions: [],
    user_emotions: [],
    material_unknowns: [],
    safety_signals: [],
    untrusted_embedded_instructions_detected: false,
    context_inferences: [],
    decision_facts: {
      schema_version: "m2-p4-base-decision-facts-v2",
      relationship_stage: fixture.relationship,
      selected_requests: [...fixture.requestedTopics],
      latest_direct_message: {
        sender: unknownOr(
          unresolvedFields,
          "latest_direct_message.sender",
          "none",
          "unknown",
        ),
        kind: unknownOr(
          unresolvedFields,
          "latest_direct_message.kind",
          "none",
          "unknown",
        ),
        response_expectation: unknownOr(
          unresolvedFields,
          "latest_direct_message.response_expectation",
          "none",
          "unknown",
        ),
        user_reply_state: unknownOr(
          unresolvedFields,
          "latest_direct_message.user_reply_state",
          "not_applicable",
          "unknown",
        ),
        sns_signal_only: false,
      },
      contact_state: {
        unanswered_user_message_count: null,
        elapsed_since_latest_user_message_minutes: null,
        usual_cadence_relation: unknownOr(
          unresolvedFields,
          "contact_state.usual_cadence_relation",
          "not_applicable",
          "unknown",
        ),
      },
      boundary_state: boundaryUnknown
        ? { kind: "unknown", status: "unknown", repeated_unanswered_contact: false }
        : { kind: "none", status: "none", repeated_unanswered_contact: false },
      practical_reason: { ...fixture.practicalReason },
      user_contact_constraint: {
        kind: "none",
        status: "none",
        supporting_fact_ids: [],
      },
      information_state: {
        assessment_mode: "best_effort",
        can_proceed_without_followup: true,
        used_context_inference: false,
        unresolved_fields: unresolvedFields,
      },
    },
    base_writing_signals: {
      schema_version: "m2-p4-base-writing-signals-v1",
      relationship_dimensions: {
        romantic_stage: { value: "unknown", basis: "relationship_chip" },
        social_role: { value: "unknown", basis: "relationship_chip" },
        hierarchy: { value: "unknown", basis: "relationship_chip" },
        familiarity: { value: "unknown", basis: "relationship_chip" },
        communication_context: { value: "unknown", basis: "relationship_chip" },
        observed_register: { value: "unknown", basis: "relationship_chip" },
      },
      message_signals: [],
      incoming_message_profile: {
        dialogue_acts: [],
        unanswered_obligations: [],
        practical_requirements: [],
        closure_signal: "unknown",
        response_expectation: "unknown",
        present: "unknown",
      },
      user_goal_detail: { value: "unknown", basis: "requested_topics" },
      explicit_user_constraints: [],
      communication_pattern: {
        usual_register: "unknown",
        usual_length: "unknown",
        usual_emoji_pattern: "unknown",
        usual_response_cadence_summary: null,
        usual_initiator: "unknown",
        reciprocal_style_summary: null,
        basis: "unresolved",
      },
      channel_and_timing: {
        channel: "unknown",
        relative_timing: "unknown",
        basis: "unresolved",
      },
      language_and_expression: {
        primary_language: "unknown",
        mixed_languages: [],
        dialect_or_regional_expression: "unknown",
        established_shared_expression: "unknown",
        intentional_nonstandard_expression: "unknown",
        possible_typo: "unknown",
        basis: "unresolved",
      },
      repeat_consultation_state: {
        state: "unknown",
        changed_fact_ids: [],
        basis: "unresolved",
      },
      privacy_markers: [],
      boundary_ownership_signals: [],
    },
  };
}

function assertPipelineProjectionPass(fixture) {
  const input = inputFor(fixture);
  const raw = makeIntake(fixture);
  const rawSnapshot = structuredClone(raw);
  validateStageOutput(pb01, raw);
  validateBaseSourceIntegrityV1({ input, rawBaseOutput: raw });

  const grounded = groundBaseStructuredIntakeV3(input, raw);
  assert.deepEqual(raw, rawSnapshot, `${fixture.id}: raw output mutated`);
  validateGroundedStageOutput(pb01, grounded);
  validateBaseSourceIntegrityV1({ input, groundedBaseOutput: grounded });
  validateContextualIntakeIntegrityV3(grounded);
  return { raw, grounded };
}

for (const fixture of historicalFailureFixtures) {
  const raw = makeIntake(fixture);
  expectSafeCode(
    () => validateContextualIntakeIntegrityV3(raw),
    "M2_CONTEXTUAL_INFERENCE_INVALID",
  );
  const result = assertPipelineProjectionPass(fixture);
  assert.ok(
    !result.grounded.decision_facts.information_state.unresolved_fields.includes(
      "practical_reason.active",
    ),
    `${fixture.id}: derived active marker survived grounding`,
  );
}

for (const fixture of successFixtures) {
  assertPipelineProjectionPass(fixture);
}

const malformed = makeIntake(successFixtures[0]);
delete malformed.decision_facts;
expectSafeCode(() => validateStageOutput(pb01, malformed), "M2_STAGE_SCHEMA_INVALID");

const contradiction = makeIntake(successFixtures[0]);
contradiction.context_inferences = [
  {
    inference_id: "I001",
    field_path: "practical_reason.kind",
    supporting_fact_ids: ["F001"],
    source_refs: ["input:current_situation"],
    rationale_summary: "A practical reason was inferred.",
  },
];
contradiction.decision_facts.information_state.used_context_inference = true;
contradiction.decision_facts.information_state.unresolved_fields.push(
  "practical_reason.kind",
);
validateStageOutput(pb01, contradiction);
expectSafeCode(
  () => validateContextualIntakeIntegrityV3(contradiction),
  "M2_CONTEXTUAL_INFERENCE_INVALID",
);

console.log(
  JSON.stringify(
    {
      result: "PASS",
      historicalFailures: historicalFailureFixtures.map(({ id }) => id),
      successControls: successFixtures.map(({ id }) => id),
      malformedPb01: "fail-closed",
      semanticContradiction: "fail-closed",
      boundedReassessment: false,
      providerCalls: 0,
      dbWrites: 0,
      stripeWrites: 0,
    },
    null,
    2,
  ),
);
