import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { makeRuntimeFixture,runFixture,FIXTURE_PROVENANCE } from "./runtime-fixtures.mjs";
import { loadGuidanceQualityWave1StageCatalog } from "../../lib/assessment/runtime/guidance-stage-catalog-v1.ts";
import { loadM2P4FinalProductRecoveryRuntimeStageCatalog } from "../../lib/assessment/runtime/schema-catalog.ts";
import { validateStageOutput } from "../../lib/assessment/runtime/validation.ts";
import { requireReadyAssessmentResult } from "../../lib/assessment/runtime/runtime-result-normalization-v1.ts";
import { projectCustomerAssessmentV1 } from "../../lib/assessment/runtime/customer-assessment-projection-v1.ts";
import { evaluateGuidanceRequestCompletenessV1 } from "../../lib/assessment/runtime/guidance-request-completeness-v1.ts";
const current=await loadM2P4FinalProductRecoveryRuntimeStageCatalog(),candidate=await loadGuidanceQualityWave1StageCatalog();
let checks=0;const test=async(name,f)=>{await f();console.log('PASS '+(++checks)+' '+name)};
const fails=(fn,code)=>assert.rejects(fn,e=>e.safeCode===code);
const findings=(base,code,severity,path)=>({...base,semantic_checks:[{finding_code:code,severity,json_path:path,evidence_refs:[],detail:"Synthetic injected finding; detection not tested."}]});
await test("frozen 30 expectations and Production contracts unchanged",()=>{
 const paths=['evals/guidance-quality-r1/cases.json','lib/assessment/production/application-runtime.ts','lib/assessment/runtime/contracts/runtime-stage-catalog-v17.json','lib/assessment/runtime/quality-reassessment-v2.ts','lib/assessment/runtime/jpy980-input-sufficiency-policy-v4.ts','lib/assessment/runtime/effective-decision-policy-v2.ts'];
 for(const p of paths)assert.equal(execFileSync('git',['hash-object','--path='+p,p],{encoding:'utf8'}).trim(),execFileSync('git',['rev-parse','46fa02a52e39a5c5c4d62bf4e66292619a8b286f:'+p],{encoding:'utf8'}).trim(),p);
 const frozen=readFileSync(paths[0],'utf8').replaceAll('\r\n','\n');assert.equal(createHash('sha256').update(frozen).digest('hex'),'b4544798a68db8dcb1d6a7fe54adc6ddce16c9787ae263d7e5371aefa09efd14');
});
await test("candidate catalog hashes and only PB04/05/06 changed",()=>{
 assert.equal(candidate.definitions.length,7);
 for(const d of current.definitions){const next=candidate.definitions.find(n=>n.stageId===d.stageId);if(!['PB-04','PB-05','PB-06'].includes(d.stageId))assert.deepEqual(next,d);else assert.notEqual(next.promptHash,d.promptHash)}
 assert.equal(candidate.definitions.find(d=>d.stageId==='PB-05').schemaHash,current.definitions.find(d=>d.stageId==='PB-05').schemaHash);
});
const ready=new Map();
for(const id of ['GQ-28','GQ-05','GQ-24','GQ-03','GQ-29'])await test(id+" full local candidate input -> policy -> Plan -> validation -> projection",async()=>{
 const f=makeRuntimeFixture(id),r=await runFixture(f);assert.equal(r.result.eligibility,'ready');
 assert.equal(r.result.decision,f.outputs['PB-04'].selected_decision);assert.equal(r.result.report.schemaVersion,'guidance-runtime-report-v1');
 const p=projectCustomerAssessmentV1(r.result,f.request.requestedTopics);assert.equal(p.immediateAction.action,f.outputs['PB-04'].actions_to_take[0]);
 assert.deepEqual(p.immediateAction.avoid,[]);assert.equal(r.transport.actualProviderCalls,0);assert.equal(r.repository.actualSupabaseCalls,0);assert.equal(r.transport.calls.length,6);ready.set(id,r.result);
});
await test("V17 current execute reproduces three stops and preserves reply/wait controls",async()=>{
 for(const id of ['GQ-28','GQ-05','GQ-24','GQ-03','GQ-29']){const f=makeRuntimeFixture(id,{candidate:false}),r=await runFixture(f,{candidate:false});assert.equal(r.result.eligibility,['GQ-03','GQ-29'].includes(id)?'ready':'needs_more_information');if(r.result.eligibility==='ready')assert.equal(r.result.report.schemaVersion,'m2-p4-split-runtime-report-v1')}
});
await test("no-draft wait with no requested period remains complete",()=>{const r=ready.get('GQ-29');assert.equal(r.report.decisionPlan.recommended_message_draft,null);assert.equal(projectCustomerAssessmentV1(r,['decide_send_or_wait']).finalDraft,null);assert.deepEqual(evaluateGuidanceRequestCompletenessV1({requestedTopics:['decide_send_or_wait'],decisionPlan:r.report.decisionPlan,reportContent:r.report.content}),[])});
await test("explicit three-day plan and draft survive candidate generation and projection",async()=>{
 const f=makeRuntimeFixture('GQ-28',{detailed:true});f.request.requestedTopics.push('draft_message');const r=await runFixture(f);assert.equal(r.result.eligibility,'ready');assert.equal(r.transport.calls.length,6);
 const p=projectCustomerAssessmentV1(r.result,f.request.requestedTopics);assert.equal(p.optionalDetails.expandedPlan.length,3);assert.ok(p.finalDraft.text.length>0);
 for(const id of ['PB-05','PB-06'])assert.deepEqual(r.transport.requests.find(x=>x.stageId===id).input.requested_topics,f.request.requestedTopics);
});
await test("one conditional item covers a requested period without daily phases or duplicate commentary",async()=>{
 const f=makeRuntimeFixture('GQ-29',{detailed:true});
 f.outputs['PB-04'].aftercare_plan=[{phase:'reassessment_condition',action:'今後3日間は追加の連絡を控え、相手から連絡が来たら内容に応じて返信を考える。来なければ、三日目だからと自動で追送しない。',avoid:'返信の時期や相手の気持ちを決めつけない。',supporting_fact_ids:['F001']}];
 f.outputs['PB-05'].aftercare_commentary=[];
 const r=await runFixture(f);assert.equal(r.result.eligibility,'ready');assert.equal(r.transport.calls.length,6);
 const p=projectCustomerAssessmentV1(r.result,f.request.requestedTopics);assert.equal(p.optionalDetails.expandedPlan.length,1);assert.equal(p.finalDraft,null);
 assert.deepEqual(evaluateGuidanceRequestCompletenessV1({requestedTopics:f.request.requestedTopics,decisionPlan:f.outputs['PB-04'],reportContent:f.outputs['PB-05']}),[]);
});
await test("optional greeting prose with primary reply survives schema, validation and projection",async()=>{
 const f=makeRuntimeFixture('GQ-24');
 const optional='一言返すなら短い挨拶で十分です。お礼のやり取りはまとまっているので、ここで終えても構いません。';
 f.outputs['PB-04'].actions_to_take=['一言返したければ、短い挨拶で締める。'];
 f.outputs['PB-05'].decision_reason_summary=optional;
 const r=await runFixture(f);assert.equal(r.result.eligibility,'ready');assert.equal(r.result.decision,'reply_now');
 assert.equal(projectCustomerAssessmentV1(r.result,f.request.requestedTopics).primaryReason,optional);
 // Fake PB06 establishes no claim about a real evaluator accepting optionality.
});
await test("requested period missing triggers one combined Plan repair, then corrected plan delivers",async()=>{
 const f=makeRuntimeFixture('GQ-28',{detailed:true}),bad=structuredClone(f.outputs['PB-04']);bad.aftercare_plan=[];
 const r=await runFixture(f,{outputSequence:{'PB-04':[bad,f.outputs['PB-04']]}});assert.equal(r.result.eligibility,'ready');assert.equal(r.transport.calls.filter(x=>x==='PB-04').length,2);assert.equal(r.result.report.decisionPlan.aftercare_plan.length,3);
});
await test("entire requested period still absent after repair cannot be silently omitted",async()=>{
 const f=makeRuntimeFixture('GQ-28');f.request.requestedTopics.push('next_three_days');await fails(()=>runFixture(f),'M2_PRODUCT_QUALITY_REASSESSMENT_EXHAUSTED');
});
await test("candidate requires send/reply draft; no dummy or empty action allowed",async()=>{
 for(const mutate of [p=>{p.recommended_message_draft=null;p.message_draft_edit_metadata=null},p=>{p.actions_to_take=[]},p=>{p.actions_to_take=['']}]){const f=makeRuntimeFixture('GQ-28');mutate(f.outputs['PB-04']);await fails(()=>runFixture(f),'M2_STAGE_SCHEMA_INVALID')}
});
await test("known F007 unknown-reason reference limitation stays visible; forbidden policy direction rejected",async()=>{
 for(const candidate of [false,true]){const f=makeRuntimeFixture('GQ-03',{candidate});f.outputs['PB-04'].decision_reason_fact_ids=['F999'];const r=await runFixture(f,{candidate});assert.equal(r.result.eligibility,'ready');assert.equal(r.transport.calls.filter(x=>x==='PB-06').length,2);assert.deepEqual(r.result.report.decisionPlan.decision_reason_fact_ids,['F999']);}
 const g=makeRuntimeFixture('GQ-29');g.outputs['PB-04']=structuredClone(makeRuntimeFixture('GQ-28').outputs['PB-04']);await fails(()=>runFixture(g),'M2_PLAN_POLICY_VIOLATION');
});
await test("fake critical fact/meaning/action findings preserve bounded fail-closed behavior",async()=>{
 for(const [code,path] of [['FACT_FIDELITY','report_content.decision_reason_summary'],['MESSAGE_POLICY_CONSISTENCY','decision_plan.recommended_message_draft.text'],['ACTION_CONSISTENCY','decision_plan.actions_to_take[0]']]){const f=makeRuntimeFixture('GQ-28');f.outputs['PB-06']=findings(f.outputs['PB-06'],code,'critical',path);await fails(()=>runFixture(f),'M2_PRODUCT_QUALITY_REASSESSMENT_EXHAUSTED')}
});
await test("repair cannot turn the same grounded send into ungrounded wait",async()=>{
 const f=makeRuntimeFixture('GQ-28'),wrong=structuredClone(makeRuntimeFixture('GQ-29').outputs['PB-04']);
 await fails(()=>runFixture(f,{outputSequence:{'PB-04':[f.outputs['PB-04'],wrong],'PB-06':[findings(f.outputs['PB-06'],'ACTION_CONSISTENCY','critical','decision_plan.actions_to_take[0]')]}}),'M2_PLAN_POLICY_VIOLATION');
});
await test("technical provider failure remains failure, no generic successful delivery",async()=>{await fails(()=>runFixture(makeRuntimeFixture('GQ-28'),{failAtStage:'PB-05'}),'M2_FAKE_STAGE_FAILURE')});
await test("report-only repair failure still has F008 limitation; no new recovery engine",async()=>{
 const f=makeRuntimeFixture('GQ-28');f.outputs['PB-06']=findings(f.outputs['PB-06'],'TEMPLATE_GENERICITY','major','report_content.cover_line');await fails(()=>runFixture(f,{outputSequence:{'PB-05':[f.outputs['PB-05'],{}]}}),'M2_STAGE_SCHEMA_INVALID');
});
await test("all six mixed report/Plan/card marker sets and unknown marker reject",()=>{
 for(let bits=1;bits<7;bits++){const r=structuredClone(ready.get('GQ-28'));r.report.decisionPlan.actions_to_avoid=['返事を要求しない。'];r.decisionCard.actionsToAvoid=[...r.report.decisionPlan.actions_to_avoid];if(bits&1)r.report.schemaVersion='m2-p4-split-runtime-report-v1';if(bits&2)r.report.decisionPlan.schema_version='pipeline-schema-v2.0.0';if(bits&4)r.decisionCard.schemaVersion='m2-p3-decision-card-v1';assert.throws(()=>requireReadyAssessmentResult(r))}
 const r=structuredClone(ready.get('GQ-28'));r.report.schemaVersion='unknown';assert.throws(()=>requireReadyAssessmentResult(r));
});
await test("legacy min1 avoidance and candidate min0 contracts both enforced",()=>{
 const p=makeRuntimeFixture('GQ-28').outputs['PB-04'];validateStageOutput(candidate.definitions.find(d=>d.stageId==='PB-04'),p);p.schema_version='pipeline-schema-v2.0.0';assert.throws(()=>validateStageOutput(current.definitions.find(d=>d.stageId==='PB-04'),p));p.actions_to_avoid=['返事を要求しない。'];validateStageOutput(current.definitions.find(d=>d.stageId==='PB-04'),p);
});
await test("candidate and V17 catalog/identity mixing rejected",async()=>{
 for(const catalog of [{...candidate,promptBundleVersion:current.promptBundleVersion,schemaSetVersion:current.schemaSetVersion},{...current,promptBundleVersion:candidate.promptBundleVersion,schemaSetVersion:candidate.schemaSetVersion}])await fails(()=>runFixture(makeRuntimeFixture('GQ-28'),{catalog}),'M2_STAGE_TOPOLOGY_INVALID');
});
await test("candidate display uses sending as primary; legacy detailed rendering semantics unchanged",async()=>{
 const a=makeRuntimeFixture('GQ-03',{detailed:true}),b=makeRuntimeFixture('GQ-03',{candidate:false,detailed:true});
 const x=projectCustomerAssessmentV1((await runFixture(a)).result,a.request.requestedTopics),y=projectCustomerAssessmentV1((await runFixture(b,{candidate:false})).result,b.request.requestedTopics);
 assert.equal(x.immediateAction.action,a.outputs['PB-04'].actions_to_take[0]);assert.equal(y.immediateAction.action,b.outputs['PB-04'].aftercare_plan[0].action);
});
console.log(JSON.stringify({checks,passed:checks,actualProviderCalls:0,actualDatabaseCalls:0,actualModelQuality:'NOT_RUN',provenance:FIXTURE_PROVENANCE}));
