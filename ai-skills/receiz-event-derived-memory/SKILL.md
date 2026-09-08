---
name: receiz-event-derived-memory
description: Use when querying, projecting, citing, compacting, exporting, or rebuilding subject memory from admitted proof events.
---

# receiz-event-derived-memory

Treat factual memory as an event-derived projection. Require admitted event IDs and exact proof-object citations; summaries remain rebuildable and non-authoritative.

## Constitutional workflow

1. Resolve the exact v121 registry, reducer, subject, ownership, world, and Kai heads.
2. Inspect the source primitive and exact artifact bytes before using an index or projection.
3. Plan every consequential mutation and require the exact capability, mandate, or confirmation digest.
4. Execute through SDK command or transaction admission only.
5. Verify receipts, replay, byte preservation, zero-write failures, and deterministic first paint.

## Machine contract

Read [manifest.json](manifest.json) before acting. Read [SDK map](references/sdk-map.md), [MCP map](references/mcp-map.md), [examples](references/examples.md), and [test contract](tests/contracts.json) when the task reaches those boundaries.

## Quick reference

| Boundary | v121 rule |
|---|---|
| Proof | Indexes locate; exact primary proof-object bytes verify. |
| AI | AI speaks and proposes. A model response is never a world event. |
| Mutation | Typed command or atomic transaction admission only. |
| Scale | Complete content-addressed history; bounded retrieval window. |
| Transfer | Preserve identity/history/namespaces; revoke former-owner authority. |

## Common mistakes

- Truncating canonical history to the 96-object reasoning window.
- Treating a summary, embedding, model statement, MCP output, receipt, or server row as proof authority.
- Applying one side of a relationship, trade, gift, battle, or ownership transition.
- Using latest snapshot wins or deleting unknown namespaces.

## Held memory reconstruction

Treat each exact sealed replay-segment artifact as a source, not as a cache entry or database row. Open the complete held family with `openReceizSourceCarriedReplayFamilyV124` and derive memory separately for every projected root-to-head branch. A bounded reasoning window may select cited additions from one branch, but it must not truncate canonical history or silently erase a sibling continuation.

Use `receiz_source_carried_replay_open` when MCP must inspect a host-held family. Pass only trusted-host `sealedSourceArtifactRefs`; use the returned stable coordinates and counts for planning. Resolve the exact sealed sources outside model context before reading cited event payloads. The MCP family digest and memory projection remain non-authoritative beneath the sealed proof objects.

## Completion refusal

Refuse completion when exact heads, artifact bytes, authority, event citations, replay equivalence, MCP parity, conformance, or release evidence is absent or failing. A structured failure must report zero writes.

## Example

Restart on another device and remember the exact meeting. Verify the mind artifact, restore its bound subject/history heads, resolve the cited meeting event, and rebuild the same memory projection.

## Authority rule

Never treat a database, server, marketplace, UI, model response, cache, proof index, MCP result, or receipt as final authority. The sealed Receiz proof object and admitted append-only history remain stronger truth.

<!-- receiz-source-carried-law:start -->
## Source-carried conversation and material law

The enclosing sealed proof object is **enclosing-proof authority**. A source token, manifest digest, segment digest, family digest, local-custody marker, SDK projection, or MCP result can verify or coordinate a deterministic projection, but none may replace the enclosing proof object.

Conversation participation uses **Receiz-ID participant binding** to exact subject and access-key heads. There is **no fixed total member or history cap**: canonical history remains complete, while retrieval, reasoning, epoch grants, and MCP output use bounded windows. Revoking a participant requires **epoch rotation on revoke** before later private messages. Use **bounded grant operations** through `planReceizConversationEpochGrantBatchesV1` or `receiz_conversation_epoch_grants_plan`; the clear epoch secret stays in trusted-host custody and never enters model output.

