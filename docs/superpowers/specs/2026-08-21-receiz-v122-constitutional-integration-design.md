# Receiz v122 Constitutional Integration Design

**Status:** Approved for implementation planning  
**Date:** 2026-08-21  
**Repository:** `Receiz-app-template`  
**Target packages:** `@receiz/sdk@122.0.0`, `@receiz/mcp-server@122.0.0`, `@receiz/ai-skills@122.0.0`

## Objective

Upgrade the application from Receiz v121 to v122 and apply the current SDK, MCP, and AI-skill contracts end to end. The result must be a production Receiz application and an executable reference for other engineers. It must teach and mechanically enforce the central law that representation never outranks source.

This is not a generic application architecture with Receiz attached. Receiz v122 is the constitutional core. Application code, MCP, AI, server state, databases, sessions, receipts, indexes, caches, and UI are subordinate implementation or representation layers.

## Binding package identity

- SDK: `122.0.0`, integrity `sha512-z29p3Q67L++p+gSClu+cz4m6Knf7e/Cl3vXzCE8LwK0/vm8Lx7hPWi1J7ZG2h7C43RetXzGYGjkkRC1tx/L+zQ==`
- MCP: `122.0.0`, integrity `sha512-WwnrAJmL9eg6tzBDs7ZluIABt0IPeaLkDVsPT2SvMUvQIcMfkPFlX4T87fkqwDerXNnrW1VwVUMPHXoVW2DC5g==`
- AI skills: `122.0.0`, integrity `sha512-5s1exUwz8WLEu0nTS0wQ0d4iwoHgr4hs/QKreBldrEbpI7Ff1foZi977hNa/SQK7qcXXcts3ORaZoNQ1y0xI8Q==`
- Canonical registry digest: `ed65956a16dd5f0d76d04db2f4a651fc43eb0a71cef64afd53576aa782dc9896`
- Application-operation-matrix digest: `bd1d7ccf1543e2484df68e3025c7376f8ae37cafe1ca0d7c9cd9f52f6342b325`
- Compatible current package range: `>=122.0.0 <123.0.0`

All five identities must agree at build and release time. Historical artifacts remain exact-byte verifiable, but historical runtime admissions, actors, capabilities, plans, candidates, receipts, or confirmations cannot authorize a v122 receiver.

## Receiz skill route

The primary route is `receiz-build-production-system`, with the required architecture, domain, constitutional-law, command, authority-security, replay, offline-first, causal-sync, portable-artifact, migration, performance, observability, testing, and release skills. Product boundaries additionally use proof, MCP agent, app builder, commerce, offline verifier, global reconciliation, living subject, subject Twin, autonomous mandate, world runtime, multi-subject transaction, event-derived memory, bearer ownership, proof media, and value-rail contracts.

The route is proof first, offline verification before network comparison, MCP confirmation before writes, builder work only after primitive boundaries are known, and public language only after the domain law is fixed.

## Constitutional authority hierarchy

The application must preserve this dependency direction:

```text
sealed proof object + independently verified admitted history
                         |
                         v
                canonical v122 SDK primitive
                         |
                         v
              MCP coordination / AI reasoning
                         |
                         v
       server / DB / session / index / receipt / cache
                         |
                         v
                   UI representation
```

The lower layers may locate, coordinate, project, explain, or accelerate. They may not replace, synthesize, or authorize the stronger layer above them.

### Non-negotiable laws

1. Exact native Record -> Seal bytes are the artifact. Inner payload bytes are never an artifact substitute.
2. Verification precedes extraction. Domain parsers receive only verified payload bytes after enclosing-artifact verification.
3. Authority-bearing values derive from independently verified exact artifact truth and current same-runtime custody.
4. Canonical state changes only through typed SDK command or atomic transaction admission.
5. A plan, MCP response, model statement, confirmation, database row, receipt, or matching object shape is never authority.
6. Expected rejection, divergence, stale head, invalid scope, and conflict outcomes write zero canonical state.
7. Durable local truth paints first. Remote reconciliation cannot replace stronger admitted truth or block deterministic first paint.
8. Unknown namespaces and immutable identity, ownership, provenance, and history remain byte-preserved.
9. AI may retrieve, reason, speak, and propose intent. AI output is never a world event, fact, mandate, transfer, settlement, or release verdict.
10. Settlement and Reserve remain distinct proof-native Phi rails. USD is a pinned deterministic display projection only.

