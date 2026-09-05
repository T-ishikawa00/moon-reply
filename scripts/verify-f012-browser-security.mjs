import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { getPathMatch } from "next/dist/shared/lib/router/utils/path-match.js";

const root = process.cwd();
const text = (file) => readFileSync(path.join(root, file), "utf8");
let externalCalls = 0;
globalThis.fetch = async () => {
  externalCalls += 1;
  throw new Error("F012_EXTERNAL_CALL_FORBIDDEN");
};
let passed = 0;
function check(name, run) {
  run();
  console.log(`PASS F012 ${++passed} ${name}`);
}

async function loadHeaders(environment) {
  const previous = process.env.NODE_ENV;
  try {
    process.env.NODE_ENV = environment;
    const url = pathToFileURL(path.join(root, "next.config.ts"));
    url.searchParams.set("f012", environment);
    const { default: config } = await import(url.href);
    return await config.headers();
  } finally {
    if (previous === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previous;
  }
}

const production = await loadHeaders("production");
const development = await loadHeaders("development");
const test = await loadHeaders("test");
const headersFor = (rules, pathname) => {
  const headers = new Headers();
  for (const rule of rules) {
    // Use the installed Next matcher, including zero-segment :path* behavior.
    if (getPathMatch(rule.source)(pathname) !== false) {
      for (const { key, value } of rule.headers) headers.set(key, value);
    }
  }
  return headers;
};
const parsePolicy = (policy) => {
  const entries = policy.split(";").filter((item) => item.trim()).map((item) => {
    const [directive, ...sources] = item.trim().split(/\s+/u);
    return [directive, sources];
  });
  assert.equal(new Set(entries.map(([directive]) => directive)).size, entries.length);
  return Object.fromEntries(entries);
};
const common = headersFor(production, "/");
const enforced = parsePolicy(common.get("Content-Security-Policy"));
const reportOnly = parsePolicy(common.get("Content-Security-Policy-Report-Only"));

check("enforcement is limited to frame, object, and base protection", () => {
  assert.deepEqual(enforced, {
    "frame-ancestors": ["'none'"],
    "object-src": ["'none'"],
    "base-uri": ["'self'"],
  });
  assert.equal(common.get("X-Frame-Options"), "DENY");
  assert.equal(common.get("X-Content-Type-Options"), "nosniff");
  assert.equal(common.get("Referrer-Policy"), "strict-origin-when-cross-origin");
});

check("resource restrictions are only Report-Only with the exact source inventory", () => {
  assert.deepEqual(reportOnly, {
    "default-src": ["'self'"],
    "script-src": ["'self'", "'unsafe-inline'", "https://www.googletagmanager.com"],
    "connect-src": ["'self'", "https://*.google-analytics.com", "https://*.analytics.google.com", "https://www.googletagmanager.com"],
    "img-src": ["'self'", "data:", "https://*.google-analytics.com", "https://www.googletagmanager.com"],
    "style-src": ["'self'", "'unsafe-inline'"],
    "font-src": ["'self'"],
    "frame-src": ["'none'"],
    "form-action": ["'self'"],
    "object-src": ["'none'"],
    "base-uri": ["'self'"],
  });
});

check("only explicit development gets eval and websocket allowances", () => {
  assert.deepEqual(test, production);
  const devHeaders = headersFor(development, "/");
  const devPolicy = parsePolicy(devHeaders.get("Content-Security-Policy-Report-Only"));
  assert.deepEqual(devPolicy, {
    ...reportOnly,
    "script-src": [...reportOnly["script-src"], "'unsafe-eval'"],
    "connect-src": [...reportOnly["connect-src"], "ws:", "wss:"],
  });
  assert.equal(devHeaders.get("Content-Security-Policy"), common.get("Content-Security-Policy"));
  assert.doesNotMatch(common.get("Content-Security-Policy-Report-Only"), /unsafe-eval|(?:^|\s)wss?:/u);
});

check("global headers cover homepage, login, Auth, checkout, Account, Result, and review routes", () => {
  assert.deepEqual(production.map(({ source }) => source), ["/:path*", "/result/:path*", "/account/:path*"]);
  for (const pathname of [
    "/", "/login", "/request", "/api/auth/google/start",
    "/api/auth/account/google/start", "/api/auth/callback", "/api/auth/account/callback",
    "/api/payments/checkout", "/purchase/auth/continue", "/purchase/return/test-capability",
    "/account", "/account/results/test-delivery", "/result/test-token",
    "/review/account", "/review/purchase", "/review/result", "/review/request",
  ]) {
    const headers = headersFor(production, pathname);
    for (const name of ["Content-Security-Policy", "Content-Security-Policy-Report-Only", "X-Frame-Options", "X-Content-Type-Options", "Permissions-Policy"]) {
      assert.equal(headers.get(name), common.get(name), `${pathname}: ${name}`);
    }
  }
});

check("Result and Account privacy rules remain exact and override the global referrer value", () => {
  assert.deepEqual(production.slice(1), [
    { source: "/result/:path*", headers: [
      { key: "Cache-Control", value: "private, no-store, max-age=0" },
      { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
      { key: "Referrer-Policy", value: "no-referrer" },
    ] },
    { source: "/account/:path*", headers: [
      { key: "Cache-Control", value: "private, no-store, max-age=0" },
      { key: "Vary", value: "Cookie" },
      { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
      { key: "Referrer-Policy", value: "no-referrer" },
    ] },
  ]);
  for (const pathname of ["/result", "/result/test-token", "/account", "/account/results/test-delivery"]) {
    const headers = headersFor(production, pathname);
    assert.equal(headers.get("Referrer-Policy"), "no-referrer", pathname);
    assert.equal(headers.get("Cache-Control"), "private, no-store, max-age=0", pathname);
    assert.equal(headers.get("X-Robots-Tag"), "noindex, nofollow, noarchive", pathname);
    if (pathname.startsWith("/account")) assert.equal(headers.get("Vary"), "Cookie");
  }
  assert.equal(headersFor(production, "/accounting").get("Referrer-Policy"), "strict-origin-when-cross-origin");
});

check("sensitive API and callback responses keep their stronger referrer protection", () => {
  for (const file of [
    "lib/customer-auth/route-response.ts", "app/api/payments/checkout/route.ts",
    "app/api/auth/callback/route.ts", "app/api/auth/account/callback/route.ts",
  ]) assert.match(text(file), /["']Referrer-Policy["'][,:]\s*["']no-referrer["']/u, file);
});

check("Permissions-Policy disables unused capture APIs and preserves customer draft copy", () => {
  assert.equal(common.get("Permissions-Policy"), "camera=(), microphone=(), geolocation=(), browsing-topics=()");
  assert.doesNotMatch(common.get("Permissions-Policy"), /clipboard|payment/u);
  assert.match(text("components/runtime/CustomerDraftCopyButton.tsx"), /navigator\.clipboard\.writeText\(text\)/u);
});

check("Google Auth uses same-origin API and top-level navigation without an embedded SDK", () => {
  const account = text("components/auth/AccountLoginPanel.tsx");
  assert.match(account, /fetch\("\/api\/auth\/account\/google\/start"/u);
  assert.match(account, /window\.location\.assign\(destination\.toString\(\)\)/u);
  const purchase = text("components/request/RequestForm.tsx");
  assert.match(purchase, /fetch\("\/api\/auth\/google\/start"/u);
  assert.match(purchase, /window\.location\.assign\(authorizationUrl\.toString\(\)\)/u);
  assert.doesNotMatch(`${account}\n${purchase}`, /<iframe|accounts\.google\.com\/gsi|createBrowserClient/u);
  assert.match(text("lib/supabase/server.ts"), /^import "server-only";/u);
});

check("all Stripe entry paths fetch locally then validate and navigate to hosted Checkout", () => {
  for (const file of [
    "components/payment/AuthenticatedCheckoutButton.tsx",
    "components/payment/PurchaseReturnStatus.tsx", "components/request/RequestForm.tsx",
  ]) {
    const source = text(file);
    assert.match(source, /fetch\("\/api\/payments\/checkout"/u, file);
    assert.match(source, /checkoutUrl\.origin !== "https:\/\/checkout\.stripe\.com"/u, file);
    assert.match(source, /window\.location\.assign\(checkoutUrl\.toString\(\)\)/u, file);
    assert.doesNotMatch(source, /<iframe|loadStripe|@stripe\/stripe-js|js\.stripe\.com/u, file);
  }
  assert.equal(enforced["form-action"], undefined);
  assert.equal(enforced["frame-src"], undefined);
});

check("GA4 bootstrap retains its exact origin and privacy settings without enabling telemetry", () => {
  const bootstrap = text("components/measurement/MeasurementBootstrap.tsx");
  assert.match(bootstrap, /https:\/\/www\.googletagmanager\.com\/gtag\/js\?id=/u);
  assert.match(bootstrap, /strategy="afterInteractive"/u);
  for (const key of ["send_page_view", "allow_google_signals", "allow_ad_personalization_signals"]) {
    assert.match(bootstrap, new RegExp(`${key}: false`, "u"));
  }
  assert.match(bootstrap, /ignore_referrer: true/u);
  assert.match(text("app/layout.tsx"), /measurement \? \([\s\S]*?<MeasurementBootstrap/u);
  assert.match(text("lib/measurement/config.ts"), /MEASUREMENT_ENABLED !== "true"\) return null/u);
});

check("Next inline runtime, JSON-LD, local fonts, and review inline styles remain compatible", () => {
  assert.ok(reportOnly["script-src"].includes("'unsafe-inline'"));
  assert.ok(reportOnly["style-src"].includes("'unsafe-inline'"));
  assert.match(text("app/page.tsx"), /type="application\/ld\+json"/u);
  assert.match(text("components/review/BrandFoundationPreview.tsx"), /style=\{/u);
  assert.doesNotMatch(text("app/globals.css"), /@font-face|fonts\.googleapis\.com|fonts\.gstatic\.com/u);
  assert.doesNotMatch(text("app/layout.tsx"), /next\/font|x-nonce|headers\(\)|connection\(\)/u);
});

check("no report sink, enforced resource switch, or duplicate source HSTS policy is introduced", () => {
  for (const rules of [production, development, test]) {
    for (const rule of rules) {
      assert.equal(new Set(rule.headers.map(({ key }) => key.toLowerCase())).size, rule.headers.length);
      for (const { key, value } of rule.headers) {
        assert.doesNotMatch(key, /^(?:Reporting-Endpoints|Report-To|Strict-Transport-Security)$/iu);
        assert.doesNotMatch(value, /report-uri|report-to|report-sample|upgrade-insecure-requests|sandbox/u);
      }
    }
  }
  for (const file of ["netlify.toml", "_headers", "public/_headers"]) {
    if (existsSync(path.join(root, file))) {
      assert.doesNotMatch(text(file), /Content-Security-Policy|X-Frame-Options|Strict-Transport-Security/iu, file);
    }
  }
});

check("source/config verification performs zero external requests", () => {
  assert.equal(externalCalls, 0);
});
console.log(`F012 browser security source/config verification: ${passed}/${passed} PASS`);
console.log("BUILT_HTTP_SMOKE=SEPARATE; PRODUCTION_HEADER_COMPOSITION=UNKNOWN; EXTERNAL_WRITES=0");
