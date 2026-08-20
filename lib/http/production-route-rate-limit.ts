import { createHash } from "node:crypto";
import { M2RuntimeError } from "../assessment/runtime/errors.ts";

type Bucket = { windowStartedAt: number; count: number };

const buckets = new Map<string, Bucket>();
const maximumBucketCount = 10_000;

function pruneExpiredBuckets(now: number, windowMilliseconds: number) {
  for (const [key, bucket] of buckets) {
    if (now - bucket.windowStartedAt >= windowMilliseconds) {
      buckets.delete(key);
    }
  }
}

function configuredInteger(name: string, minimum: number, maximum: number) {
  const value = process.env[name];
  if (!value || !/^\d+$/u.test(value)) {
    throw new M2RuntimeError("PAYMENT_RATE_LIMIT_CONFIGURATION_INVALID", 503);
  }
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < minimum || parsed > maximum) {
    throw new M2RuntimeError("PAYMENT_RATE_LIMIT_CONFIGURATION_INVALID", 503);
  }
  return parsed;
}

export function enforceProductionRouteRateLimit(
  scope: string,
  opaqueIdentity: string,
) {
  if (process.env.PAYMENT_ROUTE_RATE_LIMIT_MODE !== "in_memory_seam") {
    throw new M2RuntimeError("PAYMENT_RATE_LIMIT_UNCONFIGURED", 503);
  }
  const maximumRequests = configuredInteger(
    "PAYMENT_ROUTE_RATE_LIMIT_MAX_REQUESTS",
    1,
    10_000,
  );
  const windowSeconds = configuredInteger(
    "PAYMENT_ROUTE_RATE_LIMIT_WINDOW_SECONDS",
    1,
    86_400,
  );
  const now = Date.now();
  const windowMilliseconds = windowSeconds * 1000;
  const key = createHash("sha256")
    .update(`moon-reply:route-limit:v1:${scope}:${opaqueIdentity}`, "utf8")
    .digest("hex");
  const current = buckets.get(key);
  if (!current || now - current.windowStartedAt >= windowMilliseconds) {
    if (!current && buckets.size >= maximumBucketCount) {
      pruneExpiredBuckets(now, windowMilliseconds);
      if (buckets.size >= maximumBucketCount) {
        throw new M2RuntimeError("PAYMENT_RATE_LIMITED", 429);
      }
    }
    buckets.set(key, { windowStartedAt: now, count: 1 });
    return;
  }
  current.count += 1;
  if (current.count > maximumRequests) {
    throw new M2RuntimeError("PAYMENT_RATE_LIMITED", 429);
  }
}

export function resetProductionRouteRateLimitForTests() {
  if (process.env.NODE_ENV !== "test") {
    throw new M2RuntimeError("PAYMENT_RATE_LIMIT_RESET_FORBIDDEN", 403);
  }
  buckets.clear();
}
