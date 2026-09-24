---
name: receiz-build-production-system
description: Use when building or materially changing a production Receiz application across multiple constitutional domains.
---

# receiz-build-production-system

Coordinate the complete production workflow across architecture, domains, laws, commands, history, offline behavior, MCP, verification, migration, and release. Receiz is a proof-native artifact system; this skill operates beneath sealed proof and verified local history.

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

## Orchestration

1. Discover
2. Model domain
3. Compile laws
4. Define commands
5. Implement events
6. Build projections
7. Add offline behavior
8. Expose safe MCP tools
9. Generate tests
10. Audit authority
11. Verify performance
12. Release-lock

**REQUIRED SUB-SKILL:** Use receiz-architecture

**REQUIRED SUB-SKILL:** Use receiz-domain-builder

**REQUIRED SUB-SKILL:** Use receiz-constitutional-laws

**REQUIRED SUB-SKILL:** Use receiz-command-builder

**REQUIRED SUB-SKILL:** Use receiz-authority-security

**REQUIRED SUB-SKILL:** Use receiz-deterministic-replay

**REQUIRED SUB-SKILL:** Use receiz-offline-first

**REQUIRED SUB-SKILL:** Use receiz-causal-sync

**REQUIRED SUB-SKILL:** Use receiz-portable-artifacts

**REQUIRED SUB-SKILL:** Use receiz-migrations

**REQUIRED SUB-SKILL:** Use receiz-performance

**REQUIRED SUB-SKILL:** Use receiz-observability

**REQUIRED SUB-SKILL:** Use receiz-testing

**REQUIRED SUB-SKILL:** Use receiz-release

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

Request: Build a production Receiz domain.

Return the implementation contract and plan. Execute confirmed allowed commands, then report all evidence and the exact remaining boundary.

## v120 artifact-derived authority

Engineers remain free to build whatever they choose, but conforming Receiz receivers recognize authority only when every authority-bearing value is provably derived from independently verified artifact truth. Custom JavaScript objects, callbacks, normalized histories, local receipts, server rows, sessions, MCP memory, and AI explanations remain application data or inspection material; their shape never creates Receiz authority.

Admission begins from runtime-custodied verification of the exact enclosing artifact bytes under the complete frozen verifier context. Verified history and actor evidence remain same-runtime objects and fail closed on divergence or structural reconstruction. Identity Seal signing uses a locally held Ed25519 or P-256 key and emits a signed capability claim; only current verification of that claim against the exact plan produces capability authority.

Deterministic plan identity and unique execution-attempt identity are separate. MCP may reuse a confirmation digest only while the identical attempt is actively pending; committed and failed attempts are terminal and require a fresh confirmation. Expected authority failures are structured, immutable, machine-readable, and report zero writes.

Historical sealed proof objects remain exact-byte verifiable evidence. Historical runtime admissions, histories, actors, capabilities, plans, candidates, stores, or confirmations cannot authorize a current v121 receiver; exact bytes crossing a process require `reverify-exact-bytes`, followed by current profile admission and `same-runtime-custody` through plan, capability, seal, stage, independent byte resolution, atomic named-domain acceptance, and report-only receipt.

## v124 production-runtime MCP contract

Production composition uses the exact 22 adapters in the [universal V124 runtime tool map](../receiz-mcp-agent-skill/resources/v124-runtime-tool-map.md). The map binds every tool to its canonical SDK method, fixed or conditional scope contract, action class, process-local handle rule, and trusted-host material/session custody. Tool presence alone is not operational evidence; `receiz_v124_runtime_qualify` must report every required dependency operational.

The sealed proof object and authenticated heads remain authority. The Receiz identity artifact remains identity authority. Grants, bearers, authority sessions, handles, MCP references, responses, and database rows remain subordinate execution, synchronization, or recovery mechanics. MCP must never reconstruct SDK authority from JSON.

<!-- v127-local-runtime:start -->
## Executable local subject host

Read [local subject runtime](../resources/local-subject-runtime.md) and [offline sealing](../resources/offline-sealing.md) before executing local subject work. The [HTTP execution classification](../resources/historical-http.md) distinguishes implemented current routes from explicitly configured historical hosts. A listed SDK method or MCP tool alone does not prove a server route exists. The SDK ships the Node host; MCP uses RECEIZ_SUBJECT_IDENTITY_PATH, RECEIZ_SUBJECT_IDENTITY_PASSPHRASE, RECEIZ_SUBJECT_CUSTODY_DIR and optional RECEIZ_SUBJECT_SNAPSHOT_PATH. Source paths select complete sealed files and cannot supply owner authority.

Use receiz_subject_local_runtime_status, then the admitted subject operations. Exported snapshot JSON is unsealed until receiz_offline_seal_file creates the enclosing proof object with admitted identity ownership. Import only that verified complete source into an empty host. Preserve exact historical V120 identity and history; modern V122 state is a separate protocol. Historical bearer instrument tools require their explicit shared custody host and are not portable-asset claim aliases.

A bare Kai pulse is never temporal authority. Require the existing full KaiSigil Groth16 proof, exact coordinate binding and causal-head admission. Keep planning deadlines separate from verified execution coordinates. Never claim that sealing arbitrary inner JSON proves its claimed temporal history.
<!-- v127-local-runtime:end -->
