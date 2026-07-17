import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";

const baseUrl = process.env.BASE_URL ?? "http://127.0.0.1:3010";
const outputRoot = path.resolve("qa-artifacts");

const routes = [
  "/",
  "/request",
  "/review",
  "/review/request/normal-allowed",
  "/review/request/needs-review",
  "/review/request/rejected",
  "/review/request/contradictory-selection",
  "/review/request/invalid-age",
  "/review/request/missing-consent",
  "/review/request/unknown-error",
  "/review/request/confirmation/normal-001",
  "/review/purchase/confirmation/normal-001",
  "/sample-report",
  "/review/result/result-normal-001",
  "/review/save-report/result-normal-001",
  "/review/error/missing-fixture",
  "/review/error/unavailable-report",
  "/legal",
  "/legal/terms",
  "/legal/privacy",
  "/legal/tokushoho",
  "/legal/refund",
  "/legal/ai-disclosure",
  "/legal/unsupported-cases",
  "/contact",
  "/review/request/not-allowlisted",
  "/review/request/confirmation/rejected-001",
  "/review/purchase/confirmation/not-allowlisted",
  "/review/result/not-allowlisted",
  "/review/save-report/not-allowlisted",
];

const viewports = [
  { name: "mobile-320", width: 320, height: 900 },
  { name: "mobile-390", width: 390, height: 844 },
  { name: "tablet-768", width: 768, height: 1024 },
  { name: "desktop-1440", width: 1440, height: 1100 },
];

const keyboardRoutes = new Set([
  "/",
  "/request",
  "/review",
  "/review/request/needs-review",
  "/review/request/rejected",
  "/review/purchase/confirmation/normal-001",
  "/sample-report",
  "/review/result/result-normal-001",
  "/review/save-report/result-normal-001",
  "/legal",
  "/legal/tokushoho",
  "/contact",
  "/review/error/missing-fixture",
]);

const axeViewports = new Set(["mobile-390", "desktop-1440"]);

function routeKey(route) {
  return route === "/" ? "root" : route.slice(1).replace(/[^a-zA-Z0-9_-]+/g, "__");
}

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function inspectLayout(page) {
  return page.evaluate(() => {
    const documentElement = document.documentElement;
    const body = document.body;
    const viewportWidth = documentElement.clientWidth;
    const maxScrollWidth = Math.max(documentElement.scrollWidth, body?.scrollWidth ?? 0);

    const overflowElements = Array.from(document.querySelectorAll("body *"))
      .map((element) => {
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        return {
          tag: element.tagName.toLowerCase(),
          id: element.id || null,
          className: typeof element.className === "string" ? element.className.slice(0, 180) : null,
          text: (element.textContent ?? "").trim().replace(/\s+/g, " ").slice(0, 100),
          left: Math.round(rect.left * 100) / 100,
          right: Math.round(rect.right * 100) / 100,
          width: Math.round(rect.width * 100) / 100,
          position: style.position,
          overflowX: style.overflowX,
        };
      })
      .filter((item) => item.width > 0 && (item.left < -1 || item.right > viewportWidth + 1))
      .slice(0, 30);

    const controls = Array.from(
      document.querySelectorAll("a[href], button, input, select, textarea, summary, [tabindex]"),
    ).map((element) => {
      const rect = element.getBoundingClientRect();
      return {
        tag: element.tagName.toLowerCase(),
        type: element.getAttribute("type"),
        href: element.getAttribute("href"),
        disabled: "disabled" in element ? Boolean(element.disabled) : false,
        tabIndex: element.tabIndex,
        label:
          element.getAttribute("aria-label") ||
          element.getAttribute("title") ||
          (element.textContent ?? "").trim().replace(/\s+/g, " ").slice(0, 120),
        width: Math.round(rect.width * 100) / 100,
        height: Math.round(rect.height * 100) / 100,
      };
    });

    return {
      title: document.title,
      h1Count: document.querySelectorAll("h1").length,
      viewportWidth,
      documentScrollWidth: documentElement.scrollWidth,
      bodyScrollWidth: body?.scrollWidth ?? null,
      horizontalOverflow: maxScrollWidth > viewportWidth + 1,
      overflowElements,
      controls,
    };
  });
}

