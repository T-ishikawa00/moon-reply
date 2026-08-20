import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  randomBytes,
  randomInt,
  timingSafeEqual,
} from "node:crypto";
import { M2RuntimeError } from "../../assessment/runtime/errors.ts";

const opaqueCapabilityPattern = /^[A-Za-z0-9_-]{43}$/u;
const verificationCodePattern = /^\d{8}$/u;
const emailPattern = /^[A-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?(?:\.[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?)+$/iu;

function sha256(value: string) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function requireSecret(secret: string, code: string) {
  if (Buffer.byteLength(secret, "utf8") < 32) {
    throw new M2RuntimeError(code, 503);
  }
  return secret;
}

export function createPaymentCapability() {
  return randomBytes(32).toString("base64url");
}

export function validatePaymentCapability(value: unknown) {
  if (typeof value !== "string" || !opaqueCapabilityPattern.test(value)) {
    throw new M2RuntimeError("PAYMENT_CAPABILITY_INVALID", 404);
  }
  return value;
}

export function hashPaymentCapability(value: unknown, purpose: string) {
  const capability = validatePaymentCapability(value);
  return sha256(`moon-reply:${purpose}:v1:${capability}`);
}

export function normalizeDeliveryEmail(value: unknown) {
  if (typeof value !== "string") {
    throw new M2RuntimeError("EMAIL_ADDRESS_INVALID", 400);
  }
  const normalized = value.trim().normalize("NFKC").toLowerCase();
  if (
    normalized.length < 3 ||
    normalized.length > 254 ||
    !emailPattern.test(normalized)
  ) {
    throw new M2RuntimeError("EMAIL_ADDRESS_INVALID", 400);
  }
  return normalized;
}

export function hashDeliveryEmail(normalizedEmail: string, pepper: string) {
  return createHmac(
    "sha256",
    requireSecret(pepper, "EMAIL_VERIFICATION_CONFIGURATION_INVALID"),
  )
    .update(`moon-reply:delivery-email:v1:${normalizedEmail}`, "utf8")
    .digest("hex");
}

export function maskDeliveryEmail(normalizedEmail: string) {
  const [local, domain] = normalizedEmail.split("@");
  const visible = local.slice(0, Math.min(2, local.length));
  return `${visible}${"*".repeat(Math.max(3, Math.min(8, local.length - visible.length)))}@${domain}`;
}

export function createVerificationCode() {
  return String(randomInt(0, 100_000_000)).padStart(8, "0");
}

export function validateVerificationCode(value: unknown) {
  if (typeof value !== "string" || !verificationCodePattern.test(value)) {
    throw new M2RuntimeError("EMAIL_VERIFICATION_INVALID", 403);
  }
  return value;
}

export function hashVerificationSecret(input: {
  challengeCapability: unknown;
  verificationCode: unknown;
  pepper: string;
}) {
  const capability = validatePaymentCapability(input.challengeCapability);
  const code = validateVerificationCode(input.verificationCode);
  return createHmac(
    "sha256",
    requireSecret(input.pepper, "EMAIL_VERIFICATION_CONFIGURATION_INVALID"),
  )
    .update(`moon-reply:email-verification:v1:${capability}:${code}`, "utf8")
    .digest("hex");
}

export function derivePurchaseStatusCapability(
  purchaseIntentId: string,
  signingSecret: string,
) {
  return createHmac(
    "sha256",
    requireSecret(signingSecret, "PAYMENT_CONFIGURATION_INVALID"),
  )
    .update(`moon-reply:purchase-status:v1:${purchaseIntentId}`, "utf8")
    .digest("base64url");
}

export function deriveProviderIdempotencyKey(input: {
  purchaseIntentId: string;
  attemptIdentity: string;
  signingSecret: string;
}) {
  const digest = createHmac(
    "sha256",
    requireSecret(input.signingSecret, "PAYMENT_CONFIGURATION_INVALID"),
  )
    .update(
      `moon-reply:stripe-checkout:v1:${input.purchaseIntentId}:${input.attemptIdentity}`,
      "utf8",
    )
    .digest("base64url");
  return `mr_rc2_${digest}`;
}

export function hashProviderIdempotencyKey(value: string) {
  return sha256(`moon-reply:provider-idempotency:v1:${value}`);
}

function decodeEncryptionKey(encodedKey: string) {
  let key: Buffer;
  try {
    key = Buffer.from(encodedKey, "base64");
  } catch {
    throw new M2RuntimeError("EMAIL_ENCRYPTION_CONFIGURATION_INVALID", 503);
  }
  if (key.length !== 32) {
    throw new M2RuntimeError("EMAIL_ENCRYPTION_CONFIGURATION_INVALID", 503);
  }
  return key;
}

export function encryptDeliveryEmail(
  normalizedEmail: string,
  encodedKey: string,
) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", decodeEncryptionKey(encodedKey), iv);
  cipher.setAAD(Buffer.from("moon-reply:delivery-email:v1", "utf8"));
  const ciphertext = Buffer.concat([
    cipher.update(normalizedEmail, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return [iv, tag, ciphertext].map((part) => part.toString("base64url")).join(".");
}

export function decryptDeliveryEmail(ciphertext: string, encodedKey: string) {
  const parts = ciphertext.split(".");
  if (parts.length !== 3) {
    throw new M2RuntimeError("EMAIL_ADDRESS_INTEGRITY_FAILED", 503);
  }
  try {
    const [iv, tag, encrypted] = parts.map((part) =>
      Buffer.from(part, "base64url"),
    );
    if (iv.length !== 12 || tag.length !== 16 || encrypted.length === 0) {
      throw new Error("invalid encrypted email");
    }
    const decipher = createDecipheriv(
      "aes-256-gcm",
      decodeEncryptionKey(encodedKey),
      iv,
    );
    decipher.setAAD(Buffer.from("moon-reply:delivery-email:v1", "utf8"));
    decipher.setAuthTag(tag);
    const normalized = Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]).toString("utf8");
    return normalizeDeliveryEmail(normalized);
  } catch (error) {
    if (
      error instanceof M2RuntimeError &&
      error.safeCode === "EMAIL_ENCRYPTION_CONFIGURATION_INVALID"
    ) {
      throw error;
    }
    throw new M2RuntimeError("EMAIL_ADDRESS_INTEGRITY_FAILED", 503);
  }
}

export function equalSha256(left: string, right: string) {
  if (!/^[0-9a-f]{64}$/u.test(left) || !/^[0-9a-f]{64}$/u.test(right)) {
    return false;
  }
  return timingSafeEqual(Buffer.from(left, "hex"), Buffer.from(right, "hex"));
}
