import assert from "node:assert/strict";
import { AsyncLocalStorage } from "node:async_hooks";
import { randomUUID } from "node:crypto";
import { createStep4Harness, sqlLiteral as lit } from "./paid-delivery-step4-harness.mjs";
import { createPaidDeliveryStep4Fixture } from "./paid-delivery-step4-fixtures.mjs";
import { fixture, consultationFor } from "./paid-recovery-fixtures.mjs";
import { createProductionAssessmentApplication } from "../../lib/assessment/production/application-runtime.ts";
import { ProductionPaymentDeliveryApplication } from "../../lib/payment/production/application.ts";
import { VerifiedEmailResultNotificationAdapterV1 } from "../../lib/payment/production/result-notification.ts";
import { readPrepaymentComputePolicy } from "../../lib/assessment/production/prepayment-compute-policy.ts";
import { OpenAiResponsesTransport } from "../../lib/assessment/runtime/openai-transport.ts";
import { toOpenAiStructuredOutputSchema } from "../../lib/assessment/runtime/openai-schema.ts";
import { normalizeProviderSchema } from "../../lib/assessment/runtime/openai-schema-normalization.mjs";
import { hashJson } from "../../lib/assessment/runtime/hash.ts";
const { CustomerIdentityAuthApplicationV1 } = await import("../../lib/customer-auth/application.ts");
const { hashCustomerAuthContinuation } = await import("../../lib/customer-auth/crypto.ts");

const NativeDate = Date, clock = new AsyncLocalStorage();
globalThis.Date = class extends NativeDate {
  constructor(...args) { super(...(args.length ? args : [clock.getStore()?.() ?? NativeDate.now()])); }
  static now() { return clock.getStore() ? NativeDate.parse(clock.getStore()()) : NativeDate.now(); }
};
const withClock = (run, operation) => clock.run(run.now, operation);

function validateWire(schema) {
  let nestedDefinitions = 0, invalidReferences = 0;
  function visit(value, depth = 0) {
    if (value === null || typeof value !== "object") return;
    if (depth && Object.hasOwn(value,"$defs")) nestedDefinitions++;
    if (Object.hasOwn(value,"$ref")) {
      const reference = value.$ref; let target = schema;
      if (reference !== "#" && !reference.startsWith("#/")) invalidReferences++;
      else if (reference !== "#") for (const part of reference.slice(2).split("/")) {
        const key = part.replaceAll("~1","/").replaceAll("~0","~");
        if (!target || !Object.hasOwn(target,key)) { invalidReferences++; break; }
        target = target[key];
      }
    }
    for (const child of Object.values(value)) visit(child,depth+1);
  }
  visit(schema); assert.equal(nestedDefinitions,0); assert.equal(invalidReferences,0);
  return { nestedDefinitions, invalidReferences };
}

// Only factory-created OpenAI SDK fetch is replaced. The original transport's
// invocation, schema normalization, SDK serialization and error mapping execute.
function attachFactorySdkBoundary(actual, delegate, run) {
  assert.ok(actual instanceof OpenAiResponsesTransport);
  const context = new AsyncLocalStorage(), invoke = actual.invoke.bind(actual), wires = [];
  let configurationValid = true;
  actual.invoke = request => context.run(request, () => invoke(request));
  actual.client.fetch = async (url, init) => {
    assert.equal(new URL(String(url)).pathname,"/v1/responses");
    const request = context.getStore(); assert.ok(request);
    const body = JSON.parse(init.body), normalized = normalizeProviderSchema(toOpenAiStructuredOutputSchema(request.outputSchema));
    assert.equal(normalized.report.proof.equal,true);
    assert.deepEqual(body.text.format.schema,normalized.schema);
    assert.deepEqual(JSON.parse(body.input[1].content[0].text),request.input);
    const wire = { ordinal:wires.length+1,stageId:request.stageId,schemaVersion:request.schemaVersion,
      promptHash:request.promptHash,canonicalSchemaHash:hashJson(request.outputSchema),wireSchemaHash:hashJson(body.text.format.schema),
      inputHash:hashJson(request.input),...validateWire(body.text.format.schema),semanticGraphEqual:true,
      repair:request.schemaVersion==="report-fact-repair-v1",revalidation:request.stageId==="PB-06"&&request.input.report_fact_repair_context!=null,
      httpStatus:configurationValid?200:400 };
    wires.push(wire);
    if (!configurationValid) return new Response(JSON.stringify({error:{message:"Synthetic B1 invalid_json_schema",type:"invalid_request_error",param:"text.format.schema",code:"invalid_json_schema"}}),
      {status:400,headers:{"content-type":"application/json","x-request-id":`b1-sdk-${wire.ordinal}`}});
    const result = await delegate.invoke(request);
    return new Response(JSON.stringify({id:result.responseId,object:"response",created_at:0,status:"completed",model:result.returnedModel,
      output:[{id:`b1-message-${wire.ordinal}`,type:"message",role:"assistant",status:"completed",content:[{type:"output_text",text:JSON.stringify(result.output),annotations:[]}]}],
      usage:{input_tokens:result.usage.inputTokens,output_tokens:result.usage.outputTokens,total_tokens:result.usage.inputTokens+result.usage.outputTokens,
        input_tokens_details:{cached_tokens:result.usage.cachedTokens},output_tokens_details:{reasoning_tokens:result.usage.reasoningTokens}}}),
      {status:200,headers:{"content-type":"application/json","x-request-id":`b1-sdk-${wire.ordinal}`}});
  };
  run.providerInvocations = wires;
  return { wires, setConfigurationValid(value) { assert.equal(typeof value,"boolean"); configurationValid=value; } };
}

