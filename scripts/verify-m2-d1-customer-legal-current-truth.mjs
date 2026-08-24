import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();

function readText(relativePath) {
  return readFileSync(path.join(root, relativePath), "utf8");
}

let passed = 0;
function verify(label, assertion) {
  assertion();
  passed += 1;
  console.log(`PASS ${String(passed).padStart(2, "0")} ${label}`);
}

const customerRoutes = [
  ["/legal", "app/legal/page.tsx"],
  ["/legal/terms", "app/legal/terms/page.tsx"],
  ["/legal/privacy", "app/legal/privacy/page.tsx"],
  ["/legal/tokushoho", "app/legal/tokushoho/page.tsx"],
  ["/legal/refund", "app/legal/refund/page.tsx"],
  ["/legal/ai-disclosure", "app/legal/ai-disclosure/page.tsx"],
  ["/legal/unsupported-cases", "app/legal/unsupported-cases/page.tsx"],
  ["/contact", "app/contact/page.tsx"],
];

const pageSources = customerRoutes.map(([route, file]) => ({
  route,
  file,
  source: readText(file),
}));
const componentSource = readText("components/legal/LegalDocument.tsx");
const currentContentSource = readText("lib/legal/current-content.ts");
const footerSource = readText("components/layout/SiteFooter.tsx");
const customerLegalSource = [
  ...pageSources.map(({ source }) => source),
  componentSource,
  currentContentSource,
  footerSource,
].join("\n");

verify("all eight customer legal/contact route sources exist", () => {
  for (const [, file] of customerRoutes) {
    assert.equal(existsSync(path.join(root, file)), true, file);
  }
});

verify("all routes use the current customer scaffold and header exactly once", () => {
  for (const { route, source } of pageSources) {
    assert.equal((source.match(/<CustomerLegalScaffold\b/gu) ?? []).length, 1, route);
    assert.equal((source.match(/<CustomerLegalHeader\b/gu) ?? []).length, 1, route);
    assert.equal((source.match(/<h1\b/gu) ?? []).length, 0, route);
  }
});

verify("shared document header owns the single h1", () => {
  assert.equal((componentSource.match(/<h1\b/gu) ?? []).length, 1);
});

verify("customer routes do not import historical legal authority", () => {
  assert.doesNotMatch(customerLegalSource, /components\/legal\/LegalReview|lib\/legal\/review-content/u);
});

const forbiddenCustomerTokens = [
  /\bB2\b/u,
  /\bB3\b/u,
  /\bB4a\b/u,
  /\bB4b\b/u,
  /Human\s*(?:\/|\+|and|と)?\s*ChatGPT/iu,
  /ChatGPT\s*review/iu,
  /\bacceptance\b/iu,
  /Technical Evidence/iu,
  /QA probe/iu,
  /\bSHA(?:-256)?\b/iu,
  /\bcandidate\b/iu,
  /private review/iu,
  /Payment未実装/u,
  /Stripe未選定/u,
  /formalStripeSelection/u,
  /productionReadiness/u,
];

verify("customer legal/contact source contains zero forbidden internal token families", () => {
  for (const pattern of forbiddenCustomerTokens) {
    assert.doesNotMatch(customerLegalSource, pattern, pattern.source);
  }
});

verify("historical legal evidence remains separate and intact in source", () => {
  const historical = readText("lib/legal/review-content.ts");
  assert.match(historical, /stripeLaneB4bStableReviewDeploymentAuthority/u);
  assert.match(readText("components/legal/LegalReview.tsx"), /LegalReviewBoundary/u);
});

verify("typed current facts lock service, product, classification and age", () => {
  for (const literal of [
    "月の返事",
    "恋のメッセージ鑑定ノート",
    "AIを活用した恋愛メッセージ分析・判断支援デジタルレポート",
    "18歳以上",
  ]) {
    assert.ok(currentContentSource.includes(literal), literal);
  }
});

verify("typed economics lock JPY980, quantity, one-time purchase and no renewal", () => {
  for (const literal of ["税込980円", "1相談 / 1鑑定ノート", "都度払い", "自動更新なし"]) {
    assert.ok(currentContentSource.includes(literal), literal);
  }
});

verify("customer pages contain no subscription or renewal contradiction", () => {
  assert.doesNotMatch(customerLegalSource, /自動更新あり|月額制|定期購入/u);
});

