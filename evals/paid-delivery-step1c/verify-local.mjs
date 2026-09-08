import fs from 'node:fs';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { hash } from '../paid-delivery-step1b/diagnostic.mjs';
import { currentSourceHashes } from './verification-contract.mjs';
const root = 'evals/paid-delivery-step1c', dir = `${root}/evidence`, read = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const tests = { 'normalization-tests.tap': 18, 'compatibility-tests.tap': 34, 'diagnostics-tests.tap': 11, 'smoke-tests.tap': 6 };
const testReports = Object.entries(tests).map(([file, count]) => {
  const text = fs.readFileSync(`${dir}/${file}`, 'utf8');
  assert.match(text, new RegExp(`^# pass ${count}$`, 'm')); assert.match(text, /^# fail 0$/m);
  return { file, passed: count, hash: hash(text) };
});
const stdout = fs.readFileSync(`${dir}/runner-regression.stdout.txt`, 'utf8');
const runner = JSON.parse(stdout.trim().split(/\r?\n/).at(-1));
assert.equal(runner.status, 'PASS'); assert.equal(runner.passed, 13); assert.equal(runner.networkAttempts, 0);
fs.writeFileSync(`${dir}/runner-regression.json`, JSON.stringify(runner, null, 2) + '\n');
const all = read(`${dir}/all-schema-preflight.json`), exact = read(`${dir}/exact-normalization.json`);
assert.equal(all.status, 'PASS'); assert.equal(all.count, 19); assert.equal(all.v17PassThrough, 9);
assert.equal(exact.counts.movedDefinitions, 39); assert.equal(exact.counts.rewrittenReferences, 55);
assert.ok(exact.movedDefinitions.every(x => x.graphEquality)); assert.ok(exact.rewrittenReferences.every(x => x.graphEquality));
assert.equal(new Set(exact.movedDefinitions.map(x => x.newPath)).size, 39);
for (const row of all.rows) {
  assert.equal(row.normalization.proof.equal, true); assert.equal(row.normalization.unresolvedReferences, 0);
  assert.equal(row.normalization.overwrites, 0); assert.equal(row.normalization.proof.newCycles, 0);
  assert.equal(row.nestedDefinitionTargetRefs, 0); assert.equal(row.compatibility.status, 'PASS');
}
const baseline = read(`${root}/baseline-files.json`), allowed = new Set(['evals/guidance-quality-wave1/real-pilot/transport.mjs']);
let preserved = 0;
for (const [file, expected] of Object.entries(baseline)) if (!allowed.has(file)) { assert.equal(hash(fs.readFileSync(file)), expected, file); preserved++; }
const identity = read('evals/guidance-quality-v19-l5/candidate-identity.json');
for (const [file, expected] of Object.entries(identity.sourceHashes)) assert.equal(hash(fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n')), expected, file);
execFileSync('git', ['diff', '--check']);
const report = { status: 'PASS', timestamp: new Date().toISOString(), schemas: all.count, runnerGroups: runner.passed,
  tests: testReports, exactDefinitions: 39, exactRefs: 55, duplicateFlattenedNames: 0, unresolvedRefs: 0,
  newCycles: 0, overwrittenDefinitions: 0, fixtures: 3, candidateFilesUnchanged: Object.keys(identity.sourceHashes).length,
  preExistingFilesPreserved: preserved, allowedExistingDiff: [...allowed], sourceHashes: currentSourceHashes(),
  evidenceHashes: Object.fromEntries(['all-schema-preflight.json', 'acceptance-preflight.json', 'acceptance-request.json', 'normalized-schema.json'].map(f => [f, hash(fs.readFileSync(`${dir}/${f}`))])),
  realHttp: 0, productionOperations: 0 };
fs.writeFileSync(`${dir}/local-verification.json`, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ status: 'PASS', schemas: 19, runnerGroups: 13, tests: testReports.map(t => t.passed), candidateFilesUnchanged: report.candidateFilesUnchanged, preserved }));
