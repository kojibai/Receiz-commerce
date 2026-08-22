---
name: receiz-value-execution
description: Use when executing or recovering proof-native Phi movement through the Settlement and Reserve rails.
---

# receiz-value-execution

Execute an already verified Phi intent through exactly one named rail: Settlement or Reserve. Phi is the moved value; USD is a canonical deterministic display projection only.

## Constitutional workflow

1. Verify the enclosing proof object at the edge before projecting any intent or authority from it.
2. Confirm the rail, `amountPhiMicro`, exact heads, authority digest, and semantic idempotency key without weakening or reconstructing the SDK plan.
3. Persist the exact planned intent before remote submission.
4. Execute once with `client.value.executeSettlement(...)` or `client.value.executeReserve(...)`.
5. Accept only `committed`, `zero-write`, or `unknown` as execution outcomes.
6. On timeout, crash, or an ambiguous response, perform lookup before retry with `client.value.executionByIdempotencyKey(...)`. Never replan an intent that may already have committed.

Read the [SDK map](references/sdk-map.md) for exact method boundaries.

## Machine contract

The proof object and its admitted append remain authority. The remote execution service may deterministically verify the same proof and exact heads before writing, but it does not become the source of truth.

## Quick reference

- Settlement execution: `client.value.executeSettlement(intent, authority)`
- Reserve execution: `client.value.executeReserve(intent, authority)`
- Recovery: `client.value.executionByIdempotencyKey(key, authority)`
- Moved value: Phi micro-units
- Display only: canonical deterministic USD value

## Common mistakes

- Sending USD as the transferred value.
- Treating Settlement and Reserve as interchangeable rails.
- Replanning after an ambiguous timeout.
- Trusting a database row, server response, or UI projection over the verified proof object and receipt.

## Completion refusal

Refuse completion if the rail is implicit, exact heads are absent, execution can write on failure, the precise plan was not persisted, or ambiguous recovery does not perform lookup before retry.

## Authority rule

The edge carries and independently verifies the object, exact plan, and receipt. Server and database state coordinate remote execution, syncing, and recovery beneath that stronger truth.
