import type {
  EligiblePrepaymentClassificationV1,
  PrepaymentSafetyResultV1,
} from "./prepayment-safety-types-v1.ts";

export const PURCHASE_STATES_V1 = [
  "unassessed",
  "collecting_safety_answers",
  "needs_clarification",
  "eligible_general",
  "eligible_pause_assessment",
  "eligible_boundary_support_only",
  "eligible_scoped_reply",
  "eligible_business_only",
  "blocked_unsafe_assistance",
  "urgent_safety_redirect",
  "unsupported_professional_request",
  "purchase_available",
  "payment_pending",
  "payment_completed",
] as const;

export type PurchaseStateV1 = (typeof PURCHASE_STATES_V1)[number];

export type PurchaseTransitionErrorCodeV1 =
  | "INVALID_PURCHASE_STATE_TRANSITION"
  | "PURCHASE_GATES_UNSATISFIED"
  | "STALE_ELIGIBILITY_INPUT"
  | "FULL_RECLASSIFICATION_REQUIRED"
  | "PAYMENT_NOT_IMPLEMENTED";

export type PurchaseTransitionResultV1 = Readonly<{
  ok: boolean;
  state: PurchaseStateV1;
  errorCode: PurchaseTransitionErrorCodeV1 | null;
}>;

export type PurchaseTransitionEventV1 =
  | Readonly<{ type: "begin_safety_and_assistance_assessment" }>
  | Readonly<{
      type: "apply_server_classification";
      result: PrepaymentSafetyResultV1;
    }>
  | Readonly<{
      type: "server_make_purchase_available";
      result: PrepaymentSafetyResultV1;
      presentedEligibilityInputHash: string;
    }>
  | Readonly<{
      type: "bound_input_changed";
      previousEligibilityInputHash: string;
      currentEligibilityInputHash: string;
    }>
  | Readonly<{ type: "new_inbound_received" }>
  | Readonly<{ type: "time_passed" }>
  | Readonly<{ type: "unblocked" }>
  | Readonly<{ type: "server_create_payment_session" }>
  | Readonly<{ type: "verified_payment_completion" }>;

function accepted(state: PurchaseStateV1): PurchaseTransitionResultV1 {
  return Object.freeze({ ok: true, state, errorCode: null });
}

function rejected(
  state: PurchaseStateV1,
  errorCode: PurchaseTransitionErrorCodeV1,
): PurchaseTransitionResultV1 {
  return Object.freeze({ ok: false, state, errorCode });
}

function isEligibleClassification(
  value: PurchaseStateV1,
): value is EligiblePrepaymentClassificationV1 {
  switch (value) {
    case "eligible_general":
    case "eligible_pause_assessment":
    case "eligible_boundary_support_only":
    case "eligible_scoped_reply":
    case "eligible_business_only":
      return true;
    default:
      return false;
  }
}

export function transitionPurchaseStateV1(
  currentState: PurchaseStateV1,
  event: PurchaseTransitionEventV1,
): PurchaseTransitionResultV1 {
  switch (event.type) {
    case "begin_safety_and_assistance_assessment":
      return currentState === "unassessed"
        ? accepted("collecting_safety_answers")
        : rejected(currentState, "INVALID_PURCHASE_STATE_TRANSITION");

    case "apply_server_classification":
      if (currentState !== "collecting_safety_answers") {
        return rejected(currentState, "INVALID_PURCHASE_STATE_TRANSITION");
      }
      return accepted(event.result.classification);

    case "server_make_purchase_available": {
      if (!isEligibleClassification(currentState)) {
        return rejected(currentState, "INVALID_PURCHASE_STATE_TRANSITION");
      }
      if (
        event.presentedEligibilityInputHash !==
          event.result.eligibilityInputHash ||
        event.result.classification !== currentState
      ) {
        return rejected("unassessed", "STALE_ELIGIBILITY_INPUT");
      }
      if (!event.result.purchaseGateSatisfied) {
        return rejected(currentState, "PURCHASE_GATES_UNSATISFIED");
      }
      return accepted("purchase_available");
    }

    case "bound_input_changed":
      return event.previousEligibilityInputHash ===
        event.currentEligibilityInputHash
        ? accepted(currentState)
        : rejected("unassessed", "STALE_ELIGIBILITY_INPUT");

    case "new_inbound_received":
      return accepted("unassessed");

    case "time_passed":
    case "unblocked":
      return rejected(currentState, "FULL_RECLASSIFICATION_REQUIRED");

    case "server_create_payment_session":
    case "verified_payment_completion":
      return rejected(currentState, "PAYMENT_NOT_IMPLEMENTED");
  }
}
