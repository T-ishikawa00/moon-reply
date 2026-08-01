import { createHash } from "node:crypto";
import { buildContextualDecisionPolicyV3 } from "../../lib/assessment/runtime/policy-v3.ts";

export const EVALUATOR_VERSION =
  "m2-p4-i3-r1-c1-r2-provider-evaluator-v1";

function isObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
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

function sortedUnique(values) {
  return [...new Set(values)].sort((left, right) =>
    left.localeCompare(right, "en"),
  );
}

function deepSubset(actual, expected) {
  if (Array.isArray(expected)) return same(actual, expected);
  if (!isObject(expected)) return same(actual, expected);
  if (!isObject(actual)) return false;
  return Object.entries(expected).every(([key, value]) =>
    deepSubset(actual[key], value),
  );
}

function subsetMismatchedPaths(actual, expected, pointer = "") {
  if (Array.isArray(expected) || !isObject(expected)) {
    return same(actual, expected) ? [] : [pointer || "/"];
  }
  if (!isObject(actual)) return [pointer || "/"];
  return Object.entries(expected).flatMap(([key, value]) => {
    const escaped = key.replaceAll("~", "~0").replaceAll("/", "~1");
    return subsetMismatchedPaths(actual[key], value, `${pointer}/${escaped}`);
  });
}

function strings(value) {
  if (Array.isArray(value)) return value.flatMap(strings);
  if (isObject(value)) return Object.values(value).flatMap(strings);
  return typeof value === "string" ? [value] : [];
}

function keyPaths(value, predicate, pointer = "") {
  if (Array.isArray(value)) {
    return value.flatMap((child, index) =>
      keyPaths(child, predicate, `${pointer}/${String(index)}`),
    );
  }
  if (!isObject(value)) return [];
  return Object.entries(value).flatMap(([key, child]) => {
    const selected = `${pointer}/${key}`;
    return [
      ...(predicate(key) ? [selected] : []),
      ...keyPaths(child, predicate, selected),
    ];
  });
}

export function shaDiagnosticJson(value) {
  return createHash("sha256")
    .update(Buffer.from(canonicalize(value), "utf8"))
    .digest("hex");
}

export function forbiddenBookkeepingPaths(writingSignals, forbiddenKeys) {
  const forbidden = new Set(forbiddenKeys);
  return keyPaths(writingSignals, (key) => forbidden.has(key));
}

export function probabilityConfidencePaths(writingSignals) {
  return keyPaths(writingSignals, (key) =>
    /^(?:probability|confidence)(?:_|$)/iu.test(key),
  );
}

export function rawPiiValues(writingSignals) {
  return sortedUnique(
    strings(writingSignals).filter(
      (value) =>
        /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/iu.test(value) ||
        /@[A-Z0-9_]{2,}/iu.test(value) ||
        /\b\d{2,4}[- ]\d{2,4}[- ]\d{3,4}\b/u.test(value),
    ),
  );
}

export function caseFixtureOracleReferences(writingSignals) {
  const keyMatches = keyPaths(writingSignals, (key) =>
    /(?:case|fixture|oracle)/iu.test(key),
  );
  const valueMatches = strings(writingSignals).filter((value) =>
    /(?:\bR2-\d{2}\b|\bPAIR-\d{2}\b|\bV4-\d{2}\b|case|fixture|oracle)/iu.test(
      value,
    ),
  );
  return [...keyMatches, ...valueMatches];
}

export function secretLeakageValues(value) {
  return sortedUnique(
    strings(value).filter(
      (item) =>
        /\bsk-[A-Za-z0-9_-]{16,}\b/u.test(item) ||
        /\bBearer\s+[A-Za-z0-9._-]{20,}\b/u.test(item) ||
        /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/u.test(item),
    ),
  );
}

function assertion(id, category, passed, expected, actual, hard = true) {
  return {
    id,
    category,
    passed: passed === true,
    hard,
    expected: structuredClone(expected),
    actual: structuredClone(actual),
  };
}

function valuesIncludeAny(actual, expected) {
  return asArray(actual).some((item) => expected.includes(item));
}

function exactRawMessages(actualMessages, expectedMessages) {
  return (
    actualMessages.length === expectedMessages.length &&
    expectedMessages.every(
      (expected, index) =>
        actualMessages[index]?.author === expected.author &&
        expected.statuses.includes(actualMessages[index]?.status),
    )
  );
}

function boundarySignalsMatch(actualValue, qualityCase) {
  const actual = asArray(actualValue);
  if (
    qualityCase.boundary_signal_rule ===
    "only_user_owned_nonrestrictive_or_empty"
  ) {
    return actual.every(
      (item) =>
        item?.kind === "other" &&
        item?.asserted_by === "user" &&
        item?.explicit === true,
    );
  }
  return same(actual, qualityCase.boundary_signals);
}

function canonicalGroundedMessages(
  ownership,
  expectedRawMessages,
  candidatePresent,
  actualRawMessages,
) {
  const expected = expectedRawMessages.map((message, index) => ({
    author: message.author,
    status: message.statuses.includes(actualRawMessages[index]?.status)
      ? actualRawMessages[index].status
      : message.statuses[0],
    source_refs: ["input:current_situation"],
  }));
  if (candidatePresent) {
    expected.push({
      author: "user",
      status: "unsent_candidate",
      source_refs: ["input:optional_message"],
    });
  }
  return (
    ownership.length === expected.length &&
    expected.every(
      (wanted, index) =>
        ownership[index]?.message_id ===
          `MSG${String(index + 1).padStart(3, "0")}` &&
        ownership[index]?.sequence === index + 1 &&
        ownership[index]?.author === wanted.author &&
        ownership[index]?.status === wanted.status &&
        same(ownership[index]?.source_refs, wanted.source_refs),
    )
  );
}

