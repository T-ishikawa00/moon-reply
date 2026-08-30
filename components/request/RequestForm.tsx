"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FormEvent,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { PurchasePaymentPanel } from "@/components/payment/PurchasePaymentPanel";
import {
  PrePaymentSafetyStop,
  type PrePaymentSafetyStopKind,
} from "./PrePaymentSafetyStop";
import styles from "./PrePaymentSafetyStop.module.css";
import {
  ACKNOWLEDGEMENT_CODES,
  CLARIFICATION_CODES,
  CURRENT_SAFETY_STATUS_ANSWERS,
  ELIGIBLE_DELIVERY_SCOPES,
  ELIGIBLE_PREPAYMENT_CLASSIFICATIONS,
  OUTPUT_KINDS,
  PREPAYMENT_SAFETY_CLASSIFICATIONS,
  PREPAYMENT_SAFETY_INPUT_SCHEMA_VERSION,
  PREPAYMENT_SAFETY_POLICY_VERSION,
  PREPAYMENT_SAFETY_RESULT_SCHEMA_VERSION,
  REQUESTED_TOPIC_VALUES,
  REASON_CODES,
  SAFETY_DISPOSITIONS,
  UNSAFE_EXECUTION_INTENT_ANSWERS,
  type AcknowledgementCodeV1,
  type ClarificationAnswersV1,
  type ClarificationCodeV1,
  type ContactBoundaryStateV1,
  type EligiblePrepaymentClassificationV1,
  type PrepaymentSafetyInputV1,
  type RelationshipValue,
  type RequestedAssistanceGoalV1,
  type RequestedTopic,
  type ScopeAcknowledgementsV1,
} from "@/lib/purchase/prepayment-safety-types-v1";
import {
  JPY980_PRODUCT_SCOPE_CLARIFICATION_CODES,
  JPY980_PRODUCT_SCOPE_DECISIONS,
  JPY980_PRODUCT_SCOPE_VALIDATION_V1_VERSION,
} from "@/lib/assessment/runtime/jpy980-product-scope-validation-v1";
import { trackClientMeasurement } from "@/lib/measurement/client";
import {
  beginGoogleAuthClientTiming,
  completeGoogleAuthClientTiming,
  readGoogleAuthLatencyTraceHeader,
  type GoogleAuthClientTimingAnchor,
} from "@/lib/measurement/auth-latency";
import {
  buildPublicClarificationAnswerV1,
  classifyClarificationContinuationV1,
  isPublicClarificationTargetV1,
  PUBLIC_CLARIFICATION_CONTROLS_V1,
  publicClarificationDetailRequiredV1,
  publicClarificationDetailVisibleV1,
} from "@/lib/assessment/production/public-clarification-contract-v1";
import { postProductionPreparationWithRecovery } from "@/lib/assessment/production/preparation-response-recovery";
import type { Jpy980ClarificationTarget } from "@/lib/assessment/runtime/types";
import {
  candidateMessageRequired,
  MESSAGE_IMPACT_TOPIC_LABEL,
  validateCandidateMessage,
} from "./request-form-candidate-message";

export type RequestFormData = {
  adultConfirmed: boolean;
  nickname: string;
  relationship: string;
  whatToKnow: string[];
  currentSituation: string;
  partnerMessage: string;
  draftMessage: string;
  email: string;
};

type Phase = 1 | 2 | 3 | 4;
type CustomerAuthMethod = "google" | "email_otp";
type SafetySelectionState = {
  contactBoundaryState: ContactBoundaryStateV1 | "";
  requestedAssistanceGoal: RequestedAssistanceGoalV1 | "";
  clarificationAnswers: ClarificationAnswersV1;
  scopeAcknowledgements: ScopeAcknowledgementsV1;
  attestationConfirmed: boolean;
};
type ErrorKey =
  | keyof RequestFormData
  | "contactBoundaryState"
  | "requestedAssistanceGoal"
  | "clarification"
  | "scopeAcknowledgements"
  | "attestationConfirmed"
  | "safetyBlocking";
type ValidationErrors = Partial<Record<ErrorKey, string>>;

type ProductionPreparationOutcome =
  | { status: "authentication_required"; preparationCapability: string }
  | { status: "purchase_ready"; preparationCapability: string }
  | {
      status: "needs_one_clarifying_answer";
      clarificationCapability: string;
      target: Jpy980ClarificationTarget;
      question: string;
      maximumQuestionsTotal: 1;
    }
  | { status: "not_full_product_candidate" | "safety_blocked" };

type ProductionPurchaseFlow =
  | { status: "idle" }
  | { status: "preparing" }
  | {
      status: "product_clarification";
      clarificationCapability: string;
      target: Jpy980ClarificationTarget;
      question: string;
      answerValue: string;
      answerDetail: string;
    }
  | { status: "sending_verification"; preparationCapability: string }
  | { status: "auth_method"; preparationCapability: string }
  | { status: "auth_email_requesting"; preparationCapability: string }
  | { status: "auth_google_redirecting"; preparationCapability: string }
  | {
      status: "awaiting_auth_email_otp";
      preparationCapability: string;
      csrfToken: string;
      otp: string;
    }
  | {
      status: "awaiting_email_code";
      preparationCapability: string;
      challengeCapability: string;
      expiresAt: string;
      verificationCode: string;
    }
  | {
      status: "verified";
      preparationCapability: string;
      maskedEmail: string;
    }
  | {
      status: "checkout_starting";
      preparationCapability: string;
      maskedEmail: string;
    }
  | {
      status: "error";
      reason:
        | "technical_failure"
        | "not_full_product_candidate"
        | "safety_blocked";
      message: string;
    };

type ClientSafetyResult = {
  classification: (typeof PREPAYMENT_SAFETY_CLASSIFICATIONS)[number];
  requiredClarificationCodes: readonly ClarificationCodeV1[];
  requiredAcknowledgementCodes: readonly AcknowledgementCodeV1[];
  purchaseGateSatisfied: boolean;
  productScope: {
    accepted: boolean;
    decision: (typeof JPY980_PRODUCT_SCOPE_DECISIONS)[number];
    clarificationCode:
      | (typeof JPY980_PRODUCT_SCOPE_CLARIFICATION_CODES)[number]
      | null;
  };
};

type GatePrompt = Pick<
  ClientSafetyResult,
  "classification" | "requiredAcknowledgementCodes"
>;

type SafetyPresentation = {
  scopeLabel: string;
  heading: string;
  description: string;
  provides: readonly string[];
  draftAvailability: string;
};

type ContactBoundaryPresentationOption = {
  value: ContactBoundaryStateV1;
  label: string;
  helper?: string;
};

const initialFormState: RequestFormData = {
  adultConfirmed: false,
  nickname: "",
  relationship: "",
  whatToKnow: [],
  currentSituation: "",
  partnerMessage: "",
  draftMessage: "",
  email: "",
};

const emptyClarificationAnswers: ClarificationAnswersV1 = {
  submissionCount: 0,
  clarifiedContactBoundaryState: null,
  practicalPermissionExplicit: null,
  currentRequestPracticalScopeOnly: null,
  replyExplicitlyInvited: null,
  replyLimitedToExactSubject: null,
  professionalScopeLimitedToNonprofessionalOrganization: null,
  unsafeExecutionIntent: null,
  currentSafetyStatus: null,
};

const emptyScopeAcknowledgements: ScopeAcknowledgementsV1 = {
  pauseAssessmentDisclosureAcknowledged: false,
  boundarySupportOnlyDisclosureAcknowledged: false,
  scopedReplyScopeAcknowledged: false,
  businessOnlyScopeAcknowledged: false,
};

const initialSafetyState: SafetySelectionState = {
  contactBoundaryState: "",
  requestedAssistanceGoal: "",
  clarificationAnswers: emptyClarificationAnswers,
  scopeAcknowledgements: emptyScopeAcknowledgements,
  attestationConfirmed: false,
};

const relationshipOptions: readonly {
  label: string;
  value: RelationshipValue;
}[] = [
  { label: "付き合う前", value: "dating" },
  { label: "交際中", value: "in_relationship" },
  { label: "曖昧な関係", value: "ambiguous" },
  { label: "元恋人", value: "former_partner" },
  { label: "マッチングアプリ", value: "matching_app" },
  { label: "職場・学校・知人", value: "work_or_school" },
  { label: "その他", value: "other" },
];

const whatToKnowOptions: readonly {
  label: string;
  value: RequestedTopic;
}[] = [
  { label: "送るか待つか決めたい", value: "decide_send_or_wait" },
  { label: MESSAGE_IMPACT_TOPIC_LABEL, value: "message_impact" },
  { label: "送る文章を整えたい", value: "draft_message" },
  { label: "相手との関係を整理したい", value: "relationship" },
  { label: "これから3日どう動くか知りたい", value: "next_three_days" },
  { label: "不安を整理したい", value: "organize_emotions" },
];

const primaryContactBoundaryOptions: readonly ContactBoundaryPresentationOption[] = [
  {
    value: "no_restriction_known",
    label: "特に連絡の制限はない",
    helper: "連絡を控えるよう求められておらず、ブロック等もない",
  },
  {
    value: "temporary_pause",
    label: "少し時間を置いてほしいと言われている",
    helper:
      "『考える時間がほしい』『落ち着いたら連絡する』『今日は一人にしてほしい』など",
  },
  {
    value: "explicit_no_contact",
    label: "連絡しないでほしいと言われている",
    helper: "『連絡しないで』『これ以上連絡しないで』など",
  },
  {
    value: "channel_restricted",
    label: "ブロックなどで連絡手段が制限されている",
    helper: "ブロック、着信拒否など",
  },
  {
    value: "relationship_closed",
    label: "関係を終えたい意思を伝えられている",
  },
];

const secondaryContactBoundaryOptions: readonly ContactBoundaryPresentationOption[] = [
  {
    value: "business_only",
    label: "必要な連絡だけは許可されている",
    helper: "業務・荷物・金銭など、私的ではない用件に限られている",
  },
  {
    value: "new_inbound_after_boundary",
    label: "以前の制限後に、相手から新しい連絡が届いている",
    helper: "返信を求められているか、用件の範囲が明確かを確認します",
  },
  { value: "unknown", label: "どれに当てはまるか分からない" },
];

const urgentSafetyContactBoundaryOption: ContactBoundaryPresentationOption = {
  value: "urgent_safety",
  label: "安全に関わる緊急な状況がある",
  helper: "通常の鑑定ではなく、安全を優先した案内を表示します",
};

const primaryAssistanceOptions: readonly {
  value: RequestedAssistanceGoalV1;
  label: string;
}[] = [
  {
    value: "understand_and_organize",
    label: "状況や気持ちを整理し、今後の方向性を知りたい",
  },
  {
    value: "decide_send_wait_or_pause",
    label: "送る・待つ・追加連絡を止める判断を知りたい",
  },
  {
    value: "draft_within_current_permission",
    label: "現在許可されている範囲で、返信文案を考えたい",
  },
];

const secondaryAssistanceOptions: readonly {
  value: RequestedAssistanceGoalV1;
  label: string;
}[] = [
  {
    value: "recontact_or_overcome_boundary",
    label: "拒否・ブロック・距離置きがある状態でも、連絡する方法を知りたい",
  },
  {
    value: "alternate_channel_or_third_party",
    label: "別アカウント、別SNS、別番号、知人などを使う方法を知りたい",
  },
  {
    value: "monitor_track_or_manipulate",
    label: "相手の行動を監視・追跡したり、強く反応させる方法を知りたい",
  },
  {
    value: "professional_judgment",
    label: "法律、医療、契約、金銭等について専門的な判断や助言がほしい",
  },
  {
    value: "urgent_safety_help",
    label: "自傷、自殺、暴力、脅迫など、現在の安全に関わる緊急性がある",
  },
];

const phaseTitles: Record<Phase, string> = {
  1: "相談を書く",
  2: "利用確認",
  3: "依頼メモを確認",
  4: "受取メール",
};

const phaseTwoIntro =
  "月の返事では、\n『今は送らない』という答えも含めて、\n今の状況に合った鑑定をお返しします。\n\n対応できる内容かどうかだけ、\n先に確認させてください。";

const eligiblePresentations: Record<
  EligiblePrepaymentClassificationV1,
  SafetyPresentation
> = {
  eligible_general: {
    scopeLabel: "通常の鑑定",
    heading: "この内容は、通常の鑑定として確認できます。",
    description:
      "状況を整理し、今の方向性と次に見直す条件を鑑定ノートとしてお返しします。",
    provides: ["確認できる事実の整理", "今の方向性", "次に見直す条件"],
    draftAvailability: "状況と依頼内容に合う場合は、文案を含むことがあります。",
  },
  eligible_pause_assessment: {
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
  },
  eligible_boundary_support_only: {
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
  },
  eligible_scoped_reply: {
    scopeLabel: "最新の用件だけに限った返信鑑定",
    heading: "相手から届いた最新の文面の用件だけを扱います。",
    description:
      "新しい文面が明確に求めている返答だけに限定し、それを超える連絡許可は作りません。",
    provides: ["最新の用件の整理", "用件内の返信方向", "範囲を広げない確認"],
    draftAvailability: "文案がある場合も、最新の用件の範囲だけに限定されます。",
  },
  eligible_business_only: {
    scopeLabel: "許可された実務用件だけの鑑定",
    heading: "明確に許可された実務上の用件だけを扱います。",
    description:
      "業務・荷物・金銭など、許可された実務上の用件だけに限定し、私的・恋愛的な内容は含めません。",
    provides: ["許可された用件の整理", "実務範囲内の返信方向", "私的内容を広げない確認"],
    draftAvailability: "文案がある場合も、許可された実務上の用件だけに限定されます。",
  },
};

