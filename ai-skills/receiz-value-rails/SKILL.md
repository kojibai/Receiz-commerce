---
name: receiz-value-rails
description: Use when planning, displaying, validating, or executing proof-native Phi value movement through the distinct Settlement and Reserve rails.
---

# receiz-value-rails

Move Phi through exactly one explicit rail: Settlement or Reserve. USD is never the moved authority.

## Constitutional workflow

1. Verify the source proof object and its exact value head plus the destination subject/head.
2. Select `client.value.edge.planSettlement` or `client.value.edge.planReserve`; never infer or merge rails.
3. Express movement only as `amountPhiMicro`. A live canonical deterministic USD price may be displayed, but it cannot replace the Phi amount.
4. Pin `usdPerPhiMicrocents`, `quotedUsdCents`, and `priceBasisDigest` in the committed receipt so historic display remains reproducible.
5. Independently inspect the same plan at the sender and receiver edges, verify the complete portable transition set, prepare the exact local commit set, and commit every participant or none.
6. Package only SDK-issued committed transitions into the portable recovery. The sender confirms and the receiver accepts that same recovery locally; optional server/database work may append global sync only. Read [Receiz Value Execution](../receiz-value-execution/SKILL.md).

Read [SDK map](references/sdk-map.md), [MCP map](references/mcp-map.md), and [examples](references/examples.md) when using those surfaces.

## Machine contract

The exact machine-readable requirements are in [tests/contracts.json](tests/contracts.json) and [manifest.json](manifest.json).

## Quick reference

- Settlement: `client.value.edge.planSettlement(...)`
- Reserve: `client.value.edge.planReserve(...)`
- Moved authority: `amountPhiMicro`
- Display projection: canonical deterministic USD quote pinned in the receipt
- Edge verification: `client.value.edge.inspect(...)`, `verifyTransitionSet(...)`, `prepareCommitSet(...)`
- Portable settlement: `createRecovery(...)`, then the exact rail's sender-confirm and receiver-receive methods
- Global sync: additive distribution after the edge transaction; never transaction authority

## Common mistakes

- Treating USD as the transferred authority.
- Calling Settlement and Reserve interchangeable balances.
- Moving value without binding the source proof/head and destination subject/head.
- Treating server execution or database state as the place the transaction happens.

## Completion refusal

Refuse completion when the rail is implicit, the amount is denominated in USD, the canonical price basis is absent, sender/receiver edge verification is missing, or failure could write only part of the participant set.

## Authority boundary

Settlement and Reserve are proof-native value primitives, not generic balances. The source proof/head and exact accepted append are authority. The transaction happens at the sender and receiver edges; database/server state globally synchronizes the carried proof, and UI USD is a deterministic projection.

## Authority rule

The proof object and exact Phi append are authority. MCP, database rows, sessions, and USD presentation remain weaker projections.
