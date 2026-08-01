import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  loadM2P4PracticalReasonConsistencyRuntimeStageCatalog,
  loadM2P4ProductQualityRuntimeStageCatalog,
} from "../lib/assessment/runtime/schema-catalog.ts";
import { buildContextualDecisionPolicyV3 } from "../lib/assessment/runtime/policy-v3.ts";

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const baseline = "33a91f00be9f71fa533c9635d30425dc23914d81";
const expectedMain = "61e33a10e195fad17e253a6b9719217e1992f273";
const exactPaths = [
  "lib/assessment/runtime/contracts/pb-01-structure-v7.developer.md",
  "lib/assessment/runtime/contracts/runtime-stage-catalog-v8.json",
  "evals/runtime/m2-p4-i3-r1-c1-r2-r2-r1/practical-reason-consistency-contract-v1.json",
  "evals/runtime/m2-p4-i3-r1-c1-r2-r2-r1/offline-analysis-v1.json",
  "evals/runtime/m2-p4-i3-r1-c1-r2-r2-r1/capabilities-v1.json",
  "scripts/verify-m2-p4-i3-r1-c1-r2-r2-r1-practical-reason-consistency.mjs",
  "docs/phase2/TASK_M2_P4_I3_R1_C1_R2_R2_R1_REVIEW.md",
  "lib/assessment/runtime/schema-catalog.ts",
  "scripts/verify-m2-eval-foundation.mjs",
  "scripts/verify-m2-p3-runtime-vertical-slice.mjs",
  "docs/CURRENT_FOCUS.md",
  "docs/WBS.md",
  "docs/CODEX_HANDOFF.md",
].sort((left, right) => left.localeCompare(right, "en"));
const immutableR2R2ExecutionPaths = [
  "evals/runtime/m2-p4-i3-r1-c1-r2-r2/diagnostic-cases-v1.json",
  "evals/runtime/m2-p4-i3-r1-c1-r2-r2/diagnostic-contract-v1.json",
  "evals/runtime/m2-p4-i3-r1-c1-r2-r2/quality-contract-v1.json",
  "evals/runtime/m2-p4-i3-r1-c1-r2-r2/authorization-v1.json",
  "evals/runtime/m2-p4-i3-r1-c1-r2-r2/diagnostic-results-v1.json",
  "evals/runtime/m2-p4-i3-r1-c1-r2-r2/diagnostic-summary-v1.md",
  "scripts/lib/m2-p4-i3-r1-c1-r2-r2-provider-evaluator-v1.mjs",
  "scripts/run-m2-p4-i3-r1-c1-r2-r2-provider-diagnostic.mjs",
  "scripts/verify-m2-p4-i3-r1-c1-r2-r1-semantic-consistency.mjs",
];
const immutableR2R2ReviewPaths = [
  "evals/runtime/m2-p4-i3-r1-c1-r2-r2/capabilities-v1.json",
  "scripts/verify-m2-p4-i3-r1-c1-r2-r2-provider-diagnostic.mjs",
  "docs/phase2/TASK_M2_P4_I3_R1_C1_R2_R2_REVIEW.md",
];

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

function source(relativePath) {
  return readFileSync(path.join(repositoryRoot, relativePath), "utf8");
}

function json(relativePath) {
  return JSON.parse(source(relativePath));
}

function canonicalText(value) {
  return value.replace(/\r\n/gu, "\n");
}

function hashText(value) {
  return createHash("sha256")
    .update(Buffer.from(canonicalText(value), "utf8"))
    .digest("hex");
}

