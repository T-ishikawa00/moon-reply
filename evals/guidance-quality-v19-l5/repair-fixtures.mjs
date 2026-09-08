// OFFLINE TEST FIXTURES ONLY. Historical receipts are read-only test data.
// Nothing in this module is a generation input, provider, or execution entrypoint.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

export const REPAIR_FIXTURE_PROVENANCE = "OFFLINE CONTRACT TEST ONLY: historical synthetic-consultation receipts are read-only structural seeds. Candidate envelope adaptations, new defects, patches and all PB06 verdicts are hand-authored. No model detection, model repair quality, Human acceptance or new provider execution is established.";
export const REPAIR_CHECKS = ["fact_source_integrity", "input_fidelity", "meaning_preservation", "direction_consistency", "action_consistency", "safety"];
const seedDirectory = "evals/blind-runs/2026-09-08-fresh-01/internal/f904555b-eaf7-46d0-9382-aa1b3146c6e3";
const inputsFile = "evals/guidance-quality-wave1/pilot-inputs.json";
const read = file => JSON.parse(readFileSync(file, "utf8"));
export const hashFile = file => createHash("sha256").update(readFileSync(file)).digest("hex");

export function loadRepairSeed() {
  const session = read(path.join(seedDirectory, "session.json"));
  assert.equal(session.caseId, "GQ-29-P3");
  assert.equal(session.actualRuntimeVersion, "runtime-stage-catalog-v21.0.0");
  assert.equal(session.finalOutput, null, "the original stopped session stays stopped");
  const files = readdirSync(seedDirectory).filter(name => /^call-\d+-response\.json$/u.test(name)).sort();
  const outputSequence = {};
  for (const name of files) {
    const receipt = read(path.join(seedDirectory, name));
    assert.equal(receipt.status, "completed");
    assert.equal(receipt.returnedModel, "gpt-5.6-luna");
    outputSequence[receipt.stageId] ??= [];
    assert.equal(receipt.attempt, outputSequence[receipt.stageId].length + 1);
    outputSequence[receipt.stageId].push(JSON.parse(receipt.outputText));
  }
  assert.equal(outputSequence["PB-06"], undefined, "no historical PB06 receipt exists for this stop");
  const original = read(inputsFile).cases.find(item => item.id === "GQ-29-P3");
  assert.ok(original);
  const protectedFiles = [inputsFile, ...readdirSync(seedDirectory).map(name => path.join(seedDirectory, name))];
  return {
    caseId: "AUTHORED-L5-REPAIR-GQ29-P3", request: structuredClone(original.input),
    base: structuredClone(outputSequence["PB-01"][0]),
    plan: structuredClone(outputSequence["PB-04"][0]),
    report: structuredClone(outputSequence["PB-05"][0]),
    outputSequence, protectedHashes: Object.fromEntries(protectedFiles.map(file => [file, hashFile(file)])),
    provenance: REPAIR_FIXTURE_PROVENANCE,
  };
}

export function preservedCandidateMetadata() {
  return {
    source_status: "candidate_preserved", preserved_meaning: true, style_delta: [],
    communicative_intent_delta: {
      gratitude_change: "unchanged", apology_change: "unchanged", question_count_delta: 0,
      invitation_presence_delta: "unchanged_absent", invitation_specificity_delta: "unchanged",
      affection_strength_delta: "unchanged", commitment_strength_delta: "unchanged",
      response_pressure_delta: "unchanged", boundary_strength_delta: "unchanged",
      closure_intent_delta: "unchanged_absent", practical_requirement_fulfillment: "not_applicable",
    },
    change_reasons: ["no_change_needed"], change_summary: null,
  };
}

export function gratitudeCandidateAnalysis() {
  return {
    candidate_style_profile: { register: "casual", sentence_length: "short", sentence_ending: "neutral",
      punctuation: "standard", emoji_usage: "none", exclamation_usage: "none", softness: "medium",
      directness: "direct", invitation_style: "none", reply_pressure: "low" },
    candidate_communicative_intent: { gratitude_strength: "medium", apology_strength: "none", question_count: 0,
      invitation_presence: false, invitation_specificity: "none", affection_strength: "none", commitment_strength: "none",
      response_pressure: "none", boundary_strength: "none", conversation_closure: "none", practical_requirement: ["none"] },
    candidate_language_expression: { primary_language: "ja", mixed_languages: [], dialect_or_regional_expression: "absent",
      intentional_nonstandard_expression: "absent", possible_typo: "absent" },
    candidate_safety_signals: { untrusted_embedded_instruction_detected: false, signal_codes: [] },
  };
}

