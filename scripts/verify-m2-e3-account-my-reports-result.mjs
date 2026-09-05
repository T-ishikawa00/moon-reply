import assert from "node:assert/strict";
import { assertF013LockDelta } from "./verify-f013-dependencies.mjs";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { registerHooks } from "node:module";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";

const root = process.cwd();
const acceptedAuthority = "01cfab6666ef8523ba0492d4838d87da6b368b27";
const expectedMain = "61e33a10e195fad17e253a6b9719217e1992f273";
const f004Base = "fd01f7fb96241c448f6cbe57a197752cf411e71e";
const f004Head = "95b84e71508426f67ae3cd4e7e63961f9b0885e2";
const wave2Base = "195e9ef99724fd7420610f1fc3b0e60389639d39";
const f004Migration = "supabase/migrations/0024_f004_notification_send_identity.sql";
const f010Migration = "supabase/migrations/0025_f010_account_otp_throttle.sql";
const f010AccountOtpRoutes = [
  "app/api/auth/account/email-otp/request/route.ts",
  "app/api/auth/account/email-otp/verify/route.ts",
];

function resolveLocalModule(specifier, parentURL) {
  const relative = specifier.startsWith("@/")
    ? specifier.slice(2)
    : specifier.startsWith("./") || specifier.startsWith("../")
      ? path.resolve(path.dirname(fileURLToPath(parentURL)), specifier)
      : null;
  if (relative === null) return null;
  const base = path.isAbsolute(relative) ? relative : path.join(root, relative);
  for (const candidate of [base, `${base}.ts`, `${base}.tsx`]) {
    if (existsSync(candidate) && statSync(candidate).isFile()) {
      return pathToFileURL(candidate).href;
    }
  }
  return null;
}

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === "server-only") {
      return { url: "data:text/javascript,export%20{}", shortCircuit: true };
    }
    const local = context.parentURL
      ? resolveLocalModule(specifier, context.parentURL)
      : null;
    if (local) return { url: local, shortCircuit: true };
    return nextResolve(specifier, context);
  },
  load(url, context, nextLoad) {
    if (url.startsWith("file:") && (url.endsWith(".ts") || url.endsWith(".tsx"))) {
      const source = readFileSync(fileURLToPath(url), "utf8");
      const transpiled = ts.transpileModule(source, {
        compilerOptions: {
          jsx: ts.JsxEmit.ReactJSX,
          module: ts.ModuleKind.ESNext,
          target: ts.ScriptTarget.ES2022,
          moduleResolution: ts.ModuleResolutionKind.Bundler,
          verbatimModuleSyntax: true,
        },
        fileName: fileURLToPath(url),
      });
      return { format: "module", source: transpiled.outputText, shortCircuit: true };
    }
    return nextLoad(url, context);
  },
});

const historyModule = await import(
  pathToFileURL(path.join(root, "lib/customer-auth/account-history.ts")).href
);
const pageResolutionModule = await import(
  pathToFileURL(path.join(root, "lib/customer-auth/account-page-resolution.ts")).href
);
const resultResolutionModule = await import(
  pathToFileURL(path.join(root, "lib/customer-auth/account-result-resolution.ts")).href
);
const { M2RuntimeError } = await import(
  pathToFileURL(path.join(root, "lib/assessment/runtime/errors.ts")).href
);

const purchaseA = "11111111-1111-4111-8111-111111111111";
const purchaseB = "22222222-2222-4222-8222-222222222222";
const deliveryA = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const deliveryB = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const validProcessingRow = {
  purchase_intent_id: purchaseA,
  delivery_id: null,
  created_at: "2026-08-25T01:05:00.000000+00:00",
  state: "processing",
};
const validCompletedRow = {
  purchase_intent_id: purchaseB,
  delivery_id: deliveryB,
  created_at: "2026-08-25T09:42:00.000000+00:00",
  state: "completed",
};

