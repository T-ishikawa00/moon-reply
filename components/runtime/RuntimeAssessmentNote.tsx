import {
  ArtifactAnswer,
  ArtifactClosing,
  ArtifactComparison,
  ArtifactCover,
  ArtifactLetter,
  ArtifactLimitation,
  ArtifactMessageDraft,
  ArtifactSectionLabel,
  ArtifactShell,
  ArtifactTimeline,
} from "@/components/artifact";
import { EditorialDivider } from "@/components/brand/EditorialDivider";
import { LunarArc } from "@/components/brand/LunarArc";
import { MoonSeal } from "@/components/brand/MoonSeal";
import type {
  CompletedAssessment,
  RequestedTopic,
} from "@/lib/assessment/runtime/types";

const decisionLabels = {
  reply_now: "今、返信する",
  send_now: "今、送る",
  wait_and_reassess: "今夜は待って、見直す",
  pause_additional_contact: "追加の連絡を止める",
} as const;

const requestedTopicNavigation: Record<
  RequestedTopic,
  { label: string; sectionId: string }
> = {
  decide_send_or_wait: {
    label: "送るか待つか決めたい",
    sectionId: "tonight-action",
  },
  draft_message: {
    label: "送る文章を整えたい",
    sectionId: "message-draft",
  },
  message_impact: {
    label: "この文面がどう届くか知りたい",
    sectionId: "message-reading",
  },
  relationship: {
    label: "相手との関係を整理したい",
    sectionId: "decision-reason",
  },
  next_three_days: {
    label: "これから3日どう動くか知りたい",
    sectionId: "three-day-plan",
  },
  organize_emotions: {
    label: "不安を整理したい",
    sectionId: "short-letter",
  },
};

const threeDayLabels = {
  tonight: "今夜",
  next_day: "明日",
  day_three: "3日目",
} as const;

