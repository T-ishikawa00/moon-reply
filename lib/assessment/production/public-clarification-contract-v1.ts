import type {
  JsonValue,
  ProductionClarificationTarget,
} from "../runtime/types.ts";

export const PUBLIC_CLARIFICATION_TARGETS_V1 = [
  "material_relationship_or_communication_concern",
  "latest_contact_timing",
  "usual_reply_cadence",
  "central_fear_or_decision_concern",
  "relationship_intent",
  "requested_message_tone",
  "original_message",
] as const satisfies readonly ProductionClarificationTarget[];

type PublicClarificationDetailControlV1 = Readonly<{
  label: string;
  maximumCharacters: 240 | 500 | 2000;
  visibleFor: "all" | readonly string[];
  requiredFor: readonly string[];
}>;

type PublicClarificationControlV1 = Readonly<{
  choices: readonly Readonly<{ value: string; label: string }>[];
  detail: PublicClarificationDetailControlV1 | null;
}>;

export const PUBLIC_CLARIFICATION_CONTROLS_V1 = {
  original_message: { choices: [], detail: { label: "元のメッセージ", maximumCharacters: 2000, visibleFor: "all", requiredFor: [""] } },
  material_relationship_or_communication_concern: {
    choices: [
      { value: "distance", label: "距離感" },
      { value: "affection_expression", label: "好意の伝わり方" },
      { value: "reply_pressure", label: "返信への圧" },
      { value: "other_material_concern", label: "その他の気がかり" },
      { value: "no_material_concern", label: "特になし" },
    ],
    detail: {
      label: "補足",
      maximumCharacters: 500,
      visibleFor: "all",
      requiredFor: [],
    },
  },
  latest_contact_timing: {
    choices: [
      { value: "less_than_6_hours", label: "6時間未満" },
      { value: "six_to_24_hours", label: "6〜24時間" },
      { value: "one_to_three_days", label: "1〜3日" },
      { value: "more_than_three_days", label: "3日より前" },
      { value: "unknown", label: "分からない" },
    ],
    detail: null,
  },
  usual_reply_cadence: {
    choices: [
      { value: "within_usual", label: "普段の範囲内" },
      { value: "beyond_usual", label: "普段より長い" },
      { value: "unknown", label: "分からない" },
    ],
    detail: null,
  },
  central_fear_or_decision_concern: {
    choices: [
      { value: "concern", label: "不安や迷いがある" },
      { value: "none", label: "今は特にない" },
    ],
    detail: {
      label: "いちばん不安なこと",
      maximumCharacters: 500,
      visibleFor: ["concern"],
      requiredFor: ["concern"],
    },
  },
  relationship_intent: {
    choices: [
      { value: "move_closer", label: "距離を近づけたい" },
      { value: "maintain_distance", label: "今の距離を保ちたい" },
      { value: "repair_conflict", label: "関係を修復したい" },
      { value: "decline_without_false_hope", label: "期待を持たせず断りたい" },
      { value: "end_contact", label: "連絡を終えたい" },
      { value: "express_affection", label: "好意を伝えたい" },
      { value: "clarify_relationship", label: "関係を明確にしたい" },
      { value: "unsure", label: "まだ決めきれない" },
    ],
    detail: {
      label: "補足",
      maximumCharacters: 500,
      visibleFor: "all",
      requiredFor: [],
    },
  },
  requested_message_tone: {
    choices: [
      { value: "polite", label: "丁寧" },
      { value: "neutral_polite", label: "自然な敬語" },
      { value: "casual", label: "親しみのある口調" },
      { value: "soft", label: "やわらかい" },
      { value: "direct", label: "率直" },
      { value: "brief", label: "短く簡潔" },
      { value: "playful", label: "少し明るく" },
      { value: "custom", label: "その他" },
    ],
    detail: {
      label: "補足",
      maximumCharacters: 240,
      visibleFor: "all",
      requiredFor: ["custom"],
    },
  },
} as const satisfies Record<
  ProductionClarificationTarget,
  PublicClarificationControlV1
>;

export type PublicClarificationDraftV1 = Readonly<{
  value: string;
  detail: string;
}>;

export function isPublicClarificationTargetV1(
  value: unknown,
): value is ProductionClarificationTarget {
  return (
    typeof value === "string" &&
    PUBLIC_CLARIFICATION_TARGETS_V1.some((target) => target === value)
  );
}

function normalizedDetail(value: string) {
  return value.replaceAll("\r\n", "\n").replaceAll("\r", "\n").trim();
}

function includesChoice(target: ProductionClarificationTarget, value: string) {
  return PUBLIC_CLARIFICATION_CONTROLS_V1[target].choices.some(
    (choice) => choice.value === value,
  );
}

export function publicClarificationDetailVisibleV1(
  target: ProductionClarificationTarget,
  value: string,
) {
  const detail = PUBLIC_CLARIFICATION_CONTROLS_V1[target].detail;
  return (
    detail !== null &&
    (detail.visibleFor === "all" ||
      (detail.visibleFor as readonly string[]).includes(value))
  );
}

export function publicClarificationDetailRequiredV1(
  target: ProductionClarificationTarget,
  value: string,
) {
  const detail = PUBLIC_CLARIFICATION_CONTROLS_V1[target].detail;
  return (
    detail !== null &&
    (detail.requiredFor as readonly string[]).includes(value)
  );
}

export function buildPublicClarificationAnswerV1(
  target: ProductionClarificationTarget,
  draft: PublicClarificationDraftV1,
): JsonValue | null {
  const value = draft.value.trim();
  const detail = normalizedDetail(draft.detail);
  const detailControl = PUBLIC_CLARIFICATION_CONTROLS_V1[target].detail;
  if (target === "original_message") return detail && [...detail].length <= 2000 ? { original_message: detail } : null;
  if (!value || !includesChoice(target, value)) return null;
  if (detailControl && detail.length > detailControl.maximumCharacters) {
    return null;
  }
  if (publicClarificationDetailRequiredV1(target, value) && !detail) return null;

  switch (target) {
    case "material_relationship_or_communication_concern":
    case "relationship_intent":
    case "requested_message_tone":
      return { choice: value, ...(detail ? { detail } : {}) };
    case "latest_contact_timing":
      return value === "unknown"
        ? { kind: "unknown" }
        : { kind: "elapsed_bucket", value };
    case "usual_reply_cadence":
      return value;
    case "central_fear_or_decision_concern":
      return value === "none"
        ? { kind: "none" }
        : { kind: "concern", value: detail };
  }
}

export type ClarificationContinuationDispositionV1 =
  | "purchase_ready"
  | "not_full_product_candidate"
  | "safety_blocked"
  | "technical_failure";

export function classifyClarificationContinuationV1(
  status: unknown,
): ClarificationContinuationDispositionV1 {
  if (
    status === "purchase_ready" ||
    status === "not_full_product_candidate" ||
    status === "safety_blocked"
  ) {
    return status;
  }
  return "technical_failure";
}
