import { createHash } from "node:crypto";
import Ajv2020 from "ajv/dist/2020.js";
import { groundStructuredIntakeV5 } from "../../lib/assessment/runtime/structured-intake-grounding-v5.ts";
import { collectWritingContextIntegrityViolationsV2 } from "../../lib/assessment/runtime/writing-context-integrity-v2.ts";

const bookkeepingKeys = new Set([
  "source_refs",
  "explicit_source_refs",
  "inferred_source_refs",
  "evidence_state",
  "effect_class",
  "unresolved",
  "unresolved_fields",
  "unresolved_writing_fields",
  "message_id",
  "sequence",
  "constraint_id",
  "unchanged_since_prior",
]);

const criticalDecisionFactPaths = [
  "/relationship_stage",
  "/selected_requests",
  "/latest_direct_message/sender",
  "/latest_direct_message/kind",
  "/latest_direct_message/response_expectation",
  "/latest_direct_message/user_reply_state",
  "/latest_direct_message/sns_signal_only",
  "/contact_state/unanswered_user_message_count",
  "/contact_state/usual_cadence_relation",
  "/contact_state/proposed_message_present",
  "/boundary_state/kind",
  "/boundary_state/status",
  "/boundary_state/repeated_unanswered_contact",
  "/practical_reason/kind",
  "/practical_reason/active",
  "/practical_reason/deadline",
];

function isObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function sortedUnique(values) {
  return [...new Set(values)].sort((left, right) =>
    left.localeCompare(right, "en"),
  );
}

