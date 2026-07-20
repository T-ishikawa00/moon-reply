import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { isDeepStrictEqual } from "node:util";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, "..");
const safeRepositoryRoot = repositoryRoot.replaceAll("\\", "/");
const require = createRequire(import.meta.url);

const LOCK_VERSION = "M1-P3-lock-v1";
const ACCEPTED_SOURCE_BASE = "84edb93c6e098c65ae2e180478827033c25d488a";

const sourceLocks = [
  {
    id: "SOURCE-RESULT-NORMAL",
    file: "fixtures/review/reports.ts",
    start: "const resultNormal001 = {",
    end: "} as const satisfies ReviewReportFixture;",
    expectedHash: "a313e2824593518f5fd5eddd4de8b8c37683c5c3bbe49d7669b7e92638542126",
    expectedLength: 5231,
  },
  {
    id: "SOURCE-PUBLIC-WAIT",
    file: "fixtures/public/public-sample-cases.ts",
    start: "export const PUBLIC_SAMPLE_WAIT_CASE = {",
    end: "} as const satisfies PublicSampleCase;",
    expectedHash: "784e25504051ab9b0e238e9c70810f90f339005441d88e02577d9632e1262e91",
    expectedLength: 949,
  },
  {
    id: "SOURCE-PUBLIC-SEND",
    file: "fixtures/public/public-sample-cases.ts",
    start: "export const PUBLIC_SAMPLE_SEND_CASE = {",
    end: "} as const satisfies PublicSampleReportCase;",
    expectedHash: "3acd9f2d74463ba10f8cdf3436a7dd66504ecae083075e45eb86fc94ff7c83a3",
    expectedLength: 2222,
  },
  {
    id: "SOURCE-PUBLIC-DISTANCE",
    file: "fixtures/public/public-sample-cases.ts",
    start: "export const PUBLIC_SAMPLE_DISTANCE_CASE = {",
    end: "} as const satisfies PublicSampleCase;",
    expectedHash: "a3b1eb9df12abf3393906b1ca4da98000f471fc715632f030ab792baf760b08a",
    expectedLength: 963,
  },
  {
    id: "SOURCE-SAFETY-STATES",
    file: "fixtures/review/safety-states.ts",
    start: "export const REVIEW_SAFETY_STATES = {",
    end: "} satisfies Record<string, ReviewSafetyState>;",
    expectedHash: "49f93126eb8448893c2065fa7232d0ade2d9bda17ee2949a8c4d50fb310d5d29",
    expectedLength: 3492,
  },
  {
    id: "SOURCE-PURCHASE-CONFIRMATION",
    file: "fixtures/review/purchase-confirmations.ts",
    start: "const normalPurchaseConfirmation: ReviewPurchaseConfirmationFixture = {",
    end: "};",
    expectedHash: "05cbc1e3fd75e5687cda8211f3d0eb4f60e9278efb9caae9450898f510866458",
    expectedLength: 602,
  },
  {
    id: "SOURCE-FIXED-PRODUCT-FACTS",
    file: "lib/legal/review-content.ts",
    start: "export const fixedProductFacts = [",
    end: "] as const;",
    expectedHash: "9b63d8e80aa74b4262f753eaaaa7a2ed8f3e28f2a38934529a75bd07b24768e8",
    expectedLength: 706,
  },
  {
    id: "SOURCE-UNSUPPORTED-CASES",
    file: "lib/legal/review-content.ts",
    start: "export const unsupportedCaseCategories = [",
    end: "] as const;",
    expectedHash: "5d30aa4447f10dd57a97d9981681e564fa58a91238cec3028e3e3b23d08f0737",
    expectedLength: 365,
  },
];

