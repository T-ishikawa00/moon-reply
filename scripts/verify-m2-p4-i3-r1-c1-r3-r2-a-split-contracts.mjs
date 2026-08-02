import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import Ajv2020 from "ajv/dist/2020.js";

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

const taskId = "M2-P4-I3-R1-C1-R3-R2-A";
const baseline = "7a4e5d3187e1731d677cc5aa19c23acdeb535ed8";
const acceptedImplementationCommit =
  "2a5c8ed6ea02a4173c50a4d1e31ad54a857d707f";
const mainBaseline = "61e33a10e195fad17e253a6b9719217e1992f273";
const expectedBranch = "feat/m2-p4-i3-r1-c1-r3-r2-a-split-contracts";

const paths = {
  baseSchema:
    "lib/assessment/runtime/contracts/base-structured-intake-v1.schema.json",
  candidateSchema:
    "lib/assessment/runtime/contracts/candidate-analysis-v1.schema.json",
  typedContract:
    "lib/assessment/runtime/contracts/split-stage-contracts-v1.ts",
  topology:
    "evals/runtime/m2-p4-i3-r1-c1-r3-r2-a/stage-topology-v1.json",
  capabilities:
    "evals/runtime/m2-p4-i3-r1-c1-r3-r2-a/capabilities-v1.json",
  verifier:
    "scripts/verify-m2-p4-i3-r1-c1-r3-r2-a-split-contracts.mjs",
  review: "docs/phase2/TASK_M2_P4_I3_R1_C1_R3_R2_A_REVIEW.md",
  currentFocus: "docs/CURRENT_FOCUS.md",
  wbs: "docs/WBS.md",
  handoff: "docs/CODEX_HANDOFF.md",
  acceptedPlanning:
    "docs/phase2/M2_P4_I3_R1_C1_R3_R2_CANDIDATE_SOURCE_ISOLATION_PLAN.md",
  acceptedArchitecture:
    "evals/runtime/m2-p4-i3-r1-c1-r3-r2/architecture-contract-v1.json",
  acceptedRouting:
    "evals/runtime/m2-p4-i3-r1-c1-r3-r2/payload-routing-matrix-v1.json",
  acceptedCounterfactual:
    "evals/runtime/m2-p4-i3-r1-c1-r3-r2/counterfactual-suite-v1.json",
  acceptedSafety:
    "evals/runtime/m2-p4-i3-r1-c1-r3-r2/safety-failure-matrix-v1.json",
  legacySchema:
    "lib/assessment/runtime/contracts/structured-intake-v5.schema.json",
};

const exactPaths = [
  paths.baseSchema,
  paths.candidateSchema,
  paths.typedContract,
  paths.topology,
  paths.capabilities,
  paths.verifier,
  paths.review,
  paths.currentFocus,
  paths.wbs,
  paths.handoff,
];

const acceptedPlanningPaths = [
  paths.acceptedPlanning,
  paths.acceptedArchitecture,
  paths.acceptedRouting,
  paths.acceptedCounterfactual,
  paths.acceptedSafety,
];

const acceptanceSyncPaths = [
  paths.capabilities,
  paths.review,
  paths.verifier,
  paths.currentFocus,
  paths.wbs,
  paths.handoff,
];

const protectedImplementationPaths = [
  paths.baseSchema,
  paths.candidateSchema,
  paths.typedContract,
  paths.topology,
];

const expectedBaseRootProperties = [
  "schema_version",
  "relationship_stage",
  "user_goal",
  "timeline",
  "boundaries",
  "context",
  "observed_facts",
  "user_assumptions",
  "user_emotions",
  "material_unknowns",
  "safety_signals",
  "untrusted_embedded_instructions_detected",
  "context_inferences",
  "decision_facts",
  "base_writing_signals",
];

const expectedCandidateRootProperties = [
  "candidate_style_profile",
  "candidate_communicative_intent",
  "candidate_language_expression",
  "candidate_safety_signals",
];

const expectedBaseSourceRefs = [
  "input:current_situation",
  "input:relationship",
  "input:requested_topics",
];

const expectedBaseWritingSignalFields = [
  "schema_version",
  "relationship_dimensions",
  "message_signals",
  "incoming_message_profile",
  "user_goal_detail",
  "explicit_user_constraints",
  "communication_pattern",
  "channel_and_timing",
  "language_and_expression",
  "repeat_consultation_state",
  "privacy_markers",
  "boundary_ownership_signals",
];

const forbiddenCandidatePropertyNames = [
  "timeline",
  "context",
  "observed_facts",
  "material_unknowns",
  "relationship_stage",
  "decision_facts",
  "incoming_message_facts",
  "boundary_facts",
  "source_refs",
  "message_id",
  "event_id",
  "fact_id",
  "boundary_id",
  "context_id",
  "inference_id",
  "sequence",
  "candidate_text",
  "optional_message",
  "raw_candidate",
  "response_id",
  "usage",
  "latency",
  "stage_id",
  "expected",
  "oracle",
  "case_id",
  "confidence",
  "probability",
];

