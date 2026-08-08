import { buildChangeConditionCommentaryV3 } from "./change-condition-grounding-v3.ts";
import type {
  DecisionPlan,
  JsonObject,
  SplitDecisionPlanV2,
  SplitReportContentV2,
} from "./types.ts";

export const SEMANTIC_DISPOSITION_V5_VERSION =
  "m2-p4-semantic-disposition-v5" as const;

export const SEMANTIC_DISPOSITION_V5_HARD_FINDING_CODES = [
  "ASSUMPTION_AS_FACT",
  "SAFETY_REGRESSION",
  "DECISION_ALLOWED",
] as const;

export const SEMANTIC_DISPOSITION_V5_ALWAYS_NONBLOCKING_CODES = [
  "TEMPLATE_GENERICITY",
  "REPETITION",
] as const;

export const SEMANTIC_DISPOSITION_V5_TEMPORAL_FINDING_CODES = [
  "DECISION_ALLOWED",
  "ACTION_CONSISTENCY",
  "MESSAGE_POLICY_CONSISTENCY",
] as const;

export const SEMANTIC_DISPOSITION_V5_FLEXIBLE_INTERNAL_PATH_PATTERNS = [
  "^(?:\\$\\.)?candidate_envelope\\.analysis\\.candidate_style_profile(?:\\.|$)",
  "^(?:\\$\\.)?candidate_envelope\\.analysis\\.candidate_communicative_intent\\.apology_strength$",
] as const;

export const SEMANTIC_DISPOSITION_V5_CONDITIONAL_INTERNAL_PATH_PATTERNS = [
  "^(?:\\$\\.)?candidate_envelope\\.analysis\\.candidate_communicative_intent\\.practical_requirement$",
] as const;

export const SEMANTIC_DISPOSITION_V5_PRODUCT_OUTCOME_PATH_PATTERNS = [
  "^(?:\\$\\.)?decision_plan\\.selected_decision$",
  "^(?:\\$\\.)?decision_plan\\.recommended_message_draft(?:$|\\.(?:text|policy|use_timing)$)",
  "^(?:\\$\\.)?decision_plan\\.pre_action_check(?:$|\\.check$)",
  "^(?:\\$\\.)?decision_plan\\.actions_to_take(?:$|\\[(?:0|[1-9]\\d*)\\]$)",
  "^(?:\\$\\.)?decision_plan\\.actions_to_avoid(?:$|\\[(?:0|[1-9]\\d*)\\]$)",
  "^(?:\\$\\.)?decision_plan\\.aftercare_plan(?:$|\\[(?:0|[1-9]\\d*)\\](?:\\.|$))",
  "^(?:\\$\\.)?decision_plan\\.change_conditions(?:$|\\[(?:0|[1-9]\\d*)\\](?:\\.|$))",
  "^(?:\\$\\.)?report_content(?:$|\\.)",
] as const;

const futureDirectionPath =
  /^(?:\$\.)?decision_plan\.change_conditions\[(0|[1-9]\d*)\]\.resulting_direction$/u;
const futureCommentaryPath =
  /^(?:\$\.)?report_content\.change_condition_commentary\[(0|[1-9]\d*)\]$/u;
const finalDraftPath =
  /^(?:\$\.)?decision_plan\.recommended_message_draft\.text$/u;
const temporalPolicyComparison =
  /(?:current|currently|current direction|allowed set|disallowed|decision[_ ]policy|現在|現行|現在の方向|現在方針|許可された決定|決定集合|方針と整合しない)/iu;
const enduringConstraintLanguage =
  /(?:safety|no[_ -]?followup|business[_ -]?only|contact[_ -]?constraint|boundary|安全|境界|連絡禁止|追加連絡|業務のみ|私的な連絡)/iu;

const hardFindingCodes = new Set<string>(
  SEMANTIC_DISPOSITION_V5_HARD_FINDING_CODES,
);
const alwaysNonblockingCodes = new Set<string>(
  SEMANTIC_DISPOSITION_V5_ALWAYS_NONBLOCKING_CODES,
);
const temporalFindingCodes = new Set<string>(
  SEMANTIC_DISPOSITION_V5_TEMPORAL_FINDING_CODES,
);
const flexibleInternalPatterns =
  SEMANTIC_DISPOSITION_V5_FLEXIBLE_INTERNAL_PATH_PATTERNS.map(
    (pattern) => new RegExp(pattern, "u"),
  );
const conditionalInternalPatterns =
  SEMANTIC_DISPOSITION_V5_CONDITIONAL_INTERNAL_PATH_PATTERNS.map(
    (pattern) => new RegExp(pattern, "u"),
  );
