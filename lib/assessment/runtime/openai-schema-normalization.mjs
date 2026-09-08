// Provider schema normalization promoted from the proven STEP 1C adapter. Canonical schemas remain unchanged.
import { createHash } from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';

const MAPS = new Set(['$defs', 'definitions', 'properties', 'patternProperties', 'dependentSchemas']);
const ARRAYS = new Set(['anyOf', 'allOf', 'oneOf', 'prefixItems']);
const SINGLES = new Set(['items', 'additionalProperties', 'additionalItems', 'contains', 'propertyNames', 'unevaluatedProperties', 'unevaluatedItems', 'not', 'if', 'then', 'else', 'contentSchema']);
const SCOPES = new Set(['$id', 'id', '$anchor', '$dynamicAnchor', '$dynamicRef', '$recursiveAnchor', '$recursiveRef']);
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const schemaValue = value => object(value) || typeof value === 'boolean';
const escape = value => value.replaceAll('~', '~0').replaceAll('/', '~1');
const pathOf = parts => '#' + (parts.length ? '/' + parts.map(escape).join('/') : '');
const partsOf = path => path === '#' ? [] : path.slice(2).split('/').map(part => part.replaceAll('~1', '/').replaceAll('~0', '~'));
const refOf = path => '#' + (path === '#' ? '' : '/' + partsOf(path).map(part => encodeURIComponent(escape(part)).replaceAll('%24', '$')).join('/'));
function fail(code, detail) { throw Object.assign(new Error(`${code}: ${detail}`), { code }); }
function parseRef(ref) {
  if (typeof ref !== 'string' || !ref.startsWith('#')) fail('NONLOCAL_REFERENCE', 'Only document-local JSON Pointer references can be normalized.');
  let decoded;
  try { decoded = decodeURIComponent(ref.slice(1)); } catch { fail('INVALID_REFERENCE', ref); }
  if (decoded === '') return '#';
  if (!decoded.startsWith('/') || /~(?![01])/u.test(decoded)) fail('INVALID_REFERENCE', ref);
  return pathOf(decoded.slice(1).split('/').map(part => part.replaceAll('~1', '/').replaceAll('~0', '~')));
}
function children(node, path, includeDefinitions = true) {
  if (!object(node)) return [];
  const result = [];
  const add = (value, parts) => { if (schemaValue(value)) result.push({ node: value, path: pathOf([...partsOf(path), ...parts]) }); };
  for (const [key, value] of Object.entries(node)) {
    if (!includeDefinitions && (key === '$defs' || key === 'definitions')) continue;
    if (MAPS.has(key) && object(value)) for (const [name, child] of Object.entries(value)) add(child, [key, name]);
    else if (ARRAYS.has(key) && Array.isArray(value)) value.forEach((child, index) => add(child, [key, String(index)]));
    else if (SINGLES.has(key)) {
      if (key === 'items' && Array.isArray(value)) value.forEach((child, index) => add(child, [key, String(index)]));
      else add(value, [key]);
    } else if (key === 'dependencies' && object(value)) for (const [name, child] of Object.entries(value)) if (!Array.isArray(child)) add(child, [key, name]);
  }
  return result;
}
function inventory(schema) {
  if (!schemaValue(schema)) fail('INVALID_SCHEMA', 'Expected a JSON schema object or boolean.');
  const nodes = new Map();
  const definitions = [];
  const references = [];
  const scopes = [];
  function visit(node, path) {
    nodes.set(path, node);
    if (object(node)) {
      for (const key of SCOPES) if (Object.hasOwn(node, key)) scopes.push({ path, keyword: key });
      if (Object.hasOwn(node, '$ref')) references.push({ path, ref: node.$ref, target: parseRef(node.$ref) });
      if (Object.hasOwn(node, '$defs')) {
        if (!object(node.$defs)) fail('INVALID_DEFINITIONS', path);
        for (const name of Object.keys(node.$defs)) {
          if (!schemaValue(node.$defs[name])) fail('INVALID_DEFINITION', `${path}/$defs/${escape(name)}`);
          definitions.push({ path: `${path}/$defs/${escape(name)}`, name, parent: path });
        }
      }
    }
    for (const child of children(node, path)) visit(child.node, child.path);
  }
  visit(schema, '#');
  for (const ref of references) if (!nodes.has(ref.target)) fail('BROKEN_REFERENCE', `${ref.path}/$ref -> ${ref.ref}`);
  const edges = new Map([...nodes].map(([path, node]) => [path, children(node, path, false).map(child => child.path)]));
  for (const ref of references) edges.get(ref.path).push(ref.target);
  const reachable = new Set();
  function reach(path) { if (reachable.has(path)) return; reachable.add(path); for (const child of edges.get(path)) reach(child); }
  reach('#');
  return { nodes, definitions, references, scopes, edges, reachable };
}
function relocated(path, moves) {
  const move = moves.filter(item => path === item.oldPath || path.startsWith(item.oldPath + '/')).sort((a, b) => b.oldPath.length - a.oldPath.length)[0];
  return move ? move.newPath + path.slice(move.oldPath.length) : path;
}
function cycleCount(edges) {
  let index = 0, count = 0;
  const indices = new Map(), lows = new Map(), stack = [], active = new Set();
  function visit(path) {
    indices.set(path, index); lows.set(path, index++); stack.push(path); active.add(path);
    for (const child of edges.get(path)) {
      if (!indices.has(child)) { visit(child); lows.set(path, Math.min(lows.get(path), lows.get(child))); }
      else if (active.has(child)) lows.set(path, Math.min(lows.get(path), indices.get(child)));
    }
    if (lows.get(path) === indices.get(path)) {
      const group = []; let member;
      do { member = stack.pop(); active.delete(member); group.push(member); } while (member !== path);
      if (group.length > 1 || edges.get(path).includes(path)) count += 1;
    }
  }
  for (const path of edges.keys()) if (!indices.has(path)) visit(path);
  return count;
}

