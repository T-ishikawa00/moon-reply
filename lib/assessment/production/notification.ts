import { M2RuntimeError } from "../runtime/errors.ts";

export type DeliveryNotificationRequestV1 = Readonly<{
  notificationId: string;
  deliveryAuthorityReference: string;
  resultAccessToken: string;
}>;

export type DeliveryNotificationAdapterV1 = {
  prepare(request: DeliveryNotificationRequestV1): Promise<string>;
  sendPrepared(notificationId: string, payloadCiphertext: string): Promise<{
    providerMessageReference: string;
  }>;
};

export class ResultNotificationSendError extends M2RuntimeError {
  readonly outcome: "not_sent" | "rejected" | "unknown" | "conflict";
  constructor(outcome: "not_sent" | "rejected" | "unknown" | "conflict") {
    super("RESULT_EMAIL_DELIVERY_FAILED", 503);
    this.outcome = outcome;
  }
}

export class UnconfiguredDeliveryNotificationAdapterV1
  implements DeliveryNotificationAdapterV1
{
  async prepare(): Promise<never> {
    throw new M2RuntimeError("PRODUCTION_NOTIFICATION_PROVIDER_UNCONFIGURED", 503);
  }

  async sendPrepared(): Promise<never> {
    throw new M2RuntimeError("PRODUCTION_NOTIFICATION_PROVIDER_UNCONFIGURED", 503);
  }
}

export class DeterministicFakeDeliveryNotificationAdapterV1
  implements DeliveryNotificationAdapterV1
{
  readonly requests: DeliveryNotificationRequestV1[] = [];
  private failuresRemaining: number;

  constructor(failuresBeforeSuccess = 0) {
    this.failuresRemaining = failuresBeforeSuccess;
  }

  async prepare(request: DeliveryNotificationRequestV1) {
    // Fake-only transport. Production persists an authenticated ciphertext.
    return JSON.stringify(request);
  }

  async sendPrepared(notificationId: string, payloadCiphertext: string) {
    const request = JSON.parse(payloadCiphertext) as DeliveryNotificationRequestV1;
    if (request.notificationId !== notificationId) throw new Error("fake identity mismatch");
    this.requests.push(structuredClone(request));
    if (this.failuresRemaining > 0) {
      this.failuresRemaining -= 1;
      throw new M2RuntimeError("PRODUCTION_NOTIFICATION_DELIVERY_FAILED", 503);
    }
    return {
      providerMessageReference: `fake-message-${this.requests.length}`,
    };
  }
}
