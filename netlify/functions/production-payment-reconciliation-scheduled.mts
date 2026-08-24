import { runConfiguredProductionPaymentReconciliationSchedule } from "../../lib/payment/production/reconciliation-scheduler-runtime-service.ts";

export default async function productionPaymentReconciliationScheduled() {
  const outcome =
    await runConfiguredProductionPaymentReconciliationSchedule();
  return new Response(JSON.stringify(outcome), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}
