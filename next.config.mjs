import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: root,
  reactStrictMode: true,
  webpack(config, { isServer, webpack }) {
    if (!isServer) {
      // SDK v104 exposes its Node-only app compiler beside the browser runtime.
      // Keep those unused compiler built-ins outside client bundles until the
      // package publishes a dedicated browser export condition.
      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(/^node:/, (resource) => {
          resource.request = resource.request.slice("node:".length);
        })
      );
      config.resolve.fallback = {
        ...config.resolve.fallback,
        assert: false,
        "assert/strict": false,
        crypto: false,
        fs: false,
        "fs/promises": false,
        path: false,
        test: false
      };
    }
    return config;
  },
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate"
          },
          {
            key: "Service-Worker-Allowed",
            value: "/"
          }
        ]
      },
      {
        source: "/manifest.webmanifest",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=3600, must-revalidate"
          }
        ]
      }
    ];
  }
};

export default nextConfig;
