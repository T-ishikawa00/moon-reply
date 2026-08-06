import { EditorialDivider } from "@/components/brand/EditorialDivider";
import { LunarArc } from "@/components/brand/LunarArc";
import { MoonSeal } from "@/components/brand/MoonSeal";
import { CustomerDraftCopyButton } from "@/components/runtime/CustomerDraftCopyButton";
import type { CustomerAssessmentProjectionV1 } from "@/lib/assessment/runtime/customer-assessment-projection-v1";
import styles from "./CustomerAssessmentNote.module.css";

type DecisionCode = CustomerAssessmentProjectionV1["decisionCode"];
type PlanPhase = NonNullable<
  CustomerAssessmentProjectionV1["optionalDetails"]["expandedPlan"]
>[number]["phase"];

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

function uniqueStrings(values: Array<string | null | undefined>) {
  const seen = new Set<string>();
  const selected: string[] = [];
  for (const value of values) {
    if (!value || seen.has(value)) continue;
    seen.add(value);
    selected.push(value);
  }
  return selected;
}

function takeSecondary(values: readonly string[], seen: Set<string>) {
  const selected: string[] = [];
  for (const value of values) {
    if (seen.has(value)) continue;
    seen.add(value);
    selected.push(value);
  }
  return selected;
}

type Props = {
  projection: CustomerAssessmentProjectionV1;
};

