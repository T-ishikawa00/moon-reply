import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { inflateRawSync } from "node:zlib";
import { build } from "esbuild";

const root = process.cwd();
const generatedRoot = path.join(root, ".netlify", "functions-internal");
const outputRoot = path.join(root, ".netlify", "artifact-smoke");
const routerSource = path.join(generatedRoot, "async-workloads-router.mjs");
const eventName = "production.fulfillment.job.v1";

function failIfPresent(absolutePath) {
  assert.equal(
    existsSync(absolutePath),
    false,
    `refusing to overwrite existing generated path: ${path.relative(root, absolutePath)}`,
  );
}

function filesBelow(absolutePath) {
  const result = [];
  const pending = [absolutePath];
  while (pending.length > 0) {
    const current = pending.pop();
    for (const item of readdirSync(current, { withFileTypes: true })) {
      const child = path.join(current, item.name);
      if (item.isDirectory()) pending.push(child);
      else result.push(child);
    }
  }
  return result;
}

function findEntry(artifactRoot, basename) {
  const matches = filesBelow(artifactRoot).filter(
    (file) => path.basename(file) === basename,
  );
  assert.equal(matches.length, 1, `${basename} matches=${matches.length}`);
  return matches[0];
}

function assertNodeSyntax(absolutePath) {
  const checked = spawnSync(process.execPath, ["--check", absolutePath], {
    cwd: root,
    encoding: "utf8",
  });
  assert.equal(
    checked.status,
    0,
    `${path.basename(absolutePath)} node --check failed: ${checked.stderr}\n${readFileSync(
      absolutePath,
      "utf8",
    )
      .split(/\r?\n/u)
      .slice(18, 36)
      .join("\n")}`,
  );
}

function extractZipArchive(archive, destinationRoot) {
  const bytes = readFileSync(archive);
  let end = -1;
  for (let index = bytes.length - 22; index >= Math.max(0, bytes.length - 65_557); index -= 1) {
    if (bytes.readUInt32LE(index) === 0x06054b50) {
      end = index;
      break;
    }
  }
  assert.notEqual(end, -1, "ZIP end record missing");
  const entries = bytes.readUInt16LE(end + 10);
  let cursor = bytes.readUInt32LE(end + 16);
  const allowedRoot = `${path.resolve(destinationRoot)}${path.sep}`;
  for (let index = 0; index < entries; index += 1) {
    assert.equal(bytes.readUInt32LE(cursor), 0x02014b50, "ZIP central entry invalid");
    const method = bytes.readUInt16LE(cursor + 10);
    const compressedSize = bytes.readUInt32LE(cursor + 20);
    const uncompressedSize = bytes.readUInt32LE(cursor + 24);
    const nameLength = bytes.readUInt16LE(cursor + 28);
    const extraLength = bytes.readUInt16LE(cursor + 30);
    const commentLength = bytes.readUInt16LE(cursor + 32);
    const localOffset = bytes.readUInt32LE(cursor + 42);
    const name = bytes.subarray(cursor + 46, cursor + 46 + nameLength).toString("utf8");
    const destination = path.resolve(destinationRoot, name);
    assert.equal(
      destination === path.resolve(destinationRoot) || destination.startsWith(allowedRoot),
      true,
      `ZIP entry escaped artifact root: ${name}`,
    );
    if (name.endsWith("/")) {
      mkdirSync(destination, { recursive: true });
    } else {
      assert.equal(bytes.readUInt32LE(localOffset), 0x04034b50, "ZIP local entry invalid");
      const localNameLength = bytes.readUInt16LE(localOffset + 26);
      const localExtraLength = bytes.readUInt16LE(localOffset + 28);
      const dataStart = localOffset + 30 + localNameLength + localExtraLength;
      const compressed = bytes.subarray(dataStart, dataStart + compressedSize);
      const content = method === 0 ? compressed : method === 8 ? inflateRawSync(compressed) : null;
      assert.ok(content, `unsupported ZIP compression method: ${method}`);
      assert.equal(content.length, uncompressedSize, `ZIP size mismatch: ${name}`);
      mkdirSync(path.dirname(destination), { recursive: true });
      writeFileSync(destination, content);
    }
    cursor += 46 + nameLength + extraLength + commentLength;
  }
}

