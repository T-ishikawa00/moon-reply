import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import Ajv2020 from "ajv/dist/2020.js";

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const taskId = "M2-P4-I3-R1-C1-R3-R2-B";
const baseline = "be78f8930475e42d9a746a6754bc9e2f34c5aad0";
const acceptedAImplementation =
  "2a5c8ed6ea02a4173c50a4d1e31ad54a857d707f";
const mainBaseline = "61e33a10e195fad17e253a6b9719217e1992f273";
const expectedBranch =
  "feat/m2-p4-i3-r1-c1-r3-r2-b-source-integrity";

const paths = {
  baseGrounding:
    "lib/assessment/runtime/base-structured-intake-grounding-v1.ts",
  candidateGrounding:
    "lib/assessment/runtime/candidate-analysis-grounding-v1.ts",
  baseLegacyView:
    "lib/assessment/runtime/base-structured-intake-legacy-view-v1.ts",
  splitEnvelope: "lib/assessment/runtime/split-analysis-envelope-v1.ts",
  baseIntegrity: "lib/assessment/runtime/base-source-integrity-v1.ts",
  candidateIntegrity:
    "lib/assessment/runtime/candidate-source-integrity-v1.ts",
  fixtures:
    "evals/runtime/m2-p4-i3-r1-c1-r3-r2-b/source-integrity-fixtures-v1.json",
  capabilities:
    "evals/runtime/m2-p4-i3-r1-c1-r3-r2-b/capabilities-v1.json",
  verifier:
    "scripts/verify-m2-p4-i3-r1-c1-r3-r2-b-source-integrity.mjs",
  review: "docs/phase2/TASK_M2_P4_I3_R1_C1_R3_R2_B_REVIEW.md",
  currentFocus: "docs/CURRENT_FOCUS.md",
  wbs: "docs/WBS.md",
  handoff: "docs/CODEX_HANDOFF.md",
  splitContract:
    "lib/assessment/runtime/contracts/split-stage-contracts-v1.ts",
  baseSchema:
    "lib/assessment/runtime/contracts/base-structured-intake-v1.schema.json",
  candidateSchema:
    "lib/assessment/runtime/contracts/candidate-analysis-v1.schema.json",
  topology:
    "evals/runtime/m2-p4-i3-r1-c1-r3-r2-a/stage-topology-v1.json",
  aCapabilities:
    "evals/runtime/m2-p4-i3-r1-c1-r3-r2-a/capabilities-v1.json",
  aVerifier: "scripts/verify-m2-p4-i3-r1-c1-r3-r2-a-split-contracts.mjs",
  aReview: "docs/phase2/TASK_M2_P4_I3_R1_C1_R3_R2_A_REVIEW.md",
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
};

const exactPaths = [
  paths.baseGrounding,
  paths.candidateGrounding,
  paths.baseLegacyView,
  paths.splitEnvelope,
  paths.baseIntegrity,
  paths.candidateIntegrity,
  paths.fixtures,
  paths.capabilities,
  paths.verifier,
  paths.review,
  paths.currentFocus,
  paths.wbs,
  paths.handoff,
];
const runtimeHelperPaths = exactPaths.slice(0, 6);
const protectedAImplementationPaths = [
  paths.baseSchema,
  paths.candidateSchema,
  paths.splitContract,
  paths.topology,
];
const protectedAAcceptancePaths = [
  paths.aCapabilities,
  paths.aVerifier,
  paths.aReview,
];
const acceptedPlanningPaths = [
  paths.acceptedPlanning,
  paths.acceptedArchitecture,
  paths.acceptedRouting,
  paths.acceptedCounterfactual,
  paths.acceptedSafety,
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

function clone(value) {
  return structuredClone(value);
}

function sha256Bytes(value) {
  return createHash("sha256").update(value).digest("hex");
}

function sha256File(relativePath) {
  return sha256Bytes(readFileSync(absolute(relativePath)));
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

function assertMatchesCommit(relativePath, commit, label) {
  const expectedBlob = git(["rev-parse", `${commit}:${relativePath}`]).trim();
  const actualBlob = git(["hash-object", relativePath]).trim();
  assert.equal(actualBlob, expectedBlob, `${label}: ${relativePath}`);
}

function containsProperty(value, propertyName) {
  if (Array.isArray(value)) {
    return value.some((item) => containsProperty(item, propertyName));
  }
  if (value === null || typeof value !== "object") return false;
  return (
    Object.hasOwn(value, propertyName) ||
    Object.values(value).some((item) => containsProperty(item, propertyName))
  );
}

function deepFreeze(value) {
  if (value === null || typeof value !== "object" || Object.isFrozen(value)) {
    return value;
  }
  Object.freeze(value);
  Object.values(value).forEach(deepFreeze);
  return value;
}

function expectSafeCode(action, expectedSafeCode, label) {
  assert.throws(
    action,
    (error) => error?.safeCode === expectedSafeCode,
    `${label} must fail with ${expectedSafeCode}`,
  );
}

function runtimeTypeScriptFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const selected = path.join(directory, entry.name);
    if (entry.isDirectory()) return runtimeTypeScriptFiles(selected);
    return entry.isFile() && entry.name.endsWith(".ts") ? [selected] : [];
  });
}

