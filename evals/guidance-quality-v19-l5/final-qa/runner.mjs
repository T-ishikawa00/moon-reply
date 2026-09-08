// Callable evaluation runner only. No top-level execution, Provider or key access.
// A fresh Human authorization and pricing preflight are required for a live send.
import fs from 'node:fs';
import path from 'node:path';
import { randomInt, randomUUID } from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';
import { ReservationLedger, accountUsage, reserveNanos, hash, PilotStop } from '../../guidance-quality-wave1/real-pilot/budget.mjs';
import { buildBody, durableJson, reviewStage } from '../../guidance-quality-wave1/real-pilot/transport.mjs';
import { manualFindingsMatchRepair, classifyExpandedStop } from '../../guidance-quality-v19-l4/expanded-12/stop-policy.mjs';
import { captureNext, publicSlot } from './adapter.mjs';
import { writeBlindReview } from './review.mjs';
import { validateStageOutput } from '../../../lib/assessment/runtime/validation.ts';
import { canonicalizeDecisionPlanFactReferencesV1 } from '../../../lib/assessment/runtime/decision-plan-fact-reference-canonicalization-v1.ts';
const check=(ok,code)=>{if(!ok)throw new PilotStop(code);};
const qualityStages=new Map([
  ['M2_V19_L5_INTENT_SOURCE_INTEGRITY_FAILED',['PB-01']],['V19_L5_ANSWER_MODE_MISMATCH',['PB-04','PB-05']],
  ['V19_L5_MESSAGE_PLAN_INVALID',['PB-04']],['V19_L5_EDIT_SOURCE_INVALID',['PB-04']],['V19_L5_EDIT_EVIDENCE_INVALID',['PB-04']],
  ['V19_L5_MESSAGE_VALIDATION_FAILED',['PB-06']],['V19_L5_DECISION_PLAN_INVALID',['PB-04']],['V19_L5_MIXED_EDIT_DROPPED',['PB-04']],
  ['V19_L5_MATERIAL_DELIVERY_BLOCKED',['PB-06']],['V19_L5_INPUT_NOT_SUFFICIENT',['PB-03']],['SAFETY_CLASSIFICATION_NOT_NORMAL',['PB-03']],
]);
export function isSessionQualityStop(code,provenance) {
  if(!provenance||provenance.accounted!==true||provenance.settlementStatus!=='received'||provenance.status!=='completed'||
    provenance.model!=='gpt-5.6-luna'||provenance.serviceTier!=='default'||provenance.requestIdentityVerified!==true)return false;
  if(['M2_STAGE_SCHEMA_INVALID','SCHEMA_INVALID_JSON'].includes(code))return provenance.outputValidation==='received_unvalidated'&&[1,2].includes(provenance.attempt);
  const stages=qualityStages.get(code);
  if(stages)return provenance.outputValidation==='valid'&&provenance.attempt===1&&stages.includes(provenance.stageId);
  return classifyExpandedStop(code,provenance).scope==='session';
}

export function verifyLedgerPricing(plan) {
  const cap={input:1000000,outputIncludingReasoning:1000000};
  const charge=(input,cached,writes,output)=>accountUsage({input_tokens:input,output_tokens:output,total_tokens:input+output,
    input_tokens_details:{cached_tokens:cached,cache_write_tokens:writes},output_tokens_details:{reasoning_tokens:0}},cap).upperNanos/1e9;
  const actual={input:charge(1000000,0,0,0),cached:charge(1000000,1000000,0,0),cacheWrite:charge(1000000,0,1000000,0),output:charge(0,0,0,1000000)};
  check(isDeepStrictEqual(actual,{input:0.2,cached:0.02,cacheWrite:0.25,output:1.2})&&
    isDeepStrictEqual(plan.referenceAccountingRatesPerMillionUsd,actual)&&
    isDeepStrictEqual(plan.referenceReservationRatesPerMillionUsd,{inputIncludingCacheWrite:reserveNanos({input:1000000,outputIncludingReasoning:0})/1e9,
      outputIncludingReasoning:reserveNanos({input:0,outputIncludingReasoning:1000000})/1e9}),'PRICING_ACCOUNTING_MISMATCH');
  return actual;
}

