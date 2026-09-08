// LOCAL FAKE TRANSPORT ONLY. Saved PB01 receipts are immutable structural seeds.
// All new intent, PB01C, PB02, PB03, PB04, PB05 and PB06 values are hand-authored.
// This verifies routing/contracts, not model interpretation, writing quality or Human preference.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { validateV19L5Intent, classifyV19L5Route, buildV19L5EffectiveDecisionPolicy,
  evaluateV19L5Sufficiency } from "../../lib/assessment/runtime/v19-l5-intent-policy.ts";
import { buildV19L1EffectiveDecisionPolicy } from "../../lib/assessment/runtime/v19-l1-acknowledgement-policy.ts";
import { projectBaseProviderInputV1 } from "../../lib/assessment/runtime/base-structured-intake-grounding-v1.ts";
import { groundBaseStructuredIntakeV3 } from "../../lib/assessment/runtime/base-structured-intake-grounding-v3.ts";
import { buildEffectiveAssessmentAuthorityV1 } from "../../lib/assessment/runtime/effective-assessment-authority-v1.ts";
import { groundCandidateAnalysisV2 } from "../../lib/assessment/runtime/candidate-analysis-grounding-v2.ts";
import { buildAvailableCandidateLaneV1, buildAbsentCandidateLaneV1 } from "../../lib/assessment/runtime/split-analysis-envelope-v1.ts";
import { gratitudeCandidateAnalysis, preservedCandidateMetadata, validationPass } from "./repair-fixtures.mjs";

const workspace = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const inputsFile = "evals/guidance-quality-v19-l4/expanded-12/inputs.json";
const casesFile = "evals/guidance-quality-v19-l4/expanded-12/cases.json";
const expectedFile = "evals/guidance-quality-v19-l5/expected-dispositions.json";
const seedRoot = "evals/blind-runs/2026-09-08-expanded-12-01/internal";
const read = file => JSON.parse(readFileSync(path.join(workspace, file), "utf8"));
const hash = file => createHash("sha256").update(readFileSync(path.join(workspace, file))).digest("hex");
const clone = value => structuredClone(value);
const diagnostic = result => JSON.stringify({ finalState: result.finalState, stopFinding: result.stopFinding,
  stages: result.evidence.stages.map(stage => ({ stageId: stage.stageId, error: stage.error })) });
const provenance = "LOCAL CONTRACT TEST ONLY; retained input and historical PB01 seed, hand-authored new intent and fake stage output. No new real-model quality evidence.";
const purposeByCase = { "GQ-01": "APPRECIATION", "GQ-05": "FIRST_INVITATION", "GQ-03": "NATURAL_REPLY", "GQ-15": "APPRECIATION" };
const expectedPolicy = { "GQ-01": "send_now", "GQ-05": "send_now", "GQ-03": "reply_now", "GQ-09": "wait_and_reassess",
  "GQ-07": "send_now", "GQ-11": "pause_additional_contact", "GQ-13": "pause_additional_contact", "GQ-29": "wait_and_reassess",
  "GQ-29-P3": "wait_and_reassess", "GQ-15": "send_now" };

