---
name: receiz-portable-continuity
description: Use when restoring Record, Seal, Key, or Vault account truth, appending namespaced local state, or reconciling verified additions across devices.
---

# Receiz Portable Continuity

Treat the verified portable artifact as the account source of truth. Server reconciliation may append verified additions beneath it; it may not replace it.

## Exact SDK operation

Use `identity.restoreAccount`, `identity.appendAccountState`, `continuity.reconcile`, and `continuity.commit`.

```ts
import { createReceizClient } from "@receiz/sdk";

const receiz = createReceizClient({ accessToken });
const account = await receiz.identity.restoreAccount(artifactFile, { artifactKind: "receiz-key" });
const local = await receiz.identity.appendAccountState(account, {
  expectedHead: account.head,
  idempotencyKey: `state:${account.head.digest}:calendar`,
  allowedNamespaces: ["calendar"],
  additions: { appState: { calendar: verifiedCalendarAddition } },
});
const plan = await receiz.continuity.reconcile({ priorOwnerScope, idempotencyKey: `sync:${local.head.digest}` });
if (plan.status === "conflict") throw new Error("continuity_conflict");
const committed = await receiz.continuity.commit({
  priorOwnerScope,
  receizKeyId: local.identity.keyId,
  idempotencyKey: `sync:${local.head.digest}`,
  planDigest: plan.receipt.planDigest,
});
```

## Required authority

Local restore authority comes from the verified enclosing artifact. Online reconcile/commit requires a signed-in identity session or delegated `receiz:record` scope. Neither MCP nor server state outranks the artifact.

## Required proof head

Use the restored `account.head` for local appends and the reconciliation plan basis for commit. Reject any head from a different identity-account aggregate.

## Idempotency

Bind the local append key to namespace, additions, and expected head. Bind synchronization to the restored head and prior owner scope. Never reuse a key with changed bytes or scope.

## Offline behavior

Restore and namespaced append work from verified local artifact truth. Online reconciliation waits; it must not make the local signed-in experience half-restored.

## Conflict behavior

On stale head, preserve the restored artifact, inspect verified additions, and append a new resolution. Namespace collisions and owner-scope conflicts stop that lane without erasing other state.

## Receipt verification

Local append evidence is the re-exported verified artifact and new local head. Global synchronization is complete only after the canonical commit result and its verified append evidence; never treat the plan receipt as admission.

## User confirmation

Require confirmation before appending a namespace or committing an owner-scope transition. Show artifact kind, key ID, namespaces, prior scope, head, plan digest, and exact consequences.

## MCP parity

Call `receiz_continuity_sync_plan`, show `writesPerformed: 0`, require the exact confirmation digest, call `receiz_continuity_sync_execute`, and then call `receiz_receipt_verify` for any canonical receipt returned by the committed additions.

## Emulator fixture

Run `interrupted-sync-deterministic-resume` and `portable-restore-cross-app-continuation`.
