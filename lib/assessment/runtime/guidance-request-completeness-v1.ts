import type { ProductQualityDefectV2 } from "./quality-reassessment-v2.ts";
import type { RequestedTopic, SplitDecisionPlanV2, SplitReportContentV2 } from "./types.ts";

/** Candidate-only coverage of an explicitly purchased/requested time horizon.
 * This checks missing artifacts, not the semantic quality of prose or its length.
 */
export function evaluateGuidanceRequestCompletenessV1(input: {
  requestedTopics: readonly RequestedTopic[];
  decisionPlan: SplitDecisionPlanV2;
  reportContent: SplitReportContentV2;
}): ProductQualityDefectV2[] {
  if (!input.requestedTopics.includes("next_three_days")) return [];
  if (input.decisionPlan.aftercare_plan.length === 0) {
    // The expressly requested period has no plan at all. Repair the Plan first;
    // do not mistake a completely missing requested artifact for a style defect.
    return [{
      findingCode: "REQUIRED_SECTION_MEANING",
      severity: "critical",
      jsonPath: "decision_plan.aftercare_plan",
      normalizedRepairRequirementCode: "RESTORE_REQUIRED_SECTION_MEANING",
      ownership: "plan",
    }];
  }
  // One conditional/waiting policy may cover the requested period. Phase count
  // and a second explanation do not establish coverage. PB-06 reviews actual
  // meaning, omissions, unsupported schedules, and useful partial guidance.
  return [];
}
