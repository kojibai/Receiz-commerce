# Receiz v127 Full Release Implementation Plan

> **For agentic workers:** Use the native execution workflow to implement this plan task-by-task and obtain a fresh whole-change review before publication.

**Goal:** Upgrade the complete coordinated Receiz integration to 127.0.0 and publish application v5.3.0 with verified release evidence.

**Architecture:** Retain the application's existing adapter and trusted-host authority boundaries. Generate current contracts from published SDK exports, retain app-specific laws, mirror published AI assets exactly, and verify the release using the repository's full release pipeline.

**Tech Stack:** Next.js 15, TypeScript, pnpm, Receiz SDK/MCP/AI 127.0.0.

**Spec:** User request: “update to v127 in full and do a full release.” Existing release conventions are application semver tags and a private application package.

## Global Constraints

- Pin all three Receiz packages exactly to 127.0.0; application version 5.3.0.
- Preserve historical proof records, protocol identifiers, and prior release attestations.
- No invented authority, implicit legacy HTTP enablement, enrollment, or production data migration.
- Full release authorizes a release commit, tag, push, and GitHub release; use existing configured repository.
- Continue in the existing clean checkout, as with the preceding requested upgrade and commit.

## Review Focus

- v127 default historical HTTP operations fail before network requests unless explicitly configured.
- SDK/compiler/Node-only entrypoints stay outside browser bundles.
- Generated boundaries, canonical registry, app registry, and bundled AI hashes match exact published inputs.
- Reviewed scanner exceptions cannot suppress application-code findings or changed published bytes; remove exceptions when upstream fixes them.
- Release commit, version, tag, notes, and published target identify the same tested source.

## Tasks

- [x] 1. Inspect published v127 exports and run existing identity tests against the new dependencies to expose stale contracts.
- [x] 2. Update package/app versions, current registry overlay, generated operation matrix/capabilities, current contract constants, and AI bundle. Create v127 migration/release gates and update current tests without rewriting historical evidence.
- [x] 3. Verify historical transport and new entrypoint boundaries; add regression coverage for changed defaults. Update developer documentation, changelog, release notes, and integrity attestation.
- [x] 4. Run `pnpm release:check`, inspect every result, and fix actual compatibility failures. Obtain a fresh review of the whole diff; rerun impacted checks after changes.
- [ ] 5. Commit tested source, create v5.3.0 tag, push to the configured remote, publish GitHub release notes, and verify remote source/tag and CI state.

## Execution ledger

- Initial checkout: clean main at 06f774ef; origin/main has the same SHA.
- Published SDK/MCP/AI versions: 127.0.0. Registry 8d0b5b839d02d9efbd4306cc99410595a183705c2670b76d2567eaaaade99065; operation matrix eadd171a45fcc51e275a1c57de1eb8e67614757a5723d141793641edf7207a10; 60 operations; 330 MCP tools; AI counts 43/37/34.
- Existing identity tests fail against v127 as expected, before contract changes.
- Ruling: Native implementation in current checkout — existing session authorization covers the upgrade/release; no additional approval checkpoint needed for routine implementation.

- Full release gate passed: 814 tests; production build and doctor successful. Browser check has no console errors/warnings. Fresh whole-change review found no blockers. Final package-law regression: 6 passed.
- Publication uses the authorized GitHub connection because shell credentials lack repository write access. The remote tree must match the exact staged local tree before publication; GitHub release creates the version tag.
