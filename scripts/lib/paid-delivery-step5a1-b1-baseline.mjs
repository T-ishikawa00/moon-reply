import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { fixture, consultationFor } from "./paid-recovery-fixtures.mjs";
import { sqlLiteral as lit } from "./paid-delivery-step4-harness.mjs";
import { readPrepaymentComputePolicy } from "../../lib/assessment/production/prepayment-compute-policy.ts";

export async function verifyB1BaselineBoundaries(h) {
  const results=[];
  const make=async()=>{
    await h.reset();
    const legacy=await h.createRun({contract:"v17"});
    return h.createFactoryRun({delegate:legacy.transport,consultation:consultationFor(fixture("polite_thank_you_with_draft"))});
  };
  const run=await make(),begun=await run.begin();
  assert.equal(begun.status,"authentication_required");assert.equal(run.sdk.wires.length,0);
  await assert.rejects(run.call("prepare",run.consultation,randomUUID(),true),error=>error.safeCode==="PRODUCTION_CANDIDATE_SELECTION_NOT_AUTHORIZED");
  await assert.rejects(run.call("issueAssessmentGrant",{schemaVersion:"rc1-verified-purchase-authority-v1",verificationSource:"rc1_test_fake"}),error=>error.safeCode==="PRODUCTION_VERIFIED_PURCHASE_REQUIRED");
  const binding=await run.bind(begun);
  assert.equal(await run.execute({...binding,customerUserId:randomUUID()}),null);
  assert.equal(await run.execute({...binding,continuationTokenHash:"0".repeat(64)}),null);
  assert.equal(run.sdk.wires.length,0);
  await assert.rejects(run.call("beginProviderFreePreparation",{...run.consultation,adultConfirmed:false},randomUUID()),error=>error.safeCode==="PRODUCTION_ADULT_CONFIRMATION_REQUIRED");
  assert.equal(run.sdk.wires.length,0);
  results.push({case:"authentication-synthetic-safety-boundaries",status:"PASS",anonymousOutcome:begun.status,wrongCustomer:null,wrongContinuation:null,safetyError:"PRODUCTION_ADULT_CONFIRMATION_REQUIRED",providerInvocations:0});

  for(const kind of ["customer","global"]){
    const capped=await make(),bound=await capped.bind(await capped.begin());
    const old=process.env.PREPAYMENT_GLOBAL_COMPUTE_MAX_PROVIDER_INVOCATIONS;
    if(kind==="global")process.env.PREPAYMENT_GLOBAL_COMPUTE_MAX_PROVIDER_INVOCATIONS="1";
    const expected=kind==="customer"?"PREPAYMENT_COMPUTE_BUDGET_EXHAUSTED":"PREPAYMENT_GLOBAL_COMPUTE_BUDGET_EXHAUSTED";
    try{
      await assert.rejects(capped.execute(bound,{...readPrepaymentComputePolicy(),...(kind==="customer"?{maximumProviderInvocations:1}:{})}),error=>error.safeCode===expected);
      assert.equal(capped.sdk.wires.length,1);
      const budget=JSON.parse(h.db.sql("select jsonb_build_object('globalUsed',(select used_invocations from public.global_unpaid_compute_budget where pool='unpaid'),'customerUsed',(select sum(used_provider_invocation_units) from public.production_prepayment_compute_budgets),'activeSlots',(select count(*) from public.global_unpaid_compute_slots where invocation_id is not null),'deliveries',(select count(*) from public.production_customer_deliveries));"));
      assert.equal(budget.globalUsed,1);assert.equal(budget.customerUsed,1);assert.equal(budget.activeSlots,0);assert.equal(budget.deliveries,0);
      results.push({case:`${kind}-compute-cap`,status:"PASS",errorCode:expected,providerInvocations:1,wire:capped.sdk.wires,budget});
    }finally{process.env.PREPAYMENT_GLOBAL_COMPUTE_MAX_PROVIDER_INVOCATIONS=old;}
  }

  const dependency=await make(),requestId=randomUUID(),runId=randomUUID();
  await dependency.runtimeRepository.createRequest({id:requestId,idempotencyKey:randomUUID(),source:"production_fulfillment_runtime",currentSituation:dependency.consultation.currentSituation,optionalMessage:dependency.consultation.optionalMessage,relationship:dependency.consultation.relationship,requestedTopics:dependency.consultation.requestedTopics,now:dependency.now()});
  await dependency.runtimeRepository.createRun({id:runId,requestId,requestedModel:"gpt-5.6-luna",promptBundleVersion:"prompt-bundle-runtime-v23.0.0",schemaSetVersion:"pipeline-schema-runtime-v9.0.0",stageTopologyVersion:"split-base-candidate-v1",runKind:"initial",startedAt:dependency.now()});
  await assert.rejects(dependency.runtimeRepository.finalizePurchaseReadyPreparation({runId,requestId,returnedModel:"gpt-5.6-luna",policyResult:{},totalInputTokens:0,totalCachedTokens:0,totalOutputTokens:0,totalReasoningTokens:0,usageDerivedCostUsd:0,completedAt:dependency.now()}));
  const raw=h.rest.failures.at(-1);assert.match(raw.name,/finalize_purchase_ready_assessment_v1/u);assert.match(raw.message,/M2_PREPARATION_FINALIZATION_CONFLICT/u);
  assert.equal(h.db.sql(`select status from public.assessment_runs where id=${lit(runId)};`).trim(),"processing");
  results.push({case:"v23-ready-finalization-dependency",status:"EXPECTED_B1_DEPENDENCY_FAILURE_REPRODUCED",rpc:"finalize_purchase_ready_assessment_v1",databaseError:"M2_PREPARATION_FINALIZATION_CONFLICT",providerInvocations:0,runState:"processing"});
  const clarificationId=randomUUID().replaceAll("-","");
  const insertion=target=>`insert into public.assessment_clarifications(schema_version,id,request_id,ordinal,question_code,target,question_snapshot,provenance,source_identity,answer_status,created_at) values('m2-p4-assessment-clarification-v1',${lit(clarificationId)},${lit(requestId)},1,'synthetic_original_message',${lit(target)},'synthetic clarification','user_clarification',${lit(`clarification:${clarificationId}:answer:1`)},'pending',${lit(dependency.now())});`;
  h.db.sql(`begin; ${insertion("requested_message_tone")} rollback;`);
  assert.throws(()=>h.db.sql(insertion("original_message")),error=>/assessment_clarifications_target/u.test(error.message));
  assert.equal(Number(h.db.sql("select count(*) from public.assessment_clarifications;")),0);
  results.push({case:"original-message-clarification-dependency",status:"EXPECTED_B1_DEPENDENCY_FAILURE_REPRODUCED",positiveControlTarget:"requested_message_tone",rejectedTarget:"original_message",databaseConstraint:"assessment_clarifications_target",persistedRows:0,providerInvocations:0});
  return results;
}
