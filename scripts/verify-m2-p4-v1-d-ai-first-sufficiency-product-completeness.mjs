import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { AssessmentApplication } from "../lib/assessment/runtime/application.ts";
import {
  projectBaseProviderInputV1,
} from "../lib/assessment/runtime/base-structured-intake-grounding-v1.ts";
import { groundBaseStructuredIntakeV3 } from "../lib/assessment/runtime/base-structured-intake-grounding-v3.ts";
import { groundCandidateAnalysisV2 } from "../lib/assessment/runtime/candidate-analysis-grounding-v2.ts";
import {
  clarificationSourceIdentityV1,
  createOpaqueClarificationIdV1,
  validateClarificationAnswerV1,
} from "../lib/assessment/runtime/clarification-evidence-v1.ts";
import { groundClarificationEvidenceV1 } from "../lib/assessment/runtime/clarification-grounding-v1.ts";
import { validateClarificationSourceIntegrityV1 } from "../lib/assessment/runtime/clarification-source-integrity-v1.ts";
import { projectCustomerAssessmentExperienceV2 } from "../lib/assessment/runtime/customer-assessment-experience-projection-v2.ts";
import { buildEffectiveAssessmentAuthorityV1 } from "../lib/assessment/runtime/effective-assessment-authority-v1.ts";
import { validateEffectiveAssessmentAuthorityIntegrityV1 } from "../lib/assessment/runtime/effective-assessment-authority-integrity-v1.ts";
import { buildEffectiveDecisionPolicyV1 } from "../lib/assessment/runtime/effective-decision-policy-v1.ts";
import { M2RuntimeError } from "../lib/assessment/runtime/errors.ts";
import {
  FakeAiStageTransport,
  FakeAssessmentRepository,
} from "../lib/assessment/runtime/fakes.ts";
import { evaluateJpy980InputSufficiencyV2 } from "../lib/assessment/runtime/jpy980-input-sufficiency-policy-v2.ts";
import {
  evaluateJpy980InputSufficiencyV3,
  JPY980_INPUT_SUFFICIENCY_POLICY_V3_VERSION,
  JPY980_INPUT_SUFFICIENCY_RESULT_V3_SCHEMA_VERSION,
} from "../lib/assessment/runtime/jpy980-input-sufficiency-policy-v3.ts";
import { loadM2P4SentMessageDraftBoundaryRuntimeStageCatalog } from "../lib/assessment/runtime/schema-catalog.ts";
import {
  buildSelectedRequestProductCompletenessReassessmentDirectiveV1,
  evaluateSelectedRequestProductCompletenessV1,
  SELECTED_REQUEST_PRODUCT_COMPLETENESS_INVALID_SAFE_CODE,
} from "../lib/assessment/runtime/selected-request-product-completeness-v1.ts";
import {
  buildAbsentCandidateLaneV1,
  buildAvailableCandidateLaneV1,
} from "../lib/assessment/runtime/split-analysis-envelope-v1.ts";
import {
  selectV1DProductReviewFixture,
} from "../lib/assessment/runtime/review/m2-p4-v15-product-rereview-fixtures.ts";

const root = process.cwd();
const baseline = "a02f8bb14232c5bd306aed23737846c8ea305a5b";
const expectedBranch =
  "fix/m2-p4-v1-d-ai-first-sufficiency-product-completeness";
const expectedSubject = "fix: trust grounded AI consultation meaning";
const packageRoot =
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-v1-d";
const executionRoot = `${packageRoot}/controlled-provider-executions`;
const verifierPath =
  "scripts/verify-m2-p4-v1-d-ai-first-sufficiency-product-completeness.mjs";
const taskRecordPath =
  "docs/phase2/TASK_M2_P4_V1_D_AI_FIRST_FUNCTIONAL_SUFFICIENCY_PRODUCT_COMPLETENESS.md";

const updatedPaths = [
  "lib/assessment/runtime/pipeline.ts",
  "lib/assessment/runtime/quality-reassessment-v1.ts",
  "lib/assessment/runtime/fakes.ts",
  "docs/CURRENT_FOCUS.md",
  "docs/CODEX_HANDOFF.md",
  "docs/WBS.md",
];
const newPaths = [
  "lib/assessment/runtime/jpy980-input-sufficiency-policy-v3.ts",
  "lib/assessment/runtime/selected-request-product-completeness-v1.ts",
  verifierPath,
  taskRecordPath,
];
const exactScope = [...updatedPaths, ...newPaths];

const actualDirectories = {
  ordinary_reply_waiting:
    "2026-08-18-case1-ordinary-reply-waiting-v16-bc973d02",
  administrative_reply_with_tone_concern_ready_candidate:
    "2026-08-18-case2-admin-tone-v16-86a11f59",
  reply_waiting_with_usual_cadence:
    "2026-08-18-case3-reply-cadence-v16-86a11f59",
  draft_request_with_relationship_intent:
    "2026-08-18-case4-draft-intent-v16-86a11f59",
  polite_thank_you_with_draft:
    "2026-08-18-case5-polite-draft-v16-86a11f59",
  kansai_persona_draft:
    "2026-08-18-case6-kansai-draft-v16-86a11f59",
  alternative_tradeoff_applicable:
    "2026-08-18-case7-tradeoff-applicable-v16-86a11f59",
  alternative_tradeoff_not_applicable:
    "2026-08-18-case8-tradeoff-none-v16-86a11f59",
  one_clarification_answer_becomes_ready:
    "2026-08-18-case9-one-clarification-v16-86a11f59",
};

