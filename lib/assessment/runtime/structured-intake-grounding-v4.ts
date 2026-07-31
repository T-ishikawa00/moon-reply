import { groundStructuredIntakeV3 } from "./structured-intake-grounding-v3.ts";
import type { AssessmentInput, JsonObject } from "./types.ts";

const optionalMessageSource = "input:optional_message";

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function sortedUnique(values: string[]) {
  return [...new Set(values)].sort((left, right) =>
    left.localeCompare(right, "en"),
  );
}

function canonicalizeArrays(value: unknown, removeOptionalMessage: boolean): void {
  if (Array.isArray(value)) {
    for (const item of value) canonicalizeArrays(item, removeOptionalMessage);
    return;
  }
  if (!isObject(value)) return;

  for (const [key, child] of Object.entries(value)) {
    if (
      (key === "source_refs" ||
        key === "explicit_source_refs" ||
        key === "inferred_source_refs") &&
      Array.isArray(child) &&
      child.every((item) => typeof item === "string")
    ) {
      value[key] = sortedUnique(
        child.filter(
          (item) => !removeOptionalMessage || item !== optionalMessageSource,
        ),
      );
      continue;
    }
    if (
      (key === "privacy_markers" ||
        key === "unresolved_fields" ||
        key === "unresolved_writing_fields" ||
        key === "changed_fact_ids") &&
      Array.isArray(child) &&
      child.every((item) => typeof item === "string")
    ) {
      value[key] = sortedUnique(child);
      continue;
    }
    canonicalizeArrays(child, removeOptionalMessage);
  }
}

function collectNestedSourceRefs(
  value: unknown,
  result: string[],
  writingContextRoot: Record<string, unknown>,
): void {
  if (Array.isArray(value)) {
    for (const item of value) {
      collectNestedSourceRefs(item, result, writingContextRoot);
    }
    return;
  }
  if (!isObject(value)) return;

  for (const [key, child] of Object.entries(value)) {
    if (
      key === "source_refs" &&
      value !== writingContextRoot &&
      Array.isArray(child)
    ) {
      for (const item of child) {
        if (typeof item === "string") result.push(item);
      }
      continue;
    }
    collectNestedSourceRefs(child, result, writingContextRoot);
  }
}

function canonicalizeCandidate(
  writingContext: Record<string, unknown>,
  candidatePresent: boolean,
) {
  const ownership = writingContext.message_ownership;
  if (!candidatePresent) {
    writingContext.candidate_style_profile = null;
    writingContext.candidate_communicative_intent = null;
    if (Array.isArray(ownership)) {
      writingContext.message_ownership = ownership.filter(
        (item) => !isObject(item) || item.status !== "unsent_candidate",
      );
    }
    return;
  }

  for (const key of [
    "candidate_style_profile",
    "candidate_communicative_intent",
  ]) {
    const profile = writingContext[key];
    if (isObject(profile)) {
      profile.evidence_state = "explicit";
      profile.source_refs = [optionalMessageSource];
    }
  }

  if (Array.isArray(ownership)) {
    const candidates = ownership.filter(
      (item): item is Record<string, unknown> =>
        isObject(item) && item.status === "unsent_candidate",
    );
    if (candidates.length === 1) {
      candidates[0].author = "user";
      candidates[0].evidence_state = "explicit";
      candidates[0].source_refs = [optionalMessageSource];
    }
  }
}

export function groundStructuredIntakeV4(
  request: AssessmentInput,
  rawStructuredIntake: JsonObject,
): JsonObject {
  // v3 owns every decision-material application fact. It clones first, so the
  // provider response retained by the caller remains an immutable audit input.
  const grounded = groundStructuredIntakeV3(
    request,
    rawStructuredIntake,
  ) as unknown as Record<string, unknown>;
  const writingContext = grounded.writing_context;
  if (!isObject(writingContext)) return grounded as JsonObject;

  const candidatePresent =
    request.optionalMessage !== null && request.optionalMessage.trim().length > 0;
  canonicalizeCandidate(writingContext, candidatePresent);
  canonicalizeArrays(writingContext, !candidatePresent);

  const nestedSourceRefs: string[] = [];
  collectNestedSourceRefs(writingContext, nestedSourceRefs, writingContext);
  writingContext.source_refs = sortedUnique(nestedSourceRefs);

  return grounded as JsonObject;
}