let passed = 0;
const failures = [];
function text(relativePath) {
  return readFileSync(path.join(root, relativePath), "utf8");
}
function git(args) {
  return execFileSync(
    "git.exe",
    ["-c", "safe.directory=C:/projects/moon-reply", ...args],
    { cwd: root, encoding: "utf8", maxBuffer: 256 * 1024 * 1024 },
  ).trim();
}
function check(name, run) {
  try {
    run();
    passed += 1;
    console.log(`[PASS] ${name}`);
  } catch (error) {
    failures.push({ name, error });
    console.error(`[FAIL] ${name}: ${error.message.split("\n")[0]}`);
  }
}
async function checkAsync(name, run) {
  try {
    await run();
    passed += 1;
    console.log(`[PASS] ${name}`);
  } catch (error) {
    failures.push({ name, error });
    console.error(`[FAIL] ${name}: ${error.message.split("\n")[0]}`);
  }
}
function assertThrowsRuntime(run) {
  assert.throws(run, (error) => error instanceof M2RuntimeError);
}
function diffFromBase(paths) {
  return git(["diff", "--name-only", f004Base, "--", ...paths]);
}

check("authority base and immutable main are exact", () => {
  assert.equal(git(["merge-base", "HEAD", acceptedAuthority]), acceptedAuthority);
  assert.equal(git(["merge-base", "HEAD", f004Base]), f004Base);
  assert.equal(git(["merge-base", "HEAD", f004Head]), f004Head);
  assert.equal(git(["merge-base", "HEAD", wave2Base]), wave2Base);
  assert.equal(git(["rev-parse", "main"]), expectedMain);
});

check("Account history decoder accepts only the exact safe projection", () => {
  assert.deepEqual(historyModule.decodeCustomerAccountHistoryRow(validProcessingRow), {
    purchaseIntentId: purchaseA,
    deliveryId: null,
    date: validProcessingRow.created_at,
    state: "processing",
  });
  assert.deepEqual(historyModule.decodeCustomerAccountHistoryRow(validCompletedRow), {
    purchaseIntentId: purchaseB,
    deliveryId: deliveryB,
    date: validCompletedRow.created_at,
    state: "completed",
  });
});

check("unknown history states fail instead of being coerced", () => {
  assertThrowsRuntime(() =>
    historyModule.decodeCustomerAccountHistoryRow({
      ...validProcessingRow,
      state: "manual_review",
    }),
  );
});

check("purchase and delivery selectors require UUIDs", () => {
  assertThrowsRuntime(() =>
    historyModule.decodeCustomerAccountHistoryRow({
      ...validProcessingRow,
      purchase_intent_id: "not-a-uuid",
    }),
  );
  assertThrowsRuntime(() =>
    historyModule.decodeCustomerAccountHistoryRow({
      ...validCompletedRow,
      delivery_id: "not-a-uuid",
    }),
  );
});

check("timestamps require a real explicit-offset instant", () => {
  for (const created_at of [
    "not-a-time",
    "2026-08-25T09:42:00",
    "2026-02-30T09:42:00Z",
  ]) {
    assertThrowsRuntime(() =>
      historyModule.decodeCustomerAccountHistoryRow({
        ...validProcessingRow,
        created_at,
      }),
    );
  }
});

check("completed requires a usable delivery and processing forbids one", () => {
  assertThrowsRuntime(() =>
    historyModule.decodeCustomerAccountHistoryRow({
      ...validProcessingRow,
      state: "completed",
    }),
  );
  assertThrowsRuntime(() =>
    historyModule.decodeCustomerAccountHistoryRow({
      ...validProcessingRow,
      delivery_id: deliveryA,
    }),
  );
});

check("Account display clock is explicitly Asia/Tokyo", () => {
  assert.equal(historyModule.CUSTOMER_ACCOUNT_TIME_ZONE, "Asia/Tokyo");
  assert.match(text("lib/customer-auth/account-history.ts"), /timeZone: CUSTOMER_ACCOUNT_TIME_ZONE/u);
});

check("UTC to JST rollover changes the visible calendar date exactly", () => {
  assert.equal(
    historyModule.formatCustomerAccountTimestampJst("2026-08-24T18:05:00Z"),
    "8月25日 03:05",
  );
});

check("same-JST-day notes retain distinct explicit timestamps with generic copy", () => {
  const morning = historyModule.presentCustomerAccountHistoryItem({
    purchaseIntentId: purchaseA,
    deliveryId: null,
    date: "2026-08-25T01:05:00Z",
    state: "processing",
  });
  const evening = historyModule.presentCustomerAccountHistoryItem({
    purchaseIntentId: purchaseB,
    deliveryId: deliveryB,
    date: "2026-08-25T09:42:00Z",
    state: "completed",
  });
  assert.equal(morning.dateTimeLabel, "8月25日 10:05（日本時間）");
  assert.equal(evening.dateTimeLabel, "8月25日 18:42（日本時間）");
  assert.notEqual(morning.dateTimeLabel, evening.dateTimeLabel);
});

