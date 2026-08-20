export const RC2_PAYMENT_SCHEMA_VERSION =
  "rc2-production-payment-delivery-v1" as const;

export const RC2_PRODUCT = Object.freeze({
  code: "moon_reply_love_message_assessment_note_v1",
  serviceName: "月の返事",
  productName: "恋のメッセージ鑑定ノート",
  description: "1相談 / 1鑑定ノート",
  amount: 980,
  currency: "jpy",
  purchaseKind: "one_time",
} as const);

export const TRUSTED_EMAIL_COOKIE = "__Host-moon_reply_verified_email";

export const ACTIVE_PAYMENT_ATTEMPT_STATES = Object.freeze([
  "reserved",
  "pending",
  "processing",
  "unknown",
] as const);
