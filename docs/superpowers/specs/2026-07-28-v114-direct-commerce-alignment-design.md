# Receiz Commerce Kit 5.0.0 Direct v114 Commerce Alignment

Date: July 28, 2026

## Outcome

Release Receiz Commerce Kit 5.0.0 on the exact public Receiz 114.0.0 SDK,
MCP-server, and AI-skills packages. Integrate all five v114 application
operations into real commerce behavior without treating editable application
state, an SDK plan, a projection, or a coordination response as proof authority.

The five required operations are:

1. `profile-showcase.genesis.plan`
2. `profile-showcase.append.plan`
3. `economy-showcase.genesis.plan`
4. `economy-showcase.append.plan`
5. `economy-showcase.merge.plan`

The implementation bypasses the defective v114 `receiz app upgrade/apply`
writer. It uses the public SDK's exported registry, operation matrix, planning,
admission, carried-history, bounded-state, sealing, and commit functions
directly. The release audit records the CLI defect and the independently
verified direct migration.

## Authority Model

`CommerceState` remains editable application state and a rebuildable UI
projection. It is never promoted to proof authority.

Published store records remain the authority for the currently published
storefront and catalog projection. Drafts, carts, transient forms, browser
preferences, and incomplete checkout attempts do not enter canonical showcase
history.

Every item eligible for public profile presentation must first be a complete
locally verified and admitted sealed Receiz artifact. Eligible children include
published product records, settled order or receipt artifacts, verified
ownership/listing artifacts, refund or payout artifacts when those rails return
complete sealed artifacts, public media proofs, and release attestations.

Each merchant owns exactly one literal profile resource:

```text
profile-showcase:<ownerReceizIdentity>
```

The profile showcase provides the merchant's proof-backed commerce portfolio.
It may append admitted children, set visibility, pin or unpin, reorder, assign
sections, bind provenance, and preserve or explicitly reconcile verified
siblings. The enclosing sealed profile artifact remains stronger truth than its
bounded state, first-paint window, membership witnesses, or UI projection.

The economy resource is the SDK-defined singleton:

```text
economy-showcase:receiz.com
```

It composes admitted profile-showcase references. It does not directly encode
checkout events, prices, balances, or CMS fields. A changed merchant portfolio
first produces a newly admitted profile-showcase head; that verified profile
head can then be appended to the economy showcase.

## Components

### Application contract and constitution

`receiz.app.json` is regenerated from the public
`RECEIZ_CURRENT_APPLICATION_OPERATION_MATRIX` export while preserving the
application name, framework, features, authority mode, and deployment target.
The checked-in value must contain the exact 16-row v114 matrix and
`>=114.0.0 <115.0.0` compatibility range.

`receiz.constitution.json` remains an application overlay. It advances to
version 114.0.0, chains to canonical v114 registry digest
`ae912154d97b695464c3a19361bceb9440bc5d703a1d9129edac92c64192e29a`,
preserves existing application laws, and updates only the current-release law.
Historical registries and migration evidence remain unchanged.

Runtime constitution code imports v114 identity and protocol constants. It
validates the overlay, verifies its chain to canonical v114, and uses the
overlay digest for application causal history.

### Direct showcase authority service

A focused server-side module owns direct SDK orchestration. It exposes explicit
profile genesis, profile append, economy genesis, economy append, and economy
merge operations. The module accepts only verified actor, admission, history,
capability, sealer, transition-store, and commit-domain dependencies.

It does not accept arbitrary booleans such as `verified: true`. It does not
construct SDK-branded authority objects. SDK-returned runtime custody must flow
from verification through planning, capability verification, sealing,
admission, staging, and commit in one controlled operation.

The service also exposes read-only projection helpers for bounded first paint,
membership counts, visible children, carried proof-history identity, and
conflict state.

### Child-artifact mapping

Existing commerce rails continue producing their domain result first. Only a
complete sealed artifact that verifies and admits successfully may become a
profile child reference.

Child identity is stable and literal:

- published storefront revisions use their existing store-record identity;
- products use the admitted product artifact identity;
- settled orders and receipts use their exact order or receipt artifact
  identity;
- ownership, listing, refund, payout, and release evidence use the identity
  carried by their enclosing admitted artifact.

The showcase service derives child digest, immutable version, admission
evidence root, content digest, authority evidence, operation digest, and Kai
ordering from verified SDK custody and canonical event input. Callers cannot
override derived evidence.

### Persistence and coordination

The local proof-state store retains exact sealed artifacts and verified
admission material needed for offline reconstruction. Persistent profile nodes,
segments, checkpoint witnesses, and carried-history heads are stored beneath
the sealed artifact authority boundary.

