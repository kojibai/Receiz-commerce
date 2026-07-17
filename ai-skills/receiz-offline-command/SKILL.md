---
name: receiz-offline-command
description: Use when executing or durably queuing identity-signed Receiz commands while preserving local truth, proof-head order, and conflict isolation.
---

# Receiz Offline Command

Offline intent is signed and durable but is not global admission. Preserve FIFO order inside each proof-object lane and allow independent lanes to resume in parallel.

## Exact SDK operation

Use `offline.createCommandQueue`, `offline.executeOrQueue`, and `receipts.verify`.

```ts
import { createReceizClient } from "@receiz/sdk";

const receiz = createReceizClient({ accessToken });
const queue = receiz.offline.createCommandQueue({
  storage,
  connected: () => navigator.onLine,
  execute: sendSignedEnvelope,
  verifyReceipt: (receipt) => receiz.receipts.verify(receipt),
  projectLocal: projectVerifiedLocalIntent,
});
const result = await queue.executeOrQueue({
  command: { operation, proofObjectId: expectedHead.aggregateId, payload },
  identity: deviceIdentity,
  expectedHead,
  idempotencyKey,
});
if (result.status === "committed" && !await receiz.receipts.verify(result.receipt)) {
  throw new Error("receipt_invalid");
}
```

The one-shot equivalent is `offline.executeOrQueue(input, dependencies)`.

## Required authority

Require the carried Receiz device identity and the operation's delegated scope; generic queue inspection uses `receiz:record`. A signed command is intent, not global admission.

## Required proof head

The command `proofObjectId` must equal `expectedHead.aggregateId`. Use verified local/artifact truth immediately; never refetch weaker state before projecting it.

## Idempotency

The SDK derives a deterministic command ID from operation, payload, proof-object ID, expected head, and idempotency key. Reuse is valid only for the identical command.

## Offline behavior

`queued` means `globallyCommitted: false` and has no receipt. Persist it, project only lawful local intent, and resume on reconnect. Do not display fake global completion.

## Conflict behavior

A conflict stops only its proof-object lane; independent lanes continue. Present the canonical head and require a new confirmed command to rebase. Never mutate an existing envelope.

## Receipt verification

The queue verifies every committed receipt before persisting `committed`. Treat missing, mismatched, or invalid receipts as `receipt_invalid`.

## User confirmation

Require confirmation before enqueue or execution. Show operation, payload consequences, proof-object ID, expected head, idempotency key, and whether the device is offline.

## MCP parity

MCP has no second offline authority or store. Use `receiz_proof_head_get` before the operation-specific plan/execute tools and `receiz_receipt_verify` after admission. A service worker may request resume/status only.

## Emulator fixture

Run `offline-rename-global-conflict` and `interrupted-sync-deterministic-resume` to prove ordering and lane isolation.
