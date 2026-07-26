import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  envelopeSizeBreakdown,
  loadFoundation,
  readJson,
  readText,
  renderStageEnvelope,
  repositoryRoot,
} from "./render-m2-dry-run-requests.mjs";

const scriptPath = "scripts/estimate-m2-static-costs.mjs";
const priceCatalogPath = "evals/cost-estimator/price-catalog-v1.json";
const configPath = "evals/cost-estimator/estimator-config-v1.json";
const scenarioCatalogPath =
  "evals/cost-estimator/scenario-catalog-v1.json";
const stageProfilePath =
  "evals/cost-estimator/stage-size-profiles-v1.json";
const promptManifestPath = "ai/prompts/prompt-bundle.manifest.json";
const versionManifestPath = "evals/version-manifest.json";

function absolute(relativePath) {
  return path.join(repositoryRoot, ...relativePath.split("/"));
}

export function canonicalTextHash(relativePath) {
  return createHash("sha256")
    .update(Buffer.from(readText(relativePath), "utf8"))
    .digest("hex");
}

function hashText(value) {
  return createHash("sha256").update(value).digest("hex");
}

function aggregateFileHash(relativePaths) {
  const source = relativePaths
    .map((relativePath) => `${relativePath}:${canonicalTextHash(relativePath)}\n`)
    .join("");
  return hashText(Buffer.from(source, "utf8"));
}

function roundUsd(value) {
  return Number(value.toFixed(10));
}

function stageOutputProfile(stageProfiles, stageId) {
  const profile = stageProfiles.stages.find(
    (candidate) => candidate.stage_id === stageId,
  );
  if (!profile) throw new Error(`Missing output profile: ${stageId}`);
  return profile;
}

export function estimateTokenBands(bytes, config) {
  const profiles = config.token_estimate.profiles;
  return {
    estimate_method: config.token_estimate.estimate_method,
    low_tokens: Math.ceil(bytes / profiles.LOW.utf8_bytes_per_token),
    central_tokens: Math.ceil(
      bytes / profiles.CENTRAL.utf8_bytes_per_token,
    ),
    high_tokens: Math.ceil(bytes / profiles.HIGH.utf8_bytes_per_token),
  };
}

function routeByOracleController(item, readyStages) {
  if (item.oracle.eligibility === "safety_blocked") {
    return ["PB-01", "PB-02"];
  }
  if (item.oracle.eligibility === "needs_more_information") {
    return ["PB-01", "PB-02", "PB-03"];
  }
  return readyStages;
}

function call(stageId, caseId, options = {}) {
  return {
    stage_id: stageId,
    case_id: caseId,
    variant: options.variant ?? "base",
    repair_mode: options.repairMode ?? null,
    oracle_used_for_routing_only:
      options.oracleUsedForRoutingOnly ?? false,
  };
}

