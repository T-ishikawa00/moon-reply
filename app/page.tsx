import Link from "next/link";
import {
  ArtifactAnswer,
  ArtifactCover,
  ArtifactShell,
} from "@/components/artifact";
import { EditorialDivider } from "@/components/brand/EditorialDivider";
import { LunarArc } from "@/components/brand/LunarArc";
import { MoonSeal } from "@/components/brand/MoonSeal";
import { PUBLIC_SAMPLE_CASES } from "@/fixtures/public/public-sample-cases";
import { REPORT_FIXTURES } from "@/fixtures/review/reports";

const preview = REPORT_FIXTURES["result-normal-001"];

const threeAnswers = [
  {
    number: "01",
    title: "今夜の答え",
    text: "短く返す、今夜は待つ、追加連絡を止める。相談事実に応じた方向を最初に示します。",
  },
  {
    number: "02",
    title: "送る場合の文面",
    text: "今の距離感に合わせて、重さを調整した文面案をまとめます。",
  },
  {
    number: "03",
    title: "3日間の方向",
    text: "今夜だけで終わらせず、次に見直す条件まで短期の方針にします。",
  },
];

const flowSteps = [
  {
    number: "1",
    title: "状況を書く",
    text: "うまくまとめなくても大丈夫。今起きていることを、自分の言葉で書きます。",
  },
  {
    number: "2",
    title: "安全確認を行う",
    text: "通常鑑定として扱える相談かを、必ず決済より前に確認します。",
  },
  {
    number: "3",
    title: "鑑定ノートを受け取る",
    text: "今夜の答え、文面案、3日間の行動方針を一冊の形で受け取る計画です。",
  },
];

const faqs = [
  {
    question: "相手の本心は分かりますか？",
    answer:
      "相手の本心を断定するものではありません。確認できる事実と考えられる可能性を分け、次の行動を選ぶための判断材料を示します。",
  },
  {
    question: "必ず返信が来たり、復縁できたりしますか？",
    answer:
      "返信、復縁、交際、将来の結果は保証しません。結果を約束するのではなく、今ある状況と言葉を現実的に整理するサービスです。",
  },
  {
    question: "AIや占いを使いますか？",
    answer:
      "入力された情報の整理にはAIを使用する予定です。タロット、占星術、霊感などの占術・超自然的手法は使いません。現在はAI生成機能は動作していません。",
  },
  {
    question: "どんな相談でも依頼できますか？",
    answer:
      "自傷、DV、ストーカー、脅迫、未成年が関係する危険相談などは通常鑑定として扱いません。Safety確認で通常鑑定OKとなった場合だけ先へ進みます。",
  },
  {
    question: "料金と返金条件は決まっていますか？",
    answer:
      "料金は1相談・1鑑定ノートにつき税込980円の都度払いです。返金条件の未確定事項は決済事業者の選定後に確定します。現在は決済できません。",
  },
];

function RequestCta({ label = "鑑定ノートを依頼する" }: { label?: string }) {
  return (
    <Link href="/request" className="button button--primary">
      {label}
    </Link>
  );
}

