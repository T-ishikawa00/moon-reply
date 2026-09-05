import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { existsSync, readFileSync, statSync } from "node:fs";
import { registerHooks } from "node:module";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";

const root = process.cwd();
const origin = "https://customer.example.test";
const state = { now: 0, buckets: new Map(), rpcCalls: [], clients: 0, providerCalls: 0, emailRequests: 0,
  googleStarts: 0, validOtp: false, nativeEmail: false, email: "user@example.test", dbMode: "ok", externalCalls: 0 };
globalThis.__f010 = state;
globalThis.fetch = async () => { state.externalCalls++; throw new Error("F010_EXTERNAL_CALL_FORBIDDEN"); };
const dataModule = (source) => `data:text/javascript,${encodeURIComponent(source)}`;
state.consume = (args) => {
  const key = `${args.p_purpose}:${args.p_identity_hash}`;
  const maximum = args.p_purpose === "request" ? 5 : 10;
  let b = state.buckets.get(key);
  if (!b || b.expires <= state.now) { b = { count: 0, expires: state.now + 600_000 }; state.buckets.set(key, b); }
  if (b.count >= maximum) return { allowed: false, retry_after_seconds: Math.ceil((b.expires - state.now) / 1_000) };
  b.count++;
  return { allowed: true, retry_after_seconds: 0 };
};
const supabaseMock = dataModule(`
export function createClient() {
  const s = globalThis.__f010; s.clients++;
  return { rpc(name, args) {
    s.rpcCalls.push({ name, args });
    return { async abortSignal(signal) {
      if (!(signal instanceof AbortSignal)) throw new Error("F010_SIGNAL_REQUIRED");
      if (s.dbMode === "throw") throw new Error("sensitive-infrastructure-detail");
      if (s.dbMode === "missing") return { data: null, error: { message: "missing RPC" } };
      if (s.dbMode === "null") return { data: null, error: null };
      if (s.dbMode === "malformed") return { data: { allowed: true, retry_after_seconds: 600 }, error: null };
      return { data: s.consume(args), error: null };
    } };
  } };
}`);
registerHooks({
  resolve(specifier, context, next) {
    if (specifier === "server-only") return { url: dataModule("export {};"), shortCircuit: true };
    if (specifier === "@/lib/customer-auth/account-service") return {
      url: dataModule("export async function createCustomerAccountAuthApplication() { return globalThis.__f010.application; }"), shortCircuit: true,
    };
    if (specifier === "@supabase/supabase-js" && context.parentURL?.endsWith("account-otp-throttle-runtime.ts")) {
      return { url: supabaseMock, shortCircuit: true };
    }
    if (specifier === "next/server") return { url: pathToFileURL(path.join(root, "node_modules/next/server.js")).href, shortCircuit: true };
    if (specifier === "next/headers") return { url: pathToFileURL(path.join(root, "node_modules/next/headers.js")).href, shortCircuit: true };
    if ((specifier.startsWith(".") || specifier.startsWith("@/")) && context.parentURL?.startsWith("file:")) {
      const base = specifier.startsWith("@/") ? path.join(root, specifier.slice(2)) : path.resolve(path.dirname(fileURLToPath(context.parentURL)), specifier);
      for (const candidate of [base, `${base}.ts`]) if (existsSync(candidate) && statSync(candidate).isFile()) return { url: pathToFileURL(candidate).href, shortCircuit: true };
    }
    return next(specifier, context);
  },
  load(url, context, next) {
    if (url.startsWith("file:") && url.endsWith(".ts")) return { format: "module", shortCircuit: true,
      source: ts.transpileModule(readFileSync(fileURLToPath(url), "utf8"), {
        compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022, verbatimModuleSyntax: true },
      }).outputText };
    return next(url, context);
  },
});
Object.assign(process.env, {
  NODE_ENV: "production", NEXT_PUBLIC_APP_URL: origin,
  CUSTOMER_AUTH_ENABLED: "true", CUSTOMER_AUTH_GOOGLE_ENABLED: "true", CUSTOMER_AUTH_EMAIL_OTP_ENABLED: "true",
  CUSTOMER_AUTH_EMERGENCY_STOP: "false", CUSTOMER_AUTH_RATE_LIMIT_MODE: "in_memory_seam",
  CUSTOMER_AUTH_RATE_LIMIT_MAX_REQUESTS: "10000", CUSTOMER_AUTH_RATE_LIMIT_WINDOW_SECONDS: "60",
  EMAIL_VERIFICATION_SECRET_PEPPER: "f010-synthetic-pepper".repeat(3),
  SUPABASE_URL: "https://f010-supabase.example.invalid", SUPABASE_SECRET_KEY: "f010-synthetic-key",
});
const { NextRequest } = await import("next/server");
const { CustomerAccountAuthApplicationV1 } = await import("../lib/customer-auth/account-application.ts");
const { SupabaseCustomerAuthProviderV1 } = await import("../lib/customer-auth/supabase-provider.ts");
const { hashAccountOtpIdentity, requireAccountOtpAdmission } = await import("../lib/customer-auth/account-otp-throttle.ts");
const { POST: verify } = await import("../app/api/auth/account/email-otp/verify/route.ts");
const { POST: requestOtp } = await import("../app/api/auth/account/email-otp/request/route.ts");
const { POST: google } = await import("../app/api/auth/account/google/start/route.ts");
const provider = new SupabaseCustomerAuthProviderV1({ auth: {
  async verifyOtp() { state.providerCalls++; return { error: state.validOtp ? null : { message: "sensitive-OTP-detail" } }; },
  async signInWithOtp() { state.emailRequests++; return { error: null }; },
  async getUser() { return { data: { user: {
    id: "c1000000-0000-4000-8000-000000000001", email: state.email, email_confirmed_at: "2026-09-06T00:00:00Z",
    identities: [{ provider: state.nativeEmail ? "email" : "google", identity_data: { email: state.email, email_verified: true } }],
  } }, error: null }; },
  async signInWithOAuth() { state.googleStarts++; return { data: { url: `${process.env.SUPABASE_URL}/auth/v1/authorize?provider=google` }, error: null }; },
} }, origin, process.env.SUPABASE_URL);
state.application = new CustomerAccountAuthApplicationV1(provider);
const cookie = () => `moon_reply_account_login_attempt=${randomBytes(32).toString("base64url")}.${Date.now()}`;
function req(route, body, attemptCookie = cookie(), ip = "192.0.2.1") {
  return new NextRequest(`${origin}${route}`, { method: "POST", headers: {
    origin, "sec-fetch-site": "same-origin", "content-type": "application/json", cookie: attemptCookie, "x-forwarded-for": ip,
  }, body: JSON.stringify(body) });
}
const verifyReq = (email = state.email, attemptCookie = cookie(), ip) => req("/api/auth/account/email-otp/verify", { email, otp: "12345678" }, attemptCookie, ip);
const requestReq = (email = state.email) => req("/api/auth/account/email-otp/request", { email });
function reset() { state.now = 0; state.buckets.clear(); state.rpcCalls = []; state.providerCalls = 0;
  state.emailRequests = 0; state.clients = 0; state.validOtp = false; state.nativeEmail = false; state.dbMode = "ok"; state.email = "user@example.test"; }
