---
name: receiz-living-subject
description: Use when creating, resolving, transferring, exporting, importing, or extending a proof-native creature, character, vehicle, agent, or collectible with immutable identity.
---

# receiz-living-subject

Bind one immutable subject identity to its enclosing sealed proof object, exact namespace bytes, owner/head state, portable edge bundle, and append-only transitions.

## Constitutional workflow

1. Verify the enclosing proof object locally. The object is authority; an embedded hash, API receipt, MCP result, or database row is not.
2. Call `client.subjects.admit({ proofObject, ownerReceizId, idempotencyKey, expectedAbsent: true })`. Never substitute the emulator for production admission.
3. For private worlds, call `client.subjects.createAccessKey({ subjectId, edgeWrappingKey })`. Only the public binding is appended remotely; the encrypted private access kit remains at the edge. Share or resolve recipient public bindings with `client.subjects.accessBinding(subjectId)`.
4. On timeout, repeat the exact bytes and idempotency key. A conflict must report `writes: 0`.
5. Export an edge bundle carrying proof, owner evidence, heads, append chain, registry/reducers, mandates, and value-proof references. Keep the encrypted access kit alongside it in edge custody; the server never receives that kit. DB state is sync, coordination, and recovery beneath edge-held truth.
6. Restore and verify the edge bundle before using a weaker remote snapshot.

## Machine contract

Read [manifest.json](manifest.json) before acting. Read [SDK map](references/sdk-map.md), [MCP map](references/mcp-map.md), [examples](references/examples.md), and [test contract](tests/contracts.json) when the task reaches those boundaries.

## Quick reference

| Boundary | v124 rule |
|---|---|
| Proof | Indexes locate; exact primary proof-object bytes verify. |
| AI | AI speaks and proposes. A model response is never a world event. |
| Mutation | Typed command or atomic transaction admission only. |
| Scale | Complete content-addressed history; bounded retrieval window. |
| Transfer | Preserve identity/history/namespaces; revoke former-owner authority. |
| Admission | Subject ID derives only from the admitted enclosing proof digest. |
| Recovery | The edge bundle is sufficient to verify held state without a network round trip. |

## Common mistakes

- Truncating canonical history to the 96-object reasoning window.
- Treating a summary, embedding, model statement, MCP output, receipt, or server row as proof authority.
- Applying one side of a relationship, trade, gift, battle, or ownership transition.
- Using latest snapshot wins or deleting unknown namespaces.

## Completion refusal

Refuse completion when exact heads, artifact bytes, authority, event citations, replay equivalence, MCP parity, conformance, or release evidence is absent or failing. A structured failure must report zero writes.

## Example

Capture a creature, verify its creature-card proof object, derive a stable semantic idempotency key, admit it remotely, persist the exact returned edge bundle, and verify the same subject/owner/head after offline restore.

## Authority rule

Never treat a database, server, marketplace, UI, model response, cache, proof index, MCP result, or receipt as final authority. The sealed Receiz proof object and admitted append-only history remain stronger truth.

<!-- receiz-v124.1-capability-map:start -->
## V124.1 callable capability bindings

- **subject-memory-and-twin.** Resolve complete proof history through bounded cognition windows, cite exact proof objects, and generate local or connected Twin speech without promoting model output into fact or command authority. SDK: `subjects.brain.head`, `subjects.brain.search`, `subjects.brain.resolve`, `subjects.brain.stream`, `subjects.memory.query`, `subjects.memory.project`, `subjects.memory.citations`, `subjects.memory.compact`, `subjects.twin.profile`, `subjects.twin.message`, `subjects.twin.stream`, `subjects.twin.exportMind`, `subjects.twin.importMind`, `subjects.twin.memorySummary`, `subjects.twin.streamPerformance`. MCP: `receiz_subject_memory_query`, `receiz_subject_brain_head`, `receiz_subject_brain_search`, `receiz_subject_brain_resolve`, `receiz_subject_brain_stream`, `receiz_subject_twin_profile`, `receiz_subject_twin_message`, `receiz_subject_twin_mind_export`, `receiz_subject_twin_mind_import_plan`. Boundary: Proof-derived memory cites admitted events and exact primary proof objects. Twin speech, summaries, intent, and performance remain non-authoritative proposals until deterministic command admission accepts a consequential action.
<!-- receiz-v124.1-capability-map:end -->

<!-- v127-local-runtime:start -->
## Executable local subject host

Read [local subject runtime](../resources/local-subject-runtime.md) and [offline sealing](../resources/offline-sealing.md) before executing local subject work. The [HTTP execution classification](../resources/historical-http.md) distinguishes implemented current routes from explicitly configured historical hosts. A listed SDK method or MCP tool alone does not prove a server route exists. The SDK ships the Node host; MCP uses RECEIZ_SUBJECT_IDENTITY_PATH, RECEIZ_SUBJECT_IDENTITY_PASSPHRASE, RECEIZ_SUBJECT_CUSTODY_DIR and optional RECEIZ_SUBJECT_SNAPSHOT_PATH. Source paths select complete sealed files and cannot supply owner authority.

Use receiz_subject_local_runtime_status, then the admitted subject operations. Exported snapshot JSON is unsealed until receiz_offline_seal_file creates the enclosing proof object with admitted identity ownership. Import only that verified complete source into an empty host. Preserve exact historical V120 identity and history; modern V122 state is a separate protocol. Historical bearer instrument tools require their explicit shared custody host and are not portable-asset claim aliases.

A bare Kai pulse is never temporal authority. Require the existing full KaiSigil Groth16 proof, exact coordinate binding and causal-head admission. Keep planning deadlines separate from verified execution coordinates. Never claim that sealing arbitrary inner JSON proves its claimed temporal history.
<!-- v127-local-runtime:end -->
