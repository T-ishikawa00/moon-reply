import {
  createClient,
  type SupabaseClient,
} from "@supabase/supabase-js";
import { M2RuntimeError } from "../../assessment/runtime/errors.ts";
import type { JsonValue } from "../../assessment/runtime/types.ts";
import type {
  ActionRequiredOperatorNotification,
  DeliveryCompleteOperatorNotification,
  NewPurchaseOperatorNotification,
  OperatorActionRequiredIncidentCode,
} from "./operator-notification.ts";
import type {
  ClaimedOperatorNotification,
  OperatorNotificationRepository,
} from "./operator-notification-scheduler.ts";

type RuntimeFunction = {
  Args: Record<string, unknown>;
  Returns: JsonValue;
};

type OperatorNotificationDatabase = {
  public: {
    Tables: { [_ in never]: never };
    Views: { [_ in never]: never };
    Functions: {
      claim_production_operator_notification_batch_v1: RuntimeFunction;
      claim_production_operator_notification_batch_v2: RuntimeFunction;
      begin_production_operator_notification_send_v1: RuntimeFunction;
      begin_production_operator_notification_send_v2: RuntimeFunction;
      complete_production_operator_notification_v1: RuntimeFunction;
      finish_production_operator_notification_v1: RuntimeFunction;
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};

function databaseFailure(): never {
  throw new M2RuntimeError(
    "OPERATOR_NOTIFICATION_DATABASE_OPERATION_FAILED",
    503,
  );
}

function recordValue(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    databaseFailure();
  }
  return value as Record<string, unknown>;
}

function stringValue(value: unknown) {
  if (typeof value !== "string" || value.length === 0) databaseFailure();
  return value;
}

function numberValue(value: unknown) {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0) {
    databaseFailure();
  }
  return value;
}

function paymentFacts(row: Record<string, unknown>): Readonly<{
  purchaseIntentId: string;
  paymentState: "verified" | "manual_review";
  amount: 980;
  currency: "jpy";
  eventOccurredAt: string;
}> {
  const paymentState = row.payment_state;
  if (
    (paymentState !== "verified" && paymentState !== "manual_review") ||
    row.amount !== 980 ||
    row.currency !== "jpy"
  ) {
    databaseFailure();
  }
  return {
    purchaseIntentId: stringValue(row.purchase_intent_id),
    paymentState,
    amount: 980 as const,
    currency: "jpy" as const,
    eventOccurredAt: stringValue(row.event_occurred_at),
  };
}

function mapClaim(value: unknown): ClaimedOperatorNotification {
  const row = recordValue(value);
  const notificationId = stringValue(row.notification_id);
  if (row.notification_type === "action_required" && row.incident_code === "payment_reconciliation_stopped") {
    if (row.payment_state !== "unverified" || row.amount !== 980 || row.currency !== "jpy" ||
        row.delivery_state !== "unknown" || row.fulfillment_state !== "not_authorized") databaseFailure();
    return { notificationId, notification: {
      notificationType: "action_required", incidentCode: "payment_reconciliation_stopped",
      purchaseIntentId: stringValue(row.purchase_intent_id), paymentState: "unverified",
      amount: 980, currency: "jpy", deliveryState: "unknown", fulfillmentState: "not_authorized",
      eventOccurredAt: stringValue(row.event_occurred_at), elapsedSeconds: numberValue(row.elapsed_seconds),
    } };
  }
  const facts = paymentFacts(row);

  if (row.notification_type === "new_purchase") {
    if (facts.paymentState !== "verified") databaseFailure();
    const notification: NewPurchaseOperatorNotification = {
      notificationType: "new_purchase",
      ...facts,
      paymentState: "verified",
    };
    return { notificationId, notification };
  }

  if (row.notification_type === "delivery_complete") {
    if (
      facts.paymentState !== "verified" ||
      row.delivery_state !== "complete"
    ) {
      databaseFailure();
    }
    const notification: DeliveryCompleteOperatorNotification = {
      notificationType: "delivery_complete",
      ...facts,
      paymentState: "verified",
      deliveryState: "complete",
      elapsedSeconds: numberValue(row.elapsed_seconds),
    };
    return { notificationId, notification };
  }

  if (row.notification_type !== "action_required") databaseFailure();
  const incidentCode = row.incident_code;
  if (
    incidentCode !== "delivery_pending_15m" &&
    incidentCode !== "manual_review" &&
    incidentCode !== "payment_fulfillment_retry_exhausted"
  ) {
    databaseFailure();
  }
  const deliveryState = row.delivery_state;
  if (deliveryState !== "pending" && deliveryState !== "complete") {
    databaseFailure();
  }
  const fulfillmentState = row.fulfillment_state;
  if (
    fulfillmentState !== "pending" &&
    fulfillmentState !== "processing" &&
    fulfillmentState !== "retryable" &&
    fulfillmentState !== "manual_review" &&
    fulfillmentState !== "retry_exhausted"
  ) {
    databaseFailure();
  }
  const notification: ActionRequiredOperatorNotification = {
    notificationType: "action_required",
    ...facts,
    incidentCode: incidentCode as Exclude<OperatorActionRequiredIncidentCode, "payment_reconciliation_stopped">,
    deliveryState,
    fulfillmentState,
    elapsedSeconds: numberValue(row.elapsed_seconds),
  };
  return { notificationId, notification };
}

