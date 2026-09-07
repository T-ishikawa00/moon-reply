import { M2RuntimeError } from "./errors.ts";
import { hashJson } from "./hash.ts";
import type {
  JsonObject,
  SplitDecisionPlanV2,
  SplitReportContentV2,
} from "./types.ts";

export const REPORT_FACT_REPAIR_SCHEMA_VERSION_V1 = "report-fact-repair-v1" as const;
export const REPORT_FACT_REPAIR_CHECKS_V1 = [
  "fact_source_integrity",
  "input_fidelity",
  "meaning_preservation",
  "direction_consistency",
  "action_consistency",
  "safety",
] as const;

type FindingDisposition = {
  finding: JsonObject;
  disposition: string;
  reason?: string;
};
type RepairTarget = {
  path: string;
  field: "short_letter" | "observed_fact_commentary";
  index: number;
};

export type ReportFactRepairContextV1 = {
  readonly schemaVersion: "report-fact-repair-context-v1";
  readonly sourceReportContent: SplitReportContentV2;
  readonly sourceGroundedReportContent: SplitReportContentV2;
  readonly sourceDecisionPlan: SplitDecisionPlanV2;
  readonly sourceBaseStructuredIntake: JsonObject;
  readonly sourceReportHash: string;
  readonly sourceGroundedReportHash: string;
  readonly sourcePlanHash: string;
  readonly sourceBaseHash: string;
  readonly targetPath: string;
  readonly originalText: string;
  readonly evidenceFactIds: string[];
  readonly finding: JsonObject;
};

const factCodes = new Set(["FACT_FIDELITY", "ASSUMPTION_AS_FACT", "UNSUPPORTED_CERTAINTY"]);
const editorialCodes = new Set(["BRAND_TONE", "TEMPLATE_GENERICITY", "REPETITION"]);
const dispositions = new Set(["blocking", "conditional", "nonblocking", "ignored"]);
const factId = /^F[0-9]{3}$/u;

