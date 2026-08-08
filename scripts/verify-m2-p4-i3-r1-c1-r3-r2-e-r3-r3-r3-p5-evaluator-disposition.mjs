import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const baseline = "2f8b8fa6ce8e54117f25640809240521a39b1b4d";
const expectedParent = "88e4262e3b0a4f92da4d24cf6c351885f3ea2c74";
const expectedMain = "61e33a10e195fad17e253a6b9719217e1992f273";
const expectedSourceBranch =
  "fix/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p5-r1-evaluator-precision";
const expectedBranch =
  "fix/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p5-r2-product-outcome-gates";
const catalogV12Baseline =
  "b495b958a8fd8dfe203380ca0036140f83f4f4dd";
const correctedPb06V4Hash =
  "3a9e0a2f18e401455b11a0d3ff5d40f1b82560fec01d425859a7822bd709ad6b";
const evidenceCommitB = "9e9bf7d90740c1d00bfc4e282c85906744cd736c";
const packageRoot =
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p5";

const pb06V4Path =
  "lib/assessment/runtime/contracts/pb-06-materiality-validator-v4.developer.md";
const semanticV5Path = "lib/assessment/runtime/semantic-disposition-v5.ts";
const catalogV12Path =
  "lib/assessment/runtime/contracts/runtime-stage-catalog-v12.json";
const evaluatorV2Path =
  "scripts/lib/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-evaluator-v2.mjs";
const contractPath = `${packageRoot}/remediation-contract-v1.json`;
const fixturesPath = `${packageRoot}/remediation-fixtures-v1.json`;
const offlineResultsPath = `${packageRoot}/offline-results-v1.json`;
const capabilitiesPath = `${packageRoot}/capabilities-v1.json`;
const verifierPath =
  "scripts/verify-m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p5-evaluator-disposition.mjs";
const reviewPath =
  "docs/phase2/TASK_M2_P4_I3_R1_C1_R3_R2_E_R3_R3_R3_P5_REVIEW.md";
const schemaCatalogPath = "lib/assessment/runtime/schema-catalog.ts";
const pipelinePath = "lib/assessment/runtime/pipeline.ts";

const updatedPaths = [
  semanticV5Path,
  contractPath,
  fixturesPath,
  offlineResultsPath,
  capabilitiesPath,
  verifierPath,
  reviewPath,
];
const exactScope = [...updatedPaths].sort();

const protectedPaths = [
  "lib/assessment/runtime/contracts/pb-05-directional-report-v4.developer.md",
  "lib/assessment/runtime/report-grounding-v4.ts",
  "lib/assessment/runtime/contracts/pb-06-materiality-validator-v3.developer.md",
  "lib/assessment/runtime/semantic-disposition-v4.ts",
  "lib/assessment/runtime/contracts/runtime-stage-catalog-v11.json",
  "scripts/lib/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-evaluator-v1.mjs",
  pb06V4Path,
  catalogV12Path,
  evaluatorV2Path,
  schemaCatalogPath,
  pipelinePath,
  "lib/assessment/runtime/service.ts",
  "lib/assessment/runtime/contracts/runtime-stage-catalog-v4.json",
  "ai/schemas/validation-result.schema.json",
  "lib/assessment/runtime/contracts/report-content-v2.schema.json",
  "lib/assessment/runtime/contracts/decision-plan-v2.schema.json",
];

const packageCPaths = [
  "lib/assessment/runtime/contracts/pb-05-directional-report-v4.developer.md",
  "lib/assessment/runtime/report-grounding-v4.ts",
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p4/remediation-contract-v1.json",
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p4/remediation-fixtures-v1.json",
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p4/offline-results-v1.json",
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p4/capabilities-v1.json",
  "scripts/verify-m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p4-pb05-precision-writing.mjs",
  "docs/phase2/TASK_M2_P4_I3_R1_C1_R3_R2_E_R3_R3_R3_P4_REVIEW.md",
];

const expectedHashes = {
  pb05V4: "530fe831e8290270d499a44d8aae98b3756935feed1bcfc79612e05ff7695c9f",
  groundingV4:
    "dc256f6bb98a9a350f3b5938d76229ee3d9d4a5ec9095a183a185afa584388b8",
  pb06V3: "64452e70787efd40742dc1a3aea7a6c287fbc94f9ec175a122423a031346a920",
  semanticV4:
    "68524d4235513826e42b02eb05c3c34f548f5ac2685359a17a4e7019877c604b",
  catalogV11:
    "47e61d9316a298d67bbe17ac8f25124e7c3570e9b4a49c6d652d2cb9ed243eb1",
  pb06V4: correctedPb06V4Hash,
};

const checks = [];

function absolute(relativePath) {
  return path.join(root, ...relativePath.split("/"));
}

function normalizePath(value) {
  return value.replaceAll("\\", "/");
}

function text(relativePath) {
  return readFileSync(absolute(relativePath), "utf8");
}

function json(relativePath) {
  return JSON.parse(text(relativePath));
}

function sha256Bytes(value) {
  return createHash("sha256").update(value).digest("hex");
}

function sha256Text(value) {
  return sha256Bytes(Buffer.from(value.replace(/\r\n/gu, "\n"), "utf8"));
}

function normalizedText(value) {
  return value.replace(/\r\n/gu, "\n");
}

function textAt(revision, relativePath) {
  return blobBytesAt(revision, relativePath).toString("utf8");
}

function assertStrictShaTriplet({ actualFileSha, catalogPromptSha, loaderPromptHash }) {
  for (const value of [actualFileSha, catalogPromptSha, loaderPromptHash]) {
    assert.match(value, /^[0-9a-f]{64}$/u);
  }
  assert.equal(catalogPromptSha, actualFileSha, "Catalog SHA must equal actual PB-06 SHA");
  assert.equal(loaderPromptHash, catalogPromptSha, "Loader SHA must equal Catalog SHA");
}

function evaluatorDispositionPb06LoaderHash() {
  const source = text(schemaCatalogPath);
  const loaderStart = source.indexOf(
    "export async function loadM2P4EvaluatorDispositionRuntimeStageCatalog()",
  );
  assert.ok(loaderStart >= 0);
  const loaderSource = source.slice(loaderStart);
  const match = /"PB-06"[\s\S]*?promptHash:\s*\n?\s*"([0-9a-f]{64})"/u.exec(
    loaderSource,
  );
  assert.ok(match);
  return match[1];
}

function git(args, options = {}) {
  return execFileSync(
    "git.exe",
    ["-c", "safe.directory=C:/projects/moon-reply", ...args],
    {
      cwd: root,
      encoding: "utf8",
      maxBuffer: 32 * 1024 * 1024,
      ...options,
    },
  ).trim();
}

function gitSucceeds(args) {
  return (
    spawnSync(
      "git.exe",
      ["-c", "safe.directory=C:/projects/moon-reply", ...args],
      { cwd: root, encoding: "utf8" },
    ).status === 0
  );
}

function blobAt(revision, relativePath) {
  return git(["rev-parse", `${revision}:${relativePath}`]);
}

