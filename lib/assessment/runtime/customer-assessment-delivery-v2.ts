import { M2RuntimeError } from "./errors.ts";
import {
  decodeCustomerAssessmentProjectionV1,
  projectCustomerAssessmentV1,
  type CustomerAssessmentProjectionV1,
} from "./customer-assessment-projection-v1.ts";
import {
  decodeAssessmentExecutionResultV2,
} from "./runtime-result-normalization-v2.ts";
import { decodeRequestedTopics } from "./runtime-result-normalization-v1.ts";
import type {
  Jpy980ClarificationTarget,
  RequestedTopic,
} from "./types.ts";

export const CUSTOMER_ASSESSMENT_DELIVERY_V2_SCHEMA_VERSION =
  "customer-assessment-delivery-v2" as const;

export type CustomerAssessmentDeliveryV2 =
  | {
      deliverySchemaVersion: typeof CUSTOMER_ASSESSMENT_DELIVERY_V2_SCHEMA_VERSION;
      status: "completed";
      eligibility: "ready";
      projection: CustomerAssessmentProjectionV1;
      duplicate: boolean;
    }
  | {
      deliverySchemaVersion: typeof CUSTOMER_ASSESSMENT_DELIVERY_V2_SCHEMA_VERSION;
      status: "awaiting_clarification";
      eligibility: "needs_more_information";
      clarification: {
        opaqueClarificationId: string;
        questionCode: string;
        target: Jpy980ClarificationTarget;
        question: string;
        maximumQuestionsTotal: 1;
        questionsAlreadyUsed: 0;
        questionsRemaining: 1;
      };
      duplicate: boolean;
    }
  | {
      deliverySchemaVersion: typeof CUSTOMER_ASSESSMENT_DELIVERY_V2_SCHEMA_VERSION;
      status: "stopped";
      eligibility: "not_full_product_candidate";
      reason:
        | "insufficient_grounded_material"
        | "outside_current_product_scope"
        | "clarification_budget_exhausted";
      duplicate: boolean;
    }
  | {
      deliverySchemaVersion: typeof CUSTOMER_ASSESSMENT_DELIVERY_V2_SCHEMA_VERSION;
      status: "stopped";
      eligibility: "safety_blocked";
      duplicate: boolean;
    };

function invalid(): never {
  throw new M2RuntimeError("M2_CUSTOMER_DELIVERY_INVALID");
}

function sameTopics(left: readonly RequestedTopic[], right: readonly RequestedTopic[]) {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function notFullReason(reasonCodes: readonly string[]) {
  if (reasonCodes.includes("CLARIFICATION_BUDGET_EXHAUSTED")) {
    return "clarification_budget_exhausted" as const;
  }
  if (reasonCodes.includes("SUPPORTED_CONSULTATION_PATH_NOT_ESTABLISHED")) {
    return "outside_current_product_scope" as const;
  }
  return "insufficient_grounded_material" as const;
}

export function createCustomerAssessmentDeliveryV2(
  executionResult: unknown,
  validatedOrPersistedRequestedTopics: unknown,
): CustomerAssessmentDeliveryV2 {
  const result = decodeAssessmentExecutionResultV2(executionResult);
  const suppliedTopics = decodeRequestedTopics(validatedOrPersistedRequestedTopics);
  if (
    result.authoritativeRequestedTopics &&
    !sameTopics(result.authoritativeRequestedTopics, suppliedTopics)
  ) invalid();
  const topics = result.authoritativeRequestedTopics ?? suppliedTopics;
  if (result.eligibility === "ready") {
    return {
      deliverySchemaVersion: CUSTOMER_ASSESSMENT_DELIVERY_V2_SCHEMA_VERSION,
      status: "completed",
      eligibility: "ready",
      projection: projectCustomerAssessmentV1(result, topics),
      duplicate: result.duplicate,
    };
  }
  if (result.eligibility === "needs_more_information") {
    if (!result.clarification) invalid();
    return {
      deliverySchemaVersion: CUSTOMER_ASSESSMENT_DELIVERY_V2_SCHEMA_VERSION,
      status: "awaiting_clarification",
      eligibility: "needs_more_information",
      clarification: { ...result.clarification },
      duplicate: result.duplicate,
    };
  }
  if (result.eligibility === "not_full_product_candidate") {
    return {
      deliverySchemaVersion: CUSTOMER_ASSESSMENT_DELIVERY_V2_SCHEMA_VERSION,
      status: "stopped",
      eligibility: "not_full_product_candidate",
      reason: notFullReason(result.reasonCodes),
      duplicate: result.duplicate,
    };
  }
  return {
    deliverySchemaVersion: CUSTOMER_ASSESSMENT_DELIVERY_V2_SCHEMA_VERSION,
    status: "stopped",
    eligibility: "safety_blocked",
    duplicate: result.duplicate,
  };
}

export type CustomerAssessmentApiResponseV2 = {
  data: CustomerAssessmentDeliveryV2;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function decodeCustomerAssessmentApiResponseV2(
  value: unknown,
): CustomerAssessmentApiResponseV2 {
  if (!isRecord(value) || Object.keys(value).length !== 1 || !isRecord(value.data)) {
    invalid();
  }
  const data = value.data;
  if (
    data.deliverySchemaVersion !== CUSTOMER_ASSESSMENT_DELIVERY_V2_SCHEMA_VERSION ||
    typeof data.duplicate !== "boolean"
  ) invalid();
  if (data.eligibility === "ready" && data.status === "completed") {
    decodeCustomerAssessmentProjectionV1(data.projection);
    return value as CustomerAssessmentApiResponseV2;
  }
  if (
    data.eligibility === "needs_more_information" &&
    data.status === "awaiting_clarification" &&
    isRecord(data.clarification) &&
    typeof data.clarification.opaqueClarificationId === "string" &&
    typeof data.clarification.questionCode === "string" &&
    typeof data.clarification.target === "string" &&
    typeof data.clarification.question === "string" &&
    data.clarification.maximumQuestionsTotal === 1 &&
    data.clarification.questionsAlreadyUsed === 0 &&
    data.clarification.questionsRemaining === 1
  ) return value as CustomerAssessmentApiResponseV2;
  if (
    data.eligibility === "not_full_product_candidate" &&
    data.status === "stopped" &&
    (data.reason === "insufficient_grounded_material" ||
      data.reason === "outside_current_product_scope" ||
      data.reason === "clarification_budget_exhausted")
  ) return value as CustomerAssessmentApiResponseV2;
  if (data.eligibility === "safety_blocked" && data.status === "stopped") {
    return value as CustomerAssessmentApiResponseV2;
  }
  invalid();
}
