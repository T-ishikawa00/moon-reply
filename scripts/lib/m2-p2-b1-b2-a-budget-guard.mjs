export const LIVE_PRICING_SNAPSHOT = Object.freeze({
  model: "gpt-5.6-luna",
  standard_input_per_million_usd: 1,
  cache_write_protection_input_per_million_usd: 1.25,
  output_per_million_usd: 6,
  cached_read_discount_used_for_approval: false,
  snapshot_date: "2026-07-28",
  execution_time_recheck_required: true,
  maximum_snapshot_age_hours: 24,
});

export const LIVE_BUDGET_POLICY = Object.freeze({
  historical_static_hard_cap_usd: 0.213223,
  preflight_ceiling_usd: 0.3,
  future_human_absolute_ceiling_usd: 1,
  maximum_provider_calls: 6,
  long_input_token_threshold: 272000,
  conservative_utf8_bytes_per_token: 2,
});

function rounded(value) {
  return Number(value.toFixed(12));
}

function budgetError(stopCode, message) {
  return Object.assign(new Error(message), { stopCode });
}

export function computeLiveExecutionGuard(stageRequests) {
  const stage_envelopes = stageRequests.map((request) => {
    const requestBytes = Buffer.byteLength(
      JSON.stringify(request.body),
      "utf8",
    );
    const inputTokenUpperBound = Math.ceil(
      requestBytes /
        LIVE_BUDGET_POLICY.conservative_utf8_bytes_per_token,
    );
    const inputCost = rounded(
      (inputTokenUpperBound *
        LIVE_PRICING_SNAPSHOT
          .cache_write_protection_input_per_million_usd) /
        1_000_000,
    );
    const outputCost = rounded(
      (request.body.max_output_tokens *
        LIVE_PRICING_SNAPSHOT.output_per_million_usd) /
        1_000_000,
    );
    return {
      stage_id: request.stage_id,
      request_body_bytes: requestBytes,
      conservative_input_token_upper_bound: inputTokenUpperBound,
      configured_output_cap_tokens: request.body.max_output_tokens,
      cache_write_protected_input_cost_usd: inputCost,
      output_cap_cost_usd: outputCost,
      live_guard_cost_usd: rounded(inputCost + outputCost),
      below_long_input_threshold:
        inputTokenUpperBound <
        LIVE_BUDGET_POLICY.long_input_token_threshold,
    };
  });
  const liveGuardCost = rounded(
    stage_envelopes.reduce(
      (sum, entry) => sum + entry.live_guard_cost_usd,
      0,
    ),
  );
  return {
    pricing_snapshot: LIVE_PRICING_SNAPSHOT,
    policy: LIVE_BUDGET_POLICY,
    stage_envelopes,
    live_execution_guard_cost_usd: liveGuardCost,
    long_input_pricing_guard_passed: stage_envelopes.every(
      (entry) => entry.below_long_input_threshold,
    ),
    preflight_guard_passed:
      liveGuardCost <= LIVE_BUDGET_POLICY.preflight_ceiling_usd,
  };
}

export function assertLivePreflightBudget(
  guard,
  {
    staticHardCapUsd =
      LIVE_BUDGET_POLICY.historical_static_hard_cap_usd,
    forceLongInputFailure = false,
  } = {},
) {
  if (staticHardCapUsd > LIVE_BUDGET_POLICY.preflight_ceiling_usd) {
    throw budgetError(
      "STATIC_HARD_CAP_EXCEEDS_PREFLIGHT",
      "Historical static hard cap exceeds the preflight ceiling",
    );
  }
  if (
    forceLongInputFailure ||
    guard.long_input_pricing_guard_passed !== true
  ) {
    throw budgetError(
      "LONG_INPUT_PRICING_GUARD_FAILED",
      "A Stage crossed the long-input pricing threshold",
    );
  }
  if (
    guard.live_execution_guard_cost_usd >
    LIVE_BUDGET_POLICY.preflight_ceiling_usd
  ) {
    throw budgetError(
      "LIVE_GUARD_COST_EXCEEDS_PREFLIGHT",
      "Live execution guard exceeds the preflight ceiling",
    );
  }
  return true;
}

export function usageDerivedConservativeCost(usage) {
  return rounded(
    (usage.input_tokens *
      LIVE_PRICING_SNAPSHOT
        .cache_write_protection_input_per_million_usd) /
      1_000_000 +
      (usage.output_tokens *
        LIVE_PRICING_SNAPSHOT.output_per_million_usd) /
        1_000_000,
  );
}

export function assertSequentialHumanCeiling({
  usageDerivedConservativeCostSoFar,
  remainingStageLiveGuardCost,
  providerCallsCompleted,
}) {
  if (
    providerCallsCompleted >=
      LIVE_BUDGET_POLICY.maximum_provider_calls ||
    rounded(
      usageDerivedConservativeCostSoFar +
        remainingStageLiveGuardCost,
    ) > LIVE_BUDGET_POLICY.future_human_absolute_ceiling_usd
  ) {
    throw budgetError(
      "HUMAN_CEILING_EXCEEDED",
      "Sequential Human ceiling guard failed",
    );
  }
  return true;
}

export function assertPricingSnapshotFresh({
  verifiedAt,
  executionTime,
}) {
  const verified = Date.parse(verifiedAt);
  const execution = Date.parse(executionTime);
  const maximumAgeMs =
    LIVE_PRICING_SNAPSHOT.maximum_snapshot_age_hours * 60 * 60 * 1000;
  if (
    !Number.isFinite(verified) ||
    !Number.isFinite(execution) ||
    execution < verified ||
    execution - verified > maximumAgeMs
  ) {
    throw budgetError(
      "PRICE_SNAPSHOT_STALE",
      "The execution-time price snapshot is stale",
    );
  }
  return true;
}
