"use client";

import { FormEvent, useRef, useState } from "react";
import {
  decodeCustomerAssessmentApiResponseV2,
  type CustomerAssessmentDeliveryV2,
} from "@/lib/assessment/runtime/customer-assessment-delivery-v2";
import type {
  Jpy980ClarificationTarget,
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
  | { status: "success"; delivery: CustomerAssessmentDeliveryV2 };

const actionableTopics = new Set<RequestedTopic>([
  "decide_send_or_wait",
  "draft_message",
  "message_impact",
  "next_three_days",
]);

const errorCopy: Record<string, string> = {
  M2_FORM_VALIDATION_FAILED: "必須項目を確認してください。",
  M2_ACTIONABLE_TOPIC_REQUIRED:
    "「知りたいこと」から、送る・待つ・文章・今後3日のいずれかを1つ選んでください。",
  M2_MESSAGE_IMPACT_CANDIDATE_REQUIRED:
    "文面の届き方を確認するには、送ろうとしている文面を入力してください。",
  M2_CLARIFICATION_ANSWER_INVALID: "追加質問への回答を確認してください。",
  M2_CLARIFICATION_ALREADY_ANSWERED:
    "この追加質問にはすでに回答済みです。先に受け付けた回答を使用します。",
};

export function RuntimeAssessmentForm() {
  const [form, setForm] = useState(initialForm);
  const [requestState, setRequestState] = useState<RequestState>({
    status: "idle",
  });
  const [clarificationValue, setClarificationValue] = useState("");
  const [clarificationDetail, setClarificationDetail] = useState("");
  const [clarificationSubmitting, setClarificationSubmitting] = useState(false);
  const [clarificationError, setClarificationError] = useState<string | null>(null);
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
    if (!form.requestedTopics.some((topic) => actionableTopics.has(topic))) {
      setRequestState({ status: "error", code: "M2_ACTIONABLE_TOPIC_REQUIRED" });
      return;
    }
    if (
      form.requestedTopics.includes("message_impact") &&
      !form.optionalMessage.trim()
    ) {
      setRequestState({
        status: "error",
        code: "M2_MESSAGE_IMPACT_CANDIDATE_REQUIRED",
      });
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
      const decoded = decodeCustomerAssessmentApiResponseV2(payload);
      setRequestState({ status: "success", delivery: decoded.data });
    } catch {
      setRequestState({ status: "error", code: "M2_INTERNAL_REQUEST_FAILED" });
    } finally {
      activeSubmission.current = false;
    }
  }

  function clarificationAnswer(target: Jpy980ClarificationTarget) {
    const detail = clarificationDetail.trim() || undefined;
    switch (target) {
      case "material_relationship_or_communication_concern":
      case "relationship_intent":
      case "requested_message_tone":
        return { choice: clarificationValue, ...(detail ? { detail } : {}) };
      case "latest_contact_timing":
        return clarificationValue === "unknown"
          ? { kind: "unknown" }
          : { kind: "elapsed_bucket", value: clarificationValue };
      case "usual_reply_cadence":
        return clarificationValue;
      case "central_fear_or_decision_concern":
        return clarificationValue === "none"
          ? { kind: "none" }
          : { kind: "concern", value: clarificationDetail.trim() };
    }
  }

  async function submitClarification(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (
      clarificationSubmitting ||
      requestState.status !== "success" ||
      requestState.delivery.eligibility !== "needs_more_information"
    ) return;
    const prompt = requestState.delivery.clarification;
    if (
      !clarificationValue.trim() ||
      (prompt.target === "central_fear_or_decision_concern" &&
        clarificationValue === "concern" &&
        !clarificationDetail.trim())
    ) {
      setClarificationError("M2_CLARIFICATION_ANSWER_INVALID");
      return;
    }
    setClarificationSubmitting(true);
    setClarificationError(null);
    try {
      const response = await fetch(
        `/api/internal/assessment-clarifications/${encodeURIComponent(prompt.opaqueClarificationId)}/answer`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ answer: clarificationAnswer(prompt.target) }),
        },
      );
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
        setClarificationError(code);
        return;
      }
      const decoded = decodeCustomerAssessmentApiResponseV2(payload);
      setRequestState({ status: "success", delivery: decoded.data });
    } catch {
      setClarificationError("M2_INTERNAL_REQUEST_FAILED");
    } finally {
      setClarificationSubmitting(false);
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

  if (
    requestState.status === "success" &&
    requestState.delivery.eligibility === "needs_more_information"
  ) {
    const prompt = requestState.delivery.clarification;
    const choices =
      prompt.target === "material_relationship_or_communication_concern"
        ? [
            ["distance", "距離感"],
            ["affection_expression", "好意の伝わり方"],
            ["reply_pressure", "返信への圧"],
            ["other_material_concern", "その他の気がかり"],
            ["no_material_concern", "特になし"],
          ]
        : prompt.target === "latest_contact_timing"
          ? [
              ["less_than_6_hours", "6時間未満"],
              ["six_to_24_hours", "6〜24時間"],
              ["one_to_three_days", "1〜3日"],
              ["more_than_three_days", "3日より前"],
              ["unknown", "分からない"],
            ]
            : prompt.target === "usual_reply_cadence"
            ? [
                ["within_usual", "普段の範囲内"],
                ["beyond_usual", "普段より長い"],
                ["unknown", "分からない"],
              ]
            : prompt.target === "central_fear_or_decision_concern"
              ? [
                  ["concern", "不安や迷いがある"],
                  ["none", "今は特にない"],
                ]
            : prompt.target === "relationship_intent"
              ? [
                  ["move_closer", "距離を近づけたい"],
                  ["maintain_distance", "今の距離を保ちたい"],
                  ["repair_conflict", "関係を修復したい"],
                  ["express_affection", "好意を伝えたい"],
                  ["clarify_relationship", "関係を明確にしたい"],
                  ["unsure", "まだ決めきれない"],
                ]
              : prompt.target === "requested_message_tone"
                ? [
                    ["polite", "丁寧"],
                    ["neutral_polite", "自然な敬語"],
                    ["casual", "親しみのある口調"],
                    ["soft", "やわらかい"],
                    ["direct", "率直"],
                    ["brief", "短く簡潔"],
                    ["playful", "少し明るく"],
                    ["custom", "その他"],
                  ]
                : null;
    const clarificationAnswerIncomplete =
      !clarificationValue.trim() ||
      (prompt.target === "central_fear_or_decision_concern" &&
        clarificationValue === "concern" &&
        !clarificationDetail.trim());
    return (
      <section className="request-sheet-wrap runtime-sheet-wrap">
        <form
          className="request-sheet runtime-sheet runtime-clarification"
          onSubmit={submitClarification}
        >
          <header className="request-sheet__heading">
            <p>追加質問 1 / 1</p>
            <h2>鑑定を続けるために、追加でひとつだけ教えてください</h2>
            <span>この回答のあとに、別の追加質問はありません。</span>
          </header>
          {choices ? (
            <fieldset className="request-field runtime-clarification__choices">
              <legend>{prompt.question}</legend>
              <div className="request-chip-group">
                {choices.map(([value, label]) => (
                  <label key={value}>
                    <input
                      type="radio"
                      name="runtime-clarification-answer"
                      value={value}
                      checked={clarificationValue === value}
                      onChange={() => {
                        setClarificationValue(value);
                        setClarificationError(null);
                      }}
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          ) : (
            <div className="request-field">
              <label htmlFor="runtime-clarification-text">
                {prompt.question} <span>最大500文字</span>
              </label>
              <textarea
                id="runtime-clarification-text"
                value={clarificationValue}
                maxLength={500}
                rows={5}
                required
                onChange={(event) => {
                  setClarificationValue(event.target.value);
                  setClarificationError(null);
                }}
              />
            </div>
          )}
          {choices &&
          (prompt.target === "material_relationship_or_communication_concern" ||
            prompt.target === "relationship_intent" ||
            prompt.target === "requested_message_tone" ||
            (prompt.target === "central_fear_or_decision_concern" &&
              clarificationValue === "concern")) ? (
            <div className="request-field">
              <label htmlFor="runtime-clarification-detail">
                {prompt.target === "central_fear_or_decision_concern"
                  ? "いちばん不安なこと"
                  : "補足"}{" "}
                <span>
                  {prompt.target === "central_fear_or_decision_concern"
                    ? "必須"
                    : "任意"}
                </span>
              </label>
              <textarea
                id="runtime-clarification-detail"
                value={clarificationDetail}
                maxLength={prompt.target === "requested_message_tone" ? 240 : 500}
                rows={3}
                required={prompt.target === "central_fear_or_decision_concern"}
                onChange={(event) => setClarificationDetail(event.target.value)}
              />
            </div>
          ) : null}
          {clarificationError ? (
            <div className="request-error-summary" role="alert">
              <h2>回答を送信できませんでした</h2>
              <p>{errorCopy[clarificationError] ?? "時間を置いて、もう一度お試しください。"}</p>
            </div>
          ) : null}
          <footer className="request-phase-actions request-phase-actions--end">
            <button
              type="submit"
              className="button button--primary"
              disabled={clarificationSubmitting || clarificationAnswerIncomplete}
              aria-disabled={clarificationSubmitting || clarificationAnswerIncomplete}
            >
              {clarificationSubmitting ? "回答を確認中" : "この回答で鑑定を続ける"}
            </button>
          </footer>
        </form>
      </section>
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
            入力内容を確認しています。完了するまで再送信はできません。
          </div>
        ) : null}
        {requestState.status === "error" ? (
          <div className="request-error-summary" role="alert">
            <h2>内部テストを完了できませんでした</h2>
            <p>
              {errorCopy[requestState.code] ??
                "入力内容を確認するか、時間を置いてもう一度お試しください。"}
            </p>
          </div>
        ) : null}
        {requestState.status === "success" &&
        requestState.delivery.eligibility === "safety_blocked" ? (
          <div className="runtime-stop-result" role="status">
            <strong>安全上の理由から、この鑑定はここで停止しました。</strong>
            <p>料金は発生しません。</p>
          </div>
        ) : null}
        {requestState.status === "success" &&
        requestState.delivery.eligibility === "not_full_product_candidate" ? (
          <div className="runtime-stop-result" role="status">
            <strong>
              今回は、980円の鑑定ノートとして十分な判断材料を組み立てられませんでした。
            </strong>
            <p>料金は発生しません。</p>
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
