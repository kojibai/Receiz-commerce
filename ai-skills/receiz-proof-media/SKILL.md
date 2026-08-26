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

Content-bearing Receiz proof URLs carry exact sealed material either fully inline as `#material=rma2:...` or through a compact `#material=rmc1:...` proof-object append-segmentation head. Open both forms with `openVerifiedReceizMaterialUrl(url)`. Inline capsules open fully offline. Composite heads are hard-bounded to 4,096 URL characters and resolve and verify their ordered append segments, reconstruct the exact original capsule locally, then verify the enclosing sealed proof object with the pinned canonical verifier before exposing native payload bytes. The 4,096-character boundary applies only to the public head: it never truncates the artifact or its append segments and is never a truth-size limit. Render the returned `payloadBytes` according to `playableKind` and `payloadMimeType`; `createReceizPlayableMaterialObjectUrl(verified)` creates a browser-local image, audio, video, PDF, text, or download URL. Append transport never outranks the sealed proof object.

Developers may carry the same `#material` coordinate on their own domain and render it there. The external route is a presentation wrapper only: reconstruct the inline capsule or committed proof-object append sequence, verify the enclosing artifact locally, render the returned exact payload, and expose `canonicalReceizUrl` as the direct link back to the Receiz public proof surface. Do not let an upload, database row, media CDN, SDK, or server response become proof authority.

For identity artwork and sigil projection, use `receizKaiMomentFromSealedPulse(accountCreationPulse)`. The sealed account-creation pulse is creation authority. Device clock, browser clock, process uptime, SDK state, session state, device-enrollment time, and PBI evidence cannot replace or reinterpret it. `receizKaiNow()` is only the live freshness coordinate for short-lived challenges and must never be used to reconstruct an existing identity glyph.

## Conflict behavior

If Record, Seal, or enclosing verification fails, return no new media artifact. If the profile projection fails, preserve the already sealed media proof object and leave the prior profile projection unchanged.

## Result verification

Require exact download evidence for the sealed artifact. For profile attachment, require `status === "updated"` and an `accountUid` equal to the authenticated actor. No identity key, caller head, or receipt is emitted or required for the current profile outcome.

## User confirmation

Show the source media, artifact filename, proof-object type, public URL if one is already verified, and affected avatar or banner field. Do not ask the user for a key ID, proof head, or receipt.

## MCP parity

Use `receiz_material_url_open` to verify and reconstruct a content-bearing proof URL locally. Set `includePayloadBytes: true` only when the agent host needs exact base64url payload bytes for rendering or playback. `rma2` needs no transport lookup. `rmc1` resolves only committed proof-object append segments, reconstructs exact capsule bytes locally, and rejects substitutions before canonical proof verification. Use `receiz_sealed_kai_moment` with the verified account-creation pulse when rendering identity artwork; never use the live-clock tool for an existing proof object. Neither media form may use device time to re-project an existing proof object. Use the SDK artifact-custody workflow for media Record -> Seal; MCP does not introduce a parallel media authority or a direct profile-mutation adapter. Project an already verified media URL through the canonical SDK `receiz.profile.update(profile)` operation and require the same-UID result. Never substitute an unrelated MCP tool or a model-carried projection for the sealed media proof object.

## Emulator fixture

Run `profile-media-atomic-rollback`. Require no partial profile projection after injected failure while preserving any independently completed sealed media proof object.

## v120 artifact-derived authority

Engineers remain free to build whatever they choose, but conforming Receiz receivers recognize authority only when every authority-bearing value is provably derived from independently verified artifact truth. Custom JavaScript objects, callbacks, normalized histories, local receipts, server rows, sessions, MCP memory, and AI explanations remain application data or inspection material; their shape never creates Receiz authority.

Admission begins from runtime-custodied verification of the exact enclosing artifact bytes under the complete frozen verifier context. Verified history and actor evidence remain same-runtime objects and fail closed on divergence or structural reconstruction. Identity Seal signing uses a locally held Ed25519 or P-256 key and emits a signed capability claim; only current verification of that claim against the exact plan produces capability authority.

Deterministic plan identity and unique execution-attempt identity are separate. MCP may reuse a confirmation digest only while the identical attempt is actively pending; committed and failed attempts are terminal and require a fresh confirmation. Expected authority failures are structured, immutable, machine-readable, and report zero writes.

Historical sealed proof objects remain exact-byte verifiable evidence. Historical runtime admissions, histories, actors, capabilities, plans, candidates, stores, or confirmations cannot authorize a current v121 receiver; exact bytes crossing a process require `reverify-exact-bytes`, followed by current profile admission and `same-runtime-custody` through plan, capability, seal, stage, independent byte resolution, atomic named-domain acceptance, and report-only receipt.