const scalarLocks = [
  ["SCALAR-JUDGMENT", "今日は送らない方がいい", "c87fe58e43ae8d87468d60450d326d2e651b03c338d8fcb20714e910ce91b291"],
  ["SCALAR-PUBLIC-WAIT", "今夜は送らず、明日以降に再判断する", "8a67b8b408dde3de281605975c090aa97d8b45d94ccf01d94cd51aacf1f2cbbf"],
  ["SCALAR-PUBLIC-SEND", "今夜は短く返信してよい", "cda9fe2062c0e55d1fb8b5bd69887f1d8fd525da18387ac660ec225cdc20b514"],
  ["SCALAR-PUBLIC-DISCLOSURE", "この全文見本は固定の架空ケースです。実在相談、購入者事例、レビュー、AI生成実績ではありません。", "de7c0f96875ee9f473fe2d78e16aae42df5ee33998966bda605f1e5c15f1a7af"],
  ["SCALAR-PUBLIC-DISTANCE", "こちらからの追加連絡を一度止める", "69c66535528c3920260563477f43df6a67a95c45f0e8f026127bbf606bda7529"],
  ["SCALAR-SAFETY-BEFORE-PAYMENT", "安全確認を決済より前に行い、rejected と needs_review は初期MVPで購入不可", "8d36beb99dfea8c513531dde7044e2ff94dd643258954f981945b686f4084ede"],
  ["SCALAR-PRODUCT-NAME", "恋のメッセージ鑑定ノート", "30ec625cb1be75273a07abc1fac2582f97bf36a0152de3762d62744f3807f404"],
  ["SCALAR-WEB-NAME", "Web鑑定ノート", "60ca061b8ae285dff8c345b73401619e01dbe70e95705dae15c7a18c945c0830"],
  ["SCALAR-SAVE-NAME", "保存用判断カード", "a49675c69b4d2286e1ed0598904f1981262fec1f2fd23158788515326b2167cc"],
  ["SCALAR-PRICE", "税込980円", "64ebe3457bc4aaf6f8d782733c11cbbfd563ddfb1e09a216a4fc88f6727b4f96"],
  ["SCALAR-UNIT", "1相談 / 1鑑定ノート", "29250189f7418c0571a67c06fb98eb3ae9dbe499f8b2df149dc1d19d457d23ca"],
  ["SCALAR-AGE", "18歳以上", "78cc97a99fe133f66562d307fc3d39f8a1ca1f8f71fc50cbd55881c83e54d4b5"],
  ["SCALAR-PURCHASE-DISABLED", "購入機能は現在準備中です", "423281f6268a0a4394eb00af846ecf96cb5e5cc79406ca35149d503a9b78600a"],
  ["SCALAR-CATEGORY", "AIを活用した恋愛メッセージ分析・判断支援デジタルレポート", "a38dcfc4e10cca96a68e2b7b541101a45a3e379aa2fe29020867df7bd667fe89"],
  ["SCALAR-AI-DISCLOSURE", "AI利用を明示", "84d6e431fbe9d3c6032a89a947d7c5925c222d7d1094794c92db8945a908a717"],
  ["SCALAR-NON-GUARANTEE", "相手の本心、返信、復縁、未来または関係改善を保証しない", "606dbf88f9dc613cd977c80dc156047e8f6aaf6175b7712b739d8249168b01db"],
];

const compilationFiles = [
  "fixtures/review/reports.ts",
  "fixtures/public/public-sample-cases.ts",
  "fixtures/review/requests.ts",
  "fixtures/review/safety-states.ts",
  "fixtures/review/purchase-confirmations.ts",
  "lib/legal/review-content.ts",
];

const objectDiffFiles = [
  "fixtures/review/reports.ts",
  "fixtures/public/public-sample-cases.ts",
  "fixtures/review/safety-states.ts",
  "fixtures/review/purchase-confirmations.ts",
  "lib/legal/review-content.ts",
];

function sha256(value) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function readSource(relativePath) {
  return readFileSync(path.join(repositoryRoot, relativePath), "utf8").replace(/\r\n?/gu, "\n");
}

function countOccurrences(source, value) {
  return source.split(value).length - 1;
}

