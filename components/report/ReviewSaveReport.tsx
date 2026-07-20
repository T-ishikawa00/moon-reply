import {
  ArtifactAnswer,
  ArtifactComparison,
  ArtifactCover,
  ArtifactLimitation,
  ArtifactMessageDraft,
  ArtifactMetadata,
  ArtifactShell,
} from "@/components/artifact";
import { EditorialDivider } from "@/components/brand/EditorialDivider";
import { MoonSeal } from "@/components/brand/MoonSeal";
import type { ReviewReportFixture } from "@/fixtures/review/reports";
import { ReportComparisonNavigation } from "./ReportComparisonNavigation";

function CompactList({ items }: { items: readonly string[] }) {
  return (
    <ul className="save-decision-list">
      {items.map((item) => <li key={item}>{item}</li>)}
    </ul>
  );
}

export function ReviewSaveReport({ report }: { report: ReviewReportFixture }) {
  return (
    <main className="save-decision-page">
      <aside className="artifact-review-boundary" aria-label="保存用表示の審査境界">
        <div className="artifact-review-boundary__inner">
          <div className="artifact-review-boundary__lead">
            <strong>保存向け固定表示の審査見本</strong>
            <span>購入・AI生成・メール送信・ファイル保存なし</span>
          </div>
          <details>
            <summary>実行境界とfixture</summary>
            <p>固定架空データの画面表示です。ファイル生成・保存・ダウンロード・印刷・共有は行いません。</p>
            <dl>
              <div><dt>fixture</dt><dd>{report.id}</dd></div>
              <div><dt>購入・AI実行</dt><dd>なし</dd></div>
              <div><dt>ファイル</dt><dd>生成なし</dd></div>
            </dl>
          </details>
        </div>
      </aside>

      <div className="save-decision-stage">
        <ArtifactShell as="article" className="save-decision-note paper-grain">
          <ArtifactCover as="header" className="save-decision-note__header">
            <div className="save-decision-note__brand">
              <MoonSeal size="small" />
              <div><span>月の返事</span><strong>保存用判断カード</strong></div>
            </div>
            <p>迷った時に30秒で見返す、今夜の判断カード</p>
            <h1>{report.consultationTheme}</h1>
            <EditorialDivider variant="night" />
            <ArtifactMetadata>
              <div><dt>相談者</dt><dd>{report.clientNickname}さん</dd></div>
              <div><dt>次の判断</dt><dd>翌日以降、または状況が動いた時</dd></div>
            </ArtifactMetadata>
          </ArtifactCover>

          <ArtifactAnswer as="section" className="save-decision-answer" aria-labelledby="save-answer-heading">
            <p>今夜の答え</p>
            <h2 id="save-answer-heading">{report.judgmentLabel}</h2>
            <span>{report.conclusionReasonSummary}</span>
          </ArtifactAnswer>

          <ArtifactComparison className="save-decision-actions">
            <section aria-labelledby="save-do-heading">
              <h2 id="save-do-heading">今やること</h2>
              <CompactList items={report.tonightActions} />
            </section>
            <section aria-labelledby="save-dont-heading">
              <h2 id="save-dont-heading">やらないこと</h2>
              <CompactList items={report.notTonightActions} />
            </section>
          </ArtifactComparison>

          <ArtifactMessageDraft as="section" className="save-decision-message" aria-labelledby="save-message-heading">
            <div>
              <p>明日以降、再判断した場合の候補</p>
              <h2 id="save-message-heading">送る場合の文面案</h2>
            </div>
            <blockquote>{report.laterMessageDraft}</blockquote>
            <small>今夜は送らない／相手から連絡が来た場合は使わない</small>
          </ArtifactMessageDraft>

          <section className="save-decision-next" aria-labelledby="save-next-heading">
            <div>
              <p>次の判断日</p>
              <h2 id="save-next-heading">明日以降</h2>
            </div>
            <p>{report.reviewTiming}</p>
          </section>

          <section className="save-decision-conditions" aria-labelledby="save-change-heading">
            <h2 id="save-change-heading">方針を変える条件</h2>
            <CompactList items={report.recommendationChangeConditions} />
          </section>

          <blockquote className="save-decision-remember">
            <span>今夜覚えておく一文</span>
            <p>{report.rememberTonight}</p>
          </blockquote>

          <ArtifactLimitation as="footer" className="save-decision-note__footer">
            <strong>このカードで断定しないこと</strong>
            <p>{report.fixedLimitationDisclaimer}</p>
          </ArtifactLimitation>
        </ArtifactShell>

        <div className="save-decision-stage__navigation">
          <ReportComparisonNavigation />
        </div>
      </div>
    </main>
  );
}
