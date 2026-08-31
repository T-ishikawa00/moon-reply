export type MeasurementDestinationEnvironment = "production" | "test";
export type MeasurementR1Config = Readonly<{
  measurementId: string;
  apiSecret: string;
  destinationEnvironment: MeasurementDestinationEnvironment;
  sourceEnvironment: "live" | "test";
  attributionSecret: string;
  siteOrigin: string;
}>;

export function readMeasurementR1Config(environment: Readonly<Record<string, string | undefined>>): MeasurementR1Config | null {
  if (environment.MEASUREMENT_ENABLED !== "true") return null;
  const destinationEnvironment = environment.MEASUREMENT_DESTINATION_ENV;
  const sourceEnvironment = environment.PAYMENT_PROVIDER_ENVIRONMENT;
  const measurementId = environment.GA4_MEASUREMENT_ID;
  const apiSecret = environment.GA4_API_SECRET;
  const attributionSecret = environment.MEASUREMENT_TRANSACTION_SECRET;
  const siteOrigin = environment.NEXT_PUBLIC_APP_URL;
  if (
    (destinationEnvironment !== "production" && destinationEnvironment !== "test") ||
    (sourceEnvironment !== "live" && sourceEnvironment !== "test") ||
    (destinationEnvironment === "production" && sourceEnvironment !== "live") ||
    (destinationEnvironment === "test" && sourceEnvironment !== "test") ||
    !measurementId || !/^G-[A-Z0-9]{6,20}$/u.test(measurementId) ||
    !apiSecret || !/^[A-Za-z0-9_-]{16,100}$/u.test(apiSecret) ||
    !attributionSecret || new TextEncoder().encode(attributionSecret).byteLength < 32 ||
    !siteOrigin
  ) return null;
  let normalizedOrigin: string;
  try {
    const parsed = new URL(siteOrigin);
    if (
      parsed.origin !== siteOrigin ||
      !["http:", "https:"].includes(parsed.protocol) ||
      (destinationEnvironment === "production" && parsed.protocol !== "https:")
    ) return null;
    normalizedOrigin = parsed.origin;
  } catch { return null; }
  return { measurementId, apiSecret, destinationEnvironment, sourceEnvironment, attributionSecret, siteOrigin: normalizedOrigin };
}

export function readClientMeasurementConfig(environment: Readonly<Record<string, string | undefined>>) {
  const config = readMeasurementR1Config(environment);
  return config ? { measurementId: config.measurementId, destinationEnvironment: config.destinationEnvironment, siteOrigin: config.siteOrigin } : null;
}
