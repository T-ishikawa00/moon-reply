import fs from 'node:fs';
import assert from 'node:assert/strict';
import Ajv2020 from 'ajv/dist/2020.js';
import { loadV19L5StageCatalog } from '../../lib/assessment/runtime/v19-l5-stage-catalog.ts';
import { loadM2P4FinalProductRecoveryRuntimeStageCatalog } from '../../lib/assessment/runtime/schema-catalog.ts';
import { toOpenAiStructuredOutputSchema } from '../../lib/assessment/runtime/openai-schema.ts';
import { buildBody } from '../guidance-quality-wave1/real-pilot/transport.mjs';
import { normalizeEvaluationSchema } from './normalize.mjs';
import { validateCompatibility } from '../paid-delivery-step1/compatibility.mjs';
import { hash, canonical, budget } from '../paid-delivery-step1b/diagnostic.mjs';

const dir = 'evals/paid-delivery-step1c/evidence';
fs.mkdirSync(dir, { recursive: true });
const read = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const write = (name, value) => fs.writeFileSync(`${dir}/${name}`, JSON.stringify(value, null, 2) + '\n');
const requestPath = 'evals/paid-delivery-step1c/fixtures/failing-request.json';
const failing = read(requestPath), oldSchema = failing.body.text.format.schema;
assert.equal(hash(canonical(oldSchema)), 'cb8317f7b0b47e2cba0b20a3d46dded0356bb9f9e70df5afc4ab593f648e67c0');
assert.equal(hash(canonical(failing.body)), '9213aca03565a04253593dd02d0c88880c279c25ee9dca0cb26294855cccdec5');
const exact = normalizeEvaluationSchema(oldSchema);
write('exact-normalization.json', exact.report);
write('normalized-schema.json', exact.schema);
const cap = read('evals/guidance-quality-v19-l5/final-qa/plan.json').caps.find(c => c.stage === failing.q.stageId);
const body = buildBody(failing.q, cap);
assert.deepEqual(body.text.format.schema, exact.schema);
const restored = structuredClone(body); restored.text.format.schema = oldSchema;
assert.deepEqual(restored, failing.body, 'Only text.format.schema may change');
write('acceptance-request.json', body);

