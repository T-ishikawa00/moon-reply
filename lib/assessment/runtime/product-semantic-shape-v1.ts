import { M2RuntimeError } from "./errors.ts";
import type { SplitDecisionPlanV2, SplitReportContentV2 } from "./types.ts";

export const PRODUCT_SEMANTIC_SHAPE_V1_VERSION =
  "m2-p4-product-semantic-shape-v1" as const;
export const PRODUCT_SEMANTIC_SHAPE_V1_ERROR =
  "M2_PRODUCT_SEMANTIC_SHAPE_INVALID" as const;

type ProductTextLocation = {
  path: string;
  value: string;
};

export function normalizeProductSemanticShapeTextV1(value: string) {
  return value.replace(/\s+/gu, " ").trim();
}

function failProductSemanticShapeV1(): never {
  throw new M2RuntimeError(PRODUCT_SEMANTIC_SHAPE_V1_ERROR);
}

function indexedLocations(path: string, values: readonly string[]) {
  return values.map((value, index) => ({
    path: `${path}[${index}]`,
    value,
  }));
}

function primaryProviderTextLocations(reportContent: SplitReportContentV2) {
  return [
    { path: "report_content.cover_line", value: reportContent.cover_line },
    ...indexedLocations("report_content.short_letter", reportContent.short_letter),
    {
      path: "report_content.decision_reason_summary",
      value: reportContent.decision_reason_summary,
    },
    ...reportContent.observed_fact_commentary.map((item, index) => ({
      path: `report_content.observed_fact_commentary[${index}].commentary`,
      value: item.commentary,
    })),
    ...indexedLocations(
      "report_content.possible_interpretations",
      reportContent.possible_interpretations,
    ),
    ...indexedLocations(
      "report_content.anxiety_reframe",
      reportContent.anxiety_reframe,
    ),
    ...indexedLocations(
      "report_content.action_rationales",
      reportContent.action_rationales,
    ),
    ...(reportContent.message_draft_context === null
      ? []
      : [
          {
            path: "report_content.message_draft_context",
            value: reportContent.message_draft_context,
          },
        ]),
    ...indexedLocations(
      "report_content.aftercare_commentary",
      reportContent.aftercare_commentary,
    ),
    ...indexedLocations("report_content.closing_lines", reportContent.closing_lines),
  ] satisfies ProductTextLocation[];
}

function allProviderProseLocations(reportContent: SplitReportContentV2) {
  const messageTemperature = reportContent.message_temperature;
  return [
    ...primaryProviderTextLocations(reportContent),
    ...(messageTemperature === null
      ? []
      : [
          {
            path: "report_content.message_temperature.softness",
            value: messageTemperature.softness,
          },
          {
            path: "report_content.message_temperature.affection",
            value: messageTemperature.affection,
          },
          {
            path: "report_content.message_temperature.pressure",
            value: messageTemperature.pressure,
          },
          {
            path: "report_content.message_temperature.adjustment",
            value: messageTemperature.adjustment,
          },
        ]),
  ] satisfies ProductTextLocation[];
}

export function validateProductSemanticShapeV1({
  decisionPlan,
  reportContent,
}: {
  decisionPlan: SplitDecisionPlanV2;
  reportContent: SplitReportContentV2;
}) {
  const reasonFactIds = new Set(decisionPlan.decision_reason_fact_ids);
  if (
    !reportContent.observed_fact_commentary.some((item) =>
      reasonFactIds.has(item.fact_id),
    )
  ) {
    failProductSemanticShapeV1();
  }

  const primaryLocations = primaryProviderTextLocations(reportContent);
  const firstPathByText = new Map<string, string>();
  for (const location of primaryLocations) {
    const normalized = normalizeProductSemanticShapeTextV1(location.value);
    if (normalized.length === 0) continue;
    const firstPath = firstPathByText.get(normalized);
    if (firstPath !== undefined && firstPath !== location.path) {
      failProductSemanticShapeV1();
    }
    firstPathByText.set(normalized, location.path);
  }

  const actionTexts = new Set(
    [...decisionPlan.actions_to_take, ...decisionPlan.actions_to_avoid]
      .map(normalizeProductSemanticShapeTextV1)
      .filter(Boolean),
  );
  const emotionalLocations = [
    ...indexedLocations("report_content.short_letter", reportContent.short_letter),
    ...indexedLocations(
      "report_content.anxiety_reframe",
      reportContent.anxiety_reframe,
    ),
    ...indexedLocations("report_content.closing_lines", reportContent.closing_lines),
  ];
  if (
    emotionalLocations.some((location) =>
      actionTexts.has(normalizeProductSemanticShapeTextV1(location.value)),
    )
  ) {
    failProductSemanticShapeV1();
  }

  const draft = decisionPlan.recommended_message_draft;
  if (draft !== null) {
    const normalizedDraft = normalizeProductSemanticShapeTextV1(draft.text);
    if (
      normalizedDraft.length > 0 &&
      allProviderProseLocations(reportContent).some(
        (location) =>
          normalizeProductSemanticShapeTextV1(location.value) === normalizedDraft,
      )
    ) {
      failProductSemanticShapeV1();
    }
  }
}
