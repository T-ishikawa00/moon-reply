import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const taskId = "M2-P4-I3-R1-C1-R3-R2-E-R3-R3-R3-P6-P0-R1";
const baseline = "30e762e1f3d17f2a007b7f7f92d3ba91e01b861e";
const expectedParent = "1196e7d581e1e7d2b1f200eaa92de2477999f5bd";
const expectedMain = "61e33a10e195fad17e253a6b9719217e1992f273";
const expectedSourceBranch =
  "plan/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p6-p0-prepayment-safety-charter";
const expectedBranch =
  "fix/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p6-p0-r1-safety-intent-separation";
const packageRoot =
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p6-p0";

const policyPath = `${packageRoot}/product-policy-v1.md`;
const matrixPath = `${packageRoot}/decision-matrix-v1.json`;
const questionFlowPath = `${packageRoot}/question-flow-v1.json`;
const stopCopyPath = `${packageRoot}/stop-copy-v1.json`;
const stateMachinePath = `${packageRoot}/purchase-state-machine-v1.json`;
const capabilitiesPath = `${packageRoot}/capabilities-v1.json`;
const verifierPath =
  "scripts/verify-m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p6-p0-prepayment-safety-charter.mjs";
const reviewPath =
  "docs/phase2/TASK_M2_P4_I3_R1_C1_R3_R2_E_R3_R3_R3_P6_P0_REVIEW.md";

const exactScope = [
  policyPath,
  matrixPath,
  questionFlowPath,
  stopCopyPath,
  stateMachinePath,
  capabilitiesPath,
  verifierPath,
  reviewPath,
];

const jsonPaths = [
  matrixPath,
  questionFlowPath,
  stopCopyPath,
  stateMachinePath,
  capabilitiesPath,
];

const protectedPackageDPaths = [
  "docs/phase2/TASK_M2_P4_I3_R1_C1_R3_R2_E_R3_R3_R3_P5_REVIEW.md",
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p5/capabilities-v1.json",
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p5/offline-results-v1.json",
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p5/remediation-contract-v1.json",
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p5/remediation-fixtures-v1.json",
  "lib/assessment/runtime/semantic-disposition-v5.ts",
  "scripts/verify-m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p5-evaluator-disposition.mjs",
  "lib/assessment/runtime/contracts/pb-05-directional-report-v4.developer.md",
  "lib/assessment/runtime/report-grounding-v4.ts",
  "lib/assessment/runtime/contracts/pb-06-materiality-validator-v3.developer.md",
  "lib/assessment/runtime/semantic-disposition-v4.ts",
  "lib/assessment/runtime/contracts/runtime-stage-catalog-v11.json",
  "scripts/lib/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-evaluator-v1.mjs",
  "lib/assessment/runtime/contracts/pb-06-materiality-validator-v4.developer.md",
  "lib/assessment/runtime/contracts/runtime-stage-catalog-v12.json",
  "scripts/lib/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-evaluator-v2.mjs",
  "lib/assessment/runtime/schema-catalog.ts",
  "lib/assessment/runtime/pipeline.ts",
  "lib/assessment/runtime/service.ts",
  "lib/assessment/runtime/contracts/runtime-stage-catalog-v4.json",
  "ai/schemas/validation-result.schema.json",
  "lib/assessment/runtime/contracts/report-content-v2.schema.json",
  "lib/assessment/runtime/contracts/decision-plan-v2.schema.json",
];

const contactBoundaryStates = [
  "no_restriction_known",
  "temporary_pause",
  "explicit_no_contact",
  "channel_restricted",
  "relationship_closed",
  "business_only",
  "new_inbound_after_boundary",
  "unknown",
  "urgent_safety",
];

const requestedAssistanceGoals = [
  "understand_and_organize",
  "decide_send_wait_or_pause",
  "draft_within_current_permission",
  "recontact_or_overcome_boundary",
  "alternate_channel_or_third_party",
  "monitor_track_or_manipulate",
  "professional_judgment",
  "urgent_safety_help",
];

const safetyDispositions = [
  "eligible",
  "needs_clarification",
  "blocked_unsafe_assistance",
  "urgent_safety_redirect",
  "unsupported_professional_request",
];

const eligibleDeliveryScopes = [
  "general",
  "pause_assessment",
  "boundary_support_only",
  "scoped_reply",
  "business_only",
];

const derivedClassifications = [
  "eligible_general",
  "eligible_pause_assessment",
  "eligible_boundary_support_only",
  "eligible_scoped_reply",
  "eligible_business_only",
  "needs_clarification",
  "blocked_unsafe_assistance",
  "urgent_safety_redirect",
  "unsupported_professional_request",
];

const eligibleStates = derivedClassifications.slice(0, 5);

const serverStates = [
  "unassessed",
  "collecting_safety_answers",
  "needs_clarification",
  "eligible_general",
  "eligible_pause_assessment",
  "eligible_boundary_support_only",
  "eligible_scoped_reply",
  "eligible_business_only",
  "blocked_unsafe_assistance",
  "urgent_safety_redirect",
  "unsupported_professional_request",
  "purchase_available",
  "payment_pending",
  "payment_completed",
];

