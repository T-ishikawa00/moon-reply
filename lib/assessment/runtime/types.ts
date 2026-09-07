export const M2_STAGE_IDS = [
  "PB-01",
  "PB-01C",
  "PB-02",
  "PB-03",
  "PB-04",
  "PB-05",
  "PB-06",
] as const;

export type M2StageId = (typeof M2_STAGE_IDS)[number];

export const LEGACY_M2_STAGE_IDS = [
  "PB-01",
  "PB-02",
  "PB-03",
  "PB-04",
  "PB-05",
  "PB-06",
] as const;

export type LegacyM2StageId = (typeof LEGACY_M2_STAGE_IDS)[number];

export type StageTopologyVersion =
  | "legacy-six-v1"
  | "split-base-candidate-v1";

export type StageRunStatus =
  | "processing"
  | "completed"
  | "failed"
  | "skipped";

export type StageAttemptNumber = 1 | 2;

export const RELATIONSHIP_VALUES = [
  "dating",
  "in_relationship",
  "ambiguous",
  "former_partner",
  "matching_app",
  "work_or_school",
  "other",
] as const;

export type RelationshipValue = (typeof RELATIONSHIP_VALUES)[number];

export const REQUESTED_TOPIC_VALUES = [
  "decide_send_or_wait",
  "message_impact",
  "draft_message",
  "relationship",
  "next_three_days",
  "organize_emotions",
] as const;

export type RequestedTopic = (typeof REQUESTED_TOPIC_VALUES)[number];

export type Eligibility =
  | "ready"
  | "needs_more_information"
  | "not_full_product_candidate"
  | "safety_blocked";

export type Decision =
  | "reply_now"
  | "send_now"
  | "wait_and_reassess"
  | "pause_additional_contact";

export const DECISION_FACTS_RELATIONSHIP_STAGES = [
  "dating",
  "in_relationship",
  "ambiguous",
  "former_partner",
  "matching_app",
  "friend",
  "work_or_school",
  "other",
  "unknown",
] as const;

export type DecisionFactsRelationshipStage =
  (typeof DECISION_FACTS_RELATIONSHIP_STAGES)[number];

export type DecisionFactsV1 = {
  schema_version: "m2-p4-decision-facts-v1";
  relationship_stage: DecisionFactsRelationshipStage;
  selected_requests: RequestedTopic[];
  latest_direct_message: {
    sender: "user" | "other_person" | "none" | "unknown";
    kind:
      | "question"
      | "schedule_coordination"
      | "apology"
      | "thanks_or_followup"
      | "practical_information"
      | "invitation"
      | "closure_or_boundary"
      | "social_acknowledgement"
      | "other"
      | "none"
      | "unknown";
    response_expectation: "reasonable" | "optional" | "none" | "unknown";
    user_reply_state: "not_replied" | "replied" | "not_applicable" | "unknown";
    sns_signal_only: boolean;
  };
  contact_state: {
    unanswered_user_message_count: number | null;
    elapsed_since_latest_user_message_minutes: number | null;
    usual_cadence_relation:
      | "within_usual"
      | "beyond_usual"
      | "unknown"
      | "not_applicable";
    proposed_message_present: boolean;
  };
  boundary_state: {
    kind:
      | "none"
      | "no_contact"
      | "temporary_distance"
      | "blocked_or_restricted"
      | "relationship_closed"
      | "unknown";
    status: "none" | "explicit" | "unknown";
    repeated_unanswered_contact: boolean;
  };
  practical_reason: {
    kind:
      | "none"
      | "schedule_coordination"
      | "factual_correction"
      | "promised_information"
      | "logistics"
      | "thank_you"
      | "initial_apology"
      | "single_invitation"
      | "unknown";
    active: boolean;
    deadline: "none" | "same_day" | "next_day" | "later" | "unknown";
  };
  information_state: {
    complete_for_decision: true;
  };
};

