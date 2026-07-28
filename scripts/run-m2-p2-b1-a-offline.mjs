import path from "node:path";
import { fileURLToPath } from "node:url";
import { B1A } from "./lib/m2-p2-b1-a-contract.mjs";
import { writeOfflineEvidence } from "./prepare-m2-p2-b1-a-offline-runner.mjs";

const acceptedFlags = new Set([
  "--mode",
  "--case",
  "--model",
  "--contract-hash",
  "--confirm",
]);

export function parseOfflineArguments(args) {
  if (args.length !== 10) throw new Error("Exactly five flag/value pairs are required");
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
    ["--mode", B1A.cliMode],
    ["--case", B1A.caseId],
    ["--model", B1A.model],
    ["--contract-hash", B1A.b0ContractHash],
    ["--confirm", B1A.confirmation],
  ]);
  for (const [flag, value] of expected) {
    if (values.get(flag) !== value) throw new Error(`Rejected value for ${flag}`);
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
    parseOfflineArguments(process.argv.slice(2));
    const evidence = writeOfflineEvidence();
    if (evidence.happy.final_state !== "completed_offline") {
      throw new Error(`Offline runner stopped: ${evidence.happy.stop_code}`);
    }
    console.log("M2_P2_B1_A_OFFLINE_RUN: completed_offline");
    console.log(`CASE_ID: ${B1A.caseId}`);
    console.log(`REQUESTED_MODEL: ${B1A.model}`);
    console.log("ACTUAL_PROVIDER_CALLS: 0");
    console.log("API_SPEND_USD: 0");
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