export async function createB1Harness() {
  assert.match(process.env.NODE_OPTIONS ?? "",/moon-reply-offline[\s\S]*guard\.mjs/u,"Run via the existing offline wrapper");
  const h = await createStep4Harness({label:`paid-delivery-step5a1-b1-${process.pid}`,through:36});
  Object.assign(process.env,{NODE_ENV:"production",SUPABASE_URL:h.rest.url,SUPABASE_SECRET_KEY:"synthetic-local-service-role",
    ANONYMOUS_ADMISSION_IP_SOURCE:"netlify_context",ANONYMOUS_ADMISSION_WINDOW_SECONDS:"3600",ANONYMOUS_ADMISSION_MAX_REQUESTS_PER_IP:"1000",
    ANONYMOUS_ADMISSION_MAX_REQUESTS_GLOBAL:"1000",ANONYMOUS_ADMISSION_MAX_INTAKES_PER_IP:"100",ANONYMOUS_ADMISSION_MAX_INTAKES_GLOBAL:"100",
    EMAIL_VERIFICATION_SECRET_PEPPER:"b1-synthetic-anonymous-pepper-000000000000000000",
    OPENAI_API_KEY:"b1-synthetic-not-a-key",OPENAI_MODEL:"gpt-5.6-luna",ASSESSMENT_PRODUCTION_PREPARATION_ENABLED:"true",
    ASSESSMENT_PRODUCTION_RUNTIME_ENABLED:"true",ASSESSMENT_PRODUCTION_EMERGENCY_STOP:"false",CUSTOMER_AUTH_ENABLED:"true",CUSTOMER_AUTH_EMERGENCY_STOP:"false",
    PREPAYMENT_COMPUTE_BUDGET_ENABLED:"true",PREPAYMENT_COMPUTE_WINDOW_SECONDS:"3600",PREPAYMENT_COMPUTE_MAX_PROVIDER_INVOCATIONS:"20",
    PREPAYMENT_GLOBAL_COMPUTE_WINDOW_SECONDS:"3600",PREPAYMENT_GLOBAL_COMPUTE_MAX_PROVIDER_INVOCATIONS:"1000",PREPAYMENT_GLOBAL_COMPUTE_MAX_CONCURRENT:"2"});
  globalThis.Netlify={context:{ip:"127.0.0.1"}};
  const reset = h.reset;
  h.reset = async () => { await reset(); h.db.sql("insert into public.global_unpaid_compute_slots(slot_number) select generate_series(1,32);"); };
  h.createFactoryRun = async ({mode="clean",now=new NativeDate().toISOString(),delegate=null,consultation=null}={}) => {
    const selected = createPaidDeliveryStep4Fixture({mode});
    const run = await h.createRun({contract:"v17",now});
    run.consultation = consultation ?? consultationFor(fixture("polite_thank_you_with_draft"),selected.request);
    run.fixture = selected;
    // No options, localCandidate or synthetic authorization enter this factory.
    const application = await withClock(run,() => createProductionAssessmentApplication());
    assert.equal(application.options.allowSyntheticPurchaseAuthority,false);
    run.factoryEvidence={entry:"createProductionAssessmentApplication()",synthetic:false,newPurchaseContract:application.options.newPurchaseContract??null};
    run.sdk = attachFactorySdkBoundary(application.options.transport,delegate??selected.transport,run);
    run.assessment = application; run.transport = application.options.transport;
    run.runtimeRepository = application.options.runtimeRepository; run.lifecycleRepository=application.options.lifecycleRepository;
    const call = (method,...args) => withClock(run,() => application[method](...args));
    run.call = call;
    const grantProcessor={ issueProductionAssessmentGrant:authority=>call("issueAssessmentGrant",authority),
      fulfillProductionAssessmentGrant:grant=>call("fulfillAssessmentGrant",grant),
      recoverCompletedProductionAssessmentGrant:grant=>call("recoverCompletedAssessmentGrant",grant),
      async processResultNotification(reference) {
        const notification=await run.lifecycleRepository.findNotificationIdByDeliveryAuthorityReference(reference); assert.ok(notification);
        return call("processNotification",notification,new VerifiedEmailResultNotificationAdapterV1(run.paymentRepository,run.email,Buffer.alloc(32,71).toString("base64"),"https://moon-reply.test"));
      }};
    run.payment=new ProductionPaymentDeliveryApplication({...run.payment.options,grantProcessor});
    run.begin = async () => call("beginProviderFreePreparation",run.consultation,randomUUID());
    run.bind = async begun => {
      const customerUserId=randomUUID(); h.db.sql(`insert into auth.users(id,email,email_confirmed_at) values(${lit(customerUserId)},'synthetic@example.com',${lit(run.now())});`);
      const auth=new CustomerIdentityAuthApplicationV1({repository:run.customerRepository,
        provider:{async verifyEmailOtp(){return{customerUserId,verifiedEmail:"synthetic@example.com",verifiedEmailSource:"supabase_email_otp",authProviders:["email"]};}},
        environment:{continuationTtlSeconds:600,emailHashPepper:"b1-synthetic-pepper-000000000000000000000",emailEncryptionKey:Buffer.alloc(32,71).toString("base64"),emailKeyVersion:"v1"},now:run.now});
      const csrfToken=Buffer.alloc(32,23).toString("base64url");
      const continuation=await auth.createContinuation({preparationCapability:begun.preparationCapability,csrfToken,flowKind:"email_otp"});
      const ownership=await auth.verifyEmailOtp({...continuation,email:"synthetic@example.com",otp:"12345678"});
      return {customerUserId,ownership,continuationTokenHash:hashCustomerAuthContinuation(continuation.continuationToken)};
    };
    run.execute = (binding,policy=readPrepaymentComputePolicy()) => call("executeAuthenticatedPrepaymentFromContinuation",{...binding,policy});
    run.seedVerifiedPurchase=async()=>{
      const begun=await run.begin(),binding=await run.bind(begun),prepared=await run.execute(binding);
      assert.equal(prepared.status,"purchase_ready");
      const checkout=await run.payment.startAuthenticatedCheckout({preparationCapability:prepared.preparationCapability,customerUserId:binding.customerUserId});
      assert.equal(checkout.status,"checkout_ready");const request=run.checkoutProvider.requests.at(-1);
      const evidence={evidenceSource:"webhook",providerEventId:`evt_b1_${randomUUID().replaceAll("-","")}`,eventType:"checkout.session.completed",providerCreatedAt:run.now(),
        payloadSha256:"b".repeat(64),environment:"test",purchaseReference:request.purchaseReference,providerCheckoutSessionId:checkout.checkoutUrl.split("/").at(-1),
        providerPaymentId:`pi_b1_${randomUUID().replaceAll("-","")}`,mode:"payment",paymentStatus:"paid",amountTotal:980,currency:"jpy"};
      const recorded=await run.payment.verifyStripeEvidence(evidence,false);assert.equal(recorded.disposition,"verified");
      const purchase={...recorded,jobId:recorded.fulfillmentJobId,purchaseIntentId:request.purchaseReference,statusCapability:checkout.statusCapability,
        customerUserId:binding.customerUserId,prepared,ownership:binding.ownership,checkout,evidence};run.purchase=purchase;return purchase;
    };
    return run;
  };
  return h;
}
