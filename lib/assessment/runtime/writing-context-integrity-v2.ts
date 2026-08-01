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

const currentSituationSource = "input:current_situation";
const relationshipSource = "input:relationship";
const optionalMessageSource = "input:optional_message";
const requestedTopicsSource = "input:requested_topics";
const forbiddenSourceToken = [
  "case",
  ["fix", "ture"].join(""),
  ["ora", "cle"].join(""),
  "db",
].join("|");
const forbiddenSourceTarget = new RegExp(
  `(?:^|[:_.-])(${forbiddenSourceToken})(?:$|[_.-])`,
  "iu",
);
const fullUuid =
  /\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/iu;

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

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function sortedUnique(values: string[]) {
  return [...new Set(values)].sort((left, right) =>
    left.localeCompare(right, "en"),
  );
}

function isSortedUnique(values: string[]) {
  return JSON.stringify(values) === JSON.stringify(sortedUnique(values));
}

function same(left: unknown, right: unknown) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function addIf(codes: Set<string>, condition: boolean, code: string) {
  if (condition) codes.add(code);
}

function collectSourceArrays(
  value: unknown,
  result: string[][],
  root: Record<string, unknown>,
): boolean {
  if (Array.isArray(value)) {
    return value.every((item) => collectSourceArrays(item, result, root));
  }
  if (!isObject(value)) return true;
  for (const [key, child] of Object.entries(value)) {
    if (
      (key === "source_refs" ||
        key === "explicit_source_refs" ||
        key === "inferred_source_refs") &&
      !(key === "source_refs" && value === root)
    ) {
      if (!isStringArray(child)) return false;
      result.push(child);
      continue;
    }
    if (!collectSourceArrays(child, result, root)) return false;
  }
  return true;
}

function collectPrimarySources(
  value: unknown,
  result: string[],
  root: Record<string, unknown>,
): boolean {
  if (Array.isArray(value)) {
    return value.every((item) => collectPrimarySources(item, result, root));
  }
  if (!isObject(value)) return true;
  for (const [key, child] of Object.entries(value)) {
    if (key === "source_refs" && value !== root) {
      if (!isStringArray(child)) return false;
      result.push(...child);
      continue;
    }
    if (!collectPrimarySources(child, result, root)) return false;
  }
  return true;
}

function permittedChipValue(
  request: AssessmentInput,
  dimension: (typeof relationshipDimensionNames)[number],
  value: unknown,
) {
  const expected =
    request.relationship === "dating"
      ? ["romantic_stage", "dating_before_relationship"]
      : request.relationship === "in_relationship"
        ? ["romantic_stage", "partner"]
        : request.relationship === "ambiguous"
          ? ["romantic_stage", "ambiguous"]
          : request.relationship === "former_partner"
            ? ["romantic_stage", "former_partner"]
            : request.relationship === "matching_app"
              ? ["communication_context", "matching_app"]
              : null;
  return expected !== null && dimension === expected[0] && value === expected[1];
}

function expectedCommunicationUnresolved(value: Record<string, unknown>) {
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
      .filter(([field, unresolved]) => value[field] === unresolved)
      .map(([field]) => field),
  );
}

