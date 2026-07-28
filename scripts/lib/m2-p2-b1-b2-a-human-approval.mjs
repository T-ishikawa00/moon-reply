import { createHash } from "node:crypto";

export const FIXED_LIVE_APPROVAL_TARGET = Object.freeze({
  contract_hash:
    "c3dfdc5ec6cb503a8d91ed4080c8734c9af9c7bf944e1bb6b5798536bb6c38e2",
  case_id: "WAIT-003",
  model: "gpt-5.6-luna",
  stages: ["PB-01", "PB-02", "PB-03", "PB-04", "PB-05", "PB-06"],
  max_provider_calls: 6,
  absolute_ceiling_usd: 1,
  preflight_ceiling_usd: 0.3,
});

export const DORMANT_APPROVAL_STATE = Object.freeze({
  approval_record_present: false,
  live_execution_authorized: false,
  paid_run_authorized: false,
  paid_run_completed: false,
  api_spend_usd: 0,
});

function approvalError(stopCode, message) {
  return Object.assign(new Error(message), { stopCode });
}

function same(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

export function approvalRecordHash(record) {
  return createHash("sha256")
    .update(Buffer.from(JSON.stringify(record), "utf8"))
    .digest("hex");
}

export function validateHumanApprovalRecord({
  record,
  expectedRunnerCommitSha,
  expectedRequestHashes,
  executionTime,
}) {
  if (!record) {
    throw approvalError(
      "HUMAN_APPROVAL_MISSING",
      "No paid Human approval record exists",
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
  const created = Date.parse(record.approval_created_at);
  const expires = Date.parse(record.approval_expires_at);
  const now = Date.parse(executionTime);
  if (
    !Number.isFinite(created) ||
    !Number.isFinite(expires) ||
    !Number.isFinite(now) ||
    now < created ||
    now >= expires
  ) {
    throw approvalError(
      "APPROVAL_EXPIRED",
      "The paid Human approval has expired",
    );
  }
  if (
    record.approved_runner_commit_sha !== expectedRunnerCommitSha
  ) {
    throw approvalError(
      "APPROVAL_RUNNER_SHA_MISMATCH",
      "Approved runner SHA differs",
    );
  }
  if (
    record.approved_contract_hash !==
    FIXED_LIVE_APPROVAL_TARGET.contract_hash
  ) {
    throw approvalError(
      "APPROVAL_CONTRACT_HASH_MISMATCH",
      "Approved contract hash differs",
    );
  }
  if (record.approved_case !== FIXED_LIVE_APPROVAL_TARGET.case_id) {
    throw approvalError(
      "APPROVAL_CASE_MISMATCH",
      "Approved case differs",
    );
  }
  if (record.approved_model !== FIXED_LIVE_APPROVAL_TARGET.model) {
    throw approvalError(
      "APPROVAL_MODEL_MISMATCH",
      "Approved model differs",
    );
  }
  if (
    !same(
      record.approved_stages,
      FIXED_LIVE_APPROVAL_TARGET.stages,
    )
  ) {
    throw approvalError(
      "APPROVAL_STAGE_LIST_MISMATCH",
      "Approved Stage list differs",
    );
  }
  if (
    record.max_provider_calls !==
    FIXED_LIVE_APPROVAL_TARGET.max_provider_calls
  ) {
    throw approvalError(
      "APPROVAL_CALL_LIMIT_MISMATCH",
      "Approved call limit differs",
    );
  }
  if (
    record.absolute_ceiling_usd !==
      FIXED_LIVE_APPROVAL_TARGET.absolute_ceiling_usd ||
    record.preflight_ceiling_usd !==
      FIXED_LIVE_APPROVAL_TARGET.preflight_ceiling_usd
  ) {
    throw approvalError(
      "APPROVAL_CEILING_MISMATCH",
      "Approved budget ceilings differ",
    );
  }
  if (!same(record.exact_request_hashes, expectedRequestHashes)) {
    throw approvalError(
      "APPROVAL_REQUEST_HASH_MISMATCH",
      "Approved request hashes differ",
    );
  }
  if (
    record.one_time_only !== true ||
    typeof record.one_time_confirmation_hash !== "string" ||
    record.one_time_confirmation_hash.length === 0
  ) {
    throw approvalError(
      "APPROVAL_ONE_TIME_CONTRACT_INVALID",
      "One-time approval fields are invalid",
    );
  }
  if (
    typeof record.approval_id !== "string" ||
    record.approval_id.length === 0 ||
    typeof record.human_chatgpt_decision_reference !== "string" ||
    record.human_chatgpt_decision_reference.length === 0
  ) {
    throw approvalError(
      "APPROVAL_RECORD_INVALID",
      "Approval identity or decision reference is invalid",
    );
  }
  return {
    approval_id: record.approval_id,
    approval_hash: approvalRecordHash(record),
    price_snapshot_verified_at: record.price_snapshot_verified_at,
    one_time_confirmation_hash:
      record.one_time_confirmation_hash,
  };
}
