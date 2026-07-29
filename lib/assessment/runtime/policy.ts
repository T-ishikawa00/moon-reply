import { M2RuntimeError } from "./errors.ts";
import type {
  AssessmentInput,
  Decision,
  DecisionPlan,
  JsonObject,
} from "./types.ts";

type SafetyClassification = "normal_allowed" | "needs_review" | "rejected";

export type SafetyResult = {
  classification: SafetyClassification;
  reason_codes: string[];
  response_mode:
    | "none"
    | "urgent_self_safety"
    | "urgent_other_safety"
    | "abuse_safety_support"
    | "unsafe_contact_stop"
    | "privacy_protection"
    | "minor_safeguarding"
    | "lawful_alternative";
};

export type DecisionPolicyResult = {
  schema_version: "pipeline-schema-v1.0.0";
  policy_version: "decision-policy-v1.0.0";
  allowed_decisions: Decision[];
  disallowed_decisions: Array<{
    decision: Decision;
    reason_codes: string[];
  }>;
  follow_up_exception: "none";
  message_draft_policy: "required_now" | "later_only" | "not_allowed";
  later_draft_mode:
    | "candidate_can_be_prepared"
    | "defer_until_reassessment"
    | null;
  pause_reason_code:
    | "explicit_no_contact"
    | "blocked_or_restricted"
    | "relationship_closed"
    | null;
  resume_policy: "explicit_permission_required" | "other_initiated_only" | null;
};

const decisions: Decision[] = [
  "reply_now",
  "send_now",
  "wait_and_reassess",
  "pause_additional_contact",
];

function responseModeFor(reasonCodes: string[]): SafetyResult["response_mode"] {
  if (reasonCodes.includes("self_harm")) return "urgent_self_safety";
  if (reasonCodes.includes("harm_others")) return "urgent_other_safety";
  if (reasonCodes.includes("dv_abuse_fear")) return "abuse_safety_support";
  if (reasonCodes.includes("doxxing") || reasonCodes.includes("third_party_secret")) {
    return "privacy_protection";
  }
  if (reasonCodes.includes("minor_related")) return "minor_safeguarding";
  if (reasonCodes.includes("illegal_conduct")) return "lawful_alternative";
  return reasonCodes.length > 0 ? "unsafe_contact_stop" : "none";
}

export function deterministicSafetyResult(input: AssessmentInput): SafetyResult {
  const text = `${input.currentSituation}\n${input.optionalMessage ?? ""}`
    .normalize("NFKC")
    .toLowerCase()
    .replace(/\s+/gu, "");
  const rules = [
    { code: "self_harm", severity: "rejected", terms: ["死にたい", "自分を傷つけ"] },
    { code: "harm_others", severity: "rejected", terms: ["殺したい", "相手を傷つけ"] },
    { code: "stalking_or_visit", severity: "rejected", terms: ["待ち伏せ", "押しかけ"] },
    { code: "threat_or_coercion", severity: "rejected", terms: ["脅迫", "強要"] },
    { code: "minor_related", severity: "rejected", terms: ["未成年", "18歳未満"] },
    { code: "doxxing", severity: "rejected", terms: ["住所を公開", "本名を公開", "晒す"] },
    { code: "surveillance", severity: "rejected", terms: ["監視", "居場所を確認"] },
    { code: "illegal_conduct", severity: "rejected", terms: ["違法な方法", "犯罪を手伝"] },
    { code: "third_party_secret", severity: "rejected", terms: ["第三者の秘密情報", "機密情報を使"] },
    { code: "dv_abuse_fear", severity: "needs_review", terms: ["dv", "モラハラ", "殴られ"] },
  ] as const;
  const matches = rules.filter((rule) =>
    rule.terms.some((term) => text.includes(term)),
  );
  const reasonCodes = matches.map((match) => match.code);
  const classification = matches.some((match) => match.severity === "rejected")
    ? "rejected"
    : matches.some((match) => match.severity === "needs_review")
      ? "needs_review"
      : "normal_allowed";
  return {
    classification,
    reason_codes: reasonCodes,
    response_mode: responseModeFor(reasonCodes),
  };
}

