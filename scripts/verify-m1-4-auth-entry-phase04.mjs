import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { registerHooks } from "node:module";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";

const root = process.cwd();
const canonicalOrigin = "https://tsukinohenji.jp";
const internalContinuationUrl =
  "https://moon-reply-internal.netlify.app/api/auth/continuations";
const verifierState = {
  createdContinuations: [],
  completedGoogleCallbacks: [],
  requiredMethods: [],
};
globalThis.__moonReplyAuthEntryVerifier = verifierState;

const mockServiceUrl = `data:text/javascript,${encodeURIComponent(`
const state = globalThis.__moonReplyAuthEntryVerifier;
export function requireCustomerAuthMethod(method) {
  state.requiredMethods.push(method);
}
export async function createCustomerIdentityAuthApplication() {
  return {
    async createContinuation(input) {
      state.createdContinuations.push(input);
      return {
        continuationToken: "k".repeat(43),
        csrfToken: input.csrfToken,
        expiresAt: "2026-08-22T01:00:00.000Z",
        ttlSeconds: 600,
      };
    },
    async completeGoogleCallback(input) {
      state.completedGoogleCallbacks.push(input);
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
    if (existsSync(candidate)) return pathToFileURL(candidate).href;
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
    if (specifier === "@/lib/customer-auth/service") {
      return { url: mockServiceUrl, shortCircuit: true };
    }
    const local = context.parentURL
      ? resolveLocalModule(specifier, context.parentURL)
      : null;
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
process.env.CUSTOMER_AUTH_CONTINUATION_TTL_SECONDS = "600";
process.env.CUSTOMER_AUTH_RATE_LIMIT_MODE = "in_memory_seam";
process.env.CUSTOMER_AUTH_RATE_LIMIT_MAX_REQUESTS = "100";
process.env.CUSTOMER_AUTH_RATE_LIMIT_WINDOW_SECONDS = "60";
process.env.CUSTOMER_AUTH_EMAIL_KEY_VERSION = "v1";
process.env.EMAIL_VERIFICATION_SECRET_PEPPER = "p".repeat(64);
process.env.EMAIL_ADDRESS_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString("base64");

const { POST } = await import("../app/api/auth/continuations/route.ts");
const { GET: googleCallback } = await import("../app/api/auth/callback/route.ts");
const { NextRequest } = await import("next/server");
const csrfToken = "c".repeat(43);
let passed = 0;

async function check(name, run) {
  await run();
  passed += 1;
  console.log(`PASS ${name}`);
}

function continuationRequest({
  flowKind = "google",
  origin = canonicalOrigin,
  fetchSite = "same-origin",
  headerCsrf = csrfToken,
  bodyCsrf = csrfToken,
  preparationCapability = "p".repeat(43),
} = {}) {
  const headers = new Headers({
    "content-type": "application/json",
    host: "moon-reply-internal.netlify.app",
    "x-forwarded-host": "moon-reply-internal.netlify.app",
    "x-moon-reply-csrf": headerCsrf,
  });
  if (origin !== null) headers.set("origin", origin);
  if (fetchSite !== null) headers.set("sec-fetch-site", fetchSite);
  return new Request(internalContinuationUrl, {
    method: "POST",
    headers,
    body: JSON.stringify({
      preparationCapability,
      csrfToken: bodyCsrf,
      flowKind,
    }),
  });
}

async function expectSafeError(request, status, code) {
  const response = await POST(request);
  assert.equal(response.status, status);
  assert.deepEqual(await response.json(), { error: { code } });
}

await check(
  "canonical browser Origin passes with a reverse-proxy internal URL and Host",
  async () => {
    const response = await POST(continuationRequest());
    assert.equal(response.status, 200);
    assert.match(response.headers.get("cache-control") ?? "", /private, no-store/u);
    const payload = await response.json();
    assert.equal(payload.data.status, "continuation_ready");
    assert.equal(payload.data.csrfToken, csrfToken);
    assert.equal(verifierState.createdContinuations.length, 1);
    assert.equal(verifierState.createdContinuations[0].flowKind, "google");
  },
);

await check("wrong Origin fails closed", async () => {
  await expectSafeError(
    continuationRequest({ origin: "https://attacker.example" }),
    403,
    "CUSTOMER_AUTH_ORIGIN_REJECTED",
  );
});

await check("missing Origin fails closed", async () => {
  await expectSafeError(
    continuationRequest({ origin: null }),
    403,
    "CUSTOMER_AUTH_ORIGIN_REJECTED",
  );
});

await check("cross-site Fetch Metadata fails closed", async () => {
  await expectSafeError(
    continuationRequest({ fetchSite: "cross-site" }),
    403,
    "CUSTOMER_AUTH_ORIGIN_REJECTED",
  );
});

await check("CSRF header and body mismatch fails closed", async () => {
  await expectSafeError(
    continuationRequest({ bodyCsrf: "d".repeat(43) }),
    403,
    "CUSTOMER_AUTH_CSRF_REJECTED",
  );
});

await check(
  "missing, invalid, path-bearing, and non-HTTPS canonical origins fail closed",
  async () => {
    for (const configured of [
      undefined,
      "not-a-url",
      `${canonicalOrigin}/path`,
      "http://public.example",
      "http://127.0.0.1:3000",
    ]) {
      if (configured === undefined) delete process.env.NEXT_PUBLIC_APP_URL;
      else process.env.NEXT_PUBLIC_APP_URL = configured;
      await expectSafeError(
        continuationRequest(),
        503,
        "CUSTOMER_AUTH_CONFIGURATION_INVALID",
      );
    }
    process.env.NEXT_PUBLIC_APP_URL = canonicalOrigin;
  },
);

await check("Google and Email both create continuations for their method", async () => {
  const response = await POST(continuationRequest({ flowKind: "email_otp" }));
  assert.equal(response.status, 200);
  assert.deepEqual(
    verifierState.createdContinuations.map((input) => input.flowKind),
    ["google", "email_otp"],
  );
  assert.equal(verifierState.requiredMethods.includes("google"), true);
  assert.equal(verifierState.requiredMethods.includes("email_otp"), true);
});

await check("Fetch Metadata may be absent when canonical Origin is valid", async () => {
  const response = await POST(
    continuationRequest({
      fetchSite: null,
      preparationCapability: "s".repeat(43),
    }),
  );
  assert.equal(response.status, 200);
});

await check("Customer Auth rate limiting remains active", async () => {
  process.env.CUSTOMER_AUTH_RATE_LIMIT_MAX_REQUESTS = "1";
  const rateIdentity = "r".repeat(43);
  try {
    const first = await POST(
      continuationRequest({ preparationCapability: rateIdentity }),
    );
    assert.equal(first.status, 200);
    await expectSafeError(
      continuationRequest({ preparationCapability: rateIdentity }),
      429,
      "CUSTOMER_AUTH_RATE_LIMITED",
    );
  } finally {
    process.env.CUSTOMER_AUTH_RATE_LIMIT_MAX_REQUESTS = "100";
  }
});

await check("Google callback accepts the canonical flow behind the reverse proxy", async () => {
  const continuationToken = "k".repeat(43);
  const callbackCsrf = "q".repeat(43);
  const request = new NextRequest(
    "https://moon-reply-internal.netlify.app/api/auth/callback?code=provider-code",
    {
      headers: {
        host: "moon-reply-internal.netlify.app",
        cookie: [
          `moon_reply_auth_continuation=${continuationToken}`,
          `moon_reply_auth_callback_csrf=${callbackCsrf}`,
        ].join("; "),
      },
    },
  );
  const response = await googleCallback(request);
  assert.equal(response.status, 303);
  assert.equal(
    response.headers.get("location"),
    `${canonicalOrigin}/purchase/auth/continue`,
  );
  assert.deepEqual(verifierState.completedGoogleCallbacks, [
    {
      continuationToken,
      csrfToken: callbackCsrf,
      code: "provider-code",
    },
  ]);
});

await check("Phase04 is method-first and dispatches each successful continuation", () => {
  const requestForm = readFileSync(
    path.join(root, "components/request/RequestForm.tsx"),
    "utf8",
  );
  const beginStart = requestForm.indexOf("async function beginCustomerAuth(");
  const beginEnd = requestForm.indexOf(
    "async function submitCustomerAuthEmailOtp(",
    beginStart,
  );
  const beginCustomerAuth = requestForm.slice(beginStart, beginEnd);
  assert.ok(beginStart > 0 && beginEnd > beginStart);
  assert.match(
    beginCustomerAuth,
    /if \(flowKind === "email_otp"\) \{[\s\S]*?validateEmail\(form\)/u,
  );
  assert.match(beginCustomerAuth, /fetch\("\/api\/auth\/continuations"/u);
  assert.match(
    beginCustomerAuth,
    /if \(flowKind === "google"\) \{[\s\S]*?fetch\("\/api\/auth\/google\/start"/u,
  );
  assert.match(
    beginCustomerAuth,
    /fetch\("\/api\/auth\/email-otp\/request"/u,
  );
  assert.ok(
    beginCustomerAuth.indexOf('fetch("/api/auth/continuations"') <
      beginCustomerAuth.indexOf('fetch("/api/auth/google/start"'),
  );
  assert.ok(
    beginCustomerAuth.indexOf('fetch("/api/auth/continuations"') <
      beginCustomerAuth.indexOf('fetch("/api/auth/email-otp/request"'),
  );

  assert.match(
    requestForm,
    /useState<CustomerAuthMethod \| null>\(null\)/u,
  );
  assert.match(
    requestForm,
    /onClick=\{\(\) => selectCustomerAuthMethod\("google"\)\}/u,
  );
  assert.match(
    requestForm,
    /onClick=\{\(\) => selectCustomerAuthMethod\("email_otp"\)\}/u,
  );
  assert.match(
    requestForm,
    /customerAuthMethod === "email_otp"[\s\S]*?id="request-email"/u,
  );
  assert.ok(
    requestForm.indexOf("Googleで続ける") <
      requestForm.indexOf('id="request-email"'),
  );
  assert.doesNotMatch(requestForm, /Googleで続ける場合は入力不要/u);
  assert.match(
    requestForm,
    /if \(method === "google"\) \{[\s\S]*?runPhaseFour\(method\)/u,
  );
  assert.match(requestForm, /if \(authEntryPendingRef\.current\) return/u);
  assert.match(
    requestForm,
    /customerAuthEnabled && authMethod !== "email_otp"[\s\S]*?validateEmail\(form\)/u,
  );
});

console.log(`M1-4_AUTH_ENTRY_PHASE04: PASS ${passed}/${passed}`);