export type StructuredIntakeV2 = {
  schema_version: "pipeline-schema-v2.0.0";
  relationship_stage: DecisionFactsRelationshipStage;
  user_goal:
    | "decide_send_or_wait"
    | "reply_to_message"
    | "prepare_message"
    | "organize_relationship"
    | "plan_next_three_days"
    | "organize_emotions"
    | "unknown";
  timeline: JsonObject[];
  boundaries: JsonObject[];
  context: JsonObject[];
  observed_facts: JsonObject[];
  user_assumptions: JsonObject[];
  user_emotions: JsonObject[];
  material_unknowns: JsonObject[];
  safety_signals: JsonObject[];
  untrusted_embedded_instructions_detected: boolean;
  decision_facts: DecisionFactsV1 | null;
};

export type DecisionPolicyResultV2 = {
  schema_version: "pipeline-schema-v2.0.0";
  policy_version: "decision-policy-v2.0.0";
  allowed_decisions: [Decision];
  disallowed_decisions: Array<{
    decision: Decision;
    reason_codes: string[];
  }>;
  follow_up_exception:
    | "none"
    | "material_factual_correction"
    | "same_day_schedule_change"
    | "next_day_schedule_change"
    | "promised_required_information"
    | "safety_necessary_contact";
  message_draft_policy: "required_now" | "later_only" | "not_allowed";
  later_draft_mode:
    | "candidate_can_be_prepared"
    | "defer_until_reassessment"
    | null;
  pause_reason_code:
    | "explicit_no_contact"
    | "temporary_distance_requested"
    | "blocked_or_restricted"
    | "relationship_closed"
    | "repeated_unanswered_contact"
    | null;
  resume_policy: "explicit_permission_required" | "other_initiated_only" | null;
  reason_codes: string[];
};

export type UserContactConstraintV1 = {
  kind: "none" | "no_followup_message" | "business_only" | "unknown";
  status: "none" | "explicit" | "unknown";
  supporting_fact_ids: string[];
};

export type ActionContextV1 = {
  schema_version: "m2-p4-action-context-v1";
  trusted_now_iso: string;
  time_zone: string;
  action_horizon: {
    code: "current_local_day_remaining";
    user_facing_label_ja: "今夜";
    starts_at: string;
    ends_at: string;
  };
  authority: "application";
};

export type ContactConstraintPolicyV1 = {
  schema_version: "m2-p4-contact-constraint-policy-v1";
  constraint_kind: UserContactConstraintV1["kind"];
  constraint_status: UserContactConstraintV1["status"];
  supporting_fact_ids: string[];
  follow_up_exception: DecisionPolicyResultV2["follow_up_exception"];
  outbound_contact_now_allowed: boolean;
  outbound_contact_after_time_passage_allowed: boolean;
  exception_required_for_future_contact: boolean;
};

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export type JsonObject = { [key: string]: JsonValue };

export type AssessmentInput = {
  currentSituation: string;
  optionalMessage: string | null;
  relationship: RelationshipValue;
  requestedTopics: RequestedTopic[];
  privacyAcknowledged: true;
};

export type AssessmentRequestSource =
  | "internal_review_runtime"
  | "production_fulfillment_runtime";

export type PersistedAssessmentRequest = AssessmentInput & {
  id: string;
  idempotencyKey: string;
  source: AssessmentRequestSource;
  status: "processing" | "awaiting_clarification" | "completed" | "failed";
  createdAt: string;
  updatedAt: string;
};

export type UsageRecord = {
  inputTokens: number;
  cachedTokens: number;
  outputTokens: number;
  reasoningTokens: number;
};

export type UsageTotals = {
  totalInputTokens: number;
  totalCachedTokens: number;
  totalOutputTokens: number;
  totalReasoningTokens: number;
  usageDerivedCostUsd: number;
};

export type StageDefinition = {
  stageId: M2StageId;
  sequenceNumber: number;
  promptVersion: string;
  promptHash: string;
  developerPrompt: string;
  schemaName: string;
  schemaVersion: string;
  schemaHash: string;
  outputSchema: JsonObject;
  groundedOutputSchema?: JsonObject;
  groundedSchemaVersion?: string;
  groundedSchemaHash?: string;
  clarificationOutputSchema?: JsonObject;
  clarificationSchemaVersion?: string;
  clarificationSchemaHash?: string;
};

