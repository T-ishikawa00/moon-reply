import type {
  DeliveryNotificationAdapterV1,
  DeliveryNotificationRequestV1,
} from "../../assessment/production/notification.ts";
import { M2RuntimeError } from "../../assessment/runtime/errors.ts";
import { ResultNotificationSendError } from "../../assessment/production/notification.ts";
import { decryptDeliveryEmail } from "./crypto.ts";
import { decryptNotificationEnvelope, encryptNotificationEnvelope } from "./notification-envelope.ts";
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

  async prepare(request: DeliveryNotificationRequestV1) {
    if (!this.transactionalEmail.prepareAssessmentResult ||
        !this.transactionalEmail.sendPreparedAssessmentResult) {
      throw new M2RuntimeError("PRODUCTION_NOTIFICATION_PROVIDER_UNCONFIGURED", 503);
    }
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
    const prepared = this.transactionalEmail.prepareAssessmentResult({
      recipientEmail,
      resultUrl: `${this.siteOrigin}/result/${request.resultAccessToken}`,
      messageIdempotencyKey: `result-notification:${request.notificationId}`,
    });
    return encryptNotificationEnvelope(request.notificationId, prepared, this.emailEncryptionKey);
  }

  async sendPrepared(notificationId: string, payloadCiphertext: string) {
    if (!this.transactionalEmail.sendPreparedAssessmentResult) {
      throw new ResultNotificationSendError("not_sent");
    }
    let prepared;
    try {
      prepared = decryptNotificationEnvelope(notificationId, payloadCiphertext, this.emailEncryptionKey);
    } catch {
      throw new ResultNotificationSendError("not_sent");
    }
    return this.transactionalEmail.sendPreparedAssessmentResult(prepared);
  }
}
