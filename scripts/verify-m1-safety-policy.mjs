import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, "..");
const require = createRequire(import.meta.url);

const groups = {
  exact: [],
  natural: [],
  benign: [],
  structured: [],
  normal: [],
  contradictory: [],
  lock: [],
};

function recordFailure(group, id, expected, actual, reasonCodes = []) {
  groups[group].push(
    `${id}: expected=${expected}; actual=${actual}; reasonCodes=[${reasonCodes.join(", ")}]`,
  );
}

function assertClassification({
  group,
  id,
  classifySafetyInput,
  input,
  expectedClassification,
  expectedReasonCode,
  expectedBlocked = expectedClassification !== "normal_allowed",
}) {
  const result = classifySafetyInput(input);

  if (result.classification !== expectedClassification) {
    recordFailure(
      group,
      id,
      `classification:${expectedClassification}`,
      `classification:${result.classification}`,
      result.reasonCodes,
    );
  }

  if (
    expectedReasonCode &&
    !result.reasonCodes.includes(expectedReasonCode)
  ) {
    recordFailure(
      group,
      id,
      `reason:${expectedReasonCode}`,
      "reason:missing",
      result.reasonCodes,
    );
  }

  if (result.shouldBlockNormalConfirmation !== expectedBlocked) {
    recordFailure(
      group,
      id,
      `shouldBlockNormalConfirmation:${expectedBlocked}`,
      `shouldBlockNormalConfirmation:${result.shouldBlockNormalConfirmation}`,
      result.reasonCodes,
    );
  }

  return result;
}

function verifyUnsupportedCaseLock() {
  const sourcePath = path.join(
    repositoryRoot,
    "lib",
    "legal",
    "review-content.ts",
  );
  const source = readFileSync(sourcePath, "utf8").replace(/\r\n?/gu, "\n");
  const startMarker = "export const unsupportedCaseCategories = [";
  const endMarker = "] as const;";
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start);

  if (start < 0 || end < 0) {
    recordFailure(
      "lock",
      "unsupported-case-source-slice",
      "markers:present",
      "markers:missing",
    );
    return;
  }

  const slice = source.slice(start, end + endMarker.length);
  const actualHash = createHash("sha256").update(slice, "utf8").digest("hex");
  const expectedHash =
    "5d30aa4447f10dd57a97d9981681e564fa58a91238cec3028e3e3b23d08f0737";
  const expectedLength = 365;

  if (actualHash !== expectedHash || slice.length !== expectedLength) {
    recordFailure(
      "lock",
      "unsupported-case-source-slice",
      `hash:${expectedHash},length:${expectedLength}`,
      `hash:${actualHash},length:${slice.length}`,
    );
  }
}

