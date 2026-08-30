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

export type OperatorNotificationDiagnosticReasonCode =
  | "OPERATOR_SKIP_CONTEXT_UNAVAILABLE"
  | "OPERATOR_SKIP_NON_PRODUCTION"
  | "OPERATOR_SKIP_NOT_PUBLISHED"
  | "OPERATOR_SKIP_DISABLED"
  | "OPERATOR_SKIP_EMERGENCY_STOP"
  | "OPERATOR_ENTER_RUNTIME"
  | "OPERATOR_RUNTIME_CONFIGURATION"
  | "OPERATOR_SKIP_ACTIVE_FROM_MISSING"
  | "OPERATOR_SKIP_ACTIVE_FROM_INVALID"
  | "OPERATOR_SKIP_WEBHOOK_MISSING"
  | "OPERATOR_SKIP_CONFIGURATION_INVALID"
  | "OPERATOR_REPOSITORY_READY"
  | "OPERATOR_SKIP_REPOSITORY_INITIALIZATION_FAILED"
  | "OPERATOR_SKIP_TRANSPORT_INITIALIZATION_FAILED"
  | "OPERATOR_CLAIM_START"
  | "OPERATOR_CLAIM_OK"
  | "OPERATOR_CLAIM_FAILED";

export type OperatorNotificationSafeDeployContext =
  | "production"
  | "deploy-preview"
  | "branch-deploy"
  | "preview-server"
  | "dev-server"
  | "dev"
  | "other"
  | "unavailable";

/**
 * Deliberately closed diagnostic schema. It has no arbitrary message, env
 * value, identifier, URL, payload, or error field that could carry PII or a
 * secret into Production logs.
 */
export type OperatorNotificationRuntimeDiagnosticEvent = Readonly<{
  diagnostic: "operator_discord_r1";
  reason_code: OperatorNotificationDiagnosticReasonCode;
  deploy_present?: boolean;
  deploy_context?: OperatorNotificationSafeDeployContext;
  published?: boolean;
  production_guard_pass?: boolean;
  enabled_parse_result?: boolean;
  emergency_stop_parse_result?: boolean;
  active_from_present?: boolean;
  active_from_parse_valid?: boolean;
  webhook_secret_present?: boolean;
  repository_reached?: boolean;
  claim_rpc_started?: boolean;
  claim_rpc_succeeded?: boolean;
  claim_failure_code?:
    | "DATABASE_OPERATION_FAILED"
    | "UNEXPECTED_CLAIM_FAILURE";
  claimed_row_count?: number;
  cutover_confirmed?: boolean;
}>;

export type OperatorNotificationRuntimeDiagnosticLogger = (
  event: OperatorNotificationRuntimeDiagnosticEvent,
) => void;

function defaultDiagnosticLogger(
  event: OperatorNotificationRuntimeDiagnosticEvent,
) {
  console.info(JSON.stringify(event));
}

function emitDiagnostic(
  logger: OperatorNotificationRuntimeDiagnosticLogger,
  event: OperatorNotificationRuntimeDiagnosticEvent,
) {
  try {
    logger(event);
  } catch {
    // Diagnostics are fail-open and cannot change notification behavior.
  }
}