const readyActualCaseIds = Object.keys(actualDirectories).slice(0, 8);
const case9Id = "one_clarification_answer_becomes_ready";
const politeCandidate =
  "今日はありがとうございました。お話しできてうれしかったです。";
const kansaiCandidate = "おっけー、土曜ならいけるで！\nまた時間おしえて〜😊";
const case4Candidate =
  "昨日はありがとう。話せてうれしかった。また都合が合うときに話せたらうれしいです。";

function git(args) {
  return execFileSync(
    "git.exe",
    ["-c", "safe.directory=C:/projects/moon-reply", ...args],
    {
      cwd: root,
      encoding: "utf8",
      maxBuffer: 512 * 1024 * 1024,
    },
  ).trim();
}

function readText(relativePath) {
  return new TextDecoder("utf-8", { fatal: true }).decode(
    readFileSync(path.join(root, relativePath)),
  );
}

function readJson(relativePath) {
  return JSON.parse(readText(relativePath));
}

function sorted(values) {
  return [...values].sort((left, right) => left.localeCompare(right));
}

function blob(revision, relativePath) {
  return git(["rev-parse", `${revision}:${relativePath}`]);
}

function worktreeBlob(relativePath) {
  return git(["hash-object", `--path=${relativePath}`, relativePath]);
}

function treeFiles(revision, relativePath) {
  return git(["ls-tree", "-r", "--name-only", revision, relativePath])
    .split(/\r?\n/u)
    .filter(Boolean)
    .map((entry) => entry.replaceAll("\\", "/"));
}

function assertTreeByteIdentical(relativePath) {
  const files = treeFiles(baseline, relativePath);
  assert.ok(files.length > 0, relativePath);
  for (const file of files) {
    assert.equal(worktreeBlob(file), blob(baseline, file), file);
  }
}

function collectScope() {
  const tracked = git(["diff", "--name-status", "--no-renames", baseline, "--"])
    .split(/\r?\n/u)
    .filter(Boolean)
    .map((line) => {
      const [status, relativePath] = line.split("\t");
      return { status, path: relativePath.replaceAll("\\", "/") };
    });
  const trackedPaths = new Set(tracked.map((entry) => entry.path));
  const untracked = git(["ls-files", "--others", "--exclude-standard"])
    .split(/\r?\n/u)
    .filter(Boolean)
    .map((entry) => entry.replaceAll("\\", "/"))
    .filter((entry) => !trackedPaths.has(entry))
    .map((entry) => ({ status: "A", path: entry }));
  return [...tracked, ...untracked];
}

function safeCode(error) {
  return error instanceof M2RuntimeError ? error.safeCode : null;
}

function overlay(base, patch) {
  if (
    typeof patch !== "object" ||
    patch === null ||
    Array.isArray(patch)
  ) {
    return structuredClone(patch);
  }
  const result =
    typeof base === "object" && base !== null && !Array.isArray(base)
      ? structuredClone(base)
      : {};
  for (const [key, value] of Object.entries(patch)) {
    result[key] =
      typeof value === "object" && value !== null && !Array.isArray(value)
        ? overlay(result[key], value)
        : structuredClone(value);
  }
  return result;
}

function ids() {
  let index = 0;
  return () =>
    `00000000-0000-4000-8000-${String(++index).padStart(12, "0")}`;
}

const controlledInputs = readJson(`${packageRoot}/controlled-provider-inputs-v1.json`);
const routingFixtures = readJson(
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-v1-a1/routing-fixtures-v1.json",
);

function controlledInput(fixtureId) {
  const selected = controlledInputs.cases.find(
    (entry) => entry.fixture_id === fixtureId,
  );
  assert.ok(selected, fixtureId);
  return selected;
}

function actualEvidence(fixtureId) {
  const directory = actualDirectories[fixtureId];
  assert.ok(directory, fixtureId);
  const stageEvidence = readJson(
    `${executionRoot}/${directory}/v16-stage-attempt-results-v1.json`,
  );
  const stage = (stageId) => {
    const selected = stageEvidence.stage_attempts.find(
      (entry) => entry.stageId === stageId && entry.attemptNumber === 1,
    );
    assert.ok(selected, `${fixtureId}:${stageId}`);
    return selected;
  };
  return {
    fixture: controlledInput(fixtureId),
    directory,
    stageEvidence,
    stage,
  };
}

function groundedActualAuthority(fixtureId) {
  const evidence = actualEvidence(fixtureId);
  const request = evidence.fixture.assessment_input;
  const baseProviderInput = projectBaseProviderInputV1(request);
  const baseStructuredIntake = groundBaseStructuredIntakeV3(
    baseProviderInput,
    evidence.stage("PB-01").outputJson,
  );
  let candidateLane = buildAbsentCandidateLaneV1();
  if (request.optionalMessage !== null) {
    const candidate = groundCandidateAnalysisV2(
      evidence.stage("PB-01C").outputJson,
    );
    candidateLane = buildAvailableCandidateLaneV1(
      candidate.candidate_analysis,
      candidate.candidate_safety_result,
    );
  }
  assert.equal(evidence.stage("PB-02").outputJson.classification, "normal_allowed");
  const effectiveAuthority = buildEffectiveAssessmentAuthorityV1({
    baseStructuredIntake,
    candidateEnvelope: candidateLane.candidate_envelope,
    clarificationGrounding: null,
  });
  validateEffectiveAssessmentAuthorityIntegrityV1({
    authority: effectiveAuthority,
    baseStructuredIntake,
    candidateEnvelope: candidateLane.candidate_envelope,
    clarificationGrounding: null,
  });
  return {
    ...evidence,
    request,
    baseStructuredIntake,
    candidateLane,
    effectiveAuthority,
  };
}

