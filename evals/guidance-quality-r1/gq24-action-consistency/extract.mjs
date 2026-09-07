// Saved synthetic GQ24 evidence only. No runtime execution or version mapping.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync, existsSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const repo = new URL("../../../", import.meta.url);
const stopped = "evals/guidance-quality-v19-l1/runs/2026-09-07-authorized-pilot8-v19-l1/";
const session = stopped + "internal/31a5eebb-5b54-4ca9-a46b-3e2ec4d32295/";
const sourceFiles = {
  pb01: session + "call-025-response.json",
  pb04: session + "call-034-response.json",
  pb05: session + "call-037-response.json",
  pb06Input: session + "call-040-request.json",
  pb06: session + "call-040-response.json",
  review: session + "call-040-review.json",
  execution: session + "session.json",
  entryTrace: stopped + "internal/branch-observations.json",
};
const text = file => readFileSync(new URL(file, repo), "utf8");
const snapshots = Object.fromEntries(Object.entries(sourceFiles).map(([key,file]) => [key,text(file)]));
const source = Object.fromEntries(Object.entries(snapshots).map(([key,value]) => [key,JSON.parse(value)]));
const pb01 = JSON.parse(source.pb01.outputText), plan = JSON.parse(source.pb04.outputText), report = JSON.parse(source.pb05.outputText);
const request = source.pb06Input.input, pb06 = JSON.parse(source.pb06.outputText);
const finding = pb06.semantic_checks.find(f => f.finding_code === "ACTION_CONSISTENCY");
assert.ok(finding); assert.equal(source.execution.caseId, "GQ-24");
assert.deepEqual(source.execution.reassessment, []);
assert.equal(source.execution.finalDeliveryDisposition, "technical_stop");
assert.equal(source.execution.finalOutput, null);
assert.equal(source.pb04.attempt,1); assert.equal(source.pb05.attempt,1); assert.equal(source.pb06.attempt,1);
const trace = source.entryTrace.observations.filter(o => o.caseId === "GQ-24");
assert.equal(trace.length,1); assert.equal(trace[0].inputSufficiency.error,null);
assert.deepEqual(request.decision_plan,plan);
assert.equal(request.report_content.decision_reason_summary,report.decision_reason_summary);
assert.deepEqual(request.report_content.action_rationales,report.action_rationales);
const entry = trace[0].inputSufficiency;
const result = {
  provenance: "EXTRACTED_SAVED_REAL_MODEL_SYNTHETIC_EVIDENCE; no new generation, repair or retry",
  case: "GQ24 stopped session; version mapping omitted",
  sources: Object.fromEntries(Object.entries(sourceFiles).map(([key,file]) => [key,{
    path:file,
    canonicalJsonSha256:createHash("sha256").update(JSON.stringify(source[key])).digest("hex"),
  }])),
  pb01: { communicationPurpose:pb01.base_writing_signals.user_goal_detail },
  inputSufficiency: {
    observedEntryDisposition:source.execution.entryDisposition,
    derivedTraceProvenance:entry.provenance,
    disposition:entry.result.state,
    reasonCodes:entry.result.reasonCodes,
    clarification:entry.result.clarification,
  },
  pb04: {
    currentDecision:plan.selected_decision,
    recommendedActions:plan.actions_to_take,
    avoidActions:plan.actions_to_avoid,
    generatedMessageDraft:plan.recommended_message_draft,
    aftercare:plan.aftercare_plan,
    reassessmentConditions:plan.change_conditions,
    reviewTiming:plan.review_timing,
  },
  pb05: {
    currentAnswer:{coverLine:report.cover_line,shortLetter:report.short_letter,decisionReason:report.decision_reason_summary},
    generatedMessageDraft:{authority:"PB04 recommended_message_draft; PB05 does not own a separate draft",text:plan.recommended_message_draft.text,reportExplanation:report.message_draft_context},
    nextAction:report.action_rationales,
    aftercareCommentaryRaw:report.aftercare_commentary,
    reassessmentCommentaryRaw:report.change_condition_commentary,
    reassessmentCommentaryAtPb06:request.report_content.change_condition_commentary,
    closingLines:report.closing_lines,
  },
  pb06: {
    finding,
    repairRequirement:{providerRepairStrategy:pb06.repair_strategy,providerFinalDisposition:pb06.final_disposition,applicationDirectiveIssued:false,reason:"Evaluation transport stopped before application reassessment callback; no repair was requested or executed."},
    classifierDisposition:source.review.disposition.findingDispositions.map(({disposition,reason})=>({disposition,reason})),
    stopReason:source.review.stopReason,
  },
  reassessmentBeforeAfter: {
    before:{currentDecision:plan.selected_decision,futureDirection:plan.change_conditions[1].resulting_direction,currentAnswer:report.decision_reason_summary},
    directives:[],after:null,
    note:"No reassessment occurred. PB05 Application grounding before PB06 is not a second candidate or repair.",
    customerDelivery:"No final deliverable; only the saved candidate was inspected.",
  },
};
const target = new URL("evidence.json",import.meta.url);
const serialized = JSON.stringify(result,null,2)+"\n";
assert.doesNotMatch(serialized,/current-v17|candidate-v19|actualRuntimeVersion|anonymousVariantId|mapping-SEALED|runtime-stage-catalog|prompt-bundle-runtime|pipeline-schema-runtime/u);
if(existsSync(target)) assert.deepEqual(readFileSync(target,"utf8").replace(/\r\n/gu,"\n"),serialized);
else writeFileSync(target,serialized,{flag:"wx"});
for(const [key,file] of Object.entries(sourceFiles)) assert.equal(text(file),snapshots[key]);
console.log(JSON.stringify({extraction:"PASS",file:fileURLToPath(target),sourceFiles:Object.keys(sourceFiles).length,sourceMutations:0,newApiCalls:0,repairCalls:0,versionMappingDisplayed:false}));