function collectNestedSourceRefs(value, result, root) {
  if (Array.isArray(value)) {
    for (const item of value) collectNestedSourceRefs(item, result, root);
    return;
  }
  if (!isObject(value)) return;
  for (const [key, child] of Object.entries(value)) {
    if (key === "source_refs" && value !== root) {
      result.push(
        ...asArray(child).filter((item) => typeof item === "string"),
      );
      continue;
    }
    collectNestedSourceRefs(child, result, root);
  }
}

function canonicalSourceUnionPassed(writingContext) {
  if (!isObject(writingContext)) return false;
  const nested = [];
  collectNestedSourceRefs(writingContext, nested, writingContext);
  return same(writingContext.source_refs, sortedUnique(nested));
}

function score(assertions) {
  const passed = assertions.filter((item) => item.passed).length;
  const total = assertions.length;
  return {
    passed,
    total,
    rate: total === 0 ? null : passed / total,
    evidence_status: total === 0 ? "unavailable" : "available",
  };
}

function categoryResult(assertions, category) {
  const selected = assertions.filter((item) => item.category === category);
  return {
    passed: selected.length > 0 && selected.every((item) => item.passed),
    evidence_status: selected.length === 0 ? "unavailable" : "available",
    assertions: selected,
  };
}

function relationshipAssertions(signals, qualityCase, callIndex) {
  const results = [];
  const dimensions = isObject(signals?.relationship_dimensions)
    ? signals.relationship_dimensions
    : {};
  for (const [dimension, accepted] of Object.entries(
    qualityCase.relationship_values,
  )) {
    results.push(
      assertion(
        `R2-${callIndex}-REL-${dimension}-EXPECTED`,
        "relationship_limits",
        accepted.includes(dimensions[dimension]?.value),
        accepted,
        dimensions[dimension]?.value ?? null,
      ),
    );
  }
  for (const [dimension, forbidden] of Object.entries(
    qualityCase.relationship_forbidden,
  )) {
    results.push(
      assertion(
        `R2-${callIndex}-REL-${dimension}-LIMIT`,
        "relationship_limits",
        !forbidden.includes(dimensions[dimension]?.value),
        { not_one_of: forbidden },
        dimensions[dimension]?.value ?? null,
      ),
    );
  }
  const chipOnly = qualityCase.relationship_chip_only_dimension;
  if (chipOnly !== null) {
    const unsupported = Object.entries(dimensions).filter(
      ([dimension, value]) =>
        dimension !== chipOnly &&
        value?.basis === "relationship_chip" &&
        value?.value !== "unknown",
    );
    results.push(
      assertion(
        `R2-${callIndex}-REL-CHIP-CEILING`,
        "relationship_limits",
        unsupported.length === 0,
        { relationship_chip_only_dimension: chipOnly },
        unsupported.map(([dimension]) => dimension),
      ),
    );
  }
  if (results.length === 0) {
    results.push(
      assertion(
        `R2-${callIndex}-REL-NO-UNSUPPORTED-ROMANCE`,
        "relationship_limits",
        !["dating_before_relationship", "partner"].includes(
          dimensions.romantic_stage?.value,
        ),
        { not_one_of: ["dating_before_relationship", "partner"] },
        dimensions.romantic_stage?.value ?? null,
      ),
    );
  }
  return results;
}

function candidateAssertions(signals, qualityCase, callIndex) {
  const results = [];
  const style = signals?.candidate_style_profile ?? null;
  const intent = signals?.candidate_communicative_intent ?? null;
  const expectedPresent = qualityCase.candidate_present;
  results.push(
    assertion(
      `R2-${callIndex}-CANDIDATE-PRESENCE`,
      "candidate_presence",
      expectedPresent
        ? isObject(style) && isObject(intent)
        : style === null && intent === null,
      expectedPresent,
      { style_present: isObject(style), intent_present: isObject(intent) },
    ),
  );
  if (qualityCase.candidate_style !== null) {
    results.push(
      assertion(
        `R2-${callIndex}-CANDIDATE-STYLE-NONNULL`,
        "candidate_style",
        isObject(style),
        "non-null",
        style === null ? null : "present",
      ),
    );
    for (const [field, accepted] of Object.entries(
      qualityCase.candidate_style,
    )) {
      results.push(
        assertion(
          `R2-${callIndex}-CANDIDATE-STYLE-${field}`,
          "candidate_style",
          accepted.includes(style?.[field]),
          accepted,
          style?.[field] ?? null,
        ),
      );
    }
  }
  if (qualityCase.candidate_intent !== null) {
    results.push(
      assertion(
        `R2-${callIndex}-CANDIDATE-INTENT-NONNULL`,
        "candidate_intent",
        isObject(intent),
        "non-null",
        intent === null ? null : "present",
      ),
    );
    for (const [field, accepted] of Object.entries(
      qualityCase.candidate_intent,
    )) {
      results.push(
        assertion(
          `R2-${callIndex}-CANDIDATE-INTENT-${field}`,
          "candidate_intent",
          accepted.includes(intent?.[field]),
          accepted,
          intent?.[field] ?? null,
        ),
      );
    }
  }
  return results;
}

