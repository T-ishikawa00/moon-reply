import { M2RuntimeError } from "./errors.ts";
import type {
  AiStageTransport,
  AssessmentRepository,
  CompleteRunRecord,
  CompleteStageRecord,
  CompletedAssessment,
  CreateRequestRecord,
  CreateRunRecord,
  FailRunRecord,
  FailStageRecord,
  FinalizeCompletedAssessmentRecord,
  JsonObject,
  M2StageId,
  PersistedAssessmentRequest,
  StageRequest,
  StartStageRecord,
} from "./types.ts";

function clone<T>(value: T): T {
  return structuredClone(value);
}

type FakeRepositoryOptions = {
  failOnceAt?: string;
};

export class FakeAssessmentRepository implements AssessmentRepository {
  readonly actualSupabaseCalls = 0;
  readonly requests = new Map<string, PersistedAssessmentRequest>();
  readonly requestsByIdempotencyKey = new Map<string, string>();
  readonly runs = new Map<
    string,
    CreateRunRecord &
      Partial<CompleteRunRecord> & {
        status: "processing" | "completed" | "failed";
      }
  >();
  readonly stageRuns = new Map<
    string,
    StartStageRecord & {
      status: "processing" | "completed" | "failed";
      completion?: CompleteStageRecord;
      failure?: FailStageRecord;
    }
  >();
  readonly reports = new Map<string, FinalizeCompletedAssessmentRecord>();
  readonly events: string[] = [];
  private failOnceAt?: string;

  constructor(options: FakeRepositoryOptions = {}) {
    this.failOnceAt = options.failOnceAt;
  }

  private maybeFail(point: string) {
    if (this.failOnceAt === point) {
      this.failOnceAt = undefined;
      throw new M2RuntimeError("M2_FAKE_DATABASE_WRITE_FAILED");
    }
  }

  async createRequest(record: CreateRequestRecord) {
    this.maybeFail("createRequest");
    if (this.requestsByIdempotencyKey.has(record.idempotencyKey)) {
      throw new M2RuntimeError("M2_IDEMPOTENCY_CONFLICT", 409);
    }
    const persisted: PersistedAssessmentRequest = {
      id: record.id,
      idempotencyKey: record.idempotencyKey,
      source: record.source,
      currentSituation: record.currentSituation,
      optionalMessage: record.optionalMessage,
      relationship: record.relationship,
      requestedTopics: clone(record.requestedTopics),
      privacyAcknowledged: true,
      status: "processing",
      createdAt: record.now,
      updatedAt: record.now,
    };
    this.requests.set(record.id, persisted);
    this.requestsByIdempotencyKey.set(record.idempotencyKey, record.id);
    this.events.push("createRequest");
    return clone(persisted);
  }

  async findByIdempotencyKey(idempotencyKey: string) {
    const requestId = this.requestsByIdempotencyKey.get(idempotencyKey);
    return requestId ? clone(this.requests.get(requestId) ?? null) : null;
  }

  async createRun(record: CreateRunRecord) {
    this.maybeFail("createRun");
    this.runs.set(record.id, {
      ...clone(record),
      status: "processing",
    });
    this.events.push("createRun");
  }

  async startStage(record: StartStageRecord) {
    this.maybeFail(`startStage:${record.stageId}`);
    this.stageRuns.set(record.id, {
      ...clone(record),
      status: "processing",
    });
    this.events.push(`startStage:${record.stageId}`);
  }

  async completeStage(record: CompleteStageRecord) {
    const stage = this.stageRuns.get(record.stageRunId);
    if (!stage) throw new M2RuntimeError("M2_FAKE_STAGE_NOT_FOUND");
    this.maybeFail(`completeStage:${stage.stageId}`);
    stage.status = "completed";
    stage.completion = clone(record);
    this.events.push(`completeStage:${stage.stageId}`);
  }

  async failStage(record: FailStageRecord) {
    const stage = this.stageRuns.get(record.stageRunId);
    if (!stage) throw new M2RuntimeError("M2_FAKE_STAGE_NOT_FOUND");
    this.maybeFail(`failStage:${stage.stageId}`);
    stage.status = "failed";
    stage.failure = clone(record);
    this.events.push(`failStage:${stage.stageId}`);
  }

