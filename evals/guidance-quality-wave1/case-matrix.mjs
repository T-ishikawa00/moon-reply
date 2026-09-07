import { readFileSync } from "node:fs";
import { AB_CASE_IDS, AB_FIXTURE_PROVENANCE, makeAbFixture, rebuildAbFixture } from "./ab-fixtures.mjs";
import { buildEffectiveAssessmentAuthorityV1 } from "../../lib/assessment/runtime/effective-assessment-authority-v1.ts";
import { groundCandidateAnalysisV2 } from "../../lib/assessment/runtime/candidate-analysis-grounding-v2.ts";
import { buildAvailableCandidateLaneV1 } from "../../lib/assessment/runtime/split-analysis-envelope-v1.ts";

const frozen = JSON.parse(readFileSync(new URL("../guidance-quality-r1/cases.json", import.meta.url), "utf8"));
const byId = new Map(frozen.cases.map((entry) => [entry.id, entry]));
const decisionTopics = ["decide_send_or_wait"];
const draftTopics = ["draft_message"];

export const CASE_MATRIX_PROVENANCE = {
  expectations: "../guidance-quality-r1/cases.json; read without modification; defined before model execution",
  mappings: "Hand-authored synthetic application input and PB01/PB01C mappings, not outputs produced by a model",
  inherited: AB_FIXTURE_PROVENANCE,
  realModelExtraction: "NOT_RUN",
  realModelAnswerQuality: "NOT_RUN",
  productionPrevalence: "UNKNOWN",
  relationshipChip: "The harness selects ambiguous consistently. This is an input control, not evidence of mutual affection or a relationship history.",
  absentBoundary: "none means no boundary stated in the supplied context; it does not establish the absence of any undisclosed boundary",
  inputSeparation: "For candidate text cases, the quoted draft is placed only in optionalMessage. The original full consultation remains in evaluation metadata. Candidate wording is not copied into Base observations.",
  observationLimit: "Typed facts are a reviewable mapping assumption. Structural/source validation cannot prove a real model would produce that mapping.",
};

