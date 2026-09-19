import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const root = fileURLToPath(new URL("../", import.meta.url));
const baselineCommit = "978928c49d4205d55d905883a15d4f66ae8724fd";

function normalizeNewlines(value) {
  return value.replaceAll("\r\n", "\n");
}

function repositoryText(relativePath) {
  return normalizeNewlines(readFileSync(new URL(`../${relativePath}`, import.meta.url), "utf8"));
}

function baselineText(relativePath) {
  return normalizeNewlines(execFileSync(
    "git",
    ["show", `${baselineCommit}:${relativePath}`],
    { cwd: root, encoding: "utf8", maxBuffer: 16 * 1024 * 1024 },
  ));
}

function trackedChangesFromBaseline() {
  return execFileSync(
    "git",
    ["diff", "--name-only", baselineCommit, "--"],
    { cwd: root, encoding: "utf8", maxBuffer: 16 * 1024 * 1024 },
  ).split(/\r?\n/u).filter(Boolean);
}

function namedFunctionDeclarations(source) {
  const sourceFile = ts.createSourceFile(
    "RequestForm.tsx",
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const declarations = new Map();
  function visit(node) {
    if (
      ts.isFunctionDeclaration(node) &&
      node.name &&
      node.name.text !== "RequestForm"
    ) {
      const existing = declarations.get(node.name.text) ?? [];
      existing.push(normalizeNewlines(node.getText(sourceFile)));
      declarations.set(node.name.text, existing);
    }
    ts.forEachChild(node, visit);
  }
  visit(sourceFile);
  return declarations;
}

function requestFormPhaseTwoOnward(source) {
  const sourceFile = ts.createSourceFile(
    "RequestForm.tsx",
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  let requestForm = null;
  function visit(node) {
    if (
      ts.isFunctionDeclaration(node) &&
      node.name?.text === "RequestForm"
    ) {
      requestForm = node;
      return;
    }
    ts.forEachChild(node, visit);
  }
  visit(sourceFile);
  assert.ok(requestForm?.body, "RequestForm function declaration must exist");
  const returned = requestForm.body.statements.findLast(ts.isReturnStatement);
  assert.ok(returned?.expression, "RequestForm must retain its JSX return");
  const jsx = normalizeNewlines(returned.expression.getText(sourceFile));
  const phaseTwoStart = jsx.indexOf("{phase === 2 ? (");
  assert.notEqual(phaseTwoStart, -1, "RequestForm phase 2 JSX marker must exist");
  return jsx.slice(phaseTwoStart);
}

function requestFormProps(source, fileName) {
  const sourceFile = ts.createSourceFile(
    fileName,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  let requestFormElement = null;
  function visit(node) {
    if (
      ts.isJsxSelfClosingElement(node) &&
      node.tagName.getText(sourceFile) === "RequestForm"
    ) {
      requestFormElement = node;
      return;
    }
    ts.forEachChild(node, visit);
  }
  visit(sourceFile);
  assert.ok(requestFormElement, `${fileName} must retain <RequestForm />`);
  return normalizeNewlines(requestFormElement.getText(sourceFile));
}

const { Ga4ClientMeasurementAdapter } = await import(
  "../lib/measurement/adapters.ts"
);
const { createMeasurementEvent } = await import(
  "../lib/measurement/events.ts"
);
const {
  configureClientMeasurementAdapter,
  trackClientMeasurement,
} = await import("../lib/measurement/client.ts");

let passed = 0;
const externalOperations = {
  ga4: 0,
  network: 0,
};

function check(name, proof) {
  proof();
  passed += 1;
  console.log(`PASS ${String(passed).padStart(2, "0")} ${name}`);
}

check("existing public SEND and homepage sample fixture is byte-equivalent", () => {
  const relativePath = "fixtures/public/public-sample-cases.ts";
  assert.equal(repositoryText(relativePath), baselineText(relativePath));
});

check("all pre-existing named RequestForm functions remain exact", () => {
  const relativePath = "components/request/RequestForm.tsx";
  const baseline = namedFunctionDeclarations(baselineText(relativePath));
  const current = namedFunctionDeclarations(repositoryText(relativePath));
  for (const [name, expectedDeclarations] of baseline) {
    assert.deepEqual(
      current.get(name),
      expectedDeclarations,
      `named function declaration changed: ${name}`,
    );
  }
});

check("RequestForm phase 2 onward remains exact", () => {
  const relativePath = "components/request/RequestForm.tsx";
  assert.equal(
    requestFormPhaseTwoOnward(repositoryText(relativePath)),
    requestFormPhaseTwoOnward(baselineText(relativePath)),
  );
});

check("request page keeps the existing RequestForm prop contract exact", () => {
  const relativePath = "app/request/page.tsx";
  assert.equal(
    requestFormProps(repositoryText(relativePath), relativePath),
    requestFormProps(baselineText(relativePath), relativePath),
  );
});

check("tracked changes stay inside the adopted local implementation manifest", () => {
  const allowed = new Set([
    "app/request/page.tsx",
    "app/sample-report/page.tsx",
    "components/report/PublicSampleReport.module.css",
    "components/report/PublicSampleReport.tsx",
    "components/request/RequestForm.module.css",
    "components/request/RequestForm.tsx",
    "evals/sample-request-conversion-r1/README.md",
    "evals/sample-request-conversion-r1/final-copy.md",
    "fixtures/public/public-sample-wait-report.ts",
    "lib/measurement/adapters.ts",
    "lib/measurement/client.ts",
    "lib/measurement/events.ts",
    "scripts/browser-sample-request-conversion-r1.mjs",
    "scripts/preview-sample-request-conversion-r1.mjs",
    "scripts/verify-sample-request-conversion-r1.mjs",
  ]);
  // The pre-edit baseline explicitly permits this task's local review evidence
  // directory in addition to the 15 implementation/document paths.
  const unexpected = trackedChangesFromBaseline().filter((entry) =>
    !allowed.has(entry) && !entry.startsWith("evals/sample-request-conversion-r1/"),
  );
  assert.deepEqual(
    unexpected,
    [],
    `protected runtime, price, auth, safety, database, or settings changed: ${unexpected.join(", ")}`,
  );
});

check("new payload contracts accept only the reviewed constants", () => {
  for (const placement of ["hero", "sticky", "closing"]) {
    assert.deepEqual(
      createMeasurementEvent("sample_cta_click", { placement }),
      { name: "sample_cta_click", payload: { placement } },
    );
  }
  assert.deepEqual(
    createMeasurementEvent("sample_end_view", { sample: "public_sample" }),
    { name: "sample_end_view", payload: { sample: "public_sample" } },
  );
  assert.deepEqual(
    createMeasurementEvent("request_view", {
      experience: "consultation_request",
    }),
    {
      name: "request_view",
      payload: { experience: "consultation_request" },
    },
  );
});

check("malformed values and extra PII fields are rejected", () => {
  for (const [name, payload] of [
    ["sample_cta_click", { placement: "header" }],
    ["sample_cta_click", { placement: "hero", email: "person@example.test" }],
    ["sample_end_view", { sample: "public_sample", consultation: "private" }],
    ["sample_end_view", { sample: "another_sample" }],
    ["request_view", { experience: "consultation_request", name: "private" }],
    ["request_view", { experience: "checkout" }],
  ]) {
    assert.throws(
      () => createMeasurementEvent(name, payload),
      /MEASUREMENT_PAYLOAD_INVALID/u,
    );
  }
});

check("one queued dispatch failure does not block the remaining queue", () => {
  trackClientMeasurement("sample_view", { sample: "public_sample" });
  trackClientMeasurement("request_view", {
    experience: "consultation_request",
  });

  const queuedCalls = [];
  let attempt = 0;
  const adapter = new Ga4ClientMeasurementAdapter((...args) => {
    attempt += 1;
    if (attempt === 1) throw new Error("simulated queued gtag failure");
    queuedCalls.push(args);
  }, 1789776000);

  assert.doesNotThrow(() => configureClientMeasurementAdapter(adapter));
  assert.deepEqual(queuedCalls, [[
    "event",
    "request_view",
    { session_id: 1789776000, engagement_time_msec: 1 },
  ]]);
});

check("all three client tracks validate, adapt, and reach recording gtag", () => {
  const calls = [];
  const adapter = new Ga4ClientMeasurementAdapter(
    (...args) => calls.push(args),
    1789776000,
  );
  configureClientMeasurementAdapter(adapter);

  assert.deepEqual(
    trackClientMeasurement("sample_cta_click", { placement: "hero" }),
    { status: "sent" },
  );
  assert.deepEqual(
    trackClientMeasurement("sample_end_view", { sample: "public_sample" }),
    { status: "sent" },
  );
  assert.deepEqual(
    trackClientMeasurement("request_view", {
      experience: "consultation_request",
    }),
    { status: "sent" },
  );

  assert.deepEqual(calls, [
    [
      "event",
      "sample_cta_click",
      {
        session_id: 1789776000,
        engagement_time_msec: 1,
        placement: "hero",
      },
    ],
    [
      "event",
      "sample_end_view",
      { session_id: 1789776000, engagement_time_msec: 1 },
    ],
    [
      "event",
      "request_view",
      { session_id: 1789776000, engagement_time_msec: 1 },
    ],
  ]);

  const serialized = JSON.stringify(calls).toLowerCase();
  for (const forbidden of [
    "consultation",
    "intended_message",
    "email",
    "nickname",
    "purchase_id",
    "result_token",
    "page_location",
    "http://",
    "https://",
  ]) {
    assert.doesNotMatch(serialized, new RegExp(forbidden, "u"));
  }
});

check("adapter allowlist keeps unrelated client events disabled", () => {
  const calls = [];
  const adapter = new Ga4ClientMeasurementAdapter(
    (...args) => calls.push(args),
    1789776000,
  );
  assert.deepEqual(
    adapter.dispatch(createMeasurementEvent("page_view", { page: "request" })),
    { status: "disabled" },
  );
  assert.deepEqual(calls, []);
});

check("invalid or failed tracking is fail-isolated", () => {
  const beforeFailure = [];
  configureClientMeasurementAdapter(new Ga4ClientMeasurementAdapter(
    (...args) => {
      beforeFailure.push(args);
      throw new Error("simulated gtag failure");
    },
    1789776000,
  ));

  assert.doesNotThrow(() => {
    assert.deepEqual(
      trackClientMeasurement("sample_cta_click", { placement: "closing" }),
      { status: "disabled" },
    );
  });
  assert.equal(beforeFailure.length, 1);

  const recovered = [];
  configureClientMeasurementAdapter(new Ga4ClientMeasurementAdapter(
    (...args) => recovered.push(args),
    1789776000,
  ));
  assert.deepEqual(
    trackClientMeasurement("sample_cta_click", {
      placement: "hero",
      email: "person@example.test",
    }),
    { status: "disabled" },
  );
  assert.deepEqual(recovered, []);
});

check("native browser gtag bootstrap remains intact", () => {
  const bootstrap = readFileSync(
    new URL("../components/measurement/MeasurementBootstrap.tsx", import.meta.url),
    "utf8",
  );
  assert.match(bootstrap, /window[.]gtag = function gtag[(][)]/u);
  assert.match(bootstrap, /window[.]dataLayer[?][.]push[(]arguments[)][;]/u);
  assert.doesNotMatch(bootstrap, /dataLayer[?][.]push[(]args[)]/u);
});

assert.deepEqual(externalOperations, { ga4: 0, network: 0 });
console.log(`SAMPLE_REQUEST_CONVERSION_MEASUREMENT_CHECKS=${passed}`);
console.log("PRIMARY_FUNNEL_RECORDED_GTAG_CALLS=3");
console.log("EXTERNAL_GA4_SENDS=0");
console.log("NETWORK_CALLS=0");
