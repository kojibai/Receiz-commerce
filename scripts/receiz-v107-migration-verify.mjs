import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, extname, join, relative, resolve } from "node:path";

const GENERATED_DIRECTORIES = new Set([
  ".git",
  ".next",
  ".pnpm-store",
  ".receiz",
  ".test-build",
  "coverage",
  "dist",
  "node_modules",
  "output",
  "tmp"
]);
const SOURCE_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);

function optionValue(args, option) {
  const index = args.indexOf(option);
  return index === -1 ? undefined : args[index + 1];
}

function copyMigrationInputs(sourceRoot, targetRoot) {
  function visit(directory) {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      if (entry.isDirectory() && GENERATED_DIRECTORIES.has(entry.name)) continue;
      const sourcePath = join(directory, entry.name);
      if (entry.isDirectory()) {
        visit(sourcePath);
        continue;
      }
      if (!entry.isFile()) continue;
      const projectPath = relative(sourceRoot, sourcePath);
      if (projectPath !== "package.json" && !SOURCE_EXTENSIONS.has(extname(entry.name))) continue;
      const targetPath = join(targetRoot, projectPath);
      mkdirSync(dirname(targetPath), { recursive: true });
      writeFileSync(targetPath, readFileSync(sourcePath));
    }
  }

  visit(sourceRoot);
}

function runOfficialDryRun(sourceRoot) {
  const projectionRoot = mkdtempSync(join(tmpdir(), "receiz-v107-source-"));
  try {
    copyMigrationInputs(sourceRoot, projectionRoot);
    const cliPath = resolve(sourceRoot, "node_modules", "@receiz", "sdk", "dist", "cli.js");
    if (!existsSync(cliPath)) throw new Error("receiz_cli_binary_missing");
    const result = spawnSync(
      process.execPath,
      [cliPath, "migrate", "v106-v107", "--dry-run", "--root", projectionRoot],
      { cwd: sourceRoot, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 }
    );
    if (result.status !== 0) {
      throw new Error(`receiz_migration_dry_run_failed:${result.stderr || result.stdout}`);
    }
    return JSON.parse(result.stdout);
  } finally {
    rmSync(projectionRoot, { recursive: true, force: true });
  }
}

const args = process.argv.slice(2);
const root = resolve(optionValue(args, "--root") ?? process.cwd());
const plan = runOfficialDryRun(root);
const summary = {
  planDigest: plan.planDigest,
  blocked: plan.blocked,
  changes: plan.changes.length,
  inventoryDispositions: plan.inventoryDispositions.length,
  pendingOutboxCount: plan.pendingOutboxCount,
  writesPerformed: plan.writesPerformed
};

if (args.includes("--plan")) {
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
  process.exit(0);
}

const attestationPath = join(root, "receiz.migration.v106-v107.json");
if (!existsSync(attestationPath)) throw new Error("receiz_migration_attestation_required");
const attestation = JSON.parse(readFileSync(attestationPath, "utf8"));
const checks = [
  { id: "official-v107-dry-run", ok: plan.schema === "receiz.sdk.v106-v107.migration-plan.v1" },
  { id: "source-only-deterministic-plan", ok: plan.planDigest === attestation.planDigest },
  { id: "migration-not-blocked", ok: plan.blocked === false && attestation.blocked === false },
  { id: "no-safe-codemods-pending", ok: plan.changes.length === 0 && attestation.changes === 0 },
  { id: "write-inventory-accounted-for", ok: plan.inventoryDispositions.length === 73 && attestation.inventoryDispositions === 73 },
  { id: "no-pending-outbox", ok: plan.pendingOutboxCount === 0 && attestation.pendingOutboxCount === 0 },
  { id: "history-digests-preserved", ok: JSON.stringify(plan.historyPreservation) === JSON.stringify(plan.destinationHistory) },
  { id: "manual-authority-review-complete", ok: attestation.manualAuthorityReview === "complete" },
  { id: "no-migration-writes", ok: plan.writesPerformed === 0 && attestation.writesPerformed === 0 },
  { id: "history-not-rewritten", ok: attestation.historyRewritten === false },
  { id: "stronger-truth-preserved", ok: attestation.strongerTruth === "sealed-receiz-proof-object" }
];
const report = {
  ok: checks.every((check) => check.ok),
  schema: "receiz.repository.v106-v107.migration-verification.v1",
  sdkVersion: "107.0.0",
  mode: "audited-no-apply",
  planDigest: plan.planDigest,
  inventoryDispositions: plan.inventoryDispositions.length,
  pendingOutboxCount: plan.pendingOutboxCount,
  writesPerformed: 0,
  historyRewritten: false,
  generatedPathsExcluded: [...GENERATED_DIRECTORIES].sort(),
  checks,
  authority: {
    verificationIsAdmission: false,
    strongerTruth: "sealed-receiz-proof-object",
    fabricatedApplyState: false
  }
};

process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
if (!report.ok) process.exitCode = 2;
