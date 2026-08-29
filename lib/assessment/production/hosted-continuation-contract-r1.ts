import { isPublicClarificationTargetV1 } from "./public-clarification-contract-v1.ts";
import type {
  AuthenticatedPreparationStatusV1,
  PublicPreparationOutcome,
} from "./types.ts";

export const HOSTED_CONTINUATION_SCHEMA_VERSION =
  "hosted-continuation-r1" as const;
export const HOSTED_CONTINUATION_ENDPOINT =
  "/api/consultations/authenticated-preparation" as const;

export type HostedContinuationActionV1 = "status" | "execute" | "resolve";

export type HostedContinuationResponseV1 =
  | Readonly<{
      schemaVersion: typeof HOSTED_CONTINUATION_SCHEMA_VERSION;
      kind: "status";
      status: AuthenticatedPreparationStatusV1 | "authentication_required";
    }>
  | Readonly<{
      schemaVersion: typeof HOSTED_CONTINUATION_SCHEMA_VERSION;
      kind: "outcome";
      outcome: PublicPreparationOutcome;
    }>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isCapability(value: unknown): value is string {
  return typeof value === "string" && /^[A-Za-z0-9_-]{43}$/u.test(value);
}

function decodeOutcome(value: unknown): PublicPreparationOutcome | null {
  if (!isRecord(value) || typeof value.status !== "string") return null;
  if (
    value.status === "not_full_product_candidate" ||
    value.status === "safety_blocked"
  ) {
    return Object.keys(value).length === 1
      ? { status: value.status }
      : null;
  }
  if (
    value.status === "purchase_ready" &&
    Object.keys(value).length === 2 &&
    isCapability(value.preparationCapability)
  ) {
    return {
      status: "purchase_ready",
      preparationCapability: value.preparationCapability,
    };
  }
  if (
    value.status === "authentication_required" &&
    Object.keys(value).length === 2 &&
    isCapability(value.preparationCapability)
  ) {
    return {
      status: "authentication_required",
      preparationCapability: value.preparationCapability,
    };
  }
  if (
    value.status === "needs_one_clarifying_answer" &&
    Object.keys(value).length === 5 &&
    isCapability(value.clarificationCapability) &&
    isPublicClarificationTargetV1(value.target) &&
    typeof value.question === "string" &&
    value.question.length > 0 &&
    value.maximumQuestionsTotal === 1
  ) {
    return {
      status: "needs_one_clarifying_answer",
      clarificationCapability: value.clarificationCapability,
      target: value.target,
      question: value.question,
      maximumQuestionsTotal: 1,
    };
  }
  return null;
}

const statuses = new Set<
  AuthenticatedPreparationStatusV1 | "authentication_required"
>([
  "processing",
  "awaiting_clarification",
  "purchase_ready",
  "not_full_product_candidate",
  "safety_blocked",
  "failed",
  "authentication_required",
]);

export function decodeHostedContinuationResponseV1(
  value: unknown,
): HostedContinuationResponseV1 | null {
  if (
    !isRecord(value) ||
    value.schemaVersion !== HOSTED_CONTINUATION_SCHEMA_VERSION ||
    typeof value.kind !== "string"
  ) {
    return null;
  }
  if (
    value.kind === "status" &&
    Object.keys(value).length === 3 &&
    typeof value.status === "string" &&
    statuses.has(
      value.status as
        | AuthenticatedPreparationStatusV1
        | "authentication_required",
    )
  ) {
    return value as HostedContinuationResponseV1;
  }
  if (value.kind === "outcome" && Object.keys(value).length === 3) {
    const outcome = decodeOutcome(value.outcome);
    return outcome
      ? {
          schemaVersion: HOSTED_CONTINUATION_SCHEMA_VERSION,
          kind: "outcome",
          outcome,
        }
      : null;
  }
  return null;
}

export async function requestHostedContinuationV1(
  action: HostedContinuationActionV1,
  csrfToken: string,
  fetcher: typeof fetch = fetch,
): Promise<HostedContinuationResponseV1> {
  const response = await fetcher(HOSTED_CONTINUATION_ENDPOINT, {
    method: "POST",
    credentials: "same-origin",
    cache: "no-store",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, csrfToken }),
  });
  if (!response.ok) throw new Error("HOSTED_CONTINUATION_REQUEST_FAILED");
  const payload: unknown = await response.json();
  if (!isRecord(payload) || Object.keys(payload).length !== 1) {
    throw new Error("HOSTED_CONTINUATION_RESPONSE_INVALID");
  }
  const decoded = decodeHostedContinuationResponseV1(payload.data);
  if (!decoded) throw new Error("HOSTED_CONTINUATION_RESPONSE_INVALID");
  return decoded;
}

export function hostedStatusFromOutcomeV1(
  outcome: PublicPreparationOutcome,
): AuthenticatedPreparationStatusV1 | "authentication_required" {
  switch (outcome.status) {
    case "purchase_ready":
      return "purchase_ready";
    case "needs_one_clarifying_answer":
      return "awaiting_clarification";
    case "not_full_product_candidate":
    case "safety_blocked":
    case "authentication_required":
      return outcome.status;
  }
}
