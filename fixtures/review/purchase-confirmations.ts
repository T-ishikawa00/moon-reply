import { getRequestFixture, type ReviewRequestFixture, type ReviewRequestFixtureId } from "./requests";
import { getReviewSafetyState } from "./safety-states";

export type ReviewPurchaseConfirmationFixture = {
  id: string;
  requestFixtureId: ReviewRequestFixtureId;
  safetyState: "normal_allowed";
  product: {
    name: string;
    officialClassification: string;
    userFacingLabel: string;
    price: "税込980円";
    quantity: "1相談 / 1鑑定ノート";
    purchaseType: "一度きりの購入";
    renewal: "自動更新なし";
    subscription: "none";
    coinsPointsTickets: "none";
  };
  transactionState: "not_started";
  provider: "unselected";
  deliveryTiming: "unresolved";
};

const normalPurchaseConfirmation: ReviewPurchaseConfirmationFixture = {
  id: "normal-001",
  requestFixtureId: "request-normal-001",
  safetyState: "normal_allowed",
  product: {
    name: "月の返事 単発鑑定ノート",
    officialClassification: "AIを活用した恋愛メッセージ分析・判断支援デジタルレポート",
    userFacingLabel: "恋のメッセージ鑑定ノート",
    price: "税込980円",
    quantity: "1相談 / 1鑑定ノート",
    purchaseType: "一度きりの購入",
    renewal: "自動更新なし",
    subscription: "none",
    coinsPointsTickets: "none",
  },
  transactionState: "not_started",
  provider: "unselected",
  deliveryTiming: "unresolved",
};

export const PURCHASE_CONFIRMATION_FIXTURES = {
  "normal-001": normalPurchaseConfirmation,
} satisfies Record<string, ReviewPurchaseConfirmationFixture>;

export type ReviewPurchaseConfirmationFixtureId = keyof typeof PURCHASE_CONFIRMATION_FIXTURES;

export type ResolvedReviewPurchaseConfirmation = {
  purchase: ReviewPurchaseConfirmationFixture;
  request: ReviewRequestFixture;
};

function hasAdultAgeGroup(ageGroup: string) {
  const leadingAge = Number.parseInt(ageGroup.match(/^\d+/)?.[0] ?? "", 10);
  return Number.isFinite(leadingAge) && leadingAge >= 18;
}

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
    || !hasAdultAgeGroup(request.ageGroup)
    || !request.email.endsWith(".invalid")
    || request.safetyFlags.length !== 1
    || request.safetyFlags[0] !== "上記には当てはまらない"
  ) {
    return undefined;
  }

  return { purchase, request };
}