Reconstruction is **held-first reconstruction**. Open complete locally held conversation sources with `openReceizConversationSourceFamilyV1` or `receiz_conversation_source_family_open`. Open complete locally held media sources with `openReceizMaterialSourceParts`, then project raw RMA3 material with `createReceizRawMaterialCapsuleBlobFromSourceParts`, or inspect bounded coordinates through `receiz_material_source_parts_open`. Complete custody is **no-fetch complete custody**: once every exact source is held, verification and reconstruction must perform zero network fetches and must not consult a database, session, or server before known-truth use.

Legacy and whole-payload-SHA-only media preserves the **whole-artifact-required fallback**. Newly sealed audio/video may carry a compact `receiz.material.progressive-ranges.v1` commitment inside the enclosing Signature-V4 proof. Build and validate its carried ledger with `buildReceizMaterialProgressiveLedger`, `createReceizMaterialProgressiveCommitment`, and the source-family reader; accept it only when the full ledger recomputes the signed root, then verify every requested range digest before projection. Never infer range authority from unsigned offsets, container metadata, transport segment hashes, a manifest, or an MCP result. `receiz_material_source_parts_open` may expose only the compact progressive summary among **non-authoritative MCP projections**. Material bytes, content-bearing locators, exact conversation sources, clear message bodies, and epoch secrets stay outside model output.
<!-- receiz-source-carried-law:end -->

<!-- receiz-v124.1-capability-map:start -->
## V124.1 callable capability bindings

- **source-carried-replay.** Open, compare, merge, and project every verified replay branch from exact sealed sources without a database or last-write-wins collapse. SDK: `openReceizSourceCarriedReplayFamilyV124`, `diffReceizSourceCarriedReplayFamiliesV124`, `mergeReceizSourceCarriedReplayFamiliesV124`, `projectReceizSourceCarriedReplayBranchesV124`. MCP: `receiz_source_carried_replay_open`. Boundary: Each sealed replay source is verified independently. Family and branch projections coordinate exact admitted sources but never replace the enclosing proof objects.
- **receiz-id-conversation.** Compose direct or unlimited invited-member conversations from complete causal history, bounded retrieval windows, encrypted epoch grants, and exact Receiz-ID participant bindings. SDK: `parseReceizConversationParticipantBindingV1`, `createReceizConversationEventV1`, `parseReceizConversationEventV1`, `reduceReceizConversationEventsV1`, `openReceizConversationSourceFamilyV1`, `createReceizConversationEpochSecretV1`, `planReceizConversationEpochGrantBatchesV1`, `openReceizConversationEpochGrantV1`, `encryptReceizConversationMessageV1`, `decryptReceizConversationMessageV1`. MCP: `receiz_conversation_source_family_open`, `receiz_conversation_epoch_grants_plan`. Boundary: Receiz identity bindings and sealed conversation events remain authority. MCP returns safe coordinates and encrypted grant envelopes only; clear messages and epoch secrets stay in trusted-host custody.
- **subject-memory-and-twin.** Resolve complete proof history through bounded cognition windows, cite exact proof objects, and generate local or connected Twin speech without promoting model output into fact or command authority. SDK: `subjects.brain.head`, `subjects.brain.search`, `subjects.brain.resolve`, `subjects.brain.stream`, `subjects.memory.query`, `subjects.memory.project`, `subjects.memory.citations`, `subjects.memory.compact`, `subjects.twin.profile`, `subjects.twin.message`, `subjects.twin.stream`, `subjects.twin.exportMind`, `subjects.twin.importMind`, `subjects.twin.memorySummary`, `subjects.twin.streamPerformance`. MCP: `receiz_subject_memory_query`, `receiz_subject_brain_head`, `receiz_subject_brain_search`, `receiz_subject_brain_resolve`, `receiz_subject_brain_stream`, `receiz_subject_twin_profile`, `receiz_subject_twin_message`, `receiz_subject_twin_mind_export`, `receiz_subject_twin_mind_import_plan`. Boundary: Proof-derived memory cites admitted events and exact primary proof objects. Twin speech, summaries, intent, and performance remain non-authoritative proposals until deterministic command admission accepts a consequential action.
<!-- receiz-v124.1-capability-map:end -->