export default function Home() {
  return (
    <main className="lp-home">
      <section className="lp-home-hero" aria-labelledby="lp-hero-title">
        <LunarArc tone="night" position="top-right" />
        <div className="page-shell lp-home-hero__grid">
          <div className="lp-home-hero__copy">
            <p className="lp-kicker">恋のメッセージ鑑定ノート</p>
            <h1 id="lp-hero-title">
              返事がこない夜に、<br />
              送るか、待つかを決めるための一冊。
            </h1>
            <p className="lp-home-hero__lead">
              月の返事は、相手の本心や未来を断定するものではありません。
              入力された文面と状況をAIが整理・分析し、今どう動くかを考えるための判断材料と、
              送る文面・行動の整理を恋のメッセージ鑑定ノートにまとめます。
            </p>

            <dl className="lp-home-hero__facts" aria-label="商品条件">
              <div>
                <dt>料金</dt>
                <dd>税込980円</dd>
              </div>
              <div>
                <dt>支払い</dt>
                <dd>都度払い</dd>
              </div>
              <div>
                <dt>対象</dt>
                <dd>18歳以上</dd>
              </div>
              <div>
                <dt>内容</dt>
                <dd>1相談 / 1鑑定ノート</dd>
              </div>
            </dl>

            <div className="lp-home-hero__actions">
              <RequestCta />
              <Link href="/sample-report" className="button button--secondary">
                架空の見本を読む
              </Link>
            </div>
            <p className="lp-home-status">
              サービス準備中のため、現在は購入・生成・メール送信を利用できません。
            </p>
          </div>

          <ArtifactCover
            as="article"
            className="lp-note-cover"
            aria-label="恋のメッセージ鑑定ノートの架空の表紙見本"
          >
            <LunarArc tone="night" position="top-right" />
            <div className="lp-note-cover__brand-row">
              <div className="lp-note-cover__brand">
                <MoonSeal size="medium" />
                <span>月の返事</span>
              </div>
              <p className="lp-note-cover__sample">架空の内容見本</p>
            </div>
            <div className="lp-note-cover__title">
              <p>恋のメッセージ鑑定ノート</p>
              <h2>今夜の答えを、<br />一冊の中へ。</h2>
            </div>
            <div className="lp-note-cover__contents">
              <EditorialDivider variant="night" />
              <ul>
                <li>今夜の答え</li>
                <li>送る場合の文面</li>
                <li>3日間の行動方針</li>
              </ul>
            </div>
            <ArtifactAnswer
              as="section"
              className="lp-note-cover__answer"
              aria-label="固定架空ケースの今夜の答え"
            >
              <span>今夜の答え</span>
              <strong>{preview.judgmentLabel}</strong>
            </ArtifactAnswer>
          </ArtifactCover>
        </div>
      </section>

      <section className="lp-home-section lp-home-section--paper" aria-labelledby="answers-title">
        <div className="page-shell">
          <div className="lp-section-heading lp-section-heading--compact">
            <p className="lp-kicker">一冊で受け取るもの</p>
            <h2 id="answers-title">迷いを、三つの答えに整理します。</h2>
          </div>
          <ol className="lp-answer-list">
            {threeAnswers.map((answer) => (
              <li key={answer.number}>
                <span>{answer.number}</span>
                <h3>{answer.title}</h3>
                <p>{answer.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="lp-home-section lp-home-section--wash" aria-labelledby="empathy-title">
        <div className="page-shell lp-empathy">
          <div>
            <p className="lp-kicker">返事を待つ夜に</p>
            <h2 id="empathy-title">不安が、まだ分からないことを答えにしてしまう前に。</h2>
          </div>
          <div className="lp-empathy__body">
            <ul>
              <li>嫌われたのかもしれない</li>
              <li>追い連絡した方がいいかもしれない</li>
              <li>文面が重かったのかもしれない</li>
            </ul>
            <p>
              月の返事が行うのは、気持ちを煽ることではありません。
              <strong>確認できる事実と、不安から生まれた想像を分けること。</strong>
              そこから、自分で今夜の行動を選べる状態へ戻します。
            </p>
          </div>
        </div>
      </section>

      <section id="note" className="lp-home-section lp-home-section--night" aria-labelledby="artifact-title">
        <div className="page-shell">
          <div className="lp-section-heading lp-section-heading--night">
            <p className="lp-kicker">同一ケースの表示形式</p>
            <h2 id="artifact-title">同じ鑑定を、三つの表示で比べる。</h2>
            <p>
              ここで比べるのは、同じ「今日は送らない方がいい」という架空の鑑定です。
              短い見本、長く読むWeb鑑定ノート、後から短時間で見返す保存用判断カードで、表示目的と情報量だけを変えています。
              三つの異なる判断例ではありません。
            </p>
          </div>

          <div className="lp-artifact" aria-label="同じ固定架空ケースの三つの表示形式比較">
            <ArtifactShell as="article" className="lp-artifact__main paper-grain">
              <ArtifactCover as="header" className="lp-artifact__cover">
                <LunarArc tone="night" position="top-right" />
                <div className="lp-artifact__brand"><MoonSeal /><span>月の返事</span></div>
                <small><span aria-hidden="true">01</span> 短い見本</small>
              </ArtifactCover>
              <ArtifactAnswer as="section" className="lp-artifact__answer">
                <p>今夜の答え</p>
                <h3>{preview.judgmentLabel}</h3>
                <span>{preview.conclusionReasonSummary}</span>
              </ArtifactAnswer>
              <section className="lp-artifact__temperature">
                <div>
                  <p>文面の温度</p>
                  <blockquote>「{preview.messageTemperature.quote}」</blockquote>
                </div>
                <dl>
                  <div><dt>やわらかさ</dt><dd>{preview.messageTemperature.softness}</dd></div>
                  <div><dt>圧の見え方</dt><dd>{preview.messageTemperature.pressure}</dd></div>
                </dl>
              </section>
              <section className="lp-artifact__plan">
                <p>3日間の月明かりプラン</p>
                <ol>
                  {preview.threeDayPlan.map((day, index) => (
                    <li key={day.label}><span>0{index + 1}</span><strong>{day.label}</strong><p>{day.direction}</p></li>
                  ))}
                </ol>
              </section>
            </ArtifactShell>

            <aside className="lp-artifact__aside">
              <section className="lp-artifact__index" aria-labelledby="lp-web-preview-title">
                <div className="lp-artifact__index-heading">
                  <span aria-hidden="true">02</span>
                  <p>Web鑑定ノート</p>
                </div>
                <ArtifactCover className="lp-artifact__web-cover">
                  <LunarArc tone="night" position="top-right" />
                  <div className="lp-artifact__brand"><MoonSeal /><span>月の返事</span></div>
                  <h3 id="lp-web-preview-title">深く読む一冊</h3>
                  <ArtifactAnswer className="lp-artifact__web-answer">
                    <span>今夜の答え</span>
                    <strong>{preview.judgmentLabel}</strong>
                  </ArtifactAnswer>
                </ArtifactCover>
                <strong className="lp-artifact__purpose">理由まで理解し、判断に納得するための本編。</strong>
                <span className="lp-artifact__detail">表紙から短い手紙、文面、行動、限界まで14部構成。</span>
                <Link href="/review/result/result-normal-001" className="lp-artifact__link">
                  Web鑑定ノートの見本を読む
                </Link>
              </section>
              <ArtifactShell as="article" className="lp-decision-card" aria-labelledby="lp-save-preview-title">
                <div className="lp-decision-card__heading">
                  <span aria-hidden="true">03</span>
                  <h3 id="lp-save-preview-title">保存用判断カード</h3>
                </div>
                <span>30秒で見返す</span>
                <ArtifactAnswer as="section" className="lp-decision-card__answer">
                  <p>今夜の答え</p>
                  <strong>{preview.judgmentLabel}</strong>
                </ArtifactAnswer>
                <dl>
                  <div><dt>今やること</dt><dd>{preview.tonightActions[0]}</dd></div>
                  <div><dt>次の判断</dt><dd>翌日以降、または状況が動いた時</dd></div>
                </dl>
                <Link href="/review/save-report/result-normal-001" className="lp-artifact__link">
                  保存用判断カードの見本を読む
                </Link>
              </ArtifactShell>
            </aside>
          </div>
          <div className="lp-artifact__footer">
            <p className="lp-artifact__note">
              上の三つは、すべて同じ固定架空ケースの表示です。三つの異なる判断ではありません。購入、AI生成、納品、保存機能の実績ではありません。
            </p>
            <Link href="/sample-report" className="lp-artifact__link lp-artifact__link--public">
              別の「送る」ケースの公開全文見本を読む
            </Link>
          </div>
        </div>
      </section>

      <section id="flow" className="lp-home-section lp-home-section--paper" aria-labelledby="flow-title">
        <div className="page-shell">
          <div className="lp-section-heading">
            <p className="lp-kicker">利用の流れ</p>
            <h2 id="flow-title">依頼から受け取りまで、三つの段階。</h2>
            <p>通常鑑定OKの場合だけ先へ進む設計です。Safety確認は必ず決済より前に行います。</p>
          </div>
          <ol className="lp-flow-list">
            {flowSteps.map((step) => (
              <li key={step.number}>
                <span>{step.number}</span>
                <div><h3>{step.title}</h3><p>{step.text}</p></div>
              </li>
            ))}
          </ol>
          <p className="lp-flow-status">
            現在利用できるのはローカルの依頼フォームと確認表示です。決済・生成・メール配信は動作しません。
          </p>
        </div>
      </section>

      <section className="lp-home-section lp-home-section--sample" aria-labelledby="sample-title">
        <div className="page-shell">
          <div className="lp-section-heading lp-section-heading--night">
            <p className="lp-kicker">異なる相談ケースの判断比較</p>
            <h2 id="sample-title">相談内容によって、今夜の答えは変わります。</h2>
            <p>
              同じ「返信がない」相談でも、交わされた文面や、すでに送った回数によって整理すべき答えは異なります。
              以下はすべて、判断の違いを示すための固定された架空ケースです。
            </p>
          </div>

          <ol className="lp-sample-cases">
            {PUBLIC_SAMPLE_CASES.map((sampleCase, index) => (
              <li key={sampleCase.id}>
                <div className="lp-sample-case__heading">
                  <span aria-hidden="true">0{index + 1}</span>
                  <p>架空ケース</p>
                </div>
                <h3>{sampleCase.caseLabel}</h3>
                <strong>{sampleCase.conclusion}</strong>
                <p className="lp-sample-case__context">{sampleCase.relationshipContext}</p>
                <div className="lp-sample-case__facts">
                  <p>判断を分けた事実</p>
                  <ul>
                    {sampleCase.confirmedFacts.slice(0, 3).map((fact) => <li key={fact}>{fact}</li>)}
                  </ul>
                </div>
                <p className="lp-sample-case__review">
                  <span>次の見直し</span>
                  {sampleCase.nextReviewCondition[0]}
                </p>
              </li>
            ))}
          </ol>

          <div className="lp-sample-cases__footer">
            <p>実在相談、購入者事例、レビュー、AI生成実績ではありません。</p>
            <Link href="/sample-report" className="button button--secondary">
              「送る」ケースの全文見本を読む
            </Link>
          </div>
        </div>
      </section>

      <section id="price" className="lp-home-section lp-home-section--paper" aria-labelledby="price-title">
        <div className="page-shell lp-price">
          <div className="lp-section-heading">
            <p className="lp-kicker">料金</p>
            <h2 id="price-title">一度きりの、税込980円。</h2>
            <p>サブスクリプションやコインではなく、1相談ごとの都度払いです。</p>
          </div>
          <article className="lp-price__sheet">
            <p>月の返事</p>
            <h3>恋のメッセージ鑑定ノート</h3>
            <strong><small>税込</small>980<small>円</small></strong>
            <ul>
              <li>Web鑑定ノート</li>
              <li>保存用判断カード</li>
              <li>今夜の答え・文面案・3日間の行動方針</li>
              <li>1相談 / 1鑑定ノート</li>
              <li>自動更新なし</li>
            </ul>
            <p className="lp-price__status">審査・準備中のため、現在は購入できません。</p>
          </article>
        </div>
      </section>

      <section id="boundaries" className="lp-home-section lp-home-section--wash" aria-labelledby="boundaries-title">
        <div className="page-shell">
          <div className="lp-section-heading">
            <p className="lp-kicker">約束する範囲</p>
            <h2 id="boundaries-title">できることと、できないことを曖昧にしません。</h2>
          </div>
          <div className="lp-boundaries">
            <section>
              <p>できること</p>
              <ul>
                <li>事実と推測を分ける</li>
                <li>文面の印象を整理する</li>
                <li>現実的な行動案を示す</li>
              </ul>
            </section>
            <section>
              <p>できないこと</p>
              <ul>
                <li>相手の本心を断定する</li>
                <li>返信、復縁、交際、将来を保証する</li>
                <li>医療、診断、心理カウンセリング、法律相談を代替する</li>
              </ul>
            </section>
          </div>
          <p className="lp-boundaries__safety">
            自傷、DV、ストーカー、脅迫、未成年が関係する危険相談などは通常鑑定として扱いません。
          </p>
        </div>
      </section>

      <section id="faq" className="lp-home-section lp-home-section--paper" aria-labelledby="faq-title">
        <div className="page-shell lp-faq">
          <div className="lp-section-heading lp-section-heading--compact">
            <p className="lp-kicker">FAQ</p>
            <h2 id="faq-title">依頼前に、知っておいてほしいこと。</h2>
          </div>
          <div className="lp-faq__list">
            {faqs.map((faq) => (
              <details key={faq.question}>
                <summary>{faq.question}</summary>
                <p>{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="lp-final" aria-labelledby="final-title">
        <LunarArc tone="night" position="bottom-left" />
        <div className="page-shell lp-final__inner">
          <MoonSeal size="medium" />
          <p className="lp-kicker">月の返事</p>
          <h2 id="final-title">今夜の迷いを、明日の後悔にしないために。</h2>
          <p>状況と言葉を一度ノートへ。通常鑑定OKの場合だけ、次の段階へ進みます。</p>
          <div className="lp-final__actions">
            <RequestCta />
            <Link href="/sample-report" className="button button--secondary">架空の見本を読む</Link>
          </div>
          <p className="lp-home-status">現在はローカル確認のみで、購入・生成・送信はできません。</p>
        </div>
      </section>
    </main>
  );
}
