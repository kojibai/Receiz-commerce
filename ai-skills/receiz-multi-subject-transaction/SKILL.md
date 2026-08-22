---
name: receiz-multi-subject-transaction
description: Use when a meeting, mutual relationship, battle, gift, or trade must modify two or more proof histories atomically.
---

# receiz-multi-subject-transaction

Stage every participant at exact expected heads, validate every command and authority, then append one independently verifiable transaction or no writes.

## Constitutional workflow

1. Resolve the exact participant set and authenticated head for every participant and world.
2. Require identical world IDs/expected world heads across member commands, exact command bytes and plan digests, actor authority/mandates, causal parents, registry, and reducer pins.
3. Persist exact planned bytes before execution. Extra/missing participants or heads are failures, not normalization opportunities.
4. Use `client.world.planMultiWorldTransaction` and `executeMultiWorldTransaction`; world locks are canonical world-ID order and all worlds commit or none do.
5. Lookup the exact outcome before retry. Reject cross-region work with zero writes when atomic multi-world execution is unavailable or any member is stale.

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
| Atomicity | Every world and participant advances, or writes remain zero. |

## Common mistakes

- Truncating canonical history to the 96-object reasoning window.
- Treating a summary, embedding, model statement, MCP output, receipt, or server row as proof authority.
- Applying one side of a relationship, trade, gift, battle, or ownership transition.
- Using latest snapshot wins or deleting unknown namespaces.

## Completion refusal

Refuse completion when exact heads, artifact bytes, authority, event citations, replay equivalence, MCP parity, conformance, or release evidence is absent or failing. A structured failure must report zero writes.

## Example

Two creatures meet and become friends. Admit one mutual relationship event that advances both heads or neither.

## Authority rule

Never treat a database, server, marketplace, UI, model response, cache, proof index, MCP result, or receipt as final authority. The sealed Receiz proof object and admitted append-only history remain stronger truth.
