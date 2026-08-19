import assert from "node:assert/strict";
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
const authorityParent = "1229627588e3c6ccd41ea7ea32751b8b8ac79c6e";
const r2AImplementation = "5070c02267f49e1e0095ce2e46fb106b886f7df5";
const expectedMain = "61e33a10e195fad17e253a6b9719217e1992f273";
const expectedBranch =
  "feat/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-r2-b-r2-authorized-reassuring-note";
const acceptanceBranch =
  "chore/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-r2-a-acceptance-r2-b-authorization";
const r2AImplementationBranch =
  "feat/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-r2-a-r1-authorized-experience-projection";
const historicalR2BBranches = [
  {
    branch:
      "feat/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-r2-b-reassuring-note",
    commit: "e509405935e82d7079023609b2d852d51f286f3e",
  },
  {
    branch:
      "fix/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-r2-b-r1-mobile-copy",
    commit: "1e6e719a8bdd766617405ec40691ff498f1bbc2a",
  },
];

const notePath = "components/runtime/CustomerAssessmentNote.tsx";
const noteCssPath = "components/runtime/CustomerAssessmentNote.module.css";
const copyButtonPath = "components/runtime/CustomerDraftCopyButton.tsx";
const reviewPagePath = "app/review/runtime/v12/page.tsx";
const fixturesPath =
  "lib/assessment/runtime/review/m2-p4-v12-customer-experience-projection-fixtures.ts";
const packageRoot =
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-r2-b";
const presentationContractPath = packageRoot + "/presentation-contract-v1.json";
const capabilitiesPath = packageRoot + "/capabilities-v1.json";
const verifierPath =
  "scripts/verify-m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-r2-b-reassuring-note.mjs";
const reviewDocumentPath =
  "docs/phase2/TASK_M2_P4_I3_R1_C1_R3_R2_E_R3_R3_R3_P3_R2_B_REVIEW.md";
const acceptanceVerifierPath =
  "scripts/verify-m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-r2-a-acceptance-r2-b-authorization.mjs";
const experienceProjectionPath =
  "lib/assessment/runtime/customer-assessment-experience-projection-v2.ts";
const projectionV1Path =
  "lib/assessment/runtime/customer-assessment-projection-v1.ts";
const decisionPolicyVerifierPath =
  "evals/quality/m2-p4-i1/verify-decision-policy.mjs";
const implementationPackagesPath =
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-r1/implementation-packages-v1.json";
const p1SourceContractPath =
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p1/source-contract-v1.json";

const updatedPaths = [
  notePath,
  noteCssPath,
  copyButtonPath,
  reviewPagePath,
];
const newPaths = [
  fixturesPath,
  presentationContractPath,
  capabilitiesPath,
  verifierPath,
  reviewDocumentPath,
];
const exactScope = [...updatedPaths, ...newPaths];

const protectedPaths = [
  experienceProjectionPath,
  projectionV1Path,
  "lib/assessment/runtime/customer-assessment-delivery-v1.ts",
  "lib/assessment/runtime/runtime-result-normalization-v1.ts",
  "lib/assessment/runtime/types.ts",
  "lib/assessment/runtime/schema-catalog.ts",
  "lib/assessment/runtime/service.ts",
  "lib/assessment/runtime/pipeline.ts",
  "lib/assessment/runtime/supabase-repository.ts",
  "components/runtime/RuntimeAssessmentForm.tsx",
  "components/runtime/RuntimeAssessmentNote.tsx",
  "app/api/internal/assessments/route.ts",
  decisionPolicyVerifierPath,
];

const expectedFixtures = [
  {
    id: "simple_business_reply_with_draft",
    category: "simple",
  },
  {
    id: "ordinary_reply_waiting",
    category: "emotional",
  },
  {
    id: "nullable_optional_sections",
    category: "null_optional",
  },
  {
    id: "polite_thank_you_with_draft",
    category: "polite_draft",
  },
  {
    id: "kansai_persona_draft",
    category: "persona_preserved",
  },
];

