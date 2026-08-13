import type { Metadata } from "next";
import {
  ContentSection,
  DecisionGrid,
  FactRows,
  LegalPageHeader,
  LegalReviewScaffold,
  ReviewCallout,
} from "@/components/legal/LegalReview";
import type { ReviewDecision } from "@/lib/legal/review-content";

export const metadata: Metadata = {
  title: "プライバシー 審査表示 | 月の返事",
  description: "将来のデータ取扱い計画と現在の内部レビュー処理を区別して確認する、公開前のプライバシー審査表示です。",
};

const plannedCollection = [
  "配信・回復用メールアドレスと、その確認状態・制御・監査記録",
  "ニックネーム",
  "「私は18歳以上です」の確認値・状態・監査記録",
  "相手との関係性・現在の状況",
  "相談内容とメッセージ文面",
  "安全確認の入力と結果",
  "同意記録",
  "依頼・購入・決済の識別情報",
  "生成された鑑定結果と生成に関する記録",
  "結果の配信・メール送信に関する記録",
  "サポート、返金、プライバシー、販売事業者情報の開示請求と対応記録",
  "IPアドレス、User-Agent、アクセス日時、障害・セキュリティ記録その他の技術情報",
  "任意のマーケティング同意を使用する場合の同意・撤回記録",
] as const;

const doNotEnter = [
  "本名",
  "住所",
  "電話番号",
  "パスワードやログイン情報",
  "正確な位置情報",
  "相手のフルネーム",
  "第三者の秘密情報",
  "スクリーンショット",
] as const;

const purposes = [
  "鑑定依頼の受付と処理",
  "安全確認と通常鑑定対象外ケースの停止",
  "決済状況の確認と購入管理",
  "鑑定ノートの生成",
  "結果ページと結果通知の提供",
  "問い合わせ、再送、訂正、削除依頼への対応",
  "返金、重複決済、不正利用、チャージバックへの対応",
  "障害、セキュリティ事象、不具合の調査",
  "AIによる状況整理・メッセージ分析と品質改善",
  "法令、規約、外部事業者の要請への対応",
  "利用者が任意に同意した場合のマーケティング",
] as const;

const processingDecisions: readonly ReviewDecision[] = [
  { label: "運営者", summary: "法的氏名、屋号、プライバシー問い合わせ窓口は未確定です。", status: "運営者判断待ち", decisionIds: ["OP-001", "OP-002", "OP-003", "OP-007", "OP-008"] },
  { label: "AI処理", summary: "事業者、エンドポイント、処理地域、保持・削除条件、アカウント設定は未確定です。", status: "外部証拠待ち", decisionIds: ["OP-015", "OP-016", "OP-017"] },
  { label: "データ保管基盤", summary: "利用機能、プロジェクトのリージョン、バックアップ、ログ、削除方法を実装と照合できていません。", status: "外部証拠待ち", decisionIds: ["OP-018"] },
  { label: "決済処理", summary: "事業者、支払方法、支払時期、受領情報、法的整理は未確定です。", status: "外部証拠待ち", decisionIds: ["OP-010", "OP-011", "OP-012"] },
  { label: "メール処理", summary: "結果通知・運用メールに用いる事業者、地域、保持・削除条件は未確定です。", status: "外部証拠待ち", decisionIds: ["OP-019"] },
  { label: "委託・第三者・国外処理", summary: "実際の契約、処理地域、データフローがないため法的分類を断定しません。", status: "外部証拠待ち", decisionIds: ["OP-032"] },
  { label: "Cookie・analytics", summary: "導入有無、取得項目、目的、拒否方法は未決定です。", status: "運営者判断待ち", decisionIds: ["OP-020", "OP-021"] },
];

const retentionFacts = [
  { label: "相談本文", value: "保存期間：未確定。購入・会計記録より短くする方向" },
  { label: "安全確認記録", value: "保存期間：未確定。安全上必要な最小限" },
  { label: "鑑定結果", value: "保存期間：未確定。再アクセス要件と調整" },
  { label: "購入・会計記録", value: "保存期間：未確定。法令・返金・チャージバック要件と調整" },
  { label: "AI生成ログ", value: "保存期間：未確定。メタデータ中心でプロンプト原文を最小化する方向" },
  { label: "メール送信記録", value: "保存期間：未確定。再送・到達確認要件と調整" },
  { label: "問い合わせ記録", value: "保存期間：未確定。対応・紛争・削除請求要件と調整" },
] as const;

