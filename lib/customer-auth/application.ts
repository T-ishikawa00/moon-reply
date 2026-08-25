import { randomUUID } from "node:crypto";

import { M2RuntimeError } from "../assessment/runtime/errors";
import { hashOpaqueProductionCapability } from "../assessment/production/capabilities";
import {
  encryptDeliveryEmail,
  hashDeliveryEmail,
  normalizeDeliveryEmail,
} from "../payment/production/crypto";
import {
  createCustomerAuthSecret,
  hashCustomerAuthContinuation,
  hashCustomerAuthCsrf,
  validateCustomerAuthSecret,
} from "./crypto";
import type { CustomerAuthEnvironment } from "./environment";
import type {
  CustomerAuthFlowKind,
  CustomerAuthGoogleObserver,
  CustomerAuthIdentityV1,
  CustomerAuthProviderV1,
  CustomerIdentityRepository,
} from "./types";
import { observeCustomerAuthGoogleOperation } from "./observation";

type Options = {
  repository: CustomerIdentityRepository;
  provider: CustomerAuthProviderV1;
  environment: CustomerAuthEnvironment;
  now?: () => string;
  uuid?: () => string;
  secret?: () => string;
  monotonicNow?: () => number;
};

function addSeconds(instant: string, seconds: number) {
  return new Date(Date.parse(instant) + seconds * 1_000).toISOString();
}

export class CustomerIdentityAuthApplicationV1 {
  private readonly now: () => string;
  private readonly uuid: () => string;
  private readonly secret: () => string;

  constructor(private readonly options: Options) {
    this.now = options.now ?? (() => new Date().toISOString());
    this.uuid = options.uuid ?? randomUUID;
    this.secret = options.secret ?? createCustomerAuthSecret;
  }

  async createContinuation(input: {
    preparationCapability: unknown;
    csrfToken: unknown;
    flowKind: CustomerAuthFlowKind;
  }) {
    const csrfToken = validateCustomerAuthSecret(input.csrfToken);
    const continuationToken = this.secret();
    if (continuationToken === csrfToken) {
      throw new M2RuntimeError("CUSTOMER_AUTH_SECRET_COLLISION", 503);
    }
    const now = this.now();
    const continuation = await this.options.repository.createContinuation({
      id: this.uuid(),
      preparationCapabilityHash: hashOpaqueProductionCapability(
        input.preparationCapability,
      ),
      continuationTokenHash: hashCustomerAuthContinuation(continuationToken),
      csrfTokenHash: hashCustomerAuthCsrf(csrfToken),
      flowKind: input.flowKind,
      expiresAt: addSeconds(
        now,
        this.options.environment.continuationTtlSeconds,
      ),
      now,
    });
    return {
      continuationToken,
      csrfToken,
      expiresAt: continuation.expiresAt,
      ttlSeconds: this.options.environment.continuationTtlSeconds,
    };
  }

  async validateContinuation(input: {
    continuationToken: unknown;
    csrfToken: unknown;
    flowKind: CustomerAuthFlowKind;
  }) {
    const continuation = await this.options.repository.validateContinuation({
      continuationTokenHash: hashCustomerAuthContinuation(input.continuationToken),
      csrfTokenHash: hashCustomerAuthCsrf(input.csrfToken),
      flowKind: input.flowKind,
      now: this.now(),
    });
    if (!continuation) {
      throw new M2RuntimeError("CUSTOMER_AUTH_CONTINUATION_INVALID", 403);
    }
    return continuation;
  }

  async startGoogle(
    input: { continuationToken: unknown; csrfToken: unknown },
    observe?: CustomerAuthGoogleObserver,
  ) {
    await observeCustomerAuthGoogleOperation({
      phase: "start_continuation",
      observe,
      now: this.options.monotonicNow,
      operation: () =>
        this.validateContinuation({ ...input, flowKind: "google" }),
    });
    return observeCustomerAuthGoogleOperation({
      phase: "start_provider",
      observe,
      now: this.options.monotonicNow,
      operation: () => this.options.provider.startGoogleOAuth(),
    });
  }

  async requestEmailOtp(input: {
    continuationToken: unknown;
    csrfToken: unknown;
    email: unknown;
  }) {
    await this.validateContinuation({ ...input, flowKind: "email_otp" });
    const email = normalizeDeliveryEmail(input.email);
    await this.options.provider.requestEmailOtp(email);
    return {
      status: "accepted" as const,
      guidance:
        "メールが届かない場合、Googleで登録した方はGoogleで続けてください。",
    };
  }

