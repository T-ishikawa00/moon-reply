import { M2RuntimeError } from "../../../lib/assessment/runtime/errors.ts";

export const CONTENT_STUDIO_LOCAL_MODEL = "gpt-5.6-luna" as const;

export type LocalContentStudioEnvironment = Readonly<{
  openAiApiKey: string;
  model: typeof CONTENT_STUDIO_LOCAL_MODEL;
}>;

type EnvironmentSource = Readonly<Record<string, string | undefined>>;

const netlifyDeploymentMarkers = [
  "CONTEXT",
  "DEPLOY_ID",
  "DEPLOY_PRIME_URL",
  "DEPLOY_URL",
  "NETLIFY_IMAGES_CDN_DOMAIN",
  "SITE_ID",
] as const;

function unavailable(): never {
  throw new M2RuntimeError("CONTENT_STUDIO_LOCAL_UNAVAILABLE", 404);
}

export function assertLocalContentStudioAvailable(
  environment: EnvironmentSource = process.env,
) {
  if (
    environment.NODE_ENV !== "development" ||
    environment.CONTENT_STUDIO_LOCAL_ENABLED !== "true" ||
    Boolean(environment.NETLIFY) ||
    Boolean(environment.NETLIFY_LOCAL) ||
    netlifyDeploymentMarkers.some((name) => Boolean(environment[name]))
  ) {
    unavailable();
  }
}

export function readLocalContentStudioEnvironment(
  environment: EnvironmentSource = process.env,
): LocalContentStudioEnvironment {
  assertLocalContentStudioAvailable(environment);
  const key = environment.CONTENT_STUDIO_LOCAL_OPENAI_API_KEY?.trim();
  if (!key) {
    throw new M2RuntimeError(
      "CONTENT_STUDIO_LOCAL_CONFIGURATION_INVALID",
      503,
    );
  }
  return Object.freeze({
    openAiApiKey: key,
    model: CONTENT_STUDIO_LOCAL_MODEL,
  });
}
