export const WRITING_EVIDENCE_STATES = [
  "explicit",
  "inferred",
  "unresolved",
] as const;

export const RELATIONSHIP_EFFECT_CLASSES = [
  "writing_only",
  "decision_material",
  "safety_material",
] as const;

export const ROMANTIC_STAGES = [
  "none",
  "new_acquaintance",
  "dating_before_relationship",
  "ambiguous",
  "partner",
  "former_partner",
  "unknown",
] as const;

export const SOCIAL_ROLES = [
  "stranger",
  "acquaintance",
  "friend",
  "close_friend",
  "work_contact",
  "school_contact",
  "other",
  "unknown",
] as const;

export const HIERARCHIES = [
  "user_is_junior",
  "peer",
  "user_is_senior",
  "none",
  "unknown",
] as const;

export const FAMILIARITIES = [
  "first_contact",
  "early",
  "developing",
  "established",
  "former",
  "unknown",
] as const;

export const COMMUNICATION_CONTEXTS = [
  "matching_app",
  "private",
  "work",
  "school",
  "mixed",
  "other",
  "unknown",
] as const;

export const OBSERVED_REGISTERS = [
  "polite",
  "neutral_polite",
  "casual",
  "mixed",
  "unknown",
] as const;

export const MESSAGE_AUTHORS = [
  "user",
  "other_person",
  "third_party",
  "unknown",
] as const;

export const MESSAGE_STATUSES = [
  "incoming",
  "sent_by_user",
  "unsent_candidate",
  "quoted_history",
  "consultation_narrative",
  "unknown",
] as const;

export const DIALOGUE_ACTS = [
  "answer",
  "question",
  "thanks",
  "apology",
  "invitation",
  "schedule_coordination",
  "practical_notice",
  "affection_expression",
  "boundary",
  "decline",
  "hold",
  "conversation_closure",
  "promised_future_contact",
  "other",
  "unknown",
] as const;

export const DETAILED_USER_GOALS = [
  "respond_politely",
  "move_closer",
  "maintain_distance",
  "schedule_only",
  "apologize",
  "repair_conflict",
  "decline_without_false_hope",
  "end_contact",
  "express_affection",
  "clarify_relationship",
  "other",
  "unknown",
] as const;

export const EXPLICIT_CONSTRAINT_KINDS = [
  "no_emoji",
  "no_self_invitation",
  "no_late_night_send",
  "no_phone_call",
  "no_private_contact_at_work",
  "no_followup_message",
  "keep_polite_register",
  "keep_casual_register",
  "custom_explicit_constraint",
] as const;

export const CHANNELS = [
  "line",
  "instagram_dm",
  "matching_app",
  "sms",
  "work_chat",
  "email",
  "other",
  "unknown",
] as const;

export const RELATIVE_TIMINGS = [
  "immediate",
  "same_day",
  "late_night",
  "next_day",
  "delayed",
  "unknown",
] as const;

export const REPEAT_CONSULTATION_STATES = [
  "first_assessment",
  "repeated_without_material_change",
  "repeated_with_material_change",
  "unknown",
] as const;

export const PRIVACY_MARKERS = [
  "name",
  "phone",
  "email",
  "account_identifier",
  "workplace",
  "school",
  "address",
  "third_party_sensitive_detail",
] as const;

export const SURFACE_STYLE_DIMENSIONS = [
  "register",
  "sentence_length",
  "sentence_ending",
  "punctuation",
  "emoji_usage",
  "exclamation_usage",
  "softness",
  "directness",
  "invitation_style",
  "reply_pressure",
] as const;

export const SURFACE_REGISTER_VALUES = [
  "polite",
  "neutral_polite",
  "casual",
  "mixed",
] as const;
export const SENTENCE_LENGTH_VALUES = ["terse", "short", "medium", "long"] as const;
export const SENTENCE_ENDING_VALUES = [
  "formal",
  "neutral",
  "soft",
  "playful",
  "mixed",
] as const;
export const PUNCTUATION_VALUES = ["sparse", "standard", "expressive"] as const;
export const EMOJI_USAGE_VALUES = ["none", "restrained", "frequent"] as const;
export const EXCLAMATION_USAGE_VALUES = [
  "none",
  "restrained",
  "frequent",
] as const;
export const SOFTNESS_VALUES = ["low", "medium", "high"] as const;
export const DIRECTNESS_VALUES = ["indirect", "balanced", "direct"] as const;
export const INVITATION_STYLE_VALUES = [
  "none",
  "tentative",
  "direct",
  "practical",
] as const;
export const REPLY_PRESSURE_VALUES = ["low", "medium", "high"] as const;

