import { request as nodeHttpsRequest } from "node:https";
import * as tls from "node:tls";

export const OPENAI_HTTPS_BINDING = Object.freeze({
  protocol: "https:",
  host: "api.openai.com",
  port: 443,
  method: "POST",
  path: "/v1/responses",
  minimum_tls: "TLSv1.2",
  redirects_allowed: false,
  proxy_environment_used: false,
  connection_reuse: false,
  timeout_ms: 180000,
  maximum_request_body_bytes: 2 * 1024 * 1024,
  maximum_response_body_bytes: 4 * 1024 * 1024,
  successful_status: 200,
});

let actualHttpsRequestCount = 0;

function executorError(stopCode, message, httpStatus = null) {
  return Object.assign(new Error(message), {
    stopCode,
    sanitizedHttpStatus: httpStatus,
  });
}

export function mapHttpStatusToStopCode(statusCode) {
  if (statusCode >= 300 && statusCode < 400) {
    return "PROVIDER_REDIRECT_REJECTED";
  }
  if (statusCode === 400) return "PROVIDER_REQUEST_REJECTED";
  if (statusCode === 401) return "PROVIDER_AUTHENTICATION_FAILED";
  if (statusCode === 403) return "PROVIDER_PERMISSION_DENIED";
  if (statusCode === 404) {
    return "PROVIDER_MODEL_OR_ENDPOINT_UNAVAILABLE";
  }
  if (statusCode === 429) return "PROVIDER_RATE_LIMITED";
  if (statusCode >= 500 && statusCode < 600) {
    return "PROVIDER_SERVER_ERROR";
  }
  return "PROVIDER_REQUEST_REJECTED";
}

function validateInvocation(invocation) {
  const allowedKeys = ["body", "secretHandle"];
  const keys = Object.keys(invocation ?? {});
  const override = keys.find((key) => !allowedKeys.includes(key));
  if (override === "host" || override === "port" || override === "protocol") {
    throw executorError(
      "PROVIDER_HOST_OVERRIDE_REJECTED",
      "Provider host configuration is fixed",
    );
  }
  if (override === "path" || override === "endpoint") {
    throw executorError(
      "PROVIDER_ENDPOINT_OVERRIDE_REJECTED",
      "Provider endpoint configuration is fixed",
    );
  }
  if (override === "method") {
    throw executorError(
      "PROVIDER_METHOD_OVERRIDE_REJECTED",
      "Provider method is fixed",
    );
  }
  if (override === "headers" || override === "header") {
    throw executorError(
      "PROVIDER_HEADER_OVERRIDE_REJECTED",
      "Caller-supplied headers are prohibited",
    );
  }
  if (override === "timeout" || override === "timeoutMs") {
    throw executorError(
      "PROVIDER_TIMEOUT_OVERRIDE_REJECTED",
      "Provider timeout is fixed",
    );
  }
  if (override) {
    throw executorError(
      "PROVIDER_OPTION_OVERRIDE_REJECTED",
      "Caller-supplied transport options are prohibited",
    );
  }
}

function defaultRequestImplementation({ options, requestBody }) {
  actualHttpsRequestCount += 1;
  return new Promise((resolve, reject) => {
    const request = nodeHttpsRequest(options, (response) => {
      const chunks = [];
      let responseBytes = 0;
      response.on("data", (chunk) => {
        responseBytes += chunk.length;
        if (
          responseBytes >
          OPENAI_HTTPS_BINDING.maximum_response_body_bytes
        ) {
          request.destroy(
            executorError(
              "PROVIDER_RESPONSE_TOO_LARGE",
              "Provider response exceeded the fixed byte limit",
              response.statusCode ?? null,
            ),
          );
          return;
        }
        chunks.push(chunk);
      });
      response.on("end", () => {
        resolve({
          statusCode: response.statusCode ?? 0,
          bodyText: Buffer.concat(chunks).toString("utf8"),
        });
      });
    });
    request.once("error", reject);
    request.setTimeout(OPENAI_HTTPS_BINDING.timeout_ms, () => {
      request.destroy(
        executorError("PROVIDER_TIMEOUT", "Provider request timed out"),
      );
    });
    request.end(requestBody);
  });
}

