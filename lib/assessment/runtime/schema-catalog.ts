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

type RuntimeStageCatalogManifest = {
  schema_version: string;
  catalog_version: string;
  prompt_bundle_version: string;
  schema_set_version: string;
  baseline: string;
  hash_algorithm: string;
  common_prompt: {
    inherited_from: string;
    prompt_version: string;
    prompt_path: string;
    prompt_sha256: string;
  };
  stages: Array<{
    stage_id: M2StageId;
    sequence_number: number;
    source: string;
    prompt_version: string;
    prompt_path: string;
    prompt_sha256: string;
    schema_version: string;
    schema_name: string;
    schema_path: string;
    schema_pointer: string | null;
    schema_sha256: string;
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

export async function loadM2P4RuntimeStageCatalog() {
  const repositoryRoot = process.cwd();
  const runtimeManifest = (await readJson(
    path.join(
      repositoryRoot,
      "lib",
      "assessment",
      "runtime",
      "contracts",
      "runtime-stage-catalog-v2.json",
    ),
  )) as unknown as RuntimeStageCatalogManifest;
  if (
    runtimeManifest.schema_version !== "m2-p4-runtime-stage-catalog-v1" ||
    runtimeManifest.catalog_version !== "runtime-stage-catalog-v2.0.0" ||
    runtimeManifest.prompt_bundle_version !==
      "prompt-bundle-runtime-v2.0.0" ||
    runtimeManifest.schema_set_version !==
      "pipeline-schema-runtime-v2.0.0" ||
    runtimeManifest.baseline !==
      "554d2cb5a2f816ac82edf3cc247458fe34a4a74c" ||
    runtimeManifest.hash_algorithm !== "sha256-utf8-lf" ||
    !Array.isArray(runtimeManifest.stages) ||
    runtimeManifest.stages.length !== 6
  ) {
    throw new M2RuntimeError("M2_PROMPT_MANIFEST_INVALID");
  }

  const historicalManifest = (await readJson(
    path.join(repositoryRoot, "ai", "prompts", "prompt-bundle.manifest.json"),
  )) as unknown as PromptManifest;
  const historicalCommon = historicalManifest.assets.find(
    (asset) => asset.asset_id === "SHARED-COMMON",
  );
  const common = runtimeManifest.common_prompt;
  const historicalCommonReference = `${path.posix.join(
    "ai",
    "prompts",
    "prompt-bundle.manifest.json",
  )}#SHARED-COMMON`;
  if (
    !historicalCommon ||
    common.inherited_from !== historicalCommonReference ||
    common.prompt_version !== historicalCommon.asset_version ||
    common.prompt_path !==
      path.posix.join("ai", "prompts", historicalCommon.relative_path) ||
    common.prompt_sha256 !== historicalCommon.sha256
  ) {
    throw new M2RuntimeError("M2_PROMPT_MANIFEST_INVALID");
  }
  const commonPrompt = await readFile(
    path.join(
      /*turbopackIgnore: true*/ repositoryRoot,
      common.prompt_path,
    ),
    "utf8",
  );
  if (hashText(commonPrompt) !== common.prompt_sha256) {
    throw new M2RuntimeError("M2_PROMPT_HASH_MISMATCH");
  }

  const orderedStageIds: M2StageId[] = [
    "PB-01",
    "PB-02",
    "PB-03",
    "PB-04",
    "PB-05",
    "PB-06",
  ];
  const definitions: StageDefinition[] = [];
  for (const [index, stageId] of orderedStageIds.entries()) {
    const stage = runtimeManifest.stages[index];
    if (
      stage?.stage_id !== stageId ||
      stage.sequence_number !== index + 1 ||
      stage.schema_name !==
        (stageId === "PB-01" ? "pb_01_structure_v2" : stageSchemaNames[stageId])
    ) {
      throw new M2RuntimeError("M2_PROMPT_MANIFEST_INVALID");
    }

    if (stageId === "PB-01") {
      if (
        stage.source !== "m2-p4-runtime-successor" ||
        stage.prompt_version !== "v2.0.0" ||
        stage.prompt_path !==
          "lib/assessment/runtime/contracts/pb-01-structure-v2.developer.md" ||
        stage.schema_version !== "pipeline-schema-v2.0.0" ||
        stage.schema_path !==
          "lib/assessment/runtime/contracts/structured-intake-v2.schema.json" ||
        stage.schema_pointer !== null
      ) {
        throw new M2RuntimeError("M2_PROMPT_MANIFEST_INVALID");
      }
    } else {
      const historicalStage = historicalManifest.assets.find(
        (asset) => asset.asset_id === stageId,
      );
      if (
        !historicalStage?.output_schema_path ||
        stage.source !== "accepted-historical-manifest" ||
        stage.prompt_version !== historicalStage.asset_version ||
        stage.prompt_path !==
          path.posix.join("ai", "prompts", historicalStage.relative_path) ||
        stage.prompt_sha256 !== historicalStage.sha256 ||
        stage.schema_version !== "pipeline-schema-v1.0.0" ||
        stage.schema_path !== historicalStage.output_schema_path ||
        stage.schema_pointer !== historicalStage.output_schema_pointer
      ) {
        throw new M2RuntimeError("M2_PROMPT_MANIFEST_INVALID");
      }
    }

    const stagePrompt = await readFile(
      path.join(
        /*turbopackIgnore: true*/ repositoryRoot,
        stage.prompt_path,
      ),
      "utf8",
    );
    if (hashText(stagePrompt) !== stage.prompt_sha256) {
      throw new M2RuntimeError("M2_PROMPT_HASH_MISMATCH");
    }
    const schemaText = await readFile(
      path.join(
        /*turbopackIgnore: true*/ repositoryRoot,
        stage.schema_path,
      ),
      "utf8",
    );
    if (hashText(schemaText) !== stage.schema_sha256) {
      throw new M2RuntimeError("M2_SCHEMA_HASH_MISMATCH");
    }
    const rootSchema = JSON.parse(schemaText) as JsonObject;
    const outputSchema = selectPointerSchema(
      rootSchema,
      stage.schema_pointer,
    );
    const developerPrompt = `${canonicalText(commonPrompt)}\n\n${canonicalText(stagePrompt)}`;
    definitions.push({
      stageId,
      sequenceNumber: stage.sequence_number,
      promptVersion: stage.prompt_version,
      promptHash: hashText(developerPrompt),
      developerPrompt,
      schemaName: stage.schema_name,
      schemaVersion: stage.schema_version,
      schemaHash: hashJson(outputSchema),
      outputSchema,
    });
  }

  return {
    promptBundleVersion: runtimeManifest.prompt_bundle_version,
    schemaSetVersion: runtimeManifest.schema_set_version,
    definitions,
  };
}