  private async bindIdentity(input: {
    continuationToken: unknown;
    csrfToken: unknown;
    identity: CustomerAuthIdentityV1;
  }) {
    const now = this.now();
    const email = normalizeDeliveryEmail(input.identity.verifiedEmail);
    return this.options.repository.bindPreparation({
      bindingId: this.uuid(),
      ownershipReferenceId: this.uuid(),
      continuationTokenHash: hashCustomerAuthContinuation(input.continuationToken),
      csrfTokenHash: hashCustomerAuthCsrf(input.csrfToken),
      customerUserId: input.identity.customerUserId,
      deliveryEmailHash: hashDeliveryEmail(
        email,
        this.options.environment.emailHashPepper,
      ),
      deliveryEmailCiphertext: encryptDeliveryEmail(
        email,
        this.options.environment.emailEncryptionKey,
      ),
      deliveryEmailKeyVersion: this.options.environment.emailKeyVersion,
      deliveryEmailVerifiedSource: input.identity.verifiedEmailSource,
      deliveryEmailVerifiedAt: now,
      now,
    });
  }

  async bindAuthenticatedPrepayment(input: {
    preparationCapability: unknown;
    identity: CustomerAuthIdentityV1;
  }) {
    const now = this.now();
    const email = normalizeDeliveryEmail(input.identity.verifiedEmail);
    return this.options.repository.bindPrepaymentByCapability({
      bindingId: this.uuid(),
      ownershipReferenceId: this.uuid(),
      preparationCapabilityHash: hashOpaqueProductionCapability(
        input.preparationCapability,
      ),
      customerUserId: input.identity.customerUserId,
      deliveryEmailHash: hashDeliveryEmail(
        email,
        this.options.environment.emailHashPepper,
      ),
      deliveryEmailCiphertext: encryptDeliveryEmail(
        email,
        this.options.environment.emailEncryptionKey,
      ),
      deliveryEmailKeyVersion: this.options.environment.emailKeyVersion,
      deliveryEmailVerifiedSource: input.identity.verifiedEmailSource,
      deliveryEmailVerifiedAt: now,
      now,
    });
  }

  async verifyEmailOtp(input: {
    continuationToken: unknown;
    csrfToken: unknown;
    email: unknown;
    otp: unknown;
  }) {
    await this.validateContinuation({ ...input, flowKind: "email_otp" });
    if (typeof input.otp !== "string") {
      throw new M2RuntimeError("CUSTOMER_AUTH_EMAIL_OTP_INVALID", 403);
    }
    const identity = await this.options.provider.verifyEmailOtp({
      email: normalizeDeliveryEmail(input.email),
      otp: input.otp,
    });
    return this.bindIdentity({ ...input, identity });
  }

  async completeGoogleCallback(input: {
    continuationToken: unknown;
    csrfToken: unknown;
    code: string;
  }, observe?: CustomerAuthGoogleObserver) {
    await observeCustomerAuthGoogleOperation({
      phase: "callback_continuation",
      observe,
      now: this.options.monotonicNow,
      operation: () =>
        this.validateContinuation({ ...input, flowKind: "google" }),
    });
    const identity = await this.options.provider.exchangeGoogleCallback(
      input.code,
      observe,
    );
    return observeCustomerAuthGoogleOperation({
      phase: "callback_binding",
      observe,
      now: this.options.monotonicNow,
      operation: () => this.bindIdentity({ ...input, identity }),
    });
  }

  async getFreshIdentity() {
    const identity = await this.options.provider.getFreshIdentity();
    if (!identity) throw new M2RuntimeError("CUSTOMER_AUTH_REQUIRED", 401);
    return identity;
  }

  async listAccountHistory() {
    const identity = await this.getFreshIdentity();
    return this.options.repository.listAccountHistory(identity.customerUserId);
  }

  async resolveOwnedResult(deliveryId: string) {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu.test(deliveryId)) {
      return null;
    }
    const identity = await this.getFreshIdentity();
    return this.options.repository.resolveOwnedResult({
      customerUserId: identity.customerUserId,
      deliveryId,
    });
  }

  async logout(scope: "local" | "global") {
    await this.getFreshIdentity();
    await this.options.provider.logout(scope);
  }
}
