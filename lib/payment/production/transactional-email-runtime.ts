import { M2RuntimeError } from "../../assessment/runtime/errors.ts";
import { isCustomerEmailDeliveryAvailable } from "./environment-runtime.ts";
import { createResendTransactionalEmailAdapterV1 } from "./resend-transactional-email-runtime.ts";
import {
  UnconfiguredTransactionalEmailAdapterV1,
  type TransactionalEmailAdapterV1,
} from "./transactional-email.ts";

export function createConfiguredTransactionalEmailAdapter(): TransactionalEmailAdapterV1 {
  if (!isCustomerEmailDeliveryAvailable()) {
    return new UnconfiguredTransactionalEmailAdapterV1();
  }
  const configured = process.env.TRANSACTIONAL_EMAIL_PROVIDER;
  if (!configured || configured === "unconfigured") {
    return new UnconfiguredTransactionalEmailAdapterV1();
  }
  if (configured === "resend") {
    return createResendTransactionalEmailAdapterV1({
      apiKey: process.env.EMAIL_API_KEY,
      fromAddress: process.env.EMAIL_FROM_ADDRESS,
      fromName: process.env.EMAIL_FROM_NAME,
    });
  }
  throw new M2RuntimeError("TRANSACTIONAL_EMAIL_PROVIDER_UNSUPPORTED", 503);
}
