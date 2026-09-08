// Durable fake receipts test runner continuity/accounting, never model quality.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { executeFinalBatch, verifyLedgerPricing, isSessionQualityStop } from './runner.mjs';
import { loadV19L5StageCatalog } from '../../../lib/assessment/runtime/v19-l5-stage-catalog.ts';
import { loadM2P4FinalProductRecoveryRuntimeStageCatalog } from '../../../lib/assessment/runtime/schema-catalog.ts';
import { createRepairFixture } from '../repair-fixtures.mjs';
const root='evals/guidance-quality-v19-l5',read=f=>JSON.parse(fs.readFileSync(f,'utf8'));
const inputs=read(`${root}/final-qa/inputs.json`),plan=read(`${root}/final-qa/plan.json`),frozen=read(`${root}/expected-dispositions.json`);
const cases=frozen.cases.map(c=>({id:c.caseId,label:c.label,consultation:c.consultation,input:c.input}));
const catalogs={V17:await loadM2P4FinalProductRecoveryRuntimeStageCatalog(),'V19-L5':await loadV19L5StageCatalog()};
let network=0;globalThis.fetch=async()=>{network++;throw Error('NETWORK_FORBIDDEN');};
const dir=`${root}/final-qa/fake-runner-${Date.now()}`;
const common={mode:'offline_fake',plan,inputs,cases,catalogs,sourceGuard:()=>{},inspect:async({binding})=>({binding,action:'continue',materialFindings:[],reason:'Authored fake receipt inspection only.'})};
assert.throws(()=>verifyLedgerPricing({...plan,referenceReservationRatesPerMillionUsd:{inputIncludingCacheWrite:0.1,outputIncludingReasoning:1.2}}));
const provenance={requestIdentityVerified:true,model:'gpt-5.6-luna',serviceTier:'default',accounted:true,settlementStatus:'received',status:'completed',outputValidation:'valid',stageId:'PB-06',attempt:2};
assert.equal(isSessionQualityStop('M2_REPORT_FACT_REPAIR_VERIFICATION_FAILED',provenance),true);
assert.equal(isSessionQualityStop('M2_REPORT_FACT_REPAIR_VERIFICATION_FAILED',{...provenance,stageId:'PB-01'}),false);
assert.equal(isSessionQualityStop('V19_L5_EDIT_SOURCE_INVALID',{...provenance,stageId:'PB-04',attempt:1}),true);
assert.equal(isSessionQualityStop('V19_L5_EDIT_SOURCE_INVALID',{...provenance,stageId:'PB-02',attempt:1}),false);
await assert.rejects(()=>executeFinalBatch({...common,directory:dir+'-wrong-ui',cases:cases.map((c,i)=>i?c:{...c,consultation:'wrong consultation'}),send:async()=>{throw Error('MUST_NOT_SEND');}}),e=>e.safeCode==='WRONG_CASE_OR_INPUT');
let sends=0;
const send=async(body,dispatch)=>{dispatch();sends++;return {id:`fake-${sends}`,model:body.model,service_tier:'default',status:'completed',
  output_text:'{}',usage:{input_tokens:100,output_tokens:10,total_tokens:110,input_tokens_details:{cached_tokens:0,cache_write_tokens:0},output_tokens_details:{reasoning_tokens:0}}};};
const batch=await executeFinalBatch({...common,directory:dir,send});
assert.equal(batch.summary.status,'BATCH_FINISHED');assert.equal(batch.records.length,24);assert.ok(batch.records.every(r=>r.finalState==='stopped'));
assert.equal(sends,24);assert.equal(batch.summary.actualHttpCalls,24);assert.equal(batch.summary.unknownUsageCalls,0);assert.equal(batch.summary.realApiCalls,0);
assert.ok(batch.summary.reservedUsd>batch.summary.usageBasedCostUpperUsd);assert.equal(network,0);
await assert.rejects(()=>executeFinalBatch({...common,directory:dir,send}),e=>e.safeCode==='ONE_SHOT_RUN_ALREADY_EXISTS');
let forbidden=0;await assert.rejects(()=>executeFinalBatch({...common,mode:'authorized_live',directory:dir+'-no-authority',send:async()=>{forbidden++;}}),e=>e.safeCode==='FRESH_HUMAN_AUTHORIZATION_REQUIRED');assert.equal(forbidden,0);
const unknown=await executeFinalBatch({...common,directory:dir+'-unknown',send:async(body,dispatch)=>{dispatch();throw Error('authored timeout');}});
assert.equal(unknown.summary.status,'GLOBAL_STOP');assert.equal(unknown.summary.actualHttpCalls,1);assert.equal(unknown.summary.unknownUsageCalls,1);assert.ok(unknown.summary.reservedUsd>0);
const mismatch=await executeFinalBatch({...common,directory:dir+'-mismatch',send:async(body,dispatch)=>({...await send(body,dispatch),model:'wrong-model'})});
assert.equal(mismatch.summary.status,'GLOBAL_STOP');assert.equal(mismatch.summary.actualHttpCalls,1);assert.equal(mismatch.summary.sessionsStarted,1);
const base=createRepairFixture().base;
const validSchemaSend=async(body,dispatch)=>{
  const input=JSON.parse(body.input[1].content[0].text);
  const output=body.text.format.name==='pb_01_v19_l5_base_intent_v1'?{schema_version:'v19-l5-base-intent-v1',base_intake:base,
    request_intent:{message_task:'NONE',decision_requested:true,decision_explicitly_excluded:false,communication_purpose:'OTHER',evidence_fact_ids:['F305'],source_excerpt:input.base_provider_input.current_situation}}:base;
  return {...await send(body,dispatch),output_text:JSON.stringify(output)};
};
const wrongBinding=await executeFinalBatch({...common,directory:dir+'-wrong-binding',send:validSchemaSend,
  inspect:async({binding})=>({binding:{...binding,receiptHash:'wrong'},action:'continue',materialFindings:[],reason:'Authored mismatched binding.'})});
assert.equal(wrongBinding.summary.status,'GLOBAL_STOP');assert.equal(wrongBinding.summary.actualHttpCalls,1);
const isolated=await executeFinalBatch({...common,directory:dir+'-isolated-inspection',send:validSchemaSend,
  inspect:async({binding,output,request})=>{output.mutated=true;request.input.mutated=true;return {binding,action:'stop',materialFindings:[],reason:'Authored SESSION STOP; mutation is confined to the inspection copy.'};}});
assert.equal(isolated.summary.status,'BATCH_FINISHED');assert.equal(isolated.records.length,24);
assert.ok(isolated.records.every(record=>record.responses[0].output.mutated===undefined));
fs.writeFileSync(`${root}/runner-verification.json`,JSON.stringify({status:'PASS',kind:'OFFLINE_FAKE_RECEIPTS_ONLY',directory:dir,
  sessionStopContinuesAll24:true,unknownOutcomeRetainsReservation:true,modelMismatchGlobalStop:true,receiptBindingRequired:true,inspectionCannotMutateAuthority:true,
  actualLedgerPricingProbed:true,unauthorizedDispatches:0,networkAttempts:network,realApiCalls:0},null,2)+'\n');
console.log('PASS: fake 24-session continuity, one-shot guard, reservation/accounting, timeout and model GLOBAL STOP, no-authorization rejection; real API 0.');
