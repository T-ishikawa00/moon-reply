import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { build } from "esbuild";
import { projectCustomerAssessmentExperienceV2 } from "../../lib/assessment/runtime/customer-assessment-experience-projection-v2.ts";
import { FIXTURE_PROVENANCE, makeRuntimeFixture, runFixture } from "./runtime-fixtures.mjs";

// Rendering/contract smoke only. The fake transport never invokes a Provider.
const root = fileURLToPath(new URL("../../", import.meta.url));
assert.equal(path.resolve(process.cwd()), path.resolve(root), "Run from the repository root.");
const outputDirectory = path.resolve(root, ".tmp/guidance-quality-wave1");
assert.ok(outputDirectory.startsWith(`${path.resolve(root)}${path.sep}`));
await mkdir(outputDirectory, { recursive: true });

const rendererFile = path.join(outputDirectory, "component-render.mjs");
const bundle = await build({
  stdin: {
    contents: [
      'import { createElement } from "react";',
      'import { renderToStaticMarkup } from "react-dom/server";',
      'import { CustomerAssessmentNote } from "@/components/runtime/CustomerAssessmentNote";',
      'export const renderAssessment = (projection) => renderToStaticMarkup(createElement(CustomerAssessmentNote, { projection }));',
    ].join("\n"),
    sourcefile: "guidance-preview-entry.tsx",
    resolveDir: root,
    loader: "tsx",
  },
  outfile: rendererFile,
  bundle: true,
  platform: "node",
  format: "esm",
  packages: "external",
  jsx: "automatic",
  alias: { "@": root },
  loader: { ".module.css": "local-css" },
  write: false,
  logLevel: "silent",
});
for (const output of bundle.outputFiles) {
  assert.equal(path.dirname(output.path), outputDirectory);
  await writeFile(output.path, output.contents);
}
const { renderAssessment } = await import(pathToFileURL(rendererFile).href);

const escapeHtml = (text) => String(text).replace(/[&<>"']/gu, (character) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
})[character]);
const sourceGlobals = await readFile(path.join(root, "app/globals.css"), "utf8");
// Tailwind is a build-time import; the component uses its actual CSS module and
// the repository's plain global brand styles, not utility-generated classes.
const globals = sourceGlobals.replace(/^@import "tailwindcss";\r?\n/u, "");
const previewCss = `
.guidance-preview { margin: 0; min-height: 100vh; background: #10152d; color: #fffdf6; font-family: var(--font-body); }
.preview-shell { max-width: 64rem; margin: auto; padding: 1.25rem; }
.preview-warning { border: 2px solid #efd58c; background: #27233a; padding: 1.15rem; margin-bottom: 1.5rem; }
.preview-warning h1 { font-size: clamp(1.4rem, 4vw, 2rem); margin: 0 0 .75rem; }
.preview-warning p, .preview-variant p { line-height: 1.8; margin: .5rem 0; overflow-wrap: anywhere; }
.preview-nav { display: flex; flex-wrap: wrap; gap: .75rem 1.25rem; padding: 0; list-style: none; }
.preview-nav a, .preview-variant a { color: #efd58c; }
.preview-variant { margin: 2rem 0; }
.preview-variant h2 { font-size: 1.25rem; margin-bottom: .5rem; }
.preview-variant iframe { display: block; width: 100%; min-height: 25rem; border: 1px solid #66596b; background: #10152d; }
.preview-result-shell { max-width: 58rem; margin: auto; padding: 1rem; }
.preview-result-label { font-family: var(--font-body); color: #fffdf6; background: #27233a; border: 2px solid #efd58c; padding: .9rem; line-height: 1.75; margin: 0 0 1rem; }
@media (max-width: 480px) { .preview-shell, .preview-result-shell { padding: .65rem; } }
`;
await writeFile(path.join(outputDirectory, "preview.css"), `${globals}\n${previewCss}`, "utf8");

