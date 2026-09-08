import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import OpenAI from 'openai';
import { save, durable, hash, canonical, budget, cost, sanitizer, safeHeaders, ENDPOINT } from '../paid-delivery-step1b/diagnostic.mjs';

// No execution or credential lookup on import. One prepared request only.
export async function acceptanceOnce({ body, expected, apiKey, directory, fetchImpl, guard = () => {} }) {
  assert.equal(hash(body), expected.requestHash);
  assert.equal(hash(body.text.format.schema), expected.normalizedSchemaHash);
  const clean = sanitizer(apiKey), serialized = JSON.stringify(body), reservation = budget(body);
  assert.ok(apiKey && apiKey.length >= 8); assert.equal(clean(serialized), serialized);
  const hashes = { requestHash: hash(body), schemaHash: hash(body.text.format.schema), canonicalRequestHash: hash(canonical(body)), canonicalSchemaHash: hash(canonical(body.text.format.schema)) };
  let calls = 0, rawCapture = null;
  const client = new OpenAI({ apiKey, organization: null, project: null, baseURL: 'https://api.openai.com/v1',
    maxRetries: 0, timeout: 180000, logLevel: 'off', fetch: async (url, options) => {
      assert.equal(String(url), ENDPOINT); assert.equal(options.method, 'POST'); assert.equal(options.body, serialized); assert.equal(calls, 0);
      guard();
      save(directory, 'consumed.lock.json', { ...hashes, timestamp: new Date().toISOString(), maximumHttp: 1, retries: 0, reservation });
      durable(path.join(directory, 'wire-request-body.json'), options.body);
      calls++;
      const response = await fetchImpl(url, { ...options, redirect: 'error' });
      const raw = await response.clone().text(), sanitized = clean(raw);
      let parsed = null; try { parsed = JSON.parse(sanitized); } catch { /* Preserve non-JSON raw failure. */ }
      rawCapture = JSON.parse(clean(JSON.stringify({ ...hashes, timestamp: new Date().toISOString(), status: response.status,
        requestId: response.headers.get('x-request-id'), headers: safeHeaders(response.headers), structured: parsed, rawBodyCredentialRedacted: raw !== sanitized })));
      durable(path.join(directory, 'raw-response-body.txt'), sanitized); save(directory, 'raw-response.json', rawCapture);
      return response;
    } });
  let result;
  try {
    const data = await client.responses.create(body, { maxRetries: 0, timeout: 180000 });
    const accounting = cost(data.usage);
    const accepted = rawCapture?.status === 200 && Boolean(rawCapture.requestId) && Boolean(data.id) && data.model === body.model &&
      data.service_tier === body.service_tier && ['completed', 'incomplete'].includes(data.status) && accounting.known &&
      data.usage.input_tokens <= reservation.inputTokenUpper && data.usage.output_tokens <= reservation.outputTokenUpper && accounting.costUpperUsd <= reservation.reservedUsd;
    result = { status: accepted ? 'API_ACCEPTANCE_PASS' : 'API_ACCEPTANCE_UNCONFIRMED', ...hashes,
      httpStatus: rawCapture?.status ?? null, requestId: rawCapture?.requestId ?? null, responseId: data.id ?? null,
      model: data.model ?? null, serviceTier: data.service_tier ?? null, outputStatus: data.status ?? null, accounting,
      http: calls, retry: 0, qualityEvaluation: false, timestamp: new Date().toISOString() };
  } catch (error) {
    result = { status: 'API_ACCEPTANCE_FAIL', ...hashes, httpStatus: error.status ?? rawCapture?.status ?? null,
      errorClass: error.constructor?.name ?? null, errorName: error.name ?? null, errorType: error.type ?? null,
      code: error.code ?? null, param: error.param ?? null, message: error.error?.message ?? null, sdkMessage: error.message ?? null,
      completeStructuredError: error.error ?? rawCapture?.structured ?? null,
      requestId: error.requestID ?? rawCapture?.requestId ?? null, http: calls, retry: 0, accounting: cost(null),
      qualityEvaluation: false, timestamp: new Date().toISOString() };
  }
  const sanitizedResult = JSON.parse(clean(JSON.stringify(result)));
  save(directory, 'result.json', sanitizedResult);
  return sanitizedResult;
}
