import { M2RuntimeError } from "./errors.ts";
import type {
  JsonObject,
  SplitDecisionPlanV2,
  SplitReportContentV2,
} from "./types.ts";

export const QUALITY_REASSESSMENT_DIRECTIVE_V1_SCHEMA_VERSION =
  "m2-p4-quality-reassessment-directive-v1" as const;
export const QUALITY_REASSESSMENT_ATTEMPT_NUMBER = 2 as const;
export const QUALITY_REASSESSMENT_MAX_DEFECTS = 12 as const;

export const QUALITY_REASSESSMENT_FINDING_CODES = [
  "FACT_FIDELITY",
  "ASSUMPTION_AS_FACT",
  "DECISION_ALLOWED",
  "DECISION_REASON_SUPPORT",
  "MESSAGE_POLICY_CONSISTENCY",
  "ACTION_CONSISTENCY",
  "THREE_DAY_PLAN_CONSISTENCY",
  "UNSUPPORTED_CERTAINTY",
  "SAFETY_REGRESSION",
  "REQUIRED_SECTION_MEANING",
  "REVIEW_CONDITION_PRESENT",
  "TEMPLATE_GENERICITY",
  "BRAND_TONE",
  "REPETITION",
] as const;

export type QualityReassessmentFindingCode =
  (typeof QUALITY_REASSESSMENT_FINDING_CODES)[number];
export type QualityReassessmentSeverity = "critical" | "major" | "minor";
export type QualityReassessmentScope = "report_only" | "plan_and_report";
export type QualityReassessmentSource =
  | "pb06_semantic_findings"
  | "local_semantic_shape"
  | "local_selected_request_completeness";

const repairRequirementByFindingCode = {
  FACT_FIDELITY: "RESTORE_FACT_FIDELITY",
  ASSUMPTION_AS_FACT: "REMOVE_UNSUPPORTED_ASSUMPTION",
  DECISION_ALLOWED: "RESTORE_ALLOWED_DECISION",
  DECISION_REASON_SUPPORT: "RESTORE_DECISION_SUPPORT",
  MESSAGE_POLICY_CONSISTENCY: "RESTORE_MESSAGE_POLICY_CONSISTENCY",
  ACTION_CONSISTENCY: "RESTORE_ACTION_CONSISTENCY",
  THREE_DAY_PLAN_CONSISTENCY: "RESTORE_THREE_DAY_PLAN_CONSISTENCY",
  UNSUPPORTED_CERTAINTY: "REMOVE_UNSUPPORTED_CERTAINTY",
  SAFETY_REGRESSION: "RESTORE_SAFETY_COMPLIANCE",
  REQUIRED_SECTION_MEANING: "RESTORE_REQUIRED_SECTION_MEANING",
  REVIEW_CONDITION_PRESENT: "RESTORE_OBSERVABLE_REASSESSMENT",
  TEMPLATE_GENERICITY: "RESTORE_CONSULTATION_SPECIFICITY",
  BRAND_TONE: "RESTORE_BRAND_TONE",
  REPETITION: "RESTORE_DISTINCT_PRODUCT_FUNCTIONS",
} as const satisfies Record<QualityReassessmentFindingCode, string>;

export type QualityReassessmentRepairRequirementCode =
  | (typeof repairRequirementByFindingCode)[QualityReassessmentFindingCode]
  | "REBUILD_REPORT_SEMANTIC_SHAPE";

export type QualityReassessmentDefectV1 = {
  findingCode: QualityReassessmentFindingCode | "PRODUCT_SEMANTIC_SHAPE";
  severity: QualityReassessmentSeverity;
  jsonPath: string;
  normalizedRepairRequirementCode: QualityReassessmentRepairRequirementCode;
};

export type QualityReassessmentDirectiveV1 = {
  schemaVersion: typeof QUALITY_REASSESSMENT_DIRECTIVE_V1_SCHEMA_VERSION;
  attemptNumber: typeof QUALITY_REASSESSMENT_ATTEMPT_NUMBER;
  scope: QualityReassessmentScope;
  source: QualityReassessmentSource;
  defects: QualityReassessmentDefectV1[];
};

const findingCodes = new Set<string>(QUALITY_REASSESSMENT_FINDING_CODES);
const severities = new Set<string>(["critical", "major", "minor"]);

