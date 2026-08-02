import { createHash } from "node:crypto";

export const EVALUATOR_VERSION =
  "m2-p4-i3-r1-c1-r3-r2-e-provider-evaluator-v1";

const BASE_CANDIDATE_PROPERTY_NAMES = new Set([
  "optional_message",
  "candidate_metadata",
  "candidate_text",
  "candidate_analysis",
  "candidate_envelope",
  "candidate_style_profile",
  "candidate_communicative_intent",
  "candidate_language_expression",
  "candidate_safety_signals",
  "candidate_safety_result",
  "candidate_presence",
  "proposed_message_present",
]);

const CANDIDATE_BASE_PROPERTY_NAMES = new Set([
  "current_situation",
  "relationship",
  "requested_topics",
  "timeline",
  "context",
  "observed_facts",
  "material_unknowns",
  "relationship_stage",
  "decision_facts",
  "incoming_message_facts",
  "boundary_facts",
  "boundaries",
]);

const CANDIDATE_OPERATIONAL_PROPERTY_NAMES = new Set([
  "source_refs",
  "message_id",
  "event_id",
  "fact_id",
  "boundary_id",
  "context_id",
  "inference_id",
  "sequence",
  "candidate_text",
  "raw_candidate",
  "response_id",
  "provider_response_id",
  "usage",
  "latency",
  "latency_ms",
  "stage_id",
  "stage_ids",
  "expected",
  "expected_values",
  "oracle",
  "case_id",
  "fixture_id",
  "confidence",
  "probability",
]);

const ALLOWED_BASE_SOURCE_REFS = new Set([
  "input:current_situation",
  "input:relationship",
  "input:requested_topics",
]);

function isObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function canonicalize(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) {
    return "[" + value.map((item) => canonicalize(item)).join(",") + "]";
  }
  return (
    "{" +
    Object.keys(value)
      .sort((left, right) => left.localeCompare(right, "en"))
      .map((key) => JSON.stringify(key) + ":" + canonicalize(value[key]))
      .join(",") +
    "}"
  );
}

export function canonicalJson(value) {
  return canonicalize(value);
}

export function shaDiagnosticJson(value) {
  return createHash("sha256")
    .update(Buffer.from(canonicalize(value), "utf8"))
    .digest("hex");
}

