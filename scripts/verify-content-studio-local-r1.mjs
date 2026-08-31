import assert from "node:assert/strict";
import { builtinModules } from "node:module";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import ts from "typescript";

const repositoryRoot = process.cwd();
const entryRelativePaths = [
  "tools/content-studio-local/lib/index.ts",
  "tools/content-studio-local/app/api/generation/route.ts",
];
const toolRootRelativePath = "tools/content-studio-local";
const sourceExtensions = [
  ".ts",
  ".tsx",
  ".mts",
  ".cts",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
];
const sourceExtensionSet = new Set(sourceExtensions);
const allowedExternalPackages = new Set(["ajv", "next", "openai", "server-only"]);
const forbiddenExternalPackages = new Set([
  "@netlify/async-workloads",
  "@netlify/blobs",
  "@supabase/ssr",
  "@supabase/supabase-js",
  "resend",
  "stripe",
]);
const allowedProductionFiles = new Set([
  "lib/assessment/production/consultation.ts",
  "lib/assessment/production/types.ts",
  "lib/http/strict-json-request.ts",
]);
const requiredReachableFiles = new Set([
  "lib/assessment/production/consultation.ts",
  "lib/assessment/production/types.ts",
  "lib/assessment/runtime/application.ts",
  "lib/assessment/runtime/customer-assessment-experience-projection-v2.ts",
  "lib/assessment/runtime/fakes.ts",
  "lib/assessment/runtime/jpy980-product-scope-validation-v1.ts",
  "lib/assessment/runtime/openai-transport.ts",
  "lib/assessment/runtime/quality-reassessment-v2.ts",
  "lib/assessment/runtime/runtime-result-normalization-v1.ts",
  "lib/assessment/runtime/schema-catalog.ts",
  "lib/assessment/runtime/semantic-disposition-v7.ts",
  "lib/purchase/prepayment-safety-gate-v1.ts",
]);
const requiredToolSourceTokens = [
  "decodeProductionConsultationInputV1",
  "evaluatePrepaymentSafetyV1",
  "evaluateJpy980ProductScopeV1",
  "FakeAssessmentRepository",
  "loadM2P4FinalProductRecoveryRuntimeStageCatalog",
  "OpenAiResponsesTransport",
  "projectCustomerAssessmentExperienceV2",
  "classifyPaidQualityReassessmentExhaustionV1",
  "evaluateSemanticFindingsV7",
  "LocalQualityDiagnosticTransport",
  "syntheticOnlyAcknowledged",
];
const forbiddenToolSourcePatterns = [
  ["FakeAiStageTransport", /\bFakeAiStageTransport\b/u],
  ["browser-visible secret", /\bNEXT_PUBLIC_[A-Z0-9_]*(?:OPENAI|SECRET|API_KEY)[A-Z0-9_]*\b/u],
  ["direct fetch", /\bfetch\s*\(/u],
  ["Supabase client construction", /\b(?:createClient|createServerClient)\s*\(/u],
];

const failures = [];
const checks = [];

function normalizeRelative(filePath) {
  return path.relative(repositoryRoot, filePath).replaceAll("\\", "/");
}

function absolute(relativePath) {
  return path.join(repositoryRoot, ...relativePath.split("/"));
}

function recordCheck(name, fn) {
  try {
    fn();
    checks.push({ name, status: "PASS" });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    checks.push({ name, status: "FAIL" });
    failures.push(`${name}: ${message}`);
  }
}

function scriptKind(filePath) {
  switch (path.extname(filePath).toLowerCase()) {
    case ".tsx":
      return ts.ScriptKind.TSX;
    case ".jsx":
      return ts.ScriptKind.JSX;
    case ".js":
    case ".mjs":
    case ".cjs":
      return ts.ScriptKind.JS;
    default:
      return ts.ScriptKind.TS;
  }
}

function importSpecifiers(filePath, source, options = {}) {
  const parsed = ts.createSourceFile(
    filePath,
    source,
    ts.ScriptTarget.Latest,
    true,
    scriptKind(filePath),
  );
  const specifiers = [];
  function addLiteral(node) {
    if (node && ts.isStringLiteralLike(node)) specifiers.push(node.text);
  }
  function visit(node) {
    if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) {
      addLiteral(node.moduleSpecifier);
    } else if (
      ts.isImportEqualsDeclaration(node) &&
      ts.isExternalModuleReference(node.moduleReference)
    ) {
      addLiteral(node.moduleReference.expression);
    } else if (ts.isImportTypeNode(node) && ts.isLiteralTypeNode(node.argument)) {
      addLiteral(node.argument.literal);
    } else if (ts.isCallExpression(node)) {
      const isDynamicImport = node.expression.kind === ts.SyntaxKind.ImportKeyword;
      const isRequire =
        ts.isIdentifier(node.expression) && node.expression.text === "require";
      if (isDynamicImport || isRequire) {
        const firstArgument = node.arguments[0];
        if (firstArgument && ts.isStringLiteralLike(firstArgument)) {
          addLiteral(firstArgument);
        } else if (options.failOnNonLiteral) {
          const location = parsed.getLineAndCharacterOfPosition(node.getStart(parsed));
          throw new Error(
            `${normalizeRelative(filePath)}:${location.line + 1} uses a non-literal ${
              isDynamicImport ? "dynamic import" : "require"
            }`,
          );
        }
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(parsed);
  return [...new Set(specifiers)];
}

function packageName(specifier) {
  if (specifier.startsWith("@")) {
    return specifier.split("/").slice(0, 2).join("/");
  }
  return specifier.split("/")[0];
}

const builtinPackageNames = new Set(
  builtinModules.flatMap((name) => [name, name.replace(/^node:/u, "")]),
);

function isBuiltinSpecifier(specifier) {
  return (
    specifier.startsWith("node:") ||
    builtinPackageNames.has(specifier) ||
    builtinPackageNames.has(packageName(specifier))
  );
}

function isLocalSpecifier(specifier) {
  return (
    specifier.startsWith("./") ||
    specifier.startsWith("../") ||
    specifier.startsWith("@/") ||
    path.isAbsolute(specifier)
  );
}

function resolveSourceFile(importer, specifier) {
  const unresolvedBase = specifier.startsWith("@/")
    ? absolute(specifier.slice(2))
    : path.isAbsolute(specifier)
      ? specifier
      : path.resolve(path.dirname(importer), specifier);
  const candidates = [unresolvedBase];
  if (!sourceExtensionSet.has(path.extname(unresolvedBase).toLowerCase())) {
    for (const extension of sourceExtensions) candidates.push(unresolvedBase + extension);
    for (const extension of sourceExtensions) {
      candidates.push(path.join(unresolvedBase, `index${extension}`));
    }
  }
  const resolved = candidates.find(
    (candidate) => existsSync(candidate) && statSync(candidate).isFile(),
  );
  if (!resolved) {
    throw new Error(
      `unresolved local import ${JSON.stringify(specifier)} from ${normalizeRelative(importer)}`,
    );
  }
  return path.resolve(resolved);
}

function allowedLocalPath(relativePath) {
  if (relativePath === toolRootRelativePath || relativePath.startsWith(`${toolRootRelativePath}/`)) {
    return true;
  }
  if (relativePath.startsWith("lib/assessment/runtime/")) return true;
  if (relativePath.startsWith("lib/purchase/prepayment-safety-")) return true;
  return allowedProductionFiles.has(relativePath);
}

function forbiddenLocalPathReason(relativePath) {
  const lower = relativePath.toLowerCase();
  if (lower.startsWith("lib/payment/")) return "payment authority";
  if (lower.startsWith("lib/customer-auth/")) return "customer auth or ownership";
  if (lower.startsWith("lib/measurement/")) return "measurement or GA4";
  if (lower.startsWith("lib/support/")) return "customer support";
  if (
    lower.startsWith("lib/assessment/production/") &&
    !allowedProductionFiles.has(relativePath)
  ) {
    return "non-allowlisted Production assessment authority";
  }
  if (/supabase(?:-|_)repository/u.test(lower)) return "Supabase repository";
  if (/(?:^|[/_.-])stripe(?:[/_.-]|$)/u.test(lower)) return "Stripe";
  if (/(?:^|[/_.-])resend(?:[/_.-]|$)/u.test(lower)) return "Resend";
  if (/(?:^|[/_.-])fulfillment(?:[/_.-]|$)/u.test(lower)) return "fulfillment";
  if (/(?:^|[/_.-])delivery(?:[/_.-]|$)/u.test(lower)) return "delivery";
  if (/(?:^|[/_.-])notification(?:[/_.-]|$)/u.test(lower)) return "notification";
  return null;
}

function listSourceFiles(rootPath) {
  if (!existsSync(rootPath)) return [];
  const result = [];
  const queue = [rootPath];
  while (queue.length > 0) {
    const current = queue.pop();
    const stat = statSync(current);
    if (stat.isDirectory()) {
      for (const entry of readdirSync(current, { withFileTypes: true })) {
        if ([".git", ".next", ".netlify", "node_modules"].includes(entry.name)) {
          continue;
        }
        queue.push(path.join(current, entry.name));
      }
      continue;
    }
    if (sourceExtensionSet.has(path.extname(current).toLowerCase())) {
      result.push(path.resolve(current));
    }
  }
  return result.sort();
}

function buildImportGraph(entryPath) {
  const graph = new Map();
  const queue = [path.resolve(entryPath)];
  while (queue.length > 0) {
    const filePath = queue.shift();
    if (graph.has(filePath)) continue;
    const source = readFileSync(filePath, "utf8");
    const imports = [];
    for (const specifier of importSpecifiers(filePath, source, { failOnNonLiteral: true })) {
      if (!isLocalSpecifier(specifier)) {
        imports.push({ kind: "package", specifier });
        continue;
      }
      const resolved = resolveSourceFile(filePath, specifier);
      imports.push({ kind: "local", specifier, resolved });
      queue.push(resolved);
    }
    graph.set(filePath, { source, imports });
  }
  return graph;
}

function specifierTargetsTool(importer, specifier) {
  const normalizedSpecifier = specifier.replaceAll("\\", "/");
  if (normalizedSpecifier.includes("tools/content-studio-local")) return true;
  if (!isLocalSpecifier(specifier)) return false;
  const base = specifier.startsWith("@/")
    ? absolute(specifier.slice(2))
    : path.isAbsolute(specifier)
      ? specifier
      : path.resolve(path.dirname(importer), specifier);
  const relative = normalizeRelative(path.resolve(base));
  return relative === toolRootRelativePath || relative.startsWith(`${toolRootRelativePath}/`);
}

const entryPaths = entryRelativePaths.map(absolute);
let graph = new Map();

recordCheck("required local backend entries exist", () => {
  for (const [index, entryPath] of entryPaths.entries()) {
    const entryRelativePath = entryRelativePaths[index];
    assert.equal(
      existsSync(entryPath),
      true,
      `missing ${entryRelativePath}; Local R1 backend has not been generated`,
    );
    assert.equal(statSync(entryPath).isFile(), true, `${entryRelativePath} is not a file`);
  }
});

recordCheck("transitive local import graph resolves", () => {
  graph = new Map();
  for (const [index, entryPath] of entryPaths.entries()) {
    assert.equal(
      existsSync(entryPath),
      true,
      `cannot resolve graph without ${entryRelativePaths[index]}`,
    );
    for (const [filePath, node] of buildImportGraph(entryPath)) {
      graph.set(filePath, node);
    }
  }
  assert.ok(graph.size > 1, "backend graph contains no transitive source modules");
});

recordCheck("backend graph stays inside the Core allowlist", () => {
  assert.ok(graph.size > 0, "backend graph was not resolved");
  const violations = [];
  for (const [filePath, node] of graph) {
    const relativePath = normalizeRelative(filePath);
    const directReason = forbiddenLocalPathReason(relativePath);
    if (directReason) violations.push(`${relativePath} (${directReason})`);
    if (!allowedLocalPath(relativePath)) {
      violations.push(`${relativePath} (outside local/Core path allowlist)`);
    }
    for (const imported of node.imports) {
      if (imported.kind !== "local") continue;
      const importedRelative = normalizeRelative(imported.resolved);
      const reason = forbiddenLocalPathReason(importedRelative);
      if (reason) {
        violations.push(
          `${relativePath} -> ${importedRelative} (${reason})`,
        );
      }
    }
  }
  assert.deepEqual([...new Set(violations)], []);
});

recordCheck("external packages are default-deny", () => {
  assert.ok(graph.size > 0, "backend graph was not resolved");
  const violations = [];
  for (const [filePath, node] of graph) {
    for (const imported of node.imports) {
      if (imported.kind !== "package" || isBuiltinSpecifier(imported.specifier)) continue;
      const dependency = packageName(imported.specifier);
      if (forbiddenExternalPackages.has(dependency)) {
        violations.push(
          `${normalizeRelative(filePath)} imports forbidden ${imported.specifier}`,
        );
      } else if (!allowedExternalPackages.has(dependency)) {
        violations.push(
          `${normalizeRelative(filePath)} imports non-allowlisted package ${imported.specifier}`,
        );
      }
    }
  }
  assert.deepEqual(violations, []);
});

recordCheck("required Production-equivalent Core is reachable", () => {
  assert.ok(graph.size > 0, "backend graph was not resolved");
  const reachable = new Set([...graph.keys()].map(normalizeRelative));
  const missing = [...requiredReachableFiles].filter((file) => !reachable.has(file));
  assert.deepEqual(missing, []);
});

recordCheck("tool source selects real Provider and no hidden side-effect seams", () => {
  const toolFiles = [...graph.entries()].filter(([filePath]) => {
    const relative = normalizeRelative(filePath);
    return relative === toolRootRelativePath || relative.startsWith(`${toolRootRelativePath}/`);
  });
  assert.ok(toolFiles.length > 0, "no Content Studio tool source was resolved");
  const combined = toolFiles.map(([, node]) => node.source).join("\n");
  const missingTokens = requiredToolSourceTokens.filter((token) => !combined.includes(token));
  assert.deepEqual(missingTokens, []);
  const forbidden = forbiddenToolSourcePatterns
    .filter(([, pattern]) => pattern.test(combined))
    .map(([label]) => label);
  assert.deepEqual(forbidden, []);
});

recordCheck("local diagnostics reuse Shared taxonomy without a local allowlist", () => {
  const toolFiles = listSourceFiles(absolute(toolRootRelativePath));
  const combined = toolFiles.map((filePath) => readFileSync(filePath, "utf8")).join("\n");
  assert.doesNotMatch(
    combined,
    /(?:TEMPLATE_GENERICITY|BRAND_TONE|REPETITION)/u,
    "Content Studio must not define or copy the Paid Quality soft allowlist",
  );
  const diagnosticSource = readFileSync(
    absolute("tools/content-studio-local/lib/quality-diagnostics.ts"),
    "utf8",
  );
  for (const token of [
    "buildCombinedProductQualityDirectiveV2",
    "classifyPaidQualityReassessmentExhaustionV1",
    "evaluateSemanticFindingsV7",
  ]) {
    assert.ok(diagnosticSource.includes(token), `missing Shared diagnostic authority ${token}`);
  }
});

recordCheck("backend entry is server-only", () => {
  const entryPath = entryPaths[0];
  assert.equal(existsSync(entryPath), true, `missing ${entryRelativePaths[0]}`);
  const entrySource = readFileSync(entryPath, "utf8");
  assert.match(entrySource, /(?:import|require\s*\()\s*["']server-only["']/u);
});

recordCheck("all local UI and route sources directly avoid forbidden imports", () => {
  const violations = [];
  for (const filePath of listSourceFiles(absolute(toolRootRelativePath))) {
    const source = readFileSync(filePath, "utf8");
    for (const specifier of importSpecifiers(filePath, source, {
      failOnNonLiteral: true,
    })) {
      if (!isLocalSpecifier(specifier)) {
        const dependency = packageName(specifier);
        if (forbiddenExternalPackages.has(dependency)) {
          violations.push(
            `${normalizeRelative(filePath)} imports forbidden ${specifier}`,
          );
        }
        continue;
      }
      if (/\.(?:css|scss|sass|less)$/iu.test(specifier)) continue;
      const resolved = resolveSourceFile(filePath, specifier);
      const reason = forbiddenLocalPathReason(normalizeRelative(resolved));
      if (reason) {
        violations.push(
          `${normalizeRelative(filePath)} -> ${normalizeRelative(resolved)} (${reason})`,
        );
      }
    }
  }
  assert.deepEqual(violations, []);
});

recordCheck("Production roots never import the local tool", () => {
  const roots = ["app", "components", "lib", "netlify"]
    .map(absolute)
    .filter(existsSync);
  const rootFiles = roots.flatMap(listSourceFiles);
  for (const rootFile of ["proxy.ts", "next.config.ts", "middleware.ts", "instrumentation.ts"]) {
    const filePath = absolute(rootFile);
    if (existsSync(filePath)) rootFiles.push(filePath);
  }
  const violations = [];
  for (const filePath of rootFiles) {
    const source = readFileSync(filePath, "utf8");
    for (const specifier of importSpecifiers(filePath, source)) {
      if (specifierTargetsTool(filePath, specifier)) {
        violations.push(`${normalizeRelative(filePath)} -> ${specifier}`);
      }
    }
  }
  assert.deepEqual(violations, []);
});

recordCheck("App Router has no Content Studio route surface", () => {
  const appRoot = absolute("app");
  const routeFilePattern = /\/(?:page|route|layout|template|loading|error|not-found|default)\.(?:[cm]?[jt]sx?)$/u;
  const routeFiles = listSourceFiles(appRoot).map(normalizeRelative);
  const violations = routeFiles.filter((relativePath) => {
    const normalized = `/${relativePath.toLowerCase()}`;
    return (
      routeFilePattern.test(normalized) &&
      /(?:content[-_]?studio|studio[-_]?content)/u.test(normalized)
    );
  });
  assert.deepEqual(violations, []);
});

recordCheck("Next and Netlify manifests exclude Content Studio", () => {
  const manifestCandidates = [
    "next.config.ts",
    "next.config.js",
    "next.config.mjs",
    "netlify.toml",
  ];
  const violations = [];
  for (const relativePath of manifestCandidates) {
    const filePath = absolute(relativePath);
    if (!existsSync(filePath)) continue;
    const source = readFileSync(filePath, "utf8");
    if (/content[-_]?studio|tools\/content-studio-local/iu.test(source)) {
      violations.push(relativePath);
    }
  }
  const functionRoot = absolute("netlify/functions");
  for (const filePath of listSourceFiles(functionRoot)) {
    const relativePath = normalizeRelative(filePath);
    const source = readFileSync(filePath, "utf8");
    if (
      /content[-_]?studio/iu.test(relativePath) ||
      importSpecifiers(filePath, source).some((specifier) =>
        specifierTargetsTool(filePath, specifier),
      )
    ) {
      violations.push(relativePath);
    }
  }
  assert.deepEqual(violations, []);
});

for (const check of checks) {
  console.log(`${check.status} ${check.name}`);
}

if (failures.length > 0) {
  console.error(`CONTENT_STUDIO_LOCAL_R1: FAIL (${failures.length})`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log(
    `CONTENT_STUDIO_LOCAL_R1: PASS (${checks.length}/${checks.length}; graph_files=${graph.size})`,
  );
}
