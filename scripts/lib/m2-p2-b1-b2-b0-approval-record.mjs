import { createHash } from "node:crypto";
import {
  B0_BUDGET_EVIDENCE,
  B0_PRICE_SNAPSHOT,
  B0_PRICE_SNAPSHOT_SHA256,
} from "./m2-p2-b1-b2-b0-price-snapshot.mjs";

export const PAID_CONFIRMATION_PHRASE =
  "I_APPROVE_ONE_PAID_WAIT_003_RUN_UNDER_USD_1";

function sha256(text) {
  return createHash("sha256")
    .update(Buffer.from(text, "utf8"))
    .digest("hex");
}

export const PAID_CONFIRMATION_SHA256 = sha256(
  PAID_CONFIRMATION_PHRASE,
);

export const FIXED_REQUEST_HASHES = Object.freeze({
  "PB-01": Object.freeze({
    request_body_sha256:
      "3b7102770f8098e9d5670db851a3326368cca250b57f1bc54ac2f8e2e5cd6bd3",
    request_contract_sha256:
      "79c73d2d9b7a2802a70167dd4ebd71760a0afae1d2005cec356785271280dfcb",
  }),
  "PB-02": Object.freeze({
    request_body_sha256:
      "b72b8c73146761a7a14c785552052b00fbafbabc071238cac78471071d4e0e45",
    request_contract_sha256:
      "cf9ac5ac5d116ab6bbf456354bce8616112f23f9ac7968fd8663293d02dc437e",
  }),
  "PB-03": Object.freeze({
    request_body_sha256:
      "4bf61d835d087f219f839175f1fddc6bf88cc4b59d3a1a34561535784b449944",
    request_contract_sha256:
      "af772d560f7d0fc9ffb07ecae6292dfa6ae57a5640900b896d9caa11a665f829",
  }),
  "PB-04": Object.freeze({
    request_body_sha256:
      "225f3fcbbe4680a7fa641314bb70e85591bbbd8128002b9b2c30e3c7cc3fc67a",
    request_contract_sha256:
      "018a5d32c44b11e9be28ec6dd19f0e87dfb9ba7460bbccc269b07c904345fe2e",
  }),
  "PB-05": Object.freeze({
    request_body_sha256:
      "927d6a2fef2531351f9f7a5309322e6b2b5ab5cbe6b5e434d5772b40fac9b637",
    request_contract_sha256:
      "7cb417c7bf1775f6e62dc5746da77d8329717b772f2d778408abd94ea815dd34",
  }),
  "PB-06": Object.freeze({
    request_body_sha256:
      "93e841f202b7c6a0ef85efad00a81d231da33e09dc605008ba875f03ccfbbd5d",
    request_contract_sha256:
      "defb993ac1ccc9641809b048edd44ebbd189359e5974dbcfec9aeddc93a8fa01",
  }),
});

export const FIXED_PAID_TARGET = Object.freeze({
  task_id: "M2-P2-B1-B2-B0",
  contract_hash:
    "c3dfdc5ec6cb503a8d91ed4080c8734c9af9c7bf944e1bb6b5798536bb6c38e2",
  case_id: "WAIT-003",
  model: "gpt-5.6-luna",
  stages: Object.freeze([
    "PB-01",
    "PB-02",
    "PB-03",
    "PB-04",
    "PB-05",
    "PB-06",
  ]),
  max_provider_calls: 6,
  absolute_ceiling_usd: 1,
  preflight_ceiling_usd: 0.3,
  historical_static_cap_usd: 0.213223,
  live_guard_cost_usd: 0.26079625,
});

const exactApprovalKeys = Object.freeze([
  "schema_version",
  "record_type",
  "approval_id",
  "approval_status",
  "approval_record_present",
  "live_execution_authorized",
  "paid_run_authorized",
  "paid_run_completed",
  "one_time_only",
  "approved_runner_commit_sha",
  "approved_origin_main_sha",
  "approved_contract_hash",
  "approved_case",
  "approved_model",
  "approved_stages",
  "max_provider_calls",
  "absolute_ceiling_usd",
  "preflight_ceiling_usd",
  "historical_static_cap_usd",
  "live_guard_cost_usd",
  "exact_request_hashes",
  "price_snapshot_sha256",
  "price_snapshot_checked_at",
  "price_snapshot_verified_at",
  "approval_created_at",
  "approval_expires_at",
  "confirmation_phrase_sha256",
  "one_time_confirmation_hash",
  "human_chatgpt_decision_reference",
  "approval_record_sha256",
]);

