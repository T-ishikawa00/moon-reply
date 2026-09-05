import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const F013_BASELINE = "fcffe9a0a0424c308f70130e95a7f8cb69173779";
const baselineLockSha256 = "7b65887b40cc651037a15c07cf37d60817fde8fa5453dfa4f5b012221dd7b668";
export const F013_LOCK_SHA256 = "ed4490445b405237a7e4d27137ef4d468932311837da0e790ef19ab4d773c242";

// Registry integrity values recorded on 2026-09-06. These are package tarball
// hashes, checked by npm during the --ignore-scripts installation.
const updates = {
  "baseline-browser-mapping": ["2.10.42", "2.11.21", "sha512-uh8vpY/1/YyFkunIDFH/12p7/7VdPKA1hejMVEbdkEaWnUz0Hesvx5EbiU6XxjyHZIOju+ZMbQJkRh+es3/spQ=="],
  browserslist: ["4.28.5", "4.28.9", "sha512-EWazOblFYUvlGZcfGhPUPmYh3nikUxBVb+y9MJun5f3hBi812X+8MSQTujLBtgK3cf51fJWbWfOjyeO954d+Eg=="],
  "caniuse-lite": ["1.0.30001803", "1.0.30001810", "sha512-TITQPUkaz+aVk5GL6NhOdwk1aEaNTSDPsGFWrTuhKGtjTF70jL/Oht2W4c6rXUe5fu7Ie19VIahAXHIIiWWNeg=="],
  "electron-to-chromium": ["1.5.389", "1.5.422", "sha512-UvA/32XqrLDdZSn7Jllo1AYNcWji/G0d5M0GTViE7KoGBiMunw3a34Sb2KO4ZZyrSEhqsxFoVhWWJshdyfKqJA=="],
  "fast-uri": ["3.1.5", "3.1.7", "sha512-dOvZVzjdZdz7phd9v6jCbwxrBW3fK6n8Rc0CtdmM4bumzMnxywBYhuph6J819RRw/ku+rLbelwfMunktuzVVHg=="],
  "node-releases": ["2.0.50", "2.0.54", "sha512-YHs7BmmcsdAI5Ozuf8JZo6PT0mv2GIWC9vMfvUC3dp65M8hn7Ux8CPL+2oBI7juNuj9d0ndhTcznq2ODBps9cQ=="],
  "update-browserslist-db": ["1.2.3", "1.3.2", "sha512-UQ+MSxlhRm1bzjhU+DcuXfjFO1FzNtqhK5+9Yvlp90ItDLk5vT932A0rFu619nf7RVS+Y/VeaUW1jaRDqZ8VJw=="],
};
const browserDependencies = {
  "baseline-browser-mapping": "^2.11.20",
  "caniuse-lite": "^1.0.30001810",
  "electron-to-chromium": "^1.5.420",
  "node-releases": "^2.0.54",
  "update-browserslist-db": "^1.3.2",
};
const emptyScriptsHash = "44136fa355b3678a1146ad16f7e8649e94fb4fc21fe77e8310c060f61caaff8a";
const scriptsHashes = {
  browserslist: emptyScriptsHash,
  "fast-uri": "dd850af7d1151a6ae6640b2ff31d053231e81765186d76e06d1a72d2453d7a39",
  "baseline-browser-mapping": "cfcbbfbd90d492b4abe8ccd7e7d368d2e3d469b91fe6c8aecff77460319b432d",
  "caniuse-lite": emptyScriptsHash,
  "electron-to-chromium": "466d9a3e831e5cef7a1fad8323c8effa7388c5b9b2e83b916efdea0bcaeb20e4",
  "node-releases": "41e905dfef60dd4525fcb0b65c022fef3e9bb3ba19de306dce9b623e4f886cf7",
  "update-browserslist-db": emptyScriptsHash,
};

const hash = (value) => createHash("sha256").update(value).digest("hex");
const text = (root, name) => readFileSync(path.join(root, name), "utf8");
const json = (root, name) => JSON.parse(text(root, name));
function atBaseline(root, name) {
  return execFileSync("git.exe", ["-c", `safe.directory=${root.replaceAll("\\", "/")}`, "show", `${F013_BASELINE}:${name}`], {
    cwd: root, encoding: "utf8", windowsHide: true, timeout: 10_000,
  });
}

