---
name: receiz-world-event-runtime
description: Use when turning AI or application intent into typed deterministic world commands, admitted events, receipts, replay checkpoints, and live additions.
---

# receiz-world-event-runtime

Propose intent, construct command, validate exact heads, verify authority, decide deterministically, append atomically, return a receipt, and update projections.

## Constitutional workflow

1. Resolve authenticated participant and world heads plus pinned registry/reducer digests.
2. For private/invited events, call `client.world.planPrivateCommand` at the edge. Only the minimal public exterior, ciphertext, nonce, AAD digest, envelope digest, and recipient wraps may reach production.
3. Persist the exact planned transaction bytes before execution and call `client.world.validateTransaction`.
4. Execute once. After timeout/crash, call `client.world.execution` or `executionByIdempotencyKey` before any retry; never replan a known committed or zero-write transaction.
5. Decrypt authorized additions only at the viewer edge. Revocation removes future envelope delivery without rewriting creation history.

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
| Privacy | Private plaintext never enters a globally distributed event. |
| Recovery | Outcomes are exactly `committed`, `zero-write`, or `unknown`. |

## Common mistakes

- Truncating canonical history to the 96-object reasoning window.
- Treating a summary, embedding, model statement, MCP output, receipt, or server row as proof authority.
- Applying one side of a relationship, trade, gift, battle, or ownership transition.
- Using latest snapshot wins or deleting unknown namespaces.

## Completion refusal

Refuse completion when exact heads, artifact bytes, authority, event citations, replay equivalence, MCP parity, conformance, or release evidence is absent or failing. A structured failure must report zero writes.

## Example

Admit exploration from a structured Twin intent. Bind exact subject/world heads and authority, execute once by idempotency identity, and return event plus receipt.

## Authority rule

Never treat a database, server, marketplace, UI, model response, cache, proof index, MCP result, or receipt as final authority. The sealed Receiz proof object and admitted append-only history remain stronger truth.