function blobBytesAt(revision, relativePath) {
  return execFileSync(
    "git.exe",
    [
      "-c",
      "safe.directory=C:/projects/moon-reply",
      "show",
      `${revision}:${relativePath}`,
    ],
    { cwd: root, maxBuffer: 32 * 1024 * 1024 },
  );
}

function changedPaths() {
  const tracked = git(["diff", "--name-only", baseline, "--"])
    .split(/\r?\n/gu)
    .filter(Boolean)
    .map(normalizePath);
  const untracked = git(["ls-files", "--others", "--exclude-standard"])
    .split(/\r?\n/gu)
    .filter(Boolean)
    .map(normalizePath);
  return [...new Set([...tracked, ...untracked])].sort();
}

async function check(name, body) {
  try {
    await body();
    checks.push({ name, passed: true });
    console.log(`PASS ${name}`);
  } catch (error) {
    checks.push({ name, passed: false, error });
    console.error(`FAIL ${name}`);
    console.error(error instanceof Error ? error.stack : error);
  }
}

function assertUnchangedFromBaseline(relativePath) {
  assert.equal(
    gitSucceeds(["diff", "--quiet", baseline, "--", relativePath]),
    true,
    relativePath,
  );
}

function buildFixturePlan(fixture) {
  const changes = fixture.change_conditions ?? [
    {
      condition: "相手から新しい情報が届いた場合",
      resulting_direction: fixture.current_decision,
      supporting_fact_ids: ["F001"],
    },
  ];
  return {
    schema_version: "pipeline-schema-v2.0.0",
    selected_decision: fixture.current_decision,
    decision_reason_fact_ids: ["F001"],
    possible_interpretations: [],
    pre_action_check: { check: "確認する", supporting_fact_ids: ["F001"] },
    actions_to_take: ["現在の行動を一つ実行する"],
    actions_to_avoid: [],
    recommended_message_draft:
      fixture.current_decision === "reply_now" ||
      fixture.current_decision === "send_now"
        ? { text: "確認しました。", policy: "required_now", use_timing: "now" }
        : null,
    message_draft_edit_metadata: null,
    aftercare_plan: [],
    change_conditions: changes,
    review_timing: fixture.review_timing ?? {
      when: "新しい事実が届いた時",
      trigger_fact_ids: ["F001"],
    },
    material_unknowns: fixture.material_unknowns ?? [],
    model_generated_limitations: fixture.model_generated_limitations ?? [],
  };
}

function buildFixtureReport(fixture) {
  return {
    schema_version: "pipeline-schema-v2.0.0",
    cover_line: "現在の方向を確認します。",
    short_letter: [],
    decision_reason_summary: "明示事実に基づく方向です。",
    relationship_summary: null,
    observed_fact_commentary: [],
    possible_interpretations: [],
    anxiety_reframe: [],
    message_temperature: null,
    action_rationales: [],
    message_draft_context: null,
    aftercare_commentary: [],
    change_condition_commentary:
      fixture.grounded_change_condition_commentary ?? [],
    closing_lines: [],
  };
}

function evidenceForEvaluatorFixture(fixture) {
  const evidence = {
    decision_plan: {
      actions_to_take: [],
      recommended_message_draft: null,
      aftercare_plan: [],
      change_conditions: [],
      review_timing: {},
      material_unknowns: [],
      model_generated_limitations: [],
    },
    grounded_report_content: {
      short_letter: [],
      closing_lines: [],
    },
  };
  if (fixture.json_path === "$.decision_plan.actions_to_take[0]") {
    evidence.decision_plan.actions_to_take.push(fixture.text);
  } else if (fixture.json_path === "$.report_content.short_letter[0]") {
    evidence.grounded_report_content.short_letter.push(fixture.text);
  } else if (fixture.json_path === "$.report_content.closing_lines[0]") {
    evidence.grounded_report_content.closing_lines.push(fixture.text);
  } else {
    throw new Error(`Unsupported evaluator fixture path: ${fixture.json_path}`);
  }
  return evidence;
}

await check("exact branch baseline parent source main and origin-main authority", () => {
  assert.equal(git(["branch", "--show-current"]), expectedBranch);
  assert.equal(git(["rev-parse", `${baseline}^`]), expectedParent);
  assert.equal(git(["rev-parse", `origin/${expectedSourceBranch}`]), baseline);
  assert.equal(git(["merge-base", baseline, "HEAD"]), baseline);
  const successorCommits = Number(git(["rev-list", "--count", `${baseline}..HEAD`]));
  assert.ok(successorCommits === 0 || successorCommits === 1);
  if (successorCommits === 1) assert.equal(git(["rev-parse", "HEAD^"]), baseline);
  assert.equal(git(["rev-parse", "main"]), expectedMain);
  assert.equal(git(["rev-parse", "origin/main"]), expectedMain);
  assert.equal(git(["stash", "list"]), "");
});

await check("exact P5-R2 correction scope 7/7 updated only", () => {
  assert.deepEqual(changedPaths(), exactScope);
  assert.equal(updatedPaths.length, 7);
  for (const relativePath of updatedPaths) {
    assert.equal(existsSync(absolute(relativePath)), true, relativePath);
    assert.equal(
      gitSucceeds(["cat-file", "-e", `${baseline}:${relativePath}`]),
      true,
      relativePath,
    );
  }
});

await check("strict UTF-8 JSON validity U+FFFD zero and no secret material", () => {
  const decoder = new TextDecoder("utf-8", { fatal: true });
  const secretNeedles = ["s" + "k-", "sb_" + "secret_", "Bearer " + "eyJ"];
  for (const relativePath of exactScope) {
    const bytes = readFileSync(absolute(relativePath));
    const decoded = decoder.decode(bytes);
    assert.equal(decoded.includes("\uFFFD"), false, relativePath);
    assert.equal(decoded.charCodeAt(0) === 0xfeff, false, relativePath);
    for (const needle of secretNeedles) {
      assert.equal(decoded.includes(needle), false, `${relativePath}: ${needle}`);
    }
    if (relativePath.endsWith(".json")) JSON.parse(decoded);
  }
});

await check("Package C accepted assets and protected Runtime blobs unchanged", () => {
  for (const relativePath of [...protectedPaths, ...packageCPaths]) {
    assertUnchangedFromBaseline(relativePath);
  }
  assert.equal(
    sha256Text(
      text(
        "lib/assessment/runtime/contracts/pb-05-directional-report-v4.developer.md",
      ),
    ),
    expectedHashes.pb05V4,
  );
  assert.equal(
    sha256Text(text("lib/assessment/runtime/report-grounding-v4.ts")),
    expectedHashes.groundingV4,
  );
});

await check("PB-06 v3 semantic v4 and v11 Catalog exact hashes unchanged", () => {
  assert.equal(
    sha256Text(
      text(
        "lib/assessment/runtime/contracts/pb-06-materiality-validator-v3.developer.md",
      ),
    ),
    expectedHashes.pb06V3,
  );
  assert.equal(
    sha256Text(text("lib/assessment/runtime/semantic-disposition-v4.ts")),
    expectedHashes.semanticV4,
  );
  assert.equal(
    sha256Text(
      text("lib/assessment/runtime/contracts/runtime-stage-catalog-v11.json"),
    ),
    expectedHashes.catalogV11,
  );
});

