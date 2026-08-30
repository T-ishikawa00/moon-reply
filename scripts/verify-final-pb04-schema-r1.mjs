import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";

import Ajv2020 from "ajv/dist/2020.js";
import { build } from "esbuild";

const root = process.cwd();
const schemaPath = path.join(
  root,
  "lib",
  "assessment",
  "runtime",
  "contracts",
  "decision-plan-v2.schema.json",
);
const helperPath = path.join(
  root,
  "lib",
  "assessment",
  "runtime",
  "decision-plan-fact-reference-canonicalization-v1.ts",
);
const pipelinePath = path.join(
  root,
  "lib",
  "assessment",
  "runtime",
  "pipeline.ts",
);

const schema = JSON.parse(await fs.readFile(schemaPath, "utf8"));
const pipelineSource = await fs.readFile(pipelinePath, "utf8");
const bundled = await build({
  entryPoints: [helperPath],
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
  write: false,
  logLevel: "silent",
});
const helperUrl = `data:text/javascript;base64,${Buffer.from(
  bundled.outputFiles[0].contents,
).toString("base64")}`;
const { canonicalizeDecisionPlanFactReferencesV1 } = await import(helperUrl);

const validate = new Ajv2020({
  allErrors: true,
  strict: false,
  validateFormats: false,
}).compile(schema);

let passed = 0;
function check(name, run) {
  run();
  passed += 1;
  console.log(`PASS ${name}`);
}

function basePlan() {
  return {
    schema_version: "pipeline-schema-v2.0.0",
    selected_decision: "wait_and_reassess",
    decision_reason_fact_ids: ["F001", "F002"],
    possible_interpretations: [
      {
        statement: "可能性A",
        supporting_fact_ids: ["F001"],
        epistemic_status: "possibility_only",
      },
      {
        statement: "可能性B",
        supporting_fact_ids: ["F002"],
        epistemic_status: "possibility_only",
      },
      {
        statement: "可能性C",
        supporting_fact_ids: ["F001", "F002"],
        epistemic_status: "possibility_only",
      },
    ],
    pre_action_check: {
      check: "確認事項",
      supporting_fact_ids: ["F001", "F002"],
    },
    actions_to_take: ["行動A", "行動B"],
    actions_to_avoid: ["回避A", "回避B"],
    recommended_message_draft: {
      text: "候補文",
      policy: "later_only",
      use_timing: "later",
    },
    message_draft_edit_metadata: {
      source_status: "candidate_minimally_edited",
      preserved_meaning: true,
      style_delta: [],
      communicative_intent_delta: {
        gratitude_change: "unchanged",
        apology_change: "unchanged",
        question_count_delta: 0,
        invitation_presence_delta: "unchanged_absent",
        invitation_specificity_delta: "unchanged",
        affection_strength_delta: "unchanged",
        commitment_strength_delta: "unchanged",
        response_pressure_delta: "decreased",
        boundary_strength_delta: "unchanged",
        closure_intent_delta: "unchanged_absent",
        practical_requirement_fulfillment: "fulfilled",
      },
      change_reasons: ["reduce_pressure"],
      change_summary: "圧力だけを弱めた",
    },
    aftercare_plan: [
      {
        phase: "tonight",
        action: "行動C",
        avoid: null,
        supporting_fact_ids: ["F001"],
      },
      {
        phase: "next",
        action: "行動D",
        avoid: "回避C",
        supporting_fact_ids: ["F002"],
      },
      {
        phase: "reassessment_condition",
        action: "行動E",
        avoid: null,
        supporting_fact_ids: ["F001", "F002"],
      },
    ],
    change_conditions: [
      {
        condition: "条件A",
        resulting_direction: "send_now",
        supporting_fact_ids: ["F001"],
      },
      {
        condition: "条件B",
        resulting_direction: "wait_and_reassess",
        supporting_fact_ids: ["F002"],
      },
      {
        condition: "条件C",
        resulting_direction: "pause_additional_contact",
        supporting_fact_ids: ["F001", "F002"],
      },
    ],
    review_timing: {
      when: "確認時期",
      trigger_fact_ids: ["F001", "F002"],
    },
    material_unknowns: [],
    model_generated_limitations: [],
  };
}

function appendDuplicate(plan, pathValue) {
  const parts = pathValue.split("/").filter(Boolean);
  let selected = plan;
  for (const part of parts) {
    selected = selected[Number.isInteger(Number(part)) ? Number(part) : part];
  }
  assert.ok(Array.isArray(selected));
  selected.push(selected.at(-1));
}