const variants = [
  { id: "candidate-minimal-gq28", caseId: "GQ-28", candidate: true, detailed: false, title: "V18 candidate / GQ-28 最小回答", note: "1行動・注意0・aftercare0。文面は新規案。" },
  { id: "candidate-detailed-gq28", caseId: "GQ-28", candidate: true, detailed: true, title: "V18 candidate / GQ-28 詳細表示", note: "描画用の派生fixtureとして next_three_days 選択を追加。凍結ケースの期待値は変更していません。" },
  { id: "candidate-wait-gq29", caseId: "GQ-29", candidate: true, detailed: false, title: "V18 candidate / GQ-29 待つ・文面なし", note: "1行動・注意0・aftercare0・送信文面なし。" },
  { id: "legacy-detailed-gq03", caseId: "GQ-03", candidate: false, detailed: true, title: "V17 legacy / GQ-03 詳細表示", note: "旧契約の表示回帰用。描画用に next_three_days 選択を追加した派生fixtureです。" },
];
const evidence = [];
let checks = 0;
const check = (name, assertion) => { assertion(); checks++; console.log(`PASS ${checks} ${name}`); };
for (const variant of variants) {
  const fixture = makeRuntimeFixture(variant.caseId, variant);
  const execution = await runFixture(fixture, { candidate: variant.candidate });
  check(`${variant.id}: fake pipeline ready with zero external operations`, () => {
    assert.equal(execution.result.eligibility, "ready");
    assert.equal(execution.transport.actualProviderCalls, 0);
    assert.equal(execution.repository.actualSupabaseCalls, 0);
  });
  const projection = projectCustomerAssessmentExperienceV2(execution.result, fixture.request.requestedTopics);
  const markup = renderAssessment(projection);
  const draftPresent = projection.baseProjection.finalDraft !== null;
  const expectedAvoid = projection.baseProjection.immediateAction.avoid.length > 0;
  check(`${variant.id}: optional cards follow real projection`, () => {
    assert.equal(markup.includes("避けること</h3>"), expectedAvoid);
    assert.equal(markup.includes("これからの流れ</h2>"), variant.detailed);
    assert.equal(markup.includes("そのまま使える文面"), draftPresent);
    assert.equal(markup.includes("文案をコピー"), draftPresent);
    assert.doesNotMatch(markup, /<h[1-6][^>]*>\s*<\/h[1-6]>/u);
  });
  if (variant.candidate) {
    check(`${variant.id}: first action remains the primary displayed action`, () => {
      assert.equal(projection.baseProjection.immediateAction.action, fixture.outputs["PB-04"].actions_to_take[0]);
      assert.ok(markup.includes(escapeHtml(projection.baseProjection.immediateAction.action)));
    });
  }
  if (variant.detailed) {
    check(`${variant.id}: explicitly requested plan has three phases`, () => {
      assert.equal(projection.baseProjection.optionalDetails.expandedPlan.length, 3);
      assert.ok(projection.baseProjection.optionalDetails.planCommentary.length > 0);
    });
  }
  const title = escapeHtml(variant.title);
  const label = `架空・手作成の静的表示fixture — 実モデル出力・回答品質の証明ではありません。コピー操作は未接続です。`;
  await writeFile(path.join(outputDirectory, `${variant.id}.html`), `<!doctype html>
<html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><link rel="stylesheet" href="preview.css"><link rel="stylesheet" href="component-render.css"></head>
<body class="guidance-preview"><main class="preview-result-shell"><p class="preview-result-label"><strong>${title}</strong><br>${label}<br>${escapeHtml(variant.note)}</p>${markup}</main></body></html>`, "utf8");
  evidence.push({
    variant: variant.id, caseId: variant.caseId, runtime: execution.catalog.catalogVersion,
    provenance: FIXTURE_PROVENANCE, actualProviderCalls: execution.transport.actualProviderCalls,
    actualSupabaseCalls: execution.repository.actualSupabaseCalls,
    draftPresent, avoidCount: projection.baseProjection.immediateAction.avoid.length,
    aftercareCount: projection.baseProjection.optionalDetails.expandedPlan?.length ?? 0,
    primaryAction: projection.baseProjection.immediateAction.action,
  });
}

const sections = variants.map((variant) => `<section class="preview-variant" id="${variant.id}"><h2>${escapeHtml(variant.title)}</h2><p>${escapeHtml(variant.note)}</p><p><a href="${variant.id}.html">単独ページを開く（同じ画面幅で確認）</a></p><iframe title="${escapeHtml(variant.title)}" src="${variant.id}.html"></iframe></section>`).join("\n");
await writeFile(path.join(outputDirectory, "index.html"), `<!doctype html>
<html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Guidance Wave 1 — local synthetic rendering</title><link rel="stylesheet" href="preview.css"></head>
<body class="guidance-preview"><main class="preview-shell"><header class="preview-warning"><h1>架空・手作成の表示検証</h1><p>実モデルの回答ではありません。fake pipeline → 実際のprojection → 実際のCustomerAssessmentNoteをSSRした静的表示です。回答品質・本番動作・Human Acceptanceの証明には使用しません。</p><p>Provider 0 / DB 0 / 外部操作 0。コピー操作は未接続。各ページの表示項目と、空の見出し・カードが残らないことを確認します。</p><ul class="preview-nav">${variants.map((variant) => `<li><a href="#${variant.id}">${escapeHtml(variant.title)}</a></li>`).join("")}</ul></header>${sections}</main>
<script>for(const frame of document.querySelectorAll('iframe')){const fit=()=>{frame.style.height=(frame.contentDocument.documentElement.scrollHeight+4)+'px';};frame.addEventListener('load',fit);window.addEventListener('resize',fit);}</script></body></html>`, "utf8");
await writeFile(path.join(outputDirectory, "render-evidence.json"), JSON.stringify({
  provenance: FIXTURE_PROVENANCE, evidenceKind: "static_synthetic_rendering_contract_smoke",
  checks, actualModelRuns: 0, variants: evidence,
}, null, 2), "utf8");
console.log(`GUIDANCE SSR PASS ${checks}/${checks}; model=0 Provider=0 DB=0; ${path.join(outputDirectory, "index.html")}`);
