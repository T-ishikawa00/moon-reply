import type { Metadata } from "next";
import {
  ContentSection,
  DecisionGrid,
  LegalPageHeader,
  LegalReviewScaffold,
  ReviewCallout,
} from "@/components/legal/LegalReview";
import {
  ordinaryRefundCases,
  paymentIntegrityCases,
} from "@/lib/legal/review-content";

export const metadata: Metadata = {
  title: "返金方針 審査表示 | 月の返事",
  description: "税込980円の通常返金と、意図しない請求のPayment Integrity是正を分けて確認する公開前の返金審査表示です。",
};

export default function RefundReviewPage() {
  return (
    <LegalReviewScaffold currentPath="/legal/refund">
      <LegalPageHeader
        eyebrow="REFUND REVIEW"
        title="返金方針 審査表示"
        description="通常の商品返金と、意図しない請求の是正を別のルールとして確認します。返金機能、固定処理期間、外部事業者の実行方法は未確定です。"
      />
      <div className="legal-document-body">
        <ReviewCallout strong="返金・取消・請求是正の実行機能はありません。">
          以下は受入済みのB2方針をレビューする表示です。外部事業者の実仕様、実装、利用者表示、適用される最新の法的義務との照合前であり、処理日数も約束しません。「いかなる場合も返金しない」とするものではなく、法令上の権利を制限しません。
        </ReviewCallout>

        <ContentSection
          eyebrow="ORDINARY PRODUCT REFUND"
          title="通常の商品返金"
          intro="正しく成立した税込980円の一度きりの購入についての方向です。0円または980円全額を基本とし、実行済みとは表示しません。"
        >
          <DecisionGrid decisions={ordinaryRefundCases} />
        </ContentSection>

        <ContentSection
          eyebrow="PAYMENT INTEGRITY"
          title="意図しない請求の是正"
          intro="重複、誤額、誤った利用者・相談、安全確認のすり抜けなど、実際の経済的な誤りを直す考え方です。通常の商品返金とは別に扱います。"
          tone="night"
        >
          <p className="mb-6 leading-8 text-[#d5cab9]">
            通常の税込980円の請求1件だけが誤りなら980円の是正となり得ますが、複数請求や誤額などの実際の影響額を直すため、是正額を税込980円で打ち切りません。
          </p>
          <DecisionGrid decisions={paymentIntegrityCases} />
        </ContentSection>

        <ContentSection
          eyebrow="PROCESS STATUS"
          title="申請経路・実行方法・処理期間"
          intro="現在は返金申請機能も稼働する問い合わせ窓口もありません。"
          tone="ivory"
        >
          <DecisionGrid decisions={[
            { label: "申請経路", summary: "受付先、本人確認、購入の特定、誤メール対応は未決定です。", status: "運営者判断待ち", decisionIds: ["OP-007", "OP-008", "OP-027", "OP-028"] },
            { label: "返金・取消・是正方法", summary: "外部事業者で利用できる操作、条件、完了時点を確認していません。具体的な方法を断定しません。", status: "外部証拠待ち", decisionIds: ["OP-010", "OP-014"] },
            { label: "処理期間", summary: "固定期限や反映日数を示す証拠がないため、期間を約束しません。", status: "外部証拠待ち", decisionIds: ["OP-014"] },
          ]} />
        </ContentSection>
      </div>
    </LegalReviewScaffold>
  );
}