export const COMMUNICATIVE_INTENT_DELTAS = [
  "decreased",
  "unchanged",
  "increased",
  "unresolved",
] as const;

export type WritingEvidenceState = (typeof WRITING_EVIDENCE_STATES)[number];
export type RelationshipEffectClass = (typeof RELATIONSHIP_EFFECT_CLASSES)[number];
export type RomanticStage = (typeof ROMANTIC_STAGES)[number];
export type SocialRole = (typeof SOCIAL_ROLES)[number];
export type Hierarchy = (typeof HIERARCHIES)[number];
export type Familiarity = (typeof FAMILIARITIES)[number];
export type CommunicationContext = (typeof COMMUNICATION_CONTEXTS)[number];
export type ObservedRegister = (typeof OBSERVED_REGISTERS)[number];
export type MessageAuthor = (typeof MESSAGE_AUTHORS)[number];
export type MessageStatus = (typeof MESSAGE_STATUSES)[number];
export type DialogueAct = (typeof DIALOGUE_ACTS)[number];
export type PracticalRequirement =
  | "answer_question"
  | "confirm_schedule"
  | "provide_information"
  | "acknowledge_boundary"
  | "acknowledge_decline"
  | "none"
  | "unknown";
export type DetailedUserGoal = (typeof DETAILED_USER_GOALS)[number];
export type ExplicitConstraintKind = (typeof EXPLICIT_CONSTRAINT_KINDS)[number];
export type Channel = (typeof CHANNELS)[number];
export type RelativeTiming = (typeof RELATIVE_TIMINGS)[number];
export type RepeatConsultationState = (typeof REPEAT_CONSULTATION_STATES)[number];
export type PrivacyMarker = (typeof PRIVACY_MARKERS)[number];
export type SurfaceStyleDimension = (typeof SURFACE_STYLE_DIMENSIONS)[number];
export type SurfaceRegister = (typeof SURFACE_REGISTER_VALUES)[number];
export type SentenceLength = (typeof SENTENCE_LENGTH_VALUES)[number];
export type SentenceEnding = (typeof SENTENCE_ENDING_VALUES)[number];
export type PunctuationStyle = (typeof PUNCTUATION_VALUES)[number];
export type EmojiUsage = (typeof EMOJI_USAGE_VALUES)[number];
export type ExclamationUsage = (typeof EXCLAMATION_USAGE_VALUES)[number];
export type Softness = (typeof SOFTNESS_VALUES)[number];
export type Directness = (typeof DIRECTNESS_VALUES)[number];
export type InvitationStyle = (typeof INVITATION_STYLE_VALUES)[number];
export type ReplyPressure = (typeof REPLY_PRESSURE_VALUES)[number];
export type CommunicativeIntentDelta =
  (typeof COMMUNICATIVE_INTENT_DELTAS)[number];
export type WritingSourceRef = `${"input" | "followup"}:${string}`;
type DecimalDigit = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9";
type ThreeDigitIdentifier = `${DecimalDigit}${DecimalDigit}${DecimalDigit}`;
export type WritingMessageId = `MSG${ThreeDigitIdentifier}`;
export type UserConstraintId = `UC${ThreeDigitIdentifier}`;
export type WritingFactId = `F${ThreeDigitIdentifier}`;

export interface WritingEvidence {
  evidence_state: WritingEvidenceState;
  source_refs: WritingSourceRef[];
}

export interface RelationshipDimensionFact<TValue> extends WritingEvidence {
  value: TValue;
  effect_class: RelationshipEffectClass;
  explicit_source_refs: WritingSourceRef[];
  inferred_source_refs: WritingSourceRef[];
  unresolved: boolean;
}