// Proves graph equality modulo the explicitly listed definition placements and
// internal reference spellings. Ordinary fields, including annotation/data
// subtrees, are compared exactly. Visited pairs make recursive references finite.
export function verifySemanticPreservation(before, after, report) {
  const source = inventory(before), target = inventory(after);
  const moves = report.movedDefinitions ?? [];
  const pairs = new Set();
  const differences = [];
  const difference = (path, reason) => differences.push({ path, reason });
  const expectedPaths = [...source.nodes.keys()].map(path => relocated(path, moves));
  if (new Set(expectedPaths).size !== expectedPaths.length) difference('#', 'Relocation overwrites a schema node.');
  if (!isDeepStrictEqual([...target.nodes.keys()].sort(), [...expectedPaths].sort())) difference('#', 'Schema-node inventory differs.');
  const expectedDefinitions = source.definitions.map(def => relocated(def.path, moves)).sort();
  if (!isDeepStrictEqual(target.definitions.map(def => def.path).sort(), expectedDefinitions)) difference('#', 'Definition inventory differs.');
  function compare(oldPath, newPath) {
    const pair = JSON.stringify([oldPath, newPath]);
    if (pairs.has(pair)) return;
    pairs.add(pair);
    const left = source.nodes.get(oldPath), right = target.nodes.get(newPath);
    if (!source.nodes.has(oldPath) || !target.nodes.has(newPath)) { difference(oldPath, 'Missing paired schema.'); return; }
    if (!object(left) || !object(right)) { if (!isDeepStrictEqual(left, right)) difference(oldPath, 'Boolean/schema value differs.'); return; }
    const leftKeys = Object.keys(left).filter(key => key !== '$defs').sort();
    const rightKeys = Object.keys(right).filter(key => key !== '$defs').sort();
    if (!isDeepStrictEqual(leftKeys, rightKeys)) difference(oldPath, 'Non-placement keyword set differs.');
    const childMap = new Map(children(left, oldPath).map(child => [child.path, child]));
    function compareValue(a, b, path) {
      if (childMap.has(path)) { compare(path, relocated(path, moves)); return; }
      if (object(a) && object(b)) {
        if (!isDeepStrictEqual(Object.keys(a).sort(), Object.keys(b).sort())) { difference(path, 'Ordinary object keys differ.'); return; }
        for (const key of Object.keys(a)) compareValue(a[key], b[key], `${path}/${escape(key)}`);
      } else if (Array.isArray(a) && Array.isArray(b)) {
        if (a.length !== b.length) { difference(path, 'Array length differs.'); return; }
        a.forEach((value, i) => compareValue(value, b[i], `${path}/${i}`));
      } else if (!isDeepStrictEqual(a, b)) difference(path, 'Ordinary field differs.');
    }
    for (const key of leftKeys) {
      if (key === '$ref') {
        const oldTarget = parseRef(left.$ref), newTarget = parseRef(right.$ref);
        if (newTarget !== relocated(oldTarget, moves)) difference(`${oldPath}/$ref`, 'Reference target differs.');
        else compare(oldTarget, newTarget);
      } else compareValue(left[key], right[key], `${oldPath}/${escape(key)}`);
    }
  }
  for (const path of source.nodes.keys()) compare(path, relocated(path, moves));
  const sourceCycles = cycleCount(source.edges), targetCycles = cycleCount(target.edges);
  if (sourceCycles !== targetCycles) difference('#', 'Cycle count differs.');
  return { equal: differences.length === 0, differences, pairedNodes: pairs.size, sourceNodes: source.nodes.size, targetNodes: target.nodes.size, sourceCycles, targetCycles, newCycles: Math.max(0, targetCycles - sourceCycles) };
}