function bundleFunction(sourceRoot, destinationRoot, functionName, config) {
  const cli = path.join(
    root,
    "node_modules",
    "@netlify",
    "zip-it-and-ship-it",
    "bin.js",
  );
  const bundled = spawnSync(
    process.execPath,
    [
      cli,
      sourceRoot,
      destinationRoot,
      "--archive-format",
      "zip",
      "--manifest",
      path.join(destinationRoot, "manifest.json"),
      "--parallel-limit",
      "1",
      "--config",
      JSON.stringify(config),
    ],
    { cwd: root, encoding: "utf8" },
  );
  assert.equal(
    bundled.status,
    0,
    `Netlify function packaging failed: ${bundled.stderr}`,
  );
  const archive = path.join(destinationRoot, `${functionName}.zip`);
  assert.equal(existsSync(archive), true, `${functionName} archive missing`);
  const extracted = path.join(destinationRoot, functionName);
  mkdirSync(extracted, { recursive: true });
  extractZipArchive(archive, extracted);
  assert.equal(
    existsSync(extracted),
    true,
    `${functionName} unpacked artifact missing`,
  );
  return extracted;
}

function artifactText(artifactRoot) {
  return filesBelow(artifactRoot)
    .filter((file) => /\.(?:c?js|mjs|json)$/u.test(file))
    .map((file) => readFileSync(file, "utf8"))
    .join("\n");
}

function manifestFor(artifactRoot) {
  const manifests = filesBelow(artifactRoot).filter(
    (file) => path.basename(file) === "manifest.json",
  );
  assert.equal(manifests.length, 1, `manifest matches=${manifests.length}`);
  return JSON.parse(readFileSync(manifests[0], "utf8"));
}

for (const name of [
  "AWL_API_KEY",
  "AWL_API_KEY_P100",
  "SUPABASE_URL",
  "SUPABASE_SECRET_KEY",
  "OPENAI_API_KEY",
  "EMAIL_API_KEY",
  "STRIPE_SECRET_KEY",
]) {
  process.env[name] = "";
}
process.env.CONTEXT = "production";
process.env.URL = "https://artifact-smoke.invalid";
process.env.DEPLOY_URL = "https://artifact-smoke.invalid";

failIfPresent(generatedRoot);
failIfPresent(outputRoot);

