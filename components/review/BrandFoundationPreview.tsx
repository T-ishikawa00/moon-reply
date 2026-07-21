import type { CSSProperties } from "react";
import Link from "next/link";
import { EditorialDivider } from "@/components/brand/EditorialDivider";
import { LunarArc } from "@/components/brand/LunarArc";
import { MoonSeal } from "@/components/brand/MoonSeal";

const colorGroups = [
  {
    name: "Night",
    colors: [
      ["night-950", "#070a18"],
      ["night-900", "#0d1127"],
      ["night-800", "#17152f"],
      ["night-700", "#242039"],
    ],
  },
  {
    name: "Moon Gold",
    colors: [
      ["moon-600", "#b89245"],
      ["moon-500", "#e5c46d"],
      ["moon-400", "#efd58c"],
      ["moon-300", "#f4dda3"],
    ],
  },
  {
    name: "Paper",
    colors: [
      ["paper-50", "#fffdf6"],
      ["paper-100", "#fff8e9"],
      ["paper-200", "#f4ead7"],
      ["paper-300", "#e9dcc4"],
    ],
  },
  {
    name: "Ink",
    colors: [
      ["ink-950", "#211a2b"],
      ["ink-800", "#33293d"],
      ["ink-600", "#66596b"],
      ["ink-500", "#7b6f7e"],
    ],
  },
] as const;

const phraseSamples = [
  "月の返事",
  "Web鑑定ノート",
  "保存用判断カード",
  "恋のメッセージ鑑定ノート",
  "架空サンプル",
] as const;

