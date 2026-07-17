---
name: receiz-proof-media
description: Use when publishing identity-owned avatar or banner proof media or atomically attaching raw or prepublished media to a profile.
---

# Receiz Proof Media

Media is a proof-bearing identity attachment. Preserve source/transformed digests, media proof identity, owner identity, and verification route.

## Exact SDK operation

Use `media.publishIdentityImage`, `identity.updateProfile`, and `receipts.verify`. Raw `File` input must go directly through the atomic profile update; separately publish only when a reusable proof reference is intended.

```ts
import { createReceizClient } from "@receiz/sdk";

const receiz = createReceizClient({ accessToken });
const published = await receiz.media.publishIdentityImage({
  file: avatarFile,
  kind: "avatar",
  identityKeyId: current.identity.keyId,
});
if (!await receiz.receipts.verify(published.receipt)) throw new Error("receipt_invalid");
const result = await receiz.identity.updateProfile({
  identity: current.identity,
  expectedHead: current.head,
  idempotencyKey: `avatar:${current.head.digest}:${published.reference.mediaProofId}`,
  profile: { avatar: published.reference },
});
if (!await receiz.receipts.verify(result.receipt)) throw new Error("receipt_invalid");
```

For one atomic raw upload, pass `profile: { avatar: avatarFile }` to `identity.updateProfile` and skip independent publication.

## Required authority

Independent publication requires `receiz:media.write`; profile attachment requires `profile`. The media owner identity must match the profile identity.

## Required proof head

Independent media publication creates its media proof head. Profile attachment must use the exact current identity/profile head and the full validated media proof reference.

## Idempotency

Bind publication to source bytes, kind, and owner key. Bind attachment to media proof ID and profile head. Never substitute a URL while reusing the same key.

## Offline behavior

Stage raw bytes locally without claiming publication. A known verified media reference may render immediately. Queue attachment intent only with its complete reference and expected profile head.

## Conflict behavior

On media rejection or profile failure, the raw atomic operation rolls back the entire profile mutation. For prepublished media, keep the independently verified media object and rebase only the profile attachment.

## Receipt verification

Verify the publication receipt before reuse and the profile receipt after attachment. Check owner identity and all digests; a URL alone is not proof media.

## User confirmation

Show kind, owner identity, source file, transformed dimensions, verification URL, expected profile head, and whether the operation is atomic raw upload or two-step reusable publication.

## MCP parity

For reusable media, call `receiz_media_publish_plan`, confirm its digest, call `receiz_media_publish_execute`, and call `receiz_receipt_verify`. Then call `receiz_identity_profile_update_plan`, confirm, call `receiz_identity_profile_update_execute`, and verify again.

## Emulator fixture

Run `profile-media-atomic-rollback` and require no partial profile or media attachment after injected failure.
