import { REQUESTED_TOPIC_VALUES } from "../../lib/assessment/runtime/types.ts";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { AssessmentPipeline } from "../../lib/assessment/runtime/pipeline.ts";
import { FakeAiStageTransport, FakeAssessmentRepository } from "../../lib/assessment/runtime/fakes.ts";
import { loadM2P4FinalProductRecoveryRuntimeStageCatalog } from "../../lib/assessment/runtime/schema-catalog.ts";
import { buildEffectiveDecisionPolicyV2 } from "../../lib/assessment/runtime/effective-decision-policy-v2.ts";
import { buildEffectiveDecisionPolicyV3 } from "../../lib/assessment/runtime/effective-decision-policy-v3.ts";
import { evaluateJpy980InputSufficiencyV4 } from "../../lib/assessment/runtime/jpy980-input-sufficiency-policy-v4.ts";
import { evaluateJpy980InputSufficiencyV5 } from "../../lib/assessment/runtime/jpy980-input-sufficiency-policy-v5.ts";
import { classifyGuidanceCommunicationPurposeV1 } from "../../lib/assessment/runtime/guidance-communication-purpose-v1.ts";
import {
  CASE_MATRIX_PROVENANCE, CASE_MATRIX_STRUCTURED_CASE_IDS, makeCaseFixture, makeCaseMatrix,
} from "./case-matrix.mjs";

const casesUrl = new URL("../guidance-quality-r1/cases.json", import.meta.url);
// Frozen at 46fa02a. Match the repository's existing LF-normalized hash contract.
const frozenCasesSha256 = "b4544798a68db8dcb1d6a7fe54adc6ddce16c9787ae263d7e5371aefa09efd14";
const caseHash = () => createHash("sha256")
  .update(readFileSync(casesUrl, "utf8").replaceAll("\r\n", "\n")).digest("hex");
const currentStops = new Set(["GQ-01", "GQ-02", "GQ-05", "GQ-06", "GQ-15", "GQ-24", "GQ-28"]);
const knownGaps = {
  "GQ-06": "Scoped declined invitation receives clarification instead of usable boundary guidance. No send is newly allowed; no refusal answer is delivered by this preparation test.",
  "GQ-17": "draft_message with a missing original is ready: existing intake does not distinguish editing a missing original from composing a new draft. The frozen clarify_one expectation remains unmet.",
};

// Runtime labels alone are not the frozen Product labels. These mappings name the
// primary action in each specific consultation; a send followed by waiting is send.
const directionalChecks = {
  "GQ-01": ["send_now", "send_once"],
  "GQ-02": ["send_now", "send_once"],
  "GQ-03": ["reply_now", "reply_once"],
  "GQ-04": ["reply_now", "reply_once"],
  "GQ-05": ["send_now", "invite_once"],
  "GQ-07": ["send_now", "logistics_once"],
  "GQ-08": ["wait_and_reassess", "wait"],
  "GQ-09": ["wait_and_reassess", "wait"],
  "GQ-10": ["wait_and_reassess", "wait"],
  "GQ-11": ["pause_additional_contact", "hold_contact"],
  "GQ-12": ["wait_and_reassess", "wait"],
  "GQ-13": ["pause_additional_contact", "respect_boundary"],
  "GQ-14": ["pause_additional_contact", "respect_boundary"],
  "GQ-15": ["send_now", "send_once"],
  "GQ-20": ["reply_now", "reply_once"],
  "GQ-24": ["reply_now", "reply_once"],
  "GQ-28": ["send_now", "send_once"],
  "GQ-29": ["wait_and_reassess", "wait"],
};

