import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdirSync,writeFileSync,readFileSync } from "node:fs";
import { randomUUID,createHash } from "node:crypto";
import { createB1Harness } from "./lib/paid-delivery-step5a1-b1-harness.mjs";
import { verify0036AuthBoundaries } from "./lib/paid-delivery-step5a1-0036-auth.mjs";
import { create0036MessageFixture } from "./lib/paid-delivery-step5a1-0036-message-fixture.mjs";
import { create0036GenericFixture } from "./lib/paid-delivery-step5a1-0036-generic-fixture.mjs";
import { createPaidDeliveryStep4Fixture } from "./lib/paid-delivery-step4-fixtures.mjs";
import { sqlLiteral as lit } from "./lib/paid-delivery-step4-harness.mjs";
import { PaidRecoveryOperatorApplication } from "../lib/payment/production/paid-recovery-operator.ts";
import { readPrepaymentComputePolicy } from "../lib/assessment/production/prepayment-compute-policy.ts";

const directory=`evals/paid-delivery-step5a1-0036/integration/${randomUUID()}`;
mkdirSync(directory,{recursive:true});
const git=(...args)=>execFileSync("git",args,{encoding:"utf8",windowsHide:true}).trim();
function sources(){const names=[...new Set([...git("ls-files","lib","scripts","supabase/migrations").split(/\r?\n/u),...git("ls-files","--others","--exclude-standard","--","lib","scripts","supabase/migrations").split(/\r?\n/u)])].filter(Boolean).sort();return Object.fromEntries(names.map(name=>[name,createHash("sha256").update(readFileSync(name)).digest("hex")]));}
const sourceHead=git("rev-parse","HEAD"),sourceBefore=sources(),startedAt=new Date().toISOString(),h=await createB1Harness({requireNewContract:"v19-l5"}),results=[];
const filter=process.argv.find(arg=>arg.startsWith("--case="))?.slice(7);
const selected=id=>!filter||filter.split(",").includes(id);
async function snapshot(run,purchase){const row=await h.snapshot(run,purchase,{observeCustomer:true});if(row.publicStatus)row.publicStatus={status:row.publicStatus.status,paymentVerified:row.publicStatus.paymentVerified};if(row.account)row.account={available:row.account.available,deliveryId:row.account.deliveryId};return row;}
function immutable(before,after){for(const key of["jobId","purchaseIntentId","verifiedPaymentId","inputHash","authorityHash","authorityVersion"])assert.equal(after[key],before[key],key);for(const key of["grantId","logicalAssessmentId","canonicalHash"])if(before[key])assert.equal(after[key],before[key],key);assert.equal(after.deliveryCount,1);assert.equal(after.purchaseCount,1);assert.equal(after.grantCount,1);assert.equal(after.accountAvailable,true);assert.equal(after.publicStatus.status,"completed");assert.deepEqual(after.notifications,["sent"]);assert.equal(after.notificationRows.length,1);assert.ok(after.runtimeRunContracts.every(row=>row.promptBundleVersion===after.authorityVersion));}
function financial(runs,expectedPurchases=1){const checkoutRequests=runs.reduce((n,r)=>n+r.checkoutProvider.requests.length,0),notifications=runs.flatMap(r=>r.notificationInvocations),accepted=notifications.filter(n=>n.status==="accepted");assert.equal(checkoutRequests,expectedPurchases);assert.equal(accepted.length,expectedPurchases);assert.equal(new Set(notifications.map(n=>n.idempotencyKey)).size,expectedPurchases);assert.equal(new Set(notifications.map(n=>n.payloadHash)).size,expectedPurchases);return{expectedPurchases,checkoutRequests,additionalCharges:0,acceptedEmails:accepted.length,notificationAttempts:notifications.length,idempotencyKeys:notifications.map(n=>n.idempotencyKey),payloadHashes:notifications.map(n=>n.payloadHash)};}
async function dispatch(run,p){const event=await h.dispatch(run,p.jobId);assert.ok(event);return event;}
async function due(run,p,seconds=1000){const inspected=await run.recoveryRepository.inspect(p.jobId);const until=inspected.next_attempt_at?Math.ceil((Date.parse(inspected.next_attempt_at)-Date.parse(run.now()))/1000)+1:0;const events=await h.scheduler(run,{advanceSeconds:Math.max(seconds,until)});const event=events.find(e=>e.jobId===p.jobId);assert.ok(event,"real scheduler rediscovers same purchase");return event;}
async function complete(run,p,event){const result=await h.consume(run,event);assert.equal(result.workerOutcome?.status,"completed",JSON.stringify(result));const after=await snapshot(run,p);assert.equal(after.state,"completed");return{after,event:result};}
async function duplicates(run,p,before,event){const wires=run.sdk.wires.length,emails=run.notificationInvocations.length;const duplicate=await run.payment.verifyStripeEvidence(p.evidence,false);assert.equal(duplicate.fulfillmentJobId,p.jobId);await h.consume(run,event,{attempt:1});const after=await snapshot(run,p);immutable(before,after);assert.equal(after.canonicalHash,before.canonicalHash);assert.equal(run.sdk.wires.length,wires);assert.equal(run.notificationInvocations.length,emails);return{after,providerAdditionalCalls:0,additionalEmailAttempts:0,paymentReplayDisposition:duplicate.disposition};}
async function scenario(id,operation){if(!selected(id))return;await h.reset();const releases=[];try{const evidence=await operation(releases);if(evidence.additionalCharges!==undefined)assert.equal(evidence.additionalCharges,0);results.push({case:id,status:"PASS",...evidence});writeFileSync(`${directory}/${id}.json`,JSON.stringify(results.at(-1),null,2)+"\n");console.log(JSON.stringify({case:id,status:"PASS"}));}finally{for(const release of releases)release();}}

