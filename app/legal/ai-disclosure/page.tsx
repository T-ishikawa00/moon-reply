import type { Metadata } from "next";
import {
  ContentSection,
  DecisionGrid,
  LegalPageHeader,
  LegalReviewScaffold,
  ReviewCallout,
} from "@/components/legal/LegalReview";

export const metadata: Metadata = {
  title: "AI利用説明 審査表示 | 月の返事",
  description: "AIの予定役割、限界、データ最小化、現在のM1非稼働を分けて確認する公開前の審査表示です。",
};

export default function AiDisclosureReviewPage() {
  return (
    <LegalReviewScaffold currentPath="/legal/ai-disclosure">
      <LegalPageHeader
        eyebrow="AI DISCLOSURE REVIEW"
        title="AI利用説明 審査表示"
        description="AIが将来行う予定の整理・分析と、AIができないこと、現在のM1 reviewで実際に動作していないことを区別します。"
      />
      <div className="mx-auto max-w-5xl space-y-8 px-4 py-10 sm:px-8 sm:py-14">
        <ReviewCallout strong="現在のM1ページは決定的なfixture dataを表示し、AI APIを呼び出しません。">
          表示中のサンプルと審査用結果は固定データです。実際のAI生成、外部事業者処理、外部送信、学習実績、納品実績を示しません。
        </ReviewCallout>

        <ContentSection eyebrow="INTENDED USE" title="AIが行う予定のこと">
          <p className="leading-8">
            月の返事は、利用者が入力した恋愛関係の状況とメッセージをAIで整理・分析し、判断材料、文面案、短期的な行動案を恋のメッセージ鑑定ノートとして提供する予定です。AI利用は申込前と鑑定ノート内で明示します。
          </p>
          <p className="mt-4 leading-8 text-[#67596b]">
            分析根拠は利用者入力です。タロット、占星術、生年月日分析、数秘術、霊感その他の占術・超自然的手法や外部調査は使用しません。
          </p>
        </ContentSection>

        <ContentSection eyebrow="LIMITS" title="AIができないこと" tone="ivory">
          <ul className="grid gap-3 md:grid-cols-2">
            {[
              "相手の本心を知り、事実として断定すること",
              "返信が来ることを保証すること",
              "復縁を保証すること",
              "未来が特定方向へ進むことを保証すること",
              "関係改善を保証すること",
              "提案文面が期待どおりの効果を生むことを保証すること",
            ].map((item) => <li key={item} className="rounded-lg border border-[#d8c596] bg-[#fff8e9] p-4 leading-7">{item}</li>)}
          </ul>
          <ReviewCallout strong="誤り・不完全性があります">
            AI出力には誤り、不完全な内容、矛盾、利用者の状況に適さない内容が含まれる可能性があります。
          </ReviewCallout>
        </ContentSection>

        <ContentSection eyebrow="PROFESSIONAL BOUNDARY" title="専門サービスではありません">
          <p className="leading-8">
            月の返事は医療、診断、治療、心理療法、専門的カウンセリング、法律相談、調査サービスではありません。重要な健康、安全、法律、金銭、人生上の判断をAI出力だけで決めないでください。出力は利用者自身の判断を代替しません。
          </p>
        </ContentSection>

        <ContentSection eyebrow="SAFETY BOUNDARY" title="通常鑑定対象外・危険相談の境界" tone="night">
          <p className="leading-8">
            自傷、他害、DV・暴力・強い恐怖、待ち伏せ、脅迫、監視、不正ログイン、個人情報晒し、未成年との不適切な恋愛・面会、違法行為その他の危険相談は、通常の恋愛鑑定として扱いません。
          </p>
          <p className="mt-4 leading-8 text-[#d5cab9]">
            決済前に停止し、通常鑑定ノートやメッセージ案を生成しない方針です。月の返事は緊急支援サービスではなく、未検証の相談先、リンク、電話番号は掲載しません。
          </p>
        </ContentSection>

        <ContentSection
          eyebrow="FUTURE PAYLOAD DESIGN"
          title="将来のAIペイロード最小化"
          intro="将来の本番環境では、生成に必要な最小限の相談内容、関係性、メッセージ文面、Safety分類だけを送る方針です。"
        >
          <ReviewCallout strong="生成ペイロードから除外する方針">
            メールアドレス、決済識別子、外部事業者の顧客ID、購入ID、内部token、秘密鍵その他の生成に不要な直接識別子は送らない方針です。実際のサーバー側ペイロード検証は未完了です。
          </ReviewCallout>
        </ContentSection>

        <ContentSection
          eyebrow="UNRESOLVED AI PROCESSING"
          title="外部処理の未確定状態"
          intro="固定の保持期間も、保持されないとの断定も行いません。"
          tone="ivory"
        >
          <DecisionGrid decisions={[
            { label: "AI事業者", summary: "契約、プライバシー、安全性、利用可否の外部証拠がありません。", status: "外部証拠待ち", decisionIds: ["OP-015"] },
            { label: "利用エンドポイント", summary: "実際に利用するAPI経路は未確定です。", status: "外部証拠待ち", decisionIds: ["OP-016"] },
            { label: "アカウントのデータ制御設定", summary: "組織・プロジェクト設定の証拠がありません。", status: "外部証拠待ち", decisionIds: ["OP-017"] },
            { label: "処理地域・国外処理", summary: "事業者、契約、データフローが未確定のため法的整理前です。", status: "専門家確認待ち", decisionIds: ["OP-032"] },
            { label: "保持・削除条件", summary: "固定期間も保持なしも主張しません。最新の公式情報と実設定の確認が必要です。", status: "外部証拠待ち", decisionIds: ["OP-017", "OP-025"] },
          ]} />
        </ContentSection>

        <ContentSection eyebrow="CANDIDATE REPORT FOOTER" title="鑑定ノート固定フッター候補">
          <span className="inline-flex min-h-10 items-center rounded-full border border-[#9b7b3a] bg-[#f5ead2] px-4 py-2 text-sm font-bold">最終承認前の候補</span>
          <blockquote className="mt-5 border-l-4 border-[#8a6d2e] bg-[#fffdf5] p-5 font-serif text-lg leading-9">
            このレポートは、入力された情報をもとにAIが整理・分析した判断材料です。相手の本心や将来の出来事を断定・保証するものではありません。医療・心理・法律上の助言ではありません。
          </blockquote>
          <p className="mt-4 leading-8 text-[#67596b]">法務レビュー、実仕様、他文書との整合確認を経るまで公開用の確定文言ではありません。</p>
        </ContentSection>
      </div>
    </LegalReviewScaffold>
  );
}
