import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const taskId = "M2-P4-I3-R1-C1-R3-R2-E-R3-R3-R3-P4-R2";
const baseline = "f2efc64009ae1afd8343c1383db12cccf827ed23";
const expectedParent = "eb76dd591fd52ba344c9114c85b8b63187664e9b";
const expectedMain = "61e33a10e195fad17e253a6b9719217e1992f273";
const expectedBranch =
  "fix/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p4-r2-contract-alignment";
const expectedSourceBranch =
  "fix/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p4-r1-pb05-v3-parity";
const evidenceCommitB = "9e9bf7d90740c1d00bfc4e282c85906744cd736c";
const expectedV3Blob = "8d0242ee120238c488b80b310bf47e13cea617ba";
const expectedV3Hash =
  "3dfdf47d9df45bdde344e57d5481dcac247095736eed8cd1919f2e7547d8b083";
const expectedV4OriginalBaselineHash =
  "f4f5dc2cc11f1afb64765961ad47838edf76f04daad20a0e6f5f3e72079d6a7d";
const expectedV4BaselineHash =
  "0ed1f8e63d352c1599ab97686617d8a15c037fcb5c8c376df0ece0eb343ac768";
const expectedV4CorrectedHash =
  "530fe831e8290270d499a44d8aae98b3756935feed1bcfc79612e05ff7695c9f";
const expectedGroundingV4Hash =
  "dc256f6bb98a9a350f3b5938d76229ee3d9d4a5ec9095a183a185afa584388b8";
const maxBuffer = 32 * 1024 * 1024;

const packageRoot =
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p4";
const promptPath =
  "lib/assessment/runtime/contracts/pb-05-directional-report-v4.developer.md";
const predecessorV2Path =
  "lib/assessment/runtime/contracts/pb-05-directional-report-v2.developer.md";
const predecessorV3Path =
  "lib/assessment/runtime/contracts/pb-05-directional-report-v3.developer.md";
const v11CatalogPath =
  "lib/assessment/runtime/contracts/runtime-stage-catalog-v11.json";
const groundingPath = "lib/assessment/runtime/report-grounding-v4.ts";
const contractPath = `${packageRoot}/remediation-contract-v1.json`;
const fixturesPath = `${packageRoot}/remediation-fixtures-v1.json`;
const offlineResultsPath = `${packageRoot}/offline-results-v1.json`;
const capabilitiesPath = `${packageRoot}/capabilities-v1.json`;
const verifierPath =
  "scripts/verify-m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p4-pb05-precision-writing.mjs";
const reviewPath =
  "docs/phase2/TASK_M2_P4_I3_R1_C1_R3_R2_E_R3_R3_R3_P4_REVIEW.md";

const exactScope = [
  promptPath,
  contractPath,
  fixturesPath,
  offlineResultsPath,
  capabilitiesPath,
  verifierPath,
  reviewPath,
];

const exactPb05Inputs = [
  "base_structured_intake",
  "candidate_envelope",
  "decision_plan",
  "contact_constraint_policy",
  "action_context",
];

const unavailablePolicySafetyInputs = [
  "decision_policy_result",
  "aggregate_safety_result",
];

const r2aR1Scope = [
  "lib/assessment/runtime/customer-assessment-experience-projection-v2.ts",
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-r2-a/projection-contract-v1.json",
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-r2-a/projection-fixtures-v1.json",
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-r2-a/offline-results-v1.json",
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-r2-a/capabilities-v1.json",
  "scripts/verify-m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-r2-a-experience-projection.mjs",
  "docs/phase2/TASK_M2_P4_I3_R1_C1_R3_R2_E_R3_R3_R3_P3_R2_A_REVIEW.md",
];

const r2bR1Scope = [
  "components/runtime/CustomerAssessmentNote.tsx",
  "components/runtime/CustomerAssessmentNote.module.css",
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-r2-b/presentation-contract-v1.json",
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-r2-b/capabilities-v1.json",
  "scripts/verify-m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-r2-b-reassuring-note.mjs",
  "docs/phase2/TASK_M2_P4_I3_R1_C1_R3_R2_E_R3_R3_R3_P3_R2_B_REVIEW.md",
];

const r2cScope = [
  "docs/phase2/TASK_M2_P4_I3_R1_C1_R3_R2_E_R3_R3_R3_P3_R2_C_REVIEW.md",
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-r2-c/capabilities-v1.json",
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-r2-c/human-visual-review-v1.json",
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-r2-c/product-owner-review-v1.json",
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-r2-c/review-matrix-v1.json",
  "scripts/verify-m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-r2-c-visual-product-review.mjs",
];

const doctrineRoot =
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-r1";
const doctrineScope = [
  `${doctrineRoot}/product-doctrine-v1.json`,
  `${doctrineRoot}/product-doctrine-v1.md`,
  `${doctrineRoot}/experience-projection-gap-v1.json`,
  `${doctrineRoot}/experience-section-architecture-v1.json`,
  `${doctrineRoot}/human-visual-review-v1.json`,
  `${doctrineRoot}/implementation-packages-v1.json`,
  `${doctrineRoot}/capabilities-v1.json`,
];

const protectedRuntimePaths = [
  predecessorV2Path,
  predecessorV3Path,
  "lib/assessment/runtime/report-grounding-v3.ts",
  "lib/assessment/runtime/contracts/report-content-v2.schema.json",
  "lib/assessment/runtime/types.ts",
  "lib/assessment/runtime/pipeline.ts",
  "lib/assessment/runtime/schema-catalog.ts",
  "lib/assessment/runtime/service.ts",
  "lib/assessment/runtime/contracts/runtime-stage-catalog-v4.json",
  v11CatalogPath,
  "lib/assessment/runtime/semantic-disposition-v3.ts",
  "lib/assessment/runtime/semantic-disposition-v4.ts",
  "components/runtime/CustomerDraftCopyButton.tsx",
  "components/runtime/RuntimeAssessmentForm.tsx",
  "components/runtime/RuntimeAssessmentNote.tsx",
  "app/review/runtime/v12/page.tsx",
  "app/api/internal/assessments/route.ts",
];

function git(args, encoding = "utf8") {
  return execFileSync(
    "git.exe",
    ["-c", "safe.directory=C:/projects/moon-reply", ...args],
    { cwd: root, encoding, maxBuffer },
  );
}

function gitText(args) {
  return git(args, "utf8").trim();
}

function gitSucceeds(args) {
  return (
    spawnSync(
      "git.exe",
      ["-c", "safe.directory=C:/projects/moon-reply", ...args],
      { cwd: root, encoding: "utf8", maxBuffer },
    ).status === 0
  );
}

function absolute(relativePath) {
  return path.join(root, relativePath);
}

function strictText(relativePath) {
  const bytes = readFileSync(absolute(relativePath));
  return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
}

function json(relativePath) {
  return JSON.parse(strictText(relativePath));
}

