export type ReviewRequestFixture = {
  id: string;
  adultConfirmed: boolean;
  nickname: string;
  relationship: string;
  whatToKnow: string[];
  currentSituation: string;
  partnerMessage: string;
  draftMessage: string;
  email: string;
  safetyFlags: string[];
  acknowledged: boolean;
};

const normalRequest: ReviewRequestFixture = {
  id: "request-normal-001",
  adultConfirmed: true,
  nickname: "みな",
  relationship: "付き合う前",
  whatToKnow: [
    "送るか待つか決めたい",
    "この文面がどう届くか知りたい",
  ],
  currentSituation:
    "二度会ったあと、相手の返信間隔が少し長くなりました。昨日から返事を待っています。急かす印象にならないよう、落ち着いて一度だけ連絡するか、今夜は待つかを決めたいです。",
  partnerMessage: "相手：今日はありがとう。また落ち着いたら連絡するね。",
  draftMessage:
    "自分：昨日はありがとう。また都合のよい日に話せたらうれしいです。",
  email: "mina@example.invalid",
  safetyFlags: ["上記には当てはまらない"],
  acknowledged: true,
};

export const REQUEST_FIXTURES = {
  "request-normal-001": normalRequest,
  "request-needs-review-001": {
    ...normalRequest,
    id: "request-needs-review-001",
    nickname: "あお",
    email: "ao@example.invalid",
    currentSituation:
      "強い束縛を感じており、通常の相談として扱えるか確認したいです。",
    safetyFlags: ["DV/モラハラ/強い束縛/恐怖がある"],
  },
  "request-rejected-001": {
    ...normalRequest,
    id: "request-rejected-001",
    nickname: "はる",
    email: "haru@example.invalid",
    currentSituation: "返事がなく、相手を待ち伏せすることを考えています。",
    draftMessage: "",
    safetyFlags: ["待ち伏せを考えている"],
  },
  "request-contradictory-001": {
    ...normalRequest,
    id: "request-contradictory-001",
    nickname: "なぎ",
    email: "nagi@example.invalid",
    safetyFlags: ["待ち伏せを考えている", "上記には当てはまらない"],
  },
  "request-invalid-age-001": {
    ...normalRequest,
    id: "request-invalid-age-001",
    adultConfirmed: false,
    nickname: "そら",
    email: "sora@example.invalid",
  },
  "request-missing-consent-001": {
    ...normalRequest,
    id: "request-missing-consent-001",
    nickname: "つき",
    email: "tsuki@example.invalid",
    acknowledged: false,
  },
  "request-error-001": {
    ...normalRequest,
    id: "request-error-001",
    nickname: "未確認",
    email: "unknown@example.invalid",
  },
} satisfies Record<string, ReviewRequestFixture>;

export type ReviewRequestFixtureId = keyof typeof REQUEST_FIXTURES;

export function getRequestFixture(id: string) {
  return Object.prototype.hasOwnProperty.call(REQUEST_FIXTURES, id)
    ? REQUEST_FIXTURES[id as ReviewRequestFixtureId]
    : undefined;
}
