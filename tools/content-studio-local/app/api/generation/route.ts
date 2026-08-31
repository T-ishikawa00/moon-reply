import { NextResponse } from "next/server";

import { asM2RuntimeError } from "@/lib/assessment/runtime/errors";
import { readStrictJsonRequest } from "@/lib/http/strict-json-request";
import {
  assertLocalContentStudioLoopbackRequest,
  createLocalContentStudioService,
  type LocalContentStudioService,
} from "../../../lib/index";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const maximumBodyBytes = 16 * 1024;
const singletonKey = Symbol.for(
  "moon-reply.content-studio-local.service.diagnostics-v1",
);

type LocalGlobal = typeof globalThis & {
  [singletonKey]?: Promise<LocalContentStudioService>;
};

function service() {
  const localGlobal = globalThis as LocalGlobal;
  localGlobal[singletonKey] ??= createLocalContentStudioService();
  return localGlobal[singletonKey];
}

function noStoreJson(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "private, no-store, max-age=0",
      "Referrer-Policy": "no-referrer",
      "X-Content-Type-Options": "nosniff",
      "X-Robots-Tag": "noindex, nofollow, noarchive",
    },
  });
}

export async function POST(request: Request) {
  try {
    assertLocalContentStudioLoopbackRequest(request);
    const body = await readStrictJsonRequest(request, maximumBodyBytes);
    if (typeof body !== "object" || body === null || Array.isArray(body)) {
      throw new Error("CONTENT_STUDIO_LOCAL_INVALID_REQUEST");
    }
    const application = await service();
    const outcome =
      "action" in body
        ? await application.answerClarification(body)
        : await application.generate(body);
    return noStoreJson(outcome);
  } catch (error) {
    const safe = asM2RuntimeError(
      error,
      "CONTENT_STUDIO_LOCAL_REQUEST_FAILED",
    );
    if (safe.httpStatus === 404) {
      return noStoreJson({ error: { code: "NOT_FOUND" } }, 404);
    }
    const status =
      safe.httpStatus >= 400 && safe.httpStatus <= 599
        ? safe.httpStatus
        : 500;
    return noStoreJson({ error: { code: safe.safeCode } }, status);
  }
}
