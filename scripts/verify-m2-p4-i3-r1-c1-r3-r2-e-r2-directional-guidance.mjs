import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  canonicalJson,
  runDirectionalGuidanceOffline,
} from "./lib/m2-p4-i3-r1-c1-r3-r2-e-r2-offline-runner-v1.mjs";

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const taskId = "M2-P4-I3-R1-C1-R3-R2-E-R2";
const baseline = "6b001a76c80747f60c69624d9d148465d2e1a963";
const acceptedImplementationCommit =
  "a66c82ac74775f5fcab3b8fce6ffb09f6dbd590f";
const expectedBranch =
  "feat/m2-p4-i3-r1-c1-r3-r2-e-r2-directional-guidance";
const mainBaseline = "61e33a10e195fad17e253a6b9719217e1992f273";
const acceptedProductDirection =
  "32bb29f16e962918fefa313f3e04c440d9d948d9";
const frozenEvidenceCommit =
  "c10169c92364a31f6c512e714ac18bffafc9ec08";
const acceptedA = "2a5c8ed6ea02a4173c50a4d1e31ad54a857d707f";
const acceptedB = "ef5c6db66da77deebb9ad0d5498fe69ec584aad8";
const acceptedC = "7e09b540220eac3b0afb91bc9cfb822cc0ab632d";
const acceptedD = "8b9b4a4dff2992483266a3fb9bbc80b183091b2e";