try {
  mkdirSync(generatedRoot, { recursive: true });
  mkdirSync(outputRoot, { recursive: true });
  writeFileSync(
    routerSource,
    [
      'import { run } from "@netlify/async-workloads/_internal/router.js";',
      'import { asyncWorkloadConfig } from "../../netlify/functions/production-fulfillment-background.mts";',
      'import { PRODUCTION_FULFILLMENT_EVENT_NAME } from "../../lib/payment/production/async-workloads-contract.ts";',
      "",
      "const mappings = [{",
      "  config: { ...asyncWorkloadConfig, events: [PRODUCTION_FULFILLMENT_EVENT_NAME] },",
      "  workloadMapping: {",
      '    fnName: "production-fulfillment-background",',
      '    fnPath: "netlify/functions/production-fulfillment-background.mts",',
      '    urlPath: "/.netlify/functions/production-fulfillment-background",',
      "  },",
      "}];",
      "",
      "export default (request, context) => run(request, context, mappings);",
      "",
    ].join("\n"),
    "utf8",
  );

  const subscriberRoot = bundleFunction(
    path.join(root, "netlify", "functions"),
    path.join(outputRoot, "subscriber"),
    "production-fulfillment-background",
    {},
  );
  const routerRoot = path.join(outputRoot, "router");
  mkdirSync(routerRoot, { recursive: true });
  // The Async Workloads buildhook emits this internal router source before
  // Netlify packages functions. Bundle that generated source directly so the
  // smoke test exercises the dependency graph that caused the production
  // bootstrap failure, instead of substituting a source-only assertion.
  await build({
    entryPoints: [routerSource],
    outfile: path.join(routerRoot, "async-workloads-router.mjs"),
    bundle: true,
    format: "esm",
    platform: "node",
    target: "node24",
  });

  const subscriberOutput = path.join(outputRoot, "subscriber");
  assert.equal(existsSync(subscriberRoot), true, "subscriber artifact missing");
  assert.equal(existsSync(routerRoot), true, "router artifact missing");

  const subscriberEntry = findEntry(
    subscriberRoot,
    "production-fulfillment-background.mjs",
  );
  const routerEntry = findEntry(routerRoot, "async-workloads-router.mjs");
  assertNodeSyntax(subscriberEntry);
  assertNodeSyntax(routerEntry);

  const subscriberArtifact = artifactText(subscriberRoot);
  const routerArtifact = artifactText(routerRoot);
  for (const [name, text] of [
    ["subscriber", subscriberArtifact],
    ["router", routerArtifact],
  ]) {
    assert.doesNotMatch(
      text,
      /(?:\bfrom\s*|\bimport\s*|\brequire\(\s*)["']server-only["']/u,
      name,
    );
    assert.doesNotMatch(text, /ERR_MODULE_NOT_FOUND/u, name);
    assert.equal(
      text.includes(eventName),
      true,
      `${name} event contract missing; fulfillment tokens=${[
        ...text.matchAll(/.{0,64}fulfillment.{0,128}/giu),
      ]
        .slice(0, 8)
        .map((match) => match[0])
        .join(" | ")}`,
    );
  }
  for (const artifactRoot of [subscriberRoot, routerRoot]) {
    assert.equal(
      filesBelow(artifactRoot).some((file) =>
        file.replaceAll("\\", "/").includes("/node_modules/server-only/"),
      ),
      false,
      "server-only package leaked into artifact graph",
    );
  }
  assert.match(subscriberArtifact, /asyncWorkloadConfig/u);
  assert.match(routerArtifact, /production-fulfillment-background/u);

  const outputManifest = manifestFor(subscriberOutput);
  const subscriberManifest = outputManifest.functions.find(
    (entry) => entry.name === "production-fulfillment-background",
  );
  assert.ok(subscriberManifest, "subscriber manifest entry missing");
  assert.equal(subscriberManifest.bundler, "nft");
  assert.equal(subscriberManifest.invocationMode, "background");
  assert.equal(path.extname(subscriberEntry), ".mjs");

  const loadedSubscriber = await import(
    `${pathToFileURL(subscriberEntry).href}?smoke=${Date.now()}`
  );
  assert.equal(typeof loadedSubscriber.default, "function");
  assert.deepEqual(loadedSubscriber.asyncWorkloadConfig.events, [eventName]);

  const loadedRouter = await import(
    `${pathToFileURL(routerEntry).href}?smoke=${Date.now()}`
  );
  assert.equal(typeof loadedRouter.default, "function");

  console.log("M1-4 GENERATED ROUTER ARTIFACT SMOKE PASS importable=1 server_only=0");
  console.log(
    "M1-4 GENERATED BACKGROUND ARTIFACT SMOKE PASS importable=1 invocation=background contract=production.fulfillment.job.v1",
  );
  console.log("REAL_PROVIDER_CALLS=0 REMOTE_OPERATIONS=0 ASYNC_EVENTS_SENT=0");
} finally {
  rmSync(outputRoot, { recursive: true, force: true });
  rmSync(generatedRoot, { recursive: true, force: true });
}
