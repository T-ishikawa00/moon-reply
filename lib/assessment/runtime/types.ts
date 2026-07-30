export const M2_STAGE_IDS = [
  "PB-01",
  "PB-02",
  "PB-03",
  "PB-04",
  "PB-05",
  "PB-06",
] as const;

export type M2StageId = (typeof M2_STAGE_IDS)[number];

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

export type PersistedAssessmentRequest = AssessmentInput & {
  id: string;
  idempotencyKey: string;
  source: "internal_review_runtime";
  status: "processing" | "completed" | "failed";
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
  source: "internal_review_runtime";
  now: string;
};

export type CreateRunRecord = {
  id: string;
  requestId: string;
  requestedModel: "gpt-5.6-luna";
  promptBundleVersion: string;
  schemaSetVersion: string;
  startedAt: string;
};

export type StartStageRecord = {
  id: string;
  runId: string;
  stageId: M2StageId;
  sequenceNumber: number;
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

export type CompleteRunRecord = UsageTotals & {
  runId: string;
  requestId: string;
  returnedModel: string | null;
  eligibility: Eligibility;
  decision: Decision | null;
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
  reportJson: RuntimeReport;
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

export type RuntimeReport = {
  schemaVersion: "m2-p3-runtime-report-v1";
  decisionPlan: DecisionPlan;
  content: ReportContent;
  fixedLimitation: string;
};

export type DecisionCard = {
  schemaVersion: "m2-p3-decision-card-v1";
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
};

export type AssessmentExecutionResult =
  | (CompletedAssessment & { duplicate: boolean })
  | {
      requestId: string;
      runId: string;
      eligibility: "needs_more_information" | "safety_blocked";
      questionCodes: string[];
      duplicate: boolean;
      usage: UsageTotals;
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
  completeRun(record: CompleteRunRecord): Promise<void>;
  failRun(record: FailRunRecord): Promise<void>;
  finalizeCompletedAssessment(
    record: FinalizeCompletedAssessmentRecord,
  ): Promise<void>;
  getCompletedAssessment(
    requestId: string,
  ): Promise<CompletedAssessment | null>;
}

export type PipelineEvent =
  | M2StageId
  | "LOCAL_SCHEMA_PB-01"
  | "LOCAL_SCHEMA_PB-02"
  | "LOCAL_SCHEMA_PB-03"
  | "LOCAL_SAFETY_AGGREGATION"
  | "LOCAL_ELIGIBILITY_GATE"
  | "LOCAL_DECISION_POLICY"
  | "LOCAL_SCHEMA_AND_PLAN_VALIDATION"
  | "LOCAL_SCHEMA_AND_REPORT_VALIDATION"
  | "LOCAL_SEMANTIC_DISPOSITION"
  | "SAVE_FINAL_REPORT"
  | "COMPLETE_RUN";

export type PipelineObserver = (event: PipelineEvent) => void;
