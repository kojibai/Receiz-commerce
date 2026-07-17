---
name: receiz-bearer-ownership
description: Use when claiming ownership of any qualifying Receiz bearer artifact and invalidating its previous active owner projection.
---

# Receiz Bearer Ownership

Claim the generic enclosing artifact, not a card-specific or subpayload-specific invention. Verify the stronger proof object before projecting its embedded payload.

## Exact SDK operation

Use `proofHead.get`, `ownership.claimBearerAsset`, and `receipts.verify` for every supported artifact type.

```ts
import { createReceizClient } from "@receiz/sdk";

const receiz = createReceizClient({ accessToken });
const expectedOwnershipHead = await receiz.proofHead.get({ aggregateId: `ownership:${artifactId}` });
const result = await receiz.ownership.claimBearerAsset({
  artifactBytes: new Uint8Array(await artifactFile.arrayBuffer()),
  filename: artifactFile.name,
  mimeType: artifactFile.type || "application/octet-stream",
  claimantKeyId,
  expectedOwnershipHead,
  idempotencyKey: `claim:${artifactId}:${claimantKeyId}:${expectedOwnershipHead.digest}`,
});
if (!await receiz.receipts.verify(result.receipt)) throw new Error("receipt_invalid");
if (result.previousOwnerProjection.active || !result.owner.active) throw new Error("custody_conflict");
```

## Required authority

Require the claimant Receiz identity plus delegated `receiz:record` and `receiz:seal` scopes or the corresponding signed-in session. The enclosing sealed artifact remains ownership authority.

## Required proof head

Read `ownership:${artifactId}` immediately before planning. Pass that exact head; never use a subpayload hash as the ownership boundary.

## Idempotency

Bind the key to artifact identity, claimant identity, artifact bytes, and expected ownership head. Exact replay returns the original admitted artifact; changed input with the same key is a conflict.

## Offline behavior

Offline work may verify the artifact and queue signed claim intent, but cannot report global ownership. Display `queued`, preserve the original artifact, and admit only after reconnect.

## Conflict behavior

On `ownership_head_stale` or `custody_conflict`, fetch the canonical ownership head and show the current owner/custody chain. Never overwrite, silently retry against a new owner, or revive the previous active projection.

## Receipt verification

Verify the returned canonical receipt and confirm `previousOwnerProjection.active === false`, `owner.active === true`, and ownership-head continuity before reporting ownership.

## User confirmation

Show artifact ID/type, claimant key ID, prior owner, expected head, irreversible custody consequence, and idempotency key. Require explicit confirmation.

## MCP parity

Call `receiz_proof_head_get`, then `receiz_bearer_asset_claim_plan`. Require the exact digest, call `receiz_bearer_asset_claim_execute`, then call `receiz_receipt_verify`. MCP planning and subpayload hashes are not proof authority.

## Emulator fixture

Run `generic-bearer-transfer` and `previous-owner-projection-invalidation` across all supported artifact families.
