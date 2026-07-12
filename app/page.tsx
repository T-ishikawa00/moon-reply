import Link from "next/link";

const concerns = [
  "返事が来ないだけで、心が何度も画面に戻ってしまう",
  "送りたいけれど、重いと思われたくない",
  "追いメッセージをしたいけれど、後悔しそうで怖い",
  "曖昧な関係に、どこまで時間を使っていいか分からない",
];

const organizedItems = [
  { number: "01", title: "状況を分ける", text: "入力された事実、考えられる可能性、まだ分からないことを混ぜずに整理します。" },
  { number: "02", title: "言葉の温度を見る", text: "送ろうとしている文面が、どのように受け取られる可能性があるかを確認します。" },
  { number: "03", title: "次の一手を選ぶ", text: "送る、軽く送る、待つ、今日は送らないの判断材料と短期的な行動案を示します。" },
];

const flowSteps = [
  { number: "01", title: "依頼内容を入力", text: "関係状況、必要なやり取り、送ろうとしている文面をテキストで入力します。" },
  { number: "02", title: "Safetyを確認", text: "通常鑑定として扱える内容か、将来は決済前に確認します。" },
  { number: "03", title: "単発で購入", text: "通常鑑定OKの場合のみ、税込980円の一度きりの購入へ進む予定です。" },
  { number: "04", title: "鑑定ノートを読む", text: "将来はWeb結果ページと結果URLのメールで受け取る計画です。" },
];

const faqs = [
  { question: "AIですか？", answer: "はい。AIが入力された恋愛関係の状況やメッセージを整理・分析し、判断材料を鑑定ノートとしてまとめます。現在はサービス準備中で、AI生成は動作しません。" },
  { question: "相手の本心は分かりますか？", answer: "相手の本心を断定するものではありません。入力された状況や文面から、考えられる可能性と次の一手を整理します。" },
  { question: "必ず返信が来ますか？", answer: "返信や復縁、将来の結果を保証するものではありません。" },
  { question: "どんな相談でもできますか？", answer: "自傷、DV、ストーカー、脅迫、未成年が関係する危険相談などは通常鑑定として扱いません。Safetyは原則として決済前に確認します。" },
  { question: "返金できますか？", answer: "納品後の取扱いを含む返金条件は、まだ確定していません。重複決済や例外的な提供不能時の対応方針は、決済事業者の選定後に確定します。現在は決済機能を利用できません。" },
];

function RequestCta({ label = "鑑定ノートを依頼する" }: { label?: string }) {
  return <Link href="/request" className="button button--primary">{label}</Link>;
}