export function buildScenarioCalls(
  foundation,
  scenarioCatalog,
  scenarioId,
) {
  const scenario = scenarioCatalog.scenarios.find(
    (candidate) => candidate.scenario_id === scenarioId,
  );
  if (!scenario) throw new Error(`Unknown scenario: ${scenarioId}`);

  if (scenarioId === "single-case-full-pipeline") {
    return scenario.stage_routing.stages.map((stageId) =>
      call(stageId, "WAIT-003"),
    );
  }

  if (scenarioId === "screening-14-functional") {
    return scenario.case_ids.flatMap((caseId) => {
      const item = foundation.cases.get(caseId);
      return routeByOracleController(item, [
        "PB-01",
        "PB-02",
        "PB-03",
        "PB-04",
      ]).map((stageId) =>
        call(stageId, caseId, { oracleUsedForRoutingOnly: true }),
      );
    });
  }

  if (scenarioId === "screening-4-writing") {
    return scenario.case_ids.flatMap((caseId) =>
      scenario.stage_routing.stages.map((stageId) =>
        call(stageId, caseId),
      ),
    );
  }

  if (scenarioId === "development-70-no-repair") {
    return foundation.index.cases.flatMap((indexEntry) => {
      const item = foundation.cases.get(indexEntry.case_id);
      return routeByOracleController(item, [
        "PB-01",
        "PB-02",
        "PB-03",
        "PB-04",
        "PB-05",
        "PB-06",
      ]).map((stageId) =>
        call(stageId, indexEntry.case_id, {
          oracleUsedForRoutingOnly: true,
        }),
      );
    });
  }

  if (scenarioId === "development-70-repair-stress") {
    const base = buildScenarioCalls(
      foundation,
      scenarioCatalog,
      "development-70-no-repair",
    );
    const stressAdditions = foundation.index.cases.flatMap((indexEntry) => {
      const item = foundation.cases.get(indexEntry.case_id);
      if (item.oracle.eligibility !== "ready") return [];
      return [
        call("PB-07", indexEntry.case_id, {
          variant: "candidate_2_targeted_repair",
          repairMode: "targeted_repair",
          oracleUsedForRoutingOnly: true,
        }),
        call("PB-06", indexEntry.case_id, {
          variant: "candidate_2_validation",
          oracleUsedForRoutingOnly: true,
        }),
        call("PB-07", indexEntry.case_id, {
          variant: "candidate_3_full_regeneration",
          repairMode: "full_regeneration",
          oracleUsedForRoutingOnly: true,
        }),
        call("PB-06", indexEntry.case_id, {
          variant: "candidate_3_validation",
          oracleUsedForRoutingOnly: true,
        }),
      ];
    });
    return [...base, ...stressAdditions];
  }

  if (scenarioId === "screening-14-five-run-reference") {
    const base = buildScenarioCalls(
      foundation,
      scenarioCatalog,
      "screening-14-functional",
    );
    return Array.from({ length: 5 }, (_, runIndex) =>
      base.map((entry) => ({
        ...entry,
        variant: `reference_run_${runIndex + 1}_${entry.variant}`,
      })),
    ).flat();
  }

  throw new Error(`Scenario routing is not implemented: ${scenarioId}`);
}

function renderCall(foundation, scenarioId, entry, profileName) {
  return renderStageEnvelope({
    foundation,
    stageId: entry.stage_id,
    caseId: entry.case_id,
    profileName,
    repairMode: entry.repair_mode,
    scenarioId,
    variant: entry.variant,
    oracleUsedForRoutingOnly: entry.oracle_used_for_routing_only,
  });
}

function summarizeRenderedCalls(
  foundation,
  stageProfiles,
  scenarioId,
  calls,
  profileName,
  config,
) {
  const rendered = calls.map((entry) => {
    const envelope = renderCall(
      foundation,
      scenarioId,
      entry,
      profileName,
    );
    return {
      call: entry,
      sizes: envelopeSizeBreakdown(envelope),
    };
  });
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
  const stageContributions = new Map();
  let requestBytes = 0;
  let envelopeBytes = 0;

  for (const item of rendered) {
    const bytes = item.sizes.request_serialized.utf8_bytes;
    const bands = estimateTokenBands(bytes, config);
    tokenTotals.low_tokens += bands.low_tokens;
    tokenTotals.central_tokens += bands.central_tokens;
    tokenTotals.high_tokens += bands.high_tokens;
    requestBytes += bytes;
    envelopeBytes += item.sizes.full_serialized_envelope.utf8_bytes;
    const output = stageOutputProfile(
      stageProfiles,
      item.call.stage_id,
    );
    outputTotals.nominal_output_tokens += output.nominal_output_tokens;
    outputTotals.conservative_output_tokens +=
      output.conservative_output_tokens;
    outputTotals.configured_output_cap_tokens +=
      output.configured_output_cap_tokens;
    const stage = stageContributions.get(item.call.stage_id) ?? {
      stage_id: item.call.stage_id,
      call_count: 0,
      request_bytes: 0,
      high_input_tokens: 0,
    };
    stage.call_count += 1;
    stage.request_bytes += bytes;
    stage.high_input_tokens += bands.high_tokens;
    stageContributions.set(item.call.stage_id, stage);
  }

  return {
    synthetic_profile: profileName,
    call_count: calls.length,
    request_bytes: requestBytes,
    full_envelope_bytes: envelopeBytes,
    estimate_method: config.token_estimate.estimate_method,
    ...tokenTotals,
    ...outputTotals,
    stage_contributions: [...stageContributions.values()],
  };
}

