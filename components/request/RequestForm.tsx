"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  classifySafetyInput,
  NONE_SAFETY_FLAG,
  SAFETY_SELECTED_FLAGS,
} from "@/lib/safety";
import type { SafetyResult } from "@/lib/safety";

export type RequestFormData = {
  adultConfirmed: boolean;
  nickname: string;
  relationship: string;
  whatToKnow: string[];
  currentSituation: string;
  partnerMessage: string;
  draftMessage: string;
  email: string;
  safetyFlags: string[];
  acknowledged: boolean;
};

type Phase = 1 | 2 | 3 | 4;
type ErrorKey = keyof RequestFormData | "safetyBlocking";
type ValidationErrors = Partial<Record<ErrorKey, string>>;

const initialFormState: RequestFormData = {
  adultConfirmed: false,
  nickname: "",
  relationship: "",
  whatToKnow: [],
  currentSituation: "",
  partnerMessage: "",
  draftMessage: "",
  email: "",
  safetyFlags: [],
  acknowledged: false,
};

const relationshipOptions = [
  "付き合う前",
  "交際中",
  "曖昧な関係",
  "元恋人",
  "マッチングアプリ",
  "職場・学校・知人",
  "その他",
];

const whatToKnowOptions = [
  "送るか待つか決めたい",
  "この文面がどう届くか知りたい",
  "送る文章を整えたい",
  "相手との関係を整理したい",
  "これから3日どう動くか知りたい",
  "不安を整理したい",
];

const acknowledgementItems = [
  "AIを利用して、入力された情報を整理・分析する予定です。",
  "相手の本心や返信、復縁、交際、将来の結果を保証しません。",
  "医療、診断、心理カウンセリング、法律相談を代替するものではありません。",
  "Safety確認の結果によっては、通常鑑定へ進めない場合があります。",
  "実名など、鑑定に不要な個人情報を入力しません。",
];

const phaseTitles: Record<Phase, string> = {
  1: "相談を書く",
  2: "Safetyを確認",
  3: "依頼メモを確認",
  4: "受取メール",
};

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
  if (!relationshipOptions.includes(form.relationship)) {
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
  return errors;
}

function validateSafety(form: RequestFormData) {
  const errors: ValidationErrors = {};
  if (form.safetyFlags.length === 0) {
    errors.safetyFlags = "当てはまる内容を選択してください。";
  }
  const dangerItems = form.safetyFlags.filter(
    (item) => item !== NONE_SAFETY_FLAG,
  );
  if (
    dangerItems.length > 0 &&
    form.safetyFlags.includes(NONE_SAFETY_FLAG)
  ) {
    errors.safetyFlags =
      "危険項目と「上記には当てはまらない」は同時に選択できません。";
  }
  if (!form.acknowledged) {
    errors.acknowledged =
      "「上記を確認し、鑑定依頼を続けます」にチェックしてください。";
  }
  return errors;
}

