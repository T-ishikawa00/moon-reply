import { inspect } from "node:util";

const secretHandleMarker = Symbol("moon-reply-b1-b2-a-secret-handle");
const redactedHandleText = "[REDACTED_SECRET_HANDLE]";
let actualEnvironmentReadCount = 0;
let actualSecretResolutionCount = 0;

function secretError(stopCode, message) {
  return Object.assign(new Error(message), { stopCode });
}

function validateSecretValue(value) {
  if (typeof value !== "string" || value.length === 0) {
    throw secretError(
      "OPENAI_API_KEY_MISSING",
      "The configured OpenAI credential is missing",
    );
  }
  if (/\s/u.test(value)) {
    throw secretError(
      "OPENAI_API_KEY_INVALID",
      "The configured OpenAI credential contains prohibited whitespace",
    );
  }
  return value;
}

export function createSecretHandle(value) {
  const secretValue = validateSecretValue(value);
  const handle = Object.create(null);
  Object.defineProperties(handle, {
    [secretHandleMarker]: {
      value: true,
    },
    withSecret: {
      value: async (callback) => {
        if (typeof callback !== "function") {
          throw secretError(
            "SECRET_CALLBACK_INVALID",
            "Secret access requires a closure callback",
          );
        }
        const result = await callback(secretValue);
        let serializedResult = null;
        try {
          serializedResult = JSON.stringify(result);
        } catch {
          serializedResult = null;
        }
        if (
          result === secretValue ||
          (typeof result === "string" && result.includes(secretValue)) ||
          serializedResult?.includes(secretValue)
        ) {
          throw secretError(
            "SECRET_EXPOSURE_DETECTED",
            "Secret callback attempted to return credential material",
          );
        }
        return result;
      },
    },
    toJSON: {
      value: () => {
        throw secretError(
          "SECRET_SERIALIZATION_PROHIBITED",
          "Opaque secret handles cannot be serialized",
        );
      },
    },
    toString: {
      value: () => redactedHandleText,
    },
    [Symbol.toPrimitive]: {
      value: () => redactedHandleText,
    },
    [inspect.custom]: {
      value: () => redactedHandleText,
    },
  });
  return Object.freeze(handle);
}

export function isSecretHandle(value) {
  return value?.[secretHandleMarker] === true;
}

export function assertSafeLogValue(value) {
  if (isSecretHandle(value)) {
    throw secretError(
      "SECRET_LOGGING_PROHIBITED",
      "Opaque secret handles cannot be logged",
    );
  }
  return value;
}

export function createFixtureEnvironmentSecretProvider(environmentFixture) {
  let fixtureResolutionCount = 0;
  return Object.freeze({
    source_type: "fixture_environment_object",
    async resolveSecret() {
      fixtureResolutionCount += 1;
      return createSecretHandle(environmentFixture?.OPENAI_API_KEY);
    },
    metrics() {
      return {
        fixture_secret_resolutions: fixtureResolutionCount,
        actual_environment_reads: 0,
        actual_secret_resolutions: 0,
      };
    },
  });
}

export function createEnvironmentSecretProvider() {
  let actualResolutionCount = 0;
  return Object.freeze({
    source_type: "process_environment",
    async resolveSecret() {
      if (actualResolutionCount >= 1) {
        throw secretError(
          "SECRET_ALREADY_RESOLVED",
          "The environment secret may be resolved only once per run",
        );
      }
      actualEnvironmentReadCount += 1;
      actualResolutionCount += 1;
      actualSecretResolutionCount += 1;
      return createSecretHandle(process.env.OPENAI_API_KEY);
    },
    metrics() {
      return {
        actual_environment_reads: actualEnvironmentReadCount,
        actual_secret_resolutions: actualResolutionCount,
      };
    },
  });
}

export function actualEnvironmentSecretMetrics() {
  return {
    actual_environment_reads: actualEnvironmentReadCount,
    actual_secret_resolutions: actualSecretResolutionCount,
  };
}