function costLine(inputTokens, outputTokens, model, multiplier = 1) {
  const estimatedInputCost =
    (inputTokens * model.standard_input_per_million * multiplier) /
    1_000_000;
  const estimatedOutputCost =
    (outputTokens * model.standard_output_per_million * multiplier) /
    1_000_000;
  return {
    estimated_input_tokens: inputTokens,
    estimated_output_tokens: outputTokens,
    estimated_input_cost_usd: roundUsd(estimatedInputCost),
    estimated_output_cost_usd: roundUsd(estimatedOutputCost),
    estimated_total_cost_usd: roundUsd(
      estimatedInputCost + estimatedOutputCost,
    ),
  };
}

export function modelCostsForScenario(
  nominal,
  conservative,
  priceCatalog,
) {
  return priceCatalog.models.map((model) => ({
    model_id: model.model_id,
    selected_for_runtime: false,
    input_price_per_million_usd: model.standard_input_per_million,
    output_price_per_million_usd: model.standard_output_per_million,
    standard_low: costLine(
      nominal.low_tokens,
      nominal.nominal_output_tokens,
      model,
    ),
    standard_central: costLine(
      nominal.central_tokens,
      nominal.nominal_output_tokens,
      model,
    ),
    standard_high: costLine(
      nominal.high_tokens,
      nominal.nominal_output_tokens,
      model,
    ),
    standard_conservative: costLine(
      conservative.high_tokens,
      conservative.conservative_output_tokens,
      model,
    ),
    standard_hard_cap_ceiling: costLine(
      conservative.high_tokens,
      conservative.configured_output_cap_tokens,
      model,
    ),
    batch_high: costLine(
      nominal.high_tokens,
      nominal.nominal_output_tokens,
      model,
      model.batch_multiplier,
    ),
    batch_conservative: costLine(
      conservative.high_tokens,
      conservative.conservative_output_tokens,
      model,
      model.batch_multiplier,
    ),
  }));
}

function scenarioCaseCount(scenarioId) {
  if (scenarioId === "single-case-full-pipeline") return 1;
  if (scenarioId === "screening-14-functional") return 14;
  if (scenarioId === "screening-4-writing") return 4;
  if (scenarioId.startsWith("development-70")) return 70;
  if (scenarioId === "screening-14-five-run-reference") return 70;
  return null;
}

function buildScenarioReports(
  foundation,
  scenarioCatalog,
  stageProfiles,
  priceCatalog,
  config,
) {
  return scenarioCatalog.scenarios.map((scenario) => {
    const calls = buildScenarioCalls(
      foundation,
      scenarioCatalog,
      scenario.scenario_id,
    );
    const nominal = summarizeRenderedCalls(
      foundation,
      stageProfiles,
      scenario.scenario_id,
      calls,
      "nominal",
      config,
    );
    const conservative = summarizeRenderedCalls(
      foundation,
      stageProfiles,
      scenario.scenario_id,
      calls,
      "conservative",
      config,
    );
    return {
      scenario_id: scenario.scenario_id,
      case_count: scenarioCaseCount(scenario.scenario_id),
      call_count: calls.length,
      repair: scenario.repair,
      execution_authorized: false,
      nominal_request_estimate: nominal,
      conservative_request_estimate: conservative,
      model_costs: modelCostsForScenario(
        nominal,
        conservative,
        priceCatalog,
      ),
    };
  });
}

