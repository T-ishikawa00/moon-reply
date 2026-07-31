import "server-only";
import { AssessmentApplication } from "./application.ts";
import { readM2RuntimeEnvironment } from "./environment.ts";
import { OpenAiResponsesTransport } from "./openai-transport.ts";
import { loadM2P4ProductQualityRuntimeStageCatalog } from "./schema-catalog.ts";
import { SupabaseAssessmentRepository } from "./supabase-repository.ts";
import type { AssessmentInput } from "./types.ts";

export async function executeInternalAssessment(
  input: AssessmentInput,
  idempotencyKey: string,
) {
  const environment = readM2RuntimeEnvironment();
  // Historical v2/v3 loaders remain available for exact replay.
  const catalog = await loadM2P4ProductQualityRuntimeStageCatalog();
  const application = new AssessmentApplication({
    repository: new SupabaseAssessmentRepository(
      environment.supabaseUrl,
      environment.supabaseSecretKey,
    ),
    transport: new OpenAiResponsesTransport(environment.openAiApiKey),
    model: environment.openAiModel,
    promptBundleVersion: catalog.promptBundleVersion,
    schemaSetVersion: catalog.schemaSetVersion,
    definitions: catalog.definitions,
  });
  return application.submit(input, idempotencyKey);
}