const requiredRuntimeConstants = [
  "SPLIT_STAGE_CONTRACT_VERSION",
  "BASE_STRUCTURED_INTAKE_SCHEMA_VERSION",
  "CANDIDATE_ANALYSIS_SCHEMA_VERSION",
  "STAGE_TOPOLOGY_VERSIONS",
  "LEGACY_SIX_STAGE_TOPOLOGY",
  "SPLIT_BASE_CANDIDATE_STAGE_TOPOLOGY",
  "BASE_SOURCE_REFS",
  "CANDIDATE_SAFETY_SIGNAL_CODES",
  "CANDIDATE_ENVELOPE_STATES",
  "APPLICATION_CANONICAL_BASE_FIELD_MAP",
];

const requiredTypeExports = [
  "StageTopologyVersionV1",
  "LegacyStageIdV1",
  "SplitStageIdV1",
  "StageTopologyEntryV1",
  "BaseProviderInputV1",
  "CandidateProviderInputV1",
  "CandidateMetadataV1",
  "CandidateStyleProfileV1",
  "CandidateCommunicativeIntentV1",
  "CandidateLanguageExpressionV1",
  "CandidateSafetySignalCodeV1",
  "CandidateSafetySignalsV1",
  "CandidateProviderOutputV1",
  "CandidateAnalysisV1",
  "CandidateAnalysisStatusV1",
  "CandidateSafetyStatusV1",
  "CandidateEnvelopeV1",
  "CandidateEnvelopeTypeAssertionsV1",
  "ApplicationCanonicalBaseFieldMapV1",
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
      ...normalizedPaths(git(["ls-files", "--others", "--exclude-standard"])),
    ]),
  );
}

function historicalTaskPaths(startCommit, endCommit) {
  return sorted(
    normalizedPaths(git(["diff", "--name-only", startCommit, endCommit, "--"])),
  );
}

function assertMatchesCommit(relativePath, commit) {
  const changed = git(["diff", "--name-only", commit, "--", relativePath]).trim();
  assert.equal(
    changed,
    "",
    `accepted implementation blob changed: ${relativePath}`,
  );
}

function sha256(relativePath) {
  return createHash("sha256").update(readFileSync(absolute(relativePath))).digest("hex");
}

function clone(value) {
  return structuredClone(value);
}

function walk(value, visitor, currentPath = []) {
  visitor(value, currentPath);
  if (Array.isArray(value)) {
    value.forEach((item, index) => walk(item, visitor, [...currentPath, index]));
    return;
  }
  if (value !== null && typeof value === "object") {
    Object.entries(value).forEach(([key, item]) =>
      walk(item, visitor, [...currentPath, key]),
    );
  }
}

function schemaSurfaceNames(schema) {
  const names = [];
  walk(schema, (value, currentPath) => {
    if (value === null || typeof value !== "object" || Array.isArray(value)) {
      return;
    }
    for (const containerKey of ["properties", "$defs"]) {
      const container = value[containerKey];
      if (container !== null && typeof container === "object" && !Array.isArray(container)) {
        for (const name of Object.keys(container)) {
          names.push({
            name,
            path: [...currentPath, containerKey, name].join("/"),
          });
        }
      }
    }
  });
  return names;
}

function assertClosedRequiredObjects(schema, label) {
  walk(schema, (value, currentPath) => {
    if (
      value === null ||
      typeof value !== "object" ||
      Array.isArray(value) ||
      value.type !== "object" ||
      value.properties === undefined
    ) {
      return;
    }
    assert.equal(
      value.additionalProperties,
      false,
      `${label} object must be closed at ${currentPath.join("/")}`,
    );
    assert.deepEqual(
      sorted(value.required ?? []),
      sorted(Object.keys(value.properties)),
      `${label} object must require every property at ${currentPath.join("/")}`,
    );
  });
}

function assertLocalRefsOnly(schema, label) {
  const definitionNames = new Set(Object.keys(schema.$defs ?? {}));
  walk(schema, (value, currentPath) => {
    if (value === null || typeof value !== "object" || Array.isArray(value)) {
      return;
    }
    if (typeof value.$ref !== "string") {
      return;
    }
    assert.match(
      value.$ref,
      /^#\/\$defs\/[A-Za-z0-9_-]+$/u,
      `${label} external or unsupported ref at ${currentPath.join("/")}`,
    );
    const definitionName = value.$ref.slice("#/$defs/".length);
    assert.ok(
      definitionNames.has(definitionName),
      `${label} unresolved local ref ${value.$ref}`,
    );
  });
}

function assertForbiddenKeywordsAbsent(schema, label) {
  const forbidden = new Set([
    "default",
    "patternProperties",
    "unevaluatedProperties",
  ]);
  walk(schema, (value, currentPath) => {
    if (value === null || typeof value !== "object" || Array.isArray(value)) {
      return;
    }
    for (const key of Object.keys(value)) {
      assert.ok(
        !forbidden.has(key),
        `${label} forbidden keyword ${key} at ${currentPath.join("/")}`,
      );
    }
  });
}

