# V5 Canonical Documentation Release Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Release Receiz Commerce Kit `5.0.0` with a governed documentation hierarchy, a complete post-V4 achievement record, and deterministic release checks that preserve the canonical Receiz documentation routes.

**Architecture:** External Receiz documentation remains canonical while this repository documents implementation, evidence, and release history. A small zero-network Node.js check enforces required references, current-release version consistency, achievement-timeline coverage, required V5 artifacts, and local-link integrity through the existing release gate.

**Tech Stack:** Markdown, Node.js ESM, pnpm, Next.js repository release tooling, GitHub issue forms.

## Global Constraints

- Release target is exactly `5.0.0`.
- SDK, MCP server, and AI-skills targets remain exactly `119.0.0`.
- Use `https://docs.receiz.com` as the canonical human-readable build reference.
- Use `https://receiz.com/developers` as the canonical live developer portal.
- Do not duplicate external API documentation in the repository.
- Do not rewrite historical release audits or migration attestations.
- Do not change product-runtime behavior.
- Do not push, create or replace a Git tag, publish packages, deploy, migrate production data, or claim unverified release results.

---

## File Map

- Create `docs/README.md`: task-oriented documentation index and source hierarchy.
- Create `docs/V5_ACHIEVEMENTS.md`: cumulative v107-v119 SDK and post-V4 application record.
- Create `scripts/documentation-contract-check.mjs`: deterministic documentation-governance check.
- Create `docs/releases/2026-08-14-v500-documentation-release-audit.md`: V5 scope, evidence, qualification, and exclusions.
- Modify `README.md`: front-door documentation routes, V5 framing, version metadata, repository map.
- Modify `CONTRIBUTING.md`: docs-first SDK workflow and verification requirements.
- Modify `SUPPORT.md`: canonical references before issue filing.
- Modify `ai-skills/README.md`: canonical external reference and local implementation boundary.
- Modify `.github/pull_request_template.md`: documentation contract checklist.
- Modify `.github/ISSUE_TEMPLATE/bug_report.yml`: canonical docs context for reports.
- Modify `.github/ISSUE_TEMPLATE/feature_request.yml`: canonical docs context for proposals.
- Modify `package.json`: version, `docs:check`, and release check integration support.
- Modify `pnpm-lock.yaml`: importer version synchronization if pnpm records it.
- Modify `scripts/release-check.mjs`: run `pnpm docs:check` first.
- Modify `CHANGELOG.md`: cumulative V5 entry.
- Modify `RELEASE_NOTES.md`: official V5 release narrative.

### Task 1: Add the deterministic documentation contract

**Files:**
- Create: `scripts/documentation-contract-check.mjs`
- Modify: `package.json`
- Modify: `scripts/release-check.mjs`

**Interfaces:**
- Consumes: repository files relative to `process.cwd()`.
- Produces: `pnpm docs:check`, exiting `0` with a requirement count or `1` with one line per failed requirement.

- [ ] **Step 1: Add the documentation checker and package command**

Implement a Node ESM script with these exact responsibilities:

```js
#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const failures = [];
const checks = [];

function read(relativePath) {
  const absolutePath = resolve(root, relativePath);
  if (!existsSync(absolutePath)) {
    failures.push(`${relativePath}: required file is missing`);
    return "";
  }
  return readFileSync(absolutePath, "utf8");
}

function requireText(relativePath, text, label) {
  const content = read(relativePath);
  checks.push(`${relativePath}: ${label}`);
  if (!content.includes(text)) failures.push(`${relativePath}: missing ${label}: ${text}`);
}
```

Complete the script by checking the governed URL files, `5.0.0` current
metadata, SDK timeline markers `v107` through `v119`, required V5 artifacts,
and relative Markdown links in governed documents. Ignore absolute URLs,
anchors, `mailto:`, image links, and links inside fenced code blocks. Print
`Documentation contract passed (<count> requirements).` when no failures
exist; otherwise print `Documentation contract failed:` and each failure.

Add `"docs:check": "node scripts/documentation-contract-check.mjs"` to
`package.json`. Insert `['pnpm', ['docs:check']]` as the first check in
`scripts/release-check.mjs`.

- [ ] **Step 2: Run the new check and verify it fails for missing V5 artifacts**

Run: `pnpm docs:check`

Expected: non-zero exit with specific failures for `docs/README.md`,
`docs/V5_ACHIEVEMENTS.md`, the V5 audit, version `5.0.0`, and canonical URLs.

- [ ] **Step 3: Commit the failing governance contract**

```bash
git add package.json scripts/release-check.mjs scripts/documentation-contract-check.mjs
git commit -m "test: enforce V5 documentation contract"
```

### Task 2: Establish the canonical documentation front door

**Files:**
- Create: `docs/README.md`
- Modify: `README.md`
- Modify: `CONTRIBUTING.md`
- Modify: `SUPPORT.md`
- Modify: `ai-skills/README.md`
- Modify: `.github/pull_request_template.md`
- Modify: `.github/ISSUE_TEMPLATE/bug_report.yml`
- Modify: `.github/ISSUE_TEMPLATE/feature_request.yml`

