import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const baselineSha = "20d4178e3a63026128f3a25d052196c7161e7e27";
const exactPaths = [
  "app/review/runtime/i2/page.tsx",
  "lib/assessment/runtime/review/m2-p4-i2-review-fixture.ts",
  "evals/runtime/m2-p4-i2-field-disposition-v1.json",
  "evals/runtime/m2-p4-i2-capabilities-v1.json",
  "scripts/verify-m2-p4-i2-report-ia.mjs",
  "docs/phase2/TASK_M2_P4_I2_REVIEW.md",
  "components/runtime/RuntimeAssessmentForm.tsx",
  "components/runtime/RuntimeAssessmentNote.tsx",
  "app/globals.css",
  "scripts/verify-m2-eval-foundation.mjs",
  "scripts/verify-m2-p3-runtime-vertical-slice.mjs",
  "docs/CURRENT_FOCUS.md",
  "docs/WBS.md",
  "docs/CODEX_HANDOFF.md",
  "scripts/verify-m2-p4-i1-b-runtime-integration.mjs",
  "scripts/verify-m2-p4-i1-c-contextual-best-effort.mjs",
];
const exactRendererPaths = [
  "app/review/runtime/i2/page.tsx",
  "app/globals.css",
  "components/runtime/RuntimeAssessmentForm.tsx",
  "components/runtime/RuntimeAssessmentNote.tsx",
];
const sectionOrder = [
  "tonight-action",
  "short-letter",
  "decision-reason",
  "message-reading",
  "three-day-plan",
  "change-conditions",
  "closing",
];
const topicMappings = [
  ["decide_send_or_wait", "送るか待つか決めたい", "tonight-action"],
  ["draft_message", "送る文章を整えたい", "message-draft"],
  ["message_impact", "この文面がどう届くか知りたい", "message-reading"],
  ["relationship", "相手との関係を整理したい", "decision-reason"],
  ["next_three_days", "これから3日どう動くか知りたい", "three-day-plan"],
  ["organize_emotions", "不安を整理したい", "short-letter"],
];
const hiddenFields = [
  "observed_fact_commentary",
  "anxiety_reframe",
  "action_rationales",
  "message_draft_context",
  "three_day_plan_commentary",
  "change_condition_commentary",
  "unknowns_commentary",
];

function absolute(relativePath) {
  return path.join(repositoryRoot, ...relativePath.split("/"));
}

function source(relativePath) {
  return readFileSync(absolute(relativePath), "utf8");
}

function json(relativePath) {
  return JSON.parse(source(relativePath));
}