function sha256Bytes(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function sha256CanonicalText(relativePath) {
  return sha256Bytes(
    Buffer.from(strictText(relativePath).replaceAll("\r\n", "\n"), "utf8"),
  );
}

function sha256CanonicalTextAt(revision, relativePath) {
  const source = new TextDecoder("utf-8", { fatal: true }).decode(
    blobBytesAt(revision, relativePath),
  );
  return sha256Bytes(Buffer.from(source.replaceAll("\r\n", "\n"), "utf8"));
}

function sha256Json(value) {
  return sha256Bytes(Buffer.from(JSON.stringify(value), "utf8"));
}

function blobAt(revision, relativePath) {
  return gitText(["rev-parse", `${revision}:${relativePath}`]);
}

function blobBytesAt(revision, relativePath) {
  return git(["cat-file", "blob", `${revision}:${relativePath}`], null);
}

function sorted(values) {
  return [...values].sort((left, right) => left.localeCompare(right));
}

function assertUnchangedFromBaseline(relativePath) {
  assert.equal(blobAt("HEAD", relativePath), blobAt(baseline, relativePath));
  assert.equal(
    gitSucceeds(["diff", "--quiet", baseline, "--", relativePath]),
    true,
    relativePath,
  );
}

function changedPathsFromBaseline() {
  const trackedOutput = gitText([
    "diff",
    "--name-status",
    "--no-renames",
    baseline,
    "--",
  ]);
  const tracked = trackedOutput
    ? trackedOutput.split(/\r?\n/u).map((line) => {
        const [status, relativePath] = line.split("\t");
        return { status, path: relativePath.replaceAll("\\", "/") };
      })
    : [];
  const trackedPaths = new Set(tracked.map((entry) => entry.path));
  const untrackedOutput = gitText([
    "ls-files",
    "--others",
    "--exclude-standard",
  ]);
  const untracked = untrackedOutput
    ? untrackedOutput
        .split(/\r?\n/u)
        .map((relativePath) => relativePath.replaceAll("\\", "/"))
        .filter((relativePath) => !trackedPaths.has(relativePath))
        .map((relativePath) => ({ status: "A", path: relativePath }))
    : [];
  return [...tracked, ...untracked];
}

function markdownExampleText(source) {
  return source
    .split(/\r?\n/u)
    .map((line) => (line.startsWith("> ") ? line.slice(2) : line))
    .join("\n");
}

const responsibilityHeadings = new Map([
  ["factual_authority", "## Exact input boundary and factual authority"],
  ["causal_integrity", "## Causal integrity"],
  ["chronology_integrity", "## Chronology integrity"],
  ["explicit_fact_versus_inference", "## Explicit fact versus inferred meaning"],
  ["anxiety_safe_uncertainty", "## Anxiety-safe uncertainty"],
  ["consultation_specific_reassurance", "## Consultation-specific reassurance"],
  ["distinct_field_responsibility", "## Distinct field responsibility"],
  ["density_without_repetition", "## Density without repetition"],
  ["persona_preservation", "## Persona and final-draft integrity"],
  ["contact_and_safety_integrity", "## Contact and Safety integrity"],
  ["action_context_authority", "## Action-context authority"],
]);

const predecessorParityHeadings = new Map([
  ["no_followup_message", "### A. no_followup_message"],
  ["business_only", "### B. business_only"],
  ["selected_request_coverage", "### C. selected-request coverage"],
  ["natural_product_voice", "### D. natural Product voice"],
  [
    "application_owned_change_condition_grounding",
    "### E. Application-owned grounding",
  ],
  ["concrete_action_and_reassessment", "### F. usable Product outcome"],
  ["commercial_output_boundary", "### G. commercial/output boundary"],
]);

function sectionText(source, heading) {
  const start = source.indexOf(heading);
  assert.notEqual(start, -1, heading);
  const next = source.indexOf("\n## ", start + heading.length);
  return source.slice(start, next === -1 ? source.length : next);
}

function withoutSection(source, heading) {
  const start = source.indexOf(heading);
  assert.notEqual(start, -1, heading);
  const next = source.indexOf("\n## ", start + heading.length);
  return `${source.slice(0, start)}${
    next === -1 ? "" : source.slice(next + 1)
  }`;
}

function subsectionText(source, heading) {
  const start = source.indexOf(heading);
  assert.notEqual(start, -1, heading);
  const nextSubsection = source.indexOf("\n### ", start + heading.length);
  const nextSection = source.indexOf("\n## ", start + heading.length);
  const candidates = [nextSubsection, nextSection].filter((index) => index !== -1);
  const end = candidates.length === 0 ? source.length : Math.min(...candidates);
  return source.slice(start, end);
}

function withoutSubsection(source, heading) {
  const start = source.indexOf(heading);
  assert.notEqual(start, -1, heading);
  const nextSubsection = source.indexOf("\n### ", start + heading.length);
  const nextSection = source.indexOf("\n## ", start + heading.length);
  const candidates = [nextSubsection, nextSection].filter((index) => index !== -1);
  const end = candidates.length === 0 ? source.length : Math.min(...candidates);
  return `${source.slice(0, start)}${source.slice(end === source.length ? end : end + 1)}`;
}

function assertPredecessorParity(source) {
  const paritySection = sectionText(source, "## PB-05 v3 predecessor parity");
  assert.match(paritySection, /actual catalogued predecessor, PB-05 v3/u);
  assert.match(paritySection, /PB-05 v2 remains protected historical authority/u);

  const anchorsByResponsibility = {
    no_followup_message: [
      "contact_constraint_policy.constraint_kind = no_followup_message",
      "follow_up_exception = none",
      "current outbound contact",
      "later outbound contact",
      "a later draft",
      "an apology workaround",
      "an aftercare contact workaround",
      "contact reopened only because time passed",
      "a reassessment instruction that tells the user to initiate contact",
      "a hidden reply request",
      "wait_and_reassess",
      "pause_additional_contact",
      "another future-valid Decision",
      "Do not narrow it to a pause direction.",
    ],
    business_only: [
      "contact_constraint_policy.constraint_kind = business_only",
      "personal invitation",
      "romantic interpretation",
      "affection escalation",
      "private-conversation suggestion",
      "relationship progression",
      "non-business follow-up",
      "Draft commentary and action commentary must remain business-only.",
    ],
    selected_request_coverage: [
      "every materially selected Base-owned requested topic in meaning",
      "Do not omit a materially selected request",
      "without creating duplicate sections or repeated prose",
      "draft_message",
      "message_impact",
      "without predicting the recipient's reaction",
    ],
    natural_product_voice: [
      "Address the user naturally and directly",
      "相談者",
      "本ケース",
      "入力情報から判断すると",
      "business-report tone",
      "defensive AI voice",
      "occult certainty",
      "generic filler",
    ],
    application_owned_change_condition_grounding: [
      "relationship_summary",
      "change_condition_commentary",
      "groundSplitReportContentV4",
      "groundChangeConditionCommentaryV3",
      "post-grounding `validateStageOutput` for PB-05",
      "does not wire that sequence",
    ],
    concrete_action_and_reassessment: [
      "one clear current direction",
      "one concrete immediate action",
      "one observable reassessment condition",
      "Do not produce a direction without an action",
      "an action without a reassessment condition",
    ],
    commercial_output_boundary: [
      "Do not claim JPY 980 value inside Report prose.",
      "merged intake",
      "Provider metadata",
      "evaluation or oracle data",
      "Product Owner ratings",
      "a diagnostic verdict",
      "retry, repair, fallback",
      "PB-07 content",
    ],
  };

  for (const [responsibility, heading] of predecessorParityHeadings) {
    const subsection = subsectionText(paritySection, heading);
    for (const anchor of anchorsByResponsibility[responsibility]) {
      assert.ok(subsection.includes(anchor), `${responsibility}: ${anchor}`);
    }
  }

  assert.match(paritySection, /more than one plausible reading is deliberately superseded/u);
  assert.match(paritySection, /possible_interpretations.*zero entries/su);
  assert.match(paritySection, /adds no Product value/u);
  assert.match(paritySection, /do not restore an unconditional requirement to use `今夜`/u);
  assert.match(paritySection, /time wording remains governed by Base Structured Intake and `action_context`/u);
}

function assertContractAlignmentPrompt(source) {
  const authoritySection = sectionText(
    source,
    responsibilityHeadings.get("factual_authority"),
  );
  assert.match(
    authoritySection,
    /PB-05 does not directly receive `decision_policy_result`, `aggregate_safety_result`, a PB-02 result, a PB-03 result, or a PB-06 result\./u,
  );
  assert.equal(
    (source.match(/`decision_policy_result`/gu) ?? []).length,
    1,
  );
  assert.equal(
    (source.match(/`aggregate_safety_result`/gu) ?? []).length,
    1,
  );

  const contactSection = sectionText(
    source,
    responsibilityHeadings.get("contact_and_safety_integrity"),
  );
  for (const phrase of [
    "validated selected Decision in `decision_plan`",
    "`contact_constraint_policy`",
    "trusted `action_context`",
    "validated Decision Plan and Application-owned contact constraint already embody the upstream Policy and Safety decisions relevant to PB-05",
    "do not recompute, reinterpret, or override upstream Policy or Safety",
    "Do not claim direct access to Policy or Safety objects that are not inputs.",
  ]) {
    assert.ok(contactSection.includes(phrase), phrase);
  }
  assert.doesNotMatch(
    contactSection,
    /selected Decision, Decision Policy, and the Safety outcome/u,
  );

  const observedSection = sectionText(
    source,
    "## observed_fact_commentary Grounding contract",
  );
  for (const phrase of [
    "`fact_id` must appear in `decision_plan.decision_reason_fact_ids`",
    "`fact_id` values must be unique within `observed_fact_commentary`",
    "do not emit commentary for an unselected Base fact",
    "do not duplicate one `fact_id` to create more prose",
    "preserve observed fact and interpretation separation",
    "commentary text must not expose internal IDs to the customer",
    "Zero `observed_fact_commentary` items is valid",
    "Do not require commentary for every `decision_reason_fact_id`",
    "fail-closed for duplicate or unselected fact IDs",
  ]) {
    assert.ok(observedSection.includes(phrase), phrase);
  }

  const groundingSubsection = subsectionText(
    sectionText(source, "## PB-05 v3 predecessor parity"),
    "### E. Application-owned grounding",
  );
  const orderedSequence = [
    "1. `groundSplitReportContentV4`;",
    "2. `groundChangeConditionCommentaryV3`; and",
    "3. post-grounding `validateStageOutput` for PB-05.",
  ];
  let previousIndex = -1;
  for (const item of orderedSequence) {
    const index = groundingSubsection.indexOf(item);
    assert.ok(index > previousIndex, item);
    previousIndex = index;
  }
  assert.doesNotMatch(source, /groundReportContentV4/u);
}

function assertPromptContract(source, fixtureCatalog) {
  assert.match(
    source,
    /^# PB-05 Directional Report — Developer Contract v4\.0\.0$/mu,
  );
  assert.match(source, /inactive, offline-only successor contract/u);
  assert.match(source, /report-content-v2\.schema\.json/u);

  const authoritySection = sectionText(
    source,
    responsibilityHeadings.get("factual_authority"),
  );
  const inputBlock = authoritySection.slice(
    authoritySection.indexOf("Consume exactly these future inputs:"),
    authoritySection.indexOf("Do not consume"),
  );
  const inputNames = [...inputBlock.matchAll(/^- `([^`]+)`$/gmu)].map(
    (match) => match[1],
  );
  assert.deepEqual(inputNames, exactPb05Inputs);
  for (const phrase of [
    "Base Structured Intake owns facts, chronology, explicit user emotion, explicit message text, uncertainty, and boundaries.",
    "Decision Plan owns the selected direction, current action, reassessment conditions, and final draft.",
    "Application code owns contact constraints and trusted action context.",
    "Report Content explains these authorities. It never creates a new fact or a second decision.",
  ]) {
    assert.ok(authoritySection.includes(phrase), phrase);
  }

  const hardGateSection = sectionText(source, "## Hard Gates and Product Doctrine");
  const hardGates = [
    "1. Safety.",
    "2. Factual integrity.",
    "3. User and other-person boundary integrity.",
    "4. No unsupported certainty.",
    "5. No fabricated inner state, causality, chronology, or future outcome.",
  ];
  let previousIndex = -1;
  for (const gate of hardGates) {
    const index = hardGateSection.indexOf(gate);
    assert.ok(index > previousIndex, gate);
    previousIndex = index;
  }
  assert.match(hardGateSection, /理解された感覚 → 安心 → 納得 → 行動/u);
  assert.match(hardGateSection, /Comfort never permits false certainty/u);

  const anchorsByResponsibility = {
    factual_authority: ["Do not consume raw optional Candidate text"],
    causal_integrity: [
      "State a causal relationship only when Base Structured Intake explicitly contains that relationship.",
      "Do not ask Application code to strip connector substrings",
    ],
    chronology_integrity: [
      "Use only chronology explicitly supported",
      "Do not invent dates, deadlines, or time passage.",
    ],
    explicit_fact_versus_inference: [
      "Preserve explicit text as an observed fact.",
      "Romantic interest, hidden intention",
    ],
    anxiety_safe_uncertainty: [
      "Bound uncertainty.",
      "Do not frighten the customer in order to sound balanced.",
    ],
    consultation_specific_reassurance: [
      "Tie reassurance to this consultation.",
      "A simple business reply must not receive generic emotional aftercare",
    ],
    distinct_field_responsibility: [
      "Every emitted paragraph must perform a distinct Product function.",
      "Zero entries is valid",
    ],
    density_without_repetition: [
      "The defect to avoid is repeated meaning, not length itself.",
      "Do not impose a character or paragraph target beyond the existing Schema.",
    ],
    persona_preservation: [
      "The sole final draft authority is `decision_plan.recommended_message_draft.text`.",
      "Never reconstruct or quote raw Candidate text.",
    ],
    contact_and_safety_integrity: [
      "Respect the validated selected Decision in `decision_plan`",
      "Never weaken a Safety or boundary gate.",
    ],
    action_context_authority: [
      "Use `action_context` only for trusted time wording.",
      "Never infer local time from Provider execution time.",
    ],
  };
  for (const [responsibility, heading] of responsibilityHeadings) {
    const section = sectionText(source, heading);
    for (const anchor of anchorsByResponsibility[responsibility]) {
      assert.ok(section.includes(anchor), `${responsibility}: ${anchor}`);
    }
  }

  const fieldSection = sectionText(
    source,
    responsibilityHeadings.get("distinct_field_responsibility"),
  );
  for (const field of [
    "cover_line",
    "short_letter",
    "decision_reason_summary",
    "relationship_summary",
    "observed_fact_commentary",
    "possible_interpretations",
    "anxiety_reframe",
    "message_temperature",
    "action_rationales",
    "message_draft_context",
    "aftercare_commentary",
    "change_condition_commentary",
    "closing_lines",
  ]) {
    assert.ok(fieldSection.includes(`- \`${field}\`:`), field);
  }

  assertPredecessorParity(source);
  assertContractAlignmentPrompt(source);

  const normalized = markdownExampleText(source);
  for (const fixture of fixtureCatalog.pairs) {
    assert.ok(normalized.includes(fixture.reject), fixture.fixture_id);
    assert.ok(normalized.includes(fixture.accept), fixture.fixture_id);
  }
  assert.match(source, /does not establish Provider quality/u);
  assert.doesNotMatch(source, /provider_quality_established:\s*true/u);
}