async function runCurrentPreparation(fixture, catalog) {
  const repository = new FakeAssessmentRepository();
  const transport = new FakeAiStageTransport({ outputs: fixture.outputs });
  let count = 0;
  const uuid = () => `00000000-0000-4000-8000-${String(++count).padStart(12, "0")}`;
  const requestId = uuid();
  const runId = uuid();
  const now = "2026-09-07T10:00:00.000Z";
  await repository.createRequest({
    id: requestId, idempotencyKey: fixture.caseId, source: "internal_review_runtime",
    ...fixture.request, now,
  });
  const pipeline = new AssessmentPipeline({
    repository, transport, definitions: catalog.definitions,
    now: () => now, uuid, timeZone: "Asia/Tokyo",
  });
  const result = await pipeline.prepare(fixture.request, {
    requestId, runId, model: "gpt-5.6-luna", startedAt: now,
    promptBundleVersion: catalog.promptBundleVersion,
    schemaSetVersion: catalog.schemaSetVersion,
  });
  assert.equal(transport.actualProviderCalls, 0);
  assert.equal(repository.actualSupabaseCalls, 0);
  assert.deepEqual([...repository.stageRuns.values()].map((run) => [run.stageId, run.status]), [
    ["PB-01", "completed"],
    ["PB-01C", fixture.request.optionalMessage === null ? "skipped" : "completed"],
    ["PB-02", "completed"],
    ["PB-03", "completed"],
  ], `${fixture.caseId}: actual V17 preparation must complete schema/source stages`);
  return result;
}

