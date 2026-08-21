import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { registerHooks } from "node:module";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === "server-only") {
      return { url: "data:text/javascript,export%20{}", shortCircuit: true };
    }
    if (
      (specifier.startsWith("./") || specifier.startsWith("../")) &&
      context.parentURL?.endsWith(".ts")
    ) {
      const parentPath = fileURLToPath(context.parentURL);
      const candidate = path.resolve(path.dirname(parentPath), `${specifier}.ts`);
      if (existsSync(candidate)) {
        return { url: pathToFileURL(candidate).href, shortCircuit: true };
      }
    }
    return nextResolve(specifier, context);
  },
  load(url, context, nextLoad) {
    if (url.startsWith("file:") && url.endsWith(".ts")) {
      const source = readFileSync(fileURLToPath(url), "utf8");
      const transpiled = ts.transpileModule(source, {
        compilerOptions: {
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

const root = process.cwd();
const acceptedArchitectureRelease =
  "8bf6c4e9c0a860b48826708676f0abe7c4395714";
const foundationR1Candidate =
  "ca1c790ec0cac51f4a7fe13086949728b2d9a8b8";
const acceptedFoundationRelease =
  "fb90b89de51b91753bbdf25278f4a0e4960a5c6e";
const migrationPath =
  "supabase/migrations/0014_customer_identity_authority_v1.sql";
let passed = 0;

function git(args, encoding = "utf8") {
  return execFileSync(
    "git.exe",
    ["-c", "safe.directory=C:/projects/moon-reply", ...args],
    { cwd: root, encoding, maxBuffer: 256 * 1024 * 1024 },
  );
}

function text(relativePath) {
  return readFileSync(path.join(root, relativePath), "utf8");
}

function files() {
  return git(["ls-files", "--cached", "--others", "--exclude-standard", "-z"])
    .split("\0")
    .filter(Boolean)
    .filter((entry) => existsSync(path.join(root, entry)))
    .map((entry) => entry.replaceAll("\\", "/"));
}

function productionSource() {
  return files()
    .filter((entry) =>
      /^(app|components|lib)\/.*\.(?:ts|tsx)$/u.test(entry) || entry === "proxy.ts",
    )
    .map((entry) => `\n/* ${entry} */\n${text(entry)}`)
    .join("");
}

function check(name, fn) {
  fn();
  passed += 1;
  console.log(`[PASS] ${name}`);
}

async function checkAsync(name, fn) {
  await fn();
  passed += 1;
  console.log(`[PASS] ${name}`);
}

function assertUnchangedFrom(authority, paths) {
  try {
    git(["diff", "--quiet", authority, "--", ...paths]);
  } catch {
    assert.fail(`accepted file changed: ${paths.join(", ")}`);
  }
}

function assertUnchanged(paths) {
  assertUnchangedFrom(acceptedArchitectureRelease, paths);
}

const source = productionSource();
const serverClient = text("lib/supabase/server.ts");
const proxySource = text("lib/supabase/proxy.ts") + text("proxy.ts");
const proxyEntrypoint = text("proxy.ts");
const providerSource = text("lib/customer-auth/supabase-provider.ts");
const cutoverSource = text("lib/customer-auth/cutover.ts");
const paymentService = text("lib/payment/production/service.ts");
const repositorySource =
  text("lib/customer-auth/supabase-repository.ts") +
  text("lib/payment/production/supabase-repository.ts");
const envExample = text(".env.example");
const migration = text(migrationPath);
const authorityDoc = text("docs/auth/CUSTOMER_IDENTITY_AUTHORITY_V1.md");
const migrationPlan = text("docs/auth/CUSTOMER_IDENTITY_MIGRATION_PLAN_V1.md");
const threatModel = text("docs/auth/CUSTOMER_IDENTITY_THREAT_MODEL_V1.md");
const activationRunbook = text("docs/payment/RC2_PRODUCTION_ACTIVATION_RUNBOOK.md");
const packageJson = JSON.parse(text("package.json"));

check("stable Supabase SSR dependency is exact", () => {
  assert.equal(packageJson.dependencies["@supabase/ssr"], "0.12.4");
  assert.equal(packageJson.dependencies["@supabase/supabase-js"], "2.112.3");
});

check("browser Supabase Auth client is absent", () => {
  assert.doesNotMatch(source, /createBrowserClient/u);
  assert.equal(files().includes("lib/supabase/client.ts"), false);
});

check("browser Auth token storage is absent", () => {
  assert.doesNotMatch(source, /localStorage/u);
  assert.doesNotMatch(source, /sessionStorage/u);
});

check("Customer Auth client uses only publishable authority", () => {
  assert.match(serverClient, /supabasePublishableKey/u);
  assert.doesNotMatch(serverClient, /SUPABASE_SECRET_KEY|supabaseSecretKey/u);
  assert.match(text("lib/supabase/env.ts"), /SUPABASE_PUBLISHABLE_KEY/u);
});

check("privileged repositories use only secret authority", () => {
  assert.match(repositorySource, /secretKey|supabaseSecretKey/u);
  assert.doesNotMatch(repositorySource, /SUPABASE_PUBLISHABLE_KEY|supabasePublishableKey/u);
});

check("obsolete public and service-role key contracts are absent", () => {
  assert.doesNotMatch(envExample, /NEXT_PUBLIC_SUPABASE|SUPABASE_SERVICE_ROLE_KEY/u);
});

check("all Customer Auth activation defaults fail closed", () => {
  for (const name of [
    "CUSTOMER_AUTH_ENABLED",
    "CUSTOMER_AUTH_GOOGLE_ENABLED",
    "CUSTOMER_AUTH_EMAIL_OTP_ENABLED",
    "CUSTOMER_AUTH_EMERGENCY_STOP",
  ]) {
    assert.match(envExample, new RegExp(`^${name}=false$`, "mu"));
  }
  assert.match(envExample, /^CUSTOMER_AUTH_CONTINUATION_TTL_SECONDS=600$/mu);
});

check("server cookies are HttpOnly host-only Lax and production Secure", () => {
  const cookiePolicy = text("lib/supabase/cookie-policy.ts") +
    text("lib/customer-auth/cookies.ts");
  assert.match(cookiePolicy, /httpOnly:\s*true/u);
  assert.match(cookiePolicy, /sameSite:\s*"lax"/u);
  assert.match(cookiePolicy, /path:\s*"\/"/u);
  assert.match(cookiePolicy, /NODE_ENV === "production"/u);
  assert.match(cookiePolicy, /configuredLoopbackHttp/u);
  assert.match(text("lib/customer-auth/environment.ts"), /isCustomerAuthLoopbackHost/u);
  assert.doesNotMatch(cookiePolicy, /hostname\.endsWith/u);
  assert.doesNotMatch(cookiePolicy, /domain:/u);
});

check("server client is request scoped", () => {
  assert.match(serverClient, /await cookies\(\)/u);
  assert.match(serverClient, /createServerClient/u);
  assert.doesNotMatch(serverClient, /const\s+\w+\s*=\s*createServerClient/u);
});

check("proxy is refresh-only with no rewrite or arbitrary redirect", () => {
  assert.match(proxySource, /auth\.getClaims\(\)/u);
  assert.match(proxySource, /private, no-store/u);
  assert.match(proxySource, /Vary", "Cookie/u);
  assert.doesNotMatch(proxySource, /NextResponse\.rewrite|NextResponse\.redirect/u);
  const matchers = [...proxyEntrypoint.matchAll(/^\s*"([^"]+)",$/gmu)]
    .map((match) => match[1]);
  assert.deepEqual(matchers, [
    "/account/:path*",
    "/api/account/:path*",
    "/api/auth/:path*",
    "/purchase/auth/:path*",
  ]);
  assert.doesNotMatch(proxyEntrypoint, /"\/(?:\(\.\*\)|:path\*)"/u);
});

check("Google seam uses PKCE callback and basic scopes only", () => {
  assert.match(serverClient, /flowType:\s*"pkce"/u);
  assert.match(providerSource, /scopes:\s*"openid email profile"/u);
  assert.match(providerSource, /\/api\/auth\/callback/u);
  assert.doesNotMatch(providerSource, /gmail|drive|calendar|contacts/iu);
});

check("provider and refresh tokens never enter domain contracts", () => {
  const contracts = text("lib/customer-auth/types.ts") + providerSource;
  assert.doesNotMatch(
    contracts,
    /provider_token|providerToken|provider_refresh_token|refreshToken|accessToken/u,
  );
});

check("fresh getUser protects high-impact identity operations", () => {
  assert.match(providerSource, /auth\.getUser\(\)/u);
  assert.match(text("app/api/payments/checkout/route.ts"), /getFreshIdentity/u);
  assert.match(text("app/account/results/[deliveryId]/page.tsx"), /resolveOwnedResult/u);
});

check("browser input never supplies CustomerUserId authority", () => {
  const routes = files()
    .filter((entry) => entry.startsWith("app/api/") && entry.endsWith("route.ts"))
    .map(text)
    .join("\n");
  assert.doesNotMatch(
    routes,
    /body\.customerUserId|value\.customerUserId|p_customer_user_id:\s*body/u,
  );
});

check("provider token persistence and logging are absent", () => {
  assert.doesNotMatch(source, /provider_token|provider_refresh_token/u);
  assert.doesNotMatch(providerSource, /console\.|logger\.|log\(/u);
});

check("continuation and CSRF are independent hash-only authorities", () => {
  assert.match(migration, /continuation_token_hash text not null unique/u);
  assert.match(migration, /csrf_token_hash text not null/u);
  assert.match(migration, /continuation_token_hash <> csrf_token_hash/u);
  assert.doesNotMatch(migration, /raw_(?:continuation|csrf)|\bemail text\b/iu);
});

check("continuation partial uniqueness has no volatile clock", () => {
  assert.match(migration, /where state = 'pending'/u);
  const partialIndex = migration.match(
    /create unique index production_customer_auth_one_pending_per_preparation_idx[\s\S]*?;/u,
  )?.[0];
  assert.ok(partialIndex);
  assert.doesNotMatch(partialIndex, /now\s*\(/iu);
});

check("0014 creates exactly the reviewed two application tables", () => {
  const tables = [...migration.matchAll(/create table public\.([a-z0-9_]+)/gu)]
    .map((match) => match[1]);
  assert.deepEqual(tables, [
    "production_customer_auth_continuations",
    "production_customer_ownership_bindings",
  ]);
});

check("Purchase Intent ownership lanes are exact XOR", () => {
  assert.match(migration, /production_purchase_intent_ownership_lane/u);
  assert.match(
    migration,
    /customer_ownership_binding_id is null[\s\S]*verified_email_authority_id is not null[\s\S]*trusted_email_session_id is not null/u,
  );
  assert.match(
    migration,
    /customer_ownership_binding_id is not null[\s\S]*verified_email_authority_id is null[\s\S]*trusted_email_session_id is null/u,
  );
});

check("Customer identity never reuses Runtime owner_id", () => {
  assert.doesNotMatch(migration, /alter\s+(?:column|table)[\s\S]{0,80}owner_id/iu);
  assert.match(migration, /customer_user_id uuid/u);
  assert.match(migration, /runtime_owner_column_count <> 3/u);
});

check("ownership binding uses Auth RESTRICT and encrypted keyed email", () => {
  assert.match(migration, /references auth\.users\(id\) on delete restrict/u);
  assert.match(migration, /delivery_email_sha256/u);
  assert.match(migration, /delivery_email_ciphertext/u);
  assert.doesNotMatch(migration, /unique\s*\(delivery_email_sha256\)/u);
});

check("service-role reads carry explicit ownership joins", () => {
  for (const fn of [
    "resolve_customer_purchase_status_v1",
    "resolve_customer_account_history_v1",
    "resolve_customer_account_result_v1",
    "resolve_customer_completed_delivery_v1",
  ]) {
    const start = migration.indexOf(`create function public.${fn}`);
    const end = migration.indexOf("$function$;", start);
    const body = migration.slice(start, end);
    assert.match(body, /customer_user_id = p_customer_user_id/u);
    assert.match(body, /binding\.state = 'active'/u);
  }
});

check("no raw-email ownership merge or manual identity linking exists", () => {
  assert.doesNotMatch(
    migration,
    /customer_user_id\s*=\s*(?:pg_catalog\.)?lower\s*\([^)]*email|(?:pg_catalog\.)?lower\s*\([^)]*email[^)]*\)\s*=\s*[^;\n]*customer_user_id/iu,
  );
  assert.doesNotMatch(source, /linkIdentity|unlinkIdentity/u);
  assert.match(authorityDoc, /Manual identity linking is disabled/u);
});

check("Google-first to Email OTP symmetry is explicitly rejected", () => {
  assert.match(authorityDoc, /Google first, then Email OTP/u);
  assert.match(authorityDoc, /Do not assume linking or creation/u);
  assert.match(authorityDoc, /must use Google again/u);
});

check("OTP response is non-enumerating and carries safe guidance", () => {
  const application = text("lib/customer-auth/application.ts");
  assert.match(application, /status:\s*"accepted"/u);
  assert.match(application, /Googleで登録した方はGoogleで続けてください/u);
  assert.doesNotMatch(application, /accountExists|emailSent|providerList/u);
});

check("Auth mutations enforce origin, CSRF, continuation, and rate limits", () => {
  const routes = files()
    .filter((entry) => entry.startsWith("app/api/auth/") && entry.endsWith("route.ts"))
    .map(text)
    .join("\n");
  assert.match(routes, /enforceCustomerAuthSameOrigin/u);
  assert.match(routes, /enforceCustomerAuthRateLimit/u);
  assert.match(routes, /csrfToken/u);
  assert.match(routes, /readAuthContinuationCookie/u);
  const callback = text("app/api/auth/callback/route.ts");
  assert.match(callback, /enforceCustomerAuthRateLimit\("google-callback"/u);
});

check("OAuth callback is server-selected and continuation-bound", () => {
  const callback = text("app/api/auth/callback/route.ts");
  assert.match(callback, /readAuthContinuationCookie/u);
  assert.match(callback, /readAuthCallbackCsrfCookie/u);
  assert.match(callback, /completeGoogleCallback/u);
  assert.match(callback, /redirect\(siteOrigin,/u);
  assert.doesNotMatch(callback, /new URL\(path, request\.url\)/u);
  assert.doesNotMatch(callback, /searchParams\.get\("next"\)/u);
});

check("dual-lane Payment and Grant successors are wired", () => {
  assert.match(migration, /record_rc2_stripe_evidence_v2/u);
  assert.match(migration, /issue_rc2_production_assessment_grant_v2/u);
  assert.match(
    text("lib/payment/production/supabase-repository.ts"),
    /record_rc2_stripe_evidence_v2/u,
  );
  assert.match(
    text("lib/assessment/production/supabase-repository.ts"),
    /issue_rc2_production_assessment_grant_v2/u,
  );
  for (const functionName of [
    "record_rc2_stripe_evidence_v2",
    "issue_rc2_production_assessment_grant_v2",
  ]) {
    const start = migration.indexOf(`create function public.${functionName}`);
    const end = migration.indexOf("$function$;", start);
    const body = migration.slice(start, end);
    assert.match(body, /binding\.state = 'active'/u);
    assert.match(body, /binding\.customer_user_id is not null/u);
  }
});

check("authenticated Checkout and status use fresh server identity", () => {
  assert.match(text("app/api/payments/checkout/route.ts"), /getFreshIdentity/u);
  assert.match(text("app/api/payments/status/route.ts"), /getFreshIdentity/u);
  assert.match(migration, /begin_customer_purchase_intent_v1/u);
  assert.match(migration, /resolve_customer_purchase_status_v1/u);
});

check("account surface exposes only minimal safe history fields", () => {
  const account = text("app/account/page.tsx");
  for (const label of ["日付", "鑑定ノート", "状態", "鑑定ノートを開く"]) {
    assert.match(account, new RegExp(label, "u"));
  }
  assert.doesNotMatch(account, /consultation|partnerMessage|draftMessage|Stripe|capability|resultToken/u);
});

check("legacy bearer and email route surfaces remain retained", () => {
  assertUnchanged([
    "app/result/[token]/page.tsx",
    "app/api/delivery/email-verifications/route.ts",
    "app/api/delivery/email-verifications/verify/route.ts",
  ]);
});

check("R2 cutover blocks legacy verification before any legacy application call", () => {
  assert.match(cutoverSource, /CUSTOMER_AUTH_ENABLED === "true"/u);
  assert.match(cutoverSource, /EMAIL_VERIFICATION_UNAVAILABLE/u);
  assert.match(
    text("app/request/page.tsx"),
    /paymentEnabled && isCustomerAuthCutoverSelected\(\)/u,
  );
  for (const functionName of [
    "startProductionEmailVerification",
    "completeProductionEmailVerification",
  ]) {
    const start = paymentService.indexOf(`export async function ${functionName}`);
    const next = paymentService.indexOf("\nexport async function ", start + 1);
    const body = paymentService.slice(start, next === -1 ? undefined : next);
    const guard = body.indexOf("enforceLegacyCustomerEmailVerificationAllowed();");
    assert.ok(start >= 0 && guard >= 0, `${functionName} cutover guard`);
    assert.ok(
      guard < body.indexOf("isEmailVerificationAvailable()"),
      `${functionName} must guard before availability and repository construction`,
    );
  }
  assertUnchangedFrom(foundationR1Candidate, [
    "app/api/delivery/email-verifications/route.ts",
    "app/api/delivery/email-verifications/verify/route.ts",
    "lib/payment/production/supabase-repository.ts",
  ]);
  const paymentMeasurementDiff = git([
    "diff",
    "--unified=0",
    acceptedFoundationRelease,
    "--",
    "lib/payment/production/application.ts",
  ]);
  const mutations = paymentMeasurementDiff
    .split(/\r?\n/u)
    .filter((line) => /^[+-](?![+-])/u.test(line));
  assert.deepEqual(mutations, [
    '+import { trackVerifiedPaymentPurchase } from "../../measurement/server.ts";',
    "-    return this.options.repository.recordStripeEvidence({",
    "+    const recorded = await this.options.repository.recordStripeEvidence({",
    "+    trackVerifiedPaymentPurchase(recorded);",
    "+    return recorded;",
  ]);
  const paymentApplication = text("lib/payment/production/application.ts");
  const durableRecord = paymentApplication.indexOf(
    "await this.options.repository.recordStripeEvidence",
  );
  const measurementSeam = paymentApplication.indexOf(
    "trackVerifiedPaymentPurchase(recorded)",
  );
  assert.ok(durableRecord >= 0 && measurementSeam > durableRecord);
});

check("R2 docs require one identity regime and a future remote cutover inventory", () => {
  const cutoverDocs = `${authorityDoc}\n${migrationPlan}\n${threatModel}\n${activationRunbook}`;
  assert.match(cutoverDocs, /CUSTOMER_AUTH_ENABLED=false/u);
  assert.match(cutoverDocs, /CUSTOMER_AUTH_ENABLED=true/u);
  assert.match(cutoverDocs, /Auth emergency stop cannot reactivate legacy verification/u);
  assert.match(cutoverDocs, /hard STOP/u);
  for (const table of [
    "production_email_verification_challenges",
    "production_verified_email_authorities",
    "production_trusted_email_sessions",
    "production_preparation_email_bindings",
    "production_purchase_intents",
    "production_verified_payments",
    "production_assessment_grants",
    "production_customer_deliveries",
  ]) {
    assert.match(activationRunbook, new RegExp(table, "u"));
  }
  assert.doesNotMatch(
    threatModel,
    /preserve existing authenticated\/legacy recovery/u,
  );
});

check("accepted migrations 0002 through 0013 are immutable", () => {
  const migrations = files().filter((entry) =>
    /^supabase\/migrations\/(?:000[2-9]|001[0-3])_/u.test(entry),
  );
  assert.equal(migrations.length, 12);
  assertUnchanged(migrations);
});

check("R2 leaves migrations 0002 through 0014 immutable", () => {
  const migrations = files().filter((entry) =>
    /^supabase\/migrations\/(?:000[2-9]|001[0-4])_/u.test(entry),
  );
  assert.equal(migrations.length, 13);
  assertUnchangedFrom(foundationR1Candidate, migrations);
});

check("new tables expose no public or authenticated DML", () => {
  assert.match(
    migration,
    /revoke all privileges on table[\s\S]*from public, anon, authenticated, service_role/u,
  );
  assert.doesNotMatch(
    migration,
    /grant\s+(?:select|insert|update|delete)[\s\S]{0,200}\b(?:anon|authenticated)\b/iu,
  );
  assert.doesNotMatch(migration, /grant[^;]*delete[^;]*service_role/iu);
});

check("0014 is append-only and legacy functions remain present", () => {
  assert.match(migration, /^begin;/u);
  assert.match(migration, /commit;\s*$/u);
  assert.doesNotMatch(migration, /drop table|truncate table/iu);
  assert.match(text("supabase/migrations/0011_rc2_production_payment_delivery.sql"), /begin_rc2_purchase_intent_v1/u);
});

const {
  CustomerIdentityAuthApplicationV1,
} = await import("../lib/customer-auth/application.ts");
const {
  FakeCustomerAuthProviderV1,
  FakeCustomerIdentityRepositoryV1,
} = await import("../lib/customer-auth/fakes.ts");
const {
  hashCustomerAuthContinuation,
  hashCustomerAuthCsrf,
} = await import("../lib/customer-auth/crypto.ts");
const {
  customerIdentityRuntimeRegime,
  enforceLegacyCustomerEmailVerificationAllowed,
} = await import("../lib/customer-auth/cutover.ts");
const { isCustomerAuthFoundationEnabled } = await import(
  "../lib/customer-auth/environment.ts"
);
const { hashOpaqueProductionCapability } = await import(
  "../lib/assessment/production/capabilities.ts"
);

const now = "2026-08-21T00:00:00.000Z";
const preparationCapability = "p".repeat(43);
const csrf = "c".repeat(43);
const continuation = "k".repeat(43);
const customerA = "11111111-1111-4111-8111-111111111111";
const customerB = "22222222-2222-4222-8222-222222222222";
const preparationId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const provider = new FakeCustomerAuthProviderV1();
provider.currentIdentity = {
  customerUserId: customerA,
  verifiedEmail: "customer-a@example.test",
  verifiedEmailSource: "supabase_email_otp",
  authProviders: ["email"],
};
const repository = new FakeCustomerIdentityRepositoryV1();
repository.seedPreparation({
  id: preparationId,
  preparationCapabilityHash: hashOpaqueProductionCapability(preparationCapability),
});
const uuids = [
  "aaaaaaaa-0000-4000-8000-000000000001",
  "aaaaaaaa-0000-4000-8000-000000000002",
  "aaaaaaaa-0000-4000-8000-000000000003",
];
const application = new CustomerIdentityAuthApplicationV1({
  repository,
  provider,
  environment: {
    siteOrigin: "http://localhost:3000",
    continuationTtlSeconds: 600,
    emailHashPepper: "pepper".repeat(8),
    emailEncryptionKey: Buffer.alloc(32, 7).toString("base64"),
    emailKeyVersion: "v1",
  },
  now: () => now,
  uuid: () => uuids.shift(),
  secret: () => continuation,
});

check("Auth OFF preserves legacy and Auth ON selects a non-fallback cutover", () => {
  const previousEnabled = process.env.CUSTOMER_AUTH_ENABLED;
  const previousEmergencyStop = process.env.CUSTOMER_AUTH_EMERGENCY_STOP;
  try {
    process.env.CUSTOMER_AUTH_ENABLED = "false";
    process.env.CUSTOMER_AUTH_EMERGENCY_STOP = "false";
    assert.equal(customerIdentityRuntimeRegime(), "legacy_custom_email");
    assert.doesNotThrow(() => enforceLegacyCustomerEmailVerificationAllowed());

    process.env.CUSTOMER_AUTH_ENABLED = "true";
    assert.equal(customerIdentityRuntimeRegime(), "supabase_customer_auth");
    assert.throws(
      () => enforceLegacyCustomerEmailVerificationAllowed(),
      (error) =>
        error?.safeCode === "EMAIL_VERIFICATION_UNAVAILABLE" &&
        error?.httpStatus === 404,
    );

    process.env.CUSTOMER_AUTH_EMERGENCY_STOP = "true";
    assert.equal(isCustomerAuthFoundationEnabled(), false);
    assert.throws(
      () => enforceLegacyCustomerEmailVerificationAllowed(),
      /EMAIL_VERIFICATION_UNAVAILABLE/u,
    );
  } finally {
    if (previousEnabled === undefined) delete process.env.CUSTOMER_AUTH_ENABLED;
    else process.env.CUSTOMER_AUTH_ENABLED = previousEnabled;
    if (previousEmergencyStop === undefined) {
      delete process.env.CUSTOMER_AUTH_EMERGENCY_STOP;
    } else {
      process.env.CUSTOMER_AUTH_EMERGENCY_STOP = previousEmergencyStop;
    }
  }
});

await checkAsync("fake Email OTP creates a canonical binding", async () => {
  const created = await application.createContinuation({
    preparationCapability,
    csrfToken: csrf,
    flowKind: "email_otp",
  });
  assert.equal(created.continuationToken, continuation);
  const response = await application.requestEmailOtp({
    continuationToken: continuation,
    csrfToken: csrf,
    email: "customer-a@example.test",
  });
  assert.equal(response.status, "accepted");
  const binding = await application.verifyEmailOtp({
    continuationToken: continuation,
    csrfToken: csrf,
    email: "customer-a@example.test",
    otp: "123456",
  });
  assert.equal(binding.customerUserId, customerA);
  assert.equal(binding.preparationId, preparationId);
  assert.equal(provider.requestedEmailCount, 1);
});

await checkAsync("raw continuation and CSRF never enter persistence", async () => {
  const serialized = JSON.stringify([...repository.continuations.values()]);
  assert.equal(serialized.includes(continuation), false);
  assert.equal(serialized.includes(csrf), false);
  assert.match(serialized, new RegExp(hashCustomerAuthContinuation(continuation), "u"));
  assert.match(serialized, new RegExp(hashCustomerAuthCsrf(csrf), "u"));
});

await checkAsync("consumed continuation validation rejects replay", async () => {
  await assert.rejects(
    application.validateContinuation({
      continuationToken: continuation,
      csrfToken: csrf,
      flowKind: "email_otp",
    }),
    /CUSTOMER_AUTH_CONTINUATION_INVALID/u,
  );
});

await checkAsync("same-Customer bind replay is idempotent", async () => {
  const binding = await repository.bindPreparation({
    bindingId: "aaaaaaaa-0000-4000-8000-000000000099",
    ownershipReferenceId: "aaaaaaaa-0000-4000-8000-000000000098",
    continuationTokenHash: hashCustomerAuthContinuation(continuation),
    csrfTokenHash: hashCustomerAuthCsrf(csrf),
    customerUserId: customerA,
    deliveryEmailHash: "a".repeat(64),
    deliveryEmailCiphertext: "ciphertext",
    deliveryEmailKeyVersion: "v1",
    deliveryEmailVerifiedSource: "supabase_email_otp",
    deliveryEmailVerifiedAt: now,
    now,
  });
  assert.equal(binding.customerUserId, customerA);
});

await checkAsync("different-Customer bind replay is denied", async () => {
  await assert.rejects(
    repository.bindPreparation({
      bindingId: "bbbbbbbb-0000-4000-8000-000000000099",
      ownershipReferenceId: "bbbbbbbb-0000-4000-8000-000000000098",
      continuationTokenHash: hashCustomerAuthContinuation(continuation),
      csrfTokenHash: hashCustomerAuthCsrf(csrf),
      customerUserId: customerB,
      deliveryEmailHash: "b".repeat(64),
      deliveryEmailCiphertext: "ciphertext",
      deliveryEmailKeyVersion: "v1",
      deliveryEmailVerifiedSource: "supabase_email_otp",
      deliveryEmailVerifiedAt: now,
      now,
    }),
    /CUSTOMER_AUTH_BINDING_CONFLICT/u,
  );
});

await checkAsync("cross-Customer history is denied", async () => {
  repository.history.set(customerA, [
    {
      purchaseIntentId: "cccccccc-0000-4000-8000-000000000001",
      deliveryId: null,
      date: now,
      state: "processing",
    },
  ]);
  provider.currentIdentity = {
    customerUserId: customerB,
    verifiedEmail: "customer-b@example.test",
    verifiedEmailSource: "google_verified_identity",
    authProviders: ["google"],
  };
  assert.deepEqual(await application.listAccountHistory(), []);
});

await checkAsync("detached Customer access is denied", async () => {
  await repository.detachIdentity({
    customerUserId: customerA,
    requestId: "dddddddd-0000-4000-8000-000000000001",
    now,
  });
  assert.deepEqual(await repository.listAccountHistory(customerA), []);
});

await checkAsync("continuation expiry and CSRF mismatch are denied", async () => {
  let clock = "2026-08-21T00:00:00.000Z";
  const expiryRepository = new FakeCustomerIdentityRepositoryV1();
  const expiryProvider = new FakeCustomerAuthProviderV1();
  expiryRepository.seedPreparation({
    id: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
    preparationCapabilityHash: hashOpaqueProductionCapability("e".repeat(43)),
  });
  const expiryApplication = new CustomerIdentityAuthApplicationV1({
    repository: expiryRepository,
    provider: expiryProvider,
    environment: {
      siteOrigin: "http://localhost:3000",
      continuationTtlSeconds: 60,
      emailHashPepper: "pepper".repeat(8),
      emailEncryptionKey: Buffer.alloc(32, 8).toString("base64"),
      emailKeyVersion: "v1",
    },
    now: () => clock,
    uuid: () => "eeeeeeee-0000-4000-8000-000000000001",
    secret: () => "e".repeat(43),
  });
  await expiryApplication.createContinuation({
    preparationCapability: "e".repeat(43),
    csrfToken: "f".repeat(43),
    flowKind: "email_otp",
  });
  await assert.rejects(
    expiryApplication.validateContinuation({
      continuationToken: "e".repeat(43),
      csrfToken: "x".repeat(43),
      flowKind: "email_otp",
    }),
    /CUSTOMER_AUTH_CONTINUATION_INVALID/u,
  );
  clock = "2026-08-21T00:01:00.000Z";
  await assert.rejects(
    expiryApplication.validateContinuation({
      continuationToken: "e".repeat(43),
      csrfToken: "f".repeat(43),
      flowKind: "email_otp",
    }),
    /CUSTOMER_AUTH_CONTINUATION_INVALID/u,
  );
});

await checkAsync("concurrent different-Customer binding has one winner", async () => {
  const concurrencyRepository = new FakeCustomerIdentityRepositoryV1();
  const capability = "g".repeat(43);
  const token = "h".repeat(43);
  const csrfToken = "i".repeat(43);
  concurrencyRepository.seedPreparation({
    id: "ffffffff-ffff-4fff-8fff-ffffffffffff",
    preparationCapabilityHash: hashOpaqueProductionCapability(capability),
  });
  await concurrencyRepository.createContinuation({
    id: "ffffffff-0000-4000-8000-000000000001",
    preparationCapabilityHash: hashOpaqueProductionCapability(capability),
    continuationTokenHash: hashCustomerAuthContinuation(token),
    csrfTokenHash: hashCustomerAuthCsrf(csrfToken),
    flowKind: "google",
    expiresAt: "2026-08-21T00:10:00.000Z",
    now,
  });
  const bind = (customerUserId, suffix) =>
    concurrencyRepository.bindPreparation({
      bindingId: `ffffffff-0000-4000-8000-0000000000${suffix}`,
      ownershipReferenceId: `eeeeeeee-0000-4000-8000-0000000000${suffix}`,
      continuationTokenHash: hashCustomerAuthContinuation(token),
      csrfTokenHash: hashCustomerAuthCsrf(csrfToken),
      customerUserId,
      deliveryEmailHash: suffix.repeat(64),
      deliveryEmailCiphertext: "ciphertext-for-concurrency",
      deliveryEmailKeyVersion: "v1",
      deliveryEmailVerifiedSource: "google_verified_identity",
      deliveryEmailVerifiedAt: now,
      now,
    });
  const outcomes = await Promise.allSettled([
    bind(customerA, "1"),
    bind(customerB, "2"),
  ]);
  assert.equal(outcomes.filter(({ status }) => status === "fulfilled").length, 1);
  assert.equal(outcomes.filter(({ status }) => status === "rejected").length, 1);
  assert.match(
    String(outcomes.find(({ status }) => status === "rejected")?.reason),
    /CUSTOMER_AUTH_BINDING_CONFLICT/u,
  );
});

await checkAsync("Google initiation and callback bind through the fake seam", async () => {
  const googleRepository = new FakeCustomerIdentityRepositoryV1();
  const googleProvider = new FakeCustomerAuthProviderV1();
  googleProvider.currentIdentity = {
    customerUserId: customerB,
    verifiedEmail: "customer-b@example.test",
    verifiedEmailSource: "google_verified_identity",
    authProviders: ["google"],
  };
  const capability = "j".repeat(43);
  const token = "k".repeat(43);
  const csrfToken = "l".repeat(43);
  googleRepository.seedPreparation({
    id: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
    preparationCapabilityHash: hashOpaqueProductionCapability(capability),
  });
  const googleUuids = [
    "dddddddd-0000-4000-8000-000000000001",
    "dddddddd-0000-4000-8000-000000000002",
    "dddddddd-0000-4000-8000-000000000003",
  ];
  const googleApplication = new CustomerIdentityAuthApplicationV1({
    repository: googleRepository,
    provider: googleProvider,
    environment: {
      siteOrigin: "http://localhost:3000",
      continuationTtlSeconds: 600,
      emailHashPepper: "pepper".repeat(8),
      emailEncryptionKey: Buffer.alloc(32, 9).toString("base64"),
      emailKeyVersion: "v1",
    },
    now: () => now,
    uuid: () => googleUuids.shift(),
    secret: () => token,
  });
  await googleApplication.createContinuation({
    preparationCapability: capability,
    csrfToken,
    flowKind: "google",
  });
  const started = await googleApplication.startGoogle({
    continuationToken: token,
    csrfToken,
  });
  assert.equal(started.authorizationUrl, googleProvider.googleAuthorizationUrl);
  const binding = await googleApplication.completeGoogleCallback({
    continuationToken: token,
    csrfToken,
    code: "fake-google-callback-code",
  });
  assert.equal(binding.customerUserId, customerB);
  assert.equal(googleProvider.googleStartCount, 1);
  assert.equal(googleProvider.callbackExchangeCount, 1);
});

await checkAsync("fake result lookup is Customer-owned and detach-aware", async () => {
  const resultRepository = new FakeCustomerIdentityRepositoryV1();
  resultRepository.bindings.set("prep-result", {
    id: "cccccccc-0000-4000-8000-000000000001",
    preparationId: "prep-result",
    customerUserId: customerA,
    state: "active",
  });
  const deliveryId = "cccccccc-0000-4000-8000-000000000002";
  resultRepository.seedResult(customerA, {
    deliveryId,
    projection: {},
  });
  assert.equal(
    await resultRepository.resolveOwnedResult({
      customerUserId: customerB,
      deliveryId,
    }),
    null,
  );
  assert.notEqual(
    await resultRepository.resolveOwnedResult({
      customerUserId: customerA,
      deliveryId,
    }),
    null,
  );
  await resultRepository.detachIdentity({
    customerUserId: customerA,
    requestId: "cccccccc-0000-4000-8000-000000000003",
    now,
  });
  assert.equal(
    await resultRepository.resolveOwnedResult({
      customerUserId: customerA,
      deliveryId,
    }),
    null,
  );
});

console.log(`Customer Auth Foundation verifier: ${passed}/${passed} PASS`);