function privacyAssertions(raw, signals, qualityCase, callIndex) {
  const results = [];
  const privacy = asArray(signals?.privacy_markers);
  for (const marker of qualityCase.privacy_markers_required) {
    results.push(
      assertion(
        `R2-${callIndex}-PRIVACY-${marker}`,
        "privacy_repeat_injection",
        privacy.includes(marker),
        marker,
        privacy,
      ),
    );
  }
  results.push(
    assertion(
      `R2-${callIndex}-RAW-PII-ABSENT`,
      "privacy_repeat_injection",
      rawPiiValues(signals).length === 0,
      0,
      rawPiiValues(signals).length,
    ),
    assertion(
      `R2-${callIndex}-EMBEDDED-INSTRUCTION`,
      "privacy_repeat_injection",
      raw?.untrusted_embedded_instructions_detected ===
        qualityCase.embedded_instruction_detected,
      qualityCase.embedded_instruction_detected,
      raw?.untrusted_embedded_instructions_detected ?? null,
    ),
    assertion(
      `R2-${callIndex}-REPEAT-STATE`,
      "privacy_repeat_injection",
      qualityCase.repeat_states.includes(
        signals?.repeat_consultation_state?.state,
      ),
      qualityCase.repeat_states,
      signals?.repeat_consultation_state?.state ?? null,
    ),
  );
  if (Object.hasOwn(qualityCase, "changed_fact_ids")) {
    results.push(
      assertion(
        `R2-${callIndex}-REPEAT-CHANGED-FACTS`,
        "privacy_repeat_injection",
        same(
          signals?.repeat_consultation_state?.changed_fact_ids,
          qualityCase.changed_fact_ids,
        ),
        qualityCase.changed_fact_ids,
        signals?.repeat_consultation_state?.changed_fact_ids ?? null,
      ),
    );
  }
  return results;
}

function softStyleAssertions(signals, qualityCase, callIndex) {
  const style = signals?.candidate_style_profile;
  return Object.entries(qualityCase.soft_style).map(([field, accepted]) =>
    assertion(
      `R2-${callIndex}-SOFT-STYLE-${field}`,
      "soft_style",
      accepted.includes(style?.[field]),
      accepted,
      style?.[field] ?? null,
      false,
    ),
  );
}

function adjudicateDecisionFacts(decisionFacts, qualityCase) {
  const mismatched = subsetMismatchedPaths(
    decisionFacts,
    qualityCase.decision_fact_subset,
  );
  if (mismatched.length > 0) {
    return {
      passed: false,
      disposition: "material_mismatch",
      mismatched_paths: mismatched,
      decision_policy_identical: null,
    };
  }
  if (!qualityCase.schedule_kind_equivalence) {
    return {
      passed: true,
      disposition:
        decisionFacts?.latest_direct_message?.sender === "user" ||
        decisionFacts?.latest_direct_message?.sender === "none"
          ? "canonical_sender_not_applicable"
          : "strict_match",
      mismatched_paths: [],
      decision_policy_identical: null,
    };
  }
  const actualKind = decisionFacts?.latest_direct_message?.kind;
  if (!["question", "schedule_coordination"].includes(actualKind)) {
    return {
      passed: false,
      disposition: "material_mismatch",
      mismatched_paths: ["/latest_direct_message/kind"],
      decision_policy_identical: null,
    };
  }
  if (actualKind === "schedule_coordination") {
    return {
      passed: true,
      disposition: "strict_schedule_coordination",
      mismatched_paths: [],
      decision_policy_identical: true,
    };
  }
  try {
    const scheduleFacts = structuredClone(decisionFacts);
    scheduleFacts.latest_direct_message.kind = "schedule_coordination";
    const identical = same(
      buildContextualDecisionPolicyV3(decisionFacts),
      buildContextualDecisionPolicyV3(scheduleFacts),
    );
    return {
      passed: identical,
      disposition: identical
        ? "nonmaterial_taxonomy_equivalence"
        : "material_policy_difference",
      mismatched_paths: identical ? [] : ["/latest_direct_message/kind"],
      decision_policy_identical: identical,
    };
  } catch {
    return {
      passed: false,
      disposition: "decision_policy_unavailable",
      mismatched_paths: ["/latest_direct_message/kind"],
      decision_policy_identical: false,
    };
  }
}

