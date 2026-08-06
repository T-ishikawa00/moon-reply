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
const baseline = "8700ded1454058f72d33f2eb4d1ae6a05b6e008c";
const baselineParent = "db47145cd8ed04e9516861c20cdafbd198205cc5";
const expectedMain = "61e33a10e195fad17e253a6b9719217e1992f273";
const expectedBranch =
  "feat/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-customer-note";
const acceptedSourceBranch =
  "fix/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p2-r1-schema-parity";

const notePath = "components/runtime/CustomerAssessmentNote.tsx";
const noteCssPath = "components/runtime/CustomerAssessmentNote.module.css";
const copyButtonPath = "components/runtime/CustomerDraftCopyButton.tsx";
const reviewPagePath = "app/review/runtime/v12/page.tsx";
const fixturesPath =
  "lib/assessment/runtime/review/m2-p4-v12-customer-projection-fixtures.ts";
const packageRoot =
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3";
const presentationContractPath = `${packageRoot}/presentation-contract-v1.json`;
const visualReviewPath = `${packageRoot}/visual-review-cases-v1.json`;
const capabilitiesPath = `${packageRoot}/capabilities-v1.json`;
const verifierPath =
  "scripts/verify-m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-customer-note.mjs";
const reviewDocumentPath =
  "docs/phase2/TASK_M2_P4_I3_R1_C1_R3_R2_E_R3_R3_R3_P3_REVIEW.md";
const r1VerifierPath =
  "scripts/verify-m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p2-runtime-projection.mjs";

const exactScope = [
  notePath,
  noteCssPath,
  copyButtonPath,
  reviewPagePath,
  fixturesPath,
  presentationContractPath,
  visualReviewPath,
  capabilitiesPath,
  verifierPath,
  reviewDocumentPath,
];

const packageAScope = [
  "lib/assessment/runtime/types.ts",
  "lib/assessment/runtime/supabase-repository.ts",
  "app/api/internal/assessments/route.ts",
  "components/runtime/RuntimeAssessmentForm.tsx",
  "lib/assessment/runtime/runtime-result-normalization-v1.ts",
  "lib/assessment/runtime/customer-assessment-projection-v1.ts",
  "lib/assessment/runtime/customer-assessment-delivery-v1.ts",
  "components/runtime/RuntimeAssessmentProjectionPreview.tsx",
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p2/projection-contract-v1.json",
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p2/projection-fixtures-v1.json",
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p2/offline-results-v1.json",
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p2/capabilities-v1.json",
  r1VerifierPath,
  "docs/phase2/TASK_M2_P4_I3_R1_C1_R3_R2_E_R3_R3_R3_P2_REVIEW.md",
];

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

const requiredVisualChecks = [
  "keyboard_only_navigation",
  "visible_focus_on_copy_button",
  "copy_success_announcement",
  "copy_failure_announcement",
  "details_open_close",
  "browser_zoom_200_percent",
  "reduced_motion_preference",
  "long_japanese_wrapping",
  "emoji_and_line_break_preservation",
  "no_horizontal_scroll",
  "no_overlapping_content",
  "draft_discoverable_without_searching",
];

function git(args, options = {}) {
  return execFileSync(
    "git.exe",
    ["-c", "safe.directory=C:/projects/moon-reply", ...args],
    { cwd: root, encoding: "utf8", ...options },
  ).trim();
}

