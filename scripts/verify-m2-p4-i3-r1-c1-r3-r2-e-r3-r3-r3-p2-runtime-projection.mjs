import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync, spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const baseline = "db47145cd8ed04e9516861c20cdafbd198205cc5";
const baselineParent = "7810861cec9036d5a131dcdf810e6b5e0e74cac5";
const taskId = "M2-P4-I3-R1-C1-R3-R2-E-R3-R3-R3-P2-R1";
const expectedBranch =
  "fix/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p2-r1-schema-parity";
const expectedMain = "61e33a10e195fad17e253a6b9719217e1992f273";
const p1ContractPath =
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p1/source-contract-v1.json";
const fixturePath =
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p2/projection-fixtures-v1.json";
const projectionContractPath =
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p2/projection-contract-v1.json";
const offlineResultPath =
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p2/offline-results-v1.json";
const capabilitiesPath =
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p2/capabilities-v1.json";
const frozenDiagnosticPath =
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3/diagnostic-results-v1.json";
const splitDecisionPlanSchemaPath =
  "lib/assessment/runtime/contracts/decision-plan-v2.schema.json";
const legacyDecisionPlanSchemaPath = "ai/schemas/decision-plan.schema.json";

const packageAScope = [
  "lib/assessment/runtime/types.ts",
  "lib/assessment/runtime/supabase-repository.ts",
  "app/api/internal/assessments/route.ts",
  "components/runtime/RuntimeAssessmentForm.tsx",
  "lib/assessment/runtime/runtime-result-normalization-v1.ts",
  "lib/assessment/runtime/customer-assessment-projection-v1.ts",
  "lib/assessment/runtime/customer-assessment-delivery-v1.ts",
  "components/runtime/RuntimeAssessmentProjectionPreview.tsx",
  projectionContractPath,
  fixturePath,
  offlineResultPath,
  capabilitiesPath,
  "scripts/verify-m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p2-runtime-projection.mjs",
  "docs/phase2/TASK_M2_P4_I3_R1_C1_R3_R2_E_R3_R3_R3_P2_REVIEW.md",
];
const exactScope = [
  "lib/assessment/runtime/runtime-result-normalization-v1.ts",
  projectionContractPath,
  fixturePath,
  offlineResultPath,
  capabilitiesPath,
  "scripts/verify-m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p2-runtime-projection.mjs",
  "docs/phase2/TASK_M2_P4_I3_R1_C1_R3_R2_E_R3_R3_R3_P2_REVIEW.md",
];
const packageAUpdatedPaths = packageAScope.slice(0, 4);
const sourcePaths = packageAScope.filter((candidate) =>
  /\.(?:ts|tsx|mjs)$/u.test(candidate),
);
const implementationPaths = sourcePaths.filter((candidate) =>
  /^(?:app|components|lib)\//u.test(candidate),
);
const jsonPaths = exactScope.filter((candidate) => candidate.endsWith(".json"));

function git(args, options = {}) {
  return execFileSync(
    "git.exe",
    ["-c", "safe.directory=C:/projects/moon-reply", ...args],
    { cwd: root, encoding: "utf8", ...options },
  ).trim();
}

