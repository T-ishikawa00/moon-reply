import { M2RuntimeError } from "../../assessment/runtime/errors.ts";

export type MailboxVerificationEmailV1 = Readonly<{
  recipientEmail: string;
  verificationCode: string;
  expiresAt: string;
  messageIdempotencyKey: string;
}>;

export type AssessmentResultEmailV1 = Readonly<{
  recipientEmail: string;
  resultUrl: string;
  messageIdempotencyKey: string;
}>;

export type PreparedAssessmentResultEmailV1 = Readonly<{
  messageIdempotencyKey: string;
  payload: Readonly<{ from: string; to: string; subject: string; text: string; html: string }>;
}>;

export type TransactionalEmailAdapterV1 = {
  // Verification-only adapters need not implement result delivery. The result
  // notification adapter fails closed unless both durable-payload methods exist.
  prepareAssessmentResult?(request: AssessmentResultEmailV1): PreparedAssessmentResultEmailV1;
  sendPreparedAssessmentResult?(request: PreparedAssessmentResultEmailV1): Promise<{ providerMessageReference: string }>;
  sendMailboxVerification(
    request: MailboxVerificationEmailV1,
  ): Promise<{ providerMessageReference: string }>;
  sendAssessmentResult(
    request: AssessmentResultEmailV1,
  ): Promise<{ providerMessageReference: string }>;
};

export class UnconfiguredTransactionalEmailAdapterV1
  implements TransactionalEmailAdapterV1
{
  prepareAssessmentResult(): never {
    throw new M2RuntimeError("TRANSACTIONAL_EMAIL_PROVIDER_UNCONFIGURED", 503);
  }
  async sendPreparedAssessmentResult(): Promise<never> {
    throw new M2RuntimeError("TRANSACTIONAL_EMAIL_PROVIDER_UNCONFIGURED", 503);
  }
  async sendMailboxVerification(): Promise<never> {
    throw new M2RuntimeError("TRANSACTIONAL_EMAIL_PROVIDER_UNCONFIGURED", 503);
  }

  async sendAssessmentResult(): Promise<never> {
    throw new M2RuntimeError("TRANSACTIONAL_EMAIL_PROVIDER_UNCONFIGURED", 503);
  }
}
export class DeterministicFakeTransactionalEmailAdapterV1
  implements TransactionalEmailAdapterV1
{
  readonly verificationRequests: MailboxVerificationEmailV1[] = [];
  readonly resultRequests: AssessmentResultEmailV1[] = [];
  verificationFailuresRemaining = 0;
  resultFailuresRemaining = 0;

  prepareAssessmentResult(request: AssessmentResultEmailV1): PreparedAssessmentResultEmailV1 {
    return { messageIdempotencyKey: request.messageIdempotencyKey,
      payload: { from: "fake@example.com", to: request.recipientEmail,
        subject: "fake result", text: request.resultUrl, html: request.resultUrl } };
  }

  async sendPreparedAssessmentResult(request: PreparedAssessmentResultEmailV1) {
    return this.sendAssessmentResult({ recipientEmail: request.payload.to,
      resultUrl: request.payload.text, messageIdempotencyKey: request.messageIdempotencyKey });
  }

  async sendMailboxVerification(request: MailboxVerificationEmailV1) {
    this.verificationRequests.push(structuredClone(request));
    if (this.verificationFailuresRemaining > 0) {
      this.verificationFailuresRemaining -= 1;
      throw new M2RuntimeError("EMAIL_VERIFICATION_DELIVERY_FAILED", 503);
    }
    return {
      providerMessageReference: `fake-verification-${this.verificationRequests.length}`,
    };
  }

  async sendAssessmentResult(request: AssessmentResultEmailV1) {
    this.resultRequests.push(structuredClone(request));
    if (this.resultFailuresRemaining > 0) {
      this.resultFailuresRemaining -= 1;
      throw new M2RuntimeError("RESULT_EMAIL_DELIVERY_FAILED", 503);
    }
    return {
      providerMessageReference: `fake-result-${this.resultRequests.length}`,
    };
  }
}
