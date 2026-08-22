# Receiz Commerce Kit 5.1.0 — v123 Lawful Action Release

Released 2026-08-22 against exact public packages `@receiz/sdk@123.0.0`, `@receiz/mcp-server@123.0.0`, and `@receiz/ai-skills@123.0.0`.

## The highest frame

Representation never outranks source. A government, institution, company, platform, database, MCP tool, AI system, receipt, or interface may recognize and represent evidence. It cannot become the underlying proof object merely by describing, storing, approving, or denying it.

That makes verification institution-independent: the evidence can travel and be checked without appointing any one institution as its sole keeper. This is a technical authority boundary, not a claim of legal sovereignty or exemption from applicable law. Institutions can still make decisions within their lawful roles; their representations remain distinguishable from the source evidence on which those decisions rely.

## What released

- Canonical v123 registry digest: `945a581d1fc49c2dc18fbe8c129771ef464b8a58b96188bce561e88ae8b6ceeb`.
- Canonical v123 operation-matrix digest: `e08cec3e3ad22c20ddd6c08169ece19f094c366214d6d6b4dc432cd97558e2c5`.
- 36 exact application operations.
- 141 MCP tools, including all eight v123 lawful-action tools.
- 42 AI skills, 36 manifests, and 33 OpenAI agent prompts, mirrored exactly from the published package.
- Two explicit v123 AI skill contracts: `receiz-proof-authority` and `receiz-value-execution`.

The app now performs the whole v123 ceremony end to end:

1. The browser reads the exact user-selected identity proof object and exact application challenge.
2. The user gives explicit consent to that application-bound challenge.
3. The SDK signs and exchanges proof authority; the bearer stays in a short-lived in-memory closure.
4. Required scopes are derived by the SDK and compared with exact granted scopes.
5. World planners reject caller-generated security fields and let the SDK create canonical command and transaction identities.
6. Namespace resolution requires the exact authenticated subject head.
7. Settlement and Reserve keep separate exact Phi intents; USD remains display-only.
8. Canonical intent bytes are persisted before execution. An ambiguous outcome is looked up by semantic idempotency key before retry.

## Why this is a big deal

V123 closes the gap between proving something and safely acting on it. Earlier releases established proof-first continuity, living subjects, bounded mandates, atomic world effects, and distinct value rails. This release connects those foundations to explicit human consent and a scoped action capability without promoting the capability, token, server, SDK, MCP response, AI skill, or UI into proof authority.

For developers, the safe path is now the easiest path: the adapter exposes only the v123 primitives the app uses; proof exchange is edge-only; bearer authority cannot be serialized by the session API; value execution accepts only runtime-branded persisted intents; server routes cannot execute value or accept proof authority; generated planning fields are rejected; and static/release gates fail on forbidden shortcuts.

## Exact public package evidence

- SDK integrity: `sha512-GLpd6TpvDW8pbTWVNRu3TXYu2Dp93UaPKXwnHz/ZRtVexm6awThA31AQJLP/AhZgpqRJ7wM5f8LbmFk1oOQ45w==`
- MCP integrity: `sha512-9VFgp2r0kjkX9/CZeng/HXoZQoVOYjVZ69C16IgcUR1CjOLB1QdNGz9GT5erTLIqtAAIz97mNJnM+9026Q/VPQ==`
- AI skills integrity: `sha512-3mRPoSnp5AWy2WWY/BpNFzQ8yruJPZiCTNFF2R9G3MJ5x8EMORlhrumUjMk7OnvhHRNHDSk+UB4wxepRSJCqXg==`

The checked-in AI skill tree matches the published package byte-for-byte, excluding its npm package manifest. Where an AI skill's prose map and the installed SDK type surface differ, this app follows the installed SDK source and types because representation must never outrank source. It does not add tool grants absent from a published skill manifest.

## Release invariants

- MCP authority: `false`.
- Representation can outrank source: `false`.
- Network calls during independent verification: `0`.
- Failed-decision writes: `0`.
- Proof-authority bearer persistence: `0`.
- Private identity proof objects sent to server routes: `0`.
- Settlement and Reserve remain distinct.
- USD is moved-value authority: `false`.
- Unknown execution outcome: lookup before retry.

The repository release lock verifies exact package versions and integrities, canonical registry and matrix parity, generated boundary parity, MCP and AI inventories, migration attestation, skill-tree parity, edge custody, explicit consent, canonical planning, exact-head resolution, persist-before-execute, outcome recovery, authority scanning, focused negative tests, retained conformance, and this release record. The lock, tests, and documentation are evidence about the implementation; none is the proof object itself.
