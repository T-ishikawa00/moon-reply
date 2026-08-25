import "server-only";

import { M2RuntimeError } from "../assessment/runtime/errors";
import type {
  CustomerAccountHistoryItem,
  CustomerAuthSessionState,
} from "./types";

export type CustomerAccountPageResolution =
  | Readonly<{ state: "auth_unavailable" }>
  | Readonly<{ state: "signed_out" }>
  | Readonly<{ state: "load_failed" }>
  | Readonly<{ state: "empty" }>
  | Readonly<{
      state: "history";
      history: readonly CustomerAccountHistoryItem[];
    }>;

export async function resolveCustomerAccountPage(input: {
  authEnabled: boolean;
  getSessionState: () => Promise<CustomerAuthSessionState>;
  listHistory: () => Promise<CustomerAccountHistoryItem[]>;
}): Promise<CustomerAccountPageResolution> {
  if (!input.authEnabled) return { state: "auth_unavailable" };
  let sessionState: CustomerAuthSessionState;
  try {
    sessionState = await input.getSessionState();
  } catch {
    return { state: "auth_unavailable" };
  }
  if (sessionState === "unavailable") return { state: "auth_unavailable" };
  if (sessionState === "signed_out") return { state: "signed_out" };
  try {
    const history = await input.listHistory();
    return history.length === 0
      ? { state: "empty" }
      : { state: "history", history };
  } catch (error) {
    if (
      error instanceof M2RuntimeError &&
      error.safeCode === "CUSTOMER_AUTH_REQUIRED"
    ) {
      return { state: "signed_out" };
    }
    return { state: "load_failed" };
  }
}
