# Receiz Commerce Kit v114 Public-Package Release Design

Date: July 28, 2026

## Outcome

Upgrade Receiz Commerce Kit from the coordinated Receiz v113 package set to the
exact coordinated v114 packages published on the public npm registry. Align the
application code, checked-in AI skills, migration tooling, release lock, tests,
and release evidence with the executable v114 package contracts.

This work consumes the public release. It does not modify or publish the Receiz
source repository, replace package bytes, rewrite remote tags, deploy an
application, or execute a production data migration.

## Authoritative Inputs

The only package authority for this release is the public npm registry:

| Package | Exact version | Published integrity |
| --- | --- | --- |
| `@receiz/ai-skills` | `114.0.0` | `sha512-DUxwEi8uxgg2FBMBWmK9h2uP7PGOCuPYGjqBR1StlIR28bhkhCWYh99uOpbqqRML+fqYsUlDFCYlwaZqrOZbOw==` |
| `@receiz/sdk` | `114.0.0` | `sha512-v1oQ4Ye9sOsUVW7HH5DP0XDA1yqBfi8p2OOOjVrLBo0jGH6J2zZuaOx4vfuid0Yf/DVpHP5sx/UWWLpnygORpw==` |
| `@receiz/mcp-server` | `114.0.0` | `sha512-0RwDXl9+BLwLWwlrvbstqXEZ4nDEl/4NXKuLP+30wiO+lyon90uPtgldOMwEBKtFdAxxSkmi/3ecakpBJ576rg==` |

The SDK and MCP dependency manifests must resolve the same
`@receiz/ai-skills@114.0.0`, and the MCP package must resolve the same
`@receiz/sdk@114.0.0`. A version or integrity mismatch stops the release.

The installed v114 registry, laws, operation matrix, package documentation, and
generated SDK contracts govern application alignment. Existing application
tests and documentation do not overrule those published contracts.

## Release Boundary

The release contains:

1. Exact public v114 SDK, MCP server, and AI-skills installation through pnpm.
2. Removal of v113 local-tarball overrides for those packages.
3. Synchronization of the repository's checked-in `ai-skills/` distribution
   with the published v114 AI-skills package, preserving repository-owned files
   only where the existing distribution contract explicitly requires them.
4. Upgrade of Receiz CLI target, migration verifier, release lock, package
   scripts, compatibility fixtures, and release documentation from v113 to
   v114.
5. Application changes required by the published v114 APIs and executable laws.
6. A new application release version and v114 migration/release audit.
7. Complete local qualification and independent package-integrity evidence.

The release excludes:

- edits to `/Users/bjklock/Kai-Turah/receiz`;
- npm publication or deprecation;
- Git tag replacement in the Receiz source repository;
- production deployment;
- production database or artifact migration;
- claims based only on UI rendering, an agent assertion, or stale v113 evidence.

## Package Installation and Verification

Remove the three `file:vendor/*-113.0.0.tgz` overrides before installation.
Install exact versions rather than ranges:

- `@receiz/ai-skills@114.0.0`
- `@receiz/sdk@114.0.0`
- `@receiz/mcp-server@114.0.0`

The pnpm lockfile must record the public registry artifacts and their published
integrities. After installation, inspect each installed package manifest and
the lockfile. Reject a transitive downgrade, mixed v113/v114 package graph, or
unexpected tarball source.

The historical vendor archives remain historical inputs unless a repository
contract requires their removal. They must not remain active package overrides.

## Law-Driven Application Alignment

Application alignment begins with the public package outputs, not a broad
version-string replacement:

1. Read the installed v114 release, migration, constitutional-law, artifact,
   authority, and testing manifests.
2. Record the active registry digest, artifact-law version, operation-matrix
   digest, allowed operations, forbidden operations, and required evidence.
3. Run the v114 application compiler/check and migration dry run.
4. Map every reported mismatch to its governing v114 contract and exact
   application code path.
5. Change only affected application boundaries.
6. Add or update positive, denial, replay, compatibility, and migration tests.
7. Preserve unknown namespaces, exact artifact bytes, verified history,
   deterministic first paint, and historical v113 verification.

No v113-named script or fixture may be renamed without updating its executable
assertions. Historical v113 evidence remains immutable and must not be rewritten
as v114 evidence.

## Checked-In AI-Skills Distribution

The public `@receiz/ai-skills@114.0.0` archive is the source for the checked-in
skill contracts. Synchronization must:

- copy the published skill content exactly where the repository mirrors it;
- preserve repository-owned package exclusions documented by the existing
  distribution test;
- validate every skill manifest;
- require v114 registry and operation-matrix parity across all skills;
- reject stale current-v113 language, package ranges, and tool inventories;
- keep historical version references only where explicitly labeled historical.

## Release Identity and Documentation

Promote the application package version using the repository's established
minor-release convention unless an existing release contract dictates a
different value. Add:

- a v114 migration verifier and release-lock entry point;
- a dated v114 migration and release audit;
- exact public package versions and integrity values;
- active registry, artifact-law, and operation-matrix identities;
- compatibility and independent-verifier results;
- explicit exclusions for deployment and production migration.

Documentation must distinguish a payload from a sealed artifact and must not
claim production readiness while required evidence is absent or failing.

## Qualification

Qualification runs from a clean dependency graph and includes, at minimum:

1. Public package version and integrity verification.
2. AI-skills distribution validation.
3. Receiz doctor, v114 application check, and migration dry run.
4. V114 migration verification and CLI compatibility checks.
5. TypeScript typecheck.
6. Lint.
7. Full automated tests, including law, mutation, replay, compatibility,
   deterministic-surface, and release-guard contracts.
8. Production build.
9. Secret scan and repository release checks.
10. MCP conformance.
11. Independent exact-byte artifact verification with zero network calls during
    verification.
12. Final v114 release lock.

Where a check requires credentials, a live service, or production mutation, the
release audit records the exact unavailable boundary and refuses to claim that
evidence. Tests may be strengthened to catch a v114 regression; they may not be
weakened to make an incompatible implementation pass.

## Failure Handling and Rollback

Package or registry skew, authority bypass, ambiguous migration, missing
capability, failed independent verification, or missing release-lock evidence
stops completion.

Before any production deployment, rollback is a normal source rollback: restore
the v113 dependency graph and application code, reinstall, and rerun the v113
release lock. Existing sealed artifacts and historical registries are never
rewritten.

This task does not perform production deployment, so no production rollback or
data reversal is authorized.

## Acceptance Criteria

The release is complete only when:

- all three exact public v114 packages are installed from npm with matching
  integrity values;
- no active v113 local-tarball override remains;
- the installed package graph, checked-in AI skills, registry identity,
  operation matrix, and application release tooling agree on v114;
- application code passes the v114 compiler and conformance contracts;
- historical v113 artifacts remain verifiable;
- required local qualification and independent-verifier evidence pass;
- the final v114 application release lock passes;
- the release audit truthfully identifies any external evidence not performed;
- no Receiz source-repository modification, npm publication, deployment, or
  production migration occurred.
