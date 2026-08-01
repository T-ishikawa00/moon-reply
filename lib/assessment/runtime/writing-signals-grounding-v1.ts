import type { AssessmentInput, JsonObject } from "./types.ts";

const currentSituationSource = "input:current_situation";
const relationshipSource = "input:relationship";
const optionalMessageSource = "input:optional_message";

const relationshipDimensionNames = [
  "romantic_stage",
  "social_role",
  "hierarchy",
  "familiarity",
  "communication_context",
  "observed_register",
] as const;

type SignalBasis =
  | "current_situation_explicit"
  | "current_situation_inferred"
  | "relationship_chip"
  | "requested_topics"
  | "optional_message"
  | "unresolved";

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function objects(value: unknown) {
  return Array.isArray(value) ? value.filter(isObject) : [];
}

function strings(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function sortedUnique(values: string[]) {
  return [...new Set(values)].sort((left, right) =>
    left.localeCompare(right, "en"),
  );
}

function sourceEvidence(basis: unknown) {
  if (basis === "current_situation_explicit") {
    return {
      evidence_state: "explicit",
      source_refs: [currentSituationSource],
    };
  }
  if (basis === "current_situation_inferred") {
    return {
      evidence_state: "inferred",
      source_refs: [currentSituationSource],
    };
  }
  return null;
}

function relationshipChipMapping(
  relationship: AssessmentInput["relationship"],
) {
  if (relationship === "dating") {
    return ["romantic_stage", "dating_before_relationship"] as const;
  }
  if (relationship === "in_relationship") {
    return ["romantic_stage", "partner"] as const;
  }
  if (relationship === "ambiguous") {
    return ["romantic_stage", "ambiguous"] as const;
  }
  if (relationship === "former_partner") {
    return ["romantic_stage", "former_partner"] as const;
  }
  if (relationship === "matching_app") {
    return ["communication_context", "matching_app"] as const;
  }
  return null;
}

function unresolvedRelationshipFact() {
  return {
    value: "unknown",
    effect_class: "writing_only",
    evidence_state: "unresolved",
    explicit_source_refs: [],
    inferred_source_refs: [],
    unresolved: true,
    source_refs: [],
  };
}

function groundRelationshipDimensions(
  request: AssessmentInput,
  rawSignals: Record<string, unknown>,
) {
  const rawDimensions = isObject(rawSignals.relationship_dimensions)
    ? rawSignals.relationship_dimensions
    : {};
  const chipMapping = relationshipChipMapping(request.relationship);
  const grounded: Record<string, unknown> = {};

  for (const dimension of relationshipDimensionNames) {
    if (chipMapping?.[0] === dimension) {
      grounded[dimension] = {
        value: chipMapping[1],
        effect_class: "writing_only",
        evidence_state: "explicit",
        explicit_source_refs: [relationshipSource],
        inferred_source_refs: [],
        unresolved: false,
        source_refs: [relationshipSource],
      };
      continue;
    }

    const signal = rawDimensions[dimension];
    if (!isObject(signal) || signal.value === "unknown") {
      grounded[dimension] = unresolvedRelationshipFact();
      continue;
    }
    const evidence = sourceEvidence(signal.basis);
    if (!evidence) {
      grounded[dimension] = unresolvedRelationshipFact();
      continue;
    }
    const explicit = evidence.evidence_state === "explicit";
    grounded[dimension] = {
      value: signal.value,
      effect_class: "writing_only",
      evidence_state: evidence.evidence_state,
      explicit_source_refs: explicit ? [...evidence.source_refs] : [],
      inferred_source_refs: explicit ? [] : [...evidence.source_refs],
      unresolved: false,
      source_refs: [...evidence.source_refs],
    };
  }
  return grounded;
}

function groundMessageOwnership(
  request: AssessmentInput,
  rawSignals: Record<string, unknown>,
) {
  const ownership = objects(rawSignals.message_signals).map((signal, index) => ({
    message_id: `MSG${String(index + 1).padStart(3, "0")}`,
    author: signal.author,
    status: signal.status,
    sequence: index + 1,
    evidence_state:
      signal.author === "unknown" || signal.status === "unknown"
        ? "inferred"
        : "explicit",
    source_refs: [currentSituationSource],
  }));
  const candidatePresent =
    request.optionalMessage !== null && request.optionalMessage.trim().length > 0;
  if (candidatePresent) {
    ownership.push({
      message_id: `MSG${String(ownership.length + 1).padStart(3, "0")}`,
      author: "user",
      status: "unsent_candidate",
      sequence: ownership.length + 1,
      evidence_state: "explicit",
      source_refs: [optionalMessageSource],
    });
  }
  return ownership;
}

function groundIncomingProfile(
  rawSignals: Record<string, unknown>,
  decisionFacts: Record<string, unknown>,
  ownership: Array<Record<string, unknown>>,
) {
  const rawProfile = isObject(rawSignals.incoming_message_profile)
    ? rawSignals.incoming_message_profile
    : {};
  const incoming = ownership.filter((item) => item.status === "incoming").at(-1);
  if (incoming) {
    return {
      message_id: incoming.message_id,
      dialogue_acts: sortedUnique(strings(rawProfile.dialogue_acts)),
      unanswered_obligations: sortedUnique(
        strings(rawProfile.unanswered_obligations),
      ),
      practical_requirements: sortedUnique(
        strings(rawProfile.practical_requirements),
      ),
      closure_signal: rawProfile.closure_signal ?? "unknown",
      response_expectation: rawProfile.response_expectation ?? "unknown",
      evidence_state:
        incoming.evidence_state === "inferred" ? "inferred" : "explicit",
      source_refs: [currentSituationSource],
    };
  }

  const latestDirectMessage = isObject(decisionFacts.latest_direct_message)
    ? decisionFacts.latest_direct_message
    : {};
  if (
    latestDirectMessage.sender === "user" ||
    latestDirectMessage.sender === "none"
  ) {
    return {
      message_id: null,
      dialogue_acts: [],
      unanswered_obligations: [],
      practical_requirements: [],
      closure_signal: "none",
      response_expectation: "none",
      evidence_state: "explicit",
      source_refs: [currentSituationSource],
    };
  }
  return {
    message_id: null,
    dialogue_acts: ["unknown"],
    unanswered_obligations: [],
    practical_requirements: ["unknown"],
    closure_signal: "unknown",
    response_expectation: "unknown",
    evidence_state: "unresolved",
    source_refs: [],
  };
}

function groundCandidateProfile(
  value: unknown,
  candidatePresent: boolean,
) {
  if (!candidatePresent || !isObject(value)) return null;
  return {
    ...structuredClone(value),
    evidence_state: "explicit",
    source_refs: [optionalMessageSource],
  };
}

function groundGoal(rawSignals: Record<string, unknown>) {
  const goal = isObject(rawSignals.user_goal_detail)
    ? rawSignals.user_goal_detail
    : {};
  const evidence = sourceEvidence(goal.basis);
  if (!evidence || goal.value === "unknown") {
    return {
      value: "unknown",
      evidence_state: "unresolved",
      source_refs: [],
    };
  }
  return {
    value: goal.value,
    evidence_state: evidence.evidence_state,
    source_refs: evidence.source_refs,
  };
}

function communicationUnresolvedFields(value: Record<string, unknown>) {
  const unknowns: Record<string, unknown> = {
    usual_register: "unknown",
    usual_length: "unknown",
    usual_emoji_pattern: "unknown",
    usual_response_cadence_summary: null,
    usual_initiator: "unknown",
    reciprocal_style_summary: null,
  };
  return sortedUnique(
    Object.entries(unknowns)
      .filter(([key, unresolved]) => value[key] === unresolved)
      .map(([key]) => key),
  );
}

function groundCommunication(rawSignals: Record<string, unknown>) {
  const raw = isObject(rawSignals.communication_pattern)
    ? rawSignals.communication_pattern
    : {};
  const evidence = sourceEvidence(raw.basis);
  const values: Record<string, unknown> = evidence
    ? {
        usual_register: raw.usual_register ?? "unknown",
        usual_length: raw.usual_length ?? "unknown",
        usual_emoji_pattern: raw.usual_emoji_pattern ?? "unknown",
        usual_response_cadence_summary:
          raw.usual_response_cadence_summary ?? null,
        usual_initiator: raw.usual_initiator ?? "unknown",
        reciprocal_style_summary: raw.reciprocal_style_summary ?? null,
      }
    : {
        usual_register: "unknown",
        usual_length: "unknown",
        usual_emoji_pattern: "unknown",
        usual_response_cadence_summary: null,
        usual_initiator: "unknown",
        reciprocal_style_summary: null,
      };
  const unresolved_fields = communicationUnresolvedFields(values);
  return {
    ...values,
    unresolved_fields,
    evidence_state:
      evidence && unresolved_fields.length < 6
        ? evidence.evidence_state
        : "unresolved",
    source_refs:
      evidence && unresolved_fields.length < 6 ? evidence.source_refs : [],
  };
}

function groundChannelAndTiming(
  request: AssessmentInput,
  rawSignals: Record<string, unknown>,
) {
  const raw = isObject(rawSignals.channel_and_timing)
    ? rawSignals.channel_and_timing
    : {};
  const evidence = sourceEvidence(raw.basis);
  if (request.relationship === "matching_app") {
    const currentResolved =
      evidence &&
      (raw.channel !== "unknown" || raw.relative_timing !== "unknown");
    return {
      channel: raw.channel === "unknown" ? "matching_app" : raw.channel,
      relative_timing: currentResolved
        ? (raw.relative_timing ?? "unknown")
        : "unknown",
      evidence_state: currentResolved ? evidence.evidence_state : "explicit",
      source_refs: sortedUnique([
        relationshipSource,
        ...(currentResolved ? evidence.source_refs : []),
      ]),
    };
  }
  if (
    !evidence ||
    (raw.channel === "unknown" && raw.relative_timing === "unknown")
  ) {
    return {
      channel: "unknown",
      relative_timing: "unknown",
      evidence_state: "unresolved",
      source_refs: [],
    };
  }
  return {
    channel: raw.channel ?? "unknown",
    relative_timing: raw.relative_timing ?? "unknown",
    evidence_state: evidence.evidence_state,
    source_refs: evidence.source_refs,
  };
}

function languageUnresolvedFields(
  value: Record<string, unknown>,
  whollyUnresolved: boolean,
) {
  const fields: string[] = [];
  if (value.primary_language === "unknown") fields.push("primary_language");
  if (whollyUnresolved) fields.push("mixed_languages");
  for (const field of [
    "dialect_or_regional_expression",
    "established_shared_expression",
    "intentional_nonstandard_expression",
    "possible_typo",
  ]) {
    if (value[field] === "unknown") fields.push(field);
  }
  return sortedUnique(fields);
}

function groundLanguage(
  request: AssessmentInput,
  rawSignals: Record<string, unknown>,
) {
  const raw = isObject(rawSignals.language_and_expression)
    ? rawSignals.language_and_expression
    : {};
  const candidatePresent =
    request.optionalMessage !== null && request.optionalMessage.trim().length > 0;
  const basis = raw.basis as SignalBasis | undefined;
  const evidence =
    sourceEvidence(basis) ??
    (candidatePresent && basis === "optional_message"
      ? {
          evidence_state: "explicit",
          source_refs: [optionalMessageSource],
        }
      : null);
  const allowed =
    evidence !== null &&
    (candidatePresent || basis !== "optional_message");
  const primary = allowed ? (raw.primary_language ?? "unknown") : "unknown";
  const mixed = allowed
    ? sortedUnique(strings(raw.mixed_languages)).filter(
        (language) => language !== primary,
      )
    : [];
  const values: Record<string, unknown> = {
    primary_language: primary,
    mixed_languages: mixed,
    dialect_or_regional_expression: allowed
      ? (raw.dialect_or_regional_expression ?? "unknown")
      : "unknown",
    established_shared_expression: allowed
      ? (raw.established_shared_expression ?? "unknown")
      : "unknown",
    intentional_nonstandard_expression: allowed
      ? (raw.intentional_nonstandard_expression ?? "unknown")
      : "unknown",
    possible_typo: allowed ? (raw.possible_typo ?? "unknown") : "unknown",
  };
  const whollyUnresolved =
    !allowed ||
    (primary === "unknown" &&
      mixed.length === 0 &&
      [
        values.dialect_or_regional_expression,
        values.established_shared_expression,
        values.intentional_nonstandard_expression,
        values.possible_typo,
      ].every((value) => value === "unknown"));
  const unresolved_fields = languageUnresolvedFields(values, whollyUnresolved);
  return {
    ...values,
    unresolved_fields,
    evidence_state: whollyUnresolved
      ? "unresolved"
      : (evidence?.evidence_state ?? "unresolved"),
    source_refs: whollyUnresolved ? [] : (evidence?.source_refs ?? []),
  };
}

function groundRepeat(rawSignals: Record<string, unknown>) {
  const raw = isObject(rawSignals.repeat_consultation_state)
    ? rawSignals.repeat_consultation_state
    : {};
  const evidence = sourceEvidence(raw.basis);
  if (!evidence || raw.state === "unknown") {
    return {
      state: "unknown",
      changed_fact_ids: [],
      unchanged_since_prior: null,
      evidence_state: "unresolved",
      source_refs: [],
    };
  }
  const state = raw.state;
  const changed =
    state === "repeated_with_material_change"
      ? sortedUnique(strings(raw.changed_fact_ids))
      : [];
  return {
    state,
    changed_fact_ids: changed,
    unchanged_since_prior:
      state === "repeated_without_material_change"
        ? true
        : state === "repeated_with_material_change"
          ? false
          : null,
    evidence_state: evidence.evidence_state,
    source_refs: evidence.source_refs,
  };
}

function collectNestedSourceRefs(
  value: unknown,
  result: string[],
  root: Record<string, unknown>,
): void {
  if (Array.isArray(value)) {
    for (const item of value) collectNestedSourceRefs(item, result, root);
    return;
  }
  if (!isObject(value)) return;
  for (const [key, child] of Object.entries(value)) {
    if (key === "source_refs" && value !== root) {
      result.push(...strings(child));
      continue;
    }
    collectNestedSourceRefs(child, result, root);
  }
}

function unresolvedWritingFields(context: Record<string, unknown>) {
  const unresolved: string[] = [];
  const dimensions = context.relationship_dimensions;
  if (isObject(dimensions)) {
    for (const dimension of relationshipDimensionNames) {
      const fact = dimensions[dimension];
      if (isObject(fact) && fact.unresolved === true) {
        unresolved.push(`relationship_dimensions.${dimension}`);
      }
    }
  }
  const incoming = context.incoming_message_profile;
  if (isObject(incoming) && incoming.evidence_state === "unresolved") {
    unresolved.push("incoming_message_profile");
  }
  if (context.candidate_style_profile === null && context.candidatePresent === true) {
    unresolved.push("candidate_style_profile");
  }
  if (
    context.candidate_communicative_intent === null &&
    context.candidatePresent === true
  ) {
    unresolved.push("candidate_communicative_intent");
  }
  const goal = context.user_goal_detail;
  if (isObject(goal) && goal.evidence_state === "unresolved") {
    unresolved.push("user_goal_detail");
  }
  const communication = context.communication_pattern;
  if (
    isObject(communication) &&
    strings(communication.unresolved_fields).length > 0
  ) {
    unresolved.push("communication_pattern");
  }
  const channel = context.channel_and_timing;
  if (
    isObject(channel) &&
    (channel.channel === "unknown" || channel.relative_timing === "unknown")
  ) {
    unresolved.push("channel_and_timing");
  }
  const language = context.language_and_expression;
  if (isObject(language) && strings(language.unresolved_fields).length > 0) {
    unresolved.push("language_and_expression");
  }
  const repeat = context.repeat_consultation_state;
  if (isObject(repeat) && repeat.evidence_state === "unresolved") {
    unresolved.push("repeat_consultation_state");
  }
  return sortedUnique(unresolved);
}

export function groundWritingSignalsV1(
  request: AssessmentInput,
  rawSignals: JsonObject,
  decisionFacts: JsonObject,
): JsonObject {
  const signals = structuredClone(rawSignals) as unknown as Record<
    string,
    unknown
  >;
  const facts = decisionFacts as unknown as Record<string, unknown>;
  const candidatePresent =
    request.optionalMessage !== null && request.optionalMessage.trim().length > 0;
  const ownership = groundMessageOwnership(request, signals);
  const context: Record<string, unknown> = {
    schema_version: "m2-p4-writing-context-v1",
    relationship_dimensions: groundRelationshipDimensions(request, signals),
    message_ownership: ownership,
    incoming_message_profile: groundIncomingProfile(
      signals,
      facts,
      ownership,
    ),
    candidate_style_profile: groundCandidateProfile(
      signals.candidate_style_profile,
      candidatePresent,
    ),
    candidate_communicative_intent: groundCandidateProfile(
      signals.candidate_communicative_intent,
      candidatePresent,
    ),
    user_goal_detail: groundGoal(signals),
    explicit_user_constraints: objects(signals.explicit_user_constraints).map(
      (constraint, index) => ({
        constraint_id: `UC${String(index + 1).padStart(3, "0")}`,
        kind: constraint.kind,
        bounded_summary:
          constraint.kind === "custom_explicit_constraint" &&
          typeof constraint.bounded_summary === "string" &&
          constraint.bounded_summary.trim().length > 0
            ? constraint.bounded_summary
            : null,
        source_refs: [currentSituationSource],
      }),
    ),
    communication_pattern: groundCommunication(signals),
    channel_and_timing: groundChannelAndTiming(request, signals),
    language_and_expression: groundLanguage(request, signals),
    repeat_consultation_state: groundRepeat(signals),
    privacy_markers: sortedUnique(strings(signals.privacy_markers)),
    candidatePresent,
  };
  context.unresolved_writing_fields = unresolvedWritingFields(context);
  delete context.candidatePresent;
  const refs: string[] = [];
  collectNestedSourceRefs(context, refs, context);
  context.source_refs = sortedUnique(refs);
  return context as JsonObject;
}
