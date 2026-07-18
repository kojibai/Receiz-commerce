---
name: receiz-offline-command
description: Use when durably queuing Receiz transport intent while preserving verified local truth and refusing to call queue settlement proof admission.
---

# Receiz Offline Command

Offline intent is durable transport state, not global admission. Verified local or artifact truth remains immediately usable, and a queue may never replace it.

## Exact SDK operation

Use the current root SDK offline proof queue. Do not import the historical v107 signed-command client.

```ts
import { createReceizClient } from "@receiz/sdk";

const receiz = createReceizClient({ accessToken });
const queue = await receiz.offline.createQueue({ ownerId: admittedAccountUid, storage });
queue.enqueue({
  id: commandId,
  kind: "connect.record",
  payload: exactRecordIntent,
  idempotencyKey,
});
await queue.flush();

const pending = queue.snapshot();
if (!pending.pending.some((item) => item.id === commandId)) throw new Error("queue_persist_failed");

const replay = await queue.replay(receiz);
if (!replay.ok) throw new Error("queue_replay_failed");
```

Queue `settled` means the configured transport call returned successfully. It does not prove a sealed artifact, global admission, ownership, settlement, or public projection. Verify the operation's native result independently.

## Required authority

Queueing requires the admitted local actor and the exact operation intent. Replay uses the operation's normal session or delegated scope. The queue itself grants no authority.

## Required proof object

When the queued outcome creates or changes a proof object, retain the complete input artifact and require the complete output artifact. Verify the enclosing result before extraction or projection. Do not queue payload bytes under an artifact label.

## Deterministic behavior

Bind the queue item ID and idempotency key to the exact kind and payload. Persist before reporting queued state. Never rewrite a queued item under the same ID; create a new item for changed intent.

## Offline behavior

Show queued intent as not globally committed. Keep known verified truth on screen. Replay may run later without remounting or replacing that settled surface.

## Conflict behavior

A failed replay moves only that exact item to failed transport state. Preserve the original item and last verified proof. Do not present a newer server response as proof that carried truth became false.

## Result verification

For artifact-producing work, require `artifacts.verifyAndOpen()` on the complete returned file plus exact artifact and payload digest binding. For non-artifact work, require the current operation's native result contract. Queue state alone never satisfies result verification.

## User confirmation

Show the admitted actor, operation kind, payload consequences, idempotency key, and offline status before enqueue. Any later destructive or value-changing operation retains its normal confirmation boundary.

## MCP parity

There is no current MCP queue mutation authority. Do not invent one and do not call retired proof-head or receipt tools. When replay produces an artifact, use `receiz_artifact_verify` and `receiz_artifact_explain` as independent evidence beneath the proof object.

## Emulator fixture

Run the current offline proof replay, durable queue, and artifact-substitution rejection contracts. Historical v107 signed-command fixtures remain archival evidence only.