function deepFreeze(value, visited = new WeakSet()) {
  if (value === null || typeof value !== "object" || visited.has(value)) {
    return value;
  }
  visited.add(value);
  for (const nested of Object.values(value)) deepFreeze(nested, visited);
  return Object.freeze(value);
}

function decisionFacts(sender = "other_person", userReplyState = "not_replied") {
  return {
    schema_version: "m2-p4-decision-facts-v2",
    relationship_stage: "friend",
    selected_requests: [],
    latest_direct_message: {
      sender,
      kind: sender === "none" ? "none" : "question",
      response_expectation: sender === "none" ? "none" : "optional",
      user_reply_state: userReplyState,
      sns_signal_only: false,
    },
    contact_state: {
      unanswered_user_message_count: 0,
      elapsed_since_latest_user_message_minutes: null,
      usual_cadence_relation: "unknown",
      proposed_message_present: true,
    },
    boundary_state: {
      kind: "none",
      status: "none",
      repeated_unanswered_contact: false,
    },
    practical_reason: {
      kind: "none",
      active: false,
      deadline: "none",
    },
    information_state: {
      assessment_mode: "best_effort",
      can_proceed_without_followup: true,
      used_context_inference: false,
      unresolved_fields: [],
    },
  };
}

function decisionPlan({
  factIds = ["F001", "F002", "F003"],
  draftText = "おっけー、土曜ならいけるで！\nまた時間おしえて〜😊",
} = {}) {
  const draft =
    draftText === null
      ? null
      : { text: draftText, policy: "required_now", use_timing: "now" };
  return {
    schema_version: "pipeline-schema-v2.0.0",
    selected_decision: draft === null ? "wait_and_reassess" : "reply_now",
    decision_reason_fact_ids: [...factIds],
    possible_interpretations: [],
    pre_action_check: { check: "確認する。", supporting_fact_ids: [] },
    actions_to_take: [],
    actions_to_avoid: [],
    recommended_message_draft: draft,
    message_draft_edit_metadata:
      draft === null
        ? null
        : {
            source_status: "candidate_preserved",
            preserved_meaning: true,
            style_delta: [],
            communicative_intent_delta: {},
            change_reasons: [],
            change_summary: null,
          },
    aftercare_plan: [],
    change_conditions: [],
    review_timing: { when: "次に確認する。", trigger_fact_ids: [] },
    material_unknowns: [],
    model_generated_limitations: [],
  };
}

function generatedReport() {
  return {
    schema_version: "pipeline-schema-v2.0.0",
    cover_line: "確認できることから整えます。",
    short_letter: ["相談内容を具体的に受け止めています。"],
    decision_reason_summary: "明示された事実に沿って方向を選びます。",
    relationship_summary: "Provider text must be replaced.",
    observed_fact_commentary: [
      { fact_id: "F001", commentary: "明示事実をそのまま説明します。" },
    ],
    possible_interpretations: [],
    anxiety_reframe: [],
    message_temperature: {
      softness: "やわらかさを保ちます。",
      affection: "好意を足しません。",
      pressure: "返信圧を足しません。",
      adjustment: "短さを保ちます。",
    },
    action_rationales: [],
    message_draft_context: "検証済みの文面を保ちます。",
    aftercare_commentary: [],
    change_condition_commentary: [],
    closing_lines: ["次の事実を見てから選べます。"],
  };
}

function assertSafeReject(run, expectedCode) {
  let thrown;
  try {
    run();
  } catch (error) {
    thrown = error;
  }
  assert.ok(thrown, expectedCode);
  assert.equal(thrown.safeCode, expectedCode);
}

const contract = json(contractPath);
const fixtures = json(fixturesPath);
const offlineResults = json(offlineResultsPath);
const capabilities = json(capabilitiesPath);
const promptSource = strictText(promptPath);
const groundingSource = strictText(groundingPath);
const wordingCatalog =
  fixtures.fixture_catalog.prompt_writing_contract_examples;
const alignmentCatalog = fixtures.fixture_catalog.contract_alignment_cases;
const groundingCatalog =
  fixtures.fixture_catalog.deterministic_grounding_behavior;

const checks = [];
async function check(name, run) {
  try {
    await run();
    checks.push({ name, passed: true });
    console.log(`PASS ${name}`);
  } catch (error) {
    checks.push({ name, passed: false });
    console.error(`FAIL ${name}`);
    console.error(error instanceof Error ? error.stack : error);
  }
}

await check("exact R2 baseline branch parent source main and origin-main authority", () => {
  const head = gitText(["rev-parse", "HEAD"]);
  assert.equal(gitText(["branch", "--show-current"]), expectedBranch);
  assert.equal(gitText(["rev-parse", baseline]), baseline);
  assert.equal(gitText(["rev-parse", `${baseline}^`]), expectedParent);
  assert.equal(gitText(["rev-parse", expectedSourceBranch]), baseline);
  assert.equal(gitText(["rev-parse", `origin/${expectedSourceBranch}`]), baseline);
  assert.equal(gitText(["merge-base", head, baseline]), baseline);
  assert.ok(head === baseline || gitText(["rev-parse", `${head}^`]) === baseline);
  assert.equal(
    gitText(["rev-list", "--count", `${baseline}..${head}`]),
    head === baseline ? "0" : "1",
  );
  assert.equal(gitText(["rev-parse", "main"]), expectedMain);
  assert.equal(gitText(["rev-parse", "origin/main"]), expectedMain);
});

