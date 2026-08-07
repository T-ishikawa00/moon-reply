import { EditorialDivider } from "@/components/brand/EditorialDivider";
import { LunarArc } from "@/components/brand/LunarArc";
import { MoonSeal } from "@/components/brand/MoonSeal";
import { CustomerDraftCopyButton } from "@/components/runtime/CustomerDraftCopyButton";
import type { CustomerAssessmentExperienceProjectionV2 } from "@/lib/assessment/runtime/customer-assessment-experience-projection-v2";
import styles from "./CustomerAssessmentNote.module.css";

type BaseProjection = CustomerAssessmentExperienceProjectionV2["baseProjection"];
type DecisionCode = BaseProjection["decisionCode"];
type PlanItem = NonNullable<
  BaseProjection["optionalDetails"]["expandedPlan"]
>[number];
type PlanPhase = PlanItem["phase"];

const decisionLabels: Record<DecisionCode, string> = {
  reply_now: "今、返信する",
  send_now: "今、送る",
  wait_and_reassess: "今夜は送らず、次の材料を待つ",
  pause_additional_contact: "追加の連絡を止める",
};

const nullDraftMessages: Partial<Record<DecisionCode, string>> = {
  wait_and_reassess:
    "今は送らず、次の判断材料を待つため、\n送信文案は表示していません。",
  pause_additional_contact:
    "追加の連絡を止める判断のため、\n送信文案は表示していません。",
};

const phaseLabels: Record<PlanPhase, string> = {
  tonight: "今夜",
  next_day: "次の日",
  day_three: "3日目",
  next: "次に",
  reassessment_condition: "見直す条件",
};

function normalizedExactKey(value: string) {
  return value.replace(/\s+/gu, " ").trim();
}

function selectExactText(value: string | null | undefined, seen: Set<string>) {
  if (!value) return null;
  const key = normalizedExactKey(value);
  if (key.length === 0 || seen.has(key)) return null;
  seen.add(key);
  return value;
}

function selectExactTexts(values: readonly string[], seen: Set<string>) {
  const selected: string[] = [];
  for (const value of values) {
    const text = selectExactText(value, seen);
    if (text !== null) selected.push(text);
  }
  return selected;
}

function selectFirstExactText(values: readonly string[], seen: Set<string>) {
  for (let index = 0; index < values.length; index += 1) {
    const text = selectExactText(values[index], seen);
    if (text !== null) return { text, index };
  }
  return null;
}

type Props = {
  projection: CustomerAssessmentExperienceProjectionV2;
};