function includesAll(source, snippets) {
  return snippets.every((snippet) => source.includes(snippet));
}

function ordered(source, snippets) {
  let cursor = -1;
  for (const snippet of snippets) {
    cursor = source.indexOf(snippet, cursor + 1);
    if (cursor < 0) return false;
  }
  return true;
}

function functionSlice(source, startMarker, endMarker) {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start + startMarker.length);
  if (start < 0 || end < 0) return "";
  return source.slice(start, end);
}

function runGit(args) {
  return spawnSync(
    "git",
    ["-c", `safe.directory=${safeRepositoryRoot}`, ...args],
    { cwd: repositoryRoot, encoding: "utf8" },
  );
}

async function writeAcceptedBaseline(baselineRoot) {
  for (const relativePath of compilationFiles) {
    const result = runGit(["show", `${ACCEPTED_SOURCE_BASE}:${relativePath}`]);
    if (result.status !== 0) {
      throw new Error(`Cannot read accepted baseline ${relativePath}: ${result.stderr || result.stdout}`);
    }
    const destination = path.join(baselineRoot, relativePath);
    await mkdir(path.dirname(destination), { recursive: true });
    await writeFile(destination, result.stdout, "utf8");
  }
}

function compileTree(sourceRoot, outputRoot) {
  const compilerPath = path.join(repositoryRoot, "node_modules", "typescript", "bin", "tsc");
  if (!existsSync(compilerPath)) {
    throw new Error(`TypeScript compiler not found: ${compilerPath}`);
  }

  const compilation = spawnSync(
    process.execPath,
    [
      compilerPath,
      "--ignoreConfig",
      "--pretty",
      "false",
      "--target",
      "ES2020",
      "--module",
      "Node16",
      "--moduleResolution",
      "Node16",
      "--esModuleInterop",
      "true",
      "--skipLibCheck",
      "true",
      "--rootDir",
      sourceRoot,
      "--outDir",
      outputRoot,
      ...compilationFiles.map((relativePath) => path.join(sourceRoot, relativePath)),
    ],
    { cwd: repositoryRoot, encoding: "utf8" },
  );

  if (compilation.status !== 0) {
    throw new Error(`TypeScript compilation failed:\n${compilation.stdout || ""}${compilation.stderr || ""}`);
  }
}

function loadCompiledModules(outputRoot) {
  return {
    reports: require(path.join(outputRoot, "fixtures", "review", "reports.js")),
    publicSamples: require(path.join(outputRoot, "fixtures", "public", "public-sample-cases.js")),
    safetyStates: require(path.join(outputRoot, "fixtures", "review", "safety-states.js")),
    purchase: require(path.join(outputRoot, "fixtures", "review", "purchase-confirmations.js")),
    legal: require(path.join(outputRoot, "lib", "legal", "review-content.js")),
  };
}

function factValue(modules, label) {
  return modules.legal.fixedProductFacts.find((item) => item.label === label)?.value;
}

function sameValue(values) {
  const first = values[0];
  return values.every((value) => value === first) ? first : JSON.stringify(values);
}

function record(results, id, pass, detail) {
  results.push({ id, pass, detail });
}

function printResults(results, kind) {
  for (const result of results) {
    const prefix = result.pass ? "PASS" : "FAIL";
    console.log(`${prefix} ${kind} ${result.id}: ${result.detail}`);
  }
}

function evaluateSourceLocks(results) {
  for (const lock of sourceLocks) {
    const source = readSource(lock.file);
    const start = source.indexOf(lock.start);
    const end = source.indexOf(lock.end, start);
    if (start < 0 || end < 0) {
      record(results, lock.id, false, "source-slice markers missing");
      continue;
    }
    const slice = source.slice(start, end + lock.end.length);
    const actualHash = sha256(slice);
    const pass = actualHash === lock.expectedHash && slice.length === lock.expectedLength;
    record(
      results,
      lock.id,
      pass,
      `expected=${lock.expectedHash}/${lock.expectedLength}; actual=${actualHash}/${slice.length}`,
    );
  }
}

