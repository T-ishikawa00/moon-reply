import fs from 'node:fs';
import assert from 'node:assert/strict';
import test from 'node:test';
import { acceptanceOnce } from './smoke-transport.mjs';
import { hash } from '../paid-delivery-step1b/diagnostic.mjs';
import { REQUIRED_SOURCES, verifyRequiredSourceReports } from './verification-contract.mjs';
const root = 'evals/paid-delivery-step1c', body = JSON.parse(fs.readFileSync(`${root}/evidence/acceptance-request.json`));
const expected = { requestHash: hash(body), normalizedSchemaHash: hash(body.text.format.schema) };
const key = 'offline-authored-secret-not-a-real-key';
fs.mkdirSync(`${root}/test-evidence`, { recursive: true });
const directory = () => fs.mkdtempSync(`${root}/test-evidence/smoke-`);
const prior = globalThis.fetch; globalThis.fetch = () => { throw Error('NETWORK_FORBIDDEN'); }; test.after(() => { globalThis.fetch = prior; });
test('HTTP 200 completed/incomplete both prove schema accepted when usage/IDs are present', async () => {
  for (const status of ['completed', 'incomplete']) {
    let calls = 0;
    const result = await acceptanceOnce({ body, expected, apiKey: key, directory: directory(), fetchImpl: async (_, options) => {
      calls++; assert.equal(options.body, JSON.stringify(body)); assert.equal(options.redirect, 'error');
      return new Response(JSON.stringify({ id: 'resp_fake', object: 'response', status, model: body.model, service_tier: body.service_tier,
        output: [], usage: { input_tokens: 100, output_tokens: 20, input_tokens_details: { cached_tokens: 0, cache_write_tokens: 0 } } }),
        { status: 200, headers: { 'content-type': 'application/json', 'x-request-id': 'req_fake' } });
    } });
    assert.equal(calls, 1); assert.equal(result.status, 'API_ACCEPTANCE_PASS'); assert.equal(result.qualityEvaluation, false);
  }
});
test('400 exact error + request ID retained; second request permanently blocked', async () => {
  const dir = directory(); let calls = 0;
  const error = { message: 'Exact authored missing reference error.', type: 'invalid_request_error', code: 'invalid_json_schema', param: 'text.format.schema' };
  const send = async () => { calls++; return new Response(JSON.stringify({ error }), { status: 400, headers: { 'content-type': 'application/json', 'x-request-id': 'req_400', 'set-cookie': key, authorization: key } }); };
  const result = await acceptanceOnce({ body, expected, apiKey: key, directory: dir, fetchImpl: send });
  assert.equal(calls, 1); assert.equal(result.status, 'API_ACCEPTANCE_FAIL'); assert.equal(result.requestId, 'req_400'); assert.deepEqual(result.completeStructuredError, error);
  await assert.rejects(acceptanceOnce({ body, expected, apiKey: key, directory: dir, fetchImpl: send }));
  assert.equal(calls, 1);
  for (const file of fs.readdirSync(dir)) assert.ok(!fs.readFileSync(`${dir}/${file}`, 'utf8').includes(key));
});
test('retryable response and unknown network outcome never retry', async () => {
  for (const code of [429, 500, null]) {
    let calls = 0;
    const result = await acceptanceOnce({ body, expected, apiKey: key, directory: directory(), fetchImpl: async () => {
      calls++; if (code === null) throw Error('Authored uncertainty');
      return new Response(JSON.stringify({ error: { message: 'Authored error' } }), { status: code, headers: { 'content-type': 'application/json' } });
    } });
    assert.equal(calls, 1); assert.equal(result.status, 'API_ACCEPTANCE_FAIL');
  }
});
test('missing request ID or usage never becomes acceptance PASS', async () => {
  const result = await acceptanceOnce({ body, expected, apiKey: key, directory: directory(), fetchImpl: async () => new Response(JSON.stringify({ id: 'resp_fake', object: 'response', status: 'completed', model: body.model, service_tier: body.service_tier, output: [] }), { status: 200, headers: { 'content-type': 'application/json' } }) });
  assert.equal(result.status, 'API_ACCEPTANCE_UNCONFIRMED');
});
test('schema or non-schema mutation stops before HTTP', async () => {
  for (const change of [b => b.model = 'wrong', b => b.text.format.schema.title = 'wrong']) {
    const edited = structuredClone(body); change(edited); let calls = 0;
    await assert.rejects(acceptanceOnce({ body: edited, expected, apiKey: key, directory: directory(), fetchImpl: async () => { calls++; } }));
    assert.equal(calls, 0);
  }
});
test('empty or partial reviewed source coverage cannot pass', () => {
  const current = Object.fromEntries(REQUIRED_SOURCES.map(f => [f, 'test-hash']));
  assert.doesNotThrow(() => verifyRequiredSourceReports([{ status: 'PASS', sourceHashes: current }], current));
  assert.throws(() => verifyRequiredSourceReports([{ status: 'PASS', sourceHashes: {} }], current));
  const partial = { ...current }; delete partial[REQUIRED_SOURCES[0]];
  assert.throws(() => verifyRequiredSourceReports([{ status: 'PASS', sourceHashes: partial }], current));
  assert.throws(() => verifyRequiredSourceReports([{ status: 'PASS', sourceHashes: current }], {}));
});