export type StageRequest = {
  stageId: M2StageId;
  model: "gpt-5.6-luna";
  developerPrompt: string;
  promptVersion: string;
  promptHash: string;
  schemaName: string;
  schemaVersion: string;
  schemaHash: string;
  outputSchema: JsonObject;
  input: JsonObject;
};

export type StageResponse = {
  responseId: string;
  returnedModel: string;
  output: JsonObject;
  usage: UsageRecord;
  latencyMs: number;
};

export interface AiStageTransport {
  invoke(stageRequest: StageRequest): Promise<StageResponse>;
}

export type CreateRequestRecord = AssessmentInput & {
  id: string;
  idempotencyKey: string;
  source: AssessmentRequestSource;
  now: string;
};

export type CreateRunRecord = {
  id: string;
  requestId: string;
  requestedModel: "gpt-5.6-luna";
  promptBundleVersion: string;
  schemaSetVersion: string;
  stageTopologyVersion: StageTopologyVersion;
  runKind: "initial" | "clarification_resume" | "fulfillment_resume";
  startedAt: string;
};

export type StartStageRecord = {
  id: string;
  runId: string;
  stageId: M2StageId;
  sequenceNumber: number;
  attemptNumber: StageAttemptNumber;
  requestHash: string;
  promptHash: string;
  schemaHash: string;
  requestedModel: "gpt-5.6-luna";
  createdAt: string;
};

export type CompleteStageRecord = {
  stageRunId: string;
  responseId: string;
  returnedModel: string;
  usage: UsageRecord;
  latencyMs: number;
  outputJson: JsonObject;
};

export type FailStageRecord = {
  stageRunId: string;
  responseId: string | null;
  returnedModel: string | null;
  usage: UsageRecord;
  latencyMs: number;
  outputJson: JsonObject | null;
  errorCode: string;
};

export type SkipStageRecord = {
  id: string;
  runId: string;
  stageId: M2StageId;
  sequenceNumber: number;
  attemptNumber: 1;
  requestHash: string;
  promptHash: string;
  schemaHash: string;
  requestedModel: "gpt-5.6-luna";
  skipReason:
    | "candidate_absent"
    | "reused_initial_authority"
    | "reused_purchase_ready_authority"
    | "routing_stopped";
  createdAt: string;
};

export type CompleteRunRecord = UsageTotals & {
  runId: string;
  requestId: string;
  returnedModel: string | null;
  eligibility: Eligibility;
  decision: Decision | null;
  resultJson?: JsonObject;
  completedAt: string;
};

export type FailRunRecord = UsageTotals & {
  runId: string;
  requestId: string;
  returnedModel: string | null;
  errorCode: string;
  completedAt: string;
};

export type FinalizeCompletedAssessmentRecord = UsageTotals & {
  reportId: string;
  runId: string;
  requestId: string;
  returnedModel: string | null;
  eligibility: "ready";
  decision: Decision;
  reportJson: RuntimeReport | SplitRuntimeReportV1;
  decisionCardJson: DecisionCard;
  completedAt: string;
};

export type DecisionPlan = {
  schema_version: "pipeline-schema-v1.0.0";
  selected_decision: Decision;
  decision_reason_fact_ids: string[];
  possible_interpretations: Array<{
    statement: string;
    supporting_fact_ids: string[];
    epistemic_status: "possibility_only";
  }>;
  actions_to_take: string[];
  actions_to_avoid: string[];
  message_draft: {
    text: string;
    policy: "required_now" | "later_only";
    use_timing: "now" | "later";
  } | null;
  three_day_plan: Array<{
    day: "tonight" | "next_day" | "day_three";
    action: string;
    avoid: string;
  }>;
  change_conditions: Array<{
    condition: string;
    resulting_direction: Decision;
  }>;
  review_timing: {
    when: string;
    trigger_fact_ids: string[];
  };
  material_unknowns: string[];
  limitations: string[];
};

