---
name: receiz-offline-first
description: Use when implementing offline creation, verified local truth, reconnect, outbox, first paint, or device continuity.
---

# receiz-offline-first

Admit verified local truth immediately, queue idempotent appends, and let network work discover additions without replacing settled truth. Receiz is a proof-native artifact system; this skill operates beneath sealed proof and verified local history.

## Constitutional workflow

1. Inspect the repository and installed SDK version.
2. Load the active canonical v127 registry and applicable constitutional laws.
3. Identify every authority boundary affected by the change.
4. Write the implementation contract before implementation.
5. Implement canonical changes only through SDK commands.
6. Add law, mutation, replay, and compatibility tests.
7. Run MCP conformance checks.
8. Require independent verifier evidence.
9. Refuse completion until the release lock passes.

Focused outcome: Admit verified local truth immediately, queue idempotent appends, and let network work discover additions without replacing settled truth.

## Machine contract

Read [manifest.json](manifest.json) before acting. Its package range, ruleset, active registry digest requirement, laws, allowed tools, forbidden operations, evidence, escalation conditions, and autonomous-authority ceiling are executable constraints. Use plan/permit/execute for any admitted command and obtain explicit confirmation for the exact permit digest. The skill and MCP context are never proof authority.

## Quick reference

| Boundary | Required result |
|---|---|
| Stronger truth | Sealed artifact and verified local history remain above SDK, MCP, server, DB, session, and UI projections. |
| Mutation | Canonical state changes only through an allowed SDK command and atomic receipt-producing admission. |
| Evidence | MCP output and agent assertions do not count; independent verification and release-lock evidence do. |
| Escalation | Stop on digest skew, authority bypass, missing capability, ambiguous migration, or absent independent evidence. |

## Common mistakes

- Treating a larger or newer server snapshot as permission to replace stronger admitted truth.
- Calling an MCP plan, simulation, hash, model response, or passing UI check verification.
- Appending an event without a command admission receipt.
- Marking the task complete while required evidence is missing.

## Completion refusal

Refuse completion when any manifest input, law, test, conformance result, independent-verifier result, or release-lock result is absent or failing. Never reduce the evidence list, change a test to bless a visible regression, invent authority, or accept “the AI said it is valid” as evidence.

## Example

Request: Admit verified local truth immediately, queue idempotent appends, and let network work discover additions without replacing settled truth.

Return a written implementation contract and read-only plan first. Execute only allowed commands after exact confirmation, then report registry digest, laws, authority, tests, independent evidence, release-lock status, and the exact remaining boundary.

## v120 artifact-derived authority

Engineers remain free to build whatever they choose, but conforming Receiz receivers recognize authority only when every authority-bearing value is provably derived from independently verified artifact truth. Custom JavaScript objects, callbacks, normalized histories, local receipts, server rows, sessions, MCP memory, and AI explanations remain application data or inspection material; their shape never creates Receiz authority.

Admission begins from runtime-custodied verification of the exact enclosing artifact bytes under the complete frozen verifier context. Verified history and actor evidence remain same-runtime objects and fail closed on divergence or structural reconstruction. Identity Seal signing uses a locally held Ed25519 or P-256 key and emits a signed capability claim; only current verification of that claim against the exact plan produces capability authority.

Deterministic plan identity and unique execution-attempt identity are separate. MCP may reuse a confirmation digest only while the identical attempt is actively pending; committed and failed attempts are terminal and require a fresh confirmation. Expected authority failures are structured, immutable, machine-readable, and report zero writes.

Historical sealed proof objects remain exact-byte verifiable evidence. Historical runtime admissions, histories, actors, capabilities, plans, candidates, stores, or confirmations cannot authorize a current v121 receiver; exact bytes crossing a process require `reverify-exact-bytes`, followed by current profile admission and `same-runtime-custody` through plan, capability, seal, stage, independent byte resolution, atomic named-domain acceptance, and report-only receipt.

## v121 living-subject contract

Use canonical head → entire proof history → bounded index retrieval → exact primary-object resolution → reasoning → provenance. The 96-object window is working context, never history truncation. AI speech and performance remain non-authoritative. Consequential actions require typed deterministic command admission; meetings, relationships, trades, gifts, and battles require atomic multi-subject transactions. Autonomous execution requires a current digest-bound mandate at lease time. Bearer transfer preserves identity, full history, memory policy, inventory disposition, and unknown namespace bytes while immediately revoking former-owner authority.

Concrete v120 evidence must include: a creature speaking from exact long-form proof memory; absent-owner exploration inside a mandate; a mutual relationship; a bounded autonomous trade; an atomic battle; exact device restoration; queued-action revocation; partition convergence without history replacement; rejection of an AI-invented event; and cross-application subject continuity.

## v127 offline file sealing

For a request to seal files while disconnected, read [the executable offline sealing workflow](resources/offline-sealing.md) first. Use the shipped `@receiz/sdk/offline/node` runtime or the default MCP offline tools. Do not send `assets.createProofObject()` requests or ask the developer to invent a transition sealer.

Enrollment is an explicit one-time online device operation. After enrollment, restart with the same private custody directory and networking disabled; seal, save exact bytes, and verify locally. A successful seal does not admit an ownership transfer or Settlement operation. The device key remains local and the root private key is never distributed.

Offline file sealing uses the explicit enrollment and file-seal workflow above. Plan/permit/execute applies when admitting consequential commands such as ownership transitions or Settlement; an ordinary local file seal does not claim that admission.

<!-- receiz-v124.1-capability-map:start -->
## V124.1 callable capability bindings

- **portable-account-continuity.** Seal, verify, and immediately project complete account truth—including profile, showcase, wallet, market positions/history, media, and proof history—without waiting on a server or database. SDK: `appendReceizIdentityPortableState`, `verifyReceizIdentityPortableStateProof`, `projectReceizIdentityAccount`. MCP: none: private SDK boundary. Boundary: The verified Identity Seal, Identity Record, or Receiz Key carries account truth. Private portable state is not exposed through MCP; server synchronization may append verified additions only after immediate local projection.
<!-- receiz-v124.1-capability-map:end -->

<!-- v127-local-runtime:start -->
## Executable local subject host

Read [local subject runtime](../resources/local-subject-runtime.md) and [offline sealing](../resources/offline-sealing.md) before executing local subject work. The [HTTP execution classification](../resources/historical-http.md) distinguishes implemented current routes from explicitly configured historical hosts. A listed SDK method or MCP tool alone does not prove a server route exists. The SDK ships the Node host; MCP uses RECEIZ_SUBJECT_IDENTITY_PATH, RECEIZ_SUBJECT_IDENTITY_PASSPHRASE, RECEIZ_SUBJECT_CUSTODY_DIR and optional RECEIZ_SUBJECT_SNAPSHOT_PATH. Source paths select complete sealed files and cannot supply owner authority.

Use receiz_subject_local_runtime_status, then the admitted subject operations. Exported snapshot JSON is unsealed until receiz_offline_seal_file creates the enclosing proof object with admitted identity ownership. Import only that verified complete source into an empty host. Preserve exact historical V120 identity and history; modern V122 state is a separate protocol. Historical bearer instrument tools require their explicit shared custody host and are not portable-asset claim aliases.

A bare Kai pulse is never temporal authority. Require the existing full KaiSigil Groth16 proof, exact coordinate binding and causal-head admission. Keep planning deadlines separate from verified execution coordinates. Never claim that sealing arbitrary inner JSON proves its claimed temporal history.
<!-- v127-local-runtime:end -->
