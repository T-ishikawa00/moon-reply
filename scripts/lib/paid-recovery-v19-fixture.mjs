// External Provider fake only: retained synthetic structural seed, hand-authored
// candidate envelopes/verdict. Actual preparation, paid execution and DB remain real.
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { createRepairFixture, gratitudeCandidateAnalysis, repairPatch, validationPass } from "../../evals/guidance-quality-v19-l5/repair-fixtures.mjs";
import { prepareV19L5PaidCandidate } from "../../lib/assessment/production/recovery-candidate.ts";
import { loadV19L5StageCatalog } from "../../lib/assessment/runtime/v19-l5-stage-catalog.ts";

export function createPaidRecoveryV19Fixture() {
  return createPaidFixture(createRepairFixture({ clean: true }));
}

export function createPaidRecoveryV19MessageFixture() {
  // Reuse the existing verify-intent GQ16-edit structural seed and authored
  // outputs. This is a contract fixture, not new Blind or model quality evidence.
  const read = file => JSON.parse(readFileSync(file, "utf8"));
  const request = read("evals/guidance-quality-v19-l4/expanded-12/inputs.json").cases.find(item => item.id === "GQ-16").input;
  const root = "evals/blind-runs/2026-09-08-expanded-12-01/internal";
  const matches = readdirSync(root, { withFileTypes: true }).filter(entry => entry.isDirectory() && /^[0-9a-f-]{36}$/u.test(entry.name)).map(entry => entry.name).sort()
    .filter(id => read(`${root}/${id}/session.json`).caseId === "GQ-16");
  assert.equal(matches.length, 2);
  const dir = `${root}/${matches[0]}`;
  const receipt = readdirSync(dir).filter(name => /^call-\d+-response\.json$/u.test(name)).sort()
    .map(name => read(`${dir}/${name}`)).find(item => item.stageId === "PB-01");
  assert.equal(receipt.status, "completed");
  const base = JSON.parse(receipt.outputText), candidateAnalysis = gratitudeCandidateAnalysis();
  candidateAnalysis.candidate_style_profile.register = "polite";
  candidateAnalysis.candidate_style_profile.invitation_style = "tentative";
  Object.assign(candidateAnalysis.candidate_communicative_intent, { gratitude_strength: "high", invitation_presence: true,
    invitation_specificity: "tentative", affection_strength: "medium" });
  return createPaidFixture({ request, base, candidateAnalysis, answerMode: "message_only",
    requestIntent: { message_task: "EDIT_EXISTING_MESSAGE", decision_requested: false, decision_explicitly_excluded: true,
      communication_purpose: "OTHER", source_excerpt: request.currentSituation,
      evidence_fact_ids: base.observed_facts.filter(f => f.support === "explicit" && f.source_refs.includes("input:current_situation")).map(f => f.fact_id) },
    messagePlan: { original_text: request.optionalMessage, revised_text: request.optionalMessage, meaning_preserved: true,
      edit_notes: ["お礼とまた話したい気持ちを保つ原文を、そのまま使えます。"], supporting_fact_ids: [base.observed_facts[0].fact_id] },
    messageContent: { opening: "文面の意味を保って、自然さを確認します。", edit_reason: "お礼の内容を残し、返信を要求する表現を足していません。", closing: "この表現で伝えたい内容を表せます。" },
    outputSequence: { "PB-02": [{ classification: "normal_allowed", reason_codes: [], response_mode: "none", evidence_refs: [], ambiguity_present: false }],
      "PB-03": [{ schema_version: "pipeline-schema-v3.0.0", acknowledged_eligibility: "ready" }] } });
}

function createPaidFixture(fixture) {
  const requests = [];
  const transport = { requests, async invoke(request) {
    requests.push(structuredClone(request));
    const copy = structuredClone, binding = request.input.report_fact_repair_context;
    let output;
    if (request.stageId === "PB-01") output = { schema_version: "v19-l5-base-intent-v1", base_intake: copy(fixture.base),
      request_intent: copy(fixture.requestIntent) ?? { message_task: "NONE", decision_requested: true, decision_explicitly_excluded: false,
        communication_purpose: "OTHER", evidence_fact_ids: ["F305"], source_excerpt: fixture.request.currentSituation } };
    else if (request.stageId === "PB-01C") output = copy(fixture.candidateAnalysis);
    else if (request.stageId === "PB-02") output = copy(fixture.outputSequence["PB-02"][0]);
    else if (request.stageId === "PB-03") { output = copy(fixture.outputSequence["PB-03"][0]); output.acknowledged_eligibility = copy(request.input.application_eligibility_expectation); }
    else if (request.stageId === "PB-04") output = fixture.answerMode === "message_only"
      ? { schema_version: "v19-l5-plan-v1", answer_mode: "message_only", decision_plan: null, message_plan: copy(fixture.messagePlan) }
      : { schema_version: "v19-l5-plan-v1", answer_mode: "decision_guidance", decision_plan: copy(fixture.plan), message_plan: null };
    else if (request.stageId === "PB-05") output = request.schemaVersion === "report-fact-repair-v1" ? repairPatch(binding,fixture.replacementText)
      : fixture.answerMode === "message_only"
        ? { schema_version: "v19-l5-report-v1", answer_mode: "message_only", report_content: null, message_content: copy(fixture.messageContent) }
        : { schema_version: "v19-l5-report-v1", answer_mode: "decision_guidance", report_content: copy(fixture.report), message_content: null };
    else if (request.stageId === "PB-06") output = validationPass(binding ?? null);
    else throw new Error(`UNEXPECTED_FAKE_STAGE_${request.stageId}`);
    return { responseId: `fake-v19-${requests.length}`, returnedModel: request.model, output,
      usage: { inputTokens: 100, cachedTokens: 0, outputTokens: 20, reasoningTokens: 0 }, latencyMs: 0 };
  } };
  return { request: fixture.request, transport, async prepareAuthority(now = "2026-09-08T00:00:00.000Z") {
    return prepareV19L5PaidCandidate(fixture.request, { catalog: await loadV19L5StageCatalog(), transport, now: () => now, timeZone: "Asia/Tokyo" });
  } };
}
