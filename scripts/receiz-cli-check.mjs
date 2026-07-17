import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const root = process.cwd();
const cli = resolve(root, "node_modules", "@receiz", "sdk", "dist", "cli.js");
const commands = [
  { id: "binary-help", command: process.execPath, args: [cli, "--help"], json: false },
  { id: "app-check", command: process.execPath, args: [cli, "app", "check", "--target", "107.0.0", "--root", root, "--json"], json: true },
  { id: "conformance", command: process.execPath, args: [cli, "conformance"], json: true },
  { id: "migration-verification", command: process.execPath, args: [resolve(root, "scripts", "receiz-v107-migration-verify.mjs"), "--root", root], json: true }
];

const checks = commands.map((entry) => {
  const result = spawnSync(entry.command, entry.args, {
    cwd: root,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024
  });
  let outputOk = result.status === 0;
  let schema = null;
  if (entry.json && result.stdout) {
    try {
      const output = JSON.parse(result.stdout);
      outputOk = outputOk && output.ok === true;
      schema = output.schema ?? null;
    } catch (error) {
      outputOk = false;
      schema = error instanceof Error ? error.message : "invalid-json";
    }
  }
  return {
    id: entry.id,
    ok: outputOk,
    status: result.status,
    schema,
    error: outputOk ? null : (result.stderr || result.stdout).trim()
  };
});

const report = {
  ok: checks.every((check) => check.ok),
  schema: "receiz.repository.cli-health.v1",
  sdkVersion: "107.0.0",
  checks
};
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
if (!report.ok) process.exitCode = 1;
