import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { isDeepStrictEqual } from "node:util";
import Ajv2020 from "ajv/dist/2020.js";
import { M2RuntimeError } from "./errors.ts";
import {
  assertOpenAIStructuredOutputSchema,
  toOpenAiStructuredOutputSchema,
} from "./openai-schema.ts";
import { loadV19L4StageCatalog } from "./v19-l4-stage-catalog.ts";
import {
  V19_L4_CATALOG_VERSION,
  V19_L4_PROMPT_BUNDLE_VERSION,
  V19_L4_SCHEMA_SET_VERSION,
} from "./v19-l4-runtime-identity.ts";
import {
  V19_L5_CATALOG_VERSION,
  V19_L5_PROMPT_BUNDLE_VERSION,
  V19_L5_SCHEMA_SET_VERSION,
  V19_L5_PB01_PROMPT_VERSION,
  V19_L5_PB04_PROMPT_VERSION,
  V19_L5_PB05_PROMPT_VERSION,
  V19_L5_PB06_PROMPT_VERSION,
  V19_L5_PB01_SCHEMA_VERSION,
  V19_L5_PB04_SCHEMA_VERSION,
  V19_L5_PB05_SCHEMA_VERSION,
  V19_L5_PB06_SCHEMA_VERSION,
} from "./v19-l5-runtime-identity.ts";
import type { JsonObject, JsonValue, M2StageId, StageDefinition } from "./types.ts";

type Manifest = {
  catalog_version: string;
  prompt_bundle_version: string;
  schema_set_version: string;
  baseline: string;
  common_prompt: { prompt_path: string; prompt_sha256: string };
  stages: Array<Record<string, string | number | null>>;
};

const prefix = "lib/assessment/runtime/contracts/";
const canonical = (value: string) => value.replace(/\r\n/gu, "\n");
const hash = (value: string) => createHash("sha256").update(canonical(value)).digest("hex");

const changedContracts = [
  {
    stageId: "PB-01",
    promptVersion: V19_L5_PB01_PROMPT_VERSION,
    promptFile: "pb-01-v19-l5-request-intent.developer.md",
    schemaFile: "base-intent-v19-l5.schema.json",
    schemaVersion: V19_L5_PB01_SCHEMA_VERSION,
    schemaName: "pb_01_v19_l5_base_intent_v1",
    legacyFile: "base-structured-intake-v2.schema.json",
    legacyDefinition: "legacy_base",
  },
  {
    stageId: "PB-04",
    promptVersion: V19_L5_PB04_PROMPT_VERSION,
    promptFile: "pb-04-v19-l5-intent-plan.developer.md",
    schemaFile: "plan-v19-l5.schema.json",
    schemaVersion: V19_L5_PB04_SCHEMA_VERSION,
    schemaName: "pb_04_v19_l5_plan_v1",
    legacyFile: "decision-plan-v2.schema.json",
    legacyDefinition: "legacy_decision_plan",
  },
  {
    stageId: "PB-05",
    promptVersion: V19_L5_PB05_PROMPT_VERSION,
    promptFile: "pb-05-v19-l5-intent-report.developer.md",
    schemaFile: "report-v19-l5.schema.json",
    schemaVersion: V19_L5_PB05_SCHEMA_VERSION,
    schemaName: "pb_05_v19_l5_report_v1",
    legacyFile: "report-content-v2.schema.json",
    legacyDefinition: "legacy_report_content",
  },
] as const;

// Rebase local references only; the embedded predecessor validation is unchanged.
function embeddedLegacy(schema: JsonObject, definition: string): JsonObject {
  const copy = JSON.parse(JSON.stringify(schema)) as JsonObject;
  delete copy.$schema;
  delete copy.$id;
  const visit = (value: JsonValue) => {
    if (value === null || typeof value !== "object") return;
    if (Array.isArray(value)) {
      value.forEach(visit);
      return;
    }
    for (const [key, child] of Object.entries(value)) {
      if (key === "$ref" && typeof child === "string" && child.startsWith("#/")) {
        value[key] = `#/$defs/${definition}${child.slice(1)}`;
      } else {
        visit(child);
      }
    }
  };
  visit(copy);
  return copy;
}

