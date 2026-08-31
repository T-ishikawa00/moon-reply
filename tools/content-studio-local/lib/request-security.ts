import { M2RuntimeError } from "../../../lib/assessment/runtime/errors.ts";
import { assertLocalContentStudioAvailable } from "./environment.ts";

type EnvironmentSource = Readonly<Record<string, string | undefined>>;

export type LocalContentStudioRequestLike = Readonly<{
  method: string;
  url: string;
  headers: Pick<Headers, "get">;
}>;

function denied(): never {
  throw new M2RuntimeError("CONTENT_STUDIO_LOCAL_UNAVAILABLE", 404);
}

function isLoopbackHostname(hostname: string) {
  const normalized = hostname.toLowerCase().replace(/^\[(.*)\]$/u, "$1");
  return (
    normalized === "localhost" ||
    normalized === "127.0.0.1" ||
    normalized === "::1"
  );
}

function parseHostHeader(value: string) {
  if (
    value.includes("/") ||
    value.includes("\\") ||
    value.includes("@") ||
    /[\u0000-\u001f\u007f]/u.test(value)
  ) {
    denied();
  }
  try {
    return new URL(`http://${value}`);
  } catch {
    denied();
  }
}

export function assertLocalContentStudioLoopbackRequest(
  request: LocalContentStudioRequestLike,
  environment: EnvironmentSource = process.env,
) {
  assertLocalContentStudioAvailable(environment);

  let requestUrl: URL;
  try {
    requestUrl = new URL(request.url);
  } catch {
    denied();
  }
  const hostHeader = request.headers.get("host");
  if (!hostHeader) denied();
  const parsedHost = parseHostHeader(hostHeader);
  if (
    !["http:", "https:"].includes(requestUrl.protocol) ||
    requestUrl.username !== "" ||
    requestUrl.password !== "" ||
    !isLoopbackHostname(requestUrl.hostname) ||
    !isLoopbackHostname(parsedHost.hostname)
  ) {
    denied();
  }

  const method = request.method.toUpperCase();
  if (method !== "GET" && method !== "HEAD") {
    const origin = request.headers.get("origin");
    if (!origin) denied();
    let parsedOrigin: URL;
    try {
      parsedOrigin = new URL(origin);
    } catch {
      denied();
    }
    if (
      !isLoopbackHostname(parsedOrigin.hostname) ||
      parsedOrigin.origin !== `${requestUrl.protocol}//${hostHeader.toLowerCase()}`
    ) {
      denied();
    }
  }
}
