import type {
  AssessmentInput,
  JsonObject,
  JsonValue,
} from "./types.ts";

const restrictiveBoundaryKinds = new Set([
  "no_contact",
  "temporary_distance",
  "blocked_or_restricted",
  "relationship_closed",
]);

const applicationOwnedInferencePaths = new Set([
  "relationship_stage",
  "contact_state.proposed_message_present",
]);

const unresolvedRepresentations = new Map<string, unknown>([
  ["relationship_stage", "unknown"],
  ["latest_direct_message.sender", "unknown"],
  ["latest_direct_message.kind", "unknown"],
  ["latest_direct_message.response_expectation", "unknown"],
  ["latest_direct_message.user_reply_state", "unknown"],
  ["contact_state.unanswered_user_message_count", null],
  ["contact_state.elapsed_since_latest_user_message_minutes", null],
  ["contact_state.usual_cadence_relation", "unknown"],
  ["boundary_state.kind", "unknown"],
  ["boundary_state.status", "unknown"],
  ["practical_reason.kind", "unknown"],
  ["practical_reason.deadline", "unknown"],
]);

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function objects(value: unknown) {
  return Array.isArray(value) ? value.filter(isObject) : [];
}

function valueAtPath(root: Record<string, unknown>, fieldPath: string) {
  let selected: unknown = root;
  for (const segment of fieldPath.split(".")) {
    if (!isObject(selected)) return undefined;
    selected = selected[segment];
  }
  return selected;
}

function hasOwnedBoundarySignal(
  rawSignals: Record<string, unknown>,
  kind: string,
) {
  return objects(rawSignals.boundary_ownership_signals).some(
    (signal) =>
      signal.kind === kind &&
      signal.explicit === true &&
      (signal.asserted_by === "other_person" ||
        signal.asserted_by === "system"),
  );
}

function hasAnyOwnedRestrictiveBoundarySignal(
  rawSignals: Record<string, unknown>,
) {
  return objects(rawSignals.boundary_ownership_signals).some(
    (signal) =>
      restrictiveBoundaryKinds.has(String(signal.kind)) &&
      signal.explicit === true &&
      (signal.asserted_by === "other_person" ||
        signal.asserted_by === "system"),
  );
}

function hasExplicitNonBlockRestrictiveBoundary(boundaries: JsonValue) {
  return objects(boundaries).some(
    (boundary) =>
      boundary.kind !== "blocked_or_restricted" &&
      restrictiveBoundaryKinds.has(String(boundary.kind)) &&
      boundary.status === "explicit",
  );
}

function hasExplicitBlockedBoundary(boundaries: JsonValue) {
  return objects(boundaries).some(
    (boundary) =>
      boundary.kind === "blocked_or_restricted" &&
      boundary.status === "explicit",
  );
}

function recomputeUnresolvedFields(facts: Record<string, unknown>) {
  return [...unresolvedRepresentations.entries()]
    .filter(([fieldPath, unresolved]) =>
      Object.is(valueAtPath(facts, fieldPath), unresolved),
    )
    .map(([fieldPath]) => fieldPath)
    .sort((left, right) => left.localeCompare(right, "en"));
}

export function guardDecisionFactsWithEvidenceV4(
  request: AssessmentInput,
  decisionFacts: JsonObject,
  rawSignals: JsonObject,
  topLevelBoundaries: JsonValue = [],
  contextInferences: JsonValue = [],
): JsonObject {
  const guarded = structuredClone(decisionFacts) as unknown as Record<
    string,
    unknown
  >;
  const signals = rawSignals as unknown as Record<string, unknown>;

  guarded.relationship_stage = request.relationship;
  guarded.selected_requests = [...request.requestedTopics];

  const contact = guarded.contact_state;
  if (isObject(contact)) {
    contact.proposed_message_present =
      request.optionalMessage !== null && request.optionalMessage.trim().length > 0;
  }

  const boundary = guarded.boundary_state;
  if (isObject(boundary)) {
    const kind = typeof boundary.kind === "string" ? boundary.kind : "unknown";
    const status =
      typeof boundary.status === "string" ? boundary.status : "unknown";
    const supported =
      restrictiveBoundaryKinds.has(kind) &&
      (hasOwnedBoundarySignal(signals, kind) ||
        (kind === "blocked_or_restricted" &&
          hasExplicitBlockedBoundary(topLevelBoundaries)));
    if (restrictiveBoundaryKinds.has(kind) && !supported) {
      boundary.kind = "none";
      boundary.status = "none";
    }
    const observedBoundaryAbsent =
      kind === "unknown" &&
      status === "unknown" &&
      !hasAnyOwnedRestrictiveBoundarySignal(signals) &&
      !hasExplicitNonBlockRestrictiveBoundary(topLevelBoundaries) &&
      !hasExplicitBlockedBoundary(topLevelBoundaries);
    if (observedBoundaryAbsent) {
      boundary.kind = "none";
      boundary.status = "none";
    }
    if (
      supported &&
      (kind === "no_contact" ||
        kind === "relationship_closed" ||
        kind === "blocked_or_restricted") &&
      isObject(contact)
    ) {
      contact.usual_cadence_relation = "not_applicable";
    }
  }

  const information = guarded.information_state;
  if (isObject(information)) {
    const applicableInferences = objects(contextInferences).filter(
      (inference) =>
        typeof inference.field_path === "string" &&
        !applicationOwnedInferencePaths.has(inference.field_path),
    );
    information.used_context_inference = applicableInferences.length > 0;
    information.unresolved_fields = recomputeUnresolvedFields(guarded);
  }

  return guarded as JsonObject;
}
