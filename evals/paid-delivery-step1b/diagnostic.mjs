// Evaluation diagnostics only. No execution or credential lookup on import.
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import OpenAI from 'openai';

export const ENDPOINT = 'https://api.openai.com/v1/responses';
export const EXPECTED_BODY = 'da5340120ef19be6ff409f96b5d984594271ec049780db901d1ddfb1296f3b72';
export const EXPECTED_SCHEMA = '1da8db703e700df37c23efcc8a55ac293bc9756622b4d06485e9c79cad4a4fb7';
export const hash = x => createHash('sha256').update(typeof x === 'string' || x instanceof Uint8Array ? x : JSON.stringify(x)).digest('hex');
export const canonical = x => Array.isArray(x) ? x.map(canonical) : x && typeof x === 'object'
  ? Object.fromEntries(Object.keys(x).sort().map(k => [k, canonical(x[k])])) : x;
export function durable(file, text) {
  const fd = fs.openSync(file, 'wx');
  try { fs.writeFileSync(fd, text); fs.fsyncSync(fd); } finally { fs.closeSync(fd); }
}
export const save = (dir, name, data) => durable(path.join(dir, name), JSON.stringify(data, null, 2) + '\n');
const allowedHeaders = new Set(['x-request-id', 'request-id', 'content-type', 'date', 'openai-processing-ms', 'openai-version', 'retry-after', 'cf-ray']);
export function safeHeaders(headers) {
  return Object.fromEntries([...headers].filter(([name]) => allowedHeaders.has(name.toLowerCase()) || name.toLowerCase().startsWith('x-ratelimit-')));
}
export function sanitizer(secret) {
  return text => String(text).split(secret).join('[REDACTED_CREDENTIAL]')
    .replace(/\bsk-[A-Za-z0-9_-]{12,}\b/g, '[REDACTED_CREDENTIAL]');
}
export function assertPricing(price, now = Date.now()) {
  const verified = Date.parse(price.verifiedAt);
  if (!Number.isFinite(verified) || now - verified < 0 || now - verified > 3600000 ||
    price.model !== 'gpt-5.6-luna' || price.input !== 0.2 || price.cached !== 0.02 || price.cacheWrite !== 0.25 || price.output !== 1.2) throw Error('CURRENT_PRICING_REQUIRED');
}
export function assertReviewedSources(sourceHashes, reports) {
  for (const report of reports) {
    if (report.status !== 'PASS') throw Error('LOCAL_PREFLIGHT_REQUIRED');
    for (const [file, expected] of Object.entries(sourceHashes)) if (report.sourceHashes?.[file] !== expected) throw Error('REVIEWED_SOURCE_MISMATCH');
  }
}
export function budget(body) {
  // Count all JSON UTF-8 bytes plus protocol overhead as an upper input bound.
  // Standard Luna cache writes (the highest input rate) = $0.25 / 1M.
  const inputTokenUpper = Buffer.byteLength(JSON.stringify(body), 'utf8') + 4096;
  const outputTokenUpper = body.max_output_tokens;
  if (inputTokenUpper > 272000 || !Number.isSafeInteger(outputTokenUpper) || outputTokenUpper < 1) throw Error('UNSUPPORTED_BUDGET_PROFILE');
  const reservedUsd = (inputTokenUpper * 0.25 + outputTokenUpper * 1.2) / 1e6;
  if (reservedUsd > 0.20) throw Error('BUDGET_CAP_EXCEEDED');
  return { inputTokenUpper, outputTokenUpper, reservedUsd, hardCapUsd: 0.20, ratesPerMillionUsd: { input: 0.2, cached: 0.02, cacheWrite: 0.25, output: 1.2 } };
}
export function cost(usage) {
  if (!usage) return { known: false, usage: null, costUsd: null };
  const input = usage.input_tokens, output = usage.output_tokens, cached = usage.input_tokens_details?.cached_tokens ?? 0;
  const writes = usage.input_tokens_details?.cache_write_tokens;
  if (![input, output, cached].every(n => Number.isSafeInteger(n) && n >= 0) || cached > input ||
    (writes !== undefined && (!Number.isSafeInteger(writes) || writes < 0 || writes + cached > input))) return { known: false, usage, costUsd: null };
  const lower = ((input - cached - (writes ?? 0)) * 0.2 + cached * 0.02 + (writes ?? 0) * 0.25 + output * 1.2) / 1e6;
  const upper = writes === undefined ? ((input - cached) * 0.25 + cached * 0.02 + output * 1.2) / 1e6 : lower;
  return { known: true, usage, costLowerUsd: lower, costUpperUsd: upper };
}

