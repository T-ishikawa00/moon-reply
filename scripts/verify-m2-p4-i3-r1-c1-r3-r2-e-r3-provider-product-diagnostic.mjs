import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildProductOwnerReview,
  canonicalJson,
  evaluateDiagnostic,
  renderDiagnosticSummary,
  renderDocumentationStatusBlock,
  renderProductReview,
  renderReviewDocument,
  runEvaluatorSelfTests,
  shaDiagnosticJson,
} from "./lib/m2-p4-i3-r1-c1-r3-r2-e-r3-evaluator-v1.mjs";

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const artifactRoot =
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3";
const artifactPaths = {
  contract: `${artifactRoot}/diagnostic-contract-v1.json`,
  cases: `${artifactRoot}/diagnostic-cases-v1.json`,
  quality: `${artifactRoot}/quality-contract-v1.json`,
  authorization: `${artifactRoot}/authorization-v1.json`,
  results: `${artifactRoot}/diagnostic-results-v1.json`,
  summary: `${artifactRoot}/diagnostic-summary-v1.md`,
  productReview: `${artifactRoot}/product-review-v1.md`,
  productOwnerReview: `${artifactRoot}/product-owner-review-v1.json`,
  capabilities: `${artifactRoot}/capabilities-v1.json`,
  evaluator: "scripts/lib/m2-p4-i3-r1-c1-r3-r2-e-r3-evaluator-v1.mjs",
  runner:
    "scripts/run-m2-p4-i3-r1-c1-r3-r2-e-r3-provider-product-diagnostic.mjs",
  verifier:
    "scripts/verify-m2-p4-i3-r1-c1-r3-r2-e-r3-provider-product-diagnostic.mjs",
  review:
    "docs/phase2/TASK_M2_P4_I3_R1_C1_R3_R2_E_R3_REVIEW.md",
};
const baseline = "84ce1bce84f834c53bc46b5bb636ce77322da383";
const implementationBaseline = "6b001a76c80747f60c69624d9d148465d2e1a963";
const acceptedImplementation = "a66c82ac74775f5fcab3b8fce6ffb09f6dbd590f";
const mainBaseline = "61e33a10e195fad17e253a6b9719217e1992f273";
const frozenEvidenceCommit = "c10169c92364a31f6c512e714ac18bffafc9ec08";
const acceptedProductDirection = "32bb29f16e962918fefa313f3e04c440d9d948d9";
const acceptedA = "2a5c8ed6ea02a4173c50a4d1e31ad54a857d707f";
const acceptedB = "ef5c6db66da77deebb9ad0d5498fe69ec584aad8";
const acceptedC = "7e09b540220eac3b0afb91bc9cfb822cc0ab632d";
const acceptedD = "8b9b4a4dff2992483266a3fb9bbc80b183091b2e";
const expectedBranch =
  "test/m2-p4-i3-r1-c1-r3-r2-e-r3-provider-product-diagnostic";