function isCanonicalActiveFrom(value: string | undefined) {
  if (
    value === undefined ||
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/u.test(value)
  ) {
    return false;
  }
  const timestamp = Date.parse(value);
  return (
    Number.isFinite(timestamp) &&
    new Date(timestamp).toISOString() === value
  );
}

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
  if (!isCanonicalActiveFrom(activeFrom)) {
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

function instrumentRepository(
  repository: OperatorNotificationRepository,
  logger: OperatorNotificationRuntimeDiagnosticLogger,
): OperatorNotificationRepository {
  return {
    async claimBatch(input) {
      emitDiagnostic(logger, {
        diagnostic: "operator_discord_r1",
        reason_code: "OPERATOR_CLAIM_START",
        repository_reached: true,
        claim_rpc_started: true,
      });
      try {
        const claims = await repository.claimBatch(input);
        emitDiagnostic(logger, {
          diagnostic: "operator_discord_r1",
          reason_code: "OPERATOR_CLAIM_OK",
          repository_reached: true,
          claim_rpc_started: true,
          claim_rpc_succeeded: true,
          claimed_row_count: claims.length,
          cutover_confirmed: true,
        });
        return claims;
      } catch (error) {
        emitDiagnostic(logger, {
          diagnostic: "operator_discord_r1",
          reason_code: "OPERATOR_CLAIM_FAILED",
          repository_reached: true,
          claim_rpc_started: true,
          claim_rpc_succeeded: false,
          claim_failure_code:
            error instanceof M2RuntimeError &&
            error.safeCode === "OPERATOR_NOTIFICATION_DATABASE_OPERATION_FAILED"
              ? "DATABASE_OPERATION_FAILED"
              : "UNEXPECTED_CLAIM_FAILURE",
        });
        throw error;
      }
    },
    beginSend: (input) => repository.beginSend(input),
    complete: (input) => repository.complete(input),
    finish: (input) => repository.finish(input),
  };
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
    diagnosticLogger?: OperatorNotificationRuntimeDiagnosticLogger;
  }> = {},
) {
  const environment = dependencies.environment ?? process.env;
  if (!isProductionOperatorNotificationScheduleEnabled(environment)) {
    return { disabled: true as const };
  }
  const diagnosticLogger =
    dependencies.diagnosticLogger ?? defaultDiagnosticLogger;
  const activeFrom =
    environment.DISCORD_OPERATOR_NOTIFICATIONS_ACTIVE_FROM;
  const activeFromPresent = Boolean(activeFrom);
  const activeFromParseValid = isCanonicalActiveFrom(activeFrom);
  const webhookSecretPresent = Boolean(
    environment.DISCORD_OPERATOR_WEBHOOK_URL,
  );
  emitDiagnostic(diagnosticLogger, {
    diagnostic: "operator_discord_r1",
    reason_code: "OPERATOR_RUNTIME_CONFIGURATION",
    active_from_present: activeFromPresent,
    active_from_parse_valid: activeFromParseValid,
    webhook_secret_present: webhookSecretPresent,
  });

  let configured: OperatorNotificationEnvironment;
  try {
    configured = readOperatorNotificationEnvironment(environment);
  } catch (error) {
    emitDiagnostic(diagnosticLogger, {
      diagnostic: "operator_discord_r1",
      reason_code: !activeFromPresent
        ? "OPERATOR_SKIP_ACTIVE_FROM_MISSING"
        : !activeFromParseValid
          ? "OPERATOR_SKIP_ACTIVE_FROM_INVALID"
          : !webhookSecretPresent
            ? "OPERATOR_SKIP_WEBHOOK_MISSING"
            : "OPERATOR_SKIP_CONFIGURATION_INVALID",
      active_from_present: activeFromPresent,
      active_from_parse_valid: activeFromParseValid,
      webhook_secret_present: webhookSecretPresent,
    });
    throw error;
  }

  let repository: OperatorNotificationRepository;
  try {
    repository = (dependencies.createRepository ??
      ((url, secretKey) =>
        new SupabaseOperatorNotificationRepository(url, secretKey)))(
      configured.supabaseUrl,
      configured.supabaseSecretKey,
    );
  } catch (error) {
    emitDiagnostic(diagnosticLogger, {
      diagnostic: "operator_discord_r1",
      reason_code: "OPERATOR_SKIP_REPOSITORY_INITIALIZATION_FAILED",
      repository_reached: false,
    });
    throw error;
  }
  emitDiagnostic(diagnosticLogger, {
    diagnostic: "operator_discord_r1",
    reason_code: "OPERATOR_REPOSITORY_READY",
    repository_reached: true,
  });

  let transport: OperatorDiscordTransport;
  try {
    transport = (dependencies.createTransport ??
      ((webhookUrl) => new DiscordOperatorWebhookClient(webhookUrl)))(
      configured.webhookUrl,
    );
  } catch (error) {
    emitDiagnostic(diagnosticLogger, {
      diagnostic: "operator_discord_r1",
      reason_code: "OPERATOR_SKIP_TRANSPORT_INITIALIZATION_FAILED",
      repository_reached: true,
      webhook_secret_present: true,
    });
    throw error;
  }
  return runOperatorNotificationSchedule({
    repository: instrumentRepository(repository, diagnosticLogger),
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
