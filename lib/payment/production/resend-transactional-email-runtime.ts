import { Resend } from "resend";
import { M2RuntimeError } from "../../assessment/runtime/errors.ts";
import { normalizeDeliveryEmail } from "./crypto.ts";
import type {
  AssessmentResultEmailV1,
  MailboxVerificationEmailV1,
  TransactionalEmailAdapterV1,
} from "./transactional-email.ts";
import {
  purchaseSupportInquiryCategories,
  type PurchaseSupportOperatorEmailRequest,
} from "../../support/types.ts";

const verificationCodePattern = /^\d{8}$/u;
const idempotencyKeyPattern = /^[\x21-\x7e]{1,256}$/u;
const providerMessageReferencePattern = /^[A-Za-z0-9_-]{1,256}$/u;
const resultPathPattern = /^\/result\/[A-Za-z0-9_-]{43}$/u;
const senderDisplayNamePattern = /^[\p{L}\p{M}\p{N} .・ー_-]+$/u;

type ResendEmailPayloadV1 = Readonly<{
  from: string;
  to: string;
  subject: string;
  text: string;
  html: string;
}>;

type ResendEmailResponseV1 = Readonly<{
  data: Readonly<{ id: string }> | null;
  error: unknown | null;
}>;

export type ResendEmailClientV1 = Readonly<{
  send(
    payload: ResendEmailPayloadV1,
    options: Readonly<{ idempotencyKey: string }>,
  ): Promise<ResendEmailResponseV1>;
}>;

export type ResendTransactionalEmailConfigurationV1 = Readonly<{
  apiKey: string | undefined;
  fromAddress: string | undefined;
  fromName: string | undefined;
}>;

type ValidatedSenderV1 = Readonly<{
  address: string;
  name: string;
  header: string;
}>;

function configurationFailure(): never {
  throw new M2RuntimeError("PAYMENT_CONFIGURATION_INVALID", 503);
}

function validateApiKey(value: string | undefined) {
  if (
    typeof value !== "string" ||
    value.length < 1 ||
    value.length > 512 ||
    value !== value.trim() ||
    /[\s\u0000-\u001f\u007f]/u.test(value)
  ) {
    configurationFailure();
  }
  return value;
}

function validateSender(input: {
  fromAddress: string | undefined;
  fromName: string | undefined;
}): ValidatedSenderV1 {
  let address: string;
  try {
    address = normalizeDeliveryEmail(input.fromAddress);
  } catch {
    configurationFailure();
  }
  if (typeof input.fromName !== "string") configurationFailure();
  const name = input.fromName.trim().normalize("NFKC");
  if (
    name.length < 1 ||
    [...name].length > 80 ||
    !senderDisplayNamePattern.test(name)
  ) {
    configurationFailure();
  }
  return Object.freeze({ address, name, header: `${name} <${address}>` });
}

function validateIdempotencyKey(value: string) {
  if (!idempotencyKeyPattern.test(value)) {
    throw new Error("invalid message idempotency key");
  }
  return value;
}

function validateRecipient(value: string) {
  return normalizeDeliveryEmail(value);
}

function formatJapaneseExpiration(value: string) {
  const instant = new Date(value);
  if (!Number.isFinite(instant.getTime())) {
    throw new Error("invalid expiration");
  }
  const parts = new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(instant);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((candidate) => candidate.type === type)?.value;
  const year = part("year");
  const month = part("month");
  const day = part("day");
  const hour = part("hour");
  const minute = part("minute");
  if (!year || !month || !day || !hour || !minute) {
    throw new Error("invalid expiration format");
  }
  return `${year}年${month}月${day}日 ${hour}:${minute}（日本時間）`;
}

