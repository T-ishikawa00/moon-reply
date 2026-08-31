"use client";

import { FormEvent, useMemo, useState } from "react";

import { CustomerAssessmentNote } from "@/components/runtime/CustomerAssessmentNote";
import type { CustomerAssessmentExperienceProjectionV2 } from "@/lib/assessment/runtime/customer-assessment-experience-projection-v2";
import type {
  ContactBoundaryStateV1,
  RequestedAssistanceGoalV1,
} from "@/lib/purchase/prepayment-safety-types-v1";
import type {
  RelationshipValue,
  RequestedTopic,
} from "@/lib/assessment/runtime/types";

import styles from "./ContentStudioForm.module.css";

type ClarificationTarget =
  | "material_relationship_or_communication_concern"
  | "latest_contact_timing"
  | "usual_reply_cadence"
  | "central_fear_or_decision_concern"
  | "relationship_intent"
  | "requested_message_tone";

type QualityDiagnostic = {
  attemptNumber: 2;
  disposition: "deliver_latest_valid_candidate" | "fail_closed";
  findingCodes: string[];
};

type ContentStudioResponse =
  | {
      status: "ready";
      projection: CustomerAssessmentExperienceProjectionV2;
      runHandle?: string;
      diagnostic?: QualityDiagnostic;
    }
  | {
      status: "needs_more_information";
      runHandle: string;
      target: ClarificationTarget;
      question: string;
      maximumQuestionsTotal: 1;
    }
  | {
      status: "stopped";
      reason:
        | "prepayment_safety"
        | "not_full_product_candidate"
        | "runtime_safety_blocked"
        | "runtime_not_full_product_candidate";
      reasonCodes: string[];
    }
  | {
      status: "failed";
      runHandle: string;
      errorCode: "M2_PRODUCT_QUALITY_REASSESSMENT_EXHAUSTED";
      diagnostic: QualityDiagnostic & { disposition: "fail_closed" };
    };

type FormState = {
  currentSituation: string;
  latestInboundMessage: string;
  optionalMessage: string;
  relationship: RelationshipValue;
  requestedTopics: RequestedTopic[];
  contactBoundaryState: ContactBoundaryStateV1;
  requestedAssistanceGoal: RequestedAssistanceGoalV1;
  syntheticOnlyAcknowledged: boolean;
  adultConfirmed: boolean;
  privacyAcknowledged: boolean;
  attestationConfirmed: boolean;
  pauseAssessmentDisclosureAcknowledged: boolean;
  boundarySupportOnlyDisclosureAcknowledged: boolean;
  scopedReplyScopeAcknowledged: boolean;
  businessOnlyScopeAcknowledged: boolean;
};

const initialForm: FormState = {
  currentSituation: "",
  latestInboundMessage: "",
  optionalMessage: "",
  relationship: "dating",
  requestedTopics: ["decide_send_or_wait"],
  contactBoundaryState: "no_restriction_known",
  requestedAssistanceGoal: "understand_and_organize",
  syntheticOnlyAcknowledged: false,
  adultConfirmed: false,
  privacyAcknowledged: false,
  attestationConfirmed: false,
  pauseAssessmentDisclosureAcknowledged: false,
  boundarySupportOnlyDisclosureAcknowledged: false,
  scopedReplyScopeAcknowledged: false,
  businessOnlyScopeAcknowledged: false,
};

const relationshipOptions: ReadonlyArray<{
  value: RelationshipValue;
  label: string;
}> = [
  { value: "dating", label: "付き合う前" },
  { value: "in_relationship", label: "交際中" },
  { value: "ambiguous", label: "曖昧な関係" },
  { value: "former_partner", label: "元恋人" },
  { value: "matching_app", label: "マッチングアプリ" },
  { value: "work_or_school", label: "職場・学校・知人" },
  { value: "other", label: "その他" },
];

