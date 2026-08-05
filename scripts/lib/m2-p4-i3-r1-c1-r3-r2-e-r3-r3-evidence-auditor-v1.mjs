import { createHash } from "node:crypto";

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (isObject(value)) {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, canonicalize(value[key])]),
    );
  }
  return value;
}

function canonicalJson(value) {
  return JSON.stringify(canonicalize(value));
}

function shaJson(value) {
  return createHash("sha256")
    .update(Buffer.from(canonicalJson(value), "utf8"))
    .digest("hex");
}

function same(left, right) {
  return canonicalJson(left) === canonicalJson(right);
}

function exactKeys(value, expected) {
  return (
    isObject(value) &&
    same(Object.keys(value).sort(), [...expected].sort())
  );
}

function forbiddenHits(value, forbidden, path = "$", result = []) {
  if (Array.isArray(value)) {
    value.forEach((item, index) =>
      forbiddenHits(item, forbidden, path + "[" + index + "]", result),
    );
    return result;
  }
  if (!isObject(value)) return result;
  for (const [key, item] of Object.entries(value)) {
    const child = path + "." + key;
    if (forbidden.has(key)) result.push(child);
    forbiddenHits(item, forbidden, child, result);
  }
  return result;
}

function plannedLedger(contract) {
  return Object.entries(contract.call_ledger.expected_stage_paths).flatMap(
    ([caseId, stages]) =>
      stages.map((stageId, index) => ({
        case_id: caseId,
        stage_id: stageId,
        case_call_index: index + 1,
      })),
  );
}

function actualLedger(result) {
  return (result.cases ?? []).flatMap((caseResult) =>
    (caseResult.provider_calls ?? []).map((call, index) => ({
      case_id: caseResult.case_id,
      stage_id: call.stage_id,
      case_call_index: call.case_call_index ?? index + 1,
    })),
  );
}

function ledgerIsExactOrConsumedPrefix(contract, result) {
  const planned = plannedLedger(contract);
  const actual = actualLedger(result);
  if (actual.length > planned.length) return false;
  const exactPrefix = actual.every((item, index) => same(item, planned[index]));
  if (!exactPrefix) return false;
  const completedRun =
    result.status === "EXECUTED" ||
    result.status === "EXECUTED_PENDING_EVIDENCE_COMMIT" ||
    result.technical_failure === null;
  return completedRun ? actual.length === planned.length : true;
}

function contextFrom(call) {
  return call?.provider_request?.input?.action_context;
}

function actionContextsValid(contract, calls) {
  const byCase = new Map();
  for (const call of calls) {
    if (!["PB-04", "PB-05", "PB-06"].includes(call.stage_id)) continue;
    const context = contextFrom(call);
    if (
      !isObject(context) ||
      context.time_zone !== contract.runtime_identity.time_zone ||
      context.authority !== "application" ||
      typeof context.trusted_now_iso !== "string" ||
      typeof context.action_horizon?.code !== "string" ||
      typeof context.action_horizon?.starts_at !== "string" ||
      typeof context.action_horizon?.ends_at !== "string" ||
      typeof context.action_horizon?.user_facing_label_ja !== "string"
    ) {
      return false;
    }
    const existing = byCase.get(call.case_id);
    if (existing && !same(existing, context)) return false;
    byCase.set(call.case_id, context);
  }
  return true;
}

