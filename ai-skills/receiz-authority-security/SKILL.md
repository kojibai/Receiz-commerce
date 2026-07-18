---
name: receiz-authority-security
description: Use when work touches capabilities, identity, PBI, tenancy, ownership, settlement, secrets, delegated access, or authority escalation.
---

# receiz-authority-security

Audit actors, tenants, capabilities, proof domains, confused-deputy paths, escalation, and cross-boundary effects. Receiz is a proof-native artifact system; this skill operates beneath sealed proof and verified local history.

## Constitutional workflow

1. Inspect the repository and installed SDK version.
2. Load the active signed registry and applicable constitutional laws.
3. Identify every authority boundary affected by the change.
4. Write the implementation contract before implementation.
5. Implement canonical changes only through SDK commands.
6. Add law, mutation, replay, and compatibility tests.
7. Run MCP conformance checks.
8. Require independent verifier evidence.
9. Refuse completion until the release lock passes.

Focused outcome: Audit actors, tenants, capabilities, proof domains, confused-deputy paths, escalation, and cross-boundary effects.

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

Request: Audit actors, tenants, capabilities, proof domains, confused-deputy paths, escalation, and cross-boundary effects.

Return a written implementation contract and read-only plan first. Execute only allowed commands after exact confirmation, then report registry digest, laws, authority, tests, independent evidence, release-lock status, and the exact remaining boundary.

## v111 artifact-derived authority

Engineers remain free to build whatever they choose, but conforming Receiz receivers recognize authority only when every authority-bearing value is provably derived from independently verified artifact truth. Custom JavaScript objects, callbacks, normalized histories, local receipts, server rows, sessions, MCP memory, and AI explanations remain application data or inspection material; their shape never creates Receiz authority.

Admission must retain and canonically reverify the exact enclosing artifact bytes under the complete frozen verifier context. Recovery-authoritative history requires explicit independently verified evidence roots and fails closed on divergent verified heads. Canonical identity and `canSign` require enclosing-owner binding, identity-owner binding, key identity, and a domain-separated private-key challenge. Recovery planning re-derives state from verified admission and verified history.

Deterministic plan identity and unique execution-attempt identity are separate. MCP may reuse a confirmation digest only while the identical attempt is actively pending; committed and failed attempts are terminal and require a fresh confirmation. Expected authority failures are structured, immutable, machine-readable, and report zero writes.

Historical sealed proof objects remain exact-byte verifiable evidence. Historical runtime admissions, histories, capabilities, plans, or confirmations cannot authorize a current v111 receiver; re-admit the historical artifact's exact bytes under the current verifier.