export function createOpenAiHttpsExecutor({
  requestImplementation = defaultRequestImplementation,
  externalNetwork = requestImplementation === defaultRequestImplementation,
} = {}) {
  if (typeof tls.createSecureContext !== "function") {
    throw executorError(
      "TLS_RUNTIME_UNAVAILABLE",
      "The Node TLS runtime is unavailable",
    );
  }
  let fakeRequestInvocations = 0;
  return Object.freeze({
    binding: OPENAI_HTTPS_BINDING,
    async execute(invocation) {
      validateInvocation(invocation);
      if (
        !invocation?.secretHandle ||
        typeof invocation.secretHandle.withSecret !== "function"
      ) {
        throw executorError(
          "SECRET_HANDLE_INVALID",
          "An opaque secret handle is required",
        );
      }
      const requestBody = JSON.stringify(invocation.body);
      const requestBytes = Buffer.byteLength(requestBody, "utf8");
      if (requestBytes > OPENAI_HTTPS_BINDING.maximum_request_body_bytes) {
        throw executorError(
          "PROVIDER_REQUEST_TOO_LARGE",
          "Provider request exceeded the fixed byte limit",
        );
      }
      const result = await invocation.secretHandle.withSecret(
        async (secretValue) => {
          const options = {
            protocol: OPENAI_HTTPS_BINDING.protocol,
            host: OPENAI_HTTPS_BINDING.host,
            port: OPENAI_HTTPS_BINDING.port,
            method: OPENAI_HTTPS_BINDING.method,
            path: OPENAI_HTTPS_BINDING.path,
            minVersion: OPENAI_HTTPS_BINDING.minimum_tls,
            agent: false,
            timeout: OPENAI_HTTPS_BINDING.timeout_ms,
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
              "Content-Length": requestBytes,
              Authorization: `Bearer ${secretValue}`,
            },
          };
          if (!externalNetwork) fakeRequestInvocations += 1;
          try {
            return await requestImplementation({
              options,
              requestBody,
              maximumResponseBodyBytes:
                OPENAI_HTTPS_BINDING.maximum_response_body_bytes,
            });
          } catch (error) {
            if (error?.stopCode) throw error;
            if (error?.code === "ETIMEDOUT") {
              throw executorError(
                "PROVIDER_TIMEOUT",
                "Provider request timed out",
              );
            }
            throw executorError(
              "PROVIDER_NETWORK_ERROR",
              "Provider network request failed",
            );
          }
        },
      );
      const statusCode = result?.statusCode;
      const bodyText = result?.bodyText ?? "";
      if (
        Buffer.byteLength(bodyText, "utf8") >
        OPENAI_HTTPS_BINDING.maximum_response_body_bytes
      ) {
        throw executorError(
          "PROVIDER_RESPONSE_TOO_LARGE",
          "Provider response exceeded the fixed byte limit",
          statusCode ?? null,
        );
      }
      if (statusCode !== OPENAI_HTTPS_BINDING.successful_status) {
        throw executorError(
          mapHttpStatusToStopCode(statusCode),
          "Provider returned a non-success status",
          statusCode,
        );
      }
      let response;
      try {
        response = JSON.parse(bodyText);
      } catch {
        throw executorError(
          "PROVIDER_RESPONSE_JSON_INVALID",
          "Provider response was not valid JSON",
          statusCode,
        );
      }
      return {
        status_code: statusCode,
        response,
      };
    },
    metrics() {
      return {
        fake_request_invocations: fakeRequestInvocations,
        actual_https_requests: externalNetwork
          ? actualHttpsRequestCount
          : 0,
      };
    },
  });
}

export function actualHttpsExecutorMetrics() {
  return { actual_https_requests: actualHttpsRequestCount };
}
