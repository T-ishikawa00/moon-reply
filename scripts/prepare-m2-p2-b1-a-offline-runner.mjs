import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  B1A,
  absolute,
  compactHash,
  loadB1aAssets,
} from "./lib/m2-p2-b1-a-contract.mjs";
import { createOfflineReplayTransport } from "./lib/m2-p2-b1-a-offline-replay-transport.mjs";
import {
  createRunner,
  runFailureMatrix,
} from "./lib/m2-p2-b1-a-runner-core.mjs";

const happyPath = "evals/calibration/b1a/reports/offline-happy-path-v1.json";
const failurePath = "evals/calibration/b1a/reports/offline-failure-matrix-v1.json";
const summaryPath = "evals/calibration/b1a/reports/offline-runner-summary-v1.md";

function renderJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

export function buildOfflineEvidence() {
  const assets = loadB1aAssets();
  const transport = createOfflineReplayTransport(assets.replayCatalog);
  const happy = createRunner({ assets, transport }).run();
  const failureResults = runFailureMatrix({ assets, transport });
  const failure = {
    schema_version: "moon-reply-b1a-failure-matrix-report-v1",
    task_id: B1A.taskId,
    execution_mode: B1A.mode,
    scenario_count: failureResults.length,
    completed_offline_count: failureResults.filter(
      (entry) => entry.actual_final_state === "completed_offline",
    ).length,
    all_stopped_once: failureResults.every(
      (entry) => entry.actual_final_state === "stopped" && entry.stop_count === 1,
    ),
    actual_provider_calls: 0,
    api_spend_usd: 0,
    scenarios: failureResults,
  };
  failure.deterministic_payload_sha256 = compactHash(failure);
  const summary = [
    "# M2-P2-B1-A Offline Runner Summary",
    "",
    `- Execution mode: \`${B1A.mode}\``,
    `- Run kind: \`${B1A.runKind}\``,
    `- Case: \`${B1A.caseId}\``,
    `- Calibration candidate: \`${B1A.model}\``,
    "- Product model selected: `false`",
    "- Live execution authorized: `false`",
    `- Terminal success state: \`${happy.final_state}\``,
    `- Simulated provider stages: \`${happy.simulated_provider_stages}\``,
    "- Actual provider calls: `0`",
    "- Actual API spend: `USD 0`",
    `- Synthetic usage cost reference: \`USD ${happy.budget_ledger.synthetic_reference.synthetic_usage_cost_reference_usd.toFixed(6)}\``,
    `- Static hard cap: \`USD ${B1A.staticHardCapUsd.toFixed(6)}\``,
    `- Failure scenarios stopped: \`${failureResults.filter((entry) => entry.passed).length}/20\``,
    "- Retry, Repair, fallback, PB-07, holdout, and real-user execution: `prohibited`",
    "",
    "Synthetic replay is plumbing evidence only. It is not provider output, billed usage, latency evidence, or model-quality evidence.",
    "",
  ].join("\n");
  return {
    happy,
    failure,
    summary,
    rendered: {
      happy: renderJson(happy),
      failure: renderJson(failure),
      summary,
    },
  };
}

export function writeOfflineEvidence() {
  const evidence = buildOfflineEvidence();
  for (const [relativePath, rendered] of [
    [happyPath, evidence.rendered.happy],
    [failurePath, evidence.rendered.failure],
    [summaryPath, evidence.rendered.summary],
  ]) {
    mkdirSync(path.dirname(absolute(relativePath)), { recursive: true });
    writeFileSync(absolute(relativePath), rendered, "utf8");
  }
  return evidence;
}

function isDirectExecution() {
  return (
    typeof process.argv[1] === "string" &&
    path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
  );
}

if (isDirectExecution()) {
  try {
    const first = buildOfflineEvidence();
    const second = buildOfflineEvidence();
    if (
      first.rendered.happy !== second.rendered.happy ||
      first.rendered.failure !== second.rendered.failure ||
      first.rendered.summary !== second.rendered.summary
    ) {
      throw new Error("Offline evidence differs across repeated builds");
    }
    writeOfflineEvidence();
    console.log(`OFFLINE_HAPPY_PATH_REPORT: ${happyPath}`);
    console.log(`OFFLINE_FAILURE_MATRIX_REPORT: ${failurePath}`);
    console.log(`OFFLINE_SUMMARY_REPORT: ${summaryPath}`);
    console.log("M2_B1_A_DETERMINISM_GATE: PASS");
    console.log("Actual provider calls: 0. API spend: USD 0.");
  } catch (error) {
    console.error(error instanceof Error ? error.stack ?? error.message : String(error));
    process.exitCode = 1;
  }
}
