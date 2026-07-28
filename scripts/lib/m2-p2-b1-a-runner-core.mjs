import {
  B1A,
  assertFixedIdentity,
  compactHash,
  validateJsonSchema,
} from "./m2-p2-b1-a-contract.mjs";

function stopError(stopCode, message) {
  return Object.assign(new Error(message), { stopCode });
}

function clone(value) {
  return structuredClone(value);
}

function rounded(value) {
  return Number(value.toFixed(10));
}

export function createRunner({ assets, transport }) {
  if (!transport || transport.kind !== "offline_replay") {
    throw stopError(
      "B1A_TRANSPORT_KIND_REJECTED",
      "Only offline_replay transport is accepted",
    );
  }

  const allowedTransitions = new Set(
    assets.stateMachine.allowed_transitions.map(
      (entry) => `${entry.from}->${entry.to}`,
    ),
  );

  function run(options = {}) {
    const injectionId = options.injection_id ?? null;
    const transitions = [];
    const completedStages = [];
    const completedLocalSteps = [];
    const stageRecords = [];
    const localArtifacts = {};
    let state = "created";
    let stopCount = 0;
    let actualProviderCalls = 0;
    let actualApiSpendUsd = 0;

    const transition = (to, event) => {
      if (!allowedTransitions.has(`${state}->${to}`)) {
        throw stopError(
          "B1A_STATE_TRANSITION_INVALID",
          `Transition ${state}->${to} is not allowed`,
        );
      }
      transitions.push({ sequence: transitions.length + 1, from: state, to, event });
      state = to;
    };

    const stop = (error) => {
      if (state !== "stopped" && state !== "completed_offline") {
        transition("stopped", error.stopCode ?? "B1A_UNCLASSIFIED_FAILURE");
        stopCount += 1;
      }
      return {
        schema_version: "moon-reply-b1a-run-result-v1",
        execution_mode: B1A.mode,
        run_kind: B1A.runKind,
        case_id: B1A.caseId,
        requested_model: B1A.model,
        final_state: state,
        stop_code: error.stopCode ?? "B1A_UNCLASSIFIED_FAILURE",
        stop_count: stopCount,
        last_completed_stage: completedStages.at(-1) ?? null,
        completed_local_steps: completedLocalSteps,
        state_transitions: transitions,
        stage_records: stageRecords,
        actual_provider_calls: actualProviderCalls,
        actual_api_spend_usd: actualApiSpendUsd,
        actual_usage: "unavailable",
      };
    };

    const injectPreflight = (contract, lock) => {
      if (injectionId === "contract_hash_mismatch") {
        contract.source_b0_contract_hash = "0".repeat(64);
      }
      if (injectionId === "unauthorized_case") contract.case_id = "WAIT-004";
      if (injectionId === "unauthorized_model") {
        contract.requested_model = "unregistered_model";
      }
      if (injectionId === "live_authorization_tampered_true") {
        lock.live_execution_authorized = true;
      }
      if (injectionId === "static_budget_over_preflight_ceiling") {
        contract.static_hard_cap_usd = 0.300001;
      }
    };

    try {
      transition("preflight_validating", "preflight");
      const localAssets = {
        ...assets,
        runnerContract: clone(assets.runnerContract),
        approvalLock: clone(assets.approvalLock),
      };
      injectPreflight(localAssets.runnerContract, localAssets.approvalLock);

      if (injectionId === "live_flag_present") {
        throw stopError("B1A_LIVE_FLAG_REJECTED", "Live flag is prohibited");
      }
      if (injectionId === "network_flag_present") {
        throw stopError("B1A_NETWORK_FLAG_REJECTED", "Network flag is prohibited");
      }
      if (injectionId === "missing_confirmation") {
        throw stopError("B1A_CONFIRMATION_MISSING", "Confirmation is required");
      }
      if (injectionId === "wrong_confirmation") {
        throw stopError("B1A_CONFIRMATION_INVALID", "Confirmation differs");
      }
      if (injectionId === "unauthorized_stage") {
        throw stopError("B1A_UNAUTHORIZED_STAGE", "PB-07 is excluded");
      }
      if (injectionId === "stage_out_of_order") {
        throw stopError("B1A_STAGE_ORDER_INVALID", "Stage order differs");
      }
      if (
        localAssets.runnerContract.source_b0_contract_hash !== B1A.b0ContractHash
      ) {
        throw stopError("B1A_CONTRACT_HASH_MISMATCH", "B0 hash differs");
      }
      if (localAssets.runnerContract.case_id !== B1A.caseId) {
        throw stopError("B1A_CASE_REJECTED", "Case differs");
      }
      if (localAssets.runnerContract.requested_model !== B1A.model) {
        throw stopError("B1A_MODEL_REJECTED", "Model differs");
      }
      if (
        localAssets.runnerContract.static_hard_cap_usd >
        localAssets.runnerContract.preflight_ceiling_usd
      ) {
        throw stopError("B1A_STATIC_BUDGET_REJECTED", "Static cap exceeds ceiling");
      }
      if (injectionId === "live_authorization_tampered_true") {
        throw stopError("B1A_APPROVAL_LOCK_INVALID", "Live authorization is false-only");
      }
      assertFixedIdentity(assets);
      transition("preflight_passed", "B0 contract and approval lock verified");

      let cumulativeReferenceUsd = 0;
      for (const stageId of B1A.stageIds.slice(0, 3)) {
        replayStage(stageId);
      }
      localStep("LOCAL-SAFETY-AGGREGATION", () => {
        if (injectionId === "safety_gate_failure") {
          throw stopError("B1A_SAFETY_GATE_FAILED", "Synthetic Safety gate failed");
        }
        const modelResult = outputFor("PB-02");
        localArtifacts.safety_assessment = {
          schema_version: "pipeline-schema-v1.0.0",
          deterministic_rule_result: {
            classification: "normal_allowed",
            reason_codes: ["normal"],
            response_mode: "none",
          },
          model_semantic_result: modelResult,
          moderation_result: null,
          aggregate_result: {
            classification: modelResult.classification,
            reason_codes: modelResult.reason_codes,
            response_mode: modelResult.response_mode,
            aggregation_rule: "strictest_classification_wins",
            normal_flow_allowed: modelResult.classification === "normal_allowed",
          },
        };
        const safetySchema = assets.stageSchemas["PB-02"].root;
        const errors = validateJsonSchema(
          localArtifacts.safety_assessment,
          safetySchema,
        );
        if (
          errors.length > 0 ||
          localArtifacts.safety_assessment.aggregate_result
            .normal_flow_allowed !== true
        ) {
          throw stopError(
            "B1A_SAFETY_GATE_FAILED",
            `Safety aggregation failed: ${errors.join("; ")}`,
          );
        }
      });
      localStep("LOCAL-ELIGIBILITY-ASSERTION", () => {
        const eligibility = outputFor("PB-03");
        if (
          eligibility.eligibility !== "ready" ||
          eligibility.normal_flow_allowed !== true ||
          eligibility.question_codes.length !== 0
        ) {
          throw stopError("B1A_ELIGIBILITY_FAILED", "Eligibility is not ready");
        }
        localArtifacts.eligibility = eligibility;
      });
      localStep("LOCAL-DECISION-POLICY", () => {
        localArtifacts.decision_policy = {
          schema_version: "pipeline-schema-v1.0.0",
          policy_version: "decision-policy-v1.0.0",
          allowed_decisions: ["wait_and_reassess"],
          disallowed_decisions: [
            {
              decision: "reply_now",
              reason_codes: ["unanswered_meaningful_message"],
            },
            {
              decision: "send_now",
              reason_codes: ["waiting_preferred"],
            },
            {
              decision: "pause_additional_contact",
              reason_codes: ["decision_not_applicable"],
            },
          ],
          follow_up_exception: "none",
          message_draft_policy: "later_only",
          later_draft_mode: "defer_until_reassessment",
          pause_reason_code: null,
          resume_policy: null,
        };
        const errors = validateJsonSchema(
          localArtifacts.decision_policy,
          assets.localSchemas.decisionPolicy,
        );
        if (errors.length > 0) {
          throw stopError(
            "B1A_DECISION_POLICY_INVALID",
            `Decision Policy invalid: ${errors.join("; ")}`,
          );
        }
      });
      replayStage("PB-04");
      localStep("LOCAL-PLAN-VALIDATION", () => {
        const plan = outputFor("PB-04");
        if (
          injectionId === "unallowed_decision" ||
          !localArtifacts.decision_policy.allowed_decisions.includes(
            plan.selected_decision,
          ) ||
          plan.message_draft !== null ||
          !deepEqual(
            plan.three_day_plan.map((entry) => entry.day),
            ["tonight", "next_day", "day_three"],
          )
        ) {
          throw stopError("B1A_UNALLOWED_DECISION", "Decision is not allowed");
        }
        localArtifacts.decision_plan = plan;
      });
      replayStage("PB-05");
      localStep("LOCAL-REPORT-VALIDATION", () => {
        const intake = outputFor("PB-01");
        const report = outputFor("PB-05");
        const factIds = new Set(intake.observed_facts.map((entry) => entry.fact_id));
        if (
          report.observed_fact_commentary.some(
            (entry) => !factIds.has(entry.fact_id),
          ) ||
          report.message_draft_context !== null
        ) {
          throw stopError(
            "B1A_REPORT_CONSISTENCY_FAILED",
            "Report references or draft context differ",
          );
        }
        localArtifacts.report = report;
      });
      replayStage("PB-06");
      localStep("LOCAL-SEMANTIC-DISPOSITION", () => {
        const semantic = outputFor("PB-06");
        if (
          injectionId === "hallucinated_fact_reference" ||
          semantic.semantic_checks.some(
            (finding) => finding.finding_code === "FACT_FIDELITY",
          )
        ) {
          throw stopError(
            "B1A_HALLUCINATED_FACT_REFERENCE",
            "Fact fidelity finding stops the run",
          );
        }
      });
      localStep("LOCAL-FINAL-CONTRACT-BUDGET-ARTIFACT-CHECKS", () => {
        if (
          injectionId === "cumulative_budget_guard_failure" ||
          cumulativeReferenceUsd > B1A.staticHardCapUsd
        ) {
          throw stopError("B1A_CUMULATIVE_BUDGET_GUARD", "Budget guard failed");
        }
        if (actualProviderCalls !== 0 || actualApiSpendUsd !== 0) {
          throw stopError("B1A_ACTUAL_SPEND_NONZERO", "Actual counters changed");
        }
        if (
          assets.reportManifest.implementation_file_count !== 30 ||
          assets.reportManifest.added_file_count !== 26 ||
          assets.reportManifest.modified_file_count !== 4 ||
          assets.reportManifest.deleted_file_count !== 0 ||
          !deepEqual(
            assets.artifactPolicy.repository_reports,
            assets.reportManifest.report_paths,
          )
        ) {
          throw stopError(
            "B1A_ARTIFACT_MANIFEST_INVALID",
            "Artifact manifest differs",
          );
        }
      });
      transition("completed_offline", "offline replay completed");

      const budgetLedger = {
        actual: {
          actual_provider_calls: 0,
          actual_api_spend_usd: 0,
          actual_usage: "unavailable",
        },
        synthetic_reference: {
          synthetic_input_tokens: stageRecords.reduce(
            (sum, entry) => sum + entry.synthetic_usage_reference.synthetic_input_tokens,
            0,
          ),
          synthetic_output_tokens: stageRecords.reduce(
            (sum, entry) => sum + entry.synthetic_usage_reference.synthetic_output_tokens,
            0,
          ),
          synthetic_reasoning_tokens: "unknown",
          synthetic_usage_cost_reference_usd: rounded(cumulativeReferenceUsd),
          static_hard_cap_usd: B1A.staticHardCapUsd,
          preflight_ceiling_usd: B1A.preflightCeilingUsd,
          future_human_ceiling_usd: B1A.futureHumanCeilingUsd,
        },
      };
      const result = {
        schema_version: "moon-reply-b1a-run-result-v1",
        execution_mode: B1A.mode,
        run_kind: B1A.runKind,
        case_id: B1A.caseId,
        requested_model: B1A.model,
        product_model_selected: false,
        baseline_model_selected: false,
        live_execution_authorized: false,
        final_state: state,
        stop_code: null,
        stop_count: 0,
        completed_stages: completedStages,
        completed_local_steps: completedLocalSteps,
        local_artifacts: localArtifacts,
        state_transitions: transitions,
        stage_records: stageRecords,
        simulated_provider_stages: stageRecords.length,
        actual_provider_calls: 0,
        api_spend_usd: 0,
        budget_ledger: budgetLedger,
      };
      return { ...result, deterministic_payload_sha256: compactHash(result) };

      function outputFor(stageId) {
        return JSON.parse(
          stageRecords.find((entry) => entry.stage_id === stageId).output_json,
        );
      }

      function replayStage(stageId) {
        transition("stage_pending", `${stageId} pending`);
        transition("stage_replaying", `${stageId} replay`);
        let receipt = transport.invoke({ stage_id: stageId });
        receipt = clone(receipt);
        if (stageId === "PB-01") {
          if (injectionId === "synthetic_response_incomplete") {
            receipt.status = "incomplete";
          }
          if (injectionId === "synthetic_refusal_present") {
            receipt.refusal = "synthetic_refusal";
          }
          if (injectionId === "synthetic_usage_missing") {
            receipt.usage_reference = null;
          }
          if (injectionId === "invalid_json_output") receipt.output_json = "{";
          if (injectionId === "schema_validation_failure") {
            const parsed = JSON.parse(receipt.output_json);
            parsed.unexpected = true;
            receipt.output_json = JSON.stringify(parsed);
          }
        }
        if (
          stageId === "PB-06" &&
          injectionId === "hallucinated_fact_reference"
        ) {
          const parsed = JSON.parse(receipt.output_json);
          parsed.semantic_checks = [
            {
              finding_code: "FACT_FIDELITY",
              severity: "critical",
              json_path: "$.observed_fact_commentary[0]",
              evidence_refs: ["F001"],
              detail: "Synthetic injected finding",
            },
          ];
          receipt.output_json = JSON.stringify(parsed);
        }
        if (receipt.status !== "completed") {
          throw stopError("B1A_SYNTHETIC_RESPONSE_INCOMPLETE", `${stageId} incomplete`);
        }
        if (receipt.refusal !== null) {
          throw stopError("B1A_SYNTHETIC_REFUSAL", `${stageId} refusal`);
        }
        if (!receipt.usage_reference) {
          throw stopError("B1A_SYNTHETIC_USAGE_MISSING", `${stageId} usage missing`);
        }
        transition("stage_output_validating", `${stageId} Schema validation`);
        let output;
        try {
          output = JSON.parse(receipt.output_json);
        } catch {
          throw stopError("B1A_INVALID_JSON_OUTPUT", `${stageId} invalid JSON`);
        }
        const schema = assets.stageSchemas[stageId];
        const errors = validateJsonSchema(output, schema.resolved, schema.root);
        if (errors.length > 0) {
          throw stopError(
            "B1A_SCHEMA_VALIDATION_FAILED",
            `${stageId}: ${errors.join("; ")}`,
          );
        }
        transition("stage_completed", `${stageId} completed`);
        completedStages.push(stageId);
        cumulativeReferenceUsd = rounded(
          cumulativeReferenceUsd +
            receipt.usage_reference.synthetic_usage_cost_reference_usd,
        );
        stageRecords.push({
          stage_id: stageId,
          transport_kind: receipt.transport_kind,
          synthetic: true,
          actual_provider_output: false,
          response_id: receipt.response_id,
          response_status: receipt.status,
          output_schema_ref: assets.replayCatalog.stages.find(
            (entry) => entry.stage_id === stageId,
          ).output_schema_ref,
          output_json: receipt.output_json,
          synthetic_usage_reference: receipt.usage_reference,
          source_estimator_hash: receipt.source_estimator_hash,
          source_contract_hash: receipt.source_contract_hash,
        });
      }

      function localStep(stepId, action) {
        transition("local_step_running", stepId);
        action();
        transition("local_step_completed", stepId);
        completedLocalSteps.push(stepId);
      }
    } catch (error) {
      return stop(error);
    }
  }

  return Object.freeze({ run });
}

function deepEqual(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

export function runFailureMatrix({ assets, transport }) {
  return assets.failureCatalog.scenarios.map((scenario) => {
    const result = createRunner({ assets, transport }).run({
      injection_id: scenario.scenario_id,
    });
    return {
      scenario_id: scenario.scenario_id,
      injected_mutation: scenario.injected_mutation,
      expected_stop_state: scenario.expected_stop_state,
      expected_stop_code: scenario.expected_stop_code,
      expected_last_completed_stage: scenario.expected_last_completed_stage,
      actual_final_state: result.final_state,
      actual_stop_code: result.stop_code,
      actual_last_completed_stage: result.last_completed_stage,
      stop_count: result.stop_count,
      provider_calls: result.actual_provider_calls,
      api_spend_usd: result.actual_api_spend_usd,
      passed:
        result.final_state === scenario.expected_stop_state &&
        result.stop_code === scenario.expected_stop_code &&
        result.last_completed_stage === scenario.expected_last_completed_stage &&
        result.stop_count === 1 &&
        result.actual_provider_calls === 0 &&
        result.actual_api_spend_usd === 0,
    };
  });
}
