import { createHash } from "node:crypto";

export const B0_PRICE_SNAPSHOT = Object.freeze({
  schema_version: "m2-p2-b1-b2-b0-price-snapshot-v1",
  model: "gpt-5.6-luna",
  checked_at: "2026-07-29",
  standard_input_per_million: 1,
  cached_input_per_million: 0.1,
  cache_write_multiplier: 1.25,
  standard_output_per_million: 6,
  long_input_threshold_tokens: 272000,
  long_input_input_multiplier: 2,
  long_input_output_multiplier: 1.5,
  approval_uses_cached_discount: false,
  maximum_snapshot_age_for_paid_run_hours: 24,
});

export const B0_BUDGET_EVIDENCE = Object.freeze({
  historical_static_cap_usd: 0.213223,
  live_guard_cost_usd: 0.26079625,
  preflight_ceiling_usd: 0.3,
  absolute_ceiling_usd: 1,
  long_input_guard_passed: true,
  maximum_provider_calls: 6,
});

function priceError(stopCode, message) {
  return Object.assign(new Error(message), { stopCode });
}

function same(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

export function priceSnapshotHash(snapshot = B0_PRICE_SNAPSHOT) {
  return createHash("sha256")
    .update(Buffer.from(JSON.stringify(snapshot), "utf8"))
    .digest("hex");
}

export const B0_PRICE_SNAPSHOT_SHA256 = priceSnapshotHash();

export function assertExactPriceSnapshot(snapshot) {
  if (!same(snapshot, B0_PRICE_SNAPSHOT)) {
    throw priceError(
      "PRICE_SNAPSHOT_MISMATCH",
      "The paid-run price snapshot differs from the fixed version",
    );
  }
  return true;
}

export function assertPriceSnapshotFresh({
  snapshot = B0_PRICE_SNAPSHOT,
  verifiedAt,
  executionTime,
}) {
  assertExactPriceSnapshot(snapshot);
  const checked = Date.parse(`${snapshot.checked_at}T00:00:00.000Z`);
  const verified = Date.parse(verifiedAt);
  const execution = Date.parse(executionTime);
  const maximumAgeMs =
    snapshot.maximum_snapshot_age_for_paid_run_hours *
    60 *
    60 *
    1000;
  if (
    !Number.isFinite(checked) ||
    !Number.isFinite(verified) ||
    !Number.isFinite(execution) ||
    verified < checked ||
    execution < verified ||
    execution - verified > maximumAgeMs
  ) {
    throw priceError(
      "PRICE_SNAPSHOT_STALE",
      "The paid-run price snapshot is stale",
    );
  }
  return true;
}

export function assertLongInputGuard(
  evidence = B0_BUDGET_EVIDENCE,
) {
  if (
    evidence.long_input_guard_passed !== true ||
    B0_PRICE_SNAPSHOT.long_input_threshold_tokens !== 272000
  ) {
    throw priceError(
      "LONG_INPUT_PRICING_GUARD_FAILED",
      "Long-input pricing guard did not pass",
    );
  }
  return true;
}

export function assertLiveGuard(
  evidence = B0_BUDGET_EVIDENCE,
) {
  if (
    evidence.historical_static_cap_usd !== 0.213223 ||
    evidence.live_guard_cost_usd !== 0.26079625 ||
    evidence.preflight_ceiling_usd !== 0.3 ||
    evidence.live_guard_cost_usd > evidence.preflight_ceiling_usd
  ) {
    throw priceError(
      "LIVE_GUARD_COST_EXCEEDS_PREFLIGHT",
      "The live execution guard differs or exceeds the ceiling",
    );
  }
  return true;
}

export function assertHumanCeiling(
  evidence = B0_BUDGET_EVIDENCE,
) {
  if (
    evidence.absolute_ceiling_usd !== 1 ||
    evidence.maximum_provider_calls !== 6 ||
    evidence.live_guard_cost_usd > evidence.absolute_ceiling_usd
  ) {
    throw priceError(
      "HUMAN_CEILING_MISMATCH",
      "The absolute Human ceiling differs",
    );
  }
  return true;
}
