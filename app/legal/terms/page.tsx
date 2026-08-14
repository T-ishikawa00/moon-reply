import type { Metadata } from "next";
import {
  LegalPageHeader,
  LegalReviewScaffold,
  LegalSectionList,
  ReviewCallout,
} from "@/components/legal/LegalReview";
import { termsReviewSections } from "@/lib/legal/review-content";

export const metadata: Metadata = {
  title: "利用規約 審査表示 | 月の返事",
  description: "受入済みのB2方針に沿って、条項構造と未決定事項を確認する公開前の利用規約審査表示です。",
};

export default function TermsReviewPage() {
  return (
    <LegalReviewScaffold currentPath="/legal/terms">
      <LegalPageHeader
        eyebrow="TERMS REVIEW"
        title="利用規約 審査表示"
        description="受入済みのB2方針を反映した、受入済みB3レビュー実装として確認します。現在拘束力のある利用条件でも、法務公開済みの規約でもありません。"
        showDates
      />
      <div className="legal-document-body">
        <ReviewCallout strong="このページは現在の利用契約条件ではありません。">
          支払、提供、返金、問い合わせ、管轄その他の未確定事項を明示しています。同意チェックボックス、同意記録、決済はありません。最新の公式情報と実仕様の確認は必要ですが、専門家相談は必要に応じた任意のエスカレーションです。
        </ReviewCallout>
        <LegalSectionList sections={termsReviewSections} />
      </div>
    </LegalReviewScaffold>
  );
}
