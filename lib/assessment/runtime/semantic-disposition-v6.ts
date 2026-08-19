import type { DecisionFactsV2 } from "./contextual-inference-v3.ts";
import { buildRelationshipSummaryV3 } from "./report-grounding-v3.ts";
import { evaluateSemanticFindingsV5 } from "./semantic-disposition-v5.ts";
import type { JsonObject, SplitDecisionPlanV2, SplitReportContentV2 } from "./types.ts";

export const SEMANTIC_DISPOSITION_V6_VERSION =
  "m2-p4-semantic-disposition-v6" as const;

function normalizedPath(value: unknown) {
  return typeof value === "string" && value.startsWith("$.")
    ? value.slice(2)
    : value;
}

export function evaluateSemanticFindingsV6(input: {
  validationOutput: JsonObject;
  decisionPlan: SplitDecisionPlanV2;
  groundedReportContent: SplitReportContentV2;
  decisionFacts: DecisionFactsV2;
}) {
  const predecessor = evaluateSemanticFindingsV5(input);
  const expectedRelationshipSummary = buildRelationshipSummaryV3(
    input.decisionFacts,
  );
  const findingDispositions = predecessor.findingDispositions.map((item) =>
    normalizedPath(item.finding.json_path) ===
      "report_content.relationship_summary" &&
    input.groundedReportContent.relationship_summary === expectedRelationshipSummary
      ? {
          ...item,
          disposition: "ignored" as const,
          reason:
            "application_owned_relationship_summary_matches_base_direct_message",
        }
      : item,
  );
  const select = (
    disposition: "blocking" | "conditional" | "nonblocking" | "ignored",
  ) =>
    findingDispositions
      .filter((item) => item.disposition === disposition)
      .map((item) => item.finding);
  return {
    blockingFindings: select("blocking"),
    conditionalFindings: select("conditional"),
    nonblockingFindings: select("nonblocking"),
    ignoredTemporalFalsePositives: select("ignored"),
    findingDispositions,
  };
}
