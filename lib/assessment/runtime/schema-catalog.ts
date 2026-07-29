import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { M2RuntimeError } from "./errors.ts";
import type {
  JsonObject,
  M2StageId,
  StageDefinition,
} from "./types.ts";

type PromptManifest = {
  bundle_version: string;
  assets: Array<{
    asset_id: string;
    asset_version: string;
    relative_path: string;
    sha256: string;
    output_schema_path: string | null;
    output_schema_pointer: string | null;
  }>;
};

const stageSchemaNames: Record<M2StageId, string> = {
  "PB-01": "pb_01_structure_v1",
  "PB-02": "pb_02_safety_semantic_v1",
  "PB-03": "pb_03_eligibility_v1",
  "PB-04": "pb_04_decision_plan_v1",
  "PB-05": "pb_05_report_writing_v1",
  "PB-06": "pb_06_semantic_validation_v1",
};

function canonicalText(value: string) {
  return value.replace(/\r\n/gu, "\n");
}

function hashText(value: string) {
  return createHash("sha256")
    .update(Buffer.from(canonicalText(value), "utf8"))
    .digest("hex");
}

function hashJson(value: JsonObject) {
  return createHash("sha256")
    .update(Buffer.from(JSON.stringify(value), "utf8"))
    .digest("hex");
}

async function readJson(filePath: string) {
  return JSON.parse(await readFile(filePath, "utf8")) as JsonObject;
}

function selectPointerSchema(rootSchema: JsonObject, pointer: string | null) {
  if (!pointer) return rootSchema;
  const segments = pointer
    .replace(/^#\//u, "")
    .split("/")
    .map((segment) => segment.replaceAll("~1", "/").replaceAll("~0", "~"));
  let selected: JsonValueLike = rootSchema;
  for (const segment of segments) {
    if (
      typeof selected !== "object" ||
      selected === null ||
      Array.isArray(selected) ||
      !(segment in selected)
    ) {
      throw new M2RuntimeError("M2_SCHEMA_POINTER_INVALID");
    }
    selected = selected[segment];
  }
  if (
    typeof selected !== "object" ||
    selected === null ||
    Array.isArray(selected)
  ) {
    throw new M2RuntimeError("M2_SCHEMA_POINTER_INVALID");
  }
  return {
    $schema: rootSchema.$schema,
    ...selected,
    $defs: rootSchema.$defs,
  } as JsonObject;
}

type JsonValueLike =
  | string
  | number
  | boolean
  | null
  | JsonValueLike[]
  | { [key: string]: JsonValueLike };

export async function loadCanonicalStageCatalog() {
  const repositoryRoot = process.cwd();
  const promptRoot = path.join(repositoryRoot, "ai", "prompts");
  const manifest = (await readJson(
    path.join(promptRoot, "prompt-bundle.manifest.json"),
  )) as unknown as PromptManifest;
  const commonAsset = manifest.assets.find(
    (asset) => asset.asset_id === "SHARED-COMMON",
  );
  if (!commonAsset) {
    throw new M2RuntimeError("M2_PROMPT_MANIFEST_INVALID");
  }

  const commonPrompt = await readFile(
    path.join(
      /*turbopackIgnore: true*/ process.cwd(),
      "ai",
      "prompts",
      commonAsset.relative_path,
    ),
    "utf8",
  );
  if (hashText(commonPrompt) !== commonAsset.sha256) {
    throw new M2RuntimeError("M2_PROMPT_HASH_MISMATCH");
  }

  const definitions: StageDefinition[] = [];
  for (const [index, stageId] of (
    ["PB-01", "PB-02", "PB-03", "PB-04", "PB-05", "PB-06"] as M2StageId[]
  ).entries()) {
    const asset = manifest.assets.find((entry) => entry.asset_id === stageId);
    if (!asset?.output_schema_path) {
      throw new M2RuntimeError("M2_PROMPT_MANIFEST_INVALID");
    }
    const stagePrompt = await readFile(
      path.join(
        /*turbopackIgnore: true*/ process.cwd(),
        "ai",
        "prompts",
        asset.relative_path,
      ),
      "utf8",
    );
    if (hashText(stagePrompt) !== asset.sha256) {
      throw new M2RuntimeError("M2_PROMPT_HASH_MISMATCH");
    }
    const developerPrompt = `${canonicalText(commonPrompt)}\n\n${canonicalText(stagePrompt)}`;
    const rootSchema = await readJson(
      path.join(
        /*turbopackIgnore: true*/ process.cwd(),
        asset.output_schema_path,
      ),
    );
    const outputSchema = selectPointerSchema(
      rootSchema,
      asset.output_schema_pointer,
    );
    definitions.push({
      stageId,
      sequenceNumber: index + 1,
      promptVersion: asset.asset_version,
      promptHash: hashText(developerPrompt),
      developerPrompt,
      schemaName: stageSchemaNames[stageId],
      schemaVersion: "pipeline-schema-v1.0.0",
      schemaHash: hashJson(outputSchema),
      outputSchema,
    });
  }

  return {
    promptBundleVersion: manifest.bundle_version,
    schemaSetVersion: "pipeline-schema-v1.0.0",
    definitions,
  };
}