export async function loadV19L5StageCatalog() {
  const root = process.cwd();
  const read = (file: string) => readFile(path.join(/*turbopackIgnore: true*/ root, file), "utf8");
  const predecessor = await loadV19L4StageCatalog();
  const [oldText, candidateText] = await Promise.all([
    read(`${prefix}runtime-stage-catalog-v22.json`),
    read(`${prefix}runtime-stage-catalog-v23.json`),
  ]);
  const old = JSON.parse(oldText) as Manifest;
  const candidate = JSON.parse(candidateText) as Manifest;
  const [common, evaluator, ...contracts] = await Promise.all([
    read(old.common_prompt.prompt_path),
    read(`${prefix}pb-06-v19-l5-intent-evaluation.developer.md`),
    ...changedContracts.map(async definition => {
      const [prompt, schemaText, legacyText] = await Promise.all([
        read(`${prefix}${definition.promptFile}`),
        read(`${prefix}${definition.schemaFile}`),
        read(`${prefix}${definition.legacyFile}`),
      ]);
      const schema = JSON.parse(schemaText) as JsonObject;
      const expectedLegacy = embeddedLegacy(JSON.parse(legacyText) as JsonObject, definition.legacyDefinition);
      const definitions = schema.$defs as JsonObject | undefined;
      if (!isDeepStrictEqual(definitions?.[definition.legacyDefinition], expectedLegacy)) {
        throw new M2RuntimeError("M2_PROMPT_MANIFEST_INVALID");
      }
      return { ...definition, prompt, schemaText, schema };
    }),
  ]);

  const expected = {
    ...old,
    catalog_version: V19_L5_CATALOG_VERSION,
    prompt_bundle_version: V19_L5_PROMPT_BUNDLE_VERSION,
    schema_set_version: V19_L5_SCHEMA_SET_VERSION,
    baseline: "9d6212dc9f47b4c6afcb0af262bc047ca786182a",
    stages: old.stages.map(stage => {
      const definition = contracts.find(item => item.stageId === stage.stage_id);
      if (definition) return {
        ...stage,
        source: "guidance-quality-v19-l5-local-candidate",
        prompt_version: definition.promptVersion,
        prompt_path: `${prefix}${definition.promptFile}`,
        prompt_sha256: hash(definition.prompt),
        schema_version: definition.schemaVersion,
        schema_name: definition.schemaName,
        schema_path: `${prefix}${definition.schemaFile}`,
        schema_pointer: null,
        schema_sha256: hash(definition.schemaText),
      };
      if (stage.stage_id === "PB-06") return {
        ...stage,
        source: "guidance-quality-v19-l5-local-candidate",
        prompt_version: V19_L5_PB06_PROMPT_VERSION,
        prompt_path: `${prefix}pb-06-v19-l5-intent-evaluation.developer.md`,
        prompt_sha256: hash(evaluator),
      };
      return stage;
    }),
  };
  if (
    predecessor.catalogVersion !== V19_L4_CATALOG_VERSION ||
    predecessor.promptBundleVersion !== V19_L4_PROMPT_BUNDLE_VERSION ||
    predecessor.schemaSetVersion !== V19_L4_SCHEMA_SET_VERSION ||
    old.catalog_version !== predecessor.catalogVersion ||
    old.prompt_bundle_version !== predecessor.promptBundleVersion ||
    old.schema_set_version !== predecessor.schemaSetVersion ||
    !isDeepStrictEqual(candidate, expected)
  ) {
    throw new M2RuntimeError("M2_PROMPT_MANIFEST_INVALID");
  }
  if (hash(common) !== old.common_prompt.prompt_sha256) {
    throw new M2RuntimeError("M2_PROMPT_HASH_MISMATCH");
  }

  for (const { schema } of contracts) {
    new Ajv2020({ strict: false, validateFormats: false }).compile(schema);
    assertOpenAIStructuredOutputSchema(toOpenAiStructuredOutputSchema(schema));
  }
  const contract = (
    prompt: string,
    promptVersion: string,
    outputSchema: JsonObject,
    schemaName: string,
    schemaVersion: string,
  ) => {
    const developerPrompt = `${canonical(common)}\n\n${canonical(prompt)}`;
    return {
      developerPrompt, promptVersion, promptHash: hash(developerPrompt),
      outputSchema, schemaName, schemaVersion, schemaHash: hash(JSON.stringify(outputSchema)),
    };
  };
  const definitions: StageDefinition[] = predecessor.definitions.map(definition => {
    const replacement = contracts.find(item => item.stageId === definition.stageId);
    if (replacement) return {
      ...definition,
      ...contract(replacement.prompt, replacement.promptVersion, replacement.schema,
        replacement.schemaName, replacement.schemaVersion),
      // PB01 grounded/clarification and PB05 narrow repair remain exact L4 contracts.
    };
    if (definition.stageId === "PB-06") {
      if (definition.schemaVersion !== V19_L5_PB06_SCHEMA_VERSION) {
        throw new M2RuntimeError("M2_PROMPT_MANIFEST_INVALID");
      }
      return { ...definition, ...contract(evaluator, V19_L5_PB06_PROMPT_VERSION,
        definition.outputSchema, definition.schemaName, definition.schemaVersion) };
    }
    return definition;
  });

  // Validate inherited subsidiary identities as well as changed primary contracts.
  for (const stageId of ["PB-01", "PB-05", "PB-06"] as M2StageId[]) {
    const current = definitions.find(item => item.stageId === stageId);
    const prior = predecessor.definitions.find(item => item.stageId === stageId);
    if (!current || !prior) throw new M2RuntimeError("M2_PROMPT_MANIFEST_INVALID");
    if (stageId === "PB-01" && !isDeepStrictEqual(
      [current.groundedOutputSchema, current.groundedSchemaVersion, current.groundedSchemaHash,
        current.clarificationOutputSchema, current.clarificationSchemaVersion, current.clarificationSchemaHash],
      [prior.groundedOutputSchema, prior.groundedSchemaVersion, prior.groundedSchemaHash,
        prior.clarificationOutputSchema, prior.clarificationSchemaVersion, prior.clarificationSchemaHash],
    )) throw new M2RuntimeError("M2_PROMPT_MANIFEST_INVALID");
    if (stageId === "PB-05" && !isDeepStrictEqual(current.reportFactRepair, prior.reportFactRepair)) {
      throw new M2RuntimeError("M2_PROMPT_MANIFEST_INVALID");
    }
    if (stageId === "PB-06" && !isDeepStrictEqual(
      [current.outputSchema, current.schemaName, current.schemaVersion, current.schemaHash],
      [prior.outputSchema, prior.schemaName, prior.schemaVersion, prior.schemaHash],
    )) throw new M2RuntimeError("M2_PROMPT_MANIFEST_INVALID");
  }
  return {
    catalogVersion: V19_L5_CATALOG_VERSION,
    promptBundleVersion: V19_L5_PROMPT_BUNDLE_VERSION,
    schemaSetVersion: V19_L5_SCHEMA_SET_VERSION,
    stageTopologyVersion: "split-base-candidate-v1" as const,
    definitions,
  };
}
