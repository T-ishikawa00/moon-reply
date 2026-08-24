import { M2RuntimeError } from "../runtime/errors.ts";
import {
  PREPAYMENT_COMPUTE_POLICY_VERSION,
  type PrepaymentComputePolicyV1,
} from "./prepayment-compute.ts";

const MINIMUM_WINDOW_SECONDS = 60;
const MAXIMUM_WINDOW_SECONDS = 31 * 24 * 60 * 60;
const MAXIMUM_PROVIDER_INVOCATIONS = 1_000;

export function isPrepaymentComputeBudgetEnabled() {
  return process.env.PREPAYMENT_COMPUTE_BUDGET_ENABLED === "true";
}

function requiredPositiveInteger(
  name: "PREPAYMENT_COMPUTE_WINDOW_SECONDS" | "PREPAYMENT_COMPUTE_MAX_PROVIDER_INVOCATIONS",
  maximum: number,
) {
  const value = process.env[name];
  if (!value || !/^[1-9][0-9]*$/u.test(value)) {
    throw new M2RuntimeError("PREPAYMENT_COMPUTE_CONFIGURATION_INVALID", 503);
  }
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed > maximum) {
    throw new M2RuntimeError("PREPAYMENT_COMPUTE_CONFIGURATION_INVALID", 503);
  }
  return parsed;
}

export function readPrepaymentComputePolicy(): PrepaymentComputePolicyV1 {
  if (!isPrepaymentComputeBudgetEnabled()) {
    throw new M2RuntimeError("PREPAYMENT_COMPUTE_BUDGET_DISABLED", 503);
  }
  const windowSeconds = requiredPositiveInteger(
    "PREPAYMENT_COMPUTE_WINDOW_SECONDS",
    MAXIMUM_WINDOW_SECONDS,
  );
  if (windowSeconds < MINIMUM_WINDOW_SECONDS) {
    throw new M2RuntimeError("PREPAYMENT_COMPUTE_CONFIGURATION_INVALID", 503);
  }
  return {
    policyVersion: PREPAYMENT_COMPUTE_POLICY_VERSION,
    windowSeconds,
    maximumProviderInvocations: requiredPositiveInteger(
      "PREPAYMENT_COMPUTE_MAX_PROVIDER_INVOCATIONS",
      MAXIMUM_PROVIDER_INVOCATIONS,
    ),
  };
}

export function isPrepaymentComputePolicyConfigured(
  read: (name: string) => string | undefined = (name) => process.env[name],
) {
  if (read("PREPAYMENT_COMPUTE_BUDGET_ENABLED") !== "true") return false;
  const window = read("PREPAYMENT_COMPUTE_WINDOW_SECONDS");
  const maximum = read("PREPAYMENT_COMPUTE_MAX_PROVIDER_INVOCATIONS");
  if (
    !window ||
    !maximum ||
    !/^[1-9][0-9]*$/u.test(window) ||
    !/^[1-9][0-9]*$/u.test(maximum)
  ) {
    return false;
  }
  const parsedWindow = Number(window);
  const parsedMaximum = Number(maximum);
  return (
    Number.isSafeInteger(parsedWindow) &&
    parsedWindow >= MINIMUM_WINDOW_SECONDS &&
    parsedWindow <= MAXIMUM_WINDOW_SECONDS &&
    Number.isSafeInteger(parsedMaximum) &&
    parsedMaximum >= 1 &&
    parsedMaximum <= MAXIMUM_PROVIDER_INVOCATIONS
  );
}