const historicalFailurePaths = [
  [
    "/decision_reason_fact_ids",
    "/possible_interpretations/0/supporting_fact_ids",
    "/aftercare_plan/0/supporting_fact_ids",
    "/aftercare_plan/1/supporting_fact_ids",
    "/aftercare_plan/2/supporting_fact_ids",
    "/change_conditions/2/supporting_fact_ids",
    "/review_timing/trigger_fact_ids",
  ],
  [
    "/decision_reason_fact_ids",
    "/aftercare_plan/0/supporting_fact_ids",
    "/aftercare_plan/1/supporting_fact_ids",
    "/change_conditions/1/supporting_fact_ids",
    "/review_timing/trigger_fact_ids",
  ],
  [
    "/decision_reason_fact_ids",
    "/possible_interpretations/1/supporting_fact_ids",
    "/aftercare_plan/0/supporting_fact_ids",
  ],
  [
    "/decision_reason_fact_ids",
    "/aftercare_plan/0/supporting_fact_ids",
    "/aftercare_plan/1/supporting_fact_ids",
  ],
  [
    "/decision_reason_fact_ids",
    "/aftercare_plan/0/supporting_fact_ids",
  ],
  [
    "/decision_reason_fact_ids",
    "/possible_interpretations/1/supporting_fact_ids",
    "/aftercare_plan/0/supporting_fact_ids",
    "/change_conditions/1/supporting_fact_ids",
  ],
  [
    "/decision_reason_fact_ids",
    "/possible_interpretations/2/supporting_fact_ids",
    "/pre_action_check/supporting_fact_ids",
    "/aftercare_plan/0/supporting_fact_ids",
    "/aftercare_plan/1/supporting_fact_ids",
    "/aftercare_plan/2/supporting_fact_ids",
  ],
];

check("all seven observed uniqueItems signatures canonicalize to valid PB-04", () => {
  for (const paths of historicalFailurePaths) {
    const fixture = basePlan();
    paths.forEach((item) => appendDuplicate(fixture, item));
    assert.equal(validate(fixture), false);
    assert.deepEqual(
      new Set((validate.errors ?? []).map((error) => error.instancePath)),
      new Set(paths),
    );
    assert.ok((validate.errors ?? []).every((error) => error.keyword === "uniqueItems"));
    const canonical = canonicalizeDecisionPlanFactReferencesV1(fixture);
    assert.equal(validate(canonical), true, JSON.stringify(validate.errors));
  }
});

check("already-valid PB-04 output is byte-shape stable", () => {
  const fixture = basePlan();
  const canonical = canonicalizeDecisionPlanFactReferencesV1(fixture);
  assert.deepEqual(canonical, fixture);
  assert.notEqual(canonical, fixture);
  assert.equal(validate(canonical), true);
});

check("malformed fact-reference type still fails closed", () => {
  const fixture = basePlan();
  fixture.decision_reason_fact_ids = ["F001", 7, "F001"];
  const canonical = canonicalizeDecisionPlanFactReferencesV1(fixture);
  assert.deepEqual(canonical.decision_reason_fact_ids, fixture.decision_reason_fact_ids);
  assert.equal(validate(canonical), false);
});

check("unsupported enum still fails closed", () => {
  const fixture = basePlan();
  fixture.selected_decision = "invented_decision";
  assert.equal(validate(canonicalizeDecisionPlanFactReferencesV1(fixture)), false);
});

check("unknown field still fails closed", () => {
  const fixture = basePlan();
  fixture.message_impact = "invented surface";
  assert.equal(validate(canonicalizeDecisionPlanFactReferencesV1(fixture)), false);
});

check("duplicate non-fact product content still fails closed", () => {
  const fixture = basePlan();
  fixture.actions_to_take = ["同じ行動", "同じ行動"];
  assert.equal(validate(canonicalizeDecisionPlanFactReferencesV1(fixture)), false);
});

check("decision and draft contradiction still fails closed", () => {
  const fixture = basePlan();
  fixture.selected_decision = "pause_additional_contact";
  assert.equal(validate(canonicalizeDecisionPlanFactReferencesV1(fixture)), false);
});

check("runtime applies canonicalization only to PB-04 v17 before AJV", () => {
  assert.match(
    pipelineSource,
    /definition\.stageId === "PB-04"[\s\S]*?runContext\.promptBundleVersion === "prompt-bundle-runtime-v17\.0\.0"[\s\S]*?canonicalizeDecisionPlanFactReferencesV1\(response\.output\)[\s\S]*?validateStageOutput\(definition, canonicalOutput\)[\s\S]*?afterValidation\?\.\(canonicalOutput\)[\s\S]*?outputJson: canonicalOutput/u,
  );
  assert.match(
    pipelineSource,
    /outputJson: response\?\.output \?\? null,[\s\S]*?errorCode: safeError\.safeCode/u,
  );
});

console.log(`Final PB-04 schema R1 verifier passed (${passed} checks).`);
