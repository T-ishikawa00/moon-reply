import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CustomerAssessmentNote } from "@/components/runtime/CustomerAssessmentNote";
import styles from "@/components/runtime/CustomerAssessmentNote.module.css";
import {
  customerAssessmentReviewFixtures,
  selectCustomerAssessmentReviewFixture,
} from "@/lib/assessment/runtime/review/m2-p4-v12-customer-projection-fixtures";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "顧客向け鑑定ノート確認 | 月の返事",
  description: "顧客向け鑑定ノートの非公開確認画面です。",
  robots: {
    index: false,
    follow: false,
  },
};

type ReviewPageProps = {
  searchParams: Promise<{
    fixture?: string | string[];
  }>;
};

export default async function CustomerAssessmentReviewPage({
  searchParams,
}: ReviewPageProps) {
  if (
    process.env.NODE_ENV === "production" ||
    process.env.M2_INTERNAL_RUNTIME_ENABLED !== "true"
  ) {
    notFound();
  }

  const fixtureQuery = (await searchParams).fixture;
  const fixtureId = Array.isArray(fixtureQuery) ? fixtureQuery[0] : fixtureQuery;
  const selectedFixture = selectCustomerAssessmentReviewFixture(fixtureId);

  return (
    <main className={styles.reviewPage}>
      <div className={styles.reviewShell}>
        <header className={styles.reviewHeader}>
          <p>非公開レビュー / 固定データのみ</p>
          <h1>顧客向け鑑定ノート</h1>
          <p>
            表示の比例性、文案の見つけやすさ、任意項目の出し分けを確認するための画面です。
          </p>
        </header>

        <nav className={styles.fixtureNavigation} aria-label="確認ケースを選ぶ">
          <p>確認ケース</p>
          <ul className={styles.fixtureList}>
            {customerAssessmentReviewFixtures.map((fixture) => {
              const isActive = fixture.id === selectedFixture.id;
              return (
                <li key={fixture.id}>
                  <Link
                    className={`${styles.fixtureLink} ${
                      isActive ? styles.fixtureLinkActive : ""
                    }`}
                    href={{
                      pathname: "/review/runtime/v12",
                      query: { fixture: fixture.id },
                    }}
                    aria-current={isActive ? "page" : undefined}
                  >
                    {fixture.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <p className={styles.fixtureSummary}>{selectedFixture.summary}</p>
        <CustomerAssessmentNote projection={selectedFixture.projection} />
      </div>
    </main>
  );
}