await check("exact correction scope 7/7 with all paths updated", () => {
  const actual = changedPathsFromBaseline();
  assert.equal(exactScope.length, 7);
  assert.deepEqual(sorted(actual.map((entry) => entry.path)), sorted(exactScope));
  assert.equal(actual.length, 7);
  assert.equal(actual.every((entry) => entry.status === "M"), true);
  for (const relativePath of exactScope) {
    assert.equal(existsSync(absolute(relativePath)), true, relativePath);
    assert.equal(
      gitSucceeds(["cat-file", "-e", `${baseline}:${relativePath}`]),
      true,
      relativePath,
    );
  }
  assert.equal(contract.baseline, baseline);
  assert.equal(contract.parent, expectedParent);
  assert.equal(contract.main_baseline, expectedMain);
  assert.equal(contract.source_branch, expectedSourceBranch);
  assert.equal(contract.implementation_branch, expectedBranch);
  assert.deepEqual(contract.exact_scope, exactScope);
  assert.deepEqual(contract.scope_shape, { new: 0, updated: 7, deleted: 0 });
});

await check("strict UTF-8 JSON validity U+FFFD zero secret zero", () => {
  const secretPatterns = [
    /sk-[A-Za-z0-9_-]{20,}/gu,
    /(?:SUPABASE|OPENAI)_[A-Z_]*(?:KEY|SECRET)\s*[:=]\s*["'][^"']+["']/gu,
    /eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/gu,
  ];
  for (const relativePath of exactScope) {
    const source = strictText(relativePath);
    assert.equal(source.includes("\uFFFD"), false, relativePath);
    assert.doesNotMatch(source, /[\t ]+$/gmu, relativePath);
    for (const pattern of secretPatterns) assert.doesNotMatch(source, pattern);
  }
  for (const relativePath of [
    contractPath,
    fixturesPath,
    offlineResultsPath,
    capabilitiesPath,
  ]) {
    json(relativePath);
  }
});

await check("Prompt v4 exact version schema and input authority", () => {
  assertPromptContract(promptSource, wordingCatalog);
  assert.equal(contract.prompt_contract.version, "v4.0.0");
  assert.equal(contract.prompt_contract.output_schema, "report-content-v2.schema.json");
  assert.deepEqual(contract.prompt_contract.exact_future_inputs, exactPb05Inputs);
  for (const prohibited of [
    ...unavailablePolicySafetyInputs,
    "pb02_result",
    "pb03_result",
    "pb06_result",
  ]) {
    assert.equal(
      contract.prompt_contract.prohibited_inputs.includes(prohibited),
      true,
      prohibited,
    );
  }
  assert.deepEqual(contract.prompt_contract.input_authority_alignment, {
    direct_input_count: 5,
    unavailable_direct_inputs: [
      ...unavailablePolicySafetyInputs,
      "pb02_result",
      "pb03_result",
      "pb06_result",
    ],
    validated_decision_plan_embodies_relevant_upstream_decisions: true,
    application_owned_contact_constraint_embodies_relevant_upstream_decisions:
      true,
    trusted_action_context_respected: true,
    recompute_reinterpret_or_override_upstream_policy_or_safety: false,
    claim_direct_access_to_unavailable_policy_or_safety_objects: false,
  });
  assert.deepEqual(contract.prompt_contract.observed_fact_commentary_rules, {
    fact_id_source: "decision_plan.decision_reason_fact_ids",
    fact_ids_unique_within_observed_fact_commentary: true,
    unselected_base_fact_commentary_allowed: false,
    duplicate_fact_id_for_more_prose_allowed: false,
    observed_fact_and_interpretation_separated: true,
    internal_fact_ids_exposed_in_customer_commentary: false,
    zero_items_permitted_when_not_useful_and_schema_permits: true,
    every_decision_reason_fact_id_required: false,
    grounding_v4_duplicate_or_unselected_ids_fail_closed: true,
  });
});

await check("actual v11 PB-05 predecessor is protected v3 with exact version path and hashes", () => {
  const catalog = json(v11CatalogPath);
  const pb05 = catalog.stages.find((stage) => stage.stage_id === "PB-05");
  assert.ok(pb05);
  assert.equal(catalog.catalog_version, "runtime-stage-catalog-v11.0.0");
  assert.equal(pb05.prompt_version, "v3.0.0");
  assert.equal(pb05.prompt_path, predecessorV3Path);
  assert.equal(pb05.prompt_sha256, expectedV3Hash);
  assert.equal(blobAt(baseline, predecessorV3Path), expectedV3Blob);
  assert.equal(blobAt("HEAD", predecessorV3Path), expectedV3Blob);
  assert.equal(sha256CanonicalText(predecessorV3Path), expectedV3Hash);
  assert.equal(sha256CanonicalTextAt(baseline, predecessorV3Path), expectedV3Hash);
  assertUnchangedFromBaseline(predecessorV2Path);
  assertUnchangedFromBaseline(predecessorV3Path);
  assertUnchangedFromBaseline(v11CatalogPath);

  assert.deepEqual(contract.predecessor_authority, {
    catalog_path: v11CatalogPath,
    catalog_version: "runtime-stage-catalog-v11.0.0",
    stage_id: "PB-05",
    prompt_version: "v3.0.0",
    prompt_path: predecessorV3Path,
    prompt_git_blob_sha: expectedV3Blob,
    prompt_sha256_canonical_utf8_lf: expectedV3Hash,
    successor_prompt_path: promptPath,
    v4_original_baseline_sha256_canonical_utf8_lf:
      expectedV4OriginalBaselineHash,
    v4_r1_corrected_sha256_canonical_utf8_lf: expectedV4BaselineHash,
    v4_r2_baseline_sha256_canonical_utf8_lf: expectedV4BaselineHash,
    v4_corrected_sha256_canonical_utf8_lf: expectedV4CorrectedHash,
    v2_protected_historical_authority: true,
    v3_is_immediate_predecessor: true,
  });
  assert.equal(capabilities.pb05_v3_actual_predecessor_recorded, true);
  assert.equal(capabilities.pb05_v3_prompt_git_blob_sha, expectedV3Blob);
  assert.equal(capabilities.pb05_v3_prompt_sha256, expectedV3Hash);
});

await check("PB-05 v3 predecessor parity responsibilities are substantive 7/7", () => {
  assertPredecessorParity(promptSource);
  assert.deepEqual(
    contract.prompt_contract.predecessor_parity_responsibilities,
    [...predecessorParityHeadings.keys()],
  );
  for (const key of [
    "pb05_v3_parity_complete",
    "no_followup_message_parity",
    "business_only_parity",
    "selected_request_coverage_parity",
    "product_voice_parity",
    "application_grounding_parity",
    "usable_outcome_parity",
    "commercial_output_boundary_parity",
    "existing_v4_precision_rules_preserved",
  ]) {
    assert.equal(capabilities[key], true, key);
  }
});

await check("predecessor parity matrix is exact and every supersession has a reason", () => {
  const expected = [
    ["exact_input_boundary", "preserved"],
    ["contact_constraint_policy", "preserved"],
    ["no_followup_message", "preserved_and_made_explicit"],
    ["business_only", "preserved_and_made_explicit"],
    [
      "action_context_authority",
      "preserved_with_deliberate_neutral_time_refinement",
    ],
    ["selected_request_meaning_coverage", "preserved"],
    ["natural_japanese_product_voice", "preserved"],
    ["relationship_grounding", "preserved"],
    [
      "change_condition_grounding",
      "preserved_as_future_application_owned_integration",
    ],
    ["concrete_action", "preserved"],
    ["observable_reassessment", "preserved"],
    ["candidate_reconstruction_prohibition", "preserved"],
    ["draft_authority", "preserved"],
    ["jpy980_prose_prohibition", "preserved"],
    ["provider_evaluation_metadata_prohibition", "preserved"],
    ["multiple_interpretation_minimum", "deliberately_superseded"],
  ];
  const matrix = contract.predecessor_parity.matrix;
  assert.equal(contract.predecessor_parity.complete, true);
  assert.equal(matrix.length, expected.length);
  assert.equal(new Set(matrix.map((row) => row.responsibility)).size, expected.length);
  assert.deepEqual(
    matrix.map((row) => [row.responsibility, row.status]),
    expected,
  );
  for (const row of matrix) {
    assert.equal(typeof row.reason, "string", row.responsibility);
    assert.ok(row.reason.trim().length > 0, row.responsibility);
    if (row.status.includes("superseded")) {
      assert.match(row.reason, /Zero possible_interpretations/u);
      assert.match(row.reason, /no Product value/u);
    }
  }
  assert.deepEqual(contract.predecessor_parity.mutation_verification, {
    existing_v4_responsibility_mutations_rejected: "11/11",
    predecessor_parity_mutations_rejected: "7/7",
    integration_alignment_mutations_rejected: "3/3",
    total_independently_recorded: "21/21",
    provider_quality_proof: false,
  });
});

await check("Prompt contract self-mutation rejects every missing responsibility 11/11", () => {
  assert.deepEqual(
    contract.prompt_contract.required_separated_responsibilities,
    [...responsibilityHeadings.keys()],
  );
  for (const responsibility of contract.prompt_contract.required_separated_responsibilities) {
    const mutated = withoutSection(
      promptSource,
      responsibilityHeadings.get(responsibility),
    );
    assert.throws(() => assertPromptContract(mutated, wordingCatalog), undefined, responsibility);
  }
});

await check("predecessor parity self-mutation rejects every missing responsibility 7/7", () => {
  for (const [responsibility, heading] of predecessorParityHeadings) {
    const mutated = withoutSubsection(promptSource, heading);
    assert.throws(
      () => assertPromptContract(mutated, wordingCatalog),
      undefined,
      responsibility,
    );
  }
});