// Importing this module runs no verification, install, network call or mutation.
// Historical verifiers can retain their original Git evidence and explicitly
// allow only this fully specified successor lockfile delta.
export function assertF013LockDelta({ root = repositoryRoot } = {}) {
  const beforeText = atBaseline(root, "package-lock.json");
  assert.equal(hash(beforeText.replaceAll("\r\n", "\n")), baselineLockSha256, "F013 baseline lock is immutable");
  const before = JSON.parse(beforeText);
  const expected = structuredClone(before);
  for (const [name, [oldVersion, version, integrity]] of Object.entries(updates)) {
    const entry = expected.packages[`node_modules/${name}`];
    assert.equal(entry.version, oldVersion, `${name}: baseline version`);
    assert.equal(oldVersion.split(".")[0], version.split(".")[0], `${name}: no major update`);
    Object.assign(entry, { version, resolved: `https://registry.npmjs.org/${name}/-/${name}-${version}.tgz`, integrity });
  }
  expected.packages["node_modules/browserslist"].dependencies = browserDependencies;
  const currentText = text(root, "package-lock.json");
  const current = JSON.parse(currentText);
  assert.deepEqual(current, expected, "only the seven declared F013 package entries and required browser ranges may change");
  const lockSha256 = hash(currentText.replaceAll("\r\n", "\n"));
  assert.equal(lockSha256, F013_LOCK_SHA256, "reviewed F013 lock bytes (LF normalized)");
  return { changedPackages: Object.keys(updates).sort(), lockSha256, rawLockSha256: hash(currentText) };
}

function sourceFiles(root, directory) {
  const result = [];
  for (const item of readdirSync(path.join(root, directory), { withFileTypes: true })) {
    if (item.name.startsWith(".") || item.name === "node_modules") continue;
    const relative = path.posix.join(directory, item.name);
    if (item.isDirectory()) result.push(...sourceFiles(root, relative));
    else if (item.isFile() && /\.(?:m?[jt]s|tsx|jsx)$/.test(item.name)) result.push(relative);
  }
  return result;
}