const exactScope = [
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
const acceptanceSyncScope = [
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r2/capabilities-v1.json",
  "scripts/verify-m2-p4-i3-r1-c1-r3-r2-e-r2-directional-guidance.mjs",
  "docs/phase2/TASK_M2_P4_I3_R1_C1_R3_R2_E_R2_REVIEW.md",
  "docs/CURRENT_FOCUS.md",
  "docs/WBS.md",
  "docs/CODEX_HANDOFF.md",
];
const nonSyncImplementationPaths = [
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
const jsonPaths = [
  "lib/assessment/runtime/contracts/runtime-stage-catalog-v10.json",
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r2/semantic-materiality-contract-v1.json",
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r2/revision-fixtures-v1.json",
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r2/offline-results-v1.json",
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r2/capabilities-v1.json",
];
const frozenPaths = [
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
const productDirectionNonSyncPaths = [
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
const acceptedCNonSyncPaths = [
  "lib/assessment/runtime/types.ts",
  "lib/assessment/runtime/pipeline.ts",
  "lib/assessment/runtime/fakes.ts",
  "lib/assessment/runtime/schema-catalog.ts",
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
const schemaPaths = [
  "lib/assessment/runtime/contracts/base-structured-intake-v1.schema.json",
  "lib/assessment/runtime/contracts/candidate-analysis-v1.schema.json",
  "lib/assessment/runtime/contracts/decision-plan-v2.schema.json",
  "lib/assessment/runtime/contracts/report-content-v2.schema.json",
  "ai/schemas/validation-result.schema.json",
];

const checks = [];
function check(label, condition) {
  checks.push({ label, passed: Boolean(condition) });
  assert.equal(Boolean(condition), true, label);
}

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
const sorted = (values) => [...values].sort((left, right) => left.localeCompare(right, "en"));
const same = (left, right) => canonicalJson(left) === canonicalJson(right);
const blobMatches = (ref, relativePath) =>
  git("rev-parse", `${ref}:${relativePath}`) === git("hash-object", relativePath);

function currentTaskPaths() {
  const tracked = git("diff", "--name-only", baseline, "--")
    .split(/\r?\n/u)
    .filter(Boolean);
  const untracked = git("ls-files", "--others", "--exclude-standard")
    .split(/\r?\n/u)
    .filter(Boolean);
  return sorted(new Set([...tracked, ...untracked]));
}

function currentAcceptanceSyncPaths() {
  const tracked = git("diff", "--name-only", acceptedImplementationCommit, "--")
    .split(/\r?\n/u)
    .filter(Boolean);
  const untracked = git("ls-files", "--others", "--exclude-standard")
    .split(/\r?\n/u)
    .filter(Boolean);
  return sorted(new Set([...tracked, ...untracked]));
}

function noWhitespaceErrors() {
  const trackedCheck = git("diff", "--check", baseline, "--") === "";
  const contentCheck = exactScope.every((relativePath) => {
    const text = readText(relativePath);
    return (
      !text.split(/\r?\n/u).some((line) => /[ \t]+$/u.test(line)) &&
      !/^<{7}(?: |$)/mu.test(text) &&
      !/^>{7}(?: |$)/mu.test(text)
    );
  });
  return trackedCheck && contentCheck;
}

check("branch exact", git("branch", "--show-current") === expectedBranch);
check("baseline in history", git("merge-base", "--is-ancestor", baseline, "HEAD") === "");
check(
  "Product Direction commit in history",
  git("merge-base", "--is-ancestor", acceptedProductDirection, "HEAD") === "",
);
check("main unchanged", git("rev-parse", "main") === mainBaseline);
check("origin/main unchanged", git("rev-parse", "origin/main") === mainBaseline);
check("stash empty", git("stash", "list") === "");
check("exact scope duplicate paths 0", new Set(exactScope).size === exactScope.length);
check("exact scope 21/21", same(currentTaskPaths(), sorted(exactScope)));
const historicalImplementationPaths = git(
  "diff",
  "--name-only",
  baseline,
  acceptedImplementationCommit,
  "--",
)
  .split(/\r?\n/u)
  .filter(Boolean);
check(
  "immutable implementation snapshot exact 21/21",
  same(sorted(historicalImplementationPaths), sorted(exactScope)),
);
check(
  "acceptance sync exact scope 6/6",
  same(currentAcceptanceSyncPaths(), sorted(acceptanceSyncScope)) &&
    new Set(acceptanceSyncScope).size === acceptanceSyncScope.length,
);
check(
  "accepted implementation commit exact and in history",
  git("merge-base", "--is-ancestor", acceptedImplementationCommit, "HEAD") === "",
);

const parsed = Object.fromEntries(jsonPaths.map((item) => [item, readJson(item)]));
const catalogV10 = parsed[jsonPaths[0]];
const materiality = parsed[jsonPaths[1]];
const committedResult = parsed[jsonPaths[3]];
const capabilities = parsed[jsonPaths[4]];
const catalogV9 = readJson(
  "lib/assessment/runtime/contracts/runtime-stage-catalog-v9.json",
);
const productDirectionCapabilities = readJson(
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r1/capabilities-v1.json",
);

check("JSON parse 5/5", Object.keys(parsed).length === 5);
check(
  "non-sync implementation blobs 15/15 unchanged",
  nonSyncImplementationPaths.length === 15 &&
    nonSyncImplementationPaths.every((item) =>
      blobMatches(acceptedImplementationCommit, item),
    ),
);
check(
  "migration 0005 unchanged from accepted implementation",
  blobMatches(
    acceptedImplementationCommit,
    "supabase/migrations/0005_m2_p4_directional_guidance_runtime.sql",
  ),
);
check(
  "Product Direction acceptance preserved",
  productDirectionCapabilities.status === "human_chatgpt_accepted_complete" &&
    productDirectionCapabilities.product_owner_decisions === "4/4",
);
check(
  "Product Owner decisions 4/4 preserved",
  materiality.product_owner_decisions.length === 4 &&
    materiality.product_owner_decisions.every(({ status }) => status === "approved"),
);
check(
  "frozen E assets 11/11 unchanged",
  frozenPaths.length === 11 &&
    frozenPaths.every((item) => blobMatches(frozenEvidenceCommit, item)),
);
check(
  "accepted Product Direction non-sync 4/4 unchanged",
  productDirectionNonSyncPaths.length === 4 &&
    productDirectionNonSyncPaths.every((item) =>
      blobMatches(acceptedProductDirection, item),
    ),
);
check(
  "accepted A 4/4 unchanged",
  acceptedAPaths.length === 4 && acceptedAPaths.every((item) => blobMatches(acceptedA, item)),
);
check(
  "accepted B 7/7 unchanged",
  acceptedBPaths.length === 7 && acceptedBPaths.every((item) => blobMatches(acceptedB, item)),
);
const protectedCPaths = acceptedCNonSyncPaths.filter(
  (item) =>
    item !== "lib/assessment/runtime/pipeline.ts" &&
    item !== "lib/assessment/runtime/schema-catalog.ts",
);
check(
  "accepted C protected non-sync 15/15 unchanged",
  protectedCPaths.length === 15 &&
    protectedCPaths.every((item) => blobMatches(acceptedC, item)),
);
check(
  "accepted C successor exceptions exact 2/2",
  [
    "lib/assessment/runtime/pipeline.ts",
    "lib/assessment/runtime/schema-catalog.ts",
  ].every((item) => currentTaskPaths().includes(item)),
);
check(
  "accepted D non-sync 4/4 unchanged",
  acceptedDPaths.length === 4 && acceptedDPaths.every((item) => blobMatches(acceptedD, item)),
);
check(
  "v9 Catalog unchanged",
  blobMatches(acceptedC, "lib/assessment/runtime/contracts/runtime-stage-catalog-v9.json"),
);
check(
  "v1 split Prompts unchanged",
  catalogV9.stages.every((stage) => blobMatches(acceptedC, stage.prompt_path)),
);
check(
  "Base Candidate Plan Report Validation Schemas unchanged",
  schemaPaths.every((item) => blobMatches(baseline, item)),
);
check(
  "migration 0004 unchanged",
  blobMatches(acceptedC, "supabase/migrations/0004_m2_p4_candidate_source_isolation.sql"),
);
check(
  "Active Service unchanged",
  blobMatches(baseline, "lib/assessment/runtime/service.ts") &&
    readText("lib/assessment/runtime/service.ts").includes(
      "loadM2P4ProductQualityRuntimeStageCatalog",
    ) &&
    !readText("lib/assessment/runtime/service.ts").includes(
      "loadM2P4DirectionalGuidanceRuntimeStageCatalog",
    ),
);
check(
  "Application Policy Safety protected",
  [
    "lib/assessment/runtime/application.ts",
    "lib/assessment/runtime/policy-v2.ts",
    "lib/assessment/runtime/policy-v3.ts",
    "lib/assessment/runtime/candidate-safety-routing-v1.ts",
    "lib/assessment/runtime/safety-aggregation-v3.ts",
  ].every((item) => blobMatches(baseline, item)),
);

const activeCatalog = readJson(
  "lib/assessment/runtime/contracts/runtime-stage-catalog-v4.json",
);
const activeAssetPaths = new Set([
  "lib/assessment/runtime/contracts/runtime-stage-catalog-v4.json",
  activeCatalog.common_prompt.prompt_path,
  ...activeCatalog.stages.flatMap((stage) => [stage.prompt_path, stage.schema_path]),
]);
check(
  "Active Catalog v4 assets unchanged",
  [...activeAssetPaths].every((item) => blobMatches(baseline, item)),
);

check(
  "Catalog v10 exact identity",
  catalogV10.schema_version === "m2-p4-runtime-stage-catalog-v2" &&
    catalogV10.catalog_version === "runtime-stage-catalog-v10.0.0" &&
    catalogV10.prompt_bundle_version === "prompt-bundle-runtime-v10.0.0" &&
    catalogV10.schema_set_version === "pipeline-schema-runtime-v4.0.0" &&
    catalogV10.stage_topology_version === "split-base-candidate-v1" &&
    catalogV10.baseline === baseline,
);
check(
  "Stage order 7/7",
  same(
    catalogV10.stages.map(({ stage_id: stageId }) => stageId),
    ["PB-01", "PB-01C", "PB-02", "PB-03", "PB-04", "PB-05", "PB-06"],
  ),
);
check(
  "Prompt hashes exact",
  catalogV10.stages.every(
    (stage) => fileSha256(stage.prompt_path) === stage.prompt_sha256,
  ),
);
check(
  "Schema hashes exact",
  catalogV10.stages.every(
    (stage) => fileSha256(stage.schema_path) === stage.schema_sha256,
  ),
);
check(
  "PB-02 PB-03 deep-equal to v9",
  ["PB-02", "PB-03"].every((stageId) =>
    same(
      catalogV10.stages.find((stage) => stage.stage_id === stageId),
      catalogV9.stages.find((stage) => stage.stage_id === stageId),
    ),
  ),
);

const recomputed = await runDirectionalGuidanceOffline();
check("deterministic replay matches committed result", same(recomputed, committedResult));
check(
  "accepted Grounding replay and Materiality results unchanged",
  committedResult.grounding_v2.summary === "8/8" &&
    committedResult.frozen_pb01_replay.summary === "8/8" &&
    committedResult.semantic_materiality.summary === "12/12",
);
check(
  "accepted v10 Fake v9 parity and mutation results unchanged",
  committedResult.v10_fake_flows.summary === "10/10" &&
    committedResult.v9_parity.summary === "3/3" &&
    committedResult.mutation_rejections.summary === "14/14",
);
check("offline overall PASS", committedResult.overall_verdict === "PASS");
check("AJV compile all relevant Schemas", committedResult.catalogs.status === "PASS");
check(
  "OpenAI Structured Output projection PASS",
  committedResult.catalogs.assertions.all_schemas_compiled_and_projected === true,
);
check(
  "v9 loader unchanged behavior",
  committedResult.catalogs.assertions.v9_identity === true &&
    committedResult.v9_parity.summary === "3/3",
);
check(
  "v10 loader PASS",
  committedResult.catalogs.assertions.v10_identity === true,
);
check(
  "v10 runtime identity PASS",
  committedResult.identities.v10.prompt_bundle_version ===
    "prompt-bundle-runtime-v10.0.0" &&
    committedResult.identities.v10.schema_set_version ===
      "pipeline-schema-runtime-v4.0.0",
);
check(
  "invalid split identity rejected",
  committedResult.invalid_legacy_v10_identity_rejected === true,
);
check(
  "Grounding v2 input nonmutation",
  committedResult.grounding_v2.input_nonmutation === true,
);
check(
  "Grounding v2 semantic-value preservation",
  committedResult.grounding_v2.semantic_value_preservation === true,
);
check(
  "resolved unresolved fields removed",
  committedResult.grounding_v2.results
    .filter(({ fixture_id: fixtureId }) => fixtureId.startsWith("GROUNDING-RESOLVED"))
    .every(({ status }) => status === "PASS"),
);
check(
  "genuine unresolved fields retained",
  committedResult.grounding_v2.results.find(
    ({ fixture_id: fixtureId }) => fixtureId === "GROUNDING-GENUINE-UNKNOWN",
  )?.status === "PASS",
);
check(
  "unsupported unresolved path rejected later",
  committedResult.grounding_v2.results.find(
    ({ fixture_id: fixtureId }) => fixtureId === "GROUNDING-UNSUPPORTED-PATH",
  )?.contextual_integrity === "rejected",
);
check(
  "frozen PB-01 replay raw hashes unchanged",
  committedResult.frozen_pb01_replay.raw_hashes_unchanged === true,
);
check(
  "frozen PB-01 replay Source Integrity PASS",
  committedResult.frozen_pb01_replay.results.every(
    (item) =>
      item.raw_source_integrity_passed && item.grounded_source_integrity_passed,
  ),
);
check(
  "frozen PB-01 replay Contextual Integrity PASS after v2",
  committedResult.frozen_pb01_replay.contextual_integrity_after === "8/8",
);
check(
  "no Provider output mutation",
  committedResult.frozen_pb01_replay.provider_output_mutations === 0,
);
check(
  "Semantic Disposition constants equal Materiality Contract",
  Object.values(
    committedResult.semantic_materiality.constant_deep_match,
  ).every(Boolean),
);
const dispositionById = new Map(
  committedResult.semantic_materiality.results.map((item) => [
    item.fixture_id,
    item,
  ]),
);
check(
  "Hard codes block regardless severity",
  ["DISPOSITION-HARD-FACT-MINOR", "DISPOSITION-HARD-SAFETY-MINOR"].every(
    (fixtureId) => dispositionById.get(fixtureId)?.actual_disposition === "blocking",
  ),
);
check(
  "Flexible internal differences do not independently block",
  ["DISPOSITION-FLEXIBLE-REGISTER", "DISPOSITION-FLEXIBLE-APOLOGY"].every(
    (fixtureId) =>
      dispositionById.get(fixtureId)?.actual_disposition === "nonblocking",
  ),
);
check(
  "Conditional internal differences remain conditional",
  dispositionById.get("DISPOSITION-CONDITIONAL-PRACTICAL")
    ?.actual_disposition === "conditional",
);
check(
  "final-output material drift blocks",
  ["DISPOSITION-FINAL-DRAFT-MEANING", "DISPOSITION-FINAL-DRAFT-PERSONALITY"].every(
    (fixtureId) => dispositionById.get(fixtureId)?.actual_disposition === "blocking",
  ),
);
check(
  "temporal false-positive behavior preserved",
  dispositionById.get("DISPOSITION-TEMPORAL-FUTURE")
    ?.actual_disposition === "ignored",
);
check(
  "Product Outcome five responsibilities present",
  same(materiality.product_direction_doctrine.required_outcome_sequence, [
    "facts",
    "plausible_interpretations",
    "recommended_current_direction",
    "immediate_next_step",
    "reassessment_condition",
  ]),
);
const promptAssertions = committedResult.prompt_responsibilities.assertions;
check("PB-01 hierarchy responsibility present", promptAssertions.pb01_hierarchy);
check("PB-01 cadence responsibility present", promptAssertions.pb01_cadence);
check("PB-01C multi-label responsibility present", promptAssertions.pb01c_multi_label);
check("asks_for_reply reply_demand distinction present", promptAssertions.asks_reply_not_demand);
check("apology flexibility present", promptAssertions.apology_flexibility);
check("register aggregation present", promptAssertions.register_aggregation);
check("PB-04 direction immediate reassessment present", promptAssertions.directional_decision);
check("PB-05 directional report structure present", promptAssertions.directional_report);
check("PB-06 three-tier Materiality present", promptAssertions.three_tier_materiality);
check("no case IDs or fixture literals in Production Prompts", promptAssertions.no_evaluation_literals);
check("v10 Fake flows all expected 10/10", committedResult.v10_fake_flows.summary === "10/10");
check(
  "PB-06 findings remain persisted",
  committedResult.v10_fake_flows.results.every(
    ({ pb_06_evidence_persisted: persisted }) => persisted,
  ),
);
check("v9 parity PASS 3/3", committedResult.v9_parity.summary === "3/3");
check(
  "Candidate isolation preserved",
  capabilities.candidate_source_isolation_preserved === true &&
    promptAssertions.draft_authority === true,
);
check(
  "migration 0005 admits v9 and v10",
  committedResult.migration_static_validation.assertions.admits_v9 &&
    committedResult.migration_static_validation.assertions.admits_v10,
);
check(
  "migration 0005 rejects split bundles in legacy",
  committedResult.migration_static_validation.assertions
    .rejects_split_bundles_in_legacy,
);
check(
  "migration 0005 preserves exact topology",
  committedResult.migration_static_validation.assertions.exact_legacy_order &&
    committedResult.migration_static_validation.assertions.exact_split_order &&
    committedResult.migration_static_validation.assertions.skipped_invariants,
);
check(
  "migration 0005 contains no historical UPDATE",
  committedResult.migration_static_validation.assertions
    .no_assessment_runs_update &&
    committedResult.migration_static_validation.assertions
      .no_assessment_stage_runs_update,
);
check(
  "migration 0005 unapplied",
  committedResult.operations.migration_applied === false &&
    capabilities.migration_0005_applied === false,
);
check(
  "Provider calls 0",
  committedResult.operations.external_provider_calls === 0 &&
    capabilities.provider_calls === 0,
);
check(
  "Provider quality remains false",
  capabilities.provider_quality_established === false,
);
check(
  "DB Supabase operations 0",
  committedResult.operations.db_operations === 0 &&
    committedResult.operations.supabase_operations === 0 &&
    capabilities.db_operations === 0 &&
    capabilities.supabase_operations === 0,
);
check(
  "Active Runtime unchanged",
  committedResult.active_service_unchanged === true &&
    committedResult.operations.active_runtime_activated === false,
);
check("main remains fixed", git("rev-parse", "main") === mainBaseline);
check(
  "Provider retest unauthorized",
  committedResult.provider_retest_authorized === false &&
    capabilities.provider_retest_authorized === false,
);
check(
  "R4 unauthorized",
  committedResult.r4_authorized === false &&
    capabilities.r4_authorized === false,
);
check(
  "mutation rejection 14/14",
  committedResult.mutation_rejections.summary === "14/14" &&
    committedResult.mutation_rejections.results.every(({ rejected }) => rejected),
);
check(
  "Capabilities exact scope and status",
  capabilities.status === "human_chatgpt_accepted_complete" &&
    capabilities.implementation_accepted === true &&
    capabilities.exact_scope === "21/21" &&
    same(sorted(capabilities.exact_mutation_paths), sorted(exactScope)),
);
check(
  "Acceptance metadata and authorization boundary exact",
  capabilities.accepted_implementation_commit === acceptedImplementationCommit &&
    same(capabilities.implementation_snapshot, {
      type: "historical_commit_range",
      base: baseline,
      end: acceptedImplementationCommit,
      exact_paths: 21,
      immutable: true,
      include_working_tree: false,
    }) &&
    capabilities.exact_mutation_path_count === 21 &&
    capabilities.acceptance_sync_exact_scope === "6/6" &&
    capabilities.acceptance_sync_exact_path_count === 6 &&
    same(sorted(capabilities.acceptance_sync_exact_paths), sorted(acceptanceSyncScope)) &&
    capabilities.non_sync_implementation_blobs_unchanged === "15/15" &&
    capabilities.frozen_e_assets_unchanged === "11/11" &&
    capabilities.accepted_product_direction_non_sync_blobs_unchanged === "4/4" &&
    capabilities.catalog_v9_unchanged === true &&
    capabilities.v1_split_prompts_unchanged === true &&
    capabilities.output_schemas_unchanged === true &&
    capabilities.migration_0004_unchanged === true &&
    capabilities.migration_0005_unchanged === true &&
    capabilities.product_direction_status === "human_chatgpt_accepted_complete" &&
    capabilities.product_owner_decisions === "4/4" &&
    capabilities.evaluation_model === "hard_flexible_product_outcome" &&
    capabilities.base_grounding_v2_accepted === true &&
    capabilities.semantic_disposition_v4_accepted === true &&
    capabilities.directional_prompts_accepted === true &&
    capabilities.migration_0005_accepted_as_unapplied === true &&
    capabilities.migration_0005_applied === false &&
    capabilities.candidate_source_isolation_preserved === true &&
    capabilities.v9_parity === "PASS" &&
    capabilities.provider_quality_established === false &&
    capabilities.candidate_ready_for_isolated_e2e === false &&
    capabilities.provider_retest_ready === true &&
    capabilities.provider_retest_authorized === false &&
    capabilities.r4_ready === false &&
    capabilities.r4_authorized === false &&
    capabilities.c2_authorized === false &&
    capabilities.provider_calls === 0 &&
    capabilities.db_operations === 0 &&
    capabilities.supabase_operations === 0 &&
    capabilities.active_service_changed === false &&
    capabilities.active_runtime_activated === false &&
    capabilities.main_changed === false &&
    capabilities.next_candidate ===
      "M2-P4-I3-R1-C1-R3-R2-E-R3 Bounded Directional Guidance Provider and Product Outcome Diagnostic" &&
    capabilities.next_candidate_authorized === false &&
    capabilities.implementation_verifier_result === "PASS_89_OF_89" &&
    capabilities.acceptance_sync_verifier_result ===
      "PASS_99_OF_99_INCLUDING_RETAINED_89" &&
    capabilities.dedicated_verifier_check_count === 99 &&
    capabilities.retained_original_check_count === 89 &&
    capabilities.product_doctrine_result === "PASS" &&
    capabilities.decision_policy_result === "PASS_40_OF_40" &&
    capabilities.typecheck_result === "PASS" &&
    capabilities.lint_result === "PASS" &&
    capabilities.lint_warnings === 0 &&
    capabilities.build_result === "PASS" &&
    capabilities.git_diff_check === "PASS" &&
    capabilities.human_chatgpt_review === "accepted_complete",
);
check(
  "Capabilities hashes match offline results",
  capabilities.hashes.catalog_v10_sha256 ===
    committedResult.hashes.catalog_v10_sha256 &&
    capabilities.hashes.base_grounding_v2_sha256 ===
      committedResult.hashes.grounding_v2_sha256 &&
    capabilities.hashes.semantic_disposition_v4_sha256 ===
      committedResult.hashes.semantic_disposition_v4_sha256 &&
    capabilities.hashes.migration_0005_sha256 ===
      committedResult.hashes.migration_0005_sha256 &&
    same(capabilities.hashes.prompts, committedResult.hashes.prompt_sha256),
);

const runnerSource = readText(
  "scripts/lib/m2-p4-i3-r1-c1-r3-r2-e-r2-offline-runner-v1.mjs",
);
check(
  "runner offline isolation",
  !runnerSource.includes("process.env") &&
    !runnerSource.includes(".env.local") &&
    !runnerSource.includes("node:http") &&
    !runnerSource.includes("node:https") &&
    !/\bfetch\s*\(/u.test(runnerSource),
);
check(
  "runner write boundary result only",
  (runnerSource.match(/writeFileSync\s*\(/gu) ?? []).length === 1 &&
    runnerSource.includes("writeFileSync(resultPath()"),
);

const pipelineSource = readText("lib/assessment/runtime/pipeline.ts");
check(
  "pipeline v10 branch bounded to Grounding and Disposition",
  (pipelineSource.match(/directionalGuidanceRuntime/gu) ?? []).length === 3 &&
    pipelineSource.includes("groundBaseStructuredIntakeV2") &&
    pipelineSource.includes("evaluateSemanticFindingsV4"),
);

const review = readText(
  "docs/phase2/TASK_M2_P4_I3_R1_C1_R3_R2_E_R2_REVIEW.md",
);
check(
  "review required sections and acceptance boundary",
  Array.from({ length: 20 }, (_, index) => `## ${index + 1}.`).every((heading) =>
    review.includes(heading),
  ) &&
    review.includes("No Provider quality claim") &&
    review.includes("No live DB compatibility claim") &&
    review.includes("No live Product Outcome quality claim") &&
    review.includes("No R4 readiness claim") &&
    review.includes("No Runtime activation") &&
    review.includes("R4 unauthorized"),
);
check(
  "documentation synchronization present",
  ["docs/CURRENT_FOCUS.md", "docs/WBS.md", "docs/CODEX_HANDOFF.md"].every(
    (item) =>
      readText(item).includes("M2-P4-I3-R1-C1-R3-R2-E-R2") &&
      readText(item).includes("human_chatgpt_accepted_complete") &&
      readText(item).includes(acceptedImplementationCommit) &&
      readText(item).includes("6/6") &&
      readText(item).includes("15/15") &&
      readText(item).includes("Provider") &&
      readText(item).includes("Active Service") &&
      readText(item).includes("main"),
  ),
);
const requiredAcceptanceDocumentFragments = {
  "docs/phase2/TASK_M2_P4_I3_R1_C1_R3_R2_E_R2_REVIEW.md": [
    "IMPLEMENTATION ACCEPTED COMPLETE",
    `Accepted implementation commit: \`${acceptedImplementationCommit}\``,
    "Acceptance Sync scope: `6/6`",
    "Non-sync implementation blobs: `15/15 unchanged`",
    "Provider retest remains unauthorized",
    "E-R3 remains unauthorized",
  ],
  "docs/CURRENT_FOCUS.md": [
    "IMPLEMENTATION ACCEPTED COMPLETE",
    "acceptance synchronization is exact `6/6`",
    "non-sync implementation blobs remain unchanged `15/15`",
  ],
  "docs/WBS.md": [
    "Human / ChatGPT result: `IMPLEMENTATION ACCEPTED COMPLETE`",
    "Acceptance Sync scope is exact `6/6`",
    "non-sync implementation blobs are unchanged `15/15`",
  ],
  "docs/CODEX_HANDOFF.md": [
    "IMPLEMENTATION ACCEPTED COMPLETE",
    "acceptance synchronization `6/6`",
    "non-sync implementation blobs `15/15` unchanged",
  ],
};
check(
  "Acceptance documentation records exact scope and boundaries",
  Object.entries(requiredAcceptanceDocumentFragments).every(
    ([relativePath, fragments]) => {
      const document = readText(relativePath);
      return fragments.every((fragment) => document.includes(fragment));
    },
  ),
);

const policyOutput = execFileSync(
  process.execPath,
  ["evals/quality/m2-p4-i1/verify-decision-policy.mjs"],
  { cwd: repositoryRoot, encoding: "utf8" },
);
check(
  "Policy 40/40",
  policyOutput.includes("M2_P4_I1_TYPED_POLICY: PASS") &&
    policyOutput.includes("total: 40/40"),
);
check("git diff --check PASS", noWhitespaceErrors());

console.log(`${taskId} DIRECTIONAL_GUIDANCE_VERIFIER: PASS`);
console.log(`checks: ${checks.length}/${checks.length}`);
console.log("exact_scope: 21/21");
console.log("immutable_implementation_scope: 21/21");
console.log("acceptance_sync_scope: 6/6");
console.log("non_sync_implementation_blobs: 15/15 unchanged");
console.log(`accepted_implementation_commit: ${acceptedImplementationCommit}`);
console.log("retained_implementation_checks: 89/89");
console.log("json_parse: 5/5");
console.log("frozen_e_assets: 11/11 unchanged");
console.log("product_direction_non_sync: 4/4 unchanged");
console.log("accepted_a_b_c_d: 4/4, 7/7, 15/15 + 2 successor, 4/4");
console.log(`grounding_v2: ${committedResult.grounding_v2.summary}`);
console.log(`frozen_pb01_replay: ${committedResult.frozen_pb01_replay.summary}`);
console.log(`materiality: ${committedResult.semantic_materiality.summary}`);
console.log(`v10_fake_flows: ${committedResult.v10_fake_flows.summary}`);
console.log(`v9_parity: ${committedResult.v9_parity.summary}`);
console.log(`mutation_rejections: ${committedResult.mutation_rejections.summary}`);
console.log("Policy: 40/40");
console.log("Provider / DB / Supabase: 0 / 0 / 0");
console.log("migration_applied: false");
console.log("Active Service / main: unchanged / unchanged");