await check("PB-06 v4 exact version schema inputs and canonical hash", () => {
  const source = text(pb06V4Path);
  const exactInputs = [
    "base_structured_intake",
    "candidate_envelope",
    "user_supplied_optional_message",
    "aggregate_safety_result",
    "decision_policy_result",
    "decision_plan",
    "report_content",
    "contact_constraint_policy",
    "action_context",
  ];
  assert.match(source, /Developer Contract v4\.0\.0/u);
  assert.match(source, /unchanged `validation-result\.schema\.json`/u);
  exactInputs.forEach((input) => assert.ok(source.includes(`\`${input}\``)));
  assert.equal(sha256Text(source), expectedHashes.pb06V4);
});

await check("PB-06 v4 certainty proposition distinction is narrow and exact-path based", () => {
  const source = text(pb06V4Path);
  assert.match(source, /Do not emit `UNSUPPORTED_CERTAINTY` merely because/u);
  assert.match(source, /木曜15時に確実に参加できるか確認する/u);
  assert.match(source, /相手は必ず返信します。/u);
  for (const form of [
    "必ずしも～とは限らない",
    "～とは言えない",
    "～とは断定できない",
    "～とは分からない",
    "～とは決まっていない",
    "～を保証できない",
  ]) {
    assert.ok(source.includes(form), form);
  }
  assert.match(source, /governs the matched proposition/u);
  assert.match(source, /do not implement a global substring whitelist/u);
  assert.match(source, /no broad word-based waiver/u);
  assert.match(source, /no broad word-based blocking/u);
});

await check("PB-06 v4 finding detail responsibility is category-correct", () => {
  const source = text(pb06V4Path);
  assert.match(source, /factual, assertion, policy, and Safety findings/u);
  assert.match(source, /material assertion or discrepancy/u);
  assert.match(source, /relevant supplied or absent authority/u);
  assert.match(source, /Product and editorial findings/u);
  assert.match(source, /concrete Product or editorial defect/u);
  assert.match(source, /actual downstream Product impact/u);
  assert.match(source, /Do not force an absent-authority explanation/u);
  assert.match(source, /Do not cite a broad parent object/u);
});

await check("PB-06 v4 FACT_FIDELITY materiality and hard factual boundaries", () => {
  const source = text(pb06V4Path);
  assert.match(source, /Severity follows downstream meaning/u);
  assert.match(source, /wrong speaker/u);
  assert.match(source, /sent\/received\/unsent reversal/u);
  assert.match(source, /fabricated event, chronology, date, number, promise, or schedule/u);
  assert.match(source, /polarity reversal/u);
  assert.match(source, /Material Candidate drift is major or critical/u);
  assert.match(source, /Do not upgrade every `FACT_FIDELITY`/u);
});

await check("PB-06 v4 current future separation preserves Safety and contact boundaries", () => {
  const source = text(pb06V4Path);
  assert.match(source, /current Decision\/current action/u);
  assert.match(source, /future `decision_plan\.change_conditions\[i\]\.resulting_direction`/u);
  assert.match(source, /same indexed Application-grounded change condition/u);
  assert.match(source, /current action contradiction remains blocking/u);
  assert.match(source, /no_followup_message/u);
  assert.match(source, /business_only/u);
});

const semanticV5 = await import(
  `${pathToFileURL(absolute(semanticV5Path)).href}?verify=${Date.now()}`
);
const evaluatorV2 = await import(
  `${pathToFileURL(absolute(evaluatorV2Path)).href}?verify=${Date.now()}`
);
const fixtures = json(fixturesPath);

await check("semantic disposition v5 version return contract and direct split types", () => {
  assert.equal(
    semanticV5.SEMANTIC_DISPOSITION_V5_VERSION,
    "m2-p4-semantic-disposition-v5",
  );
  const source = text(semanticV5Path);
  assert.match(source, /SplitDecisionPlanV2/u);
  assert.match(source, /SplitReportContentV2/u);
  for (const key of [
    "blockingFindings",
    "conditionalFindings",
    "nonblockingFindings",
    "ignoredTemporalFalsePositives",
    "findingDispositions",
  ]) {
    assert.ok(source.includes(key), key);
  }
});

await check("Product Outcome paths include exact customer prose and exclude internal metadata", () => {
  const patterns =
    semanticV5.SEMANTIC_DISPOSITION_V5_PRODUCT_OUTCOME_PATH_PATTERNS.map(
      (pattern) => new RegExp(pattern, "u"),
    );
  const matches = (value) => patterns.some((pattern) => pattern.test(value));
  for (const relativePath of [
    "decision_plan.review_timing.when",
    "$.decision_plan.material_unknowns[0].summary",
    "decision_plan.material_unknowns[12].summary",
    "$.decision_plan.model_generated_limitations[0]",
    "decision_plan.model_generated_limitations[12]",
  ]) {
    assert.equal(matches(relativePath), true, relativePath);
  }
  for (const relativePath of [
    "decision_plan.review_timing",
    "$.decision_plan.review_timing.trigger_fact_ids",
    "$.decision_plan.review_timing.trigger_fact_ids[0]",
    "decision_plan.material_unknowns[0]",
    "$.decision_plan.material_unknowns[0].unknown_code",
    "$.decision_plan.material_unknowns[0].material_to",
    "decision_plan.model_generated_limitations",
  ]) {
    assert.equal(matches(relativePath), false, relativePath);
  }
});

await check("material style gates use PB-06 severity and path without detail keyword parsing", () => {
  assert.deepEqual(
    semanticV5.SEMANTIC_DISPOSITION_V5_STYLE_FINDING_CODES,
    ["TEMPLATE_GENERICITY", "REPETITION"],
  );
  const fixtureById = (fixtureId) =>
    fixtures.semantic_fixtures.find((fixture) => fixture.fixture_id === fixtureId);
  const evaluate = (fixtureId, findingOverrides = {}) => {
    const fixture = fixtureById(fixtureId);
    assert.ok(fixture, fixtureId);
    return semanticV5.evaluateSemanticFindingsV5({
      validationOutput: {
        semantic_checks: [{ ...fixture.finding, ...findingOverrides }],
      },
      decisionPlan: buildFixturePlan(fixture),
      groundedReportContent: buildFixtureReport(fixture),
    }).findingDispositions[0];
  };
  const materialTemplate = evaluate(
    "material_template_genericity_product_unusable_blocks",
  );
  assert.equal(materialTemplate.disposition, "blocking");
  assert.equal(materialTemplate.reason, "materially_unusable_product_style");
  assert.equal(
    evaluate("material_repetition_product_unusable_blocks").disposition,
    "blocking",
  );
  assert.equal(
    evaluate("material_template_genericity_product_unusable_blocks", {
      severity: "critical",
    }).disposition,
    "blocking",
  );
  assert.equal(
    evaluate("material_repetition_product_unusable_blocks", {
      severity: "critical",
    }).disposition,
    "blocking",
  );
  assert.equal(
    evaluate("review_timing_when_material_unsupported_certainty_blocks", {
      severity: "critical",
    }).disposition,
    "blocking",
  );
  assert.equal(
    evaluate("template_genericity_minor_nonblocking").disposition,
    "nonblocking",
  );
  assert.equal(
    evaluate("repetition_minor_default_nonblocking").disposition,
    "nonblocking",
  );
  assert.equal(
    evaluate("material_final_draft_brand_drift_blocks").disposition,
    "blocking",
  );
  const source = text(semanticV5Path);
  const styleStart = source.indexOf("if (styleFindingCodes.has(findingCode))");
  const brandStart = source.indexOf('if (findingCode === "BRAND_TONE")');
  assert.ok(styleStart >= 0 && brandStart > styleStart);
  assert.doesNotMatch(source.slice(styleStart, brandStart), /finding\.detail/u);
});

