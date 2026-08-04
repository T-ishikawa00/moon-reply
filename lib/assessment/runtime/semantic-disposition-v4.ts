import { buildChangeConditionCommentaryV3 } from "./change-condition-grounding-v3.ts";
import type { DecisionPlan, JsonObject, ReportContent } from "./types.ts";

export const SEMANTIC_DISPOSITION_V4_VERSION =
  "m2-p4-semantic-disposition-v4" as const;

export const SEMANTIC_DISPOSITION_V4_HARD_FINDING_CODES = [
  "FACT_FIDELITY",
  "ASSUMPTION_AS_FACT",
  "DECISION_ALLOWED",
  "SAFETY_REGRESSION",
] as const;

export const SEMANTIC_DISPOSITION_V4_ALWAYS_NONBLOCKING_CODES = [
  "TEMPLATE_GENERICITY",
  "REPETITION",
] as const;

export const SEMANTIC_DISPOSITION_V4_FLEXIBLE_INTERNAL_PATH_PATTERNS = [
  "^(?:\\$\\.)?candidate_envelope\\.analysis\\.candidate_style_profile(?:\\.|$)",
  "^(?:\\$\\.)?candidate_envelope\\.analysis\\.candidate_communicative_intent\\.apology_strength$",
] as const;

export const SEMANTIC_DISPOSITION_V4_CONDITIONAL_INTERNAL_PATH_PATTERNS = [
  "^(?:\\$\\.)?candidate_envelope\\.analysis\\.candidate_communicative_intent\\.practical_requirement$",
] as const;

export const SEMANTIC_DISPOSITION_V4_PRODUCT_OUTCOME_PATH_PATTERNS = [
  "^(?:\\$\\.)?decision_plan\\.recommended_message_draft(?:$|\\.(?:text|policy|use_timing)$)",
  "^(?:\\$\\.)?decision_plan\\.actions_to_take(?:$|\\[(?:0|[1-9]\\d*)\\]$)",
  "^(?:\\$\\.)?decision_plan\\.aftercare_plan(?:$|\\[(?:0|[1-9]\\d*)\\](?:\\.|$))",
  "^(?:\\$\\.)?decision_plan\\.change_conditions(?:$|\\[(?:0|[1-9]\\d*)\\](?:\\.|$))",
  "^(?:\\$\\.)?report_content\\.cover_line$",
  "^(?:\\$\\.)?report_content\\.decision_reason_summary$",
  "^(?:\\$\\.)?report_content\\.action_rationales(?:$|\\[(?:0|[1-9]\\d*)\\]$)",
  "^(?:\\$\\.)?report_content\\.aftercare_commentary(?:$|\\[(?:0|[1-9]\\d*)\\]$)",
  "^(?:\\$\\.)?report_content\\.change_condition_commentary(?:$|\\[(?:0|[1-9]\\d*)\\]$)",
  "^(?:\\$\\.)?report_content\\.message_draft_context$",
] as const;

const temporalDecisionPath =
  /^(?:\$\.)?decision_plan\.change_conditions\[(0|[1-9]\d*)\]\.resulting_direction$/u;
const temporalCommentaryPath =
  /^(?:\$\.)?report_content\.change_condition_commentary\[(0|[1-9]\d*)\]$/u;
const finalDraftPath =
  /^(?:\$\.)?decision_plan\.recommended_message_draft\.text$/u;
const hardFindingCodes = new Set<string>(
  SEMANTIC_DISPOSITION_V4_HARD_FINDING_CODES,
);
const alwaysNonblockingCodes = new Set<string>(
  SEMANTIC_DISPOSITION_V4_ALWAYS_NONBLOCKING_CODES,
);
const flexibleInternalPatterns =
  SEMANTIC_DISPOSITION_V4_FLEXIBLE_INTERNAL_PATH_PATTERNS.map(
    (pattern) => new RegExp(pattern, "u"),
  );
const conditionalInternalPatterns =
  SEMANTIC_DISPOSITION_V4_CONDITIONAL_INTERNAL_PATH_PATTERNS.map(
    (pattern) => new RegExp(pattern, "u"),
  );
const productOutcomePatterns =
  SEMANTIC_DISPOSITION_V4_PRODUCT_OUTCOME_PATH_PATTERNS.map(
    (pattern) => new RegExp(pattern, "u"),
  );