const topicOptions: ReadonlyArray<{ value: RequestedTopic; label: string }> = [
  { value: "decide_send_or_wait", label: "送るか待つか決めたい" },
  { value: "message_impact", label: "候補文面がどう伝わるか知りたい" },
  { value: "draft_message", label: "送る文章を整えたい" },
  { value: "relationship", label: "相手との関係を整理したい" },
  { value: "next_three_days", label: "これから3日どう動くか知りたい" },
  { value: "organize_emotions", label: "不安を整理したい" },
];

const boundaryOptions: ReadonlyArray<{
  value: ContactBoundaryStateV1;
  label: string;
}> = [
  { value: "no_restriction_known", label: "特に連絡の制限はない" },
  { value: "temporary_pause", label: "少し時間を置いてほしいと言われている" },
  { value: "explicit_no_contact", label: "連絡しないでほしいと言われている" },
  { value: "channel_restricted", label: "ブロックなどで連絡手段が制限されている" },
  { value: "relationship_closed", label: "関係を終えたい意思を伝えられている" },
  { value: "business_only", label: "必要な実務連絡だけ許可されている" },
  { value: "new_inbound_after_boundary", label: "制限後に相手から新しい連絡が届いた" },
  { value: "unknown", label: "分からない" },
  { value: "urgent_safety", label: "現在の安全に関わる緊急性がある" },
];

const assistanceOptions: ReadonlyArray<{
  value: RequestedAssistanceGoalV1;
  label: string;
}> = [
  { value: "understand_and_organize", label: "状況と気持ちを整理したい" },
  { value: "decide_send_wait_or_pause", label: "送る・待つ・止める判断を知りたい" },
  { value: "draft_within_current_permission", label: "許可範囲内で返信文案を考えたい" },
  { value: "recontact_or_overcome_boundary", label: "拒否や制限を越えて連絡する方法を知りたい" },
  { value: "alternate_channel_or_third_party", label: "別経路や第三者を使う方法を知りたい" },
  { value: "monitor_track_or_manipulate", label: "監視・追跡・操作する方法を知りたい" },
  { value: "professional_judgment", label: "法律・医療等の専門判断がほしい" },
  { value: "urgent_safety_help", label: "現在の緊急な安全支援が必要" },
];

const clarificationChoices: Record<
  ClarificationTarget,
  ReadonlyArray<{ value: string; label: string }>
> = {
  material_relationship_or_communication_concern: [
    { value: "distance", label: "距離感" },
    { value: "affection_expression", label: "好意の伝わり方" },
    { value: "reply_pressure", label: "返信への圧" },
    { value: "other_material_concern", label: "その他の気がかり" },
    { value: "no_material_concern", label: "特になし" },
  ],
  latest_contact_timing: [
    { value: "less_than_6_hours", label: "6時間未満" },
    { value: "six_to_24_hours", label: "6〜24時間" },
    { value: "one_to_three_days", label: "1〜3日" },
    { value: "more_than_three_days", label: "3日より前" },
    { value: "unknown", label: "分からない" },
  ],
  usual_reply_cadence: [
    { value: "within_usual", label: "普段の範囲内" },
    { value: "beyond_usual", label: "普段より長い" },
    { value: "unknown", label: "分からない" },
  ],
  central_fear_or_decision_concern: [
    { value: "concern", label: "不安や迷いがある" },
    { value: "none", label: "今は特にない" },
  ],
  relationship_intent: [
    { value: "move_closer", label: "距離を近づけたい" },
    { value: "maintain_distance", label: "今の距離を保ちたい" },
    { value: "repair_conflict", label: "関係を修復したい" },
    { value: "express_affection", label: "好意を伝えたい" },
    { value: "clarify_relationship", label: "関係を明確にしたい" },
    { value: "unsure", label: "まだ決めきれない" },
  ],
  requested_message_tone: [
    { value: "polite", label: "丁寧" },
    { value: "neutral_polite", label: "自然な敬語" },
    { value: "casual", label: "親しみのある口調" },
    { value: "soft", label: "やわらかい" },
    { value: "direct", label: "率直" },
    { value: "brief", label: "短く簡潔" },
    { value: "playful", label: "少し明るく" },
    { value: "custom", label: "その他" },
  ],
};