const eR2ExactPaths = [
  "lib/assessment/runtime/pipeline.ts",
  "lib/assessment/runtime/schema-catalog.ts",
  "lib/assessment/runtime/base-structured-intake-grounding-v2.ts",
  "lib/assessment/runtime/semantic-disposition-v4.ts",
  "lib/assessment/runtime/contracts/runtime-stage-catalog-v10.json",
  "lib/assessment/runtime/contracts/pb-01-base-situation-v2.developer.md",
  "lib/assessment/runtime/contracts/pb-01c-candidate-analysis-v2.developer.md",
  "lib/assessment/runtime/contracts/pb-04-directional-decision-v2.developer.md",
  "lib/assessment/runtime/contracts/pb-05-directional-report-v2.developer.md",
  "lib/assessment/runtime/contracts/pb-06-materiality-validator-v2.developer.md",
  "supabase/migrations/0005_m2_p4_directional_guidance_runtime.sql",
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r2/semantic-materiality-contract-v1.json",
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r2/revision-fixtures-v1.json",
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r2/offline-results-v1.json",
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r2/capabilities-v1.json",
  "scripts/lib/m2-p4-i3-r1-c1-r3-r2-e-r2-offline-runner-v1.mjs",
  "scripts/verify-m2-p4-i3-r1-c1-r3-r2-e-r2-directional-guidance.mjs",
  "docs/phase2/TASK_M2_P4_I3_R1_C1_R3_R2_E_R2_REVIEW.md",
  "docs/CURRENT_FOCUS.md",
  "docs/WBS.md",
  "docs/CODEX_HANDOFF.md",
];
const eR2NonSyncPaths = [
  "lib/assessment/runtime/pipeline.ts",
  "lib/assessment/runtime/schema-catalog.ts",
  "lib/assessment/runtime/base-structured-intake-grounding-v2.ts",
  "lib/assessment/runtime/semantic-disposition-v4.ts",
  "lib/assessment/runtime/contracts/runtime-stage-catalog-v10.json",
  "lib/assessment/runtime/contracts/pb-01-base-situation-v2.developer.md",
  "lib/assessment/runtime/contracts/pb-01c-candidate-analysis-v2.developer.md",
  "lib/assessment/runtime/contracts/pb-04-directional-decision-v2.developer.md",
  "lib/assessment/runtime/contracts/pb-05-directional-report-v2.developer.md",
  "lib/assessment/runtime/contracts/pb-06-materiality-validator-v2.developer.md",
  "supabase/migrations/0005_m2_p4_directional_guidance_runtime.sql",
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r2/semantic-materiality-contract-v1.json",
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r2/revision-fixtures-v1.json",
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r2/offline-results-v1.json",
  "scripts/lib/m2-p4-i3-r1-c1-r3-r2-e-r2-offline-runner-v1.mjs",
];
const frozenEPaths = [
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e/diagnostic-contract-v1.json",
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e/diagnostic-cases-v1.json",
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e/quality-contract-v1.json",
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e/authorization-v1.json",
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e/diagnostic-results-v1.json",
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e/diagnostic-summary-v1.md",
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e/capabilities-v1.json",
  "scripts/lib/m2-p4-i3-r1-c1-r3-r2-e-provider-evaluator-v1.mjs",
  "scripts/run-m2-p4-i3-r1-c1-r3-r2-e-provider-diagnostic.mjs",
  "scripts/verify-m2-p4-i3-r1-c1-r3-r2-e-provider-diagnostic.mjs",
  "docs/phase2/TASK_M2_P4_I3_R1_C1_R3_R2_E_REVIEW.md",
];
const productDirectionNonSync = [
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r1/postmortem-v1.json",
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r1/adjudication-contract-v1.json",
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r1/adjudication-results-v1.json",
  "scripts/lib/m2-p4-i3-r1-c1-r3-r2-e-r1-adjudicator-v1.mjs",
];
const acceptedAPaths = [
  "lib/assessment/runtime/contracts/base-structured-intake-v1.schema.json",
  "lib/assessment/runtime/contracts/candidate-analysis-v1.schema.json",
  "lib/assessment/runtime/contracts/split-stage-contracts-v1.ts",
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-a/stage-topology-v1.json",
];
const acceptedBPaths = [
  "lib/assessment/runtime/base-structured-intake-grounding-v1.ts",
  "lib/assessment/runtime/candidate-analysis-grounding-v1.ts",
  "lib/assessment/runtime/base-structured-intake-legacy-view-v1.ts",
  "lib/assessment/runtime/split-analysis-envelope-v1.ts",
  "lib/assessment/runtime/base-source-integrity-v1.ts",
  "lib/assessment/runtime/candidate-source-integrity-v1.ts",
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-b/source-integrity-fixtures-v1.json",
];
const acceptedCProtected = [
  "lib/assessment/runtime/types.ts",
  "lib/assessment/runtime/fakes.ts",
  "lib/assessment/runtime/supabase-repository.ts",
  "lib/assessment/runtime/safety-aggregation-v3.ts",
  "lib/assessment/runtime/candidate-safety-routing-v1.ts",
  "lib/assessment/runtime/contracts/runtime-stage-catalog-v9.json",
  "lib/assessment/runtime/contracts/pb-01-base-situation-v1.developer.md",
  "lib/assessment/runtime/contracts/pb-01c-candidate-analysis-v1.developer.md",
  "lib/assessment/runtime/contracts/pb-02-split-safety-v1.developer.md",
  "lib/assessment/runtime/contracts/pb-03-split-projection-v1.developer.md",
  "lib/assessment/runtime/contracts/pb-04-split-decision-v1.developer.md",
  "lib/assessment/runtime/contracts/pb-05-split-report-v1.developer.md",
  "lib/assessment/runtime/contracts/pb-06-split-validator-v1.developer.md",
  "supabase/migrations/0004_m2_p4_candidate_source_isolation.sql",
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-c/routing-fixtures-v1.json",
];
const acceptedDPaths = [
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-d/counterfactual-cases-v1.json",
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-d/counterfactual-results-v1.json",
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-d/historical-regression-manifest-v1.json",
  "scripts/lib/m2-p4-i3-r1-c1-r3-r2-d-offline-runner-v1.mjs",
];