check("history presentation is newest-first with deterministic invisible ties", () => {
  const sorted = historyModule.presentCustomerAccountHistory([
    historyModule.decodeCustomerAccountHistoryRow(validProcessingRow),
    historyModule.decodeCustomerAccountHistoryRow(validCompletedRow),
  ]);
  assert.deepEqual(sorted.map((item) => item.purchaseIntentId), [purchaseB, purchaseA]);
});

check("completed cover variants are decorative, allowlisted, and stable by purchase ID", () => {
  const purchaseIds = [
    "11111111-1111-4111-8111-111111111111",
    "11111111-1111-4111-8111-111111111112",
    "11111111-1111-4111-8111-111111111113",
  ];
  const variants = purchaseIds.map((purchaseIntentId) =>
    historyModule.selectCustomerAccountCoverVariant(purchaseIntentId),
  );
  assert.equal(new Set(variants).size, 3);
  assert.deepEqual(
    variants,
    purchaseIds.map((purchaseIntentId) =>
      historyModule.selectCustomerAccountCoverVariant(purchaseIntentId),
    ),
  );
  assert.ok(
    variants.every((variant) =>
      historyModule.CUSTOMER_ACCOUNT_COMPLETED_COVER_VARIANTS.includes(variant),
    ),
  );
});

check("titles and summaries are state-only and contain no private content vocabulary", () => {
  const presented = historyModule.presentCustomerAccountHistoryItem(
    historyModule.decodeCustomerAccountHistoryRow(validCompletedRow),
  );
  const visible = `${presented.coverDateLabel}\n${presented.title}\n${presented.dateTimeLabel}\n${presented.summary}`;
  assert.equal(
    visible,
    "8月25日\n鑑定ノート\n8月25日 18:42（日本時間）\nいまの気持ちと、次の一歩をまとめたノートです。",
  );
  assert.equal(presented.statusLabel, null);
  assert.doesNotMatch(visible, /@|aaaaaaaa|bbbbbbbb|相談|相手|下書き|Customer|UUID/iu);
});

await checkAsync("signed-out page state never calls owned history", async () => {
  let reads = 0;
  const result = await pageResolutionModule.resolveCustomerAccountPage({
    authEnabled: true,
    getSessionState: async () => "signed_out",
    listHistory: async () => {
      reads += 1;
      return [];
    },
  });
  assert.deepEqual(result, { state: "signed_out" });
  assert.equal(reads, 0);
});

await checkAsync("disabled and unavailable Auth have an explicit non-signed-out state", async () => {
  assert.deepEqual(
    await pageResolutionModule.resolveCustomerAccountPage({
      authEnabled: false,
      getSessionState: async () => "signed_in",
      listHistory: async () => [],
    }),
    { state: "auth_unavailable" },
  );
  assert.deepEqual(
    await pageResolutionModule.resolveCustomerAccountPage({
      authEnabled: true,
      getSessionState: async () => "unavailable",
      listHistory: async () => [],
    }),
    { state: "auth_unavailable" },
  );
});

await checkAsync("history RPC failure is not mislabeled signed-out", async () => {
  const result = await pageResolutionModule.resolveCustomerAccountPage({
    authEnabled: true,
    getSessionState: async () => "signed_in",
    listHistory: async () => {
      throw new M2RuntimeError("CUSTOMER_AUTH_DATABASE_OPERATION_FAILED", 503);
    },
  });
  assert.deepEqual(result, { state: "load_failed" });
});

await checkAsync("empty and populated Account states are exact", async () => {
  assert.deepEqual(
    await pageResolutionModule.resolveCustomerAccountPage({
      authEnabled: true,
      getSessionState: async () => "signed_in",
      listHistory: async () => [],
    }),
    { state: "empty" },
  );
  const history = [historyModule.decodeCustomerAccountHistoryRow(validProcessingRow)];
  assert.deepEqual(
    await pageResolutionModule.resolveCustomerAccountPage({
      authEnabled: true,
      getSessionState: async () => "signed_in",
      listHistory: async () => history,
    }),
    { state: "history", history },
  );
});