function validateEmail(form: RequestFormData) {
  const errors: ValidationErrors = {};
  if (!form.email.trim()) {
    errors.email = "受け取りメールアドレスを入力してください。";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
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

function SafetyResultPanel({
  result,
  blocking = false,
}: {
  result: SafetyResult;
  blocking?: boolean;
}) {
  const normal = result.classification === "normal_allowed";
  const shouldStop = blocking || !normal;

  return (
    <section
      id={shouldStop ? "safetyBlocking" : "safety-result"}
      tabIndex={-1}
      role={shouldStop ? "alert" : "status"}
      className={`request-safety-result ${
        shouldStop ? "request-safety-result--stop" : ""
      }`}
      aria-labelledby="safety-result-title"
    >
      <p>{shouldStop ? "ここで停止します" : "Safety確認の結果"}</p>
      <h3 id="safety-result-title">{result.userTitle}</h3>
      <span>{result.userMessage}</span>
      {shouldStop ? (
        <>
          <strong>
            normal_allowed 以外は、入力確認・購入確認・通常レポートへ進めません。
          </strong>
          <Link href="/legal/unsupported-cases" className="text-link">
            通常鑑定として扱わない相談を確認する
          </Link>
        </>
      ) : null}
    </section>
  );
}

function MemoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function RequestMemo({
  form,
  onEdit,
  onContinue,
}: {
  form: RequestFormData;
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
          入力内容をローカルで並べ直した表示です。AI処理、外部送信、保存は行っていません。
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
          <MemoRow
            label="今夜知りたいこと"
            value={form.whatToKnow.join("、")}
          />
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
          <MemoRow
            label="相手から届いた文面"
            value={excerpt(form.partnerMessage)}
          />
          <MemoRow
            label="自分が送ろうとしている文面"
            value={excerpt(form.draftMessage)}
          />
        </dl>
      </section>

      <section aria-labelledby="memo-safety-title">
        <div className="request-memo__heading">
          <h3 id="memo-safety-title">Safety確認</h3>
          <button type="button" onClick={() => onEdit(2)}>
            Safetyを修正
          </button>
        </div>
        <p className="request-memo__safety">
          通常鑑定の確認に進める内容 / 必須確認済み
        </p>
      </section>

      <footer className="request-phase-actions">
        <button type="button" className="button button--secondary" onClick={() => onEdit(2)}>
          戻る
        </button>
        <button type="button" className="button button--primary" onClick={onContinue}>
          受け取りメールへ
        </button>
      </footer>
    </article>
  );
}

export function RequestForm() {
  const [form, setForm] = useState<RequestFormData>(initialFormState);
  const [phase, setPhase] = useState<Phase>(1);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [completed, setCompleted] = useState(false);

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

  const safetyResult = useMemo(
    () =>
      classifySafetyInput({
        selectedFlags: form.safetyFlags,
        draftMessage: form.draftMessage,
        recentFlow: [form.currentSituation, form.partnerMessage].join("\n"),
        mainConcern: form.currentSituation,
        desiredAction: form.whatToKnow.join("、"),
        mainQuestion: form.whatToKnow.join("、"),
      }),
    [
      form.safetyFlags,
      form.draftMessage,
      form.currentSituation,
      form.partnerMessage,
      form.whatToKnow,
    ],
  );

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

  function updateString(field: keyof RequestFormData, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    clearFieldError(field);
    setCompleted(false);
  }

  function updateBoolean(field: "adultConfirmed" | "acknowledged", value: boolean) {
    setForm((current) => ({ ...current, [field]: value }));
    clearFieldError(field);
    setCompleted(false);
  }

  function toggleWhatToKnow(value: string) {
    if (!form.whatToKnow.includes(value) && form.whatToKnow.length >= 2) {
      setErrors((currentErrors) => ({
        ...currentErrors,
        whatToKnow: "今夜知りたいことは2つまで選べます。",
      }));
      return;
    }
    setForm((current) => ({
      ...current,
      whatToKnow: toggleValue(current.whatToKnow, value),
    }));
    clearFieldError("whatToKnow");
    setCompleted(false);
  }

  function toggleSafetyFlag(value: string) {
    setForm((current) => ({
      ...current,
      safetyFlags: toggleValue(current.safetyFlags, value),
    }));
    clearFieldError("safetyFlags");
    setCompleted(false);
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

  function continueFromSheet() {
    const nextErrors = validateSheet(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      focusFirstError(nextErrors);
      return;
    }
    moveToPhase(2);
  }

  function continueFromSafety() {
    const sheetErrors = validateSheet(form);
    if (Object.keys(sheetErrors).length > 0) {
      setPhase(1);
      setErrors(sheetErrors);
      focusFirstError(sheetErrors);
      return;
    }

    const safetyErrors = validateSafety(form);
    if (Object.keys(safetyErrors).length > 0) {
      setErrors(safetyErrors);
      focusFirstError(safetyErrors);
      return;
    }

    if (safetyResult.classification !== "normal_allowed") {
      const blockedErrors: ValidationErrors = {
        safetyBlocking:
          "Safety確認の結果により、通常鑑定の入力確認へは進めません。",
      };
      setErrors(blockedErrors);
      focusFirstError(blockedErrors);
      return;
    }

    moveToPhase(3);
  }

  function continueFromMemo() {
    const allPriorErrors = {
      ...validateSheet(form),
      ...validateSafety(form),
    };
    if (Object.keys(allPriorErrors).length > 0) {
      const nextPhase = Object.keys(validateSheet(form)).length > 0 ? 1 : 2;
      setPhase(nextPhase);
      setErrors(allPriorErrors);
      focusFirstError(allPriorErrors);
      return;
    }
    if (safetyResult.classification !== "normal_allowed") {
      setPhase(2);
      const blockedErrors: ValidationErrors = {
        safetyBlocking:
          "Safety確認の結果により、受け取りメール入力へは進めません。",
      };
      setErrors(blockedErrors);
      focusFirstError(blockedErrors);
      return;
    }
    moveToPhase(4);
  }

  function handleEmailSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const sheetErrors = validateSheet(form);
    const safetyErrors = validateSafety(form);
    const emailErrors = validateEmail(form);

    if (Object.keys(sheetErrors).length > 0) {
      setPhase(1);
      setErrors(sheetErrors);
      focusFirstError(sheetErrors);
      return;
    }
    if (
      Object.keys(safetyErrors).length > 0 ||
      safetyResult.classification !== "normal_allowed"
    ) {
      const nextErrors =
        Object.keys(safetyErrors).length > 0
          ? safetyErrors
          : {
              safetyBlocking:
                "Safety確認の結果により、購入前確認へは進めません。",
            };
      setPhase(2);
      setErrors(nextErrors);
      focusFirstError(nextErrors);
      return;
    }
    if (Object.keys(emailErrors).length > 0) {
      setErrors(emailErrors);
      focusFirstError(emailErrors);
      return;
    }

    setErrors({});
    setCompleted(true);
    window.setTimeout(() => {
      document.getElementById("request-local-complete")?.focus();
    }, 0);
  }

  if (completed) {
    return (
      <section className="request-sheet-wrap">
        <article
          id="request-local-complete"
          tabIndex={-1}
          className="request-local-complete"
          aria-labelledby="request-local-complete-title"
        >
          <p>ローカル確認完了</p>
          <h2 id="request-local-complete-title">
            購入前の最終確認へ進むための入力がそろいました。
          </h2>
          <span>
            ただし、現在は入力内容の外部送信、保存、メール送信、決済、鑑定生成を行いません。
          </span>
          <dl>
            <MemoRow label="今の関係" value={form.relationship} />
            <MemoRow label="今夜知りたいこと" value={form.whatToKnow.join("、")} />
            <MemoRow label="受け取りメール" value={form.email} />
            <MemoRow label="Safety" value="normal_allowed / 通常確認可能" />
          </dl>
          <button type="button" disabled aria-disabled="true">
            購入機能は現在準備中です
          </button>
          <button
            type="button"
            className="text-link"
            onClick={() => {
              setCompleted(false);
              moveToPhase(4);
            }}
          >
            メールアドレスを修正する
          </button>
        </article>
      </section>
    );
  }

  const errorList = Object.entries(errors);
  const dangerSafetyOptions = SAFETY_SELECTED_FLAGS.filter(
    (item) => item !== NONE_SAFETY_FLAG,
  );

  return (
    <section className="request-sheet-wrap">
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
                onChange={(event) =>
                  updateBoolean("adultConfirmed", event.target.checked)
                }
              />
              <span>私は18歳以上です</span>
              <small>必須 / 生年月日や本人確認書類は入力しません</small>
            </label>
            <FieldError
              id="adultConfirmed-error"
              message={errors.adultConfirmed}
            />
          </div>

          <fieldset
            id="relationship"
            tabIndex={-1}
            className="request-field"
            aria-describedby={
              errors.relationship ? "relationship-error" : undefined
            }
          >
            <legend>今の関係 <span>必須</span></legend>
            <div className="request-chip-group">
              {relationshipOptions.map((option) => (
                <label key={option}>
                  <input
                    type="radio"
                    name="relationship"
                    value={option}
                    checked={form.relationship === option}
                    onChange={(event) =>
                      updateString("relationship", event.target.value)
                    }
                  />
                  <span>{option}</span>
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
            <legend>今夜、知りたいこと <span>必須</span></legend>
            <p id="what-to-know-note">1つまたは2つ選んでください。</p>
            <div className="request-chip-group">
              {whatToKnowOptions.map((option) => (
                <label key={option}>
                  <input
                    type="checkbox"
                    checked={form.whatToKnow.includes(option)}
                    onChange={() => toggleWhatToKnow(option)}
                  />
                  <span>{option}</span>
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
            <FieldError
              id="currentSituation-error"
              message={errors.currentSituation}
            />
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

          <details className="request-message-details">
            <summary>実際のメッセージを追加する <span>任意</span></summary>
            <div>
              <label htmlFor="partnerMessage">相手から届いた文面</label>
              <textarea
                id="partnerMessage"
                name="partnerMessage"
                rows={4}
                value={form.partnerMessage}
                onChange={(event) =>
                  updateString("partnerMessage", event.target.value)
                }
              />
              <label htmlFor="draftMessage">自分が送ろうとしている文面</label>
              <textarea
                id="draftMessage"
                name="draftMessage"
                rows={4}
                value={form.draftMessage}
                onChange={(event) =>
                  updateString("draftMessage", event.target.value)
                }
              />
            </div>
          </details>

          <footer className="request-phase-actions request-phase-actions--end">
            <button
              type="button"
              className="button button--primary"
              onClick={continueFromSheet}
            >
              Safety確認へ
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
            <p>02 / Safetyと確認</p>
            <h2 id="request-phase-2-title">通常鑑定として扱える内容か確認します。</h2>
            <span>この確認は、将来も必ず決済より前に行います。</span>
          </header>

          <fieldset
            id="safetyFlags"
            tabIndex={-1}
            className="request-field request-safety-field"
            aria-describedby="safety-note safetyFlags-error"
          >
            <legend>当てはまる内容を選択してください <span>必須</span></legend>
            <p id="safety-note">
              通常の恋愛相談は、まず「上記には当てはまらない」を選べます。
            </p>
            <label className="request-safety-normal">
              <input
                type="checkbox"
                checked={form.safetyFlags.includes(NONE_SAFETY_FLAG)}
                onChange={() => toggleSafetyFlag(NONE_SAFETY_FLAG)}
              />
              <span>{NONE_SAFETY_FLAG}</span>
            </label>
            <details>
              <summary>当てはまる可能性がある項目を確認する</summary>
              <div className="request-safety-options">
                {dangerSafetyOptions.map((option) => (
                  <label key={option}>
                    <input
                      type="checkbox"
                      checked={form.safetyFlags.includes(option)}
                      onChange={() => toggleSafetyFlag(option)}
                    />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
            </details>
            <FieldError id="safetyFlags-error" message={errors.safetyFlags} />
          </fieldset>

          {form.safetyFlags.length > 0 && !errors.safetyFlags ? (
            <SafetyResultPanel
              result={safetyResult}
              blocking={Boolean(errors.safetyBlocking)}
            />
          ) : null}

          <fieldset
            id="acknowledged"
            tabIndex={-1}
            className="request-field request-acknowledgement"
            aria-describedby="acknowledgement-list acknowledged-error"
          >
            <legend>依頼前の確認 <span>必須</span></legend>
            <ol id="acknowledgement-list">
              {acknowledgementItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ol>
            <label>
              <input
                type="checkbox"
                checked={form.acknowledged}
                onChange={(event) =>
                  updateBoolean("acknowledged", event.target.checked)
                }
              />
              <span>上記を確認し、鑑定依頼を続けます</span>
            </label>
            <FieldError
              id="acknowledged-error"
              message={errors.acknowledged}
            />
          </fieldset>

          <footer className="request-phase-actions">
            <button
              type="button"
              className="button button--secondary"
              onClick={() => moveToPhase(1)}
            >
              戻る
            </button>
            <button
              type="button"
              className="button button--primary"
              onClick={continueFromSafety}
            >
              依頼メモを確認する
            </button>
          </footer>
        </article>
      ) : null}

      {phase === 3 ? (
        <div id="request-phase-3">
          <RequestMemo
            form={form}
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
            <h2 id="request-phase-4-title">最後に、受け取り先を入力します。</h2>
            <span>相談入力とSafety確認が終わった後にだけ伺います。</span>
          </header>
          <form noValidate onSubmit={handleEmailSubmit}>
            <div className="request-field">
              <label htmlFor="email">
                受け取りメールアドレス <span>必須</span>
              </label>
              <p id="email-note">
                鑑定結果の送付と、ご購入に関する重要な連絡に使用する予定です。
                現在は送信も保存もされません。
              </p>
              <input
                id="email"
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
            <div className="request-runtime-note" role="note">
              <strong>現在はローカル確認だけです。</strong>
              <span>
                送信、永続保存、メール配信、決済、AI生成は行われません。最終操作時にも、相談入力・Safety・必須確認をすべて再検証します。
              </span>
            </div>
            <footer className="request-phase-actions">
              <button
                type="button"
                className="button button--secondary"
                onClick={() => moveToPhase(3)}
              >
                依頼メモへ戻る
              </button>
              <button type="submit" className="button button--primary">
                購入前の内容を確認する
              </button>
            </footer>
          </form>
        </article>
      ) : null}
    </section>
  );
}
