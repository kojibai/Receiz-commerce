---
name: receiz-bearer-ownership
description: Use when claiming a qualifying Receiz bearer proof object from a complete verified artifact and returning its new native sealed artifact.
---

# Receiz Bearer Ownership

Claim the enclosing proof object, not a detached payload or a card-specific invention. Preserve the verified carried ownership chain through the new native artifact.

## Exact SDK operation

Verify and open the complete sealed artifact first. Pass only the runtime-issued sealed-artifact handle into the ownership operation, then download the exact new artifact.

```ts
import { createReceizClient } from "@receiz/sdk";

const receiz = createReceizClient({ accessToken });
const opened = await receiz.artifacts.verifyAndOpen(artifactFile);
const claimed = await receiz.ownership.claimBearerAsset({
  artifact: opened.sealedArtifact,
});
const downloadEvidence = await receiz.artifacts.download(claimed);
```

`opened.verifiedPayload` is an inspected projection. Ownership input remains `opened.sealedArtifact`, the complete sealed artifact.

## Required authority

Treat the enclosing sealed proof object and its carried ownership continuity as stronger truth. Bind the new owner to the authenticated Receiz account. Keep the server, SDK, MCP, and AI beneath those primitives.

The proof object is not limited to the platform that created it. Any lawful platform may verify it and append authenticated ownership and history through the same operation, provided the result preserves the same immutable object identity, payload, provenance root, and prior history and returns a newly verified complete proof object.

Require the signed-in session or delegated `receiz:record` and `receiz:seal` scopes. Do not accept a caller-selected owner, identity key, claim key, or proof head.

## Required proof object

Require a complete sealed artifact that passes enclosing integrity, Signature V4, claim/path, owner, and payload-binding verification. Reject payload bytes, a self-hash, an arbitrary Blob, or a caller-constructed artifact handle.

Prior ownership is derived from the verified carried proof payload. Never fetch or accept a caller-provided latest ownership head as the authority boundary.

## Deterministic behavior

Append the authenticated Receiz owner to the verified carried ownership document, then run native Record -> Seal. Return only the newly verified complete artifact. Use `artifacts.download` to preserve its exact bytes and metadata.

## Offline behavior

Retain the original artifact and its verified local truth when network service is unavailable. Do not report an ownership claim as complete until authenticated Record -> Seal returns the new verified artifact.

## Conflict behavior

On failed enclosing verification, non-bearer custody, authenticated-owner failure, Record failure, Seal failure, or custody conflict, return no claimed artifact. Never retry by substituting a server row, caller head, or detached payload.

## Result verification

Require a runtime-issued current native artifact with complete verification, authenticated owner continuity, Record identity, claim/path binding, Signature V4, and native Record -> Seal continuity. A receipt is not emitted or required for this current outcome.

## User confirmation

Show the source artifact identity, verified current custody, authenticated destination account, and the consequence of creating a new ownership artifact. Never ask for a claimant key ID or expected ownership head.

## MCP parity

Call `receiz_bearer_asset_claim_plan` with `{ artifactBase64, filename, mimeType }`, where the bytes are the complete sealed artifact. Require the exact confirmation digest, then call `receiz_bearer_asset_claim_execute` with `{ planDigest, confirmation }`.

The active MCP path calls `client.artifacts.verifyAndOpen(completeFile)`, then `client.ownership.claimBearerAsset({ artifact: opened.sealedArtifact })`. It returns the newly claimed complete sealed artifact bytes and evidence, never the extracted payload.

## Emulator fixture

Run `generic-bearer-transfer` and `previous-owner-projection-invalidation` across qualifying artifact families. Require the prior ownership reference to come from carried verified proof and the output to be a native sealed artifact.