const fixtures = json(paths.fixtures);
const capabilities = json(paths.capabilities);
const baseSchema = json(paths.baseSchema);
const candidateSchema = json(paths.candidateSchema);

const baseGroundingModule = await import(
  pathToFileURL(absolute(paths.baseGrounding)).href
);
const candidateGroundingModule = await import(
  pathToFileURL(absolute(paths.candidateGrounding)).href
);
const baseLegacyModule = await import(
  pathToFileURL(absolute(paths.baseLegacyView)).href
);
const splitEnvelopeModule = await import(
  pathToFileURL(absolute(paths.splitEnvelope)).href
);
const baseIntegrityModule = await import(
  pathToFileURL(absolute(paths.baseIntegrity)).href
);
const candidateIntegrityModule = await import(
  pathToFileURL(absolute(paths.candidateIntegrity)).href
);
const splitContractModule = await import(
  pathToFileURL(absolute(paths.splitContract)).href
);
const contextualIntegrityModule = await import(
  pathToFileURL(
    absolute("lib/assessment/runtime/contextual-integrity-v3.ts"),
  ).href
);

const {
  projectBaseProviderInputV1,
  groundBaseStructuredIntakeV1,
} = baseGroundingModule;
const {
  projectCandidateProviderInputV1,
  groundCandidateAnalysisV1,
} = candidateGroundingModule;
const { buildBaseStructuredIntakeLegacyViewV1 } = baseLegacyModule;
const {
  buildAbsentCandidateLaneV1,
  buildAvailableCandidateLaneV1,
  buildAnalysisUnavailableSafetyAvailableCandidateLaneV1,
  buildSafetyUnavailableCandidateLaneV1,
  buildSplitAnalysisEnvelopeV1,
} = splitEnvelopeModule;
const { validateBaseSourceIntegrityV1 } = baseIntegrityModule;
const { validateCandidateSourceIntegrityV1 } = candidateIntegrityModule;
const { validateContextualIntakeIntegrityV3 } = contextualIntegrityModule;

assert.equal(new Set(exactPaths).size, exactPaths.length, "duplicate scope paths");
assert.deepEqual(currentTaskPaths(baseline), sorted(exactPaths));
assert.equal(git(["branch", "--show-current"]).trim(), expectedBranch);
assert.equal(git(["rev-parse", "main"]).trim(), mainBaseline);
assert.equal(git(["rev-parse", "origin/main"]).trim(), mainBaseline);
git(["merge-base", "--is-ancestor", baseline, "HEAD"]);

for (const protectedPath of protectedAImplementationPaths) {
  assertMatchesCommit(
    protectedPath,
    acceptedAImplementation,
    "accepted A implementation blob changed",
  );
}
for (const protectedPath of protectedAAcceptancePaths) {
  assertMatchesCommit(
    protectedPath,
    baseline,
    "accepted A acceptance state changed",
  );
}
for (const protectedPath of acceptedPlanningPaths) {
  assertMatchesCommit(
    protectedPath,
    baseline,
    "accepted Planning blob changed",
  );
}
const aCapabilities = json(paths.aCapabilities);
assert.equal(aCapabilities.status, "human_chatgpt_accepted_complete");
assert.equal(aCapabilities.implementation_accepted, true);

assert.equal(fixtures.synthetic_only, true);
assert.equal(fixtures.task_id, taskId);
assert.equal(fixtures.base_valid_cases.length, 8);
assert.equal(fixtures.candidate_valid_cases.length, 7);
assert.deepEqual(
  fixtures.base_valid_cases.map(({ scenario }) => scenario),
  [
    "canonical_application_relationship_and_selected_requests",
    "relationship_stage_inference_removal",
    "unresolved_relationship_stage_removal",
    "inference_source_ref_canonicalization",
    "unknown_unresolved_inference_canonicalization",
    "base_legacy_view_deep_clone",
    "candidate_a_b_null_base_request_byte_identity",
    "legitimate_literal_overlap_no_false_positive",
  ],
);
assert.deepEqual(
  fixtures.candidate_valid_cases.map(({ scenario }) => scenario),
  [
    "available",
    "absent",
    "analysis_unavailable_safety_available",
    "safety_unavailable",
    "candidate_allowlist_output",
    "candidate_safety_empty_signal_codes",
    "candidate_safety_valid_multiple_codes",
  ],
);
assert.equal(fixtures.invalid_fixtures.length, 35);
assert.equal(
  new Set(fixtures.invalid_fixtures.map(({ fixture_id }) => fixture_id)).size,
  fixtures.invalid_fixtures.length,
);
for (const fixture of fixtures.invalid_fixtures) {
  for (const requiredKey of [
    "fixture_id",
    "target_validator",
    "expected_safe_code",
    "short_reason",
  ]) {
    assert.equal(typeof fixture[requiredKey], "string");
    assert.ok(fixture[requiredKey].length > 0);
  }
}

