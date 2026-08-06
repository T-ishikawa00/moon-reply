import type { CustomerAssessmentProjectionV1 } from "@/lib/assessment/runtime/customer-assessment-projection-v1";
import type { Decision } from "@/lib/assessment/runtime/types";

const decisionLabels: Record<Decision, string> = {
  reply_now: "今、返信する",
  send_now: "今、送る",
  wait_and_reassess: "待ってから見直す",
  pause_additional_contact: "追加連絡を止める",
};

const draftAbsenceCopy: Record<Decision, string> = {
  reply_now: "送信可能な下書きを表示できません。",
  send_now: "送信可能な下書きを表示できません。",
  wait_and_reassess: "今は送信用の下書きを出さず、再評価後に判断します。",
  pause_additional_contact: "追加連絡用の下書きは表示しません。",
};

type Props = {
  projection: CustomerAssessmentProjectionV1;
};

export function RuntimeAssessmentProjectionPreview({ projection }: Props) {
  return (
    <article className="request-sheet runtime-sheet" aria-labelledby="projection-preview-title">
      <header className="request-sheet__heading">
        <p>PACKAGE A / TECHNICAL PREVIEW</p>
        <h2 id="projection-preview-title">Customer Assessment Projection</h2>
        <span>最終Customer UIではなく、projection境界の技術確認用です。</span>
      </header>

      <section>
        <h3>判断</h3>
        <p>
          <strong>{decisionLabels[projection.decisionCode]}</strong>{" "}
          <code>{projection.decisionCode}</code>
        </p>
        <p>{projection.primaryReason}</p>
      </section>

      <section>
        <h3>最終下書き</h3>
        {projection.finalDraft ? (
          <>
            <p>{projection.finalDraft.text}</p>
            <small>
              {projection.finalDraft.policy} / {projection.finalDraft.useTiming}
            </small>
          </>
        ) : (
          <p>{draftAbsenceCopy[projection.decisionCode]}</p>
        )}
      </section>

      <section>
        <h3>直近の行動</h3>
        <p>{projection.immediateAction.action}</p>
        {projection.immediateAction.avoid.length > 0 ? (
          <ul>
            {projection.immediateAction.avoid.map((item, index) => (
              <li key={`${index}:${item}`}>避ける: {item}</li>
            ))}
          </ul>
        ) : null}
        {projection.immediateAction.secondaryActions.length > 0 ? (
          <ul>
            {projection.immediateAction.secondaryActions.map((item, index) => (
              <li key={`${index}:${item}`}>{item}</li>
            ))}
          </ul>
        ) : null}
      </section>

      <section>
        <h3>再評価</h3>
        <p>{projection.reassessment.when}</p>
        <ul>
          {projection.reassessment.conditions.map((item, index) => (
            <li key={`${index}:${item.condition}`}>
              {item.condition} → <code>{item.resultingDirection}</code>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h3>関係性の要約</h3>
        <p>{projection.relationshipSummary ?? "選択対象外、またはsourceがnullです。"}</p>
      </section>

      <section>
        <h3>文面の温度</h3>
        {projection.messageTemperature ? (
          <dl>
            <dt>softness</dt>
            <dd>{projection.messageTemperature.softness}</dd>
            <dt>affection</dt>
            <dd>{projection.messageTemperature.affection}</dd>
            <dt>pressure</dt>
            <dd>{projection.messageTemperature.pressure}</dd>
            <dt>adjustment</dt>
            <dd>{projection.messageTemperature.adjustment}</dd>
          </dl>
        ) : (
          <p>選択対象外、またはsourceがnullです。</p>
        )}
      </section>

      <footer>
        <p>{projection.fixedLimitation}</p>
      </footer>
    </article>
  );
}
