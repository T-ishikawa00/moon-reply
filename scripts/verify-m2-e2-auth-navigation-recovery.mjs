import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, statSync } from "node:fs";
import { registerHooks } from "node:module";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";

const root = process.cwd();
const canonicalOrigin = "https://customer.example";
const internalOrigin = "https://moon-reply-internal.netlify.app";
const acceptedAuthority = "b0bf81038a42178f032e0edb0572463e415dc086";
const expectedMain = "61e33a10e195fad17e253a6b9719217e1992f273";
const routeState = {
  googleStarts: 0,
  googleCallbacks: 0,
  emailRequests: 0,
  emailVerifications: 0,
  logouts: [],
  sessionState: "signed_in",
};

globalThis.e2RouteState = routeState;

const mockAccountServiceUrl = `data:text/javascript,${encodeURIComponent(`
export async function createCustomerAccountAuthApplication() {
  return {
    async startGoogle() {
      globalThis.e2RouteState.googleStarts += 1;
      return { authorizationUrl: "https://local-supabase.invalid/auth/v1/authorize?provider=google" };
    },
    async completeGoogleCallback() {
      globalThis.e2RouteState.googleCallbacks += 1;
      return { customerUserId: "not-emitted", verifiedEmail: "not-emitted@example.invalid" };
    },
    async requestEmailOtp() {
      globalThis.e2RouteState.emailRequests += 1;
    },
    async verifyEmailOtp() {
      globalThis.e2RouteState.emailVerifications += 1;
      return { customerUserId: "not-emitted", verifiedEmail: "not-emitted@example.invalid" };
    },
    async getFreshSessionState() {
      return globalThis.e2RouteState.sessionState;
    },
    async logout(scope) {
      globalThis.e2RouteState.logouts.push(scope);
    },
  };
}
`)}`;

function resolveLocalModule(specifier, parentURL) {
  const relative = specifier.startsWith("@/")
    ? specifier.slice(2)
    : specifier.startsWith("./") || specifier.startsWith("../")
      ? path.resolve(path.dirname(fileURLToPath(parentURL)), specifier)
      : null;
  if (relative === null) return null;
  const base = path.isAbsolute(relative) ? relative : path.join(root, relative);
  for (const candidate of [base, `${base}.ts`, `${base}.tsx`]) {
    if (existsSync(candidate) && statSync(candidate).isFile()) {
      return pathToFileURL(candidate).href;
    }
  }
  return null;
}

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === "server-only") {
      return { url: "data:text/javascript,export%20{}", shortCircuit: true };
    }
    if (specifier === "next/server") {
      return {
        url: pathToFileURL(path.join(root, "node_modules/next/server.js")).href,
        shortCircuit: true,
      };
    }
    if (specifier === "next/headers") {
      return {
        url: pathToFileURL(path.join(root, "node_modules/next/headers.js")).href,
        shortCircuit: true,
      };
    }
    if (specifier === "@/lib/customer-auth/account-service") {
      return { url: mockAccountServiceUrl, shortCircuit: true };
    }
    const local = context.parentURL ? resolveLocalModule(specifier, context.parentURL) : null;
    if (local) return { url: local, shortCircuit: true };
    return nextResolve(specifier, context);
  },
  load(url, context, nextLoad) {
    if (url.startsWith("file:") && (url.endsWith(".ts") || url.endsWith(".tsx"))) {
      const source = readFileSync(fileURLToPath(url), "utf8");
      const transpiled = ts.transpileModule(source, {
        compilerOptions: {
          jsx: ts.JsxEmit.ReactJSX,
          module: ts.ModuleKind.ESNext,
          target: ts.ScriptTarget.ES2022,
          moduleResolution: ts.ModuleResolutionKind.Bundler,
          verbatimModuleSyntax: true,
        },
        fileName: fileURLToPath(url),
      });
      return { format: "module", source: transpiled.outputText, shortCircuit: true };
    }
    return nextLoad(url, context);
  },
});