export async function verifyCaseMatrix({ emit = (value) => console.log(JSON.stringify(value)) } = {}) {
  for (const row of makeCaseMatrix()) {
    assert.ok(row.input.requestedTopics.every(topic => REQUESTED_TOPIC_VALUES.includes(topic)), row.caseId);
  }
  assert.equal(caseHash(), frozenCasesSha256, "Frozen Product expectations changed");
  const source = JSON.parse(readFileSync(casesUrl, "utf8"));
  const matrix = makeCaseMatrix();
  const catalog = await loadM2P4FinalProductRecoveryRuntimeStageCatalog();
  assert.equal(catalog.promptBundleVersion, "prompt-bundle-runtime-v17.0.0");
  assert.equal(catalog.schemaSetVersion, "pipeline-schema-runtime-v6.0.0");
  assert.equal(matrix.length, 30);
  assert.equal(new Set(matrix.map((row) => row.caseId)).size, 30);
  assert.equal(CASE_MATRIX_STRUCTURED_CASE_IDS.length, 21);
  assert.deepEqual(matrix.map((row) => row.sourceCase), source.cases);
  assert.deepEqual(matrix.filter((row) => row.mappingStatus === "synthetic_structured_fixture_available")
    .map((row) => row.caseId), CASE_MATRIX_STRUCTURED_CASE_IDS);

  const outputs = [];
  const evaluations = new Map();
  const originalFetch = globalThis.fetch;
  let attemptedFetchCalls = 0;
  globalThis.fetch = () => {
    attemptedFetchCalls++;
    throw new Error("External fetch is forbidden in the offline case-matrix verifier");
  };
  try {
    for (const row of matrix) {
      const originalCase = source.cases.find((entry) => entry.id === row.caseId);
      assert.deepEqual(row.expectedDirectionSet, originalCase.acceptable_directions.map((entry) => entry.direction));
      assert.deepEqual(row.pairs, source.pairs.filter((pair) => pair.members.includes(row.caseId)));
      assert.equal(row.modelExtraction, "NOT_RUN");
      assert.equal(row.modelAnswerQuality, "NOT_RUN");
      if (row.input.optionalMessage !== null) {
        assert.equal(row.input.currentSituation.includes(row.input.optionalMessage), false,
          `${row.caseId}: Candidate text cannot become a Base fact`);
      }
      const common = {
        caseId: row.caseId, expectedDirectionSet: row.expectedDirectionSet,
        modelExtraction: "NOT_RUN", modelAnswerQuality: "NOT_RUN", candidateFullPipeline: "NOT_RUN_BY_THIS_VERIFIER",
      };
      if (row.mappingStatus === "application_input_only") {
        assert.ok(row.structuredFixtureUnavailableReason);
        assert.throws(() => makeCaseFixture(row.caseId), /No structured fixture/);
        const result = { ...common, status: "INPUT_COVERAGE_ONLY", reason: row.structuredFixtureUnavailableReason };
        outputs.push(result);
        emit(result);
        continue;
      }

      const fixture = makeCaseFixture(row.caseId);
      assert.deepEqual(fixture.request, row.input);
      const before = JSON.stringify(fixture.policyInput);
      const current = await runCurrentPreparation(fixture, catalog);
      const v4 = evaluateJpy980InputSufficiencyV4(fixture.policyInput);
      const v5 = evaluateJpy980InputSufficiencyV5(fixture.policyInput);
      const policyInput = { authority: fixture.authority, candidateEnvelope: fixture.candidateEnvelope };
      const p2 = buildEffectiveDecisionPolicyV2(policyInput);
      const p3 = buildEffectiveDecisionPolicyV3(policyInput);
      assert.equal(JSON.stringify(fixture.policyInput), before, `${row.caseId}: no input mutation`);
      assert.equal(current.eligibility, currentStops.has(row.caseId) ? "needs_more_information" : "purchase_ready");
      assert.equal(v4.state, currentStops.has(row.caseId) ? "needs_one_clarifying_answer" : "full_paid_ready_candidate");
      assert.deepEqual(v4.missingMaterialDimensions, currentStops.has(row.caseId) ? ["usable_action_context"] : []);
      assert.equal(v5.state, row.caseId === "GQ-06" ? "needs_one_clarifying_answer" : "full_paid_ready_candidate");
      if (row.caseId === "GQ-24") assert.deepEqual(p2.policy.allowed_decisions, ["wait_and_reassess"]);
      else assert.deepEqual(p3.policy, p2.policy, `${row.caseId}: V3 preserves the predecessor decision`);

      let status;
      let primaryProductDirection = null;
      let limitation = null;
      if (row.caseId === "GQ-06") {
        status = "KNOWN_GAP";
        limitation = knownGaps[row.caseId];
        assert.deepEqual(row.expectedDirectionSet, ["respect_boundary"]);
        assert.equal(classifyGuidanceCommunicationPurposeV1(fixture.authority), null);
        assert.deepEqual(p3.policy.allowed_decisions, ["wait_and_reassess"]);
        assert.deepEqual(v5.missingMaterialDimensions, ["usable_action_context"]);
        assert.ok(v5.clarification);
        assert.equal(fixture.baseStructuredIntake.decision_facts.boundary_state.kind, "none");
        assert.equal(fixture.baseStructuredIntake.boundaries[0].kind, "other");
        assert.equal(fixture.baseStructuredIntake.decision_facts.latest_direct_message.sender, "unknown");
      } else if (row.caseId === "GQ-17") {
        status = "KNOWN_GAP";
        limitation = knownGaps[row.caseId];
        assert.deepEqual(row.expectedDirectionSet, ["clarify_one"]);
        assert.deepEqual(fixture.request.requestedTopics, ["draft_message"]);
        assert.equal(fixture.request.optionalMessage, null);
        assert.equal(v5.clarification, null);
      } else if (row.caseId === "GQ-16") {
        status = "FUNCTION_SCOPE_ONLY";
        limitation = "Edit-only input is eligible with its original, but the internal wait label is not an edit-only Product verdict. This verifier does not execute or evaluate the rendered edit.";
        assert.deepEqual(row.expectedDirectionSet, ["edit_only"]);
        assert.deepEqual(fixture.request.requestedTopics, ["draft_message"]);
        assert.ok(fixture.request.optionalMessage);
      } else {
        status = "DIRECTION_CONTRACT_MATCH";
        const [runtimeDirection, productDirection] = directionalChecks[row.caseId] ?? [];
        assert.ok(runtimeDirection, `${row.caseId}: missing explicit action interpretation`);
        assert.deepEqual(p3.policy.allowed_decisions, [runtimeDirection]);
        assert.ok(row.expectedDirectionSet.includes(productDirection), `${row.caseId}: outside frozen allowed set`);
        primaryProductDirection = productDirection;
      }

      const result = {
        ...common, status, currentV17Preparation: current.eligibility,
        currentV4: v4.state, candidateV5: v5.state,
        currentDirection: p2.policy.allowed_decisions[0], candidateDirection: p3.policy.allowed_decisions[0],
        primaryProductDirection, limitation,
      };
      evaluations.set(row.caseId, { result, fixture, v4, v5, p2, p3 });
      outputs.push(result);
      emit(result);
    }

    const result = (id) => evaluations.get(id).result;
    const facts = (id) => evaluations.get(id).fixture.baseStructuredIntake.decision_facts;
    for (const [first, second] of [["GQ-01", "GQ-02"], ["GQ-03", "GQ-04"], ["GQ-09", "GQ-10"]]) {
      assert.equal(result(first).candidateDirection, result(second).candidateDirection);
      assert.equal(result(first).candidateV5, result(second).candidateV5);
      assert.deepEqual(facts(first), facts(second), `${first}/${second}: wording cannot change typed decision facts`);
    }
    assert.equal(result("GQ-07").candidateDirection, "send_now");
    assert.equal(result("GQ-08").candidateDirection, "wait_and_reassess");
    assert.deepEqual(facts("GQ-07").contact_state, facts("GQ-08").contact_state);
    assert.deepEqual(facts("GQ-07").latest_direct_message, facts("GQ-08").latest_direct_message);
    assert.equal(facts("GQ-07").contact_state.usual_cadence_relation, "unknown");
    assert.equal(facts("GQ-07").practical_reason.deadline, "next_day");
    assert.equal(facts("GQ-08").practical_reason.deadline, "none");
    assert.equal(result("GQ-11").candidateDirection, "pause_additional_contact");
    assert.equal(result("GQ-12").candidateDirection, "wait_and_reassess");
    assert.equal(facts("GQ-11").contact_state.unanswered_user_message_count, 3);
    assert.equal(facts("GQ-12").contact_state.unanswered_user_message_count, 1);
    assert.equal(facts("GQ-11").contact_state.elapsed_since_latest_user_message_minutes, null);
    assert.equal(facts("GQ-12").contact_state.elapsed_since_latest_user_message_minutes, null);
    assert.equal(result("GQ-13").candidateDirection, "pause_additional_contact");
    assert.equal(result("GQ-14").candidateDirection, "pause_additional_contact");
    assert.equal(facts("GQ-13").boundary_state.kind, "temporary_distance");
    assert.equal(facts("GQ-14").boundary_state.kind, "no_contact");
    assert.equal(result("GQ-03").candidateDirection, "reply_now");
    assert.equal(result("GQ-29").candidateDirection, "wait_and_reassess");
    assert.equal(facts("GQ-03").latest_direct_message.sender, "other_person");
    assert.equal(facts("GQ-29").latest_direct_message.sender, "user");
    assert.equal(attemptedFetchCalls, 0);
    assert.equal(caseHash(), frozenCasesSha256, "Verifier must not change frozen expectations");

    const count = (status) => outputs.filter((row) => row.status === status).length;
    const summary = {
      artifact: "guidance-quality-wave1-case-matrix-local-verification",
      assertionResult: "PASS", assertionsMeaning: "Offline fixture contracts and preserved known gaps; not real answer quality",
      coverageRows: outputs.length, currentV17Preparations: evaluations.size,
      candidateV5AndPolicyV3DirectComparisons: evaluations.size,
      directionContractMatches: count("DIRECTION_CONTRACT_MATCH"),
      functionScopeOnly: count("FUNCTION_SCOPE_ONLY"), knownGaps: count("KNOWN_GAP"),
      inputCoverageOnly: count("INPUT_COVERAGE_ONLY"),
      wordingPairs: 3, factAndBoundaryControls: 4,
      candidateFullPipelineRunsByThisVerifier: 0, providerCalls: 0, supabaseCalls: 0, attemptedFetchCalls,
      realModelExtraction: "NOT_RUN", realModelAnswerQuality: "NOT_RUN", actualWaitPrevalence: "UNKNOWN",
      casesSha256: frozenCasesSha256, provenance: CASE_MATRIX_PROVENANCE,
    };
    assert.equal(summary.directionContractMatches, 18);
    assert.equal(summary.functionScopeOnly, 1);
    assert.equal(summary.knownGaps, 2);
    assert.equal(summary.inputCoverageOnly, 9);
    emit(summary);
    return { summary, rows: outputs };
  } finally {
    globalThis.fetch = originalFetch;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  await verifyCaseMatrix();
}
