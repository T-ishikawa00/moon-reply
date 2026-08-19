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
const baseline = "d28fdf37f3e80f28a927a9f9dcc793cdd26b92e2";
const r2BProductSnapshot = "fa956b9b1941c73f8e1767c64ab24f07fadd36c6";
const r2AAcceptance = "1229627588e3c6ccd41ea7ea32751b8b8ac79c6e";
const expectedMain = "61e33a10e195fad17e253a6b9719217e1992f273";
const expectedBranch =
  "plan/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-r2-c-r1-jpy980-value-depth";
const expectedCommitSubject =
  "docs: define JPY980 semantic depth and input sufficiency plan";
const r2CPreparationBranch =
  "review/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-r2-c-r2-authorized-visual-product";
const r2BBranch =
  "feat/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-r2-b-r2-authorized-reassuring-note";
const r2AAcceptanceBranch =
  "chore/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-r2-a-acceptance-r2-b-authorization";

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
const verifierPath =
  "scripts/verify-m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-r2-c-r1-jpy980-value-plan.mjs";
const predecessorReviewDocumentPath =
  "docs/phase2/TASK_M2_P4_I3_R1_C1_R3_R2_E_R3_R3_R3_P3_R2_C_REVIEW.md";
const r2CVerifierPath =
  "scripts/verify-m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-r2-c-visual-product-review.mjs";
const r2BVerifierPath =
  "scripts/verify-m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-r2-b-reassuring-note.mjs";
const p1SourceContractPath =
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p1/source-contract-v1.json";

const updatedPaths = [
  "docs/CODEX_HANDOFF.md",
  "docs/CURRENT_FOCUS.md",
  "docs/WBS.md",
  predecessorReviewDocumentPath,
];
const newPaths = [
  findingPath,
  valueArchitecturePath,
  routingPath,
  semanticDepthPath,
  workPackagesPath,
  capabilitiesPath,
  reviewDocumentPath,
  verifierPath,
];
const exactScope = [...updatedPaths, ...newPaths];