check("Account page exposes exact customer recovery states and actions", () => {
  const source = text("app/account/page.tsx");
  assert.match(source, /現在、ログイン状態を確認できません/u);
  assert.match(source, /ログインが必要です[\s\S]*?href="\/login"/u);
  assert.match(source, /鑑定ノートの一覧を読み込めませんでした[\s\S]*?もう一度確認する/u);
  assert.match(source, /まだ届いた鑑定ノートはありません[\s\S]*?href="\/request"/u);
});

check("Lunar editorial hero reuses the established brand language", () => {
  const pageSource = text("app/account/page.tsx");
  const heroSource = text("app/account/AccountNoteHero.tsx");
  assert.match(pageSource, /<AccountNoteHero \/>/u);
  assert.match(heroSource, /MoonSeal size="medium"/u);
  assert.match(heroSource, /LunarArc tone="night" position="top-right"/u);
  assert.match(heroSource, /EditorialDivider variant="night"/u);
  assert.match(heroSource, /<h1>私の鑑定ノート<\/h1>/u);
  assert.match(heroSource, /これまで届いた鑑定ノートを、ここからいつでも読み返せます。/u);
  assert.doesNotMatch(`${pageSource}\n${heroSource}`, /日付・時刻：/u);
});

check("global header keeps only existing routes and homepage anchors", () => {
  const headerSource = text("components/layout/SiteHeader.tsx");
  const homeSource = text("app/page.tsx");
  for (const anchor of ["note", "flow", "price", "faq"]) {
    assert.match(headerSource, new RegExp(`href: "/#${anchor}"`, "u"));
    assert.match(homeSource, new RegExp(`id="${anchor}"`, "u"));
  }
  assert.match(headerSource, /href="\/sample-report"/u);
  assert.match(headerSource, /href="\/request"/u);
  assert.doesNotMatch(headerSource, /href="\/(?:guide|faq)"/u);
});

check("Account makes one history read and no per-card result read", () => {
  const source = text("app/account/page.tsx");
  assert.equal(source.match(/\.listAccountHistory\(\)/gu)?.length, 1);
  assert.doesNotMatch(source, /resolveOwnedResult|CustomerAssessmentNote|projection/u);
});

check("repository strictly decodes the one owned-history RPC response", () => {
  const source = text("lib/customer-auth/supabase-repository.ts");
  assert.match(source, /"resolve_customer_account_history_v1"/u);
  assert.match(source, /data\.map\(decodeCustomerAccountHistoryRow\)/u);
  assert.doesNotMatch(source, /state: string\(row\.state\) as CustomerAccountHistoryItem/u);
});

