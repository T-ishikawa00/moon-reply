export const MEASUREMENT_ATTRIBUTION_COOKIE_NAME =
  "moon_reply_measurement_attribution_r1";
export const MEASUREMENT_ATTRIBUTION_TTL_SECONDS = 30 * 24 * 60 * 60;

const clientIdPattern = /^[1-9][0-9]{0,9}\.[1-9][0-9]{0,9}$/u;
const campaignValuePattern = /^[A-Za-z0-9._~-]+$/u;
const gclidPattern = /^[A-Za-z0-9_-]+$/u;
const publicLandingPaths = new Set([
  "/",
  "/sample-report",
  "/request",
  "/contact",
  "/legal",
  "/legal/privacy",
  "/legal/terms",
  "/legal/refund",
  "/legal/tokushoho",
  "/legal/unsupported-cases",
  "/legal/ai-disclosure",
]);

export type MeasurementAttributionSnapshot = Readonly<{
  clientId: string;
  sessionId: number;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmContent: string | null;
  gclid: string | null;
  landingPath: string;
  capturedAt: string;
  expiresAt: string;
}>;

const exactKeys = [
  "clientId",
  "sessionId",
  "utmSource",
  "utmMedium",
  "utmCampaign",
  "utmContent",
  "gclid",
  "landingPath",
  "capturedAt",
  "expiresAt",
] as const;

function exactRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }
  const record = value as Record<string, unknown>;
  const actual = Object.keys(record).sort();
  const expected = [...exactKeys].sort();
  return actual.length === expected.length &&
    actual.every((key, index) => key === expected[index])
    ? record
    : null;
}

function validCampaignValue(value: unknown, maximum: number) {
  return (
    value === null ||
    (typeof value === "string" &&
      value.length >= 1 &&
      value.length <= maximum &&
      campaignValuePattern.test(value))
  );
}

export function parseMeasurementAttributionSnapshot(
  value: unknown,
  now = new Date(),
): MeasurementAttributionSnapshot | null {
  const record = exactRecord(value);
  if (
    !record ||
    typeof record.clientId !== "string" ||
    !clientIdPattern.test(record.clientId) ||
    typeof record.sessionId !== "number" ||
    !Number.isSafeInteger(record.sessionId) ||
    record.sessionId <= 0 ||
    !validCampaignValue(record.utmSource, 64) ||
    !validCampaignValue(record.utmMedium, 64) ||
    !validCampaignValue(record.utmCampaign, 100) ||
    !validCampaignValue(record.utmContent, 100) ||
    !(record.gclid === null ||
      (typeof record.gclid === "string" && record.gclid.length <= 200 && gclidPattern.test(record.gclid))) ||
    typeof record.landingPath !== "string" ||
    !publicLandingPaths.has(record.landingPath) ||
    typeof record.capturedAt !== "string" ||
    typeof record.expiresAt !== "string" ||
    !Number.isFinite(Date.parse(record.capturedAt)) ||
    !Number.isFinite(Date.parse(record.expiresAt)) ||
    Date.parse(record.expiresAt) <= now.getTime() ||
    Date.parse(record.capturedAt) > now.getTime() + 60_000
  ) return null;
  return Object.freeze(record as MeasurementAttributionSnapshot);
}

function strictQueryValue(
  searchParams: URLSearchParams,
  name: string,
  maximum: number,
  pattern: RegExp,
) {
  const values = searchParams.getAll(name);
  if (values.length === 0) return null;
  if (values.length !== 1 || values[0].length < 1 || values[0].length > maximum || !pattern.test(values[0])) {
    throw new TypeError("MEASUREMENT_ATTRIBUTION_INVALID");
  }
  return values[0];
}

export function captureMeasurementAttribution(input: {
  url: URL;
  existing: MeasurementAttributionSnapshot | null;
  now: Date;
  clientId: string;
  googleOrganic?: boolean;
}) {
  let utmSource = strictQueryValue(input.url.searchParams, "utm_source", 64, campaignValuePattern);
  let utmMedium = strictQueryValue(input.url.searchParams, "utm_medium", 64, campaignValuePattern);
  const utmCampaign = strictQueryValue(input.url.searchParams, "utm_campaign", 100, campaignValuePattern);
  const utmContent = strictQueryValue(input.url.searchParams, "utm_content", 100, campaignValuePattern);
  const gclid = strictQueryValue(input.url.searchParams, "gclid", 200, gclidPattern);
  const hasExplicitCampaign = [utmSource, utmMedium, utmCampaign, utmContent, gclid].some((value) => value !== null);
  if (!hasExplicitCampaign && input.googleOrganic) {
    utmSource = "google";
    utmMedium = "organic";
  }
  const hasCampaign = hasExplicitCampaign || input.googleOrganic === true;
  if (!hasCampaign && input.existing) return { snapshot: input.existing, changed: false } as const;
  if (!clientIdPattern.test(input.clientId) || !publicLandingPaths.has(input.url.pathname)) {
    throw new TypeError("MEASUREMENT_ATTRIBUTION_INVALID");
  }
  if ((utmSource === null) !== (utmMedium === null)) {
    throw new TypeError("MEASUREMENT_ATTRIBUTION_INVALID");
  }
  if (utmSource === null && (utmCampaign !== null || utmContent !== null)) {
    throw new TypeError("MEASUREMENT_ATTRIBUTION_INVALID");
  }
  if (gclid !== null && ((utmSource !== null && utmSource !== "google") || (utmMedium !== null && utmMedium !== "cpc"))) {
    throw new TypeError("MEASUREMENT_ATTRIBUTION_INVALID");
  }
  const capturedAt = input.now.toISOString();
  const snapshot = parseMeasurementAttributionSnapshot({
    clientId: input.existing?.clientId ?? input.clientId,
    sessionId: Math.max(1, Math.floor(input.now.getTime() / 1000)),
    utmSource: gclid ? "google" : utmSource,
    utmMedium: gclid ? "cpc" : utmMedium,
    utmCampaign,
    utmContent,
    gclid,
    landingPath: input.url.pathname,
    capturedAt,
    expiresAt: new Date(input.now.getTime() + MEASUREMENT_ATTRIBUTION_TTL_SECONDS * 1000).toISOString(),
  }, input.now);
  if (!snapshot) throw new TypeError("MEASUREMENT_ATTRIBUTION_INVALID");
  return { snapshot, changed: true } as const;
}
