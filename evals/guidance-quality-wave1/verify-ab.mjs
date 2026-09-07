import assert from "node:assert/strict";
import { AssessmentPipeline } from "../../lib/assessment/runtime/pipeline.ts";
import { FakeAiStageTransport, FakeAssessmentRepository } from "../../lib/assessment/runtime/fakes.ts";
import { loadM2P4FinalProductRecoveryRuntimeStageCatalog } from "../../lib/assessment/runtime/schema-catalog.ts";
import { buildEffectiveDecisionPolicyV2 } from "../../lib/assessment/runtime/effective-decision-policy-v2.ts";
import { buildEffectiveDecisionPolicyV3 } from "../../lib/assessment/runtime/effective-decision-policy-v3.ts";
import { evaluateJpy980InputSufficiencyV4 } from "../../lib/assessment/runtime/jpy980-input-sufficiency-policy-v4.ts";
import { evaluateJpy980InputSufficiencyV5 } from "../../lib/assessment/runtime/jpy980-input-sufficiency-policy-v5.ts";
import { classifyGuidanceCommunicationPurposeV1 } from "../../lib/assessment/runtime/guidance-communication-purpose-v1.ts";
import { evaluateJpy980ProductScopeV1 } from "../../lib/assessment/runtime/jpy980-product-scope-validation-v1.ts";
import { AB_CASE_IDS, AB_FIXTURE_PROVENANCE, makeAbFixture, rebuildAbFixture } from "./ab-fixtures.mjs";

const catalog = await loadM2P4FinalProductRecoveryRuntimeStageCatalog();
let checks = 0;
const check = async (name, fn) => { await fn(); checks++; console.log(`PASS ${checks} ${name}`); };

export async function runCurrentPreparation(fixture) {
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
  return { result, repository, transport };
}

for (const caseId of AB_CASE_IDS) {
  await check(`${caseId}: current V17 reaches V4 and isolated successor preserves intended direction`, async () => {
    const fixture = makeAbFixture(caseId);
    const snapshot = JSON.stringify(fixture.policyInput);
    const current = await runCurrentPreparation(fixture);
    assert.deepEqual([...current.repository.stageRuns.values()].map((run) => [run.stageId, run.status]), [
      ["PB-01", "completed"], ["PB-01C", "skipped"], ["PB-02", "completed"], ["PB-03", "completed"],
    ]);
    const v4 = evaluateJpy980InputSufficiencyV4(fixture.policyInput);
    const v5 = evaluateJpy980InputSufficiencyV5(fixture.policyInput);
    const policyInput = { authority: fixture.authority, candidateEnvelope: fixture.candidateEnvelope };
    const p2 = buildEffectiveDecisionPolicyV2(policyInput);
    const p3 = buildEffectiveDecisionPolicyV3(policyInput);
    const repaired = ["GQ-28", "GQ-05", "GQ-24"].includes(caseId);
    assert.equal(current.result.eligibility, repaired ? "needs_more_information" : "purchase_ready");
    assert.equal(v4.state, repaired ? "needs_one_clarifying_answer" : "full_paid_ready_candidate");
    assert.deepEqual(v4.missingMaterialDimensions, repaired ? ["usable_action_context"] : []);
    assert.equal(v5.state, "full_paid_ready_candidate");
    const expected = caseId === "GQ-29" ? "wait_and_reassess" : ["GQ-24", "GQ-03"].includes(caseId) ? "reply_now" : "send_now";
    assert.deepEqual(p3.policy.allowed_decisions, [expected]);
    if (caseId === "GQ-24") assert.deepEqual(p2.policy.allowed_decisions, ["wait_and_reassess"]);
    else assert.deepEqual(p3.policy, p2.policy);
    assert.equal(JSON.stringify(fixture.policyInput), snapshot);
    console.log(JSON.stringify({ caseId, current: v4.state, candidate: v5.state, currentDirection: p2.policy.allowed_decisions[0], candidateDirection: p3.policy.allowed_decisions[0] }));
  });
}