export function RuntimeAssessmentNote({
  assessment,
  requestedTopics,
}: {
  assessment: CompletedAssessment;
  requestedTopics: RequestedTopic[];
}) {
  const { content, decisionPlan, fixedLimitation } = assessment.report;
  const selectedFactIds = new Set(decisionPlan.decision_reason_fact_ids);
  const decisionFacts = content.observed_fact_commentary.filter((item) =>
    selectedFactIds.has(item.fact_id),
  );
  const draftRequested = requestedTopics.includes("draft_message");
  const draftAbsenceExplanation =
    draftRequested && decisionPlan.selected_decision === "wait_and_reassess"
      ? "今夜は送信を急がない判断のため、今すぐ送る文面は提示していません。"
      : draftRequested &&
          decisionPlan.selected_decision === "pause_additional_contact"
        ? "追加連絡を止める判断のため、送信用の文面は提示していません。"
        : null;
  const threeDayPlanAligned =
    decisionPlan.three_day_plan.length ===
    content.three_day_plan_commentary.length;

  return (
    <div className="runtime-result" aria-live="polite">
      <div className="reading-note-stage">
        <ArtifactShell as="article" className="reading-note paper-grain">
          <ArtifactCover as="header" className="reading-note-cover">
            <LunarArc tone="night" position="top-right" />
            <div className="reading-note-cover__brand">
              <MoonSeal size="medium" />
              <span>月の返事</span>
            </div>
            <p className="reading-note-cover__type">内部テスト用 鑑定ノート</p>
            <h1>入力された状況から、今夜の方針を整理しました。</h1>
            <EditorialDivider variant="night" />
            <p className="reading-note-cover__line">{content.cover_line}</p>
            <ArtifactAnswer className="reading-note-cover__answer">
              <ArtifactSectionLabel>今夜の答え</ArtifactSectionLabel>
              <strong>{decisionLabels[decisionPlan.selected_decision]}</strong>
            </ArtifactAnswer>
            <nav
              className="reading-note-intent-nav"
              aria-labelledby="reading-note-intent-nav-title"
            >
              <p id="reading-note-intent-nav-title">
                このノートでお答えすること
              </p>
              <ul>
                {requestedTopics.map((topic) => {
                  const navigation = requestedTopicNavigation[topic];
                  return (
                    <li key={topic}>
                      <a href={`#${navigation.sectionId}`}>
                        {navigation.label}
                      </a>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </ArtifactCover>

          <section id="tonight-action" className="reading-note-section">
            <div className="reading-note-section__heading">
              <ArtifactSectionLabel aria-hidden="true">02</ArtifactSectionLabel>
              <h2>今夜はこう動いてください</h2>
            </div>
            <div className="reading-note-section__body">
              {decisionPlan.message_draft ? (
                <section id="message-draft" className="reading-note-draft">
                  <h3>そのまま使える返信案</h3>
                  <ArtifactMessageDraft as="blockquote" className="message-letter">
                    <p>{decisionPlan.message_draft.text}</p>
                  </ArtifactMessageDraft>
                  {content.message_draft_context ? (
                    <div className="reading-note-support-block reading-note-draft__context">
                      <h4>この文面に整えた理由</h4>
                      <p>{content.message_draft_context}</p>
                    </div>
                  ) : null}
                </section>
              ) : draftAbsenceExplanation ? (
                <section id="message-draft" className="reading-note-draft">
                  <h3>そのまま使える返信案</h3>
                  <p className="reading-note-draft__absence">
                    {draftAbsenceExplanation}
                  </p>
                </section>
              ) : null}

              <ArtifactComparison className="action-columns reading-note-actions">
                <section>
                  <h3>今夜やること</h3>
                  <ul className="reading-note-list">
                    {decisionPlan.actions_to_take.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </section>
                <section>
                  <h3>今夜やらないこと</h3>
                  <ul className="reading-note-list">
                    {decisionPlan.actions_to_avoid.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </section>
              </ArtifactComparison>

              <div className="reading-note-support-block reading-note-action-rationales">
                <h3>この動き方をすすめる理由</h3>
                <ul className="reading-note-list">
                  {content.action_rationales.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          <section id="short-letter" className="reading-note-section">
            <div className="reading-note-section__heading">
              <ArtifactSectionLabel aria-hidden="true">03</ArtifactSectionLabel>
              <h2>月の返事からの短い手紙</h2>
            </div>
            <div className="reading-note-section__body">
              <ArtifactLetter className="reading-note-letter__body">
                {content.short_letter.map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </ArtifactLetter>
              <aside className="reading-note-anxiety-reframe">
                <h3>不安を少しほどくために</h3>
                {content.anxiety_reframe.map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </aside>
            </div>
          </section>

          <section id="decision-reason" className="reading-note-section">
            <div className="reading-note-section__heading">
              <ArtifactSectionLabel aria-hidden="true">04</ArtifactSectionLabel>
              <h2>そう判断した理由</h2>
            </div>
            <div className="reading-note-section__body">
              <p className="reading-note-decision-summary">
                {content.decision_reason_summary}
              </p>
              <p>{content.relationship_summary}</p>
              {decisionFacts.length > 0 ? (
                <div className="reading-note-facts">
                  <h3>判断に使った事実</h3>
                  <ul className="reading-note-list">
                    {decisionFacts.map((item) => (
                      <li key={item.fact_id}>{item.commentary}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          </section>

          <section id="message-reading" className="reading-note-section">
            <div className="reading-note-section__heading">
              <ArtifactSectionLabel aria-hidden="true">05</ArtifactSectionLabel>
              <h2>文面から読み取れること</h2>
            </div>
            <div className="reading-note-section__body">
              <dl className="message-temperature__notes">
                <div><dt>柔らかさ</dt><dd>{content.message_temperature.softness}</dd></div>
                <div><dt>好意</dt><dd>{content.message_temperature.affection}</dd></div>
                <div><dt>圧力</dt><dd>{content.message_temperature.pressure}</dd></div>
                <div><dt>調整点</dt><dd>{content.message_temperature.adjustment}</dd></div>
              </dl>
              <div className="reading-note-interpretations">
                <h3>考えられる読み方</h3>
                <ol className="possibility-list">
                  {content.possible_interpretations.map((item, index) => (
                    <li key={item}>
                      <span>0{index + 1}</span>
                      <p>{item}</p>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </section>

          <section id="three-day-plan" className="reading-note-section">
            <div className="reading-note-section__heading">
              <ArtifactSectionLabel aria-hidden="true">06</ArtifactSectionLabel>
              <h2>今夜から3日間の動き方</h2>
            </div>
            <div className="reading-note-section__body">
              {!threeDayPlanAligned ? (
                <p className="reading-note-data-note" role="status">
                  3日間の計画と補足の件数が一致していません。対応できる内容だけを日ごとに表示します。
                </p>
              ) : null}
              <ArtifactTimeline as="ol" className="lunar-plan">
                {decisionPlan.three_day_plan.map((item, index) => (
                  <li key={item.day}>
                    <span
                      className={`lunar-plan__moon lunar-plan__moon--${index + 1}`}
                      aria-hidden="true"
                    />
                    <strong>{threeDayLabels[item.day]}</strong>
                    <p>{item.action}</p>
                    <p className="lunar-plan__avoid">
                      <span>避けること</span>
                      {item.avoid}
                    </p>
                    {content.three_day_plan_commentary[index] ? (
                      <p className="lunar-plan__commentary">
                        {content.three_day_plan_commentary[index]}
                      </p>
                    ) : (
                      <p className="lunar-plan__commentary lunar-plan__commentary--missing">
                        この日の補足を表示できません。
                      </p>
                    )}
                  </li>
                ))}
              </ArtifactTimeline>
            </div>
          </section>

          <section id="change-conditions" className="reading-note-section">
            <div className="reading-note-section__heading">
              <ArtifactSectionLabel aria-hidden="true">07</ArtifactSectionLabel>
              <h2>判断を変えるとき</h2>
            </div>
            <div className="reading-note-section__body">
              <p>
                今の結論は、現時点で確認できる情報をもとにしています。次の条件が確認された場合は、その時点で方向を見直します。
              </p>
              <ul className="reading-note-list reading-note-change-conditions">
                {content.change_condition_commentary.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </section>

          <ArtifactClosing
            id="closing"
            as="section"
            className="reading-note-closing"
            aria-labelledby="runtime-closing-title"
          >
            <div className="reading-note-section__heading">
              <ArtifactSectionLabel aria-hidden="true">08</ArtifactSectionLabel>
              <h2 id="runtime-closing-title">月の返事からの締め</h2>
            </div>
            <div className="reading-note-section__body">
              <div className="reading-note-closing__letter">
                {content.closing_lines.map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </div>
              <p className="reading-note-closing__timing">
                <strong>次に判断する条件：</strong>
                {decisionPlan.review_timing.when}
              </p>
              <ArtifactLimitation
                as="aside"
                className="reading-note-fixed-caution"
              >
                {fixedLimitation}
              </ArtifactLimitation>
            </div>
          </ArtifactClosing>
        </ArtifactShell>
      </div>
    </div>
  );
}
