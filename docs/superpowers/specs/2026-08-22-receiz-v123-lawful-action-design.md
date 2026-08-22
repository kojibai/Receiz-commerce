# Receiz v123 Lawful Action Release Design

**Date:** 2026-08-22
**Application release:** 5.1.0
**Receiz release:** 123.0.0

## Purpose

Move the application from the v122 constitutional foundation to the complete
v123 execution surface without weakening the governing rule: representation
never outranks source. The exact enclosing proof object and its admitted append
history remain authority. SDK results, MCP output, AI output, server responses,
database rows, capabilities, plans, receipts, and UI are bounded projections.

V123 is additive. V122 proof objects, schemas, routes, and historical evidence
remain valid and are not rewritten. The application release is therefore 5.1.0.

## Canonical release identity

- SDK, MCP server, and AI skills: `123.0.0` exactly
- Registry digest: `945a581d1fc49c2dc18fbe8c129771ef464b8a58b96188bce561e88ae8b6ceeb`
- Application-operation matrix digest: `e08cec3e3ad22c20ddd6c08169ece19f094c366214d6d6b4dc432cd97558e2c5`
- Application operations: 36
- MCP tools: 141 total, including all 8 v123 tools
- AI skills: 42, including `receiz-proof-authority` and `receiz-value-execution`

## Architecture

### Sole SDK boundary

`createReceizCommerceAdapter` remains the sole application boundary around
`createReceizClient`. A frozen `v123` surface exposes only canonical SDK methods:

- `identity.exchangeProofAuthority`
- `auth.grantedScopes`, `scopesForRails`, `missingScopesForRails`, and
  `canUseRails`
- `world.planCommandV122` and `planTransactionV122`
- `subjects.resolveNamespaces`
- `value.executeSettlement`, `executeReserve`, and
  `executionByIdempotencyKey`

The v122 adapter remains intact for historical compatibility.

### Edge-first proof authority

Proof-authority exchange is an edge ceremony, not a server login shortcut:

1. The browser independently verifies the exact enclosing artifact.
2. The application requests only the minimum registered scopes.
3. The user sees and explicitly approves the application-bound consent.
4. The canonical challenge is signed with authority carried by the verified
   object.
5. The SDK exchanges the artifact and signed challenge for a short-lived,
   non-refreshable capability.
6. The bearer stays in memory only. It is never returned by MCP, written to
   application storage, logged, or treated as identity authority.
7. A client instantiated with that bearer introspects granted scopes before a
   protected operation.

The application refuses exchange when local verification, explicit consent,
application binding, or minimum-scope containment is absent.

### Canonical planning and namespace resolution

World command and transaction security values are generated only by the SDK
planners. Model, UI, server, and MCP inputs may propose semantic intent but may
not invent canonical IDs, digests, heads, or security values.

Namespace resolution pins the exact subject head and requested namespace names.
A stale or digest-mismatched response is returned as a failure projection and
cannot replace the verified subject state.

### Exact Phi execution

Settlement and Reserve remain explicit, separate rails. Phi micro-units are the
moved quantity; USD is deterministic display only.

Before submission, the application persists the exact canonical v122 value
intent, including its semantic idempotency key. Execution accepts only these
SDK outcomes:

- `committed`: retain exact receipt and proof references as evidence beneath the
  resulting proof objects.
- `zero-write`: preserve the exact denial and report zero writes.
- `unknown`: perform authoritative lookup by the original idempotency key before
  any retry. Replanning is forbidden.

Receipt, authority capability, database projection, and UI confirmation never
become proof authority.

## Application surfaces

- Account value controls gain an edge-held authority ceremony, granted-scope
  status, exact plan persistence, explicit execution, and recovery state.
- Existing v122 server routes remain compatible. New v123 server projections
  expose canonical planning, exact-head namespace resolution, and value outcome
  reporting without accepting private keys or making serialized verifier claims
  authoritative.
- `/developers/receiz` publishes the complete v123 SDK/MCP/AI mapping and the
  non-authority boundary for all eight new MCP outcomes.
- Operator evidence remains read-only and explicitly non-authoritative.

## Structural enforcement

The release lock prevents a partial or misleading implementation by checking:

- exact public package versions and integrity hashes;
- coordinated SDK/ruleset/registry/matrix identities;
- exact 36-operation parity in app and generated contracts;
- all 141 MCP tools and all 8 v123 tools;
- byte-for-byte local AI-skill parity with the published package;
- edge-only proof verification and in-memory bearer custody;
- explicit consent and minimum-scope enforcement;
- SDK-only canonical planning;
- exact intent persistence, distinct rails, Phi-only movement, zero-write
  failure, and lookup-before-retry;
- absence of source-ranking language in application doctrine;
- conformance, tests, typecheck, lint, production build, and doctor.

## Release framing

The release describes institution-independent verification, not exemption from
law or a claim of institutional sovereignty. Its highest-order significance is
that truth can be checked from the object itself across organizational and
platform boundaries. Institutions may recognize, regulate, store, or project
that truth; their representations do not silently replace the source.