async function captureKeyboardSequence(browser, viewport, route) {
  const context = await browser.newContext({ viewport, locale: "ja-JP", reducedMotion: "reduce" });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(`console: ${message.text()}`);
  });

  await page.goto(`${baseUrl}${route}`, { waitUntil: "networkidle" });
  await page.evaluate(() => {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    window.scrollTo(0, 0);
  });

  const steps = [];
  const seen = new Map();
  const focusDir = path.join(outputRoot, "focus", `${viewport.width}`, routeKey(route));
  await ensureDir(focusDir);

  for (let index = 1; index <= 60; index += 1) {
    await page.keyboard.press("Tab");
    await page.waitForTimeout(40);
    const focused = await page.evaluate(() => {
      const element = document.activeElement;
      if (!(element instanceof HTMLElement)) return null;
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return {
        tag: element.tagName.toLowerCase(),
        id: element.id || null,
        className: typeof element.className === "string" ? element.className.slice(0, 180) : null,
        text: (element.textContent ?? "").trim().replace(/\s+/g, " ").slice(0, 140),
        href: element.getAttribute("href"),
        type: element.getAttribute("type"),
        ariaLabel: element.getAttribute("aria-label"),
        disabled: "disabled" in element ? Boolean(element.disabled) : false,
        tabIndex: element.tabIndex,
        rect: {
          x: Math.round(rect.x * 100) / 100,
          y: Math.round(rect.y * 100) / 100,
          width: Math.round(rect.width * 100) / 100,
          height: Math.round(rect.height * 100) / 100,
        },
        outline: `${style.outlineWidth} ${style.outlineStyle} ${style.outlineColor}`,
        outlineOffset: style.outlineOffset,
        boxShadow: style.boxShadow,
      };
    });

    if (!focused) break;
    const signature = JSON.stringify([
      focused.tag,
      focused.id,
      focused.href,
      focused.type,
      focused.text,
      focused.rect.x,
      focused.rect.y,
    ]);
    steps.push({ step: index, ...focused });

    if (index <= 10) {
      await page.screenshot({
        path: path.join(focusDir, `tab-${String(index).padStart(2, "0")}.jpg`),
        type: "jpeg",
        quality: 80,
        fullPage: false,
        animations: "disabled",
      });
    }

    if (seen.has(signature)) {
      const firstSeen = seen.get(signature);
      if (index - firstSeen > 1) break;
    }
    seen.set(signature, index);
  }

  const sampleDisclosure = page.locator("summary", { hasText: "審査専用メタデータ" });
  let disclosureInteraction = null;
  if ((await sampleDisclosure.count()) > 0) {
    await sampleDisclosure.focus();
    const before = await sampleDisclosure.evaluate((element) => element.parentElement?.hasAttribute("open") ?? false);
    await page.keyboard.press("Enter");
    const afterEnter = await sampleDisclosure.evaluate((element) => element.parentElement?.hasAttribute("open") ?? false);
    await page.keyboard.press("Space");
    const afterSpace = await sampleDisclosure.evaluate((element) => element.parentElement?.hasAttribute("open") ?? false);
    disclosureInteraction = { before, afterEnter, afterSpace };
  }

  await context.close();
  return { route, viewport, steps, errors, disclosureInteraction };
}

await fs.rm(outputRoot, { recursive: true, force: true });
await ensureDir(outputRoot);

const browser = await chromium.launch({ headless: true });
const results = [];
const keyboardResults = [];