const boundEligibilityFields = [
  "normalized_request_text",
  "normalized_candidate_text_or_null",
  "authoritative_requested_topics",
  "contact_boundary_state",
  "requested_assistance_goal",
  "all_clarification_answers",
  "applicable_delivery_scope_acknowledgement",
  "attestation_confirmed",
  "safety_policy_version",
];

function absolute(relativePath) {
  return path.join(root, ...relativePath.split("/"));
}

function normalizePath(value) {
  return value.replaceAll("\\", "/");
}

function sorted(values) {
  return [...values].sort((left, right) => left.localeCompare(right));
}

function git(args, options = {}) {
  return execFileSync(
    "git.exe",
    ["-c", "safe.directory=C:/projects/moon-reply", ...args],
    {
      cwd: root,
      encoding: "utf8",
      maxBuffer: 32 * 1024 * 1024,
      ...options,
    },
  ).trim();
}

function gitResult(args) {
  return spawnSync(
    "git.exe",
    ["-c", "safe.directory=C:/projects/moon-reply", ...args],
    { cwd: root, encoding: "utf8" },
  );
}

function gitObjectExists(revisionPath) {
  return gitResult(["cat-file", "-e", revisionPath]).status === 0;
}

function bytes(relativePath) {
  return readFileSync(absolute(relativePath));
}

function text(relativePath) {
  return new TextDecoder("utf-8", { fatal: true }).decode(bytes(relativePath));
}

function json(relativePath) {
  return JSON.parse(text(relativePath));
}

function changedEntriesSinceBaseline() {
  return git(["diff", "--name-status", baseline, "--"])
    .split(/\r?\n/u)
    .filter(Boolean)
    .map((entry) => {
      const [status, candidate] = entry.split("\t");
      return { status, path: normalizePath(candidate) };
    });
}

function changedPathsSinceBaseline() {
  const tracked = changedEntriesSinceBaseline().map((entry) => entry.path);
  const untracked = git(["ls-files", "--others", "--exclude-standard"])
    .split(/\r?\n/u)
    .filter(Boolean)
    .map(normalizePath);
  return sorted(new Set([...tracked, ...untracked]));
}

function assertUnchangedFromBaseline(relativePath) {
  assert.equal(
    git(["hash-object", relativePath]),
    git(["rev-parse", `${baseline}:${relativePath}`]),
    relativePath,
  );
}

function byCaseId(matrix) {
  return new Map(matrix.cases.map((item) => [item.case_id, item]));
}

const checks = [];

async function check(name, assertion) {
  try {
    await assertion();
    checks.push({ name, passed: true });
    console.log(`PASS ${name}`);
  } catch (error) {
    checks.push({ name, passed: false });
    console.error(`FAIL ${name}`);
    console.error(error instanceof Error ? error.stack : error);
  }
}

await check("exact branch baseline parent upstream main and empty stash authority", () => {
  const head = git(["rev-parse", "HEAD"]);
  assert.equal(git(["branch", "--show-current"]), expectedBranch);
  assert.equal(git(["rev-parse", `${baseline}^`]), expectedParent);
  assert.equal(git(["rev-parse", expectedSourceBranch]), baseline);
  assert.equal(git(["rev-parse", `origin/${expectedSourceBranch}`]), baseline);
  assert.equal(git(["merge-base", head, baseline]), baseline);
  const commitsAfterBaseline = Number(
    git(["rev-list", "--count", `${baseline}..${head}`]),
  );
  assert.ok(commitsAfterBaseline === 0 || commitsAfterBaseline === 1);
  if (commitsAfterBaseline === 1) {
    assert.equal(git(["rev-parse", `${head}^`]), baseline);
  }
  const upstream = gitResult(["rev-parse", "@{u}"]);
  if (upstream.status === 0) assert.equal(upstream.stdout.trim(), head);
  assert.equal(git(["rev-parse", "main"]), expectedMain);
  assert.equal(git(["rev-parse", "origin/main"]), expectedMain);
  assert.equal(git(["stash", "list"]), "");
});

await check("exact scope 8/8 existing files updated only", () => {
  assert.equal(exactScope.length, 8);
  assert.deepEqual(changedPathsSinceBaseline(), sorted(exactScope));
  const entries = changedEntriesSinceBaseline();
  assert.equal(entries.length, 8);
  assert.deepEqual(sorted(entries.map((entry) => entry.path)), sorted(exactScope));
  assert.ok(entries.every((entry) => entry.status === "M"));
  for (const candidate of exactScope) {
    assert.equal(existsSync(absolute(candidate)), true, candidate);
    assert.equal(gitObjectExists(`${baseline}:${candidate}`), true, candidate);
    assert.notEqual(
      git(["hash-object", candidate]),
      git(["rev-parse", `${baseline}:${candidate}`]),
      candidate,
    );
  }
});

await check("P6-P0 exact 8/8 exists at the fixed baseline", () => {
  const entries = git(["diff", "--name-status", expectedParent, baseline, "--"])
    .split(/\r?\n/u)
    .filter(Boolean)
    .map((entry) => {
      const [status, candidate] = entry.split("\t");
      return { status, path: normalizePath(candidate) };
    });
  assert.equal(entries.length, 8);
  assert.deepEqual(sorted(entries.map((entry) => entry.path)), sorted(exactScope));
  assert.ok(entries.every((entry) => entry.status === "A"));
});

