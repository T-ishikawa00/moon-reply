import assert from "node:assert/strict";
import { createHash, randomBytes } from "node:crypto";
import { createServer } from "node:http";

import { createServerClient, serializeCookieHeader } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

const url = process.env.LOCAL_SUPABASE_URL;
const publishableKey = process.env.LOCAL_SUPABASE_PUBLISHABLE_KEY;
const email = process.env.LOCAL_CUSTOMER_AUTH_EMAIL;
const otp = process.env.LOCAL_CUSTOMER_AUTH_OTP;
const password = process.env.LOCAL_CUSTOMER_AUTH_PASSWORD;
const secretKey = process.env.LOCAL_SUPABASE_SECRET_KEY;
const sessionRefreshDelayMs = Number(
  process.env.LOCAL_SESSION_REFRESH_DELAY_MS ?? "0",
);

assert.ok(url?.startsWith("http://127.0.0.1:"));
assert.ok(publishableKey?.startsWith("sb_publishable_"));
assert.match(email ?? "", /^[a-z0-9-]+@example\.test$/u);
assert.notEqual(Boolean(otp), Boolean(password));
if (otp) assert.match(otp, /^\d{6}$/u);
if (password) assert.ok(password.length >= 16);
assert.ok(
  Number.isSafeInteger(sessionRefreshDelayMs) &&
    sessionRefreshDelayMs >= 0 &&
    sessionRefreshDelayMs <= 70_000,
);

const jar = new Map();
const localCookiePolicy = Object.freeze({
  httpOnly: true,
  secure: false,
  sameSite: "lax",
  path: "/",
});

function seedPurchaseContinuationCookies() {
  for (const name of [
    "moon_reply_auth_continuation",
    "moon_reply_auth_session_csrf",
  ]) {
    if (!jar.has(name)) {
      jar.set(name, {
        value: randomBytes(32).toString("base64url"),
        options: { ...localCookiePolicy, domain: undefined },
      });
    }
  }
  console.log("LOCAL_CUSTOMER_AUTH_PURCHASE_COOKIE_FIXTURE=PASS");
}

let sessionRefreshDelayComplete = false;
async function waitForSyntheticSessionExpiry() {
  if (sessionRefreshDelayMs === 0 || sessionRefreshDelayComplete) return;
  await new Promise((resolve) => setTimeout(resolve, sessionRefreshDelayMs));
  sessionRefreshDelayComplete = true;
  console.log("LOCAL_CUSTOMER_AUTH_REFRESH_DELAY_COMPLETE=PASS");
}

function createClient() {
  return createServerClient(url, publishableKey, {
    auth: {
      flowType: "pkce",
      detectSessionInUrl: false,
    },
    cookieOptions: localCookiePolicy,
    cookies: {
      getAll() {
        return [...jar].map(([name, entry]) => ({
          name,
          value: entry.value,
        }));
      },
      setAll(cookiesToSet) {
        for (const { name, value, options } of cookiesToSet) {
          jar.set(name, {
            value,
            options: {
              ...options,
              ...localCookiePolicy,
              domain: undefined,
            },
          });
        }
      },
    },
  });
}

const verifier = createClient();
const { data: verified, error: verifyError } = otp
  ? await verifier.auth.verifyOtp({ email, token: otp, type: "email" })
  : await verifier.auth.signInWithPassword({ email, password });
assert.equal(verifyError, null);
assert.ok(verified.user?.id);
assert.ok(verified.user.email_confirmed_at);
assert.ok(jar.size > 0);

for (const { value, options } of jar.values()) {
  assert.ok(value.length > 0);
  assert.equal(options.httpOnly, true);
  assert.equal(options.secure, false);
  assert.equal(options.sameSite, "lax");
  assert.equal(options.path, "/");
  assert.equal(options.domain, undefined);
}

const requestScopedRoundTrip = createClient();
const { data: fresh, error: getUserError } =
  await requestScopedRoundTrip.auth.getUser();
assert.equal(getUserError, null);
assert.equal(fresh.user?.id, verified.user.id);
assert.equal(fresh.user?.email, email);
assert.ok(fresh.user?.email_confirmed_at);
assert.ok(
  fresh.user?.identities?.some(
    (identity) => identity.provider === "email" && identity.user_id === fresh.user.id,
  ),
);

const identityFingerprint = createHash("sha256")
  .update(fresh.user.id, "utf8")
  .digest("hex");

console.log(
  otp
    ? "LOCAL_CUSTOMER_AUTH_EMAIL_OTP=PASS"
    : "LOCAL_CUSTOMER_AUTH_PASSWORD_SESSION_FIXTURE=PASS",
);
console.log(`LOCAL_CUSTOMER_AUTH_COOKIE_COUNT=${jar.size}`);
console.log("LOCAL_CUSTOMER_AUTH_COOKIE_HTTPONLY_LAX_HOST_ONLY=PASS");
console.log("LOCAL_CUSTOMER_AUTH_REQUEST_SCOPED_GETUSER=PASS");
console.log(`LOCAL_CUSTOMER_AUTH_IDENTITY_FINGERPRINT=${identityFingerprint}`);

