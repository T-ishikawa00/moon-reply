import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const moduleDirectory = path.dirname(fileURLToPath(import.meta.url));
export const repositoryRoot = path.resolve(moduleDirectory, "..", "..");

export const B1B1 = Object.freeze({
  taskId: "M2-P2-B1-B1",
  mode: "network_blocked_provider_adapter_test",
  cliMode: "network-blocked",
  caseId: "WAIT-003",
  model: "gpt-5.6-luna",
  endpointPath: "/v1/responses",
  confirmation: "MOON_REPLY_B1_B1_NETWORK_DISABLED",
  b0ContractHash:
    "c3dfdc5ec6cb503a8d91ed4080c8734c9af9c7bf944e1bb6b5798536bb6c38e2",
  staticHardCapUsd: 0.213223,
  preflightCeilingUsd: 0.3,
  futureHumanCeilingUsd: 1,
  stageIds: ["PB-01", "PB-02", "PB-03", "PB-04", "PB-05", "PB-06"],
  stageCaps: Object.freeze({
    "PB-01": 4000,
    "PB-02": 800,
    "PB-03": 700,
    "PB-04": 4500,
    "PB-05": 8000,
    "PB-06": 2500,
  }),
});

const authorizationHeaderName = ["Author", "ization"].join("");
const requestProfilePath =
  "evals/calibration/b1b1/request-profile-v1.json";

export function absolute(relativePath) {
  return path.join(repositoryRoot, ...relativePath.split("/"));
}

export function canonicalText(relativePath) {
  return readFileSync(absolute(relativePath), "utf8").replaceAll("\r\n", "\n");
}

export function readJson(relativePath) {
  return JSON.parse(canonicalText(relativePath));
}

export function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

export function canonicalTextHash(relativePath) {
  return sha256(Buffer.from(canonicalText(relativePath), "utf8"));
}

export function compactHash(value) {
  return sha256(Buffer.from(JSON.stringify(value), "utf8"));
}

export function resolveJsonPointer(document, pointer) {
  if (pointer === null) return document;
  if (typeof pointer !== "string" || !pointer.startsWith("#/")) return undefined;
  let current = document;
  for (const encoded of pointer.slice(2).split("/")) {
    const key = encoded.replaceAll("~1", "/").replaceAll("~0", "~");
    if (!current || typeof current !== "object" || !Object.hasOwn(current, key)) {
      return undefined;
    }
    current = current[key];
  }
  return current;
}