try{
  assert.match(h.db.sql("select pg_get_functiondef('public.finalize_purchase_ready_assessment_v1(uuid,uuid,text,jsonb,bigint,bigint,bigint,bigint,numeric,timestamp with time zone)'::regprocedure);"),/prompt-bundle-runtime-v23\.0\.0/u);
  assert.match(h.db.sql("select pg_get_constraintdef(oid) from pg_constraint where conname='assessment_clarifications_target';"),/original_message/u);
  if(selected("auth"))results.push({case:"auth",status:"PASS",boundaries:await verify0036AuthBoundaries(h)});
  await scenario("happy",async()=>{
    const run=await h.createFactoryRun(),p=await run.seedVerifiedPurchase(),before=await h.snapshot(run,p);
    assert.equal(run.factoryEvidence.synthetic,false);assert.equal(run.factoryEvidence.newPurchaseContract,"v19-l5");
    assert.equal(before.authorityVersion,"prompt-bundle-runtime-v23.0.0");
    assert.deepEqual(run.sdk.wires.map(w=>w.stageId),["PB-01","PB-02","PB-03"]);
    const e=await dispatch(run,p),done=await complete(run,p,e);immutable(before,done.after);
    assert.ok(done.after.runtimeRunContracts.every(r=>r.schemaSetVersion==="pipeline-schema-runtime-v9.0.0"));
    assert.equal(run.sdk.wires.length,6);
    return{factory:run.factoryEvidence,before,...done,duplicates:await duplicates(run,p,done.after,e),wire:run.sdk.wires,financial:financial([run])};
  });
  await scenario("narrow-repair",async()=>{
    const run=await h.createFactoryRun({mode:"repairable"}),p=await run.seedVerifiedPurchase(),before=await h.snapshot(run,p),e=await dispatch(run,p),done=await complete(run,p,e);immutable(before,done.after);
    assert.equal(done.after.repairCount,1);assert.equal(done.after.revalidationCount,1);assert.equal(run.sdk.wires.filter(w=>w.repair).length,1);assert.equal(run.sdk.wires.filter(w=>w.revalidation).length,1);
    return{factory:run.factoryEvidence,before,...done,duplicates:await duplicates(run,p,done.after,e),wire:run.sdk.wires,financial:financial([run])};
  });
  await scenario("schema-corrected",async()=>{
    const run=await h.createFactoryRun(),p=await run.seedVerifiedPurchase(),before=await h.snapshot(run,p);run.sdk.setConfigurationValid(false);
    const e=await dispatch(run,p),first=await h.consume(run,e),blocked=await snapshot(run,p);assert.equal(blocked.state,"manual_review");
    const calls=run.sdk.wires.length;await h.consume(run,e,{attempt:1});assert.equal((await h.scheduler(run,{advanceSeconds:900})).length,0);assert.equal(run.sdk.wires.length,calls);
    run.sdk.setConfigurationValid(true);const inspected=await run.recoveryRepository.inspect(p.jobId);
    await new PaidRecoveryOperatorApplication(run.recoveryRepository,run.now).resume({jobId:p.jobId,expectedReasonCode:inspected.reason_code,operatorReference:"B1-0036-local-schema-corrected",configurationValidated:true});
    const done=await complete(run,p,await due(run,p,2));immutable(before,done.after);
    return{factory:run.factoryEvidence,before,blocked,first,...done,wire:run.sdk.wires,financial:financial([run])};
  });
  await scenario("old-v17-recovery-new-v19",async()=>{
    const old=await h.createRun({contract:"v17"}),p=await old.seedVerifiedPurchase(),before=await h.snapshot(old,p),e=await dispatch(old,p);
    const killed=await h.killWorker(old,p.jobId,{pauseAt:"checkpoint",event:e}),interrupted=await h.snapshot(old,p);old.advance(1000);
    const selected=createPaidDeliveryStep4Fixture(),v17=new Set(old.catalog.definitions.map(d=>d.promptHash));
    const next=await h.createFactoryRun({now:old.now(),delegate:{invoke:q=>v17.has(q.promptHash)?old.transport.invoke(q):selected.transport.invoke(q)}});
    const done=await complete(next,p,await due(next,p,2));immutable(before,done.after);assert.equal(done.after.authorityVersion,"prompt-bundle-runtime-v17.0.0");
    assert.ok(done.after.runtimeRunContracts.every(r=>r.schemaSetVersion==="pipeline-schema-runtime-v6.0.0"));
    const newer=await next.seedVerifiedPurchase(),newBefore=await h.snapshot(next,newer),newDone=await complete(next,newer,await dispatch(next,newer));immutable(newBefore,newDone.after);assert.equal(newDone.after.authorityVersion,"prompt-bundle-runtime-v23.0.0");
    return{factory:next.factoryEvidence,historicalFixtureSynthetic:true,newAndRecoveryFactorySynthetic:false,before,interrupted,killed,...done,newPurchase:{before:newBefore,...newDone},wire:next.sdk.wires,financial:financial([old,next],2)};
  });
  await scenario("old-new-worker-race",async releases=>{
    const old=await h.createFactoryRun(),p=await old.seedVerifiedPurchase(),before=await h.snapshot(old,p),e=await dispatch(old,p);
    let reached,release;const boundary=new Promise(r=>reached=r),gate=new Promise(r=>release=r);releases.push(release);
    old.sdk.setBeforeProvider(async request=>{if(request.stageId==="PB-06"){reached();await gate;}});
    const pending=h.consume(old,e);await boundary;const held=await h.snapshot(old,p);old.advance(1000);
    const next=await h.createFactoryRun({now:old.now()}),done=await complete(next,p,await due(next,p,2));immutable(before,done.after);
    release();const late=await pending,after=await snapshot(next,p);immutable(done.after,after);assert.equal(after.canonicalRunId,done.after.canonicalRunId);
    return{before,held,...done,late,after,factories:[old.factoryEvidence,next.factoryEvidence],wires:[...old.sdk.wires,...next.sdk.wires],financial:financial([old,next])};
  });
  await scenario("original-provided",async()=>{
    const fixture=create0036MessageFixture(),run=await h.createFactoryRun({fixture}),p=await run.seedVerifiedPurchase(),before=await h.snapshot(run,p),e=await dispatch(run,p),done=await complete(run,p,e);immutable(before,done.after);
    const projection=JSON.parse(h.db.sql(`select experience_projection_json::text from public.production_customer_deliveries where logical_assessment_id=${lit(done.after.logicalAssessmentId)};`));
    assert.ok(JSON.stringify(projection).includes(fixture.originalMessage));
    return{factory:run.factoryEvidence,provenance:fixture.provenance,before,...done,projection,duplicates:await duplicates(run,p,done.after,e),wire:run.sdk.wires,financial:financial([run])};
  });
  await scenario("original-clarification-restart",async()=>{
    const fixture=create0036MessageFixture({missingOriginal:true}),initial=await h.createFactoryRun({fixture}),begun=await initial.begin(),binding=await initial.bind(begun),question=await initial.execute(binding);
    assert.equal(question.status,"needs_one_clarifying_answer");assert.ok(question.clarificationCapability);assert.deepEqual(initial.sdk.wires.map(w=>w.stageId),["PB-01","PB-02","PB-03"]);
    assert.equal(question.target,"original_message");assert.equal(question.maximumQuestionsTotal,1);
    const requestBefore=h.db.sql("select row_to_json(r)::text from public.assessment_requests r;");
    const next=await h.createFactoryRun({fixture,now:initial.now()});
    await assert.rejects(next.call("answerClarification",question.clarificationCapability,{original_message:fixture.originalMessage}));
    await assert.rejects(next.call("answerClarification",question.clarificationCapability,{original_message:fixture.originalMessage},{customerUserId:randomUUID(),policy:readPrepaymentComputePolicy()}));
    assert.equal(next.sdk.wires.length,0);
    const prepared=await next.call("answerClarification",question.clarificationCapability,{original_message:fixture.originalMessage},{customerUserId:binding.customerUserId,policy:readPrepaymentComputePolicy()});assert.equal(prepared.status,"purchase_ready");
    const callsAfterAnswer=next.sdk.wires.length;
    const replay=await next.call("answerClarification",question.clarificationCapability,{original_message:fixture.originalMessage},{customerUserId:binding.customerUserId,policy:readPrepaymentComputePolicy()});assert.equal(replay.status,"purchase_ready");assert.equal(next.sdk.wires.length,callsAfterAnswer);
    await assert.rejects(next.call("answerClarification",question.clarificationCapability,{original_message:"異なる二つ目の原文"},{customerUserId:binding.customerUserId,policy:readPrepaymentComputePolicy()}));
    assert.equal(next.sdk.wires.filter(w=>w.stageId==="PB-01").length,0);assert.ok(next.sdk.wires.every(w=>!["PB-04","PB-05","PB-06"].includes(w.stageId)));
    const persisted=JSON.parse(h.db.sql("select jsonb_build_object('clarification',to_jsonb(c),'originalInput',r.optional_message,'rawSituation',r.raw_situation) from public.assessment_clarifications c join public.assessment_requests r on r.id=c.request_id;"));
    assert.equal(persisted.originalInput,null);assert.equal(persisted.rawSituation,fixture.request.currentSituation);assert.equal(persisted.clarification.target,"original_message");assert.equal(persisted.clarification.answer_status,"answered");
    const persistedAuthority=JSON.parse(h.db.sql("select purchase_ready_authority_json::text from public.production_preparations;"));
    const p=await next.purchasePrepared(replay,binding),before=await h.snapshot(next,p),e=await dispatch(next,p);
    let injected=0;h.rest.fault.before=call=>{if(call.name==="complete_production_fulfillment_v3"&&injected++===0)throw new Error("SYNTHETIC_CANONICAL_COMMIT_TRANSPORT_OUTAGE");};
    let interrupted;try{interrupted=await h.consume(next,e);}finally{h.rest.fault.before=null;}
    const reportSaved=await h.snapshot(next,p);assert.equal(reportSaved.deliveryCount,0);assert.equal(reportSaved.reportCount,1);
    const recovered=await h.createFactoryRun({fixture,now:next.now()}),done=await complete(recovered,p,await due(recovered,p,1000));immutable(before,done.after);assert.equal(recovered.sdk.wires.length,0);
    assert.deepEqual(JSON.parse(h.db.sql("select purchase_ready_authority_json::text from public.production_preparations;")),persistedAuthority);
    const callsAfterDelivery=next.sdk.wires.length;
    await assert.rejects(next.call("answerClarification",question.clarificationCapability,{original_message:fixture.originalMessage},{customerUserId:binding.customerUserId,policy:readPrepaymentComputePolicy()}),error=>error.safeCode==="PRODUCTION_PREPARATION_IN_PROGRESS");assert.equal(next.sdk.wires.length,callsAfterDelivery);
    const duplicate=await duplicates(recovered,p,done.after,e);
    return{factories:[initial.factoryEvidence,next.factoryEvidence,recovered.factoryEvidence],provenance:fixture.provenance,question:{status:question.status,target:question.target,question:question.question,maximumQuestionsTotal:question.maximumQuestionsTotal},initialRequestSha256:createHash("sha256").update(requestBefore).digest("hex"),persisted,persistedAuthority,before,interrupted,reportSaved,...done,recoveryAdditionalProviderCalls:recovered.sdk.wires.length,duplicates:duplicate,wire:[...initial.sdk.wires,...next.sdk.wires],financial:financial([initial,next,recovered])};
  });
  await scenario("generic-clarification-restart",async()=>{
    const fixture=create0036GenericFixture(),initial=await h.createFactoryRun({fixture}),binding=await initial.bind(await initial.begin()),question=await initial.execute(binding);
    assert.equal(question.status,"needs_one_clarifying_answer");assert.equal(question.target,"material_relationship_or_communication_concern");assert.equal(question.maximumQuestionsTotal,1);
    const initialInput=h.db.sql("select jsonb_build_object('situation',raw_situation,'message',optional_message,'relationship',relationship,'topics',requested_topics)::text from public.assessment_requests;");
    const next=await h.createFactoryRun({fixture,now:initial.now()}),prepared=await next.call("answerClarification",question.clarificationCapability,fixture.answer,{customerUserId:binding.customerUserId,policy:readPrepaymentComputePolicy()});assert.equal(prepared.status,"purchase_ready");
    assert.deepEqual(next.sdk.wires.map(w=>w.stageId),["PB-01"]);
    const resumedAuthority=JSON.parse(h.db.sql("select purchase_ready_authority_json::text from public.production_preparations;"));
    const afterAnswer=next.sdk.wires.length;
    const replay=await next.call("answerClarification",question.clarificationCapability,fixture.answer,{customerUserId:binding.customerUserId,policy:readPrepaymentComputePolicy()});assert.equal(replay.status,"purchase_ready");assert.equal(next.sdk.wires.length,afterAnswer);
    const p=await next.purchasePrepared(replay,binding),before=await h.snapshot(next,p),e=await dispatch(next,p);
    let injected=0;h.rest.fault.before=call=>{if(call.name==="complete_production_fulfillment_v3"&&injected++===0)throw new Error("SYNTHETIC_GENERIC_COMMIT_TRANSPORT_OUTAGE");};
    let interrupted;try{interrupted=await h.consume(next,e);}finally{h.rest.fault.before=null;}
    const reportSaved=await h.snapshot(next,p);assert.equal(reportSaved.deliveryCount,0);assert.equal(reportSaved.reportCount,1);
    const recovered=await h.createFactoryRun({fixture,now:next.now()}),done=await complete(recovered,p,await due(recovered,p,1000));immutable(before,done.after);assert.equal(recovered.sdk.wires.length,0);
    assert.equal(h.db.sql("select jsonb_build_object('situation',raw_situation,'message',optional_message,'relationship',relationship,'topics',requested_topics)::text from public.assessment_requests;"),initialInput);
    assert.deepEqual(JSON.parse(h.db.sql("select purchase_ready_authority_json::text from public.production_preparations;")),resumedAuthority);
    assert.equal(Number(h.db.sql("select count(*) from public.assessment_clarifications;")),1);
    const paidRequests=fixture.requests.filter(q=>["PB-04","PB-05","PB-06"].includes(q.stageId));
    assert.deepEqual(paidRequests.map(q=>({stageId:q.stageId,paths:q.input.clarification_consumption_contract.consumed_effective_paths})),[
      {stageId:"PB-04",paths:[]},
      {stageId:"PB-05",paths:["effectiveDecisionContext.materialConcern","effectiveEmotionalContext.materialConcern"]},
      {stageId:"PB-06",paths:["effectiveDecisionContext.materialConcern","effectiveEmotionalContext.materialConcern"]},
    ],"retain the existing stage-specific clarification consumption contract");
    return{factories:[initial.factoryEvidence,next.factoryEvidence,recovered.factoryEvidence],question:{status:question.status,target:question.target,maximumQuestionsTotal:question.maximumQuestionsTotal},provenance:fixture.provenance,resumedAuthority,before,interrupted,reportSaved,...done,recoveryAdditionalProviderCalls:0,consumedPaths:paidRequests.map(q=>({stageId:q.stageId,paths:q.input.clarification_consumption_contract.consumed_effective_paths})),wire:[...initial.sdk.wires,...next.sdk.wires],financial:financial([initial,next,recovered])};
  });
  const sourceAfter=sources();assert.deepEqual(sourceAfter,sourceBefore,"source changed during integration run");
  const receipt={status:"PASS",sourceHead,startedAt,completedAt:new Date().toISOString(),sourceStableDuringRun:true,sourceHashes:sourceBefore,total:results.length,filter:filter??null,results,externalOperations:{openAiCalls:0,stripeCalls:0,emailCalls:0,productionRead:0,productionWrite:0},boundaries:{productionFactory:"actual no options",provider:"actual OpenAI transport and SDK; fetch fake",database:"isolated PostgreSQL actual SQL and service-role HTTP adapter",dispatch:"actual dispatch, event consumer, worker application and recovery scheduler",historicalV17:"synthetic historical fixture only; actual factory recovery"}};
  writeFileSync(`${directory}/receipt.json`,JSON.stringify(receipt,null,2)+"\n");console.log(JSON.stringify({status:"PASS",total:results.length,receipt:`${directory}/receipt.json`}));
}catch(error){writeFileSync(`${directory}/failure.json`,JSON.stringify({status:"FAIL",sourceHead,error:error.stack,completed:results.map(r=>r.case),databaseError:h.rest.failures.at(-1),stageWrites:h.rest.calls.filter(c=>c.name==="assessment_stage_runs"&&c.method==="POST").slice(-16).map(c=>({stageId:c.payload.stage_id,status:c.payload.status,skipReason:c.payload.skip_reason,runId:c.payload.run_id}))},null,2)+"\n");throw error;}finally{await h.stop();}
