import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { TextDecoder } from "node:util";

const repositoryRoot = process.cwd();
const baseline = "366b99b19ccf7f2aabe92fa760d07521de5e4104";
const expectedParent = "f0b5dff36b63a9deaf5f87f8825911b0510ac0b1";
const evidenceCommitB = "9e9bf7d90740c1d00bfc4e282c85906744cd736c";
const packageCommitA = "6eea601c99f18cbde62659140502d0456b0b505b";
const mainBaseline = "61e33a10e195fad17e253a6b9719217e1992f273";
const expectedBranch =
  "plan/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p1-v12-decomposition";
const artifactRoot =
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p1";

const exactScope = [
  artifactRoot + "/source-contract-v1.json",
  artifactRoot + "/architecture-audit-v1.md",
  artifactRoot + "/runtime-output-compatibility-matrix-v1.json",
  artifactRoot + "/implementation-work-packages-v1.json",
  artifactRoot + "/acceptance-matrix-v1.json",
  artifactRoot + "/capabilities-v1.json",
  "scripts/verify-m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p1-v12-decomposition.mjs",
  "docs/phase2/TASK_M2_P4_I3_R1_C1_R3_R2_E_R3_R3_R3_P1_REVIEW.md",
  "docs/CURRENT_FOCUS.md",
  "docs/WBS.md",
  "docs/CODEX_HANDOFF.md",
];

const newPaths = exactScope.slice(0, 8);
const updatedPaths = exactScope.slice(8);
const results = [];

function git(...args) {
  return execFileSync(
    "git.exe",
    ["-c", "safe.directory=C:/projects/moon-reply", ...args],
    {
      cwd: repositoryRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    },
  ).trim();
}