function authoredCandidate(withInvitation = false) {
  const raw = gratitudeCandidateAnalysis();
  raw.candidate_style_profile.register = "polite";
  raw.candidate_communicative_intent.gratitude_strength = "high";
  if (withInvitation) {
    raw.candidate_style_profile.invitation_style = "tentative";
    raw.candidate_communicative_intent.invitation_presence = true;
    raw.candidate_communicative_intent.invitation_specificity = "tentative";
    raw.candidate_communicative_intent.affection_strength = "medium";
  }
  return raw;
}
function candidateEnvelope(raw = null) {
  if (raw === null) return buildAbsentCandidateLaneV1().candidate_envelope;
  const grounded = groundCandidateAnalysisV2(raw);
  return buildAvailableCandidateLaneV1(grounded.candidate_analysis, grounded.candidate_safety_result).candidate_envelope;
}
function authoredIntent(caseId, request, base) {
  const edit = caseId === "GQ-16" || caseId === "GQ-17";
  return { message_task: edit ? "EDIT_EXISTING_MESSAGE" : caseId === "GQ-15" ? "COMPOSE_NEW_MESSAGE" : "NONE",
    decision_requested: !edit && caseId !== "GQ-15", decision_explicitly_excluded: edit,
    communication_purpose: purposeByCase[caseId] ?? "OTHER",
    evidence_fact_ids: base.observed_facts.filter(f => f.support === "explicit" && f.source_refs.includes("input:current_situation")).map(f => f.fact_id),
    source_excerpt: request.currentSituation };
}
function authority(base, candidate) {
  return buildEffectiveAssessmentAuthorityV1({ baseStructuredIntake: base, candidateEnvelope: candidate, clarificationGrounding: null });
}
function sufficiency(base, candidate, intent, safety = "normal_allowed", alreadyUsed = false) {
  return evaluateV19L5Sufficiency({ intent, candidateEnvelope: candidate, originalMessageClarificationAlreadyUsed: alreadyUsed,
    basePolicyInput: { aggregateSafety: { classification: safety }, baseStructuredIntake: base,
      decisionFacts: base.decision_facts, baseWritingSignals: base.base_writing_signals },
    clarificationGrounding: null, effectiveAssessmentAuthority: authority(base, candidate) });
}
function policy(base, candidate, intent) {
  return buildV19L5EffectiveDecisionPolicy({ authority: authority(base, candidate), candidateEnvelope: candidate, intent });
}

function loadSeeds(protectedHashes) {
  const inputs = read(inputsFile).cases;
  const sessions = readdirSync(path.join(workspace, seedRoot)).sort().map(id => {
    const sessionFile = `${seedRoot}/${id}/session.json`;
    try { return { id, sessionFile, session: read(sessionFile) }; } catch { return null; }
  }).filter(Boolean);
  return inputs.flatMap(({ id: caseId, input: request }) => {
    const matches = sessions.filter(item => item.session.caseId === caseId);
    assert.equal(matches.length, 2, `${caseId}: exactly two existing structural seeds`);
    return matches.map(({ id, sessionFile }) => {
      const dir = `${seedRoot}/${id}`;
      const receiptFile = readdirSync(path.join(workspace, dir)).filter(n => /^call-\d+-response\.json$/u.test(n)).sort()
        .map(name => `${dir}/${name}`).find(file => read(file).stageId === "PB-01");
      assert.ok(receiptFile);
      protectedHashes.set(sessionFile, hash(sessionFile)); protectedHashes.set(receiptFile, hash(receiptFile));
      const receipt = read(receiptFile);
      assert.equal(receipt.status, "completed");
      return { caseId, seedId: id, request: clone(request), rawBase: JSON.parse(receipt.outputText) };
    });
  });
}

function positivePureCases(seeds, check) {
  const frozen = read(expectedFile).cases;
  return seeds.map(seed => {
    const { caseId, request } = seed;
    const base = groundBaseStructuredIntakeV3(projectBaseProviderInputV1(request), seed.rawBase);
    const inputSnapshot = JSON.stringify({ request, base });
    const candidate = candidateEnvelope(request.optionalMessage ? authoredCandidate(caseId === "GQ-16") : null);
    const intent = validateV19L5Intent({ intent: authoredIntent(caseId, request, base), baseStructuredIntake: base, currentSituation: request.currentSituation });
    const route = classifyV19L5Route({ intent, candidateEnvelope: candidate });
    check(route, caseId === "GQ-17" ? "original_message_clarification" : caseId === "GQ-16" ? "message_only" : "decision_guidance", `${caseId} route`);
    const suff = sufficiency(base, candidate, intent);
    check(suff.state, caseId === "GQ-17" ? "needs_one_clarifying_answer" : "full_paid_ready_candidate", `${caseId} sufficiency`);
    const disposition = frozen.find(item => item.caseId === caseId).expectedDisposition;
    check(disposition, caseId === "GQ-17" ? "CLARIFICATION_EXPECTED" : "ANSWER_EXPECTED", `${caseId} frozen target`);
    const decision = route === "decision_guidance" ? policy(base, candidate, intent).policy.allowed_decisions[0] : null;
    if (caseId === "GQ-11") {
      // One old seed has count=3 but repeated=false/unknown boundary. Preserve its
      // original no-followup direction, without calling the old extraction correct.
      check(["pause_additional_contact", "wait_and_reassess"].includes(decision), true, "GQ11 hold contact");
      check(decision, buildV19L1EffectiveDecisionPolicy({ authority: authority(base, candidate), candidateEnvelope: candidate }).policy.allowed_decisions[0], "GQ11 no new uplift");
    } else if (decision) check(decision, expectedPolicy[caseId], `${caseId} primary action`);
    if (caseId === "GQ-17") { check(suff.clarification.target, "original_message", "one original target"); check(suff.clarification.question, "整えたい文章をそのまま教えてください", "one original question"); }
    check(JSON.stringify({ request, base }), inputSnapshot, `${caseId} input/Base unchanged`);
    return { caseId, seedId: seed.seedId, route, sufficiency: suff.state, primaryDecision: decision };
  });
}