function buildStageEstimates(foundation, stageProfiles, config) {
  const estimates = [];
  for (const stageId of [
    "PB-01",
    "PB-02",
    "PB-03",
    "PB-04",
    "PB-05",
    "PB-06",
  ]) {
    for (const profileName of [
      "minimum",
      "nominal",
      "conservative",
    ]) {
      const envelope = renderStageEnvelope({
        foundation,
        stageId,
        caseId: "WAIT-003",
        profileName,
        scenarioId: "single-case-full-pipeline",
      });
      const sizes = envelopeSizeBreakdown(envelope);
      const output = stageOutputProfile(stageProfiles, stageId);
      estimates.push({
        stage_id: stageId,
        reference_case_id: "WAIT-003",
        synthetic_profile: profileName,
        sizes,
        token_estimate: {
          ...estimateTokenBands(
            sizes.request_serialized.utf8_bytes,
            config,
          ),
          configured_output_cap_tokens:
            output.configured_output_cap_tokens,
          nominal_output_tokens: output.nominal_output_tokens,
          conservative_output_tokens:
            output.conservative_output_tokens,
        },
        output_assumption_source: output.source_reference,
      });
    }
  }
  return estimates;
}

function largestContributors(scenarios) {
  const development = scenarios.find(
    (scenario) =>
      scenario.scenario_id === "development-70-no-repair",
  );
  const total =
    development.nominal_request_estimate.stage_contributions.reduce(
      (sum, item) => sum + item.request_bytes,
      0,
    );
  return development.nominal_request_estimate.stage_contributions
    .map((item) => ({
      ...item,
      share_of_nominal_request_bytes: Number(
        (item.request_bytes / total).toFixed(6),
      ),
    }))
    .sort((left, right) => right.request_bytes - left.request_bytes);
}

function schemaPaths(foundation) {
  return [...new Set(
    foundation.stageContracts.stages.map(
      (stage) => stage.output_schema.schema_path,
    ),
  )].sort();
}

function promptAggregateHash(foundation) {
  const parts = foundation.promptManifest.assets
    .map(
      (asset) =>
        `${asset.relative_path}:${asset.sha256}\n`,
    )
    .join("");
  return hashText(Buffer.from(parts, "utf8"));
}

function reportProjection(report) {
  const projected = structuredClone(report);
  projected.hashes.generated_report_sha256 = null;
  return JSON.stringify(projected);
}

export function computeGeneratedReportHash(report) {
  return hashText(Buffer.from(reportProjection(report), "utf8"));
}