const productOutcomePatterns =
  SEMANTIC_DISPOSITION_V5_PRODUCT_OUTCOME_PATH_PATTERNS.map(
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

function evidenceReferences(finding: JsonObject) {
  return Array.isArray(finding.evidence_refs)
    ? finding.evidence_refs.filter(
        (reference): reference is string => typeof reference === "string",
      )
    : [];
}

function citesEnduringConstraint(finding: JsonObject) {
  const references = evidenceReferences(finding);
  const detail = typeof finding.detail === "string" ? finding.detail : "";
  return (
    references.some(
      (reference) =>
        reference === "policy:contact_constraint_policy" ||
        reference === "policy:aggregate_safety_result",
    ) || enduringConstraintLanguage.test(detail)
  );
}

function isFutureDirectionFalsePositive(
  finding: JsonObject,
  decisionPlan: SplitDecisionPlanV2,
) {
  if (
    typeof finding.finding_code !== "string" ||
    !temporalFindingCodes.has(finding.finding_code) ||
    citesEnduringConstraint(finding)
  ) {
    return false;
  }
  const index = pathIndex(finding.json_path, futureDirectionPath);
  if (index === null || decisionPlan.change_conditions[index] === undefined) {
    return false;
  }
  const detail = typeof finding.detail === "string" ? finding.detail : "";
  return (
    evidenceReferences(finding).includes("policy:decision_policy_result") ||
    temporalPolicyComparison.test(detail)
  );
}

function isGroundedFutureCommentaryFalsePositive(
  finding: JsonObject,
  decisionPlan: SplitDecisionPlanV2,
  groundedReportContent: SplitReportContentV2,
) {
  if (
    typeof finding.finding_code !== "string" ||
    !temporalFindingCodes.has(finding.finding_code) ||
    citesEnduringConstraint(finding)
  ) {
    return false;
  }
  const index = pathIndex(finding.json_path, futureCommentaryPath);
  if (index === null) return false;
  const expectedCommentary = buildChangeConditionCommentaryV3(
    decisionPlan as unknown as DecisionPlan,
  );
  return (
    expectedCommentary[index] !== undefined &&
    groundedReportContent.change_condition_commentary[index] ===
      expectedCommentary[index]
  );
}

function classifyFinding(
  finding: JsonObject,
  decisionPlan: SplitDecisionPlanV2,
  groundedReportContent: SplitReportContentV2,
): { disposition: FindingDisposition; reason: string } {
  if (
    isFutureDirectionFalsePositive(finding, decisionPlan) ||
    isGroundedFutureCommentaryFalsePositive(
      finding,
      decisionPlan,
      groundedReportContent,
    )
  ) {
    return {
      disposition: "ignored",
      reason: "accepted_temporal_false_positive",
    };
  }

  const findingCode =
    typeof finding.finding_code === "string" ? finding.finding_code : "";
  const severity = typeof finding.severity === "string" ? finding.severity : "";
  const isMajor = severity === "major" || severity === "critical";

  if (hardFindingCodes.has(findingCode)) {
    return {
      disposition: "blocking",
      reason: "hard_assumption_safety_or_current_direction",
    };
  }
  if (findingCode === "FACT_FIDELITY") {
    return isMajor
      ? { disposition: "blocking", reason: "material_fact_fidelity" }
      : { disposition: "nonblocking", reason: "minor_fact_fidelity" };
  }
  if (findingCode === "UNSUPPORTED_CERTAINTY") {
    return isMajor && matchesPath(finding.json_path, productOutcomePatterns)
      ? {
          disposition: "blocking",
          reason: "material_customer_assertion_without_authority",
        }
      : {
          disposition: "nonblocking",
          reason: "nonmaterial_or_noncustomer_certainty_finding",
        };
  }
  if (matchesPath(finding.json_path, flexibleInternalPatterns)) {
    return { disposition: "nonblocking", reason: "flexible_internal_semantics" };
  }
  if (matchesPath(finding.json_path, conditionalInternalPatterns)) {
    return {
      disposition: "conditional",
      reason: "conditional_internal_semantics",
    };
  }
  if (alwaysNonblockingCodes.has(findingCode)) {
    return { disposition: "nonblocking", reason: "default_style_nonblocking" };
  }
  if (findingCode === "BRAND_TONE") {
    return isMajor &&
      typeof finding.json_path === "string" &&
      finalDraftPath.test(finding.json_path)
      ? {
          disposition: "blocking",
          reason: "material_final_draft_personality_drift",
        }
      : { disposition: "nonblocking", reason: "brand_tone_default" };
  }
  if (isMajor && matchesPath(finding.json_path, productOutcomePatterns)) {
    return { disposition: "blocking", reason: "material_product_outcome_path" };
  }
  return isMajor
    ? { disposition: "blocking", reason: "remaining_major_or_critical" }
    : { disposition: "nonblocking", reason: "remaining_minor" };
}

export function evaluateSemanticFindingsV5({
  validationOutput,
  decisionPlan,
  groundedReportContent,
}: {
  validationOutput: JsonObject;
  decisionPlan: SplitDecisionPlanV2;
  groundedReportContent: SplitReportContentV2;
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
