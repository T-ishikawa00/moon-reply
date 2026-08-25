import "server-only";

import { M2RuntimeError } from "../assessment/runtime/errors";
import { normalizeDeliveryEmail } from "../payment/production/crypto";
import type {
  CustomerAuthIdentityV1,
  CustomerAuthProviderV1,
  CustomerAuthSessionState,
} from "./types";

export class CustomerAccountAuthApplicationV1 {
  constructor(private readonly provider: CustomerAuthProviderV1) {}

  startGoogle() {
    return this.provider.startGoogleOAuth("account");
  }

  requestEmailOtp(email: unknown) {
    return this.provider.requestEmailOtp(normalizeDeliveryEmail(email));
  }

  verifyEmailOtp(input: { email: unknown; otp: unknown }) {
    if (typeof input.otp !== "string") {
      throw new M2RuntimeError("CUSTOMER_AUTH_EMAIL_OTP_INVALID", 403);
    }
    return this.provider.verifyEmailOtp({
      email: normalizeDeliveryEmail(input.email),
      otp: input.otp,
    });
  }

  completeGoogleCallback(code: string): Promise<CustomerAuthIdentityV1> {
    return this.provider.exchangeGoogleCallback(code);
  }

  getFreshSessionState(): Promise<CustomerAuthSessionState> {
    return this.provider.getFreshSessionState();
  }

  async getFreshIdentity() {
    const identity = await this.provider.getFreshIdentity();
    if (!identity) throw new M2RuntimeError("CUSTOMER_AUTH_REQUIRED", 401);
    return identity;
  }

  async logout(scope: "local" | "global") {
    await this.getFreshIdentity();
    await this.provider.logout(scope);
  }
}