process.env.NODE_ENV = "production";
process.env.NEXT_PUBLIC_APP_URL = canonicalOrigin;
process.env.CUSTOMER_AUTH_ENABLED = "true";
process.env.CUSTOMER_AUTH_GOOGLE_ENABLED = "true";
process.env.CUSTOMER_AUTH_EMAIL_OTP_ENABLED = "true";
process.env.CUSTOMER_AUTH_EMERGENCY_STOP = "false";
process.env.CUSTOMER_AUTH_RATE_LIMIT_MODE = "in_memory_seam";
process.env.CUSTOMER_AUTH_RATE_LIMIT_MAX_REQUESTS = "1000";
process.env.CUSTOMER_AUTH_RATE_LIMIT_WINDOW_SECONDS = "60";
process.env.MEASUREMENT_ENABLED = "false";

const { NextRequest, NextResponse } = await import("next/server");
const attemptModule = await import(
  pathToFileURL(path.join(root, "lib/customer-auth/account-attempt.ts")).href
);
const authProvider = await import(
  pathToFileURL(path.join(root, "lib/customer-auth/supabase-provider.ts")).href
);
const { POST: googleStart } = await import(
  pathToFileURL(path.join(root, "app/api/auth/account/google/start/route.ts")).href
);
const { GET: googleCallback } = await import(
  pathToFileURL(path.join(root, "app/api/auth/account/callback/route.ts")).href
);
const { POST: emailRequest } = await import(
  pathToFileURL(path.join(root, "app/api/auth/account/email-otp/request/route.ts")).href
);
const { POST: emailVerify } = await import(
  pathToFileURL(path.join(root, "app/api/auth/account/email-otp/verify/route.ts")).href
);
const { GET: sessionProbe } = await import(
  pathToFileURL(path.join(root, "app/api/account/session/route.ts")).href
);
const { POST: logout } = await import(
  pathToFileURL(path.join(root, "app/api/auth/logout/route.ts")).href
);

let passed = 0;
function text(relativePath) {
  return readFileSync(path.join(root, relativePath), "utf8");
}
function git(args) {
  return execFileSync(
    "git.exe",
    ["-c", "safe.directory=C:/projects/moon-reply", ...args],
    { cwd: root, encoding: "utf8", maxBuffer: 256 * 1024 * 1024 },
  ).trim();
}
function check(name, run) {
  run();
  passed += 1;
  console.log(`[PASS] ${name}`);
}
async function checkAsync(name, run) {
  await run();
  passed += 1;
  console.log(`[PASS] ${name}`);
}

