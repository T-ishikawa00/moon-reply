import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { registerHooks } from "node:module";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";

const root = process.cwd();
const correlationId = "8dfab9d0-bbe6-4e7e-8704-20a54570cc24";
const idempotencyKey = "fixed-idempotency-key";
const sensitiveConsultation = "SENSITIVE_CONSULTATION_SENTINEL";
const sensitiveEmail = "SENSITIVE_EMAIL_SENTINEL";
const sensitiveCapability = "SENSITIVE_CAPABILITY_SENTINEL";
const serializedBody = JSON.stringify({
  currentSituation: sensitiveConsultation,
  email: sensitiveEmail,
});

const routeState = {
  mode: "success",
  calls: [],
};
globalThis.preparationResponseRouteState = routeState;

const mockErrorsUrl = `data:text/javascript,${encodeURIComponent(`
export function asM2RuntimeError(error, fallback) {
  return {
    safeCode: typeof error?.safeCode === "string" ? error.safeCode : fallback,
    httpStatus: Number.isInteger(error?.httpStatus) ? error.httpStatus : 500,
  };
}
`)}`;
const mockServiceUrl = `data:text/javascript,${encodeURIComponent(`
export async function prepareProductionConsultation(input, idempotencyKey) {
  globalThis.preparationResponseRouteState.calls.push({ input, idempotencyKey });
  if (globalThis.preparationResponseRouteState.mode === "error") {
    throw { safeCode: "PRODUCTION_PREPARATION_IN_PROGRESS", httpStatus: 409 };
  }
  return {
    status: "purchase_ready",
    preparationCapability: "${sensitiveCapability}",
  };
}
`)}`;
const mockStrictJsonUrl = `data:text/javascript,${encodeURIComponent(`
export function enforceSameOrigin() {}
export async function readStrictJsonRequest(request) {
  return request.json();
}
`)}`;

function resolveLocalModule(specifier, parentURL) {
  const relative = specifier.startsWith("@/")
    ? specifier.slice(2)
    : specifier.startsWith("./") || specifier.startsWith("../")
      ? path.resolve(path.dirname(fileURLToPath(parentURL)), specifier)
      : null;
  if (relative === null) return null;
  const base = path.isAbsolute(relative) ? relative : path.join(root, relative);
  for (const candidate of [base, `${base}.ts`, `${base}.tsx`]) {
    if (existsSync(candidate)) return pathToFileURL(candidate).href;
  }
  return null;
}

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === "@/lib/assessment/runtime/errors") {
      return { url: mockErrorsUrl, shortCircuit: true };
    }
    if (specifier === "@/lib/assessment/production/service") {
      return { url: mockServiceUrl, shortCircuit: true };
    }
    if (specifier === "@/lib/http/strict-json-request") {
      return { url: mockStrictJsonUrl, shortCircuit: true };
    }
    if (specifier === "next/server") {
      return {
        url: pathToFileURL(path.join(root, "node_modules/next/server.js")).href,
        shortCircuit: true,
      };
    }
    const local = context.parentURL
      ? resolveLocalModule(specifier, context.parentURL)
      : null;
    if (local) return { url: local, shortCircuit: true };
    return nextResolve(specifier, context);
  },
  load(url, context, nextLoad) {
    if (url.startsWith("file:") && (url.endsWith(".ts") || url.endsWith(".tsx"))) {
      const source = readFileSync(fileURLToPath(url), "utf8");
      const transpiled = ts.transpileModule(source, {
        compilerOptions: {
          jsx: ts.JsxEmit.ReactJSX,
          module: ts.ModuleKind.ESNext,
          target: ts.ScriptTarget.ES2022,
          moduleResolution: ts.ModuleResolutionKind.Bundler,
          verbatimModuleSyntax: true,
        },
        fileName: fileURLToPath(url),
      });
      return { format: "module", source: transpiled.outputText, shortCircuit: true };
    }
    return nextLoad(url, context);
  },
});

const recovery = await import(
  pathToFileURL(
    path.join(
      root,
      "lib/assessment/production/preparation-response-recovery.ts",
    ),
  ).href
);
const route = await import(
  pathToFileURL(path.join(root, "app/api/consultations/prepare/route.ts")).href
);

