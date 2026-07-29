import "server-only";
import {
  createClient,
  type SupabaseClient,
} from "@supabase/supabase-js";
import { M2RuntimeError } from "./errors.ts";
import type {
  AssessmentRepository,
  CompleteRunRecord,
  CompleteStageRecord,
  CompletedAssessment,
  CreateRequestRecord,
  CreateRunRecord,
  FailRunRecord,
  FailStageRecord,
  PersistedAssessmentRequest,
  RelationshipValue,
  RequestedTopic,
  SaveReportRecord,
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
  status: "processing" | "completed" | "failed";
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
};

type StageRunRow = {
  id: string;
  run_id: string;
  stage_id: string;
  sequence_number: number;
  status: "processing" | "completed" | "failed";
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
  created_at: string;
};

type ReportRow = {
  id: string;
  run_id: string;
  report_json: unknown;
  decision_card_json: unknown;
  created_at: string;
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
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
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

function mapRequest(row: RequestRow): PersistedAssessmentRequest {
  return {
    id: row.id,
    idempotencyKey: row.idempotency_key,
    source: "internal_review_runtime",
    currentSituation: row.raw_situation,
    optionalMessage: row.optional_message,
    relationship: row.relationship,
    requestedTopics: row.requested_topics,
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
    if (error || !data) throw databaseFailure();
    return mapRequest(data as RequestRow);
  }

  async findByIdempotencyKey(idempotencyKey: string) {
    const { data, error } = await this.client
      .from("assessment_requests")
      .select("*")
      .eq("idempotency_key", idempotencyKey)
      .maybeSingle();
    if (error) throw databaseFailure();
    return data ? mapRequest(data as RequestRow) : null;
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
    });
    if (error) throw databaseFailure();
  }

  async startStage(record: StartStageRecord) {
    const { error } = await this.client.from("assessment_stage_runs").insert({
      id: record.id,
      run_id: record.runId,
      stage_id: record.stageId,
      sequence_number: record.sequenceNumber,
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

  async completeRun(record: CompleteRunRecord) {
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
      .eq("id", record.runId);
    if (runError) throw databaseFailure();
    const { error: requestError } = await this.client
      .from("assessment_requests")
      .update({
        status: "completed",
        updated_at: record.completedAt,
      })
      .eq("id", record.requestId);
    if (requestError) throw databaseFailure();
  }

  async failRun(record: FailRunRecord) {
    const { error: runError } = await this.client
      .from("assessment_runs")
      .update({
        status: "failed",
        returned_model: record.returnedModel,
        total_input_tokens: record.totalInputTokens,
        total_cached_tokens: record.totalCachedTokens,
        total_output_tokens: record.totalOutputTokens,
        total_reasoning_tokens: record.totalReasoningTokens,
        usage_derived_cost_usd: record.usageDerivedCostUsd,
        completed_at: record.completedAt,
        error_code: record.errorCode,
      })
      .eq("id", record.runId);
    if (runError) throw databaseFailure();
    const { error: requestError } = await this.client
      .from("assessment_requests")
      .update({
        status: "failed",
        updated_at: record.completedAt,
      })
      .eq("id", record.requestId);
    if (requestError) throw databaseFailure();
  }

  async saveReport(record: SaveReportRecord) {
    const { error } = await this.client.from("assessment_reports").insert({
      id: record.id,
      run_id: record.runId,
      report_json: record.reportJson,
      decision_card_json: record.decisionCardJson,
      created_at: record.createdAt,
    });
    if (error) throw databaseFailure();
  }

  async getCompletedAssessment(requestId: string) {
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

    const { data: report, error: reportError } = await this.client
      .from("assessment_reports")
      .select("*")
      .eq("run_id", run.id)
      .maybeSingle();
    if (reportError) throw databaseFailure();
    if (!report) return null;

    return {
      requestId,
      runId: run.id,
      eligibility: "ready",
      decision: run.decision,
      report: report.report_json,
      decisionCard: report.decision_card_json,
      usage: {
        totalInputTokens: Number(run.total_input_tokens),
        totalCachedTokens: Number(run.total_cached_tokens),
        totalOutputTokens: Number(run.total_output_tokens),
        totalReasoningTokens: Number(run.total_reasoning_tokens),
        usageDerivedCostUsd: Number(run.usage_derived_cost_usd),
      },
    } as CompletedAssessment;
  }
}
