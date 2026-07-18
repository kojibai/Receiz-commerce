---
name: receiz-proof-media
description: Use when creating native Receiz proof media, preserving its exact artifact bytes, or projecting its verified public URL onto the authenticated profile.
---

# Receiz Proof Media

Treat media as a proof object. Keep the complete sealed media artifact stronger than its profile URL or rendered derivative.

## Exact SDK operation

Create media through the native proof-object operation and preserve the returned exact artifact. Project a verified public media URL through the neutral profile operation only when that URL resolves to the same proof object.

```ts
import { createReceizClient } from "@receiz/sdk";

const receiz = createReceizClient({ accessToken });
const payloadBytes = new Uint8Array(await mediaFile.arrayBuffer());
const sealedMedia = await receiz.assets.createProofObject(
  {
    assetType: "profile_original",
    payload: { bytes: payloadBytes, mimeType: mediaFile.type },
  },
  { filename: mediaFile.name, idempotencyKey: mediaCreationKey },
);
const downloadEvidence = await receiz.artifacts.download(sealedMedia);

const profileResult = await receiz.profile.update({ avatarUrl: mediaPublicProofUrl });
if (profileResult.accountUid !== authenticatedAccountUid) throw new Error("profile_identity_mismatch");
```

Do not invent `mediaPublicProofUrl`. Use only a public Receiz verification/projection URL already bound to `sealedMedia`; otherwise keep the exact artifact without attaching a URL.

## Required authority

Treat the sealed media proof object and its native Record -> Seal continuity as stronger truth. Treat the avatar or banner URL as a profile projection beneath it. Accepted identity proof plus the admitted same-account binding defines the profile actor; SDK, MCP, and AI remain beneath those primitives.

## Required proof object

Require source bytes and MIME type for creation. Preserve the returned runtime-issued sealed artifact, Record identity, claim/path binding, owner continuity, Signature V4, and payload digest. Never substitute a URL, transformed image, detached payload, or database row for that artifact.

## Deterministic behavior

Use `assets.createProofObject` to run native Record -> Seal and `artifacts.download` to preserve exact bytes. Use `profile.update` only for the same-UID URL projection. The profile operation takes no identity key or caller proof head.

## Offline behavior

Store and render the known verified artifact immediately when available. Do not claim a new Record -> Seal or profile projection succeeded while offline. Later sync may append a verified public projection without replacing the artifact.

## Conflict behavior

If Record, Seal, or enclosing verification fails, return no new media artifact. If the profile projection fails, preserve the already sealed media proof object and leave the prior profile projection unchanged.

## Result verification

Require exact download evidence for the sealed artifact. For profile attachment, require `status === "updated"` and an `accountUid` equal to the authenticated actor. No identity key, caller head, or receipt is emitted or required for the current profile outcome.

## User confirmation

Show the source media, artifact filename, proof-object type, public URL if one is already verified, and affected avatar or banner field. Do not ask the user for a key ID, proof head, or receipt.

## MCP parity

Use the SDK artifact-custody workflow for media Record -> Seal; the active default MCP surface does not introduce a parallel media authority. To project an already verified media URL, call `receiz_identity_profile_update_plan` with `{ profile }`, require exact confirmation, then call `receiz_identity_profile_update_execute` with `{ planDigest, confirmation }`.

## Emulator fixture

Run `profile-media-atomic-rollback`. Require no partial profile projection after injected failure while preserving any independently completed sealed media proof object.

## v111 artifact-derived authority

Engineers remain free to build whatever they choose, but conforming Receiz receivers recognize authority only when every authority-bearing value is provably derived from independently verified artifact truth. Custom JavaScript objects, callbacks, normalized histories, local receipts, server rows, sessions, MCP memory, and AI explanations remain application data or inspection material; their shape never creates Receiz authority.

Admission must retain and canonically reverify the exact enclosing artifact bytes under the complete frozen verifier context. Recovery-authoritative history requires explicit independently verified evidence roots and fails closed on divergent verified heads. Canonical identity and `canSign` require enclosing-owner binding, identity-owner binding, key identity, and a domain-separated private-key challenge. Recovery planning re-derives state from verified admission and verified history.

Deterministic plan identity and unique execution-attempt identity are separate. MCP may reuse a confirmation digest only while the identical attempt is actively pending; committed and failed attempts are terminal and require a fresh confirmation. Expected authority failures are structured, immutable, machine-readable, and report zero writes.

Historical sealed proof objects remain exact-byte verifiable evidence. Historical runtime admissions, histories, capabilities, plans, or confirmations cannot authorize a current v111 receiver; re-admit the historical artifact's exact bytes under the current verifier.