async function verify() {
  let passed = 0;
  const check = (name, run) => { run(); console.log(`PASS F013 ${++passed} ${name}`); };
  const require = createRequire(path.join(repositoryRoot, "package.json"));
  const semver = require("semver");
  const lock = json(repositoryRoot, "package-lock.json");
  const installed = (name) => json(repositoryRoot, `node_modules/${name}/package.json`);
  const rootPackage = json(repositoryRoot, "package.json");
  const baselinePackage = JSON.parse(atBaseline(repositoryRoot, "package.json"));
  check("exact seven-package lock delta preserves every other entry", () => assertF013LockDelta());
  check("direct dependencies, overrides and root lifecycle remain unchanged", () => {
    const expected = structuredClone(baselinePackage);
    if (rootPackage.scripts["verify:f013"] !== undefined) expected.scripts["verify:f013"] = "node scripts/verify-f013-dependencies.mjs";
    assert.deepEqual(rootPackage, expected);
    assert.deepEqual(lock.packages[""].dependencies, rootPackage.dependencies);
    assert.deepEqual(lock.packages[""].devDependencies, rootPackage.devDependencies);
  });
  check("installed targets match the reviewed lock and declared parent ranges", () => {
    for (const [name, [, version, integrity]] of Object.entries(updates)) {
      assert.equal(installed(name).version, version, name);
      assert.equal(lock.packages[`node_modules/${name}`].integrity, integrity, name);
    }
    assert.ok(semver.satisfies(installed("fast-uri").version, installed("ajv").dependencies["fast-uri"]));
    assert.ok(semver.satisfies(installed("browserslist").version, installed("@babel/helper-compilation-targets").dependencies.browserslist));
    for (const [name, range] of Object.entries(browserDependencies)) assert.ok(semver.satisfies(installed(name).version, range), name);
    assert.ok(semver.satisfies(installed("browserslist").version, installed("update-browserslist-db").peerDependencies.browserslist));
    assert.ok(semver.gte(installed("fast-uri").version, "3.1.7"), "includes Sep 2 advisories not yet present in npm audit");
    assert.ok(semver.gte(installed("browserslist").version, "4.28.7"));
  });
  check("changed packages add no install lifecycle and scripts match reviewed metadata", () => {
    for (const name of Object.keys(updates)) {
      const scripts = installed(name).scripts ?? {};
      const ordered = Object.fromEntries(Object.entries(scripts).sort(([a], [b]) => a.localeCompare(b, "en")));
      assert.equal(hash(JSON.stringify(ordered)), scriptsHashes[name], name);
      for (const event of ["preinstall", "install", "postinstall", "prepare", "prepublish", "prepublishOnly"]) assert.equal(scripts[event], undefined, `${name}: ${event}`);
      assert.notEqual(lock.packages[`node_modules/${name}`].hasInstallScript, true, name);
    }
  });
  check("runtime dependency use stays Ajv with fixed local schemas", () => {
    assert.match(text(repositoryRoot, "node_modules/ajv/dist/runtime/uri.js"), /require\(["']fast-uri["']\)/);
    assert.match(text(repositoryRoot, "lib/assessment/runtime/validation.ts"), /ajv\.compile\(definition\.outputSchema\)/);
    assert.match(text(repositoryRoot, "lib/assessment/runtime/schema-catalog.ts"), /readFile\(filePath, "utf8"\)/);
    for (const directory of ["app", "lib", "netlify/functions", "services"]) {
      for (const file of sourceFiles(repositoryRoot, directory)) {
        const source = text(repositoryRoot, file);
        assert.doesNotMatch(source, /\b(?:loadSchema|compileAsync|uriResolver)\b/, file);
        assert.doesNotMatch(source, /(?:from\s*|require\(\s*|import\(\s*)["'](?:fast-uri|browserslist|toml|@netlify\/zip-it-and-ship-it)(?:["']|\/)/, file);
      }
    }
  });
  check("toml remains a separately deferred development-only parser", () => {
    assert.equal(lock.packages["node_modules/toml"].version, "3.0.0");
    assert.equal(lock.packages["node_modules/toml"].dev, true);
    assert.equal(lock.packages["node_modules/@netlify/zip-it-and-ship-it"].dev, true);
    assert.equal(installed("@netlify/zip-it-and-ship-it").dependencies.toml, "^3.0.0");
    assert.equal(rootPackage.dependencies.toml, undefined);
    assert.equal(rootPackage.devDependencies.toml, "3.0.0");
    assert.match(text(repositoryRoot, "scripts/verify-m1-4-background-runtime-assets.mjs"), /readFileSync\(path\.join\(repositoryRoot, "netlify\.toml"\), "utf8"\)/);
    assert.match(text(repositoryRoot, "node_modules/@netlify/zip-it-and-ship-it/dist/runtimes/rust/builder.js"), /toml\.parse\(manifest\)/);
    assert.equal(installed("next").version, baselinePackage.dependencies.next);
  });

  // These modules only parse local strings. No API/provider/client is created.
  const uri = require("fast-uri");
  check("fast-uri rejects port authority injection (GHSA-qw65-cvwx-89v3)", () => {
    assert.throws(() => uri.serialize({ scheme: "http", host: "trusted.example", port: "@127.0.0.1:8124", path: "/app" }), /port is malformed/i);
  });
  check("fast-uri rejects unbalanced authority brackets (GHSA-58mr-gqgx-xq4g)", () => {
    for (const value of ["http://[127.0.0.1:8124/", "http://127.0.0.1]/"]) assert.match(uri.parse(value).error, /host is malformed/i);
    assert.equal(uri.parse("http://[::1]/").error, undefined);
  });
  check("fast-uri canonicalizes scheme-relative IDN once (GHSA-5jgf-p345-68v8)", () => {
    assert.equal(uri.resolve("https://trusted.example/base", "//ma\u00f1ana.com/resource"), "https://xn--maana-pta.com/resource");
  });
  check("ordinary URI and Ajv local-reference validation preserve behavior", () => {
    assert.equal(uri.resolve("https://example.test/a/b", "../c"), "https://example.test/c");
    const Ajv2020 = require("ajv/dist/2020.js").default;
    const validate = new Ajv2020({ allErrors: true, strict: false }).compile({
      $id: "https://example.test/f013-schema", type: "object", properties: { decision: { $ref: "#/$defs/decision" } },
      required: ["decision"], additionalProperties: false, $defs: { decision: { type: "string", enum: ["wait_and_reassess"] } },
    });
    assert.equal(validate({ decision: "wait_and_reassess" }), true);
    assert.equal(validate({ decision: "unexpected" }), false);
    assert.equal(validate({ decision: "wait_and_reassess", extra: true }), false);
  });
  const previousCacheSetting = process.env.BROWSERSLIST_DISABLE_CACHE;
  delete process.env.BROWSERSLIST_DISABLE_CACHE;
  try {
    const browserslist = require("browserslist");
    const options = { path: repositoryRoot, stats: { chrome: { 100: 50 } } };
    check("browserslist tolerates inherited-name custom stats without prototype writes", () => {
      const before = Object.getOwnPropertyDescriptors(Object.prototype);
      const stats = JSON.parse('{"__proto__":{"polluted":1},"toString":{"onekey":5},"chrome":{"100":50}}');
      const result = browserslist("> 0% in my stats", { ...options, stats, ignoreUnknownVersions: true });
      assert.ok(result.includes("chrome 100"));
      assert.deepEqual(Object.getOwnPropertyDescriptors(Object.prototype), before);
    });
    check("browserslist query cache evicts old distinct inputs within a bounded sample", () => {
      const first = browserslist("since 2000-01-01", options);
      assert.equal(browserslist("since 2000-01-01", options), first, "ordinary repeated query is cached");
      for (let index = 0; index < 600; index++) {
        const date = new Date(Date.UTC(2020, 0, 1 + index)).toISOString().slice(0, 10);
        browserslist(`since ${date}`, options);
      }
      const repeated = browserslist("since 2000-01-01", options);
      assert.notEqual(repeated, first, "old result must be evicted, not retained indefinitely");
      assert.deepEqual(repeated, first, "eviction does not change query semantics");
    });
  } finally {
    if (previousCacheSetting === undefined) delete process.env.BROWSERSLIST_DISABLE_CACHE;
    else process.env.BROWSERSLIST_DISABLE_CACHE = previousCacheSetting;
  }
  console.log(`F013 offline dependency verification: ${passed}/${passed} PASS; live npm audit is a separate registry observation; toml is Deferred, not risk accepted`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await verify();
