---
name: receiz-global-reconciliation
description: Use when resolving a named Receiz coordination-domain head, reconciling independently verified offline history, handling structural divergence or contention, recovering an indeterminate attempt, or inspecting acceptance and effects without delaying known-artifact first paint.
---

# Receiz Global Reconciliation

Treat the sealed proof object as truth. Treat Receiz.com as one named coordination domain beneath it.

## Required order

1. Paint known artifact truth before remote startup.
2. Resolve the authenticated named-domain head with a verified `knownHead` when one exists.
3. Independently verify every returned exact byte and causal addition.
4. Plan reconciliation from the exact artifact and runtime-custodied verified history.
5. Ask the selected admitted Identity Seal to sign the completed capability payload.
6. Stage the exact candidate bytes with the digest-bound stage confirmation.
7. Commit only with the exact staged version and distinct commit confirmation.
8. Resolve an indeterminate attempt with the original idempotency key.
9. Inspect effect status separately from accepted-head status.

Read [reconciliation-flow.md](resources/reconciliation-flow.md) for the exact phase flow and [mcp-tool-map.md](resources/mcp-tool-map.md) when invoking MCP.

## Resolution and divergence

Use monotonic known-head catch-up. Reject a returned ancestor with `REMOTE_HEAD_ROLLBACK_DETECTED`. Preserve structural divergence: sibling branches and target-namespace conflicts require an explicit future command; never merge, rebase, or choose a timestamp winner.

Read [divergence-and-recovery.md](resources/divergence-and-recovery.md) for contention and indeterminate attempt recovery.

## Ownership succession

For portable bearer artifacts, derive current ownership from the latest lawfully admitted `ownership.transition` in verified causal order while retaining every earlier owner. Verify each historical owner-to-successor authorization independently. The final reconciliation capability authorizes submission, not prior handoffs.

## First paint and effects

Known artifact truth must paint before remote startup. Remote resolution may append verified additions only; it cannot remount or redefine the settled proof object.

An `accepted` result proves only that the named domain accepted the artifact head. It does not prove external effect delivery. Resolve effect status separately as `none`, `pending`, `delivered`, `retrying`, or `dead-letter`.

Read [first-paint-and-effects.md](resources/first-paint-and-effects.md) before changing visible artifact, ownership, or effect surfaces.

## Canonical executable boundary example

<!-- receiz-canonical-executable:start global-reconciliation-boundary -->
```js
const reconciliationBoundary = Object.freeze({
  strongerTruth: "exact-sealed-artifact-bytes",
  coordinationDomain: "receiz.com/global/v1",
  acceptanceIsUniversalConsensus: false,
  receiptIsAuthority: false,
  effectsDeliveredByAcceptance: false,
});

if (reconciliationBoundary.receiptIsAuthority) throw new Error("receipt authority downgrade");
if (reconciliationBoundary.effectsDeliveredByAcceptance) throw new Error("effect-status collapse");
```
<!-- receiz-canonical-executable:end global-reconciliation-boundary -->

## Forbidden behavior

- Never use last-write-wins or timestamp-as-head-authority.
- Never treat a Connect token as proof or operation authority.
- Never treat local receipts, projections, accepted-head rows, or effect status as artifact truth.
- Never silently resolve divergence.
- Never reconcile remotely before known artifact first paint.
- Never render a server-returned artifact before independent exact-byte verification.
- Never read a player token from environment variables.
- Never report accepted as effects delivered.
- Never report an indeterminate commit as failed.
- Never return or log raw idempotency keys, access tokens, key files, private bytes, or provider identifiers.

## Completion report

Report the commit domain, exact artifact digest, verified history head, relation, addition count, plan digest, capability verification result, immutable staged reference digest, atomic acceptance result, warnings, and effect status. State explicitly that receipts and reports are non-authoritative.
