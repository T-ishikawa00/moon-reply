import { registerHooks } from "node:module";

let runtimeModulesPromise;

function loadRuntimeModules() {
  if (runtimeModulesPromise) return runtimeModulesPromise;
  registerHooks({
    resolve(specifier, context, nextResolve) {
      if (specifier === "server-only") {
        return {
          url: "data:text/javascript,export%20{}",
          shortCircuit: true,
        };
      }
      return nextResolve(specifier, context);
    },
  });
  runtimeModulesPromise = Promise.all([
    import("../../lib/assessment/runtime/openai-transport.ts"),
    import("../../lib/assessment/runtime/schema-catalog.ts"),
    import("../../lib/assessment/runtime/validation.ts"),
    import("../../lib/assessment/runtime/structured-intake-grounding-v3.ts"),
    import("../../lib/assessment/runtime/contextual-integrity-v3.ts"),
    import("../../lib/assessment/runtime/structured-intake-grounding-v4.ts"),
    import("../../lib/assessment/runtime/writing-context-integrity-v1.ts"),
    import("../../lib/assessment/runtime/structured-intake-legacy-view-v3.ts"),
  ]).then(
    ([
      { OpenAiResponsesTransport },
      {
        loadM2P4ProductQualityRuntimeStageCatalog,
        loadM2P4WritingContextRuntimeStageCatalog,
      },
      { validateStageOutput },
      { groundStructuredIntakeV3 },
      { validateContextualIntakeIntegrityV3 },
      { groundStructuredIntakeV4 },
      { validateWritingContextIntegrityV1 },
      { buildStructuredIntakeLegacyViewV3 },
    ]) => ({
      OpenAiResponsesTransport,
      loadM2P4ProductQualityRuntimeStageCatalog,
      loadM2P4WritingContextRuntimeStageCatalog,
      validateStageOutput,
      groundStructuredIntakeV3,
      validateContextualIntakeIntegrityV3,
      groundStructuredIntakeV4,
      validateWritingContextIntegrityV1,
      buildStructuredIntakeLegacyViewV3,
    }),
  );
  return runtimeModulesPromise;
}

function safeCode(error) {
  return typeof error?.safeCode === "string"
    ? error.safeCode
    : "M2_R1_C1_DIAGNOSTIC_FAILED";
}

function typedProjection(output, includeWritingContext) {
  if (!output || typeof output !== "object" || Array.isArray(output)) return null;
  return {
    untrusted_embedded_instructions_detected:
      output.untrusted_embedded_instructions_detected ?? null,
    decision_facts: output.decision_facts ?? null,
    ...(includeWritingContext
      ? { writing_context: output.writing_context ?? null }
      : {}),
  };
}

function stageInput(diagnosticCase) {
  return {
    current_situation: diagnosticCase.input.current_situation,
    optional_message: diagnosticCase.input.optional_message,
    relationship: diagnosticCase.input.relationship,
    requested_topics: diagnosticCase.input.requested_topics,
  };
}

function stageRequest(definition, model, input) {
  if (definition.stageId !== "PB-01") {
    throw new Error("M2_R1_C1_NON_PB01_DEFINITION");
  }
  return {
    stageId: "PB-01",
    model,
    developerPrompt: definition.developerPrompt,
    promptVersion: definition.promptVersion,
    promptHash: definition.promptHash,
    schemaName: definition.schemaName,
    schemaVersion: definition.schemaVersion,
    schemaHash: definition.schemaHash,
    outputSchema: definition.outputSchema,
    input,
  };
}

function emptyUsage() {
  return {
    input_tokens: 0,
    cached_tokens: 0,
    output_tokens: 0,
    reasoning_tokens: 0,
  };
}

function callPlan(caseBundle) {
  return caseBundle.cases.flatMap((diagnosticCase) => [
    ...(diagnosticCase.paired_v3_required
      ? [{ diagnosticCase, contractVariant: "v3" }]
      : []),
    { diagnosticCase, contractVariant: "v4" },
  ]);
}