verify("current Payment provider is Stripe and stale provider claims are absent", () => {
  assert.match(currentContentSource, /paymentProvider: "Stripe"/u);
  assert.doesNotMatch(customerLegalSource, /決済事業者.{0,16}(未選定|選定後)/u);
  assert.doesNotMatch(customerLegalSource, /決済機能.{0,8}(未実装|なし)/u);
});

verify("AI disclosure states use, error risk, agency and non-guarantees", () => {
  const ai = readText("app/legal/ai-disclosure/page.tsx");
  const renderedAuthority = `${ai}\n${currentContentSource}`;
  for (const literal of ["AIが行うこと", "誤り", "最終的な判断と行動は利用者自身", "相手の本心", "返信", "復縁", "未来", "関係が改善"]) {
    assert.ok(renderedAuthority.includes(literal), literal);
  }
});

verify("AI disclosure excludes divination and professional substitution", () => {
  const ai = readText("app/legal/ai-disclosure/page.tsx");
  assert.match(currentContentSource, /タロット/u);
  assert.match(currentContentSource, /占星術/u);
  assert.match(ai, /医療/u);
  assert.match(ai, /心理/u);
  assert.match(ai, /法律/u);
  assert.match(ai, /代わりではありません/u);
});

verify("sparse intake and at-most-one clarification remain explicit", () => {
  assert.match(currentContentSource, /入力が短いことだけを理由に利用不可とはせず/u);
  assert.match(currentContentSource, /追加確認は通常0回、本当に必要な場合のみ最大1回/u);
});

verify("unsupported-cases page preserves the current safety boundary", () => {
  const unsupported = readText("app/legal/unsupported-cases/page.tsx");
  for (const literal of ["自傷", "他害", "暴力", "ストーカー", "連絡拒否", "不正ログイン", "未成年者", "違法行為", "最大1回"]) {
    assert.ok(`${unsupported}\n${currentContentSource}`.includes(literal), literal);
  }
});

verify("refund policy separates all six required dispositions", () => {
  const refund = readText("app/legal/refund/page.tsx");
  for (const literal of [
    "支払が完了していない場合",
    "重複・誤額・誤った購入への請求",
    "支払後に鑑定ノートを提供できない場合",
    "利用者の希望による取消し・返金",
    "外部サービス・システムの障害",
    "確認と手続",
  ]) {
    assert.ok(refund.includes(literal), literal);
  }
});

verify("refund policy preserves recovery, no recharge, full normal refund and actual error correction", () => {
  const refund = readText("app/legal/refund/page.tsx");
  assert.match(refund, /同じ購入/u);
  assert.match(refund, /再課金しません/u);
  assert.match(refund, /税込980円の全額返金/u);
  assert.match(refund, /980円で打ち切りません/u);
  assert.match(refund, /提供不能のまま放置しません/u);
});

verify("refund copy promises no automatic mechanism or fixed deadline", () => {
  const refund = readText("app/legal/refund/page.tsx");
  assert.match(refund, /自動ではありません/u);
  assert.match(refund, /固定の申出期限や自動返金を約束していません/u);
  assert.match(refund, /固定の処理日数は案内していません/u);
  assert.doesNotMatch(refund, /\d+\s*(?:日|時間)以内/u);
});

verify("privacy page reflects actual provider roles and C1-minimal categories", () => {
  const privacy = readText("app/legal/privacy/page.tsx");
  for (const literal of ["OpenAI", "Stripe", "Supabase", "Netlify", "Resend", "相談本文", "メールアドレス", "支払識別情報", "相談本文は記載しません"]) {
    assert.ok(privacy.includes(literal), literal);
  }
  assert.doesNotMatch(privacy, /production_prepayment|customer_user_id|policy_version/u);
});

verify("privacy page makes no absolute security, deletion or retention promise", () => {
  const privacy = readText("app/legal/privacy/page.tsx");
  assert.match(privacy, /一律の保存期間は約束していません/u);
  assert.match(privacy, /完全に防げるとは保証できません/u);
  assert.doesNotMatch(privacy, /絶対に安全|直ちに削除します|保存しません/u);
});

