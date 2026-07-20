import type {
  SafetyClassification,
  SafetyReasonCode,
  SafetySelectedFlag,
  SafetySeverity,
} from "./types";

export const NONE_SAFETY_FLAG: SafetySelectedFlag = "上記には当てはまらない";

export const SAFETY_SELECTED_FLAGS: SafetySelectedFlag[] = [
  "自分を傷つけたい気持ちがある",
  "相手を傷つけたい気持ちがある",
  "相手の家や職場に行こうとしている",
  "待ち伏せを考えている",
  "相手を脅す文面を送りたい",
  "DV/モラハラ/強い束縛/恐怖がある",
  "未成年との恋愛・面会に関する相談である",
  "実名や個人情報を晒したい",
  "監視・ログイン確認・居場所確認をしたい",
  NONE_SAFETY_FLAG,
];

export type SelectedFlagRule = {
  severity: SafetySeverity;
  reasonCode: SafetyReasonCode;
};

export const SELECTED_FLAG_RULES: Record<SafetySelectedFlag, SelectedFlagRule> =
  {
    "自分を傷つけたい気持ちがある": {
      severity: "reject",
      reasonCode: "self_harm",
    },
    "相手を傷つけたい気持ちがある": {
      severity: "reject",
      reasonCode: "harm_others",
    },
    "相手の家や職場に行こうとしている": {
      severity: "reject",
      reasonCode: "stalking_or_visit",
    },
    "待ち伏せを考えている": {
      severity: "reject",
      reasonCode: "waiting_or_ambush",
    },
    "相手を脅す文面を送りたい": {
      severity: "reject",
      reasonCode: "threat_or_coercion",
    },
    "DV/モラハラ/強い束縛/恐怖がある": {
      severity: "review",
      reasonCode: "dv_abuse_fear",
    },
    "未成年との恋愛・面会に関する相談である": {
      severity: "reject",
      reasonCode: "minor_related",
    },
    "実名や個人情報を晒したい": {
      severity: "reject",
      reasonCode: "doxxing",
    },
    "監視・ログイン確認・居場所確認をしたい": {
      severity: "reject",
      reasonCode: "surveillance",
    },
    "上記には当てはまらない": {
      severity: "normal",
      reasonCode: "normal",
    },
  };

export type FreeTextRiskRule = {
  classification: Exclude<SafetyClassification, "normal_allowed">;
  reasonCode: Exclude<SafetyReasonCode, "free_text_high_risk" | "normal">;
  keywords: string[];
  excludedPhrases?: string[];
};

export const FREE_TEXT_RISK_RULES: FreeTextRiskRule[] = [
  {
    classification: "rejected",
    reasonCode: "self_harm",
    keywords: [
      "死にたい",
      "消えたい",
      "自分を傷つけ",
      "生きていたくない",
      "終わりにしたい",
    ],
  },
  {
    classification: "rejected",
    reasonCode: "harm_others",
    keywords: ["殺したい", "傷つけたい"],
    excludedPhrases: ["自分を傷つけたい"],
  },
  {
    classification: "rejected",
    reasonCode: "threat_or_coercion",
    keywords: ["脅す", "脅迫", "強要", "従わせる", "言うことを聞かせる"],
  },
  {
    classification: "rejected",
    reasonCode: "doxxing",
    keywords: [
      "晒す",
      "晒そう",
      "ばらす",
      "個人情報を公開する",
      "本名を公開する",
      "住所を公開する",
    ],
  },
  {
    classification: "rejected",
    reasonCode: "waiting_or_ambush",
    keywords: ["待ち伏せ"],
  },
  {
    classification: "rejected",
    reasonCode: "stalking_or_visit",
    keywords: [
      "家に行く",
      "家へ行く",
      "家に行こう",
      "家へ行こう",
      "職場に行く",
      "職場へ行く",
      "職場に行こう",
      "職場へ行こう",
      "家や職場に行こう",
      "家や職場へ行こう",
      "押しかける",
      "押しかけよう",
    ],
    excludedPhrases: [
      "家に行く予定はありません",
      "家へ行く予定はありません",
      "職場に行く予定はありません",
      "職場へ行く予定はありません",
      "家や職場に行く予定はありません",
      "家や職場へ行く予定はありません",
      "押しかけるつもりはありません",
    ],
  },
  {
    classification: "rejected",
    reasonCode: "surveillance",
    keywords: ["監視", "ログイン", "居場所"],
  },
  {
    classification: "rejected",
    reasonCode: "minor_related",
    keywords: ["未成年", "18歳未満"],
  },
  {
    classification: "needs_review",
    reasonCode: "dv_abuse_fear",
    keywords: ["DV", "モラハラ", "強い束縛", "暴力", "殴られ"],
  },
  {
    classification: "rejected",
    reasonCode: "illegal_conduct",
    keywords: [
      "違法行為を含む",
      "違法行為を含み",
      "違法行為を助長する",
      "違法な方法を使う",
      "犯罪を手伝う",
      "犯罪を助ける",
    ],
  },
  {
    classification: "rejected",
    reasonCode: "third_party_secret",
    keywords: [
      "第三者の秘密情報を含む",
      "第三者の秘密情報を使う",
      "他人の秘密情報を含む",
      "他人の秘密情報を使う",
      "機密情報を使う",
    ],
  },
];
