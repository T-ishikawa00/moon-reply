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
  ageGroup: string;
  nickname: string;
  relationship: string;
  relationshipStatus: string[];
  replyWait: string;
  lastPartnerMessage: string;
  lastOwnMessage: string;
  draftMessage: string;
  recentFlow: string;
  mainConcern: string;
  desiredAction: string;
  mainQuestion: string;
  sendTonight: string;
  email: string;
  safetyFlags: string[];
  acknowledged: boolean;
};

type StepNumber = 1 | 2 | 3;
type ErrorKey = keyof RequestFormData | "safetyBlocking";
type ValidationErrors = Partial<Record<ErrorKey, string>>;

const initialFormState: RequestFormData = {
  ageGroup: "",
  nickname: "",
  relationship: "",
  relationshipStatus: [],
  replyWait: "",
  lastPartnerMessage: "",
  lastOwnMessage: "",
  draftMessage: "",
  recentFlow: "",
  mainConcern: "",
  desiredAction: "",
  mainQuestion: "",
  sendTonight: "",
  email: "",
  safetyFlags: [],
  acknowledged: false,
};

const ageOptions = ["18〜24歳", "25〜29歳", "30〜34歳", "35〜39歳", "40歳以上"];

const relationshipOptions = [
  "付き合う前",
  "交際中",
  "元恋人",
  "マッチングアプリ",
  "職場/学校/趣味の知り合い",
  "曖昧な関係",
  "その他",
];

const relationshipStatusOptions = [
  "最近出会った",
  "何度か会っている",
  "毎日連絡している",
  "最近返信が遅い",
  "既読/未読のまま止まっている",
  "断られた/予定が流れた",
  "復縁未満",
  "その他",
];

const replyWaitOptions = [
  "まだ返事待ちではない",
  "数時間",
  "半日",
  "1日",
  "2〜3日",
  "4日以上",
  "その他",
];

const sendTonightOptions = ["はい", "迷っている", "いいえ"];
const safetyOptions = SAFETY_SELECTED_FLAGS;
const noneSafetyOption = NONE_SAFETY_FLAG;

const acknowledgementItems = [
  "AIが入力内容を整理・分析する鑑定ノートであること",
  "医療・診断・カウンセリングではないこと",
  "相手の本心・返信・復縁・将来などを保証しないこと",
  "実名・住所・電話番号・アカウントIDなど不要な個人情報を入力しないこと",
  "Safety確認の結果によっては通常鑑定へ進めない場合があること",
];

const stepTitles: Record<StepNumber, string> = {
  1: "あなたと相手の状況",
  2: "実際のやり取りと今夜の相談",
  3: "受け取り・安全確認・同意",
};

const fieldLabels: Record<keyof RequestFormData, string> = {
  ageGroup: "年齢層",
  nickname: "呼ばれたい名前・ニックネーム",
  relationship: "相手との関係",
  relationshipStatus: "相手との状況",
  replyWait: "いつから返事がないか",
  lastPartnerMessage: "最後に相手から来たメッセージ",
  lastOwnMessage: "最後に自分が送ったメッセージ",
  draftMessage: "今送ろうとしているメッセージ",
  recentFlow: "直近のやり取りの流れ",
  mainConcern: "今いちばん不安なこと",
  desiredAction: "本当はどうしたいか",
  mainQuestion: "鑑定ノートで一番整理したいこと",
  sendTonight: "今夜中に送ろうとしているか",
  email: "鑑定結果の受け取りメールアドレス",
  safetyFlags: "安全確認",
  acknowledged: "同意事項",
};

const requiredByStep: Record<StepNumber, Array<keyof RequestFormData>> = {
  1: ["ageGroup", "nickname", "relationship", "replyWait"],
  2: [
    "draftMessage",
    "recentFlow",
    "mainConcern",
    "desiredAction",
    "mainQuestion",
    "sendTonight",
  ],
  3: ["email"],
};