type FindingDisposition = "blocking" | "conditional" | "nonblocking" | "ignored";

function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function pathIndex(value: unknown, pattern: RegExp) {
  if (typeof value !== "string") return null;
  const match = pattern.exec(value);
  if (!match) return null;
  const index = Number(match[1]);
  return Number.isSafeInteger(index) ? index : null;
}

function matchesPath(value: unknown, patterns: readonly RegExp[]) {
  return typeof value === "string" && patterns.some((pattern) => pattern.test(value));
}

function isTemporalDecisionFalsePositive(
  finding: JsonObject,
  decisionPlan: DecisionPlan,
) {
  if (finding.finding_code !== "DECISION_ALLOWED") return false;
  const index = pathIndex(finding.json_path, temporalDecisionPath);
  return index !== null && decisionPlan.change_conditions[index] !== undefined;
}

function isTemporalCommentaryFalsePositive(
  finding: JsonObject,
  decisionPlan: DecisionPlan,
  groundedReportContent: ReportContent,
) {
  if (finding.finding_code !== "MESSAGE_POLICY_CONSISTENCY") return false;
  const index = pathIndex(finding.json_path, temporalCommentaryPath);
  if (index === null) return false;
  const expectedCommentary = buildChangeConditionCommentaryV3(decisionPlan);
  return (
    expectedCommentary[index] !== undefined &&
    groundedReportContent.change_condition_commentary[index] ===
      expectedCommentary[index]
  );
}

function classifyFinding(
  finding: JsonObject,
  decisionPlan: DecisionPlan,
  groundedReportContent: ReportContent,
): { disposition: FindingDisposition; reason: string } {
  if (
    isTemporalDecisionFalsePositive(finding, decisionPlan) ||
    isTemporalCommentaryFalsePositive(
      finding,
      decisionPlan,
      groundedReportContent,
    )
  ) {
    return { disposition: "ignored", reason: "accepted_temporal_false_positive" };
  }

  const findingCode =
    typeof finding.finding_code === "string" ? finding.finding_code : "";
  const severity = typeof finding.severity === "string" ? finding.severity : "";
  const isMajor = severity === "major" || severity === "critical";

  if (hardFindingCodes.has(findingCode)) {
    return { disposition: "blocking", reason: "hard_factual_or_safety_code" };
  }
  if (matchesPath(finding.json_path, flexibleInternalPatterns)) {
    return { disposition: "nonblocking", reason: "flexible_internal_semantics" };
  }
  if (matchesPath(finding.json_path, conditionalInternalPatterns)) {
    return { disposition: "conditional", reason: "conditional_internal_semantics" };
  }
  if (alwaysNonblockingCodes.has(findingCode)) {
    return { disposition: "nonblocking", reason: "always_nonblocking_code" };
  }
  if (findingCode === "BRAND_TONE") {
    return isMajor &&
      typeof finding.json_path === "string" &&
      finalDraftPath.test(finding.json_path)
      ? { disposition: "blocking", reason: "material_final_draft_personality_drift" }
      : { disposition: "nonblocking", reason: "brand_tone_default" };
  }
  if (isMajor && matchesPath(finding.json_path, productOutcomePatterns)) {
    return { disposition: "blocking", reason: "material_product_outcome_path" };
  }
  return isMajor
    ? { disposition: "blocking", reason: "remaining_major_or_critical" }
    : { disposition: "nonblocking", reason: "remaining_minor" };
}

export function evaluateSemanticFindingsV4({
  validationOutput,
  decisionPlan,
  groundedReportContent,
}: {
  validationOutput: JsonObject;
  decisionPlan: DecisionPlan;
  groundedReportContent: ReportContent;
}) {
  const findings = Array.isArray(validationOutput.semantic_checks)
    ? validationOutput.semantic_checks.filter(isJsonObject)
    : [];
  const findingDispositions = findings.map((finding) => ({
    finding,
    ...classifyFinding(finding, decisionPlan, groundedReportContent),
  }));
  const select = (disposition: FindingDisposition) =>
    findingDispositions
      .filter((item) => item.disposition === disposition)
      .map((item) => item.finding);

  return {
    blockingFindings: select("blocking"),
    conditionalFindings: select("conditional"),
    nonblockingFindings: select("nonblocking"),
    ignoredTemporalFalsePositives: select("ignored"),
    findingDispositions,
  };
}