function gitBuffer(args) {
  return execFileSync(
    "git.exe",
    ["-c", "safe.directory=C:/projects/moon-reply", ...args],
    { cwd: root, maxBuffer: 16 * 1024 * 1024 },
  );
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

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function sorted(values) {
  return [...values].sort((left, right) => left.localeCompare(right));
}

function clone(value) {
  return structuredClone(value);
}

function pointerSegments(pointer) {
  assert.match(pointer, /^\/(?:[^/]+(?:\/[^/]+)*)?$/u);
  return pointer
    .slice(1)
    .split("/")
    .filter(Boolean)
    .map((segment) => segment.replace(/~1/gu, "/").replace(/~0/gu, "~"));
}

function applyPatches(value, patches) {
  const target = clone(value);
  for (const patchRecord of patches) {
    const segments = pointerSegments(patchRecord.path);
    assert.ok(segments.length > 0);
    let parent = target;
    for (const segment of segments.slice(0, -1)) {
      assert.equal(typeof parent, "object");
      assert.notEqual(parent, null);
      parent = parent[segment];
    }
    const key = segments.at(-1);
    assert.equal(typeof parent, "object");
    assert.notEqual(parent, null);
    if (patchRecord.op === "remove") {
      assert.ok(Object.prototype.hasOwnProperty.call(parent, key));
      delete parent[key];
    } else if (patchRecord.op === "replace") {
      assert.ok(Object.prototype.hasOwnProperty.call(parent, key));
      parent[key] = clone(patchRecord.value);
    } else if (patchRecord.op === "add") {
      assert.ok(!Object.prototype.hasOwnProperty.call(parent, key));
      parent[key] = clone(patchRecord.value);
    } else {
      assert.fail(`Unsupported fixture patch operation: ${patchRecord.op}`);
    }
  }
  return target;
}

function deepFreeze(value) {
  if (typeof value !== "object" || value === null || Object.isFrozen(value)) {
    return value;
  }
  for (const child of Object.values(value)) deepFreeze(child);
  return Object.freeze(value);
}

function containsForbiddenProjectionKey(value) {
  if (Array.isArray(value)) return value.some(containsForbiddenProjectionKey);
  if (typeof value !== "object" || value === null) return false;
  const forbidden = new Set([
    "caseId",
    "case_id",
    "fixtureId",
    "fixture_id",
    "requestId",
    "request_id",
    "runId",
    "run_id",
    "providerResponseId",
    "provider_response_id",
    "usage",
    "factId",
    "fact_id",
    "factIds",
    "fact_ids",
    "decisionReasonFactIds",
    "decision_reason_fact_ids",
    "supportingFactIds",
    "supporting_fact_ids",
    "triggerFactIds",
    "trigger_fact_ids",
    "diagnosticVerdict",
    "diagnostic_verdict",
    "machineVerdict",
    "machine_verdict",
    "decisionLabel",
  ]);
  return Object.entries(value).some(
    ([key, child]) => forbidden.has(key) || containsForbiddenProjectionKey(child),
  );
}

const checks = [];
function check(name, action) {
  try {
    action();
    checks.push({ name, passed: true });
    console.log(`PASS ${name}`);
  } catch (error) {
    checks.push({ name, passed: false, error });
    console.error(`FAIL ${name}`);
    console.error(error instanceof Error ? error.message : String(error));
  }
}

const fixtures = readJson(fixturePath);
const projectionContract = readJson(projectionContractPath);
const offlineResults = readJson(offlineResultPath);
const capabilities = readJson(capabilitiesPath);
const p1Contract = readJson(p1ContractPath);
const frozenDiagnostic = readJson(frozenDiagnosticPath);
const splitDecisionPlanSchema = readJson(splitDecisionPlanSchemaPath);
const legacyDecisionPlanSchema = readJson(legacyDecisionPlanSchemaPath);

const normalizationUrl = pathToFileURL(
  path.join(root, "lib/assessment/runtime/runtime-result-normalization-v1.ts"),
).href;
const projectionUrl = pathToFileURL(
  path.join(root, "lib/assessment/runtime/customer-assessment-projection-v1.ts"),
).href;
const deliveryUrl = pathToFileURL(
  path.join(root, "lib/assessment/runtime/customer-assessment-delivery-v1.ts"),
).href;
const normalization = await import(normalizationUrl);
const projection = await import(projectionUrl);
const delivery = await import(deliveryUrl);

function instantiate(record) {
  const template = fixtures.result_templates[record.base_result];
  assert.ok(template, `Unknown base fixture: ${record.base_result}`);
  return applyPatches(template, record.result_patches ?? []);
}

function factIds(count) {
  assert.ok(Number.isInteger(count) && count >= 0 && count <= 1000);
  return Array.from(
    { length: count },
    (_, index) => `F${String(index).padStart(3, "0")}`,
  );
}

const optionalSplitFactIdLocations = [
  {
    name: "possible_interpretations[*].supporting_fact_ids",
    set(plan, value) {
      plan.possible_interpretations[0].supporting_fact_ids = value;
    },
  },
  {
    name: "pre_action_check.supporting_fact_ids",
    set(plan, value) {
      plan.pre_action_check.supporting_fact_ids = value;
    },
  },
  {
    name: "aftercare_plan[*].supporting_fact_ids",
    set(plan, value) {
      plan.aftercare_plan[0].supporting_fact_ids = value;
    },
  },
  {
    name: "change_conditions[*].supporting_fact_ids",
    set(plan, value) {
      plan.change_conditions[0].supporting_fact_ids = value;
    },
  },
  {
    name: "review_timing.trigger_fact_ids",
    set(plan, value) {
      plan.review_timing.trigger_fact_ids = value;
    },
  },
];

const emptyOptionalFixtureIds = [
  "split_possible_interpretation_empty_supporting_fact_ids",
  "split_pre_action_check_empty_supporting_fact_ids",
  "split_aftercare_plan_empty_supporting_fact_ids",
  "split_change_condition_empty_supporting_fact_ids",
  "split_review_timing_empty_trigger_fact_ids",
  "split_all_optional_fact_id_arrays_empty",
];
const originalInvalidFixtureIds = [
  "unknown_report_schema",
  "mixed_legacy_split_result",
  "ready_without_report",
  "non_ready_with_report",
  "malformed_decision_card",
  "malformed_nullable_field",
  "missing_required_nested_field",
  "reply_now_without_policy_valid_draft",
];
const splitFactIdNegativeFixtureIds = [
  "split_empty_decision_reason_fact_ids",
  "split_decision_reason_fact_ids_length_61",
  "split_optional_fact_ids_length_61",
  "split_duplicate_fact_ids",
  "split_malformed_fact_id",
];

check("exact R1 baseline branch and parent authority", () => {
  const head = git(["rev-parse", "HEAD"]);
  const branch = git(["branch", "--show-current"]);
  const baselineActualParent = git(["rev-parse", `${baseline}^`]);
  assert.equal(branch, expectedBranch);
  assert.equal(baselineActualParent, baselineParent);
  assert.equal(git(["merge-base", head, baseline]), baseline);
  if (head !== baseline) assert.equal(git(["rev-parse", `${head}^`]), baseline);
});

check("main and origin/main unchanged", () => {
  assert.equal(git(["rev-parse", "main"]), expectedMain);
  assert.equal(git(["rev-parse", "origin/main"]), expectedMain);
});

check("exact correction scope 7/7", () => {
  const trackedDiff = git(["diff", "--name-only", baseline, "--"])
    .split(/\r?\n/u)
    .filter(Boolean)
    .map((candidate) => candidate.replaceAll("\\", "/"));
  const untracked = git(["ls-files", "--others", "--exclude-standard"])
    .split(/\r?\n/u)
    .filter(Boolean)
    .map((candidate) => candidate.replaceAll("\\", "/"));
  assert.deepEqual(sorted(new Set([...trackedDiff, ...untracked])), sorted(exactScope));
  assert.equal(exactScope.length, 7);
  exactScope.forEach((candidate) =>
    assert.equal(gitObjectExists(`${baseline}:${candidate}`), true),
  );
});

check("original Package A exact 14/14 and non-correction paths unchanged", () => {
  const packageACommitPaths = git([
    "diff-tree",
    "--no-commit-id",
    "--name-only",
    "-r",
    baseline,
  ])
    .split(/\r?\n/u)
    .filter(Boolean)
    .map((candidate) => candidate.replaceAll("\\", "/"));
  assert.equal(packageAScope.length, 14);
  assert.deepEqual(sorted(packageACommitPaths), sorted(packageAScope));
  assert.deepEqual(
    sorted(exactScope.filter((candidate) => packageAScope.includes(candidate))),
    sorted(exactScope),
  );
  for (const candidate of packageAScope.filter(
    (packageAPath) => !exactScope.includes(packageAPath),
  )) {
    assert.equal(
      git(["hash-object", candidate]),
      git(["rev-parse", `${baseline}:${candidate}`]),
      candidate,
    );
  }
  for (const candidate of [splitDecisionPlanSchemaPath, legacyDecisionPlanSchemaPath]) {
    assert.equal(
      git(["hash-object", candidate]),
      git(["rev-parse", `${baseline}:${candidate}`]),
      candidate,
    );
  }
});

check("strict UTF-8 JSON validity U+FFFD zero and secret zero", () => {
  let replacementCount = 0;
  let secretCount = 0;
  const secretPatterns = [
    /sk-[A-Za-z0-9_-]{20,}/gu,
    /(?:OPENAI_API_KEY|SUPABASE_SERVICE_ROLE_KEY)\s*[=:]\s*["'][^"']{8,}["']/gu,
    /eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/gu,
  ];
  for (const candidate of exactScope) {
    const text = readText(candidate);
    replacementCount += [...text].filter(
      (character) => character.codePointAt(0) === 0xfffd,
    ).length;
    for (const pattern of secretPatterns) secretCount += [...text.matchAll(pattern)].length;
    assert.ok(!/[\t ]+$/gmu.test(text), `${candidate} has trailing whitespace`);
  }
  jsonPaths.forEach((candidate) => JSON.parse(readText(candidate)));
  assert.equal(replacementCount, 0);
  assert.equal(secretCount, 0);
});

check("P1 authority hashes marker and frozen evidence independently preserved", () => {
  assert.equal(p1Contract.authority_manifest_count, 44);
  assert.equal(p1Contract.authority_manifest.length, 44);
  for (const authority of p1Contract.authority_manifest) {
    const revisionPath = `${baselineParent}:${authority.path}`;
    assert.equal(gitObjectExists(revisionPath), true, authority.path);
    assert.equal(git(["rev-parse", revisionPath]), authority.git_blob_sha, authority.path);
    const blobBytes = gitBuffer(["show", revisionPath]);
    assert.equal(
      git(["hash-object", "--stdin"], { input: blobBytes }),
      authority.git_blob_sha,
      authority.path,
    );
    if (!packageAUpdatedPaths.includes(authority.path)) {
      const workingBytes = read(authority.path);
      assert.equal(workingBytes.length, authority.bytes, authority.path);
      assert.equal(sha256(workingBytes), authority.raw_sha256, authority.path);
    } else {
      assert.match(authority.raw_sha256, /^[0-9a-f]{64}$/u, authority.path);
      assert.ok(Number.isInteger(authority.bytes) && authority.bytes > 0, authority.path);
    }
  }
  assert.equal(
    gitObjectExists(`${baselineParent}:evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3/product-owner-review-decision-v1.json`),
    true,
  );
  assert.equal(
    gitObjectExists(`${baselineParent}:evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3/v12-remediation-charter-v1.json`),
    true,
  );
  git(["merge-base", "--is-ancestor", p1Contract.evidence_commit_b, baselineParent]);
  const marker = readFileSync(
    path.join(root, ".git", path.basename(p1Contract.frozen_state.marker_path)),
  );
  assert.equal(sha256(marker), p1Contract.frozen_state.marker_raw_sha256);
  assert.equal(p1Contract.frozen_state.authorization_consumed, true);
  assert.equal(p1Contract.frozen_state.rerun_authorized, false);
});

check("active Runtime remains v4 and protected sources unchanged", () => {
  const servicePath = "lib/assessment/runtime/service.ts";
  const notePath = "components/runtime/RuntimeAssessmentNote.tsx";
  assert.equal(git(["hash-object", servicePath]), git(["rev-parse", `${baseline}:${servicePath}`]));
  assert.equal(git(["hash-object", notePath]), git(["rev-parse", `${baseline}:${notePath}`]));
  assert.match(readText(servicePath), /loadM2P4ProductQualityRuntimeStageCatalog/u);
  assert.match(
    readText("lib/assessment/runtime/schema-catalog.ts"),
    /runtime-stage-catalog-v4\.0\.0/u,
  );
});

check("no Prompt Catalog Schema Pipeline Provider or case-ID coupling", () => {
  const changedProtected = exactScope.filter((candidate) =>
    /(?:prompt|catalog|schema|pipeline)/iu.test(candidate),
  );
  assert.deepEqual(changedProtected, []);
  const projectionSource = readText(
    "lib/assessment/runtime/customer-assessment-projection-v1.ts",
  );
  const importLines = projectionSource
    .split(/\r?\n/u)
    .filter((line) => /^import\s/u.test(line));
  assert.equal(
    importLines.some((line) => /openai|provider|transport|schema-catalog|pipeline/iu.test(line)),
    false,
  );
  const implementationSource = implementationPaths.map(readText).join("\n");
  assert.doesNotMatch(implementationSource, /\b(?:caseId|fixtureId)\b|E-R3-[0-9]+/u);
});

check("unsafe ready narrowing and unchecked wire or persisted casts removed", () => {
  const formSource = readText("components/runtime/RuntimeAssessmentForm.tsx");
  const repositorySource = readText("lib/assessment/runtime/supabase-repository.ts");
  assert.doesNotMatch(formSource, /function\s+isCompleted|as\s+AssessmentExecutionResult/u);
  assert.doesNotMatch(formSource, /payload\.data\s+as\s+/u);
  assert.match(formSource, /decodeCustomerAssessmentApiResponseV1\(payload\)/u);
  assert.doesNotMatch(repositorySource, /report\.report_json\s+as\s+/u);
  assert.doesNotMatch(repositorySource, /report\.decision_card_json\s+as\s+/u);
  assert.match(
    repositorySource,
    /hydratePersistedReadyAssessmentV1\(\{[\s\S]*reportJson:\s*report\.report_json,[\s\S]*decisionCardJson:\s*report\.decision_card_json/u,
  );
  assert.match(repositorySource, /authoritativeRequestedTopics:\s*persistedRequest\.requestedTopics/u);
});

check("split required versus optional fact-ID schema and decoder parity", () => {
  const splitDefinitions = splitDecisionPlanSchema.$defs;
  assert.deepEqual(splitDefinitions.required_fact_ids, {
    type: "array",
    items: { $ref: "#/$defs/fact_id" },
    minItems: 1,
    maxItems: 60,
    uniqueItems: true,
  });
  assert.deepEqual(splitDefinitions.fact_ids, {
    type: "array",
    items: { $ref: "#/$defs/fact_id" },
    maxItems: 60,
    uniqueItems: true,
  });
  assert.equal(splitDefinitions.fact_id.pattern, "^F[0-9]{3}$");
  assert.equal(
    splitDecisionPlanSchema.properties.decision_reason_fact_ids.$ref,
    "#/$defs/required_fact_ids",
  );
  assert.equal(
    splitDefinitions.possible_interpretation.properties.supporting_fact_ids.$ref,
    "#/$defs/fact_ids",
  );
  assert.equal(
    splitDefinitions.pre_action_check.properties.supporting_fact_ids.$ref,
    "#/$defs/fact_ids",
  );
  assert.equal(
    splitDefinitions.aftercare_item.properties.supporting_fact_ids.$ref,
    "#/$defs/fact_ids",
  );
  assert.equal(
    splitDefinitions.change_condition.properties.supporting_fact_ids.$ref,
    "#/$defs/fact_ids",
  );
  assert.equal(
    splitDefinitions.review_timing.properties.trigger_fact_ids.$ref,
    "#/$defs/fact_ids",
  );

  const normalizationSource = readText(
    "lib/assessment/runtime/runtime-result-normalization-v1.ts",
  );
  assert.match(normalizationSource, /function assertLegacyFactIds\(/u);
  assert.match(normalizationSource, /function assertSplitRequiredFactIds\(/u);
  assert.match(normalizationSource, /function assertSplitOptionalFactIds\(/u);
  assert.doesNotMatch(normalizationSource, /function assertFactIds\(/u);

  for (const count of [1, 60]) {
    const result = clone(fixtures.result_templates.split_ready_base);
    result.report.decisionPlan.decision_reason_fact_ids = factIds(count);
    normalization.decodeAssessmentExecutionResult(result);
  }
  for (const count of [0, 61]) {
    const result = clone(fixtures.result_templates.split_ready_base);
    result.report.decisionPlan.decision_reason_fact_ids = factIds(count);
    assert.throws(() => normalization.decodeAssessmentExecutionResult(result));
  }
  for (const invalidIds of [["F001", "F001"], ["F01A"]]) {
    const result = clone(fixtures.result_templates.split_ready_base);
    result.report.decisionPlan.decision_reason_fact_ids = invalidIds;
    assert.throws(() => normalization.decodeAssessmentExecutionResult(result));
  }

  for (const location of optionalSplitFactIdLocations) {
    for (const count of [0, 1, 60]) {
      const result = clone(fixtures.result_templates.split_ready_base);
      location.set(result.report.decisionPlan, factIds(count));
      normalization.decodeAssessmentExecutionResult(result);
    }
    for (const invalidIds of [factIds(61), ["F001", "F001"], ["F01A"]]) {
      const result = clone(fixtures.result_templates.split_ready_base);
      location.set(result.report.decisionPlan, invalidIds);
      assert.throws(
        () => normalization.decodeAssessmentExecutionResult(result),
        undefined,
        location.name,
      );
    }
  }
});

check("legacy fact-ID behavior remains minimum one without split maximum", () => {
  const legacyFactIds = legacyDecisionPlanSchema.$defs.fact_ids;
  assert.equal(legacyFactIds.minItems, 1);
  assert.equal(legacyFactIds.uniqueItems, true);
  assert.equal(Object.hasOwn(legacyFactIds, "maxItems"), false);
  assert.equal(legacyFactIds.items.pattern, "^F[0-9]{3}$");

  const result = clone(fixtures.result_templates.legacy_ready_base);
  const sixtyOneIds = factIds(61);
  result.report.decisionPlan.decision_reason_fact_ids = sixtyOneIds;
  result.report.decisionPlan.possible_interpretations[0].supporting_fact_ids =
    sixtyOneIds;
  result.report.decisionPlan.review_timing.trigger_fact_ids = sixtyOneIds;
  normalization.decodeAssessmentExecutionResult(result);

  const legacyLocations = [
    (plan, value) => {
      plan.decision_reason_fact_ids = value;
    },
    (plan, value) => {
      plan.possible_interpretations[0].supporting_fact_ids = value;
    },
    (plan, value) => {
      plan.review_timing.trigger_fact_ids = value;
    },
  ];
  for (const setLegacyFactIds of legacyLocations) {
    for (const invalidIds of [[], ["F001", "F001"], ["F01A"]]) {
      const invalidResult = clone(fixtures.result_templates.legacy_ready_base);
      setLegacyFactIds(invalidResult.report.decisionPlan, invalidIds);
      assert.throws(() => normalization.decodeAssessmentExecutionResult(invalidResult));
    }
  }
});

const readyStats = { legacy: 0, split: 0 };
let emptyOptionalPositiveCount = 0;
const readyDeliveries = [];
check("legacy split nullable all decisions and optional-empty projections", () => {
  const decisionsSeen = new Set();
  for (const fixture of fixtures.ready_fixtures) {
    const result = instantiate(fixture);
    const reportBefore = JSON.stringify(result.report);
    deepFreeze(result.report);
    const decoded = normalization.decodeAssessmentExecutionResult(result);
    assert.equal(decoded.eligibility, "ready");
    const first = projection.projectCustomerAssessmentV1(
      decoded,
      fixture.requested_topics,
    );
    const second = projection.projectCustomerAssessmentV1(
      decoded,
      fixture.requested_topics,
    );
    projection.decodeCustomerAssessmentProjectionV1(first);
    assert.deepEqual(first, second, fixture.fixture_id);
    assert.equal(JSON.stringify(result.report), reportBefore, fixture.fixture_id);
    assert.equal(first.sourceReportSchemaVersion, fixture.expected.source_report_schema_version);
    assert.equal(first.decisionCode, fixture.expected.decision_code);
    assert.equal(first.finalDraft?.text ?? null, fixture.expected.final_draft_text);
    assert.equal(first.immediateAction.action, fixture.expected.immediate_action);
    assert.equal(first.relationshipSummary === null, fixture.expected.relationship_summary_null);
    assert.equal(first.messageTemperature === null, fixture.expected.message_temperature_null);
    assert.deepEqual(first.requestedTopics, fixture.requested_topics);
    assert.equal(containsForbiddenProjectionKey(first), false);
    assert.equal(first.reassessment.conditions.some((item) => "supporting_fact_ids" in item), false);
    assert.equal(first.immediateAction.avoid.length, new Set(first.immediateAction.avoid).size);
    assert.equal(first.finalDraft?.text, decoded.decisionCard.messageDraft ?? undefined);
    if (emptyOptionalFixtureIds.includes(fixture.fixture_id)) {
      assert.equal(first.sourceReportSchemaVersion, "m2-p4-split-runtime-report-v1");
      assert.equal(containsForbiddenProjectionKey(first), false);
      emptyOptionalPositiveCount += 1;
    }
    const readyDelivery = delivery.createCustomerAssessmentDeliveryV1(
      decoded,
      fixture.requested_topics,
    );
    assert.equal(readyDelivery.eligibility, "ready");
    assert.equal(readyDelivery.requestedTopicsAuthority, "validated_initial_request");
    delivery.decodeCustomerAssessmentDeliveryV1(readyDelivery);
    delivery.decodeCustomerAssessmentApiResponseV1({ data: readyDelivery });
    readyDeliveries.push(readyDelivery);
    decisionsSeen.add(first.decisionCode);
    if (first.sourceReportSchemaVersion === "m2-p3-runtime-report-v1") {
      readyStats.legacy += 1;
    } else {
      readyStats.split += 1;
    }
  }
  assert.deepEqual(sorted(decisionsSeen),
    sorted(["reply_now", "send_now", "wait_and_reassess", "pause_additional_contact"]));
  assert.deepEqual(readyStats, { legacy: 1, split: 10 });
  assert.equal(emptyOptionalPositiveCount, 6);
  assert.deepEqual(
    sorted(
      fixtures.ready_fixtures
        .filter((fixture) => emptyOptionalFixtureIds.includes(fixture.fixture_id))
        .map((fixture) => fixture.fixture_id),
    ),
    sorted(emptyOptionalFixtureIds),
  );

  const allEmptyFixture = fixtures.ready_fixtures.find(
    (fixture) => fixture.fixture_id === "split_all_optional_fact_id_arrays_empty",
  );
  const allEmptyPlan = instantiate(allEmptyFixture).report.decisionPlan;
  assert.deepEqual(allEmptyPlan.possible_interpretations[0].supporting_fact_ids, []);
  assert.deepEqual(allEmptyPlan.pre_action_check.supporting_fact_ids, []);
  assert.equal(
    allEmptyPlan.aftercare_plan.every((item) => item.supporting_fact_ids.length === 0),
    true,
  );
  assert.deepEqual(allEmptyPlan.change_conditions[0].supporting_fact_ids, []);
  assert.deepEqual(allEmptyPlan.review_timing.trigger_fact_ids, []);
});

check("source mutation detection and byte/deep immutability", () => {
  const fixture = fixtures.behavior_fixtures.mutated_source_detection;
  const result = instantiate(fixture);
  const before = JSON.stringify(result.report);
  const frozen = deepFreeze(result.report);
  assert.throws(() => {
    frozen.fixedLimitation = "mutated";
  }, TypeError);
  projection.projectCustomerAssessmentV1(result, fixture.requested_topics);
  assert.equal(JSON.stringify(result.report), before);
});

check("persisted report and DecisionCard hydration is offline decoded", () => {
  for (const fixture of fixtures.ready_fixtures.slice(0, 2)) {
    const result = instantiate(fixture);
    const hydrated = normalization.hydratePersistedReadyAssessmentV1({
      requestId: result.requestId,
      runId: result.runId,
      decision: result.decision,
      reportJson: result.report,
      decisionCardJson: result.decisionCard,
      authoritativeRequestedTopics: fixture.requested_topics,
      usage: result.usage,
    });
    assert.equal(hydrated.eligibility, "ready");
    assert.equal(hydrated.report.schemaVersion, result.report.schemaVersion);
    assert.deepEqual(hydrated.authoritativeRequestedTopics, fixture.requested_topics);
  }
  const malformedFixture = fixtures.invalid_fixtures.find(
    (fixture) => fixture.fixture_id === "malformed_decision_card",
  );
  const malformed = instantiate(malformedFixture);
  assert.throws(() =>
    normalization.hydratePersistedReadyAssessmentV1({
      requestId: malformed.requestId,
      runId: malformed.runId,
      decision: malformed.decision,
      reportJson: malformed.report,
      decisionCardJson: malformed.decisionCard,
      authoritativeRequestedTopics: ["decide_send_or_wait"],
      usage: malformed.usage,
    }),
  );
});

check("frozen accepted E-R3 final structures remain decoder-compatible", () => {
  const acceptedExpectations = new Map([
    ["E-R3-01", ["ready", "m2-p4-split-runtime-report-v1"]],
    ["E-R3-02", ["ready", "m2-p4-split-runtime-report-v1"]],
    ["E-R3-03", ["safety_blocked", null]],
    ["E-R3-04", ["ready", "m2-p4-split-runtime-report-v1"]],
  ]);
  for (const [caseId, [eligibility, reportSchema]] of acceptedExpectations) {
    const frozenCase = frozenDiagnostic.cases.find(
      (candidate) => candidate.case_id === caseId,
    );
    assert.ok(frozenCase?.final_result, caseId);
    const decoded = normalization.decodeAssessmentExecutionResult(
      frozenCase.final_result,
    );
    assert.equal(decoded.eligibility, eligibility, caseId);
    assert.equal(decoded.report?.schemaVersion ?? null, reportSchema, caseId);
  }
  for (const caseId of ["E-R3-05", "E-R3-06"]) {
    const frozenCase = frozenDiagnostic.cases.find(
      (candidate) => candidate.case_id === caseId,
    );
    assert.equal(frozenCase?.final_result ?? null, null, caseId);
  }
});

const stopStats = { safety_blocked: 0, needs_more_information: 0 };
const stopDeliveries = [];
check("stop variants contain no Projection Report or draft", () => {
  for (const fixture of fixtures.stop_fixtures) {
    const result = instantiate(fixture);
    const decoded = normalization.decodeAssessmentExecutionResult(result);
    assert.equal(decoded.eligibility, fixture.expected_eligibility);
    const stopped = delivery.createCustomerAssessmentDeliveryV1(
      decoded,
      fixture.requested_topics,
    );
    assert.equal(stopped.eligibility, fixture.expected_eligibility);
    for (const forbidden of ["projection", "report", "draft", "finalDraft"]) {
      assert.equal(Object.prototype.hasOwnProperty.call(stopped, forbidden), false);
    }
    delivery.decodeCustomerAssessmentDeliveryV1(stopped);
    delivery.decodeCustomerAssessmentApiResponseV1({ data: stopped });
    stopDeliveries.push(stopped);
    stopStats[stopped.eligibility] += 1;
  }
  assert.deepEqual(stopStats, { safety_blocked: 1, needs_more_information: 1 });
});

let rejectedRuntimeShapes = 0;
check("original invalid shapes and split fact-ID negatives rejected", () => {
  const invalidFixtureIds = fixtures.invalid_fixtures.map(
    (fixture) => fixture.fixture_id,
  );
  for (const fixtureId of [...originalInvalidFixtureIds, ...splitFactIdNegativeFixtureIds]) {
    assert.equal(invalidFixtureIds.filter((candidate) => candidate === fixtureId).length, 1);
  }
  assert.deepEqual(
    sorted(invalidFixtureIds),
    sorted([...originalInvalidFixtureIds, ...splitFactIdNegativeFixtureIds]),
  );

  const required61 = instantiate(
    fixtures.invalid_fixtures.find(
      (fixture) => fixture.fixture_id === "split_decision_reason_fact_ids_length_61",
    ),
  ).report.decisionPlan.decision_reason_fact_ids;
  const optional61 = instantiate(
    fixtures.invalid_fixtures.find(
      (fixture) => fixture.fixture_id === "split_optional_fact_ids_length_61",
    ),
  ).report.decisionPlan.pre_action_check.supporting_fact_ids;
  for (const values of [required61, optional61]) {
    assert.equal(values.length, 61);
    assert.equal(new Set(values).size, 61);
    values.forEach((value) => assert.match(value, /^F[0-9]{3}$/u));
  }

  for (const fixture of fixtures.invalid_fixtures) {
    const result = instantiate(fixture);
    assert.throws(
      () => normalization.decodeAssessmentExecutionResult(result),
      undefined,
      fixture.fixture_id,
    );
    rejectedRuntimeShapes += 1;
  }
  assert.equal(rejectedRuntimeShapes, 13);
});

let rejectedDeliveryShapes = 0;
check("unknown and mixed delivery wire shapes rejected", () => {
  const mixedReady = { ...readyDeliveries[0], report: { forbidden: true } };
  assert.throws(() => delivery.decodeCustomerAssessmentDeliveryV1(mixedReady));
  rejectedDeliveryShapes += 1;
  const mixedStop = { ...stopDeliveries[0], projection: readyDeliveries[0].projection };
  assert.throws(() => delivery.decodeCustomerAssessmentDeliveryV1(mixedStop));
  rejectedDeliveryShapes += 1;
  const invalidSelection = clone(readyDeliveries[1]);
  invalidSelection.projection.relationshipSummary = "選択されていない注入文";
  assert.throws(() => delivery.decodeCustomerAssessmentDeliveryV1(invalidSelection));
  rejectedDeliveryShapes += 1;
  assert.equal(rejectedDeliveryShapes, 3);
});

check("requestedTopics duplicate mismatch uses persisted original", () => {
  const fixture = fixtures.behavior_fixtures.requested_topics_duplicate_mismatch;
  const result = instantiate(fixture);
  const resultBefore = JSON.stringify(result);
  const actual = delivery.createCustomerAssessmentDeliveryV1(
    result,
    fixture.current_requested_topics,
  );
  assert.equal(actual.eligibility, "ready");
  assert.equal(actual.requestedTopicsAuthority, fixture.expected_authority);
  assert.deepEqual(actual.projection.requestedTopics, fixture.expected_projected_topics);
  assert.notDeepEqual(actual.projection.requestedTopics, fixture.current_requested_topics);
  assert.equal(JSON.stringify(result), resultBefore);
});

check("case-ID independence", () => {
  const fixture = fixtures.behavior_fixtures.case_id_independence;
  assert.equal(fixture.metadata_only_fixture_ids.length, 2);
  const first = projection.projectCustomerAssessmentV1(
    instantiate(fixture),
    fixture.requested_topics,
  );
  const second = projection.projectCustomerAssessmentV1(
    instantiate(fixture),
    fixture.requested_topics,
  );
  assert.deepEqual(first, second);
  assert.equal(
    fixture.metadata_only_fixture_ids.some((id) => JSON.stringify(first).includes(id)),
    false,
  );
});

check("Customer preview receives Projection only", () => {
  const formSource = readText("components/runtime/RuntimeAssessmentForm.tsx");
  const previewSource = readText(
    "components/runtime/RuntimeAssessmentProjectionPreview.tsx",
  );
  assert.match(formSource, /<RuntimeAssessmentProjectionPreview[\s\S]*projection=\{requestState\.delivery\.projection\}/u);
  assert.doesNotMatch(formSource, /RuntimeAssessmentNote|\.report\b/u);
  assert.match(previewSource, /projection:\s*CustomerAssessmentProjectionV1/u);
  assert.doesNotMatch(previewSource, /RuntimeReport|SplitRuntimeReport|assessment:\s*/u);
  assert.match(previewSource, /const decisionLabels:/u);
});

check("capabilities and offline evidence exact", () => {
  for (const artifact of [
    projectionContract,
    fixtures,
    offlineResults,
    capabilities,
  ]) {
    assert.equal(artifact.task_id, taskId);
    assert.match(artifact.schema_version, /-p2-r1-/u);
  }
  assert.equal(capabilities.status,
    "runtime_projection_corrected_pending_human_chatgpt_review");
  assert.equal(capabilities.baseline, baseline);
  assert.equal(projectionContract.status, capabilities.status);
  assert.equal(projectionContract.baseline, baseline);
  assert.equal(projectionContract.review_correction.original_package_a_architecture_accepted, true);
  assert.equal(
    projectionContract.review_correction.human_chatgpt_implementation_review,
    "blocking_split_fact_id_schema_parity_defect_found",
  );
  assert.equal(projectionContract.review_correction.defect_corrected_offline, true);
  assert.equal(projectionContract.review_correction.provider_quality_established, false);
  assert.equal(projectionContract.review_correction.provider_rerun_authorized, false);
  assert.equal(
    projectionContract.review_correction.package_b_authorization,
    "unauthorized_pending_r1_review",
  );
  assert.deepEqual(
    projectionContract.split_fact_id_decoding.optional_locations,
    optionalSplitFactIdLocations.map((location) => location.name),
  );
  assert.deepEqual(
    [
      projectionContract.split_fact_id_decoding.decision_reason_fact_ids.minimum,
      projectionContract.split_fact_id_decoding.decision_reason_fact_ids.maximum,
      projectionContract.split_fact_id_decoding.optional_minimum,
      projectionContract.split_fact_id_decoding.optional_maximum,
      projectionContract.split_fact_id_decoding.legacy_minimum,
      projectionContract.split_fact_id_decoding.legacy_maximum,
    ],
    [1, 60, 0, 60, 1, null],
  );
  for (const key of [
    "original_package_a_architecture_accepted",
    "implementation_review_blocking_schema_parity_defect_found",
    "schema_parity_defect_corrected_offline",
    "runtime_union_decoder_complete",
    "legacy_ready_supported",
    "split_ready_supported",
    "stop_results_supported",
    "unsafe_ready_narrowing_removed",
    "api_wire_decoding_complete",
    "persisted_result_decoding_complete",
    "customer_projection_complete",
    "full_report_unchanged",
    "requested_topics_authority_protected",
    "split_required_fact_ids_schema_parity",
    "split_optional_fact_ids_allow_empty",
    "legacy_fact_id_behavior_unchanged",
  ]) {
    assert.equal(capabilities[key], true, key);
  }
  assert.equal(capabilities.split_fact_ids_maximum_enforced, 60);
  assert.equal(capabilities.provider_quality_established, false);
  for (const key of [
    "customer_ui_finalized",
    "package_b_authorized",
    "package_c_authorized",
    "package_d_authorized",
    "package_e_authorized",
    "package_f_authorized",
    "provider_rerun_authorized",
    "active_runtime_activated",
    "r4_authorized",
    "c2_authorized",
  ]) {
    assert.equal(capabilities[key], false, key);
  }
  assert.deepEqual(
    [capabilities.provider_calls, capabilities.db_operations, capabilities.supabase_operations],
    [0, 0, 0],
  );
  assert.equal(offlineResults.status, "PASS");
  assert.equal(offlineResults.baseline, baseline);
  assert.equal(offlineResults.review_correction.original_package_a_architecture_accepted, true);
  assert.equal(offlineResults.review_correction.blocking_schema_parity_defect_found, true);
  assert.equal(
    offlineResults.review_correction.blocking_schema_parity_defect_corrected_offline,
    true,
  );
  assert.equal(offlineResults.review_correction.provider_quality_established, false);
  assert.equal(offlineResults.review_correction.provider_rerun_authorized, false);
  assert.equal(
    offlineResults.review_correction.package_b_authorized_pending_r1_review,
    false,
  );
  assert.deepEqual(offlineResults.fixture_counts, {
    legacy_ready: 1,
    split_ready: 10,
    split_optional_empty_positive: 6,
    safety_blocked: 1,
    needs_more_information: 1,
    invalid_runtime_shapes_rejected: 13,
    split_fact_id_negative_rejected: 5,
    invalid_delivery_shapes_rejected: 3,
  });
  for (const key of [
    "split_required_fact_ids_schema_parity",
    "split_optional_fact_ids_allow_empty",
    "split_fact_ids_maximum_enforced",
    "legacy_fact_id_behavior_unchanged",
  ]) {
    assert.equal(offlineResults.results[key], "PASS", key);
  }
  assert.deepEqual(
    [
      offlineResults.operations.provider_calls,
      offlineResults.operations.db_operations,
      offlineResults.operations.supabase_operations,
    ],
    [0, 0, 0],
  );
  assert.deepEqual(
    [
      offlineResults.operations.runner_rerun,
      offlineResults.operations.package_check,
      offlineResults.operations.retry,
      offlineResults.operations.repair,
      offlineResults.operations.fallback,
    ],
    [false, false, false, false, false],
  );
  for (const key of [
    "package_b_authorized",
    "package_c_authorized",
    "package_d_authorized",
    "package_e_authorized",
    "package_f_authorized",
    "provider_rerun_authorized",
    "r4_authorized",
    "c2_authorized",
    "pull_request_authorized",
    "main_merge_authorized",
  ]) {
    assert.equal(offlineResults.authorization[key], false, key);
  }
});

check("git diff --check PASS", () => {
  git(["diff", "--check"]);
  const changedText = exactScope.map((candidate) => readText(candidate));
  changedText.forEach((text, index) => {
    assert.ok(!/[\t ]+$/gmu.test(text), exactScope[index]);
  });
});

const failed = checks.filter((result) => !result.passed);
console.log(
  `Runtime projection verifier: ${failed.length === 0 ? "PASS" : "FAIL"} ${checks.length - failed.length}/${checks.length}`,
);
console.log(`Exact correction scope: ${exactScope.length}/7`);
console.log(
  `Ready fixtures legacy/split: ${readyStats.legacy}/${readyStats.split}; stop safety/needs: ${stopStats.safety_blocked}/${stopStats.needs_more_information}`,
);
console.log(
  `Rejected invalid runtime/delivery shapes: ${rejectedRuntimeShapes}/${rejectedDeliveryShapes}`,
);
console.log(
  `Schema-parity fixtures positive/negative: ${emptyOptionalPositiveCount}/${splitFactIdNegativeFixtureIds.length}`,
);
console.log("Provider / DB / Supabase: 0 / 0 / 0");
if (failed.length > 0) {
  console.error(`Failed checks: ${failed.map((result) => result.name).join("; ")}`);
  process.exit(1);
}
