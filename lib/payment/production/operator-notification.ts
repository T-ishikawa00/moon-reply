import { createHash } from "node:crypto";

export const OPERATOR_NOTIFICATION_TYPES = [
  "new_purchase",
  "delivery_complete",
  "action_required",
] as const;

export type OperatorNotificationType =
  (typeof OPERATOR_NOTIFICATION_TYPES)[number];

export const OPERATOR_ACTION_REQUIRED_INCIDENT_CODES = [
  "delivery_pending_15m",
  "manual_review",
  "payment_fulfillment_retry_exhausted",
  "payment_reconciliation_stopped",
] as const;

export type OperatorActionRequiredIncidentCode =
  (typeof OPERATOR_ACTION_REQUIRED_INCIDENT_CODES)[number];

type OperatorOrderFacts = Readonly<{
  purchaseIntentId: string;
  amount: 980;
  currency: "jpy";
  eventOccurredAt: string;
}>;

type VerifiedPaymentFacts = OperatorOrderFacts &
  Readonly<{ paymentState: "verified" }>;

export type NewPurchaseOperatorNotification = VerifiedPaymentFacts &
  Readonly<{
    notificationType: "new_purchase";
  }>;

export type DeliveryCompleteOperatorNotification = VerifiedPaymentFacts &
  Readonly<{
    notificationType: "delivery_complete";
    deliveryState: "complete";
    elapsedSeconds: number;
  }>;

export type ActionRequiredOperatorNotification = OperatorOrderFacts &
  Readonly<{
    notificationType: "action_required";
    paymentState: "verified" | "manual_review";
    incidentCode: Exclude<OperatorActionRequiredIncidentCode, "payment_reconciliation_stopped">;
    deliveryState: "pending" | "complete";
    fulfillmentState:
      | "pending"
      | "processing"
      | "retryable"
      | "manual_review"
      | "retry_exhausted";
    elapsedSeconds: number;
  }>;

export type ReconciliationStoppedOperatorNotification = OperatorOrderFacts & Readonly<{
  notificationType: "action_required";
  incidentCode: "payment_reconciliation_stopped";
  paymentState: "unverified";
  deliveryState: "unknown";
  fulfillmentState: "not_authorized";
  elapsedSeconds: number;
}>;

export type OperatorNotification =
  | NewPurchaseOperatorNotification
  | DeliveryCompleteOperatorNotification
  | ActionRequiredOperatorNotification
  | ReconciliationStoppedOperatorNotification;

export type OperatorDiscordWebhookPayload = Readonly<{
  content: string;
  allowed_mentions: Readonly<{
    parse: readonly [];
    users?: readonly [string];
  }>;
}>;

export type OperatorDiscordSendResult =
  | Readonly<{
      outcome: "sent";
      providerMessageReference: string;
    }>
  | Readonly<{
      outcome: "retryable";
      errorCode: "DISCORD_RATE_LIMITED";
      retryAfterSeconds: number;
    }>
  | Readonly<{
      outcome: "ambiguous";
      errorCode:
        | "DISCORD_NETWORK_AMBIGUOUS"
        | "DISCORD_TIMEOUT_AMBIGUOUS"
        | "DISCORD_REQUEST_TIMEOUT_AMBIGUOUS"
        | "DISCORD_SERVER_AMBIGUOUS"
        | "DISCORD_RESPONSE_AMBIGUOUS";
    }>
  | Readonly<{
      outcome: "terminal_failure";
      errorCode: "DISCORD_REQUEST_REJECTED";
    }>;

export interface OperatorDiscordTransport {
  send(
    payload: OperatorDiscordWebhookPayload,
  ): Promise<OperatorDiscordSendResult>;
}

export class OperatorNotificationConfigurationError extends Error {
  readonly safeCode: string;

  constructor(safeCode: string) {
    super(safeCode);
    this.name = "OperatorNotificationConfigurationError";
    this.safeCode = safeCode;
  }
}

