import "server-only";

import { createHash } from "node:crypto";

import { M2RuntimeError } from "../assessment/runtime/errors";

type Bucket = { startedAt: number; count: number };
const buckets = new Map<string, Bucket>();
const maximumBuckets = 10_000;

function configuredInteger(name: string, minimum: number, maximum: number) {
  const value = process.env[name];
  if (!value || !/^\d+$/u.test(value)) {
    throw new M2RuntimeError("CUSTOMER_AUTH_RATE_LIMIT_UNCONFIGURED", 503);
  }
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < minimum || parsed > maximum) {
    throw new M2RuntimeError("CUSTOMER_AUTH_RATE_LIMIT_UNCONFIGURED", 503);
  }
  return parsed;
}

export function enforceCustomerAuthSameOrigin(request: Request, siteOrigin: string) {
  if (request.method !== "POST") {
    throw new M2RuntimeError("CUSTOMER_AUTH_METHOD_REJECTED", 405);
  }
  const expected = new URL(siteOrigin);
  const origin = request.headers.get("origin");
  const fetchSite = request.headers.get("sec-fetch-site");
  if (
    origin !== expected.origin ||
    (fetchSite !== null && fetchSite !== "same-origin")
  ) {
    throw new M2RuntimeError("CUSTOMER_AUTH_ORIGIN_REJECTED", 403);
  }
}

export function enforceCustomerAuthRateLimit(scope: string, opaqueIdentity: string) {
  if (process.env.CUSTOMER_AUTH_RATE_LIMIT_MODE !== "in_memory_seam") {
    throw new M2RuntimeError("CUSTOMER_AUTH_RATE_LIMIT_UNCONFIGURED", 503);
  }
  const maximumRequests = configuredInteger(
    "CUSTOMER_AUTH_RATE_LIMIT_MAX_REQUESTS",
    1,
    10_000,
  );
  const windowSeconds = configuredInteger(
    "CUSTOMER_AUTH_RATE_LIMIT_WINDOW_SECONDS",
    1,
    86_400,
  );
  const now = Date.now();
  const windowMilliseconds = windowSeconds * 1_000;
  const key = createHash("sha256")
    .update(`moon-reply:customer-auth-rate-limit:v1:${scope}:${opaqueIdentity}`, "utf8")
    .digest("hex");
  const existing = buckets.get(key);
  if (!existing || now - existing.startedAt >= windowMilliseconds) {
    if (!existing && buckets.size >= maximumBuckets) {
      for (const [candidate, bucket] of buckets) {
        if (now - bucket.startedAt >= windowMilliseconds) buckets.delete(candidate);
      }
      if (buckets.size >= maximumBuckets) {
        throw new M2RuntimeError("CUSTOMER_AUTH_RATE_LIMITED", 429);
      }
    }
    buckets.set(key, { startedAt: now, count: 1 });
    return;
  }
  existing.count += 1;
  if (existing.count > maximumRequests) {
    throw new M2RuntimeError("CUSTOMER_AUTH_RATE_LIMITED", 429);
  }
}