export default function Home() {
  return (
    <main className="lp">
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero__glow" aria-hidden="true" />
        <div className="page-shell hero__grid">
          <div className="hero__copy">
            <p className="eyebrow">AI-assisted relationship-message analysis</p>
            <h1 id="hero-title">送る前に読む、<br />恋のメッセージ鑑定ノート。</h1>
            <p className="hero__lead">
              返信待ち、追いメッセージ、曖昧な関係で不安になる夜に。
              関係状況やメッセージをAIが整理・分析し、送る・待つ・修正するための判断材料を一冊の鑑定ノートとしてお返しします。
            </p>
            <div className="hero__offer" aria-label="商品条件">
              <div><strong>税込980円</strong><span>単発購入</span></div>
              <div><strong>1相談</strong><span>1鑑定ノート</span></div>
              <div><strong>自動更新なし</strong><span>追加課金なし</span></div>
            </div>
            <div className="hero__actions">
              <RequestCta />
              <Link href="#web-note" className="button button--secondary">鑑定ノートを見る</Link>
            </div>
            <p className="hero__status"><span aria-hidden="true">●</span> サービス審査・準備中のため、現在は決済できません。</p>
          </div>

          <div className="hero-note" aria-label="Web鑑定ノートの準備中プレビュー">
            <div className="hero-note__top"><span>月の返事</span><span>PREVIEW</span></div>
            <p className="hero-note__label">今夜の結論</p>
            <p className="hero-note__conclusion">今夜は、送る言葉の温度を少しだけ見直す夜。</p>
            <p className="hero-note__body">不安を否定せず、入力された状況と文面から、考えられる可能性と次の選択肢を整理します。</p>
            <div className="hero-note__rule" />
            <p className="hero-note__caption">構成イメージ · 実在の鑑定結果ではありません</p>
          </div>
        </div>
      </section>

      <section className="lp-section lp-section--paper" aria-labelledby="concerns-title">
        <div className="page-shell split-layout">
          <div className="section-copy">
            <p className="eyebrow">For your quiet night</p>
            <h2 id="concerns-title">ひとりで答えを急がなくていい夜があります。</h2>
            <p>不安を大きくするためではなく、何度も考え続ける状態から少し離れ、自分で次の行動を選ぶためのサービスです。</p>
          </div>
          <ul className="concern-list">
            {concerns.map((concern) => <li key={concern}><span aria-hidden="true">—</span>{concern}</li>)}
          </ul>
        </div>
      </section>

      <section id="service" className="lp-section lp-section--night" aria-labelledby="service-title">
        <div className="page-shell">
          <div className="section-copy section-copy--center">
            <p className="eyebrow">What we organize</p>
            <h2 id="service-title">気持ちを決めつけず、状況と言葉をほどいていく。</h2>
            <p>月の返事は占術や未来予測ではありません。入力された情報だけを基に、恋愛メッセージの受け取られ方と次の一手を整理します。</p>
          </div>
          <div className="organize-grid">
            {organizedItems.map((item) => (
              <article key={item.number} className="organize-card">
                <span>{item.number}</span><h3>{item.title}</h3><p>{item.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="web-note" className="lp-section lp-section--ivory" aria-labelledby="web-note-title">
        <div className="page-shell split-layout split-layout--preview">
          <div className="section-copy">
            <p className="eyebrow">Web reading note</p>
            <h2 id="web-note-title">理由まで深く読む、Web鑑定ノート。</h2>
            <p>結論だけで終わらず、今の関係、文面の印象、推奨アクション、文面案、3日間の方向、分析の限界まで章立てで確認する長文のWeb版です。</p>
            <span className="preview-boundary">準備段階の構成プレビュー</span>
          </div>
          <div className="web-note-preview" aria-label="Web鑑定ノートの構成プレビュー">
            <div className="preview-heading"><span>月の返事 鑑定ノート</span><span>PREVIEW</span></div>
            <div className="conclusion-card"><span>01 · 今夜の結論</span><strong>今日は送らず、気持ちと言葉を分けておく。</strong></div>
            <div className="preview-chapters">
              <span>02 今の関係の整理</span><span>03 受け止められ方</span><span>04 不安の核心</span><span>05 文面の印象</span><span>06 推奨アクション</span><span>07 文面案</span><span>08 3日間の方向</span><span>09 限界と注意点</span>
            </div>
            <p>構成を示す静的な見本です。AI生成・購入・納品された鑑定結果ではありません。</p>
          </div>
        </div>
      </section>

      <section className="lp-section lp-section--purple" aria-labelledby="save-note-title">
        <div className="page-shell split-layout split-layout--preview split-layout--reverse">
          <div className="section-copy">
            <p className="eyebrow">Quick-reference report</p>
            <h2 id="save-note-title">あとで迷ったときに開く、保存用鑑定書。</h2>
            <p>Web版とは別に、結論、再判断の目安、方針を変える条件、文面案を短時間で見返すための表示を準備しています。</p>
            <ul className="boundary-list">
              <li>Web鑑定ノートのスクリーンショットではありません</li>
              <li>Web全文を小さく圧縮したものではありません</li>
              <li>PDF・画像・ダウンロードはまだ利用できません</li>
            </ul>
          </div>
          <div className="save-note-preview" aria-label="保存用鑑定書の準備中プレビュー">
            <div className="save-note-preview__header"><span>保存用鑑定書</span><span>PREVIEW</span></div>
            <p className="save-note-preview__label">今夜の方向</p>
            <strong>今日は送らない方がいい</strong>
            <dl><div><dt>再判断の目安</dt><dd>状況に変化があったとき</dd></div><div><dt>今できること</dt><dd>下書きを閉じ、明日の自分に残す</dd></div><div><dt>断定できないこと</dt><dd>相手の本心や今後の返信</dd></div></dl>
            <p>保存向けに再構成した見本 · ファイルは生成されません</p>
          </div>
        </div>
      </section>

      <section id="flow" className="lp-section lp-section--paper" aria-labelledby="flow-title">
        <div className="page-shell">
          <div className="section-copy">
            <p className="eyebrow">How it works</p>
            <h2 id="flow-title">入力から鑑定ノートまで、迷わない4つの段階。</h2>
            <p>現在利用できるのはローカルの依頼フォームまでです。決済、AI生成、保存、メール配信はまだ動作しません。</p>
          </div>
          <ol className="flow-grid">{flowSteps.map((step) => <li key={step.number}><span>{step.number}</span><h3>{step.title}</h3><p>{step.text}</p></li>)}</ol>
          <div className="mid-cta"><div><strong>今の入力画面を確認できます。</strong><p>入力は外部送信されず、ブラウザ内の確認表示とローカル安全分類だけで完結します。</p></div><RequestCta /></div>
        </div>
      </section>

      <section className="lp-section lp-section--night sample-section" aria-labelledby="sample-title">
        <div className="page-shell split-layout">
          <div className="section-copy">
            <p className="eyebrow">Fictional sample</p>
            <h2 id="sample-title">文章の温度を知る、架空サンプル。</h2>
            <p>実在の相談者、購入、レビュー、AI生成実績ではない架空サンプル鑑定書は、現在準備中です。</p>
            <span className="disabled-action" aria-disabled="true">サンプル鑑定書 · 準備中</span>
          </div>
          <blockquote className="sample-quote"><span>架空ケースの短い抜粋</span><p>返事が来ない夜、<br />その沈黙を「嫌われた」と決めるには<br />まだ月明かりが足りません。</p><footer>— サービス説明用プレビュー</footer></blockquote>
        </div>
      </section>

      <section className="lp-section lp-section--ivory" aria-labelledby="price-title">
        <div className="page-shell price-layout">
          <div className="section-copy"><p className="eyebrow">Simple price</p><h2 id="price-title">一度きりの、税込980円。</h2><p>1相談につき1鑑定ノート。自動更新、サブスクリプション、コイン、追加課金による引き延ばしはありません。</p></div>
          <div className="price-card"><span>月の返事 単発鑑定ノート</span><strong><small>税込</small>980<small>円</small></strong><ul><li>1相談 / 1鑑定ノート</li><li>一度きりの購入</li><li>自動更新なし</li></ul><p>審査・準備中のため、現在は購入できません。</p></div>
        </div>
      </section>

      <section id="safety" className="lp-section lp-section--night" aria-labelledby="safety-title">
        <div className="page-shell safety-layout">
          <div className="section-copy"><p className="eyebrow">AI, limits &amp; safety</p><h2 id="safety-title">AIを使うことも、できないことも、先に伝えます。</h2><p>入力された情報をAIで整理・分析する予定です。タロット、占星術、霊感などの占術・超自然的手法は使いません。</p></div>
          <div className="safety-grid"><article><span>AI利用</span><h3>判断材料を整理</h3><p>状況、文面の印象、短期的な行動案をレポートにまとめます。</p></article><article><span>非保証</span><h3>本心や未来は断定しない</h3><p>返信、復縁、期待する結果を保証するサービスではありません。</p></article><article><span>Safety</span><h3>原則として決済前に確認</h3><p>自傷、DV、ストーカー、脅迫、未成年が関係する危険相談などは通常鑑定として扱いません。</p></article><article><span>返金方針</span><h3>事業者選定後に確定</h3><p>例外的な提供不能時の手段、期限、反映時期などはまだ確定していません。</p></article></div>
        </div>
      </section>

      <section id="faq" className="lp-section lp-section--paper" aria-labelledby="faq-title"><div className="page-shell faq-layout"><div className="section-copy"><p className="eyebrow">FAQ</p><h2 id="faq-title">依頼前に知ってほしいこと。</h2></div><div className="faq-list">{faqs.map((faq) => <details key={faq.question}><summary>{faq.question}</summary><p>{faq.answer}</p></details>)}</div></div></section>

      <section className="final-cta" aria-labelledby="final-cta-title"><div className="final-cta__moon" aria-hidden="true" /><div className="page-shell final-cta__inner"><p className="eyebrow">Your next step</p><h2 id="final-cta-title">答えを急ぐ前に、言葉と気持ちを一度ノートへ。</h2><p>入力はまだ外部へ送られません。現在の鑑定依頼フォームとローカル確認 UI を試せます。</p><RequestCta /></div></section>

      <section className="lp-navigation" aria-labelledby="navigation-title"><div className="page-shell"><div className="section-copy section-copy--center"><p className="eyebrow">Information</p><h2 id="navigation-title">法務・安全・お問い合わせ</h2><p>現在確認できる情報と、準備中の情報を明確に分けています。</p></div><div className="information-grid"><Link href="/#safety"><span>利用可能</span><strong>AI利用・非保証・Safety</strong><small>このページ内の説明へ</small></Link><Link href="/review"><span>利用可能</span><strong>公開準備プレビュー</strong><small>準備状況を確認</small></Link><div><span>準備中</span><strong>法務情報・お問い合わせ</strong><small>公開に向けて準備中</small></div></div></div></section>
    </main>
  );
}