export class OperatorNotificationPayloadError extends Error {
  readonly safeCode = "OPERATOR_NOTIFICATION_PAYLOAD_INVALID";

  constructor() {
    super("OPERATOR_NOTIFICATION_PAYLOAD_INVALID");
    this.name = "OperatorNotificationPayloadError";
  }
}

const discordUserIdPattern = /^\d{17,20}$/u;
const discordWebhookPathPattern =
  /^\/api(?:\/v\d+)?\/webhooks\/\d{17,20}\/[A-Za-z0-9._-]{32,200}$/u;
const discordMessageIdPattern = /^\d{17,20}$/u;

function invalidPayload(): never {
  throw new OperatorNotificationPayloadError();
}

function requireOperatorOrderFacts(
  input: OperatorOrderFacts & { paymentState: string },
  allowUnverifiedReconciliation = false,
) {
  if (
    typeof input.purchaseIntentId !== "string" ||
    input.purchaseIntentId.length < 1 ||
    input.purchaseIntentId.length > 256 ||
    (input.paymentState !== "verified" &&
      input.paymentState !== "manual_review" &&
      !(allowUnverifiedReconciliation && input.paymentState === "unverified")) ||
    input.amount !== 980 ||
    input.currency !== "jpy" ||
    !Number.isFinite(Date.parse(input.eventOccurredAt))
  ) {
    invalidPayload();
  }
}

function requireElapsedSeconds(value: number) {
  if (!Number.isSafeInteger(value) || value < 0) {
    invalidPayload();
  }
}

function requireActionRequiredFacts(
  input: ActionRequiredOperatorNotification,
) {
  requireElapsedSeconds(input.elapsedSeconds);
  if (
    input.deliveryState !== "pending" &&
    input.deliveryState !== "complete"
  ) {
    invalidPayload();
  }

  switch (input.incidentCode) {
    case "delivery_pending_15m":
      if (
        input.paymentState !== "verified" ||
        input.deliveryState !== "pending" ||
        input.elapsedSeconds < 15 * 60 ||
        !["pending", "processing", "retryable"].includes(
          input.fulfillmentState,
        )
      ) {
        invalidPayload();
      }
      return;
    case "manual_review":
      if (input.fulfillmentState !== "manual_review") {
        invalidPayload();
      }
      return;
    case "payment_fulfillment_retry_exhausted":
      if (
        input.paymentState !== "verified" ||
        input.fulfillmentState !== "retry_exhausted"
      ) {
        invalidPayload();
      }
      return;
    default:
      invalidPayload();
  }
}

function formatJstTimestamp(value: string) {
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) {
    invalidPayload();
  }
  const shifted = new Date(timestamp + 9 * 60 * 60 * 1_000);
  const iso = shifted.toISOString();
  return `${iso.slice(0, 10)} ${iso.slice(11, 19)} JST`;
}

function formatElapsedSeconds(value: number) {
  requireElapsedSeconds(value);
  return `${value} sec`;
}

function formatElapsedMinutes(value: number) {
  requireElapsedSeconds(value);
  return `${Math.floor(value / 60)} min (${value} sec)`;
}

export function deriveOperatorOrderReference(purchaseIntentId: string) {
  if (
    typeof purchaseIntentId !== "string" ||
    purchaseIntentId.length < 1 ||
    purchaseIntentId.length > 256
  ) {
    invalidPayload();
  }
  const digest = createHash("sha256")
    .update(`operator-order-v1:${purchaseIntentId}`, "utf8")
    .digest("hex")
    .slice(0, 16);
  return `ord_${digest}`;
}

export function validateOperatorDiscordUserId(value: string | undefined) {
  if (value === undefined || value === "") {
    return undefined;
  }
  if (!discordUserIdPattern.test(value)) {
    throw new OperatorNotificationConfigurationError(
      "DISCORD_OPERATOR_USER_ID_INVALID",
    );
  }
  return value;
}

