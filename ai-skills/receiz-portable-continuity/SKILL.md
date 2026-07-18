---
name: receiz-portable-continuity
description: Use when restoring Record, Seal, Key, or Vault account truth and carrying verified additions across devices without a weaker reconciliation authority.
---

# Receiz Portable Continuity

Treat the verified portable proof object as the account source of truth. Local projection happens after proof acceptance. Server synchronization may discover and append verified additions beneath carried truth; it may not replace it.

The originating platform has no continuing ownership of the proof boundary. Any lawful platform may verify the complete object and append authenticated ownership or history while preserving its immutable object identity, payload, provenance root, prior history, and unknown application namespaces.

## Exact SDK operation

Use the current root SDK identity verifier and native artifact custody methods. Do not import the historical obsolete-versioned continuity client.

```ts
import { createReceizClient } from "@receiz/sdk";

const receiz = createReceizClient({ accessToken });
const identityFile = await receiz.identity.readArtifact(identityArtifactFile);
const account = await receiz.identity.projectAccount(identityFile);

const carried = await receiz.artifacts.verifyAndOpen(portableStateArtifactFile);
const next = await receiz.assets.createProofObject(
  {
    assetType: "proof_object",
    payload: { bytes: nextVerifiedStateBytes, mimeType: "application/json" },
  },
  { filename: "portable-state.receiz", idempotencyKey },
);
await receiz.artifacts.download(next);
```

`nextVerifiedStateBytes` must preserve the verified identity, previous artifact digest, immutable history, and every unknown application namespace. It is application input to native Record -> Seal, not a substitute artifact.

## Required authority

Local restore authority comes from the verified enclosing Identity Record, Identity Seal, Receiz Key, Vault object, or other accepted Receiz identity proof. Native resealing requires the admitted session or delegated Record and Seal scopes. Neither MCP nor server state outranks the artifact.

## Required proof object

Supply the complete identity artifact and complete portable-state artifact. Verify each enclosing object before reading its payload. A key registry row, inner JSON document, payload hash, receipt, or proof head cannot stand in for either proof object.

## Deterministic behavior

Project the accepted identity immediately. Preserve exact prior artifact bytes as history, bind the next artifact to their digest, and keep unknown namespaces byte-for-byte. A change creates a new native Record -> Seal artifact; it never edits the prior artifact in place.

## Offline behavior

Identity verification and carried-state projection work locally. Persist the exact verified artifact bytes. Network work may append verified additions later, but it cannot keep the UI half-restored or redefine the admitted account.

## Conflict behavior

On namespace or history conflict, preserve both verified artifacts and stop the affected append. Require an explicit new payload that cites both histories, then create a new artifact. Never choose a latest server row and never erase either proof object.

## Result verification

Require the same account UID from identity projection, exact downloaded artifact bytes, native Record -> Seal continuity, Signature V4, owner/claim/path binding, and successful independent `artifacts.verifyAndOpen()` of the saved file.

## User confirmation

Before native reseal, show the admitted account UID, source artifact digest, affected namespaces, new payload digest, output filename, and consequences. Confirmation authorizes only that exact Record -> Seal plan.

## MCP parity

Use `receiz_artifact_verify` and `receiz_artifact_extract_verified` for carried input, then `receiz_artifact_record_seal_plan` and `receiz_artifact_record_seal_execute` for the confirmed output. Finish with `receiz_artifact_round_trip_check`. MCP has no second continuity authority and must not call retired reconcile, head, or receipt tools.

## Emulator fixture

Run the current identity-artifact helper, native artifact round-trip, and artifact-substitution rejection contracts. Historical obsolete-versioned reconciliation fixtures are archival evidence only and are not a v110 operation contract.

## v110 continuity recovery

Use `artifacts.admitAndRecover` to verify exact bytes, classify authority, preserve parent-linked proof history, and project the latest authorized state offline. Report the plan digest, prior and next head, complete provenance, explicit actions, and non-authoritative explanation. Reconnect may append verified descendants only; it may not rewrite prior history or unknown application namespaces.