export class SupabaseOperatorNotificationRepository
  implements OperatorNotificationRepository
{
  private readonly client: SupabaseClient<OperatorNotificationDatabase>;

  constructor(url: string, secretKey: string) {
    this.client = createClient<OperatorNotificationDatabase>(url, secretKey, {
      auth: {
        autoRefreshToken: false,
        detectSessionInUrl: false,
        persistSession: false,
      },
    });
  }

  async claimBatch(input: Parameters<OperatorNotificationRepository["claimBatch"]>[0]) {
    const { data, error } = await this.client.rpc(
      "claim_production_operator_notification_batch_v2",
      {
        p_owner_id: input.ownerId,
        p_environment: input.environment,
        p_active_from: input.activeFrom,
        p_now: input.now,
        p_lease_expires_at: input.leaseExpiresAt,
        p_limit: input.limit,
      },
    );
    if (error || !Array.isArray(data)) databaseFailure();
    return data.map(mapClaim);
  }

  async beginSend(input: Parameters<OperatorNotificationRepository["beginSend"]>[0]) {
    const { data, error } = await this.client.rpc(
      "begin_production_operator_notification_send_v2",
      {
        p_notification_id: input.notificationId,
        p_owner_id: input.ownerId,
        p_now: input.now,
      },
    );
    if (error) databaseFailure();
    const disposition = recordValue(data).disposition;
    if (disposition !== "ready" && disposition !== "superseded") {
      databaseFailure();
    }
    return disposition;
  }

  async complete(input: Parameters<OperatorNotificationRepository["complete"]>[0]) {
    const { error } = await this.client.rpc(
      "complete_production_operator_notification_v1",
      {
        p_notification_id: input.notificationId,
        p_owner_id: input.ownerId,
        p_provider_message_reference: input.providerMessageReference,
        p_now: input.now,
      },
    );
    if (error) databaseFailure();
  }

  async finish(input: Parameters<OperatorNotificationRepository["finish"]>[0]) {
    const retryAfter =
      input.outcome === "retryable" && input.retryAfterSeconds !== undefined
        ? new Date(
            Date.parse(input.now) + input.retryAfterSeconds * 1_000,
          ).toISOString()
        : null;
    const { error } = await this.client.rpc(
      "finish_production_operator_notification_v1",
      {
        p_notification_id: input.notificationId,
        p_owner_id: input.ownerId,
        p_outcome: input.outcome,
        p_retry_after: retryAfter,
        p_error_code: input.errorCode,
        p_now: input.now,
      },
    );
    if (error) databaseFailure();
  }
}
