export const SPLIT_STAGE_CONTRACT_VERSION =
  "m2-p4-split-stage-contracts-v1" as const;

export const BASE_STRUCTURED_INTAKE_SCHEMA_VERSION =
  "pipeline-schema-base-v1.0.0" as const;

export const CANDIDATE_ANALYSIS_SCHEMA_VERSION =
  "pipeline-schema-candidate-v1.0.0" as const;

export const STAGE_TOPOLOGY_VERSIONS = [
  "legacy-six-v1",
  "split-base-candidate-v1",
] as const;

export type StageTopologyVersionV1 =
  (typeof STAGE_TOPOLOGY_VERSIONS)[number];

export type LegacyStageIdV1 =
  | "PB-01"
  | "PB-02"
  | "PB-03"
  | "PB-04"
  | "PB-05"
  | "PB-06";

export type SplitStageIdV1 = LegacyStageIdV1 | "PB-01C";

export type StageTopologyEntryV1<
  TStageId extends SplitStageIdV1 = SplitStageIdV1,
> = {
  readonly stage_id: TStageId;
  readonly sequence: number;
};

export const LEGACY_SIX_STAGE_TOPOLOGY = {
  version: "legacy-six-v1",
  stages: [
    { stage_id: "PB-01", sequence: 1 },
    { stage_id: "PB-02", sequence: 2 },
    { stage_id: "PB-03", sequence: 3 },
    { stage_id: "PB-04", sequence: 4 },
    { stage_id: "PB-05", sequence: 5 },
    { stage_id: "PB-06", sequence: 6 },
  ],
} as const satisfies {
  readonly version: StageTopologyVersionV1;
  readonly stages: readonly StageTopologyEntryV1<LegacyStageIdV1>[];
};

export const SPLIT_BASE_CANDIDATE_STAGE_TOPOLOGY = {
  version: "split-base-candidate-v1",
  stages: [
    { stage_id: "PB-01", sequence: 1 },
    { stage_id: "PB-01C", sequence: 2 },
    { stage_id: "PB-02", sequence: 3 },
    { stage_id: "PB-03", sequence: 4 },
    { stage_id: "PB-04", sequence: 5 },
    { stage_id: "PB-05", sequence: 6 },
    { stage_id: "PB-06", sequence: 7 },
  ],
} as const satisfies {
  readonly version: StageTopologyVersionV1;
  readonly stages: readonly StageTopologyEntryV1[];
};

export const BASE_SOURCE_REFS = [
  "input:current_situation",
  "input:relationship",
  "input:requested_topics",
] as const;

export type BaseSourceRefV1 = (typeof BASE_SOURCE_REFS)[number];

export const CANDIDATE_SAFETY_SIGNAL_CODES = [
  "threat",
  "coercion",
  "fear_inducing_pressure",
  "conditional_retaliation",
  "uninvited_visit",
  "location_tracking",
  "repeat_contact_pressure",
  "reply_demand",
  "address_disclosure",
  "identity_disclosure",
  "account_disclosure",
  "workplace_or_school_disclosure",
  "third_party_sensitive_detail",
  "self_harm_intent",
  "self_harm_threat_as_pressure",
  "suicidal_ideation",
  "violent_intent",
  "violent_threat",
  "instruction_to_harm",
  "minor_age_signal",
  "adult_minor_romantic_or_sexual_context",
  "authority_over_minor",
  "request_to_facilitate_illegal_conduct",
  "instruction_to_evade_lawful_process",
  "criminal_coordination",
  "initiates_contact",
  "continues_contact",
  "asks_for_reply",
  "proposes_meeting",
] as const;

export type CandidateSafetySignalCodeV1 =
  (typeof CANDIDATE_SAFETY_SIGNAL_CODES)[number];

export const CANDIDATE_ENVELOPE_STATES = {
  absent: {
    presence: false,
    analysis_status: "absent",
    safety_status: "absent",
    analysis: null,
  },
  available: {
    presence: true,
    analysis_status: "available",
    safety_status: "available",
    analysis: "CandidateAnalysisV1",
  },
  analysis_unavailable_safety_available: {
    presence: true,
    analysis_status: "unavailable",
    safety_status: "available",
    analysis: null,
  },
  safety_unavailable: {
    presence: true,
    analysis_status: "unavailable",
    safety_status: "unavailable",
    analysis: null,
  },
} as const;

export type BaseRelationshipV1 =
  | "dating"
  | "in_relationship"
  | "ambiguous"
  | "former_partner"
  | "matching_app"
  | "work_or_school"
  | "other";

export type BaseRequestedTopicV1 =
  | "decide_send_or_wait"
  | "message_impact"
  | "draft_message"
  | "relationship"
  | "next_three_days"
  | "organize_emotions";

export type BaseProviderInputV1 = {
  readonly current_situation: string;
  readonly relationship: BaseRelationshipV1;
  readonly requested_topics: readonly BaseRequestedTopicV1[];
};

export type CandidateMetadataV1 = {
  readonly message_owner: "user";
  readonly message_status: "unsent_candidate";
};

export type CandidateProviderInputV1 = {
  readonly optional_message: string;
  readonly candidate_metadata: CandidateMetadataV1;
};