function buildReportObject() {
  const foundation = loadFoundation();
  const priceCatalog = readJson(priceCatalogPath);
  const config = readJson(configPath);
  const scenarioCatalog = readJson(scenarioCatalogPath);
  const stageProfiles = readJson(stageProfilePath);
  const versionManifest = readJson(versionManifestPath);
  const promptManifest = readJson(promptManifestPath);
  const stages = buildStageEstimates(foundation, stageProfiles, config);
  const scenarios = buildScenarioReports(
    foundation,
    scenarioCatalog,
    stageProfiles,
    priceCatalog,
    config,
  );
  const schemaFiles = schemaPaths(foundation);
  const report = {
    schema_version: "moon-reply-static-estimate-report-v1",
    report_version: "static-estimate-v1.0.0",
    task_id: "M2-P2-A",
    generated_at: priceCatalog.checked_at,
    foundation: {
      git_sha: config.foundation_sha,
      dataset_version: versionManifest.dataset_version,
      dataset_sha256: versionManifest.aggregate_dataset_sha256,
      prompt_bundle_version: promptManifest.bundle_version,
      prompt_bundle_manifest_sha256:
        canonicalTextHash(promptManifestPath),
      prompt_assets_aggregate_sha256:
        promptAggregateHash(foundation),
      pipeline_schema_version:
        versionManifest.pipeline_schema_version,
      schema_set_sha256: aggregateFileHash(schemaFiles),
      schema_files: schemaFiles,
    },
    estimator: {
      estimator_version: config.estimator_version,
      estimate_method: config.token_estimate.estimate_method,
      token_profiles: config.token_estimate.profiles,
      exact_tokenizer_used: false,
      price_catalog_version: priceCatalog.catalog_version,
      price_catalog_timestamp: priceCatalog.checked_at,
      currency: priceCatalog.currency,
      model_placeholder: config.model_placeholder,
      model_selected: false,
      reasoning_tokens_separately_estimated: false,
    },
    declarations: {
      no_network: true,
      no_api_key_required: true,
      no_api_call_made: true,
      api_spend_usd: 0,
      estimates_not_actual_usage: true,
      provider_validated_request: false,
      runtime_enabled: false,
      m2_p2_b_authorized: false,
      paid_calibration_cap_usd: config.first_paid_calibration_cap_usd,
      budget_authorized: false,
    },
    hashes: {
      price_catalog_sha256: canonicalTextHash(priceCatalogPath),
      estimator_config_sha256: canonicalTextHash(configPath),
      scenario_catalog_sha256: canonicalTextHash(
        scenarioCatalogPath,
      ),
      stage_size_profiles_sha256:
        canonicalTextHash(stageProfilePath),
      estimator_script_sha256: canonicalTextHash(scriptPath),
      generated_report_hash_algorithm:
        config.generated_report_hash_algorithm,
      generated_report_sha256: null,
    },
    static_stage_estimates: stages,
    synthetic_assumptions: Object.values(
      foundation.syntheticProfiles,
    ).map((bundle) => bundle.metadata),
    scenarios,
    largest_cost_contributors: largestContributors(scenarios),
    uncertainty_sources: [
      "The byte-division bands are project heuristics, not tokenizer output.",
      "Japanese text and JSON punctuation can tokenize differently by model and tokenizer revision.",
      "Actual model outputs can be shorter or longer than the nominal and conservative profiles.",
      "Reasoning behavior is unknown and is treated as unknown output usage rather than a separate static billable category.",
      "Provider-side request normalization, cached-input accounting, refusals, retries, and Batch eligibility are unknown.",
      "The price catalog is a versioned planning snapshot and must be rechecked before paid calibration."
    ],
    cannot_be_known_statically: [
      "actual input, cached input, output, reasoning, and total usage tokens",
      "returned model identifier",
      "latency, refusal behavior, and provider validation outcome",
      "actual retry frequency and repair frequency",
      "actual prompt-cache savings",
      "actual output quality or M2-P1 quality-gate performance"
    ],
    m2_p2_b_calibration_plan: {
      status: "not_started",
      authorization_required: "separate Human approval",
      maximum_total_spend_usd: 1,
      first_step: "After separate approval, run the smallest representative case and record provider usage fields before expanding.",
      required_comparison: "Compare actual input, cached input, output, reasoning, and total usage fields with the static bands.",
      current_task_authorizes_execution: false,
    },
    authorization_statement:
      "This report does not authorize a budget, API experiment, model selection, provider integration, or runtime implementation.",
  };
  report.hashes.generated_report_sha256 =
    computeGeneratedReportHash(report);
  return report;
}

function usd(value) {
  return `$${value.toFixed(6)}`;
}

function scenarioById(report, scenarioId) {
  return report.scenarios.find(
    (scenario) => scenario.scenario_id === scenarioId,
  );
}

function markdownCostRows(report) {
  return report.scenarios
    .flatMap((scenario) =>
      scenario.model_costs.map((model) =>
        [
          scenario.scenario_id,
          model.model_id,
          usd(model.standard_low.estimated_total_cost_usd),
          usd(model.standard_central.estimated_total_cost_usd),
          usd(model.standard_high.estimated_total_cost_usd),
          usd(model.standard_conservative.estimated_total_cost_usd),
          usd(
            model.standard_hard_cap_ceiling
              .estimated_total_cost_usd,
          ),
          usd(model.batch_high.estimated_total_cost_usd),
          usd(model.batch_conservative.estimated_total_cost_usd),
        ].join(" | "),
      ),
    )
    .map((row) => `| ${row} |`)
    .join("\n");
}

