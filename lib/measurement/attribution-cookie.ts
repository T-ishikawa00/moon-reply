import {
  MEASUREMENT_ATTRIBUTION_COOKIE_NAME,
  MEASUREMENT_ATTRIBUTION_TTL_SECONDS,
  parseMeasurementAttributionSnapshot,
  type MeasurementAttributionSnapshot,
} from "./attribution.ts";

const signatureDomain = "moon-reply:measurement:attribution-cookie:v1:";

function encodeBase64Url(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/gu, "-").replace(/\//gu, "_").replace(/=+$/gu, "");
}

function decodeBase64Url(value: string) {
  if (!/^[A-Za-z0-9_-]+$/u.test(value)) throw new TypeError("MEASUREMENT_COOKIE_INVALID");
  const padded = value.replace(/-/gu, "+").replace(/_/gu, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  return Uint8Array.from(atob(padded), (character) => character.charCodeAt(0));
}

async function signature(payload: string, secret: string) {
  if (new TextEncoder().encode(secret).byteLength < 32) throw new TypeError("MEASUREMENT_COOKIE_SECRET_INVALID");
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signed = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${signatureDomain}${payload}`));
  return encodeBase64Url(new Uint8Array(signed));
}

function constantTimeEqual(left: string, right: string) {
  if (left.length !== right.length) return false;
  let mismatch = 0;
  for (let index = 0; index < left.length; index += 1) mismatch |= left.charCodeAt(index) ^ right.charCodeAt(index);
  return mismatch === 0;
}

export async function sealMeasurementAttributionCookie(snapshot: MeasurementAttributionSnapshot, secret: string) {
  const payload = encodeBase64Url(new TextEncoder().encode(JSON.stringify(snapshot)));
  return `v1.${payload}.${await signature(payload, secret)}`;
}

export async function openMeasurementAttributionCookie(value: string | null | undefined, secret: string, now = new Date()) {
  try {
    if (!value || value.length > 2_048) return null;
    const parts = value.split(".");
    if (parts.length !== 3 || parts[0] !== "v1") return null;
    if (!constantTimeEqual(parts[2], await signature(parts[1], secret))) return null;
    return parseMeasurementAttributionSnapshot(JSON.parse(new TextDecoder().decode(decodeBase64Url(parts[1]))), now);
  } catch { return null; }
}

export function readMeasurementAttributionCookiePayload(value: string | null | undefined, now = new Date()) {
  try {
    if (!value || value.length > 2_048) return null;
    const parts = value.split(".");
    if (parts.length !== 3 || parts[0] !== "v1") return null;
    return parseMeasurementAttributionSnapshot(JSON.parse(new TextDecoder().decode(decodeBase64Url(parts[1]))), now);
  } catch { return null; }
}

export const measurementAttributionCookieOptions = Object.freeze({
  name: MEASUREMENT_ATTRIBUTION_COOKIE_NAME,
  httpOnly: false,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: MEASUREMENT_ATTRIBUTION_TTL_SECONDS,
});
