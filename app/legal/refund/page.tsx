import type { Metadata } from "next";
import {
  ContentSection,
  DecisionGrid,
  LegalPageHeader,
  LegalReviewScaffold,
  ReviewCallout,
} from "@/components/legal/LegalReview";
import { refundCases } from "@/lib/legal/review-content";

export const metadata: Metadata = {
  title: "返金方針 審査表示 | 月の返事",
  description: "税込980円の単発鑑定ノートについて、確定前のケース別方針案を確認する返金審査表示です。",
};

export default function RefundReviewPage() {
  return (
    <LegalReviewScaffold currentPath="/legal/refund">
      <LegalPageHeader
        eyebrow="REFUND REVIEW"
        title="返金方針 審査表示"
        description="ケースごとの候補対応を確認するための現時点の方針案です。自動返金、固定期限、確定済み返金条件を示すページではありません。"
      />
      <div className="mx-auto max-w-5xl space-y-8 px-4 py-10 sm:px-8 sm:py-14">
        <ReviewCallout strong="決済事業者・専門家確認待ち">
          返金条件は外部事業者の仕様、実装、利用者表示、適用法令の確認前です。「いかなる場合も返金しない」とするものではなく、法令上の権利を制限しません。
        </ReviewCallout>

        <ContentSection
          eyebrow="CASE MATRIX"
          title="現時点の方針案"
          intro="各行は候補対応です。確定方針、返金保証、自動処理の存在を表しません。"
        >
          <DecisionGrid decisions={refundCases} />
        </ContentSection>

        <ContentSection
          eyebrow="PROCESS STATUS"
          title="申請・返金方法・処理時間"
          intro="現在は返金申請機能も稼働する問い合わせ窓口もありません。"
          tone="ivory"
        >
          <DecisionGrid decisions={[
            { label: "申請経路", summary: "受付先、本人確認、購入特定情報、誤メール対応は未決定です。", status: "運営者判断待ち", decisionIds: ["OP-007", "OP-008", "OP-027", "OP-028"] },
            { label: "返金方法", summary: "元の支払方法へ行う方向ですが、外部仕様確認前で確定していません。", status: "外部証拠待ち", decisionIds: ["OP-010"] },
            { label: "処理時間・反映", summary: "固定期限、反映日数、返金可能期間、手数料の取扱いはいずれも未確認です。", status: "外部証拠待ち", decisionIds: ["OP-014"] },
          ]} />
        </ContentSection>

        <ContentSection
          eyebrow="SAFETY EXCEPTION"
          title="Safety判定に関する返金候補"
          tone="night"
        >
          <p className="leading-8">
            通常鑑定対象外の相談は決済前に停止する設計です。検知漏れ、ルーティング不備その他のサービス側問題で決済された場合は、通常の恋愛鑑定ノートとメッセージ案の生成を停止し、全額返金の候補として扱う方向です。
          </p>
          <p className="mt-4 leading-8 text-[#d5cab9]">
            現在のM1には決済、返金自動化、監査記録、外部事業者連携がありません。初期MVPの needs_review と rejected の購入不可方針だけが内部決定済みです。
          </p>
        </ContentSection>
      </div>
    </LegalReviewScaffold>
  );
}
