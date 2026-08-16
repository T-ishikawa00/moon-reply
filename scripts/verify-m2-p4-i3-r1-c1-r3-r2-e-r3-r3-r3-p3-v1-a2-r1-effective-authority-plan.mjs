import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import {
  copyFileSync,
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const root = process.cwd();
const taskId =
  "M2-P4-I3-R1-C1-R3-R2-E-R3-R3-R3-P3-V1-A2-R1-EFFECTIVE-AUTHORITY";
const baseline = "ab99f003901475199fcb316264ecd02c4f2baef8";
const acceptedV1A1 = "8db5c6386ed0b9b16f0d1586f47d384262cc502b";
const expectedMain = "61e33a10e195fad17e253a6b9719217e1992f273";
const expectedBranch =
  "plan/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-v1-a2-r1-effective-authority";
const originalPlanBranch =
  "plan/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-v1-a2-clarification-integration";
const expectedCommitSubject =
  "docs: connect clarification authority to downstream assessment";

const planRoot =
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-v1-a2-plan";
const previousPackageRoot =
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-r2-c-r1";
const integrationContractPath = planRoot + "/integration-contract-v1.json";
const planCapabilitiesPath = planRoot + "/capabilities-v1.json";
const workPackagesPath =
  previousPackageRoot + "/implementation-work-packages-v1.json";
const planReviewPath =
  "docs/phase2/TASK_M2_P4_I3_R1_C1_R3_R2_E_R3_R3_R3_P3_V1_A2_PLAN_REVIEW.md";
const originalPlanVerifierPath =
  "scripts/verify-m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-v1-a2-integration-plan.mjs";
const verifierPath =
  "scripts/verify-m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-v1-a2-r1-effective-authority-plan.mjs";
const p1SourceContractPath =
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p1/source-contract-v1.json";

const updatedPaths = [
  "docs/CODEX_HANDOFF.md",
  "docs/CURRENT_FOCUS.md",
  "docs/WBS.md",
  planReviewPath,
  integrationContractPath,
  planCapabilitiesPath,
  workPackagesPath,
];
const newPaths = [verifierPath];
const exactScope = [...updatedPaths, ...newPaths];

const expectedTargets = [
  "material_relationship_or_communication_concern",
  "latest_contact_timing",
  "usual_reply_cadence",
  "central_fear_or_decision_concern",
  "relationship_intent",
  "requested_message_tone",
];

const productSnapshot = {
  "components/runtime/CustomerAssessmentNote.tsx":
    "590ae209072f98eae32f1b705753944d941f0629",
  "components/runtime/CustomerAssessmentNote.module.css":
    "7b0d68bacbb9044ed7f1e3aa5adb520220b0f81c",
  "components/runtime/CustomerDraftCopyButton.tsx":
    "ca53d7b11fb3b1799003df735f1903572d196752",
  "app/review/runtime/v12/page.tsx":
    "698629e0e6543fcd6dc8aa6438de39108807a0d0",
  "lib/assessment/runtime/review/m2-p4-v12-customer-experience-projection-fixtures.ts":
    "7748de655a09b06e2fa70e3de0dc0c8a69b8bdc7",
  "lib/assessment/runtime/customer-assessment-experience-projection-v2.ts":
    "584850c1df7c8b759693cc635045daaee2fd52af",
  "lib/assessment/runtime/customer-assessment-projection-v1.ts":
    "4ef5edde8a2e22c9cb28624ec733a9e6de6826d5",
  "lib/assessment/runtime/types.ts":
    "2b9fba25b7df8232b0aa85230ee4aa12634fda34",
};

function git(args, options = {}) {
  return execFileSync(
    "git.exe",
    ["-c", "safe.directory=C:/projects/moon-reply", ...args],
    {
      cwd: root,
      encoding: "utf8",
      maxBuffer: 256 * 1024 * 1024,
      ...options,
    },
  ).trim();
}

function optionalRemoteHead(branchName) {
  const output = git([
    "ls-remote",
    "--heads",
    "origin",
    "refs/heads/" + branchName,
  ]);
  const rows = output.split(/\r?\n/u).filter(Boolean);
  assert.ok(rows.length <= 1, branchName);
  return rows.length === 0 ? null : rows[0].split(/\s+/u)[0];
}

function remoteHead(branchName) {
  const value = optionalRemoteHead(branchName);
  assert.notEqual(value, null, branchName);
  return value;
}

function gitObjectExists(revisionPath) {
  return (
    spawnSync(
      "git.exe",
      [
        "-c",
        "safe.directory=C:/projects/moon-reply",
        "cat-file",
        "-e",
        revisionPath,
      ],
      { cwd: root, stdio: "ignore" },
    ).status === 0
  );
}

function readText(relativePath) {
  const buffer = readFileSync(path.join(root, relativePath));
  return new TextDecoder("utf-8", { fatal: true }).decode(buffer);
}

function readJson(relativePath) {
  return JSON.parse(readText(relativePath));
}

function sorted(values) {
  return [...values].sort((left, right) => left.localeCompare(right));
}

function unique(values) {
  return [...new Set(values)];
}

function worktreeBlob(relativePath) {
  return git(["hash-object", "--path=" + relativePath, relativePath]);
}

function assertBaselineBlobUnchanged(relativePath) {
  assert.equal(
    worktreeBlob(relativePath),
    git(["rev-parse", baseline + ":" + relativePath]),
    relativePath,
  );
}

function compactDiagnostic(value) {
  return String(value ?? "")
    .split(/\r?\n/u)
    .filter((line) => !line.includes("LF will be replaced by CRLF"))
    .join("\n");
}

function runOriginalPlanVerifierAtImmutableCommit() {
  const temporaryRoot = mkdtempSync(
    path.join(tmpdir(), "moon-reply-v1-a2-r1-original-plan-"),
  );
  const cloneRoot = path.join(temporaryRoot, "repo");
  try {
    execFileSync(
      "git.exe",
      ["clone", "--quiet", "--no-checkout", root, cloneRoot],
      { cwd: root, stdio: "pipe" },
    );
    const sourceNodeModules = path.join(root, "node_modules");
    assert.equal(existsSync(sourceNodeModules), true, sourceNodeModules);
    symlinkSync(
      sourceNodeModules,
      path.join(cloneRoot, "node_modules"),
      "junction",
    );
    const safeDirectory = "safe.directory=" + cloneRoot.replaceAll("\\", "/");
    execFileSync(
      "git.exe",
      ["-c", safeDirectory, "config", "core.autocrlf", "true"],
      { cwd: cloneRoot, stdio: "pipe" },
    );

    const refs = git([
      "for-each-ref",
      "--format=%(refname)%09%(objectname)",
      "refs/heads",
      "refs/remotes/origin",
    ])
      .split(/\r?\n/u)
      .filter(Boolean)
      .map((line) => line.split("\t"));
    for (const [refName, revision] of refs) {
      execFileSync(
        "git.exe",
        ["-c", safeDirectory, "update-ref", refName, revision],
        { cwd: cloneRoot, stdio: "pipe" },
      );
    }

    execFileSync(
      "git.exe",
      ["-c", safeDirectory, "checkout", "--quiet", "-B", originalPlanBranch, baseline],
      { cwd: cloneRoot, stdio: "pipe" },
    );

    const trackedPaths = git(["ls-tree", "-r", "--name-only", baseline])
      .split(/\r?\n/u)
      .filter(Boolean);
    for (const candidate of trackedPaths) {
      const sourcePath = path.join(root, candidate);
      if (!existsSync(sourcePath)) continue;
      if (
        worktreeBlob(candidate) !==
        git(["rev-parse", baseline + ":" + candidate])
      ) {
        continue;
      }
      copyFileSync(sourcePath, path.join(cloneRoot, candidate));
    }

    const sourceContract = readJson(p1SourceContractPath);
    const markerPath = sourceContract.frozen_state.marker_path;
    const markerSource = path.join(root, markerPath);
    const markerTarget = path.join(cloneRoot, ".git", path.basename(markerPath));
    assert.equal(existsSync(markerSource), true, markerPath);
    copyFileSync(markerSource, markerTarget);

    const result = spawnSync(
      process.execPath,
      [path.join(cloneRoot, originalPlanVerifierPath)],
      {
        cwd: cloneRoot,
        encoding: "utf8",
        maxBuffer: 256 * 1024 * 1024,
        stdio: ["ignore", "pipe", "pipe"],
      },
    );
    if (result.status !== 0) {
      throw new Error(
        "Original A2 plan verifier failed at immutable snapshot.\nstdout:\n" +
          compactDiagnostic(result.stdout) +
          "\nstderr:\n" +
          compactDiagnostic(result.stderr),
      );
    }
    return result.stdout;
  } finally {
    rmSync(temporaryRoot, { recursive: true, force: true });
  }
}

const contract = readJson(integrationContractPath);
const capabilities = readJson(planCapabilitiesPath);
const workPackages = readJson(workPackagesPath);
const v1A = workPackages.packages.find((entry) => entry.id === "V1-A");
const v1A2 = v1A?.subpackages.find((entry) => entry.id === "V1-A2");

const allBaselinePaths = git(["ls-tree", "-r", "--name-only", baseline])
  .split(/\r?\n/u)
  .filter(Boolean)
  .map((relativePath) => relativePath.replaceAll("\\", "/"));
const protectedRuntimePaths = unique([
  ...allBaselinePaths.filter((relativePath) => {
    const lower = relativePath.toLowerCase();
    return (
      relativePath.startsWith("lib/assessment/runtime/") ||
      relativePath.startsWith("app/api/") ||
      relativePath.startsWith("components/runtime/") ||
      relativePath.startsWith("supabase/migrations/") ||
      lower.includes("payment") ||
      lower.includes("stripe") ||
      lower.includes("payjp")
    );
  }),
  "app/globals.css",
  "next-env.d.ts",
]);

let commitState = "unverified";
let originalPlanSummary = "not run";
let upstreamSummary = "not run";
const failures = [];
let checkCount = 0;

async function check(name, callback) {
  checkCount += 1;
  try {
    await callback();
    console.log("PASS " + name);
  } catch (error) {
    failures.push(name);
    console.error("FAIL " + name);
    console.error(error instanceof Error ? error.stack : error);
  }
}

await check("exact branch parent direct child main remote and stash", () => {
  const head = git(["rev-parse", "HEAD"]);
  assert.equal(git(["branch", "--show-current"]), expectedBranch);
  assert.equal(git(["rev-parse", baseline]), baseline);
  assert.equal(git(["rev-parse", baseline + "^"]), acceptedV1A1);
  assert.equal(git(["merge-base", head, baseline]), baseline);
  const commitCount = Number(git(["rev-list", "--count", baseline + ".." + head]));
  assert.ok(commitCount === 0 || commitCount === 1, String(commitCount));
  if (commitCount === 1) {
    assert.equal(git(["rev-parse", head + "^"]), baseline);
    assert.equal(git(["show", "-s", "--format=%s", head]), expectedCommitSubject);
    commitState = "one direct child";
  } else {
    commitState = "precommit candidate";
  }
  const targetRemote = optionalRemoteHead(expectedBranch);
  assert.ok(targetRemote === null || targetRemote === head, String(targetRemote));
  assert.equal(git(["rev-parse", "main"]), expectedMain);
  assert.equal(git(["rev-parse", "origin/main"]), expectedMain);
  assert.equal(remoteHead("main"), expectedMain);
  assert.equal(git(["stash", "list"]), "");
});

await check("exact correction scope is 8 paths with 7 updates and 1 new", () => {
  const tracked = git(["diff", "--name-status", baseline, "--"])
    .split(/\r?\n/u)
    .filter(Boolean)
    .map((line) => {
      const [status, ...parts] = line.split("\t");
      return { status, path: parts.at(-1).replaceAll("\\", "/") };
    });
  const trackedPaths = new Set(tracked.map((entry) => entry.path));
  const untracked = git(["ls-files", "--others", "--exclude-standard"])
    .split(/\r?\n/u)
    .filter(Boolean)
    .map((relativePath) => relativePath.replaceAll("\\", "/"))
    .filter((relativePath) => !trackedPaths.has(relativePath))
    .map((relativePath) => ({ status: "A", path: relativePath }));
  const actual = [...tracked, ...untracked];
  assert.equal(actual.length, 8);
  assert.deepEqual(sorted(actual.map((entry) => entry.path)), sorted(exactScope));
  assert.deepEqual(
    sorted(actual.filter((entry) => entry.status === "M").map((entry) => entry.path)),
    sorted(updatedPaths),
  );
  assert.deepEqual(
    sorted(actual.filter((entry) => entry.status === "A").map((entry) => entry.path)),
    sorted(newPaths),
  );
  for (const candidate of updatedPaths) {
    assert.equal(gitObjectExists(baseline + ":" + candidate), true, candidate);
  }
  assert.equal(gitObjectExists(baseline + ":" + verifierPath), false, verifierPath);
});

await check("strict UTF-8 JSON hygiene sensitive scan and diff check", () => {
  const secretPatterns = [
    /sk-[A-Za-z0-9_-]{20,}/gu,
    /(?:OPENAI_API_KEY|SUPABASE_SERVICE_ROLE_KEY)\s*[=:]\s*["'][^"']{8,}["']/gu,
    /eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/gu,
    /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/gu,
  ];
  let sensitiveValues = 0;
  for (const candidate of exactScope) {
    const source = readText(candidate);
    assert.equal(source.includes("\uFFFD"), false, candidate);
    assert.doesNotMatch(source, /[\t ]+$/gmu, candidate);
    assert.equal(source.replaceAll("\r\n", "\n").endsWith("\n\n"), false);
    for (const pattern of secretPatterns) {
      sensitiveValues += [...source.matchAll(pattern)].length;
    }
  }
  assert.equal(sensitiveValues, 0);
  readJson(integrationContractPath);
  readJson(planCapabilitiesPath);
  readJson(workPackagesPath);
  git(["diff", "--check", baseline, "--"]);
});

await check("immutable original A2 planning verifier remains PASS 26/26", () => {
  assertBaselineBlobUnchanged(originalPlanVerifierPath);
  const output = runOriginalPlanVerifierAtImmutableCommit();
  for (const pattern of [
    /integration planning verifier: PASS 26\/26/u,
    /Accepted V1-A1 verifier at 8db5c638: PASS 25\/25/u,
    /All upstream accepted verifiers: PASS/u,
  ]) {
    assert.match(output, pattern);
  }
  originalPlanSummary = "PASS 26/26";
  upstreamSummary = "PASS";
});

await check("review finding and correction authority are exact", () => {
  assert.equal(contract.authority.v1_a2_plan_commit, baseline);
  assert.equal(contract.authority.accepted_v1_a1_snapshot, acceptedV1A1);
  assert.equal(contract.authority.v1_a2_plan_review, "NEEDS_CORRECTION");
  assert.deepEqual(contract.authority.v1_a2_plan_review_findings, {
    blocker: 0,
    major: 1,
    minor: 2,
    major_code: "clarification_authority_missing_from_downstream_assessment_chain",
    minor_codes: [
      "usual_reply_cadence_question_answer_mismatch",
      "awaiting_to_processing_transition_not_exact",
    ],
  });
  assert.equal(contract.authority.v1_a2_implementation_authorized, false);
});

await check("three immutable source lanes remain separate", () => {
  assert.deepEqual(
    contract.authority_lanes.lanes.map((entry) => entry.id),
    ["base", "candidate", "clarification_evidence"],
  );
  for (const lane of contract.authority_lanes.lanes) {
    const mutabilityKey =
      lane.id === "clarification_evidence"
        ? "mutable_after_answer_acceptance"
        : "mutable_after_request_creation";
    assert.equal(lane[mutabilityKey], false, lane.id);
  }
  assert.equal(contract.authority_lanes.clarification_appended_to_current_situation, false);
  assert.equal(contract.authority_lanes.clarification_inserted_into_base_source_refs, false);
  assert.equal(
    contract.authority_lanes.clarification_claims_input_current_situation_provenance,
    false,
  );
  assert.equal(contract.authority_lanes.clarification_contaminates_candidate, false);
});

await check("EffectiveAssessmentAuthority is derived and complete", () => {
  const effective = contract.effective_assessment_authority;
  assert.equal(effective.name, "EffectiveAssessmentAuthorityV1");
  assert.equal(effective.owner, "application");
  assert.equal(effective.authority_kind, "derived_composition");
  assert.equal(effective.is_source_of_new_facts, false);
  assert.equal(effective.mutates_source_authority, false);
  assert.deepEqual(effective.required_fields, [
    "schemaVersion",
    "baseAuthorityRef",
    "candidateAuthorityRef",
    "clarificationAuthorityRef",
    "effectiveDecisionContext",
    "effectiveWritingContext",
    "effectiveEmotionalContext",
    "sourceMap",
  ]);
  assert.equal(effective.required_downstream_input_name, "effective_assessment_authority");
});

await check("effective authority preserves per-value provenance", () => {
  const effective = contract.effective_assessment_authority;
  assert.deepEqual(effective.source_map_entry_fields, [
    "effectivePath",
    "sourceLane",
    "sourceRef",
    "sourceValuePath",
    "clarificationTarget",
  ]);
  assert.deepEqual(effective.source_namespaces, {
    base: "input:",
    candidate: "candidate:",
    clarification: "clarification:<opaque_clarification_id>:answer:1",
  });
  assert.equal(effective.composition_rules.per_value_origin_required, true);
  assert.equal(effective.composition_rules.customer_visible_internal_ids, false);
});

await check("effective authority composition is target limited and fail closed", () => {
  const rules = contract.effective_assessment_authority.composition_rules;
  assert.equal(rules.clarification_fills_selected_missing_dimension_only, true);
  assert.equal(rules.clarification_overrides_known_base_value, false);
  assert.equal(rules.unrelated_effective_path_change_allowed, false);
  assert.equal(rules.conflict_safe_code, "M2_CLARIFICATION_AUTHORITY_CONFLICT");
  assert.deepEqual(contract.effective_authority_integrity.validates, [
    "source_lane_namespace",
    "per_value_source_map",
    "selected_target_only",
    "immutable_source_references",
    "no_known_base_override",
    "no_candidate_contamination",
    "no_unrelated_effective_path_change",
    "required_downstream_injection",
  ]);
  assert.equal(contract.effective_authority_integrity.fail_closed_before_product_delivery, true);
});

await check("all six targets have an explicit downstream consumer matrix", () => {
  const matrix = contract.clarification_downstream_consumer_matrix;
  assert.deepEqual(matrix.map((entry) => entry.target), expectedTargets);
  for (const row of matrix) {
    assert.ok(row.allowed_consumers.length >= 4, row.target);
    assert.ok(
      row.allowed_consumers.some((consumer) => consumer.startsWith("v1_a_")),
      row.target,
    );
    assert.ok(
      row.allowed_consumers.some((consumer) => consumer.startsWith("pb_05_")),
      row.target,
    );
    assert.ok(
      row.allowed_consumers.some((consumer) => consumer.startsWith("pb_06_")),
      row.target,
    );
    assert.ok(row.prohibited_effects.length >= 2, row.target);
  }
});

await check("Decision Policy has a clarification-aware successor seam", () => {
  const successor = contract.decision_policy_successor;
  assert.equal(successor.name, "EffectiveDecisionPolicyV1");
  assert.equal(successor.future_path, "lib/assessment/runtime/effective-decision-policy-v1.ts");
  assert.equal(successor.accepted_policy_files_mutated, false);
  assert.equal(successor.input, "EffectiveAssessmentAuthorityV1.effectiveDecisionContext");
  assert.equal(successor.adds_explicit_consumption_record, true);
  assert.equal(successor.clarification_change_scope, "selected_authorized_dimension_only");
  assert.equal(successor.other_person_fact_inference_allowed, false);
});

await check("PB-04 successor consumes effective clarification authority", () => {
  const strategy = contract.downstream_stage_successor_strategy;
  const stage = strategy.successors.find((entry) => entry.stage_id === "PB-04");
  assert.equal(
    strategy.selected_strategy,
    "effective_assessment_authority_as_additional_application_owned_input",
  );
  assert.equal(strategy.effective_input_name, "effective_assessment_authority");
  assert.equal(stage.prompt_successor, "pb-04-clarification-aware-v1.developer.md");
  assert.equal(stage.existing_output_schema_reused, "decision-plan-v2.schema.json");
  assert.match(stage.responsibility, /action_draft_and_reassessment/u);
});

await check("PB-05 successor reflects authority without V1-B semantic rewrite", () => {
  const strategy = contract.downstream_stage_successor_strategy;
  const stage = strategy.successors.find((entry) => entry.stage_id === "PB-05");
  assert.equal(stage.prompt_successor, "pb-05-clarification-aware-v1.developer.md");
  assert.equal(stage.existing_output_schema_reused, "report-content-v2.schema.json");
  assert.match(stage.responsibility, /reflect_material_ready_making_clarification/u);
  assert.equal(strategy.pb_05_semantic_depth_changed, false);
  assert.equal(strategy.v1_b_owned_work_included, false);
});

await check("PB-06 successor validates clarification fidelity fail closed", () => {
  const strategy = contract.downstream_stage_successor_strategy;
  const stage = strategy.successors.find((entry) => entry.stage_id === "PB-06");
  assert.equal(stage.prompt_successor, "pb-06-clarification-aware-v1.developer.md");
  assert.equal(stage.existing_output_schema_reused, "ai/schemas/validation-result.schema.json");
  assert.match(stage.responsibility, /missing_distorted_or_misattributed/u);
  assert.equal(
    contract.effective_authority_integrity.discarded_ready_making_clarification_safe_code,
    "M2_CLARIFICATION_DOWNSTREAM_DISCARDED",
  );
});

await check("ready-making clarification cannot be discarded downstream", () => {
  const invariant = contract.end_to_end_acceptance_invariant;
  assert.equal(
    invariant.expression,
    "clarification_used_to_establish_ready_implies_materially_relevant_clarification_preserved_downstream",
  );
  assert.equal(invariant.hard_blocking, true);
  assert.equal(invariant.failure_safe_code, "M2_CLARIFICATION_DOWNSTREAM_DISCARDED");
  assert.deepEqual(
    invariant.required_regressions.map((entry) => entry.id),
    [
      "requested_tone_soft_ready_consumed",
      "latest_timing_ready_consumed",
      "relationship_intent_move_closer_consumed",
      "central_fear_ready_consumed",
      "no_clarification_behavioral_parity",
      "target_x_does_not_change_target_y",
    ],
  );
  assert.equal(
    contract.downstream_stage_successor_strategy.clarification_discard_after_eligibility_allowed,
    false,
  );
});

await check("no-clarification behavioral parity preserves accepted behavior", () => {
  const reevaluation = contract.v1_a1_re_evaluation;
  assert.equal(
    reevaluation.no_clarification_parity,
    "behavioral_parity_with_explicit_v2_question_copy_exception",
  );
  assert.deepEqual(reevaluation.behavioral_parity_fields, [
    "state",
    "reason_semantics",
    "missing_dimensions",
    "clarification_budget",
    "non_clarification_routing",
  ]);
  assert.equal(reevaluation.customer_question_byte_or_deep_equality_required, false);
  assert.equal(reevaluation.v2_copy_correction_changes_eligibility_semantics, false);
  assert.equal(
    contract.decision_policy_successor.no_clarification_behavior,
    "equivalent_to_accepted_current_decision_policy",
  );
});

await check("usual cadence V2 question and answer semantics are aligned", () => {
  const cadence = contract.clarification_targets.find(
    (entry) => entry.target === "usual_reply_cadence",
  );
  assert.equal(
    cadence.customer_question_v2,
    "今の待ち時間は、その相手の普段の返信ペースの範囲内ですか？",
  );
  assert.deepEqual(cadence.allowed_answer_shape, {
    kind: "single_choice_relation",
    values: ["within_usual", "beyond_usual", "unknown"],
  });
  assert.deepEqual(v1A2.usual_reply_cadence_answer_values, [
    "within_usual",
    "beyond_usual",
    "unknown",
  ]);
});

await check("answer acceptance and awaiting-to-processing transition are atomic", () => {
  const transition = contract.persistence_lifecycle.atomic_answer_resume_transition;
  assert.deepEqual(transition.transactional_authority_boundary, [
    "lock_clarification_row",
    "lock_assessment_request",
    "verify_pending_and_awaiting_clarification",
    "persist_answer_exactly_once",
    "transition_request_awaiting_clarification_to_processing",
    "create_exactly_one_resume_run",
  ]);
  assert.equal(transition.request_from, "awaiting_clarification");
  assert.equal(transition.request_to, "processing");
  assert.equal(transition.resume_runs_created, 1);
  assert.equal(transition.partial_commit_allowed, false);
  assert.equal(
    contract.run_state_semantics.answered_clarification.transition_atomic_with_answer_and_resume_run,
    true,
  );
});

await check("duplicates create no extra run and no second clarification", () => {
  const duplicate = contract.persistence_lifecycle.duplicate_submit;
  assert.equal(duplicate.transactional_row_lock_required, true);
  assert.equal(
    duplicate.same_canonical_answer_after_acceptance,
    "idempotent_replay_existing_continuation_or_result",
  );
  assert.equal(duplicate.same_canonical_answer_additional_runs, 0);
  assert.equal(duplicate.different_answer_after_acceptance, "fail_closed");
  assert.equal(duplicate.different_answer_http_status, 409);
  assert.equal(contract.run_state_semantics.automatic_second_clarification_allowed, false);
  assert.equal(contract.run_state_semantics.clarification_loop_allowed, false);
  assert.equal(contract.run_state_semantics.answered_clarification.return_to_awaiting_clarification_allowed, false);
});

await check("resume run terminal states are exact", () => {
  assert.deepEqual(
    contract.run_state_semantics.answered_clarification.terminal_request_states,
    {
      ready: "completed",
      not_full_product_candidate: "completed",
      safety_blocked: "completed",
      technical_failure: "failed",
    },
  );
  assert.deepEqual(
    contract.run_state_semantics.answered_clarification.allowed_policy_states,
    ["full_paid_ready_candidate", "not_full_product_candidate", "safety_blocked"],
  );
  assert.equal(
    contract.run_state_semantics.answered_clarification.needs_one_clarifying_answer_allowed,
    false,
  );
});

await check("opaque continuation capability is sufficiently unpredictable", () => {
  const authority = contract.persistence_lifecycle.continuation_authority;
  assert.equal(
    authority.identifier_kind,
    "cryptographically_random_non_sequential_capability",
  );
  assert.ok(authority.minimum_unpredictability_bits >= 128);
  assert.equal(authority.raw_request_id_as_only_authority, false);
  assert.equal(authority.answered_or_completed_reusable_for_new_run, false);
  assert.equal(authority.provider_or_internal_ids_customer_visible, false);
  assert.equal(
    authority.production_session_or_account_binding,
    "future_production_decision_not_implemented_by_v1_a2_plan",
  );
});

await check("future A2 implementation manifest is recomputed exact 37 paths", () => {
  const scope = contract.future_v1_a2_implementation_scope;
  assert.equal(scope.status, "r1_recomputed_fixed_but_unauthorized_pending_plan_acceptance");
  assert.equal(scope.total, "37/37");
  assert.equal(scope.updated, 14);
  assert.equal(scope.new, 23);
  assert.equal(scope.deleted, 0);
  assert.equal(scope.renamed, 0);
  assert.equal(scope.updated_paths.length, 14);
  assert.equal(scope.new_paths.length, 23);
  assert.equal(unique([...scope.updated_paths, ...scope.new_paths]).length, 37);
  for (const candidate of scope.updated_paths) {
    assert.equal(gitObjectExists(baseline + ":" + candidate), true, candidate);
  }
  for (const candidate of scope.new_paths) {
    assert.equal(gitObjectExists(baseline + ":" + candidate), false, candidate);
  }
  for (const required of [
    "lib/assessment/runtime/effective-assessment-authority-v1.ts",
    "lib/assessment/runtime/effective-assessment-authority-integrity-v1.ts",
    "lib/assessment/runtime/effective-decision-policy-v1.ts",
    "lib/assessment/runtime/contracts/pb-04-clarification-aware-v1.developer.md",
    "lib/assessment/runtime/contracts/pb-05-clarification-aware-v1.developer.md",
    "lib/assessment/runtime/contracts/pb-06-clarification-aware-v1.developer.md",
  ]) {
    assert.ok(scope.new_paths.includes(required), required);
  }
  assert.equal(scope.scope_change_rule, "STOP_and_obtain_new_human_review_before_implementation");
});

await check("work package and capabilities synchronize corrected architecture", () => {
  assert.equal(v1A2.status, "r1_effective_authority_correction_defined_pending_review");
  assert.equal(v1A2.effective_assessment_authority, "EffectiveAssessmentAuthorityV1");
  assert.equal(v1A2.effective_authority_kind, "derived_not_source");
  assert.equal(v1A2.per_value_provenance_required, true);
  assert.equal(v1A2.decision_policy_successor, "EffectiveDecisionPolicyV1");
  assert.equal(v1A2.pb_04_clarification_aware_successor, true);
  assert.equal(v1A2.pb_05_clarification_aware_successor, true);
  assert.equal(v1A2.pb_06_clarification_validation_successor, true);
  assert.equal(v1A2.ready_making_clarification_discard_allowed, false);
  assert.deepEqual(v1A2.future_exact_implementation_scope, {
    status: "r1_recomputed_fixed_unauthorized",
    total: "37/37",
    updated: 14,
    new: 23,
    deleted: 0,
    renamed: 0,
  });
  assert.equal(capabilities.architecture.effective_authority_kind, "derived_not_source");
  assert.equal(capabilities.architecture.ready_making_clarification_discard_allowed, false);
  assert.deepEqual(capabilities.future_implementation_scope, {
    status: "r1_recomputed_fixed_unauthorized",
    total: "37/37",
    updated: 14,
    new: 23,
    deleted: 0,
    renamed: 0,
  });
});

await check("planning documents record correction scope and closed authority", () => {
  const documents = [
    readText("docs/CODEX_HANDOFF.md"),
    readText("docs/CURRENT_FOCUS.md"),
    readText("docs/WBS.md"),
    readText(planReviewPath),
  ];
  for (const document of documents) {
    assert.match(document, /ab99f003901475199fcb316264ecd02c4f2baef8/u);
    assert.match(document, /EffectiveAssessmentAuthorityV1/u);
    assert.match(document, /EffectiveDecisionPolicyV1/u);
    assert.match(document, /PB-04/u);
    assert.match(document, /PB-05/u);
    assert.match(document, /PB-06/u);
    assert.match(document, /37\/37/u);
    assert.match(document, /implementation_authorized(?:`|=|:)?(?:\s*)false/u);
    assert.match(document, /remediation_required/u);
    assert.match(document, /not_established/u);
    assert.match(document, /globalQ0Completion(?:`|=|:)?(?:\s*)false/u);
  }
  for (const document of documents.slice(0, 3)) {
    assert.match(document, /8\/8/u);
    assert.match(document, /7 UPDATE \+ 1 NEW/u);
  }
});

await check("all current Runtime Product API UI DB Prompt and Payment blobs are unchanged", () => {
  assert.ok(protectedRuntimePaths.length > 80);
  for (const candidate of protectedRuntimePaths) {
    assertBaselineBlobUnchanged(candidate);
  }
  assert.deepEqual(capabilities.current_runtime_mutation, {
    product_code: 0,
    pipeline: 0,
    types: 0,
    api: 0,
    ui: 0,
    db: 0,
    migration: 0,
    prompt: 0,
    schema: 0,
    catalog: 0,
    provider: 0,
    pb_05: 0,
    semantic_disposition: 0,
    payment: 0,
  });
  assert.deepEqual(capabilities.operations, {
    provider_calls: 0,
    db_operations: 0,
    supabase_operations: 0,
    migrations_applied: 0,
  });
});

await check("Product snapshot main and next-env remain unchanged", () => {
  const r2BProductSnapshot = "fa956b9b1941c73f8e1767c64ab24f07fadd36c6";
  assert.equal(git(["merge-base", baseline, r2BProductSnapshot]), r2BProductSnapshot);
  for (const [candidate, expectedBlob] of Object.entries(productSnapshot)) {
    assert.equal(git(["rev-parse", r2BProductSnapshot + ":" + candidate]), expectedBlob);
    assert.equal(git(["rev-parse", baseline + ":" + candidate]), expectedBlob);
    assert.equal(worktreeBlob(candidate), expectedBlob);
  }
  assert.equal(git(["rev-parse", "main"]), expectedMain);
  assert.equal(git(["rev-parse", "origin/main"]), expectedMain);
  assert.equal(remoteHead("main"), expectedMain);
  assertBaselineBlobUnchanged("next-env.d.ts");
  assert.equal(git(["diff", "--name-only", baseline, "--", "next-env.d.ts"]), "");
  git(["diff", "--check", baseline, "--"]);
});

await check("current authority remains closed and correction scope is exact", () => {
  assert.deepEqual(contract.current_authority, {
    v1_a1: "accepted_complete",
    v1_a2: "r1_effective_authority_correction_defined_pending_review",
    v1_a2_implementation_authorized: false,
    v1_b: "unauthorized",
    v1_c: "unauthorized",
    v1_d: "unauthorized",
    r2_c: "remediation_required",
    experienceProductJudgment: "pending_remediation",
    jpy980RuntimeReadiness: "not_established",
    globalQ0Completion: false,
    provider_execution_authorized: false,
    production_runtime_authorized: false,
    payment_authorized: false,
    main_integration_authorized: false,
  });
  assert.equal(capabilities.packages["V1-A2"].implementation_authorized, false);
  assert.equal(capabilities.packages["V1-B"], "unauthorized");
  assert.equal(capabilities.packages["V1-C"], "unauthorized");
  assert.equal(capabilities.packages["V1-D"], "unauthorized");
  assert.deepEqual(capabilities.exact_r1_correction_scope, {
    total: "8/8",
    updated: 7,
    new: 1,
    deleted: 0,
    renamed: 0,
  });
  assert.equal(v1A2.pb_05_semantic_depth_rewrite_in_scope, false);
  assert.equal(v1A2.v1_b_in_scope, false);
});

assert.equal(checkCount, 27);

if (failures.length > 0) {
  console.error("\n" + taskId + " planning correction verifier: FAIL");
  console.error("Failed checks: " + failures.join("; "));
  process.exit(1);
}

console.log("\n" + taskId + " planning correction verifier: PASS 27/27");
console.log("Exact correction scope: 8/8; updated 7; new 1");
console.log("Commit state: " + commitState);
console.log("Original A2 planning verifier at ab99f003: " + originalPlanSummary);
console.log("All upstream accepted verifiers: " + upstreamSummary);
console.log("Authority lanes: immutable Base / Candidate / Clarification Evidence");
console.log("EffectiveAssessmentAuthorityV1: derived; per-value provenance: retained");
console.log("Decision Policy / PB-04 / PB-05 / PB-06 clarification seams: defined");
console.log("Ready-making clarification downstream discard: prohibited");
console.log("Future V1-A2 implementation scope: 37/37; authorization: false");
console.log("Provider / DB / Supabase operations: 0 / 0 / 0");
console.log("R2-C: remediation_required; JPY980 Runtime readiness: not_established");
console.log("Global Q0: false; Product snapshot changed: false; next-env drift: 0");