let passed = 0;
async function check(name, run) {
  await run();
  passed += 1;
  console.log(`[PASS] ${name}`);
}

function purchaseReadyResponse(capability = sensitiveCapability) {
  return Response.json({
    data: { status: "purchase_ready", preparationCapability: capability },
  });
}

function safeErrorResponse(code, status = 503) {
  return Response.json({ error: { code } }, { status });
}

function decodePurchaseReady(value) {
  const data =
    typeof value === "object" && value !== null && !Array.isArray(value)
      ? value.data
      : null;
  if (
    typeof data === "object" &&
    data !== null &&
    !Array.isArray(data) &&
    data.status === "purchase_ready" &&
    typeof data.preparationCapability === "string"
  ) {
    return {
      status: "purchase_ready",
      preparationCapability: data.preparationCapability,
    };
  }
  return null;
}

function sequenceFetcher(sequence, calls) {
  return async (url, init) => {
    calls.push({ url, init });
    const next = sequence[calls.length - 1];
    if (next instanceof Error) throw next;
    assert.ok(next instanceof Response, "unexpected extra POST attempt");
    return next;
  };
}

function requestInput(sequence, calls, diagnostics = []) {
  return {
    endpoint: "/api/consultations/prepare",
    serializedBody,
    idempotencyKey,
    correlationId,
    decodeOutcome: decodePurchaseReady,
    fetcher: sequenceFetcher(sequence, calls),
    observe: (value) => diagnostics.push(value),
    now: (() => {
      let value = 100;
      return () => (value += 5);
    })(),
  };
}

function assertSameReplayAuthority(calls) {
  assert.equal(calls.length, 2);
  assert.equal(calls[0].init.body, serializedBody);
  assert.equal(calls[1].init.body, serializedBody);
  assert.equal(calls[0].init.headers["Idempotency-Key"], idempotencyKey);
  assert.equal(calls[1].init.headers["Idempotency-Key"], idempotencyKey);
  assert.equal(
    calls[0].init.headers[recovery.PREPARATION_RESPONSE_CORRELATION_HEADER],
    correlationId,
  );
  assert.equal(
    calls[1].init.headers[recovery.PREPARATION_RESPONSE_CORRELATION_HEADER],
    correlationId,
  );
  assert.equal(
    calls[0].init.headers[recovery.PREPARATION_RESPONSE_ATTEMPT_HEADER],
    "0",
  );
  assert.equal(
    calls[1].init.headers[recovery.PREPARATION_RESPONSE_ATTEMPT_HEADER],
    "1",
  );
}

await check("normal purchase_ready uses one POST", async () => {
  const calls = [];
  const diagnostics = [];
  const outcome = await recovery.postProductionPreparationWithRecovery(
    requestInput([purchaseReadyResponse()], calls, diagnostics),
  );
  assert.equal(calls.length, 1);
  assert.equal(outcome.preparationCapability, sensitiveCapability);
  assert.equal(diagnostics.at(-1).classification, "PURCHASE_READY");
  assert.equal(diagnostics.at(-1).attempt, 0);
});

await check("fetch rejection replays once with the same body and key", async () => {
  const calls = [];
  const diagnostics = [];
  const outcome = await recovery.postProductionPreparationWithRecovery(
    requestInput(
      [new Error("synthetic network rejection"), purchaseReadyResponse("newest-capability")],
      calls,
      diagnostics,
    ),
  );
  assertSameReplayAuthority(calls);
  assert.equal(outcome.preparationCapability, "newest-capability");
  assert.deepEqual(
    diagnostics.map(({ classification, attempt }) => ({ classification, attempt })),
    [
      { classification: "FETCH_REJECTED", attempt: 0 },
      { classification: "PURCHASE_READY", attempt: 1 },
    ],
  );
});

await check("invalid success response replays once with the same body and key", async () => {
  const calls = [];
  const diagnostics = [];
  const outcome = await recovery.postProductionPreparationWithRecovery(
    requestInput(
      [Response.json({ data: { status: "unexpected" } }), purchaseReadyResponse()],
      calls,
      diagnostics,
    ),
  );
  assertSameReplayAuthority(calls);
  assert.equal(outcome.status, "purchase_ready");
  assert.equal(diagnostics[0].classification, "RESPONSE_JSON_INVALID");
});