export function formatOperatorDiscordNotification(
  input: OperatorNotification,
  operatorUserId?: string,
): OperatorDiscordWebhookPayload {
  if (input.notificationType === "action_required" && input.incidentCode === "payment_reconciliation_stopped") {
    requireOperatorOrderFacts(input, true);
    requireElapsedSeconds(input.elapsedSeconds);
    if (input.paymentState !== "unverified" || input.deliveryState !== "unknown" || input.fulfillmentState !== "not_authorized") invalidPayload();
    const userId = validateOperatorDiscordUserId(operatorUserId);
    const lines = [
      "**🚨 ACTION REQUIRED**",
      "Payment reconciliation stopped with unresolved evidence.",
      "Incident: payment_reconciliation_stopped",
      "Payment: unverified (not a failed or paid determination)",
      "Expected amount: ¥980 (not proof of payment)",
      `Elapsed since detection: ${formatElapsedMinutes(input.elapsedSeconds)}`,
      `Time: ${formatJstTimestamp(input.eventOccurredAt)}`,
      `Order: ${deriveOperatorOrderReference(input.purchaseIntentId)}`,
      "Operator rule:",
      "- Do not charge the Customer again.",
      "- Do not retry blindly.",
      "- Do not refund blindly.",
      "- Verify Stripe / DB authoritative state and followup stop cause first.",
    ];
    if (userId) lines.unshift(`<@${userId}>`);
    return { content: lines.join("\n"), allowed_mentions: userId ? { parse: [], users: [userId] } : { parse: [] } };
  }
  requireOperatorOrderFacts(input);
  const orderReference = deriveOperatorOrderReference(input.purchaseIntentId);
  const occurredAt = formatJstTimestamp(input.eventOccurredAt);

  if (input.notificationType === "new_purchase") {
    if (input.paymentState !== "verified") invalidPayload();
    return {
      content: [
        "**💰 NEW PURCHASE**",
        "¥980",
        "Payment: verified",
        `Time: ${occurredAt}`,
        `Order: ${orderReference}`,
      ].join("\n"),
      allowed_mentions: { parse: [] },
    };
  }

  if (input.notificationType === "delivery_complete") {
    if (
      input.paymentState !== "verified" ||
      input.deliveryState !== "complete"
    ) {
      invalidPayload();
    }
    requireElapsedSeconds(input.elapsedSeconds);
    return {
      content: [
        "**✅ DELIVERY COMPLETE**",
        `Payment → Delivery: ${formatElapsedSeconds(input.elapsedSeconds)}`,
        `Time: ${occurredAt}`,
        `Order: ${orderReference}`,
      ].join("\n"),
      allowed_mentions: { parse: [] },
    };
  }

  requireActionRequiredFacts(input);
  const userId = validateOperatorDiscordUserId(operatorUserId);
  const lines = [
    "**🚨 ACTION REQUIRED**",
    input.paymentState === "verified"
      ? "Paid order requires operator review."
      : "Payment state requires operator review.",
    `Incident: ${input.incidentCode}`,
    `Payment: ${input.paymentState}`,
    `Delivery: ${input.deliveryState === "complete" ? "complete" : "missing"}`,
    `Fulfillment: ${input.fulfillmentState}`,
    `Elapsed: ${formatElapsedMinutes(input.elapsedSeconds)}`,
    `Time: ${occurredAt}`,
    `Order: ${orderReference}`,
    "Operator rule:",
    "- Do not charge the Customer again.",
    "- Do not retry blindly.",
    "- Do not refund blindly.",
    "- Verify Stripe / DB authoritative state first.",
  ];
  if (userId) {
    lines.unshift(`<@${userId}>`);
  }
  return {
    content: lines.join("\n"),
    allowed_mentions: userId ? { parse: [], users: [userId] } : { parse: [] },
  };
}

