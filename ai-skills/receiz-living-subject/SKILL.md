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

| Boundary | v122 rule |
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