function validateStep(form: RequestFormData, step: StepNumber) {
  const errors: ValidationErrors = {};

  for (const field of requiredByStep[step]) {
    if (typeof form[field] === "string" && !form[field].trim()) {
      errors[field] = `${fieldLabels[field]}を入力してください。`;
    }
  }

  if (step === 1) {
    if (form.ageGroup && !ageOptions.includes(form.ageGroup)) {
      errors.ageGroup = "月の返事は18歳以上の方を対象としています。";
    }
    if (form.relationshipStatus.length === 0) {
      errors.relationshipStatus = "相手との状況を1つ以上選択してください。";
    }
  }

  if (step === 3) {
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errors.email = "メールアドレスの形式を確認してください。";
    }
    if (form.safetyFlags.length === 0) {
      errors.safetyFlags = "安全確認を選択してください。";
    }
    const dangerItems = form.safetyFlags.filter((item) => item !== noneSafetyOption);
    if (dangerItems.length > 0 && form.safetyFlags.includes(noneSafetyOption)) {
      errors.safetyFlags =
        "危険項目と「上記には当てはまらない」は同時に選択できません。";
    }
    if (!form.acknowledged) {
      errors.acknowledged = "上記の内容を確認し、同意してください。";
    }
  }

  return errors;
}

function toggleValue(values: string[], value: string) {
  return values.includes(value)
    ? values.filter((item) => item !== value)
    : [...values, value];
}

function RequiredMark() {
  return <span className="ml-2 text-sm font-semibold text-[#9a5d22]">必須</span>;
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="mt-2 text-sm font-semibold leading-6 text-[#8f2f2a]">
      {message}
    </p>
  );
}

function FieldLabel({
  htmlFor,
  children,
  required,
}: {
  htmlFor: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label htmlFor={htmlFor} className="block text-base font-semibold leading-7">
      {children}
      {required ? <RequiredMark /> : null}
    </label>
  );
}

function TextInput({
  id,
  value,
  onChange,
  type = "text",
  note,
  error,
}: {
  id: keyof RequestFormData;
  value: string;
  onChange: (field: keyof RequestFormData, value: string) => void;
  type?: "text" | "email";
  note?: string;
  error?: string;
}) {
  return (
    <div>
      <FieldLabel htmlFor={id} required>{fieldLabels[id]}</FieldLabel>
      {note ? <p className="mt-1 text-sm leading-6 text-[#67596b]">{note}</p> : null}
      <input
        id={id}
        name={id}
        type={type}
        value={value}
        onChange={(event) => onChange(id, event.target.value)}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className="mt-3 min-h-12 w-full rounded-lg border border-[#d8c596] bg-[#fffcf4] px-4 py-3 text-base text-[#271f34] outline-none transition focus:border-[#9a7c3e] focus:ring-2 focus:ring-[#e5c46d]/45"
      />
      <FieldError id={`${id}-error`} message={error} />
    </div>
  );
}

function TextArea({
  id,
  value,
  onChange,
  required,
  error,
}: {
  id: keyof RequestFormData;
  value: string;
  onChange: (field: keyof RequestFormData, value: string) => void;
  required?: boolean;
  error?: string;
}) {
  return (
    <div>
      <FieldLabel htmlFor={id} required={required}>{fieldLabels[id]}</FieldLabel>
      <textarea
        id={id}
        name={id}
        value={value}
        onChange={(event) => onChange(id, event.target.value)}
        rows={5}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className="mt-3 w-full rounded-lg border border-[#d8c596] bg-[#fffcf4] px-4 py-3 text-base leading-8 text-[#271f34] outline-none transition focus:border-[#9a7c3e] focus:ring-2 focus:ring-[#e5c46d]/45"
      />
      <FieldError id={`${id}-error`} message={error} />
    </div>
  );
}

function SelectField({
  id,
  value,
  options,
  onChange,
  note,
  error,
}: {
  id: keyof RequestFormData;
  value: string;
  options: string[];
  onChange: (field: keyof RequestFormData, value: string) => void;
  note?: string;
  error?: string;
}) {
  return (
    <div>
      <FieldLabel htmlFor={id} required>{fieldLabels[id]}</FieldLabel>
      {note ? <p className="mt-1 text-sm leading-6 text-[#67596b]">{note}</p> : null}
      <select
        id={id}
        name={id}
        value={value}
        onChange={(event) => onChange(id, event.target.value)}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className="mt-3 min-h-12 w-full rounded-lg border border-[#d8c596] bg-[#fffcf4] px-4 py-3 text-base text-[#271f34] outline-none transition focus:border-[#9a7c3e] focus:ring-2 focus:ring-[#e5c46d]/45"
      >
        <option value="">選択してください</option>
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
      <FieldError id={`${id}-error`} message={error} />
    </div>
  );
}

