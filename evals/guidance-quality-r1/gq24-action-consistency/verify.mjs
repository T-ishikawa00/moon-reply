import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

// Install before importing any application module. This verifier has no runner,
// Provider, credentials, DB, repair, retry, or mutation of prior run evidence.
const previousFetch = globalThis.fetch;
let forbiddenNetworkCalls = 0;
globalThis.fetch = async () => {
  forbiddenNetworkCalls++;
  throw new Error("NETWORK_FORBIDDEN_LOCAL_EVIDENCE_ONLY");
};

const directory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(directory, "../../..");
const receiptDirectory = path.join(root,
  "evals/guidance-quality-v19-l1/runs/2026-09-07-authorized-pilot8-v19-l1/internal/31a5eebb-5b54-4ca9-a46b-3e2ec4d32295");
const receiptAllowlist = new Set(["call-040-request.json", "call-040-response.json"]);
const receiptHashes = new Map();
const digest = bytes => createHash("sha256").update(bytes).digest("hex");
function readReceipt(name) {
  assert.ok(receiptAllowlist.has(name), "Only the two fixed PB06 receipts may be read");
  const bytes = fs.readFileSync(path.join(receiptDirectory, name));
  receiptHashes.set(name, digest(bytes));
  return JSON.parse(bytes.toString("utf8"));
}

let checks = 0;
function test(label, check) {
  check();
  checks++;
  console.log(`PASS ${checks} ${label}`);
}

