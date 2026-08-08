import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const taskId = "M2-P4-I3-R1-C1-R3-R2-E-R3-R3-R3-P6-P0";
const baseline = "1196e7d581e1e7d2b1f200eaa92de2477999f5bd";
const expectedParent = "2f8b8fa6ce8e54117f25640809240521a39b1b4d";
const expectedMain = "61e33a10e195fad17e253a6b9719217e1992f273";
const expectedSourceBranch =
  "fix/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p5-r2-product-outcome-gates";
const expectedBranch =
  "plan/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p6-p0-prepayment-safety-charter";
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

const p5R2Scope = [
  "docs/phase2/TASK_M2_P4_I3_R1_C1_R3_R2_E_R3_R3_R3_P5_REVIEW.md",
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p5/capabilities-v1.json",
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p5/offline-results-v1.json",
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p5/remediation-contract-v1.json",
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p5/remediation-fixtures-v1.json",
  "lib/assessment/runtime/semantic-disposition-v5.ts",
  "scripts/verify-m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p5-evaluator-disposition.mjs",
];

const protectedPackageDPaths = [
  ...p5R2Scope,
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

const classificationStates = [
  "eligible_general",
  "eligible_scoped_reply",
  "eligible_business_only",
  "needs_clarification",
  "blocked_no_purchase",
  "urgent_safety_redirect",
];

const eligibleStates = [
  "eligible_general",
  "eligible_scoped_reply",
  "eligible_business_only",
];

const serverStates = [
  "unassessed",
  "collecting_boundary_answer",
  "needs_clarification",
  "eligible_general",
  "eligible_scoped_reply",
  "eligible_business_only",
  "blocked_no_purchase",
  "urgent_safety_redirect",
  "purchase_available",
  "payment_pending",
  "payment_completed",
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

function changedPathsSinceBaseline() {
  const tracked = git(["diff", "--name-only", baseline, "--"])
    .split(/\r?\n/u)
    .filter(Boolean)
    .map(normalizePath);
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

await check("exact branch baseline parent upstream when present and main authority", () => {
  const head = git(["rev-parse", "HEAD"]);
  assert.equal(git(["branch", "--show-current"]), expectedBranch);
  assert.equal(git(["rev-parse", `${baseline}^`]), expectedParent);
  assert.equal(git(["merge-base", head, baseline]), baseline);
  assert.equal(git(["rev-parse", expectedSourceBranch]), baseline);
  assert.equal(git(["rev-parse", `origin/${expectedSourceBranch}`]), baseline);
  const commitsAfterBaseline = Number(git(["rev-list", "--count", `${baseline}..${head}`]));
  assert.ok(commitsAfterBaseline === 0 || commitsAfterBaseline === 1);
  if (commitsAfterBaseline === 1) assert.equal(git(["rev-parse", `${head}^`]), baseline);
  const upstream = gitResult(["rev-parse", "@{u}"]);
  if (upstream.status === 0) assert.equal(upstream.stdout.trim(), head);
  assert.equal(git(["rev-parse", "main"]), expectedMain);
  assert.equal(git(["rev-parse", "origin/main"]), expectedMain);
});

await check("exact scope 8/8 and all paths new", () => {
  assert.equal(exactScope.length, 8);
  assert.deepEqual(changedPathsSinceBaseline(), sorted(exactScope));
  for (const candidate of exactScope) {
    assert.equal(existsSync(absolute(candidate)), true, candidate);
    assert.equal(gitObjectExists(`${baseline}:${candidate}`), false, candidate);
  }
});

await check("strict UTF-8 valid JSON U+FFFD zero trailing whitespace zero and secret zero", () => {
  const secretPatterns = [
    /sk-[A-Za-z0-9_-]{20,}/u,
    /(?:OPENAI_API_KEY|SUPABASE_SERVICE_ROLE_KEY)\s*[=:]\s*["'][^"']{8,}["']/u,
    /eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/u,
  ];
  for (const candidate of exactScope) {
    const raw = bytes(candidate);
    assert.equal(raw[0] === 0xef && raw[1] === 0xbb && raw[2] === 0xbf, false, candidate);
    const source = text(candidate);
    assert.equal(source.includes("\uFFFD"), false, candidate);
    assert.doesNotMatch(source, /[\t ]+$/mu, candidate);
    for (const pattern of secretPatterns) assert.doesNotMatch(source, pattern, candidate);
  }
  jsonPaths.forEach(json);
});

await check("P5-R2 exact 7/7 correction exists at the fixed baseline", () => {
  const entries = git(["diff", "--name-status", expectedParent, baseline, "--"])
    .split(/\r?\n/u)
    .filter(Boolean)
    .map((entry) => entry.split("\t"))
    .map(([status, candidate]) => ({ status, path: normalizePath(candidate) }));
  assert.equal(entries.length, 7);
  assert.deepEqual(sorted(entries.map((entry) => entry.path)), sorted(p5R2Scope));
  assert.ok(entries.every((entry) => entry.status === "M"));
});

await check("accepted Package D and protected implementation remain unchanged", () => {
  for (const candidate of new Set(protectedPackageDPaths)) {
    assertUnchangedFromBaseline(candidate);
  }
  const capabilities = json(capabilitiesPath);
  assert.equal(capabilities.package_d_accepted, true);
});

await check("six exact classification states and eligibility meanings are defined", () => {
  const matrix = json(matrixPath);
  assert.deepEqual(matrix.classification_states.map((state) => state.code), classificationStates);
  assert.equal(new Set(matrix.classification_states.map((state) => state.code)).size, 6);
  assert.deepEqual(
    matrix.classification_states
      .filter((state) => state.kind === "eligible")
      .map((state) => state.code),
    eligibleStates,
  );
  assert.equal(matrix.classification_states[0].purchase_eligibility, "candidate");
  assert.equal(
    matrix.classification_states[1].purchase_eligibility,
    "candidate_after_clarification",
  );
  assert.equal(
    matrix.classification_states[2].purchase_eligibility,
    "candidate_after_explicit_scope_confirmation",
  );
  for (const state of matrix.classification_states.slice(3)) {
    assert.equal(state.purchase_eligibility, false, state.code);
  }
});

await check("decision matrix contains all 18 required fail-closed cases", () => {
  const matrix = json(matrixPath);
  assert.equal(matrix.cases.length, 18);
  assert.deepEqual(
    matrix.cases.map((item) => item.case_id),
    Array.from({ length: 18 }, (_, index) => `DM-${String(index + 1).padStart(2, "0")}`),
  );
  const expectedResults = [
    "eligible_general",
    "blocked_no_purchase",
    "blocked_no_purchase",
    "blocked_no_purchase",
    "blocked_no_purchase",
    "eligible_business_only",
    "blocked_no_purchase",
    "eligible_scoped_reply",
    "blocked_no_purchase",
    "blocked_no_purchase",
    "needs_clarification",
    "blocked_no_purchase",
    "blocked_no_purchase",
    "blocked_no_purchase",
    "blocked_no_purchase",
    "urgent_safety_redirect",
    "blocked_no_purchase",
    "needs_clarification",
  ];
  assert.deepEqual(matrix.cases.map((item) => item.classification), expectedResults);
  for (const item of matrix.cases) {
    assert.equal(item.can_reach_purchase_available, eligibleStates.includes(item.classification), item.case_id);
  }
});

await check("primary question and nine exact customer options are defined", () => {
  const flow = json(questionFlowPath);
  assert.equal(flow.primary_screen.title, "決済前の安全確認");
  assert.equal(
    flow.primary_screen.explanation,
    "相手の境界を尊重し、利用後のトラブルを避けるため、\n現在の連絡状況を確認します。",
  );
  assert.equal(
    flow.primary_screen.question,
    "現在、相手との連絡について最も近い状態を選んでください。",
  );
  assert.deepEqual(
    flow.primary_screen.options.map((option) => option.code),
    [
      "no_restriction_known",
      "temporary_pause",
      "explicit_no_contact",
      "channel_restricted",
      "relationship_closed",
      "business_only",
      "new_inbound_after_boundary",
      "unknown",
      "urgent_safety",
    ],
  );
  assert.deepEqual(
    flow.primary_screen.options.map((option) => option.customer_label),
    [
      "連絡を控えるよう求められておらず、\nブロック等もない",
      "「考える時間がほしい」\n「落ち着いたら連絡する」などと言われている",
      "「連絡しないで」\n「これ以上連絡しないで」などと言われている",
      "ブロック、着信拒否などで\n連絡手段を制限されている",
      "関係を終えたい意思を\n明確に伝えられている",
      "私的な連絡は禁止だが、\n業務・荷物・金銭等の必要連絡だけは許可されている",
      "以前は制限があったが、\nその後、相手から新しい連絡が届いている",
      "判断できない／分からない",
      "脅迫、危険、緊急性がある",
    ],
  );
});

await check("business-only requires explicit permission and entirely practical scope", () => {
  const matrix = json(matrixPath);
  const flow = json(questionFlowPath).follow_up_flows.business_only_scope;
  assert.deepEqual(flow.questions.map((item) => item.code), [
    "practical_permission_explicit",
    "current_request_practical_scope_only",
  ]);
  assert.ok(flow.questions.every((item) => item.required_answer === "yes"));
  assert.deepEqual(flow.resolution, {
    all_yes: "eligible_business_only",
    any_no: "blocked_no_purchase",
    any_unknown: "needs_clarification",
    unknown_unresolved: "blocked_no_purchase",
  });
  const allowed = matrix.cases.find((item) => item.case_id === "DM-06");
  const mixed = matrix.cases.find((item) => item.case_id === "DM-07");
  assert.equal(allowed.inputs.practical_contact_permission_explicit, true);
  assert.equal(allowed.inputs.current_request_entirely_within_permitted_practical_subject, true);
  assert.equal(mixed.classification, "blocked_no_purchase");
  assert.equal(flow.eligible_constraints.length, 6);
});

await check("new inbound requires explicit reply invitation and scoped reply", () => {
  const matrix = json(matrixPath);
  const flow = json(questionFlowPath).follow_up_flows.new_inbound_scope;
  assert.deepEqual(flow.questions.map((item) => item.code), [
    "reply_explicitly_invited",
    "reply_limited_to_new_message_subject",
  ]);
  assert.ok(flow.questions.every((item) => item.required_answer === "yes"));
  assert.equal(flow.resolution.all_yes, "eligible_scoped_reply");
  assert.equal(flow.resolution.any_no, "blocked_no_purchase");
  assert.equal(flow.resolution.any_unknown, "needs_clarification");
  const eligible = matrix.cases.find((item) => item.case_id === "DM-08");
  assert.equal(eligible.inputs.new_message_explicitly_asks_for_or_clearly_invites_reply, true);
  assert.equal(eligible.inputs.intended_reply_limited_to_new_message_subject, true);
});

await check("unknown conflicts temporary pause and explicit boundaries cannot reach payment", () => {
  const matrix = json(matrixPath);
  const byId = new Map(matrix.cases.map((item) => [item.case_id, item]));
  for (const caseId of ["DM-02", "DM-03", "DM-04", "DM-05", "DM-11", "DM-12", "DM-18"]) {
    assert.equal(byId.get(caseId).can_reach_purchase_available, false, caseId);
  }
  assert.equal(matrix.global_rules.unknown_can_reach_payment, false);
  assert.equal(matrix.global_rules.conflicting_answers_can_reach_payment, false);
});

await check("time passage unblocking alternate channels and third parties never reopen contact", () => {
  const matrix = json(matrixPath);
  const flow = json(questionFlowPath);
  assert.equal(matrix.global_rules.time_passage_reopens_contact, false);
  assert.equal(matrix.global_rules.unblocking_alone_reopens_contact, false);
  assert.equal(matrix.global_rules.alternate_channel_workaround_allowed, false);
  assert.equal(matrix.global_rules.third_party_workaround_allowed, false);
  assert.equal(flow.reopening_rules.time_passage_alone_reopens_contact, false);
  assert.equal(flow.reopening_rules.unblocking_alone_reopens_contact, false);
  assert.equal(flow.reopening_rules.new_inbound_requires_new_classification, true);
  for (const caseId of ["DM-09", "DM-13", "DM-14", "DM-15"]) {
    const item = matrix.cases.find((candidate) => candidate.case_id === caseId);
    assert.equal(item.classification, "blocked_no_purchase", caseId);
  }
});

await check("stop copy is exact nonjudgmental no-payment and reason-specific", () => {
  const copy = json(stopCopyPath);
  assert.deepEqual(copy.common, {
    heading: "今回は、ここで鑑定を止めます",
    body: "現在の情報では、相手の境界を尊重するため、\n月の返事では連絡文案や、\n連絡を再開するための方法を提案できません。",
    payment_statement: "この画面では決済は発生しません。",
  });
  assert.deepEqual(
    copy.reason_specific.map((item) => item.reason_code),
    [
      "temporary_pause",
      "explicit_no_contact",
      "channel_restricted",
      "relationship_closed",
      "unresolved_unknown",
      "unsupported_required_contact",
      "urgent_safety_redirect",
    ],
  );
  assert.ok(copy.reason_specific.every((item) => item.inherits_common_payment_statement === true));
  assert.match(copy.reason_specific[0].supporting_text, /追加の連絡を提案しません/u);
  assert.match(copy.reason_specific[4].supporting_text, /決済へ進めません/u);
  assert.equal(copy.reason_specific[6].location_specific_contact_defined, false);
  const prohibitedCustomerTerm = "\u30b9\u30c8\u30fc\u30ab\u30fc";
  assert.equal(text(stopCopyPath).includes(prohibitedCustomerTerm), false);
  assert.ok(Object.values(copy.tone_and_safety_properties).every((value) => typeof value === "boolean"));
  for (const [key, value] of Object.entries(copy.tone_and_safety_properties)) {
    if (key === "nonjudgmental" || key === "unambiguous") assert.equal(value, true, key);
    else assert.equal(value, false, key);
  }
});

await check("blocked and urgent states create no draft report projection or workaround", () => {
  const copy = json(stopCopyPath);
  const machine = json(stateMachinePath);
  assert.ok(Object.values(copy.prohibited_outputs).every((value) => value === false));
  assert.ok(Object.values(copy.payment_and_output_rules).every((value) => value === false));
  const blocked = machine.states.find((state) => state.code === "blocked_no_purchase");
  assert.deepEqual(blocked.forbidden_outputs, [
    "draft",
    "report",
    "projection",
    "workaround",
    "saved_for_later_draft",
  ]);
  assert.equal(blocked.can_create_payment_session, false);
  const urgent = machine.states.find((state) => state.code === "urgent_safety_redirect");
  assert.equal(urgent.relationship_draft_allowed, false);
  assert.equal(urgent.contact_guidance_allowed, false);
});

await check("server-owned state machine defines exactly eleven states", () => {
  const machine = json(stateMachinePath);
  assert.deepEqual(machine.states.map((state) => state.code), serverStates);
  assert.equal(machine.ownership.authority_owner, "server");
  assert.equal(machine.ownership.classification_method, "deterministic");
  assert.equal(machine.ownership.client_can_set_state, false);
  assert.deepEqual(machine.ownership.client_settable_states, []);
  assert.equal(machine.ownership.client_can_authorize_purchase, false);
  assert.equal(machine.ownership.client_can_create_payment_session, false);
});

await check("only the three eligible states can enter purchase_available", () => {
  const machine = json(stateMachinePath);
  assert.deepEqual(
    machine.states
      .filter((state) => state.can_transition_to_purchase_available)
      .map((state) => state.code),
    eligibleStates,
  );
  const purchaseEntries = machine.transitions
    .filter((transition) => transition.to === "purchase_available")
    .map((transition) => transition.from);
  assert.deepEqual(purchaseEntries, eligibleStates);
  assert.ok(
    machine.transitions
      .filter((transition) => transition.to === "purchase_available")
      .every((transition) => transition.authority === "server"),
  );
  assert.equal(
    machine.transitions.some(
      (transition) =>
        ["needs_clarification", "blocked_no_purchase", "urgent_safety_redirect"].includes(
          transition.from,
        ) && transition.to === "purchase_available",
    ),
    false,
  );
});

await check("blocked state has no direct eligible transition and new inbound is reclassified", () => {
  const machine = json(stateMachinePath);
  assert.equal(machine.reopening_rules.blocked_state_direct_to_eligible_allowed, false);
  assert.equal(machine.reopening_rules.time_passage_is_state_transition, false);
  assert.equal(machine.reopening_rules.unblocking_alone_is_state_transition, false);
  assert.equal(machine.reopening_rules.new_inbound_contact_requires_new_classification, true);
  assert.equal(
    machine.transitions.some(
      (transition) =>
        transition.from === "blocked_no_purchase" && eligibleStates.includes(transition.to),
    ),
    false,
  );
});

await check("input mutation invalidates eligibility and bypass paths fail closed", () => {
  const machine = json(stateMachinePath);
  assert.deepEqual(machine.input_mutation_invalidation.watched_inputs, [
    "request_text",
    "candidate_text",
    "requested_topics",
    "boundary_answers",
  ]);
  assert.equal(machine.input_mutation_invalidation.invalidates_previous_eligibility, true);
  assert.equal(machine.input_mutation_invalidation.result_state, "unassessed");
  assert.equal(machine.input_mutation_invalidation.revokes_purchase_authority, true);
  assert.equal(machine.input_mutation_invalidation.invalidates_pending_payment_authority, true);
  for (const [key, value] of Object.entries(machine.bypass_resistance)) {
    if (key === "server_revalidation_required") assert.equal(value, true, key);
    else assert.equal(value, false, key);
  }
  assert.equal(machine.idempotency.duplicate_requests_create_duplicate_purchase_authority, false);
});

await check("no payment-provider or payment-session implementation exists", () => {
  const packageJson = json("package.json");
  const dependencyNames = [
    ...Object.keys(packageJson.dependencies ?? {}),
    ...Object.keys(packageJson.devDependencies ?? {}),
  ];
  const paymentProviderPattern = /stripe|paddle|paypal|adyen|braintree|checkout\.com/iu;
  assert.deepEqual(dependencyNames.filter((name) => paymentProviderPattern.test(name)), []);

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
    (candidate) => /\.(?:[cm]?[jt]sx?)$/u.test(candidate) && implementationPattern.test(text(candidate)),
  );
  assert.deepEqual(sourceMatches, []);
  assert.equal(json(stateMachinePath).implementation_status.payment_provider_implemented, false);
  assert.equal(json(stateMachinePath).implementation_status.payment_session_creation_implemented, false);
});

await check("Active Runtime v4 remains selected and v12 remains inactive", () => {
  const activeCatalog = json("lib/assessment/runtime/contracts/runtime-stage-catalog-v4.json");
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
  assert.doesNotMatch(source, /\bfetch\s*\(|\bhttps?\.request\s*\(|\bcreateClient\s*\(|\bOpenAI\s*\(/u);
});

await check("capabilities preserve pending Product Owner and fail-closed authority", () => {
  const capabilities = json(capabilitiesPath);
  assert.equal(capabilities.task_id, taskId);
  const expected = {
    status: "prepayment_safety_product_charter_pending_product_owner_review",
    baseline,
    package_d_accepted: true,
    prepayment_safety_policy_defined: true,
    decision_matrix_defined: true,
    question_flow_defined: true,
    stop_copy_defined: true,
    purchase_state_machine_defined: true,
    server_owned_purchase_authority_required: true,
    blocked_payment_sessions: 0,
    blocked_provider_calls: 0,
    product_owner_review_complete: false,
    package_e_implementation_authorized: false,
    payment_provider_integration_authorized: false,
    provider_rerun_authorized: false,
    active_runtime_activated: false,
    package_f_authorized: false,
    r4_authorized: false,
    c2_authorized: false,
    final_jpy980_readiness_established: false,
    next_action: "human_chatgpt_product_owner_review_of_pre_payment_safety_charter",
  };
  for (const [key, value] of Object.entries(expected)) {
    assert.deepEqual(capabilities[key], value, key);
  }
});

await check("Product policy contains principles conservative decisions and five review gates", () => {
  const source = text(policyPath);
  for (const required of [
    "Safety and boundary verification occurs before purchase eligibility.",
    "Unknown or conflicting boundary state never reaches payment.",
    "Time passage alone never reopens contact.",
    "Unblocking alone never proves consent.",
    "Temporary pause is a free stop, not a paid no-draft assessment.",
    "Business-only is allowed only under strict practical scope.",
    "Legal or professional disputes are unsupported in the MVP.",
    "No Package E or payment implementation authority exists until all five decisions are accepted.",
  ]) {
    assert.ok(source.includes(required), required);
  }
  assert.match(source, /Provider calls: 0/u);
  assert.match(source, /DB operations: 0/u);
  assert.match(source, /Supabase operations: 0/u);
});

await check("review document records technical plain-language and five pending decisions", () => {
  const source = text(reviewPath);
  for (const required of [
    "## Technical result",
    "## Independent product-risk assessment",
    "## Open Product Owner review items",
    "## Plain-language summary",
    "Exact scope: 8/8 new files",
    "Classification vocabulary: exact 6/6",
    "Decision matrix: 18/18 required cases",
    "Provider / DB / Supabase: `0 / 0 / 0`",
    "Product Owner review: pending",
    "Package E implementation: unauthorized",
    "Temporary pause is a free stop, not a paid no-draft assessment.",
    "Explicit boundary or closure receives no paid interpretation-only assessment.",
    "Business-only is allowed only under strict practical scope.",
    "New inbound contact can reopen only the exact invited scope.",
    "Legal or professional disputes are unsupported in the MVP.",
  ]) {
    assert.ok(source.includes(required), required);
  }
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
});

await check("git diff --check PASS", () => {
  git(["diff", "--check", baseline, "--"]);
});

const failed = checks.filter((result) => !result.passed);
console.log(
  `Pre-payment safety charter verifier: ${failed.length === 0 ? "PASS" : "FAIL"} ${
    checks.length - failed.length
  }/${checks.length}`,
);
console.log(`Exact scope: ${exactScope.length}/8 new`);
console.log(`Classification states: ${classificationStates.length}/6 exact`);
console.log("Decision matrix cases: 18/18");
console.log("Provider / DB / Supabase: 0 / 0 / 0");
console.log("Active Runtime: v4; v12 inactive");
console.log("Product Owner review: pending; Package E and payment integration unauthorized");
if (failed.length > 0) {
  console.error(`Failed checks: ${failed.map((item) => item.name).join("; ")}`);
  process.exitCode = 1;
}
