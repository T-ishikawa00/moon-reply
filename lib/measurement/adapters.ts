import type { MeasurementEvent, MeasurementEventName } from "./events.ts";

export type MeasurementDispatchResult = Readonly<{
  status: "disabled";
}>;

export interface MeasurementAdapter {
  dispatch<Name extends MeasurementEventName>(
    event: MeasurementEvent<Name>,
  ): MeasurementDispatchResult;
}

class DisabledMeasurementAdapter implements MeasurementAdapter {
  dispatch<Name extends MeasurementEventName>(
    event: MeasurementEvent<Name>,
  ): MeasurementDispatchResult {
    void event;
    return { status: "disabled" };
  }
}

export const disabledMeasurementAdapter: MeasurementAdapter =
  new DisabledMeasurementAdapter();
