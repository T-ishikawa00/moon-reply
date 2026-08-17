import "server-only";
import {
  createClient,
  type SupabaseClient,
} from "@supabase/supabase-js";
import { M2RuntimeError } from "./errors.ts";
import {
  decodeRequestedTopics,
  hydratePersistedReadyAssessmentV1,
} from "./runtime-result-normalization-v1.ts";
import { decodeAssessmentExecutionResultV2 } from "./runtime-result-normalization-v2.ts";
import type {
  AcceptClarificationAnswerRecord,
  AssessmentExecutionResult,
  AssessmentRepository,
  CompleteClarificationGroundingRecord,
  CompleteRunRecord,
  CompleteStageRecord,
  CreateRequestRecord,
  CreateRunRecord,
  FailRunRecord,
  FailStageRecord,
  FinalizeCompletedAssessmentRecord,
  FinalizeNeedsMoreInformationRecord,
  JsonObject,
  JsonValue,
  Jpy980ClarificationTarget,
  PersistedAssessmentClarification,
  PersistedInitialAuthorityV1,
  PersistedAssessmentRequest,
  RelationshipValue,
  RequestedTopic,
  SkipStageRecord,
  StageRunStatus,
  StageTopologyVersion,
  StartStageRecord,
} from "./types.ts";

type RequestRow = {
  id: string;
  idempotency_key: string;
  source: string;
  raw_situation: string;
  optional_message: string | null;
  relationship: RelationshipValue;
  requested_topics: RequestedTopic[];
  privacy_acknowledged: boolean;
  status: "processing" | "awaiting_clarification" | "completed" | "failed";
  created_at: string;
  updated_at: string;
};

type RunRow = {
  id: string;
  request_id: string;
  status: "processing" | "completed" | "failed";
  requested_model: string;
  returned_model: string | null;
  prompt_bundle_version: string;
  schema_set_version: string;
  stage_topology_version: StageTopologyVersion;
  run_kind: "initial" | "clarification_resume";
  eligibility: string | null;
  decision: string | null;
  total_input_tokens: number;
  total_cached_tokens: number;
  total_output_tokens: number;
  total_reasoning_tokens: number;
  usage_derived_cost_usd: number;
  started_at: string;
  completed_at: string | null;
  error_code: string | null;
  result_json: JsonObject | null;
  policy_result_json: JsonObject | null;
};

type StageRunRow = {
  id: string;
  run_id: string;
  stage_id: string;
  sequence_number: number;
  attempt_number: 1 | 2;
  status: StageRunStatus;
  request_hash: string;
  prompt_hash: string;
  schema_hash: string;
  response_id: string | null;
  requested_model: string;
  returned_model: string | null;
  input_tokens: number;
  cached_tokens: number;
  output_tokens: number;
  reasoning_tokens: number;
  latency_ms: number;
  output_json: unknown;
  error_code: string | null;
  skip_reason:
    | "candidate_absent"
    | "reused_initial_authority"
    | "routing_stopped"
    | null;
  created_at: string;
};

type ReportRow = {
  id: string;
  run_id: string;
  report_json: unknown;
  decision_card_json: unknown;
  created_at: string;
};

type ClarificationRow = {
  schema_version: "m2-p4-assessment-clarification-v1";
  id: string;
  request_id: string;
  ordinal: 1;
  question_code: string;
  target: Jpy980ClarificationTarget;
  question_snapshot: string;
  provenance: "user_clarification";
  source_identity: string;
  answer_status: "pending" | "answered";
  answer: JsonValue | null;
  answer_fingerprint: string | null;
  grounded_normalized_representation: JsonObject | null;
  safety_signals: JsonObject[];
  resume_run_id: string | null;
  created_at: string;
  answered_at: string | null;
};

type RuntimeTable<Row extends Record<string, unknown>> = {
  Row: Row;
  Insert: Partial<Row>;
  Update: Partial<Row>;
  Relationships: [];
};

