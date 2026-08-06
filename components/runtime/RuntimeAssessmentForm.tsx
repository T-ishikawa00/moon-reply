"use client";

import { FormEvent, useRef, useState } from "react";
import {
  decodeCustomerAssessmentApiResponseV1,
  type CustomerAssessmentDeliveryV1,
} from "@/lib/assessment/runtime/customer-assessment-delivery-v1";
import type {
  RelationshipValue,
  RequestedTopic,
} from "@/lib/assessment/runtime/types";
import { RuntimeAssessmentProjectionPreview } from "./RuntimeAssessmentProjectionPreview";

const relationships: Array<{ value: RelationshipValue; label: string }> = [
  { value: "dating", label: "付き合う前" },
  { value: "in_relationship", label: "交際中" },
  { value: "ambiguous", label: "曖昧な関係" },
  { value: "former_partner", label: "元恋人" },
  { value: "matching_app", label: "マッチングアプリ" },
  { value: "work_or_school", label: "職場・学校・知人" },
  { value: "other", label: "その他" },
];

const topics: Array<{ value: RequestedTopic; label: string }> = [
  { value: "decide_send_or_wait", label: "送るか待つか決めたい" },
  { value: "message_impact", label: "この文面がどう届くか知りたい" },
  { value: "draft_message", label: "送る文章を整えたい" },
  { value: "relationship", label: "相手との関係を整理したい" },
  { value: "next_three_days", label: "これから3日どう動くか知りたい" },
  { value: "organize_emotions", label: "不安を整理したい" },
];

type FormState = {
  currentSituation: string;
  optionalMessage: string;
  relationship: RelationshipValue | "";
  requestedTopics: RequestedTopic[];
  privacyAcknowledged: boolean;
};

const initialForm: FormState = {
  currentSituation: "",
  optionalMessage: "",
  relationship: "",
  requestedTopics: [],
  privacyAcknowledged: false,
};

type RequestState =
  | { status: "idle" }
  | { status: "processing" }
  | { status: "error"; code: string }
  | { status: "success"; delivery: CustomerAssessmentDeliveryV1 };

