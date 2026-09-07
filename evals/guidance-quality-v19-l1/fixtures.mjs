import { existsSync, readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { buildEffectiveAssessmentAuthorityV1 } from "../../lib/assessment/runtime/effective-assessment-authority-v1.ts";
import { groundBaseStructuredIntakeV3 } from "../../lib/assessment/runtime/base-structured-intake-grounding-v3.ts";
import { projectBaseProviderInputV1 } from "../../lib/assessment/runtime/base-structured-intake-grounding-v1.ts";
import { buildAbsentCandidateLaneV1 } from "../../lib/assessment/runtime/split-analysis-envelope-v1.ts";
import { makeRuntimeFixture, runFixture } from "../guidance-quality-wave1/runtime-fixtures.mjs";

export const BASELINE = "6ab70e6af379078b0f67f57d9ff2b91da3cbe8b3";
export const RUN_ROOT = "evals/guidance-quality-wave1/runs/2026-09-07-authorized-pilot8";
export const STORED_REPLAY_PROVENANCE = "Previously saved real-model outputs on synthetic inputs, replayed through fake transport. No new model extraction, generation, evaluation, or quality acceptance.";
export const EDITED_FIXTURE_PROVENANCE = "Hand-edited GQ24 Base taxonomy plus hand-authored Plan/Report and fake PB06 verdict. Contract/wiring evidence only; not real-model output or quality proof.";
export const OPTIONAL_REASON = "一言返すなら、短い挨拶で十分です。お礼のやり取りはまとまっているので、ここで終えても構いません。";

const root = fileURLToPath(new URL("../../", import.meta.url));
const read = (path) => JSON.parse(readFileSync(`${root}/${path}`, "utf8"));
const inputs = read("evals/guidance-quality-wave1/pilot-inputs.json").cases;
const sessions = readdirSync(`${root}/${RUN_ROOT}/internal`)
  .map((name) => `${RUN_ROOT}/internal/${name}/session.json`)
  .filter((path) => existsSync(`${root}/${path}`))
  .map((path) => ({ path, session: read(path) }));

export function makeStoredFixture(caseId, runtime = "runtime-stage-catalog-v17.0.0") {
  const found = sessions.find(({ session }) => session.caseId === caseId && session.actualRuntimeVersion === runtime);
  if (!found) throw new Error(`Missing frozen session: ${caseId} / ${runtime}`);
  const request = inputs.find((item) => item.id === caseId)?.input;
  if (!request) throw new Error(`Missing frozen pilot input: ${caseId}`);
  const outputs = {};
  for (const stage of found.session.stageDispositions) {
    if (stage.status === "completed") {
      if (outputs[stage.stageId]) throw new Error("Replay asset assumes the saved single-attempt pilot; do not discard a repair attempt.");
      outputs[stage.stageId] = structuredClone(stage.completion.outputJson);
    }
  }
  return {
    caseId, request: structuredClone(request), outputs,
    savedSession: structuredClone(found.session), sourcePath: found.path,
    provenance: STORED_REPLAY_PROVENANCE,
  };
}

export function deriveAuthority(fixture) {
  const base = groundBaseStructuredIntakeV3(projectBaseProviderInputV1(fixture.request), fixture.outputs["PB-01"]);
  const candidateEnvelope = buildAbsentCandidateLaneV1().candidate_envelope;
  const authority = buildEffectiveAssessmentAuthorityV1({
    baseStructuredIntake: base, candidateEnvelope, clarificationGrounding: null,
  });
  return {
    base, authority, candidateEnvelope,
    policyInput: {
      basePolicyInput: {
        aggregateSafety: fixture.outputs["PB-02"], baseStructuredIntake: base,
        decisionFacts: base.decision_facts, baseWritingSignals: base.base_writing_signals,
      },
      clarificationGrounding: null, effectiveAssessmentAuthority: authority,
    },
  };
}

export function mutateFixture(fixture, mutation) {
  const result = structuredClone(fixture);
  mutation(result.outputs["PB-01"], result.request);
  result.provenance = "Synthetic structured contrast, edited in memory only. No model-quality claim.";
  return result;
}

function replaceFactReference(value, factId) {
  if (value === "F001") return factId;
  if (Array.isArray(value)) return value.map((item) => replaceFactReference(item, factId));
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, replaceFactReference(item, factId)]));
  return value;
}