export function normalizeProviderSchema(input) {
  const schema = JSON.parse(JSON.stringify(input));
  const source = inventory(schema);
  const nested = source.definitions.filter(def => def.parent !== '#').sort((a, b) => a.path < b.path ? -1 : a.path > b.path ? 1 : 0);
  if (nested.length && source.scopes.length) fail('UNSAFE_REFERENCE_SCOPE', 'Definition relocation is disabled for $id/id/anchor/dynamic/recursive scope keywords.');
  const reserved = new Set(object(schema.$defs) ? Object.keys(schema.$defs) : []);
  const movedDefinitions = nested.map(def => {
    const digest = createHash('sha256').update(def.path).digest('hex').slice(0, 16);
    const stem = `eval_hoisted_${digest}`;
    let name = stem, suffix = 0;
    while (reserved.has(name)) name = `${stem}_${++suffix}`;
    reserved.add(name);
    return { oldPath: def.path, newPath: `#/$defs/${escape(name)}`, oldName: def.name, newName: name, graphEquality: false };
  });
  const rewrittenReferences = [];
  for (const ref of source.references) {
    const newTarget = relocated(ref.target, movedDefinitions);
    if (newTarget !== ref.target) rewrittenReferences.push({ path: `${ref.path}/$ref`, newPath: `${relocated(ref.path, movedDefinitions)}/$ref`, oldRef: ref.ref, newRef: refOf(newTarget), graphEquality: false });
  }
  // Change only schema locations already inventoried. Data/annotation values are
  // opaque, even if they contain objects with keys named $defs or $ref.
  for (const ref of rewrittenReferences) source.nodes.get(ref.path.slice(0, -5)).$ref = ref.newRef;
  if (movedDefinitions.length) {
    if (!Object.hasOwn(schema, '$defs')) schema.$defs = {};
    for (const move of movedDefinitions) Object.defineProperty(schema.$defs, move.newName, { value: source.nodes.get(move.oldPath), enumerable: true, writable: true, configurable: true });
    for (const [path, node] of source.nodes) if (path !== '#' && object(node) && Object.hasOwn(node, '$defs')) delete node.$defs;
  }
  const report = {
    adapter: 'evaluation-hoist-definitions-v1',
    movedDefinitions,
    rewrittenReferences,
    unreachableDefinitions: source.definitions.filter(def => !source.reachable.has(def.path)).map(def => ({ oldPath: def.path, newPath: relocated(def.path, movedDefinitions) })),
    counts: { movedDefinitions: movedDefinitions.length, references: source.references.length, rewrittenReferences: rewrittenReferences.length, definitions: source.definitions.length },
    unresolvedReferences: 0, overwrites: 0, newCycles: 0,
  };
  const proof = verifySemanticPreservation(input, schema, report);
  if (!proof.equal) fail('SEMANTIC_PRESERVATION_FAILED', JSON.stringify(proof.differences));
  for (const move of movedDefinitions) move.graphEquality = true;
  for (const ref of rewrittenReferences) ref.graphEquality = true;
  report.counts.unreachableDefinitions = report.unreachableDefinitions.length;
  report.proof = proof;
  report.passThrough = movedDefinitions.length === 0;
  report.deterministic = true;
  return { schema, report };
}
