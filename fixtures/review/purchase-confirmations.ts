import { getRequestFixture, type ReviewRequestFixture, type ReviewRequestFixtureId } from "./requests";
import { getReviewSafetyState } from "./safety-states";

export type ReviewPurchaseConfirmationFixture = {
  id: string;
  requestFixtureId: ReviewRequestFixtureId;
  safetyState: "normal_allowed";
  product: {
    serviceName: "月の返事";
    name: string;
    officialClassification: string;
    userFacingLabel: string;
    price: "税込980円";
    quantity: "1相談 / 1鑑定ノート";
    purchaseType: "一度きりの購入";
    renewal: "自動更新なし";
    subscription: "none";
    coinsPointsTickets: "none";
    included: readonly ["Web鑑定ノート", "保存用判断カード"];
  };
  adultConfirmation: {
    statement: "私は18歳以上です";
    confirmed: true;
  };
  deliveryRecoveryEmail: {
    addressSource: "request_fixture";
    verificationStatus: "未実装（審査用表示）";
  };
  safetyEligibility: "安全確認済みの固定レビュー例・本番の有料フロー確認は未実装";
  paymentMethod: "未確定・未接続";
  paymentTiming: "未確定・未接続";
  deliveryMethod: "保護された結果ページと、確認済みの配信・回復用メールへの通知（予定）";
  transactionState: "not_started";
  provider: "unselected";
  deliveryTiming: "未確定・本番相当の計測待ち";
};

const normalPurchaseConfirmation: ReviewPurchaseConfirmationFixture = {
  id: "normal-001",
  requestFixtureId: "request-normal-001",
  safetyState: "normal_allowed",
  product: {
    serviceName: "月の返事",
    name: "恋のメッセージ鑑定ノート",
    officialClassification: "AIを活用した恋愛メッセージ分析・判断支援デジタルレポート",
    userFacingLabel: "恋のメッセージ鑑定ノート",
    price: "税込980円",
    quantity: "1相談 / 1鑑定ノート",
    purchaseType: "一度きりの購入",
    renewal: "自動更新なし",
    subscription: "none",
    coinsPointsTickets: "none",
    included: ["Web鑑定ノート", "保存用判断カード"],
  },
  adultConfirmation: {
    statement: "私は18歳以上です",
    confirmed: true,
  },
  deliveryRecoveryEmail: {
    addressSource: "request_fixture",
    verificationStatus: "未実装（審査用表示）",
  },
  safetyEligibility: "安全確認済みの固定レビュー例・本番の有料フロー確認は未実装",
  paymentMethod: "未確定・未接続",
  paymentTiming: "未確定・未接続",
  deliveryMethod: "保護された結果ページと、確認済みの配信・回復用メールへの通知（予定）",
  transactionState: "not_started",
  provider: "unselected",
  deliveryTiming: "未確定・本番相当の計測待ち",
};

export const PURCHASE_CONFIRMATION_FIXTURES = {
  "normal-001": normalPurchaseConfirmation,
} satisfies Record<string, ReviewPurchaseConfirmationFixture>;

export type ReviewPurchaseConfirmationFixtureId = keyof typeof PURCHASE_CONFIRMATION_FIXTURES;

export type ResolvedReviewPurchaseConfirmation = {
  purchase: ReviewPurchaseConfirmationFixture;
  request: ReviewRequestFixture;
};

export function getPurchaseConfirmationFixture(id: string): ResolvedReviewPurchaseConfirmation | undefined {
  if (!Object.prototype.hasOwnProperty.call(PURCHASE_CONFIRMATION_FIXTURES, id)) return undefined;

  const purchase = PURCHASE_CONFIRMATION_FIXTURES[id as ReviewPurchaseConfirmationFixtureId];
  const request = getRequestFixture(purchase.requestFixtureId);
  const allowedState = getReviewSafetyState("normal-allowed");

  if (
    !request
    || purchase.id !== id
    || request.id !== purchase.requestFixtureId
    || purchase.safetyState !== "normal_allowed"
    || allowedState?.stateName !== "normal_allowed"
    || allowedState.fixtureId !== purchase.requestFixtureId
    || !allowedState.canReachConfirmation
    || !request.acknowledged
    || !request.adultConfirmed
    || purchase.adultConfirmation.statement !== "私は18歳以上です"
    || purchase.adultConfirmation.confirmed !== request.adultConfirmed
    || purchase.deliveryRecoveryEmail.addressSource !== "request_fixture"
    || purchase.deliveryRecoveryEmail.verificationStatus !== "未実装（審査用表示）"
    || purchase.paymentMethod !== "未確定・未接続"
    || purchase.paymentTiming !== "未確定・未接続"
    || purchase.deliveryTiming !== "未確定・本番相当の計測待ち"
    || !request.email.endsWith(".invalid")
    || request.safetyFlags.length !== 1
    || request.safetyFlags[0] !== "上記には当てはまらない"
  ) {
    return undefined;
  }

  return { purchase, request };
}