verify("commercial disclosure does not fabricate seller or contact values", () => {
  const commercial = readText("app/legal/tokushoho/page.tsx");
  assert.match(commercial, /販売事業者名、代表者、所在地、電話番号、事業用の問い合わせ先は現在掲載していません/u);
  assert.doesNotMatch(commercial, /mailto:|@(?:[a-z0-9-]+\.)+[a-z]{2,}|\d{2,4}-\d{2,4}-\d{3,4}/iu);
  assert.doesNotMatch(commercial, /TBD|仮住所|ダミー/u);
});

verify("contact page is honestly non-operational with no fake action or SLA", () => {
  const contact = readText("app/contact/page.tsx");
  assert.match(contact, /お問い合わせ窓口は現在準備中です/u);
  assert.doesNotMatch(contact, /<form\b|<button\b|mailto:|送信しました|24時間以内|営業日以内/iu);
});

verify("all legal navigation destinations resolve to route sources", () => {
  for (const [route] of customerRoutes.slice(1)) {
    assert.ok(currentContentSource.includes(`href: "${route}"`), route);
  }
});

verify("purchase confirmation links all required contract documents", () => {
  const purchase = readText("app/purchase/auth/continue/page.tsx");
  for (const route of ["/legal/terms", "/legal/privacy", "/legal/refund", "/legal/tokushoho"]) {
    assert.ok(purchase.includes(`href="${route}"`), route);
  }
});

verify("request flow links all current customer legal documents", () => {
  const request = readText("components/request/RequestForm.tsx");
  for (const route of ["/legal/terms", "/legal/privacy", "/legal/refund", "/legal/tokushoho", "/legal/ai-disclosure"]) {
    assert.ok(request.includes(`href="${route}"`), route);
  }
});

verify("Home, Request and purchase confirmation preserve core economics", () => {
  const home = readText("app/page.tsx");
  const request = readText("components/request/RequestForm.tsx");
  const purchase = readText("app/purchase/auth/continue/page.tsx");
  for (const [label, source] of [["Home", home], ["Request", request], ["purchase", purchase]]) {
    assert.match(source, /税込\s*980円/u, label);
    assert.match(source, /1相談\s*(?:\/|・)\s*1鑑定ノート/u, label);
    assert.match(source, /都度払い/u, label);
    assert.match(source, /自動更新なし|自動更新[\s\S]{0,80}<dd>なし<\/dd>/u, label);
  }
});

verify("Home current facts no longer claim future AI or unknown Payment provider", () => {
  const home = readText("app/page.tsx");
  assert.doesNotMatch(home, /AIを使用する予定|AI生成機能は動作していません|決済事業者の選定後/u);
  assert.match(home, /整理・分析と鑑定ノートの作成にAIを使用します/u);
});

verify("Home, Request, purchase and public sample share AI and non-guarantee truth", () => {
  const surfaces = [
    ["Home", readText("app/page.tsx")],
    ["Request", `${readText("app/request/page.tsx")}\n${readText("components/request/RequestForm.tsx")}`],
    ["purchase", readText("app/purchase/auth/continue/page.tsx")],
    ["sample", `${readText("app/sample-report/page.tsx")}\n${readText("components/report/PublicSampleReport.tsx")}`],
  ];
  for (const [label, source] of surfaces) {
    assert.match(source, /AI/u, label);
    for (const literal of ["相手の本心", "返信", "復縁", "未来", "関係改善"]) {
      assert.ok(source.includes(literal), `${label}: ${literal}`);
    }
  }
});

verify("legal robots policy remains noindex and nofollow", () => {
  const layout = readText("app/legal/layout.tsx");
  assert.ok((layout.match(/index: false/gu) ?? []).length >= 1);
  assert.ok((layout.match(/follow: false/gu) ?? []).length >= 1);
});

verify("customer document component exposes accessible landmarks and current-page state", () => {
  assert.match(componentSource, /<main\b/u);
  assert.match(componentSource, /<nav\b[^>]*aria-label=/u);
  assert.match(componentSource, /aria-current=/u);
  assert.match(componentSource, /aria-label="パンくず"/u);
});

verify("legal content is static and independent from activation environment", () => {
  assert.doesNotMatch(customerLegalSource, /process\.env|PREPAYMENT_COMPUTE|STRIPE_SECRET|OPENAI_API|SUPABASE_SECRET/u);
});

console.log(`M2-D1 customer legal current-truth verification PASS (${passed}/${passed}).`);