export async function captureOnce({ body, apiKey, directory, fetchImpl, guard = () => {} }) {
  if (hash(body) !== EXPECTED_BODY || hash(body.text.format.schema) !== EXPECTED_SCHEMA) throw Error('EXACT_REQUEST_MISMATCH');
  const reservation = budget(body), clean = sanitizer(apiKey);
  if (!apiKey || apiKey.length < 8 || clean(JSON.stringify(body)) !== JSON.stringify(body)) throw Error('CREDENTIAL_OR_BODY_GUARD');
  const frozenBody = JSON.stringify(body);
  const hashes = { requestHash: hash(body), schemaHash: hash(body.text.format.schema),
    canonicalRequestHash: hash(canonical(body)), canonicalSchemaHash: hash(canonical(body.text.format.schema)) };
  let dispatches = 0, rawCapture = null;
  const client = new OpenAI({ apiKey, organization: null, project: null, baseURL: 'https://api.openai.com/v1',
    maxRetries: 0, timeout: 180000, logLevel: 'off',
    fetch: async (url, options) => {
      if (String(url) !== ENDPOINT || options.method !== 'POST' || typeof options.body !== 'string' ||
        options.body !== frozenBody || dispatches !== 0) throw Error('EXACT_TRANSPORT_OR_ONE_HTTP_GUARD');
      guard();
      // Persistent one-use marker before fetch: uncertainty never permits reuse.
      save(directory, 'consumed.lock.json', { ...hashes, timestamp: new Date().toISOString(), reservation, retry: 0, maximumHttp: 1 });
      durable(path.join(directory, 'wire-request-body.json'), options.body);
      dispatches++;
      const response = await fetchImpl(url, { ...options, redirect: 'error' });
      const raw = await response.clone().text();
      const sanitized = clean(raw);
      let structured; try { structured = JSON.parse(sanitized); } catch { structured = null; }
      rawCapture = { ...hashes, httpStatus: response.status, timestamp: new Date().toISOString(),
        requestId: response.headers.get('x-request-id') || response.headers.get('request-id') ? clean(response.headers.get('x-request-id') ?? response.headers.get('request-id')) : null,
        headers: JSON.parse(clean(JSON.stringify(safeHeaders(response.headers)))), structured,
        rawBodyCredentialRedacted: sanitized !== raw, rawBodySha256: hash(sanitized) };
      durable(path.join(directory, 'raw-response-body.txt'), sanitized);
      save(directory, 'raw-response.json', rawCapture);
      return response;
    } });
  let result;
  try {
    const data = await client.responses.create(body, { maxRetries: 0, timeout: 180000 });
    const accounting = cost(data.usage);
    result = { outcome: rawCapture?.httpStatus === 200 ? 'REJECTION_NOT_REPRODUCED' : 'RESPONSE_RECEIVED',
      ...hashes, httpStatus: rawCapture?.httpStatus ?? null, requestId: rawCapture?.requestId ?? data._request_id ?? null,
      responseId: data.id ?? null, model: data.model ?? null, serviceTier: data.service_tier ?? null,
      outputStatus: data.status ?? null, accounting, dispatches, retry: 0, qualityEvaluation: false };
  } catch (error) {
    const sanitized = JSON.parse(clean(JSON.stringify({ errorClass: error.constructor?.name ?? null,
      errorName: error.name ?? null, sdkMessage: error.message ?? null, status: error.status ?? rawCapture?.httpStatus ?? null,
      type: error.type ?? null, code: error.code ?? null, param: error.param ?? null,
      message: error.error?.message ?? null, completeStructuredError: error.error ?? rawCapture?.structured ?? null,
      requestId: error.requestID ?? error.request_id ?? rawCapture?.requestId ?? null })));
    result = { outcome: sanitized.status === 400 && sanitized.code === 'invalid_json_schema' ? 'SCHEMA_REJECTION_REPRODUCED' : 'DIAGNOSTIC_FAILURE',
      ...hashes, ...sanitized, timestamp: new Date().toISOString(), dispatches, retry: 0,
      accounting: cost(rawCapture?.structured?.usage), qualityEvaluation: false };
  }
  const safeResult = JSON.parse(clean(JSON.stringify(result)));
  save(directory, 'result.json', safeResult);
  return safeResult;
}