function groundedAssertions(call, signals, qualityCase, callIndex) {
  const grounded = call.grounded_output;
  const writing = grounded?.writing_context;
  const ownership = asArray(writing?.message_ownership);
  const rawMessages = asArray(signals?.message_signals);
  const results = [
    assertion(
      `R2-${callIndex}-GROUNDED-WRITING-CONTEXT`,
      "application_grounding",
      isObject(writing) && !Object.hasOwn(grounded ?? {}, "writing_signals"),
      { writing_context: "present", writing_signals: "absent" },
      {
        writing_context: isObject(writing) ? "present" : "absent",
        writing_signals: Object.hasOwn(grounded ?? {}, "writing_signals")
          ? "present"
          : "absent",
      },
    ),
    assertion(
      `R2-${callIndex}-CANONICAL-MESSAGE-OWNERSHIP`,
      "message_ownership",
      canonicalGroundedMessages(
        ownership,
        qualityCase.raw_messages,
        qualityCase.candidate_present,
        rawMessages,
      ),
      "canonical IDs, sequence, authors, statuses, and sources",
      ownership.map((item) => ({
        message_id: item?.message_id,
        author: item?.author,
        status: item?.status,
        sequence: item?.sequence,
        source_refs: item?.source_refs,
      })),
    ),
    assertion(
      `R2-${callIndex}-CANONICAL-SOURCE-UNION`,
      "application_grounding",
      canonicalSourceUnionPassed(writing),
      "sorted unique nested source union",
      writing?.source_refs ?? null,
    ),
    assertion(
      `R2-${callIndex}-GROUNDED-BOUNDARY`,
      "boundary_ownership",
      deepSubset(
        grounded?.decision_facts?.boundary_state,
        qualityCase.grounded_boundary,
      ),
      qualityCase.grounded_boundary,
      grounded?.decision_facts?.boundary_state ?? null,
    ),
    assertion(
      `R2-${callIndex}-GROUNDED-CANDIDATE-PRESENCE`,
      "candidate_presence",
      qualityCase.candidate_present
        ? isObject(writing?.candidate_style_profile) &&
          isObject(writing?.candidate_communicative_intent)
        : writing?.candidate_style_profile === null &&
          writing?.candidate_communicative_intent === null,
      qualityCase.candidate_present,
      {
        style_present: isObject(writing?.candidate_style_profile),
        intent_present: isObject(writing?.candidate_communicative_intent),
      },
    ),
    assertion(
      `R2-${callIndex}-PRIVACY-PRESERVED`,
      "privacy_repeat_injection",
      same(
        sortedUnique(asArray(writing?.privacy_markers)),
        sortedUnique(asArray(signals?.privacy_markers)),
      ),
      signals?.privacy_markers ?? null,
      writing?.privacy_markers ?? null,
    ),
    assertion(
      `R2-${callIndex}-REPEAT-PRESERVED`,
      "privacy_repeat_injection",
      writing?.repeat_consultation_state?.state ===
        signals?.repeat_consultation_state?.state &&
        same(
          writing?.repeat_consultation_state?.changed_fact_ids,
          signals?.repeat_consultation_state?.changed_fact_ids,
        ),
      {
        state: signals?.repeat_consultation_state?.state ?? null,
        changed_fact_ids:
          signals?.repeat_consultation_state?.changed_fact_ids ?? null,
      },
      {
        state: writing?.repeat_consultation_state?.state ?? null,
        changed_fact_ids:
          writing?.repeat_consultation_state?.changed_fact_ids ?? null,
      },
    ),
    assertion(
      `R2-${callIndex}-INJECTION-PRESERVED`,
      "privacy_repeat_injection",
      grounded?.untrusted_embedded_instructions_detected ===
        call.raw_output?.untrusted_embedded_instructions_detected,
      call.raw_output?.untrusted_embedded_instructions_detected ?? null,
      grounded?.untrusted_embedded_instructions_detected ?? null,
    ),
  ];
  if (qualityCase.candidate_present) {
    results.push(
      assertion(
        `R2-${callIndex}-GROUNDED-CANDIDATE-BASIS`,
        "application_grounding",
        [
          writing?.candidate_style_profile,
          writing?.candidate_communicative_intent,
        ].every(
          (profile) =>
            profile?.evidence_state === "explicit" &&
            same(profile?.source_refs, ["input:optional_message"]),
        ),
        {
          evidence_state: "explicit",
          source_refs: ["input:optional_message"],
        },
        {
          style: writing?.candidate_style_profile
            ? {
                evidence_state:
                  writing.candidate_style_profile.evidence_state ?? null,
                source_refs: writing.candidate_style_profile.source_refs ?? null,
              }
            : null,
          intent: writing?.candidate_communicative_intent
            ? {
                evidence_state:
                  writing.candidate_communicative_intent.evidence_state ?? null,
                source_refs:
                  writing.candidate_communicative_intent.source_refs ?? null,
              }
            : null,
        },
      ),
    );
  }
  if (call.case_id === "R2-06") {
    const incomingId = writing?.incoming_message_profile?.message_id;
    results.push(
      assertion(
        "R2-06-INCOMING-POINTS-TO-SECOND-MESSAGE",
        "message_ownership",
        incomingId === "MSG002" &&
          ownership[1]?.author === "other_person" &&
          ownership[1]?.status === "incoming" &&
          !asArray(writing?.incoming_message_profile?.source_refs).includes(
            "input:optional_message",
          ),
        "MSG002 incoming other_person without optional-message evidence",
        {
          incoming_message_id: incomingId ?? null,
          ownership: ownership[1] ?? null,
          source_refs: writing?.incoming_message_profile?.source_refs ?? null,
        },
      ),
    );
  }
  if (call.case_id === "R2-08") {
    const otherItems = ownership.filter(
      (item) =>
        item?.author === "other_person" &&
        ["incoming", "quoted_history"].includes(item?.status),
    );
    results.push(
      assertion(
        "R2-08-PRINCIPAL-QUOTED-OWNERSHIP",
        "message_ownership",
        ownership.length === 1 && otherItems.length === 1,
        "one canonical other-person incoming or quoted-history item",
        ownership.map((item) => ({
          message_id: item?.message_id,
          author: item?.author,
          status: item?.status,
        })),
      ),
    );
  }
  return results;
}