let semanticFixturePasses = 0;
await check("semantic disposition v5 exact materiality matrix fixtures", () => {
  for (const fixture of fixtures.semantic_fixtures) {
    const result = semanticV5.evaluateSemanticFindingsV5({
      validationOutput: { semantic_checks: [fixture.finding] },
      decisionPlan: buildFixturePlan(fixture),
      groundedReportContent: buildFixtureReport(fixture),
    });
    assert.equal(
      result.findingDispositions[0]?.disposition,
      fixture.expected_disposition,
      fixture.fixture_id,
    );
    semanticFixturePasses += 1;
  }
  assert.equal(semanticFixturePasses, fixtures.counts.semantic_fixtures);
});

await check("temporal false-positive handling is path index and boundary aware", () => {
  const source = text(semanticV5Path);
  assert.ok(
    source.includes(
      "/^(?:\\$\\.)?decision_plan\\.change_conditions\\[(0|[1-9]\\d*)\\]\\.resulting_direction$/u",
    ),
  );
  assert.equal(source.includes("(?:\\.resulting_direction)?$/u"), false);
  assert.match(source, /policy:contact_constraint_policy/u);
  assert.match(source, /policy:aggregate_safety_result/u);
  assert.match(source, /buildChangeConditionCommentaryV3/u);
  assert.match(source, /accepted_temporal_false_positive/u);
  const futureDirection = fixtures.semantic_fixtures.find(
    (fixture) =>
      fixture.fixture_id === "future_resulting_direction_not_current_violation",
  );
  const parentPath = fixtures.semantic_fixtures.find(
    (fixture) =>
      fixture.fixture_id === "parent_change_condition_path_not_temporal_exception",
  );
  const futureCommentary = fixtures.semantic_fixtures.find(
    (fixture) =>
      fixture.fixture_id === "grounded_future_commentary_not_current_violation",
  );
  const noFollowup = fixtures.semantic_fixtures.find(
    (fixture) =>
      fixture.fixture_id === "no_followup_boundary_finding_remains_blocking",
  );
  const evaluate = (fixture) =>
    semanticV5.evaluateSemanticFindingsV5({
      validationOutput: { semantic_checks: [fixture.finding] },
      decisionPlan: buildFixturePlan(fixture),
      groundedReportContent: buildFixtureReport(fixture),
    });
  assert.equal(evaluate(futureDirection).ignoredTemporalFalsePositives.length, 1);
  assert.equal(evaluate(parentPath).blockingFindings.length, 1);
  assert.equal(evaluate(parentPath).ignoredTemporalFalsePositives.length, 0);
  assert.equal(evaluate(futureCommentary).ignoredTemporalFalsePositives.length, 1);
  const result = semanticV5.evaluateSemanticFindingsV5({
    validationOutput: { semantic_checks: [noFollowup.finding] },
    decisionPlan: buildFixturePlan(noFollowup),
    groundedReportContent: buildFixtureReport(noFollowup),
  });
  assert.equal(result.blockingFindings.length, 1);
  assert.equal(result.ignoredTemporalFalsePositives.length, 0);
});

await check("evaluator v2 proposition classification fixtures and exact paths", () => {
  let passed = 0;
  for (const fixture of fixtures.evaluator_fixtures) {
    const findings = evaluatorV2.findUnsupportedCertaintyAssertions(
      evidenceForEvaluatorFixture(fixture),
    );
    assert.equal(
      findings.length,
      fixture.expected_unsupported_certainty_findings,
      fixture.fixture_id,
    );
    if (fixture.expected_assertion_kind) {
      assert.equal(findings[0]?.assertion_kind, fixture.expected_assertion_kind);
    }
    if (fixture.expected_json_path) {
      assert.equal(findings[0]?.json_path, fixture.expected_json_path);
    }
    findings.forEach((finding) => {
      assert.match(finding.json_path, /^\$\.(?:decision_plan|report_content)\./u);
      assert.ok(finding.material_asserted_proposition.length > 0);
      assert.ok(finding.authority_absent_reason.length > 0);
    });
    passed += 1;
  }
  assert.equal(passed, fixtures.counts.evaluator_fixtures);
});

await check("explicitly denied certainty is nonfinding while clear guarantees block", () => {
  for (const value of [
    "相手は必ずしも返信するとは限りません。",
    "相手が確実に返信するとは言えません。",
    "返信が確実に来るとは断定できません。",
    "必ず返信があるとは分かりません。",
  ]) {
    assert.equal(evaluatorV2.classifyUnsupportedCertaintyProposition(value), null, value);
  }
  for (const [value, expectedKind] of [
    ["相手は必ず返信します。", "guaranteed_reply"],
    ["返信は確実に来ます。", "guaranteed_reply"],
    ["間違いなく復縁できます。", "guaranteed_relationship_outcome"],
    ["相手の本心は復縁したいのです。", "asserted_hidden_state"],
  ]) {
    assert.equal(
      evaluatorV2.classifyUnsupportedCertaintyProposition(value)?.assertion_kind,
      expectedKind,
      value,
    );
  }
  assert.equal(
    evaluatorV2.classifyUnsupportedCertaintyProposition(
      "相手は必ず返信しますが、復縁できるとは限りません。",
    )?.assertion_kind,
    "guaranteed_reply",
  );
});

await check("evaluator v2 removes recursive certainty matching and case-ID classification", () => {
  const source = text(evaluatorV2Path);
  assert.equal(
    evaluatorV2.DETERMINISTIC_EVALUATOR_V2_VERSION,
    "m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-evaluator-v2",
  );
  assert.match(source, /customerFacingAssertionEntries/u);
  assert.match(source, /superseded_context_free_certainty_scan/u);
  assert.doesNotMatch(source, /caseResult\.case_id\s*===/u);
  assert.doesNotMatch(source, /caseId\s*===/u);
  assert.doesNotMatch(source, /E-R3-[0-9]{2}/u);
  assert.doesNotMatch(source, /Object\.values\([^)]*\).*UNSUPPORTED_CERTAINTY/su);
});

await check("evaluator v2 preserves evaluator v1 integrity protocol and Product checks", () => {
  const source = text(evaluatorV2Path);
  assert.match(source, /evaluateCase as evaluateCaseV1/u);
  assert.match(source, /const legacy = evaluateCaseV1/u);
  assert.deepEqual(evaluatorV2.EVALUATOR_V2_SUPERSEDED_RULES, [
    "context_free_recursive_certainty_substring_matching",
    "code_only_or_current_policy_only_semantic_blocking",
  ]);
  assertUnchangedFromBaseline(
    "scripts/lib/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-evaluator-v1.mjs",
  );
});

