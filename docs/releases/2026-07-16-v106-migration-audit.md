# Receiz v105 to v106 migration audit

Date: 2026-07-16

Dry-run plan digest: `526bd9ea04a65dba58052ecdc5db4f18ddc6f371978bd7cf371e47e85d1c6d84`
Writes performed: `0`

## Result

The fail-closed v106 migration heuristic reported 81 ambiguous findings and no automatic safe changes. The plan was not applied because v106 correctly refuses to rewrite ambiguous authority or existing witnessed history.

The findings were manually reviewed by category against the exact source files, the v106 application inspector, the constitutional release lock, and the full release suite. They are conservative syntax matches rather than unresolved canonical authority changes:

- **One `version-skew` match:** the detector reads exact local tarball overrides such as `file:vendor/receiz-sdk-106.0.0.tgz` as a nonliteral dependency version. The dependency declarations, installed release identities, lockfile, tarball paths, MCP package, AI-skill package, and release lock all independently resolve to exact `106.0.0`.
- **52 `silent-fallback` matches:** these are typed HTTP error responses, invalid-artifact/parser rejection values, local display defaults, safe recovery projections, or explicit “nothing adopted/consumed” rollback results. They do not convert a denied canonical command into success, append an event, grant a reward, change ownership, revive a retired card, or discard a valid injury or spend.
- **Nine `unverified-projection-publication` matches:** checkout and store publication route through `publishAndAdmitReceizStoreState`; multiplayer and world publication produce explicitly weaker room/world projections and recovery-pending results; WebGL diagnostics publish renderer measurements only. None are represented as proof verification or stronger truth.
- **19 `direct-canonical-write` matches:** these occur inside deterministic in-memory simulation reducers, cloned consequence projections, render/diagnostic state, or tests. Canonical Hearttree and Wayfarer outcomes still require replay and server admission; global world facts still require the authoritative world service; Arena offline updates remain receipt-bound, atomic, causal, and pending global recomputation.

## Independent evidence

- `receiz app check --target 106.0.0 --json` returned `integration_compliant`, no compiler-import migrations, and no blocking findings.
- `pnpm receiz:release-lock` proved exact package, registry, MCP, AI-skill, lockfile, and conformance parity.
- `pnpm receiz:conformance` passed 13/13 checks with zero network calls and zero database-authority calls.
- The complete v4 release gate passed 738 tests, typecheck, lint, production build, secret scan, and SDK doctor.

## Authority disposition

The dry-run plan remains an inspectable advisory record and was deliberately not force-applied. Existing proof history was not rewritten. Sealed Receiz proof objects and verified local history remain stronger than this audit, the migration tool, SDK, MCP, AI skills, server, database, session, and UI projections.
