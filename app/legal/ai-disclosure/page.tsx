import type { Metadata } from "next";
import {
  CustomerLegalHeader,
  CustomerLegalScaffold,
  CustomerNotice,
  LegalContentSection,
} from "@/components/legal/LegalDocument";
import { nonGuaranteeFacts, unusedMethods } from "@/lib/legal/current-content";

export const metadata: Metadata = {
  title: "AI利用について | 月の返事",
  description: "月の返事におけるAIの役割、限界、安全と専門サービスの境界を説明します。",
};

export default function AiDisclosurePage() {
  return (
    <CustomerLegalScaffold currentPath="/legal/ai-disclosure">
      <CustomerLegalHeader
        title="AI利用について"
        description="AIが行うこと、できないこと、鑑定ノートを利用するときの大切な境界を説明します。"
      />
      <div className="legal-document-body">
        <CustomerNotice title="AIの出力は判断材料です">
          <p>
            AIの出力には、誤り、不完全な内容、矛盾、利用者の状況に合わない内容が含まれることがあります。最終的な判断と行動は利用者自身が行ってください。
          </p>
        </CustomerNotice>

        <LegalContentSection title="AIが行うこと">
          <p>
            利用者が入力した恋愛関係の状況、相談内容、メッセージをAIで整理・分析し、判断材料、文面案、短期的な行動案を恋のメッセージ鑑定ノートとしてまとめます。
          </p>
          <p>
            必要に応じて追加確認を行いますが、通常は0回、本当に必要な場合のみ最大1回です。入力が短いことだけを理由に利用不可とはしません。
          </p>
        </LegalContentSection>

        <LegalContentSection title="AIが保証できないこと" tone="ivory">
          <ul className="legal-plain-list">
            {nonGuaranteeFacts.map((item) => <li key={item}>{item}</li>)}
          </ul>
          <p>
            AIは相手本人に確認した事実を持っているわけではなく、入力された情報から考えられる範囲を整理します。
          </p>
        </LegalContentSection>

        <LegalContentSection title="使用しない方法">
          <ul className="legal-plain-list">
            {unusedMethods.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </LegalContentSection>

        <LegalContentSection title="専門サービスとの境界" tone="night">
          <p>
            月の返事は、医療、診断、治療、心理療法、専門的カウンセリング、法律相談、調査、緊急支援の代わりではありません。健康、安全、法律その他の重要な判断をAIの出力だけで決めないでください。
          </p>
        </LegalContentSection>

        <LegalContentSection title="安全上の境界">
          <p>
            自傷・他害、暴力、強い恐怖、嫌がらせ、ストーカー行為、明示された境界の回避、違法行為などを含む相談は、通常の恋愛メッセージ鑑定として扱いません。危険な行為や連絡を後押しする文面は作成しません。
          </p>
        </LegalContentSection>
      </div>
    </CustomerLegalScaffold>
  );
}
