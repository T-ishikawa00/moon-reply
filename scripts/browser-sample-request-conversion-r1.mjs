import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { createOfflineRuntime } from "./remediation-offline-runtime.mjs";

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE ?? "C:/Users/PUBLIC_USER/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");
const root = "evals/sample-request-conversion-r1";
mkdirSync(`${root}/screenshots`, { recursive: true });
const runtime = createOfflineRuntime();
// Next dev checks its npm version when the overlay connects. Supply only that
// exact non-product lookup locally; every other destination remains guarded.
const toolingStub = join(mkdtempSync(join(tmpdir(), "conversion-tooling-")), "version-stub.mjs");
writeFileSync(toolingStub, `const guardedFetch = globalThis.fetch;
globalThis.fetch = function(input, init) {
  const url = String(typeof input === 'string' || input instanceof URL ? input : input.url);
  if (url === 'https://registry.npmjs.org/-/package/next/dist-tags') return Promise.resolve(new Response('', {status:503}));
  return guardedFetch(input, init);
};`);
runtime.env.NODE_OPTIONS += ` --import=${pathToFileURL(toolingStub).href}`;
const origin = "http://localhost:3101";
Object.assign(runtime.env, {
  NODE_ENV: "development", NEXT_PUBLIC_APP_URL: origin,
  MEASUREMENT_ENABLED: "true", MEASUREMENT_DESTINATION_ENV: "test",
  PAYMENT_PROVIDER_ENVIRONMENT: "test", GA4_MEASUREMENT_ID: "G-LOCALONLY1",
  GA4_API_SECRET: "local-recording-only-no-secret",
  MEASUREMENT_TRANSACTION_SECRET: "local-recording-only-not-a-production-secret",
});
// Only synthetic test configuration. Browser routing below supplies a local
// recording implementation before ANY Google resource can reach the network.
const server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "dev", "--hostname", "127.0.0.1", "--port", "3101"], { env: runtime.env, stdio: ["ignore", "pipe", "pipe"], windowsHide: true });
let serverLog = "";
server.stdout.on("data", (chunk) => { serverLog += chunk; });
server.stderr.on("data", (chunk) => { serverLog += chunk; });
const checks = [];
const records = [];
const blocked = [];
const errors = [];
let browser;
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const check = (label, value) => { assert.ok(value, label); checks.push(label); console.log(`PASS ${label}`); };
try {
  for (let i = 0; i < 90; i++) {
    if (serverLog.includes("Ready in")) break;
    if (server.exitCode !== null) throw new Error(serverLog);
    await delay(500);
  }
  browser = await chromium.launch({ headless: true, channel: "chrome" });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, reducedMotion: "reduce" });
  await context.exposeBinding("recordLocalMeasurement", (_, command) => records.push(command));
  await context.addInitScript(() => { window.__localMeasurements = []; });
  await context.route("**/*", async (route) => {
    const url = new URL(route.request().url());
    if (url.hostname === "www.googletagmanager.com" && url.pathname === "/gtag/js") {
      return route.fulfill({ contentType: "application/javascript", body: `
        (() => {
          const record = args => {
            const command = Array.from(args);
            window.__localMeasurements.push(command);
            window.recordLocalMeasurement(command);
            if (window.__failRecording && command[0] === 'event') throw new Error('LOCAL_TRANSPORT_FAILURE');
          };
          const queue = window.dataLayer = window.dataLayer || [];
          queue.forEach(record);
          queue.push = function(...commands) { commands.forEach(record); return 0; };
        })();` });
    }
    if (url.origin === origin) return route.continue();
    blocked.push(`${url.origin}${url.pathname}`);
    return route.abort();
  });
  const page = await context.newPage();
  page.on("pageerror", (error) => errors.push(error.message));
  const events = (name) => records.filter((command) => command[0] === "event" && command[1] === name);
  const shot = (name) => page.screenshot({ path: `${root}/screenshots/${name}.png`, animations: "disabled", style: "nextjs-portal { display: none !important; }" });
  const noOverflow = () => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
  await page.goto(`${origin}/sample-report?utm_source=youtube&utm_medium=video&utm_campaign=local_r1`, { waitUntil: "networkidle" });
  await page.locator('[data-sample-cta="hero"]').waitFor();
  await page.waitForFunction(() => window.__localMeasurements.some((c) => c[1] === "sample_view"));
  check("WAIT is default", (await page.locator(".public-sample-note").innerText()).includes("忙しい？"));
  writeFileSync(`${root}/wait-full-text.md`, `# WAIT — 架空の編集見本\n\n${await page.locator(".public-sample-note").innerText()}\n`);
  check("mobile no horizontal overflow", await noOverflow());
  await shot("mobile-hero-wait");
  await page.locator('[data-sample-summary]').scrollIntoViewIfNeeded();
  await delay(300);
  await shot("mobile-wait-summary-sticky");
  await page.locator('[data-sample-case="send"]').click();
  check("SEND full note visible", (await page.locator(".public-sample-note").innerText()).includes("ありがとう。金曜なら空いてるよ。19時ごろどうかな？"));
  writeFileSync(`${root}/send-full-text.md`, `# SEND — 既存の架空全文見本\n\n${await page.locator(".public-sample-note").innerText()}\n`);
  await shot("mobile-send-summary");
  check("case change does not repeat sample_view", events("sample_view").length === 1);
  await page.locator(".public-sample-note__cover").scrollIntoViewIfNeeded();
  await shot("mobile-send-note");
  await page.locator('[data-sample-case="wait"]').click();
  await page.locator(".public-sample-note__cover").scrollIntoViewIfNeeded();
  await shot("mobile-wait-note");
  await page.locator('[data-sample-end]').scrollIntoViewIfNeeded();
  await delay(250);
  check("brief end exposure not counted", events("sample_end_view").length === 0);
  await page.locator('[data-sample-summary]').scrollIntoViewIfNeeded();
  await delay(1100);
  check("end dwell resets offscreen", events("sample_end_view").length === 0);
  await page.locator('[data-sample-end]').scrollIntoViewIfNeeded();
  await delay(1400);
  check("visible end records once", events("sample_end_view").length === 1);
  await page.locator('[data-sample-cta="closing"]').scrollIntoViewIfNeeded();
  await delay(250);
  check("sticky hidden while closing visible", await page.locator('[data-sample-cta="sticky"]').evaluate((el) => !el.checkVisibility()));
  await shot("mobile-closing");
  await page.locator('[data-sample-summary]').scrollIntoViewIfNeeded();
  await page.locator('[data-sample-case="send"]').click();
  await page.locator('[data-sample-end]').scrollIntoViewIfNeeded();
  await delay(1250);
  check("end observer/case redisplay deduplicated", events("sample_end_view").length === 1);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.evaluate(() => window.scrollTo(0, 0));
  await shot("desktop-hero-send");
  await page.locator('[data-sample-summary]').scrollIntoViewIfNeeded();
  await shot("desktop-send-summary");
  await page.locator('[data-sample-case="wait"]').click();
  await shot("desktop-wait-summary");
  await page.locator(".public-sample-note__cover").scrollIntoViewIfNeeded();
  await shot("desktop-wait-note");
  await page.locator('[data-sample-case="send"]').click();
  await page.locator(".public-sample-note__cover").scrollIntoViewIfNeeded();
  await shot("desktop-send-note");
  check("desktop no horizontal overflow", await noOverflow());
  await page.setViewportSize({ width: 844, height: 390 });
  await page.locator('[data-sample-summary]').scrollIntoViewIfNeeded();
  await shot("landscape-sample");
  check("landscape no overflow", await noOverflow());
  check("landscape CTA returns to normal flow", await page.locator('[data-sample-sticky-fallback]').isVisible() && await page.locator('[data-sample-sticky-fallback]').evaluate((el) => getComputedStyle(el).position !== "fixed"));
  await page.setViewportSize({ width: 320, height: 600 });
  await page.evaluate(() => document.documentElement.style.fontSize = "200%");
  await shot("zoom-sample");
  check("200 percent text no overflow", await noOverflow());
  check("compact enlarged view has no fixed CTA", await page.locator('[data-sample-cta="sticky"]').evaluate((el) => !el.checkVisibility()));
  await page.evaluate(() => document.documentElement.style.fontSize = "");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator('[data-sample-cta="closing"]').scrollIntoViewIfNeeded();
  await page.locator('[data-sample-cta="closing"]').click();
  await page.waitForURL("**/request");
  await page.waitForFunction(() => window.__localMeasurements.some((c) => c[1] === "request_view"));
  check("CTA dispatched closing placement", events("sample_cta_click").length === 1 && events("sample_cta_click")[0][2].placement === "closing");
  check("request_view before first change", events("request_view").length === 1 && events("request_start").length === 0);
  check("no sample prefilling", await page.locator("#currentSituation").inputValue() === "");
  check("no sticky CTA on request", await page.locator('[data-sample-cta="sticky"]').count() === 0);
  await shot("mobile-request-intro");
  await page.locator("#request-phase-1").scrollIntoViewIfNeeded();
  await shot("mobile-request-first-operation");
  await page.getByRole("button", { name: "鑑定前の確認へ", exact: true }).click();
  await page.waitForTimeout(100);
  check("required validation and focus retained", await page.locator(".request-error-summary").isVisible() && await page.evaluate(() => document.activeElement.id === "adultConfirmed"));
  await page.getByRole("checkbox", { name: "私は18歳以上です" }).check();
  check("adult checkbox records request_start", events("request_start").length === 1);
  await page.getByRole("radio", { name: "付き合う前", exact: true }).check();
  await page.getByRole("checkbox", { name: "送るか待つか決めたい", exact: true }).check();
  const situation = page.locator("#currentSituation");
  const initialHeight = await situation.evaluate((el) => el.getBoundingClientRect().height);
  await situation.fill("架空のローカル確認です。最近知り合った相手への連絡を迷っています。\n".repeat(25));
  check("textarea expands with long content", await situation.evaluate((el) => el.getBoundingClientRect().height) > initialHeight);
  await page.setViewportSize({ width: 320, height: 600 });
  await delay(150);
  check("textarea remains unclipped after viewport narrowing", await situation.evaluate((el) => el.scrollHeight <= el.clientHeight + 1));
  await page.setViewportSize({ width: 390, height: 844 });
  await situation.fill("架空のローカル確認です。最近知り合った相手への連絡を迷っています。");
  await situation.scrollIntoViewIfNeeded();
  await shot("mobile-request-input");
  await page.getByRole("button", { name: "鑑定前の確認へ", exact: true }).click();
  check("same existing phase two reached", await page.locator("#request-phase-2").isVisible());
  await page.getByRole("button", { name: "相談内容へ戻る", exact: true }).click();
  check("back preserves text", (await situation.inputValue()).includes("架空のローカル確認"));
  check("return and changes don't repeat view/start", events("request_view").length === 1 && events("request_start").length === 1);
  await page.getByRole("checkbox", { name: "送るか待つか決めたい", exact: true }).uncheck();
  await page.getByRole("checkbox", { name: /この文面/ }).check();
  check("conditional original opens and is required", await page.locator("#draftMessage").isVisible() && await page.locator("#draftMessage").getAttribute("aria-required") === "true");
  await page.getByRole("button", { name: "鑑定前の確認へ", exact: true }).click();
  check("missing original stays on input", await page.locator("#request-phase-1").isVisible());
  await page.locator("#draftMessage").fill("これはテスト専用の架空文面です。");
  await page.getByRole("button", { name: "鑑定前の確認へ", exact: true }).click();
  check("conditional original allows existing next step", await page.locator("#request-phase-2").isVisible());
  await page.getByRole("button", { name: "相談内容へ戻る", exact: true }).click();
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.evaluate(() => window.scrollTo(0, 0));
  await shot("desktop-request-intro");
  await page.locator("#request-phase-1").scrollIntoViewIfNeeded();
  await shot("desktop-request-input");
  const funnel = records.filter((c) => c[0] === "event" && ["sample_view", "sample_cta_click", "request_view", "request_start"].includes(c[1]));
  check("funnel session preserved", new Set(funnel.map((c) => c[2].session_id)).size === 1);
  const serialized = JSON.stringify(records);
  check("free text and URL not in event payloads", !/架空のローカル確認|テスト専用の架空文面|currentSituation|draftMessage|resultToken|purchaseId/.test(serialized));
  check("no automatic page_view/purchase/checkout", !records.some((c) => c[0] === "event" && ["page_view", "purchase", "begin_checkout"].includes(c[1])));
  const originalSession = funnel[0][2].session_id;
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${origin}/sample-report`, { waitUntil: "networkidle" });
  const ctaBefore = events("sample_cta_click").length;
  await page.locator('[data-sample-cta="hero"]').scrollIntoViewIfNeeded();
  await delay(200);
  check("sticky hidden when hero visible", await page.locator('[data-sample-cta="sticky"]').evaluate((el) => !el.checkVisibility()));
  await page.locator('[data-sample-cta="hero"]').evaluate((el) => { el.click(); el.click(); });
  await page.waitForURL("**/request");
  await delay(250);
  check("rapid hero clicks deduplicated per transition", events("sample_cta_click").length === ctaBefore + 1 && events("sample_cta_click").at(-1)[2].placement === "hero");
  await page.goto(`${origin}/sample-report`, { waitUntil: "networkidle" });
  await page.locator('[data-sample-summary]').scrollIntoViewIfNeeded();
  await page.locator('[data-sample-cta="sticky"]').waitFor({ state: "visible" });
  await shot("mobile-sticky-cta");
  await page.locator('[data-sample-case="wait"]').focus();
  await page.keyboard.press("Tab");
  check("keyboard focus is not covered by fixed CTA", await page.locator('[data-sample-cta="sticky"]').evaluate((el) => !el.checkVisibility()));
  await page.evaluate(() => document.activeElement.blur());
  await page.locator('body > footer').scrollIntoViewIfNeeded();
  await delay(150);
  check("footer not covered by fixed CTA", await page.locator('[data-sample-cta="sticky"]').evaluate((el) => !el.checkVisibility()));
  await page.locator('[data-sample-summary]').scrollIntoViewIfNeeded();
  await page.locator('[data-sample-cta="sticky"]').waitFor({ state: "visible" });
  // Transport exception must not stop a real Link transition or first change.
  await page.evaluate(() => window.__failRecording = true);
  await page.locator('[data-sample-cta="sticky"]').click();
  await page.waitForURL("**/request");
  await page.getByRole("checkbox", { name: "私は18歳以上です" }).check();
  check("transport failure preserves navigation and input", await page.getByRole("checkbox", { name: "私は18歳以上です" }).isChecked());
  check("sticky click reaches actual adapter", events("sample_cta_click").at(-1)[2].placement === "sticky");
  check("revisits preserve original attribution/session", events("sample_cta_click").every((c) => c[2].session_id === originalSession) && records.filter((c) => c[0] === "event" && c[1] === "landing_view").every((c) => c[2].source === "youtube"));
  await page.goto(`${origin}/sample-report`, { waitUntil: "networkidle" });
  const viewBeforeHash = events("request_view").length;
  await page.goto(`${origin}/request#safety`, { waitUntil: "networkidle" });
  check("hash restore skips initial request_view", events("request_view").length === viewBeforeHash && await page.locator("#request-phase-2").isVisible());
  await page.getByRole("button", { name: "相談内容へ戻る", exact: true }).click();
  await delay(200);
  check("return to input after hash restore records once", events("request_view").length === viewBeforeHash + 1);
  check("no forbidden external requests", blocked.length === 0);
  check("browser has no runtime errors", errors.length === 0);
  writeFileSync(`${root}/browser-results.json`, JSON.stringify({ status: "PASS", checks, records, externalRequests: blocked, errors, physicalDevices: "NOT_TESTED" }, null, 2));
} catch (error) {
  console.error(error);
  throw error;
} finally {
  await browser?.close();
  server.kill();
  await delay(700);
  writeFileSync(`${root}/browser-server.txt`, serverLog);
  writeFileSync(`${root}/browser-progress.json`, JSON.stringify({ checks, records, blocked, errors }, null, 2));
  runtime.assertNoExternalAttempts();
}