const git = (...args) =>
  execFileSync(
    "git.exe",
    ["-c", "safe.directory=C:/projects/moon-reply", ...args],
    { cwd: repositoryRoot, encoding: "utf8" },
  ).trim();
const readText = (relativePath) =>
  readFileSync(path.join(repositoryRoot, relativePath), "utf8");
const readJson = (relativePath) => JSON.parse(readText(relativePath));
const sha256 = (value) =>
  createHash("sha256").update(Buffer.from(value, "utf8")).digest("hex");
const fileSha256 = (relativePath) =>
  sha256(readText(relativePath).replace(/\r\n/gu, "\n"));
const lines = (value) => value.split(/\r?\n/u).filter(Boolean);
const sorted = (value) =>
  [...new Set(value)].sort((left, right) => left.localeCompare(right, "en"));
const same = (left, right) => canonicalJson(left) === canonicalJson(right);
const blobMatches = (ref, relativePath) =>
  git("rev-parse", `${ref}:${relativePath}`) === git("hash-object", relativePath);

const checks = [];
function check(label, condition) {
  checks.push({ label, passed: Boolean(condition) });
  assert.equal(Boolean(condition), true, label);
}

function currentScope(baseRef) {
  return sorted([
    ...lines(git("diff", "--name-only", baseRef, "--")),
    ...lines(git("ls-files", "--others", "--exclude-standard")),
  ]);
}

function changedSincePackage(packageCommit) {
  return sorted([
    ...lines(git("diff", "--name-only", packageCommit, "HEAD", "--")),
    ...lines(git("diff", "--name-only", "--")),
    ...lines(git("ls-files", "--others", "--exclude-standard")),
  ]);
}

function allNullProductOwnerRatings(review) {
  const fields = [
    "understood_user",
    "direction_helpful",
    "immediate_step_actionable",
    "draft_sendable",
    "personality_preserved",
    "report_value",
    "overall",
    "product_owner_comment",
  ];
  return (
    review.cases.length === 6 &&
    review.cases.every((item) => fields.every((field) => item[field] === null)) &&
    review.cases
      .filter((item) => item.case_id === "E-R3-03")
      .every(
        (item) =>
          item.boundary_respected === null && item.workaround_absent === null,
      )
  );
}

const contract = readJson(artifactPaths.contract);
const caseBundle = readJson(artifactPaths.cases);
const qualityContract = readJson(artifactPaths.quality);
const authorization = readJson(artifactPaths.authorization);
const results = readJson(artifactPaths.results);
const capabilities = readJson(artifactPaths.capabilities);
const ownerReview = readJson(artifactPaths.productOwnerReview);
const catalog = readJson(contract.catalog_path);
const runnerSource = readText(artifactPaths.runner);
const evaluatorSource = readText(artifactPaths.evaluator);
const markerPath = path.join(repositoryRoot, contract.one_time_marker);
const evidencePhase = results.status !== "not_started";

