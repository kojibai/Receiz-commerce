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
  const projectionRoot = mkdtempSync(join(tmpdir(), "receiz-v106-source-"));
  try {
    copyMigrationInputs(sourceRoot, projectionRoot);
    const cliPath = resolve(sourceRoot, "node_modules", "@receiz", "sdk", "dist", "cli.js");
    if (!existsSync(cliPath)) throw new Error("receiz_cli_binary_missing");
    const result = spawnSync(
      process.execPath,
      [cliPath, "migrate", "v105-v106", "--dry-run", "--root", projectionRoot],
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

function findingCounts(findings) {
  const counts = {};
  for (const finding of findings) {
    counts[finding.detectorId] = (counts[finding.detectorId] ?? 0) + 1;
  }
  return Object.fromEntries(Object.entries(counts).sort(([left], [right]) => left.localeCompare(right)));
}

const args = process.argv.slice(2);
const root = resolve(optionValue(args, "--root") ?? process.cwd());
const plan = runOfficialDryRun(root);
const summary = {
  planDigest: plan.planDigest,
  blocked: plan.blocked,
  changes: plan.changes.length,
  findings: plan.findings.length,
  findingCounts: findingCounts(plan.findings),
  writesPerformed: plan.writesPerformed
};

if (args.includes("--plan")) {
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
  process.exit(0);
}

const attestationPath = join(root, "receiz.migration.v105-v106.json");
if (!existsSync(attestationPath)) throw new Error("receiz_migration_attestation_required");
const attestation = JSON.parse(readFileSync(attestationPath, "utf8"));
const checks = [
  { id: "official-v106-dry-run", ok: plan.schema === "receiz.sdk.v105-v106.migration-plan.v1" },
  { id: "source-only-deterministic-plan", ok: plan.planDigest === attestation.planDigest },
  { id: "no-safe-codemods-pending", ok: plan.changes.length === 0 && attestation.changes === 0 },
  { id: "all-findings-accounted-for", ok: JSON.stringify(summary.findingCounts) === JSON.stringify(attestation.findingCounts) },
  { id: "manual-authority-review-complete", ok: attestation.manualAuthorityReview === "complete" },
  { id: "no-migration-writes", ok: plan.writesPerformed === 0 && attestation.writesPerformed === 0 },
  { id: "history-not-rewritten", ok: attestation.historyRewritten === false },
  { id: "stronger-truth-preserved", ok: attestation.strongerTruth === "sealed-receiz-proof-object" }
];
const report = {
  ok: checks.every((check) => check.ok),
  schema: "receiz.repository.v105-v106.migration-verification.v1",
  sdkVersion: "106.0.0",
  mode: "audited-no-apply",
  planDigest: plan.planDigest,
  findings: plan.findings.length,
  findingCounts: summary.findingCounts,
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
