import { M2RuntimeError } from "./errors.ts";
import type { SafetyResult } from "./policy.ts";
import type { JsonObject } from "./types.ts";

type SafetyClassification = SafetyResult["classification"];

const safetyRank: Record<SafetyClassification, number> = {
  normal_allowed: 0,
  needs_review: 1,
  rejected: 2,
};

function responseModeFor(
  classification: SafetyClassification,
  reasonCodes: string[],
): SafetyResult["response_mode"] {
  if (classification === "normal_allowed") return "none";
  if (reasonCodes.includes("self_harm")) return "urgent_self_safety";
  if (reasonCodes.includes("harm_others")) return "urgent_other_safety";
  if (reasonCodes.includes("dv_abuse_fear")) return "abuse_safety_support";
  if (
    reasonCodes.includes("doxxing") ||
    reasonCodes.includes("third_party_secret")
  ) {
    return "privacy_protection";
  }
  if (reasonCodes.includes("minor_related")) return "minor_safeguarding";
  if (reasonCodes.includes("illegal_conduct")) return "lawful_alternative";
  if (
    reasonCodes.some((code) =>
      [
        "stalking_or_visit",
        "waiting_or_ambush",
        "threat_or_coercion",
        "surveillance",
      ].includes(code),
    )
  ) {
    return "unsafe_contact_stop";
  }
  return "unsafe_contact_stop";
}

export function aggregateSafetyV3(
  deterministic: SafetyResult,
  modelResult: JsonObject,
): SafetyResult {
  const modelClassification = modelResult.classification;
  if (
    modelClassification !== "normal_allowed" &&
    modelClassification !== "needs_review" &&
    modelClassification !== "rejected"
  ) {
    throw new M2RuntimeError("M2_SAFETY_OUTPUT_INVALID");
  }

  const classification =
    safetyRank[deterministic.classification] >= safetyRank[modelClassification]
      ? deterministic.classification
      : modelClassification;
  const modelReasonCodes = Array.isArray(modelResult.reason_codes)
    ? modelResult.reason_codes.filter(
        (value): value is string => typeof value === "string",
      )
    : [];
  const reasonCodes = [
    ...new Set([...deterministic.reason_codes, ...modelReasonCodes]),
  ].filter((code) => classification === "normal_allowed" || code !== "normal");

  return {
    classification,
    reason_codes: reasonCodes,
    response_mode: responseModeFor(classification, reasonCodes),
  };
}
