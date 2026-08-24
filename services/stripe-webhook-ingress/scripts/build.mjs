import { mkdir, rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { build } from "esbuild";

const packageRoot = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const distRoot = path.join(packageRoot, "dist");

await rm(distRoot, { recursive: true, force: true });
await mkdir(path.join(distRoot, "public"), { recursive: true });
await mkdir(path.join(distRoot, "functions"), { recursive: true });
await build({
  entryPoints: [path.join(packageRoot, "src", "stripe-webhook.ts")],
  outfile: path.join(distRoot, "functions", "stripe-webhook.mjs"),
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
  packages: "external",
  sourcemap: false,
  minify: false,
  legalComments: "none",
});
