import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync, spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import Ajv2020 from "ajv/dist/2020.js";

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const baselineSha = "e5cfd903740267db6d070964a9ec72a7d823f310";
const i3BaselineSha = "61e33a10e195fad17e253a6b9719217e1992f273";
const i3ImplementationSha = "c85d6d122ad71569532a55887b9a3b6d93f8a288";
const layer1PlanningSha = "ec7cd53884ab4056c78d2596c609baef5701274a";
const acceptedPlanningSha = "3c64e5e2179b4c03979119068716326337a002c6";

const exactPaths = [
  "lib/assessment/runtime/contracts/writing-context-v1.ts",
  "lib/assessment/runtime/contracts/structured-intake-v4.schema.json",
  "lib/assessment/runtime/contracts/decision-plan-v2.schema.json",
  "lib/assessment/runtime/contracts/report-content-v2.schema.json",
  "evals/runtime/m2-p4-i3-r1-a-schema-contract-v1.json",
  "evals/runtime/m2-p4-i3-r1-a-contract-fixtures-v1.json",
  "evals/runtime/m2-p4-i3-r1-a-capabilities-v1.json",
  "scripts/verify-m2-p4-i3-r1-a-contracts.mjs",
  "docs/phase2/TASK_M2_P4_I3_R1_A_REVIEW.md",
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
const exactAcceptanceSyncPaths = [
  "docs/phase2/M2_P4_I3_R1_INTERACTION_RELATIONSHIP_VOICE_FINAL_PLAN.md",
  "docs/phase2/TASK_M2_P4_I3_R1_FINAL_PLANNING_REVIEW.md",
  "evals/runtime/m2-p4-i3-r1-final-planning-capabilities-v1.json",
  "docs/CURRENT_FOCUS.md",
  "docs/WBS.md",
  "docs/CODEX_HANDOFF.md",
];
const schemaPaths = {
  structured_intake_v4:
    "lib/assessment/runtime/contracts/structured-intake-v4.schema.json",
  decision_plan_v2:
    "lib/assessment/runtime/contracts/decision-plan-v2.schema.json",
  report_content_v2:
    "lib/assessment/runtime/contracts/report-content-v2.schema.json",
};
const acceptedPlanningQualityPaths = [
  "evals/quality/m2-p4-i3-r1-context-taxonomy-v2.json",
  "evals/quality/m2-p4-i3-r1-style-intent-rubric-v2.json",
  "evals/quality/m2-p4-i3-r1-canonical-suite-v2.json",
  "evals/quality/m2-p4-i3-r1-report-depth-plan-v1.json",
  "evals/quality/m2-p4-i3-r1-schema-successor-plan-v1.json",
  "evals/quality/m2-p4-i3-r1-quality-gate-plan-v1.json",
];
const writingDefinitionNames = [
  "writing_source_ref",
  "writing_source_refs",
  "writing_evidence_state",
  "relationship_effect_class",
  "romantic_stage_writing_fact",
  "social_role_writing_fact",
  "hierarchy_writing_fact",
  "familiarity_writing_fact",
  "communication_context_writing_fact",
  "observed_register_writing_fact",
  "relationship_dimensions",
  "message_ownership_item",
  "incoming_message_profile",
  "candidate_style_profile",
  "candidate_communicative_intent",
  "user_goal_detail",
  "explicit_user_constraint",
  "communication_pattern",
  "channel_and_timing",
  "language_and_expression",
  "repeat_consultation_state",
  "writing_context",
];
const sourceReferencePattern = /^(input|followup):[A-Za-z0-9_.-]+$/u;
const forbiddenSourceTargetPattern =
  /(?:^|[:_.-])(case|fixture|oracle|db)(?:$|[_.-])/iu;
const fullUuidPattern =
  /\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/iu;

function absolute(relativePath) {
  return path.join(repositoryRoot, ...relativePath.split("/"));
}

function source(relativePath) {
  return readFileSync(absolute(relativePath), "utf8");
}

function json(relativePath) {
  return JSON.parse(source(relativePath));
}

function canonicalText(value) {
  return value.replace(/\r\n/gu, "\n");
}

function sha256(value) {
  return createHash("sha256")
    .update(Buffer.from(canonicalText(value), "utf8"))
    .digest("hex");
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

function normalizedPaths(output) {
  return output
    .split(/\r?\n/gu)
    .map((item) => item.trim().replaceAll("\\", "/"))
    .filter(Boolean);
}

function currentTaskPaths(startSha) {
  const paths = new Set(
    normalizedPaths(gitText(["diff", "--name-only", startSha, "--"])),
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

function historicalPaths(startSha, endSha) {
  return sorted(
    normalizedPaths(gitText(["diff", "--name-only", startSha, endSha, "--"])),
  );
}

function isExactLiteralSet(actual, expected) {
  return (
    actual.length === expected.length &&
    new Set(actual).size === expected.length &&
    actual.every(
      (item) =>
        typeof item === "string" &&
        item.length > 0 &&
        !item.includes("*") &&
        !item.endsWith("/"),
    ) &&
    JSON.stringify(sorted(actual)) === JSON.stringify(sorted(expected))
  );
}

function resolveLocalReference(rootSchema, reference) {
  if (reference === "#") return rootSchema;
  if (!reference.startsWith("#/")) return null;
  let selected = rootSchema;
  for (const encoded of reference.slice(2).split("/")) {
    const segment = encoded.replaceAll("~1", "/").replaceAll("~0", "~");
    if (
      typeof selected !== "object" ||
      selected === null ||
      Array.isArray(selected) ||
      !(segment in selected)
    ) {
      return null;
    }
    selected = selected[segment];
  }
  return typeof selected === "object" && selected !== null && !Array.isArray(selected)
    ? selected
    : null;
}

function walkSchema(value, visitor, schemaPath = "#") {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return;
  visitor(value, schemaPath);
  for (const key of [
    "properties",
    "$defs",
    "anyOf",
    "oneOf",
    "allOf",
    "prefixItems",
  ]) {
    const child = value[key];
    if (Array.isArray(child)) {
      child.forEach((item, index) =>
        walkSchema(item, visitor, `${schemaPath}/${key}/${index}`),
      );
    } else if (typeof child === "object" && child !== null) {
      for (const [name, item] of Object.entries(child)) {
        walkSchema(item, visitor, `${schemaPath}/${key}/${name}`);
      }
    }
  }
  for (const key of ["items", "if", "then", "else", "not"]) {
    if (typeof value[key] === "object" && value[key] !== null) {
      walkSchema(value[key], visitor, `${schemaPath}/${key}`);
    }
  }
}

function verifyCanonicalStrictObjects(schema) {
  walkSchema(schema, (node, schemaPath) => {
    if (node.type !== "object") return;
    assert.equal(
      node.additionalProperties,
      false,
      `${schemaPath} must set additionalProperties false`,
    );
    assert.ok(
      node.properties &&
        typeof node.properties === "object" &&
        !Array.isArray(node.properties),
      `${schemaPath} must declare properties`,
    );
    assert.deepEqual(
      sorted(node.required ?? []),
      sorted(Object.keys(node.properties)),
      `${schemaPath} must require every property and no extra key`,
    );
  });
}

function verifyLocalReferences(schema) {
  walkSchema(schema, (node, schemaPath) => {
    if (typeof node.$ref !== "string") return;
    assert.equal(
      node.$ref.startsWith("#/"),
      true,
      `${schemaPath}/$ref must be local`,
    );
    assert.ok(
      resolveLocalReference(schema, node.$ref),
      `${schemaPath}/$ref must resolve`,
    );
  });
}

function providerMetrics(schema) {
  let properties = 0;
  let maximumDepth = 0;
  let schemaStringCharacters = 0;
  let enumValues = 0;
  function visit(value, depth) {
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
      return;
    }
    maximumDepth = Math.max(maximumDepth, depth);
    if (value.properties && typeof value.properties === "object") {
      properties += Object.keys(value.properties).length;
    }
    if (Array.isArray(value.enum)) enumValues += value.enum.length;
    for (const [key, child] of Object.entries(value)) {
      schemaStringCharacters += key.length;
      if (typeof child === "string") {
        schemaStringCharacters += child.length;
      } else if (Array.isArray(child)) {
        for (const item of child) {
          if (typeof item === "string") schemaStringCharacters += item.length;
          else visit(item, depth + 1);
        }
      } else {
        visit(child, depth + 1);
      }
    }
  }
  visit(schema, 1);
  return { properties, maximumDepth, schemaStringCharacters, enumValues };
}

function schemaValidationError(validators, fixture) {
  for (const [key, validate] of Object.entries(validators)) {
    if (!validate(fixture[key])) return key;
  }
  return null;
}

function duplicate(values) {
  return new Set(values).size !== values.length;
}

function relationshipChipEscalation(writingContext) {
  return Object.values(writingContext.relationship_dimensions).some(
    (fact) =>
      fact.effect_class !== "writing_only" &&
      fact.source_refs.length > 0 &&
      fact.source_refs.every((reference) => reference === "input:relationship_chip"),
  );
}

function candidateIsPresent(writingContext) {
  return writingContext.message_ownership.some(
    (message) => message.status === "unsent_candidate",
  );
}

function crossContractError(fixture) {
  const intake = fixture.structured_intake_v4;
  const plan = fixture.decision_plan_v2;
  const report = fixture.report_content_v2;
  const writing = intake.writing_context;
  const draft = plan.recommended_message_draft;
  const metadata = plan.message_draft_edit_metadata;
  const writingSourceReferences = collectSourceReferences(writing);

  if (
    writingSourceReferences.some(
      (reference) =>
        !sourceReferencePattern.test(reference) ||
        forbiddenSourceTargetPattern.test(reference) ||
        fullUuidPattern.test(reference),
    )
  ) {
    return "WRITING_SOURCE_REFERENCE_INVALID";
  }

  if (
    ["reply_now", "send_now"].includes(plan.selected_decision) &&
    draft === null
  ) {
    return "DECISION_DRAFT_REQUIRED";
  }
  if (
    plan.selected_decision === "pause_additional_contact" &&
    draft !== null
  ) {
    return "PAUSE_DRAFT_PROHIBITED";
  }
  if (
    plan.selected_decision === "wait_and_reassess" &&
    draft !== null &&
    (draft.policy !== "later_only" || draft.use_timing !== "later")
  ) {
    return "WAIT_DRAFT_POLICY_INVALID";
  }
  if ((draft === null) !== (metadata === null)) {
    return "DRAFT_METADATA_WITHOUT_DRAFT";
  }
  if (draft === null && report.message_draft_context !== null) {
    return "REPORT_DRAFT_CONTEXT_WITHOUT_DRAFT";
  }
  if (draft !== null && report.message_draft_context === null) {
    return "REPORT_DRAFT_CONTEXT_REQUIRED";
  }
  if (plan.aftercare_plan.length !== report.aftercare_commentary.length) {
    return "AFTERCARE_COMMENTARY_COUNT_MISMATCH";
  }
  if (
    plan.change_conditions.length !==
    report.change_condition_commentary.length
  ) {
    return "CHANGE_COMMENTARY_COUNT_MISMATCH";
  }

  const selectedRequests = intake.decision_facts.selected_requests;
  if (
    selectedRequests.includes("next_three_days") &&
    plan.aftercare_plan.length < 1
  ) {
    return "NEXT_THREE_DAYS_AFTERCARE_REQUIRED";
  }
  if (
    !selectedRequests.includes("next_three_days") &&
    plan.aftercare_plan.length > 2
  ) {
    return "AFTERCARE_TOO_DEEP_FOR_UNSELECTED_TOPIC";
  }
  if (
    duplicate(plan.actions_to_take) ||
    duplicate(plan.actions_to_avoid) ||
    duplicate(plan.aftercare_plan.map((item) => item.action))
  ) {
    return "FILLER_OR_DUPLICATE_ACTION";
  }

  const candidatePresent = candidateIsPresent(writing);
  if (
    !candidatePresent &&
    (writing.candidate_style_profile !== null ||
      writing.candidate_communicative_intent !== null)
  ) {
    return "CANDIDATE_PROFILE_WITHOUT_CANDIDATE";
  }
  if (
    candidatePresent &&
    (writing.candidate_style_profile === null ||
      writing.candidate_communicative_intent === null)
  ) {
    return "CANDIDATE_PROFILE_REQUIRED";
  }
  if (
    intake.decision_facts.contact_state.proposed_message_present !==
    candidatePresent
  ) {
    return "CANDIDATE_PRESENCE_DECISION_FACT_MISMATCH";
  }
  if (
    draft !== null &&
    metadata.source_status === "generated_without_candidate" &&
    candidatePresent
  ) {
    return "CANDIDATE_SOURCE_STATUS_MISMATCH";
  }
  if (
    draft !== null &&
    metadata.source_status !== "generated_without_candidate" &&
    !candidatePresent
  ) {
    return "CANDIDATE_SOURCE_STATUS_MISMATCH";
  }

  const messageIds = writing.message_ownership.map(
    (message) => message.message_id,
  );
  if (duplicate(messageIds)) return "DUPLICATE_MESSAGE_ID";
  if (relationshipChipEscalation(writing)) {
    return "BROAD_CHIP_EFFECT_CLASS_ESCALATION";
  }

  const consultationSources = new Set(
    writing.message_ownership
      .filter((message) => message.status === "consultation_narrative")
      .flatMap((message) => message.source_refs),
  );
  if (
    writing.candidate_style_profile !== null &&
    writing.candidate_style_profile.source_refs.some((reference) =>
      consultationSources.has(reference),
    )
  ) {
    return "CONSULTATION_NARRATIVE_USED_AS_STYLE";
  }

  const noEmoji = writing.explicit_user_constraints.some(
    (constraint) => constraint.kind === "no_emoji",
  );
  const unsupportedEmojiChange =
    noEmoji &&
    writing.candidate_style_profile?.emoji_usage === "none" &&
    metadata?.style_delta.some(
      (delta) =>
        delta.dimension === "emoji_usage" && delta.change !== "preserved",
    );
  if (unsupportedEmojiChange) return "NO_EMOJI_CONSTRAINT_VIOLATED";

  const fixedGeneralLimitation =
    "このノートは入力された情報を整理した判断材料です。相手の本心や将来を断定・保証せず、医療・心理・法律上の助言を代替しません。";
  if (plan.model_generated_limitations.includes(fixedGeneralLimitation)) {
    return "FIXED_LIMITATION_MODEL_GENERATED";
  }
  if (Object.hasOwn(report, "unknowns_commentary")) {
    return "UNKNOWNS_COMMENTARY_PRESENT";
  }

  if (
    selectedRequests.includes("draft_message") &&
    (draft === null || report.message_draft_context === null)
  ) {
    return "SELECTED_REQUEST_UNFULFILLED";
  }
  if (
    selectedRequests.includes("message_impact") &&
    report.message_temperature === null &&
    report.possible_interpretations.length === 0
  ) {
    return "SELECTED_REQUEST_UNFULFILLED";
  }
  if (
    selectedRequests.includes("relationship") &&
    report.relationship_summary === null
  ) {
    return "SELECTED_REQUEST_UNFULFILLED";
  }
  if (
    selectedRequests.includes("organize_emotions") &&
    report.short_letter.length === 0
  ) {
    return "SELECTED_REQUEST_UNFULFILLED";
  }
  return null;
}

function collectSourceReferences(value, references = []) {
  if (Array.isArray(value)) {
    for (const item of value) collectSourceReferences(item, references);
    return references;
  }
  if (typeof value !== "object" || value === null) return references;
  for (const [key, child] of Object.entries(value)) {
    if (
      ["source_refs", "explicit_source_refs", "inferred_source_refs"].includes(
        key,
      ) &&
      Array.isArray(child)
    ) {
      references.push(...child);
    } else {
      collectSourceReferences(child, references);
    }
  }
  return references;
}

function collectReachablePropertyNames(rootSchema, startSchema) {
  const names = new Set();
  const visitedReferences = new Set();
  function visit(node) {
    if (typeof node !== "object" || node === null || Array.isArray(node)) return;
    if (typeof node.$ref === "string") {
      if (visitedReferences.has(node.$ref)) return;
      visitedReferences.add(node.$ref);
      visit(resolveLocalReference(rootSchema, node.$ref));
    }
    if (node.properties && typeof node.properties === "object") {
      for (const [name, child] of Object.entries(node.properties)) {
        names.add(name);
        visit(child);
      }
    }
    if (node.items) visit(node.items);
    for (const key of ["anyOf", "oneOf", "allOf"]) {
      if (Array.isArray(node[key])) node[key].forEach(visit);
    }
  }
  visit(startSchema);
  return names;
}

for (const sha of [
  baselineSha,
  i3BaselineSha,
  i3ImplementationSha,
  layer1PlanningSha,
  acceptedPlanningSha,
]) {
  gitText(["cat-file", "-e", `${sha}^{commit}`]);
  gitText(["merge-base", "--is-ancestor", sha, "HEAD"]);
}

assert.equal(exactPaths.length, 18);
assert.equal(new Set(exactPaths).size, 18);
assert.equal(isExactLiteralSet(currentTaskPaths(baselineSha), exactPaths), true);
for (const unauthorizedPath of [
  "lib/assessment/runtime/pipeline.ts",
  "lib/assessment/runtime/service.ts",
  "lib/assessment/runtime/schema-catalog.ts",
  "lib/assessment/runtime/contracts/structured-intake-v3.schema.json",
  "ai/schemas/structured-intake.schema.json",
  "ai/prompts/decision-plan/v1.0.0.developer.md",
  "components/runtime/Unauthorized.tsx",
  "app/unauthorized/page.tsx",
  "lib/assessment/runtime/policy-v3.ts",
  "lib/assessment/runtime/contracts/runtime-stage-catalog-v4.json",
]) {
  assert.equal(
    isExactLiteralSet([...exactPaths, unauthorizedPath], exactPaths),
    false,
  );
}

const i1cCapabilities = json(
  "evals/runtime/m2-p4-i1-c-capabilities-v1.json",
);
const i1cSnapshot = i1cCapabilities.implementation_snapshot;
assert.equal(i1cSnapshot.immutable_snapshot, true);
assert.equal(i1cSnapshot.include_working_tree, false);
assert.equal(i1cCapabilities.accepted_stack_paths.length, 27);
assert.deepEqual(
  historicalPaths(i1cSnapshot.base_commit_sha, i1cSnapshot.end_commit_sha),
  sorted(i1cCapabilities.accepted_stack_paths),
);

const i2Capabilities = json("evals/runtime/m2-p4-i2-capabilities-v1.json");
const i2Snapshot = i2Capabilities.implementation_snapshot;
assert.equal(i2Snapshot.immutable_snapshot, true);
assert.equal(i2Snapshot.include_working_tree, false);
assert.equal(i2Capabilities.exact_mutation_paths.length, 16);
assert.deepEqual(
  historicalPaths(i2Snapshot.base_commit_sha, i2Snapshot.end_commit_sha),
  sorted(i2Capabilities.exact_mutation_paths),
);

const i3Capabilities = json("evals/runtime/m2-p4-i3-capabilities-v1.json");
assert.equal(i3Capabilities.exact_mutation_paths.length, 19);
assert.deepEqual(
  historicalPaths(i3BaselineSha, i3ImplementationSha),
  sorted(i3Capabilities.exact_mutation_paths),
);

const layer1Capabilities = json(
  "evals/runtime/m2-p4-i3-r1-planning-capabilities-v1.json",
);
assert.equal(layer1Capabilities.exact_mutation_paths.length, 9);
assert.deepEqual(
  historicalPaths(i3ImplementationSha, layer1PlanningSha),
  sorted(layer1Capabilities.exact_mutation_paths),
);

const finalPlanningCapabilities = json(
  "evals/runtime/m2-p4-i3-r1-final-planning-capabilities-v1.json",
);
assert.equal(
  finalPlanningCapabilities.status,
  "human_chatgpt_accepted_complete",
);
assert.equal(
  finalPlanningCapabilities.accepted_planning_commit,
  acceptedPlanningSha,
);
assert.equal(finalPlanningCapabilities.review_correction_status, "resolved");
assert.equal(finalPlanningCapabilities.exact_mutation_paths.length, 12);
assert.equal(finalPlanningCapabilities.planning_snapshot.immutable_snapshot, true);
assert.equal(finalPlanningCapabilities.planning_snapshot.include_working_tree, false);
assert.deepEqual(
  historicalPaths(layer1PlanningSha, acceptedPlanningSha),
  sorted(finalPlanningCapabilities.exact_mutation_paths),
);
assert.deepEqual(
  historicalPaths(acceptedPlanningSha, baselineSha),
  sorted(exactAcceptanceSyncPaths),
);
assert.equal(exactAcceptanceSyncPaths.length, 6);
for (const paths of [
  i1cCapabilities.accepted_stack_paths,
  i2Capabilities.exact_mutation_paths,
  i3Capabilities.exact_mutation_paths,
  layer1Capabilities.exact_mutation_paths,
  finalPlanningCapabilities.exact_mutation_paths,
  exactAcceptanceSyncPaths,
  exactPaths,
]) {
  assert.equal(
    paths.some((item) => item.includes("*") || item.endsWith("/")),
    false,
  );
}

for (const planningPath of acceptedPlanningQualityPaths) {
  assert.equal(
    source(planningPath),
    gitText(["show", `${acceptedPlanningSha}:${planningPath}`]),
    `${planningPath} changed after accepted planning`,
  );
}

const protectedPaths = [
  "lib/assessment/runtime/contracts/structured-intake-v3.schema.json",
  "ai/schemas/structured-intake.schema.json",
  "ai/schemas/decision-plan.schema.json",
  "ai/schemas/report-content.schema.json",
  "ai/schemas/validation-result.schema.json",
  "ai/prompts",
  "lib/assessment/runtime/contracts/pb-01-structure-v3.developer.md",
  "lib/assessment/runtime/contracts/pb-03-projection-v3.developer.md",
  "lib/assessment/runtime/contracts/pb-04-decision-plan-v3.developer.md",
  "lib/assessment/runtime/contracts/pb-05-report-writer-v3.developer.md",
  "lib/assessment/runtime/contracts/pb-06-semantic-validator-v2.developer.md",
  "lib/assessment/runtime/contracts/runtime-stage-catalog-v4.json",
  "lib/assessment/runtime/pipeline.ts",
  "lib/assessment/runtime/service.ts",
  "lib/assessment/runtime/schema-catalog.ts",
  "lib/assessment/runtime/types.ts",
  "lib/assessment/runtime/policy.ts",
  "lib/assessment/runtime/policy-v2.ts",
  "lib/assessment/runtime/policy-v3.ts",
  "lib/assessment/runtime/eligibility-v3.ts",
  "lib/assessment/runtime/safety-aggregation-v3.ts",
  "lib/assessment/runtime/report-grounding-v3.ts",
  "lib/assessment/runtime/structured-intake-grounding-v3.ts",
  "lib/assessment/runtime/change-condition-grounding-v3.ts",
  "lib/assessment/runtime/semantic-disposition-v3.ts",
  "app",
  "components",
  "supabase",
  "package.json",
  "package-lock.json",
  "evals/development",
  "evals/holdout",
];
const protectedDiff = gitResult([
  "diff",
  "--exit-code",
  baselineSha,
  "--",
  ...protectedPaths,
]);
assert.equal(protectedDiff.status, 0, protectedDiff.stdout || protectedDiff.stderr);

const manifest = json("evals/runtime/m2-p4-i3-r1-a-schema-contract-v1.json");
const capabilities = json("evals/runtime/m2-p4-i3-r1-a-capabilities-v1.json");
assert.equal(manifest.task_id, "M2-P4-I3-R1-A");
assert.equal(manifest.baseline, baselineSha);
assert.equal(manifest.candidate_schema_set, "pipeline-schema-runtime-v4.0.0");
assert.equal(manifest.active_runtime_unchanged, true);
assert.equal(manifest.accepted_planning_commit, acceptedPlanningSha);
assert.deepEqual(
  manifest.accepted_planning_snapshot,
  finalPlanningCapabilities.planning_snapshot,
);
assert.equal(manifest.mappings["PB-06"].status, "unchanged");
assert.equal(manifest.validation_result_successor, "not_in_this_slice");
assert.equal(manifest.runtime_catalog_successor, "not_in_this_slice");
assert.equal(manifest.prompt_successor, "not_in_this_slice");

assert.equal(capabilities.task_id, "M2-P4-I3-R1-A");
assert.equal(
  capabilities.title,
  "Successor Schemas and Typed Writing Context Contracts",
);
assert.equal(
  capabilities.status,
  "implementation_pending_human_chatgpt_review",
);
assert.equal(capabilities.baseline, baselineSha);
assert.equal(isExactLiteralSet(capabilities.exact_mutation_paths, exactPaths), true);
assert.equal(capabilities.exact_mutation_path_count, 18);
assert.equal(capabilities.candidate_schema_set, "pipeline-schema-runtime-v4.0.0");
assert.equal(capabilities.active_runtime_changed, false);
for (const key of [
  "prompt_mutations",
  "pipeline_mutations",
  "service_mutations",
  "ui_mutations",
  "policy_mutations",
  "db_operations",
  "openai_calls",
  "migrations",
  "holdout_use",
  "real_user_data",
]) {
  assert.equal(capabilities[key], 0, `${key} must remain zero`);
}
assert.equal(capabilities.provider_diagnostic, "not_started");
assert.equal(capabilities.achieved_score, null);
assert.equal(capabilities.next_candidate_authorized, false);

for (const [schemaPath, expectedHash] of Object.entries(
  manifest.schema_hashes,
)) {
  assert.equal(sha256(source(schemaPath)), expectedHash);
}
assert.equal(
  sha256(source(manifest.writing_context_contract_module.path)),
  manifest.writing_context_contract_module.sha256_canonical_lf_utf8,
);

const v3 = json(
  "lib/assessment/runtime/contracts/structured-intake-v3.schema.json",
);
const v4 = json(schemaPaths.structured_intake_v4);
const decisionPlanV2 = json(schemaPaths.decision_plan_v2);
const reportContentV2 = json(schemaPaths.report_content_v2);
assert.equal(v4.properties.schema_version.const, "pipeline-schema-v4.0.0");
assert.equal(
  v4.properties.writing_context.$ref,
  "#/$defs/writing_context",
);
assert.equal(v4.required.includes("writing_context"), true);
assert.equal(
  v4.$defs.writing_context.properties.schema_version.const,
  "m2-p4-writing-context-v1",
);
assert.deepEqual(
  v4.$defs.candidate_communicative_intent.properties.practical_requirement.items
    .enum,
  v4.$defs.incoming_message_profile.properties.practical_requirements.items
    .enum,
);
assert.deepEqual(v4.$defs.decision_facts, v3.$defs.decision_facts);

const normalizedV3 = structuredClone(v3);
const normalizedV4 = structuredClone(v4);
for (const candidate of [normalizedV3, normalizedV4]) {
  delete candidate.$id;
  delete candidate.title;
}
normalizedV4.properties.schema_version =
  structuredClone(normalizedV3.properties.schema_version);
normalizedV4.required = normalizedV4.required.filter(
  (item) => item !== "writing_context",
);
delete normalizedV4.properties.writing_context;
for (const definitionName of writingDefinitionNames) {
  delete normalizedV4.$defs[definitionName];
}
assert.deepEqual(normalizedV4, normalizedV3);

const writingContract = await import(
  pathToFileURL(
    absolute("lib/assessment/runtime/contracts/writing-context-v1.ts"),
  ).href,
);
const enumComparisons = [
  [
    writingContract.WRITING_EVIDENCE_STATES,
    v4.$defs.writing_evidence_state.enum,
  ],
  [
    writingContract.RELATIONSHIP_EFFECT_CLASSES,
    v4.$defs.relationship_effect_class.enum,
  ],
  [
    writingContract.ROMANTIC_STAGES,
    v4.$defs.romantic_stage_writing_fact.properties.value.enum,
  ],
  [
    writingContract.SOCIAL_ROLES,
    v4.$defs.social_role_writing_fact.properties.value.enum,
  ],
  [
    writingContract.HIERARCHIES,
    v4.$defs.hierarchy_writing_fact.properties.value.enum,
  ],
  [
    writingContract.FAMILIARITIES,
    v4.$defs.familiarity_writing_fact.properties.value.enum,
  ],
  [
    writingContract.COMMUNICATION_CONTEXTS,
    v4.$defs.communication_context_writing_fact.properties.value.enum,
  ],
  [
    writingContract.OBSERVED_REGISTERS,
    v4.$defs.observed_register_writing_fact.properties.value.enum,
  ],
  [
    writingContract.MESSAGE_AUTHORS,
    v4.$defs.message_ownership_item.properties.author.enum,
  ],
  [
    writingContract.MESSAGE_STATUSES,
    v4.$defs.message_ownership_item.properties.status.enum,
  ],
  [
    writingContract.DIALOGUE_ACTS,
    v4.$defs.incoming_message_profile.properties.dialogue_acts.items.enum,
  ],
  [
    writingContract.DETAILED_USER_GOALS,
    v4.$defs.user_goal_detail.properties.value.enum,
  ],
  [
    writingContract.EXPLICIT_CONSTRAINT_KINDS,
    v4.$defs.explicit_user_constraint.properties.kind.enum,
  ],
  [
    writingContract.CHANNELS,
    v4.$defs.channel_and_timing.properties.channel.enum,
  ],
  [
    writingContract.RELATIVE_TIMINGS,
    v4.$defs.channel_and_timing.properties.relative_timing.enum,
  ],
  [
    writingContract.REPEAT_CONSULTATION_STATES,
    v4.$defs.repeat_consultation_state.properties.state.enum,
  ],
  [
    writingContract.PRIVACY_MARKERS,
    v4.$defs.writing_context.properties.privacy_markers.items.enum,
  ],
  [
    writingContract.SURFACE_REGISTER_VALUES,
    v4.$defs.candidate_style_profile.properties.register.enum,
  ],
  [
    writingContract.SENTENCE_LENGTH_VALUES,
    v4.$defs.candidate_style_profile.properties.sentence_length.enum,
  ],
  [
    writingContract.SENTENCE_ENDING_VALUES,
    v4.$defs.candidate_style_profile.properties.sentence_ending.enum,
  ],
  [
    writingContract.PUNCTUATION_VALUES,
    v4.$defs.candidate_style_profile.properties.punctuation.enum,
  ],
  [
    writingContract.EMOJI_USAGE_VALUES,
    v4.$defs.candidate_style_profile.properties.emoji_usage.enum,
  ],
  [
    writingContract.EXCLAMATION_USAGE_VALUES,
    v4.$defs.candidate_style_profile.properties.exclamation_usage.enum,
  ],
  [
    writingContract.SOFTNESS_VALUES,
    v4.$defs.candidate_style_profile.properties.softness.enum,
  ],
  [
    writingContract.DIRECTNESS_VALUES,
    v4.$defs.candidate_style_profile.properties.directness.enum,
  ],
  [
    writingContract.INVITATION_STYLE_VALUES,
    v4.$defs.candidate_style_profile.properties.invitation_style.enum,
  ],
  [
    writingContract.REPLY_PRESSURE_VALUES,
    v4.$defs.candidate_style_profile.properties.reply_pressure.enum,
  ],
  [
    writingContract.COMMUNICATIVE_INTENT_DELTAS,
    decisionPlanV2.$defs.intent_delta.enum,
  ],
];
for (const [typescriptValues, schemaValues] of enumComparisons) {
  assert.deepEqual([...typescriptValues], schemaValues);
}
assert.deepEqual(
  [...writingContract.SURFACE_STYLE_DIMENSIONS],
  v4.$defs.candidate_style_profile.required.filter(
    (item) => !["evidence_state", "source_refs"].includes(item),
  ),
);
assert.deepEqual(
  [...writingContract.SURFACE_STYLE_DIMENSIONS],
  decisionPlanV2.$defs.style_delta.properties.dimension.enum,
);

const contractSource = source(
  "lib/assessment/runtime/contracts/writing-context-v1.ts",
);
assert.equal(/^import\s/mu.test(contractSource), false);
assert.equal(/\bfunction\b/u.test(contractSource), false);
assert.equal(/OpenAI|Supabase|pipeline|service/u.test(contractSource), false);

const {
  assertOpenAIStructuredOutputSchema,
  toOpenAiStructuredOutputSchema,
} = await import(
  pathToFileURL(
    absolute("lib/assessment/runtime/openai-schema.ts"),
  ).href,
);
const canonicalSchemas = {
  structured_intake_v4: v4,
  decision_plan_v2: decisionPlanV2,
  report_content_v2: reportContentV2,
};
const canonicalValidators = {};
const providerValidators = {};
for (const [key, schema] of Object.entries(canonicalSchemas)) {
  verifyCanonicalStrictObjects(schema);
  verifyLocalReferences(schema);
  const canonicalAjv = new Ajv2020({ allErrors: true, strict: false });
  canonicalValidators[key] = canonicalAjv.compile(schema);

  const providerSchema = toOpenAiStructuredOutputSchema(schema);
  assert.doesNotThrow(() =>
    assertOpenAIStructuredOutputSchema(providerSchema),
  );
  const metrics = providerMetrics(providerSchema);
  assert.ok(metrics.maximumDepth <= 10);
  assert.ok(metrics.properties <= 5000);
  assert.ok(metrics.schemaStringCharacters <= 120000);
  assert.ok(metrics.enumValues <= 1000);
  const providerAjv = new Ajv2020({ allErrors: true, strict: false });
  providerValidators[key] = providerAjv.compile(providerSchema);
}

assert.equal(decisionPlanV2.type, "object");
assert.equal(Object.hasOwn(decisionPlanV2, "anyOf"), false);
assert.equal(reportContentV2.type, "object");
assert.equal(Object.hasOwn(reportContentV2, "anyOf"), false);
assert.equal(Object.hasOwn(reportContentV2.properties, "unknowns_commentary"), false);

const prohibitedWritingProperties = new Set([
  "raw_text",
  "message_text",
  "candidate_text",
  "incoming_text",
  "name",
  "phone",
  "email",
  "address",
  "account_id",
  "workplace_name",
  "school_name",
  "confidence",
  "probability",
]);
const writingPropertyNames = collectReachablePropertyNames(
  v4,
  v4.$defs.writing_context,
);
assert.deepEqual(
  [...writingPropertyNames].filter((name) =>
    prohibitedWritingProperties.has(name),
  ),
  [],
);

const fixtures = json(
  "evals/runtime/m2-p4-i3-r1-a-contract-fixtures-v1.json",
);
assert.equal(fixtures.synthetic_only, true);
assert.equal(fixtures.real_user_data, false);
assert.equal(fixtures.holdout_material, false);
assert.ok(fixtures.valid_sets.length >= 6);
assert.ok(fixtures.invalid_sets.length >= 8);
assert.equal(new Set(fixtures.valid_sets.map((item) => item.set_id)).size, fixtures.valid_sets.length);
assert.equal(new Set(fixtures.invalid_sets.map((item) => item.set_id)).size, fixtures.invalid_sets.length);

for (const fixture of fixtures.valid_sets) {
  assert.equal(schemaValidationError(canonicalValidators, fixture), null);
  assert.equal(schemaValidationError(providerValidators, fixture), null);
  assert.equal(crossContractError(fixture), null, fixture.set_id);
  assert.equal(
    fullUuidPattern.test(JSON.stringify(fixture)),
    false,
    fixture.set_id,
  );
  for (const reference of collectSourceReferences(
    fixture.structured_intake_v4.writing_context,
  )) {
    assert.match(reference, sourceReferencePattern);
    assert.equal(forbiddenSourceTargetPattern.test(reference), false);
    assert.equal(fullUuidPattern.test(reference), false);
  }
}

for (const fixture of fixtures.invalid_sets) {
  assert.ok(
    typeof fixture.expected_failure_code === "string" &&
      fixture.expected_failure_code.length > 0,
  );
  assert.ok(
    ["schema", "cross_contract"].includes(fixture.expected_failure_owner),
  );
  const schemaError = schemaValidationError(canonicalValidators, fixture);
  const crossError = crossContractError(fixture);
  if (fixture.expected_failure_owner === "schema") {
    assert.notEqual(schemaError, null, fixture.set_id);
  } else {
    assert.equal(schemaError, null, fixture.set_id);
    assert.equal(
      crossError,
      fixture.expected_failure_code,
      fixture.set_id,
    );
  }
}

const duplicateMessageFixture = structuredClone(fixtures.valid_sets[0]);
duplicateMessageFixture.structured_intake_v4.writing_context.message_ownership.push({
  ...structuredClone(
    duplicateMessageFixture.structured_intake_v4.writing_context
      .message_ownership[0],
  ),
  sequence: 3,
});
assert.equal(
  crossContractError(duplicateMessageFixture),
  "DUPLICATE_MESSAGE_ID",
);
const broadChipFixture = structuredClone(fixtures.valid_sets[0]);
broadChipFixture.structured_intake_v4.writing_context.relationship_dimensions
  .romantic_stage.effect_class = "decision_material";
broadChipFixture.structured_intake_v4.writing_context.relationship_dimensions
  .romantic_stage.source_refs = ["input:relationship_chip"];
assert.equal(
  crossContractError(broadChipFixture),
  "BROAD_CHIP_EFFECT_CLASS_ESCALATION",
);
for (const prohibitedReference of [
  "input:case.001",
  "input:fixture.001",
  "followup:oracle.001",
  "input:db.001",
  "input:123e4567-e89b-42d3-a456-426614174000",
]) {
  const prohibitedSourceFixture = structuredClone(fixtures.valid_sets[0]);
  prohibitedSourceFixture.structured_intake_v4.writing_context.source_refs = [
    prohibitedReference,
  ];
  assert.equal(
    crossContractError(prohibitedSourceFixture),
    "WRITING_SOURCE_REFERENCE_INVALID",
  );
}

const canonicalSuite = json(
  "evals/quality/m2-p4-i3-r1-canonical-suite-v2.json",
);
const layer1Suite = json(
  "evals/quality/m2-p4-i3-r1-contrast-suite-v1.json",
);
const categoryEntries = Object.entries(canonicalSuite.categories);
const canonicalCases = categoryEntries.flatMap(([, category]) => category.cases);
assert.equal(categoryEntries.length, 8);
assert.equal(canonicalCases.length, 64);
assert.equal(new Set(canonicalCases.map((item) => item.case_id)).size, 64);
assert.deepEqual(
  categoryEntries.map(([, category]) => category.cases.length),
  Array(8).fill(8),
);
for (const categoryName of canonicalSuite.layer_assignments.layer_1) {
  assert.deepEqual(
    canonicalSuite.categories[categoryName],
    layer1Suite.categories[categoryName],
  );
}
assert.equal(canonicalSuite.declared_counts.layer_1, 32);
assert.equal(canonicalSuite.declared_counts.layer_2, 32);
assert.equal(canonicalSuite.declared_counts.total, 64);

const addedDiff = gitText([
  "diff",
  "--unified=0",
  baselineSha,
  "--",
  ...exactPaths,
])
  .split(/\r?\n/gu)
  .filter((line) => line.startsWith("+") && !line.startsWith("+++"))
  .join("\n");
for (const prohibitedCall of [
  /new\s+OpenAI\s*\(/u,
  /\.responses\.create\s*\(/u,
  /\.chat\.completions\.create\s*\(/u,
  /createClient\s*\(/u,
  /\.(?:insert|upsert|delete|rpc)\s*\(/u,
  /\.from\s*\([^)]*\)[\s\S]{0,240}\.update\s*\(/u,
]) {
  assert.equal(prohibitedCall.test(addedDiff), false);
}
assert.equal(
  gitResult(["diff", "--check", baselineSha, "--"]).status,
  0,
);

console.log("M2_P4_I3_R1_A_CONTRACTS: PASS");
console.log("candidate_schema_set: pipeline-schema-runtime-v4.0.0");
console.log("active_runtime_changed: false");
console.log("structured_intake_v4: PASS");
console.log("writing_context_contract: PASS");
console.log("decision_plan_v2: PASS");
console.log("report_content_v2: PASS");
console.log("provider_schema_compatibility: PASS");
console.log("fixtures_valid: PASS");
console.log("fixtures_invalid: PASS");
console.log("canonical_suite: 64/64");
console.log("openai_calls: 0");
console.log("db_operations: 0");
console.log("holdout_use: 0");