await check("strict UTF-8 valid JSON U+FFFD zero trailing whitespace zero and secret zero", () => {
  const secretPatterns = [
    /sk-[A-Za-z0-9_-]{20,}/u,
    /(?:OPENAI_API_KEY|SUPABASE_SERVICE_ROLE_KEY)\s*[=:]\s*["'][^"']{8,}["']/u,
    /eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/u,
  ];
  for (const candidate of exactScope) {
    const raw = bytes(candidate);
    assert.equal(
      raw[0] === 0xef && raw[1] === 0xbb && raw[2] === 0xbf,
      false,
      candidate,
    );
    const source = text(candidate);
    assert.equal(source.includes("\uFFFD"), false, candidate);
    assert.doesNotMatch(source, /[\t ]+$/mu, candidate);
    for (const pattern of secretPatterns) assert.doesNotMatch(source, pattern, candidate);
  }
  jsonPaths.forEach(json);
});

await check("accepted Package D and protected implementation remain unchanged", () => {
  for (const candidate of new Set(protectedPackageDPaths)) {
    assertUnchangedFromBaseline(candidate);
  }
  assert.equal(json(capabilitiesPath).package_d_accepted, true);
});

await check("old state-only auto-blocking decisions are superseded", () => {
  const policy = text(policyPath);
  for (const required of [
    "OLD-01 — SUPERSEDED",
    "OLD-02 — SUPERSEDED",
    "OLD-03 — SUPERSEDED",
    "a temporary pause may become `eligible_pause_assessment`",
    "may become `eligible_boundary_support_only`",
    "Separable nonprofessional emotional organization may remain eligible",
  ]) {
    assert.ok(policy.includes(required), required);
  }
  const cases = byCaseId(json(matrixPath));
  assert.equal(cases.get("DM-03").classification, "eligible_pause_assessment");
  assert.equal(cases.get("DM-07").classification, "eligible_boundary_support_only");
  assert.equal(cases.get("DM-33").classification, "eligible_general");
});

await check("Safety Gate and Decision Engine responsibilities are separate", () => {
  const policy = text(policyPath);
  assert.match(policy, /Safety Gate.*requested kind of assistance/su);
  assert.match(policy, /Decision Engine.*send, reply, wait, or pause additional contact/su);
  assert.match(policy, /not reasons to block purchase/u);
  const rules = json(matrixPath).global_rules;
  assert.equal(rules.safety_gate_decides_assistance_kind, true);
  assert.equal(rules.decision_engine_decides_send_reply_wait_or_pause, true);
  assert.equal(rules.normal_wait_or_pause_outcome_blocks_purchase, false);
});

await check("exact two-axis vocabularies are defined", () => {
  const matrix = json(matrixPath);
  assert.deepEqual(matrix.model.classification_axes, [
    "contact_boundary_state",
    "requested_assistance_goal",
  ]);
  assert.equal(matrix.model.boundary_state_alone_determines_classification, false);
  assert.deepEqual(matrix.model.contact_boundary_states, contactBoundaryStates);
  assert.deepEqual(matrix.model.requested_assistance_goals, requestedAssistanceGoals);
  assert.equal(new Set(matrix.model.contact_boundary_states).size, 9);
  assert.equal(new Set(matrix.model.requested_assistance_goals).size, 8);
});

await check("exact dispositions scopes and derived classifications are defined", () => {
  const matrix = json(matrixPath);
  assert.deepEqual(matrix.model.safety_dispositions, safetyDispositions);
  assert.deepEqual(matrix.model.eligible_delivery_scopes, eligibleDeliveryScopes);
  assert.deepEqual(matrix.model.derived_classifications, derivedClassifications);
  assert.deepEqual(
    matrix.classification_states.map((state) => state.code),
    derivedClassifications,
  );
  assert.deepEqual(
    matrix.classification_states
      .filter((state) => state.safety_disposition === "eligible")
      .map((state) => state.delivery_scope),
    eligibleDeliveryScopes,
  );
});

await check("temporary pause can be a paid no-draft assessment", () => {
  const matrix = json(matrixPath);
  const cases = byCaseId(matrix);
  for (const caseId of ["DM-03", "DM-04", "DM-05", "DM-21"]) {
    assert.equal(cases.get(caseId).classification, "eligible_pause_assessment", caseId);
    assert.equal(cases.get(caseId).draft_available, false, caseId);
  }
  const state = matrix.classification_states.find(
    (candidate) => candidate.code === "eligible_pause_assessment",
  );
  assert.equal(state.can_reach_purchase_available_subject_to_gates, true);
  assert.equal(state.message_draft_policy, "not_available");
});

await check("explicit boundaries can receive boundary-support-only assessment", () => {
  const cases = byCaseId(json(matrixPath));
  for (const caseId of ["DM-07", "DM-08", "DM-11", "DM-17", "DM-19", "DM-42"]) {
    assert.equal(
      cases.get(caseId).classification,
      "eligible_boundary_support_only",
      caseId,
    );
  }
  assert.equal(cases.get("DM-07").draft_available, false);
  assert.equal(cases.get("DM-11").draft_available, false);
});

