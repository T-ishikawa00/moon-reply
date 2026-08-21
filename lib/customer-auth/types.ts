import type { CustomerAssessmentExperienceProjectionV2 } from "../assessment/runtime/customer-assessment-experience-projection-v2";

export type CustomerAuthFlowKind = "google" | "email_otp";
export type CustomerAuthProviderKind = "google" | "email";
export type VerifiedDeliveryEmailSource =
  | "google_verified_identity"
  | "supabase_email_otp";

export type CustomerAuthIdentityV1 = Readonly<{
  customerUserId: string;
  verifiedEmail: string;
  verifiedEmailSource: VerifiedDeliveryEmailSource;
  authProviders: readonly CustomerAuthProviderKind[];
}>;

export type CustomerAuthProviderV1 = {
  startGoogleOAuth(): Promise<{ authorizationUrl: string }>;
  exchangeGoogleCallback(code: string): Promise<CustomerAuthIdentityV1>;
  requestEmailOtp(email: string): Promise<void>;
  verifyEmailOtp(input: {
    email: string;
    otp: string;
  }): Promise<CustomerAuthIdentityV1>;
  getFreshIdentity(): Promise<CustomerAuthIdentityV1 | null>;
  logout(scope: "local" | "global"): Promise<void>;
};

export type CustomerAuthContinuation = Readonly<{
  id: string;
  preparationId: string;
  flowKind: CustomerAuthFlowKind;
  state: "pending" | "consumed" | "expired" | "revoked";
  expiresAt: string;
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
  projection: CustomerAssessmentExperienceProjectionV2;
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