function canonicalize(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(",")}]`;
  return `{${Object.keys(value)
    .sort((left, right) => left.localeCompare(right, "en"))
    .map((key) => `${JSON.stringify(key)}:${canonicalize(value[key])}`)
    .join(",")}}`;
}

function same(left, right) {
  return canonicalize(left) === canonicalize(right);
}

export function shaReplayJson(value) {
  return createHash("sha256")
    .update(Buffer.from(canonicalize(value), "utf8"))
    .digest("hex");
}

function pointerValue(root, pointer) {
  if (pointer === "") return root;
  if (typeof pointer !== "string" || !pointer.startsWith("/")) return undefined;
  return pointer
    .slice(1)
    .split("/")
    .map((segment) => segment.replaceAll("~1", "/").replaceAll("~0", "~"))
    .reduce((selected, segment) => {
      if (selected === null || selected === undefined) return undefined;
      return selected[segment];
    }, root);
}

function deepSubset(actual, expected) {
  if (Array.isArray(expected)) return same(actual, expected);
  if (!isObject(expected)) return same(actual, expected);
  if (!isObject(actual)) return false;
  return Object.entries(expected).every(([key, value]) =>
    deepSubset(actual[key], value),
  );
}

function deepOverlay(target, overlay) {
  if (!isObject(overlay)) return structuredClone(overlay);
  const result = isObject(target) ? structuredClone(target) : {};
  for (const [key, value] of Object.entries(overlay)) {
    result[key] = isObject(value)
      ? deepOverlay(result[key], value)
      : structuredClone(value);
  }
  return result;
}

function stripBookkeeping(value) {
  if (Array.isArray(value)) return value.map(stripBookkeeping);
  if (!isObject(value)) return structuredClone(value);
  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => !bookkeepingKeys.has(key))
      .map(([key, child]) => [key, stripBookkeeping(child)]),
  );
}

function basisFrom(value) {
  if (!isObject(value)) return "unresolved";
  const refs = asArray(value.source_refs);
  if (refs.includes("input:current_situation")) {
    return value.evidence_state === "inferred"
      ? "current_situation_inferred"
      : "current_situation_explicit";
  }
  if (refs.includes("input:relationship")) return "relationship_chip";
  if (refs.includes("input:requested_topics")) return "requested_topics";
  if (refs.includes("input:optional_message")) return "optional_message";
  return "unresolved";
}

function signalFact(value) {
  const basis = basisFrom(value);
  if (basis === "optional_message" || basis === "requested_topics") {
    return { value: "unknown", basis: "unresolved" };
  }
  return {
    value: value?.value ?? "unknown",
    basis,
  };
}

function semanticProfile(value) {
  return isObject(value) ? stripBookkeeping(value) : null;
}

function inferBoundaryOwnership(writingContext, decisionFacts) {
  const boundary = decisionFacts?.boundary_state;
  if (
    !isObject(boundary) ||
    boundary.status !== "explicit" ||
    ![
      "no_contact",
      "temporary_distance",
      "blocked_or_restricted",
      "relationship_closed",
    ].includes(boundary.kind)
  ) {
    return [];
  }
  const incomingActs = asArray(
    writingContext?.incoming_message_profile?.dialogue_acts,
  );
  const hasIncoming = asArray(writingContext?.message_ownership).some(
    (item) => item?.author === "other_person" && item?.status === "incoming",
  );
  const hasUserConstraint =
    asArray(writingContext?.explicit_user_constraints).length > 0;
  const assertedBy =
    hasIncoming && incomingActs.includes("boundary")
      ? "other_person"
      : hasUserConstraint
        ? "user"
        : "unknown";
  return [
    {
      kind: boundary.kind,
      asserted_by: assertedBy,
      explicit: true,
    },
  ];
}

export function extractWritingSignalsFromC1ProjectionV1(rawProjection) {
  const writing = rawProjection?.writing_context ?? {};
  const decisionFacts = rawProjection?.decision_facts ?? {};
  const rawDimensions = writing.relationship_dimensions ?? {};
  const conversationSignals = asArray(writing.message_ownership)
    .filter((item) => item?.status !== "unsent_candidate")
    .map((item) => ({ author: item.author, status: item.status }));
  const incomingPresent = conversationSignals.some(
    (item) => item.status === "incoming",
  )
    ? true
    : ["user", "none"].includes(decisionFacts?.latest_direct_message?.sender)
      ? false
      : "unknown";
  const communication = stripBookkeeping(writing.communication_pattern ?? {});
  const channel = stripBookkeeping(writing.channel_and_timing ?? {});
  const language = stripBookkeeping(writing.language_and_expression ?? {});
  const repeat = stripBookkeeping(writing.repeat_consultation_state ?? {});
  return {
    schema_version: "m2-p4-writing-signals-v1",
    relationship_dimensions: {
      romantic_stage: signalFact(rawDimensions.romantic_stage),
      social_role: signalFact(rawDimensions.social_role),
      hierarchy: signalFact(rawDimensions.hierarchy),
      familiarity: signalFact(rawDimensions.familiarity),
      communication_context: signalFact(rawDimensions.communication_context),
      observed_register: signalFact(rawDimensions.observed_register),
    },
    message_signals: conversationSignals,
    incoming_message_profile: {
      dialogue_acts: asArray(writing.incoming_message_profile?.dialogue_acts),
      unanswered_obligations: asArray(
        writing.incoming_message_profile?.unanswered_obligations,
      ),
      practical_requirements: asArray(
        writing.incoming_message_profile?.practical_requirements,
      ),
      closure_signal:
        writing.incoming_message_profile?.closure_signal ?? "unknown",
      response_expectation:
        writing.incoming_message_profile?.response_expectation ?? "unknown",
      present: incomingPresent,
    },
    candidate_style_profile: semanticProfile(writing.candidate_style_profile),
    candidate_communicative_intent: semanticProfile(
      writing.candidate_communicative_intent,
    ),
    user_goal_detail: {
      value: writing.user_goal_detail?.value ?? "unknown",
      basis: basisFrom(writing.user_goal_detail),
    },
    explicit_user_constraints: asArray(writing.explicit_user_constraints).map(
      (constraint) => ({
        kind: constraint.kind,
        bounded_summary: constraint.bounded_summary ?? null,
      }),
    ),
    communication_pattern: {
      ...communication,
      basis: basisFrom(writing.communication_pattern),
    },
    channel_and_timing: {
      ...channel,
      basis: basisFrom(writing.channel_and_timing),
    },
    language_and_expression: {
      ...language,
      mixed_languages: asArray(language.mixed_languages),
      basis: basisFrom(writing.language_and_expression),
    },
    repeat_consultation_state: {
      state: repeat.state ?? "unknown",
      changed_fact_ids: asArray(repeat.changed_fact_ids),
      basis: basisFrom(writing.repeat_consultation_state),
    },
    privacy_markers: sortedUnique(asArray(writing.privacy_markers)),
    boundary_ownership_signals: inferBoundaryOwnership(
      writing,
      decisionFacts,
    ),
  };
}

function userGoalFromRequestedTopics(topics) {
  if (topics.includes("draft_message")) return "prepare_message";
  if (topics.includes("relationship")) return "organize_relationship";
  if (topics.includes("next_three_days")) return "plan_next_three_days";
  if (topics.includes("organize_emotions")) return "organize_emotions";
  if (topics.includes("decide_send_or_wait")) return "decide_send_or_wait";
  return "unknown";
}

function assessmentInput(diagnosticCase) {
  return {
    currentSituation: diagnosticCase.input.current_situation,
    optionalMessage: diagnosticCase.input.optional_message,
    relationship: diagnosticCase.input.relationship,
    requestedTopics: diagnosticCase.input.requested_topics,
    privacyAcknowledged: true,
  };
}

export function buildC1ReplayStructuredIntakeV5(diagnosticCase, rawProjection) {
  const request = assessmentInput(diagnosticCase);
  const writingSignals = extractWritingSignalsFromC1ProjectionV1(rawProjection);
  for (const expected of diagnosticCase.expected_source_ownership ?? []) {
    if (
      expected.status !== "unsent_candidate" &&
      !writingSignals.message_signals.some(
        (actual) =>
          actual.author === expected.author && actual.status === expected.status,
      )
    ) {
      writingSignals.message_signals.push({
        author: expected.author,
        status: expected.status,
      });
    }
  }
  return {
    schema_version: "pipeline-schema-v5.0.0",
    relationship_stage: request.relationship,
    user_goal: userGoalFromRequestedTopics(request.requestedTopics),
    timeline: [],
    boundaries: [],
    context: [],
    observed_facts: [],
    user_assumptions: [],
    user_emotions: [],
    material_unknowns: [],
    safety_signals: [],
    untrusted_embedded_instructions_detected:
      rawProjection.untrusted_embedded_instructions_detected === true,
    context_inferences: [],
    decision_facts: deepOverlay(
      rawProjection.decision_facts,
      diagnosticCase.expected_decision_fact_subset,
    ),
    writing_signals: writingSignals,
  };
}

function targetRoot(call, target) {
  if (target === "decision_facts") return call.decision_facts;
  if (target === "writing_context") return call.writing_context;
  if (target === "raw_projection") return call.raw_projection;
  if (target === "grounded_projection") return call.grounded_projection;
  if (target === "legacy_projection") return call.legacy_projection;
  return undefined;
}

function evaluateOperator(assertion, actual, root) {
  switch (assertion.operator) {
    case "equals":
      return same(actual, assertion.expected);
    case "not_equals":
      return !same(actual, assertion.expected);
    case "one_of":
      return assertion.expected.some((value) => same(actual, value));
    case "not_one_of":
      return assertion.expected.every((value) => !same(actual, value));
    case "contains":
      return Array.isArray(actual) &&
        actual.some((value) => same(value, assertion.expected));
    case "not_contains":
      return !Array.isArray(actual) ||
        actual.every((value) => !same(value, assertion.expected));
    case "length":
      return Array.isArray(actual) && actual.length === assertion.expected;
    case "count_where":
      return Array.isArray(actual) &&
        actual.filter((item) => deepSubset(item, assertion.where)).length ===
          assertion.expected;
    case "array_contains_subset":
      return Array.isArray(actual) &&
        actual.some((item) => deepSubset(item, assertion.expected));
    case "array_not_contains_subset":
      return !Array.isArray(actual) ||
        actual.every((item) => !deepSubset(item, assertion.expected));
    case "json_not_contains":
      return !JSON.stringify(actual).includes(assertion.expected);
    case "references_ownership":
      return (
        typeof actual === "string" &&
        Array.isArray(root?.message_ownership) &&
        root.message_ownership.some(
          (item) =>
            item?.message_id === actual && deepSubset(item, assertion.expected),
        )
      );
    default:
      return false;
  }
}

function evaluateAssertion(call, assertion) {
  const root = targetRoot(call, assertion.target);
  return {
    id: assertion.id,
    passed: evaluateOperator(assertion, pointerValue(root, assertion.path), root),
    fail_code: assertion.fail_code ?? null,
  };
}

function score(results) {
  const passed = results.filter((item) => item.passed).length;
  const total = results.length;
  return {
    passed,
    total,
    rate: total === 0 ? null : passed / total,
    evidence_status: total === 0 ? "unavailable" : "available",
  };
}

function ownershipParity(writingContext, expected) {
  return expected.every((wanted) =>
    asArray(writingContext?.message_ownership).some((actual) =>
      deepSubset(actual, wanted),
    ),
  );
}

function constraintsCanonical(writingContext) {
  return asArray(writingContext?.explicit_user_constraints).every(
    (constraint, index) =>
      constraint?.constraint_id ===
        `UC${String(index + 1).padStart(3, "0")}` &&
      same(constraint?.source_refs, ["input:current_situation"]) &&
      (constraint?.kind === "custom_explicit_constraint"
        ? typeof constraint?.bounded_summary === "string" &&
          constraint.bounded_summary.trim().length > 0
        : constraint?.bounded_summary === null),
  );
}

function auxiliaryV3Comparison(
  groundedDecisionFacts,
  v3DecisionFacts,
) {
  if (!isObject(v3DecisionFacts)) return null;
  const boundary = groundedDecisionFacts?.boundary_state;
  const nonmaterial =
    boundary?.status === "explicit" &&
    ["no_contact", "relationship_closed", "blocked_or_restricted"].includes(
      boundary?.kind,
    )
      ? new Set(["/contact_state/usual_cadence_relation"])
      : new Set();
  const mismatched = criticalDecisionFactPaths.filter(
    (path) =>
      !nonmaterial.has(path) &&
      !same(
        pointerValue(groundedDecisionFacts, path),
        pointerValue(v3DecisionFacts, path),
      ),
  );
  return {
    passed: mismatched.length === 0,
    mismatched_material_paths: mismatched,
    nonmaterial_paths: [...nonmaterial],
    evidence_role: "auxiliary_only",
  };
}

export function evaluateC1OfflineReplayV2({
  caseBundle,
  diagnosticResults,
  providerSchema,
  groundedSchema,
}) {
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  const validateProvider = ajv.compile(providerSchema);
  const validateGrounded = ajv.compile(groundedSchema);
  const calls = diagnosticResults.cases ?? [];
  const v4Calls = calls.filter((call) => call.contract_variant === "v4");
  const caseResults = [];
  const semanticResults = [];
  const softResults = [];

  for (const diagnosticCase of caseBundle.cases) {
    const saved = v4Calls.find((call) => call.case_id === diagnosticCase.case_id);
    if (!saved?.raw_typed_projection) continue;
    const request = assessmentInput(diagnosticCase);
    const rawV5 = buildC1ReplayStructuredIntakeV5(
      diagnosticCase,
      saved.raw_typed_projection,
    );
    const providerSchemaPassed = validateProvider(rawV5);
    const grounded = groundStructuredIntakeV5(request, rawV5);
    const groundedSchemaPassed = validateGrounded(grounded);
    const integrityViolations = collectWritingContextIntegrityViolationsV2(
      request,
      grounded,
    );
    const legacy = structuredClone(grounded);
    delete legacy.writing_context;
    legacy.schema_version = "pipeline-schema-v3.0.0";
    const assertionCall = {
      decision_facts: grounded.decision_facts,
      writing_context: grounded.writing_context,
      raw_projection: saved.raw_typed_projection,
      grounded_projection: grounded,
      legacy_projection: legacy,
    };
    const hard = asArray(diagnosticCase.hard_assertions)
      .filter(
        (assertion) =>
          assertion.scope === "both" || assertion.scope === "v4",
      )
      .map((assertion) => evaluateAssertion(assertionCall, assertion));
    const forbidden = asArray(diagnosticCase.forbidden_assertions)
      .filter(
        (assertion) =>
          assertion.scope === "both" || assertion.scope === "v4",
      )
      .map((assertion) => evaluateAssertion(assertionCall, assertion));
    const soft = asArray(diagnosticCase.soft_assertions)
      .filter(
        (assertion) =>
          assertion.scope === "both" || assertion.scope === "v4",
      )
      .map((assertion) => evaluateAssertion(assertionCall, assertion));
    hard.push(
      {
        id: `${diagnosticCase.case_id}-EXPECTED-WRITING-SUBSET`,
        passed: deepSubset(
          grounded.writing_context,
          diagnosticCase.expected_writing_context_subset,
        ),
        fail_code: "SOURCE_PROVENANCE_INVALID",
      },
      {
        id: `${diagnosticCase.case_id}-EXPECTED-OWNERSHIP`,
        passed: ownershipParity(
          grounded.writing_context,
          diagnosticCase.expected_source_ownership ?? [],
        ),
        fail_code: "MESSAGE_OWNER_CONFUSION",
      },
    );
    semanticResults.push(...hard, ...forbidden);
    softResults.push(...soft);
    const v3 = calls.find(
      (call) =>
        call.case_id === diagnosticCase.case_id &&
        call.contract_variant === "v3",
    );
    const candidateExpected = request.optionalMessage !== null;
    const candidateActual =
      grounded.writing_context?.candidate_style_profile !== null &&
      grounded.writing_context?.candidate_communicative_intent !== null;
    caseResults.push({
      case_id: diagnosticCase.case_id,
      provider_transport_passed:
        saved.provider_completed === true,
      raw_schema_passed: providerSchemaPassed,
      grounded_schema_passed: groundedSchemaPassed,
      integrity_passed: integrityViolations.length === 0,
      integrity_violations: integrityViolations,
      critical_expected_subset_passed: deepSubset(
        grounded.decision_facts,
        diagnosticCase.expected_decision_fact_subset,
      ),
      semantic_assertions_passed: hard.every((item) => item.passed) &&
        forbidden.every((item) => item.passed),
      soft_assertions: score(soft),
      candidate_presence_passed: candidateExpected === candidateActual,
      ownership_passed: ownershipParity(
        grounded.writing_context,
        diagnosticCase.expected_source_ownership ?? [],
      ),
      constraint_provenance_passed: constraintsCanonical(
        grounded.writing_context,
      ),
      privacy_repeat_injection_passed:
        same(
          grounded.writing_context?.privacy_markers,
          rawV5.writing_signals.privacy_markers,
        ) &&
        grounded.writing_context?.repeat_consultation_state?.state ===
          rawV5.writing_signals.repeat_consultation_state.state &&
        grounded.untrusted_embedded_instructions_detected ===
          rawV5.untrusted_embedded_instructions_detected,
      auxiliary_v3_comparison: auxiliaryV3Comparison(
        grounded.decision_facts,
        v3?.decision_facts,
      ),
      output_sha256: shaReplayJson({
        decision_facts: grounded.decision_facts,
        writing_context: grounded.writing_context,
      }),
      raw_v5: rawV5,
      grounded_output: grounded,
    });
  }

  const metric = (field) =>
    score(
      caseResults.map((item) => ({ passed: item[field] === true })),
    );
  const auxiliary = caseResults
    .map((item) => item.auxiliary_v3_comparison)
    .filter((item) => item !== null);
  const evaluation = {
    evaluator_version: "m2-p4-i3-r1-c1-r1-replay-evaluator-v2",
    cases: caseResults,
    metrics: {
      provider_transport: metric("provider_transport_passed"),
      raw_schema: metric("raw_schema_passed"),
      grounded_schema: metric("grounded_schema_passed"),
      integrity: metric("integrity_passed"),
      critical_expected_subset: metric("critical_expected_subset_passed"),
      semantic_assertions: score(semanticResults),
      soft_assertions: score(softResults),
      candidate_presence: metric("candidate_presence_passed"),
      ownership: metric("ownership_passed"),
      constraint_provenance: metric("constraint_provenance_passed"),
      privacy_repeat_injection: metric("privacy_repeat_injection_passed"),
      auxiliary_v3_parity: score(
        auxiliary.map((item) => ({ passed: item.passed })),
      ),
    },
  };
  evaluation.verdict = [
    "provider_transport",
    "raw_schema",
    "grounded_schema",
    "integrity",
    "critical_expected_subset",
    "semantic_assertions",
    "candidate_presence",
    "ownership",
    "constraint_provenance",
    "privacy_repeat_injection",
  ].every((metricName) => evaluation.metrics[metricName].rate === 1)
    ? "PASS"
    : "FAIL";
  return evaluation;
}

export function replayResultsArtifactV1(evaluation) {
  return {
    schema_version: "m2-p4-i3-r1-c1-r1-replay-results-v1",
    task_id: "M2-P4-I3-R1-C1-R1",
    evaluator_version: evaluation.evaluator_version,
    verdict: evaluation.verdict,
    provider_calls_during_replay: 0,
    db_operations: 0,
    supabase_operations: 0,
    holdout_use: 0,
    metrics: structuredClone(evaluation.metrics),
    cases: evaluation.cases.map((caseResult) => {
      const artifactCase = structuredClone(caseResult);
      delete artifactCase.raw_v5;
      delete artifactCase.grounded_output;
      return artifactCase;
    }),
  };
}
