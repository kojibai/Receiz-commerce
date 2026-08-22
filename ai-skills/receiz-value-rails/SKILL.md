---
name: receiz-value-rails
description: Use when planning, displaying, validating, or executing proof-native Phi value movement through the distinct Settlement and Reserve rails.
---

# receiz-value-rails

Move Phi through exactly one explicit rail: Settlement or Reserve. USD is never the moved authority.

## Constitutional workflow

1. Verify the source proof object and its exact value head plus the destination subject/head.
2. Select `client.value.planSettlement` or `client.value.planReserve`; never infer or merge rails.
3. Express movement only as `amountPhiMicro`. A live canonical deterministic USD price may be displayed, but it cannot replace the Phi amount.
4. Pin `usdPerPhiMicrocents`, `quotedUsdCents`, and `priceBasisDigest` in the committed receipt so historic display remains reproducible.
5. Validate and execute the value intent atomically with the world transaction. Any ledger, head, rail, price-basis, or receipt mismatch must produce zero writes.
6. For live remote movement, persist the exact intent, execute once through the named rail, and use execution lookup before retry after any ambiguous response. Read [Receiz Value Execution](../receiz-value-execution/SKILL.md).

Read [SDK map](references/sdk-map.md), [MCP map](references/mcp-map.md), and [examples](references/examples.md) when using those surfaces.

## Machine contract

The exact machine-readable requirements are in [tests/contracts.json](tests/contracts.json) and [manifest.json](manifest.json).

## Quick reference

- Settlement: `client.value.planSettlement(...)`
- Reserve: `client.value.planReserve(...)`
- Moved authority: `amountPhiMicro`
- Display projection: canonical deterministic USD quote pinned in the receipt
- Live execution: `client.value.executeSettlement(...)` or `client.value.executeReserve(...)`
- Ambiguous recovery: `client.value.executionByIdempotencyKey(...)`

## Common mistakes

- Treating USD as the transferred authority.
- Calling Settlement and Reserve interchangeable balances.
- Moving value without binding the source proof/head and destination subject/head.
- Committing a world append separately from its value intent.

## Completion refusal

Refuse completion when the rail is implicit, the amount is denominated in USD, the canonical price basis is absent, or failure could write any value/world state.

## Authority boundary

Settlement and Reserve are proof-native value primitives, not generic balances. The source proof/head and exact accepted append are authority. The database coordinates and recovers; UI USD is a deterministic projection.

## Authority rule

The proof object and exact Phi append are authority. MCP, database rows, sessions, and USD presentation remain weaker projections.