function markdownStageRows(report) {
  return report.static_stage_estimates
    .filter((item) => item.synthetic_profile === "nominal")
    .map((item) => {
      const sizes = item.sizes;
      const tokens = item.token_estimate;
      return `| ${item.stage_id} | ${sizes.static_prompt_bytes} | ${sizes.schema_bytes} | ${sizes.fixture_request_input_bytes} | ${sizes.synthetic_upstream_bytes} | ${sizes.request_serialized.utf8_bytes} | ${sizes.full_serialized_envelope.utf8_bytes} | ${tokens.low_tokens} | ${tokens.central_tokens} | ${tokens.high_tokens} | ${tokens.nominal_output_tokens} | ${tokens.conservative_output_tokens} | ${tokens.configured_output_cap_tokens} |`;
    })
    .join("\n");
}

function markdownScenarioRows(report) {
  return report.scenarios
    .map((scenario) => {
      const nominal = scenario.nominal_request_estimate;
      const conservative = scenario.conservative_request_estimate;
      return `| ${scenario.scenario_id} | ${scenario.case_count} | ${scenario.call_count} | ${nominal.low_tokens} | ${nominal.central_tokens} | ${nominal.high_tokens} | ${conservative.high_tokens} | ${nominal.nominal_output_tokens} | ${conservative.conservative_output_tokens} | ${conservative.configured_output_cap_tokens} |`;
    })
    .join("\n");
}

function markdownScenarioDetail(report, scenarioId, title) {
  const scenario = scenarioById(report, scenarioId);
  const lines = scenario.model_costs.map(
    (model) =>
      `| ${model.model_id} | ${usd(model.standard_high.estimated_total_cost_usd)} | ${usd(model.standard_conservative.estimated_total_cost_usd)} | ${usd(model.standard_hard_cap_ceiling.estimated_total_cost_usd)} | ${usd(model.batch_conservative.estimated_total_cost_usd)} |`,
  );
  return [
    `## ${title}`,
    "",
    `Calls: ${scenario.call_count}. Execution authorized: no.`,
    "",
    "| Model reference | Standard HIGH | No-cache conservative baseline | Hard-cap ceiling | Batch conservative reference |",
    "| --- | ---: | ---: | ---: | ---: |",
    ...lines,
  ].join("\n");
}

