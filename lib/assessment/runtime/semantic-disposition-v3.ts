import { buildChangeConditionCommentaryV3 } from "./change-condition-grounding-v3.ts";
import type { DecisionPlan, JsonObject, ReportContent } from "./types.ts";

const temporalDecisionPath =
  /^(?:\$\.)?decision_plan\.change_conditions\[(0|[1-9]\d*)\]\.resulting_direction$/u;
const temporalCommentaryPath =
  /^(?:\$\.)?report_content\.change_condition_commentary\[(0|[1-9]\d*)\]$/u;

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

export function evaluateSemanticFindingsV3({
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
  const ignoredTemporalFalsePositives = findings.filter(
    (finding) =>
      isTemporalDecisionFalsePositive(finding, decisionPlan) ||
      isTemporalCommentaryFalsePositive(
        finding,
        decisionPlan,
        groundedReportContent,
      ),
  );
  const ignored = new Set(ignoredTemporalFalsePositives);
  const blockingFindings = findings.filter(
    (finding) =>
      !ignored.has(finding) &&
      (finding.severity === "critical" || finding.severity === "major"),
  );

  return {
    blockingFindings,
    ignoredTemporalFalsePositives,
  };
}
