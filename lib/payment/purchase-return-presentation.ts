import type { CustomerPurchaseStatus } from "./purchase-status-contract.ts";

export type PurchaseReturnPresentation = Readonly<{
  eyebrow: string;
  heading: string;
  body: string;
  assurance: string | null;
  showManualRefresh: boolean;
  showCheckoutRestart: boolean;
  showAccountFallback: boolean;
}>;

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
      assurance: null,
      showManualRefresh: false,
      showCheckoutRestart: false,
      showAccountFallback: false,
    };
  }

  if (status.status === "payment_not_completed" && !requestFailed) {
    return {
      eyebrow: "月の返事 / ご購入後の確認",
      heading: "決済は完了していません",
      body: "料金は確定していません。再開する場合だけ、同じお申し込みの決済画面を開いてください。",
      assurance: null,
      showManualRefresh: false,
      showCheckoutRestart: true,
      showAccountFallback: false,
    };
  }

  if (status.status === "completed_check_verified_email" && !requestFailed) {
    return {
      eyebrow: "お支払い確認済み",
      heading: "鑑定ノートが完成しました",
      body: "このブラウザでは受け取り権限を確認できませんでした。確認済みのメールをご確認ください。",
      assurance: "追加のお支払いは必要ありません。",
      showManualRefresh: false,
      showCheckoutRestart: false,
      showAccountFallback: false,
    };
  }

  if (status.status === "confirmation_pending" && !requestFailed) {
    if (status.paymentVerified) {
      return {
        eyebrow: "お支払い確認済み",
        heading: "お申し込みを個別に確認しています",
        body: "安全な確認が必要なため、この画面での自動確認は停止しています。",
        assurance: "追加のお支払いは必要ありません。",
        showManualRefresh: false,
        showCheckoutRestart: false,
        showAccountFallback: accountRecovery,
      };
    }
    return {
      eyebrow: "月の返事 / ご購入後の確認",
      heading: "お申し込みを個別に確認しています",
      body: "お支払いの確定をまだ確認できません。この画面から自動で追加決済を行うことはありません。",
      assurance: null,
      showManualRefresh: false,
      showCheckoutRestart: false,
      showAccountFallback: accountRecovery,
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
      showManualRefresh: false,
      showCheckoutRestart: false,
      showAccountFallback: false,
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
      body: "画面を閉じずにお待ちください。同じお申し込みを安全に確認しています。",
      assurance: null,
      showManualRefresh: false,
      showCheckoutRestart: false,
      showAccountFallback: false,
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
    showManualRefresh: recoveryExhausted,
    showCheckoutRestart: false,
    showAccountFallback: accountRecovery,
  };
}