function policyInput(authority, clarificationGrounding = null, safety = "normal_allowed") {
  const effectiveAssessmentAuthority =
    clarificationGrounding === null
      ? authority.effectiveAuthority
      : buildEffectiveAssessmentAuthorityV1({
          baseStructuredIntake: authority.baseStructuredIntake,
          candidateEnvelope: authority.candidateLane.candidate_envelope,
          clarificationGrounding,
        });
  validateEffectiveAssessmentAuthorityIntegrityV1({
    authority: effectiveAssessmentAuthority,
    baseStructuredIntake: authority.baseStructuredIntake,
    candidateEnvelope: authority.candidateLane.candidate_envelope,
    clarificationGrounding,
  });
  return {
    basePolicyInput: {
      aggregateSafety: { classification: safety },
      baseStructuredIntake: authority.baseStructuredIntake,
      decisionFacts: authority.baseStructuredIntake.decision_facts,
      baseWritingSignals: authority.baseStructuredIntake.base_writing_signals,
    },
    clarificationGrounding,
    effectiveAssessmentAuthority,
  };
}

function evaluateActual(fixtureId) {
  const authority = groundedActualAuthority(fixtureId);
  return {
    authority,
    route: evaluateJpy980InputSufficiencyV3(policyInput(authority)),
  };
}

function clarificationGrounding(initialRoute, answer, fixedClock, entropyByte) {
  assert.ok(initialRoute.clarification);
  const clarificationId = createOpaqueClarificationIdV1(
    new Uint8Array(32).fill(entropyByte),
  );
  const validated = validateClarificationAnswerV1({
    target: initialRoute.clarification.target,
    answer,
    resumeStartedAt: fixedClock,
  });
  const sourceIdentity = clarificationSourceIdentityV1(clarificationId);
  const evidence = {
    schemaVersion: "m2-p4-clarification-evidence-v1",
    clarificationId,
    ordinal: 1,
    questionCode: initialRoute.clarification.code,
    target: initialRoute.clarification.target,
    questionSnapshot: initialRoute.clarification.question,
    answer: validated.validatedAnswer,
    provenance: "user_clarification",
    sourceIdentity,
    groundedNormalizedRepresentation:
      validated.groundedNormalizedRepresentation,
    canonicalAnswer: validated.canonicalAnswer,
    answerFingerprint: validated.answerFingerprint,
    resolvesTarget: validated.resolvesTarget,
  };
  const grounding = groundClarificationEvidenceV1({
    evidence,
    providerOutput: {
      schema_version: "pipeline-schema-clarification-grounding-v1.0.0",
      target: evidence.target,
      source_identity: sourceIdentity,
      answer_fingerprint: evidence.answerFingerprint,
      materially_resolves_target: evidence.resolvesTarget,
      clarification_safety_result: {
        classification: "normal_allowed",
        reason_codes: [],
        response_mode: "none",
      },
    },
  });
  validateClarificationSourceIntegrityV1({ evidence, grounding });
  return grounding;
}

function baseFixture(scenario, patch = {}) {
  return overlay(
    overlay(
      routingFixtures.base_structured_intake_template,
      routingFixtures.scenario_patches[scenario],
    ),
    patch,
  );
}

function authorityFromGroundedBase(
  baseStructuredIntake,
  candidateLane = buildAbsentCandidateLaneV1(),
) {
  const effectiveAuthority = buildEffectiveAssessmentAuthorityV1({
    baseStructuredIntake,
    candidateEnvelope: candidateLane.candidate_envelope,
    clarificationGrounding: null,
  });
  return {
    baseStructuredIntake,
    candidateLane,
    effectiveAuthority,
  };
}

function routeGroundedBase(base, candidateLane, safety = "normal_allowed") {
  const authority = authorityFromGroundedBase(base, candidateLane);
  return {
    authority,
    route: evaluateJpy980InputSufficiencyV3(
      policyInput(authority, null, safety),
    ),
  };
}

function correctedCandidateMetadata() {
  return {
    source_status: "candidate_preserved",
    preserved_meaning: true,
    style_delta: [],
    communicative_intent_delta: {
      gratitude_change: "unchanged",
      apology_change: "unchanged",
      question_count_delta: 0,
      invitation_presence_delta: "unchanged_present",
      invitation_specificity_delta: "unchanged",
      affection_strength_delta: "unchanged",
      commitment_strength_delta: "unchanged",
      response_pressure_delta: "unchanged",
      boundary_strength_delta: "unchanged",
      closure_intent_delta: "unchanged_present",
      practical_requirement_fulfillment: "not_applicable",
    },
    change_reasons: ["no_change_needed"],
    change_summary: null,
  };
}

function stagesFor(repository, stageId) {
  return [...repository.stageRuns.values()]
    .filter((stage) => stage.stageId === stageId)
    .sort((left, right) => left.attemptNumber - right.attemptNumber);
}

let checks = 0;
const failures = [];
async function check(name, callback) {
  try {
    await callback();
    checks += 1;
    console.log(`PASS ${String(checks).padStart(2, "0")} ${name}`);
  } catch (error) {
    failures.push({ name, error });
    console.error(`FAIL ${name}`);
    console.error(error);
  }
}

