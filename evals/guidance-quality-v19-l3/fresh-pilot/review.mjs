// Fresh run presentation only. The existing renderer, projection, four questions
// and storage code are reused unchanged. No historical run or mapping is read.
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync, existsSync } from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { writeBlindArtifacts } from "../../guidance-quality-wave1/real-pilot/review.mjs";

const CASE_IDS = ["GQ-05", "GQ-24", "GQ-13", "GQ-29-P3"];
const LABELS = { completed: "回答完成", clarification: "追加確認", stopped: "回答未成立", not_started: "未実施" };
const PUBLIC_FILES = ["blind-review.html", "blind-review.md", "blind-review.css", "blind-integrity-check.json"];
const sourceIdentity = /runtime-stage-catalog|prompt-bundle-runtime|pipeline-schema-runtime|actualRuntimeVersion|promptBundleVersion|promptHash|schemaHash|catalogVersion|mapping-SEALED|(?:current|candidate)-v\d|\bV(?:17|18|19|20|21)(?:[-.]L?\d+)?\b/iu;
const credentialOrInternal = /\bsk-[A-Za-z0-9_-]{20,}|Bearer\s+[A-Za-z0-9._-]{20,}|\b[a-f0-9]{64}\b|\b[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}\b|\b(?:M2_|MATERIAL_|BUDGET_|HTTP_|GQ29_)[A-Z0-9_]+\b|\bACTION_CONSISTENCY\b|sessionId|requestId|responseId|errorCode|stopReason/iu;
const digest = text => createHash("sha256").update(text).digest("hex");
const fail = code => { const error = new Error(code); error.safeCode = code; throw error; };
const need = (condition, code) => { if (!condition) fail(code); };
const read = file => readFileSync(file, "utf8");
const esc = value => String(value).replace(/[&<>"']/gu, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

function requireNeutralPublicPath(runDirectory) {
  const absolute = path.resolve(runDirectory);
  need(!/(?:^|[\\/_-])v\d+(?:[\\/_.-]|$)|(?:current|candidate)-v\d/iu.test(absolute), "FRESH_BLIND_PUBLIC_PATH_NOT_NEUTRAL");
  need(!sourceIdentity.test(absolute) && !/\b[a-f0-9]{40,64}\b/iu.test(absolute), "FRESH_BLIND_PUBLIC_PATH_CONTAINS_IDENTITY");
  return absolute;
}

function selectSlots(inputs, records) {
  need(JSON.stringify(inputs.cases.map(c => c.id)) === JSON.stringify(CASE_IDS), "FRESH_BLIND_CASE_SET_CHANGED");
  need(Array.isArray(records) && records.length <= 8, "FRESH_BLIND_SESSION_COUNT_INVALID");
  const bySlot = new Map();
  for (const record of records) {
    need(record && CASE_IDS.includes(record.caseId) && ["A", "B"].includes(record.anonymousVariantId), "FRESH_BLIND_RECORD_ID_INVALID");
    const key = `${record.caseId}:${record.anonymousVariantId}`;
    need(!bySlot.has(key), "FRESH_BLIND_DUPLICATE_OUTPUT"); bySlot.set(key, record);
  }
  return inputs.cases.flatMap(c => ["A", "B"].map(variant => {
    const record = bySlot.get(`${c.id}:${variant}`);
    let state = "not_started";
    if (record) {
      state = "stopped";
      if (!record.errorCode && record.finalDeliveryDisposition === "ready_local_only" && record.finalOutput?.eligibility === "ready") state = "completed";
      else if (!record.errorCode && record.finalDeliveryDisposition === "needs_more_information" && typeof record.finalOutput?.clarification?.question === "string" && record.finalOutput.clarification.question.trim()) state = "clarification";
    }
    // Whitelist renderer inputs. A stopped record's failed/intermediate report
    // never enters the renderer, even if it is present elsewhere in the record.
    const renderRecord = { caseId: c.id, anonymousVariantId: variant,
      finalDeliveryDisposition: state === "completed" ? "ready_local_only" : state === "clarification" ? "needs_more_information" : "technical_stop",
      finalOutput: state === "completed" ? record.finalOutput : state === "clarification" ? { clarification: { question: record.finalOutput.clarification.question } } : null };
    return { caseId: c.id, variant, state, actualRecord: !!record, renderRecord };
  }));
}

function htmlRange(html, caseId, variant) {
  const caseStart = html.indexOf(`<section class="case"><h2>Case ${caseId}</h2>`);
  need(caseStart >= 0, "FRESH_BLIND_CASE_MISSING");
  const header = `<section class="output"><h3 class="output-label">Output ${variant}</h3>`;
  const headerStart = html.indexOf(header, caseStart);
  const nextCase = html.indexOf('<section class="case">', caseStart + 1);
  need(headerStart >= 0 && (nextCase < 0 || headerStart < nextCase), "FRESH_BLIND_OUTPUT_MISSING");
  const start = headerStart + header.length;
  const marker = variant === "A" ? '<section class="output"><h3 class="output-label">Output B</h3>' : `<form data-case="${caseId}"`;
  const outerEnd = html.indexOf(marker, start);
  need(outerEnd >= 0 && html.slice(start, outerEnd).endsWith("</section>"), "FRESH_BLIND_OUTPUT_SHAPE_INVALID");
  return { start, end: outerEnd - "</section>".length };
}

function markdownRange(md, caseId, variant) {
  const caseStart = md.indexOf(`## Case ${caseId}\n\n`);
  need(caseStart >= 0, "FRESH_BLIND_MARKDOWN_CASE_MISSING");
  const marker = `### Output ${variant}\n\n`, header = md.indexOf(marker, caseStart);
  const nextCase = md.indexOf("## Case ", caseStart + 1);
  need(header >= 0 && (nextCase < 0 || header < nextCase), "FRESH_BLIND_MARKDOWN_OUTPUT_MISSING");
  const start = header + marker.length;
  const end = md.indexOf(variant === "A" ? "\n\n### Output B" : "\n\n### Human questions", start);
  need(end >= 0, "FRESH_BLIND_MARKDOWN_OUTPUT_SHAPE_INVALID"); return { start, end };
}

function applyReplacements(text, changes) {
  for (const { start, end, value } of changes.sort((a, b) => b.start - a.start)) text = text.slice(0, start) + value + text.slice(end);
  return text;
}

const statusText = state => state === "stopped"
  ? "回答未成立です。生成途中の回答は表示していません。"
  : "未実施です。追加生成による補完はしていません。";
const badge = state => `<p class="output-state" data-output-state="${state}">状態：${LABELS[state]}</p>`;
const stripBadge = body => body.replace(/^<p class="output-state" data-output-state="(?:completed|clarification|stopped|not_started)">[^<]*<\/p>/u, "");
const forms = html => [...html.matchAll(/<form data-case="[^"]+"[\s\S]*?<\/form>/gu)].map(m => m[0]);
const scripts = html => [...html.matchAll(/<script>[\s\S]*?<\/script>/gu)].map(m => m[0]);

function verifyText({ html, md, css, slots, runName, reference = null }) {
  need(!sourceIdentity.test(html + md + css) && !credentialOrInternal.test(html + md + css), "FRESH_BLIND_INTERNAL_IDENTITY_LEAK");
  need(forms(html).length === 4, "FRESH_BLIND_QUESTION_FORMS_MISSING");
  need(!/<input[^>]*\bchecked\b/u.test(html) && !/<textarea[^>]*>[^<]+<\/textarea>/u.test(html), "FRESH_BLIND_HUMAN_ANSWERS_PREFILLED");
  need(html.includes(`moon-reply-${runName}-human-answers`), "FRESH_BLIND_STORAGE_KEY_MISMATCH");
  const stateRows = [];
  for (const slot of slots) {
    const h = htmlRange(html, slot.caseId, slot.variant), body = html.slice(h.start, h.end);
    const m = markdownRange(md, slot.caseId, slot.variant), mdBody = md.slice(m.start, m.end);
    need(body.startsWith(badge(slot.state)) && mdBody.startsWith(`状態：${LABELS[slot.state]}\n\n`), "FRESH_BLIND_OUTPUT_STATE_MISMATCH");
    if (["stopped", "not_started"].includes(slot.state)) {
      need(stripBadge(body) === `<div class="status"><p>${esc(statusText(slot.state))}</p></div>`, "FRESH_BLIND_FAILED_OUTPUT_EXPOSED");
      need(mdBody === `状態：${LABELS[slot.state]}\n\n${statusText(slot.state)}`, "FRESH_BLIND_FAILED_MARKDOWN_EXPOSED");
    } else if (reference) {
      const oldH = htmlRange(reference.html, slot.caseId, slot.variant), oldM = markdownRange(reference.md, slot.caseId, slot.variant);
      need(stripBadge(body) === reference.html.slice(oldH.start, oldH.end), "FRESH_BLIND_SUCCESSFUL_HTML_CHANGED");
      need(mdBody.slice(`状態：${LABELS[slot.state]}\n\n`.length) === reference.md.slice(oldM.start, oldM.end), "FRESH_BLIND_SUCCESSFUL_MARKDOWN_CHANGED");
    }
    stateRows.push({ caseId: slot.caseId, anonymousVariantId: slot.variant, state: slot.state, realSessionRecord: slot.actualRecord });
  }
  if (reference) {
    need(JSON.stringify(forms(html)) === JSON.stringify(forms(reference.html)), "FRESH_BLIND_QUESTIONS_CHANGED");
    need(JSON.stringify(scripts(html)) === JSON.stringify(scripts(reference.html)), "FRESH_BLIND_REVIEW_STORAGE_CODE_CHANGED");
  }
  return stateRows;
}

/** Render only this fresh run. Display placeholders are never actual sessions. */
export async function writeFreshBlindArtifacts({ runDirectory, inputs, records, summary }) {
  const destination = requireNeutralPublicPath(runDirectory), runName = path.basename(destination), slots = selectSlots(inputs, records);
  const stopReason = summary?.globalStop ?? summary?.stopReason ?? null;
  const internal = path.join(destination, "internal");
  need(!existsSync(path.join(internal, "fresh-blind-render-verification.json")), "FRESH_BLIND_ALREADY_WRITTEN");
  mkdirSync(internal, { recursive: true });
  // Keep the same basename for the unchanged renderer's storage key. Generated
  // files stay internal until verification; no old run is copied or consulted.
  const staging = path.join(mkdtempSync(path.join(internal, "blind-render-")), runName);
  mkdirSync(path.join(staging, "internal"), { recursive: true });
  await writeBlindArtifacts({ runDirectory: staging, inputs,
    records: slots.map(slot => slot.renderRecord), summary: { stopReason } });
  const reference = { html: read(path.join(staging, "blind-review.html")), md: read(path.join(staging, "blind-review.md")) };
  const htmlChanges = [], mdChanges = [];
  for (const slot of slots) {
    const h = htmlRange(reference.html, slot.caseId, slot.variant), m = markdownRange(reference.md, slot.caseId, slot.variant);
    const terminalWithoutAnswer = ["stopped", "not_started"].includes(slot.state);
    const body = terminalWithoutAnswer ? `<div class="status"><p>${esc(statusText(slot.state))}</p></div>` : reference.html.slice(h.start, h.end);
    const mdBody = terminalWithoutAnswer ? statusText(slot.state) : reference.md.slice(m.start, m.end);
    htmlChanges.push({ ...h, value: badge(slot.state) + body });
    mdChanges.push({ ...m, value: `状態：${LABELS[slot.state]}\n\n${mdBody}` });
  }
  const html = applyReplacements(reference.html, htmlChanges), md = applyReplacements(reference.md, mdChanges);
  const css = read(path.join(staging, "blind-review.css")) + '\n.output-state{display:inline-block;border:1px solid #7c7285;border-radius:6px;padding:6px 10px;margin:6px 0 18px;font-size:14px}\n';
  const stateRows = verifyText({ html, md, css, slots, runName, reference });
  const integrity = {
    comparedCaseIds: [...CASE_IDS], outputLabels: ["A", "B"], mappingDisplayed: false, humanAnswersPrefilled: false,
    realSessionsPresented: records.length, placeholderDisplaySlots: 8 - records.length, stopped: !!stopReason,
    outputStates: stateRows, successfulBodyAndClarificationUnchanged: true, questionsAndStorageCodeUnchanged: true,
    placeholderRecordsAreNotSessions: true,
  };
  const generated = { "blind-review.html": html, "blind-review.md": md, "blind-review.css": css,
    "blind-integrity-check.json": JSON.stringify(integrity, null, 2) + "\n" };
  // Only these freshly generated presentation files may be replaced. Raw
  // receipts/ledger/STOP/mapping/Human answers are not accessed or overwritten.
  for (const file of PUBLIC_FILES) writeFileSync(path.join(destination, file), generated[file]);
  for (const file of ["review-renderer.mjs", "review-renderer.css"]) {
    const source = path.join(staging, "internal", file);
    if (existsSync(source)) writeFileSync(path.join(internal, file), readFileSync(source));
  }
  const audit = { schemaVersion: "fresh-blind-render-verification-v1", actualApiCallsAdded: 0, oldRunReads: 0,
    referenceFormsSha256: digest(JSON.stringify(forms(reference.html))), referenceScriptSha256: digest(JSON.stringify(scripts(reference.html))),
    referenceSuccessfulBodyHashes: slots.filter(s => ["completed", "clarification"].includes(s.state)).map(s => {
      const range = htmlRange(reference.html, s.caseId, s.variant);
      return { caseId: s.caseId, anonymousVariantId: s.variant, htmlBodySha256: digest(reference.html.slice(range.start, range.end)) };
    }), ...integrity };
  writeFileSync(path.join(internal, "fresh-blind-render-verification.json"), JSON.stringify(audit, null, 2) + "\n", { flag: "wx" });
  return { publicArtifact: path.join(destination, "blind-review.html"), realSessionsPresented: records.length,
    outputStates: stateRows, successfulBodiesUnchanged: true, mappingDisplayed: false, actualApiCallsAdded: 0 };
}

/** Read-only checks of the newly generated public artifacts; no stage calls. */
export function verifyFreshBlindArtifacts({ runDirectory, inputs, records }) {
  const destination = requireNeutralPublicPath(runDirectory), slots = selectSlots(inputs, records);
  const html = read(path.join(destination, "blind-review.html"));
  const stateRows = verifyText({ html, md: read(path.join(destination, "blind-review.md")),
    css: read(path.join(destination, "blind-review.css")), slots, runName: path.basename(destination) });
  const integrity = JSON.parse(read(path.join(destination, "blind-integrity-check.json")));
  need(integrity.realSessionsPresented === records.length && integrity.placeholderDisplaySlots === 8 - records.length && JSON.stringify(integrity.outputStates) === JSON.stringify(stateRows), "FRESH_BLIND_DISPLAY_ACCOUNTING_MISMATCH");
  const audit = JSON.parse(read(path.join(destination, "internal/fresh-blind-render-verification.json")));
  need(audit.referenceFormsSha256 === digest(JSON.stringify(forms(html))) && audit.referenceScriptSha256 === digest(JSON.stringify(scripts(html))), "FRESH_BLIND_QUESTION_OR_STORAGE_AUDIT_MISMATCH");
  for (const reference of audit.referenceSuccessfulBodyHashes) {
    const range = htmlRange(html, reference.caseId, reference.anonymousVariantId);
    need(reference.htmlBodySha256 === digest(stripBadge(html.slice(range.start, range.end))), "FRESH_BLIND_SUCCESSFUL_BODY_AUDIT_MISMATCH");
  }
  return { verification: "PASS", realSessionsPresented: records.length, outputStates: stateRows, mappingDisplayed: false, actualApiCallsAdded: 0 };
}
