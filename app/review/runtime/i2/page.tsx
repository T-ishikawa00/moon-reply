import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RuntimeAssessmentNote } from "@/components/runtime/RuntimeAssessmentNote";
import {
  m2P4I2RequestedTopics,
  m2P4I2ReviewFixture,
} from "@/lib/assessment/runtime/review/m2-p4-i2-review-fixture";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "I2固定プレビュー | 月の返事",
  description: "M2-P4-I2のHuman Visual QA専用固定プレビューです。",
  robots: {
    index: false,
    follow: false,
  },
};

export default function M2P4I2ReviewPage() {
  if (
    process.env.NODE_ENV === "production" ||
    process.env.M2_INTERNAL_RUNTIME_ENABLED !== "true"
  ) {
    notFound();
  }

  return (
    <main className="reading-note-page runtime-i2-preview">
      <p className="runtime-i2-preview__label">
        I2固定プレビュー / API・DB未使用
      </p>
      <RuntimeAssessmentNote
        assessment={m2P4I2ReviewFixture}
        requestedTopics={m2P4I2RequestedTopics}
      />
    </main>
  );
}
