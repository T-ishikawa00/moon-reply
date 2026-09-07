import { readFileSync } from "node:fs";
import { buildEffectiveAssessmentAuthorityV1 } from "../../lib/assessment/runtime/effective-assessment-authority-v1.ts";
import { groundBaseStructuredIntakeV3 } from "../../lib/assessment/runtime/base-structured-intake-grounding-v3.ts";
import { projectBaseProviderInputV1 } from "../../lib/assessment/runtime/base-structured-intake-grounding-v1.ts";
import { buildAbsentCandidateLaneV1 } from "../../lib/assessment/runtime/split-analysis-envelope-v1.ts";

const read = (path) => JSON.parse(readFileSync(new URL(path, import.meta.url), "utf8"));
const frozenCases = read("../guidance-quality-r1/cases.json").cases;
const template = read("../runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-v1-a1/routing-fixtures-v1.json").base_structured_intake_template;
const oldStages = read("../runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-v1-d/controlled-provider-executions/2026-08-19-case5-polite-draft-v17-fcd54a0c/v17-stage-attempt-results-v1.json");
const stage = (id) => structuredClone(oldStages.stage_attempts.find((entry) =>
  entry.stageId === id && entry.attemptNumber === 1).outputJson);

export const AB_FIXTURE_PROVENANCE =
  "Hand-authored synthetic PB01 mappings of frozen GQ consultations. Actual model extraction is NOT_RUN. Historical fixtures supply structural shape and normal PB02/PB03 stubs only; no historical quality outcome is inferred.";
export const AB_CASE_IDS = ["GQ-28", "GQ-05", "GQ-24", "GQ-03", "GQ-29"];

export function rebuildAbFixture(fixture, mutate = () => {}) {
  const next = structuredClone({
    caseId: fixture.caseId,
    request: fixture.request,
    rawBase: fixture.rawBase,
  });
  mutate(next.rawBase, next.request);
  const baseStructuredIntake = groundBaseStructuredIntakeV3(
    projectBaseProviderInputV1(next.request), next.rawBase,
  );
  const candidateEnvelope = buildAbsentCandidateLaneV1().candidate_envelope;
  const authority = buildEffectiveAssessmentAuthorityV1({
    baseStructuredIntake, candidateEnvelope, clarificationGrounding: null,
  });
  return {
    ...next,
    candidateEnvelope,
    authority,
    baseStructuredIntake,
    outputs: { "PB-01": next.rawBase, "PB-02": stage("PB-02"), "PB-03": stage("PB-03") },
    policyInput: {
      basePolicyInput: {
        aggregateSafety: { classification: "normal_allowed" },
        baseStructuredIntake,
        decisionFacts: baseStructuredIntake.decision_facts,
        baseWritingSignals: baseStructuredIntake.base_writing_signals,
      },
      clarificationGrounding: null,
      effectiveAssessmentAuthority: authority,
    },
  };
}

