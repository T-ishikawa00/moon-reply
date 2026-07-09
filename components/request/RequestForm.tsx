"use client";

import { FormEvent, useMemo, useState } from "react";

type FormState = {
  ageGroup: string;
  nickname: string;
  email: string;
  relationship: string;
  relationshipStatus: string[];
  lastPartnerMessage: string;
  lastOwnMessage: string;
  draftMessage: string;
  replyWait: string;
  recentFlow: string;
  mainConcern: string;
  desiredAction: string;
  mainQuestion: string;
  sendTonight: string;
  safetyFlags: string[];
  consents: string[];
};

type ValidationErrors = Record<string, string>;

const initialFormState: FormState = {
  ageGroup: "",
  nickname: "",
  email: "",
  relationship: "",
  relationshipStatus: [],
  lastPartnerMessage: "",
  lastOwnMessage: "",
  draftMessage: "",
  replyWait: "",
  recentFlow: "",
  mainConcern: "",
  desiredAction: "",
  mainQuestion: "",
  sendTonight: "",
  safetyFlags: [],
  consents: [],
};

const ageOptions = [
  "18〜24歳",
  "25〜29歳",
  "30〜34歳",
  "35〜39歳",
  "40歳以上",
  "回答しない",
];

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

const safetyOptions = [
  "自分を傷つけたい気持ちがある",
  "相手を傷つけたい気持ちがある",
  "相手の家や職場に行こうとしている",
  "待ち伏せを考えている",
  "相手を脅す文面を送りたい",
  "DV/モラハラ/強い束縛/恐怖がある",
  "未成年との恋愛・面会に関する相談である",
  "実名や個人情報を晒したい",
  "監視・ログイン確認・居場所確認をしたい",
  "上記には当てはまらない",
];

const noneSafetyOption = "上記には当てはまらない";

const consentOptions = [
  "AIを利用した鑑定であることを理解しました",
  "医療/診断/カウンセリングではないことを理解しました",
  "相手の本心・返信・復縁を保証するものではないことを理解しました",
  "実名・住所・電話番号など不要な個人情報を入力しません",
  "危険相談の場合、通常鑑定ではなく返金または案内になる可能性を理解しました",
  "納品後は原則返金不可であることを理解しました",
];

const requiredFields: Array<keyof FormState> = [
  "ageGroup",
  "nickname",
  "email",
  "relationship",
  "draftMessage",
  "replyWait",
  "recentFlow",
  "mainConcern",
  "desiredAction",
  "mainQuestion",
  "sendTonight",
];

const fieldLabels: Record<keyof FormState, string> = {
  ageGroup: "年齢層",
  nickname: "呼ばれたい名前 or ニックネーム",
  email: "鑑定結果の受け取りメールアドレス",
  relationship: "相手との関係",
  relationshipStatus: "相手との状況",
  lastPartnerMessage: "最後に相手から来たメッセージ",
  lastOwnMessage: "最後に自分が送ったメッセージ",
  draftMessage: "今送ろうとしているメッセージ",
  replyWait: "いつから返事がないか",
  recentFlow: "直近のやり取りの流れ",
  mainConcern: "今いちばん不安なこと",
  desiredAction: "本当はどうしたいか",
  mainQuestion: "鑑定で一番知りたいこと",
  sendTonight: "今夜中に送ろうとしているか",
  safetyFlags: "安全確認",
  consents: "同意事項",
};

function validateForm(form: FormState) {
  const errors: ValidationErrors = {};

  for (const field of requiredFields) {
    if (typeof form[field] === "string" && !form[field].trim()) {
      errors[field] = `${fieldLabels[field]}を入力してください。`;
    }
  }

  if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = "メールアドレスの形式を確認してください。";
  }

  if (form.relationshipStatus.length === 0) {
    errors.relationshipStatus = "相手との状況を1つ以上選択してください。";
  }

  if (form.safetyFlags.length === 0) {
    errors.safetyFlags = "安全確認を選択してください。";
  }

  const selectedDangerousItems = form.safetyFlags.filter(
    (item) => item !== noneSafetyOption,
  );
  if (
    selectedDangerousItems.length > 0 &&
    form.safetyFlags.includes(noneSafetyOption)
  ) {
    errors.safetyFlags =
      "危険項目と「上記には当てはまらない」は同時に選択できません。";
  }

  const missingConsents = consentOptions.filter(
    (consent) => !form.consents.includes(consent),
  );
  if (missingConsents.length > 0) {
    errors.consents = "同意事項をすべて確認してください。";
  }

  return errors;
}

