import type { ReactNode } from "react";

const problems = [
  "返事が来ないだけで、心が何度も画面に戻ってしまう",
  "送りたいけど、重いと思われたくない",
  "追いメッセージしたいけど、後悔しそうで怖い",
  "曖昧な関係に、どこまで時間を使っていいか分からない",
  "友達に同じ相談を何度もするのが申し訳ない",
];

const serviceIs = [
  "AIを活用した恋愛メッセージ鑑定ノート",
  "占い/エンタメ/感情整理目的",
  "チャットではなく、保存して見返せる鑑定書",
  "送る/待つ/距離を見るを整理するサービス",
];

const serviceIsNot = [
  "医療・診断・カウンセリング",
  "相手の本心断定",
  "復縁保証・返信保証",
  "相手を操作するサービス",
];

const deliverables = [
  "今夜の月の流れ",
  "今の恋の流れ",
  "相手の気持ちの可能性",
  "あなたが不安になっている核心",
  "送ろうとしている文面の見え方",
  "今夜の判定",
  "送るならこの一文",
  "3日以内の方針",
  "月からの一言",
  "保存用メモ",
];

const judgments = [
  "送っていい",
  "軽く送るならあり",
  "今夜は待つ",
  "今日は送らない方がいい",
];

const samples = [
  {
    id: "G001",
    title: "返信待ちの夜",
    body: "返事が来ない夜、\nその沈黙を「嫌われた」と決めるには\nまだ月明かりが足りません。",
  },
  {
    id: "G002",
    title: "追いメッセージの前に",
    body: "大切にされたいと思うことは、\n重いことではありません。\n\nただ、その願いを届けるなら、\nあなた自身を傷つけない言葉で。",
  },
  {
    id: "G003",
    title: "曖昧な関係の橋",
    body: "今夜は、不安で引きすぎるより、\n相手が差し出した小さな橋を\nやさしく渡ってみていい夜です。",
  },
];

const flowSteps = [
  "鑑定依頼フォームに入力",
  "安全チェック",
  "決済",
  "AIが判定と鑑定書を作成",
  "結果ページを表示",
  "メールで結果URLをお届け",
  "任意で感想回答",
];

const safetyNotes = [
  "AIを利用しています",
  "占い/エンタメ/感情整理目的です",
  "医療/診断/カウンセリングではありません",
  "相手の本心・返信・復縁を保証するものではありません",
  "自傷、DV、ストーカー、脅迫、未成年絡みなどは通常鑑定できません",
  "危険相談の場合は通常鑑定を提供しません",
  "実名や不要な個人情報は入力しないでください",
];

const faqs = [
  {
    question: "AIですか？",
    answer:
      "はい。AIを活用し、恋愛メッセージの状況整理と鑑定書作成を行います。",
  },
  {
    question: "相手の本心は分かりますか？",
    answer:
      "相手の本心を断定するものではありません。状況や文面から、可能性と次の一手を整理する鑑定です。",
  },
  {
    question: "必ず返信が来ますか？",
    answer: "返信や復縁を保証するものではありません。",
  },
  {
    question: "どんな相談でもできますか？",
    answer:
      "自傷、DV、ストーカー、脅迫、未成年絡みなどの危険相談は通常鑑定として扱いません。",
  },
  {
    question: "返金できますか？",
    answer:
      "デジタル鑑定書のため納品後は原則返金不可です。ただし、重複決済、提供不能、危険相談で通常鑑定不可の場合は返金対象です。",
  },
];

function Section({
  id,
  eyebrow,
  title,
  children,
  tone = "dark",
}: {
  id?: string;
  eyebrow: string;
  title: string;
  children: ReactNode;
  tone?: "dark" | "paper";
}) {
  return (
    <section
      id={id}
      className={tone === "paper" ? "bg-[#f4ead7] text-[#271f34]" : "bg-[#111028] text-[#fff7e8]"}
    >
      <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
        <p className="text-sm font-semibold tracking-[0.18em] text-[#c9aa69] uppercase">{eyebrow}</p>
        <h2 className="mt-3 max-w-3xl text-3xl font-semibold leading-[1.45] sm:text-4xl">{title}</h2>
        <div className="mt-10">{children}</div>
      </div>
    </section>
  );
}

function NoteCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-lg border border-[#d8c596]/35 bg-[#fff8e9] p-6 text-[#2b2335] shadow-[0_18px_50px_rgba(20,15,35,0.16)] ${className}`}>
      {children}
    </div>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0b1024] text-[#fff7e8]">
      <section className="relative overflow-hidden bg-[radial-gradient(circle_at_78%_16%,rgba(230,199,122,0.28),transparent_24rem),linear-gradient(145deg,#0b1024_0%,#171533_48%,#312347_100%)]">
        <div className="absolute right-8 top-8 h-28 w-28 rounded-full border border-[#efd58c]/30 bg-[#f7df95]/15 shadow-[0_0_80px_rgba(239,213,140,0.28)]" aria-hidden="true" />
        <div className="absolute left-0 top-24 h-px w-full bg-gradient-to-r from-transparent via-[#d6b86d]/40 to-transparent" aria-hidden="true" />
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-20 sm:px-8 lg:grid-cols-[1.08fr_0.92fr] lg:items-center lg:py-24">
          <div>
            <p className="text-sm font-semibold tracking-[0.2em] text-[#d9bb75]">月の返事</p>
            <h1 className="mt-5 max-w-3xl text-4xl font-semibold leading-[1.35] sm:text-5xl lg:text-6xl">
              送る前に読む、恋のメッセージ鑑定ノート。
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-[2] text-[#efe5d0]">
              返信待ち、追いメッセージ、曖昧な関係で不安になる夜に。
              「このメッセージを送っていいか」「今は待つべきか」を、月の鑑定書としてお返しします。
            </p>
            <div className="mt-9 flex flex-col gap-4 sm:flex-row sm:items-center">
              <a
                href="#request-placeholder"
                className="inline-flex min-h-12 items-center justify-center rounded-lg border border-[#f0d992]/70 bg-[#e5c46d] px-6 py-3 text-base font-semibold text-[#181326] shadow-[0_14px_36px_rgba(229,196,109,0.25)] transition hover:bg-[#f1d789] focus:outline-none focus:ring-2 focus:ring-[#f6de9f] focus:ring-offset-2 focus:ring-offset-[#111028]"
              >
                今夜の返事を鑑定する
              </a>
              <a
                href="#samples"
                className="inline-flex min-h-12 items-center justify-center rounded-lg border border-[#f4ead7]/25 px-6 py-3 text-base font-semibold text-[#fff7e8] transition hover:border-[#f4ead7]/55 hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-[#f6de9f] focus:ring-offset-2 focus:ring-offset-[#111028]"
              >
                鑑定サンプルを見る
              </a>
            </div>
            <p className="mt-4 max-w-xl text-sm leading-7 text-[#d8cdbd]">
              現在はMVP準備中です。次のStageで鑑定依頼フォームを実装します。
            </p>
          </div>

          <NoteCard className="relative bg-[#fff4dc]">
            <p className="text-sm font-semibold tracking-[0.16em] text-[#7a5d25]">今夜の鑑定書</p>
            <div className="mt-6 space-y-5 border-l border-[#d8c596] pl-5">
              <p className="text-2xl font-semibold leading-[1.55]">今夜は、送る言葉の温度を少しだけ見直す夜。</p>
              <p className="leading-8 text-[#594b61]">
                不安をそのまま送る前に、相手にどう届くか、あなた自身を傷つけない形になっているかを整理します。
              </p>
            </div>
            <div className="mt-8 grid grid-cols-2 gap-3 text-sm">
              {judgments.map((judgment) => (
                <span key={judgment} className="rounded-lg border border-[#dbc68c] bg-[#fbf0d6] px-3 py-2 text-center text-[#4c3a4f]">
                  {judgment}
                </span>
              ))}
            </div>
          </NoteCard>
        </div>
      </section>

      <Section eyebrow="Problem" title="何度も画面を見てしまう夜のために。" tone="paper">
        <div className="grid gap-4 md:grid-cols-2">
          {problems.map((problem) => (
            <div key={problem} className="rounded-lg border border-[#d8c596] bg-[#fff8e9] p-5 text-lg leading-8 shadow-sm">
              {problem}
            </div>
          ))}
        </div>
        <p className="mt-6 max-w-3xl text-base leading-8 text-[#67596b]">
          不安を煽るためのページではありません。今夜の気持ちを整理し、明日の自分が後悔しにくい言葉を選ぶための入口です。
        </p>
      </Section>

      <Section eyebrow="Service" title="月の返事は、保存して見返せる恋愛メッセージ鑑定ノートです。">
        <div className="grid gap-6 lg:grid-cols-2">
          <NoteCard>
            <h3 className="text-xl font-semibold">提供するもの</h3>
            <ul className="mt-5 space-y-3 leading-8">
              {serviceIs.map((item) => (
                <li key={item} className="border-b border-[#eadbb8] pb-3 last:border-b-0">{item}</li>
              ))}
            </ul>
          </NoteCard>
          <div className="rounded-lg border border-[#b79bd3]/35 bg-[#191630] p-6 shadow-[0_18px_50px_rgba(0,0,0,0.2)]">
            <h3 className="text-xl font-semibold text-[#f7e9ca]">提供しないもの</h3>
            <ul className="mt-5 space-y-3 leading-8 text-[#ded1e8]">
              {serviceIsNot.map((item) => (
                <li key={item} className="border-b border-white/10 pb-3 last:border-b-0">{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      <Section eyebrow="Contents" title="1相談ごとに、今夜の判断材料を鑑定書として整理します。" tone="paper">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {deliverables.map((item) => (
            <div key={item} className="rounded-lg border border-[#d8c596] bg-[#fff8e9] px-4 py-4 text-base font-semibold leading-7 text-[#33263b]">
              {item}
            </div>
          ))}
        </div>
      </Section>

      <Section eyebrow="Judgment" title="判定だけで終わらせず、理由と次の一手まで返します。">
        <div className="grid gap-4 md:grid-cols-4">
          {judgments.map((judgment) => (
            <div key={judgment} className="rounded-lg border border-[#d6b86d]/35 bg-[#1b1732] p-5 text-center shadow-[0_16px_40px_rgba(0,0,0,0.18)]">
              <p className="text-lg font-semibold leading-8 text-[#f4d98d]">{judgment}</p>
            </div>
          ))}
        </div>
        <p className="mt-8 max-w-3xl text-lg leading-9 text-[#e8ddcf]">
          判定は鑑定書の結論ラベルです。月の返事では、なぜその判定なのか、今夜どう振る舞うと自分を傷つけにくいのかまで整理します。
        </p>
      </Section>

      <Section id="samples" eyebrow="Samples" title="承認済みゴールドサンプルからの短い言葉。" tone="paper">
        <div className="grid gap-6 lg:grid-cols-3">
          {samples.map((sample) => (
            <NoteCard key={sample.id}>
              <p className="text-sm font-semibold tracking-[0.16em] text-[#8c6a29]">{sample.id}</p>
              <h3 className="mt-3 text-xl font-semibold">{sample.title}</h3>
              <p className="mt-5 whitespace-pre-line text-lg leading-10 text-[#4b3d52]">{sample.body}</p>
            </NoteCard>
          ))}
        </div>
      </Section>

      <Section eyebrow="Price" title="単発鑑定 ¥980">
        <div className="max-w-3xl rounded-lg border border-[#d6b86d]/40 bg-[#18152e] p-7 shadow-[0_18px_50px_rgba(0,0,0,0.2)]">
          <p className="text-4xl font-semibold text-[#f4d98d]">¥980</p>
          <p className="mt-5 text-lg leading-9 text-[#efe5d0]">
            1相談ごとに、あなた専用の鑑定書をお返しします。追加課金で引き延ばすことはありません。
          </p>
        </div>
      </Section>

      <Section eyebrow="Flow" title="公開MVP予定フロー。Stage 1ではまだ実装しません。" tone="paper">
        <ol className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {flowSteps.map((step, index) => (
            <li key={step} className="rounded-lg border border-[#d8c596] bg-[#fff8e9] p-5">
              <span className="text-sm font-semibold tracking-[0.16em] text-[#8c6a29]">STEP {index + 1}</span>
              <p className="mt-3 text-lg font-semibold leading-8">{step}</p>
            </li>
          ))}
        </ol>
        <p className="mt-6 max-w-3xl text-base leading-8 text-[#67596b]">
          LP上では予定フローとして説明しています。フォーム、決済、AI生成、結果ページ、メール送信はStage 1の実装対象外です。
        </p>
      </Section>

      <Section eyebrow="Safety" title="AI利用と安全範囲を明確にします。">
        <div className="grid gap-3 md:grid-cols-2">
          {safetyNotes.map((note) => (
            <div key={note} className="rounded-lg border border-[#b79bd3]/35 bg-[#191630] p-5 leading-8 text-[#f2e8f6]">
              {note}
            </div>
          ))}
        </div>
      </Section>

      <Section eyebrow="FAQ" title="鑑定前に確認してほしいこと。" tone="paper">
        <div className="space-y-4">
          {faqs.map((faq) => (
            <details key={faq.question} className="rounded-lg border border-[#d8c596] bg-[#fff8e9] p-5">
              <summary className="cursor-pointer text-lg font-semibold leading-8">Q. {faq.question}</summary>
              <p className="mt-3 leading-8 text-[#67596b]">{faq.answer}</p>
            </details>
          ))}
        </div>
      </Section>

      <Section id="request-placeholder" eyebrow="Request" title="鑑定依頼フォームは次のStageで実装予定です。">
        <div className="max-w-3xl rounded-lg border border-[#d6b86d]/40 bg-[#18152e] p-7">
          <p className="text-lg leading-9 text-[#efe5d0]">
            このStageでは、LPの世界観・訴求・スマホ表示を先に検証します。
          </p>
          <div aria-disabled="true" className="mt-6 inline-flex min-h-12 cursor-not-allowed items-center justify-center rounded-lg border border-[#d6b86d]/35 bg-[#2a2441] px-6 py-3 text-base font-semibold text-[#d8c596]">
            Stage 2でフォーム実装予定
          </div>
        </div>
      </Section>

      <footer className="border-t border-white/10 bg-[#090d1e] px-5 py-10 text-[#d8cdbd] sm:px-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 text-sm leading-7 md:flex-row md:items-center md:justify-between">
          <p className="font-semibold text-[#fff7e8]">月の返事</p>
          <p>AI利用明記 / 占い・エンタメ・感情整理目的 / 医療・診断・カウンセリングではありません</p>
          <p>© placeholder year</p>
        </div>
      </footer>
    </main>
  );
}
