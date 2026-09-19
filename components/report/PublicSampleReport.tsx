"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent,
  type ReactNode,
} from "react";
import {
  ArtifactAnswer,
  ArtifactClosing,
  ArtifactCover,
  ArtifactLetter,
  ArtifactLimitation,
  ArtifactMessageDraft,
  ArtifactShell,
  ArtifactStamp,
  ArtifactTimeline,
} from "@/components/artifact";
import { EditorialDivider } from "@/components/brand/EditorialDivider";
import { LunarArc } from "@/components/brand/LunarArc";
import { MoonSeal } from "@/components/brand/MoonSeal";
import type { PublicSampleReportCase } from "@/fixtures/public/public-sample-cases";
import { trackClientMeasurement } from "@/lib/measurement/client";
import styles from "./PublicSampleReport.module.css";

type CtaPlacement = "hero" | "sticky" | "closing";

type PublicSampleReportProps = {
  initialSample: PublicSampleReportCase;
  alternateSample: PublicSampleReportCase;
};

export function PublicSampleReport({
  initialSample,
  alternateSample,
}: PublicSampleReportProps) {
  const [activeSampleId, setActiveSampleId] = useState(initialSample.id);
  const [heroCtaPassed, setHeroCtaPassed] = useState(false);
  const [closingCtaReached, setClosingCtaReached] = useState(false);
  const [footerVisible, setFooterVisible] = useState(false);
  const heroCtaRef = useRef<HTMLAnchorElement>(null);
  const closingCtaRef = useRef<HTMLAnchorElement>(null);
  const endMarkerRef = useRef<HTMLDivElement>(null);
  const samePageNavigationMeasuredRef = useRef(false);
  const endMeasuredRef = useRef(false);

  const sample =
    activeSampleId === alternateSample.id ? alternateSample : initialSample;
  const isWaitSample = sample.id === initialSample.id;

  const measureCta = useCallback(
    (placement: CtaPlacement, event: MouseEvent<HTMLAnchorElement>) => {
      const samePageNavigation =
        event.button === 0 &&
        !event.metaKey &&
        !event.ctrlKey &&
        !event.shiftKey &&
        !event.altKey;
      if (samePageNavigation && samePageNavigationMeasuredRef.current) return;
      if (samePageNavigation) samePageNavigationMeasuredRef.current = true;
      trackClientMeasurement("sample_cta_click", { placement });
    },
    [],
  );

  useEffect(() => {
    const heroCta = heroCtaRef.current;
    const closingCta = closingCtaRef.current;
    if (!heroCta || !closingCta || !("IntersectionObserver" in window)) {
      return;
    }

    const heroObserver = new IntersectionObserver(([entry]) => {
      setHeroCtaPassed(
        !entry.isIntersecting && entry.boundingClientRect.bottom <= 0,
      );
    }, { threshold: 0.01 });
    const closingObserver = new IntersectionObserver(
      ([entry]) => {
        setClosingCtaReached(
          entry.isIntersecting || entry.boundingClientRect.bottom <= 0,
        );
      },
      { threshold: 0.01 },
    );
    heroObserver.observe(heroCta);
    closingObserver.observe(closingCta);

    return () => {
      heroObserver.disconnect();
      closingObserver.disconnect();
    };
  }, []);

  useEffect(() => {
    const footer = document.querySelector("footer");
    if (!footer || !("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver(
      ([entry]) => setFooterVisible(entry.isIntersecting),
      { threshold: 0.01 },
    );
    observer.observe(footer);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const endMarker = endMarkerRef.current;
    if (!endMarker || !("IntersectionObserver" in window)) return;

    let markerVisible = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const clearTimer = () => {
      if (timer !== null) {
        clearTimeout(timer);
        timer = null;
      }
    };
    const startTimer = () => {
      clearTimer();
      if (
        endMeasuredRef.current ||
        !markerVisible ||
        document.visibilityState !== "visible"
      ) {
        return;
      }
      timer = setTimeout(() => {
        if (
          endMeasuredRef.current ||
          !markerVisible ||
          document.visibilityState !== "visible"
        ) {
          return;
        }
        endMeasuredRef.current = true;
        trackClientMeasurement("sample_end_view", { sample: "public_sample" });
        timer = null;
      }, 1_000);
    };
    const observer = new IntersectionObserver(
      ([entry]) => {
        markerVisible = entry.isIntersecting && entry.intersectionRatio >= 0.5;
        if (markerVisible) startTimer();
        else clearTimer();
      },
      // Exclude the bottom CTA zone so an obscured marker is not counted.
      { threshold: 0.5, rootMargin: "0px 0px -160px 0px" },
    );
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") startTimer();
      else clearTimer();
    };

    observer.observe(endMarker);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      clearTimer();
      observer.disconnect();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const stickyVisible = heroCtaPassed && !closingCtaReached && !footerVisible;
  const summaryItems = [
    ["相談状況", sample.relationshipContext],
    ["今の方向性", sample.conclusion],
    ["判断理由", sample.reason.join(" ")],
    ["次に見直す条件", sample.nextReviewCondition.join(" ")],
  ] as const;

  return (
    <main className={`public-sample-page ${styles.page}`}>
      <section
        className={`public-sample-intro ${styles.hero}`}
        aria-labelledby="sample-page-title"
      >
        <div className={`page-shell ${styles.heroInner}`}>
          <div className={styles.heroCopy}>
            <span className="status-label status-label--review">
              架空ケースによる鑑定ノート見本
            </span>
            <h1 id="sample-page-title">
              送るか、待つか。
              <br />
              自分の場合を、ここまで整理できます。
            </h1>
            <p className={styles.heroLead}>
              文面と状況をAIが整理し、今の方向性・必要な文面案・次に見直す条件を、一冊の鑑定ノートにまとめます。
            </p>
            <p className={styles.priceLine}>
              <span>1相談 税込980円</span>
              <span>都度払い・自動更新なし</span>
              <span>18歳以上</span>
            </p>
            <div className={styles.heroActions}>
              <div>
                <Link
                  href="/request"
                  className="button button--primary"
                  ref={heroCtaRef}
                  data-sample-cta="hero"
                  onClick={(event) => measureCta("hero", event)}
                >
                  自分の状況を入力する
                </Link>
                <p className={styles.ctaNote}>このボタンでは支払いは発生しません。</p>
              </div>
              <a className={styles.textLink} href="#sample-cases">
                まず見本を読む
              </a>
            </div>
          </div>
          <aside className={styles.disclosure} aria-label="見本と実際のサービスについて">
            以下は内容を説明するための架空の編集見本です。実在の相談者・購入者の事例や、実際のAI生成結果ではありません。実際のサービスでは、入力された情報をAIが整理・分析します。
          </aside>
        </div>
      </section>

      <aside className={styles.compactCta} aria-label="相談入力への案内">
        <div>
          <strong>1相談 税込980円</strong>
          <span>都度払い・自動更新なし</span>
        </div>
        <Link
          href="/request"
          data-sample-sticky-fallback
          onClick={(event) => measureCta("sticky", event)}
        >
          自分の状況を入力する
        </Link>
      </aside>

      <section id="sample-cases" className={styles.caseSection} aria-labelledby="case-heading">
        <div className="page-shell">
          <p className={styles.eyebrow}>2つのケースを読み比べる</p>
          <h2 id="case-heading">ケースが違えば、今の判断も変わります。</h2>
          <p className={styles.caseLead}>
            返事を待つ夜と、具体的な質問に返す夜。読みたいケースを選ぶと、要点と全文が切り替わります。
          </p>
          <div className={styles.caseSelector} role="group" aria-label="全文見本を選ぶ">
            {[initialSample, alternateSample].map((candidate, index) => {
              const selected = candidate.id === sample.id;
              const sampleKind = candidate.id === initialSample.id ? "wait" : "send";
              return (
                <button
                  key={candidate.id}
                  type="button"
                  className={selected ? styles.caseButtonActive : styles.caseButton}
                  aria-pressed={selected}
                  aria-controls="selected-sample-report"
                  data-sample-case={sampleKind}
                  onClick={() => setActiveSampleId(candidate.id)}
                >
                  <span>ケース {index + 1}</span>
                  {sampleKind === "wait"
                    ? "返事を待っていて、追加で送るか迷う"
                    : "具体的な日程の返信を考えたい"}
                </button>
              );
            })}
          </div>

          <div className={styles.summary} aria-live="polite" data-sample-summary>
            <p className={styles.summaryLabel}>選択中の見本</p>
            <h3>{isWaitSample ? "追加で送らず、今夜は待つ" : "届いた質問へ、今夜は短く返す"}</h3>
            <dl>
              {summaryItems.map(([label, value]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          </div>
          <p className={styles.formatNote}>
            以下はこのケースの全文編集見本です。章立て、文面案、期間は相談内容に応じて変わります。
          </p>
        </div>
      </section>

      <SampleNote sample={sample} isWaitSample={isWaitSample} />

      <div ref={endMarkerRef} className={styles.endMarkerWrap}>
        <div className={styles.endMarker} data-sample-end>
          <span aria-hidden="true" />
          全文見本はここまでです
          <span aria-hidden="true" />
        </div>
      </div>

      <section className={styles.closingSection} aria-labelledby="closing-heading">
        <div className={styles.closingInner}>
          <p className={styles.eyebrow}>あなたの状況を整理する</p>
          <h2 id="closing-heading">見本を読むだけでは決められない、あなたの一通へ。</h2>
          <p>
            同じ「返信がない」でも、最後の文面、送った回数、次の約束で考えることは変わります。あなたの状況をもとに、今の方向性、必要な文面案、次に見直す条件を整理します。
          </p>
          <div className={styles.productCard}>
            <div>
              <strong>恋のメッセージ鑑定ノート</strong>
              <span>1相談 税込980円／都度払い・自動更新なし</span>
            </div>
            <Link
              href="/request"
              className="button button--primary"
              ref={closingCtaRef}
              data-sample-cta="closing"
              onClick={(event) => measureCta("closing", event)}
            >
              自分の状況を入力する
            </Link>
          </div>
          <p className={styles.ctaNote}>
            入力を始めるだけでは課金されません。購入内容を確認してから支払いに進みます。
          </p>
          <p className={styles.boundary}>
            相手の本心や返信・関係改善を保証するサービスではありません。
          </p>
        </div>
      </section>

      <section className={styles.faqSection} aria-labelledby="faq-heading">
        <div className={styles.faqInner}>
          <p className={styles.eyebrow}>購入前の小さな疑問</p>
          <h2 id="faq-heading">よくある質問</h2>
          <dl className={styles.faqList}>
            <div>
              <dt>短い相談でもよいですか？</dt>
              <dd>
                はい。まとまった長文でなくても大丈夫です。原文の添削など、相談によって必要な情報は入力中に追加で確認します。
              </dd>
            </div>
            <div>
              <dt>入力ボタンで支払いが始まりますか？</dt>
              <dd>
                始まりません。相談内容、購入内容、受取方法などを確認してから支払いに進みます。
              </dd>
            </div>
            <div>
              <dt>相手の気持ちを断定できますか？</dt>
              <dd>
                断定しません。確認できる事実から、今の行動を考えるための判断材料をまとめます。
              </dd>
            </div>
          </dl>
        </div>
      </section>

      <aside
        className={`${styles.stickyCta} ${stickyVisible ? styles.stickyCtaVisible : ""}`}
        aria-hidden={!stickyVisible}
      >
        <div>
          <strong>1相談 税込980円</strong>
          <span>都度払い・自動更新なし</span>
        </div>
        <Link
          href="/request"
          tabIndex={stickyVisible ? undefined : -1}
          data-sample-cta="sticky"
          onClick={(event) => measureCta("sticky", event)}
        >
          自分の状況を入力する
        </Link>
      </aside>
    </main>
  );
}

function SampleNote({
  sample,
  isWaitSample,
}: {
  sample: PublicSampleReportCase;
  isWaitSample: boolean;
}) {
  const { report } = sample;
  return (
    <div id="selected-sample-report" className="public-sample-stage">
      <ArtifactShell as="article" className="public-sample-note paper-grain">
        <ArtifactCover as="header" className="public-sample-note__cover">
          <LunarArc tone="night" position="top-right" />
          <div className="public-sample-note__brand">
            <MoonSeal size="medium" />
            <span>月の返事</span>
          </div>
          <ArtifactStamp>架空の全文見本</ArtifactStamp>
          <p>恋のメッセージ鑑定ノート</p>
          <h2>{sample.relationshipContext}</h2>
          <EditorialDivider variant="night" />
          <span>{report.coverLine}</span>
          <ArtifactAnswer
            className="public-sample-answer"
            aria-labelledby="public-sample-answer-heading"
          >
            <p>今夜の答え</p>
            <h2 id="public-sample-answer-heading">{sample.conclusion}</h2>
          </ArtifactAnswer>
        </ArtifactCover>

        <div className="public-sample-note__body">
          <NumberedSection number="01" title="月の返事からの短い手紙">
            <ArtifactLetter>
              {report.shortLetter.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </ArtifactLetter>
          </NumberedSection>

          <NumberedSection number="02" title="判断を分けた事実">
            <div>
              <p>{sample.relationshipContext}</p>
              <dl className="public-sample-fact-list">
                <div>
                  <dt>相手の最後の文面</dt>
                  <dd>「{sample.lastReceivedMessage}」</dd>
                </div>
                <div>
                  <dt>{isWaitSample ? "迷っている下書き" : "今夜返す文面案"}</dt>
                  <dd>「{sample.intendedMessage}」</dd>
                </div>
              </dl>
              <BulletList items={sample.confirmedFacts} />
            </div>
          </NumberedSection>

          <NumberedSection number="03" title="この鑑定の理由">
            <div><BulletList items={sample.reason} /></div>
          </NumberedSection>

          <NumberedSection
            number="04"
            title={isWaitSample ? "迷っている文面の温度" : "文面の温度"}
            className="public-sample-temperature"
          >
            <div>
              <ArtifactMessageDraft as="blockquote">
                「{report.messageTemperature.quote}」
              </ArtifactMessageDraft>
              <dl>
                {report.messageTemperature.readings.map((reading) => (
                  <div key={reading.label}>
                    <dt>{reading.label}</dt>
                    <dd>{reading.text}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </NumberedSection>

          <NumberedSection number="05" title="今夜の行動案">
            <div><BulletList items={sample.immediateAction} /></div>
          </NumberedSection>

          <NumberedSection
            number="06"
            title={isWaitSample ? "ここからの方向" : "3日間の方向"}
          >
            <div>
              <ArtifactTimeline as="ol" className="public-sample-plan">
                {report.threeDayDirection.map((day, index) => (
                  <li key={day.label}>
                    <span
                      className={`public-sample-plan__moon public-sample-plan__moon--${index + 1}`}
                      aria-hidden="true"
                    />
                    <strong>{day.label}</strong>
                    <p>{day.direction}</p>
                  </li>
                ))}
              </ArtifactTimeline>
            </div>
          </NumberedSection>

          <NumberedSection number="07" title="次に判断を見直す条件">
            <div><BulletList items={sample.nextReviewCondition} /></div>
          </NumberedSection>

          <NumberedSection number="08" title="まだ断定できないこと">
            <div>
              <BulletList items={sample.uncertaintyLimitation} />
              <ArtifactLimitation
                as="aside"
                className="public-sample-limitation"
                aria-label="見本の固定注意"
              >
                <strong>この見本で断定しないこと</strong>
                <p>
                  相手の本心、返信、復縁、未来、関係改善を断定・保証しません。医療・心理・法律上の助言でもありません。
                </p>
                <p>{report.fixedDisclosure}</p>
              </ArtifactLimitation>
            </div>
          </NumberedSection>

          <ArtifactClosing as="blockquote" className="public-sample-closing">
            {report.closingLine}
          </ArtifactClosing>
        </div>
      </ArtifactShell>
    </div>
  );
}

function NumberedSection({
  number,
  title,
  className,
  children,
}: {
  number: string;
  title: string;
  className?: string;
  children: ReactNode;
}) {
  const id = `sample-section-${number}`;
  return (
    <section className={className} aria-labelledby={id}>
      <span aria-hidden="true">{number}</span>
      <h2 id={id}>{title}</h2>
      {children}
    </section>
  );
}

function BulletList({ items }: { items: readonly string[] }) {
  return (
    <ul className="public-sample-detail-list">
      {items.map((item) => <li key={item}>{item}</li>)}
    </ul>
  );
}
