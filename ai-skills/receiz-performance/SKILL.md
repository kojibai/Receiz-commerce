---
name: receiz-performance
description: Use when measuring or changing first paint, registry loading, admission latency, replay, bundles, memory, or mobile execution.
---

# receiz-performance

Assign numeric fixture budgets and optimize beneath deterministic known-truth paint and verification requirements. Receiz is a proof-native artifact system; this skill operates beneath sealed proof and verified local history.

## Constitutional workflow

1. Inspect the repository and installed SDK version.
2. Load the active canonical v126 registry and applicable constitutional laws.
3. Identify every authority boundary affected by the change.
4. Write the implementation contract before implementation.
5. Implement canonical changes only through SDK commands.
6. Add law, mutation, replay, and compatibility tests.
7. Run MCP conformance checks.
8. Require independent verifier evidence.
9. Refuse completion until the release lock passes.

Focused outcome: Assign numeric fixture budgets and optimize beneath deterministic known-truth paint and verification requirements.

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

Request: Assign numeric fixture budgets and optimize beneath deterministic known-truth paint and verification requirements.

Return a written implementation contract and read-only plan first. Execute only allowed commands after exact confirmation, then report registry digest, laws, authority, tests, independent evidence, release-lock status, and the exact remaining boundary.





<!-- receiz-source-carried-law:start -->
## Source-carried conversation and material law

The enclosing sealed proof object is **enclosing-proof authority**. A source token, manifest digest, segment digest, family digest, local-custody marker, SDK projection, or MCP result can verify or coordinate a deterministic projection, but none may replace the enclosing proof object.

Conversation participation uses **Receiz-ID participant binding** to exact subject and access-key heads. There is **no fixed total member or history cap**: canonical history remains complete, while retrieval, reasoning, epoch grants, and MCP output use bounded windows. Revoking a participant requires **epoch rotation on revoke** before later private messages. Use **bounded grant operations** through `planReceizConversationEpochGrantBatchesV1` or `receiz_conversation_epoch_grants_plan`; the clear epoch secret stays in trusted-host custody and never enters model output.

Reconstruction is **held-first reconstruction**. Open complete locally held conversation sources with `openReceizConversationSourceFamilyV1` or `receiz_conversation_source_family_open`. Open complete locally held media sources with `openReceizMaterialSourceParts`, then project raw RMA3 material with `createReceizRawMaterialCapsuleBlobFromSourceParts`, or inspect bounded coordinates through `receiz_material_source_parts_open`. Complete custody is **no-fetch complete custody**: once every exact source is held, verification and reconstruction must perform zero network fetches and must not consult a database, session, or server before known-truth use.

Legacy and whole-payload-SHA-only media preserves the **whole-artifact-required fallback**. Newly sealed audio/video may carry a compact `receiz.material.progressive-ranges.v1` commitment inside the enclosing Signature-V4 proof. Build and validate its carried ledger with `buildReceizMaterialProgressiveLedger`, `createReceizMaterialProgressiveCommitment`, and the source-family reader; accept it only when the full ledger recomputes the signed root, then verify every requested range digest before projection. Never infer range authority from unsigned offsets, container metadata, transport segment hashes, a manifest, or an MCP result. `receiz_material_source_parts_open` may expose only the compact progressive summary among **non-authoritative MCP projections**. Material bytes, content-bearing locators, exact conversation sources, clear message bodies, and epoch secrets stay outside model output.
<!-- receiz-source-carried-law:end -->

## v120 artifact-derived authority

Engineers remain free to build whatever they choose, but conforming Receiz receivers recognize authority only when every authority-bearing value is provably derived from independently verified artifact truth. Custom JavaScript objects, callbacks, normalized histories, local receipts, server rows, sessions, MCP memory, and AI explanations remain application data or inspection material; their shape never creates Receiz authority.

Admission begins from runtime-custodied verification of the exact enclosing artifact bytes under the complete frozen verifier context. Verified history and actor evidence remain same-runtime objects and fail closed on divergence or structural reconstruction. Identity Seal signing uses a locally held Ed25519 or P-256 key and emits a signed capability claim; only current verification of that claim against the exact plan produces capability authority.

Deterministic plan identity and unique execution-attempt identity are separate. MCP may reuse a confirmation digest only while the identical attempt is actively pending; committed and failed attempts are terminal and require a fresh confirmation. Expected authority failures are structured, immutable, machine-readable, and report zero writes.

Historical sealed proof objects remain exact-byte verifiable evidence. Historical runtime admissions, histories, actors, capabilities, plans, candidates, stores, or confirmations cannot authorize a current v121 receiver; exact bytes crossing a process require `reverify-exact-bytes`, followed by current profile admission and `same-runtime-custody` through plan, capability, seal, stage, independent byte resolution, atomic named-domain acceptance, and report-only receipt.

<!-- receiz-v124.1-capability-map:start -->
## V124.1 callable capability bindings

- **held-material-reconstruction.** Build, publish, hold, reopen, and reconstruct inline RMA2 or segmented RMC1/RMC2 with raw RMA3 projection while verifying the enclosing artifact before native media use. SDK: `buildReceizMaterialCompositeTransport`, `publishReceizMaterialCompositeTransport`, `resolveReceizMaterialCompositeTransport`, `createReceizMaterialSourceFamily`, `createReceizClosedMaterialPresentationUrl`, `openReceizMaterialSourceParts`, `createReceizRawMaterialCapsuleBlobFromSourceParts`, `decodeReceizRawMaterialCapsuleBytes`, `resolveReceizMaterialCompositeFromSources`, `openVerifiedReceizMaterialUrl`. MCP: `receiz_material_source_parts_open`, `receiz_material_url_open`. Boundary: Transport segments, locators, manifests, object URLs, and storage are projections only. Native bytes are admitted only beneath verification of the enclosing sealed artifact.
- **progressive-range-playback.** Start verified first-frame playback from signed range commitments while remaining ranges settle behind the already playing media. SDK: `buildReceizMaterialProgressiveLedger`, `createReceizMaterialProgressiveCommitment`, `coerceReceizMaterialProgressiveLedger`, `coerceReceizMaterialProgressiveCommitment`, `openReceizMaterialSourceRangeReader`. MCP: `receiz_material_source_parts_open`. Boundary: Only a progressive ledger whose complete root is carried by the enclosing Signature-V4 proof can authorize range projection. Unsigned offsets, container metadata, or transport segments cannot.
<!-- receiz-v124.1-capability-map:end -->