await check("exact branch, parent, subject mode, and ten-path scope", () => {
  assert.equal(git(["branch", "--show-current"]), expectedBranch);
  const head = git(["rev-parse", "HEAD"]);
  if (head === baseline) {
    assert.equal(git(["rev-list", "--count", `${baseline}..HEAD`]), "0");
  } else {
    assert.equal(git(["rev-parse", "HEAD^"]), baseline);
    assert.equal(git(["show", "-s", "--format=%s", "HEAD"]), expectedSubject);
  }
  const scope = collectScope();
  assert.deepEqual(sorted(scope.map((entry) => entry.path)), sorted(exactScope));
  for (const entry of scope) {
    assert.equal(
      entry.status,
      newPaths.includes(entry.path) ? "A" : "M",
      entry.path,
    );
  }
});

await check("V1 and V2 historical policies remain byte-identical", () => {
  for (const relativePath of [
    "lib/assessment/runtime/jpy980-input-sufficiency-policy-v1.ts",
    "lib/assessment/runtime/jpy980-input-sufficiency-policy-v2.ts",
  ]) {
    assert.equal(worktreeBlob(relativePath), blob(baseline, relativePath));
  }
  const pipeline = readText("lib/assessment/runtime/pipeline.ts");
  assert.match(
    pipeline,
    /promptBundleVersion ===\s*"prompt-bundle-runtime-v16\.0\.0"[\s\S]+evaluateJpy980InputSufficiencyV3\(policyInput\)[\s\S]+evaluateJpy980InputSufficiencyV2\(policyInput\)/u,
  );
});

await check("V3 is structured-authority-only and contains no production case branch", () => {
  const source = readText(
    "lib/assessment/runtime/jpy980-input-sufficiency-policy-v3.ts",
  );
  assert.equal(
    JPY980_INPUT_SUFFICIENCY_POLICY_V3_VERSION,
    "m2-p4-jpy980-input-sufficiency-policy-v3",
  );
  assert.equal(
    JPY980_INPUT_SUFFICIENCY_RESULT_V3_SCHEMA_VERSION,
    "m2-p4-jpy980-input-sufficiency-result-v3",
  );
  assert.doesNotMatch(source, /fixtureId|caseId|currentSituation|optionalMessage/u);
  assert.doesNotMatch(source, /ordinary_reply_waiting|kansai_persona_draft/u);
  assert.doesNotMatch(source, /\.statement\b|RegExp|embedding|keyword/u);
  assert.match(source, /effectiveAssessmentAuthority/u);
  assert.match(source, /candidateEnvelope/u);
});

const actualRoutes = new Map();
for (const fixtureId of readyActualCaseIds) {
  await check(`actual ${fixtureId} routes full_paid_ready_candidate`, () => {
    const evaluated = evaluateActual(fixtureId);
    actualRoutes.set(fixtureId, evaluated);
    assert.equal(evaluated.route.state, "full_paid_ready_candidate");
    assert.equal(evaluated.route.clarification, null);
    assert.deepEqual(evaluated.route.missingMaterialDimensions, []);
  });
}

let case9Evaluation;
let case9Grounding;
await check("actual Case 9 asks latest_contact_timing exactly once", () => {
  case9Evaluation = evaluateActual(case9Id);
  actualRoutes.set(case9Id, case9Evaluation);
  assert.equal(case9Evaluation.route.state, "needs_one_clarifying_answer");
  assert.equal(
    case9Evaluation.route.clarification.target,
    "latest_contact_timing",
  );
  assert.deepEqual(case9Evaluation.route.missingMaterialDimensions, [
    "latest_contact_timing",
  ]);
  assert.equal(case9Evaluation.route.clarificationBudget.maximumQuestionsTotal, 1);
  assert.equal(case9Evaluation.route.clarificationBudget.questionsRemaining, 1);
  assert.notEqual(
    case9Evaluation.route.clarification.target,
    "material_relationship_or_communication_concern",
  );
});

await check("Case 9 frozen answer closes timing and cadence dependency without question 2", () => {
  const answer =
    case9Evaluation.authority.fixture.clarification.answer_payload;
  assert.deepEqual(answer, {
    kind: "elapsed_bucket",
    value: "six_to_24_hours",
  });
  case9Grounding = clarificationGrounding(
    case9Evaluation.route,
    answer,
    case9Evaluation.authority.fixture.fixed_clock,
    9,
  );
  const resumed = evaluateJpy980InputSufficiencyV3(
    policyInput(case9Evaluation.authority, case9Grounding),
  );
  assert.equal(resumed.state, "full_paid_ready_candidate");
  assert.equal(resumed.clarification, null);
  assert.equal(resumed.clarificationBudget.questionsAlreadyUsed, 1);
  assert.equal(resumed.clarificationBudget.questionsRemaining, 0);
  assert.notEqual(resumed.state, "needs_one_clarifying_answer");
});

await check("simple business and sparse administrative requests still ask one material question", () => {
  const simple = baseFixture("routine_administrative_reply", {
    decision_facts: {
      selected_requests: ["draft_message", "decide_send_or_wait"],
    },
  });
  const sparse = baseFixture("routine_administrative_reply", {
    decision_facts: { selected_requests: ["draft_message"] },
  });
  for (const base of [simple, sparse]) {
    const evaluated = routeGroundedBase(base, buildAbsentCandidateLaneV1());
    assert.equal(evaluated.route.state, "needs_one_clarifying_answer");
    assert.equal(
      evaluated.route.clarification.target,
      "material_relationship_or_communication_concern",
    );
  }
});