// Each entry is an input mapping, not a desired answer inserted into provider input.
// Some cases intentionally stop at raw application input: manufacturing normal Safety
// or a missing contact/intent fact would make their downstream fixture misleading.
const specs = {
  "GQ-01": {
    seed: "GQ-28", purpose: "thanks",
    situation: "今日初めて二人で食事をしました。未返信の連絡や連絡を控えてほしいという話はありません。用意したお礼を送っていい？",
    candidate: "今日はありがとう。楽しかったです。", candidateKind: "simple_thanks",
    facts: ["今日初めて二人で食事をした。", "未返信の連絡や連絡を控えてほしいという話はない。"],
    notes: ["W-01 keeps candidate and typed facts identical; only the framing in currentSituation differs."],
  },
  "GQ-02": {
    seed: "GQ-28", purpose: "thanks",
    situation: "今日初めて二人で食事をしました。未返信の連絡や連絡を控えてほしいという話はありません。用意したお礼も、待った方がいい？",
    candidate: "今日はありがとう。楽しかったです。", candidateKind: "simple_thanks",
    facts: ["今日初めて二人で食事をした。", "未返信の連絡や連絡を控えてほしいという話はない。"],
    notes: ["W-01 changes no directional evidence; the candidate text stays in its own lane."],
  },
  "GQ-03": { reuse: true, notes: ["Incoming unanswered question; actual V17 preparation reachability is covered by verify-ab.mjs."] },
  "GQ-04": {
    seed: "GQ-03", purpose: "incoming_question",
    facts: ["相手から『週末は何をしているの？』という質問が来ている。", "相談者はまだ返信していない。"],
    notes: ["W-02 reuses GQ-03 typed input unchanged apart from source wording; reply cadence remains unknown."],
  },
  "GQ-05": { reuse: true, notes: ["One initial invitation; unanswered count and reply cadence remain unknown."] },
  "GQ-06": {
    seed: "GQ-05", purpose: "declined_invitation",
    facts: ["何度か話した知人と最近も普通に会話している。", "同じお茶の誘いを明確に断られた。"],
    notes: ["A declined invitation is recorded as a scoped other boundary. It is not converted into a global no_contact or relationship_closed fact.", "The refusal medium and latest direct-message author are unknown. Do not invent an incoming DM or preserve single_invitation as an available first-invitation reason.", "If the predecessor returns clarification rather than usable boundary guidance, record that limitation; do not claim this is a delivered refusal answer."],
  },
  "GQ-07": {
    seed: "GQ-29", purpose: "deadline_logistics",
    facts: ["明日会う仮約束があり、時間は未定。", "昨日『都合が分かったら教えてね』と送って未返信。"],
    notes: ["Tomorrow is an explicit deadline; exact elapsed minutes and usual cadence are unknown.", "The new practical need is scheduling, not a demand for romantic reassurance."],
  },
  "GQ-08": {
    seed: "GQ-29", purpose: "unfixed_future_plan",
    facts: ["いつか会おうという話だけで日付は未定。", "昨日『都合が分かったら教えてね』と送って未返信。"],
    notes: ["A vague future possibility is not a fixed scheduling deadline. usual_cadence_relation is not set to within_usual merely to obtain a wait result."],
  },
  "GQ-09": {
    seed: "GQ-29", purpose: "unanswered_chat", count: 1,
    facts: ["昨日送った雑談が未返信で、追加はしていない。", "急ぎの用件や新しい用件はない。"],
    notes: ["W-03 keeps known contact facts identical; the message kind is ordinary conversation, not an incoming question."],
  },
  "GQ-10": {
    seed: "GQ-29", purpose: "unanswered_chat", count: 1,
    facts: ["昨日送った雑談が未返信で、追加はしていない。", "急ぎの用件や新しい用件はない。"],
    notes: ["W-03 changes only the user's question framing."],
  },
  "GQ-11": {
    seed: "GQ-29", purpose: "unanswered_chat", count: 3,
    facts: ["2日前から返事がなく、その間に3通送っている。", "急ぎの用件や新しい用件はない。"],
    notes: ["Three unanswered outbound messages set repeated_unanswered_contact. The last of those three is not assumed to have been sent exactly 2 days ago."],
  },
  "GQ-12": {
    seed: "GQ-29", purpose: "unanswered_chat", count: 1,
    facts: ["2日前から返事がなく、その間に1通送っている。", "急ぎの用件や新しい用件はない。"],
    notes: ["Only the known outbound count differs from GQ-11. Both may appropriately recommend no new message; strength and review conditions should differ."],
  },
  "GQ-13": {
    seed: "GQ-28", purpose: "explicit_boundary", boundary: "temporary_distance", count: 0,
    facts: ["相手に『少し一人にしてほしい』と言われた。", "その後相談者から連絡しておらず、急ぎの用件もない。"],
    notes: ["Explicit temporary distance is authoritative independently of the unreported communication medium. No restart date is invented."],
  },
  "GQ-14": {
    seed: "GQ-28", purpose: "explicit_boundary", boundary: "no_contact", count: null,
    facts: ["相手に『もう連絡しないで』と言われている。", "急ぎの用件はない。"],
    notes: ["A final thank-you is still contact under this explicit refusal. Unreported later outbound history remains unknown."],
  },
  "GQ-15": {
    seed: "GQ-28", purpose: "short_thanks",
    facts: ["初めて会った相手に、今日は楽しかったと伝えたい。"],
    notes: ["No unmentioned explicit refusal is invented, and unanswered history stays unknown instead of being set to zero."],
  },
  "GQ-16": {
    seed: "GQ-28", purpose: "edit_only", topics: draftTopics,
    situation: "今日初めて二人で会いました。用意した文章を少し自然にしたいです。送るかどうかの判断は求めていません。",
    candidate: "今日はありがとうございました。またお話しできたら嬉しいです。", candidateKind: "thanks_and_hope",
    facts: ["今日初めて二人で会った。"],
    notes: ["Edit-only selection retains the original meaning. The desire to talk again is candidate intent, not evidence of a mutual next appointment."],
  },
  "GQ-17": {
    seed: "GQ-28", purpose: "edit_only", topics: draftTopics,
    facts: ["今日初めて二人で会った。"],
    notes: ["draft_message is preserved as requested. Do not add message_impact to force the scope gate to ask for an original.", "A preparation that becomes ready without the requested original is a known contract limitation to report, not a passing expectation."],
  },
  "GQ-18": {
    topics: ["organize_emotions"],
    withheld: "No faithful full downstream fixture in this matrix: no-send evening organization needs function-specific planning rather than fabricated latest-message facts.",
    notes: ["The decision not to send tonight is user-authorized; this does not establish a contact refusal by the other person."],
  },
  "GQ-19": {
    withheld: "Latest-message author is materially unknown. Raw application input is mapped, but no synthetic incoming/outbound author is chosen.",
    notes: ["The frozen set allows one clarification or conditional guidance. Do not replace this uncertainty with the incoming facts of GQ-20."],
  },
  "GQ-20": {
    seed: "GQ-03", purpose: "incoming_schedule",
    facts: ["明日会う仮約束がある。", "相手から『明日どうする？』というメッセージがあり、その後まだやり取りしていない。"],
    notes: ["Known other-person author supports reply_now. The day is explicit but a clock time must not be invented."],
  },
  "GQ-21": {
    withheld: "Whitespace input belongs to application input validation; no fake successful PB01/PB02/PB03 output is manufactured.",
    notes: ["Keep the original whitespace. No observations or relationship narrative are added."],
  },
  "GQ-22": {
    withheld: "Explicitly unrelated tax request needs supported-scope handling. A normal_allowed eligibility fixture would misrepresent the case.",
    notes: ["No romance context is added to make the case eligible."],
  },
  "GQ-23": {
    topics: draftTopics,
    withheld: "Refusal plus blocked-account circumvention needs Safety routing. Normal historical PB02/PB03 stubs must not stand in for that assessment.",
    notes: ["Keep the circumvention request visible for Safety. No contact draft is supplied as a successful answer fixture."],
  },
  "GQ-24": { reuse: true, notes: ["Optional natural acknowledgement: reply_once and close_exchange remain allowed in the frozen set. A reply_now implementation realizes one allowed direction."] },
  "GQ-25": {
    topics: draftTopics, situation: "用意した文章を、少し短く自然に整えてください。", candidate: "また会えたら嬉しいです",
    withheld: "Candidate-only editing has no independent relationship observation. Raw input is mapped without inventing a meeting or passing the grounded_evidence requirement using an invented event.",
    notes: ["The original is already concise. Meaning or warmth changes must be identified as an alternative, not silently presented as the same edit."],
  },
  "GQ-26": {
    topics: ["decide_send_or_wait", "draft_message"],
    situation: "今日初めて二人で食事をしました。用意した文章を重くない感じに整えて送りたいです。",
    candidate: "今日はありがとう。私のこと好き？",
    withheld: "The candidate contains a feelings question. A neutral-thanks Candidate stub would erase that material intent; this matrix does not fabricate its PB01C mapping.",
    notes: ["Input lanes are separated while evaluation metadata retains the feelings question. Its removal or softening must be explicit."],
  },
  "GQ-27": {
    withheld: "A scoped business_only restriction plus permitted work logistics requires its own verified authority fixture. It is not modeled as unrestricted thanks or global no_contact.",
    notes: ["Only a work start-time confirmation is permitted by the stated constraint; relationship checking remains excluded."],
  },
  "GQ-28": { reuse: true, notes: ["No-draft initial thanks; actual V17 preparation reaches V4's usable_action_context stop."] },
  "GQ-29": { reuse: true, notes: ["Known unreturned outbound question. This must not use the optional incoming-acknowledgement exception."] },
  "GQ-30": {
    topics: ["decide_send_or_wait", "message_impact"],
    withheld: "Missing candidate for the explicitly requested impact assessment reaches existing scope clarification before PB01. Full partial-product delivery is outside the A/B fixture contract.",
    notes: ["The frozen expectation preserves the answerable thanks direction while asking for the missing text once; record any whole-consultation stop as a remaining limitation."],
  },
};

