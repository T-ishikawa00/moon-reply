import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { AssessmentApplication } from "../lib/assessment/runtime/application.ts";
import { M2RuntimeError } from "../lib/assessment/runtime/errors.ts";
import {
  FakeAiStageTransport,
  FakeAssessmentRepository,
} from "../lib/assessment/runtime/fakes.ts";
import {
  PAID_QUALITY_SOFT_FINDING_CODES_V1,
  classifyPaidQualityReassessmentExhaustionV1,
} from "../lib/assessment/runtime/quality-reassessment-v2.ts";
import { loadM2P4FinalProductRecoveryRuntimeStageCatalog } from "../lib/assessment/runtime/schema-catalog.ts";

const root = process.cwd();
const packageRoot =
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-v1-d";
const evidenceDirectory =
  "2026-08-18-case1-ordinary-reply-waiting-v16-bc973d02";

function readJson(relativePath) {
  return JSON.parse(
    new TextDecoder("utf-8", { fatal: true }).decode(
      readFileSync(path.join(root, relativePath)),
    ),
  );
}

function ids() {
  let index = 0;
  return () =>
    `00000000-0000-4000-8000-${String(++index).padStart(12, "0")}`;
}

function semanticFinding(findingCode, severity, jsonPath) {
  return {
    finding_code: findingCode,
    severity,
    json_path: jsonPath,
    evidence_refs: [],
    detail: "offline paid quality fixture",
  };
}

function semanticOutput(base, findings) {
  return {
    ...structuredClone(base),
    validation_mode: "semantic_findings_only",
    deterministic_checks: [],
    semantic_checks: structuredClone(findings),
    final_disposition: null,
    repair_strategy: null,
    failed_codes: [],
  };
}

function directive(defects) {
  return {
    schemaVersion: "m2-p4-quality-reassessment-directive-v2",
    attemptNumber: 2,
    scope: defects.some((defect) =>
      defect.jsonPath.startsWith("decision_plan"),
    )
      ? "plan_and_report"
      : "report_only",
    source: "combined_product_quality",
    defects,
  };
}

function defect(findingCode, jsonPath = "report_content.short_letter[0]") {
  return {
    findingCode,
    severity: "major",
    jsonPath,
    normalizedRepairRequirementCode: `VERIFY_${findingCode}`,
  };
}

const controlledInputs = readJson(
  `${packageRoot}/controlled-provider-inputs-v1.json`,
);
const fixture = controlledInputs.cases.find(
  (entry) => entry.fixture_id === "ordinary_reply_waiting",
);
assert.ok(fixture);
const stageEvidence = readJson(
  `${packageRoot}/controlled-provider-executions/${evidenceDirectory}/v16-stage-attempt-results-v1.json`,
);
const baseOutputs = Object.fromEntries(
  stageEvidence.stage_attempts
    .filter((entry) => entry.attemptNumber === 1 && entry.outputJson !== null)
    .map((entry) => [entry.stageId, structuredClone(entry.outputJson)]),
);

function stagesFor(repository, stageId) {
  return [...repository.stageRuns.values()]
    .filter((entry) => entry.stageId === stageId)
    .sort((left, right) => left.attemptNumber - right.attemptNumber);
}

function safeCode(error) {
  return error instanceof M2RuntimeError ? error.safeCode : null;
}