let waitingWithoutTiming;
await check("reply waiting without timeline asks only latest_contact_timing", () => {
  const base = baseFixture("reply_waiting_sufficient", {
    decision_facts: {
      contact_state: { elapsed_since_latest_user_message_minutes: null },
      information_state: {
        unresolved_fields: [
          "contact_state.elapsed_since_latest_user_message_minutes",
        ],
      },
    },
  });
  waitingWithoutTiming = routeGroundedBase(
    base,
    buildAbsentCandidateLaneV1(),
  );
  assert.equal(
    waitingWithoutTiming.route.state,
    "needs_one_clarifying_answer",
  );
  assert.equal(
    waitingWithoutTiming.route.clarification.target,
    "latest_contact_timing",
  );
  assert.deepEqual(waitingWithoutTiming.route.missingMaterialDimensions, [
    "latest_contact_timing",
  ]);
});

await check("one non-resolving answer routes out and cannot trigger question 2", () => {
  const grounding = clarificationGrounding(
    waitingWithoutTiming.route,
    { kind: "unknown" },
    "2026-08-18T12:00:00.000Z",
    7,
  );
  const resumed = evaluateJpy980InputSufficiencyV3(
    policyInput(waitingWithoutTiming.authority, grounding),
  );
  assert.equal(resumed.state, "not_full_product_candidate");
  assert.equal(resumed.clarification, null);
  assert.equal(resumed.clarificationBudget.questionsAlreadyUsed, 1);
  assert.equal(resumed.clarificationBudget.questionsRemaining, 0);
});

await check("emotion-only and anxiety-heavy sparse facts remain not full", () => {
  const sparse = baseFixture("reply_waiting_sufficient", {
    observed_facts: [],
    user_emotions: [
      {
        item_id: "M001",
        statement: "不安が強い。",
        source_refs: ["input:current_situation"],
      },
    ],
    decision_facts: {
      latest_direct_message: {
        sender: "unknown",
        kind: "unknown",
        response_expectation: "unknown",
        user_reply_state: "unknown",
        sns_signal_only: false,
      },
      contact_state: {
        unanswered_user_message_count: null,
        elapsed_since_latest_user_message_minutes: null,
        usual_cadence_relation: "unknown",
      },
      information_state: {
        unresolved_fields: [
          "latest_direct_message.sender",
          "latest_direct_message.kind",
          "latest_direct_message.response_expectation",
          "latest_direct_message.user_reply_state",
          "contact_state.unanswered_user_message_count",
          "contact_state.elapsed_since_latest_user_message_minutes",
          "contact_state.usual_cadence_relation",
        ],
      },
    },
    base_writing_signals: {
      user_goal_detail: { value: "other", basis: "requested_topics" },
      communication_pattern: {
        usual_register: "unknown",
        usual_length: "unknown",
        usual_emoji_pattern: "unknown",
        usual_response_cadence_summary: null,
        usual_initiator: "unknown",
        reciprocal_style_summary: null,
        basis: "unresolved",
      },
    },
  });
  const evaluated = routeGroundedBase(sparse, buildAbsentCandidateLaneV1());
  assert.equal(evaluated.route.state, "not_full_product_candidate");
  assert.ok(
    evaluated.route.missingMaterialDimensions.includes("grounded_evidence"),
  );
});

await check("Candidate alone and message-impact without Candidate cannot become paid-ready", () => {
  const candidateLane =
    actualRoutes.get("draft_request_with_relationship_intent").authority
      .candidateLane;
  const candidateOnly = baseFixture("draft_tone_missing", {
    observed_facts: [],
    user_emotions: [],
    decision_facts: {
      selected_requests: ["draft_message", "message_impact"],
    },
    base_writing_signals: {
      user_goal_detail: { value: "unknown", basis: "unresolved" },
      explicit_user_constraints: [],
    },
  });
  const candidateOnlyRoute = routeGroundedBase(candidateOnly, candidateLane);
  assert.equal(candidateOnlyRoute.route.state, "not_full_product_candidate");

  const requestedTopicOnly = baseFixture("draft_tone_missing", {
    decision_facts: {
      selected_requests: ["message_impact"],
      latest_direct_message: {
        sender: "unknown",
        kind: "unknown",
        response_expectation: "unknown",
        user_reply_state: "unknown",
        sns_signal_only: false,
      },
    },
    base_writing_signals: {
      user_goal_detail: { value: "other", basis: "requested_topics" },
      explicit_user_constraints: [],
      incoming_message_profile: {
        dialogue_acts: [],
        unanswered_obligations: [],
        practical_requirements: [],
        closure_signal: "unknown",
        response_expectation: "unknown",
        present: false,
      },
    },
  });
  const requestedTopicOnlyRoute = routeGroundedBase(
    requestedTopicOnly,
    candidateLane,
  );
  assert.notEqual(
    requestedTopicOnlyRoute.route.state,
    "full_paid_ready_candidate",
  );
  assert.ok(
    requestedTopicOnlyRoute.route.missingMaterialDimensions.includes(
      "material_relationship_or_communication_concern",
    ),
  );

  const noCandidate = baseFixture("draft_material", {
    decision_facts: {
      selected_requests: ["message_impact", "relationship"],
    },
  });
  const noCandidateRoute = routeGroundedBase(
    noCandidate,
    buildAbsentCandidateLaneV1(),
  );
  assert.equal(noCandidateRoute.route.state, "not_full_product_candidate");
  assert.ok(
    noCandidateRoute.route.missingMaterialDimensions.includes(
      "candidate_analysis",
    ),
  );
});

await check("Safety remains first and non-normal classification blocks", () => {
  const authority = actualRoutes.get("ordinary_reply_waiting").authority;
  const blocked = evaluateJpy980InputSufficiencyV3(
    policyInput(authority, null, "needs_review"),
  );
  assert.equal(blocked.state, "safety_blocked");
  assert.deepEqual(blocked.missingMaterialDimensions, []);
});

