import type { DecisionPlan, ReportContent } from "./types.ts";

export const CHANGE_CONDITION_GROUNDING_V4_VERSION =
  "m2-p4-change-condition-grounding-v4" as const;

function normalizeCondition(condition: string) {
  const trimmed = condition.trim();
  const withoutTrailingPunctuation = trimmed.replace(/[。．.!！?？]+$/u, "");
  return withoutTrailingPunctuation.length > 0
    ? withoutTrailingPunctuation
    : trimmed;
}

export function buildChangeConditionCommentaryV4(
  decisionPlan: DecisionPlan,
): string[] {
  return decisionPlan.change_conditions.map(
    ({ condition }) =>
      `「${normalizeCondition(condition)}」が確認された場合は、その時点で状況を見直します。`,
  );
}

export function groundChangeConditionCommentaryV4(
  decisionPlan: DecisionPlan,
  reportContent: ReportContent,
): ReportContent {
  return {
    ...reportContent,
    change_condition_commentary:
      buildChangeConditionCommentaryV4(decisionPlan),
  };
}
