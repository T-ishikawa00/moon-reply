import { B1B1 } from "./m2-p2-b1-b1-request-builder.mjs";

function rounded(value) {
  return Number(value.toFixed(12));
}

function budgetStop(message) {
  return Object.assign(new Error(message), { stopCode: "BUDGET_GUARD_FAILED" });
}

export function createUsageLedger() {
  return {
    currency: "USD",
    cost_term: "usage-derived conservative cost estimate",
    entries: [],
    cumulative_usage_derived_cost_usd: 0,
    actual_provider_calls: 0,
    actual_api_spend_usd: 0,
  };
}

export function usageDerivedConservativeCost(usage, usagePolicy) {
  return rounded(
    (usage.input_tokens * usagePolicy.standard_input_per_million_usd) /
      1_000_000 +
      (usage.output_tokens * usagePolicy.standard_output_per_million_usd) /
        1_000_000,
  );
}

export function recordUsage(ledger, receipt, usagePolicy) {
  const cost = usageDerivedConservativeCost(receipt.usage, usagePolicy);
  ledger.entries.push({
    stage_id: receipt.stage_id,
    response_id: receipt.response_id,
    requested_model: receipt.requested_model,
    returned_model: receipt.returned_model,
    input_tokens: receipt.usage.input_tokens,
    cached_tokens: receipt.usage.cached_tokens,
    uncached_input_tokens: receipt.usage.uncached_input_tokens,
    output_tokens: receipt.usage.output_tokens,
    reasoning_tokens: receipt.usage.reasoning_tokens,
    total_tokens: receipt.usage.total_tokens,
    usage_derived_conservative_cost_estimate_usd: cost,
  });
  ledger.cumulative_usage_derived_cost_usd = rounded(
    ledger.cumulative_usage_derived_cost_usd + cost,
  );
  return ledger;
}

export function assertBudgetBeforeStage({
  ledger,
  nextStageId,
  usagePolicy,
  forceFailure = false,
}) {
  const stageIndex = B1B1.stageIds.indexOf(nextStageId);
  if (stageIndex < 0) throw budgetStop("Next Stage is not registered");
  const remainingRegisteredStageHardCaps = rounded(
    B1B1.stageIds
      .slice(stageIndex)
      .reduce(
        (sum, stageId) => sum + usagePolicy.stage_hard_caps_usd[stageId],
        0,
      ),
  );
  const projected = rounded(
    ledger.cumulative_usage_derived_cost_usd +
      remainingRegisteredStageHardCaps,
  );
  if (
    forceFailure ||
    usagePolicy.static_hard_cap_usd > usagePolicy.preflight_ceiling_usd ||
    projected > usagePolicy.future_human_ceiling_usd
  ) {
    throw budgetStop("Sequential or static budget guard failed");
  }
  return {
    next_stage_id: nextStageId,
    cumulative_usage_derived_cost_usd:
      ledger.cumulative_usage_derived_cost_usd,
    remaining_registered_stage_hard_caps_usd:
      remainingRegisteredStageHardCaps,
    projected_ceiling_usd: projected,
    future_human_ceiling_usd: usagePolicy.future_human_ceiling_usd,
    static_hard_cap_usd: usagePolicy.static_hard_cap_usd,
    preflight_ceiling_usd: usagePolicy.preflight_ceiling_usd,
    passed: true,
  };
}
