import type {
  ClarificationCodeV1,
  EligiblePrepaymentClassificationV1,
} from "@/lib/purchase/prepayment-safety-types-v1";
import type { PrePaymentSafetyStopKind } from "@/components/request/PrePaymentSafetyStop";

export type EligiblePrePaymentSafetyReviewFixture = {
  id: string;
  kind: "eligible";
  classification: EligiblePrepaymentClassificationV1;
  scopeLabel: string;
  heading: string;
  description: string;
  provides: readonly string[];
  draftAvailability: string;
  purchaseGateSatisfied: true;
  plannedPrice: "税込980円";
  paymentImplementationPresent: false;
  paymentSessionAvailable: false;
  paymentAuthorityIssued: false;
};

export type ClarificationPrePaymentSafetyReviewFixture = {
  id: string;
  kind: "clarification";
  heading: "もう少しだけ確認させてください";
  description: string;
  requiredClarificationCodes: readonly ClarificationCodeV1[];
  purchaseGateSatisfied: false;
  paymentImplementationPresent: false;
  paymentSessionAvailable: false;
  paymentAuthorityIssued: false;
};

export type StopPrePaymentSafetyReviewFixture = {
  id: string;
  kind: "stop";
  stopKind: PrePaymentSafetyStopKind;
  purchaseGateSatisfied: false;
  paymentImplementationPresent: false;
  paymentSessionAvailable: false;
  paymentAuthorityIssued: false;
};

export type PrePaymentSafetyReviewFixture =
  | EligiblePrePaymentSafetyReviewFixture
  | ClarificationPrePaymentSafetyReviewFixture
  | StopPrePaymentSafetyReviewFixture;

const paymentAbsent = {
  paymentImplementationPresent: false,
  paymentSessionAvailable: false,
  paymentAuthorityIssued: false,
} as const;

function eligible(
  fixture: Omit<
    EligiblePrePaymentSafetyReviewFixture,
    | "kind"
    | "purchaseGateSatisfied"
    | "plannedPrice"
    | keyof typeof paymentAbsent
  >,
): EligiblePrePaymentSafetyReviewFixture {
  return {
    ...fixture,
    kind: "eligible",
    purchaseGateSatisfied: true,
    plannedPrice: "税込980円",
    ...paymentAbsent,
  };
}

function clarification(
  fixture: Pick<
    ClarificationPrePaymentSafetyReviewFixture,
    "id" | "description" | "requiredClarificationCodes"
  >,
): ClarificationPrePaymentSafetyReviewFixture {
  return {
    ...fixture,
    kind: "clarification",
    heading: "もう少しだけ確認させてください",
    purchaseGateSatisfied: false,
    ...paymentAbsent,
  };
}

function stop(
  id: string,
  stopKind: PrePaymentSafetyStopKind,
): StopPrePaymentSafetyReviewFixture {
  return {
    id,
    kind: "stop",
    stopKind,
    purchaseGateSatisfied: false,
    ...paymentAbsent,
  };
}