export type ReportContent = {
  schema_version: "pipeline-schema-v1.0.0";
  cover_line: string;
  short_letter: string[];
  decision_reason_summary: string;
  relationship_summary: string;
  observed_fact_commentary: Array<{
    fact_id: string;
    commentary: string;
  }>;
  possible_interpretations: string[];
  anxiety_reframe: string[];
  message_temperature: {
    softness: string;
    affection: string;
    pressure: string;
    adjustment: string;
  };
  action_rationales: string[];
  message_draft_context: string | null;
  three_day_plan_commentary: [string, string, string];
  change_condition_commentary: string[];
  unknowns_commentary: string[];
  closing_lines: string[];
};

export type SplitDecisionPlanV2 = {
  schema_version: "pipeline-schema-v2.0.0" | "guidance-decision-plan-v1";
  selected_decision: Decision;
  decision_reason_fact_ids: string[];
  possible_interpretations: Array<{
    statement: string;
    supporting_fact_ids: string[];
    epistemic_status: "possibility_only";
  }>;
  pre_action_check: {
    check: string;
    supporting_fact_ids: string[];
  };
  actions_to_take: string[];
  actions_to_avoid: string[];
  recommended_message_draft: {
    text: string;
    policy: "required_now" | "later_only";
    use_timing: "now" | "later";
  } | null;
  message_draft_edit_metadata: {
    source_status:
      | "generated_without_candidate"
      | "candidate_preserved"
      | "candidate_minimally_edited"
      | "candidate_materially_corrected_for_safety_or_boundary";
    preserved_meaning: boolean;
    style_delta: Array<{
      dimension:
        | "register"
        | "sentence_length"
        | "sentence_ending"
        | "punctuation"
        | "emoji_usage"
        | "exclamation_usage"
        | "softness"
        | "directness"
        | "invitation_style"
        | "reply_pressure";
      change:
        | "preserved"
        | "lightly_adjusted"
        | "materially_adjusted"
        | "unresolved";
      reason: string;
    }>;
    communicative_intent_delta: JsonObject;
    change_reasons: string[];
    change_summary: string | null;
  } | null;
  aftercare_plan: Array<{
    phase: "tonight" | "next" | "reassessment_condition";
    action: string;
    avoid: string | null;
    supporting_fact_ids: string[];
  }>;
  change_conditions: Array<{
    condition: string;
    resulting_direction: Decision;
    supporting_fact_ids: string[];
  }>;
  review_timing: {
    when: string;
    trigger_fact_ids: string[];
  };
  material_unknowns: Array<{
    unknown_code: string;
    summary: string;
    material_to: "decision" | "draft" | "action" | "safety";
  }>;
  model_generated_limitations: string[];
};

export type SplitReportContentV2 = {
  schema_version: "pipeline-schema-v2.0.0";
  cover_line: string;
  short_letter: string[];
  decision_reason_summary: string;
  relationship_summary: string | null;
  observed_fact_commentary: Array<{
    fact_id: string;
    commentary: string;
  }>;
  possible_interpretations: string[];
  anxiety_reframe: string[];
  message_temperature: {
    softness: string;
    affection: string;
    pressure: string;
    adjustment: string;
  } | null;
  action_rationales: string[];
  message_draft_context: string | null;
  aftercare_commentary: string[];
  change_condition_commentary: string[];
  closing_lines: string[];
};

export type RuntimeReport = {
  schemaVersion: "m2-p3-runtime-report-v1";
  decisionPlan: DecisionPlan;
  content: ReportContent;
  fixedLimitation: string;
};

export type SplitRuntimeReportV1 = {
  schemaVersion: "m2-p4-split-runtime-report-v1" | "guidance-runtime-report-v1";
  decisionPlan: SplitDecisionPlanV2;
  content: SplitReportContentV2;
  fixedLimitation: string;
};

export type DecisionCard = {
  schemaVersion: "m2-p3-decision-card-v1" | "guidance-decision-card-v1";
  decision: Decision;
  reason: string;
  actionsToTake: string[];
  actionsToAvoid: string[];
  messageDraft: string | null;
  reviewTiming: string;
};