## Authority-bearing transition pipeline

Artifact mutation follows this exact custody chain:

```text
exact artifact bytes
-> same-runtime verification
-> profile admission
-> verified actor and complete history
-> exact deterministic plan
-> plan-bound verified capability
-> sealed candidate proof object
-> durable neutral stage
-> independent staged-byte resolution and reverification
-> atomic named-domain acceptance
-> report-only receipt
```

Intermediate authority objects must remain opaque, non-serializable, and runtime-custodied. They are not accepted from route JSON, UI state, MCP output, persisted receipts, or caller-constructed property bags. Exact bytes crossing a process boundary must be independently reverified under the current v122 verifier context.

Deterministic plan identity and execution-attempt identity are separate. A committed or failed attempt is terminal. A retry uses outcome resolution first and cannot reuse a terminal confirmation as new authority.

## End-to-end primitive surfaces

### Proof object, admission, transition, and reconciliation

The existing verify, offline, product-proof, card, store-publication, and ownership flows will use the nine canonical artifact MCP operations and their SDK counterparts:

- verify exact artifact bytes;
- admit a same-runtime verified artifact into an explicit profile;
- plan a governed append with zero writes;
- seal and durably stage a candidate with zero accepted-head writes;
- independently resolve, reverify, and atomically accept the named-domain head;
- resolve authenticated global heads as locators only;
- plan, stage, and commit offline reconciliation without last-write-wins behavior.

The application must never expose payload fallback, repack native artifact bytes, or let a receipt re-enter an authority-bearing API.

### Living subjects and edge continuity

The account, vault, and Wilds surfaces will expose v122 subject admission, authenticated state, edge-bundle export/import, public access binding, local access-key creation, and public access-key publication.

The enclosing proof object remains authority. Subject IDs derive from the admitted proof digest. Production admission is remote and durable, while database state remains coordination and recovery. The exact edge bundle carries proof, owner evidence, heads, append chain, registry/reducers, mandates, and value-proof references. The encrypted private access kit stays in edge custody and is never sent to the server.

On timeout, the application repeats the exact proof bytes and semantic idempotency key. Conflicts return a structured `writes: 0` result. Restore verifies the edge bundle before using a weaker remote snapshot.

### Twin, proof brain, and memory

Twin responses follow canonical head -> complete segmented proof history -> compact index search -> exact primary-object resolution -> cited reasoning. The 96-object bound is only a reasoning window and never truncates canonical history.

Factual memory cites admitted event IDs and exact proof-object coordinates. Memory indexes, embeddings, summaries, speech, performance cues, and model output remain rebuildable non-authoritative projections. A model-proposed consequential action must enter the typed command pipeline before it can affect a world.

### Mandates and autonomous execution

Mandates bind owner and worker proof objects, exact subject heads, permitted command kinds, world and region, Phi and geometry limits, provider constraints, expiry, nonce, and revocation head into one exact digest. Owner confirmation applies to that digest only.

Every leased execution reverifies the current mandate, heads, scope, limits, expiry, owner, and revocation. Revocation is an append, cancels queued work, and causes future attempts to write zero events. A mandate supplements verified owner authority and never replaces the owner proof object.

### Private worlds and exact execution recovery

Private and invited world commands are planned and encrypted at the edge. Production receives only the minimal public exterior, ciphertext, nonce, AAD digest, envelope digest, and recipient wraps. Private plaintext, exact private geometry, invitation proof, identities, and metadata never enter a globally distributed event.

Exact planned transaction bytes are persisted before validation and execution. Outcomes are exactly `committed`, `zero-write`, or `unknown`. After timeout or crash, execution is resolved by transaction identity or semantic idempotency key before any retry or replan. Authorized viewers decrypt additions only at the edge. Revocation stops future envelope delivery without rewriting creation history.

### Multi-subject and multi-world atomicity

Relationships, meetings, gifts, trades, battles, and multi-world actions validate the exact participant set, every participant and world head, exact command bytes, plan digests, authority or mandate, causal parents, registry, and reducer pins.

