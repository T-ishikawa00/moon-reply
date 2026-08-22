import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { POST } from "../app/api/consultations/purchase-eligibility/route.ts";
import { evaluatePrepaymentSafetyV1 } from "../lib/purchase/prepayment-safety-gate-v1.ts";

process.removeAllListeners("warning");
process.on("warning", () => {});

const canonicalProductionOrigin = "https://tsukinohenji.jp";
const proxiedProductionUrl =
  "https://moon-reply-internal.netlify.app/api/consultations/purchase-eligibility";
const cases = JSON.parse(
  readFileSync(
    new URL(
      "../evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p6-i1/safety-engine-cases-v1.json",
      import.meta.url,
    ),
    "utf8",
  ),
);
const eligibleInput = structuredClone(cases.base_input);

let passed = 0;

async function check(name, run) {
  try {
    await run();
    passed += 1;
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    throw error;
  }
}

function request(body, headers = {}, url = proxiedProductionUrl) {
  const requestHeaders = new Headers({
    origin: canonicalProductionOrigin,
    "content-type": "application/json",
    "sec-fetch-site": "same-origin",
  });
  for (const [name, value] of Object.entries(headers)) {
    if (value === null) requestHeaders.delete(name);
    else requestHeaders.set(name, value);
  }
  return new Request(url, {
    method: "POST",
    headers: requestHeaders,
    body,
  });
}

process.env.NODE_ENV = "production";
process.env.NEXT_PUBLIC_APP_URL = canonicalProductionOrigin;

await check(
  "Production route accepts the canonical Origin behind a reverse proxy and preserves bug #1",
  async () => {
    const response = await POST(
      request(JSON.stringify(eligibleInput), {
        host: "moon-reply-internal.netlify.app",
        "x-forwarded-host": "moon-reply-internal.netlify.app",
      }),
    );
    assert.notEqual(response.status, 404);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("cache-control"), "no-store");
    const payload = await response.json();
    assert.deepEqual(
      payload,
      { data: evaluatePrepaymentSafetyV1(eligibleInput) },
    );
    assert.equal(payload.data.classification, "eligible_general");
    assert.deepEqual(payload.data.requiredClarificationCodes, []);
    assert.deepEqual(payload.data.requiredAcknowledgementCodes, [
      "adult_confirmed",
      "attestation_confirmed",
    ]);
    assert.equal(payload.data.purchaseGateSatisfied, true);
  },
);

await check("cross-origin requests fail closed", async () => {
  const response = await POST(
    request(JSON.stringify(eligibleInput), {
      origin: "https://attacker.example",
      "x-forwarded-host": "tsukinohenji.jp",
    }),
  );
  assert.equal(response.status, 403);
  assert.deepEqual(await response.json(), {
    error: { code: "PRODUCTION_ORIGIN_REJECTED" },
  });
});

await check("requests without Origin fail closed", async () => {
  const response = await POST(
    request(JSON.stringify(eligibleInput), { origin: null }),
  );
  assert.equal(response.status, 403);
  assert.deepEqual(await response.json(), {
    error: { code: "PRODUCTION_ORIGIN_REJECTED" },
  });
});

await check("cross-site Fetch Metadata fails closed", async () => {
  const response = await POST(
    request(JSON.stringify(eligibleInput), {
      "sec-fetch-site": "cross-site",
    }),
  );
  assert.equal(response.status, 403);
  assert.deepEqual(await response.json(), {
    error: { code: "PRODUCTION_ORIGIN_REJECTED" },
  });
});

await check("missing or invalid Production canonical origins fail closed", async () => {
  for (const configured of [
    undefined,
    "not-a-url",
    `${canonicalProductionOrigin}/path`,
    "http://public.example",
  ]) {
    if (configured === undefined) delete process.env.NEXT_PUBLIC_APP_URL;
    else process.env.NEXT_PUBLIC_APP_URL = configured;
    const response = await POST(request(JSON.stringify(eligibleInput)));
    assert.equal(response.status, 403);
    assert.deepEqual(await response.json(), {
      error: { code: "PRODUCTION_ORIGIN_REJECTED" },
    });
  }
  process.env.NEXT_PUBLIC_APP_URL = canonicalProductionOrigin;
});

await check("non-Production localhost keeps request URL origin behavior", async () => {
  process.env.NODE_ENV = "development";
  delete process.env.NEXT_PUBLIC_APP_URL;
  try {
    const response = await POST(
      request(
        JSON.stringify(eligibleInput),
        { origin: "http://localhost:3000" },
        "http://localhost:3000/api/consultations/purchase-eligibility",
      ),
    );
    assert.equal(response.status, 200);
  } finally {
    process.env.NODE_ENV = "production";
    process.env.NEXT_PUBLIC_APP_URL = canonicalProductionOrigin;
  }
});

await check("invalid JSON and Content-Type fail closed", async () => {
  const invalidJson = await POST(request("{"));
  assert.equal(invalidJson.status, 400);
  assert.deepEqual(await invalidJson.json(), {
    error: { code: "PRODUCTION_INVALID_JSON" },
  });

  const invalidContentType = await POST(
    request(JSON.stringify(eligibleInput), {
      "content-type": "text/plain",
    }),
  );
  assert.equal(invalidContentType.status, 415);
  assert.deepEqual(await invalidContentType.json(), {
    error: { code: "PRODUCTION_INVALID_CONTENT_TYPE" },
  });

  const invalidInput = await POST(
    request(JSON.stringify({ ...eligibleInput, unexpected: true })),
  );
  assert.equal(invalidInput.status, 400);
  assert.deepEqual(await invalidInput.json(), {
    error: { code: "PREPAYMENT_INVALID_REQUEST" },
  });
});

await check("oversized requests fail closed", async () => {
  const response = await POST(
    request(JSON.stringify({ value: "x".repeat(50_000) })),
  );
  assert.equal(response.status, 413);
  assert.deepEqual(await response.json(), {
    error: { code: "PRODUCTION_REQUEST_TOO_LARGE" },
  });
});

await check(
  "RequestForm uses Production eligibility while internal route stays unavailable",
  () => {
    const requestForm = readFileSync(
      new URL("../components/request/RequestForm.tsx", import.meta.url),
      "utf8",
    );
    const internalRoute = readFileSync(
      new URL(
        "../app/api/internal/purchase-eligibility/route.ts",
        import.meta.url,
      ),
      "utf8",
    );
    const internalEnvironment = readFileSync(
      new URL("../lib/assessment/runtime/environment.ts", import.meta.url),
      "utf8",
    );
    assert.match(
      requestForm,
      /fetch\("\/api\/consultations\/purchase-eligibility"/u,
    );
    assert.doesNotMatch(
      requestForm,
      /fetch\("\/api\/internal\/purchase-eligibility"/u,
    );
    assert.equal(process.env.NODE_ENV, "production");
    assert.match(internalRoute, /if \(!isInternalRuntimeAvailable\(\)\)/u);
    assert.match(
      internalRoute,
      /safeError\("PREPAYMENT_INTERNAL_API_UNAVAILABLE", 404\)/u,
    );
    assert.match(
      internalEnvironment,
      /process\.env\.NODE_ENV !== "production"/u,
    );
    assert.match(
      internalEnvironment,
      /process\.env\.M2_INTERNAL_RUNTIME_ENABLED === "true"/u,
    );
  },
);

console.log(`M1-4_PURCHASE_ELIGIBILITY_PRODUCTION_ROUTE: PASS ${passed}/9`);