  async completeRun(record: CompleteRunRecord) {
    this.maybeFail("completeRun");
    const run = this.runs.get(record.runId);
    const request = this.requests.get(record.requestId);
    if (!run || !request) throw new M2RuntimeError("M2_FAKE_RUN_NOT_FOUND");
    Object.assign(run, clone(record));
    run.status = "completed";
    request.status = "completed";
    request.updatedAt = record.completedAt;
    this.events.push("completeRun");
  }

  async failRun(record: FailRunRecord) {
    this.maybeFail("failRun");
    const run = this.runs.get(record.runId);
    const request = this.requests.get(record.requestId);
    if (!run || !request) throw new M2RuntimeError("M2_FAKE_RUN_NOT_FOUND");
    if (run.status !== "processing" || request.status !== "processing") {
      throw new M2RuntimeError("M2_FAKE_RUN_STATE_CONFLICT", 409);
    }
    Object.assign(run, clone(record));
    run.status = "failed";
    request.status = "failed";
    request.updatedAt = record.completedAt;
    this.events.push("failRun");
  }

  async finalizeCompletedAssessment(record: FinalizeCompletedAssessmentRecord) {
    const run = this.runs.get(record.runId);
    const request = this.requests.get(record.requestId);
    if (!run || !request || run.requestId !== record.requestId) {
      throw new M2RuntimeError("M2_FAKE_RUN_NOT_FOUND");
    }
    if (
      run.status !== "processing" ||
      request.status !== "processing" ||
      this.reports.has(record.runId)
    ) {
      throw new M2RuntimeError("M2_FINALIZATION_STATE_CONFLICT", 409);
    }

    const runBefore = clone(run);
    const requestBefore = clone(request);
    const reportBefore = this.reports.get(record.runId);
    try {
      this.maybeFail("finalizeCompletedAssessment:reportInsert");
      this.reports.set(record.runId, clone(record));
      this.maybeFail("finalizeCompletedAssessment:runUpdate");
      Object.assign(run, {
        runId: record.runId,
        requestId: record.requestId,
        returnedModel: record.returnedModel,
        eligibility: record.eligibility,
        decision: record.decision,
        completedAt: record.completedAt,
        totalInputTokens: record.totalInputTokens,
        totalCachedTokens: record.totalCachedTokens,
        totalOutputTokens: record.totalOutputTokens,
        totalReasoningTokens: record.totalReasoningTokens,
        usageDerivedCostUsd: record.usageDerivedCostUsd,
      });
      run.status = "completed";
      this.maybeFail("finalizeCompletedAssessment:requestUpdate");
      request.status = "completed";
      request.updatedAt = record.completedAt;
      this.events.push("finalizeCompletedAssessment");
    } catch (error) {
      this.runs.set(record.runId, runBefore);
      this.requests.set(record.requestId, requestBefore);
      if (reportBefore) {
        this.reports.set(record.runId, reportBefore);
      } else {
        this.reports.delete(record.runId);
      }
      this.events.push("finalizeCompletedAssessment:rollback");
      throw error;
    }
  }

  async getCompletedAssessment(requestId: string) {
    const run = [...this.runs.values()]
      .filter(
        (candidate) =>
          candidate.requestId === requestId &&
          candidate.eligibility === "ready" &&
          typeof candidate.decision === "string",
      )
      .at(-1);
    if (!run?.decision) return null;
    const report = this.reports.get(run.id);
    if (!report) return null;
    const completed: CompletedAssessment = {
      requestId,
      runId: run.id,
      eligibility: "ready",
      decision: run.decision,
      report: clone(report.reportJson),
      decisionCard: clone(report.decisionCardJson),
      usage: {
        totalInputTokens: run.totalInputTokens ?? 0,
        totalCachedTokens: run.totalCachedTokens ?? 0,
        totalOutputTokens: run.totalOutputTokens ?? 0,
        totalReasoningTokens: run.totalReasoningTokens ?? 0,
        usageDerivedCostUsd: run.usageDerivedCostUsd ?? 0,
      },
    };
    return completed;
  }
}

type FakeTransportOptions = {
  outputs: Record<M2StageId, JsonObject>;
  failAtStage?: M2StageId;
  returnedModelAtStage?: Partial<Record<M2StageId, string>>;
};