All participants and member worlds advance atomically or all writes remain zero. Multi-world locks use canonical world-ID order. If atomic execution is unavailable, the action is rejected rather than represented as multiple successful commits.

### Settlement and Reserve value rails

The app selects exactly one explicit rail: `planSettlement` or `planReserve`. Movement is expressed only as `amountPhiMicro` and binds the source proof object/head, destination subject/head, semantic idempotency key, and canonical price basis.

`usdPerPhiMicrocents`, `quotedUsdCents`, and `priceBasisDigest` are pinned into the accepted receipt for reproducible historical display, but USD never becomes moved authority. The value intent and world transaction commit atomically; no database balance or UI display may update independently as proof of movement.

## MCP role and parity

MCP is the agent-callable interface over the same SDK primitives. It is not a separate SDK, mutation language, verifier, or control plane. Every response preserves the source primitive, registry/reducer identity where applicable, explicit uncertainty, and `mcpAuthority: false`.

The application will document and test parity for:

- nine canonical artifact coordination tools;
- 37 inherited living-subject, Twin, mandate, runtime, world, replay, proof-brain, and bearer tools;
- 19 v122 tools for remote subject admission and edge continuity, private and recoverable world execution, mandates, multi-world execution, and Settlement/Reserve planning;
- compiler, inspection, conformance, release qualification, capability, scope, public read, and delegated-write tools that are applicable to this repository.

Read-only resolution is not verification. Every delegated write requires scoped runtime authority and explicit confirmation of the exact tool, input, primitive, action class, and value/ownership/public-state effect. Delegated tokens permit scoped calls but never become proof authority.

## Application architecture and mechanical enforcement

### SDK boundary

A constitutional Receiz boundary is the only application module allowed to construct the SDK client or import authority-bearing mutation primitives. Feature code receives narrow primitive-specific functions, never the raw client or serializable authority objects.

The boundary is organized by Receiz primitive rather than generic application service:

- artifact verification, admission, transition, and reconciliation;
- subject admission, access, and edge continuity;
- proof brain, Twin, and event-derived memory;
- mandate issue/state/revoke;
- world private planning, validation, execution, outcome resolution, and additions;
- multi-subject and multi-world atomic transactions;
- Settlement and Reserve value intent;
- public proof, app-state, public-store, wallet, commerce, identity, hosting, and webhook projections.

### Type and runtime custody

Source bytes, verified custody, admission, actor evidence, history, plan, capability, staged candidate, accepted head, projection, and receipt are distinct types. Authority-bearing types remain module-private and cannot be reconstructed from JSON. Runtime validators independently verify all process-crossing bytes and exact heads.

Mutation routes accept only the minimum non-authoritative caller inputs. The server resolves and reverifies authority inside the same execution boundary. A caller cannot provide an owner, receipt, head, capability, verification result, or MCP response and have its shape accepted as authority.

### Storage separation

- Edge custody stores exact private access kits and verified portable bundles in a dedicated encrypted store.
- The browser admission ledger stores identifiers and recovery metadata, never proof bytes.
- Server and database repositories store explicitly named projections, indexes, delivery state, and recovery locators.
- Projection repositories expose no method that returns an authority-bearing SDK type.
- Report-only receipts are terminal evidence and cannot be passed into planners or committers.

### Static restrictions

Build-time rules fail on:

- direct SDK client construction outside the constitutional boundary;
- direct database writes presented as canonical state changes;
- payload fallback after artifact creation or verification failure;
- passing complete artifact bytes into a payload parser;
- repacking or relabeling Record -> Seal bytes;
- receipt, confirmation, MCP response, projection, token, session, or structural object used as authority;
- `amountUsdCents` used as moved value authority;
- implicit or interchangeable Settlement/Reserve rails;
- private world plaintext crossing the server transport;
- latest-snapshot-wins, timestamp-head authority, silent divergence resolution, history replacement, or unknown-namespace loss;
- unknown transaction outcome treated as failure or success without lookup;
- AI output appended as an event without typed deterministic admission.

### API and UI representation contract

Every developer-facing operation reports:

- primitive;
- strongest source;
- SDK operation;
- MCP equivalent when one exists;
- action class: read, preview, plan, stage, commit, or projection;
- proof status and projection status separately;
- what is proven;
- what is not proven;
- confirmation status;
- stable denial code and `writes: 0` where applicable;
- exact next safe action.