export type CompletedAssessment = {
  requestId: string;
  runId: string;
  eligibility: "ready";
  decision: Decision;
  report: RuntimeReport;
  decisionCard: DecisionCard;
  usage: UsageTotals;
  authoritativeRequestedTopics?: RequestedTopic[];
};

export type SplitCompletedAssessment = Omit<CompletedAssessment, "report"> & {
  report: SplitRuntimeReportV1;
};

export type LegacyReadyAssessmentResult = CompletedAssessment & {
  duplicate: boolean;
};

export type SplitReadyAssessmentResult = SplitCompletedAssessment & {
  duplicate: boolean;
};

export type ReadyAssessmentResult =
  | LegacyReadyAssessmentResult
  | SplitReadyAssessmentResult;

export type StoppedAssessmentResult = {
  requestId: string;
  runId: string;
  eligibility:
    | "needs_more_information"
    | "not_full_product_candidate"
    | "safety_blocked";
  questionCodes: string[];
  reasonCodes: string[];
  clarification: RuntimeClarificationPromptV1 | null;
  duplicate: boolean;
  usage: UsageTotals;
  authoritativeRequestedTopics?: RequestedTopic[];
};

export type AssessmentExecutionResult =
  | ReadyAssessmentResult
  | StoppedAssessmentResult;

export type PurchaseReadyRuntimeAuthorityV1 = {
  schemaVersion: "rc1-purchase-ready-runtime-authority-v1";
  runtimeIdentity: {
    model: "gpt-5.6-luna";
    promptBundleVersion: "prompt-bundle-runtime-v17.0.0";
    schemaSetVersion: "pipeline-schema-runtime-v6.0.0";
    stageTopologyVersion: "split-base-candidate-v1";
  };
  request: AssessmentInput;
  baseStructuredIntake: JsonObject;
  candidateEnvelope: JsonObject;
  aggregateSafety: JsonObject;
  effectiveAssessmentAuthority: JsonObject;
  clarificationGrounding: JsonObject | null;
};

export type PurchaseReadyPreparationResult = {
  requestId: string;
  runId: string;
  eligibility: "purchase_ready";
  duplicate: false;
  usage: UsageTotals;
  authority: PurchaseReadyRuntimeAuthorityV1;
};

export type PurchasePreparationExecutionResult =
  | PurchaseReadyPreparationResult
  | StoppedAssessmentResult;

export type Jpy980ClarificationTarget =
  | "material_relationship_or_communication_concern"
  | "latest_contact_timing"
  | "usual_reply_cadence"
  | "central_fear_or_decision_concern"
  | "relationship_intent"
  | "requested_message_tone";

export type RuntimeClarificationPromptV1 = {
  opaqueClarificationId: string;
  questionCode: string;
  target: Jpy980ClarificationTarget;
  question: string;
  maximumQuestionsTotal: 1;
  questionsAlreadyUsed: 0;
  questionsRemaining: 1;
};

export type PersistedAssessmentClarification = {
  schemaVersion: "m2-p4-assessment-clarification-v1";
  id: string;
  requestId: string;
  ordinal: 1;
  questionCode: string;
  target: Jpy980ClarificationTarget;
  questionSnapshot: string;
  provenance: "user_clarification";
  sourceIdentity: string;
  answerStatus: "pending" | "answered";
  answer: JsonValue | null;
  answerFingerprint: string | null;
  groundedNormalizedRepresentation: JsonObject | null;
  safetySignals: JsonObject[];
  resumeRunId: string | null;
  createdAt: string;
  answeredAt: string | null;
};

export type FinalizeNeedsMoreInformationRecord = UsageTotals & {
  runId: string;
  requestId: string;
  returnedModel: string | null;
  completedAt: string;
  policyResult: JsonObject;
  resultJson: JsonObject;
  clarification: Omit<
    PersistedAssessmentClarification,
    | "answerStatus"
    | "answer"
    | "answerFingerprint"
    | "groundedNormalizedRepresentation"
    | "safetySignals"
    | "resumeRunId"
    | "answeredAt"
  >;
};

export type FinalizePurchaseReadyPreparationRecord = UsageTotals & {
  runId: string;
  requestId: string;
  returnedModel: string | null;
  policyResult: JsonObject;
  completedAt: string;
};