function collectCandidateSafetyUnion(matrix) {
  const values = new Set();
  walk(matrix, (value) => {
    if (value === null || typeof value !== "object" || Array.isArray(value)) {
      return;
    }
    if (Array.isArray(value.candidate_semantic_signals)) {
      value.candidate_semantic_signals.forEach((signal) => values.add(signal));
    }
  });
  return sorted(values);
}

function assertFixtureRejected(validate, fixture, label) {
  assert.equal(validate(fixture), false, `${label} must be rejected`);
  assert.ok(validate.errors?.length, `${label} must expose AJV errors`);
}

const parsed = {
  baseSchema: json(paths.baseSchema),
  candidateSchema: json(paths.candidateSchema),
  topology: json(paths.topology),
  capabilities: json(paths.capabilities),
};

const legacySchema = json(paths.legacySchema);
const safetyMatrix = json(paths.acceptedSafety);
const typedContractSource = source(paths.typedContract);
const contractModule = await import(pathToFileURL(absolute(paths.typedContract)).href);

assert.equal(new Set(exactPaths).size, exactPaths.length, "duplicate scope paths");
assert.equal(
  new Set(acceptanceSyncPaths).size,
  acceptanceSyncPaths.length,
  "duplicate acceptance-sync paths",
);
assert.equal(parsed.topology.exact_scope.count, 10);
assert.equal(parsed.topology.exact_scope.value, "10/10");
assert.deepEqual(parsed.topology.exact_scope.paths, exactPaths);
assert.equal(new Set(parsed.topology.exact_scope.paths).size, 10);
assert.equal(parsed.capabilities.exact_scope, "10/10");
assert.deepEqual(parsed.capabilities.exact_mutation_paths, exactPaths);
assert.equal(new Set(parsed.capabilities.exact_mutation_paths).size, 10);
assert.equal(parsed.capabilities.exact_mutation_path_count, 10);
assert.equal(parsed.capabilities.acceptance_sync_exact_scope, "6/6");
assert.deepEqual(
  parsed.capabilities.acceptance_sync_exact_paths,
  acceptanceSyncPaths,
);
assert.equal(parsed.capabilities.acceptance_sync_exact_path_count, 6);
assert.deepEqual(
  historicalTaskPaths(baseline, acceptedImplementationCommit),
  sorted(exactPaths),
);
assert.deepEqual(currentTaskPaths(baseline), sorted(exactPaths));
assert.deepEqual(
  currentTaskPaths(acceptedImplementationCommit),
  sorted(acceptanceSyncPaths),
);

assert.equal(git(["branch", "--show-current"]).trim(), expectedBranch);
assert.equal(git(["rev-parse", "main"]).trim(), mainBaseline);
assert.equal(git(["rev-parse", "origin/main"]).trim(), mainBaseline);
git(["merge-base", "--is-ancestor", baseline, "HEAD"]);

for (const protectedPath of protectedImplementationPaths) {
  assertMatchesCommit(protectedPath, acceptedImplementationCommit);
}

for (const protectedPath of acceptedPlanningPaths) {
  const expectedBlob = git(["rev-parse", `${baseline}:${protectedPath}`]).trim();
  const actualBlob = git(["hash-object", protectedPath]).trim();
  assert.equal(actualBlob, expectedBlob, `protected Planning blob changed: ${protectedPath}`);
}

const baselineContractPaths = new Set(
  normalizedPaths(
    git([
      "ls-tree",
      "-r",
      "--name-only",
      baseline,
      "--",
      "lib/assessment/runtime/contracts",
    ]),
  ),
);
const taskPathSet = new Set(currentTaskPaths(baseline));
const changedExistingContractPaths = [...taskPathSet].filter((item) =>
  baselineContractPaths.has(item),
);
assert.deepEqual(changedExistingContractPaths, [], "existing contract blob changed");

const allowedNewRuntimeContracts = new Set([
  paths.baseSchema,
  paths.candidateSchema,
  paths.typedContract,
]);
const protectedRuntimeChanges = [...taskPathSet].filter(
  (item) =>
    (item.startsWith("lib/assessment/runtime/") &&
      !allowedNewRuntimeContracts.has(item)) ||
    item.startsWith("supabase/") ||
    item === "package.json" ||
    item === "package-lock.json" ||
    item.endsWith(".developer.md"),
);
assert.deepEqual(
  protectedRuntimeChanges,
  [],
  "existing Runtime, Prompt, Schema, Pipeline, Service, package, or DB path changed",
);

for (const [label, schema] of [
  ["Base", parsed.baseSchema],
  ["Candidate", parsed.candidateSchema],
]) {
  assert.equal(schema.$schema, "https://json-schema.org/draft/2020-12/schema");
  assert.equal(schema.type, "object");
  assert.equal(schema.additionalProperties, false);
  assertClosedRequiredObjects(schema, label);
  assertLocalRefsOnly(schema, label);
  assertForbiddenKeywordsAbsent(schema, label);
}