function caseAudit(contract, caseResult) {
  const calls = caseResult.provider_calls ?? [];
  const rejected = caseResult.rejected_provider_inputs ?? [];
  const expectedPath =
    contract.call_ledger.expected_stage_paths[caseResult.case_id] ?? [];
  const actualPath = calls.map((call) => call.stage_id);
  const stopped = caseResult.safe_error_code !== null;
  const stageOrderPassed = stopped
    ? actualPath.every((stageId, index) => stageId === expectedPath[index])
    : same(actualPath, expectedPath);
  const requestHashesValid = calls.every(
    (call) =>
      isObject(call.provider_request) &&
      call.request_sha256 === shaJson(call.provider_request),
  );
  const completed = calls.filter((call) => call.provider_completed === true);
  const rawHashesValid = completed.every(
    (call) =>
      call.raw_output !== null &&
      call.raw_output_sha256 === shaJson(call.raw_output) &&
      (call.raw_output_sha256_after_processing === undefined ||
        call.raw_output_sha256_after_processing === call.raw_output_sha256),
  );
  const responseIds = completed.map((call) => call.response_id);
  const responseIdsPassed =
    responseIds.every((value) => typeof value === "string" && value.length > 0) &&
    new Set(responseIds).size === responseIds.length;
  const inputKeysPassed =
    rejected.length === 0 &&
    calls.every((call) =>
      exactKeys(
        call.provider_request?.input,
        contract.stage_input_keys[call.stage_id] ?? [],
      ),
    );
  const forbidden = new Set(contract.provider_oracle_forbidden_keys);
  const forbiddenKeyPaths = [
    ...calls.flatMap((call) =>
      forbiddenHits(call.provider_request?.input, forbidden),
    ),
    ...rejected.flatMap((item) =>
      forbiddenHits(item.provider_request?.input, forbidden),
    ),
  ];
  const modelPassed = calls.every(
    (call) =>
      call.requested_model === contract.runtime_identity.model &&
      (!call.provider_completed ||
        call.returned_model === contract.runtime_identity.model),
  );
  const actionContextPassed = actionContextsValid(contract, calls);
  const protocolPassed =
    stageOrderPassed &&
    requestHashesValid &&
    rawHashesValid &&
    responseIdsPassed &&
    inputKeysPassed &&
    forbiddenKeyPaths.length === 0 &&
    modelPassed &&
    actionContextPassed;
  return {
    case_id: caseResult.case_id,
    expected_stage_path: expectedPath,
    actual_stage_path: actualPath,
    expected_stage_count: expectedPath.length,
    actual_stage_count: actualPath.length,
    stopped_on_failure: stopped,
    stage_order_passed: stageOrderPassed,
    request_hashes_valid: requestHashesValid,
    raw_output_hashes_valid: rawHashesValid,
    response_ids_present_and_unique: responseIdsPassed,
    provider_input_keys_exact: inputKeysPassed,
    rejected_provider_input_count: rejected.length,
    forbidden_key_paths: forbiddenKeyPaths,
    model_exact: modelPassed,
    action_context_exact: actionContextPassed,
    protocol_passed: protocolPassed,
    failure_identity: protocolPassed
      ? null
      : shaJson({
          stageOrderPassed,
          requestHashesValid,
          rawHashesValid,
          responseIdsPassed,
          inputKeysPassed,
          forbiddenKeyPaths,
          modelPassed,
          actionContextPassed,
        }),
  };
}

