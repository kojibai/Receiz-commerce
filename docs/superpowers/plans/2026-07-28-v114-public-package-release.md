# Receiz Commerce Kit v114 Public-Package Release Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Release Receiz Commerce Kit 4.7.0 against the exact public `@receiz/sdk`, `@receiz/mcp-server`, and `@receiz/ai-skills` 114.0.0 packages.

**Architecture:** The public npm packages are the only Receiz v114 package authority. The application consumes their exact registry, operation matrix, CLI migration, conformance runner, and AI-skill manifests; repository release tooling independently verifies package integrity and law parity before declaring the app release qualified.

**Tech Stack:** pnpm 10.29.1, Node.js 20+, TypeScript, Next.js 15, Node test runner, public Receiz 114.0.0 packages.

## Global Constraints

- Install exact public versions: `@receiz/ai-skills@114.0.0`, `@receiz/sdk@114.0.0`, and `@receiz/mcp-server@114.0.0`.
- Require registry digest `ae912154d97b695464c3a19361bceb9440bc5d703a1d9129edac92c64192e29a`.
- Require operation-matrix digest `fd4ea8fccd867a0b9aab772ea6c5827ea8bdfe4c7fbed017c5a4843a40109c4f`.
- Require compatibility range `>=114.0.0 <115.0.0` and the complete 16-row v114 operation matrix.
- Preserve the v113 registry and historical v113 evidence unchanged.
- Remove active `file:vendor/*-113.0.0.tgz` overrides; historical archives may remain inactive.
- Never modify `/Users/bjklock/Kai-Turah/receiz`.
- Never publish npm packages, rewrite Receiz tags, deploy, or run a production migration.
- Stop on package-integrity skew, registry skew, authority bypass, ambiguous migration, missing exact permit confirmation, missing independent evidence, or a failing release lock.
- The exact app-apply preview digest must be shown to the user and explicitly confirmed before `receiz app apply --confirm <digest>` runs.

---

### Task 1: Install and Pin the Public v114 Package Graph

**Files:**
- Modify: `package.json`
- Modify: `pnpm-lock.yaml`
- Modify: `tests/v2-release-contract.test.ts`
- Modify: `tests/sdk-version.test.ts`

**Interfaces:**
- Consumes: Public npm package identities and integrity values from the approved design.
- Produces: An exact public v114 dependency graph with no active local Receiz package override.

- [ ] **Step 1: Change the release contract tests to require the new public graph**

Update `tests/v2-release-contract.test.ts` so its first test requires:

```ts
assert.equal(packageJson.version, "4.7.0");
assert.equal(packageJson.dependencies?.["@receiz/sdk"], "114.0.0");
assert.equal(packageJson.dependencies?.["@receiz/mcp-server"], "114.0.0");
assert.equal(packageJson.dependencies?.["@receiz/ai-skills"], "114.0.0");
assert.equal(packageJson.scripts?.["receiz:check"], "receiz app check --target 114.0.0 --json");
assert.doesNotMatch(lockfile, /file:vendor\/receiz-(?:sdk|mcp-server|ai-skills)-113\.0\.0\.tgz/);
assert.match(lockfile, /@receiz\/sdk@114\.0\.0/);
assert.match(lockfile, /@receiz\/mcp-server@114\.0\.0/);
assert.match(lockfile, /@receiz\/ai-skills@114\.0\.0/);
```

Update the dependency contract in `tests/sdk-version.test.ts` to require release/ruleset 114.0.0, registry digest `ae912154d97b695464c3a19361bceb9440bc5d703a1d9129edac92c64192e29a`, package range `>=114.0.0 <115.0.0`, and absence of Receiz package overrides.

- [ ] **Step 2: Run the focused tests and verify the old graph fails**

Run:

```bash
pnpm exec tsc -p tsconfig.test.json
node --test .test-build/tests/v2-release-contract.test.js .test-build/tests/sdk-version.test.js
```

Expected: failures naming app version 4.6.0, Receiz 113.0.0 dependencies, and local vendor overrides.

- [ ] **Step 3: Promote the app manifest and remove only the Receiz overrides**

Set `package.json` version to `4.7.0`, set all three Receiz dependencies to exact `114.0.0`, set `receiz:check` to target 114.0.0, and preserve the unrelated `postcss` override.

- [ ] **Step 4: Install the exact public packages**

