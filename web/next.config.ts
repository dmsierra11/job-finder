import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const webDir = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: path.join(webDir, ".."),
  serverExternalPackages: ["playwright", "playwright-core"],
  agentRules: false,
  webpack: (config) => {
    config.resolve.extensionAlias = {
      ".js": [".ts", ".js"],
    };
    return config;
  },
};

export default nextConfig;