check("branch exact", git("branch", "--show-current") === expectedBranch);
check("baseline in history", git("merge-base", "--is-ancestor", baseline, "HEAD") === "");
check("main unchanged", git("rev-parse", "main") === mainBaseline);
check("origin/main unchanged", git("rev-parse", "origin/main") === mainBaseline);
check("stash empty", git("stash", "list") === "");
check("contract baseline exact", contract.baseline === baseline);
check("exact scope 16/16", same(currentScope(baseline), sorted(contract.exact_mutation_paths)));
check("exact scope duplicate paths 0", new Set(contract.exact_mutation_paths).size === 16);
check("post-run scope duplicate paths 0", new Set(contract.post_run_mutable_paths).size === 10);
check("frozen scope duplicate paths 0", new Set(contract.frozen_after_commit_a_paths).size === 6);
check(
  "scope relationship exact",
  contract.exact_mutation_paths.length === 16 &&
    contract.post_run_mutable_paths.every((item) =>
      contract.exact_mutation_paths.includes(item),
    ) &&
    contract.frozen_after_commit_a_paths.every((item) =>
      contract.exact_mutation_paths.includes(item),
    ),
);

check(
  "authorization contract exact",
  contract.authorization_id ===
    "M2-P4-I3-R1-C1-R3-R2-E-R3-2026-08-04" &&
    contract.confirmation_phrase ===
      "E-R3-40-MAX-37-EXPECTED-DIRECTIONAL-SYNTHETIC-ONLY" &&
    contract.expected_calls === 37 &&
    contract.authorized_max_calls === 40 &&
    contract.approved_cases === 6 &&
    contract.model === "gpt-5.6-luna" &&
    contract.rerun_authorized === false &&
    contract.r4_authorized === false &&
    contract.c2_authorized === false,
);
check(
  "execution limits exact",
  Object.values(contract.execution_limits).every(
    (value) => value === 0 || value === false,
  ),
);
check(
  "expected call allocation 37",
  Object.values(contract.expected_calls_by_case).reduce(
    (total, value) => total + value,
    0,
  ) === 37,
);
check(
  "expected Stage paths exact",
  same(contract.expected_stage_paths["E-R3-03"], [
    "PB-01",
    "PB-01C",
    "PB-02",
    "PB-03",
  ]) &&
    Object.entries(contract.expected_stage_paths).every(
      ([caseId, stagePath]) =>
        stagePath.length === contract.expected_calls_by_case[caseId],
    ),
);

check("case JSON 6/6", caseBundle.length === 6);
check(
  "case IDs exact",
  same(
    caseBundle.map((item) => item.case_id),
    ["E-R3-01", "E-R3-02", "E-R3-03", "E-R3-04", "E-R3-05", "E-R3-06"],
  ),
);
check(
  "case inputs exact keys",
  caseBundle.every(
    (item) =>
      same(Object.keys(item.synthetic_input).sort(), [
        "current_situation",
        "optional_message",
        "relationship",
        "requested_topics",
      ]) &&
      typeof item.fixed_clock === "string" &&
      typeof item.fixed_id_prefix === "string",
  ),
);
check(
  "case-specific source literals fixed",
  caseBundle[0].synthetic_input.optional_message.includes("お願いいたしましす") &&
    caseBundle[1].synthetic_input.current_situation.includes("昨日の21時") &&
    caseBundle[2].synthetic_input.current_situation.includes("もう連絡しないでください") &&
    caseBundle[3].synthetic_input.optional_message === null &&
    caseBundle[4].synthetic_input.current_situation.includes("一人で考えたい") &&
    caseBundle[5].synthetic_input.optional_message.includes("いけるで"),
);