const ajv = new Ajv2020({ allErrors: true, strict: true, allowUnionTypes: true });
const validateBaseSchema = ajv.compile(baseSchema);
const validateCandidateSchema = ajv.compile(candidateSchema);
assert.equal(
  validateBaseSchema(fixtures.raw_base_structured_intake),
  true,
  JSON.stringify(validateBaseSchema.errors),
);
assert.equal(
  validateCandidateSchema(fixtures.raw_candidate_provider_output),
  true,
  JSON.stringify(validateCandidateSchema.errors),
);

const baseSource = clone(fixtures.base_provider_source);
const baseSourceSnapshot = clone(baseSource);
const baseRequest = projectBaseProviderInputV1(baseSource);
assert.deepEqual(baseSource, baseSourceSnapshot);
assert.deepEqual(Object.keys(baseRequest), [
  "current_situation",
  "relationship",
  "requested_topics",
]);
assert.equal(baseRequest.current_situation, baseSource.currentSituation);
assert.notEqual(baseRequest.requested_topics, baseSource.requestedTopics);
validateBaseSourceIntegrityV1({
  input: baseRequest,
  baseProviderRequest: baseRequest,
});

const counterfactualRequests = [
  fixtures.candidate_variants.candidate_a,
  fixtures.candidate_variants.candidate_b,
  fixtures.candidate_variants.candidate_absent,
].map((unownedValue) =>
  projectBaseProviderInputV1({ ...baseSource, unownedValue }),
);
const counterfactualBytes = counterfactualRequests.map((request) =>
  Buffer.from(JSON.stringify(request), "utf8"),
);
assert.ok(
  counterfactualBytes.every((bytes) => bytes.equals(counterfactualBytes[0])),
);
const baseRequestHash = sha256Bytes(counterfactualBytes[0]);

const overlapSource = {
  ...baseSource,
  currentSituation: fixtures.candidate_variants.legitimate_literal_overlap,
  unownedValue: fixtures.candidate_variants.legitimate_literal_overlap,
};
const overlapRequest = projectBaseProviderInputV1(overlapSource);
validateBaseSourceIntegrityV1({
  input: overlapRequest,
  baseProviderRequest: overlapRequest,
});

const rawBase = clone(fixtures.raw_base_structured_intake);
const rawBaseSnapshot = clone(rawBase);
const baseInputSnapshot = clone(baseRequest);
const groundedBase = groundBaseStructuredIntakeV1(baseRequest, rawBase);
assert.deepEqual(rawBase, rawBaseSnapshot);
assert.deepEqual(baseRequest, baseInputSnapshot);
assert.equal(groundedBase.schema_version, "pipeline-schema-base-v1.0.0");
assert.equal(
  groundedBase.decision_facts.schema_version,
  "m2-p4-base-decision-facts-v1",
);
assert.equal(
  groundedBase.base_writing_signals.schema_version,
  "m2-p4-base-writing-signals-v1",
);
assert.equal(groundedBase.relationship_stage, baseRequest.relationship);
assert.equal(
  groundedBase.decision_facts.relationship_stage,
  baseRequest.relationship,
);
assert.deepEqual(
  groundedBase.decision_facts.selected_requests,
  baseRequest.requested_topics,
);
assert.equal(
  groundedBase.context_inferences.some(
    ({ field_path }) => field_path === "relationship_stage",
  ),
  false,
);
assert.equal(
  groundedBase.decision_facts.information_state.unresolved_fields.includes(
    "relationship_stage",
  ),
  false,
);
assert.equal(
  groundedBase.context_inferences.some(
    ({ field_path }) => field_path === "latest_direct_message.sender",
  ),
  false,
);
const supportedInference = groundedBase.context_inferences.find(
  ({ inference_id }) => inference_id === "I002",
);
assert.deepEqual(supportedInference.source_refs, [
  "input:current_situation",
  "input:relationship",
  "input:requested_topics",
]);
const missingFactInference = groundedBase.context_inferences.find(
  ({ inference_id }) => inference_id === "I003",
);
assert.deepEqual(missingFactInference.source_refs, ["input:current_situation"]);
assert.equal(
  groundedBase.decision_facts.information_state.used_context_inference,
  true,
);
expectSafeCode(
  () => validateContextualIntakeIntegrityV3(groundedBase),
  "M2_CONTEXTUAL_INFERENCE_INVALID",
  "unsupported evidence must remain rejectable by later Contextual Integrity",
);

