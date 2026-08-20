import "server-only";
import { M2RuntimeError } from "../../assessment/runtime/errors.ts";
import { paymentEnvironmentFromSecretKey } from "./stripe.ts";
import type {
  EmailVerificationPolicyV1,
  PaymentEnvironment,
} from "./types.ts";

export type PaymentDeliveryEnvironment = Readonly<{
  supabaseUrl: string;
  supabaseSecretKey: string;
  siteOrigin: string;
  verificationPepper: string;
  emailEncryptionKey: string;
  purchaseStatusSigningSecret: string;
  policy: EmailVerificationPolicyV1;
  fulfillmentLeaseSeconds: number;
}>;

export type StripeCheckoutEnvironment = Readonly<{
  secretKey: string;
  environment: PaymentEnvironment;
  payPayEnabled: boolean;
}>;

function enabled(name: string) {
  return process.env[name] === "true";
}

function required(name: string) {
  const value = process.env[name];
  if (!value) throw new M2RuntimeError("PAYMENT_CONFIGURATION_INVALID", 503);
  return value;
}

function requiredInteger(name: string, minimum: number, maximum: number) {
  const value = required(name);
  if (!/^\d+$/u.test(value)) {
    throw new M2RuntimeError("PAYMENT_CONFIGURATION_INVALID", 503);
  }
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < minimum || parsed > maximum) {
    throw new M2RuntimeError("PAYMENT_CONFIGURATION_INVALID", 503);
  }
  return parsed;
}

export function isCustomerPaymentFlowVisible() {
  return (
    enabled("PAYMENT_PRODUCTION_ENABLED") &&
    enabled("EMAIL_VERIFICATION_ENABLED") &&
    enabled("ASSESSMENT_PRODUCTION_PREPARATION_ENABLED") &&
    !enabled("PAYMENT_EMERGENCY_STOP") &&
    !enabled("EMAIL_VERIFICATION_EMERGENCY_STOP") &&
    !enabled("ASSESSMENT_PRODUCTION_EMERGENCY_STOP")
  );
}

export function isEmailVerificationAvailable() {
  return (
    enabled("EMAIL_VERIFICATION_ENABLED") &&
    enabled("ASSESSMENT_PRODUCTION_PREPARATION_ENABLED") &&
    !enabled("EMAIL_VERIFICATION_EMERGENCY_STOP") &&
    !enabled("PAYMENT_EMERGENCY_STOP") &&
    !enabled("ASSESSMENT_PRODUCTION_EMERGENCY_STOP")
  );
}

export function isCheckoutAvailable() {
  return (
    enabled("PAYMENT_PRODUCTION_ENABLED") &&
    enabled("EMAIL_VERIFICATION_ENABLED") &&
    enabled("ASSESSMENT_PRODUCTION_PREPARATION_ENABLED") &&
    !enabled("PAYMENT_EMERGENCY_STOP") &&
    !enabled("EMAIL_VERIFICATION_EMERGENCY_STOP") &&
    !enabled("ASSESSMENT_PRODUCTION_EMERGENCY_STOP")
  );
}

export function isCustomerEmailDeliveryAvailable() {
  return (
    enabled("EMAIL_VERIFICATION_ENABLED") &&
    !enabled("EMAIL_VERIFICATION_EMERGENCY_STOP")
  );
}

export function isStripeWebhookAvailable() {
  return enabled("STRIPE_WEBHOOK_ENABLED");
}

export function isPaidFulfillmentProcessingAvailable() {
  return (
    enabled("PAYMENT_FULFILLMENT_PROCESSING_ENABLED") &&
    !enabled("PAYMENT_FULFILLMENT_EMERGENCY_STOP")
  );
}

export function readPaymentDeliveryEnvironment(): PaymentDeliveryEnvironment {
  return {
    supabaseUrl: required("SUPABASE_URL"),
    supabaseSecretKey: required("SUPABASE_SECRET_KEY"),
    siteOrigin: required("NEXT_PUBLIC_APP_URL"),
    verificationPepper: required("EMAIL_VERIFICATION_SECRET_PEPPER"),
    emailEncryptionKey: required("EMAIL_ADDRESS_ENCRYPTION_KEY"),
    purchaseStatusSigningSecret: required(
      "PURCHASE_STATUS_SIGNING_SECRET",
    ),
    policy: {
      challengeTtlSeconds: requiredInteger(
        "EMAIL_VERIFICATION_CHALLENGE_TTL_SECONDS",
        60,
        86_400,
      ),
      trustedSessionTtlSeconds: requiredInteger(
        "TRUSTED_EMAIL_SESSION_TTL_SECONDS",
        60,
        31_536_000,
      ),
      maximumVerificationAttempts: requiredInteger(
        "EMAIL_VERIFICATION_MAX_ATTEMPTS",
        1,
        20,
      ),
    },
    fulfillmentLeaseSeconds: requiredInteger(
      "PAYMENT_FULFILLMENT_LEASE_SECONDS",
      30,
      3_600,
    ),
  };
}

export function readStripeCheckoutEnvironment(): StripeCheckoutEnvironment {
  const secretKey = required("STRIPE_SECRET_KEY");
  const configuredEnvironment = readConfiguredPaymentEnvironment();
  const keyEnvironment = paymentEnvironmentFromSecretKey(secretKey);
  if (configuredEnvironment !== keyEnvironment) {
    throw new M2RuntimeError("PAYMENT_CONFIGURATION_INVALID", 503);
  }
  return {
    secretKey,
    environment: configuredEnvironment,
    payPayEnabled: enabled("STRIPE_PAYPAY_ENABLED"),
  };
}

export function readConfiguredPaymentEnvironment(): PaymentEnvironment {
  const configured = required("PAYMENT_PROVIDER_ENVIRONMENT");
  if (configured !== "test" && configured !== "live") {
    throw new M2RuntimeError("PAYMENT_CONFIGURATION_INVALID", 503);
  }
  return configured;
}

export function readStripeWebhookEnvironment() {
  const checkout = readStripeCheckoutEnvironment();
  return {
    ...checkout,
    webhookSecret: required("STRIPE_WEBHOOK_SECRET"),
  };
}
