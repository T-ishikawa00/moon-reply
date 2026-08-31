import type { PaymentEnvironment } from "../payment/production/types.ts";
import type { MeasurementTransactionId } from "./events.ts";

export type PurchaseMeasurementJobState =
  | "pending"
  | "processing"
  | "retryable"
  | "sent"
  | "terminal_failure"
  | "suppressed";

export type PurchaseMeasurementJob = Readonly<{
  id: string;
  verifiedPaymentId: string;
  environment: PaymentEnvironment;
  transactionId: MeasurementTransactionId;
  clientId: string;
  sessionId: number;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmContent: string | null;
  gclid: string | null;
  landingPath: string;
  value: 980;
  currency: "JPY";
  state: PurchaseMeasurementJobState;
  attemptCount: number;
}>;

export interface PurchaseMeasurementJobRepository {
  claim(input: {
    environment: PaymentEnvironment;
    ownerId: string;
    now: string;
    leaseExpiresAt: string;
    limit: number;
  }): Promise<readonly PurchaseMeasurementJob[]>;
  complete(input: { jobId: string; ownerId: string; now: string }): Promise<void>;
  fail(input: {
    jobId: string;
    ownerId: string;
    retryable: boolean;
    errorCode: string;
    retryAfter: string;
    now: string;
  }): Promise<void>;
}

export interface PurchaseMeasurementTransport {
  send(job: PurchaseMeasurementJob): Promise<Readonly<{ status: number }>>;
}

export async function runPurchaseMeasurementSchedule(input: {
  repository: PurchaseMeasurementJobRepository;
  transport: PurchaseMeasurementTransport;
  environment: PaymentEnvironment;
  ownerId: string;
  now: () => Date;
}) {
  const startedAt = input.now();
  const jobs = await input.repository.claim({
    environment: input.environment,
    ownerId: input.ownerId,
    now: startedAt.toISOString(),
    leaseExpiresAt: new Date(startedAt.getTime() + 30_000).toISOString(),
    limit: 4,
  });
  let sent = 0;
  let retryable = 0;
  let terminal = 0;
  for (const job of jobs) {
    if (job.environment !== input.environment) {
      await input.repository.fail({
        jobId: job.id,
        ownerId: input.ownerId,
        retryable: false,
        errorCode: "MEASUREMENT_ENVIRONMENT_MISMATCH",
        retryAfter: input.now().toISOString(),
        now: input.now().toISOString(),
      });
      terminal += 1;
      continue;
    }
    try {
      const response = await input.transport.send(job);
      if (response.status >= 200 && response.status < 300) {
        await input.repository.complete({
          jobId: job.id,
          ownerId: input.ownerId,
          now: input.now().toISOString(),
        });
        sent += 1;
        continue;
      }
      const canRetry =
        job.attemptCount < 5 &&
        (response.status === 408 || response.status === 425 ||
          response.status === 429 || response.status >= 500);
      await input.repository.fail({
        jobId: job.id,
        ownerId: input.ownerId,
        retryable: canRetry,
        errorCode: canRetry ? "GA4_HTTP_RETRYABLE" : "GA4_HTTP_REJECTED",
        retryAfter: new Date(input.now().getTime() + 60_000).toISOString(),
        now: input.now().toISOString(),
      });
      if (canRetry) retryable += 1;
      else terminal += 1;
    } catch {
      const canRetry = job.attemptCount < 5;
      await input.repository.fail({
        jobId: job.id,
        ownerId: input.ownerId,
        retryable: canRetry,
        errorCode: canRetry ? "GA4_NETWORK_RETRYABLE" : "GA4_NETWORK_EXHAUSTED",
        retryAfter: new Date(input.now().getTime() + 60_000).toISOString(),
        now: input.now().toISOString(),
      });
      if (canRetry) retryable += 1;
      else terminal += 1;
    }
  }
  return { claimed: jobs.length, sent, retryable, terminal } as const;
}