await check("unsafe requested assistance blocks despite safe structured answers", () => {
  const matrix = json(matrixPath);
  const cases = byCaseId(matrix);
  for (const caseId of [
    "DM-06",
    "DM-09",
    "DM-10",
    "DM-12",
    "DM-20",
    "DM-22",
    "DM-23",
    "DM-24",
    "DM-25",
    "DM-26",
    "DM-27",
    "DM-28",
    "DM-36",
  ]) {
    assert.equal(cases.get(caseId).classification, "blocked_unsafe_assistance", caseId);
    assert.equal(cases.get(caseId).can_reach_purchase_available, false, caseId);
  }
  assert.equal(
    matrix.global_rules.safe_structured_option_overrides_explicit_unsafe_content,
    false,
  );
  assert.equal(cases.get("DM-36").structured_safe_option_overrides_free_text, false);
});

await check("past unsafe behavior mention alone does not block", () => {
  const matrix = json(matrixPath);
  const item = byCaseId(matrix).get("DM-42");
  assert.equal(item.inputs.past_unsafe_behavior_mentioned, true);
  assert.equal(item.inputs.requested_direction, "stop_and_respect_boundary");
  assert.equal(item.classification, "eligible_boundary_support_only");
  assert.equal(item.blocked_solely_by_past_mention, false);
  assert.equal(matrix.global_rules.past_unsafe_behavior_mention_alone_blocks, false);
});

await check("current urgent Safety redirects without relationship strategy", () => {
  const cases = byCaseId(json(matrixPath));
  assert.equal(cases.get("DM-29").classification, "urgent_safety_redirect");
  assert.equal(cases.get("DM-30").classification, "urgent_safety_redirect");
  const copy = json(stopCopyPath).messages.urgent_safety_redirect;
  assert.equal(copy.boundary_support_switch_may_be_offered, false);
  assert.equal(copy.location_specific_resource_invented, false);
  assert.ok(copy.forbidden_outputs.includes("relationship_strategy"));
  assert.ok(copy.forbidden_outputs.includes("contact_draft"));
});

await check("professional judgment is unsupported but separable organization can remain eligible", () => {
  const matrix = json(matrixPath);
  const cases = byCaseId(matrix);
  assert.equal(cases.get("DM-31").classification, "unsupported_professional_request");
  assert.equal(cases.get("DM-32").classification, "unsupported_professional_request");
  assert.equal(cases.get("DM-33").classification, "eligible_general");
  assert.equal(cases.get("DM-33").professional_advice_allowed, false);
  assert.equal(matrix.global_rules.professional_context_alone_blocks, false);
  assert.equal(matrix.global_rules.professional_judgment_supported, false);
  const flow = json(questionFlowPath).required_follow_up_flows.professional_context;
  assert.equal(flow.yes_result, "reclassify_under_applicable_nonprofessional_scope");
  assert.equal(flow.no_result, "unsupported_professional_request");
});

await check("customer question flow contains exact nine states and eight goals", () => {
  const flow = json(questionFlowPath);
  assert.equal(flow.primary_screen.title, "決済前の利用確認");
  assert.equal(
    flow.primary_screen.contact_boundary_question,
    "現在、相手との連絡状況に最も近いものを選んでください。",
  );
  assert.equal(
    flow.primary_screen.requested_assistance_question,
    "今回、月の返事に最も手伝ってほしいことを選んでください。",
  );
  assert.deepEqual(
    flow.primary_screen.contact_boundary_options.map((option) => option.code),
    contactBoundaryStates,
  );
  assert.deepEqual(
    flow.primary_screen.requested_assistance_options.map((option) => option.code),
    requestedAssistanceGoals,
  );
  assert.match(flow.primary_screen.explanation, /「今は送らない」という鑑定/u);
  assert.match(flow.primary_screen.explanation, /拒否や連絡制限を回避する方法/u);
});

await check("pause and boundary disclosures are exact required purchase gates", () => {
  const flow = json(questionFlowPath).required_follow_up_flows;
  assert.equal(
    flow.temporary_pause.acknowledgement_text,
    "鑑定結果によっては、\n「今は送らない」という判断になり、\n送信文案が表示されない場合があります。\n\nその場合も、\n理由・今の動き方・見直す条件を\n鑑定ノートとしてお返しします。",
  );
  assert.equal(
    flow.explicit_boundary.acknowledgement_text,
    "この鑑定では、\n相手への連絡文案や再接触方法は提供しません。\n\n確認できる事実、\n気持ちの整理、\n相手の境界を尊重した今後の方向性を\n鑑定ノートとしてお返しします。",
  );
  assert.equal(flow.temporary_pause.false_or_absent_result, "eligible_but_purchase_unavailable");
  assert.equal(
    flow.explicit_boundary.false_or_absent_result,
    "eligible_but_purchase_unavailable",
  );
  const cases = byCaseId(json(matrixPath));
  assert.equal(cases.get("DM-40").can_reach_purchase_available, false);
  assert.equal(cases.get("DM-41").can_reach_purchase_available, false);
});

await check("mandatory attestation is server-recomputed and non-overriding", () => {
  const attestation = json(questionFlowPath).mandatory_attestation;
  assert.equal(attestation.field, "attestation_confirmed");
  assert.equal(attestation.required_value, true);
  assert.equal(
    attestation.customer_text,
    "この鑑定を、\n相手から示された拒否や連絡制限を回避する方法、\n監視・追跡、\n脅しや強い圧力を使う方法として\n利用しないことを確認します。",
  );
  assert.equal(attestation.false_or_absent_can_reach_purchase_available, false);
  assert.equal(attestation.server_recomputes_classification, true);
  assert.equal(attestation.overrides_unsafe_content, false);
  assert.equal(attestation.overrides_urgent_safety, false);
  assert.equal(attestation.overrides_professional_scope_exclusion, false);
  assert.equal(attestation.proof_of_truthfulness, false);
  assert.equal(byCaseId(json(matrixPath)).get("DM-37").can_reach_purchase_available, false);
});

