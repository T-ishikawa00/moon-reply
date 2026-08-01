import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Ajv2020 from "ajv/dist/2020.js";
import {
  auditC1ReplayInputConstructionV1,
  buildC1ReplayStructuredIntakeV5,
  evaluateC1OfflineReplayV2,
  extractWritingSignalsFromC1ProjectionV1,
  replayResultsArtifactV1,
} from "./lib/m2-p4-i3-r1-c1-r1-replay-evaluator-v2.mjs";

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const baselineSha = "bdc98af2c7c59a1d7ececa2077906c8fbb839ac9";
const correctionBaselineSha =
  "28bedad969d1007bbd731f0e9d47824eecd84651";
const acceptedImplementationSha =
  "d8415e2ae165143d646c6f9573e24752d8b1a1c7";
const implementationCommits = [
  "715fd906ad94ecc18b55dd13b16784c26bf12129",
  "28bedad969d1007bbd731f0e9d47824eecd84651",
  acceptedImplementationSha,
];
const mainBaselineSha = "61e33a10e195fad17e253a6b9719217e1992f273";
const branch = "feat/m2-p4-i3-r1-c1-r1-grounding-responsibility";
const markerSha256 =
  "51e9beec79bc5d44e79c4c74c07293964686a73d0ebf6acf60c590def918f934";
const artifactRoot = "evals/runtime/m2-p4-i3-r1-c1-r1";
const sourceArtifactRoot = "evals/runtime/m2-p4-i3-r1-c1";
const exactPaths = [
  "lib/assessment/runtime/contracts/writing-signals-v1.ts",
  "lib/assessment/runtime/contracts/structured-intake-v5.schema.json",
  "lib/assessment/runtime/contracts/pb-01-structure-v5.developer.md",
  "lib/assessment/runtime/contracts/runtime-stage-catalog-v6.json",
  "lib/assessment/runtime/writing-signals-grounding-v1.ts",
  "lib/assessment/runtime/decision-facts-evidence-guard-v4.ts",
  "lib/assessment/runtime/structured-intake-grounding-v5.ts",
  "lib/assessment/runtime/writing-context-integrity-v2.ts",
  `${artifactRoot}/postmortem-contract-v1.json`,
  `${artifactRoot}/responsibility-matrix-v1.json`,
  `${artifactRoot}/replay-results-v1.json`,
  `${artifactRoot}/capabilities-v1.json`,
  "scripts/lib/m2-p4-i3-r1-c1-r1-replay-evaluator-v2.mjs",
  "scripts/verify-m2-p4-i3-r1-c1-r1-grounding-responsibility.mjs",
  "docs/phase2/TASK_M2_P4_I3_R1_C1_R1_REVIEW.md",
  "lib/assessment/runtime/types.ts",
  "lib/assessment/runtime/validation.ts",
  "lib/assessment/runtime/schema-catalog.ts",
  "lib/assessment/runtime/pipeline.ts",
  "scripts/verify-m2-p4-i3-r1-c1-provider-diagnostic.mjs",
  "scripts/verify-m2-p4-i3-r1-b-writing-context.mjs",
  "scripts/verify-m2-p4-i3-r1-a-contracts.mjs",
  "scripts/verify-m2-p4-i3-product-quality.mjs",
  "scripts/verify-m2-p4-i2-report-ia.mjs",
  "scripts/verify-m2-p4-i1-c-contextual-best-effort.mjs",
  "scripts/verify-m2-p4-i1-b-runtime-integration.mjs",
  "scripts/verify-m2-eval-foundation.mjs",
  "scripts/verify-m2-p3-runtime-vertical-slice.mjs",
  "docs/CURRENT_FOCUS.md",
  "docs/WBS.md",
  "docs/CODEX_HANDOFF.md",
];
const exactCorrectionPaths = [
  "lib/assessment/runtime/decision-facts-evidence-guard-v4.ts",
  "scripts/lib/m2-p4-i3-r1-c1-r1-replay-evaluator-v2.mjs",
  `${artifactRoot}/replay-results-v1.json`,
  `${artifactRoot}/capabilities-v1.json`,
  "scripts/verify-m2-p4-i3-r1-c1-r1-grounding-responsibility.mjs",
  "docs/phase2/TASK_M2_P4_I3_R1_C1_R1_REVIEW.md",
  "docs/CURRENT_FOCUS.md",
  "docs/WBS.md",
  "docs/CODEX_HANDOFF.md",
];
const exactAcceptanceSyncPaths = [
  `${artifactRoot}/capabilities-v1.json`,
  "docs/phase2/TASK_M2_P4_I3_R1_C1_R1_REVIEW.md",
  "scripts/verify-m2-p4-i3-r1-c1-r1-grounding-responsibility.mjs",
  "scripts/verify-m2-eval-foundation.mjs",
  "scripts/verify-m2-p3-runtime-vertical-slice.mjs",
  "docs/CURRENT_FOCUS.md",
  "docs/WBS.md",
  "docs/CODEX_HANDOFF.md",
];
const allowedReplayInputSources = [
  "saved_c1_raw_typed_projection",
  "synthetic_assessment_input",
  "deterministic_schema_version_conversion",
  "application_owned_request_fields",
];
const forbiddenReplayInputSources = [
  "expected_decision_fact_subset",
  "expected_writing_context_subset",
  "expected_source_ownership",
  "hard_assertions",
  "soft_assertions",
  "forbidden_assertions",
  "acceptable_value_sets",
];
const immutableC1Evidence = [
  {
    path: `${sourceArtifactRoot}/diagnostic-results-v1.json`,
    blob: "768b0c387aac9b17ec6e038328639988d830a201",
  },
  {
    path: `${sourceArtifactRoot}/diagnostic-cases-v1.json`,
    blob: "901c7ad456b3a3f8ec5a41fe3bcce60232b64aca",
  },
  {
    path: `${sourceArtifactRoot}/diagnostic-contract-v1.json`,
    blob: "e033c313ce931cd00ba7b5c63fbb08e11a649886",
  },
  {
    path: `${sourceArtifactRoot}/diagnostic-summary-v1.md`,
    blob: "18666d6af491c4a99c387b71137a92502c6591c6",
  },
];
const forbiddenProviderBookkeeping = [
  "source_refs",
  "explicit_source_refs",
  "inferred_source_refs",
  "evidence_state",
  "effect_class",
  "unresolved",
  "unresolved_fields",
  "unresolved_writing_fields",
  "message_id",
  "sequence",
  "constraint_id",
];
const productionRevisionPaths = [
  "lib/assessment/runtime/writing-signals-grounding-v1.ts",
  "lib/assessment/runtime/decision-facts-evidence-guard-v4.ts",
  "lib/assessment/runtime/structured-intake-grounding-v5.ts",
  "lib/assessment/runtime/writing-context-integrity-v2.ts",
];

function absolute(relativePath) {
  return path.join(repositoryRoot, relativePath);
}

function source(relativePath) {
  return readFileSync(absolute(relativePath), "utf8");
}

function json(relativePath) {
  return JSON.parse(source(relativePath));
}

function git(args) {
  return execFileSync(
    "git.exe",
    ["-c", "safe.directory=C:/projects/moon-reply", ...args],
    { cwd: repositoryRoot, encoding: "utf8" },
  );
}

function sorted(values) {
  return [...values].sort((left, right) => left.localeCompare(right, "en"));
}

function normalizedPaths(value) {
  return value
    .split(/\r?\n/gu)
    .map((item) => item.trim().replaceAll("\\", "/"))
    .filter(Boolean);
}

function currentTaskPaths(base) {
  return sorted(
    new Set([
      ...normalizedPaths(git(["diff", "--name-only", base, "--"])),
      ...normalizedPaths(
        git(["ls-files", "--others", "--exclude-standard"]),
      ),
    ]),
  );
}

function historicalTaskPaths(base, end) {
  return sorted(
    new Set(normalizedPaths(git(["diff", "--name-only", base, end, "--"]))),
  );
}

