# Receiz Laws For Proof Work

## Central Law

A Receiz object is not a database row. It is a proof-carrying artifact. The artifact's witnessed history is the truth boundary. Server state, database state, UI state, marketplace state, and model memory are projections only. Old witnessed truth is not stale. If a projection is wrong, rebuild it from object history. If truth is missing, append new truth. Never mutate witnessed truth.

## Truth Ladder

1. Receiz law and product invariants
2. Sealed artifact truth / embedded proof
3. Deterministic proof object state
4. Verified local truth / durable local truth
5. Verified register block / verified append
6. Authenticated snapshot
7. Server append / global sync
8. DB/session state
9. UI cache / temporary render state
10. External references for mechanics only
11. Generic app convention

## Non-Negotiables

- Verify before claiming.
- Name implemented primitives directly.
- Never invent ownership, witness IDs, rarity, transfer history, or verification status.
- Never mutate witnessed history.
- Append new truth only.
- Treat durable local truth as admitted proof, not cache.
- Treat offline verification as a primitive, not degraded mode.
- Treat MCP and SDK responses as tooling or projection beneath proof truth.

## Repo Sources To Inspect

- `AGENTS.md`
- `docs/receiz-reasoning-kernel.md`
- `docs/reality-grade-systems-kernel.md`
- `docs/invariant-first-kernel.md`
- `docs/chronos-causality-kai-time-kernel.md`
- `docs/offline-verified-register.md`
- `packages/receiz-sdk/README.md`
- `packages/receiz-mcp-server/README.md`
