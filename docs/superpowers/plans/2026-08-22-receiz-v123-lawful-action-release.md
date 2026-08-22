# Receiz v123 Lawful Action Release Implementation Plan

> Execute every behavior test-first. Observe each new test fail for the expected
> missing behavior before changing production code.

**Goal:** Ship application 5.1.0 on the complete Receiz 123.0.0 SDK, MCP, and AI
skills surface while making source-over-representation invariants mechanically
enforceable.

**Architecture:** Preserve the v122 compatibility layer and add a frozen v123
adapter plus edge custody, exact intent storage/recovery, canonical routes,
public doctrine, and release-time structural checks. The public Receiz packages
are the source for registry, matrix, tools, and skills.

---

## Task 1: Align canonical packages and generated contracts

1. Add failing release-identity assertions for application 5.1.0, Receiz
   123.0.0, the v123 registry/matrix digests, 36 operations, 141 MCP tools, 8
   v123 tools, and 42 skills.
2. Run the focused tests and confirm v122 identity failures.
3. Pin the three Receiz packages to 123.0.0 and refresh the lockfile.
4. Run the SDK app-upgrade preview/confirmation and retain the migration
   attestation without rewriting history.
5. Copy the published AI-skill tree exactly, excluding only its package manifest.
6. Re-run focused identity tests.

## Task 2: Add the v123 adapter boundary

1. Extend the adapter test with every v123 method and confirm failure.
2. Add the frozen `v123` adapter surface using only `ReceizClient` methods.
3. Verify v122 remains present and the adapter test passes.

## Task 3: Enforce proof-authority custody

1. Add negative tests for missing verification, consent, application binding,
   broad/unregistered scopes, bearer persistence, and secret serialization.
2. Add edge helpers that accept a runtime verified-artifact witness, build the
   exact exchange input, validate non-refreshable authority, and keep bearer
   capabilities in an in-memory vault.
3. Add granted-scope inspection from an authority-bound SDK client.
4. Verify the negative and positive custody tests.

## Task 4: Add canonical planning and exact namespaces

1. Add failing tests proving client-supplied security values are rejected and
   exact subject head/name pins are required.
2. Expose SDK planners and namespace resolution through v123 request modules and
   no-store route projections.
3. Ensure the routes accept no private key, wrapping key, verifier, receipt, or
   authority override fields.
4. Verify planners and namespace tests.

## Task 5: Add exact value execution and recovery

1. Add failing tests for Phi-only movement, explicit rail selection, exact plan
   persistence, scope denial, zero-write preservation, and unknown lookup before
   retry.
2. Implement durable exact-intent storage with canonical-byte validation.
3. Implement execution through the SDK with an in-memory proof authority.
4. Implement lookup-before-retry and forbid replanning while unknown.
5. Integrate the flow into account value controls without persisting a bearer.
6. Verify value execution tests and UI contract tests.

## Task 6: Publish complete doctrine and enforcement

1. Add failing contract tests for all eight v123 SDK/MCP/AI mappings and source
   rank.
2. Add v123 contract/doctrine modules and update `/developers/receiz`, operator
   evidence, README, SDK rails, and release notes.
3. Add a v123 authority scanner that rejects authority inflation, secret
   persistence, USD movement, implicit rails, and retry-before-lookup.
4. Add migration verification and a release lock covering every canonical count,
   digest, package integrity, local skill byte, and behavioral invariant.
5. Wire `release:check` and package scripts to v123.

## Task 7: Verify and release

1. Run all focused v123 tests and release-lock checks.
2. Run `pnpm release:check` and inspect the complete output and exit status.
3. Inspect the final diff, ensure no untracked artifacts or unrelated changes,
   and verify application/package identities.
4. Commit the release and create annotated tag `v5.1.0`.
5. Do not push; report the exact commit and tag for the user to push.