function assertLiteralSet(actual, expected) {
  assert.deepEqual(sorted(actual), sorted(expected));
  assert.equal(new Set(actual).size, actual.length);
  assert.equal(
    actual.every(
      (item) =>
        typeof item === "string" &&
        item.length > 0 &&
        !item.includes("*") &&
        !item.endsWith("/"),
    ),
    true,
  );
}

function sha256File(relativePath) {
  return createHash("sha256").update(readFileSync(absolute(relativePath))).digest("hex");
}

function isObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function countKeys(value, target) {
  if (Array.isArray(value)) {
    return value.reduce((count, item) => count + countKeys(item, target), 0);
  }
  if (!isObject(value)) return 0;
  return Object.entries(value).reduce(
    (count, [key, child]) =>
      count + (key === target ? 1 : 0) + countKeys(child, target),
    0,
  );
}

function setAt(root, pointer, value) {
  const segments = pointer
    .slice(1)
    .split("/")
    .map((segment) => segment.replaceAll("~1", "/").replaceAll("~0", "~"));
  let selected = root;
  for (const segment of segments.slice(0, -1)) {
    selected = selected[/^\d+$/u.test(segment) ? Number(segment) : segment];
  }
  const final = segments.at(-1);
  selected[/^\d+$/u.test(final) ? Number(final) : final] = structuredClone(value);
}

function materialize(bundle, descriptor) {
  const result = structuredClone(bundle.templates[descriptor.template_id]);
  for (const mutation of descriptor.mutations) {
    assert.equal(mutation.op, "set");
    setAt(result, mutation.path, mutation.value);
  }
  return result;
}

function occurrenceCount(value, token) {
  return value.split(token).length - 1;
}

function overlayForRejectedMutation(target, overlay) {
  if (!isObject(overlay)) return structuredClone(overlay);
  const result = isObject(target) ? structuredClone(target) : {};
  for (const [key, value] of Object.entries(overlay)) {
    result[key] = isObject(value)
      ? overlayForRejectedMutation(result[key], value)
      : structuredClone(value);
  }
  return result;
}

function requiredBoundaryEvidencePassed(cases) {
  const byId = new Map(cases.map((item) => [item.case_id, item]));
  const pair03 = byId.get("PAIR-03");
  const pair04 = byId.get("PAIR-04");
  const v408 = byId.get("V4-08");
  return (
    pair03?.pre_guard_decision_facts?.boundary_state?.kind ===
      "temporary_distance" &&
    pair03?.pre_guard_decision_facts?.boundary_state?.status === "explicit" &&
    pair03?.pre_guard_boundary?.kind === "temporary_distance" &&
    pair03?.pre_guard_boundary?.status === "explicit" &&
    pair03?.post_guard_decision_facts?.boundary_state?.kind === "none" &&
    pair03?.post_guard_decision_facts?.boundary_state?.status === "none" &&
    pair03?.post_guard_boundary?.kind === "none" &&
    pair03?.post_guard_boundary?.status === "none" &&
    pair04?.pre_guard_decision_facts?.boundary_state?.kind === "no_contact" &&
    pair04?.pre_guard_decision_facts?.boundary_state?.status === "explicit" &&
    pair04?.pre_guard_boundary?.kind === "no_contact" &&
    pair04?.pre_guard_boundary?.status === "explicit" &&
    pair04?.post_guard_decision_facts?.boundary_state?.kind === "no_contact" &&
    pair04?.post_guard_decision_facts?.boundary_state?.status === "explicit" &&
    pair04?.post_guard_boundary?.kind === "no_contact" &&
    pair04?.post_guard_boundary?.status === "explicit" &&
    v408?.pre_guard_boundary?.kind === "unknown" &&
    v408?.pre_guard_boundary?.status === "unknown" &&
    v408?.strict_source_decision_facts?.boundary_state?.kind === "unknown" &&
    v408?.strict_source_decision_facts?.boundary_state?.status === "unknown" &&
    v408?.post_guard_boundary?.kind === "none" &&
    v408?.post_guard_boundary?.status === "none"
  );
}

function buildV408ApplicationFixture(v408ReplayCase) {
  const raw = structuredClone(v408ReplayCase.raw_v5);
  raw.boundaries = [];
  raw.decision_facts.boundary_state = {
    kind: "unknown",
    status: "unknown",
    repeated_unanswered_contact: false,
  };
  raw.writing_signals.message_signals = [
    { author: "other_person", status: "incoming" },
  ];
  raw.writing_signals.candidate_style_profile = null;
  raw.writing_signals.candidate_communicative_intent = null;
  raw.writing_signals.boundary_ownership_signals = [];
  raw.writing_signals.privacy_markers = ["account_identifier", "email"];
  raw.writing_signals.repeat_consultation_state.state =
    "repeated_without_material_change";
  raw.untrusted_embedded_instructions_detected = true;
  return {
    fixture_id: "V4-08-APPLICATION-SEMANTIC-ONLY",
    input: {
      currentSituation:
        "Synthetic repeated consultation with no observed boundary.",
      optionalMessage: null,
      relationship: raw.relationship_stage,
      requestedTopics: raw.decision_facts.selected_requests,
      privacyAcknowledged: true,
    },
    raw,
    expected_data_injected: false,
  };
}

function collectRawPiiStrings(value) {
  if (Array.isArray(value)) return value.flatMap(collectRawPiiStrings);
  if (isObject(value)) {
    return Object.values(value).flatMap(collectRawPiiStrings);
  }
  if (typeof value !== "string") return [];
  const hasEmail = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/iu.test(value);
  const hasAccountHandle = /@[A-Z0-9_]{2,}/iu.test(value);
  const hasPhone = /\b\d{2,4}[- ]\d{2,4}[- ]\d{3,4}\b/u.test(value);
  return hasEmail || hasAccountHandle || hasPhone ? [value] : [];
}

assert.equal(git(["branch", "--show-current"]).trim(), branch);
assert.equal(git(["rev-parse", "main"]).trim(), mainBaselineSha);
assert.equal(git(["rev-parse", "origin/main"]).trim(), mainBaselineSha);
assert.doesNotThrow(() =>
  git(["merge-base", "--is-ancestor", acceptedImplementationSha, "HEAD"]),
);
assert.equal(exactPaths.length, 31);
assertLiteralSet(currentTaskPaths(baselineSha), exactPaths);
assertLiteralSet(
  historicalTaskPaths(baselineSha, acceptedImplementationSha),
  exactPaths,
);
assert.equal(
  git(["diff", "--check", baselineSha, acceptedImplementationSha, "--"]).trim(),
  "",
);
assert.equal(exactCorrectionPaths.length, 9);
assertLiteralSet(
  historicalTaskPaths(correctionBaselineSha, acceptedImplementationSha),
  exactCorrectionPaths,
);
assert.equal(
  git([
    "diff",
    "--check",
    correctionBaselineSha,
    acceptedImplementationSha,
    "--",
  ]).trim(),
  "",
);
assert.equal(exactAcceptanceSyncPaths.length, 8);
assertLiteralSet(
  currentTaskPaths(acceptedImplementationSha),
  exactAcceptanceSyncPaths,
);
assert.equal(
  git(["diff", "--check", acceptedImplementationSha, "--"]).trim(),
  "",
);

