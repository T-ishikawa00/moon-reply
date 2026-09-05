import { createCipheriv, createDecipheriv, hkdfSync, randomBytes } from "node:crypto";
import { M2RuntimeError } from "../../assessment/runtime/errors.ts";
import type { PreparedAssessmentResultEmailV1 } from "./transactional-email.ts";

const domain = "moon-reply:result-notification-envelope:v1";
const failure = () => new M2RuntimeError("PRODUCTION_NOTIFICATION_PAYLOAD_INTEGRITY_FAILED", 503);

function key(encodedKey: string) {
  const master = Buffer.from(encodedKey, "base64");
  if (master.length !== 32) throw failure();
  // Separate this encryption purpose from the existing delivery-email cipher.
  return Buffer.from(hkdfSync("sha256", master, Buffer.alloc(0), domain, 32));
}

export function encryptNotificationEnvelope(
  notificationId: string,
  payload: PreparedAssessmentResultEmailV1,
  encodedKey: string,
) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(encodedKey), iv);
  cipher.setAAD(Buffer.from(`${domain}:${notificationId}`, "utf8"));
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(payload), "utf8"), cipher.final()]);
  return ["v1", iv.toString("base64url"), cipher.getAuthTag().toString("base64url"),
    encrypted.toString("base64url")].join(".");
}

export function decryptNotificationEnvelope(
  notificationId: string,
  ciphertext: string,
  encodedKey: string,
): PreparedAssessmentResultEmailV1 {
  try {
    if (ciphertext.length > 32768) throw failure();
    const [version, ivPart, tagPart, encryptedPart, extra] = ciphertext.split(".");
    if (version !== "v1" || extra !== undefined || !ivPart || !tagPart || !encryptedPart) throw failure();
    const iv = Buffer.from(ivPart, "base64url");
    const tag = Buffer.from(tagPart, "base64url");
    if (iv.length !== 12 || tag.length !== 16) throw failure();
    const decipher = createDecipheriv("aes-256-gcm", key(encodedKey), iv);
    decipher.setAAD(Buffer.from(`${domain}:${notificationId}`, "utf8"));
    decipher.setAuthTag(tag);
    const value = JSON.parse(Buffer.concat([
      decipher.update(Buffer.from(encryptedPart, "base64url")), decipher.final(),
    ]).toString("utf8"));
    if (!value || Object.keys(value).sort().join() !== "messageIdempotencyKey,payload" ||
        value.messageIdempotencyKey !== `result-notification:${notificationId}` ||
        !value.payload || Object.keys(value.payload).sort().join() !== "from,html,subject,text,to" ||
        Object.values(value.payload).some((part) => typeof part !== "string" || !part.length)) throw failure();
    return value as PreparedAssessmentResultEmailV1;
  } catch {
    throw failure();
  }
}
