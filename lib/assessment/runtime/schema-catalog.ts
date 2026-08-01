import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import Ajv2020 from "ajv/dist/2020.js";
import { M2RuntimeError } from "./errors.ts";
import {
  assertOpenAIStructuredOutputSchema,
  toOpenAiStructuredOutputSchema,
} from "./openai-schema.ts";
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
    grounded_schema_version?: string;
    grounded_schema_path?: string;
    grounded_schema_sha256?: string;
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

export async function loadM2P4ContextualRuntimeStageCatalog() {
  const repositoryRoot = process.cwd();
  const runtimeManifest = (await readJson(
    path.join(
      repositoryRoot,
      "lib",
      "assessment",
      "runtime",
      "contracts",
      "runtime-stage-catalog-v3.json",
    ),
  )) as unknown as RuntimeStageCatalogManifest;
  if (
    runtimeManifest.schema_version !== "m2-p4-runtime-stage-catalog-v1" ||
    runtimeManifest.catalog_version !== "runtime-stage-catalog-v3.0.0" ||
    runtimeManifest.prompt_bundle_version !==
      "prompt-bundle-runtime-v3.0.0" ||
    runtimeManifest.schema_set_version !==
      "pipeline-schema-runtime-v3.0.0" ||
    runtimeManifest.baseline !==
      "c27120eea067f91c5e9ef4447e382f55a329e158" ||
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
  if (
    !historicalCommon ||
    common.inherited_from !==
      `${path.posix.join("ai", "prompts", "prompt-bundle.manifest.json")}#SHARED-COMMON` ||
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

  const expectedStages: Record<
    M2StageId,
    Omit<RuntimeStageCatalogManifest["stages"][number], "stage_id" | "sequence_number" | "prompt_sha256" | "schema_sha256">
  > = {
    "PB-01": {
      source: "m2-p4-contextual-successor",
      prompt_version: "v3.0.0",
      prompt_path:
        "lib/assessment/runtime/contracts/pb-01-structure-v3.developer.md",
      schema_version: "pipeline-schema-v3.0.0",
      schema_name: "pb_01_structure_v3",
      schema_path:
        "lib/assessment/runtime/contracts/structured-intake-v3.schema.json",
      schema_pointer: null,
    },
    "PB-02": {
      source: "accepted-historical-manifest",
      prompt_version: "v1.0.0",
      prompt_path: path.posix.join(
        "ai",
        "prompts",
        "safety-semantic",
        "v1.0.0.developer.md",
      ),
      schema_version: "pipeline-schema-v1.0.0",
      schema_name: "pb_02_safety_semantic_v1",
      schema_path: path.posix.join(
        "ai",
        "schemas",
        "safety-assessment.schema.json",
      ),
      schema_pointer: "#/$defs/model_result",
    },
    "PB-03": {
      source: "m2-p4-contextual-successor",
      prompt_version: "v3.0.0",
      prompt_path:
        "lib/assessment/runtime/contracts/pb-03-projection-v3.developer.md",
      schema_version: "pipeline-schema-v3.0.0",
      schema_name: "pb_03_eligibility_projection_v3",
      schema_path:
        "lib/assessment/runtime/contracts/eligibility-projection-v3.schema.json",
      schema_pointer: null,
    },
    "PB-04": {
      source: "m2-p4-contextual-successor",
      prompt_version: "v2.0.0",
      prompt_path:
        "lib/assessment/runtime/contracts/pb-04-decision-plan-v2.developer.md",
      schema_version: "pipeline-schema-v1.0.0",
      schema_name: "pb_04_decision_plan_v1",
      schema_path: path.posix.join(
        "ai",
        "schemas",
        "decision-plan.schema.json",
      ),
      schema_pointer: null,
    },
    "PB-05": {
      source: "m2-p4-contextual-successor",
      prompt_version: "v2.0.0",
      prompt_path:
        "lib/assessment/runtime/contracts/pb-05-report-writer-v2.developer.md",
      schema_version: "pipeline-schema-v1.0.0",
      schema_name: "pb_05_report_writing_v1",
      schema_path: path.posix.join(
        "ai",
        "schemas",
        "report-content.schema.json",
      ),
      schema_pointer: null,
    },
    "PB-06": {
      source: "accepted-historical-manifest",
      prompt_version: "v1.0.0",
      prompt_path: path.posix.join(
        "ai",
        "prompts",
        "semantic-validator",
        "v1.0.0.developer.md",
      ),
      schema_version: "pipeline-schema-v1.0.0",
      schema_name: "pb_06_semantic_validation_v1",
      schema_path: path.posix.join(
        "ai",
        "schemas",
        "validation-result.schema.json",
      ),
      schema_pointer: null,
    },
  };

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
    const expected = expectedStages[stageId];
    if (
      !stage ||
      stage.stage_id !== stageId ||
      stage.sequence_number !== index + 1 ||
      stage.source !== expected.source ||
      stage.prompt_version !== expected.prompt_version ||
      stage.prompt_path !== expected.prompt_path ||
      stage.schema_version !== expected.schema_version ||
      stage.schema_name !== expected.schema_name ||
      stage.schema_path !== expected.schema_path ||
      stage.schema_pointer !== expected.schema_pointer
    ) {
      throw new M2RuntimeError("M2_PROMPT_MANIFEST_INVALID");
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
    definitions.push({
      stageId,
      sequenceNumber: stage.sequence_number,
      promptVersion: stage.prompt_version,
      promptHash: hashText(
        `${canonicalText(commonPrompt)}\n\n${canonicalText(stagePrompt)}`,
      ),
      developerPrompt: `${canonicalText(commonPrompt)}\n\n${canonicalText(stagePrompt)}`,
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

export async function loadM2P4ProductQualityRuntimeStageCatalog() {
  const repositoryRoot = process.cwd();
  const runtimeManifest = (await readJson(
    path.join(
      repositoryRoot,
      "lib",
      "assessment",
      "runtime",
      "contracts",
      "runtime-stage-catalog-v4.json",
    ),
  )) as unknown as RuntimeStageCatalogManifest;
  if (
    runtimeManifest.schema_version !== "m2-p4-runtime-stage-catalog-v1" ||
    runtimeManifest.catalog_version !== "runtime-stage-catalog-v4.0.0" ||
    runtimeManifest.prompt_bundle_version !==
      "prompt-bundle-runtime-v4.0.0" ||
    runtimeManifest.schema_set_version !==
      "pipeline-schema-runtime-v3.0.0" ||
    runtimeManifest.baseline !==
      "61e33a10e195fad17e253a6b9719217e1992f273" ||
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
  if (
    !historicalCommon ||
    common.inherited_from !==
      `${path.posix.join("ai", "prompts", "prompt-bundle.manifest.json")}#SHARED-COMMON` ||
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

  const expectedStages: Record<
    M2StageId,
    Omit<
      RuntimeStageCatalogManifest["stages"][number],
      "stage_id" | "sequence_number" | "prompt_sha256" | "schema_sha256"
    >
  > = {
    "PB-01": {
      source: "m2-p4-contextual-successor",
      prompt_version: "v3.0.0",
      prompt_path:
        "lib/assessment/runtime/contracts/pb-01-structure-v3.developer.md",
      schema_version: "pipeline-schema-v3.0.0",
      schema_name: "pb_01_structure_v3",
      schema_path:
        "lib/assessment/runtime/contracts/structured-intake-v3.schema.json",
      schema_pointer: null,
    },
    "PB-02": {
      source: "accepted-historical-manifest",
      prompt_version: "v1.0.0",
      prompt_path: path.posix.join(
        "ai",
        "prompts",
        "safety-semantic",
        "v1.0.0.developer.md",
      ),
      schema_version: "pipeline-schema-v1.0.0",
      schema_name: "pb_02_safety_semantic_v1",
      schema_path: path.posix.join(
        "ai",
        "schemas",
        "safety-assessment.schema.json",
      ),
      schema_pointer: "#/$defs/model_result",
    },
    "PB-03": {
      source: "m2-p4-contextual-successor",
      prompt_version: "v3.0.0",
      prompt_path:
        "lib/assessment/runtime/contracts/pb-03-projection-v3.developer.md",
      schema_version: "pipeline-schema-v3.0.0",
      schema_name: "pb_03_eligibility_projection_v3",
      schema_path:
        "lib/assessment/runtime/contracts/eligibility-projection-v3.schema.json",
      schema_pointer: null,
    },
    "PB-04": {
      source: "m2-p4-product-quality-successor",
      prompt_version: "v3.0.0",
      prompt_path:
        "lib/assessment/runtime/contracts/pb-04-decision-plan-v3.developer.md",
      schema_version: "pipeline-schema-v1.0.0",
      schema_name: "pb_04_decision_plan_v1",
      schema_path: path.posix.join(
        "ai",
        "schemas",
        "decision-plan.schema.json",
      ),
      schema_pointer: null,
    },
    "PB-05": {
      source: "m2-p4-product-quality-successor",
      prompt_version: "v3.0.0",
      prompt_path:
        "lib/assessment/runtime/contracts/pb-05-report-writer-v3.developer.md",
      schema_version: "pipeline-schema-v1.0.0",
      schema_name: "pb_05_report_writing_v1",
      schema_path: path.posix.join(
        "ai",
        "schemas",
        "report-content.schema.json",
      ),
      schema_pointer: null,
    },
    "PB-06": {
      source: "m2-p4-product-quality-successor",
      prompt_version: "v2.0.0",
      prompt_path:
        "lib/assessment/runtime/contracts/pb-06-semantic-validator-v2.developer.md",
      schema_version: "pipeline-schema-v1.0.0",
      schema_name: "pb_06_semantic_validation_v1",
      schema_path: path.posix.join(
        "ai",
        "schemas",
        "validation-result.schema.json",
      ),
      schema_pointer: null,
    },
  };

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
    const expected = expectedStages[stageId];
    if (
      !stage ||
      stage.stage_id !== stageId ||
      stage.sequence_number !== index + 1 ||
      stage.source !== expected.source ||
      stage.prompt_version !== expected.prompt_version ||
      stage.prompt_path !== expected.prompt_path ||
      stage.schema_version !== expected.schema_version ||
      stage.schema_name !== expected.schema_name ||
      stage.schema_path !== expected.schema_path ||
      stage.schema_pointer !== expected.schema_pointer
    ) {
      throw new M2RuntimeError("M2_PROMPT_MANIFEST_INVALID");
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

export async function loadM2P4WritingContextRuntimeStageCatalog() {
  const repositoryRoot = process.cwd();
  const contractsRoot = path.join(
    repositoryRoot,
    "lib",
    "assessment",
    "runtime",
    "contracts",
  );
  const runtimeManifest = (await readJson(
    path.join(contractsRoot, "runtime-stage-catalog-v5.json"),
  )) as unknown as RuntimeStageCatalogManifest;
  const activeManifest = (await readJson(
    path.join(contractsRoot, "runtime-stage-catalog-v4.json"),
  )) as unknown as RuntimeStageCatalogManifest;
  if (
    runtimeManifest.schema_version !== "m2-p4-runtime-stage-catalog-v1" ||
    runtimeManifest.catalog_version !== "runtime-stage-catalog-v5.0.0" ||
    runtimeManifest.prompt_bundle_version !==
      "prompt-bundle-runtime-v5.0.0" ||
    runtimeManifest.schema_set_version !==
      "pipeline-schema-runtime-v3.1.0" ||
    runtimeManifest.baseline !==
      "2381312ced5fc726dfa245632c25da6bb68a376f" ||
    runtimeManifest.hash_algorithm !== "sha256-utf8-lf" ||
    !Array.isArray(runtimeManifest.stages) ||
    runtimeManifest.stages.length !== 6 ||
    !Array.isArray(activeManifest.stages) ||
    activeManifest.stages.length !== 6
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
  if (
    !historicalCommon ||
    common.inherited_from !==
      `${path.posix.join("ai", "prompts", "prompt-bundle.manifest.json")}#SHARED-COMMON` ||
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

  const pb01 = runtimeManifest.stages[0];
  if (
    pb01?.stage_id !== "PB-01" ||
    pb01.sequence_number !== 1 ||
    pb01.source !== "m2-p4-writing-context-successor" ||
    pb01.prompt_version !== "v4.0.0" ||
    pb01.prompt_path !==
      "lib/assessment/runtime/contracts/pb-01-structure-v4.developer.md" ||
    pb01.schema_version !== "pipeline-schema-v4.0.0" ||
    pb01.schema_name !== "pb_01_structure_v4" ||
    pb01.schema_path !==
      "lib/assessment/runtime/contracts/structured-intake-v4.schema.json" ||
    pb01.schema_pointer !== null
  ) {
    throw new M2RuntimeError("M2_PROMPT_MANIFEST_INVALID");
  }
  for (let index = 1; index < 6; index += 1) {
    if (
      JSON.stringify(runtimeManifest.stages[index]) !==
      JSON.stringify(activeManifest.stages[index])
    ) {
      throw new M2RuntimeError("M2_PROMPT_MANIFEST_INVALID");
    }
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
      !stage ||
      stage.stage_id !== stageId ||
      stage.sequence_number !== index + 1
    ) {
      throw new M2RuntimeError("M2_PROMPT_MANIFEST_INVALID");
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
    const outputSchema = selectPointerSchema(rootSchema, stage.schema_pointer);
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

export async function loadM2P4GroundingResponsibilityRuntimeStageCatalog() {
  const repositoryRoot = process.cwd();
  const contractsRoot = path.join(
    repositoryRoot,
    "lib",
    "assessment",
    "runtime",
    "contracts",
  );
  const runtimeManifest = (await readJson(
    path.join(contractsRoot, "runtime-stage-catalog-v6.json"),
  )) as unknown as RuntimeStageCatalogManifest;
  const predecessorManifest = (await readJson(
    path.join(contractsRoot, "runtime-stage-catalog-v5.json"),
  )) as unknown as RuntimeStageCatalogManifest;
  if (
    runtimeManifest.schema_version !== "m2-p4-runtime-stage-catalog-v1" ||
    runtimeManifest.catalog_version !== "runtime-stage-catalog-v6.0.0" ||
    runtimeManifest.prompt_bundle_version !==
      "prompt-bundle-runtime-v6.0.0" ||
    runtimeManifest.schema_set_version !==
      "pipeline-schema-runtime-v3.2.0" ||
    runtimeManifest.baseline !==
      "bdc98af2c7c59a1d7ececa2077906c8fbb839ac9" ||
    runtimeManifest.hash_algorithm !== "sha256-utf8-lf" ||
    !Array.isArray(runtimeManifest.stages) ||
    runtimeManifest.stages.length !== 6 ||
    !Array.isArray(predecessorManifest.stages) ||
    predecessorManifest.stages.length !== 6
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
  if (
    !historicalCommon ||
    common.inherited_from !==
      `${path.posix.join("ai", "prompts", "prompt-bundle.manifest.json")}#SHARED-COMMON` ||
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

  const pb01 = runtimeManifest.stages[0];
  if (
    pb01?.stage_id !== "PB-01" ||
    pb01.sequence_number !== 1 ||
    pb01.source !== "m2-p4-grounding-responsibility-successor" ||
    pb01.prompt_version !== "v5.0.0" ||
    pb01.prompt_path !==
      "lib/assessment/runtime/contracts/pb-01-structure-v5.developer.md" ||
    pb01.schema_version !== "pipeline-schema-v5.0.0" ||
    pb01.schema_name !== "pb_01_structure_v5" ||
    pb01.schema_path !==
      "lib/assessment/runtime/contracts/structured-intake-v5.schema.json" ||
    pb01.schema_pointer !== null ||
    pb01.grounded_schema_version !== "pipeline-schema-v4.0.0" ||
    pb01.grounded_schema_path !==
      "lib/assessment/runtime/contracts/structured-intake-v4.schema.json" ||
    typeof pb01.grounded_schema_sha256 !== "string"
  ) {
    throw new M2RuntimeError("M2_PROMPT_MANIFEST_INVALID");
  }
  for (let index = 1; index < 6; index += 1) {
    if (
      JSON.stringify(runtimeManifest.stages[index]) !==
      JSON.stringify(predecessorManifest.stages[index])
    ) {
      throw new M2RuntimeError("M2_PROMPT_MANIFEST_INVALID");
    }
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
      !stage ||
      stage.stage_id !== stageId ||
      stage.sequence_number !== index + 1
    ) {
      throw new M2RuntimeError("M2_PROMPT_MANIFEST_INVALID");
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
    const outputSchema = selectPointerSchema(rootSchema, stage.schema_pointer);
    const developerPrompt = `${canonicalText(commonPrompt)}\n\n${canonicalText(stagePrompt)}`;
    const definition: StageDefinition = {
      stageId,
      sequenceNumber: stage.sequence_number,
      promptVersion: stage.prompt_version,
      promptHash: hashText(developerPrompt),
      developerPrompt,
      schemaName: stage.schema_name,
      schemaVersion: stage.schema_version,
      schemaHash: hashJson(outputSchema),
      outputSchema,
    };
    if (stageId === "PB-01") {
      const groundedSchemaText = await readFile(
        path.join(
          /*turbopackIgnore: true*/ repositoryRoot,
          stage.grounded_schema_path as string,
        ),
        "utf8",
      );
      if (hashText(groundedSchemaText) !== stage.grounded_schema_sha256) {
        throw new M2RuntimeError("M2_SCHEMA_HASH_MISMATCH");
      }
      const groundedOutputSchema = JSON.parse(
        groundedSchemaText,
      ) as JsonObject;
      new Ajv2020({
        allErrors: true,
        strict: false,
        validateFormats: false,
      }).compile(groundedOutputSchema);
      const providerProjection = toOpenAiStructuredOutputSchema(outputSchema);
      assertOpenAIStructuredOutputSchema(providerProjection);
      definition.groundedOutputSchema = groundedOutputSchema;
      definition.groundedSchemaVersion = stage.grounded_schema_version;
      definition.groundedSchemaHash = hashJson(groundedOutputSchema);
    }
    definitions.push(definition);
  }

  return {
    promptBundleVersion: runtimeManifest.prompt_bundle_version,
    schemaSetVersion: runtimeManifest.schema_set_version,
    definitions,
  };
}

export async function loadM2P4SemanticConsistencyRuntimeStageCatalog() {
  const repositoryRoot = process.cwd();
  const contractsRoot = path.join(
    repositoryRoot,
    "lib",
    "assessment",
    "runtime",
    "contracts",
  );
  const runtimeManifest = (await readJson(
    path.join(contractsRoot, "runtime-stage-catalog-v7.json"),
  )) as unknown as RuntimeStageCatalogManifest;
  const predecessorManifest = (await readJson(
    path.join(contractsRoot, "runtime-stage-catalog-v6.json"),
  )) as unknown as RuntimeStageCatalogManifest;

  if (
    runtimeManifest.schema_version !== "m2-p4-runtime-stage-catalog-v1" ||
    runtimeManifest.catalog_version !== "runtime-stage-catalog-v7.0.0" ||
    runtimeManifest.prompt_bundle_version !==
      "prompt-bundle-runtime-v7.0.0" ||
    runtimeManifest.schema_set_version !==
      "pipeline-schema-runtime-v3.2.0" ||
    runtimeManifest.baseline !==
      "2c3f9e8a4b1c763a2d7d56d367cf16dc4993aca6" ||
    runtimeManifest.hash_algorithm !== "sha256-utf8-lf" ||
    !Array.isArray(runtimeManifest.stages) ||
    runtimeManifest.stages.length !== 6 ||
    !Array.isArray(predecessorManifest.stages) ||
    predecessorManifest.stages.length !== 6 ||
    JSON.stringify(runtimeManifest.common_prompt) !==
      JSON.stringify(predecessorManifest.common_prompt)
  ) {
    throw new M2RuntimeError("M2_PROMPT_MANIFEST_INVALID");
  }

  const pb01 = runtimeManifest.stages[0];
  const predecessorPb01 = predecessorManifest.stages[0];
  if (
    pb01?.stage_id !== "PB-01" ||
    pb01.sequence_number !== 1 ||
    pb01.source !== "m2-p4-semantic-consistency-successor" ||
    pb01.prompt_version !== "v6.0.0" ||
    pb01.prompt_path !==
      "lib/assessment/runtime/contracts/pb-01-structure-v6.developer.md" ||
    pb01.schema_version !== "pipeline-schema-v5.0.0" ||
    pb01.schema_name !== "pb_01_structure_v5" ||
    pb01.schema_path !==
      "lib/assessment/runtime/contracts/structured-intake-v5.schema.json" ||
    pb01.schema_pointer !== null ||
    pb01.grounded_schema_version !== "pipeline-schema-v4.0.0" ||
    pb01.grounded_schema_path !==
      "lib/assessment/runtime/contracts/structured-intake-v4.schema.json" ||
    typeof pb01.grounded_schema_sha256 !== "string" ||
    !predecessorPb01 ||
    pb01.schema_version !== predecessorPb01.schema_version ||
    pb01.schema_name !== predecessorPb01.schema_name ||
    pb01.schema_path !== predecessorPb01.schema_path ||
    pb01.schema_pointer !== predecessorPb01.schema_pointer ||
    pb01.schema_sha256 !== predecessorPb01.schema_sha256 ||
    pb01.grounded_schema_version !== predecessorPb01.grounded_schema_version ||
    pb01.grounded_schema_path !== predecessorPb01.grounded_schema_path ||
    pb01.grounded_schema_sha256 !== predecessorPb01.grounded_schema_sha256
  ) {
    throw new M2RuntimeError("M2_PROMPT_MANIFEST_INVALID");
  }
  for (let index = 1; index < 6; index += 1) {
    if (
      JSON.stringify(runtimeManifest.stages[index]) !==
      JSON.stringify(predecessorManifest.stages[index])
    ) {
      throw new M2RuntimeError("M2_PROMPT_MANIFEST_INVALID");
    }
  }

  const commonPrompt = await readFile(
    path.join(
      /*turbopackIgnore: true*/ repositoryRoot,
      runtimeManifest.common_prompt.prompt_path,
    ),
    "utf8",
  );
  if (hashText(commonPrompt) !== runtimeManifest.common_prompt.prompt_sha256) {
    throw new M2RuntimeError("M2_PROMPT_HASH_MISMATCH");
  }
  const pb01Prompt = await readFile(
    path.join(/*turbopackIgnore: true*/ repositoryRoot, pb01.prompt_path),
    "utf8",
  );
  if (hashText(pb01Prompt) !== pb01.prompt_sha256) {
    throw new M2RuntimeError("M2_PROMPT_HASH_MISMATCH");
  }

  const predecessor =
    await loadM2P4GroundingResponsibilityRuntimeStageCatalog();
  const developerPrompt = `${canonicalText(commonPrompt)}\n\n${canonicalText(pb01Prompt)}`;
  const definitions = predecessor.definitions.map((definition) =>
    definition.stageId === "PB-01"
      ? {
          ...definition,
          promptVersion: pb01.prompt_version,
          promptHash: hashText(developerPrompt),
          developerPrompt,
        }
      : { ...definition },
  );

  return {
    promptBundleVersion: runtimeManifest.prompt_bundle_version,
    schemaSetVersion: runtimeManifest.schema_set_version,
    definitions,
  };
}