**Interfaces:**
- Consumes: the source hierarchy approved in the V5 design.
- Produces: one consistent builder path across every public repository entry point.

- [ ] **Step 1: Create the repository documentation map**

Write `docs/README.md` with:

- a top-level "Receiz Documentation" heading;
- prominent links labeled "Canonical Receiz documentation" and "Receiz developer portal";
- the six-level source-of-truth hierarchy from the design;
- a "Start by task" table for first run, SDK/API integration, architecture,
  rail lookup, production release, migration, security, support, AI agents,
  and historical evidence;
- a "Change contract" table mapping change classes to required local docs;
- a conflict rule requiring current published contracts plus local correction;
- an explicit statement that local docs implement and evidence the platform
  contract rather than mirror it.

- [ ] **Step 2: Upgrade the README front door**

Immediately after the current-release line, add a short "Build with Receiz"
section linking to `https://docs.receiz.com`,
`https://receiz.com/developers`, `docs/README.md`,
`docs/DEVELOPER_KERNEL.md`, and `docs/SDK_RAILS.md`. State the canonical/local
boundary in two sentences. Update the repository map to describe
`docs/README.md` and `docs/V5_ACHIEVEMENTS.md`.

- [ ] **Step 3: Route contributor and support workflows through the map**

Add canonical documentation and developer portal links to `CONTRIBUTING.md`.
Require contributors changing SDK rails to consult the current external
contract, update `docs/SDK_RAILS.md`, and run `pnpm docs:check`.

Add `docs/README.md`, `https://docs.receiz.com`, and
`https://receiz.com/developers` to `SUPPORT.md` before the existing local guide
list. Distinguish platform-contract questions from repository bugs.

- [ ] **Step 4: Route agents and GitHub intake through the same hierarchy**

Add a "Canonical Documentation Boundary" section to `ai-skills/README.md`
that sends agents to the canonical documentation and developer portal before
inventing or extrapolating rails, while preserving proof-object authority.

Add `pnpm docs:check` and documentation-impact prompts to the pull-request
template. Add a short canonical docs reminder to both issue forms without
making external availability a submission requirement.

- [ ] **Step 5: Run the partial contract and Markdown checks**

Run: `pnpm docs:check`

Expected: canonical-link and documentation-map checks pass; remaining failures
are limited to V5 version, achievements, and release artifacts.

Run: `git diff --check`

Expected: exit `0`.

- [ ] **Step 6: Commit the documentation front door**

```bash
git add README.md CONTRIBUTING.md SUPPORT.md ai-skills/README.md docs/README.md .github/pull_request_template.md .github/ISSUE_TEMPLATE/bug_report.yml .github/ISSUE_TEMPLATE/feature_request.yml
git commit -m "docs: establish canonical Receiz build references"
```

### Task 3: Publish the cumulative V5 achievement record

**Files:**
- Create: `docs/V5_ACHIEVEMENTS.md`

**Interfaces:**
- Consumes: `CHANGELOG.md`, `RELEASE_NOTES.md`, git history from `v4.0.0`, and `docs/releases/*v10[7-9]*`, `*v11[0-9]*` audit evidence.
- Produces: a claim-to-evidence narrative for SDK v107 through v119 and repository work after V4.

- [ ] **Step 1: Write the executive capability narrative**

Explain the shift from a V4 living-card application on SDK v107 to a V5
reference system on SDK v119. Organize the story around exact artifact custody,
local verification, authority-safe recovery, atomic portable transitions,
global/offline reconciliation, generated integration contracts, recursive
continuity, and agent doctrine.

- [ ] **Step 2: Add the v107-v119 SDK timeline**

Include an evidence-linked row for each represented release:

- v107: unified semantic operations and signed offline proposals;
- v108: whole-artifact custody, verify-before-extract, ownership appends, checkpoints;
- v109: zero-network local `.receizbundle` verification;
- v110: unified typed admission and authority-safe recovery;
- v111: exact-byte-derived authority and stronger identity/history evidence;
- v112: typed transition custody, durable staging, atomic named-domain commit;
- v113: global resolution and offline reconciliation without silent merging;
- v114: public package alignment and synchronized AI doctrine;
- v116: generated sixteen-operation application integration contract;
- v118: continuity-law expansion and coordinated public package evidence;
- v119: recursive Kai head selection, exact-append Merkle commitments,
  Fibonacci ancestry, and enclosing-proof sports-card admission.

Do not invent v115 or v117 releases; explain that coordinated repository
history moves through the published versions represented by evidence.

- [ ] **Step 3: Add application achievements and build outcomes**

Document post-V4 responsiveness fixes, deterministic CLI qualification,
verified Receiz ID gating, server-side card resolution, the stable sixteen-
operation boundary, thirty-two aligned skills, preserved historical proof,
and the cumulative release/audit system. Add a practical list of products a
fork can build now and why each outcome follows from the architecture.

- [ ] **Step 4: Add quantitative evidence, limits, and index**