function postRequest(pathname, body, cookie = "") {
  return new NextRequest(`${internalOrigin}${pathname}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: canonicalOrigin,
      "sec-fetch-site": "same-origin",
      ...(cookie ? { cookie } : {}),
    },
    body: JSON.stringify(body),
  });
}

function rawAttemptCookie(nowMs = 1_800_000_000_000) {
  const attempt = attemptModule.createAccountLoginAttempt(() => nowMs);
  return {
    attempt,
    cookie: `${attemptModule.ACCOUNT_LOGIN_ATTEMPT_COOKIE}=${attempt.secret}.${attempt.issuedAtMs}`,
  };
}

check("authority and immutable main refs are exact", () => {
  assert.equal(git(["rev-parse", "release/private-ready"]), acceptedAuthority);
  assert.equal(git(["rev-parse", "main"]), expectedMain);
});

check("standalone Login exists with exact customer title and robots policy", () => {
  const source = text("app/login/page.tsx");
  assert.match(source, /<h1>月の返事にログイン<\/h1>/u);
  assert.match(source, /過去の鑑定ノートを確認できます。/u);
  assert.match(source, /robots: \{ index: false, follow: false, noarchive: true \}/u);
  assert.match(source, /referrer: "no-referrer"/u);
  assert.doesNotMatch(source, /980|Checkout|購入してから|相談内容/u);
});

check("global navigation locks signed-out, signed-in, and request actions", () => {
  const shell = text("components/layout/SiteHeader.tsx");
  const session = text("components/layout/CustomerSessionNav.tsx");
  assert.match(session, /href="\/login"[\s\S]*?ログイン/u);
  assert.match(session, /href="\/account"[\s\S]*?私の鑑定ノート/u);
  assert.match(shell, /href="\/request"[\s\S]*?鑑定ノートを依頼する/u);
  assert.doesNotMatch(`${shell}\n${session}`, /verifiedEmail|customerUserId|avatar|Customer Auth/u);
});

check("Header switches only on a positive fresh signed_in response", () => {
  const source = text("components/layout/CustomerSessionNav.tsx");
  assert.match(source, /fetch\("\/api\/account\/session"/u);
  assert.match(source, /candidate === "signed_in"\) setState\("signed_in"\)/u);
  assert.match(source, /candidate !== "signed_in"\) setState\("signed_out"\)/u);
  assert.match(source, /useState<SessionState>\("signed_out"\)/u);
});

await checkAsync("fresh session probe is PII-free and privately uncacheable", async () => {
  routeState.sessionState = "signed_in";
  const response = await sessionProbe();
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    data: {
      state: "signed_in",
      methods: { google: true, emailOtp: true },
    },
  });
  assert.match(response.headers.get("cache-control") ?? "", /private.*no-store.*no-cache/u);
  assert.equal(response.headers.get("vary"), "Cookie");
  const source = text("app/api/account/session/route.ts");
  assert.doesNotMatch(
    source,
    /customerUserId|verifiedEmail|providerName|accessToken|refreshToken|userMetadata|\bemail\s*:/iu,
  );
});

await checkAsync("session infrastructure failure has an explicit unavailable state", async () => {
  routeState.sessionState = "unavailable";
  const response = await sessionProbe();
  assert.equal((await response.json()).data.state, "unavailable");
  routeState.sessionState = "signed_in";
});

check("session authority is fresh getUser with publishable Auth only", () => {
  const accountService = text("lib/customer-auth/account-service.ts");
  const accountApplication = text("lib/customer-auth/account-application.ts");
  const provider = text("lib/customer-auth/supabase-provider.ts");
  assert.match(accountService, /createCustomerAuthServerClient/u);
  assert.match(accountService, /getSupabaseCustomerAuthEnv/u);
  assert.doesNotMatch(accountService, /getSupabaseAdminEnv|SupabaseCustomerIdentityRepository|SUPABASE_SECRET_KEY/u);
  assert.match(accountApplication, /getFreshSessionState/u);
  assert.match(provider, /async getFreshSessionState\(\)[\s\S]*?this\.client\.auth\.getUser\(\)/u);
});

await checkAsync("Provider selects only code-owned purchase and account callbacks", async () => {
  const redirects = [];
  const provider = new authProvider.SupabaseCustomerAuthProviderV1(
    {
      auth: {
        async signInWithOAuth(input) {
          redirects.push(input.options.redirectTo);
          return {
            data: { url: "https://local-supabase.invalid/auth/v1/authorize?provider=google" },
            error: null,
          };
        },
      },
    },
    canonicalOrigin,
    "https://local-supabase.invalid",
  );
  await provider.startGoogleOAuth();
  await provider.startGoogleOAuth("account");
  assert.deepEqual(redirects, [
    `${canonicalOrigin}/api/auth/callback`,
    `${canonicalOrigin}/api/auth/account/callback`,
  ]);
});

await checkAsync("standalone Google start needs no preparation or continuation", async () => {
  const response = await googleStart(postRequest("/api/auth/account/google/start", {}));
  assert.equal(response.status, 200);
  assert.equal((await response.json()).data.status, "redirect_ready");
  assert.equal(routeState.googleStarts, 1);
  const cookie = response.headers.get("set-cookie") ?? "";
  assert.match(cookie, /moon_reply_account_login_attempt=/u);
  assert.doesNotMatch(cookie, /preparation|purchase|continuation/iu);
});

await checkAsync("Google start enforces exact JSON and same-origin", async () => {
  const malformed = await googleStart(
    postRequest("/api/auth/account/google/start", { next: "https://evil.example" }),
  );
  assert.equal(malformed.status, 400);
  const crossOrigin = new NextRequest(`${internalOrigin}/api/auth/account/google/start`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "https://evil.example",
      "sec-fetch-site": "cross-site",
    },
    body: "{}",
  });
  assert.equal((await googleStart(crossOrigin)).status, 403);
  assert.equal(routeState.googleStarts, 1);
});

check("account login attempt is random, 600 seconds, HttpOnly Secure Lax, and narrow-path", () => {
  const first = attemptModule.createAccountLoginAttempt(() => 1_800_000_000_000);
  const second = attemptModule.createAccountLoginAttempt(() => 1_800_000_000_000);
  assert.match(first.secret, /^[A-Za-z0-9_-]{43}$/u);
  assert.notEqual(first.secret, second.secret);
  assert.equal(attemptModule.ACCOUNT_LOGIN_ATTEMPT_TTL_SECONDS, 600);
  const response = new NextResponse(null);
  attemptModule.setAccountLoginAttempt(response, first);
  const cookie = response.headers.get("set-cookie") ?? "";
  assert.match(cookie, /HttpOnly/iu);
  assert.match(cookie, /Secure/iu);
  assert.match(cookie, /SameSite=lax/iu);
  assert.match(cookie, /Path=\/api\/auth\/account/iu);
  assert.match(cookie, /Max-Age=600/iu);
  assert.doesNotMatch(cookie, /@|https?:|\?|#/u);
});

check("malformed and expired account attempts are unavailable without authority", () => {
  const { attempt, cookie } = rawAttemptCookie();
  const valid = new NextRequest(`${internalOrigin}/api/auth/account/callback`, {
    headers: { cookie },
  });
  assert.deepEqual(
    attemptModule.readAccountLoginAttempt(valid, () => attempt.issuedAtMs + 600_000),
    attempt,
  );
  assert.equal(
    attemptModule.readAccountLoginAttempt(valid, () => attempt.issuedAtMs + 600_001),
    null,
  );
  const malformed = new NextRequest(`${internalOrigin}/api/auth/account/callback`, {
    headers: { cookie: `${attemptModule.ACCOUNT_LOGIN_ATTEMPT_COOKIE}=malformed` },
  });
  assert.equal(attemptModule.readAccountLoginAttempt(malformed), null);
});

await checkAsync("standalone Google callback succeeds only to fixed /account", async () => {
  const now = Date.now();
  const { cookie } = rawAttemptCookie(now);
  const response = await googleCallback(
    new NextRequest(`${internalOrigin}/api/auth/account/callback?code=provider-code`, {
      headers: { cookie },
    }),
  );
  assert.equal(response.status, 303);
  assert.equal(response.headers.get("location"), `${canonicalOrigin}/account`);
  assert.equal(routeState.googleCallbacks, 1);
  const setCookie = response.headers.get("set-cookie") ?? "";
  assert.match(setCookie, /moon_reply_account_login_attempt=/u);
  assert.match(setCookie, /moon_reply_auth_session_csrf=/u);
});

await checkAsync("missing attempt and forged destination fail to fixed internal Login", async () => {
  const missing = await googleCallback(
    new NextRequest(`${internalOrigin}/api/auth/account/callback?code=provider-code`),
  );
  assert.equal(missing.headers.get("location"), `${canonicalOrigin}/login?status=google_failed`);
  const { cookie } = rawAttemptCookie(Date.now());
  const forged = await googleCallback(
    new NextRequest(
      `${internalOrigin}/api/auth/account/callback?code=provider-code&next=https://evil.example`,
      { headers: { cookie } },
    ),
  );
  assert.equal(forged.headers.get("location"), `${canonicalOrigin}/login?status=google_failed`);
  assert.equal(routeState.googleCallbacks, 1);
});