Profile transitions use the artifact-local commit domain. Economy transitions
use the SDK global-shared domain. A staging locator, local receipt, accepted
coordination status, or delivered effect is never substituted for the newly
verified sealed head.

Idempotency binds actor, operation, resource, expected head, canonical event,
and domain. Repeated identical commands return the admitted existing result.

## End-to-End Data Flow

### Profile genesis

1. Resolve a verified merchant actor from admitted identity evidence.
2. Require the literal profile resource and an unaccepted-head expectation.
3. Ask the SDK to plan genesis against the exact v114 registry and operation
   matrix.
4. Derive and verify the capability context from the SDK plan.
5. Seal through the configured native Record-to-Seal boundary.
6. Locally verify and admit the complete artifact.
7. Preserve the SDK-carried proof-history head.
8. Stage and commit only against the expected empty head.

### Profile append

1. Complete the underlying commerce operation.
2. Verify and admit its complete sealed artifact.
3. Resolve the exact admitted profile predecessor and verified history.
4. Build the canonical showcase operation from the admitted child.
5. Plan, capability-authorize, seal, re-admit, stage, and commit atomically.
6. Rebuild the visible portfolio projection from the admitted successor.

Visibility, pinning, ordering, section assignment, provenance binding, and
profile sibling reconciliation use the same append pipeline with the SDK's
canonical operation grammar.

### Economy genesis and append

Economy genesis produces the empty admitted global economy head. Economy append
requires both the current economy admission and a newly admitted
profile-showcase head. The SDK derives the only valid
`economy.profile-showcase.append` operation and the resulting bounded economy
state.

### Economy sibling merge

When two verified economy successors share an exact verified predecessor,
neither wins by timestamp or arrival order. The service supplies the common
predecessor, both parent admissions, both carried-history heads, verified actor,
expected global head, and idempotency identity to the SDK merge planner. The
sealed merge result must reverify before commitment. Structural divergence that
cannot satisfy those requirements remains explicit and unresolved.

### Offline and first paint

Known admitted profile content renders from its bounded first-paint window
without waiting for remote coordination. Exact artifacts, persistent nodes,
membership witnesses, checkpoint segments, and carried history are then
reverified locally. Remote additions render only after independent verification
and admission.

## Failure Handling

The service fails closed on:

- missing or mismatched verified actor evidence;
- nonliteral profile or economy identity;
- raw payload, projection, card-only object, token, database row, or MCP result
  offered as proof authority;
- absent exact predecessor admission or carried history;
- registry or 16-row operation-matrix skew;
- malformed or excessive direct operations, parents, segments, or witnesses;
- stale expected head, unverified sibling, or ambiguous merge ancestry;
- missing exact capability verification;
- Record, Seal, verification, admission, staging, or commit failure;
- local success incorrectly presented as global acceptance;
- accepted head incorrectly presented as delivered external effects.

Failures before commit leave canonical state unchanged. Indeterminate attempts
remain inspectable and require explicit resolution. Unknown namespaces and
historical evidence are never deleted or rewritten.

## Compatibility

The v113 release registry, audit, vendor archives, and historical artifact
evidence remain immutable. V112 artifact laws remain supported through the
v114 SDK's declared compatibility boundary. Existing public-store and checkout
clients continue working; v114 showcase adoption adds proof-backed composition
without changing cart or draft semantics.

## Testing and Qualification

Tests must demonstrate behavior, not only constants:

- fail-first app-contract and constitution migration assertions;
- all five v114 operations through real SDK planners;
- literal identity, actor, registry, matrix, capability, and predecessor denial;
- exact-byte sealing, verification, admission, staging, and commit custody;
- profile append plus visibility, pin, order, section, and provenance behavior;
- bounded state, persistent nodes, first-paint window, segment checkpoint, and
  carried-history round trips;
- idempotent replay and stale-head rejection;
- verified economy append and two-parent deterministic merge;
- structural divergence preservation;
- offline reconstruction with zero network calls;
- compatibility verification for historical v113 artifacts;
- checkout and publication integration proving that only admitted complete
  artifacts enter a profile;
- browser smoke coverage for a merchant portfolio and economy projection;
- full typecheck, lint, automated tests, production build, conformance, secret
  scan, release check, and v114 release lock.

The final app release is 5.0.0. Release notes highlight the public v114 package
graph, proof-backed merchant portfolios, globally composable profile economy,
bounded first paint, carried history, deterministic merge, offline
verification, fail-closed authority, historical compatibility, and independent
release qualification. Deployment and production data migration remain
explicitly excluded unless separately authorized.