await check("undecodable success body replays once with the same body and key", async () => {
  const calls = [];
  const diagnostics = [];
  const outcome = await recovery.postProductionPreparationWithRecovery(
    requestInput(
      [new Response("not-json", { status: 200 }), purchaseReadyResponse()],
      calls,
      diagnostics,
    ),
  );
  assertSameReplayAuthority(calls);
  assert.equal(outcome.status, "purchase_ready");
  assert.equal(diagnostics[0].classification, "RESPONSE_JSON_INVALID");
});

await check("gateway 5xx without a safe envelope replays exactly once", async () => {
  const calls = [];
  const diagnostics = [];
  await recovery.postProductionPreparationWithRecovery(
    requestInput(
      [new Response("platform failure", { status: 502 }), purchaseReadyResponse()],
      calls,
      diagnostics,
    ),
  );
  assertSameReplayAuthority(calls);
  assert.equal(diagnostics[0].classification, "GATEWAY_HTTP_ERROR");
  assert.equal(diagnostics[0].httpStatus, 502);
});

await check("valid safe error envelope is never replayed", async () => {
  const calls = [];
  await assert.rejects(
    recovery.postProductionPreparationWithRecovery(
      requestInput(
        [safeErrorResponse("PRODUCTION_PREPARATION_RECOVERY_REQUIRED")],
        calls,
      ),
    ),
    (error) =>
      error instanceof recovery.PreparationResponseFailure &&
      error.diagnostic.classification === "HTTP_ERROR_WITH_SAFE_CODE" &&
      error.diagnostic.safeCode === "PRODUCTION_PREPARATION_RECOVERY_REQUIRED",
  );
  assert.equal(calls.length, 1);
});

await check("in-progress on attempt zero is never replayed", async () => {
  const calls = [];
  await assert.rejects(
    recovery.postProductionPreparationWithRecovery(
      requestInput(
        [safeErrorResponse("PRODUCTION_PREPARATION_IN_PROGRESS", 409)],
        calls,
      ),
    ),
    (error) =>
      error instanceof recovery.PreparationResponseFailure &&
      error.diagnostic.safeCode === "PRODUCTION_PREPARATION_IN_PROGRESS" &&
      error.diagnostic.attempt === 0,
  );
  assert.equal(calls.length, 1);
});

await check("in-progress on replay never produces a third request", async () => {
  const calls = [];
  await assert.rejects(
    recovery.postProductionPreparationWithRecovery(
      requestInput(
        [
          new Error("synthetic network rejection"),
          safeErrorResponse("PRODUCTION_PREPARATION_IN_PROGRESS", 409),
        ],
        calls,
      ),
    ),
    (error) =>
      error instanceof recovery.PreparationResponseFailure &&
      error.diagnostic.safeCode === "PRODUCTION_PREPARATION_IN_PROGRESS" &&
      error.diagnostic.attempt === 1,
  );
  assert.equal(calls.length, 2);
});

await check("two ambiguous failures stop at the hard two-attempt boundary", async () => {
  const calls = [];
  await assert.rejects(
    recovery.postProductionPreparationWithRecovery(
      requestInput(
        [new Error("first rejection"), new Error("second rejection")],
        calls,
      ),
    ),
    (error) =>
      error instanceof recovery.PreparationResponseFailure &&
      error.diagnostic.classification === "FETCH_REJECTED" &&
      error.diagnostic.attempt === 1,
  );
  assert.equal(calls.length, 2);
});

await check("arbitrary HTTP errors without a safe envelope are not replayed", async () => {
  const calls = [];
  await assert.rejects(
    recovery.postProductionPreparationWithRecovery(
      requestInput([new Response("bad request", { status: 400 })], calls),
    ),
    (error) =>
      error instanceof recovery.PreparationResponseFailure &&
      error.diagnostic.classification === "HTTP_ERROR_WITHOUT_SAFE_CODE",
  );
  assert.equal(calls.length, 1);
});

