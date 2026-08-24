"use client";

import { useState } from "react";

import { AuthenticatedCheckoutButton } from "@/components/payment/AuthenticatedCheckoutButton";
import {
  buildPublicClarificationAnswerV1,
  PUBLIC_CLARIFICATION_CONTROLS_V1,
  publicClarificationDetailVisibleV1,
} from "@/lib/assessment/production/public-clarification-contract-v1";
import type { PublicPreparationOutcome } from "@/lib/assessment/production/types";

export function AuthenticatedPreparationContinuation({
  initialOutcome,
  csrfToken,
}: {
  initialOutcome: PublicPreparationOutcome;
  csrfToken: string;
}) {
  const [outcome, setOutcome] = useState(initialOutcome);
  const [value, setValue] = useState("");
  const [detail, setDetail] = useState("");
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  if (outcome.status === "purchase_ready") {
    return (
      <AuthenticatedCheckoutButton
        csrfToken={csrfToken}
        preparationCapability={outcome.preparationCapability}
      />
    );
  }
  if (
    outcome.status === "not_full_product_candidate" ||
    outcome.status === "safety_blocked"
  ) {
    return <p role="status">この内容では、お支払いへ進まずに受付を終了しました。</p>;
  }
  if (outcome.status === "authentication_required") {
    return <p role="alert">ご本人確認を完了できませんでした。もう一度お試しください。</p>;
  }
  if (outcome.status !== "needs_one_clarifying_answer") {
    return <p role="alert">受付状態を確認できませんでした。</p>;
  }

  const controls = PUBLIC_CLARIFICATION_CONTROLS_V1[outcome.target];
  const answer = buildPublicClarificationAnswerV1(outcome.target, {
    value,
    detail,
  });

  async function submitClarification() {
    if (outcome.status !== "needs_one_clarifying_answer" || answer === null) return;
    setBusy(true);
    setFailed(false);
    try {
      const response = await fetch("/api/consultations/clarifications", {
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clarificationCapability: outcome.clarificationCapability,
          answer,
        }),
      });
      if (!response.ok) throw new Error("clarification failed");
      const payload: unknown = await response.json();
      if (
        typeof payload !== "object" ||
        payload === null ||
        !("data" in payload) ||
        typeof payload.data !== "object" ||
        payload.data === null ||
        !("status" in payload.data)
      ) {
        throw new Error("clarification response invalid");
      }
      const next = payload.data as PublicPreparationOutcome;
      if (
        next.status === "authentication_required" ||
        next.status === "needs_one_clarifying_answer"
      ) {
        throw new Error("clarification response invalid");
      }
      setOutcome(next);
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section aria-labelledby="authenticated-clarification-title">
      <p>確認は一度だけです</p>
      <h2 id="authenticated-clarification-title">{outcome.question}</h2>
      <fieldset disabled={busy}>
        <legend>近いものを選んでください</legend>
        {controls.choices.map((choice) => (
          <label key={choice.value}>
            <input
              type="radio"
              name="authenticated-clarification"
              value={choice.value}
              checked={value === choice.value}
              onChange={() => setValue(choice.value)}
            />
            {choice.label}
          </label>
        ))}
      </fieldset>
      {controls.detail &&
      publicClarificationDetailVisibleV1(outcome.target, value) ? (
        <label>
          {controls.detail.label}
          <textarea
            value={detail}
            maxLength={controls.detail.maximumCharacters}
            onChange={(event) => setDetail(event.target.value)}
          />
        </label>
      ) : null}
      {failed ? (
        <p role="alert">確認を完了できませんでした。時間を置いてお試しください。</p>
      ) : null}
      <button
        type="button"
        disabled={busy || answer === null}
        onClick={() => void submitClarification()}
      >
        {busy ? "回答を確認中" : "この回答で鑑定を続ける"}
      </button>
    </section>
  );
}