check(
  "Quality Contract identity",
  qualityContract.evaluator_version ===
    "m2-p4-i3-r1-c1-r3-r2-e-r3-evaluator-v1" &&
    qualityContract.cases.length === 6,
);
const assertions = qualityContract.cases.flatMap((item) => item.assertions);
check("assertion IDs unique", new Set(assertions.map((item) => item.assertion_id)).size === assertions.length);
check(
  "assertions fully bounded",
  assertions.every(
    (item) =>
      typeof item.assertion_id === "string" &&
      typeof item.case_id === "string" &&
      ["hard", "conditional", "flexible", "product_outcome"].includes(item.tier) &&
      ["blocking", "conditional", "nonblocking"].includes(item.materiality) &&
      ["evidence", "draft_text", "final_text"].includes(item.surface) &&
      qualityContract.allowed_operators.includes(item.operator) &&
      (typeof item.json_path === "string" ||
        (item.bounded_evaluator_target &&
          typeof item.bounded_evaluator_target.type === "string")) &&
      (Object.hasOwn(item, "expected") !== Object.hasOwn(item, "allowed_set")) &&
      typeof item.rationale === "string" &&
      item.rationale.length > 0,
  ),
);
check(
  "three-tier coverage",
  ["hard", "conditional", "flexible", "product_outcome"].every((tier) =>
    assertions.some((item) => item.tier === tier),
  ),
);
check(
  "Product Outcome coverage exact",
  qualityContract.cases.every(
    (item) =>
      item.assertions.filter((assertion) => assertion.tier === "product_outcome")
        .length === 1,
  ),
);
const selfTests = runEvaluatorSelfTests();
check("evaluator self-tests 20/20", selfTests.passed === 20 && selfTests.total === 20);

check(
  "Catalog v10 exact identity",
  catalog.catalog_version === "runtime-stage-catalog-v10.0.0" &&
    catalog.prompt_bundle_version === "prompt-bundle-runtime-v10.0.0" &&
    catalog.schema_set_version === "pipeline-schema-runtime-v4.0.0" &&
    catalog.stage_topology_version === "split-base-candidate-v1" &&
    fileSha256(contract.catalog_path) === contract.catalog_sha256_utf8_lf,
);
check(
  "Stage order 7/7",
  same(
    catalog.stages.map((stage) => stage.stage_id),
    ["PB-01", "PB-01C", "PB-02", "PB-03", "PB-04", "PB-05", "PB-06"],
  ),
);
check(
  "Prompt hashes exact",
  catalog.stages.every(
    (stage) => fileSha256(stage.prompt_path) === stage.prompt_sha256,
  ),
);
check(
  "Schema hashes exact",
  catalog.stages.every(
    (stage) =>
      fileSha256(stage.schema_path) === stage.schema_sha256 &&
      (!stage.grounded_schema_path ||
        fileSha256(stage.grounded_schema_path) ===
          stage.grounded_schema_sha256),
  ),
);