function isObject(value: unknown): value is JsonObject {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function exactKeys(value: JsonObject, keys: readonly string[]) {
  return Object.keys(value).length === keys.length && keys.every((key) => Object.hasOwn(value, key));
}

function sameEvidenceIds(value: unknown, expected: readonly string[]) {
  return Array.isArray(value) && value.length === expected.length &&
    value.every((id): id is string => typeof id === "string" && factId.test(id)) &&
    new Set(value).size === value.length &&
    hashJson([...value].sort()) === hashJson([...expected].sort());
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object") {
    for (const child of Object.values(value)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}

function canonicalPath(value: unknown) {
  return typeof value === "string" ? value.replace(/^\$\./u, "") : "";
}

function targetAt(path: string): RepairTarget | null {
  const letter = /^report_content\.short_letter\[(0|[1-9]\d*)\]$/u.exec(path);
  const commentary = /^report_content\.observed_fact_commentary\[(0|[1-9]\d*)\]\.commentary$/u.exec(path);
  const match = letter ?? commentary;
  if (!match || !Number.isSafeInteger(Number(match[1]))) return null;
  return {
    path,
    field: letter ? "short_letter" : "observed_fact_commentary",
    index: Number(match[1]),
  };
}

function targetText(report: SplitReportContentV2, target: RepairTarget): string | null {
  const values = report[target.field];
  if (!Array.isArray(values) || target.index >= values.length) return null;
  const item = values[target.index];
  const text = target.field === "short_letter" ? item : isObject(item) ? item.commentary : null;
  return typeof text === "string" && text.trim().length > 0 ? text : null;
}

function replaceTarget(report: SplitReportContentV2, target: RepairTarget, replacement: string) {
  const result = structuredClone(report);
  if (target.field === "short_letter") result.short_letter[target.index] = replacement;
  else result.observed_fact_commentary[target.index].commentary = replacement;
  return result;
}

function validDisposition(item: FindingDisposition) {
  return isObject(item?.finding) && dispositions.has(item.disposition) &&
    ["critical", "major", "minor"].includes(String(item.finding.severity)) &&
    typeof item.finding.finding_code === "string" &&
    typeof item.finding.json_path === "string" &&
    typeof item.finding.detail === "string" && item.finding.detail.trim().length > 0 &&
    Array.isArray(item.finding.evidence_refs) &&
    item.finding.evidence_refs.every((ref) => typeof ref === "string");
}

function isMaterialReportFact(item: FindingDisposition) {
  return item.disposition !== "ignored" && factCodes.has(String(item.finding.finding_code)) &&
    (item.finding.severity === "major" || item.finding.severity === "critical") &&
    /^report_content(?:\.|\[|$)/u.test(canonicalPath(item.finding.json_path));
}

// A routing signal, never a deliverability decision. An out-of-scope material
// Report fact finding must not fall back to full-Report regeneration.
export function hasMaterialReportFactFindingV1(items: readonly FindingDisposition[]) {
  return items.some((item) => isObject(item?.finding) && isMaterialReportFact(item));
}

function isRetainableEditorialFinding(item: FindingDisposition, report: SplitReportContentV2) {
  if (item.disposition !== "nonblocking" || item.finding.severity !== "minor" ||
      !editorialCodes.has(String(item.finding.finding_code))) return false;
  const path = canonicalPath(item.finding.json_path);
  // Retain only existing Provider-owned text, with an explicit explanation.
  // No Plan, draft, Application-owned field, unknown path, or material issue.
  const target = targetAt(path);
  if (target) return targetText(report, target) !== null;
  const scalar = /^report_content\.(cover_line|decision_reason_summary|message_draft_context)$/u.exec(path);
  if (scalar) return typeof report[scalar[1] as keyof SplitReportContentV2] === "string";
  const array = /^report_content\.(possible_interpretations|anxiety_reframe|action_rationales|aftercare_commentary|closing_lines)\[(0|[1-9]\d*)\]$/u.exec(path);
  if (!array) return false;
  const value = report[array[1] as keyof SplitReportContentV2];
  return Array.isArray(value) && typeof value[Number(array[2])] === "string";
}

function knownFacts(base: JsonObject) {
  if (!Array.isArray(base.observed_facts)) return null;
  const facts = new Map<string, JsonObject>();
  for (const value of base.observed_facts) {
    if (!isObject(value) || typeof value.fact_id !== "string" || !factId.test(value.fact_id) ||
        facts.has(value.fact_id) || typeof value.statement !== "string" || !value.statement.trim() ||
        !Array.isArray(value.source_refs) || value.source_refs.length === 0 ||
        !value.source_refs.every((ref) => typeof ref === "string" && /^input:[A-Za-z0-9_.-]+$/u.test(ref))) return null;
    facts.set(value.fact_id, value);
  }
  return facts;
}

export function buildReportFactRepairContextV1(input: {
  decisionPlan: SplitDecisionPlanV2;
  reportContent: SplitReportContentV2;
  groundedReportContent: SplitReportContentV2;
  baseStructuredIntake: JsonObject;
  findingDispositions: readonly FindingDisposition[];
  localDefects: readonly unknown[];
}): ReportFactRepairContextV1 | null {
  if (input.localDefects.length > 0 || !input.findingDispositions.every(validDisposition)) return null;
  const material = input.findingDispositions.filter(isMaterialReportFact);
  if (material.length !== 1) return null;
  const selected = material[0];
  if (input.findingDispositions.some((item) => item !== selected && item.disposition !== "ignored" &&
      !isRetainableEditorialFinding(item, input.groundedReportContent))) return null;
  const target = targetAt(canonicalPath(selected.finding.json_path));
  if (!target) return null;
  const originalText = targetText(input.reportContent, target);
  if (!originalText || originalText !== targetText(input.groundedReportContent, target)) return null;
  const facts = knownFacts(input.baseStructuredIntake);
  const refs = selected.finding.evidence_refs;
  // This initial contract repairs only a claim explicitly bound to known Base
  // facts, not inferred Candidate/clarification/policy ownership.
  if (!facts || !Array.isArray(refs) || refs.length === 0 ||
      !refs.every((ref): ref is string => typeof ref === "string" && facts.has(ref)) ||
      new Set(refs).size !== refs.length) return null;
  if (target.field === "observed_fact_commentary" &&
      !refs.includes(input.reportContent.observed_fact_commentary[target.index].fact_id)) return null;
  const sourceReportContent = structuredClone(input.reportContent);
  const sourceGroundedReportContent = structuredClone(input.groundedReportContent);
  const sourceDecisionPlan = structuredClone(input.decisionPlan);
  const sourceBaseStructuredIntake = structuredClone(input.baseStructuredIntake);
  return deepFreeze({
    schemaVersion: "report-fact-repair-context-v1",
    sourceReportContent,
    sourceGroundedReportContent,
    sourceDecisionPlan,
    sourceBaseStructuredIntake,
    sourceReportHash: hashJson(sourceReportContent),
    sourceGroundedReportHash: hashJson(sourceGroundedReportContent),
    sourcePlanHash: hashJson(sourceDecisionPlan),
    sourceBaseHash: hashJson(sourceBaseStructuredIntake),
    targetPath: target.path,
    originalText,
    evidenceFactIds: [...refs].sort(),
    finding: structuredClone(selected.finding),
  });
}

function assertContext(context: ReportFactRepairContextV1, plan: SplitDecisionPlanV2, base: JsonObject) {
  if (context.schemaVersion !== "report-fact-repair-context-v1" ||
      hashJson(context.sourceReportContent) !== context.sourceReportHash ||
      hashJson(context.sourceGroundedReportContent) !== context.sourceGroundedReportHash ||
      hashJson(context.sourceDecisionPlan) !== context.sourcePlanHash ||
      hashJson(context.sourceBaseStructuredIntake) !== context.sourceBaseHash ||
      hashJson(plan) !== context.sourcePlanHash || hashJson(base) !== context.sourceBaseHash) {
    throw new M2RuntimeError("M2_REPORT_FACT_REPAIR_SOURCE_MISMATCH");
  }
  const target = targetAt(context.targetPath);
  if (!target || targetText(context.sourceReportContent, target) !== context.originalText ||
      targetText(context.sourceGroundedReportContent, target) !== context.originalText) {
    throw new M2RuntimeError("M2_REPORT_FACT_REPAIR_SOURCE_MISMATCH");
  }
  return target;
}

export function buildReportFactRepairInputV1(
  context: ReportFactRepairContextV1,
  groundedRepairedReport?: SplitReportContentV2,
): JsonObject {
  const target = assertContext(context, context.sourceDecisionPlan, context.sourceBaseStructuredIntake);
  const result: JsonObject = {
    schema_version: context.schemaVersion,
    source_report_hash: context.sourceReportHash,
    source_grounded_report_hash: context.sourceGroundedReportHash,
    target_path: context.targetPath,
    original_text: context.originalText,
    evidence_fact_ids: [...context.evidenceFactIds],
    // Alleged discrepancy for review, not a new fact or authority to edit.
    selected_finding: structuredClone(context.finding),
    source_report: structuredClone(context.sourceReportContent),
  };
  if (groundedRepairedReport) {
    const text = targetText(groundedRepairedReport, target);
    if (!text) throw new M2RuntimeError("M2_REPORT_FACT_REPAIR_INVALID");
    result.report_hash = hashJson(groundedRepairedReport);
    result.verified_text = text;
  }
  return result;
}

export function applyReportFactRepairPatchV1(input: {
  context: ReportFactRepairContextV1;
  patch: JsonObject;
  decisionPlan: SplitDecisionPlanV2;
  baseStructuredIntake: JsonObject;
}): SplitReportContentV2 {
  const { context, patch } = input;
  const target = assertContext(context, input.decisionPlan, input.baseStructuredIntake);
  if (!isObject(patch) || !exactKeys(patch, ["schema_version", "source_report_hash", "target_path", "original_text", "replacement_text"]) ||
      patch.schema_version !== REPORT_FACT_REPAIR_SCHEMA_VERSION_V1 ||
      patch.source_report_hash !== context.sourceReportHash || patch.target_path !== context.targetPath ||
      patch.original_text !== context.originalText || typeof patch.replacement_text !== "string" ||
      !patch.replacement_text.trim() || [...patch.replacement_text].length > 700 ||
      patch.replacement_text.trim() === context.originalText.trim()) {
    throw new M2RuntimeError("M2_REPORT_FACT_REPAIR_INVALID");
  }
  return replaceTarget(context.sourceReportContent, target, patch.replacement_text);
}

export function assertReportFactRepairVerifiedV1(input: {
  context: ReportFactRepairContextV1;
  repairedReport: SplitReportContentV2;
  groundedRepairedReport: SplitReportContentV2;
  decisionPlan: SplitDecisionPlanV2;
  baseStructuredIntake: JsonObject;
  validationOutput: JsonObject;
  findingDispositions: readonly FindingDisposition[];
  localDefects: readonly unknown[];
}) {
  const { context } = input;
  const target = assertContext(context, input.decisionPlan, input.baseStructuredIntake);
  const text = targetText(input.repairedReport, target);
  const verification = input.validationOutput.report_fact_repair_verification;
  const checks = isObject(verification) ? verification.checks : null;
  const rawFindings = input.validationOutput.semantic_checks;
  if (!text || text.trim() === context.originalText.trim() || [...text].length > 700 ||
      text !== targetText(input.groundedRepairedReport, target) ||
      hashJson(replaceTarget(context.sourceReportContent, target, text)) !== hashJson(input.repairedReport) ||
      hashJson(replaceTarget(context.sourceGroundedReportContent, target, text)) !== hashJson(input.groundedRepairedReport) ||
      input.validationOutput.schema_version !== "validation-result-v19-l4-v1" ||
      !isObject(verification) || !exactKeys(verification, ["report_hash", "target_path", "verified_text", "evidence_fact_ids", "checks"]) ||
      verification.report_hash !== hashJson(input.groundedRepairedReport) ||
      verification.target_path !== context.targetPath || verification.verified_text !== text ||
      !sameEvidenceIds(verification.evidence_fact_ids, context.evidenceFactIds) ||
      !isObject(checks) || !exactKeys(checks, REPORT_FACT_REPAIR_CHECKS_V1) ||
      !REPORT_FACT_REPAIR_CHECKS_V1.every((key) => checks[key] === "pass") ||
      !Array.isArray(rawFindings) || rawFindings.length !== input.findingDispositions.length ||
      rawFindings.some((finding, index) => hashJson(finding) !== hashJson(input.findingDispositions[index].finding)) ||
      input.localDefects.length > 0 || !input.findingDispositions.every(validDisposition) ||
      input.findingDispositions.some((item) => item.disposition !== "ignored" &&
        !isRetainableEditorialFinding(item, input.groundedRepairedReport))) {
    throw new M2RuntimeError("M2_REPORT_FACT_REPAIR_VERIFICATION_FAILED");
  }
}

export class ReportFactRepairRequiredSignalV1 extends M2RuntimeError {
  readonly context: ReportFactRepairContextV1;

  constructor(context: ReportFactRepairContextV1) {
    super("M2_PRODUCT_QUALITY_REASSESSMENT_REQUIRED");
    this.name = "ReportFactRepairRequiredSignalV1";
    this.context = context;
  }
}

export function isReportFactRepairRequiredSignalV1(error: unknown): error is ReportFactRepairRequiredSignalV1 {
  return error instanceof ReportFactRepairRequiredSignalV1;
}
