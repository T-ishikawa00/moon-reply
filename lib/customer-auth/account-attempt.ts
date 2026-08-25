import "server-only";

import type { NextRequest, NextResponse } from "next/server";

import { CUSTOMER_AUTH_COOKIE_POLICY } from "../supabase/cookie-policy";
import { createCustomerAuthSecret, validateCustomerAuthSecret } from "./crypto";

export const ACCOUNT_LOGIN_ATTEMPT_COOKIE = "moon_reply_account_login_attempt";
export const ACCOUNT_LOGIN_ATTEMPT_TTL_SECONDS = 600;

export type AccountLoginAttempt = Readonly<{
  secret: string;
  issuedAtMs: number;
}>;

function cookieOptions(maxAge: number) {
  return {
    ...CUSTOMER_AUTH_COOKIE_POLICY,
    path: "/api/auth/account",
    maxAge,
  };
}

export function createAccountLoginAttempt(now: () => number = Date.now) {
  return { secret: createCustomerAuthSecret(), issuedAtMs: now() };
}

export function readAccountLoginAttempt(
  request: NextRequest,
  now: () => number = Date.now,
): AccountLoginAttempt | null {
  try {
    const raw = request.cookies.get(ACCOUNT_LOGIN_ATTEMPT_COOKIE)?.value;
    if (!raw) return null;
    const parts = raw.split(".");
    if (parts.length !== 2 || !/^\d{13}$/u.test(parts[1])) return null;
    const secret = validateCustomerAuthSecret(parts[0]);
    const issuedAtMs = Number(parts[1]);
    const ageMs = now() - issuedAtMs;
    if (
      !Number.isSafeInteger(issuedAtMs) ||
      ageMs < 0 ||
      ageMs > ACCOUNT_LOGIN_ATTEMPT_TTL_SECONDS * 1_000
    ) {
      return null;
    }
    return { secret, issuedAtMs };
  } catch {
    return null;
  }
}

export function setAccountLoginAttempt(
  response: NextResponse,
  attempt: AccountLoginAttempt,
) {
  response.cookies.set(
    ACCOUNT_LOGIN_ATTEMPT_COOKIE,
    `${attempt.secret}.${attempt.issuedAtMs}`,
    cookieOptions(ACCOUNT_LOGIN_ATTEMPT_TTL_SECONDS),
  );
}

export function clearAccountLoginAttempt(response: NextResponse) {
  response.cookies.set(ACCOUNT_LOGIN_ATTEMPT_COOKIE, "", cookieOptions(0));
}
