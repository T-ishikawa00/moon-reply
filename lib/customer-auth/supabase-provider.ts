import "server-only";

import type { SupabaseClient, User } from "@supabase/supabase-js";

import { M2RuntimeError } from "../assessment/runtime/errors";
import { normalizeDeliveryEmail } from "../payment/production/crypto";
import type {
  CustomerAuthIdentityV1,
  CustomerAuthProviderKind,
  CustomerAuthProviderV1,
  VerifiedDeliveryEmailSource,
} from "./types";

function identityEmail(identityData: Record<string, unknown> | undefined) {
  const value = identityData?.email;
  return typeof value === "string" ? normalizeDeliveryEmail(value) : null;
}

function normalizeUser(
  user: User,
  requiredSource?: VerifiedDeliveryEmailSource,
): CustomerAuthIdentityV1 {
  if (!user.email || !user.email_confirmed_at) {
    throw new M2RuntimeError("CUSTOMER_AUTH_VERIFIED_EMAIL_REQUIRED", 403);
  }
  const email = normalizeDeliveryEmail(user.email);
  const providers: CustomerAuthProviderKind[] = [];
  let emailIdentityVerified = false;
  let googleIdentityVerified = false;

  for (const identity of user.identities ?? []) {
    if (identity.provider === "email") {
      const candidate = identityEmail(identity.identity_data);
      if (candidate === null || candidate === email) {
        emailIdentityVerified = true;
        providers.push("email");
      }
    }
    if (identity.provider === "google") {
      const candidate = identityEmail(identity.identity_data);
      if (
        candidate === email &&
        identity.identity_data?.email_verified === true
      ) {
        googleIdentityVerified = true;
        providers.push("google");
      }
    }
  }

  const verifiedEmailSource =
    requiredSource ??
    (emailIdentityVerified
      ? "supabase_email_otp"
      : googleIdentityVerified
        ? "google_verified_identity"
        : null);
  if (
    verifiedEmailSource === null ||
    (verifiedEmailSource === "supabase_email_otp" && !emailIdentityVerified) ||
    (verifiedEmailSource === "google_verified_identity" && !googleIdentityVerified)
  ) {
    throw new M2RuntimeError("CUSTOMER_AUTH_VERIFIED_EMAIL_REQUIRED", 403);
  }

  return {
    customerUserId: user.id,
    verifiedEmail: email,
    verifiedEmailSource,
    authProviders: [...new Set(providers)].sort(),
  };
}

export class SupabaseCustomerAuthProviderV1 implements CustomerAuthProviderV1 {
  constructor(
    private readonly client: SupabaseClient,
    private readonly siteOrigin: string,
    private readonly supabaseUrl: string,
  ) {}

  async startGoogleOAuth() {
    const { data, error } = await this.client.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${this.siteOrigin}/api/auth/callback`,
        scopes: "openid email profile",
        skipBrowserRedirect: true,
      },
    });
    if (error || !data.url) {
      throw new M2RuntimeError("CUSTOMER_AUTH_GOOGLE_START_FAILED", 503);
    }
    let authorizationUrl: URL;
    try {
      authorizationUrl = new URL(data.url);
    } catch {
      throw new M2RuntimeError("CUSTOMER_AUTH_GOOGLE_START_FAILED", 503);
    }
    const expected = new URL(this.supabaseUrl);
    if (
      authorizationUrl.origin !== expected.origin ||
      !authorizationUrl.pathname.endsWith("/auth/v1/authorize")
    ) {
      throw new M2RuntimeError("CUSTOMER_AUTH_GOOGLE_START_FAILED", 503);
    }
    return { authorizationUrl: authorizationUrl.toString() };
  }

  async exchangeGoogleCallback(code: string) {
    if (!/^[A-Za-z0-9._~-]{16,2048}$/u.test(code)) {
      throw new M2RuntimeError("CUSTOMER_AUTH_CALLBACK_INVALID", 400);
    }
    const { error } = await this.client.auth.exchangeCodeForSession(code);
    if (error) throw new M2RuntimeError("CUSTOMER_AUTH_CALLBACK_INVALID", 403);
    const identity = await this.getFreshIdentityFor(
      "google_verified_identity",
    );
    if (!identity) {
      throw new M2RuntimeError("CUSTOMER_AUTH_CALLBACK_INVALID", 403);
    }
    return identity;
  }

  async requestEmailOtp(email: string) {
    const normalizedEmail = normalizeDeliveryEmail(email);
    const { error } = await this.client.auth.signInWithOtp({
      email: normalizedEmail,
      options: { shouldCreateUser: true },
    });
    if (error) {
      throw new M2RuntimeError("CUSTOMER_AUTH_EMAIL_OTP_REQUEST_FAILED", 503);
    }
  }

  async verifyEmailOtp(input: { email: string; otp: string }) {
    const email = normalizeDeliveryEmail(input.email);
    if (!/^[A-Za-z0-9]{6,12}$/u.test(input.otp)) {
      throw new M2RuntimeError("CUSTOMER_AUTH_EMAIL_OTP_INVALID", 403);
    }
    const { error } = await this.client.auth.verifyOtp({
      email,
      token: input.otp,
      type: "email",
    });
    if (error) {
      throw new M2RuntimeError("CUSTOMER_AUTH_EMAIL_OTP_INVALID", 403);
    }
    const identity = await this.getFreshIdentityFor("supabase_email_otp");
    if (!identity || identity.verifiedEmail !== email) {
      throw new M2RuntimeError("CUSTOMER_AUTH_EMAIL_OTP_INVALID", 403);
    }
    return identity;
  }

  private async getFreshIdentityFor(source?: VerifiedDeliveryEmailSource) {
    const { data, error } = await this.client.auth.getUser();
    if (error || !data.user) return null;
    return normalizeUser(data.user, source);
  }

  getFreshIdentity() {
    return this.getFreshIdentityFor();
  }

  async logout(scope: "local" | "global") {
    const { error } = await this.client.auth.signOut({ scope });
    if (error) throw new M2RuntimeError("CUSTOMER_AUTH_LOGOUT_FAILED", 503);
  }
}
