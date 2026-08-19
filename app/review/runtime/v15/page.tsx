import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CustomerAssessmentNote } from "@/components/runtime/CustomerAssessmentNote";
import styles from "@/components/runtime/CustomerAssessmentNote.module.css";
import {
  V1_D_OFFLINE_EVIDENCE_LABEL,
  selectV1DProductReviewFixture,
  v1DProductReviewFixtures,
} from "@/lib/assessment/runtime/review/m2-p4-v15-product-rereview-fixtures";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "V1-D オフライン鑑定ノート確認 | 月の返事",
  description: "V1-Dの固定fixtureだけを使う非公開Product確認画面です。",
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

export default async function V15OfflineProductReviewPage({
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
  const selectedFixture = selectV1DProductReviewFixture(fixtureId);

  return (
    <main className={styles.reviewPage}>
      <div className={styles.reviewShell}>
        <header className={styles.reviewHeader}>
          <p>{V1_D_OFFLINE_EVIDENCE_LABEL}</p>
          <h1>V15 Product re-review harness</h1>
          <p>
            固定したsynthetic / historical referenceだけを表示します。Provider、DB、Payment、networkは実行せず、実V15品質や980円価値の証拠にはなりません。
          </p>
        </header>

        <nav className={styles.fixtureNavigation} aria-label="V1-D確認fixtureを選ぶ">
          <p>オフライン確認fixture</p>
          <ul className={styles.fixtureList}>
            {v1DProductReviewFixtures.map((fixture) => {
              const isActive = fixture.id === selectedFixture.id;
              return (
                <li key={fixture.id}>
                  <Link
                    className={`${styles.fixtureLink} ${
                      isActive ? styles.fixtureLinkActive : ""
                    }`}
                    href={{
                      pathname: "/review/runtime/v15",
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

        <p className={styles.fixtureSummary}>
          {selectedFixture.summary}
          {" / provenance: "}
          {selectedFixture.provenance}
          {" / route expectation: "}
          {selectedFixture.routeExpectation}
        </p>
        <CustomerAssessmentNote projection={selectedFixture.projection} />
      </div>
    </main>
  );
}