function gitObjectExists(revisionPath) {
  const result = spawnSync(
    "git.exe",
    [
      "-c",
      "safe.directory=C:/projects/moon-reply",
      "cat-file",
      "-e",
      revisionPath,
    ],
    { cwd: root, stdio: "ignore" },
  );
  return result.status === 0;
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

function selectFixture(fixtures, id) {
  const fixture = fixtures.find((candidate) => candidate.id === id);
  assert.ok(fixture, id);
  return fixture.projection;
}

let r1VerifierSummary = "not_run";

function runR1VerifierInAcceptedSourceClone() {
  const temporaryRoot = mkdtempSync(
    path.join(tmpdir(), "moon-reply-package-a-r1-"),
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
      ["-c", isolatedSafeDirectory, "config", "core.autocrlf", "true"],
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
        `refs/remotes/origin/${acceptedSourceBranch}`,
      ],
      { cwd: cloneRoot, stdio: "pipe" },
    );
    execFileSync(
      "git.exe",
      ["-c", isolatedSafeDirectory, "branch", "-f", "main", expectedMain],
      { cwd: cloneRoot, stdio: "pipe" },
    );

    const trackedPaths = git(["ls-tree", "-r", "--name-only", baseline])
      .split(/\r?\n/u)
      .filter(Boolean);
    for (const candidate of trackedPaths) {
      copyFileSync(path.join(root, candidate), path.join(cloneRoot, candidate));
    }
    execFileSync(
      "git.exe",
      ["-c", isolatedSafeDirectory, "status", "--porcelain=v1"],
      { cwd: cloneRoot, stdio: "pipe" },
    );

    const p1Contract = readJson(
      "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p1/source-contract-v1.json",
    );
    const markerName = path.basename(p1Contract.frozen_state.marker_path);
    const markerSource = path.join(root, ".git", markerName);
    const markerTarget = path.join(cloneRoot, ".git", markerName);
    assert.equal(existsSync(markerSource), true);
    copyFileSync(markerSource, markerTarget);

    const output = execFileSync(
      process.execPath,
      [path.join(cloneRoot, r1VerifierPath)],
      {
        cwd: cloneRoot,
        encoding: "utf8",
        maxBuffer: 16 * 1024 * 1024,
        stdio: ["ignore", "pipe", "ignore"],
      },
    );
    assert.match(output, /Runtime projection verifier: PASS 23\/23/u);
    r1VerifierSummary = "PASS 23/23";
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

await check("exact baseline branch parent and main authority", () => {
  const head = git(["rev-parse", "HEAD"]);
  assert.equal(git(["branch", "--show-current"]), expectedBranch);
  assert.equal(git(["rev-parse", `${baseline}^`]), baselineParent);
  assert.equal(git(["merge-base", head, baseline]), baseline);
  if (head !== baseline) {
    assert.equal(git(["rev-parse", `${head}^`]), baseline);
  }
  assert.equal(git(["rev-parse", "main"]), expectedMain);
  assert.equal(git(["rev-parse", "origin/main"]), expectedMain);
});

await check("exact new scope 10/10", () => {
  const trackedDiff = git(["diff", "--name-only", baseline, "--"])
    .split(/\r?\n/u)
    .filter(Boolean)
    .map((candidate) => candidate.replaceAll("\\", "/"));
  const untracked = git(["ls-files", "--others", "--exclude-standard"])
    .split(/\r?\n/u)
    .filter(Boolean)
    .map((candidate) => candidate.replaceAll("\\", "/"));
  assert.equal(exactScope.length, 10);
  assert.deepEqual(sorted(new Set([...trackedDiff, ...untracked])), sorted(exactScope));
  for (const candidate of exactScope) {
    assert.equal(existsSync(path.join(root, candidate)), true, candidate);
    assert.equal(gitObjectExists(`${baseline}:${candidate}`), false, candidate);
  }
});

await check("strict UTF-8 JSON validity U+FFFD zero and secret zero", () => {
  const secretPatterns = [
    /sk-[A-Za-z0-9_-]{20,}/gu,
    /(?:OPENAI_API_KEY|SUPABASE_SERVICE_ROLE_KEY)\s*[=:]\s*["'][^"']{8,}["']/gu,
    /eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/gu,
  ];
  let replacementCount = 0;
  let secretCount = 0;
  for (const candidate of exactScope) {
    const text = readText(candidate);
    replacementCount += [...text].filter(
      (character) => character.codePointAt(0) === 0xfffd,
    ).length;
    for (const pattern of secretPatterns) {
      secretCount += [...text.matchAll(pattern)].length;
    }
    assert.doesNotMatch(text, /[\t ]+$/gmu, candidate);
  }
  [presentationContractPath, visualReviewPath, capabilitiesPath].forEach(readJson);
  assert.equal(replacementCount, 0);
  assert.equal(secretCount, 0);
});

await check("Package A and R1 exact scopes unchanged", () => {
  assert.equal(packageAScope.length, 14);
  for (const candidate of packageAScope) {
    assert.equal(
      git(["hash-object", candidate]),
      git(["rev-parse", `${baseline}:${candidate}`]),
      candidate,
    );
  }
});

await check("Package A R1 verifier remains PASS 23/23", () => {
  runR1VerifierInAcceptedSourceClone();
});

await check("CustomerAssessmentNote accepts Projection only", () => {
  const source = readText(notePath);
  assert.match(
    source,
    /projection:\s*CustomerAssessmentProjectionV1/u,
  );
  assert.doesNotMatch(
    source,
    /RuntimeReport|SplitRuntimeReportV1|AssessmentExecutionResult|diagnostic-results|Stage output|Provider output|Candidate analysis|Product evaluator/iu,
  );
  assert.doesNotMatch(source, /sourceReportSchemaVersion|projectionSchemaVersion/u);
  assert.doesNotMatch(source, /\b(?:caseId|fixtureId)\b|E-R3-[0-9]+/u);
  assert.doesNotMatch(source, /\.policy\b|\.useTiming\b/u);
});

await check("no Provider API DB Supabase Runtime or payment connection", () => {
  const implementationSource = [
    notePath,
    copyButtonPath,
    reviewPagePath,
    fixturesPath,
  ]
    .map(readText)
    .join("\n");
  assert.doesNotMatch(
    implementationSource,
    /\bfetch\s*\(|\/api\/|openai|supabase|createClient\s*\(|RuntimeAssessmentForm|purchase|payment/iu,
  );
  assert.doesNotMatch(implementationSource, /axios|XMLHttpRequest|WebSocket/iu);
});

await check("renderer-owned decision and phase labels", () => {
  const source = readText(notePath);
  for (const label of [
    "今、返信する",
    "今、送る",
    "今夜は送らず、次の材料を待つ",
    "追加の連絡を止める",
    "今夜",
    "次の日",
    "3日目",
    "次に",
    "見直す条件",
  ]) {
    assert.ok(source.includes(label), label);
  }
  assert.doesNotMatch(source, /\{projection\.decisionCode\}/u);
  assert.doesNotMatch(source, />\s*\{item\.resultingDirection\}\s*</u);
  assert.match(source, /decisionLabels\[projection\.decisionCode\]/u);
  assert.match(source, /decisionLabels\[item\.resultingDirection\]/u);
  assert.match(source, /phaseLabels\[item\.phase\]/u);
});

await check("prominent exact draft copy behavior", () => {
  const noteSource = readText(notePath);
  const buttonSource = readText(copyButtonPath);
  assert.match(
    noteSource,
    /<CustomerDraftCopyButton\s+key=\{projection\.finalDraft\.text\}\s+text=\{projection\.finalDraft\.text\}\s*\/>/u,
  );
  assert.ok(
    noteSource.indexOf("<CustomerDraftCopyButton") < noteSource.indexOf("<details"),
  );
  assert.match(noteSource, /projection\.finalDraft\s*\?\s*\(/u);
  assert.match(buttonSource, /navigator\.clipboard\.writeText\(text\)/u);
  assert.match(buttonSource, /type="button"/u);
  assert.match(buttonSource, /aria-live="polite"/u);
  assert.ok(buttonSource.includes("コピーしました"));
  assert.ok(
    buttonSource.includes(
      "コピーできませんでした。文面を選択してコピーしてください。",
    ),
  );
  assert.doesNotMatch(buttonSource, /fetch|analytics|XMLHttpRequest|WebSocket/iu);
});

await check("null draft behavior is decision-bounded", () => {
  const source = readText(notePath);
  assert.match(
    source,
    /projection\.finalDraft === null && requestedTopics\.includes\("draft_message"\)/u,
  );
  assert.ok(source.includes("今は送らず、次の判断材料を待つため、"));
  assert.ok(source.includes("追加の連絡を止める判断のため、"));
  assert.equal(source.includes("reply_now: \"送信文案"), false);
  assert.equal(source.includes("send_now: \"送信文案"), false);
});

await check("requested-topic modules are proportional", () => {
  const source = readText(notePath);
  for (const [topic, heading] of [
    ["organize_emotions", "気持ちを整理するために"],
    ["message_impact", "この文面の印象"],
    ["relationship", "今の関係について"],
    ["next_three_days", "これからの流れ"],
  ]) {
    assert.match(source, new RegExp(`includes\\(\"${topic}\"\\)`, "u"));
    assert.ok(source.includes(heading), heading);
  }
  for (const label of ["柔らかさ", "好意の強さ", "返信への圧力", "調整した点"]) {
    assert.ok(source.includes(label), label);
  }
  assert.equal((source.match(/includes\("decide_send_or_wait"\)/gu) ?? []).length, 0);
});

await check("one semantic collapsed secondary disclosure", () => {
  const source = readText(notePath);
  assert.equal((source.match(/<details\b/gu) ?? []).length, 1);
  assert.doesNotMatch(source, /<details[^>]*\bopen\b/u);
  assert.ok(source.includes("詳しい補足を見る"));
  assert.match(source, /hasSecondaryDetail\s*\?\s*\(/u);
  assert.match(source, /secondarySeen = new Set\(primaryContent\)/u);
  assert.doesNotMatch(readText(noteCssPath), /display:\s*none/iu);
});

await check("fixtures decode and cover all nine presentation cases", async () => {
  const fixturesUrl = pathToFileURL(path.join(root, fixturesPath));
  fixturesUrl.searchParams.set("verify", `${Date.now()}`);
  const projectionUrl = pathToFileURL(
    path.join(root, "lib/assessment/runtime/customer-assessment-projection-v1.ts"),
  );
  projectionUrl.searchParams.set("verify", `${Date.now()}`);
  const fixtureModule = await import(fixturesUrl.href);
  const projectionModule = await import(projectionUrl.href);
  const fixtures = fixtureModule.customerAssessmentReviewFixtures;
  assert.equal(fixtures.length, 9);
  assert.deepEqual(
    sorted(fixtures.map((fixture) => fixture.id)),
    sorted(fixtureIds),
  );
  fixtures.forEach((fixture) =>
    projectionModule.decodeCustomerAssessmentProjectionV1(fixture.projection),
  );

  const simple = selectFixture(fixtures, "simple_business_reply_with_draft");
  assert.equal(simple.decisionCode, "reply_now");
  assert.deepEqual(simple.requestedTopics, ["draft_message", "decide_send_or_wait"]);
  assert.notEqual(simple.finalDraft, null);
  assert.equal(simple.relationshipSummary, null);
  assert.equal(simple.messageTemperature, null);
  assert.deepEqual(simple.optionalDetails, {});

  const waiting = selectFixture(fixtures, "ordinary_reply_waiting");
  assert.equal(waiting.decisionCode, "wait_and_reassess");
  assert.equal(waiting.finalDraft, null);
  assert.equal(waiting.messageTemperature, null);
  assert.ok(waiting.optionalDetails.shortLetter.length > 0);
  assert.ok(waiting.optionalDetails.anxietyReframe.length > 0);

  const thankYou = selectFixture(fixtures, "polite_thank_you_with_draft");
  assert.notEqual(thankYou.finalDraft, null);
  assert.notEqual(thankYou.messageTemperature, null);
  assert.ok(thankYou.requestedTopics.includes("message_impact"));

  const relationship = selectFixture(fixtures, "relationship_summary_requested");
  assert.notEqual(relationship.relationshipSummary, null);

  const legacy = selectFixture(fixtures, "expanded_plan_requested_legacy");
  assert.deepEqual(
    legacy.optionalDetails.expandedPlan.map((item) => item.phase),
    ["tonight", "next_day", "day_three"],
  );

  const split = selectFixture(fixtures, "expanded_plan_requested_split");
  assert.deepEqual(
    split.optionalDetails.expandedPlan.map((item) => item.phase),
    ["tonight", "next", "reassessment_condition"],
  );

  const nullable = selectFixture(fixtures, "nullable_optional_sections");
  assert.equal(nullable.relationshipSummary, null);
  assert.equal(nullable.messageTemperature, null);

  const pause = selectFixture(fixtures, "pause_additional_contact_no_draft");
  assert.equal(pause.decisionCode, "pause_additional_contact");
  assert.equal(pause.finalDraft, null);
  assert.ok(pause.requestedTopics.includes("draft_message"));

  const kansai = selectFixture(fixtures, "kansai_persona_draft");
  assert.equal(
    kansai.finalDraft.text,
    "おっけー、土曜ならいけるで！\nまた時間おしえて〜😊",
  );
});

await check("nullable headings and legacy split labels remain distinct", () => {
  const source = readText(notePath);
  assert.match(
    source,
    /requestedTopics\.includes\("relationship"\) && projection\.relationshipSummary/u,
  );
  assert.match(
    source,
    /requestedTopics\.includes\("message_impact"\) && projection\.messageTemperature/u,
  );
  assert.equal(source.includes('next: "次の日"'), false);
  assert.equal(source.includes('next: "明日"'), false);
  assert.ok(source.includes('next: "次に"'));
});

await check("mobile-first CSS avoids horizontal-overflow risks", () => {
  const css = readText(noteCssPath);
  assert.match(css, /overflow-x:\s*clip/u);
  assert.match(css, /min-inline-size:\s*0/u);
  assert.match(css, /overflow-wrap:\s*anywhere/u);
  assert.match(css, /white-space:\s*pre-wrap/u);
  assert.match(css, /:focus-visible/u);
  assert.match(css, /prefers-reduced-motion:\s*reduce/u);
  assert.doesNotMatch(
    css,
    /(?:^|\s)(?:width|min-width|max-width|inline-size|min-inline-size|max-inline-size):\s*\d+(?:\.\d+)?px/gmu,
  );
  const remFontSizes = [...css.matchAll(/font-size:\s*(0?\.\d+)rem/gu)].map(
    (match) => Number(match[1]),
  );
  assert.ok(remFontSizes.every((size) => size >= 0.875));
});

await check("review route is gated noindex fixture-only", () => {
  const source = readText(reviewPagePath);
  assert.match(source, /index:\s*false/u);
  assert.match(source, /follow:\s*false/u);
  assert.match(source, /process\.env\.NODE_ENV === "production"/u);
  assert.match(source, /process\.env\.M2_INTERNAL_RUNTIME_ENABLED !== "true"/u);
  assert.match(source, /notFound\(\)/u);
  assert.match(source, /searchParams/u);
  assert.match(source, /query:\s*\{ fixture: fixture\.id \}/u);
  assert.match(
    source,
    /<CustomerAssessmentNote projection=\{selectedFixture\.projection\}\s*\/>/u,
  );
  assert.equal((source.match(/process\.env\./gu) ?? []).length, 2);
});

await check("presentation contract and capabilities exact", () => {
  const contract = readJson(presentationContractPath);
  const capabilities = readJson(capabilitiesPath);
  assert.equal(contract.baseline, baseline);
  assert.deepEqual(contract.exact_scope, exactScope);
  assert.deepEqual(contract.fixture_ids, fixtureIds);
  assert.deepEqual(
    [
      contract.operations.provider_calls,
      contract.operations.db_operations,
      contract.operations.supabase_operations,
    ],
    [0, 0, 0],
  );
  assert.equal(contract.authority.accepted_input, "CustomerAssessmentProjectionV1");
  assert.equal(contract.authority.full_structured_report_enters_customer_component, false);
  assert.equal(contract.review_route.production_behavior, "not_found");

  const expectedCapabilities = {
    status: "customer_note_implemented_pending_human_visual_chatgpt_review",
    baseline,
    package_a_accepted: true,
    package_a_r1_accepted: true,
    projection_only_component_boundary: true,
    customer_note_implementation_complete: true,
    customer_note_automated_verification_complete: true,
    human_visual_review_complete: false,
    chatgpt_visual_review_complete: false,
    product_owner_successor_review_complete: false,
    public_runtime_connected: false,
    review_route_active_in_production: false,
    customer_ui_finalized: false,
    provider_calls: 0,
    db_operations: 0,
    supabase_operations: 0,
    package_c_authorized: false,
    package_d_authorized: false,
    package_e_authorized: false,
    package_f_authorized: false,
    provider_rerun_authorized: false,
    active_runtime_activated: false,
    r4_authorized: false,
    c2_authorized: false,
    next_action: "human_visual_and_chatgpt_review_of_customer_note",
  };
  for (const [key, value] of Object.entries(expectedCapabilities)) {
    assert.deepEqual(capabilities[key], value, key);
  }
});

await check("visual review matrix is complete and wholly pending", () => {
  const review = readJson(visualReviewPath);
  assert.equal(review.status, "pending_human_visual_chatgpt_review");
  assert.deepEqual(
    review.viewports.map((viewport) => viewport.width_px),
    [1440, 399, 320],
  );
  assert.deepEqual(
    review.interaction_accessibility_checks.map((item) => item.id),
    requiredVisualChecks,
  );
  assert.deepEqual(
    review.fixtures.map((fixture) => fixture.fixture_id),
    fixtureIds,
  );
  for (const viewport of review.viewports) {
    assert.equal(viewport.status, "pending");
    assert.equal(viewport.human_visual_review, null);
    assert.equal(viewport.chatgpt_visual_review, null);
  }
  for (const item of review.interaction_accessibility_checks) {
    assert.equal(item.status, "pending");
    assert.equal(item.human_result, null);
    assert.equal(item.chatgpt_result, null);
  }
  for (const fixture of review.fixtures) {
    assert.equal(fixture.status, "pending");
    assert.equal(fixture.human_visual_review, null);
    assert.equal(fixture.chatgpt_visual_review, null);
  }
});

await check("active Runtime v4 and Package C-F remain unchanged", () => {
  for (const candidate of [
    "lib/assessment/runtime/service.ts",
    "lib/assessment/runtime/schema-catalog.ts",
    "components/runtime/RuntimeAssessmentNote.tsx",
    "components/runtime/RuntimeAssessmentForm.tsx",
    "app/api/internal/assessments/route.ts",
  ]) {
    assert.equal(
      git(["hash-object", candidate]),
      git(["rev-parse", `${baseline}:${candidate}`]),
      candidate,
    );
  }
  assert.match(
    readText("lib/assessment/runtime/schema-catalog.ts"),
    /runtime-stage-catalog-v4\.0\.0/u,
  );
  const capabilities = readJson(capabilitiesPath);
  for (const key of [
    "package_c_authorized",
    "package_d_authorized",
    "package_e_authorized",
    "package_f_authorized",
  ]) {
    assert.equal(capabilities[key], false, key);
  }
  assert.equal(capabilities.active_runtime_activated, false);
});

await check("git diff --check PASS", () => {
  git(["diff", "--check"]);
  for (const candidate of exactScope) {
    assert.doesNotMatch(readText(candidate), /[\t ]+$/gmu, candidate);
  }
});

const failed = checks.filter((result) => !result.passed);
console.log(
  `Customer note verifier: ${failed.length === 0 ? "PASS" : "FAIL"} ${
    checks.length - failed.length
  }/${checks.length}`,
);
console.log(`Exact scope: ${exactScope.length}/10`);
console.log(`Review fixtures: ${fixtureIds.length}/9`);
console.log(`Package A R1 verifier: ${r1VerifierSummary}`);
console.log("Provider / DB / Supabase: 0 / 0 / 0");
if (failed.length > 0) process.exitCode = 1;