await checkAsync("standalone Email OTP keeps email and OTP in strict POST bodies only", async () => {
  const requestResponse = await emailRequest(
    postRequest("/api/auth/account/email-otp/request", { email: "user@example.com" }),
  );
  assert.equal(requestResponse.status, 200);
  assert.equal(routeState.emailRequests, 1);
  const setCookie = requestResponse.headers.get("set-cookie") ?? "";
  const attemptValue = /moon_reply_account_login_attempt=([^;]+)/u.exec(setCookie)?.[1];
  assert.ok(attemptValue);
  const verifyResponse = await emailVerify(
    postRequest(
      "/api/auth/account/email-otp/verify",
      { email: "user@example.com", otp: "123456" },
      `${attemptModule.ACCOUNT_LOGIN_ATTEMPT_COOKIE}=${attemptValue}`,
    ),
  );
  assert.equal(verifyResponse.status, 200);
  assert.deepEqual(await verifyResponse.json(), { data: { status: "signed_in" } });
  assert.equal(routeState.emailVerifications, 1);
  assert.match(verifyResponse.headers.get("set-cookie") ?? "", /moon_reply_auth_session_csrf=/u);
});

check("provider-effecting Account starts have fixed coarse and attempt-specific fences", () => {
  const google = text("app/api/auth/account/google/start/route.ts");
  const email = text("app/api/auth/account/email-otp/request/route.ts");

  assert.match(
    google,
    /const ACCOUNT_GOOGLE_START_GLOBAL_RATE_LIMIT_KEY =\s*"account-google-start-global-v1";/u,
  );
  assert.match(
    google,
    /enforceCustomerAuthRateLimit\(\s*"account-google-start-global",\s*ACCOUNT_GOOGLE_START_GLOBAL_RATE_LIMIT_KEY,\s*\);[\s\S]*?enforceCustomerAuthRateLimit\("account-google-start", attempt\.secret\);[\s\S]*?\.startGoogle\(\)/u,
  );
  assert.match(
    email,
    /const ACCOUNT_EMAIL_OTP_REQUEST_GLOBAL_RATE_LIMIT_KEY =\s*"account-email-otp-request-global-v1";/u,
  );
  assert.match(
    email,
    /enforceCustomerAuthRateLimit\(\s*"account-email-otp-request-global",\s*ACCOUNT_EMAIL_OTP_REQUEST_GLOBAL_RATE_LIMIT_KEY,\s*\);[\s\S]*?enforceCustomerAuthRateLimit\("account-email-otp-request", attempt\.secret\);[\s\S]*?\.requestEmailOtp\(body\.email\)/u,
  );
  assert.doesNotMatch(
    `${google}\n${email}`,
    /x-forwarded-for|cf-connecting-ip|user-agent|enforceCustomerAuthRateLimit\([^;]*(?:request\.url|body\.email)/iu,
  );
});

await checkAsync("normal cookie-preserving provider-start flows remain available", async () => {
  const googleFirst = await googleStart(postRequest("/api/auth/account/google/start", {}));
  const googleAttempt = /moon_reply_account_login_attempt=([^;]+)/u.exec(
    googleFirst.headers.get("set-cookie") ?? "",
  )?.[1];
  assert.equal(googleFirst.status, 200);
  assert.ok(googleAttempt);
  const googleSecond = await googleStart(
    postRequest(
      "/api/auth/account/google/start",
      {},
      `${attemptModule.ACCOUNT_LOGIN_ATTEMPT_COOKIE}=${googleAttempt}`,
    ),
  );
  assert.equal(googleSecond.status, 200);

  const emailFirst = await emailRequest(
    postRequest("/api/auth/account/email-otp/request", { email: "user@example.com" }),
  );
  const emailAttempt = /moon_reply_account_login_attempt=([^;]+)/u.exec(
    emailFirst.headers.get("set-cookie") ?? "",
  )?.[1];
  assert.equal(emailFirst.status, 200);
  assert.ok(emailAttempt);
  const emailSecond = await emailRequest(
    postRequest(
      "/api/auth/account/email-otp/request",
      { email: "user@example.com" },
      `${attemptModule.ACCOUNT_LOGIN_ATTEMPT_COOKIE}=${emailAttempt}`,
    ),
  );
  assert.equal(emailSecond.status, 200);
});

await checkAsync("discarding Google attempt cookies cannot rotate past the coarse fence", async () => {
  process.env.CUSTOMER_AUTH_RATE_LIMIT_MAX_REQUESTS = "5";
  try {
    const before = routeState.googleStarts;
    const statuses = [];
    for (let index = 0; index < 4; index += 1) {
      const response = await googleStart(postRequest("/api/auth/account/google/start", {}));
      statuses.push(response.status);
    }
    assert.deepEqual(statuses, [200, 200, 429, 429]);
    assert.equal(routeState.googleStarts, before + 2);
    const stoppedAt = routeState.googleStarts;
    const blockedAgain = await googleStart(
      postRequest("/api/auth/account/google/start", {}),
    );
    assert.equal(blockedAgain.status, 429);
    assert.equal(routeState.googleStarts, stoppedAt);
  } finally {
    process.env.CUSTOMER_AUTH_RATE_LIMIT_MAX_REQUESTS = "1000";
  }
});

await checkAsync("discarding Email attempt cookies cannot rotate past the coarse fence", async () => {
  process.env.CUSTOMER_AUTH_RATE_LIMIT_MAX_REQUESTS = "5";
  try {
    const before = routeState.emailRequests;
    const statuses = [];
    for (let index = 0; index < 4; index += 1) {
      const response = await emailRequest(
        postRequest("/api/auth/account/email-otp/request", {
          email: "user@example.com",
        }),
      );
      statuses.push(response.status);
    }
    assert.deepEqual(statuses, [200, 200, 429, 429]);
    assert.equal(routeState.emailRequests, before + 2);
    const stoppedAt = routeState.emailRequests;
    const blockedAgain = await emailRequest(
      postRequest("/api/auth/account/email-otp/request", {
        email: "user@example.com",
      }),
    );
    assert.equal(blockedAgain.status, 429);
    assert.equal(routeState.emailRequests, stoppedAt);
  } finally {
    process.env.CUSTOMER_AUTH_RATE_LIMIT_MAX_REQUESTS = "1000";
  }
});

await checkAsync("Email verification without a current attempt mutates no Auth", async () => {
  const before = routeState.emailVerifications;
  const response = await emailVerify(
    postRequest(
      "/api/auth/account/email-otp/verify",
      { email: "user@example.com", otp: "123456" },
    ),
  );
  assert.equal(response.status, 403);
  assert.equal(routeState.emailVerifications, before);
});

check("standalone Account application has no ownership, Payment, fulfillment, or Support mutation", () => {
  const sources = [
    "lib/customer-auth/account-application.ts",
    "lib/customer-auth/account-service.ts",
    "app/api/auth/account/google/start/route.ts",
    "app/api/auth/account/callback/route.ts",
    "app/api/auth/account/email-otp/request/route.ts",
    "app/api/auth/account/email-otp/verify/route.ts",
  ].map(text).join("\n");
  assert.doesNotMatch(
    sources,
    /bindPreparation|bindPrepayment|CustomerIdentityRepository|purchaseIntentId|preparationCapability|createCheckout|production_fulfillment|createSupportCase|supabase\.rpc/iu,
  );
});

check("purchase and Account Auth cookies cannot substitute for one another", () => {
  const purchaseRoutes = [
    "app/api/auth/google/start/route.ts",
    "app/api/auth/callback/route.ts",
    "app/api/auth/email-otp/request/route.ts",
    "app/api/auth/email-otp/verify/route.ts",
  ].map(text).join("\n");
  const accountRoutes = [
    "app/api/auth/account/google/start/route.ts",
    "app/api/auth/account/callback/route.ts",
    "app/api/auth/account/email-otp/request/route.ts",
    "app/api/auth/account/email-otp/verify/route.ts",
  ].map(text).join("\n");
  assert.match(purchaseRoutes, /readAuthContinuationCookie/u);
  assert.match(purchaseRoutes, /readAuthCallbackCsrfCookie|csrfToken/u);
  assert.match(purchaseRoutes, /completeGoogleCallback|verifyEmailOtp/u);
  assert.doesNotMatch(purchaseRoutes, /ACCOUNT_LOGIN_ATTEMPT_COOKIE|readAccountLoginAttempt/u);
  assert.match(accountRoutes, /readAccountLoginAttempt/u);
  assert.doesNotMatch(accountRoutes, /readAuthContinuationCookie|readAuthCallbackCsrfCookie|bindPreparation/u);
});

check("existing purchase Auth routes remain byte-identical to E2 base", () => {
  const changed = git([
    "diff",
    "--name-only",
    acceptedAuthority,
    "--",
    "app/api/auth/continuations/route.ts",
    "app/api/auth/google/start/route.ts",
    "app/api/auth/callback/route.ts",
    "app/api/auth/email-otp/request/route.ts",
    "app/api/auth/email-otp/verify/route.ts",
    "app/purchase/auth/continue/page.tsx",
  ]);
  assert.equal(changed, "");
});

await checkAsync("logout retains same-origin, CSRF, fresh identity application, and local scope", async () => {
  const csrf = "c".repeat(43);
  const response = await logout(
    postRequest(
      "/api/auth/logout",
      { csrfToken: csrf, scope: "local" },
      `moon_reply_auth_session_csrf=${csrf}`,
    ),
  );
  assert.equal(response.status, 200);
  assert.deepEqual(routeState.logouts, ["local"]);
  const source = text("components/account/AccountLogoutButton.tsx");
  assert.match(source, /scope: "local"/u);
  assert.match(source, /announceCustomerAuthStateChanged\(\)/u);
  assert.match(source, /router\.replace\("\/login"\)/u);
});

check("Account signed-out IA points to standalone Login and keeps new Request", () => {
  const source = text("app/account/page.tsx");
  assert.match(source, /<h1>私の鑑定ノート<\/h1>/u);
  assert.match(source, /<h2>ログインが必要です<\/h2>/u);
  assert.match(source, /href="\/login">ログインする/u);
  assert.match(source, /href="\/request">新しく鑑定ノートを依頼する/u);
  assert.doesNotMatch(source, /購入へ進んだ依頼画面|Customer Auth/u);
});

check("Auth navigation state is ephemeral with no polling or browser persistence", () => {
  const sources = [
    "components/layout/CustomerSessionNav.tsx",
    "components/auth/AccountLoginPanel.tsx",
    "lib/customer-auth/browser-events.ts",
  ].map(text).join("\n");
  assert.doesNotMatch(sources, /localStorage|sessionStorage|indexedDB|setInterval|setTimeout/u);
  assert.match(sources, /CUSTOMER_AUTH_STATE_CHANGED_EVENT/u);
});

check("Login source never logs email, OTP, user, URL, or Auth payload", () => {
  const sources = [
    "components/auth/AccountLoginPanel.tsx",
    "app/api/auth/account/google/start/route.ts",
    "app/api/auth/account/callback/route.ts",
    "app/api/auth/account/email-otp/request/route.ts",
    "app/api/auth/account/email-otp/verify/route.ts",
  ].map(text).join("\n");
  assert.doesNotMatch(sources, /console\.|logger\.|localStorage|sessionStorage/u);
  assert.doesNotMatch(sources, /access_token|refresh_token|customerUserId|verifiedEmail/u);
  assert.doesNotMatch(sources, /request\.url\).*track|authorizationUrl\).*track/u);
});

