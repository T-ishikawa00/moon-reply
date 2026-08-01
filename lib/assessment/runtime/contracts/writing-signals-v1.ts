export const WRITING_SIGNAL_BASES = [
  "current_situation_explicit",
  "current_situation_inferred",
  "relationship_chip",
  "requested_topics",
  "optional_message",
  "unresolved",
] as const;

export type WritingSignalBasis = (typeof WRITING_SIGNAL_BASES)[number];

export type RelationshipSignalBasis = Extract<
  WritingSignalBasis,
  | "current_situation_explicit"
  | "current_situation_inferred"
  | "relationship_chip"
  | "unresolved"
>;

export type CurrentSituationSignalBasis = Extract<
  WritingSignalBasis,
  | "current_situation_explicit"
  | "current_situation_inferred"
  | "unresolved"
>;

export type GoalSignalBasis = WritingSignalBasis;

export type ChannelSignalBasis = RelationshipSignalBasis;

export type LanguageSignalBasis = Extract<
  WritingSignalBasis,
  | "current_situation_explicit"
  | "current_situation_inferred"
  | "optional_message"
  | "unresolved"
>;

export type WritingSignalFact<
  TValue,
  TBasis extends WritingSignalBasis = WritingSignalBasis,
> = {
  value: TValue;
  basis: TBasis;
};

