import { M2RuntimeError } from "./errors.ts";
import {
  decodeCustomerAssessmentProjectionV1,
  projectCustomerAssessmentV1,
  type CustomerAssessmentProjectionV1,
} from "./customer-assessment-projection-v1.ts";
import {
  decodeAssessmentExecutionResult,
  decodeRequestedTopics,
} from "./runtime-result-normalization-v1.ts";
import type { RequestedTopic } from "./types.ts";

export const CUSTOMER_ASSESSMENT_DELIVERY_SCHEMA_VERSION =
  "customer-assessment-delivery-v1" as const;

export type ReadyCustomerAssessmentDeliveryV1 = {
  deliverySchemaVersion: typeof CUSTOMER_ASSESSMENT_DELIVERY_SCHEMA_VERSION;
  status: "ready";
  eligibility: "ready";
  projection: CustomerAssessmentProjectionV1;
  requestedTopicsAuthority:
    | "validated_initial_request"
    | "persisted_original_request";
  duplicate: boolean;
};

export type SafetyBlockedCustomerAssessmentDeliveryV1 = {
  deliverySchemaVersion: typeof CUSTOMER_ASSESSMENT_DELIVERY_SCHEMA_VERSION;
  status: "stopped";
  eligibility: "safety_blocked";
  questionCodes: [];
  duplicate: boolean;
};

export type NeedsInformationCustomerAssessmentDeliveryV1 = {
  deliverySchemaVersion: typeof CUSTOMER_ASSESSMENT_DELIVERY_SCHEMA_VERSION;
  status: "stopped";
  eligibility: "needs_more_information";
  questionCodes: string[];
  duplicate: boolean;
};

export type CustomerAssessmentDeliveryV1 =
  | ReadyCustomerAssessmentDeliveryV1
  | SafetyBlockedCustomerAssessmentDeliveryV1
  | NeedsInformationCustomerAssessmentDeliveryV1;

export type CustomerAssessmentApiResponseV1 = {
  data: CustomerAssessmentDeliveryV1;
};

function deliveryInvalid(code = "M2_CUSTOMER_DELIVERY_INVALID"): never {
  throw new M2RuntimeError(code);
}

function sameTopics(left: readonly RequestedTopic[], right: readonly RequestedTopic[]) {
  return left.length === right.length && left.every((topic, index) => topic === right[index]);
}

export function createCustomerAssessmentDeliveryV1(
  executionResult: unknown,
  validatedInitialRequestedTopics: unknown,
): CustomerAssessmentDeliveryV1 {
  const result = decodeAssessmentExecutionResult(executionResult);
  const initialRequestedTopics = decodeRequestedTopics(validatedInitialRequestedTopics);

  if (result.eligibility === "ready") {
    let requestedTopics: RequestedTopic[];
    let requestedTopicsAuthority: ReadyCustomerAssessmentDeliveryV1["requestedTopicsAuthority"];
    if (result.duplicate) {
      if (!result.authoritativeRequestedTopics) {
        deliveryInvalid("M2_PERSISTED_REQUESTED_TOPICS_MISSING");
      }
      requestedTopics = decodeRequestedTopics(result.authoritativeRequestedTopics);
      requestedTopicsAuthority = "persisted_original_request";
    } else {
      if (
        result.authoritativeRequestedTopics &&
        !sameTopics(result.authoritativeRequestedTopics, initialRequestedTopics)
      ) {
        deliveryInvalid("M2_REQUESTED_TOPICS_AUTHORITY_MISMATCH");
      }
      requestedTopics = initialRequestedTopics;
      requestedTopicsAuthority = "validated_initial_request";
    }
    return {
      deliverySchemaVersion: CUSTOMER_ASSESSMENT_DELIVERY_SCHEMA_VERSION,
      status: "ready",
      eligibility: "ready",
      projection: projectCustomerAssessmentV1(result, requestedTopics),
      requestedTopicsAuthority,
      duplicate: result.duplicate,
    };
  }

  if (result.eligibility === "safety_blocked") {
    return {
      deliverySchemaVersion: CUSTOMER_ASSESSMENT_DELIVERY_SCHEMA_VERSION,
      status: "stopped",
      eligibility: "safety_blocked",
      questionCodes: [],
      duplicate: result.duplicate,
    };
  }

  return {
    deliverySchemaVersion: CUSTOMER_ASSESSMENT_DELIVERY_SCHEMA_VERSION,
    status: "stopped",
    eligibility: "needs_more_information",
    questionCodes: [...result.questionCodes],
    duplicate: result.duplicate,
  };
}