check("fresh server identity remains the sole CustomerUserId source", () => {
  const source = text("lib/customer-auth/application.ts");
  assert.match(source, /async listAccountHistory\(\) \{[\s\S]*?await this\.getFreshIdentity\(\)[\s\S]*?identity\.customerUserId/u);
  assert.match(source, /async resolveOwnedResult\(deliveryId: string\)[\s\S]*?await this\.getFreshIdentity\(\)[\s\S]*?identity\.customerUserId/u);
  assert.doesNotMatch(text("app/account/page.tsx"), /customerUserId/u);
});

check("covers use semantic headings, conditional status text, and explicit time", () => {
  const source = text("app/account/AccountNoteGallery.tsx");
  assert.match(source, /<article aria-labelledby=/u);
  assert.match(source, /<h2 id=\{headingId\}>/u);
  assert.match(source, /<time dateTime=\{item\.date\}>/u);
  assert.match(source, /item\.statusLabel \? \([\s\S]*?\{item\.statusLabel\}/u);
  assert.match(source, /aria-hidden="true"/u);
});

check("completed results use only the canonical authenticated CTA", () => {
  const source = text("app/account/AccountNoteGallery.tsx");
  assert.match(source, /item\.canOpenResult && item\.deliveryId !== null/u);
  assert.match(source, /href=\{`\/account\/results\/\$\{item\.deliveryId\}`\}/u);
  assert.match(source, /item\.canOpenResult \? "ノートをひらく" : item\.statusLabel/u);
  assert.doesNotMatch(source, /href=\{`\/result\//u);
});

check("processing cards never become result destinations", () => {
  const item = historyModule.presentCustomerAccountHistoryItem(
    historyModule.decodeCustomerAccountHistoryRow(validProcessingRow),
  );
  assert.equal(item.statusLabel, "準備中");
  assert.equal(item.coverVariant, "processing");
  assert.equal(item.summary, "あなたへの言葉を、いま静かに整えています。");
  assert.equal(item.canOpenResult, false);
});

check("owned-purchase support entry retains its exact-true feature gate", () => {
  const pageSource = text("app/account/page.tsx");
  const gallerySource = text("app/account/AccountNoteGallery.tsx");
  assert.equal(diffFromBase([
    "app/account", "lib/support/environment.ts",
  ]), "");
  assert.match(pageSource, /const supportEnabled = isPurchaseSupportEmailEnabled\(\);/u);
  assert.match(pageSource, /supportEnabled=\{supportEnabled\}/u);
  assert.match(text("lib/support/environment.ts"), /return process\.env\.PURCHASE_SUPPORT_EMAIL_ENABLED === "true";/u);
  assert.match(gallerySource, /supportEnabled \?/u);
  assert.match(gallerySource, /\/contact\?purchase=/u);
  assert.match(gallerySource, /この購入について問い合わせる/u);
});

check("Account list source contains no consultation or result body dependency", () => {
  const sources = [
    text("app/account/page.tsx"),
    text("app/account/AccountNoteGallery.tsx"),
    text("app/account/AccountNoteHero.tsx"),
    text("lib/customer-auth/account-history.ts"),
    text("lib/customer-auth/account-page-resolution.ts"),
  ].join("\n");
  assert.doesNotMatch(
    sources,
    /CustomerAssessmentExperienceProjectionV2|currentSituation|partnerMessage|draftMessage|openingLetter|openingLine|primaryReason|relationshipSummary|finalDraft|verifiedEmail/u,
  );
});

await checkAsync("signed-out result uses Login recovery before owned-result lookup", async () => {
  let reads = 0;
  const result = await resultResolutionModule.resolveCustomerAccountResult({
    authEnabled: true,
    deliveryId: deliveryA,
    getSessionState: async () => "signed_out",
    resolveOwnedResult: async () => {
      reads += 1;
      return null;
    },
  });
  assert.deepEqual(result, { state: "auth_required" });
  assert.equal(reads, 0);
});

await checkAsync("unknown and cross-customer selectors share not-found", async () => {
  const result = await resultResolutionModule.resolveCustomerAccountResult({
    authEnabled: true,
    deliveryId: deliveryA,
    getSessionState: async () => "signed_in",
    resolveOwnedResult: async () => null,
  });
  assert.deepEqual(result, { state: "not_found" });
});

await checkAsync("Auth infrastructure failure is not not-found", async () => {
  await assert.rejects(
    resultResolutionModule.resolveCustomerAccountResult({
      authEnabled: false,
      deliveryId: deliveryA,
      getSessionState: async () => "signed_out",
      resolveOwnedResult: async () => null,
    }),
    (error) => error instanceof M2RuntimeError && error.safeCode === "CUSTOMER_AUTH_UNAVAILABLE",
  );
});

await checkAsync("DB and projection failures propagate to the scoped error boundary", async () => {
  const failure = new M2RuntimeError("CUSTOMER_AUTH_DATABASE_OPERATION_FAILED", 503);
  await assert.rejects(
    resultResolutionModule.resolveCustomerAccountResult({
      authEnabled: true,
      deliveryId: deliveryA,
      getSessionState: async () => "signed_in",
      resolveOwnedResult: async () => {
        throw failure;
      },
    }),
    (error) => error === failure,
  );
});

await checkAsync("owned canonical result remains intact", async () => {
  const owned = { deliveryId: deliveryA, projection: { safe: "synthetic" } };
  assert.deepEqual(
    await resultResolutionModule.resolveCustomerAccountResult({
      authEnabled: true,
      deliveryId: deliveryA,
      getSessionState: async () => "signed_in",
      resolveOwnedResult: async () => owned,
    }),
    { state: "result", result: owned },
  );
});

check("result route has fixed Login, not-found, and internal-error semantics", () => {
  const source = text("app/account/results/[deliveryId]/page.tsx");
  assert.match(source, /resolution\.state === "auth_required"\) redirect\("\/login"\)/u);
  assert.match(source, /resolution\.state === "not_found"\) notFound\(\)/u);
  assert.doesNotMatch(source, /catch\s*\{/u);
  assert.doesNotMatch(source, /returnTo|redirectTo|callbackUrl|searchParams/u);
});

check("result recovery surfaces reveal no selector, ownership, or internal error", () => {
  const notFoundSource = text("app/account/results/[deliveryId]/not-found.tsx");
  const errorSource = text("app/account/results/[deliveryId]/error.tsx");
  assert.match(notFoundSource, /この鑑定ノートを確認できませんでした。/u);
  assert.match(errorSource, /現在、鑑定ノートを表示できません。/u);
  assert.match(errorSource, /reset\(\)/u);
  assert.match(`${notFoundSource}\n${errorSource}`, /href="\/account"/u);
  assert.doesNotMatch(
    `${notFoundSource}\n${errorSource}`,
    /deliveryId|customerUserId|safeCode|error\.message|digest|RPC|DB|Supabase/u,
  );
});

check("result metadata and navigation are privacy-safe", () => {
  const source = text("app/account/results/[deliveryId]/page.tsx");
  assert.match(source, /title: "鑑定ノート \| 月の返事"/u);
  assert.match(source, /robots: \{ index: false, follow: false, noarchive: true \}/u);
  assert.match(source, /referrer: "no-referrer"/u);
  assert.match(source, /私の鑑定ノートへ戻る/u);
  assert.doesNotMatch(source, /openingLine|primaryReason|finalDraft|relationshipSummary/u);
});

check("legacy bearer result route remains byte-unchanged", () => {
  assert.equal(diffFromBase(["app/result/[token]/page.tsx"]), "");
  assert.ok(existsSync(path.join(root, "app/result/[token]/page.tsx")));
});

check("Account loading state is privacy-safe and non-fabricated", () => {
  const source = text("app/account/loading.tsx");
  assert.match(source, /鑑定ノートを確認しています。/u);
  assert.doesNotMatch(source, /purchase|delivery|相談|結果|email|UUID/iu);
});

check("mobile and desktop source contract prevents action collisions", () => {
  const source = text("app/account/account.module.css");
  const reviewSource = text("app/review/account/review-account.module.css");
  assert.match(source, /@media \(max-width: 420px\)/u);
  assert.match(source, /min-width: 0/u);
  assert.match(source, /overflow-wrap: anywhere/u);
  assert.match(source, /min-height: 44px/u);
  assert.match(source, /flex-wrap: wrap/u);
  assert.match(source, /:focus-visible/u);
  assert.match(source, /container-type: inline-size/u);
  assert.match(source, /@container \(max-width: 420px\)/u);
  assert.match(source, /repeat\(auto-fit, minmax\(min\(100%, 17rem\), 1fr\)\)/u);
  assert.match(source, /aspect-ratio: 2 \/ 3/u);
  assert.match(source, /grid-template-columns: 1fr/u);
  assert.match(source, /@media \(prefers-reduced-motion: reduce\)/u);
  assert.match(source, /var\(--font-heading\)/u);
  assert.match(source, /var\(--paper-grain-line\)/u);
  assert.match(source, /var\(--focus-ring\)/u);
  assert.match(reviewSource, /grid-template-columns: minmax\(0, 1fr\)/u);
  assert.doesNotMatch(source, /perspective|rotateY|translateZ|book-spine|bookshelf/iu);
});

check("static review surface covers R2 variants, processing, empty, and target widths", () => {
  const source = text("app/review/account/page.tsx");
  assert.equal(source.match(/state: "completed"/gu)?.length, 3);
  assert.equal(source.match(/state: "processing"/gu)?.length, 1);
  assert.match(source, /<AccountNoteHero \/>/u);
  assert.match(source, /<AccountNoteGallery/u);
  assert.match(source, /ReviewGallery viewport="390"/u);
  assert.match(source, /ReviewGallery viewport="1280"/u);
  assert.match(source, /まだ届いた鑑定ノートはありません/u);
  assert.doesNotMatch(source, /openingLine|primaryReason|finalDraft|verifiedEmail/u);
});

check("E2 Auth and navigation stay exact except the two F010 admission additions", () => {
  const protectedAuthPaths = [
    "app/login",
    "app/api/account/session",
    "app/api/auth/account",
    "app/api/auth/logout",
    "components/layout/CustomerSessionNav.tsx",
    "components/layout/SiteHeader.tsx",
    "lib/customer-auth/account-attempt.ts",
    "lib/customer-auth/account-application.ts",
    "lib/customer-auth/browser-events.ts",
  ];
  // Preserve the historical E2/F004 boundary before checking this new Finding.
  assert.equal(git(["diff", "--name-only", f004Base, wave2Base, "--", ...protectedAuthPaths]), "");
  assert.deepEqual(
    git(["diff", "--name-only", wave2Base, "--", ...protectedAuthPaths]).split(/\r?\n/u).filter(Boolean),
    f010AccountOtpRoutes,
  );
  assert.equal(git(["ls-files", "--others", "--exclude-standard", "--", ...protectedAuthPaths]), "");
  for (const [index, route] of f010AccountOtpRoutes.entries()) {
    const purpose = index === 0 ? "request" : "verify";
    const importLine = 'import { enforceAccountOtpThrottle } from "@/lib/customer-auth/account-otp-throttle-runtime";\n';
    const admissionLine = `    await enforceAccountOtpThrottle("${purpose}", body.email);\n`;
    const source = text(route).replaceAll("\r\n", "\n");
    assert.equal(source.split(importLine).length - 1, 1, route);
    assert.equal(source.split(admissionLine).length - 1, 1, route);
    assert.equal(
      source.replace(importLine, "").replace(admissionLine, "").trimEnd(),
      git(["show", `${wave2Base}:${route}`]),
      `${route}: only the durable throttle import and awaited admission may change`,
    );
    assert.ok(
      source.indexOf(admissionLine) < source.indexOf("await (await createCustomerAccountAuthApplication())"),
      `${route}: durable admission must precede Provider creation/call`,
    );
  }
});

check("E1 detailed latency contract files are byte-unchanged", () => {
  assert.equal(
    diffFromBase([
      "lib/measurement/auth-latency.ts",
      "lib/measurement/browser-auth-latency.ts",
      "app/api/auth/google/start/route.ts",
      "app/api/auth/callback/route.ts",
      "components/request/RequestForm.tsx",
    ]),
    "",
  );
});

check("F004/F010 migration boundaries remain exact; dependencies change only within F013", () => {
  const baselineMigrations = git([
    "ls-tree", "-r", "--name-only", f004Base, "--", "supabase/migrations",
  ]).split(/\r?\n/u).filter(Boolean);
  assert.equal(diffFromBase(baselineMigrations), "");
  assert.deepEqual(
    git(["ls-tree", "-r", "--name-only", f004Head, "--", "supabase/migrations"]).split(/\r?\n/u).filter(Boolean),
    [...baselineMigrations, f004Migration].sort(),
  );
  const wave2Migrations = git([
    "ls-tree", "-r", "--name-only", wave2Base, "--", "supabase/migrations",
  ]).split(/\r?\n/u).filter(Boolean);
  assert.deepEqual(wave2Migrations, [...baselineMigrations, f004Migration].sort());
  for (const migration of wave2Migrations) {
    assert.equal(git(["hash-object", migration]), git(["rev-parse", `${wave2Base}:${migration}`]), migration);
  }
  assert.deepEqual(
    readdirSync(path.join(root, "supabase/migrations"))
      .filter((entry) => entry.endsWith(".sql"))
      .map((entry) => `supabase/migrations/${entry}`).sort(),
    [...wave2Migrations, f010Migration].sort(),
  );
  const f013Base = "fcffe9a0a0424c308f70130e95a7f8cb69173779";
  assert.equal(git(["diff", "--name-only", f004Base, f013Base, "--", "package-lock.json"]), "");
  assert.equal(git(["rev-parse", `${f013Base}:package-lock.json`]), git(["rev-parse", `${wave2Base}:package-lock.json`]));
  assertF013LockDelta({ root });
  assert.equal(
    JSON.parse(text("package.json")).dependencies.next,
    "16.3.3",
  );
});

check("canonical E3 evidence preserves candidate-only status", () => {
  const source = text("docs/m2/M2_E3_ACCOUNT_MY_REPORTS_RESULT.md");
  assert.match(source, /SOURCE CANDIDATE — PENDING HUMAN\/CHATGPT REVIEW/u);
  assert.match(source, /ACCOUNT \/ MY REPORTS SOURCE CANDIDATE/u);
  assert.match(source, /AUTHENTICATED RESULT RECOVERY SOURCE CANDIDATE/u);
  assert.match(source, /ACCOUNT\/RESULT SLICE FURTHER ADDRESSED[\s\S]*?NOT CLOSED/u);
});

console.log(`M2-E3 Account/My Reports/Authenticated Result Recovery verification: ${passed}/${passed + failures.length} checks passed.`);
if (failures.length > 0) process.exitCode = 1;