await check("Base, Candidate, and Clarification provenance remain isolated", () => {
  const case6 = actualRoutes.get("kansai_persona_draft").authority;
  assert.equal(case6.candidateLane.candidate_envelope.presence, true);
  assert.doesNotMatch(JSON.stringify(case6.baseStructuredIntake), /土曜ならいけるで/u);
  assert.deepEqual(case6.effectiveAuthority.sourceMap, []);
  const resumedInput = policyInput(case9Evaluation.authority, case9Grounding);
  assert.ok(resumedInput.effectiveAssessmentAuthority.sourceMap.length > 0);
  assert.equal(
    resumedInput.effectiveAssessmentAuthority.sourceMap.every(
      (entry) =>
        entry.sourceLane === "clarification" &&
        entry.sourceRef === case9Grounding.sourceIdentity &&
        entry.clarificationTarget === "latest_contact_timing",
    ),
    true,
  );
  const conflicted = structuredClone(resumedInput);
  conflicted.effectiveAssessmentAuthority.clarificationAuthorityRef =
    "clarification:wrong:answer:1";
  assert.throws(
    () => evaluateJpy980InputSufficiencyV3(conflicted),
    (error) => safeCode(error) === "M2_JPY980_INPUT_SUFFICIENCY_POLICY_INVALID",
  );
});

let correctedCase4Plan;
let correctedCase4Report;
let case4Completeness;
await check("actual Case 4 attempt 1 yields three deterministic completeness defects", () => {
  const actual = actualRoutes.get("draft_request_with_relationship_intent");
  assert.equal(actual.authority.request.optionalMessage, case4Candidate);
  const decisionPlan = structuredClone(actual.authority.stage("PB-04").outputJson);
  const reportContent = structuredClone(actual.authority.stage("PB-05").outputJson);
  const semantic = actual.authority.stage("PB-06").outputJson;
  assert.equal(decisionPlan.recommended_message_draft, null);
  assert.equal(decisionPlan.message_draft_edit_metadata, null);
  assert.equal(reportContent.message_temperature, null);
  assert.equal(reportContent.message_draft_context, null);
  assert.deepEqual(semantic.semantic_checks, []);
  const effectivePolicy = buildEffectiveDecisionPolicyV1({
    authority: actual.authority.effectiveAuthority,
    candidateEnvelope: actual.authority.candidateLane.candidate_envelope,
  });
  case4Completeness = evaluateSelectedRequestProductCompletenessV1({
    requestedTopics: actual.authority.request.requestedTopics,
    candidateEnvelope: actual.authority.candidateLane.candidate_envelope,
    effectiveDecisionPolicy: effectivePolicy,
    decisionPlan,
    reportContent,
  });
  assert.equal(case4Completeness.complete, false);
  assert.deepEqual(
    case4Completeness.defects.map((entry) => entry.code).sort(),
    [
      "REQUESTED_DRAFT_EDIT_METADATA_MISSING",
      "REQUESTED_DRAFT_MISSING",
      "REQUESTED_MESSAGE_TEMPERATURE_MISSING",
    ],
  );
  const directive =
    buildSelectedRequestProductCompletenessReassessmentDirectiveV1(
      case4Completeness,
    );
  assert.equal(directive.scope, "plan_and_report");
  assert.equal(directive.source, "local_selected_request_completeness");
  assert.equal(directive.defects.length, 3);

  correctedCase4Plan = structuredClone(decisionPlan);
  correctedCase4Plan.recommended_message_draft = {
    text: case4Candidate,
    policy: "later_only",
    use_timing: "later",
  };
  correctedCase4Plan.message_draft_edit_metadata =
    correctedCandidateMetadata();
  correctedCase4Report = structuredClone(reportContent);
  correctedCase4Report.message_temperature = {
    softness: "候補文は感謝を先に置き、やわらかい温度です。",
    affection: "また話したい意図を、断定せずに伝えています。",
    pressure: "返答や次の約束を求めないため、返信圧は抑えられています。",
    adjustment: "Candidateを変更せず、送る時期だけを後で再確認します。",
  };
});

await check("completeness scope is report_only for temperature alone", () => {
  const actual = actualRoutes.get("draft_request_with_relationship_intent");
  const effectivePolicy = buildEffectiveDecisionPolicyV1({
    authority: actual.authority.effectiveAuthority,
    candidateEnvelope: actual.authority.candidateLane.candidate_envelope,
  });
  const temperatureOnly = evaluateSelectedRequestProductCompletenessV1({
    requestedTopics: actual.authority.request.requestedTopics,
    candidateEnvelope: actual.authority.candidateLane.candidate_envelope,
    effectiveDecisionPolicy: effectivePolicy,
    decisionPlan: correctedCase4Plan,
    reportContent: actual.authority.stage("PB-05").outputJson,
  });
  const directive =
    buildSelectedRequestProductCompletenessReassessmentDirectiveV1(
      temperatureOnly,
    );
  assert.equal(directive.scope, "report_only");
  assert.deepEqual(directive.defects.map((entry) => entry.jsonPath), [
    "report_content.message_temperature",
  ]);
});

