import "server-only";
import { AssessmentApplication } from "./application.ts";
import { readM2RuntimeEnvironment } from "./environment.ts";
import { OpenAiResponsesTransport } from "./openai-transport.ts";
import { loadCanonicalStageCatalog } from "./schema-catalog.ts";
import { SupabaseAssessmentRepository } from "./supabase-repository.ts";
import type { AssessmentInput } from "./types.ts";

export async function executeInternalAssessment(
  input: AssessmentInput,
  idempotencyKey: string,
) {
  const environment = readM2RuntimeEnvironment();
  const catalog = await loadCanonicalStageCatalog();
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
