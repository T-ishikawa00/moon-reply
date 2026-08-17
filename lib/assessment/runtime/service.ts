import "server-only";
import { AssessmentApplication } from "./application.ts";
import { readM2RuntimeEnvironment } from "./environment.ts";
import { OpenAiResponsesTransport } from "./openai-transport.ts";
import { loadM2P4QualityReassessmentRuntimeStageCatalog } from "./schema-catalog.ts";
import { SupabaseAssessmentRepository } from "./supabase-repository.ts";
import type { AssessmentInput } from "./types.ts";

async function createApplication() {
  const environment = readM2RuntimeEnvironment();
  const catalog = await loadM2P4QualityReassessmentRuntimeStageCatalog();
  return new AssessmentApplication({
    repository: new SupabaseAssessmentRepository(
      environment.supabaseUrl,
      environment.supabaseSecretKey,
    ),
    transport: new OpenAiResponsesTransport(environment.openAiApiKey),
    model: environment.openAiModel,
    promptBundleVersion: catalog.promptBundleVersion,
    schemaSetVersion: catalog.schemaSetVersion,
    definitions: catalog.definitions,
    timeZone: "Asia/Tokyo",
  });
}

export async function executeInternalAssessment(
  input: AssessmentInput,
  idempotencyKey: string,
) {
  const application = await createApplication();
  return application.submit(input, idempotencyKey);
}

export async function answerInternalAssessmentClarification(
  clarificationId: string,
  answer: unknown,
) {
  const application = await createApplication();
  return application.answerClarification(clarificationId, answer);
}