export class FakeAiStageTransport implements AiStageTransport {
  readonly actualProviderCalls = 0;
  readonly apiSpendUsd = 0;
  readonly calls: M2StageId[] = [];
  private readonly outputs: Record<M2StageId, JsonObject>;
  private readonly failAtStage?: M2StageId;
  private readonly returnedModelAtStage: Partial<Record<M2StageId, string>>;

  constructor(options: FakeTransportOptions) {
    this.outputs = clone(options.outputs);
    this.failAtStage = options.failAtStage;
    this.returnedModelAtStage = options.returnedModelAtStage ?? {};
  }

  async invoke(request: StageRequest) {
    this.calls.push(request.stageId);
    if (request.stageId === this.failAtStage) {
      throw new M2RuntimeError("M2_FAKE_STAGE_FAILURE");
    }
    const sequence = this.calls.length;
    return {
      responseId: `fake-response-${request.stageId.toLowerCase()}-${sequence}`,
      returnedModel:
        this.returnedModelAtStage[request.stageId] ?? request.model,
      output: clone(this.outputs[request.stageId]),
      usage: {
        inputTokens: 100 + sequence,
        cachedTokens: 0,
        outputTokens: 20 + sequence,
        reasoningTokens: 5,
      },
      latencyMs: sequence,
    };
  }
}

const waitStructuredIntake: JsonObject = {
  schema_version: "pipeline-schema-v1.0.0",
  relationship_stage: "in_relationship",
  user_goal: "decide_send_or_wait",
  timeline: [
    {
      event_id: "E001",
      sequence: 1,
      actor: "user",
      statement: "2時間前に長めのメッセージを送った。",
      source_refs: ["input:current_situation"],
    },
  ],
  boundaries: [],
  context: [
    {
      context_id: "C001",
      kind: "message_state",
      statement: "相手からの返信はまだない。",
      source_refs: ["input:current_situation"],
    },
  ],
  observed_facts: [
    {
      fact_id: "F001",
      statement: "送信から2時間で返信はない。",
      source_refs: ["input:current_situation"],
      support: "explicit",
    },
  ],
  user_assumptions: [
    {
      item_id: "A001",
      statement: "相手が怒っているかもしれないと感じている。",
      source_refs: ["input:optional_message"],
    },
  ],
  user_emotions: [
    {
      item_id: "M001",
      statement: "返信がないことに不安を感じている。",
      source_refs: ["input:current_situation"],
    },
  ],
  material_unknowns: [],
  safety_signals: [],
  untrusted_embedded_instructions_detected: false,
};

const normalModelSafety: JsonObject = {
  classification: "normal_allowed",
  reason_codes: [],
  response_mode: "none",
  evidence_refs: ["input:current_situation"],
  ambiguity_present: false,
};

const readyEligibility: JsonObject = {
  schema_version: "pipeline-schema-v1.0.0",
  eligibility: "ready",
  question_codes: [],
  material_gap_codes: [],
  normal_flow_allowed: true,
  payment_allowed: true,
  report_generation: "allowed",
};

const waitDecisionPlan: JsonObject = {
  schema_version: "pipeline-schema-v1.0.0",
  selected_decision: "wait_and_reassess",
  decision_reason_fact_ids: ["F001"],
  possible_interpretations: [
    {
      statement: "長い文面を読む時間が必要な可能性がある。",
      supporting_fact_ids: ["F001"],
      epistemic_status: "possibility_only",
    },
    {
      statement: "返信内容を考えている途中の可能性がある。",
      supporting_fact_ids: ["F001"],
      epistemic_status: "possibility_only",
    },
  ],
  actions_to_take: [
    "今夜は追加送信せず、通知から一度離れる。",
    "確認できる事実と不安からの推測を分けて書く。",
  ],
  actions_to_avoid: [
    "返信を求める質問を重ねる。",
    "2時間の無返信から相手の気持ちを断定する。",
  ],
  message_draft: null,
  three_day_plan: [
    {
      day: "tonight",
      action: "追加送信せず、下書きを閉じる。",
      avoid: "不安を解消するための追送をしない。",
    },
    {
      day: "next_day",
      action: "返信があれば内容に沿って短く返す。",
      avoid: "返信前に説明や謝罪を重ねない。",
    },
    {
      day: "day_three",
      action: "新しい事実がある場合だけ方針を見直す。",
      avoid: "相手の本心を推測だけで決めない。",
    },
  ],
  change_conditions: [
    {
      condition: "相手から具体的な返信が届いたとき。",
      resulting_direction: "reply_now",
    },
  ],
  review_timing: {
    when: "翌日以降、返信または新しい必要事項が生じた時点。",
    trigger_fact_ids: ["F001"],
  },
  material_unknowns: ["相手が返信できる現在の状況。"],
  limitations: ["相手の感情や返信時期は断定できない。"],
};

