import type {
  DeliveryNotificationAdapterV1,
  DeliveryNotificationRequestV1,
} from "../../assessment/production/notification.ts";
import { M2RuntimeError } from "../../assessment/runtime/errors.ts";
import { decryptDeliveryEmail } from "./crypto.ts";
import type { PaymentDeliveryRepository } from "./types.ts";
import type { TransactionalEmailAdapterV1 } from "./transactional-email.ts";

export class VerifiedEmailResultNotificationAdapterV1
  implements DeliveryNotificationAdapterV1
{
  constructor(
    private readonly repository: PaymentDeliveryRepository,
    private readonly transactionalEmail: TransactionalEmailAdapterV1,
    private readonly emailEncryptionKey: string,
    private readonly siteOrigin: string,
  ) {}

  async send(request: DeliveryNotificationRequestV1) {
    const ciphertext =
      await this.repository.resolveDeliveryEmailCiphertext(
        request.deliveryAuthorityReference,
      );
    if (!ciphertext) {
      throw new M2RuntimeError("RESULT_EMAIL_AUTHORITY_NOT_FOUND", 503);
    }
    const recipientEmail = decryptDeliveryEmail(
      ciphertext,
      this.emailEncryptionKey,
    );
    return this.transactionalEmail.sendAssessmentResult({
      recipientEmail,
      resultUrl: `${this.siteOrigin}/result/${request.resultAccessToken}`,
      messageIdempotencyKey: `result-notification:${request.notificationId}`,
    });
  }
}
