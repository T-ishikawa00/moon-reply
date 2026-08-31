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

const repairRequirementByFindingCode = {
  ACTION_CONSISTENCY: "RESTORE_ACTION_CONSISTENCY",
  DECISION_ALLOWED: "RESTORE_ALLOWED_DECISION",
  DECISION_REASON_SUPPORT: "RESTORE_DECISION_SUPPORT",
  DRAFT_SOURCE_INTEGRITY: "RESTORE_BYTE_EXACT_CANDIDATE",
  FACT_FIDELITY: "RESTORE_FACT_FIDELITY",
  MESSAGE_POLICY_CONSISTENCY: "RESTORE_MESSAGE_POLICY_CONSISTENCY",
  REPETITION: "RESTORE_DISTINCT_PRODUCT_FUNCTIONS",
  REQUIRED_SECTION_MEANING: "RESTORE_REQUIRED_SECTION_MEANING",
  SAFETY_REGRESSION: "RESTORE_SAFETY_COMPLIANCE",
  TEMPLATE_GENERICITY: "RESTORE_CONSULTATION_SPECIFICITY",
  THREE_DAY_PLAN_CONSISTENCY: "RESTORE_THREE_DAY_PLAN_CONSISTENCY",
};

function defect(
  findingCode,
  jsonPath = "report_content.short_letter[0]",
  severity = "major",
) {
  return {
    findingCode,
    severity,
    jsonPath,
    normalizedRepairRequirementCode:
      repairRequirementByFindingCode[findingCode],
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

await check("R2-1 normal ready completes without reassessment", async () => {
  const run = await runScenario({});
  assert.equal(run.error, null);
  assert.equal(run.result.eligibility, "ready");
  assert.equal(run.repository.reports.size, 1);
  assert.deepEqual(
    stagesFor(run.repository, "PB-06").map((entry) => entry.attemptNumber),
    [1],
  );
});

await check("R2-2 soft-only exhaustion delivers latest valid candidate", async () => {
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

await check("R2-3 B-only exhaustion delivers even with a critical quality label", async () => {
  assert.equal(
    classifyPaidQualityReassessmentExhaustionV1(
      directive([
        defect(
          "DECISION_REASON_SUPPORT",
          "report_content.decision_reason_summary",
          "critical",
        ),
        defect(
          "DRAFT_SOURCE_INTEGRITY",
          "decision_plan.recommended_message_draft.text",
        ),
      ]),
    ),
    "deliver_latest_valid_candidate",
  );
  const findings = [
    semanticFinding(
      "DECISION_REASON_SUPPORT",
      "critical",
      "report_content.decision_reason_summary",
    ),
    semanticFinding(
      "THREE_DAY_PLAN_CONSISTENCY",
      "major",
      "decision_plan.aftercare_plan[0].action",
    ),
  ];
  const run = await runScenario({ pb06Findings: [findings, findings] });
  assert.equal(run.error, null);
  assert.equal(run.result.eligibility, "ready");
  assert.equal(run.repository.reports.size, 1);
  assert.equal(stagesFor(run.repository, "PB-06")[1].status, "completed");
  assert.equal(
    [...run.repository.stageRuns.values()].some(
      (entry) => entry.attemptNumber > 2,
    ),
    false,
  );
});

await check("R2-4 any true A, including Safety mixed with B, remains fail-closed", async () => {
  const aDefects = [
    defect(
      "SAFETY_REGRESSION",
      "decision_plan.actions_to_take[0]",
      "minor",
    ),
    defect("DECISION_ALLOWED", "decision_plan.selected_decision", "major"),
    defect("FACT_FIDELITY", "report_content.cover_line", "critical"),
    defect(
      "MESSAGE_POLICY_CONSISTENCY",
      "decision_plan.recommended_message_draft.text",
      "critical",
    ),
    defect(
      "ACTION_CONSISTENCY",
      "decision_plan.actions_to_take[0]",
      "critical",
    ),
    defect(
      "REQUIRED_SECTION_MEANING",
      "report_content.cover_line",
      "critical",
    ),
  ];
  for (const aDefect of aDefects) {
    assert.equal(
      classifyPaidQualityReassessmentExhaustionV1(
        directive([
          defect(
            "DECISION_REASON_SUPPORT",
            "report_content.decision_reason_summary",
            "critical",
          ),
          aDefect,
        ]),
      ),
      "fail_closed",
      aDefect.findingCode,
    );
  }
  assert.equal(
    classifyPaidQualityReassessmentExhaustionV1(directive([])),
    "fail_closed",
  );
  assert.equal(
    classifyPaidQualityReassessmentExhaustionV1(
      directive([
        {
          ...defect(
            "DECISION_REASON_SUPPORT",
            "report_content.decision_reason_summary",
            "critical",
          ),
          normalizedRepairRequirementCode: "RESTORE_FACT_FIDELITY",
        },
      ]),
    ),
    "fail_closed",
  );

  const safety = semanticFinding(
    "SAFETY_REGRESSION",
    "critical",
    "decision_plan.actions_to_take[0]",
  );
  const quality = semanticFinding(
    "DECISION_REASON_SUPPORT",
    "major",
    "report_content.decision_reason_summary",
  );
  const run = await runScenario({
    pb06Findings: [[safety, quality], [safety, quality]],
  });
  assert.equal(
    safeCode(run.error),
    "M2_PRODUCT_QUALITY_REASSESSMENT_EXHAUSTED",
  );
  assert.equal(run.repository.reports.size, 0);
  assert.equal(stagesFor(run.repository, "PB-06")[1].status, "failed");
  assert.equal(
    [...run.repository.stageRuns.values()].some(
      (entry) => entry.attemptNumber > 2,
    ),
    false,
  );
});

if (failures.length > 0) {
  console.error(`\n${failures.length} paid quality guarantee checks failed.`);
  process.exitCode = 1;
} else {
  console.log(
    `\nPaid quality delivery policy R2 PASS (${checks} focused cases, Provider 0, DB writes 0, Stripe 0).`,
  );
}