function validateResultUrl(value: string) {
  if (
    typeof value !== "string" ||
    value.length < 1 ||
    value.length > 2_048 ||
    /[\r\n]/u.test(value)
  ) {
    throw new Error("invalid result URL");
  }
  const parsed = new URL(value);
  if (
    parsed.protocol !== "https:" ||
    parsed.username ||
    parsed.password ||
    parsed.search ||
    parsed.hash ||
    !resultPathPattern.test(parsed.pathname)
  ) {
    throw new Error("invalid result URL");
  }
  return value;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function verificationPayload(
  sender: ValidatedSenderV1,
  request: MailboxVerificationEmailV1,
): ResendEmailPayloadV1 {
  if (!verificationCodePattern.test(request.verificationCode)) {
    throw new Error("invalid verification code");
  }
  const recipient = validateRecipient(request.recipientEmail);
  const expiration = formatJapaneseExpiration(request.expiresAt);
  const subject = "月の返事｜メールアドレス確認コード";
  const text = [
    "月の返事",
    "",
    "メールアドレス確認コード",
    request.verificationCode,
    "",
    `有効期限：${expiration}`,
    "有効期限内に確認画面へ入力してください。",
    "このコードは他人に共有しないでください。",
  ].join("\n");
  const html = [
    "<p><strong>月の返事</strong></p>",
    "<p>メールアドレス確認コード</p>",
    `<p><strong>${escapeHtml(request.verificationCode)}</strong></p>`,
    `<p>有効期限：${escapeHtml(expiration)}<br>有効期限内に確認画面へ入力してください。</p>`,
    "<p>このコードは他人に共有しないでください。</p>",
  ].join("");
  return Object.freeze({
    from: sender.header,
    to: recipient,
    subject,
    text,
    html,
  });
}

function resultPayload(
  sender: ValidatedSenderV1,
  request: AssessmentResultEmailV1,
): ResendEmailPayloadV1 {
  const recipient = validateRecipient(request.recipientEmail);
  const resultUrl = validateResultUrl(request.resultUrl);
  const subject = "月の返事｜鑑定ノートができました";
  const text = [
    "月の返事",
    "",
    "鑑定ノートのご用意ができました。",
    "以下の専用URLから結果をご確認ください。",
    "",
    resultUrl,
    "",
    "このURLにはアクセス専用情報が含まれています。第三者に共有しないでください。",
    "アクセスできない場合は、購入状況画面から再度お試しください。",
  ].join("\n");
  const html = [
    "<p><strong>月の返事</strong></p>",
    "<p>鑑定ノートのご用意ができました。</p>",
    `<p><a href="${escapeHtml(resultUrl)}">専用URLから結果を確認する</a></p>`,
    "<p>このURLにはアクセス専用情報が含まれています。第三者に共有しないでください。</p>",
    "<p>アクセスできない場合は、購入状況画面から再度お試しください。</p>",
  ].join("");
  return Object.freeze({
    from: sender.header,
    to: recipient,
    subject,
    text,
    html,
  });
}

export function purchaseSupportPayload(
  sender: string,
  operatorEmail: string,
  request: PurchaseSupportOperatorEmailRequest,
): ResendEmailPayloadV1 {
  const category = purchaseSupportInquiryCategories.find(
    (candidate) => candidate.value === request.category,
  )!.label;
  const authority = request.authority;
  const fields = [
    ["Customer verified email", normalizeDeliveryEmail(request.customerEmail)],
    ["Purchase datetime", formatJapaneseExpiration(authority.purchasedAt)],
    ["Product", authority.productName],
    ["Amount", "¥980"],
    ["moon_purchase_reference", authority.moonPurchaseReference],
    [
      "Payment state",
      `purchase=${authority.paymentState.purchase}; attempt=${authority.paymentState.attempt}; verified=${authority.paymentState.verified ? "yes" : "no"}`,
    ],
    ["Fulfillment state", authority.fulfillmentState],
    ["Delivery state", authority.deliveryState],
    ["Inquiry category", category],
  ] as const;
  const message = request.customerMessage ?? "（未入力）";
  return Object.freeze({
    from: sender,
    to: normalizeDeliveryEmail(operatorEmail),
    subject: "月の返事｜購入に関するお問い合わせ",
    text: [
      "月の返事｜購入に関するお問い合わせ", "",
      ...fields.map(([label, value]) => `${label}: ${value}`), "",
      "Customer message:", message, "",
      "Operator rule: Stripe Dashboardで最終照合し、返金はHuman判断でのみ実行してください。",
    ].join("\n"),
    html: [
      "<p><strong>月の返事｜購入に関するお問い合わせ</strong></p><dl>",
      ...fields.map(([label, value]) =>
        `<dt><strong>${escapeHtml(label)}</strong></dt><dd>${escapeHtml(value)}</dd>`),
      "</dl><p><strong>Customer message</strong></p>",
      `<pre style="white-space:pre-wrap">${escapeHtml(message)}</pre>`,
      "<p>Operator rule: Stripe Dashboardで最終照合し、返金はHuman判断でのみ実行してください。</p>",
    ].join(""),
  });
}

function createResendEmailClient(apiKey: string): ResendEmailClientV1 {
  const resend = new Resend(apiKey);
  return Object.freeze({
    async send(payload, options) {
      const response = await resend.emails.send(payload, {
        idempotencyKey: options.idempotencyKey,
      });
      return { data: response.data, error: response.error };
    },
  });
}

export class ResendTransactionalEmailAdapterV1
  implements TransactionalEmailAdapterV1
{
  readonly #client: ResendEmailClientV1;
  readonly #sender: ValidatedSenderV1;

  constructor(
    client: ResendEmailClientV1,
    sender: { fromAddress: string | undefined; fromName: string | undefined },
  ) {
    this.#client = client;
    this.#sender = validateSender(sender);
  }

  async #deliver(
    payload: () => ResendEmailPayloadV1,
    messageIdempotencyKey: string,
    failureCode:
      | "EMAIL_VERIFICATION_DELIVERY_FAILED"
      | "RESULT_EMAIL_DELIVERY_FAILED"
      | "PURCHASE_SUPPORT_EMAIL_DELIVERY_FAILED",
  ) {
    try {
      const response = await this.#client.send(payload(), {
        idempotencyKey: validateIdempotencyKey(messageIdempotencyKey),
      });
      const providerMessageReference = response.data?.id;
      if (
        response.error !== null ||
        typeof providerMessageReference !== "string" ||
        !providerMessageReferencePattern.test(providerMessageReference)
      ) {
        throw new Error("provider delivery result is not authoritative");
      }
      return Object.freeze({ providerMessageReference });
    } catch {
      throw new M2RuntimeError(failureCode, 503);
    }
  }

  async sendMailboxVerification(request: MailboxVerificationEmailV1) {
    return this.#deliver(
      () => verificationPayload(this.#sender, request),
      request.messageIdempotencyKey,
      "EMAIL_VERIFICATION_DELIVERY_FAILED",
    );
  }

  async sendAssessmentResult(request: AssessmentResultEmailV1) {
    return this.#deliver(
      () => resultPayload(this.#sender, request),
      request.messageIdempotencyKey,
      "RESULT_EMAIL_DELIVERY_FAILED",
    );
  }

  async sendPurchaseSupport(
    operatorEmail: string | undefined,
    request: PurchaseSupportOperatorEmailRequest,
  ) {
    return this.#deliver(
      () => purchaseSupportPayload(this.#sender.header, operatorEmail ?? "", request),
      request.messageIdempotencyKey,
      "PURCHASE_SUPPORT_EMAIL_DELIVERY_FAILED",
    );
  }
}

export function createResendTransactionalEmailAdapterV1(
  configuration: ResendTransactionalEmailConfigurationV1,
) {
  const apiKey = validateApiKey(configuration.apiKey);
  const sender = validateSender(configuration);
  return new ResendTransactionalEmailAdapterV1(createResendEmailClient(apiKey), {
    fromAddress: sender.address,
    fromName: sender.name,
  });
}
