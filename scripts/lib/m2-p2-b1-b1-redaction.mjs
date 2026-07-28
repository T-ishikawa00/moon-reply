const authorizationName = ["Author", "ization"].join("");
const environmentKeyName = ["OPENAI", "API", "KEY"].join("_");
const bearerName = ["Bear", "er"].join("");

function secretShapePatterns() {
  return [
    /\bsk-[A-Za-z0-9_-]{16,}\b/u,
    new RegExp(`\\b${bearerName}\\s+[A-Za-z0-9._-]{12,}\\b`, "iu"),
    /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/u,
  ];
}

export function redactDeterministically(value) {
  const visit = (item, key = "") => {
    if (Array.isArray(item)) return item.map((entry) => visit(entry));
    if (item && typeof item === "object") {
      return Object.fromEntries(
        Object.entries(item).map(([childKey, child]) => {
          const normalized = childKey.toLowerCase();
          if (
            normalized === authorizationName.toLowerCase() ||
            normalized === "api_key" ||
            normalized === environmentKeyName.toLowerCase() ||
            normalized.includes("secret")
          ) {
            return [childKey, "[REDACTED]"];
          }
          return [childKey, visit(child, childKey)];
        }),
      );
    }
    if (typeof item === "string") {
      let result = item;
      for (const pattern of secretShapePatterns()) {
        result = result.replace(pattern, "[REDACTED]");
      }
      if (key.toLowerCase().includes("environment")) return "[REDACTED]";
      return result;
    }
    return item;
  };
  return visit(value);
}

function sanitizerStop(reason) {
  return Object.assign(new Error(`Artifact rejected: ${reason}`), {
    stopCode: "ARTIFACT_SANITIZER_REJECTED",
  });
}

export function assertArtifactSafe(value) {
  let serialized;
  try {
    serialized = JSON.stringify(value);
  } catch {
    throw sanitizerStop("non-serializable secret-bearing object");
  }
  if (secretShapePatterns().some((pattern) => pattern.test(serialized))) {
    throw sanitizerStop("secret-shaped value");
  }
  const absolutePathPatterns = [
    /[A-Za-z]:\\(?:Users|projects|Windows)\\/u,
    /\/(?:Users|home|root)\//u,
  ];
  if (absolutePathPatterns.some((pattern) => pattern.test(serialized))) {
    throw sanitizerStop("absolute local path");
  }
  const inspect = (item, pathName = "$") => {
    if (Array.isArray(item)) {
      item.forEach((entry, index) => inspect(entry, `${pathName}[${index}]`));
      return;
    }
    if (!item || typeof item !== "object") return;
    for (const [key, child] of Object.entries(item)) {
      const normalized = key.toLowerCase();
      if (
        normalized === authorizationName.toLowerCase() &&
        child !== "[REDACTED_NOT_BOUND]" &&
        child !== "[REDACTED]"
      ) {
        throw sanitizerStop(`${pathName}.${key} contains an authorization value`);
      }
      if (
        ["hostname", "username", "process_id", "pid"].includes(normalized) ||
        normalized === "environment_dump"
      ) {
        throw sanitizerStop(`${pathName}.${key} contains machine information`);
      }
      if (
        (normalized.includes("real_user") || normalized.includes("holdout")) &&
        child !== false &&
        child !== 0 &&
        child !== null
      ) {
        throw sanitizerStop(`${pathName}.${key} contains prohibited data`);
      }
      if (
        normalized === "reasoning_text" ||
        normalized === "internal_reasoning" ||
        normalized === "chain_of_thought"
      ) {
        throw sanitizerStop(`${pathName}.${key} contains internal reasoning text`);
      }
      inspect(child, `${pathName}.${key}`);
    }
  };
  inspect(value);
  return true;
}

export function sanitizeArtifact(value) {
  assertArtifactSafe(value);
  return structuredClone(value);
}