export type WritingSignalsV1 = {
  schema_version: "m2-p4-writing-signals-v1";
  relationship_dimensions: {
    romantic_stage: WritingSignalFact<
      | "none"
      | "new_acquaintance"
      | "dating_before_relationship"
      | "ambiguous"
      | "partner"
      | "former_partner"
      | "unknown",
      RelationshipSignalBasis
    >;
    social_role: WritingSignalFact<
      | "stranger"
      | "acquaintance"
      | "friend"
      | "close_friend"
      | "work_contact"
      | "school_contact"
      | "other"
      | "unknown",
      RelationshipSignalBasis
    >;
    hierarchy: WritingSignalFact<
      "user_is_junior" | "peer" | "user_is_senior" | "none" | "unknown",
      RelationshipSignalBasis
    >;
    familiarity: WritingSignalFact<
      "first_contact" | "early" | "developing" | "established" | "former" | "unknown",
      RelationshipSignalBasis
    >;
    communication_context: WritingSignalFact<
      "matching_app" | "private" | "work" | "school" | "mixed" | "other" | "unknown",
      RelationshipSignalBasis
    >;
    observed_register: WritingSignalFact<
      "polite" | "neutral_polite" | "casual" | "mixed" | "unknown",
      RelationshipSignalBasis
    >;
  };
  message_signals: Array<{
    author: "user" | "other_person" | "third_party" | "unknown";
    status: "incoming" | "sent_by_user" | "quoted_history" | "unknown";
  }>;
  incoming_message_profile: {
    dialogue_acts: Array<
      | "answer"
      | "question"
      | "thanks"
      | "apology"
      | "invitation"
      | "schedule_coordination"
      | "practical_notice"
      | "affection_expression"
      | "boundary"
      | "decline"
      | "hold"
      | "conversation_closure"
      | "promised_future_contact"
      | "other"
      | "unknown"
    >;
    unanswered_obligations: WritingSignalsV1["incoming_message_profile"]["dialogue_acts"];
    practical_requirements: Array<
      | "answer_question"
      | "confirm_schedule"
      | "provide_information"
      | "acknowledge_boundary"
      | "acknowledge_decline"
      | "none"
      | "unknown"
    >;
    closure_signal: "none" | "soft" | "explicit" | "unknown";
    response_expectation: "reasonable" | "optional" | "none" | "unknown";
    present: true | false | "unknown";
  };
  candidate_style_profile: {
    register: "polite" | "neutral_polite" | "casual" | "mixed";
    sentence_length: "terse" | "short" | "medium" | "long";
    sentence_ending: "formal" | "neutral" | "soft" | "playful" | "mixed";
    punctuation: "sparse" | "standard" | "expressive";
    emoji_usage: "none" | "restrained" | "frequent";
    exclamation_usage: "none" | "restrained" | "frequent";
    softness: "low" | "medium" | "high";
    directness: "indirect" | "balanced" | "direct";
    invitation_style: "none" | "tentative" | "direct" | "practical";
    reply_pressure: "low" | "medium" | "high";
  } | null;
  candidate_communicative_intent: {
    gratitude_strength: "none" | "low" | "medium" | "high" | "unknown";
    apology_strength: "none" | "low" | "medium" | "high" | "unknown";
    question_count: number | null;
    invitation_presence: boolean | null;
    invitation_specificity: "none" | "tentative" | "direct" | "practical" | "unknown";
    affection_strength: "none" | "low" | "medium" | "high" | "unknown";
    commitment_strength: "none" | "low" | "medium" | "high" | "unknown";
    response_pressure: "none" | "low" | "medium" | "high" | "unknown";
    boundary_strength: "none" | "low" | "medium" | "high" | "unknown";
    conversation_closure: "none" | "soft" | "explicit" | "unknown";
    practical_requirement: WritingSignalsV1["incoming_message_profile"]["practical_requirements"];
  } | null;
  user_goal_detail: WritingSignalFact<
    | "respond_politely"
    | "move_closer"
    | "maintain_distance"
    | "schedule_only"
    | "apologize"
    | "repair_conflict"
    | "decline_without_false_hope"
    | "end_contact"
    | "express_affection"
    | "clarify_relationship"
    | "other"
    | "unknown",
    GoalSignalBasis
  >;
  explicit_user_constraints: Array<{
    kind:
      | "no_emoji"
      | "no_self_invitation"
      | "no_late_night_send"
      | "no_phone_call"
      | "no_private_contact_at_work"
      | "no_followup_message"
      | "keep_polite_register"
      | "keep_casual_register"
      | "custom_explicit_constraint";
    bounded_summary: string | null;
  }>;
  communication_pattern: {
    usual_register: "polite" | "neutral_polite" | "casual" | "mixed" | "unknown";
    usual_length: "terse" | "short" | "medium" | "long" | "unknown";
    usual_emoji_pattern: "none" | "restrained" | "frequent" | "unknown";
    usual_response_cadence_summary: string | null;
    usual_initiator: "user" | "other_person" | "reciprocal" | "variable" | "unknown";
    reciprocal_style_summary: string | null;
    basis: CurrentSituationSignalBasis;
  };
  channel_and_timing: {
    channel: "line" | "instagram_dm" | "matching_app" | "sms" | "work_chat" | "email" | "other" | "unknown";
    relative_timing: "immediate" | "same_day" | "late_night" | "next_day" | "delayed" | "unknown";
    basis: ChannelSignalBasis;
  };
  language_and_expression: {
    primary_language: "ja" | "en" | "other" | "unknown";
    mixed_languages: Array<"ja" | "en" | "other">;
    dialect_or_regional_expression: "present" | "absent" | "unknown";
    established_shared_expression: "present" | "absent" | "unknown";
    intentional_nonstandard_expression: "present" | "absent" | "unknown";
    possible_typo: "present" | "absent" | "unknown";
    basis: LanguageSignalBasis;
  };
  repeat_consultation_state: {
    state:
      | "first_assessment"
      | "repeated_without_material_change"
      | "repeated_with_material_change"
      | "unknown";
    changed_fact_ids: string[];
    basis: CurrentSituationSignalBasis;
  };
  privacy_markers: Array<
    | "name"
    | "phone"
    | "email"
    | "account_identifier"
    | "workplace"
    | "school"
    | "address"
    | "third_party_sensitive_detail"
  >;
  boundary_ownership_signals: Array<{
    kind:
      | "no_contact"
      | "temporary_distance"
      | "blocked_or_restricted"
      | "relationship_closed"
      | "other";
    asserted_by: "user" | "other_person" | "system" | "unknown";
    explicit: boolean;
  }>;
};