check(
  "E-R2 historical implementation exact 21/21",
  same(
    sorted(
      lines(
        git(
          "diff",
          "--name-only",
          implementationBaseline,
          acceptedImplementation,
          "--",
        ),
      ),
    ),
    sorted(eR2ExactPaths),
  ),
);
check(
  "E-R2 non-sync blobs 15/15 unchanged",
  eR2NonSyncPaths.length === 15 &&
    eR2NonSyncPaths.every((item) => blobMatches(acceptedImplementation, item)),
);
check(
  "frozen E assets 11/11 unchanged",
  frozenEPaths.length === 11 &&
    frozenEPaths.every((item) => blobMatches(frozenEvidenceCommit, item)),
);
check(
  "Product Direction blobs 4/4 unchanged",
  productDirectionNonSync.every((item) =>
    blobMatches(acceptedProductDirection, item),
  ),
);
check(
  "accepted A B C D protected blobs unchanged",
  acceptedAPaths.every((item) => blobMatches(acceptedA, item)) &&
    acceptedBPaths.every((item) => blobMatches(acceptedB, item)) &&
    acceptedCProtected.every((item) => blobMatches(acceptedC, item)) &&
    acceptedDPaths.every((item) => blobMatches(acceptedD, item)),
);
check(
  "Grounding v2 Semantic v4 Pipeline protected",
  [
    "lib/assessment/runtime/base-structured-intake-grounding-v2.ts",
    "lib/assessment/runtime/semantic-disposition-v4.ts",
    "lib/assessment/runtime/pipeline.ts",
    "lib/assessment/runtime/schema-catalog.ts",
  ].every((item) => blobMatches(acceptedImplementation, item)),
);
check(
  "Application Safety Policy Repository protected",
  [
    "lib/assessment/runtime/application.ts",
    "lib/assessment/runtime/policy.ts",
    "lib/assessment/runtime/policy-v2.ts",
    "lib/assessment/runtime/policy-v3.ts",
    "lib/assessment/runtime/fakes.ts",
    "lib/assessment/runtime/supabase-repository.ts",
    "lib/assessment/runtime/candidate-safety-routing-v1.ts",
    "lib/assessment/runtime/safety-aggregation-v3.ts",
  ].every((item) => blobMatches(implementationBaseline, item)),
);
check(
  "migration 0005 unchanged",
  blobMatches(
    acceptedImplementation,
    "supabase/migrations/0005_m2_p4_directional_guidance_runtime.sql",
  ) &&
    fileSha256(
      "supabase/migrations/0005_m2_p4_directional_guidance_runtime.sql",
    ) === contract.migration_0005_sha256_utf8_lf,
);
check(
  "Active Service unchanged",
  fileSha256("lib/assessment/runtime/service.ts") ===
    contract.active_service_sha256_utf8_lf &&
    readText("lib/assessment/runtime/service.ts").includes(
      "loadM2P4ProductQualityRuntimeStageCatalog",
    ) &&
    !readText("lib/assessment/runtime/service.ts").includes(
      "loadM2P4DirectionalGuidanceRuntimeStageCatalog",
    ),
);

check(
  "runner exact Runtime design",
  runnerSource.includes("loadM2P4DirectionalGuidanceRuntimeStageCatalog") &&
    runnerSource.includes("AssessmentApplication") &&
    runnerSource.includes("FakeAssessmentRepository") &&
    runnerSource.includes("OpenAiResponsesTransport") &&
    runnerSource.includes("client.maxRetries = 0") &&
    runnerSource.includes('open(markerPath, "wx"') &&
    runnerSource.includes("for (const diagnosticCase of cases)") &&
    !runnerSource.includes("SupabaseAssessmentRepository"),
);
check(
  "runner immutable evidence fields",
  [
    "provider_request",
    "request_sha256",
    "raw_output",
    "raw_output_sha256",
    "raw_output_sha256_after_processing",
    "provider_output_mutated",
    "local_schema_result",
    "fake_stage_persistence_evidence",
  ].every((literal) => runnerSource.includes(literal)),
);
check(
  "evaluator has no Provider or environment authority",
  !evaluatorSource.includes("OpenAiResponsesTransport") &&
    !evaluatorSource.includes("OPENAI_API_KEY") &&
    !evaluatorSource.includes("SupabaseAssessmentRepository") &&
    !evaluatorSource.includes("process.env") &&
    !evaluatorSource.includes("fetch("),
);

check(
  "JSON parse 7/7 mutable/contract artifacts",
  [
    artifactPaths.contract,
    artifactPaths.cases,
    artifactPaths.quality,
    artifactPaths.authorization,
    artifactPaths.results,
    artifactPaths.productOwnerReview,
    artifactPaths.capabilities,
  ].every((item) => readJson(item) !== null),
);
check(
  "documentation markers 4/4",
  [
    artifactPaths.review,
    "docs/CURRENT_FOCUS.md",
    "docs/WBS.md",
    "docs/CODEX_HANDOFF.md",
  ].every(
    (item) =>
      readText(item).includes(
        "<!-- M2-P4-I3-R1-C1-R3-R2-E-R3:BEGIN -->",
      ) &&
      readText(item).includes(
        "<!-- M2-P4-I3-R1-C1-R3-R2-E-R3:END -->",
      ),
  ),
);