await check("integration alignment self-mutations reject every authority defect 3/3", () => {
  const mutations = [
    {
      name: "nonexistent grounding export",
      source: promptSource.replaceAll(
        "groundSplitReportContentV4",
        "groundReportContentV4",
      ),
    },
    {
      name: "missing exact input-authority restriction",
      source: promptSource.replace(
        " PB-05 does not directly receive `decision_policy_result`, `aggregate_safety_result`, a PB-02 result, a PB-03 result, or a PB-06 result.",
        "",
      ),
    },
    {
      name: "missing observed fact-ID subset and uniqueness rules",
      source: withoutSection(
        promptSource,
        "## observed_fact_commentary Grounding contract",
      ),
    },
  ];
  assert.equal(mutations.length, 3);
  for (const mutation of mutations) {
    assert.notEqual(mutation.source, promptSource, mutation.name);
    assert.throws(
      () => assertPromptContract(mutation.source, wordingCatalog),
      undefined,
      mutation.name,
    );
  }
});

await check("wording fixture catalog exact positive 10 negative 10", () => {
  assert.equal(wordingCatalog.authority, "synthetic_contract_examples_only");
  assert.equal(wordingCatalog.provider_compliance_proven, false);
  assert.equal(wordingCatalog.pairs.length, 10);
  assert.deepEqual(
    wordingCatalog.pairs.map((fixture) => fixture.responsibility),
    [
      "causal_integrity",
      "chronology_integrity",
      "explicit_fact_inference_separation",
      "anxiety_safe_uncertainty",
      "generic_aftercare_restriction",
      "consultation_specific_reassurance",
      "no_followup_message",
      "business_only",
      "natural_product_voice",
      "selected_request_coverage",
    ],
  );
  assert.equal(new Set(wordingCatalog.pairs.map((item) => item.fixture_id)).size, 10);
  assert.equal(fixtures.counts.positive_wording_fixtures, 10);
  assert.equal(fixtures.counts.negative_wording_fixtures, 10);
  assert.equal(contract.fixture_authority.positive_wording_fixtures, 10);
  assert.equal(contract.fixture_authority.negative_wording_fixtures, 10);
});