const scopeAcknowledgementCopy: Partial<
  Record<
    AcknowledgementCodeV1,
    { key: keyof ScopeAcknowledgementsV1; text: string }
  >
> = {
  pause_assessment_disclosure_acknowledged: {
    key: "pauseAssessmentDisclosureAcknowledged",
    text:
      "鑑定結果によっては、\n『今は送らない』という判断になり、\n送信文案が表示されない場合があります。\n\nその場合も、\n理由・今の動き方・見直す条件を\n鑑定ノートとしてお返しします。",
  },
  boundary_support_only_disclosure_acknowledged: {
    key: "boundarySupportOnlyDisclosureAcknowledged",
    text:
      "この鑑定では、\n相手への連絡文案や再接触方法は提供しません。\n\n確認できる事実、\n気持ちの整理、\n相手の境界を尊重した今後の方向性を\n鑑定ノートとしてお返しします。",
  },
  scoped_reply_scope_acknowledged: {
    key: "scopedReplyScopeAcknowledged",
    text:
      "この鑑定で扱う返信は、相手から届いた最新の文面の用件だけに限定され、それ以外の連絡許可を作らないことを確認します。",
  },
  business_only_scope_acknowledged: {
    key: "businessOnlyScopeAcknowledged",
    text:
      "この鑑定は、明確に許可された実務上の用件だけに限定し、私的・恋愛的な内容を含めないことを確認します。",
  },
};

const attestationText =
  "この鑑定を、\n相手から示された拒否や連絡制限を回避する方法、\n監視・追跡、\n脅しや強い圧力を使う方法として\n利用しないことを確認します。";

const apiUnavailableCopy =
  "現在、利用確認を完了できません。\n時間を置いてもう一度お試しください。";

function toggleValue(values: string[], value: string) {
  return values.includes(value)
    ? values.filter((item) => item !== value)
    : [...values, value];
}

function excerpt(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "未入力（任意）";
  return trimmed.length > 180 ? `${trimmed.slice(0, 180)}…` : trimmed;
}

function validateSheet(form: RequestFormData) {
  const errors: ValidationErrors = {};
  if (!form.adultConfirmed) {
    errors.adultConfirmed = "18歳以上であることを確認してください。";
  }
  if (!relationshipOptions.some((option) => option.label === form.relationship)) {
    errors.relationship = "今の関係を1つ選んでください。";
  }
  if (form.whatToKnow.length === 0) {
    errors.whatToKnow = "今夜知りたいことを1つ以上選んでください。";
  } else if (form.whatToKnow.length > 2) {
    errors.whatToKnow = "今夜知りたいことは2つまで選べます。";
  }
  if (!form.currentSituation.trim()) {
    errors.currentSituation = "今の状況を入力してください。";
  }
  const candidateMessageError = validateCandidateMessage(
    form.whatToKnow,
    form.draftMessage,
  );
  if (candidateMessageError) {
    errors.draftMessage = candidateMessageError;
  }
  return errors;
}

function validateSafetySelections(safety: SafetySelectionState) {
  const errors: ValidationErrors = {};
  if (!safety.contactBoundaryState) {
    errors.contactBoundaryState = "現在の連絡状況を1つ選んでください。";
  }
  if (!safety.requestedAssistanceGoal) {
    errors.requestedAssistanceGoal =
      "今回手伝ってほしいことを1つ選んでください。";
  }
  return errors;
}

function validateEmail(form: RequestFormData) {
  const errors: ValidationErrors = {};
  if (!form.email.trim()) {
    errors.email = "受け取りメールアドレスを入力してください。";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(form.email)) {
    errors.email = "メールアドレスの形式を確認してください。";
  }
  return errors;
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="request-field-error" role="alert">
      {message}
    </p>
  );
}

function MemoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function includesValue<const TValues extends readonly string[]>(
  values: TValues,
  value: unknown,
): value is TValues[number] {
  return (
    typeof value === "string" &&
    (values as readonly string[]).includes(value)
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readResponseData(value: unknown) {
  return isRecord(value) && isRecord(value.data) ? value.data : null;
}

function createClientCsrfToken() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replace(/\+/gu, "-")
    .replace(/\//gu, "_")
    .replace(/=+$/gu, "");
}

function decodeProductionPreparation(
  value: unknown,
): ProductionPreparationOutcome | null {
  const data = readResponseData(value);
  if (!data || typeof data.status !== "string") return null;
  if (
    (data.status === "purchase_ready" ||
      data.status === "authentication_required") &&
    typeof data.preparationCapability === "string"
  ) {
    return {
      status: data.status,
      preparationCapability: data.preparationCapability,
    };
  }
  if (
    data.status === "needs_one_clarifying_answer" &&
    typeof data.clarificationCapability === "string" &&
    isPublicClarificationTargetV1(data.target) &&
    typeof data.question === "string" &&
    data.maximumQuestionsTotal === 1
  ) {
    return {
      status: data.status,
      clarificationCapability: data.clarificationCapability,
      target: data.target,
      question: data.question,
      maximumQuestionsTotal: 1,
    };
  }
  if (
    data.status === "not_full_product_candidate" ||
    data.status === "safety_blocked"
  ) {
    return { status: data.status };
  }
  return null;
}

function productionFlowMessage(kind: "unavailable" | "notEligible" | "invalidCode") {
  if (kind === "notEligible") {
    return "この内容では有料の鑑定ノートへ進めません。相談内容を見直して、もう一度お試しください。";
  }
  if (kind === "invalidCode") {
    return "確認コードを確認できませんでした。届いたコードを見直してください。";
  }
  return "現在、お申し込みを安全に完了できません。料金は発生していません。時間を置いてもう一度お試しください。";
}

type ProductClarificationFlow = Extract<
  ProductionPurchaseFlow,
  { status: "product_clarification" }
>;

function ProductClarificationInput({
  flow,
  onChange,
  onSubmit,
}: {
  flow: ProductClarificationFlow;
  onChange: (
    draft: Pick<ProductClarificationFlow, "answerValue" | "answerDetail">,
  ) => void;
  onSubmit: () => void;
}) {
  const control = PUBLIC_CLARIFICATION_CONTROLS_V1[flow.target];
  const detailVisible = publicClarificationDetailVisibleV1(
    flow.target,
    flow.answerValue,
  );
  const detailRequired = publicClarificationDetailRequiredV1(
    flow.target,
    flow.answerValue,
  );
  const answer = buildPublicClarificationAnswerV1(flow.target, {
    value: flow.answerValue,
    detail: flow.answerDetail,
  });

  return (
    <div className="request-field request-product-clarification">
      <label>
        鑑定ノートを準備するための確認 <span>必須 / 1回まで</span>
      </label>
      <fieldset className="request-field runtime-clarification__choices">
        <legend>{flow.question}</legend>
        <div className="request-chip-group">
          {control.choices.map((choice) => (
            <label key={choice.value}>
              <input
                type="radio"
                name="product-clarification-answer"
                value={choice.value}
                checked={flow.answerValue === choice.value}
                onChange={() =>
                  onChange({
                    answerValue: choice.value,
                    answerDetail: flow.answerDetail,
                  })
                }
              />
              <span>{choice.label}</span>
            </label>
          ))}
        </div>
      </fieldset>
      {control.detail && detailVisible ? (
        <div className="request-field">
          <label htmlFor="product-clarification-detail">
            {control.detail.label}{" "}
            <span>{detailRequired ? "必須" : "任意"}</span>
          </label>
          <textarea
            id="product-clarification-detail"
            value={flow.answerDetail}
            maxLength={control.detail.maximumCharacters}
            rows={3}
            required={detailRequired}
            onChange={(event) =>
              onChange({
                answerValue: flow.answerValue,
                answerDetail: event.target.value,
              })
            }
          />
        </div>
      ) : null}
      <button
        type="button"
        className="button button--primary"
        disabled={answer === null}
        onClick={onSubmit}
      >
        この回答で確認を完了する
      </button>
    </div>
  );
}

function isKnownArray<const TValues extends readonly string[]>(
  value: unknown,
  values: TValues,
): value is TValues[number][] {
  return (
    Array.isArray(value) &&
    value.every((item) => includesValue(values, item)) &&
    new Set(value).size === value.length
  );
}

function decodeClientSafetyResult(payload: unknown): ClientSafetyResult | null {
  if (!isRecord(payload) || !isRecord(payload.data)) return null;
  const result = payload.data;
  const productScope = result.productScope;
  if (
    result.schemaVersion !== PREPAYMENT_SAFETY_RESULT_SCHEMA_VERSION ||
    result.policyVersion !== PREPAYMENT_SAFETY_POLICY_VERSION ||
    !includesValue(PREPAYMENT_SAFETY_CLASSIFICATIONS, result.classification) ||
    !includesValue(SAFETY_DISPOSITIONS, result.safetyDisposition) ||
    !(
      result.deliveryScope === null ||
      includesValue(ELIGIBLE_DELIVERY_SCOPES, result.deliveryScope)
    ) ||
    !isKnownArray(result.reasonCodes, REASON_CODES) ||
    !isKnownArray(result.requiredClarificationCodes, CLARIFICATION_CODES) ||
    !isKnownArray(result.requiredAcknowledgementCodes, ACKNOWLEDGEMENT_CODES) ||
    !isKnownArray(result.allowedOutputKinds, OUTPUT_KINDS) ||
    !isKnownArray(result.forbiddenOutputKinds, OUTPUT_KINDS) ||
    typeof result.purchaseGateSatisfied !== "boolean" ||
    typeof result.eligibilityInputHash !== "string" ||
    !/^[0-9a-f]{64}$/u.test(result.eligibilityInputHash) ||
    result.paymentImplementationPresent !== false ||
    result.paymentSessionAvailable !== false ||
    result.paymentAuthorityIssued !== false ||
    !isRecord(productScope) ||
    productScope.schemaVersion !==
      JPY980_PRODUCT_SCOPE_VALIDATION_V1_VERSION ||
    typeof productScope.accepted !== "boolean" ||
    !includesValue(JPY980_PRODUCT_SCOPE_DECISIONS, productScope.decision) ||
    !(
      productScope.clarificationCode === null ||
      includesValue(
        JPY980_PRODUCT_SCOPE_CLARIFICATION_CODES,
        productScope.clarificationCode,
      )
    ) ||
    !isKnownArray(
      productScope.actionableAnchorTopics,
      REQUESTED_TOPIC_VALUES,
    ) ||
    (productScope.accepted !== (productScope.decision === "eligible")) ||
    (productScope.decision === "eligible" &&
      productScope.clarificationCode !== null) ||
    (productScope.decision === "needs_clarification" &&
      productScope.clarificationCode === null)
  ) {
    return null;
  }

  return {
    classification: result.classification,
    requiredClarificationCodes: result.requiredClarificationCodes,
    requiredAcknowledgementCodes: result.requiredAcknowledgementCodes,
    purchaseGateSatisfied: result.purchaseGateSatisfied,
    productScope: {
      accepted: productScope.accepted,
      decision: productScope.decision,
      clarificationCode: productScope.clarificationCode,
    },
  };
}

function isEligibleClassification(
  classification: ClientSafetyResult["classification"],
): classification is EligiblePrepaymentClassificationV1 {
  return includesValue(ELIGIBLE_PREPAYMENT_CLASSIFICATIONS, classification);
}

function presentationFor(
  classification: ClientSafetyResult["classification"],
) {
  return isEligibleClassification(classification)
    ? eligiblePresentations[classification]
    : null;
}

function RequestMemo({
  form,
  presentation,
  onEdit,
  onContinue,
}: {
  form: RequestFormData;
  presentation: SafetyPresentation;
  onEdit: (phase: Phase) => void;
  onContinue: () => void;
}) {
  return (
    <article className="request-memo" aria-labelledby="request-memo-title">
      <header>
        <p>このように受け取りました</p>
        <h2 id="request-memo-title" tabIndex={-1}>
          あなたの鑑定依頼メモ
        </h2>
        <span>
          入力内容をこの画面上で並べ直した表示です。AI処理、外部送信、保存は行っていません。
        </span>
      </header>

      <section aria-labelledby="memo-consultation-title">
        <div className="request-memo__heading">
          <h3 id="memo-consultation-title">あなたの相談</h3>
          <button type="button" onClick={() => onEdit(1)}>
            相談を修正
          </button>
        </div>
        <dl>
          <MemoRow label="今の状況" value={form.currentSituation} />
          <MemoRow label="今の関係" value={form.relationship} />
          <MemoRow label="今夜知りたいこと" value={form.whatToKnow.join("、")} />
          <MemoRow label="ニックネーム" value={excerpt(form.nickname)} />
        </dl>
      </section>

      <section aria-labelledby="memo-message-title">
        <div className="request-memo__heading">
          <h3 id="memo-message-title">実際の文面</h3>
          <button type="button" onClick={() => onEdit(1)}>
            文面を修正
          </button>
        </div>
        <dl>
          <MemoRow label="相手から届いた文面" value={excerpt(form.partnerMessage)} />
          <MemoRow label="自分が送ろうとしている文面" value={excerpt(form.draftMessage)} />
        </dl>
      </section>

      <section aria-labelledby="memo-safety-title">
        <div className="request-memo__heading">
          <h3 id="memo-safety-title">利用確認</h3>
          <button type="button" onClick={() => onEdit(2)}>
            利用確認を見直す
          </button>
        </div>
        <p className="request-memo__safety">
          {presentation.scopeLabel} / 現在の入力で必要確認済み
          <br />
          {presentation.draftAvailability}
        </p>
      </section>

      <footer className="request-phase-actions">
        <button
          type="button"
          className={`button button--secondary ${styles.paperSecondary}`}
          onClick={() => onEdit(2)}
        >
          戻る
        </button>
        <button
          type="button"
          className="button button--primary"
          onClick={onContinue}
        >
          受け取りメールへ
        </button>
      </footer>
    </article>
  );
}

function RequestFragmentTargets() {
  return (
    <>
      <span id="sheet" className="request-fragment-target" aria-hidden="true" />
      <span id="safety" className="request-fragment-target" aria-hidden="true" />
      <span id="email" className="request-fragment-target" aria-hidden="true" />
    </>
  );
}

function ClarificationChoice({
  name,
  value,
  checked,
  label,
  disabled,
  onChange,
}: {
  name: string;
  value: string;
  checked: boolean;
  label: string;
  disabled: boolean;
  onChange: () => void;
}) {
  return (
    <label className={styles.choice}>
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        disabled={disabled}
        onChange={onChange}
      />
      <span>{label}</span>
    </label>
  );
}

function ClarificationField({
  legend,
  children,
}: {
  legend: string;
  children: ReactNode;
}) {
  return (
    <fieldset className={styles.clarificationField}>
      <legend>{legend}</legend>
      <div className={styles.choiceList}>{children}</div>
    </fieldset>
  );
}

function LocalPurchaseConfirmation({
  form,
  presentation,
  paymentEnabled,
  verifiedEmail,
  checkoutBusy,
  checkoutError,
  onCheckout,
  onEditEmail,
  customerAuthEnabled,
}: {
  form: RequestFormData;
  presentation: SafetyPresentation;
  paymentEnabled: boolean;
  verifiedEmail: string | null;
  checkoutBusy: boolean;
  checkoutError: string | null;
  onCheckout: () => void;
  onEditEmail: () => void;
  customerAuthEnabled: boolean;
}) {
  return (
    <article
      id="request-local-complete"
      tabIndex={-1}
      className="request-local-complete"
      aria-labelledby="request-local-complete-title"
    >
      <p>お申し込み前の最終確認</p>
      <h2 id="request-local-complete-title">
        恋のメッセージ鑑定ノート
      </h2>
      <span>{presentation.scopeLabel}</span>
      <dl>
        <MemoRow label="サービス" value="月の返事" />
        <MemoRow label="商品" value="恋のメッセージ鑑定ノート" />
        <MemoRow
          label="商品の役割"
          value="入力された状況・文面をAIが整理・分析し、次にどう動くかを考えるための判断材料としてまとめます。"
        />
        <MemoRow label="鑑定でお返しするもの" value={presentation.description} />
        <MemoRow label="文案について" value={presentation.draftAvailability} />
        <MemoRow label="今の関係" value={form.relationship} />
        <MemoRow label="今夜知りたいこと" value={form.whatToKnow.join("、")} />
        {customerAuthEnabled ? (
          <MemoRow label="受け取り" value="確認済みアカウント" />
        ) : (
          <MemoRow label="受け取り・復旧メール" value={form.email} />
        )}
        {verifiedEmail ? (
          <MemoRow
            label={customerAuthEnabled ? "ご本人確認" : "メール確認"}
            value={customerAuthEnabled ? "確認済みアカウント" : `${verifiedEmail} / 確認済み`}
          />
        ) : null}
        <MemoRow label="数量" value="1相談 / 1鑑定ノート" />
        <MemoRow label="料金" value="税込980円" />
        <MemoRow label="購入形式" value="都度払い" />
        <MemoRow label="自動更新" value="なし" />
        <MemoRow label="年齢" value="18歳以上の方が対象です" />
        <MemoRow
          label="AI利用"
          value="入力内容をAIが整理・分析し、判断材料となる鑑定ノートを作成します。"
        />
        <MemoRow
          label="結果について"
          value="相手の本心、返信、復縁、未来、関係改善を断定・保証しません。"
        />
      </dl>
      {paymentEnabled ? (
        <PurchasePaymentPanel
          checkoutBusy={checkoutBusy}
          checkoutDisabled={checkoutBusy || !verifiedEmail}
          checkoutError={checkoutError}
          checkoutAriaLabel="980円を支払い、鑑定を申し込む"
          onCheckout={onCheckout}
        />
      ) : (
        <>
          <div className="request-runtime-note" role="note">
            <strong>決済機能は現在準備中です。</strong>
            <span>この画面では料金は発生しません。</span>
          </div>
          <button type="button" disabled aria-disabled="true">
            購入機能は現在準備中です
          </button>
        </>
      )}
      <nav className="request-purchase-links" aria-label="購入前に確認できる情報">
        <Link href="/legal/terms">利用規約</Link>
        <Link href="/legal/privacy">プライバシー</Link>
        <Link href="/legal/tokushoho">特定商取引法に基づく表記</Link>
        <Link href="/legal/refund">返金方針</Link>
        <Link href="/legal/ai-disclosure">AI利用について</Link>
      </nav>
      <button type="button" className="text-link" onClick={onEditEmail}>
        {customerAuthEnabled ? "ログイン方法を変更する" : "メールアドレスを修正する"}
      </button>
    </article>
  );
}

export function RequestForm({
  paymentEnabled = false,
  customerAuthEnabled = false,
  prepaymentComputeEnabled = false,
}: {
  paymentEnabled?: boolean;
  customerAuthEnabled?: boolean;
  prepaymentComputeEnabled?: boolean;
}) {
  const router = useRouter();
  const [form, setForm] = useState<RequestFormData>(initialFormState);
  const [safety, setSafety] =
    useState<SafetySelectionState>(initialSafetyState);
  const [phase, setPhase] = useState<Phase>(1);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [safetyResult, setSafetyResult] =
    useState<ClientSafetyResult | null>(null);
  const [gatePrompt, setGatePrompt] = useState<GatePrompt | null>(null);
  const [clarificationCodes, setClarificationCodes] = useState<
    readonly ClarificationCodeV1[]
  >([]);
  const [safetyApiError, setSafetyApiError] = useState(false);
  const [safetyBusy, setSafetyBusy] = useState(false);
  const [completedClassification, setCompletedClassification] =
    useState<EligiblePrepaymentClassificationV1 | null>(null);
  const [messageDetailsOpen, setMessageDetailsOpen] = useState(false);
  const [productionFlow, setProductionFlow] =
    useState<ProductionPurchaseFlow>({ status: "idle" });
  const [customerAuthMethod, setCustomerAuthMethod] =
    useState<CustomerAuthMethod | null>(null);
  const [authEntryPending, setAuthEntryPending] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const requestSequence = useRef(0);
  const preparationIdempotencyKey = useRef<string | null>(null);
  const requestStartedMeasured = useRef(false);
  const requestCompletedMeasured = useRef(false);
  const authEntryPendingRef = useRef(false);
  const googleAuthClientTimingRef =
    useRef<GoogleAuthClientTimingAnchor | null>(null);
  const clarificationHeadingRef = useRef<HTMLHeadingElement>(null);
  const productScopeHeadingRef = useRef<HTMLHeadingElement>(null);
  const apiErrorHeadingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const hashPhases: Record<string, Phase> = {
      "#sheet": 1,
      "#step-1": 1,
      "#safety": 2,
      "#step-2": 2,
      "#step-3": 2,
      "#email": 4,
    };

    function applyHashPhase() {
      const nextPhase = hashPhases[window.location.hash];
      if (nextPhase) setPhase(nextPhase);
    }

    const frameId = window.requestAnimationFrame(applyHashPhase);
    window.addEventListener("hashchange", applyHashPhase);
    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("hashchange", applyHashPhase);
    };
  }, []);

  useEffect(() => {
    if (safetyResult?.classification === "needs_clarification") {
      clarificationHeadingRef.current?.focus();
    }
  }, [safetyResult]);

  useEffect(() => {
    if (
      safetyResult &&
      isEligibleClassification(safetyResult.classification) &&
      safetyResult.productScope.decision === "needs_clarification"
    ) {
      productScopeHeadingRef.current?.focus();
    }
  }, [safetyResult]);

  useEffect(() => {
    if (safetyApiError) apiErrorHeadingRef.current?.focus();
  }, [safetyApiError]);

  function focusFirstError(nextErrors: ValidationErrors) {
    const firstKey = Object.keys(nextErrors)[0];
    if (!firstKey) return;
    window.setTimeout(() => {
      const target = document.getElementById(firstKey);
      target?.focus();
      target?.scrollIntoView({ block: "center" });
    }, 0);
  }

  function clearFieldError(field: ErrorKey) {
    setErrors((current) => {
      const next = { ...current };
      delete next[field];
      delete next.safetyBlocking;
      return next;
    });
  }

  function measureRequestStart() {
    if (requestStartedMeasured.current) return;
    requestStartedMeasured.current = true;
    trackClientMeasurement("request_start", {
      experience: "consultation_request",
    });
  }

  function measureRequestComplete() {
    if (requestCompletedMeasured.current) return;
    requestCompletedMeasured.current = true;
    trackClientMeasurement("request_complete", { outcome: "purchase_ready" });
  }

  function clearServerAssessment({
    keepGatePrompt = false,
    keepClarificationPrompt = false,
  } = {}) {
    requestSequence.current += 1;
    setSafetyBusy(false);
    setSafetyResult(null);
    setSafetyApiError(false);
    if (!keepGatePrompt) setGatePrompt(null);
    if (!keepClarificationPrompt) setClarificationCodes([]);
    setCompletedClassification(null);
    setProductionFlow({ status: "idle" });
    setCustomerAuthMethod(null);
    setCheckoutError(null);
    preparationIdempotencyKey.current = null;
  }

  function resetDependentSafetyAnswers() {
    clearServerAssessment();
    setSafety((current) => ({
      ...current,
      clarificationAnswers: emptyClarificationAnswers,
      scopeAcknowledgements: emptyScopeAcknowledgements,
      attestationConfirmed: false,
    }));
    setErrors((current) => {
      const next = { ...current };
      delete next.clarification;
      delete next.scopeAcknowledgements;
      delete next.attestationConfirmed;
      delete next.safetyBlocking;
      return next;
    });
  }

  function updateString(field: keyof RequestFormData, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    clearFieldError(field);
    if (
      field === "currentSituation" ||
      field === "partnerMessage" ||
      field === "draftMessage" ||
      field === "relationship"
    ) {
      resetDependentSafetyAnswers();
    }
    if (field === "email") {
      setCompletedClassification(null);
      if (!customerAuthEnabled) setProductionFlow({ status: "idle" });
      setCheckoutError(null);
    }
  }

  function updateAdultConfirmed(value: boolean) {
    setForm((current) => ({ ...current, adultConfirmed: value }));
    clearFieldError("adultConfirmed");
    resetDependentSafetyAnswers();
  }

  function toggleWhatToKnow(value: string) {
    if (!form.whatToKnow.includes(value) && form.whatToKnow.length >= 2) {
      setErrors((current) => ({
        ...current,
        whatToKnow: "今夜知りたいことは2つまで選べます。",
      }));
      return;
    }
    const nextTopics = toggleValue(form.whatToKnow, value);
    setForm((current) => ({ ...current, whatToKnow: nextTopics }));
    if (candidateMessageRequired(nextTopics)) setMessageDetailsOpen(true);
    clearFieldError("whatToKnow");
    if (!candidateMessageRequired(nextTopics)) clearFieldError("draftMessage");
    resetDependentSafetyAnswers();
  }

  function selectContactBoundary(value: ContactBoundaryStateV1) {
    clearServerAssessment();
    setSafety((current) => ({
      ...current,
      contactBoundaryState: value,
      clarificationAnswers: emptyClarificationAnswers,
      scopeAcknowledgements: emptyScopeAcknowledgements,
      attestationConfirmed: false,
    }));
    clearFieldError("contactBoundaryState");
  }

  function selectAssistanceGoal(value: RequestedAssistanceGoalV1) {
    clearServerAssessment();
    setSafety((current) => ({
      ...current,
      requestedAssistanceGoal: value,
      clarificationAnswers: emptyClarificationAnswers,
      scopeAcknowledgements: emptyScopeAcknowledgements,
      attestationConfirmed: false,
    }));
    clearFieldError("requestedAssistanceGoal");
  }

  function updateClarificationAnswer(
    key: Exclude<keyof ClarificationAnswersV1, "submissionCount">,
    value: Exclude<
      ClarificationAnswersV1[Exclude<
        keyof ClarificationAnswersV1,
        "submissionCount"
      >],
      null
    >,
  ) {
    clearServerAssessment({ keepClarificationPrompt: true });
    setSafety((current) => ({
      ...current,
      clarificationAnswers: {
        ...current.clarificationAnswers,
        submissionCount: 0,
        [key]: value,
      },
    }));
    clearFieldError("clarification");
  }

  function updateScopeAcknowledgement(
    key: keyof ScopeAcknowledgementsV1,
    value: boolean,
  ) {
    clearServerAssessment({ keepGatePrompt: true });
    setSafety((current) => ({
      ...current,
      scopeAcknowledgements: {
        ...current.scopeAcknowledgements,
        [key]: value,
      },
    }));
    clearFieldError("scopeAcknowledgements");
  }

  function updateAttestation(value: boolean) {
    clearServerAssessment({ keepGatePrompt: true });
    setSafety((current) => ({
      ...current,
      attestationConfirmed: value,
    }));
    clearFieldError("attestationConfirmed");
  }

  function moveToPhase(nextPhase: Phase) {
    setPhase(nextPhase);
    setErrors({});
    window.setTimeout(() => {
      document.getElementById(`request-phase-${nextPhase}`)?.scrollIntoView({
        block: "start",
      });
    }, 0);
  }

  function focusPhaseOneField(
    fieldId: "currentSituation" | "partnerMessage" | "draftMessage",
  ) {
    if (fieldId !== "currentSituation") setMessageDetailsOpen(true);
    setPhase(1);
    window.setTimeout(() => {
      document.getElementById(fieldId)?.focus();
      document.getElementById(fieldId)?.scrollIntoView({ block: "center" });
    }, 0);
  }

  function focusContactBoundarySelection() {
    setPhase(2);
    window.setTimeout(() => {
      document.getElementById("contactBoundaryState")?.focus();
      document
        .getElementById("contactBoundaryState")
        ?.scrollIntoView({ block: "center" });
    }, 0);
  }

  function buildSafetyInput(
    overrides: Partial<
      Pick<
        SafetySelectionState,
        "clarificationAnswers" | "scopeAcknowledgements" | "attestationConfirmed"
      >
    > = {},
  ): PrepaymentSafetyInputV1 | null {
    const relationship = relationshipOptions.find(
      (option) => option.label === form.relationship,
    )?.value;
    const requestedTopics = form.whatToKnow
      .map(
        (label) =>
          whatToKnowOptions.find((option) => option.label === label)?.value,
      )
      .filter((value): value is RequestedTopic => value !== undefined);

    if (
      !relationship ||
      requestedTopics.length !== form.whatToKnow.length ||
      !safety.contactBoundaryState ||
      !safety.requestedAssistanceGoal
    ) {
      return null;
    }

    const latestInboundMessage = form.partnerMessage.trim();
    const optionalMessage = form.draftMessage.trim();

    return {
      schemaVersion: PREPAYMENT_SAFETY_INPUT_SCHEMA_VERSION,
      adultConfirmed: form.adultConfirmed,
      currentSituation: form.currentSituation.trim(),
      latestInboundMessage: latestInboundMessage || null,
      optionalMessage: optionalMessage || null,
      relationship,
      requestedTopics,
      contactBoundaryState: safety.contactBoundaryState,
      requestedAssistanceGoal: safety.requestedAssistanceGoal,
      clarificationAnswers:
        overrides.clarificationAnswers ?? safety.clarificationAnswers,
      scopeAcknowledgements:
        overrides.scopeAcknowledgements ?? safety.scopeAcknowledgements,
      attestationConfirmed:
        overrides.attestationConfirmed ?? safety.attestationConfirmed,
      safetyPolicyVersion: PREPAYMENT_SAFETY_POLICY_VERSION,
    };
  }

  async function requestServerEvaluation(
    overrides: Partial<
      Pick<
        SafetySelectionState,
        "clarificationAnswers" | "scopeAcknowledgements" | "attestationConfirmed"
      >
    > = {},
  ) {
    const input = buildSafetyInput(overrides);
    if (!input) return null;

    const sequence = requestSequence.current + 1;
    requestSequence.current = sequence;
    setSafetyBusy(true);
    setSafetyResult(null);
    setSafetyApiError(false);
    setCompletedClassification(null);

    try {
      const response = await fetch("/api/consultations/purchase-eligibility", {
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!response.ok) throw new Error("PREPAYMENT_RESPONSE_NOT_OK");

      const payload: unknown = await response.json();
      const result = decodeClientSafetyResult(payload);
      if (!result) throw new Error("PREPAYMENT_RESPONSE_UNEXPECTED");
      if (requestSequence.current !== sequence) return null;

      setSafetyResult(result);
      if (
        isEligibleClassification(result.classification) &&
        result.productScope.decision === "eligible"
      ) {
        setGatePrompt({
          classification: result.classification,
          requiredAcknowledgementCodes: result.requiredAcknowledgementCodes,
        });
        setClarificationCodes([]);
      } else if (result.classification === "needs_clarification") {
        setGatePrompt(null);
        setClarificationCodes(result.requiredClarificationCodes);
      } else {
        setGatePrompt(null);
        setClarificationCodes([]);
      }
      return result;
    } catch {
      if (requestSequence.current !== sequence) return null;
      setSafetyResult(null);
      setGatePrompt(null);
      setClarificationCodes([]);
      setSafetyApiError(true);
      return null;
    } finally {
      if (requestSequence.current === sequence) setSafetyBusy(false);
    }
  }

  function continueFromSheet() {
    const nextErrors = validateSheet(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      if (nextErrors.draftMessage) setMessageDetailsOpen(true);
      focusFirstError(nextErrors);
      return;
    }
    moveToPhase(2);
  }

  async function classifyCurrentInput() {
    const sheetErrors = validateSheet(form);
    if (Object.keys(sheetErrors).length > 0) {
      setPhase(1);
      setErrors(sheetErrors);
      if (sheetErrors.draftMessage) setMessageDetailsOpen(true);
      focusFirstError(sheetErrors);
      return;
    }
    const selectionErrors = validateSafetySelections(safety);
    setErrors(selectionErrors);
    if (Object.keys(selectionErrors).length > 0) {
      focusFirstError(selectionErrors);
      return;
    }

    setSafety((current) => ({
      ...current,
      clarificationAnswers: emptyClarificationAnswers,
      scopeAcknowledgements: emptyScopeAcknowledgements,
      attestationConfirmed: false,
    }));
    await requestServerEvaluation({
      clarificationAnswers: emptyClarificationAnswers,
      scopeAcknowledgements: emptyScopeAcknowledgements,
      attestationConfirmed: false,
    });
  }

  function clarificationAnswerMissing(code: ClarificationCodeV1) {
    const answers = safety.clarificationAnswers;
    switch (code) {
      case "boundary_state_required":
        return answers.clarifiedContactBoundaryState === null;
      case "boundary_state_conflict":
        return false;
      case "unsafe_execution_intent_required":
        return answers.unsafeExecutionIntent === null;
      case "current_safety_status_required":
        return answers.currentSafetyStatus === null;
      case "business_permission_required":
        return answers.practicalPermissionExplicit === null;
      case "business_scope_required":
        return answers.currentRequestPracticalScopeOnly === null;
      case "reply_invitation_required":
        return answers.replyExplicitlyInvited === null;
      case "reply_scope_required":
        return answers.replyLimitedToExactSubject === null;
      case "professional_scope_required":
        return (
          answers.professionalScopeLimitedToNonprofessionalOrganization === null
        );
      case "latest_inbound_message_required":
      case "structured_content_conflict":
        return false;
    }
  }

  function hasInteractiveClarification(code: ClarificationCodeV1) {
    return (
      code !== "latest_inbound_message_required" &&
      code !== "boundary_state_conflict" &&
      code !== "structured_content_conflict"
    );
  }

  async function submitClarification() {
    const interactiveCodes = clarificationCodes.filter(
      hasInteractiveClarification,
    );
    if (
      interactiveCodes.length === 0 ||
      interactiveCodes.some(clarificationAnswerMissing)
    ) {
      const nextErrors = {
        clarification: "表示されている確認項目に回答してください。",
      } satisfies ValidationErrors;
      setErrors(nextErrors);
      focusFirstError(nextErrors);
      return;
    }

    const submittedAnswers: ClarificationAnswersV1 = {
      ...safety.clarificationAnswers,
      submissionCount: 1,
    };
    setSafety((current) => ({
      ...current,
      clarificationAnswers: submittedAnswers,
    }));
    setErrors({});
    const result = await requestServerEvaluation({
      clarificationAnswers: submittedAnswers,
    });
    if (!result) {
      setSafety((current) => ({
        ...current,
        clarificationAnswers: {
          ...current.clarificationAnswers,
          submissionCount: 0,
        },
      }));
    }
  }

  async function continueFromSafety() {
    if (!gatePrompt) {
      const nextErrors = {
        safetyBlocking: "現在の入力で利用確認をやり直してください。",
      } satisfies ValidationErrors;
      setErrors(nextErrors);
      focusFirstError(nextErrors);
      return;
    }

    setErrors({});
    const result = await requestServerEvaluation();
    if (
      result &&
      isEligibleClassification(result.classification) &&
      result.productScope.decision === "eligible" &&
      result.purchaseGateSatisfied
    ) {
      moveToPhase(3);
      return;
    }

    if (result?.productScope.decision === "needs_clarification") return;

    if (result && isEligibleClassification(result.classification)) {
      const nextErrors: ValidationErrors = {};
      const scopeCodes = result.requiredAcknowledgementCodes.filter(
        (code) => scopeAcknowledgementCopy[code] !== undefined,
      );
      if (
        scopeCodes.some((code) => {
          const copy = scopeAcknowledgementCopy[code];
          return copy ? !safety.scopeAcknowledgements[copy.key] : false;
        })
      ) {
        nextErrors.scopeAcknowledgements =
          "この鑑定で扱う範囲を確認してください。";
      }
      if (
        result.requiredAcknowledgementCodes.includes(
          "attestation_confirmed",
        ) &&
        !safety.attestationConfirmed
      ) {
        nextErrors.attestationConfirmed = "共通の利用確認にチェックしてください。";
      }
      setErrors(nextErrors);
      focusFirstError(nextErrors);
    }
  }

  function continueFromMemo() {
    const sheetErrors = validateSheet(form);
    if (Object.keys(sheetErrors).length > 0) {
      setPhase(1);
      setErrors(sheetErrors);
      focusFirstError(sheetErrors);
      return;
    }
    if (
      !safetyResult ||
      !isEligibleClassification(safetyResult.classification) ||
      !safetyResult.purchaseGateSatisfied
    ) {
      const nextErrors = {
        safetyBlocking: "現在の入力で利用確認をやり直してください。",
      } satisfies ValidationErrors;
      setPhase(2);
      setErrors(nextErrors);
      focusFirstError(nextErrors);
      return;
    }
    setCustomerAuthMethod(null);
    moveToPhase(4);
  }

  async function beginMailboxVerification(
    preparationCapability: string,
    classification: EligiblePrepaymentClassificationV1,
  ) {
    setProductionFlow({
      status: "sending_verification",
      preparationCapability,
    });
    try {
      const response = await fetch("/api/delivery/email-verifications", {
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          preparationCapability,
          email: form.email.trim(),
        }),
      });
      if (!response.ok) throw new Error("EMAIL_VERIFICATION_START_FAILED");
      const data = readResponseData(await response.json());
      if (
        data?.status === "trusted_session_reused" &&
        typeof data.maskedEmail === "string"
      ) {
        setProductionFlow({
          status: "verified",
          preparationCapability,
          maskedEmail: data.maskedEmail,
        });
        setCompletedClassification(classification);
        return;
      }
      if (
        data?.status === "verification_sent" &&
        typeof data.challengeCapability === "string" &&
        typeof data.expiresAt === "string"
      ) {
        setProductionFlow({
          status: "awaiting_email_code",
          preparationCapability,
          challengeCapability: data.challengeCapability,
          expiresAt: data.expiresAt,
          verificationCode: "",
        });
        return;
      }
      throw new Error("EMAIL_VERIFICATION_RESPONSE_INVALID");
    } catch {
      setProductionFlow({
        status: "error",
        reason: "technical_failure",
        message: productionFlowMessage("unavailable"),
      });
    }
  }

  async function beginCustomerAuth(
    preparationCapability: string,
    flowKind: "google" | "email_otp",
  ) {
    const googleClientTiming =
      flowKind === "google"
        ? googleAuthClientTimingRef.current ?? beginGoogleAuthClientTiming()
        : null;
    googleAuthClientTimingRef.current = null;
    let googleTraceId: string | null = null;
    let googleTimingCompleted = false;
    const completeGoogleTiming = (outcome: "success" | "failed") => {
      if (googleTimingCompleted) return;
      googleTimingCompleted = true;
      completeGoogleAuthClientTiming(googleClientTiming, {
        traceId: googleTraceId,
        outcome,
      });
    };
    if (flowKind === "email_otp") {
      const emailErrors = validateEmail(form);
      if (Object.keys(emailErrors).length > 0) {
        setErrors(emailErrors);
        focusFirstError(emailErrors);
        return;
      }
    }
    const csrfToken = createClientCsrfToken();
    setErrors({});
    setProductionFlow({
      status:
        flowKind === "google"
          ? "auth_google_redirecting"
          : "auth_email_requesting",
      preparationCapability,
    });
    try {
      const continuationResponse = await fetch("/api/auth/continuations", {
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
          "X-Moon-Reply-CSRF": csrfToken,
        },
        body: JSON.stringify({
          preparationCapability,
          csrfToken,
          flowKind,
        }),
      });
      if (!continuationResponse.ok) {
        throw new Error("CUSTOMER_AUTH_CONTINUATION_FAILED");
      }
      const continuation = readResponseData(await continuationResponse.json());
      if (
        continuation?.status !== "continuation_ready" ||
        continuation.csrfToken !== csrfToken
      ) {
        throw new Error("CUSTOMER_AUTH_CONTINUATION_INVALID");
      }
      if (flowKind === "google") {
        const response = await fetch("/api/auth/google/start", {
          method: "POST",
          credentials: "same-origin",
          cache: "no-store",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ csrfToken }),
        });
        googleTraceId = readGoogleAuthLatencyTraceHeader(response);
        if (!response.ok) throw new Error("CUSTOMER_AUTH_GOOGLE_START_FAILED");
        const data = readResponseData(await response.json());
        if (
          data?.status !== "redirect_ready" ||
          typeof data.authorizationUrl !== "string"
        ) {
          throw new Error("CUSTOMER_AUTH_GOOGLE_RESPONSE_INVALID");
        }
        const authorizationUrl = new URL(data.authorizationUrl);
        if (authorizationUrl.protocol !== "https:") {
          throw new Error("CUSTOMER_AUTH_GOOGLE_URL_INVALID");
        }
        completeGoogleTiming("success");
        trackClientMeasurement("auth_start", { method: "google" });
        window.location.assign(authorizationUrl.toString());
        return;
      }
      const response = await fetch("/api/auth/email-otp/request", {
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csrfToken, email: form.email.trim() }),
      });
      if (!response.ok) throw new Error("CUSTOMER_AUTH_EMAIL_OTP_REQUEST_FAILED");
      const data = readResponseData(await response.json());
      if (data?.status !== "accepted") {
        throw new Error("CUSTOMER_AUTH_EMAIL_OTP_RESPONSE_INVALID");
      }
      trackClientMeasurement("auth_start", { method: "email_otp" });
      setProductionFlow({
        status: "awaiting_auth_email_otp",
        preparationCapability,
        csrfToken,
        otp: "",
      });
    } catch {
      completeGoogleTiming("failed");
      setProductionFlow({
        status: "error",
        reason: "technical_failure",
        message: productionFlowMessage("unavailable"),
      });
    }
  }

  async function submitCustomerAuthEmailOtp() {
    if (
      productionFlow.status !== "awaiting_auth_email_otp" ||
      !/^[A-Za-z0-9]{6,12}$/u.test(productionFlow.otp) ||
      !safetyResult ||
      !isEligibleClassification(safetyResult.classification)
    ) {
      return;
    }
    const current = productionFlow;
    try {
      const response = await fetch("/api/auth/email-otp/verify", {
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          csrfToken: current.csrfToken,
          email: form.email.trim(),
          otp: current.otp,
        }),
      });
      if (!response.ok) throw new Error("CUSTOMER_AUTH_EMAIL_OTP_INVALID");
      const data = readResponseData(await response.json());
      if (data?.status !== "customer_bound") {
        throw new Error("CUSTOMER_AUTH_BINDING_INVALID");
      }
      router.push("/purchase/auth/continue");
    } catch {
      setProductionFlow({ ...current, otp: "" });
      setErrors((existing) => ({
        ...existing,
        email: "確認コードを確認できませんでした。届いたコードを見直してください。",
      }));
    }
  }

  async function prepareProductionPurchase(
    classification: EligiblePrepaymentClassificationV1,
    authMethod: CustomerAuthMethod | null,
  ) {
    const input = buildSafetyInput();
    if (!input) {
      setProductionFlow({
        status: "error",
        reason: "technical_failure",
        message: productionFlowMessage("unavailable"),
      });
      return;
    }
    setProductionFlow({ status: "preparing" });
    const idempotencyKey =
      preparationIdempotencyKey.current ?? crypto.randomUUID();
    preparationIdempotencyKey.current = idempotencyKey;
    const serializedBody = JSON.stringify({
      ...input,
      consultationSchemaVersion: "rc1-production-consultation-v1",
      privacyAcknowledged: true,
    });
    const correlationId = crypto.randomUUID();
    try {
      const outcome = await postProductionPreparationWithRecovery({
        endpoint: "/api/consultations/prepare",
        serializedBody,
        idempotencyKey,
        correlationId,
        decodeOutcome: decodeProductionPreparation,
      });
      if (outcome.status === "purchase_ready") {
        measureRequestComplete();
        if (prepaymentComputeEnabled && customerAuthEnabled) {
          setProductionFlow({
            status: "verified",
            preparationCapability: outcome.preparationCapability,
            maskedEmail: "確認済みアカウント",
          });
          setCompletedClassification(classification);
          return;
        }
        if (customerAuthEnabled) {
          if (authMethod) {
            await beginCustomerAuth(outcome.preparationCapability, authMethod);
          } else {
            setProductionFlow({
              status: "auth_method",
              preparationCapability: outcome.preparationCapability,
            });
          }
        } else {
          await beginMailboxVerification(
            outcome.preparationCapability,
            classification,
          );
        }
        return;
      }
      if (outcome.status === "authentication_required") {
        if (!customerAuthEnabled) {
          throw new Error("CUSTOMER_AUTH_REQUIRED");
        }
        if (authMethod) {
          await beginCustomerAuth(outcome.preparationCapability, authMethod);
        } else {
          setProductionFlow({
            status: "auth_method",
            preparationCapability: outcome.preparationCapability,
          });
        }
        return;
      }
      if (outcome.status === "needs_one_clarifying_answer") {
        setProductionFlow({
          status: "product_clarification",
          clarificationCapability: outcome.clarificationCapability,
          target: outcome.target,
          question: outcome.question,
          answerValue: "",
          answerDetail: "",
        });
        return;
      }
      setProductionFlow({
        status: "error",
        reason: outcome.status,
        message: productionFlowMessage("notEligible"),
      });
    } catch {
      setProductionFlow({
        status: "error",
        reason: "technical_failure",
        message: productionFlowMessage("unavailable"),
      });
    }
  }

  async function submitProductClarification() {
    const answer =
      productionFlow.status === "product_clarification"
        ? buildPublicClarificationAnswerV1(productionFlow.target, {
            value: productionFlow.answerValue,
            detail: productionFlow.answerDetail,
          })
        : null;
    if (
      productionFlow.status !== "product_clarification" ||
      answer === null ||
      !safetyResult ||
      !isEligibleClassification(safetyResult.classification)
    ) {
      return;
    }
    const { clarificationCapability } = productionFlow;
    const classification = safetyResult.classification;
    setProductionFlow({ status: "preparing" });
    try {
      const response = await fetch("/api/consultations/clarifications", {
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clarificationCapability,
          answer,
        }),
      });
      if (!response.ok) throw new Error("PRODUCT_CLARIFICATION_FAILED");
      const outcome = decodeProductionPreparation(await response.json());
      if (!outcome) {
        throw new Error("PRODUCT_CLARIFICATION_INVALID");
      }
      const disposition = classifyClarificationContinuationV1(outcome.status);
      if (
        disposition === "not_full_product_candidate" ||
        disposition === "safety_blocked"
      ) {
        setProductionFlow({
          status: "error",
          reason: disposition,
          message: productionFlowMessage("notEligible"),
        });
        return;
      }
      if (
        disposition !== "purchase_ready" ||
        outcome.status !== "purchase_ready"
      ) {
        throw new Error("PRODUCT_CLARIFICATION_INVALID");
      }
      measureRequestComplete();
      if (prepaymentComputeEnabled && customerAuthEnabled) {
        setProductionFlow({
          status: "verified",
          preparationCapability: outcome.preparationCapability,
          maskedEmail: "確認済みアカウント",
        });
        setCompletedClassification(classification);
        return;
      }
      if (customerAuthEnabled) {
        if (customerAuthMethod) {
          await beginCustomerAuth(
            outcome.preparationCapability,
            customerAuthMethod,
          );
        } else {
          setProductionFlow({
            status: "auth_method",
            preparationCapability: outcome.preparationCapability,
          });
        }
      } else {
        await beginMailboxVerification(
          outcome.preparationCapability,
          classification,
        );
      }
    } catch {
      setProductionFlow({
        status: "error",
        reason: "technical_failure",
        message: productionFlowMessage("unavailable"),
      });
    }
  }

  async function submitEmailVerificationCode() {
    if (
      productionFlow.status !== "awaiting_email_code" ||
      !/^\d{8}$/u.test(productionFlow.verificationCode) ||
      !safetyResult ||
      !isEligibleClassification(safetyResult.classification)
    ) {
      return;
    }
    const current = productionFlow;
    try {
      const response = await fetch(
        "/api/delivery/email-verifications/verify",
        {
          method: "POST",
          credentials: "same-origin",
          cache: "no-store",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            challengeCapability: current.challengeCapability,
            verificationCode: current.verificationCode,
          }),
        },
      );
      if (!response.ok) throw new Error("EMAIL_VERIFICATION_FAILED");
      const data = readResponseData(await response.json());
      if (data?.status !== "verified" || typeof data.maskedEmail !== "string") {
        throw new Error("EMAIL_VERIFICATION_RESPONSE_INVALID");
      }
      setProductionFlow({
        status: "verified",
        preparationCapability: current.preparationCapability,
        maskedEmail: data.maskedEmail,
      });
      setCompletedClassification(safetyResult.classification);
    } catch {
      setProductionFlow({
        ...current,
        verificationCode: "",
      });
      setErrors((existing) => ({
        ...existing,
        email: productionFlowMessage("invalidCode"),
      }));
    }
  }

  async function startStripeCheckout() {
    if (productionFlow.status !== "verified") return;
    const verified = productionFlow;
    setCheckoutError(null);
    setProductionFlow({
      status: "checkout_starting",
      preparationCapability: verified.preparationCapability,
      maskedEmail: verified.maskedEmail,
    });
    try {
      const response = await fetch("/api/payments/checkout", {
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          preparationCapability: verified.preparationCapability,
        }),
      });
      if (!response.ok) throw new Error("PAYMENT_CHECKOUT_FAILED");
      const data = readResponseData(await response.json());
      if (data?.status !== "checkout_ready" || typeof data.checkoutUrl !== "string") {
        throw new Error("PAYMENT_CHECKOUT_RESPONSE_INVALID");
      }
      const checkoutUrl = new URL(data.checkoutUrl);
      if (
        checkoutUrl.origin !== "https://checkout.stripe.com" ||
        checkoutUrl.username !== "" ||
        checkoutUrl.password !== ""
      ) {
        throw new Error("PAYMENT_CHECKOUT_URL_INVALID");
      }
      trackClientMeasurement("checkout_start", { provider: "stripe" });
      window.location.assign(checkoutUrl.toString());
    } catch {
      setProductionFlow(verified);
      setCheckoutError(productionFlowMessage("unavailable"));
    }
  }

  async function submitPhaseFour(authMethod: CustomerAuthMethod | null) {
    const sheetErrors = validateSheet(form);
    const emailErrors =
      customerAuthEnabled && authMethod !== "email_otp"
        ? {}
        : validateEmail(form);
    if (customerAuthEnabled && authMethod === null) return;
    if (Object.keys(sheetErrors).length > 0) {
      setPhase(1);
      setErrors(sheetErrors);
      focusFirstError(sheetErrors);
      return;
    }
    if (Object.keys(emailErrors).length > 0) {
      setErrors(emailErrors);
      focusFirstError(emailErrors);
      return;
    }
    if (
      customerAuthEnabled &&
      authMethod !== null &&
      productionFlow.status === "auth_method"
    ) {
      await beginCustomerAuth(
        productionFlow.preparationCapability,
        authMethod,
      );
      return;
    }

    setErrors({});
    const result = await requestServerEvaluation();
    if (
      result &&
      isEligibleClassification(result.classification) &&
      result.productScope.decision === "eligible" &&
      result.purchaseGateSatisfied
    ) {
      if (paymentEnabled) {
        await prepareProductionPurchase(result.classification, authMethod);
        return;
      }
      setCompletedClassification(result.classification);
      window.setTimeout(() => {
        document.getElementById("request-local-complete")?.focus();
      }, 0);
      return;
    }

    setPhase(2);
    if (result?.productScope.decision === "needs_clarification") return;
    if (result && isEligibleClassification(result.classification)) {
      const nextErrors = {
        safetyBlocking: "必要な利用確認をもう一度確認してください。",
      } satisfies ValidationErrors;
      setErrors(nextErrors);
      focusFirstError(nextErrors);
    }
  }

  async function handleEmailSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await runPhaseFour(customerAuthEnabled ? customerAuthMethod : null);
  }

  async function runPhaseFour(authMethod: CustomerAuthMethod | null) {
    if (authEntryPendingRef.current) return;
    authEntryPendingRef.current = true;
    setAuthEntryPending(true);
    try {
      await submitPhaseFour(authMethod);
    } finally {
      if (authMethod === "google") googleAuthClientTimingRef.current = null;
      authEntryPendingRef.current = false;
      setAuthEntryPending(false);
    }
  }

  function selectCustomerAuthMethod(method: CustomerAuthMethod) {
    setCustomerAuthMethod(method);
    setErrors({});
    if (method === "google") {
      googleAuthClientTimingRef.current = beginGoogleAuthClientTiming();
      void runPhaseFour(method);
      return;
    }
    window.setTimeout(() => document.getElementById("request-email")?.focus(), 0);
  }

  function switchToOrganization() {
    clearServerAssessment();
    setSafety((current) => ({
      ...current,
      requestedAssistanceGoal: "understand_and_organize",
      clarificationAnswers: emptyClarificationAnswers,
      scopeAcknowledgements: emptyScopeAcknowledgements,
      attestationConfirmed: false,
    }));
    setErrors({});
    window.setTimeout(() => {
      document.getElementById("requestedAssistanceGoal")?.focus();
      document
        .getElementById("requestedAssistanceGoal")
        ?.scrollIntoView({ block: "center" });
    }, 0);
  }

  const completedPresentation = completedClassification
    ? eligiblePresentations[completedClassification]
    : null;

  if (completedPresentation) {
    return (
      <section className="request-sheet-wrap">
        <RequestFragmentTargets />
        <LocalPurchaseConfirmation
          form={form}
          presentation={completedPresentation}
          paymentEnabled={paymentEnabled}
          verifiedEmail={
            productionFlow.status === "verified" ||
            productionFlow.status === "checkout_starting"
              ? productionFlow.maskedEmail
              : null
          }
          checkoutBusy={productionFlow.status === "checkout_starting"}
          checkoutError={checkoutError}
          onCheckout={() => void startStripeCheckout()}
          onEditEmail={() => {
            setCompletedClassification(null);
            setProductionFlow({ status: "idle" });
            setCustomerAuthMethod(null);
            setCheckoutError(null);
            moveToPhase(4);
          }}
          customerAuthEnabled={customerAuthEnabled}
        />
      </section>
    );
  }

  const errorList = Object.entries(errors);
  const isCandidateMessageRequired = candidateMessageRequired(form.whatToKnow);
  const gatePresentation = gatePrompt
    ? presentationFor(gatePrompt.classification)
    : null;
  const memoPresentation =
    safetyResult?.productScope.decision === "eligible"
    ? presentationFor(safetyResult.classification)
    : null;
  const productScopeClarification =
    safetyResult &&
    isEligibleClassification(safetyResult.classification) &&
    safetyResult.productScope.decision === "needs_clarification"
      ? safetyResult.productScope
      : null;
  const stopKind: PrePaymentSafetyStopKind | null =
    safetyResult?.classification === "blocked_unsafe_assistance" ||
    safetyResult?.classification === "urgent_safety_redirect" ||
    safetyResult?.classification === "unsupported_professional_request"
      ? safetyResult.classification
      : null;
  const clarificationSubmitted =
    safety.clarificationAnswers.submissionCount === 1;
  const interactiveClarificationCodes = clarificationCodes.filter(
    hasInteractiveClarification,
  );

  return (
    <section
      className="request-sheet-wrap"
      onChangeCapture={measureRequestStart}
    >
      <RequestFragmentTargets />
      <nav className="request-progress" aria-label="鑑定依頼シートの進行状況">
        {([1, 2, 3, 4] as Phase[]).map((item) => (
          <span key={item} aria-current={phase === item ? "step" : undefined}>
            <small>{item}</small>
            {phaseTitles[item]}
          </span>
        ))}
      </nav>

      {errorList.length > 0 ? (
        <div className="request-error-summary" role="alert" aria-live="assertive">
          <h2>入力内容を確認してください</h2>
          <ul>
            {errorList.map(([key, message]) => (
              <li key={key}>{message}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {phase === 1 ? (
        <article
          id="request-phase-1"
          className="request-sheet"
          aria-labelledby="request-phase-1-title"
        >
          <header className="request-sheet__heading">
            <p>01 / 相談入力</p>
            <h2 id="request-phase-1-title">今の状況を、そのまま置いてください。</h2>
            <span>短くても、まとまっていなくても大丈夫です。</span>
          </header>

          <div className="request-field request-field--choice">
            <label id="adultConfirmed" tabIndex={-1}>
              <input
                type="checkbox"
                checked={form.adultConfirmed}
                onChange={(event) => updateAdultConfirmed(event.target.checked)}
              />
              <span>私は18歳以上です</span>
              <small>必須 / 生年月日や本人確認書類は入力しません</small>
            </label>
            <FieldError id="adultConfirmed-error" message={errors.adultConfirmed} />
          </div>

          <fieldset
            id="relationship"
            tabIndex={-1}
            className="request-field"
            aria-describedby={errors.relationship ? "relationship-error" : undefined}
          >
            <legend>
              今の関係 <span>必須</span>
            </legend>
            <div className="request-chip-group">
              {relationshipOptions.map((option) => (
                <label key={option.value}>
                  <input
                    type="radio"
                    name="relationship"
                    value={option.label}
                    checked={form.relationship === option.label}
                    onChange={(event) =>
                      updateString("relationship", event.target.value)
                    }
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
            <FieldError id="relationship-error" message={errors.relationship} />
          </fieldset>

          <fieldset
            id="whatToKnow"
            tabIndex={-1}
            className="request-field"
            aria-describedby="what-to-know-note whatToKnow-error"
          >
            <legend>
              今夜、知りたいこと <span>必須</span>
            </legend>
            <p id="what-to-know-note">1つまたは2つ選んでください。</p>
            <div className="request-chip-group">
              {whatToKnowOptions.map((option) => (
                <label key={option.value}>
                  <input
                    type="checkbox"
                    checked={form.whatToKnow.includes(option.label)}
                    onChange={() => toggleWhatToKnow(option.label)}
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
            <FieldError id="whatToKnow-error" message={errors.whatToKnow} />
          </fieldset>

          <div className="request-field request-field--situation">
            <label htmlFor="currentSituation">
              今の状況を教えてください <span>必須</span>
            </label>
            <p id="current-situation-note">
              相手との関係、最近あったこと、返事を待っている期間、気になっていることなどを自由に書いてください。
            </p>
            <textarea
              id="currentSituation"
              name="currentSituation"
              rows={9}
              maxLength={5000}
              value={form.currentSituation}
              onChange={(event) =>
                updateString("currentSituation", event.target.value)
              }
              aria-invalid={Boolean(errors.currentSituation)}
              aria-describedby="current-situation-note privacy-note currentSituation-error"
              placeholder="例：二度会ったあと、昨日から返事を待っています。追い連絡をすると急かすように見えないか気になっています。"
            />
            <aside id="privacy-note" className="request-privacy-note" role="note">
              <strong>入力しない情報</strong>
              <span>
                実名、住所、電話番号、勤務先、学校名、SNSアカウントID、顔写真、身分証明書、第三者の秘密情報
              </span>
            </aside>
            <FieldError id="currentSituation-error" message={errors.currentSituation} />
          </div>

          <div className="request-field">
            <label htmlFor="nickname">
              ニックネーム <small>任意</small>
            </label>
            <p>実名ではなく、鑑定ノート内で呼ばれたい名前を入力できます。</p>
            <input
              id="nickname"
              name="nickname"
              type="text"
              value={form.nickname}
              onChange={(event) => updateString("nickname", event.target.value)}
            />
          </div>

          <details
            className="request-message-details"
            open={messageDetailsOpen}
            onToggle={(event) => setMessageDetailsOpen(event.currentTarget.open)}
          >
            <summary>
              {isCandidateMessageRequired
                ? "送ろうとしている文面を追加する"
                : "実際のメッセージを追加する"}
              <span
                className={
                  isCandidateMessageRequired
                    ? "request-message-details__required"
                    : undefined
                }
              >
                {isCandidateMessageRequired ? "必須" : "任意"}
              </span>
            </summary>
            <div>
              <label htmlFor="partnerMessage">
                相手から届いた文面 <small>任意</small>
              </label>
              <textarea
                id="partnerMessage"
                name="partnerMessage"
                rows={4}
                maxLength={2000}
                value={form.partnerMessage}
                onChange={(event) =>
                  updateString("partnerMessage", event.target.value)
                }
              />
              <label htmlFor="draftMessage">
                自分が送ろうとしている文面
                {isCandidateMessageRequired ? <span>必須</span> : <small>任意</small>}
              </label>
              <p id="draft-message-note" className="request-message-details__hint">
                {isCandidateMessageRequired
                  ? "この文面がどう届くかを確認するため、実際に送ろうとしている文面を入力してください。"
                  : "文面について確認したい場合だけ入力してください。"}
              </p>
              <textarea
                id="draftMessage"
                name="draftMessage"
                rows={4}
                maxLength={2000}
                value={form.draftMessage}
                onChange={(event) =>
                  updateString("draftMessage", event.target.value)
                }
                required={isCandidateMessageRequired}
                aria-required={isCandidateMessageRequired}
                aria-invalid={Boolean(errors.draftMessage)}
                aria-describedby="draft-message-note draftMessage-error"
              />
              <FieldError id="draftMessage-error" message={errors.draftMessage} />
            </div>
          </details>

          <footer className="request-phase-actions request-phase-actions--end">
            <button
              type="button"
              className="button button--primary"
              onClick={continueFromSheet}
            >
              利用確認へ
            </button>
          </footer>
        </article>
      ) : null}

      {phase === 2 ? (
        <article
          id="request-phase-2"
          className="request-sheet request-sheet--safety"
          aria-labelledby="request-phase-2-title"
        >
          <header className="request-sheet__heading">
            <p>02 / 鑑定前の確認</p>
            <h2 id="request-phase-2-title">鑑定前の確認</h2>
          </header>

          <p className={styles.supportCopy}>{phaseTwoIntro}</p>

          <fieldset
            id="contactBoundaryState"
            tabIndex={-1}
            className={styles.questionGroup}
            aria-describedby="contact-boundary-hint contactBoundaryState-error"
          >
            <legend>
              現在、相手との連絡状況に最も近いものを選んでください。
              <span>必須</span>
            </legend>
            <p id="contact-boundary-hint" className={styles.questionHint}>
              相手から伝えられた内容と、現在の連絡手段の状態で選んでください。
            </p>
            <div className={styles.choiceList}>
              {primaryContactBoundaryOptions.map((option) => (
                <label key={option.value} className={styles.choice}>
                  <input
                    type="radio"
                    name="contact-boundary"
                    value={option.value}
                    checked={safety.contactBoundaryState === option.value}
                    onChange={() => selectContactBoundary(option.value)}
                  />
                  <span className={styles.choiceContent}>
                    <strong className={styles.choiceLabel}>{option.label}</strong>
                    {option.helper ? (
                      <small className={styles.choiceHelper}>{option.helper}</small>
                    ) : null}
                  </span>
                </label>
              ))}
            </div>
            <details className={styles.secondaryChoices}>
              <summary>その他の連絡状況はこちら</summary>
              <div className={styles.choiceList}>
                {secondaryContactBoundaryOptions.map((option) => (
                  <label key={option.value} className={styles.choice}>
                    <input
                      type="radio"
                      name="contact-boundary"
                      value={option.value}
                      checked={safety.contactBoundaryState === option.value}
                      onChange={() => selectContactBoundary(option.value)}
                    />
                    <span className={styles.choiceContent}>
                      <strong className={styles.choiceLabel}>{option.label}</strong>
                      {option.helper ? (
                        <small className={styles.choiceHelper}>{option.helper}</small>
                      ) : null}
                    </span>
                  </label>
                ))}
              </div>
            </details>
            <details
              className={`${styles.secondaryChoices} ${styles.urgentSafetyEntry}`}
            >
              <summary>
                いま、自分や相手の安全に関わる緊急な状況がある場合
              </summary>
              <div className={styles.choiceList}>
                <label className={styles.choice}>
                  <input
                    type="radio"
                    name="contact-boundary"
                    value={urgentSafetyContactBoundaryOption.value}
                    checked={
                      safety.contactBoundaryState ===
                      urgentSafetyContactBoundaryOption.value
                    }
                    onChange={() =>
                      selectContactBoundary(urgentSafetyContactBoundaryOption.value)
                    }
                  />
                  <span className={styles.choiceContent}>
                    <strong className={styles.choiceLabel}>
                      {urgentSafetyContactBoundaryOption.label}
                    </strong>
                    <small className={styles.choiceHelper}>
                      {urgentSafetyContactBoundaryOption.helper}
                    </small>
                  </span>
                </label>
              </div>
            </details>
            <FieldError
              id="contactBoundaryState-error"
              message={errors.contactBoundaryState}
            />
          </fieldset>

          <fieldset
            id="requestedAssistanceGoal"
            tabIndex={-1}
            className={styles.questionGroup}
            aria-describedby="assistance-goal-hint requestedAssistanceGoal-error"
          >
            <legend>
              今回、月の返事に最も手伝ってほしいことを選んでください。
              <span>必須</span>
            </legend>
            <p id="assistance-goal-hint" className={styles.questionHint}>
              いちばん近い目的を1つ選んでください。
            </p>
            <div className={styles.choiceList}>
              {primaryAssistanceOptions.map((option) => (
                <label key={option.value} className={styles.choice}>
                  <input
                    type="radio"
                    name="assistance-goal"
                    value={option.value}
                    checked={safety.requestedAssistanceGoal === option.value}
                    onChange={() => selectAssistanceGoal(option.value)}
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
            <details className={styles.secondaryChoices}>
              <summary>その他の目的に当てはまる場合</summary>
              <div className={styles.choiceList}>
                {secondaryAssistanceOptions.map((option) => (
                  <label key={option.value} className={styles.choice}>
                    <input
                      type="radio"
                      name="assistance-goal"
                      value={option.value}
                      checked={safety.requestedAssistanceGoal === option.value}
                      onChange={() => selectAssistanceGoal(option.value)}
                    />
                    <span>{option.label}</span>
                  </label>
                ))}
              </div>
            </details>
            <FieldError
              id="requestedAssistanceGoal-error"
              message={errors.requestedAssistanceGoal}
            />
          </fieldset>

          <div className="request-phase-actions request-phase-actions--end">
            <button
              type="button"
              className="button button--primary"
              onClick={classifyCurrentInput}
              disabled={safetyBusy}
            >
              {safetyBusy ? "利用確認中です" : "この内容で確認する"}
            </button>
          </div>

          {safetyBusy ? (
            <p className={styles.pendingNote} role="status" aria-live="polite">
              現在の入力を確認しています。
            </p>
          ) : null}

          {safetyApiError ? (
            <section
              className={styles.apiError}
              role="alert"
              aria-labelledby="prepayment-api-error-title"
            >
              <p className={styles.eyebrow}>利用確認を完了できませんでした</p>
              <h3
                id="prepayment-api-error-title"
                ref={apiErrorHeadingRef}
                tabIndex={-1}
              >
                現在、利用確認を完了できません。
              </h3>
              <p>{apiUnavailableCopy}</p>
            </section>
          ) : null}

          {productScopeClarification ? (
            <section
              id="product-scope-clarification"
              tabIndex={-1}
              className={styles.clarificationCard}
              role="status"
              aria-labelledby="product-scope-clarification-title"
            >
              <p className={styles.eyebrow}>鑑定できる内容の確認</p>
              <h3
                id="product-scope-clarification-title"
                ref={productScopeHeadingRef}
                tabIndex={-1}
              >
                {productScopeClarification.clarificationCode ===
                "message_candidate_required"
                  ? "確認したい文面を追加してください"
                  : "恋愛・相手との関係・メッセージについての相談ですか？"}
              </h3>
              <p className={styles.clarificationLead}>
                {productScopeClarification.clarificationCode ===
                "message_candidate_required"
                  ? "「この文面がどう届くか」を確認するには、自分が送ろうとしている実際の文面が必要です。"
                  : "月の返事は、恋愛メッセージ、相手との関係、返信・送信・距離感についての鑑定です。該当する場合は、その関係や迷っていることが分かるよう相談内容を追加してください。"}
              </p>
              <div className={styles.clarificationActions}>
                <button
                  type="button"
                  className={styles.resultAction}
                  onClick={() =>
                    focusPhaseOneField(
                      productScopeClarification.clarificationCode ===
                        "message_candidate_required"
                        ? "draftMessage"
                        : "currentSituation",
                    )
                  }
                >
                  {productScopeClarification.clarificationCode ===
                  "message_candidate_required"
                    ? "送ろうとしている文面を追加する"
                    : "相談内容を見直す"}
                </button>
              </div>
              <p className={styles.paymentNote}>この画面では決済は発生しません。</p>
            </section>
          ) : null}

          {gatePrompt && gatePresentation ? (
            <section
              className={styles.eligibleCard}
              role="status"
              aria-labelledby="prepayment-eligible-result-title"
            >
              <p className={styles.eyebrow}>利用確認の結果</p>
              <h3 id="prepayment-eligible-result-title">
                {gatePresentation.heading}
              </h3>
              <p className={styles.eligibleLead}>{gatePresentation.description}</p>
              <div className={styles.scopeDisclosure}>
                <strong>この鑑定でお返しするもの</strong>
                <ul className={styles.eligibleProvideList}>
                  {gatePresentation.provides.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div className={styles.scopeDisclosure}>
                <strong>文案について</strong>
                <p>{gatePresentation.draftAvailability}</p>
              </div>
              <div
                id="scopeAcknowledgements"
                tabIndex={-1}
                className={styles.gateControls}
              >
                {gatePrompt.requiredAcknowledgementCodes.map((code) => {
                  const copy = scopeAcknowledgementCopy[code];
                  if (!copy) return null;
                  return (
                    <label key={code} className={styles.checkChoice}>
                      <input
                        type="checkbox"
                        checked={safety.scopeAcknowledgements[copy.key]}
                        onChange={(event) =>
                          updateScopeAcknowledgement(copy.key, event.target.checked)
                        }
                      />
                      <span>{copy.text}</span>
                    </label>
                  );
                })}
                {gatePrompt.requiredAcknowledgementCodes.includes(
                  "attestation_confirmed",
                ) ? (
                  <label
                    id="attestationConfirmed"
                    tabIndex={-1}
                    className={styles.checkChoice}
                  >
                    <input
                      type="checkbox"
                      checked={safety.attestationConfirmed}
                      onChange={(event) =>
                        updateAttestation(event.target.checked)
                      }
                    />
                    <span>{attestationText}</span>
                  </label>
                ) : null}
              </div>
              <FieldError
                id="scopeAcknowledgements-error"
                message={errors.scopeAcknowledgements}
              />
              <FieldError
                id="attestationConfirmed-error"
                message={errors.attestationConfirmed}
              />
              {safetyResult?.purchaseGateSatisfied ? (
                <p className={styles.readyNote}>現在の入力で必要な確認が完了しました。</p>
              ) : (
                <p className={styles.pendingNote}>
                  確認項目を変更した場合は、現在の入力でもう一度確認します。
                </p>
              )}
              <footer className="request-phase-actions">
                <button
                  type="button"
                  className={`button button--secondary ${styles.paperSecondary}`}
                  onClick={() => moveToPhase(1)}
                >
                  相談内容へ戻る
                </button>
                <button
                  type="button"
                  className="button button--primary"
                  onClick={continueFromSafety}
                  disabled={safetyBusy}
                >
                  現在の入力で再確認して依頼メモへ
                </button>
              </footer>
            </section>
          ) : null}

          {clarificationCodes.length > 0 ? (
            <section
              id="clarification"
              tabIndex={-1}
              className={styles.clarificationCard}
              role="status"
              aria-labelledby="prepayment-clarification-title"
            >
              <p className={styles.eyebrow}>必要なことだけ確認します</p>
              <h3
                id="prepayment-clarification-title"
                ref={clarificationHeadingRef}
                tabIndex={-1}
              >
                もう少しだけ確認させてください
              </h3>
              <p className={styles.clarificationLead}>
                表示されている項目だけを確認します。この確認は一度までです。
              </p>
              <div className={styles.clarificationFields}>
                {clarificationCodes.includes("boundary_state_required") ? (
                  <ClarificationField legend="現在の連絡状況を、もう一度確認してください。">
                    {[
                      ...primaryContactBoundaryOptions,
                      ...secondaryContactBoundaryOptions,
                    ]
                      .filter((option) => option.value !== "unknown")
                      .map((option) => (
                        <ClarificationChoice
                          key={option.value}
                          name="clarified-contact-boundary"
                          value={option.value}
                          checked={
                            safety.clarificationAnswers
                              .clarifiedContactBoundaryState === option.value
                          }
                          label={option.label}
                          disabled={clarificationSubmitted}
                          onChange={() =>
                            updateClarificationAnswer(
                              "clarifiedContactBoundaryState",
                              option.value,
                            )
                          }
                        />
                      ))}
                  </ClarificationField>
                ) : null}

                {clarificationCodes.includes("boundary_state_conflict") ? (
                  <div className={styles.clarificationField}>
                    <strong>選択した連絡状況と相談文に食い違いがあります。</strong>
                    <p className={styles.clarificationLead}>
                      追加回答で推測せず、連絡状況の選択または元の相談文を見直して、利用確認を最初からやり直してください。
                    </p>
                    <div className={styles.clarificationActions}>
                      <button
                        type="button"
                        className={styles.resultAction}
                        onClick={focusContactBoundarySelection}
                      >
                        連絡状況の選択を見直す
                      </button>
                      <button
                        type="button"
                        className={styles.resultAction}
                        onClick={() => focusPhaseOneField("currentSituation")}
                      >
                        相談文を見直す
                      </button>
                    </div>
                  </div>
                ) : null}

                {clarificationCodes.includes(
                  "unsafe_execution_intent_required",
                ) ? (
                  <ClarificationField legend="相談文にある方法について、現在の意図に最も近いものを選んでください。">
                    {[
                      ["execution_requested", "その方法を実行したい"],
                      ["stopping_or_avoiding", "実行せず、やめる・避ける方向で整理したい"],
                      ["still_unclear", "まだ判断できない"],
                    ].map(([value, label]) => (
                      <ClarificationChoice
                        key={value}
                        name="unsafe-execution-intent"
                        value={value}
                        checked={
                          safety.clarificationAnswers.unsafeExecutionIntent ===
                          value
                        }
                        label={label}
                        disabled={clarificationSubmitted}
                        onChange={() =>
                          updateClarificationAnswer(
                            "unsafeExecutionIntent",
                            value as (typeof UNSAFE_EXECUTION_INTENT_ANSWERS)[number],
                          )
                        }
                      />
                    ))}
                  </ClarificationField>
                ) : null}

                {clarificationCodes.includes("current_safety_status_required") ? (
                  <ClarificationField legend="安全に関わる状況は、現在も続いていますか。">
                    {[
                      ["current_urgent", "現在の安全に関わる緊急性がある"],
                      ["not_current", "過去のことで、現在の安全に関わる緊急性はない"],
                      ["still_unclear", "まだ判断できない"],
                    ].map(([value, label]) => (
                      <ClarificationChoice
                        key={value}
                        name="current-safety-status"
                        value={value}
                        checked={
                          safety.clarificationAnswers.currentSafetyStatus === value
                        }
                        label={label}
                        disabled={clarificationSubmitted}
                        onChange={() =>
                          updateClarificationAnswer(
                            "currentSafetyStatus",
                            value as (typeof CURRENT_SAFETY_STATUS_ANSWERS)[number],
                          )
                        }
                      />
                    ))}
                  </ClarificationField>
                ) : null}

                {clarificationCodes.includes("business_permission_required") ? (
                  <ClarificationField legend="業務・荷物・金銭など、必要な実務連絡が明確に許可されていますか。">
                    {[
                      ["yes", "はい"],
                      ["no", "いいえ"],
                      ["unknown", "判断できない"],
                    ].map(([value, label]) => (
                      <ClarificationChoice
                        key={value}
                        name="business-permission"
                        value={value}
                        checked={
                          safety.clarificationAnswers.practicalPermissionExplicit ===
                          value
                        }
                        label={label}
                        disabled={clarificationSubmitted}
                        onChange={() =>
                          updateClarificationAnswer(
                            "practicalPermissionExplicit",
                            value as "yes" | "no" | "unknown",
                          )
                        }
                      />
                    ))}
                  </ClarificationField>
                ) : null}

                {clarificationCodes.includes("business_scope_required") ? (
                  <ClarificationField legend="今回の依頼は、許可された実務上の用件だけに完全に限定されていますか。">
                    {[
                      ["yes", "はい"],
                      ["no", "いいえ"],
                      ["unknown", "判断できない"],
                    ].map(([value, label]) => (
                      <ClarificationChoice
                        key={value}
                        name="business-scope"
                        value={value}
                        checked={
                          safety.clarificationAnswers
                            .currentRequestPracticalScopeOnly === value
                        }
                        label={label}
                        disabled={clarificationSubmitted}
                        onChange={() =>
                          updateClarificationAnswer(
                            "currentRequestPracticalScopeOnly",
                            value as "yes" | "no" | "unknown",
                          )
                        }
                      />
                    ))}
                  </ClarificationField>
                ) : null}

                {clarificationCodes.includes("reply_invitation_required") ? (
                  <ClarificationField legend="新しいメッセージは、返答を明確に求めるか、返答してよいことを明確に示していますか。">
                    {[
                      ["yes", "はい"],
                      ["no", "いいえ"],
                      ["unknown", "判断できない"],
                    ].map(([value, label]) => (
                      <ClarificationChoice
                        key={value}
                        name="reply-invitation"
                        value={value}
                        checked={
                          safety.clarificationAnswers.replyExplicitlyInvited ===
                          value
                        }
                        label={label}
                        disabled={clarificationSubmitted}
                        onChange={() =>
                          updateClarificationAnswer(
                            "replyExplicitlyInvited",
                            value as "yes" | "no" | "unknown",
                          )
                        }
                      />
                    ))}
                  </ClarificationField>
                ) : null}

                {clarificationCodes.includes("reply_scope_required") ? (
                  <ClarificationField legend="予定している返答は、その新しいメッセージの用件と範囲だけに限定されていますか。">
                    {[
                      ["yes", "はい"],
                      ["no", "いいえ"],
                      ["unknown", "判断できない"],
                    ].map(([value, label]) => (
                      <ClarificationChoice
                        key={value}
                        name="reply-scope"
                        value={value}
                        checked={
                          safety.clarificationAnswers.replyLimitedToExactSubject ===
                          value
                        }
                        label={label}
                        disabled={clarificationSubmitted}
                        onChange={() =>
                          updateClarificationAnswer(
                            "replyLimitedToExactSubject",
                            value as "yes" | "no" | "unknown",
                          )
                        }
                      />
                    ))}
                  </ClarificationField>
                ) : null}

                {clarificationCodes.includes("professional_scope_required") ? (
                  <ClarificationField legend="専門判断を含めず、気持ちや状況の整理だけに相談内容を限定できますか。">
                    {[
                      ["yes", "はい"],
                      ["no", "いいえ"],
                      ["unknown", "判断できない"],
                    ].map(([value, label]) => (
                      <ClarificationChoice
                        key={value}
                        name="professional-scope"
                        value={value}
                        checked={
                          safety.clarificationAnswers
                            .professionalScopeLimitedToNonprofessionalOrganization ===
                          value
                        }
                        label={label}
                        disabled={clarificationSubmitted}
                        onChange={() =>
                          updateClarificationAnswer(
                            "professionalScopeLimitedToNonprofessionalOrganization",
                            value as "yes" | "no" | "unknown",
                          )
                        }
                      />
                    ))}
                  </ClarificationField>
                ) : null}

                {clarificationCodes.includes(
                  "latest_inbound_message_required",
                ) ? (
                  <div className={styles.clarificationField}>
                    <strong>相手から届いた最新の文面が必要です。</strong>
                    <p className={styles.clarificationLead}>
                      文面を推測せず、実際に届いた最新の文面を追加してから利用確認をやり直してください。
                    </p>
                    <button
                      type="button"
                      className={styles.resultAction}
                      onClick={() => focusPhaseOneField("partnerMessage")}
                    >
                      相手から届いた最新の文面を追加する
                    </button>
                  </div>
                ) : null}

                {clarificationCodes.includes("structured_content_conflict") ? (
                  <div className={styles.clarificationField}>
                    <strong>選択内容と相談文に食い違いがあります。</strong>
                    <p className={styles.clarificationLead}>
                      結果を推測せず、連絡状況の選択または元の相談文を見直して、利用確認をやり直してください。
                    </p>
                    <button
                      type="button"
                      className={styles.resultAction}
                      onClick={() => focusPhaseOneField("currentSituation")}
                    >
                      相談文を見直す
                    </button>
                  </div>
                ) : null}
              </div>
              <FieldError id="clarification-error" message={errors.clarification} />
              {clarificationSubmitted ? (
                <p className={styles.pendingNote}>
                  一度の確認で解消しなかったため、購入へは進みません。連絡状況または元の相談文を修正し、利用確認をやり直してください。
                </p>
              ) : null}
              <div className={styles.clarificationActions}>
                {interactiveClarificationCodes.length > 0 &&
                !clarificationSubmitted ? (
                  <button
                    type="button"
                    className="button button--primary"
                    onClick={submitClarification}
                    disabled={safetyBusy}
                  >
                    回答して利用確認を続ける
                  </button>
                ) : null}
                <button
                  type="button"
                  className={`button button--secondary ${styles.paperSecondary}`}
                  onClick={() => focusPhaseOneField("currentSituation")}
                >
                  元の相談内容を見直す
                </button>
              </div>
              <p className={styles.paymentNote}>この画面では決済は発生しません。</p>
            </section>
          ) : null}

          {stopKind ? (
            <PrePaymentSafetyStop
              key={stopKind}
              kind={stopKind}
              onSwitchToOrganization={
                stopKind === "urgent_safety_redirect"
                  ? undefined
                  : switchToOrganization
              }
            />
          ) : null}

          <footer className="request-phase-actions">
            <button
              type="button"
              className={`button button--secondary ${styles.paperSecondary}`}
              onClick={() => moveToPhase(1)}
            >
              相談内容へ戻る
            </button>
          </footer>
        </article>
      ) : null}

      {phase === 3 && memoPresentation ? (
        <div id="request-phase-3">
          <RequestMemo
            form={form}
            presentation={memoPresentation}
            onEdit={moveToPhase}
            onContinue={continueFromMemo}
          />
        </div>
      ) : null}

      {phase === 4 ? (
        <article
          id="request-phase-4"
          className="request-sheet request-sheet--email"
          aria-labelledby="request-phase-4-title"
        >
          <header className="request-sheet__heading">
            <p>04 / 受け取り</p>
            <h2 id="request-phase-4-title">
              {customerAuthEnabled
                ? "最後に、続ける方法を選びます。"
                : "最後に、受け取り先を入力します。"}
            </h2>
            <span>
              {customerAuthEnabled
                ? "相談入力と利用確認が終わった後に、ご本人確認を行います。"
                : "相談入力と利用確認が終わった後にだけ伺います。"}
            </span>
          </header>
          <form noValidate onSubmit={handleEmailSubmit}>
            {paymentEnabled &&
            customerAuthEnabled &&
            (productionFlow.status === "idle" ||
              productionFlow.status === "auth_method" ||
              productionFlow.status === "error") ? (
              <div className="request-field request-email-verification">
                <strong>続ける方法を選んでください</strong>
                <p>
                  Googleまたはメールでご本人確認を行います。Googleで登録した場合は、次回もGoogleで続けてください。
                </p>
                <button
                  type="button"
                  className="button button--primary"
                  disabled={authEntryPending || safetyBusy}
                  onClick={() => selectCustomerAuthMethod("google")}
                >
                  Googleで続ける
                </button>
                <button
                  type="button"
                  className={`button button--secondary ${styles.paperSecondary}`}
                  disabled={authEntryPending || safetyBusy}
                  onClick={() => selectCustomerAuthMethod("email_otp")}
                >
                  メールで続ける
                </button>
                <small>
                  メールが届かない場合、Googleで登録した方はGoogleで続けてください。アカウントの有無や登録方法は表示しません。
                </small>
              </div>
            ) : null}
            {!customerAuthEnabled ||
            (customerAuthMethod === "email_otp" &&
              (productionFlow.status === "idle" ||
                productionFlow.status === "auth_method" ||
                productionFlow.status === "error")) ? (
              <div className="request-field">
                <label htmlFor="request-email">
                  {customerAuthEnabled
                    ? "メールアドレス"
                    : "受け取りメールアドレス"}{" "}
                  <span>必須</span>
                </label>
                <p id="email-note">
                  {customerAuthEnabled
                    ? "確認コードを受け取れるメールアドレスを入力してください。"
                    : paymentEnabled
                      ? "鑑定結果の送付と、ご購入に関する重要な連絡に使用します。確認コードで受け取り先を確かめます。"
                      : "鑑定結果の送付と、ご購入に関する重要な連絡に使用する予定です。現在は送信も保存もされません。"}
                </p>
                <input
                  id="request-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={(event) => updateString("email", event.target.value)}
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby="email-note email-error"
                />
                <FieldError id="email-error" message={errors.email} />
              </div>
            ) : null}
            {paymentEnabled &&
            customerAuthEnabled &&
            productionFlow.status === "awaiting_auth_email_otp" ? (
              <div className="request-field request-email-verification">
                <label htmlFor="customer-auth-email-otp">
                  メールに届いた確認コード <span>必須</span>
                </label>
                <p>
                  Supabase Authの確認コードを入力してください。従来の8桁メール確認とは別の仕組みです。
                </p>
                <input
                  id="customer-auth-email-otp"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={12}
                  value={productionFlow.otp}
                  onChange={(event) => {
                    const otp = event.target.value.replace(/[^A-Za-z0-9]/gu, "");
                    setProductionFlow({ ...productionFlow, otp });
                    clearFieldError("email");
                  }}
                  aria-invalid={Boolean(errors.email)}
                />
                <button
                  type="button"
                  className="button button--primary"
                  disabled={!/^[A-Za-z0-9]{6,12}$/u.test(productionFlow.otp)}
                  onClick={() => void submitCustomerAuthEmailOtp()}
                >
                  このコードで続ける
                </button>
              </div>
            ) : null}
            {paymentEnabled &&
            customerAuthEnabled &&
            (productionFlow.status === "auth_email_requesting" ||
              productionFlow.status === "auth_google_redirecting") ? (
              <p role="status">
                {productionFlow.status === "auth_google_redirecting"
                  ? "Googleの確認画面を準備しています。"
                  : "確認メールをリクエストしています。"}
              </p>
            ) : null}
            {paymentEnabled &&
            productionFlow.status === "product_clarification" ? (
              <ProductClarificationInput
                flow={productionFlow}
                onChange={(draft) =>
                  setProductionFlow({ ...productionFlow, ...draft })
                }
                onSubmit={() => void submitProductClarification()}
              />
            ) : null}
            {paymentEnabled &&
            productionFlow.status === "awaiting_email_code" ? (
              <div className="request-field request-email-verification">
                <label htmlFor="email-verification-code">
                  メールに届いた8桁の確認コード <span>必須</span>
                </label>
                <p>
                  確認コードは一度だけ使用できます。メールアドレスを変更した場合は、もう一度確認します。
                </p>
                <input
                  id="email-verification-code"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={8}
                  value={productionFlow.verificationCode}
                  onChange={(event) => {
                    const verificationCode = event.target.value.replace(/\D/gu, "");
                    setProductionFlow({
                      ...productionFlow,
                      verificationCode,
                    });
                    clearFieldError("email");
                  }}
                  aria-invalid={Boolean(errors.email)}
                />
                <button
                  type="button"
                  className="button button--primary"
                  disabled={!/^\d{8}$/u.test(productionFlow.verificationCode)}
                  onClick={() => void submitEmailVerificationCode()}
                >
                  メールアドレスを確認する
                </button>
              </div>
            ) : null}
            {paymentEnabled && productionFlow.status === "error" ? (
              <p className="request-field-error" role="alert">
                {productionFlow.message}
              </p>
            ) : null}
            <div className="request-runtime-note" role="note">
              {paymentEnabled ? (
                <>
                  <strong>
                    {customerAuthEnabled
                      ? "確認済みのアカウントだけを購入に結び付けます。"
                      : "確認済みのメールアドレスだけを受け取り先にします。"}
                  </strong>
                  <span>
                    相談内容はメール事業者や決済メタデータへ送りません。メール確認後、税込980円・都度払い・自動更新なしの最終確認へ進みます。
                  </span>
                </>
              ) : (
                <>
                  <strong>現在は公開前の審査モードで、有料販売は開始していません。</strong>
                  <span>
                    最終操作時には、このサイト内で現在の相談入力と利用可否を再確認しますが、本番用の確認は完了せず、購入手続きには進みません。決済、外部AIによる生成、永続保存、メール送信は行われません。
                  </span>
                </>
              )}
            </div>
            <footer className="request-phase-actions">
              <button
                type="button"
                className={`button button--secondary ${styles.paperSecondary}`}
                onClick={() => moveToPhase(3)}
              >
                依頼メモへ戻る
              </button>
              {!customerAuthEnabled || customerAuthMethod === "email_otp" ? (
                <button
                  type="submit"
                  className="button button--primary"
                  disabled={
                    safetyBusy ||
                    authEntryPending ||
                    productionFlow.status === "preparing" ||
                    productionFlow.status === "sending_verification" ||
                    productionFlow.status === "auth_email_requesting" ||
                    productionFlow.status === "auth_google_redirecting" ||
                    productionFlow.status === "awaiting_auth_email_otp" ||
                    productionFlow.status === "awaiting_email_code" ||
                    productionFlow.status === "product_clarification"
                  }
                >
                  {safetyBusy || productionFlow.status === "preparing"
                    ? "現在の入力を確認しています"
                    : productionFlow.status === "sending_verification"
                      ? "確認メールを送っています"
                      : productionFlow.status === "auth_email_requesting"
                        ? "確認メールをリクエストしています"
                        : productionFlow.status === "auth_google_redirecting"
                          ? "Googleの確認画面を準備しています"
                          : productionFlow.status === "awaiting_auth_email_otp"
                            ? "確認コードを入力してください"
                            : customerAuthEnabled
                              ? "確認メールを送る"
                              : paymentEnabled
                                ? "受け取り先を確認する"
                                : "購入前の内容を確認する"}
                </button>
              ) : null}
            </footer>
          </form>
        </article>
      ) : null}
    </section>
  );
}