async function runScenario({
  pb06Findings = [[]],
  mutateOutputs,
  pb05Sequence,
}) {
  const outputs = structuredClone(baseOutputs);
  outputs["PB-06"] = semanticOutput(outputs["PB-06"], []);
  mutateOutputs?.(outputs);
  const outputSequence = {};
  if (pb06Findings.length > 1 || pb06Findings[0]?.length > 0) {
    outputSequence["PB-06"] = pb06Findings.map((findings) =>
      semanticOutput(baseOutputs["PB-06"], findings),
    );
  }
  if (pb05Sequence !== undefined) {
    outputSequence["PB-05"] = structuredClone(pb05Sequence);
  }
  const repository = new FakeAssessmentRepository();
  const transport = new FakeAiStageTransport({ outputs, outputSequence });
  const catalog = await loadM2P4FinalProductRecoveryRuntimeStageCatalog();
  const application = new AssessmentApplication({
    repository,
    transport,
    model: "gpt-5.6-luna",
    promptBundleVersion: catalog.promptBundleVersion,
    schemaSetVersion: catalog.schemaSetVersion,
    definitions: catalog.definitions,
    now: () => fixture.fixed_clock,
    uuid: ids(),
    timeZone: fixture.timezone,
  });
  let result = null;
  let error = null;
  try {
    result = await application.submit(
      structuredClone(fixture.assessment_input),
      `paid-quality-${crypto.randomUUID()}`,
    );
  } catch (caught) {
    error = caught;
  }
  assert.equal(transport.actualProviderCalls, 0);
  assert.equal(repository.actualSupabaseCalls, 0);
  return { error, repository, result, transport };
}

let checks = 0;
const failures = [];
async function check(name, callback) {
  try {
    await callback();
    checks += 1;
    console.log(`PASS ${String(checks).padStart(2, "0")} ${name}`);
  } catch (error) {
    failures.push({ name, error });
    console.error(`FAIL ${name}`);
    console.error(error);
  }
}

await check("hard and soft taxonomy is a closed allowlist", () => {
  assert.deepEqual(PAID_QUALITY_SOFT_FINDING_CODES_V1, [
    "TEMPLATE_GENERICITY",
    "BRAND_TONE",
    "REPETITION",
  ]);
  assert.equal(
    classifyPaidQualityReassessmentExhaustionV1(
      directive([
        defect("TEMPLATE_GENERICITY"),
        defect("REPETITION", "report_content.closing_lines[0]"),
      ]),
    ),
    "deliver_latest_valid_candidate",
  );
  for (const hardCode of [
    "FACT_FIDELITY",
    "ASSUMPTION_AS_FACT",
    "DECISION_ALLOWED",
    "DECISION_REASON_SUPPORT",
    "MESSAGE_POLICY_CONSISTENCY",
    "ACTION_CONSISTENCY",
    "THREE_DAY_PLAN_CONSISTENCY",
    "UNSUPPORTED_CERTAINTY",
    "SAFETY_REGRESSION",
    "REQUIRED_SECTION_MEANING",
    "REVIEW_CONDITION_PRESENT",
    "PRODUCT_SEMANTIC_SHAPE",
    "DRAFT_SOURCE_INTEGRITY",
    "CUSTOMER_SURFACE_INTEGRITY",
  ]) {
    assert.equal(
      classifyPaidQualityReassessmentExhaustionV1(
        directive([defect(hardCode)]),
      ),
      "fail_closed",
      hardCode,
    );
  }
  assert.equal(
    classifyPaidQualityReassessmentExhaustionV1(directive([])),
    "fail_closed",
  );
});

await check("Q1 initial PB-06 pass completes normally", async () => {
  const run = await runScenario({});
  assert.equal(run.error, null);
  assert.equal(run.result.eligibility, "ready");
  assert.equal(run.repository.reports.size, 1);
  assert.deepEqual(
    stagesFor(run.repository, "PB-06").map((entry) => entry.attemptNumber),
    [1],
  );
});

await check("Q2 initial soft finding reassesses once and then passes", async () => {
  const run = await runScenario({
    pb06Findings: [
      [
        semanticFinding(
          "TEMPLATE_GENERICITY",
          "major",
          "report_content.short_letter[0]",
        ),
      ],
      [],
    ],
  });
  assert.equal(run.error, null);
  assert.equal(run.result.eligibility, "ready");
  assert.equal(run.repository.reports.size, 1);
  assert.deepEqual(
    stagesFor(run.repository, "PB-06").map((entry) => entry.attemptNumber),
    [1, 2],
  );
});

