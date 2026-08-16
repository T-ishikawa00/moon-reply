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
const taskId = "M2-P4-I3-R1-C1-R3-R2-E-R3-R3-R3-P3-V1-A2-PLAN";
const baseline = "8db5c6386ed0b9b16f0d1586f47d384262cc502b";
const originalV1A1 = "65c245860813f6179689855b344dbf6fd425867a";
const architecture = "cfad0bd4ca3fd2304b00d072624e624f98c09b29";
const r2BProductSnapshot = "fa956b9b1941c73f8e1767c64ab24f07fadd36c6";
const expectedMain = "61e33a10e195fad17e253a6b9719217e1992f273";
const expectedBranch =
  "plan/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-v1-a2-clarification-integration";
const acceptedV1A1Branch =
  "fix/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-v1-a1-r1-materiality";
const expectedCommitSubject =
  "docs: define V1-A2 clarification integration architecture";

const previousPackageRoot =
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-r2-c-r1";
const v1A1Root =
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-v1-a1";
const planRoot =
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-v1-a2-plan";
const integrationContractPath = planRoot + "/integration-contract-v1.json";
const planCapabilitiesPath = planRoot + "/capabilities-v1.json";
const v1A1CapabilitiesPath = v1A1Root + "/capabilities-v1.json";
const workPackagesPath =
  previousPackageRoot + "/implementation-work-packages-v1.json";
const v1A1ReviewPath =
  "docs/phase2/TASK_M2_P4_I3_R1_C1_R3_R2_E_R3_R3_R3_P3_V1_A1_REVIEW.md";
const planReviewPath =
  "docs/phase2/TASK_M2_P4_I3_R1_C1_R3_R2_E_R3_R3_R3_P3_V1_A2_PLAN_REVIEW.md";
const acceptedV1A1VerifierPath =
  "scripts/verify-m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-v1-a1-r1-materiality.mjs";
const originalV1A1VerifierPath =
  "scripts/verify-m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-v1-a1-input-sufficiency-policy.mjs";
const verifierPath =
  "scripts/verify-m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-v1-a2-integration-plan.mjs";
const p1SourceContractPath =
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p1/source-contract-v1.json";

const updatedPaths = [
  "docs/CODEX_HANDOFF.md",
  "docs/CURRENT_FOCUS.md",
  "docs/WBS.md",
  v1A1ReviewPath,
  v1A1CapabilitiesPath,
  workPackagesPath,
];
const newPaths = [
  integrationContractPath,
  planCapabilitiesPath,
  planReviewPath,
  verifierPath,
];
const exactScope = [...updatedPaths, ...newPaths];

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

