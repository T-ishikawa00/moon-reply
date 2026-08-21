import "server-only";

import { timingSafeEqual } from "node:crypto";

import {
  createPaymentCapability,
  hashPaymentCapability,
  validatePaymentCapability,
} from "../payment/production/crypto";

export function createCustomerAuthSecret() {
  return createPaymentCapability();
}

export function validateCustomerAuthSecret(value: unknown) {
  return validatePaymentCapability(value);
}

export function hashCustomerAuthContinuation(value: unknown) {
  return hashPaymentCapability(value, "customer-auth-continuation");
}

export function hashCustomerAuthCsrf(value: unknown) {
  return hashPaymentCapability(value, "customer-auth-csrf");
}

export function equalCustomerAuthSecret(left: unknown, right: unknown) {
  let normalizedLeft: string;
  let normalizedRight: string;
  try {
    normalizedLeft = validateCustomerAuthSecret(left);
    normalizedRight = validateCustomerAuthSecret(right);
  } catch {
    return false;
  }
  return timingSafeEqual(
    Buffer.from(normalizedLeft, "utf8"),
    Buffer.from(normalizedRight, "utf8"),
  );
}