const thanks = makeAbFixture("GQ-28");
const ack = makeAbFixture("GQ-24");
await check("explicit boundary, declined invitation and pending outbound cannot acquire a new natural-purpose exception", () => {
  const variants = [
    rebuildAbFixture(thanks, (b) => { b.decision_facts.boundary_state = { kind: "no_contact", status: "explicit", repeated_unanswered_contact: false }; }),
    rebuildAbFixture(thanks, (b) => { b.decision_facts.boundary_state.repeated_unanswered_contact = true; b.decision_facts.contact_state.unanswered_user_message_count = 3; }),
    rebuildAbFixture(thanks, (b) => { b.decision_facts.latest_direct_message.sender = "user"; b.decision_facts.contact_state.unanswered_user_message_count = 1; }),
    rebuildAbFixture(makeAbFixture("GQ-05"), (b) => { b.base_writing_signals.incoming_message_profile.dialogue_acts = ["decline"]; }),
    rebuildAbFixture(ack, (b) => { b.decision_facts.user_contact_constraint = { kind: "unknown", status: "unknown", supporting_fact_ids: [] }; }),
  ];
  for (const fixture of variants) {
    assert.equal(classifyGuidanceCommunicationPurposeV1(fixture.authority), null);
    const input = { authority: fixture.authority, candidateEnvelope: fixture.candidateEnvelope };
    assert.deepEqual(buildEffectiveDecisionPolicyV3(input).policy, buildEffectiveDecisionPolicyV2(input).policy);
  }
});
await check("ordinary unknowns are not invented and missing purpose still asks one question", () => {
  const fixture = rebuildAbFixture(thanks, (b) => {
    b.decision_facts.practical_reason = { kind: "none", active: false, deadline: "none" };
    b.base_writing_signals.user_goal_detail = { value: "unknown", basis: "unresolved" };
  });
  assert.equal(evaluateJpy980InputSufficiencyV5(fixture.policyInput).state, "needs_one_clarifying_answer");
  assert.equal(fixture.rawBase.decision_facts.contact_state.usual_cadence_relation, "unknown");
});
await check("Safety and no grounded evidence retain predecessor outcomes", () => {
  for (const classification of ["needs_review", "rejected"]) {
    const input = structuredClone(thanks.policyInput);
    input.basePolicyInput.aggregateSafety.classification = classification;
    assert.equal(evaluateJpy980InputSufficiencyV5(input).state, "safety_blocked");
  }
  const empty = rebuildAbFixture(thanks, (b) => { b.observed_facts = []; b.timeline = []; });
  assert.equal(evaluateJpy980InputSufficiencyV5(empty.policyInput).state, "not_full_product_candidate");
  assert.deepEqual(evaluateJpy980InputSufficiencyV5(empty.policyInput).missingMaterialDimensions, ["grounded_evidence"]);
});
await check("original text needed for message impact remains a separate clarification; no partial Product bypass", () => {
  const request = { ...thanks.request, requestedTopics: ["decide_send_or_wait", "message_impact"] };
  assert.equal(evaluateJpy980ProductScopeV1(request).decision, "needs_clarification");
  const fixture = rebuildAbFixture(thanks, (b, r) => { r.requestedTopics = [...request.requestedTopics]; });
  const v5 = evaluateJpy980InputSufficiencyV5(fixture.policyInput);
  assert.equal(v5.state, "not_full_product_candidate");
  assert.ok(v5.missingMaterialDimensions.includes("candidate_analysis"));
});
await check("SNS-only, resolved reply and explicit closure keep the old decision", () => {
  for (const mutate of [
    (b) => { b.decision_facts.latest_direct_message.sns_signal_only = true; },
    (b) => { b.decision_facts.latest_direct_message.user_reply_state = "replied"; },
    (b) => { b.base_writing_signals.incoming_message_profile.closure_signal = "explicit"; },
  ]) {
    const fixture = rebuildAbFixture(ack, mutate);
    const input = { authority: fixture.authority, candidateEnvelope: fixture.candidateEnvelope };
    assert.equal(classifyGuidanceCommunicationPurposeV1(fixture.authority), null);
    assert.deepEqual(buildEffectiveDecisionPolicyV3(input).policy, buildEffectiveDecisionPolicyV2(input).policy);
  }
});
await check("user contact constraints and request-chip-only purposes cannot create exceptions", () => {
  const mutations = [
    [thanks, (b) => { b.base_writing_signals.user_goal_detail.basis = "requested_topics"; }],
    [thanks, (b) => { b.base_writing_signals.explicit_user_constraints = [{ kind: "no_followup_message", bounded_summary: null }]; }],
    [makeAbFixture("GQ-05"), (b) => { b.base_writing_signals.explicit_user_constraints = [{ kind: "no_self_invitation", bounded_summary: null }]; }],
    [ack, (b) => { b.base_writing_signals.explicit_user_constraints = [{ kind: "no_private_contact_at_work", bounded_summary: null }]; }],
    [ack, (b) => { b.base_writing_signals.incoming_message_profile.dialogue_acts = ["affection_expression"]; }],
  ];
  for (const [base, mutate] of mutations) {
    const fixture = rebuildAbFixture(base, mutate);
    assert.equal(classifyGuidanceCommunicationPurposeV1(fixture.authority), null);
  }
});
await check("a greeting reply retains optional response-expectation source metadata", () => {
  const fixture = rebuildAbFixture(ack, (b) => {
    b.base_writing_signals.incoming_message_profile.dialogue_acts = ["other"];
  });
  assert.equal(classifyGuidanceCommunicationPurposeV1(fixture.authority)?.kind, "natural_incoming_reply");
  assert.equal(fixture.authority.effectiveDecisionContext.decisionFacts.latest_direct_message.response_expectation, "optional");
});
console.log(`GUIDANCE A/B PASS ${checks}/${checks}; PROVIDER=0 DB=0; ${AB_FIXTURE_PROVENANCE}`);
