import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";

async function read(path: string) {
  return readFile(resolve(process.cwd(), path), "utf8");
}

test("the repository identifies the shipped release as 2.0.0", async () => {
  const packageJson = JSON.parse(await read("package.json")) as {
    version?: string;
    dependencies?: Record<string, string>;
  };
  const lockfile = await read("pnpm-lock.yaml");

  assert.equal(packageJson.version, "2.0.0");
  assert.equal(packageJson.dependencies?.["@receiz/sdk"], "^99.0.0");
  assert.match(lockfile, /'@receiz\/sdk':[\s\S]*?specifier: \^99\.0\.0[\s\S]*?version: 99\.0\.0/);
});

test("the v2 release has migration, release, and operator evidence", async () => {
  const [readme, changelog, releaseNotes, migration, readiness, evidence, envExample] = await Promise.all([
    read("README.md"),
    read("CHANGELOG.md"),
    read("RELEASE_NOTES.md"),
    read("docs/MIGRATING_TO_V2.md"),
    read("docs/PRODUCTION_READINESS.md"),
    read("docs/audits/2026-07-13-v2-release-evidence.md"),
    read(".env.example"),
  ]);

  assert.match(readme, /Current release:\s*`2\.0\.0`/);
  assert.match(changelog, /## 2\.0\.0 - Commerce OS/);
  assert.match(releaseNotes, /Receiz Commerce Kit v2\.0\.0/);
  assert.match(releaseNotes, /@receiz\/sdk@99\.0\.0/);
  assert.match(migration, /# Migrating to v2\.0\.0/);
  assert.match(migration, /rollback/i);
  assert.match(readiness, /remote financial and domain mutations also require/i);
  assert.match(evidence, /228\/228/);
  assert.match(evidence, /real-money/i);
  assert.match(envExample, /RECEIZ_OAUTH_STATE_SECRET=/);
});
