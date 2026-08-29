import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { registerHooks } from "node:module";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

const root = process.cwd();
const state = {
  foundationEnabled: true,
  prepaymentEnabled: true,
  checkoutRenders: 0,
  hostedRenders: 0,
  cookies: new Map([
    ["auth-continuation", "K".repeat(43)],
    ["auth-session-csrf", "C".repeat(43)],
  ]),
};
globalThis.__moonReplyPreparingUxR1 = state;

function dataModule(source) {
  return `data:text/javascript,${encodeURIComponent(source)}`;
}

const mocks = new Map([
  [
    "next/headers",
    dataModule(`
      export async function cookies() {
        return { get(name) {
          const value = globalThis.__moonReplyPreparingUxR1.cookies.get(name);
          return value === undefined ? undefined : { value };
        } };
      }
    `),
  ],
  [
    "next/navigation",
    dataModule(`
      export function redirect(path) { throw new Error("REDIRECT:" + path); }
    `),
  ],
  [
    "@/components/payment/AuthenticatedCheckoutButton",
    dataModule(`
      export function AuthenticatedCheckoutButton() {
        globalThis.__moonReplyPreparingUxR1.checkoutRenders += 1;
        return "MOCK_CHECKOUT";
      }
    `),
  ],
  [
    "@/components/request/HostedAuthenticatedPreparation",
    dataModule(`
      export function HostedAuthenticatedPreparation() {
        globalThis.__moonReplyPreparingUxR1.hostedRenders += 1;
        return "MOCK_HOSTED_PREPARING_SHELL";
      }
    `),
  ],
  [
    "@/components/request/PurchaseConfirmation",
    dataModule(`
      export function PurchaseConfirmation({ children }) {
        return ["税込980円", children];
      }
    `),
  ],
  [
    "@/lib/assessment/production/prepayment-compute-policy",
    dataModule(`
      export const isPrepaymentComputeBudgetEnabled = () =>
        globalThis.__moonReplyPreparingUxR1.prepaymentEnabled;
    `),
  ],
  [
    "@/lib/customer-auth/cookies",
    dataModule(`
      export const AUTH_CONTINUATION_COOKIE = "auth-continuation";
      export const AUTH_SESSION_CSRF_COOKIE = "auth-session-csrf";
    `),
  ],
  [
    "@/lib/customer-auth/environment",
    dataModule(`
      export const isCustomerAuthFoundationEnabled = () =>
        globalThis.__moonReplyPreparingUxR1.foundationEnabled;
    `),
  ],
]);

function resolveLocal(specifier, parentURL) {
  if (!parentURL?.startsWith("file:")) return null;
  const unresolved = specifier.startsWith("@/")
    ? path.join(root, specifier.slice(2))
    : specifier.startsWith(".")
      ? path.resolve(path.dirname(fileURLToPath(parentURL)), specifier)
      : null;
  if (!unresolved) return null;
  for (const candidate of [unresolved, `${unresolved}.ts`, `${unresolved}.tsx`]) {
    if (existsSync(candidate)) return pathToFileURL(candidate).href;
  }
  return null;
}

registerHooks({
  resolve(specifier, context, nextResolve) {
    const mocked = mocks.get(specifier);
    if (mocked) return { url: mocked, shortCircuit: true };
    const local = resolveLocal(specifier, context.parentURL);
    return local
      ? { url: local, shortCircuit: true }
      : nextResolve(specifier, context);
  },
  load(url, context, nextLoad) {
    if (url.startsWith("file:") && /\.(?:ts|tsx)$/u.test(url)) {
      const filename = fileURLToPath(url);
      const transpiled = ts.transpileModule(readFileSync(filename, "utf8"), {
        compilerOptions: {
          jsx: ts.JsxEmit.ReactJSX,
          module: ts.ModuleKind.ESNext,
          target: ts.ScriptTarget.ES2022,
          moduleResolution: ts.ModuleResolutionKind.Bundler,
          verbatimModuleSyntax: true,
        },
        fileName: filename,
      });
      return {
        format: "module",
        source: transpiled.outputText,
        shortCircuit: true,
      };
    }
    return nextLoad(url, context);
  },
});

const pageSource = readFileSync(
  path.join(root, "app/purchase/auth/continue/page.tsx"),
  "utf8",
);
assert.doesNotMatch(
  pageSource,
  /Suspense|continueAuthenticatedProductionPreparation|getFreshIdentity/u,
);
assert.match(pageSource, /<HostedAuthenticatedPreparation csrfToken=\{csrfToken\} \/>/u);

const { default: Page } = await import(
  "../app/purchase/auth/continue/page.tsx"
);

const hostedHtml = renderToStaticMarkup(await Page());
assert.match(hostedHtml, /MOCK_HOSTED_PREPARING_SHELL/u);
assert.doesNotMatch(hostedHtml, /税込980円|MOCK_CHECKOUT/u);
assert.equal(state.hostedRenders, 1);
assert.equal(state.checkoutRenders, 0);

state.prepaymentEnabled = false;
const legacyHtml = renderToStaticMarkup(await Page());
assert.match(legacyHtml, /税込980円/u);
assert.match(legacyHtml, /MOCK_CHECKOUT/u);
assert.equal(state.checkoutRenders, 1);

state.prepaymentEnabled = true;
state.cookies = new Map();
await assert.rejects(() => Page(), /REDIRECT:\/account/u);
state.foundationEnabled = false;
await assert.rejects(() => Page(), /REDIRECT:\/account/u);

console.log(
  "PREPARING_UX_R1=PASS fast_hosted_shell=1 no_checkout_before_terminal=1 legacy=1 missing_cookie=1 auth_disabled=1 provider_calls=0 network_calls=0",
);