assert.deepEqual(Object.keys(parsed.baseSchema.properties), expectedBaseRootProperties);
assert.deepEqual(parsed.baseSchema.required, expectedBaseRootProperties);
assert.equal(
  parsed.baseSchema.properties.schema_version.const,
  "pipeline-schema-base-v1.0.0",
);
assert.deepEqual(
  Object.keys(parsed.candidateSchema.properties),
  expectedCandidateRootProperties,
);
assert.deepEqual(parsed.candidateSchema.required, expectedCandidateRootProperties);
assert.equal("schema_version" in parsed.candidateSchema.properties, false);

assert.deepEqual(parsed.baseSchema.$defs.source_ref.enum, expectedBaseSourceRefs);
assert.equal(source(paths.baseSchema).includes("input:optional_message"), false);
assert.equal(source(paths.baseSchema).includes("optional_message"), false);
assert.equal(source(paths.baseSchema).includes("proposed_message_present"), false);
assert.deepEqual(
  Object.keys(parsed.baseSchema.$defs.base_writing_signals.properties),
  expectedBaseWritingSignalFields,
);
assert.deepEqual(
  parsed.baseSchema.$defs.base_writing_signals.required,
  expectedBaseWritingSignalFields,
);
assert.equal(
  parsed.baseSchema.$defs.decision_facts.properties.schema_version.const,
  "m2-p4-base-decision-facts-v1",
);
assert.deepEqual(
  Object.keys(parsed.baseSchema.$defs.decision_facts.properties.contact_state.properties),
  [
    "unanswered_user_message_count",
    "elapsed_since_latest_user_message_minutes",
    "usual_cadence_relation",
  ],
);

const baseSurfaceNames = schemaSurfaceNames(parsed.baseSchema);
assert.deepEqual(
  baseSurfaceNames.filter(({ name }) => name.toLowerCase().includes("candidate")),
  [],
  "Candidate field or definition leaked into Base Schema",
);

const baseBasisValues = Object.entries(parsed.baseSchema.$defs)
  .filter(([name]) => name.endsWith("_basis"))
  .flatMap(([, definition]) => definition.enum ?? []);
assert.equal(baseBasisValues.includes("optional_message"), false);
assert.ok(
  baseBasisValues.every((value) =>
    [
      "current_situation_explicit",
      "current_situation_inferred",
      "relationship_chip",
      "requested_topics",
      "unresolved",
    ].includes(value),
  ),
);

const unchangedRootProperties = [
  "relationship_stage",
  "user_goal",
  "timeline",
  "boundaries",
  "context",
  "observed_facts",
  "user_assumptions",
  "user_emotions",
  "material_unknowns",
  "safety_signals",
  "untrusted_embedded_instructions_detected",
  "context_inferences",
];
for (const propertyName of unchangedRootProperties) {
  assert.deepEqual(
    parsed.baseSchema.properties[propertyName],
    legacySchema.properties[propertyName],
    `Base root semantics drifted at ${propertyName}`,
  );
}

const unchangedDefinitionNames = [
  "source_refs",
  "relationship_stage",
  "timeline_event",
  "boundary",
  "context_item",
  "observed_fact",
  "subjective_item",
  "material_unknown",
  "safety_signal",
  "context_inference",
  "romantic_stage_signal",
  "social_role_signal",
  "hierarchy_signal",
  "familiarity_signal",
  "communication_context_signal",
  "observed_register_signal",
  "relationship_dimension_signals",
  "message_signal",
  "dialogue_act_signal",
  "practical_requirement_signal",
  "incoming_message_signal_profile",
  "user_goal_signal",
  "explicit_constraint_signal",
  "communication_pattern_signal",
  "channel_and_timing_signal",
  "language_and_expression_signal",
  "repeat_consultation_signal",
  "privacy_marker_signal",
  "boundary_ownership_signal",
];
for (const definitionName of unchangedDefinitionNames) {
  assert.deepEqual(
    parsed.baseSchema.$defs[definitionName],
    legacySchema.$defs[definitionName],
    `Base definition semantics drifted at ${definitionName}`,
  );
}

const candidateSurfaceNames = schemaSurfaceNames(parsed.candidateSchema);
for (const forbiddenName of forbiddenCandidatePropertyNames) {
  assert.deepEqual(
    candidateSurfaceNames.filter(({ name }) => name === forbiddenName),
    [],
    `forbidden Candidate property or definition: ${forbiddenName}`,
  );
}

assert.deepEqual(
  Object.keys(parsed.candidateSchema.$defs.candidate_style_profile.properties),
  [
    "register",
    "sentence_length",
    "sentence_ending",
    "punctuation",
    "emoji_usage",
    "exclamation_usage",
    "softness",
    "directness",
    "invitation_style",
    "reply_pressure",
  ],
);
assert.deepEqual(
  parsed.candidateSchema.$defs.candidate_style_profile,
  legacySchema.$defs.candidate_style_signal_profile,
);