function expectedLanguageUnresolved(value: Record<string, unknown>) {
  const fields: string[] = [];
  const whollyUnresolved =
    value.evidence_state === "unresolved" &&
    value.primary_language === "unknown" &&
    strings(value.mixed_languages).length === 0;
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

function expectedTopUnresolved(context: Record<string, unknown>) {
  const fields: string[] = [];
  const dimensions = context.relationship_dimensions;
  if (isObject(dimensions)) {
    for (const dimension of relationshipDimensionNames) {
      const fact = dimensions[dimension];
      if (isObject(fact) && fact.unresolved === true) {
        fields.push(`relationship_dimensions.${dimension}`);
      }
    }
  }
  const incoming = context.incoming_message_profile;
  if (isObject(incoming) && incoming.evidence_state === "unresolved") {
    fields.push("incoming_message_profile");
  }
  const ownership = objects(context.message_ownership);
  const candidatePresent = ownership.some(
    (item) => item.status === "unsent_candidate",
  );
  if (candidatePresent && context.candidate_style_profile === null) {
    fields.push("candidate_style_profile");
  }
  if (candidatePresent && context.candidate_communicative_intent === null) {
    fields.push("candidate_communicative_intent");
  }
  const goal = context.user_goal_detail;
  if (isObject(goal) && goal.evidence_state === "unresolved") {
    fields.push("user_goal_detail");
  }
  const communication = context.communication_pattern;
  if (
    isObject(communication) &&
    strings(communication.unresolved_fields).length > 0
  ) {
    fields.push("communication_pattern");
  }
  const channel = context.channel_and_timing;
  if (
    isObject(channel) &&
    (channel.channel === "unknown" || channel.relative_timing === "unknown")
  ) {
    fields.push("channel_and_timing");
  }
  const language = context.language_and_expression;
  if (isObject(language) && strings(language.unresolved_fields).length > 0) {
    fields.push("language_and_expression");
  }
  const repeat = context.repeat_consultation_state;
  if (isObject(repeat) && repeat.evidence_state === "unresolved") {
    fields.push("repeat_consultation_state");
  }
  return sortedUnique(fields);
}

export function collectWritingContextIntegrityViolationsV2(
  request: AssessmentInput,
  structuredIntake: JsonObject,
): string[] {
  const codes = new Set<string>();
  const context = structuredIntake.writing_context;
  if (
    !isObject(context) ||
    context.schema_version !== "m2-p4-writing-context-v1"
  ) {
    return [
      "WC_SOURCE_UNION_INVALID",
      "WC_CANDIDATE_PRESENCE_INVALID",
      "WC_MESSAGE_OWNERSHIP_INVALID",
      "WC_INCOMING_PROFILE_INVALID",
      "WC_RELATIONSHIP_PROVENANCE_INVALID",
      "WC_CONSTRAINT_PROVENANCE_INVALID",
      "WC_GOAL_PROVENANCE_INVALID",
      "WC_COMMUNICATION_PATTERN_INVALID",
      "WC_LANGUAGE_PROFILE_INVALID",
      "WC_REPEAT_STATE_INVALID",
      "WC_PRIVACY_INVALID",
      "WC_UNRESOLVED_STATE_INVALID",
    ];
  }

  const candidatePresent =
    request.optionalMessage !== null && request.optionalMessage.trim().length > 0;
  const allowedSources = new Set([
    currentSituationSource,
    relationshipSource,
    requestedTopicsSource,
    ...(candidatePresent ? [optionalMessageSource] : []),
  ]);
  const sourceArrays: string[][] = [];
  const primarySources: string[] = [];
  const topSources = strings(context.source_refs);
  const sourcesWellFormed =
    isStringArray(context.source_refs) &&
    collectSourceArrays(context, sourceArrays, context) &&
    collectPrimarySources(context, primarySources, context);
  addIf(
    codes,
    !sourcesWellFormed ||
      !isSortedUnique(topSources) ||
      sourceArrays.some(
        (refs) =>
          !isSortedUnique(refs) ||
          refs.some(
            (ref) =>
              !allowedSources.has(ref) ||
              forbiddenSourceTarget.test(ref) ||
              fullUuid.test(ref),
          ),
      ) ||
      !same(topSources, sortedUnique(primarySources)),
    "WC_SOURCE_UNION_INVALID",
  );

  const ownership = objects(context.message_ownership);
  const unsent = ownership.filter((item) => item.status === "unsent_candidate");
  const style = context.candidate_style_profile;
  const intent = context.candidate_communicative_intent;
  const candidateInvalid = candidatePresent
    ? !isObject(style) ||
      !isObject(intent) ||
      unsent.length !== 1 ||
      ownership.at(-1) !== unsent[0] ||
      [style, intent, unsent[0]].some(
        (item) =>
          !isObject(item) ||
          item.evidence_state !== "explicit" ||
          !same(item.source_refs, [optionalMessageSource]),
      ) ||
      unsent[0]?.author !== "user"
    : style !== null ||
      intent !== null ||
      unsent.length !== 0 ||
      topSources.includes(optionalMessageSource) ||
      strings(context.unresolved_writing_fields).some(
        (field) =>
          field === "candidate_style_profile" ||
          field === "candidate_communicative_intent",
      );
  addIf(codes, candidateInvalid, "WC_CANDIDATE_PRESENCE_INVALID");

  let messageInvalid = !Array.isArray(context.message_ownership);
  for (const [index, item] of ownership.entries()) {
    const status = item.status;
    const expectedAuthor =
      status === "incoming"
        ? "other_person"
        : status === "sent_by_user" || status === "unsent_candidate"
          ? "user"
          : null;
    messageInvalid ||=
      item.message_id !== `MSG${String(index + 1).padStart(3, "0")}` ||
      item.sequence !== index + 1 ||
      (expectedAuthor !== null && item.author !== expectedAuthor) ||
      !["explicit", "inferred"].includes(String(item.evidence_state)) ||
      !same(
        item.source_refs,
        status === "unsent_candidate"
          ? [optionalMessageSource]
          : [currentSituationSource],
      );
  }
  addIf(codes, messageInvalid, "WC_MESSAGE_OWNERSHIP_INVALID");

  const incomingProfile = context.incoming_message_profile;
  const incoming = ownership.filter((item) => item.status === "incoming").at(-1);
  const decisionFacts = structuredIntake.decision_facts;
  const latest =
    isObject(decisionFacts) && isObject(decisionFacts.latest_direct_message)
      ? decisionFacts.latest_direct_message
      : {};
  let incomingInvalid = !isObject(incomingProfile);
  if (isObject(incomingProfile)) {
    if (incoming) {
      incomingInvalid ||=
        incomingProfile.message_id !== incoming.message_id ||
        !["explicit", "inferred"].includes(
          String(incomingProfile.evidence_state),
        ) ||
        !same(incomingProfile.source_refs, [currentSituationSource]);
    } else if (latest.sender === "user" || latest.sender === "none") {
      incomingInvalid ||=
        incomingProfile.message_id !== null ||
        incomingProfile.evidence_state !== "explicit" ||
        !same(incomingProfile.source_refs, [currentSituationSource]) ||
        strings(incomingProfile.dialogue_acts).length !== 0 ||
        strings(incomingProfile.unanswered_obligations).length !== 0 ||
        strings(incomingProfile.practical_requirements).length !== 0 ||
        incomingProfile.closure_signal !== "none" ||
        incomingProfile.response_expectation !== "none";
    } else {
      incomingInvalid ||=
        incomingProfile.message_id !== null ||
        incomingProfile.evidence_state !== "unresolved" ||
        !same(incomingProfile.source_refs, []);
    }
  }
  addIf(codes, incomingInvalid, "WC_INCOMING_PROFILE_INVALID");

  const dimensions = context.relationship_dimensions;
  let relationshipInvalid = !isObject(dimensions);
  if (isObject(dimensions)) {
    for (const dimension of relationshipDimensionNames) {
      const fact = dimensions[dimension];
      if (!isObject(fact)) {
        relationshipInvalid = true;
        continue;
      }
      const refs = strings(fact.source_refs);
      const explicit = strings(fact.explicit_source_refs);
      const inferred = strings(fact.inferred_source_refs);
      relationshipInvalid ||=
        !isStringArray(fact.source_refs) ||
        !isStringArray(fact.explicit_source_refs) ||
        !isStringArray(fact.inferred_source_refs) ||
        !same(refs, sortedUnique([...explicit, ...inferred])) ||
        refs.includes(optionalMessageSource) ||
        refs.includes(requestedTopicsSource) ||
        (fact.unresolved === true &&
          (fact.value !== "unknown" ||
            fact.evidence_state !== "unresolved" ||
            refs.length !== 0)) ||
        (fact.unresolved === false && fact.value === "unknown") ||
        ![true, false].includes(fact.unresolved as boolean) ||
        (fact.evidence_state === "explicit" &&
          (explicit.length === 0 || inferred.length !== 0)) ||
        (fact.evidence_state === "inferred" && inferred.length === 0) ||
        (fact.effect_class !== "writing_only" &&
          !refs.includes(currentSituationSource)) ||
        (same(refs, [relationshipSource]) &&
          !permittedChipValue(request, dimension, fact.value));
    }
  }
  addIf(codes, relationshipInvalid, "WC_RELATIONSHIP_PROVENANCE_INVALID");

  const constraints = objects(context.explicit_user_constraints);
  let constraintInvalid = !Array.isArray(context.explicit_user_constraints);
  for (const [index, constraint] of constraints.entries()) {
    constraintInvalid ||=
      constraint.constraint_id !== `UC${String(index + 1).padStart(3, "0")}` ||
      !same(constraint.source_refs, [currentSituationSource]) ||
      (constraint.kind === "custom_explicit_constraint"
        ? typeof constraint.bounded_summary !== "string" ||
          constraint.bounded_summary.trim().length === 0
        : constraint.bounded_summary !== null);
  }
  addIf(codes, constraintInvalid, "WC_CONSTRAINT_PROVENANCE_INVALID");

  const goal = context.user_goal_detail;
  const goalInvalid =
    !isObject(goal) ||
    (goal.value === "unknown"
      ? goal.evidence_state !== "unresolved" || !same(goal.source_refs, [])
      : !["explicit", "inferred"].includes(String(goal.evidence_state)) ||
        !same(goal.source_refs, [currentSituationSource]));
  addIf(codes, goalInvalid, "WC_GOAL_PROVENANCE_INVALID");

  const communication = context.communication_pattern;
  const communicationInvalid =
    !isObject(communication) ||
    !isStringArray(communication.unresolved_fields) ||
    !same(
      strings(communication.unresolved_fields),
      isObject(communication)
        ? expectedCommunicationUnresolved(communication)
        : [],
    ) ||
    (isObject(communication) && communication.evidence_state === "unresolved"
      ? !same(communication.source_refs, [])
      : !same(communication.source_refs, [currentSituationSource]));
  addIf(
    codes,
    communicationInvalid,
    "WC_COMMUNICATION_PATTERN_INVALID",
  );

  const channel = context.channel_and_timing;
  let channelInvalid = !isObject(channel);
  if (isObject(channel)) {
    const refs = strings(channel.source_refs);
    const matchingAppAllowed =
      request.relationship === "matching_app" &&
      channel.channel === "matching_app" &&
      refs.includes(relationshipSource);
    channelInvalid ||=
      refs.some(
        (ref) =>
          ref !== currentSituationSource &&
          !(matchingAppAllowed && ref === relationshipSource),
      ) ||
      (channel.evidence_state === "unresolved"
        ? channel.channel !== "unknown" ||
          channel.relative_timing !== "unknown" ||
          refs.length !== 0
        : refs.length === 0);
  }
  addIf(codes, channelInvalid, "WC_CHANNEL_TIMING_INVALID");

  const language = context.language_and_expression;
  let languageInvalid = !isObject(language);
  if (isObject(language)) {
    const mixed = strings(language.mixed_languages);
    const refs = strings(language.source_refs);
    languageInvalid ||=
      !isStringArray(language.mixed_languages) ||
      !isStringArray(language.unresolved_fields) ||
      !isSortedUnique(mixed) ||
      mixed.includes(String(language.primary_language)) ||
      !same(
        strings(language.unresolved_fields),
        expectedLanguageUnresolved(language),
      ) ||
      refs.some(
        (ref) =>
          ref !== currentSituationSource &&
          !(candidatePresent && ref === optionalMessageSource),
      ) ||
      (!candidatePresent && refs.includes(optionalMessageSource)) ||
      (language.evidence_state === "unresolved"
        ? refs.length !== 0
        : refs.length === 0);
  }
  addIf(codes, languageInvalid, "WC_LANGUAGE_PROFILE_INVALID");

  const repeat = context.repeat_consultation_state;
  let repeatInvalid = !isObject(repeat);
  if (isObject(repeat)) {
    const changed = strings(repeat.changed_fact_ids);
    const facts = new Set(
      objects(structuredIntake.observed_facts).flatMap((fact) =>
        typeof fact.fact_id === "string" ? [fact.fact_id] : [],
      ),
    );
    repeatInvalid ||=
      !isStringArray(repeat.changed_fact_ids) ||
      !isSortedUnique(changed) ||
      changed.some((factId) => !facts.has(factId)) ||
      (repeat.state === "first_assessment" &&
        (changed.length !== 0 || repeat.unchanged_since_prior !== null)) ||
      (repeat.state === "repeated_without_material_change" &&
        (changed.length !== 0 || repeat.unchanged_since_prior !== true)) ||
      (repeat.state === "repeated_with_material_change" &&
        (changed.length === 0 || repeat.unchanged_since_prior !== false)) ||
      (repeat.state === "unknown" &&
        (changed.length !== 0 ||
          repeat.unchanged_since_prior !== null ||
          repeat.evidence_state !== "unresolved" ||
          !same(repeat.source_refs, []))) ||
      (repeat.state !== "unknown" &&
        !same(repeat.source_refs, [currentSituationSource]));
  }
  addIf(codes, repeatInvalid, "WC_REPEAT_STATE_INVALID");

  const privacy = strings(context.privacy_markers);
  addIf(
    codes,
    !isStringArray(context.privacy_markers) ||
      !isSortedUnique(privacy) ||
      privacy.some((marker) => !privacyCategories.has(marker)),
    "WC_PRIVACY_INVALID",
  );

  addIf(
    codes,
    !isStringArray(context.unresolved_writing_fields) ||
      !same(
        strings(context.unresolved_writing_fields),
        expectedTopUnresolved(context),
      ),
    "WC_UNRESOLVED_STATE_INVALID",
  );

  return [...codes].sort((left, right) => left.localeCompare(right, "en"));
}

export function validateWritingContextIntegrityV2(
  request: AssessmentInput,
  structuredIntake: JsonObject,
): void {
  if (
    collectWritingContextIntegrityViolationsV2(request, structuredIntake)
      .length > 0
  ) {
    throw new M2RuntimeError("M2_WRITING_CONTEXT_INVALID");
  }
}