function gitSucceeds(...args) {
  const result = spawnSync(
    "git.exe",
    ["-c", "safe.directory=C:/projects/moon-reply", ...args],
    {
      cwd: repositoryRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  return result.status === 0;
}

function readBuffer(relativePath) {
  return readFileSync(path.join(repositoryRoot, relativePath));
}

function readText(relativePath) {
  return readBuffer(relativePath).toString("utf8");
}

function readJson(relativePath) {
  return JSON.parse(readText(relativePath));
}

function sha256(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

function same(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function sorted(values) {
  return [...values].sort();
}

function record(name, passed, detail = "") {
  results.push({ name, passed, detail });
}

function changedPaths() {
  const groups = [
    git("diff", "--name-only", baseline, "HEAD"),
    git("diff", "--name-only"),
    git("diff", "--name-only", "--cached"),
    git("ls-files", "--others", "--exclude-standard"),
  ];
  return sorted(
    new Set(
      groups
        .flatMap((value) => value.split(/\r?\n/u))
        .map((value) => value.trim().replaceAll("\\", "/"))
        .filter(Boolean),
    ),
  );
}

function baselineHas(relativePath) {
  return gitSucceeds("cat-file", "-e", baseline + ":" + relativePath);
}

function baselineText(relativePath) {
  return execFileSync(
    "git.exe",
    [
      "-c",
      "safe.directory=C:/projects/moon-reply",
      "show",
      baseline + ":" + relativePath,
    ],
    {
      cwd: repositoryRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
}

function markedBlock(text, marker) {
  const start = "<!-- " + marker + ":BEGIN -->";
  const end = "<!-- " + marker + ":END -->";
  const startIndex = text.indexOf(start);
  const endIndex = text.indexOf(end);
  if (startIndex < 0 || endIndex < startIndex) return null;
  return text.slice(startIndex, endIndex + end.length);
}

function strictUtf8(buffer) {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(buffer);
  } catch {
    return null;
  }
}

const source = readJson(artifactRoot + "/source-contract-v1.json");
const compatibility = readJson(
  artifactRoot + "/runtime-output-compatibility-matrix-v1.json",
);
const packages = readJson(
  artifactRoot + "/implementation-work-packages-v1.json",
);
const acceptance = readJson(artifactRoot + "/acceptance-matrix-v1.json");
const capabilities = readJson(artifactRoot + "/capabilities-v1.json");
const architecture = readText(artifactRoot + "/architecture-audit-v1.md");
const review = readText(
  "docs/phase2/TASK_M2_P4_I3_R1_C1_R3_R2_E_R3_R3_R3_P1_REVIEW.md",
);
const priorSource = readJson(
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3/source-contract-v1.json",
);
const priorDecision = readJson(
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3/product-owner-review-decision-v1.json",
);
const priorCharter = readJson(
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3/v12-remediation-charter-v1.json",
);
const authorization = readJson(
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3/authorization-v1.json",
);

record(
  "branch and baseline ancestry",
  git("branch", "--show-current") === expectedBranch &&
    gitSucceeds("merge-base", "--is-ancestor", baseline, "HEAD") &&
    Number(git("rev-list", "--count", baseline + "..HEAD")) <= 1,
);
record(
  "baseline parent exact",
  git("rev-parse", baseline + "^") === expectedParent,
);
record(
  "Evidence Commit B and Package Commit A ancestry",
  gitSucceeds("merge-base", "--is-ancestor", packageCommitA, evidenceCommitB) &&
    gitSucceeds("merge-base", "--is-ancestor", evidenceCommitB, baseline),
);
record(
  "main and origin/main unchanged",
  git("rev-parse", "main") === mainBaseline &&
    git("rev-parse", "origin/main") === mainBaseline,
);
record(
  "exact planning scope 11/11",
  same(changedPaths(), sorted(exactScope)) &&
    same(source.exact_scope, exactScope) &&
    source.exact_scope_count === 11 &&
    source.new_path_count === 8 &&
    source.updated_path_count === 3,
);
record(
  "new and updated path classification",
  newPaths.every(
    (relativePath) => !baselineHas(relativePath) && existsSync(relativePath),
  ) &&
    updatedPaths.every(
      (relativePath) => baselineHas(relativePath) && existsSync(relativePath),
    ),
);

const authorityPaths = source.authority_manifest.map((item) => item.path);
record(
  "authority manifest exact and unique 44/44",
  source.authority_manifest_count === 44 &&
    source.authority_manifest.length === 44 &&
    new Set(authorityPaths).size === 44,
);
record(
  "authority Git blob SHA raw SHA-256 and bytes",
  source.authority_manifest.every((item) => {
    const buffer = readBuffer(item.path);
    return (
      git("rev-parse", baseline + ":" + item.path) === item.git_blob_sha &&
      git("hash-object", item.path) === item.git_blob_sha &&
      sha256(buffer) === item.raw_sha256 &&
      statSync(item.path).size === item.bytes
    );
  }),
);
record(
  "authority strict UTF-8 and U+FFFD count zero",
  source.authority_manifest.every((item) => {
    const decoded = strictUtf8(readBuffer(item.path));
    return decoded !== null && !decoded.includes("\uFFFD");
  }),
);

record(
  "preflight contract exact",
  source.status ===
      "v12_implementation_decomposition_ready_pending_human_chatgpt_review" &&
    source.mode === "read_only_analysis_planning_only" &&
    source.branch === expectedBranch &&
    source.baseline === baseline &&
    source.expected_parent === expectedParent &&
    source.evidence_commit_b === evidenceCommitB &&
    source.package_commit_a === packageCommitA &&
    source.main_baseline === mainBaseline &&
    Object.values(source.preflight).every(
      (value) =>
        value === true ||
        value === false ||
        value === "PASS" ||
        value === "PASS_39_OF_39",
    ) &&
    source.preflight.rerun_authorized === false,
);

record(
  "frozen prior decision and charter authority",
  priorSource.status === "product_owner_review_complete_remediation_required" &&
    priorSource.evidence_commit_b === evidenceCommitB &&
    priorSource.package_commit_a === packageCommitA &&
    priorDecision.product_owner_review_complete === true &&
    priorDecision.overall_product_judgment ===
      "not_ready_for_jpy_980_runtime_activation" &&
    priorDecision.successor_remediation_planning_approved === true &&
    priorDecision.successor_remediation_implementation_approved === false &&
    priorDecision.provider_rerun_authorized === false &&
    priorCharter.planning_approved === true &&
    priorCharter.implementation_authorized === false &&
    priorCharter.provider_rerun_authorized === false,
);

const frozenPaths = [
  ...new Set([
    ...priorSource.frozen_evidence_paths,
    ...priorSource.frozen_package_paths,
    ...priorSource.frozen_review_packet.scope.slice(0, 8),
  ]),
];
record(
  "frozen Evidence Package Review Packet immutable",
  frozenPaths.every(
    (relativePath) =>
      git("hash-object", relativePath) ===
      git("rev-parse", baseline + ":" + relativePath),
  ),
);

const markerPath = path.join(repositoryRoot, source.frozen_state.marker_path);
record(
  "marker unchanged",
  existsSync(markerPath) &&
    sha256(readFileSync(markerPath)) ===
      source.frozen_state.marker_raw_sha256,
);
record(
  "authorization consumed unchanged rerun false",
  git("hash-object", source.frozen_state.authorization_path) ===
      source.frozen_state.authorization_git_blob_sha &&
    sha256(readBuffer(source.frozen_state.authorization_path)) ===
      source.frozen_state.authorization_raw_sha256 &&
    source.frozen_state.authorization_consumed === true &&
    source.frozen_state.rerun_authorized === false &&
    authorization.consumed === true &&
    authorization.rerun_authorized === false,
);

for (const marker of [
  "M2-P4-I3-R1-C1-R3-R2-E-R3-R3-R3",
  "M2-P4-I3-R1-C1-R3-R2-E-R3-R3-R2",
]) {
  record(
    "rolling document prior block unchanged " + marker,
    updatedPaths.every((relativePath) => {
      const current = markedBlock(readText(relativePath), marker);
      const historical = markedBlock(baselineText(relativePath), marker);
      return current !== null && current === historical;
    }),
  );
}

const variantIds = compatibility.runtime_result_union.variants.map(
  (item) => item.variant_id,
);
record(
  "runtime result union exact four variants",
  same(variantIds, [
    "legacy_ready",
    "split_ready",
    "safety_blocked",
    "needs_more_information",
  ]) &&
    same(compatibility.runtime_result_union.discriminator_order, [
      "eligibility",
      "report.schemaVersion",
    ]),
);
record(
  "active and inactive Runtime output mapping",
  compatibility.runtime_identities.length === 10 &&
    compatibility.runtime_identities.filter((item) => item.active_service)
      .length === 1 &&
    compatibility.runtime_identities.find((item) => item.active_service)
      ?.catalog === "runtime-stage-catalog-v4.0.0" &&
    compatibility.runtime_identities
      .filter((item) => ["v9", "v10", "v11"].some((v) => item.catalog.includes(v)))
      .every(
        (item) =>
          item.topology === "split-base-candidate-v1" &&
          item.ready_result_variant === "split_ready" &&
          item.active_service === false,
      ),
);
record(
  "unsafe narrowing finding exact",
  compatibility.type_narrowing_audit.result === "unsafe" &&
    compatibility.type_narrowing_audit.split_can_reach_runtime_assessment_note ===
      true &&
    compatibility.type_narrowing_audit
      .static_typecheck_masks_runtime_shape_mismatch === true &&
    compatibility.type_narrowing_audit.api_payload_runtime_validation === false &&
    compatibility.type_narrowing_audit.persisted_report_runtime_validation ===
      false,
);

const requiredFieldIds = [
  "final_draft",
  "aftercare_plan",
  "aftercare_commentary",
  "message_temperature",
  "relationship_summary",
  "decision",
  "review_timing",
  "final_draft_copy_surface",
];
record(
  "required renderer compatibility rows",
  requiredFieldIds.every((fieldId) =>
    compatibility.field_compatibility.some(
      (item) =>
        item.field_id === fieldId &&
        typeof item.legacy_path === "string" &&
        typeof item.split_path === "string" &&
        typeof item.current_guard === "string" &&
        typeof item.possible_runtime_failure === "string" &&
        typeof item.required_adapter === "string",
    ),
  ),
);
record(
  "split first failure and nullable guards",
  compatibility.field_compatibility.find(
    (item) => item.field_id === "aftercare_plan",
  )?.possible_runtime_failure ===
      "first_deterministic_split_ready_failure_is_TypeError_reading_three_day_plan.length" &&
    compatibility.field_compatibility.find(
      (item) => item.field_id === "message_temperature",
    )?.nullable.split === true &&
    compatibility.field_compatibility.find(
      (item) => item.field_id === "relationship_summary",
    )?.nullable.split === true,
);
record(
  "presentation density finding",
  compatibility.presentation_density.requested_topics_currently_select_visible_sections ===
      false &&
    compatibility.presentation_density
      .internal_evidence_fields_rendered_without_topic_or_semantic_gate === true &&
    compatibility.presentation_density.current_customer_projection_layer ===
      "absent" &&
    compatibility.presentation_density.full_persisted_report_is_rendered_directly ===
      true,
);

const architecturePhrases = [
  "Full structured report → deterministic CustomerAssessmentProjection → UI",
  "Payment implementation state: absent",
  "static typecheck currently masks",
  "three_day_plan.length",
  "message_temperature=null",
  "Internal audit model",
  "Persisted Product report",
  "CustomerAssessmentProjection",
  "Customer-facing visual sections",
  "No additional bounded text-generation stage is necessary",
  "Product Owner review of actual successor final outputs",
];
record(
  "architecture audit mandatory findings",
  architecturePhrases.every((phrase) => architecture.includes(phrase)),
);
record(
  "architecture and review authorization boundary",
  [architecture, review].every(
    (text) =>
      text.includes("v12 implementation authorized: false") ||
      text.includes("v12_implementation_authorized: false"),
  ) &&
    architecture.includes("Provider rerun ready / authorized: false / false") &&
    review.includes("Provider / DB / Supabase 0 / 0 / 0"),
);

const packageIds = packages.packages.map((item) => item.package_id);
const proposedPaths = packages.packages.flatMap((item) => item.proposed_paths);
record(
  "Packages A through F exact",
  same(packageIds, ["A", "B", "C", "D", "E", "F"]) &&
    same(packages.package_order, ["A", "B", "C", "D", "E", "F"]),
);
record(
  "future package path manifests pairwise disjoint",
  packages.path_overlap_policy.proposed_paths_are_pairwise_disjoint === true &&
    packages.path_overlap_policy.shared_path_count === 0 &&
    new Set(proposedPaths).size === proposedPaths.length,
);
record(
  "future package required fields",
  packages.packages.every(
    (item) =>
      item.exact_responsibility.length > 0 &&
      item.prerequisites.length > 0 &&
      item.proposed_branch.length > 0 &&
      item.proposed_paths.length > 0 &&
      item.explicit_non_goals.length > 0 &&
      item.tests.length > 0 &&
      item.acceptance_gate.length > 0 &&
      typeof item.provider_calls_required === "boolean" &&
      typeof item.human_visual_review_required === "boolean",
  ),
);
record(
  "future packages remain Provider-zero",
  packages.packages.every((item) => item.provider_calls_required === false) &&
    packages.operations.provider_calls === 0 &&
    packages.operations.db_operations === 0 &&
    packages.operations.supabase_operations === 0 &&
    packages.operations.implementation_started === false,
);
record(
  "Human visual review assignment",
  packages.packages.find((item) => item.package_id === "A")
    ?.human_visual_review_required === false &&
    packages.packages.find((item) => item.package_id === "B")
      ?.human_visual_review_required === true &&
    packages.packages.find((item) => item.package_id === "E")
      ?.human_visual_review_required === true &&
    packages.packages.find((item) => item.package_id === "F")
      ?.human_visual_review_required === true,
);
record(
  "global implementation boundary",
  packages.global_acceptance_boundary.v12_implementation_authorized === false &&
    packages.global_acceptance_boundary.provider_rerun_authorized === false &&
    packages.global_acceptance_boundary
      .active_runtime_activation_authorized === false &&
    packages.global_acceptance_boundary.r4_authorized === false &&
    packages.global_acceptance_boundary.c2_authorized === false &&
    packages.global_acceptance_boundary.main_integration_authorized === false &&
    packages.global_acceptance_boundary
      .product_owner_review_of_actual_successor_output_mandatory === true,
);

const mandatoryRequirements = [
  "legacy_ready_result",
  "split_ready_result",
  "split_message_temperature_null",
  "split_relationship_summary_null",
  "reply_now_with_draft",
  "wait_and_reassess_with_no_draft",
  "pause_additional_contact_with_no_draft",
  "safety_blocked_with_no_report",
  "explicit_no_contact",
  "simple_business_correction",
  "ordinary_reply_waiting",
  "natural_polite_thank_you",
  "kansai_persona_preserved_candidate",
  "unsupported_causal_attribution",
  "unsupported_chronology",
  "anxiety_amplifying_negative_enumeration",
  "deterministic_certainty_false_positive",
  "temporal_future_reassessment",
  "missing_or_absent_payment_implementation",
];
const acceptanceRequirements = acceptance.cases.map((item) => item.requirement);
record(
  "acceptance matrix 24 cases",
  acceptance.case_count === 24 &&
    acceptance.cases.length === 24 &&
    new Set(acceptance.cases.map((item) => item.case_id)).size === 24,
);
record(
  "mandatory acceptance coverage",
  mandatoryRequirements.every((requirement) =>
    acceptanceRequirements.includes(requirement),
  ) &&
    same(acceptance.mandatory_requirement_coverage, mandatoryRequirements),
);
record(
  "Product Owner review remains mandatory",
  acceptance.product_owner_gate.mandatory === true &&
    acceptance.product_owner_gate.machine_pass_substitutes_for_product_owner_review ===
      false &&
    acceptance.product_owner_gate.required_before_runtime_activation === true,
);
record(
  "acceptance execution boundary",
  acceptance.execution_boundary.offline_only === true &&
    acceptance.execution_boundary.provider_calls === 0 &&
    acceptance.execution_boundary.db_operations === 0 &&
    acceptance.execution_boundary.supabase_operations === 0 &&
    acceptance.execution_boundary.provider_rerun_authorized === false &&
    acceptance.execution_boundary.implementation_authorized === false,
);

const exactCapabilities = {
  status: "v12_implementation_decomposition_ready_pending_human_chatgpt_review",
  baseline,
  product_owner_charter_accepted: true,
  runtime_output_compatibility_audited: true,
  customer_projection_architecture_defined: true,
  payment_safety_sequence_audited: true,
  implementation_packages_defined: true,
  v12_implementation_authorized: false,
  provider_rerun_ready: false,
  provider_rerun_authorized: false,
  active_runtime_activated: false,
  r4_authorized: false,
  c2_authorized: false,
  main_changed: false,
  next_action: "human_chatgpt_review_of_v12_implementation_decomposition",
};
record(
  "capabilities exact state",
  Object.entries(exactCapabilities).every(
    ([key, value]) => capabilities[key] === value,
  ),
);
record(
  "capability operations all zero or false",
  Object.values(capabilities.operations).every(
    (value) => value === 0 || value === false,
  ),
);

const currentForm = readText("components/runtime/RuntimeAssessmentForm.tsx");
const currentNote = readText("components/runtime/RuntimeAssessmentNote.tsx");
const currentService = readText("lib/assessment/runtime/service.ts");
const currentRepository = readText(
  "lib/assessment/runtime/supabase-repository.ts",
);
record(
  "current unsafe type predicate evidence unchanged",
  currentForm.includes("result.eligibility === \"ready\"") &&
    currentForm.includes(
      "result is CompletedAssessment & { duplicate: boolean }",
    ) &&
    currentForm.includes("payload.data as AssessmentExecutionResult"),
);
record(
  "current split renderer incompatibility evidence unchanged",
  currentNote.includes("decisionPlan.three_day_plan.length") &&
    currentNote.includes("content.three_day_plan_commentary.length") &&
    currentNote.includes("content.message_temperature.softness") &&
    !currentNote.includes("recommended_message_draft") &&
    !currentNote.includes("aftercare_plan"),
);
record(
  "current active service remains v4 legacy",
  currentService.includes("loadM2P4ProductQualityRuntimeStageCatalog") &&
    compatibility.active_runtime_identity.catalog ===
      "runtime-stage-catalog-v4.0.0" &&
    git("hash-object", "lib/assessment/runtime/service.ts") ===
      priorSource.protected_authorities.active_service_blob,
);
record(
  "unchecked persisted report cast evidence unchanged",
  currentRepository.includes(
    "} as CompletedAssessment | SplitCompletedAssessment;",
  ),
);

const apiRoutes = git("ls-files", "app/api/**/route.ts")
  .split(/\r?\n/u)
  .filter(Boolean)
  .map((item) => item.replaceAll("\\", "/"));
const packageJson = readJson("package.json");
const dependencyNames = Object.keys({
  ...(packageJson.dependencies ?? {}),
  ...(packageJson.devDependencies ?? {}),
});
const purchaseFixture = readText("fixtures/review/purchase-confirmations.ts");
const purchaseView = readText(
  "components/review/ReviewPurchaseConfirmation.tsx",
);
record(
  "payment implementation exact state absent",
  source.repository_discovery.purchase_implementation_state === "absent" &&
    same(apiRoutes, ["app/api/internal/assessments/route.ts"]) &&
    !dependencyNames.some((name) =>
      /stripe|payment|checkout|paddle|paypal|adyen/iu.test(name),
    ) &&
    purchaseFixture.includes("transactionState: \"not_started\"") &&
    purchaseFixture.includes("provider: \"unselected\"") &&
    purchaseView.includes("disabled") &&
    purchaseView.includes("決済事業者と取引機能は接続されていません"),
);

const newMarker = "M2-P4-I3-R1-C1-R3-R2-E-R3-R3-R3-P1";
record(
  "rolling documentation synchronized",
  updatedPaths.every((relativePath) => {
    const block = markedBlock(readText(relativePath), newMarker);
    return (
      block !== null &&
      block.includes(
        "v12_implementation_decomposition_ready_pending_human_chatgpt_review",
      ) &&
      block.includes(
        "human_chatgpt_review_of_v12_implementation_decomposition",
      )
    );
  }),
);

const diffCheck = spawnSync(
  "git.exe",
  ["-c", "safe.directory=C:/projects/moon-reply", "diff", "--check"],
  {
    cwd: repositoryRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  },
);
record(
  "git diff --check PASS",
  diffCheck.status === 0 && diffCheck.stdout.trim() === "",
  diffCheck.stderr.trim(),
);

for (const result of results) {
  console.log((result.passed ? "PASS " : "FAIL ") + result.name);
  if (!result.passed && result.detail) console.log("  " + result.detail);
}

const failures = results.filter((result) => !result.passed);
if (failures.length > 0) {
  console.error(
    "v12 decomposition verifier: FAIL " +
      (results.length - failures.length) +
      "/" +
      results.length,
  );
  process.exit(1);
}

console.log(
  "v12 decomposition verifier: PASS " +
    results.length +
    "/" +
    results.length,
);
console.log("Exact planning scope: 11/11");
console.log("Authority manifest: 44/44");
console.log("Acceptance cases: 24/24");
console.log("Provider / DB / Supabase: 0 / 0 / 0");
