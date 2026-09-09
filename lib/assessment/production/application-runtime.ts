import { SupabaseAssessmentRepository } from "../runtime/supabase-repository.ts";
import {
  readProductionAssessmentEnvironment,
} from "./environment-runtime.ts";
import { SupabaseProductionFulfillmentRepository } from "./supabase-repository.ts";
import { createGlobalUnpaidComputeAuthority } from "./global-unpaid-compute-runtime.ts";
import { readGlobalUnpaidComputePolicy } from "./global-unpaid-compute.ts";
import { createPaidRecoveryTransport, SupabasePaidProviderBudgetRepository } from "./paid-recovery-transport.ts";

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
  const transport = new OpenAiResponsesTransport(environment.openAiApiKey);
  const paidBudgetRepository = new SupabasePaidProviderBudgetRepository(environment.supabaseUrl, environment.supabaseSecretKey);
  return new ProductionFulfillmentApplication({
    newPurchaseContract: "v19-l5",
    runtimeRepository,
    lifecycleRepository,
    prepaymentComputeAuthority: lifecycleRepository,
    globalUnpaidComputeAuthority: createGlobalUnpaidComputeAuthority(
      environment.supabaseUrl,
      environment.supabaseSecretKey,
    ),
    // Resolve required unpaid configuration only when an unpaid stage starts.
    // Paid fulfillment never reads or reserves from this pool.
    globalUnpaidComputePolicy: readGlobalUnpaidComputePolicy,
    transport,
    paidTransportFactory: ({ logicalAssessmentId, ownerId }) => createPaidRecoveryTransport({
      transport, repository: paidBudgetRepository, logicalAssessmentId, ownerId,
    }),
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
