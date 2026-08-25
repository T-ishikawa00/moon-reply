import "server-only";

import { M2RuntimeError } from "../assessment/runtime/errors";
import type {
  CustomerAuthSessionState,
  CustomerOwnedResult,
} from "./types";

export type CustomerAccountResultResolution =
  | Readonly<{ state: "auth_required" }>
  | Readonly<{ state: "not_found" }>
  | Readonly<{ state: "result"; result: CustomerOwnedResult }>;

export async function resolveCustomerAccountResult(input: {
  authEnabled: boolean;
  deliveryId: string;
  getSessionState: () => Promise<CustomerAuthSessionState>;
  resolveOwnedResult: (deliveryId: string) => Promise<CustomerOwnedResult | null>;
}): Promise<CustomerAccountResultResolution> {
  if (!input.authEnabled) {
    throw new M2RuntimeError("CUSTOMER_AUTH_UNAVAILABLE", 503);
  }
  const sessionState = await input.getSessionState();
  if (sessionState === "unavailable") {
    throw new M2RuntimeError("CUSTOMER_AUTH_UNAVAILABLE", 503);
  }
  if (sessionState === "signed_out") return { state: "auth_required" };
  let result: CustomerOwnedResult | null;
  try {
    result = await input.resolveOwnedResult(input.deliveryId);
  } catch (error) {
    if (
      error instanceof M2RuntimeError &&
      error.safeCode === "CUSTOMER_AUTH_REQUIRED"
    ) {
      return { state: "auth_required" };
    }
    throw error;
  }
  return result === null
    ? { state: "not_found" }
    : { state: "result", result };
}