let evaluatorSelfTests;
await check("evaluator v2 self-tests PASS at least 12/12", () => {
  const result = evaluatorV2.runEvaluatorV2SelfTests();
  evaluatorSelfTests = result;
  assert.ok(result.total >= 12);
  assert.equal(result.passed, result.total);
  result.results.forEach((item) => assert.equal(item.passed, true, item.name));
});

await check("required named fixtures 28/28 and total synthetic fixtures 28/28", () => {
  assert.equal(
    fixtures.task_id,
    "M2-P4-I3-R1-C1-R3-R2-E-R3-R3-R3-P5-R2",
  );
  const fixtureIds = new Set([
    ...fixtures.semantic_fixtures.map((fixture) => fixture.fixture_id),
    ...fixtures.evaluator_fixtures.map((fixture) => fixture.fixture_id),
  ]);
  const required = [
    "user_owned_schedule_confirmation_not_certainty",
    "guaranteed_reply_blocks",
    "minor_fact_fidelity_nonblocking",
    "major_fact_fidelity_blocking",
    "future_resulting_direction_not_current_violation",
    "parent_change_condition_path_not_temporal_exception",
    "grounded_future_commentary_not_current_violation",
    "current_direction_contradiction_blocks",
    "unsupported_causality_still_blocks",
    "template_genericity_minor_nonblocking",
    "material_final_draft_brand_drift_blocks",
    "exact_matched_path_recorded",
    "no_followup_boundary_finding_remains_blocking",
    "material_unsupported_certainty_blocks",
    "minor_unsupported_certainty_nonblocking",
    "review_timing_when_material_unsupported_certainty_blocks",
    "material_unknown_summary_material_unsupported_certainty_blocks",
    "model_generated_limitation_material_unsupported_certainty_blocks",
    "material_template_genericity_product_unusable_blocks",
    "material_repetition_product_unusable_blocks",
    "repetition_minor_default_nonblocking",
    "review_timing_trigger_fact_ids_not_customer_prose",
    "material_unknown_code_not_customer_prose",
    "material_unknown_material_to_not_customer_prose",
    "negated_b必ずしも_reply_not_blocked",
    "certainty_denied_by_tohaienai_not_blocked",
    "certainty_denied_by_danteidekinai_not_blocked",
    "certainty_denied_by_wakaranai_not_blocked",
  ];
  required.forEach((fixtureId) => assert.equal(fixtureIds.has(fixtureId), true));
  assert.equal(required.length, fixtures.counts.required_named_fixtures);
  assert.equal(fixtureIds.size, fixtures.counts.total_synthetic_fixtures);
  assert.equal(
    semanticFixturePasses + fixtures.evaluator_fixtures.length,
    fixtures.counts.total_synthetic_fixtures,
  );
  assert.equal(fixtures.counts.total_synthetic_fixtures, 28);
});

const frozenResultsPath =
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3/diagnostic-results-v1.json";
const frozenResults = json(frozenResultsPath);
const frozenContract = json(
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3/diagnostic-contract-v1.json",
);
const frozenQuality = json(
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3/quality-contract-v1.json",
);
const successorEvaluation = evaluatorV2.evaluateDiagnostic(
  frozenContract,
  frozenQuality,
  frozenResults,
  frozenResults.evidence_audit,
);

await check("Frozen E-R3 source manifest blobs marker and authorization unchanged", () => {
  const adjudication = json(
    "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r2/adjudication-contract-v1.json",
  );
  assert.equal(adjudication.evidence_commit_b, evidenceCommitB);
  assert.equal(adjudication.source_manifest.length, 10);
  assert.equal(gitSucceeds(["merge-base", "--is-ancestor", evidenceCommitB, "HEAD"]), true);
  for (const item of adjudication.source_manifest) {
    assert.equal(blobAt("HEAD", item.path), item.git_blob_sha, item.path);
    assert.equal(sha256Bytes(blobBytesAt("HEAD", item.path)), item.raw_sha256);
  }
  const markerPath = absolute(adjudication.marker.path);
  assert.equal(existsSync(markerPath), true);
  assert.equal(
    sha256Bytes(readFileSync(markerPath)),
    adjudication.marker.raw_sha256,
  );
  const authorization = json(
    "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3/authorization-v1.json",
  );
  assert.equal(authorization.consumed, true);
  assert.equal(authorization.rerun_authorized, false);
});

await check("Frozen E-R3 source remains unchanged and corrected successor outcomes match 6/6", () => {
  assert.equal(frozenResults.machine_verdict, "FAIL");
  assert.equal(successorEvaluation.verdict, "FAIL");
  assert.equal(successorEvaluation.cases.length, 6);
  for (const expected of fixtures.frozen_e_r3_fixtures) {
    const actual = successorEvaluation.cases.find(
      (item) => item.case_id === expected.case_id,
    );
    const frozen = frozenResults.cases.find(
      (item) => item.case_id === expected.case_id,
    );
    assert.ok(actual, expected.case_id);
    assert.ok(frozen, expected.case_id);
    assert.equal(actual.product_passed, expected.expected_successor_product_passed);
    assert.deepEqual(
      actual.root_blocking_findings.map((item) => item.finding_code),
      expected.expected_root_codes,
    );
    if (expected.expected_superseded_reason) {
      assert.ok(
        actual.superseded_legacy_findings.some(
          (item) => item.reason === expected.expected_superseded_reason,
        ),
        expected.case_id,
      );
    }
    if ("historical_final_result_present" in expected) {
      assert.equal(
        frozen.final_result !== null,
        expected.historical_final_result_present,
      );
    }
    if (expected.accepted_product_reconstructed === false) {
      assert.equal(actual.final_result_present, false);
    }
  }
});

await check("E-R3-01 accepted draft unchanged and user-owned certainty false positive removed", () => {
  const frozen = frozenResults.cases.find((item) => item.case_id === "E-R3-01");
  const actual = successorEvaluation.cases.find((item) => item.case_id === "E-R3-01");
  assert.equal(
    evaluatorV2.shaDiagnosticJson(
      frozen.final_result.report.decisionPlan.recommended_message_draft.text,
    ),
    "1689a6c72a3e11e7d6554963a77386b5c5dcd2db6be9837d218fc631841a9f64",
  );
  assert.equal(actual.root_blocking_findings.length, 0);
  assert.equal(actual.path_aware_certainty_findings.length, 0);
});

await check("E-R3-05 minor FACT_FIDELITY nonblocking with historical null retained", () => {
  const actual = successorEvaluation.cases.find((item) => item.case_id === "E-R3-05");
  const frozen = frozenResults.cases.find((item) => item.case_id === "E-R3-05");
  assert.equal(frozen.final_result, null);
  assert.equal(actual.final_result_present, false);
  assert.equal(actual.root_blocking_findings.length, 0);
  assert.ok(
    actual.flexible_findings.some(
      (item) => item.finding_code === "FACT_FIDELITY",
    ),
  );
  assert.equal(actual.derived_product_outcome_failures.length, 1);
});