function sameValue(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function typeMatches(value, type) {
  if (type === "null") return value === null;
  if (type === "array") return Array.isArray(value);
  if (type === "object") {
    return value !== null && typeof value === "object" && !Array.isArray(value);
  }
  if (type === "integer") return Number.isInteger(value);
  if (type === "number") return typeof value === "number" && Number.isFinite(value);
  return typeof value === type;
}

export function validateJsonSchema(
  value,
  schema,
  rootSchema = schema,
  pathName = "$",
) {
  const validate = (item, rule, itemPath) => {
    if (rule === true || rule === undefined) return [];
    if (rule === false) return [`${itemPath}: schema is false`];
    if (rule.$ref) {
      const resolved = resolveJsonPointer(rootSchema, rule.$ref);
      return resolved
        ? validate(item, resolved, itemPath)
        : [`${itemPath}: unresolved ref ${rule.$ref}`];
    }
    const errors = [];
    if (Object.hasOwn(rule, "const") && !sameValue(item, rule.const)) {
      errors.push(`${itemPath}: const mismatch`);
    }
    if (
      Array.isArray(rule.enum) &&
      !rule.enum.some((candidate) => sameValue(item, candidate))
    ) {
      errors.push(`${itemPath}: enum mismatch`);
    }
    if (rule.type) {
      const types = Array.isArray(rule.type) ? rule.type : [rule.type];
      if (!types.some((type) => typeMatches(item, type))) {
        errors.push(`${itemPath}: expected ${types.join("|")}`);
        return errors;
      }
    }
    if (Array.isArray(rule.allOf)) {
      for (const branch of rule.allOf) errors.push(...validate(item, branch, itemPath));
    }
    if (Array.isArray(rule.anyOf)) {
      if (!rule.anyOf.some((branch) => validate(item, branch, itemPath).length === 0)) {
        errors.push(`${itemPath}: anyOf matched 0`);
      }
    }
    if (Array.isArray(rule.oneOf)) {
      const passing = rule.oneOf.filter(
        (branch) => validate(item, branch, itemPath).length === 0,
      ).length;
      if (passing !== 1) errors.push(`${itemPath}: oneOf matched ${passing}`);
    }
    if (rule.if) {
      const selected =
        validate(item, rule.if, itemPath).length === 0 ? rule.then : rule.else;
      if (selected) errors.push(...validate(item, selected, itemPath));
    }
    if (typeof item === "string") {
      if (rule.minLength !== undefined && item.length < rule.minLength) {
        errors.push(`${itemPath}: shorter than minLength`);
      }
      if (rule.maxLength !== undefined && item.length > rule.maxLength) {
        errors.push(`${itemPath}: longer than maxLength`);
      }
      if (rule.pattern && !new RegExp(rule.pattern, "u").test(item)) {
        errors.push(`${itemPath}: pattern mismatch`);
      }
    }
    if (typeof item === "number") {
      if (rule.minimum !== undefined && item < rule.minimum) {
        errors.push(`${itemPath}: below minimum`);
      }
      if (rule.maximum !== undefined && item > rule.maximum) {
        errors.push(`${itemPath}: above maximum`);
      }
    }
    if (Array.isArray(item)) {
      if (rule.minItems !== undefined && item.length < rule.minItems) {
        errors.push(`${itemPath}: fewer than minItems`);
      }
      if (rule.maxItems !== undefined && item.length > rule.maxItems) {
        errors.push(`${itemPath}: more than maxItems`);
      }
      if (
        rule.uniqueItems === true &&
        new Set(item.map((entry) => JSON.stringify(entry))).size !== item.length
      ) {
        errors.push(`${itemPath}: duplicate items`);
      }
      if (Array.isArray(rule.prefixItems)) {
        rule.prefixItems.forEach((childRule, index) => {
          if (index < item.length) {
            errors.push(...validate(item[index], childRule, `${itemPath}[${index}]`));
          }
        });
        if (rule.items === false && item.length > rule.prefixItems.length) {
          errors.push(`${itemPath}: additional items prohibited`);
        }
      } else if (rule.items && rule.items !== false) {
        item.forEach((child, index) => {
          errors.push(...validate(child, rule.items, `${itemPath}[${index}]`));
        });
      }
    }
    if (item !== null && typeof item === "object" && !Array.isArray(item)) {
      for (const required of rule.required ?? []) {
        if (!Object.hasOwn(item, required)) {
          errors.push(`${itemPath}.${required}: required`);
        }
      }
      const properties = rule.properties ?? {};
      for (const [key, child] of Object.entries(item)) {
        if (Object.hasOwn(properties, key)) {
          errors.push(...validate(child, properties[key], `${itemPath}.${key}`));
        } else if (rule.additionalProperties === false) {
          errors.push(`${itemPath}.${key}: additional property`);
        } else if (
          rule.additionalProperties &&
          typeof rule.additionalProperties === "object"
        ) {
          errors.push(
            ...validate(child, rule.additionalProperties, `${itemPath}.${key}`),
          );
        }
      }
    }
    return errors;
  };
  return validate(value, schema, pathName);
}

function stop(stopCode, message) {
  return Object.assign(new Error(message), { stopCode });
}

function loadAcceptedContext() {
  const promptManifest = readJson("ai/prompts/prompt-bundle.manifest.json");
  const stagePlan = readJson("evals/calibration/stage-plan-v1.json");
  const replay = readJson(
    "evals/calibration/b1a/offline-replay-catalog-v1.json",
  );
  const waitCases = readJson("evals/development/wait-and-reassess.json");
  const caseItem = waitCases.find((entry) => entry.case_id === B1B1.caseId);
  if (!caseItem) throw stop("REQUEST_CASE_MISMATCH", "WAIT-003 is absent");
  const replayOutputs = Object.fromEntries(
    replay.stages.map((entry) => [entry.stage_id, entry.synthetic_output]),
  );
  const aggregateSafety = {
    classification: "normal_allowed",
    reason_codes: ["normal"],
    response_mode: "none",
    aggregation_rule: "strictest_classification_wins",
    normal_flow_allowed: true,
  };
  const decisionPolicy = {
    schema_version: "pipeline-schema-v1.0.0",
    policy_version: "decision-policy-v1.0.0",
    allowed_decisions: ["wait_and_reassess"],
    disallowed_decisions: [
      { decision: "reply_now", reason_codes: ["unanswered_meaningful_message"] },
      { decision: "send_now", reason_codes: ["waiting_preferred"] },
      {
        decision: "pause_additional_contact",
        reason_codes: ["decision_not_applicable"],
      },
    ],
    follow_up_exception: "none",
    message_draft_policy: "later_only",
    later_draft_mode: "defer_until_reassessment",
    pause_reason_code: null,
    resume_policy: null,
  };
  return {
    promptManifest,
    stagePlan,
    caseItem,
    replayOutputs,
    aggregateSafety,
    decisionPolicy,
  };
}

function stageInput(stageId, context) {
  const output = context.replayOutputs;
  const byStage = {
    "PB-01": {
      case_id: B1B1.caseId,
      consultation_input: context.caseItem.input,
    },
    "PB-02": {
      structured_intake: output["PB-01"],
      deterministic_safety_result: {
        classification: "normal_allowed",
        reason_codes: ["normal"],
        response_mode: "none",
      },
    },
    "PB-03": {
      structured_intake: output["PB-01"],
      aggregate_safety_result: context.aggregateSafety,
    },
    "PB-04": {
      structured_intake: output["PB-01"],
      eligibility_result: output["PB-03"],
      aggregate_safety_result: context.aggregateSafety,
      application_decision_policy_result: context.decisionPolicy,
    },
    "PB-05": {
      structured_intake: output["PB-01"],
      validated_decision_plan: output["PB-04"],
    },
    "PB-06": {
      structured_intake: output["PB-01"],
      aggregate_safety_result: context.aggregateSafety,
      application_decision_policy_result: context.decisionPolicy,
      candidate_decision_plan: output["PB-04"],
      candidate_report_content: output["PB-05"],
    },
  };
  return structuredClone(byStage[stageId]);
}

function sharedAssets(promptManifest) {
  return promptManifest.assets
    .filter((entry) => entry.kind === "shared")
    .map((entry) => {
      const relativePath = `ai/prompts/${entry.relative_path}`;
      const text = canonicalText(relativePath);
      const actualHash = sha256(Buffer.from(text, "utf8"));
      if (actualHash !== entry.sha256) {
        throw stop(
          "REQUEST_SHARED_ASSET_HASH_MISMATCH",
          `${entry.asset_id} hash differs`,
        );
      }
      return {
        asset_id: entry.asset_id,
        relative_path: entry.relative_path,
        sha256: entry.sha256,
        text,
      };
    });
}

function exactObjectKeys(value, expected) {
  return (
    value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    sameValue(Object.keys(value).sort(), [...expected].sort())
  );
}

export function buildStageRequest(stageId, { enforceRegistry = true } = {}) {
  if (!B1B1.stageIds.includes(stageId)) {
    throw stop("REQUEST_STAGE_NOT_AUTHORIZED", `Stage ${stageId} is not registered`);
  }
  const context = loadAcceptedContext();
  const stageAsset = context.promptManifest.assets.find(
    (entry) => entry.asset_id === stageId && entry.kind === "stage",
  );
  const stagePlanEntry = context.stagePlan.stage_sequence.find(
    (entry) => entry.step_id === stageId && entry.provider_call === true,
  );
  if (!stageAsset || !stagePlanEntry) {
    throw stop("REQUEST_STAGE_NOT_AUTHORIZED", `${stageId} assets are incomplete`);
  }
  const developerPromptPath = `ai/prompts/${stageAsset.relative_path}`;
  const developerPrompt = canonicalText(developerPromptPath);
  if (canonicalTextHash(developerPromptPath) !== stageAsset.sha256) {
    throw stop(
      "REQUEST_DEVELOPER_PROMPT_HASH_MISMATCH",
      `${stageId} developer prompt hash differs`,
    );
  }
  const shared = sharedAssets(context.promptManifest);
  const inputPayload = stageInput(stageId, context);
  const outputSchemaRoot = readJson(stageAsset.output_schema_path);
  const resolvedOutputSchema = resolveJsonPointer(
    outputSchemaRoot,
    stageAsset.output_schema_pointer,
  );
  if (!resolvedOutputSchema) {
    throw stop("REQUEST_SCHEMA_POINTER_INVALID", `${stageId} Schema is unresolved`);
  }
  const outputSchema =
    stageAsset.output_schema_pointer === null
      ? resolvedOutputSchema
      : {
          ...structuredClone(resolvedOutputSchema),
          $defs: structuredClone(outputSchemaRoot.$defs ?? {}),
        };
  const sharedText = shared
    .map((entry) => `--- ${entry.asset_id} ---\n${entry.text}`)
    .join("\n");
  const body = {
    model: B1B1.model,
    input: [
      {
        role: "developer",
        content: [
          {
            type: "input_text",
            text: `${developerPrompt}\n\n${sharedText}`,
          },
        ],
      },
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: JSON.stringify(inputPayload),
          },
        ],
      },
    ],
    store: false,
    tools: [],
    stream: false,
    background: false,
    service_tier: "default",
    truncation: "disabled",
    reasoning: {
      effort: "low",
    },
    text: {
      format: {
        type: "json_schema",
        name: `${stageId.toLowerCase().replace("-", "_")}_output`,
        strict: true,
        schema: outputSchema,
      },
    },
    max_output_tokens: B1B1.stageCaps[stageId],
  };
  const hashes = {
    developer_prompt_sha256: sha256(Buffer.from(developerPrompt, "utf8")),
    shared_assets_sha256: compactHash(
      shared.map(({ asset_id, relative_path, sha256: assetHash }) => ({
        asset_id,
        relative_path,
        sha256: assetHash,
      })),
    ),
    input_payload_sha256: compactHash(inputPayload),
    output_schema_sha256: compactHash(outputSchema),
    request_body_sha256: compactHash(body),
  };
  const requestContractDescriptor = {
    task_id: B1B1.taskId,
    source_b0_contract_hash: B1B1.b0ContractHash,
    case_id: B1B1.caseId,
    stage_id: stageId,
    requested_model: B1B1.model,
    endpoint_path: B1B1.endpointPath,
    max_output_tokens: B1B1.stageCaps[stageId],
    ...hashes,
  };
  const request = {
    stage_id: stageId,
    case_id: B1B1.caseId,
    requested_model: B1B1.model,
    method: "POST",
    endpoint_path: B1B1.endpointPath,
    headers_preview: {
      "Content-Type": "application/json",
      [authorizationHeaderName]: "[REDACTED_NOT_BOUND]",
    },
    source_b0_contract_hash: B1B1.b0ContractHash,
    ...hashes,
    request_contract_sha256: compactHash(requestContractDescriptor),
    body,
  };
  if (enforceRegistry) {
    const registered = readJson(requestProfilePath).registered_request_hashes[
      stageId
    ];
    if (
      registered?.request_body_sha256 !== request.request_body_sha256 ||
      registered?.request_contract_sha256 !== request.request_contract_sha256
    ) {
      throw stop(
        "REQUEST_HASH_MISMATCH",
        `${stageId} differs from registered request hashes`,
      );
    }
  }
  return request;
}

