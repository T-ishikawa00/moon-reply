"use client";

import { disabledMeasurementAdapter } from "./adapters.ts";
import {
  createMeasurementEvent,
  type MeasurementEventName,
  type MeasurementPayloadByName,
} from "./events.ts";

export type ClientMeasurementEventName = Exclude<
  MeasurementEventName,
  "auth_complete" | "purchase"
>;

export function trackClientMeasurement<
  Name extends ClientMeasurementEventName,
>(name: Name, payload: MeasurementPayloadByName[Name]) {
  try {
    const event = createMeasurementEvent(name, payload);
    return disabledMeasurementAdapter.dispatch(event);
  } catch {
    return { status: "disabled" } as const;
  }
}
