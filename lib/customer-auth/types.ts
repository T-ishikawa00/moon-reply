import type { PaidCanonicalProjection } from "../assessment/production/recovery-candidate";

export type CustomerAuthFlowKind = "google" | "email_otp";
export type CustomerAuthProviderKind = "google" | "email";
export type CustomerAuthCallbackLane = "purchase" | "account";
export type CustomerAuthSessionState = "signed_in" | "signed_out" | "unavailable";
export type VerifiedDeliveryEmailSource =
  | "google_verified_identity"
  | "supabase_email_otp";

export type CustomerAuthGoogleObservationPhase =
  | "start_continuation"
  | "start_provider"
  | "callback_continuation"
  | "callback_exchange"
  | "callback_identity"
  | "callback_binding";

export type CustomerAuthGoogleObservation = Readonly<{
  phase: CustomerAuthGoogleObservationPhase;
  durationMs: number;
  outcome: "success" | "failed";
}>;

export type CustomerAuthGoogleObserver = (
  observation: CustomerAuthGoogleObservation,
) => void;

export type CustomerAuthIdentityV1 = Readonly<{
  customerUserId: string;
  verifiedEmail: string;
  verifiedEmailSource: VerifiedDeliveryEmailSource;
  authProviders: readonly CustomerAuthProviderKind[];
}>;

export type CustomerAuthProviderV1 = {
  startGoogleOAuth(
    callbackLane?: CustomerAuthCallbackLane,
  ): Promise<{ authorizationUrl: string }>;
  exchangeGoogleCallback(
    code: string,
    observe?: CustomerAuthGoogleObserver,
  ): Promise<CustomerAuthIdentityV1>;
  requestEmailOtp(email: string): Promise<void>;
  verifyEmailOtp(input: {
    email: string;
    otp: string;
  }): Promise<CustomerAuthIdentityV1>;
  getFreshIdentity(): Promise<CustomerAuthIdentityV1 | null>;
  getFreshSessionState(): Promise<CustomerAuthSessionState>;
  logout(scope: "local" | "global"): Promise<void>;
};

export type CustomerAuthContinuation = Readonly<{
  id: string;
  preparationId: string;
  flowKind: CustomerAuthFlowKind;
  state: "pending" | "consumed" | "expired" | "revoked";
  expiresAt: string;
  purpose: "purchase_checkout" | "prepayment_compute";
}>;

export type CustomerOwnershipBinding = Readonly<{
  id: string;
  preparationId: string;
  customerUserId: string | null;
  state: "active" | "identity_detached";
}>;

export type CustomerAccountHistoryItem = Readonly<{
  purchaseIntentId: string;
  deliveryId: string | null;
  date: string;
  state: "processing" | "completed";
}>;

export type CustomerOwnedResult = Readonly<{
  deliveryId: string;
  projection: PaidCanonicalProjection;
}>;

export type CustomerIdentityRepository = {
  createContinuation(input: {
    id: string;
    preparationCapabilityHash: string;
    continuationTokenHash: string;
    csrfTokenHash: string;
    flowKind: CustomerAuthFlowKind;
    expiresAt: string;
    now: string;
  }): Promise<CustomerAuthContinuation>;
  validateContinuation(input: {
    continuationTokenHash: string;
    csrfTokenHash: string;
    flowKind: CustomerAuthFlowKind;
    now: string;
  }): Promise<CustomerAuthContinuation | null>;
  bindPreparation(input: {
    bindingId: string;
    ownershipReferenceId: string;
    continuationTokenHash: string;
    csrfTokenHash: string;
    customerUserId: string;
    deliveryEmailHash: string;
    deliveryEmailCiphertext: string;
    deliveryEmailKeyVersion: string;
    deliveryEmailVerifiedSource: VerifiedDeliveryEmailSource;
    deliveryEmailVerifiedAt: string;
    now: string;
  }): Promise<CustomerOwnershipBinding>;
  bindPrepaymentByCapability(input: {
    bindingId: string;
    ownershipReferenceId: string;
    preparationCapabilityHash: string;
    customerUserId: string;
    deliveryEmailHash: string;
    deliveryEmailCiphertext: string;
    deliveryEmailKeyVersion: string;
    deliveryEmailVerifiedSource: VerifiedDeliveryEmailSource;
    deliveryEmailVerifiedAt: string;
    now: string;
  }): Promise<CustomerOwnershipBinding>;
  listAccountHistory(customerUserId: string): Promise<CustomerAccountHistoryItem[]>;
  resolveOwnedResult(input: {
    customerUserId: string;
    deliveryId: string;
  }): Promise<CustomerOwnedResult | null>;
  detachIdentity(input: {
    customerUserId: string;
    requestId: string;
    now: string;
  }): Promise<void>;
};
