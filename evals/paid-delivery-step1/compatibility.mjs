// Evaluation only. Documentation snapshot: 2026-09-09.
// https://developers.openai.com/api/docs/guides/structured-outputs
// Unknown keywords require review, not a claim that the API rejects them.
// This is a subset check, not a general JSON Schema validator or proof of API
// acceptance. Metadata/annotations are not interpreted as validation keywords.
const TYPES = new Set(['object', 'array', 'string', 'number', 'integer', 'boolean', 'null']);
const FORMATS = new Set(['date-time', 'time', 'date', 'duration', 'email', 'hostname', 'ipv4', 'ipv6', 'uuid']);
const UNSUPPORTED = new Set(['allOf', 'not', 'dependentRequired', 'dependentSchemas', 'if', 'then', 'else']);
const FINE_TUNED_UNSUPPORTED = new Set(['minLength', 'maxLength', 'pattern', 'format', 'minimum', 'maximum', 'multipleOf', 'patternProperties', 'minItems', 'maxItems']);
const ANNOTATIONS = new Set(['title', 'description', '$comment', 'default', 'examples', 'deprecated', 'readOnly', 'writeOnly']);
const KEYWORDS = new Set(['type', 'properties', 'required', 'additionalProperties', '$defs', '$ref', 'anyOf', 'items', 'enum', 'const', 'pattern', 'format', 'minimum', 'maximum', 'exclusiveMinimum', 'exclusiveMaximum', 'multipleOf', 'minItems', 'maxItems', '$schema', '$id', ...ANNOTATIONS]);
const record = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const pointer = value => value.replaceAll('~', '~0').replaceAll('/', '~1');
const chars = value => [...value].length;