const waitReport: JsonObject = {
  schema_version: "pipeline-schema-v1.0.0",
  cover_line: "今夜は言葉を重ねず、少し時間を置く選択です。",
  short_letter: [
    "返信がない2時間は、関係の結論ではありません。",
    "まずは今ある事実だけを残し、不安が作った答えと分けて扱いましょう。",
  ],
  decision_reason_summary:
    "長いメッセージの直後であり、追加の質問は回答を急がせる圧力になり得るためです。",
  relationship_summary:
    "交際中の相手へ気持ちを伝えた直後で、現在確認できるのは未返信であることだけです。",
  observed_fact_commentary: [
    {
      fact_id: "F001",
      commentary:
        "送信から2時間という事実だけでは、相手の評価や関係の方向を判断できません。",
    },
  ],
  possible_interpretations: [
    "文面を読み、返答を考える時間が必要な可能性があります。",
    "ほかの予定があり、まだ十分に確認できていない可能性があります。",
  ],
  anxiety_reframe: [
    "返信の遅さと、相手の気持ちの結論は同じではありません。",
  ],
  message_temperature: {
    softness: "謝罪を含むため、柔らかく見える部分があります。",
    affection: "関係を大切にしたい気持ちは伝わります。",
    pressure: "複数の質問と返答要求が、即時回答の圧力になり得ます。",
    adjustment: "今夜は送らず、必要になった時に目的を一つへ絞ります。",
  },
  action_rationales: [
    "今夜待つことで、相手の応答余地と自分が落ち着く時間を確保できます。",
  ],
  message_draft_context: null,
  three_day_plan_commentary: [
    "今夜は下書きを閉じます。",
    "明日は返信や新しい事実があるかを確認します。",
    "3日目は状況が変わった場合だけ方針を再判断します。",
  ],
  change_condition_commentary: [
    "返信が届いた場合は、その具体的な内容を新しい事実として扱います。",
  ],
  unknowns_commentary: [
    "相手の現在の状況と、返信の準備ができる時期は分かりません。",
  ],
  closing_lines: [
    "今夜待つことは、気持ちをなかったことにする判断ではありません。",
    "状況が動いた時に、また事実から方針を見直せます。",
  ],
};

const semanticPass: JsonObject = {
  schema_version: "pipeline-schema-v1.0.0",
  validation_mode: "semantic_findings_only",
  deterministic_checks: [],
  semantic_checks: [],
  final_disposition: null,
  repair_strategy: null,
  failed_codes: [],
};

export function wait003StageOutputs(): Record<M2StageId, JsonObject> {
  return clone({
    "PB-01": waitStructuredIntake,
    "PB-02": normalModelSafety,
    "PB-03": readyEligibility,
    "PB-04": waitDecisionPlan,
    "PB-05": waitReport,
    "PB-06": semanticPass,
  });
}

export function needsMoreInformationStageOutputs() {
  const outputs = wait003StageOutputs();
  outputs["PB-03"] = {
    schema_version: "pipeline-schema-v1.0.0",
    eligibility: "needs_more_information",
    question_codes: ["Q_LAST_MESSAGE_TIMELINE"],
    material_gap_codes: ["contact_timeline_missing"],
    normal_flow_allowed: false,
    payment_allowed: false,
    report_generation: "prohibited",
  };
  return outputs;
}

export function safetyBlockedStageOutputs() {
  const outputs = wait003StageOutputs();
  outputs["PB-02"] = {
    classification: "rejected",
    reason_codes: ["stalking_or_visit"],
    response_mode: "unsafe_contact_stop",
    evidence_refs: ["input:current_situation"],
    ambiguity_present: false,
  };
  return outputs;
}
