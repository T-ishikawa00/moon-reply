import {
  formatOperatorDiscordNotification,
  OperatorNotificationPayloadError,
  type OperatorDiscordTransport,
  type OperatorNotification,
} from "./operator-notification.ts";

export const OPERATOR_NOTIFICATION_CLAIM_LIMIT = 4;
export const OPERATOR_NOTIFICATION_LEASE_SECONDS = 30;

export type ClaimedOperatorNotification = Readonly<{
  notificationId: string;
  notification: OperatorNotification;
}>;

export interface OperatorNotificationRepository {
  claimBatch(input: Readonly<{
    ownerId: string;
    environment: "test" | "live";
    activeFrom: string;
    now: string;
    leaseExpiresAt: string;
    limit: number;
  }>): Promise<readonly ClaimedOperatorNotification[]>;
  beginSend(input: Readonly<{
    notificationId: string;
    ownerId: string;
    now: string;
  }>): Promise<"ready" | "superseded">;
  complete(input: Readonly<{
    notificationId: string;
    ownerId: string;
    providerMessageReference: string;
    now: string;
  }>): Promise<void>;
  finish(input: Readonly<{
    notificationId: string;
    ownerId: string;
    outcome: "retryable" | "ambiguous" | "terminal_failure";
    retryAfterSeconds?: number;
    errorCode: string;
    now: string;
  }>): Promise<void>;
}

export type OperatorNotificationScheduleOutcome = Readonly<{
  claimed: number;
  sent: number;
  retryable: number;
  ambiguous: number;
  terminalFailures: number;
  superseded: number;
  processingFailures: number;
}>;

export type OperatorNotificationScheduleDependencies = Readonly<{
  repository: OperatorNotificationRepository;
  transport: OperatorDiscordTransport;
  ownerId: string;
  environment: "test" | "live";
  activeFrom: string;
  operatorUserId?: string;
  now?: () => Date;
}>;

function safeIsoNow(clock: () => Date) {
  const value = clock();
  if (!(value instanceof Date) || !Number.isFinite(value.getTime())) {
    throw new Error("OPERATOR_NOTIFICATION_CLOCK_INVALID");
  }
  return value.toISOString();
}

export async function runOperatorNotificationSchedule(
  dependencies: OperatorNotificationScheduleDependencies,
): Promise<OperatorNotificationScheduleOutcome> {
  const clock = dependencies.now ?? (() => new Date());
  const claimNow = safeIsoNow(clock);
  const leaseExpiresAt = new Date(
    Date.parse(claimNow) + OPERATOR_NOTIFICATION_LEASE_SECONDS * 1_000,
  ).toISOString();
  const claimed = await dependencies.repository.claimBatch({
    ownerId: dependencies.ownerId,
    environment: dependencies.environment,
    activeFrom: dependencies.activeFrom,
    now: claimNow,
    leaseExpiresAt,
    limit: OPERATOR_NOTIFICATION_CLAIM_LIMIT,
  });
  if (claimed.length > OPERATOR_NOTIFICATION_CLAIM_LIMIT) {
    throw new Error("OPERATOR_NOTIFICATION_CLAIM_LIMIT_EXCEEDED");
  }

  const counts = {
    claimed: claimed.length,
    sent: 0,
    retryable: 0,
    ambiguous: 0,
    terminalFailures: 0,
    superseded: 0,
    processingFailures: 0,
  };

  for (const item of claimed) {
    let disposition: "ready" | "superseded";
    try {
      disposition = await dependencies.repository.beginSend({
        notificationId: item.notificationId,
        ownerId: dependencies.ownerId,
        now: safeIsoNow(clock),
      });
    } catch {
      counts.processingFailures += 1;
      continue;
    }
    if (disposition === "superseded") {
      counts.superseded += 1;
      continue;
    }

    let result;
    try {
      const payload = formatOperatorDiscordNotification(
        item.notification,
        dependencies.operatorUserId,
      );
      result = await dependencies.transport.send(payload);
    } catch (error) {
      const errorCode =
        error instanceof OperatorNotificationPayloadError
          ? error.safeCode
          : "DISCORD_TRANSPORT_UNEXPECTED_AMBIGUOUS";
      const outcome =
        error instanceof OperatorNotificationPayloadError
          ? "terminal_failure"
          : "ambiguous";
      try {
        await dependencies.repository.finish({
          notificationId: item.notificationId,
          ownerId: dependencies.ownerId,
          outcome,
          errorCode,
          now: safeIsoNow(clock),
        });
        if (outcome === "terminal_failure") {
          counts.terminalFailures += 1;
        } else {
          counts.ambiguous += 1;
        }
      } catch {
        counts.processingFailures += 1;
      }
      continue;
    }

    try {
      if (result.outcome === "sent") {
        await dependencies.repository.complete({
          notificationId: item.notificationId,
          ownerId: dependencies.ownerId,
          providerMessageReference: result.providerMessageReference,
          now: safeIsoNow(clock),
        });
        counts.sent += 1;
        continue;
      }

      await dependencies.repository.finish({
        notificationId: item.notificationId,
        ownerId: dependencies.ownerId,
        outcome: result.outcome,
        ...(result.outcome === "retryable"
          ? { retryAfterSeconds: result.retryAfterSeconds }
          : {}),
        errorCode: result.errorCode,
        now: safeIsoNow(clock),
      });
      if (result.outcome === "retryable") {
        counts.retryable += 1;
      } else if (result.outcome === "ambiguous") {
        counts.ambiguous += 1;
      } else {
        counts.terminalFailures += 1;
      }
    } catch {
      counts.processingFailures += 1;
    }
  }

  return counts;
}
