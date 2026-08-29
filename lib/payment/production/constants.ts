export const RC2_PAYMENT_SCHEMA_VERSION =
  "rc2-production-payment-delivery-v1" as const;

// Stripe permits an explicit Checkout expiry from 30 minutes to 24 hours.
// Thirty-one minutes leaves a full minute of clock-boundary tolerance while
// keeping an abandoned unpaid Purchase inside the bounded reconciliation run.
export const RC2_CHECKOUT_SESSION_EXPIRATION_SECONDS = 31 * 60;

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
