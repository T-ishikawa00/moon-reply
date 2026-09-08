import fs from 'node:fs';
import assert from 'node:assert/strict';
import test from 'node:test';
import { captureOnce, hash, budget, safeHeaders, EXPECTED_BODY, assertPricing, assertReviewedSources } from './diagnostic.mjs';
const base = 'evals/paid-delivery-step1b/test-evidence';
fs.mkdirSync(base, { recursive: true });
const body = JSON.parse(fs.readFileSync('evals/blind-runs/2026-09-09-final-v17-v19l5-01/internal/5360cb54-0d84-4d75-9b3e-36cba9619545/call-3-request.json')).body;
const key = 'offline-sentinel-credential-never-real';
const read = f => JSON.parse(fs.readFileSync(f, 'utf8'));
const previousFetch = globalThis.fetch;
globalThis.fetch = () => { throw Error('NO_NETWORK_IN_TEST'); };
test.after(() => { globalThis.fetch = previousFetch; });

test('exact rejected request pin and hard cap', () => {
  assert.equal(hash(body), EXPECTED_BODY);
  assert.ok(budget(body).reservedUsd < 0.2);
  assert.throws(() => budget({ ...body, max_output_tokens: 1000000 }), /BUDGET/);
});
test('400 preserves complete body, exact error and request ID without credential headers', async () => {
  const directory = fs.mkdtempSync(`${base}/400-`);
  let calls = 0;
  const error = { type: 'invalid_request_error', code: 'invalid_json_schema', param: 'text.format.schema', message: 'Authored exact diagnostic message.', extra: { detail: 'keep all structured fields' } };
  const raw = JSON.stringify({ error }, null, 3);
  const result = await captureOnce({ body, apiKey: key, directory, fetchImpl: async (url, options) => {
    calls++; assert.equal(options.body, JSON.stringify(body)); assert.equal(options.redirect, 'error');
    return new Response(raw, { status: 400, headers: { 'x-request-id': 'req_authored_400', 'content-type': 'application/json',
      'authorization': key, 'set-cookie': key, 'cookie': key, 'x-api-key': key } });
  } });
  assert.equal(calls, 1); assert.equal(result.outcome, 'SCHEMA_REJECTION_REPRODUCED');
  assert.equal(result.errorClass, 'BadRequestError'); assert.equal(result.requestId, 'req_authored_400');
  assert.deepEqual(result.completeStructuredError, error); assert.equal(result.message, error.message);
  assert.equal(fs.readFileSync(`${directory}/raw-response-body.txt`, 'utf8'), raw);
  assert.equal(hash(fs.readFileSync(`${directory}/wire-request-body.json`)), EXPECTED_BODY);
  for (const file of fs.readdirSync(directory)) assert.ok(!fs.readFileSync(`${directory}/${file}`, 'utf8').includes(key));
  await assert.rejects(captureOnce({ body, apiKey: key, directory, fetchImpl: async () => { calls++; throw Error('SECOND_CALL'); } }));
  assert.equal(calls, 1);
});
test('SDK retryable 429/500 responses still issue one call only', async () => {
  for (const status of [429, 500]) {
    const directory = fs.mkdtempSync(`${base}/${status}-`); let calls = 0;
    await captureOnce({ body, apiKey: key, directory, fetchImpl: async () => {
      calls++; return new Response(JSON.stringify({ error: { message: 'Authored failure', type: 'test', code: 'test' } }),
        { status, headers: { 'content-type': 'application/json', 'x-request-id': `req_${status}`, 'retry-after': '0' } });
    } });
    assert.equal(calls, 1);
  }
});
test('200 records status IDs and cost without claiming schema fixed', async () => {
  const directory = fs.mkdtempSync(`${base}/200-`); let calls = 0;
  const result = await captureOnce({ body, apiKey: key, directory, fetchImpl: async () => {
    calls++; return new Response(JSON.stringify({ id: 'resp_authored', object: 'response', status: 'incomplete', model: body.model,
      service_tier: 'default', output: [], usage: { input_tokens: 100, output_tokens: 20, input_tokens_details: { cached_tokens: 0, cache_write_tokens: 0 } } }),
    { status: 200, headers: { 'content-type': 'application/json', 'x-request-id': 'req_200' } });
  } });
  assert.equal(calls, 1); assert.equal(result.outcome, 'REJECTION_NOT_REPRODUCED'); assert.equal(result.requestId, 'req_200');
  assert.equal(result.outputStatus, 'incomplete'); assert.equal(result.qualityEvaluation, false); assert.ok(result.accounting.costUpperUsd < 0.2);
});
test('credential echoed in raw error is redacted and marked; safe text preserved', async () => {
  const directory = fs.mkdtempSync(`${base}/redact-`);
  await captureOnce({ body, apiKey: key, directory, fetchImpl: async () => new Response(JSON.stringify({ error: { message: `echo ${key} keep this detail`, type: 'test' } }), { status: 400, headers: { 'content-type': 'application/json', 'x-request-id': 'req_redact' } }) });
  for (const file of fs.readdirSync(directory)) assert.ok(!fs.readFileSync(`${directory}/${file}`, 'utf8').includes(key));
  assert.equal(read(`${directory}/raw-response.json`).rawBodyCredentialRedacted, true);
  assert.ok(read(`${directory}/result.json`).message.includes('keep this detail'));
});
test('request/schema mutation is blocked before fetch', async () => {
  for (const mutation of [b => b.reasoning.effort = 'medium', b => b.text.format.schema.title = 'changed']) {
    const edited = structuredClone(body); mutation(edited); let calls = 0;
    await assert.rejects(captureOnce({ body: edited, apiKey: key, directory: base, fetchImpl: async () => { calls++; } }), /EXACT_REQUEST/);
    assert.equal(calls, 0);
  }
});
test('transport failure remains consumed with no second request', async () => {
  const directory = fs.mkdtempSync(`${base}/unknown-`); let calls = 0;
  const result = await captureOnce({ body, apiKey: key, directory, fetchImpl: async () => { calls++; throw Error('Authored network uncertainty'); } });
  assert.equal(calls, 1); assert.equal(result.outcome, 'DIAGNOSTIC_FAILURE');
  assert.ok(fs.existsSync(`${directory}/consumed.lock.json`));
});
test('response header allowlist excludes credential-bearing values', () => {
  assert.deepEqual(safeHeaders(new Headers({ 'x-request-id': 'req_1', 'authorization': key, cookie: key, 'set-cookie': key, 'x-api-key': key })), { 'x-request-id': 'req_1' });
});
test('invalid/stale pricing timestamps cannot pass freshness guard', () => {
  const price = { verifiedAt: new Date().toISOString(), model: 'gpt-5.6-luna', input: 0.2, cached: 0.02, cacheWrite: 0.25, output: 1.2 };
  assert.doesNotThrow(() => assertPricing(price));
  for (const verifiedAt of [undefined, 'invalid', '2000-01-01T00:00:00Z']) assert.throws(() => assertPricing({ ...price, verifiedAt }), /PRICING/);
});
test('stale review or missing source binding cannot pass', () => {
  const hashes = { 'diagnostic.mjs': 'current' };
  assert.doesNotThrow(() => assertReviewedSources(hashes, [{ status: 'PASS', sourceHashes: hashes }]));
  for (const sourceHashes of [undefined, { 'diagnostic.mjs': 'old' }]) assert.throws(() => assertReviewedSources(hashes, [{ status: 'PASS', sourceHashes }]), /SOURCE_MISMATCH/);
});
test('request ID and SDK-success identifiers cannot leak a credential', async () => {
  const directory = fs.mkdtempSync(`${base}/identifier-`);
  const result = await captureOnce({ body, apiKey: key, directory, fetchImpl: async () => new Response(JSON.stringify({ id: key, object: 'response', status: 'completed', output: [] }), { status: 200, headers: { 'content-type': 'application/json', 'x-request-id': key } }) });
  assert.equal(result.requestId, '[REDACTED_CREDENTIAL]'); assert.equal(result.responseId, '[REDACTED_CREDENTIAL]');
  for (const file of fs.readdirSync(directory)) assert.ok(!fs.readFileSync(`${directory}/${file}`, 'utf8').includes(key));
});
