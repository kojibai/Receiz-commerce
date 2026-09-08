---
name: receiz-portable-artifacts
description: Use when creating, importing, exporting, inspecting, signing, or verifying portable Receiz proof objects and sealed files.
---

# receiz-portable-artifacts

Bind payloads to the enclosing sealed artifact, preserve provenance and history, and verify without server authority. Receiz is a proof-native artifact system; this skill operates beneath sealed proof and verified local history.

## Binding v120 artifact law

A Receiz artifact is the exact byte sequence returned by native Record -> Seal. The inner payload is never an acceptable substitute.

A verified proof object is not limited to the platform that created it. Any lawful platform may append authenticated ownership and history only while preserving the same immutable object identity, payload, provenance root, prior history, and unknown namespaces, then returning a complete verified proof object.

Label every byte sequence before use:

- `payload`: application bytes that may be passed into Record -> Seal or to a domain parser only after enclosing verification.
- `sealed artifact`: the indivisible SDK-issued Record -> Seal bytes carrying integrity, Signature V4, owner, claim, verify path, provenance, and payload binding.

## Required SDK artifact workflow

The exact v121 application-operation inventory is `receiz.artifact.verify`, `receiz.artifact.admit`, `receiz.artifact.append.plan`, `receiz.identity.capability.sign`, `receiz.artifact.transition.seal`, `receiz.artifact.transition.stage`, `receiz.artifact.transition.commit`, `receiz.admission.command.execute`, `receiz.public-proof.projection.locate`, `receiz.artifact.global.resolve`, `receiz.artifact.offline.reconcile`, `receiz.profile-showcase.genesis.plan`, `receiz.profile-showcase.append.plan`, `receiz.economy-showcase.genesis.plan`, `receiz.economy-showcase.append.plan`, `receiz.economy-showcase.merge.plan`, `receiz.subject.resolve`, `receiz.subject.brain.retrieve`, `receiz.subject.twin.message`, `receiz.subject.mandate.activate`, `receiz.world.command.plan`, `receiz.world.command.execute`, `receiz.world.transaction.plan`, `receiz.world.transaction.execute`, `receiz.subject.runtime.enqueue`, `receiz.subject.memory.project`, `receiz.bearer.transfer.plan`, `receiz.bearer.instrument.issue`, `receiz.bearer.instrument.claim`, `receiz.bearer.transfer.cancel`. These identifiers describe the application authority matrix; they do not create authority.

```ts
const payload = { bytes: applicationPayload, mimeType: applicationMimeType };
const sealedArtifact = await receiz.assets.createProofObject(
  { assetType: "proof_object", payload },
  { filename: applicationFilename, idempotencyKey },
);
const downloadEvidence = await receiz.artifacts.download(sealedArtifact);
const opened = await receiz.artifacts.verifyAndOpen(savedArtifactFile);
if (downloadEvidence.artifactSha256 !== sealedArtifact.artifactSha256) throw new Error("artifact_digest_mismatch");
if (opened.sealedArtifact.artifactSha256 !== sealedArtifact.artifactSha256) throw new Error("saved_artifact_mismatch");
if (opened.verifiedPayload.sha256 !== sealedArtifact.payloadSha256) throw new Error("payload_binding_mismatch");
```

Independently hash the saved bytes and require equality with `sealedArtifact.artifactSha256`. Require `verification.ok`, `integrity.ok`, carrier `native-record-seal`, Signature V4, owner, claim, and verify-path agreement. Reopen the exact saved file with `verifyAndOpen`, then prove a different Receiz application preserves identity, cards, history, receipts, and unknown namespaces. Current exports use native Record -> Seal; verified legacy artifacts remain read-compatible only.

## Content-bearing proof URLs

Portable playback uses either a fully inline `rma2` capsule or compact `rmc1` proof-object append segmentation. An `rmc1` public head is hard-bounded to 4,096 URL characters and commits the complete ordered append sequence that reconstructs the same exact capsule bytes without navigating to a giant textual URL. That bound applies only to the head and never truncates or limits lawful sealed truth. Consumers must verify segment order, length, digest, Merkle root, Fibonacci checkpoints, complete capsule digest, enclosing artifact digest, and the sealed proof object before rendering a browser-local media URL. Append transport, storage, SDK, MCP, server, and UI projections remain subordinate to the enclosing sealed artifact.

`createReceizMaterialSourceFamily` turns the existing material composite into independently copyable content-bearing manifest and segment URLs. `createReceizClosedMaterialPresentationUrl` can fold the complete family into one long held presentation URL. `openVerifiedReceizMaterialUrl(headUrl, { sourceUrls })` reconstructs from the complete held family with zero remote fetches, then verifies the enclosing artifact before payload projection. Presenting any held source field commits the caller to held reconstruction: incomplete or conflicting families fail closed instead of falling back to a weaker remote source.