Use current checked-in v119 evidence for 750 tests, 15 conformance checks,
32 skills, 16 operations, 30 numbered artifact laws, and 18 named continuity
laws. Label these as the v119 baseline until fresh V5 qualification supplies
new results. Add explicit non-claims and an evidence index linking to every
historical audit used.

- [ ] **Step 5: Check coverage and prose integrity**

Run: `pnpm docs:check`

Expected: timeline coverage passes; failures remain for V5 release metadata
and audit only.

Run: `rg -n 'DRAFT_ONLY|INSERT_CONTENT' docs/V5_ACHIEVEMENTS.md`

Expected: no matches.

- [ ] **Step 6: Commit the achievement record**

```bash
git add docs/V5_ACHIEVEMENTS.md
git commit -m "docs: record the Receiz V4 to V5 achievement arc"
```

### Task 4: Assemble the official V5 repository release

**Files:**
- Modify: `package.json`
- Modify: `pnpm-lock.yaml`
- Modify: `README.md`
- Modify: `CHANGELOG.md`
- Modify: `RELEASE_NOTES.md`
- Create: `docs/releases/2026-08-14-v500-documentation-release-audit.md`

**Interfaces:**
- Consumes: completed documentation contract and achievement record.
- Produces: one internally consistent `5.0.0` repository release candidate.

- [ ] **Step 1: Update release identity**

Set `package.json` version to `5.0.0`. Use `pnpm install --lockfile-only
--offline` only if required to synchronize importer metadata; do not change
dependency versions. Update README current release to `5.0.0` while retaining
SDK target `119.0.0`.

- [ ] **Step 2: Add the V5 changelog entry**

Add a leading `## 5.0.0 - Canonical Documentation and Institutional Record`
entry covering the canonical docs architecture, cumulative v107-v119 record,
builder/contributor/agent routing, deterministic docs governance, and retained
v119 runtime contract.

- [ ] **Step 3: Add the V5 release notes**

Prepend an official V5 section dated August 14, 2026. Lead with what builders
can now do, then explain the post-V4 SDK arc, documentation hierarchy,
executable evidence, unchanged SDK target, and source-release exclusions.

- [ ] **Step 4: Draft the V5 release audit before qualification**

Create the audit with release identity, scope, evidence sources, documentation
contract, preserved runtime baseline, and exclusions. Its qualification
section must list commands to be run but use neutral language such as
"Qualification requires" until fresh command results are available.

- [ ] **Step 5: Run the documentation contract to green**

Run: `pnpm docs:check`

Expected: `Documentation contract passed` with exit `0`.

Run: `git diff --check`

Expected: exit `0`.

- [ ] **Step 6: Commit the V5 release candidate**

```bash
git add package.json pnpm-lock.yaml README.md CHANGELOG.md RELEASE_NOTES.md docs/releases/2026-08-14-v500-documentation-release-audit.md
git commit -m "release: prepare Receiz Commerce Kit v5.0.0"
```

### Task 5: Qualify and finalize the V5 release evidence

**Files:**
- Modify: `docs/releases/2026-08-14-v500-documentation-release-audit.md`
- Modify: `docs/V5_ACHIEVEMENTS.md` only if fresh counts differ from the v119 baseline.

**Interfaces:**
- Consumes: the complete V5 release candidate.
- Produces: fresh, truthful qualification evidence and a clean final release commit.

- [ ] **Step 1: Run focused documentation and secret checks**

Run: `pnpm docs:check`

Expected: exit `0`.

Run: `pnpm secret:scan`

Expected: exit `0` with no tracked secret findings.

- [ ] **Step 2: Run the complete release gate**

Run: `pnpm release:check`

Expected: every orchestrated check exits `0`, including docs contract, secret
scan, tests, typecheck, app check, conformance, CLI check, release lock,
AI-skill validation, lint, production build, and SDK doctor.

- [ ] **Step 3: Record only fresh evidence**

Replace neutral qualification language in the V5 audit with the exact fresh
results: test count, conformance count, skill count, docs requirement count,
build outcome, and doctor outcome. If a gate fails, record the failure and do
not describe the release as qualified.

- [ ] **Step 4: Verify requirements and diff scope**

Run: `rg -n 'docs\.receiz\.com|receiz\.com/developers' README.md CONTRIBUTING.md SUPPORT.md docs/README.md ai-skills/README.md .github`

Expected: canonical references appear in all governed entry points.

Run: `rg -n 'Current release:.*4\.10\.0|"version": "4\.10\.0"' README.md package.json pnpm-lock.yaml`

Expected: no matches.

Run: `git diff v4.10.0 --stat && git diff v4.10.0 --check`

Expected: only planned documentation and release-governance files differ; diff
check exits `0`.

- [ ] **Step 5: Commit final qualification evidence**

```bash
git add docs/releases/2026-08-14-v500-documentation-release-audit.md docs/V5_ACHIEVEMENTS.md
git commit -m "docs: attest V5 release qualification"
```

- [ ] **Step 6: Report the repository release state**

Report commit hashes, verification commands and results, changed documentation
entry points, and external actions not performed. Do not claim a remote push,
tag, deployment, package publication, or production migration.
