import type { JsonObject, SplitDecisionPlanV2, SplitReportContentV2 } from "./types.ts";

export type V19L5RequestIntent = {
  message_task: "EDIT_EXISTING_MESSAGE" | "COMPOSE_NEW_MESSAGE" | "NONE";
  decision_requested: boolean;
  decision_explicitly_excluded: boolean;
  communication_purpose: "APPRECIATION" | "NATURAL_REPLY" | "FIRST_INVITATION" | "OTHER";
  evidence_fact_ids: string[];
  source_excerpt: string;
};

export type V19L5BaseIntentEnvelope = {
  schema_version: "v19-l5-base-intent-v1";
  base_intake: JsonObject;
  request_intent: V19L5RequestIntent;
};

export type V19L5Route =
  | "original_message_clarification"
  | "message_only"
  | "decision_guidance";

export type V19L5MessagePlan = {
  original_text: string;
  revised_text: string;
  meaning_preserved: boolean;
  edit_notes: string[];
  supporting_fact_ids: string[];
};

export type V19L5PlanEnvelope = {
  schema_version: "v19-l5-plan-v1";
} & (
  | {
      answer_mode: "decision_guidance";
      decision_plan: SplitDecisionPlanV2;
      message_plan: null;
    }
  | {
      answer_mode: "message_only";
      decision_plan: null;
      message_plan: V19L5MessagePlan;
    }
);

export type V19L5MessageContent = {
  opening: string;
  edit_reason: string;
  closing: string;
};

export type V19L5ReportEnvelope = {
  schema_version: "v19-l5-report-v1";
} & (
  | {
      answer_mode: "decision_guidance";
      report_content: SplitReportContentV2;
      message_content: null;
    }
  | {
      answer_mode: "message_only";
      report_content: null;
      message_content: V19L5MessageContent;
    }
);

export type V19L5OriginalMessageClarification = {
  code: "ask_original_message_v19_l5";
  target: "original_message";
  question: "整えたい文章をそのまま教えてください";
};