const protectedPathPatterns = [
  /^(app|components|supabase|evals\/(development|holdout))\//u,
  /^package(?:-lock)?\.json$/u,
];
assert.equal(
  currentTaskPaths(baselineSha).some((item) =>
    protectedPathPatterns.some((pattern) => pattern.test(item)),
  ),
  false,
);
for (const protectedPath of [
  "lib/assessment/runtime/service.ts",
  "lib/assessment/runtime/application.ts",
  "lib/assessment/runtime/openai-transport.ts",
  "lib/assessment/runtime/environment.ts",
  "lib/assessment/runtime/contracts/runtime-stage-catalog-v4.json",
  "lib/assessment/runtime/contracts/runtime-stage-catalog-v5.json",
  "lib/assessment/runtime/contracts/pb-01-structure-v3.developer.md",
  "lib/assessment/runtime/contracts/pb-01-structure-v4.developer.md",
  "lib/assessment/runtime/contracts/structured-intake-v3.schema.json",
  "lib/assessment/runtime/contracts/structured-intake-v4.schema.json",
  "lib/assessment/runtime/structured-intake-grounding-v3.ts",
  "lib/assessment/runtime/structured-intake-grounding-v4.ts",
  "lib/assessment/runtime/writing-context-integrity-v1.ts",
  "lib/assessment/runtime/policy.ts",
  "lib/assessment/runtime/policy-v2.ts",
  "lib/assessment/runtime/policy-v3.ts",
  "lib/assessment/runtime/safety-aggregation-v3.ts",
  "lib/assessment/runtime/eligibility-v3.ts",
]) {
  assert.equal(
    git(["diff", "--name-only", baselineSha, "--", protectedPath]).trim(),
    "",
    `protected diff: ${protectedPath}`,
  );
}

for (const evidence of immutableC1Evidence) {
  assert.equal(
    git(["rev-parse", `${baselineSha}:${evidence.path}`]).trim(),
    evidence.blob,
  );
  assert.equal(git(["hash-object", evidence.path]).trim(), evidence.blob);
}
const markerPath = ".git/moon-reply-r1-c1-provider-diagnostic-consumed.json";
assert.equal(existsSync(absolute(markerPath)), true);
assert.equal(sha256File(markerPath), markerSha256);