export async function runBoundedPb01ProviderDiagnostic({
  apiKey,
  model,
  contract,
  caseBundle,
  beforeFirstProviderCall,
  onProgress,
}) {
  if (model !== contract.model) throw new Error("M2_R1_C1_MODEL_NOT_AUTHORIZED");
  if (contract.stage !== "PB-01") throw new Error("M2_R1_C1_STAGE_NOT_AUTHORIZED");
  if (caseBundle.cases.length !== contract.synthetic_cases) {
    throw new Error("M2_R1_C1_CASE_COUNT_INVALID");
  }

  const plan = callPlan(caseBundle);
  if (
    plan.length !== contract.authorized_calls.total ||
    plan.filter((item) => item.contractVariant === "v3").length !==
      contract.authorized_calls.v3 ||
    plan.filter((item) => item.contractVariant === "v4").length !==
      contract.authorized_calls.v4
  ) {
    throw new Error("M2_R1_C1_CALL_PLAN_INVALID");
  }

  const runtime = await loadRuntimeModules();
  const [catalogV3, catalogV4] = await Promise.all([
    runtime.loadM2P4ProductQualityRuntimeStageCatalog(),
    runtime.loadM2P4WritingContextRuntimeStageCatalog(),
  ]);
  const definitionV3 = catalogV3.definitions.find(
    (definition) => definition.stageId === "PB-01",
  );
  const definitionV4 = catalogV4.definitions.find(
    (definition) => definition.stageId === "PB-01",
  );
  if (!definitionV3 || !definitionV4) {
    throw new Error("M2_R1_C1_PB01_DEFINITION_MISSING");
  }

  const transport = new runtime.OpenAiResponsesTransport(apiKey);
  const calls = [];
  let providerCallCounter = 0;
  let firstCallGuardConsumed = false;

  for (const [index, item] of plan.entries()) {
    if (providerCallCounter >= contract.authorized_calls.total) {
      throw new Error("M2_R1_C1_CALL_CAP_REACHED");
    }
    if (!firstCallGuardConsumed) {
      await beforeFirstProviderCall();
      firstCallGuardConsumed = true;
    }

    providerCallCounter += 1;
    const definition = item.contractVariant === "v3" ? definitionV3 : definitionV4;
    const record = {
      case_id: item.diagnosticCase.case_id,
      contract_variant: item.contractVariant,
      call_sequence: index + 1,
      status: "provider_started",
      provider_completed: false,
      safe_error_code: null,
      returned_model: null,
      latency_ms: 0,
      usage: emptyUsage(),
      raw_output_sha256: null,
      grounded_output_sha256: null,
      legacy_view_sha256: null,
      raw_typed_projection: null,
      grounded_typed_projection: null,
      legacy_typed_projection: null,
      decision_facts: null,
      writing_context: null,
      hard_assertions: { passed: 0, total: 0, rate: 1, results: [] },
      soft_assertions: { passed: 0, total: 0, rate: 1, results: [] },
      forbidden_assertions: { passed: 0, total: 0, rate: 1, results: [] },
      hard_fail_codes: [],
      validation: {
        raw_schema: false,
        grounded_schema: false,
        integrity: false,
        legacy_schema: false,
        legacy_integrity: false,
      },
    };
    calls.push(record);

    let step = "provider";
    try {
      const response = await transport.invoke(
        stageRequest(definition, model, stageInput(item.diagnosticCase)),
      );
      record.provider_completed = true;
      record.returned_model = response.returnedModel;
      record.latency_ms = response.latencyMs;
      record.usage = {
        input_tokens: response.usage.inputTokens,
        cached_tokens: response.usage.cachedTokens,
        output_tokens: response.usage.outputTokens,
        reasoning_tokens: response.usage.reasoningTokens,
      };
      record.raw_typed_projection = typedProjection(
        response.output,
        item.contractVariant === "v4",
      );
      record.raw_output_sha256 = (await import("./m2-p4-i3-r1-c1-evaluator.mjs")).shaJson(
        record.raw_typed_projection,
      );
      if (response.returnedModel !== model) {
        throw Object.assign(new Error("M2_STAGE_MODEL_MISMATCH"), {
          safeCode: "M2_STAGE_MODEL_MISMATCH",
        });
      }

      step = "raw_schema";
      runtime.validateStageOutput(definition, response.output);
      record.validation.raw_schema = true;

      step = "grounding";
      const grounded =
        item.contractVariant === "v4"
          ? runtime.groundStructuredIntakeV4(
              {
                currentSituation: item.diagnosticCase.input.current_situation,
                optionalMessage: item.diagnosticCase.input.optional_message,
                relationship: item.diagnosticCase.input.relationship,
                requestedTopics: item.diagnosticCase.input.requested_topics,
                privacyAcknowledged: true,
              },
              response.output,
            )
          : runtime.groundStructuredIntakeV3(
              {
                currentSituation: item.diagnosticCase.input.current_situation,
                optionalMessage: item.diagnosticCase.input.optional_message,
                relationship: item.diagnosticCase.input.relationship,
                requestedTopics: item.diagnosticCase.input.requested_topics,
                privacyAcknowledged: true,
              },
              response.output,
            );
      record.grounded_typed_projection = typedProjection(
        grounded,
        item.contractVariant === "v4",
      );
      record.grounded_output_sha256 = (await import("./m2-p4-i3-r1-c1-evaluator.mjs")).shaJson(
        record.grounded_typed_projection,
      );
      record.decision_facts = grounded.decision_facts;
      record.writing_context =
        item.contractVariant === "v4" ? grounded.writing_context : null;

      step = "grounded_schema";
      runtime.validateStageOutput(definition, grounded);
      record.validation.grounded_schema = true;

      step = "integrity";
      if (item.contractVariant === "v4") {
        runtime.validateWritingContextIntegrityV1(
          {
            currentSituation: item.diagnosticCase.input.current_situation,
            optionalMessage: item.diagnosticCase.input.optional_message,
            relationship: item.diagnosticCase.input.relationship,
            requestedTopics: item.diagnosticCase.input.requested_topics,
            privacyAcknowledged: true,
          },
          grounded,
        );
      } else {
        runtime.validateContextualIntakeIntegrityV3(grounded);
      }
      record.validation.integrity = true;

      step = "legacy";
      const legacy =
        item.contractVariant === "v4"
          ? runtime.buildStructuredIntakeLegacyViewV3(grounded)
          : grounded;
      record.legacy_typed_projection = typedProjection(legacy, false);
      record.legacy_view_sha256 = (await import("./m2-p4-i3-r1-c1-evaluator.mjs")).shaJson(
        record.legacy_typed_projection,
      );
      runtime.validateStageOutput(definitionV3, legacy);
      record.validation.legacy_schema = true;
      runtime.validateContextualIntakeIntegrityV3(legacy);
      record.validation.legacy_integrity = true;
      record.status = "completed";
    } catch (error) {
      record.safe_error_code = safeCode(error);
      record.status =
        step === "provider"
          ? "provider_failed"
          : step.includes("schema")
            ? "schema_failed"
            : step === "integrity" || step === "legacy"
              ? "integrity_failed"
              : "grounding_failed";
    }

    await onProgress(structuredClone(calls));
  }

  return calls;
}
