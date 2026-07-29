import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LunarArc } from "@/components/brand/LunarArc";
import { MoonSeal } from "@/components/brand/MoonSeal";
import { RuntimeAssessmentForm } from "@/components/runtime/RuntimeAssessmentForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "内部AI鑑定Runtime | 月の返事",
  description: "M2-P3-Aの開発専用Runtime Vertical Sliceです。",
  robots: {
    index: false,
    follow: false,
  },
};

export default function RuntimeReviewPage() {
  if (
    process.env.NODE_ENV === "production" ||
    process.env.M2_INTERNAL_RUNTIME_ENABLED !== "true"
  ) {
    notFound();
  }

  return (
    <main className="request-page runtime-review-page">
      <section className="request-page__intro" aria-labelledby="runtime-title">
        <LunarArc tone="night" position="top-right" />
        <div className="page-shell request-page__intro-inner">
          <div className="request-page__brand">
            <MoonSeal />
            <span>月の返事</span>
          </div>
          <p>Internal AI Assessment Runtime</p>
          <h1 id="runtime-title">M2 Runtime Vertical Slice</h1>
          <span>
            依頼シートからPB-01〜PB-06、Stageごとの保存、鑑定ノート表示までを
            開発環境内で確認します。
          </span>
          <div className="runtime-test-warning" role="alert">
            <strong>テストデータのみ</strong>
            <span>
              実在人物、実ユーザー、個人情報、機密情報を入力しないでください。
              この画面は開発環境専用で、公開導線はありません。
            </span>
          </div>
        </div>
      </section>
      <RuntimeAssessmentForm />
    </main>
  );
}
