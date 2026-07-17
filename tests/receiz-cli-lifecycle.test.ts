import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";

const root = process.cwd();
const verifier = join(root, "scripts", "receiz-v106-migration-verify.mjs");

describe("Receiz v106 CLI lifecycle", () => {
  it("verifies the audited no-apply migration from source-only input", () => {
    const result = spawnSync(process.execPath, [verifier, "--root", root], {
      cwd: root,
      encoding: "utf8"
    });

    assert.equal(result.status, 0, result.stderr || result.stdout);
    const report = JSON.parse(result.stdout) as {
      ok: boolean;
      schema: string;
      writesPerformed: number;
      historyRewritten: boolean;
      generatedPathsExcluded: string[];
      checks: Array<{ id: string; ok: boolean }>;
    };

    assert.equal(report.ok, true);
    assert.equal(report.schema, "receiz.repository.v105-v106.migration-verification.v1");
    assert.equal(report.writesPerformed, 0);
    assert.equal(report.historyRewritten, false);
    assert.ok(report.generatedPathsExcluded.includes(".test-build"));
    assert.ok(report.checks.length > 0);
    assert.ok(report.checks.every((check) => check.ok));
  });

  it("routes public package commands through the end-to-end CLI checks", () => {
    const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8")) as {
      scripts: Record<string, string>;
    };

    assert.equal(
      pkg.scripts["receiz:migrate:verify"],
      "node scripts/receiz-v106-migration-verify.mjs --root ."
    );
    assert.equal(pkg.scripts["receiz:cli:check"], "node scripts/receiz-cli-check.mjs");
  });
});
