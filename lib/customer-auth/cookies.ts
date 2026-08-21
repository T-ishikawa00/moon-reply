import "server-only";

import type { NextRequest, NextResponse } from "next/server";

import { CUSTOMER_AUTH_COOKIE_POLICY } from "../supabase/cookie-policy";
import { createCustomerAuthSecret } from "./crypto";

export const AUTH_CONTINUATION_COOKIE = "moon_reply_auth_continuation";
export const AUTH_CALLBACK_CSRF_COOKIE = "moon_reply_auth_callback_csrf";
export const AUTH_SESSION_CSRF_COOKIE = "moon_reply_auth_session_csrf";

function cookieOptions(maxAge?: number) {
  return {
    ...CUSTOMER_AUTH_COOKIE_POLICY,
    ...(maxAge === undefined ? {} : { maxAge }),
  };
}

export function readAuthContinuationCookie(request: NextRequest) {
  return request.cookies.get(AUTH_CONTINUATION_COOKIE)?.value ?? null;
}

export function readAuthCallbackCsrfCookie(request: NextRequest) {
  return request.cookies.get(AUTH_CALLBACK_CSRF_COOKIE)?.value ?? null;
}

export function readAuthSessionCsrfCookie(request: NextRequest) {
  return request.cookies.get(AUTH_SESSION_CSRF_COOKIE)?.value ?? null;
}

export function setAuthContinuationCookies(
  response: NextResponse,
  input: { continuation: string; csrf: string; ttlSeconds: number },
) {
  response.cookies.set(
    AUTH_CONTINUATION_COOKIE,
    input.continuation,
    cookieOptions(input.ttlSeconds),
  );
  response.cookies.set(
    AUTH_CALLBACK_CSRF_COOKIE,
    input.csrf,
    cookieOptions(input.ttlSeconds),
  );
}

export function clearAuthContinuationCookies(response: NextResponse) {
  response.cookies.set(AUTH_CONTINUATION_COOKIE, "", cookieOptions(0));
  response.cookies.set(AUTH_CALLBACK_CSRF_COOKIE, "", cookieOptions(0));
}

export function clearAuthCallbackCsrfCookie(response: NextResponse) {
  response.cookies.set(AUTH_CALLBACK_CSRF_COOKIE, "", cookieOptions(0));
}

export function issueAuthSessionCsrfCookie(response: NextResponse) {
  const csrf = createCustomerAuthSecret();
  response.cookies.set(
    AUTH_SESSION_CSRF_COOKIE,
    csrf,
    cookieOptions(86_400),
  );
  return csrf;
}

export function clearAuthSessionCsrfCookie(response: NextResponse) {
  response.cookies.set(AUTH_SESSION_CSRF_COOKIE, "", cookieOptions(0));
}
