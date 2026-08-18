import { EditorialDivider } from "@/components/brand/EditorialDivider";
import { LunarArc } from "@/components/brand/LunarArc";
import { MoonSeal } from "@/components/brand/MoonSeal";
import { CustomerDraftCopyButton } from "@/components/runtime/CustomerDraftCopyButton";
import type { CustomerAssessmentExperienceProjectionV2 } from "@/lib/assessment/runtime/customer-assessment-experience-projection-v2";
import styles from "./CustomerAssessmentNote.module.css";

type DecisionCode =
  CustomerAssessmentExperienceProjectionV2["baseProjection"]["decisionCode"];
type PlanPhase = NonNullable<
  CustomerAssessmentExperienceProjectionV2["baseProjection"]["optionalDetails"]["expandedPlan"]
>[number]["phase"];

const decisionLabels: Record<DecisionCode, string> = {
  reply_now: "今、返信する",
  send_now: "今、送る",
  wait_and_reassess: "今は送らず、次の材料を待つ",
  pause_additional_contact: "追加の連絡を止める",
};

const futureDecisionLabels: Record<DecisionCode, string> = {
  reply_now: "その時点で返信する方向を検討する",
  send_now: "その時点で送る方向を検討する",
  wait_and_reassess: "その時点で状況を見直す",
  pause_additional_contact: "その時点でも追加の連絡は止める",
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

function takeDistinct(value: string, seen: Set<string>) {
  const key = normalizedExactKey(value);
  if (seen.has(key)) return null;
  seen.add(key);
  return value;
}

function takeDistinctList(values: readonly string[], seen: Set<string>) {
  const selected: string[] = [];
  for (const value of values) {
    const distinct = takeDistinct(value, seen);
    if (distinct !== null) selected.push(distinct);
  }
  return selected;
}

type Props = {
  projection: CustomerAssessmentExperienceProjectionV2;
};

export function CustomerAssessmentNote({ projection }: Props) {
  const baseProjection = projection.baseProjection;
  const requestedTopics = baseProjection.requestedTopics;
  const draftText = baseProjection.finalDraft?.text ?? null;

  const visibleText = new Set<string>([
    normalizedExactKey(projection.openingLine),
    normalizedExactKey(baseProjection.fixedLimitation),
  ]);
  if (draftText !== null) {
    visibleText.add(normalizedExactKey(draftText));
  }

  const immediateAction = takeDistinct(
    baseProjection.immediateAction.action,
    visibleText,
  );
  const avoidGuidance = takeDistinctList(
    baseProjection.immediateAction.avoid,
    visibleText,
  );
  const reassessmentWhen = takeDistinct(
    baseProjection.reassessment.when,
    visibleText,
  );
  const reassessmentConditions = baseProjection.reassessment.conditions.flatMap(
    (item) => {
      const condition = takeDistinct(item.condition, visibleText);
      return condition === null ? [] : [{ ...item, condition }];
    },
  );

  const openingLetter = takeDistinctList(projection.openingLetter, visibleText);
  const primaryReason = takeDistinct(
    baseProjection.primaryReason,
    visibleText,
  );
  const situationReading = takeDistinctList(
    projection.situationReading,
    visibleText,
  );
  const materialUnknowns = takeDistinctList(
    projection.materialUnknowns,
    visibleText,
  );
  const draftContext =
    projection.draftContext === null
      ? null
      : takeDistinct(projection.draftContext, visibleText);

  const messageTemperature =
    requestedTopics.includes("message_impact") &&
    baseProjection.messageTemperature !== null
      ? {
          softness: takeDistinct(
            baseProjection.messageTemperature.softness,
            visibleText,
          ),
          affection: takeDistinct(
            baseProjection.messageTemperature.affection,
            visibleText,
          ),
          pressure: takeDistinct(
            baseProjection.messageTemperature.pressure,
            visibleText,
          ),
          adjustment: takeDistinct(
            baseProjection.messageTemperature.adjustment,
            visibleText,
          ),
        }
      : null;
  const hasMessageTemperature =
    messageTemperature !== null &&
    Object.values(messageTemperature).some((value) => value !== null);

  const relationshipSummary =
    requestedTopics.includes("relationship") &&
    baseProjection.relationshipSummary !== null
      ? takeDistinct(baseProjection.relationshipSummary, visibleText)
      : null;

  const actionRationales = takeDistinctList(
    projection.actionRationales,
    visibleText,
  );
  const primaryActionRationale = actionRationales[0] ?? null;
  const remainingActionRationales = actionRationales.slice(1);

  const expandedPlan = requestedTopics.includes("next_three_days")
    ? (baseProjection.optionalDetails.expandedPlan ?? [])
        .map((item) => ({
          ...item,
          action: takeDistinct(item.action, visibleText),
          avoid:
            item.avoid === null ? null : takeDistinct(item.avoid, visibleText),
        }))
        .filter((item) => item.action !== null || item.avoid !== null)
    : [];

  const possibleInterpretations = takeDistinctList(
    projection.possibleInterpretations,
    visibleText,
  );
  const secondaryActions = takeDistinctList(
    baseProjection.immediateAction.secondaryActions,
    visibleText,
  );
  const anxietyReframes = takeDistinctList(
    baseProjection.optionalDetails.anxietyReframe ?? [],
    visibleText,
  );
  const planCommentary = takeDistinctList(
    baseProjection.optionalDetails.planCommentary ?? [],
    visibleText,
  );
  const consultationLimitations = takeDistinctList(
    projection.consultationLimitations,
    visibleText,
  );
  const closingLines = takeDistinctList(projection.closingLines, visibleText);

  const hasReading =
    primaryReason !== null ||
    situationReading.length > 0 ||
    materialUnknowns.length > 0;
  const hasAction =
    immediateAction !== null ||
    avoidGuidance.length > 0 ||
    primaryActionRationale !== null ||
    reassessmentWhen !== null ||
    reassessmentConditions.length > 0;
  const hasSecondaryDetail =
    possibleInterpretations.length > 0 ||
    secondaryActions.length > 0 ||
    remainingActionRationales.length > 0 ||
    anxietyReframes.length > 0 ||
    planCommentary.length > 0 ||
    consultationLimitations.length > 0;

  return (
    <article className={styles.note} aria-labelledby="customer-assessment-title">
      <header className={styles.noteHeader}>
        <LunarArc tone="night" position="top-right" className={styles.headerArc} />
        <div className={styles.brand}>
          <MoonSeal size="medium" />
          <span>月の返事</span>
        </div>
        <p className={styles.documentType}>恋のメッセージ鑑定ノート</p>
        <p className={styles.sectionKicker}>この相談への返事</p>
        <h1 id="customer-assessment-title">{projection.openingLine}</h1>
        <EditorialDivider variant="night" className={styles.headerDivider} />
        <div className={styles.currentAnswer}>
          <p>今の答え</p>
          <strong>{decisionLabels[baseProjection.decisionCode]}</strong>
        </div>
      </header>

      {openingLetter.length > 0 ? (
        <section className={[styles.section, styles.letterSection].join(" ")}>
          <p className={styles.sectionKicker}>はじめに</p>
          <h2>月の返事からの短い手紙</h2>
          <div className={styles.letterBody}>
            {openingLetter.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </section>
      ) : null}

      {hasReading ? (
        <section className={styles.section}>
          <p className={styles.sectionKicker}>状況の整理</p>
          <h2>今の状況を読み解く</h2>
          {primaryReason !== null ? (
            <p className={styles.situationLead}>{primaryReason}</p>
          ) : null}
          {situationReading.length > 0 ? (
            <div className={styles.readingGroup}>
              <h3>確かに言えること</h3>
              <ul className={styles.plainList}>
                {situationReading.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {materialUnknowns.length > 0 ? (
            <div className={[styles.readingGroup, styles.unknownBlock].join(" ")}>
              <h3>まだ分からないこと</h3>
              <ul className={styles.unknownList}>
                {materialUnknowns.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>
      ) : null}

      {draftText !== null ? (
        <section className={[styles.section, styles.draftSection].join(" ")}>
          <p className={styles.sectionKicker}>そのまま使える文面</p>
          <h2>送信文案</h2>
          <p className={styles.draftText}>{draftText}</p>
          <CustomerDraftCopyButton key={draftText} text={draftText} />
          {draftContext !== null ? (
            <div className={styles.draftContext}>
              <h3>この文面にした理由</h3>
              <p>{draftContext}</p>
            </div>
          ) : null}
        </section>
      ) : null}

      {hasMessageTemperature && messageTemperature !== null ? (
        <section className={[styles.section, styles.compactSection].join(" ")}>
          <p className={styles.sectionKicker}>文面の温度</p>
          <h2>この文面がどう届くか</h2>
          <dl className={styles.temperatureList}>
            {messageTemperature.softness !== null ? (
              <div>
                <dt>柔らかさ</dt>
                <dd>{messageTemperature.softness}</dd>
              </div>
            ) : null}
            {messageTemperature.affection !== null ? (
              <div>
                <dt>好意の強さ</dt>
                <dd>{messageTemperature.affection}</dd>
              </div>
            ) : null}
            {messageTemperature.pressure !== null ? (
              <div>
                <dt>返信への圧力</dt>
                <dd>{messageTemperature.pressure}</dd>
              </div>
            ) : null}
            {messageTemperature.adjustment !== null ? (
              <div>
                <dt>調整した点</dt>
                <dd>{messageTemperature.adjustment}</dd>
              </div>
            ) : null}
          </dl>
        </section>
      ) : null}

      {relationshipSummary !== null ? (
        <section className={[styles.section, styles.compactSection].join(" ")}>
          <p className={styles.sectionKicker}>状況の見取り図</p>
          <h2>今の関係について</h2>
          <p className={styles.relationshipText}>{relationshipSummary}</p>
        </section>
      ) : null}

      {hasAction ? (
        <section className={[styles.section, styles.actionSection].join(" ")}>
          <p className={styles.sectionKicker}>次の一歩</p>
          <h2>今の動き方</h2>
          {immediateAction !== null ? (
            <p className={styles.actionText}>{immediateAction}</p>
          ) : null}
          {avoidGuidance.length > 0 ? (
            <div className={styles.avoidBlock}>
              <h3>避けること</h3>
              <ul className={styles.plainList}>
                {avoidGuidance.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {primaryActionRationale !== null ? (
            <div className={styles.rationaleBlock}>
              <h3>この動き方をすすめる理由</h3>
              <p>{primaryActionRationale}</p>
            </div>
          ) : null}
          {reassessmentWhen !== null || reassessmentConditions.length > 0 ? (
            <div className={styles.reassessmentBlock}>
              <h3>見直す条件</h3>
              {reassessmentWhen !== null ? (
                <p className={styles.reassessmentWhen}>{reassessmentWhen}</p>
              ) : null}
              {reassessmentConditions.length > 0 ? (
                <ol className={styles.conditionList}>
                  {reassessmentConditions.map((item, index) => (
                    <li
                      key={[
                        index,
                        item.condition,
                        item.resultingDirection,
                      ].join(":")}
                    >
                      <p>{item.condition}</p>
                      <span>
                        その場合：{futureDecisionLabels[item.resultingDirection]}
                      </span>
                    </li>
                  ))}
                </ol>
              ) : null}
            </div>
          ) : null}
        </section>
      ) : null}

      {expandedPlan.length > 0 ? (
        <section className={[styles.section, styles.compactSection].join(" ")}>
          <p className={styles.sectionKicker}>次の判断まで</p>
          <h2>これからの流れ</h2>
          <ol className={styles.planList}>
            {expandedPlan.map((item, index) => (
              <li key={[index, item.phase, item.action].join(":")}>
                <span>{phaseLabels[item.phase]}</span>
                {item.action !== null ? <strong>{item.action}</strong> : null}
                {item.avoid !== null ? <p>避けること：{item.avoid}</p> : null}
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
              <div className={styles.secondaryGroup}>
                <h2>可能性として見ていること</h2>
                <ul className={styles.plainList}>
                  {possibleInterpretations.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {secondaryActions.length > 0 ? (
              <div className={styles.secondaryGroup}>
                <h2>ほかにできること</h2>
                <ul className={styles.plainList}>
                  {secondaryActions.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {remainingActionRationales.length > 0 ? (
              <div className={styles.secondaryGroup}>
                <h2>この動き方について</h2>
                {remainingActionRationales.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            ) : null}
            {anxietyReframes.length > 0 ? (
              <div className={styles.secondaryGroup}>
                <h2>不安を見直すヒント</h2>
                {anxietyReframes.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            ) : null}
            {planCommentary.length > 0 ? (
              <div className={styles.secondaryGroup}>
                <h2>行動計画の補足</h2>
                {planCommentary.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            ) : null}
            {consultationLimitations.length > 0 ? (
              <div className={styles.secondaryGroup}>
                <h2>この鑑定で確認できないこと</h2>
                {consultationLimitations.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            ) : null}
          </div>
        </details>
      ) : null}

      {closingLines.length > 0 ? (
        <section className={[styles.section, styles.closingSection].join(" ")}>
          <p className={styles.sectionKicker}>結びに</p>
          <h2>月の返事から最後に</h2>
          <div className={styles.closingBody}>
            {closingLines.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </section>
      ) : null}

      <footer className={styles.fixedLimitation}>
        <p>{baseProjection.fixedLimitation}</p>
      </footer>
    </article>
  );
}
