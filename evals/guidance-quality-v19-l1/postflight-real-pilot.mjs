// Read-only reconciliation plus a separate derived branch trace. No live client,
// credentials, retries or new samples. Does not print the sealed version map.
import assert from "node:assert/strict";
import { readFileSync, readdirSync, existsSync, writeFileSync } from "node:fs";
import path from "node:path";
import { RUN_NAME, CANDIDATE_HEAD } from "./real-pilot.mjs";
import { ReservationLedger, accountUsage, hash } from "../guidance-quality-wave1/real-pilot/budget.mjs";
import { groundBaseStructuredIntakeV3 } from "../../lib/assessment/runtime/base-structured-intake-grounding-v3.ts";
import { projectBaseProviderInputV1 } from "../../lib/assessment/runtime/base-structured-intake-grounding-v1.ts";
import { buildAbsentCandidateLaneV1 } from "../../lib/assessment/runtime/split-analysis-envelope-v1.ts";
import { buildEffectiveAssessmentAuthorityV1 } from "../../lib/assessment/runtime/effective-assessment-authority-v1.ts";
import { evaluateJpy980InputSufficiencyV4 } from "../../lib/assessment/runtime/jpy980-input-sufficiency-policy-v4.ts";
import { evaluateV19L1InputSufficiency } from "../../lib/assessment/runtime/v19-l1-acknowledgement-policy.ts";

