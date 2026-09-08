import { registerHooks } from "node:module";
registerHooks({ resolve(specifier, context, nextResolve) {
  if (specifier === "server-only") return { url: "data:text/javascript,export%20{}", shortCircuit: true };
  return nextResolve(specifier, context);
} });
const { createPaidRecoveryApplication } = await import("./paid-recovery-application.mjs");
const config = JSON.parse(Buffer.from(process.argv[2], "base64url").toString("utf8"));
if (!/^http:\/\/127\.0\.0\.1:\d+$/u.test(config.url)) throw new Error("LOCAL_WORKER_URL_REQUIRED");
if (config.pauseAt === "configuration") {
  process.env.PAYMENT_FULFILLMENT_PROCESSING_ENABLED = "true";
  process.env.PAYMENT_PROVIDER_ENVIRONMENT = "test";
  process.env.SUPABASE_URL = config.url;
  process.env.SUPABASE_SECRET_KEY = "synthetic-local-service-role";
  // Child owns a clean environment; the missing app config is deliberate.
  const NativeDate = Date;
  globalThis.Date = class extends NativeDate {
    constructor(...args) { super(...(args.length ? args : [config.now])); }
    static now() { return NativeDate.parse(config.now); }
  };
  const { processProductionFulfillmentJobById } = await import("../../lib/payment/production/worker-service.ts");
  const outcome = await processProductionFulfillmentJobById(config.jobId, config.cycle);
  process.send({ boundary: "configuration-result", status: outcome.status });
  process.disconnect();
} else {
const run = await createPaidRecoveryApplication({ url: config.url }, { now: config.now });
if (config.pauseAt === "provider" || config.pauseAt === "checkpoint") {
  const originalInvoke = run.transport.invoke.bind(run.transport);
  run.transport.invoke = async request => {
    if (config.pauseAt === "checkpoint" && request.stageId !== "PB-05") return originalInvoke(request);
    process.send({ boundary: "provider", stageId: request.stageId, pid: process.pid });
    await new Promise(() => {});
  };
}
process.send({ boundary: "started", pid: process.pid });
const outcome = await run.payment.processFulfillmentJobById(config.jobId, config.cycle);
process.send({ boundary: "completed", status: outcome.status });
process.disconnect();
}