function negativePureCases(seed, check, rejects) {
  const base = groundBaseStructuredIntakeV3(projectBaseProviderInputV1(seed.request), seed.rawBase);
  const candidate = candidateEnvelope();
  const intent = authoredIntent("GQ-15", seed.request, base);
  const validate = (value, b = base) => validateV19L5Intent({ intent: value, baseStructuredIntake: b, currentSituation: seed.request.currentSituation });
  for (const patch of [{ source_excerpt: "入力にない別の文" }, { evidence_fact_ids: ["F999"] },
    { evidence_fact_ids: [intent.evidence_fact_ids[0], intent.evidence_fact_ids[0]] },
    { decision_requested: true, decision_explicitly_excluded: true }, { extra: "not allowed" }]) rejects(() => validate({ ...intent, ...patch }), "intent integrity rejects");
  const wrongSource = clone(base); wrongSource.observed_facts.forEach(f => { f.source_refs = ["input:relationship"]; });
  rejects(() => validate(intent, wrongSource), "relationship source cannot authorize request intent");
  const inferred = clone(base); inferred.observed_facts.forEach(f => { f.support = "context_inference"; });
  rejects(() => validate(intent, inferred), "inference cannot authorize request intent");
  check(buildV19L1EffectiveDecisionPolicy({ authority: authority(base, candidate), candidateEnvelope: candidate }).policy.allowed_decisions[0], "wait_and_reassess", "old predecessor remains unchanged");
  const edit = { ...intent, message_task: "EDIT_EXISTING_MESSAGE", decision_explicitly_excluded: true };
  const present = candidateEnvelope(authoredCandidate());
  check(classifyV19L5Route({ intent: edit, candidateEnvelope: candidate }), "original_message_clarification", "edit without original");
  check(classifyV19L5Route({ intent: edit, candidateEnvelope: present }), "message_only", "edit without decision");
  check(classifyV19L5Route({ intent: { ...edit, decision_requested: true, decision_explicitly_excluded: false }, candidateEnvelope: present }), "decision_guidance", "mixed edit and decision");
  check(classifyV19L5Route({ intent: { ...intent, decision_explicitly_excluded: true }, candidateEnvelope: candidate }), "message_only", "compose excluding decision");
  check(sufficiency(base, candidate, edit, "normal_allowed", true).state, "not_full_product_candidate", "one-question budget exhausted");
  check(sufficiency(base, candidate, edit, "rejected").state, "safety_blocked", "Safety before missing original");
  check(sufficiency(base, { presence: true, analysis_status: "unavailable", safety_status: "available", analysis: null }, edit).state,
    "not_full_product_candidate", "unavailable analysis cannot become completed edit");
  const patches = [
    ["pending", b => { b.decision_facts.contact_state.unanswered_user_message_count = 1; b.decision_facts.latest_direct_message.sender = "user"; }, "wait_and_reassess"],
    ["user-sent with unknown count", b => { b.decision_facts.contact_state.unanswered_user_message_count = null; b.decision_facts.latest_direct_message.sender = "user"; }, "wait_and_reassess"],
    ["repeated", b => { b.decision_facts.boundary_state.repeated_unanswered_contact = true; }, "pause_additional_contact"],
    ["explicit boundary", b => { b.decision_facts.boundary_state = { kind: "temporary_distance", status: "explicit", repeated_unanswered_contact: false }; }, "pause_additional_contact"],
    ["unknown boundary", b => { b.decision_facts.boundary_state = { kind: "unknown", status: "unknown", repeated_unanswered_contact: false }; }, "wait_and_reassess"],
    ["purpose unknown", () => {}, "wait_and_reassess"],
  ];
  for (const [label, change, expected] of patches) {
    const changed = clone(base); change(changed); const before = JSON.stringify(changed);
    const currentIntent = label === "purpose unknown" ? { ...intent, communication_purpose: "OTHER" } : intent;
    check(policy(changed, candidate, currentIntent).policy.allowed_decisions[0], expected, label);
    check(JSON.stringify(changed), before, `${label}: no fact mutation`);
  }
}

