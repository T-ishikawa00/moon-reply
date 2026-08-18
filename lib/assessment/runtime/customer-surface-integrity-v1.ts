import type { ProductQualityDefectV2 } from "./quality-reassessment-v2.ts";
import type { SplitDecisionPlanV2, SplitReportContentV2 } from "./types.ts";

export const CUSTOMER_SURFACE_INTEGRITY_V1_VERSION =
  "m2-p4-customer-surface-integrity-v1" as const;

export const CUSTOMER_SURFACE_INTERNAL_MARKERS_V1 = [
  /Decision Plan/u,
  /decision_plan/u,
  /report_content/u,
  /PB-0[1-6](?![0-9])/u,
  /quality_reassessment/u,
  /schema_version/u,
  /\bProvider\b/u,
  /\bRuntime\b/u,
] as const;

type Location = {
  path: string;
  value: string;
  ownership: "plan" | "report";
};

function indexed(
  path: string,
  values: readonly string[],
  ownership: Location["ownership"],
): Location[] {
  return values.map((value, index) => ({
    path: `${path}[${index}]`,
    value,
    ownership,
  }));
}

function planLocations(plan: SplitDecisionPlanV2): Location[] {
  const locations: Location[] = [
    {
      path: "decision_plan.pre_action_check.check",
      value: plan.pre_action_check.check,
      ownership: "plan",
    },
    ...plan.possible_interpretations.map((entry, index) => ({
      path: `decision_plan.possible_interpretations[${index}].statement`,
      value: entry.statement,
      ownership: "plan" as const,
    })),
    ...indexed("decision_plan.actions_to_take", plan.actions_to_take, "plan"),
    ...indexed("decision_plan.actions_to_avoid", plan.actions_to_avoid, "plan"),
    ...plan.aftercare_plan.flatMap((entry, index) => [
      {
        path: `decision_plan.aftercare_plan[${index}].action`,
        value: entry.action,
        ownership: "plan" as const,
      },
      ...(entry.avoid === null
        ? []
        : [
            {
              path: `decision_plan.aftercare_plan[${index}].avoid`,
              value: entry.avoid,
              ownership: "plan" as const,
            },
          ]),
    ]),
    ...plan.change_conditions.map((entry, index) => ({
      path: `decision_plan.change_conditions[${index}].condition`,
      value: entry.condition,
      ownership: "plan" as const,
    })),
    {
      path: "decision_plan.review_timing.when",
      value: plan.review_timing.when,
      ownership: "plan",
    },
    ...plan.material_unknowns.map((entry, index) => ({
      path: `decision_plan.material_unknowns[${index}].summary`,
      value: entry.summary,
      ownership: "plan" as const,
    })),
    ...indexed(
      "decision_plan.model_generated_limitations",
      plan.model_generated_limitations,
      "plan",
    ),
  ];
  if (
    plan.recommended_message_draft !== null &&
    plan.message_draft_edit_metadata?.source_status ===
      "generated_without_candidate"
  ) {
    locations.push({
      path: "decision_plan.recommended_message_draft.text",
      value: plan.recommended_message_draft.text,
      ownership: "plan",
    });
  }
  return locations;
}

function reportLocations(report: SplitReportContentV2): Location[] {
  const temperature = report.message_temperature;
  return [
    { path: "report_content.cover_line", value: report.cover_line, ownership: "report" },
    ...indexed("report_content.short_letter", report.short_letter, "report"),
    {
      path: "report_content.decision_reason_summary",
      value: report.decision_reason_summary,
      ownership: "report",
    },
    ...(report.relationship_summary === null
      ? []
      : [
          {
            path: "report_content.relationship_summary",
            value: report.relationship_summary,
            ownership: "report" as const,
          },
        ]),
    ...report.observed_fact_commentary.map((entry, index) => ({
      path: `report_content.observed_fact_commentary[${index}].commentary`,
      value: entry.commentary,
      ownership: "report" as const,
    })),
    ...indexed(
      "report_content.possible_interpretations",
      report.possible_interpretations,
      "report",
    ),
    ...indexed("report_content.anxiety_reframe", report.anxiety_reframe, "report"),
    ...(temperature === null
      ? []
      : [
          ...Object.entries(temperature).map(([key, value]) => ({
            path: `report_content.message_temperature.${key}`,
            value,
            ownership: "report" as const,
          })),
        ]),
    ...indexed("report_content.action_rationales", report.action_rationales, "report"),
    ...(report.message_draft_context === null
      ? []
      : [
          {
            path: "report_content.message_draft_context",
            value: report.message_draft_context,
            ownership: "report" as const,
          },
        ]),
    ...indexed(
      "report_content.aftercare_commentary",
      report.aftercare_commentary,
      "report",
    ),
    ...indexed(
      "report_content.change_condition_commentary",
      report.change_condition_commentary,
      "report",
    ),
    ...indexed("report_content.closing_lines", report.closing_lines, "report"),
  ];
}

export function evaluateCustomerSurfaceIntegrityV1(input: {
  decisionPlan: SplitDecisionPlanV2;
  reportContent: SplitReportContentV2;
}): ProductQualityDefectV2[] {
  return [...planLocations(input.decisionPlan), ...reportLocations(input.reportContent)]
    .filter((location) =>
      CUSTOMER_SURFACE_INTERNAL_MARKERS_V1.some((marker) =>
        marker.test(location.value),
      ),
    )
    .map((location) => ({
      findingCode: "CUSTOMER_SURFACE_INTEGRITY" as const,
      severity: "major" as const,
      jsonPath: location.path,
      normalizedRepairRequirementCode: "REMOVE_INTERNAL_IMPLEMENTATION_LANGUAGE",
      ownership: location.ownership,
    }));
}