/** The only Base edit is declared taxonomy; the model has NOT produced this successor extraction. */
export function makeEditedAcknowledgementFixture() {
  const fixture = mutateFixture(makeStoredFixture("GQ-24"), (base) => {
    base.base_writing_signals.user_goal_detail = { value: "respond_politely", basis: "current_situation_explicit" };
  });
  const shape = makeRuntimeFixture("GQ-03", { candidate: false, detailed: true });
  const factId = fixture.outputs["PB-01"].observed_facts[0].fact_id;
  const plan = replaceFactReference(shape.outputs["PB-04"], factId);
  const reply = "一言返したければ、短い挨拶で締める。";
  Object.assign(plan, {
    schema_version: "pipeline-schema-v2.0.0", selected_decision: "reply_now",
    decision_reason_fact_ids: [factId],
    actions_to_take: [reply, "お礼のやり取りはまとまっているので、ここで終えても構わない。"],
    actions_to_avoid: ["相手の好意を決めつけない。", "返信を求める質問を無理に付け足さない。"],
    recommended_message_draft: { text: "ありがとう。またね。", policy: "required_now", use_timing: "now" },
    aftercare_plan: [
      { phase: "tonight", action: reply, avoid: "返さなければ嫌われると考えない。", supporting_fact_ids: [factId] },
      { phase: "next", action: "返信した場合も、新しい用件がなければ補足を重ねない。", avoid: "返事を催促しない。", supporting_fact_ids: [factId] },
      { phase: "reassessment_condition", action: "相手から新しい質問があれば、その内容に応じて返す。", avoid: "挨拶への反応だけで関係を判断しない。", supporting_fact_ids: [factId] },
    ],
    change_conditions: [{ condition: "相手から新しい質問が届く。", resulting_direction: "reply_now", supporting_fact_ids: [factId] }],
  });
  const content = replaceFactReference(shape.outputs["PB-05"], factId);
  Object.assign(content, {
    cover_line: "お礼への一言は、短い挨拶で十分です。",
    short_letter: ["もう一言返すか、そのまま区切るか迷っているのですね。今のやり取りなら、どちらも自然です。"],
    decision_reason_summary: OPTIONAL_REASON,
    observed_fact_commentary: [{ fact_id: factId, commentary: "相手からのお礼が届いていて、返答を求める質問は含まれていません。" }],
    action_rationales: ["短い挨拶で受け取ったことを伝えられます。ここでやり取りを終えても構いません。"],
    aftercare_commentary: ["返信しても、新しい用件がなければ次の返事を求めず、やり取りを区切れます。"],
    closing_lines: ["返信は義務ではありません。自分が区切りやすい方を選んで大丈夫です。"],
  });
  fixture.outputs["PB-04"] = plan;
  fixture.outputs["PB-05"] = content;
  fixture.outputs["PB-06"] = structuredClone(shape.outputs["PB-06"]);
  fixture.provenance = EDITED_FIXTURE_PROVENANCE;
  return fixture;
}

/** This existing helper instantiates only FakeAssessmentRepository/FakeAiStageTransport. */
export async function executeOffline(fixture, catalog, options = {}) {
  return runFixture(fixture, { ...options, catalog });
}

export function comparableSufficiency(value) {
  const rest = structuredClone(value);
  delete rest.schemaVersion;
  return rest;
}

export function comparableEffectivePolicy(value) {
  const rest = structuredClone(value);
  delete rest.schemaVersion;
  return rest;
}
