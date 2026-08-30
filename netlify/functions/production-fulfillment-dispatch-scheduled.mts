import { runConfiguredProductionFulfillmentDispatchSchedule } from "../../lib/payment/production/dispatch-scheduler-runtime-service.ts";
import {
  isProductionOperatorNotificationScheduleEnabled,
  runConfiguredProductionOperatorNotificationSchedule,
  type OperatorNotificationRuntimeDiagnosticEvent,
  type OperatorNotificationRuntimeDiagnosticLogger,
  type OperatorNotificationSafeDeployContext,
} from "../../lib/payment/production/operator-notification-runtime-service.ts";

function boundedOutcome<T>(outcome: PromiseSettledResult<T>) {
  return outcome.status === "fulfilled"
    ? outcome.value
    : { failed: true as const };
}

type NetlifyOperatorNotificationRuntimeContext = Readonly<{
  deploy?: Readonly<{
    context?: string;
    published?: boolean;
  }>;
}>;

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
    // Operator diagnostics must never affect either scheduled lane.
  }
}

function safeDeployContext(
  value: unknown,
): OperatorNotificationSafeDeployContext {
  if (
    value === "production" ||
    value === "deploy-preview" ||
    value === "branch-deploy" ||
    value === "preview-server" ||
    value === "dev-server" ||
    value === "dev"
  ) {
    return value;
  }
  return typeof value === "string" ? "other" : "unavailable";
}

function evaluateProductionDeployGuard(
  context: NetlifyOperatorNotificationRuntimeContext | undefined,
): OperatorNotificationRuntimeDiagnosticEvent &
  Readonly<{ production_guard_pass: boolean }> {
  const deployPresent = context?.deploy !== undefined;
  const deployContext = safeDeployContext(context?.deploy?.context);
  const published = context?.deploy?.published === true;
  if (!deployPresent || deployContext === "unavailable") {
    return {
      diagnostic: "operator_discord_r1",
      reason_code: "OPERATOR_SKIP_CONTEXT_UNAVAILABLE",
      deploy_present: deployPresent,
      deploy_context: deployContext,
      published,
      production_guard_pass: false,
    };
  }
  if (deployContext !== "production") {
    return {
      diagnostic: "operator_discord_r1",
      reason_code: "OPERATOR_SKIP_NON_PRODUCTION",
      deploy_present: deployPresent,
      deploy_context: deployContext,
      published,
      production_guard_pass: false,
    };
  }
  return {
    diagnostic: "operator_discord_r1",
    reason_code: "OPERATOR_ENTER_RUNTIME",
    deploy_present: deployPresent,
    deploy_context: deployContext,
    published,
    production_guard_pass: true,
  };
}

type ScheduledFunctionDependencies = Readonly<{
  isOperatorNotificationScheduleEnabled?: () => boolean;
  runDispatchSchedule?: () => Promise<unknown>;
  runOperatorNotificationSchedule?: () => Promise<unknown>;
  diagnosticLogger?: OperatorNotificationRuntimeDiagnosticLogger;
}>;

export function isPublishedProductionOperatorNotificationDeploy(
  context: NetlifyOperatorNotificationRuntimeContext | undefined,
) {
  return evaluateProductionDeployGuard(context).production_guard_pass;
}

export async function runProductionFulfillmentDispatchScheduled(
  context: NetlifyOperatorNotificationRuntimeContext | undefined,
  dependencies: ScheduledFunctionDependencies = {},
) {
  const diagnosticLogger =
    dependencies.diagnosticLogger ?? defaultDiagnosticLogger;
  const deployGuard = evaluateProductionDeployGuard(context);
  const dispatchEnabled =
    process.env.PAYMENT_FULFILLMENT_DISPATCH_SCHEDULED_ENABLED === "true";
  let operatorNotificationsEnabled = false;
  if (!deployGuard.production_guard_pass) {
    emitDiagnostic(diagnosticLogger, deployGuard);
  } else {
    const enabledExactTrue =
      process.env.DISCORD_OPERATOR_NOTIFICATIONS_ENABLED === "true";
    const emergencyStopExactTrue =
      process.env.DISCORD_OPERATOR_NOTIFICATIONS_EMERGENCY_STOP === "true";
    operatorNotificationsEnabled =
      (dependencies.isOperatorNotificationScheduleEnabled ??
        isProductionOperatorNotificationScheduleEnabled)();
    emitDiagnostic(diagnosticLogger, {
      ...deployGuard,
      reason_code: operatorNotificationsEnabled
        ? "OPERATOR_ENTER_RUNTIME"
        : emergencyStopExactTrue
          ? "OPERATOR_SKIP_EMERGENCY_STOP"
          : "OPERATOR_SKIP_DISABLED",
      enabled_parse_result: enabledExactTrue,
      emergency_stop_parse_result: emergencyStopExactTrue,
    });
  }
  if (!dispatchEnabled && !operatorNotificationsEnabled) {
    return new Response(JSON.stringify({ disabled: true }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }

  const [dispatch, operatorNotifications] = await Promise.allSettled([
    (dependencies.runDispatchSchedule ??
      runConfiguredProductionFulfillmentDispatchSchedule)(),
    operatorNotificationsEnabled
      ? (dependencies.runOperatorNotificationSchedule ??
        (() => runConfiguredProductionOperatorNotificationSchedule({
          diagnosticLogger,
        })))()
      : Promise.resolve({ disabled: true as const }),
  ]);
  return new Response(JSON.stringify({
    dispatch: boundedOutcome(dispatch),
    operatorNotifications: boundedOutcome(operatorNotifications),
  }), {
    // Preserve the existing fulfillment-dispatch failure signal. Operator
    // notification failure alone is fail-open for the customer path.
    status: dispatch.status === "rejected" ? 500 : 200,
    headers: { "content-type": "application/json" },
  });
}

export default async function productionFulfillmentDispatchScheduled(
  _request?: Request,
  context?: NetlifyOperatorNotificationRuntimeContext,
) {
  return runProductionFulfillmentDispatchScheduled(context);
}