const safetyRank: Record<SafetyClassification, number> = {
  normal_allowed: 0,
  needs_review: 1,
  rejected: 2,
};

export function aggregateSafety(
  deterministic: SafetyResult,
  modelResult: JsonObject,
): SafetyResult {
  const modelClassification = modelResult.classification;
  if (
    modelClassification !== "normal_allowed" &&
    modelClassification !== "needs_review" &&
    modelClassification !== "rejected"
  ) {
    throw new M2RuntimeError("M2_SAFETY_OUTPUT_INVALID");
  }

  const strictest =
    safetyRank[deterministic.classification] >= safetyRank[modelClassification]
      ? deterministic.classification
      : modelClassification;
  const modelCodes = Array.isArray(modelResult.reason_codes)
    ? modelResult.reason_codes.filter(
        (value): value is string => typeof value === "string",
      )
    : [];
  const reasonCodes = [...new Set([...deterministic.reason_codes, ...modelCodes])];

  return {
    classification: strictest,
    reason_codes: reasonCodes,
    response_mode: responseModeFor(reasonCodes),
  };
}

function explicitBoundary(structuredIntake: JsonObject) {
  if (!Array.isArray(structuredIntake.boundaries)) return null;
  for (const boundary of structuredIntake.boundaries) {
    if (
      typeof boundary === "object" &&
      boundary !== null &&
      !Array.isArray(boundary) &&
      boundary.status === "explicit"
    ) {
      if (boundary.kind === "no_contact") return "explicit_no_contact" as const;
      if (boundary.kind === "blocked_or_restricted") {
        return "blocked_or_restricted" as const;
      }
      if (boundary.kind === "relationship_closed") {
        return "relationship_closed" as const;
      }
    }
  }
  return null;
}

export function buildDecisionPolicy(
  input: AssessmentInput,
  structuredIntake: JsonObject,
): DecisionPolicyResult {
  const boundary = explicitBoundary(structuredIntake);
  let selected: Decision;
  let messagePolicy: DecisionPolicyResult["message_draft_policy"];
  let laterDraftMode: DecisionPolicyResult["later_draft_mode"] = null;

  if (boundary) {
    selected = "pause_additional_contact";
    messagePolicy = "not_allowed";
  } else if (
    /返信|未読|既読|待|時間前|昨日|今夜/u.test(input.currentSituation)
  ) {
    selected = "wait_and_reassess";
    messagePolicy = "later_only";
    laterDraftMode = input.optionalMessage
      ? "defer_until_reassessment"
      : "candidate_can_be_prepared";
  } else if (input.requestedTopics.includes("draft_message")) {
    selected = "send_now";
    messagePolicy = "required_now";
  } else {
    selected = "reply_now";
    messagePolicy = "required_now";
  }

  return {
    schema_version: "pipeline-schema-v1.0.0",
    policy_version: "decision-policy-v1.0.0",
    allowed_decisions: [selected],
    disallowed_decisions: decisions
      .filter((decision) => decision !== selected)
      .map((decision) => ({
        decision,
        reason_codes: [boundary ? "explicit_boundary" : "decision_not_applicable"],
      })),
    follow_up_exception: "none",
    message_draft_policy: messagePolicy,
    later_draft_mode: laterDraftMode,
    pause_reason_code: boundary,
    resume_policy: boundary ? "explicit_permission_required" : null,
  };
}

export function validateDecisionPlanAgainstPolicy(
  plan: DecisionPlan,
  policy: DecisionPolicyResult,
) {
  if (!policy.allowed_decisions.includes(plan.selected_decision)) {
    throw new M2RuntimeError("M2_PLAN_POLICY_VIOLATION");
  }
  if (plan.selected_decision === "pause_additional_contact" && plan.message_draft) {
    throw new M2RuntimeError("M2_PLAN_POLICY_VIOLATION");
  }
  if (
    ["reply_now", "send_now"].includes(plan.selected_decision) &&
    (!plan.message_draft ||
      plan.message_draft.policy !== "required_now" ||
      plan.message_draft.use_timing !== "now")
  ) {
    throw new M2RuntimeError("M2_PLAN_POLICY_VIOLATION");
  }
}