For causal data, `openReceizSourceCarriedReplayFamilyV124` verifies exact sealed replay-segment artifacts, orders them by predecessor, preserves all heads, and computes a deterministic non-authoritative family set digest. Use `diffReceizSourceCarriedReplayFamiliesV124`, `mergeReceizSourceCarriedReplayFamiliesV124`, and `projectReceizSourceCarriedReplayBranchesV124` for transfer, convergence, and rebuildable projections. MCP parity is `receiz_source_carried_replay_open` over trusted-host `sealedSourceArtifactRefs`; exact source bytes never enter its result or persistence.

## Twelve-step artifact workflow

1. Label the input bytes as `payload`; never call them an artifact.
2. Load the active canonical v120 registry and `ARTIFACT-001` through `ARTIFACT-030`.
3. Call `receiz.assets.createProofObject` so Receiz.com performs native Record -> Seal.
4. Require an SDK-issued `receiz.native-record-seal`; failure returns no artifact and no payload fallback.
5. Require complete enclosing-artifact verification, integrity, Signature V4, owner, claim, verify path, and payload binding.
6. Call `receiz.artifacts.download` with only that SDK-issued sealed artifact.
7. Independently hash the exact saved artifact bytes without repacking or relabeling them.
8. Require the saved artifact digest to equal the SDK-issued artifact digest.
9. Reopen the exact saved file through `receiz.artifacts.verifyAndOpen` before payload extraction.
10. Pass only `opened.verifiedPayload.bytes` to domain parsers and preserve unknown namespaces.
11. Exercise a different Receiz application projection and prove identity, ownership history, namespaces, and byte round trip remain intact.
12. Record every production-ready evidence field below and refuse completion if any field is absent or failing.

When MCP is available, use only these current artifact tools; each remains subordinate to the SDK and enclosing proof:

- `receiz_artifact_verify`
- `receiz_artifact_admit`
- `receiz_artifact_append_plan`
- `receiz_artifact_transition_seal_and_stage`
- `receiz_artifact_transition_commit`
- `receiz_artifact_global_resolve`
- `receiz_artifact_reconcile_plan`
- `receiz_artifact_reconcile_stage`
- `receiz_artifact_reconcile_commit`

## Artifact prohibitions

- Never download an unsealed payload fallback.
- Never call an inner payload a Receiz artifact.
- Never relabel payload bytes as a Receiz artifact.
- Never repack, wrap, recompress, or modify native Record -> Seal bytes.
- Never treat shape validation as artifact verification.
- Never delete unknown cross-application namespaces.
- Never rewrite immutable ownership or provenance history.
- Never weaken a failing test to accept payload-only continuity.
- Never claim success from UI rendering alone.

## Production-ready evidence

Refuse to call the artifact production-ready when any field is absent or failing:

```md
SDK version:
Registry digest:
Artifact law version:
Artifact carrier:
Signature version:
Artifact digest:
Payload digest:
Owner and claim binding:
Independent verification result:
Cross-platform round-trip result:
Legacy compatibility result:
Release-lock result:
Network calls during verification: 0
Local verifier result:
```

## v120 unified admission and recovery

First call `verifyReceizArtifact(file)`. Then call `receiz.artifacts.admit(verification, profileOptions)` in the same runtime. Admission reports profile membership and primitive-specific assessments; it does not authorize an operation. Verified actor evidence exists only after identity-profile admission, never from a caller constraint or structural object.

Call `verifyReceizArtifact(file)`, then `receiz.artifacts.admit(verification, profileOptions)`, and pass the runtime-custodied admission, verified history, actor evidence, registry law, named commit domain, event, expected head, and idempotency identity to `planArtifactAppend`. Planning performs zero writes and preserves unknown namespaces byte-for-byte.

Seal and durably stage the plan-bound candidate before commit. Commit independently resolves and reverifies the staged bytes inside the named domain, then advances the head atomically. A receipt reports acceptance and cannot re-enter any authority-bearing API.

- Never admit a card-only payload as a Receiz artifact.
- Never treat an explanation as proof authority.
- Never accept raw capability JSON as recovery authority.
- Never hide mutation inside admission or append planning.

Current MCP parity is exactly `receiz_artifact_verify`, `receiz_artifact_admit`, `receiz_artifact_append_plan`, `receiz_artifact_transition_seal_and_stage`, `receiz_artifact_transition_commit`, `receiz_artifact_global_resolve`, `receiz_artifact_reconcile_plan`, `receiz_artifact_reconcile_stage`, and `receiz_artifact_reconcile_commit`. The first five are preserved as the historical v112 compatibility inventory, not as a second current inventory.

Required completion evidence:

```md
Admission verdict:
Permitted actions:
Proof history digest:
Recovery plan digest:
Operation identity:
Atomic commit result:
```

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

