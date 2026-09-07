import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import Ajv2020 from "ajv/dist/2020.js";
import { M2RuntimeError } from "./errors.ts";
import { assertOpenAIStructuredOutputSchema, toOpenAiStructuredOutputSchema } from "./openai-schema.ts";
import { loadV19L3StageCatalog } from "./v19-l3-stage-catalog.ts";
import {
  V19_L4_CATALOG_VERSION, V19_L4_PROMPT_BUNDLE_VERSION, V19_L4_SCHEMA_SET_VERSION,
  V19_L4_PB05_PROMPT_VERSION, V19_L4_PB06_PROMPT_VERSION, V19_L4_PB06_SCHEMA_VERSION,
} from "./v19-l4-runtime-identity.ts";
import type { JsonObject, StageDefinition } from "./types.ts";

type Manifest = {
  catalog_version: string; prompt_bundle_version: string; schema_set_version: string;
  baseline: string; common_prompt: { prompt_path: string; prompt_sha256: string };
  stages: Array<Record<string, string | number | null>>;
};
const canonical = (value: string) => value.replace(/\r\n/gu, "\n");
const hash = (value: string) => createHash("sha256").update(canonical(value)).digest("hex");
const prefix = "lib/assessment/runtime/contracts/";

// Reuse the seven-stage executor and its one repair allowance. A patch contract
// is carried by PB05, like the existing PB01 clarification contract.
export async function loadV19L4StageCatalog() {
  const root = process.cwd();
  const read = (file: string) => readFile(path.join(/*turbopackIgnore: true*/ root, file), "utf8");
  const predecessor = await loadV19L3StageCatalog();
  const old = JSON.parse(await read(`${prefix}runtime-stage-catalog-v21.json`)) as Manifest;
  const candidate = JSON.parse(await read(`${prefix}runtime-stage-catalog-v22.json`)) as Manifest;
  const [common, report, repair, evaluator, repairSchemaText, evaluatorSchemaText] = await Promise.all([
    read(old.common_prompt.prompt_path),
    read(`${prefix}pb-05-v19-l4-fact-precision.developer.md`),
    read(`${prefix}pb-05-v19-l4-fact-repair.developer.md`),
    read(`${prefix}pb-06-v19-l4-post-repair.developer.md`),
    read(`${prefix}report-fact-repair-v1.schema.json`),
    read(`${prefix}validation-result-v19-l4.schema.json`),
  ]);
  const expected = {
    ...old,
    catalog_version: V19_L4_CATALOG_VERSION,
    prompt_bundle_version: V19_L4_PROMPT_BUNDLE_VERSION,
    schema_set_version: V19_L4_SCHEMA_SET_VERSION,
    baseline: "1b24003d545d16d0102828a3577444d994520f42",
    stages: old.stages.map(stage => stage.stage_id === "PB-05" ? {
      ...stage, source: "guidance-quality-v19-l4-local-candidate",
      prompt_version: V19_L4_PB05_PROMPT_VERSION,
      prompt_path: `${prefix}pb-05-v19-l4-fact-precision.developer.md`, prompt_sha256: hash(report),
      fact_repair_prompt_version: "v1.0.0",
      fact_repair_prompt_path: `${prefix}pb-05-v19-l4-fact-repair.developer.md`, fact_repair_prompt_sha256: hash(repair),
      fact_repair_schema_version: "report-fact-repair-v1", fact_repair_schema_name: "pb_05_report_fact_repair_v1",
      fact_repair_schema_path: `${prefix}report-fact-repair-v1.schema.json`, fact_repair_schema_sha256: hash(repairSchemaText),
    } : stage.stage_id === "PB-06" ? {
      ...stage, source: "guidance-quality-v19-l4-local-candidate",
      prompt_version: V19_L4_PB06_PROMPT_VERSION,
      prompt_path: `${prefix}pb-06-v19-l4-post-repair.developer.md`, prompt_sha256: hash(evaluator),
      schema_version: V19_L4_PB06_SCHEMA_VERSION, schema_name: "pb_06_post_repair_v1",
      schema_path: `${prefix}validation-result-v19-l4.schema.json`, schema_sha256: hash(evaluatorSchemaText),
    } : stage),
  };
  if (predecessor.catalogVersion !== old.catalog_version || JSON.stringify(candidate) !== JSON.stringify(expected)) {
    throw new M2RuntimeError("M2_PROMPT_MANIFEST_INVALID");
  }
  if (hash(common) !== old.common_prompt.prompt_sha256) throw new M2RuntimeError("M2_PROMPT_HASH_MISMATCH");
  const repairSchema = JSON.parse(repairSchemaText) as JsonObject;
  const evaluatorSchema = JSON.parse(evaluatorSchemaText) as JsonObject;
  for (const schema of [repairSchema, evaluatorSchema]) {
    new Ajv2020({ strict: false, validateFormats: false }).compile(schema);
    assertOpenAIStructuredOutputSchema(toOpenAiStructuredOutputSchema(schema));
  }
  const contract = (text: string, promptVersion: string, schema: JsonObject, schemaName: string, schemaVersion: string) => {
    const developerPrompt = `${canonical(common)}\n\n${canonical(text)}`;
    return { developerPrompt, promptVersion, promptHash: hash(developerPrompt), outputSchema: schema,
      schemaName, schemaVersion, schemaHash: hash(JSON.stringify(schema)) };
  };
  const definitions: StageDefinition[] = predecessor.definitions.map(definition => {
    if (definition.stageId === "PB-05") return {
      ...definition,
      ...contract(report, V19_L4_PB05_PROMPT_VERSION, definition.outputSchema, definition.schemaName, definition.schemaVersion),
      reportFactRepair: contract(repair, "v1.0.0", repairSchema, "pb_05_report_fact_repair_v1", "report-fact-repair-v1"),
    };
    if (definition.stageId === "PB-06") return { ...definition,
      ...contract(evaluator, V19_L4_PB06_PROMPT_VERSION, evaluatorSchema, "pb_06_post_repair_v1", V19_L4_PB06_SCHEMA_VERSION) };
    return definition;
  });
  return { catalogVersion: V19_L4_CATALOG_VERSION, promptBundleVersion: V19_L4_PROMPT_BUNDLE_VERSION,
    schemaSetVersion: V19_L4_SCHEMA_SET_VERSION, stageTopologyVersion: "split-base-candidate-v1" as const, definitions };
}