type RuntimeDatabase = {
  public: {
    Tables: {
      assessment_requests: RuntimeTable<RequestRow>;
      assessment_runs: RuntimeTable<RunRow>;
      assessment_stage_runs: RuntimeTable<StageRunRow>;
      assessment_reports: RuntimeTable<ReportRow>;
      assessment_clarifications: RuntimeTable<ClarificationRow>;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      finalize_completed_assessment: {
        Args: {
          p_report_id: string;
          p_run_id: string;
          p_request_id: string;
          p_returned_model: string | null;
          p_decision: string;
          p_report_json: unknown;
          p_decision_card_json: unknown;
          p_total_input_tokens: number;
          p_total_cached_tokens: number;
          p_total_output_tokens: number;
          p_total_reasoning_tokens: number;
          p_usage_derived_cost_usd: number;
          p_completed_at: string;
        };
        Returns: undefined;
      };
      finalize_needs_more_information_v1: {
        Args: Record<string, unknown>;
        Returns: undefined;
      };
      accept_assessment_clarification_v1: {
        Args: Record<string, unknown>;
        Returns: JsonValue;
      };
      finalize_stopped_assessment_v1: {
        Args: Record<string, unknown>;
        Returns: undefined;
      };
      fail_assessment_run_v1: {
        Args: Record<string, unknown>;
        Returns: undefined;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

function databaseFailure() {
  return new M2RuntimeError("M2_DATABASE_OPERATION_FAILED");
}

function isIdempotencyConflict(
  error: {
    code?: string;
    details?: string;
    message?: string;
  } | null,
) {
  return (
    error?.code === "23505" &&
    `${error.details ?? ""} ${error.message ?? ""}`.includes(
      "idempotency_key",
    )
  );
}

function mapRequest(row: RequestRow): PersistedAssessmentRequest {
  return {
    id: row.id,
    idempotencyKey: row.idempotency_key,
    source: "internal_review_runtime",
    currentSituation: row.raw_situation,
    optionalMessage: row.optional_message,
    relationship: row.relationship,
    requestedTopics: decodeRequestedTopics(row.requested_topics),
    privacyAcknowledged: true,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class SupabaseAssessmentRepository implements AssessmentRepository {
  private readonly client: SupabaseClient<RuntimeDatabase>;

  constructor(url: string, secretKey: string) {
    this.client = createClient<RuntimeDatabase>(url, secretKey, {
      auth: {
        autoRefreshToken: false,
        detectSessionInUrl: false,
        persistSession: false,
      },
    });
  }

  async createRequest(record: CreateRequestRecord) {
    const { data, error } = await this.client
      .from("assessment_requests")
      .insert({
        id: record.id,
        idempotency_key: record.idempotencyKey,
        source: record.source,
        raw_situation: record.currentSituation,
        optional_message: record.optionalMessage,
        relationship: record.relationship,
        requested_topics: record.requestedTopics,
        privacy_acknowledged: true,
        status: "processing",
        created_at: record.now,
        updated_at: record.now,
      })
      .select("*")
      .single();
    if (isIdempotencyConflict(error)) {
      throw new M2RuntimeError("M2_IDEMPOTENCY_CONFLICT", 409);
    }
    if (error || !data) throw databaseFailure();
    return mapRequest(data);
  }

  async findByIdempotencyKey(idempotencyKey: string) {
    const { data, error } = await this.client
      .from("assessment_requests")
      .select("*")
      .eq("idempotency_key", idempotencyKey)
      .maybeSingle();
    if (error) throw databaseFailure();
    return data ? mapRequest(data) : null;
  }

  async createRun(record: CreateRunRecord) {
    const { error } = await this.client.from("assessment_runs").insert({
      id: record.id,
      request_id: record.requestId,
      status: "processing",
      requested_model: record.requestedModel,
      returned_model: null,
      prompt_bundle_version: record.promptBundleVersion,
      schema_set_version: record.schemaSetVersion,
      stage_topology_version: record.stageTopologyVersion,
      run_kind: record.runKind ?? "initial",
      eligibility: null,
      decision: null,
      total_input_tokens: 0,
      total_cached_tokens: 0,
      total_output_tokens: 0,
      total_reasoning_tokens: 0,
      usage_derived_cost_usd: 0,
      started_at: record.startedAt,
      completed_at: null,
      error_code: null,
      result_json: null,
      policy_result_json: null,
    });
    if (error) throw databaseFailure();
  }

  async startStage(record: StartStageRecord) {
    const { error } = await this.client.from("assessment_stage_runs").insert({
      id: record.id,
      run_id: record.runId,
      stage_id: record.stageId,
      sequence_number: record.sequenceNumber,
      attempt_number: record.attemptNumber,
      status: "processing",
      request_hash: record.requestHash,
      prompt_hash: record.promptHash,
      schema_hash: record.schemaHash,
      response_id: null,
      requested_model: record.requestedModel,
      returned_model: null,
      input_tokens: 0,
      cached_tokens: 0,
      output_tokens: 0,
      reasoning_tokens: 0,
      latency_ms: 0,
      output_json: null,
      error_code: null,
      skip_reason: null,
      created_at: record.createdAt,
    });
    if (error) throw databaseFailure();
  }

  async completeStage(record: CompleteStageRecord) {
    const { error } = await this.client
      .from("assessment_stage_runs")
      .update({
        status: "completed",
        response_id: record.responseId,
        returned_model: record.returnedModel,
        input_tokens: record.usage.inputTokens,
        cached_tokens: record.usage.cachedTokens,
        output_tokens: record.usage.outputTokens,
        reasoning_tokens: record.usage.reasoningTokens,
        latency_ms: record.latencyMs,
        output_json: record.outputJson,
        error_code: null,
      })
      .eq("id", record.stageRunId);
    if (error) throw databaseFailure();
  }

  async failStage(record: FailStageRecord) {
    const { error } = await this.client
      .from("assessment_stage_runs")
      .update({
        status: "failed",
        response_id: record.responseId,
        returned_model: record.returnedModel,
        input_tokens: record.usage.inputTokens,
        cached_tokens: record.usage.cachedTokens,
        output_tokens: record.usage.outputTokens,
        reasoning_tokens: record.usage.reasoningTokens,
        latency_ms: record.latencyMs,
        output_json: record.outputJson,
        error_code: record.errorCode,
      })
      .eq("id", record.stageRunId);
    if (error) throw databaseFailure();
  }

  async skipStage(record: SkipStageRecord) {
    const { error } = await this.client.from("assessment_stage_runs").insert({
      id: record.id,
      run_id: record.runId,
      stage_id: record.stageId,
      sequence_number: record.sequenceNumber,
      attempt_number: record.attemptNumber,
      status: "skipped",
      request_hash: record.requestHash,
      prompt_hash: record.promptHash,
      schema_hash: record.schemaHash,
      response_id: null,
      requested_model: record.requestedModel,
      returned_model: null,
      input_tokens: 0,
      cached_tokens: 0,
      output_tokens: 0,
      reasoning_tokens: 0,
      latency_ms: 0,
      output_json: null,
      error_code: null,
      skip_reason: record.skipReason,
      created_at: record.createdAt,
    });
    if (error) throw databaseFailure();
  }

  async completeRun(record: CompleteRunRecord) {
    if (record.resultJson !== undefined) {
      if (
        record.eligibility !== "not_full_product_candidate" &&
        record.eligibility !== "safety_blocked"
      ) {
        throw new M2RuntimeError("M2_PERSISTED_RESULT_INVALID");
      }
      const { error } = await this.client.rpc("finalize_stopped_assessment_v1", {
        p_run_id: record.runId,
        p_request_id: record.requestId,
        p_returned_model: record.returnedModel,
        p_eligibility: record.eligibility,
        p_decision: record.decision,
        p_result_json: record.resultJson,
        p_total_input_tokens: record.totalInputTokens,
        p_total_cached_tokens: record.totalCachedTokens,
        p_total_output_tokens: record.totalOutputTokens,
        p_total_reasoning_tokens: record.totalReasoningTokens,
        p_usage_derived_cost_usd: record.usageDerivedCostUsd,
        p_completed_at: record.completedAt,
      });
      if (error) throw databaseFailure();
      return;
    }

    // Preserve the pre-V1-A2 completion contract for historical callers that
    // have no first-class result JSON. In particular, the V1-A2 stop RPC does
    // not accept legacy needs_more_information records.
    const { error: runError } = await this.client
      .from("assessment_runs")
      .update({
        status: "completed",
        returned_model: record.returnedModel,
        eligibility: record.eligibility,
        decision: record.decision,
        total_input_tokens: record.totalInputTokens,
        total_cached_tokens: record.totalCachedTokens,
        total_output_tokens: record.totalOutputTokens,
        total_reasoning_tokens: record.totalReasoningTokens,
        usage_derived_cost_usd: record.usageDerivedCostUsd,
        completed_at: record.completedAt,
        error_code: null,
      })
      .eq("id", record.runId)
      .eq("status", "processing");
    if (runError) throw databaseFailure();
    const { error: requestError } = await this.client
      .from("assessment_requests")
      .update({ status: "completed", updated_at: record.completedAt })
      .eq("id", record.requestId)
      .eq("status", "processing");
    if (requestError) throw databaseFailure();
  }

  async finalizeNeedsMoreInformation(record: FinalizeNeedsMoreInformationRecord) {
    const { error } = await this.client.rpc("finalize_needs_more_information_v1", {
      p_run_id: record.runId,
      p_request_id: record.requestId,
      p_returned_model: record.returnedModel,
      p_policy_result_json: record.policyResult,
      p_result_json: record.resultJson,
      p_total_input_tokens: record.totalInputTokens,
      p_total_cached_tokens: record.totalCachedTokens,
      p_total_output_tokens: record.totalOutputTokens,
      p_total_reasoning_tokens: record.totalReasoningTokens,
      p_usage_derived_cost_usd: record.usageDerivedCostUsd,
      p_completed_at: record.completedAt,
      p_clarification_id: record.clarification.id,
      p_schema_version: record.clarification.schemaVersion,
      p_ordinal: record.clarification.ordinal,
      p_question_code: record.clarification.questionCode,
      p_target: record.clarification.target,
      p_question_snapshot: record.clarification.questionSnapshot,
      p_provenance: record.clarification.provenance,
      p_source_identity: record.clarification.sourceIdentity,
      p_created_at: record.clarification.createdAt,
    });
    if (error) throw databaseFailure();
    const clarification = await this.findClarificationById(
      record.clarification.id,
    );
    if (!clarification) throw databaseFailure();
    return clarification;
  }

  async findClarificationById(clarificationId: string) {
    const { data, error } = await this.client
      .from("assessment_clarifications")
      .select("*")
      .eq("id", clarificationId)
      .maybeSingle();
    if (error) throw databaseFailure();
    return data ? mapClarification(data) : null;
  }

  async findClarificationByRequestId(requestId: string) {
    const { data, error } = await this.client
      .from("assessment_clarifications")
      .select("*")
      .eq("request_id", requestId)
      .maybeSingle();
    if (error) throw databaseFailure();
    return data ? mapClarification(data) : null;
  }

  async acceptClarificationAndCreateResumeRun(
    record: AcceptClarificationAnswerRecord,
  ) {
    const { data, error } = await this.client.rpc(
      "accept_assessment_clarification_v1",
      {
        p_clarification_id: record.clarificationId,
        p_answer: record.answer,
        p_answer_fingerprint: record.answerFingerprint,
        p_grounded_normalized_representation:
          record.groundedNormalizedRepresentation,
        p_answered_at: record.answeredAt,
        p_resume_run_id: record.resumeRun.id,
        p_requested_model: record.resumeRun.requestedModel,
        p_prompt_bundle_version: record.resumeRun.promptBundleVersion,
        p_schema_set_version: record.resumeRun.schemaSetVersion,
        p_stage_topology_version: record.resumeRun.stageTopologyVersion,
        p_started_at: record.resumeRun.startedAt,
      },
    );
    if (error) {
      const message = `${error.message ?? ""} ${error.details ?? ""}`;
      if (message.includes("M2_CLARIFICATION_ALREADY_ANSWERED")) {
        throw new M2RuntimeError("M2_CLARIFICATION_ALREADY_ANSWERED", 409);
      }
      if (message.includes("M2_CLARIFICATION_NOT_FOUND")) {
        throw new M2RuntimeError("M2_CLARIFICATION_NOT_FOUND", 404);
      }
      throw databaseFailure();
    }
    if (
      typeof data !== "object" ||
      data === null ||
      Array.isArray(data) ||
      (data.disposition !== "accepted" && data.disposition !== "duplicate") ||
      typeof data.resume_run_id !== "string"
    ) throw databaseFailure();
    const clarification = await this.findClarificationById(
      record.clarificationId,
    );
    if (!clarification) throw databaseFailure();
    const { data: requestRow, error: requestError } = await this.client
      .from("assessment_requests")
      .select("*")
      .eq("id", clarification.requestId)
      .single();
    if (requestError || !requestRow) throw databaseFailure();
    return {
      disposition: data.disposition as "accepted" | "duplicate",
      clarification,
      request: mapRequest(requestRow),
      resumeRunId: data.resume_run_id,
    };
  }

  async completeClarificationGrounding(
    record: CompleteClarificationGroundingRecord,
  ) {
    const { error } = await this.client
      .from("assessment_clarifications")
      .update({
        grounded_normalized_representation:
          record.groundedNormalizedRepresentation,
        safety_signals: record.safetySignals,
      })
      .eq("id", record.clarificationId)
      .eq("answer_status", "answered");
    if (error) throw databaseFailure();
  }

  async getInitialAuthorityForResume(
    requestId: string,
  ): Promise<PersistedInitialAuthorityV1> {
    const { data: requestRow, error: requestError } = await this.client
      .from("assessment_requests")
      .select("*")
      .eq("id", requestId)
      .single();
    if (requestError || !requestRow) throw databaseFailure();
    const { data: run, error: runError } = await this.client
      .from("assessment_runs")
      .select("*")
      .eq("request_id", requestId)
      .eq("run_kind", "initial")
      .order("started_at", { ascending: true })
      .limit(1)
      .single();
    if (runError || !run || !run.policy_result_json) throw databaseFailure();
    const { data: stages, error: stagesError } = await this.client
      .from("assessment_stage_runs")
      .select("*")
      .eq("run_id", run.id)
      .in("stage_id", ["PB-01", "PB-01C", "PB-02"]);
    if (stagesError || !stages) throw databaseFailure();
    const stage = (id: string) => stages.find((value) => value.stage_id === id);
    const pb01 = stage("PB-01");
    const pb01c = stage("PB-01C");
    const pb02 = stage("PB-02");
    if (
      !pb01?.output_json ||
      !pb01c ||
      pb01c.status === "processing" ||
      !pb02?.output_json
    ) {
      throw new M2RuntimeError("M2_INITIAL_AUTHORITY_MISSING");
    }
    return {
      request: mapRequest(requestRow),
      initialRunId: run.id,
      initialRunStartedAt: run.started_at,
      initialPolicyResult: structuredClone(run.policy_result_json),
      pb01Output: structuredClone(pb01.output_json as JsonObject),
      pb01c: {
        status: pb01c.status,
        outputJson: structuredClone(pb01c.output_json as JsonObject | null),
        errorCode: pb01c.error_code,
      },
      pb02Output: structuredClone(pb02.output_json as JsonObject),
    };
  }

  async failRun(record: FailRunRecord) {
    const { error } = await this.client.rpc("fail_assessment_run_v1", {
      p_run_id: record.runId,
      p_request_id: record.requestId,
      p_returned_model: record.returnedModel,
      p_error_code: record.errorCode,
      p_total_input_tokens: record.totalInputTokens,
      p_total_cached_tokens: record.totalCachedTokens,
      p_total_output_tokens: record.totalOutputTokens,
      p_total_reasoning_tokens: record.totalReasoningTokens,
      p_usage_derived_cost_usd: record.usageDerivedCostUsd,
      p_completed_at: record.completedAt,
    });
    if (error) throw databaseFailure();
  }

  async finalizeCompletedAssessment(record: FinalizeCompletedAssessmentRecord) {
    const { error } = await this.client.rpc("finalize_completed_assessment", {
      p_report_id: record.reportId,
      p_run_id: record.runId,
      p_request_id: record.requestId,
      p_returned_model: record.returnedModel,
      p_decision: record.decision,
      p_report_json: record.reportJson,
      p_decision_card_json: record.decisionCardJson,
      p_total_input_tokens: record.totalInputTokens,
      p_total_cached_tokens: record.totalCachedTokens,
      p_total_output_tokens: record.totalOutputTokens,
      p_total_reasoning_tokens: record.totalReasoningTokens,
      p_usage_derived_cost_usd: record.usageDerivedCostUsd,
      p_completed_at: record.completedAt,
    });
    if (error) throw databaseFailure();
  }

  async getCompletedAssessment(requestId: string) {
    const { data: originalRequest, error: requestError } = await this.client
      .from("assessment_requests")
      .select("*")
      .eq("id", requestId)
      .maybeSingle();
    if (requestError) throw databaseFailure();
    if (!originalRequest) {
      throw new M2RuntimeError("M2_PERSISTED_RESULT_INVALID");
    }
    const persistedRequest = mapRequest(originalRequest);
    if (persistedRequest.status !== "completed") {
      throw new M2RuntimeError("M2_PERSISTED_RESULT_INVALID");
    }

    const { data: run, error: runError } = await this.client
      .from("assessment_runs")
      .select("*")
      .eq("request_id", requestId)
      .eq("status", "completed")
      .eq("eligibility", "ready")
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (runError) throw databaseFailure();
    if (!run || typeof run.decision !== "string") return null;
    if (run.request_id !== requestId) {
      throw new M2RuntimeError("M2_PERSISTED_RESULT_INVALID");
    }

    const { data: report, error: reportError } = await this.client
      .from("assessment_reports")
      .select("*")
      .eq("run_id", run.id)
      .maybeSingle();
    if (reportError) throw databaseFailure();
    if (!report) throw new M2RuntimeError("M2_PERSISTED_RESULT_INVALID");

    return hydratePersistedReadyAssessmentV1({
      requestId,
      runId: run.id,
      decision: run.decision,
      reportJson: report.report_json,
      decisionCardJson: report.decision_card_json,
      authoritativeRequestedTopics: persistedRequest.requestedTopics,
      usage: {
        totalInputTokens: run.total_input_tokens,
        totalCachedTokens: run.total_cached_tokens,
        totalOutputTokens: run.total_output_tokens,
        totalReasoningTokens: run.total_reasoning_tokens,
        usageDerivedCostUsd: run.usage_derived_cost_usd,
      },
    });
  }

  async getAssessmentResult(requestId: string) {
    const { data: requestRow, error: requestError } = await this.client
      .from("assessment_requests")
      .select("*")
      .eq("id", requestId)
      .maybeSingle();
    if (requestError || !requestRow) return null;
    if (requestRow.status === "completed") {
      const ready = await this.getCompletedAssessment(requestId);
      if (ready) {
        return { ...ready, duplicate: false } as AssessmentExecutionResult;
      }
    }
    const { data: run, error: runError } = await this.client
      .from("assessment_runs")
      .select("*")
      .eq("request_id", requestId)
      .eq("status", "completed")
      .not("result_json", "is", null)
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (runError) throw databaseFailure();
    if (!run?.result_json) return null;
    const decoded = decodeAssessmentExecutionResultV2(run.result_json);
    return {
      ...decoded,
      authoritativeRequestedTopics: decodeRequestedTopics(
        requestRow.requested_topics,
      ),
    } as AssessmentExecutionResult;
  }
}

function mapClarification(row: ClarificationRow): PersistedAssessmentClarification {
  return {
    schemaVersion: row.schema_version,
    id: row.id,
    requestId: row.request_id,
    ordinal: row.ordinal,
    questionCode: row.question_code,
    target: row.target,
    questionSnapshot: row.question_snapshot,
    provenance: row.provenance,
    sourceIdentity: row.source_identity,
    answerStatus: row.answer_status,
    answer: structuredClone(row.answer),
    answerFingerprint: row.answer_fingerprint,
    groundedNormalizedRepresentation: structuredClone(
      row.grounded_normalized_representation,
    ),
    safetySignals: structuredClone(row.safety_signals),
    resumeRunId: row.resume_run_id,
    createdAt: row.created_at,
    answeredAt: row.answered_at,
  };
}
