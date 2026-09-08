// LOCAL CONTRACT TEST ONLY. Immutable copy of the existing authored L5 repair
// fixture. No new model generation or quality evidence. Source provenance below.
import assert from "node:assert/strict";
import { prepareV19L5PaidCandidate } from "../../lib/assessment/production/recovery-candidate.ts";
import { loadV19L5StageCatalog } from "../../lib/assessment/runtime/v19-l5-stage-catalog.ts";

const REPAIR_CHECKS = ["fact_source_integrity", "input_fidelity", "meaning_preservation", "direction_consistency", "action_consistency", "safety"];

export function createPaidDeliveryStep4Fixture({ mode = "clean" } = {}) {
  assert.ok(["clean", "repairable", "unrepairable"].includes(mode));
  const seed = structuredClone(STEP4_SEED), requests = [], ledger = [];
  if (mode === "clean") seed.report.short_letter[1] = seed.replacementText;
  const transport = { requests, async invoke(request) {
    requests.push(structuredClone(request));
    const occurrence = requests.filter(q => q.stageId === request.stageId).length;
    const binding = request.input.report_fact_repair_context;
    const patch = request.stageId === "PB-05" && request.schemaVersion === "report-fact-repair-v1";
    const revalidation = request.stageId === "PB-06" && binding != null;
    const entry = { ordinal: requests.length, stageId: request.stageId, occurrence,
      schemaVersion: request.schemaVersion, patchAttempt: patch, revalidation, status: "started" };
    ledger.push(entry);
    const copy = structuredClone;
    let output;
    if (request.stageId === "PB-01") output = { schema_version: "v19-l5-base-intent-v1", base_intake: copy(seed.base),
      request_intent: { message_task: "NONE", decision_requested: true, decision_explicitly_excluded: false,
        communication_purpose: "OTHER", evidence_fact_ids: ["F305"], source_excerpt: seed.request.currentSituation } };
    else if (request.stageId === "PB-02") output = copy(seed.safety);
    else if (request.stageId === "PB-03") { output = copy(seed.sufficiency); output.acknowledged_eligibility = copy(request.input.application_eligibility_expectation); }
    else if (request.stageId === "PB-04") output = { schema_version: "v19-l5-plan-v1", answer_mode: "decision_guidance", decision_plan: copy(seed.plan), message_plan: null };
    else if (patch) output = { schema_version: "report-fact-repair-v1", source_report_hash: binding.source_report_hash,
      target_path: binding.target_path, original_text: binding.original_text, replacement_text: seed.replacementText };
    else if (request.stageId === "PB-05") output = { schema_version: "v19-l5-report-v1", answer_mode: "decision_guidance", report_content: copy(seed.report), message_content: null };
    else if (request.stageId === "PB-06") {
      output = { schema_version: "validation-result-v19-l4-v1", validation_mode: "semantic_findings_only",
        deterministic_checks: [], semantic_checks: mode !== "clean" && !revalidation ? [copy(seed.finding)] : [],
        final_disposition: null, repair_strategy: null, failed_codes: [],
        report_fact_repair_verification: revalidation ? { report_hash: binding.report_hash, target_path: binding.target_path,
          verified_text: binding.verified_text, evidence_fact_ids: copy(binding.evidence_fact_ids),
          checks: Object.fromEntries(REPAIR_CHECKS.map(key => [key, mode === "unrepairable" && key === "fact_source_integrity" ? "fail" : "pass"])) } : null };
    } else throw new Error(`STEP4_UNEXPECTED_FAKE_STAGE_${request.stageId}`);
    entry.status = "returned";
    return { responseId: `step4-${mode}-${entry.ordinal}`, returnedModel: request.model, output,
      usage: { inputTokens: 100, cachedTokens: 0, outputTokens: 20, reasoningTokens: 0 }, latencyMs: 0 };
  } };
  return { mode, request: seed.request, requests, ledger, transport,
    metrics: () => ({ invocations: ledger.length, repairCount: ledger.filter(row => row.patchAttempt).length,
      validationCount: ledger.filter(row => row.stageId === "PB-06").length, revalidationCount: ledger.filter(row => row.revalidation).length }),
    async prepareAuthority(now = "2026-09-09T00:00:00.000Z") {
      return prepareV19L5PaidCandidate(seed.request, { catalog: await loadV19L5StageCatalog(), transport, now: () => now, timeZone: "Asia/Tokyo" });
    } };
}