validateBaseSourceIntegrityV1({
  input: baseRequest,
  baseProviderRequest: baseRequest,
  rawBaseOutput: rawBase,
  groundedBaseOutput: groundedBase,
});
assert.equal(containsProperty(groundedBase, "proposed_message_present"), false);

const baseLegacyView = buildBaseStructuredIntakeLegacyViewV1(groundedBase);
assert.equal(JSON.stringify(baseLegacyView), JSON.stringify(groundedBase));
assert.notEqual(baseLegacyView, groundedBase);
assert.notEqual(baseLegacyView.decision_facts, groundedBase.decision_facts);
const mutableLegacyView = clone(baseLegacyView);
mutableLegacyView.decision_facts.selected_requests.push("relationship");
assert.deepEqual(
  groundedBase.decision_facts.selected_requests,
  baseRequest.requested_topics,
);
validateBaseSourceIntegrityV1({ baseLegacyView });

const candidateInput = projectCandidateProviderInputV1(
  fixtures.candidate_optional_message,
);
assert.deepEqual(Object.keys(candidateInput), [
  "optional_message",
  "candidate_metadata",
]);
assert.equal(candidateInput.optional_message, fixtures.candidate_optional_message);
assert.deepEqual(candidateInput.candidate_metadata, {
  message_owner: "user",
  message_status: "unsent_candidate",
});
validateCandidateSourceIntegrityV1({ candidateProviderInput: candidateInput });
expectSafeCode(
  () => projectCandidateProviderInputV1(" \t\n "),
  "M2_CANDIDATE_SOURCE_INTEGRITY_FAILED",
  "blank Candidate projection",
);

const rawCandidate = clone(fixtures.raw_candidate_provider_output);
const rawCandidateSnapshot = clone(rawCandidate);
const candidateGrounded = groundCandidateAnalysisV1(rawCandidate);
assert.deepEqual(rawCandidate, rawCandidateSnapshot);
assert.deepEqual(Object.keys(candidateGrounded), [
  "candidate_analysis",
  "candidate_safety_result",
]);
assert.deepEqual(Object.keys(candidateGrounded.candidate_analysis), [
  "candidate_style_profile",
  "candidate_communicative_intent",
  "candidate_language_expression",
]);
assert.deepEqual(Object.keys(candidateGrounded.candidate_safety_result), [
  "untrusted_embedded_instruction_detected",
  "signal_codes",
]);
assert.equal(containsProperty(candidateGrounded, "candidate_text"), false);
assert.equal(containsProperty(candidateGrounded, "optional_message"), false);
validateCandidateSourceIntegrityV1({
  rawCandidateProviderOutput: rawCandidate,
  candidateAnalysis: candidateGrounded.candidate_analysis,
  candidateSafetyResult: candidateGrounded.candidate_safety_result,
});

const multipleSafetyRaw = clone(rawCandidate);
multipleSafetyRaw.candidate_safety_signals.signal_codes = [
  "threat",
  "proposes_meeting",
];
const multipleSafetyGrounded = groundCandidateAnalysisV1(multipleSafetyRaw);
assert.deepEqual(multipleSafetyGrounded.candidate_safety_result.signal_codes, [
  "threat",
  "proposes_meeting",
]);

const availableLane = buildAvailableCandidateLaneV1(
  candidateGrounded.candidate_analysis,
  candidateGrounded.candidate_safety_result,
);
const absentLane = buildAbsentCandidateLaneV1();
const analysisUnavailableLane =
  buildAnalysisUnavailableSafetyAvailableCandidateLaneV1(
    candidateGrounded.candidate_safety_result,
  );
const safetyUnavailableLane = buildSafetyUnavailableCandidateLaneV1();
const lanes = [
  absentLane,
  availableLane,
  analysisUnavailableLane,
  safetyUnavailableLane,
];
assert.deepEqual(
  lanes.map(({ candidate_envelope }) => candidate_envelope),
  [
    {
      presence: false,
      analysis_status: "absent",
      safety_status: "absent",
      analysis: null,
    },
    {
      presence: true,
      analysis_status: "available",
      safety_status: "available",
      analysis: candidateGrounded.candidate_analysis,
    },
    {
      presence: true,
      analysis_status: "unavailable",
      safety_status: "available",
      analysis: null,
    },
    {
      presence: true,
      analysis_status: "unavailable",
      safety_status: "unavailable",
      analysis: null,
    },
  ],
);
assert.deepEqual(
  lanes.map(({ candidate_safety_result }) => candidate_safety_result !== null),
  [false, true, true, false],
);
lanes.forEach((lane) =>
  validateCandidateSourceIntegrityV1({
    candidateEnvelope: lane.candidate_envelope,
    candidateSafetyResult: lane.candidate_safety_result,
  }),
);