function sendPlan(base, draft, hasCandidate) {
  const factIds = [base.observed_facts[0].fact_id];
  const metadata = preservedCandidateMetadata();
  if (!hasCandidate) { metadata.source_status = "generated_without_candidate"; metadata.preserved_meaning = false; }
  return { schema_version: "pipeline-schema-v2.0.0", selected_decision: "send_now", decision_reason_fact_ids: factIds,
    possible_interpretations: [], pre_action_check: { check: "伝えたいお礼だけが入っているか、一度読み返す。", supporting_fact_ids: factIds },
    actions_to_take: ["今、お礼を一通送る。"], actions_to_avoid: ["返事を求めてメッセージを重ねない。"],
    recommended_message_draft: { text: draft, policy: "required_now", use_timing: "now" }, message_draft_edit_metadata: metadata,
    aftercare_plan: [{ phase: "tonight", action: "お礼を一通送った後は、自分の予定へ戻る。", avoid: "送信後に返信を求めて追加しない。", supporting_fact_ids: factIds },
      { phase: "next", action: "相手から連絡が来たら、その内容を確認する。", avoid: null, supporting_fact_ids: factIds },
      { phase: "reassessment_condition", action: "相手から質問が来たときは、聞かれた内容に返す。", avoid: null, supporting_fact_ids: factIds }],
    change_conditions: [{ condition: "相手から質問を含む返信が来たとき", resulting_direction: "reply_now", supporting_fact_ids: factIds }],
    review_timing: { when: "相手から具体的な返信が来たとき", trigger_fact_ids: factIds }, material_unknowns: [], model_generated_limitations: [] };
}
function sendReport(base) {
  return { schema_version: "pipeline-schema-v2.0.0", cover_line: "伝えたいお礼を、一言に。", short_letter: ["会った時間のお礼として、伝えたい内容を短い文にできます。"],
    decision_reason_summary: "楽しかったことを伝えたいという目的があるので、お礼を一通送る方向が自然です。",
    relationship_summary: null, observed_fact_commentary: [{ fact_id: base.observed_facts[0].fact_id, commentary: "相談には、楽しかったと伝えたい希望が書かれています。" }],
    possible_interpretations: [], anxiety_reframe: [], message_temperature: null,
    action_rationales: ["返事を求める内容を足さず、お礼そのものを伝えるための提案です。"],
    message_draft_context: "お礼と楽しかったことを短く伝える文案です。好意の確認や新たな約束は含めません。",
    aftercare_commentary: ["送った後は予定や休息へ戻る時間にしてかまいません。", "返信があった場合は、書かれた内容を材料にできます。", "質問が来た場合には、その質問への応答として考え直します。"],
    change_condition_commentary: ["相手から質問を含む返信が来た場合だけ、その内容を受けて返します。"],
    closing_lines: ["相手の反応を決めつけず、自分が伝えたいお礼を大切にしてよい場面です。"] };
}

