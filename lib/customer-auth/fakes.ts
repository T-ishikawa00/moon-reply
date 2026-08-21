import { M2RuntimeError } from "../assessment/runtime/errors";
import type {
  CustomerAccountHistoryItem,
  CustomerAuthContinuation,
  CustomerAuthIdentityV1,
  CustomerAuthProviderV1,
  CustomerIdentityRepository,
  CustomerOwnedResult,
  CustomerOwnershipBinding,
} from "./types";

type MutableContinuation = CustomerAuthContinuation & {
  continuationTokenHash: string;
  csrfTokenHash: string;
};

export class FakeCustomerAuthProviderV1 implements CustomerAuthProviderV1 {
  googleAuthorizationUrl =
    "https://local-supabase.invalid/auth/v1/authorize?provider=google";
  currentIdentity: CustomerAuthIdentityV1 | null = null;
  expectedOtp = "123456";
  requestedEmailCount = 0;
  googleStartCount = 0;
  callbackExchangeCount = 0;
  logoutCount = 0;

  async startGoogleOAuth() {
    this.googleStartCount += 1;
    return { authorizationUrl: this.googleAuthorizationUrl };
  }

  async exchangeGoogleCallback(code: string) {
    this.callbackExchangeCount += 1;
    if (code !== "fake-google-callback-code" || !this.currentIdentity) {
      throw new M2RuntimeError("CUSTOMER_AUTH_CALLBACK_INVALID", 403);
    }
    return structuredClone(this.currentIdentity);
  }

  async requestEmailOtp() {
    this.requestedEmailCount += 1;
  }

  async verifyEmailOtp(input: { email: string; otp: string }) {
    if (
      input.otp !== this.expectedOtp ||
      !this.currentIdentity ||
      this.currentIdentity.verifiedEmail !== input.email ||
      this.currentIdentity.verifiedEmailSource !== "supabase_email_otp"
    ) {
      throw new M2RuntimeError("CUSTOMER_AUTH_EMAIL_OTP_INVALID", 403);
    }
    return structuredClone(this.currentIdentity);
  }

  async getFreshIdentity() {
    return this.currentIdentity ? structuredClone(this.currentIdentity) : null;
  }

  async logout() {
    this.logoutCount += 1;
    this.currentIdentity = null;
  }
}

export class FakeCustomerIdentityRepositoryV1
  implements CustomerIdentityRepository
{
  readonly preparations = new Map<string, { id: string; status: string }>();
  readonly continuations = new Map<string, MutableContinuation>();
  readonly bindings = new Map<string, CustomerOwnershipBinding>();
  readonly history = new Map<string, CustomerAccountHistoryItem[]>();
  readonly results = new Map<
    string,
    { customerUserId: string; result: CustomerOwnedResult }
  >();

  seedPreparation(input: { id: string; preparationCapabilityHash: string }) {
    this.preparations.set(input.preparationCapabilityHash, {
      id: input.id,
      status: "purchase_ready",
    });
  }

  seedResult(customerUserId: string, result: CustomerOwnedResult) {
    this.results.set(result.deliveryId, {
      customerUserId,
      result: structuredClone(result),
    });
  }

  async createContinuation(
    input: Parameters<CustomerIdentityRepository["createContinuation"]>[0],
  ) {
    const preparation = this.preparations.get(input.preparationCapabilityHash);
    if (!preparation || preparation.status !== "purchase_ready") {
      throw new M2RuntimeError("CUSTOMER_AUTH_PURCHASE_READY_REQUIRED", 403);
    }
    for (const [hash, continuation] of this.continuations) {
      if (continuation.preparationId !== preparation.id || continuation.state !== "pending") {
        continue;
      }
      this.continuations.set(hash, {
        ...continuation,
        state:
          Date.parse(continuation.expiresAt) <= Date.parse(input.now)
            ? "expired"
            : "revoked",
      });
    }
    const continuation: MutableContinuation = {
      id: input.id,
      preparationId: preparation.id,
      flowKind: input.flowKind,
      state: "pending",
      expiresAt: input.expiresAt,
      continuationTokenHash: input.continuationTokenHash,
      csrfTokenHash: input.csrfTokenHash,
    };
    this.continuations.set(input.continuationTokenHash, continuation);
    return structuredClone(continuation);
  }

  async validateContinuation(
    input: Parameters<CustomerIdentityRepository["validateContinuation"]>[0],
  ) {
    const continuation = this.continuations.get(input.continuationTokenHash);
    if (
      !continuation ||
      continuation.state !== "pending" ||
      continuation.csrfTokenHash !== input.csrfTokenHash ||
      continuation.flowKind !== input.flowKind
    ) {
      return null;
    }
    if (Date.parse(continuation.expiresAt) <= Date.parse(input.now)) {
      this.continuations.set(input.continuationTokenHash, {
        ...continuation,
        state: "expired",
      });
      return null;
    }
    return structuredClone(continuation);
  }

  async bindPreparation(
    input: Parameters<CustomerIdentityRepository["bindPreparation"]>[0],
  ) {
    const continuation = this.continuations.get(input.continuationTokenHash);
    if (
      !continuation ||
      !["pending", "consumed"].includes(continuation.state) ||
      continuation.csrfTokenHash !== input.csrfTokenHash ||
      Date.parse(continuation.expiresAt) <= Date.parse(input.now)
    ) {
      throw new M2RuntimeError("CUSTOMER_AUTH_CONTINUATION_INVALID", 403);
    }
    const existing = this.bindings.get(continuation.preparationId);
    if (existing) {
      if (
        existing.state === "active" &&
        existing.customerUserId === input.customerUserId
      ) {
        this.continuations.set(input.continuationTokenHash, {
          ...continuation,
          state: "consumed",
        });
        return structuredClone(existing);
      }
      throw new M2RuntimeError("CUSTOMER_AUTH_BINDING_CONFLICT", 409);
    }
    if (continuation.state !== "pending") {
      throw new M2RuntimeError("CUSTOMER_AUTH_BINDING_CONFLICT", 409);
    }
    const binding: CustomerOwnershipBinding = {
      id: input.bindingId,
      preparationId: continuation.preparationId,
      customerUserId: input.customerUserId,
      state: "active",
    };
    this.bindings.set(continuation.preparationId, binding);
    this.continuations.set(input.continuationTokenHash, {
      ...continuation,
      state: "consumed",
    });
    return structuredClone(binding);
  }

  async listAccountHistory(customerUserId: string) {
    const active = [...this.bindings.values()].some(
      (binding) =>
        binding.customerUserId === customerUserId && binding.state === "active",
    );
    return active
      ? structuredClone(this.history.get(customerUserId) ?? [])
      : [];
  }

  async resolveOwnedResult(
    input: Parameters<CustomerIdentityRepository["resolveOwnedResult"]>[0],
  ) {
    const active = [...this.bindings.values()].some(
      (binding) =>
        binding.customerUserId === input.customerUserId &&
        binding.state === "active",
    );
    if (!active) return null;
    const owned = this.results.get(input.deliveryId);
    return owned?.customerUserId === input.customerUserId
      ? structuredClone(owned.result)
      : null;
  }

  async detachIdentity(
    input: Parameters<CustomerIdentityRepository["detachIdentity"]>[0],
  ) {
    for (const [preparationId, binding] of this.bindings) {
      if (binding.customerUserId === input.customerUserId) {
        this.bindings.set(preparationId, {
          ...binding,
          customerUserId: null,
          state: "identity_detached",
        });
      }
    }
  }
}
