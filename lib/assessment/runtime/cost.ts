import type { UsageRecord, UsageTotals } from "./types.ts";

export const LUNA_RUNTIME_PRICE_SNAPSHOT = Object.freeze({
  version: "m2-p2-b1-b2-b0-price-snapshot-v1",
  model: "gpt-5.6-luna",
  standardInputPerMillionUsd: 1,
  standardOutputPerMillionUsd: 6,
  longInputThresholdTokens: 272_000,
  longInputInputMultiplier: 2,
  longInputOutputMultiplier: 1.5,
  cachedDiscountApplied: false,
});

export function emptyUsageTotals(): UsageTotals {
  return {
    totalInputTokens: 0,
    totalCachedTokens: 0,
    totalOutputTokens: 0,
    totalReasoningTokens: 0,
    usageDerivedCostUsd: 0,
  };
}

export function calculateUsageDerivedCostUsd(usage: UsageRecord) {
  const longInput =
    usage.inputTokens > LUNA_RUNTIME_PRICE_SNAPSHOT.longInputThresholdTokens;
  const inputMultiplier = longInput
    ? LUNA_RUNTIME_PRICE_SNAPSHOT.longInputInputMultiplier
    : 1;
  const outputMultiplier = longInput
    ? LUNA_RUNTIME_PRICE_SNAPSHOT.longInputOutputMultiplier
    : 1;

  const inputCost =
    (usage.inputTokens *
      LUNA_RUNTIME_PRICE_SNAPSHOT.standardInputPerMillionUsd *
      inputMultiplier) /
    1_000_000;
  const outputCost =
    (usage.outputTokens *
      LUNA_RUNTIME_PRICE_SNAPSHOT.standardOutputPerMillionUsd *
      outputMultiplier) /
    1_000_000;

  // Responses output_tokens already includes reasoning tokens. Charging the
  // output total once prevents reasoning from being double-counted.
  return Number((inputCost + outputCost).toFixed(9));
}

export function addUsage(
  totals: UsageTotals,
  usage: UsageRecord,
): UsageTotals {
  return {
    totalInputTokens: totals.totalInputTokens + usage.inputTokens,
    totalCachedTokens: totals.totalCachedTokens + usage.cachedTokens,
    totalOutputTokens: totals.totalOutputTokens + usage.outputTokens,
    totalReasoningTokens:
      totals.totalReasoningTokens + usage.reasoningTokens,
    usageDerivedCostUsd: Number(
      (
        totals.usageDerivedCostUsd + calculateUsageDerivedCostUsd(usage)
      ).toFixed(9),
    ),
  };
}
