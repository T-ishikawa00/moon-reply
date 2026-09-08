import { createStep4Run, consumeStep4Event } from "./paid-delivery-step4-harness.mjs";
import { createHash } from "node:crypto";
const config = JSON.parse(Buffer.from(process.argv[2], "base64url").toString("utf8"));
const run = await createStep4Run({ url: config.url }, { now: config.now, contract: config.contract, mode: config.mode });
const observedInvoke = run.transport.invoke.bind(run.transport);
run.transport.invoke = async request => {
  try { return await observedInvoke(request); }
  finally { process.send({ boundary: "provider_ledger", invocations: run.providerInvocations }); }
};
if (["provider", "checkpoint"].includes(config.pauseAt)) {
  const invoke = run.transport.invoke.bind(run.transport);
  run.transport.invoke = async request => {
    if (config.pauseAt === "checkpoint" && request.stageId !== "PB-05") return invoke(request);
    // The external fake has actually returned, but the application never
    // receives its response or persists completion before forced termination.
    if (config.pauseAt === "checkpoint") await invoke(request);
    process.send({ boundary: "provider", stageId: request.stageId, pid: process.pid,
      requestHash: createHash("sha256").update(JSON.stringify(request.input)).digest("hex"),
      externalFakeReturned: config.pauseAt === "checkpoint", applicationReceivedResult: false });
    await new Promise(() => {});
  };
}
const result = await consumeStep4Event(run, config.event);
process.send({ boundary: "completed", result });
process.disconnect();
