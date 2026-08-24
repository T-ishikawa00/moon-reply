import { runConfiguredProductionFulfillmentDispatchSchedule } from "../../lib/payment/production/dispatch-scheduler-runtime-service.ts";

export default async function productionFulfillmentDispatchScheduled() {
  const outcome =
    await runConfiguredProductionFulfillmentDispatchSchedule();
  return new Response(JSON.stringify(outcome), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}