export const PREPAYMENT_SAFETY_REVIEW_FIXTURES = {
  "eligible-general": eligible({
    id: "eligible-general",
    classification: "eligible_general",
    scopeLabel: "通常の鑑定",
    heading: "この内容は、通常の鑑定として確認できます。",
    description:
      "状況を整理し、今の方向性と次に見直す条件を鑑定ノートとしてお返しする想定です。",
    provides: ["確認できる事実の整理", "今の方向性", "次に見直す条件"],
    draftAvailability: "状況と依頼内容に合う場合は、文案を含むことがあります。",
  }),
  "eligible-pause-assessment": eligible({
    id: "eligible-pause-assessment",
    classification: "eligible_pause_assessment",
    scopeLabel: "今は送らない、という答えも含む鑑定",
    heading: "送らない時間も、迷いのままにしません。",
    description:
      "相手との距離を尊重しながら、\nいま確かめられること、\n今は送らない理由、\n今夜できること、\n何が変われば見直せるかまで、\nあなたの相談に沿って鑑定ノートにまとめます。",
    provides: [
      "いま確かめられること",
      "今は送らない理由",
      "今夜できること",
      "見直すための条件",
    ],
    draftAvailability:
      "状況によっては送信文案を表示しません。\nその場合も、鑑定ノートは通常どおりお返しします。",
  }),
  "eligible-boundary-support-only": eligible({
    id: "eligible-boundary-support-only",
    classification: "eligible_boundary_support_only",
    scopeLabel: "連絡を重ねない今を整理する鑑定",
    heading: "連絡文案ではなく、気持ちと次の一歩を整理します。",
    description:
      "確認できることと、\nまだ分からないことを分けながら、\nご自身の気持ちと、\n相手が示した距離を越えずにできる次の一歩を\n鑑定ノートにまとめます。",
    provides: [
      "確認できること／まだ分からないこと",
      "ご自身の気持ちの整理",
      "今夜、自分側でできること",
      "今後の自分側の方向性",
    ],
    draftAvailability: "相手への連絡文案や再接触方法はお返ししません。",
  }),
  "eligible-scoped-reply": eligible({
    id: "eligible-scoped-reply",
    classification: "eligible_scoped_reply",
    scopeLabel: "最新の用件だけに限った返信鑑定",
    heading: "相手から届いた最新の文面の用件だけを扱います。",
    description:
      "新しい文面が明確に求めている返答だけに限定し、それを超える連絡許可は作らない想定です。",
    provides: ["最新の用件の整理", "用件内の返信方向", "範囲を広げない確認"],
    draftAvailability: "文案がある場合も、最新の用件の範囲だけに限定されます。",
  }),
  "eligible-business-only": eligible({
    id: "eligible-business-only",
    classification: "eligible_business_only",
    scopeLabel: "許可された実務用件だけの鑑定",
    heading: "明確に許可された実務上の用件だけを扱います。",
    description:
      "業務・荷物・金銭など、許可された実務上の用件だけに限定し、私的・恋愛的な内容は含めない想定です。",
    provides: ["許可された用件の整理", "実務範囲内の返信方向", "私的内容を広げない確認"],
    draftAvailability: "文案がある場合も、許可された実務上の用件だけに限定されます。",
  }),
  "needs-clarification": clarification({
    id: "needs-clarification",
    description:
      "購入へ進める判断はせず、相手との連絡状況と現在の安全について、必要な項目だけを短く確認します。",
    requiredClarificationCodes: [
      "boundary_state_required",
      "current_safety_status_required",
    ],
  }),
  "boundary-state-conflict": clarification({
    id: "boundary-state-conflict",
    description:
      "選択内容と相談文に食い違いがあるため、連絡状況または元の文章を見直してから利用確認をやり直します。",
    requiredClarificationCodes: [
      "boundary_state_conflict",
      "structured_content_conflict",
    ],
  }),
  "blocked-unsafe-assistance": stop(
    "blocked-unsafe-assistance",
    "blocked_unsafe_assistance",
  ),
  "urgent-safety-redirect": stop(
    "urgent-safety-redirect",
    "urgent_safety_redirect",
  ),
  "unsupported-professional-request": stop(
    "unsupported-professional-request",
    "unsupported_professional_request",
  ),
  "purchase-gate-ready-payment-absent": eligible({
    id: "purchase-gate-ready-payment-absent",
    classification: "eligible_general",
    scopeLabel: "利用確認済みの通常鑑定",
    heading: "利用確認は完了しています。決済機能はまだありません。",
    description:
      "現在の入力で利用確認と必要確認が完了した状態です。料金表示は計画上の案内であり、この画面では料金は発生しません。",
    provides: ["確認できる事実の整理", "今の方向性", "次に見直す条件"],
    draftAvailability: "状況と依頼内容に合う場合は、文案を含むことがあります。",
  }),
} satisfies Record<string, PrePaymentSafetyReviewFixture>;

export type PrePaymentSafetyReviewFixtureId =
  keyof typeof PREPAYMENT_SAFETY_REVIEW_FIXTURES;

export function getPrePaymentSafetyReviewFixture(
  id: string,
): PrePaymentSafetyReviewFixture | undefined {
  if (
    !Object.prototype.hasOwnProperty.call(
      PREPAYMENT_SAFETY_REVIEW_FIXTURES,
      id,
    )
  ) {
    return undefined;
  }
  return PREPAYMENT_SAFETY_REVIEW_FIXTURES[
    id as PrePaymentSafetyReviewFixtureId
  ];
}