await check("contact boundary keeps a prohibited draft null without blocking Ready", () => {
  const base = baseFixture("draft_tone_missing", {
    decision_facts: {
      selected_requests: ["draft_message"],
      boundary_state: {
        kind: "no_contact",
        status: "explicit",
        repeated_unanswered_contact: false,
      },
    },
  });
  const routed = routeGroundedBase(base, buildAbsentCandidateLaneV1());
  assert.equal(routed.route.state, "full_paid_ready_candidate");
  const effectivePolicy = buildEffectiveDecisionPolicyV1({
    authority: routed.authority.effectiveAuthority,
    candidateEnvelope: routed.authority.candidateLane.candidate_envelope,
  });
  assert.equal(effectivePolicy.policy.message_draft_policy, "not_allowed");
  const actual = actualRoutes.get("draft_request_with_relationship_intent");
  const completeness = evaluateSelectedRequestProductCompletenessV1({
    requestedTopics: ["draft_message"],
    candidateEnvelope: routed.authority.candidateLane.candidate_envelope,
    effectiveDecisionPolicy: effectivePolicy,
    decisionPlan: actual.authority.stage("PB-04").outputJson,
    reportContent: actual.authority.stage("PB-05").outputJson,
  });
  assert.equal(completeness.complete, true);
  assert.deepEqual(completeness.defects, []);
});

await check("message-impact completeness checker rejects absent Candidate", () => {
  const actual = actualRoutes.get("draft_request_with_relationship_intent");
  const absent = buildAbsentCandidateLaneV1().candidate_envelope;
  const absentPolicy = buildEffectiveDecisionPolicyV1({
    authority: buildEffectiveAssessmentAuthorityV1({
      baseStructuredIntake: actual.authority.baseStructuredIntake,
      candidateEnvelope: absent,
      clarificationGrounding: null,
    }),
    candidateEnvelope: absent,
  });
  assert.throws(
    () =>
      evaluateSelectedRequestProductCompletenessV1({
        requestedTopics: actual.authority.request.requestedTopics,
        candidateEnvelope: absent,
        effectiveDecisionPolicy: absentPolicy,
        decisionPlan: correctedCase4Plan,
        reportContent: correctedCase4Report,
      }),
    (error) =>
      safeCode(error) ===
      SELECTED_REQUEST_PRODUCT_COMPLETENESS_INVALID_SAFE_CODE,
  );
});

await check("actual Case 4 attempt 1 is withheld and fake attempt 2 alone is delivered", async () => {
  const actual = actualRoutes.get("draft_request_with_relationship_intent");
  const outputs = Object.fromEntries(
    actual.authority.stageEvidence.stage_attempts
      .filter((entry) => entry.attemptNumber === 1 && entry.outputJson !== null)
      .map((entry) => [entry.stageId, structuredClone(entry.outputJson)]),
  );
  const repository = new FakeAssessmentRepository();
  const transport = new FakeAiStageTransport({
    outputs,
    outputSequence: {
      "PB-04": [outputs["PB-04"], correctedCase4Plan],
      "PB-05": [outputs["PB-05"], correctedCase4Report],
      "PB-06": [outputs["PB-06"], outputs["PB-06"]],
    },
  });
  const catalog =
    await loadM2P4SentMessageDraftBoundaryRuntimeStageCatalog();
  const application = new AssessmentApplication({
    repository,
    transport,
    model: "gpt-5.6-luna",
    promptBundleVersion: catalog.promptBundleVersion,
    schemaSetVersion: catalog.schemaSetVersion,
    definitions: catalog.definitions,
    now: () => actual.authority.fixture.fixed_clock,
    uuid: ids(),
    timeZone: actual.authority.fixture.timezone,
  });
  const ready = await application.submit(
    structuredClone(actual.authority.request),
    "v1-d-ai-first-case4-offline",
  );
  assert.equal(ready.eligibility, "ready");
  assert.equal(transport.actualProviderCalls, 0);
  assert.equal(repository.actualSupabaseCalls, 0);
  assert.deepEqual(
    stagesFor(repository, "PB-04").map((entry) => entry.attemptNumber),
    [1, 2],
  );
  assert.deepEqual(
    stagesFor(repository, "PB-05").map((entry) => entry.attemptNumber),
    [1, 2],
  );
  assert.deepEqual(
    stagesFor(repository, "PB-06").map((entry) => entry.attemptNumber),
    [1, 2],
  );
  assert.equal(
    stagesFor(repository, "PB-06")[0].failure.errorCode,
    "M2_PRODUCT_QUALITY_REASSESSMENT_REQUIRED",
  );
  assert.equal(
    [...repository.stageRuns.values()].some(
      (entry) => entry.attemptNumber > 2,
    ),
    false,
  );
  assert.equal(repository.reports.size, 1);
  const saved = [...repository.reports.values()][0];
  assert.equal(
    saved.reportJson.decisionPlan.recommended_message_draft.text,
    case4Candidate,
  );
  assert.ok(saved.reportJson.decisionPlan.message_draft_edit_metadata);
  assert.ok(saved.reportJson.content.message_temperature);
  const projection = projectCustomerAssessmentExperienceV2(
    ready,
    actual.authority.request.requestedTopics,
  );
  assert.equal(projection.baseProjection.finalDraft.text, case4Candidate);
  assert.ok(projection.baseProjection.messageTemperature);
  const pb04Attempt2 = transport.requests.filter(
    (entry) => entry.stageId === "PB-04",
  )[1];
  assert.equal(
    pb04Attempt2.input.quality_reassessment_directive.scope,
    "plan_and_report",
  );
  assert.equal(
    pb04Attempt2.input.quality_reassessment_directive.source,
    "local_selected_request_completeness",
  );
});

