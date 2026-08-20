import { M2RuntimeError } from "../assessment/runtime/errors.ts";

const jsonContentTypePattern =
  /^application\/json(?:\s*;\s*charset\s*=\s*utf-8)?$/iu;

export function enforceSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const fetchSite = request.headers.get("sec-fetch-site");
  if (
    origin === null ||
    origin !== new URL(request.url).origin ||
    (fetchSite !== null && fetchSite !== "same-origin")
  ) {
    throw new M2RuntimeError("PRODUCTION_ORIGIN_REJECTED", 403);
  }
}

export async function readStrictJsonRequest(
  request: Request,
  maximumBodyBytes: number,
): Promise<unknown> {
  const contentType = request.headers.get("content-type") ?? "";
  if (!jsonContentTypePattern.test(contentType)) {
    throw new M2RuntimeError("PRODUCTION_INVALID_CONTENT_TYPE", 415);
  }

  const contentLength = request.headers.get("content-length");
  if (contentLength !== null) {
    if (!/^\d+$/u.test(contentLength)) {
      throw new M2RuntimeError("PRODUCTION_INVALID_REQUEST", 400);
    }
    if (Number(contentLength) > maximumBodyBytes) {
      throw new M2RuntimeError("PRODUCTION_REQUEST_TOO_LARGE", 413);
    }
  }

  if (request.body === null) {
    throw new M2RuntimeError("PRODUCTION_INVALID_JSON", 400);
  }
  const reader = request.body.getReader();
  const decoder = new TextDecoder("utf-8", { fatal: true });
  let raw = "";
  let receivedBytes = 0;
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      receivedBytes += chunk.value.byteLength;
      if (receivedBytes > maximumBodyBytes) {
        await reader.cancel();
        throw new M2RuntimeError("PRODUCTION_REQUEST_TOO_LARGE", 413);
      }
      raw += decoder.decode(chunk.value, { stream: true });
    }
    raw += decoder.decode();
  } catch (error) {
    if (error instanceof M2RuntimeError) throw error;
    throw new M2RuntimeError("PRODUCTION_INVALID_JSON", 400);
  } finally {
    reader.releaseLock();
  }

  try {
    return JSON.parse(raw) as unknown;
  } catch {
    throw new M2RuntimeError("PRODUCTION_INVALID_JSON", 400);
  }
}