export type AcceptClarificationAnswerRecord = {
  clarificationId: string;
  answer: JsonValue;
  answerFingerprint: string;
  groundedNormalizedRepresentation: JsonObject;
  answeredAt: string;
  resumeRun: CreateRunRecord;
};

export type AcceptClarificationAnswerOutcome = {
  disposition: "accepted" | "duplicate";
  clarification: PersistedAssessmentClarification;
  request: PersistedAssessmentRequest;
  resumeRunId: string;
};

export type CompleteClarificationGroundingRecord = {
  clarificationId: string;
  groundedNormalizedRepresentation: JsonObject;
  safetySignals: JsonObject[];
};

export type PersistedInitialAuthorityV1 = {
  request: PersistedAssessmentRequest;
  initialRunId: string;
  initialRunStartedAt: string;
  initialPolicyResult: JsonObject;
  pb01Output: JsonObject;
  pb01c: {
    status: "completed" | "failed" | "skipped";
    outputJson: JsonObject | null;
    errorCode: string | null;
  };
  pb02Output: JsonObject;
};

export interface AssessmentRepository {
  createRequest(record: CreateRequestRecord): Promise<PersistedAssessmentRequest>;
  findByIdempotencyKey(
    idempotencyKey: string,
  ): Promise<PersistedAssessmentRequest | null>;
  createRun(record: CreateRunRecord): Promise<void>;
  startStage(record: StartStageRecord): Promise<void>;
  completeStage(record: CompleteStageRecord): Promise<void>;
  failStage(record: FailStageRecord): Promise<void>;
  skipStage(record: SkipStageRecord): Promise<void>;
  completeRun(record: CompleteRunRecord): Promise<void>;
  finalizeNeedsMoreInformation(
    record: FinalizeNeedsMoreInformationRecord,
  ): Promise<PersistedAssessmentClarification>;
  finalizePurchaseReadyPreparation(
    record: FinalizePurchaseReadyPreparationRecord,
  ): Promise<void>;
  findClarificationById(
    clarificationId: string,
  ): Promise<PersistedAssessmentClarification | null>;
  findClarificationByRequestId(
    requestId: string,
  ): Promise<PersistedAssessmentClarification | null>;
  acceptClarificationAndCreateResumeRun(
    record: AcceptClarificationAnswerRecord,
  ): Promise<AcceptClarificationAnswerOutcome>;
  completeClarificationGrounding(
    record: CompleteClarificationGroundingRecord,
  ): Promise<void>;
  getInitialAuthorityForResume(
    requestId: string,
  ): Promise<PersistedInitialAuthorityV1>;
  failRun(record: FailRunRecord): Promise<void>;
  finalizeCompletedAssessment(
    record: FinalizeCompletedAssessmentRecord,
  ): Promise<void>;
  getCompletedAssessment(
    requestId: string,
  ): Promise<CompletedAssessment | SplitCompletedAssessment | null>;
  getAssessmentResult(
    requestId: string,
  ): Promise<AssessmentExecutionResult | null>;
}

export type PipelineEvent =
  | M2StageId
  | "LOCAL_SCHEMA_PB-01"
  | "LOCAL_SCHEMA_PB-01C"
  | "LOCAL_SCHEMA_PB-02"
  | "LOCAL_SCHEMA_PB-03"
  | "LOCAL_SAFETY_AGGREGATION"
  | "LOCAL_ELIGIBILITY_GATE"
  | "LOCAL_JPY980_INPUT_SUFFICIENCY"
  | "LOCAL_EFFECTIVE_ASSESSMENT_AUTHORITY"
  | "LOCAL_CLARIFICATION_GROUNDING"
  | "LOCAL_DECISION_POLICY"
  | "LOCAL_SCHEMA_AND_PLAN_VALIDATION"
  | "LOCAL_SCHEMA_AND_REPORT_VALIDATION"
  | "LOCAL_SEMANTIC_DISPOSITION"
  | "SAVE_FINAL_REPORT"
  | "COMPLETE_RUN";

export type PipelineObserver = (event: PipelineEvent) => void;