export interface WritingContextV1 {
  schema_version: "m2-p4-writing-context-v1";
  relationship_dimensions: {
    romantic_stage: RelationshipDimensionFact<RomanticStage>;
    social_role: RelationshipDimensionFact<SocialRole>;
    hierarchy: RelationshipDimensionFact<Hierarchy>;
    familiarity: RelationshipDimensionFact<Familiarity>;
    communication_context: RelationshipDimensionFact<CommunicationContext>;
    observed_register: RelationshipDimensionFact<ObservedRegister>;
  };
  message_ownership: Array<
    WritingEvidence & {
      message_id: WritingMessageId;
      author: MessageAuthor;
      status: MessageStatus;
      sequence: number;
    }
  >;
  incoming_message_profile: WritingEvidence & {
    message_id: WritingMessageId | null;
    dialogue_acts: DialogueAct[];
    unanswered_obligations: DialogueAct[];
    practical_requirements: PracticalRequirement[];
    closure_signal: "none" | "soft" | "explicit" | "unknown";
    response_expectation: "reasonable" | "optional" | "none" | "unknown";
  };
  candidate_style_profile:
    | (WritingEvidence & {
        register: SurfaceRegister;
        sentence_length: SentenceLength;
        sentence_ending: SentenceEnding;
        punctuation: PunctuationStyle;
        emoji_usage: EmojiUsage;
        exclamation_usage: ExclamationUsage;
        softness: Softness;
        directness: Directness;
        invitation_style: InvitationStyle;
        reply_pressure: ReplyPressure;
      })
    | null;
  candidate_communicative_intent:
    | (WritingEvidence & {
        gratitude_strength: IntentStrength;
        apology_strength: IntentStrength;
        question_count: number | null;
        invitation_presence: boolean | null;
        invitation_specificity: "none" | "tentative" | "direct" | "practical" | "unknown";
        affection_strength: IntentStrength;
        commitment_strength: IntentStrength;
        response_pressure: IntentStrength;
        boundary_strength: IntentStrength;
        conversation_closure: "none" | "soft" | "explicit" | "unknown";
        practical_requirement: PracticalRequirement[];
      })
    | null;
  user_goal_detail: WritingEvidence & {
    value: DetailedUserGoal;
  };
  explicit_user_constraints: Array<{
    constraint_id: UserConstraintId;
    kind: ExplicitConstraintKind;
    bounded_summary: string | null;
    source_refs: WritingSourceRef[];
  }>;
  communication_pattern: WritingEvidence & {
    usual_register: SurfaceRegister | "unknown";
    usual_length: SentenceLength | "unknown";
    usual_emoji_pattern: EmojiUsage | "unknown";
    usual_response_cadence_summary: string | null;
    usual_initiator: "user" | "other_person" | "reciprocal" | "variable" | "unknown";
    reciprocal_style_summary: string | null;
    unresolved_fields: CommunicationPatternUnresolvedField[];
  };
  channel_and_timing: WritingEvidence & {
    channel: Channel;
    relative_timing: RelativeTiming;
  };
  language_and_expression: WritingEvidence & {
    primary_language: "ja" | "en" | "other" | "unknown";
    mixed_languages: Array<"ja" | "en" | "other">;
    dialect_or_regional_expression: PresenceProfile;
    established_shared_expression: PresenceProfile;
    intentional_nonstandard_expression: PresenceProfile;
    possible_typo: PresenceProfile;
    unresolved_fields: LanguageExpressionUnresolvedField[];
  };
  repeat_consultation_state: WritingEvidence & {
    state: RepeatConsultationState;
    changed_fact_ids: WritingFactId[];
    unchanged_since_prior: boolean | null;
  };
  privacy_markers: PrivacyMarker[];
  unresolved_writing_fields: UnresolvedWritingField[];
  source_refs: WritingSourceRef[];
}

export type IntentStrength = "none" | "low" | "medium" | "high" | "unknown";
export type PresenceProfile = "present" | "absent" | "unknown";
export type CommunicationPatternUnresolvedField =
  | "usual_register"
  | "usual_length"
  | "usual_emoji_pattern"
  | "usual_response_cadence_summary"
  | "usual_initiator"
  | "reciprocal_style_summary";
export type LanguageExpressionUnresolvedField =
  | "primary_language"
  | "mixed_languages"
  | "dialect_or_regional_expression"
  | "established_shared_expression"
  | "intentional_nonstandard_expression"
  | "possible_typo";
export type UnresolvedWritingField =
  | "relationship_dimensions.romantic_stage"
  | "relationship_dimensions.social_role"
  | "relationship_dimensions.hierarchy"
  | "relationship_dimensions.familiarity"
  | "relationship_dimensions.communication_context"
  | "relationship_dimensions.observed_register"
  | "incoming_message_profile"
  | "candidate_style_profile"
  | "candidate_communicative_intent"
  | "user_goal_detail"
  | "communication_pattern"
  | "channel_and_timing"
  | "language_and_expression"
  | "repeat_consultation_state";