export function auditEvidence(
  contract,
  result,
  authorization,
  { markerExists = false } = {},
) {
  const calls = (result.cases ?? []).flatMap(
    (caseResult) => caseResult.provider_calls ?? [],
  );
  const completed = calls.filter((call) => call.provider_completed === true);
  const caseAudits = (result.cases ?? []).map((caseResult) =>
    caseAudit(contract, caseResult),
  );
  const requestHashesMatched = calls.filter(
    (call) =>
      isObject(call.provider_request) &&
      call.request_sha256 === shaJson(call.provider_request),
  ).length;
  const rawOutputHashesMatched = completed.filter(
    (call) =>
      call.raw_output !== null &&
      call.raw_output_sha256 === shaJson(call.raw_output),
  ).length;
  const responseIds = completed
    .map((call) => call.response_id)
    .filter((value) => typeof value === "string" && value.length > 0);
  const allForbidden = new Set(contract.provider_oracle_forbidden_keys);
  const forbiddenKeyPaths = (result.cases ?? []).flatMap((caseResult) => [
    ...(caseResult.provider_calls ?? []).flatMap((call) =>
      forbiddenHits(call.provider_request?.input, allForbidden),
    ),
    ...(caseResult.rejected_provider_inputs ?? []).flatMap((item) =>
      forbiddenHits(item.provider_request?.input, allForbidden),
    ),
  ]);
  const operationCountsExact =
    result.operations.retry_calls === 0 &&
    result.operations.repair_calls === 0 &&
    result.operations.fallback_calls === 0 &&
    result.operations.parallel_calls === 0;
  const attemptsExact =
    result.provider_attempts === calls.length &&
    authorization.actual_attempts === calls.length &&
    authorization.provider_calls === calls.length;
  const completedExact =
    result.completed_calls === completed.length &&
    authorization.completed_calls === completed.length;
  const markerAndAuthorizationExact =
    authorization.consumed === true &&
    authorization.execution_authorized === true &&
    authorization.marker_created === true &&
    markerExists === true;
  const ledgerPassed = ledgerIsExactOrConsumedPrefix(contract, result);
  const caseProtocolPassed = caseAudits.every((item) => item.protocol_passed);
  const verdict =
    ledgerPassed &&
    caseProtocolPassed &&
    requestHashesMatched === calls.length &&
    rawOutputHashesMatched === completed.length &&
    responseIds.length === completed.length &&
    new Set(responseIds).size === responseIds.length &&
    forbiddenKeyPaths.length === 0 &&
    operationCountsExact &&
    attemptsExact &&
    completedExact &&
    markerAndAuthorizationExact
      ? "PASS"
      : "FAIL";
  return {
    schema_version:
      "m2-p4-i3-r1-c1-r3-r2-e-r3-r3-independent-evidence-audit-v1",
    task_id: contract.task_id,
    authority: "independent_recomputation_from_raw_evidence",
    product_assertions_consumed: false,
    product_verdict_consumed: false,
    verdict,
    request_hashes: {
      matched: requestHashesMatched,
      total: calls.length,
    },
    raw_output_hashes: {
      matched: rawOutputHashesMatched,
      total: completed.length,
    },
    response_ids: {
      present: responseIds.length,
      unique: new Set(responseIds).size,
      total: completed.length,
    },
    stage_counts_and_order_passed: ledgerPassed,
    provider_input_key_sets_passed: caseAudits.every(
      (item) => item.provider_input_keys_exact,
    ),
    forbidden_key_count: forbiddenKeyPaths.length,
    forbidden_key_paths: forbiddenKeyPaths,
    model_identity_passed: caseAudits.every((item) => item.model_exact),
    action_context_equality_passed: caseAudits.every(
      (item) => item.action_context_exact,
    ),
    time_zone: contract.runtime_identity.time_zone,
    provider_attempts: calls.length,
    completed_calls: completed.length,
    retry_calls: result.operations.retry_calls,
    repair_calls: result.operations.repair_calls,
    fallback_calls: result.operations.fallback_calls,
    parallel_calls: result.operations.parallel_calls,
    marker_state_passed: markerAndAuthorizationExact,
    authorization_state_passed: markerAndAuthorizationExact,
    case_audits: caseAudits,
  };
}

function syntheticCall(contract, caseId, stageId, callIndex, caseCallIndex) {
  const input = Object.fromEntries(
    contract.stage_input_keys[stageId].map((key) => [key, key === "action_context"
      ? {
          trusted_now_iso: "2026-08-05T10:00:00.000Z",
          time_zone: "Asia/Tokyo",
          authority: "application",
          action_horizon: {
            code: "current_local_day_remaining",
            user_facing_label_ja: "今夜",
            starts_at: "2026-08-05T10:00:00.000Z",
            ends_at: "2026-08-05T15:00:00.000Z",
          },
        }
      : {}]),
  );
  const providerRequest = {
    stage_id: stageId,
    model: contract.runtime_identity.model,
    input,
  };
  const rawOutput = { stage_id: stageId, synthetic: true };
  return {
    call_index: callIndex,
    case_call_index: caseCallIndex,
    case_id: caseId,
    stage_id: stageId,
    provider_attempted: true,
    provider_completed: true,
    requested_model: contract.runtime_identity.model,
    returned_model: contract.runtime_identity.model,
    response_id: "resp-" + callIndex,
    provider_request: providerRequest,
    request_sha256: shaJson(providerRequest),
    raw_output: rawOutput,
    raw_output_sha256: shaJson(rawOutput),
    raw_output_sha256_after_processing: shaJson(rawOutput),
  };
}

function syntheticEvidence(contract) {
  let callIndex = 0;
  const cases = Object.entries(contract.call_ledger.expected_stage_paths).map(
    ([caseId, stages]) => ({
      case_id: caseId,
      actual_stage_path: [...stages],
      safe_error_code: null,
      provider_calls: stages.map((stageId, index) =>
        syntheticCall(contract, caseId, stageId, ++callIndex, index + 1),
      ),
    }),
  );
  return {
    result: {
      status: "EXECUTED",
      provider_attempts: callIndex,
      completed_calls: callIndex,
      technical_failure: null,
      cases,
      operations: {
        provider_calls: callIndex,
        db_operations: 0,
        supabase_operations: 0,
        retry_calls: 0,
        repair_calls: 0,
        fallback_calls: 0,
        parallel_calls: 0,
      },
    },
    authorization: {
      execution_authorized: true,
      consumed: true,
      marker_created: true,
      actual_attempts: callIndex,
      completed_calls: callIndex,
      provider_calls: callIndex,
    },
  };
}