await check("E-R3-06 parent-path ACTION_CONSISTENCY and causal defect both block", () => {
  const actual = successorEvaluation.cases.find((item) => item.case_id === "E-R3-06");
  const frozen = frozenResults.cases.find((item) => item.case_id === "E-R3-06");
  assert.equal(frozen.final_result, null);
  assert.equal(actual.final_result_present, false);
  assert.deepEqual(
    actual.root_blocking_findings.map((item) => item.finding_code),
    ["ASSUMPTION_AS_FACT", "ACTION_CONSISTENCY"],
  );
  assert.equal(
    actual.root_blocking_findings.find(
      (item) => item.finding_code === "ACTION_CONSISTENCY",
    )?.json_path,
    "decision_plan.change_conditions[2]",
  );
  assert.equal(actual.ignored_temporal_false_positives.length, 0);
  assert.equal(actual.derived_product_outcome_failures.length, 1);
});

await check("frozen successor aggregate remains fail-closed", () => {
  assert.equal(successorEvaluation.counts.cases_passed, 4);
  assert.equal(successorEvaluation.counts.root_blocking_findings, 2);
  assert.equal(successorEvaluation.counts.derived_product_outcome_failures, 2);
  assert.equal(successorEvaluation.counts.superseded_legacy_findings, 2);
  assert.equal(successorEvaluation.counts.path_aware_certainty_findings, 0);
  assert.equal(successorEvaluation.counts.ignored_temporal_false_positives, 0);
});

await check("v12 Catalog exact identity common prompt and PB-01 through PB-04 parity", () => {
  const v11 = json(
    "lib/assessment/runtime/contracts/runtime-stage-catalog-v11.json",
  );
  const v12 = json(catalogV12Path);
  assert.equal(v12.schema_version, "m2-p4-runtime-stage-catalog-v2");
  assert.equal(v12.catalog_version, "runtime-stage-catalog-v12.0.0");
  assert.equal(v12.prompt_bundle_version, "prompt-bundle-runtime-v12.0.0");
  assert.equal(v12.schema_set_version, "pipeline-schema-runtime-v5.0.0");
  assert.equal(v12.stage_topology_version, "split-base-candidate-v1");
  assert.equal(v12.baseline, catalogV12Baseline);
  assert.equal(v12.hash_algorithm, "sha256-utf8-lf");
  assert.deepEqual(v12.common_prompt, v11.common_prompt);
  assert.deepEqual(v12.stages.slice(0, 5), v11.stages.slice(0, 5));
});

await check("PB-06 actual Catalog and v12 loader SHA are strictly equal", () => {
  const actualFileSha = sha256Text(text(pb06V4Path));
  const catalogPromptSha = json(catalogV12Path).stages[6].prompt_sha256;
  const loaderPromptHash = evaluatorDispositionPb06LoaderHash();
  assert.equal(actualFileSha, correctedPb06V4Hash);
  assertStrictShaTriplet({ actualFileSha, catalogPromptSha, loaderPromptHash });
});

await check("synthetic mutation of each PB-06 SHA source is rejected", () => {
  const triplet = {
    actualFileSha: sha256Text(text(pb06V4Path)),
    catalogPromptSha: json(catalogV12Path).stages[6].prompt_sha256,
    loaderPromptHash: evaluatorDispositionPb06LoaderHash(),
  };
  const mutate = (value) => `${value.slice(0, -1)}${value.endsWith("0") ? "1" : "0"}`;
  for (const key of Object.keys(triplet)) {
    assert.throws(
      () => assertStrictShaTriplet({ ...triplet, [key]: mutate(triplet[key]) }),
      undefined,
      key,
    );
  }
  const loaderSource = text(schemaCatalogPath);
  assert.match(loaderSource, /stage\.prompt_sha256 !== successor\.promptHash/u);
  assert.match(loaderSource, /hashText\(stagePrompt\) !== stage\.prompt_sha256/u);
});

await check("Prompt Catalog loader evaluator Pipeline and Service unchanged from P5-R1", () => {
  for (const relativePath of [
    pb06V4Path,
    catalogV12Path,
    schemaCatalogPath,
    evaluatorV2Path,
    pipelinePath,
    "lib/assessment/runtime/service.ts",
  ]) {
    assertUnchangedFromBaseline(relativePath);
    assert.equal(
      normalizedText(text(relativePath)),
      normalizedText(textAt(baseline, relativePath)),
      relativePath,
    );
  }
});

await check("v12 PB-05 and PB-06 exact prompts with unchanged schemas", () => {
  const v11 = json(
    "lib/assessment/runtime/contracts/runtime-stage-catalog-v11.json",
  );
  const v12 = json(catalogV12Path);
  for (const [index, expectedPath, expectedHash, expectedName] of [
    [
      5,
      "lib/assessment/runtime/contracts/pb-05-directional-report-v4.developer.md",
      expectedHashes.pb05V4,
      "pb_05_directional_report_v4",
    ],
    [6, pb06V4Path, expectedHashes.pb06V4, "pb_06_materiality_validator_v4"],
  ]) {
    const stage = v12.stages[index];
    const predecessor = v11.stages[index];
    assert.equal(stage.prompt_version, "v4.0.0");
    assert.equal(stage.prompt_path, expectedPath);
    assert.equal(stage.prompt_sha256, expectedHash);
    assert.equal(stage.schema_name, expectedName);
    assert.equal(stage.schema_version, predecessor.schema_version);
    assert.equal(stage.schema_path, predecessor.schema_path);
    assert.equal(stage.schema_pointer, predecessor.schema_pointer);
    assert.equal(stage.schema_sha256, predecessor.schema_sha256);
  }
});

const schemaCatalog = await import(
  `${pathToFileURL(absolute(schemaCatalogPath)).href}?verify=${Date.now()}`
);
const [v11Loaded, v12Loaded] = await Promise.all([
  schemaCatalog.loadM2P4AuthorityIntegrityRuntimeStageCatalog(),
  schemaCatalog.loadM2P4EvaluatorDispositionRuntimeStageCatalog(),
]);

await check("v12 dedicated loader succeeds and compiles seven structured schemas", () => {
  assert.equal(v12Loaded.catalogVersion, "runtime-stage-catalog-v12.0.0");
  assert.equal(v12Loaded.promptBundleVersion, "prompt-bundle-runtime-v12.0.0");
  assert.equal(v12Loaded.schemaSetVersion, "pipeline-schema-runtime-v5.0.0");
  assert.equal(v12Loaded.stageTopologyVersion, "split-base-candidate-v1");
  assert.equal(v12Loaded.definitions.length, 7);
  assert.equal(v12Loaded.definitions[5].promptVersion, "v4.0.0");
  assert.equal(v12Loaded.definitions[6].promptVersion, "v4.0.0");
  v12Loaded.definitions.forEach((definition) => assert.ok(definition.outputSchema));
});

await check("v11 loader succeeds with PB-05 v3 and PB-06 v3 unchanged", () => {
  assert.equal(v11Loaded.catalogVersion, "runtime-stage-catalog-v11.0.0");
  assert.equal(v11Loaded.promptBundleVersion, "prompt-bundle-runtime-v11.0.0");
  assert.equal(v11Loaded.definitions.length, 7);
  assert.equal(v11Loaded.definitions[5].promptVersion, "v3.0.0");
  assert.equal(v11Loaded.definitions[6].promptVersion, "v3.0.0");
});

