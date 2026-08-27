export const PREPARATION_RESPONSE_CORRELATION_HEADER =
  "x-moon-reply-preparation-correlation";
export const PREPARATION_RESPONSE_ATTEMPT_HEADER =
  "x-moon-reply-preparation-attempt";

export type PreparationResponseAttempt = 0 | 1;

export type PreparationResponseClassification =
  | "PURCHASE_READY"
  | "AUTHENTICATION_REQUIRED"
  | "NEEDS_ONE_CLARIFYING_ANSWER"
  | "NOT_FULL_PRODUCT_CANDIDATE"
  | "SAFETY_BLOCKED"
  | "HTTP_ERROR_WITH_SAFE_CODE"
  | "GATEWAY_HTTP_ERROR"
  | "HTTP_ERROR_WITHOUT_SAFE_CODE"
  | "RESPONSE_JSON_INVALID"
  | "FETCH_REJECTED";

export type PreparationResponseDiagnostic = Readonly<{
  correlationId: string;
  attempt: PreparationResponseAttempt;
  classification: PreparationResponseClassification;
  httpStatus: number | null;
  safeCode: string | null;
  elapsedMilliseconds: number;
}>;

type PreparationOutcome = Readonly<{ status: string }>;

type PreparationResponseRecoveryInput<TOutcome extends PreparationOutcome> =
  Readonly<{
    endpoint: "/api/consultations/prepare";
    serializedBody: string;
    idempotencyKey: string;
    correlationId: string;
    decodeOutcome: (value: unknown) => TOutcome | null;
    fetcher?: (
      input: RequestInfo | URL,
      init?: RequestInit,
    ) => Promise<Response>;
    observe?: (diagnostic: PreparationResponseDiagnostic) => void;
    now?: () => number;
  }>;

const correlationIdPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;
const safeCodePattern = /^[A-Z][A-Z0-9_]{2,127}$/u;
const gatewayStatusCodes = new Set([502, 503, 504]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isPreparationResponseCorrelationId(
  value: unknown,
): value is string {
  return typeof value === "string" && correlationIdPattern.test(value);
}

export function readPreparationResponseAttempt(
  value: unknown,
): PreparationResponseAttempt {
  return value === "1" ? 1 : 0;
}

export function readMoonReplyPreparationSafeCode(value: unknown) {
  if (!isRecord(value) || !isRecord(value.error)) return null;
  const code = value.error.code;
  return typeof code === "string" && safeCodePattern.test(code) ? code : null;
}

export function classifyPreparationOutcomeStatus(
  status: string,
): PreparationResponseClassification {
  switch (status) {
    case "purchase_ready":
      return "PURCHASE_READY";
    case "authentication_required":
      return "AUTHENTICATION_REQUIRED";
    case "needs_one_clarifying_answer":
      return "NEEDS_ONE_CLARIFYING_ANSWER";
    case "not_full_product_candidate":
      return "NOT_FULL_PRODUCT_CANDIDATE";
    case "safety_blocked":
      return "SAFETY_BLOCKED";
    default:
      return "RESPONSE_JSON_INVALID";
  }
}

function readNow(now: () => number) {
  try {
    const value = now();
    return Number.isFinite(value) ? value : 0;
  } catch {
    return 0;
  }
}

function elapsedMilliseconds(startedAt: number, now: () => number) {
  return Math.max(0, Math.round(readNow(now) - startedAt));
}

function observeSafely(
  observe: (diagnostic: PreparationResponseDiagnostic) => void,
  diagnostic: PreparationResponseDiagnostic,
) {
  try {
    observe(diagnostic);
  } catch {
    // Diagnostics must never change preparation behavior.
  }
}

export function logPreparationResponseClientDiagnostic(
  diagnostic: PreparationResponseDiagnostic,
) {
  console.info("M2_PREPARATION_RESPONSE_CLIENT", diagnostic);
}

export class PreparationResponseFailure extends Error {
  readonly diagnostic: PreparationResponseDiagnostic;

  constructor(diagnostic: PreparationResponseDiagnostic) {
    super(diagnostic.classification);
    this.name = "PreparationResponseFailure";
    this.diagnostic = diagnostic;
  }
}

function diagnostic(input: {
  correlationId: string;
  attempt: PreparationResponseAttempt;
  classification: PreparationResponseClassification;
  httpStatus: number | null;
  safeCode?: string | null;
  startedAt: number;
  now: () => number;
}): PreparationResponseDiagnostic {
  return {
    correlationId: input.correlationId,
    attempt: input.attempt,
    classification: input.classification,
    httpStatus: input.httpStatus,
    safeCode: input.safeCode ?? null,
    elapsedMilliseconds: elapsedMilliseconds(input.startedAt, input.now),
  };
}

export async function postProductionPreparationWithRecovery<
  TOutcome extends PreparationOutcome,
>(input: PreparationResponseRecoveryInput<TOutcome>): Promise<TOutcome> {
  if (!isPreparationResponseCorrelationId(input.correlationId)) {
    throw new TypeError("PREPARATION_RESPONSE_CORRELATION_INVALID");
  }
  const fetcher = input.fetcher ?? fetch;
  const observe = input.observe ?? logPreparationResponseClientDiagnostic;
  const now = input.now ?? (() => performance.now());

  for (const attempt of [0, 1] as const) {
    const startedAt = readNow(now);
    let response: Response;
    try {
      response = await fetcher(input.endpoint, {
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": input.idempotencyKey,
          [PREPARATION_RESPONSE_CORRELATION_HEADER]: input.correlationId,
          [PREPARATION_RESPONSE_ATTEMPT_HEADER]: String(attempt),
        },
        body: input.serializedBody,
      });
    } catch {
      const failure = diagnostic({
        correlationId: input.correlationId,
        attempt,
        classification: "FETCH_REJECTED",
        httpStatus: null,
        startedAt,
        now,
      });
      observeSafely(observe, failure);
      if (attempt === 0) continue;
      throw new PreparationResponseFailure(failure);
    }

    let responseBody: unknown;
    let parsed = true;
    try {
      responseBody = await response.json();
    } catch {
      parsed = false;
      responseBody = null;
    }

    if (!response.ok) {
      const safeCode = parsed
        ? readMoonReplyPreparationSafeCode(responseBody)
        : null;
      if (safeCode !== null) {
        const failure = diagnostic({
          correlationId: input.correlationId,
          attempt,
          classification: "HTTP_ERROR_WITH_SAFE_CODE",
          httpStatus: response.status,
          safeCode,
          startedAt,
          now,
        });
        observeSafely(observe, failure);
        throw new PreparationResponseFailure(failure);
      }
      if (gatewayStatusCodes.has(response.status)) {
        const failure = diagnostic({
          correlationId: input.correlationId,
          attempt,
          classification: "GATEWAY_HTTP_ERROR",
          httpStatus: response.status,
          startedAt,
          now,
        });
        observeSafely(observe, failure);
        if (attempt === 0) continue;
        throw new PreparationResponseFailure(failure);
      }
      const failure = diagnostic({
        correlationId: input.correlationId,
        attempt,
        classification: "HTTP_ERROR_WITHOUT_SAFE_CODE",
        httpStatus: response.status,
        startedAt,
        now,
      });
      observeSafely(observe, failure);
      throw new PreparationResponseFailure(failure);
    }

    let outcome: TOutcome | null = null;
    if (parsed) {
      try {
        outcome = input.decodeOutcome(responseBody);
      } catch {
        outcome = null;
      }
    }
    if (outcome === null) {
      const failure = diagnostic({
        correlationId: input.correlationId,
        attempt,
        classification: "RESPONSE_JSON_INVALID",
        httpStatus: response.status,
        startedAt,
        now,
      });
      observeSafely(observe, failure);
      if (attempt === 0) continue;
      throw new PreparationResponseFailure(failure);
    }

    const success = diagnostic({
      correlationId: input.correlationId,
      attempt,
      classification: classifyPreparationOutcomeStatus(outcome.status),
      httpStatus: response.status,
      startedAt,
      now,
    });
    observeSafely(observe, success);
    return outcome;
  }

  throw new Error("PREPARATION_RESPONSE_ATTEMPT_BOUNDARY_INVALID");
}