await check("incomplete Case 4 attempt 2 exhausts with no Report or attempt 3", async () => {
  const actual = actualRoutes.get("draft_request_with_relationship_intent");
  const outputs = Object.fromEntries(
    actual.authority.stageEvidence.stage_attempts
      .filter((entry) => entry.attemptNumber === 1 && entry.outputJson !== null)
      .map((entry) => [entry.stageId, structuredClone(entry.outputJson)]),
  );
  const repository = new FakeAssessmentRepository();
  const transport = new FakeAiStageTransport({
    outputs,
    outputSequence: {
      "PB-04": [outputs["PB-04"], outputs["PB-04"]],
      "PB-05": [outputs["PB-05"], outputs["PB-05"]],
      "PB-06": [outputs["PB-06"], outputs["PB-06"]],
    },
  });
  const catalog =
    await loadM2P4SentMessageDraftBoundaryRuntimeStageCatalog();
  const application = new AssessmentApplication({
    repository,
    transport,
    model: "gpt-5.6-luna",
    promptBundleVersion: catalog.promptBundleVersion,
    schemaSetVersion: catalog.schemaSetVersion,
    definitions: catalog.definitions,
    now: () => actual.authority.fixture.fixed_clock,
    uuid: ids(),
    timeZone: actual.authority.fixture.timezone,
  });
  let failure = null;
  try {
    await application.submit(
      structuredClone(actual.authority.request),
      "v1-d-ai-first-case4-exhaustion-offline",
    );
  } catch (error) {
    failure = error;
  }
  assert.equal(safeCode(failure), "M2_PRODUCT_QUALITY_REASSESSMENT_EXHAUSTED");
  assert.equal(repository.reports.size, 0);
  assert.equal(transport.actualProviderCalls, 0);
  assert.deepEqual(
    stagesFor(repository, "PB-06").map((entry) => entry.attemptNumber),
    [1, 2],
  );
  assert.equal(
    stagesFor(repository, "PB-06")[1].failure.errorCode,
    "M2_PRODUCT_QUALITY_REASSESSMENT_EXHAUSTED",
  );
  assert.equal(
    [...repository.stageRuns.values()].some((entry) => entry.attemptNumber > 2),
    false,
  );
});

await check("Case 5 and Case 6 exact Candidate preservation references remain intact", () => {
  const case5 = actualRoutes.get("polite_thank_you_with_draft");
  const case6 = actualRoutes.get("kansai_persona_draft");
  assert.equal(case5.authority.request.optionalMessage, politeCandidate);
  assert.equal(case6.authority.request.optionalMessage, kansaiCandidate);
  assert.equal(case5.route.state, "full_paid_ready_candidate");
  assert.equal(case6.route.state, "full_paid_ready_candidate");
  assert.equal(
    selectV1DProductReviewFixture("polite_thank_you_with_draft").projection
      .baseProjection.finalDraft.text,
    politeCandidate,
  );
  assert.equal(
    selectV1DProductReviewFixture("kansai_persona_draft").projection
      .baseProjection.finalDraft.text,
    kansaiCandidate,
  );
  assert.equal(kansaiCandidate.split("\n").length, 2);
  assert.match(kansaiCandidate, /😊$/u);
});

await check("all historical Provider evidence and review sheets are byte-identical", () => {
  assertTreeByteIdentical(packageRoot);
});

await check("Prompt, catalog, schema, Provider runner, transport, UI, and next-env remain protected", () => {
  assertTreeByteIdentical("lib/assessment/runtime/contracts");
  for (const relativePath of [
    "lib/assessment/runtime/schema-catalog.ts",
    "lib/assessment/runtime/review/m2-p4-v15-controlled-review-executor.ts",
    "lib/assessment/runtime/review/m2-p4-v15-controlled-review-evidence.ts",
    "lib/assessment/runtime/review/m2-p4-v15-controlled-review-transport.ts",
    "scripts/run-m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-v1-d-controlled-provider-review.mjs",
    "next-env.d.ts",
  ]) {
    assert.equal(worktreeBlob(relativePath), blob(baseline, relativePath));
  }
  const scope = collectScope().map((entry) => entry.path);
  assert.equal(
    scope.some((entry) =>
      /^(app|components)\/|\.module\.css$|payment|supabase|migration/iu.test(
        entry,
      ),
    ),
    false,
  );
});

await check("offline verifier itself has zero Provider execution path", () => {
  const source = readText(verifierPath);
  const forbiddenExecutionPath = new RegExp(
    [
      ["--execute", "provider-review"].join("-"),
      ["runControlled", "ProviderReviewCli"].join(""),
      ["OpenAI", "StageTransport"].join(""),
    ].join("|"),
    "u",
  );
  assert.doesNotMatch(source, forbiddenExecutionPath);
  assert.match(source, /actualProviderCalls, 0/u);
});

await check("V2 predecessor behavior remains callable for historical runtimes", () => {
  const historical = evaluateJpy980InputSufficiencyV2(
    policyInput(actualRoutes.get("ordinary_reply_waiting").authority),
  );
  assert.equal(historical.schemaVersion, "m2-p4-jpy980-input-sufficiency-result-v2");
  assert.equal(historical.state, "full_paid_ready_candidate");
});

if (failures.length > 0) {
  console.error(`\n${failures.length} consolidated verifier check(s) failed.`);
  process.exitCode = 1;
} else {
  console.log(
    `\nM2-P4 V1-D AI-first functional sufficiency + selected-request completeness: PASS ${checks}/${checks}`,
  );
  console.log(
    "Actual offline routes: Cases 1-8 full_paid_ready_candidate; Case 9 needs latest_contact_timing then full_paid_ready_candidate.",
  );
  console.log(
    "Actual Case 4 attempt 1 withheld; one fake corrected attempt 2 delivered; attempt 3 absent; Provider calls 0.",
  );
}