function validateWebhookUrl(value: string) {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new OperatorNotificationConfigurationError(
      "DISCORD_OPERATOR_WEBHOOK_URL_INVALID",
    );
  }
  if (
    url.protocol !== "https:" ||
    url.hostname !== "discord.com" ||
    url.port !== "" ||
    url.username !== "" ||
    url.password !== "" ||
    url.search !== "" ||
    url.hash !== "" ||
    !discordWebhookPathPattern.test(url.pathname)
  ) {
    throw new OperatorNotificationConfigurationError(
      "DISCORD_OPERATOR_WEBHOOK_URL_INVALID",
    );
  }
  return url;
}

function boundedRetryAfterSeconds(value: string | null) {
  if (!value) {
    return 5;
  }
  const numeric = Number(value);
  if (Number.isFinite(numeric) && numeric >= 0) {
    return Math.min(900, Math.max(1, Math.ceil(numeric)));
  }
  const date = Date.parse(value);
  if (Number.isFinite(date)) {
    return Math.min(
      900,
      Math.max(1, Math.ceil((date - Date.now()) / 1_000)),
    );
  }
  return 5;
}

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === "AbortError";
}

export class DiscordOperatorWebhookClient
  implements OperatorDiscordTransport
{
  private readonly webhookUrl: URL;
  private readonly fetchImplementation: typeof fetch;
  private readonly timeoutMilliseconds: number;

  constructor(
    webhookUrl: string,
    fetchImplementation: typeof fetch = fetch,
    timeoutMilliseconds = 5_000,
  ) {
    this.webhookUrl = validateWebhookUrl(webhookUrl);
    this.fetchImplementation = fetchImplementation;
    if (
      !Number.isSafeInteger(timeoutMilliseconds) ||
      timeoutMilliseconds < 1_000 ||
      timeoutMilliseconds > 30_000
    ) {
      throw new OperatorNotificationConfigurationError(
        "DISCORD_OPERATOR_TIMEOUT_INVALID",
      );
    }
    this.timeoutMilliseconds = timeoutMilliseconds;
  }

  async send(
    payload: OperatorDiscordWebhookPayload,
  ): Promise<OperatorDiscordSendResult> {
    const url = new URL(this.webhookUrl);
    url.searchParams.set("wait", "true");
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      this.timeoutMilliseconds,
    );

    try {
      let response: Response;
      try {
        response = await this.fetchImplementation(url, {
          method: "POST",
          redirect: "error",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });
      } catch (error) {
        return {
          outcome: "ambiguous",
          errorCode: isAbortError(error)
            ? "DISCORD_TIMEOUT_AMBIGUOUS"
            : "DISCORD_NETWORK_AMBIGUOUS",
        };
      }

      if (response.status >= 200 && response.status < 300) {
        try {
          const body: unknown = await response.json();
          if (
            typeof body === "object" &&
            body !== null &&
            "id" in body &&
            typeof body.id === "string" &&
            discordMessageIdPattern.test(body.id)
          ) {
            return {
              outcome: "sent",
              providerMessageReference: body.id,
            };
          }
        } catch {
          // A response without a Discord message identity cannot prove delivery.
        }
        return {
          outcome: "ambiguous",
          errorCode: "DISCORD_RESPONSE_AMBIGUOUS",
        };
      }

      if (response.status === 429) {
        return {
          outcome: "retryable",
          errorCode: "DISCORD_RATE_LIMITED",
          retryAfterSeconds: boundedRetryAfterSeconds(
            response.headers.get("retry-after"),
          ),
        };
      }

      if (response.status === 408) {
        return {
          outcome: "ambiguous",
          errorCode: "DISCORD_REQUEST_TIMEOUT_AMBIGUOUS",
        };
      }

      if (response.status >= 400 && response.status < 500) {
        return {
          outcome: "terminal_failure",
          errorCode: "DISCORD_REQUEST_REJECTED",
        };
      }

      return {
        outcome: "ambiguous",
        errorCode:
          response.status >= 500
            ? "DISCORD_SERVER_AMBIGUOUS"
            : "DISCORD_RESPONSE_AMBIGUOUS",
      };
    } finally {
      clearTimeout(timeout);
    }
  }
}
