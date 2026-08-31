import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const repositoryRoot = process.cwd();
const manifestPaths = [
  ".next/server/app-paths-manifest.json",
  ".next/routes-manifest.json",
  ".next/server/middleware-manifest.json",
];
const forbidden = /content[-_]?studio|tools[/\\]content-studio-local/iu;

for (const relativePath of manifestPaths) {
  const absolutePath = path.join(repositoryRoot, relativePath);
  assert.equal(
    existsSync(absolutePath),
    true,
    `${relativePath} is missing; run the main Production build first`,
  );
  assert.doesNotMatch(readFileSync(absolutePath, "utf8"), forbidden);
  console.log(`PASS ${relativePath} excludes Content Studio`);
}

console.log(
  `CONTENT_STUDIO_PRODUCTION_EXCLUSION_R1: PASS (${manifestPaths.length}/${manifestPaths.length}; route_matches=0)`,
);
