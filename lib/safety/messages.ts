import type { SafetyClassification } from "./types";

type SafetyMessage = {
  userTitle: string;
  userMessage: string;
};

export const SAFETY_MESSAGES: Record<SafetyClassification, SafetyMessage> = {
  normal_allowed: {
    userTitle: "通常鑑定に進める内容です",
    userMessage:
      "現在の入力内容では、月の返事の通常鑑定として扱える範囲に見えます。公開MVPでは、このあと安全チェック、決済、AI鑑定生成へ進みます。",
  },
  needs_review: {
    userTitle: "通常鑑定の前に確認が必要な内容です",
    userMessage:
      "入力内容に、通常の恋愛鑑定としてそのまま扱うには慎重な確認が必要な要素があります。月の返事では、不安を煽ったり、危険な関係を美化する鑑定は行いません。公開MVPでは、安全チェック後に通常鑑定へ進めない場合があります。",
  },
  rejected: {
    userTitle: "通常鑑定として扱えない可能性が高い内容です",
    userMessage:
      "入力内容に、自分や相手の安全、待ち伏せ、脅し、監視、未成年、個人情報などに関わる可能性があります。この内容について、月の返事は恋愛鑑定として背中を押すことはできません。公開MVPでは、通常鑑定へ進まず、返金または別案内になる可能性があります。",
  },
};

export const CONTRADICTORY_SELECTION_MESSAGE: SafetyMessage = {
  userTitle: "安全確認の選択を見直してください",
  userMessage:
    "危険項目と「上記には当てはまらない」が同時に選択されています。通常鑑定へ進む前に、安全確認の選択を見直してください。",
};