async function fullApplicationCases(seeds, check, rejectsAsync) {
  const { V19L5LocalApplication } = await import("../../lib/assessment/runtime/v19-l5-application.ts");
  const { loadV19L5StageCatalog } = await import("../../lib/assessment/runtime/v19-l5-stage-catalog.ts");
  const catalog = await loadV19L5StageCatalog();
  const usage = { inputTokens: 0, cachedTokens: 0, outputTokens: 0, reasoningTokens: 0 };
  const outputs = [];
  async function run(label, seed, { mode = "message_only", intentOverride = {}, planPatch = {}, mutateBase = null, semanticFindings = [] } = {}) {
    const request = clone(seed.request), raw = clone(seed.rawBase);
    if (mutateBase) mutateBase(request, raw);
    const intent = { ...authoredIntent(seed.caseId, request, raw), ...intentOverride, source_excerpt: request.currentSituation };
    const captured = [];
    const fake = { async invoke(q) {
      captured.push(clone(q));
      let output;
      if (q.stageId === "PB-01") {
        check(q.input.base_provider_input.current_situation, request.currentSituation, `${label}: exact Base input`);
        check(Object.hasOwn(q.input, "optional_message"), false, `${label}: Candidate absent from Base request`);
        output = { schema_version: "v19-l5-base-intent-v1", base_intake: raw, request_intent: intent };
      } else if (q.stageId === "PB-01C") output = authoredCandidate(seed.caseId === "GQ-16");
      else if (q.stageId === "PB-02") output = { classification: "normal_allowed", reason_codes: [], response_mode: "none", evidence_refs: [], ambiguity_present: false };
      else if (q.stageId === "PB-03") output = { schema_version: "pipeline-schema-v3.0.0", acknowledged_eligibility: "ready" };
      else if (q.stageId === "PB-04") {
        check(q.input.answer_mode, mode, `${label}: PB04 mode`);
        const original = q.input.user_supplied_optional_message ?? "";
        const plan = { original_text: original, revised_text: original || "今日はありがとうございました。楽しかったです。", meaning_preserved: original !== "",
          edit_notes: [original ? "お礼とまた話したい気持ちを保つ原文を、そのまま使えます。" : "相談に書かれた内容から、新しく作った文案です。"],
          supporting_fact_ids: [q.input.base_structured_intake.observed_facts[0].fact_id], ...planPatch };
        output = { schema_version: "v19-l5-plan-v1", answer_mode: mode,
          decision_plan: mode === "decision_guidance" ? sendPlan(q.input.base_structured_intake, original || "今日はありがとうございました。楽しかったです。", original !== "") : null,
          message_plan: mode === "message_only" ? plan : null };
      } else if (q.stageId === "PB-05") output = { schema_version: "v19-l5-report-v1", answer_mode: mode,
        report_content: mode === "decision_guidance" ? sendReport(q.input.base_structured_intake) : null,
        message_content: mode === "message_only" ? { opening: "文面の意味を保って、自然さを確認します。", edit_reason: "お礼の内容を残し、返信を要求する表現を足していません。", closing: "この表現で伝えたい内容を表せます。" } : null };
      else if (q.stageId === "PB-06") output = { ...validationPass(), semantic_checks: clone(semanticFindings) };
      else throw new Error(`unexpected fake stage: ${q.stageId}`);
      return { responseId: `fake-${label}-${captured.length}`, returnedModel: q.model, output: clone(output), usage: clone(usage), latencyMs: 0 };
    } };
    const app = new V19L5LocalApplication({ catalog, transport: fake, now: () => "2026-09-08T12:00:00.000Z", timeZone: "Asia/Tokyo" });
    const result = await app.submit(request);
    outputs.push({ label, finalState: result.finalState, stopFinding: result.stopFinding });
    return { app, result, captured, request };
  }
  const seed16 = seeds.find(s => s.caseId === "GQ-16"), seed17 = seeds.find(s => s.caseId === "GQ-17"), seed15 = seeds.find(s => s.caseId === "GQ-15");
  const edit = await run("GQ16-edit", seed16);
  check(edit.result.finalState, "completed", diagnostic(edit.result));
  check(edit.result.answerMode, "message_only", "GQ16 no fabricated decision");
  check(edit.result.messageResult.plan.original_text, seed16.request.optionalMessage, "GQ16 exact original");
  check(edit.captured.map(q => q.stageId), ["PB-01", "PB-01C", "PB-02", "PB-03", "PB-04", "PB-05", "PB-06"], "existing seven stages");
  const missing = await run("GQ17-one-question", seed17);
  check(missing.result.finalState, "clarification", diagnostic(missing.result));
  check(missing.result.clarification, { target: "original_message", question: "整えたい文章をそのまま教えてください" }, "GQ17 Product question");
  check(missing.captured.map(q => q.stageId), ["PB-01", "PB-02", "PB-03"], "no invented Plan or draft before original");
  const resumed = await missing.app.provideOriginalMessage(seed16.request.optionalMessage);
  outputs.push({ label: "GQ17-original-resume", finalState: resumed.finalState, stopFinding: resumed.stopFinding });
  check(resumed.finalState, "completed", diagnostic(resumed));
  check(resumed.evidence.originalProvenance.source, "original_message_clarification", "resume provenance");
  check(resumed.evidence.inputSufficiency.clarificationBudget,
    { maximumQuestionsTotal: 1, questionsAlreadyUsed: 1, questionsRemaining: 0 }, "resume records the consumed one-question budget");
  check(resumed.evidence.baseIntake, missing.result.evidence.baseIntake, "resume retains exact Base authority");
  check(missing.captured.filter(q => q.stageId === "PB-01").length, 1, "resume never reinterprets initial PB01");
  check(missing.captured.filter(q => q.stageId === "PB-01C").at(-1).input.optional_message, seed16.request.optionalMessage, "resume Candidate exact original");
  await rejectsAsync(() => missing.app.provideOriginalMessage("二回目の原文"), "no second original answer");
  const compose = await run("GQ15-compose", seed15, { mode: "decision_guidance" });
  check(compose.result.finalState, "completed", diagnostic(compose.result));
  check(compose.result.decisionResult.decision, "send_now", "GQ15 natural thanks");
  check(compose.result.evidence.baseIntake.user_emotions, [], "unspecified timing does not create emotion");
  const excluded = await run("compose-excluding-decision", seed15, { intentOverride: { decision_explicitly_excluded: true },
    mutateBase: (request, base) => { request.currentSituation += " 送るかどうかの判断は求めていません。";
      base.observed_facts.push({ fact_id: "F980", statement: "送るかどうかの判断は求めていない。", support: "explicit", source_refs: ["input:current_situation"] }); } });
  check(excluded.result.finalState, "completed", diagnostic(excluded.result));
  check(excluded.result.messageResult.plan.original_text, "", "new composition has no original");
  check(excluded.result.messageResult.plan.meaning_preserved, false, "new composition does not falsely claim original preservation");
  const mixed = await run("mixed-edit-decision", seed15, { mode: "decision_guidance", intentOverride: { message_task: "EDIT_EXISTING_MESSAGE", decision_requested: true },
    mutateBase: (request, base) => { request.currentSituation += " 「今日はありがとうございました。楽しかったです。」を自然に整えて、送ってよいかも教えてください。";
      request.optionalMessage = "今日はありがとうございました。楽しかったです。"; request.requestedTopics = ["draft_message", "decide_send_or_wait"];
      base.decision_facts.selected_requests = clone(request.requestedTopics);
      base.observed_facts.push({ fact_id: "F981", statement: "原文を自然に整えて、送ってよいかも知りたい。", support: "explicit", source_refs: ["input:current_situation"] }); } });
  check(mixed.result.finalState, "completed", diagnostic(mixed.result));
  check(mixed.result.decisionResult.decision, "send_now", "mixed decision retained");
  check(mixed.result.decisionResult.report.decisionPlan.recommended_message_draft.text, mixed.request.optionalMessage, "mixed draft preserved");
  for (const [label, patch] of [["meaning-false", { meaning_preserved: false }], ["source-mismatch", { original_text: "偽の原文" }]]) {
    const rejected = await run(label, seed16, { planPatch: patch });
    check(rejected.result.finalState, "stopped", `${label}: fail closed`);
    check(rejected.result.stopFinding, "V19_L5_EDIT_SOURCE_INVALID", `${label}: exact cause`);
    check(rejected.captured.some(q => q.stageId === "PB-05"), false, `${label}: no report fallback`);
  }
  const minorExplanation = { finding_code: "BRAND_TONE", severity: "minor", json_path: "message_content.edit_reason",
    evidence_refs: [], detail: "AUTHORED OFFLINE FIXTURE: the explanation could sound warmer; its meaning and facts remain intact." };
  for (const [label, finding, expectedState] of [
    ["minor-explanation-retained", minorExplanation, "completed"],
    ["major-same-editorial-code", { ...minorExplanation, severity: "major",
      detail: "AUTHORED OFFLINE FIXTURE: this is a material finding, not an allowed minor editorial observation." }, "stopped"],
    ["minor-safety-not-waived", { ...minorExplanation, finding_code: "SAFETY_REGRESSION",
      detail: "AUTHORED OFFLINE FIXTURE: a Safety finding is not an editorial exception even when labelled minor." }, "stopped"],
    ["minor-draft-path-not-waived", { ...minorExplanation, json_path: "message_plan.revised_text",
      detail: "AUTHORED OFFLINE FIXTURE: a finding in the draft is outside the explanation-only exception." }, "stopped"],
  ]) {
    const observed = await run(label, seed16, { semanticFindings: [finding] });
    check(observed.result.finalState, expectedState, `${label}: ${diagnostic(observed.result)}`);
    check(observed.result.stopFinding, expectedState === "stopped" ? "V19_L5_MESSAGE_VALIDATION_FAILED" : null, `${label}: exact disposition reason`);
    check(observed.result.evidence.findings, [finding], `${label}: finding retained as evidence`);
    check(observed.result.evidence.repair.executed, false, `${label}: no repair scope expansion`);
    check(observed.captured.filter(q => q.stageId === "PB-05").length, 1, `${label}: no report retry`);
    check(observed.captured.filter(q => q.stageId === "PB-06").length, 1, `${label}: no verification retry`);
    if (expectedState === "stopped") check(observed.result.messageResult, null, `${label}: no final delivery`);
  }
  return outputs;
}