type ProductPathRoot = "decision_plan" | "report_content";
type ProductPathSegment = string | number;
type ProductPathShape = {
  terminal: boolean;
  properties?: Readonly<Record<string, ProductPathShape>>;
  item?: ProductPathShape;
};
type ParsedProductPath = {
  root: ProductPathRoot;
  segments: ProductPathSegment[];
};

const leafPathShape: ProductPathShape = { terminal: true };
const scalarArrayPathShape: ProductPathShape = {
  terminal: true,
  item: leafPathShape,
};
const factIdsPathShape = scalarArrayPathShape;
const possibleInterpretationPathShape: ProductPathShape = {
  terminal: true,
  item: {
    terminal: true,
    properties: {
      statement: leafPathShape,
      supporting_fact_ids: factIdsPathShape,
      epistemic_status: leafPathShape,
    },
  },
};
const preActionCheckPathShape: ProductPathShape = {
  terminal: true,
  properties: {
    check: leafPathShape,
    supporting_fact_ids: factIdsPathShape,
  },
};
const recommendedMessageDraftPathShape: ProductPathShape = {
  terminal: true,
  properties: {
    text: leafPathShape,
    policy: leafPathShape,
    use_timing: leafPathShape,
  },
};
const styleDeltaPathShape: ProductPathShape = {
  terminal: true,
  item: {
    terminal: true,
    properties: {
      dimension: leafPathShape,
      change: leafPathShape,
      reason: leafPathShape,
    },
  },
};
const communicativeIntentDeltaPathShape: ProductPathShape = {
  terminal: true,
  properties: {
    gratitude_change: leafPathShape,
    apology_change: leafPathShape,
    question_count_delta: leafPathShape,
    invitation_presence_delta: leafPathShape,
    invitation_specificity_delta: leafPathShape,
    affection_strength_delta: leafPathShape,
    commitment_strength_delta: leafPathShape,
    response_pressure_delta: leafPathShape,
    boundary_strength_delta: leafPathShape,
    closure_intent_delta: leafPathShape,
    practical_requirement_fulfillment: leafPathShape,
  },
};
const messageDraftEditMetadataPathShape: ProductPathShape = {
  terminal: true,
  properties: {
    source_status: leafPathShape,
    preserved_meaning: leafPathShape,
    style_delta: styleDeltaPathShape,
    communicative_intent_delta: communicativeIntentDeltaPathShape,
    change_reasons: scalarArrayPathShape,
    change_summary: leafPathShape,
  },
};
const aftercarePlanPathShape: ProductPathShape = {
  terminal: true,
  item: {
    terminal: true,
    properties: {
      phase: leafPathShape,
      action: leafPathShape,
      avoid: leafPathShape,
      supporting_fact_ids: factIdsPathShape,
    },
  },
};
const changeConditionsPathShape: ProductPathShape = {
  terminal: true,
  item: {
    terminal: true,
    properties: {
      condition: leafPathShape,
      resulting_direction: leafPathShape,
      supporting_fact_ids: factIdsPathShape,
    },
  },
};
const reviewTimingPathShape: ProductPathShape = {
  terminal: true,
  properties: {
    when: leafPathShape,
    trigger_fact_ids: factIdsPathShape,
  },
};
const materialUnknownsPathShape: ProductPathShape = {
  terminal: true,
  item: {
    terminal: true,
    properties: {
      unknown_code: leafPathShape,
      summary: leafPathShape,
      material_to: leafPathShape,
    },
  },
};
const observedFactCommentaryPathShape: ProductPathShape = {
  terminal: true,
  item: {
    terminal: true,
    properties: {
      fact_id: leafPathShape,
      commentary: leafPathShape,
    },
  },
};
const messageTemperaturePathShape: ProductPathShape = {
  terminal: true,
  properties: {
    softness: leafPathShape,
    affection: leafPathShape,
    pressure: leafPathShape,
    adjustment: leafPathShape,
  },
};