function git(args, options = {}) {
  return execFileSync(
    "git.exe",
    ["-c", "safe.directory=C:/projects/moon-reply", ...args],
    {
      cwd: root,
      encoding: "utf8",
      maxBuffer: 128 * 1024 * 1024,
      ...options,
    },
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

function sorted(values) {
  return [...values].sort((left, right) => left.localeCompare(right));
}

function assertParentBlobUnchanged(relativePath) {
  assert.equal(
    git(["hash-object", relativePath]),
    git(["rev-parse", authorityParent + ":" + relativePath]),
    relativePath,
  );
}

function primarySectionCount(projection) {
  const base = projection.baseProjection;
  return [
    projection.openingLetter.length > 0,
    Boolean(base.primaryReason) ||
      projection.situationReading.length > 0 ||
      projection.materialUnknowns.length > 0,
    base.finalDraft !== null,
    base.requestedTopics.includes("message_impact") &&
      base.messageTemperature !== null,
    base.requestedTopics.includes("relationship") &&
      base.relationshipSummary !== null,
    Boolean(base.immediateAction.action) ||
      base.immediateAction.avoid.length > 0 ||
      projection.actionRationales.length > 0 ||
      Boolean(base.reassessment.when) ||
      base.reassessment.conditions.length > 0,
    base.requestedTopics.includes("next_three_days") &&
      (base.optionalDetails.expandedPlan?.length ?? 0) > 0,
    projection.closingLines.length > 0,
  ].filter(Boolean).length;
}

let acceptanceVerifierSummary = "not_run";
let r2AVerifierSummary = "not_run";
let q0AcceptanceVerifierSummary = "not_run";
let r1DoctrineVerifierSummary = "not_run";
let packageBVerifierSummary = "not_run";
let packageAR1VerifierSummary = "not_run";
let decisionPolicyVerifierSummary = "not_run";

function runAcceptanceVerifierAtAuthority() {
  const temporaryRoot = mkdtempSync(
    path.join(tmpdir(), "moon-reply-r2-b-authority-"),
  );
  const cloneRoot = path.join(temporaryRoot, "repo");
  try {
    execFileSync(
      "git.exe",
      ["clone", "--quiet", "--shared", "--no-checkout", root, cloneRoot],
      { cwd: root, stdio: "pipe" },
    );
    const safeDirectory =
      "safe.directory=" + cloneRoot.replaceAll("\\", "/");
    execFileSync(
      "git.exe",
      ["-c", safeDirectory, "config", "core.autocrlf", "false"],
      { cwd: cloneRoot, stdio: "pipe" },
    );

    const refs = git([
      "for-each-ref",
      "--format=%(refname)%09%(objectname)",
      "refs/heads",
      "refs/remotes/origin",
    ])
      .split(/\r?\n/u)
      .filter(Boolean)
      .map((line) => line.split("\t"));
    for (const [refName, revision] of refs) {
      execFileSync(
        "git.exe",
        ["-c", safeDirectory, "update-ref", refName, revision],
        { cwd: cloneRoot, stdio: "pipe" },
      );
    }

    execFileSync(
      "git.exe",
      [
        "-c",
        safeDirectory,
        "checkout",
        "--quiet",
        "-B",
        acceptanceBranch,
        authorityParent,
      ],
      { cwd: cloneRoot, stdio: "pipe" },
    );
    for (const [refName, revision] of [
      ["refs/remotes/origin/" + r2AImplementationBranch, r2AImplementation],
      ["refs/heads/" + r2AImplementationBranch, r2AImplementation],
      ["refs/heads/main", expectedMain],
      ["refs/remotes/origin/main", expectedMain],
    ]) {
      execFileSync(
        "git.exe",
        ["-c", safeDirectory, "update-ref", refName, revision],
        { cwd: cloneRoot, stdio: "pipe" },
      );
    }

    const sourceContract = readJson(p1SourceContractPath);
    const markerName = path.basename(sourceContract.frozen_state.marker_path);
    const markerSource = path.join(root, ".git", markerName);
    assert.equal(existsSync(markerSource), true, markerName);
    copyFileSync(markerSource, path.join(cloneRoot, ".git", markerName));

    execFileSync(
      "git.exe",
      ["-c", safeDirectory, "config", "core.autocrlf", "true"],
      { cwd: cloneRoot, stdio: "pipe" },
    );
    const result = spawnSync(
      process.execPath,
      [path.join(cloneRoot, acceptanceVerifierPath)],
      {
        cwd: cloneRoot,
        encoding: "utf8",
        maxBuffer: 256 * 1024 * 1024,
        stdio: ["ignore", "pipe", "pipe"],
      },
    );
    if (result.status !== 0) {
      throw new Error(
        "Accepted authority verifier failed.\nstdout:\n" +
          (result.stdout ?? "") +
          "\nstderr:\n" +
          (result.stderr ?? ""),
      );
    }
    const output = result.stdout;
    assert.match(
      output,
      /R2-A acceptance \/ R2-B authorization verifier: PASS 14\/14/u,
    );
    assert.match(output, /R2-A dedicated verifier: PASS 35\/35/u);
    assert.match(output, /Q0-A acceptance verifier: PASS 12\/12/u);
    assert.match(output, /R1 Doctrine verifier: PASS 19\/19/u);
    assert.match(
      output,
      /Package B historical accepted verifier: PASS 20\/20 exact 10\/10/u,
    );
    assert.match(output, /Package A R1 accepted verifier: PASS 23\/23/u);
    assert.match(output, /Decision Policy verifier: PASS 40\/40/u);
    acceptanceVerifierSummary = "PASS 14/14";
    r2AVerifierSummary = "PASS 35/35";
    q0AcceptanceVerifierSummary = "PASS 12/12";
    r1DoctrineVerifierSummary = "PASS 19/19";
    packageBVerifierSummary = "PASS 20/20 exact 10/10";
    packageAR1VerifierSummary = "PASS 23/23";
    decisionPolicyVerifierSummary = "PASS 40/40";
  } finally {
    rmSync(temporaryRoot, { recursive: true, force: true });
  }
}

const checks = [];

async function check(name, assertion) {
  try {
    await assertion();
    checks.push({ name, passed: true });
    console.log("PASS " + name);
  } catch (error) {
    checks.push({ name, passed: false });
    console.error("FAIL " + name);
    console.error(error instanceof Error ? error.stack : error);
  }
}

await check("exact branch parent R2-A authority main stash and historical refs", () => {
  const head = git(["rev-parse", "HEAD"]);
  assert.equal(git(["branch", "--show-current"]), expectedBranch);
  assert.equal(git(["rev-parse", authorityParent]), authorityParent);
  assert.equal(git(["rev-parse", authorityParent + "^"]), r2AImplementation);
  assert.equal(git(["merge-base", head, authorityParent]), authorityParent);
  const commitsAfterAuthority = Number(
    git(["rev-list", "--count", authorityParent + ".." + head]),
  );
  assert.ok(
    commitsAfterAuthority === 0 || commitsAfterAuthority === 1,
    String(commitsAfterAuthority),
  );
  if (commitsAfterAuthority === 1) {
    assert.equal(git(["rev-parse", head + "^"]), authorityParent);
  }
  assert.equal(git(["rev-parse", acceptanceBranch]), authorityParent);
  assert.equal(git(["rev-parse", "origin/" + acceptanceBranch]), authorityParent);
  assert.equal(git(["rev-parse", r2AImplementationBranch]), r2AImplementation);
  assert.equal(
    git(["rev-parse", "origin/" + r2AImplementationBranch]),
    r2AImplementation,
  );
  assert.equal(git(["rev-parse", "main"]), expectedMain);
  assert.equal(git(["rev-parse", "origin/main"]), expectedMain);
  assert.equal(git(["stash", "list"]), "");
  for (const item of historicalR2BBranches) {
    assert.equal(git(["rev-parse", item.branch]), item.commit, item.branch);
    assert.equal(
      git(["rev-parse", "origin/" + item.branch]),
      item.commit,
      "origin/" + item.branch,
    );
  }
  const remoteTarget = "refs/remotes/origin/" + expectedBranch;
  if (gitObjectExists(remoteTarget)) {
    assert.equal(git(["rev-parse", remoteTarget]), head);
  }
});

await check("exact implementation scope is 9 paths with 4 UPDATE and 5 NEW", () => {
  const tracked = git([
    "diff",
    "--name-status",
    "--no-renames",
    authorityParent,
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
  assert.equal(exactScope.length, 9);
  assert.deepEqual(sorted(actual.map((item) => item.path)), sorted(exactScope));
  assert.deepEqual(
    sorted(actual.filter((item) => item.status === "M").map((item) => item.path)),
    sorted(updatedPaths),
  );
  assert.deepEqual(
    sorted(actual.filter((item) => item.status === "A").map((item) => item.path)),
    sorted(newPaths),
  );
  for (const candidate of updatedPaths) {
    assert.equal(gitObjectExists(authorityParent + ":" + candidate), true);
  }
  for (const candidate of newPaths) {
    assert.equal(gitObjectExists(authorityParent + ":" + candidate), false);
  }
});

await check("strict UTF-8 JSON diff hygiene and sensitive scan", () => {
  const secretPatterns = [
    /sk-[A-Za-z0-9_-]{20,}/gu,
    /(?:OPENAI_API_KEY|SUPABASE_SERVICE_ROLE_KEY)\s*[=:]\s*["'][^"']{8,}["']/gu,
    /eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/gu,
    /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/gu,
  ];
  let sensitiveValues = 0;
  for (const candidate of exactScope) {
    const source = readText(candidate);
    assert.equal(source.includes("\uFFFD"), false, candidate);
    assert.doesNotMatch(source, /[\t ]+$/gmu, candidate);
    assert.equal(
      source.replaceAll("\r\n", "\n").endsWith("\n\n"),
      false,
      candidate + ": blank line at EOF",
    );
    for (const pattern of secretPatterns) {
      sensitiveValues += [...source.matchAll(pattern)].length;
    }
  }
  assert.equal(sensitiveValues, 0);
  readJson(presentationContractPath);
  readJson(capabilitiesPath);
  git(["diff", "--check", authorityParent, "--"]);
});

await check("accepted authorization and all upstream accepted verifiers pass", () => {
  runAcceptanceVerifierAtAuthority();
});

await check("accepted V2 V1 Full Report and Runtime blobs remain unchanged", () => {
  protectedPaths.forEach(assertParentBlobUnchanged);
  assert.match(
    readText("lib/assessment/runtime/schema-catalog.ts"),
    /runtime-stage-catalog-v4\.0\.0/u,
  );
  assert.match(
    readText("lib/assessment/runtime/service.ts"),
    /loadM2P4ProductQualityRuntimeStageCatalog/u,
  );
});

await check("CustomerAssessmentNote consumes accepted V2 only", () => {
  const source = readText(notePath);
  assert.match(
    source,
    /projection:\s*CustomerAssessmentExperienceProjectionV2/u,
  );
  assert.match(source, /const baseProjection = projection\.baseProjection/u);
  assert.doesNotMatch(
    source,
    /CustomerAssessmentProjectionV1|RuntimeReport|SplitRuntimeReportV1|AssessmentExecutionResult|Provider output|Stage output/iu,
  );
  assert.doesNotMatch(
    source,
    /sourceReportSchemaVersion|projectionSchemaVersion|\bcaseId\b|\bfixtureId\b|E-R3-[0-9]+/u,
  );
  assert.doesNotMatch(source, /\.policy\b|\.useTiming\b/u);
  assert.doesNotMatch(source, /nullDraftMessages|draftAbsence|case\s*===|fixture\s*===/u);
});

await check("cover hierarchy lowers decision dominance and preserves shell", () => {
  const source = readText(notePath);
  const css = readText(noteCssPath);
  assert.ok(source.includes("恋のメッセージ鑑定ノート"));
  assert.match(
    source,
    /<h1 id="customer-assessment-title">\{projection\.openingLine\}<\/h1>/u,
  );
  assert.ok(source.includes("今の答え"));
  assert.match(source, /decisionLabels\[baseProjection\.decisionCode\]/u);
  assert.doesNotMatch(source, /<h1[^>]*>\s*\{decisionLabels/u);
  assert.match(css, /font-size:\s*clamp\(1\.8rem,\s*6vw,\s*3rem\)/u);
  for (const token of ["--night-900", "--paper-50", "--moon-600"]) {
    assert.ok(css.includes(token), token);
  }
});

await check("source-backed journey is semantically selected without filler", () => {
  const source = readText(notePath);
  for (const heading of [
    "月の返事からの短い手紙",
    "今の状況を読み解く",
    "確かに言えること",
    "まだ分からないこと",
    "送信文案",
    "この文面がどう届くか",
    "今の動き方",
    "見直す条件",
    "月の返事から最後に",
  ]) {
    assert.ok(source.includes(heading), heading);
  }
  for (const sourceExpression of [
    "projection.openingLine",
    "projection.openingLetter",
    "projection.situationReading",
    "projection.materialUnknowns",
    "projection.possibleInterpretations",
    "projection.draftContext",
    "projection.actionRationales",
    "projection.closingLines",
    "projection.consultationLimitations",
  ]) {
    assert.ok(source.includes(sourceExpression), sourceExpression);
  }
  assert.doesNotMatch(source, /今は文面を作らない|送信文案は表示していません/u);
  assert.ok(
    source.indexOf("月の返事からの短い手紙") <
      source.indexOf("今の状況を読み解く"),
  );
  assert.ok(
    source.indexOf("今の状況を読み解く") < source.indexOf("送信文案"),
  );
  assert.ok(source.indexOf("送信文案") < source.indexOf("今の動き方"));
  assert.ok(
    source.lastIndexOf("月の返事から最後に") <
      source.indexOf("<footer className={styles.fixedLimitation}>"),
  );
});

await check("exact-only repetition control has no semantic rewrite", () => {
  const source = readText(notePath);
  assert.match(source, /function normalizedExactKey\(value: string\)/u);
  assert.match(source, /value\.replace\(\/\\s\+\/gu, " "\)\.trim\(\)/u);
  assert.match(source, /const visibleText = new Set<string>/u);
  assert.match(source, /seen\.has\(key\)/u);
  assert.doesNotMatch(
    source,
    /levenshtein|jaro|similarity|cosine|embedding|fuzzy|paraphrase|toLowerCase\(/iu,
  );
  assert.equal((source.match(/\.replace\(/gu) ?? []).length, 1);
});

await check("draft remains prominent exact copyable and persona preserving", () => {
  const source = readText(notePath);
  const button = readText(copyButtonPath);
  assert.match(
    source,
    /const draftText = baseProjection\.finalDraft\?\.text \?\? null/u,
  );
  assert.match(
    source,
    /<p className=\{styles\.draftText\}>\{draftText\}<\/p>/u,
  );
  assert.match(
    source,
    /<CustomerDraftCopyButton key=\{draftText\} text=\{draftText\} \/>/u,
  );
  assert.match(button, /navigator\.clipboard\.writeText\(text\)/u);
  assert.doesNotMatch(button, /text\.(?:replace|trim|split|toLowerCase|toUpperCase)\(/u);
  assert.match(button, /<button[\s\S]*type="button"/u);
  assert.match(button, /useId\(\)/u);
  assert.match(button, /role="status"/u);
  assert.match(button, /aria-live="polite"/u);
  assert.match(button, /aria-atomic="true"/u);
  assert.ok(button.includes("コピーしました"));
  assert.ok(button.includes("コピーできませんでした。文面を選択してコピーしてください。"));
});

await check("requested modules details and uncertainty remain bounded", () => {
  const source = readText(notePath);
  assert.match(source, /includes\("message_impact"\)/u);
  assert.match(source, /includes\("relationship"\)/u);
  assert.match(source, /includes\("next_three_days"\)/u);
  assert.doesNotMatch(source, /includes\("organize_emotions"\)/u);
  assert.equal((source.match(/<details\b/gu) ?? []).length, 1);
  assert.doesNotMatch(source, /<details[^>]*\bopen\b/u);
  assert.match(source, /hasSecondaryDetail\s*\?\s*\(/u);
  assert.ok(source.includes("可能性として見ていること"));
  assert.ok(source.includes("この鑑定で確認できないこと"));
  assert.doesNotMatch(source, /相手はきっと|必ず|絶対|保証します/u);
  assert.doesNotMatch(
    source,
    />\s*\{(?:baseProjection\.)?decisionCode\}\s*</u,
  );
  assert.doesNotMatch(source, />\s*\{item\.resultingDirection\}\s*</u);
});

await check("fixed section count and padding logic are absent", () => {
  const source = readText(notePath);
  const contract = readJson(presentationContractPath);
  assert.doesNotMatch(
    source,
    /sectionCount|visibleFunctionCount|minimumSections|maximumSections|>=\s*6|<=\s*9|slice\(0,\s*[69]\)/u,
  );
  assert.equal(contract.section_rules.six_to_nine, "guidance_only");
  assert.equal(contract.section_rules.fixed_minimum, false);
  assert.equal(contract.section_rules.fixed_maximum, false);
  assert.equal(contract.section_rules.padding, "prohibited");
  assert.equal(contract.section_rules.simple_fixture_below_six_allowed, true);
});

await check("five review categories decode as accepted V2 inputs", async () => {
  const fixturesUrl = pathToFileURL(path.join(root, fixturesPath));
  fixturesUrl.searchParams.set("verify", String(Date.now()));
  const projectionUrl = pathToFileURL(path.join(root, experienceProjectionPath));
  projectionUrl.searchParams.set("verify", String(Date.now()));
  const fixtureModule = await import(fixturesUrl.href);
  const projectionModule = await import(projectionUrl.href);
  const fixtures = fixtureModule.customerAssessmentExperienceReviewFixtures;
  assert.equal(fixtures.length, 5);
  assert.deepEqual(
    fixtures.map((fixture) => ({
      id: fixture.id,
      category: fixture.category,
    })),
    expectedFixtures,
  );
  for (const fixture of fixtures) {
    projectionModule.decodeCustomerAssessmentExperienceProjectionV2(
      fixture.projection,
    );
    assert.ok(fixture.projection.openingLetter.length > 0, fixture.id);
    assert.ok(fixture.projection.closingLines.length > 0, fixture.id);
  }

  const simple = fixtures.find((fixture) => fixture.category === "simple");
  assert.ok(simple);
  assert.equal(primarySectionCount(simple.projection), 5);
  assert.ok(primarySectionCount(simple.projection) < 6);
  assert.notEqual(simple.projection.baseProjection.finalDraft, null);
  assert.equal(simple.projection.baseProjection.relationshipSummary, null);
  assert.equal(simple.projection.baseProjection.messageTemperature, null);
  assert.equal(
    simple.projection.baseProjection.optionalDetails.expandedPlan,
    undefined,
  );

  const emotional = fixtures.find(
    (fixture) => fixture.category === "emotional",
  );
  assert.ok(emotional);
  assert.equal(emotional.projection.baseProjection.finalDraft, null);
  assert.ok(emotional.projection.materialUnknowns.length > 0);
  assert.ok(emotional.projection.possibleInterpretations.length > 0);

  const nullable = fixtures.find(
    (fixture) => fixture.category === "null_optional",
  );
  assert.ok(nullable);
  assert.equal(nullable.projection.baseProjection.relationshipSummary, null);
  assert.equal(nullable.projection.baseProjection.messageTemperature, null);

  const polite = fixtures.find(
    (fixture) => fixture.category === "polite_draft",
  );
  assert.ok(polite);
  assert.notEqual(polite.projection.baseProjection.finalDraft, null);
  assert.notEqual(polite.projection.draftContext, null);
  assert.notEqual(polite.projection.baseProjection.messageTemperature, null);

  const persona = fixtures.find(
    (fixture) => fixture.category === "persona_preserved",
  );
  assert.ok(persona);
  assert.equal(
    persona.projection.baseProjection.finalDraft.text,
    "おっけー、土曜ならいけるで！\nまた時間おしえて〜😊",
  );
});

await check("review route is V2 fixture-only guarded and isolated", () => {
  const source = readText(reviewPagePath);
  assert.match(
    source,
    /m2-p4-v12-customer-experience-projection-fixtures/u,
  );
  assert.doesNotMatch(source, /m2-p4-v12-customer-projection-fixtures/u);
  assert.match(source, /index:\s*false/u);
  assert.match(source, /follow:\s*false/u);
  assert.match(source, /process\.env\.NODE_ENV === "production"/u);
  assert.match(
    source,
    /process\.env\.M2_INTERNAL_RUNTIME_ENABLED !== "true"/u,
  );
  assert.match(source, /notFound\(\)/u);
  assert.match(source, /query:\s*\{ fixture: fixture\.id \}/u);
  assert.match(
    source,
    /<CustomerAssessmentNote projection=\{selectedFixture\.projection\} \/>/u,
  );
  assert.ok(source.includes("ここでは合否を判定しません"));
  assert.equal((source.match(/process\.env\./gu) ?? []).length, 2);
});

await check("Provider API DB Supabase Payment and runtime connections remain zero", () => {
  const source = [notePath, copyButtonPath, reviewPagePath, fixturesPath]
    .map(readText)
    .join("\n");
  assert.doesNotMatch(
    source,
    /\bfetch\s*\(|\/api\/|openai|supabase|createClient\s*\(|RuntimeAssessmentForm|purchase|payment|axios|XMLHttpRequest|WebSocket/iu,
  );
  const contract = readJson(presentationContractPath);
  assert.equal(contract.source_integrity.provider_calls, 0);
  assert.equal(contract.source_integrity.paraphrases, 0);
  assert.equal(contract.source_integrity.factual_rewrites, 0);
  assert.equal(contract.source_integrity.generated_assessment_filler, 0);
  assert.deepEqual(contract.operations, {
    provider_calls: 0,
    db_operations: 0,
    supabase_operations: 0,
    runtime_activation: false,
    production_runtime_changes: false,
    payment_changes: false,
  });
});

await check("responsive accessibility review preparation is present", () => {
  const css = readText(noteCssPath);
  assert.match(css, /overflow-x:\s*clip/u);
  assert.match(css, /min-inline-size:\s*0/u);
  assert.match(css, /overflow-wrap:\s*anywhere/u);
  assert.match(css, /white-space:\s*pre-wrap/u);
  assert.match(css, /:focus-visible/u);
  assert.match(css, /prefers-reduced-motion:\s*reduce/u);
  assert.match(
    css,
    /@media \(max-width: 26\.25rem\) \{\s*\.currentAnswer \{\s*grid-template-columns: minmax\(0, 1fr\);\s*\}\s*\}/u,
  );
  assert.match(
    css,
    /@media \(max-width: 24rem\) \{[\s\S]*\.fixtureLink,[\s\S]*\.copyButton \{\s*inline-size: 100%;/u,
  );
  assert.match(css, /\.copyStatus \{[\s\S]*min-block-size:\s*1\.65em/u);
  assert.doesNotMatch(
    css,
    /(?:width|min-width|max-width|inline-size|min-inline-size|max-inline-size):\s*\d+(?:\.\d+)?px/gmu,
  );
  const remFontSizes = [...css.matchAll(/font-size:\s*(0?\.\d+)rem/gu)].map(
    (match) => Number(match[1]),
  );
  assert.ok(remFontSizes.every((size) => size >= 0.875));
});

await check("presentation contract records exact current authority", () => {
  const contract = readJson(presentationContractPath);
  assert.equal(contract.task_id, taskId);
  assert.equal(
    contract.status,
    "r2_b_implemented_pending_human_chatgpt_visual_product_review",
  );
  assert.equal(contract.authority.exact_parent, authorityParent);
  assert.equal(contract.authority.r2_a_implementation, r2AImplementation);
  assert.equal(
    contract.authority.r2_a_acceptance_r2_b_authorization,
    authorityParent,
  );
  assert.equal(contract.authority.main, expectedMain);
  assert.equal(contract.authority.implementation_branch, expectedBranch);
  assert.equal(
    contract.authority.accepted_input,
    "CustomerAssessmentExperienceProjectionV2",
  );
  assert.equal(
    contract.authority.case_or_fixture_specific_component_logic,
    false,
  );
  assert.equal(contract.historical_reference.mode, "read_only");
  assert.equal(contract.historical_reference.treated_as_current_authority, false);
  assert.equal(contract.historical_reference.mutated, false);
  assert.deepEqual(contract.exact_scope, exactScope);
  assert.deepEqual(contract.scope_shape, { updated: 4, new: 5 });
  assert.equal(contract.review_route.fixture_count, 5);
  assert.deepEqual(
    contract.review_route.categories,
    expectedFixtures.map((fixture) => fixture.category),
  );
  assert.equal(contract.review_authority.r2_c_authorized, false);
  assert.equal(contract.review_authority.r2_c_executed, false);
  assert.equal(contract.review_authority.experienceProductJudgment, "pending");
  assert.equal(contract.review_authority.jpy980_readiness_established, false);
  assert.equal(contract.review_authority.globalQ0Completion, false);
  for (const state of Object.values(
    contract.responsive_accessibility_preparation,
  )) {
    assert.equal(state, "prepared_not_reviewed");
  }
});

await check("capabilities fail closed for R2-C JPY980 experience and Global Q0", () => {
  const capabilities = readJson(capabilitiesPath);
  assert.equal(capabilities.task_id, taskId);
  assert.equal(capabilities.exact_parent, authorityParent);
  assert.equal(capabilities.experience_projection_v2_consumed, true);
  assert.equal(capabilities.experience_projection_v2_changed, false);
  assert.equal(capabilities.customer_assessment_projection_v1_changed, false);
  assert.equal(capabilities.full_report_or_runtime_changed, false);
  assert.equal(capabilities.provider_calls, 0);
  assert.equal(capabilities.case_id_product_branching, false);
  assert.equal(capabilities.internal_identifiers_rendered, false);
  assert.equal(capabilities.section_padding_used, false);
  assert.equal(capabilities.simple_case_below_six_supported, true);
  for (const key of [
    "desktop_1440_review_complete",
    "mobile_399_review_complete",
    "mobile_320_review_complete",
    "keyboard_review_complete",
    "zoom_200_review_complete",
    "reduced_motion_review_complete",
    "copy_success_review_complete",
    "copy_failure_review_complete",
    "details_review_complete",
    "human_visual_review_complete",
    "chatgpt_visual_review_complete",
    "product_owner_experience_review_complete",
    "r2_c_authorized",
    "r2_c_executed",
    "jpy980_readiness_established",
    "globalQ0Completion",
    "active_runtime_activated",
    "production_runtime_established",
    "main_changed",
  ]) {
    assert.equal(capabilities[key], false, key);
  }
  assert.equal(capabilities.experienceProductJudgment, "pending");
});

await check("global authority remains false and main remains unchanged", () => {
  const plan = readJson(implementationPackagesPath);
  const boundary = plan.global_acceptance_boundary;
  assert.equal(boundary.globalQ0Completion, false);
  assert.equal(boundary.providerQualityEstablished, false);
  assert.equal(boundary.provider_rerun_authorized, false);
  assert.equal(boundary.active_runtime_activation_authorized, false);
  assert.equal(boundary.production_runtime_established, false);
  assert.equal(boundary.production_runtime_authorized, false);
  assert.equal(boundary.payment_implementation_authorized, false);
  assert.equal(boundary.main_integration_authorized, false);
  assert.equal(git(["rev-parse", "main"]), expectedMain);
  assert.equal(git(["rev-parse", "origin/main"]), expectedMain);
});

await check("review document preserves implementation versus review boundary", () => {
  const source = readText(reviewDocumentPath);
  for (const value of [
    authorityParent,
    r2AImplementation,
    expectedMain,
    expectedBranch,
    "R2-C: unauthorized / not executed",
    "experienceProductJudgment: pending",
    "JPY980 readiness: false",
    "globalQ0Completion: false",
    "Provider / DB / Supabase: 0 / 0 / 0",
    "4 UPDATE + 5 NEW",
  ]) {
    assert.ok(source.includes(value), value);
  }
  assert.ok(source.includes("historicalから再利用したdesign / functional concepts"));
  assert.ok(source.includes("current authorityに合わせて変更した点"));
  assert.ok(source.includes("historical defectを修正した点"));
  assert.doesNotMatch(source, /R2-C[^\n]*PASS|Human Visual Review[^\n]*PASS/iu);
});

await check("git diff check remains PASS", () => {
  git(["diff", "--check", authorityParent, "--"]);
  for (const candidate of exactScope) {
    assert.doesNotMatch(readText(candidate), /[\t ]+$/gmu, candidate);
  }
});

const failed = checks.filter((result) => !result.passed);
console.log("");
console.log(
  "Authorized reassuring customer note verifier: " +
    (failed.length === 0 ? "PASS" : "FAIL") +
    " " +
    (checks.length - failed.length) +
    "/" +
    checks.length,
);
console.log("Exact R2-B scope: 9/9; updated 4; new 5");
console.log("Review fixtures: 5/5 categories");
console.log(
  "R2-A acceptance / R2-B authorization verifier: " +
    acceptanceVerifierSummary,
);
console.log("R2-A dedicated verifier: " + r2AVerifierSummary);
console.log("Q0-A acceptance verifier: " + q0AcceptanceVerifierSummary);
console.log("R1 Doctrine verifier: " + r1DoctrineVerifierSummary);
console.log("Package B historical accepted verifier: " + packageBVerifierSummary);
console.log("Package A R1 accepted verifier: " + packageAR1VerifierSummary);
console.log("Decision Policy verifier: " + decisionPolicyVerifierSummary);
console.log("Provider / DB / Supabase: 0 / 0 / 0");
console.log("R2-C authorized/executed: false / false");
console.log("JPY980 readiness / Global Q0: false / false");
console.log("Sensitive values: 0");
if (failed.length > 0) {
  console.error(
    "Failed checks: " + failed.map((item) => item.name).join("; "),
  );
  process.exitCode = 1;
}