await check("contract alignment cases pass 3/3 and reject 3/3 offline", () => {
  assert.equal(alignmentCatalog.authority, "synthetic_offline_contract_checks");
  assert.equal(alignmentCatalog.provider_compliance_proven, false);
  assert.deepEqual(
    alignmentCatalog.positive.map((item) => item.case_id),
    ["CA-P01", "CA-P02", "CA-P03"],
  );
  assert.deepEqual(
    alignmentCatalog.negative.map((item) => item.case_id),
    ["CA-N01", "CA-N02", "CA-N03"],
  );
  assert.equal(
    alignmentCatalog.positive.every((item) => item.expected === "PASS"),
    true,
  );
  assert.equal(
    alignmentCatalog.negative.every((item) => item.expected === "REJECT"),
    true,
  );

  const [exportCase, inputCase, factCase] = alignmentCatalog.positive;
  assert.equal(exportCase.future_integration_export, "groundSplitReportContentV4");
  assert.match(
    groundingSource,
    /export function groundSplitReportContentV4\(/u,
  );
  assert.deepEqual(inputCase.direct_inputs, exactPb05Inputs);
  assert.deepEqual(
    inputCase.unavailable_direct_inputs,
    unavailablePolicySafetyInputs,
  );
  const selectedFactIds = new Set(factCase.decision_reason_fact_ids);
  const observedFactIds = factCase.observed_fact_commentary.map(
    (item) => item.fact_id,
  );
  assert.equal(new Set(observedFactIds).size, observedFactIds.length);
  assert.equal(observedFactIds.every((factId) => selectedFactIds.has(factId)), true);

  const [badExportCase, badInputCase, badFactCase] = alignmentCatalog.negative;
  assert.equal(badExportCase.future_integration_export, "groundReportContentV4");
  assert.doesNotMatch(groundingSource, /export function groundReportContentV4\(/u);
  assert.deepEqual(
    badInputCase.claimed_direct_inputs,
    unavailablePolicySafetyInputs,
  );
  assert.equal(
    badInputCase.claimed_direct_inputs.some((name) =>
      exactPb05Inputs.includes(name),
    ),
    false,
  );
  const permittedFactIds = badFactCase.permitted_observed_fact_ids;
  const allowedFactIds = new Set(badFactCase.decision_reason_fact_ids);
  assert.equal(new Set(permittedFactIds).size < permittedFactIds.length, true);
  assert.equal(permittedFactIds.some((factId) => !allowedFactIds.has(factId)), true);

  assert.deepEqual(contract.contract_alignment_cases, {
    fixture_section: "fixture_catalog.contract_alignment_cases",
    positive_case_ids: ["CA-P01", "CA-P02", "CA-P03"],
    negative_case_ids: ["CA-N01", "CA-N02", "CA-N03"],
    positive_results: "3/3 PASS",
    negative_results: "3/3 REJECT",
    offline_contract_checks_only: true,
    provider_compliance_proven: false,
  });
  assert.equal(fixtures.counts.positive_contract_alignment_cases, 3);
  assert.equal(fixtures.counts.negative_contract_alignment_cases, 3);
  assert.equal(contract.fixture_authority.positive_contract_alignment_cases, 3);
  assert.equal(contract.fixture_authority.negative_contract_alignment_cases, 3);
});

await check("causal chronology explicit-fact and anxiety-safe contracts are substantive", () => {
  const causal = sectionText(promptSource, responsibilityHeadings.get("causal_integrity"));
  const chronology = sectionText(
    promptSource,
    responsibilityHeadings.get("chronology_integrity"),
  );
  const explicitFact = sectionText(
    promptSource,
    responsibilityHeadings.get("explicit_fact_versus_inference"),
  );
  const anxiety = sectionText(
    promptSource,
    responsibilityHeadings.get("anxiety_safe_uncertainty"),
  );
  assert.match(causal, /Separately supported facts must stay separate/u);
  assert.match(causal, /だから.*ので.*ため.*せいで/su);
  assert.match(chronology, /next day.*that night.*following morning/su);
  assert.match(chronology, /初めて会ったあと/u);
  assert.match(explicitFact, /gratitude and enjoyment were communicated/u);
  assert.match(explicitFact, /Romantic interest, hidden intention/u);
  assert.match(anxiety, /directly supported by Base/u);
  assert.match(anxiety, /material to Safety or the present Decision/u);
});

await check("consultation-specific reassurance and generic aftercare restrictions are substantive", () => {
  const section = sectionText(
    promptSource,
    responsibilityHeadings.get("consultation_specific_reassurance"),
  );
  assert.match(section, /Phone, notification, checking, or re-reading aftercare/u);
  assert.match(section, /repeated notification checking/u);
  assert.match(section, /simple business reply/u);
  assert.ok(section.includes("「宛先と日時を確認して、一度だけ返信しましょう。」"));
  assert.ok(
    markdownExampleText(section).includes(
      "「必要な予定は確認できています。\n日時を確かめて返したら、この連絡はいったん手放して大丈夫です。」",
    ),
  );
});

await check("field responsibility density persona contact and action context contracts", () => {
  const density = sectionText(
    promptSource,
    responsibilityHeadings.get("density_without_repetition"),
  );
  const persona = sectionText(
    promptSource,
    responsibilityHeadings.get("persona_preservation"),
  );
  const contact = sectionText(
    promptSource,
    responsibilityHeadings.get("contact_and_safety_integrity"),
  );
  const actionContext = sectionText(
    promptSource,
    responsibilityHeadings.get("action_context_authority"),
  );
  assert.match(density, /Simple cases may be shorter/u);
  assert.match(density, /emotionally complex cases may be longer/u);
  assert.match(persona, /normalize dialect/u);
  assert.match(persona, /remove emoji/u);
  assert.match(persona, /remove line breaks/u);
  assert.match(contact, /no-contact or pause direction/u);
  assert.match(contact, /time-passage exception/u);
  for (const value of ["今夜", "今日", "明日", "翌日", "3日後", "現時点", "次に"])
    assert.ok(actionContext.includes(value), value);
});

await check("Prompt baseline and corrected hashes are fixed and Grounding v4 is blob-identical", () => {
  const promptHash = sha256CanonicalText(promptPath);
  const groundingHash = sha256CanonicalText(groundingPath);
  assert.equal(sha256CanonicalTextAt(baseline, promptPath), expectedV4BaselineHash);
  assert.equal(promptHash, expectedV4CorrectedHash);
  assert.equal(sha256CanonicalTextAt(baseline, groundingPath), expectedGroundingV4Hash);
  assert.equal(groundingHash, expectedGroundingV4Hash);
  assert.equal(blobAt("HEAD", groundingPath), blobAt(baseline, groundingPath));
  assert.equal(gitSucceeds(["diff", "--quiet", baseline, "--", groundingPath]), true);
  assert.equal(contract.prompt_contract.sha256_canonical_utf8_lf, promptHash);
  assert.equal(
    contract.predecessor_authority.v4_original_baseline_sha256_canonical_utf8_lf,
    expectedV4OriginalBaselineHash,
  );
  assert.equal(
    contract.predecessor_authority.v4_r1_corrected_sha256_canonical_utf8_lf,
    expectedV4BaselineHash,
  );
  assert.equal(
    contract.predecessor_authority.v4_r2_baseline_sha256_canonical_utf8_lf,
    expectedV4BaselineHash,
  );
  assert.equal(
    contract.predecessor_authority.v4_corrected_sha256_canonical_utf8_lf,
    expectedV4CorrectedHash,
  );
  assert.equal(contract.grounding_contract.sha256_canonical_utf8_lf, groundingHash);
  assert.equal(capabilities.pb05_v4_baseline_sha256, expectedV4BaselineHash);
  assert.equal(capabilities.pb05_v4_prompt_sha256, promptHash);
  assert.equal(capabilities.report_grounding_v4_sha256, groundingHash);
  assert.equal(offlineResults.prompt.baseline_sha256_canonical_utf8_lf, expectedV4BaselineHash);
  assert.equal(offlineResults.prompt.sha256_canonical_utf8_lf, promptHash);
  assert.equal(offlineResults.grounding.sha256_canonical_utf8_lf, groundingHash);
  assert.equal(offlineResults.grounding.blob_identical_to_baseline, "PASS");
});

let groundingV4;
let groundingV3;
await check("grounding v4 module exports version functions and file-local safe error", async () => {
  groundingV4 = await import(
    `${pathToFileURL(absolute(groundingPath)).href}?verify=${Date.now()}`
  );
  groundingV3 = await import(
    `${pathToFileURL(absolute("lib/assessment/runtime/report-grounding-v3.ts")).href}?verify=${Date.now()}`
  );
  assert.equal(
    groundingV4.REPORT_GROUNDING_V4_VERSION,
    "m2-p4-report-grounding-v4",
  );
  assert.equal(
    groundingV4.REPORT_GROUNDING_V4_SAFE_ERROR,
    "M2_REPORT_GROUNDING_INTEGRITY_FAILED",
  );
  assert.equal(typeof groundingV4.buildRelationshipSummaryV4, "function");
  assert.equal(typeof groundingV4.groundSplitReportContentV4, "function");
  assert.equal(Object.hasOwn(groundingV4, "groundReportContentV4"), false);
  assert.deepEqual(contract.grounding_contract.exports, [
    "buildRelationshipSummaryV4",
    "groundSplitReportContentV4",
  ]);
  assert.deepEqual(contract.grounding_contract.not_exported, [
    "groundReportContentV4",
  ]);
  assert.deepEqual(contract.grounding_contract.future_integration_sequence, [
    "groundSplitReportContentV4",
    "groundChangeConditionCommentaryV3",
    "post-grounding validateStageOutput for PB-05",
  ]);
});

await check("grounding source owns only deterministic fields and no semantic rewriting", () => {
  assert.match(groundingSource, /structuredClone\(generatedReportContent\)/u);
  assert.match(groundingSource, /buildRelationshipSummaryV3/u);
  assert.match(groundingSource, /relationship_summary/u);
  assert.match(groundingSource, /message_temperature = null/u);
  assert.match(groundingSource, /message_draft_context = null/u);
  assert.doesNotMatch(groundingSource, /\.replace\s*\(/u);
  assert.doesNotMatch(groundingSource, /RegExp/u);
  assert.doesNotMatch(groundingSource, /sentiment/u);
  assert.doesNotMatch(groundingSource, /similarity/u);
  assert.doesNotMatch(groundingSource, /pipeline\.ts/u);
  assert.deepEqual(contract.grounding_contract.explicit_non_features, [
    "causal_connector_substring_stripping",
    "chronology_phrase_replacement",
    "sentiment_scoring",
    "semantic_similarity",
    "llm_like_rewriting",
    "regex_false_reassurance_generation",
    "meaning_based_paragraph_deletion",
  ]);
});

await check("positive grounding fixtures PASS 8/8 with exact preservation", () => {
  assert.equal(groundingCatalog.positive.length, 8);
  assert.equal(fixtures.counts.positive_grounding_fixtures, 8);
  assert.equal(contract.fixture_authority.positive_grounding_fixtures, 8);
  assert.equal(offlineResults.fixture_counts.positive_grounding, 8);
  assert.equal(
    new Set(groundingCatalog.positive.map((item) => item.fixture_id)).size,
    8,
  );
  for (const fixture of groundingCatalog.positive) {
    if (fixture.behavior === "relationship_summary") {
      const facts = decisionFacts(
        fixture.latest_direct_message.sender,
        fixture.latest_direct_message.user_reply_state,
      );
      const snapshot = JSON.stringify(facts);
      deepFreeze(facts);
      assert.equal(
        groundingV4.buildRelationshipSummaryV4(facts),
        groundingV3.buildRelationshipSummaryV3(facts),
        fixture.fixture_id,
      );
      assert.equal(JSON.stringify(facts), snapshot);
      continue;
    }

    const facts = decisionFacts();
    const plan = decisionPlan({
      factIds: fixture.decision_reason_fact_ids ?? ["F001", "F002", "F003"],
      draftText: fixture.draft_present === false ? null : undefined,
    });
    const report = generatedReport();

    if (fixture.behavior === "draft_text_preservation") {
      report.message_temperature = structuredClone(fixture.message_temperature);
      report.message_draft_context = fixture.message_draft_context;
    }
    if (fixture.behavior === "observed_fact_commentary") {
      report.observed_fact_commentary = structuredClone(
        fixture.observed_fact_commentary,
      );
    }
    if (fixture.behavior === "provider_text_preservation") {
      report.cover_line = fixture.preservation_values.cover_line;
      report.short_letter = [fixture.preservation_values.short_letter];
      report.observed_fact_commentary = [
        {
          fact_id: "F001",
          commentary: fixture.preservation_values.commentary,
        },
      ];
      report.message_draft_context =
        fixture.preservation_values.message_draft_context;
    }

    const factsSnapshot = JSON.stringify(facts);
    const planSnapshot = JSON.stringify(plan);
    const reportSnapshot = JSON.stringify(report);
    deepFreeze(facts);
    deepFreeze(plan);
    deepFreeze(report);
    const result = groundingV4.groundSplitReportContentV4(facts, plan, report);
    assert.equal(JSON.stringify(facts), factsSnapshot, fixture.fixture_id);
    assert.equal(JSON.stringify(plan), planSnapshot, fixture.fixture_id);
    assert.equal(JSON.stringify(report), reportSnapshot, fixture.fixture_id);
    assert.notStrictEqual(result, report, fixture.fixture_id);
    assert.notStrictEqual(result.short_letter, report.short_letter, fixture.fixture_id);
    assert.notStrictEqual(
      result.observed_fact_commentary,
      report.observed_fact_commentary,
      fixture.fixture_id,
    );
    assert.equal(
      result.relationship_summary,
      groundingV3.buildRelationshipSummaryV3(facts),
      fixture.fixture_id,
    );

    if (fixture.behavior === "draft_nullability") {
      assert.equal(result.message_temperature, null);
      assert.equal(result.message_draft_context, null);
    }
    if (fixture.behavior === "draft_text_preservation") {
      assert.deepEqual(result.message_temperature, fixture.message_temperature);
      assert.equal(result.message_draft_context, fixture.message_draft_context);
    }
    if (fixture.behavior === "observed_fact_commentary") {
      assert.deepEqual(
        result.observed_fact_commentary,
        fixture.observed_fact_commentary,
      );
    }
    if (fixture.behavior === "provider_text_preservation") {
      assert.equal(result.cover_line, fixture.preservation_values.cover_line);
      assert.equal(result.short_letter[0], fixture.preservation_values.short_letter);
      assert.equal(
        result.observed_fact_commentary[0].commentary,
        fixture.preservation_values.commentary,
      );
      assert.equal(
        result.message_draft_context,
        fixture.preservation_values.message_draft_context,
      );
    }
  }
});

await check("negative grounding fixtures reject fail-closed 6/6", () => {
  assert.equal(groundingCatalog.negative.length, 6);
  assert.equal(fixtures.counts.negative_grounding_fixtures, 6);
  assert.equal(contract.fixture_authority.negative_grounding_fixtures, 6);
  assert.equal(offlineResults.fixture_counts.negative_grounding, 6);
  assert.equal(
    new Set(groundingCatalog.negative.map((item) => item.fixture_id)).size,
    6,
  );
  for (const fixture of groundingCatalog.negative) {
    const facts = decisionFacts();
    const plan = decisionPlan();
    const report = generatedReport();
    let run;

    if (fixture.behavior === "duplicate_observed_fact_ids") {
      report.observed_fact_commentary = [
        { fact_id: "F001", commentary: "one" },
        { fact_id: "F001", commentary: "two" },
      ];
      run = () => groundingV4.groundSplitReportContentV4(facts, plan, report);
    } else if (
      fixture.behavior === "observed_fact_id_not_in_decision_reason_fact_ids"
    ) {
      report.observed_fact_commentary = [
        { fact_id: "F999", commentary: "not selected" },
      ];
      run = () => groundingV4.groundSplitReportContentV4(facts, plan, report);
    } else if (fixture.behavior === "malformed_latest_direct_message_sender") {
      facts.latest_direct_message.sender = "provider";
      run = () => groundingV4.buildRelationshipSummaryV4(facts);
    } else if (
      fixture.behavior === "accessor_property_attempts_source_mutation"
    ) {
      let accessorExecuted = false;
      Object.defineProperty(report, "relationship_summary", {
        configurable: true,
        enumerable: true,
        get() {
          accessorExecuted = true;
          report.cover_line = "mutated";
          return "mutation";
        },
      });
      run = () => {
        assertSafeReject(
          () => groundingV4.groundSplitReportContentV4(facts, plan, report),
          fixture.expected_safe_error,
        );
        assert.equal(accessorExecuted, false);
        assert.equal(report.cover_line, "確認できることから整えます。");
      };
    } else if (fixture.behavior === "inject_forbidden_authority_key") {
      plan[fixture.injected_key] = "raw candidate must not enter";
      run = () => groundingV4.groundSplitReportContentV4(facts, plan, report);
    } else if (fixture.behavior === "inject_forbidden_authority_keys") {
      for (const key of fixture.injected_keys) report[key] = { forbidden: true };
      run = () => groundingV4.groundSplitReportContentV4(facts, plan, report);
    } else {
      assert.fail(fixture.behavior);
    }

    if (fixture.behavior === "accessor_property_attempts_source_mutation") {
      run();
    } else {
      assertSafeReject(run, fixture.expected_safe_error);
    }
  }
});

await check("frozen E-R3 source manifest blobs hashes marker and authorization unchanged", () => {
  const adjudication = json(
    "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r2/adjudication-contract-v1.json",
  );
  assert.equal(adjudication.evidence_commit_b, evidenceCommitB);
  assert.equal(adjudication.source_manifest.length, 10);
  assert.equal(
    gitSucceeds(["merge-base", "--is-ancestor", evidenceCommitB, "HEAD"]),
    true,
  );
  for (const item of adjudication.source_manifest) {
    assert.equal(blobAt("HEAD", item.path), item.git_blob_sha, item.path);
    assert.equal(
      sha256Bytes(blobBytesAt("HEAD", item.path)),
      item.raw_sha256,
      item.path,
    );
  }
  const markerPath = absolute(adjudication.marker.path);
  assert.equal(existsSync(markerPath), true);
  assert.equal(
    sha256Bytes(readFileSync(markerPath)),
    adjudication.marker.raw_sha256,
  );
  const authorization = json(
    "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3/authorization-v1.json",
  );
  assert.equal(authorization.consumed, true);
  assert.equal(authorization.rerun_authorized, false);
});

await check("frozen E-R3 six-case regression remains historical and unreclassified", () => {
  const frozenCatalog = fixtures.fixture_catalog.frozen_evidence_regression;
  const results = json(frozenCatalog.source_path);
  assert.equal(frozenCatalog.evidence_commit_b, evidenceCommitB);
  assert.equal(results.machine_verdict, "FAIL");
  assert.equal(frozenCatalog.machine_verdict, "FAIL");
  assert.equal(frozenCatalog.cases.length, 6);

  for (const expected of frozenCatalog.cases) {
    const actual = results.cases.find((entry) => entry.case_id === expected.case_id);
    assert.ok(actual, expected.case_id);
    assert.equal(actual.final_result !== null, expected.final_result_present);
    if (expected.final_result_sha256) {
      assert.equal(
        sha256Json(actual.final_result),
        expected.final_result_sha256,
        expected.case_id,
      );
    }
    if (expected.eligibility) {
      assert.equal(actual.final_result?.eligibility, expected.eligibility);
    }
    if (expected.decision) {
      assert.equal(actual.final_result?.decision, expected.decision);
    }
    if (expected.safe_error_code) {
      assert.equal(actual.safe_error_code, expected.safe_error_code);
    }
  }

  const e01 = results.cases.find((entry) => entry.case_id === "E-R3-01");
  const expectedE01 = frozenCatalog.cases.find((entry) => entry.case_id === "E-R3-01");
  assert.equal(sha256Json(e01.final_result.report), expectedE01.final_report_sha256);
  assert.equal(
    sha256Json(e01.final_result.report.decisionPlan.recommended_message_draft.text),
    expectedE01.final_draft_sha256,
  );
  assert.equal(
    e01.final_result.report.decisionPlan.recommended_message_draft.text,
    e01.evidence.decision_plan.recommended_message_draft.text,
  );

  const e02 = results.cases.find((entry) => entry.case_id === "E-R3-02");
  assert.equal(e02.evidence.contact_constraint_policy.constraint_kind, "no_followup_message");
  assert.equal(e02.evidence.contact_constraint_policy.follow_up_exception, "none");
  assert.equal(e02.evidence.contact_constraint_policy.outbound_contact_now_allowed, false);
  assert.equal(
    e02.evidence.contact_constraint_policy.outbound_contact_after_time_passage_allowed,
    false,
  );
  assert.equal(e02.final_result.report.decisionPlan.recommended_message_draft, null);

  const e03 = results.cases.find((entry) => entry.case_id === "E-R3-03");
  assert.equal(e03.final_result.eligibility, "safety_blocked");
  assert.equal(e03.actual_stage_path.includes("PB-05"), false);
  assert.equal(e03.evidence.decision_plan, null);
  assert.equal(e03.evidence.grounded_report_content, null);

  const e04 = results.cases.find((entry) => entry.case_id === "E-R3-04");
  const expectedE04 = frozenCatalog.cases.find((entry) => entry.case_id === "E-R3-04");
  assert.ok(
    JSON.stringify(e04.evidence.grounded_report_content).includes(
      expectedE04.negative_example_fragment,
    ),
  );

  for (const caseId of ["E-R3-05", "E-R3-06"]) {
    const actual = results.cases.find((entry) => entry.case_id === caseId);
    assert.equal(actual.final_result, null);
    assert.equal(actual.safe_error_code, "M2_SEMANTIC_VALIDATION_FAILED");
  }
  const e06 = results.cases.find((entry) => entry.case_id === "E-R3-06");
  const expectedE06 = frozenCatalog.cases.find((entry) => entry.case_id === "E-R3-06");
  assert.ok(
    JSON.stringify(e06.evidence.grounded_report_content).includes(
      expectedE06.negative_example_fragment,
    ),
  );
  assert.equal(
    frozenCatalog.cases.find((entry) => entry.case_id === "E-R3-05")
      .accepted_final_product_reconstructed,
    false,
  );
  assert.equal(expectedE06.accepted_final_product_reconstructed, false);
});

await check("R2-A R1 R2-B R1 R2-C and Product Doctrine unchanged", () => {
  assert.equal(r2aR1Scope.length, 7);
  assert.equal(r2bR1Scope.length, 6);
  assert.equal(r2cScope.length, 6);
  assert.equal(doctrineScope.length, 7);
  for (const relativePath of [
    ...r2aR1Scope,
    ...r2bR1Scope,
    ...r2cScope,
    ...doctrineScope,
  ]) {
    assertUnchangedFromBaseline(relativePath);
  }
});

await check("PB-05 v2 v3 grounding v3 Pipeline Catalog Schema evaluator semantic UI unchanged", () => {
  for (const relativePath of protectedRuntimePaths) {
    assertUnchangedFromBaseline(relativePath);
  }
  assert.equal(
    blobAt(
      "HEAD",
      "scripts/lib/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-evaluator-v1.mjs",
    ),
    blobAt(
      evidenceCommitB,
      "scripts/lib/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-evaluator-v1.mjs",
    ),
  );
});

await check("grounding v4 is inactive and Active Runtime remains v4", () => {
  const pipelineSource = strictText("lib/assessment/runtime/pipeline.ts");
  const catalogSource = strictText("lib/assessment/runtime/schema-catalog.ts");
  const serviceSource = strictText("lib/assessment/runtime/service.ts");
  const activeCatalog = json(
    "lib/assessment/runtime/contracts/runtime-stage-catalog-v4.json",
  );
  assert.doesNotMatch(pipelineSource, /report-grounding-v4/u);
  assert.doesNotMatch(catalogSource, /pb-05-directional-report-v4/u);
  assert.doesNotMatch(catalogSource, /report-grounding-v4/u);
  assert.equal(activeCatalog.catalog_version, "runtime-stage-catalog-v4.0.0");
  assert.match(catalogSource, /runtime-stage-catalog-v4\.json/u);
  assert.match(serviceSource, /loadM2P4ProductQualityRuntimeStageCatalog/u);
  assert.equal(capabilities.active_runtime, "v4");
  assert.equal(capabilities.active_runtime_activated, false);
});

await check("no Provider network DB or Supabase imports or calls", () => {
  const forbiddenImports = [
    "openai",
    "@supabase/supabase-js",
    "node:http",
    "node:https",
    "node:net",
    "node:tls",
    "node:dns",
  ];
  for (const relativePath of [groundingPath, verifierPath]) {
    const source = strictText(relativePath);
    const imports = [
      ...source.matchAll(/(?:from\s+|import\s*\()["']([^"']+)["']/gu),
    ].map((match) => match[1]);
    for (const specifier of imports) {
      assert.equal(forbiddenImports.includes(specifier), false, specifier);
    }
    assert.doesNotMatch(source, /\bfetch\s*\(/u);
    assert.doesNotMatch(source, /responses\.create\s*\(/u);
    assert.doesNotMatch(source, /createClient\s*\(/u);
  }
  assert.equal(capabilities.provider_calls, 0);
  assert.equal(capabilities.db_operations, 0);
  assert.equal(capabilities.supabase_operations, 0);
  assert.equal(contract.operations.provider_calls, 0);
  assert.equal(contract.operations.db_operations, 0);
  assert.equal(contract.operations.supabase_operations, 0);
  assert.equal(fixtures.operations.provider_calls, 0);
  assert.equal(fixtures.operations.db_operations, 0);
  assert.equal(fixtures.operations.supabase_operations, 0);
  assert.equal(offlineResults.operations.provider_calls, 0);
  assert.equal(offlineResults.operations.db_operations, 0);
  assert.equal(offlineResults.operations.supabase_operations, 0);
});

await check("capabilities remain prompt-only and Package D onward unauthorized", () => {
  const expectedTrue = [
    "package_c_architecture_accepted",
    "grounding_v4_accepted_unchanged",
    "r2_customer_note_ui_accepted",
    "pb05_v3_actual_predecessor_recorded",
    "pb05_v3_parity_complete",
    "pb05_v3_parity_accepted",
    "no_followup_message_parity",
    "business_only_parity",
    "selected_request_coverage_parity",
    "product_voice_parity",
    "application_grounding_parity",
    "usable_outcome_parity",
    "commercial_output_boundary_parity",
    "existing_v4_precision_rules_preserved",
    "pb05_v4_prompt_complete",
    "report_grounding_v4_complete",
    "grounding_export_identity_aligned",
    "pb05_exact_input_authority_aligned",
    "observed_fact_commentary_grounding_contract_aligned",
    "unsupported_causality_contract_complete",
    "chronology_integrity_contract_complete",
    "explicit_fact_inference_separation_complete",
    "anxiety_safe_uncertainty_contract_complete",
    "consultation_specific_reassurance_contract_complete",
    "generic_aftercare_restriction_complete",
    "persona_draft_integrity_preserved",
    "frozen_evidence_unchanged",
    "prompt_contract_established",
  ];
  for (const key of expectedTrue) assert.equal(capabilities[key], true, key);
  assert.equal(capabilities.baseline, baseline);
  assert.equal(capabilities.exact_scope_updated, "7/7");
  assert.equal(capabilities.positive_wording_fixtures, 10);
  assert.equal(capabilities.negative_wording_fixtures, 10);
  assert.equal(capabilities.contract_alignment_positive_cases, 3);
  assert.equal(capabilities.contract_alignment_negative_cases, 3);
  assert.equal(capabilities.existing_responsibility_mutations_rejected, 11);
  assert.equal(capabilities.predecessor_parity_mutations_rejected, 7);
  assert.equal(capabilities.integration_alignment_mutations_rejected, 3);
  assert.equal(capabilities.prompt_mutations_total_rejected, 21);
  assert.equal(capabilities.total_prompt_mutations_rejected, 21);
  assert.equal(capabilities.positive_grounding_fixtures, 8);
  assert.equal(capabilities.negative_grounding_fixtures, 6);
  const expectedFalse = [
    "provider_quality_established",
    "package_d_authorized",
    "package_e_authorized",
    "package_f_authorized",
    "provider_rerun_authorized",
    "active_runtime_activated",
    "r4_authorized",
    "c2_authorized",
    "final_jpy980_readiness_established",
    "pull_request_created",
    "main_merged",
    "force_push_used",
  ];
  for (const key of expectedFalse) assert.equal(capabilities[key], false, key);
  assert.equal(
    capabilities.status,
    "pb05_precision_writing_contract_aligned_pending_human_chatgpt_review",
  );
  assert.equal(
    capabilities.next_action,
    "human_chatgpt_review_of_pb05_contract_alignment",
  );
});

await check("offline results establish Prompt contract not Provider quality", () => {
  assert.equal(contract.task_id, taskId);
  assert.equal(fixtures.task_id, taskId);
  assert.equal(offlineResults.task_id, taskId);
  assert.equal(capabilities.task_id, taskId);
  assert.equal(offlineResults.status, "PASS");
  assert.equal(offlineResults.capability_status, "prompt_contract_established");
  assert.equal(offlineResults.provider_quality_established, false);
  assert.equal(offlineResults.baseline, baseline);
  assert.equal(offlineResults.predecessor.git_blob_sha, expectedV3Blob);
  assert.equal(offlineResults.predecessor.sha256_canonical_utf8_lf, expectedV3Hash);
  assert.equal(offlineResults.predecessor.parity_matrix, "16/16 PASS");
  assert.equal(offlineResults.prompt.existing_v4_precision_responsibilities, "11/11 PASS");
  assert.equal(offlineResults.prompt.predecessor_parity_responsibilities, "7/7 PASS");
  assert.equal(offlineResults.prompt.existing_responsibility_mutation_rejections, "11/11 PASS");
  assert.equal(offlineResults.prompt.predecessor_parity_mutation_rejections, "7/7 PASS");
  assert.equal(offlineResults.prompt.integration_alignment_mutation_rejections, "3/3 PASS");
  assert.equal(offlineResults.prompt.total_independent_mutation_rejections, "21/21 PASS");
  assert.deepEqual(offlineResults.contract_alignment_results, {
    grounding_export_identity: "groundSplitReportContentV4",
    nonexistent_grounding_export_absent: "groundReportContentV4",
    future_integration_sequence: [
      "groundSplitReportContentV4",
      "groundChangeConditionCommentaryV3",
      "post-grounding validateStageOutput for PB-05",
    ],
    exact_pb05_inputs: exactPb05Inputs,
    decision_policy_result_direct_input: false,
    aggregate_safety_result_direct_input: false,
    upstream_policy_or_safety_recomputed_reinterpreted_or_overridden: false,
    observed_fact_ids_subset_of_decision_reason_fact_ids: true,
    observed_fact_ids_unique: true,
    zero_observed_fact_commentary_permitted: true,
    all_decision_reason_fact_ids_required: false,
    positive_cases: "3/3 PASS",
    negative_cases: "3/3 REJECT",
    offline_contract_checks_only: true,
    provider_compliance_proven: false,
  });
  assert.deepEqual(offlineResults.fixture_counts, {
    positive_wording: 10,
    negative_wording: 10,
    positive_contract_alignment: 3,
    negative_contract_alignment: 3,
    positive_grounding: 8,
    negative_grounding: 6,
    frozen_evidence_regression: 6,
  });
  assert.equal(offlineResults.frozen_evidence.machine_verdict, "FAIL");
  assert.equal(offlineResults.frozen_evidence.machine_verdict_reclassified, false);
  assert.equal(offlineResults.frozen_evidence.e_r3_05_accepted_final_reconstructed, false);
  assert.equal(offlineResults.frozen_evidence.e_r3_06_accepted_final_reconstructed, false);
});

await check("review document records exact outcome and authority limits", () => {
  const review = strictText(reviewPath);
  for (const phrase of [
    "PB-05 Grounding Name, Input Authority, and Fact-ID Contract Alignment",
    "PB-05 Directional Report — Developer Contract v4.0.0",
    "m2-p4-report-grounding-v4",
    "Exact correction scope: `7/7` updated",
    "actual immediate predecessor",
    expectedV3Blob,
    expectedV3Hash,
    expectedV4BaselineHash,
    expectedV4CorrectedHash,
    expectedGroundingV4Hash,
    "machine-readable matrix is `16/16` complete",
    "Positive / negative wording fixtures: `10 / 10`",
    "predecessor parity mutations: `7/7 REJECT`",
    "integration-alignment mutations: `3/3 REJECT`",
    "total: `21/21 REJECT`",
    "groundSplitReportContentV4",
    "groundChangeConditionCommentaryV3",
    "post-grounding `validateStageOutput` for PB-05",
    "exactly five inputs",
    "does not directly receive `decision_policy_result`, `aggregate_safety_result`",
    "Every `observed_fact_commentary.fact_id` must be unique",
    "positive: `CA-P01`",
    "`3/3 PASS`",
    "`3/3 REJECT`",
    "Positive / negative grounding fixtures: `8 / 6`",
    "Provider / DB / Supabase: `0 / 0 / 0`",
    "Provider quality established: `false`",
    "Active Runtime remains `v4`",
    "Final JPY 980 readiness established: `false`",
    "Package D is unauthorized",
    "R4 / C2: unauthorized / unauthorized",
    "No PR or main merge",
    "Human / ChatGPT review",
  ]) {
    assert.ok(review.includes(phrase), phrase);
  }
});

await check("git diff --check PASS", () => {
  execFileSync(
    "git.exe",
    [
      "-c",
      "safe.directory=C:/projects/moon-reply",
      "diff",
      "--check",
      baseline,
      "--",
    ],
    { cwd: root, encoding: "utf8", maxBuffer },
  );
  for (const relativePath of exactScope) {
    assert.doesNotMatch(strictText(relativePath), /[\t ]+$/gmu, relativePath);
  }
});

const failed = checks.filter((result) => !result.passed);
console.log("");
console.log(
  `PB-05 precision writing verifier: ${
    failed.length === 0 ? "PASS" : "FAIL"
  } ${checks.length - failed.length}/${checks.length}`,
);
console.log("Exact correction scope: 7/7 updated");
console.log("Prompt v4 responsibility mutations rejected: 11/11");
console.log("PB-05 v3 predecessor parity mutations rejected: 7/7");
console.log("Integration alignment mutations rejected: 3/3");
console.log("Total Prompt responsibility mutations rejected: 21/21");
console.log("Wording fixtures: positive 10/10; negative 10/10");
console.log("Contract alignment cases: positive 3/3; negative 3/3 rejected");
console.log("Grounding fixtures: positive 8/8; negative 6/6 rejected");
console.log("Frozen E-R3 regression: 6/6; machine verdict unchanged FAIL");
console.log("Provider / DB / Supabase: 0 / 0 / 0");
console.log("Provider quality established: false");

if (failed.length > 0) process.exit(1);
