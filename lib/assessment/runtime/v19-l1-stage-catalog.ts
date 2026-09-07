import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { M2RuntimeError } from "./errors.ts";
import { loadM2P4FinalProductRecoveryRuntimeStageCatalog } from "./schema-catalog.ts";
import { V19_L1_CATALOG_VERSION, V19_L1_PROMPT_BUNDLE_VERSION, V19_L1_SCHEMA_SET_VERSION, V19_L1_PB01_PROMPT_VERSION, V19_L1_PB05_PROMPT_VERSION } from "./v19-l1-runtime-identity.ts";

type Manifest = {
  catalog_version: string; prompt_bundle_version: string; schema_set_version: string;
  baseline: string; common_prompt: { prompt_path: string; prompt_sha256: string };
  stages: Array<Record<string, string | number | null>>;
};
const canonical = (text: string) => text.replace(/\r\n/gu, "\n");
const hash = (text: string) => createHash("sha256").update(canonical(text)).digest("hex");
const contractRoot = "lib/assessment/runtime/contracts/";
const overrides = [
  { stageId: "PB-01", file: "pb-01-v19-l1-acknowledgement.developer.md", version: V19_L1_PB01_PROMPT_VERSION },
  { stageId: "PB-05", file: "pb-05-v19-l1-draft-timing.developer.md", version: V19_L1_PB05_PROMPT_VERSION },
] as const;

// Explicit local selection, same seven-stage executor and all V17 schemas.
export async function loadV19L1StageCatalog() {
  const root = process.cwd();
  const read = (relative: string) => readFile(path.join(/*turbopackIgnore: true*/ root, relative), "utf8");
  const predecessor = await loadM2P4FinalProductRecoveryRuntimeStageCatalog();
  const old = JSON.parse(await read(`${contractRoot}runtime-stage-catalog-v17.json`)) as Manifest;
  const candidate = JSON.parse(await read(`${contractRoot}runtime-stage-catalog-v19.json`)) as Manifest;
  const prompts = await Promise.all(overrides.map(async (override) => ({ ...override,
    text: await read(`${contractRoot}${override.file}`) })));
  const expected = { ...old, catalog_version: V19_L1_CATALOG_VERSION,
    prompt_bundle_version: V19_L1_PROMPT_BUNDLE_VERSION, schema_set_version: V19_L1_SCHEMA_SET_VERSION,
    baseline: "6ab70e6af379078b0f67f57d9ff2b91da3cbe8b3",
    stages: old.stages.map((stage) => {
      const prompt = prompts.find((item) => item.stageId === stage.stage_id);
      return prompt ? { ...stage, source: "guidance-quality-v19-l1-local-candidate", prompt_version: prompt.version,
        prompt_path: `${contractRoot}${prompt.file}`, prompt_sha256: hash(prompt.text) } : stage;
    }) };
  if (predecessor.catalogVersion !== old.catalog_version || JSON.stringify(candidate) !== JSON.stringify(expected)) {
    throw new M2RuntimeError("M2_PROMPT_MANIFEST_INVALID");
  }
  const commonText = await read(candidate.common_prompt.prompt_path);
  if (hash(commonText) !== candidate.common_prompt.prompt_sha256) throw new M2RuntimeError("M2_PROMPT_HASH_MISMATCH");
  return { catalogVersion: V19_L1_CATALOG_VERSION, promptBundleVersion: V19_L1_PROMPT_BUNDLE_VERSION,
    schemaSetVersion: V19_L1_SCHEMA_SET_VERSION, stageTopologyVersion: "split-base-candidate-v1" as const,
    definitions: predecessor.definitions.map((definition) => {
      const prompt = prompts.find((item) => item.stageId === definition.stageId);
      if (!prompt) return definition;
      const developerPrompt = `${canonical(commonText)}\n\n${canonical(prompt.text)}`;
      return { ...definition, developerPrompt, promptVersion: prompt.version, promptHash: hash(developerPrompt) };
    }) };
}
