import { randomUUID } from "node:crypto";
import { readProductionSchedulerDatabaseEnvironment } from "../payment/production/environment-runtime.ts";
import { readMeasurementR1Config } from "./config.ts";
import { Ga4MeasurementProtocolTransport } from "./ga4.ts";
import { runPurchaseMeasurementSchedule } from "./purchase-job.ts";
import { SupabasePurchaseMeasurementJobRepository } from "./purchase-job-repository.ts";

export function isPurchaseMeasurementScheduleEnabled() {
  return readMeasurementR1Config(process.env) !== null;
}

export async function runConfiguredPurchaseMeasurementSchedule() {
  const config = readMeasurementR1Config(process.env);
  if (!config) return { disabled: true as const };
  const database = readProductionSchedulerDatabaseEnvironment();
  return runPurchaseMeasurementSchedule({
    repository: new SupabasePurchaseMeasurementJobRepository(
      database.supabaseUrl,
      database.supabaseSecretKey,
    ),
    transport: new Ga4MeasurementProtocolTransport(
      config.measurementId,
      config.apiSecret,
    ),
    environment: config.sourceEnvironment,
    ownerId: randomUUID(),
    now: () => new Date(),
  });
}