const splitEnvelope = buildSplitAnalysisEnvelopeV1({
  baseStructuredIntake: groundedBase,
  baseLegacyView,
  candidateLane: availableLane,
});
assert.deepEqual(Object.keys(splitEnvelope), [
  "base_structured_intake",
  "base_legacy_view",
  "candidate_envelope",
  "candidate_safety_result",
]);
assert.equal(
  containsProperty(splitEnvelope.base_structured_intake, "candidate_envelope"),
  false,
);
assert.equal(
  containsProperty(
    splitEnvelope.base_structured_intake,
    "candidate_safety_result",
  ),
  false,
);
assert.equal(
  containsProperty(splitEnvelope.base_legacy_view, "candidate_envelope"),
  false,
);
assert.equal(containsProperty(splitEnvelope, "optional_message"), false);
assert.notEqual(splitEnvelope.base_structured_intake, groundedBase);
assert.notEqual(splitEnvelope.candidate_envelope, availableLane.candidate_envelope);
validateCandidateSourceIntegrityV1({ splitAnalysisEnvelope: splitEnvelope });
const mutableSplitEnvelope = clone(splitEnvelope);
mutableSplitEnvelope.base_structured_intake.relationship_stage = "dating";
mutableSplitEnvelope.candidate_envelope.analysis.candidate_style_profile.register =
  "polite";
assert.equal(groundedBase.relationship_stage, "ambiguous");
assert.equal(
  availableLane.candidate_envelope.analysis.candidate_style_profile.register,
  "casual",
);

const candidateSafetyEnum =
  candidateSchema.$defs.candidate_safety_signal_code.enum;
assert.equal(splitContractModule.CANDIDATE_SAFETY_SIGNAL_CODES.length, 29);
assert.deepEqual(
  sorted(splitContractModule.CANDIDATE_SAFETY_SIGNAL_CODES),
  sorted(candidateSafetyEnum),
);

function invalidAction(fixture) {
  const mutation = fixture.mutation;
  if (mutation.startsWith("base_request_")) {
    const value = clone(baseRequest);
    if (mutation === "base_request_additional_key") value.expected = "unsafe";
    if (mutation === "base_request_optional_message") {
      value.optional_message = "synthetic";
    }
    return () =>
      validateBaseSourceIntegrityV1({
        input: baseRequest,
        baseProviderRequest: value,
      });
  }
  if (mutation.startsWith("base_") || mutation === "legacy_candidate_field") {
    const value = clone(
      fixture.target_validator === "base_grounded_output" ||
        fixture.target_validator === "base_legacy_view"
        ? groundedBase
        : rawBase,
    );
    if (mutation === "base_optional_source_ref") {
      value.observed_facts[0].source_refs = ["input:optional_message"];
    } else if (mutation === "base_followup_source_ref") {
      value.observed_facts[0].source_refs = ["followup:F1"];
    } else if (mutation === "base_candidate_field_root") {
      value.candidate_analysis = {};
    } else if (mutation === "base_candidate_field_nested") {
      value.base_writing_signals.candidate_style_profile = {};
    } else if (mutation === "base_proposed_message_present") {
      value.decision_facts.contact_state.proposed_message_present = true;
    } else if (mutation === "legacy_candidate_field") {
      value.candidate_envelope = absentLane.candidate_envelope;
    } else if (mutation === "base_duplicate_source_refs") {
      value.observed_facts[0].source_refs = [
        "input:current_situation",
        "input:current_situation",
      ];
    } else if (mutation === "base_incorrect_relationship") {
      value.relationship_stage = "dating";
    } else if (mutation === "base_incorrect_selected_requests") {
      value.decision_facts.selected_requests = ["relationship"];
    }
    const key =
      fixture.target_validator === "base_grounded_output"
        ? "groundedBaseOutput"
        : fixture.target_validator === "base_legacy_view"
          ? "baseLegacyView"
          : "rawBaseOutput";
    return () =>
      validateBaseSourceIntegrityV1({ input: baseRequest, [key]: value });
  }
  if (mutation.startsWith("candidate_input_") || mutation === "candidate_blank_message" || mutation === "candidate_incorrect_metadata") {
    const value = clone(candidateInput);
    if (mutation === "candidate_blank_message") value.optional_message = "   ";
    if (mutation === "candidate_incorrect_metadata") {
      value.candidate_metadata.message_owner = "other_person";
    }
    if (mutation === "candidate_input_additional_key") {
      value.current_situation = "synthetic";
    }
    return () =>
      validateCandidateSourceIntegrityV1({ candidateProviderInput: value });
  }
  if (mutation.startsWith("candidate_output_") || mutation.startsWith("candidate_unknown_") || mutation.startsWith("candidate_duplicate_")) {
    const value = clone(rawCandidate);
    const additions = {
      candidate_output_timeline: ["timeline", []],
      candidate_output_observed_facts: ["observed_facts", []],
      candidate_output_decision_facts: ["decision_facts", {}],
      candidate_output_source_refs: ["source_refs", ["input:optional_message"]],
      candidate_output_id: ["message_id", "MSG001"],
      candidate_output_sequence: ["sequence", 1],
      candidate_output_raw_echo: ["raw_candidate", "synthetic"],
      candidate_output_response_id: ["response_id", "synthetic-response"],
      candidate_output_usage: ["usage", {}],
      candidate_output_latency: ["latency_ms", 1],
    };
    if (additions[mutation]) {
      const [propertyName, propertyValue] = additions[mutation];
      value[propertyName] = propertyValue;
    }
    if (mutation === "candidate_unknown_safety_code") {
      value.candidate_safety_signals.signal_codes = ["unknown_code"];
    }
    if (mutation === "candidate_duplicate_safety_code") {
      value.candidate_safety_signals.signal_codes = ["threat", "threat"];
    }
    return () =>
      validateCandidateSourceIntegrityV1({ rawCandidateProviderOutput: value });
  }
  if (mutation.startsWith("envelope_")) {
    const value = clone(
      mutation === "envelope_true_absent" ||
        mutation === "envelope_present_safety_absent"
        ? absentLane.candidate_envelope
        : mutation === "envelope_unavailable_analysis"
          ? analysisUnavailableLane.candidate_envelope
          : availableLane.candidate_envelope,
    );
    if (mutation === "envelope_false_available") value.presence = false;
    if (mutation === "envelope_true_absent") value.presence = true;
    if (mutation === "envelope_available_null") value.analysis = null;
    if (mutation === "envelope_unavailable_analysis") {
      value.analysis = clone(candidateGrounded.candidate_analysis);
    }
    if (mutation === "envelope_present_safety_absent") {
      value.presence = true;
      value.analysis_status = "unavailable";
    }
    if (mutation === "envelope_unknown_key") value.response_id = "synthetic";
    return () =>
      validateCandidateSourceIntegrityV1({ candidateEnvelope: value });
  }
  if (mutation === "split_candidate_envelope_inside_base") {
    const value = clone(splitEnvelope);
    value.base_structured_intake.candidate_envelope = clone(
      availableLane.candidate_envelope,
    );
    return () =>
      validateCandidateSourceIntegrityV1({ splitAnalysisEnvelope: value });
  }
  if (mutation === "candidate_analysis_base_fact") {
    const value = clone(candidateGrounded.candidate_analysis);
    value.candidate_style_profile.decision_facts = {};
    return () =>
      validateCandidateSourceIntegrityV1({ candidateAnalysis: value });
  }
  if (mutation === "split_missing_available_safety") {
    const value = clone(splitEnvelope);
    value.candidate_safety_result = null;
    return () =>
      validateCandidateSourceIntegrityV1({ splitAnalysisEnvelope: value });
  }
  throw new Error(`unknown invalid fixture mutation: ${mutation}`);
}

