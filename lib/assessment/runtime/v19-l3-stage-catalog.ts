import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { M2RuntimeError } from "./errors.ts";
import { loadV19L2StageCatalog } from "./v19-l2-stage-catalog.ts";
import {
  V19_L3_CATALOG_VERSION, V19_L3_PROMPT_BUNDLE_VERSION,
  V19_L3_SCHEMA_SET_VERSION, V19_L3_PB05_PROMPT_VERSION,
} from "./v19-l3-runtime-identity.ts";

type Manifest = {
  catalog_version: string; prompt_bundle_version: string; schema_set_version: string;
  baseline: string; common_prompt: { prompt_path: string; prompt_sha256: string };
  stages: Array<Record<string, string | number | null>>;
};
const canonical = (text: string) => text.replace(/\r\n/gu, "\n");
const hash = (text: string) => createHash("sha256").update(canonical(text)).digest("hex");
const contractRoot = "lib/assessment/runtime/contracts/";
const promptPath = `${contractRoot}pb-05-v19-l3-message-status.developer.md`;

// Explicit local selection only; reuse L2 executor, schemas, policy and PB06.
export async function loadV19L3StageCatalog() {
  const root = process.cwd();
  const read = (relative: string) => readFile(path.join(/*turbopackIgnore: true*/ root, relative), "utf8");
  const predecessor = await loadV19L2StageCatalog();
  const old = JSON.parse(await read(`${contractRoot}runtime-stage-catalog-v20.json`)) as Manifest;
  const candidate = JSON.parse(await read(`${contractRoot}runtime-stage-catalog-v21.json`)) as Manifest;
  const prompt = await read(promptPath);
  const expected = { ...old, catalog_version: V19_L3_CATALOG_VERSION,
    prompt_bundle_version: V19_L3_PROMPT_BUNDLE_VERSION, schema_set_version: V19_L3_SCHEMA_SET_VERSION,
    baseline: "64a1321477c5b76ed946ad8ecbe0dda888f9390f",
    stages: old.stages.map((stage) => stage.stage_id === "PB-05" ? {
      ...stage, source: "guidance-quality-v19-l3-local-candidate",
      prompt_version: V19_L3_PB05_PROMPT_VERSION, prompt_path: promptPath,
      prompt_sha256: hash(prompt),
    } : stage),
  };
  if (predecessor.catalogVersion !== old.catalog_version || JSON.stringify(candidate) !== JSON.stringify(expected)) {
    throw new M2RuntimeError("M2_PROMPT_MANIFEST_INVALID");
  }
  const common = await read(candidate.common_prompt.prompt_path);
  if (hash(common) !== candidate.common_prompt.prompt_sha256) throw new M2RuntimeError("M2_PROMPT_HASH_MISMATCH");
  return { catalogVersion: V19_L3_CATALOG_VERSION, promptBundleVersion: V19_L3_PROMPT_BUNDLE_VERSION,
    schemaSetVersion: V19_L3_SCHEMA_SET_VERSION, stageTopologyVersion: "split-base-candidate-v1" as const,
    definitions: predecessor.definitions.map((definition) => {
      if (definition.stageId !== "PB-05") return definition;
      const developerPrompt = `${canonical(common)}\n\n${canonical(prompt)}`;
      return { ...definition, developerPrompt, promptVersion: V19_L3_PB05_PROMPT_VERSION, promptHash: hash(developerPrompt) };
    }),
  };
}