for (const productionPath of productionRevisionPaths) {
  const production = source(productionPath);
  assert.equal(/case_id|PAIR-|V4-|fixture|oracle/iu.test(production), false);
}
assert.equal(
  /request\.currentSituation|request\[["']currentSituation["']\]|RegExp|\.match\(|\.search\(/u.test(
    source("lib/assessment/runtime/decision-facts-evidence-guard-v4.ts"),
  ),
  false,
);
const decisionFactsGuardSource = source(
  "lib/assessment/runtime/decision-facts-evidence-guard-v4.ts",
);
for (const requiredGuardToken of [
  "observedBoundaryAbsent",
  "hasAnyOwnedRestrictiveBoundarySignal",
  "hasExplicitNonBlockRestrictiveBoundary",
  "hasExplicitBlockedBoundary",
]) {
  assert.equal(decisionFactsGuardSource.includes(requiredGuardToken), true);
}

const applicationFixtureBuilderSource = buildV408ApplicationFixture.toString();
for (const evaluationOnlyField of forbiddenReplayInputSources) {
  assert.equal(
    applicationFixtureBuilderSource.includes(evaluationOnlyField),
    false,
    `application fixture expected-data leak: ${evaluationOnlyField}`,
  );
}

const replayEvaluatorSource = source(
  "scripts/lib/m2-p4-i3-r1-c1-r1-replay-evaluator-v2.mjs",
);
const evaluationAuthorityStart = replayEvaluatorSource.indexOf(
  "function targetRoot",
);
const artifactProjectionStart = replayEvaluatorSource.indexOf(
  "export function replayResultsArtifactV1",
);
assert.ok(evaluationAuthorityStart > 0);
assert.ok(artifactProjectionStart > evaluationAuthorityStart);
const inputConstructionSource = replayEvaluatorSource.slice(
  0,
  evaluationAuthorityStart,
);
const evaluationOnlySource = replayEvaluatorSource.slice(
  evaluationAuthorityStart,
  artifactProjectionStart,
);
const postEvaluationSource = replayEvaluatorSource.slice(artifactProjectionStart);
for (const evaluationOnlyField of forbiddenReplayInputSources) {
  assert.equal(
    occurrenceCount(inputConstructionSource, evaluationOnlyField),
    0,
    `input construction authority leak: ${evaluationOnlyField}`,
  );
  assert.equal(
    occurrenceCount(postEvaluationSource, evaluationOnlyField),
    0,
    `post-evaluation authority leak: ${evaluationOnlyField}`,
  );
  assert.equal(
    occurrenceCount(replayEvaluatorSource, evaluationOnlyField),
    occurrenceCount(evaluationOnlySource, evaluationOnlyField),
    `evaluation-only field escaped evaluation authority: ${evaluationOnlyField}`,
  );
}
assert.equal(occurrenceCount(replayEvaluatorSource, "deepOverlay"), 0);
assert.equal(
  occurrenceCount(inputConstructionSource, "expected_decision_fact_subset"),
  0,
);
assert.equal(
  occurrenceCount(inputConstructionSource, "expected_source_ownership"),
  0,
);
assert.equal(
  inputConstructionSource.includes(
    "decision_facts: structuredClone(rawProjection.decision_facts)",
  ),
  true,
);

const postmortem = json(`${artifactRoot}/postmortem-contract-v1.json`);
const responsibility = json(`${artifactRoot}/responsibility-matrix-v1.json`);
const replayArtifact = json(`${artifactRoot}/replay-results-v1.json`);
const capabilities = json(`${artifactRoot}/capabilities-v1.json`);
assert.equal(postmortem.task_id, "M2-P4-I3-R1-C1-R1");
assert.equal(postmortem.baseline, baselineSha);
assertLiteralSet(postmortem.exact_mutation_paths, exactPaths);
assert.equal(postmortem.exact_mutation_path_count, 31);
assert.deepEqual(
  responsibility.owners.map((item) => item.owner),
  [
    "provider_semantic",
    "application_canonical",
    "application_guard",
    "evaluator_only",
  ],
);
assertLiteralSet(
  responsibility.forbidden_provider_bookkeeping_keys,
  forbiddenProviderBookkeeping,
);
assert.equal(capabilities.status, "human_chatgpt_accepted_complete");
assert.equal(capabilities.application_architecture_accepted, true);
assert.equal(capabilities.application_offline_implementation_accepted, true);
assert.equal(capabilities.provider_quality_accepted, false);
assert.equal(
  capabilities.accepted_implementation_commit,
  acceptedImplementationSha,
);
assert.deepEqual(capabilities.implementation_commits, implementationCommits);
assert.deepEqual(capabilities.implementation_snapshot, {
  type: "historical_commit_range",
  base_commit_sha: baselineSha,
  end_commit_sha: acceptedImplementationSha,
  exact_paths: 31,
  immutable_snapshot: true,
  include_working_tree: false,
});
assert.deepEqual(capabilities.final_review_correction, {
  type: "historical_commit_range",
  base_commit_sha: correctionBaselineSha,
  end_commit_sha: acceptedImplementationSha,
  exact_paths: 9,
});
assertLiteralSet(
  capabilities.acceptance_sync_exact_paths,
  exactAcceptanceSyncPaths,
);
assert.equal(capabilities.acceptance_sync_exact_path_count, 8);
assert.equal(capabilities.exact_mutation_paths, 31);
assert.equal(capabilities.exact_correction_paths, 9);
assert.equal(
  capabilities.replay_adjudication_correction_baseline,
  correctionBaselineSha,
);
assert.equal(capabilities.provider_calls, 0);
assert.equal(capabilities.active_runtime_changed, false);
assert.equal(capabilities.c2_authorized, false);
assert.equal(capabilities.next_candidate_authorized, false);
assert.equal(capabilities.replay_verdict, "FAIL");
assert.equal(capabilities.strict_source_replay_verdict, "FAIL");
assert.equal(capabilities.strict_cases_passed, 5);
assert.equal(capabilities.replay, "5/8");
assert.equal(capabilities.application_adjudicated_verdict, "PASS");
assert.equal(capabilities.application_adjudicated_decision_facts, "8/8");
assert.equal(capabilities.application_canonical_fixtures, "8/8");
assert.equal(
  capabilities.application_fixture_result,
  "PASS_APPLICATION_UNIT_ONLY",
);
assert.equal(capabilities.provider_retest_required, true);
assert.equal(capabilities.provider_semantic_coverage, "7/8");
assert.deepEqual(capabilities.provider_semantic_coverage_detail, {
  available: 7,
  total: 8,
  unavailable_cases: ["V4-08"],
  v4_08_evidence_status: "unavailable_from_source_diagnostic",
});
assert.deepEqual(capabilities.expectation_contract_defects, [
  "PAIR-02:/latest_direct_message/user_reply_state",
]);
assert.deepEqual(capabilities.nonmaterial_taxonomy_equivalences, [
  "V4-06:/latest_direct_message/kind",
]);
assert.equal(capabilities.r1_c1_r2_authorized, false);
assert.equal(capabilities.c2_eligible, false);
assert.equal(capabilities.expected_input_injection, 0);
assert.deepEqual(
  capabilities.replay_input_construction_authority.allowed_sources,
  allowedReplayInputSources,
);
assert.deepEqual(
  capabilities.replay_input_construction_authority.forbidden_sources,
  forbiddenReplayInputSources,
);

const providerSchema = json(
  "lib/assessment/runtime/contracts/structured-intake-v5.schema.json",
);
const groundedSchema = json(
  "lib/assessment/runtime/contracts/structured-intake-v4.schema.json",
);
const catalogV6 = json(
  "lib/assessment/runtime/contracts/runtime-stage-catalog-v6.json",
);
const catalogV5 = json(
  "lib/assessment/runtime/contracts/runtime-stage-catalog-v5.json",
);
const schemaAjv = new Ajv2020({ allErrors: true, strict: false });
assert.doesNotThrow(() => schemaAjv.compile(providerSchema));
assert.doesNotThrow(() => schemaAjv.compile(groundedSchema));
assert.equal(providerSchema.properties.schema_version.const, "pipeline-schema-v5.0.0");
assert.equal(providerSchema.required.includes("writing_signals"), true);
assert.equal("writing_context" in providerSchema.properties, false);
assert.equal(providerSchema.properties.decision_facts.$ref, "#/$defs/decision_facts");

function collectReachablePropertyKeys(schema, node, result, visited) {
  if (!isObject(node)) return;
  if (typeof node.$ref === "string" && node.$ref.startsWith("#/$defs/")) {
    const name = node.$ref.slice("#/$defs/".length);
    if (visited.has(name)) return;
    visited.add(name);
    collectReachablePropertyKeys(schema, schema.$defs[name], result, visited);
  }
  if (isObject(node.properties)) {
    for (const [key, child] of Object.entries(node.properties)) {
      result.add(key);
      collectReachablePropertyKeys(schema, child, result, visited);
    }
  }
  for (const branch of node.anyOf ?? []) {
    collectReachablePropertyKeys(schema, branch, result, visited);
  }
  if (isObject(node.items)) {
    collectReachablePropertyKeys(schema, node.items, result, visited);
  }
}
const writingSignalKeys = new Set();
collectReachablePropertyKeys(
  providerSchema,
  providerSchema.properties.writing_signals,
  writingSignalKeys,
  new Set(),
);
assert.deepEqual(
  forbiddenProviderBookkeeping.filter((key) => writingSignalKeys.has(key)),
  [],
);

assert.equal(catalogV6.catalog_version, "runtime-stage-catalog-v6.0.0");
assert.equal(catalogV6.prompt_bundle_version, "prompt-bundle-runtime-v6.0.0");
assert.equal(catalogV6.schema_set_version, "pipeline-schema-runtime-v3.2.0");
assert.equal(catalogV6.baseline, baselineSha);
for (let index = 1; index < 6; index += 1) {
  assert.deepEqual(catalogV6.stages[index], catalogV5.stages[index]);
}

const [
  { AssessmentApplication },
  { FakeAssessmentRepository, wait003StageOutputs },
  {
    loadM2P4GroundingResponsibilityRuntimeStageCatalog,
    loadM2P4ProductQualityRuntimeStageCatalog,
    loadM2P4WritingContextRuntimeStageCatalog,
  },
  { assertOpenAIStructuredOutputSchema, toOpenAiStructuredOutputSchema },
  { guardDecisionFactsWithEvidenceV4 },
  { groundStructuredIntakeV5 },
  { buildContextualDecisionPolicyV3 },
  { validateGroundedStageOutput },
  {
    collectWritingContextIntegrityViolationsV2,
    validateWritingContextIntegrityV2,
  },
] = await Promise.all([
  import("../lib/assessment/runtime/application.ts"),
  import("../lib/assessment/runtime/fakes.ts"),
  import("../lib/assessment/runtime/schema-catalog.ts"),
  import("../lib/assessment/runtime/openai-schema.ts"),
  import("../lib/assessment/runtime/decision-facts-evidence-guard-v4.ts"),
  import("../lib/assessment/runtime/structured-intake-grounding-v5.ts"),
  import("../lib/assessment/runtime/policy-v3.ts"),
  import("../lib/assessment/runtime/validation.ts"),
  import("../lib/assessment/runtime/writing-context-integrity-v2.ts"),
]);

const runtimeV6 = await loadM2P4GroundingResponsibilityRuntimeStageCatalog();
const activeRuntime = await loadM2P4ProductQualityRuntimeStageCatalog();
const predecessorRuntime = await loadM2P4WritingContextRuntimeStageCatalog();
assert.equal(runtimeV6.promptBundleVersion, "prompt-bundle-runtime-v6.0.0");
assert.equal(runtimeV6.schemaSetVersion, "pipeline-schema-runtime-v3.2.0");
assert.equal(runtimeV6.definitions.length, 6);
assert.equal(runtimeV6.definitions[0].schemaName, "pb_01_structure_v5");
assert.equal(runtimeV6.definitions[0].schemaVersion, "pipeline-schema-v5.0.0");
assert.equal(
  runtimeV6.definitions[0].groundedSchemaVersion,
  "pipeline-schema-v4.0.0",
);
assert.ok(runtimeV6.definitions[0].groundedSchemaHash);
assert.deepEqual(
  runtimeV6.definitions.slice(1).map((definition) => definition.outputSchema),
  predecessorRuntime.definitions
    .slice(1)
    .map((definition) => definition.outputSchema),
);
assert.equal(
  activeRuntime.definitions.every(
    (definition) =>
      definition.groundedOutputSchema === undefined &&
      definition.groundedSchemaVersion === undefined &&
      definition.groundedSchemaHash === undefined,
  ),
  true,
);
for (const definition of runtimeV6.definitions) {
  assert.doesNotThrow(() =>
    assertOpenAIStructuredOutputSchema(
      toOpenAiStructuredOutputSchema(definition.outputSchema),
    ),
  );
}

const caseBundle = json(`${sourceArtifactRoot}/diagnostic-cases-v1.json`);
const diagnosticResults = json(`${sourceArtifactRoot}/diagnostic-results-v1.json`);
const replay = evaluateC1OfflineReplayV2({
  caseBundle,
  diagnosticResults,
  providerSchema,
  groundedSchema,
});
const v408ReplayCaseForFixture = replay.cases.find(
  (item) => item.case_id === "V4-08",
);
assert.ok(v408ReplayCaseForFixture);
const v408ApplicationFixture = buildV408ApplicationFixture(
  v408ReplayCaseForFixture,
);
const fixtureProviderValidator = schemaAjv.compile(providerSchema);
assert.equal(
  fixtureProviderValidator(v408ApplicationFixture.raw),
  true,
  JSON.stringify(fixtureProviderValidator.errors),
);
const v408ApplicationGrounded = groundStructuredIntakeV5(
  v408ApplicationFixture.input,
  v408ApplicationFixture.raw,
);
assert.doesNotThrow(() =>
  validateGroundedStageOutput(
    runtimeV6.definitions[0],
    v408ApplicationGrounded,
  ),
);
const v408ApplicationWritingContext =
  v408ApplicationGrounded.writing_context;
const v408ApplicationIntegrityViolations =
  collectWritingContextIntegrityViolationsV2(
    v408ApplicationFixture.input,
    v408ApplicationGrounded,
  );
const applicationFixtureChecks = [
  {
    id: "message_grounding",
    passed:
      v408ApplicationWritingContext.message_ownership.length === 1 &&
      v408ApplicationWritingContext.message_ownership[0].message_id ===
        "MSG001" &&
      v408ApplicationWritingContext.message_ownership[0].author ===
        "other_person" &&
      v408ApplicationWritingContext.message_ownership[0].status ===
        "incoming" &&
      v408ApplicationWritingContext.incoming_message_profile.message_id ===
        "MSG001",
  },
  {
    id: "candidate_absence",
    passed:
      v408ApplicationWritingContext.candidate_style_profile === null &&
      v408ApplicationWritingContext.candidate_communicative_intent === null,
  },
  {
    id: "absent_boundary_normalization",
    passed:
      v408ApplicationGrounded.decision_facts.boundary_state.kind === "none" &&
      v408ApplicationGrounded.decision_facts.boundary_state.status === "none",
  },
  {
    id: "privacy_markers",
    passed:
      JSON.stringify(v408ApplicationWritingContext.privacy_markers) ===
      JSON.stringify(["account_identifier", "email"]),
  },
  {
    id: "repeat_state",
    passed:
      v408ApplicationWritingContext.repeat_consultation_state.state ===
      "repeated_without_material_change",
  },
  {
    id: "integrity_v2",
    passed: v408ApplicationIntegrityViolations.length === 0,
  },
  {
    id: "raw_pii_absence",
    passed: collectRawPiiStrings(v408ApplicationFixture.raw).length === 0,
  },
  {
    id: "injection_and_expected_data_separation",
    passed:
      v408ApplicationGrounded.untrusted_embedded_instructions_detected ===
        true &&
      v408ApplicationFixture.expected_data_injected === false,
  },
];
const applicationFixturePassed = applicationFixtureChecks.filter(
  (item) => item.passed,
).length;
const applicationFixtureResult = {
  fixture_id: v408ApplicationFixture.fixture_id,
  evidence_role: "application_unit_only",
  provider_replay_claim: false,
  provider_quality_claim: false,
  expected_data_injected: v408ApplicationFixture.expected_data_injected,
  raw_pii_strings: collectRawPiiStrings(v408ApplicationFixture.raw).length,
  passed: applicationFixturePassed,
  total: applicationFixtureChecks.length,
  rate: applicationFixturePassed / applicationFixtureChecks.length,
  checks: applicationFixtureChecks,
};
assert.equal(applicationFixtureResult.passed, 8);
assert.equal(applicationFixtureResult.total, 8);
assert.equal(replay.verdict, "FAIL");
assert.deepEqual(
  replayResultsArtifactV1(replay, { applicationFixtureResult }),
  replayArtifact,
);
assert.equal(replay.strict_source_replay_verdict, "FAIL");
assert.equal(replay.strict_cases_passed, 5);
assert.equal(replay.application_adjudicated_verdict, "PASS");
assert.equal(replay.provider_retest_required, true);
assert.deepEqual(replay.expectation_contract_defects, [
  {
    case_id: "PAIR-02",
    path: "/latest_direct_message/user_reply_state",
    actual: "not_applicable",
    expected: "replied",
    canonical_rule: "sender_user_or_none_requires_not_applicable",
  },
]);
assert.deepEqual(replay.nonmaterial_taxonomy_equivalences, [
  {
    case_id: "V4-06",
    path: "/latest_direct_message/kind",
    actual: "question",
    expected: "schedule_coordination",
    practical_reason: "schedule_coordination",
    incoming_profile_supported: true,
    decision_policy_equal: true,
  },
]);
assert.equal(replayArtifact.expected_input_injection, 0);
assert.equal(replayArtifact.provider_calls_during_replay, 0);
assert.deepEqual(replay.metrics.strict_source_cases, {
  passed: 5,
  total: 8,
  rate: 0.625,
  evidence_status: "available",
});
for (const metricName of [
  "input_construction",
  "provider_transport",
  "raw_schema",
  "grounded_schema",
  "integrity",
  "candidate_presence",
  "constraint_provenance",
  "privacy_repeat_injection",
]) {
  assert.equal(replay.metrics[metricName].rate, 1, metricName);
}
assert.deepEqual(replay.metrics.critical_expected_subset, {
  passed: 5,
  total: 8,
  rate: 0.625,
  evidence_status: "available",
});
assert.deepEqual(replay.metrics.application_adjudicated_decision_facts, {
  passed: 8,
  total: 8,
  rate: 1,
  evidence_status: "available",
});
assert.deepEqual(replay.metrics.semantic_assertions, {
  passed: 41,
  total: 42,
  rate: 41 / 42,
  evidence_status: "available",
});
assert.deepEqual(replay.metrics.ownership, {
  passed: 7,
  total: 8,
  rate: 0.875,
  evidence_status: "available",
});
assert.deepEqual(replay.metrics.auxiliary_v3_parity, {
  passed: 4,
  total: 4,
  rate: 1,
  evidence_status: "available",
});
assert.deepEqual(replay.metrics.provider_semantic_coverage, {
  passed: 7,
  available: 7,
  unavailable: 1,
  total: 8,
  rate: 0.875,
  evidence_status: "partial",
  unavailable_cases: ["V4-08"],
});
assert.equal(replay.metrics.soft_assertions.evidence_status, "available");
const replayById = new Map(replay.cases.map((item) => [item.case_id, item]));
for (const replayCase of replay.cases) {
  const diagnosticCase = caseBundle.cases.find(
    (item) => item.case_id === replayCase.case_id,
  );
  const saved = diagnosticResults.cases.find(
    (item) =>
      item.case_id === replayCase.case_id && item.contract_variant === "v4",
  );
  assert.ok(diagnosticCase);
  assert.ok(saved?.raw_typed_projection);
  assert.equal(replayCase.input_construction_passed, true);
  assert.equal(replayCase.expected_data_injected, false);
  assert.deepEqual(
    replayCase.pre_guard_decision_facts,
    saved.raw_typed_projection.decision_facts,
  );
  assert.deepEqual(
    replayCase.extracted_message_signals,
    extractWritingSignalsFromC1ProjectionV1(saved.raw_typed_projection)
      .message_signals,
  );
  assert.equal(
    auditC1ReplayInputConstructionV1(
      diagnosticCase,
      saved.raw_typed_projection,
      replayCase.raw_v5,
    ).expected_data_injected,
    false,
  );
}
const pair01 = replayById.get("PAIR-01").grounded_output;
assert.equal(
  pair01.writing_context.relationship_dimensions.communication_context.value,
  "matching_app",
);
assert.notEqual(
  pair01.writing_context.relationship_dimensions.social_role.value,
  "stranger",
);
assert.ok(pair01.writing_context.candidate_style_profile);
const pair02 = replayById.get("PAIR-02").grounded_output;
assert.equal(pair02.writing_context.candidate_style_profile, null);
assert.equal(pair02.writing_context.candidate_communicative_intent, null);
assert.equal(
  pair02.writing_context.incoming_message_profile.evidence_state,
  "explicit",
);
assert.equal(
  pair02.writing_context.source_refs.includes("input:optional_message"),
  false,
);
const pair02Case = replayById.get("PAIR-02");
assert.equal(pair02Case.critical_expected_subset_passed, false);
assert.deepEqual(pair02Case.critical_expected_subset_mismatched_paths, [
  "/latest_direct_message/user_reply_state",
]);
assert.equal(
  pair02Case.post_guard_decision_facts.latest_direct_message.user_reply_state,
  "not_applicable",
);
assert.equal(
  pair02Case.decision_fact_adjudication.disposition,
  "expectation_contract_defect",
);
assert.equal(pair02Case.application_adjudicated_decision_facts_passed, true);
const pair03Case = replayById.get("PAIR-03");
const pair03 = pair03Case.grounded_output;
assert.equal(pair03.writing_context.relationship_dimensions.hierarchy.value, "user_is_junior");
assert.equal(pair03.writing_context.explicit_user_constraints[0].kind, "no_private_contact_at_work");
assert.deepEqual(pair03Case.pre_guard_boundary, {
  kind: "temporary_distance",
  status: "explicit",
});
assert.deepEqual(pair03Case.post_guard_boundary, {
  kind: "none",
  status: "none",
});
assert.deepEqual(pair03.decision_facts.boundary_state, {
  kind: "none",
  status: "none",
  repeated_unanswered_contact: false,
});
const pair04Case = replayById.get("PAIR-04");
assert.deepEqual(pair04Case.pre_guard_boundary, {
  kind: "no_contact",
  status: "explicit",
});
assert.deepEqual(pair04Case.post_guard_boundary, {
  kind: "no_contact",
  status: "explicit",
});
assert.deepEqual(pair04Case.grounded_output.decision_facts.boundary_state, {
  kind: "no_contact",
  status: "explicit",
  repeated_unanswered_contact: false,
});
assert.equal(
  pair04Case.grounded_output.decision_facts.contact_state.usual_cadence_relation,
  "not_applicable",
);
assert.equal(
  pair04Case.raw_v5.writing_signals.boundary_ownership_signals[0].asserted_by,
  "other_person",
);
const v405 = replayById.get("V4-05").grounded_output;
assert.equal(v405.writing_context.relationship_dimensions.romantic_stage.value, "former_partner");
assert.equal(v405.writing_context.relationship_dimensions.familiarity.value, "unknown");
const v406 = replayById.get("V4-06").grounded_output;
assert.deepEqual(
  v406.writing_context.message_ownership.map((item) => [
    item.message_id,
    item.sequence,
    item.status,
  ]),
  [
    ["MSG001", 1, "sent_by_user"],
    ["MSG002", 2, "incoming"],
    ["MSG003", 3, "unsent_candidate"],
  ],
);
assert.deepEqual(
  replayById.get("V4-06").critical_expected_subset_mismatched_paths,
  ["/latest_direct_message/kind"],
);
const v406Case = replayById.get("V4-06");
assert.equal(
  v406Case.decision_fact_adjudication.disposition,
  "nonmaterial_taxonomy_equivalence",
);
assert.equal(v406Case.application_adjudicated_decision_facts_passed, true);
const v406ExpectedTaxonomyFacts = structuredClone(
  v406Case.post_guard_decision_facts,
);
v406ExpectedTaxonomyFacts.latest_direct_message.kind =
  "schedule_coordination";
assert.deepEqual(
  buildContextualDecisionPolicyV3(v406Case.post_guard_decision_facts),
  buildContextualDecisionPolicyV3(v406ExpectedTaxonomyFacts),
);
const v407 = replayById.get("V4-07").grounded_output;
assert.equal(v407.writing_context.candidate_style_profile.register, "casual");
assert.equal(v407.writing_context.candidate_style_profile.sentence_length, "short");
assert.equal(v407.writing_context.candidate_style_profile.emoji_usage, "restrained");
assert.equal(v407.writing_context.explicit_user_constraints[0].kind, "no_self_invitation");
assert.deepEqual(
  v407.writing_context.relationship_dimensions.romantic_stage.source_refs,
  [],
);
const v408 = replayById.get("V4-08").grounded_output;
assert.equal(v408.untrusted_embedded_instructions_detected, true);
assert.deepEqual(v408.writing_context.privacy_markers, ["account_identifier", "email"]);
assert.equal(v408.writing_context.repeat_consultation_state.state, "repeated_without_material_change");
assert.equal(v408.writing_context.user_goal_detail.value, "unknown");
assert.deepEqual(v408.writing_context.language_and_expression.mixed_languages, []);
assert.deepEqual(
  replayById.get("V4-08").critical_expected_subset_mismatched_paths,
  ["/boundary_state/kind", "/boundary_state/status"],
);
const v408Case = replayById.get("V4-08");
assert.deepEqual(v408Case.post_guard_boundary, {
  kind: "none",
  status: "none",
});
assert.equal(
  v408Case.decision_fact_adjudication.disposition,
  "application_absent_boundary_normalization",
);
assert.equal(v408Case.application_adjudicated_decision_facts_passed, true);
assert.equal(v408Case.ownership_passed, false);
assert.equal(v408Case.provider_semantic_coverage, false);
assert.equal(
  v408Case.ownership_evidence_status,
  "unavailable_from_source_diagnostic",
);
assert.equal(v408Case.ownership_application_failure_attributed, false);
assert.deepEqual(v408Case.failed_semantic_assertions, [
  {
    id: "V4-08-EXPECTED-OWNERSHIP",
    fail_code: "PROVIDER_SEMANTIC_COVERAGE_UNAVAILABLE",
    attribution: "source_diagnostic",
    evidence_status: "unavailable_from_source_diagnostic",
  },
]);
assert.equal(requiredBoundaryEvidencePassed(replay.cases), true);

const guardRequest = v408ApplicationFixture.input;
const unknownBoundaryFacts = structuredClone(
  v408Case.pre_guard_decision_facts,
);
const absentBoundaryGuarded = guardDecisionFactsWithEvidenceV4(
  guardRequest,
  unknownBoundaryFacts,
  { boundary_ownership_signals: [] },
  [],
  [],
);
assert.deepEqual(absentBoundaryGuarded.boundary_state, {
  kind: "none",
  status: "none",
  repeated_unanswered_contact: false,
});

const ownedSignalDoesNotCreateBoundary = guardDecisionFactsWithEvidenceV4(
  guardRequest,
  unknownBoundaryFacts,
  {
    boundary_ownership_signals: [
      { kind: "no_contact", asserted_by: "other_person", explicit: true },
    ],
  },
  [],
  [],
);
assert.deepEqual(ownedSignalDoesNotCreateBoundary.boundary_state, {
  kind: "unknown",
  status: "unknown",
  repeated_unanswered_contact: false,
});

const topLevelBoundaryDoesNotBecomeAbsent = guardDecisionFactsWithEvidenceV4(
  guardRequest,
  unknownBoundaryFacts,
  { boundary_ownership_signals: [] },
  [{ kind: "relationship_closed", status: "explicit" }],
  [],
);
assert.deepEqual(topLevelBoundaryDoesNotBecomeAbsent.boundary_state, {
  kind: "unknown",
  status: "unknown",
  repeated_unanswered_contact: false,
});

for (const restrictiveKind of ["no_contact", "relationship_closed"]) {
  const explicitFacts = structuredClone(unknownBoundaryFacts);
  explicitFacts.boundary_state = {
    kind: restrictiveKind,
    status: "explicit",
    repeated_unanswered_contact: false,
  };
  const preserved = guardDecisionFactsWithEvidenceV4(
    guardRequest,
    explicitFacts,
    {
      boundary_ownership_signals: [
        {
          kind: restrictiveKind,
          asserted_by: "other_person",
          explicit: true,
        },
      ],
    },
    [],
    [],
  );
  assert.deepEqual(preserved.boundary_state, explicitFacts.boundary_state);
}

const blockedFacts = structuredClone(unknownBoundaryFacts);
blockedFacts.boundary_state = {
  kind: "blocked_or_restricted",
  status: "explicit",
  repeated_unanswered_contact: false,
};
const blockedPreserved = guardDecisionFactsWithEvidenceV4(
  guardRequest,
  blockedFacts,
  { boundary_ownership_signals: [] },
  [{ kind: "blocked_or_restricted", status: "explicit" }],
  [],
);
assert.deepEqual(blockedPreserved.boundary_state, blockedFacts.boundary_state);

const userPreferenceFacts = structuredClone(unknownBoundaryFacts);
userPreferenceFacts.boundary_state = {
  kind: "temporary_distance",
  status: "explicit",
  repeated_unanswered_contact: false,
};
const userPreferenceGuarded = guardDecisionFactsWithEvidenceV4(
  guardRequest,
  userPreferenceFacts,
  {
    boundary_ownership_signals: [
      { kind: "temporary_distance", asserted_by: "user", explicit: true },
    ],
  },
  [],
  [],
);
assert.deepEqual(userPreferenceGuarded.boundary_state, {
  kind: "none",
  status: "none",
  repeated_unanswered_contact: false,
});

const pair02DiagnosticCase = caseBundle.cases.find(
  (item) => item.case_id === "PAIR-02",
);
const pair02Saved = diagnosticResults.cases.find(
  (item) => item.case_id === "PAIR-02" && item.contract_variant === "v4",
);
assert.ok(pair02DiagnosticCase);
assert.ok(pair02Saved?.raw_typed_projection);
const expectedSubsetOverlayMutation = buildC1ReplayStructuredIntakeV5(
  pair02DiagnosticCase,
  pair02Saved.raw_typed_projection,
);
expectedSubsetOverlayMutation.decision_facts = overlayForRejectedMutation(
  expectedSubsetOverlayMutation.decision_facts,
  pair02DiagnosticCase.expected_decision_fact_subset,
);
assert.equal(
  auditC1ReplayInputConstructionV1(
    pair02DiagnosticCase,
    pair02Saved.raw_typed_projection,
    expectedSubsetOverlayMutation,
  ).matches_authorized_construction,
  false,
);

const v408DiagnosticCase = caseBundle.cases.find(
  (item) => item.case_id === "V4-08",
);
const v408Saved = diagnosticResults.cases.find(
  (item) => item.case_id === "V4-08" && item.contract_variant === "v4",
);
assert.ok(v408DiagnosticCase);
assert.ok(v408Saved?.raw_typed_projection);
const expectedOwnershipMutation = buildC1ReplayStructuredIntakeV5(
  v408DiagnosticCase,
  v408Saved.raw_typed_projection,
);
expectedOwnershipMutation.writing_signals.message_signals.push({
  author: v408DiagnosticCase.expected_source_ownership[0].author,
  status: v408DiagnosticCase.expected_source_ownership[0].status,
});
assert.equal(
  auditC1ReplayInputConstructionV1(
    v408DiagnosticCase,
    v408Saved.raw_typed_projection,
    expectedOwnershipMutation,
  ).matches_authorized_construction,
  false,
);

const pair03PreGuardMutation = structuredClone(replay.cases);
const mutatedPair03 = pair03PreGuardMutation.find(
  (item) => item.case_id === "PAIR-03",
);
mutatedPair03.pre_guard_decision_facts.boundary_state.kind = "none";
mutatedPair03.pre_guard_decision_facts.boundary_state.status = "none";
mutatedPair03.pre_guard_boundary = { kind: "none", status: "none" };
assert.equal(requiredBoundaryEvidencePassed(pair03PreGuardMutation), false);

const pair04PostGuardMutation = structuredClone(replay.cases);
const mutatedPair04 = pair04PostGuardMutation.find(
  (item) => item.case_id === "PAIR-04",
);
mutatedPair04.post_guard_decision_facts.boundary_state.kind = "none";
mutatedPair04.post_guard_decision_facts.boundary_state.status = "none";
mutatedPair04.post_guard_boundary = { kind: "none", status: "none" };
assert.equal(requiredBoundaryEvidencePassed(pair04PostGuardMutation), false);

const v408PostGuardMutation = structuredClone(replay.cases);
const mutatedV408 = v408PostGuardMutation.find(
  (item) => item.case_id === "V4-08",
);
mutatedV408.post_guard_decision_facts.boundary_state.kind = "unknown";
mutatedV408.post_guard_decision_facts.boundary_state.status = "unknown";
mutatedV408.post_guard_boundary = { kind: "unknown", status: "unknown" };
assert.equal(requiredBoundaryEvidencePassed(v408PostGuardMutation), false);

for (const replayCase of replay.cases) {
  const rawBefore = structuredClone(replayCase.raw_v5);
  const grounded = groundStructuredIntakeV5(
    {
      currentSituation: "Synthetic replay input.",
      optionalMessage:
        replayCase.raw_v5.decision_facts.contact_state.proposed_message_present
          ? "Synthetic candidate."
          : null,
      relationship: replayCase.raw_v5.relationship_stage,
      requestedTopics: replayCase.raw_v5.decision_facts.selected_requests,
      privacyAcknowledged: true,
    },
    replayCase.raw_v5,
  );
  assert.deepEqual(replayCase.raw_v5, rawBefore);
  assert.doesNotThrow(() =>
    validateGroundedStageOutput(runtimeV6.definitions[0], grounded),
  );
}

const groundingCases = json(
  "evals/runtime/m2-p4-i3-r1-b-grounding-cases-v1.json",
);
const replyCase = groundingCases.valid_cases.find(
  (item) => item.case_id === "GROUND-V-002",
);
assert.ok(replyCase);
const replyV4 = materialize(
  groundingCases,
  replyCase.raw_structured_intake_v4,
);

function waitFacts(proposedMessagePresent) {
  return {
    schema_version: "m2-p4-decision-facts-v2",
    relationship_stage: "ambiguous",
    selected_requests: ["decide_send_or_wait", "draft_message"],
    latest_direct_message: {
      sender: "user",
      kind: "other",
      response_expectation: "optional",
      user_reply_state: "replied",
      sns_signal_only: false,
    },
    contact_state: {
      unanswered_user_message_count: 1,
      elapsed_since_latest_user_message_minutes: 120,
      usual_cadence_relation: "within_usual",
      proposed_message_present: proposedMessagePresent,
    },
    boundary_state: {
      kind: "none",
      status: "none",
      repeated_unanswered_contact: false,
    },
    practical_reason: { kind: "none", active: false, deadline: "none" },
    information_state: {
      assessment_mode: "best_effort",
      can_proceed_without_followup: true,
      used_context_inference: false,
      unresolved_fields: [],
    },
  };
}

function toProviderV5(rawV4) {
  const rawV5 = structuredClone(rawV4);
  rawV5.schema_version = "pipeline-schema-v5.0.0";
  rawV5.writing_signals = extractWritingSignalsFromC1ProjectionV1({
    untrusted_embedded_instructions_detected:
      rawV4.untrusted_embedded_instructions_detected,
    decision_facts: rawV4.decision_facts,
    writing_context: rawV4.writing_context,
  });
  delete rawV5.writing_context;
  return rawV5;
}

const waitV4 = structuredClone(groundingCases.templates["VALID-NO-CANDIDATE"]);
waitV4.decision_facts = waitFacts(false);
const pauseV4 = structuredClone(waitV4);
pauseV4.decision_facts.boundary_state = {
  kind: "no_contact",
  status: "explicit",
  repeated_unanswered_contact: false,
};
pauseV4.boundaries = [
  {
    boundary_id: "B001",
    kind: "no_contact",
    status: "explicit",
    statement: "Synthetic explicit no-contact boundary.",
    source_refs: ["input:current_situation"],
  },
];
const replyV5 = toProviderV5(replyV4);
const waitV5 = toProviderV5(waitV4);
const pauseV5 = toProviderV5(pauseV4);
pauseV5.writing_signals.boundary_ownership_signals = [
  { kind: "no_contact", asserted_by: "other_person", explicit: true },
];

class OfflineFakeTransport {
  actualProviderCalls = 0;
  apiSpendUsd = 0;
  calls = [];
  requests = [];

  constructor(outputs) {
    this.outputs = structuredClone(outputs);
  }

  async invoke(request) {
    this.calls.push(request.stageId);
    this.requests.push(structuredClone(request));
    return {
      responseId: `offline-${request.stageId.toLowerCase()}-${this.calls.length}`,
      returnedModel: request.model,
      output: structuredClone(this.outputs[request.stageId]),
      usage: {
        inputTokens: 10,
        cachedTokens: 0,
        outputTokens: 10,
        reasoningTokens: 0,
      },
      latencyMs: 1,
    };
  }
}

function deterministicUuidFactory() {
  let sequence = 0;
  return () => {
    sequence += 1;
    return `00000000-0000-4000-8000-${String(sequence).padStart(12, "0")}`;
  };
}

function planFor(decision, basePlan) {
  const plan = structuredClone(basePlan);
  plan.selected_decision = decision;
  plan.message_draft =
    decision === "reply_now"
      ? {
          text: "Synthetic bounded reply.",
          policy: "required_now",
          use_timing: "now",
        }
      : null;
  return plan;
}

function outputsFor(pb01, decision) {
  const outputs = wait003StageOutputs();
  outputs["PB-01"] = structuredClone(pb01);
  outputs["PB-03"] = {
    schema_version: "pipeline-schema-v3.0.0",
    acknowledged_eligibility: "ready",
  };
  outputs["PB-04"] = planFor(decision, outputs["PB-04"]);
  return outputs;
}

async function executeFake(input, outputs, suffix) {
  const repository = new FakeAssessmentRepository();
  const transport = new OfflineFakeTransport(outputs);
  const application = new AssessmentApplication({
    repository,
    transport,
    model: "gpt-5.6-luna",
    promptBundleVersion: runtimeV6.promptBundleVersion,
    schemaSetVersion: runtimeV6.schemaSetVersion,
    definitions: runtimeV6.definitions,
    now: () => "2026-08-01T00:00:00.000Z",
    uuid: deterministicUuidFactory(),
  });
  const result = await application.submit(
    input,
    `90000000-0000-4000-8000-${String(suffix).padStart(12, "0")}`,
  );
  return { repository, transport, result };
}

const pipelineCases = [
  {
    input: replyCase.synthetic_assessment_input,
    raw: replyV5,
    decision: "reply_now",
  },
  {
    input: {
      currentSituation: "Synthetic sent message remains within usual cadence.",
      optionalMessage: null,
      relationship: "ambiguous",
      requestedTopics: ["decide_send_or_wait", "draft_message"],
      privacyAcknowledged: true,
    },
    raw: waitV5,
    decision: "wait_and_reassess",
  },
  {
    input: {
      currentSituation: "Synthetic consultation records an explicit no-contact boundary.",
      optionalMessage: null,
      relationship: "ambiguous",
      requestedTopics: ["decide_send_or_wait", "draft_message"],
      privacyAcknowledged: true,
    },
    raw: pauseV5,
    decision: "pause_additional_contact",
  },
];

let fakePipelinePassed = 0;
let downstreamWritingSignalsLeakage = 0;
let downstreamWritingContextLeakage = 0;
for (const [index, pipelineCase] of pipelineCases.entries()) {
  const providerValidator = schemaAjv.compile(providerSchema);
  assert.equal(providerValidator(pipelineCase.raw), true, JSON.stringify(providerValidator.errors));
  const grounded = groundStructuredIntakeV5(pipelineCase.input, pipelineCase.raw);
  assert.equal("writing_signals" in grounded, false);
  assert.equal(isObject(grounded.writing_context), true);
  assert.doesNotThrow(() => validateWritingContextIntegrityV2(pipelineCase.input, grounded));
  assert.deepEqual(
    collectWritingContextIntegrityViolationsV2(pipelineCase.input, grounded),
    [],
  );
  const execution = await executeFake(
    pipelineCase.input,
    outputsFor(pipelineCase.raw, pipelineCase.decision),
    index + 1,
  );
  assert.equal(execution.result.eligibility, "ready");
  assert.equal(execution.result.decision, pipelineCase.decision);
  assert.equal(execution.result.report.schemaVersion, "m2-p3-runtime-report-v1");
  assert.equal(execution.result.decisionCard.schemaVersion, "m2-p3-decision-card-v1");
  assert.equal(execution.transport.actualProviderCalls, 0);
  assert.equal(execution.transport.apiSpendUsd, 0);
  assert.equal(execution.repository.actualSupabaseCalls, 0);
  assert.equal(execution.repository.reports.size, 1);
  assert.deepEqual(execution.transport.calls, [
    "PB-01",
    "PB-02",
    "PB-03",
    "PB-04",
    "PB-05",
    "PB-06",
  ]);
  const pb01Request = execution.transport.requests[0];
  assert.equal(pb01Request.schemaName, "pb_01_structure_v5");
  assert.equal(pb01Request.schemaVersion, "pipeline-schema-v5.0.0");
  assert.equal(pb01Request.promptVersion, "v5.0.0");
  assert.equal("writing_signals" in pipelineCase.raw, true);
  for (const request of execution.transport.requests.slice(1)) {
    downstreamWritingSignalsLeakage += countKeys(request.input, "writing_signals");
    downstreamWritingContextLeakage += countKeys(request.input, "writing_context");
    const intake = request.input.structured_intake;
    if (isObject(intake)) {
      assert.equal(intake.schema_version, "pipeline-schema-v3.0.0");
    }
  }
  fakePipelinePassed += 1;
}
assert.equal(fakePipelinePassed, 3);
assert.equal(downstreamWritingSignalsLeakage, 0);
assert.equal(downstreamWritingContextLeakage, 0);

const serviceSource = source("lib/assessment/runtime/service.ts");
assert.equal(
  serviceSource.includes("loadM2P4GroundingResponsibilityRuntimeStageCatalog"),
  false,
);
assert.equal(
  serviceSource.includes("loadM2P4ProductQualityRuntimeStageCatalog"),
  true,
);

for (const jsonPath of [
  `${artifactRoot}/postmortem-contract-v1.json`,
  `${artifactRoot}/responsibility-matrix-v1.json`,
  `${artifactRoot}/replay-results-v1.json`,
  `${artifactRoot}/capabilities-v1.json`,
  "lib/assessment/runtime/contracts/structured-intake-v5.schema.json",
  "lib/assessment/runtime/contracts/runtime-stage-catalog-v6.json",
]) {
  assert.doesNotThrow(() => JSON.parse(source(jsonPath)), jsonPath);
}

console.log("M2_P4_I3_R1_C1_R1_GROUNDING_RESPONSIBILITY: PASS");
console.log("c1_evidence_immutable: PASS");
console.log("provider_schema_v5: PASS");
console.log("provider_bookkeeping_fields: 0");
console.log("acceptance_sync_scope: 8/8");
console.log("final_correction_scope: 9/9");
console.log("immutable_implementation_scope: 31/31");
console.log("replay_input_construction: 8/8");
console.log("expected_input_injection: 0");
console.log("strict_source_replay_verdict: FAIL");
console.log("strict_source_replay_cases: 5/8");
console.log("application_adjudicated_decision_facts: 8/8");
console.log("writing_context_integrity_v2: 8/8");
console.log("decision_facts_expected_subset: 5/8");
console.log("semantic_assertions: 41/42");
console.log("ownership_parity: 7/8");
console.log("pair_03_boundary_regression: resolved");
console.log("pair_04_no_contact: preserved");
console.log("v4_08_absent_boundary: normalized_none_none");
console.log("v4_08_ownership_evidence: unavailable_from_source_diagnostic");
console.log("oracle_contamination_mutations_rejected: 4/4");
console.log("absent_boundary_mutation_rejected: 1/1");
console.log("application_canonical_fixtures: 8/8");
console.log("provider_semantic_coverage: 7/8");
console.log("provider_retest_required: true");
console.log("fake_pipeline: 3/3");
console.log("downstream_writing_signals_leakage: 0");
console.log("downstream_writing_context_leakage: 0");
console.log("openai_calls: 0");
console.log("db_operations: 0");
console.log("holdout_use: 0");
console.log("active_runtime_changed: false");
console.log("application_architecture_accepted: true");
console.log("application_offline_implementation_accepted: true");
console.log("provider_quality_accepted: false");
console.log("r1_c1_r2_authorized: false");
console.log("c2_eligible: false");
console.log("c2_authorized: false");
