import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readPrepaymentComputePolicy } from "../../lib/assessment/production/prepayment-compute-policy.ts";
import { createPaidDeliveryStep4Fixture } from "./paid-delivery-step4-fixtures.mjs";

export async function verify0036AuthBoundaries(h){
  const results=[];
  await h.reset();const run=await h.createFactoryRun(),begun=await run.begin();
  assert.equal(begun.status,"authentication_required");assert.equal(run.sdk.wires.length,0);
  await assert.rejects(run.call("prepare",run.consultation,randomUUID(),true),e=>e.safeCode==="PRODUCTION_CANDIDATE_SELECTION_NOT_AUTHORIZED");
  await assert.rejects(run.call("prepare",run.consultation,randomUUID()),e=>e.safeCode==="PREPAYMENT_COMPUTE_AUTHORIZATION_REQUIRED");
  await assert.rejects(run.call("issueAssessmentGrant",{schemaVersion:"rc1-verified-purchase-authority-v1",verificationSource:"rc1_test_fake"}),e=>e.safeCode==="PRODUCTION_VERIFIED_PURCHASE_REQUIRED");
  const binding=await run.bind(begun);
  assert.equal(await run.execute({...binding,customerUserId:randomUUID()}),null);
  assert.equal(await run.execute({...binding,continuationTokenHash:"0".repeat(64)}),null);
  await assert.rejects(run.call("beginProviderFreePreparation",{...run.consultation,adultConfirmed:false},randomUUID()),e=>e.safeCode==="PRODUCTION_ADULT_CONFIRMATION_REQUIRED");
  assert.equal(run.sdk.wires.length,0);
  results.push({case:"anonymous-synthetic-ownership-safety",status:"PASS",factory:run.factoryEvidence,anonymousOutcome:begun.status,wrongCustomer:null,wrongContinuation:null,providerInvocations:0});
  for(const kind of["customer","global"]){
    await h.reset();const capped=await h.createFactoryRun(),bound=await capped.bind(await capped.begin());
    const previous=process.env.PREPAYMENT_GLOBAL_COMPUTE_MAX_PROVIDER_INVOCATIONS;
    if(kind==="global")process.env.PREPAYMENT_GLOBAL_COMPUTE_MAX_PROVIDER_INVOCATIONS="1";
    const code=kind==="customer"?"PREPAYMENT_COMPUTE_BUDGET_EXHAUSTED":"PREPAYMENT_GLOBAL_COMPUTE_BUDGET_EXHAUSTED";
    try{
      await assert.rejects(capped.execute(bound,{...readPrepaymentComputePolicy(),...(kind==="customer"?{maximumProviderInvocations:1}:{})}),e=>e.safeCode===code);
      assert.equal(capped.sdk.wires.length,1);
      const budget=JSON.parse(h.db.sql("select jsonb_build_object('globalUsed',(select used_invocations from public.global_unpaid_compute_budget where pool='unpaid'),'customerUsed',(select sum(used_provider_invocation_units) from public.production_prepayment_compute_budgets),'activeSlots',(select count(*) from public.global_unpaid_compute_slots where invocation_id is not null),'deliveries',(select count(*) from public.production_customer_deliveries));"));
      assert.equal(budget.globalUsed,1);assert.equal(budget.customerUsed,1);assert.equal(budget.activeSlots,0);assert.equal(budget.deliveries,0);
      results.push({case:`${kind}-compute-cap`,status:"PASS",errorCode:code,budget,wire:capped.sdk.wires});
    }finally{process.env.PREPAYMENT_GLOBAL_COMPUTE_MAX_PROVIDER_INVOCATIONS=previous;}
  }
  for(const outcome of["returned-invalid-schema","unknown-response"]){
    await h.reset();const fixture=createPaidDeliveryStep4Fixture();
    const run=await h.createFactoryRun({delegate:{async invoke(request){if(outcome==="unknown-response")throw new Error("SYNTHETIC_PROVIDER_CONNECTION_CLOSED");return{...await fixture.transport.invoke(request),output:{}};}}});
    const binding=await run.bind(await run.begin());let errorCode;
    await assert.rejects(run.execute(binding),error=>{errorCode=error.safeCode;return typeof errorCode==="string";});
    assert.equal(run.sdk.wires.length,1,"SDK must not add unbudgeted retries");
    const state=JSON.parse(h.db.sql("select jsonb_build_object('globalUsed',(select used_invocations from public.global_unpaid_compute_budget where pool='unpaid'),'customerUsed',(select sum(used_provider_invocation_units) from public.production_prepayment_compute_budgets),'activeSlots',(select count(*) from public.global_unpaid_compute_slots where invocation_id is not null),'boundedSlots',(select count(*) from public.global_unpaid_compute_slots where invocation_id is not null and lease_expires_at>clock_timestamp()),'purchases',(select count(*) from public.production_purchases),'deliveries',(select count(*) from public.production_customer_deliveries));"));
    assert.equal(state.globalUsed,1);assert.equal(state.customerUsed,1);assert.equal(state.purchases,0);assert.equal(state.deliveries,0);
    assert.equal(state.activeSlots,outcome==="unknown-response"?1:0);assert.equal(state.boundedSlots,state.activeSlots);
    assert.equal(run.sdk.wires[0].responseReceived,outcome!=="unknown-response");
    results.push({case:outcome,status:"PASS",errorCode,state,wire:run.sdk.wires});
  }
  return results;
}