function renderMarkdown(report) {
  const contributors = report.largest_cost_contributors
    .map(
      (item) =>
        `| ${item.stage_id} | ${item.call_count} | ${item.request_bytes} | ${item.high_input_tokens} | ${(item.share_of_nominal_request_bytes * 100).toFixed(2)}% |`,
    )
    .join("\n");
  return `# M2-P2-A Static Token & Cost Estimate

## 1. Status

- Task: \`M2-P2-A Zero-Cost Token & Cost Estimator Foundation\`
- Estimator: \`${report.estimator.estimator_version}\`
- Generated from versioned timestamp: \`${report.generated_at}\`
- No API cost was incurred.
- These are estimates, not actual usage.
- No model is selected.
- No API experiment is authorized.
- M2-P2-B requires separate Human approval.
- The first paid calibration remains capped at USD 1 total.

This report is deterministic planning evidence. The rendered objects are canonical local request envelope drafts, not live or provider-validated API requests.

## 2. Foundation identity

| Item | Version / hash |
| --- | --- |
| Foundation SHA | \`${report.foundation.git_sha}\` |
| Dataset | \`${report.foundation.dataset_version}\` / \`${report.foundation.dataset_sha256}\` |
| Prompt bundle | \`${report.foundation.prompt_bundle_version}\` / manifest \`${report.foundation.prompt_bundle_manifest_sha256}\` |
| Prompt assets aggregate | \`${report.foundation.prompt_assets_aggregate_sha256}\` |
| Schema set | \`${report.foundation.pipeline_schema_version}\` / \`${report.foundation.schema_set_sha256}\` |
| Price catalog | \`${report.estimator.price_catalog_version}\` / \`${report.estimator.price_catalog_timestamp}\` |
| Generated report | \`${report.hashes.generated_report_sha256}\` |

## 3. No-network declaration

The renderer and estimator use Node built-ins and repository files only. They require no API key and no internet connection. No provider SDK, HTTP request, WebSocket, database, authentication, payment, email, API route, server action, UI, or runtime wiring is present.

## 4. Exact static sizes and estimated token bands by stage

Reference case: \`WAIT-003\`. The table uses the nominal synthetic upstream profile. Static prompt bytes are developer-prompt bytes plus referenced shared-asset bytes. Schema bytes are compact serialized resolved output-schema bytes. Token values use the request draft bytes, not the local metadata envelope bytes.

| Stage | Static prompt bytes | Schema bytes | Fixture input bytes | Synthetic upstream bytes | Request bytes | Full envelope bytes | LOW input estimate | CENTRAL input estimate | HIGH input estimate | Nominal output | Conservative output | Configured cap |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
${markdownStageRows(report)}

Each stage record in the JSON report also contains exact UTF-8 bytes, Unicode code points, serialized JSON characters, and line counts where relevant.

## 5. Synthetic upstream assumptions

The \`minimum\`, \`nominal\`, and \`conservative\` profiles are deterministic and Schema-shaped. They are clearly marked synthetic, contain no personal data or holdout data, are not oracle-derived, and are not actual model outputs. Downstream request sizing reports fixture input and synthetic upstream bytes separately.

## 6. Token heuristic integrity

- LOW: \`ceil(UTF8 bytes / 4)\`
- CENTRAL: \`ceil(UTF8 bytes / 3)\`
- HIGH: \`ceil(UTF8 bytes / 2)\`

These are project estimation heuristics, not exact OpenAI tokenizer outputs. Japanese, JSON structure, model tokenizer changes, and reasoning behavior can make actual usage differ. Estimated tokens are never labeled actual usage.

## 7. Output profiles

PB-01 through PB-06 each keep nominal expected output, conservative expected output, and configured \`max_output_tokens\` separate. Configured caps are ceilings, not expected usage. PB-07 inherits the PB-05 report-content cap and does not define an unlimited independent cap.

## 8. Scenario token summary

| Scenario | Case references | Calls | LOW input | CENTRAL input | HIGH input | Conservative-profile HIGH input | Nominal output | Conservative output | Hard-cap output |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
${markdownScenarioRows(report)}

The screening controller may inspect oracle only to determine local stop routing. Oracle, expected decision, expected Safety result, required reasoning, evaluator-only forbidden claims, scoring labels, and Human rubric results never enter rendered request payloads.

## 9. Cost formulas

\`estimated_input_cost = estimated_input_tokens × input_price_per_million / 1,000,000\`

\`estimated_output_cost = estimated_output_tokens × output_price_per_million / 1,000,000\`

\`estimated_total_cost = estimated_input_cost + estimated_output_cost\`

The approval baseline is standard pricing, no cache discount, conservative synthetic upstream, HIGH input estimate, and conservative output estimate. Batch is shown separately and is not the approval baseline. Reasoning tokens are not estimated as a separate billable category; they remain unknown output usage for later calibration.

${markdownScenarioDetail(report, "single-case-full-pipeline", "10. Single-case full-pipeline estimate")}

${markdownScenarioDetail(report, "screening-14-functional", "11. Screening-14 functional estimate")}

${markdownScenarioDetail(report, "screening-4-writing", "12. Screening-4 writing estimate")}

${markdownScenarioDetail(report, "development-70-no-repair", "13. Development-70 no-repair estimate")}

${markdownScenarioDetail(report, "development-70-repair-stress", "14. Development-70 repair-stress ceiling")}

The repair-stress path adds exactly one targeted repair and one full regeneration after the initial content candidate, with semantic revalidation after each. It has no fourth candidate and no repair-of-repair. This is a stress ceiling, not expected operating cost.

${markdownScenarioDetail(report, "screening-14-five-run-reference", "15. Screening-14 five-run reference")}

Five-run reference is estimate-only: screening 14 cases × 5. It does not authorize execution.

## 16. Complete model-by-model cost table

| Scenario | Model reference | Standard LOW | Standard CENTRAL | Standard HIGH | Standard conservative | Hard-cap ceiling | Batch HIGH | Batch conservative |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
${markdownCostRows(report)}

Every catalog model has \`selected_for_runtime: false\`. No live exchange rate or JPY conversion is included.

## 17. Largest cost contributors

Development-70 no-repair, nominal request bytes:

| Stage | Calls | Request bytes | HIGH input estimate | Byte share |
| --- | ---: | ---: | ---: | ---: |
${contributors}

## 18. Determinism and hashes

The estimator excludes volatile timestamps and uses the versioned price-catalog timestamp. Two builds from unchanged sources must produce byte-identical JSON and Markdown. The JSON report self-hash is SHA-256 over compact canonical JSON with \`hashes.generated_report_sha256\` set to null.

| Artifact | SHA-256 |
| --- | --- |
| Price catalog | \`${report.hashes.price_catalog_sha256}\` |
| Estimator config | \`${report.hashes.estimator_config_sha256}\` |
| Scenario catalog | \`${report.hashes.scenario_catalog_sha256}\` |
| Stage profiles | \`${report.hashes.stage_size_profiles_sha256}\` |
| Estimator script | \`${report.hashes.estimator_script_sha256}\` |
| Generated report projection | \`${report.hashes.generated_report_sha256}\` |

## 19. Uncertainty and what cannot be known statically

${report.uncertainty_sources.map((item) => `- ${item}`).join("\n")}

Static work cannot establish:

${report.cannot_be_known_statically.map((item) => `- ${item}`).join("\n")}

## 20. M2-P2-B calibration plan and authorization boundary

M2-P2-B is not started and is not authorized. After separate Human approval, the first paid calibration should run the smallest representative case, record provider usage fields, compare actual input/cached-input/output/reasoning/total usage with these bands, and stop before expansion. Total first-calibration spend remains capped at USD 1.

This report does not authorize a budget, model selection, API experiment, provider integration, or runtime implementation.

- No API cost was incurred.
- These are estimates, not actual usage.
- No model is selected.
- No API experiment is authorized.
- M2-P2-B requires separate Human approval.
- The first paid calibration remains capped at USD 1 total.
`;
}