const candidateIntent = parsed.candidateSchema.$defs.candidate_communicative_intent;
const legacyCandidateIntent = legacySchema.$defs.candidate_intent_signal_profile;
assert.deepEqual(
  Object.keys(candidateIntent.properties),
  Object.keys(legacyCandidateIntent.properties),
);
for (const propertyName of Object.keys(candidateIntent.properties)) {
  if (propertyName === "question_count") {
    assert.equal(candidateIntent.properties[propertyName].type, "integer");
    assert.equal(
      candidateIntent.properties[propertyName].minimum,
      legacyCandidateIntent.properties[propertyName].minimum,
    );
    assert.equal(
      candidateIntent.properties[propertyName].maximum,
      legacyCandidateIntent.properties[propertyName].maximum,
    );
  } else if (propertyName === "invitation_presence") {
    assert.equal(candidateIntent.properties[propertyName].type, "boolean");
  } else {
    assert.deepEqual(
      candidateIntent.properties[propertyName],
      legacyCandidateIntent.properties[propertyName],
    );
  }
}

assert.deepEqual(
  Object.keys(parsed.candidateSchema.$defs.candidate_language_expression.properties),
  [
    "primary_language",
    "mixed_languages",
    "dialect_or_regional_expression",
    "intentional_nonstandard_expression",
    "possible_typo",
  ],
);
for (const propertyName of Object.keys(
  parsed.candidateSchema.$defs.candidate_language_expression.properties,
)) {
  assert.deepEqual(
    parsed.candidateSchema.$defs.candidate_language_expression.properties[
      propertyName
    ],
    legacySchema.$defs.language_and_expression_signal.properties[propertyName],
  );
}

const safetyUnion = collectCandidateSafetyUnion(safetyMatrix);
const candidateSafetyCodes = sorted(
  parsed.candidateSchema.$defs.candidate_safety_signal_code.enum,
);
assert.equal(safetyUnion.length, 29);
assert.deepEqual(candidateSafetyCodes, safetyUnion);
assert.equal(
  parsed.candidateSchema.$defs.candidate_safety_signals.additionalProperties,
  false,
);
assert.deepEqual(
  parsed.candidateSchema.$defs.candidate_safety_signals.required,
  ["untrusted_embedded_instruction_detected", "signal_codes"],
);
assert.equal(
  parsed.candidateSchema.$defs.candidate_safety_signals.properties.signal_codes
    .maxItems,
  29,
);
assert.equal(
  parsed.candidateSchema.$defs.candidate_safety_signals.properties.signal_codes
    .uniqueItems,
  true,
);