export function evaluateProviderCall({ call, contract, qualityCase }) {
  const raw = call.raw_output;
  const signals = isObject(raw?.writing_signals) ? raw.writing_signals : null;
  const rawMessages = asArray(signals?.message_signals);
  const callIndex = String(call.call_index ?? 0).padStart(2, "0");
  const forbiddenPaths = forbiddenBookkeepingPaths(
    signals,
    contract.forbidden_writing_signal_keys,
  );
  const probabilityPaths = probabilityConfidencePaths(signals);
  const referenceMatches = caseFixtureOracleReferences(signals);
  const assertions = [
    assertion(
      `R2-${callIndex}-RAW-SCHEMA-VERSION`,
      "raw_semantic_coverage",
      raw?.schema_version === contract.provider_schema,
      contract.provider_schema,
      raw?.schema_version ?? null,
    ),
    assertion(
      `R2-${callIndex}-WRITING-SIGNALS-PRESENT`,
      "raw_semantic_coverage",
      isObject(signals),
      "present",
      isObject(signals) ? "present" : "absent",
    ),
    assertion(
      `R2-${callIndex}-WRITING-CONTEXT-ABSENT`,
      "raw_semantic_coverage",
      isObject(raw) && !Object.hasOwn(raw, "writing_context"),
      "absent",
      Object.hasOwn(raw ?? {}, "writing_context") ? "present" : "absent",
    ),
    assertion(
      `R2-${callIndex}-FORBIDDEN-BOOKKEEPING`,
      "raw_semantic_coverage",
      isObject(signals) && forbiddenPaths.length === 0,
      [],
      forbiddenPaths,
    ),
    assertion(
      `R2-${callIndex}-NO-PROBABILITY-CONFIDENCE`,
      "raw_semantic_coverage",
      isObject(signals) && probabilityPaths.length === 0,
      [],
      probabilityPaths,
    ),
    assertion(
      `R2-${callIndex}-NO-CASE-FIXTURE-ORACLE`,
      "raw_semantic_coverage",
      isObject(signals) && referenceMatches.length === 0,
      0,
      referenceMatches.length,
    ),
    assertion(
      `R2-${callIndex}-RAW-MESSAGE-SIGNALS`,
      "message_ownership",
      exactRawMessages(rawMessages, qualityCase.raw_messages) &&
        rawMessages.every((item) => item?.status !== "unsent_candidate"),
      qualityCase.raw_messages,
      rawMessages,
    ),
    assertion(
      `R2-${callIndex}-INCOMING-PRESENT`,
      "message_ownership",
      qualityCase.incoming.present.includes(
        signals?.incoming_message_profile?.present,
      ),
      qualityCase.incoming.present,
      signals?.incoming_message_profile?.present ?? null,
    ),
    assertion(
      `R2-${callIndex}-INCOMING-DIALOGUE`,
      "raw_semantic_coverage",
      qualityCase.incoming.dialogue_acts_any.length === 0 ||
        valuesIncludeAny(
          signals?.incoming_message_profile?.dialogue_acts,
          qualityCase.incoming.dialogue_acts_any,
        ),
      qualityCase.incoming.dialogue_acts_any,
      signals?.incoming_message_profile?.dialogue_acts ?? null,
    ),
    assertion(
      `R2-${callIndex}-INCOMING-PRACTICAL`,
      "raw_semantic_coverage",
      qualityCase.incoming.practical_requirements_any.length === 0 ||
        valuesIncludeAny(
          signals?.incoming_message_profile?.practical_requirements,
          qualityCase.incoming.practical_requirements_any,
        ),
      qualityCase.incoming.practical_requirements_any,
      signals?.incoming_message_profile?.practical_requirements ?? null,
    ),
    assertion(
      `R2-${callIndex}-REQUIRED-CONSTRAINTS`,
      "raw_semantic_coverage",
      qualityCase.required_constraints.every((kind) =>
       asArray(signals?.explicit_user_constraints).some(
          (constraint) => constraint?.kind === kind,
        ),
      ),
      qualityCase.required_constraints,
      asArray(signals?.explicit_user_constraints).map((item) => item?.kind),
    ),
    assertion(
      `R2-${callIndex}-BOUNDARY-OWNERSHIP-SIGNALS`,
      "boundary_ownership",
      boundarySignalsMatch(signals?.boundary_ownership_signals, qualityCase),
      qualityCase.boundary_signal_rule ?? qualityCase.boundary_signals,
      signals?.boundary_ownership_signals ?? null,
    ),
    assertion(
      `R2-${callIndex}-RAW-BOUNDARY-CEILING`,
      "boundary_ownership",
      qualityCase.raw_boundary.kinds.includes(
        raw?.decision_facts?.boundary_state?.kind,
      ) &&
        qualityCase.raw_boundary.statuses.includes(
          raw?.decision_facts?.boundary_state?.status,
        ),
      qualityCase.raw_boundary,
      raw?.decision_facts?.boundary_state ?? null,
    ),
    ...relationshipAssertions(signals, qualityCase, callIndex),
    ...candidateAssertions(signals, qualityCase, callIndex),
    ...privacyAssertions(raw, signals, qualityCase, callIndex),
  ];

  if (qualityCase.user_goal_values) {
    assertions.push(
      assertion(
        `R2-${callIndex}-USER-GOAL-VALUE`,
        "raw_semantic_coverage",
        qualityCase.user_goal_values.includes(signals?.user_goal_detail?.value),
        qualityCase.user_goal_values,
        signals?.user_goal_detail?.value ?? null,
      ),
    );
  }
  if (qualityCase.user_goal_bases) {
    assertions.push(
      assertion(
        `R2-${callIndex}-USER-GOAL-BASIS`,
        "raw_semantic_coverage",
        qualityCase.user_goal_bases.includes(signals?.user_goal_detail?.basis),
        qualityCase.user_goal_bases,
        signals?.user_goal_detail?.basis ?? null,
      ),
    );
  }
  if (qualityCase.incoming.dialogue_acts_forbidden) {
    assertions.push(
      assertion(
        `R2-${callIndex}-INCOMING-DIALOGUE-LIMIT`,
        "raw_semantic_coverage",
        asArray(signals?.incoming_message_profile?.dialogue_acts).every(
          (item) => !qualityCase.incoming.dialogue_acts_forbidden.includes(item),
        ),
        { not_one_of: qualityCase.incoming.dialogue_acts_forbidden },
        signals?.incoming_message_profile?.dialogue_acts ?? null,
      ),
    );
  }

  const grounded = groundedAssertions(call, signals, qualityCase, callIndex);
  assertions.push(...grounded);
  const soft = softStyleAssertions(signals, qualityCase, callIndex);
  assertions.push(...soft);

  const decisionFactsAdjudication = adjudicateDecisionFacts(
    call.grounded_output?.decision_facts,
    qualityCase,
  );
  assertions.push(
    assertion(
      `R2-${callIndex}-APPLICATION-DECISION-FACTS`,
      "application_decision_facts",
      decisionFactsAdjudication.passed,
      qualityCase.decision_fact_subset,
      {
        disposition: decisionFactsAdjudication.disposition,
        mismatched_paths: decisionFactsAdjudication.mismatched_paths,
      },
    ),
  );

  const hardAssertions = assertions.filter((item) => item.hard);
  const validationFailures = [
    ...(call.provider_completed === true ? [] : ["PROVIDER_TRANSPORT_FAILED"]),
    ...(typeof call.returned_model === "string" &&
    call.returned_model.trim().length > 0
      ? []
      : ["RETURNED_MODEL_NOT_RECORDED"]),
    ...(call.raw_json_parse === true ? [] : ["RAW_JSON_PARSE_FAILED"]),
    ...(call.raw_schema_passed === true ? [] : ["RAW_SCHEMA_V5_FAILED"]),
    ...(call.grounded_schema_passed === true
      ? []
      : ["GROUNDED_SCHEMA_V4_FAILED"]),
    ...(call.writing_context_integrity_v2_passed === true
      ? []
      : ["WRITING_CONTEXT_INTEGRITY_V2_FAILED"]),
    ...(call.contextual_intake_integrity_passed === true
      ? []
      : ["CONTEXTUAL_INTAKE_INTEGRITY_FAILED"]),
    ...(call.secret_leakage_count === 0 ? [] : ["SECRET_LEAKAGE_DETECTED"]),
  ];
  const hardFailures = [
    ...validationFailures,
    ...hardAssertions.filter((item) => !item.passed).map((item) => item.id),
  ];

  return {
    evaluator_version: EVALUATOR_VERSION,
    raw_semantic_assertions: hardAssertions.filter(
      (item) =>
        !["application_grounding", "application_decision_facts"].includes(
          item.category,
        ) &&
        !item.id.includes("GROUNDED-") &&
        !item.id.includes("CANONICAL-") &&
        !item.id.includes("PRESERVED") &&
        item.id !== "R2-06-INCOMING-POINTS-TO-SECOND-MESSAGE" &&
        item.id !== "R2-08-PRINCIPAL-QUOTED-OWNERSHIP",
    ),
    grounded_semantic_assertions: hardAssertions.filter(
      (item) =>
        item.category === "application_grounding" ||
        item.category === "application_decision_facts" ||
        item.id.includes("GROUNDED-") ||
        item.id.includes("CANONICAL-") ||
        item.id.includes("PRESERVED") ||
        item.id === "R2-06-INCOMING-POINTS-TO-SECOND-MESSAGE" ||
        item.id === "R2-08-PRINCIPAL-QUOTED-OWNERSHIP",
    ),
    decision_facts_adjudication: decisionFactsAdjudication,
    raw_semantic_coverage: {
      passed: hardAssertions
        .filter(
          (item) =>
            ![
              "application_grounding",
              "application_decision_facts",
            ].includes(item.category) &&
            !item.id.includes("GROUNDED-") &&
            !item.id.includes("CANONICAL-") &&
            !item.id.includes("PRESERVED") &&
            item.id !== "R2-06-INCOMING-POINTS-TO-SECOND-MESSAGE" &&
            item.id !== "R2-08-PRINCIPAL-QUOTED-OWNERSHIP",
        )
        .every((item) => item.passed),
      evidence_status: isObject(raw) ? "available" : "unavailable",
    },
    ownership_results: categoryResult(hardAssertions, "message_ownership"),
    boundary_results: categoryResult(hardAssertions, "boundary_ownership"),
    candidate_presence_results: categoryResult(
      hardAssertions,
      "candidate_presence",
    ),
    candidate_style_results: categoryResult(hardAssertions, "candidate_style"),
    candidate_intent_results: categoryResult(
      hardAssertions,
      "candidate_intent",
    ),
    relationship_limit_results: categoryResult(
      hardAssertions,
      "relationship_limits",
    ),
    privacy_repeat_injection_results: categoryResult(
      hardAssertions,
      "privacy_repeat_injection",
    ),
    application_grounding_results: categoryResult(
      hardAssertions,
      "application_grounding",
    ),
    hard_failures: sortedUnique(hardFailures),
    soft_assertions: soft,
    soft_findings: soft.filter((item) => !item.passed).map((item) => item.id),
    forbidden_bookkeeping_paths: forbiddenPaths,
    probability_confidence_paths: probabilityPaths,
    case_fixture_oracle_reference_count: referenceMatches.length,
    raw_pii_count: rawPiiValues(signals).length,
  };
}