function CheckboxGroup({
  id,
  legend,
  options,
  values,
  onToggle,
  note,
  error,
}: {
  id: string;
  legend: string;
  options: string[];
  values: string[];
  onToggle: (value: string) => void;
  note?: string;
  error?: string;
}) {
  return (
    <fieldset id={id} tabIndex={-1} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined}>
      <legend className="text-base font-semibold leading-7">{legend}<RequiredMark /></legend>
      {note ? <p className="mt-1 text-sm leading-6 text-[#67596b]">{note}</p> : null}
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {options.map((option) => (
          <label key={option} className="flex min-h-12 cursor-pointer items-start gap-3 rounded-lg border border-[#d8c596] bg-[#fffcf4] px-4 py-3 leading-7">
            <input
              type="checkbox"
              checked={values.includes(option)}
              onChange={() => onToggle(option)}
              className="mt-1 h-5 w-5 flex-none accent-[#6f5a9a]"
            />
            <span>{option}</span>
          </label>
        ))}
      </div>
      <FieldError id={`${id}-error`} message={error} />
    </fieldset>
  );
}

function RadioGroup({ value, onChange, error }: { value: string; onChange: (value: string) => void; error?: string }) {
  return (
    <fieldset id="sendTonight" tabIndex={-1} aria-invalid={Boolean(error)} aria-describedby={error ? "sendTonight-error" : undefined}>
      <legend className="text-base font-semibold leading-7">{fieldLabels.sendTonight}<RequiredMark /></legend>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {sendTonightOptions.map((option) => (
          <label key={option} className="flex min-h-12 cursor-pointer items-center gap-3 rounded-lg border border-[#d8c596] bg-[#fffcf4] px-4 py-3 leading-7">
            <input type="radio" name="sendTonight" value={option} checked={value === option} onChange={(event) => onChange(event.target.value)} className="h-5 w-5 accent-[#6f5a9a]" />
            <span>{option}</span>
          </label>
        ))}
      </div>
      <FieldError id="sendTonight-error" message={error} />
    </fieldset>
  );
}

function StepCard({ step, children }: { step: StepNumber; children: React.ReactNode }) {
  return (
    <section id={`step-${step}`} aria-labelledby={`step-${step}-title`} className="rounded-xl border border-[#d8c596]/70 bg-[#fff8e9] p-5 text-[#271f34] shadow-[0_18px_50px_rgba(20,15,35,0.16)] sm:p-8">
      <p className="text-sm font-semibold tracking-[0.14em] text-[#8c6a29]">{step} / 3</p>
      <h2 id={`step-${step}-title`} className="mt-2 font-serif text-2xl font-semibold leading-[1.45] sm:text-3xl">{stepTitles[step]}</h2>
      <div className="mt-7 space-y-7">{children}</div>
    </section>
  );
}

