import type { Metadata } from "next";
import Link from "next/link";
import {
  ContentSection,
  DecisionGrid,
  LegalPageHeader,
  LegalReviewScaffold,
  ReviewCallout,
} from "@/components/legal/LegalReview";
import { unsupportedCaseCategories } from "@/lib/legal/review-content";

export const metadata: Metadata = {
  title: "通常鑑定対象外 審査表示 | 月の返事",
  description: "Safety-firstの通常鑑定停止境界とM1のrejected・needs_review処理を確認する公開前の審査表示です。",
};

export default function UnsupportedCasesReviewPage() {
  return (
    <LegalReviewScaffold currentPath="/legal/unsupported-cases">
      <LegalPageHeader
        eyebrow="SAFETY & UNSUPPORTED CASES REVIEW"
        title="通常鑑定として扱わないご相談 審査表示"
        description="相談した方を責めず、安全上の問題を恋愛の継続や連絡の後押しへ変換しないための停止境界を確認します。"
      />
      <div className="mx-auto max-w-5xl space-y-8 px-4 py-10 sm:px-8 sm:py-14">
        <ReviewCallout strong="Safetyを決済より前に確認します。">
          全ての相談を通常の恋愛鑑定として扱うわけではありません。安全上の問題を含む場合は、安全を優先して通常鑑定を停止します。これは相談した方を非難・侮辱する対応ではありません。
        </ReviewCallout>

        <ContentSection eyebrow="UNSUPPORTED CATEGORIES" title="通常鑑定として扱わない相談">
          <ul className="grid gap-3 md:grid-cols-2">
            {unsupportedCaseCategories.map((item) => (
              <li key={item} className="rounded-lg border border-[#d8c596] bg-[#fffdf5] p-4 leading-7">{item}</li>
            ))}
          </ul>
        </ContentSection>

        <ContentSection
          eyebrow="CURRENT M1 HANDLING"
          title="現在のM1停止処理"
          intro="現在の分類語彙とseverityを変更せず、固定fixtureとlocal deterministic ruleの結果を確認します。"
          tone="ivory"
        >
          <DecisionGrid decisions={[
            { label: "rejected", summary: "決済へ進めず、通常鑑定ノートやメッセージ案を生成しません。", status: "内部方針決定済み・実装証拠待ち", decisionIds: ["OP-034"] },
            { label: "needs_review", summary: "本番取扱いが別途承認されるまで決済へ進めず、通常鑑定ノートやメッセージ案を生成しません。", status: "内部方針決定済み・実装証拠待ち", decisionIds: ["OP-034"] },
          ]} />
          <nav aria-label="Safety審査状態" className="mt-6 grid gap-3 sm:grid-cols-2">
            <Link href="/review/request/rejected" className="inline-flex min-h-12 items-center justify-between rounded-lg border border-[#8a6d2e] bg-[#fff8e9] px-4 py-3 font-semibold focus:outline-none focus:ring-2 focus:ring-[#8a6d2e] focus:ring-offset-2">
              rejected 審査状態 <span aria-hidden="true">→</span>
            </Link>
            <Link href="/review/request/needs-review" className="inline-flex min-h-12 items-center justify-between rounded-lg border border-[#8a6d2e] bg-[#fff8e9] px-4 py-3 font-semibold focus:outline-none focus:ring-2 focus:ring-[#8a6d2e] focus:ring-offset-2">
              needs_review 審査状態 <span aria-hidden="true">→</span>
            </Link>
          </nav>
        </ContentSection>

        <ContentSection eyebrow="PAYMENT BOUNDARY" title="Safety-before-payment">
          <p className="leading-8">
            原則として決済前にSafety確認を行います。現在のM1には決済がなく、blocked状態から購入確認・通常レポートへ進めません。将来、サービス側の不具合で決済後に通常鑑定対象外と判明した場合は、生成を停止して未確定の返金方針へ接続する設計候補です。
          </p>
        </ContentSection>

        <ContentSection eyebrow="EMERGENCY BOUNDARY" title="緊急支援との境界" tone="night">
          <p className="leading-8">
            月の返事は、緊急支援、警察、医療、心理支援、法律相談、公的相談窓口の代替ではなく、緊急対応を行いません。
          </p>
          <p className="mt-4 leading-8 text-[#d5cab9]">
            相談先の名称、リンク、電話番号は、公式情報、対象地域、用途、確認日を検証した後にのみ掲載します。現在は未検証の支援情報を掲載しません。
          </p>
          <div className="mt-6"><DecisionGrid decisions={[
            { label: "公式支援情報", summary: "検証済みの公式支援情報はまだ登録されていません。", status: "外部証拠待ち", decisionIds: ["OP-033"] },
          ]} /></div>
        </ContentSection>

        <ContentSection eyebrow="CONTACT PREPARATION" title="お問い合わせ準備表示">
          <p className="leading-8 text-[#67596b]">お問い合わせ受付は稼働していません。構成だけを確認できます。</p>
          <Link href="/contact" className="mt-5 inline-flex min-h-12 items-center rounded-lg border border-[#8a6d2e] bg-[#2a2440] px-5 py-3 font-semibold text-[#fff8e8] focus:outline-none focus:ring-2 focus:ring-[#8a6d2e] focus:ring-offset-2">
            非稼働のお問い合わせ準備ページを確認する
          </Link>
        </ContentSection>
      </div>
    </LegalReviewScaffold>
  );
}
