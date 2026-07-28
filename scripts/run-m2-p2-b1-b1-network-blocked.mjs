import path from "node:path";
import { fileURLToPath } from "node:url";
import { B1B1 } from "./lib/m2-p2-b1-b1-request-builder.mjs";
import { writeProviderAdapterEvidence } from "./prepare-m2-p2-b1-b1-provider-adapter.mjs";

const acceptedFlags = new Set([
  "--mode",
  "--case",
  "--model",
  "--contract-hash",
  "--confirm",
]);

export function parseNetworkBlockedArguments(args) {
  if (args.length !== 10) {
    throw new Error("Exactly five flag/value pairs are required");
  }
  const values = new Map();
  for (let index = 0; index < args.length; index += 2) {
    const flag = args[index];
    const value = args[index + 1];
    if (!acceptedFlags.has(flag)) throw new Error(`Unknown flag: ${flag}`);
    if (values.has(flag)) throw new Error(`Duplicate flag: ${flag}`);
    if (typeof value !== "string" || value.startsWith("--")) {
      throw new Error(`Missing value for ${flag}`);
    }
    values.set(flag, value);
  }
  for (const flag of acceptedFlags) {
    if (!values.has(flag)) throw new Error(`Missing flag: ${flag}`);
  }
  const expected = new Map([
    ["--mode", B1B1.cliMode],
    ["--case", B1B1.caseId],
    ["--model", B1B1.model],
    ["--contract-hash", B1B1.b0ContractHash],
    ["--confirm", B1B1.confirmation],
  ]);
  for (const [flag, value] of expected) {
    if (values.get(flag) !== value) {
      throw new Error(`Rejected value for ${flag}`);
    }
  }
  return Object.fromEntries(values);
}

function isDirectExecution() {
  return (
    typeof process.argv[1] === "string" &&
    path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
  );
}

if (isDirectExecution()) {
  try {
    parseNetworkBlockedArguments(process.argv.slice(2));
    const evidence = await writeProviderAdapterEvidence();
    const scenario = evidence.network.scenarios[0];
    if (
      scenario.stopped !== true ||
      scenario.stop_code !== "LIVE_EXECUTION_NOT_AUTHORIZED" ||
      scenario.secret_provider_invocations !== 0 ||
      scenario.request_executor_invocations !== 0 ||
      scenario.actual_provider_calls !== 0 ||
      scenario.api_spend_usd !== 0
    ) {
      throw new Error("Network-blocked proof differs");
    }
    console.log("M2_P2_B1_B1_NETWORK_BLOCKED_RUN: stopped");
    console.log(`STOP_CODE: ${scenario.stop_code}`);
    console.log("SECRET_PROVIDER_INVOCATIONS: 0");
    console.log("REQUEST_EXECUTOR_INVOCATIONS: 0");
    console.log("ACTUAL_PROVIDER_CALLS: 0");
    console.log("API_SPEND_USD: 0");
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
