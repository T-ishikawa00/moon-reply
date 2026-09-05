import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { inflateRawSync } from "node:zlib";
import { zipFunctions } from "@netlify/zip-it-and-ship-it";
import toml from "toml";

export const productionFulfillmentBackgroundFunctionName =
  "production-fulfillment-background";

const requiredIncludedFiles = [
  "ai/prompts/**",
  "ai/schemas/**",
  "lib/assessment/runtime/contracts/**",
];

export function loadProductionFulfillmentBackgroundPackagerConfig(
  repositoryRoot,
) {
  const netlifyConfig = toml.parse(
    readFileSync(path.join(repositoryRoot, "netlify.toml"), "utf8"),
  );
  const functionConfig =
    netlifyConfig.functions?.[productionFulfillmentBackgroundFunctionName];
  assert.ok(functionConfig, "background function Netlify config missing");
  assert.deepEqual(
    functionConfig.included_files,
    requiredIncludedFiles,
    "background runtime included_files drifted",
  );
  return {
    [productionFulfillmentBackgroundFunctionName]: {
      includedFiles: [...functionConfig.included_files],
      includedFilesBasePath: repositoryRoot,
    },
  };
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

function relativeUnix(root, absolutePath) {
  return path.relative(root, absolutePath).replaceAll("\\", "/");
}

function resolveRepositoryAsset(repositoryRoot, relativePath) {
  assert.equal(typeof relativePath, "string");
  assert.notEqual(relativePath.length, 0);
  assert.equal(path.posix.isAbsolute(relativePath), false, relativePath);
  assert.equal(path.win32.isAbsolute(relativePath), false, relativePath);
  assert.equal(relativePath.startsWith("../"), false, relativePath);
  assert.doesNotMatch(relativePath, /\\/u, relativePath);
  assert.doesNotMatch(relativePath, /^[A-Za-z]:/u, relativePath);
  const resolvedRoot = path.resolve(repositoryRoot);
  const resolvedAsset = path.resolve(
    repositoryRoot,
    ...relativePath.split("/"),
  );
  assert.equal(
    resolvedAsset.startsWith(`${resolvedRoot}${path.sep}`),
    true,
    `runtime asset escaped repository root: ${relativePath}`,
  );
  return resolvedAsset;
}

function runtimeAssetInventory(repositoryRoot) {
  const contractsRoot = path.join(
    repositoryRoot,
    "lib",
    "assessment",
    "runtime",
    "contracts",
  );
  const catalogFiles = readdirSync(contractsRoot)
    .map((name) => {
      const matched = /^runtime-stage-catalog-v(\d+)\.json$/u.exec(name);
      return matched ? { name, version: Number.parseInt(matched[1], 10) } : null;
    })
    .filter(Boolean)
    .sort((left, right) => left.version - right.version);
  assert.deepEqual(
    catalogFiles.map(({ version }) => version),
    Array.from({ length: 16 }, (_, index) => index + 2),
    "runtime catalog chain must remain exact v2..v17",
  );

  const assets = new Set(["ai/prompts/prompt-bundle.manifest.json"]);
  for (const { name } of catalogFiles) {
    const catalogPath = path.posix.join(
      "lib/assessment/runtime/contracts",
      name,
    );
    assets.add(catalogPath);
    const catalog = JSON.parse(
      readFileSync(path.join(repositoryRoot, ...catalogPath.split("/")), "utf8"),
    );
    assets.add(catalog.common_prompt.prompt_path);
    for (const stage of catalog.stages) {
      for (const key of [
        "prompt_path",
        "schema_path",
        "grounded_schema_path",
        "clarification_schema_path",
      ]) {
        if (stage[key]) assets.add(stage[key]);
      }
    }
  }

  const ordered = [...assets].sort();
  for (const relativePath of ordered) {
    const absoluteAsset = resolveRepositoryAsset(repositoryRoot, relativePath);
    assert.equal(
      existsSync(absoluteAsset),
      true,
      `runtime asset missing from source: ${relativePath}`,
    );
  }
  return ordered;
}

function configuredSourceAssets(repositoryRoot) {
  const configured = [];
  for (const pattern of requiredIncludedFiles) {
    assert.match(pattern, /\/\*\*$/u, pattern);
    const relativeDirectory = pattern.slice(0, -3);
    const absoluteDirectory = path.join(
      repositoryRoot,
      ...relativeDirectory.split("/"),
    );
    assert.equal(existsSync(absoluteDirectory), true, relativeDirectory);
    configured.push(
      ...filesBelow(absoluteDirectory)
        // TypeScript modules are compiled into the function entry. This proof
        // targets files that remain runtime path assets inside the ZIP.
        .filter((file) => !/\.[cm]?[jt]sx?$/u.test(file))
        .map((file) => relativeUnix(repositoryRoot, file)),
    );
  }
  return [...new Set(configured)].sort();
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
  const resolvedRoot = path.resolve(destinationRoot);
  const allowedRoot = `${resolvedRoot}${path.sep}`;
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
      destination === resolvedRoot || destination.startsWith(allowedRoot),
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

function findEntry(artifactRoot, basename) {
  const matches = filesBelow(artifactRoot).filter(
    (file) => path.basename(file) === basename,
  );
  assert.equal(matches.length, 1, `${basename} matches=${matches.length}`);
  return matches[0];
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

async function run() {
  const root = process.cwd();
  for (const invalidPath of [
    "../outside.json",
    "..\\outside.json",
    "C:\\outside.json",
    "/outside.json",
  ]) {
    assert.throws(() => resolveRepositoryAsset(root, invalidPath));
  }
  const outputRoot = path.join(
    root,
    ".netlify",
    "background-runtime-assets-proof",
  );
  assert.equal(
    existsSync(outputRoot),
    false,
    "refusing to overwrite existing background runtime asset proof",
  );

  const runtimeAssets = runtimeAssetInventory(root);
  const configuredAssets = configuredSourceAssets(root);
  const configuredAssetSet = new Set(configuredAssets);
  for (const relativePath of runtimeAssets) {
    assert.equal(
      configuredAssetSet.has(relativePath),
      true,
      `runtime asset falls outside included_files: ${relativePath}`,
    );
  }

  const packagerConfig =
    loadProductionFulfillmentBackgroundPackagerConfig(root);
  mkdirSync(outputRoot, { recursive: true });
  try {
    const results = await zipFunctions(
      path.join(root, "netlify", "functions"),
      outputRoot,
      {
        archiveFormat: "zip",
        basePath: root,
        config: packagerConfig,
        manifest: path.join(outputRoot, "manifest.json"),
        parallelLimit: 1,
        repositoryRoot: root,
      },
    );
    const background = results.find(
      ({ name }) => name === productionFulfillmentBackgroundFunctionName,
    );
    assert.ok(background, "packaged background function missing");
    assert.deepEqual(
      background.config.includedFiles,
      requiredIncludedFiles,
      "packaged background includedFiles drifted",
    );
    assert.equal(background.config.includedFilesBasePath, root);

    const repositorySourceInputs = background.inputs
      .filter((input) => {
        const relativePath = relativeUnix(root, input);
        return (
          !relativePath.startsWith("../") &&
          !relativePath.startsWith("node_modules/") &&
          /\.[cm]?[jt]sx?$/u.test(relativePath)
        );
      })
      .map((input) => relativeUnix(root, input));
    const dynamicAssetReaders = repositorySourceInputs
      .filter((relativePath) => {
        const source = readFileSync(path.join(root, relativePath), "utf8");
        return (
          /from\s+["']node:fs(?:\/promises)?["']/u.test(source) &&
          /\breadFile(?:Sync)?\s*\(/u.test(source)
        );
      })
      .sort();
    assert.deepEqual(
      dynamicAssetReaders,
      ["lib/assessment/runtime/schema-catalog.ts"],
      "worker dynamic filesystem reader inventory drifted",
    );
    assert.match(
      readFileSync(path.join(root, dynamicAssetReaders[0]), "utf8"),
      /process\.cwd\(\)/u,
    );

    const archive = background.path;
    const archiveHashBefore = sha256(readFileSync(archive));
    const artifactRoot = path.join(outputRoot, "unpacked");
    mkdirSync(artifactRoot, { recursive: true });
    extractZipArchive(archive, artifactRoot);
    assert.equal(sha256(readFileSync(archive)), archiveHashBefore);

    const artifactFiles = filesBelow(artifactRoot);
    const artifactRelativeFiles = new Set(
      artifactFiles.map((file) => relativeUnix(artifactRoot, file)),
    );
    for (const relativePath of configuredAssets) {
      assert.equal(
        artifactRelativeFiles.has(relativePath),
        true,
        `configured asset missing from artifact: ${relativePath}`,
      );
    }
    for (const relativePath of runtimeAssets) {
      assert.equal(
        artifactRelativeFiles.has(relativePath),
        true,
        `runtime asset missing from artifact: ${relativePath}`,
      );
    }

    assert.equal(
      artifactFiles.some((file) =>
        relativeUnix(artifactRoot, file).includes("node_modules/server-only/"),
      ),
      false,
      "server-only package leaked into artifact",
    );
    const artifactText = artifactFiles
      .filter((file) => /\.(?:c?js|mjs)$/u.test(file))
      .map((file) => readFileSync(file, "utf8"))
      .join("\n");
    assert.doesNotMatch(
      artifactText,
      /(?:\bfrom\s*|\bimport\s*|\brequire\(\s*)["']server-only["']/u,
      "server-only import leaked into artifact graph",
    );

    const backgroundEntry = findEntry(
      artifactRoot,
      `${productionFulfillmentBackgroundFunctionName}.mjs`,
    );
    const entryBytes = readFileSync(backgroundEntry);
    const entryHash = sha256(entryBytes);
    const entryText = entryBytes.toString("utf8");
    assert.match(
      entryText,
      /async function loadM2P4FinalProductRecoveryRuntimeStageCatalog\(\)/u,
      "compiled runtime loader missing from background artifact",
    );
    // The production factory dynamically imports the catalog. esbuild moves
    // module-level state (including OpenAI schema projection keyword Sets) into
    // lazy __esm initializers. A direct export of the inner loader bypasses
    // those initializers and is not a valid packaged-runtime execution path.
    const factory = /async function createProductionAssessmentApplication\(options\) \{([\s\S]*?)\n  const environment = readProductionAssessmentEnvironment\(\);/u.exec(entryText);
    assert.ok(factory, "compiled production application factory missing");
    const catalogImport = /Promise\.resolve\(\)\.then\(\(\) => \(init_schema_catalog\(\), schema_catalog_exports\)\)/u.exec(factory[1]);
    assert.ok(catalogImport, "production factory catalog initialization path missing");
    assert.equal(factory[1].split(catalogImport[0]).length - 1, 1);
    const probeModule = path.join(
      path.dirname(backgroundEntry),
      "production-fulfillment-background-runtime-assets-proof.mjs",
    );
    writeFileSync(
      probeModule,
      `${entryText}
export async function __m1RuntimeCatalogLoader() {
  const { loadM2P4FinalProductRecoveryRuntimeStageCatalog: loadCatalog } = await ${catalogImport[0]};
  return loadCatalog();
}
`,
      "utf8",
    );
    assert.equal(sha256(readFileSync(backgroundEntry)), entryHash);

    const probe = String.raw`
      import assert from "node:assert/strict";
      import { pathToFileURL } from "node:url";
      assert.equal(process.cwd(), process.env.M1_RUNTIME_ARTIFACT_ROOT);
      let networkCalls = 0;
      globalThis.fetch = async () => {
        networkCalls += 1;
        throw new Error("M1_UNEXPECTED_NETWORK_CALL");
      };
      const packaged = await import(
        pathToFileURL(process.env.M1_RUNTIME_PROBE_MODULE).href + "?proof=" + Date.now()
      );
      const catalog = await packaged.__m1RuntimeCatalogLoader();
      assert.equal(catalog.catalogVersion, "runtime-stage-catalog-v17.0.0");
      assert.equal(catalog.promptBundleVersion, "prompt-bundle-runtime-v17.0.0");
      assert.equal(catalog.schemaSetVersion, "pipeline-schema-runtime-v6.0.0");
      assert.equal(catalog.definitions.length, 7);
      assert.equal(networkCalls, 0);
      console.log("M1-4 PACKAGED BACKGROUND RUNTIME LOADER PASS cwd=artifact initialization=production-dynamic-import catalog=v17 stages=7 enoent=0");
      console.log("NETWORK_CALLS=0 REAL_PROVIDER_CALLS=0 REMOTE_OPERATIONS=0 ASYNC_EVENTS_SENT=0");
    `;
    const loaded = spawnSync(
      process.execPath,
      ["--input-type=module", "--eval", probe],
      {
        cwd: artifactRoot,
        encoding: "utf8",
        env: {
          ...process.env,
          AWL_API_KEY: "",
          AWL_API_KEY_P100: "",
          EMAIL_API_KEY: "",
          M1_RUNTIME_ARTIFACT_ROOT: artifactRoot,
          M1_RUNTIME_PROBE_MODULE: probeModule,
          OPENAI_API_KEY: "",
          STRIPE_SECRET_KEY: "",
          SUPABASE_SECRET_KEY: "",
          SUPABASE_URL: "",
        },
      },
    );
    assert.equal(
      loaded.status,
      0,
      `artifact runtime loader failed: ${loaded.stderr}\n${loaded.stdout}`,
    );
    assert.equal(sha256(readFileSync(backgroundEntry)), entryHash);
    assert.equal(sha256(readFileSync(archive)), archiveHashBefore);
    process.stdout.write(loaded.stdout);

    const missingRuntimeAssets = runtimeAssets.filter(
      (relativePath) => !artifactRelativeFiles.has(relativePath),
    );
    assert.deepEqual(missingRuntimeAssets, []);
    console.log(
      `M1-4 BACKGROUND RUNTIME ASSET PACKAGING PASS readers=${dynamicAssetReaders.length} configured=${configuredAssets.length} required=${runtimeAssets.length} missing=0 server_only=0`,
    );
  } finally {
    const expectedOutputRoot = path.resolve(
      root,
      ".netlify",
      "background-runtime-assets-proof",
    );
    assert.equal(path.resolve(outputRoot), expectedOutputRoot);
    rmSync(outputRoot, { recursive: true, force: true });
  }
}

const isDirectExecution =
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));

if (isDirectExecution) {
  await run();
}