export async function verifyV19L5Intent({ pureOnly = false } = {}) {
  const protectedHashes = new Map([inputsFile, casesFile, expectedFile].map(file => [file, hash(file)]));
  const inputs = read(inputsFile).cases, expectations = read(expectedFile);
  assert.equal(inputs.length, 12); assert.equal(expectations.cases.length, 12);
  for (const expected of expectations.cases) assert.deepEqual(expected.input, inputs.find(item => item.id === expected.caseId).input);
  const seeds = loadSeeds(protectedHashes);
  let assertionsPassed = 0;
  const check = (actual, expected, label) => { assert.deepEqual(actual, expected, label); assertionsPassed++; };
  const rejects = (fn, label) => { assert.throws(fn, undefined, label); assertionsPassed++; };
  const rejectsAsync = async (fn, label) => { await assert.rejects(fn, undefined, label); assertionsPassed++; };
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => { throw new Error("REAL NETWORK IS FORBIDDEN IN V19-L5 LOCAL VERIFIER"); };
  try {
    const pure = positivePureCases(seeds, check);
    negativePureCases(seeds.find(seed => seed.caseId === "GQ-15"), check, rejects);
    const application = pureOnly ? [] : await fullApplicationCases(seeds, check, rejectsAsync);
    for (const [file, expected] of protectedHashes) check(hash(file), expected, `immutable evidence: ${file}`);
    return { status: "PASS", provenance, apiCalls: 0, productionOperations: 0, assertionsPassed,
      preservedCaseCount: 12, historicalBaseSeeds: seeds.length, authoredIntent: true, pure, application,
      applicationCovered: !pureOnly, realModelQualityVerified: false, humanPreferenceVerified: false };
  } finally { globalThis.fetch = originalFetch; }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  console.log(JSON.stringify(await verifyV19L5Intent({ pureOnly: process.argv.includes("--pure") }), null, 2));
}
