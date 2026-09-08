import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { M2RuntimeError } from "../../lib/assessment/runtime/errors.ts";
const root = process.cwd();
const packageRoot =
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-v1-d";
const executionRoot = `${packageRoot}/controlled-provider-executions`;

function readJson(relativePath) {
  return JSON.parse(readFileSync(path.join(root, relativePath), "utf8"));
}

const controlled = readJson(`${packageRoot}/controlled-provider-inputs-v1.json`);
const safetyCases = readJson(
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p6-i1/safety-engine-cases-v1.json",
);

function fixture(fixtureId) {
  const selected = controlled.cases.find(
    (candidate) => candidate.fixture_id === fixtureId,
  );
  assert.ok(selected, fixtureId);
  return structuredClone(selected);
}

function outputs(directory) {
  const evidence = readJson(
    `${executionRoot}/${directory}/v16-stage-attempt-results-v1.json`,
  );
  const selected = {};
  for (const entry of evidence.stage_attempts) {
    if (
      entry.attemptNumber === 1 &&
      entry.outputJson !== null &&
      selected[entry.stageId] === undefined
    ) {
      selected[entry.stageId] = structuredClone(entry.outputJson);
    }
  }
  return selected;
}

function candidatePreservedMetadata() {
  return {
    source_status: "candidate_preserved",
    preserved_meaning: true,
    style_delta: [],
    communicative_intent_delta: {
      gratitude_change: "unchanged",
      apology_change: "unchanged",
      question_count_delta: 0,
      invitation_presence_delta: "unchanged_present",
      invitation_specificity_delta: "unchanged",
      affection_strength_delta: "unchanged",
      commitment_strength_delta: "unchanged",
      response_pressure_delta: "unchanged",
      boundary_strength_delta: "unchanged",
      closure_intent_delta: "unchanged_present",
      practical_requirement_fulfillment: "not_applicable",
    },
    change_reasons: ["no_change_needed"],
    change_summary: null,
  };
}

function semanticPass(output) {
  return {
    ...structuredClone(output),
    semantic_checks: [],
    final_disposition: null,
    repair_strategy: null,
    failed_codes: [],
  };
}

function case5Outputs() {
  const result = outputs(
    "2026-08-18-case5-polite-draft-ai-first-v16-cd1518ce",
  );
  const candidate =
    "今日はありがとうございました。お話しできてうれしかったです。";
  const plan = structuredClone(result["PB-04"]);
  plan.selected_decision = "send_now";
  plan.pre_action_check.check =
    "感謝だけを短く伝え、誘いや返信を求める表現を加えていないことを確認する。";
  plan.actions_to_take = ["候補文を変更せず、今夜一度だけ送る。"];
  plan.actions_to_avoid = [
    "候補文に誘いや関係性の確認を追加しない。",
    "送信後に感謝の追送を重ねない。",
  ];
  plan.recommended_message_draft = {
    text: candidate,
    policy: "required_now",
    use_timing: "now",
  };
  plan.message_draft_edit_metadata = candidatePreservedMetadata();
  plan.aftercare_plan[0].action =
    "候補文を一度送ったら、追加連絡をせず食事後の予定や休息に戻る。";
  plan.material_unknowns = plan.material_unknowns.filter(
    (entry) => entry.unknown_code !== "specific_message_text",
  );
  const report = structuredClone(result["PB-05"]);
  report.cover_line = "今夜は、感謝だけを短く自然に伝えられます。";
  report.decision_reason_summary =
    "同日中に感謝を伝えたい希望と、誘いや返信圧を含まない候補文が揃っているため、そのまま一度送る判断です。";
  report.message_draft_context =
    "感謝だけを短く伝える候補文を、文面を変えず今夜一度送るための最終案です。";
  report.action_rationales = [
    "候補文は感謝のみを伝え、誘いや返信要求を含まないため、今夜の目的に合っています。",
  ];
  return {
    ...result,
    "PB-04": plan,
    "PB-05": report,
    "PB-06": semanticPass(result["PB-06"]),
  };
}

function consultationFor(selected, overrides = {}) {
  return {
    ...structuredClone(safetyCases.base_input),
    currentSituation: selected.assessment_input.currentSituation,
    optionalMessage: selected.assessment_input.optionalMessage,
    relationship: selected.assessment_input.relationship,
    requestedTopics: selected.assessment_input.requestedTopics,
    consultationSchemaVersion: "rc1-production-consultation-v1",
    privacyAcknowledged: true,
    ...structuredClone(overrides),
  };
}

class ScriptedTransport {
  actualProviderCalls = 0;
  apiSpendUsd = 0;
  calls = [];
  requests = [];

  constructor(stageOutputs) {
    this.stageOutputs = structuredClone(stageOutputs);
  }

  async invoke(request) {
    this.calls.push(request.stageId);
    this.requests.push(structuredClone(request));
    let output;
    if (
      request.stageId === "PB-01" &&
      request.input.run_mode === "clarification_resume"
    ) {
      const evidence = request.input.clarification_evidence;
      output = {
        schema_version: "pipeline-schema-clarification-grounding-v1.0.0",
        target: evidence.target,
        source_identity: evidence.source_identity,
        answer_fingerprint: evidence.answer_fingerprint,
        materially_resolves_target: evidence.resolves_target,
        clarification_safety_result: {
          classification: "normal_allowed",
          reason_codes: [],
          response_mode: "none",
        },
      };
    } else {
      output = this.stageOutputs[request.stageId];
    }
    if (output === undefined) {
      throw new M2RuntimeError("RC1_FAKE_STAGE_OUTPUT_MISSING");
    }
    const sequence = this.calls.length;
    return {
      responseId: `fake-response-${sequence}`,
      returnedModel: request.model,
      output: structuredClone(output),
      usage: {
        inputTokens: 100 + sequence,
        cachedTokens: 0,
        outputTokens: 20 + sequence,
        reasoningTokens: 5,
      },
      latencyMs: sequence,
    };
  }
}


export { fixture, consultationFor, case5Outputs, ScriptedTransport };