function runPolicyVerification(safety, legal) {
  const {
    classifySafetyInput,
    NONE_SAFETY_FLAG,
    SAFETY_SELECTED_FLAGS,
  } = safety;
  const { unsupportedCaseCategories } = legal;

  verifyUnsupportedCaseLock();

  const exactMappings = [
    ["rejected", "self_harm"],
    ["rejected", "harm_others"],
    ["needs_review", "dv_abuse_fear"],
    ["rejected", "waiting_or_ambush"],
    ["rejected", "stalking_or_visit"],
    ["rejected", "threat_or_coercion"],
    ["rejected", "surveillance"],
    ["rejected", "surveillance"],
    ["rejected", "surveillance"],
    ["rejected", "doxxing"],
    ["rejected", "minor_related"],
    ["rejected", "illegal_conduct"],
    ["rejected", "third_party_secret"],
  ];

  if (unsupportedCaseCategories.length !== exactMappings.length) {
    recordFailure(
      "exact",
      "category-count",
      `count:${exactMappings.length}`,
      `count:${unsupportedCaseCategories.length}`,
    );
  }

  exactMappings.forEach(([classification, reasonCode], index) => {
    const category = unsupportedCaseCategories[index];
    if (!category) {
      recordFailure(
        "exact",
        `category:${index + 1}`,
        `${classification}/${reasonCode}`,
        "category:missing",
      );
      return;
    }

    assertClassification({
      group: "exact",
      id: `category:${index + 1}`,
      classifySafetyInput,
      input: {
        selectedFlags: [NONE_SAFETY_FLAG],
        mainConcern: category,
      },
      expectedClassification: classification,
      expectedReasonCode: reasonCode,
    });
  });

  const naturalLanguageCases = [
    ["stalking_or_visit:1", "今から相手の家へ行こうと思っています", "stalking_or_visit"],
    ["stalking_or_visit:2", "相手の職場に押しかけようと考えています", "stalking_or_visit"],
    ["threat_or_coercion:1", "言うことを聞かせるために脅迫したい", "threat_or_coercion"],
    ["threat_or_coercion:2", "断っても従わせるつもりです", "threat_or_coercion"],
    ["doxxing:1", "相手の本名を公開するつもりです", "doxxing"],
    ["doxxing:2", "住所をネットに晒そうと思います", "doxxing"],
    ["illegal_conduct:1", "違法な方法を使う手順を知りたい", "illegal_conduct"],
    ["illegal_conduct:2", "犯罪を手伝う相談です", "illegal_conduct"],
    ["third_party_secret:1", "第三者の秘密情報を使う内容です", "third_party_secret"],
    ["third_party_secret:2", "他人の秘密情報を含む相談です", "third_party_secret"],
  ];

  for (const [id, text, reasonCode] of naturalLanguageCases) {
    assertClassification({
      group: "natural",
      id,
      classifySafetyInput,
      input: { selectedFlags: [NONE_SAFETY_FLAG], mainConcern: text },
      expectedClassification: "rejected",
      expectedReasonCode: reasonCode,
    });
  }

  const benignControls = [
    "相手の職場が忙しいと聞きました",
    "個人情報を入力しないようにしたいです",
    "違法ではないか不安です",
    "第三者の秘密は入力しません",
    "家に行く予定はありません",
  ];

  benignControls.forEach((text, index) => {
    assertClassification({
      group: "benign",
      id: `benign:${index + 1}`,
      classifySafetyInput,
      input: { selectedFlags: [NONE_SAFETY_FLAG], mainConcern: text },
      expectedClassification: "normal_allowed",
      expectedReasonCode: "normal",
    });
  });

  const structuredMappings = new Map([
    ["自分を傷つけたい気持ちがある", ["rejected", "self_harm"]],
    ["相手を傷つけたい気持ちがある", ["rejected", "harm_others"]],
    ["相手の家や職場に行こうとしている", ["rejected", "stalking_or_visit"]],
    ["待ち伏せを考えている", ["rejected", "waiting_or_ambush"]],
    ["相手を脅す文面を送りたい", ["rejected", "threat_or_coercion"]],
    ["DV/モラハラ/強い束縛/恐怖がある", ["needs_review", "dv_abuse_fear"]],
    ["未成年との恋愛・面会に関する相談である", ["rejected", "minor_related"]],
    ["実名や個人情報を晒したい", ["rejected", "doxxing"]],
    ["監視・ログイン確認・居場所確認をしたい", ["rejected", "surveillance"]],
    [NONE_SAFETY_FLAG, ["normal_allowed", "normal"]],
  ]);

  if (SAFETY_SELECTED_FLAGS.length !== structuredMappings.size) {
    recordFailure(
      "structured",
      "selected-flag-count",
      `count:${structuredMappings.size}`,
      `count:${SAFETY_SELECTED_FLAGS.length}`,
    );
  }

  SAFETY_SELECTED_FLAGS.forEach((flag, index) => {
    const expected = structuredMappings.get(flag);
    if (!expected) {
      recordFailure(
        "structured",
        `selected-flag:${index + 1}`,
        "known mapping",
        `unknown flag:${flag}`,
      );
      return;
    }

    assertClassification({
      group: "structured",
      id: `selected-flag:${index + 1}`,
      classifySafetyInput,
      input: { selectedFlags: [flag] },
      expectedClassification: expected[0],
      expectedReasonCode: expected[1],
    });
  });

  assertClassification({
    group: "normal",
    id: "normal-control",
    classifySafetyInput,
    input: {
      selectedFlags: [NONE_SAFETY_FLAG],
      mainConcern: "返信のタイミングを落ち着いて考えたいです",
    },
    expectedClassification: "normal_allowed",
    expectedReasonCode: "normal",
  });

  const contradictoryResult = assertClassification({
    group: "contradictory",
    id: "danger-plus-none",
    classifySafetyInput,
    input: {
      selectedFlags: ["相手を脅す文面を送りたい", NONE_SAFETY_FLAG],
    },
    expectedClassification: "rejected",
    expectedReasonCode: "contradictory_selection",
  });
  if (!contradictoryResult.reasonCodes.includes("threat_or_coercion")) {
    recordFailure(
      "contradictory",
      "danger-plus-none",
      "reason:threat_or_coercion",
      "reason:missing",
      contradictoryResult.reasonCodes,
    );
  }

  const allFailures = Object.values(groups).flat();
  for (const failure of allFailures) {
    console.error(`FAIL ${failure}`);
  }

  const pass = (group) => (groups[group].length === 0 ? "PASS" : "FAIL");
  const unsupportedCasesPass =
    groups.exact.length === 0 && groups.lock.length === 0;
  const safetyPolicyPass = allFailures.length === 0;

  console.log(`UNSUPPORTED_CASES_EXACT_LOCK: ${pass("lock")}`);
  console.log(`EXACT_CATEGORY_CASES: ${pass("exact")}`);
  console.log(`NATURAL_LANGUAGE_CASES: ${pass("natural")}`);
  console.log(`BENIGN_CONTROLS: ${pass("benign")}`);
  console.log(`STRUCTURED_FLAGS: ${pass("structured")}`);
  console.log(`NORMAL_CONTROL: ${pass("normal")}`);
  console.log(`CONTRADICTORY_SELECTION: ${pass("contradictory")}`);
  console.log(
    `SEM-UNSUPPORTED-CASES: ${unsupportedCasesPass ? "PASS" : "FAIL"}`,
  );
  console.log(`SAFETY_POLICY_GATE: ${safetyPolicyPass ? "PASS" : "FAIL"}`);

  return safetyPolicyPass;
}