export function makeCaseMatrix() {
  return frozen.cases.map((source) => {
    const spec = specs[source.id];
    if (!spec) throw new Error(`Missing hand-authored mapping: ${source.id}`);
    return {
      caseId: source.id,
      sourceCase: structuredClone(source),
      expectedDirectionSet: source.acceptable_directions.map((entry) => entry.direction),
      pairs: structuredClone(frozen.pairs.filter((pair) => pair.members.includes(source.id))),
      input: {
        currentSituation: spec.situation ?? source.consultation,
        relationship: "ambiguous",
        requestedTopics: [...(spec.topics ?? decisionTopics)],
        optionalMessage: spec.candidate ?? null,
      },
      mappingStatus: spec.withheld ? "application_input_only" : "synthetic_structured_fixture_available",
      structuredFixtureUnavailableReason: spec.withheld ?? null,
      fixtureOrigin: spec.reuse ? "ab-fixtures.mjs" : spec.withheld ? null : "case-matrix.mjs",
      notes: [...spec.notes],
      modelExtraction: "NOT_RUN",
      modelAnswerQuality: "NOT_RUN",
    };
  });
}

function updateUnresolvedFields(facts) {
  const unresolved = [
    ["latest_direct_message.sender", facts.latest_direct_message.sender, "unknown"],
    ["latest_direct_message.kind", facts.latest_direct_message.kind, "unknown"],
    ["latest_direct_message.response_expectation", facts.latest_direct_message.response_expectation, "unknown"],
    ["latest_direct_message.user_reply_state", facts.latest_direct_message.user_reply_state, "unknown"],
    ["contact_state.unanswered_user_message_count", facts.contact_state.unanswered_user_message_count, null],
    ["contact_state.elapsed_since_latest_user_message_minutes", facts.contact_state.elapsed_since_latest_user_message_minutes, null],
    ["contact_state.usual_cadence_relation", facts.contact_state.usual_cadence_relation, "unknown"],
  ];
  facts.information_state.unresolved_fields = unresolved.filter(([, value, unknown]) => value === unknown).map(([path]) => path);
}