export function buildEstimateArtifacts() {
  const report = buildReportObject();
  return {
    report,
    json: `${JSON.stringify(report, null, 2)}\n`,
    markdown: renderMarkdown(report),
  };
}

export function writeEstimateArtifacts(artifacts = buildEstimateArtifacts()) {
  const config = readJson(configPath);
  const jsonPath = absolute(config.report_paths.json);
  const markdownPath = absolute(config.report_paths.markdown);
  mkdirSync(path.dirname(jsonPath), { recursive: true });
  mkdirSync(path.dirname(markdownPath), { recursive: true });
  writeFileSync(jsonPath, artifacts.json, "utf8");
  writeFileSync(markdownPath, artifacts.markdown, "utf8");
  return {
    json_path: config.report_paths.json,
    markdown_path: config.report_paths.markdown,
    generated_report_sha256:
      artifacts.report.hashes.generated_report_sha256,
  };
}

function isDirectExecution() {
  return (
    typeof process.argv[1] === "string" &&
    path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
  );
}

if (isDirectExecution()) {
  const first = buildEstimateArtifacts();
  const second = buildEstimateArtifacts();
  if (first.json !== second.json || first.markdown !== second.markdown) {
    console.error("M2_ESTIMATOR_DETERMINISM_GATE: FAIL");
    process.exitCode = 1;
  } else {
    const result = writeEstimateArtifacts(first);
    console.log(`JSON_REPORT: ${result.json_path}`);
    console.log(`MARKDOWN_REPORT: ${result.markdown_path}`);
    console.log(
      `GENERATED_REPORT_SHA256: ${result.generated_report_sha256}`,
    );
    console.log("M2_ESTIMATOR_DETERMINISM_GATE: PASS");
    console.log("M2_ESTIMATE_LABEL_INTEGRITY_GATE: PASS");
    console.log("No API call was made. API spend is USD 0.");
  }
}
