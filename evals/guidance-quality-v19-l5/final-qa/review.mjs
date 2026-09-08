// Local presentation only. Accept anonymous public slots; never read a mapping,
// historical run, runtime receipt, Human preference, or generation expectation.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { randomBytes } from "node:crypto";
import { build } from "esbuild";
import { projectCustomerAssessmentExperienceV2 } from "../../../lib/assessment/runtime/customer-assessment-experience-projection-v2.ts";

export const REVIEW_ISSUES = Object.freeze([
  "事実の捏造・確度上昇", "意味のズレ", "不必要に待たせる", "不必要に送らせる",
  "冷たい・寄り添い不足", "分かりにくい", "同じ説明の反復", "依頼を落としている",
  "回答未成立", "その他", "なし",
]);
const CHOICES = ["A", "B", "引き分け", "どちらも不可"];
const RELATIONSHIPS = { dating: "付き合う前", in_relationship: "交際中", ambiguous: "曖昧な関係", former_partner: "元恋人", matching_app: "マッチングアプリ", work_or_school: "職場・学校・知人", other: "その他" };
const TOPICS = { decide_send_or_wait: "送るか待つか決めたい", message_impact: "この文面がどう届くか知りたい", draft_message: "送る文章を整えたい", relationship: "相手との関係を整理したい", next_three_days: "これから3日どう動くか知りたい", organize_emotions: "不安を整理したい" };
const STATES = { completed: "回答完成", clarification: "追加確認", stopped: "回答未成立", not_started: "未実施" };
const RECORD_KEYS = ["caseId", "anonymousVariantId", "finalOutput", "finalState"];
const INTERNAL = /runtime-stage-catalog|prompt-bundle-runtime|pipeline-schema-runtime|actualRuntimeVersion|promptBundleVersion|promptHash|schemaHash|catalogVersion|mapping-SEALED|(?:current|candidate)-v\d|\bV(?:17|18|19|20|21|22)(?:[-.]L?\d+)?\b|\b[a-f0-9]{40,64}\b|\bsk-[A-Za-z0-9_-]{20,}|Bearer\s+[A-Za-z0-9._-]{20,}|\b(?:M2_|MATERIAL_|BUDGET_|HTTP_)[A-Z0-9_]+\b|\bACTION_CONSISTENCY\b|sessionId|requestId|responseId|errorCode|stopReason|[A-Za-z]:[\\/]projects[\\/]|[\\/]internal[\\/]/iu;
const need = (condition, code) => { if (!condition) throw new Error(code); };
const esc = value => String(value).replace(/[&<>"']/gu, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const scriptJson = value => JSON.stringify(value).replace(/</gu, "\\u003c");
const asText = html => html.replace(/<svg[\s\S]*?<\/svg>/gu, "").replace(/<[^>]*>/gu, "\n").replace(/&(?:amp|lt|gt|quot|#39);/gu, v => ({ "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&#39;": "'" })[v]).split("\n").map(v => v.trim()).filter(Boolean).join("\n\n");

function selectSlots(cases, records) {
  need(Array.isArray(cases) && cases.length === 12, "BLIND_CASE_COUNT_INVALID");
  const ids = new Set();
  for (const item of cases) {
    need(item && /^[A-Za-z0-9][A-Za-z0-9_-]*$/u.test(item.id) && !ids.has(item.id), "BLIND_CASE_ID_INVALID");
    need(typeof item.label === "string" && typeof item.consultation === "string" && item.consultation.trim(), "BLIND_CASE_TEXT_INVALID");
    need(item.input && item.input.currentSituation === item.consultation && Array.isArray(item.input.requestedTopics), "BLIND_CONSULTATION_MISMATCH");
    ids.add(item.id);
  }
  need(Array.isArray(records) && records.length <= 24, "BLIND_RECORD_COUNT_INVALID");
  const slots = new Map();
  for (const record of records) {
    need(record && Object.keys(record).length === RECORD_KEYS.length && RECORD_KEYS.every(k => Object.hasOwn(record, k)), "BLIND_RECORD_NOT_PUBLIC_SAFE");
    need(ids.has(record.caseId) && ["A", "B"].includes(record.anonymousVariantId) && Object.hasOwn(STATES, record.finalState), "BLIND_RECORD_ID_OR_STATE_INVALID");
    const key = `${record.caseId}:${record.anonymousVariantId}`;
    need(!slots.has(key), "BLIND_DUPLICATE_SLOT");
    if (record.finalState === "completed") need(record.finalOutput?.eligibility === "ready", "BLIND_COMPLETED_OUTPUT_INVALID");
    if (record.finalState === "clarification") need(typeof record.finalOutput?.clarification?.question === "string" && record.finalOutput.clarification.question.trim(), "BLIND_CLARIFICATION_INVALID");
    // A failed/intermediate payload is deliberately not copied into the slot.
    slots.set(key, { caseId: record.caseId, anonymousVariantId: record.anonymousVariantId, finalState: record.finalState,
      finalOutput: record.finalState === "completed" ? record.finalOutput : record.finalState === "clarification" ? { clarification: { question: record.finalOutput.clarification.question } } : null });
  }
  return cases.flatMap(item => ["A", "B"].map(variant => slots.get(`${item.id}:${variant}`) ?? { caseId: item.id, anonymousVariantId: variant, finalState: "not_started", finalOutput: null }));
}

// Same product component and projection as the existing real-pilot renderer.
// Build entirely in memory: no executable bundle or source-path CSS is public.
async function productRenderer() {
  const root = fileURLToPath(new URL("../../../", import.meta.url));
  const bundle = await build({ stdin: { contents: 'import {createElement} from "react"; import {renderToStaticMarkup} from "react-dom/server"; import {CustomerAssessmentNote} from "@/components/runtime/CustomerAssessmentNote"; import {V19L5MessageAssessmentNote} from "@/components/runtime/V19L5MessageAssessmentNote"; export const render=(projection,message=false)=>renderToStaticMarkup(createElement(message?V19L5MessageAssessmentNote:CustomerAssessmentNote,{projection}));', sourcefile: "blind-review.tsx", resolveDir: root, loader: "tsx" },
    outfile: path.join(root, "blind-memory-renderer.mjs"), bundle: true, platform: "node", format: "esm", jsx: "automatic", alias: { "@": root }, loader: { ".module.css": "local-css" }, write: false, logLevel: "silent",
    banner: { js: `import {createRequire as blindCreateRequire} from 'node:module'; const require=blindCreateRequire(${JSON.stringify(path.join(root, "package.json"))});` } });
  const js = bundle.outputFiles.find(file => file.path.endsWith(".mjs"));
  const { render } = await import(`data:text/javascript;base64,${Buffer.from(js.contents).toString("base64")}`);
  const globals = readFileSync(path.join(root, "app/globals.css"), "utf8").replace(/^@import "tailwindcss";\r?\n/u, "");
  const css = bundle.outputFiles.find(file => file.path.endsWith(".css"))?.text ?? "";
  return { render, css: (globals + "\n" + css).replace(/\r\n/g, "\n").replace(/\/\*[\s\S]*?\*\//gu, "").replace(/[\t ]+$/gm, "") };
}

function questions(item, disabled) {
  const radio = suffix => CHOICES.map(value => `<label><input type="radio" name="${item.id}-${suffix}" value="${esc(value)}">${esc(value)}</label>`).join("");
  return `<form data-case="${item.id}" class="human"><h3>このケースを評価</h3>${disabled ? '<p class="pending-note">実回答が揃ってから評価します。準備段階の回答欄は未記入です。</p>' : ""}<fieldset class="review-fields"${disabled ? " disabled" : ""}><fieldset><legend>1. 月の返事としてどちらが良い？</legend><div class="choice-row">${radio("preference")}</div></fieldset><label class="reason-label">2. 理由<textarea name="${item.id}-reason" rows="3" placeholder="良かった点・気になった点を自由に記入"></textarea></label><fieldset><legend>3. A/Bの問題</legend><p class="field-help">各出力について選んでください（複数選択可）。問題がなければ「なし」。</p><div class="issue-columns">${["A", "B"].map(variant => `<div class="issue-column"><h4>Output ${variant}</h4>${REVIEW_ISSUES.map(issue => `<label><input type="checkbox" name="${item.id}-issues-${variant}" value="${esc(issue)}">${esc(issue)}</label>`).join("")}</div>`).join("")}</div></fieldset><fieldset><legend>4. 980円で受け取るなら？</legend><div class="choice-row">${radio("purchase")}</div></fieldset></fieldset><p class="case-review-progress" aria-live="polite">未記入</p></form>`;
}

const css = `
:root{color-scheme:dark}*{box-sizing:border-box}body{margin:0;background:#101426;color:#f8f3e8;font-family:system-ui,-apple-system,"Noto Sans JP",sans-serif}button,input,textarea{font:inherit}button,a,input,textarea{outline-offset:4px}button{cursor:pointer}a{color:#f1d394}.review-shell{max-width:1460px;margin:auto;padding:36px 28px 110px}.review-header{max-width:980px;margin-bottom:28px}.eyebrow{color:#d8bb82;letter-spacing:.15em;font-size:12px}.review-header h1{font-size:clamp(25px,3vw,38px);line-height:1.35;margin:10px 0 18px}.review-header p{line-height:1.85;margin:9px 0;color:#ded9db}.review-layout{display:grid;grid-template-columns:240px minmax(0,1fr);gap:32px;align-items:start}.case-nav{position:sticky;top:20px;background:#1c2033;border:1px solid #494252;border-radius:14px;padding:18px 12px}.case-nav h2{font-size:16px;margin:0 8px 8px}.case-nav>p{font-size:13px;color:#cec6cf;margin:0 8px 14px}.case-link{display:block;width:100%;text-align:left;background:transparent;color:#e6dfe8;border:1px solid transparent;border-radius:9px;padding:11px 10px;margin:3px 0;line-height:1.5}.case-link[aria-current="true"]{background:#353040;border-color:#c4a477;color:#fff4de}.nav-number{color:#c0a676;font-size:12px;display:block}.nav-label{display:block;font-size:14px;font-weight:600}.nav-progress{display:block;color:#bdb8c7;font-size:12px;margin-top:3px}.case-heading{display:flex;justify-content:space-between;gap:20px;align-items:center;margin:0 0 18px}.case-heading h2{font-size:25px;line-height:1.5;margin:0}.case-counter{color:#d6bd8c;white-space:nowrap}.consultation,.human,.intro-note{padding:24px;background:#202337;border:1px solid #494252;border-radius:13px;margin:0 0 25px}.consultation h3{font-size:16px;color:#dbc294;margin:0 0 12px}.consultation-text{white-space:pre-wrap;overflow-wrap:anywhere;line-height:1.95;margin:0;font-size:17px}.input-context{margin-top:15px;color:#c9c5d1;font-size:14px;line-height:1.75}.input-context summary{cursor:pointer}.input-context dl{display:grid;grid-template-columns:140px 1fr;gap:8px 18px;margin-bottom:0}.input-context dt{color:#d9c798}.input-context dd{margin:0;white-space:pre-wrap;overflow-wrap:anywhere}.output{min-width:0;margin:28px 0 38px}.output-header{display:flex;align-items:center;gap:15px;margin-bottom:15px;border-bottom:1px solid #70616d;padding-bottom:13px}.output-label{font-size:25px;letter-spacing:.02em;margin:0}.output-state{display:inline-block;border:1px solid #6c6172;border-radius:20px;padding:4px 11px;font-size:12px;color:#d8cedf}.status{padding:30px;border:1px dashed #777084;border-radius:12px;color:#d4cfdc;background:#181d31;line-height:1.8}.status strong{font-size:14px;color:#d7bd8d;letter-spacing:.06em}.status p{margin:8px 0 0}.human h3{font-size:22px;margin:0 0 20px}.human fieldset{border:1px solid #665c70;padding:18px;margin:18px 0}.human .review-fields{border:0;padding:0;margin:0;min-width:0}.human legend{padding:0 8px;line-height:1.6}.human label{display:flex;gap:8px;align-items:baseline;margin:10px 0;line-height:1.6}.human input{accent-color:#ddbe80;flex-shrink:0}.choice-row{display:flex;flex-wrap:wrap;gap:8px 26px}.human .reason-label{display:block}.human textarea{display:block;width:100%;resize:vertical;margin-top:10px;border:1px solid #8e8192;border-radius:8px;padding:13px;background:#f7f1e7;color:#252434;line-height:1.7}.human textarea::placeholder{color:#77717a}.field-help,.pending-note{font-size:14px;color:#c8c1cf;line-height:1.8}.issue-columns{display:grid;grid-template-columns:1fr 1fr;gap:25px}.issue-column h4{color:#ebd19e;margin:4px 0 12px}.case-review-progress{font-size:14px;color:#d7bd8d;margin-bottom:0}.controls{position:fixed;bottom:0;left:0;right:0;border-top:1px solid #716273;background:#202337f5;padding:14px 24px;display:flex;gap:12px;justify-content:center;align-items:center;flex-wrap:wrap;z-index:50}.controls button,.page-controls button{border:1px solid #a9916e;padding:10px 17px;border-radius:8px;background:#edcf92;color:#232336}.controls .secondary,.page-controls button{background:#292a3e;color:#f1ddba}.controls button:disabled,.page-controls button:disabled{opacity:.4;cursor:default}.storage-status{font-size:12px;color:#cfc5d2;max-width:260px}.page-controls{display:flex;justify-content:space-between;align-items:center;gap:15px;margin-top:28px}details[open]>summary{margin-bottom:12px}.review-layout [hidden]{display:none!important}button:focus-visible,input:focus-visible,textarea:focus-visible{outline:3px solid #e8bc6e}fieldset:disabled{opacity:.64}fieldset:disabled input,fieldset:disabled textarea{cursor:default}
@media(min-width:1450px){.output-pair{display:grid;grid-template-columns:1fr 1fr;gap:24px}.output-pair .output{margin-top:0}}@media(max-width:850px){.review-shell{padding:23px 16px 165px}.review-layout{grid-template-columns:1fr;gap:22px}.case-nav{position:static}.case-nav-list{display:grid;grid-template-columns:repeat(3,1fr);gap:3px}.case-link{padding:9px 8px}.nav-label{font-size:12px}.case-heading h2{font-size:22px}.consultation,.human{padding:18px}.controls{padding:11px 12px;gap:8px}.storage-status{max-width:none;width:100%;text-align:center}.input-context dl{grid-template-columns:110px 1fr}}@media(max-width:520px){.case-nav-list{grid-template-columns:repeat(2,1fr)}.issue-columns{grid-template-columns:1fr}.case-heading{align-items:start}.case-counter{font-size:13px}.choice-row{gap:4px 15px}.controls button{padding:9px 12px;font-size:13px}}
@media print{.case-nav,.controls,.page-controls{display:none}.review-layout{display:block}.review-layout [hidden]{display:block!important}.review-shell{padding:0}.case{break-before:page}.case:first-child{break-before:auto}}
`;

function browserScript(reviewId, ids) {
  return `"use strict";
const reviewId=${scriptJson(reviewId)},ids=${scriptJson(ids)},issues=${scriptJson(REVIEW_ISSUES)},choices=${scriptJson(CHOICES)};
const forms=[...document.querySelectorAll('form[data-case]')], panels=[...document.querySelectorAll('.case')], nav=[...document.querySelectorAll('.case-link')];
const storageKey='moon-reply-blind-answers-'+reviewId;let current=0,storageAvailable=true;
const message=text=>{document.getElementById('storage-status').textContent=text};
const collect=()=>({format:'moon-reply-blind-human-review',reviewId,reviewedAt:new Date().toISOString(),cases:forms.map(f=>({caseId:f.dataset.case,answers:[...new FormData(f).entries()]}))});
function isComplete(f){const d=new FormData(f),id=f.dataset.case;return !!(d.get(id+'-preference')&&String(d.get(id+'-reason')||'').trim()&&d.getAll(id+'-issues-A').length&&d.getAll(id+'-issues-B').length&&d.get(id+'-purchase'));}
function progress(){let complete=0;forms.forEach((f,i)=>{const answered=isComplete(f);if(answered)complete++;const count=[...new FormData(f).entries()].filter(([,value])=>String(value).trim()).length;const state=f.querySelector('.review-fields').disabled?'実回答待ち':answered?'記入済み':count?'記入途中':'未記入';f.querySelector('.case-review-progress').textContent=state;nav[i].querySelector('.nav-progress').textContent=state;});document.getElementById('total-progress').textContent=complete+' / '+forms.length+' ケース記入済み';document.getElementById('current-progress').textContent=(current+1)+' / '+forms.length;}
function show(index,scroll=true){current=Math.max(0,Math.min(index,panels.length-1));panels.forEach((p,i)=>p.hidden=i!==current);nav.forEach((n,i)=>n.setAttribute('aria-current',String(i===current)));document.getElementById('previous').disabled=current===0;document.getElementById('next').disabled=current===panels.length-1;progress();if(scroll)document.getElementById('case-content').scrollIntoView({block:'start',behavior:'smooth'});}
function save(){try{localStorage.setItem(storageKey,JSON.stringify(collect()));message('このブラウザに下書きを保存しました。');}catch{storageAvailable=false;message('ブラウザ保存を利用できません。JSONで保存してください。');}}
function validate(payload){if(!payload||payload.format!=='moon-reply-blind-human-review'||payload.reviewId!==reviewId||!Array.isArray(payload.cases)||payload.cases.length!==ids.length)throw Error('この比較画面の回答JSONではありません。');const seen=new Set();for(const item of payload.cases){if(!ids.includes(item.caseId)||seen.has(item.caseId)||!Array.isArray(item.answers))throw Error('ケース構成が一致しません。');seen.add(item.caseId);const groups=new Map();for(const entry of item.answers){if(!Array.isArray(entry)||entry.length!==2||entry.some(v=>typeof v!=='string'))throw Error('回答形式が不正です。');const[name,value]=entry,suffix=name.slice(item.caseId.length+1);if(!name.startsWith(item.caseId+'-')||!['preference','reason','issues-A','issues-B','purchase'].includes(suffix))throw Error('回答項目が一致しません。');const allowed=suffix.startsWith('issues-')?issues:suffix==='reason'?null:choices;if(allowed&&!allowed.includes(value))throw Error('選択肢が一致しません。');if(value.length>20000)throw Error('回答が長すぎます。');const values=groups.get(name)||[];if(values.includes(value)||(!suffix.startsWith('issues-')&&values.length))throw Error('回答項目が重複しています。');values.push(value);groups.set(name,values);}for(const[name,values]of groups)if(name.includes('-issues-')&&values.includes('なし')&&values.length>1)throw Error('「なし」と他の問題は同時に選べません。');const f=forms.find(f=>f.dataset.case===item.caseId);if(f.querySelector('.review-fields').disabled&&item.answers.length)throw Error('未実施のケースには回答を取り込めません。');}return payload;}
function apply(payload){validate(payload);forms.forEach(f=>f.reset());for(const item of payload.cases){const f=forms.find(f=>f.dataset.case===item.caseId);for(const[name,value]of item.answers)for(const field of f.elements)if(field.name===name){if(field.type==='radio'||field.type==='checkbox')field.checked=field.checked||field.value===value;else field.value=value;}}progress();}
for(const f of forms)f.addEventListener('input',event=>{const t=event.target;if(t.type==='checkbox'&&t.checked)for(const sibling of f.elements)if(sibling!==t&&sibling.name===t.name&&sibling.type==='checkbox'&&(t.value==='なし'||sibling.value==='なし'))sibling.checked=false;save();progress();});
nav.forEach((n,i)=>n.addEventListener('click',()=>show(i)));document.getElementById('previous').onclick=()=>show(current-1);document.getElementById('next').onclick=()=>show(current+1);
document.getElementById('export').onclick=()=>{const blob=new Blob([JSON.stringify(collect(),null,2)+'\\n'],{type:'application/json'});const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='moon-reply-blind-human-review.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);message('回答JSONを保存しました。');};
document.getElementById('import').onclick=()=>document.getElementById('import-file').click();document.getElementById('import-file').onchange=async event=>{try{const file=event.target.files?.[0];if(!file)return;if(file.size>1000000)throw Error('ファイルが大きすぎます。');const payload=validate(JSON.parse(await file.text()));apply(payload);save();message('回答JSONを取り込みました。');}catch(error){message('取り込みを中止しました：'+error.message);}finally{event.target.value='';}};
try{const saved=localStorage.getItem(storageKey);if(saved){apply(JSON.parse(saved));message('この画面の保存済み下書きを復元しました。');}}catch{message('下書きを復元できません。保存済みJSONを確認してください。');}
show(0,false);`;
}

/** Create public-only artifacts. Empty records are placeholders, never sessions. */
export async function writeBlindReview({ directory, cases, records }) {
  const slots = selectSlots(cases, records), renderer = await productRenderer();
  const reviewId = randomBytes(18).toString("base64url"); // Independent of both conditions and outputs.
  const sections = [], markdown = ["# 月の返事 — Blind Review", "各ケースの Output A / Output B を比較してください。対応表はHuman Review終了まで別artifactに隔離されています。", "未実施は NO OUTPUT YET。生成途中の回答は表示しません。", "鑑定ノートの長さ自体は問題とせず、実際の読みやすさ・分かりやすさで評価してください。"];
  for (const [index, item] of cases.entries()) {
    const pair = slots.filter(s => s.caseId === item.id), outputHtml = [];
    markdown.push(`## Case ${item.id} — ${item.label}`, item.consultation);
    for (const slot of pair) {
      const state = slot.finalState, variant = slot.anonymousVariantId;
      let body;
      if (state === "completed") body = renderer.render(slot.finalOutput.messageProjection ?? projectCustomerAssessmentExperienceV2(slot.finalOutput, item.input.requestedTopics), Boolean(slot.finalOutput.messageProjection)).replaceAll("<details", "<details open").replaceAll("customer-assessment-title", `${item.id}-${variant}-title`);
      else if (state === "clarification") body = `<div class="status"><p>${esc(slot.finalOutput.clarification.question)}</p></div>`;
      else if (state === "stopped") body = '<div class="status"><strong>回答未成立</strong><p>最終回答は提供可能な状態に至りませんでした。生成途中の回答は表示していません。</p></div>';
      else body = '<div class="status"><strong>NO OUTPUT YET</strong><p>未実施です。実回答を取得した後に表示します。</p></div>';
      outputHtml.push(`<section class="output" data-output="${variant}" data-output-state="${state}"><div class="output-header"><h3 class="output-label">Output ${variant}</h3><span class="output-state">${STATES[state]}</span></div>${body}</section>`);
      markdown.push(`### Output ${variant}`, `状態：${STATES[state]}`, asText(body));
    }
    const inputDetails = [["お相手との関係", RELATIONSHIPS[item.input.relationship] ?? item.input.relationship ?? "未入力"], ["依頼した内容", item.input.requestedTopics.map(topic => TOPICS[topic] ?? topic).join(" / ")], ["入力した文面", item.input.optionalMessage ?? "未入力"]];
    const inputContext = inputDetails.map(([label, value]) => `<dt>${esc(label)}</dt><dd>${esc(value)}</dd>`).join("");
    markdown.push("相談入力の補足", ...inputDetails.map(([label, value]) => `${label}：${value}`));
    const disabled = pair.some(slot => slot.finalState === "not_started");
    sections.push(`<section class="case" data-case-panel="${item.id}"${index ? " hidden" : ""}><div class="case-heading"><h2>${esc(item.label)}</h2><span class="case-counter">Case ${esc(item.id)}</span></div><div class="consultation"><h3>相談文</h3><p class="consultation-text">${esc(item.consultation)}</p>${inputContext ? `<details class="input-context"><summary>相談入力の補足</summary><dl>${inputContext}</dl></details>` : ""}</div><div class="output-pair">${outputHtml.join("")}</div>${questions(item, disabled)}</section>`);
    markdown.push("### Human Review", "1. 月の返事としてどちらが良い？ A / B / 引き分け / どちらも不可", "2. 理由", `3. A/Bの問題（各出力で選択） ${REVIEW_ISSUES.join(" / ")}`, "4. 980円で受け取るなら？ A / B / 引き分け / どちらも不可", "回答：未記入（Humanが記入）");
  }
  const nav = cases.map((item, index) => `<button type="button" class="case-link" data-nav="${item.id}" aria-current="${index === 0}"><span class="nav-number">CASE ${String(index + 1).padStart(2, "0")}</span><span class="nav-label">${esc(item.label)}</span><span class="nav-progress">${slots.filter(s => s.caseId === item.id).some(s => s.finalState === "not_started") ? "実回答待ち" : "未記入"}</span></button>`).join("");
  const html = `<!doctype html><html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'self' 'unsafe-inline'; script-src 'unsafe-inline'; img-src data:; connect-src 'none'; form-action 'none'; base-uri 'none'"><title>月の返事 — Blind Review</title><link rel="stylesheet" href="blind-review.css"></head><body><main class="review-shell"><header class="review-header"><div class="eyebrow">月の返事 · HUMAN REVIEW</div><h1>12の相談で、受け取りたい回答を選ぶ</h1><p>同じ相談への Output A / Output B を比較してください。対応表はHuman Review終了まで別artifactに隔離されています。</p><p>鑑定ノートの長さ自体は問題とせず、実際に読みづらい・難しいと感じるかで評価してください。</p><p>回答はブラウザ内に下書き保存されます。最後にJSONで保存してください。外部への送信はありません。</p></header><div class="review-layout"><aside class="case-nav" aria-label="ケース選択"><h2>12ケース</h2><p id="total-progress">0 / 12 ケース記入済み</p><nav class="case-nav-list">${nav}</nav></aside><div id="case-content">${sections.join("")}<div class="page-controls"><button type="button" id="previous" disabled>前のケース</button><span id="current-progress">1 / 12</span><button type="button" id="next">次のケース</button></div></div></div></main><div class="controls"><button type="button" id="export">評価をJSONで保存</button><button type="button" id="import" class="secondary">JSONを読み込む</button><input id="import-file" type="file" accept="application/json,.json" hidden><span id="storage-status" class="storage-status" role="status">未記入・外部送信なし</span></div><script>${browserScript(reviewId, cases.map(item => item.id))}</script></body></html>`;
  const publicCss = renderer.css + css, md = markdown.join("\n\n") + "\n";
  need(!INTERNAL.test(html + md + publicCss), "BLIND_INTERNAL_IDENTITY_LEAK");
  need(!/(?:src|href)=["']https?:|@import|url\(\s*["']?https?:/iu.test(html + publicCss), "BLIND_EXTERNAL_DEPENDENCY");
  need(!/<input[^>]*\bchecked(?:\s|>|=)/u.test(html) && !/<textarea[^>]*>[^<]+<\/textarea>/u.test(html), "BLIND_ANSWERS_PREFILLED");
  const audit = { comparedCaseIds: cases.map(item => item.id), outputLabels: ["A", "B"], mappingDisplayed: false, humanAnswersPrefilled: false, actualApiCallsAdded: 0, realSessionsPresented: records.filter(r => r.finalState !== "not_started").length, placeholderDisplaySlots: slots.filter(s => s.finalState === "not_started").length, stoppedIntermediateOutputsHidden: true, productComponentReused: true, outputStates: slots.map(({ caseId, anonymousVariantId, finalState }) => ({ caseId, anonymousVariantId, finalState })) };
  mkdirSync(directory, { recursive: true });
  for (const [file, contents] of Object.entries({ "blind-review.html": html, "blind-review.css": publicCss, "blind-review.md": md, "blind-integrity-check.json": JSON.stringify(audit, null, 2) + "\n" })) writeFileSync(path.join(directory, file), contents);
  return { publicArtifact: path.resolve(directory, "blind-review.html"), ...audit };
}