await check("business-only and new-inbound reply remain strictly scoped", () => {
  const flow = json(questionFlowPath).required_follow_up_flows;
  assert.deepEqual(flow.business_only.questions.map((item) => item.code), [
    "practical_permission_explicit",
    "current_request_practical_scope_only",
  ]);
  assert.ok(flow.business_only.questions.every((item) => item.required_answer === "yes"));
  assert.deepEqual(flow.new_inbound_after_boundary.questions.map((item) => item.code), [
    "reply_explicitly_invited",
    "reply_limited_to_exact_subject",
  ]);
  assert.ok(
    flow.new_inbound_after_boundary.questions.every(
      (item) => item.required_answer === "yes",
    ),
  );
  const cases = byCaseId(json(matrixPath));
  assert.equal(cases.get("DM-13").classification, "eligible_business_only");
  assert.equal(cases.get("DM-14").can_reach_purchase_available, false);
  assert.equal(cases.get("DM-16").classification, "eligible_scoped_reply");
  assert.notEqual(cases.get("DM-18").classification, "eligible_scoped_reply");
});

await check("unknown conflict and clarification are bounded and fail closed for payment", () => {
  const flow = json(questionFlowPath);
  assert.equal(
    flow.conflict_and_precedence_rules.structured_answers_and_request_conflict,
    "needs_clarification",
  );
  assert.equal(flow.conflict_and_precedence_rules.no_infinite_clarification_loop, true);
  assert.equal(
    flow.conflict_and_precedence_rules.unresolved_after_bounded_clarification,
    "needs_clarification",
  );
  assert.equal(flow.required_follow_up_flows.unknown.purchase_available_while_unresolved, false);
  const cases = byCaseId(json(matrixPath));
  assert.equal(cases.get("DM-34").classification, "eligible_general");
  assert.equal(cases.get("DM-35").classification, "needs_clarification");
  assert.equal(cases.get("DM-35").can_reach_purchase_available, false);
});

await check("time passage unblocking alternate channels and third parties never reopen contact", () => {
  const matrix = json(matrixPath);
  const flow = json(questionFlowPath);
  assert.equal(matrix.global_rules.time_passage_reopens_contact, false);
  assert.equal(matrix.global_rules.unblocking_alone_reopens_contact, false);
  assert.equal(matrix.global_rules.new_inbound_requires_full_reclassification, true);
  assert.equal(matrix.global_rules.alternate_channel_workaround_allowed, false);
  assert.equal(matrix.global_rules.third_party_workaround_allowed, false);
  assert.equal(flow.reopening_rules.time_passage_alone_reopens_contact, false);
  assert.equal(flow.reopening_rules.unblocking_alone_reopens_contact, false);
  assert.equal(flow.reopening_rules.new_inbound_requires_full_reclassification, true);
  const cases = byCaseId(matrix);
  assert.equal(cases.get("DM-19").contact_permission_reopened, false);
  assert.equal(cases.get("DM-21").contact_permission_reopened, false);
  assert.equal(cases.get("DM-22").classification, "blocked_unsafe_assistance");
});

await check("noneligible stop copy is exact distinct and nonjudgmental", () => {
  const copy = json(stopCopyPath);
  assert.equal(copy.distinct_message_required_for_each_noneligible_state, true);
  assert.deepEqual(Object.keys(copy.messages), [
    "blocked_unsafe_assistance",
    "urgent_safety_redirect",
    "unsupported_professional_request",
  ]);
  assert.equal(copy.messages.blocked_unsafe_assistance.heading, "その目的のお手伝いはできません");
  assert.equal(copy.messages.urgent_safety_redirect.heading, "いまは鑑定より、安全を優先してください");
  assert.equal(
    copy.messages.unsupported_professional_request.heading,
    "この内容は、月の返事の対応範囲外です",
  );
  for (const message of Object.values(copy.messages)) {
    assert.equal(message.payment_statement, "この画面では決済は発生しません。");
    assert.equal(message.provider_called, false);
    assert.equal(message.payment_session_created, false);
  }
  assert.equal(copy.tone_and_safety_properties.nonjudgmental, true);
  assert.equal(copy.tone_and_safety_properties.unambiguous, true);
  assert.equal(copy.tone_and_safety_properties.customer_identity_labeling_allowed, false);
  assert.equal(copy.tone_and_safety_properties.past_unsafe_behavior_mention_alone_blocks, false);
});