export function runEvidenceAuditorSelfTests(contract) {
  const tests = [];
  const test = (name, operation) => {
    let passed = false;
    try {
      passed = operation() === true;
    } catch {
      passed = false;
    }
    tests.push({ name, passed });
  };
  const evaluate = (mutate) => {
    const sample = syntheticEvidence(contract);
    mutate?.(sample);
    return auditEvidence(contract, sample.result, sample.authorization, {
      markerExists: true,
    });
  };

  test("valid 37-call evidence passes", () => evaluate().verdict === "PASS");
  test("forbidden oracle key is rejected", () =>
    evaluate(({ result }) => {
      const call = result.cases[0].provider_calls[0];
      call.provider_request.input.oracle = "forbidden";
      call.request_sha256 = shaJson(call.provider_request);
    }).forbidden_key_count === 1,
  );
  test("missing action_context is rejected", () =>
    evaluate(({ result }) => {
      const call = result.cases[0].provider_calls.find(
        (item) => item.stage_id === "PB-04",
      );
      delete call.provider_request.input.action_context;
      call.request_sha256 = shaJson(call.provider_request);
    }).verdict === "FAIL",
  );
  test("mismatched action_context is rejected", () =>
    evaluate(({ result }) => {
      const call = result.cases[0].provider_calls.find(
        (item) => item.stage_id === "PB-05",
      );
      call.provider_request.input.action_context.action_horizon.code = "mutated";
      call.request_sha256 = shaJson(call.provider_request);
    }).verdict === "FAIL",
  );
  test("wrong model is rejected", () =>
    evaluate(({ result }) => {
      result.cases[0].provider_calls[0].returned_model = "wrong-model";
    }).verdict === "FAIL",
  );
  test("retry attempt is rejected", () =>
    evaluate(({ result }) => {
      result.operations.retry_calls = 1;
    }).verdict === "FAIL",
  );
  test("extra call is rejected", () =>
    evaluate(({ result, authorization }) => {
      const last = structuredClone(result.cases.at(-1).provider_calls.at(-1));
      last.call_index += 1;
      last.case_call_index += 1;
      last.response_id += "-extra";
      result.cases.at(-1).provider_calls.push(last);
      result.provider_attempts += 1;
      result.completed_calls += 1;
      authorization.actual_attempts += 1;
      authorization.completed_calls += 1;
      authorization.provider_calls += 1;
    }).verdict === "FAIL",
  );
  test("missing call on completed run is rejected", () =>
    evaluate(({ result, authorization }) => {
      result.cases.at(-1).provider_calls.pop();
      result.provider_attempts -= 1;
      result.completed_calls -= 1;
      authorization.actual_attempts -= 1;
      authorization.completed_calls -= 1;
      authorization.provider_calls -= 1;
    }).verdict === "FAIL",
  );
  test("E-R3-03 post-PB-03 call is rejected", () =>
    evaluate(({ result, authorization }) => {
      const target = result.cases.find((item) => item.case_id === "E-R3-03");
      const extra = syntheticCall(
        contract,
        "E-R3-03",
        "PB-04",
        38,
        5,
      );
      target.provider_calls.push(extra);
      result.provider_attempts += 1;
      result.completed_calls += 1;
      authorization.actual_attempts += 1;
      authorization.completed_calls += 1;
      authorization.provider_calls += 1;
    }).verdict === "FAIL",
  );
  test("request hash mutation is rejected", () =>
    evaluate(({ result }) => {
      result.cases[0].provider_calls[0].request_sha256 = "0".repeat(64);
    }).verdict === "FAIL",
  );
  test("raw output hash mutation is rejected", () =>
    evaluate(({ result }) => {
      result.cases[0].provider_calls[0].raw_output_sha256 = "0".repeat(64);
    }).verdict === "FAIL",
  );
  test("marker and authorization mismatch is rejected", () => {
    const sample = syntheticEvidence(contract);
    sample.authorization.marker_created = false;
    return auditEvidence(contract, sample.result, sample.authorization, {
      markerExists: true,
    }).verdict === "FAIL";
  });
  return {
    passed: tests.filter((item) => item.passed).length,
    total: tests.length,
    tests,
  };
}
