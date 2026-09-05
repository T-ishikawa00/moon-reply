// Shared by the server repository and native Netlify worker import graph. Keep
// this module outside client imports; a Next-only marker would break the worker.
import { createHmac } from "node:crypto";
import { isIP } from "node:net";
import { M2RuntimeError } from "../runtime/errors.ts";

export type AnonymousAdmissionPolicy = Readonly<{
  windowSeconds: number;
  maximumRequestsPerIp: number;
  maximumRequestsGlobal: number;
  maximumIntakesPerIp: number;
  maximumIntakesGlobal: number;
}>;

const unavailable = () => new M2RuntimeError("ANONYMOUS_ADMISSION_UNAVAILABLE", 503);
const unconfigured = () => new M2RuntimeError("ANONYMOUS_ADMISSION_UNCONFIGURED", 503);

export function readAnonymousAdmissionPolicy(
  env: NodeJS.ProcessEnv = process.env,
): AnonymousAdmissionPolicy {
  if (env.ANONYMOUS_ADMISSION_IP_SOURCE !== "netlify_context") throw unconfigured();
  const integer = (name: string, minimum: number, maximum: number) => {
    const value = env[name];
    if (!value || !/^[1-9][0-9]*$/u.test(value)) throw unconfigured();
    const parsed = Number(value);
    if (!Number.isSafeInteger(parsed) || parsed < minimum || parsed > maximum) throw unconfigured();
    return parsed;
  };
  const policy = {
    windowSeconds: integer("ANONYMOUS_ADMISSION_WINDOW_SECONDS", 60, 3600),
    maximumRequestsPerIp: integer("ANONYMOUS_ADMISSION_MAX_REQUESTS_PER_IP", 2, 1_000_000),
    maximumRequestsGlobal: integer("ANONYMOUS_ADMISSION_MAX_REQUESTS_GLOBAL", 2, 1_000_000),
    maximumIntakesPerIp: integer("ANONYMOUS_ADMISSION_MAX_INTAKES_PER_IP", 1, 1_000_000),
    maximumIntakesGlobal: integer("ANONYMOUS_ADMISSION_MAX_INTAKES_GLOBAL", 1, 1_000_000),
  };
  if (policy.maximumRequestsPerIp > policy.maximumRequestsGlobal ||
      policy.maximumIntakesPerIp > policy.maximumIntakesGlobal ||
      policy.maximumIntakesPerIp > policy.maximumRequestsPerIp ||
      policy.maximumIntakesGlobal > policy.maximumRequestsGlobal) throw unconfigured();
  return Object.freeze(policy);
}

export function canonicalizeAnonymousAdmissionIp(value: unknown): string {
  if (typeof value !== "string" || value.length > 45 || value.includes("%") || !isIP(value)) {
    throw unavailable();
  }
  if (isIP(value) === 4) return value;
  const canonical = new URL(`http://[${value}]/`).hostname.slice(1, -1);
  const mapped = /^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/u.exec(canonical);
  if (!mapped) return canonical;
  const first = Number.parseInt(mapped[1], 16), second = Number.parseInt(mapped[2], 16);
  return `${first >>> 8}.${first & 255}.${second >>> 8}.${second & 255}`;
}

export function hashAnonymousAdmissionIp(value: unknown, pepper: string): string {
  if (Buffer.byteLength(pepper, "utf8") < 32) throw unconfigured();
  return createHmac("sha256", pepper)
    .update(`moon-reply:anonymous-admission:v1:ip:${canonicalizeAnonymousAdmissionIp(value)}`, "utf8")
    .digest("hex");
}

// The framework request headers and Customer cookies are deliberately absent
// from this interface. Hosting context availability and ingress isolation must
// be validated on the eventual deployed Next adapter before rollout acceptance.
export function readTrustedAnonymousAdmissionIdentity(): string {
  const netlify = (globalThis as typeof globalThis & {
    Netlify?: { context?: { ip?: unknown } | null };
  }).Netlify;
  return hashAnonymousAdmissionIp(netlify?.context?.ip, process.env.EMAIL_VERIFICATION_SECRET_PEPPER ?? "");
}

export function requireAnonymousAdmissionReceipt(value: unknown, windowSeconds: number): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw unavailable();
  const receipt = value as Record<string, unknown>;
  const retry = receipt.retry_after_seconds;
  if (Object.keys(receipt).length !== 3 ||
      typeof retry !== "number" || !Number.isInteger(retry) || retry < 0 || retry > windowSeconds) throw unavailable();
  if (receipt.admission_disposition === "admitted") {
    const intake = receipt.intake;
    if (retry !== 0 || !intake || typeof intake !== "object" || Array.isArray(intake)) throw unavailable();
    const result = intake as Record<string, unknown>;
    if (Object.keys(result).length !== 3 ||
        (result.disposition !== "created" && result.disposition !== "existing") ||
        typeof result.preparation_id !== "string" ||
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/iu.test(result.preparation_id) ||
        !["awaiting_auth", "executing", "awaiting_clarification", "completed", "failed"].includes(String(result.execution_disposition))) throw unavailable();
    return result;
  }
  if (receipt.intake !== null) throw unavailable();
  if (receipt.admission_disposition === "request_limited" || receipt.admission_disposition === "intake_limited") {
    if (retry < 1) throw unavailable();
    throw new M2RuntimeError("ANONYMOUS_ADMISSION_LIMITED", 429);
  }
  if (retry !== 0) throw unavailable();
  if (receipt.admission_disposition === "idempotency_conflict") {
    throw new M2RuntimeError("PRODUCTION_IDEMPOTENCY_CONFLICT", 409);
  }
  throw unavailable();
}
