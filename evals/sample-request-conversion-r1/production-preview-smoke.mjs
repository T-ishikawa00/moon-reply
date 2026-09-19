import { createRequire } from 'node:module';
import { writeFileSync } from 'node:fs';
const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/PUBLIC_USER/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const browser = await chromium.launch({headless:true,channel:'chrome'});
const context = await browser.newContext({viewport:{width:390,height:844}});
const denied=[];
await context.route('**/*', route => {
  const url = new URL(route.request().url());
  if (url.hostname !== 'localhost') { denied.push(url.origin); return route.abort(); }
  return route.continue();
});
const page = await context.newPage();
await page.goto('http://localhost:3100/sample-report', {waitUntil:'networkidle'});
await page.locator('[data-sample-case="send"]').click();
const sendHeadingPreserved = await page.locator('#sample-section-04').innerText() === '文面の温度';
if (!sendHeadingPreserved) throw new Error('SEND heading changed');
await page.locator('[data-sample-case="wait"]').click();
await page.locator('[data-sample-cta="hero"]').click();
await page.waitForURL('**/request');
await page.getByRole('checkbox',{name:'私は18歳以上です'}).check();
const result={productionPreview:'PASS',sendHeadingPreserved,firstOperation:await page.getByRole('checkbox',{name:'私は18歳以上です'}).isChecked(),externalRequests:denied,gaScriptCount:await page.locator('script[src*="googletagmanager"]').count()};
await page.goto('http://localhost:3102/sample-report',{waitUntil:'networkidle'});
result.lanListenerLocalCheck = await page.locator('[data-sample-case="wait"]').getAttribute('aria-pressed') === 'true';
writeFileSync('evals/sample-request-conversion-r1/preview-smoke.json',JSON.stringify(result,null,2));
console.log(JSON.stringify(result));
await browser.close();