export function BrandFoundationPreview() {
  return (
    <section
      id="brand-foundation"
      className="brand-foundation-preview"
      aria-labelledby="brand-foundation-heading"
    >
      <div className="page-shell">
        <header className="brand-foundation-preview__header">
          <p className="type-meta">REVIEW ONLY · M1-I7</p>
          <h2 id="brand-foundation-heading" className="type-page-title">
            Brand Foundation
          </h2>
          <p className="type-body-large brand-foundation-preview__lead">
            「月明かりに照らされた、静かな夜の書斎」を共有画面へ展開するための、色・文字・余白・面・操作・装飾の基盤見本です。
          </p>
          <div className="brand-foundation-preview__notice" role="note">
            <strong>審査専用の基盤プレビューです。</strong>
            <span>
              M1-I8〜M1-I11のReading Note、LP、Request Sheet、Legal各画面を再設計済みと示すものではありません。
            </span>
          </div>
        </header>

        <EditorialDivider variant="paper" />

        <section aria-labelledby="brand-colors-heading" className="brand-foundation-preview__block">
          <div className="brand-foundation-preview__section-heading">
            <p className="type-meta">COLOR ROLES</p>
            <h3 id="brand-colors-heading" className="type-section-title">色の役割</h3>
            <p className="type-body">
              Pale goldは境界・印・主要操作へ限定し、長い本文や大面積背景には使用しません。
            </p>
          </div>
          <div className="brand-color-groups">
            {colorGroups.map((group) => (
              <div key={group.name} className="brand-color-group">
                <p className="type-small brand-color-group__name">{group.name}</p>
                <ul className="brand-color-list">
                  {group.colors.map(([name, value]) => (
                    <li key={name} className="brand-color-swatch">
                      <span
                        className="brand-color-swatch__sample"
                        style={{ "--swatch-color": `var(--${name})` } as CSSProperties}
                        aria-hidden="true"
                      />
                      <span>
                        <strong>{name}</strong>
                        <code>{value}</code>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section aria-labelledby="brand-type-heading" className="brand-foundation-preview__block brand-foundation-preview__type-block">
          <div className="brand-foundation-preview__section-heading">
            <p className="type-meta">TYPOGRAPHY &amp; RHYTHM</p>
            <h3 id="brand-type-heading" className="type-section-title">文字とリズム</h3>
          </div>
          <div className="brand-type-specimen">
            <p className="type-display">月明かりの下で、言葉をほどく。</p>
            <p className="type-page-title">ページタイトルの静かな重心</p>
            <p className="type-section-title">章を導くセクションタイトル</p>
            <p className="type-subsection-title">内容を見失わない小見出し</p>
            <p className="type-body-large">少し大きな導入文は、結論と本文の間をつなぎます。</p>
            <p className="type-body">本文はOS標準の日本語サンセリフで、長い読み物にも入力画面にも使える行間を保ちます。</p>
            <p className="type-small">補足は小さくしても、意味とコントラストを弱めません。</p>
            <p className="type-meta">METADATA · REVIEW-ONLY INFORMATION</p>
          </div>
        </section>

        <section aria-labelledby="brand-surfaces-heading" className="brand-foundation-preview__block">
          <div className="brand-foundation-preview__section-heading">
            <p className="type-meta">SURFACE VOCABULARY</p>
            <h3 id="brand-surfaces-heading" className="type-section-title">共有サーフェス</h3>
            <p className="type-body">同じカードを反復せず、情報の目的ごとに面の重心と密度を変えます。</p>
          </div>

          <div className="brand-surface-stage">
            <article className="surface-brand soft-glow">
              <LunarArc tone="night" position="top-right" />
              <div className="brand-surface-heading">
                <MoonSeal size="medium" />
                <div>
                  <p className="type-meta">surface-brand · SoftGlow</p>
                  <p className="type-section-title">夜の表紙となる面</p>
                </div>
              </div>
              <EditorialDivider variant="night" />
              <p className="type-body-large">
                深いnavy、薄い光、細い境界で、Hero・cover・final CTAの共通土台をつくります。
              </p>
              <div className="brand-foundation-preview__actions" aria-label="ボタンとリンクの見本">
                <Link href="/request" className="button button--primary">Primary CTA</Link>
                <Link href="/review/result/result-normal-001" className="button button--secondary">Secondary CTA</Link>
                <Link href="/review" className="text-link text-link--night">テキストリンク</Link>
              </div>
            </article>

            <article className="surface-answer soft-glow">
              <LunarArc tone="night" position="bottom-left" />
              <p className="type-meta">surface-answer · LunarArc</p>
              <p className="type-section-title">
                <span className="phrase-keep">「今夜の答え」</span>用の強調面
              </p>
              <p className="type-body-large">
                通常カードより強い階層と月のフレームだけを示す基盤見本です。実際の回答内容はM1-I7では実装していません。
              </p>
            </article>
          </div>

          <div className="brand-surface-editorial">
            <article className="surface-paper paper-grain">
              <p className="type-meta">surface-paper · PaperGrain</p>
              <p className="type-section-title">温かな紙で、長く読む。</p>
              <EditorialDivider variant="paper" />
              <p className="type-body-large">
                鑑定ノート本文を想定したreading measure、soft paper shadow、dark inkの見本です。粒子はCSSだけで、レイアウトや可読性に依存しません。
              </p>
            </article>

            <article className="surface-worksheet">
              <p className="type-meta">surface-worksheet</p>
              <p className="type-section-title">落ち着いて整理する面</p>
              <p className="type-body">label、説明、入力境界の密度だけを確認する非操作の基盤見本です。</p>
              <div className="brand-worksheet-lines" aria-hidden="true">
                <span />
                <span />
                <span />
              </div>
            </article>
          </div>

          <aside className="surface-caution" role="note">
            <p className="type-meta">surface-caution</p>
            <p className="type-subsection-title">注意：意味は色だけに頼りません</p>
            <p className="type-body">Safetyや重要な制限を、煽らず、見落とせない文章と境界で伝える面です。</p>
          </aside>

          <article className="surface-legal paper-grain">
            <div className="brand-surface-heading">
              <MoonSeal size="small" />
              <div>
                <p className="type-meta">surface-legal · MoonSeal small</p>
                <p className="type-section-title">文書として読む法務面</p>
              </div>
            </div>
            <EditorialDivider variant="paper" />
            <p className="type-body">
              装飾とshadowを抑え、見出し・本文・注記の読書コントラストを優先します。法務本文や未解決事項そのものは変更していません。
            </p>
          </article>
        </section>

        <section aria-labelledby="brand-states-heading" className="brand-foundation-preview__block">
          <div className="brand-foundation-preview__section-heading">
            <p className="type-meta">STATE &amp; ACCESSIBILITY</p>
            <h3 id="brand-states-heading" className="type-section-title">状態・focus・motion</h3>
            <p className="type-body">各状態は背景・文字・境界に加えて、必ず可視テキストで意味を示します。</p>
          </div>
          <div className="brand-status-list" aria-label="状態表示の見本">
            <span className="status-label status-label--success"><span aria-hidden="true">✓</span> 成功：確認可能</span>
            <span className="status-label status-label--caution"><span aria-hidden="true">!</span> 注意：慎重な確認が必要</span>
            <span className="status-label status-label--danger"><span aria-hidden="true">×</span> 停止：続行できません</span>
            <span className="status-label status-label--review"><span aria-hidden="true">i</span> 審査：Human final QA pending</span>
          </div>
          <p className="type-small brand-foundation-preview__a11y-note">
            Focusは3px、主要操作は44px以上。hover/focus transitionは160〜220ms・最大1px移動で、reduced motionでは即時化します。
          </p>
        </section>

        <section aria-labelledby="brand-wrap-heading" className="brand-foundation-preview__block brand-foundation-preview__wrap-block">
          <div className="brand-foundation-preview__section-heading">
            <p className="type-meta">JAPANESE WRAPPING</p>
            <h3 id="brand-wrap-heading" className="type-section-title">日本語の改行基盤</h3>
            <p className="type-body">
              見出しはstrict line breakingとbalanceを使い、全ての文字を任意分割しません。短い意味単位だけにphrase-keepを使います。
            </p>
          </div>
          <div className="brand-wrap-sample">
            <p className="type-section-title">
              <span className="phrase-keep">月の返事</span>で、
              <span className="phrase-keep">恋のメッセージ鑑定ノート</span>を静かに読み解く。
            </p>
            <p className="type-body">
              {phraseSamples.map((phrase, index) => (
                <span key={phrase}>
                  <span className="phrase-keep">{phrase}</span>
                  {index < phraseSamples.length - 1 ? " ・ " : ""}
                </span>
              ))}
            </p>
          </div>
        </section>
      </div>
    </section>
  );
}
