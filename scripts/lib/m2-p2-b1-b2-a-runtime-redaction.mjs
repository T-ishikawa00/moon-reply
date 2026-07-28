const forbiddenKeys = new Set([
  "authorization",
  ["openai", "api", "key"].join("_"),
  "api_key",
  "secret_value",
  "environment",
  "environment_dump",
  "request_headers",
  "raw_request_headers",
  "internal_reasoning",
  "chain_of_thought",
]);
const bearerPattern = /\bBearer\s+\S+/iu;
const secretShapePattern = /\bsk-[A-Za-z0-9_-]{16,}\b/u;

function policyError(detail) {
  return Object.assign(
    new Error(`Artifact secret policy rejected ${detail}`),
    { stopCode: "ARTIFACT_SECRET_POLICY_VIOLATION" },
  );
}

function inspectValue(value, pathName, seen) {
  if (typeof value === "string") {
    if (bearerPattern.test(value) || secretShapePattern.test(value)) {
      throw policyError(pathName);
    }
    return value;
  }
  if (
    value === null ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }
  if (typeof value !== "object") {
    throw policyError(pathName);
  }
  if (seen.has(value)) throw policyError(`${pathName} circular reference`);
  seen.add(value);
  if (Array.isArray(value)) {
    const result = value.map((item, index) =>
      inspectValue(item, `${pathName}[${index}]`, seen),
    );
    seen.delete(value);
    return result;
  }
  const result = {};
  for (const [key, child] of Object.entries(value)) {
    if (forbiddenKeys.has(key.toLowerCase())) {
      throw policyError(`${pathName}.${key}`);
    }
    result[key] = inspectValue(child, `${pathName}.${key}`, seen);
  }
  seen.delete(value);
  return result;
}

export function assertArtifactSecretSafe(value) {
  return inspectValue(value, "$", new Set());
}

export function serializeArtifactFailClosed(value) {
  return `${JSON.stringify(assertArtifactSecretSafe(value), null, 2)}\n`;
}
