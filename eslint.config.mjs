import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { FlatCompat } from "@eslint/eslintrc";

const __dirname = dirname(fileURLToPath(import.meta.url));
const compat = new FlatCompat({
  baseDirectory: __dirname
});

const eslintConfig = [
  {
    ignores: [".next/**", "node_modules/**", "out/**", "dist/**", "next-env.d.ts"]
  },
  {
    files: ["app/**/*.{js,jsx,ts,tsx}", "src/features/**/*.{js,jsx,ts,tsx}"],
    rules: {
      "no-restricted-imports": ["error", {
        paths: [{
          name: "@receiz/sdk",
          importNames: [
            "commitArtifactTransition",
            "createReceizClient",
            "createReceizVerifiedCapability",
            "sealArtifactTransitionCandidate",
            "signReceizCapability"
          ],
          message: "Authority-bearing Receiz operations must enter through src/lib/receiz/adapter.ts; representations never authorize mutation."
        }]
      }]
    }
  },
  ...compat.extends("next/core-web-vitals")
];

export default eslintConfig;
