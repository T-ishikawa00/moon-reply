import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { AssessmentApplication } from "../lib/assessment/runtime/application.ts";
import { projectCustomerAssessmentExperienceV2 } from "../lib/assessment/runtime/customer-assessment-experience-projection-v2.ts";
import { M2RuntimeError } from "../lib/assessment/runtime/errors.ts";
import {
  FakeAiStageTransport,
  FakeAssessmentRepository,
} from "../lib/assessment/runtime/fakes.ts";
import {
  GENERATED_DRAFT_AUTHORITY_VIOLATION_CODE,
  validateGeneratedDraftAuthorityV1,
} from "../lib/assessment/runtime/generated-draft-authority-v1.ts";
import { validateDecisionPlanAgainstPolicyV2 } from "../lib/assessment/runtime/policy-v2.ts";
import {
  executeControlledProviderReviewV16,
  loadControlledReviewInputAuthority,
  V1_D_CONTROLLED_PROVIDER_INPUTS_SHA256,
  V16ControlledReviewFakeAssessmentRepository,
} from "../lib/assessment/runtime/review/m2-p4-v15-controlled-review-executor.ts";
import {
  loadM2P4QualityReassessmentRuntimeStageCatalog,
  loadM2P4SentMessageDraftBoundaryRuntimeStageCatalog,
} from "../lib/assessment/runtime/schema-catalog.ts";

const root = process.cwd();
const historicalExecution = "ecef2470e34d1a9fe82c0fc5683735d6aa5394f0";
const baseline = "d1a604a74edb06344e0b465c63aa21f45f64169a";
const technicalSnapshot = "2a458ec16e26e5089cdf455319622e60e8c9d3d1";
const expectedMain = "61e33a10e195fad17e253a6b9719217e1992f273";
const expectedBranch =
  "fix/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-v1-d-step2b-c1-r1-required-now-draft-authority";
const expectedSubject = "fix: preserve V1-D required-now draft authority";
const precommit = process.argv.includes("--precommit");
const packageRoot =
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-v1-d";
const planningRoot =
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-r2-c-r1";
const executionRoot =
  packageRoot +
  "/controlled-provider-executions/2026-08-18-case1-ordinary-reply-waiting-2a458ec1";

const updatedPaths = [
  "lib/assessment/runtime/generated-draft-authority-v1.ts",
  "lib/assessment/runtime/pipeline.ts",
  "scripts/verify-m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-v1-d-step2b-c1-sent-draft-boundary.mjs",
  "docs/CODEX_HANDOFF.md",
  "docs/CURRENT_FOCUS.md",
  "docs/WBS.md",
  "docs/phase2/TASK_M2_P4_I3_R1_C1_R3_R2_E_R3_R3_R3_P3_V1_D_STEP2B_C1_SENT_DRAFT_BOUNDARY.md",
  `${packageRoot}/controlled-provider-executor-contract-v1.json`,
  `${packageRoot}/offline-results-v1.json`,
  `${planningRoot}/capabilities-v1.json`,
  `${planningRoot}/implementation-work-packages-v1.json`,
];
const exactScope = [...updatedPaths];