await check("Q3 soft exhaustion delivers latest valid candidate without attempt 3", async () => {
  const run = await runScenario({
    pb06Findings: [
      [
        semanticFinding(
          "TEMPLATE_GENERICITY",
          "major",
          "report_content.short_letter[0]",
        ),
      ],
      [
        semanticFinding(
          "REPETITION",
          "major",
          "report_content.closing_lines[0]",
        ),
      ],
    ],
  });
  assert.equal(run.error, null);
  assert.equal(run.result.eligibility, "ready");
  assert.equal(run.repository.reports.size, 1);
  const pb06 = stagesFor(run.repository, "PB-06");
  assert.equal(pb06[0].status, "failed");
  assert.equal(
    pb06[0].failure.errorCode,
    "M2_PRODUCT_QUALITY_REASSESSMENT_REQUIRED",
  );
  assert.equal(pb06[1].status, "completed");
  assert.equal(
    pb06[1].completion.outputJson.semantic_checks[0].finding_code,
    "REPETITION",
  );
  assert.equal(
    [...run.repository.stageRuns.values()].some(
      (entry) => entry.attemptNumber > 2,
    ),
    false,
  );
  const downstreamCalls = run.transport.requests.filter((entry) =>
    ["PB-04", "PB-05", "PB-06"].includes(entry.stageId),
  );
  assert.ok(downstreamCalls.length <= 6);
  for (const stageId of ["PB-04", "PB-05", "PB-06"]) {
    assert.ok(
      downstreamCalls.filter((entry) => entry.stageId === stageId).length <= 2,
      stageId,
    );
  }
});

await check("Q4 hard Safety finding remains fail-closed", async () => {
  const finding = semanticFinding(
    "SAFETY_REGRESSION",
    "critical",
    "decision_plan.actions_to_take[0]",
  );
  const run = await runScenario({ pb06Findings: [[finding], [finding]] });
  assert.equal(
    safeCode(run.error),
    "M2_PRODUCT_QUALITY_REASSESSMENT_EXHAUSTED",
  );
  assert.equal(run.repository.reports.size, 0);
  assert.equal(
    stagesFor(run.repository, "PB-06")[1].status,
    "failed",
  );
});

await check("Q5 malformed product structure remains fail-closed", async () => {
  const run = await runScenario({
    mutateOutputs(outputs) {
      delete outputs["PB-05"].cover_line;
    },
  });
  assert.equal(safeCode(run.error), "M2_STAGE_SCHEMA_INVALID");
  assert.equal(run.repository.reports.size, 0);
  assert.equal(stagesFor(run.repository, "PB-06").length, 0);
});

await check("Q6 no valid Decision Plan candidate remains fail-closed", async () => {
  const run = await runScenario({
    mutateOutputs(outputs) {
      delete outputs["PB-04"].selected_decision;
    },
  });
  assert.equal(safeCode(run.error), "M2_STAGE_SCHEMA_INVALID");
  assert.equal(run.repository.reports.size, 0);
  assert.equal(stagesFor(run.repository, "PB-05").length, 0);
  assert.equal(stagesFor(run.repository, "PB-06").length, 0);
});

await check("mixed soft and integrity defect never selects fallback delivery", () => {
  assert.equal(
    classifyPaidQualityReassessmentExhaustionV1(
      directive([
        defect("REPETITION", "report_content.closing_lines[0]"),
        defect("FACT_FIDELITY", "report_content.cover_line"),
      ]),
    ),
    "fail_closed",
  );
});

if (failures.length > 0) {
  console.error(`\n${failures.length} paid quality guarantee checks failed.`);
  process.exitCode = 1;
} else {
  console.log(
    `\nPaid quality delivery guarantee PASS (${checks} checks, Provider 0, DB writes 0, Stripe 0).`,
  );
}
