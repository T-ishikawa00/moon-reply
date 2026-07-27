import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  envelopeSizeBreakdown,
  loadFoundation,
  readJson,
  renderStageEnvelope,
} from "./render-m2-dry-run-requests.mjs";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
export const repositoryRoot = path.resolve(scriptDirectory, "..");

const contractPath =
  "evals/calibration/one-case-contract-v1.json";
const stagePlanPath = "evals/calibration/stage-plan-v1.json";
const artifactContractPath =
  "evals/calibration/artifact-contract-v1.json";
const securityPolicyPath =
  "evals/calibration/security-policy-v1.json";
const previewPath =
  "evals/calibration/reports/contract-preview-v1.json";
const estimatorReportPath =
  "evals/cost-estimator/reports/static-estimate-v1.json";

function absolute(relativePath) {
  return path.join(repositoryRoot, ...relativePath.split("/"));
}

function canonicalText(relativePath) {
  return readFileSync(absolute(relativePath), "utf8").replaceAll(
    "\r\n",
    "\n",
  );
}

export function canonicalTextHash(relativePath) {
  return createHash("sha256")
    .update(Buffer.from(canonicalText(relativePath), "utf8"))
    .digest("hex");
}

function compactJsonHash(value) {
  return createHash("sha256")
    .update(Buffer.from(JSON.stringify(value), "utf8"))
    .digest("hex");
}

export function contractBundleHash(contract = readJson(contractPath)) {
  const source = contract.integrity.contract_bundle_source_paths
    .map(
      (relativePath) =>
        `${relativePath}:${canonicalTextHash(relativePath)}\n`,
    )
    .join("");
  return createHash("sha256")
    .update(Buffer.from(source, "utf8"))
    .digest("hex");
}

function exactWait003(foundation) {
  const matching = [...foundation.cases.values()].filter(
    (item) => item.case_id === "WAIT-003",
  );
  if (matching.length !== 1) {
    throw new Error(
      `WAIT-003 must exist exactly once; found ${matching.length}`,
    );
  }
  return matching[0];
}

function roundUsd(value) {
  return Number(value.toFixed(10));
}

function stageCaps(stagePlan) {
  return Object.fromEntries(
    stagePlan.stage_sequence
      .filter((step) => step.provider_call)
      .map((step) => [step.step_id, step.max_output_tokens]),
  );
}

function summarizeSingleCase(
  foundation,
  stagePlan,
  profileName,
) {
  const estimatorConfig = readJson(
    "evals/cost-estimator/estimator-config-v1.json",
  );
  const stageProfiles = readJson(
    "evals/cost-estimator/stage-size-profiles-v1.json",
  );
  const tokenTotals = {
    low_tokens: 0,
    central_tokens: 0,
    high_tokens: 0,
  };
  const outputTotals = {
    nominal_output_tokens: 0,
    conservative_output_tokens: 0,
    configured_output_cap_tokens: 0,
  };
  let requestBytes = 0;
  let envelopeBytes = 0;
  for (const step of stagePlan.stage_sequence.filter(
    (item) => item.provider_call,
  )) {
    const envelope = renderStageEnvelope({
      foundation,
      stageId: step.step_id,
      caseId: "WAIT-003",
      profileName,
      scenarioId: "single-case-full-pipeline",
    });
    const sizes = envelopeSizeBreakdown(envelope);
    const bytes = sizes.request_serialized.utf8_bytes;
    const profiles = estimatorConfig.token_estimate.profiles;
    tokenTotals.low_tokens += Math.ceil(
      bytes / profiles.LOW.utf8_bytes_per_token,
    );
    tokenTotals.central_tokens += Math.ceil(
      bytes / profiles.CENTRAL.utf8_bytes_per_token,
    );
    tokenTotals.high_tokens += Math.ceil(
      bytes / profiles.HIGH.utf8_bytes_per_token,
    );
    requestBytes += bytes;
    envelopeBytes +=
      sizes.full_serialized_envelope.utf8_bytes;
    const output = stageProfiles.stages.find(
      (item) => item.stage_id === step.step_id,
    );
    outputTotals.nominal_output_tokens +=
      output.nominal_output_tokens;
    outputTotals.conservative_output_tokens +=
      output.conservative_output_tokens;
    outputTotals.configured_output_cap_tokens +=
      output.configured_output_cap_tokens;
  }
  return {
    synthetic_profile: profileName,
    call_count: 6,
    request_bytes: requestBytes,
    full_envelope_bytes: envelopeBytes,
    estimate_method:
      estimatorConfig.token_estimate.estimate_method,
    ...tokenTotals,
    ...outputTotals,
  };
}