function caseMetric(calls, qualityCases, selector, applicability = () => true) {
  const byId = new Map(calls.map((call) => [call.case_id, call]));
  const selected = qualityCases.filter(applicability).map((qualityCase) => {
    const call = byId.get(qualityCase.case_id);
    return { passed: call ? selector(call, qualityCase) === true : false };
  });
  return score(selected);
}

export function aggregateUsage(calls) {
  return calls.reduce(
    (total, call) => ({
      input_tokens: total.input_tokens + (call.usage?.input_tokens ?? 0),
      cached_tokens: total.cached_tokens + (call.usage?.cached_tokens ?? 0),
      output_tokens: total.output_tokens + (call.usage?.output_tokens ?? 0),
      reasoning_tokens:
        total.reasoning_tokens + (call.usage?.reasoning_tokens ?? 0),
    }),
    { input_tokens: 0, cached_tokens: 0, output_tokens: 0, reasoning_tokens: 0 },
  );
}

export function evaluateDiagnostic(contract, qualityContract, result) {
  const calls = asArray(result.calls);
  const qualityCases = qualityContract.cases;
  const metrics = {
    provider_transport: caseMetric(
      calls,
      qualityCases,
      (call) => call.provider_completed === true,
    ),
    returned_model_recorded: caseMetric(
      calls,
      qualityCases,
      (call) =>
        typeof call.returned_model === "string" &&
        call.returned_model.trim().length > 0,
    ),
    raw_json_parse: caseMetric(
      calls,
      qualityCases,
      (call) => call.raw_json_parse === true,
    ),
    raw_schema_v5: caseMetric(
      calls,
      qualityCases,
      (call) => call.raw_schema_passed === true,
    ),
    forbidden_bookkeeping: caseMetric(
      calls,
      qualityCases,
      (call) =>
        isObject(call.raw_output?.writing_signals) &&
        call.forbidden_bookkeeping_count === 0,
    ),
    provider_semantic_core: caseMetric(
      calls,
      qualityCases,
      (call) => call.evaluation?.raw_semantic_coverage?.passed === true,
    ),
    grounded_schema_v4: caseMetric(
      calls,
      qualityCases,
      (call) => call.grounded_schema_passed === true,
    ),
    writing_context_integrity_v2: caseMetric(
      calls,
      qualityCases,
      (call) => call.writing_context_integrity_v2_passed === true,
    ),
    contextual_intake_integrity: caseMetric(
      calls,
      qualityCases,
      (call) => call.contextual_intake_integrity_passed === true,
    ),
    application_decision_facts: caseMetric(
      calls,
      qualityCases,
      (call) => call.decision_facts_adjudication?.passed === true,
    ),
    message_ownership: caseMetric(
      calls,
      qualityCases,
      (call) => call.ownership_results?.passed === true,
    ),
    boundary_ownership: caseMetric(
      calls,
      qualityCases,
      (call) => call.boundary_results?.passed === true,
    ),
    candidate_presence: caseMetric(
      calls,
      qualityCases,
      (call) => call.candidate_presence_results?.passed === true,
    ),
    candidate_style: caseMetric(
      calls,
      qualityCases,
      (call) => call.candidate_style_results?.passed === true,
      (qualityCase) => qualityCase.candidate_style !== null,
    ),
    candidate_intent: caseMetric(
      calls,
      qualityCases,
      (call) => call.candidate_intent_results?.passed === true,
      (qualityCase) => qualityCase.candidate_intent !== null,
    ),
    relationship_limits: caseMetric(
      calls,
      qualityCases,
      (call) => call.relationship_limit_results?.passed === true,
    ),
    privacy_repeat_injection: caseMetric(
      calls,
      qualityCases,
      (call) => call.privacy_repeat_injection_results?.passed === true,
    ),
    application_grounding: caseMetric(
      calls,
      qualityCases,
      (call) => call.application_grounding_results?.passed === true,
    ),
    soft_style_assertions: score(
      calls.flatMap((call) => asArray(call.soft_assertions)),
    ),
  };

  const hardMetricNames = [
    "provider_transport",
    "returned_model_recorded",
    "raw_json_parse",
    "raw_schema_v5",
    "forbidden_bookkeeping",
    "provider_semantic_core",
    "grounded_schema_v4",
    "writing_context_integrity_v2",
    "contextual_intake_integrity",
    "application_decision_facts",
    "message_ownership",
    "boundary_ownership",
    "candidate_presence",
    "candidate_style",
    "candidate_intent",
    "relationship_limits",
    "privacy_repeat_injection",
    "application_grounding",
  ];
  const callsById = new Map(calls.map((call) => [call.case_id, call]));
  const r203 = callsById.get("R2-03");
  const r204 = callsById.get("R2-04");
  const r208 = callsById.get("R2-08");
  const principalR208 =
    r208?.ownership_results?.assertions?.some(
      (item) => item.id === "R2-08-PRINCIPAL-QUOTED-OWNERSHIP" && item.passed,
    ) && r208?.hard_failures?.length === 0
      ? "PASS"
      : calls.length === 0
        ? "NOT_EXECUTED"
        : "FAIL";
  const r203Boundary = r203?.grounded_output?.decision_facts?.boundary_state;
  const r204Boundary = r204?.grounded_output?.decision_facts?.boundary_state;
  const operationalPass =
    result.calls_actual === contract.authorized_calls &&
    result.calls_completed === contract.authorized_calls &&
    result.retry_count === 0 &&
    result.repair_count === 0 &&
    result.fallback_count === 0 &&
    result.pb_02_through_pb_06_calls === 0 &&
    result.db_operations === 0 &&
    result.supabase_operations === 0 &&
    result.holdout_use === 0 &&
    result.real_user_data === 0 &&
    result.active_runtime_changed === false &&
    result.authorization_consumed === true &&
    result.rerun_authorized === false &&
    calls.reduce((total, call) => total + (call.secret_leakage_count ?? 0), 0) ===
      0;
  const semanticPass = hardMetricNames.every(
    (metricName) => metrics[metricName].rate === 1,
  );
  const specificPass =
    principalR208 === "PASS" &&
    r203Boundary?.kind === "none" &&
    r203Boundary?.status === "none" &&
    r204Boundary?.kind === "no_contact" &&
    r204Boundary?.status === "explicit";
  const verdict =
    result.status === "not_executed"
      ? "NOT_EXECUTED"
      : result.status === "running"
        ? "NOT_COMPLETE"
        : operationalPass && semanticPass && specificPass
          ? "PASS"
          : "FAIL";
  const casePassCount = calls.filter(
    (call) => asArray(call.hard_failures).length === 0,
  ).length;
  return {
    evaluator_version: EVALUATOR_VERSION,
    verdict,
    case_pass_count: casePassCount,
    case_count: qualityCases.length,
    metrics,
    principal_r2_08_ownership: principalR208,
    r2_03_grounded_boundary: r203Boundary
      ? { kind: r203Boundary.kind, status: r203Boundary.status }
      : null,
    r2_04_grounded_boundary: r204Boundary
      ? { kind: r204Boundary.kind, status: r204Boundary.status }
      : null,
    hard_failures: calls.flatMap((call) =>
      asArray(call.hard_failures).map((failure) => ({
        case_id: call.case_id,
        failure,
      })),
    ),
    soft_findings: calls.flatMap((call) =>
      asArray(call.soft_findings).map((finding) => ({
        case_id: call.case_id,
        finding,
      })),
    ),
  };
}