export function makeAbFixture(caseId) {
  if (!AB_CASE_IDS.includes(caseId)) throw new Error(`Unsupported A/B fixture: ${caseId}`);
  const source = frozenCases.find((entry) => entry.id === caseId);
  const request = {
    currentSituation: source.consultation,
    relationship: "ambiguous",
    requestedTopics: ["decide_send_or_wait"],
    optionalMessage: null,
  };
  const rawBase = structuredClone(template);
  rawBase.relationship_stage = "ambiguous";
  rawBase.user_goal = "decide_send_or_wait";
  rawBase.context = [];
  rawBase.boundaries = [];
  rawBase.user_emotions = [];
  rawBase.user_assumptions = [];
  rawBase.context_inferences = [];
  rawBase.timeline = [{
    event_id: "E001", sequence: 1,
    actor: ["GQ-24", "GQ-03"].includes(caseId) ? "other_person" : "user",
    statement: source.consultation, source_refs: ["input:current_situation"],
  }];
  rawBase.observed_facts = [{
    fact_id: "F001", statement: source.consultation,
    source_refs: ["input:current_situation"], support: "explicit",
  }];
  rawBase.material_unknowns = [{
    unknown_code: "other_person_intent", description: "相手の内心は入力から確定できない。",
    material_to: ["decision"],
  }];
  const facts = rawBase.decision_facts;
  facts.relationship_stage = "ambiguous";
  facts.selected_requests = ["decide_send_or_wait"];
  facts.latest_direct_message = {
    sender: "none", kind: "none", response_expectation: "none",
    user_reply_state: "not_applicable", sns_signal_only: false,
  };
  facts.contact_state = {
    unanswered_user_message_count: caseId === "GQ-05" ? null : 0,
    elapsed_since_latest_user_message_minutes: null, usual_cadence_relation: "unknown",
  };
  facts.practical_reason = {
    kind: caseId === "GQ-28" ? "thank_you" : caseId === "GQ-05" ? "single_invitation" : "none",
    active: ["GQ-28", "GQ-05"].includes(caseId), deadline: "none",
  };
  facts.information_state = {
    assessment_mode: "best_effort", can_proceed_without_followup: true,
    used_context_inference: false,
    unresolved_fields: [
      "contact_state.elapsed_since_latest_user_message_minutes",
      "contact_state.usual_cadence_relation",
      ...(caseId === "GQ-05" ? ["contact_state.unanswered_user_message_count"] : []),
    ],
  };
  const writing = rawBase.base_writing_signals;
  for (const [key, signal] of Object.entries(writing.relationship_dimensions)) {
    signal.value = key === "romantic_stage" ? "ambiguous" : "unknown";
    signal.basis = key === "romantic_stage" ? "relationship_chip" : "unresolved";
  }
  writing.message_signals = [];
  writing.incoming_message_profile = {
    dialogue_acts: [], unanswered_obligations: [], practical_requirements: ["none"],
    closure_signal: "none", response_expectation: "none", present: false,
  };
  writing.user_goal_detail = {
    value: caseId === "GQ-05" ? "move_closer" : "respond_politely",
    basis: "current_situation_explicit",
  };
  writing.explicit_user_constraints = [];
  writing.communication_pattern = {
    usual_register: "unknown", usual_length: "unknown", usual_emoji_pattern: "unknown",
    usual_response_cadence_summary: null, usual_initiator: "unknown",
    reciprocal_style_summary: null, basis: "unresolved",
  };
  writing.channel_and_timing = {
    channel: "unknown", relative_timing: caseId === "GQ-28" ? "same_day" : "unknown",
    basis: caseId === "GQ-28" ? "current_situation_explicit" : "unresolved",
  };
  writing.language_and_expression = {
    primary_language: "ja", mixed_languages: [], dialect_or_regional_expression: "unknown",
    established_shared_expression: "unknown", intentional_nonstandard_expression: "unknown",
    possible_typo: "unknown", basis: "current_situation_explicit",
  };
  writing.repeat_consultation_state = {
    state: "unknown", changed_fact_ids: [], basis: "unresolved",
  };
  if (["GQ-24", "GQ-03"].includes(caseId)) {
    const acknowledgement = caseId === "GQ-24";
    facts.latest_direct_message = {
      sender: "other_person", kind: acknowledgement ? "social_acknowledgement" : "question",
      response_expectation: acknowledgement ? "optional" : "reasonable",
      user_reply_state: "not_replied", sns_signal_only: false,
    };
    writing.message_signals = [{ author: "other_person", status: "incoming" }];
    writing.incoming_message_profile = {
      dialogue_acts: [acknowledgement ? "thanks" : "question"],
      unanswered_obligations: acknowledgement ? [] : ["question"],
      practical_requirements: acknowledgement ? ["none"] : ["answer_question"],
      closure_signal: "none", response_expectation: acknowledgement ? "optional" : "reasonable",
      present: true,
    };
  }
  if (caseId === "GQ-29") {
    facts.latest_direct_message = {
      sender: "user", kind: "question", response_expectation: "reasonable",
      user_reply_state: "not_applicable", sns_signal_only: false,
    };
    facts.contact_state.unanswered_user_message_count = 1;
    writing.message_signals = [{ author: "user", status: "sent_by_user" }];
    writing.user_goal_detail = { value: "other", basis: "current_situation_explicit" };
  }
  return rebuildAbFixture({ caseId, request, rawBase });
}