function clarificationAnswer(
  target: ClarificationTarget,
  value: string,
  detail: string,
) {
  const trimmedDetail = detail.trim();
  switch (target) {
    case "material_relationship_or_communication_concern":
    case "relationship_intent":
    case "requested_message_tone":
      return trimmedDetail ? { choice: value, detail: trimmedDetail } : { choice: value };
    case "latest_contact_timing":
      return value === "unknown"
        ? { kind: "unknown" }
        : { kind: "elapsed_bucket", value };
    case "usual_reply_cadence":
      return value;
    case "central_fear_or_decision_concern":
      return value === "none"
        ? { kind: "none" }
        : { kind: "concern", value: trimmedDetail };
  }
}

function parseResponse(value: unknown): ContentStudioResponse {
  if (typeof value !== "object" || value === null || !("status" in value)) {
    throw new Error("CONTENT_STUDIO_RESPONSE_INVALID");
  }
  return value as ContentStudioResponse;
}

function QualityDiagnosticPanel({
  runHandle,
  diagnostic,
}: {
  runHandle: string;
  diagnostic: QualityDiagnostic;
}) {
  return (
    <section className={styles.diagnostic} aria-labelledby="quality-diagnostic-title">
      <p className={styles.eyebrow}>Sanitized local diagnostic</p>
      <h2 id="quality-diagnostic-title">Quality disposition</h2>
      <dl>
        <div>
          <dt>Local run handle</dt>
          <dd>{runHandle}</dd>
        </div>
        <div>
          <dt>Attempt</dt>
          <dd>{diagnostic.attemptNumber}</dd>
        </div>
        <div>
          <dt>Disposition</dt>
          <dd>{diagnostic.disposition}</dd>
        </div>
      </dl>
      <h3>Finding codes</h3>
      <ul>
        {diagnostic.findingCodes.map((code) => <li key={code}>{code}</li>)}
      </ul>
    </section>
  );
}