function metricText(metric) {
  if (!metric || metric.total === 0) return "0/0 (unavailable)";
  return `${metric.passed}/${metric.total}`;
}

export function renderDiagnosticSummary(result) {
  const evaluation = result.evaluation;
  const rows = asArray(result.calls).map((call) => {
    const caseVerdict = asArray(call.hard_failures).length === 0 ? "PASS" : "FAIL";
    return `| ${call.case_id} | ${caseVerdict} | ${call.provider_completed ? "PASS" : "FAIL"} | ${call.raw_schema_passed ? "PASS" : "FAIL"} | ${call.grounded_schema_passed ? "PASS" : "FAIL"} | ${call.ownership_results?.passed ? "PASS" : "FAIL"} | ${call.boundary_results?.passed ? "PASS" : "FAIL"} |`;
  });
  const metricRows = Object.entries(evaluation.metrics ?? {}).map(
    ([name, metric]) =>
      `| ${name} | ${metricText(metric)} | ${metric?.evidence_status ?? "unavailable"} |`,
  );
  const failures = evaluation.hard_failures?.length
    ? evaluation.hard_failures
        .map((item) => `- ${item.case_id}: \`${item.failure}\``)
        .join("\n")
    : "- None";
  return `# M2-P4-I3-R1-C1-R2 Diagnostic Summary

## Purpose and protocol

This bounded diagnostic checks only whether inactive PB-01 v5 returns semantic-only \`writing_signals\` for eight synthetic consultations. Each case invoked PB-01 exactly once and sequentially. Application grounding, grounded Schema v4, Writing Context Integrity v2, contextual intake Integrity, and Decision Facts adjudication ran locally. PB-02 through PB-06, Service, full Pipeline, DB, Supabase, holdout, and real-user data were not used.

## Result

- Status: \`${result.status}\`
- Verdict: \`${evaluation.verdict}\`
- Package commit: \`${result.package_commit ?? "unavailable"}\`
- Provider calls: \`${result.calls_actual} / ${result.calls_authorized}\`
- Completed calls: \`${result.calls_completed} / ${result.calls_authorized}\`
- Retry / repair / fallback: \`${result.retry_count} / ${result.repair_count} / ${result.fallback_count}\`
- R2-08 quoted-message ownership: \`${evaluation.principal_r2_08_ownership}\`
- Authorization consumed: \`${result.authorization_consumed}\`
- Rerun authorized: \`${result.rerun_authorized}\`
- Active Runtime changed: \`${result.active_runtime_changed}\`
- C2 eligible / authorized: \`${result.c2_eligible} / ${result.c2_authorized}\`

## Cases

| Case | Verdict | Transport | Raw Schema v5 | Grounded Schema v4 | Ownership | Boundary |
|---|---:|---:|---:|---:|---:|---:|
${rows.join("\n")}

## Metrics

| Metric | Result | Evidence |
|---|---:|---|
${metricRows.join("\n")}

## Principal ownership and boundary gates

- R2-08 quoted-message ownership: \`${evaluation.principal_r2_08_ownership}\`
- R2-03 grounded boundary: \`${evaluation.r2_03_grounded_boundary?.kind ?? "unavailable"} / ${evaluation.r2_03_grounded_boundary?.status ?? "unavailable"}\`
- R2-04 grounded boundary: \`${evaluation.r2_04_grounded_boundary?.kind ?? "unavailable"} / ${evaluation.r2_04_grounded_boundary?.status ?? "unavailable"}\`

## Remaining hard failures

${failures}

## Usage totals

- Input tokens: \`${result.usage_totals.input_tokens}\`
- Cached input tokens: \`${result.usage_totals.cached_tokens}\`
- Output tokens: \`${result.usage_totals.output_tokens}\`
- Reasoning tokens: \`${result.usage_totals.reasoning_tokens}\`

## Runtime and next step

Active Runtime and \`main\` remain unchanged. C2 remains unauthorized even if this diagnostic passes. The only next step is Human / ChatGPT review; no rerun is authorized.
`;
}
