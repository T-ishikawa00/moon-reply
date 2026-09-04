import type { CustomerPurchaseStatus } from "./purchase-status-contract.ts";

export type PurchaseProgressState = "complete" | "current" | "next";
export type PurchaseProgress = readonly [
  PurchaseProgressState,
  PurchaseProgressState,
  PurchaseProgressState,
];

export type PurchaseReturnPresentation = Readonly<{
  eyebrow: string;
  heading: string;
  body: string;
  assurance: string | null;
  progress: PurchaseProgress;
  detailHeading: string | null;
  assurances: readonly string[];
  showManualRefresh: boolean;
  showCheckoutRestart: boolean;
  showAccountFallback: boolean;
  showSupportFallback: boolean;
}>;

const paymentCurrent: PurchaseProgress = ["current", "next", "next"];
const preparationCurrent: PurchaseProgress = ["complete", "current", "next"];
const completedProgress: PurchaseProgress = ["complete", "complete", "complete"];

function preparationAssurances(customerAuthEnabled: boolean) {
  return [
    "通常は数分で完成します。内容によっては5〜10分ほどかかる場合があります。",
    "この画面を閉じても、同じお申し込みの処理は続きます。",
    ...(customerAuthEnabled ? ["鑑定ノートはアカウントから確認できます。"] : []),
    "完成したら確認済みのメールにもお知らせします。",
  ] as const;
}

export function getPurchaseReturnPresentation(input: {
  status: CustomerPurchaseStatus;
  requestFailed: boolean;
  recoveryExhausted: boolean;
  customerAuthEnabled: boolean;
}): PurchaseReturnPresentation {
  const { status, requestFailed, recoveryExhausted, customerAuthEnabled } =
    input;
  const accountRecovery =
    customerAuthEnabled &&
    status.accountFallback &&
    (status.status === "temporary_problem" ||
      status.status === "confirmation_pending" ||
      recoveryExhausted);

  if (status.status === "completed") {
    return {
      eyebrow: "鑑定が完成しました",
      heading: "鑑定ノートを開いています",
      body: "安全な受け取り先へ移動しています。",
      assurance: "追加のお支払いは必要ありません。",
      progress: completedProgress,
      detailHeading: "鑑定ノートが完成しました",
      assurances: [],
      showManualRefresh: false,
      showCheckoutRestart: false,
      showAccountFallback: false,
      showSupportFallback: false,
    };
  }

  if (status.status === "payment_not_completed" && !requestFailed) {
    return {
      eyebrow: "月の返事 / ご購入後の確認",
      heading: "決済は完了していません",
      body: "料金は確定していません。再開する場合だけ、同じお申し込みの決済画面を開いてください。",
      assurance: null,
      progress: paymentCurrent,
      detailHeading: "お支払い手続きから再開できます",
      assurances: [],
      showManualRefresh: false,
      showCheckoutRestart: true,
      showAccountFallback: false,
      showSupportFallback: false,
    };
  }

  if (status.status === "completed_check_verified_email" && !requestFailed) {
    return {
      eyebrow: "お支払い確認済み",
      heading: "鑑定ノートが完成しました",
      body: "このブラウザでは受け取り権限を確認できませんでした。確認済みのメールをご確認ください。",
      assurance: "追加のお支払いは必要ありません。",
      progress: completedProgress,
      detailHeading: "確認済みのメールからお受け取りください",
      assurances: [
        "完了メールが見つからない場合は、迷惑メールフォルダやプロモーションタブもご確認ください。",
      ],
      showManualRefresh: false,
      showCheckoutRestart: false,
      showAccountFallback: false,
      showSupportFallback: false,
    };
  }

  if (status.status === "confirmation_pending" && !requestFailed) {
    if (status.paymentVerified) {
      return {
        eyebrow: "お支払い確認済み",
        heading: "お申し込みを個別に確認しています",
        body: "安全な確認が必要なため、この画面での自動確認は停止しています。",
        assurance: "追加のお支払いは必要ありません。",
        progress: preparationCurrent,
        detailHeading: "お申し込みの状態を確認します",
        assurances: ["お支払い済みの同じお申し込みとして保存されています。"],
        showManualRefresh: false,
        showCheckoutRestart: false,
        showAccountFallback: accountRecovery,
        showSupportFallback: true,
      };
    }
    return {
      eyebrow: "月の返事 / ご購入後の確認",
      heading: "お申し込みを個別に確認しています",
      body: "お支払いの確定をまだ確認できません。この画面から自動で追加決済を行うことはありません。",
      assurance: null,
      progress: paymentCurrent,
      detailHeading: "お支払い状況を確認します",
      assurances: [],
      showManualRefresh: false,
      showCheckoutRestart: false,
      showAccountFallback: accountRecovery,
      showSupportFallback: true,
    };
  }

  if (
    status.status === "preparing_assessment" &&
    !requestFailed &&
    !recoveryExhausted
  ) {
    return {
      eyebrow: "お支払い確認済み",
      heading: "鑑定ノートを準備しています",
      body: "この画面を閉じても大丈夫です。完成したらメールでもお知らせします。",
      assurance: "追加のお支払いは必要ありません。",
      progress: preparationCurrent,
      detailHeading: "鑑定ノートを準備中です",
      assurances: preparationAssurances(customerAuthEnabled),
      showManualRefresh: false,
      showCheckoutRestart: false,
      showAccountFallback: false,
      showSupportFallback: false,
    };
  }

  if (
    status.status === "confirming_payment" &&
    !requestFailed &&
    !recoveryExhausted
  ) {
    return {
      eyebrow: "月の返事 / ご購入後の確認",
      heading: "決済を確認しています",
      body: "同じお申し込みのお支払い結果を安全に確認しています。追加のお支払い操作はせず、このままお待ちください。",
      assurance: null,
      progress: paymentCurrent,
      detailHeading: "お支払い結果を確認中です",
      assurances: [],
      showManualRefresh: false,
      showCheckoutRestart: false,
      showAccountFallback: false,
      showSupportFallback: false,
    };
  }

  const exhaustedCopy = recoveryExhausted
    ? "自動確認の上限に達しました。決済をやり直さず、手動で同じお申し込みを再確認できます。"
    : "一時的に確認できませんでした。間隔を広げながら自動で再確認しています。";
  return {
    eyebrow: status.paymentVerified
      ? "お支払い確認済み"
      : "月の返事 / ご購入後の確認",
    heading: status.paymentVerified
      ? "鑑定ノートの確認に時間がかかっています"
      : "決済情報の確認に時間がかかっています",
    body: exhaustedCopy,
    assurance: status.paymentVerified
      ? "追加のお支払いは必要ありません。"
      : null,
    progress: status.paymentVerified ? preparationCurrent : paymentCurrent,
    detailHeading: status.paymentVerified
      ? "鑑定ノートの状態を確認します"
      : "お支払い状況を確認します",
    assurances: status.paymentVerified
      ? ["お支払い済みの同じお申し込みとして保存されています。"]
      : [],
    showManualRefresh: recoveryExhausted,
    showCheckoutRestart: false,
    showAccountFallback: accountRecovery,
    showSupportFallback: recoveryExhausted,
  };
}
