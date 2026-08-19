import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { AssessmentApplication } from "../lib/assessment/runtime/application.ts";
import { projectBaseProviderInputV1 } from "../lib/assessment/runtime/base-structured-intake-grounding-v1.ts";
import { groundBaseStructuredIntakeV3 } from "../lib/assessment/runtime/base-structured-intake-grounding-v3.ts";
import { groundCandidateAnalysisV2 } from "../lib/assessment/runtime/candidate-analysis-grounding-v2.ts";
import { buildChangeConditionCommentaryV4 } from "../lib/assessment/runtime/change-condition-grounding-v4.ts";
import {
  clarificationSourceIdentityV1,
  createOpaqueClarificationIdV1,
  validateClarificationAnswerV1,
} from "../lib/assessment/runtime/clarification-evidence-v1.ts";
import { groundClarificationEvidenceV1 } from "../lib/assessment/runtime/clarification-grounding-v1.ts";
import { validateClarificationSourceIntegrityV1 } from "../lib/assessment/runtime/clarification-source-integrity-v1.ts";
import { projectCustomerAssessmentExperienceV2 } from "../lib/assessment/runtime/customer-assessment-experience-projection-v2.ts";
import { validateDecisionPlanConstraintIntegrityV1 } from "../lib/assessment/runtime/decision-plan-constraint-integrity-v1.ts";
import { buildEffectiveAssessmentAuthorityV1 } from "../lib/assessment/runtime/effective-assessment-authority-v1.ts";
import { validateEffectiveAssessmentAuthorityIntegrityV1 } from "../lib/assessment/runtime/effective-assessment-authority-integrity-v1.ts";
import { M2RuntimeError } from "../lib/assessment/runtime/errors.ts";
import {
  FakeAiStageTransport,
  FakeAssessmentRepository,
} from "../lib/assessment/runtime/fakes.ts";
import { evaluateJpy980InputSufficiencyV3 } from "../lib/assessment/runtime/jpy980-input-sufficiency-policy-v3.ts";
import { requireContextualDecisionFactsV3 } from "../lib/assessment/runtime/policy-v3.ts";
import { buildRelationshipSummaryV3 } from "../lib/assessment/runtime/report-grounding-v3.ts";
import { createActionContextV1 } from "../lib/assessment/runtime/runtime-authority-v1.ts";
import { loadM2P4FinalProductRecoveryRuntimeStageCatalog } from "../lib/assessment/runtime/schema-catalog.ts";
import {
  evaluateSemanticFindingsV7,
  isNeutralReassessmentCommentaryV4,
} from "../lib/assessment/runtime/semantic-disposition-v7.ts";
import {
  buildAbsentCandidateLaneV1,
  buildAvailableCandidateLaneV1,
} from "../lib/assessment/runtime/split-analysis-envelope-v1.ts";

const root = process.cwd();
const baseline = "35b4ca21c2736fb7df1fcbe9fc589b94fd99fde5";
const expectedBranch = "fix/m2-p4-q0-final-reassessment-semantics";
const expectedSubject = "fix: make future conditions reassessment-only";
const packageRoot =
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-v1-d";
const executionRoot = `${packageRoot}/controlled-provider-executions`;
const verifierPath =
  "scripts/verify-m2-p4-q0-final-reassessment-semantics.mjs";
const notePath = "components/runtime/CustomerAssessmentNote.tsx";
const exactScope = [
  notePath,
  "lib/assessment/runtime/change-condition-grounding-v4.ts",
  "lib/assessment/runtime/pipeline.ts",
  "lib/assessment/runtime/semantic-disposition-v7.ts",
  verifierPath,
];
const newPaths = new Set([
  "lib/assessment/runtime/change-condition-grounding-v4.ts",
  "lib/assessment/runtime/semantic-disposition-v7.ts",
  verifierPath,
]);
const v17Directories = {
  reply_waiting_with_usual_cadence:
    "2026-08-19-case3-reply-cadence-v17-fcd54a0c",
  draft_request_with_relationship_intent:
    "2026-08-19-case4-draft-intent-v17-fcd54a0c",
  polite_thank_you_with_draft:
    "2026-08-19-case5-polite-draft-v17-fcd54a0c",
  kansai_persona_draft:
    "2026-08-19-case6-kansai-draft-v17-fcd54a0c",
  alternative_tradeoff_applicable:
    "2026-08-19-case7-tradeoff-applicable-v17-fcd54a0c",
};
const case1Directory =
  "2026-08-18-case1-ordinary-reply-waiting-v16-bc973d02";