Run:

```bash
pnpm install --save-exact
```

Require the lockfile to resolve public registry package snapshots rather than `file:vendor`.

- [ ] **Step 5: Verify the installed identities and public integrities**

Run a Node script that asserts the three installed `package.json` versions and the three pnpm lockfile integrity values:

```js
const expected = new Map([
  ["@receiz/ai-skills", "sha512-DUxwEi8uxgg2FBMBWmK9h2uP7PGOCuPYGjqBR1StlIR28bhkhCWYh99uOpbqqRML+fqYsUlDFCYlwaZqrOZbOw=="],
  ["@receiz/sdk", "sha512-v1oQ4Ye9sOsUVW7HH5DP0XDA1yqBfi8p2OOOjVrLBo0jGH6J2zZuaOx4vfuid0Yf/DVpHP5sx/UWWLpnygORpw=="],
  ["@receiz/mcp-server", "sha512-0RwDXl9+BLwLWwlrvbstqXEZ4nDEl/4NXKuLP+30wiO+lyon90uPtgldOMwEBKtFdAxxSkmi/3ecakpBJ576rg=="],
]);
```

Reject any mixed v113/v114 Receiz dependency.

- [ ] **Step 6: Rebuild tests and verify the package contract passes**

Run:

```bash
pnpm exec tsc -p tsconfig.test.json
node scripts/patch-test-imports.mjs
node --test .test-build/tests/v2-release-contract.test.js .test-build/tests/sdk-version.test.js
```

Expected: both focused files pass.

- [ ] **Step 7: Commit the public package graph**

```bash
git add package.json pnpm-lock.yaml tests/v2-release-contract.test.ts tests/sdk-version.test.ts
git commit -m "Upgrade public Receiz packages to v114"
```

### Task 2: Synchronize the Published v114 AI-Skills Distribution

**Files:**
- Modify: `ai-skills/**`
- Test: `ai-skills/scripts/validate-skills.mjs`
- Test: `tests/sdk-version.test.ts`

**Interfaces:**
- Consumes: `node_modules/@receiz/ai-skills` from Task 1.
- Produces: A checked-in mirror with schema `receiz.ai-skills-index.v114`, 32 skills, 26 manifests, registry/matrix parity, and no stale current-v113 contract.

- [ ] **Step 1: Run validation against the stale checked-in v113 skills**

Run:

```bash
pnpm validate:ai-skills
```

Expected: failure because the checked-in skills still identify v113 while the installed package identifies v114.

- [ ] **Step 2: Synchronize the public archive into the checked-in tree**

Mechanically mirror `node_modules/@receiz/ai-skills/` into `ai-skills/`, excluding only the package manifest that the repository intentionally does not copy. Delete files absent from the public archive only within the explicit `ai-skills/` target.

- [ ] **Step 3: Verify the synchronized skill index**

Assert `ai-skills/skills.json` contains:

```json
{
  "schema": "receiz.ai-skills-index.v114",
  "version": "114.0.0",
  "registryDigest": "ae912154d97b695464c3a19361bceb9440bc5d703a1d9129edac92c64192e29a",
  "operationMatrixDigest": "fd4ea8fccd867a0b9aab772ea6c5827ea8bdfe4c7fbed017c5a4843a40109c4f"
}
```

Require every published manifest to use `receiz.ai-skill-contract.v114`, package ranges `>=114.0.0 <115.0.0`, and the same two digests.

- [ ] **Step 4: Run the distribution and dependency tests**

Run:

```bash
pnpm validate:ai-skills
pnpm exec tsc -p tsconfig.test.json
node scripts/patch-test-imports.mjs
node --test .test-build/tests/sdk-version.test.js
```

Expected: all pass.

- [ ] **Step 5: Commit the skill distribution**

```bash
git add ai-skills tests/sdk-version.test.ts
git commit -m "Synchronize public Receiz v114 AI skills"
```

### Task 3: Preview and Apply the Official v114 Application Migration

**Files:**
- Modify through SDK command: `receiz.app.json`
- Modify through SDK command: `receiz.constitution.json`
- Modify through SDK command: `receiz.generated.json`
- Create through SDK command: v113-to-v114 migration attestation named by the CLI
- Modify through SDK command: any SDK-owned generated adapter or configuration reported by the plan