UI wording uses canonical Receiz language. It does not downgrade proof objects to cards, offline verification to fallback mode, durable local truth to cache, public proof to a share page, ownership to dashboard state, Settlement to a balance display, Receiz ID to a login method, or deterministic first paint to a loading state.

## Developer doctrine and executable reference

A public developer doctrine surface will explain the authority hierarchy and map every maintained v122 outcome to source proof, SDK call, MCP tool, AI-skill rule, safe product surface, prohibited shortcut, and passing evidence. It will include runnable or tested examples for verification, admission, transition, reconciliation, subject continuity, edge restore, Twin memory, mandates, private worlds, exact outcome recovery, multi-world atomicity, and both Phi rails.

A role-gated operations surface will expose plans, confirmations, stages, outcomes, conformance, and release evidence without claiming that the interface itself authorizes or proves them.

The release documentation will explain why v122 matters at the highest accurate frame: exact proof can remain portable and independently verifiable across applications, devices, organizations, markets, and institutional boundaries without allowing any representation or coordinator to replace the source. This is a technical authority claim, not a legal or governmental supremacy claim.

## Failure and recovery model

- Invalid exact bytes, incompatible registry/reducer, stale head, missing authority, mandate failure, participant mismatch, rail mismatch, and digest mismatch return stable structured failures with zero writes.
- Divergence preserves both histories and requires explicit reconciliation; it never applies last-write-wins.
- A remote head is an authenticated locator until its exact bytes are independently verified.
- A staged reference is not commitment. Commit independently resolves and reverifies staged bytes.
- `unknown` execution state triggers outcome lookup before retry.
- Accepted canonical state does not imply external effects were delivered. Effect status is resolved separately.
- An indeterminate effect is not represented as failed.
- Offline verified local truth renders immediately; background reconciliation may add verified history but cannot erase or replace it.

## Verification and release refusal

Completion requires all of the following:

1. Exact dependency and lockfile integrity parity for SDK, MCP, and AI skills.
2. Registry and operation-matrix digest equality across package, app contract, local AI-skill source, conformance output, and release lock.
3. AI-skill byte alignment and manifest validation.
4. Typecheck, lint, unit, law, mutation, negative, replay, compatibility, browser, and build checks.
5. Exact MCP tool inventory and SDK primitive parity.
6. Independent exact-byte artifact verification with zero network calls.
7. Native Record -> Seal digest and payload-binding round trip.
8. Same-runtime custody enforcement and process-boundary reverification.
9. Cross-application subject, identity, ownership, history, namespace, and edge-bundle continuity.
10. Deterministic first paint and offline recovery evidence.
11. Structured zero-write evidence for every negative path.
12. Private-world plaintext exclusion and edge-key custody evidence.
13. Exact execution recovery and lookup-before-retry evidence.
14. Multi-subject and multi-world atomicity evidence.
15. Settlement/Reserve separation, Phi-only movement, pinned USD projection, and atomic value/world evidence.
16. Documentation and developer-doctrine parity with tested code.
17. Conformance, independent verifier, release qualification, and final v122 release lock passing.

The current published v122 package inspection reveals prose and a capability descriptor that still contain v120/v121 labels or the older `>=121.0.0 <122.0.0` compatibility range. The implementation must not silently rewrite or ignore that evidence. The installed runtime exports, manifests, registry, matrix, CLI, MCP inventory, and conformance results will be audited. Any operative mismatch is release-blocking and must be reported as an upstream package defect; stale non-operative prose is documented precisely and never promoted to authority.

## Success criteria

The work is complete only when:

- all maintained v122 primitives applicable to the commerce, identity, proof, offline, Wilds, subject, world, mandate, memory, ownership, and value domains have a lawful end-to-end path;
- every current v122 MCP operation has an exact SDK mapping, product or operator surface, and parity test;
- the AI-skill contracts determine implementation, language, testing, and release behavior;
- representation cannot enter an authority-bearing API or replace verified source truth;
- a developer who follows the supported modules, routes, examples, and UI cannot bypass Receiz law without changing or disabling the constitutional enforcement itself;
- the final release evidence passes without weakened tests, invented authority, hidden uncertainty, or unreported package skew.

