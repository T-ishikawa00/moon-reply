import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { normalizeEvaluationSchema, verifySemanticPreservation } from './normalize.mjs';

const object = properties => ({ type: 'object', properties, required: Object.keys(properties), additionalProperties: false });
function fixture() {
  return object({ envelope: { ...object({ value: { $ref: '#/properties/envelope/$defs/value' } }), $defs: { value: { type: 'string', enum: ['a', 'b'] }, unused: { type: 'integer' } } } });
}
function proof(before) {
  const snapshot = JSON.stringify(before);
  const result = normalizeEvaluationSchema(before);
  assert.equal(JSON.stringify(before), snapshot, 'input must not be mutated');
  assert.equal(result.report.proof.equal, true);
  assert.deepEqual(result.report.proof.differences, []);
  assert.equal(result.report.unresolvedReferences, 0);
  assert.equal(result.report.overwrites, 0);
  assert.equal(result.report.newCycles, 0);
  assert.equal(verifySemanticPreservation(before, result.schema, result.report).equal, true);
  return result;
}
test('real failing schema: 39 moved definitions and 55 rewritten references', () => {
  const before = JSON.parse(readFileSync(new URL('./fixtures/failing-schema.json', import.meta.url), 'utf8'));
  const { schema, report } = proof(before);
  assert.equal(report.counts.movedDefinitions, 39);
  assert.equal(report.counts.rewrittenReferences, 55);
  assert.equal(report.counts.references, 56);
  assert.equal(report.counts.definitions, 40);
  assert.equal(report.proof.pairedNodes, 288);
  assert.ok(report.movedDefinitions.every(move => move.graphEquality));
  assert.ok(report.rewrittenReferences.every(ref => ref.graphEquality));
  assert.equal(Object.keys(schema.$defs).length, 40);
  assert.equal(Object.hasOwn(schema.$defs.legacy_base, '$defs'), false);
  assert.deepEqual(schema.required, before.required);
});
test('pass-through preserves exact serialized JSON including key ordering', () => {
  const before = { title: 'unchanged', ...object({ answer: { enum: [true, false, 'unknown'] } }), $defs: { unused: { const: 'literal' } } };
  const result = proof(before);
  assert.equal(JSON.stringify(result.schema), JSON.stringify(before));
  assert.equal(result.report.passThrough, true);
  assert.equal(result.report.counts.movedDefinitions, 0);
});
test('determinism and idempotence', () => {
  const before = fixture();
  const first = proof(before), again = proof(before), twice = proof(first.schema);
  assert.deepEqual(first, again);
  assert.equal(JSON.stringify(twice.schema), JSON.stringify(first.schema));
  assert.equal(twice.report.passThrough, true);
});
test('root definition name collision never overwrites', () => {
  const before = fixture();
  const generatedName = normalizeEvaluationSchema(before).report.movedDefinitions.find(move => move.oldName === 'value').newName;
  before.$defs = { [generatedName]: { type: 'boolean', description: 'root retained' } };
  const result = proof(before);
  assert.deepEqual(result.schema.$defs[generatedName], before.$defs[generatedName]);
  const moved = result.report.movedDefinitions.find(move => move.oldName === 'value');
  assert.notEqual(moved.newName, generatedName);
  assert.equal(moved.newName, generatedName + '_1');
});
test('same definition names in different namespaces remain distinct', () => {
  const before = fixture();
  before.properties.other = { ...object({ value: { $ref: '#/properties/other/$defs/value' } }), $defs: { value: { type: 'number' } } };
  before.required.push('other');
  const result = proof(before);
  const moves = result.report.movedDefinitions.filter(move => move.oldName === 'value');
  assert.equal(moves.length, 2);
  assert.notEqual(moves[0].newName, moves[1].newName);
});
test('recursive graph preserved with finite paired comparison', () => {
  const before = object({ node: { $ref: '#/properties/container/$defs/node' }, container: { ...object({}), $defs: { node: object({ next: { anyOf: [{ type: 'null' }, { $ref: '#/properties/container/$defs/node' }] } }) } } });
  const result = proof(before);
  assert.equal(result.report.proof.sourceCycles, 1);
  assert.equal(result.report.proof.targetCycles, 1);
});
test('mutual recursion preserved', () => {
  const before = object({ container: { ...object({ node: { $ref: '#/properties/container/$defs/a' } }), $defs: { a: object({ b: { $ref: '#/properties/container/$defs/b' } }), b: object({ a: { $ref: '#/properties/container/$defs/a' } }) } } });
  assert.equal(proof(before).report.proof.sourceCycles, 1);
});
test('escaped JSON pointers and refs to a definition subtree', () => {
  const before = object({ box: { ...object({ selected: { $ref: '#/properties/box/$defs/a~1b~0c/properties/x~1y' } }), $defs: { 'a/b~c': object({ 'x/y': { type: 'string', const: 'preserved' } }) } } });
  const result = proof(before);
  assert.ok(result.report.rewrittenReferences[0].newRef.endsWith('/properties/x~1y'));
});
test('URI-fragment escaped percent in a schema property remains correct', () => {
  const before = object({ box: { ...object({ selected: { $ref: '#/properties/box/$defs/value/properties/a%25b' } }), $defs: { value: object({ 'a%b': { type: 'string' } }) } } });
  assert.ok(proof(before).report.rewrittenReferences[0].newRef.endsWith('/properties/a%25b'));
});
test('deepest moved prefix wins for refs into nested definitions', () => {
  const before = object({ box: { ...object({ selected: { $ref: '#/properties/box/$defs/outer/$defs/inner/properties/text' } }), $defs: { outer: { ...object({ selected: { $ref: '#/properties/box/$defs/outer/$defs/inner' } }), $defs: { inner: object({ text: { type: 'string' } }) } } } } });
  const result = proof(before);
  const inner = result.report.movedDefinitions.find(move => move.oldName === 'inner');
  assert.equal(result.schema.properties.box.properties.selected.$ref, inner.newPath + '/properties/text');
  assert.equal(result.report.counts.movedDefinitions, 2);
});
test('nested definitions in anyOf and array items are hoisted', () => {
  const before = object({ value: { anyOf: [{ type: 'null' }, { type: 'array', items: { ...object({ leaf: { $ref: '#/properties/value/anyOf/1/items/$defs/leaf' } }), $defs: { leaf: { type: 'string' } } } }] } });
  assert.equal(proof(before).report.counts.movedDefinitions, 1);
});
test('annotation and data objects with $defs / $ref keys stay exact', () => {
  const before = fixture();
  const data = { $defs: { fake: { $ref: '#/does-not-exist' } }, $ref: 'https://example.test/data', $id: 'data-is-not-a-schema' };
  before.examples = [data]; before.default = data;
  before.properties.envelope.properties.literal = { const: data, enum: [data] };
  before.properties.envelope.required.push('literal');
  const result = proof(before);
  assert.deepEqual(result.schema.default, data);
  assert.deepEqual(result.schema.examples, [data]);
  assert.deepEqual(result.schema.properties.envelope.properties.literal, before.properties.envelope.properties.literal);
});
test('unreachable definitions are retained and reported', () => {
  const before = fixture();
  const result = proof(before);
  assert.equal(result.report.counts.unreachableDefinitions, 1);
  assert.equal(result.report.unreachableDefinitions[0].oldPath, '#/properties/envelope/$defs/unused');
  const moved = result.report.movedDefinitions.find(move => move.oldName === 'unused');
  assert.deepEqual(result.schema.$defs[moved.newName], { type: 'integer' });
});
test('broken references stop normalization', () => {
  const before = fixture(); before.properties.envelope.properties.value.$ref = '#/$defs/missing';
  assert.throws(() => normalizeEvaluationSchema(before), { code: 'BROKEN_REFERENCE' });
});
test('external reference stops without network lookup', () => {
  const before = fixture(); before.properties.envelope.properties.value.$ref = 'https://example.test/schema';
  assert.throws(() => normalizeEvaluationSchema(before), { code: 'NONLOCAL_REFERENCE' });
});
test('scope-changing keywords stop relocation', () => {
  for (const keyword of ['$id', '$anchor', '$dynamicAnchor', '$recursiveAnchor']) {
    const before = fixture(); before.properties.envelope[keyword] = 'scope';
    assert.throws(() => normalizeEvaluationSchema(before), { code: 'UNSAFE_REFERENCE_SCOPE' });
  }
});
test('semantic comparator catches changes to annotations, enums, refs and definitions', () => {
  const before = fixture(), result = proof(before);
  for (const change of [
    after => { after.title = 'added'; },
    after => { after.$defs[result.report.movedDefinitions.find(move => move.oldName === 'value').newName].enum = ['different']; },
    after => { after.properties.envelope.properties.value.$ref = result.report.movedDefinitions.find(move => move.oldName === 'unused').newPath; },
    after => { delete after.$defs[result.report.movedDefinitions.find(move => move.oldName === 'unused').newName]; },
  ]) {
    const after = structuredClone(result.schema); change(after);
    assert.equal(verifySemanticPreservation(before, after, result.report).equal, false);
  }
});
test('prototype-named definitions are preserved as own properties', () => {
  const before = JSON.parse('{"type":"object","properties":{"box":{"type":"object","properties":{},"required":[],"additionalProperties":false,"$defs":{"__proto__":{"type":"string"}}}},"required":["box"],"additionalProperties":false,"$defs":{"__proto__":{"type":"boolean"}}}');
  const result = proof(before);
  assert.deepEqual(result.schema.$defs.__proto__, { type: 'boolean' });
});
