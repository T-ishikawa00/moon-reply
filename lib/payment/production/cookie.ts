import { TRUSTED_EMAIL_COOKIE } from "./constants.ts";

export function readCookieValue(cookieHeader: string | null, name: string) {
  if (!cookieHeader) return null;
  for (const part of cookieHeader.split(";")) {
    const separator = part.indexOf("=");
    if (separator < 1) continue;
    const key = part.slice(0, separator).trim();
    if (key !== name) continue;
    try {
      return decodeURIComponent(part.slice(separator + 1).trim());
    } catch {
      return null;
    }
  }
  return null;
}

export function readTrustedEmailCookie(cookieHeader: string | null) {
  return readCookieValue(cookieHeader, TRUSTED_EMAIL_COOKIE);
}

export function serializeTrustedEmailCookie(input: {
  token: string;
  expiresAt: string;
}) {
  const maximumAge = Math.max(
    0,
    Math.floor((Date.parse(input.expiresAt) - Date.now()) / 1000),
  );
  const attributes = [
    `${TRUSTED_EMAIL_COOKIE}=${encodeURIComponent(input.token)}`,
    "Path=/",
    "HttpOnly",
    "Secure",
    "SameSite=Lax",
    `Max-Age=${maximumAge}`,
  ];
  return attributes.join("; ");
}