function SafetyResultPanel({ result, stop = false }: { result: SafetyResult; stop?: boolean }) {
  const isContradictory = result.reasonCodes.includes("contradictory_selection");
  const copy = isContradictory
    ? {
        title: "安全確認の選択を見直してください",
        message:
          "危険項目と「上記には当てはまらない」は同時に選択できません。これは緊急状態の判定ではなく、修正が必要な入力矛盾です。",
      }
    : result.classification === "normal_allowed"
      ? {
          title: "通常鑑定の確認に進める内容です",
          message:
            "現在の入力内容では通常鑑定として扱える範囲に見えます。これは相手の本心・返信・復縁・将来などを保証する判定ではありません。",
        }
      : result.classification === "needs_review"
        ? {
            title: "通常鑑定の前に慎重な確認が必要です",
            message:
              "不安を煽ったり危険な関係を美化したりしないため、この状態では通常鑑定の確認に進めません。",
          }
        : {
            title: "月の返事の通常鑑定として扱えません",
            message:
              "安全を優先し、この内容を恋愛鑑定として後押しすることはできません。",
          };
  const tone = result.classification === "normal_allowed"
    ? "border-[#a89350] bg-[#fffaf0] text-[#332715]"
    : "border-[#c99f4b] bg-[#fff5d8] text-[#4c3514]";
  return (
    <div id={stop ? "safety-stop" : "safety-result"} tabIndex={-1} role={stop ? "alert" : "status"} className={`rounded-lg border p-5 leading-8 ${tone}`}>
      <p className="text-sm font-bold tracking-[0.08em]">{stop ? "ここで停止します" : "安全確認の結果"}</p>
      <h3 className="mt-1 text-lg font-semibold">{copy.title}</h3>
      <p className="mt-2">{copy.message}</p>
      {stop ? <p className="mt-3 font-semibold">安全確認の結果によっては、通常鑑定へ進めない場合があります。</p> : null}
      {stop && !isContradictory && (result.classification === "needs_review" || result.classification === "rejected") ? (
        <Link href="/legal/unsupported-cases" className="mt-4 inline-flex min-h-11 items-center rounded-lg border border-[#8a6d2e] bg-[#fffaf0] px-4 py-2 font-semibold underline underline-offset-4 focus:outline-none focus:ring-2 focus:ring-[#8a6d2e] focus:ring-offset-2">
          通常鑑定として扱わない相談の審査説明を見る
        </Link>
      ) : null}
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 border-t border-[#d9caa8] py-3 sm:grid-cols-[12rem_1fr] sm:gap-4">
      <dt className="font-semibold text-[#765e2d]">{label}</dt>
      <dd className="m-0 whitespace-pre-wrap break-words leading-7">{value || "未入力"}</dd>
    </div>
  );
}

function excerpt(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "未入力（任意）";
  return trimmed.length > 120 ? `${trimmed.slice(0, 120)}…` : trimmed;
}

function Confirmation({ form, onEdit }: { form: RequestFormData; onEdit: (step: StepNumber) => void }) {
  return (
    <section aria-labelledby="confirmation-title" className="rounded-xl border border-[#d6b86d]/60 bg-[#fff8e9] p-5 text-[#271f34] shadow-[0_18px_50px_rgba(0,0,0,0.22)] sm:p-8">
      <p className="text-sm font-semibold tracking-[0.14em] text-[#8c6a29]">LOCAL CONFIRMATION</p>
      <h2 id="confirmation-title" tabIndex={-1} className="mt-2 font-serif text-3xl font-semibold leading-[1.45]">入力内容を確認してください</h2>
      <div className="mt-5 rounded-lg border border-[#b99a4f] bg-[#f5e8bd] p-4 leading-7">
        これは審査段階のローカル確認です。外部送信、データ保存、決済開始、AI生成は行われていません。
      </div>

      <div className="mt-8 space-y-8">
        <section aria-labelledby="summary-step-1"><div className="flex flex-wrap items-center justify-between gap-3"><h3 id="summary-step-1" className="text-xl font-semibold">Step 1・あなたと相手の状況</h3><button type="button" onClick={() => onEdit(1)} className="min-h-11 rounded-lg border border-[#8a6d2e] px-4 py-2 font-semibold focus:outline-none focus:ring-2 focus:ring-[#8a6d2e]">Step 1を修正</button></div><dl className="mt-3"><SummaryRow label="年齢層" value={form.ageGroup} /><SummaryRow label="ニックネーム" value={form.nickname} /><SummaryRow label="相手との関係" value={form.relationship} /><SummaryRow label="相手との状況" value={form.relationshipStatus.join("、")} /><SummaryRow label="返信待ち期間" value={form.replyWait} /></dl></section>
        <section aria-labelledby="summary-step-2"><div className="flex flex-wrap items-center justify-between gap-3"><h3 id="summary-step-2" className="text-xl font-semibold">Step 2・実際のやり取りと今夜の相談</h3><button type="button" onClick={() => onEdit(2)} className="min-h-11 rounded-lg border border-[#8a6d2e] px-4 py-2 font-semibold focus:outline-none focus:ring-2 focus:ring-[#8a6d2e]">Step 2を修正</button></div><dl className="mt-3"><SummaryRow label="相手の最後の文面" value={excerpt(form.lastPartnerMessage)} /><SummaryRow label="自分の最後の文面" value={excerpt(form.lastOwnMessage)} /><SummaryRow label="送信予定の文面" value={excerpt(form.draftMessage)} /><SummaryRow label="直近の流れ" value={excerpt(form.recentFlow)} /><SummaryRow label="主な不安" value={excerpt(form.mainConcern)} /><SummaryRow label="希望する行動" value={excerpt(form.desiredAction)} /><SummaryRow label="一番の質問" value={excerpt(form.mainQuestion)} /><SummaryRow label="今夜送る意向" value={form.sendTonight} /></dl></section>
        <section aria-labelledby="summary-step-3"><div className="flex flex-wrap items-center justify-between gap-3"><h3 id="summary-step-3" className="text-xl font-semibold">Step 3・受け取り・安全確認・同意</h3><button type="button" onClick={() => onEdit(3)} className="min-h-11 rounded-lg border border-[#8a6d2e] px-4 py-2 font-semibold focus:outline-none focus:ring-2 focus:ring-[#8a6d2e]">Step 3を修正</button></div><dl className="mt-3"><SummaryRow label="メールアドレス" value={form.email} /><SummaryRow label="安全確認" value="通常鑑定の確認に進める内容" /><SummaryRow label="同意事項" value="確認済み" /></dl><p className="mt-4 font-semibold">同意事項：確認済み</p></section>
      </div>

      <div className="mt-8 rounded-lg border border-[#d6b86d]/40 bg-[#18152e] p-5 text-[#efe5d0]">
        <p className="leading-8">ここから先の送信・購入・鑑定生成は実装されていません。入力内容はこの画面を閉じたり再読み込みしたりすると失われます。</p>
      </div>
    </section>
  );
}

export function RequestForm() {
  const [form, setForm] = useState<RequestFormData>(initialFormState);
  const [step, setStep] = useState<StepNumber>(1);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [showSafetyStop, setShowSafetyStop] = useState(false);

  useEffect(() => {
    function applyHashStep() {
      const match = window.location.hash.match(/^#step-([123])$/);
      if (match) setStep(Number(match[1]) as StepNumber);
    }

    const frameId = window.requestAnimationFrame(applyHashStep);
    window.addEventListener("hashchange", applyHashStep);
    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("hashchange", applyHashStep);
    };
  }, []);

  const safetyResult = useMemo(() => classifySafetyInput({
    selectedFlags: form.safetyFlags,
    draftMessage: form.draftMessage,
    recentFlow: form.recentFlow,
    mainConcern: form.mainConcern,
    desiredAction: form.desiredAction,
    mainQuestion: form.mainQuestion,
  }), [form.safetyFlags, form.draftMessage, form.recentFlow, form.mainConcern, form.desiredAction, form.mainQuestion]);

  function focusFirstError(nextErrors: ValidationErrors) {
    const firstKey = Object.keys(nextErrors)[0];
    if (!firstKey) return;
    window.setTimeout(() => {
      const target = document.getElementById(firstKey === "safetyBlocking" ? "safety-stop" : firstKey);
      target?.focus();
      target?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 0);
  }

  function updateField(field: keyof RequestFormData, value: string | boolean) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      const next = { ...current };
      delete next[field];
      delete next.safetyBlocking;
      return next;
    });
    setShowSafetyStop(false);
    setIsConfirmed(false);
  }

  function toggleArrayField(field: "relationshipStatus" | "safetyFlags", value: string) {
    setForm((current) => ({ ...current, [field]: toggleValue(current[field], value) }));
    setErrors((current) => {
      const next = { ...current };
      delete next[field];
      delete next.safetyBlocking;
      return next;
    });
    setShowSafetyStop(false);
    setIsConfirmed(false);
  }

  function moveToStep(nextStep: StepNumber) {
    setStep(nextStep);
    setErrors({});
    setShowSafetyStop(false);
    window.setTimeout(() => document.getElementById(`step-${nextStep}-title`)?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
  }

  function handleNext() {
    const nextErrors = validateStep(form, step);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      focusFirstError(nextErrors);
      return;
    }
    moveToStep((step + 1) as StepNumber);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validationByStep = ([1, 2, 3] as StepNumber[]).map((item) => ({
      step: item,
      errors: validateStep(form, item),
    }));
    const firstInvalidStep = validationByStep.find(
      (item) => Object.keys(item.errors).length > 0,
    );
    if (firstInvalidStep) {
      setStep(firstInvalidStep.step);
      setErrors(firstInvalidStep.errors);
      setShowSafetyStop(false);
      focusFirstError(firstInvalidStep.errors);
      return;
    }
    if (safetyResult.classification !== "normal_allowed") {
      const blockedErrors: ValidationErrors = {
        safetyBlocking: "安全確認の結果によっては、通常鑑定へ進めない場合があります。",
      };
      setErrors(blockedErrors);
      setShowSafetyStop(true);
      focusFirstError(blockedErrors);
      return;
    }
    setErrors({});
    setShowSafetyStop(false);
    setIsConfirmed(true);
    window.setTimeout(() => document.getElementById("confirmation-title")?.focus(), 0);
  }

  const errorList = Object.entries(errors);
  const visibleSafetyResult = form.safetyFlags.length > 0;

  if (isConfirmed) {
    return <section className="mx-auto max-w-5xl px-4 py-12 sm:px-8 sm:py-16"><Confirmation form={form} onEdit={(editStep) => { setIsConfirmed(false); moveToStep(editStep); }} /></section>;
  }

  return (
    <section className="mx-auto max-w-5xl px-4 py-12 sm:px-8 sm:py-16">
      <nav aria-label="入力ステップ" className="mb-7 grid grid-cols-3 gap-2 text-center text-sm">
        {([1, 2, 3] as StepNumber[]).map((item) => <span key={item} aria-current={item === step ? "step" : undefined} className={`rounded-lg border px-2 py-3 font-semibold ${item === step ? "border-[#e5c46d] bg-[#e5c46d] text-[#181326]" : "border-white/20 bg-white/5 text-[#efe5d0]"}`}>{item} / 3<span className="hidden sm:inline">・{stepTitles[item]}</span></span>)}
      </nav>

      <form noValidate onSubmit={handleSubmit}>
        {errorList.length > 0 ? (
          <div role="alert" aria-live="assertive" className="mb-7 rounded-lg border border-[#c87864] bg-[#fff1ea] p-5 text-[#5b2520]">
            <h2 className="text-xl font-semibold">入力内容を確認してください</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 leading-7">{errorList.map(([key, message]) => <li key={key}>{message}</li>)}</ul>
          </div>
        ) : null}

        {step === 1 ? <StepCard step={1}>
          <SelectField id="ageGroup" value={form.ageGroup} options={ageOptions} onChange={updateField} note="月の返事は18歳以上の方を対象としています。生年月日や本人確認書類の入力は不要です。" error={errors.ageGroup} />
          <TextInput id="nickname" value={form.nickname} onChange={updateField} note="実名は使わず、呼ばれたいニックネームを入力してください。" error={errors.nickname} />
          <SelectField id="relationship" value={form.relationship} options={relationshipOptions} onChange={updateField} error={errors.relationship} />
          <CheckboxGroup id="relationshipStatus" legend="相手との状況" options={relationshipStatusOptions} values={form.relationshipStatus} onToggle={(value) => toggleArrayField("relationshipStatus", value)} error={errors.relationshipStatus} />
          <SelectField id="replyWait" value={form.replyWait} options={replyWaitOptions} onChange={updateField} error={errors.replyWait} />
        </StepCard> : null}

        {step === 2 ? <StepCard step={2}>
          <div className="rounded-lg border border-[#d8c596] bg-[#f5ead2] p-4 text-sm leading-7 text-[#5b4f58]">
            LINEなどから必要な部分だけコピーできます。スクリーンショットや画像のアップロードには対応していません。名前は「相手」「自分」などに置き換え、実名・住所・電話番号・アカウントID・勤務先・学校名など不要な情報を削除してください。このサービスは文章を自動で匿名化・マスクしません。
          </div>
          <TextArea id="lastPartnerMessage" value={form.lastPartnerMessage} onChange={updateField} />
          <TextArea id="lastOwnMessage" value={form.lastOwnMessage} onChange={updateField} />
          <TextArea id="draftMessage" value={form.draftMessage} onChange={updateField} required error={errors.draftMessage} />
          <TextArea id="recentFlow" value={form.recentFlow} onChange={updateField} required error={errors.recentFlow} />
          <TextArea id="mainConcern" value={form.mainConcern} onChange={updateField} required error={errors.mainConcern} />
          <TextArea id="desiredAction" value={form.desiredAction} onChange={updateField} required error={errors.desiredAction} />
          <TextArea id="mainQuestion" value={form.mainQuestion} onChange={updateField} required error={errors.mainQuestion} />
          <RadioGroup value={form.sendTonight} onChange={(value) => updateField("sendTonight", value)} error={errors.sendTonight} />
        </StepCard> : null}

        {step === 3 ? <StepCard step={3}>
          <TextInput id="email" value={form.email} onChange={updateField} type="email" note="将来、鑑定結果URLの受け取りに使用する予定です。現在は送信も保存もされません。" error={errors.email} />
          <CheckboxGroup id="safetyFlags" legend="当てはまる項目を選択してください" options={safetyOptions} values={form.safetyFlags} onToggle={(value) => toggleArrayField("safetyFlags", value)} note="入力内容をこのブラウザ内の決定的なルールで確認します。安全確認は将来の決済より前に行います。" error={errors.safetyFlags} />
          {visibleSafetyResult && !showSafetyStop ? <SafetyResultPanel result={safetyResult} /> : null}
          {showSafetyStop ? <SafetyResultPanel result={safetyResult} stop /> : null}
          <fieldset id="acknowledged" tabIndex={-1} aria-invalid={Boolean(errors.acknowledged)} aria-describedby={errors.acknowledged ? "acknowledged-error" : "acknowledgement-description"}>
            <legend className="text-base font-semibold leading-7">確認・同意事項<RequiredMark /></legend>
            <div id="acknowledgement-description" className="mt-3 rounded-lg border border-[#d8c596] bg-[#f5ead2] p-4">
              <ol className="list-decimal space-y-2 pl-6 leading-7">{acknowledgementItems.map((item) => <li key={item}>{item}</li>)}</ol>
            </div>
            <label htmlFor="acknowledgement-checkbox" className="mt-4 flex min-h-14 cursor-pointer items-center gap-3 rounded-lg border border-[#b49242] bg-[#fffcf4] px-4 py-3 font-semibold leading-7">
              <input id="acknowledgement-checkbox" name="acknowledged" type="checkbox" required checked={form.acknowledged} onChange={(event) => updateField("acknowledged", event.target.checked)} className="h-6 w-6 flex-none accent-[#6f5a9a]" />
              <span>上記の内容をすべて確認し、同意します</span>
            </label>
            <FieldError id="acknowledged-error" message={errors.acknowledged} />
          </fieldset>
        </StepCard> : null}

        <div className="mt-7 flex flex-col-reverse gap-3 rounded-lg border border-[#d6b86d]/40 bg-[#18152e] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-7">
          <div>{step > 1 ? <button type="button" onClick={() => moveToStep((step - 1) as StepNumber)} className="min-h-12 w-full rounded-lg border border-[#f0d992]/50 px-6 py-3 font-semibold text-[#fff7e8] focus:outline-none focus:ring-2 focus:ring-[#f6de9f] sm:w-auto">戻る</button> : <p className="text-sm leading-7 text-[#d5cab9]">入力内容はこのブラウザのメモリ内だけに保持されます。</p>}</div>
          {step < 3 ? <button type="button" onClick={handleNext} className="min-h-12 w-full rounded-lg border border-[#f0d992]/70 bg-[#e5c46d] px-6 py-3 font-semibold text-[#181326] focus:outline-none focus:ring-2 focus:ring-[#f6de9f] sm:w-auto">次へ</button> : <button type="submit" className="min-h-12 w-full rounded-lg border border-[#f0d992]/70 bg-[#e5c46d] px-6 py-3 font-semibold text-[#181326] focus:outline-none focus:ring-2 focus:ring-[#f6de9f] sm:w-auto">入力内容を確認する</button>}
        </div>
      </form>
    </section>
  );
}
