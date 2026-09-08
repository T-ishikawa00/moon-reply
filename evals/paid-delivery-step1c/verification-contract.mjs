import fs from 'node:fs';
import assert from 'node:assert/strict';
import { hash, assertReviewedSources } from '../paid-delivery-step1b/diagnostic.mjs';

export const REQUIRED_SOURCES = Object.freeze([
  'evals/paid-delivery-step1c/normalize.mjs',
  'evals/paid-delivery-step1c/adapter.mjs',
  'evals/paid-delivery-step1c/preflight.mjs',
  'evals/paid-delivery-step1c/smoke-transport.mjs',
  'evals/paid-delivery-step1c/execute-once.mjs',
  'evals/paid-delivery-step1c/verification-contract.mjs',
  'evals/paid-delivery-step1c/verify-local.mjs',
  'evals/paid-delivery-step1c/normalize.test.mjs',
  'evals/paid-delivery-step1c/smoke.test.mjs',
  'evals/guidance-quality-wave1/real-pilot/transport.mjs',
  'evals/paid-delivery-step1/compatibility.mjs',
  'evals/paid-delivery-step1b/diagnostic.mjs',
  'evals/paid-delivery-step1c/fixtures/failing-request.json',
  'evals/paid-delivery-step1c/fixtures/failing-schema.json',
  'evals/paid-delivery-step1c/fixtures/successful-base-response.json',
  'evals/guidance-quality-v19-l5/final-qa/plan.json',
]);
export const currentSourceHashes = () => Object.fromEntries(REQUIRED_SOURCES.map(f => [f, hash(fs.readFileSync(f))]));
export function verifyRequiredSourceReports(reports, current = currentSourceHashes()) {
  assert.deepEqual(Object.keys(current).sort(), [...REQUIRED_SOURCES].sort(), 'Code-owned source coverage required');
  for (const report of reports) assert.deepEqual(Object.keys(report.sourceHashes ?? {}).sort(), [...REQUIRED_SOURCES].sort(), 'Missing or extra reviewed source coverage');
  assertReviewedSources(current, reports);
  return current;
}