export function ContentStudioForm() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [outcome, setOutcome] = useState<ContentStudioResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clarificationValue, setClarificationValue] = useState("");
  const [clarificationDetail, setClarificationDetail] = useState("");

  const canSubmit =
    form.syntheticOnlyAcknowledged &&
    form.adultConfirmed &&
    form.privacyAcknowledged &&
    form.attestationConfirmed &&
    form.currentSituation.trim().length > 0 &&
    form.requestedTopics.length > 0;

  const clarificationNeedsDetail =
    outcome?.status === "needs_more_information" &&
    ((outcome.target === "central_fear_or_decision_concern" &&
      clarificationValue === "concern") ||
      (outcome.target === "requested_message_tone" && clarificationValue === "custom"));

  const canSubmitClarification =
    outcome?.status === "needs_more_information" &&
    clarificationValue.length > 0 &&
    (!clarificationNeedsDetail || clarificationDetail.trim().length > 0);

  const topicSet = useMemo(() => new Set(form.requestedTopics), [form.requestedTopics]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setError(null);
  }

  function toggleTopic(topic: RequestedTopic) {
    update(
      "requestedTopics",
      topicSet.has(topic)
        ? form.requestedTopics.filter((value) => value !== topic)
        : [...form.requestedTopics, topic],
    );
  }

  async function post(body: unknown) {
    const response = await fetch("/api/generation", {
      method: "POST",
      credentials: "same-origin",
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const payload: unknown = await response.json();
    if (!response.ok) {
      const code =
        typeof payload === "object" &&
        payload !== null &&
        "error" in payload &&
        typeof payload.error === "object" &&
        payload.error !== null &&
        "code" in payload.error &&
        typeof payload.error.code === "string"
          ? payload.error.code
          : "CONTENT_STUDIO_REQUEST_FAILED";
      throw new Error(code);
    }
    return parseResponse(payload);
  }

  async function generate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit || busy) return;
    setBusy(true);
    setError(null);
    setOutcome(null);
    try {
      const next = await post({
        schemaVersion: "content-studio-local-generate-v1",
        syntheticOnlyAcknowledged: form.syntheticOnlyAcknowledged,
        consultation: {
          consultationSchemaVersion: "rc1-production-consultation-v1",
          privacyAcknowledged: form.privacyAcknowledged,
          schemaVersion: "prepayment-safety-input-v1",
          adultConfirmed: form.adultConfirmed,
          currentSituation: form.currentSituation,
          latestInboundMessage: form.latestInboundMessage.trim() || null,
          optionalMessage: form.optionalMessage.trim() || null,
          relationship: form.relationship,
          requestedTopics: form.requestedTopics,
          contactBoundaryState: form.contactBoundaryState,
          requestedAssistanceGoal: form.requestedAssistanceGoal,
          clarificationAnswers: {
            submissionCount: 0,
            clarifiedContactBoundaryState: null,
            practicalPermissionExplicit: null,
            currentRequestPracticalScopeOnly: null,
            replyExplicitlyInvited: null,
            replyLimitedToExactSubject: null,
            professionalScopeLimitedToNonprofessionalOrganization: null,
            unsafeExecutionIntent: null,
            currentSafetyStatus: null,
          },
          scopeAcknowledgements: {
            pauseAssessmentDisclosureAcknowledged:
              form.pauseAssessmentDisclosureAcknowledged,
            boundarySupportOnlyDisclosureAcknowledged:
              form.boundarySupportOnlyDisclosureAcknowledged,
            scopedReplyScopeAcknowledged: form.scopedReplyScopeAcknowledged,
            businessOnlyScopeAcknowledged: form.businessOnlyScopeAcknowledged,
          },
          attestationConfirmed: form.attestationConfirmed,
          safetyPolicyVersion: "prepayment-safety-policy-v1",
        },
      });
      setOutcome(next);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "CONTENT_STUDIO_REQUEST_FAILED");
    } finally {
      setBusy(false);
    }
  }

  async function answerClarification(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmitClarification || outcome?.status !== "needs_more_information" || busy) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const next = await post({
        schemaVersion: "content-studio-local-action-v1",
        action: "answer_clarification",
        runHandle: outcome.runHandle,
        answer: clarificationAnswer(
          outcome.target,
          clarificationValue,
          clarificationDetail,
        ),
      });
      setOutcome(next);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "CONTENT_STUDIO_REQUEST_FAILED");
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    setOutcome(null);
    setError(null);
    setClarificationValue("");
    setClarificationDetail("");
  }

  if (outcome?.status === "ready") {
    return (
      <div className={styles.previewShell}>
        <div className={styles.previewToolbar}>
          <div>
            <p>Production-equivalent preview</p>
            <h2>Customer-safe V2 鑑定ノート</h2>
          </div>
          <button type="button" onClick={reset}>別の架空ケースを入力</button>
        </div>
        {outcome.diagnostic && outcome.runHandle ? (
          <QualityDiagnosticPanel
            runHandle={outcome.runHandle}
            diagnostic={outcome.diagnostic}
          />
        ) : null}
        <CustomerAssessmentNote projection={outcome.projection} />
      </div>
    );
  }

  if (outcome?.status === "failed") {
    return (
      <div className={styles.previewShell}>
        <section className={styles.panel} aria-labelledby="quality-failed-title">
          <p className={styles.eyebrow}>Generation failed closed</p>
          <h2 id="quality-failed-title">Hard quality findingのため鑑定を停止しました</h2>
          <p>{outcome.errorCode}</p>
          <button type="button" onClick={reset}>入力へ戻る</button>
        </section>
        <QualityDiagnosticPanel
          runHandle={outcome.runHandle}
          diagnostic={outcome.diagnostic}
        />
      </div>
    );
  }

  if (outcome?.status === "needs_more_information") {
    return (
      <section className={styles.panel} aria-labelledby="clarification-title">
        <p className={styles.eyebrow}>追加質問 1 / 1</p>
        <h2 id="clarification-title">鑑定を続けるために一つだけ確認します</h2>
        <p className={styles.question}>{outcome.question}</p>
        <form onSubmit={answerClarification}>
          <fieldset className={styles.choiceGrid} disabled={busy}>
            <legend>近いものを一つ選択</legend>
            {clarificationChoices[outcome.target].map((choice) => (
              <label key={choice.value} data-selected={clarificationValue === choice.value}>
                <input
                  type="radio"
                  name="clarification"
                  value={choice.value}
                  checked={clarificationValue === choice.value}
                  onChange={() => setClarificationValue(choice.value)}
                />
                <span>{choice.label}</span>
              </label>
            ))}
          </fieldset>
          {(clarificationNeedsDetail ||
            outcome.target === "material_relationship_or_communication_concern" ||
            outcome.target === "relationship_intent") ? (
            <label className={styles.field}>
              <span>{clarificationNeedsDetail ? "補足（必須）" : "補足（任意）"}</span>
              <textarea
                value={clarificationDetail}
                maxLength={500}
                rows={4}
                onChange={(event) => setClarificationDetail(event.target.value)}
              />
            </label>
          ) : null}
          {error ? <p className={styles.error} role="alert">{error}</p> : null}
          <div className={styles.actions}>
            <button type="button" className={styles.secondary} onClick={reset} disabled={busy}>
              中止して戻る
            </button>
            <button type="submit" disabled={!canSubmitClarification || busy}>
              {busy ? "鑑定を続行中…" : "この回答で鑑定を続ける"}
            </button>
          </div>
        </form>
      </section>
    );
  }

  if (outcome?.status === "stopped") {
    return (
      <section className={styles.panel} aria-labelledby="stopped-title">
        <p className={styles.eyebrow}>Generation stopped</p>
        <h2 id="stopped-title">このケースでは鑑定ノートを生成しませんでした</h2>
        <p>
          停止理由: {outcome.reason.includes("safety") ? "Safety gate" : "JPY980 product scope"}
        </p>
        {outcome.reasonCodes.length > 0 ? (
          <ul>{outcome.reasonCodes.map((code) => <li key={code}>{code}</li>)}</ul>
        ) : null}
        <button type="button" onClick={reset}>入力へ戻る</button>
      </section>
    );
  }

  return (
    <form className={styles.form} onSubmit={generate}>
      <section className={styles.notice} aria-labelledby="synthetic-notice">
        <p className={styles.eyebrow}>Local operator only</p>
        <h2 id="synthetic-notice">架空・匿名化されたマーケティング用ケースのみ使用</h2>
        <p>Customer実データ、氏名、連絡先、注文情報を入力しないでください。</p>
        <label>
          <input
            type="checkbox"
            checked={form.syntheticOnlyAcknowledged}
            onChange={(event) => update("syntheticOnlyAcknowledged", event.target.checked)}
          />
          <span>このケースが架空または十分に匿名化されていることを確認しました</span>
        </label>
      </section>

      <section className={styles.panel}>
        <p className={styles.eyebrow}>Synthetic case</p>
        <h2>相談ケース</h2>
        <label className={styles.field}>
          <span>関係</span>
          <select
            value={form.relationship}
            onChange={(event) => update("relationship", event.target.value as RelationshipValue)}
          >
            {relationshipOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>
        <label className={styles.field}>
          <span>現在の状況</span>
          <textarea
            required
            rows={8}
            maxLength={3600}
            value={form.currentSituation}
            onChange={(event) => update("currentSituation", event.target.value)}
          />
        </label>
        <label className={styles.field}>
          <span>相手から届いた最新の文面（任意）</span>
          <textarea
            rows={4}
            maxLength={1000}
            value={form.latestInboundMessage}
            onChange={(event) => update("latestInboundMessage", event.target.value)}
          />
        </label>
        <label className={styles.field}>
          <span>候補文面（任意）</span>
          <textarea
            rows={5}
            maxLength={1000}
            value={form.optionalMessage}
            onChange={(event) => update("optionalMessage", event.target.value)}
          />
        </label>
      </section>

      <section className={styles.panel}>
        <p className={styles.eyebrow}>Product scope</p>
        <h2>相談テーマ</h2>
        <fieldset className={styles.choiceGrid}>
          <legend>知りたい内容（1つ以上）</legend>
          {topicOptions.map((topic) => (
            <label key={topic.value} data-selected={topicSet.has(topic.value)}>
              <input
                type="checkbox"
                checked={topicSet.has(topic.value)}
                onChange={() => toggleTopic(topic.value)}
              />
              <span>{topic.label}</span>
            </label>
          ))}
        </fieldset>
        <label className={styles.field}>
          <span>現在の連絡境界</span>
          <select
            value={form.contactBoundaryState}
            onChange={(event) =>
              update("contactBoundaryState", event.target.value as ContactBoundaryStateV1)
            }
          >
            {boundaryOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>
        <label className={styles.field}>
          <span>依頼目的</span>
          <select
            value={form.requestedAssistanceGoal}
            onChange={(event) =>
              update("requestedAssistanceGoal", event.target.value as RequestedAssistanceGoalV1)
            }
          >
            {assistanceOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>
      </section>

      <section className={styles.panel}>
        <p className={styles.eyebrow}>Production acknowledgements</p>
        <h2>利用範囲の確認</h2>
        <div className={styles.checkList}>
          <label>
            <input type="checkbox" checked={form.adultConfirmed} onChange={(event) => update("adultConfirmed", event.target.checked)} />
            <span>18歳以上の運営者が利用しています</span>
          </label>
          <label>
            <input type="checkbox" checked={form.privacyAcknowledged} onChange={(event) => update("privacyAcknowledged", event.target.checked)} />
            <span>個人を特定できる情報を入力していません</span>
          </label>
          <label>
            <input type="checkbox" checked={form.attestationConfirmed} onChange={(event) => update("attestationConfirmed", event.target.checked)} />
            <span>拒否回避、監視、追跡、脅し、圧力のために利用しません</span>
          </label>
          <label>
            <input type="checkbox" checked={form.pauseAssessmentDisclosureAcknowledged} onChange={(event) => update("pauseAssessmentDisclosureAcknowledged", event.target.checked)} />
            <span>結果が「今は送らない」となり文案が出ない場合を了承</span>
          </label>
          <label>
            <input type="checkbox" checked={form.boundarySupportOnlyDisclosureAcknowledged} onChange={(event) => update("boundarySupportOnlyDisclosureAcknowledged", event.target.checked)} />
            <span>境界がある場合は再接触方法や文案を提供しないことを了承</span>
          </label>
          <label>
            <input type="checkbox" checked={form.scopedReplyScopeAcknowledged} onChange={(event) => update("scopedReplyScopeAcknowledged", event.target.checked)} />
            <span>返信は最新の用件の範囲だけに限定されることを了承</span>
          </label>
          <label>
            <input type="checkbox" checked={form.businessOnlyScopeAcknowledged} onChange={(event) => update("businessOnlyScopeAcknowledged", event.target.checked)} />
            <span>実務用件では私的・恋愛的内容を含めないことを了承</span>
          </label>
        </div>
      </section>

      {error ? <p className={styles.error} role="alert">{error}</p> : null}
      <div className={styles.submitArea}>
        <p>生成中はタブを閉じず、dev serverを再起動しないでください。自動再送はしません。</p>
        <button type="submit" disabled={!canSubmit || busy}>
          {busy ? "Production Coreで鑑定中…" : "鑑定を生成"}
        </button>
      </div>
    </form>
  );
}