if (!evidencePhase) {
  check("one-time marker absent", !existsSync(markerPath));
  check(
    "authorization unconsumed exact",
    authorization.consumed === false &&
      authorization.rerun_authorized === false &&
      authorization.package_commit === null &&
      authorization.actual_calls === 0 &&
      authorization.completed_calls === 0,
  );
  check(
    "initial results exact",
    results.status === "not_started" &&
      results.calls_actual === 0 &&
      results.calls_completed === 0 &&
      results.cases.length === 0 &&
      results.evaluation.verdict === "NOT_EXECUTED",
  );
  check(
    "Product Owner review pending and null",
    ownerReview.status === "pending_product_owner_review" &&
      ownerReview.product_owner_review_complete === false &&
      allNullProductOwnerRatings(ownerReview),
  );
  check(
    "initial capabilities bounded",
    capabilities.status === "not_started" &&
      capabilities.provider_quality_established === false &&
      capabilities.r4_authorized === false &&
      capabilities.active_runtime_activated === false,
  );
} else {
  check("one-time marker present", existsSync(markerPath));
  check(
    "authorization consumed exact",
    authorization.consumed === true &&
      authorization.rerun_authorized === false &&
      authorization.package_commit === results.package_commit &&
      authorization.actual_calls === results.calls_actual &&
      authorization.completed_calls === results.calls_completed,
  );
  check(
    "Commit A exact",
    /^[0-9a-f]{40}$/u.test(results.package_commit) &&
      git("show", "-s", "--format=%s", results.package_commit) ===
        contract.package_commit_subject &&
      git("rev-parse", `${results.package_commit}^`) === baseline,
  );
  check(
    "post-run mutable scope exact 10/10",
    same(
      changedSincePackage(results.package_commit),
      sorted(contract.post_run_mutable_paths),
    ),
  );
  check(
    "frozen Commit A paths 6/6 unchanged",
    contract.frozen_after_commit_a_paths.every((item) =>
      blobMatches(results.package_commit, item),
    ),
  );
  const calls = results.cases.flatMap((item) => item.provider_calls);
  check(
    "Provider attempts bounded",
    calls.length === results.calls_actual &&
      results.calls_actual <= 40 &&
      results.calls_completed <= results.calls_actual,
  );
  check(
    "call evidence complete",
    calls.every(
      (call) =>
        call.provider_attempted === true &&
        typeof call.request_sha256 === "string" &&
        call.request_sha256 === shaDiagnosticJson(call.provider_request) &&
        typeof call.provider_input_isolation.passed === "boolean" &&
        Number.isInteger(call.expected_data_injection_count) &&
        Number.isInteger(call.secret_leakage_count) &&
        (!call.provider_completed ||
          (typeof call.response_id === "string" &&
            typeof call.returned_model_exact === "boolean" &&
            typeof call.raw_output_sha256 === "string" &&
            typeof call.raw_output_sha256_after_processing === "string" &&
            call.provider_output_mutated ===
              (call.raw_output_sha256 !==
                call.raw_output_sha256_after_processing))),
    ),
  );
  check(
    "Fake persistence and Supabase zero",
    results.cases.every(
      (item) =>
        item.fake_stage_persistence_evidence &&
        item.fake_stage_persistence_evidence.actual_supabase_calls === 0,
    ) && results.supabase_operations === 0,
  );
  check(
    "absent Candidate skipped rows retained",
    ["E-R3-02", "E-R3-04"]
      .map((caseId) => results.cases.find((item) => item.case_id === caseId))
      .filter(Boolean)
      .every((item) =>
        item.fake_stage_persistence_evidence?.stage_runs?.some(
          (stage) => stage.stageId === "PB-01C" && stage.status === "skipped",
        ),
      ),
  );
  if (results.status !== contract.evaluation_blocked_status) {
    const replay = structuredClone(results);
    const recomputed = evaluateDiagnostic(contract, qualityContract, replay);
    check("frozen evaluator replay exact", same(recomputed, results.evaluation));
    check(
      "case evaluations replay exact",
      replay.cases.every((item, index) =>
        same(item.evaluation, results.cases[index].evaluation),
      ),
    );
  } else {
    check(
      "evaluation-blocked semantics exact",
      results.evaluation.verdict === "EVALUATION_BLOCKED" &&
        results.provider_machine_gates_passed === false,
    );
  }
  check(
    "status semantics exact",
    results.provider_quality_established === false &&
      results.product_owner_review_complete === false &&
      results.candidate_ready_for_isolated_e2e === false &&
      results.r4_ready === false &&
      results.r4_authorized === false &&
      results.c2_authorized === false,
  );
  const ownerReplay = buildProductOwnerReview({
    ...results,
    cases: caseBundle.map(
      (diagnosticCase) =>
        results.cases.find((item) => item.case_id === diagnosticCase.case_id) ?? {
          case_id: diagnosticCase.case_id,
        },
    ),
  });
  check(
    "Product Owner review pending exact",
    same(ownerReplay, ownerReview) &&
      ownerReview.status === "pending_product_owner_review" &&
      allNullProductOwnerRatings(ownerReview),
  );
  check(
    "rendered evidence artifacts deterministic",
    readText(artifactPaths.summary) === renderDiagnosticSummary(results) &&
      readText(artifactPaths.productReview) === renderProductReview(results) &&
      readText(artifactPaths.review) === renderReviewDocument(results),
  );
  const statusBlock = renderDocumentationStatusBlock(results);
  check(
    "documentation status synchronized 3/3",
    ["docs/CURRENT_FOCUS.md", "docs/WBS.md", "docs/CODEX_HANDOFF.md"].every(
      (item) => readText(item).includes(statusBlock),
    ),
  );
  check(
    "capabilities remain bounded",
    capabilities.status === results.status &&
      capabilities.provider_quality_established === false &&
      capabilities.product_owner_review_complete === false &&
      capabilities.candidate_ready_for_isolated_e2e === false &&
      capabilities.r4_ready === false &&
      capabilities.r4_authorized === false &&
      capabilities.c2_authorized === false &&
      capabilities.migration_applied === false &&
      capabilities.active_service_changed === false &&
      capabilities.main_changed === false,
  );
}