const productPathShapes: Readonly<Record<ProductPathRoot, ProductPathShape>> = {
  decision_plan: {
    terminal: false,
    properties: {
      selected_decision: leafPathShape,
      decision_reason_fact_ids: factIdsPathShape,
      possible_interpretations: possibleInterpretationPathShape,
      pre_action_check: preActionCheckPathShape,
      actions_to_take: scalarArrayPathShape,
      actions_to_avoid: scalarArrayPathShape,
      recommended_message_draft: recommendedMessageDraftPathShape,
      message_draft_edit_metadata: messageDraftEditMetadataPathShape,
      aftercare_plan: aftercarePlanPathShape,
      change_conditions: changeConditionsPathShape,
      review_timing: reviewTimingPathShape,
      material_unknowns: materialUnknownsPathShape,
      model_generated_limitations: scalarArrayPathShape,
    },
  },
  report_content: {
    terminal: false,
    properties: {
      cover_line: leafPathShape,
      short_letter: scalarArrayPathShape,
      decision_reason_summary: leafPathShape,
      observed_fact_commentary: observedFactCommentaryPathShape,
      possible_interpretations: scalarArrayPathShape,
      anxiety_reframe: scalarArrayPathShape,
      message_temperature: messageTemperaturePathShape,
      action_rationales: scalarArrayPathShape,
      message_draft_context: leafPathShape,
      aftercare_commentary: scalarArrayPathShape,
      closing_lines: scalarArrayPathShape,
    },
  },
};

function normalizeOwnedJsonPath(value: unknown) {
  if (typeof value !== "string" || value.length === 0 || value.length > 300) {
    return null;
  }
  return value.startsWith("$.") ? value.slice(2) : value;
}

function isIdentifierStart(charCode: number) {
  return (
    (charCode >= 65 && charCode <= 90) ||
    (charCode >= 97 && charCode <= 122)
  );
}

function isIdentifierContinue(charCode: number) {
  return (
    isIdentifierStart(charCode) ||
    (charCode >= 48 && charCode <= 57) ||
    charCode === 95
  );
}

function readIdentifier(value: string, start: number) {
  if (start >= value.length || !isIdentifierStart(value.charCodeAt(start))) {
    return null;
  }
  let end = start + 1;
  while (
    end < value.length &&
    isIdentifierContinue(value.charCodeAt(end))
  ) {
    end += 1;
  }
  return { identifier: value.slice(start, end), end };
}

function parseProductJsonPath(path: string): ParsedProductPath | null {
  const rootToken = readIdentifier(path, 0);
  if (
    rootToken === null ||
    (rootToken.identifier !== "decision_plan" &&
      rootToken.identifier !== "report_content")
  ) {
    return null;
  }
  const segments: ProductPathSegment[] = [];
  let cursor = rootToken.end;
  while (cursor < path.length) {
    if (segments.length >= 32) return null;
    const delimiter = path[cursor];
    if (delimiter === ".") {
      const property = readIdentifier(path, cursor + 1);
      if (property === null) return null;
      segments.push(property.identifier);
      cursor = property.end;
      continue;
    }
    if (delimiter !== "[") return null;
    const digitsStart = cursor + 1;
    let digitsEnd = digitsStart;
    while (
      digitsEnd < path.length &&
      path.charCodeAt(digitsEnd) >= 48 &&
      path.charCodeAt(digitsEnd) <= 57
    ) {
      digitsEnd += 1;
    }
    if (
      digitsEnd === digitsStart ||
      path[digitsEnd] !== "]" ||
      (path[digitsStart] === "0" && digitsEnd - digitsStart > 1)
    ) {
      return null;
    }
    const index = Number(path.slice(digitsStart, digitsEnd));
    if (!Number.isSafeInteger(index)) return null;
    segments.push(index);
    cursor = digitsEnd + 1;
  }
  return {
    root: rootToken.identifier,
    segments,
  };
}

function pathOwnership(path: ParsedProductPath): "report" | "plan" | null {
  let shape: ProductPathShape | undefined = productPathShapes[path.root];
  for (const segment of path.segments) {
    if (typeof segment === "number") {
      shape = shape.item;
    } else {
      if (
        shape.properties === undefined ||
        !hasOwn(shape.properties, segment)
      ) {
        return null;
      }
      shape = shape.properties[segment];
    }
    if (shape === undefined) return null;
  }
  if (!shape.terminal) return null;
  return path.root === "decision_plan" ? "plan" : "report";
}

function hasOwn(value: object, key: string | number) {
  return Object.prototype.hasOwnProperty.call(value, key);
}

function resolvesAgainstCurrentProduct(
  path: ParsedProductPath,
  decisionPlan: SplitDecisionPlanV2,
  reportContent: SplitReportContentV2,
) {
  let current: unknown =
    path.root === "decision_plan" ? decisionPlan : reportContent;
  for (const segment of path.segments) {
    if (typeof segment === "number") {
      if (!Array.isArray(current) || !hasOwn(current, segment)) return false;
      current = current[segment];
      continue;
    }
    if (
      current === null ||
      typeof current !== "object" ||
      Array.isArray(current) ||
      !hasOwn(current, segment)
    ) {
      return false;
    }
    current = (current as Record<string, unknown>)[segment];
  }
  return true;
}

