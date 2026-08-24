import { M2RuntimeError } from "../../assessment/runtime/errors.ts";
import { paymentEnvironmentFromSecretKey } from "./stripe.ts";
import { readConfiguredPaymentEnvironment } from "./environment-runtime.ts";
import type { PaymentEnvironment } from "./types.ts";

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

export function readStripeWebhookEnvironment() {
  const checkout = readStripeCheckoutEnvironment();
  return {
    ...checkout,
    webhookSecret: required("STRIPE_WEBHOOK_SECRET"),
  };
}