function runAcceptedV1A1VerifierAtImmutableCommit() {
  const temporaryRoot = mkdtempSync(
    path.join(tmpdir(), "moon-reply-v1-a2-plan-v1-a1-"),
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
      [
        "-c",
        safeDirectory,
        "checkout",
        "--quiet",
        "-B",
        acceptedV1A1Branch,
        baseline,
      ],
      { cwd: cloneRoot, stdio: "pipe" },
    );

    const trackedPaths = git(["ls-tree", "-r", "--name-only", baseline])
      .split(/\r?\n/u)
      .filter(Boolean);
    for (const candidate of trackedPaths) {
      const sourcePath = path.join(root, candidate);
      if (!existsSync(sourcePath)) continue;
      if (worktreeBlob(candidate) !== git(["rev-parse", baseline + ":" + candidate])) {
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
      [path.join(cloneRoot, acceptedV1A1VerifierPath)],
      {
        cwd: cloneRoot,
        encoding: "utf8",
        maxBuffer: 256 * 1024 * 1024,
        stdio: ["ignore", "pipe", "pipe"],
      },
    );
    if (result.status !== 0) {
      throw new Error(
        "Accepted V1-A1 verifier failed at immutable snapshot.\nstdout:\n" +
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
const planCapabilities = readJson(planCapabilitiesPath);
const v1A1Capabilities = readJson(v1A1CapabilitiesPath);
const workPackages = readJson(workPackagesPath);
const v1A = workPackages.packages.find((entry) => entry.id === "V1-A");
const v1A1 = v1A?.subpackages.find((entry) => entry.id === "V1-A1");
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
let acceptedVerifierSummary = "not run";
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
  assert.equal(git(["rev-parse", baseline + "^"]), originalV1A1);
  assert.equal(git(["rev-parse", originalV1A1 + "^"]), architecture);
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

await check("exact planning scope is 10 paths with 6 updates and 4 new", () => {
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
  assert.equal(actual.length, 10);
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
  for (const candidate of newPaths) {
    assert.equal(gitObjectExists(baseline + ":" + candidate), false, candidate);
  }
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
  for (const candidate of [
    integrationContractPath,
    planCapabilitiesPath,
    v1A1CapabilitiesPath,
    workPackagesPath,
  ]) {
    readJson(candidate);
  }
  git(["diff", "--check", baseline, "--"]);
});

await check("accepted V1-A1 immutable verifier remains PASS 25/25", () => {
  assertBaselineBlobUnchanged(acceptedV1A1VerifierPath);
  assertBaselineBlobUnchanged(originalV1A1VerifierPath);
  const output = runAcceptedV1A1VerifierAtImmutableCommit();
  for (const pattern of [
    /materiality correction verifier: PASS 25\/25/u,
    /Original V1-A1 verifier at 65c24586: PASS 24\/24/u,
    /All upstream accepted verifiers: PASS/u,
  ]) {
    assert.match(output, pattern);
  }
  acceptedVerifierSummary = "PASS 25/25";
  upstreamSummary = "PASS";
});

await check("V1-A1 acceptance and V1-A2 planning authority are exact", () => {
  assert.equal(contract.authority.accepted_v1_a1_snapshot, baseline);
  assert.equal(contract.authority.v1_a1_status, "accepted_complete");
  assert.equal(contract.authority.v1_a1_chatgpt_review, "PASS_complete");
  assert.equal(contract.authority.v1_a1_human_review, "PASS_complete");
  assert.equal(contract.authority.v1_a1_human_acceptance, "complete");
  assert.equal(contract.authority.v1_a1_acceptance, "complete");
  assert.equal(contract.authority.acceptance_date, "2026-08-16");
  assert.equal(contract.authority.v1_a_overall_complete, false);
  assert.equal(contract.authority.v1_a2_planning_authorized, true);
  assert.equal(contract.authority.v1_a2_implementation_authorized, false);
});

await check("Base Candidate and Clarification are separate authority lanes", () => {
  assert.deepEqual(
    contract.authority_lanes.lanes.map((entry) => entry.id),
    ["base", "candidate", "clarification_evidence"],
  );
  assert.equal(contract.authority_lanes.clarification_appended_to_current_situation, false);
  assert.equal(contract.authority_lanes.clarification_inserted_into_base_source_refs, false);
  assert.equal(
    contract.authority_lanes.clarification_claims_input_current_situation_provenance,
    false,
  );
  assert.equal(contract.authority_lanes.clarification_contaminates_candidate, false);
  assert.equal(contract.clarification_evidence_contract.provenance, "user_clarification");
  assert.equal(
    contract.clarification_evidence_contract.source_identity_format,
    "clarification:<opaque_clarification_id>:answer:1",
  );
});

await check("Clarification Evidence contract is versioned complete and customer safe", () => {
  const evidence = contract.clarification_evidence_contract;
  assert.equal(evidence.contract_version, "m2-p4-clarification-evidence-v1");
  assert.equal(evidence.maximum_answers_per_assessment_request, 1);
  assert.equal(evidence.maximum_questions_per_assessment_request, 1);
  assert.equal(evidence.ordinal, 1);
  assert.deepEqual(evidence.required_fields, [
    "schemaVersion",
    "clarificationId",
    "ordinal",
    "questionCode",
    "target",
    "questionSnapshot",
    "answer",
    "provenance",
    "sourceIdentity",
    "groundedNormalizedRepresentation",
    "safetySignals",
  ]);
  assert.equal(evidence.provider_metadata_customer_visible, false);
  assert.equal(evidence.answer_is_separate_from_original_request_body, true);
  assert.equal(evidence.answer_is_separate_from_candidate, true);
});

await check("PB-01 successor adds no Provider stage and preserves Base", () => {
  const stage = contract.provider_stage_architecture;
  assert.equal(stage.new_provider_stage_added, false);
  assert.equal(stage.new_stage_id_prohibited, "PB-01F");
  assert.equal(stage.pb_01_stage_id, "PB-01");
  assert.equal(stage.stage_topology, "split-base-candidate-v1");
  assert.equal(stage.resume_run.same_assessment_request, true);
  assert.equal(stage.resume_run.base_grounding_rewritten, false);
  assert.equal(
    stage.application_composition.base_grounding,
    "reuse_immutable_initial_run_base_grounding",
  );
  assert.equal(stage.prompt_schema_catalog_successor_required, true);
  assert.equal(stage.provider_execution_authorized_by_plan, false);
});

await check("Clarification source integrity is structural and target limited", () => {
  const integrity = contract.clarification_source_integrity;
  assert.equal(integrity.allowed_output_lane, "clarification_grounding");
  assert.equal(integrity.base_field_write_allowed, false);
  assert.equal(integrity.candidate_field_write_allowed, false);
  assert.equal(integrity.unrelated_decision_field_write_allowed, false);
  assert.equal(integrity.source_namespace_collision_allowed, false);
  assert.equal(integrity.target_limited_grounding_required, true);
  assert.equal(integrity.raw_answer_literal_scan_as_provenance_proof, false);
  assert.equal(integrity.structural_provenance_validation_required, true);
});

await check("same-request lifecycle and separate persistence are fixed", () => {
  const lifecycle = contract.persistence_lifecycle;
  assert.equal(
    lifecycle.model,
    "one_assessment_request_zero_or_one_clarification_one_or_more_assessment_runs",
  );
  assert.deepEqual(lifecycle.assessment_request_states, [
    "processing",
    "awaiting_clarification",
    "completed",
    "failed",
  ]);
  assert.equal(lifecycle.preferred_storage, "separate_assessment_clarifications_table");
  assert.equal(lifecycle.raw_situation_mutated, false);
  assert.equal(lifecycle.clarification_record.maximum_rows_per_request, 1);
  assert.equal(lifecycle.clarification_record.unique_request_constraint, true);
  assert.equal(lifecycle.continuation_authority.customer_handle, "opaque_clarification_id");
  assert.equal(lifecycle.continuation_authority.raw_request_id_as_only_authority, false);
  assert.equal(lifecycle.continuation_authority.request_id_accepted_in_answer_body, false);
});

await check("answer submission is idempotent and second answer fails closed", () => {
  const duplicate = contract.persistence_lifecycle.duplicate_submit;
  assert.equal(duplicate.transactional_row_lock_required, true);
  assert.equal(
    duplicate.same_canonical_answer_after_acceptance,
    "idempotent_replay_existing_continuation_or_result",
  );
  assert.equal(duplicate.different_answer_after_acceptance, "fail_closed");
  assert.equal(duplicate.different_answer_safe_code, "M2_CLARIFICATION_ALREADY_ANSWERED");
  assert.equal(duplicate.different_answer_http_status, 409);
  assert.equal(contract.run_state_semantics.automatic_second_clarification_allowed, false);
  assert.equal(contract.run_state_semantics.clarification_loop_allowed, false);
});

await check("clarification Safety participates before paid eligibility", () => {
  const safety = contract.clarification_safety;
  assert.equal(safety.answer_safety_evaluated, true);
  assert.equal(safety.signals_preserve_clarification_source_identity, true);
  assert.equal(safety.aggregation_order, "before_paid_product_eligibility");
  assert.deepEqual(safety.aggregated_with, ["base_safety", "candidate_safety"]);
  assert.equal(safety.non_normal_result, "safety_blocked");
  assert.equal(safety.may_weaken_or_reinterpret_existing_safety, false);
});

await check("V1-A1 remains immutable with a separate V2 re-evaluation seam", () => {
  const reevaluation = contract.v1_a1_re_evaluation;
  assert.equal(reevaluation.accepted_v1_policy_file_mutated, false);
  assert.equal(reevaluation.successor, "jpy980-input-sufficiency-policy-v2");
  assert.equal(reevaluation.no_clarification_parity, "deep_equal_to_v1");
  assert.equal(reevaluation.dimension_override_scope, "selected_target_only");
  assert.equal(reevaluation.base_object_materialized_with_clarification_fields, false);
  assert.equal(reevaluation.second_question_possible, false);
  assertBaselineBlobUnchanged(
    "lib/assessment/runtime/jpy980-input-sufficiency-policy-v1.ts",
  );
});

await check("not_full_product_candidate is first class and not mislabeled", () => {
  const notFull = contract.not_full_product_candidate;
  assert.equal(notFull.first_class_future_application_state, true);
  assert.equal(notFull.normal_non_paid_routing_outcome, true);
  assert.deepEqual(notFull.must_not_be_mislabeled_as, [
    "needs_more_information",
    "technical_failure",
    "safety_blocked",
    "ready",
  ]);
  assert.deepEqual(notFull.runtime_result, {
    status: "stopped",
    eligibility: "not_full_product_candidate",
    clarification: null,
    report: null,
    draft: null,
    charge: "prohibited",
  });
  assert.equal(notFull.database.assessment_run_status, "completed");
  assert.equal(notFull.database.assessment_request_status, "completed");
});

await check("message_impact requires Candidate without using clarification budget", () => {
  const requirement =
    contract.product_scope_validation.message_impact_candidate_requirement;
  assert.equal(requirement.requested_topic, "message_impact");
  assert.equal(requirement.non_empty_candidate_required, true);
  assert.equal(requirement.server_enforced, true);
  assert.equal(requirement.safe_code, "M2_MESSAGE_IMPACT_CANDIDATE_REQUIRED");
  assert.equal(requirement.classification, "input_form_validation");
  assert.equal(requirement.clarification_budget_consumed, false);
  assert.equal(requirement.draft_message_requires_candidate, false);
  assert.equal(
    requirement.candidate_analysis_unavailable_classification,
    "technical_fail_closed_not_product_ineligibility",
  );
});

await check("actionable and supplementary topic sets are exact", () => {
  const requirement = contract.product_scope_validation.actionable_topic_requirement;
  assert.deepEqual(requirement.actionable_anchor_topics, [
    "decide_send_or_wait",
    "draft_message",
    "message_impact",
    "next_three_days",
  ]);
  assert.deepEqual(requirement.supplementary_only_topics, [
    "relationship",
    "organize_emotions",
  ]);
  assert.equal(requirement.at_least_one_actionable_anchor_required, true);
  assert.equal(requirement.safe_code, "M2_ACTIONABLE_TOPIC_REQUIRED");
  assert.equal(requirement.provider_called, false);
  assert.equal(requirement.clarification_budget_consumed, false);
  assert.equal(requirement.assessment_request_created, false);
  assert.equal(
    requirement.relationship_or_emotional_only_product,
    "out_of_current_mvp_scope_separate_future_decision",
  );
});

await check("six clarification targets have bounded provenance and grounding", () => {
  const expectedTargets = [
    "material_relationship_or_communication_concern",
    "latest_contact_timing",
    "usual_reply_cadence",
    "central_fear_or_decision_concern",
    "relationship_intent",
    "requested_message_tone",
  ];
  assert.deepEqual(
    contract.clarification_targets.map((entry) => entry.target),
    expectedTargets,
  );
  for (const target of contract.clarification_targets) {
    assert.equal(target.provenance, "user_clarification");
    assert.ok(target.allowed_answer_shape.kind.length > 0);
    assert.ok(target.may_ground.length > 0);
    assert.ok(target.must_not_ground.length > 0);
    assert.match(target.safety, /clarification_source_identity/u);
    assert.match(target.v1_a1_consumption, /only$/u);
  }
  const timing = contract.clarification_targets.find(
    (entry) => entry.target === "latest_contact_timing",
  );
  assert.equal(
    timing.derived_elapsed_authority,
    "trusted_run_started_at_plus_explicit_iana_timezone",
  );
  const cadence = contract.clarification_targets.find(
    (entry) => entry.target === "usual_reply_cadence",
  );
  assert.deepEqual(cadence.allowed_answer_shape.values, [
    "within_usual",
    "beyond_usual",
    "unknown",
  ]);
});

await check("Customer Delivery and separate answer endpoint are bounded", () => {
  const delivery = contract.customer_api_delivery;
  assert.equal(delivery.successor, "CustomerAssessmentDeliveryV2");
  assert.deepEqual(delivery.supported_eligibilities, [
    "ready",
    "needs_more_information",
    "not_full_product_candidate",
    "safety_blocked",
  ]);
  assert.deepEqual(delivery.status_by_eligibility, {
    ready: "completed",
    needs_more_information: "awaiting_clarification",
    not_full_product_candidate: "stopped",
    safety_blocked: "stopped",
  });
  assert.deepEqual(delivery.needs_more_information_fields, [
    "opaqueClarificationId",
    "questionCode",
    "target",
    "question",
    "maximumQuestionsTotal",
    "questionsAlreadyUsed",
    "questionsRemaining",
  ]);
  assert.equal(delivery.customer_exposed_internal_fact_ids, false);
  assert.equal(delivery.customer_exposed_provider_ids, false);
  assert.equal(delivery.initial_request_body_immutable, true);
  assert.equal(
    delivery.answer_endpoint,
    "POST /api/internal/assessment-clarifications/[clarificationId]/answer",
  );
  assert.equal(delivery.answer_endpoint_overloads_initial_post, false);
});

await check("all stop states remain no-charge and Payment unauthorized", () => {
  const payment = contract.payment_boundary;
  assert.equal(payment.implementation_in_plan, false);
  assert.equal(payment.charge_before_full_product_eligibility, false);
  assert.deepEqual(payment.no_charge_states, [
    "needs_more_information",
    "not_full_product_candidate",
    "safety_blocked",
  ]);
  assert.equal(payment.only_future_full_paid_ready_may_reach_payment_gate, true);
  assert.equal(payment.payment_authorized, false);
});

await check("runtime sequences stop before Product and never ask twice", () => {
  assert.deepEqual(contract.runtime_sequences.initial_submission, [
    "cheap_form_and_product_scope_server_validation",
    "persist_immutable_request",
    "base_and_candidate_processing",
    "safety_aggregation",
    "v1_a1_compatible_sufficiency_policy",
    "ready_or_persist_one_clarification_and_stop_or_not_full_stop_or_safety_stop",
  ]);
  assert.deepEqual(contract.runtime_sequences.clarification_answer, [
    "validate_opaque_clarification_authority",
    "persist_exactly_once",
    "create_second_run_on_same_request",
    "clarification_aware_pb_01_successor",
    "candidate_and_safety_processing",
    "v1_a1_compatible_re_evaluation_with_budget_exhausted",
    "ready_or_not_full_or_safety",
  ]);
  assert.equal(contract.runtime_sequences.second_clarification, "prohibited");
  assert.deepEqual(
    contract.run_state_semantics.answered_clarification.allowed_policy_states,
    ["full_paid_ready_candidate", "not_full_product_candidate", "safety_blocked"],
  );
  assert.equal(
    contract.run_state_semantics.answered_clarification.needs_one_clarifying_answer_allowed,
    false,
  );
});

await check("future A2 implementation manifest is exact 31 paths and unauthorized", () => {
  const scope = contract.future_v1_a2_implementation_scope;
  assert.equal(scope.status, "fixed_but_unauthorized_pending_plan_acceptance");
  assert.equal(scope.total, "31/31");
  assert.equal(scope.updated, 14);
  assert.equal(scope.new, 17);
  assert.equal(scope.deleted, 0);
  assert.equal(scope.renamed, 0);
  assert.equal(scope.updated_paths.length, 14);
  assert.equal(scope.new_paths.length, 17);
  assert.equal(unique([...scope.updated_paths, ...scope.new_paths]).length, 31);
  for (const candidate of scope.updated_paths) {
    assert.equal(gitObjectExists(baseline + ":" + candidate), true, candidate);
  }
  for (const candidate of scope.new_paths) {
    assert.equal(gitObjectExists(baseline + ":" + candidate), false, candidate);
  }
  assert.equal(
    scope.scope_change_rule,
    "STOP_and_obtain_new_human_review_before_implementation",
  );
});

await check("V1-A1 capabilities and work package authority are synchronized", () => {
  assert.equal(v1A1Capabilities.status, "accepted_complete");
  assert.equal(v1A1Capabilities.authority.accepted_v1_a1_r1_snapshot, baseline);
  assert.equal(v1A1Capabilities.authority.v1_a1_chatgpt_review, "PASS_complete");
  assert.equal(v1A1Capabilities.authority.v1_a1_human_review, "PASS_complete");
  assert.equal(v1A1Capabilities.implementation["V1-A1"].status, "accepted_complete");
  assert.equal(
    v1A1Capabilities.implementation["V1-A2"].authority,
    "planning_authorized_implementation_unauthorized",
  );
  assert.equal(v1A1Capabilities.implementation["V1-A2"].implementation_authorized, false);
  assert.equal(v1A1.status, "accepted_complete");
  assert.equal(v1A1.accepted_snapshot, baseline);
  assert.equal(v1A2.status, "planning_defined_pending_review");
  assert.equal(v1A2.planning_authorized, true);
  assert.equal(v1A2.implementation_authorized, false);
  assert.deepEqual(v1A2.actionable_anchor_topics, [
    "decide_send_or_wait",
    "draft_message",
    "message_impact",
    "next_three_days",
  ]);
  assert.deepEqual(v1A2.supplementary_only_topics, ["relationship", "organize_emotions"]);
  assert.deepEqual(v1A2.future_exact_implementation_scope, {
    status: "fixed_unauthorized",
    total: "31/31",
    updated: 14,
    new: 17,
    deleted: 0,
    renamed: 0,
  });
});

await check("rolling and review documents preserve closed authority", () => {
  const documents = [
    readText("docs/CODEX_HANDOFF.md"),
    readText("docs/CURRENT_FOCUS.md"),
    readText("docs/WBS.md"),
    readText(v1A1ReviewPath),
    readText(planReviewPath),
  ];
  for (const document of documents) {
    assert.match(document, /8db5c6386ed0b9b16f0d1586f47d384262cc502b/u);
    assert.match(document, /accepted_complete/u);
    assert.match(document, /planning_defined_pending/u);
    assert.match(document, /implementation_authorized(?:`|=|:)?(?:\s*)false/u);
    assert.match(document, /31\/31/u);
    assert.match(document, /remediation_required/u);
    assert.match(document, /pending_remediation/u);
    assert.match(document, /not_established/u);
    assert.match(document, /globalQ0Completion(?:`|=|:)?(?:\s*)false/u);
  }
  for (const document of documents.slice(0, 3)) {
    assert.match(document, /10\/10/u);
    assert.match(document, /6 UPDATE \+ 4 NEW/u);
  }
});

await check("all current Runtime Product API UI DB Prompt and Payment blobs are unchanged", () => {
  assert.ok(protectedRuntimePaths.length > 80);
  for (const candidate of protectedRuntimePaths) {
    assertBaselineBlobUnchanged(candidate);
  }
  assert.deepEqual(planCapabilities.current_runtime_mutation, {
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
  assert.deepEqual(planCapabilities.operations, {
    provider_calls: 0,
    db_operations: 0,
    supabase_operations: 0,
    migrations_applied: 0,
  });
});

await check("Product snapshot main and next-env remain unchanged", () => {
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

await check("plan capabilities retain exact current authority and scope", () => {
  assert.equal(planCapabilities.status, "planning_defined_pending_human_chatgpt_review");
  assert.deepEqual(planCapabilities.packages["V1-A1"], {
    name: "Deterministic Input Sufficiency Policy",
    status: "accepted_complete",
  });
  assert.equal(planCapabilities.packages["V1-A2"].implementation_authorized, false);
  assert.equal(planCapabilities.packages["V1-B"], "unauthorized");
  assert.equal(planCapabilities.packages["V1-C"], "unauthorized");
  assert.equal(planCapabilities.packages["V1-D"], "unauthorized");
  assert.equal(planCapabilities.packages.v1_a_overall_complete, false);
  assert.deepEqual(planCapabilities.current_product_authority, {
    r2_c: "remediation_required",
    experienceProductJudgment: "pending_remediation",
    jpy980RuntimeReadiness: "not_established",
    globalQ0Completion: false,
    production_runtime_authorized: false,
    payment_authorized: false,
    provider_execution_authorized: false,
    main_integration_authorized: false,
  });
  assert.deepEqual(planCapabilities.exact_planning_scope, {
    total: "10/10",
    updated: 6,
    new: 4,
    deleted: 0,
    renamed: 0,
  });
});

assert.equal(checkCount, 26);

if (failures.length > 0) {
  console.error("\n" + taskId + " integration planning verifier: FAIL");
  console.error("Failed checks: " + failures.join("; "));
  process.exit(1);
}

console.log("\n" + taskId + " integration planning verifier: PASS 26/26");
console.log("Exact planning scope: 10/10; updated 6; new 4");
console.log("Commit state: " + commitState);
console.log("Accepted V1-A1 verifier at 8db5c638: " + acceptedVerifierSummary);
console.log("All upstream accepted verifiers: " + upstreamSummary);
console.log("Authority lanes: Base / Candidate / Clarification Evidence");
console.log("Provider stage added: false; same request second run: true");
console.log("Maximum clarification answers: 1; second clarification: prohibited");
console.log("not_full_product_candidate: first-class future no-charge stop");
console.log("Future V1-A2 implementation scope: 31/31; authorization: false");
console.log("Current Runtime / API / UI / DB changes: 0 / 0 / 0 / 0");
console.log("Provider / DB / Supabase: 0 / 0 / 0");
console.log("R2-C / experienceProductJudgment: remediation_required / pending_remediation");
console.log("JPY980 Runtime readiness: not_established");
console.log("Global Q0: false");
console.log("Product snapshot changed: false");
console.log("next-env.d.ts drift: 0");