**Interfaces:**
- Consumes: Public v114 CLI and the current v113 application contract.
- Produces: SDK-generated v114 application artifacts plus a plan digest whose exact value is confirmed before writes.

- [ ] **Step 1: Generate a read-only official upgrade plan**

Run:

```bash
pnpm exec receiz app upgrade --root . --target 114.0.0 --json
```

Save the JSON output as evidence outside canonical app state. Require schema `receiz.app.upgrade_plan.v1`, target 114.0.0, and no ambiguous finding.

- [ ] **Step 2: Generate the exact app-apply preview**

Run:

```bash
pnpm exec receiz app apply --root . --json
```

Require a zero-write preview that reports the exact confirmation/preview digest and the complete file action set.

- [ ] **Step 3: Obtain exact user confirmation**

Present the exact preview digest and actions. Do not continue until the user confirms that exact digest.

- [ ] **Step 4: Apply only the confirmed SDK plan**

Run:

```bash
pnpm exec receiz app apply --root . --confirm <exact-confirmed-preview-digest> --json
```

Expected: a successful report with only the previewed writes.

- [ ] **Step 5: Verify the generated registry and application contract**

Run:

```bash
pnpm exec receiz app check --root . --target 114.0.0 --json
```

Require `ok: true`, v114 target, the 16-row current operation matrix, previous registry digest equal to the canonical v114 digest, and no blocking findings.

- [ ] **Step 6: Commit generated migration artifacts**

Stage only the SDK-reported file set and commit:

```bash
git commit -m "Apply official Receiz v114 app migration"
```

### Task 4: Align Constitutional, Application, and CLI Contracts

**Files:**
- Rename: `tests/receiz-v113-constitution.test.ts` to `tests/receiz-v114-constitution.test.ts`
- Modify: `tests/receiz-v114-constitution.test.ts`
- Modify: `tests/receiz-app-contract.test.ts`
- Modify: `tests/receiz-cli-lifecycle.test.ts`
- Modify: `src/lib/receiz/constitution.ts`
- Modify only if v114 typecheck/compiler requires it: `src/lib/receiz/adapter.ts`

**Interfaces:**
- Consumes: SDK-generated v114 registry and 16-row operation matrix from Task 3.
- Produces: Runtime and test contracts that bind app law evaluation to v114 while retaining historical artifact-law verification.

- [ ] **Step 1: Update tests to express v114 law**

Require:

```ts
assert.equal(RECEIZ_RELEASE_VERSION, "114.0.0");
assert.equal(RECEIZ_RULESET_VERSION, "114.0.0");
assert.equal(RECEIZ_V114_REGISTRY_DIGEST, "ae912154d97b695464c3a19361bceb9440bc5d703a1d9129edac92c64192e29a");
assert.equal(compiler.RECEIZ_CURRENT_APPLICATION_OPERATION_MATRIX.length, 16);
assert.equal(
  compiler.RECEIZ_CURRENT_APPLICATION_OPERATION_MATRIX_DIGEST,
  "fd4ea8fccd867a0b9aab772ea6c5827ea8bdfe4c7fbed017c5a4843a40109c4f",
);
```

Add assertions for the five new operations:

```ts
[
  "profile-showcase.genesis.plan",
  "profile-showcase.append.plan",
  "economy-showcase.genesis.plan",
  "economy-showcase.append.plan",
  "economy-showcase.merge.plan",
]
```

Require the literal profile identity law, carried-history law, and effects-derived profile/economy operation laws from the generated v114 registry.

- [ ] **Step 2: Run focused tests and record all real incompatibilities**

Run:

```bash
pnpm exec tsc -p tsconfig.test.json
node scripts/patch-test-imports.mjs
node --test .test-build/tests/receiz-v114-constitution.test.js .test-build/tests/receiz-app-contract.test.js .test-build/tests/receiz-cli-lifecycle.test.js
```

Expected initially: failures in v113-bound runtime constants, operation count, registry chaining, and CLI script names.

- [ ] **Step 3: Align runtime constitution imports and constants**

Update `src/lib/receiz/constitution.ts` to use current/v114 registry identity from the SDK. Preserve existing law evaluation, causal history, exact-byte verification, and stronger-truth ordering.

- [ ] **Step 4: Resolve only compiler-confirmed adapter API changes**

Run:

```bash
pnpm typecheck
pnpm receiz:check
```