await check("client diagnostic logging excludes sensitive request and response data", async () => {
  const originalConsoleInfo = console.info;
  const logs = [];
  console.info = (...values) => logs.push(values);
  try {
    await recovery.postProductionPreparationWithRecovery({
      ...requestInput([purchaseReadyResponse()], []),
      observe: undefined,
    });
  } finally {
    console.info = originalConsoleInfo;
  }
  assert.equal(logs.length, 1);
  assert.deepEqual(Object.keys(logs[0][1]).sort(), [
    "attempt",
    "classification",
    "correlationId",
    "elapsedMilliseconds",
    "httpStatus",
    "safeCode",
  ]);
  const serializedLog = JSON.stringify(logs);
  for (const forbidden of [
    sensitiveConsultation,
    sensitiveEmail,
    sensitiveCapability,
    "consultation",
    "email",
    "capability",
    "token",
    "secret",
  ]) {
    assert.equal(serializedLog.toLowerCase().includes(forbidden.toLowerCase()), false);
  }
});

await check("route emits bounded correlated success and safe-error logs", async () => {
  const originalConsoleInfo = console.info;
  const logs = [];
  console.info = (...values) => logs.push(values);
  try {
    routeState.mode = "success";
    const success = await route.POST(
      new Request("https://customer.example/api/consultations/prepare", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": idempotencyKey,
          [recovery.PREPARATION_RESPONSE_CORRELATION_HEADER]: correlationId,
          [recovery.PREPARATION_RESPONSE_ATTEMPT_HEADER]: "1",
        },
        body: serializedBody,
      }),
    );
    assert.equal(success.status, 200);
    assert.equal(
      success.headers.get(recovery.PREPARATION_RESPONSE_CORRELATION_HEADER),
      correlationId,
    );
    assert.equal(logs.at(-1)[1].classification, "PURCHASE_READY");
    assert.equal(logs.at(-1)[1].attempt, 1);

    routeState.mode = "error";
    const failure = await route.POST(
      new Request("https://customer.example/api/consultations/prepare", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": idempotencyKey,
          [recovery.PREPARATION_RESPONSE_CORRELATION_HEADER]: correlationId,
        },
        body: serializedBody,
      }),
    );
    assert.equal(failure.status, 409);
    assert.deepEqual(await failure.json(), {
      error: { code: "PRODUCTION_PREPARATION_IN_PROGRESS" },
    });
    assert.equal(logs.at(-1)[1].classification, "HTTP_ERROR_WITH_SAFE_CODE");
    assert.equal(logs.at(-1)[1].safeCode, "PRODUCTION_PREPARATION_IN_PROGRESS");
  } finally {
    console.info = originalConsoleInfo;
  }
  for (const values of logs) {
    assert.deepEqual(Object.keys(values[1]).sort(), [
      "attempt",
      "classification",
      "correlationId",
      "elapsedMilliseconds",
      "httpStatus",
      "safeCode",
    ]);
  }
  const serializedLog = JSON.stringify(logs);
  for (const forbidden of [
    sensitiveConsultation,
    sensitiveEmail,
    sensitiveCapability,
    "consultation",
    "email",
    "capability",
    "token",
    "secret",
  ]) {
    assert.equal(serializedLog.toLowerCase().includes(forbidden.toLowerCase()), false);
  }
});

await check("RequestForm fixes body/key/correlation once and preserves UI semantics", async () => {
  const source = readFileSync(
    path.join(root, "components/request/RequestForm.tsx"),
    "utf8",
  );
  assert.match(source, /const serializedBody = JSON\.stringify\(\{/u);
  assert.match(source, /const correlationId = crypto\.randomUUID\(\);/u);
  assert.match(
    source,
    /postProductionPreparationWithRecovery\(\{[\s\S]*?serializedBody,[\s\S]*?idempotencyKey,[\s\S]*?correlationId,[\s\S]*?decodeOutcome: decodeProductionPreparation/u,
  );
  assert.doesNotMatch(
    source,
    /fetch\("\/api\/consultations\/prepare"/u,
  );
  assert.match(source, /if \(outcome\.status === "purchase_ready"\)/u);
  assert.match(source, /productionFlowMessage\("unavailable"\)/u);
});

console.log(`Preparation response recovery verifier: PASS ${passed}/${passed}`);