export default function PrivacyReviewPage() {
  return (
    <LegalReviewScaffold currentPath="/legal/privacy">
      <LegalPageHeader
        eyebrow="PRIVACY REVIEW"
        title="プライバシー 審査表示"
        description="将来の本番設計案と、現在の内部レビュー環境で実際に起き得る処理を混同しないための構成確認です。"
        showDates
      />
      <div className="legal-document-body">
        <ReviewCallout strong="現在のレビュー環境に本番の永続化・外部AI・決済・メール送信・問い合わせ処理はありません。">
          内部レビューが有効な場合、相談内容と安全確認の入力が同一オリジンの内部評価先へ送信され、確認処理されることがあります。本番データの保存、外部AI事業者での処理、決済処理、メール送信、本番問い合わせ受付が稼働していることは示しません。
        </ReviewCallout>

        <ContentSection eyebrow="OPERATOR STATUS" title="運営者の状態">
          <DecisionGrid decisions={[processingDecisions[0]]} />
        </ContentSection>

        <ContentSection
          eyebrow="PLANNED COLLECTION"
          title="取得を予定・検討している情報"
          intro="以下は実装後の利用目的に必要な範囲で取得する可能性がある項目です。現在すべてを取得しているとの表示ではありません。"
          tone="ivory"
        >
          <ul className="grid gap-3 md:grid-cols-2">
            {plannedCollection.map((item) => <li key={item} className="rounded-lg border border-[#d8c596] bg-[#fff8e9] p-4 leading-7">{item}</li>)}
          </ul>
          <p className="mt-5 leading-8 text-[#67596b]">年齢適格性は、必須チェックボックス「私は18歳以上です」の確認値と必要な監査記録を扱う方向です。その確認だけを目的として年齢層、生年月日、身分証明書を取得しません。本番のサーバー側確認は未実装です。</p>
        </ContentSection>

        <ContentSection eyebrow="DO NOT ENTER" title="入力しないよう求める情報">
          <ul className="grid gap-3 sm:grid-cols-2">
            {doNotEnter.map((item) => <li key={item} className="rounded-lg border border-[#d8c596] bg-[#fffdf5] p-4 leading-7">{item}</li>)}
          </ul>
          <p className="mt-5 leading-8 text-[#67596b]">入力検知は匿名化を保証しません。不要な個人情報を入力しないための警告・最小化手段として設計します。</p>
        </ContentSection>

        <ContentSection eyebrow="PURPOSES" title="利用目的の計画" tone="ivory">
          <ol className="grid list-decimal gap-3 pl-6 leading-8 md:grid-cols-2">
            {purposes.map((item) => <li key={item} className="pl-1">{item}</li>)}
          </ol>
          <p className="mt-5 leading-8 text-[#67596b]">マーケティング同意は任意かつ結果通知と分離し、購入・結果受領の条件にしない方針です。</p>
        </ContentSection>

        <ContentSection
          eyebrow="AI PAYLOAD MINIMIZATION"
          title="AIへ送る情報の最小化"
          intro="将来AIへ送るのは、鑑定ノート生成に必要な最小限の相談内容、関係性、メッセージ文面、安全確認の結果とする方針です。"
        >
          <ReviewCallout strong="AI生成のために送らない方針の情報">
            メールアドレス、決済識別子、外部事業者の顧客ID、購入ID、内部トークン、秘密鍵、IPアドレス、User-AgentはAI生成に不要であり、送信しない方針です。実際のサーバー側送信内容の検証は未完了です。
          </ReviewCallout>
          <div className="mt-6"><DecisionGrid decisions={[processingDecisions[1]]} /></div>
        </ContentSection>

        <ContentSection
          eyebrow="STORAGE, PAYMENT & EMAIL"
          title="保管・決済・メール処理"
          intro="将来利用する処理区分を示すだけで、各外部事業者や地域、保持条件が確定した表示ではありません。"
          tone="ivory"
        >
          <DecisionGrid decisions={processingDecisions.slice(2, 5)} />
          <p className="mt-5 leading-8 text-[#67596b]">カード番号等を月の返事のサーバーで直接保持しない方向ですが、実装方式確定後のデータフロー確認が必要です。</p>
        </ContentSection>

        <ContentSection eyebrow="THIRD PARTY & COOKIES" title="委託・第三者・国外処理とCookie">
          <DecisionGrid decisions={processingDecisions.slice(5)} />
        </ContentSection>

        <ContentSection eyebrow="RETENTION" title="保存期間" intro="固定の期間も、保存なしとの断定も行いません。" tone="ivory">
          <FactRows facts={retentionFacts} />
          <div className="mt-6">
            <DecisionGrid decisions={[
              { label: "保存期間全般", summary: "データ種別ごとの必要性、法令、返金・会計、削除、安全、外部条件を確認して決定します。", status: "外部証拠待ち", decisionIds: ["OP-022", "OP-023", "OP-024", "OP-025"] },
            ]} />
          </div>
        </ContentSection>

        <ContentSection eyebrow="SECURITY MEASURES" title="安全管理措置の検討" intro="未実装の措置を実装済みとは表示しません。">
          <ul className="grid gap-3 sm:grid-cols-2">
            {["アクセス制御", "秘密情報の分離", "最小権限", "暗号化通信", "必要なログ・監査記録", "インシデント対応手順", "外部事業者の確認・管理"].map((item) => <li key={item} className="rounded-lg border border-[#d8c596] bg-[#fffdf5] p-4 leading-7">実装候補：{item}</li>)}
          </ul>
          <ReviewCallout strong="実装検証：未完了">具体的措置は実装・運用証拠と照合後に最終化します。</ReviewCallout>
        </ContentSection>

        <ContentSection eyebrow="DATA SUBJECT REQUESTS" title="開示・訂正・削除の手続" tone="ivory">
          <p className="leading-8">受付先、本人確認、対象範囲、法令・会計・決済上の保持例外、結果URLの失効、外部事業者への削除依頼、手数料、対応期間は未確定です。</p>
          <div className="mt-6"><DecisionGrid decisions={[
            { label: "請求受付と本人確認", summary: "現在は受付窓口も確定した対応期間もありません。", status: "運営者判断待ち", decisionIds: ["OP-007", "OP-008", "OP-009", "OP-028"] },
          ]} /></div>
        </ContentSection>

        <ContentSection eyebrow="REVISIONS & CONTACT" title="改定と問い合わせ">
          <p className="leading-8">改定日、告知方法、重大な変更の取扱い、問い合わせ先はいずれも未確定です。施行日：未確定、最終更新日：未確定です。</p>
          <div className="mt-6"><DecisionGrid decisions={[
            { label: "改定・問い合わせ", summary: "公開前に実在する窓口、運用体制、最終文言を確認する必要があります。", status: "運営者判断待ち", decisionIds: ["OP-007", "OP-008", "OP-009", "OP-032"] },
          ]} /></div>
        </ContentSection>
      </div>
    </LegalReviewScaffold>
  );
}