let invalidExpectedFailureCount = 0;
for (const fixture of fixtures.invalid_fixtures) {
  expectSafeCode(
    invalidAction(fixture),
    fixture.expected_safe_code,
    fixture.fixture_id,
  );
  invalidExpectedFailureCount += 1;
}

const mutationTests = [
  ["add optional_message to Base request", "BASE-INVALID-002"],
  ["add Candidate field to Base output", "BASE-INVALID-005"],
  ["add input:optional_message source ref", "BASE-INVALID-003"],
  ["insert CandidateEnvelope into Base", "CANDIDATE-INVALID-022"],
  ["add Timeline to Candidate output", "CANDIDATE-INVALID-004"],
  ["add response_id to CandidateEnvelope", "CANDIDATE-INVALID-021"],
  ["convert absent Envelope to presence true", "CANDIDATE-INVALID-017"],
  ["retain non-null analysis in unavailable state", "CANDIDATE-INVALID-019"],
  [
    "route Candidate Safety into Base facts",
    () => {
      const value = clone(groundedBase);
      value.decision_facts.candidate_safety_result = clone(
        candidateGrounded.candidate_safety_result,
      );
      validateBaseSourceIntegrityV1({
        input: baseRequest,
        groundedBaseOutput: value,
      });
    },
    "M2_BASE_SOURCE_INTEGRITY_FAILED",
  ],
  [
    "mutate raw Provider output during grounding",
    () => {
      const frozenBase = deepFreeze(clone(rawBase));
      const frozenCandidate = deepFreeze(clone(rawCandidate));
      const frozenBaseSnapshot = clone(frozenBase);
      const frozenCandidateSnapshot = clone(frozenCandidate);
      groundBaseStructuredIntakeV1(baseRequest, frozenBase);
      groundCandidateAnalysisV1(frozenCandidate);
      assert.deepEqual(frozenBase, frozenBaseSnapshot);
      assert.deepEqual(frozenCandidate, frozenCandidateSnapshot);
    },
    null,
  ],
];