check(
  "no whitespace or conflict errors",
  git("diff", "--check", baseline, "--") === "" &&
    contract.exact_mutation_paths.every((item) => {
      const text = readText(item);
      return (
        !text.split(/\r?\n/u).some((line) => /[ \t]+$/u.test(line)) &&
        !/^<{7}(?: |$)/mu.test(text) &&
        !/^>{7}(?: |$)/mu.test(text)
      );
    }),
);

process.stdout.write(
  [
    "M2-P4-I3-R1-C1-R3-R2-E-R3 PROVIDER_PRODUCT_DIAGNOSTIC_VERIFIER: PASS",
    `phase: ${evidencePhase ? "evidence" : "package"}`,
    `checks: ${checks.filter((item) => item.passed).length}/${checks.length}`,
    "exact_scope: 16/16",
    `post_run_mutable_scope: ${evidencePhase ? "10/10" : "not_applicable"}`,
    "frozen_package: 6/6",
    "accepted_E-R2: historical 21/21; non-sync blobs 15/15 unchanged",
    `evaluator_self_tests: ${selfTests.passed}/${selfTests.total}`,
    `calls expected / maximum / actual: 37 / 40 / ${results.calls_actual}`,
    `machine_verdict: ${results.evaluation.verdict}`,
    "Product Owner review: pending",
    "Provider quality established: false",
    "migration / Active Service / main: unchanged",
    "",
  ].join("\n"),
);