If the public v114 SDK reports an adapter signature or import mismatch, update only that exact call site and add a focused assertion to `tests/sdk-version.test.ts`. Do not invent profile/economy authority in application objects.

- [ ] **Step 5: Rerun focused constitutional and application tests**

Run the Step 2 command again, then:

```bash
pnpm typecheck
pnpm receiz:check
```

Expected: all pass with zero blocking findings.

- [ ] **Step 6: Commit constitutional alignment**

```bash
git add src/lib/receiz tests/receiz-v114-constitution.test.ts tests/receiz-app-contract.test.ts tests/receiz-cli-lifecycle.test.ts tests/sdk-version.test.ts
git commit -m "Align application contracts with Receiz v114 law"
```

### Task 5: Build the v114 Migration Verifier and Release Lock

**Files:**
- Create: `scripts/receiz-v114-migration-verify.mjs`
- Create: `scripts/receiz-v114-release-lock.mjs`
- Modify: `scripts/receiz-cli-check.mjs`
- Modify: `package.json`
- Modify: `tests/receiz-cli-lifecycle.test.ts`
- Modify: `tests/v2-release-contract.test.ts`

**Interfaces:**
- Consumes: Public v114 installed identities, generated app migration attestation, checked-in skill mirror, and npm integrity values.
- Produces: Machine-readable v113-to-v114 migration evidence and a fail-closed v114 release lock.

- [ ] **Step 1: Write failing CLI lifecycle assertions**

Require package scripts:

```ts
assert.equal(pkg.scripts["receiz:migrate:verify"], "node scripts/receiz-v114-migration-verify.mjs --root .");
assert.equal(pkg.scripts["receiz:release-lock"], "node scripts/receiz-v114-release-lock.mjs");
```

Require migration report schema `receiz.repository.v113-v114.migration-verification.v1`, no rewritten history, v114 registry digest, and v114 matrix digest.

- [ ] **Step 2: Run the focused lifecycle test and verify failure**

Run:

```bash
pnpm exec tsc -p tsconfig.test.json
node scripts/patch-test-imports.mjs
node --test .test-build/tests/receiz-cli-lifecycle.test.js
```

Expected: failure because scripts still point at v113 files.

- [ ] **Step 3: Implement the v114 migration verifier**

Base the verifier on the v113 implementation, but require:

- target SDK 114.0.0;
- app package versions 114.0.0;
- app registry version 114.0.0;
- `previousRegistryDigest` equal to `ae912154d97b695464c3a19361bceb9440bc5d703a1d9129edac92c64192e29a`;
- 16 operations and matrix digest `fd4ea8fccd867a0b9aab772ea6c5827ea8bdfe4c7fbed017c5a4843a40109c4f`;
- literal identities `profile-showcase:<owner>` and `economy-showcase:receiz.com`;
- carried history, bounded append, effects-derived operations, and historical v113 compatibility;
- zero writes during verification.

- [ ] **Step 4: Implement the v114 release lock**

Use v114 SDK exports and check:

- exact installed versions and public pnpm integrities;
- absence of active Receiz file overrides;
- release/ruleset/registry/matrix parity;
- 16 operation rows;
- current MCP tool parity from the public package;
- local and installed skill-tree parity;
- conformance passes with zero network calls;
- migration verifier passes;
- release audit exists and contains all required evidence fields.

Emit schema `receiz.app.v114.release-lock.v1` and exit nonzero on any failed check.

- [ ] **Step 5: Update package and CLI routing**

Point `receiz:migrate:verify`, `receiz:release-lock`, and `scripts/receiz-cli-check.mjs` at the v114 target and verifier.

- [ ] **Step 6: Run focused script qualification**

Run:

```bash
pnpm receiz:migrate:verify
pnpm receiz:cli:check
pnpm receiz:release-lock
```

Expected: migration and CLI checks pass; release lock may fail only on the not-yet-created audit from Task 6.

- [ ] **Step 7: Commit the v114 release tooling**

```bash
git add package.json scripts/receiz-v114-migration-verify.mjs scripts/receiz-v114-release-lock.mjs scripts/receiz-cli-check.mjs tests/receiz-cli-lifecycle.test.ts tests/v2-release-contract.test.ts
git commit -m "Add Receiz v114 migration and release locks"
```

### Task 6: Document the 4.7.0 Release and Exact Evidence