const temporaryDirectory = await mkdtemp(
  path.join(tmpdir(), "moon-reply-m1-safety-policy-"),
);

try {
  const compilerPath = path.join(
    repositoryRoot,
    "node_modules",
    "typescript",
    "bin",
    "tsc",
  );
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
      repositoryRoot,
      "--outDir",
      temporaryDirectory,
      path.join(repositoryRoot, "lib", "safety", "index.ts"),
      path.join(repositoryRoot, "lib", "legal", "review-content.ts"),
    ],
    { cwd: repositoryRoot, encoding: "utf8" },
  );

  if (compilation.status !== 0) {
    process.stderr.write(compilation.stdout ?? "");
    process.stderr.write(compilation.stderr ?? "");
    throw new Error(`TypeScript compilation failed with exit code ${compilation.status}`);
  }

  const safety = require(
    path.join(temporaryDirectory, "lib", "safety", "index.js"),
  );
  const legal = require(
    path.join(temporaryDirectory, "lib", "legal", "review-content.js"),
  );

  if (!runPolicyVerification(safety, legal)) {
    process.exitCode = 1;
  }
} catch (error) {
  console.error(`SAFETY_POLICY_GATE: FAIL`);
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
} finally {
  await rm(temporaryDirectory, { recursive: true, force: true });
}
