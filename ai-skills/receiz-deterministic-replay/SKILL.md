---
name: receiz-deterministic-replay
description: Use when implementing or diagnosing history replay, checkpoints, receipts, projections, equivalence, or deterministic simulation.
---

# receiz-deterministic-replay

Recompute admitted history from canonical inputs and prove checkpoint, full replay, and independent-engine equivalence. Receiz is a proof-native artifact system; this skill operates beneath sealed proof and verified local history.

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

Focused outcome: Recompute admitted history from canonical inputs and prove checkpoint, full replay, and independent-engine equivalence.

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

Request: Recompute admitted history from canonical inputs and prove checkpoint, full replay, and independent-engine equivalence.

Return a written implementation contract and read-only plan first. Execute only allowed commands after exact confirmation, then report registry digest, laws, authority, tests, independent evidence, release-lock status, and the exact remaining boundary.

## v120 artifact-derived authority

Engineers remain free to build whatever they choose, but conforming Receiz receivers recognize authority only when every authority-bearing value is provably derived from independently verified artifact truth. Custom JavaScript objects, callbacks, normalized histories, local receipts, server rows, sessions, MCP memory, and AI explanations remain application data or inspection material; their shape never creates Receiz authority.

Admission begins from runtime-custodied verification of the exact enclosing artifact bytes under the complete frozen verifier context. Verified history and actor evidence remain same-runtime objects and fail closed on divergence or structural reconstruction. Identity Seal signing uses a locally held Ed25519 or P-256 key and emits a signed capability claim; only current verification of that claim against the exact plan produces capability authority.

Deterministic plan identity and unique execution-attempt identity are separate. MCP may reuse a confirmation digest only while the identical attempt is actively pending; committed and failed attempts are terminal and require a fresh confirmation. Expected authority failures are structured, immutable, machine-readable, and report zero writes.

Historical sealed proof objects remain exact-byte verifiable evidence. Historical runtime admissions, histories, actors, capabilities, plans, candidates, stores, or confirmations cannot authorize a current v121 receiver; exact bytes crossing a process require `reverify-exact-bytes`, followed by current profile admission and `same-runtime-custody` through plan, capability, seal, stage, independent byte resolution, atomic named-domain acceptance, and report-only receipt.

## v121 living-subject contract

Use canonical head → entire proof history → bounded index retrieval → exact primary-object resolution → reasoning → provenance. The 96-object window is working context, never history truncation. AI speech and performance remain non-authoritative. Consequential actions require typed deterministic command admission; meetings, relationships, trades, gifts, and battles require atomic multi-subject transactions. Autonomous execution requires a current digest-bound mandate at lease time. Bearer transfer preserves identity, full history, memory policy, inventory disposition, and unknown namespace bytes while immediately revoking former-owner authority.

Concrete v120 evidence must include: a creature speaking from exact long-form proof memory; absent-owner exploration inside a mandate; a mutual relationship; a bounded autonomous trade; an atomic battle; exact device restoration; queued-action revocation; partition convergence without history replacement; rejection of an AI-invented event; and cross-application subject continuity.

## v124 verified replay MCP contract

Use `receiz_v124_domain_verified_additions`, `receiz_v124_domain_verified_replay`, `receiz_v124_domain_verified_checkpoint`, and `receiz_v124_domain_verified_private_additions` only through the canonical SDK verifier and authenticated transport binding. Replay and checkpoint context remains SDK-custodied. Exact private additions remain in trusted-host custody under `privateAdditionsRef` and never enter model output. Across client or process recreation, `receiz_v124_domain_replay_proof_object_export` returns an unsealed non-authoritative candidate containing `exactBytesB64u`; canonically Record -> Seal those exact bytes, admit the result as `sealedReplayProofObjectRef`, and only then call `receiz_v124_domain_replay_proof_object_restore`. Never reconstruct verified custody from MCP JSON, a database row, or a caller-provided object.

Read the [universal V124 runtime tool map](../receiz-mcp-agent-skill/resources/v124-runtime-tool-map.md) for all 22 exact adapters, SDK mappings, fixed/conditional scopes, and custody rules.

<!-- receiz-v124.1-capability-map:start -->
## V124.1 callable capability bindings