if (secretKey) {
  assert.ok(secretKey.startsWith("sb_secret_"));
  const repository = createSupabaseClient(url, secretKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
  const { data, error } = await repository.rpc(
    "resolve_customer_account_history_v1",
    { p_customer_user_id: fresh.user.id },
  );
  assert.equal(error, null);
  assert.deepEqual(data, []);
  console.log("LOCAL_CUSTOMER_AUTH_SECRET_REPOSITORY_RPC=PASS");
}

const appSessionProbeUrl = process.env.LOCAL_APP_SESSION_PROBE_URL;
if (appSessionProbeUrl) {
  assert.match(
    appSessionProbeUrl,
    /^http:\/\/127\.0\.0\.1:\d{4,5}\/(?:account|purchase\/auth\/continue)$/u,
  );
  if (new URL(appSessionProbeUrl).pathname === "/purchase/auth/continue") {
    seedPurchaseContinuationCookies();
  }
  await waitForSyntheticSessionExpiry();
  const requestCookie = [...jar]
    .map(([name, entry]) =>
      serializeCookieHeader(name, entry.value, {
        ...entry.options,
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        path: "/",
        domain: undefined,
      }).split(";", 1)[0],
    )
    .join("; ");
  const response = await fetch(appSessionProbeUrl, {
    headers: { Cookie: requestCookie },
    redirect: "manual",
  });
  const page = await response.text();
  const responseCookies = response.headers.getSetCookie().map((value) => ({
    name: value.split("=", 1)[0],
    removed: /max-age=0/iu.test(value),
  }));
  console.log(
    `LOCAL_CUSTOMER_AUTH_APP_SET_COOKIE_METADATA=${JSON.stringify(responseCookies)}`,
  );
  assert.equal(response.status, 200);
  if (new URL(appSessionProbeUrl).pathname === "/account") {
    assert.equal(
      page.includes("表示できる鑑定ノートはまだありません"),
      true,
      "LOCAL_CUSTOMER_AUTH_APP_SESSION_NOT_RECOGNIZED",
    );
    assert.equal(page.includes("ログインが必要です"), false);
  } else {
    assert.equal(
      page.includes("お申し込み前の最終確認"),
      true,
      "LOCAL_CUSTOMER_AUTH_PURCHASE_CONTINUATION_NOT_RECOGNIZED",
    );
  }
  assert.match(response.headers.get("cache-control") ?? "", /no-store/u);
  if (sessionRefreshDelayMs > 0) {
    assert.equal(
      responseCookies.some(({ removed }) => !removed),
      true,
      "LOCAL_CUSTOMER_AUTH_PROXY_REFRESH_COOKIE_MISSING",
    );
    console.log("LOCAL_CUSTOMER_AUTH_PROXY_REFRESH_SET_COOKIE=PASS");
  }
  console.log("LOCAL_CUSTOMER_AUTH_APP_SESSION_PROBE=PASS");
}

const bootstrapPort = process.env.LOCAL_COOKIE_BOOTSTRAP_PORT;
const redirectUrl = process.env.LOCAL_COOKIE_BOOTSTRAP_REDIRECT_URL;
if (bootstrapPort || redirectUrl) {
  assert.match(bootstrapPort ?? "", /^\d{4,5}$/u);
  assert.match(
    redirectUrl ?? "",
    /^http:\/\/127\.0\.0\.1:\d{4,5}\/(?:account|purchase\/auth\/continue)$/u,
  );
  if (new URL(redirectUrl).pathname === "/purchase/auth/continue") {
    seedPurchaseContinuationCookies();
  }
  await waitForSyntheticSessionExpiry();
  const cookieHeaders = [...jar].map(([name, entry]) =>
    serializeCookieHeader(name, entry.value, {
      ...entry.options,
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      path: "/",
      domain: undefined,
    }),
  );
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      server.close();
      reject(new Error("LOCAL_COOKIE_BOOTSTRAP_TIMEOUT"));
    }, 60_000);
    const server = createServer((request, response) => {
      if (request.url !== "/bootstrap" || request.method !== "GET") {
        response.writeHead(404, { "Cache-Control": "no-store" });
        response.end();
        return;
      }
      response.writeHead(303, {
        "Cache-Control": "private, no-store",
        Location: redirectUrl,
        "Set-Cookie": cookieHeaders,
      });
      response.end();
      clearTimeout(timeout);
      server.close(resolve);
    });
    server.on("error", reject);
    server.listen(Number(bootstrapPort), "127.0.0.1", () => {
      console.log(`LOCAL_COOKIE_BOOTSTRAP_READY=http://127.0.0.1:${bootstrapPort}/bootstrap`);
    });
  });
  console.log("LOCAL_COOKIE_BOOTSTRAP_CONSUMED=PASS");
}