function gitText(args) {
  return execFileSync(
    "git.exe",
    ["-c", "safe.directory=C:/projects/moon-reply", ...args],
    {
      cwd: repositoryRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
}

function gitResult(args) {
  return spawnSync(
    "git.exe",
    ["-c", "safe.directory=C:/projects/moon-reply", ...args],
    {
      cwd: repositoryRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
}

function sorted(items) {
  return [...items].sort((left, right) => left.localeCompare(right, "en"));
}

function currentTaskPaths() {
  const paths = new Set(
    gitText(["diff", "--name-only", baselineSha, "--"])
      .split(/\r?\n/gu)
      .map((item) => item.trim().replaceAll("\\", "/"))
      .filter(Boolean),
  );
  for (const line of gitText([
    "status",
    "--porcelain=v1",
    "--untracked-files=all",
  ])
    .split(/\r?\n/gu)
    .filter(Boolean)) {
    let item = line.slice(3).trim();
    if (item.includes(" -> ")) item = item.split(" -> ").at(-1);
    paths.add(item.replaceAll("\\", "/"));
  }
  return sorted(paths);
}

gitText(["cat-file", "-e", `${baselineSha}^{commit}`]);
gitText(["merge-base", "--is-ancestor", baselineSha, "HEAD"]);

const actualPaths = currentTaskPaths();
assert.deepEqual(actualPaths, sorted(exactPaths));
assert.equal(exactPaths.length, 16);
assert.equal(new Set(exactPaths).size, 16);
assert.equal(exactPaths.some((item) => item.includes("*")), false);
assert.equal(exactPaths.some((item) => item.endsWith("/")), false);

const protectedDiff = gitResult([
  "diff",
  "--exit-code",
  baselineSha,
  "--",
  "ai/prompts",
  "ai/schemas",
  "evals/development",
  "evals/holdout",
  "lib/assessment/runtime/pipeline.ts",
  "lib/assessment/runtime/types.ts",
  "lib/assessment/runtime/policy.ts",
  "lib/assessment/runtime/policy-v2.ts",
  "lib/assessment/runtime/policy-v3.ts",
  "lib/assessment/runtime/contracts",
  "app/api",
  "supabase",
  "package.json",
  "package-lock.json",
]);
assert.equal(protectedDiff.status, 0, protectedDiff.stdout || protectedDiff.stderr);

const i1cManifest = json("evals/runtime/m2-p4-i1-c-capabilities-v1.json");
const i1cSnapshot = i1cManifest.implementation_snapshot;
const historicalI1cPaths = gitText([
  "diff",
  "--name-only",
  i1cSnapshot.base_commit_sha,
  i1cSnapshot.end_commit_sha,
  "--",
])
  .split(/\r?\n/gu)
  .map((item) => item.trim().replaceAll("\\", "/"))
  .filter(Boolean);
assert.equal(i1cSnapshot.immutable_snapshot, true);
assert.equal(i1cSnapshot.include_working_tree, false);
assert.equal(historicalI1cPaths.length, 27);
assert.deepEqual(sorted(historicalI1cPaths), sorted(i1cManifest.accepted_stack_paths));

const dispositions = json(
  "evals/runtime/m2-p4-i2-field-disposition-v1.json",
);
const expectedDispositionEntries = [
  {
    field: "observed_fact_commentary",
    disposition: "integrate",
    target: "decision-reason",
    rule: "decision_reason_fact_idsに含まれるfactだけ表示",
  },
  {
    field: "anxiety_reframe",
    disposition: "display",
    target: "short-letter",
    label: "不安を少しほどくために",
  },
  {
    field: "action_rationales",
    disposition: "integrate",
    target: "tonight-action",
    label: "この動き方をすすめる理由",
  },
  {
    field: "message_draft_context",
    disposition: "display",
    target: "message-draft",
    label: "この文面に整えた理由",
  },
  {
    field: "three_day_plan_commentary",
    disposition: "integrate",
    target: "three-day-plan",
    rule: "day indexと同じindexへ統合",
  },
  {
    field: "change_condition_commentary",
    disposition: "display",
    target: "change-conditions",
  },
  {
    field: "unknowns_commentary",
    disposition: "deprecate_in_successor_schema",
    target: "none",
    rationale:
      "possible_interpretations、change conditions、fixed limitationとの意味重複が強く、現画面へ追加すると免責と不明点の反復になるため",
  },
];
assert.equal(dispositions.schema_version, "m2-p4-i2-field-disposition-v1");
assert.deepEqual(dispositions.entries, expectedDispositionEntries);
assert.equal(dispositions.entries.length, 7);
assert.equal(new Set(dispositions.entries.map((item) => item.field)).size, 7);
assert.deepEqual(dispositions.entries.map((item) => item.field), hiddenFields);
assert.equal(
  dispositions.entries.every((item) =>
    ["display", "integrate", "deprecate_in_successor_schema"].includes(
      item.disposition,
    ),
  ),
  true,
);

const capabilities = json("evals/runtime/m2-p4-i2-capabilities-v1.json");
assert.equal(capabilities.task_id, "M2-P4-I2");
assert.equal(
  capabilities.title,
  "Report Information Architecture and Intent Fulfillment",
);
assert.equal(
  capabilities.status,
  "implementation_pending_human_chatgpt_review",
);
assert.equal(capabilities.baseline, baselineSha);
assert.deepEqual(capabilities.exact_mutation_paths, exactPaths);
assert.equal(capabilities.field_disposition_asset,
  "evals/runtime/m2-p4-i2-field-disposition-v1.json");
assert.equal(capabilities.selected_intent_mappings, 6);
assert.equal(capabilities.static_preview_route, "/review/runtime/i2");
for (const key of [
  "openai_calls",
  "db_operations",
  "migrations",
  "holdout_use",
  "real_user_data",
]) {
  assert.equal(capabilities[key], 0);
}
assert.equal(capabilities.i3_status, "not_started");
assert.equal(JSON.stringify(capabilities).includes("*"), false);
assert.equal("prefix_authorization" in capabilities, false);

for (const verifierPath of [
  "scripts/verify-m2-p4-i1-b-runtime-integration.mjs",
  "scripts/verify-m2-p4-i1-c-contextual-best-effort.mjs",
]) {
  const verifierSource = source(verifierPath);
  assert.equal(verifierSource.includes(baselineSha), true);
  for (const rendererPath of exactRendererPaths) {
    assert.equal(verifierSource.includes(`"${rendererPath}"`), true);
  }
  for (const forbiddenAuthorization of [
    "app/**",
    "components/**",
    'startsWith("app/")',
    'startsWith("components/")',
  ]) {
    assert.equal(verifierSource.includes(forbiddenAuthorization), false);
  }
}

const noteSource = source("components/runtime/RuntimeAssessmentNote.tsx");
const formSource = source("components/runtime/RuntimeAssessmentForm.tsx");
const sectionPositions = sectionOrder.map((sectionId) =>
  noteSource.indexOf(`id=\"${sectionId}\"`),
);
assert.equal(sectionPositions.every((position) => position >= 0), true);
assert.deepEqual(sectionPositions, [...sectionPositions].sort((a, b) => a - b));
assert.equal(noteSource.includes("reading-note-answer-section"), false);
assert.equal(noteSource.includes("<h2>文面の温度</h2>"), false);
assert.equal(noteSource.includes("id=\"message-temperature\""), false);

assert.equal(noteSource.includes("requestedTopics: RequestedTopic[]"), true);
assert.equal(formSource.includes("requestedTopics={form.requestedTopics}"), true);
assert.equal(noteSource.includes("requestedTopics.map((topic)"), true);
assert.equal(noteSource.includes("href={`#${navigation.sectionId}`}"), true);
for (const [topic, label, sectionId] of topicMappings) {
  assert.equal(noteSource.includes(`${topic}: {`), true);
  assert.equal(noteSource.includes(`label: \"${label}\"`), true);
  assert.equal(noteSource.includes(`sectionId: \"${sectionId}\"`), true);
  assert.equal(
    noteSource.includes(`id=\"${sectionId}\"`) ||
      noteSource.includes(`sectionId: \"${sectionId}\"`),
    true,
  );
}

for (const field of hiddenFields.slice(0, 6)) {
  assert.equal(noteSource.includes(field), true, `${field} is not rendered`);
}
assert.equal(noteSource.includes("unknowns_commentary"), false);
assert.equal(noteSource.includes("item.avoid"), true);
assert.equal(noteSource.includes("decision_reason_fact_ids"), true);
assert.equal(noteSource.includes("selectedFactIds.has(item.fact_id)"), true);
assert.equal(noteSource.includes("threeDayPlanAligned"), true);
assert.equal(
  noteSource.includes("3日間の計画と補足の件数が一致していません。"),
  true,
);

assert.equal(
  noteSource.includes(
    "今夜は送信を急がない判断のため、今すぐ送る文面は提示していません。",
  ),
  true,
);
assert.equal(
  noteSource.includes(
    "追加連絡を止める判断のため、送信用の文面は提示していません。",
  ),
  true,
);
assert.equal(
  noteSource.match(/selected_decision ===/gu)?.length,
  2,
);
assert.equal(noteSource.includes('selected_decision === "reply_now"'), false);
assert.equal(noteSource.includes('selected_decision === "send_now"'), false);

const previewSource = source("app/review/runtime/i2/page.tsx");
const fixtureSource = source(
  "lib/assessment/runtime/review/m2-p4-i2-review-fixture.ts",
);
const environmentNode = "process" + ".env.NODE_ENV";
const environmentGate = "process" + ".env.M2_INTERNAL_RUNTIME_ENABLED";
const networkCallToken = "fetch" + "(";
assert.equal(previewSource.includes(`${environmentNode} === \"production\"`), true);
assert.equal(previewSource.includes(`${environmentGate} !== \"true\"`), true);
assert.equal(previewSource.includes("notFound()"), true);
assert.equal(previewSource.includes("index: false"), true);
assert.equal(previewSource.includes("follow: false"), true);
assert.equal(previewSource.includes("I2固定プレビュー / API・DB未使用"), true);
assert.equal(previewSource.includes(networkCallToken), false);
assert.equal(previewSource.includes("/api/internal/assessments"), false);
assert.equal(previewSource.includes('from "openai"'), false);
assert.equal(previewSource.includes("@supabase/supabase-js"), false);

const requiredReportFields = [
  "cover_line",
  "short_letter",
  "decision_reason_summary",
  "relationship_summary",
  ...hiddenFields,
  "possible_interpretations",
  "message_temperature",
  "closing_lines",
];
for (const field of requiredReportFields) {
  assert.equal(fixtureSource.includes(`${field}:`), true, `${field} missing`);
}
assert.equal(fixtureSource.includes('selected_decision: "reply_now"'), true);
assert.equal(fixtureSource.includes("message_draft: {"), true);
assert.equal(fixtureSource.match(/day: "(?:tonight|next_day|day_three)"/gu)?.length, 3);
assert.equal(fixtureSource.match(/^\s+avoid:/gmu)?.length, 3);
assert.equal(fixtureSource.includes("change_conditions: ["), true);
assert.equal(fixtureSource.includes("架空"), true);
assert.equal(
  /[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/iu.test(
    fixtureSource,
  ),
  false,
);
assert.equal(fixtureSource.includes(networkCallToken), false);
assert.equal(fixtureSource.includes("provider response"), false);
assert.equal(fixtureSource.includes("secret"), false);

const i2RuntimeSources = [previewSource, fixtureSource, noteSource].join("\n");
for (const forbidden of [
  "new OpenAI",
  ".responses.create",
  "createClient",
  ".from(",
  ".rpc(",
  "PB-07",
  "Repair",
  "fallback",
]) {
  assert.equal(i2RuntimeSources.includes(forbidden), false);
}

console.log("M2_P4_I2_REPORT_INFORMATION_ARCHITECTURE: PASS");
console.log("exact_scope: 16/16");
console.log("renderer_exceptions: 4/4");
console.log("unauthorized_renderer_regressions: PASS");
console.log("field_dispositions: 7/7");
console.log("selected_intent_mappings: 6/6");
console.log("hidden_fields_visible_or_disposed: 7/7");
console.log("duplicate_answer_section: 0");
console.log("tonight_action_priority: PASS");
console.log("draft_context_visible: PASS");
console.log("three_day_avoid_visible: PASS");
console.log("static_preview_network_calls: 0");
console.log("openai_calls: 0");
console.log("db_operations: 0");
console.log("holdout_use: 0");