await check("blocked outputs contain no Provider assessment and urgent output no relationship strategy", () => {
  const copy = json(stopCopyPath);
  assert.ok(
    copy.messages.blocked_unsafe_assistance.forbidden_outputs.includes(
      "provider_generated_assessment",
    ),
  );
  assert.ok(copy.messages.blocked_unsafe_assistance.forbidden_outputs.includes("report"));
  assert.ok(
    copy.messages.urgent_safety_redirect.forbidden_outputs.includes(
      "relationship_strategy",
    ),
  );
  assert.equal(copy.global_output_rules.blocked_provider_assessment_created, false);
  assert.equal(copy.global_output_rules.urgent_relationship_strategy_created, false);
  const machine = json(stateMachinePath);
  const blocked = machine.states.find(
    (state) => state.code === "blocked_unsafe_assistance",
  );
  assert.ok(blocked.forbidden_outputs.includes("provider_generated_assessment"));
  const urgent = machine.states.find((state) => state.code === "urgent_safety_redirect");
  assert.ok(urgent.forbidden_outputs.includes("relationship_strategy"));
});

await check("server-owned state machine defines exactly fourteen states", () => {
  const machine = json(stateMachinePath);
  assert.deepEqual(machine.states.map((state) => state.code), serverStates);
  assert.deepEqual(machine.eligible_states, eligibleStates);
  assert.equal(machine.ownership.authority_owner, "server");
  assert.equal(machine.ownership.client_can_set_state, false);
  assert.deepEqual(machine.ownership.client_settable_states, []);
  assert.equal(machine.ownership.client_can_set_classification, false);
  assert.equal(machine.ownership.client_can_authorize_purchase, false);
  assert.equal(machine.ownership.client_can_create_payment_session, false);
});

await check("only five eligible states can enter purchase_available with gates", () => {
  const machine = json(stateMachinePath);
  assert.deepEqual(
    machine.states
      .filter((state) => state.can_transition_to_purchase_available)
      .map((state) => state.code),
    eligibleStates,
  );
  const purchaseTransitions = machine.transitions.filter(
    (transition) => transition.to === "purchase_available",
  );
  assert.deepEqual(
    purchaseTransitions.map((transition) => transition.from),
    eligibleStates,
  );
  assert.ok(purchaseTransitions.every((transition) => transition.authority === "server"));
  assert.ok(
    purchaseTransitions.every((transition) =>
      transition.required_conditions.includes("attestation_confirmed"),
    ),
  );
  assert.equal(
    machine.transitions.some(
      (transition) =>
        [
          "needs_clarification",
          "blocked_unsafe_assistance",
          "urgent_safety_redirect",
          "unsupported_professional_request",
        ].includes(transition.from) && transition.to === "purchase_available",
    ),
    false,
  );
});

await check("eligibility identity is canonical server-owned and client hash is forbidden", () => {
  const machine = json(stateMachinePath);
  const identity = machine.server_owned_eligibility_identity;
  assert.deepEqual(identity.canonical_bound_fields, boundEligibilityFields);
  assert.equal(identity.hash_computed_by, "server");
  assert.equal(identity.client_generated_authority_hash_allowed, false);
  assert.equal(identity.safe_structured_option_overrides_unsafe_request_content, false);
  assert.equal(machine.ownership.client_generated_authority_hash_allowed, false);
});

await check("bound input mutation and stale authority revoke purchase availability", () => {
  const machine = json(stateMachinePath);
  const identity = machine.server_owned_eligibility_identity;
  assert.equal(identity.any_bound_field_change_revokes_eligibility, true);
  assert.equal(identity.any_bound_field_change_revokes_purchase_available, true);
  assert.equal(identity.any_bound_field_change_result_state, "unassessed");
  assert.equal(identity.stale_authority_rejected, true);
  assert.equal(identity.old_tab_rejected, true);
  assert.equal(identity.copied_url_rejected, true);
  assert.deepEqual(machine.input_mutation_invalidation.watched_inputs, boundEligibilityFields);
  assert.equal(machine.input_mutation_invalidation.result_state, "unassessed");
  assert.equal(machine.input_mutation_invalidation.revokes_purchase_authority, true);
  assert.equal(machine.idempotency.duplicate_requests_create_duplicate_purchase_authority, false);
  const cases = byCaseId(json(matrixPath));
  assert.equal(cases.get("DM-38").authority_outcome, "eligibility_revoked_to_unassessed");
  assert.equal(cases.get("DM-39").authority_outcome, "stale_authority_rejected");
});

await check("decision matrix contains all 42 required cases", () => {
  const matrix = json(matrixPath);
  assert.equal(matrix.cases.length, 42);
  assert.deepEqual(
    matrix.cases.map((item) => item.case_id),
    Array.from({ length: 42 }, (_, index) =>
      `DM-${String(index + 1).padStart(2, "0")}`,
    ),
  );
  const expectedResults = [
    "eligible_general",
    "eligible_general",
    "eligible_pause_assessment",
    "eligible_pause_assessment",
    "eligible_pause_assessment",
    "blocked_unsafe_assistance",
    "eligible_boundary_support_only",
    "eligible_boundary_support_only",
    "blocked_unsafe_assistance",
    "blocked_unsafe_assistance",
    "eligible_boundary_support_only",
    "blocked_unsafe_assistance",
    "eligible_business_only",
    "needs_clarification",
    "eligible_boundary_support_only",
    "eligible_scoped_reply",
    "eligible_boundary_support_only",
    "needs_clarification",
    "eligible_boundary_support_only",
    "blocked_unsafe_assistance",
    "eligible_pause_assessment",
    "blocked_unsafe_assistance",
    "blocked_unsafe_assistance",
    "blocked_unsafe_assistance",
    "blocked_unsafe_assistance",
    "blocked_unsafe_assistance",
    "blocked_unsafe_assistance",
    "blocked_unsafe_assistance",
    "urgent_safety_redirect",
    "urgent_safety_redirect",
    "unsupported_professional_request",
    "unsupported_professional_request",
    "eligible_general",
    "eligible_general",
    "needs_clarification",
    "blocked_unsafe_assistance",
    "eligible_general",
    "eligible_general",
    "eligible_general",
    "eligible_pause_assessment",
    "eligible_boundary_support_only",
    "eligible_boundary_support_only",
  ];
  assert.deepEqual(
    matrix.cases.map((item) => item.classification),
    expectedResults,
  );
  for (const caseId of [
    "DM-14",
    "DM-18",
    "DM-29",
    "DM-30",
    "DM-31",
    "DM-32",
    "DM-35",
    "DM-36",
    "DM-37",
    "DM-38",
    "DM-39",
    "DM-40",
    "DM-41",
  ]) {
    assert.equal(byCaseId(matrix).get(caseId).can_reach_purchase_available, false, caseId);
  }
});