function sanitizeFinding(
  value: JsonObject,
  decisionPlan: SplitDecisionPlanV2,
  reportContent: SplitReportContentV2,
) {
  const findingCode = value.finding_code;
  const severity = value.severity;
  const jsonPath = normalizeOwnedJsonPath(value.json_path);
  if (
    typeof findingCode !== "string" ||
    !findingCodes.has(findingCode) ||
    typeof severity !== "string" ||
    !severities.has(severity) ||
    jsonPath === null
  ) {
    return null;
  }
  const parsedPath = parseProductJsonPath(jsonPath);
  if (parsedPath === null) return null;
  const ownership = pathOwnership(parsedPath);
  if (
    ownership === null ||
    !resolvesAgainstCurrentProduct(parsedPath, decisionPlan, reportContent)
  ) {
    return null;
  }
  const typedFindingCode = findingCode as QualityReassessmentFindingCode;
  return {
    ownership,
    defect: {
      findingCode: typedFindingCode,
      severity: severity as QualityReassessmentSeverity,
      jsonPath,
      normalizedRepairRequirementCode:
        repairRequirementByFindingCode[typedFindingCode],
    } satisfies QualityReassessmentDefectV1,
  };
}

function defectSortKey(defect: QualityReassessmentDefectV1) {
  return [
    defect.jsonPath,
    defect.findingCode,
    defect.severity,
    defect.normalizedRepairRequirementCode,
  ].join("\u0000");
}

export function buildQualityReassessmentDirectiveV1(
  input: {
    blockingFindings: JsonObject[];
    decisionPlan: SplitDecisionPlanV2;
    reportContent: SplitReportContentV2;
  },
): QualityReassessmentDirectiveV1 | null {
  const { blockingFindings, decisionPlan, reportContent } = input;
  if (
    blockingFindings.length === 0 ||
    blockingFindings.length > QUALITY_REASSESSMENT_MAX_DEFECTS
  ) {
    return null;
  }
  const sanitized = blockingFindings.map((finding) =>
    sanitizeFinding(finding, decisionPlan, reportContent),
  );
  if (sanitized.some((entry) => entry === null)) return null;
  const entries = sanitized.filter((entry) => entry !== null);
  const deduplicated = new Map<string, QualityReassessmentDefectV1>();
  for (const entry of entries) {
    deduplicated.set(defectSortKey(entry.defect), entry.defect);
  }
  const defects = [...deduplicated.values()].sort((left, right) =>
    defectSortKey(left).localeCompare(defectSortKey(right)),
  );
  if (defects.length === 0 || defects.length > QUALITY_REASSESSMENT_MAX_DEFECTS) {
    return null;
  }
  return {
    schemaVersion: QUALITY_REASSESSMENT_DIRECTIVE_V1_SCHEMA_VERSION,
    attemptNumber: QUALITY_REASSESSMENT_ATTEMPT_NUMBER,
    scope: entries.some((entry) => entry.ownership === "plan")
      ? "plan_and_report"
      : "report_only",
    source: "pb06_semantic_findings",
    defects,
  };
}

export function buildLocalSemanticShapeReassessmentDirectiveV1(): QualityReassessmentDirectiveV1 {
  return {
    schemaVersion: QUALITY_REASSESSMENT_DIRECTIVE_V1_SCHEMA_VERSION,
    attemptNumber: QUALITY_REASSESSMENT_ATTEMPT_NUMBER,
    scope: "report_only",
    source: "local_semantic_shape",
    defects: [
      {
        findingCode: "PRODUCT_SEMANTIC_SHAPE",
        severity: "major",
        jsonPath: "report_content",
        normalizedRepairRequirementCode: "REBUILD_REPORT_SEMANTIC_SHAPE",
      },
    ],
  };
}

export class QualityReassessmentRequiredSignalV1 extends M2RuntimeError {
  readonly directive: QualityReassessmentDirectiveV1;

  constructor(directive: QualityReassessmentDirectiveV1) {
    super("M2_PRODUCT_QUALITY_REASSESSMENT_REQUIRED");
    this.name = "QualityReassessmentRequiredSignalV1";
    this.directive = structuredClone(directive);
  }
}

export function isQualityReassessmentRequiredSignalV1(
  error: unknown,
): error is QualityReassessmentRequiredSignalV1 {
  return error instanceof QualityReassessmentRequiredSignalV1;
}