let mutationResultCount = 0;
for (const [label, fixtureOrAction, expectedCode] of mutationTests) {
  if (typeof fixtureOrAction === "string") {
    const fixture = fixtures.invalid_fixtures.find(
      ({ fixture_id }) => fixture_id === fixtureOrAction,
    );
    assert.ok(fixture, `${label}: fixture missing`);
    expectSafeCode(invalidAction(fixture), fixture.expected_safe_code, label);
  } else if (expectedCode) {
    expectSafeCode(fixtureOrAction, expectedCode, label);
  } else {
    fixtureOrAction();
  }
  mutationResultCount += 1;
}

const baseGroundingSource = source(paths.baseGrounding);
assert.equal(baseGroundingSource.includes("optionalMessage"), false);
assert.equal(baseGroundingSource.includes("optional_message"), false);
assert.equal(baseGroundingSource.toLowerCase().includes("candidate"), false);
for (const forbiddenLegacyHelper of [
  "groundStructuredIntakeV3",
  "guardDecisionFactsWithEvidenceV4",
]) {
  assert.equal(baseGroundingSource.includes(forbiddenLegacyHelper), false);
}
const candidateGroundingSource = source(paths.candidateGrounding);
assert.doesNotMatch(
  candidateGroundingSource,
  /\.\.\.\s*(?:rawCandidateProviderOutput|raw)\b/u,
);
for (const requiredFragment of [
  "candidate_style_profile: {",
  "candidate_communicative_intent: {",
  "candidate_language_expression: {",
  "candidate_safety_result: {",
]) {
  assert.ok(candidateGroundingSource.includes(requiredFragment));
}

const helperSources = runtimeHelperPaths.map(source).join("\n");
for (const forbiddenTestLiteral of [
  fixtures.candidate_variants.candidate_a,
  fixtures.candidate_variants.candidate_b,
  fixtures.candidate_variants.legitimate_literal_overlap,
]) {
  assert.equal(helperSources.includes(forbiddenTestLiteral), false);
}
for (const forbiddenExecutionFragment of [
  "from \"openai\"",
  "@supabase/supabase-js",
  "AiStageTransport",
  "AssessmentRepository",
  "fetch(",
  ".invoke(",
]) {
  assert.equal(helperSources.includes(forbiddenExecutionFragment), false);
}

const runtimeRoot = absolute("lib/assessment/runtime");
const helperAbsolutePaths = new Set(runtimeHelperPaths.map(absolute));
const helperImportFragments = runtimeHelperPaths.map(
  (relativePath) => `./${path.basename(relativePath, ".ts")}.ts`,
);
const activeRuntimeImports = runtimeTypeScriptFiles(runtimeRoot)
  .filter((filePath) => !helperAbsolutePaths.has(filePath))
  .flatMap((filePath) =>
    helperImportFragments.flatMap((fragment) =>
      readFileSync(filePath, "utf8").includes(fragment)
        ? [`${path.relative(repositoryRoot, filePath)}:${fragment}`]
        : [],
    ),
  );
assert.deepEqual(activeRuntimeImports, []);

assert.equal(capabilities.status, "implementation_pending_human_chatgpt_review");
assert.equal(capabilities.task_id, taskId);
assert.equal(capabilities.baseline, baseline);
assert.equal(capabilities.planning_package_status, "human_chatgpt_accepted_complete");
assert.equal(capabilities.r3_r2_a_status, "human_chatgpt_accepted_complete");
assert.equal(capabilities.exact_scope, "13/13");
assert.deepEqual(capabilities.exact_mutation_paths, exactPaths);
assert.equal(capabilities.valid_fixture_count, 15);
assert.equal(capabilities.invalid_fixture_count, invalidExpectedFailureCount);
assert.equal(capabilities.mutation_result_count, mutationResultCount);
assert.equal(capabilities.base_request_sha256, baseRequestHash);
assert.equal(capabilities.candidate_envelope_states, "4/4");
assert.equal(capabilities.provider_calls, 0);
assert.equal(capabilities.db_operations, 0);
assert.equal(capabilities.supabase_operations, 0);
assert.equal(capabilities.active_runtime_changed, false);
assert.equal(capabilities.pipeline_changed, false);
assert.equal(capabilities.prompt_changed, false);
assert.equal(capabilities.catalog_changed, false);
assert.equal(capabilities.migration_changed, false);
assert.equal(capabilities.r3_r2_c_authorized, false);
assert.equal(capabilities.r4_authorized, false);
assert.equal(capabilities.c2_authorized, false);
for (const helperPath of runtimeHelperPaths) {
  assert.equal(
    capabilities.helper_sha256[path.basename(helperPath)],
    sha256File(helperPath),
  );
}