**Files:**
- Modify: `README.md`
- Modify: `CHANGELOG.md`
- Modify: `docs/SDK_RAILS.md`
- Create: `docs/releases/2026-07-28-v114-migration-release-audit.md`
- Modify: `tests/v2-release-contract.test.ts`

**Interfaces:**
- Consumes: Actual command outputs and integrity evidence from Tasks 1–5.
- Produces: A truthful, immutable application release record consumed by the final lock.

- [ ] **Step 1: Add failing documentation assertions**

Require README current release `4.7.0`, a changelog heading `4.7.0 - Receiz v114 Profile and Economy Showcase Proof`, exact public package versions/integrities, registry/matrix digests, and explicit statements that deployment and production migration were not performed.

- [ ] **Step 2: Run the release-contract test and verify failure**

Run:

```bash
pnpm exec tsc -p tsconfig.test.json
node scripts/patch-test-imports.mjs
node --test .test-build/tests/v2-release-contract.test.js
```

Expected: failure on missing 4.7.0 documentation and v114 audit.

- [ ] **Step 3: Update current documentation without rewriting history**

Add new 4.7.0 sections to README and changelog. Update only current-version language in SDK rails; retain explicitly historical v113 sections.

- [ ] **Step 4: Write the v114 audit from actual evidence**

Include:

```md
SDK version: 114.0.0
Registry digest: ae912154d97b695464c3a19361bceb9440bc5d703a1d9129edac92c64192e29a
Artifact law version: 113.0.0
Operation matrix digest: fd4ea8fccd867a0b9aab772ea6c5827ea8bdfe4c7fbed017c5a4843a40109c4f
Network calls during verification: 0
Deployment performed: no
Production migration performed: no
```

Fill every remaining required completion field with observed output. Use `not performed` only for excluded external actions; do not use it for required local qualification.

- [ ] **Step 5: Run documentation and release-lock checks**

Run:

```bash
node --test .test-build/tests/v2-release-contract.test.js
pnpm receiz:release-lock
```

Expected: both pass.

- [ ] **Step 6: Commit release records**

```bash
git add README.md CHANGELOG.md docs/SDK_RAILS.md docs/releases/2026-07-28-v114-migration-release-audit.md tests/v2-release-contract.test.ts
git commit -m "Document Receiz Commerce Kit 4.7.0 release"
```

### Task 7: Run Full Qualification and Freeze the Release

**Files:**
- Modify if evidence values change: `docs/releases/2026-07-28-v114-migration-release-audit.md`
- Modify if a real regression is found: the exact source and test file governing that regression

**Interfaces:**
- Consumes: Complete v114 release candidate.
- Produces: Fresh local qualification evidence with an exact clean-tree commit.

- [ ] **Step 1: Run independent public-package and skill checks**

Run:

```bash
pnpm secret:scan
pnpm validate:ai-skills
pnpm receiz:doctor
pnpm receiz:migrate:dry-run
pnpm receiz:migrate:verify
pnpm receiz:cli:check
pnpm receiz:conformance
```

Expected: all pass; conformance reports zero network calls.

- [ ] **Step 2: Run static and automated verification**

Run:

```bash
pnpm typecheck
pnpm lint
pnpm test
```

Expected: all pass. Record exact test count and any non-blocking lint warnings.

- [ ] **Step 3: Run production build and repository checks**

Run:

```bash
pnpm build
pnpm receiz:release-lock
pnpm release:check
```

Expected: all pass. Do not conceal an unavailable credential, active dev-runtime guard, or external-service failure.

- [ ] **Step 4: Verify no forbidden scope changes occurred**

Run:

```bash
git status --short
git diff --check
git diff --stat HEAD
```

Confirm no modification under `/Users/bjklock/Kai-Turah/receiz`, no npm publication, no deployment, and no production migration.

- [ ] **Step 5: Update the audit with fresh observed counts**

Replace preliminary evidence values with exact final command results, rerun the focused release contract and v114 release lock, and commit:

```bash
git add docs/releases/2026-07-28-v114-migration-release-audit.md
git commit -m "Freeze Receiz v114 release evidence"
```

- [ ] **Step 6: Report the qualified release**

Report the exact app version, package integrities, registry digest, matrix digest, migration result, conformance network-call count, test/build/release-lock status, commit hash, and excluded external actions. Do not claim deployment or production migration.
