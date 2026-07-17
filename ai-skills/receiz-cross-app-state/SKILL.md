---
name: receiz-cross-app-state
description: Use when carrying verified namespaced account state between Receiz applications without a shared app database or identity fork.
---

# Receiz Cross-App State

Continue the same Receiz identity across applications by restoring portable account truth and appending isolated namespaces. Cross-app continuation is an identity primitive, not session sharing.

## Exact SDK operation

Use `identity.restoreAccount`, `identity.appendAccountState`, `continuity.reconcile`, and `continuity.commit`.

```ts
import { createReceizClient } from "@receiz/sdk";

const receiz = createReceizClient({ accessToken });
const account = await receiz.identity.restoreAccount(identityRecord, { artifactKind: "identity-record" });
const appended = await receiz.identity.appendAccountState(account, {
  expectedHead: account.head,
  idempotencyKey: `app:${appNamespace}:${account.head.digest}`,
  allowedNamespaces: [appNamespace],
  additions: { appState: { [appNamespace]: verifiedAppState } },
});
const plan = await receiz.continuity.reconcile({ priorOwnerScope, idempotencyKey: `continue:${appended.head.digest}` });
if (plan.status !== "ready") throw new Error("continuity_conflict");
await receiz.continuity.commit({
  priorOwnerScope,
  receizKeyId: appended.identity.keyId,
  idempotencyKey: `continue:${appended.head.digest}`,
  planDigest: plan.receipt.planDigest,
});
```

## Required authority

The verified Record, Seal, Key, or Vault supplies local identity authority. Reconciliation requires `receiz:record`. An application may append only explicitly allowed namespaces.

## Required proof head

Append against the restored identity-account head. Commit only the exact reconciliation plan digest built from that account and owner scope.

## Idempotency

Bind keys to application namespace, state digest, restored head, and owner scope. A new application state append always gets a new key; history is immutable.

## Offline behavior

Project verified portable state immediately in the destination app. Offline additions remain local appends; background work may synchronize later without remounting or downgrading the settled surface.

## Conflict behavior

Reject unauthorized or previously occupied namespaces. On global conflict, preserve both verified histories, stop the affected namespace/owner lane, and require a declared append resolution.

## Receipt verification

Verify the re-exported artifact after local append. Verify canonical receipts for globally admitted additions; the reconciliation plan receipt itself is not admission.

## User confirmation

Show origin identity key, destination app namespace, data categories, expected head, prior owner scope, and plan digest. Require confirmation before export mutation or global commit.

## MCP parity

Call `receiz_continuity_sync_plan`, require exact digest confirmation, call `receiz_continuity_sync_execute`, and call `receiz_receipt_verify` for returned canonical append receipts. MCP cannot read or rewrite another app namespace directly.

## Emulator fixture

Run `portable-restore-cross-app-continuation` and `namespace-isolation`.
