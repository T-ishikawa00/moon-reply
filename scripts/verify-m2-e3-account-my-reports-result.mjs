import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, statSync } from "node:fs";
import { registerHooks } from "node:module";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";

const root = process.cwd();
const acceptedAuthority = "ba9fa78b69da62f9abd24b54fe2a3c850001d785";
const expectedMain = "61e33a10e195fad17e253a6b9719217e1992f273";

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
  run();
  passed += 1;
  console.log(`[PASS] ${name}`);
}
async function checkAsync(name, run) {
  await run();
  passed += 1;
  console.log(`[PASS] ${name}`);
}
function assertThrowsRuntime(run) {
  assert.throws(run, (error) => error instanceof M2RuntimeError);
}
function diffFromBase(paths) {
  return git(["diff", "--name-only", acceptedAuthority, "--", ...paths]);
}

check("authority base and immutable main are exact", () => {
  assert.equal(git(["merge-base", "HEAD", acceptedAuthority]), acceptedAuthority);
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

check("same-JST-day notes remain visibly distinct without content", () => {
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
  assert.equal(morning.title, "8月25日 10:05の鑑定ノート");
  assert.equal(evening.title, "8月25日 18:42の鑑定ノート");
  assert.notEqual(morning.title, evening.title);
});

check("history presentation is newest-first with deterministic invisible ties", () => {
  const sorted = historyModule.presentCustomerAccountHistory([
    historyModule.decodeCustomerAccountHistoryRow(validProcessingRow),
    historyModule.decodeCustomerAccountHistoryRow(validCompletedRow),
  ]);
  assert.deepEqual(sorted.map((item) => item.purchaseIntentId), [purchaseB, purchaseA]);
});

check("titles and summaries are state-only and contain no private content vocabulary", () => {
  const presented = historyModule.presentCustomerAccountHistoryItem(
    historyModule.decodeCustomerAccountHistoryRow(validCompletedRow),
  );
  const visible = `${presented.title}\n${presented.dateTimeLabel}\n${presented.statusLabel}\n${presented.summary}`;
  assert.equal(visible, "8月25日 18:42の鑑定ノート\n8月25日 18:42（日本時間）\n完了\n鑑定ノートを確認できます。");
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
  assert.match(source, /まだ鑑定ノートはありません[\s\S]*?href="\/request"/u);
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

check("cards use semantic headings, visible status text, and explicit time", () => {
  const source = text("app/account/page.tsx");
  assert.match(source, /<article aria-labelledby=/u);
  assert.match(source, /<h2 id=/u);
  assert.match(source, /<time dateTime=\{item\.date\}>/u);
  assert.match(source, /\{item\.statusLabel\}/u);
});

check("completed results use only the canonical authenticated CTA", () => {
  const source = text("app/account/page.tsx");
  assert.match(source, /item\.canOpenResult && item\.deliveryId !== null/u);
  assert.match(source, /href=\{`\/account\/results\/\$\{item\.deliveryId\}`\}[\s\S]*?鑑定ノートを開く/u);
  assert.doesNotMatch(source, /href=\{`\/result\//u);
});

check("processing cards never become result destinations", () => {
  const item = historyModule.presentCustomerAccountHistoryItem(
    historyModule.decodeCustomerAccountHistoryRow(validProcessingRow),
  );
  assert.equal(item.statusLabel, "処理中");
  assert.equal(item.summary, "鑑定ノートを準備しています。");
  assert.equal(item.canOpenResult, false);
});

check("D2 owned-purchase support entry remains feature-gated", () => {
  const source = text("app/account/page.tsx");
  assert.match(source, /isCustomerSupportCasesEnabled/u);
  assert.match(source, /supportEnabled \?/u);
  assert.match(source, /\/contact\?purchase=/u);
  assert.match(source, /この購入について問い合わせる/u);
});

check("Account list source contains no consultation or result body dependency", () => {
  const sources = [
    text("app/account/page.tsx"),
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
  assert.match(source, /@media \(max-width: 420px\)/u);
  assert.match(source, /min-width: 0/u);
  assert.match(source, /overflow-wrap: anywhere/u);
  assert.match(source, /min-height: 44px/u);
  assert.match(source, /flex-wrap: wrap/u);
  assert.match(source, /:focus-visible/u);
  assert.match(source, /container-type: inline-size/u);
  assert.match(source, /@container \(max-width: 420px\)/u);
});

check("static E3 review fixture covers completed and processing same-day cards", () => {
  const source = text("app/review/account/page.tsx");
  assert.match(source, /8月25日 18:42の鑑定ノート/u);
  assert.match(source, /8月25日 10:05の鑑定ノート/u);
  assert.match(source, /statusLabel: "完了"/u);
  assert.match(source, /statusLabel: "処理中"/u);
  assert.match(source, /この購入について問い合わせる/u);
  assert.match(source, /ReviewHistory viewport="320"/u);
  assert.match(source, /ReviewHistory viewport="390"/u);
  assert.match(source, /ReviewHistory viewport="1280"/u);
  assert.doesNotMatch(source, /openingLine|primaryReason|finalDraft|verifiedEmail/u);
});

check("E2 standalone Auth and navigation files are byte-unchanged", () => {
  assert.equal(
    diffFromBase([
      "app/login",
      "app/api/account/session",
      "app/api/auth/account",
      "app/api/auth/logout",
      "components/layout/CustomerSessionNav.tsx",
      "components/layout/SiteHeader.tsx",
      "lib/customer-auth/account-attempt.ts",
      "lib/customer-auth/account-application.ts",
      "lib/customer-auth/browser-events.ts",
    ]),
    "",
  );
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

check("E3 adds no migration, dependency, or Next.js change", () => {
  assert.equal(diffFromBase(["supabase/migrations"]), "");
  assert.equal(diffFromBase(["package-lock.json"]), "");
  assert.equal(
    JSON.parse(text("package.json")).dependencies.next,
    "^16.3.0",
  );
});

check("canonical E3 evidence preserves candidate-only status", () => {
  const source = text("docs/m2/M2_E3_ACCOUNT_MY_REPORTS_RESULT.md");
  assert.match(source, /SOURCE CANDIDATE — PENDING HUMAN\/CHATGPT REVIEW/u);
  assert.match(source, /ACCOUNT \/ MY REPORTS SOURCE CANDIDATE/u);
  assert.match(source, /AUTHENTICATED RESULT RECOVERY SOURCE CANDIDATE/u);
  assert.match(source, /ACCOUNT\/RESULT SLICE FURTHER ADDRESSED[\s\S]*?NOT CLOSED/u);
});

console.log(`M2-E3 Account/My Reports/Authenticated Result Recovery verification: ${passed}/${passed} checks passed.`);