try {
  const { evaluateSemanticFindingsV7 } = await import("../../../lib/assessment/runtime/semantic-disposition-v7.ts");
  const { validateDecisionPlanConstraintIntegrityV1 } = await import("../../../lib/assessment/runtime/decision-plan-constraint-integrity-v1.ts");
  const fixtures = JSON.parse(fs.readFileSync(path.join(directory, "fixtures.json"), "utf8"));
  // Select only needed content; never print receipt-level identity or policy versions.
  const request = readReceipt("call-040-request.json").input;
  const savedValidation = JSON.parse(readReceipt("call-040-response.json").outputText);
  const savedPlan = request.decision_plan;
  const savedReport = request.report_content;
  // Match the exact split-facts projection used by the saved pilot transport.
  const savedFacts = structuredClone(request.base_structured_intake.decision_facts);
  delete savedFacts.user_contact_constraint;
  savedFacts.schema_version = "m2-p4-decision-facts-v2";
  savedFacts.contact_state.proposed_message_present = request.candidate_envelope.presence;
  const original = savedValidation.semantic_checks[0];
  const classify = (findings, plan = savedPlan, report = savedReport) => evaluateSemanticFindingsV7({
    validationOutput: { ...savedValidation, semantic_checks: structuredClone(findings) },
    decisionPlan: structuredClone(plan),
    groundedReportContent: structuredClone(report),
    decisionFacts: structuredClone(savedFacts),
  });
  const isBlocked = result => result.blockingFindings.length > 0;
  const currentPolicyRefs = original.evidence_refs.filter(ref => ref !== "policy:action_context");

  test("saved actual finding is reproduced as blocking without changing evidence", () => {
    assert.equal(original.finding_code, "ACTION_CONSISTENCY");
    assert.equal(original.severity, "major");
    assert.equal(original.json_path, "decision_plan.change_conditions[1].resulting_direction");
    assert.equal(savedPlan.selected_decision, "reply_now");
    assert.equal(savedPlan.change_conditions[1].resulting_direction, "wait_and_reassess");
    const result = classify(savedValidation.semantic_checks);
    assert.equal(result.blockingFindings.length, 1);
    assert.equal(result.ignoredTemporalFalsePositives.length, 0);
    assert.equal(result.findingDispositions[0].reason, "material_product_outcome_path");
  });

  test("removing only action-context evidence in memory activates the existing exception", () => {
    const changed = { ...original, evidence_refs: currentPolicyRefs };
    const result = classify([changed]);
    assert.equal(result.blockingFindings.length, 0);
    assert.equal(result.ignoredTemporalFalsePositives.length, 1);
    assert.equal(result.findingDispositions[0].reason, "future_reassessment_is_not_current_policy_authority");
    assert.ok(original.evidence_refs.includes("policy:action_context"));
  });

  test("current, wrong, and nonexistent future paths do not receive the exception", () => {
    for (const jsonPath of [
      "decision_plan.selected_decision",
      "decision_plan.actions_to_take[0]",
      "decision_plan.aftercare_plan[0].action",
      "decision_plan.change_conditions[1].condition",
      "decision_plan.change_conditions[999].resulting_direction",
      "decision_plan.change_conditions[-1].resulting_direction",
    ]) {
      assert.ok(isBlocked(classify([{ ...original, json_path: jsonPath, evidence_refs: currentPolicyRefs }])));
    }
  });

  test("independent fact or contact-boundary evidence keeps future findings blocking", () => {
    for (const ref of ["F100", "policy:contact_constraint_policy", "policy:action_context"]) {
      assert.ok(isBlocked(classify([{ ...original, evidence_refs: [...currentPolicyRefs, ref] }])));
    }
    assert.ok(isBlocked(classify([{ ...original, finding_code: "SAFETY_REGRESSION", evidence_refs: ["policy:contact_constraint_policy"] }])));
  });

  const expected = new Map([
    ["SEND_NOW_THEN_WAIT", ["send_now", "PASS"]],
    ["REPLY_NOW_THEN_WAIT", ["reply_now", "PASS"]],
    ["DO_NOT_SEND_AND_WAIT", ["wait_and_reassess", "PASS"]],
    ["SEND_NOW_AND_DO_NOT_SEND_NOW", ["send_now", "FAIL"]],
    ["SEND_NOW_THEN_SEND_AGAIN_IMMEDIATELY_WITHOUT_REASON", ["send_now", "FAIL_EXISTING_CONTACT_POLICY"]],
    ["WAIT_UNTIL_REPLY_THEN_REPLY", ["wait_and_reassess", "PASS"]],
    ["EXPLICIT_BOUNDARY_DO_NOT_CONTACT", ["pause_additional_contact", "PASS_AS_NO_SEND"]],
  ]);
  test("all seven preregistered temporal expectations remain fixed and marked unvalidated", () => {
    assert.equal(fixtures.candidate_temporal_evaluator, "NOT_IMPLEMENTED_UNVALIDATED");
    assert.equal(fixtures.fixtures.length, expected.size);
    assert.equal(new Set(fixtures.fixtures.map(fixture => fixture.id)).size, expected.size);
    for (const fixture of fixtures.fixtures) {
      assert.deepEqual([fixture.primary_direction, fixture.expected_semantic_result], expected.get(fixture.id));
      assert.ok(fixture.temporal_events.length >= 2);
      assert.equal(fixture.expected_candidate_defects.length > 0, fixture.expected_semantic_result.startsWith("FAIL"));
      assert.ok(fixture.temporal_events.every(event => ["send", "reply", "wait", "do_not_send", "reassess"].includes(event.action)));
    }
  });

  for (const fixture of fixtures.fixtures) {
    test(`${fixture.id}: routing authored findings only, not detecting prose semantics`, () => {
      const plan = structuredClone(savedPlan);
      plan.selected_decision = fixture.primary_direction;
      plan.actions_to_take = fixture.temporal_events.map(event => event.instruction);
      const result = classify(fixture.authored_findings, plan);
      assert.equal(result.blockingFindings.length, fixture.expected_existing_classifier_blocking);
      // No finding means no semantic detector ran. Even contradictory authored
      // prose cannot be detected by this findings-disposition function alone.
      assert.equal(classify([], plan).blockingFindings.length, 0);
    });
  }

  test("same metadata cannot distinguish valid post-send waiting from real future contradiction", () => {
    const contradictory = structuredClone(savedPlan);
    contradictory.aftercare_plan[1].action = "今回の返信を送った直後、追加の一通を送る。同じ時点の同じ一通は送らない。";
    contradictory.change_conditions[1].condition = "今回の返信を送った直後。同じ追加メッセージを送る指示と送らない指示が同時に適用される。";
    const finding = { ...original, detail: "Synthetic real defect: the same additional message is both required and prohibited at T1." };
    assert.equal(finding.json_path, original.json_path);
    assert.deepEqual(finding.evidence_refs, original.evidence_refs);
    assert.ok(isBlocked(classify([finding], contradictory)));
    // The existing metadata-based exception also ignores this authored real
    // defect once action_context is removed. Adding that ref to its allowlist
    // would not provide the missing semantic discrimination.
    const narrowedRefs = classify([{ ...finding, evidence_refs: currentPolicyRefs }], contradictory);
    assert.equal(narrowedRefs.blockingFindings.length, 0);
    assert.equal(narrowedRefs.ignoredTemporalFalsePositives.length, 1);
  });

  test("same metadata cannot distinguish harmless waiting from unjustified immediate second send", () => {
    const repeated = structuredClone(savedPlan);
    repeated.actions_to_take[2] = "返信したら、相手からの連絡も新しい用件もないまま直後にもう一通送る。";
    repeated.aftercare_plan[0].action = repeated.actions_to_take[2];
    repeated.change_conditions[1] = {
      ...repeated.change_conditions[1],
      condition: "今回の返信を送った直後。新しい受信も実用上の理由もない。",
      resulting_direction: "send_now",
    };
    const finding = { ...original, detail: "Synthetic real defect: a second immediate outbound message is required without any new fact or reason." };
    assert.deepEqual(finding.evidence_refs, original.evidence_refs);
    assert.ok(isBlocked(classify([finding], repeated)));
    assert.equal(classify([{ ...finding, evidence_refs: currentPolicyRefs }], repeated).blockingFindings.length, 0);
    assert.ok(isBlocked(classify([{ ...finding, evidence_refs: [...currentPolicyRefs, "F100"] }], repeated)));
  });

  const noContact = {
    schema_version: "m2-p4-contact-constraint-policy-v1",
    constraint_kind: "no_followup_message",
    constraint_status: "explicit",
    supporting_fact_ids: ["F100"],
    follow_up_exception: "none",
    outbound_contact_now_allowed: false,
    outbound_contact_after_time_passage_allowed: false,
    exception_required_for_future_contact: true,
  };
  const boundaryPlan = structuredClone(savedPlan);
  boundaryPlan.selected_decision = "pause_additional_contact";
  boundaryPlan.recommended_message_draft = null;
  boundaryPlan.message_draft_edit_metadata = null;
  boundaryPlan.actions_to_take = ["連絡しないでほしいという境界を尊重して送らない。"];
  boundaryPlan.aftercare_plan = [];
  boundaryPlan.change_conditions = [{ condition: "時間が経っても境界が続いている。", resulting_direction: "pause_additional_contact", supporting_fact_ids: ["F100"] }];
  const validateBoundary = plan => validateDecisionPlanConstraintIntegrityV1({
    decisionPlan: plan,
    contactConstraintPolicy: noContact,
    actionContext: request.action_context,
  });
  test("existing structured boundary validator accepts no-send without invented exceptions", () => {
    assert.doesNotThrow(() => validateBoundary(boundaryPlan));
  });
  test("existing structured boundary validator rejects current send, future send, and later draft", () => {
    for (const mutation of [
      plan => { plan.selected_decision = "send_now"; },
      plan => { plan.change_conditions[0].resulting_direction = "reply_now"; },
      plan => { plan.recommended_message_draft = { text: "連絡します。", policy: "later_only", use_timing: "later" }; },
    ]) {
      const plan = structuredClone(boundaryPlan);
      mutation(plan);
      assert.throws(() => validateBoundary(plan), error => error.safeCode === "M2_PLAN_CONSTRAINT_INTEGRITY_FAILED");
    }
  });

  test("original receipts unchanged and no network or evaluation replay performed", () => {
    assert.deepEqual(new Set(receiptHashes.keys()), receiptAllowlist);
    for (const [name, before] of receiptHashes) {
      assert.equal(digest(fs.readFileSync(path.join(receiptDirectory, name))), before);
    }
    assert.equal(forbiddenNetworkCalls, 0);
  });
  console.log(JSON.stringify({
    checks, passed: checks, realApiCalls: 0, forbiddenNetworkCalls,
    savedFalsePositiveReproduced: true, authoredTemporalSpecifications: 7,
    classifierChecksConsumeAuthoredFindings: true,
    candidateTemporalEvaluator: "NOT_IMPLEMENTED_UNVALIDATED",
    modelQualityValidated: false, oldStopLifted: false, mappingDisclosed: false,
  }));
} finally {
  globalThis.fetch = previousFetch;
}