export function CustomerAssessmentNote({ projection }: Props) {
  const baseProjection = projection.baseProjection;
  const requestedTopics = baseProjection.requestedTopics;
  const visibleText = new Set<string>();

  const openingLine = selectExactText(projection.openingLine, visibleText);
  const openingLetter = selectExactTexts(projection.openingLetter, visibleText);
  const primaryReason = selectExactText(baseProjection.primaryReason, visibleText);
  const situationReading = selectExactTexts(
    projection.situationReading,
    visibleText,
  );
  const materialUnknowns = selectExactTexts(
    projection.materialUnknowns,
    visibleText,
  );

  const draftText =
    baseProjection.finalDraft === null
      ? null
      : selectExactText(baseProjection.finalDraft.text, visibleText);
  const draftContext =
    draftText === null
      ? null
      : selectExactText(projection.draftContext, visibleText);
  const draftAbsenceMessage =
    baseProjection.finalDraft === null &&
    requestedTopics.includes("draft_message")
      ? nullDraftMessages[baseProjection.decisionCode] ?? null
      : null;

  const messageTemperature =
    requestedTopics.includes("message_impact") &&
    baseProjection.messageTemperature !== null
      ? [
          {
            label: "柔らかさ",
            text: selectExactText(
              baseProjection.messageTemperature.softness,
              visibleText,
            ),
          },
          {
            label: "好意の強さ",
            text: selectExactText(
              baseProjection.messageTemperature.affection,
              visibleText,
            ),
          },
          {
            label: "返信への圧力",
            text: selectExactText(
              baseProjection.messageTemperature.pressure,
              visibleText,
            ),
          },
          {
            label: "調整した点",
            text: selectExactText(
              baseProjection.messageTemperature.adjustment,
              visibleText,
            ),
          },
        ].filter((item): item is { label: string; text: string } => item.text !== null)
      : [];

  const relationshipSummary = requestedTopics.includes("relationship")
    ? selectExactText(baseProjection.relationshipSummary, visibleText)
    : null;

  const immediateAction = selectExactText(
    baseProjection.immediateAction.action,
    visibleText,
  );
  const actionsToAvoid = selectExactTexts(
    baseProjection.immediateAction.avoid,
    visibleText,
  );
  const primaryActionRationale = selectFirstExactText(
    projection.actionRationales,
    visibleText,
  );
  const remainingActionRationaleSource =
    primaryActionRationale === null
      ? projection.actionRationales
      : projection.actionRationales.slice(primaryActionRationale.index + 1);

  const reassessmentWhen = selectExactText(
    baseProjection.reassessment.when,
    visibleText,
  );
  const reassessmentConditions = baseProjection.reassessment.conditions
    .map((item) => ({
      condition: selectExactText(item.condition, visibleText),
      resultingDirection: item.resultingDirection,
    }))
    .filter(
      (item): item is { condition: string; resultingDirection: DecisionCode } =>
        item.condition !== null,
    );

  const expandedPlan =
    requestedTopics.includes("next_three_days") &&
    baseProjection.optionalDetails.expandedPlan
      ? baseProjection.optionalDetails.expandedPlan
          .map((item) => ({
            phase: item.phase,
            action: selectExactText(item.action, visibleText),
            avoid: selectExactText(item.avoid, visibleText),
          }))
          .filter((item) => item.action !== null || item.avoid !== null)
      : [];

  // Core closing and limitation text take precedence over optional disclosure.
  const closingLines = selectExactTexts(projection.closingLines, visibleText).slice(
    0,
    2,
  );
  const fixedLimitation = selectExactText(
    baseProjection.fixedLimitation,
    visibleText,
  );

  const possibleInterpretations = selectExactTexts(
    projection.possibleInterpretations,
    visibleText,
  );
  const secondaryActions = selectExactTexts(
    baseProjection.immediateAction.secondaryActions,
    visibleText,
  );
  const remainingActionRationales = selectExactTexts(
    remainingActionRationaleSource,
    visibleText,
  );
  const anxietyReframes = selectExactTexts(
    baseProjection.optionalDetails.anxietyReframe ?? [],
    visibleText,
  );
  const planCommentary = selectExactTexts(
    baseProjection.optionalDetails.planCommentary ?? [],
    visibleText,
  );
  const consultationLimitations = selectExactTexts(
    projection.consultationLimitations,
    visibleText,
  );
  const hasSecondaryDetail =
    secondaryActions.length > 0 ||
    remainingActionRationales.length > 0 ||
    anxietyReframes.length > 0 ||
    planCommentary.length > 0 ||
    possibleInterpretations.length > 0 ||
    consultationLimitations.length > 0;

  return (
    <article className={styles.note} aria-labelledby="customer-assessment-title">
      <header className={styles.noteHeader}>
        <LunarArc tone="night" position="top-right" className={styles.headerArc} />
        <div className={styles.brand}>
          <MoonSeal size="medium" />
          <span>月の返事</span>
        </div>
        <p className={styles.documentType}>鑑定ノート</p>
        {openingLine ? <h1 id="customer-assessment-title">{openingLine}</h1> : null}
        <EditorialDivider variant="night" className={styles.headerDivider} />
        <div className={styles.currentAnswer}>
          <p>今の答え</p>
          <strong>{decisionLabels[baseProjection.decisionCode]}</strong>
        </div>
      </header>

      {openingLetter.length > 0 ? (
        <section className={`${styles.section} ${styles.letterSection}`}>
          <p className={styles.sectionKicker}>あなたへ</p>
          <h2>月の返事からの短い手紙</h2>
          <div className={styles.letterBody}>
            {openingLetter.map((paragraph, index) => (
              <p key={`${index}:${paragraph}`}>{paragraph}</p>
            ))}
          </div>
        </section>
      ) : null}

      {primaryReason || situationReading.length > 0 ? (
        <section className={styles.section}>
          <p className={styles.sectionKicker}>いま見えていること</p>
          <h2>今の状況を読み解く</h2>
          {primaryReason ? <p className={styles.situationLead}>{primaryReason}</p> : null}
          {situationReading.length > 0 ? (
            <div className={styles.observationBlock}>
              <h3>確認できていること</h3>
              <ul className={styles.plainList}>
                {situationReading.map((item, index) => (
                  <li key={`${index}:${item}`}>{item}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>
      ) : null}

      {materialUnknowns.length > 0 ? (
        <section className={`${styles.section} ${styles.unknownSection}`}>
          <p className={styles.sectionKicker}>不安を事実にしないために</p>
          <h2>まだ分からないこと</h2>
          <ul className={styles.unknownList}>
            {materialUnknowns.map((item, index) => (
              <li key={`${index}:${item}`}>{item}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {draftText ? (
        <section className={`${styles.section} ${styles.draftSection}`}>
          <p className={styles.sectionKicker}>そのまま使える文面</p>
          <h2>送信文案</h2>
          <p className={styles.draftText}>{draftText}</p>
          <CustomerDraftCopyButton key={draftText} text={draftText} />
          {draftContext ? (
            <div className={styles.draftContext}>
              <h3>この文面にした理由</h3>
              <p>{draftContext}</p>
            </div>
          ) : null}
        </section>
      ) : draftAbsenceMessage ? (
        <section className={`${styles.section} ${styles.draftAbsenceSection}`}>
          <p className={styles.sectionKicker}>送信文案</p>
          <h2>今は文面を作らない判断です</h2>
          <p className={styles.draftAbsenceText}>{draftAbsenceMessage}</p>
        </section>
      ) : null}

      {messageTemperature.length > 0 ? (
        <section className={`${styles.section} ${styles.compactSection}`}>
          <p className={styles.sectionKicker}>相手への届き方</p>
          <h2>この文面の印象</h2>
          <dl className={styles.temperatureList}>
            {messageTemperature.map((item) => (
              <div key={item.label}>
                <dt>{item.label}</dt>
                <dd>{item.text}</dd>
              </div>
            ))}
          </dl>
        </section>
      ) : null}

      {relationshipSummary ? (
        <section className={`${styles.section} ${styles.compactSection}`}>
          <p className={styles.sectionKicker}>状況の見取り図</p>
          <h2>今の関係について</h2>
          <p className={styles.relationshipText}>{relationshipSummary}</p>
        </section>
      ) : null}

      {immediateAction || actionsToAvoid.length > 0 ? (
        <section className={`${styles.section} ${styles.actionSection}`}>
          <p className={styles.sectionKicker}>いま</p>
          <h2>今の動き方</h2>
          {immediateAction ? (
            <p className={styles.actionText}>{immediateAction}</p>
          ) : null}
          {actionsToAvoid.length > 0 ? (
            <div className={styles.avoidBlock}>
              <h3>避けること</h3>
              <ul className={styles.plainList}>
                {actionsToAvoid.map((item, index) => (
                  <li key={`${index}:${item}`}>{item}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {primaryActionRationale ? (
            <div className={styles.rationaleBlock}>
              <h3>この動き方をすすめる理由</h3>
              <p>{primaryActionRationale.text}</p>
            </div>
          ) : null}
        </section>
      ) : null}

      {reassessmentWhen || reassessmentConditions.length > 0 ? (
        <section className={`${styles.section} ${styles.reassessmentSection}`}>
          <p className={styles.sectionKicker}>次に判断するために</p>
          <h2>見直す条件</h2>
          {reassessmentWhen ? (
            <p className={styles.reassessmentWhen}>{reassessmentWhen}</p>
          ) : null}
          {reassessmentConditions.length > 0 ? (
            <ol className={styles.conditionList}>
              {reassessmentConditions.map((item, index) => (
                <li key={`${index}:${item.condition}:${item.resultingDirection}`}>
                  <p>{item.condition}</p>
                  <span>その場合：{decisionLabels[item.resultingDirection]}</span>
                </li>
              ))}
            </ol>
          ) : null}
        </section>
      ) : null}

      {expandedPlan.length > 0 ? (
        <section className={`${styles.section} ${styles.compactSection}`}>
          <p className={styles.sectionKicker}>次の判断まで</p>
          <h2>これからの流れ</h2>
          <ol className={styles.planList}>
            {expandedPlan.map((item, index) => (
              <li key={`${index}:${item.phase}`}>
                <span>{phaseLabels[item.phase]}</span>
                {item.action ? <strong>{item.action}</strong> : null}
                {item.avoid ? <p>避けること：{item.avoid}</p> : null}
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {hasSecondaryDetail ? (
        <details className={styles.secondaryDetails}>
          <summary>詳しい補足を見る</summary>
          <div className={styles.secondaryBody}>
            {possibleInterpretations.length > 0 ? (
              <section>
                <h2>考えられる受け取られ方</h2>
                <ul className={styles.plainList}>
                  {possibleInterpretations.map((item, index) => (
                    <li key={`${index}:${item}`}>{item}</li>
                  ))}
                </ul>
              </section>
            ) : null}
            {secondaryActions.length > 0 ? (
              <section>
                <h2>ほかにできること</h2>
                <ul className={styles.plainList}>
                  {secondaryActions.map((item, index) => (
                    <li key={`${index}:${item}`}>{item}</li>
                  ))}
                </ul>
              </section>
            ) : null}
            {remainingActionRationales.length > 0 ? (
              <section>
                <h2>動き方についての補足</h2>
                {remainingActionRationales.map((paragraph, index) => (
                  <p key={`${index}:${paragraph}`}>{paragraph}</p>
                ))}
              </section>
            ) : null}
            {anxietyReframes.length > 0 ? (
              <section>
                <h2>不安を見直すヒント</h2>
                {anxietyReframes.map((paragraph, index) => (
                  <p key={`${index}:${paragraph}`}>{paragraph}</p>
                ))}
              </section>
            ) : null}
            {planCommentary.length > 0 ? (
              <section>
                <h2>行動計画の補足</h2>
                {planCommentary.map((paragraph, index) => (
                  <p key={`${index}:${paragraph}`}>{paragraph}</p>
                ))}
              </section>
            ) : null}
            {consultationLimitations.length > 0 ? (
              <section>
                <h2>この鑑定で扱える範囲</h2>
                {consultationLimitations.map((paragraph, index) => (
                  <p key={`${index}:${paragraph}`}>{paragraph}</p>
                ))}
              </section>
            ) : null}
          </div>
        </details>
      ) : null}

      {closingLines.length > 0 ? (
        <section className={`${styles.section} ${styles.closingSection}`}>
          <p className={styles.sectionKicker}>あなたのペースに戻るために</p>
          <h2>月の返事から最後に</h2>
          <div className={styles.closingBody}>
            {closingLines.map((paragraph, index) => (
              <p key={`${index}:${paragraph}`}>{paragraph}</p>
            ))}
          </div>
        </section>
      ) : null}

      {fixedLimitation ? (
        <footer className={styles.fixedLimitation}>
          <p>{fixedLimitation}</p>
        </footer>
      ) : null}
    </article>
  );
}