function evaluateObjectEquality(results, current, baseline) {
  const objectLocks = [
    ["OBJECT-RESULT-NORMAL", current.reports.REPORT_FIXTURES, baseline.reports.REPORT_FIXTURES],
    ["OBJECT-PUBLIC-WAIT", current.publicSamples.PUBLIC_SAMPLE_WAIT_CASE, baseline.publicSamples.PUBLIC_SAMPLE_WAIT_CASE],
    ["OBJECT-PUBLIC-SEND", current.publicSamples.PUBLIC_SAMPLE_SEND_CASE, baseline.publicSamples.PUBLIC_SAMPLE_SEND_CASE],
    ["OBJECT-PUBLIC-DISTANCE", current.publicSamples.PUBLIC_SAMPLE_DISTANCE_CASE, baseline.publicSamples.PUBLIC_SAMPLE_DISTANCE_CASE],
    ["OBJECT-SAFETY-STATES", current.safetyStates.REVIEW_SAFETY_STATES, baseline.safetyStates.REVIEW_SAFETY_STATES],
    ["OBJECT-PURCHASE-CONFIRMATION", current.purchase.PURCHASE_CONFIRMATION_FIXTURES, baseline.purchase.PURCHASE_CONFIRMATION_FIXTURES],
    ["OBJECT-FIXED-PRODUCT-FACTS", current.legal.fixedProductFacts, baseline.legal.fixedProductFacts],
    ["OBJECT-UNSUPPORTED-CASES", current.legal.unsupportedCaseCategories, baseline.legal.unsupportedCaseCategories],
  ];

  for (const [id, actual, expected] of objectLocks) {
    record(results, id, isDeepStrictEqual(actual, expected), `accepted-base=${ACCEPTED_SOURCE_BASE}`);
  }

  const diff = runGit(["diff", "--quiet", ACCEPTED_SOURCE_BASE, "--", ...objectDiffFiles]);
  record(
    results,
    "FIXTURE-OBJECT-DIFF-EXACT",
    diff.status === 0,
    diff.status === 0 ? "all named owner files equal accepted base" : "named owner file drift detected",
  );
}

function evaluateScalarLocks(results, current) {
  const report = current.reports.REPORT_FIXTURES["result-normal-001"];
  const purchase = current.purchase.PURCHASE_CONFIRMATION_FIXTURES["normal-001"];
  const purchaseText = "購入機能は現在準備中です";
  const purchaseTextOccurrences =
    countOccurrences(readSource("components/review/ReviewPurchaseConfirmation.tsx"), purchaseText)
    + countOccurrences(readSource("components/request/RequestForm.tsx"), purchaseText);

  const actualValues = new Map([
    ["SCALAR-JUDGMENT", report?.judgmentLabel],
    ["SCALAR-PUBLIC-WAIT", current.publicSamples.PUBLIC_SAMPLE_WAIT_CASE?.conclusion],
    ["SCALAR-PUBLIC-SEND", current.publicSamples.PUBLIC_SAMPLE_SEND_CASE?.conclusion],
    ["SCALAR-PUBLIC-DISCLOSURE", current.publicSamples.PUBLIC_SAMPLE_SEND_CASE?.report?.fixedDisclosure],
    ["SCALAR-PUBLIC-DISTANCE", current.publicSamples.PUBLIC_SAMPLE_DISTANCE_CASE?.conclusion],
    ["SCALAR-SAFETY-BEFORE-PAYMENT", factValue(current, "Safety")],
    ["SCALAR-PRODUCT-NAME", sameValue([factValue(current, "利用者向け商品名"), purchase?.product?.userFacingLabel])],
    ["SCALAR-WEB-NAME", purchase?.product?.included?.[0]],
    ["SCALAR-SAVE-NAME", purchase?.product?.included?.[1]],
    ["SCALAR-PRICE", sameValue([factValue(current, "販売価格"), purchase?.product?.price])],
    ["SCALAR-UNIT", sameValue([factValue(current, "商品数量"), purchase?.product?.quantity])],
    ["SCALAR-AGE", factValue(current, "対象年齢")],
    ["SCALAR-PURCHASE-DISABLED", purchaseTextOccurrences >= 3 ? purchaseText : `<occurrences:${purchaseTextOccurrences}>`],
    ["SCALAR-CATEGORY", sameValue([factValue(current, "サービス分類"), purchase?.product?.officialClassification])],
    ["SCALAR-AI-DISCLOSURE", factValue(current, "AI利用")],
    ["SCALAR-NON-GUARANTEE", factValue(current, "非保証")],
  ]);

  for (const [id, expectedValue, expectedHash] of scalarLocks) {
    const actualValue = actualValues.get(id) ?? "<missing>";
    const actualHash = sha256(actualValue);
    record(
      results,
      id,
      actualValue === expectedValue && actualHash === expectedHash,
      `expected=${expectedHash}; actual=${actualHash}`,
    );
  }
}