function assertRecord(value: unknown): asserts value is Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    deliveryInvalid();
  }
}

function assertExactKeys(value: Record<string, unknown>, required: readonly string[]) {
  const allowed = new Set(required);
  if (
    required.some((key) => !Object.prototype.hasOwnProperty.call(value, key)) ||
    Object.keys(value).some((key) => !allowed.has(key))
  ) {
    deliveryInvalid();
  }
}

function assertQuestionCodes(value: unknown): asserts value is string[] {
  if (!Array.isArray(value) || value.length > 3) deliveryInvalid();
  if (
    value.some((code) => typeof code !== "string" || code.length === 0) ||
    new Set(value).size !== value.length
  ) {
    deliveryInvalid();
  }
}

function assertCustomerAssessmentDelivery(
  value: unknown,
): asserts value is CustomerAssessmentDeliveryV1 {
  assertRecord(value);
  if (value.deliverySchemaVersion !== CUSTOMER_ASSESSMENT_DELIVERY_SCHEMA_VERSION) {
    deliveryInvalid();
  }
  if (value.status === "ready" && value.eligibility === "ready") {
    assertExactKeys(value, [
      "deliverySchemaVersion",
      "status",
      "eligibility",
      "projection",
      "requestedTopicsAuthority",
      "duplicate",
    ]);
    decodeCustomerAssessmentProjectionV1(value.projection);
    if (
      value.requestedTopicsAuthority !== "validated_initial_request" &&
      value.requestedTopicsAuthority !== "persisted_original_request"
    ) {
      deliveryInvalid();
    }
    if (typeof value.duplicate !== "boolean") deliveryInvalid();
    if (
      value.duplicate !==
      (value.requestedTopicsAuthority === "persisted_original_request")
    ) {
      deliveryInvalid();
    }
    return;
  }
  if (value.status !== "stopped") deliveryInvalid();
  if (value.eligibility === "safety_blocked") {
    assertExactKeys(value, [
      "deliverySchemaVersion",
      "status",
      "eligibility",
      "questionCodes",
      "duplicate",
    ]);
    assertQuestionCodes(value.questionCodes);
    if (value.questionCodes.length !== 0 || typeof value.duplicate !== "boolean") {
      deliveryInvalid();
    }
    return;
  }
  if (value.eligibility === "needs_more_information") {
    assertExactKeys(value, [
      "deliverySchemaVersion",
      "status",
      "eligibility",
      "questionCodes",
      "duplicate",
    ]);
    assertQuestionCodes(value.questionCodes);
    if (typeof value.duplicate !== "boolean") deliveryInvalid();
    return;
  }
  deliveryInvalid();
}

export function decodeCustomerAssessmentDeliveryV1(
  value: unknown,
): CustomerAssessmentDeliveryV1 {
  assertCustomerAssessmentDelivery(value);
  return value;
}

function assertCustomerAssessmentApiResponse(
  value: unknown,
): asserts value is CustomerAssessmentApiResponseV1 {
  assertRecord(value);
  assertExactKeys(value, ["data"]);
  decodeCustomerAssessmentDeliveryV1(value.data);
}

export function decodeCustomerAssessmentApiResponseV1(
  value: unknown,
): CustomerAssessmentApiResponseV1 {
  assertCustomerAssessmentApiResponse(value);
  return value;
}
