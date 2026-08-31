import {
  MEASUREMENT_PURCHASE_CURRENCY,
  MEASUREMENT_PURCHASE_VALUE,
  type MeasurementEvent,
  type MeasurementEventName,
} from "./events.ts";

export type MeasurementDispatchResult = Readonly<{
  status: "disabled" | "sent";
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

type Gtag = (...args: unknown[]) => void;
const ga4EventNames = Object.freeze({
  landing_view: "landing_view",
  sample_view: "sample_view",
  request_start: "request_start",
  request_complete: "request_complete",
  checkout_start: "begin_checkout",
} as const);

export class Ga4ClientMeasurementAdapter implements MeasurementAdapter {
  private readonly gtag: Gtag;
  private readonly sessionId: number;

  constructor(gtag: Gtag, sessionId: number) {
    if (!Number.isSafeInteger(sessionId) || sessionId <= 0) {
      throw new TypeError("MEASUREMENT_SESSION_ID_INVALID");
    }
    this.gtag = gtag;
    this.sessionId = sessionId;
  }

  dispatch<Name extends MeasurementEventName>(event: MeasurementEvent<Name>): MeasurementDispatchResult {
    if (!(event.name in ga4EventNames)) return { status: "disabled" };
    const eventName = ga4EventNames[event.name as keyof typeof ga4EventNames];
    const payload = event.payload as Record<string, unknown>;
    const params: Record<string, unknown> = {
      session_id: this.sessionId,
      engagement_time_msec: 1,
    };
    if (event.name === "landing_view") {
      params.landing_path = payload.landingPath;
      params.source = payload.utmSource;
      params.medium = payload.utmMedium;
      params.campaign = payload.utmCampaign;
      params.content = payload.utmContent;
      params.gclid = payload.gclid;
    } else if (event.name === "checkout_start") {
      params.value = MEASUREMENT_PURCHASE_VALUE;
      params.currency = MEASUREMENT_PURCHASE_CURRENCY;
    }
    this.gtag("event", eventName, params);
    return { status: "sent" };
  }
}
