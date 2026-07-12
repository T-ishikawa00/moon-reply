import { REQUEST_FIXTURES } from "./requests";

export type ReviewSafetyState = {
  slug: string;
  stateName: string;
  fixtureId: keyof typeof REQUEST_FIXTURES;
  userTitle: string;
  userMessage: string;
  allowedAction: { label: string; href: string };
  prohibitedActions: string[];
  correctionDestination?: { label: string; href: string };
  canReachConfirmation: boolean;
};

export const REVIEW_SAFETY_STATES = {
  "normal-allowed": {
    slug: "normal-allowed",
    stateName: "normal_allowed",
    fixtureId: "request-normal-001",
    userTitle: "通常鑑定の確認に進める内容です",
    userMessage: "入力内容と安全確認に矛盾はありません。これは相手の本心・返信・復縁・将来を保証する判定ではありません。",
    allowedAction: { label: "依頼内容の確認へ", href: "/review/request/confirmation/normal-001" },
    prohibitedActions: ["実際の送信", "データ保存", "決済開始", "AI鑑定生成"],
    correctionDestination: { label: "Step 3へ戻って修正", href: "/request#step-3" },
    canReachConfirmation: true,
  },
  "needs-review": {
    slug: "needs-review",
    stateName: "needs_review",
    fixtureId: "request-needs-review-001",
    userTitle: "通常鑑定の前に慎重な確認が必要です",
    userMessage: "安全に関わる可能性があるため、この状態から通常鑑定の確認には進めません。不安を煽ったり、危険な関係を美化したりする案内は行いません。",
    allowedAction: { label: "Step 3へ戻って内容を見直す", href: "/request#step-3" },
    prohibitedActions: ["通常確認への続行", "購入", "通常レポート", "恋愛行動の提案"],
    correctionDestination: { label: "安全確認", href: "/request#step-3" },
    canReachConfirmation: false,
  },
  rejected: {
    slug: "rejected",
    stateName: "rejected",
    fixtureId: "request-rejected-001",
    userTitle: "月の返事の通常鑑定として扱えません",
    userMessage: "安全を優先するため、この内容を通常の恋愛鑑定として後押しすることはできません。緊急状態を断定したり、未確認の相談先を表示したりはしません。",
    allowedAction: { label: "Step 3へ戻って内容を見直す", href: "/request#step-3" },
    prohibitedActions: ["通常確認への続行", "購入", "通常レポート", "危険な行動の助言"],
    correctionDestination: { label: "安全確認", href: "/request#step-3" },
    canReachConfirmation: false,
  },
  "contradictory-selection": {
    slug: "contradictory-selection",
    stateName: "contradictory_selection",
    fixtureId: "request-contradictory-001",
    userTitle: "安全確認の選択を見直してください",
    userMessage: "危険項目と「上記には当てはまらない」は同時に選択できません。これは緊急状態の判定ではなく、修正が必要な入力矛盾です。",
    allowedAction: { label: "Step 3で選択を修正する", href: "/request#step-3" },
    prohibitedActions: ["通常確認への続行", "購入", "通常レポート"],
    correctionDestination: { label: "Step 3・安全確認", href: "/request#step-3" },
    canReachConfirmation: false,
  },
  "invalid-age": {
    slug: "invalid-age",
    stateName: "invalid_age",
    fixtureId: "request-invalid-age-001",
    userTitle: "月の返事は18歳以上の方を対象としています",
    userMessage: "対象年齢を確認できないため、この状態から先には進めません。生年月日や本人確認書類の提出は求めません。",
    allowedAction: { label: "Step 1で年齢層を確認する", href: "/request#step-1" },
    prohibitedActions: ["通常確認への続行", "購入", "通常レポート"],
    correctionDestination: { label: "Step 1・年齢層", href: "/request#step-1" },
    canReachConfirmation: false,
  },
  "missing-consent": {
    slug: "missing-consent",
    stateName: "missing_consent",
    fixtureId: "request-missing-consent-001",
    userTitle: "必要な同意事項を確認してください",
    userMessage: "上記の内容を確認し、同意してください。必須同意は1つのチェックボックスで確認します。マーケティング同意は含みません。",
    allowedAction: { label: "Step 3で同意を確認する", href: "/request#step-3" },
    prohibitedActions: ["通常確認への続行", "購入", "通常レポート", "同意の事前選択"],
    correctionDestination: { label: "Step 3・確認／同意事項", href: "/request#step-3" },
    canReachConfirmation: false,
  },
  "unknown-error": {
    slug: "unknown-error",
    stateName: "unknown_error",
    fixtureId: "request-error-001",
    userTitle: "状態を確認できません",
    userMessage: "安全のため通常状態とはみなさず、確認・購入・レポートには進めません。入力画面からやり直してください。",
    allowedAction: { label: "入力画面に戻る", href: "/request" },
    prohibitedActions: ["通常状態への自動置換", "購入", "通常レポート", "データ保存"],
    correctionDestination: { label: "入力画面", href: "/request" },
    canReachConfirmation: false,
  },
} satisfies Record<string, ReviewSafetyState>;

export type ReviewSafetyStateSlug = keyof typeof REVIEW_SAFETY_STATES;

export function getReviewSafetyState(slug: string) {
  return Object.prototype.hasOwnProperty.call(REVIEW_SAFETY_STATES, slug)
    ? REVIEW_SAFETY_STATES[slug as ReviewSafetyStateSlug]
    : undefined;
}