await check("Pipeline selects Grounding v4 and semantic v5 only for v12", () => {
  const source = text(pipelinePath);
  assert.match(
    source,
    /qualityEvaluationRuntime\s*=\s*\n?\s*runContext\.promptBundleVersion === "prompt-bundle-runtime-v12\.0\.0"/u,
  );
  assert.match(source, /qualityEvaluationRuntime\s*\?\s*groundSplitReportContentV4/su);
  assert.match(source, /qualityEvaluationRuntime\s*\?\s*evaluateSemanticFindingsV5/su);
  assert.match(source, /groundChangeConditionCommentaryV3/su);
  assert.match(source, /validateStageOutput\(\s*this\.definition\("PB-05"\)/su);
});

await check("Pipeline preserves v11 Grounding v3 semantic v4 and authority behavior", () => {
  const source = text(pipelinePath);
  assert.match(source, /prompt-bundle-runtime-v11\.0\.0/u);
  assert.match(source, /groundReportContentV3/u);
  assert.match(source, /evaluateSemanticFindingsV4/u);
  assert.match(source, /groundCandidateAnalysisV2/u);
  assert.match(source, /groundBaseStructuredIntakeV3/u);
  assert.match(source, /createActionContextV1/u);
  assert.match(source, /createContactConstraintPolicyV1/u);
});

await check("service remains unchanged Active Runtime v4 and v12 inactive", () => {
  assertUnchangedFromBaseline("lib/assessment/runtime/service.ts");
  const serviceSource = text("lib/assessment/runtime/service.ts");
  const activeCatalog = json(
    "lib/assessment/runtime/contracts/runtime-stage-catalog-v4.json",
  );
  assert.match(serviceSource, /loadM2P4ProductQualityRuntimeStageCatalog/u);
  assert.doesNotMatch(serviceSource, /loadM2P4EvaluatorDispositionRuntimeStageCatalog/u);
  assert.doesNotMatch(serviceSource, /runtime-stage-catalog-v12/u);
  assert.equal(activeCatalog.catalog_version, "runtime-stage-catalog-v4.0.0");
});

await check("remediation contract exact blocking matrix and temporal boundaries", () => {
  const contract = json(contractPath);
  assert.equal(
    contract.task_id,
    "M2-P4-I3-R1-C1-R3-R2-E-R3-R3-R3-P5-R2",
  );
  assert.equal(
    contract.status,
    "product_outcome_disposition_gaps_corrected_pending_final_human_chatgpt_package_d_review",
  );
  assert.equal(contract.baseline, baseline);
  assert.equal(contract.exact_scope, "7/7_updated_only");
  assert.equal(contract.blocking_matrix.FACT_FIDELITY.minor, "nonblocking");
  assert.equal(contract.blocking_matrix.FACT_FIDELITY.major, "blocking");
  assert.equal(contract.blocking_matrix.UNSUPPORTED_CERTAINTY.minor, "nonblocking");
  assert.equal(
    contract.blocking_matrix.UNSUPPORTED_CERTAINTY.major_material_customer_assertion,
    "blocking",
  );
  assert.equal(contract.blocking_matrix.TEMPLATE_GENERICITY.default, "nonblocking");
  assert.equal(contract.blocking_matrix.REPETITION.default, "nonblocking");
  assert.equal(
    contract.blocking_matrix.TEMPLATE_GENERICITY
      .major_or_critical_materially_unusable_product_outcome,
    "blocking",
  );
  assert.equal(
    contract.blocking_matrix.REPETITION
      .major_or_critical_materially_unusable_product_outcome,
    "blocking",
  );
  assert.equal(
    contract.blocking_matrix.current_action_contradiction.material,
    "blocking",
  );
  assert.equal(contract.certainty_proposition_contract.case_id_classification, false);
  assert.equal(
    contract.certainty_proposition_contract.explicit_denial_must_govern_matched_proposition,
    true,
  );
  assert.equal(
    contract.certainty_proposition_contract.global_certainty_substring_waiver,
    false,
  );
  assert.equal(
    contract.temporal_contract.parent_change_condition_path_is_temporal_exception,
    false,
  );
  assert.equal(
    contract.finding_detail_contract.product_editorial
      .absent_authority_required_when_irrelevant,
    false,
  );
  assert.deepEqual(
    contract.product_outcome_path_contract.customer_readable_source_paths_added,
    [
      "decision_plan.review_timing.when",
      "decision_plan.material_unknowns[i].summary",
      "decision_plan.model_generated_limitations[i]",
    ],
  );
  assert.deepEqual(
    contract.product_outcome_path_contract.excluded_internal_metadata_paths,
    [
      "decision_plan.review_timing.trigger_fact_ids",
      "decision_plan.material_unknowns[i].unknown_code",
      "decision_plan.material_unknowns[i].material_to",
    ],
  );
  assert.equal(
    contract.product_outcome_path_contract.natural_language_detail_keyword_matching,
    false,
  );
  assert.equal(
    contract.product_outcome_path_contract.ordinary_style_differences_blocking,
    false,
  );
  assert.equal(
    contract.product_outcome_path_contract.brand_tone_behavior_changed,
    false,
  );
  assert.deepEqual(contract.fixture_counts, {
    required_named_fixtures: 28,
    semantic_fixtures: 21,
    evaluator_fixtures: 7,
    total_synthetic_fixtures: 28,
    frozen_e_r3_cases: 6,
    evaluator_self_tests_minimum: 12,
  });
  assert.equal(contract.runtime_boundary.v12_runtime_active, false);
  assert.equal(contract.runtime_boundary.pb06_prompt_catalog_loader_sha_strictly_equal, true);
});

await check("capabilities exact pending-review status and fail-closed authority", () => {
  const capabilities = json(capabilitiesPath);
  assert.equal(
    capabilities.task_id,
    "M2-P4-I3-R1-C1-R3-R2-E-R3-R3-R3-P5-R2",
  );
  assert.equal(
    capabilities.status,
    "product_outcome_disposition_gaps_corrected_pending_final_human_chatgpt_package_d_review",
  );
  assert.equal(capabilities.baseline, baseline);
  assert.equal(capabilities.exact_scope, "7/7_updated");
  for (const key of [
    "package_d_architecture_accepted",
    "p5_r1_precision_correction_accepted",
    "package_d_final_acceptance_withheld",
    "v12_integration_accepted_unchanged",
    "package_c_accepted",
    "pb06_v4_complete",
    "semantic_disposition_v5_complete",
    "deterministic_evaluator_v2_complete",
    "inactive_v12_catalog_complete",
    "v12_pipeline_wiring_complete",
    "v11_behavior_preserved",
    "user_owned_certainty_false_positive_corrected",
    "minor_fact_fidelity_overblocking_corrected",
    "future_reassessment_false_positive_corrected",
    "temporal_exception_narrowed",
    "future_parent_path_not_ignored",
    "negated_certainty_false_positive_corrected",
    "clear_external_guarantees_still_blocking",
    "pb06_finding_detail_contract_corrected",
    "pb06_catalog_loader_sha_synchronized",
    "genuine_causal_defect_still_blocking",
    "review_timing_when_customer_path_covered",
    "material_unknown_summary_customer_path_covered",
    "model_generated_limitation_customer_path_covered",
    "internal_ids_and_metadata_excluded_from_customer_prose",
    "materially_unusable_template_genericity_blocking",
    "materially_unusable_repetition_blocking",
    "ordinary_style_nonblocking_preserved",
    "brand_tone_behavior_unchanged",
  ]) {
    assert.equal(capabilities[key], true, key);
  }
  for (const key of [
    "v12_runtime_active",
    "provider_quality_established",
    "package_e_authorized",
    "package_f_authorized",
    "provider_rerun_authorized",
    "active_runtime_activated",
    "r4_authorized",
    "c2_authorized",
    "final_jpy980_readiness_established",
    "final_human_chatgpt_package_d_review_complete",
  ]) {
    assert.equal(capabilities[key], false, key);
  }
});

await check("offline results exact fixtures regression and no Provider-quality claim", () => {
  const results = json(offlineResultsPath);
  assert.equal(results.status, "PASS");
  assert.equal(
    results.task_id,
    "M2-P4-I3-R1-C1-R3-R2-E-R3-R3-R3-P5-R2",
  );
  assert.equal(results.baseline, baseline);
  assert.equal(results.exact_scope, "7/7_updated");
  assert.equal(results.pb06_v4.sha256_utf8_lf, expectedHashes.pb06V4);
  assert.equal(results.fixture_results.required_named_fixtures, "28/28 PASS");
  assert.equal(
    results.fixture_results.synthetic_semantic_and_evaluator_fixtures,
    "28/28 PASS",
  );
  assert.equal(results.fixture_results.frozen_e_r3_cases, "6/6 PASS");
  assert.equal(results.frozen_e_r3_successor_adjudication.successor_machine_verdict, "FAIL");
  assert.equal(results.frozen_e_r3_successor_adjudication.successor_cases_passed, "4/6");
  assert.equal(results.frozen_e_r3_successor_adjudication.root_blocking_findings, 2);
  assert.equal(results.frozen_e_r3_successor_adjudication.superseded_legacy_findings, 2);
  assert.equal(
    results.frozen_e_r3_successor_adjudication.ignored_temporal_false_positives,
    0,
  );
  assert.deepEqual(
    results.frozen_e_r3_successor_adjudication.e_r3_06_root_codes,
    ["ASSUMPTION_AS_FACT", "ACTION_CONSISTENCY"],
  );
  assert.equal(results.regression.active_runtime, "v4");
  assert.equal(results.regression.active_runtime_activated, false);
  assert.equal(results.deterministic_evaluator_v2.case_id_classification, false);
  assert.equal(results.deterministic_evaluator_v2.self_tests, "12/12 PASS");
  assert.equal(results.runtime_catalog_v12.pb06_catalog_loader_sha_three_way_equal, true);
  assert.equal(results.runtime_catalog_v12.baseline_delta, "UNCHANGED from P5-R1 baseline");
  assert.equal(results.regression.runtime_stage_catalog_v12, "UNCHANGED");
  assert.equal(results.regression.schema_catalog_ts, "UNCHANGED");
  assert.equal(results.regression.pipeline_ts, "UNCHANGED");
  assert.equal(results.authority.final_jpy980_readiness_established, false);
});

await check("review document records technical and plain-language authority limits", () => {
  const source = text(reviewPath);
  assert.match(source, /P5-R2 Review/u);
  assert.match(source, /## Technical result/u);
  assert.match(source, /## Plain-language summary/u);
  assert.match(source, /P5-R1 precision correction is accepted/u);
  assert.match(source, /decision_plan\.review_timing\.when/u);
  assert.match(source, /decision_plan\.material_unknowns\[i\]\.summary/u);
  assert.match(source, /decision_plan\.model_generated_limitations\[i\]/u);
  assert.match(source, /28\/28 PASS/u);
  assert.match(source, /Frozen Evidence Commit B remains read-only/u);
  assert.match(source, /original machine verdict remains `FAIL`/u);
  assert.match(source, /Provider \/ DB \/ Supabase は 0 \/ 0 \/ 0/u);
  assert.match(source, /final Package D acceptance and JPY980 readiness are not established/u);
  assert.match(source, /Provider rerun, Active Runtime activation/u);
});

await check("no Provider network DB Supabase runner retry repair or fallback execution", () => {
  const contract = json(contractPath);
  const fixturesData = json(fixturesPath);
  const results = json(offlineResultsPath);
  const capabilities = json(capabilitiesPath);
  for (const value of [contract.operations, fixturesData.operations, results.operations]) {
    assert.equal(value.provider_calls, 0);
    assert.equal(value.db_operations, 0);
    assert.equal(value.supabase_operations, 0);
  }
  assert.equal(capabilities.provider_calls, 0);
  assert.equal(capabilities.db_operations, 0);
  assert.equal(capabilities.supabase_operations, 0);
  for (const relativePath of [semanticV5Path, evaluatorV2Path]) {
    const source = text(relativePath);
    assert.doesNotMatch(source, /from ["'](?:openai|@supabase\/|node:https)/u);
    assert.doesNotMatch(source, /\bfetch\s*\(/u);
  }
});

await check("Package E F Provider rerun R4 C2 PR and main merge remain unauthorized", () => {
  const contract = json(contractPath);
  const capabilities = json(capabilitiesPath);
  assert.equal(contract.authority.package_e_authorized, false);
  assert.equal(contract.authority.package_f_authorized, false);
  assert.equal(contract.authority.provider_rerun_authorized, false);
  assert.equal(contract.authority.r4_authorized, false);
  assert.equal(contract.authority.c2_authorized, false);
  assert.equal(contract.authority.pull_request_authorized, false);
  assert.equal(contract.authority.main_merge_authorized, false);
  assert.equal(capabilities.pull_request_created, false);
  assert.equal(capabilities.main_merged, false);
  assert.equal(capabilities.force_push_used, false);
  assert.equal(git(["rev-parse", "main"]), expectedMain);
  assert.equal(git(["rev-parse", "origin/main"]), expectedMain);
});

await check("git diff --check PASS", () => {
  assert.equal(git(["diff", "--check"]), "");
});

const failed = checks.filter((item) => !item.passed);
if (failed.length > 0) {
  console.error(`\nEvaluator disposition verifier: FAIL ${checks.length - failed.length}/${checks.length}`);
  process.exitCode = 1;
} else {
  console.log(`\nEvaluator disposition verifier: PASS ${checks.length}/${checks.length}`);
  console.log("Exact P5-R2 correction scope: 7/7 updated only");
  console.log(`Semantic fixtures: ${semanticFixturePasses}/${fixtures.counts.semantic_fixtures}`);
  console.log("Required named fixtures: 28/28; total synthetic fixtures: 28/28");
  console.log(
    `Evaluator v2 self-tests: ${evaluatorSelfTests.passed}/${evaluatorSelfTests.total}`,
  );
  console.log("PB-06 actual / Catalog / loader SHA: strict three-way equality");
  console.log("Frozen E-R3 successor expectations: 6/6; verdict remains FAIL");
  console.log("v11 / v12 loaders: PASS / PASS");
  console.log("Provider / DB / Supabase: 0 / 0 / 0");
  console.log("Active Runtime: v4; v12 inactive");
}
