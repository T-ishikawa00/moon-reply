import { buildChangeConditionCommentaryV4 } from "./change-condition-grounding-v4.ts";
import type { DecisionFactsV2 } from "./contextual-inference-v3.ts";
import { evaluateSemanticFindingsV6 } from "./semantic-disposition-v6.ts";
import type {
  DecisionPlan,
  JsonObject,
  SplitDecisionPlanV2,
  SplitReportContentV2,
} from "./types.ts";

export const SEMANTIC_DISPOSITION_V7_VERSION =
  "m2-p4-semantic-disposition-v7" as const;

const futureDirectionPath =
  /^(?:\$\.)?decision_plan\.change_conditions\[(0|[1-9]\d*)\]\.resulting_direction$/u;
const neutralCommentaryPath =
  /^(?:\$\.)?report_content\.change_condition_commentary\[(0|[1-9]\d*)\]$/u;
const currentPolicyEvidenceRefs = new Set([
  "policy:effective_decision_policy_result",
  "policy:decision_policy_result",
]);
const neutralCommentaryFindingCodes = new Set([
  "ACTION_CONSISTENCY",
  "MESSAGE_POLICY_CONSISTENCY",
]);

function pathIndex(value: unknown, pattern: RegExp) {
  if (typeof value !== "string") return null;
  const match = pattern.exec(value);
  if (!match) return null;
  const index = Number(match[1]);
  return Number.isSafeInteger(index) ? index : null;
}

function isCurrentPolicyOnlyFutureDirectionFinding(
  finding: JsonObject,
  decisionPlan: SplitDecisionPlanV2,
) {
  if (finding.finding_code !== "ACTION_CONSISTENCY") return false;
  const index = pathIndex(finding.json_path, futureDirectionPath);
  if (index === null || decisionPlan.change_conditions[index] === undefined) {
    return false;
  }
  const evidenceRefs = Array.isArray(finding.evidence_refs)
    ? finding.evidence_refs.filter(
        (value): value is string => typeof value === "string",
      )
    : [];
  return (
    evidenceRefs.length > 0 &&
    evidenceRefs.every((value) => currentPolicyEvidenceRefs.has(value))
  );
}

function isApplicationOwnedNeutralCommentaryFinding(
  finding: JsonObject,
  decisionPlan: SplitDecisionPlanV2,
  groundedReportContent: SplitReportContentV2,
) {
  if (
    typeof finding.finding_code !== "string" ||
    !neutralCommentaryFindingCodes.has(finding.finding_code)
  ) {
    return false;
  }
  const index = pathIndex(finding.json_path, neutralCommentaryPath);
  if (index === null) return false;
  const expected = buildChangeConditionCommentaryV4(
    decisionPlan as unknown as DecisionPlan,
  );
  return (
    expected[index] !== undefined &&
    groundedReportContent.change_condition_commentary[index] === expected[index]
  );
}

export function evaluateSemanticFindingsV7(input: {
  validationOutput: JsonObject;
  decisionPlan: SplitDecisionPlanV2;
  groundedReportContent: SplitReportContentV2;
  decisionFacts: DecisionFactsV2;
}) {
  const predecessor = evaluateSemanticFindingsV6(input);
  const findingDispositions = predecessor.findingDispositions.map((item) => {
    if (item.disposition !== "blocking") return item;
    if (
      isCurrentPolicyOnlyFutureDirectionFinding(
        item.finding,
        input.decisionPlan,
      )
    ) {
      return {
        ...item,
        disposition: "ignored" as const,
        reason: "future_reassessment_is_not_current_policy_authority",
      };
    }
    if (
      isApplicationOwnedNeutralCommentaryFinding(
        item.finding,
        input.decisionPlan,
        input.groundedReportContent,
      )
    ) {
      return {
        ...item,
        disposition: "ignored" as const,
        reason: "application_owned_neutral_reassessment_commentary",
      };
    }
    return item;
  });
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

export function isNeutralReassessmentCommentaryV4(
  decisionPlan: SplitDecisionPlanV2,
  reportContent: SplitReportContentV2,
) {
  const expected = buildChangeConditionCommentaryV4(
    decisionPlan as unknown as DecisionPlan,
  );
  return (
    expected.length === reportContent.change_condition_commentary.length &&
    expected.every(
      (value, index) =>
        reportContent.change_condition_commentary[index] === value,
    )
  );
}
