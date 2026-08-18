import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { AssessmentApplication } from "../lib/assessment/runtime/application.ts";
import { projectBaseProviderInputV1 } from "../lib/assessment/runtime/base-structured-intake-grounding-v1.ts";
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
import { evaluateCustomerSurfaceIntegrityV1 } from "../lib/assessment/runtime/customer-surface-integrity-v1.ts";
import { evaluateDraftSourceIntegrityV2 } from "../lib/assessment/runtime/draft-source-integrity-v2.ts";
import { buildEffectiveAssessmentAuthorityV1 } from "../lib/assessment/runtime/effective-assessment-authority-v1.ts";
import { validateEffectiveAssessmentAuthorityIntegrityV1 } from "../lib/assessment/runtime/effective-assessment-authority-integrity-v1.ts";
import { buildEffectiveDecisionPolicyV1 } from "../lib/assessment/runtime/effective-decision-policy-v1.ts";
import { buildEffectiveDecisionPolicyV2 } from "../lib/assessment/runtime/effective-decision-policy-v2.ts";
import { M2RuntimeError } from "../lib/assessment/runtime/errors.ts";
import {
  FakeAiStageTransport,
  FakeAssessmentRepository,
} from "../lib/assessment/runtime/fakes.ts";
import { evaluateJpy980InputSufficiencyV3 } from "../lib/assessment/runtime/jpy980-input-sufficiency-policy-v3.ts";
import { buildCombinedProductQualityDirectiveV2 } from "../lib/assessment/runtime/quality-reassessment-v2.ts";
import {
  buildControlledReviewHumanReviewSheet,
  selectControlledReviewEvidenceFormatV1,
  validateControlledReviewEvidenceRuntimeIdentity,
  V1_D_V17_CONTROLLED_REVIEW_EVIDENCE_RUNTIME_IDENTITY,
} from "../lib/assessment/runtime/review/m2-p4-v15-controlled-review-evidence.ts";
import { V1_D_CONTROLLED_PROVIDER_INPUTS_SHA256 } from "../lib/assessment/runtime/review/m2-p4-v15-controlled-review-executor.ts";
import {
  buildControlledReviewAuthorizationRecord,
  runControlledProviderReviewCli,
  validateControlledReviewRuntimeCatalogIdentity,
} from "./run-m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-v1-d-controlled-provider-review.mjs";
import { loadM2P4FinalProductRecoveryRuntimeStageCatalog } from "../lib/assessment/runtime/schema-catalog.ts";
import { evaluateSelectedRequestProductCompletenessV2 } from "../lib/assessment/runtime/selected-request-product-completeness-v2.ts";
import {
  buildAbsentCandidateLaneV1,
  buildAvailableCandidateLaneV1,
} from "../lib/assessment/runtime/split-analysis-envelope-v1.ts";

const root = process.cwd();
const baseline = "37d98d405532009ac1057dfb5f44bb034ed64d9b";
const expectedBranch = "fix/m2-p4-v1-d-v17-final-product-recovery";
const expectedSubject = "fix: close V17 final product quality gaps";
const packageRoot =
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-v1-d";
const executionRoot = `${packageRoot}/controlled-provider-executions`;
const verifierPath =
  "scripts/verify-m2-p4-v1-d-v17-final-product-recovery.mjs";
const taskRecordPath =
  "docs/phase2/TASK_M2_P4_V1_D_V17_FINAL_PRODUCT_RECOVERY.md";

const modifiedPaths = [
  "docs/CODEX_HANDOFF.md",
  "docs/CURRENT_FOCUS.md",
  "docs/WBS.md",
  "lib/assessment/runtime/fakes.ts",
  "lib/assessment/runtime/pipeline.ts",
  "lib/assessment/runtime/review/m2-p4-v15-controlled-review-evidence.ts",
  "lib/assessment/runtime/review/m2-p4-v15-controlled-review-executor.ts",
  "lib/assessment/runtime/schema-catalog.ts",
  "scripts/run-m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-v1-d-controlled-provider-review.mjs",
];
const newPaths = [
  taskRecordPath,
  "lib/assessment/runtime/contracts/pb-04-v17-product-recovery-v1.developer.md",
  "lib/assessment/runtime/contracts/pb-05-v17-customer-product-v1.developer.md",
  "lib/assessment/runtime/contracts/pb-06-v17-product-quality-v1.developer.md",
  "lib/assessment/runtime/contracts/runtime-stage-catalog-v17.json",
  "lib/assessment/runtime/customer-surface-integrity-v1.ts",
  "lib/assessment/runtime/draft-source-integrity-v2.ts",
  "lib/assessment/runtime/effective-decision-policy-v2.ts",
  "lib/assessment/runtime/quality-reassessment-v2.ts",
  "lib/assessment/runtime/selected-request-product-completeness-v2.ts",
  "lib/assessment/runtime/semantic-disposition-v6.ts",
  verifierPath,
];
const exactScope = [...modifiedPaths, ...newPaths];

