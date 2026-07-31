import type { DecisionFactsV2 } from "./contextual-inference-v3.ts";
import type { ReportContent } from "./types.ts";

export function buildRelationshipSummaryV3(
  decisionFacts: DecisionFactsV2,
): string {
  const message = decisionFacts.latest_direct_message;

  if (message.sender === "other_person") {
    if (message.user_reply_state === "not_replied") {
      return "相手から届いたメッセージに、あなたがまだ返信していない状態です。";
    }
    if (message.user_reply_state === "replied") {
      return "相手から届いたメッセージに、あなたが返信済みの状態です。";
    }
    return "相手から届いたメッセージが最後の直接メッセージです。返信状況は断定せず、確認できる範囲から判断しています。";
  }

  if (message.sender === "user") {
    return "あなたが最後に送ったメッセージへの、相手の返信を待っている状態です。";
  }

  if (message.sender === "none") {
    return "現時点では、判断対象となる直接メッセージが確認できない状態です。";
  }

  return "最後の送信者は断定せず、現時点で確認できる範囲から判断しています。";
}

export function groundReportContentV3(
  decisionFacts: DecisionFactsV2,
  generatedReportContent: ReportContent,
): ReportContent {
  return {
    ...generatedReportContent,
    relationship_summary: buildRelationshipSummaryV3(decisionFacts),
  };
}
