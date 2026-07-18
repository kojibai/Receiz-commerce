import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";

async function read(path: string) {
  return readFile(resolve(process.cwd(), path), "utf8");
}

test("the repository identifies the shipped release as 4.2.0", async () => {
  const packageJson = JSON.parse(await read("package.json")) as {
    version?: string;
    dependencies?: Record<string, string>;
    scripts?: Record<string, string>;
  };
  const lockfile = await read("pnpm-lock.yaml");

  assert.equal(packageJson.version, "4.2.0");
  assert.equal(packageJson.dependencies?.["@receiz/sdk"], "109.0.0");
  assert.equal(packageJson.dependencies?.["@receiz/mcp-server"], "109.0.0");
  assert.equal(packageJson.dependencies?.["@receiz/ai-skills"], "109.0.0");
  assert.equal(packageJson.scripts?.["receiz:check"], "receiz app check --target 109.0.0 --json");
  assert.match(lockfile, /'@receiz\/sdk':[\s\S]*?version: file:vendor\/receiz-sdk-109\.0\.0\.tgz/);
  assert.match(lockfile, /'@receiz\/mcp-server':[\s\S]*?version: file:vendor\/receiz-mcp-server-109\.0\.0\.tgz/);
  assert.match(lockfile, /'@receiz\/ai-skills':[\s\S]*?version: file:vendor\/receiz-ai-skills-109\.0\.0\.tgz/);
});

test("the v4 release preserves prior evidence and adds a complete v3-to-v4 qualification record", async () => {
  const [readme, changelog, releaseNotes, migration, readiness, evidence, envExample, v3Evidence, v4Evidence, v106MigrationAudit, v106MigrationAttestationText] = await Promise.all([
    read("README.md"),
    read("CHANGELOG.md"),
    read("RELEASE_NOTES.md"),
    read("docs/MIGRATING_TO_V2.md"),
    read("docs/PRODUCTION_READINESS.md"),
    read("docs/audits/2026-07-13-v2-release-evidence.md"),
    read(".env.example"),
    read("docs/superpowers/evidence/2026-07-15-wilds-v3-slice-8.md"),
    read("docs/releases/2026-07-16-v4-release-evidence.md"),
    read("docs/releases/2026-07-16-v106-migration-audit.md"),
    read("receiz.migration.v105-v106.json"),
  ]);
  const v106MigrationAttestation = JSON.parse(v106MigrationAttestationText) as { planDigest: string };

  assert.match(readme, /Current release:\s*`4\.2\.0`/);
  assert.match(changelog, /## 4\.2\.0 - Receiz v109 Local Verification/);
  assert.match(changelog, /## 4\.1\.0 - Receiz v108 Artifact Continuity/);
  assert.match(changelog, /## 2\.0\.0 - Commerce OS/);
  assert.match(releaseNotes, /Receiz Commerce Kit v2\.0\.0/);
  assert.match(releaseNotes, /@receiz\/sdk@100\.0\.0/);
  assert.match(migration, /# Migrating to v2\.0\.0/);
  assert.match(migration, /rollback/i);
  assert.match(readiness, /remote financial and domain mutations also require/i);
  assert.match(evidence, /228\/228/);
  assert.match(evidence, /real-money/i);
  assert.match(envExample, /RECEIZ_OAUTH_STATE_SECRET=/);
  assert.match(changelog, /## 3\.0\.0 - Wilds V3 Living World/);
  assert.match(releaseNotes, /Receiz Commerce Kit v3\.0\.0/);
  assert.match(v3Evidence, /552 passing/);
  assert.match(v3Evidence, /9\.23\/10/);
  assert.match(changelog, /## 4\.0\.0 - Wilds Living Cards/);
  assert.match(releaseNotes, /Receiz Commerce Kit v4\.0\.0/);
  assert.match(releaseNotes, /Complete V3-to-V4 recap/);
  assert.match(v4Evidence, /@receiz\/sdk@106\.0\.0/);
  assert.match(v4Evidence, /738 passing/);
  assert.match(v4Evidence, /final player-facing Arena renderer/i);
  assert.match(v106MigrationAudit, new RegExp(v106MigrationAttestation.planDigest));
  assert.match(v106MigrationAudit, /Writes performed:\s*`0`/);
  assert.match(v106MigrationAudit, /Existing proof history was not rewritten/);
});
