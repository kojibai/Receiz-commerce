---
name: receiz-autonomous-mandate
description: Use when planning, activating, pausing, revoking, or explaining a digest-bound policy for bounded autonomous subject execution.
---

# receiz-autonomous-mandate

Obtain one owner confirmation for the exact mandate digest, then reverify scope, limits, provider, expiry, current owner, and revocation at every execution.

## Constitutional workflow

1. Verify owner and worker proof objects plus current subject heads.
2. Create the exact mandate binding owner/worker subjects, command kinds, world/region scope, Phi resource limit, geometry limit, expiration, nonce, subject heads, and revocation head.
3. Issue through `client.subjectMandates.issue`; use `state` before offline work and include the exact mandate digest in planning/execution.
4. Recheck every bound limit and head at execution time. A mandate supplements owner authority; it never replaces the owner proof object.
5. Revoke with `client.subjectMandates.revoke`. Revocation is an append and blocks future execution with zero writes.

## Machine contract

Read [manifest.json](manifest.json) before acting. Read [SDK map](references/sdk-map.md), [MCP map](references/mcp-map.md), [examples](references/examples.md), and [test contract](tests/contracts.json) when the task reaches those boundaries.

## Quick reference

| Boundary | v123 rule |
|---|---|
| Proof | Indexes locate; exact primary proof-object bytes verify. |
| AI | AI speaks and proposes. A model response is never a world event. |
| Mutation | Typed command or atomic transaction admission only. |
| Scale | Complete content-addressed history; bounded retrieval window. |
| Transfer | Preserve identity/history/namespaces; revoke former-owner authority. |
| Mandate | Exact digest and revocation head are mandatory for delegated execution. |

## Common mistakes

- Truncating canonical history to the 96-object reasoning window.
- Treating a summary, embedding, model statement, MCP output, receipt, or server row as proof authority.
- Applying one side of a relationship, trade, gift, battle, or ownership transition.
- Using latest snapshot wins or deleting unknown namespaces.

## Completion refusal

Refuse completion when exact heads, artifact bytes, authority, event citations, replay equivalence, MCP parity, conformance, or release evidence is absent or failing. A structured failure must report zero writes.

## Example

Let the creature explore while its owner is absent. Activate an exact bounded mandate, enqueue an exact-head tick, reverify it at lease time, and admit only a permitted deterministic command.

## Authority rule

Never treat a database, server, marketplace, UI, model response, cache, proof index, MCP result, or receipt as final authority. The sealed Receiz proof object and admitted append-only history remain stronger truth.
