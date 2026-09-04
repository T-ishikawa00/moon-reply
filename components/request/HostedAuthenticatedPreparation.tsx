"use client";

import { useEffect, useState } from "react";

import { MoonSeal } from "@/components/brand/MoonSeal";
import { AuthenticatedPreparationContinuation } from "@/components/request/AuthenticatedPreparationContinuation";
import { PurchaseConfirmation } from "@/components/request/PurchaseConfirmation";
import {
  requestHostedContinuationV1,
} from "@/lib/assessment/production/hosted-continuation-contract-r1";
import { runHostedContinuationFlowV1 } from "@/lib/assessment/production/hosted-continuation-flow-r1";
import type { PublicPreparationOutcome } from "@/lib/assessment/production/types";

const AUTOMATIC_RECHECK_DELAY_MS = 1_500;
const MAXIMUM_AUTOMATIC_RECHECKS = 24;

type TerminalState =
  | { kind: "outcome"; outcome: PublicPreparationOutcome }
  | { kind: "failed" }
  | { kind: "authentication_required" };

function PreparationShell({
  stalled,
  transientFailure,
  onRecheck,
}: {
  stalled: boolean;
  transientFailure: boolean;
  onRecheck: () => void;
}) {
  return (
    <section
      className="page-shell request-local-complete authenticated-preparing"
      aria-labelledby="authenticated-preparing-title"
      aria-busy={!stalled}
      aria-live="polite"
      aria-atomic="true"
      role="status"
    >
      <div className="authenticated-preparing__moon" aria-hidden="true">
        <MoonSeal size="medium" />
      </div>
      <p>月の返事</p>
      <h1 id="authenticated-preparing-title">
        {stalled ? "準備状況をもう一度確認できます" : "鑑定の準備をしています"}
      </h1>
      <span>
        {stalled
          ? "料金は発生していません。同じお申し込みの準備状況を確認してください。"
          : transientFailure
            ? "通信を確認しています。この画面のまま、同じお申し込みをもう一度確認します。"
            : "ご相談内容を確認し、次のステップを準備しています。"}
      </span>
      {!stalled && !transientFailure ? (
        <small className="authenticated-preparing__eta">
          通常10〜20秒ほどで、自動的に次へ進みます。
        </small>
      ) : null}
      {stalled ? (
        <button
          className="button button--secondary authenticated-preparing__retry"
          type="button"
          onClick={onRecheck}
        >
          もう一度確認する
        </button>
      ) : null}
    </section>
  );
}

function FailedScreen({ onRecheck }: { onRecheck: () => void }) {
  return (
    <section
      className="page-shell request-local-complete authenticated-preparing"
      aria-labelledby="authenticated-preparing-error-title"
    >
      <p>月の返事</p>
      <h1 id="authenticated-preparing-error-title">鑑定の準備を完了できませんでした</h1>
      <span role="alert">
        料金は発生していません。同じお申し込みの最新状態をもう一度確認できます。
      </span>
      <button
        className="button button--secondary authenticated-preparing__retry"
        type="button"
        onClick={onRecheck}
      >
        もう一度確認する
      </button>
    </section>
  );
}

function AuthenticationRequiredScreen() {
  return (
    <section
      className="page-shell request-local-complete authenticated-preparing"
      aria-labelledby="authenticated-preparing-auth-title"
    >
      <p>月の返事</p>
      <h1 id="authenticated-preparing-auth-title">ご本人確認が必要です</h1>
      <span role="alert">
        ご本人確認の有効期限が切れています。相談入力画面から、同じ内容でもう一度お進みください。
      </span>
      <a
        className="button button--secondary authenticated-preparing__retry"
        href="/request"
      >
        相談入力へ戻る
      </a>
    </section>
  );
}

export function HostedAuthenticatedPreparation({
  csrfToken,
}: {
  csrfToken: string;
}) {
  const [cycle, setCycle] = useState(0);
  const [terminal, setTerminal] = useState<TerminalState | null>(null);
  const [stalled, setStalled] = useState(false);
  const [transientFailure, setTransientFailure] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void runHostedContinuationFlowV1({
      request: (action) =>
        requestHostedContinuationV1(action, csrfToken),
      wait: (milliseconds) =>
        new Promise((resolve) => setTimeout(resolve, milliseconds)),
      isCancelled: () => cancelled,
      onTransientFailure: (failed) => {
        if (!cancelled) setTransientFailure(failed);
      },
      recheckDelayMilliseconds: AUTOMATIC_RECHECK_DELAY_MS,
      maximumStatusChecks: MAXIMUM_AUTOMATIC_RECHECKS,
    }).then((result) => {
      if (cancelled || result.kind === "cancelled") return;
      if (result.kind === "stalled") {
        setStalled(true);
        return;
      }
      setTerminal(result);
    });
    return () => {
      cancelled = true;
    };
  }, [csrfToken, cycle]);

  function recheck() {
    setTerminal(null);
    setStalled(false);
    setTransientFailure(false);
    setCycle((value) => value + 1);
  }

  if (terminal?.kind === "authentication_required") {
    return <AuthenticationRequiredScreen />;
  }
  if (terminal?.kind === "failed") {
    return <FailedScreen onRecheck={recheck} />;
  }
  if (terminal?.kind === "outcome") {
    if (terminal.outcome.status === "purchase_ready") {
      return (
        <PurchaseConfirmation>
          <AuthenticatedPreparationContinuation
            initialOutcome={terminal.outcome}
            csrfToken={csrfToken}
          />
        </PurchaseConfirmation>
      );
    }
    return (
      <section
        className="page-shell request-local-complete authenticated-preparation-outcome"
        aria-label="鑑定の準備結果"
      >
        {terminal.outcome.status === "needs_one_clarifying_answer" ? (
          <p role="status">準備が整いました。確認を一つお願いします。</p>
        ) : null}
        <AuthenticatedPreparationContinuation
          initialOutcome={terminal.outcome}
          csrfToken={csrfToken}
        />
      </section>
    );
  }
  return (
    <PreparationShell
      stalled={stalled}
      transientFailure={transientFailure}
      onRecheck={recheck}
    />
  );
}