function git(args, options = {}) {
  return execFileSync(
    "git.exe",
    ["-c", "safe.directory=C:/projects/moon-reply", ...args],
    {
      cwd: root,
      encoding: "utf8",
      maxBuffer: 512 * 1024 * 1024,
      ...options,
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

function remoteHead(branch) {
  const output = git(["ls-remote", "--heads", "origin", `refs/heads/${branch}`]);
  const lines = output.split(/\r?\n/u).filter(Boolean);
  assert.ok(lines.length <= 1, branch);
  return lines.length === 0 ? null : lines[0].split(/\s+/u)[0];
}

function collectScope() {
  const tracked = git(["diff", "--name-status", "--no-renames", baseline, "--"])
    .split(/\r?\n/u)
    .filter(Boolean)
    .map((line) => {
      const [status, relativePath] = line.split("\t");
      return { status, path: relativePath.replaceAll("\\", "/") };
    });
  const trackedNames = new Set(tracked.map((entry) => entry.path));
  const untracked = git(["ls-files", "--others", "--exclude-standard"])
    .split(/\r?\n/u)
    .filter(Boolean)
    .map((entry) => entry.replaceAll("\\", "/"))
    .filter((entry) => !trackedNames.has(entry))
    .map((entry) => ({ status: "A", path: entry }));
  return [...tracked, ...untracked];
}

function safeCode(error) {
  return error instanceof M2RuntimeError ? error.safeCode : null;
}

function ids() {
  let index = 0;
  return () =>
    "00000000-0000-4000-8000-" + String(++index).padStart(12, "0");
}

function stageOutputsFromActualCase1() {
  const evidence = readJson(`${executionRoot}/v15-stage-attempt-results-v1.json`);
  const completed = evidence.stage_attempts.filter(
    (entry) => entry.status === "completed" && entry.attemptNumber === 1,
  );
  const outputs = Object.fromEntries(
    completed.map((entry) => [entry.stageId, structuredClone(entry.outputJson)]),
  );
  outputs["PB-06"].semantic_checks = [];
  return outputs;
}

const diagnostics = readJson(
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3/diagnostic-results-v1.json",
);

function diagnosticCase(caseId) {
  const selected = diagnostics.cases.find((entry) => entry.case_id === caseId);
  assert.ok(selected, caseId);
  const outputs = Object.fromEntries(
    selected.provider_calls.map((call) => [
      call.stage_id,
      structuredClone(call.raw_output),
    ]),
  );
  outputs["PB-06"].semantic_checks = [];
  const pb01 = selected.provider_calls.find((call) => call.stage_id === "PB-01");
  const pb04 = selected.provider_calls.find((call) => call.stage_id === "PB-04");
  assert.ok(pb01);
  return {
    fixedClock: selected.fixed_clock,
    outputs,
    input: {
      currentSituation: pb01.provider_request.input.current_situation,
      optionalMessage:
        pb04?.provider_request.input.user_supplied_optional_message ?? null,
      relationship: pb01.provider_request.input.relationship,
      requestedTopics: pb01.provider_request.input.requested_topics,
      privacyAcknowledged: true,
    },
  };
}

function semanticFinding(findingCode, jsonPath) {
  return {
    finding_code: findingCode,
    severity: "major",
    json_path: jsonPath,
    evidence_refs: [],
    detail: "offline fake blocking Product fidelity defect",
  };
}

function semanticOutput(base, findings) {
  return { ...structuredClone(base), semantic_checks: structuredClone(findings) };
}

function stagesFor(scenario, stageId) {
  return [...scenario.repository.stageRuns.values()]
    .filter((stage) => stage.stageId === stageId)
    .sort(
      (left, right) =>
        (left.attemptNumber ?? 1) - (right.attemptNumber ?? 1),
    );
}

async function runApplicationScenario({
  catalog,
  fixedClock,
  input,
  outputs,
  outputSequence = {},
}) {
  const repository =
    catalog.promptBundleVersion === "prompt-bundle-runtime-v16.0.0"
      ? new V16ControlledReviewFakeAssessmentRepository()
      : new FakeAssessmentRepository();
  const transport = new FakeAiStageTransport({ outputs, outputSequence });
  const application = new AssessmentApplication({
    repository,
    transport,
    model: "gpt-5.6-luna",
    promptBundleVersion: catalog.promptBundleVersion,
    schemaSetVersion: catalog.schemaSetVersion,
    definitions: catalog.definitions,
    now: () => fixedClock,
    uuid: ids(),
    timeZone: "Asia/Tokyo",
  });
  let result = null;
  let error = null;
  try {
    result = await application.submit(
      structuredClone(input),
      "step2b-c1-offline-regression",
    );
  } catch (caught) {
    error = caught;
  }
  return { repository, transport, result, error };
}

let passed = 0;
async function check(name, callback) {
  try {
    await callback();
    passed += 1;
    console.log(`PASS ${String(passed).padStart(2, "0")} ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    throw error;
  }
}

const v15Manifest = readJson(
  "lib/assessment/runtime/contracts/runtime-stage-catalog-v15.json",
);
const v16Manifest = readJson(
  "lib/assessment/runtime/contracts/runtime-stage-catalog-v16.json",
);
const controlledAuthority = await loadControlledReviewInputAuthority({
  repositoryRoot: root,
});
const controlledFixture = controlledAuthority.cases.find(
  (entry) => entry.fixture_id === "ordinary_reply_waiting",
);
assert.ok(controlledFixture);
const v15Catalog = await loadM2P4QualityReassessmentRuntimeStageCatalog();
const v16Catalog =
  await loadM2P4SentMessageDraftBoundaryRuntimeStageCatalog();

await check("exact Git authority branch lineage and main are fixed", () => {
  assert.equal(git(["branch", "--show-current"]), expectedBranch);
  assert.equal(git(["rev-parse", "HEAD"]), precommit ? baseline : git(["rev-parse", "HEAD"]));
  assert.equal(
    git(["show", "-s", "--format=%s", baseline]),
    "fix: enforce V1-D sent-message draft boundary",
  );
  assert.equal(git(["rev-parse", `${baseline}^`]), historicalExecution);
  assert.equal(git(["rev-parse", `${historicalExecution}^`]), technicalSnapshot);
  assert.equal(git(["rev-parse", "refs/heads/main"]), expectedMain);
  assert.equal(git(["rev-parse", "refs/remotes/origin/main"]), expectedMain);
  assert.equal(remoteHead("main"), expectedMain);
  if (precommit) {
    assert.equal(git(["rev-parse", "HEAD"]), baseline);
    assert.equal(remoteHead(expectedBranch), null);
  } else {
    assert.equal(git(["rev-list", "--count", `${baseline}..HEAD`]), "1");
    assert.equal(git(["rev-parse", "HEAD^"]), baseline);
    assert.equal(git(["show", "-s", "--format=%s", "HEAD"]), expectedSubject);
    assert.ok([null, git(["rev-parse", "HEAD"])].includes(remoteHead(expectedBranch)));
  }
});

await check("exact scope is 11 UPDATE paths with no add delete or rename", () => {
  const scope = collectScope();
  assert.deepEqual(sorted(scope.map((entry) => entry.path)), sorted(exactScope));
  assert.deepEqual(
    sorted(scope.filter((entry) => entry.status === "M").map((entry) => entry.path)),
    sorted(updatedPaths),
  );
  assert.deepEqual(
    scope.filter((entry) => entry.status === "A").map((entry) => entry.path),
    [],
  );
  assert.equal(
    scope.some((entry) => ["D", "R", "C"].includes(entry.status[0])),
    false,
  );
});

await check("stash and diff check are safe", () => {
  assert.equal(git(["stash", "list"]), "");
  assert.equal(git(["diff", "--check"]), "");
  if (!precommit) assert.equal(git(["status", "--porcelain=v1"]), "");
});

await check("frozen controlled input bytes and SHA remain exact", () => {
  const inputPath = `${packageRoot}/controlled-provider-inputs-v1.json`;
  const sha = createHash("sha256")
    .update(readFileSync(path.join(root, inputPath)))
    .digest("hex");
  assert.equal(sha, V1_D_CONTROLLED_PROVIDER_INPUTS_SHA256);
  assert.equal(sha, "ab1d7b896086da002015a0a6d5cf1c1fb6eac3ffdc48e8410b44a892c1f9a20d");
  assert.equal(worktreeBlob(inputPath), blob(baseline, inputPath));
  assert.equal(controlledAuthority.cases.length, 9);
});

await check("all 18 actual Case 1 evidence files remain byte-identical", () => {
  const files = git(["ls-tree", "-r", "--name-only", baseline, executionRoot])
    .split(/\r?\n/u)
    .filter(Boolean);
  assert.equal(files.length, 18);
  for (const relativePath of files) {
    assert.equal(worktreeBlob(relativePath), blob(baseline, relativePath), relativePath);
  }
});

await check("protected Runtime transport schema migration and Product blobs are unchanged", () => {
  const tracked = git(["ls-tree", "-r", "--name-only", baseline])
    .split(/\r?\n/u)
    .filter(Boolean);
  const protectedPaths = new Set([
    `${packageRoot}/controlled-provider-inputs-v1.json`,
    `${packageRoot}/controlled-provider-authorization-contract-v1.json`,
    `${packageRoot}/case1-actual-product-review-v1.json`,
    "lib/assessment/runtime/contracts/runtime-stage-catalog-v15.json",
    "lib/assessment/runtime/contracts/runtime-stage-catalog-v16.json",
    ...v15Manifest.stages.map((stage) => stage.prompt_path),
    ...v16Manifest.stages.map((stage) => stage.prompt_path),
    "lib/assessment/runtime/review/m2-p4-v15-controlled-review-transport.ts",
    "lib/assessment/runtime/review/m2-p4-v15-controlled-review-evidence.ts",
    "lib/assessment/runtime/application.ts",
    "lib/assessment/runtime/service.ts",
    "lib/assessment/runtime/fakes.ts",
    "lib/assessment/runtime/types.ts",
    "lib/assessment/runtime/effective-assessment-authority-v1.ts",
    "lib/assessment/runtime/effective-assessment-authority-integrity-v1.ts",
    "lib/assessment/runtime/effective-decision-policy-v1.ts",
    "lib/assessment/runtime/policy-v2.ts",
    "lib/assessment/runtime/policy-v3.ts",
    "lib/assessment/runtime/product-semantic-shape-v1.ts",
    "lib/assessment/runtime/quality-reassessment-v1.ts",
    "lib/assessment/runtime/supabase-repository.ts",
    "lib/assessment/runtime/customer-assessment-projection-v1.ts",
    "lib/assessment/runtime/customer-assessment-experience-projection-v2.ts",
    "components/runtime/CustomerAssessmentNote.tsx",
    "components/runtime/CustomerAssessmentNote.module.css",
    "next-env.d.ts",
    ...tracked.filter((entry) => /clarification/iu.test(entry)),
    ...tracked.filter((entry) => entry.endsWith(".schema.json")),
    ...tracked.filter((entry) => /^supabase\/migrations\//u.test(entry)),
    ...tracked.filter((entry) => /(?:payment|stripe|purchase)/iu.test(entry)),
  ]);
  for (const relativePath of protectedPaths) {
    assert.equal(worktreeBlob(relativePath), blob(baseline, relativePath), relativePath);
  }
});

await check("V16 identity changes only PB-04 PB-05 and PB-06 Prompt identities", () => {
  assert.equal(v15Catalog.catalogVersion, "runtime-stage-catalog-v15.0.0");
  assert.equal(v16Catalog.catalogVersion, "runtime-stage-catalog-v16.0.0");
  assert.equal(v16Catalog.promptBundleVersion, "prompt-bundle-runtime-v16.0.0");
  assert.equal(v16Catalog.schemaSetVersion, "pipeline-schema-runtime-v6.0.0");
  assert.equal(v16Catalog.stageTopologyVersion, "split-base-candidate-v1");
  const changed = [];
  for (const v15Stage of v15Manifest.stages) {
    const v16Stage = v16Manifest.stages.find(
      (stage) => stage.stage_id === v15Stage.stage_id,
    );
    assert.ok(v16Stage);
    assert.equal(v16Stage.schema_path, v15Stage.schema_path, v15Stage.stage_id);
    assert.equal(v16Stage.schema_sha256, v15Stage.schema_sha256, v15Stage.stage_id);
    if (
      v16Stage.prompt_path !== v15Stage.prompt_path ||
      v16Stage.prompt_sha256 !== v15Stage.prompt_sha256 ||
      v16Stage.prompt_version !== v15Stage.prompt_version
    ) {
      changed.push(v15Stage.stage_id);
    }
  }
  assert.deepEqual(changed, ["PB-04", "PB-05", "PB-06"]);
});

await check("Application authority matrix preserves required-now and bounded draft routes", () => {
  const laterOnlyPlan = stageOutputsFromActualCase1()["PB-04"];
  const laterOnlyPolicy = { message_draft_policy: "later_only" };
  const requiredNowPolicy = { message_draft_policy: "required_now" };
  assert.throws(
    () =>
      validateGeneratedDraftAuthorityV1({
        candidateEnvelope: { presence: false, candidate: null },
        requestedTopics: ["decide_send_or_wait", "organize_emotions"],
        decisionPolicy: laterOnlyPolicy,
        decisionPlan: laterOnlyPlan,
      }),
    (error) => safeCode(error) === GENERATED_DRAFT_AUTHORITY_VIOLATION_CODE,
  );

  const replyNowPlan = structuredClone(laterOnlyPlan);
  replyNowPlan.selected_decision = "reply_now";
  replyNowPlan.recommended_message_draft.policy = "required_now";
  replyNowPlan.recommended_message_draft.use_timing = "now";
  replyNowPlan.message_draft_edit_metadata.preserved_meaning = false;
  assert.doesNotThrow(() =>
    validateGeneratedDraftAuthorityV1({
      candidateEnvelope: { presence: false, candidate: null },
      requestedTopics: ["decide_send_or_wait"],
      decisionPolicy: requiredNowPolicy,
      decisionPlan: replyNowPlan,
    }),
  );

  const sendNowPlan = structuredClone(replyNowPlan);
  sendNowPlan.selected_decision = "send_now";
  assert.doesNotThrow(() =>
    validateGeneratedDraftAuthorityV1({
      candidateEnvelope: { presence: false, candidate: null },
      requestedTopics: ["decide_send_or_wait"],
      decisionPolicy: requiredNowPolicy,
      decisionPlan: sendNowPlan,
    }),
  );

  assert.doesNotThrow(() =>
    validateGeneratedDraftAuthorityV1({
      candidateEnvelope: { presence: false, candidate: null },
      requestedTopics: ["draft_message"],
      decisionPolicy: laterOnlyPolicy,
      decisionPlan: laterOnlyPlan,
    }),
  );
  assert.doesNotThrow(() =>
    validateGeneratedDraftAuthorityV1({
      candidateEnvelope: { presence: true, candidate: {} },
      requestedTopics: ["decide_send_or_wait"],
      decisionPolicy: laterOnlyPolicy,
      decisionPlan: laterOnlyPlan,
    }),
  );

  assert.throws(
    () =>
      validateDecisionPlanAgainstPolicyV2(
        {
          selected_decision: "pause_additional_contact",
          message_draft: {
            text: "offline fake draft",
            policy: "later_only",
            use_timing: "later",
          },
        },
        {
          allowed_decisions: ["pause_additional_contact"],
          message_draft_policy: "not_allowed",
        },
      ),
    (error) => safeCode(error) === "M2_PLAN_POLICY_VIOLATION",
  );
});

let violationScenario;
await check("actual Case 1 violation fails closed before PB-05", async () => {
  const outputs = stageOutputsFromActualCase1();
  let fakeTransport;
  violationScenario = await executeControlledProviderReviewV16({
    repositoryRoot: root,
    selectedCaseIds: ["ordinary_reply_waiting"],
    transportFactory: () => {
      fakeTransport = new FakeAiStageTransport({ outputs });
      return fakeTransport;
    },
  });
  const evidence = violationScenario.cases[0];
  assert.equal(violationScenario.complete, false);
  assert.equal(evidence.route.safeErrorCode, GENERATED_DRAFT_AUTHORITY_VIOLATION_CODE);
  assert.equal(evidence.route.finalDisposition, "technical_failure");
  assert.deepEqual(fakeTransport.calls, ["PB-01", "PB-02", "PB-03", "PB-04"]);
  assert.equal(
    evidence.stageAttempts.filter((stage) => stage.stageId === "PB-05").length,
    0,
  );
  assert.equal(
    evidence.stageAttempts.filter((stage) => stage.stageId === "PB-06").length,
    0,
  );
  assert.equal(evidence.finalRuntimeReport, null);
  assert.equal(evidence.customerProjection, null);
  assert.equal(fakeTransport.actualProviderCalls, 0);
  assert.equal(violationScenario.providerHttpAttemptCount, 0);
});

await check("required-now reply route without Candidate or draft topic reaches Ready", async () => {
  const fixture = diagnosticCase("E-R3-04");
  fixture.input.requestedTopics = [
    "decide_send_or_wait",
    "organize_emotions",
  ];
  fixture.outputs["PB-01"].decision_facts.selected_requests = [
    "decide_send_or_wait",
    "organize_emotions",
  ];
  fixture.outputs["PB-01"].base_writing_signals.user_goal_detail = {
    value: "maintain_distance",
    basis: "current_situation_explicit",
  };
  fixture.outputs["PB-01"].decision_facts.contact_state.elapsed_since_latest_user_message_minutes =
    0;
  fixture.outputs["PB-01"].decision_facts.information_state.unresolved_fields =
    fixture.outputs["PB-01"].decision_facts.information_state.unresolved_fields.filter(
      (field) => field !== "contact_state.usual_cadence_relation",
    );
  fixture.outputs["PB-04"].message_draft_edit_metadata.preserved_meaning = false;
  const scenario = await runApplicationScenario({
    catalog: v16Catalog,
    fixedClock: fixture.fixedClock,
    input: fixture.input,
    outputs: fixture.outputs,
  });
  assert.equal(scenario.error, null);
  assert.equal(
    scenario.result.eligibility,
    "ready",
    JSON.stringify(scenario.result?.clarification),
  );
  assert.equal(fixture.input.optionalMessage, null);
  assert.equal(fixture.input.requestedTopics.includes("draft_message"), false);
  assert.equal(
    scenario.result.report.decisionPlan.selected_decision,
    "reply_now",
  );
  assert.equal(
    scenario.result.report.decisionPlan.recommended_message_draft.policy,
    "required_now",
  );
  assert.equal(
    scenario.result.report.decisionPlan.recommended_message_draft.use_timing,
    "now",
  );
  assert.equal(
    scenario.result.report.decisionPlan.message_draft_edit_metadata.source_status,
    "generated_without_candidate",
  );
  assert.deepEqual(scenario.transport.calls, [
    "PB-01",
    "PB-02",
    "PB-03",
    "PB-04",
    "PB-05",
    "PB-06",
  ]);
  const projection = projectCustomerAssessmentExperienceV2(
    scenario.result,
    fixture.input.requestedTopics,
  );
  assert.ok(projection.baseProjection.finalDraft);
  assert.equal(
    projection.baseProjection.finalDraft.text,
    scenario.result.report.decisionPlan.recommended_message_draft.text,
  );
  assert.equal(scenario.transport.actualProviderCalls, 0);
});

let compliantScenario;
await check("compliant Case 1 reaches Ready with null draft and null context", async () => {
  const outputs = stageOutputsFromActualCase1();
  const rejectedDraftText = outputs["PB-04"].recommended_message_draft.text;
  outputs["PB-04"].recommended_message_draft = null;
  outputs["PB-04"].message_draft_edit_metadata = null;
  outputs["PB-05"].message_draft_context = null;
  let fakeTransport;
  compliantScenario = await executeControlledProviderReviewV16({
    repositoryRoot: root,
    selectedCaseIds: ["ordinary_reply_waiting"],
    transportFactory: () => {
      fakeTransport = new FakeAiStageTransport({ outputs });
      return fakeTransport;
    },
  });
  const evidence = compliantScenario.cases[0];
  assert.equal(compliantScenario.complete, true);
  assert.equal(evidence.route.finalDisposition, "ready");
  assert.equal(evidence.route.safeErrorCode, null);
  assert.equal(evidence.finalRuntimeReport.decisionPlan.recommended_message_draft, null);
  assert.equal(evidence.finalRuntimeReport.decisionPlan.message_draft_edit_metadata, null);
  assert.equal(evidence.finalRuntimeReport.content.message_draft_context, null);
  assert.equal(evidence.customerProjection.baseProjection.finalDraft, null);
  assert.equal(evidence.customerProjection.draftContext, null);
  assert.ok(evidence.finalRuntimeReport.content.observed_fact_commentary.length > 0);
  assert.ok(evidence.finalRuntimeReport.content.decision_reason_summary.length > 0);
  assert.ok(evidence.finalRuntimeReport.decisionPlan.actions_to_take.length > 0);
  assert.ok(evidence.finalRuntimeReport.decisionPlan.model_generated_limitations.length > 0);
  assert.ok(evidence.finalRuntimeReport.content.anxiety_reframe.length > 0);
  assert.doesNotMatch(JSON.stringify(evidence.finalRuntimeReport), new RegExp(rejectedDraftText, "u"));
  assert.equal(fakeTransport.actualProviderCalls, 0);
  assert.equal(compliantScenario.providerHttpAttemptCount, 0);
});

await check("explicit draft request without Candidate remains Ready and generated", async () => {
  const input = structuredClone(controlledFixture.assessment_input);
  input.requestedTopics = [...input.requestedTopics, "draft_message"];
  input.currentSituation += "\n今後の文面は丁寧な敬語にしたい。";
  const outputs = stageOutputsFromActualCase1();
  outputs["PB-01"].base_writing_signals.relationship_dimensions.observed_register = {
    value: "polite",
    basis: "current_situation_explicit",
  };
  const scenario = await runApplicationScenario({
    catalog: v16Catalog,
    fixedClock: controlledFixture.fixed_clock,
    input,
    outputs,
  });
  assert.equal(scenario.error, null);
  assert.equal(
    scenario.result.eligibility,
    "ready",
    JSON.stringify(scenario.result.clarification),
  );
  assert.equal(input.optionalMessage, null);
  assert.equal(
    scenario.result.report.decisionPlan.message_draft_edit_metadata.source_status,
    "generated_without_candidate",
  );
  assert.ok(scenario.result.report.decisionPlan.recommended_message_draft.text.length > 0);
  assert.equal(scenario.transport.actualProviderCalls, 0);
});

await check("Candidate-backed draft ownership remains unchanged", async () => {
  const fixture = diagnosticCase("E-R3-01");
  fixture.input.requestedTopics = ["draft_message"];
  fixture.input.currentSituation +=
    "\n返信文は丁寧な敬語にし、今の距離感を保ちたい。";
  fixture.outputs["PB-01"].decision_facts.selected_requests = ["draft_message"];
  fixture.outputs["PB-01"].base_writing_signals.relationship_dimensions.observed_register = {
    value: "polite",
    basis: "current_situation_explicit",
  };
  fixture.outputs["PB-01"].base_writing_signals.user_goal_detail = {
    value: "maintain_distance",
    basis: "current_situation_explicit",
  };
  const scenario = await runApplicationScenario({
    catalog: v16Catalog,
    fixedClock: fixture.fixedClock,
    input: fixture.input,
    outputs: fixture.outputs,
  });
  assert.equal(scenario.error, null);
  assert.equal(
    scenario.result.eligibility,
    "ready",
    JSON.stringify(scenario.result.clarification),
  );
  assert.ok(fixture.input.optionalMessage);
  assert.equal(
    scenario.result.report.decisionPlan.message_draft_edit_metadata.source_status,
    "candidate_minimally_edited",
  );
  assert.equal(
    scenario.result.report.decisionPlan.message_draft_edit_metadata.preserved_meaning,
    true,
  );
  assert.deepEqual(scenario.transport.calls, [
    "PB-01",
    "PB-01C",
    "PB-02",
    "PB-03",
    "PB-04",
    "PB-05",
    "PB-06",
  ]);
  assert.equal(scenario.transport.actualProviderCalls, 0);
});

await check("message impact still requires Candidate before any Stage", async () => {
  const fixture = diagnosticCase("E-R3-04");
  fixture.input.requestedTopics = ["message_impact"];
  const scenario = await runApplicationScenario({
    catalog: v16Catalog,
    fixedClock: fixture.fixedClock,
    input: fixture.input,
    outputs: fixture.outputs,
  });
  assert.equal(safeCode(scenario.error), "M2_MESSAGE_IMPACT_CANDIDATE_REQUIRED");
  assert.deepEqual(scenario.transport.calls, []);
  assert.equal(scenario.repository.stageRuns.size, 0);
  assert.equal(scenario.transport.actualProviderCalls, 0);
});

await check("fake sent-message semantic finding enforces bounded plan-and-report recovery", async () => {
  const outputs = stageOutputsFromActualCase1();
  const input = structuredClone(controlledFixture.assessment_input);
  input.requestedTopics = [...input.requestedTopics, "draft_message"];
  input.currentSituation += "\n今後の文面は丁寧な敬語にしたい。";
  outputs["PB-01"].base_writing_signals.relationship_dimensions.observed_register = {
    value: "polite",
    basis: "current_situation_explicit",
  };
  const pass = semanticOutput(outputs["PB-06"], []);
  const first = semanticOutput(outputs["PB-06"], [
    semanticFinding(
      "MESSAGE_POLICY_CONSISTENCY",
      "decision_plan.recommended_message_draft.text",
    ),
  ]);
  const repairedPlan = structuredClone(outputs["PB-04"]);
  repairedPlan.recommended_message_draft = null;
  repairedPlan.message_draft_edit_metadata = null;
  const repairedReport = structuredClone(outputs["PB-05"]);
  repairedReport.message_draft_context = null;
  const scenario = await runApplicationScenario({
    catalog: v16Catalog,
    fixedClock: controlledFixture.fixed_clock,
    input,
    outputs,
    outputSequence: {
      "PB-04": [outputs["PB-04"], repairedPlan],
      "PB-05": [outputs["PB-05"], repairedReport],
      "PB-06": [first, pass],
    },
  });
  assert.equal(scenario.error, null);
  assert.equal(scenario.result.eligibility, "ready");
  assert.deepEqual(stagesFor(scenario, "PB-04").map((stage) => stage.attemptNumber), [1, 2]);
  assert.deepEqual(stagesFor(scenario, "PB-05").map((stage) => stage.attemptNumber), [1, 2]);
  assert.deepEqual(stagesFor(scenario, "PB-06").map((stage) => stage.attemptNumber), [1, 2]);
  assert.equal(
    [...scenario.repository.stageRuns.values()].some(
      (stage) => stage.attemptNumber > 2,
    ),
    false,
  );
  assert.equal(scenario.result.report.decisionPlan.recommended_message_draft, null);
  assert.equal(scenario.transport.actualProviderCalls, 0);
});

await check("fake draft-context contradiction enforces report-only recovery", async () => {
  const outputs = stageOutputsFromActualCase1();
  const input = structuredClone(controlledFixture.assessment_input);
  input.requestedTopics = [...input.requestedTopics, "draft_message"];
  input.currentSituation += "\n今後の文面は丁寧な敬語にしたい。";
  outputs["PB-01"].base_writing_signals.relationship_dimensions.observed_register = {
    value: "polite",
    basis: "current_situation_explicit",
  };
  assert.equal(
    outputs["PB-04"].message_draft_edit_metadata.source_status,
    "generated_without_candidate",
  );
  assert.equal(outputs["PB-04"].message_draft_edit_metadata.preserved_meaning, false);
  const contradictory = structuredClone(outputs["PB-05"]);
  contradictory.message_draft_context = "元の候補文を保ちながら調整した";
  const corrected = structuredClone(outputs["PB-05"]);
  corrected.message_draft_context =
    "候補文なしの状態から、依頼された将来利用の文面として新たに作成しています。";
  const pass = semanticOutput(outputs["PB-06"], []);
  const first = semanticOutput(outputs["PB-06"], [
    semanticFinding("FACT_FIDELITY", "report_content.message_draft_context"),
  ]);
  const scenario = await runApplicationScenario({
    catalog: v16Catalog,
    fixedClock: controlledFixture.fixed_clock,
    input,
    outputs,
    outputSequence: {
      "PB-05": [contradictory, corrected],
      "PB-06": [first, pass],
    },
  });
  assert.equal(scenario.error, null);
  assert.equal(scenario.result.eligibility, "ready");
  assert.deepEqual(stagesFor(scenario, "PB-04").map((stage) => stage.attemptNumber), [1]);
  assert.deepEqual(stagesFor(scenario, "PB-05").map((stage) => stage.attemptNumber), [1, 2]);
  assert.deepEqual(stagesFor(scenario, "PB-06").map((stage) => stage.attemptNumber), [1, 2]);
  assert.equal(
    scenario.result.report.content.message_draft_context,
    corrected.message_draft_context,
  );
  assert.equal(
    [...scenario.repository.stageRuns.values()].some(
      (stage) => stage.attemptNumber > 2,
    ),
    false,
  );
  assert.equal(scenario.transport.actualProviderCalls, 0);
});

await check("PB-04 PB-05 and PB-06 successors encode the required authority", () => {
  const pb04 = readText(
    "lib/assessment/runtime/contracts/pb-04-sent-message-draft-authority-v1.developer.md",
  );
  const pb05 = readText(
    "lib/assessment/runtime/contracts/pb-05-draft-context-source-fidelity-v1.developer.md",
  );
  const pb06 = readText(
    "lib/assessment/runtime/contracts/pb-06-sent-unsent-semantic-quality-v1.developer.md",
  );
  assert.match(pb04, /historical observed event/u);
  assert.match(pb04, /later_only/u);
  assert.match(pb04, /recommended_message_draft\s*=\s*null/u);
  assert.match(pb05, /generated_without_candidate/u);
  assert.match(pb05, /preserved_meaning\s*=\s*false/u);
  assert.match(pb06, /MESSAGE_POLICY_CONSISTENCY/u);
  assert.match(pb06, /FACT_FIDELITY/u);
  assert.match(pb06, /evaluates output and never rewrites Product prose/u);
});

await check("Runtime correction contains no Case 1 literal or language classifier", () => {
  const authoritySource = readText(
    "lib/assessment/runtime/generated-draft-authority-v1.ts",
  );
  const runtimeSources = [
    authoritySource,
    readText("lib/assessment/runtime/pipeline.ts"),
    readText(
      "lib/assessment/runtime/contracts/pb-04-sent-message-draft-authority-v1.developer.md",
    ),
    readText(
      "lib/assessment/runtime/contracts/pb-05-draft-context-source-fidelity-v1.developer.md",
    ),
    readText(
      "lib/assessment/runtime/contracts/pb-06-sent-unsent-semantic-quality-v1.developer.md",
    ),
  ].join("\n");
  assert.doesNotMatch(runtimeSources, /ordinary_reply_waiting/u);
  assert.doesNotMatch(runtimeSources, /2026-08-18-case1/u);
  assert.doesNotMatch(runtimeSources, /昨日はありがとう。また話せたらうれしい/u);
  assert.doesNotMatch(authoritySource, /RegExp|\.match\(|\.test\(|includes\([^)]*(?:送|返信|候補)/u);
  assert.doesNotMatch(authoritySource, /[\u3040-\u30ff\u4e00-\u9fff]/u);
});

await check("current answer and future reassessment labels use separate authorities", () => {
  const source = readText("components/runtime/CustomerAssessmentNote.tsx");
  assert.match(source, /const decisionLabels:/u);
  assert.match(source, /wait_and_reassess: "今は送らず、次の材料を待つ"/u);
  assert.match(source, /const futureDecisionLabels:/u);
  assert.match(source, /reply_now: "その時点で返信する方向を検討する"/u);
  assert.match(source, /send_now: "その時点で送る方向を検討する"/u);
  assert.match(source, /wait_and_reassess: "その時点で状況を見直す"/u);
  assert.match(source, /pause_additional_contact: "その時点でも追加の連絡は止める"/u);
  assert.match(source, /decisionLabels\[baseProjection\.decisionCode\]/u);
  assert.match(source, /futureDecisionLabels\[item\.resultingDirection\]/u);
  assert.doesNotMatch(source, /その場合：\{decisionLabels\[/u);
  assert.equal(
    worktreeBlob("components/runtime/CustomerAssessmentNote.module.css"),
    blob(baseline, "components/runtime/CustomerAssessmentNote.module.css"),
  );
});

await check("controlled runner selects V16 and leaves transport and gate artifacts intact", () => {
  const runner = readText(
    "scripts/run-m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-v1-d-controlled-provider-review.mjs",
  );
  const executor = readText(
    "lib/assessment/runtime/review/m2-p4-v15-controlled-review-executor.ts",
  );
  assert.match(
    runner,
    /executeControlledProviderReviewV16 as executeControlledProviderReview/u,
  );
  assert.match(runner, /runtime-stage-catalog-v16\.0\.0/u);
  assert.match(executor, /loadM2P4SentMessageDraftBoundaryRuntimeStageCatalog/u);
  assert.match(executor, /runtime-stage-catalog-v16\.0\.0/u);
  assert.equal(
    worktreeBlob(
      "lib/assessment/runtime/review/m2-p4-v15-controlled-review-transport.ts",
    ),
    blob(
      baseline,
      "lib/assessment/runtime/review/m2-p4-v15-controlled-review-transport.ts",
    ),
  );
  assert.equal(
    worktreeBlob(
      "lib/assessment/runtime/review/m2-p4-v15-controlled-review-evidence.ts",
    ),
    blob(
      baseline,
      "lib/assessment/runtime/review/m2-p4-v15-controlled-review-evidence.ts",
    ),
  );
});

await check("actual Case 1 Product review artifact is truthful and Human-owned evidence is untouched", () => {
  const review = readJson(`${packageRoot}/case1-actual-product-review-v1.json`);
  assert.equal(review.execution_commit, historicalExecution);
  assert.equal(review.fixture_id, "ordinary_reply_waiting");
  assert.equal(review.execution_technical, "PASS");
  assert.equal(review.routing_correct, "PASS");
  assert.equal(review.evidence_to_decision_chain_clear, "PASS");
  assert.equal(review.uncertainty_honest, "PASS");
  assert.equal(review.emotional_understanding, "positive_directional");
  assert.equal(review.sent_unsent_integrity, "FAIL");
  assert.equal(review.action_usable, "FAIL_due_to_sent_message_draft");
  assert.equal(review.future_reassessment_ux, "FAIL");
  assert.equal(review.chatgpt_plausibly_worth_jpy980, false);
  assert.equal(review.human_product_judgment, "pending");
  assert.equal(review.remaining_provider_cases, "HOLD");
  assert.deepEqual(review.observed_pb_06_semantic_checks, []);
  assert.equal(review.actual_provider_semantic_false_negative_count_lower_bound, 1);
  assert.equal(review.provider_recall_precision_generalization, "prohibited_from_one_case");
  assert.equal(review.historical_human_review_sheet.modified, false);
});

await check("status records separate historical execution from correction operations", () => {
  const plan = readJson(`${packageRoot}/controlled-provider-review-plan-v1.json`);
  const contract = readJson(
    `${packageRoot}/controlled-provider-executor-contract-v1.json`,
  );
  const offline = readJson(`${packageRoot}/offline-results-v1.json`);
  const capabilities = readJson(`${planningRoot}/capabilities-v1.json`);
  const workPackages = readJson(
    `${planningRoot}/implementation-work-packages-v1.json`,
  );
  const v1dPackage = workPackages.packages.find((entry) => entry.id === "V1-D");
  assert.equal(plan.step_2a_acceptance.status, "accepted_complete");
  assert.equal(plan.case_1_actual_execution.technical_judgment, "PASS");
  assert.equal(plan.case_1_actual_execution.product_judgment, "remediation_required");
  assert.equal(plan.step_2b_c1_successor.status, "implemented_pending_human_chatgpt_review");
  assert.equal(
    contract.step_2b_c1_r1_correction.initial_chatgpt_review,
    "NEEDS_CORRECTION 0/1/0",
  );
  assert.equal(
    contract.step_2b_c1_r1_correction.finding,
    "required_now_generated_draft_route_is_unreachable",
  );
  assert.equal(
    contract.step_2b_c1_r1_correction.status,
    "implemented_pending_human_chatgpt_review",
  );
  assert.equal(
    contract.generated_draft_authority.consumes_effective_decision_policy_used_by_plan_validation,
    true,
  );
  assert.equal(
    contract.generated_draft_authority.required_now_without_candidate_or_draft_topic_allowed,
    true,
  );
  assert.equal(contract.operations.provider_calls, 0);
  assert.equal(contract.evidence_ceiling.actual_v16_provider_prose_quality, "unestablished");
  assert.equal(offline.fixture_results.historical_case_1_provider_http_attempts, 6);
  assert.equal(offline.fixture_results.provider_executed_in_step_2b_correction, false);
  assert.equal(
    offline.fixture_results.provider_executed_in_step_2b_c1_r1_correction,
    false,
  );
  assert.equal(offline.operations.provider_calls, 0);
  assert.equal(
    offline.current_product_authority.v1_d,
    "step_2b_c1_r1_implemented_pending_human_chatgpt_review",
  );
  assert.equal(offline.current_product_authority.r2_c, "remediation_required");
  assert.equal(offline.current_product_authority.jpy980RuntimeReadiness, "not_established");
  assert.equal(offline.current_product_authority.globalQ0Completion, false);
  assert.equal(offline.validation.step_2b_c1_r1_dedicated_verifier, "PASS 23/23");
  assert.equal(
    offline.validation.immutable_original_step_2b_c1_verifier_once,
    "PASS 22/22 executed_once",
  );
  assert.equal(capabilities.exact_scope.total, "PASS 11/11");
  assert.equal(
    capabilities.v1_d.step_2b_c1_initial_finding,
    "required_now_generated_draft_route_is_unreachable",
  );
  assert.ok(v1dPackage);
  assert.equal(v1dPackage.step_2b_c1_r1_exact_scope.total, "PASS 11/11");
});

await check("changed files contain no sensitive values and every JSON parses", () => {
  const changedText = exactScope.map(readText).join("\n");
  assert.doesNotMatch(
    changedText,
    /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/u,
  );
  assert.doesNotMatch(changedText, /\bsk-[A-Za-z0-9_-]{20,}\b/u);
  for (const relativePath of exactScope.filter((entry) => entry.endsWith(".json"))) {
    assert.doesNotThrow(() => readJson(relativePath), relativePath);
  }
});

assert.equal(passed, 23);
console.log("\nM2-P4 V1-D Step 2B C1-R1 required-now correction verifier: PASS 23/23");
console.log("Provider/DB/Supabase/migration apply/Payment/deploy: 0/0/0/0/0/0");
console.log("Actual V16 Provider quality: unestablished; Case 1 rerun: unauthorized");
