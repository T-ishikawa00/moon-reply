// Static contract and preservation checks. This does not evaluate Japanese output.
import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { loadV19L4StageCatalog } from "../../lib/assessment/runtime/v19-l4-stage-catalog.ts";
import { loadV19L3StageCatalog } from "../../lib/assessment/runtime/v19-l3-stage-catalog.ts";

const root = "lib/assessment/runtime/contracts/";
const output = "evals/guidance-quality-v19-l4/";
const text = file => readFileSync(file, "utf8").replace(/\r\n/gu, "\n");
const json = file => JSON.parse(text(file));
const hash = value => createHash("sha256").update(value).digest("hex");
const results = [];
const check = (name, body) => { body(); results.push({ name, status: "PASS" }); };
const current = await loadV19L4StageCatalog(), old = await loadV19L3StageCatalog();

check("all inherited stage definitions including PB01 PB04 are exactly unchanged", () => {
  assert.equal(current.definitions.length, old.definitions.length);
  for (const definition of current.definitions.filter(d => !["PB-05", "PB-06"].includes(d.stageId))) {
    assert.deepEqual(definition, old.definitions.find(d => d.stageId === definition.stageId));
  }
  assert.deepEqual(current.definitions.find(d => d.stageId === "PB-05").outputSchema,
    old.definitions.find(d => d.stageId === "PB-05").outputSchema);
});

const report = text(`${root}pb-05-v19-l4-fact-precision.developer.md`);
const evaluator = text(`${root}pb-06-v19-l4-post-repair.developer.md`);
check("PB05 preserves predecessor wording outside new fact examples and repair-mode explanation", () => {
  const baseline = text(`${root}pb-05-v19-l3-message-status.developer.md`);
  const restored = report.replace(/^#.*\n/u, baseline.slice(0, baseline.indexOf("\n") + 1))
    .replace(/## Precise factual restatement in every Report surface\n[\s\S]*?(?=## Bounded quality reassessment mode)/u, "");
  assert.equal(restored, baseline);
});
check("fact precision explicitly distinguishes sent delivery read understanding and intent", () => {
  for (const phrase of ["質問は一度送っていて、まだ返事はありません", "質問はすでに届いています",
    "相手はすでに読んでいます", "まだ返信はありません", "相手は返信していません",
    "配達済みの表示が確認できています", "既読表示は付いています", "内容を理解しています",
    "読んだうえで意図的に無視しています", "相手からお礼のメッセージが届いています"]) {
    assert.ok(report.includes(phrase), phrase);
  }
  assert.ok(report.includes("not canned customer copy or a vocabulary detector"));
  assert.ok(report.includes("Do not replace the substantive assessment-note form"));
});
check("PB06 preserves all predecessor temporal and downstream evaluation instructions", () => {
  const baseline = text(`${root}pb-06-v19-l2-temporal-action.developer.md`);
  const marker = "## Temporal scope of ACTION_CONSISTENCY";
  const oldTail = baseline.slice(baseline.indexOf(marker));
  const newTail = evaluator.slice(evaluator.indexOf(marker)).replace(
    "Return the existing findings-only fields plus the nullable repair-verification field defined in this candidate contract.",
    "Return the existing findings-only schema.");
  assert.equal(newTail, oldTail);
});

check("historical runtime contracts and protected Production Safety Paid code stay unchanged", () => {
  const protectedPaths = ["lib/assessment/runtime/contracts", "lib/assessment/runtime/v19-l1-runtime-identity.ts",
    "lib/assessment/runtime/v19-l2-runtime-identity.ts", "lib/assessment/runtime/v19-l3-runtime-identity.ts",
    "lib/assessment/runtime/v19-l1-stage-catalog.ts", "lib/assessment/runtime/v19-l2-stage-catalog.ts",
    "lib/assessment/runtime/v19-l3-stage-catalog.ts", "lib/assessment/runtime/semantic-disposition-v7.ts",
    "lib/assessment/runtime/quality-reassessment-v2.ts", "lib/assessment/runtime/production-runtime.ts",
    "lib/assessment/runtime/customer-assessment-projection-v1.ts",
    "lib/assessment/runtime/customer-assessment-experience-projection-v2.ts", "app", "components",
    "lib/payment", "lib/auth", "supabase", "evals/guidance-quality-r1/cases.json",
    "evals/guidance-quality-wave1/pilot-inputs.json"];
  // Only files already present at the source baseline; new v22 assets are separate.
  const tracked = execFileSync("git", ["ls-tree", "-r", "--name-only", "1b24003d545d16d0102828a3577444d994520f42", "--", ...protectedPaths], { encoding: "utf8" }).trim().split(/\r?\n/u).filter(Boolean);
  const changed = execFileSync("git", ["diff", "--name-only", "1b24003d545d16d0102828a3577444d994520f42", "--", ...tracked], { encoding: "utf8" }).trim();
  assert.equal(changed, "");
});
check("all 243 original fresh-pilot evidence bytes including STOP mapping and ledger match frozen hashes", () => {
  const directory = "evals/blind-runs/2026-09-08-fresh-01/";
  const manifest = json(`${directory}evidence-hashes.json`);
  assert.equal(Object.keys(manifest.files).length, 243);
  for (const [file, expected] of Object.entries(manifest.files)) {
    assert.equal(hash(readFileSync(`${directory}${file}`)), expected, file);
  }
});

const identity = {
  product: "V19-L4", baselineRuntimeHead: "1b24003d545d16d0102828a3577444d994520f42",
  catalog: current.catalogVersion, promptBundle: current.promptBundleVersion, schemaSet: current.schemaSetVersion,
  canonicalization: "LF prompt text; schema hash is SHA256(JSON.stringify(parsed schema)); runtime hash includes common prompt",
  definitions: current.definitions.map(d => ({ stageId: d.stageId, promptVersion: d.promptVersion,
    promptHash: d.promptHash, schemaVersion: d.schemaVersion, schemaHash: d.schemaHash,
    ...(d.reportFactRepair ? { reportFactRepair: { promptVersion: d.reportFactRepair.promptVersion,
      promptHash: d.reportFactRepair.promptHash, schemaVersion: d.reportFactRepair.schemaVersion,
      schemaHash: d.reportFactRepair.schemaHash } } : {}) })),
};
writeFileSync(`${output}catalog-identity.json`, JSON.stringify(identity, null, 2) + "\n");
writeFileSync(`${output}verification-contract-results.json`, JSON.stringify({ pass: true, checks: results.length, results,
  evidenceKind: "STATIC CONTRACT / HASH PRESERVATION ONLY; no model semantic accuracy proof", realApiCalls: 0 }, null, 2) + "\n");
console.log(JSON.stringify({ checks: results.length, pass: true, realApiCalls: 0 }));