function noPracticalReason(facts) {
  facts.practical_reason = { kind: "none", active: false, deadline: "none" };
}

function noKnownIncoming(writing) {
  writing.message_signals = [];
  writing.incoming_message_profile = {
    present: false, dialogue_acts: [], unanswered_obligations: [],
    practical_requirements: ["none"], closure_signal: "none", response_expectation: "none",
  };
}

function rawCandidate(kind) {
  const hope = kind === "thanks_and_hope";
  return {
    candidate_style_profile: {
      register: hope ? "polite" : "mixed", sentence_length: "short", sentence_ending: "soft",
      punctuation: "standard", emoji_usage: "none", exclamation_usage: "none",
      softness: "high", directness: "balanced", invitation_style: "none", reply_pressure: "low",
    },
    candidate_communicative_intent: {
      gratitude_strength: "high", apology_strength: "none", question_count: 0,
      invitation_presence: false, invitation_specificity: "none", affection_strength: hope ? "low" : "none",
      commitment_strength: "none", response_pressure: "none", boundary_strength: "none",
      conversation_closure: "soft", practical_requirement: ["none"],
    },
    candidate_language_expression: {
      primary_language: "ja", mixed_languages: [], dialect_or_regional_expression: "absent",
      intentional_nonstandard_expression: "absent", possible_typo: "absent",
    },
    candidate_safety_signals: { untrusted_embedded_instruction_detected: false, signal_codes: [] },
  };
}

