import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

const localProjectDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(localProjectDirectory, "../..");

const nextConfig: NextConfig = {
  agentRules: false,
  poweredByHeader: false,
  reactStrictMode: true,
  outputFileTracingRoot: repositoryRoot,
  turbopack: {
    root: repositoryRoot,
  },
};

export default nextConfig;
