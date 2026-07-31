import type { Decision, DecisionPlan, ReportContent } from "./types.ts";

const directionCommentary: Record<Decision, string> = {
  reply_now: "短く返信する方向へ見直します。",
  send_now: "必要な連絡を送る方向へ見直します。",
  wait_and_reassess:
    "送信を急がず、いったん見直す方向へ切り替えます。",
  pause_additional_contact: "追加連絡を止める方向へ切り替えます。",
};

function normalizeCondition(condition: string) {
  const trimmed = condition.trim();
  const withoutTrailingPunctuation = trimmed.replace(/[。．.!！?？]+$/u, "");
  return withoutTrailingPunctuation.length > 0
    ? withoutTrailingPunctuation
    : trimmed;
}

export function buildChangeConditionCommentaryV3(
  decisionPlan: DecisionPlan,
): string[] {
  return decisionPlan.change_conditions.map(
    ({ condition, resulting_direction: resultingDirection }) =>
      `「${normalizeCondition(condition)}」という条件が確認された場合は、その時点では${directionCommentary[resultingDirection]}`,
  );
}

export function groundChangeConditionCommentaryV3(
  decisionPlan: DecisionPlan,
  reportContent: ReportContent,
): ReportContent {
  return {
    ...reportContent,
    change_condition_commentary:
      buildChangeConditionCommentaryV3(decisionPlan),
  };
}