function recomputeSingleCase(foundation, stagePlan, contract) {
  const nominal = summarizeSingleCase(
    foundation,
    stagePlan,
    "nominal",
  );
  const conservative = summarizeSingleCase(
    foundation,
    stagePlan,
    "conservative",
  );
  const inputPrice = contract.budget.standard_input_per_million;
  const outputPrice =
    contract.budget.standard_output_per_million;
  const cost = (inputTokens, outputTokens) =>
    roundUsd(
      (inputTokens * inputPrice) / 1_000_000 +
        (outputTokens * outputPrice) / 1_000_000,
    );
  return {
    scenario: {
      call_count: 6,
      nominal_request_estimate: nominal,
      conservative_request_estimate: conservative,
    },
    luna: {
      standard_conservative: {
        estimated_total_cost_usd: cost(
          conservative.high_tokens,
          conservative.conservative_output_tokens,
        ),
      },
      standard_hard_cap_ceiling: {
        estimated_total_cost_usd: cost(
          conservative.high_tokens,
          conservative.configured_output_cap_tokens,
        ),
      },
    },
  };
}

export function buildCalibrationPreview() {
  const foundation = loadFoundation();
  const contract = readJson(contractPath);
  const stagePlan = readJson(stagePlanPath);
  const artifactContract = readJson(artifactContractPath);
  const securityPolicy = readJson(securityPolicyPath);
  const wait003 = exactWait003(foundation);
  const report = readJson(estimatorReportPath);
  const { scenario, luna } = recomputeSingleCase(
    foundation,
    stagePlan,
    contract,
  );
  const providerSteps = stagePlan.stage_sequence.filter(
    (step) => step.provider_call,
  );
  const localSteps = stagePlan.stage_sequence.filter(
    (step) => !step.provider_call,
  );
  const caseHash = compactJsonHash(wait003);
  const hardCap =
    luna.standard_hard_cap_ceiling.estimated_total_cost_usd;
  const budgetEligible =
    hardCap <= contract.budget.preflight_contract_ceiling_usd;

  if (
    caseHash !== contract.case.case_sha256 ||
    scenario.call_count !== 6 ||
    hardCap !== contract.budget.expected_static_hard_cap_usd ||
    luna.standard_conservative.estimated_total_cost_usd !==
      contract.budget.expected_static_conservative_usd ||
    report.hashes.generated_report_sha256 !==
      contract.references.accepted_static_estimator_projection_sha256 ||
    canonicalTextHash(estimatorReportPath) !==
      contract.references.accepted_static_estimator_report_file_sha256
  ) {
    throw new Error(
      "Accepted case, call count, static estimate, or report hash drifted",
    );
  }

  return {
    schema_version: "moon-reply-calibration-contract-preview-v1",
    preview_version: "contract-preview-v1.0.0",
    foundation_main_sha: contract.foundation_main_sha,
    contract_version: contract.contract_version,
    contract_hash: {
      algorithm: contract.integrity.contract_bundle_hash_algorithm,
      sha256: contractBundleHash(contract),
    },
    case: {
      case_id: contract.case.case_id,
      case_sha256: caseHash,
      dataset_split: wait003.dataset_split,
    },
    dataset: {
      version: contract.case.dataset_version,
      sha256: contract.case.dataset_sha256,
    },
    prompt_bundle: {
      version: contract.references.prompt_bundle_version,
      manifest_sha256:
        contract.references.prompt_bundle_manifest_sha256,
    },
    schema_set: {
      version: contract.references.pipeline_schema_version,
      sha256: contract.references.schema_set_sha256,
    },
    estimator_report: {
      path: estimatorReportPath,
      file_sha256: canonicalTextHash(estimatorReportPath),
      generated_projection_sha256:
        report.hashes.generated_report_sha256,
    },
    price_snapshot: {
      path: contract.references.price_snapshot_path,
      sha256: canonicalTextHash(
        contract.references.price_snapshot_path,
      ),
      standard_input_per_million:
        contract.budget.standard_input_per_million,
      standard_output_per_million:
        contract.budget.standard_output_per_million,
    },
    candidate: {
      provider: contract.candidate.provider,
      endpoint: contract.candidate.endpoint,
      requested_model: contract.candidate.requested_model,
      model_role: contract.candidate.model_role,
      selected_for_product:
        contract.candidate.selected_for_product,
      selected_for_baseline:
        contract.candidate.selected_for_baseline,
      availability_verified:
        contract.candidate.local_project_availability_verified,
      fallback_model: contract.candidate.fallback_model,
    },
    stage_sequence: stagePlan.stage_sequence.map((step) => ({
      order: step.order,
      step_id: step.step_id,
      name: step.name,
      kind: step.kind,
      provider_call: step.provider_call,
      maximum_executions: step.maximum_executions,
    })),
    provider_call_count: providerSteps.length,
    local_step_count: localSteps.length,
    stage_reasoning_effort:
      stagePlan.provider_request_defaults.reasoning.effort,
    stage_output_caps: stageCaps(stagePlan),
    total_provider_output_cap_tokens:
      stagePlan.total_provider_output_cap_tokens,
    static_estimate: {
      estimate_method:
        scenario.nominal_request_estimate.estimate_method,
      nominal_request_bytes:
        scenario.nominal_request_estimate.request_bytes,
      nominal_full_envelope_bytes:
        scenario.nominal_request_estimate.full_envelope_bytes,
      conservative_request_bytes:
        scenario.conservative_request_estimate.request_bytes,
      conservative_full_envelope_bytes:
        scenario.conservative_request_estimate.full_envelope_bytes,
      low_input_tokens:
        scenario.nominal_request_estimate.low_tokens,
      central_input_tokens:
        scenario.nominal_request_estimate.central_tokens,
      high_input_tokens:
        scenario.nominal_request_estimate.high_tokens,
      conservative_high_input_tokens:
        scenario.conservative_request_estimate.high_tokens,
      conservative_output_tokens:
        scenario.conservative_request_estimate
          .conservative_output_tokens,
      configured_output_cap_tokens:
        scenario.conservative_request_estimate
          .configured_output_cap_tokens,
      expected_static_conservative_usd:
        luna.standard_conservative.estimated_total_cost_usd,
      recomputed_hard_cap_standard_usd: hardCap,
    },
    budget: {
      current_task_spend_authorized_usd:
        contract.budget.current_task_spend_authorized_usd,
      future_human_approval_ceiling_usd:
        contract.budget.future_human_approval_ceiling_usd,
      preflight_contract_ceiling_usd:
        contract.budget.preflight_contract_ceiling_usd,
      preflight_budget_eligible: budgetEligible,
      live_execution_eligible:
        budgetEligible &&
        contract.authorization_lock.live_execution_authorized,
      batch_reliance: false,
      cache_savings_reliance: false,
    },
    controls: {
      transport_retry: false,
      schema_retry: false,
      repair: false,
      fallback: false,
      automatic_continuation_after_failed_stage: false,
      live_execution_authorized:
        contract.authorization_lock.live_execution_authorized,
      paid_run_completed:
        contract.authorization_lock.paid_run_completed,
      api_spend_usd: contract.authorization_lock.api_spend_usd,
      b1_status: contract.authorization_lock.b1_status,
    },
    security_requirements: {
      b0_api_key_read_allowed:
        securityPolicy.b0.api_key_read_allowed,
      b0_network_allowed: securityPolicy.b0.network_allowed,
      b0_provider_execution_allowed:
        securityPolicy.b0.provider_execution_allowed,
      future_process_environment_only:
        securityPolicy.future_b1_key_policy.process_environment_only,
      authorization_header_logging_allowed:
        securityPolicy.future_b1_key_policy
          .authorization_header_logging_allowed,
      holdout_data_allowed:
        securityPolicy.data_policy.holdout_data_allowed,
      real_user_data_allowed:
        securityPolicy.data_policy.real_user_data_allowed,
    },
    artifact_requirements: {
      repository_storage_default:
        artifactContract.repository_storage_default,
      default_conceptual_location:
        artifactContract.default_conceptual_location,
      required_files: artifactContract.required_files,
      cost_term: artifactContract.cost_term,
      reasoning_text_allowed:
        artifactContract.reasoning_text_allowed,
    },
    stop_conditions: stagePlan.stop_conditions,
  };
}

