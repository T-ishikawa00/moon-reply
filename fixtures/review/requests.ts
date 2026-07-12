export type ReviewRequestFixture = {
  id: string;
  ageGroup: string;
  nickname: string;
  relationship: string;
  relationshipStatus: string[];
  replyWait: string;
  lastPartnerMessage: string;
  lastOwnMessage: string;
  draftMessage: string;
  recentFlow: string;
  mainConcern: string;
  desiredAction: string;
  mainQuestion: string;
  sendTonight: string;
  email: string;
  safetyFlags: string[];
  acknowledged: boolean;
};

const normalRequest: ReviewRequestFixture = {
  id: "request-normal-001",
  ageGroup: "25〜29歳",
  nickname: "みな",
  relationship: "付き合う前",
  relationshipStatus: ["何度か会っている", "最近返信が遅い"],
  replyWait: "1日",
  lastPartnerMessage: "相手：今日はありがとう。また落ち着いたら連絡するね。",
  lastOwnMessage: "自分：こちらこそありがとう。楽しかったです。",
  draftMessage: "自分：昨日はありがとう。また都合のよい日に話せたらうれしいです。",
  recentFlow: "二度会ったあと、相手の返信間隔が少し長くなりました。",
  mainConcern: "急かす印象にならないか不安です。",
  desiredAction: "落ち着いて一度だけ連絡し、その後は待ちたいです。",
  mainQuestion: "今夜送る場合の文面と、待つ場合の判断材料を整理したいです。",
  sendTonight: "迷っている",
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
    mainConcern: "強い束縛を感じており、通常の相談として扱えるか確認したいです。",
    safetyFlags: ["DV/モラハラ/強い束縛/恐怖がある"],
  },
  "request-rejected-001": {
    ...normalRequest,
    id: "request-rejected-001",
    nickname: "はる",
    email: "haru@example.invalid",
    desiredAction: "相手を待ち伏せすることを考えています。",
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
    ageGroup: "17歳",
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
