---
name: receiz-value-execution
description: Use when deriving lawful-action Settlement from sealed proof or executing and recovering proof-native Phi movement through Settlement and Reserve.
---

# receiz-value-execution

Settle an already verified Phi intent through exactly one named rail at the sender and receiver edges: Settlement or Reserve. Phi is the moved value; USD is a canonical deterministic display projection only.

For v125 lawful actions, register the current-registry law from its enclosing sealed artifact, derive every subject head, causal parent, commitment, witness, and Kai coordinate from a reverified `receiz.portable-execution-authority.v124` completed transition, admit that completed action from its enclosing sealed artifact, then derive its current value head. Never accept a developer-supplied causal-completion boolean, Phi amount, multiplier, backfill, institutional approval, or exemption. The universal projector recomputes `((completionKai - startKai) + 1) × ((valuationKai - completionKai) + 1)` micro-Phi, and only the canonical current owner carries the one spendable Settlement membership.

## Constitutional workflow

1. Verify the enclosing proof object at the edge before projecting any intent or authority from it.
2. Confirm the rail, `amountPhiMicro`, exact heads, authority digest, and semantic idempotency key without weakening or reconstructing the SDK plan.
3. Persist the exact SDK-issued edge plan outside model context and inspect it independently for both exact participant roles.
4. Canonically verify the portable transition set, prepare its exact local commit set, and commit all participant transitions or none.
5. Package only SDK-issued committed transitions with `client.value.edge.createRecovery(...)`; sender and receiver independently confirm/receive the same recovery through the named rail.
6. Append optional global synchronization after the edge transaction. If a retained remote V123/V124 compatibility execution has an ambiguous delivery, resolve by idempotency before retry and export its canonical committed recovery when custody exists. Never replan an intent that may already have committed.

For remote lawful-action admission, use `createReceizV125LawfulActionClient(...)`. For MCP, pass only opaque trusted-host/same-runtime references to the thirteen v125 tools; never put sealed bytes, bearer material, exact commit units, committed transition custody, or private authority into model context.

Read the [SDK map](references/sdk-map.md) and [MCP map](references/mcp-map.md) for exact method, route-scope, plan-scope, process-local handle, and trusted-host session custody boundaries.

## Machine contract

The proof object and its admitted append remain authority. The remote execution service may deterministically verify the same proof and exact heads before writing, but it does not become the source of truth.

## Quick reference

- Edge Settlement: `client.value.edge.planSettlement`, `confirmSettlementSend`, `receiveSettlement`
- Edge Reserve: `client.value.edge.planReserve`, `confirmReserveSend`, `receiveReserve`
- Exact edge lifecycle: `inspect`, `verifyTransitionSet`, `prepareCommitSet`, `createRecovery`
- Committed compatibility handoff: `client.execution.exportCommittedRecovery(outcome)`
- Historical remote recovery: `client.execution.resolveByIdempotencyKey(...)` or `client.value.executionByIdempotencyKey(...)`
- Moved value: Phi micro-units
- Display only: canonical deterministic USD value

## Common mistakes

- Sending USD as the transferred value.
- Treating Settlement and Reserve as interchangeable rails.
- Treating a remote submission or database write as the transaction itself.
- Replanning after an ambiguous compatibility timeout.
- Trusting a database row, server response, or UI projection over the verified proof object and receipt.
- Reconstructing a V124 execution handle or authority session from MCP JSON instead of using a process-local handle and canonically re-verified local/persisted session.

## Completion refusal

Refuse completion if the rail is implicit, exact heads are absent, sender/receiver inspection is absent, the participant commit is partial, the precise plan/recovery was not retained, or a compatibility ambiguity does not perform lookup before retry.

## Authority rule

The edge carries and independently verifies the object, exact plan, and receipt. Server and database state coordinate remote execution, syncing, and recovery beneath that stronger truth.