function approvalError(stopCode, message) {
  return Object.assign(new Error(message), { stopCode });
}

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, canonicalize(value[key])]),
    );
  }
  return value;
}

function same(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function isSha256(value) {
  return typeof value === "string" && /^[0-9a-f]{64}$/u.test(value);
}

function isCommitShaOrPlaceholder(value) {
  return (
    value === "TO_BE_BOUND_AFTER_MAIN_ACCEPTANCE" ||
    (typeof value === "string" && /^[0-9a-f]{40}$/u.test(value))
  );
}

export function approvalRecordHash(record) {
  const hashInput = structuredClone(record);
  delete hashInput.approval_record_sha256;
  return sha256(JSON.stringify(canonicalize(hashInput)));
}

export function withApprovalRecordHash(record) {
  const result = structuredClone(record);
  result.approval_record_sha256 = approvalRecordHash(result);
  return result;
}

export function buildRepositoryApprovalTemplate() {
  return {
    schema_version: "m2-p2-b1-b2-b0-approval-record-v1",
    record_type: "repository_non_executable_template",
    approval_id: "DRAFT_NOT_EXECUTABLE",
    approval_status: "draft",
    approval_record_present: false,
    live_execution_authorized: false,
    paid_run_authorized: false,
    paid_run_completed: false,
    one_time_only: true,
    approved_runner_commit_sha:
      "TO_BE_BOUND_AFTER_MAIN_ACCEPTANCE",
    approved_origin_main_sha:
      "TO_BE_BOUND_AFTER_MAIN_ACCEPTANCE",
    approved_contract_hash: FIXED_PAID_TARGET.contract_hash,
    approved_case: FIXED_PAID_TARGET.case_id,
    approved_model: FIXED_PAID_TARGET.model,
    approved_stages: [...FIXED_PAID_TARGET.stages],
    max_provider_calls: FIXED_PAID_TARGET.max_provider_calls,
    absolute_ceiling_usd: FIXED_PAID_TARGET.absolute_ceiling_usd,
    preflight_ceiling_usd: FIXED_PAID_TARGET.preflight_ceiling_usd,
    historical_static_cap_usd:
      FIXED_PAID_TARGET.historical_static_cap_usd,
    live_guard_cost_usd: FIXED_PAID_TARGET.live_guard_cost_usd,
    exact_request_hashes: structuredClone(FIXED_REQUEST_HASHES),
    price_snapshot_sha256: B0_PRICE_SNAPSHOT_SHA256,
    price_snapshot_checked_at: B0_PRICE_SNAPSHOT.checked_at,
    price_snapshot_verified_at: null,
    approval_created_at: null,
    approval_expires_at: null,
    confirmation_phrase_sha256: PAID_CONFIRMATION_SHA256,
    one_time_confirmation_hash: PAID_CONFIRMATION_SHA256,
    human_chatgpt_decision_reference:
      "DRAFT_TEMPLATE_NO_APPROVAL_DECISION",
    approval_record_sha256: null,
  };
}

export function buildApprovedFixture({
  runnerSha = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  approvalId = "fixture-approved-0001",
  createdAt = "2026-07-29T00:00:00.000Z",
  expiresAt = "2026-07-29T00:30:00.000Z",
  priceVerifiedAt = "2026-07-29T00:00:00.000Z",
} = {}) {
  return withApprovalRecordHash({
    ...buildRepositoryApprovalTemplate(),
    record_type: "external_human_approval",
    approval_id: approvalId,
    approval_status: "approved",
    approval_record_present: true,
    live_execution_authorized: true,
    paid_run_authorized: true,
    approved_runner_commit_sha: runnerSha,
    approved_origin_main_sha: runnerSha,
    price_snapshot_verified_at: priceVerifiedAt,
    approval_created_at: createdAt,
    approval_expires_at: expiresAt,
    human_chatgpt_decision_reference:
      "FIXTURE_ONLY_NOT_A_REAL_HUMAN_APPROVAL",
  });
}

export function validateApprovalRecordShape(record) {
  if (
    !record ||
    typeof record !== "object" ||
    Array.isArray(record) ||
    !same(Object.keys(record).sort(), [...exactApprovalKeys].sort())
  ) {
    throw approvalError(
      "APPROVAL_SCHEMA_INVALID",
      "The approval record has missing or additional fields",
    );
  }
  const booleans = [
    "approval_record_present",
    "live_execution_authorized",
    "paid_run_authorized",
    "paid_run_completed",
    "one_time_only",
  ];
  if (
    booleans.some((key) => typeof record[key] !== "boolean") ||
    !["draft", "approved", "denied"].includes(
      record.approval_status,
    ) ||
    ![
      "repository_non_executable_template",
      "external_human_approval",
    ].includes(record.record_type) ||
    typeof record.approval_id !== "string" ||
    record.approval_id.length === 0 ||
    !isCommitShaOrPlaceholder(
      record.approved_runner_commit_sha,
    ) ||
    !isCommitShaOrPlaceholder(record.approved_origin_main_sha) ||
    !isSha256(record.approved_contract_hash) ||
    !isSha256(record.price_snapshot_sha256) ||
    !isSha256(record.confirmation_phrase_sha256) ||
    !isSha256(record.one_time_confirmation_hash) ||
    !Array.isArray(record.approved_stages) ||
    !Number.isInteger(record.max_provider_calls) ||
    ![
      record.absolute_ceiling_usd,
      record.preflight_ceiling_usd,
      record.historical_static_cap_usd,
      record.live_guard_cost_usd,
    ].every((value) => typeof value === "number" && Number.isFinite(value))
  ) {
    throw approvalError(
      "APPROVAL_SCHEMA_INVALID",
      "The approval record contains invalid field types",
    );
  }
  for (const stage of FIXED_PAID_TARGET.stages) {
    const pair = record.exact_request_hashes?.[stage];
    if (
      !pair ||
      !same(
        Object.keys(pair).sort(),
        ["request_body_sha256", "request_contract_sha256"].sort(),
      ) ||
      !isSha256(pair.request_body_sha256) ||
      !isSha256(pair.request_contract_sha256)
    ) {
      throw approvalError(
        "APPROVAL_SCHEMA_INVALID",
        "The approval request-hash map is invalid",
      );
    }
  }
  if (
    !same(
      Object.keys(record.exact_request_hashes).sort(),
      [...FIXED_PAID_TARGET.stages].sort(),
    ) ||
    ![
      "price_snapshot_verified_at",
      "approval_created_at",
      "approval_expires_at",
      "approval_record_sha256",
    ].every(
      (key) => record[key] === null || typeof record[key] === "string",
    )
  ) {
    throw approvalError(
      "APPROVAL_SCHEMA_INVALID",
      "The approval timestamps or hash fields are invalid",
    );
  }
  return structuredClone(record);
}

export function assertApprovedState(record) {
  if (
    record.record_type === "repository_non_executable_template" ||
    record.approval_record_present !== true
  ) {
    throw approvalError(
      "REPOSITORY_TEMPLATE_NOT_APPROVAL",
      "The repository template cannot authorize execution",
    );
  }
  if (record.approval_status !== "approved") {
    throw approvalError(
      "APPROVAL_STATUS_NOT_APPROVED",
      "The external approval status is not approved",
    );
  }
  if (record.live_execution_authorized !== true) {
    throw approvalError(
      "LIVE_EXECUTION_NOT_AUTHORIZED",
      "Live execution is not authorized",
    );
  }
  if (record.paid_run_authorized !== true) {
    throw approvalError(
      "PAID_RUN_NOT_AUTHORIZED",
      "Paid execution is not authorized",
    );
  }
  if (
    record.paid_run_completed !== false ||
    record.one_time_only !== true
  ) {
    throw approvalError(
      "APPROVAL_ONE_TIME_STATE_INVALID",
      "The one-time approval state is invalid",
    );
  }
  return true;
}

export function assertApprovalExpiry(record, executionTime) {
  const created = Date.parse(record.approval_created_at);
  const expires = Date.parse(record.approval_expires_at);
  const execution = Date.parse(executionTime);
  const maximumValidityMs = 30 * 60 * 1000;
  if (
    !Number.isFinite(created) ||
    !Number.isFinite(expires) ||
    !Number.isFinite(execution) ||
    expires <= created ||
    expires - created > maximumValidityMs ||
    execution < created ||
    execution >= expires
  ) {
    throw approvalError(
      "APPROVAL_EXPIRED",
      "The external approval is expired or exceeds 30 minutes",
    );
  }
  return true;
}

export function assertConfirmationHash(record, confirmation) {
  const actual = sha256(confirmation);
  if (
    actual !== PAID_CONFIRMATION_SHA256 ||
    record.confirmation_phrase_sha256 !== actual ||
    record.one_time_confirmation_hash !== actual
  ) {
    throw approvalError(
      "CONFIRMATION_HASH_MISMATCH",
      "The paid-run confirmation hash differs",
    );
  }
  return true;
}

export function assertRunnerSha(record, headSha) {
  if (
    record.approved_runner_commit_sha ===
      "TO_BE_BOUND_AFTER_MAIN_ACCEPTANCE" ||
    record.approved_origin_main_sha ===
      "TO_BE_BOUND_AFTER_MAIN_ACCEPTANCE"
  ) {
    throw approvalError(
      "RUNNER_SHA_PLACEHOLDER",
      "The external approval still contains a runner placeholder",
    );
  }
  if (record.approved_runner_commit_sha !== headSha) {
    throw approvalError(
      "APPROVAL_RUNNER_SHA_MISMATCH",
      "The approved runner SHA differs from HEAD",
    );
  }
  return true;
}

export function assertFixedApprovalTarget(record) {
  if (record.approved_contract_hash !== FIXED_PAID_TARGET.contract_hash) {
    throw approvalError(
      "APPROVAL_CONTRACT_HASH_MISMATCH",
      "The approved B0 contract hash differs",
    );
  }
  if (record.approved_case !== FIXED_PAID_TARGET.case_id) {
    throw approvalError(
      "APPROVAL_CASE_MISMATCH",
      "The approved case differs",
    );
  }
  if (record.approved_model !== FIXED_PAID_TARGET.model) {
    throw approvalError(
      "APPROVAL_MODEL_MISMATCH",
      "The approved model differs",
    );
  }
  if (!same(record.approved_stages, FIXED_PAID_TARGET.stages)) {
    throw approvalError(
      "APPROVAL_STAGE_LIST_MISMATCH",
      "The approved Stage list differs",
    );
  }
  if (record.max_provider_calls !== FIXED_PAID_TARGET.max_provider_calls) {
    throw approvalError(
      "APPROVAL_CALL_LIMIT_MISMATCH",
      "The approved provider-call limit differs",
    );
  }
  if (
    record.preflight_ceiling_usd !==
    FIXED_PAID_TARGET.preflight_ceiling_usd
  ) {
    throw approvalError(
      "APPROVAL_PREFLIGHT_CEILING_MISMATCH",
      "The approved preflight ceiling differs",
    );
  }
  if (
    record.absolute_ceiling_usd !==
    FIXED_PAID_TARGET.absolute_ceiling_usd
  ) {
    throw approvalError(
      "APPROVAL_ABSOLUTE_CEILING_MISMATCH",
      "The approved absolute ceiling differs",
    );
  }
  if (
    record.historical_static_cap_usd !==
      B0_BUDGET_EVIDENCE.historical_static_cap_usd ||
    record.live_guard_cost_usd !==
      B0_BUDGET_EVIDENCE.live_guard_cost_usd
  ) {
    throw approvalError(
      "APPROVAL_BUDGET_EVIDENCE_MISMATCH",
      "The approved static or live guard differs",
    );
  }
  return true;
}

export function assertExactRequestHashes(record) {
  if (!same(record.exact_request_hashes, FIXED_REQUEST_HASHES)) {
    throw approvalError(
      "APPROVAL_REQUEST_HASH_MISMATCH",
      "The approved request hashes differ",
    );
  }
  return true;
}

export function assertApprovalRecordHash(record) {
  if (
    !isSha256(record.approval_record_sha256) ||
    record.approval_record_sha256 !== approvalRecordHash(record)
  ) {
    throw approvalError(
      "APPROVAL_RECORD_HASH_MISMATCH",
      "The external approval record hash differs",
    );
  }
  return true;
}
