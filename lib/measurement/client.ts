"use client";

import {
  disabledMeasurementAdapter,
  type MeasurementAdapter,
} from "./adapters.ts";
import {
  createMeasurementEvent,
  type MeasurementEvent,
  type MeasurementEventName,
  type MeasurementPayloadByName,
} from "./events.ts";

export type ClientMeasurementEventName = Exclude<
  MeasurementEventName,
  "auth_complete" | "purchase"
>;

let activeMeasurementAdapter: MeasurementAdapter | null = null;
const pendingEvents: MeasurementEvent[] = [];

export function configureClientMeasurementAdapter(adapter: MeasurementAdapter) {
  activeMeasurementAdapter = adapter;
  const ordered = [...pendingEvents].sort((left, right) =>
    left.name === "landing_view" ? -1 : right.name === "landing_view" ? 1 : 0,
  );
  pendingEvents.length = 0;
  for (const event of ordered) adapter.dispatch(event);
}

export function trackClientMeasurement<
  Name extends ClientMeasurementEventName,
>(name: Name, payload: MeasurementPayloadByName[Name]) {
  try {
    const event = createMeasurementEvent(name, payload);
    if (!activeMeasurementAdapter) {
      if (pendingEvents.length < 16) pendingEvents.push(event as MeasurementEvent);
      return disabledMeasurementAdapter.dispatch(event);
    }
    return activeMeasurementAdapter.dispatch(event);
  } catch {
    return { status: "disabled" } as const;
  }
}