const actualDirectories = {
  ordinary_reply_waiting:
    "2026-08-18-case1-ordinary-reply-waiting-v16-bc973d02",
  administrative_reply_with_tone_concern_ready_candidate:
    "2026-08-18-case2-admin-tone-ai-first-v16-cd1518ce",
  reply_waiting_with_usual_cadence:
    "2026-08-18-case3-reply-cadence-ai-first-v16-cd1518ce",
  draft_request_with_relationship_intent:
    "2026-08-18-case4-draft-intent-ai-first-v16-cd1518ce",
  polite_thank_you_with_draft:
    "2026-08-18-case5-polite-draft-ai-first-v16-cd1518ce",
  kansai_persona_draft:
    "2026-08-18-case6-kansai-draft-ai-first-v16-cd1518ce",
  alternative_tradeoff_applicable:
    "2026-08-18-case7-tradeoff-applicable-ai-first-v16-cd1518ce",
  alternative_tradeoff_not_applicable:
    "2026-08-18-case8-tradeoff-none-ai-first-v16-cd1518ce",
  one_clarification_answer_becomes_ready:
    "2026-08-18-case9-one-clarification-ai-first-v16-cd1518ce",
};
const caseIds = Object.keys(actualDirectories);
const batch8CaseIds = caseIds.slice(1);
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
  if (typeof patch !== "object" || patch === null || Array.isArray(patch)) {
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

const controlledInputs = readJson(
  `${packageRoot}/controlled-provider-inputs-v1.json`,
);
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
  const baseStructuredIntake = groundBaseStructuredIntakeV3(
    projectBaseProviderInputV1(request),
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

function policyInput(authority, clarificationGrounding = null) {
  const effectiveAssessmentAuthority =
    clarificationGrounding === null
      ? authority.effectiveAuthority
      : buildEffectiveAssessmentAuthorityV1({
          baseStructuredIntake: authority.baseStructuredIntake,
          candidateEnvelope: authority.candidateLane.candidate_envelope,
          clarificationGrounding,
        });
  return {
    basePolicyInput: {
      aggregateSafety: { classification: "normal_allowed" },
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

function clarificationGrounding(initialRoute, answer, fixedClock) {
  const clarificationId = createOpaqueClarificationIdV1(
    new Uint8Array(32).fill(9),
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

function routeGroundedBase(base, candidateLane) {
  const effectiveAuthority = buildEffectiveAssessmentAuthorityV1({
    baseStructuredIntake: base,
    candidateEnvelope: candidateLane.candidate_envelope,
    clarificationGrounding: null,
  });
  const authority = {
    baseStructuredIntake: base,
    candidateLane,
    effectiveAuthority,
  };
  return evaluateJpy980InputSufficiencyV3(policyInput(authority));
}

function candidatePreservedMetadata() {
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

function semanticPass(output) {
  return {
    ...structuredClone(output),
    semantic_checks: [],
    final_disposition: null,
    repair_strategy: null,
    failed_codes: [],
  };
}

function outputsFromActual(actual) {
  return Object.fromEntries(
    actual.stageEvidence.stage_attempts
      .filter((entry) => entry.attemptNumber === 1 && entry.outputJson !== null)
      .map((entry) => [entry.stageId, structuredClone(entry.outputJson)]),
  );
}

function stagesFor(repository, stageId) {
  return [...repository.stageRuns.values()]
    .filter((entry) => entry.stageId === stageId)
    .sort((left, right) => left.attemptNumber - right.attemptNumber);
}

async function runFake(actual, outputs, outputSequence, idempotencyKey) {
  const repository = new FakeAssessmentRepository();
  const transport = new FakeAiStageTransport({ outputs, outputSequence });
  const catalog = await loadM2P4FinalProductRecoveryRuntimeStageCatalog();
  const application = new AssessmentApplication({
    repository,
    transport,
    model: "gpt-5.6-luna",
    promptBundleVersion: catalog.promptBundleVersion,
    schemaSetVersion: catalog.schemaSetVersion,
    definitions: catalog.definitions,
    now: () => actual.fixture.fixed_clock,
    uuid: ids(),
    timeZone: actual.fixture.timezone,
  });
  const result = await application.submit(
    structuredClone(actual.request),
    idempotencyKey,
  );
  assert.equal(transport.actualProviderCalls, 0);
  assert.equal(repository.actualSupabaseCalls, 0);
  return { result, repository, transport };
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

await check("exact branch, baseline, one-commit mode, and exact scope", () => {
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
    assert.equal(entry.status, newPaths.includes(entry.path) ? "A" : "M", entry.path);
  }
});

await check("V17 identity exact and PB-01 through PB-03 are unchanged", async () => {
  const v17 = await loadM2P4FinalProductRecoveryRuntimeStageCatalog();
  assert.deepEqual(
    {
      catalog: v17.catalogVersion,
      prompt: v17.promptBundleVersion,
      schema: v17.schemaSetVersion,
      topology: v17.stageTopologyVersion,
    },
    {
      catalog: "runtime-stage-catalog-v17.0.0",
      prompt: "prompt-bundle-runtime-v17.0.0",
      schema: "pipeline-schema-runtime-v6.0.0",
      topology: "split-base-candidate-v1",
    },
  );
  const v16Manifest = readJson(
    "lib/assessment/runtime/contracts/runtime-stage-catalog-v16.json",
  );
  const v17Manifest = readJson(
    "lib/assessment/runtime/contracts/runtime-stage-catalog-v17.json",
  );
  assert.deepEqual(v17Manifest.stages.slice(0, 4), v16Manifest.stages.slice(0, 4));
  assert.deepEqual(
    v17Manifest.stages.map((stage) => stage.schema_sha256),
    v16Manifest.stages.map((stage) => stage.schema_sha256),
  );
});

await check("historical contracts, policies, evidence, inputs, and next-env are byte-identical", () => {
  assertTreeByteIdentical("lib/assessment/runtime/contracts");
  assertTreeByteIdentical(packageRoot);
  for (const relativePath of [
    "lib/assessment/runtime/effective-decision-policy-v1.ts",
    "lib/assessment/runtime/jpy980-input-sufficiency-policy-v2.ts",
    "lib/assessment/runtime/jpy980-input-sufficiency-policy-v3.ts",
    "evals/quality/m2-p4-i1/decision-policy-v2.mjs",
    "next-env.d.ts",
  ]) {
    assert.equal(worktreeBlob(relativePath), blob(baseline, relativePath));
  }
});

const actualRoutes = new Map();
for (const fixtureId of caseIds.slice(0, 8)) {
  await check(`AI-first V3 preserves Ready route for ${fixtureId}`, () => {
    const evaluated = evaluateActual(fixtureId);
    actualRoutes.set(fixtureId, evaluated);
    assert.equal(evaluated.route.state, "full_paid_ready_candidate");
    assert.equal(evaluated.route.clarification, null);
  });
}

await check("Case 9 asks latest_contact_timing once and becomes Ready", () => {
  const evaluated = evaluateActual("one_clarification_answer_becomes_ready");
  actualRoutes.set("one_clarification_answer_becomes_ready", evaluated);
  assert.equal(evaluated.route.state, "needs_one_clarifying_answer");
  assert.equal(evaluated.route.clarification.target, "latest_contact_timing");
  assert.equal(evaluated.route.clarificationBudget.maximumQuestionsTotal, 1);
  const grounding = clarificationGrounding(
    evaluated.route,
    evaluated.authority.fixture.clarification.answer_payload,
    evaluated.authority.fixture.fixed_clock,
  );
  const resumed = evaluateJpy980InputSufficiencyV3(
    policyInput(evaluated.authority, grounding),
  );
  assert.equal(resumed.state, "full_paid_ready_candidate");
  assert.equal(resumed.clarification, null);
  assert.equal(resumed.clarificationBudget.questionsAlreadyUsed, 1);
  assert.equal(resumed.clarificationBudget.questionsRemaining, 0);
});

await check("V17 structured Decision semantics correct Cases 1, 2, 3, 5, 6, 7, and 8", () => {
  const decisions = Object.fromEntries(
    [
      "ordinary_reply_waiting",
      "administrative_reply_with_tone_concern_ready_candidate",
      "reply_waiting_with_usual_cadence",
      "polite_thank_you_with_draft",
      "kansai_persona_draft",
      "alternative_tradeoff_applicable",
      "alternative_tradeoff_not_applicable",
    ].map((fixtureId) => {
      const actual = actualRoutes.get(fixtureId).authority;
      const policy = buildEffectiveDecisionPolicyV2({
        authority: actual.effectiveAuthority,
        candidateEnvelope: actual.candidateLane.candidate_envelope,
      });
      return [fixtureId, policy];
    }),
  );
  assert.deepEqual(decisions.ordinary_reply_waiting.policy.allowed_decisions, [
    "wait_and_reassess",
  ]);
  const case1 = actualRoutes.get("ordinary_reply_waiting").authority;
  assert.deepEqual(
    decisions.ordinary_reply_waiting.policy,
    buildEffectiveDecisionPolicyV1({
      authority: case1.effectiveAuthority,
      candidateEnvelope: case1.candidateLane.candidate_envelope,
    }).policy,
  );
  assert.notEqual(
    decisions.ordinary_reply_waiting.policy.message_draft_policy,
    "required_now",
  );
  assert.deepEqual(
    decisions.administrative_reply_with_tone_concern_ready_candidate.policy
      .allowed_decisions,
    ["reply_now"],
  );
  assert.deepEqual(
    decisions.reply_waiting_with_usual_cadence.policy.allowed_decisions,
    ["wait_and_reassess"],
  );
  assert.equal(
    decisions.reply_waiting_with_usual_cadence.policy.message_draft_policy,
    "later_only",
  );
  const unknownDeadlineAuthority = structuredClone(
    actualRoutes.get("reply_waiting_with_usual_cadence").authority
      .effectiveAuthority,
  );
  unknownDeadlineAuthority.effectiveDecisionContext.decisionFacts.practical_reason.deadline =
    "unknown";
  assert.deepEqual(
    buildEffectiveDecisionPolicyV2({
      authority: unknownDeadlineAuthority,
      candidateEnvelope:
        actualRoutes.get("reply_waiting_with_usual_cadence").authority
          .candidateLane.candidate_envelope,
    }).policy.allowed_decisions,
    ["wait_and_reassess"],
  );
  const factualCorrectionAuthority = structuredClone(unknownDeadlineAuthority);
  factualCorrectionAuthority.effectiveDecisionContext.decisionFacts.practical_reason =
    { kind: "factual_correction", active: true, deadline: "none" };
  assert.deepEqual(
    buildEffectiveDecisionPolicyV2({
      authority: factualCorrectionAuthority,
      candidateEnvelope:
        actualRoutes.get("reply_waiting_with_usual_cadence").authority
          .candidateLane.candidate_envelope,
    }).policy.allowed_decisions,
    ["send_now"],
  );
  assert.deepEqual(decisions.polite_thank_you_with_draft.policy.allowed_decisions, [
    "send_now",
  ]);
  const incomingThankYouAuthority = structuredClone(
    actualRoutes.get("polite_thank_you_with_draft").authority.effectiveAuthority,
  );
  incomingThankYouAuthority.effectiveDecisionContext.decisionFacts =
    structuredClone(
      actualRoutes.get("administrative_reply_with_tone_concern_ready_candidate")
        .authority.effectiveAuthority.effectiveDecisionContext.decisionFacts,
    );
  incomingThankYouAuthority.effectiveDecisionContext.decisionFacts.selected_requests =
    structuredClone(
      actualRoutes.get("polite_thank_you_with_draft").authority
        .effectiveAuthority.effectiveDecisionContext.decisionFacts.selected_requests,
    );
  assert.deepEqual(
    buildEffectiveDecisionPolicyV2({
      authority: incomingThankYouAuthority,
      candidateEnvelope:
        actualRoutes.get("polite_thank_you_with_draft").authority.candidateLane
          .candidate_envelope,
    }).policy.allowed_decisions,
    ["reply_now"],
  );
  assert.deepEqual(decisions.kansai_persona_draft.policy.allowed_decisions, [
    "reply_now",
  ]);
  assert.deepEqual(
    decisions.alternative_tradeoff_applicable.policy.allowed_decisions,
    ["send_now"],
  );
  const case8 = actualRoutes.get("alternative_tradeoff_not_applicable").authority;
  assert.deepEqual(
    decisions.alternative_tradeoff_not_applicable.policy,
    buildEffectiveDecisionPolicyV1({
      authority: case8.effectiveAuthority,
      candidateEnvelope: case8.candidateLane.candidate_envelope,
    }).policy,
  );
});

await check("sparse, emotion-only, Candidate-only, and Candidate-required protections remain", () => {
  const emotionOnly = baseFixture("reply_waiting_sufficient", {
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
    },
  });
  assert.notEqual(
    routeGroundedBase(emotionOnly, buildAbsentCandidateLaneV1()).state,
    "full_paid_ready_candidate",
  );
  const candidateLane =
    actualRoutes.get("draft_request_with_relationship_intent").authority
      .candidateLane;
  const candidateOnly = baseFixture("draft_tone_missing", {
    observed_facts: [],
    user_emotions: [],
    decision_facts: { selected_requests: ["draft_message", "message_impact"] },
    base_writing_signals: {
      user_goal_detail: { value: "unknown", basis: "unresolved" },
      explicit_user_constraints: [],
    },
  });
  assert.notEqual(
    routeGroundedBase(candidateOnly, candidateLane).state,
    "full_paid_ready_candidate",
  );
  const noCandidate = baseFixture("draft_material", {
    decision_facts: {
      selected_requests: ["message_impact", "relationship"],
    },
  });
  assert.equal(
    routeGroundedBase(noCandidate, buildAbsentCandidateLaneV1()).state,
    "not_full_product_candidate",
  );
});

await check("Case 4 combines valid semantic and completeness defects into one attempt 2", async () => {
  const actual = actualRoutes.get("draft_request_with_relationship_intent").authority;
  const outputs = outputsFromActual(actual);
  const correctedPlan = structuredClone(outputs["PB-04"]);
  correctedPlan.recommended_message_draft = {
    text: case4Candidate,
    policy: "later_only",
    use_timing: "later",
  };
  correctedPlan.message_draft_edit_metadata = candidatePreservedMetadata();
  const correctedReport = structuredClone(outputs["PB-05"]);
  correctedReport.short_letter[1] =
    "候補文は、感謝とまた話したい気持ちを短く伝え、次の約束や返信を迫らない内容です。今夜は送信を保留し、後で使う文面としてそのまま残せます。";
  correctedReport.message_temperature = {
    softness: "感謝を先に置いた、やわらかい温度です。",
    affection: "また話したい意図を断定せずに伝えています。",
    pressure: "返信や次の約束を求めず、圧を抑えています。",
    adjustment: "候補文は変えず、使う時期だけを後で見直します。",
  };
  correctedReport.message_draft_context =
    "候補文を変更せず、今夜ではなく連絡時期を再評価できた後に使う文面として提示しています。";
  const correctedSemantic = semanticPass(outputs["PB-06"]);
  const run = await runFake(
    actual,
    outputs,
    {
      "PB-04": [outputs["PB-04"], correctedPlan],
      "PB-05": [outputs["PB-05"], correctedReport],
      "PB-06": [outputs["PB-06"], correctedSemantic],
    },
    "v17-case4-combined-recovery",
  );
  assert.equal(run.result.eligibility, "ready");
  assert.deepEqual(
    stagesFor(run.repository, "PB-04").map((entry) => entry.attemptNumber),
    [1, 2],
  );
  assert.deepEqual(
    stagesFor(run.repository, "PB-05").map((entry) => entry.attemptNumber),
    [1, 2],
  );
  assert.deepEqual(
    stagesFor(run.repository, "PB-06").map((entry) => entry.attemptNumber),
    [1, 2],
  );
  assert.equal(
    [...run.repository.stageRuns.values()].some((entry) => entry.attemptNumber > 2),
    false,
  );
  const directive = run.transport.requests.filter(
    (entry) => entry.stageId === "PB-04",
  )[1].input.quality_reassessment_directive;
  assert.equal(directive.source, "combined_product_quality");
  assert.equal(directive.scope, "plan_and_report");
  assert.ok(
    directive.defects.some(
      (entry) => entry.jsonPath === "decision_plan.recommended_message_draft",
    ),
  );
  assert.ok(
    directive.defects.some(
      (entry) => entry.jsonPath === "report_content.short_letter[1]",
    ),
  );
  assert.equal(
    directive.defects.some(
      (entry) => entry.jsonPath === "report_content.relationship_summary",
    ),
    false,
  );
  const projection = projectCustomerAssessmentExperienceV2(
    run.result,
    actual.request.requestedTopics,
  );
  assert.equal(projection.baseProjection.finalDraft.text, case4Candidate);
  assert.ok(projection.baseProjection.messageTemperature);
});

await check("Case 5 uses the exact Candidate in a coherent current-send Product", async () => {
  const actual = actualRoutes.get("polite_thank_you_with_draft").authority;
  assert.equal(actual.request.optionalMessage, politeCandidate);
  const outputs = outputsFromActual(actual);
  const plan = structuredClone(outputs["PB-04"]);
  plan.selected_decision = "send_now";
  plan.pre_action_check.check =
    "感謝だけを短く伝え、誘いや返信を求める表現を加えていないことを確認する。";
  plan.actions_to_take = ["候補文を変更せず、今夜一度だけ送る。"];
  plan.actions_to_avoid = [
    "候補文に誘いや関係性の確認を追加しない。",
    "送信後に感謝の追送を重ねない。",
  ];
  plan.recommended_message_draft = {
    text: politeCandidate,
    policy: "required_now",
    use_timing: "now",
  };
  plan.message_draft_edit_metadata = candidatePreservedMetadata();
  plan.aftercare_plan[0].action =
    "候補文を一度送ったら、追加連絡をせず食事後の予定や休息に戻る。";
  plan.material_unknowns = plan.material_unknowns.filter(
    (entry) => entry.unknown_code !== "specific_message_text",
  );
  const report = structuredClone(outputs["PB-05"]);
  report.cover_line = "今夜は、感謝だけを短く自然に伝えられます。";
  report.decision_reason_summary =
    "同日中に感謝を伝えたい希望と、誘いや返信圧を含まない候補文が揃っているため、そのまま一度送る判断です。";
  report.message_draft_context =
    "感謝だけを短く伝える候補文を、文面を変えず今夜一度送るための最終案です。";
  report.action_rationales = [
    "候補文は感謝のみを伝え、誘いや返信要求を含まないため、今夜の目的に合っています。",
  ];
  const run = await runFake(
    actual,
    { ...outputs, "PB-04": plan, "PB-05": report, "PB-06": semanticPass(outputs["PB-06"]) },
    undefined,
    "v17-case5-exact-candidate",
  );
  assert.equal(run.result.eligibility, "ready");
  assert.deepEqual(
    stagesFor(run.repository, "PB-04").map((entry) => entry.attemptNumber),
    [1],
  );
  const projection = projectCustomerAssessmentExperienceV2(
    run.result,
    actual.request.requestedTopics,
  );
  assert.equal(projection.baseProjection.finalDraft.text, politeCandidate);
});

await check("Case 6 internal wording is withheld and one clean report retry preserves bytes", async () => {
  const actual = actualRoutes.get("kansai_persona_draft").authority;
  assert.equal(actual.request.optionalMessage, kansaiCandidate);
  const outputs = outputsFromActual(actual);
  assert.match(JSON.stringify(outputs["PB-05"]), /validated Decision Planでは/u);
  const cleanReport = structuredClone(outputs["PB-05"]);
  cleanReport.action_rationales[1] =
    "候補文の関西弁、短い改行、絵文字は、普段のコミュニケーションに合っており、意味や表現を変える必要はありません。";
  const run = await runFake(
    actual,
    outputs,
    {
      "PB-05": [outputs["PB-05"], cleanReport],
      "PB-06": [outputs["PB-06"], semanticPass(outputs["PB-06"])],
    },
    "v17-case6-internal-language",
  );
  assert.equal(run.result.eligibility, "ready");
  assert.deepEqual(
    stagesFor(run.repository, "PB-04").map((entry) => entry.attemptNumber),
    [1],
  );
  assert.deepEqual(
    stagesFor(run.repository, "PB-05").map((entry) => entry.attemptNumber),
    [1, 2],
  );
  const directive = run.transport.requests.filter(
    (entry) => entry.stageId === "PB-05",
  )[1].input.quality_reassessment_directive;
  assert.equal(directive.scope, "report_only");
  const saved = [...run.repository.reports.values()][0];
  assert.equal(saved.reportJson.decisionPlan.recommended_message_draft.text, kansaiCandidate);
  assert.doesNotMatch(JSON.stringify(saved.reportJson), /Decision Plan/u);
  assert.equal(
    [...run.repository.stageRuns.values()].some((entry) => entry.attemptNumber > 2),
    false,
  );
});

await check("Case 7 repairs source truth, Plan ownership, and next-three-days in one attempt 2", async () => {
  const actual = actualRoutes.get("alternative_tradeoff_applicable").authority;
  const outputs = outputsFromActual(actual);
  assert.equal(
    outputs["PB-04"].message_draft_edit_metadata.source_status,
    "generated_without_candidate",
  );
  assert.equal(outputs["PB-04"].message_draft_edit_metadata.preserved_meaning, true);
  const plan = structuredClone(outputs["PB-04"]);
  plan.message_draft_edit_metadata.preserved_meaning = false;
  plan.change_conditions[0].condition =
    "送信後、相手から都合について新しい返信が届く。";
  plan.change_conditions[0].resulting_direction = "reply_now";
  plan.aftercare_plan[1].action =
    "明日12時の期限で予約判断を区切り、その後3日間は同じ連絡を重ねず、新しい返信があった場合だけ内容に応じて対応する。";
  plan.aftercare_plan[2].action =
    "期限後から3日以内に予約条件や相手の返信という新しい事実が生じた場合だけ、予定の扱いを見直す。";
  const report = structuredClone(outputs["PB-05"]);
  const run = await runFake(
    actual,
    outputs,
    {
      "PB-04": [outputs["PB-04"], plan],
      "PB-05": [outputs["PB-05"], report],
      "PB-06": [outputs["PB-06"], semanticPass(outputs["PB-06"])],
    },
    "v17-case7-combined-recovery",
  );
  assert.equal(run.result.eligibility, "ready");
  const directive = run.transport.requests.filter(
    (entry) => entry.stageId === "PB-04",
  )[1].input.quality_reassessment_directive;
  assert.equal(directive.scope, "plan_and_report");
  assert.ok(
    directive.defects.some(
      (entry) => entry.jsonPath === "decision_plan.change_conditions[0]",
    ),
  );
  assert.equal(
    directive.defects.some(
      (entry) =>
        entry.jsonPath === "report_content.change_condition_commentary[0]",
    ),
    false,
  );
  const saved = [...run.repository.reports.values()][0];
  assert.equal(
    saved.reportJson.decisionPlan.message_draft_edit_metadata.preserved_meaning,
    false,
  );
  assert.match(
    JSON.stringify(saved.reportJson.decisionPlan.aftercare_plan),
    /3日/u,
  );
  assert.equal(
    [...run.repository.stageRuns.values()].some((entry) => entry.attemptNumber > 2),
    false,
  );
});

await check("deterministic source and customer-surface guards are bounded and fail closed", () => {
  const case3 = actualRoutes.get("reply_waiting_with_usual_cadence").authority;
  const case3Policy = buildEffectiveDecisionPolicyV2({
    authority: case3.effectiveAuthority,
    candidateEnvelope: case3.candidateLane.candidate_envelope,
  });
  assert.ok(
    evaluateDraftSourceIntegrityV2({
      candidateEnvelope: case3.candidateLane.candidate_envelope,
      optionalMessage: case3.request.optionalMessage,
      requestedTopics: case3.request.requestedTopics,
      decisionPolicy: case3Policy.policy,
      decisionPlan: case3.stage("PB-04").outputJson,
    }).some(
      (entry) =>
        entry.normalizedRepairRequirementCode ===
        "REMOVE_UNAUTHORIZED_GENERATED_DRAFT",
    ),
  );
  const case7 = actualRoutes.get("alternative_tradeoff_applicable").authority;
  const case7Plan = case7.stage("PB-04").outputJson;
  const sourceDefects = evaluateDraftSourceIntegrityV2({
    candidateEnvelope: case7.candidateLane.candidate_envelope,
    optionalMessage: case7.request.optionalMessage,
    requestedTopics: case7.request.requestedTopics,
    decisionPolicy: { message_draft_policy: "required_now" },
    decisionPlan: case7Plan,
  });
  assert.ok(
    sourceDefects.some(
      (entry) =>
        entry.jsonPath ===
        "decision_plan.message_draft_edit_metadata.preserved_meaning",
    ),
  );
  const case6 = actualRoutes.get("kansai_persona_draft").authority;
  const case6Plan = structuredClone(case6.stage("PB-04").outputJson);
  const case6Report = case6.stage("PB-05").outputJson;
  assert.ok(
    evaluateCustomerSurfaceIntegrityV1({
      decisionPlan: case6Plan,
      reportContent: case6Report,
    }).some((entry) => entry.jsonPath === "report_content.action_rationales[1]"),
  );
  case6Plan.recommended_message_draft.text = "Provider Runtime";
  assert.equal(
    evaluateCustomerSurfaceIntegrityV1({
      decisionPlan: case6Plan,
      reportContent: {
        ...structuredClone(case6Report),
        action_rationales: ["候補文の意味を保っています。"],
      },
    }).some(
      (entry) => entry.jsonPath === "decision_plan.recommended_message_draft.text",
    ),
    false,
  );
  assert.equal(
    buildCombinedProductQualityDirectiveV2({
      blockingFindings: [
        {
          finding_code: "FACT_FIDELITY",
          severity: "major",
          json_path: "unknown.critical_path",
          evidence_refs: [],
          detail: "unknown owner",
        },
      ],
      localDefects: [],
      decisionPlan: case7Plan,
      reportContent: case7.stage("PB-05").outputJson,
    }),
    null,
  );
});

await check("selected draft completeness requires later-use draft and Product context", () => {
  const actual = actualRoutes.get("draft_request_with_relationship_intent").authority;
  const effectivePolicy = buildEffectiveDecisionPolicyV2({
    authority: actual.effectiveAuthority,
    candidateEnvelope: actual.candidateLane.candidate_envelope,
  });
  const completeness = evaluateSelectedRequestProductCompletenessV2({
    requestedTopics: actual.request.requestedTopics,
    candidateEnvelope: actual.candidateLane.candidate_envelope,
    effectiveDecisionPolicy: effectivePolicy,
    decisionPlan: actual.stage("PB-04").outputJson,
    reportContent: actual.stage("PB-05").outputJson,
  });
  assert.equal(effectivePolicy.policy.message_draft_policy, "later_only");
  assert.deepEqual(
    completeness.defects.map((entry) => entry.code).sort(),
    [
      "REQUESTED_DRAFT_CONTEXT_MISSING",
      "REQUESTED_DRAFT_EDIT_METADATA_MISSING",
      "REQUESTED_DRAFT_MISSING",
      "REQUESTED_MESSAGE_TEMPERATURE_MISSING",
    ],
  );
});

await check("V17 controlled evidence identity, filenames, authorization, and V18 rejection are exact", () => {
  const identity = validateControlledReviewEvidenceRuntimeIdentity(
    V1_D_V17_CONTROLLED_REVIEW_EVIDENCE_RUNTIME_IDENTITY,
  );
  const format = selectControlledReviewEvidenceFormatV1(identity);
  assert.deepEqual(format, {
    outputProvenance: "actual_v17_successor_output",
    routeResults: {
      fileName: "v17-route-results-v1.json",
      schemaVersion: "m2-p4-v1-d-v17-route-results-v1",
    },
    stageAttemptResults: {
      fileName: "v17-stage-attempt-results-v1.json",
      schemaVersion: "m2-p4-v1-d-v17-stage-attempt-results-v1",
    },
    customerProjections: {
      fileName: "v17-customer-projections-v1.json",
      schemaVersion: "m2-p4-v1-d-v17-customer-projections-v1",
    },
    qualityReassessmentResults: {
      fileName: "v17-quality-reassessment-results-v1.json",
      schemaVersion: "m2-p4-v1-d-v17-quality-reassessment-results-v1",
    },
  });
  const record = buildControlledReviewAuthorizationRecord({
    executionId: "v17-batch8-authorization-fixture",
    env: { M2_V1D_HUMAN_AUTHORIZATION_REFERENCE: "human:v17:batch8" },
    actualHead: baseline,
    actualInputSha256: V1_D_CONTROLLED_PROVIDER_INPUTS_SHA256,
    selectedCaseIds: batch8CaseIds,
    timestamp: "2026-08-19T00:00:00.000Z",
    runtimeIdentity: identity,
  });
  assert.equal(record.runtime_catalog_version, identity.catalogVersion);
  assert.equal(record.prompt_bundle_version, identity.promptBundleVersion);
  assert.equal(
    record.authorized_input_sha256,
    V1_D_CONTROLLED_PROVIDER_INPUTS_SHA256,
  );
  assert.equal(record.authorized_snapshot, baseline);
  assert.deepEqual(record.authorized_case_ids, batch8CaseIds);
  const sheet = buildControlledReviewHumanReviewSheet(
    [
      {
        fixtureId: batch8CaseIds[0],
        customerProjection: {},
      },
    ],
    identity,
  );
  assert.equal(
    sheet.review_records[0].output_provenance,
    "actual_v17_successor_output",
  );
  assert.throws(
    () =>
      validateControlledReviewEvidenceRuntimeIdentity({
        ...identity,
        catalogVersion: "runtime-stage-catalog-v18.0.0",
        promptBundleVersion: "prompt-bundle-runtime-v18.0.0",
      }),
    (error) =>
      safeCode(error) ===
      "M2_V1D_REVIEW_EVIDENCE_RUNTIME_IDENTITY_UNSUPPORTED",
  );
});

await check("validate-only selects exact V17 and constructs no Provider client", async () => {
  const catalog = await loadM2P4FinalProductRecoveryRuntimeStageCatalog();
  const identity = validateControlledReviewRuntimeCatalogIdentity(catalog);
  assert.deepEqual(identity, V1_D_V17_CONTROLLED_REVIEW_EVIDENCE_RUNTIME_IDENTITY);
  const outputDirectory = `${executionRoot}/v17-verifier-validate-only-no-write`;
  assert.equal(existsSync(path.join(root, outputDirectory)), false);
  const result = await runControlledProviderReviewCli({
    argv: [
      "--validate-only",
      `--case=${batch8CaseIds[0]}`,
      `--output-dir=${outputDirectory}`,
    ],
    env: {},
    repositoryRoot: root,
    now: () => "2026-08-19T00:00:00.000Z",
  });
  assert.equal(result.exitCode, 0);
  assert.equal(result.providerClientConstructed, false);
  assert.equal(result.providerExecutionCount, 0);
  assert.deepEqual(result.runtimeIdentity, identity);
  assert.equal(existsSync(path.join(root, outputDirectory)), false);
});

await check("protected scope excludes UI, Payment, data, migration, Production, and main surfaces", () => {
  const scope = collectScope().map((entry) => entry.path);
  assert.equal(
    scope.some((entry) =>
      /^(app|components)\/|\.module\.css$|payment|supabase|migration|next-env\.d\.ts/iu.test(
        entry,
      ),
    ),
    false,
  );
  const source = readText(verifierPath);
  const sensitiveEnvironmentKey = ["OPENAI", "API", "KEY"].join("_");
  assert.equal(source.includes(sensitiveEnvironmentKey), false);
});

if (failures.length > 0) {
  console.error(`\n${failures.length} V17 verifier check(s) failed.`);
  process.exitCode = 1;
} else {
  console.log(
    `\nM2-P4 V1-D V17 final Product recovery: PASS ${checks}/${checks}`,
  );
  console.log(
    "Cases 3/4/5/6/7 corrected offline; Cases 1/2/8/9 and AI-first V3 preserved; Provider calls 0.",
  );
}