check("all Account Auth/session responses and redirects are non-public", () => {
  const routeResponse = text("lib/customer-auth/route-response.ts");
  const callback = text("app/api/auth/account/callback/route.ts");
  assert.match(routeResponse, /private, no-store, no-cache/u);
  assert.match(routeResponse, /Vary: "Cookie"/u);
  assert.match(callback, /private, no-store, no-cache/u);
  assert.match(callback, /response\.headers\.set\("Vary", "Cookie"\)/u);
});

check("Root layout remains static and session state stays out of shared HTML", () => {
  const layout = text("app/layout.tsx");
  const header = text("components/layout/SiteHeader.tsx");
  assert.doesNotMatch(layout, /cookies\(|headers\(|getUser|force-dynamic/u);
  assert.doesNotMatch(header, /cookies\(|headers\(|getUser|force-dynamic/u);
  assert.match(header, /<CustomerSessionNav \/>/u);
});

check("mobile and desktop primary navigation stays visible and touch-sized", () => {
  const css = text("app/globals.css");
  const loginCss = text("components/auth/AccountLoginPanel.module.css");
  assert.match(css, /\.site-nav__identity/u);
  assert.match(css, /@media \(max-width: 960px\)[\s\S]*?\.site-nav__sample \{ display:none; \}/u);
  assert.match(css, /@media \(max-width: 640px\)[\s\S]*?grid-template-columns:minmax\(0,.75fr\) minmax\(0,1.4fr\)/u);
  assert.match(css, /\.site-nav__link,[\s\S]*?\.site-nav__cta \{[^}]*min-height: 2\.75rem/u);
  assert.match(loginCss, /min-height: 3rem/u);
  assert.match(loginCss, /@media \(max-width: 480px\)/u);
});

check("navigation and Login controls retain accessibility semantics", () => {
  const header = text("components/layout/SiteHeader.tsx");
  const login = text("components/auth/AccountLoginPanel.tsx");
  assert.match(header, /<nav className="site-nav" aria-label="メインナビゲーション">/u);
  assert.match(login, /aria-labelledby="login-method-heading"/u);
  assert.match(login, /htmlFor="account-login-email"/u);
  assert.match(login, /htmlFor="account-login-otp"/u);
  assert.match(login, /role="status"/u);
});

check("E1 detailed latency contract and Purchase Request instrumentation are unchanged", () => {
  const changed = git([
    "diff",
    "--name-only",
    acceptedAuthority,
    "--",
    "lib/measurement",
    "components/request/RequestForm.tsx",
    "scripts/verify-m2-e1-google-auth-latency-measurement.mjs",
  ]);
  assert.equal(changed, "");
  const accountRoutes = [
    git(["diff", "--name-only", acceptedAuthority, "--", "app/api/auth/account"]),
    git(["status", "--short", "--", "app/api/auth/account"]),
  ].join("\n");
  assert.match(accountRoutes, /app\/api\/auth\/account/u);
  assert.doesNotMatch(
    [
      "app/api/auth/account/google/start/route.ts",
      "app/api/auth/account/callback/route.ts",
      "app/api/auth/account/email-otp/request/route.ts",
      "app/api/auth/account/email-otp/verify/route.ts",
    ].map(text).join("\n"),
    /auth-latency|auth_latency|mral_|trackServerAuthComplete|trackClientMeasurement/u,
  );
});

check("E2 introduces no migration, dependency, Next.js, or external adapter change", () => {
  const changes = `${git(["diff", "--name-only", acceptedAuthority])}\n${git(["status", "--porcelain=v1"])}`;
  assert.equal(changes.split(/\r?\n/u).some((line) => line.includes("supabase/migrations/")), false);
  assert.equal(git(["diff", "--name-only", acceptedAuthority, "--", "package-lock.json"]), "");
  const packageDiff = git(["diff", acceptedAuthority, "--", "package.json"]);
  assert.doesNotMatch(packageDiff, /^[+-]\s*"(?:next|@supabase|react|stripe|openai)"/gmu);
  assert.doesNotMatch(changes, /netlify\.toml|lib\/measurement\/adapters/u);
});

check("remote migration identities remain untouched in source", () => {
  assert.equal(
    git(["hash-object", "supabase/migrations/0021_m2_d2_customer_support_cases.sql"]),
    git(["rev-parse", `${acceptedAuthority}:supabase/migrations/0021_m2_d2_customer_support_cases.sql`]),
  );
  assert.equal(
    git(["diff", "--name-only", acceptedAuthority, "--", "supabase/migrations"]),
    "",
  );
});

check("canonical E2 evidence and operational candidate status are present", () => {
  const evidence = text("docs/m2/M2_E2_AUTH_NAVIGATION_RECOVERY.md");
  for (const marker of [
    "SOURCE CANDIDATE — PENDING HUMAN/CHATGPT REVIEW",
    "AUTH/NAV SOURCE CANDIDATE",
    "OPTIMIZATION NOT STARTED",
    "PARTIALLY ADDRESSED",
    "Migration: `0`",
    "External writes: Git only",
  ]) assert.equal(evidence.includes(marker), true, marker);
  for (const relativePath of [
    "docs/CURRENT_FOCUS.md",
    "docs/WBS.md",
    "docs/CODEX_HANDOFF.md",
    "docs/m2/M2_MASTER_BACKLOG.md",
  ]) {
    const source = text(relativePath);
    assert.match(source, /b0bf81038a42178f032e0edb0572463e415dc086/u);
    assert.match(source, /M2-E2/u);
  }
});

check("E2 verifier is registered", () => {
  const packageJson = JSON.parse(text("package.json"));
  assert.equal(
    packageJson.scripts["verify:m2-e2"],
    "node scripts/verify-m2-e2-auth-navigation-recovery.mjs",
  );
});

console.log(`M2_E2_AUTH_NAVIGATION_RECOVERY: PASS ${passed}/${passed}`);