await check("Product Owner direction is accepted while detailed review remains pending", () => {
  const capabilities = json(capabilitiesPath);
  assert.equal(capabilities.task_id, taskId);
  const expected = {
    status: "prepayment_safety_intent_charter_rewritten_pending_human_chatgpt_review",
    baseline,
    package_d_accepted: true,
    old_state_only_blocking_policy_superseded: true,
    safety_and_decision_engine_separated: true,
    two_axis_classification_defined: true,
    eligible_general_defined: true,
    eligible_pause_assessment_defined: true,
    eligible_boundary_support_only_defined: true,
    eligible_scoped_reply_defined: true,
    eligible_business_only_defined: true,
    blocked_unsafe_assistance_defined: true,
    urgent_safety_redirect_defined: true,
    unsupported_professional_request_defined: true,
    prepurchase_scope_disclosures_defined: true,
    server_owned_eligibility_identity_defined: true,
    product_owner_direction_accepted: true,
    human_chatgpt_charter_review_complete: false,
    package_e_implementation_authorized: false,
    payment_provider_integration_authorized: false,
    provider_rerun_authorized: false,
    active_runtime_activated: false,
    package_f_authorized: false,
    r4_authorized: false,
    c2_authorized: false,
    final_jpy980_readiness_established: false,
    next_action: "human_chatgpt_review_of_safety_intent_separation_charter",
  };
  for (const [key, value] of Object.entries(expected)) {
    assert.deepEqual(capabilities[key], value, key);
  }
  const policy = text(policyPath);
  assert.match(policy, /PRODUCT OWNER DIRECTION: ACCEPTED/u);
  assert.match(policy, /Detailed Human \/ ChatGPT Charter review remains pending/u);
});

await check("review records technical result product risks and nine plain-language points", () => {
  const source = text(reviewPath);
  for (const required of [
    "## Technical result",
    "## Independent product-risk assessment",
    "## Plain-language summary",
    "Exact correction scope: 8/8 existing files updated; no new or deleted files",
    "Decision matrix: 42/42 required cases",
    "Provider / DB / Supabase: `0 / 0 / 0`",
    "PRODUCT OWNER DIRECTION: ACCEPTED",
    "Detailed Human / ChatGPT Charter review remains pending",
    "なぜ一時的な距離置きは有料鑑定可能なのか",
    "明確な拒絶後でも何を提供できるのか",
    "何を求めた場合に本当に無料停止するのか",
    "緊急Safetyと通常の恋愛不安の違い",
    "専門案件をどう分けるのか",
    "文案が出ない可能性を購入前にどう説明するのか",
    "Safety GateとDecision Engineの役割の違い",
    "まだ実装していないもの",
    "次のゲート",
  ]) {
    assert.ok(source.includes(required), required);
  }
});

await check("no payment provider SDK or payment-session implementation exists", () => {
  const packageJson = json("package.json");
  const dependencyNames = [
    ...Object.keys(packageJson.dependencies ?? {}),
    ...Object.keys(packageJson.devDependencies ?? {}),
  ];
  const paymentProviderPattern = /stripe|paddle|paypal|adyen|braintree|checkout\.com/iu;
  assert.deepEqual(
    dependencyNames.filter((name) => paymentProviderPattern.test(name)),
    [],
  );

  const tracked = git(["ls-files", "app", "components", "lib", "fixtures"])
    .split(/\r?\n/u)
    .filter(Boolean)
    .map(normalizePath);
  const paymentNamed = tracked.filter((candidate) =>
    /payment|purchase|checkout|stripe|paypal|paddle|adyen/iu.test(candidate),
  );
  const reviewOnlyPaymentPaths = [
    "app/review/purchase/confirmation/[fixtureId]/page.tsx",
    "components/review/ReviewPurchaseConfirmation.tsx",
    "fixtures/review/purchase-confirmations.ts",
  ];
  assert.deepEqual(sorted(paymentNamed), sorted(reviewOnlyPaymentPaths));
  reviewOnlyPaymentPaths.forEach(assertUnchangedFromBaseline);
  assert.match(text(reviewOnlyPaymentPaths[0]), /決済機能のない/u);

  const apiPaymentPaths = tracked.filter(
    (candidate) =>
      /^(?:app|pages)\/api\//u.test(candidate) &&
      /payment|purchase|checkout|webhook|stripe|paypal|paddle|adyen/iu.test(candidate),
  );
  assert.deepEqual(apiPaymentPaths, []);
  const implementationPattern =
    /\b(?:stripe|paddle|paypal|adyen|braintree)\b|payment[_-]?session|checkout[_-]?session/iu;
  const sourceMatches = tracked.filter(
    (candidate) =>
      /\.(?:[cm]?[jt]sx?)$/u.test(candidate) && implementationPattern.test(text(candidate)),
  );
  assert.deepEqual(sourceMatches, []);
  const implementation = json(stateMachinePath).implementation_status;
  assert.equal(implementation.payment_provider_implemented, false);
  assert.equal(implementation.payment_session_creation_implemented, false);
  assert.equal(json(capabilitiesPath).operations.payment_sdk_added, false);
});