for (const constantName of requiredRuntimeConstants) {
  assert.ok(
    Object.hasOwn(contractModule, constantName),
    `missing runtime contract constant ${constantName}`,
  );
}
for (const typeName of requiredTypeExports) {
  assert.match(
    typedContractSource,
    new RegExp(`export\\s+type\\s+${typeName}\\b`, "u"),
    `missing type export ${typeName}`,
  );
}
for (const forbiddenPattern of [
  /\bimport\b/u,
  /\brequire\s*\(/u,
  /\bprocess\s*\./u,
  /\bfetch\s*\(/u,
  /\bXMLHttpRequest\b/u,
  /\bexport\s+(?:async\s+)?function\b/u,
]) {
  assert.doesNotMatch(typedContractSource, forbiddenPattern);
}

assert.equal(
  contractModule.SPLIT_STAGE_CONTRACT_VERSION,
  "m2-p4-split-stage-contracts-v1",
);
assert.equal(
  contractModule.BASE_STRUCTURED_INTAKE_SCHEMA_VERSION,
  "pipeline-schema-base-v1.0.0",
);
assert.equal(
  contractModule.CANDIDATE_ANALYSIS_SCHEMA_VERSION,
  "pipeline-schema-candidate-v1.0.0",
);
assert.deepEqual(contractModule.STAGE_TOPOLOGY_VERSIONS, [
  "legacy-six-v1",
  "split-base-candidate-v1",
]);
assert.deepEqual(
  contractModule.LEGACY_SIX_STAGE_TOPOLOGY,
  parsed.topology.stage_topologies.legacy_six,
);
assert.deepEqual(
  contractModule.SPLIT_BASE_CANDIDATE_STAGE_TOPOLOGY,
  parsed.topology.stage_topologies.split_base_candidate,
);
assert.deepEqual(contractModule.BASE_SOURCE_REFS, expectedBaseSourceRefs);
assert.deepEqual(contractModule.BASE_SOURCE_REFS, parsed.topology.base_source_ref_allowlist);
assert.deepEqual(
  sorted(contractModule.CANDIDATE_SAFETY_SIGNAL_CODES),
  safetyUnion,
);
assert.equal(Object.keys(contractModule.CANDIDATE_ENVELOPE_STATES).length, 4);
assert.deepEqual(
  contractModule.CANDIDATE_ENVELOPE_STATES,
  parsed.topology.candidate_envelope_states,
);
assert.deepEqual(
  contractModule.APPLICATION_CANONICAL_BASE_FIELD_MAP,
  parsed.topology.application_canonical_base_field_map,
);

assert.equal(parsed.topology.contract_version, "m2-p4-i3-r1-c1-r3-r2-a-stage-topology-v1");
assert.equal(parsed.topology.task_id, taskId);
assert.equal(parsed.topology.accepted_planning_commit, "212720bba2ebb805da9ef701d645359a6bd470a7");
assert.equal(parsed.topology.acceptance_commit, baseline);
assert.equal(parsed.topology.implementation_baseline, baseline);
assert.equal(parsed.topology.branch, expectedBranch);
assert.equal(parsed.topology.pb_01c_call_condition, "trim(optional_message).length > 0");
assert.equal(parsed.topology.null_candidate_provider_calls, 0);
assert.equal(
  parsed.topology.persistence_of_skipped_row,
  "planned_in_R3_R2_C_not_implemented",
);

const hashes = {
  base_schema: sha256(paths.baseSchema),
  candidate_schema: sha256(paths.candidateSchema),
  typescript_contract: sha256(paths.typedContract),
};
assert.deepEqual(parsed.topology.sha256, hashes);
assert.equal(parsed.capabilities.base_schema_sha256, hashes.base_schema);
assert.equal(parsed.capabilities.candidate_schema_sha256, hashes.candidate_schema);
assert.equal(parsed.capabilities.typescript_contract_sha256, hashes.typescript_contract);

const ajv = new Ajv2020({
  allErrors: true,
  strict: true,
  allowUnionTypes: true,
});
const validateBase = ajv.compile(parsed.baseSchema);
const validateCandidate = ajv.compile(parsed.candidateSchema);

const validBaseFixture = {
  schema_version: "pipeline-schema-base-v1.0.0",
  relationship_stage: "ambiguous",
  user_goal: "decide_send_or_wait",
  timeline: [],
  boundaries: [],
  context: [],
  observed_facts: [],
  user_assumptions: [],
  user_emotions: [],
  material_unknowns: [],
  safety_signals: [],
  untrusted_embedded_instructions_detected: false,
  context_inferences: [],
  decision_facts: {
    schema_version: "m2-p4-base-decision-facts-v1",
    relationship_stage: "ambiguous",
    selected_requests: ["decide_send_or_wait"],
    latest_direct_message: {
      sender: "none",
      kind: "none",
      response_expectation: "none",
      user_reply_state: "not_applicable",
      sns_signal_only: false,
    },
    contact_state: {
      unanswered_user_message_count: null,
      elapsed_since_latest_user_message_minutes: null,
      usual_cadence_relation: "not_applicable",
    },
    boundary_state: {
      kind: "none",
      status: "none",
      repeated_unanswered_contact: false,
    },
    practical_reason: {
      kind: "none",
      active: false,
      deadline: "none",
    },
    information_state: {
      assessment_mode: "best_effort",
      can_proceed_without_followup: true,
      used_context_inference: false,
      unresolved_fields: [],
    },
  },
  base_writing_signals: {
    schema_version: "m2-p4-base-writing-signals-v1",
    relationship_dimensions: {
      romantic_stage: { value: "ambiguous", basis: "relationship_chip" },
      social_role: { value: "unknown", basis: "unresolved" },
      hierarchy: { value: "unknown", basis: "unresolved" },
      familiarity: { value: "unknown", basis: "unresolved" },
      communication_context: { value: "private", basis: "current_situation_explicit" },
      observed_register: { value: "unknown", basis: "unresolved" },
    },
    message_signals: [],
    incoming_message_profile: {
      dialogue_acts: [],
      unanswered_obligations: [],
      practical_requirements: [],
      closure_signal: "none",
      response_expectation: "none",
      present: false,
    },
    user_goal_detail: {
      value: "unknown",
      basis: "requested_topics",
    },
    explicit_user_constraints: [],
    communication_pattern: {
      usual_register: "unknown",
      usual_length: "unknown",
      usual_emoji_pattern: "unknown",
      usual_response_cadence_summary: null,
      usual_initiator: "unknown",
      reciprocal_style_summary: null,
      basis: "unresolved",
    },
    channel_and_timing: {
      channel: "unknown",
      relative_timing: "unknown",
      basis: "unresolved",
    },
    language_and_expression: {
      primary_language: "ja",
      mixed_languages: [],
      dialect_or_regional_expression: "absent",
      established_shared_expression: "unknown",
      intentional_nonstandard_expression: "absent",
      possible_typo: "absent",
      basis: "current_situation_explicit",
    },
    repeat_consultation_state: {
      state: "first_assessment",
      changed_fact_ids: [],
      basis: "current_situation_explicit",
    },
    privacy_markers: [],
    boundary_ownership_signals: [],
  },
};

const validCandidateFixture = {
  candidate_style_profile: {
    register: "casual",
    sentence_length: "short",
    sentence_ending: "soft",
    punctuation: "standard",
    emoji_usage: "restrained",
    exclamation_usage: "none",
    softness: "high",
    directness: "balanced",
    invitation_style: "tentative",
    reply_pressure: "low",
  },
  candidate_communicative_intent: {
    gratitude_strength: "low",
    apology_strength: "none",
    question_count: 1,
    invitation_presence: true,
    invitation_specificity: "tentative",
    affection_strength: "none",
    commitment_strength: "none",
    response_pressure: "low",
    boundary_strength: "none",
    conversation_closure: "none",
    practical_requirement: ["answer_question"],
  },
  candidate_language_expression: {
    primary_language: "ja",
    mixed_languages: [],
    dialect_or_regional_expression: "absent",
    intentional_nonstandard_expression: "absent",
    possible_typo: "absent",
  },
  candidate_safety_signals: {
    untrusted_embedded_instruction_detected: false,
    signal_codes: [],
  },
};

assert.equal(validateBase(validBaseFixture), true, JSON.stringify(validateBase.errors));
assert.equal(
  validateCandidate(validCandidateFixture),
  true,
  JSON.stringify(validateCandidate.errors),
);

const baseInvalidFixtures = [
  [
    "Base optional-message source ref",
    Object.assign(clone(validBaseFixture), {
      timeline: [
        {
          event_id: "E001",
          sequence: 1,
          actor: "user",
          statement: "Candidate-owned text must not become a Base fact.",
          source_refs: ["input:optional_message"],
        },
      ],
    }),
  ],
  [
    "Base Candidate root field",
    Object.assign(clone(validBaseFixture), { candidate_analysis: {} }),
  ],
  [
    "Base Candidate writing field",
    (() => {
      const value = clone(validBaseFixture);
      value.base_writing_signals.candidate_style_profile = {};
      return value;
    })(),
  ],
  [
    "Base proposed-message presence",
    (() => {
      const value = clone(validBaseFixture);
      value.decision_facts.contact_state.proposed_message_present = true;
      return value;
    })(),
  ],
  [
    "Base optional-message basis",
    (() => {
      const value = clone(validBaseFixture);
      value.base_writing_signals.user_goal_detail.basis = "optional_message";
      return value;
    })(),
  ],
  [
    "Base unknown root property",
    Object.assign(clone(validBaseFixture), { unknown_root: true }),
  ],
];

const candidateInvalidFixtures = [
  ["Candidate Timeline", Object.assign(clone(validCandidateFixture), { timeline: [] })],
  [
    "Candidate Observed Facts",
    Object.assign(clone(validCandidateFixture), { observed_facts: [] }),
  ],
  [
    "Candidate Decision Facts",
    Object.assign(clone(validCandidateFixture), { decision_facts: {} }),
  ],
  [
    "Candidate source refs",
    Object.assign(clone(validCandidateFixture), { source_refs: ["input:optional_message"] }),
  ],
  [
    "Candidate message ID",
    Object.assign(clone(validCandidateFixture), { message_id: "M001" }),
  ],
  ["Candidate sequence", Object.assign(clone(validCandidateFixture), { sequence: 2 })],
  [
    "Candidate raw-text echo",
    Object.assign(clone(validCandidateFixture), { raw_candidate: "raw text" }),
  ],
  [
    "Candidate response ID",
    Object.assign(clone(validCandidateFixture), { response_id: "resp_123" }),
  ],
  ["Candidate usage", Object.assign(clone(validCandidateFixture), { usage: {} })],
  [
    "Candidate unknown Safety code",
    (() => {
      const value = clone(validCandidateFixture);
      value.candidate_safety_signals.signal_codes = ["unknown_code"];
      return value;
    })(),
  ],
  [
    "Candidate missing embedded-instruction boolean",
    (() => {
      const value = clone(validCandidateFixture);
      delete value.candidate_safety_signals.untrusted_embedded_instruction_detected;
      return value;
    })(),
  ],
  [
    "Candidate unknown root property",
    Object.assign(clone(validCandidateFixture), { unknown_root: true }),
  ],
];

for (const [label, fixture] of baseInvalidFixtures) {
  assertFixtureRejected(validateBase, fixture, label);
}
for (const [label, fixture] of candidateInvalidFixtures) {
  assertFixtureRejected(validateCandidate, fixture, label);
}

assert.equal(baseInvalidFixtures.length, 6);
assert.equal(candidateInvalidFixtures.length, 12);

assert.equal(parsed.capabilities.status, "human_chatgpt_accepted_complete");
assert.equal(parsed.capabilities.task_id, taskId);
assert.equal(parsed.capabilities.implementation_accepted, true);
assert.equal(
  parsed.capabilities.accepted_implementation_commit,
  acceptedImplementationCommit,
);
assert.deepEqual(parsed.capabilities.implementation_snapshot, {
  type: "historical_commit_range",
  base_commit_sha: baseline,
  end_commit_sha: acceptedImplementationCommit,
  exact_paths: 10,
  immutable_snapshot: true,
  include_working_tree: false,
});
assert.equal(parsed.capabilities.planning_package_status, "human_chatgpt_accepted_complete");
assert.equal(parsed.capabilities.baseline, baseline);
assert.equal(parsed.capabilities.base_schema_created, true);
assert.equal(parsed.capabilities.candidate_schema_created, true);
assert.equal(parsed.capabilities.split_stage_types_created, true);
assert.equal(parsed.capabilities.stage_topology_contract_created, true);
assert.equal(parsed.capabilities.candidate_envelope_discriminated_union, true);
assert.equal(parsed.capabilities.base_schema_accepted, true);
assert.equal(parsed.capabilities.candidate_schema_accepted, true);
assert.equal(parsed.capabilities.split_stage_types_accepted, true);
assert.equal(parsed.capabilities.stage_topology_contract_accepted, true);
assert.equal(parsed.capabilities.candidate_envelope_accepted, true);
assert.equal(parsed.capabilities.base_optional_message_surface_count, 0);
assert.equal(parsed.capabilities.base_optional_message_source_ref_count, 0);
assert.equal(parsed.capabilities.candidate_base_fact_surface_count, 0);
assert.equal(parsed.capabilities.implementation_blobs_unchanged, "4/4");
assert.equal(parsed.capabilities.accepted_planning_blobs_unchanged, "5/5");
assert.equal(parsed.capabilities.provider_calls, 0);
assert.equal(parsed.capabilities.db_operations, 0);
assert.equal(parsed.capabilities.supabase_operations, 0);
assert.equal(parsed.capabilities.provider_quality_established, false);
assert.equal(parsed.capabilities.active_runtime_changed, false);
assert.equal(parsed.capabilities.main_changed, false);
assert.equal(parsed.capabilities.r3_r2_b_authorized, false);
assert.equal(parsed.capabilities.r4_authorized, false);
assert.equal(parsed.capabilities.c2_authorized, false);
assert.equal(parsed.capabilities.human_chatgpt_review, "accepted_complete");
assert.equal(
  parsed.capabilities.next_candidate,
  "M2-P4-I3-R1-C1-R3-R2-B Grounding, Allowlist Merge, and Source Integrity",
);
assert.equal(parsed.capabilities.next_candidate_authorized, false);
assert.equal(parsed.topology.provider_calls, 0);
assert.equal(parsed.topology.db_operations, 0);
assert.equal(parsed.topology.supabase_operations, 0);
assert.equal(parsed.topology.active_runtime_changed, false);
assert.equal(parsed.topology.r3_r2_b_authorized, false);

for (const [documentPath, fragments] of Object.entries({
  [paths.review]: [
    "human_chatgpt_accepted_complete",
    "IMPLEMENTATION ACCEPTED COMPLETE",
    `Accepted implementation commit: \`${acceptedImplementationCommit}\``,
    "Acceptance synchronization exact scope: `6/6`",
    "Four non-sync implementation blobs",
    "Provider quality: not established",
    "R3-R2-B: unauthorized",
  ],
  [paths.currentFocus]: [
    taskId,
    "human_chatgpt_accepted_complete",
    acceptedImplementationCommit,
    "acceptance synchronization is exact `6/6`",
    "Provider / DB / Supabase calls are `0 / 0 / 0`",
  ],
  [paths.wbs]: [
    taskId,
    "IMPLEMENTATION ACCEPTED COMPLETE",
    acceptedImplementationCommit,
    "Acceptance synchronization exact `6/6`",
    "R3-R2-B Grounding, Allowlist Merge, and Source Integrity — unauthorized",
  ],
  [paths.handoff]: [
    taskId,
    "human_chatgpt_accepted_complete",
    acceptedImplementationCommit,
    "acceptance sync is exact `6/6`",
    "R3-R2-B, R4, Runtime activation, C2, E1, PR, and main merge remain unauthorized",
  ],
})) {
  const document = source(documentPath);
  for (const fragment of fragments) {
    assert.ok(
      document.includes(fragment),
      `${documentPath} missing acceptance fragment: ${fragment}`,
    );
  }
}

for (const exactPath of exactPaths) {
  const text = source(exactPath);
  assert.ok(text.endsWith("\n"), `${exactPath} must end with a newline`);
  const lines = text.split(/\r?\n/gu);
  lines.forEach((line, index) => {
    assert.doesNotMatch(
      line,
      /[\t ]+$/u,
      `${exactPath}:${index + 1} has trailing whitespace`,
    );
  });
}
git(["diff", "--check"]);

console.log(`${taskId} split-contract verifier: PASS`);
console.log("immutable_implementation_scope: 10/10");
console.log("acceptance_sync_exact_scope: 6/6");
console.log("implementation_blobs_unchanged: 4/4");
console.log("json_parse: 4/4");
console.log("ajv_compile: 2/2");
console.log("valid_fixtures: 2/2");
console.log("invalid_fixtures: 18/18 expected-failure PASS");
console.log("candidate_safety_signal_codes: 29/29");
console.log("candidate_envelope_states: 4/4");
console.log("topology_parity: 2/2");
console.log("base_source_refs: 3/3");
console.log("protected_planning_blobs: 5/5 unchanged");
console.log("protected_runtime_prompt_schema_pipeline_service_db_diff: 0");
console.log("provider_db_supabase_calls: 0/0/0");
console.log("active_runtime_changed: false");
console.log("r3_r2_b_authorized: false");
console.log("main_unchanged: true");
console.log("git_diff_check: PASS");
