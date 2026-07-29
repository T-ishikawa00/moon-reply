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
import type { CompletedAssessment } from "@/lib/assessment/runtime/types";

const decisionLabels = {
  reply_now: "今、返信する",
  send_now: "今、送る",
  wait_and_reassess: "今夜は待って、見直す",
  pause_additional_contact: "追加の連絡を止める",
} as const;

export function RuntimeAssessmentNote({
  assessment,
}: {
  assessment: CompletedAssessment;
}) {
  const { content, decisionPlan, fixedLimitation } = assessment.report;

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
          </ArtifactCover>

          <section className="reading-note-section">
            <div className="reading-note-section__heading">
              <ArtifactSectionLabel aria-hidden="true">02</ArtifactSectionLabel>
              <h2>月の返事からの短い手紙</h2>
            </div>
            <div className="reading-note-section__body">
              <ArtifactLetter className="reading-note-letter__body">
                {content.short_letter.map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </ArtifactLetter>
            </div>
          </section>

          <section className="reading-note-section reading-note-answer-section">
            <div className="reading-note-section__heading">
              <ArtifactSectionLabel aria-hidden="true">03</ArtifactSectionLabel>
              <h2>今夜の答え</h2>
            </div>
            <div className="reading-note-section__body">
              <ArtifactAnswer className="reading-note-answer">
                <p className="reading-note-answer__label">結論</p>
                <p className="reading-note-answer__judgment">
                  {decisionLabels[decisionPlan.selected_decision]}
                </p>
                <p className="reading-note-answer__reason">
                  {content.decision_reason_summary}
                </p>
              </ArtifactAnswer>
            </div>
          </section>

          <section className="reading-note-section">
            <div className="reading-note-section__heading">
              <ArtifactSectionLabel aria-hidden="true">04</ArtifactSectionLabel>
              <h2>確認できることと、可能性</h2>
            </div>
            <div className="reading-note-section__body">
              <p>{content.relationship_summary}</p>
              <ol className="possibility-list">
                {content.possible_interpretations.map((item, index) => (
                  <li key={item}>
                    <span>0{index + 1}</span>
                    <p>{item}</p>
                  </li>
                ))}
              </ol>
            </div>
          </section>

          <section className="reading-note-section">
            <div className="reading-note-section__heading">
              <ArtifactSectionLabel aria-hidden="true">05</ArtifactSectionLabel>
              <h2>文面の温度</h2>
            </div>
            <div className="reading-note-section__body">
              <dl className="message-temperature__notes">
                <div><dt>柔らかさ</dt><dd>{content.message_temperature.softness}</dd></div>
                <div><dt>好意</dt><dd>{content.message_temperature.affection}</dd></div>
                <div><dt>圧力</dt><dd>{content.message_temperature.pressure}</dd></div>
                <div><dt>調整点</dt><dd>{content.message_temperature.adjustment}</dd></div>
              </dl>
            </div>
          </section>

          <section className="reading-note-section">
            <div className="reading-note-section__heading">
              <ArtifactSectionLabel aria-hidden="true">06</ArtifactSectionLabel>
              <h2>今夜の行動</h2>
            </div>
            <div className="reading-note-section__body">
              <ArtifactComparison className="action-columns">
                <section>
                  <h3>やること</h3>
                  <ul className="reading-note-list">
                    {decisionPlan.actions_to_take.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </section>
                <section>
                  <h3>やらないこと</h3>
                  <ul className="reading-note-list">
                    {decisionPlan.actions_to_avoid.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </section>
              </ArtifactComparison>
              {decisionPlan.message_draft ? (
                <ArtifactMessageDraft as="blockquote" className="message-letter">
                  <p>{decisionPlan.message_draft.text}</p>
                </ArtifactMessageDraft>
              ) : null}
            </div>
          </section>

          <section className="reading-note-section">
            <div className="reading-note-section__heading">
              <ArtifactSectionLabel aria-hidden="true">07</ArtifactSectionLabel>
              <h2>3日間の月明かりプラン</h2>
            </div>
            <div className="reading-note-section__body">
              <ArtifactTimeline as="ol" className="lunar-plan">
                {decisionPlan.three_day_plan.map((item, index) => (
                  <li key={item.day}>
                    <span
                      className={`lunar-plan__moon lunar-plan__moon--${index + 1}`}
                      aria-hidden="true"
                    />
                    <strong>{index === 0 ? "今夜" : index === 1 ? "明日" : "3日目"}</strong>
                    <p>{item.action}</p>
                  </li>
                ))}
              </ArtifactTimeline>
            </div>
          </section>

          <ArtifactClosing
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