let realNetworkAttempts = 0;
const previousFetch = globalThis.fetch;
globalThis.fetch = () => { realNetworkAttempts++; throw Error('NO_NETWORK_PREFLIGHT'); };
const rows = [];
try {
  const catalogs = { V17: await loadM2P4FinalProductRecoveryRuntimeStageCatalog(), 'V19-L5': await loadV19L5StageCatalog() };
  for (const [version, catalog] of Object.entries(catalogs)) {
    for (const definition of catalog.definitions) {
      const variants = [definition, ...(definition.reportFactRepair ? [{ ...definition, ...definition.reportFactRepair }] : [])];
      for (const variant of variants) {
        for (const key of ['outputSchema', 'groundedOutputSchema', 'clarificationOutputSchema']) {
          if (!variant[key]) continue;
          const source = variant[key], projected = toOpenAiStructuredOutputSchema(source);
          const normalized = normalizeEvaluationSchema(projected), repeated = normalizeEvaluationSchema(structuredClone(projected));
          assert.equal(JSON.stringify(normalized.schema), JSON.stringify(repeated.schema));
          assert.equal(JSON.stringify(normalizeEvaluationSchema(normalized.schema).schema), JSON.stringify(normalized.schema));
          const compatibility = validateCompatibility(normalized.schema);
          assert.equal(compatibility.status, 'PASS', `${version}/${variant.schemaName}/${key}: ${JSON.stringify(compatibility)}`);
          const sent = buildBody({ ...variant, outputSchema: source, input: { synthetic_static_preflight: true } }, { outputIncludingReasoning: 8192 });
          assert.deepEqual(sent.text.format.schema, normalized.schema);
          let nestedDefinitionContainers = 0, nestedDefinitionTargetRefs = 0;
          function checkTopology(node, path = '#') {
            if (!node || typeof node !== 'object') return;
            if (path !== '#' && node.$defs && Object.keys(node.$defs).length) nestedDefinitionContainers++;
            if (typeof node.$ref === 'string' && node.$ref.includes('/$defs/') && !/^#\/\$defs\/[^/]+(?:\/(?!\$defs\/).*)?$/.test(node.$ref)) nestedDefinitionTargetRefs++;
            for (const [key, child] of Object.entries(node)) checkTopology(child, `${path}/${key}`);
          }
          checkTopology(normalized.schema);
          assert.equal(nestedDefinitionContainers, 0); assert.equal(nestedDefinitionTargetRefs, 0);
          if (version === 'V17') assert.equal(JSON.stringify(normalized.schema), JSON.stringify(projected), 'V17 must pass through byte-identically');
          rows.push({ version, stage: variant.stageId, name: variant.schemaName, variant: key,
            unchanged: JSON.stringify(projected) === JSON.stringify(normalized.schema), oldSchemaHash: hash(projected),
            normalizedSchemaHash: hash(normalized.schema), canonicalSchemaHash: hash(canonical(normalized.schema)),
            compatibility, normalization: normalized.report, nestedDefinitionContainers, nestedDefinitionTargetRefs,
            deterministic: true, idempotent: true, pipelineConnected: true });
        }
      }
    }
  }
} finally { globalThis.fetch = previousFetch; }
assert.equal(rows.length, 19);
assert.equal(realNetworkAttempts, 0);
const ajv = new Ajv2020({ strict: false }), before = ajv.compile(oldSchema), after = ajv.compile(exact.schema);
const success = read('evals/paid-delivery-step1c/fixtures/successful-base-response.json');
const fixture = { schema_version: 'v19-l5-base-intent-v1', base_intake: JSON.parse(success.output_text), request_intent: {
  message_task: 'NONE', decision_requested: true, decision_explicitly_excluded: false,
  communication_purpose: 'FIRST_INVITATION', evidence_fact_ids: ['F001'], source_excerpt: 'Local structural fixture only.' } };
const badEnum = structuredClone(fixture); badEnum.base_intake.relationship_stage = 'INVALID_ENUM_VALUE';
const extra = structuredClone(fixture); extra.base_intake.extra = true;
for (const [value, expected] of [[fixture, true], [badEnum, false], [extra, false]]) {
  assert.equal(before(value), expected); assert.equal(after(value), expected);
}
write('all-schema-preflight.json', { status: 'PASS', count: rows.length, actualOutputAndRepairContracts: 15,
  additionalRetainedBaseAndClarificationContracts: 4, v17PassThrough: rows.filter(r => r.version === 'V17').length,
  changedContracts: rows.filter(r => !r.unchanged).map(r => ({ version: r.version, stage: r.stage, name: r.name, variant: r.variant })),
  rows, threeFixtures: 'PASS', networkAttempts: realNetworkAttempts });
write('acceptance-preflight.json', { caseId: 'GQ-05', candidate: 'V19-L5', stage: 'PB-01',
  endpoint: 'https://api.openai.com/v1/responses', method: 'POST', sdk: { name: 'openai', version: read('node_modules/openai/package.json').version },
  model: body.model, reasoning: body.reasoning, serviceTier: body.service_tier, retry: 0, maxHttp: 1,
  requestOptions: { maxRetries: 0, timeout: 180000 }, onlySchemaChanged: true,
  oldSchemaHash: hash(oldSchema), normalizedSchemaHash: hash(exact.schema), requestHash: hash(body),
  canonicalSchemaHash: hash(canonical(exact.schema)), canonicalRequestHash: hash(canonical(body)),
  schemaBytes: Buffer.byteLength(JSON.stringify(exact.schema)), reservation: budget(body),
  qualityEvaluation: false, productionData: 0 });
console.log(JSON.stringify({ status: 'PASS', schemas: rows.length, v17PassThrough: rows.filter(r => r.version === 'V17').length,
  changed: rows.filter(r => !r.unchanged).map(r => `${r.version}/${r.stage}/${r.variant}`), fixtures: 3,
  requestHash: hash(body), schemaHash: hash(exact.schema), reservation: budget(body) }));
