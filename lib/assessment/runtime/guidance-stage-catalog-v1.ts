import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import Ajv2020 from "ajv/dist/2020.js";
import { M2RuntimeError } from "./errors.ts";
import { assertOpenAIStructuredOutputSchema, toOpenAiStructuredOutputSchema } from "./openai-schema.ts";
import { loadM2P4FinalProductRecoveryRuntimeStageCatalog } from "./schema-catalog.ts";
import {
  GUIDANCE_WAVE1_CATALOG_VERSION,
  GUIDANCE_WAVE1_PROMPT_BUNDLE_VERSION,
  GUIDANCE_WAVE1_SCHEMA_SET_VERSION,
} from "./guidance-runtime-identity-v1.ts";
import type { JsonObject, StageDefinition } from "./types.ts";

type Manifest = {
  schema_version: string;
  catalog_version: string;
  prompt_bundle_version: string;
  schema_set_version: string;
  stage_topology_version: string;
  baseline: string;
  hash_algorithm: string;
  common_prompt: JsonObject;
  stages: Array<Record<string, string | number | null>>;
};
const canonical = (text: string) => text.replace(/\r\n/gu, "\n");
const hash = (text: string) => createHash("sha256").update(canonical(text)).digest("hex");
const contractRoot = "lib/assessment/runtime/contracts/";
const changed = {
  "PB-04": { prompt: "pb-04-v18-guidance-wave1.developer.md", version: "v8.0.0" },
  "PB-05": { prompt: "pb-05-v18-guidance-wave1.developer.md", version: "v9.0.0" },
  "PB-06": { prompt: "pb-06-v18-guidance-wave1.developer.md", version: "v8.0.0" },
} as const;

function invalid(): never { throw new M2RuntimeError("M2_PROMPT_MANIFEST_INVALID"); }

// Uses the existing seven-stage executor. No Provider, DB, env, or default selection.
export async function loadGuidanceQualityWave1StageCatalog() {
  const root = process.cwd();
  const read = (relative: string) => readFile(path.join(/*turbopackIgnore: true*/ root, relative), "utf8");
  const predecessor = await loadM2P4FinalProductRecoveryRuntimeStageCatalog();
  const old = JSON.parse(await read(`${contractRoot}runtime-stage-catalog-v17.json`)) as Manifest;
  const candidate = JSON.parse(await read(`${contractRoot}runtime-stage-catalog-v18.json`)) as Manifest;
  if (candidate.schema_version !== old.schema_version ||
    candidate.catalog_version !== GUIDANCE_WAVE1_CATALOG_VERSION ||
    candidate.prompt_bundle_version !== GUIDANCE_WAVE1_PROMPT_BUNDLE_VERSION ||
    candidate.schema_set_version !== GUIDANCE_WAVE1_SCHEMA_SET_VERSION ||
    candidate.stage_topology_version !== "split-base-candidate-v1" ||
    candidate.baseline !== "46fa02a52e39a5c5c4d62bf4e66292619a8b286f" ||
    candidate.hash_algorithm !== "sha256-utf8-lf" ||
    predecessor.catalogVersion !== old.catalog_version ||
    !Array.isArray(candidate.stages) || candidate.stages.length !== 7 ||
    JSON.stringify(candidate.common_prompt) !== JSON.stringify(old.common_prompt)) invalid();
  const definitions: StageDefinition[] = [];
  for (const [index, previous] of predecessor.definitions.entries()) {
    const stage = candidate.stages[index];
    const prior = old.stages[index];
    if (!stage || stage.stage_id !== previous.stageId || stage.sequence_number !== index + 1) invalid();
    const override = changed[previous.stageId as keyof typeof changed];
    if (!override) {
      if (JSON.stringify(stage) !== JSON.stringify(prior)) invalid();
      definitions.push(previous);
      continue;
    }
    const expected = { ...prior, source: "guidance-quality-wave1-local-candidate",
      prompt_version: override.version, prompt_path: `${contractRoot}${override.prompt}`,
      prompt_sha256: stage.prompt_sha256 };
    if (previous.stageId === "PB-04") Object.assign(expected, {
      schema_version: "guidance-decision-plan-v1", schema_name: "pb_04_guidance_decision_plan_v1",
      schema_path: `${contractRoot}guidance-decision-plan-v1.schema.json`, schema_sha256: stage.schema_sha256,
    });
    if (JSON.stringify(stage) !== JSON.stringify(expected)) invalid();
    const [promptText, schemaText, commonText] = await Promise.all([
      read(String(stage.prompt_path)), read(String(stage.schema_path)), read(String(candidate.common_prompt.prompt_path)),
    ]);
    if (hash(promptText) !== stage.prompt_sha256 || hash(commonText) !== candidate.common_prompt.prompt_sha256)
      throw new M2RuntimeError("M2_PROMPT_HASH_MISMATCH");
    if (hash(schemaText) !== stage.schema_sha256) throw new M2RuntimeError("M2_SCHEMA_HASH_MISMATCH");
    const outputSchema = previous.stageId === "PB-04" ? JSON.parse(schemaText) as JsonObject : previous.outputSchema;
    new Ajv2020({ allErrors: true, strict: false, validateFormats: false }).compile(outputSchema);
    assertOpenAIStructuredOutputSchema(toOpenAiStructuredOutputSchema(outputSchema));
    const developerPrompt = `${canonical(commonText)}\n\n${canonical(promptText)}`;
    definitions.push({ ...previous, developerPrompt, promptVersion: String(stage.prompt_version),
      promptHash: hash(developerPrompt), schemaVersion: String(stage.schema_version),
      schemaName: String(stage.schema_name), outputSchema, schemaHash: hash(JSON.stringify(outputSchema)) });
  }
  return {
    catalogVersion: GUIDANCE_WAVE1_CATALOG_VERSION,
    promptBundleVersion: GUIDANCE_WAVE1_PROMPT_BUNDLE_VERSION,
    schemaSetVersion: GUIDANCE_WAVE1_SCHEMA_SET_VERSION,
    stageTopologyVersion: "split-base-candidate-v1" as const,
    definitions,
  };
}