export type CandidateStyleProfileV1 = {
  readonly register: "polite" | "neutral_polite" | "casual" | "mixed";
  readonly sentence_length: "terse" | "short" | "medium" | "long";
  readonly sentence_ending:
    | "formal"
    | "neutral"
    | "soft"
    | "playful"
    | "mixed";
  readonly punctuation: "sparse" | "standard" | "expressive";
  readonly emoji_usage: "none" | "restrained" | "frequent";
  readonly exclamation_usage: "none" | "restrained" | "frequent";
  readonly softness: "low" | "medium" | "high";
  readonly directness: "indirect" | "balanced" | "direct";
  readonly invitation_style: "none" | "tentative" | "direct" | "practical";
  readonly reply_pressure: "low" | "medium" | "high";
};

export type CandidateCommunicativeIntentV1 = {
  readonly gratitude_strength: "none" | "low" | "medium" | "high" | "unknown";
  readonly apology_strength: "none" | "low" | "medium" | "high" | "unknown";
  readonly question_count: number;
  readonly invitation_presence: boolean;
  readonly invitation_specificity:
    | "none"
    | "tentative"
    | "direct"
    | "practical"
    | "unknown";
  readonly affection_strength: "none" | "low" | "medium" | "high" | "unknown";
  readonly commitment_strength: "none" | "low" | "medium" | "high" | "unknown";
  readonly response_pressure: "none" | "low" | "medium" | "high" | "unknown";
  readonly boundary_strength: "none" | "low" | "medium" | "high" | "unknown";
  readonly conversation_closure: "none" | "soft" | "explicit" | "unknown";
  readonly practical_requirement: readonly (
    | "answer_question"
    | "confirm_schedule"
    | "provide_information"
    | "acknowledge_boundary"
    | "acknowledge_decline"
    | "none"
    | "unknown"
  )[];
};

export type CandidateLanguageExpressionV1 = {
  readonly primary_language: "ja" | "en" | "other" | "unknown";
  readonly mixed_languages: readonly ("ja" | "en" | "other")[];
  readonly dialect_or_regional_expression: "present" | "absent" | "unknown";
  readonly intentional_nonstandard_expression: "present" | "absent" | "unknown";
  readonly possible_typo: "present" | "absent" | "unknown";
};

export type CandidateSafetySignalsV1 = {
  readonly untrusted_embedded_instruction_detected: boolean;
  readonly signal_codes: readonly CandidateSafetySignalCodeV1[];
};

export type CandidateAnalysisV1 = {
  readonly candidate_style_profile: CandidateStyleProfileV1;
  readonly candidate_communicative_intent: CandidateCommunicativeIntentV1;
  readonly candidate_language_expression: CandidateLanguageExpressionV1;
};

export type CandidateProviderOutputV1 = CandidateAnalysisV1 & {
  readonly candidate_safety_signals: CandidateSafetySignalsV1;
};

export type CandidateAnalysisStatusV1 =
  | "absent"
  | "available"
  | "unavailable";

export type CandidateSafetyStatusV1 =
  | "absent"
  | "available"
  | "unavailable";

export type CandidateEnvelopeV1 =
  | {
      readonly presence: false;
      readonly analysis_status: "absent";
      readonly safety_status: "absent";
      readonly analysis: null;
    }
  | {
      readonly presence: true;
      readonly analysis_status: "available";
      readonly safety_status: "available";
      readonly analysis: CandidateAnalysisV1;
    }
  | {
      readonly presence: true;
      readonly analysis_status: "unavailable";
      readonly safety_status: "available";
      readonly analysis: null;
    }
  | {
      readonly presence: true;
      readonly analysis_status: "unavailable";
      readonly safety_status: "unavailable";
      readonly analysis: null;
    };

export const APPLICATION_CANONICAL_BASE_FIELD_MAP = {
  "base_structured_intake.relationship_stage": "request.relationship",
  "decision_facts.relationship_stage": "request.relationship",
  "decision_facts.selected_requests": "request.requestedTopics",
} as const;

export type ApplicationCanonicalBaseFieldMapV1 =
  typeof APPLICATION_CANONICAL_BASE_FIELD_MAP;

type IsAssignable<TValue, TTarget> = TValue extends TTarget ? true : false;
type Assert<TValue extends true> = TValue;

export type CandidateEnvelopeTypeAssertionsV1 = readonly [
  Assert<
    IsAssignable<
      {
        presence: false;
        analysis_status: "available";
        safety_status: "available";
        analysis: CandidateAnalysisV1;
      },
      CandidateEnvelopeV1
    > extends false
      ? true
      : false
  >,
  Assert<
    IsAssignable<
      {
        presence: true;
        analysis_status: "absent";
        safety_status: "absent";
        analysis: null;
      },
      CandidateEnvelopeV1
    > extends false
      ? true
      : false
  >,
  Assert<
    IsAssignable<
      {
        presence: true;
        analysis_status: "available";
        safety_status: "available";
        analysis: null;
      },
      CandidateEnvelopeV1
    > extends false
      ? true
      : false
  >,
  Assert<
    IsAssignable<
      {
        presence: true;
        analysis_status: "unavailable";
        safety_status: "available";
        analysis: CandidateAnalysisV1;
      },
      CandidateEnvelopeV1
    > extends false
      ? true
      : false
  >,
  Assert<
    IsAssignable<
      {
        presence: true;
        analysis_status: "unavailable";
        safety_status: "absent";
        analysis: null;
      },
      CandidateEnvelopeV1
    > extends false
      ? true
      : false
  >,
];
