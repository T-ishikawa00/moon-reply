import { SupabaseAssessmentRepository } from "../runtime/supabase-repository.ts";
import {
  readProductionAssessmentEnvironment,
} from "./environment-runtime.ts";
import { SupabaseProductionFulfillmentRepository } from "./supabase-repository.ts";

export async function createProductionAssessmentApplication(options?: {
  allowSyntheticPurchaseAuthority?: boolean;
}) {
  const [
    { OpenAiResponsesTransport },
    { loadM2P4FinalProductRecoveryRuntimeStageCatalog },
    { ProductionFulfillmentApplication },
  ] = await Promise.all([
    import("../runtime/openai-transport.ts"),
    import("../runtime/schema-catalog.ts"),
    import("./application.ts"),
  ]);
  const environment = readProductionAssessmentEnvironment();
  const loaded = await loadM2P4FinalProductRecoveryRuntimeStageCatalog();
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
}
