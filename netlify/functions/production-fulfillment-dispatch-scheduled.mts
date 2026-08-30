import { runConfiguredProductionFulfillmentDispatchSchedule } from "../../lib/payment/production/dispatch-scheduler-runtime-service.ts";
import {
  isProductionOperatorNotificationScheduleEnabled,
  runConfiguredProductionOperatorNotificationSchedule,
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

type ScheduledFunctionDependencies = Readonly<{
  isOperatorNotificationScheduleEnabled?: () => boolean;
  runDispatchSchedule?: () => Promise<unknown>;
  runOperatorNotificationSchedule?: () => Promise<unknown>;
}>;

export function isPublishedProductionOperatorNotificationDeploy(
  context: NetlifyOperatorNotificationRuntimeContext | undefined,
) {
  return (
    context?.deploy?.context === "production" &&
    context.deploy.published === true
  );
}

export async function runProductionFulfillmentDispatchScheduled(
  context: NetlifyOperatorNotificationRuntimeContext | undefined,
  dependencies: ScheduledFunctionDependencies = {},
) {
  const dispatchEnabled =
    process.env.PAYMENT_FULFILLMENT_DISPATCH_SCHEDULED_ENABLED === "true";
  const operatorNotificationsEnabled =
    isPublishedProductionOperatorNotificationDeploy(context) &&
    (dependencies.isOperatorNotificationScheduleEnabled ??
      isProductionOperatorNotificationScheduleEnabled)();
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
        runConfiguredProductionOperatorNotificationSchedule)()
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
