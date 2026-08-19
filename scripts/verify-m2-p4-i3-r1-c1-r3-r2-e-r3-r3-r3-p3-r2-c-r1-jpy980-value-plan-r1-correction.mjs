import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import {
  copyFileSync,
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const root = process.cwd();
const taskId = "M2-P4-I3-R1-C1-R3-R2-E-R3-R3-R3-P3-R2-C-R1";
const baseline = "885d46db8bfbc2add4828b7205af9a9e3d6c009c";
const originalPlanningParent = "d28fdf37f3e80f28a927a9f9dcc793cdd26b92e2";
const r2BProductSnapshot = "fa956b9b1941c73f8e1767c64ab24f07fadd36c6";
const r2AAcceptance = "1229627588e3c6ccd41ea7ea32751b8b8ac79c6e";
const expectedMain = "61e33a10e195fad17e253a6b9719217e1992f273";
const expectedBranch =
  "plan/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-r2-c-r1-jpy980-value-depth-r1-correction";
const originalPlanningBranch =
  "plan/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-r2-c-r1-jpy980-value-depth";
const expectedCommitSubject =
  "docs: harden JPY980 clarification and emotional value boundaries";

const packageRoot =
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-r2-c-r1";
const findingPath = packageRoot + "/human-product-finding-v1.json";
const valueArchitecturePath =
  packageRoot + "/jpy980-value-architecture-v1.json";
const routingPath = packageRoot + "/input-sufficiency-routing-v1.json";
const semanticDepthPath = packageRoot + "/semantic-depth-contract-v1.json";
const workPackagesPath =
  packageRoot + "/implementation-work-packages-v1.json";
const capabilitiesPath = packageRoot + "/capabilities-v1.json";
const reviewDocumentPath =
  "docs/phase2/TASK_M2_P4_I3_R1_C1_R3_R2_E_R3_R3_R3_P3_R2_C_R1_JPY980_VALUE_REVIEW.md";
const originalVerifierPath =
  "scripts/verify-m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-r2-c-r1-jpy980-value-plan.mjs";
const correctionVerifierPath =
  "scripts/verify-m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-r2-c-r1-jpy980-value-plan-r1-correction.mjs";
const p1SourceContractPath =
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p1/source-contract-v1.json";

const updatedPaths = [
  "docs/CODEX_HANDOFF.md",
  "docs/CURRENT_FOCUS.md",
  "docs/WBS.md",
  reviewDocumentPath,
  valueArchitecturePath,
  routingPath,
  semanticDepthPath,
  workPackagesPath,
  capabilitiesPath,
];
const newPaths = [correctionVerifierPath];
const exactScope = [...updatedPaths, ...newPaths];

const predecessorPackageRoot =
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-r2-c";
const immutablePreparationPaths = [
  predecessorPackageRoot + "/review-matrix-v1.json",
  predecessorPackageRoot + "/human-visual-review-v1.json",
  predecessorPackageRoot + "/product-owner-review-v1.json",
  predecessorPackageRoot + "/capabilities-v1.json",
  "scripts/verify-m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-r2-c-visual-product-review.mjs",
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

function remoteHead(branchName) {
  const output = git([
    "ls-remote",
    "--heads",
    "origin",
    "refs/heads/" + branchName,
  ]);
  const rows = output.split(/\r?\n/u).filter(Boolean);
  assert.equal(rows.length, 1, branchName);
  return rows[0].split(/\s+/u)[0];
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

function runOriginalPlanningVerifier() {
  const temporaryRoot = mkdtempSync(
    path.join(tmpdir(), "moon-reply-jpy980-r1-correction-original-"),
  );
  const cloneRoot = path.join(temporaryRoot, "repo");
  try {
    execFileSync(
      "git.exe",
      ["clone", "--quiet", "--no-checkout", root, cloneRoot],
      { cwd: root, stdio: "pipe" },
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
        originalPlanningBranch,
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
    const markerTarget = path.join(
      cloneRoot,
      ".git",
      path.basename(markerPath),
    );
    assert.equal(existsSync(markerSource), true, markerPath);
    copyFileSync(markerSource, markerTarget);

    const result = spawnSync(
      process.execPath,
      [path.join(cloneRoot, originalVerifierPath)],
      {
        cwd: cloneRoot,
        encoding: "utf8",
        maxBuffer: 256 * 1024 * 1024,
        stdio: ["ignore", "pipe", "pipe"],
      },
    );
    if (result.status !== 0) {
      throw new Error(
        "Original verifier failed at 885d46db.\nstdout:\n" +
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

const checks = [];
let originalPlanningSummary = "not_run";
let commitState = "not_checked";

async function check(name, assertion) {
  try {
    await assertion();
    checks.push({ name, passed: true });
    console.log("PASS " + name);
  } catch (error) {
    checks.push({ name, passed: false });
    console.error("FAIL " + name);
    console.error(error instanceof Error ? error.stack : error);
  }
}

await check("exact branch parent direct-child authority main remote and stash", () => {
  const head = git(["rev-parse", "HEAD"]);
  assert.equal(git(["branch", "--show-current"]), expectedBranch);
  assert.equal(git(["rev-parse", baseline]), baseline);
  assert.equal(git(["rev-parse", baseline + "^"]), originalPlanningParent);
  assert.equal(git(["rev-parse", originalPlanningParent + "^"]), r2BProductSnapshot);
  assert.equal(git(["rev-parse", r2BProductSnapshot + "^"]), r2AAcceptance);
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
  assert.equal(git(["rev-parse", originalPlanningBranch]), baseline);
  assert.equal(git(["rev-parse", "origin/" + originalPlanningBranch]), baseline);
  assert.equal(remoteHead(originalPlanningBranch), baseline);
  assert.equal(git(["rev-parse", "main"]), expectedMain);
  assert.equal(git(["rev-parse", "origin/main"]), expectedMain);
  assert.equal(remoteHead("main"), expectedMain);
  const correctionRemote = optionalRemoteHead(expectedBranch);
  if (correctionRemote !== null) assert.equal(correctionRemote, head);
  assert.equal(git(["stash", "list"]), "");
});

await check("exact correction scope 10/10 with 9 UPDATE and 1 NEW", () => {
  const tracked = git([
    "diff",
    "--name-status",
    "--no-renames",
    baseline,
    "--",
  ])
    .split(/\r?\n/u)
    .filter(Boolean)
    .map((line) => {
      const [status, relativePath] = line.split("\t");
      return { status, path: relativePath.replaceAll("\\", "/") };
    });
  const trackedPaths = new Set(tracked.map((item) => item.path));
  const untracked = git(["ls-files", "--others", "--exclude-standard"])
    .split(/\r?\n/u)
    .filter(Boolean)
    .map((relativePath) => relativePath.replaceAll("\\", "/"))
    .filter((relativePath) => !trackedPaths.has(relativePath))
    .map((relativePath) => ({ status: "A", path: relativePath }));
  const actual = [...tracked, ...untracked];
  assert.equal(actual.length, 10);
  assert.deepEqual(sorted(actual.map((item) => item.path)), sorted(exactScope));
  assert.deepEqual(
    sorted(actual.filter((item) => item.status === "M").map((item) => item.path)),
    sorted(updatedPaths),
  );
  assert.deepEqual(
    sorted(actual.filter((item) => item.status === "A").map((item) => item.path)),
    sorted(newPaths),
  );
  for (const candidate of updatedPaths) {
    assert.equal(gitObjectExists(baseline + ":" + candidate), true, candidate);
  }
  for (const candidate of newPaths) {
    assert.equal(gitObjectExists(baseline + ":" + candidate), false, candidate);
  }
});

await check("strict UTF-8 JSON diff hygiene and sensitive scan", () => {
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
    assert.equal(
      source.replaceAll("\r\n", "\n").endsWith("\n\n"),
      false,
      candidate + ": blank line at EOF",
    );
    for (const pattern of secretPatterns) {
      sensitiveValues += [...source.matchAll(pattern)].length;
    }
  }
  assert.equal(sensitiveValues, 0);
  for (const candidate of [
    valueArchitecturePath,
    routingPath,
    semanticDepthPath,
    workPackagesPath,
    capabilitiesPath,
  ]) {
    readJson(candidate);
  }
  git(["diff", "--check", baseline, "--"]);
});

await check("original planning verifier remains PASS 18/18 at 885d46db", () => {
  const output = runOriginalPlanningVerifier();
  const expectedLines = [
    /JPY980 value architecture planning verifier: PASS 18\/18/u,
    /Exact planning scope: 12\/12; updated 4; new 8/u,
    /R2-C preparation verifier: PASS 17\/17/u,
    /R2-B verifier: PASS 21\/21/u,
    /R2-A acceptance verifier: PASS 14\/14/u,
    /R2-A verifier: PASS 35\/35/u,
    /Q0-A acceptance verifier: PASS 12\/12/u,
    /R1 Doctrine verifier: PASS 19\/19/u,
    /Historical Package B verifier: PASS 20\/20 exact 10\/10/u,
    /Package A R1 verifier: PASS 23\/23/u,
    /Decision Policy verifier: PASS 40\/40/u,
  ];
  for (const pattern of expectedLines) assert.match(output, pattern);
  originalPlanningSummary = "PASS 18/18";
});

await check("Human finding original verifier and preparation artifacts are unchanged", () => {
  for (const candidate of [
    findingPath,
    originalVerifierPath,
    ...immutablePreparationPaths,
  ]) {
    assertBaselineBlobUnchanged(candidate);
  }
  const finding = readJson(findingPath);
  assert.equal(finding.status, "remediation_required");
  assert.equal(finding.overall.r2_c, "remediation_required");
  assert.equal(finding.overall.experienceProductJudgment, "pending_remediation");
  assert.equal(finding.overall.jpy980RuntimeReadiness, "not_established");
  assert.equal(finding.overall.globalQ0Completion, false);
});

await check("clarification budget is one total question with no loop", () => {
  const routing = readJson(routingPath);
  assert.deepEqual(routing.clarification_budget, {
    maximum_questions_total_per_consultation_attempt: 1,
    maximum_questions_per_turn: 1,
    automatic_second_question_allowed: false,
    clarification_loop_allowed: false,
    question_must_be_consultation_specific: true,
    question_selection: "highest_information_gain",
  });
  const state = routing.states.needs_one_clarifying_answer;
  assert.equal(state.question_count_total_per_consultation_attempt, 1);
  assert.equal(state.question_count_per_turn, 1);
});

await check("clarification transitions are fail-closed and budget exhaustion routes out", () => {
  const routing = readJson(routingPath);
  const transitions = routing.state_transitions;
  assert.equal(
    transitions.initial_input_insufficient
      .clarification_budget_unused_and_one_answer_can_establish_or_reject_eligibility,
    "needs_one_clarifying_answer",
  );
  assert.deepEqual(transitions.question_unanswered, {
    state: "needs_one_clarifying_answer",
    report_allowed: false,
    generated_draft_allowed: false,
    charge_allowed: false,
  });
  assert.deepEqual(transitions.after_single_clarification_answer, {
    mandatory_functions_groundable: "full_paid_ready",
    still_insufficient_or_non_material: "not_full_product_candidate",
    safety_signal_present: "safety_blocked",
    automatic_second_question_allowed: false,
  });
  assert.equal(
    transitions.still_insufficient_after_budget_exhausted,
    "not_full_product_candidate",
  );
  assert.equal(routing.future_ux_decisions.authorized_by_this_plan, false);
  assert.equal(routing.future_ux_decisions.implementation_included_in_this_plan, false);
});

await check("grounding failure routing is state-aware without infinite needs-more loop", () => {
  const semantic = readJson(semanticDepthPath);
  assert.deepEqual(semantic.grounding_failure_routing, {
    clarification_budget_unused_and_one_answer_can_determine_materiality:
      "needs_one_clarifying_answer",
    clarification_budget_exhausted_and_mandatory_functions_not_groundable:
      "not_full_product_candidate",
    consultation_is_non_material: "not_full_product_candidate",
    safety_has_priority: "safety_blocked",
    mandatory_functions_are_groundable: "full_paid_ready_candidate",
    infinite_needs_more_information_loop_allowed: false,
  });
  const architecture = readJson(valueArchitecturePath);
  assert.equal(
    architecture.full_product_threshold.grounding_failure_routing
      .clarification_budget_exhausted_and_mandatory_functions_not_groundable,
    "not_full_product_candidate",
  );
});

await check("baseline emotional containment is mandatory and grounded", () => {
  const semantic = readJson(semanticDepthPath);
  assert.deepEqual(semantic.mandatory_ready_functions, [
    "consultation_core",
    "evidence_and_significance",
    "decision_logic",
    "action_artifact",
    "emotional_containment",
  ]);
  const emotional = semantic.value_functions.find(
    (valueFunction) => valueFunction.name === "emotional_containment",
  );
  assert.deepEqual(emotional.baseline_contract, [
    "consultation_specific",
    "grounded_in_supplied_concern",
    "acknowledges_users_actual_fear_or_tension",
    "gives_a_calm_stopping_point_for_the_present_moment",
    "does_not_promise_other_persons_feeling_reply_reconciliation_or_outcome",
    "no_generic_therapy_filler",
    "no_unsupported_certainty",
    "no_invented_inner_state",
    "no_repeated_conclusion_disguised_as_reassurance",
  ]);
  assert.equal(
    semantic.full_paid_ready_guards.logically_complete_but_emotionally_cold_report_allowed,
    false,
  );
});

await check("additional emotional depth remains conditional", () => {
  const semantic = readJson(semanticDepthPath);
  assert.ok(
    semantic.conditional_functions.includes(
      "additional_emotional_containment_depth",
    ),
  );
  assert.equal(semantic.conditional_functions.includes("emotional_containment"), false);
  const architecture = readJson(valueArchitecturePath);
  assert.ok(
    architecture.full_product_threshold.mandatory_value_functions.includes(
      "emotional_containment",
    ),
  );
  assert.equal(
    architecture.full_product_threshold
      .logically_complete_but_emotionally_cold_is_full_paid_ready,
    false,
  );
});

await check("analytical blocks require a new grounded proposition", () => {
  const semantic = readJson(semanticDepthPath);
  const analytical =
    semantic.non_repetition_contract.analytical_or_instructional_primary_blocks;
  assert.equal(analytical.each_block_adds_at_least_one_new_grounded_proposition, true);
  assert.equal(analytical.each_block_owns_a_distinct_product_function, true);
  assert.equal(analytical.prior_conclusion_rephrasing_prohibited, true);
  assert.deepEqual(analytical.examples, [
    "evidence_and_significance",
    "decision_logic",
    "alternative_tradeoff",
    "action_artifact",
    "uncertainty_boundary",
    "reassessment_trigger",
  ]);
});

await check("emotional blocks require distinct function but no new fact", () => {
  const semantic = readJson(semanticDepthPath);
  const emotional =
    semantic.non_repetition_contract.emotional_or_ritual_primary_blocks;
  assert.deepEqual(emotional.examples, [
    "openingLetter",
    "emotional_containment",
    "closingLines",
  ]);
  assert.equal(emotional.new_factual_proposition_required, false);
  assert.equal(
    emotional.distinct_consultation_specific_emotional_or_ritual_function_required,
    true,
  );
  assert.equal(emotional.selected_decision_repetition_prohibited, true);
  assert.equal(emotional.action_instruction_repetition_prohibited, true);
  assert.equal(emotional.unsupported_facts_prohibited, true);
  assert.equal(emotional.generic_filler_prohibited, true);
  assert.equal(emotional.false_certainty_prohibited, true);
  assert.equal(
    semantic.non_repetition_contract.good_emotional_example,
    "今夜の沈黙だけで、この関係の答えまで決める必要はありません。",
  );
  assert.equal(
    semantic.non_repetition_contract.bad_repetition_example,
    "今は待ちましょう。今日は待つだけで大丈夫です。",
  );
  assert.equal(semantic.non_repetition_contract.proposition_ids_are_internal_only, true);
});

await check("V1-A clarification and terminal routing contract is updated", () => {
  const work = readJson(workPackagesPath);
  const packageA = work.packages.find((item) => item.id === "V1-A");
  for (const responsibility of [
    "enforce a one-total-question clarification budget per consultation attempt",
    "route budget exhaustion to terminal not_full_product_candidate",
    "prohibit an automatic second clarification and any clarification loop",
    "prevent charge, Report, and generated draft before full eligibility",
  ]) {
    assert.ok(packageA.responsibilities.includes(responsibility), responsibility);
  }
  assert.equal(packageA.authorized, false);
});

await check("V1-B mandatory emotional value contract is updated", () => {
  const work = readJson(workPackagesPath);
  const packageB = work.packages.find((item) => item.id === "V1-B");
  for (const responsibility of [
    "mandatory baseline emotional_containment",
    "consultation-specific emotional closure",
    "no generic reassurance",
    "no conclusion repetition disguised as reassurance or closure",
  ]) {
    assert.ok(packageB.responsibilities.includes(responsibility), responsibility);
  }
  assert.equal(packageB.existing_report_fields_preferred, true);
  assert.equal(packageB.authorized, false);
});

await check("V1-C split evaluator failure contract is updated", () => {
  const work = readJson(workPackagesPath);
  const packageC = work.packages.find((item) => item.id === "V1-C");
  for (const responsibility of [
    "analytical blocks require a new grounded proposition",
    "emotional and ritual blocks require a distinct non-redundant function without requiring a new factual proposition",
    "logically complete but emotionally cold Report must fail",
    "generic reassurance mutant must fail",
    "repeated conclusion disguised as closing must fail",
  ]) {
    assert.ok(packageC.responsibilities.includes(responsibility), responsibility);
  }
  assert.equal(packageC.authorized, false);
});

await check("V1-D retains existing fixtures and adds seven correction fixtures", () => {
  const work = readJson(workPackagesPath);
  const retained = [
    "sparse_administrative_reply_needs_more_information",
    "administrative_reply_with_tone_concern_ready_candidate",
    "reply_waiting_with_usual_cadence",
    "reply_waiting_without_timeline_needs_more_information",
    "draft_request_with_relationship_intent",
    "anxiety_heavy_sparse_facts",
    "alternative_tradeoff_applicable",
    "alternative_tradeoff_not_applicable",
    "unsupported_inner_state_mutant",
    "repeated_meaning_mutant",
  ];
  const added = [
    "one_clarification_answer_becomes_ready",
    "one_clarification_answer_still_insufficient_routes_out",
    "automatic_second_clarification_prohibited",
    "logically_complete_but_emotionally_cold_mutant",
    "consultation_specific_non_propositional_closing_positive",
    "generic_reassurance_closing_mutant",
    "repeated_decision_as_closing_mutant",
  ];
  assert.deepEqual(
    work.offline_fixture_requirements.required_additional,
    [...retained, ...added],
  );
  assert.equal(work.packages.find((item) => item.id === "V1-D").authorized, false);
});

await check("authority remains closed and Human Visual remains PENDING", () => {
  const capabilities = readJson(capabilitiesPath);
  assert.equal(capabilities.task_id, taskId);
  assert.equal(capabilities.current_finding.r2_c, "remediation_required");
  assert.equal(
    capabilities.current_finding.experienceProductJudgment,
    "pending_remediation",
  );
  assert.equal(
    capabilities.current_finding.jpy980RuntimeReadiness,
    "not_established",
  );
  assert.equal(capabilities.current_finding.globalQ0Completion, false);
  assert.equal(capabilities.formal_human_visual_review_complete, false);
  assert.equal(capabilities.formal_human_visual_status, "PENDING");
  assert.equal(capabilities.r2_c_pass_declared, false);
  for (const field of [
    "implementation_authorized",
    "provider_execution_authorized",
    "production_runtime_authorized",
    "payment_implementation_authorized",
    "production_payment_authorized",
    "main_integration_authorized",
  ]) {
    assert.equal(capabilities[field], false, field);
  }
  assert.equal(capabilities.provider_calls, 0);
  assert.equal(capabilities.db_operations, 0);
  assert.equal(capabilities.supabase_operations, 0);
  assert.deepEqual(capabilities.exact_scope, {
    total: "10/10",
    updated: 9,
    new: 1,
    deleted: 0,
    renamed: 0,
  });
});

await check("rolling docs and correction review encode the corrected boundary", () => {
  const combined = [
    readText("docs/CODEX_HANDOFF.md"),
    readText("docs/CURRENT_FOCUS.md"),
    readText("docs/WBS.md"),
    readText(reviewDocumentPath),
  ].join("\n");
  for (const required of [
    expectedBranch,
    baseline,
    "one-total-question",
    "not_full_product_candidate",
    "emotional_containment",
    "additional emotional containment depth",
    "Analytical",
    "Emotional",
    "PENDING",
    "remediation_required",
    "Provider / DB / Supabase",
    "9 UPDATE + 1 NEW",
  ]) {
    assert.ok(combined.includes(required), required);
  }
  assert.match(readText(reviewDocumentPath), /Automatic second questions and clarification loops are prohibited/u);
  assert.match(readText(reviewDocumentPath), /do not need to add a new factual proposition/u);
});

await check("Product snapshot next-env and main remain unchanged", () => {
  for (const [relativePath, expectedBlob] of Object.entries(productSnapshot)) {
    assert.equal(worktreeBlob(relativePath), expectedBlob, relativePath);
    assert.equal(
      git(["rev-parse", r2BProductSnapshot + ":" + relativePath]),
      expectedBlob,
      relativePath + " at R2-B",
    );
  }
  const nextEnvPath = "next-env.d.ts";
  assert.equal(
    worktreeBlob(nextEnvPath),
    git(["rev-parse", baseline + ":" + nextEnvPath]),
    nextEnvPath,
  );
  assert.equal(git(["diff", "--numstat", baseline, "--", nextEnvPath]), "");
  assert.equal(git(["rev-parse", "main"]), expectedMain);
  assert.equal(git(["rev-parse", "origin/main"]), expectedMain);
  assert.equal(remoteHead("main"), expectedMain);
});

const failed = checks.filter((item) => !item.passed);
if (failed.length > 0) {
  console.error("\nJPY980 value architecture R1 correction verifier: FAIL");
  console.error(
    "Failed checks: " + failed.map((item) => item.name).join(", "),
  );
  process.exitCode = 1;
} else {
  console.log(
    "\nJPY980 value architecture R1 correction verifier: PASS " +
      checks.length +
      "/" +
      checks.length,
  );
  console.log("Exact correction scope: 10/10; updated 9; new 1");
  console.log("Commit state: " + commitState);
  console.log("Original planning verifier at 885d46db: " + originalPlanningSummary);
  console.log("Clarification budget: 1 total; automatic second question: prohibited");
  console.log("Mandatory emotional_containment: true");
  console.log("Human Visual: PENDING");
  console.log("R2-C / experienceProductJudgment: remediation_required / pending_remediation");
  console.log("Provider / DB / Supabase: 0 / 0 / 0");
  console.log("Product snapshot changed: false");
  console.log("JPY980 Runtime readiness: not_established");
  console.log("Global Q0: false");
  console.log("next-env.d.ts drift: 0");
}