for (const viewport of viewports) {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    locale: "ja-JP",
    reducedMotion: "reduce",
    colorScheme: "light",
  });
  const page = await context.newPage();

  for (const route of routes) {
    const runtimeErrors = [];
    const consoleListener = (message) => {
      if (message.type() === "error") runtimeErrors.push(`console: ${message.text()}`);
    };
    const pageErrorListener = (error) => runtimeErrors.push(`pageerror: ${error.message}`);
    page.on("console", consoleListener);
    page.on("pageerror", pageErrorListener);

    let status = null;
    let navigationError = null;
    let layout = null;
    let axeViolations = [];
    const screenshotDir = path.join(outputRoot, "screenshots", viewport.name);
    await ensureDir(screenshotDir);
    const screenshotPath = path.join(screenshotDir, `${routeKey(route)}.jpg`);

    try {
      const response = await page.goto(`${baseUrl}${route}`, { waitUntil: "networkidle", timeout: 30_000 });
      status = response?.status() ?? null;
      await page.evaluate(() => window.scrollTo(0, 0));
      layout = await inspectLayout(page);

      if (axeViewports.has(viewport.name)) {
        const axeResult = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
          .analyze();
        axeViolations = axeResult.violations.map((violation) => ({
          id: violation.id,
          impact: violation.impact,
          description: violation.description,
          help: violation.help,
          helpUrl: violation.helpUrl,
          nodes: violation.nodes.map((node) => ({
            target: node.target,
            html: node.html.slice(0, 500),
            failureSummary: node.failureSummary,
          })),
        }));
      }

      await page.screenshot({
        path: screenshotPath,
        type: "jpeg",
        quality: 82,
        fullPage: true,
        animations: "disabled",
      });
    } catch (error) {
      navigationError = error instanceof Error ? error.stack ?? error.message : String(error);
    }

    results.push({
      route,
      viewport,
      status,
      navigationError,
      runtimeErrors,
      layout,
      axeViolations,
      screenshotPath: path.relative(outputRoot, screenshotPath),
    });

    page.off("console", consoleListener);
    page.off("pageerror", pageErrorListener);
  }

  await context.close();
}

for (const viewport of [
  { width: 390, height: 844 },
  { width: 1440, height: 1100 },
]) {
  for (const route of routes.filter((item) => keyboardRoutes.has(item))) {
    keyboardResults.push(await captureKeyboardSequence(browser, viewport, route));
  }
}

await browser.close();

const findings = {
  navigationFailures: results.filter((item) => item.navigationError || item.status !== 200),
  horizontalOverflow: results.filter((item) => item.layout?.horizontalOverflow),
  headingFailures: results.filter((item) => item.layout && item.layout.h1Count !== 1),
  runtimeErrors: results.filter((item) => item.runtimeErrors.length > 0),
  axeViolations: results.filter((item) => item.axeViolations.length > 0),
  keyboardErrors: keyboardResults.filter((item) => item.errors.length > 0),
  keyboardMissingFocusIndicator: keyboardResults.flatMap((item) =>
    item.steps
      .filter((step) => {
        const hasOutline = !step.outline.startsWith("0px") && !step.outline.includes("none");
        const hasShadow = step.boxShadow && step.boxShadow !== "none";
        return !hasOutline && !hasShadow;
      })
      .map((step) => ({ route: item.route, viewport: item.viewport, step })),
  ),
};

await fs.writeFile(path.join(outputRoot, "route-results.json"), JSON.stringify(results, null, 2));
await fs.writeFile(path.join(outputRoot, "keyboard-results.json"), JSON.stringify(keyboardResults, null, 2));
await fs.writeFile(path.join(outputRoot, "findings.json"), JSON.stringify(findings, null, 2));

const summaryLines = [
  "# M1-I6 Visual QA automation summary",
  "",
  `- Base URL: ${baseUrl}`,
  `- Routes: ${routes.length}`,
  `- Viewports: ${viewports.length}`,
  `- Route/viewport captures: ${results.length}`,
  `- Keyboard walkthroughs: ${keyboardResults.length}`,
  `- Navigation failures: ${findings.navigationFailures.length}`,
  `- Horizontal overflow findings: ${findings.horizontalOverflow.length}`,
  `- h1-count failures: ${findings.headingFailures.length}`,
  `- Runtime-error captures: ${findings.runtimeErrors.length}`,
  `- Route/viewport Axe findings: ${findings.axeViolations.length}`,
  `- Keyboard runtime-error captures: ${findings.keyboardErrors.length}`,
  `- Focus steps without computed outline/box-shadow: ${findings.keyboardMissingFocusIndicator.length}`,
  "",
  "This output is evidence for Human review. It does not itself accept M1-I6 or Milestone 1.",
];
await fs.writeFile(path.join(outputRoot, "SUMMARY.md"), `${summaryLines.join("\n")}\n`);

console.log(summaryLines.join("\n"));