const case9Directory =
  "2026-08-18-case9-one-clarification-ai-first-v16-cd1518ce";
const case4Candidate =
  "昨日はありがとう。話せてうれしかった。また都合が合うときに話せたらうれしいです。";
const politeCandidate =
  "今日はありがとうございました。お話しできてうれしかったです。";
const kansaiCandidate = "おっけー、土曜ならいけるで！\nまた時間おしえて〜😊";
const neutralReassessmentLabel = "その時点で状況を見直す";

function git(args, options = {}) {
  return execFileSync(
    "git.exe",
    ["-c", "safe.directory=C:/projects/moon-reply", ...args],
    {
      cwd: root,
      encoding: options.encoding === undefined ? "utf8" : options.encoding,
      maxBuffer: 512 * 1024 * 1024,
    },
  );
}

function gitText(args) {
  return git(args).trim();
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

function collectScope() {
  const tracked = gitText([
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
  const trackedPaths = new Set(tracked.map((entry) => entry.path));
  const untracked = gitText(["ls-files", "--others", "--exclude-standard"])
    .split(/\r?\n/u)
    .filter(Boolean)
    .map((entry) => entry.replaceAll("\\", "/"))
    .filter((entry) => !trackedPaths.has(entry))
    .map((entry) => ({ status: "A", path: entry }));
  return [...tracked, ...untracked];
}

function treeFiles(revision, relativePath) {
  return gitText(["ls-tree", "-r", "--name-only", revision, relativePath])
    .split(/\r?\n/u)
    .filter(Boolean)
    .map((entry) => entry.replaceAll("\\", "/"));
}

function baselineBlob(relativePath) {
  return git(["show", `${baseline}:${relativePath}`], { encoding: null });
}

function assertRawTreeByteIdentical(relativePath) {
  const files = treeFiles(baseline, relativePath);
  assert.ok(files.length > 0, relativePath);
  for (const file of files) {
    assert.ok(readFileSync(path.join(root, file)).equals(baselineBlob(file)), file);
  }
  return files.length;
}

function assertTrackedBlobIdentical(relativePath) {
  assert.equal(
    gitText(["hash-object", `--path=${relativePath}`, relativePath]),
    gitText(["rev-parse", `${baseline}:${relativePath}`]),
    relativePath,
  );
}

function controlledInput(fixtureId) {
  const inputs = readJson(`${packageRoot}/controlled-provider-inputs-v1.json`);
  const selected = inputs.cases.find((entry) => entry.fixture_id === fixtureId);
  assert.ok(selected, fixtureId);
  return selected;
}

function evidence(fixtureId, directory, version) {
  const stageEvidence = readJson(
    `${executionRoot}/${directory}/${version}-stage-attempt-results-v1.json`,
  );
  const fixture = controlledInput(fixtureId);
  return {
    fixtureId,
    directory,
    fixture,
    request: fixture.assessment_input,
    stageAttempts: stageEvidence.stage_attempts,
    stage(stageId, attemptNumber = 1) {
      const selected = stageEvidence.stage_attempts.find(
        (entry) =>
          entry.stageId === stageId &&
          entry.attemptNumber === attemptNumber &&
          entry.outputJson !== null,
      );
      assert.ok(selected, `${fixtureId}:${stageId}:${attemptNumber}`);
      return selected;
    },
  };
}

function v17Evidence(fixtureId) {
  return evidence(fixtureId, v17Directories[fixtureId], "v17");
}

function outputConfiguration(stageAttempts) {
  const grouped = new Map();
  for (const entry of stageAttempts) {
    if (entry.outputJson === null) continue;
    const outputs = grouped.get(entry.stageId) ?? [];
    outputs.push(structuredClone(entry.outputJson));
    grouped.set(entry.stageId, outputs);
  }
  const outputs = {};
  const outputSequence = {};
  for (const [stageId, values] of grouped) {
    outputs[stageId] = values[0];
    if (values.length > 1) outputSequence[stageId] = values;
  }
  return { outputs, outputSequence };
}

function ids() {
  let index = 0;
  return () =>
    `00000000-0000-4000-8000-${String(++index).padStart(12, "0")}`;
}

const catalog = await loadM2P4FinalProductRecoveryRuntimeStageCatalog();
let providerCalls = 0;
let supabaseCalls = 0;

async function replay(actual, idempotencyKey) {
  const repository = new FakeAssessmentRepository();
  const transport = new FakeAiStageTransport(
    outputConfiguration(actual.stageAttempts),
  );
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
  providerCalls += transport.actualProviderCalls;
  supabaseCalls += repository.actualSupabaseCalls;
  assert.equal(transport.actualProviderCalls, 0);
  assert.equal(repository.actualSupabaseCalls, 0);
  return { actual, repository, transport, result };
}

function savedReport(run) {
  const reports = [...run.repository.reports.values()];
  assert.equal(reports.length, 1);
  return reports[0].reportJson;
}

function attemptNumbers(run, stageId) {
  return [...run.repository.stageRuns.values()]
    .filter((entry) => entry.stageId === stageId)
    .map((entry) => entry.attemptNumber)
    .sort((left, right) => left - right);
}

function assertNoAttempt3(run) {
  assert.equal(
    [...run.repository.stageRuns.values()].some(
      (entry) => entry.attemptNumber > 2,
    ),
    false,
  );
}

function groundedAuthority(actual) {
  const baseStructuredIntake = groundBaseStructuredIntakeV3(
    projectBaseProviderInputV1(actual.request),
    actual.stage("PB-01").outputJson,
  );
  let candidateLane = buildAbsentCandidateLaneV1();
  if (actual.request.optionalMessage !== null) {
    const candidate = groundCandidateAnalysisV2(
      actual.stage("PB-01C").outputJson,
    );
    candidateLane = buildAvailableCandidateLaneV1(
      candidate.candidate_analysis,
      candidate.candidate_safety_result,
    );
  }
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
  const projectedDecisionFacts = structuredClone(
    baseStructuredIntake.decision_facts,
  );
  delete projectedDecisionFacts.user_contact_constraint;
  projectedDecisionFacts.schema_version = "m2-p4-decision-facts-v2";
  projectedDecisionFacts.contact_state.proposed_message_present =
    candidateLane.candidate_envelope.presence;
  const decisionFacts = requireContextualDecisionFactsV3({
    decision_facts: projectedDecisionFacts,
  });
  return {
    baseStructuredIntake,
    candidateLane,
    effectiveAuthority,
    decisionFacts,
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

function buildClarificationGrounding(initialRoute, fixture) {
  const clarificationId = createOpaqueClarificationIdV1(
    new Uint8Array(32).fill(9),
  );
  const validated = validateClarificationAnswerV1({
    target: initialRoute.clarification.target,
    answer: fixture.clarification.answer_payload,
    resumeStartedAt: fixture.fixed_clock,
  });
  const sourceIdentity = clarificationSourceIdentityV1(clarificationId);
  const clarificationEvidence = {
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
    evidence: clarificationEvidence,
    providerOutput: {
      schema_version: "pipeline-schema-clarification-grounding-v1.0.0",
      target: clarificationEvidence.target,
      source_identity: sourceIdentity,
      answer_fingerprint: clarificationEvidence.answerFingerprint,
      materially_resolves_target: clarificationEvidence.resolvesTarget,
      clarification_safety_result: {
        classification: "normal_allowed",
        reason_codes: [],
        response_mode: "none",
      },
    },
  });
  validateClarificationSourceIntegrityV1({
    evidence: clarificationEvidence,
    grounding,
  });
  return grounding;
}

function semanticOutput(findings) {
  return {
    schema_version: "pipeline-schema-v1.0.0",
    validation_mode: "semantic_findings_only",
    deterministic_checks: [],
    semantic_checks: findings,
    final_disposition: null,
    repair_strategy: null,
    failed_codes: [],
  };
}

function safeCode(error) {
  return error instanceof M2RuntimeError ? error.safeCode : null;
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

await check("exact baseline, branch, one-commit mode, and five-path scope", () => {
  assert.equal(gitText(["branch", "--show-current"]), expectedBranch);
  const head = gitText(["rev-parse", "HEAD"]);
  if (head === baseline) {
    assert.equal(gitText(["rev-list", "--count", `${baseline}..HEAD`]), "0");
  } else {
    assert.equal(gitText(["rev-parse", "HEAD^"]), baseline);
    assert.equal(gitText(["show", "-s", "--format=%s", "HEAD"]), expectedSubject);
  }
  const scope = collectScope();
  assert.deepEqual(sorted(scope.map((entry) => entry.path)), sorted(exactScope));
  for (const entry of scope) {
    assert.equal(entry.status, newPaths.has(entry.path) ? "A" : "M", entry.path);
  }
});

await check("historical V15/V16/V17 evidence, prompts, catalogs, and protected surfaces are unchanged", () => {
  assert.equal(assertRawTreeByteIdentical(executionRoot), 418);
  for (const relativePath of treeFiles(
    baseline,
    "lib/assessment/runtime/contracts",
  )) {
    assertTrackedBlobIdentical(relativePath);
  }
  for (const relativePath of [
    "components/runtime/CustomerAssessmentNote.module.css",
    "lib/assessment/runtime/change-condition-grounding-v3.ts",
    "lib/assessment/runtime/semantic-disposition-v6.ts",
    "lib/assessment/runtime/schema-catalog.ts",
    "lib/assessment/runtime/review/m2-p4-v15-controlled-review-executor.ts",
    "scripts/run-m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-v1-d-controlled-provider-review.mjs",
    `${packageRoot}/controlled-provider-inputs-v1.json`,
    "next-env.d.ts",
  ]) {
    assertTrackedBlobIdentical(relativePath);
  }
  assert.equal(
    existsSync(
      path.join(
        root,
        "lib/assessment/runtime/contracts/runtime-stage-catalog-v18.json",
      ),
    ),
    false,
  );
});

await check("all future conditions use one neutral Application commentary and UI wording", () => {
  const case3 = v17Evidence("reply_waiting_with_usual_cadence");
  const sourcePlan = case3.stage("PB-04").outputJson;
  for (const direction of [
    "reply_now",
    "send_now",
    "wait_and_reassess",
    "pause_additional_contact",
  ]) {
    const plan = structuredClone(sourcePlan);
    plan.change_conditions = [
      { ...plan.change_conditions[0], resulting_direction: direction },
    ];
    assert.deepEqual(buildChangeConditionCommentaryV4(plan), [
      `「${plan.change_conditions[0].condition.replace(/[。．.!！?？]+$/u, "") }」が確認された場合は、その時点で状況を見直します。`,
    ]);
  }
  const noteSource = readText(notePath);
  for (const currentLabel of [
    "今、返信する",
    "今、送る",
    "今は送らず、次の材料を待つ",
    "追加の連絡を止める",
  ]) {
    assert.ok(noteSource.includes(currentLabel), currentLabel);
  }
  assert.ok(noteSource.includes(neutralReassessmentLabel));
  assert.match(noteSource, /<p>\{item\.condition\}<\/p>/u);
  assert.match(noteSource, /<span>\{futureReassessmentLabel\}<\/span>/u);
  assert.doesNotMatch(
    noteSource,
    /futureDecisionLabels|item\.resultingDirection|その時点で返信する方向|その時点で送る方向|その時点でも追加の連絡は止める/u,
  );
});

let case3Run;
await check("Case 3 keeps wait/current null draft and removes visible future reply direction", async () => {
  const actual = v17Evidence("reply_waiting_with_usual_cadence");
  case3Run = await replay(actual, "q0-case3-neutral-reassessment");
  assert.equal(case3Run.result.eligibility, "ready");
  assert.equal(case3Run.result.decision, "wait_and_reassess");
  const projection = projectCustomerAssessmentExperienceV2(
    case3Run.result,
    actual.request.requestedTopics,
  );
  assert.equal(projection.baseProjection.finalDraft, null);
  const futureReply = projection.baseProjection.reassessment.conditions.find(
    (entry) => entry.resultingDirection === "reply_now",
  );
  assert.ok(futureReply);
  assert.match(futureReply.condition, /返信|普段の返信ペース/u);
  const report = savedReport(case3Run);
  assert.equal(
    isNeutralReassessmentCommentaryV4(
      report.decisionPlan,
      report.content,
    ),
    true,
  );
  assert.doesNotMatch(
    JSON.stringify(report.content.change_condition_commentary),
    /返信する方向|送る方向|追加連絡を止める方向/u,
  );
  assertNoAttempt3(case3Run);
});

let case4Run;
await check("Case 4 exact captured attempt 2 becomes deliverable without changing Candidate", async () => {
  const actual = v17Evidence("draft_request_with_relationship_intent");
  case4Run = await replay(actual, "q0-case4-exact-attempt2");
  assert.equal(case4Run.result.eligibility, "ready");
  assert.equal(case4Run.result.decision, "wait_and_reassess");
  assert.deepEqual(attemptNumbers(case4Run, "PB-04"), [1, 2]);
  assert.deepEqual(attemptNumbers(case4Run, "PB-05"), [1, 2]);
  assert.deepEqual(attemptNumbers(case4Run, "PB-06"), [1, 2]);
  const capturedPlan = actual.stage("PB-04", 2).outputJson;
  const report = savedReport(case4Run);
  assert.deepEqual(report.decisionPlan, capturedPlan);
  assert.equal(report.decisionPlan.recommended_message_draft.text, case4Candidate);
  assert.equal(report.decisionPlan.recommended_message_draft.policy, "later_only");
  assert.equal(report.decisionPlan.recommended_message_draft.use_timing, "later");
  assert.equal(
    report.decisionPlan.message_draft_edit_metadata.source_status,
    "candidate_preserved",
  );
  assert.equal(
    report.decisionPlan.message_draft_edit_metadata.preserved_meaning,
    true,
  );
  const projection = projectCustomerAssessmentExperienceV2(
    case4Run.result,
    actual.request.requestedTopics,
  );
  assert.equal(projection.baseProjection.finalDraft.text, case4Candidate);
  assert.ok(projection.baseProjection.messageTemperature);
  assert.ok(projection.draftContext);
  const authority = groundedAuthority(actual);
  assert.equal(
    report.content.relationship_summary,
    buildRelationshipSummaryV3(authority.decisionFacts),
  );
  assert.doesNotMatch(
    JSON.stringify(report.content),
    /候補文がない|候補文本文を確認できない/u,
  );
  assert.equal(
    isNeutralReassessmentCommentaryV4(
      report.decisionPlan,
      report.content,
    ),
    true,
  );
  assertNoAttempt3(case4Run);
});

let case7Run;
await check("Case 7 exact captured attempt 2 becomes deliverable with no future second-send prose", async () => {
  const actual = v17Evidence("alternative_tradeoff_applicable");
  case7Run = await replay(actual, "q0-case7-exact-attempt2");
  assert.equal(case7Run.result.eligibility, "ready");
  assert.equal(case7Run.result.decision, "send_now");
  assert.deepEqual(attemptNumbers(case7Run, "PB-04"), [1, 2]);
  assert.deepEqual(attemptNumbers(case7Run, "PB-05"), [1, 2]);
  assert.deepEqual(attemptNumbers(case7Run, "PB-06"), [1, 2]);
  const capturedPlan = actual.stage("PB-04", 2).outputJson;
  const report = savedReport(case7Run);
  assert.deepEqual(report.decisionPlan, capturedPlan);
  assert.equal(
    report.decisionPlan.message_draft_edit_metadata.source_status,
    "generated_without_candidate",
  );
  assert.equal(
    report.decisionPlan.message_draft_edit_metadata.preserved_meaning,
    false,
  );
  assert.deepEqual(report.decisionPlan.aftercare_plan, capturedPlan.aftercare_plan);
  assert.equal(
    isNeutralReassessmentCommentaryV4(
      report.decisionPlan,
      report.content,
    ),
    true,
  );
  const projection = projectCustomerAssessmentExperienceV2(
    case7Run.result,
    actual.request.requestedTopics,
  );
  assert.equal(
    projection.baseProjection.finalDraft.text,
    capturedPlan.recommended_message_draft.text,
  );
  assert.doesNotMatch(
    JSON.stringify(projection),
    /必要な連絡を送る方向へ見直|その時点で送る方向|その時点で返信する方向/u,
  );
  const aftercareText = JSON.stringify(report.decisionPlan.aftercare_plan);
  assert.match(aftercareText, /12時/u);
  assert.match(aftercareText, /返信|予約/u);
  assertNoAttempt3(case7Run);
});

let case5Run;
let case6Run;
await check("Cases 5 and 6 preserve exact drafts and requested Product content", async () => {
  const case5 = v17Evidence("polite_thank_you_with_draft");
  case5Run = await replay(case5, "q0-case5-regression");
  assert.equal(case5Run.result.eligibility, "ready");
  assert.equal(case5Run.result.decision, "send_now");
  const projection5 = projectCustomerAssessmentExperienceV2(
    case5Run.result,
    case5.request.requestedTopics,
  );
  assert.equal(projection5.baseProjection.finalDraft.text, politeCandidate);
  assert.ok(projection5.baseProjection.messageTemperature);
  assert.ok(projection5.draftContext);
  assertNoAttempt3(case5Run);

  const case6 = v17Evidence("kansai_persona_draft");
  case6Run = await replay(case6, "q0-case6-regression");
  assert.equal(case6Run.result.eligibility, "ready");
  assert.equal(case6Run.result.decision, "reply_now");
  const projection6 = projectCustomerAssessmentExperienceV2(
    case6Run.result,
    case6.request.requestedTopics,
  );
  assert.equal(projection6.baseProjection.finalDraft.text, kansaiCandidate);
  assert.ok(projection6.draftContext);
  assert.doesNotMatch(
    JSON.stringify(projection6),
    /Decision Plan|decision_plan|report_content|PB-0[1-6]|quality_reassessment|schema_version|Provider|\bRuntime\b/u,
  );
  assertNoAttempt3(case6Run);
});

await check("semantic disposition ignores only current-policy future labels and owned neutral commentary", () => {
  const actual = v17Evidence("alternative_tradeoff_applicable");
  const authority = groundedAuthority(actual);
  const report = savedReport(case7Run);
  const evaluate = (findings, reportContent = report.content) =>
    evaluateSemanticFindingsV7({
      validationOutput: semanticOutput(findings),
      decisionPlan: report.decisionPlan,
      groundedReportContent: reportContent,
      decisionFacts: authority.decisionFacts,
    });
  const currentPolicyOnly = {
    finding_code: "ACTION_CONSISTENCY",
    severity: "major",
    json_path: "decision_plan.change_conditions[0].resulting_direction",
    evidence_refs: [
      "policy:effective_decision_policy_result",
      "policy:decision_policy_result",
    ],
    detail: "future enum differs from current policy",
  };
  assert.equal(evaluate([currentPolicyOnly]).blockingFindings.length, 0);
  assert.equal(evaluate([currentPolicyOnly]).ignoredTemporalFalsePositives.length, 1);
  const contactOwned = {
    ...currentPolicyOnly,
    evidence_refs: ["policy:contact_constraint_policy"],
  };
  assert.equal(evaluate([contactOwned]).blockingFindings.length, 1);
  const neutralCommentary = {
    finding_code: "ACTION_CONSISTENCY",
    severity: "major",
    json_path: "report_content.change_condition_commentary[0]",
    evidence_refs: ["policy:action_context"],
    detail: "old directional interpretation",
  };
  assert.equal(evaluate([neutralCommentary]).blockingFindings.length, 0);
  const mismatchedReport = structuredClone(report.content);
  mismatchedReport.change_condition_commentary[0] += "別の方向です。";
  assert.equal(
    evaluate([neutralCommentary], mismatchedReport).blockingFindings.length,
    1,
  );
  assert.equal(
    evaluate([
      { ...neutralCommentary, finding_code: "UNKNOWN_CRITICAL_FINDING" },
    ]).blockingFindings.length,
    1,
  );
  for (const finding of [
    {
      finding_code: "ACTION_CONSISTENCY",
      severity: "major",
      json_path: "decision_plan.selected_decision",
      evidence_refs: [],
      detail: "current decision",
    },
    {
      finding_code: "ACTION_CONSISTENCY",
      severity: "major",
      json_path: "decision_plan.actions_to_take[0]",
      evidence_refs: [],
      detail: "current action",
    },
    {
      finding_code: "ACTION_CONSISTENCY",
      severity: "major",
      json_path: "decision_plan.actions_to_avoid[0]",
      evidence_refs: [],
      detail: "avoid action",
    },
    {
      finding_code: "MESSAGE_POLICY_CONSISTENCY",
      severity: "major",
      json_path: "decision_plan.recommended_message_draft.policy",
      evidence_refs: [],
      detail: "draft policy",
    },
    {
      finding_code: "ACTION_CONSISTENCY",
      severity: "major",
      json_path: "decision_plan.aftercare_plan[0].action",
      evidence_refs: [],
      detail: "aftercare",
    },
    {
      finding_code: "FACT_FIDELITY",
      severity: "major",
      json_path: "decision_plan.change_conditions[0].condition",
      evidence_refs: [],
      detail: "condition fact",
    },
  ]) {
    assert.equal(evaluate([finding]).blockingFindings.length, 1, finding.json_path);
  }
});

await check("explicit no-followup and unknown contact constraints still reject future outbound directions", () => {
  const report = savedReport(case7Run);
  const boundaryPlan = structuredClone(report.decisionPlan);
  boundaryPlan.selected_decision = "wait_and_reassess";
  boundaryPlan.recommended_message_draft = null;
  boundaryPlan.message_draft_edit_metadata = null;
  boundaryPlan.change_conditions[0].resulting_direction = "send_now";
  const actionContext = createActionContextV1({
    trustedNowIso: "2026-08-19T00:00:00.000Z",
    timeZone: "Asia/Tokyo",
  });
  for (const contactConstraintPolicy of [
    {
      schema_version: "m2-p4-contact-constraint-policy-v1",
      constraint_kind: "no_followup_message",
      constraint_status: "explicit",
      supporting_fact_ids: ["F001"],
      follow_up_exception: "none",
      outbound_contact_now_allowed: false,
      outbound_contact_after_time_passage_allowed: false,
      exception_required_for_future_contact: true,
    },
    {
      schema_version: "m2-p4-contact-constraint-policy-v1",
      constraint_kind: "unknown",
      constraint_status: "unknown",
      supporting_fact_ids: [],
      follow_up_exception: "none",
      outbound_contact_now_allowed: false,
      outbound_contact_after_time_passage_allowed: false,
      exception_required_for_future_contact: true,
    },
  ]) {
    assert.throws(
      () =>
        validateDecisionPlanConstraintIntegrityV1({
          decisionPlan: boundaryPlan,
          contactConstraintPolicy,
          actionContext,
        }),
      (error) => safeCode(error) === "M2_PLAN_CONSTRAINT_INTEGRITY_FAILED",
    );
  }
});

await check("Case 1 sent-message boundary and Case 9 one-clarification path remain protected", async () => {
  const case1 = evidence(
    "ordinary_reply_waiting",
    case1Directory,
    "v16",
  );
  const case1Run = await replay(case1, "q0-case1-sent-boundary");
  assert.equal(case1Run.result.eligibility, "ready");
  const projection1 = projectCustomerAssessmentExperienceV2(
    case1Run.result,
    case1.request.requestedTopics,
  );
  assert.equal(projection1.baseProjection.finalDraft, null);
  assertNoAttempt3(case1Run);

  const case9 = evidence(
    "one_clarification_answer_becomes_ready",
    case9Directory,
    "v16",
  );
  const authority9 = groundedAuthority(case9);
  const initial = evaluateJpy980InputSufficiencyV3(policyInput(authority9));
  assert.equal(initial.state, "needs_one_clarifying_answer");
  assert.equal(initial.clarification.target, "latest_contact_timing");
  assert.equal(initial.clarificationBudget.questionsRemaining, 1);
  const grounding = buildClarificationGrounding(initial, case9.fixture);
  const resumed = evaluateJpy980InputSufficiencyV3(
    policyInput(authority9, grounding),
  );
  assert.equal(resumed.state, "full_paid_ready_candidate");
  assert.equal(resumed.clarification, null);
  assert.equal(resumed.clarificationBudget.questionsAlreadyUsed, 1);
  assert.equal(resumed.clarificationBudget.questionsRemaining, 0);
});

await check("Provider calls, Supabase calls, and attempt 3 remain zero", () => {
  assert.equal(providerCalls, 0);
  assert.equal(supabaseCalls, 0);
  for (const run of [case3Run, case4Run, case5Run, case6Run, case7Run]) {
    assertNoAttempt3(run);
  }
  const source = readText(verifierPath);
  const providerExecutionFlag = ["execute", "provider", "review"].join("-");
  const providerTransportName = [
    "ReviewOnly",
    "OpenAiResponses",
    "Transport",
  ].join("");
  assert.equal(source.includes(providerExecutionFlag), false);
  assert.equal(source.includes(providerTransportName), false);
});

if (failures.length > 0) {
  console.error(`\n${failures.length} focused reassessment check(s) failed.`);
  process.exitCode = 1;
} else {
  console.log(
    `\nQ0 final deterministic reassessment semantics: PASS ${checks}/${checks}`,
  );
  console.log(
    "Cases 3/4/7 corrected offline; Cases 1/5/6/9 and contact boundaries preserved; Provider calls 0.",
  );
}