await check("Active Runtime v4 remains selected and v12 remains inactive", () => {
  const activeCatalog = json(
    "lib/assessment/runtime/contracts/runtime-stage-catalog-v4.json",
  );
  const schemaCatalog = text("lib/assessment/runtime/schema-catalog.ts");
  const p5Results = json(
    "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p5/offline-results-v1.json",
  );
  assert.equal(activeCatalog.catalog_version, "runtime-stage-catalog-v4.0.0");
  assert.match(schemaCatalog, /runtime-stage-catalog-v4\.json/u);
  assert.equal(p5Results.runtime_catalog_v12.active, false);
  assert.equal(p5Results.regression.active_runtime, "v4");
  assert.equal(p5Results.regression.active_runtime_activated, false);
  const capabilities = json(capabilitiesPath);
  assert.equal(capabilities.active_runtime, "v4");
  assert.equal(capabilities.v12_active, false);
  assert.equal(capabilities.active_runtime_activated, false);
});

await check("Provider DB Supabase and external execution remain zero", () => {
  const capabilities = json(capabilitiesPath);
  assert.equal(capabilities.operations.provider_calls, 0);
  assert.equal(capabilities.operations.db_operations, 0);
  assert.equal(capabilities.operations.supabase_operations, 0);
  assert.equal(capabilities.operations.payment_sessions_created, 0);
  assert.equal(capabilities.operations.provider_execution, false);
  assert.equal(capabilities.operations.database_changes, false);
  assert.equal(capabilities.operations.payment_changes, false);
  const source = text(verifierPath);
  assert.doesNotMatch(
    source,
    /\bfetch\s*\(|\bhttps?\.request\s*\(|\bcreateClient\s*\(|\bOpenAI\s*\(/u,
  );
});

await check("planning-only prohibitions and no implementation paths changed", () => {
  const changed = changedPathsSinceBaseline();
  assert.deepEqual(changed, sorted(exactScope));
  for (const prefix of [
    "app/",
    "components/",
    "lib/",
    "ai/",
    "fixtures/",
    "supabase/",
    "migrations/",
  ]) {
    assert.equal(changed.some((candidate) => candidate.startsWith(prefix)), false, prefix);
  }
  assert.equal(
    changed.some((candidate) => candidate.startsWith("scripts/") && candidate !== verifierPath),
    false,
  );
  for (const forbidden of [
    "docs/CURRENT_FOCUS.md",
    "docs/WBS.md",
    "docs/CODEX_HANDOFF.md",
  ]) {
    assert.equal(changed.includes(forbidden), false, forbidden);
  }
  const operations = json(capabilitiesPath).operations;
  for (const key of [
    "ui_changes",
    "api_changes",
    "runtime_changes",
    "pipeline_changes",
    "service_changes",
    "prompt_changes",
    "catalog_changes",
    "schema_changes",
    "evaluator_changes",
    "semantic_disposition_changes",
    "database_changes",
    "migration_changes",
    "payment_changes",
    "provider_execution",
    "runtime_activation",
    "pull_request",
    "main_merge",
    "force_push",
  ]) {
    assert.equal(operations[key], false, key);
  }
});

await check("git diff --check PASS", () => {
  git(["diff", "--check", baseline, "--"]);
});

const failed = checks.filter((result) => !result.passed);
console.log(
  `Safety-intent separation charter verifier: ${failed.length === 0 ? "PASS" : "FAIL"} ${
    checks.length - failed.length
  }/${checks.length}`,
);
console.log(`Exact scope: ${exactScope.length}/8 updated only`);
console.log(
  `Boundary states: ${contactBoundaryStates.length}/9; assistance goals: ${requestedAssistanceGoals.length}/8`,
);
console.log(
  `Safety dispositions: ${safetyDispositions.length}/5; eligible scopes: ${eligibleDeliveryScopes.length}/5; derived classifications: ${derivedClassifications.length}/9`,
);
console.log("Decision matrix cases: 42/42");
console.log("Provider / DB / Supabase: 0 / 0 / 0");
console.log("Active Runtime: v4; v12 inactive");
console.log(
  "Product Owner direction: accepted; Human / ChatGPT Charter review: pending; Package E and payment integration: unauthorized",
);
if (failed.length > 0) {
  console.error(`Failed checks: ${failed.map((item) => item.name).join("; ")}`);
  process.exitCode = 1;
}
