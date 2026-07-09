export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type Timestamp = string;
type Uuid = string;

type Stage3Table<Row extends Record<string, unknown>> = {
  Row: Row;
  Insert: Partial<Row>;
  Update: Partial<Row>;
  Relationships: [];
};

export type ReadingRequestStatus =
  | "draft"
  | "submitted"
  | "safety_rejected"
  | "payment_pending"
  | "paid"
  | "generating"
  | "completed"
  | "failed"
  | "refunded";

export type SafetyCheckResult = "normal_allowed" | "needs_review" | "rejected";

export type ReadingGenerationStatus =
  | "pending"
  | "generated"
  | "failed"
  | "blocked";

export type PurchaseStatus =
  | "pending"
  | "paid"
  | "failed"
  | "refunded"
  | "revoked";

export type EntitlementStatus = "active" | "suspended" | "revoked";

export type CreditLedgerReason =
  | "purchase_grant"
  | "reading_consumed"
  | "generation_failed_compensation"
  | "refund_reversal"
  | "admin_adjustment";

export type ProviderEventProcessingStatus =
  | "received"
  | "processed"
  | "duplicate"
  | "failed";

export type AiGenerationType = "safety_assist" | "judgment" | "full_reading";

export type AiGenerationStatus =
  | "started"
  | "completed"
  | "failed"
  | "blocked";

export type EmailDeliveryStatus = "pending" | "sent" | "failed";

export type ReadingRequestRow = {
  id: Uuid;
  request_token: string;
  email: string;
  nickname: string;
  age_range: string;
  relationship_type: string;
  relationship_status: string[];
  last_partner_message: string | null;
  last_user_message: string | null;
  intended_message: string;
  reply_wait_duration: string;
  recent_context: string;
  main_anxiety: string;
  desired_outcome: string;
  main_question: string;
  send_tonight: string;
  consent_ai: boolean;
  consent_not_medical: boolean;
  consent_no_guarantee: boolean;
  consent_privacy: boolean;
  status: ReadingRequestStatus;
  created_at: Timestamp;
  updated_at: Timestamp;
};

export type SafetyCheckRow = {
  id: Uuid;
  reading_request_id: Uuid;
  self_harm_flag: boolean;
  harm_others_flag: boolean;
  dv_abuse_flag: boolean;
  stalking_flag: boolean;
  threat_flag: boolean;
  minor_flag: boolean;
  surveillance_flag: boolean;
  doxxing_flag: boolean;
  result: SafetyCheckResult;
  reason: string | null;
  created_at: Timestamp;
};

export type ReadingRow = {
  id: Uuid;
  reading_request_id: Uuid;
  result_token: string;
  judgment_label: string | null;
  full_reading_markdown: string | null;
  saveable_card_copy: string | null;
  send_message_suggestion: string | null;
  three_day_policy: string | null;
  emotional_tags: string[];
  generation_status: ReadingGenerationStatus;
  created_at: Timestamp;
  updated_at: Timestamp;
};

export type PurchaseRow = {
  id: Uuid;
  reading_request_id: Uuid | null;
  provider: string;
  provider_purchase_id: string | null;
  provider_customer_id: string | null;
  amount_jpy: number;
  currency: string;
  product_type: string;
  product_code: string;
  status: PurchaseStatus;
  purchased_at: Timestamp | null;
  refunded_at: Timestamp | null;
  revoked_at: Timestamp | null;
  created_at: Timestamp;
  updated_at: Timestamp;
};

export type EntitlementRow = {
  id: Uuid;
  email: string;
  available_credits: number;
  active_plan: string | null;
  status: EntitlementStatus;
  last_credit_ledger_id: Uuid | null;
  created_at: Timestamp;
  updated_at: Timestamp;
};

export type CreditLedgerRow = {
  id: Uuid;
  entitlement_id: Uuid | null;
  reading_request_id: Uuid | null;
  purchase_id: Uuid | null;
  reason: CreditLedgerReason;
  delta: number;
  balance_after: number;
  idempotency_key: string;
  created_at: Timestamp;
};

export type ProviderEventRow = {
  id: Uuid;
  provider: string;
  provider_event_id: string;
  event_type: string;
  related_purchase_id: Uuid | null;
  related_reading_request_id: Uuid | null;
  processing_status: ProviderEventProcessingStatus;
  payload_json: Json | null;
  error_message: string | null;
  received_at: Timestamp;
  processed_at: Timestamp | null;
  created_at: Timestamp;
};

export type AiGenerationLogRow = {
  id: Uuid;
  reading_request_id: Uuid | null;
  reading_id: Uuid | null;
  generation_type: AiGenerationType;
  model: string | null;
  prompt_version: string | null;
  input_tokens: number | null;
  output_tokens: number | null;
  estimated_cost_jpy: number | null;
  status: AiGenerationStatus;
  error_message: string | null;
  created_at: Timestamp;
};

export type EmailDeliveryRow = {
  id: Uuid;
  reading_id: Uuid | null;
  recipient_email: string;
  subject: string;
  status: EmailDeliveryStatus;
  provider_message_id: string | null;
  sent_at: Timestamp | null;
  error_message: string | null;
  created_at: Timestamp;
};

export type FeedbackRow = {
  id: Uuid;
  reading_id: Uuid | null;
  satisfaction_score: number | null;
  judgment_agreement_score: number | null;
  save_intent: boolean | null;
  repeat_intent: boolean | null;
  price_value: string | null;
  chatgpt_enough: boolean | null;
  free_comment: string | null;
  created_at: Timestamp;
};

export type Database = {
  public: {
    Tables: {
      reading_requests: Stage3Table<ReadingRequestRow>;
      safety_checks: Stage3Table<SafetyCheckRow>;
      readings: Stage3Table<ReadingRow>;
      purchases: Stage3Table<PurchaseRow>;
      entitlements: Stage3Table<EntitlementRow>;
      credit_ledger: Stage3Table<CreditLedgerRow>;
      provider_events: Stage3Table<ProviderEventRow>;
      ai_generation_logs: Stage3Table<AiGenerationLogRow>;
      email_deliveries: Stage3Table<EmailDeliveryRow>;
      feedback: Stage3Table<FeedbackRow>;
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