export async function executeFinalBatch({mode='unauthorized',authorization,plan,inputs,cases,catalogs,directory,send,inspect,sourceGuard}) {
  check(['offline_fake','authorized_live'].includes(mode),'FRESH_HUMAN_AUTHORIZATION_REQUIRED');
  check(typeof send==='function'&&typeof inspect==='function'&&typeof sourceGuard==='function','RUNNER_DEPENDENCY_MISSING');
  let implementationIdentity=null;
  const verifySource=()=>{
    try{sourceGuard();}catch{throw new PilotStop('RUNNER_SOURCE_GUARD_FAILURE');}
    if(implementationIdentity) {
      check(hash(JSON.parse(fs.readFileSync('evals/guidance-quality-v19-l5/candidate-identity.json','utf8')))===authorization.implementationIdentityHash,'MODEL_VERSION_MISMATCH');
      for(const [file,expected]of Object.entries(implementationIdentity.sourceHashes))check(hash(fs.readFileSync(file,'utf8').replace(/\r\n/gu,'\n'))===expected,'MODEL_VERSION_MISMATCH');
    }
  };
  check(plan.sessions===24&&inputs.cases.length===12&&cases.length===12&&plan.maximumFinalQaRuns===1,'WRONG_CASE_OR_INPUT');
  const accountingRates=verifyLedgerPricing(plan);
  check(hash(fs.readFileSync('evals/guidance-quality-v19-l5/final-qa/inputs.json','utf8'))===plan.inputHash,'WRONG_CASE_OR_INPUT');
  check(isDeepStrictEqual(inputs,JSON.parse(fs.readFileSync('evals/guidance-quality-v19-l5/final-qa/inputs.json','utf8'))),'WRONG_CASE_OR_INPUT');
  const expectedText=fs.readFileSync('evals/guidance-quality-v19-l5/expected-dispositions.json','utf8');
  check(hash(expectedText)===plan.expectedDispositionHash&&hash(fs.readFileSync('evals/guidance-quality-v19-l5/final-qa-acceptance.md','utf8'))===plan.acceptanceHash,'EXPECTATION_AUTHORITY_MISMATCH');
  const expectedCases=JSON.parse(expectedText).cases.map(c=>({id:c.caseId,label:c.label,consultation:c.consultation,input:c.input}));
  check(isDeepStrictEqual(cases,expectedCases)&&new Set(inputs.cases.map(c=>c.id)).size===12&&
    isDeepStrictEqual(inputs.cases,expectedCases.map(c=>({id:c.id,input:c.input}))),'WRONG_CASE_OR_INPUT');
  if(mode==='authorized_live') {
    check(authorization?.humanAuthorized===true&&authorization.scope==='ONE_FINAL_EXPANDED_12_BATCH'&&authorization.maxSessions===24&&authorization.hardCapUsd===6,
      'FRESH_HUMAN_AUTHORIZATION_REQUIRED');
    implementationIdentity=JSON.parse(fs.readFileSync('evals/guidance-quality-v19-l5/candidate-identity.json','utf8'));
    check(hash(implementationIdentity)===authorization.implementationIdentityHash&&implementationIdentity.implementationCommit===authorization.implementationCommit,'MODEL_VERSION_MISMATCH');
    check(authorization.implementationHash===hash(catalogs)&&authorization.planHash===hash(plan)&&authorization.pricingVerifiedImmediatelyBeforeRun===true&&
      isDeepStrictEqual(authorization.reservationRatesPerMillionUsd,plan.referenceReservationRatesPerMillionUsd)&&
      isDeepStrictEqual(authorization.accountingRatesPerMillionUsd,accountingRates),'PRICING_OR_IDENTITY_PREFLIGHT_MISMATCH');
  }
  check(!fs.existsSync(directory),'ONE_SHOT_RUN_ALREADY_EXISTS'); verifySource();
  const arms=['V17','V19-L5'];
  check(catalogs.V17.catalogVersion==='runtime-stage-catalog-v17.0.0'&&catalogs['V19-L5'].catalogVersion==='runtime-stage-catalog-v23.0.0','MODEL_VERSION_MISMATCH');
  if(mode==='authorized_live')fs.writeFileSync('evals/guidance-quality-v19-l5/final-qa/live-consumed.lock',JSON.stringify(authorization),{flag:'wx'});
  fs.mkdirSync(directory,{recursive:true});const internal=path.join(directory,'internal');fs.mkdirSync(internal);
  const mapping={sealed:true,cases:Object.fromEntries(inputs.cases.map(c=>[c.id,randomInt(2)?{A:arms[0],B:arms[1]}:{A:arms[1],B:arms[0]}]))};
  const sessions=inputs.cases.flatMap((c,i)=>(i%2?[...arms].reverse():arms).map(arm=>({caseId:c.id,arm,sessionId:randomUUID(),anonymousVariantId:Object.keys(mapping.cases[c.id]).find(k=>mapping.cases[c.id][k]===arm)})));
  const manifest={schemaVersion:'final-expanded-12-execution-v1',mode,sessions,maxHttpAttempts:plan.maxHttp,budgetNanos:6e9,
    caps:plan.caps.map(c=>({...c,invocationsPerSession:['PB-04','PB-05','PB-06'].includes(c.stage)?2:1})),
    inputHash:plan.inputHash,expectedDispositionHash:plan.expectedDispositionHash,acceptanceHash:plan.acceptanceHash,planHash:hash(plan),catalogsHash:hash(catalogs),mappingHash:hash(mapping)};
  durableJson(path.join(internal,'manifest.json'),manifest);durableJson(path.join(internal,'mapping-SEALED.json'),mapping);
  const ledgerFile=path.join(internal,'reservations.jsonl'),ledger=new ReservationLedger(ledgerFile,manifest,{create:true});
  const records=[];
  const guard=()=>{
    verifySource();check(hash(JSON.parse(fs.readFileSync(path.join(internal,'manifest.json'),'utf8')))===hash(manifest),'MAPPING_CORRUPTION');
    check(hash(JSON.parse(fs.readFileSync(path.join(internal,'mapping-SEALED.json'),'utf8')))===manifest.mappingHash,'MAPPING_CORRUPTION');
    check(hash(catalogs)===manifest.catalogsHash,'MODEL_VERSION_MISMATCH');
    check(hash(plan)===manifest.planHash&&isDeepStrictEqual(inputs.cases,expectedCases.map(c=>({id:c.id,input:c.input})))&&isDeepStrictEqual(cases,expectedCases),'WRONG_CASE_OR_INPUT');
    const disk=new ReservationLedger(ledgerFile,manifest);check(isDeepStrictEqual(disk.summary(),ledger.summary())&&disk.events.at(-1)?.checksum===ledger.events.at(-1)?.checksum,'BUDGET_LEDGER_ACCOUNTING_MISMATCH');
  };
  try {
    for(const session of sessions) {
      guard();ledger.start(session.sessionId);
      const dir=path.join(internal,session.sessionId);fs.mkdirSync(dir);
      const catalog=catalogs[session.arm],input=inputs.cases.find(c=>c.id===session.caseId).input,responses=[],inspections=[];
      let result=null,errorCode=null,lastProvenance=null,repair=false;
      try {
        for(;;) {
          guard();const captured=await captureNext({catalog,input,responses,now:'2026-09-08T04:00:00+09:00',sessionId:session.sessionId});
          durableJson(path.join(dir,`capture-${responses.length+1}.json`),captured);
          if(!captured.request){result=captured.result;if(captured.errorCode)throw new PilotStop(captured.errorCode);break;}
          const {request:q,attempt}=captured,context=q.input.report_fact_repair_context;
          if(q.schemaVersion==='report-fact-repair-v1') {
            check(session.arm==='V19-L5'&&!repair&&attempt===2&&manualFindingsMatchRepair(inspections,context),'UNRESOLVED_MANUAL_MATERIAL_FINDING'); repair=true;
          }
          const cap=plan.caps.find(c=>c.stage===q.stageId),body=buildBody(q,cap),ceiling=Buffer.byteLength(JSON.stringify(body),'utf8')+4096;
          lastProvenance=null;
          const reservation=ledger.reserve(session.sessionId,q.stageId,attempt,ceiling,hash(body));
          const prefix=path.join(dir,`call-${reservation.sequence}`);durableJson(prefix+'-request.json',{q,attempt,body,inputCeiling:ceiling,reservation});
          let received,settled=false;
          try {
            received=await send(body,()=>{guard();ledger.dispatch(reservation);},{session,attempt});
            check(ledger.calls.find(c=>c.sequence===reservation.sequence)?.dispatched,'HTTP_ACCOUNTING_MISMATCH');
            // Save only actual text/usage identifiers, never headers or hidden reasoning.
            durableJson(prefix+'-response.json',{id:received.id,model:received.model,status:received.status,service_tier:received.service_tier,usage:received.usage,output_text:received.output_text});
            const accounting=accountUsage(received.usage,cap,ceiling);ledger.settle(reservation,{status:'received',accounting});settled=true;
            check(received.model===body.model&&received.service_tier===body.service_tier,'MODEL_OR_SERVICE_TIER_MISMATCH');
            check(received.status==='completed'&&typeof received.output_text==='string','INCOMPLETE_RESPONSE');
          } catch(error) {if(!settled)ledger.settle(reservation,{status:'unknown_or_failed',stopReason:error.safeCode??'HTTP_UNKNOWN_OUTCOME'});throw error;}
          lastProvenance={requestIdentityVerified:true,model:received.model,serviceTier:received.service_tier,accounted:true,settlementStatus:'received',status:'completed',outputValidation:'received_unvalidated',stageId:q.stageId,attempt};
          let output;try{output=JSON.parse(received.output_text);}catch{throw new PilotStop('SCHEMA_INVALID_JSON');}
          let canonical=structuredClone(output);
          if(q.stageId==='PB-04') {
            if(session.arm==='V19-L5'&&canonical.decision_plan)canonical.decision_plan=canonicalizeDecisionPlanFactReferencesV1(canonical.decision_plan);
            else if(session.arm==='V17')canonical=canonicalizeDecisionPlanFactReferencesV1(canonical);
          }
          const normal=catalog.definitions.find(d=>d.stageId===q.stageId),definition=q.schemaVersion==='report-fact-repair-v1'?{...normal,...normal.reportFactRepair}:normal;
          validateStageOutput(definition,canonical);lastProvenance.outputValidation='valid';
          responses.push({stageId:q.stageId,attempt,output});
          // Independent review is required before any next call. It is not a new
          // model/API sample and cannot supply replacement Product text.
          const receivedEvidence={id:received.id,model:received.model,status:received.status,service_tier:received.service_tier,usage:received.usage,output_text:received.output_text};
          const binding={sessionId:session.sessionId,stageId:q.stageId,attempt,requestHash:hash(q),receiptHash:hash(receivedEvidence)};
          const beforeInspection=hash({q,output,receivedEvidence});
          let inspection;
          try{inspection=await inspect(structuredClone({session,request:q,attempt,output,received:receivedEvidence,binding}));}
          catch{throw new PilotStop('RUNNER_INSPECTION_FAILED');}
          check(beforeInspection===hash({q,output,receivedEvidence}),'RUNNER_INSPECTION_MUTATED_AUTHORITY');
          check(inspection&&isDeepStrictEqual(inspection.binding,binding)&&['continue','stop'].includes(inspection.action)&&Array.isArray(inspection.materialFindings)&&typeof inspection.reason==='string','RUNNER_INSPECTION_INVALID');
          inspections.push(structuredClone(inspection));durableJson(prefix+'-inspection.json',inspection);
          if(inspection.action==='stop')throw new PilotStop('MATERIAL_MANUAL_INTEGRITY_OR_SAFETY');
          if(session.arm==='V17') {
            const definition=catalog.definitions.find(d=>d.stageId===q.stageId);
            const review=reviewStage(q,output,definition,input);durableJson(prefix+'-review.json',review);
            if(review.stopReason)throw new PilotStop(review.stopReason);
          }
          if(inspection.materialFindings.length) {
            const f=inspection.materialFindings[0];
            const known=new Set(q.input.base_structured_intake?.observed_facts?.map(fact=>fact.fact_id));
            const pending=session.arm==='V19-L5'&&attempt===1&&['PB-05','PB-06'].includes(q.stageId)&&inspection.materialFindings.length===1&&
              ['FACT_FIDELITY','ASSUMPTION_AS_FACT','UNSUPPORTED_CERTAINTY'].includes(f.finding_code)&&/^report_content\.(short_letter\[\d+\]|observed_fact_commentary\[\d+\]\.commentary)$/u.test(String(f.json_path).replace(/^\$\./u,''))&&
              Array.isArray(f.evidence_refs)&&f.evidence_refs.length>0&&new Set(f.evidence_refs).size===f.evidence_refs.length&&f.evidence_refs.every(id=>known.has(id));
            check(pending,'MATERIAL_MANUAL_INTEGRITY_OR_SAFETY');
          }
          if(q.stageId==='PB-06'&&inspections.some(i=>i.materialFindings.length)&&!repair) {
            const next=await captureNext({catalog,input,responses,now:'2026-09-08T04:00:00+09:00',sessionId:session.sessionId});
            check(next.request?.schemaVersion==='report-fact-repair-v1'&&manualFindingsMatchRepair(inspections,next.request.input.report_fact_repair_context),'UNRESOLVED_MANUAL_MATERIAL_FINDING');
          }
        }
        check(repair||!inspections.some(i=>i.materialFindings.length),'UNRESOLVED_MANUAL_MATERIAL_FINDING');
      } catch(error) {
        errorCode=error.safeCode??'RUNNER_UNCLASSIFIED_FAILURE';
        const local=isSessionQualityStop(errorCode,lastProvenance);
        if(!local)ledger.stop(errorCode);
      }
      const finalState=errorCode?'stopped':session.arm==='V19-L5'?result.finalState:result?.eligibility==='ready'?'completed':result?.clarification?'clarification':'stopped';
      const record={...session,finalState,errorCode,result,repair,responses,inspections,usageCost:ledger.calls.filter(c=>c.sessionId===session.sessionId)};
      durableJson(path.join(dir,'session.json'),record);records.push(record);ledger.finish(session.sessionId,finalState==='stopped'?'failed':'completed');
      if(ledger.stopReason)break;
    }
  } catch(error) {ledger.stop(error.safeCode??'RUNNER_UNCLASSIFIED_FAILURE');}
  const slots=records.map(r=>r.arm==='V19-L5'&&!r.errorCode?publicSlot({...r,result:r.result}):{caseId:r.caseId,anonymousVariantId:r.anonymousVariantId,finalState:r.finalState,finalOutput:r.finalState==='stopped'?null:r.result});
  await writeBlindReview({directory:path.join(directory,'public'),cases,records:slots});
  const summary={...ledger.summary(),status:ledger.stopReason?'GLOBAL_STOP':'BATCH_FINISHED',attempted:records.length,mode,realApiCalls:mode==='offline_fake'?0:ledger.summary().actualHttpCalls,productionOperations:0};
  durableJson(path.join(internal,'summary.json'),summary);return {summary,records};
}