- **source-carried-replay.** Open, compare, merge, and project every verified replay branch from exact sealed sources without a database or last-write-wins collapse. SDK: `openReceizSourceCarriedReplayFamilyV124`, `diffReceizSourceCarriedReplayFamiliesV124`, `mergeReceizSourceCarriedReplayFamiliesV124`, `projectReceizSourceCarriedReplayBranchesV124`. MCP: `receiz_source_carried_replay_open`. Boundary: Each sealed replay source is verified independently. Family and branch projections coordinate exact admitted sources but never replace the enclosing proof objects.
<!-- receiz-v124.1-capability-map:end -->

<!-- receiz-proof-value-v129:start -->
## Offline proof value and replay

Read the [canonical SDK guide](../resources/offline-proof-valuation.md) and [projection evidence](../receiz-event-derived-memory/references/offline-proof-valuation.md). Use the actual `@receiz/sdk/valuation` exports: `projectReceizProofValueV129`, `sampleReceizProofValueV129`, `exportReceizProofValueReplayV129` and `verifyReceizProofValueReplayV129`. Source must be the actual SDK verification or portable-state admission of complete enclosing bytes, retained in the same runtime; copied verification/history JSON cannot reconstruct custody.

Keep `phi/kosmos-vφ-5`, checksum `b05b2049` and its original math/rounding. Return the complete diagnostics, formula/operand trace, applied legacy defaults and unknown inputs. Creator/reputation defaults are reproducibility data, not observed identity facts. Verify the enclosing proof first and read the full Kai-sigil's existing lawful, required and fixed source coordinate. The separately supplied now/future evaluation Kai uPulse uses `receizKaiMomentFromSealedUpulse` for the existing whole-pulse law without resealing or resetting issuance. Missing retained original source returns unavailable; expose only admitted precision and never manufacture finer micro-pulses or wrapper time. Valuation adds no proof-bundle field, signature/link change or temporal setter.

Intrinsic proof value, sealed-issuance market reference value, asking price and executed sale price stay distinct. `rarityPolicy` must match the sealed issuance's algorithm/version/platform/digest and named operands. Alternatively select the published `last-executed-sale-v129` rule; ambiguous heads or unavailable timing cannot produce an invented last sale. USD uses the explicit versioned/digest-bound display basis. Calculation grants no spendable Settlement, custody, payment, admission membership or purchase approval.

Call `receiz_proof_value_inspect` with `artifactReference` and explicit `valuationKaiUPulse`; `receiz_proof_value_sample` takes that reference and 1–256 explicit `valuationKaiUPulses`; `receiz_proof_value_replay_verify` takes `replayReference`. These are digest-bound workspace files. The host verifies enclosing bytes and any `saleRecoveryReferences` through the same SDK. Model source/runtime/sale JSON and separate MCP math are forbidden. `includeReplay` may return the complete public SDK replay when available; private identity/account source is excluded, and oversized output fails without truncation. These reads require no OAuth grant; scope requirements for other selected subject/domain operations remain binding.

Label chart points `recomputed-model-samples`. Actual ownership changes and completed sales are separately typed. Gifts have null payment. A completed sale needs the same asset, seller/buyer, committed intent, verified payment and accepted delivery; pending/failed/cancelled/self-message/paid-undelivered attempts are excluded. Do not import sports-specific or simulated volume/holder/history inputs. Preserve carried older history and select ownership by admitted causal heads, never upload time or array order.

Public sale production starts with actual SDK-committed participant custody. `exportReceizProofValueSalePublicEvidenceV129` projects only public journal data, which acquires evidence only inside the existing buyer-authored sealed domain replay source. Use the actual source producer, identity consent and existing `seal({ bytes, filename, mimeType })` flow in the guide. The sealer already establishes lawful source time; callers add no setter. Verify the full enclosing source and its existing replay bindings with `verifyReceizProofValueSaleRecoveryV129` before passing its SDK-issued evidence to value projection. The public source must carry the predecessor-bound strict signed issuer-key-state reference; private recovery or missing historical joins remain explicit unavailable boundaries. Producing that new source is separate from read-only valuation.

Offline replay canonically verifies exact public proof/history under the identified SDK-pinned roots, selected policy, coordinates, conversion and public sale sources before matching every expected projection digest. JSON checksums cannot replace that verification. Report `available`/`unavailable` and `verified-replay`/`invalid-replay` exactly. Qualification must prove original numerical fixtures, platform parity, no-network replay, tamper/foreign-source rejection and zero custody/payment/admission writes; fixture evidence is separate from live payment or package publication.
<!-- receiz-proof-value-v129:end -->