function evaluateRenderedStrings(results, current) {
  const webSource = readSource("components/report/ReviewWebReport.tsx");
  const saveSource = readSource("components/report/ReviewSaveReport.tsx");
  const lpSource = readSource("app/page.tsx");
  const samplePageSource = readSource("app/sample-report/page.tsx");
  const publicSampleSource = readSource("components/report/PublicSampleReport.tsx");
  const comparisonSource = readSource("components/report/ReportComparisonNavigation.tsx");
  const purchaseSource = readSource("components/review/ReviewPurchaseConfirmation.tsx");
  const requestSource = readSource("components/request/RequestForm.tsx");
  const unsupportedSource = readSource("app/legal/unsupported-cases/page.tsx");
  const report = current.reports.REPORT_FIXTURES["result-normal-001"];
  const publicCases = current.publicSamples.PUBLIC_SAMPLE_CASES;

  record(
    results,
    "RENDER-WEB-JUDGMENT",
    report?.judgmentLabel === "今日は送らない方がいい"
      && includesAll(webSource, ['title="今夜の答え"', "{report.judgmentLabel}"]),
    "locked report judgment is bound to the Web answer",
  );
  record(
    results,
    "RENDER-SAVE-JUDGMENT",
    report?.judgmentLabel === "今日は送らない方がいい"
      && includesAll(saveSource, [">今夜の答え<", "{report.judgmentLabel}"]),
    "locked report judgment is bound to the save answer",
  );
  record(
    results,
    "RENDER-LP-JUDGMENT",
    includesAll(lpSource, [
      'const preview = REPORT_FIXTURES["result-normal-001"]',
      "<h3>{preview.judgmentLabel}</h3>",
      "<strong>{preview.judgmentLabel}</strong>",
    ]),
    "LP preview renders the accepted report fixture judgment at both named occurrences",
  );
  record(
    results,
    "RENDER-LP-PUBLIC-CASE-CONCLUSIONS",
    Array.isArray(publicCases)
      && publicCases.length === 3
      && includesAll(lpSource, ["PUBLIC_SAMPLE_CASES.map", "<strong>{sampleCase.conclusion}</strong>"]),
    "three fixed public conclusions are rendered from the locked case objects",
  );
  record(
    results,
    "RENDER-PUBLIC-SEND-JUDGMENT",
    includesAll(samplePageSource, ["PUBLIC_SAMPLE_SEND_CASE", "<PublicSampleReport sample={PUBLIC_SAMPLE_SEND_CASE} />"])
      && includesAll(publicSampleSource, [">今夜の答え<", "{sample.conclusion}"]),
    "full sample renders the locked send conclusion",
  );
  record(
    results,
    "RENDER-PUBLIC-DISCLOSURE",
    publicSampleSource.includes("<p>{report.fixedDisclosure}</p>"),
    "full sample renders the locked fictional-case disclosure",
  );
  record(
    results,
    "RENDER-FORMAL-NAMES",
    includesAll(lpSource, ["恋のメッセージ鑑定ノート", "Web鑑定ノート", "保存用判断カード"])
      && includesAll(comparisonSource, ['label: "Web鑑定ノート"', 'label: "保存用判断カード"']),
    "locked formal names remain on the named LP/comparison surfaces",
  );
  record(
    results,
    "RENDER-PURCHASE-DISABLED",
    includesAll(purchaseSource, ["disabled", "購入機能は現在準備中です"])
      && includesAll(requestSource, ['type="button" disabled', "購入機能は現在準備中です"]),
    "both purchase controls use the locked string and native disabled state",
  );
  record(
    results,
    "RENDER-UNSUPPORTED-CASES",
    includesAll(unsupportedSource, [
      'import { unsupportedCaseCategories } from "@/lib/legal/review-content"',
      "unsupportedCaseCategories.map",
    ]),
    "legal page renders the exact locked category export",
  );
}

