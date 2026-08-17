import { evaluateSemanticFindingsV4 } from "./semantic-disposition-v4.ts";
import type { JsonObject, SplitDecisionPlanV2, SplitReportContentV2 } from "./types.ts";

export const SEMANTIC_DISPOSITION_V5_VERSION =
  "m2-p4-semantic-disposition-v5" as const;

export const SEMANTIC_DISPOSITION_V5_PRODUCT_QUALITY_FINDING_CODES = [
  "TEMPLATE_GENERICITY",
  "REPETITION",
] as const;

export const SEMANTIC_DISPOSITION_V5_PRODUCT_QUALITY_PATH_PATTERNS = [
  "^(?:\\$\\.)?report_content\\.cover_line$",
  "^(?:\\$\\.)?report_content\\.short_letter(?:$|\\[(?:0|[1-9]\\d*)\\]$)",
  "^(?:\\$\\.)?report_content\\.decision_reason_summary$",
  "^(?:\\$\\.)?report_content\\.observed_fact_commentary\\[(?:0|[1-9]\\d*)\\]\\.commentary$",
  "^(?:\\$\\.)?report_content\\.possible_interpretations(?:$|\\[(?:0|[1-9]\\d*)\\]$)",
  "^(?:\\$\\.)?report_content\\.anxiety_reframe(?:$|\\[(?:0|[1-9]\\d*)\\]$)",
  "^(?:\\$\\.)?report_content\\.action_rationales(?:$|\\[(?:0|[1-9]\\d*)\\]$)",
  "^(?:\\$\\.)?report_content\\.message_draft_context$",
  "^(?:\\$\\.)?report_content\\.message_temperature\\.(?:softness|affection|pressure|adjustment)$",
  "^(?:\\$\\.)?report_content\\.aftercare_commentary(?:$|\\[(?:0|[1-9]\\d*)\\]$)",
  "^(?:\\$\\.)?report_content\\.closing_lines(?:$|\\[(?:0|[1-9]\\d*)\\]$)",
] as const;

const productQualityCodes = new Set<string>(
  SEMANTIC_DISPOSITION_V5_PRODUCT_QUALITY_FINDING_CODES,
);
const productQualityPatterns =
  SEMANTIC_DISPOSITION_V5_PRODUCT_QUALITY_PATH_PATTERNS.map(
    (pattern) => new RegExp(pattern, "u"),
  );

function isV1CBlockingProductQualityFinding(finding: JsonObject) {
  const findingCode =
    typeof finding.finding_code === "string" ? finding.finding_code : "";
  const severity = typeof finding.severity === "string" ? finding.severity : "";
  const jsonPath = typeof finding.json_path === "string" ? finding.json_path : "";
  return (
    productQualityCodes.has(findingCode) &&
    (severity === "major" || severity === "critical") &&
    productQualityPatterns.some((pattern) => pattern.test(jsonPath))
  );
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
  const predecessor = evaluateSemanticFindingsV4({
    validationOutput,
    decisionPlan: decisionPlan as unknown as Parameters<
      typeof evaluateSemanticFindingsV4
    >[0]["decisionPlan"],
    groundedReportContent: groundedReportContent as unknown as Parameters<
      typeof evaluateSemanticFindingsV4
    >[0]["groundedReportContent"],
  });
  const findingDispositions = predecessor.findingDispositions.map((item) =>
    isV1CBlockingProductQualityFinding(item.finding)
      ? {
          ...item,
          disposition: "blocking" as const,
          reason: "v1_c_material_provider_product_quality",
        }
      : item,
  );
  const select = (
    disposition: "blocking" | "conditional" | "nonblocking" | "ignored",
  ) =>
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
