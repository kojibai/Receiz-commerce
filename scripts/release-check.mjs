#!/usr/bin/env node
import { spawnSync } from "node:child_process";

const checks = [
  ["pnpm", ["secret:scan"]],
  ["pnpm", ["test"]],
  ["pnpm", ["typecheck"]],
  ["pnpm", ["receiz:check"]],
  ["pnpm", ["receiz:conformance"]],
  ["pnpm", ["receiz:release-lock"]],
  ["pnpm", ["validate:ai-skills"]],
  ["pnpm", ["lint"]],
  ["pnpm", ["build"]],
  ["pnpm", ["receiz:doctor"]]
];

for (const [command, args] of checks) {
  console.log(`\n> ${command} ${args.join(" ")}`);
  const result = spawnSync(command, args, {
    env: process.env,
    shell: process.platform === "win32",
    stdio: "inherit"
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}