function same(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function currentTaskPaths() {
  const paths = new Set(
    gitText(["diff", "--name-only", baseline, "--"])
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
  return [...paths].sort((left, right) => left.localeCompare(right, "en"));
}

function assertExactPaths(actual, expected, label) {
  const literal = actual.every(
    (item) =>
      typeof item === "string" &&
      item.length > 0 &&
      !item.includes("*") &&
      !item.endsWith("/"),
  );
  if (
    actual.length !== expected.length ||
    new Set(actual).size !== expected.length ||
    !literal ||
    !same(actual, expected)
  ) {
    throw new Error(`${label}: ${JSON.stringify(actual)}`);
  }
}

function assertUnchanged(relativePath) {
  const changed = gitText([
    "diff",
    "--name-only",
    baseline,
    "--",
    relativePath,
  ]).trim();
  if (changed !== "") {
    throw new Error(`immutable predecessor changed: ${relativePath}`);
  }
}

const promptPath =
  "lib/assessment/runtime/contracts/pb-01-structure-v7.developer.md";
const catalogPath =
  "lib/assessment/runtime/contracts/runtime-stage-catalog-v8.json";
const artifactRoot = "evals/runtime/m2-p4-i3-r1-c1-r2-r2-r1";
const contractPath = `${artifactRoot}/practical-reason-consistency-contract-v1.json`;
const analysisPath = `${artifactRoot}/offline-analysis-v1.json`;
const capabilitiesPath = `${artifactRoot}/capabilities-v1.json`;

const actualPaths = currentTaskPaths();
assertExactPaths(actualPaths, exactPaths, "exact 13-path scope differs");

for (const immutablePath of [
  "lib/assessment/runtime/contracts/pb-01-structure-v6.developer.md",
  "lib/assessment/runtime/contracts/runtime-stage-catalog-v7.json",
  ...immutableR2R2ExecutionPaths,
  ...immutableR2R2ReviewPaths,
]) {
  assertUnchanged(immutablePath);
}

const prompt = source(promptPath);
const promptRequiredFragments = [
  "# PB-01 Runtime Structure — Developer Contract v7.0.0",
  "Preserve every PB-01 v6 responsibility",
  "## Known-taxonomy precedence",
  "## Cross-projection semantic agreement",
  "decision_facts.latest_direct_message",
  "decision_facts.practical_reason",
  "message_signals",
  "incoming_message_profile",
  "candidate_communicative_intent",
  "boundary_ownership_signals",
  "### Practical-reason consistency",
  "explicitly asks about a date, a day of the week, a time, availability, rescheduling, meeting timing, or another concrete schedule choice",
  "requires a schedule-related response",
  "practical_reason.kind=schedule_coordination",
  "practical_reason.active=true",
  "either `question` or `schedule_coordination`",
  "An incoming schedule question with `response_expectation=reasonable` must not coexist with `practical_reason.kind=none` and `practical_reason.active=false`.",
  "When an incoming profile includes `confirm_schedule`, it must agree with `practical_reason.kind=schedule_coordination` and `practical_reason.active=true`.",
  "A candidate's schedule content alone must not manufacture an incoming practical reason.",
  "`optional_message` must not create the incoming practical reason.",
  "Require current-situation evidence of an actual scheduling question, concrete choice, obligation, change, or coordination need.",
  "Do not set `schedule_coordination` merely because an invitation exists, the relationship is romantic, the user wants to send a message, a future meeting is vaguely mentioned, or an optional candidate proposes a date absent from the consultation situation.",
  "PB-01 does not select or change Decision Policy.",
  "Do not add raw-prose keyword lists, regular-expression classification, or Application-side language-specific rules.",
  "## Final internal consistency check",
  "without exposing private reasoning, hidden analysis, or chain-of-thought",
  "practical reason, and boundary ownership agree across projections",
  "candidate-only schedule content creates no incoming practical reason",
];
for (const fragment of promptRequiredFragments) {
  if (!prompt.includes(fragment)) {
    throw new Error(`PB-01 v7 missing contract fragment: ${fragment}`);
  }
}
for (const forbidden of [
  /R2R2/iu,
  /R2-\d{2}/iu,
  /PAIR-\d{2}/iu,
  /V4-\d{2}/iu,
  /fixture/iu,
  /oracle/iu,
  /benchmark/iu,
  /[\u3040-\u30ff\u3400-\u9fff]/u,
]) {
  if (forbidden.test(prompt)) {
    throw new Error(`PB-01 v7 contains forbidden diagnostic content: ${forbidden}`);
  }
}

const catalogV7 = json(
  "lib/assessment/runtime/contracts/runtime-stage-catalog-v7.json",
);
const catalogV8 = json(catalogPath);
if (
  catalogV8.catalog_version !== "runtime-stage-catalog-v8.0.0" ||
  catalogV8.prompt_bundle_version !== "prompt-bundle-runtime-v8.0.0" ||
  catalogV8.schema_set_version !== "pipeline-schema-runtime-v3.2.0" ||
  catalogV8.baseline !== baseline ||
  catalogV8.stages[0].source !==
    "m2-p4-practical-reason-consistency-successor" ||
  catalogV8.stages[0].prompt_version !== "v7.0.0" ||
  catalogV8.stages[0].prompt_path !== promptPath ||
  catalogV8.stages[0].prompt_sha256 !== hashText(prompt) ||
  catalogV8.stages[0].schema_version !== "pipeline-schema-v5.0.0" ||
  catalogV8.stages[0].schema_path !==
    "lib/assessment/runtime/contracts/structured-intake-v5.schema.json" ||
  catalogV8.stages[0].grounded_schema_version !==
    "pipeline-schema-v4.0.0" ||
  catalogV8.stages[0].grounded_schema_path !==
    "lib/assessment/runtime/contracts/structured-intake-v4.schema.json" ||
  !same(catalogV8.common_prompt, catalogV7.common_prompt) ||
  !same(catalogV8.stages.slice(1), catalogV7.stages.slice(1))
) {
  throw new Error("inactive catalog v8 or PB-02 through PB-06 parity differs");
}

const candidateCatalog =
  await loadM2P4PracticalReasonConsistencyRuntimeStageCatalog();
const activeCatalog = await loadM2P4ProductQualityRuntimeStageCatalog();
if (
  candidateCatalog.promptBundleVersion !== "prompt-bundle-runtime-v8.0.0" ||
  candidateCatalog.schemaSetVersion !== "pipeline-schema-runtime-v3.2.0" ||
  candidateCatalog.definitions.length !== 6 ||
  candidateCatalog.definitions[0].promptVersion !== "v7.0.0" ||
  candidateCatalog.definitions[0].schemaVersion !== "pipeline-schema-v5.0.0" ||
  candidateCatalog.definitions[0].groundedSchemaVersion !==
    "pipeline-schema-v4.0.0" ||
  activeCatalog.promptBundleVersion !== "prompt-bundle-runtime-v4.0.0" ||
  activeCatalog.schemaSetVersion !== "pipeline-schema-runtime-v3.0.0"
) {
  throw new Error("candidate or active Runtime catalog boundary differs");
}
const serviceSource = source("lib/assessment/runtime/service.ts");
if (
  !serviceSource.includes("loadM2P4ProductQualityRuntimeStageCatalog") ||
  serviceSource.includes(
    "loadM2P4PracticalReasonConsistencyRuntimeStageCatalog",
  ) ||
  serviceSource.includes("runtime-stage-catalog-v8")
) {
  throw new Error("active Service was wired to inactive catalog v8");
}

const layer1Suite = json(
  "evals/quality/m2-p4-i3-r1-contrast-suite-v1.json",
);
const canonicalSuite = json(
  "evals/quality/m2-p4-i3-r1-canonical-suite-v2.json",
);
const canonicalCategories = Object.entries(canonicalSuite.categories);
const canonicalCases = canonicalCategories.flatMap(
  ([, category]) => category.cases,
);
const canonicalCaseIds = canonicalCases.map((item) => item.case_id);
for (const categoryName of canonicalSuite.layer_assignments.layer_1) {
  if (
    !same(
      canonicalSuite.categories[categoryName],
      layer1Suite.categories[categoryName],
    )
  ) {
    throw new Error(`Canonical Suite Layer 1 drift: ${categoryName}`);
  }
}
if (
  canonicalSuite.declared_counts.layer_1 !== 32 ||
  canonicalSuite.declared_counts.layer_2 !== 32 ||
  canonicalSuite.declared_counts.total !== 64 ||
  canonicalSuite.declared_counts.category_count !== 8 ||
  canonicalSuite.declared_counts.cases_per_category !== 8 ||
  canonicalCategories.length !== 8 ||
  canonicalCategories.some(([, category]) => category.cases.length !== 8) ||
  canonicalCases.length !== 64 ||
  new Set(canonicalCaseIds).size !== 64 ||
  canonicalSuite.declared_counts.duplicate_case_ids !== 0
) {
  throw new Error("Canonical Suite 64-case boundary differs");
}

const r2r2Capabilities = json(
  "evals/runtime/m2-p4-i3-r1-c1-r2-r2/capabilities-v1.json",
);
const r2r2Results = json(
  "evals/runtime/m2-p4-i3-r1-c1-r2-r2/diagnostic-results-v1.json",
);
const savedControl = r2r2Results.calls.find(
  (item) => item.case_id === "R2R2-04",
);
const rawFacts = savedControl?.raw_output?.decision_facts;
const rawSignals = savedControl?.raw_output?.writing_signals;
const groundedFacts = savedControl?.grounded_output?.decision_facts;
if (
  !savedControl ||
  savedControl.ownership_results?.passed !== true ||
  !same(rawFacts?.latest_direct_message, {
    sender: "other_person",
    kind: "question",
    response_expectation: "reasonable",
    user_reply_state: "not_replied",
    sns_signal_only: false,
  }) ||
  !same(rawFacts?.practical_reason, {
    kind: "none",
    active: false,
    deadline: "none",
  }) ||
  rawSignals?.incoming_message_profile?.present !== true ||
  !rawSignals.incoming_message_profile.dialogue_acts.includes("question") ||
  !rawSignals.incoming_message_profile.practical_requirements.includes(
    "answer_question",
  ) ||
  !rawSignals.candidate_communicative_intent?.practical_requirement.includes(
    "confirm_schedule",
  ) ||
  !same(rawSignals.message_signals, [
    { author: "user", status: "sent_by_user" },
    { author: "other_person", status: "incoming" },
  ]) ||
  !groundedFacts
) {
  throw new Error("saved practical-reason or ownership evidence differs");
}

const comparisonFacts = structuredClone(groundedFacts);
comparisonFacts.practical_reason = {
  kind: "schedule_coordination",
  active: true,
  deadline: "unknown",
};
const actualPolicy = buildContextualDecisionPolicyV3(groundedFacts);
const comparisonPolicy = buildContextualDecisionPolicyV3(comparisonFacts);
if (
  !same(actualPolicy, comparisonPolicy) ||
  !same(actualPolicy.allowed_decisions, ["reply_now"]) ||
  !same(actualPolicy.reason_codes, ["unanswered_meaningful_message"]) ||
  r2r2Capabilities.targeted_repairs_passed !== "3/3" ||
  r2r2Capabilities.ownership_sequence_control_passed !== true ||
  r2r2Capabilities.r2r2_04_classification !==
    "decision_policy_equivalent_but_semantically_incomplete" ||
  r2r2Capabilities.decision_policy_equivalent !== true ||
  r2r2Capabilities.decision_facts_semantic_completeness_passed !== false ||
  r2r2Capabilities.provider_quality_established !== false ||
  r2r2Capabilities.full_eight_case_confirmation_required !== true ||
  r2r2Results.provider_output_mutation_count !== 0
) {
  throw new Error("saved R2-R2 conclusion or Policy equivalence differs");
}

const contract = json(contractPath);
const analysis = json(analysisPath);
const capabilities = json(capabilitiesPath);
assertExactPaths(
  [...contract.exact_mutation_paths].sort((left, right) =>
    left.localeCompare(right, "en"),
  ),
  exactPaths,
  "contract path manifest differs",
);
assertExactPaths(
  [...capabilities.exact_mutation_paths].sort((left, right) =>
    left.localeCompare(right, "en"),
  ),
  exactPaths,
  "capability path manifest differs",
);
assertExactPaths(
  [...contract.immutable_predecessors.r2_r2_execution_artifacts].sort(
    (left, right) => left.localeCompare(right, "en"),
  ),
  [...immutableR2R2ExecutionPaths].sort((left, right) =>
    left.localeCompare(right, "en"),
  ),
  "immutable R2-R2 execution manifest differs",
);
assertExactPaths(
  [...contract.immutable_predecessors.r2_r2_review_records].sort(
    (left, right) => left.localeCompare(right, "en"),
  ),
  [...immutableR2R2ReviewPaths].sort((left, right) =>
    left.localeCompare(right, "en"),
  ),
  "immutable R2-R2 review manifest differs",
);

if (
  contract.exact_mutation_path_count !== 13 ||
  contract.candidate.prompt_sha256_utf8_lf !== hashText(prompt) ||
  contract.candidate.catalog_version !== "runtime-stage-catalog-v8.0.0" ||
  contract.candidate.prompt_bundle_version !==
    "prompt-bundle-runtime-v8.0.0" ||
  contract.candidate.provider_schema_version !== "pipeline-schema-v5.0.0" ||
  contract.candidate.candidate_runtime_schema_set !==
    "pipeline-schema-runtime-v3.2.0" ||
  contract.candidate.grounded_schema_version !== "pipeline-schema-v4.0.0" ||
  contract.candidate.inactive !== true ||
  contract.rule_families.practical_reason_consistency.required !== true ||
  contract.rule_families.practical_reason_consistency
    .current_situation_evidence_required !== true ||
  !same(
    contract.rule_families.practical_reason_consistency
      .required_practical_reason,
    { kind: "schedule_coordination", active: true },
  ) ||
  contract.rule_families.cross_projection_consistency
    .reasonable_incoming_schedule_question_with_none_false_allowed !== false ||
  contract.rule_families.cross_projection_consistency
    .incoming_confirm_schedule_requires_schedule_coordination_true !== true ||
  contract.rule_families.cross_projection_consistency
    .candidate_schedule_content_can_create_incoming_reason !== false ||
  contract.rule_families.cross_projection_consistency
    .optional_message_can_create_incoming_reason !== false ||
  contract.rule_families.cross_projection_consistency
    .pb_01_selects_or_changes_decision_policy !== false ||
  contract.rule_families.do_not_over_infer
    .actual_schedule_question_choice_obligation_change_or_coordination_required !==
    true ||
  contract.prompt_content_boundary.diagnostic_case_ids !== 0 ||
  contract.prompt_content_boundary.benchmark_wording !== 0 ||
  contract.prompt_content_boundary.raw_prose_regex_rules !== 0 ||
  contract.prompt_content_boundary.application_side_language_specific_rules !==
    0 ||
  contract.runtime_boundary.active_runtime_changed !== false ||
  contract.execution_boundary.provider_calls !== 0 ||
  contract.execution_boundary.openai_calls !== 0 ||
  contract.execution_boundary.db_operations !== 0 ||
  contract.execution_boundary.supabase_operations !== 0 ||
  contract.execution_boundary.holdout_use !== 0 ||
  contract.execution_boundary.real_user_data !== 0 ||
  analysis.analysis_mode !== "immutable_saved_r2_r2_evidence_only" ||
  analysis.preserved_results.targeted_repairs !== "3/3" ||
  analysis.preserved_results.ownership_sequence !== "PASS" ||
  analysis.observed_semantic_account.message_ownership_recognized !== true ||
  analysis.analysis.incoming_question_and_ownership_recognized !== true ||
  analysis.analysis.schedule_coordination_true_omitted !== true ||
  analysis.analysis.omission_policy_equivalent_for_saved_case !== true ||
  analysis.analysis.omission_semantically_incomplete !== true ||
  analysis.analysis.prompt_successor_addresses_semantic_inconsistency !== true ||
  analysis.policy_comparison.actual_and_comparison_deep_equal !== true ||
  analysis.policy_comparison.decision_policy_changed !== false ||
  analysis.evidence.provider_outputs_mutated !== 0 ||
  analysis.execution.provider_calls !== 0 ||
  analysis.execution.provider_outputs_mutated !== 0 ||
  analysis.conclusion.provider_quality_established !== false ||
  analysis.conclusion.final_eight_case_confirmation_required !== true ||
  capabilities.status !==
    "offline_revision_implemented_pending_human_chatgpt_review" ||
  capabilities.exact_mutation_path_count !== 13 ||
  capabilities.practical_reason_consistency_implemented !== true ||
  capabilities.targeted_repairs_preserved !== "3/3" ||
  capabilities.ownership_sequence_preserved !== true ||
  capabilities.provider_calls !== 0 ||
  capabilities.provider_outputs_mutated !== 0 ||
  capabilities.provider_quality_established !== false ||
  capabilities.final_eight_case_confirmation_required !== true ||
  capabilities.active_runtime_changed !== false ||
  capabilities.protected_diff !== 0 ||
  capabilities.c2_eligible !== false ||
  capabilities.c2_authorized !== false ||
  capabilities.next_candidate !==
    "M2-P4-I3-R1-C1-R3 Final Eight-Case PB-01 Provider Confirmation" ||
  capabilities.next_candidate_authorized !== false ||
  capabilities.i3_final_acceptance !== "pending" ||
  capabilities.milestone_2 !== "incomplete"
) {
  throw new Error("practical-reason contract, analysis, or capability differs");
}

for (const [documentPath, fragments] of Object.entries({
  "docs/phase2/TASK_M2_P4_I3_R1_C1_R2_R2_R1_REVIEW.md": [
    "offline_revision_implemented_pending_human_chatgpt_review",
    "Targeted repairs preserved: `3/3`",
    "Ownership sequence preserved: `true`",
    "Provider calls / Provider outputs mutated: `0 / 0`",
    "Provider quality established: `false`",
    "Final eight-case confirmation required: `true`",
    "C2 eligible / authorized: `false / false`",
  ],
  "docs/CURRENT_FOCUS.md": [
    "M2-P4-I3-R1-C1-R2-R2-R1",
    "offline_revision_implemented_pending_human_chatgpt_review",
    "catalog v8",
  ],
  "docs/WBS.md": [
    "M2-P4-I3-R1-C1-R2-R2-R1 Current Gate",
    "final eight-case Provider confirmation remains required",
    "C2 remains unauthorized",
  ],
  "docs/CODEX_HANDOFF.md": [
    "M2-P4-I3-R1-C1-R2-R2-R1",
    "Prompt v7",
    "next candidate is `M2-P4-I3-R1-C1-R3 Final Eight-Case PB-01 Provider Confirmation` and is unauthorized",
  ],
})) {
  const document = source(documentPath);
  for (const fragment of fragments) {
    if (!document.includes(fragment)) {
      throw new Error(`${documentPath} missing status fragment: ${fragment}`);
    }
  }
}

const authorizedProductionPaths = new Set([
  promptPath,
  catalogPath,
  "lib/assessment/runtime/schema-catalog.ts",
]);
const protectedPattern =
  /^(?:app|components|fixtures|lib|public|supabase)\/|^package(?:-lock)?\.json$|(?:^|\/)\.env(?:\.|$)/u;
const unauthorizedProtectedPaths = actualPaths.filter(
  (item) => protectedPattern.test(item) && !authorizedProductionPaths.has(item),
);
if (unauthorizedProtectedPaths.length !== 0) {
  throw new Error(
    `protected Production diff differs: ${JSON.stringify(unauthorizedProtectedPaths)}`,
  );
}

for (const executablePath of [
  "lib/assessment/runtime/schema-catalog.ts",
  "scripts/verify-m2-p4-i3-r1-c1-r2-r2-r1-practical-reason-consistency.mjs",
]) {
  const executableSource = source(executablePath);
  for (const forbiddenExecution of [
    ["openai", "transport"].join("-"),
    ["provider", "runner"].join("-"),
    ["@supabase", "supabase-js"].join("/"),
    [".env", ".local"].join(""),
    ["responses", "create"].join("."),
    ["new", "OpenAI"].join(" "),
  ]) {
    if (executableSource.includes(forbiddenExecution)) {
      throw new Error(`${executablePath} contains forbidden execution wiring`);
    }
  }
}

const main = gitText(["rev-parse", "main"]).trim();
const originMain = gitText(["rev-parse", "origin/main"]).trim();
if (main !== expectedMain || originMain !== expectedMain) {
  throw new Error(`main boundary differs: main=${main}; origin/main=${originMain}`);
}

gitText(["diff", "--check", baseline, "--"]);

console.log("M2_P4_I3_R1_C1_R2_R2_R1_PRACTICAL_REASON_CONSISTENCY: PASS");
console.log("exact_scope: 13/13");
console.log("prompt_v6_unchanged: PASS");
console.log("catalog_v7_unchanged: PASS");
console.log("r2_r2_execution_artifacts_unchanged: 9/9");
console.log("r2_r2_review_records_unchanged: 3/3");
console.log("practical_reason_consistency: PASS");
console.log("concrete_schedule_evidence_required: true");
console.log("optional_message_incoming_reason_prohibited: true");
console.log("catalog_parity_pb02_pb06: 5/5");
console.log("canonical_suite: 64/64");
console.log("targeted_repairs_preserved: 3/3");
console.log("ownership_sequence_preserved: true");
console.log("decision_policy_equivalent: PASS");
console.log("provider_calls: 0");
console.log("provider_outputs_mutated: 0");
console.log("active_runtime_changed: false");
console.log("provider_quality_established: false");
console.log("final_eight_case_confirmation_required: true");
console.log("main_unchanged: PASS");
console.log("c2_authorized: false");
console.log("protected_diff: 0");
console.log("git_diff_check: PASS");
