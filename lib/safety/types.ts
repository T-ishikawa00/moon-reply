export type SafetyClassification =
  | "normal_allowed"
  | "needs_review"
  | "rejected";

export type SafetyReasonCode =
  | "self_harm"
  | "harm_others"
  | "dv_abuse_fear"
  | "stalking_or_visit"
  | "waiting_or_ambush"
  | "threat_or_coercion"
  | "minor_related"
  | "doxxing"
  | "surveillance"
  | "none_selected"
  | "contradictory_selection"
  | "free_text_high_risk"
  | "normal";

export type SafetySeverity = "normal" | "review" | "reject";

export type SafetySelectedFlag =
  | "自分を傷つけたい気持ちがある"
  | "相手を傷つけたい気持ちがある"
  | "相手の家や職場に行こうとしている"
  | "待ち伏せを考えている"
  | "相手を脅す文面を送りたい"
  | "DV/モラハラ/強い束縛/恐怖がある"
  | "未成年との恋愛・面会に関する相談である"
  | "実名や個人情報を晒したい"
  | "監視・ログイン確認・居場所確認をしたい"
  | "上記には当てはまらない";

export type SafetyInput = {
  selectedFlags: string[];
  draftMessage?: string;
  recentFlow?: string;
  mainConcern?: string;
  desiredAction?: string;
  mainQuestion?: string;
};

export type SafetyResult = {
  classification: SafetyClassification;
  severity: SafetySeverity;
  reasonCodes: SafetyReasonCode[];
  shouldBlockNormalConfirmation: boolean;
  userTitle: string;
  userMessage: string;
};