Focused outcome: Bind payloads to the enclosing sealed artifact, preserve provenance and history, and verify without server authority.

## Machine contract

Read [manifest.json](manifest.json) before acting. Its package range, ruleset, active registry digest requirement, laws, allowed tools, forbidden operations, evidence, escalation conditions, and autonomous-authority ceiling are executable constraints. Use plan/permit/execute for any admitted command and obtain explicit confirmation for the exact permit digest. The skill and MCP context are never proof authority.

## Quick reference

| Boundary | Required result |
|---|---|
| Stronger truth | Sealed artifact and verified local history remain above SDK, MCP, server, DB, session, and UI projections. |
| Mutation | Canonical state changes only through an allowed SDK operation after enclosing-proof verification; ownership and history appends must be authenticated, append-only, and reverified without a receipt prerequisite. |
| Evidence | MCP output and agent assertions do not count; independent verification and release-lock evidence do. |
| Escalation | Stop on digest skew, authority bypass, missing capability, ambiguous migration, or absent independent evidence. |

## Common mistakes

- Treating a larger or newer server snapshot as permission to replace stronger admitted truth.
- Calling an MCP plan, simulation, hash, model response, or passing UI check verification.
- Appending ownership or history without enclosing-proof verification, authenticated authority, prior-history preservation, and output reverification.
- Marking the task complete while required evidence is missing.

## Completion refusal

Refuse completion when any manifest input, law, test, conformance result, independent-verifier result, or release-lock result is absent or failing. Never reduce the evidence list, change a test to bless a visible regression, invent authority, or accept “the AI said it is valid” as evidence.

## Example

Request: Bind payloads to the enclosing sealed artifact, preserve provenance and history, and verify without server authority.

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

- **source-carried-replay.** Open, compare, merge, and project every verified replay branch from exact sealed sources without a database or last-write-wins collapse. SDK: `openReceizSourceCarriedReplayFamilyV124`, `diffReceizSourceCarriedReplayFamiliesV124`, `mergeReceizSourceCarriedReplayFamiliesV124`, `projectReceizSourceCarriedReplayBranchesV124`. MCP: `receiz_source_carried_replay_open`. Boundary: Each sealed replay source is verified independently. Family and branch projections coordinate exact admitted sources but never replace the enclosing proof objects.
- **receiz-id-conversation.** Compose direct or unlimited invited-member conversations from complete causal history, bounded retrieval windows, encrypted epoch grants, and exact Receiz-ID participant bindings. SDK: `parseReceizConversationParticipantBindingV1`, `createReceizConversationEventV1`, `parseReceizConversationEventV1`, `reduceReceizConversationEventsV1`, `openReceizConversationSourceFamilyV1`, `createReceizConversationEpochSecretV1`, `planReceizConversationEpochGrantBatchesV1`, `openReceizConversationEpochGrantV1`, `encryptReceizConversationMessageV1`, `decryptReceizConversationMessageV1`. MCP: `receiz_conversation_source_family_open`, `receiz_conversation_epoch_grants_plan`. Boundary: Receiz identity bindings and sealed conversation events remain authority. MCP returns safe coordinates and encrypted grant envelopes only; clear messages and epoch secrets stay in trusted-host custody.
- **held-material-reconstruction.** Build, publish, hold, reopen, and reconstruct inline RMA2 or segmented RMC1/RMC2 with raw RMA3 projection while verifying the enclosing artifact before native media use. SDK: `buildReceizMaterialCompositeTransport`, `publishReceizMaterialCompositeTransport`, `resolveReceizMaterialCompositeTransport`, `createReceizMaterialSourceFamily`, `createReceizClosedMaterialPresentationUrl`, `openReceizMaterialSourceParts`, `createReceizRawMaterialCapsuleBlobFromSourceParts`, `decodeReceizRawMaterialCapsuleBytes`, `resolveReceizMaterialCompositeFromSources`, `openVerifiedReceizMaterialUrl`. MCP: `receiz_material_source_parts_open`, `receiz_material_url_open`. Boundary: Transport segments, locators, manifests, object URLs, and storage are projections only. Native bytes are admitted only beneath verification of the enclosing sealed artifact.
- **progressive-range-playback.** Start verified first-frame playback from signed range commitments while remaining ranges settle behind the already playing media. SDK: `buildReceizMaterialProgressiveLedger`, `createReceizMaterialProgressiveCommitment`, `coerceReceizMaterialProgressiveLedger`, `coerceReceizMaterialProgressiveCommitment`, `openReceizMaterialSourceRangeReader`. MCP: `receiz_material_source_parts_open`. Boundary: Only a progressive ledger whose complete root is carried by the enclosing Signature-V4 proof can authorize range projection. Unsigned offsets, container metadata, or transport segments cannot.
<!-- receiz-v124.1-capability-map:end -->