const run = path.resolve("evals/guidance-quality-v19-l1/runs", RUN_NAME), internal = path.join(run,"internal");
const read = file => JSON.parse(readFileSync(file,"utf8"));
const manifest = read(path.join(internal,"manifest.json")), summary = read(path.join(run,"technical-summary.json"));
const inputs = read("evals/guidance-quality-wave1/pilot-inputs.json"), ledger = new ReservationLedger(path.join(internal,"reservations.jsonl"),manifest);
assert.equal(manifest.authorizedBaseline,CANDIDATE_HEAD); assert.equal(manifest.executionHead,CANDIDATE_HEAD);
assert.equal(manifest.inputHash,hash(inputs)); assert.equal(manifest.model,"gpt-5.6-luna");
assert.equal(manifest.budgetNanos,2e9); assert.equal(manifest.maxHttpAttempts,72); assert.equal(manifest.sessions.length,8);
for (const [file, expected] of Object.entries(manifest.evaluationSourceHashes)) assert.equal(hash(readFileSync(file,"utf8").replace(/\r\n/gu,"\n")),expected,"Evaluation source changed after freeze");
for (const [key,value] of Object.entries(ledger.summary())) assert.deepEqual(summary[key],value);
assert.ok(summary.reservedUsd<=2); assert.ok(summary.actualHttpCalls<=72); assert.ok(summary.sessionsStarted<=8);
const mapping=read(path.join(internal,"mapping-SEALED-until-human-review.json"));
const records=[];
for(const c of inputs.cases){
  const pair=manifest.sessions.filter(s=>s.caseId===c.id);
  assert.deepEqual(pair.map(s=>s.arm).sort(),["candidate-v19","current-v17"]);
  assert.deepEqual(pair.map(s=>s.anonymousVariantId).sort(),["A","B"]);
  for(const s of pair){
    assert.equal(mapping.mapping[c.id][s.anonymousVariantId],s.arm);
    const file=path.join(internal,s.sessionId,"session.json");
    if(existsSync(file)){const record=read(file); assert.equal(record.actualRuntimeVersion,manifest.catalogs[s.arm].catalogVersion);records.push({session:s,record,input:c.input});}
  }
}
let inspected=0;
for(const call of ledger.calls){
  assert.ok(call.attempt<=2);const prefix=path.join(internal,call.sessionId,`call-${String(call.sequence).padStart(3,"0")}`);
  const request=read(prefix+"-request.json");assert.equal(request.requestHash,call.requestHash);assert.equal(request.inputCeiling,call.inputCeiling);
  const s=manifest.sessions.find(s=>s.sessionId===call.sessionId),d=manifest.catalogs[s.arm].definitions.find(d=>d.stageId===call.stageId);
  assert.equal(request.promptHash,d.promptHash);assert.equal(request.schemaHash,d.schemaHash);
  if(call.accounting){const response=read(prefix+"-response.json");assert.deepEqual(accountUsage(response.usage,manifest.caps.find(c=>c.stage===call.stageId),call.inputCeiling),call.accounting);}
  const requiredFile=prefix+"-inspection-required.json", decisionFile=prefix+"-inspection-decision.json";
  if(existsSync(decisionFile)){const required=read(requiredFile),decision=read(decisionFile);assert.equal(required.receiptHash,hash(read(prefix+"-response.json")));assert.equal(decision.receiptHash,required.receiptHash);assert.equal(decision.stageId,required.stageId);assert.equal(decision.attempt,required.attempt);inspected++;}
}
const observations=records.map(({session,record,input})=>{
  const stages=record.stageDispositions.filter(s=>s.status==="completed");
  const raw=stages.find(s=>s.stageId==="PB-01")?.completion.outputJson;
  const safety=stages.find(s=>s.stageId==="PB-02")?.completion.outputJson;
  let policy=null,error=null;
  if(raw&&safety)try{
    const base=groundBaseStructuredIntakeV3(projectBaseProviderInputV1(input),raw),candidateEnvelope=buildAbsentCandidateLaneV1().candidate_envelope;
    const authority=buildEffectiveAssessmentAuthorityV1({baseStructuredIntake:base,candidateEnvelope,clarificationGrounding:null});
    const args={basePolicyInput:{aggregateSafety:safety,baseStructuredIntake:base,decisionFacts:base.decision_facts,baseWritingSignals:base.base_writing_signals},clarificationGrounding:null,effectiveAssessmentAuthority:authority};
    policy=(session.arm==="candidate-v19"?evaluateV19L1InputSufficiency:evaluateJpy980InputSufficiencyV4)(args);
  }catch(e){error=e.safeCode??"DERIVED_INPUT_TRACE_UNAVAILABLE";}
  return {caseId:record.caseId,anonymousVariantId:record.anonymousVariantId,actualRuntimeVersion:record.actualRuntimeVersion,
    pb01Purpose:raw?.base_writing_signals?.user_goal_detail??null,inputSufficiency:{provenance:"RECOMPUTED_FROM_SAVED_ACTUAL_BASE_AND_SAFETY_USING_EXACT_EXECUTED_SOURCE; no model call",result:policy,error},
    observedEntryDisposition:record.entryDisposition,initialDirection:record.initialDirection,clarificationOrCompleted:record.finalDeliveryDisposition,
    pb05Reports:stages.filter(s=>s.stageId==="PB-05").map(s=>s.completion.outputJson),pb06:stages.filter(s=>s.stageId==="PB-06").map(s=>s.completion.outputJson),reassessment:record.reassessment,
    finalRenderedOutputReference:`blind-review.html#${record.caseId}-${record.anonymousVariantId}-title`,error:record.errorCode};
});
const html=readFileSync(path.join(run,"blind-review.html"),"utf8"),md=readFileSync(path.join(run,"blind-review.md"),"utf8");
assert.doesNotMatch(html+md,/runtime-stage-catalog|current-v17|candidate-v19|actualRuntimeVersion|pipeline-schema-runtime|mapping-SEALED|\bV1[79]\b/u);
assert.doesNotMatch(html,/<input[^>]*\bchecked\b/u); assert.doesNotMatch(html,/<textarea[^>]*>[^<]+<\/textarea>/u);
assert.deepEqual(read(path.join(run,"human-review-status.json")),{status:"PENDING",answers:null,mappingDisclosed:false});
let files=0;function scan(dir){for(const e of readdirSync(dir,{withFileTypes:true})){const file=path.join(dir,e.name);if(e.isDirectory())scan(file);else{files++;assert.equal(/\bsk-[A-Za-z0-9_-]{20,}|Bearer\s+[A-Za-z0-9._-]{20,}/u.test(readFileSync(file,"utf8")),false,"Credential pattern in evidence");}}}scan(run);
const tracePath=path.join(internal,"branch-observations.json");
const trace={schemaVersion:"guidance-v19-pilot-observations-v1",actualApiCallsAdded:0,knownOpen:"F007 generated_without_candidate/preserved_meaning inconsistency; not resolved by Human vote",observations};
if(existsSync(tracePath))assert.deepEqual(read(tracePath),trace);else writeFileSync(tracePath,JSON.stringify(trace,null,2)+"\n",{flag:"wx"});
console.log(JSON.stringify({verification:"PASS",completedSessions:summary.sessionsCompleted,sessionsStarted:summary.sessionsStarted,httpCalls:summary.actualHttpCalls,
  inputTokens:summary.inputTokens,outputTokens:summary.outputTokens,cachedTokens:summary.cachedTokens,reasoningTokens:summary.reasoningTokens,
  costLowerUsd:summary.usageBasedCostLowerUsd,costUpperUsd:summary.usageBasedCostUpperUsd,reservedUsd:summary.reservedUsd,
  clarification:records.filter(x=>x.record.finalDeliveryDisposition==="needs_more_information").length,ready:summary.readyResults,
  stop:summary.stopReason,technicalFailures:summary.technicalFailures,materialFindingCount:summary.materialFindings.length,inspectedReceipts:inspected,filesScanned:files,mappingDisplayed:false,actualApiCallsAdded:0}));
