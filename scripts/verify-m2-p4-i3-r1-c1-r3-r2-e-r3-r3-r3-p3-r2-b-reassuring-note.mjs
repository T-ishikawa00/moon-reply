import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync, spawnSync } from "node:child_process";
import {
  copyFileSync,
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const taskId = "M2-P4-I3-R1-C1-R3-R2-E-R3-R3-R3-P3-R2-B";
const correctionTaskId =
  "M2-P4-I3-R1-C1-R3-R2-E-R3-R3-R3-P3-R2-B-R1";
const baseline = "e509405935e82d7079023609b2d852d51f286f3e";
const expectedParent = "89a6d55fdf3845451e80f1ee21dc648b224bcc9d";
const expectedMain = "61e33a10e195fad17e253a6b9719217e1992f273";
const expectedBranch =
  "fix/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-r2-b-r1-mobile-copy";
const expectedSourceBranch =
  "feat/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-r2-b-reassuring-note";
const acceptedSourceBranch =
  "fix/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-r2-a-r1-customer-text-exclusion";
const acceptedR2AR1Commit = expectedParent;

const notePath = "components/runtime/CustomerAssessmentNote.tsx";
const noteCssPath = "components/runtime/CustomerAssessmentNote.module.css";
const copyButtonPath = "components/runtime/CustomerDraftCopyButton.tsx";
const reviewPagePath = "app/review/runtime/v12/page.tsx";
const fixturesPath =
  "lib/assessment/runtime/review/m2-p4-v12-customer-experience-projection-fixtures.ts";
const packageRoot =
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-r2-b";
const presentationContractPath = `${packageRoot}/presentation-contract-v1.json`;
const capabilitiesPath = `${packageRoot}/capabilities-v1.json`;
const verifierPath =
  "scripts/verify-m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-r2-b-reassuring-note.mjs";
const reviewDocumentPath =
  "docs/phase2/TASK_M2_P4_I3_R1_C1_R3_R2_E_R3_R3_R3_P3_R2_B_REVIEW.md";
const experienceProjectionPath =
  "lib/assessment/runtime/customer-assessment-experience-projection-v2.ts";
const r2aVerifierPath =
  "scripts/verify-m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-r2-a-experience-projection.mjs";

const updatedPaths = [
  notePath,
  noteCssPath,
  presentationContractPath,
  capabilitiesPath,
  verifierPath,
  reviewDocumentPath,
];
const exactScope = [...updatedPaths];

const fixtureIds = [
  "simple_business_reply_with_draft",
  "ordinary_reply_waiting",
  "polite_thank_you_with_draft",
  "relationship_summary_requested",
  "expanded_plan_requested_legacy",
  "expanded_plan_requested_split",
  "nullable_optional_sections",
  "pause_additional_contact_no_draft",
  "kansai_persona_draft",
];

const r2aScope = [
  experienceProjectionPath,
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-r2-a/projection-contract-v1.json",
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-r2-a/projection-fixtures-v1.json",
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-r2-a/offline-results-v1.json",
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-r2-a/capabilities-v1.json",
  r2aVerifierPath,
  "docs/phase2/TASK_M2_P4_I3_R1_C1_R3_R2_E_R3_R3_R3_P3_R2_A_REVIEW.md",
];

const doctrineRoot =
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-r1";
const doctrineScope = [
  `${doctrineRoot}/product-doctrine-v1.json`,
  `${doctrineRoot}/product-doctrine-v1.md`,
  `${doctrineRoot}/experience-projection-gap-v1.json`,
  `${doctrineRoot}/experience-section-architecture-v1.json`,
  `${doctrineRoot}/human-visual-review-v1.json`,
  `${doctrineRoot}/implementation-packages-v1.json`,
  `${doctrineRoot}/capabilities-v1.json`,
];

const protectedPaths = [
  reviewPagePath,
  fixturesPath,
  "lib/assessment/runtime/customer-assessment-projection-v1.ts",
  "lib/assessment/runtime/customer-assessment-delivery-v1.ts",
  "lib/assessment/runtime/runtime-result-normalization-v1.ts",
  "lib/assessment/runtime/types.ts",
  "lib/assessment/runtime/schema-catalog.ts",
  "lib/assessment/runtime/service.ts",
  "lib/assessment/runtime/pipeline.ts",
  "lib/assessment/runtime/supabase-repository.ts",
  "components/runtime/RuntimeAssessmentForm.tsx",
  "components/runtime/RuntimeAssessmentNote.tsx",
  copyButtonPath,
  "app/api/internal/assessments/route.ts",
  "lib/assessment/runtime/review/m2-p4-v12-customer-projection-fixtures.ts",
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3/presentation-contract-v1.json",
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3/visual-review-cases-v1.json",
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3/capabilities-v1.json",
  "scripts/verify-m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-customer-note.mjs",
  "docs/phase2/TASK_M2_P4_I3_R1_C1_R3_R2_E_R3_R3_R3_P3_REVIEW.md",
];

function git(args, options = {}) {
  return execFileSync(
    "git.exe",
    ["-c", "safe.directory=C:/projects/moon-reply", ...args],
    { cwd: root, encoding: "utf8", ...options },
  ).trim();
}

function gitObjectExists(revisionPath) {
  return (
    spawnSync(
      "git.exe",
      [
        "-c",
        "safe.directory=C:/projects/moon-reply",
        "cat-file",
        "-e",
        revisionPath,
      ],
      { cwd: root, stdio: "ignore" },
    ).status === 0
  );
}

function read(relativePath) {
  return readFileSync(path.join(root, relativePath));
}

function readText(relativePath) {
  return new TextDecoder("utf-8", { fatal: true }).decode(read(relativePath));
}

function readJson(relativePath) {
  return JSON.parse(readText(relativePath));
}

function readGitText(revision, relativePath) {
  const value = execFileSync(
    "git.exe",
    [
      "-c",
      "safe.directory=C:/projects/moon-reply",
      "show",
      `${revision}:${relativePath}`,
    ],
    { cwd: root },
  );
  return new TextDecoder("utf-8", { fatal: true }).decode(value);
}

function normalizeNewlines(value) {
  return value.replaceAll("\r\n", "\n");
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function sorted(values) {
  return [...values].sort((left, right) => left.localeCompare(right));
}

function assertBaselineBlobUnchanged(relativePath) {
  assert.equal(
    git(["hash-object", relativePath]),
    git(["rev-parse", `${baseline}:${relativePath}`]),
    relativePath,
  );
}

function selectFixture(fixtures, id) {
  const fixture = fixtures.find((candidate) => candidate.id === id);
  assert.ok(fixture, id);
  return fixture.projection;
}

function visibleFunctionCount(projection) {
  const base = projection.baseProjection;
  return [
    true,
    projection.openingLetter.length > 0,
    Boolean(base.primaryReason) || projection.situationReading.length > 0,
    projection.materialUnknowns.length > 0,
    base.finalDraft !== null ||
      (base.requestedTopics.includes("draft_message") &&
        ["wait_and_reassess", "pause_additional_contact"].includes(
          base.decisionCode,
        )),
    base.requestedTopics.includes("message_impact") &&
      base.messageTemperature !== null,
    base.requestedTopics.includes("relationship") &&
      base.relationshipSummary !== null,
    true,
    true,
    base.requestedTopics.includes("next_three_days") &&
      (base.optionalDetails.expandedPlan?.length ?? 0) > 0,
    projection.closingLines.length > 0,
  ].filter(Boolean).length;
}

let r2aVerifierSummary = "not_run";

function runR2AVerifierInAcceptedClone() {
  const temporaryRoot = mkdtempSync(
    path.join(tmpdir(), "moon-reply-r2-a-r1-accepted-"),
  );
  const cloneRoot = path.join(temporaryRoot, "repo");
  try {
    execFileSync(
      "git.exe",
      ["clone", "--quiet", "--shared", "--no-checkout", root, cloneRoot],
      { cwd: root, stdio: "pipe" },
    );
    const isolatedSafeDirectory = `safe.directory=${cloneRoot.replaceAll("\\", "/")}`;
    execFileSync(
      "git.exe",
      ["-c", isolatedSafeDirectory, "config", "core.autocrlf", "false"],
      { cwd: cloneRoot, stdio: "pipe" },
    );
    execFileSync(
      "git.exe",
      [
        "-c",
        isolatedSafeDirectory,
        "checkout",
        "--quiet",
        "-B",
        acceptedSourceBranch,
        acceptedR2AR1Commit,
      ],
      { cwd: cloneRoot, stdio: "pipe" },
    );
    execFileSync(
      "git.exe",
      ["-c", isolatedSafeDirectory, "branch", "-f", "main", expectedMain],
      { cwd: cloneRoot, stdio: "pipe" },
    );

    const sourceContract = readJson(
      "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p1/source-contract-v1.json",
    );
    const markerName = path.basename(sourceContract.frozen_state.marker_path);
    copyFileSync(
      path.join(root, sourceContract.frozen_state.authorization_path),
      path.join(cloneRoot, sourceContract.frozen_state.authorization_path),
    );
    copyFileSync(
      path.join(root, ".git", markerName),
      path.join(cloneRoot, ".git", markerName),
    );

    const result = spawnSync(
      process.execPath,
      [path.join(cloneRoot, r2aVerifierPath)],
      {
        cwd: cloneRoot,
        encoding: "utf8",
        maxBuffer: 24 * 1024 * 1024,
        stdio: ["ignore", "pipe", "pipe"],
      },
    );
    if (result.status !== 0) {
      throw new Error(
        `R2-A/R1 verifier failed in accepted clone.\nstdout:\n${
          result.stdout ?? ""
        }\nstderr:\n${result.stderr ?? ""}`,
      );
    }
    const output = result.stdout;
    assert.match(output, /Experience projection verifier: PASS 32\/32/u);
    assert.match(output, /exact R1 correction scope: 7\/7/u);
    r2aVerifierSummary = "PASS 32/32 exact 7/7";
  } finally {
    rmSync(temporaryRoot, { recursive: true, force: true });
  }
}

const checks = [];

async function check(name, assertion) {
  try {
    await assertion();
    checks.push({ name, passed: true });
    console.log(`PASS ${name}`);
  } catch (error) {
    checks.push({ name, passed: false });
    console.error(`FAIL ${name}`);
    console.error(error instanceof Error ? error.stack : error);
  }
}

await check("exact baseline branch parent main and origin-main authority", () => {
  const head = git(["rev-parse", "HEAD"]);
  assert.equal(git(["branch", "--show-current"]), expectedBranch);
  assert.equal(git(["rev-parse", baseline]), baseline);
  assert.equal(git(["rev-parse", `${baseline}^`]), expectedParent);
  assert.equal(git(["rev-parse", expectedSourceBranch]), baseline);
  assert.equal(git(["rev-parse", `origin/${expectedSourceBranch}`]), baseline);
  assert.equal(git(["merge-base", head, baseline]), baseline);
  if (head !== baseline) assert.equal(git(["rev-parse", `${head}^`]), baseline);
  assert.equal(git(["rev-parse", "main"]), expectedMain);
  assert.equal(git(["rev-parse", "origin/main"]), expectedMain);
});

await check("exact correction scope 6/6 with exactly 6 updated", () => {
  const tracked = git([
    "diff",
    "--name-status",
    "--no-renames",
    baseline,
    "--",
  ])
    .split(/\r?\n/u)
    .filter(Boolean)
    .map((line) => {
      const [status, relativePath] = line.split("\t");
      return { status, path: relativePath.replaceAll("\\", "/") };
    });
  const trackedPaths = new Set(tracked.map((item) => item.path));
  const untracked = git(["ls-files", "--others", "--exclude-standard"])
    .split(/\r?\n/u)
    .filter(Boolean)
    .map((relativePath) => relativePath.replaceAll("\\", "/"))
    .filter((relativePath) => !trackedPaths.has(relativePath))
    .map((relativePath) => ({ status: "A", path: relativePath }));
  const actual = [...tracked, ...untracked];
  assert.equal(exactScope.length, 6);
  assert.deepEqual(sorted(actual.map((item) => item.path)), sorted(exactScope));
  assert.deepEqual(
    sorted(actual.filter((item) => item.status === "M").map((item) => item.path)),
    sorted(updatedPaths),
  );
  assert.equal(actual.filter((item) => item.status === "A").length, 0);
  for (const candidate of updatedPaths) {
    assert.equal(gitObjectExists(`${baseline}:${candidate}`), true, candidate);
  }
});

await check("strict UTF-8 JSON validity U+FFFD zero secret zero", () => {
  const secretPatterns = [
    /sk-[A-Za-z0-9_-]{20,}/gu,
    /(?:SUPABASE|OPENAI)_[A-Z_]*(?:KEY|SECRET)\s*[:=]\s*["'][^"']+["']/gu,
    /eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/gu,
  ];
  for (const candidate of exactScope) {
    const text = readText(candidate);
    assert.equal(text.includes("\uFFFD"), false, candidate);
    assert.doesNotMatch(text, /[\t ]+$/gmu, candidate);
    for (const pattern of secretPatterns) {
      assert.doesNotMatch(text, pattern, candidate);
    }
  }
  readJson(presentationContractPath);
  readJson(capabilitiesPath);
});

await check("Product Doctrine and R2-A R1 exact 7/7 remain unchanged", () => {
  assert.equal(doctrineScope.length, 7);
  doctrineScope.forEach(assertBaselineBlobUnchanged);
  assert.equal(r2aScope.length, 7);
  r2aScope.forEach(assertBaselineBlobUnchanged);
  assertBaselineBlobUnchanged(experienceProjectionPath);
});

await check("accepted R2-A R1 verifier remains PASS 32/32 exact 7/7", () => {
  runR2AVerifierInAcceptedClone();
});

await check("R2-B remainder R2-A V1 Delivery Runtime and copy action unchanged", () => {
  protectedPaths.forEach(assertBaselineBlobUnchanged);
  assert.match(
    readText("lib/assessment/runtime/schema-catalog.ts"),
    /runtime-stage-catalog-v4\.0\.0/u,
  );
  assert.match(
    readText("lib/assessment/runtime/service.ts"),
    /loadM2P4ProductQualityRuntimeStageCatalog/u,
  );
  const copySource = readText(copyButtonPath);
  assert.match(copySource, /navigator\.clipboard\.writeText\(text\)/u);
  assert.match(copySource, /aria-live="polite"/u);
});

await check("provider marker unchanged authorization consumed rerun false", () => {
  const sourceContract = readJson(
    "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p1/source-contract-v1.json",
  );
  const frozenState = sourceContract.frozen_state;
  const markerPath = path.join(root, frozenState.marker_path);
  const authorization = readJson(frozenState.authorization_path);
  assert.equal(existsSync(markerPath), true);
  assert.equal(sha256(readFileSync(markerPath)), frozenState.marker_raw_sha256);
  assert.equal(
    sha256(read(frozenState.authorization_path)),
    frozenState.authorization_raw_sha256,
  );
  assert.equal(frozenState.authorization_consumed, true);
  assert.equal(frozenState.rerun_authorized, false);
  assert.equal(authorization.consumed, true);
  assert.equal(authorization.rerun_authorized, false);
});

await check("CustomerAssessmentNote accepts ExperienceProjectionV2 only", () => {
  const source = readText(notePath);
  assert.match(
    source,
    /projection:\s*CustomerAssessmentExperienceProjectionV2/u,
  );
  assert.match(source, /const baseProjection = projection\.baseProjection/u);
  assert.doesNotMatch(
    source,
    /CustomerAssessmentProjectionV1|RuntimeReport|SplitRuntimeReportV1|AssessmentExecutionResult|diagnostic artifact|Stage output|Provider output/iu,
  );
  assert.doesNotMatch(
    source,
    /sourceReportSchemaVersion|projectionSchemaVersion|\b(?:caseId|fixtureId)\b|E-R3-[0-9]+/u,
  );
  assert.doesNotMatch(source, /\.policy\b|\.useTiming\b/u);
});

await check("cover uses openingLine heading and compact renderer-owned answer", () => {
  const source = readText(notePath);
  const css = readText(noteCssPath);
  assert.match(
    source,
    /<h1 id="customer-assessment-title">\{openingLine\}<\/h1>/u,
  );
  assert.ok(source.includes("鑑定ノート"));
  assert.ok(source.includes("今の答え"));
  assert.match(source, /decisionLabels\[baseProjection\.decisionCode\]/u);
  assert.doesNotMatch(source, /<h1[^>]*>\s*\{decisionLabels/u);
  assert.match(css, /\.currentAnswer\s*\{/u);
  assert.match(css, /font-size:\s*clamp\(1\.8rem,\s*6vw,\s*3rem\)/u);
});

await check("visible letter situation uncertainty draft action reassessment closing", () => {
  const source = readText(notePath);
  const baselineSource = normalizeNewlines(readGitText(baseline, notePath));
  const expectedSource = baselineSource
    .replace(
      '<p className={styles.sectionKicker}>今夜</p>',
      '<p className={styles.sectionKicker}>いま</p>',
    )
    .replace("<h2>今夜の動き方</h2>", "<h2>今の動き方</h2>");
  assert.notEqual(expectedSource, baselineSource);
  assert.equal(normalizeNewlines(source), expectedSource);
  assert.match(source, /<p className=\{styles\.sectionKicker\}>いま<\/p>/u);
  assert.match(source, /<h2>今の動き方<\/h2>/u);
  assert.equal(source.includes("今夜の動き方"), false);
  for (const heading of [
    "月の返事からの短い手紙",
    "今の状況を読み解く",
    "確認できていること",
    "まだ分からないこと",
    "送信文案",
    "今の動き方",
    "見直す条件",
    "月の返事から最後に",
  ]) {
    assert.ok(source.includes(heading), heading);
  }
  assert.match(source, /projection\.openingLetter/u);
  assert.match(source, /projection\.situationReading/u);
  assert.match(source, /projection\.materialUnknowns/u);
  assert.match(source, /projection\.closingLines/u);
  assert.match(source, /materialUnknowns\.length > 0/u);
  assert.ok(source.indexOf("月の返事からの短い手紙") < source.indexOf("今の動き方"));
  assert.ok(
    source.lastIndexOf("月の返事から最後に") <
      source.indexOf("<footer className={styles.fixedLimitation}"),
  );
});

await check("draft and draftContext preserve exact source with bounded null copy", () => {
  const source = readText(notePath);
  assert.match(
    source,
    /baseProjection\.finalDraft\.text,\s*visibleText/u,
  );
  assert.match(
    source,
    /<CustomerDraftCopyButton key=\{draftText\} text=\{draftText\} \/>/u,
  );
  assert.ok(source.includes("この文面にした理由"));
  assert.match(source, /projection\.draftContext/u);
  assert.match(
    source,
    /baseProjection\.finalDraft === null[\s\S]*requestedTopics\.includes\("draft_message"\)/u,
  );
  assert.ok(source.includes("今は送らず、次の判断材料を待つため、"));
  assert.ok(source.includes("追加の連絡を止める判断のため、"));
});

await check("requested modules and renderer labels remain proportional", () => {
  const source = readText(notePath);
  assert.match(source, /includes\("message_impact"\)/u);
  assert.match(source, /includes\("relationship"\)/u);
  assert.match(source, /includes\("next_three_days"\)/u);
  assert.doesNotMatch(source, /includes\("organize_emotions"\)/u);
  assert.doesNotMatch(source, /optionalDetails\.shortLetter/u);
  for (const label of [
    "柔らかさ",
    "好意の強さ",
    "返信への圧力",
    "調整した点",
    "今の関係について",
    "これからの流れ",
    "今夜",
    "次の日",
    "3日目",
    "次に",
    "見直す条件",
  ]) {
    assert.ok(source.includes(label), label);
  }
  assert.equal(source.includes('next: "次の日"'), false);
  assert.equal(source.includes('next: "明日"'), false);
  assert.doesNotMatch(source, /\{baseProjection\.decisionCode\}/u);
  assert.doesNotMatch(source, />\s*\{item\.resultingDirection\}\s*</u);
});

await check("exact whitespace-normalized repetition suppression only", () => {
  const source = readText(notePath);
  assert.match(source, /function normalizedExactKey\(value: string\)/u);
  assert.match(source, /value\.replace\(\/\\s\+\/gu, " "\)\.trim\(\)/u);
  assert.match(source, /const visibleText = new Set<string>\(\)/u);
  assert.match(source, /seen\.has\(key\)/u);
  assert.doesNotMatch(
    source,
    /levenshtein|jaro|similarity|cosine|embedding|fuzzy|paraphrase|toLowerCase\(/iu,
  );
});

await check("one native collapsed non-empty secondary disclosure", () => {
  const source = readText(notePath);
  assert.equal((source.match(/<details\b/gu) ?? []).length, 1);
  assert.doesNotMatch(source, /<details[^>]*\bopen\b/u);
  assert.ok(source.includes("詳しい補足を見る"));
  assert.match(source, /hasSecondaryDetail\s*\?\s*\(/u);
  assert.ok(source.indexOf("<details") < source.indexOf("月の返事から最後に"));
  assert.ok(source.indexOf("<details") < source.indexOf("考えられる受け取られ方"));
  assert.ok(
    source.indexOf("const possibleInterpretations") <
      source.indexOf("const secondaryActions"),
  );
  assert.match(source, /projection\.possibleInterpretations/u);
  assert.match(source, /projection\.consultationLimitations/u);
});

await check("nine V2 fixtures decode and demonstrate required Product cases", async () => {
  const fixturesUrl = pathToFileURL(path.join(root, fixturesPath));
  fixturesUrl.searchParams.set("verify", `${Date.now()}`);
  const projectionUrl = pathToFileURL(path.join(root, experienceProjectionPath));
  projectionUrl.searchParams.set("verify", `${Date.now()}`);
  const fixtureModule = await import(fixturesUrl.href);
  const projectionModule = await import(projectionUrl.href);
  const fixtures = fixtureModule.customerAssessmentExperienceReviewFixtures;
  assert.equal(fixtures.length, 9);
  assert.deepEqual(
    sorted(fixtures.map((fixture) => fixture.id)),
    sorted(fixtureIds),
  );
  for (const fixture of fixtures) {
    projectionModule.decodeCustomerAssessmentExperienceProjectionV2(
      fixture.projection,
    );
    assert.ok(fixture.projection.openingLetter.length > 0, fixture.id);
    assert.ok(fixture.projection.closingLines.length > 0, fixture.id);
    const functionCount = visibleFunctionCount(fixture.projection);
    assert.ok(functionCount >= 6 && functionCount <= 9, `${fixture.id}:${functionCount}`);
  }

  const simple = selectFixture(fixtures, "simple_business_reply_with_draft");
  assert.notEqual(simple.baseProjection.finalDraft, null);
  assert.equal(simple.baseProjection.relationshipSummary, null);
  assert.equal(simple.baseProjection.messageTemperature, null);
  assert.equal(simple.baseProjection.optionalDetails.expandedPlan, undefined);
  assert.ok(simple.situationReading.length > 0);

  const waiting = selectFixture(fixtures, "ordinary_reply_waiting");
  assert.equal(waiting.baseProjection.decisionCode, "wait_and_reassess");
  assert.equal(waiting.baseProjection.finalDraft, null);
  assert.equal(waiting.baseProjection.requestedTopics.includes("draft_message"), false);
  assert.ok(waiting.materialUnknowns.length > 0);
  assert.ok(waiting.possibleInterpretations.length > 0);

  const thankYou = selectFixture(fixtures, "polite_thank_you_with_draft");
  assert.notEqual(thankYou.baseProjection.finalDraft, null);
  assert.notEqual(thankYou.draftContext, null);
  assert.notEqual(thankYou.baseProjection.messageTemperature, null);
  assert.equal(thankYou.baseProjection.relationshipSummary, null);

  const relationship = selectFixture(fixtures, "relationship_summary_requested");
  assert.notEqual(relationship.baseProjection.relationshipSummary, null);
  assert.equal(relationship.baseProjection.messageTemperature, null);

  const legacy = selectFixture(fixtures, "expanded_plan_requested_legacy");
  assert.deepEqual(
    legacy.baseProjection.optionalDetails.expandedPlan.map((item) => item.phase),
    ["tonight", "next_day", "day_three"],
  );

  const split = selectFixture(fixtures, "expanded_plan_requested_split");
  assert.deepEqual(
    split.baseProjection.optionalDetails.expandedPlan.map((item) => item.phase),
    ["tonight", "next", "reassessment_condition"],
  );

  const nullable = selectFixture(fixtures, "nullable_optional_sections");
  assert.equal(nullable.baseProjection.relationshipSummary, null);
  assert.equal(nullable.baseProjection.messageTemperature, null);
  assert.ok(visibleFunctionCount(nullable) >= 6);

  const pause = selectFixture(fixtures, "pause_additional_contact_no_draft");
  assert.equal(pause.baseProjection.decisionCode, "pause_additional_contact");
  assert.equal(pause.baseProjection.finalDraft, null);
  assert.ok(pause.baseProjection.requestedTopics.includes("draft_message"));
  assert.doesNotMatch(pause.closingLines.join("\n"), /また連絡|連絡して|送って/u);

  const kansai = selectFixture(fixtures, "kansai_persona_draft");
  assert.equal(
    kansai.baseProjection.finalDraft.text,
    "おっけー、土曜ならいけるで！\nまた時間おしえて〜😊",
  );
});

await check("review route consumes V2 fixtures and remains fixture-only guarded", () => {
  const source = readText(reviewPagePath);
  assert.match(
    source,
    /m2-p4-v12-customer-experience-projection-fixtures/u,
  );
  assert.doesNotMatch(source, /m2-p4-v12-customer-projection-fixtures/u);
  assert.match(source, /index:\s*false/u);
  assert.match(source, /follow:\s*false/u);
  assert.match(source, /process\.env\.NODE_ENV === "production"/u);
  assert.match(source, /process\.env\.M2_INTERNAL_RUNTIME_ENABLED !== "true"/u);
  assert.match(source, /notFound\(\)/u);
  assert.match(source, /query:\s*\{ fixture: fixture\.id \}/u);
  assert.match(
    source,
    /<CustomerAssessmentNote projection=\{selectedFixture\.projection\} \/>/u,
  );
  assert.equal((source.match(/process\.env\./gu) ?? []).length, 2);
});

await check("no Provider API DB Supabase Runtime payment or public connection", () => {
  const implementationSource = [notePath, reviewPagePath, fixturesPath]
    .map(readText)
    .join("\n");
  assert.doesNotMatch(
    implementationSource,
    /\bfetch\s*\(|\/api\/|openai|supabase|createClient\s*\(|RuntimeAssessmentForm|purchase|payment|axios|XMLHttpRequest|WebSocket/iu,
  );
});

await check("420 current answer and 24rem fixture link retain mobile shell", () => {
  const css = readText(noteCssPath);
  const baselineCss = normalizeNewlines(readGitText(baseline, noteCssPath));
  const previousMobileRule = `@media (max-width: 24rem) {
  .currentAnswer {
    grid-template-columns: minmax(0, 1fr);
  }

  .fixtureLink {`;
  const correctedMobileRules = `@media (max-width: 26.25rem) {
  .currentAnswer {
    grid-template-columns: minmax(0, 1fr);
  }
}

@media (max-width: 24rem) {
  .fixtureLink {`;
  const expectedCss = baselineCss.replace(previousMobileRule, correctedMobileRules);
  assert.notEqual(expectedCss, baselineCss);
  assert.equal(normalizeNewlines(css), expectedCss);
  assert.match(
    css,
    /@media \(max-width: 26\.25rem\) \{\s*\.currentAnswer \{\s*grid-template-columns: minmax\(0, 1fr\);\s*\}\s*\}/u,
  );
  assert.match(
    css,
    /@media \(max-width: 24rem\) \{\s*\.fixtureLink \{\s*inline-size: 100%;\s*\}\s*\}/u,
  );
  assert.match(css, /overflow-x:\s*clip/u);
  assert.match(css, /min-inline-size:\s*0/u);
  assert.match(css, /overflow-wrap:\s*anywhere/u);
  assert.match(css, /white-space:\s*pre-wrap/u);
  assert.match(css, /:focus-visible/u);
  assert.match(css, /prefers-reduced-motion:\s*reduce/u);
  assert.match(css, /var\(--night-900\)/u);
  assert.match(css, /var\(--paper-50\)/u);
  assert.match(css, /var\(--moon-600\)/u);
  assert.doesNotMatch(
    css,
    /(?:^|\s)(?:width|min-width|max-width|inline-size|min-inline-size|max-inline-size):\s*\d+(?:\.\d+)?px/gmu,
  );
  const remFontSizes = [...css.matchAll(/font-size:\s*(0?\.\d+)rem/gu)].map(
    (match) => Number(match[1]),
  );
  assert.ok(remFontSizes.every((size) => size >= 0.875));
});

await check("presentation contract and capabilities are exact and fail closed", () => {
  const contract = readJson(presentationContractPath);
  const capabilities = readJson(capabilitiesPath);
  const correctedStatus =
    "reassuring_customer_note_v2_corrected_pending_final_human_visual_product_review";
  const pendingVisualReview = [
    "mobile_320",
    "keyboard_only_navigation",
    "copy_success_announcement",
    "copy_failure_announcement",
    "zoom_200_percent",
    "reduced_motion_review",
    "actual_provider_output_product_review",
  ];
  assert.equal(contract.task_id, taskId);
  assert.equal(contract.correction_task_id, correctionTaskId);
  assert.equal(contract.status, correctedStatus);
  assert.equal(contract.baseline, baseline);
  assert.equal(contract.source_branch, expectedSourceBranch);
  assert.equal(contract.implementation_branch, expectedBranch);
  assert.deepEqual(contract.exact_scope, exactScope);
  assert.deepEqual(contract.scope_shape, { updated: 6, new: 0 });
  assert.deepEqual(contract.fixture_ids, fixtureIds);
  assert.equal(
    contract.authority.accepted_input,
    "CustomerAssessmentExperienceProjectionV2",
  );
  assert.equal(
    contract.authority.full_structured_report_enters_customer_component,
    false,
  );
  assert.deepEqual(Object.values(contract.operations), [0, 0, 0]);
  assert.equal(contract.review_route.production_behavior, "not_found");
  assert.equal(contract.exact_repetition_policy.fuzzy_matching, false);
  assert.deepEqual(contract.mobile_layout, {
    current_answer: {
      stack_at_or_below: "26.25rem",
      grid_template_columns: "minmax(0, 1fr)",
    },
    fixture_link: {
      full_width_at_or_below: "24rem",
      boundary_unchanged: true,
    },
  });
  assert.deepEqual(contract.sections.immediate_action, {
    kicker: "いま",
    heading: "今の動き方",
    renderer_labels_are_time_neutral: true,
    action_source: "projection.baseProjection.immediateAction.action",
    avoid_source: "projection.baseProjection.immediateAction.avoid",
    rationale_source: "projection.actionRationales",
    visible_rationale_limit: 1,
    remaining_rationales_location: "secondary_disclosure",
  });
  assert.equal(contract.visual_review.desktop, "pass");
  assert.equal(
    contract.visual_review.mobile_399,
    "pass_with_minor_current_answer_layout_correction_requested",
  );
  assert.deepEqual(contract.visual_review.observed, {
    horizontal_scroll: false,
    overlapping_content: false,
    japanese_wrapping_readable: true,
    draft_discoverable: true,
    information_density_accepted: true,
    reassuring_experience_direction_accepted: true,
    visual_jpy980_plausibility_established: true,
  });
  assert.deepEqual(contract.visual_review.pending, pendingVisualReview);
  assert.equal(contract.visual_review.human_visual_review_complete, false);
  assert.equal(contract.visual_review.chatgpt_visual_review_complete, false);
  assert.equal(
    contract.visual_review.product_owner_experience_review_complete,
    false,
  );
  assert.equal(contract.visual_review.jpy980_readiness_established, false);

  const expectedCapabilities = {
    correction_task_id: correctionTaskId,
    status: correctedStatus,
    baseline,
    product_doctrine_accepted: true,
    r2_a_accepted: true,
    r2_a_r1_accepted: true,
    r2_b_architecture_accepted: true,
    experience_projection_v2_consumed: true,
    accepted_visual_shell_retained: true,
    hero_dominance_reduced: true,
    baseline_reassuring_letter_visible: true,
    grounded_situation_reading_visible: true,
    uncertainty_separation_supported: true,
    prominent_draft_preserved: true,
    emotional_closing_visible: true,
    exact_repetition_control_only: true,
    provider_text_rewritten: false,
    customer_note_implementation_complete: true,
    desktop_visual_review_passed: true,
    mobile_399_visual_review_passed: true,
    time_neutral_action_heading: true,
    mobile_answer_stack_420: true,
    information_density_accepted: true,
    reassuring_experience_direction_accepted: true,
    human_visual_review_complete: false,
    chatgpt_visual_review_complete: false,
    product_owner_experience_review_complete: false,
    jpy980_readiness_established: false,
    provider_calls: 0,
    db_operations: 0,
    supabase_operations: 0,
    r2_c_authorized: false,
    existing_package_c_authorized: false,
    provider_rerun_authorized: false,
    active_runtime_activated: false,
    r4_authorized: false,
    c2_authorized: false,
    pull_request_created: false,
    main_merged: false,
    force_push_used: false,
    next_action: "final_320_keyboard_copy_zoom_and_product_review",
  };
  for (const [key, value] of Object.entries(expectedCapabilities)) {
    assert.deepEqual(capabilities[key], value, key);
  }
});

await check("git diff --check PASS", () => {
  git(["diff", "--check", baseline, "--"]);
  for (const candidate of exactScope) {
    assert.doesNotMatch(readText(candidate), /[\t ]+$/gmu, candidate);
  }
});

const failed = checks.filter((result) => !result.passed);
console.log("");
console.log(
  `Reassuring customer note verifier: ${
    failed.length === 0 ? "PASS" : "FAIL"
  } ${checks.length - failed.length}/${checks.length}`,
);
console.log(`Exact correction scope: ${exactScope.length}/6; updated 6; new 0`);
console.log(`Review fixtures: ${fixtureIds.length}/9`);
console.log(`R2-A/R1 verifier: ${r2aVerifierSummary}`);
console.log("Provider / DB / Supabase: 0 / 0 / 0");
if (failed.length > 0) process.exitCode = 1;