const STEP4_SEED = {
  "provenance": {
    "source": "evals/guidance-quality-v19-l5/repair-fixtures.mjs createRepairFixture()",
    "sourceHashes": {
      "evals/guidance-quality-wave1/pilot-inputs.json": "54203238b1594335bafad7540a63bf63a4a6b1865a82cbb3718ff6e7bcf121c8",
      "evals\\blind-runs\\2026-09-08-fresh-01\\internal\\f904555b-eaf7-46d0-9382-aa1b3146c6e3\\call-102-inspection-decision.json": "163545ebddfa495d4ac79830a5369770733ab8abcac4776d41ee82e578a258e7",
      "evals\\blind-runs\\2026-09-08-fresh-01\\internal\\f904555b-eaf7-46d0-9382-aa1b3146c6e3\\call-102-inspection-required.json": "c22e00ef4942a812a9c21e84e72362b79760f5ca6c779c3601e9769419233ab1",
      "evals\\blind-runs\\2026-09-08-fresh-01\\internal\\f904555b-eaf7-46d0-9382-aa1b3146c6e3\\call-102-request.json": "108909d1a5090282610351451239699ea41d53b5d237ebdf53c2ffc5b12223a7",
      "evals\\blind-runs\\2026-09-08-fresh-01\\internal\\f904555b-eaf7-46d0-9382-aa1b3146c6e3\\call-102-response.json": "6296b571263a61ba2e57c7360cf23dab96b21df8ea88da5597fa9cf06568672d",
      "evals\\blind-runs\\2026-09-08-fresh-01\\internal\\f904555b-eaf7-46d0-9382-aa1b3146c6e3\\call-102-review.json": "ab34d55f3694eebeedbbe4426cec69faeb2909d2d418704dec988f0e451e9a98",
      "evals\\blind-runs\\2026-09-08-fresh-01\\internal\\f904555b-eaf7-46d0-9382-aa1b3146c6e3\\call-105-inspection-decision.json": "b0329e4afd9b0c9bb02e4a92f3be6fde23e7771af7f9211b8d0498ec517b9e50",
      "evals\\blind-runs\\2026-09-08-fresh-01\\internal\\f904555b-eaf7-46d0-9382-aa1b3146c6e3\\call-105-inspection-required.json": "c15c7a99cc8ff47022671eb0ac4c150dce13e4c4b2e9b8c317cd849eb2c093ca",
      "evals\\blind-runs\\2026-09-08-fresh-01\\internal\\f904555b-eaf7-46d0-9382-aa1b3146c6e3\\call-105-request.json": "8b3ef64febe87bf221d3220cc165e9bcd84a0d335a788ea5a9dfd79f7ca2e24c",
      "evals\\blind-runs\\2026-09-08-fresh-01\\internal\\f904555b-eaf7-46d0-9382-aa1b3146c6e3\\call-105-response.json": "84072ee2504c3d812a5541fcf75461da2f8f0f219a3e8f8915d3d4464f0f2c75",
      "evals\\blind-runs\\2026-09-08-fresh-01\\internal\\f904555b-eaf7-46d0-9382-aa1b3146c6e3\\call-105-review.json": "ab34d55f3694eebeedbbe4426cec69faeb2909d2d418704dec988f0e451e9a98",
      "evals\\blind-runs\\2026-09-08-fresh-01\\internal\\f904555b-eaf7-46d0-9382-aa1b3146c6e3\\call-108-inspection-decision.json": "d08e61c31a99e6fcf99d86e5b801f4420f723574d139c46ac993670d9ff3f442",
      "evals\\blind-runs\\2026-09-08-fresh-01\\internal\\f904555b-eaf7-46d0-9382-aa1b3146c6e3\\call-108-inspection-required.json": "f479f360dc99b37ca30b2bbd2f444da39651d0a6ace2bdeec8b2bb735813e265",
      "evals\\blind-runs\\2026-09-08-fresh-01\\internal\\f904555b-eaf7-46d0-9382-aa1b3146c6e3\\call-108-request.json": "4a33086fb6f3196ab69ce589f419f87cf6c0ba8ad98ba8823a3c9ca5454ee70a",
      "evals\\blind-runs\\2026-09-08-fresh-01\\internal\\f904555b-eaf7-46d0-9382-aa1b3146c6e3\\call-108-response.json": "edd691e53cb5d0fc42f922c0df355ee3477c4bcd8fbb95fda7cf87456cf54c0a",
      "evals\\blind-runs\\2026-09-08-fresh-01\\internal\\f904555b-eaf7-46d0-9382-aa1b3146c6e3\\call-108-review.json": "ab34d55f3694eebeedbbe4426cec69faeb2909d2d418704dec988f0e451e9a98",
      "evals\\blind-runs\\2026-09-08-fresh-01\\internal\\f904555b-eaf7-46d0-9382-aa1b3146c6e3\\call-111-inspection-decision.json": "6a053045dd377519a96255017cd34e085fe0fe62d569819ab76aa2b470629b92",
      "evals\\blind-runs\\2026-09-08-fresh-01\\internal\\f904555b-eaf7-46d0-9382-aa1b3146c6e3\\call-111-inspection-required.json": "8b0b92df80a6255021d85ce8f700259dae0a7f5280f741cf9cea353a24387b85",
      "evals\\blind-runs\\2026-09-08-fresh-01\\internal\\f904555b-eaf7-46d0-9382-aa1b3146c6e3\\call-111-request.json": "fdbfba73d6800704d22f51e669e18499ec8edf55f0859d626700759da2606267",
      "evals\\blind-runs\\2026-09-08-fresh-01\\internal\\f904555b-eaf7-46d0-9382-aa1b3146c6e3\\call-111-response.json": "bc2f769569bb7bdaff622d6e648452580396cba2e141f2faea51fb8f7d1597cd",
      "evals\\blind-runs\\2026-09-08-fresh-01\\internal\\f904555b-eaf7-46d0-9382-aa1b3146c6e3\\call-111-review.json": "ab34d55f3694eebeedbbe4426cec69faeb2909d2d418704dec988f0e451e9a98",
      "evals\\blind-runs\\2026-09-08-fresh-01\\internal\\f904555b-eaf7-46d0-9382-aa1b3146c6e3\\call-114-inspection-decision.json": "9ac4c2379bd25954098bc544322eaae91c6710a816c34370f821e3a11dff01ee",
      "evals\\blind-runs\\2026-09-08-fresh-01\\internal\\f904555b-eaf7-46d0-9382-aa1b3146c6e3\\call-114-inspection-required.json": "ecb19d9de9afa020873bb4af654871d2f20684a0b06f5aee60991d4b7b6b0f36",
      "evals\\blind-runs\\2026-09-08-fresh-01\\internal\\f904555b-eaf7-46d0-9382-aa1b3146c6e3\\call-114-request.json": "2e23e66f33fcf901c5dc171d499438239587aa908f6b3dbbdcd82c5b00bdaf9f",
      "evals\\blind-runs\\2026-09-08-fresh-01\\internal\\f904555b-eaf7-46d0-9382-aa1b3146c6e3\\call-114-response.json": "c881de6262de38f8cfc14e7f308ca1fbfad40c00d192dfd4ec31878970ee2d40",
      "evals\\blind-runs\\2026-09-08-fresh-01\\internal\\f904555b-eaf7-46d0-9382-aa1b3146c6e3\\call-114-review.json": "ab34d55f3694eebeedbbe4426cec69faeb2909d2d418704dec988f0e451e9a98",
      "evals\\blind-runs\\2026-09-08-fresh-01\\internal\\f904555b-eaf7-46d0-9382-aa1b3146c6e3\\evidence-index.json": "07d1180a2e3f1b9e2c12978c46c49b83c60a3e863abd43fb3597c25ae7ae09e6",
      "evals\\blind-runs\\2026-09-08-fresh-01\\internal\\f904555b-eaf7-46d0-9382-aa1b3146c6e3\\session.json": "3bf05805b99e40c46f60130aa430ce2b619d49ea08a3cc7db348778ceb72624a"
    },
    "classification": "retained structural seed and authored fake outputs; no model quality evidence"
  },
  "request": {
    "currentSituation": "こちらから「週末は何をしているの？」と送って、まだ返事がありません。もう一通送っていい？ 今後3日間はどう動けばよいかも整理してください。",
    "relationship": "ambiguous",
    "requestedTopics": [
      "decide_send_or_wait",
      "next_three_days"
    ],
    "optionalMessage": null
  },
  "base": {
    "schema_version": "pipeline-schema-base-v2.0.0",
    "relationship_stage": "ambiguous",
    "user_goal": "decide_send_or_wait",
    "timeline": [
      {
        "event_id": "E105",
        "sequence": 1,
        "actor": "user",
        "statement": "ユーザーが相手に「週末は何をしているの？」と送った。",
        "source_refs": [
          "input:current_situation"
        ]
      },
      {
        "event_id": "E205",
        "sequence": 2,
        "actor": "user",
        "statement": "そのメッセージにはまだ返事がない。",
        "source_refs": [
          "input:current_situation"
        ]
      },
      {
        "event_id": "E305",
        "sequence": 3,
        "actor": "user",
        "statement": "ユーザーはもう一通送ってよいかを尋ねている。",
        "source_refs": [
          "input:current_situation"
        ]
      },
      {
        "event_id": "E405",
        "sequence": 4,
        "actor": "user",
        "statement": "ユーザーは今後3日間の動き方の整理も求めている。",
        "source_refs": [
          "input:current_situation"
        ]
      }
    ],
    "boundaries": [],
    "context": [
      {
        "context_id": "C105",
        "kind": "relationship",
        "statement": "関係性はambiguousとして提示されている。",
        "source_refs": [
          "input:relationship"
        ]
      },
      {
        "context_id": "C205",
        "kind": "message_state",
        "statement": "ユーザーから送ったメッセージが未返信の状態である。",
        "source_refs": [
          "input:current_situation"
        ]
      },
      {
        "context_id": "C305",
        "kind": "schedule",
        "statement": "ユーザーは今後3日間の行動整理を求めている。",
        "source_refs": [
          "input:current_situation",
          "input:requested_topics"
        ]
      }
    ],
    "observed_facts": [
      {
        "fact_id": "F105",
        "statement": "ユーザーは相手に「週末は何をしているの？」と送った。",
        "source_refs": [
          "input:current_situation"
        ],
        "support": "explicit"
      },
      {
        "fact_id": "F205",
        "statement": "ユーザーが送ったメッセージには、現時点で返事がない。",
        "source_refs": [
          "input:current_situation"
        ],
        "support": "explicit"
      },
      {
        "fact_id": "F305",
        "statement": "ユーザーは追加で一通送ってよいかを尋ねている。",
        "source_refs": [
          "input:current_situation"
        ],
        "support": "explicit"
      },
      {
        "fact_id": "F405",
        "statement": "ユーザーは今後3日間の行動を整理したい。",
        "source_refs": [
          "input:current_situation"
        ],
        "support": "explicit"
      }
    ],
    "user_assumptions": [],
    "user_emotions": [],
    "material_unknowns": [
      {
        "unknown_code": "elapsed_time_unknown",
        "description": "最初のメッセージを送ってからの経過時間は不明。",
        "material_to": [
          "decision",
          "message_draft"
        ]
      },
      {
        "unknown_code": "usual_cadence_unknown",
        "description": "通常の返信頻度や今回の遅れが通常範囲内かどうかは不明。",
        "material_to": [
          "decision"
        ]
      },
      {
        "unknown_code": "other_person_intent_unknown",
        "description": "相手が返信していない理由や意図は不明。",
        "material_to": [
          "decision"
        ]
      }
    ],
    "safety_signals": [],
    "untrusted_embedded_instructions_detected": false,
    "context_inferences": [],
    "decision_facts": {
      "schema_version": "m2-p4-base-decision-facts-v2",
      "relationship_stage": "ambiguous",
      "selected_requests": [
        "decide_send_or_wait",
        "next_three_days"
      ],
      "latest_direct_message": {
        "sender": "user",
        "kind": "question",
        "response_expectation": "reasonable",
        "user_reply_state": "not_replied",
        "sns_signal_only": false
      },
      "contact_state": {
        "unanswered_user_message_count": 1,
        "elapsed_since_latest_user_message_minutes": null,
        "usual_cadence_relation": "unknown"
      },
      "boundary_state": {
        "kind": "none",
        "status": "none",
        "repeated_unanswered_contact": false
      },
      "practical_reason": {
        "kind": "none",
        "active": false,
        "deadline": "none"
      },
      "user_contact_constraint": {
        "kind": "none",
        "status": "none",
        "supporting_fact_ids": []
      },
      "information_state": {
        "assessment_mode": "best_effort",
        "can_proceed_without_followup": true,
        "used_context_inference": false,
        "unresolved_fields": [
          "contact_state.elapsed_since_latest_user_message_minutes",
          "contact_state.usual_cadence_relation"
        ]
      }
    },
    "base_writing_signals": {
      "schema_version": "m2-p4-base-writing-signals-v1",
      "relationship_dimensions": {
        "romantic_stage": {
          "value": "ambiguous",
          "basis": "relationship_chip"
        },
        "social_role": {
          "value": "unknown",
          "basis": "unresolved"
        },
        "hierarchy": {
          "value": "unknown",
          "basis": "unresolved"
        },
        "familiarity": {
          "value": "unknown",
          "basis": "unresolved"
        },
        "communication_context": {
          "value": "unknown",
          "basis": "unresolved"
        },
        "observed_register": {
          "value": "unknown",
          "basis": "unresolved"
        }
      },
      "message_signals": [
        {
          "author": "user",
          "status": "sent_by_user"
        }
      ],
      "incoming_message_profile": {
        "dialogue_acts": [],
        "unanswered_obligations": [],
        "practical_requirements": [],
        "closure_signal": "none",
        "response_expectation": "none",
        "present": false
      },
      "user_goal_detail": {
        "value": "unknown",
        "basis": "unresolved"
      },
      "explicit_user_constraints": [],
      "communication_pattern": {
        "usual_register": "unknown",
        "usual_length": "unknown",
        "usual_emoji_pattern": "unknown",
        "usual_response_cadence_summary": null,
        "usual_initiator": "unknown",
        "reciprocal_style_summary": null,
        "basis": "current_situation_explicit"
      },
      "channel_and_timing": {
        "channel": "unknown",
        "relative_timing": "unknown",
        "basis": "unresolved"
      },
      "language_and_expression": {
        "primary_language": "ja",
        "mixed_languages": [],
        "dialect_or_regional_expression": "unknown",
        "established_shared_expression": "unknown",
        "intentional_nonstandard_expression": "unknown",
        "possible_typo": "unknown",
        "basis": "current_situation_explicit"
      },
      "repeat_consultation_state": {
        "state": "first_assessment",
        "changed_fact_ids": [],
        "basis": "current_situation_explicit"
      },
      "privacy_markers": [],
      "boundary_ownership_signals": []
    }
  },
  "plan": {
    "schema_version": "pipeline-schema-v2.0.0",
    "selected_decision": "wait_and_reassess",
    "decision_reason_fact_ids": [
      "F105",
      "F205",
      "F305",
      "F405"
    ],
    "possible_interpretations": [
      {
        "statement": "相手が通常の返信ペースの範囲で、まだ返信していないだけかもしれない。",
        "supporting_fact_ids": [
          "F205"
        ],
        "epistemic_status": "possibility_only"
      },
      {
        "statement": "相手の予定や都合により、返信できる状態ではないのかもしれない。",
        "supporting_fact_ids": [
          "F205"
        ],
        "epistemic_status": "possibility_only"
      },
      {
        "statement": "返信の必要性やタイミングについて、相手側で判断が保留されているのかもしれない。",
        "supporting_fact_ids": [
          "F205"
        ],
        "epistemic_status": "possibility_only"
      }
    ],
    "pre_action_check": {
      "check": "最初の質問を送ってからの経過時間と、普段の返信ペースが不明なため、今夜は追加送信の必要性を確定できないことを確認する。",
      "supporting_fact_ids": [
        "F105",
        "F205"
      ]
    },
    "actions_to_take": [
      "今夜は、すでに送った「週末は何をしているの？」への返信を待ち、追加の一通は送らない。",
      "返信の有無を何度も確認せず、自分の予定や休息に戻る。",
      "明日以降、経過時間と普段の返信ペースが分かった時点で、返信がない状態が通常範囲内かを見直す。"
    ],
    "actions_to_avoid": [
      "返信がない理由を相手の気持ちや関心の強さとして断定する。",
      "確認や催促だけを目的に、短時間で追加メッセージを重ねる。",
      "今後3日間の予定を、相手からの返信がある前提で固定する。"
    ],
    "recommended_message_draft": null,
    "message_draft_edit_metadata": null,
    "aftercare_plan": [
      {
        "phase": "tonight",
        "action": "追加連絡はせず、送信済みの質問への返信待ちとして、自分の予定や休息を優先する。",
        "avoid": "返信確認のための追加送信や、相手の意図の推測を続けない。",
        "supporting_fact_ids": [
          "F105",
          "F205",
          "F305"
        ]
      },
      {
        "phase": "next",
        "action": "明日以降の3日間は、返信が来る可能性を予定の前提にせず、自分の用事を通常どおり進める。返信が来た場合だけ、その内容に合わせて対応する。",
        "avoid": "返信がないことだけを根拠に、関係性や相手の意図を決めつけない。",
        "supporting_fact_ids": [
          "F205",
          "F405"
        ]
      },
      {
        "phase": "reassessment_condition",
        "action": "経過時間と普段の返信ペースが確認できる、または相手から返信が来るなど新しい事実が生じた時点で、追加連絡の必要性を見直す。",
        "avoid": "時間が経過したことだけを、追加連絡が許可される根拠にしない。",
        "supporting_fact_ids": [
          "F205",
          "F305"
        ]
      }
    ],
    "change_conditions": [
      {
        "condition": "相手から返信が届く。",
        "resulting_direction": "reply_now",
        "supporting_fact_ids": [
          "F205"
        ]
      },
      {
        "condition": "経過時間と普段の返信ペースが分かり、追加連絡が通常のやり取りとして適切だと確認できる。",
        "resulting_direction": "send_now",
        "supporting_fact_ids": [
          "F205",
          "F305"
        ]
      },
      {
        "condition": "追加連絡を控えるべき明確な境界や事情が新たに確認される。",
        "resulting_direction": "pause_additional_contact",
        "supporting_fact_ids": [
          "F305"
        ]
      }
    ],
    "review_timing": {
      "when": "今夜は追加送信をせず、明日以降の3日間の中で、返信・経過時間・普段の返信ペースのいずれかが確認できた時点で見直す。",
      "trigger_fact_ids": [
        "F205",
        "F305",
        "F405"
      ]
    },
    "material_unknowns": [
      {
        "unknown_code": "elapsed_time_unknown",
        "summary": "最初のメッセージからの経過時間が不明で、追加連絡の適切な時期を判断しにくい。",
        "material_to": "decision"
      },
      {
        "unknown_code": "usual_cadence_unknown",
        "summary": "普段の返信頻度が不明で、今回の未返信が通常範囲内か確認できない。",
        "material_to": "decision"
      },
      {
        "unknown_code": "other_person_intent_unknown",
        "summary": "未返信の理由や相手の意図は不明。",
        "material_to": "decision"
      }
    ],
    "model_generated_limitations": [
      "現時点で確認できる事実だけでは、返信時期や相手の意図は判断できない。"
    ]
  },
  "report": {
    "schema_version": "pipeline-schema-v2.0.0",
    "cover_line": "今夜は追加で動かず、未返信という事実だけを保ったまま判断を急がない時間です。",
    "short_letter": [
      "「もう一通送ってよいのか」と迷うのは、返事がない状態で次の動きを決めなければならないからですね。今の情報だけでは、相手の意図や返信の時期までは分かりません。",
      "ただ、すでに質問は一度届いており、短時間に重ねて確認する必要性も確定していません。今夜は追加送信をせず、自分の時間に戻る判断で大丈夫です。"
    ],
    "decision_reason_summary": "すでに「週末は何をしているの？」と一度質問を送っていて、現時点では返事がありません。経過時間や普段の返信ペースが不明なため、今夜は追加の一通を送らず、明日以降に新しい情報が出た時点で見直す方向が合っています。",
    "relationship_summary": null,
    "observed_fact_commentary": [
      {
        "fact_id": "F105",
        "commentary": "すでに具体的な質問を送っているため、現時点で伝えるべき内容を何も送れていない状態ではありません。"
      },
      {
        "fact_id": "F205",
        "commentary": "返事がないことは確認できますが、それだけでは相手の理由や気持ちまでは分かりません。未返信という事実と、その解釈を分けておくことが大切です。"
      },
      {
        "fact_id": "F305",
        "commentary": "追加で送るか迷っているからこそ、今すぐ確認を重ねるより、現在の一通に対する反応を待つほうが判断材料を増やしやすい状態です。"
      },
      {
        "fact_id": "F405",
        "commentary": "今後3日間の動きを整理したいという希望があるため、返信が来ることを予定の前提にせず、自分の予定を通常どおり進める形にしておくと動きがぶれにくくなります。"
      }
    ],
    "possible_interpretations": [
      "相手が普段の返信ペースの範囲で、まだ返信していない可能性があります。",
      "相手の予定や都合により、返信できる状態ではない可能性があります。",
      "返信の必要性やタイミングについて、相手側で判断が保留されている可能性があります。"
    ],
    "anxiety_reframe": [],
    "message_temperature": null,
    "action_rationales": [
      "今夜は、送信済みの質問への返信を待ち、追加の一通は送らないのが適切です。経過時間と普段の返信ペースが分からないため、追加送信を急ぐ根拠がまだありません。",
      "明日以降の3日間は、返信が来ることを予定の前提にせず、自分の用事や休息を通常どおり進めてください。返信が来た場合は、その内容が新しい判断材料になります。",
      "経過時間や普段の返信ペースが確認できる、または返信が来るなど新しい事実が生じた時点で、追加連絡の必要性を見直せます。時間が経ったことだけで、追加連絡が必要になるわけではありません。"
    ],
    "message_draft_context": null,
    "aftercare_commentary": [
      "今夜は追加連絡をせず、送った質問への返信待ちとして自分の予定や休息を優先します。明日以降の3日間は、返信を待つことと自分の生活を進めることを分けて考え、返信が来た場合だけ内容に合わせて対応します。経過時間や普段の返信ペースなど新しい事実が確認できた時点で、追加連絡の必要性を見直してください。"
    ],
    "change_condition_commentary": [],
    "closing_lines": [
      "今夜は、相手の意図や返信の時期まであなたが決めようとしなくて大丈夫です。"
    ]
  },
  "safety": {
    "classification": "normal_allowed",
    "reason_codes": [
      "none_selected"
    ],
    "response_mode": "none",
    "evidence_refs": [],
    "ambiguity_present": false
  },
  "sufficiency": {
    "schema_version": "pipeline-schema-v3.0.0",
    "acknowledged_eligibility": "ready"
  },
  "replacementText": "ただ、すでに質問は一度送っていて、短時間に重ねて確認する必要性も確定していません。今夜は追加送信をせず、自分の時間に戻る判断で大丈夫です。",
  "finding": {
    "finding_code": "FACT_FIDELITY",
    "severity": "major",
    "json_path": "report_content.short_letter[1]",
    "evidence_refs": [
      "F105"
    ],
    "detail": "AUTHORED OFFLINE FINDING: the source confirms sent and no reply; this single Report leaf incorrectly confirms delivery."
  }
};