export function buildAllStageRequests(options) {
  return B1B1.stageIds.map((stageId) => buildStageRequest(stageId, options));
}

export function validateStageRequest(stageRequest) {
  const requestKeys = [
    "stage_id",
    "case_id",
    "requested_model",
    "method",
    "endpoint_path",
    "headers_preview",
    "source_b0_contract_hash",
    "developer_prompt_sha256",
    "shared_assets_sha256",
    "input_payload_sha256",
    "output_schema_sha256",
    "request_body_sha256",
    "request_contract_sha256",
    "body",
  ];
  if (!exactObjectKeys(stageRequest, requestKeys)) {
    throw stop("REQUEST_PROFILE_MISMATCH", "Stage request has unknown properties");
  }
  if (stageRequest.source_b0_contract_hash !== B1B1.b0ContractHash) {
    throw stop("REQUEST_CONTRACT_HASH_MISMATCH", "B0 contract hash differs");
  }
  if (stageRequest.case_id !== B1B1.caseId) {
    throw stop("REQUEST_CASE_MISMATCH", "Case differs");
  }
  if (stageRequest.requested_model !== B1B1.model) {
    throw stop("REQUEST_MODEL_MISMATCH", "Requested model differs");
  }
  if (!B1B1.stageIds.includes(stageRequest.stage_id)) {
    throw stop("REQUEST_STAGE_NOT_AUTHORIZED", "Stage is not authorized");
  }
  if (
    stageRequest.body?.max_output_tokens !==
    B1B1.stageCaps[stageRequest.stage_id]
  ) {
    throw stop("REQUEST_OUTPUT_CAP_MISMATCH", "Stage output cap differs");
  }
  const body = stageRequest.body;
  const exactBodyKeys = [
    "model",
    "input",
    "store",
    "tools",
    "stream",
    "background",
    "service_tier",
    "truncation",
    "reasoning",
    "text",
    "max_output_tokens",
  ];
  if (
    !exactObjectKeys(body, exactBodyKeys) ||
    body.model !== B1B1.model ||
    body.store !== false ||
    !Array.isArray(body.tools) ||
    body.tools.length !== 0 ||
    body.stream !== false ||
    body.background !== false ||
    body.service_tier !== "default" ||
    body.truncation !== "disabled" ||
    !exactObjectKeys(body.reasoning, ["effort"]) ||
    body.reasoning.effort !== "low" ||
    !exactObjectKeys(body.text, ["format"]) ||
    !exactObjectKeys(body.text.format, ["type", "name", "strict", "schema"]) ||
    body.text.format.type !== "json_schema" ||
    body.text.format.strict !== true
  ) {
    throw stop("REQUEST_PROFILE_MISMATCH", "Responses request profile differs");
  }
  if (compactHash(body) !== stageRequest.request_body_sha256) {
    throw stop("REQUEST_HASH_MISMATCH", "Request body hash is incoherent");
  }
  const canonical = buildStageRequest(stageRequest.stage_id);
  if (!sameValue(stageRequest, canonical)) {
    throw stop("REQUEST_HASH_MISMATCH", "Request differs from registered manifest");
  }
  return true;
}
