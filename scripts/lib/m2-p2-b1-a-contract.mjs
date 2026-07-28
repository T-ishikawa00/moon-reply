import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const moduleDirectory = path.dirname(fileURLToPath(import.meta.url));
export const repositoryRoot = path.resolve(moduleDirectory, "..", "..");

export const B1A = Object.freeze({
  taskId: "M2-P2-B1-A",
  mode: "offline_replay",
  cliMode: "offline-replay",
  runKind: "calibration_plumbing_preview",
  caseId: "WAIT-003",
  model: "gpt-5.6-luna",
  confirmation: "MOON_REPLY_B1_A_OFFLINE_REPLAY_ONLY",
  b0ContractHash:
    "c3dfdc5ec6cb503a8d91ed4080c8734c9af9c7bf944e1bb6b5798536bb6c38e2",
  staticHardCapUsd: 0.213223,
  preflightCeilingUsd: 0.3,
  futureHumanCeilingUsd: 1,
  stageIds: ["PB-01", "PB-02", "PB-03", "PB-04", "PB-05", "PB-06"],
});

const assetPaths = Object.freeze({
  runnerContract: "evals/calibration/b1a/runner-contract-v1.json",
  stateMachine: "evals/calibration/b1a/state-machine-v1.json",
  failureCatalog:
    "evals/calibration/b1a/failure-injection-catalog-v1.json",
  replayCatalog: "evals/calibration/b1a/offline-replay-catalog-v1.json",
  artifactPolicy: "evals/calibration/b1a/artifact-policy-v1.json",
  approvalLock: "evals/calibration/b1a/approval-lock-v1.json",
  reportManifest: "evals/calibration/b1a/report-manifest-v1.json",
});

export function absolute(relativePath) {
  return path.join(repositoryRoot, ...relativePath.split("/"));
}

export function canonicalText(relativePath) {
  return readFileSync(absolute(relativePath), "utf8").replaceAll("\r\n", "\n");
}

export function canonicalTextHash(relativePath) {
  return createHash("sha256")
    .update(Buffer.from(canonicalText(relativePath), "utf8"))
    .digest("hex");
}

export function compactHash(value) {
  return createHash("sha256")
    .update(Buffer.from(JSON.stringify(value), "utf8"))
    .digest("hex");
}

export function readJson(relativePath) {
  return JSON.parse(canonicalText(relativePath));
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
        }
      }
    }
    return errors;
  };
  return validate(value, schema, pathName);
}

export function loadB1aAssets() {
  const assets = Object.fromEntries(
    Object.entries(assetPaths).map(([key, relativePath]) => [
      key,
      readJson(relativePath),
    ]),
  );
  const stageSchemas = Object.fromEntries(
    assets.replayCatalog.stages.map((stage) => {
      const root = readJson(stage.output_schema_ref.path);
      const resolved = resolveJsonPointer(root, stage.output_schema_ref.pointer);
      if (!resolved) throw new Error(`Schema pointer unresolved for ${stage.stage_id}`);
      return [stage.stage_id, { root, resolved }];
    }),
  );
  const localSchemas = {
    decisionPolicy: readJson("ai/schemas/decision-policy-result.schema.json"),
  };
  return { ...assets, stageSchemas, localSchemas };
}

export function assertFixedIdentity(assets) {
  const contract = assets.runnerContract;
  const lock = assets.approvalLock;
  const manifest = assets.reportManifest;
  if (
    contract.execution_mode !== B1A.mode ||
    contract.run_kind !== B1A.runKind ||
    contract.case_id !== B1A.caseId ||
    contract.requested_model !== B1A.model ||
    contract.source_b0_contract_hash !== B1A.b0ContractHash ||
    contract.actual_provider_calls !== 0 ||
    contract.api_spend_usd !== 0 ||
    contract.live_execution_authorized !== false
  ) {
    throw Object.assign(new Error("Fixed runner identity differs"), {
      stopCode: "B1A_IDENTITY_MISMATCH",
    });
  }
  if (
    lock.live_execution_authorized !== false ||
    lock.paid_run_authorized !== false ||
    lock.paid_run_completed !== false ||
    lock.api_spend_usd !== 0 ||
    lock.authorized_case !== B1A.caseId ||
    lock.authorized_model_candidate !== B1A.model ||
    lock.authorized_provider_stage_count !== 6 ||
    lock.offline_confirmation !== B1A.confirmation
  ) {
    throw Object.assign(new Error("Approval lock denies this run"), {
      stopCode: "B1A_APPROVAL_LOCK_INVALID",
    });
  }
  if (
    canonicalTextHash(assetPaths.approvalLock) !== manifest.approval_lock_sha256
  ) {
    throw Object.assign(new Error("Approval lock hash differs"), {
      stopCode: "B1A_APPROVAL_LOCK_HASH_MISMATCH",
    });
  }
}

export const B1A_ASSET_PATHS = assetPaths;
