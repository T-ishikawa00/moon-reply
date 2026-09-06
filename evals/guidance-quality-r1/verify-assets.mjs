import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Local artifact checks only. No provider SDK, environment-secret reads, or network.
const dir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(dir, "../..");
const baseline = "7db33b03f0348424bb426c8afb6d01ea4e472297";
const allowed = [
  "docs/PRODUCT_SPEC.md",
  "docs/CURRENT_FOCUS.md",
  "docs/CODEX_HANDOFF.md",
  "docs/product/GUIDANCE_QUALITY_R1.md",
  "docs/product/GUIDANCE_QUALITY_R1_SOURCE_REVIEW.md",
  "evals/guidance-quality-r1/cases.json",
  "evals/guidance-quality-r1/evaluation-plan.md",
  "evals/guidance-quality-r1/candidate-prompts.md",
  "evals/guidance-quality-r1/editorial-examples.md",
  "evals/guidance-quality-r1/verify-assets.mjs",
];
const git = (...args) => execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();
const nonempty = (value) => typeof value === "string" && value.trim().length > 0;
const jsonEqual = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const raw = readFileSync(path.join(dir, "cases.json"));
const data = JSON.parse(raw.toString("utf8"));
assert.equal(data.baseline_sha, baseline);
assert.equal(data.status, "expectations_defined_before_any_model_run");
assert.equal(data.execution.real_model_runs, 0);
assert.equal(data.execution.production_calls, 0);
assert.equal(data.execution.actual_wait_prevalence, "UNKNOWN");
assert.equal(data.common_controls.synthetic_only, true);
assert.equal(data.cases.length, 30);
assert.ok(data.cases.length >= 20 && data.cases.length <= 30);
const ids = new Set();
for (const c of data.cases) {
  assert.match(c.id, /^GQ-\d{2}$/);
  assert.ok(!ids.has(c.id), `duplicate case ${c.id}`);
  ids.add(c.id);
  for (const key of ["scene", "decision_to_make"]) assert.ok(nonempty(c[key]), `${c.id}: ${key}`);
  assert.equal(typeof c.consultation, "string");
  if (c.id !== "GQ-21") assert.ok(nonempty(c.consultation));
  assert.ok(c.facts && Object.keys(c.facts).length > 0);
  assert.ok(c.unknowns.length > 0 && c.unknowns.every(nonempty));
  assert.ok(c.acceptable_directions.length > 0);
  for (const a of c.acceptable_directions) assert.ok(nonempty(a.direction) && nonempty(a.reason));
  assert.ok(c.unacceptable_answers.length > 0 && c.unacceptable_answers.every(nonempty));
  const change = c.one_fact_change;
  assert.ok(Object.hasOwn(c.facts, change.fact_key), `${c.id}: counterfactual key`);
  assert.ok(jsonEqual(c.facts[change.fact_key], change.current), `${c.id}: current fact`);
  assert.ok(!jsonEqual(change.current, change.changed), `${c.id}: fact must change`);
  assert.ok(nonempty(change.judgment_effect));
}
assert.equal(data.pairs.filter(p => p.type === "wording_only").length, 3);
assert.equal(data.pairs.filter(p => p.type === "single_fact").length, 7);
const pairIds = new Set();
for (const pair of data.pairs) {
  assert.ok(!pairIds.has(pair.id));
  pairIds.add(pair.id);
  assert.equal(pair.members.length, 2);
  const [a, b] = pair.members.map(id => {
    assert.ok(ids.has(id), `${pair.id}: unknown case`);
    return data.cases.find(c => c.id === id);
  });
  const keys = [...new Set([...Object.keys(a.facts), ...Object.keys(b.facts)])].sort();
  const changed = keys.filter(k => !jsonEqual(a.facts[k], b.facts[k]));
  assert.deepEqual(changed, [...pair.changed_fact_keys].sort(), `${pair.id}: exact fact delta`);
  if (pair.type === "wording_only") {
    assert.equal(changed.length, 0);
    assert.deepEqual(a.unknowns, b.unknowns);
    assert.notEqual(a.consultation, b.consultation);
    assert.deepEqual(a.acceptable_directions.map(x => x.direction).sort(),
      b.acceptable_directions.map(x => x.direction).sort());
  } else {
    assert.equal(pair.type, "single_fact");
    assert.equal(changed.length, 1);
  }
}
assert.ok(data.cases.some(c => c.acceptable_directions.length > 1));
for (const id of ["GQ-21", "GQ-22", "GQ-23", "GQ-13", "GQ-11", "GQ-18"]) assert.ok(ids.has(id));

// Validate local links only in the task's Markdown files, without opening URLs.
let links = 0;
for (const rel of allowed) {
  assert.ok(existsSync(path.join(root, rel)), `missing artifact ${rel}`);
  if (!rel.endsWith(".md")) continue;
  const source = readFileSync(path.join(root, rel), "utf8");
  // Old linked snapshots are outside this task; validate all links only in new docs.
  if (!rel.startsWith("docs/product/") && !rel.startsWith("evals/guidance-quality-r1/")) continue;
  for (const match of source.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
    const target = match[1].split("#")[0];
    if (!target || /^[a-z][a-z0-9+.-]*:/i.test(target)) continue;
    assert.ok(existsSync(path.resolve(path.dirname(path.join(root, rel)), target)), `${rel}: broken link ${target}`);
    links += 1;
  }
}
assert.equal(git("branch", "--show-current"), "release/private-ready");
const changes = [...git("diff", "--name-only", baseline).split(/\r?\n/),
  ...git("ls-files", "--others", "--exclude-standard").split(/\r?\n/)].filter(Boolean);
for (const rel of changes) assert.ok(allowed.includes(rel), `out-of-scope change ${rel}`);
const references = spawnSync("git", ["grep", "-n", "-e", "guidance-quality-r1", "-e", "GUIDANCE_QUALITY_R1",
  "--", "lib", "app", "components", "netlify", "package.json", "next.config.*", "netlify.toml"],
  { cwd: root, encoding: "utf8" });
assert.equal(references.status, 1, `runtime must not reference candidate assets: ${references.stdout || references.stderr}`);
console.log(JSON.stringify({
  result: "PASS",
  cases: data.cases.length,
  wordingPairs: 3,
  singleFactPairs: 7,
  checkedLocalLinks: links,
  allowedFiles: allowed.length,
  baseline,
  casesSha256: createHash("sha256").update(raw).digest("hex"),
  runtimeReferences: 0,
  realModelRuns: 0,
  qualityVerdict: "NOT_ESTABLISHED",
  waitPrevalence: "UNKNOWN",
}, null, 2));
