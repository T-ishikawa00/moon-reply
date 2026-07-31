import { M2RuntimeError } from "./errors.ts";
import type { SafetyResult } from "./policy.ts";
import type { JsonObject } from "./types.ts";

export type RuntimeEligibilityV3 = "ready" | "safety_blocked";

export type LocalEligibilityResultV3 = {
  schema_version: "m2-p4-runtime-eligibility-v3";
  eligibility: RuntimeEligibilityV3;
  question_codes: [];
  normal_flow_allowed: boolean;
  payment_allowed: boolean;
  report_generation: "allowed" | "prohibited";
};

export function deriveRuntimeEligibilityV3(
  aggregateSafety: Pick<SafetyResult, "classification">,
): RuntimeEligibilityV3 {
  return aggregateSafety.classification === "normal_allowed"
    ? "ready"
    : "safety_blocked";
}

export function validateEligibilityProjectionV3(
  projection: JsonObject,
  applicationExpectation: RuntimeEligibilityV3,
) {
  if (projection.acknowledged_eligibility !== applicationExpectation) {
    throw new M2RuntimeError("M2_ELIGIBILITY_PROJECTION_MISMATCH");
  }
}

export function buildLocalEligibilityResultV3(
  eligibility: RuntimeEligibilityV3,
): LocalEligibilityResultV3 {
  const ready = eligibility === "ready";
  return {
    schema_version: "m2-p4-runtime-eligibility-v3",
    eligibility,
    question_codes: [],
    normal_flow_allowed: ready,
    payment_allowed: ready,
    report_generation: ready ? "allowed" : "prohibited",
  };
}