let passed = 0;
async function check(name, run) { reset(); await run(); console.log(`PASS F010 ${++passed} ${name}`); }

await check("same-cookie failures have a fixed target-identity threshold", async () => {
  const c = cookie(); for (let i = 0; i < 10; i++) assert.equal((await verify(verifyReq(state.email, c))).status, 403);
  assert.equal((await verify(verifyReq(state.email, c))).status, 429); assert.equal(state.providerCalls, 10);
});
await check("cookie replacement, new attempts and different IPs cannot reset one email", async () => {
  for (let i = 0; i < 10; i++) assert.equal((await verify(verifyReq(" USER@example.test ", cookie(), `192.0.2.${i + 1}`))).status, 403);
  assert.equal((await verify(verifyReq())).status, 429);
  assert.equal(state.buckets.size, 1); assert.equal(state.providerCalls, 10); assert.equal(state.clients, 11);
});
await check("distinct email is independent while normalized email variants share the key", async () => {
  for (let i = 0; i < 10; i++) await verify(verifyReq());
  assert.equal((await verify(verifyReq("second@example.test"))).status, 403);
  assert.equal(state.buckets.size, 2);
  assert.equal(hashAccountOtpIdentity(" ＵＳＥＲ@example.test ", process.env.EMAIL_VERIFICATION_SECRET_PEPPER),
    hashAccountOtpIdentity(state.email, process.env.EMAIL_VERIFICATION_SECRET_PEPPER));
});
await check("threshold does not slide the window and expiry restores admission", async () => {
  for (let i = 0; i < 10; i++) await verify(verifyReq());
  state.now = 599_999; assert.equal((await verify(verifyReq())).status, 429);
  state.now = 600_000; assert.equal((await verify(verifyReq())).status, 403); assert.equal(state.providerCalls, 11);
});
await check("parallel requests with independent clients share the same ten slots", async () => {
  const results = await Promise.all(Array.from({ length: 30 }, () => verify(verifyReq())));
  assert.equal(results.filter((r) => r.status === 403).length, 10);
  assert.equal(results.filter((r) => r.status === 429).length, 20); assert.equal(state.providerCalls, 10); assert.equal(state.clients, 30);
});
await check("normal Google-only and email-native OTP success clear cookie without resetting shared budget", async () => {
  for (const native of [false, true]) {
    reset(); state.nativeEmail = native; state.validOtp = true;
    const response = await verify(verifyReq()); assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { data: { status: "signed_in" } });
    assert.match(response.headers.get("set-cookie"), /moon_reply_account_login_attempt=;.*Max-Age=0/u);
    assert.equal([...state.buckets.values()][0].count, 1);
    state.validOtp = false;
    for (let i = 0; i < 9; i++) await verify(verifyReq());
    assert.equal((await verify(verifyReq())).status, 429);
  }
});
await check("OTP success still requires fresh exact-email identity", async () => {
  state.validOtp = true;
  const response = await verify(verifyReq("different@example.test")); assert.equal(response.status, 403);
  assert.notEqual(response.headers.get("set-cookie")?.includes("Max-Age=0"), true);
});
await check("request throttle survives cookie replacement and never replenishes verification budget", async () => {
  for (let i = 0; i < 10; i++) await verify(verifyReq());
  for (let i = 0; i < 5; i++) assert.equal((await requestOtp(requestReq())).status, 200);
  assert.equal((await requestOtp(requestReq())).status, 429); assert.equal(state.emailRequests, 5);
  assert.equal((await verify(verifyReq())).status, 429);
});
await check("missing RPC, DB errors and malformed receipts stop before Supabase Auth", async () => {
  for (const mode of ["missing", "throw", "null", "malformed"]) {
    state.dbMode = mode;
    for (const response of [await verify(verifyReq()), await requestOtp(requestReq())]) {
      assert.equal(response.status, 503); assert.deepEqual(await response.json(), { error: { code: "CUSTOMER_AUTH_RATE_LIMIT_UNAVAILABLE" } });
    }
  }
  assert.equal(state.providerCalls, 0); assert.equal(state.emailRequests, 0);
});
await check("invalid email, missing cookie and missing key never call the durable store", async () => {
  assert.equal((await verify(verifyReq("invalid"))).status, 400);
  assert.equal((await verify(verifyReq(state.email, ""))).status, 403);
  const pepper = process.env.EMAIL_VERIFICATION_SECRET_PEPPER;
  delete process.env.EMAIL_VERIFICATION_SECRET_PEPPER;
  assert.equal((await verify(verifyReq())).status, 503); process.env.EMAIL_VERIFICATION_SECRET_PEPPER = pepper;
  assert.equal(state.rpcCalls.length, 0); assert.equal(state.providerCalls, 0);
});
await check("Google Auth remains independent from the OTP database/key", async () => {
  state.dbMode = "missing"; const pepper = process.env.EMAIL_VERIFICATION_SECRET_PEPPER;
  delete process.env.EMAIL_VERIFICATION_SECRET_PEPPER;
  const response = await google(req("/api/auth/account/google/start", {}));
  process.env.EMAIL_VERIFICATION_SECRET_PEPPER = pepper;
  assert.equal(response.status, 200); assert.equal(state.rpcCalls.length, 0); assert.equal(state.googleStarts, 1);
});
await check("RPC payload contains only purpose and domain-separated keyed hash", async () => {
  await verify(verifyReq()); const call = state.rpcCalls[0];
  assert.equal(call.name, "consume_account_otp_attempt_v1");
  assert.deepEqual(Object.keys(call.args).sort(), ["p_identity_hash", "p_purpose"]);
  assert.match(call.args.p_identity_hash, /^[0-9a-f]{64}$/u);
  assert.equal(JSON.stringify(call).includes(state.email), false);
  assert.notEqual(hashAccountOtpIdentity(state.email, "another-synthetic-key".repeat(3)), call.args.p_identity_hash);
  for (const invalid of [{ allowed: true }, { allowed: true, retry_after_seconds: 0, extra: 1 }, { allowed: false, retry_after_seconds: null }]) {
    assert.throws(() => requireAccountOtpAdmission(invalid), /CUSTOMER_AUTH_RATE_LIMIT_UNAVAILABLE/u);
  }
});
assert.equal(state.externalCalls, 0);
console.log(`F010 Account OTP throttle: ${passed}/${passed} PASS; real Auth/email/network calls=0`);
