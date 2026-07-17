---
name: receiz-identity-profile
description: Use when reading or updating a Receiz identity profile, checking or changing a username, or attaching raw or prepublished proof media.
---

# Receiz Identity Profile

Preserve one Receiz identity while appending profile truth. A rename releases the prior username globally; the replacement username is appended to the same original identity.

## Exact SDK operation

Use `identity.getProfile`, `identity.checkUsernameAvailability`, and `identity.updateProfile` from `createReceizClient`. `avatar` accepts either a raw `File` or a previously returned media proof reference.

```ts
import { createReceizClient } from "@receiz/sdk";

const receiz = createReceizClient({ accessToken });
const current = await receiz.identity.getProfile();
const availability = await receiz.identity.checkUsernameAvailability(nextUsername);
if (!availability.available && !availability.isCurrent) throw new Error("username_taken");
const result = await receiz.identity.updateProfile({
  identity: current.identity,
  expectedHead: current.head,
  idempotencyKey: `profile:${current.head.digest}:${nextUsername}`,
  profile: { username: nextUsername, displayName, avatar: avatarFileOrMediaReference },
});
if (!await receiz.receipts.verify(result.receipt)) throw new Error("receipt_invalid");
```

## Required authority

Require the signed-in identity session or delegated `profile` scope. Availability is advisory and never reserves a username. The identity proof, not the username, is the continuity root.

## Required proof head

Pass the exact `head` returned by `identity.getProfile`. Never synthesize it or replace it with DB, session, or UI state.

## Idempotency

Derive one stable key from the intended patch and expected head. Reuse it only for byte-for-byte equivalent intent; changed intent requires a new key.

## Offline behavior

Queue the identity-signed proposal and show `queued` as local intent, never as global completion. A queued rename does not reserve the username.

## Conflict behavior

On `stale_proof_head`, reread the canonical head, show the verified additions, and request confirmation for a rebased append. On `username_taken`, keep the same identity and choose another available username. Never restore the released name by rewriting history.

## Receipt verification

Report `committed` only after `receipts.verify(result.receipt)` returns true and the returned head follows the expected head.

## User confirmation

Show the current and next username, released prior username, profile fields, media identity, expected head, and idempotency key. Require explicit confirmation before mutation.

## MCP parity

Call `receiz_identity_profile_get`, then `receiz_username_check`, then `receiz_identity_profile_update_plan`. Show its consequences and require the exact `confirmationDigest`; call `receiz_identity_profile_update_execute` with identical `planDigest` and `confirmation`, then independently call `receiz_receipt_verify`.

## Emulator fixture

Run `username-race`, `rename-stale-head`, and `offline-rename-global-conflict`. Emulator evidence is simulation evidence, never production verification.