const expectedVersions = {
  base_structured_intake_grounding:
    "m2-p4-base-structured-intake-grounding-v1",
  candidate_analysis_grounding: "m2-p4-candidate-analysis-grounding-v1",
  base_structured_intake_legacy_view:
    "m2-p4-base-structured-intake-legacy-view-v1",
  split_analysis_envelope: "m2-p4-split-analysis-envelope-v1",
  base_source_integrity: "m2-p4-base-source-integrity-v1",
  candidate_source_integrity: "m2-p4-candidate-source-integrity-v1",
};
assert.deepEqual(capabilities.helper_versions, expectedVersions);
assert.equal(
  baseGroundingModule.BASE_STRUCTURED_INTAKE_GROUNDING_VERSION,
  expectedVersions.base_structured_intake_grounding,
);
assert.equal(
  candidateGroundingModule.CANDIDATE_ANALYSIS_GROUNDING_VERSION,
  expectedVersions.candidate_analysis_grounding,
);
assert.equal(
  baseLegacyModule.BASE_STRUCTURED_INTAKE_LEGACY_VIEW_VERSION,
  expectedVersions.base_structured_intake_legacy_view,
);
assert.equal(
  splitEnvelopeModule.SPLIT_ANALYSIS_ENVELOPE_VERSION,
  expectedVersions.split_analysis_envelope,
);
assert.equal(
  baseIntegrityModule.BASE_SOURCE_INTEGRITY_VERSION,
  expectedVersions.base_source_integrity,
);
assert.equal(
  candidateIntegrityModule.CANDIDATE_SOURCE_INTEGRITY_VERSION,
  expectedVersions.candidate_source_integrity,
);

const changedPaths = currentTaskPaths(baseline);
for (const forbiddenPath of [
  "lib/assessment/runtime/pipeline.ts",
  "lib/assessment/runtime/service.ts",
  "lib/assessment/runtime/fakes.ts",
  "lib/assessment/runtime/schema-catalog.ts",
  "lib/assessment/runtime/types.ts",
  "package.json",
  "package-lock.json",
]) {
  assert.equal(changedPaths.includes(forbiddenPath), false);
}
assert.equal(changedPaths.some((item) => item.startsWith("supabase/")), false);
assert.equal(changedPaths.some((item) => item.endsWith(".developer.md")), false);
assert.equal(changedPaths.some((item) => item.includes("r3-r2-c")), false);

for (const [documentPath, fragments] of Object.entries({
  [paths.review]: [
    taskId,
    baseline,
    expectedBranch,
    "implementation_pending_human_chatgpt_review",
    "R3-R2-C: unauthorized",
  ],
  [paths.currentFocus]: [
    taskId,
    "implementation_pending_human_chatgpt_review",
    "Provider / DB / Supabase calls are `0 / 0 / 0`",
  ],
  [paths.wbs]: [
    taskId,
    "IMPLEMENTATION COMPLETE — HUMAN / CHATGPT REVIEW PENDING",
    "R3-R2-C Pipeline, Persistence, Safety, and Failure Semantics — unauthorized",
  ],
  [paths.handoff]: [
    taskId,
    expectedBranch,
    "implementation_pending_human_chatgpt_review",
    "R3-R2-C, R4, Runtime activation, C2, E1, PR, and main merge remain unauthorized",
  ],
})) {
  const document = source(documentPath);
  for (const fragment of fragments) {
    assert.ok(
      document.includes(fragment),
      `${documentPath} missing review fragment: ${fragment}`,
    );
  }
}

for (const exactPath of exactPaths) {
  const text = source(exactPath);
  assert.ok(text.endsWith("\n"), `${exactPath} must end with a newline`);
  text.split(/\r?\n/gu).forEach((line, index) => {
    assert.doesNotMatch(
      line,
      /[\t ]+$/u,
      `${exactPath}:${index + 1} has trailing whitespace`,
    );
  });
}
git(["diff", "--check"]);

console.log(`${taskId} source-integrity verifier: PASS`);
console.log("exact_scope: 13/13");
console.log("duplicate_scope_paths: 0");
console.log("fixture_json_parse: PASS");
console.log("accepted_a_implementation_blobs: 4/4 unchanged");
console.log("accepted_a_acceptance_state: unchanged");
console.log("accepted_planning_blobs: 5/5 unchanged");
console.log("base_valid_fixtures: 8/8");
console.log("candidate_valid_fixtures: 7/7");
console.log(`invalid_expected_failures: ${invalidExpectedFailureCount}/${invalidExpectedFailureCount}`);
console.log(`mutation_rejections: ${mutationResultCount}/${mutationResultCount}`);
console.log(`base_request_a_b_null_sha256: ${baseRequestHash}`);
console.log("candidate_envelope_states: 4/4");
console.log("candidate_lane_safety_consistency: 4/4");
console.log("candidate_safety_signal_codes: 29/29");
console.log("split_sibling_separation: PASS");
console.log("provider_db_supabase_calls: 0/0/0");
console.log("active_runtime_imports: 0");
console.log("pipeline_service_prompt_catalog_db_diff: 0");
console.log("r3_r2_c_authorized: false");
console.log("main_unchanged: true");
console.log("git_diff_check: PASS");