function toggleValue(values: string[], value: string) {
  if (values.includes(value)) {
    return values.filter((item) => item !== value);
  }

  return [...values, value];
}

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return (
    <p className="mt-2 text-sm font-semibold leading-6 text-[#a33b34]">
      {message}
    </p>
  );
}

function RequiredMark() {
  return <span className="ml-2 text-sm font-semibold text-[#9a5d22]">必須</span>;
}

function SectionCard({
  step,
  title,
  children,
}: {
  step: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-[#d8c596]/70 bg-[#fff8e9] p-5 text-[#271f34] shadow-[0_18px_50px_rgba(20,15,35,0.16)] sm:p-7">
      <p className="text-sm font-semibold tracking-[0.16em] text-[#8c6a29]">
        {step}
      </p>
      <h2 className="mt-2 text-2xl font-semibold leading-[1.45]">{title}</h2>
      <div className="mt-6 space-y-6">{children}</div>
    </section>
  );
}

function FieldLabel({
  htmlFor,
  children,
  required,
}: {
  htmlFor?: string;
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
  placeholder,
  type = "text",
  error,
  note,
}: {
  id: keyof FormState;
  value: string;
  onChange: (field: keyof FormState, value: string) => void;
  placeholder?: string;
  type?: "text" | "email";
  error?: string;
  note?: string;
}) {
  return (
    <div>
      <FieldLabel htmlFor={id} required>
        {fieldLabels[id]}
      </FieldLabel>
      {note ? <p className="mt-1 text-sm leading-6 text-[#67596b]">{note}</p> : null}
      <input
        id={id}
        name={id}
        type={type}
        value={value}
        onChange={(event) => onChange(id, event.target.value)}
        placeholder={placeholder}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className="mt-3 min-h-12 w-full rounded-lg border border-[#d8c596] bg-[#fffcf4] px-4 py-3 text-base text-[#271f34] outline-none transition placeholder:text-[#9c8d9f] focus:border-[#9a7c3e] focus:ring-2 focus:ring-[#e5c46d]/45"
      />
      <div id={`${id}-error`}>
        <FieldError message={error} />
      </div>
    </div>
  );
}

function TextArea({
  id,
  value,
  onChange,
  placeholder,
  required = false,
  error,
}: {
  id: keyof FormState;
  value: string;
  onChange: (field: keyof FormState, value: string) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
}) {
  return (
    <div>
      <FieldLabel htmlFor={id} required={required}>
        {fieldLabels[id]}
      </FieldLabel>
      <textarea
        id={id}
        name={id}
        value={value}
        onChange={(event) => onChange(id, event.target.value)}
        placeholder={placeholder}
        rows={5}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className="mt-3 w-full rounded-lg border border-[#d8c596] bg-[#fffcf4] px-4 py-3 text-base leading-8 text-[#271f34] outline-none transition placeholder:text-[#9c8d9f] focus:border-[#9a7c3e] focus:ring-2 focus:ring-[#e5c46d]/45"
      />
      <div id={`${id}-error`}>
        <FieldError message={error} />
      </div>
    </div>
  );
}

function SelectField({
  id,
  value,
  options,
  onChange,
  error,
}: {
  id: keyof FormState;
  value: string;
  options: string[];
  onChange: (field: keyof FormState, value: string) => void;
  error?: string;
}) {
  return (
    <div>
      <FieldLabel htmlFor={id} required>
        {fieldLabels[id]}
      </FieldLabel>
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
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <div id={`${id}-error`}>
        <FieldError message={error} />
      </div>
    </div>
  );
}

function CheckboxGroup({
  legend,
  options,
  values,
  onToggle,
  error,
  note,
}: {
  legend: string;
  options: string[];
  values: string[];
  onToggle: (value: string) => void;
  error?: string;
  note?: string;
}) {
  return (
    <fieldset>
      <legend className="text-base font-semibold leading-7">
        {legend}
        <RequiredMark />
      </legend>
      {note ? <p className="mt-1 text-sm leading-6 text-[#67596b]">{note}</p> : null}
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {options.map((option) => (
          <label
            key={option}
            className="flex min-h-12 items-start gap-3 rounded-lg border border-[#d8c596] bg-[#fffcf4] px-4 py-3 leading-7"
          >
            <input
              type="checkbox"
              checked={values.includes(option)}
              onChange={() => onToggle(option)}
              className="mt-1 h-5 w-5 accent-[#6f5a9a]"
            />
            <span>{option}</span>
          </label>
        ))}
      </div>
      <FieldError message={error} />
    </fieldset>
  );
}

function RadioGroup({
  legend,
  options,
  value,
  onChange,
  error,
}: {
  legend: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
  error?: string;
}) {
  return (
    <fieldset>
      <legend className="text-base font-semibold leading-7">
        {legend}
        <RequiredMark />
      </legend>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {options.map((option) => (
          <label
            key={option}
            className="flex min-h-12 items-center gap-3 rounded-lg border border-[#d8c596] bg-[#fffcf4] px-4 py-3 leading-7"
          >
            <input
              type="radio"
              name="sendTonight"
              value={option}
              checked={value === option}
              onChange={(event) => onChange(event.target.value)}
              className="h-5 w-5 accent-[#6f5a9a]"
            />
            <span>{option}</span>
          </label>
        ))}
      </div>
      <FieldError message={error} />
    </fieldset>
  );
}

export function RequestForm() {
  const [form, setForm] = useState<FormState>(initialFormState);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isConfirmed, setIsConfirmed] = useState(false);

  const dangerousSelections = useMemo(
    () => form.safetyFlags.filter((item) => item !== noneSafetyOption),
    [form.safetyFlags],
  );
  const hasDangerousSelection = dangerousSelections.length > 0;
  const errorList = Object.values(errors);

  function updateField(field: keyof FormState, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setIsConfirmed(false);
  }

  function toggleArrayField(
    field: "relationshipStatus" | "safetyFlags" | "consents",
    value: string,
  ) {
    setForm((current) => ({
      ...current,
      [field]: toggleValue(current[field], value),
    }));
    setIsConfirmed(false);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateForm(form);
    setErrors(nextErrors);
    setIsConfirmed(Object.keys(nextErrors).length === 0);
  }

  return (
    <section className="mx-auto max-w-5xl px-5 py-12 sm:px-8 sm:py-16">
      <form noValidate onSubmit={handleSubmit} className="space-y-7">
        {errorList.length > 0 ? (
          <div
            role="alert"
            aria-live="assertive"
            className="rounded-lg border border-[#d06d5f] bg-[#fff1ea] p-5 text-[#5b2520] shadow-[0_18px_50px_rgba(20,15,35,0.16)]"
          >
            <h2 className="text-xl font-semibold">入力内容を確認してください</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 leading-7">
              {errorList.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {isConfirmed ? (
          <div
            role="status"
            aria-live="polite"
            className="rounded-lg border border-[#d6b86d]/60 bg-[#18152e] p-6 text-[#fff7e8] shadow-[0_18px_50px_rgba(0,0,0,0.22)]"
          >
            <h2 className="text-2xl font-semibold leading-[1.45]">
              入力内容の確認UIまで実装済みです。
            </h2>
            <p className="mt-4 leading-8 text-[#efe5d0]">
              このStageでは、まだ送信・保存・決済・AI生成は行いません。
              次のStage以降で、DB保存、安全チェック、決済、AI生成を段階的に実装します。
            </p>
            <ul className="mt-5 grid gap-3 text-[#efe5d0] sm:grid-cols-3">
              <li className="rounded-lg border border-white/10 bg-white/5 p-4">
                判定はまだ生成されません
              </li>
              <li className="rounded-lg border border-white/10 bg-white/5 p-4">
                決済は開始されません
              </li>
              <li className="rounded-lg border border-white/10 bg-white/5 p-4">
                結果ページは作成されません
              </li>
            </ul>
          </div>
        ) : null}

        <SectionCard step="Section 1" title="基本情報">
          <SelectField
            id="ageGroup"
            value={form.ageGroup}
            options={ageOptions}
            onChange={updateField}
            error={errors.ageGroup}
          />
          <TextInput
            id="nickname"
            value={form.nickname}
            onChange={updateField}
            placeholder="例：みな"
            note="実名ではなくニックネームで入力してください。"
            error={errors.nickname}
          />
          <TextInput
            id="email"
            value={form.email}
            onChange={updateField}
            type="email"
            note="Stage 2では送信しません。公開MVPでは結果URLの送付に使用します。"
            error={errors.email}
          />
        </SectionCard>

        <SectionCard step="Section 2" title="相手との関係">
          <SelectField
            id="relationship"
            value={form.relationship}
            options={relationshipOptions}
            onChange={updateField}
            error={errors.relationship}
          />
          <CheckboxGroup
            legend="相手との状況"
            options={relationshipStatusOptions}
            values={form.relationshipStatus}
            onToggle={(value) => toggleArrayField("relationshipStatus", value)}
            error={errors.relationshipStatus}
          />
        </SectionCard>

        <SectionCard step="Section 3" title="メッセージの状況">
          <TextArea
            id="lastPartnerMessage"
            value={form.lastPartnerMessage}
            onChange={updateField}
            placeholder="例：今日はありがとう。また落ち着いたら連絡するね。"
          />
          <TextArea
            id="lastOwnMessage"
            value={form.lastOwnMessage}
            onChange={updateField}
          />
          <TextArea
            id="draftMessage"
            value={form.draftMessage}
            onChange={updateField}
            required
            placeholder="例：今日なんか忙しかった？私、何か変なこと言っちゃったかな？"
            error={errors.draftMessage}
          />
          <SelectField
            id="replyWait"
            value={form.replyWait}
            options={replyWaitOptions}
            onChange={updateField}
            error={errors.replyWait}
          />
          <TextArea
            id="recentFlow"
            value={form.recentFlow}
            onChange={updateField}
            required
            placeholder="例：昨日までは普通に会話していたけど、今朝送ったメッセージが既読のまま止まっています。"
            error={errors.recentFlow}
          />
        </SectionCard>

        <SectionCard step="Section 4" title="今の気持ちと知りたいこと">
          <TextArea
            id="mainConcern"
            value={form.mainConcern}
            onChange={updateField}
            required
            error={errors.mainConcern}
          />
          <TextArea
            id="desiredAction"
            value={form.desiredAction}
            onChange={updateField}
            required
            error={errors.desiredAction}
          />
          <TextArea
            id="mainQuestion"
            value={form.mainQuestion}
            onChange={updateField}
            required
            error={errors.mainQuestion}
          />
          <RadioGroup
            legend="今夜中に送ろうとしているか"
            options={sendTonightOptions}
            value={form.sendTonight}
            onChange={(value) => updateField("sendTonight", value)}
            error={errors.sendTonight}
          />
        </SectionCard>

        <SectionCard step="Section 5" title="安全確認">
          <CheckboxGroup
            legend="以下に当てはまるものがあれば選択してください。"
            options={safetyOptions}
            values={form.safetyFlags}
            onToggle={(value) => toggleArrayField("safetyFlags", value)}
            error={errors.safetyFlags}
            note="このStageではUI上の確認だけを行います。バックエンドの安全チェックはまだ実装しません。"
          />
          {hasDangerousSelection ? (
            <div
              role="alert"
              className="rounded-lg border border-[#d06d5f] bg-[#fff1ea] p-5 leading-8 text-[#5b2520]"
            >
              この内容は通常鑑定として扱えない可能性があります。公開MVPでは安全チェック後、通常鑑定に進めない場合があります。
            </div>
          ) : null}
        </SectionCard>

        <SectionCard step="Section 6" title="同意事項">
          <CheckboxGroup
            legend="すべて確認してください。"
            options={consentOptions}
            values={form.consents}
            onToggle={(value) => toggleArrayField("consents", value)}
            error={errors.consents}
          />
        </SectionCard>

        <div className="rounded-lg border border-[#d6b86d]/40 bg-[#18152e] p-5 sm:p-7">
          <p className="leading-8 text-[#efe5d0]">
            送信ボタンはStage 2の確認用です。入力内容は外部送信されず、ブラウザ画面上の確認表示だけに使われます。
          </p>
          <button
            type="submit"
            className="mt-5 inline-flex min-h-12 w-full items-center justify-center rounded-lg border border-[#f0d992]/70 bg-[#e5c46d] px-6 py-3 text-base font-semibold text-[#181326] shadow-[0_14px_36px_rgba(229,196,109,0.25)] transition hover:bg-[#f1d789] focus:outline-none focus:ring-2 focus:ring-[#f6de9f] focus:ring-offset-2 focus:ring-offset-[#111028] sm:w-auto"
          >
            入力内容を確認する
          </button>
        </div>
      </form>
    </section>
  );
}
