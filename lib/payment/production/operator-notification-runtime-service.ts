/**
 * Netlify scheduled-function runtime only. Keep this module outside every
 * browser graph; the Netlify artifact cannot use Next's `server-only` marker.
 */
import { randomUUID } from "node:crypto";
import { M2RuntimeError } from "../../assessment/runtime/errors.ts";
import {
  DiscordOperatorWebhookClient,
  validateOperatorDiscordUserId,
  type OperatorDiscordTransport,
} from "./operator-notification.ts";
import {
  runOperatorNotificationSchedule,
  type OperatorNotificationRepository,
} from "./operator-notification-scheduler.ts";
import { SupabaseOperatorNotificationRepository } from "./operator-notification-supabase-repository.ts";

type OperatorNotificationEnvironment = Readonly<{
  supabaseUrl: string;
  supabaseSecretKey: string;
  paymentEnvironment: "test" | "live";
  activeFrom: string;
  webhookUrl: string;
  operatorUserId?: string;
}>;

type RuntimeEnvironment = Readonly<Record<string, string | undefined>>;

function required(environment: RuntimeEnvironment, name: string) {
  const value = environment[name];
  if (!value) {
    throw new M2RuntimeError(
      "OPERATOR_NOTIFICATION_CONFIGURATION_INVALID",
      503,
    );
  }
  return value;
}

function readOperatorNotificationEnvironment(
  environment: RuntimeEnvironment,
): OperatorNotificationEnvironment {
  const paymentEnvironment = required(
    environment,
    "PAYMENT_PROVIDER_ENVIRONMENT",
  );
  if (paymentEnvironment !== "test" && paymentEnvironment !== "live") {
    throw new M2RuntimeError(
      "OPERATOR_NOTIFICATION_CONFIGURATION_INVALID",
      503,
    );
  }
  const activeFrom = required(
    environment,
    "DISCORD_OPERATOR_NOTIFICATIONS_ACTIVE_FROM",
  );
  const activeFromTimestamp = Date.parse(activeFrom);
  if (
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/u.test(
      activeFrom,
    ) ||
    !Number.isFinite(activeFromTimestamp) ||
    new Date(activeFromTimestamp).toISOString() !== activeFrom
  ) {
    throw new M2RuntimeError(
      "OPERATOR_NOTIFICATION_CONFIGURATION_INVALID",
      503,
    );
  }
  const operatorUserId = validateOperatorDiscordUserId(
    environment.DISCORD_OPERATOR_ACTION_REQUIRED_USER_ID,
  );
  return {
    supabaseUrl: required(environment, "SUPABASE_URL"),
    supabaseSecretKey: required(environment, "SUPABASE_SECRET_KEY"),
    paymentEnvironment,
    activeFrom,
    webhookUrl: required(environment, "DISCORD_OPERATOR_WEBHOOK_URL"),
    ...(operatorUserId ? { operatorUserId } : {}),
  };
}

export function isProductionOperatorNotificationScheduleEnabled(
  environment: RuntimeEnvironment = process.env,
) {
  return (
    environment.DISCORD_OPERATOR_NOTIFICATIONS_ENABLED === "true" &&
    environment.DISCORD_OPERATOR_NOTIFICATIONS_EMERGENCY_STOP !== "true"
  );
}

export async function runConfiguredProductionOperatorNotificationSchedule(
  dependencies: Readonly<{
    environment?: RuntimeEnvironment;
    uuid?: () => string;
    now?: () => Date;
    createRepository?: (
      url: string,
      secretKey: string,
    ) => OperatorNotificationRepository;
    createTransport?: (
      webhookUrl: string,
    ) => OperatorDiscordTransport;
  }> = {},
) {
  const environment = dependencies.environment ?? process.env;
  if (!isProductionOperatorNotificationScheduleEnabled(environment)) {
    return { disabled: true as const };
  }
  const configured = readOperatorNotificationEnvironment(environment);
  const repository = (dependencies.createRepository ??
    ((url, secretKey) =>
      new SupabaseOperatorNotificationRepository(url, secretKey)))(
    configured.supabaseUrl,
    configured.supabaseSecretKey,
  );
  const transport = (dependencies.createTransport ??
    ((webhookUrl) => new DiscordOperatorWebhookClient(webhookUrl)))(
    configured.webhookUrl,
  );
  return runOperatorNotificationSchedule({
    repository,
    transport,
    ownerId: (dependencies.uuid ?? randomUUID)(),
    environment: configured.paymentEnvironment,
    activeFrom: configured.activeFrom,
    ...(configured.operatorUserId
      ? { operatorUserId: configured.operatorUserId }
      : {}),
    ...(dependencies.now ? { now: dependencies.now } : {}),
  });
}
