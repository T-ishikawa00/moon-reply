// Offline request capture only. No Provider, account, key, network or database.
import { isDeepStrictEqual } from 'node:util';
import { V19L5LocalApplication } from '../../../lib/assessment/runtime/v19-l5-application.ts';
import { projectV19L5Message } from '../../../lib/assessment/runtime/v19-l5-customer-projection.ts';
import { hashJson } from '../../../lib/assessment/runtime/hash.ts';
import { M2RuntimeError } from '../../../lib/assessment/runtime/errors.ts';
import { captureNext as captureBaseline } from '../../guidance-quality-v19-l4/expanded-12/adapter.mjs';
export const CAPTURE = 'FINAL_QA_NEXT_REQUEST_CAPTURED';
const check=(ok,code)=>{if(!ok)throw new M2RuntimeError(code);};

export async function captureNext({catalog,input,responses=[],now,sessionId}) {
  if(catalog.catalogVersion==='runtime-stage-catalog-v17.0.0') return captureBaseline({catalog,input,responses,now,sessionId});
  check(catalog.catalogVersion==='runtime-stage-catalog-v23.0.0','MODEL_VERSION_MISMATCH');
  let cursor=0,captured=null;
  const requests=[],counts={},before=hashJson({input,responses});
  const transport={async invoke(request){
    check(!captured,'RUNNER_INVOKED_AFTER_CAPTURE');
    const attempt=(counts[request.stageId]??0)+1;counts[request.stageId]=attempt;
    const normal=catalog.definitions.find(d=>d.stageId===request.stageId);
    const patch=request.schemaVersion==='report-fact-repair-v1';
    const definition=patch?{...normal,...normal.reportFactRepair}:normal;
    check(definition&&request.model==='gpt-5.6-luna'&&['promptVersion','promptHash','schemaName','schemaVersion','schemaHash','developerPrompt'].every(k=>request[k]===definition[k])&&isDeepStrictEqual(request.outputSchema,definition.outputSchema),'RUNTIME_CONTRACT_IDENTITY_MISMATCH');
    check(attempt<=((request.stageId==='PB-05'||request.stageId==='PB-06')?2:1),'RUNNER_UNAUTHORIZED_ATTEMPT');
    if(attempt===2)check(request.input.report_fact_repair_context&&request.input.quality_reassessment_directive===null,'RUNNER_NARROW_CONTEXT_INVALID');
    requests.push({stageId:request.stageId,attempt,inputHash:hashJson(request.input),request:structuredClone(request)});
    if(cursor===responses.length){captured={request:structuredClone(request),attempt};throw new M2RuntimeError(CAPTURE);}
    const receipt=responses[cursor++];
    check(receipt.stageId===request.stageId&&receipt.attempt===attempt,'RUNNER_RECEIPT_SEQUENCE_MISMATCH');
    return {responseId:`offline-replay-${cursor}`,returnedModel:'gpt-5.6-luna',output:structuredClone(receipt.output),latencyMs:0,usage:{inputTokens:0,cachedTokens:0,outputTokens:0,reasoningTokens:0}};
  }};
  const result=await new V19L5LocalApplication({catalog,transport,now:()=>now,timeZone:'Asia/Tokyo'}).submit(structuredClone(input));
  check(hashJson({input,responses})===before,'RUNNER_INPUT_MUTATED');
  if(captured)check(result.stopFinding===CAPTURE&&cursor===responses.length,'RUNNER_CAPTURE_INVALID');
  else check(cursor===responses.length,'RUNNER_UNUSED_RESPONSE');
  return {...(captured??{request:null,attempt:null}),result:captured?null:result,errorCode:captured?null:result.stopFinding,
    evidence:{requests,localResult:result,fakeProviderCalls:0,actualDatabaseCalls:0,usageNotice:'Replay usage is zero. Actual usage/cost belongs to the separately authorized reservation ledger.'}};
}

export function publicSlot({caseId,anonymousVariantId,result}) {
  if(result.schemaVersion!=='v19-l5-local-result-v1') throw Error('FINAL_QA_RESULT_INVALID');
  return {caseId,anonymousVariantId,finalState:result.finalState,finalOutput:
    result.finalState==='completed'?(result.answerMode==='message_only'?{eligibility:'ready',messageProjection:projectV19L5Message(result)}:{...result.decisionResult,duplicate:false}):
    result.finalState==='clarification'?{clarification:{question:result.clarification.question}}:null};
}