function evaluateSemanticAssertions(results, current, safetyRun) {
  const requestSource = readSource("components/request/RequestForm.tsx");
  const requestPageSource = readSource("app/request/page.tsx");
  const aiDisclosureSource = readSource("app/legal/ai-disclosure/page.tsx");
  const unsupportedSource = readSource("app/legal/unsupported-cases/page.tsx");
  const publicSampleSource = readSource("components/report/PublicSampleReport.tsx");
  const purchaseSource = readSource("components/review/ReviewPurchaseConfirmation.tsx");
  const reviewBannerSource = readSource("components/review/ReviewBanner.tsx");
  const reviewIndexSource = readSource("app/review/page.tsx");
  const webSource = readSource("components/report/ReviewWebReport.tsx");
  const saveSource = readSource("components/report/ReviewSaveReport.tsx");
  const comparisonSource = readSource("components/report/ReportComparisonNavigation.tsx");
  const safetyStates = Object.values(current.safetyStates.REVIEW_SAFETY_STATES);
  const purchase = current.purchase.PURCHASE_CONFIRMATION_FIXTURES["normal-001"];
  const report = current.reports.REPORT_FIXTURES["result-normal-001"];

  const safetyHandler = functionSlice(requestSource, "function continueFromSafety()", "function continueFromMemo()");
  const memoHandler = functionSlice(requestSource, "function continueFromMemo()", "function handleEmailSubmit(");
  const submitHandler = functionSlice(requestSource, "function handleEmailSubmit(", "if (completed)");
  const safetyBeforePayment =
    factValue(current, "Safety") === "安全確認を決済より前に行い、rejected と needs_review は初期MVPで購入不可"
    && ordered(safetyHandler, ["validateSheet(form)", "validateSafety(form)", 'classification !== "normal_allowed"', "moveToPhase(3)"])
    && ordered(memoHandler, ["validateSheet(form)", "validateSafety(form)", 'classification !== "normal_allowed"', "moveToPhase(4)"])
    && ordered(submitHandler, ["validateSheet(form)", "validateSafety(form)", "validateEmail(form)", 'classification !== "normal_allowed"', "setCompleted(true)"])
    && requestPageSource.includes("決済より前にSafetyを確認");
  record(results, "SEM-SAFETY-BEFORE-PAYMENT", safetyBeforePayment, "all three transitions revalidate prior input and Safety before local completion");

  const continuationStates = safetyStates.filter((state) => state.canReachConfirmation);
  const normalOnly = continuationStates.length === 1
    && continuationStates[0].stateName === "normal_allowed"
    && countOccurrences(requestSource, 'safetyResult.classification !== "normal_allowed"') === 3;
  record(results, "SEM-NORMAL-ONLY", normalOnly, `continuation-enabled states=${continuationStates.map((state) => state.stateName).join(",")}`);

  const safetyOutput = `${safetyRun.stdout || ""}\n${safetyRun.stderr || ""}`;
  const failClosed =
    current.safetyStates.getReviewSafetyState("unknown-state") === undefined
    && safetyStates.filter((state) => state.stateName !== "normal_allowed").every((state) => !state.canReachConfirmation)
    && safetyOutput.includes("CONTRADICTORY_SELECTION: PASS")
    && safetyOutput.includes("SEM-UNSUPPORTED-CASES: PASS");
  record(results, "SEM-FAIL-CLOSED", failClosed, "unknown, invalid, contradictory, missing-consent, needs_review, and rejected states do not continue");

  const aiDisclosure =
    factValue(current, "AI利用") === "AI利用を明示"
    && includesAll(aiDisclosureSource, ["AI APIを呼び出しません", "AI利用は申込前と鑑定ノート内で明示します", "固定データ"])
    && includesAll(requestSource, ["AIを利用して、入力された情報を整理・分析する予定です。", "現在は送信も保存もされません。"])
    && report.fixedLimitationDisclaimer.includes("AIが整理・分析した判断材料");
  record(results, "SEM-AI-DISCLOSURE", aiDisclosure, "future intended AI use is disclosed while current fixed-fixture runtime inactivity remains explicit");

  const nonGuarantee =
    factValue(current, "非保証") === "相手の本心、返信、復縁、未来または関係改善を保証しない"
    && report.fixedLimitationDisclaimer.includes("断定・保証するものではありません")
    && report.fixedLimitationDisclaimer.includes("医療・心理・法律上の助言ではありません")
    && includesAll(requestSource, ["相手の本心や返信、復縁、交際、将来の結果を保証しません。", "法律相談を代替するものではありません。"])
    && includesAll(publicSampleSource, ["断定・保証しません。", "医療・心理・法律上の助言でもありません。"]);
  record(results, "SEM-NON-GUARANTEE", nonGuarantee, "all named source and rendered owners preserve non-guarantee and professional boundaries");

  const unsupportedCases =
    current.legal.unsupportedCaseCategories.length === 13
    && unsupportedSource.includes("unsupportedCaseCategories.map")
    && safetyRun.status === 0
    && safetyOutput.includes("SEM-UNSUPPORTED-CASES: PASS");
  record(results, "SEM-UNSUPPORTED-CASES", unsupportedCases, "13 locked categories render in order and the executable Safety policy gate passes");

  const purchaseDisabled =
    purchase.transactionState === "not_started"
    && purchase.provider === "unselected"
    && includesAll(purchaseSource, ['type="button"', "disabled", 'aria-disabled="true"'])
    && includesAll(requestSource, ['type="button" disabled', 'aria-disabled="true"'])
    && !/\b(fetch|XMLHttpRequest|createClient|checkout)\s*\(/u.test(`${purchaseSource}\n${requestSource}`);
  record(results, "SEM-PURCHASE-DISABLED", purchaseDisabled, "native controls are disabled, transaction is not_started, and provider/checkout handlers are absent");

  const runtimeSources = [
    requestSource,
    requestPageSource,
    reviewBannerSource,
    reviewIndexSource,
    webSource,
    saveSource,
    comparisonSource,
  ].join("\n");
  const runtimeCallPattern = /\bfetch\s*\(|\bXMLHttpRequest\b|\bWebSocket\b|@supabase\/|\bcreateClient\s*\(|\bopenai\b|\bstripe\b|\bnodemailer\b|\bsendgrid\b|\bwriteFile\s*\(|\bcreateObjectURL\s*\(|navigator\.share|window\.print/u;
  const runtimeInactive =
    !existsSync(path.join(repositoryRoot, "app", "api"))
    && !runtimeCallPattern.test(runtimeSources)
    && includesAll(requestPageSource, ["入力内容は外部へ送信・保存されず", "決済、AI生成、メール送信も行われません"])
    && includesAll(reviewBannerSource, ["実際の決済・送信は行われません", "AI生成、メール配信、データ保存も動作しません"])
    && includesAll(reviewIndexSource, ["決済、外部送信、AI生成、メール配信、データ保存、ファイル生成は動作しません"]);
  record(results, "SEM-RUNTIME-INACTIVE", runtimeInactive, "no API route or external runtime owner exists and all named surfaces state inactivity");
}

function runSafetyVerifier() {
  return spawnSync(
    process.execPath,
    [path.join(repositoryRoot, "scripts", "verify-m1-safety-policy.mjs")],
    { cwd: repositoryRoot, encoding: "utf8" },
  );
}

function printFinal(exactPass, semanticPass, safetyPass) {
  const contentPass = exactPass && semanticPass && safetyPass;
  console.log("");
  console.log(`EXACT_LOCKS: ${exactPass ? "PASS" : "FAIL"}`);
  console.log(`SEMANTIC_ASSERTIONS: ${semanticPass ? "PASS" : "FAIL"}`);
  console.log(`SAFETY_POLICY_GATE: ${safetyPass ? "PASS" : "FAIL"}`);
  console.log(`CONTENT_LOCK_GATE: ${contentPass ? "PASS" : "FAIL"}`);
  return contentPass;
}

const temporaryDirectory = await mkdtemp(path.join(tmpdir(), "moon-reply-m1-content-locks-"));
let completed = false;

try {
  const baselineRoot = path.join(temporaryDirectory, "baseline-source");
  const baselineOutput = path.join(temporaryDirectory, "baseline-output");
  const currentOutput = path.join(temporaryDirectory, "current-output");
  await writeAcceptedBaseline(baselineRoot);
  compileTree(baselineRoot, baselineOutput);
  compileTree(repositoryRoot, currentOutput);

  const baseline = loadCompiledModules(baselineOutput);
  const current = loadCompiledModules(currentOutput);
  const safetyRun = runSafetyVerifier();
  const currentCommit = runGit(["rev-parse", "HEAD"]);

  const exactResults = [];
  const semanticResults = [];
  evaluateSourceLocks(exactResults);
  evaluateObjectEquality(exactResults, current, baseline);
  evaluateScalarLocks(exactResults, current);
  evaluateRenderedStrings(exactResults, current);
  evaluateSemanticAssertions(semanticResults, current, safetyRun);

  console.log("Exact locks");
  console.log(`source commit: ${(currentCommit.stdout || "unknown").trim()}`);
  console.log(`accepted source base: ${ACCEPTED_SOURCE_BASE}`);
  console.log(`lock algorithm version: ${LOCK_VERSION}`);
  printResults(exactResults, "exact");
  const exactPass = exactResults.every((result) => result.pass);
  console.log(`EXACT_LOCKS: ${exactPass ? "PASS" : "FAIL"}`);

  console.log("");
  console.log("Semantic behavior assertions");
  printResults(semanticResults, "semantic");
  const semanticPass = semanticResults.every((result) => result.pass);
  console.log(`SEMANTIC_ASSERTIONS: ${semanticPass ? "PASS" : "FAIL"}`);

  console.log("");
  console.log("Safety policy");
  if (safetyRun.stdout) process.stdout.write(safetyRun.stdout);
  if (safetyRun.stderr) process.stderr.write(safetyRun.stderr);
  const safetyOutput = `${safetyRun.stdout || ""}\n${safetyRun.stderr || ""}`;
  const safetyPass = safetyRun.status === 0
    && safetyOutput.includes("SEM-UNSUPPORTED-CASES: PASS")
    && safetyOutput.includes("SAFETY_POLICY_GATE: PASS");

  completed = printFinal(exactPass, semanticPass, safetyPass);
  if (!completed) process.exitCode = 1;
} catch (error) {
  console.error(error instanceof Error ? error.stack ?? error.message : String(error));
  printFinal(false, false, false);
  process.exitCode = 1;
} finally {
  await rm(temporaryDirectory, { recursive: true, force: true });
}