export function createRepairFixture({ target = "short_letter", withCandidate = false, clean = false } = {}) {
  assert.ok(["short_letter", "observed_fact_commentary"].includes(target));
  const fixture = loadRepairSeed();
  if (target === "observed_fact_commentary") {
    fixture.report.short_letter[1] = fixture.report.short_letter[1].replace("質問は一度届いており", "質問は一度送っていて");
    fixture.report.observed_fact_commentary[0].commentary = "質問は一度届いており、同じ目的の追加連絡を今すぐ重ねる理由はありません。";
  }
  fixture.targetPath = target === "short_letter" ? "report_content.short_letter[1]" : "report_content.observed_fact_commentary[0].commentary";
  fixture.evidenceFactIds = [fixture.base.observed_facts[0].fact_id];
  fixture.originalText = target === "short_letter" ? fixture.report.short_letter[1] : fixture.report.observed_fact_commentary[0].commentary;
  fixture.replacementText = fixture.originalText.replace("質問は一度届いており", "質問は一度送っていて");
  assert.notEqual(fixture.replacementText, fixture.originalText);
  if (clean) {
    if (target === "short_letter") fixture.report.short_letter[1] = fixture.replacementText;
    else fixture.report.observed_fact_commentary[0].commentary = fixture.replacementText;
  }
  if (withCandidate) {
    // A new hand-authored derivative, never described as the original GQ29-P3 output.
    // Preserve the currently correct no-followup direction and full three-day Plan.
    fixture.caseId += "-WITH-CANDIDATE";
    fixture.request.currentSituation += " 相手から返事が来た場合だけ返す候補も、今は送らず後で使える文として残したいです。";
    fixture.request.optionalMessage = "教えてくれてありがとう。";
    fixture.request.requestedTopics.push("draft_message");
    fixture.base.decision_facts.selected_requests.push("draft_message");
    fixture.plan.recommended_message_draft = { text: fixture.request.optionalMessage, policy: "later_only", use_timing: "later" };
    fixture.plan.message_draft_edit_metadata = preservedCandidateMetadata();
    fixture.report.message_draft_context = "候補は元の意味を変えず残します。今は送らず、相手から新しい返信が来た後、その内容に合う場合だけ使うための文です。";
    fixture.candidateAnalysis = gratitudeCandidateAnalysis();
  }
  fixture.clean = clean;
  return fixture;
}

export function repairFinding(fixture, overrides = {}) {
  return {
    finding_code: "FACT_FIDELITY", severity: "major", json_path: fixture.targetPath,
    evidence_refs: [...fixture.evidenceFactIds],
    detail: "AUTHORED OFFLINE FINDING: the source confirms sent and no reply; this single Report leaf incorrectly confirms delivery.",
    ...overrides,
  };
}

export function createMessageOnlyConstraintFixture(kind) {
  assert.ok(["no_followup_message", "unknown"].includes(kind));
  const fixture = createRepairFixture({ clean: true, withCandidate: true });
  const noFollowup = kind === "no_followup_message";
  const constraint = noFollowup ? "今後3日間は追加連絡をしません。" : "追加連絡してよいかの制約は分かっていません。";
  fixture.caseId = `AUTHORED-L5-MESSAGE-CONSTRAINT-${kind}`;
  fixture.request.currentSituation = `こちらから「週末は何をしているの？」と送って、まだ返事がありません。${constraint}候補文の文面添削だけをお願いします。送るか待つかの判断は求めていません。`;
  fixture.request.requestedTopics = ["draft_message"];
  fixture.base.user_goal = "prepare_message";
  fixture.base.decision_facts.selected_requests = ["draft_message"];
  fixture.base.observed_facts[2].statement = "ユーザーは候補文の添削だけを求め、送信判断を求めていない。";
  fixture.base.observed_facts[3].statement = noFollowup
    ? "ユーザーは今後3日間は追加連絡をしないと明示した。"
    : "ユーザーは追加連絡してよいかの制約が分からないと述べている。";
  fixture.base.timeline[2].statement = fixture.base.observed_facts[2].statement;
  fixture.base.timeline[3].statement = fixture.base.observed_facts[3].statement;
  fixture.base.context[2].statement = fixture.base.observed_facts[3].statement;
  fixture.base.decision_facts.user_contact_constraint = {
    kind, status: noFollowup ? "explicit" : "unknown", supporting_fact_ids: noFollowup ? ["F405"] : [],
  };
  fixture.base.base_writing_signals.explicit_user_constraints = noFollowup
    ? [{ kind, bounded_summary: "今後3日間は追加連絡をしない。" }] : [];
  fixture.requestIntent = { message_task: "EDIT_EXISTING_MESSAGE", decision_requested: false,
    decision_explicitly_excluded: true, communication_purpose: "OTHER", evidence_fact_ids: ["F305"],
    source_excerpt: "候補文の文面添削だけをお願いします。送るか待つかの判断は求めていません。" };
  fixture.answerMode = "message_only";
  fixture.messagePlan = { original_text: fixture.request.optionalMessage, revised_text: fixture.request.optionalMessage,
    meaning_preserved: true, edit_notes: ["元の感謝の意味をそのまま残しました。"], supporting_fact_ids: ["F305"] };
  fixture.messageContent = { opening: "感謝を自然に表す文ですね。", edit_reason: "意味を変えず、元の短い表現を残しています。",
    closing: "伝えたい意味をそのまま整理できています。" };
  return fixture;
}

export function validationPass(context = null) {
  return {
    schema_version: "validation-result-v19-l4-v1", validation_mode: "semantic_findings_only",
    deterministic_checks: [], semantic_checks: [], final_disposition: null, repair_strategy: null, failed_codes: [],
    report_fact_repair_verification: context === null ? null : {
      report_hash: context.report_hash, target_path: context.target_path, verified_text: context.verified_text,
      evidence_fact_ids: structuredClone(context.evidence_fact_ids),
      checks: Object.fromEntries(REPAIR_CHECKS.map(key => [key, "pass"])),
    },
  };
}

export function repairPatch(context, replacementText) {
  return { schema_version: "report-fact-repair-v1", source_report_hash: context.source_report_hash,
    target_path: context.target_path, original_text: context.original_text, replacement_text: replacementText };
}

export function assertSeedUnchanged(fixture) {
  for (const [file, expected] of Object.entries(fixture.protectedHashes)) assert.equal(hashFile(file), expected, file);
}