export function validateCompatibility(schema, { fineTuned = false } = {}) {
  const errors = [];
  const warnings = [];
  const stats = { propertyCount: 0, enumCount: 0, totalNameAndValueCharacters: 0, maxInstanceContainerDepth: 0, recursiveReferences: 0, annotationCount: 0 };
  const error = (path, rule, detail, certainty = 'documented_or_schema_invalid') => errors.push({ path, rule, detail, certainty });
  const warning = (path, rule, detail, certainty = 'local_contract') => warnings.push({ path, rule, detail, certainty });
  function resolve(ref) {
    if (ref === '#') return schema;
    if (typeof ref !== 'string' || !ref.startsWith('#/')) return undefined;
    let current = schema;
    for (const part of ref.slice(2).split('/')) {
      if (/~(?![01])/u.test(part)) return undefined;
      const key = part.replaceAll('~1', '/').replaceAll('~0', '~');
      if (!record(current) || !Object.hasOwn(current, key)) return undefined;
      current = current[key];
    }
    return current;
  }
  function matches(value, type) {
    if (type === 'null') return value === null;
    if (type === 'object') return record(value);
    if (type === 'array') return Array.isArray(value);
    if (type === 'integer') return Number.isInteger(value);
    if (type === 'number') return typeof value === 'number' && Number.isFinite(value);
    return typeof value === type;
  }
  const visited = new Set();
  function inspect(node, path) {
    if (!record(node)) { error(path, 'SCHEMA_OBJECT', 'A schema must be an object.'); return; }
    if (visited.has(node)) return;
    visited.add(node);
    for (const key of Object.keys(node)) {
      if (UNSUPPORTED.has(key) || (fineTuned && FINE_TUNED_UNSUPPORTED.has(key))) error(`${path}/${pointer(key)}`, 'UNSUPPORTED_KEYWORD', key);
      else if (!KEYWORDS.has(key)) warning(`${path}/${pointer(key)}`, 'UNVERIFIED_KEYWORD', `The cited supported subset does not establish support for ${key}.`, 'unverified');
      if (ANNOTATIONS.has(key)) stats.annotationCount += 1;
    }
    const types = Array.isArray(node.type) ? node.type : node.type === undefined ? [] : [node.type];
    if (node.type === undefined && node.$ref === undefined && node.anyOf === undefined && node.enum === undefined && !Object.hasOwn(node, 'const')) warning(path, 'MISSING_TYPE', 'No type, anyOf, $ref, enum, or const establishes a value contract.');
    if (node.type !== undefined && (!types.length || types.some(t => !TYPES.has(t)) || new Set(types).size !== types.length)) error(`${path}/type`, 'INVALID_TYPE_UNION', 'Type names must be valid, unique JSON Schema types; nullable is represented with null.');
    if (node.$ref !== undefined && !record(resolve(node.$ref))) error(`${path}/$ref`, 'BROKEN_REF', 'Reference must resolve to a schema in this document.');
    if (node.anyOf !== undefined) {
      if (!Array.isArray(node.anyOf) || !node.anyOf.length) error(`${path}/anyOf`, 'INVALID_ANY_OF', 'anyOf must be a nonempty array of schemas.');
      else node.anyOf.forEach((child, i) => inspect(child, `${path}/anyOf/${i}`));
    }
    if (node.$defs !== undefined) {
      if (!record(node.$defs)) error(`${path}/$defs`, 'INVALID_DEFS', '$defs must be an object.');
      else for (const [name, child] of Object.entries(node.$defs)) {
        stats.totalNameAndValueCharacters += chars(name);
        inspect(child, `${path}/$defs/${pointer(name)}`);
      }
    }
    if (types.includes('object')) {
      if (!record(node.properties)) error(`${path}/properties`, 'OBJECT_PROPERTIES', 'Object properties must be explicitly declared.');
      const names = record(node.properties) ? Object.keys(node.properties) : [];
      stats.propertyCount += names.length;
      stats.totalNameAndValueCharacters += names.reduce((sum, name) => sum + chars(name), 0);
      if (node.additionalProperties !== false) error(`${path}/additionalProperties`, 'ADDITIONAL_PROPERTIES_FALSE', 'Every object must set additionalProperties to false.');
      if (!Array.isArray(node.required) || node.required.some(name => typeof name !== 'string') || new Set(node.required).size !== node.required.length) error(`${path}/required`, 'INVALID_REQUIRED', 'required must be an array of unique property names.');
      else {
        const missing = names.filter(name => !node.required.includes(name));
        const extra = node.required.filter(name => !names.includes(name));
        if (missing.length) error(`${path}/required`, 'MISSING_REQUIRED_PROPERTY', { missing });
        if (extra.length) error(`${path}/required`, 'REQUIRED_PROPERTIES_MISMATCH', { extra });
      }
      for (const [name, child] of Object.entries(record(node.properties) ? node.properties : {})) inspect(child, `${path}/properties/${pointer(name)}`);
    } else if (node.properties !== undefined || node.required !== undefined || node.additionalProperties !== undefined) {
      warning(path, 'OBJECT_KEYWORD_WITHOUT_OBJECT_TYPE', 'Object validation keywords have no explicit object type; this is legal JSON Schema but needs contract review.');
    }
    if (types.includes('array')) {
      if (!record(node.items)) error(`${path}/items`, 'ARRAY_ITEM_SCHEMA', 'Arrays must declare a single item schema.');
      else inspect(node.items, `${path}/items`);
    } else if (node.items !== undefined) warning(`${path}/items`, 'ARRAY_KEYWORD_WITHOUT_ARRAY_TYPE', 'items has no explicit array type; this is legal JSON Schema but needs contract review.');
    if (node.enum !== undefined) {
      if (!Array.isArray(node.enum) || !node.enum.length) error(`${path}/enum`, 'INVALID_ENUM', 'enum must be nonempty.');
      else {
        stats.enumCount += node.enum.length;
        const strings = node.enum.filter(value => typeof value === 'string');
        const length = strings.reduce((sum, value) => sum + chars(value), 0);
        stats.totalNameAndValueCharacters += length;
        if (strings.length > 250 && length > 15000) error(`${path}/enum`, 'ENUM_STRING_LENGTH_LIMIT', { actual: length, maximum: 15000 });
        if (new Set(node.enum.map(value => JSON.stringify(value))).size !== node.enum.length) error(`${path}/enum`, 'DUPLICATE_ENUM_VALUE', 'Enum values must be unique.');
        node.enum.forEach((value, i) => { if (types.length && !types.some(type => matches(value, type))) warning(`${path}/enum/${i}`, 'ENUM_TYPE_MISMATCH', 'Declared type excludes this enum value; the intersection is legal JSON Schema.'); });
      }
    }
    if (Object.hasOwn(node, 'const')) {
      if (typeof node.const === 'string') stats.totalNameAndValueCharacters += chars(node.const);
      if (types.length && !types.some(type => matches(node.const, type))) warning(`${path}/const`, 'CONST_TYPE_MISMATCH', 'Declared type excludes const; this is an unsatisfiable intersection, not an invalid JSON Schema.');
      if (Array.isArray(node.enum) && !node.enum.some(value => JSON.stringify(value) === JSON.stringify(node.const))) warning(`${path}/const`, 'CONST_ENUM_MISMATCH', 'Enum excludes const; this is an unsatisfiable intersection, not an invalid JSON Schema.');
    }
    if (node.format !== undefined && !FORMATS.has(node.format)) error(`${path}/format`, 'UNSUPPORTED_FORMAT', node.format);
    if (node.pattern !== undefined && typeof node.pattern !== 'string') error(`${path}/pattern`, 'INVALID_PATTERN', 'pattern must be a string.');
    for (const key of ['minimum', 'maximum', 'exclusiveMinimum', 'exclusiveMaximum', 'multipleOf']) {
      if (node[key] !== undefined && (typeof node[key] !== 'number' || !Number.isFinite(node[key]) || (key === 'multipleOf' && node[key] <= 0))) error(`${path}/${key}`, 'INVALID_NUMERIC_BOUND', 'Numeric bounds must be finite; multipleOf must be positive.');
    }
    for (const key of ['minItems', 'maxItems']) if (node[key] !== undefined && (!Number.isInteger(node[key]) || node[key] < 0)) error(`${path}/${key}`, 'INVALID_ARRAY_BOUND', 'Array bounds must be nonnegative integers.');
  }
  if (!record(schema) || schema.type !== 'object' || Object.hasOwn(schema, 'anyOf')) error('#', 'ROOT_OBJECT', 'Root type must be object and must not use anyOf.');
  inspect(schema, '#');
  // Definitions do not add instance depth. Ref expansion follows instance edges;
  // active-path cycles are legal recursive schemas and are not expanded forever.
  function depth(node, path, containers, active) {
    if (!record(node)) return;
    if (active.has(node)) { stats.recursiveReferences += 1; return; }
    const next = new Set(active).add(node);
    const types = Array.isArray(node.type) ? node.type : [node.type];
    const current = containers + (types.includes('object') || types.includes('array') ? 1 : 0);
    stats.maxInstanceContainerDepth = Math.max(stats.maxInstanceContainerDepth, current);
    if (current > 10) error(path, 'NESTING_LIMIT', { actual: current, maximum: 10 });
    if (node.$ref !== undefined) depth(resolve(node.$ref), `${path}/$ref`, containers, next);
    if (Array.isArray(node.anyOf)) node.anyOf.forEach((child, i) => depth(child, `${path}/anyOf/${i}`, containers, next));
    if (record(node.properties)) for (const [name, child] of Object.entries(node.properties)) depth(child, `${path}/properties/${pointer(name)}`, current, next);
    if (record(node.items)) depth(node.items, `${path}/items`, current, next);
  }
  depth(schema, '#', 0, new Set());
  for (const [key, maximum, rule] of [['propertyCount', 5000, 'PROPERTY_COUNT_LIMIT'], ['enumCount', 1000, 'ENUM_COUNT_LIMIT'], ['totalNameAndValueCharacters', 120000, 'NAME_VALUE_CHARACTER_LIMIT']]) if (stats[key] > maximum) error('#', rule, { actual: stats[key], maximum });
  return { status: errors.length ? 'FAIL' : warnings.length ? 'REVIEW_REQUIRED' : 'PASS', errors, warnings, stats };
}