export function CustomerAssessmentNote({ projection }: Props) {
  const requestedTopics = projection.requestedTopics;
  const shortLetters = projection.optionalDetails.shortLetter ?? [];
  const anxietyReframes = projection.optionalDetails.anxietyReframe ?? [];
  const expandedPlan = projection.optionalDetails.expandedPlan ?? [];
  const emotionPrimary = uniqueStrings([shortLetters[0], anxietyReframes[0]]);
  const draftAbsenceMessage =
    projection.finalDraft === null && requestedTopics.includes("draft_message")
      ? nullDraftMessages[projection.decisionCode] ?? null
      : null;

  const primaryContent = new Set(
    uniqueStrings([
      projection.primaryReason,
      projection.finalDraft?.text,
      projection.immediateAction.action,
      ...projection.immediateAction.avoid,
      projection.reassessment.when,
      ...projection.reassessment.conditions.map((item) => item.condition),
      projection.relationshipSummary,
      projection.messageTemperature?.softness,
      projection.messageTemperature?.affection,
      projection.messageTemperature?.pressure,
      projection.messageTemperature?.adjustment,
      ...emotionPrimary,
      ...expandedPlan.flatMap((item) => [item.action, item.avoid]),
    ]),
  );
  const secondarySeen = new Set(primaryContent);
  const secondaryActions = takeSecondary(
    projection.immediateAction.secondaryActions,
    secondarySeen,
  );
  const remainingShortLetters = takeSecondary(shortLetters.slice(1), secondarySeen);
  const remainingAnxietyReframes = takeSecondary(
    anxietyReframes.slice(1),
    secondarySeen,
  );
  const interpretations = takeSecondary(
    projection.optionalDetails.interpretations ?? [],
    secondarySeen,
  );
  const planCommentary = takeSecondary(
    projection.optionalDetails.planCommentary ?? [],
    secondarySeen,
  );
  const hasSecondaryDetail =
    secondaryActions.length > 0 ||
    remainingShortLetters.length > 0 ||
    remainingAnxietyReframes.length > 0 ||
    interpretations.length > 0 ||
    planCommentary.length > 0;

  return (
    <article className={styles.note} aria-labelledby="customer-assessment-title">
      <header className={styles.noteHeader}>
        <LunarArc tone="night" position="top-right" className={styles.headerArc} />
        <div className={styles.brand}>
          <MoonSeal size="medium" />
          <span>月の返事</span>
        </div>
        <p className={styles.documentType}>顧客向け 鑑定ノート</p>
        <p className={styles.sectionKicker}>今の結論</p>
        <h1 id="customer-assessment-title">
          {decisionLabels[projection.decisionCode]}
        </h1>
        <EditorialDivider variant="night" className={styles.headerDivider} />
        <div className={styles.reasonBlock}>
          <p className={styles.reasonLabel}>そう判断する理由</p>
          <p className={styles.primaryReason}>{projection.primaryReason}</p>
        </div>
      </header>

      {projection.finalDraft ? (
        <section className={`${styles.section} ${styles.draftSection}`}>
          <p className={styles.sectionKicker}>そのまま使える文面</p>
          <h2>送信文案</h2>
          <p className={styles.draftText}>{projection.finalDraft.text}</p>
          <CustomerDraftCopyButton
            key={projection.finalDraft.text}
            text={projection.finalDraft.text}
          />
        </section>
      ) : draftAbsenceMessage ? (
        <section className={`${styles.section} ${styles.draftAbsenceSection}`}>
          <p className={styles.sectionKicker}>送信文案</p>
          <h2>今は文面を作らない判断です</h2>
          <p className={styles.draftAbsenceText}>{draftAbsenceMessage}</p>
        </section>
      ) : null}

      <section className={styles.section}>
        <p className={styles.sectionKicker}>今すぐ行うこと</p>
        <h2>まず、この一つから</h2>
        <p className={styles.actionText}>{projection.immediateAction.action}</p>
        {projection.immediateAction.avoid.length > 0 ? (
          <div className={styles.avoidBlock}>
            <h3>避けること</h3>
            <ul className={styles.plainList}>
              {projection.immediateAction.avoid.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>

      <section className={`${styles.section} ${styles.reassessmentSection}`}>
        <p className={styles.sectionKicker}>何が起きたら見直すか</p>
        <h2>見直しの目安</h2>
        <p className={styles.reassessmentWhen}>{projection.reassessment.when}</p>
        {projection.reassessment.conditions.length > 0 ? (
          <ol className={styles.conditionList}>
            {projection.reassessment.conditions.map((item, index) => (
              <li key={`${index}:${item.condition}:${item.resultingDirection}`}>
                <p>{item.condition}</p>
                <span>
                  その場合：{decisionLabels[item.resultingDirection]}
                </span>
              </li>
            ))}
          </ol>
        ) : null}
      </section>

      {requestedTopics.includes("organize_emotions") && emotionPrimary.length > 0 ? (
        <section className={`${styles.section} ${styles.compactSection}`}>
          <p className={styles.sectionKicker}>心を急がせないために</p>
          <h2>気持ちを整理するために</h2>
          <div className={styles.supportText}>
            {emotionPrimary.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </section>
      ) : null}

      {requestedTopics.includes("message_impact") && projection.messageTemperature ? (
        <section className={`${styles.section} ${styles.compactSection}`}>
          <p className={styles.sectionKicker}>相手への届き方</p>
          <h2>この文面の印象</h2>
          <dl className={styles.temperatureList}>
            <div>
              <dt>柔らかさ</dt>
              <dd>{projection.messageTemperature.softness}</dd>
            </div>
            <div>
              <dt>好意の強さ</dt>
              <dd>{projection.messageTemperature.affection}</dd>
            </div>
            <div>
              <dt>返信への圧力</dt>
              <dd>{projection.messageTemperature.pressure}</dd>
            </div>
            <div>
              <dt>調整した点</dt>
              <dd>{projection.messageTemperature.adjustment}</dd>
            </div>
          </dl>
        </section>
      ) : null}

      {requestedTopics.includes("relationship") && projection.relationshipSummary ? (
        <section className={`${styles.section} ${styles.compactSection}`}>
          <p className={styles.sectionKicker}>状況の見取り図</p>
          <h2>今の関係について</h2>
          <p className={styles.relationshipText}>{projection.relationshipSummary}</p>
        </section>
      ) : null}

      {requestedTopics.includes("next_three_days") && expandedPlan.length > 0 ? (
        <section className={`${styles.section} ${styles.compactSection}`}>
          <p className={styles.sectionKicker}>次の判断まで</p>
          <h2>これからの流れ</h2>
          <ol className={styles.planList}>
            {expandedPlan.map((item, index) => (
              <li key={`${index}:${item.phase}:${item.action}`}>
                <span>{phaseLabels[item.phase]}</span>
                <strong>{item.action}</strong>
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
            {secondaryActions.length > 0 ? (
              <section>
                <h2>ほかにできること</h2>
                <ul className={styles.plainList}>
                  {secondaryActions.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </section>
            ) : null}
            {remainingShortLetters.length > 0 ? (
              <section>
                <h2>気持ちへの補足</h2>
                {remainingShortLetters.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </section>
            ) : null}
            {remainingAnxietyReframes.length > 0 ? (
              <section>
                <h2>不安を見直すヒント</h2>
                {remainingAnxietyReframes.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </section>
            ) : null}
            {interpretations.length > 0 ? (
              <section>
                <h2>考えられる受け取られ方</h2>
                <ul className={styles.plainList}>
                  {interpretations.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </section>
            ) : null}
            {planCommentary.length > 0 ? (
              <section>
                <h2>行動計画の補足</h2>
                {planCommentary.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </section>
            ) : null}
          </div>
        </details>
      ) : null}
    </article>
  );
}
