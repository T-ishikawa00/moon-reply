import type { Metadata } from "next";
import {
  CustomerLegalHeader,
  CustomerLegalScaffold,
  CustomerNotice,
  LegalSectionList,
} from "@/components/legal/LegalDocument";
import { termsSections } from "@/lib/legal/current-content";

export const metadata: Metadata = {
  title: "利用規約 | 月の返事",
  description: "月の返事と恋のメッセージ鑑定ノートの現在の利用条件です。",
};

export default function TermsPage() {
  return (
    <CustomerLegalScaffold currentPath="/legal/terms">
      <CustomerLegalHeader
        title="利用規約"
        description="月の返事と恋のメッセージ鑑定ノートをご利用いただく際の条件です。"
      />
      <div className="legal-document-body">
        <CustomerNotice title="大切な点">
          <p>
            恋のメッセージ鑑定ノートはAIを活用した判断材料です。相手の本心や未来を断定せず、返信、復縁、関係改善を保証しません。
          </p>
        </CustomerNotice>
        <LegalSectionList sections={termsSections} />
      </div>
    </CustomerLegalScaffold>
  );
}