export function makeCaseFixture(caseId) {
  const spec = specs[caseId];
  if (!spec || !byId.has(caseId)) throw new Error(`Unknown frozen case: ${caseId}`);
  if (spec.withheld) throw new Error(`No structured fixture for ${caseId}: ${spec.withheld}`);
  if (spec.reuse) return makeAbFixture(caseId);
  const row = makeCaseMatrix().find((entry) => entry.caseId === caseId);
  const seed = makeAbFixture(spec.seed);
  const fixture = rebuildAbFixture({ ...seed, caseId }, (raw, request) => {
    Object.assign(request, structuredClone(row.input));
    raw.observed_facts = spec.facts.map((statement, index) => ({
      fact_id: `F${String(index + 1).padStart(3, "0")}`, statement,
      source_refs: ["input:current_situation"], support: "explicit",
    }));
    raw.timeline = [];
    const facts = raw.decision_facts;
    const writing = raw.base_writing_signals;
    if (["declined_invitation", "explicit_boundary", "edit_only", "short_thanks"].includes(spec.purpose)) {
      facts.contact_state.unanswered_user_message_count = spec.count ?? null;
      writing.channel_and_timing = { channel: "unknown", relative_timing: "unknown", basis: "unresolved" };
    }
    if (spec.purpose === "declined_invitation") {
      noPracticalReason(facts);
      facts.latest_direct_message = { sender: "unknown", kind: "unknown", response_expectation: "unknown", user_reply_state: "unknown", sns_signal_only: false };
      noKnownIncoming(writing);
      raw.boundaries = [{ boundary_id: "B001", kind: "other", status: "explicit", statement: "同じお茶の誘いを明確に断られた。", source_refs: ["input:current_situation"] }];
      writing.boundary_ownership_signals = [{ kind: "other", asserted_by: "other_person", explicit: true }];
      writing.user_goal_detail = { value: "move_closer", basis: "current_situation_explicit" };
    }
    if (["deadline_logistics", "unfixed_future_plan"].includes(spec.purpose)) {
      facts.latest_direct_message.kind = "schedule_coordination";
      facts.latest_direct_message.response_expectation = "reasonable";
      writing.user_goal_detail = { value: "other", basis: "current_situation_explicit" };
      facts.practical_reason = spec.purpose === "deadline_logistics"
        ? { kind: "schedule_coordination", active: true, deadline: "next_day" }
        : { kind: "none", active: false, deadline: "none" };
    }
    if (spec.purpose === "unanswered_chat") {
      facts.latest_direct_message.kind = "other";
      facts.latest_direct_message.response_expectation = "optional";
      facts.contact_state.unanswered_user_message_count = spec.count;
      facts.boundary_state.repeated_unanswered_contact = spec.count > 1;
    }
    if (spec.purpose === "explicit_boundary") {
      noPracticalReason(facts);
      facts.latest_direct_message = { sender: "unknown", kind: "unknown", response_expectation: "unknown", user_reply_state: "unknown", sns_signal_only: false };
      facts.boundary_state = { kind: spec.boundary, status: "explicit", repeated_unanswered_contact: false };
      noKnownIncoming(writing);
      raw.boundaries = [{ boundary_id: "B001", kind: spec.boundary, status: "explicit", statement: spec.facts[0], source_refs: ["input:current_situation"] }];
      writing.boundary_ownership_signals = [{ kind: spec.boundary, asserted_by: "other_person", explicit: true }];
    }
    if (spec.purpose === "edit_only") {
      noPracticalReason(facts);
      raw.user_goal = "prepare_message";
      writing.user_goal_detail = { value: "other", basis: "current_situation_explicit" };
    }
    if (spec.purpose === "incoming_schedule") {
      facts.latest_direct_message.kind = "schedule_coordination";
      facts.practical_reason = { kind: "schedule_coordination", active: true, deadline: "next_day" };
      writing.incoming_message_profile.practical_requirements = ["confirm_schedule"];
    }
    updateUnresolvedFields(facts);
  });
  if (!spec.candidate) return fixture;
  const output = rawCandidate(spec.candidateKind);
  const grounded = groundCandidateAnalysisV2(output);
  const candidateLane = buildAvailableCandidateLaneV1(grounded.candidate_analysis, grounded.candidate_safety_result);
  fixture.candidateEnvelope = candidateLane.candidate_envelope;
  fixture.candidateSafetyResult = candidateLane.candidate_safety_result;
  fixture.authority = buildEffectiveAssessmentAuthorityV1({
    baseStructuredIntake: fixture.baseStructuredIntake, candidateEnvelope: fixture.candidateEnvelope,
    clarificationGrounding: null,
  });
  fixture.policyInput.effectiveAssessmentAuthority = fixture.authority;
  fixture.outputs["PB-01C"] = output;
  return fixture;
}

export const CASE_MATRIX_STRUCTURED_CASE_IDS = frozen.cases
  .map((entry) => entry.id).filter((id) => !specs[id].withheld);
export const CASE_MATRIX_REUSED_AB_CASE_IDS = [...AB_CASE_IDS];
