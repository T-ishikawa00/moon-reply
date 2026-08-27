import { OpenAiResponsesTransport } from "../runtime/openai-transport.ts";
import { loadM2P4FinalProductRecoveryRuntimeStageCatalog } from "../runtime/schema-catalog.ts";
import { SupabaseAssessmentRepository } from "../runtime/supabase-repository.ts";
import { ProductionFulfillmentApplication } from "./application.ts";
import {
  readProductionAssessmentEnvironment,
  readProductionPersistenceEnvironment,
} from "./environment-runtime.ts";
import { SupabaseProductionFulfillmentRepository } from "./supabase-repository.ts";

export type ProductionPreparationRuntimeDiagnostic = {
  correlationId: string;
  attempt: 0 | 1;
  classification:
    | "APPLICATION_RUNTIME_INIT_START"
    | "APPLICATION_RUNTIME_INIT_DONE"
    | "APPLICATION_RUNTIME_INIT_FAILED"
    | "CATALOG_INIT_START"
    | "CATALOG_INIT_DONE"
    | "CATALOG_INIT_FAILED"
    | "CATALOG_CACHE_HIT"
    | "CATALOG_INIT_JOINED"
    | "PREPARATION_RUN_START"
    | "PREPARATION_RUN_DONE"
    | "PREPARATION_RUN_FAILED";
  elapsedMilliseconds: number;
  cacheHit: boolean | null;
  cacheKey: string | null;
};

export type ProductionPreparationRuntimeDiagnosticContext = {
  correlationId: string;
  attempt: 0 | 1;
  observe: (diagnostic: ProductionPreparationRuntimeDiagnostic) => void;
};

function observeRuntimeInitialization(
  context: ProductionPreparationRuntimeDiagnosticContext | undefined,
  diagnostic: Omit<
    ProductionPreparationRuntimeDiagnostic,
    "correlationId" | "attempt"
  >,
) {
  if (!context) return;
  try {
    context.observe({
      correlationId: context.correlationId,
      attempt: context.attempt,
      ...diagnostic,
    });
  } catch {
    // Diagnostics must never change application initialization.
  }
}

function elapsedMilliseconds(startedAt: number) {
  return Math.max(0, Math.round(performance.now() - startedAt));
}

type ProductionApplicationRuntimeOptions = {
  allowSyntheticPurchaseAuthority?: boolean;
  diagnostics?: ProductionPreparationRuntimeDiagnosticContext;
};

async function initializeApplicationRuntime<T>(
  diagnostics: ProductionPreparationRuntimeDiagnosticContext | undefined,
  initialize: () => Promise<T>,
) {
  const startedAt = performance.now();
  observeRuntimeInitialization(diagnostics, {
    classification: "APPLICATION_RUNTIME_INIT_START",
    elapsedMilliseconds: 0,
    cacheHit: null,
    cacheKey: null,
  });
  try {
    const application = await initialize();
    observeRuntimeInitialization(diagnostics, {
      classification: "APPLICATION_RUNTIME_INIT_DONE",
      elapsedMilliseconds: elapsedMilliseconds(startedAt),
      cacheHit: null,
      cacheKey: null,
    });
    return application;
  } catch (error) {
    observeRuntimeInitialization(diagnostics, {
      classification: "APPLICATION_RUNTIME_INIT_FAILED",
      elapsedMilliseconds: elapsedMilliseconds(startedAt),
      cacheHit: null,
      cacheKey: null,
    });
    throw error;
  }
}

function loadProductionRuntimeCatalog(
  diagnostics: ProductionPreparationRuntimeDiagnosticContext | undefined,
) {
  return loadM2P4FinalProductRecoveryRuntimeStageCatalog({
    observe: (diagnostic) =>
      observeRuntimeInitialization(diagnostics, {
        ...diagnostic,
        cacheHit:
          diagnostic.classification === "CATALOG_CACHE_HIT"
            ? true
            : diagnostic.classification === "CATALOG_INIT_JOINED"
              ? null
              : false,
      }),
  });
}

export async function createProductionAssessmentApplication(
  options?: ProductionApplicationRuntimeOptions,
) {
  return initializeApplicationRuntime(options?.diagnostics, async () => {
    const environment = readProductionAssessmentEnvironment();
    const loaded = await loadProductionRuntimeCatalog(options?.diagnostics);
    const runtimeRepository = new SupabaseAssessmentRepository(
      environment.supabaseUrl,
      environment.supabaseSecretKey,
    );
    const lifecycleRepository = new SupabaseProductionFulfillmentRepository(
      environment.supabaseUrl,
      environment.supabaseSecretKey,
    );
    return new ProductionFulfillmentApplication({
      runtimeRepository,
      lifecycleRepository,
      prepaymentComputeAuthority: lifecycleRepository,
      transport: new OpenAiResponsesTransport(environment.openAiApiKey),
      catalog: {
        catalogVersion: "runtime-stage-catalog-v17.0.0",
        promptBundleVersion: "prompt-bundle-runtime-v17.0.0",
        schemaSetVersion: "pipeline-schema-runtime-v6.0.0",
        stageTopologyVersion: "split-base-candidate-v1",
        definitions: loaded.definitions,
      },
      model: environment.openAiModel,
      allowSyntheticPurchaseAuthority:
        options?.allowSyntheticPurchaseAuthority ?? false,
    });
  });
}

export async function createProviderFreeProductionAssessmentApplication(
  options?: { diagnostics?: ProductionPreparationRuntimeDiagnosticContext },
) {
  return initializeApplicationRuntime(options?.diagnostics, async () => {
    const environment = readProductionPersistenceEnvironment();
    const loaded = await loadProductionRuntimeCatalog(options?.diagnostics);
    const lifecycleRepository = new SupabaseProductionFulfillmentRepository(
      environment.supabaseUrl,
      environment.supabaseSecretKey,
    );
    return new ProductionFulfillmentApplication({
      runtimeRepository: new SupabaseAssessmentRepository(
        environment.supabaseUrl,
        environment.supabaseSecretKey,
      ),
      lifecycleRepository,
      prepaymentComputeAuthority: lifecycleRepository,
      catalog: {
        catalogVersion: "runtime-stage-catalog-v17.0.0",
        promptBundleVersion: "prompt-bundle-runtime-v17.0.0",
        schemaSetVersion: "pipeline-schema-runtime-v6.0.0",
        stageTopologyVersion: "split-base-candidate-v1",
        definitions: loaded.definitions,
      },
      model: "gpt-5.6-luna",
    });
  });
}