export function RuntimeAssessmentForm() {
  const [form, setForm] = useState(initialForm);
  const [requestState, setRequestState] = useState<RequestState>({
    status: "idle",
  });
  const activeSubmission = useRef(false);
  const idempotencyKey = useRef<string | null>(null);

  function markChanged(update: (current: FormState) => FormState) {
    setForm(update);
    idempotencyKey.current = null;
    if (requestState.status !== "processing") {
      setRequestState({ status: "idle" });
    }
  }

  function toggleTopic(topic: RequestedTopic) {
    markChanged((current) => {
      if (current.requestedTopics.includes(topic)) {
        return {
          ...current,
          requestedTopics: current.requestedTopics.filter(
            (value) => value !== topic,
          ),
        };
      }
      if (current.requestedTopics.length >= 3) return current;
      return {
        ...current,
        requestedTopics: [...current.requestedTopics, topic],
      };
    });
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (activeSubmission.current || requestState.status === "processing") return;
    if (
      !form.currentSituation.trim() ||
      !form.relationship ||
      form.requestedTopics.length === 0 ||
      !form.privacyAcknowledged
    ) {
      setRequestState({ status: "error", code: "M2_FORM_VALIDATION_FAILED" });
      return;
    }

    activeSubmission.current = true;
    setRequestState({ status: "processing" });
    idempotencyKey.current ??= crypto.randomUUID();

    try {
      const response = await fetch("/api/internal/assessments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": idempotencyKey.current,
        },
        body: JSON.stringify({
          currentSituation: form.currentSituation,
          optionalMessage: form.optionalMessage || null,
          relationship: form.relationship,
          requestedTopics: form.requestedTopics,
          privacyAcknowledged: form.privacyAcknowledged,
        }),
      });
      const payload: unknown = await response.json();
      if (!response.ok) {
        const code =
          typeof payload === "object" &&
          payload !== null &&
          !Array.isArray(payload) &&
          "error" in payload &&
          typeof payload.error === "object" &&
          payload.error !== null &&
          !Array.isArray(payload.error) &&
          "code" in payload.error &&
          typeof payload.error.code === "string"
            ? payload.error.code
            : "M2_INTERNAL_REQUEST_FAILED";
        setRequestState({ status: "error", code });
        return;
      }
      const decoded = decodeCustomerAssessmentApiResponseV1(payload);
      setRequestState({ status: "success", delivery: decoded.data });
    } catch {
      setRequestState({ status: "error", code: "M2_INTERNAL_REQUEST_FAILED" });
    } finally {
      activeSubmission.current = false;
    }
  }

  if (
    requestState.status === "success" &&
    requestState.delivery.eligibility === "ready"
  ) {
    return (
      <RuntimeAssessmentProjectionPreview
        projection={requestState.delivery.projection}
      />
    );
  }

  return (
    <section className="request-sheet-wrap runtime-sheet-wrap">
      <form className="request-sheet runtime-sheet" onSubmit={submit}>
        <header className="request-sheet__heading">
          <p>M2-P3-A / INTERNAL TEST</p>
          <h2>テスト用の状況を入力してください。</h2>
          <span>
            実在人物・実ユーザー・個人情報を含む内容は入力しないでください。
          </span>
        </header>

        <div className="request-field">
          <label htmlFor="runtime-situation">
            今の状況 <span>必須 / 最大5,000文字</span>
          </label>
          <textarea
            id="runtime-situation"
            value={form.currentSituation}
            maxLength={5_000}
            rows={9}
            required
            onChange={(event) =>
              markChanged((current) => ({
                ...current,
                currentSituation: event.target.value,
              }))
            }
          />
        </div>

        <div className="request-field">
          <label htmlFor="runtime-message">
            送ろうとしている文面 <span>任意 / 最大2,000文字</span>
          </label>
          <textarea
            id="runtime-message"
            value={form.optionalMessage}
            maxLength={2_000}
            rows={5}
            onChange={(event) =>
              markChanged((current) => ({
                ...current,
                optionalMessage: event.target.value,
              }))
            }
          />
        </div>

        <fieldset className="request-field">
          <legend>今の関係 <span>必須</span></legend>
          <div className="request-chip-group">
            {relationships.map((relationship) => (
              <label key={relationship.value}>
                <input
                  type="radio"
                  name="runtime-relationship"
                  value={relationship.value}
                  checked={form.relationship === relationship.value}
                  onChange={() =>
                    markChanged((current) => ({
                      ...current,
                      relationship: relationship.value,
                    }))
                  }
                />
                <span>{relationship.label}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="request-field">
          <legend>知りたいこと <span>必須 / 3つまで</span></legend>
          <div className="request-chip-group">
            {topics.map((topic) => (
              <label key={topic.value}>
                <input
                  type="checkbox"
                  checked={form.requestedTopics.includes(topic.value)}
                  onChange={() => toggleTopic(topic.value)}
                />
                <span>{topic.label}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="request-field request-field--choice">
          <label>
            <input
              type="checkbox"
              checked={form.privacyAcknowledged}
              onChange={(event) =>
                markChanged((current) => ({
                  ...current,
                  privacyAcknowledged: event.target.checked,
                }))
              }
            />
            <span>テストデータのみを使用し、個人情報を入力しません</span>
            <small>必須 / 実在人物・実ユーザーのデータは禁止です</small>
          </label>
        </div>

        {requestState.status === "processing" ? (
          <div className="runtime-processing" role="status" aria-live="polite">
            PB-01からPB-06までを順番に処理しています。再送信はできません。
          </div>
        ) : null}
        {requestState.status === "error" ? (
          <div className="request-error-summary" role="alert">
            <h2>内部テストを完了できませんでした</h2>
            <p>安全なエラーコード: <code>{requestState.code}</code></p>
          </div>
        ) : null}
        {requestState.status === "success" &&
        requestState.delivery.eligibility === "safety_blocked" ? (
          <div className="runtime-stop-result" role="status">
            <strong>Safetyにより通常レポート生成を停止しました。</strong>
          </div>
        ) : null}
        {requestState.status === "success" &&
        requestState.delivery.eligibility === "needs_more_information" ? (
          <div className="runtime-stop-result" role="status">
            <strong>追加情報が必要なため通常レポート生成を停止しました。</strong>
            {requestState.delivery.questionCodes.length > 0 ? (
              <p>
                質問コード: {requestState.delivery.questionCodes.join("、")}
              </p>
            ) : null}
          </div>
        ) : null}

        <footer className="request-phase-actions request-phase-actions--end">
          <button
            type="submit"
            className="button button--primary"
            disabled={requestState.status === "processing"}
            aria-disabled={requestState.status === "processing"}
          >
            {requestState.status === "processing"
              ? "処理中"
              : "内部テストを実行"}
          </button>
        </footer>
      </form>
    </section>
  );
}
