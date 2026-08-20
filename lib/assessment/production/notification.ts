import { M2RuntimeError } from "../runtime/errors.ts";

export type DeliveryNotificationRequestV1 = Readonly<{
  notificationId: string;
  deliveryAuthorityReference: string;
  resultAccessToken: string;
}>;

export type DeliveryNotificationAdapterV1 = {
  send(request: DeliveryNotificationRequestV1): Promise<{
    providerMessageReference: string;
  }>;
};

export class UnconfiguredDeliveryNotificationAdapterV1
  implements DeliveryNotificationAdapterV1
{
  async send(): Promise<never> {
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

  async send(request: DeliveryNotificationRequestV1) {
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
