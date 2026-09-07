// Public artifacts contain only anonymous outputs and unanswered Human fields.
// Never copy a session object, runtime identity, execution order or mapping here.
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { build } from "esbuild";
import { projectCustomerAssessmentExperienceV2 } from "../../../lib/assessment/runtime/customer-assessment-experience-projection-v2.ts";
import { durableJson } from "./transport.mjs";

const esc = value => String(value).replace(/[&<>"']/gu, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const issues = ["事実の捏造", "意味のズレ", "不必要に待たせる", "不必要に送らせる", "重すぎる", "依頼を落としている", "その他", "なし"];
export function anonymousOutput(record) {
  if (!record) return { state: "not_run", paragraphs: ["未実施です。追加生成による補完はしていません。"] };
  if (record.finalDeliveryDisposition === "ready_local_only") return { state: "ready", result: record.finalOutput };
  if (record.finalOutput?.clarification?.question) return { state: "clarification", paragraphs: [record.finalOutput.clarification.question] };
  return { state: "no_final_output", paragraphs: ["最終回答は提供可能な状態に至りませんでした。取得済みの途中出力は内部証拠として保存しています。"] };
}
const renderedText = html => html.replace(/<svg[\s\S]*?<\/svg>/gu, "").replace(/<[^>]*>/gu, "\n").replace(/&(?:amp|lt|gt|quot|#39);/gu, v => ({"&amp;":"&","&lt;":"<","&gt;":">","&quot;":'"',"&#39;":"'"})[v]).split("\n").map(s=>s.trim()).filter(Boolean).join("\n\n");
function questionsHtml(id) {
  const radios = (name, values) => values.map(v => `<label><input type="radio" name="${name}" value="${esc(v)}"> ${esc(v)}</label>`).join("");
  return `<form data-case="${id}" class="human"><h3>Human questions</h3><fieldset><legend>1. 月の返事としてどちらが良い？</legend>${radios(`${id}-preference`, ["A", "B", "引き分け", "どちらも不可"])}</fieldset><label>2. 理由は一言で何？<textarea name="${id}-reason" rows="2"></textarea></label><fieldset><legend>3. A/Bそれぞれに重大な問題はある？</legend>${["A", "B"].map(v => `<div><strong>Output ${v}</strong>${issues.map(i => `<label><input type="checkbox" name="${id}-issues-${v}" value="${i}"> ${i}</label>`).join("")}</div>`).join("")}</fieldset><fieldset><legend>4. 980円で受け取るならどちら？</legend>${radios(`${id}-purchase`, ["A", "B", "引き分け", "どちらも不可"])}</fieldset></form>`;
}
export async function writeBlindArtifacts({ runDirectory, inputs, records, summary }) {
  const root = fileURLToPath(new URL("../../../", import.meta.url));
  const bundleFile = path.join(runDirectory, "internal/review-renderer.mjs");
  const bundle = await build({ stdin: { contents: 'import {createElement} from "react"; import {renderToStaticMarkup} from "react-dom/server"; import {CustomerAssessmentNote} from "@/components/runtime/CustomerAssessmentNote"; export const render=(projection)=>renderToStaticMarkup(createElement(CustomerAssessmentNote,{projection}));', sourcefile: "blind-review.tsx", resolveDir: root, loader: "tsx" }, outfile: bundleFile, bundle: true, platform: "node", format: "esm", packages: "external", jsx: "automatic", alias: { "@": root }, loader: { ".module.css": "local-css" }, write: false, logLevel: "silent" });
  for (const file of bundle.outputFiles) writeFileSync(file.path, file.contents);
  const { render } = await import(pathToFileURL(bundleFile).href);
  const globals = readFileSync(path.join(root, "app/globals.css"), "utf8").replace(/^@import "tailwindcss";\r?\n/u, "");
  const componentCss = readFileSync(bundleFile.replace(/\.mjs$/u, ".css"), "utf8");
  writeFileSync(path.join(runDirectory, "blind-review.css"), globals + "\n" + componentCss + `
body{background:#11162d;color:#fcf7ec;font-family:system-ui,sans-serif;margin:0}main{max-width:1080px;margin:auto;padding:32px 20px}h1,h2,h3{line-height:1.4}.intro,.consultation,.human{padding:20px;background:#24243a;border:1px solid #6d6579;border-radius:12px;margin:20px 0}.output{margin:32px 0}.output-label{font-size:24px;border-bottom:1px solid #918273;padding:12px 0}.case{margin-bottom:64px}.human label{display:block;margin:10px 0;line-height:1.6}fieldset{border:1px solid #7c7285;margin:16px 0;padding:14px}legend{padding:0 8px}textarea{display:block;width:96%;font:inherit;padding:10px;color:#20202b;background:#fffaf2}button{padding:12px 20px;font:inherit;border-radius:8px;background:#f4d596;color:#242438;border:0;cursor:pointer}.controls{position:sticky;bottom:0;background:#24243a;padding:16px;border:1px solid #6d6579}details[open]>summary{margin-bottom:12px}input{margin-right:8px}p{line-height:1.8}.status{border:1px solid #8d7c6d;padding:20px;border-radius:8px}a{color:#f4d596}
`);
  const sections = [], markdown = ["# 月の返事 — Blind Review", "version対応表はHuman評価完了まで非表示です。回答は実際に取得した結果です。未生成の箇所を編集例で補っていません。", "このMarkdownはテキスト確認用です。HTML版は実Customer componentで表示し、評価入力・JSON保存ができます。"];
  const cases = inputs.cases.filter(c => records.some(r => r.caseId === c.id));
  for (const c of cases) {
    const outputSections = []; markdown.push(`## Case ${c.id}`, c.input.currentSituation);
    for (const variant of ["A", "B"]) {
      const record = records.find(r => r.caseId === c.id && r.anonymousVariantId === variant), output = anonymousOutput(record);
      const body = output.state === "ready" ? render(projectCustomerAssessmentExperienceV2(output.result, c.input.requestedTopics)).replaceAll("<details", "<details open").replaceAll("customer-assessment-title", `${c.id}-${variant}-title`) : `<div class="status">${output.paragraphs.map(p => `<p>${esc(p)}</p>`).join("")}</div>`;
      outputSections.push(`<section class="output"><h3 class="output-label">Output ${variant}</h3>${body}</section>`);
      markdown.push(`### Output ${variant}`, renderedText(body));
    }
    markdown.push("### Human questions", "1. 月の返事としてどちらが良い？ A / B / 引き分け / どちらも不可", "2. 理由は一言で何？", `3. A/Bそれぞれに重大な問題はある？ ${issues.join(" / ")}`, "4. 980円で受け取るならどちら？", "回答：未記入（Humanが記入）");
    sections.push(`<section class="case"><h2>Case ${c.id}</h2><p class="consultation">${esc(c.input.currentSituation)}</p>${outputSections.join("")}${questionsHtml(c.id)}</section>`);
  }
  if (!cases.length) { sections.push('<p class="status">取得済みsessionはありません。生成結果を補っていません。</p>'); markdown.push("取得済みsessionはありません。"); }
  const js = `const forms=[...document.querySelectorAll('form[data-case]')];const key='moon-reply-${path.basename(runDirectory)}-human-answers';const collect=()=>({schemaVersion:'guidance-blind-human-review-v1',reviewedAt:new Date().toISOString(),cases:forms.map(f=>({caseId:f.dataset.case,answers:[...new FormData(f).entries()]}))});for(const f of forms)f.addEventListener('input',()=>localStorage.setItem(key,JSON.stringify(collect())));try{const saved=JSON.parse(localStorage.getItem(key)||'null');for(const c of saved?.cases||[]){const f=forms.find(f=>f.dataset.case===c.caseId);if(!f)continue;for(const[name,value]of c.answers){for(const field of f.elements){if(field.name!==name)continue;if(field.type==='radio'||field.type==='checkbox')field.checked=field.value===value||field.checked;else field.value=value;}}}}catch{}document.getElementById('save').onclick=()=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(collect(),null,2)],{type:'application/json'}));a.download='moon-reply-blind-human-review.json';a.click();URL.revokeObjectURL(a.href);};`;
  writeFileSync(path.join(runDirectory, "blind-review.md"), markdown.join("\n\n") + "\n");
  writeFileSync(path.join(runDirectory, "blind-review.html"), `<!doctype html><html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>月の返事 — Blind Review</title><link rel="stylesheet" href="blind-review.css"></head><body><main><h1>月の返事 — Blind Review</h1><div class="intro"><p>各ケースのOutput A/Bを比較してください。version対応表は評価完了まで非表示です。</p><p>実際に取得した回答だけを表示しています。回答未成立・未実施もそのまま残しています。コピー操作は未接続です。</p><p>評価内容はこのブラウザ内へ保存されます。自動採点・補正はしません。最後にJSONを保存し、このTaskへ共有してください。</p></div>${sections.join("")}<div class="controls"><button id="save">Human評価をJSONで保存</button></div></main><script>${js}</script></body></html>`);
  durableJson(path.join(runDirectory, "blind-integrity-check.json"), { comparedCaseIds: cases.map(c => c.id), outputLabels: ["A", "B"], mappingDisplayed: false, humanAnswersPrefilled: false, realSessionsPresented: records.length, stopped: !!summary.stopReason });
}