export function renderCalibrationPreview(
  preview = buildCalibrationPreview(),
) {
  return `${JSON.stringify(preview, null, 2)}\n`;
}

export function writeCalibrationPreview() {
  const rendered = renderCalibrationPreview();
  mkdirSync(path.dirname(absolute(previewPath)), { recursive: true });
  writeFileSync(absolute(previewPath), rendered, "utf8");
  return {
    path: previewPath,
    bytes: Buffer.byteLength(rendered, "utf8"),
    contract_sha256: JSON.parse(rendered).contract_hash.sha256,
    hard_cap_usd:
      JSON.parse(rendered).static_estimate
        .recomputed_hard_cap_standard_usd,
  };
}

function isDirectExecution() {
  return (
    typeof process.argv[1] === "string" &&
    path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
  );
}

if (isDirectExecution()) {
  try {
    const first = renderCalibrationPreview();
    const second = renderCalibrationPreview();
    if (first !== second) {
      throw new Error("Preview bytes differ across repeated builds");
    }
    const result = writeCalibrationPreview();
    console.log(`CONTRACT_PREVIEW: ${result.path}`);
    console.log(`CONTRACT_PREVIEW_BYTES: ${result.bytes}`);
    console.log(`CONTRACT_SHA256: ${result.contract_sha256}`);
    console.log(
      `RECOMPUTED_HARD_CAP_STANDARD_USD: ${result.hard_cap_usd.toFixed(6)}`,
    );
    console.log("M2_B0_DETERMINISM_GATE: PASS");
    console.log("No API call was made. API spend is USD 0.");
  } catch (error) {
    console.error(
      error instanceof Error ? error.stack ?? error.message : String(error),
    );
    process.exitCode = 1;
  }
}
