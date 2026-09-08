import assert from "node:assert/strict";
import { SupabasePaidRecoveryRepository } from "../lib/payment/production/paid-recovery-supabase-repository.ts";
import { PaidRecoveryOperatorApplication } from "../lib/payment/production/paid-recovery-operator.ts";

// Explicit trusted operator command. Never loads dotenv/default service config.
// Production execution is a separate Human-authorized operation; this task
// invokes it only with an isolated local server and synthetic credentials.
const [command, ...args] = process.argv.slice(2);
const option = (name) => {
  const index = args.indexOf(name);
  return index < 0 ? undefined : args[index + 1];
};
assert.ok(["inspect", "resume"].includes(command), "Use inspect or resume");
const jobId = option("--job");
assert.match(jobId ?? "", /^[0-9a-f-]{36}$/iu, "Explicit job is required");
const url = new URL(process.env.SUPABASE_URL ?? "http://invalid.local");
assert.equal(url.origin, option("--expected-origin"), "Explicit expected DB origin must match configured target");
assert.ok(process.env.SUPABASE_SECRET_KEY, "A separately supplied operator credential is required");
const app = new PaidRecoveryOperatorApplication(new SupabasePaidRecoveryRepository(url.origin, process.env.SUPABASE_SECRET_KEY));
let result;
if (command === "inspect") result = await app.inspect(jobId);
else {
  assert.ok(args.includes("--configuration-validated"), "Inspect and validate repaired configuration before resume");
  assert.ok(option("--expected-reason") && option("--operator-reference"), "Inspection reason and operator evidence reference are required");
  result = await app.resume({ jobId, expectedReasonCode: option("--expected-reason"),
    operatorReference: option("--operator-reference"), configurationValidated: true });
}
console.log(JSON.stringify(result, null, 2));