const predecessorPackageRoot =
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-r2-c";
const immutablePreparationPaths = [
  predecessorPackageRoot + "/review-matrix-v1.json",
  predecessorPackageRoot + "/human-visual-review-v1.json",
  predecessorPackageRoot + "/product-owner-review-v1.json",
  predecessorPackageRoot + "/capabilities-v1.json",
  r2CVerifierPath,
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

function runVerifierAtAuthority(prefix, branchName, commit, scriptPath) {
  const temporaryRoot = mkdtempSync(path.join(tmpdir(), prefix));
  const cloneRoot = path.join(temporaryRoot, "repo");
  try {
    execFileSync(
      "git.exe",
      ["clone", "--quiet", "--no-checkout", root, cloneRoot],
      { cwd: root, stdio: "pipe" },
    );
    const safeDirectory =
      "safe.directory=" + cloneRoot.replaceAll("\\", "/");
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
        branchName,
        commit,
      ],
      { cwd: cloneRoot, stdio: "pipe" },
    );

    const trackedPaths = git(["ls-tree", "-r", "--name-only", commit])
      .split(/\r?\n/u)
      .filter(Boolean);
    for (const candidate of trackedPaths) {
      const sourcePath = path.join(root, candidate);
      if (!existsSync(sourcePath)) continue;
      if (worktreeBlob(candidate) !== git(["rev-parse", commit + ":" + candidate])) {
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

    execFileSync(
      "git.exe",
      ["-c", safeDirectory, "config", "core.autocrlf", "true"],
      { cwd: cloneRoot, stdio: "pipe" },
    );
    const result = spawnSync(
      process.execPath,
      [path.join(cloneRoot, scriptPath)],
      {
        cwd: cloneRoot,
        encoding: "utf8",
        maxBuffer: 256 * 1024 * 1024,
        stdio: ["ignore", "pipe", "pipe"],
      },
    );
    if (result.status !== 0) {
      throw new Error(
        "Verifier failed at immutable authority.\nstdout:\n" +
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

let r2CVerifierSummary = "not_run";
let r2BVerifierSummary = "not_run";
let r2AAcceptanceSummary = "not_run";
let r2ASummary = "not_run";
let q0AAcceptanceSummary = "not_run";
let doctrineSummary = "not_run";
let historicalPackageBSummary = "not_run";
let packageAR1Summary = "not_run";
let decisionPolicySummary = "not_run";

const checks = [];

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

await check("exact branch parent authorities main remote and stash", () => {
  const head = git(["rev-parse", "HEAD"]);
  assert.equal(git(["branch", "--show-current"]), expectedBranch);
  assert.equal(git(["rev-parse", baseline]), baseline);
  assert.equal(git(["rev-parse", baseline + "^"]), r2BProductSnapshot);
  assert.equal(git(["rev-parse", r2BProductSnapshot + "^"]), r2AAcceptance);
  assert.equal(git(["merge-base", head, baseline]), baseline);
  const commitCount = Number(git(["rev-list", "--count", baseline + ".." + head]));
  assert.ok(commitCount === 0 || commitCount === 1, String(commitCount));
  if (commitCount === 1) {
    assert.equal(git(["rev-parse", head + "^"]), baseline);
    assert.equal(git(["show", "-s", "--format=%s", head]), expectedCommitSubject);
  }
  for (const [branchName, commit] of [
    [r2CPreparationBranch, baseline],
    [r2BBranch, r2BProductSnapshot],
    [r2AAcceptanceBranch, r2AAcceptance],
  ]) {
    assert.equal(git(["rev-parse", branchName]), commit, branchName);
    assert.equal(git(["rev-parse", "origin/" + branchName]), commit, branchName);
    assert.equal(remoteHead(branchName), commit, branchName);
  }
  assert.equal(git(["rev-parse", "main"]), expectedMain);
  assert.equal(git(["rev-parse", "origin/main"]), expectedMain);
  assert.equal(remoteHead("main"), expectedMain);
  assert.equal(git(["stash", "list"]), "");
});

await check("exact planning scope 12/12 with 4 UPDATE and 8 NEW", () => {
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
  assert.equal(actual.length, 12);
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
    findingPath,
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

await check("R2-C preparation verifier remains PASS 17/17", () => {
  const output = runVerifierAtAuthority(
    "moon-reply-r2-c-r1-preparation-",
    r2CPreparationBranch,
    baseline,
    r2CVerifierPath,
  );
  assert.match(
    output,
    /Authorized R2-C visual product review preparation verifier: PASS 17\/17/u,
  );
  assert.match(output, /Exact R2-C scope: 6\/6; new 6; updated 0/u);
  assert.match(output, /Human Visual \/ Product verdict: PENDING \/ PENDING/u);
  r2CVerifierSummary = "PASS 17/17";
});

await check("R2-B and every upstream accepted verifier remain PASS", () => {
  const output = runVerifierAtAuthority(
    "moon-reply-r2-c-r1-r2-b-",
    r2BBranch,
    r2BProductSnapshot,
    r2BVerifierPath,
  );
  const expected = [
    [
      /Authorized reassuring customer note verifier: PASS 21\/21/u,
      "PASS 21/21",
    ],
    [
      /R2-A acceptance \/ R2-B authorization verifier: PASS 14\/14/u,
      "PASS 14/14",
    ],
    [/R2-A dedicated verifier: PASS 35\/35/u, "PASS 35/35"],
    [/Q0-A acceptance verifier: PASS 12\/12/u, "PASS 12/12"],
    [/R1 Doctrine verifier: PASS 19\/19/u, "PASS 19/19"],
    [
      /Package B historical accepted verifier: PASS 20\/20 exact 10\/10/u,
      "PASS 20/20 exact 10/10",
    ],
    [/Package A R1 accepted verifier: PASS 23\/23/u, "PASS 23/23"],
    [/Decision Policy verifier: PASS 40\/40/u, "PASS 40/40"],
  ];
  for (const [pattern] of expected) assert.match(output, pattern);
  r2BVerifierSummary = expected[0][1];
  r2AAcceptanceSummary = expected[1][1];
  r2ASummary = expected[2][1];
  q0AAcceptanceSummary = expected[3][1];
  doctrineSummary = expected[4][1];
  historicalPackageBSummary = expected[5][1];
  packageAR1Summary = expected[6][1];
  decisionPolicySummary = expected[7][1];
});

await check("current Human ChatGPT finding and remediation are exact", () => {
  const finding = readJson(findingPath);
  assert.equal(finding.task_id, taskId);
  assert.equal(finding.status, "remediation_required");
  assert.equal(finding.planning_only, true);
  assert.deepEqual(finding.accepted_directions, {
    visual_direction: "accepted",
    customer_note_architecture: "accepted",
    draft_utility: "accepted",
    overall_content_direction: "accepted",
  });
  assert.equal(finding.remediation_findings.semantic_depth, "remediation_required");
  assert.equal(
    finding.remediation_findings.input_sufficiency_handling,
    "remediation_required",
  );
  assert.deepEqual(finding.overall, {
    r2_c: "remediation_required",
    r2_c_pass_declared: false,
    experienceProductJudgment: "pending_remediation",
    jpy980RuntimeReadiness: "not_established",
    globalQ0Completion: false,
  });
});

await check("formal Human Visual items remain PENDING without PASS", () => {
  const finding = readJson(findingPath);
  const historicalHuman = readJson(
    predecessorPackageRoot + "/human-visual-review-v1.json",
  );
  const historicalProduct = readJson(
    predecessorPackageRoot + "/product-owner-review-v1.json",
  );
  assert.deepEqual(finding.formal_human_visual_review, {
    status: "PENDING",
    review_complete: false,
    pending_items_preserved: true,
    pass_declared: false,
    directional_visual_acceptance_does_not_complete_the_formal_checklist: true,
  });
  assert.equal(historicalHuman.status, "PENDING");
  assert.equal(historicalHuman.review_complete, false);
  assert.equal(historicalHuman.disposition, "PENDING");
  assert.equal(historicalProduct.status, "PENDING");
  assert.equal(historicalProduct.review_complete, false);
  assert.equal(historicalProduct.overall.experienceProductJudgment, "pending");
});

await check("JPY980 value architecture rejects padding and requires new value", () => {
  const architecture = readJson(valueArchitecturePath);
  assert.deepEqual(
    sorted(architecture.product_principle.jpy980_value_is_not_established_by),
    sorted([
      "word_count",
      "fixed_section_count",
      "repeated_reassurance",
      "repeated_conclusion",
      "generic_aftercare",
      "decorative_detail",
      "unsupported_insight",
    ]),
  );
  assert.equal(architecture.product_principle.no_fixed_word_minimum, true);
  assert.equal(architecture.product_principle.no_fixed_section_minimum, true);
  assert.equal(
    architecture.product_principle.section_count_padding_prohibited,
    true,
  );
  assert.equal(
    architecture.primary_block_contract.new_proposition_minimum,
    1,
  );
  assert.equal(
    architecture.primary_block_contract
      .new_proposition_must_not_have_been_delivered_by_a_prior_primary_block,
    true,
  );
  assert.equal(
    architecture.full_product_threshold.failure_route_when_not_groundable,
    "needs_more_information",
  );
});

await check("Input Sufficiency Gate states and no-charge rules are exact", () => {
  const routing = readJson(routingPath);
  assert.deepEqual(routing.priority_order, [
    "safety",
    "input_sufficiency",
    "full_jpy980_product_eligibility",
  ]);
  assert.equal(
    routing.existing_runtime_reuse.existing_result_family,
    "eligibility=needs_more_information",
  );
  assert.equal(
    routing.existing_runtime_reuse
      .preferred_when_full_product_cannot_yet_be_grounded,
    true,
  );
  assert.deepEqual(sorted(Object.keys(routing.states)), sorted([
    "full_paid_ready",
    "needs_one_clarifying_answer",
    "not_full_product_candidate",
    "safety_blocked",
  ]));
  const clarification = routing.states.needs_one_clarifying_answer;
  assert.equal(clarification.question_count_per_turn, 1);
  assert.equal(clarification.question_selection, "highest_information_gain");
  assert.equal(clarification.question_must_be_consultation_specific, true);
  assert.equal(clarification.generic_multi_question_questionnaire_prohibited, true);
  assert.equal(clarification.report_allowed, false);
  assert.equal(clarification.generated_draft_allowed, false);
  assert.equal(clarification.payment_capable_state_allowed, false);
  assert.equal(routing.states.not_full_product_candidate.charge_allowed, false);
  assert.equal(routing.states.safety_blocked.priority_over_all_other_states, true);
});

await check("all required case routes are consultation-specific", () => {
  const routing = readJson(routingPath);
  assert.deepEqual(
    routing.case_routes.map((item) => item.case_id),
    [
      "simple_business_reply_with_draft",
      "nullable_optional_sections",
      "ordinary_reply_waiting",
      "polite_thank_you_with_draft",
      "kansai_persona_draft",
    ],
  );
  const simple = routing.case_routes[0];
  assert.equal(simple.not_automatically_full_paid_ready, true);
  assert.deepEqual(simple.materiality_needed, [
    "tone",
    "distance",
    "affection",
    "pressure",
    "relationship_impact",
  ]);
  assert.equal(routing.case_routes[1].full_paid_ready_in_current_sparse_form, false);
  assert.deepEqual(routing.case_routes[2].required_sufficiency, [
    "timing",
    "last_contact",
    "usual_cadence",
    "users_central_fear",
  ]);
  assert.equal(
    routing.case_routes[2].missing_timeline_route,
    "needs_one_clarifying_answer",
  );
  for (const item of routing.case_routes.slice(3)) {
    assert.deepEqual(item.required_sufficiency, [
      "requested_tone",
      "relationship_intent",
    ]);
  }
});

await check("Semantic Depth value functions and Ready threshold are exact", () => {
  const contract = readJson(semanticDepthPath);
  assert.deepEqual(
    contract.value_functions.map((item) => item.name),
    [
      "consultation_core",
      "evidence_and_significance",
      "decision_logic",
      "alternative_tradeoff",
      "action_artifact",
      "uncertainty_boundary",
      "reassessment_trigger",
      "emotional_containment",
    ],
  );
  assert.deepEqual(contract.mandatory_ready_functions, [
    "consultation_core",
    "evidence_and_significance",
    "decision_logic",
    "action_artifact",
  ]);
  assert.deepEqual(contract.mandatory_boundary_rule.at_least_one_required, [
    "uncertainty_boundary",
    "reassessment_trigger",
  ]);
  assert.deepEqual(contract.conditional_functions, [
    "alternative_tradeoff",
    "draft",
    "message_impact",
    "emotional_containment_depth",
  ]);
  assert.equal(contract.grounding_failure_route, "needs_more_information");
});

await check("grounding boundary blocks fabricated causality and inner state", () => {
  const boundary = readJson(semanticDepthPath).grounding_boundary;
  assert.deepEqual(boundary.prohibited_examples, [
    "相手は忙しいから返信していない",
    "相手はあなたを嫌っていない",
    "相手は慎重になっている",
  ]);
  assert.equal(boundary.prohibited_unless_directly_supported_by_base_facts, true);
  assert.deepEqual(boundary.fabrication_prohibited, [
    "causality",
    "chronology",
    "inner_state",
    "future_reply",
    "relationship_outcome",
  ]);
  assert.equal(
    boundary.allowed_examples_require_corresponding_supplied_evidence,
    true,
  );
  assert.ok(boundary.allowed_examples.includes("返信がない理由は現在分からない"));
  assert.ok(
    boundary.allowed_examples.includes(
      "therefore current recommendation is to wait",
    ),
  );
});

await check("non-repetition ownership and Human review boundary are exact", () => {
  const contract = readJson(semanticDepthPath).non_repetition_contract;
  assert.equal(
    contract
      .each_visible_primary_paragraph_or_list_group_owns_a_distinct_product_function,
    true,
  );
  assert.equal(contract.each_primary_block_adds_at_least_one_new_proposition, true);
  assert.deepEqual(contract.primary_locations, [
    "openingLetter",
    "primaryReason",
    "situationReading",
    "actionRationales",
    "closingLines",
  ]);
  assert.deepEqual(contract.deterministic_checks, [
    "exact_normalized_duplicate",
    "source_field_reused_in_multiple_primary_locations",
    "repeated_proposition_id",
  ]);
  assert.equal(
    contract.semantic_repetition_not_deterministically_provable,
    "human_product_review_required",
  );
  assert.equal(contract.proposition_ids_are_internal_only, true);
});

await check("future packages are pairwise separated and unauthorized", () => {
  const work = readJson(workPackagesPath);
  assert.deepEqual(work.sequence, ["V1-A", "V1-B", "V1-C", "V1-D"]);
  assert.deepEqual(
    work.packages.map((item) => item.id),
    work.sequence,
  );
  assert.equal(new Set(work.packages.map((item) => item.owner_domain)).size, 4);
  assert.equal(work.packages.every((item) => item.authorized === false), true);
  assert.equal(work.packages[1].existing_report_fields_preferred, true);
  assert.match(work.packages[1].schema_change_policy, /separately reviewed/u);
  const pairKeys = work.pairwise_separation.map((item) =>
    sorted(item.pair).join("|"),
  );
  assert.deepEqual(sorted(pairKeys), sorted([
    "V1-A|V1-B",
    "V1-A|V1-C",
    "V1-A|V1-D",
    "V1-B|V1-C",
    "V1-B|V1-D",
    "V1-C|V1-D",
  ]));
  assert.equal(work.provider_execution_authorized, false);
});

await check("fixtures re-review ceiling and optional follow-up are bounded", () => {
  const work = readJson(workPackagesPath);
  assert.equal(work.offline_fixture_requirements.current_five.length, 5);
  assert.equal(work.offline_fixture_requirements.required_additional.length, 10);
  for (const fixture of [
    "sparse_administrative_reply_needs_more_information",
    "reply_waiting_without_timeline_needs_more_information",
    "unsupported_inner_state_mutant",
    "repeated_meaning_mutant",
  ]) {
    assert.ok(
      work.offline_fixture_requirements.required_additional.includes(fixture),
      fixture,
    );
  }
  assert.deepEqual(work.future_product_re_review_acceptance, [
    "no_paid_ready_sparse_case",
    "no_padding",
    "no_repeated_conclusion_across_multiple_sections",
    "at_least_one_clear_evidence_to_decision_chain",
    "action_is_usable",
    "uncertainty_is_honest",
    "emotional_case_feels_personally_understood",
    "simple_case_is_genuinely_valuable_or_routed_out",
    "polite_and_persona_drafts_retain_exact_text",
    "r2_b_visual_shell_remains_intact",
  ]);
  assert.deepEqual(work.optional_future_candidate, {
    feature: "one_post_delivery_follow_up_question_under_same_purchase",
    status: "decision_pending",
    authorized: false,
    included_in_mvp_plan: false,
    requires_separate_human_approval: true,
  });
  const ceiling = readJson(capabilitiesPath).maximum_future_r2_c_meaning;
  assert.equal(ceiling.experienceProductJudgment, "plausibly_worth_jpy980");
  assert.equal(ceiling.does_not_establish_jpy980RuntimeReadiness, true);
  assert.equal(ceiling.does_not_complete_globalQ0, true);
});

await check("capabilities keep every implementation and authority closed", () => {
  const capabilities = readJson(capabilitiesPath);
  assert.equal(capabilities.task_id, taskId);
  assert.equal(capabilities.planning_only, true);
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
  assert.equal(capabilities.formal_human_visual_status, "PENDING");
  assert.equal(capabilities.r2_c_pass_declared, false);
  for (const key of [
    "implementation_authorized",
    "product_implementation_changed",
    "ui_css_changed",
    "prompt_changed",
    "catalog_changed",
    "schema_changed",
    "evaluator_changed",
    "runtime_changed",
    "payment_changed",
    "migration_changed",
    "product_snapshot_changed",
    "main_changed",
    "provider_execution_authorized",
    "production_runtime_authorized",
    "payment_implementation_authorized",
    "production_payment_authorized",
    "main_integration_authorized",
    "pull_request_created",
    "merge_used",
    "rebase_used",
    "cherry_pick_used",
    "force_push_used",
  ]) {
    assert.equal(capabilities[key], false, key);
  }
  assert.equal(capabilities.provider_calls, 0);
  assert.equal(capabilities.db_operations, 0);
  assert.equal(capabilities.supabase_operations, 0);
  assert.deepEqual(capabilities.exact_scope, {
    total: "12/12",
    updated: 4,
    new: 8,
    deleted: 0,
    renamed: 0,
  });
  assert.deepEqual(capabilities.validation, {
    planning_verifier: "PASS 18/18",
    r2_c_preparation_verifier: "PASS 17/17",
    r2_b_verifier: "PASS 21/21",
    r2_a_acceptance_verifier: "PASS 14/14",
    r2_a_verifier: "PASS 35/35",
    q0_a_acceptance_verifier: "PASS 12/12",
    r1_doctrine_verifier: "PASS 19/19",
    historical_package_b_verifier: "PASS 20/20 exact 10/10",
    package_a_r1_verifier: "PASS 23/23",
    decision_policy_verifier: "PASS 40/40",
    typecheck: "PASS",
    lint_max_warnings_0: "PASS",
    build: "PASS",
    git_diff_check: "PASS",
    sensitive_values: 0,
    next_env_drift: 0,
  });
});

await check("rolling and review documents record the current boundary", () => {
  for (const relativePath of [
    "docs/CODEX_HANDOFF.md",
    "docs/CURRENT_FOCUS.md",
    "docs/WBS.md",
  ]) {
    const source = readText(relativePath);
    assert.equal(
      source.split(
        "M2-P4-I3-R1-C1-R3-R2-E-R3-R3-R3-P3-R2-C-R1:BEGIN",
      ).length - 1,
      1,
      relativePath,
    );
    for (const phrase of [
      baseline,
      "remediation_required",
      "pending_remediation",
      "needs_more_information",
      "V1-A",
      "V1-D",
      "Provider / DB / Supabase",
    ]) {
      assert.ok(source.includes(phrase), relativePath + ": " + phrase);
    }
  }
  const predecessor = readText(predecessorReviewDocumentPath);
  for (const phrase of [
    "Current R2-C finding",
    "This is not an R2-C PASS",
    "Semantic depth: remediation_required",
    "Input sufficiency handling: remediation_required",
    "Formal Human Visual review: PENDING / incomplete",
  ]) {
    assert.ok(predecessor.includes(phrase), phrase);
  }
  const review = readText(reviewDocumentPath);
  for (const phrase of [
    expectedBranch,
    baseline,
    r2BProductSnapshot,
    r2AAcceptance,
    expectedMain,
    "This is not an R2-C PASS",
    "full_paid_ready",
    "needs_one_clarifying_answer",
    "not_full_product_candidate",
    "safety_blocked",
    "consultation_core",
    "evidence_and_significance",
    "decision_logic",
    "action_artifact",
    "Provider / DB / Supabase: 0 / 0 / 0",
    "4 UPDATE + 8 NEW",
    "DELETE / RENAME = 0",
    "plausibly_worth_jpy980",
  ]) {
    assert.ok(review.includes(phrase), phrase);
  }
});

await check("Product snapshot preparation artifacts and next-env remain unchanged", () => {
  const matrix = readJson(
    predecessorPackageRoot + "/review-matrix-v1.json",
  );
  assert.deepEqual(
    Object.fromEntries(
      matrix.immutable_product_snapshot.map((item) => [item.path, item.git_blob]),
    ),
    productSnapshot,
  );
  for (const [relativePath, blob] of Object.entries(productSnapshot)) {
    assert.equal(worktreeBlob(relativePath), blob, relativePath);
    assert.equal(git(["rev-parse", baseline + ":" + relativePath]), blob);
  }
  for (const relativePath of immutablePreparationPaths) {
    assertBaselineBlobUnchanged(relativePath);
  }
  assertBaselineBlobUnchanged("next-env.d.ts");
  assert.equal(
    git([
      "diff",
      "--name-only",
      baseline,
      "--",
      "app",
      "components",
      "lib",
      "package.json",
      "next-env.d.ts",
    ]),
    "",
  );
  assert.equal(git(["rev-parse", "main"]), expectedMain);
  assert.equal(git(["rev-parse", "origin/main"]), expectedMain);
  assert.equal(remoteHead("main"), expectedMain);
});

const failed = checks.filter((result) => !result.passed);
console.log("");
console.log(
  "JPY980 value architecture planning verifier: " +
    (failed.length === 0 ? "PASS" : "FAIL") +
    " " +
    (checks.length - failed.length) +
    "/" +
    checks.length,
);
console.log("Exact planning scope: 12/12; updated 4; new 8");
console.log("R2-C preparation verifier: " + r2CVerifierSummary);
console.log("R2-B verifier: " + r2BVerifierSummary);
console.log("R2-A acceptance verifier: " + r2AAcceptanceSummary);
console.log("R2-A verifier: " + r2ASummary);
console.log("Q0-A acceptance verifier: " + q0AAcceptanceSummary);
console.log("R1 Doctrine verifier: " + doctrineSummary);
console.log("Historical Package B verifier: " + historicalPackageBSummary);
console.log("Package A R1 verifier: " + packageAR1Summary);
console.log("Decision Policy verifier: " + decisionPolicySummary);
console.log("Human Visual: PENDING");
console.log("R2-C / experienceProductJudgment: remediation_required / pending_remediation");
console.log("Provider / DB / Supabase: 0 / 0 / 0");
console.log("Product snapshot changed: false");
console.log("JPY980 Runtime readiness: not_established");
console.log("Global Q0: false");
console.log("next-env.d.ts drift: 0");
if (failed.length > 0) {
  console.error(
    "Failed checks: " + failed.map((item) => item.name).join("; "),
  );
  process.exitCode = 1;
}
