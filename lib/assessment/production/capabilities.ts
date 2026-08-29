import { createHash, randomBytes } from "node:crypto";
import { M2RuntimeError } from "../runtime/errors.ts";
import { hashJson } from "../runtime/hash.ts";
import type { JsonObject } from "../runtime/types.ts";

const opaqueTokenPattern = /^[A-Za-z0-9_-]{43}$/u;
const idempotencyKeyPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;

export function createOpaqueProductionCapability() {
  return randomBytes(32).toString("base64url");
}

export function deriveHostedPreparationReplayCapability(
  continuationToken: unknown,
  purpose: "purchase_ready" | "awaiting_clarification",
) {
  const token = validateOpaqueProductionCapability(continuationToken);
  return createHash("sha256")
    .update(`moon-reply:hosted-preparation-replay:v1:${purpose}:${token}`, "utf8")
    .digest("base64url");
}

export function validateOpaqueProductionCapability(value: unknown) {
  if (typeof value !== "string" || !opaqueTokenPattern.test(value)) {
    throw new M2RuntimeError("PRODUCTION_CAPABILITY_INVALID", 404);
  }
  return value;
}

export function hashOpaqueProductionCapability(value: unknown) {
  const token = validateOpaqueProductionCapability(value);
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export function hashProductionResultCapability(value: unknown) {
  try {
    return hashOpaqueProductionCapability(value);
  } catch (error) {
    if (
      error instanceof M2RuntimeError &&
      error.safeCode === "PRODUCTION_CAPABILITY_INVALID"
    ) {
      throw new M2RuntimeError("PRODUCTION_RESULT_NOT_FOUND", 404);
    }
    throw error;
  }
}

export function isProductionResultNotFoundError(error: unknown) {
  return (
    error instanceof M2RuntimeError &&
    error.safeCode === "PRODUCTION_RESULT_NOT_FOUND"
  );
}

export function hashProductionIdempotencyKey(value: unknown) {
  if (typeof value !== "string" || !idempotencyKeyPattern.test(value)) {
    throw new M2RuntimeError("PRODUCTION_IDEMPOTENCY_KEY_INVALID", 400);
  }
  return createHash("sha256")
    .update(value.toLowerCase(), "utf8")
    .digest("hex");
}

export function hashServerAuthorityReference(value: unknown) {
  if (typeof value !== "string") {
    throw new M2RuntimeError("PRODUCTION_SERVER_AUTHORITY_INVALID");
  }
  const normalized = value.trim();
  if (normalized.length < 16 || normalized.length > 256) {
    throw new M2RuntimeError("PRODUCTION_SERVER_AUTHORITY_INVALID");
  }
  return createHash("sha256").update(normalized, "utf8").digest("hex");
}

export function hashProductionSnapshot(value: object) {
  return hashJson(value as unknown as JsonObject);
}