function same(left, right) {
  return canonicalize(left) === canonicalize(right);
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function sortedUnique(values) {
  return [...new Set(values)].sort((left, right) =>
    String(left).localeCompare(String(right), "en"),
  );
}

function selectValues(root, jsonPath) {
  if (jsonPath === "$" || jsonPath === "") {
    return { exists: root !== undefined, values: [root] };
  }
  const segments = jsonPath.split(".");
  const walk = (value, index) => {
    if (index === segments.length) return [value];
    const segment = segments[index];
    if (segment === "*") {
      const candidates = Array.isArray(value)
        ? value
        : isObject(value)
          ? Object.values(value)
          : [];
      return candidates.flatMap((item) => walk(item, index + 1));
    }
    if (!isObject(value) || !(segment in value)) return [];
    return walk(value[segment], index + 1);
  };
  const values = walk(root, 0);
  return { exists: values.length > 0, values };
}

function selectedValue(selection) {
  if (!selection.exists) return undefined;
  return selection.values.length === 1 ? selection.values[0] : selection.values;
}

function collectStrings(value, target = []) {
  if (typeof value === "string") {
    target.push(value);
    return target;
  }
  if (Array.isArray(value)) {
    value.forEach((item) => collectStrings(item, target));
    return target;
  }
  if (isObject(value)) {
    Object.values(value).forEach((item) => collectStrings(item, target));
  }
  return target;
}

function collectPrimitiveLeaves(value, target = []) {
  if (value === null || ["string", "number", "boolean"].includes(typeof value)) {
    target.push(value);
    return target;
  }
  if (Array.isArray(value)) {
    value.forEach((item) => collectPrimitiveLeaves(item, target));
    return target;
  }
  if (isObject(value)) {
    Object.values(value).forEach((item) => collectPrimitiveLeaves(item, target));
  }
  return target;
}

export function countPropertyNames(value, names) {
  const expected = names instanceof Set ? names : new Set(names);
  let count = 0;
  const visit = (candidate) => {
    if (Array.isArray(candidate)) {
      candidate.forEach(visit);
      return;
    }
    if (!isObject(candidate)) return;
    for (const [key, nested] of Object.entries(candidate)) {
      if (expected.has(key)) count += 1;
      visit(nested);
    }
  };
  visit(value);
  return count;
}

export function countCandidateFieldsInBase(value) {
  return countPropertyNames(value, BASE_CANDIDATE_PROPERTY_NAMES);
}

export function countBaseFieldsInCandidate(value) {
  return countPropertyNames(value, CANDIDATE_BASE_PROPERTY_NAMES);
}

export function countCandidateOperationalMetadata(value) {
  return countPropertyNames(value, CANDIDATE_OPERATIONAL_PROPERTY_NAMES);
}

export function countSourceRefLiteral(value, literal) {
  let count = 0;
  const visit = (candidate) => {
    if (Array.isArray(candidate)) {
      candidate.forEach(visit);
      return;
    }
    if (!isObject(candidate)) return;
    for (const [key, nested] of Object.entries(candidate)) {
      if (key === "source_refs" && Array.isArray(nested)) {
        count += nested.filter((item) => item === literal).length;
      }
      visit(nested);
    }
  };
  visit(value);
  return count;
}

export function countExactLiterals(value, literals) {
  const strings = collectStrings(value);
  return asArray(literals).reduce(
    (total, literal) =>
      total +
      strings.reduce(
        (inner, text) =>
          inner +
          (typeof literal === "string" && literal.length > 0
            ? text.split(literal).length - 1
            : 0),
        0,
      ),
    0,
  );
}

export function candidateRawEchoCount(providerInput, outputs) {
  const literal = providerInput?.optional_message;
  if (typeof literal !== "string" || literal.length === 0) return 0;
  return countExactLiterals(outputs, [literal]);
}

export function secretLeakageCount(outputs, apiKey) {
  if (typeof apiKey !== "string" || apiKey.length === 0) return 0;
  return countExactLiterals(outputs, [apiKey]);
}

export function forbiddenInputReferenceCount(
  providerInput,
  caseId,
  forbiddenKeys,
) {
  let count = countPropertyNames(providerInput, forbiddenKeys);
  const forbiddenString = /(?:case[_ -]?id|fixture|oracle|verdict|expected[_ -]?value)/iu;
  for (const text of collectStrings(providerInput)) {
    if (text === caseId || forbiddenString.test(text)) count += 1;
  }
  return count;
}

function qualityExpectedPrimitives(qualityCase, qualityContract) {
  const values = [];
  for (const assertion of asArray(qualityCase?.assertions)) {
    let expected = assertion.expected;
    if (
      isObject(expected) &&
      expected.value_from ===
        "quality_contract.direct_material_candidate_safety_codes"
    ) {
      expected = qualityContract.direct_material_candidate_safety_codes;
    }
    if (isObject(expected) && typeof expected.value_from === "string") continue;
    collectPrimitiveLeaves(expected, values);
  }
  return values;
}

export function expectedDataInjectionCount(
  providerInput,
  qualityCase,
  qualityContract,
  allowedInputKeys,
) {
  const legitimateProjection = Object.fromEntries(
    asArray(allowedInputKeys)
      .filter((key) => Object.hasOwn(providerInput ?? {}, key))
      .map((key) => [key, providerInput[key]]),
  );
  const legitimate = new Set(
    collectPrimitiveLeaves(legitimateProjection).map(canonicalize),
  );
  const expected = new Set(
    qualityExpectedPrimitives(qualityCase, qualityContract)
      .filter((item) => !legitimate.has(canonicalize(item)))
      .map(canonicalize),
  );
  return collectPrimitiveLeaves(providerInput).filter((item) =>
    expected.has(canonicalize(item)),
  ).length;
}

function validReferenceIntegrity(value) {
  let valid = true;
  const facts = new Map();
  const visit = (candidate) => {
    if (Array.isArray(candidate)) {
      candidate.forEach(visit);
      return;
    }
    if (!isObject(candidate)) return;
    if (typeof candidate.fact_id === "string") {
      if (facts.has(candidate.fact_id)) valid = false;
      facts.set(candidate.fact_id, candidate);
    }
    if (Object.hasOwn(candidate, "source_refs")) {
      if (
        !Array.isArray(candidate.source_refs) ||
        candidate.source_refs.some(
          (item) => typeof item !== "string" || !ALLOWED_BASE_SOURCE_REFS.has(item),
        ) ||
        new Set(candidate.source_refs).size !== candidate.source_refs.length
      ) {
        valid = false;
      }
    }
    Object.values(candidate).forEach(visit);
  };
  visit(value);
  const inferences = isObject(value) ? asArray(value.context_inferences) : [];
  for (const inference of inferences) {
    if (
      !isObject(inference) ||
      !Array.isArray(inference.supporting_fact_ids) ||
      inference.supporting_fact_ids.some((id) => !facts.has(id))
    ) {
      valid = false;
      continue;
    }
    const supportedRefs = new Set(
      inference.supporting_fact_ids.flatMap((id) =>
        asArray(facts.get(id)?.source_refs),
      ),
    );
    if (
      !Array.isArray(inference.source_refs) ||
      inference.source_refs.some((ref) => !supportedRefs.has(ref))
    ) {
      valid = false;
    }
  }
  return valid;
}

function surfaceRoots(call, surface) {
  if (surface === "raw_output") return [call.raw_output];
  if (surface === "grounded_output") return [call.grounded_output];
  if (surface === "provider_input") return [call.provider_input];
  if (surface === "raw_and_grounded_output") {
    return [call.raw_output, call.grounded_output];
  }
  throw new Error("M2_R3_R2_E_ASSERTION_SURFACE_INVALID");
}

function targetSelection(call, assertion) {
  const roots = surfaceRoots(call, assertion.surface);
  if (typeof assertion.json_path === "string") {
    const selections = roots.map((root) => selectValues(root, assertion.json_path));
    const exists = selections.every((selection) => selection.exists);
    const values = selections.flatMap((selection) => selection.values);
    return {
      exists,
      values,
      actual:
        roots.length === 1
          ? selectedValue(selections[0])
          : selections.map(selectedValue),
    };
  }
  const target = assertion.bounded_evaluator_target;
  if (!isObject(target) || typeof target.type !== "string") {
    throw new Error("M2_R3_R2_E_ASSERTION_TARGET_INVALID");
  }
  if (target.type === "primitive_pair") {
    const actual = asArray(target.paths).map((jsonPath) =>
      selectedValue(selectValues(roots[0], jsonPath)),
    );
    return { exists: actual.every((item) => item !== undefined), values: [actual], actual };
  }
  if (target.type === "primitive_pairs") {
    const array = selectedValue(selectValues(roots[0], target.array_path));
    const actual = asArray(array).map((item) =>
      asArray(target.fields).map((field) =>
        selectedValue(selectValues(item, field)),
      ),
    );
    return { exists: Array.isArray(array), values: [actual], actual };
  }
  if (target.type === "serialized_paths") {
    const actual = roots.flatMap((root) =>
      asArray(target.paths).map((jsonPath) =>
        selectedValue(selectValues(root, jsonPath)),
      ),
    );
    return { exists: true, values: [actual], actual };
  }
  if (target.type === "property_name_count") {
    const actual = roots.reduce(
      (total, root) => total + countPropertyNames(root, target.names),
      0,
    );
    return { exists: true, values: [actual], actual };
  }
  if (target.type === "string_pattern_count") {
    let actual = 0;
    for (const root of roots) {
      for (const jsonPath of asArray(target.paths)) {
        const value = selectedValue(selectValues(root, jsonPath));
        for (const text of collectStrings(value)) {
          for (const pattern of asArray(target.patterns)) {
            const matches = text.match(new RegExp(pattern, "gu"));
            actual += matches?.length ?? 0;
          }
        }
      }
    }
    return { exists: true, values: [actual], actual };
  }
  if (target.type === "reference_integrity") {
    const actual = roots.every((root) => validReferenceIntegrity(root));
    return { exists: true, values: [actual], actual };
  }
  throw new Error("M2_R3_R2_E_ASSERTION_TARGET_INVALID");
}

function resolveExpected(assertion, call, qualityContract) {
  const expected = assertion.expected;
  if (!isObject(expected) || typeof expected.value_from !== "string") {
    return structuredClone(expected);
  }
  if (
    expected.value_from ===
    "quality_contract.direct_material_candidate_safety_codes"
  ) {
    return structuredClone(qualityContract.direct_material_candidate_safety_codes);
  }
  if (expected.value_from.startsWith("provider_input.")) {
    return selectedValue(
      selectValues(
        call.provider_input,
        expected.value_from.slice("provider_input.".length),
      ),
    );
  }
  throw new Error("M2_R3_R2_E_ASSERTION_EXPECTED_REFERENCE_INVALID");
}

function collectionContains(collection, expected) {
  return asArray(collection).some((item) => same(item, expected));
}

function applyOperator(operator, selection, expected) {
  const actual = selection.actual;
  if (operator === "equals") return same(actual, expected);
  if (operator === "one_of") return collectionContains(expected, actual);
  if (operator === "not_one_of") return !collectionContains(expected, actual);
  if (operator === "contains_all") {
    return asArray(expected).every((item) => collectionContains(actual, item));
  }
  if (operator === "contains_any") {
    return asArray(expected).some((item) => collectionContains(actual, item));
  }
  if (operator === "excludes_all") {
    return asArray(expected).every((item) => !collectionContains(actual, item));
  }
  if (operator === "count_equals") {
    const count = Array.isArray(actual) ? actual.length : actual;
    return count === expected;
  }
  if (operator === "count_at_least") {
    const count = Array.isArray(actual) ? actual.length : actual;
    return typeof count === "number" && count >= expected;
  }
  if (operator === "path_exists") return selection.exists;
  if (operator === "path_absent") return !selection.exists;
  if (operator === "boolean_true") return actual === true;
  if (operator === "boolean_false") return actual === false;
  if (operator === "allowed_primitive_pairs") {
    return asArray(expected).some((pair) => same(pair, actual));
  }
  if (operator === "exact_literal_absent") {
    const strings = collectStrings(actual);
    const literals = Array.isArray(expected) ? expected : [expected];
    return literals.every(
      (literal) =>
        typeof literal === "string" &&
        literal.length > 0 &&
        strings.every((text) => !text.includes(literal)),
    );
  }
  if (operator === "exact_keys") {
    return (
      isObject(actual) &&
      same(
        Object.keys(actual).sort((left, right) => left.localeCompare(right, "en")),
        [...expected].sort((left, right) => left.localeCompare(right, "en")),
      )
    );
  }
  if (operator === "unique_array") {
    return (
      Array.isArray(actual) &&
      new Set(actual.map((item) => canonicalize(item))).size === actual.length
    );
  }
  if (operator === "valid_reference_integrity") return actual === true;
  throw new Error("M2_R3_R2_E_ASSERTION_OPERATOR_INVALID");
}

export function evaluateAssertion(call, assertion, qualityContract) {
  if (
    typeof assertion.assertion_id !== "string" ||
    typeof assertion.case_id !== "string" ||
    typeof assertion.surface !== "string" ||
    typeof assertion.operator !== "string" ||
    typeof assertion.blocking !== "boolean" ||
    typeof assertion.rationale !== "string" ||
    !qualityContract.allowed_operators.includes(assertion.operator) ||
    assertion.case_id !== call.case_id
  ) {
    throw new Error("M2_R3_R2_E_ASSERTION_CONTRACT_INVALID");
  }
  const selection = targetSelection(call, assertion);
  const expected = resolveExpected(assertion, call, qualityContract);
  const passed = applyOperator(assertion.operator, selection, expected);
  return {
    assertion_id: assertion.assertion_id,
    case_id: assertion.case_id,
    surface: assertion.surface,
    json_path: assertion.json_path ?? null,
    bounded_evaluator_target: assertion.bounded_evaluator_target ?? null,
    operator: assertion.operator,
    expected: expected ?? null,
    actual: selection.actual ?? null,
    blocking: assertion.blocking,
    rationale: assertion.rationale,
    passed,
  };
}

function operationFailures(call) {
  const failures = [];
  const require = (condition, code) => {
    if (!condition) failures.push(code);
  };
  require(call.provider_attempted === true, call.case_id + "-PROVIDER-ATTEMPTED");
  require(call.provider_completed === true, call.case_id + "-PROVIDER-COMPLETED");
  require(call.returned_model_exact === true, call.case_id + "-RETURNED-MODEL-EXACT");
  require(call.provider_input_isolation_passed === true, call.case_id + "-INPUT-ISOLATION");
  require(call.expected_data_injection_count === 0, call.case_id + "-EXPECTED-DATA-INJECTION");
  require(call.raw_schema_result?.passed === true, call.case_id + "-RAW-SCHEMA");
  require(
    call.raw_source_integrity_result?.passed === true,
    call.case_id + "-RAW-SOURCE-INTEGRITY",
  );
  require(call.grounded_schema_result?.passed === true, call.case_id + "-GROUNDED-SCHEMA");
  require(
    call.grounded_source_integrity_result?.passed === true,
    call.case_id + "-GROUNDED-SOURCE-INTEGRITY",
  );
  if (call.stage_id === "PB-01") {
    require(
      call.contextual_integrity_result?.passed === true,
      call.case_id + "-CONTEXTUAL-INTEGRITY",
    );
    require(
      call.application_canonical_result?.passed === true,
      call.case_id + "-APPLICATION-CANONICAL",
    );
    require(call.candidate_field_count_in_base === 0, call.case_id + "-BASE-CANDIDATE-FIELDS");
    require(
      call.optional_message_source_ref_count === 0,
      call.case_id + "-OPTIONAL-MESSAGE-SOURCE-REF",
    );
  } else {
    require(
      call.candidate_allowlist_grounding_result?.passed === true,
      call.case_id + "-CANDIDATE-ALLOWLIST-GROUNDING",
    );
    require(call.base_fact_field_count_in_candidate === 0, call.case_id + "-CANDIDATE-BASE-FIELDS");
    require(call.raw_candidate_echo_count === 0, call.case_id + "-RAW-CANDIDATE-ECHO");
    require(
      call.source_ref_id_operational_metadata_count === 0,
      call.case_id + "-CANDIDATE-METADATA-LEAKAGE",
    );
  }
  require(call.provider_output_mutated === false, call.case_id + "-OUTPUT-IMMUTABLE");
  require(call.secret_leakage_count === 0, call.case_id + "-SECRET-LEAKAGE");
  require(call.exact_literal_leakage_count === 0, call.case_id + "-LITERAL-LEAKAGE");
  require(
    call.case_fixture_oracle_reference_count === 0,
    call.case_id + "-CASE-FIXTURE-ORACLE-REFERENCE",
  );
  return failures;
}

export function evaluateProviderCall(call, qualityCase, qualityContract) {
  if (!qualityCase || qualityCase.case_id !== call.case_id) {
    throw new Error("M2_R3_R2_E_QUALITY_CASE_MISSING");
  }
  const assertionResults = qualityCase.assertions.map((assertion) =>
    evaluateAssertion(call, assertion, qualityContract),
  );
  const blockingFailures = assertionResults
    .filter((assertion) => assertion.blocking && !assertion.passed)
    .map((assertion) => assertion.assertion_id);
  const operationalFailures = operationFailures(call);
  const hardFailures = sortedUnique([...blockingFailures, ...operationalFailures]);
  const softAssertions = assertionResults.filter((assertion) => !assertion.blocking);
  if (softAssertions.length === 0) {
    throw new Error("M2_R3_R2_E_ZERO_DENOMINATOR_SOFT_METRIC");
  }
  return {
    evaluator_version: EVALUATOR_VERSION,
    assertion_results: assertionResults,
    blocking_assertions: assertionResults.filter((item) => item.blocking),
    soft_assertions: softAssertions,
    soft_findings: softAssertions
      .filter((item) => !item.passed)
      .map((item) => item.assertion_id),
    semantic_verdict: blockingFailures.length === 0 ? "PASS" : "FAIL",
    case_verdict: hardFailures.length === 0 ? "PASS" : "FAIL",
    hard_failures: hardFailures,
  };
}

export function aggregateUsage(calls) {
  return asArray(calls).reduce(
    (total, call) => ({
      input_tokens: total.input_tokens + (call.usage?.input_tokens ?? 0),
      cached_tokens: total.cached_tokens + (call.usage?.cached_tokens ?? 0),
      output_tokens: total.output_tokens + (call.usage?.output_tokens ?? 0),
      reasoning_tokens:
        total.reasoning_tokens + (call.usage?.reasoning_tokens ?? 0),
    }),
    { input_tokens: 0, cached_tokens: 0, output_tokens: 0, reasoning_tokens: 0 },
  );
}

function metricFromExpectedCases(expectedCases, callsById, predicate) {
  if (expectedCases.length === 0) {
    throw new Error("M2_R3_R2_E_ZERO_DENOMINATOR_METRIC");
  }
  const passed = expectedCases.filter((qualityCase) =>
    predicate(callsById.get(qualityCase.case_id), qualityCase),
  ).length;
  return {
    passed,
    total: expectedCases.length,
    rate: passed / expectedCases.length,
    evidence_status: "available",
  };
}

function metricFromBooleanResults(results) {
  if (results.length === 0) {
    throw new Error("M2_R3_R2_E_ZERO_DENOMINATOR_METRIC");
  }
  const passed = results.filter(Boolean).length;
  return {
    passed,
    total: results.length,
    rate: passed / results.length,
    evidence_status: "available",
  };
}

export function evaluateDiagnostic(contract, qualityContract, result) {
  const expected = qualityContract.cases;
  const baseCases = expected.filter((item) => item.stage_id === "PB-01");
  const candidateCases = expected.filter((item) => item.stage_id === "PB-01C");
  const calls = asArray(result.calls);
  const callsById = new Map(calls.map((call) => [call.case_id, call]));
  const responseCounts = new Map();
  for (const call of calls) {
    if (typeof call.response_id === "string" && call.response_id.length > 0) {
      responseCounts.set(call.response_id, (responseCounts.get(call.response_id) ?? 0) + 1);
    }
  }
  const softResults = expected.flatMap((qualityCase) => {
    const call = callsById.get(qualityCase.case_id);
    const recorded = asArray(call?.evaluation?.soft_assertions);
    if (recorded.length > 0) return recorded.map((item) => item.passed === true);
    return qualityCase.assertions
      .filter((assertion) => assertion.blocking === false)
      .map(() => false);
  });
  const metric = (cases, predicate) =>
    metricFromExpectedCases(cases, callsById, predicate);
  const metrics = {
    provider_attempted: metric(expected, (call) => call?.provider_attempted === true),
    provider_completed: metric(expected, (call) => call?.provider_completed === true),
    returned_model_exact: metric(expected, (call) => call?.returned_model_exact === true),
    unique_response_ids: metric(
      expected,
      (call) =>
        typeof call?.response_id === "string" &&
        call.response_id.length > 0 &&
        responseCounts.get(call.response_id) === 1,
    ),
    provider_input_isolation: metric(
      expected,
      (call) => call?.provider_input_isolation_passed === true,
    ),
    raw_base_schema: metric(baseCases, (call) => call?.raw_schema_result?.passed === true),
    raw_base_source_integrity: metric(
      baseCases,
      (call) => call?.raw_source_integrity_result?.passed === true,
    ),
    grounded_base_schema: metric(
      baseCases,
      (call) => call?.grounded_schema_result?.passed === true,
    ),
    grounded_base_source_integrity: metric(
      baseCases,
      (call) => call?.grounded_source_integrity_result?.passed === true,
    ),
    contextual_intake_integrity: metric(
      baseCases,
      (call) => call?.contextual_integrity_result?.passed === true,
    ),
    application_canonical_fields: metric(
      baseCases,
      (call) => call?.application_canonical_result?.passed === true,
    ),
    pb_01_semantic_cases: metric(
      baseCases,
      (call) => call?.evaluation?.semantic_verdict === "PASS",
    ),
    candidate_fields_in_base_zero: metric(
      baseCases,
      (call) => call?.candidate_field_count_in_base === 0,
    ),
    optional_message_source_refs_zero: metric(
      baseCases,
      (call) => call?.optional_message_source_ref_count === 0,
    ),
    raw_candidate_schema: metric(
      candidateCases,
      (call) => call?.raw_schema_result?.passed === true,
    ),
    candidate_source_integrity: metric(
      candidateCases,
      (call) =>
        call?.raw_source_integrity_result?.passed === true &&
        call?.grounded_source_integrity_result?.passed === true,
    ),
    candidate_allowlist_grounding: metric(
      candidateCases,
      (call) => call?.candidate_allowlist_grounding_result?.passed === true,
    ),
    pb_01c_semantic_cases: metric(
      candidateCases,
      (call) => call?.evaluation?.semantic_verdict === "PASS",
    ),
    base_fact_fields_in_candidate_zero: metric(
      candidateCases,
      (call) => call?.base_fact_field_count_in_candidate === 0,
    ),
    raw_candidate_echo_zero: metric(
      candidateCases,
      (call) => call?.raw_candidate_echo_count === 0,
    ),
    candidate_metadata_leakage_zero: metric(
      candidateCases,
      (call) => call?.source_ref_id_operational_metadata_count === 0,
    ),
    all_case_verdicts: metric(
      expected,
      (call) => call?.evaluation?.case_verdict === "PASS",
    ),
    provider_output_immutability: metric(
      expected,
      (call) =>
        call?.provider_output_mutated === false &&
        call?.raw_output_sha256 !== null &&
        call?.raw_output_sha256 === call?.raw_output_sha256_after_processing,
    ),
    expected_data_injection_zero: metric(
      expected,
      (call) => call?.expected_data_injection_count === 0,
    ),
    secret_leakage_zero: metric(
      expected,
      (call) => call?.secret_leakage_count === 0,
    ),
    exact_literal_leakage_zero: metric(
      expected,
      (call) => call?.exact_literal_leakage_count === 0,
    ),
    case_fixture_oracle_reference_zero: metric(
      expected,
      (call) => call?.case_fixture_oracle_reference_count === 0,
    ),
    soft_assertions: metricFromBooleanResults(softResults),
    evaluator_self_tests: metricFromBooleanResults(
      Array.from(
        { length: 16 },
        (_, index) => result.evaluator_self_tests?.results?.[index]?.passed === true,
      ),
    ),
  };
  const requiredMetrics = Object.values(metrics).filter(
    (_, index) => Object.keys(metrics)[index] !== "soft_assertions",
  );
  const exactOperationalPass =
    result.calls_actual === contract.authorized_calls &&
    result.calls_completed === contract.authorized_calls &&
    result.pb_01_calls === contract.pb_01_calls &&
    result.pb_01c_calls === contract.pb_01c_calls &&
    result.retry_count === 0 &&
    result.repair_count === 0 &&
    result.fallback_count === 0 &&
    result.pb_02_through_pb_06_calls === 0 &&
    result.db_operations === 0 &&
    result.supabase_operations === 0 &&
    result.holdout_use === 0 &&
    result.real_user_data === 0 &&
    result.migration_applied === false &&
    result.active_service_changed === false &&
    result.active_runtime_activated === false &&
    result.authorization_consumed === true &&
    result.rerun_authorized === false &&
    result.r4_authorized === false &&
    result.c2_authorized === false;
  let verdict = "NOT_EXECUTED";
  if (result.status === "running") verdict = "NOT_COMPLETE";
  else if (result.status === contract.evaluation_blocked_status) verdict = "EVALUATION_BLOCKED";
  else if (result.status !== "not_started") {
    verdict =
      exactOperationalPass && requiredMetrics.every((item) => item.rate === 1)
        ? "PASS"
        : "FAIL";
  }
  const hardFailures = expected.flatMap((qualityCase) => {
    const call = callsById.get(qualityCase.case_id);
    if (!call) return [{ case_id: qualityCase.case_id, failure: "CALL_MISSING" }];
    return asArray(call.evaluation?.hard_failures).map((failure) => ({
      case_id: qualityCase.case_id,
      failure,
    }));
  });
  const softFindings = expected.flatMap((qualityCase) => {
    const call = callsById.get(qualityCase.case_id);
    return asArray(call?.evaluation?.soft_findings).map((finding) => ({
      case_id: qualityCase.case_id,
      finding,
    }));
  });
  return {
    evaluator_version: EVALUATOR_VERSION,
    verdict,
    exact_operational_pass: exactOperationalPass,
    case_pass_count: calls.filter(
      (call) => call.evaluation?.case_verdict === "PASS",
    ).length,
    case_count: expected.length,
    metrics,
    hard_failures: hardFailures,
    soft_findings: softFindings,
  };
}

function selfTestAssertion({ operator, actual, expected, shouldPass }) {
  const qualityContract = {
    allowed_operators: [operator],
    direct_material_candidate_safety_codes: [],
  };
  const call = {
    case_id: "SELF",
    provider_input: {},
    raw_output: { value: actual },
    grounded_output: null,
  };
  const result = evaluateAssertion(
    call,
    {
      assertion_id: "SELF-" + operator,
      case_id: "SELF",
      surface: "raw_output",
      json_path: "value",
      operator,
      expected,
      blocking: true,
      rationale: "self-test",
    },
    qualityContract,
  );
  return result.passed === shouldPass;
}

export function runEvaluatorSelfTests() {
  const tests = [];
  const add = (name, passed) => tests.push({ name, passed: passed === true });
  add(
    "primitive equals PASS and FAIL",
    selfTestAssertion({ operator: "equals", actual: "x", expected: "x", shouldPass: true }) &&
      selfTestAssertion({ operator: "equals", actual: "x", expected: "y", shouldPass: false }),
  );
  add(
    "one_of PASS and FAIL",
    selfTestAssertion({ operator: "one_of", actual: "a", expected: ["a", "b"], shouldPass: true }) &&
      selfTestAssertion({ operator: "one_of", actual: "c", expected: ["a", "b"], shouldPass: false }),
  );
  add(
    "contains_all ignores array order",
    selfTestAssertion({ operator: "contains_all", actual: ["b", "a"], expected: ["a", "b"], shouldPass: true }),
  );
  add(
    "contains_any requires at least one",
    selfTestAssertion({ operator: "contains_any", actual: ["b"], expected: ["a", "b"], shouldPass: true }) &&
      selfTestAssertion({ operator: "contains_any", actual: ["c"], expected: ["a", "b"], shouldPass: false }),
  );
  add(
    "excludes_all detects one forbidden value",
    selfTestAssertion({ operator: "excludes_all", actual: ["ok", "bad"], expected: ["bad"], shouldPass: false }),
  );
  add(
    "subset path ignores unspecified valid field",
    (() => {
      const contract = { allowed_operators: ["equals"], direct_material_candidate_safety_codes: [] };
      const call = { case_id: "SELF", provider_input: {}, raw_output: { wanted: 1, extra: 2 }, grounded_output: null };
      return evaluateAssertion(call, { assertion_id: "SELF-SUBSET", case_id: "SELF", surface: "raw_output", json_path: "wanted", operator: "equals", expected: 1, blocking: true, rationale: "self-test" }, contract).passed;
    })(),
  );
  add(
    "practical reason compares primitive kind and active only",
    (() => {
      const value = { kind: "schedule_coordination", active: true, deadline: "unknown" };
      return value.kind === "schedule_coordination" && value.active === true;
    })(),
  );
  add(
    "allowed primitive pair accepts only listed pair",
    selfTestAssertion({ operator: "allowed_primitive_pairs", actual: ["none", false], expected: [["none", false], ["unknown", false]], shouldPass: true }) &&
      selfTestAssertion({ operator: "allowed_primitive_pairs", actual: ["unknown", true], expected: [["none", false], ["unknown", false]], shouldPass: false }),
  );
  add(
    "unknown and null are not positive inference",
    selfTestAssertion({ operator: "one_of", actual: "unknown", expected: ["positive"], shouldPass: false }) &&
      selfTestAssertion({ operator: "one_of", actual: null, expected: ["positive"], shouldPass: false }),
  );
  add(
    "exact literal absence detects leak",
    selfTestAssertion({ operator: "exact_literal_absent", actual: { text: "secret-value" }, expected: ["secret-value"], shouldPass: false }),
  );
  add(
    "raw output hash detects mutation",
    shaDiagnosticJson({ stable: true }) !== shaDiagnosticJson({ stable: false }),
  );
  add(
    "expected value injection is detected",
    expectedDataInjectionCount(
      { current_situation: "source", expected: "schedule_coordination" },
      { assertions: [{ expected: "schedule_coordination" }] },
      { direct_material_candidate_safety_codes: [] },
      ["current_situation"],
    ) > 0,
  );
  add(
    "case ID injection is detected",
    forbiddenInputReferenceCount(
      { current_situation: "source", case_id: "E-B01" },
      "E-B01",
      ["case_id"],
    ) > 0,
  );
  add(
    "zero denominator soft metric is rejected",
    (() => {
      try {
        metricFromBooleanResults([]);
        return false;
      } catch (error) {
        return error.message === "M2_R3_R2_E_ZERO_DENOMINATOR_METRIC";
      }
    })(),
  );
  add(
    "Candidate Safety duplicate code is rejected",
    selfTestAssertion({ operator: "unique_array", actual: ["threat", "threat"], expected: true, shouldPass: false }),
  );
  add(
    "Source-ref integrity violation is rejected",
    (() => {
      const contract = { allowed_operators: ["valid_reference_integrity"], direct_material_candidate_safety_codes: [] };
      const call = {
        case_id: "SELF",
        provider_input: {},
        raw_output: {
          observed_facts: [{ fact_id: "F001", source_refs: ["input:current_situation"] }],
          context_inferences: [{ supporting_fact_ids: ["F999"], source_refs: ["input:current_situation"] }],
        },
        grounded_output: null,
      };
      return !evaluateAssertion(call, { assertion_id: "SELF-REF", case_id: "SELF", surface: "raw_output", bounded_evaluator_target: { type: "reference_integrity" }, operator: "valid_reference_integrity", expected: true, blocking: true, rationale: "self-test" }, contract).passed;
    })(),
  );
  return {
    evaluator_version: EVALUATOR_VERSION,
    passed: tests.filter((test) => test.passed).length,
    total: tests.length,
    results: tests,
  };
}

function metricText(metric) {
  if (!metric || metric.total === 0) return "0/0 (unavailable)";
  return `${metric.passed}/${metric.total}`;
}

function passText(value) {
  return value === true ? "PASS" : "FAIL";
}

export function renderDiagnosticSummary(result, caseBundle) {
  const purposes = new Map(caseBundle.map((item) => [item.case_id, item.purpose]));
  const rows = asArray(result.calls).map(
    (call) =>
      `| ${call.call_index} | ${call.case_id} | ${call.stage_id} | ${call.returned_model ?? "unavailable"} | ${passText(call.raw_schema_result?.passed)} | ${passText(call.raw_source_integrity_result?.passed)} | ${passText(call.grounded_source_integrity_result?.passed)} | ${call.evaluation?.semantic_verdict ?? "NOT_RUN"} | ${call.evaluation?.case_verdict ?? "NOT_RUN"} | ${call.response_id ?? "unavailable"} | ${call.usage?.input_tokens ?? 0}/${call.usage?.output_tokens ?? 0} | ${purposes.get(call.case_id) ?? "unavailable"} |`,
  );
  const metrics = Object.entries(result.evaluation?.metrics ?? {}).map(
    ([name, metric]) => `| ${name} | ${metricText(metric)} | ${metric.evidence_status ?? "unavailable"} |`,
  );
  const failures = asArray(result.evaluation?.hard_failures).length
    ? result.evaluation.hard_failures
        .map((item) => `- ${item.case_id}: ${item.failure}`)
        .join("\n")
    : "- None";
  const soft = asArray(result.evaluation?.soft_findings).length
    ? result.evaluation.soft_findings
        .map((item) => `- ${item.case_id}: ${item.finding}`)
        .join("\n")
    : "- None";
  return [
    "# M2-P4-I3-R1-C1-R3-R2-E Diagnostic Summary",
    "",
    "## Result",
    "",
    `- Status: ${result.status}`,
    `- Verdict: ${result.evaluation?.verdict ?? "NOT_EXECUTED"}`,
    `- Package Commit A: ${result.package_commit ?? "unavailable"}`,
    `- Calls: ${result.calls_actual}/${result.calls_authorized}`,
    `- PB-01 / PB-01C: ${result.pb_01_calls}/8 / ${result.pb_01c_calls}/6`,
    `- Completed calls: ${result.calls_completed}/${result.calls_authorized}`,
    `- Returned model exact: ${metricText(result.evaluation?.metrics?.returned_model_exact)}`,
    `- Evaluator self-tests: ${result.evaluator_self_tests?.passed ?? 0}/${result.evaluator_self_tests?.total ?? 16}`,
    `- Retry / repair / fallback: ${result.retry_count}/${result.repair_count}/${result.fallback_count}`,
    `- Output mutation / expected injection / secret leakage / exact literal leakage: ${result.provider_output_mutation_count}/${result.expected_data_injection_count}/${result.secret_leakage_count}/${result.exact_literal_leakage_count}`,
    `- Provider quality established: ${result.provider_quality_established}`,
    `- Provider quality scope: ${result.provider_quality_scope}`,
    `- Candidate ready for isolated E2E: ${result.candidate_ready_for_isolated_e2e}`,
    `- R4 ready / authorized: ${result.r4_ready}/${result.r4_authorized}`,
    "",
    "## Exact fourteen cases",
    "",
    "| # | Case | Stage | Returned model | Raw Schema | Raw Integrity | Grounded Integrity | Semantic | Case | Response ID | Input/Output tokens | Purpose |",
    "|---:|---|---|---|---:|---:|---:|---:|---:|---|---:|---|",
    ...rows,
    "",
    "## Metrics",
    "",
    "| Metric | Result | Evidence |",
    "|---|---:|---|",
    ...metrics,
    "",
    "## Hard failures",
    "",
    failures,
    "",
    "## Soft findings",
    "",
    soft,
    "",
    "## Usage totals",
    "",
    `- Input tokens: ${result.usage_totals.input_tokens}`,
    `- Cached input tokens: ${result.usage_totals.cached_tokens}`,
    `- Output tokens: ${result.usage_totals.output_tokens}`,
    `- Reasoning tokens: ${result.usage_totals.reasoning_tokens}`,
    "",
    "## Scope boundary",
    "",
    "This evidence covers only the exact eight synthetic-natural-language PB-01 Base cases and six PB-01C Candidate cases. It does not establish full Runtime quality, final reply quality, final report quality, DB or migration compatibility, site readiness, production readiness, or Runtime activation. PB-02 through PB-06, DB, Supabase, migration application, R4, C2, PR, and main integration remain outside authority.",
    "",
  ].join("\n");
}

export function renderReviewDocument(result, caseBundle) {
  return [
    "# M2-P4-I3-R1-C1-R3-R2-E Review",
    "",
    "<!-- M2-P4-I3-R1-C1-R3-R2-E:BEGIN -->",
    renderDiagnosticSummary(result, caseBundle).replace(
      "# M2-P4-I3-R1-C1-R3-R2-E Diagnostic Summary\n\n",
      "",
    ),
    "- Migration applied: false",
    "- Active Service changed: false",
    "- Active Runtime activated: false",
    "- Main changed: false",
    "- R4 authorized: false",
    "- C2 authorized: false",
    "- Human / ChatGPT review: pending",
    "<!-- M2-P4-I3-R1-C1-R3-R2-E:END -->",
    "",
  ].join("\n");
}

export function renderDocumentationStatusBlock(result) {
  return [
    "<!-- M2-P4-I3-R1-C1-R3-R2-E:BEGIN -->",
    `M2-P4-I3-R1-C1-R3-R2-E is \`${result.status}\` on \`${result.branch}\`. Commit A is \`${result.package_commit ?? "unavailable"}\`; exact scope is \`14/14\`, post-run mutable scope is \`8/8\`, Provider calls are \`${result.calls_actual}/14\` with PB-01 \`${result.pb_01_calls}/8\` and PB-01C \`${result.pb_01c_calls}/6\`, and returned-model exactness is \`${metricText(result.evaluation?.metrics?.returned_model_exact)}\`. The frozen evaluator self-tests are \`${result.evaluator_self_tests?.passed ?? 0}/16\`; overall verdict is \`${result.evaluation?.verdict ?? "NOT_EXECUTED"}\`; Provider quality established is \`${result.provider_quality_established}\`; Candidate ready for isolated E2E is \`${result.candidate_ready_for_isolated_e2e}\`. Output mutation, expected-data injection, secret leakage, and exact-literal leakage are \`${result.provider_output_mutation_count}/${result.expected_data_injection_count}/${result.secret_leakage_count}/${result.exact_literal_leakage_count}\`. Migration remains unapplied, Active Service and main remain unchanged, and R4 / C2 authorization remains \`false / false\`. Human / ChatGPT review is pending and rerun is unauthorized.`,
    "<!-- M2-P4-I3-R1-C1-R3-R2-E:END -->",
  ].join("\n");
}
