import type {
  PurchaseMeasurementJob,
  PurchaseMeasurementTransport,
} from "./purchase-job.ts";

export function buildGa4PurchaseBody(job: PurchaseMeasurementJob) {
  const events: Array<Readonly<{ name: string; params: Record<string, unknown> }>> = [];
  if (job.utmSource && job.utmMedium) {
    events.push({
      name: "campaign_details",
      params: {
        source: job.utmSource,
        medium: job.utmMedium,
        campaign: job.utmCampaign ?? undefined,
        content: job.utmContent ?? undefined,
        session_id: job.sessionId,
        engagement_time_msec: 1,
      },
    });
  }
  events.push({
    name: "purchase",
    params: {
      transaction_id: job.transactionId,
      value: 980,
      currency: "JPY",
      session_id: job.sessionId,
      engagement_time_msec: 1,
    },
  });
  return { client_id: job.clientId, events } as const;
}

export class Ga4MeasurementProtocolTransport
  implements PurchaseMeasurementTransport
{
  private readonly measurementId: string;
  private readonly apiSecret: string;
  private readonly fetchImplementation: typeof fetch;

  constructor(
    measurementId: string,
    apiSecret: string,
    fetchImplementation: typeof fetch = fetch,
  ) {
    this.measurementId = measurementId;
    this.apiSecret = apiSecret;
    this.fetchImplementation = fetchImplementation;
  }

  async send(job: PurchaseMeasurementJob) {
    const endpoint = new URL("https://www.google-analytics.com/mp/collect");
    endpoint.searchParams.set("measurement_id", this.measurementId);
    endpoint.searchParams.set("api_secret", this.apiSecret);
    const response = await this.fetchImplementation(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(buildGa4PurchaseBody(job)),
      signal: AbortSignal.timeout(8_000),
    });
    return { status: response.status };
  }
}
