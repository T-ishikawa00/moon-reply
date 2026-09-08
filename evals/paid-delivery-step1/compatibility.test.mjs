import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { validateCompatibility } from './compatibility.mjs';

const object = properties => ({ type: 'object', properties, required: Object.keys(properties), additionalProperties: false });
const valid = () => object({ value: { type: ['string', 'null'] }, values: { type: 'array', items: { type: 'integer' } } });
const fails = (schema, rule, options) => {
  const result = validateCompatibility(schema, options);
  assert.equal(result.status, 'FAIL');
  assert.ok(result.errors.some(error => error.rule === rule), JSON.stringify(result.errors));
};
const needsReview = (schema, rule) => {
  const result = validateCompatibility(schema);
  assert.equal(result.status, 'REVIEW_REQUIRED');
  assert.deepEqual(result.errors, []);
  assert.ok(result.warnings.some(warning => warning.rule === rule), JSON.stringify(result.warnings));
};

test('valid nullable type union, array, annotations, and supported constraints', () => {
  const schema = valid();
  schema.properties.value.description = 'format: nullable; this is prose, not a validation keyword';
  schema.properties.values.minItems = 0;
  schema.properties.values.maxItems = 3;
  schema.properties.values.items.minimum = 0;
  schema.properties.values.items.maximum = 10;
  schema.properties.values.items.multipleOf = 1;
  assert.equal(validateCompatibility(schema).status, 'PASS');
});
test('mixed enum without type is valid and historically accepted', () => {
  assert.equal(validateCompatibility(object({ answer: { enum: [true, false, 'unknown'] } })).status, 'PASS');
});
test('const without type is not mistaken for an empty contract', () => {
  assert.equal(validateCompatibility(object({ answer: { const: 'fixed' } })).status, 'PASS');
});
test('unsupported keyword', () => fails(object({ value: { type: 'string', allOf: [] } }), 'UNSUPPORTED_KEYWORD'));
test('missing required property', () => { const schema = valid(); schema.required.pop(); fails(schema, 'MISSING_REQUIRED_PROPERTY'); });
test('properties / required mismatch', () => { const schema = valid(); schema.required.push('absent'); fails(schema, 'REQUIRED_PROPERTIES_MISMATCH'); });
test('invalid additionalProperties', () => { const schema = valid(); schema.additionalProperties = true; fails(schema, 'ADDITIONAL_PROPERTIES_FALSE'); });
test('invalid root shape', () => fails({ type: 'array', items: { type: 'string' } }, 'ROOT_OBJECT'));
test('root type union', () => { const schema = valid(); schema.type = ['object', 'null']; fails(schema, 'ROOT_OBJECT'); });
test('root anyOf is unsupported even with object type', () => { const schema = valid(); schema.anyOf = [{ type: 'string' }]; fails(schema, 'ROOT_OBJECT'); });
test('broken ref', () => fails(object({ value: { $ref: '#/$defs/missing' } }), 'BROKEN_REF'));
test('malformed nullable type shape', () => fails(object({ value: { type: ['string', 'nullable'] } }), 'INVALID_TYPE_UNION'));
test('OpenAPI nullable keyword is unverified rather than a claimed documented prohibition', () => {
  const result = validateCompatibility(object({ value: { type: 'string', nullable: true } }));
  assert.equal(result.status, 'REVIEW_REQUIRED');
  assert.deepEqual(result.errors, []);
  assert.ok(result.warnings.some(warning => warning.rule === 'UNVERIFIED_KEYWORD' && warning.certainty === 'unverified'));
});
test('missing type and value constraint requires contract review', () => needsReview(object({ value: {} }), 'MISSING_TYPE'));
test('invalid array item schema', () => fails(object({ value: { type: 'array', items: [] } }), 'ARRAY_ITEM_SCHEMA'));
test('enum type mismatch is a legal intersection needing review', () => needsReview(object({ value: { type: 'string', enum: [1] } }), 'ENUM_TYPE_MISMATCH'));
test('const type mismatch is a legal intersection needing review', () => needsReview(object({ value: { type: 'boolean', const: 'yes' } }), 'CONST_TYPE_MISMATCH'));
test('object keywords without explicit type require review', () => needsReview(object({ value: { properties: {}, required: [], additionalProperties: false } }), 'OBJECT_KEYWORD_WITHOUT_OBJECT_TYPE'));
test('array keywords without explicit type require review', () => needsReview(object({ value: { items: { type: 'string' } } }), 'ARRAY_KEYWORD_WITHOUT_ARRAY_TYPE'));
test('const excluded by enum requires review', () => needsReview(object({ value: { enum: ['a'], const: 'b' } }), 'CONST_ENUM_MISMATCH'));
test('unsupported format', () => fails(object({ value: { type: 'string', format: 'int64' } }), 'UNSUPPORTED_FORMAT'));
test('documented formats', () => {
  for (const format of ['date-time', 'time', 'date', 'duration', 'email', 'hostname', 'ipv4', 'ipv6', 'uuid']) assert.equal(validateCompatibility(object({ value: { type: 'string', format } })).status, 'PASS');
});
test('fine tuned restrictions do not leak into base-model checks', () => {
  const schema = object({ value: { type: 'string', pattern: '^a$' } });
  assert.equal(validateCompatibility(schema).status, 'PASS');
  fails(schema, 'UNSUPPORTED_KEYWORD', { fineTuned: true });
});
test('nested defs, rebased refs, and nullable anyOf are supported', () => {
  const payload = object({ answer: { $ref: '#/properties/payload/$defs/answer' } });
  payload.$defs = { answer: { anyOf: [{ type: 'string' }, { type: 'null' }] } };
  const result = validateCompatibility(object({ payload }));
  assert.equal(result.status, 'PASS');
  assert.equal(result.stats.maxInstanceContainerDepth, 2);
});
test('JSON pointer escaping resolves property names', () => {
  const schema = object({ value: { $ref: '#/$defs/a~1b~0c' } });
  schema.$defs = { 'a/b~c': { type: 'string' } };
  assert.equal(validateCompatibility(schema).status, 'PASS');
});
test('self recursion is supported without infinite expansion', () => {
  const schema = object({ children: { type: 'array', items: { $ref: '#' } } });
  const result = validateCompatibility(schema);
  assert.equal(result.status, 'PASS');
  assert.equal(result.stats.recursiveReferences, 1);
});
test('finite ref expansion measures instance nesting', () => {
  const schema = object({ child: { $ref: '#/$defs/n0' } });
  schema.$defs = {};
  for (let i = 0; i < 9; i += 1) schema.$defs[`n${i}`] = object(i === 8 ? { leaf: { type: 'string' } } : { child: { $ref: `#/$defs/n${i + 1}` } });
  assert.equal(validateCompatibility(schema).status, 'PASS');
  assert.equal(validateCompatibility(schema).stats.maxInstanceContainerDepth, 10);
  schema.$defs.n8.properties.leaf = object({ value: { type: 'string' } });
  fails(schema, 'NESTING_LIMIT');
});
test('unused deeply arranged defs are not instance nesting', () => {
  const schema = object({ value: { type: 'string' } });
  let cursor = schema;
  for (let i = 0; i < 12; i += 1) { cursor.$defs = { unused: { type: 'string' } }; cursor = cursor.$defs.unused; }
  assert.equal(validateCompatibility(schema).status, 'PASS');
  assert.equal(validateCompatibility(schema).stats.maxInstanceContainerDepth, 1);
});
test('property count limit boundary', () => {
  const schema = object(Object.fromEntries(Array.from({ length: 5000 }, (_, i) => [`p${i}`, { type: 'string' }])));
  assert.equal(validateCompatibility(schema).status, 'PASS');
  schema.properties.overflow = { type: 'string' }; schema.required.push('overflow');
  fails(schema, 'PROPERTY_COUNT_LIMIT');
});
test('enum count limit boundary', () => {
  const schema = object({ value: { type: 'integer', enum: Array.from({ length: 1000 }, (_, i) => i) } });
  assert.equal(validateCompatibility(schema).status, 'PASS');
  schema.properties.value.enum.push(1000);
  fails(schema, 'ENUM_COUNT_LIMIT');
});
test('enum string length limit applies above 250 strings', () => {
  const schema = object({ value: { type: 'string', enum: Array.from({ length: 251 }, (_, i) => `${i}${'x'.repeat(60)}`) } });
  fails(schema, 'ENUM_STRING_LENGTH_LIMIT');
  schema.properties.value.enum.pop();
  assert.equal(validateCompatibility(schema).status, 'PASS');
});
test('total name and value character limit', () => fails(object({ value: { const: 'x'.repeat(120001) } }), 'NAME_VALUE_CHARACTER_LIMIT'));
for (const filename of ['successful-schema.json', 'failing-schema.json']) {
  test(`reconstructed ${filename} has no demonstrated subset violation`, () => {
    const schema = JSON.parse(readFileSync(new URL(filename, import.meta.url), 'utf8'));
    const result = validateCompatibility(schema);
    assert.equal(result.status, 'PASS', JSON.stringify(result));
    assert.deepEqual(result.errors, []);
    assert.deepEqual(result.warnings, []);
  });
}
