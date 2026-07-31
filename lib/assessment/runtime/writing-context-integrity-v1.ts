import { M2RuntimeError } from "./errors.ts";
import type { AssessmentInput, JsonObject } from "./types.ts";

const relationshipDimensionNames = [
  "romantic_stage",
  "social_role",
  "hierarchy",
  "familiarity",
  "communication_context",
  "observed_register",
] as const;

const privacyCategories = new Set([
  "name",
  "phone",
  "email",
  "account_identifier",
  "workplace",
  "school",
  "address",
  "third_party_sensitive_detail",
]);

const forbiddenSourceTarget =
  /(?:^|[:_.-])(case|fixture|oracle|db)(?:$|[_.-])/iu;
const fullUuid =
  /\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/iu;

const currentSituationSource = "input:current_situation";
const relationshipSource = "input:relationship";
const requestedTopicsSource = "input:requested_topics";
const optionalMessageSource = "input:optional_message";

const conversationOwnedStatuses = new Set([
  "incoming",
  "sent_by_user",
  "quoted_history",
  "consultation_narrative",
]);

function invalid(): never {
  throw new M2RuntimeError("M2_WRITING_CONTEXT_INVALID");
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function strings(value: unknown): string[] {
  if (!Array.isArray(value) || !value.every((item) => typeof item === "string")) {
    invalid();
  }
  return value;
}

function isSortedUnique(values: string[]) {
  return (
    new Set(values).size === values.length &&
    values.every((value, index) => index === 0 || values[index - 1] < value)
  );
}

function sameStrings(left: string[], right: string[]) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function canonicalUnion(...sets: string[][]) {
  return [...new Set(sets.flat())].sort((left, right) =>
    left.localeCompare(right, "en"),
  );
}

function collectSourceArrays(
  value: unknown,
  result: string[][],
  root: Record<string, unknown>,
): void {
  if (Array.isArray(value)) {
    for (const item of value) collectSourceArrays(item, result, root);
    return;
  }
  if (!isObject(value)) return;
  for (const [key, child] of Object.entries(value)) {
    if (
      (key === "source_refs" ||
        key === "explicit_source_refs" ||
        key === "inferred_source_refs") &&
      !(key === "source_refs" && value === root)
    ) {
      result.push(strings(child));
      continue;
    }
    collectSourceArrays(child, result, root);
  }
}

function collectNestedPrimarySourceRefs(
  value: unknown,
  result: string[],
  root: Record<string, unknown>,
): void {
  if (Array.isArray(value)) {
    for (const item of value) collectNestedPrimarySourceRefs(item, result, root);
    return;
  }
  if (!isObject(value)) return;
  for (const [key, child] of Object.entries(value)) {
    if (key === "source_refs" && value !== root) {
      result.push(...strings(child));
      continue;
    }
    collectNestedPrimarySourceRefs(child, result, root);
  }
}

function verifySources(
  request: AssessmentInput,
  writingContext: Record<string, unknown>,
) {
  const candidatePresent =
    request.optionalMessage !== null && request.optionalMessage.trim().length > 0;
  const allowed = new Set([
    "input:current_situation",
    "input:relationship",
    "input:requested_topics",
    ...(candidatePresent ? ["input:optional_message"] : []),
  ]);
  const arrays: string[][] = [];
  collectSourceArrays(writingContext, arrays, writingContext);
  const top = strings(writingContext.source_refs);
  arrays.push(top);
  for (const refs of arrays) {
    if (!isSortedUnique(refs)) invalid();
    for (const ref of refs) {
      if (
        !allowed.has(ref) ||
        forbiddenSourceTarget.test(ref) ||
        fullUuid.test(ref)
      ) {
        invalid();
      }
    }
  }

  const nested: string[] = [];
  collectNestedPrimarySourceRefs(writingContext, nested, writingContext);
  if (!sameStrings(top, canonicalUnion(nested))) invalid();
  return { candidatePresent, allSourceRefs: canonicalUnion(...arrays) };
}

function verifyCandidate(
  writingContext: Record<string, unknown>,
  candidatePresent: boolean,
  allSourceRefs: string[],
) {
  const style = writingContext.candidate_style_profile;
  const intent = writingContext.candidate_communicative_intent;
  const ownership = writingContext.message_ownership;
  if (!Array.isArray(ownership)) invalid();
  const unsent = ownership.filter(
    (item) => isObject(item) && item.status === "unsent_candidate",
  );

  if (!candidatePresent) {
    if (
      style !== null ||
      intent !== null ||
      unsent.length !== 0 ||
      allSourceRefs.includes("input:optional_message")
    ) {
      invalid();
    }
    return;
  }

  if (!isObject(style) || !isObject(intent) || unsent.length !== 1) invalid();
  for (const profile of [style, intent]) {
    if (
      profile.evidence_state !== "explicit" ||
      !sameStrings(strings(profile.source_refs), ["input:optional_message"])
    ) {
      invalid();
    }
  }
  const candidate = unsent[0];
  if (
    !isObject(candidate) ||
    candidate.author !== "user" ||
    candidate.status !== "unsent_candidate" ||
    candidate.evidence_state !== "explicit" ||
    !sameStrings(strings(candidate.source_refs), ["input:optional_message"])
  ) {
    invalid();
  }
}

function verifyMessageOwnership(writingContext: Record<string, unknown>) {
  const ownership = writingContext.message_ownership;
  const incomingProfile = writingContext.incoming_message_profile;
  if (!Array.isArray(ownership) || !isObject(incomingProfile)) invalid();

  const ids = new Set<string>();
  const sequences = new Set<number>();
  let previousSequence = 0;
  const byId = new Map<string, Record<string, unknown>>();
  for (const item of ownership) {
    if (
      !isObject(item) ||
      typeof item.message_id !== "string" ||
      typeof item.sequence !== "number" ||
      !Number.isInteger(item.sequence) ||
      item.sequence <= 0 ||
      item.sequence <= previousSequence ||
      ids.has(item.message_id) ||
      sequences.has(item.sequence)
    ) {
      invalid();
    }
    previousSequence = item.sequence;
    ids.add(item.message_id);
    sequences.add(item.sequence);
    byId.set(item.message_id, item);
    const refs = strings(item.source_refs);
    if (item.status !== "unsent_candidate" && refs.includes(optionalMessageSource)) {
      invalid();
    }
    if (
      conversationOwnedStatuses.has(String(item.status)) &&
      !refs.includes(currentSituationSource)
    ) {
      invalid();
    }
    if (item.status === "incoming" && item.author !== "other_person") invalid();
    if (
      (item.status === "sent_by_user" || item.status === "unsent_candidate") &&
      item.author !== "user"
    ) {
      invalid();
    }
  }

  const incomingId = incomingProfile.message_id;
  const incomingRefs = strings(incomingProfile.source_refs);
  if (incomingId !== null) {
    if (typeof incomingId !== "string") invalid();
    const target = byId.get(incomingId);
    if (
      !target ||
      target.author !== "other_person" ||
      target.status !== "incoming"
    ) {
      invalid();
    }
    if (
      !sameStrings(incomingRefs, [currentSituationSource]) ||
      !sameStrings(strings(target.source_refs), incomingRefs)
    ) {
      invalid();
    }
  } else {
    if (
      incomingProfile.evidence_state !== "unresolved" ||
      incomingRefs.length !== 0
    ) {
      invalid();
    }
  }
}

function chipOnly(refs: string[]) {
  return refs.length === 1 && refs[0] === "input:relationship";
}

function permittedChipValue(
  relationship: AssessmentInput["relationship"],
  dimension: (typeof relationshipDimensionNames)[number],
  value: unknown,
) {
  const expected =
    relationship === "dating"
      ? ["romantic_stage", "dating_before_relationship"]
      : relationship === "in_relationship"
        ? ["romantic_stage", "partner"]
        : relationship === "ambiguous"
          ? ["romantic_stage", "ambiguous"]
          : relationship === "former_partner"
            ? ["romantic_stage", "former_partner"]
            : relationship === "matching_app"
              ? ["communication_context", "matching_app"]
              : null;
  if (expected) return dimension === expected[0] && value === expected[1];
  if (relationship === "other") return value === "other";
  return false;
}

function verifyRelationship(
  request: AssessmentInput,
  writingContext: Record<string, unknown>,
) {
  const dimensions = writingContext.relationship_dimensions;
  if (!isObject(dimensions)) invalid();

  for (const dimension of relationshipDimensionNames) {
    const fact = dimensions[dimension];
    if (!isObject(fact)) invalid();
    const explicitRefs = strings(fact.explicit_source_refs);
    const inferredRefs = strings(fact.inferred_source_refs);
    const refs = strings(fact.source_refs);
    if (
      !isSortedUnique(explicitRefs) ||
      !isSortedUnique(inferredRefs) ||
      !sameStrings(refs, canonicalUnion(explicitRefs, inferredRefs))
    ) {
      invalid();
    }

    if (fact.unresolved === true) {
      if (
        fact.value !== "unknown" ||
        fact.evidence_state !== "unresolved" ||
        refs.length !== 0
      ) {
        invalid();
      }
    } else if (fact.unresolved === false) {
      if (fact.value === "unknown") invalid();
    } else {
      invalid();
    }

    if (
      (fact.evidence_state === "explicit" &&
        (explicitRefs.length === 0 || inferredRefs.length !== 0)) ||
      (fact.evidence_state === "inferred" && inferredRefs.length === 0) ||
      !["explicit", "inferred", "unresolved"].includes(
        String(fact.evidence_state),
      )
    ) {
      invalid();
    }

    if (
      fact.effect_class !== "writing_only" &&
      !refs.includes("input:current_situation")
    ) {
      invalid();
    }
    if (
      dimension === "hierarchy" &&
      (fact.value === "user_is_junior" || fact.value === "user_is_senior") &&
      !refs.includes("input:current_situation")
    ) {
      invalid();
    }
    if (chipOnly(refs)) {
      if (
        fact.effect_class !== "writing_only" ||
        !permittedChipValue(request.relationship, dimension, fact.value)
      ) {
        invalid();
      }
    }
  }
}

function verifyConstraints(writingContext: Record<string, unknown>) {
  const constraints = writingContext.explicit_user_constraints;
  if (!Array.isArray(constraints)) invalid();
  const ids = new Set<string>();
  for (const constraint of constraints) {
    if (
      !isObject(constraint) ||
      typeof constraint.constraint_id !== "string" ||
      ids.has(constraint.constraint_id)
    ) {
      invalid();
    }
    ids.add(constraint.constraint_id);
    const refs = strings(constraint.source_refs);
    if (!sameStrings(refs, [currentSituationSource])) invalid();
    if (constraint.kind === "custom_explicit_constraint") {
      if (
        typeof constraint.bounded_summary !== "string" ||
        constraint.bounded_summary.trim().length === 0
      ) {
        invalid();
      }
    } else if (constraint.bounded_summary !== null) {
      invalid();
    }
  }
}

function verifyFieldSpecificProvenance(
  request: AssessmentInput,
  writingContext: Record<string, unknown>,
) {
  const goal = writingContext.user_goal_detail;
  const communication = writingContext.communication_pattern;
  const repeat = writingContext.repeat_consultation_state;
  const channel = writingContext.channel_and_timing;
  const language = writingContext.language_and_expression;
  if (
    !isObject(goal) ||
    !isObject(communication) ||
    !isObject(repeat) ||
    !isObject(channel) ||
    !isObject(language)
  ) {
    invalid();
  }

  const goalRefs = strings(goal.source_refs);
  if (
    goalRefs.some(
      (ref) =>
        ref !== currentSituationSource && ref !== requestedTopicsSource,
    )
  ) {
    invalid();
  }
  // RequestedTopic values describe requested report outputs, not an exact
  // communication goal. A resolved goal therefore needs consultation evidence.
  if (
    goal.value !== "unknown" &&
    goal.evidence_state !== "unresolved" &&
    !goalRefs.includes(currentSituationSource)
  ) {
    invalid();
  }

  for (const currentSituationOwned of [communication, repeat]) {
    const refs = strings(currentSituationOwned.source_refs);
    if (
      refs.some((ref) => ref !== currentSituationSource) ||
      (currentSituationOwned.evidence_state !== "unresolved" &&
        !sameStrings(refs, [currentSituationSource]))
    ) {
      invalid();
    }
  }

  const channelRefs = strings(channel.source_refs);
  const relationshipChannelAllowed =
    request.relationship === "matching_app" && channel.channel === "matching_app";
  if (
    channelRefs.some(
      (ref) =>
        ref !== currentSituationSource &&
        !(relationshipChannelAllowed && ref === relationshipSource),
    ) ||
    (channel.evidence_state !== "unresolved" && channelRefs.length === 0)
  ) {
    invalid();
  }

  const languageRefs = strings(language.source_refs);
  if (
    languageRefs.some(
      (ref) =>
        ref !== currentSituationSource && ref !== optionalMessageSource,
    ) ||
    (language.evidence_state !== "unresolved" && languageRefs.length === 0)
  ) {
    invalid();
  }
}

function verifyRepeatState(
  writingContext: Record<string, unknown>,
  structuredIntake: JsonObject,
) {
  const repeat = writingContext.repeat_consultation_state;
  if (!isObject(repeat)) invalid();
  const changed = strings(repeat.changed_fact_ids);
  if (!isSortedUnique(changed)) invalid();
  const observedFacts = structuredIntake.observed_facts;
  if (!Array.isArray(observedFacts)) invalid();
  const factIds = new Set(
    observedFacts.flatMap((fact) =>
      isObject(fact) && typeof fact.fact_id === "string" ? [fact.fact_id] : [],
    ),
  );

  if (
    (repeat.state === "first_assessment" &&
      (changed.length !== 0 ||
        ![false, null].includes(repeat.unchanged_since_prior as false | null))) ||
    (repeat.state === "repeated_without_material_change" &&
      (changed.length !== 0 || repeat.unchanged_since_prior !== true)) ||
    (repeat.state === "repeated_with_material_change" &&
      (changed.length === 0 || repeat.unchanged_since_prior !== false)) ||
    (repeat.state === "unknown" &&
      (changed.length !== 0 || repeat.unchanged_since_prior !== null)) ||
    ![
      "first_assessment",
      "repeated_without_material_change",
      "repeated_with_material_change",
      "unknown",
    ].includes(String(repeat.state))
  ) {
    invalid();
  }
  if (changed.some((factId) => !factIds.has(factId))) invalid();
}

function verifyNestedUnresolved(writingContext: Record<string, unknown>) {
  const communication = writingContext.communication_pattern;
  const language = writingContext.language_and_expression;
  if (!isObject(communication) || !isObject(language)) invalid();

  const communicationUnknowns: Record<string, unknown> = {
    usual_register: "unknown",
    usual_length: "unknown",
    usual_emoji_pattern: "unknown",
    usual_response_cadence_summary: null,
    usual_initiator: "unknown",
    reciprocal_style_summary: null,
  };
  const communicationUnresolved = strings(communication.unresolved_fields);
  if (!isSortedUnique(communicationUnresolved)) invalid();
  for (const [field, unresolvedValue] of Object.entries(communicationUnknowns)) {
    const listed = communicationUnresolved.includes(field);
    if ((communication[field] === unresolvedValue) !== listed) invalid();
  }

  const languageUnknowns: Record<string, unknown> = {
    primary_language: "unknown",
    dialect_or_regional_expression: "unknown",
    established_shared_expression: "unknown",
    intentional_nonstandard_expression: "unknown",
    possible_typo: "unknown",
  };
  const languageUnresolved = strings(language.unresolved_fields);
  if (!isSortedUnique(languageUnresolved)) invalid();
  for (const [field, unresolvedValue] of Object.entries(languageUnknowns)) {
    const listed = languageUnresolved.includes(field);
    if ((language[field] === unresolvedValue) !== listed) invalid();
  }
  if (
    languageUnresolved.includes("mixed_languages") &&
    (!Array.isArray(language.mixed_languages) ||
      language.mixed_languages.length !== 0)
  ) {
    invalid();
  }
}

function verifyTopUnresolved(writingContext: Record<string, unknown>) {
  const expected = new Set<string>();
  const dimensions = writingContext.relationship_dimensions;
  if (!isObject(dimensions)) invalid();
  for (const dimension of relationshipDimensionNames) {
    const fact = dimensions[dimension];
    if (isObject(fact) && fact.unresolved === true) {
      expected.add(`relationship_dimensions.${dimension}`);
    }
  }

  const incoming = writingContext.incoming_message_profile;
  const goal = writingContext.user_goal_detail;
  const communication = writingContext.communication_pattern;
  const channel = writingContext.channel_and_timing;
  const language = writingContext.language_and_expression;
  const repeat = writingContext.repeat_consultation_state;
  if (
    !isObject(incoming) ||
    !isObject(goal) ||
    !isObject(communication) ||
    !isObject(channel) ||
    !isObject(language) ||
    !isObject(repeat)
  ) {
    invalid();
  }
  if (incoming.evidence_state === "unresolved") {
    expected.add("incoming_message_profile");
  }
  if (goal.value === "unknown" || goal.evidence_state === "unresolved") {
    expected.add("user_goal_detail");
  }
  if (strings(communication.unresolved_fields).length > 0) {
    expected.add("communication_pattern");
  }
  if (
    channel.channel === "unknown" ||
    channel.relative_timing === "unknown" ||
    channel.evidence_state === "unresolved"
  ) {
    expected.add("channel_and_timing");
  }
  if (strings(language.unresolved_fields).length > 0) {
    expected.add("language_and_expression");
  }
  if (repeat.state === "unknown" || repeat.evidence_state === "unresolved") {
    expected.add("repeat_consultation_state");
  }

  const actual = strings(writingContext.unresolved_writing_fields);
  if (
    !isSortedUnique(actual) ||
    !sameStrings(
      actual,
      [...expected].sort((left, right) => left.localeCompare(right, "en")),
    )
  ) {
    invalid();
  }
}

function verifyPrivacy(writingContext: Record<string, unknown>) {
  const markers = strings(writingContext.privacy_markers);
  if (
    !isSortedUnique(markers) ||
    markers.some((marker) => !privacyCategories.has(marker))
  ) {
    invalid();
  }
}

export function validateWritingContextIntegrityV1(
  request: AssessmentInput,
  structuredIntake: JsonObject,
): void {
  const writingContext = structuredIntake.writing_context;
  if (
    !isObject(writingContext) ||
    writingContext.schema_version !== "m2-p4-writing-context-v1"
  ) {
    invalid();
  }
  const { candidatePresent, allSourceRefs } = verifySources(
    request,
    writingContext,
  );
  verifyCandidate(writingContext, candidatePresent, allSourceRefs);
  verifyMessageOwnership(writingContext);
  verifyRelationship(request, writingContext);
  verifyConstraints(writingContext);
  verifyFieldSpecificProvenance(request, writingContext);
  verifyRepeatState(writingContext, structuredIntake);
  verifyNestedUnresolved(writingContext);
  verifyTopUnresolved(writingContext);
  verifyPrivacy(writingContext);
}
