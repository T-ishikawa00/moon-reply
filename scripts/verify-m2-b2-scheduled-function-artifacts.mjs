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
import { zipFunctions } from "@netlify/zip-it-and-ship-it";
import toml from "toml";

const root = process.cwd();
const functionRoot = path.join(root, "netlify", "functions");
const outputRoot = path.join(root, ".netlify", "scheduled-artifact-smoke");
const manifestPath = path.join(outputRoot, "manifest.json");
const expectedFunctions = new Map([
  ["production-fulfillment-dispatch-scheduled", "* * * * *"],
  ["production-payment-reconciliation-scheduled", "*/5 * * * *"],
]);

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
    `${path.basename(absolutePath)} node --check failed: ${checked.stderr}`,
  );
}

function extractZipArchive(archive, destinationRoot) {
  const bytes = readFileSync(archive);
  let end = -1;
  for (
    let index = bytes.length - 22;
    index >= Math.max(0, bytes.length - 65_557);
    index -= 1
  ) {
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
    assert.equal(
      bytes.readUInt32LE(cursor),
      0x02014b50,
      "ZIP central entry invalid",
    );
    const method = bytes.readUInt16LE(cursor + 10);
    const compressedSize = bytes.readUInt32LE(cursor + 20);
    const uncompressedSize = bytes.readUInt32LE(cursor + 24);
    const nameLength = bytes.readUInt16LE(cursor + 28);
    const extraLength = bytes.readUInt16LE(cursor + 30);
    const commentLength = bytes.readUInt16LE(cursor + 32);
    const localOffset = bytes.readUInt32LE(cursor + 42);
    const name = bytes
      .subarray(cursor + 46, cursor + 46 + nameLength)
      .toString("utf8");
    const destination = path.resolve(destinationRoot, name);
    assert.equal(
      destination === path.resolve(destinationRoot) ||
        destination.startsWith(allowedRoot),
      true,
      `ZIP entry escaped artifact root: ${name}`,
    );
    if (name.endsWith("/")) {
      mkdirSync(destination, { recursive: true });
    } else {
      assert.equal(
        bytes.readUInt32LE(localOffset),
        0x04034b50,
        "ZIP local entry invalid",
      );
      const localNameLength = bytes.readUInt16LE(localOffset + 26);
      const localExtraLength = bytes.readUInt16LE(localOffset + 28);
      const dataStart = localOffset + 30 + localNameLength + localExtraLength;
      const compressed = bytes.subarray(
        dataStart,
        dataStart + compressedSize,
      );
      const content =
        method === 0
          ? compressed
          : method === 8
            ? inflateRawSync(compressed)
            : null;
      assert.ok(content, `unsupported ZIP compression method: ${method}`);
      assert.equal(content.length, uncompressedSize, `ZIP size mismatch: ${name}`);
      mkdirSync(path.dirname(destination), { recursive: true });
      writeFileSync(destination, content);
    }
    cursor += 46 + nameLength + extraLength + commentLength;
  }
}

function artifactText(artifactRoot) {
  return filesBelow(artifactRoot)
    .filter((file) => /\.(?:c?js|mjs|json)$/u.test(file))
    .map((file) => readFileSync(file, "utf8"))
    .join("\n");
}

for (const name of [
  "AWL_API_KEY",
  "AWL_API_KEY_P100",
  "SUPABASE_URL",
  "SUPABASE_SECRET_KEY",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "PAYMENT_FULFILLMENT_DISPATCH_SCHEDULED_ENABLED",
  "STRIPE_RECONCILIATION_SCHEDULED_ENABLED",
  "OPENAI_API_KEY",
  "EMAIL_API_KEY",
]) {
  process.env[name] = "";
}

assert.equal(
  existsSync(outputRoot),
  false,
  "refusing to overwrite existing scheduled artifact output",
);

const netlifyConfig = toml.parse(
  readFileSync(path.join(root, "netlify.toml"), "utf8"),
);
const packagerConfig = {};
const sourcePaths = [];
for (const [name, schedule] of expectedFunctions) {
  assert.equal(netlifyConfig.functions?.[name]?.schedule, schedule);
  packagerConfig[name] = { schedule };
  sourcePaths.push(path.join(functionRoot, `${name}.mts`));
}

let fetchCalls = 0;
const originalFetch = globalThis.fetch;
globalThis.fetch = async () => {
  fetchCalls += 1;
  throw new Error("SCHEDULED_ARTIFACT_IMPORT_NETWORK_FORBIDDEN");
};

try {
  mkdirSync(outputRoot, { recursive: true });
  const packaged = await zipFunctions(
    { user: { functions: sourcePaths } },
    outputRoot,
    {
    archiveFormat: "zip",
    basePath: root,
    config: packagerConfig,
    manifest: manifestPath,
    parallelLimit: 1,
      repositoryRoot: root,
    },
  );
  assert.equal(packaged.length, expectedFunctions.size);
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  assert.equal(manifest.functions.length, expectedFunctions.size);

  for (const [name, schedule] of expectedFunctions) {
    const archive = path.join(outputRoot, `${name}.zip`);
    assert.equal(existsSync(archive), true, `${name} ZIP missing`);
    const extracted = path.join(outputRoot, name);
    mkdirSync(extracted, { recursive: true });
    extractZipArchive(archive, extracted);

    const entry = findEntry(extracted, `${name}.mjs`);
    assertNodeSyntax(entry);
    const text = artifactText(extracted);
    assert.doesNotMatch(
      text,
      /(?:\bfrom\s*|\bimport\s*|\brequire\(\s*)["']server-only["']/u,
      `${name} server-only static import`,
    );
    assert.doesNotMatch(text, /ERR_MODULE_NOT_FOUND/u, name);
    assert.equal(
      filesBelow(extracted).some((file) =>
        file.replaceAll("\\", "/").includes("/node_modules/server-only/"),
      ),
      false,
      `${name} server-only package leakage`,
    );

    const loaded = await import(
      `${pathToFileURL(entry).href}?scheduled-smoke=${Date.now()}`
    );
    assert.equal(typeof loaded.default, "function", `${name} importable`);
    const disabledResponse = await loaded.default();
    assert.equal(disabledResponse.status, 200, `${name} disabled status`);
    assert.deepEqual(
      await disabledResponse.json(),
      { disabled: true },
      `${name} disabled outcome`,
    );
    assert.equal(fetchCalls, 0, `${name} performed network activity on import`);

    const manifestEntry = manifest.functions.find(
      (candidate) => candidate.name === name,
    );
    assert.ok(manifestEntry, `${name} manifest entry missing`);
    assert.equal(manifestEntry.schedule, schedule);
    assert.equal(manifestEntry.bundler, "nft");
    assert.equal(manifestEntry.runtime, "js");
    assert.equal(
      manifestEntry.mainFile.replaceAll("\\", "/").endsWith(
        `/netlify/functions/${name}.mts`,
      ),
      true,
      `${name} manifest source path`,
    );
    assert.equal(
      path.resolve(manifestEntry.path),
      path.resolve(archive),
      `${name} manifest artifact path`,
    );

    console.log(
      `M2-B2 SCHEDULED ARTIFACT PASS function=${name} zip=1 syntax=1 importable=1 server_only=0 schedule=${schedule}`,
    );
  }

  console.log(
    "STRIPE_API_CALLS=0 ASYNC_EVENTS_SENT=0 SUPABASE_REMOTE_CALLS=0 PROVIDER_CALLS=0",
  );
} finally {
  globalThis.fetch = originalFetch;
  rmSync(outputRoot, { recursive: true, force: true });
}
