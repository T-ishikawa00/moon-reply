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
