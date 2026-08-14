import { NextResponse } from "next/server";
import { loadM2P4ProductQualityRuntimeStageCatalog } from "@/lib/assessment/runtime/schema-catalog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const responseHeaders = {
  "Cache-Control": "no-store, max-age=0",
};

function failedResponse() {
  return NextResponse.json(
    {
      ok: false,
      code: "RUNTIME_ASSET_PROBE_FAILED",
    },
    {
      status: 500,
      headers: responseHeaders,
    },
  );
}

export async function GET() {
  try {
    const catalog = await loadM2P4ProductQualityRuntimeStageCatalog();
    if (catalog.definitions.length !== 6) {
      return failedResponse();
    }

    return NextResponse.json(
      {
        ok: true,
        stageCount: catalog.definitions.length,
        promptBundleVersion: catalog.promptBundleVersion,
        schemaSetVersion: catalog.schemaSetVersion,
      },
      {
        status: 200,
        headers: responseHeaders,
      },
    );
  } catch {
    return failedResponse();
  }
}
