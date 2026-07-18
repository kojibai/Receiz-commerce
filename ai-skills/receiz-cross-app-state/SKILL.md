---
name: receiz-cross-app-state
description: Use when carrying verified namespaced account state between Receiz applications without a shared app database or identity fork.
---

# Receiz Cross-App State

Continue the same Receiz identity across applications by restoring portable account truth and appending isolated namespaces. Cross-app continuation is an identity primitive, not session sharing.

## Binding v110 artifact law

A Receiz artifact is the exact byte sequence returned by native Record -> Seal. The inner payload is never an acceptable substitute.

A verified proof object is not limited to the platform that created it. Any lawful platform may append authenticated ownership and history only while preserving the same immutable object identity, payload, provenance root, prior history, and unknown namespaces, then returning a complete verified proof object.

Label every byte sequence before cross-app use:

- `payload`: application bytes exposed separately only after the enclosing artifact verifies.
- `sealed artifact`: the indivisible SDK-issued Record -> Seal bytes carrying integrity, Signature V4, owner, claim, verify path, provenance, and payload binding.

## Required SDK artifact workflow

```ts
const payload = { bytes: applicationPayload, mimeType: applicationMimeType };
const sealedArtifact = await receiz.assets.createProofObject(
  { assetType: "proof_object", payload },
  { filename: applicationFilename, idempotencyKey },
);
const downloadEvidence = await receiz.artifacts.download(sealedArtifact);
const opened = await receiz.artifacts.verifyAndOpen(savedArtifactFile);
if (downloadEvidence.artifactSha256 !== sealedArtifact.artifactSha256) throw new Error("artifact_digest_mismatch");
if (opened.sealedArtifact.artifactSha256 !== sealedArtifact.artifactSha256) throw new Error("saved_artifact_mismatch");
if (opened.verifiedPayload.sha256 !== sealedArtifact.payloadSha256) throw new Error("payload_binding_mismatch");
```

Independently hash the saved bytes and require equality with `sealedArtifact.artifactSha256`. Require `verification.ok`, `integrity.ok`, carrier `native-record-seal`, Signature V4, owner, claim, and verify-path agreement. Reopen the exact saved file with `verifyAndOpen`, then prove a different Receiz application preserves identity, cards, history, receipts, and unknown namespaces. Current exports use native Record -> Seal; verified legacy artifacts remain read-compatible only.

## Twelve-step artifact workflow

1. Label the input bytes as `payload`; never call them an artifact.
2. Load the active signed v110 registry and `ARTIFACT-001` through `ARTIFACT-010`.
3. Call `receiz.assets.createProofObject` so Receiz.com performs native Record -> Seal.
4. Require an SDK-issued `receiz.native-record-seal`; failure returns no artifact and no payload fallback.
5. Require complete enclosing-artifact verification, integrity, Signature V4, owner, claim, verify path, and payload binding.
6. Call `receiz.artifacts.download` with only that SDK-issued sealed artifact.
7. Independently hash the exact saved artifact bytes without repacking or relabeling them.
8. Require the saved artifact digest to equal the SDK-issued artifact digest.
9. Reopen the exact saved file through `receiz.artifacts.verifyAndOpen` before payload extraction.
10. Pass only `opened.verifiedPayload.bytes` to domain parsers and preserve unknown namespaces.
11. Exercise a different Receiz application projection and prove identity, ownership history, namespaces, and byte round trip remain intact.
12. Record every production-ready evidence field below and refuse completion if any field is absent or failing.

When MCP is available, use only these current artifact tools; each remains subordinate to the SDK and enclosing proof:

- `receiz_artifact_record_seal_plan`
- `receiz_artifact_record_seal_execute`
- `receiz_artifact_verify`
- `receiz_artifact_extract_verified`
- `receiz_artifact_round_trip_check`
- `receiz_artifact_explain`

## Artifact prohibitions

- Never download an unsealed payload fallback.
- Never call an inner payload a Receiz artifact.
- Never relabel payload bytes as a Receiz artifact.
- Never repack, wrap, recompress, or modify native Record -> Seal bytes.
- Never treat shape validation as artifact verification.
- Never delete unknown cross-application namespaces.
- Never rewrite immutable ownership or provenance history.
- Never weaken a failing test to accept payload-only continuity.
- Never claim success from UI rendering alone.

## Production-ready evidence

Refuse to call the artifact production-ready when any field is absent or failing:

```md
SDK version:
Registry digest:
Artifact law version:
Artifact carrier:
Signature version:
Artifact digest:
Payload digest:
Owner and claim binding:
Independent verification result:
Cross-platform round-trip result:
Legacy compatibility result:
Release-lock result:
Network calls during verification: 0
Local verifier result:
```

## Exact SDK operation

Use the current root SDK identity verifier and complete-artifact custody methods. Do not import the historical obsolete-versioned continuity client.

```ts
import { createReceizClient } from "@receiz/sdk";

const receiz = createReceizClient({ accessToken });
const identityFile = await receiz.identity.readArtifact(identityArtifactFile);
const account = await receiz.identity.projectAccount(identityFile);
const carried = await receiz.artifacts.verifyAndOpen(crossAppStateArtifactFile);

const next = await receiz.assets.createProofObject(
  {
    assetType: "proof_object",
    payload: { bytes: nextNamespacedStateBytes, mimeType: "application/json" },
  },
  { filename: "cross-app-state.receiz", idempotencyKey },
);
await receiz.artifacts.download(next);
```

`nextNamespacedStateBytes` must retain the admitted `account.owner.uid`, cite `carried.sealedArtifact.artifactSha256`, preserve every unknown namespace, and append only the authorized application namespace. Native Record -> Seal creates the next proof object.

## Required authority

The verified Record, Seal, Key, or Vault supplies local identity authority. Native reseal requires the admitted session or delegated Record and Seal scopes. An application may append only its explicitly allowed namespace.

## Required proof object

Require the complete identity artifact and complete cross-application state artifact. Verify both enclosing objects before projection. An inner JSON document, database row, receipt, or proof head cannot replace either artifact.

## Deterministic behavior

Bind idempotency to the application namespace, prior artifact digest, next payload digest, and admitted UID. Preserve exact prior bytes and immutable history. Every changed state creates a new artifact.

## Offline behavior

Project verified portable state immediately in the destination application. Persist the exact artifact bytes. Background synchronization may append verified additions later without remounting or downgrading the settled surface.

## Conflict behavior

Reject unauthorized or previously occupied namespaces. Preserve every conflicting verified artifact, stop the affected namespace lane, and require a declared append resolution that cites both histories.

## Result verification

Require the same admitted UID, exact downloaded bytes, native Record -> Seal continuity, Signature V4, owner/claim/path binding, payload binding, and independent verification in the destination application.

## User confirmation

Show the admitted UID, prior artifact digest, destination namespace, data categories, next payload digest, and exact Record -> Seal plan. Require confirmation before creating the next artifact.

## MCP parity

Call `receiz_artifact_verify` and `receiz_artifact_extract_verified` for input, require exact digest confirmation through `receiz_artifact_record_seal_plan`, execute with `receiz_artifact_record_seal_execute`, and finish with `receiz_artifact_round_trip_check`. MCP cannot read or rewrite another application namespace directly.

## Emulator fixture

Run current native artifact round-trip, destination reopen, namespace-preservation, and artifact-substitution rejection contracts. Historical obsolete-versioned reconcile fixtures are archival evidence only.

## v110 unified admission and recovery

Use `receiz.artifacts.admit(file)` to verify the complete artifact before classification. Verdicts are exactly `canonical-identity`, `bearer-recovery`, `verified-legacy-read`, `foreign-owner`, or `invalid`. Every verified result must report `canRestore`, `canSign`, `canClaimOwnership`, `canPublish`, and `canSettle` without inferring stronger authority from possession.

Use `receiz.artifacts.planRecovery(admission)` for an explicit read-only plan, or `receiz.artifacts.admitAndRecover(file)` for zero-network, read-only verification and recovery planning. Both perform zero writes. The standard proof history, parent links, ownership transitions, terminal events, unknown namespaces, plan digest, and explicit permitted actions must remain intact. Explanation is not authority; the underlying sealed proof object remains authority.

Commit only through `receiz.artifacts.commitRecovery(plan, capability, idempotencyKey, store)`. Raw capability authority is forbidden. MCP JSON must never carry a capability or store object; use runtime-resolved verified capability and a caller-provided local atomic store. The SDK/MCP/AI operation identity must match.

- Never admit a card-only payload as a Receiz artifact.
- Never treat an explanation as proof authority.
- Never accept raw capability JSON as recovery authority.
- Never hide mutation inside `admitAndRecover` or a recovery plan.

Current MCP parity: `receiz_artifact_admit`, `receiz_artifact_recovery_plan`, `receiz_artifact_admit_and_recover`, and `receiz_artifact_recovery_commit`.

Required completion evidence:

```md
Admission verdict:
Permitted actions:
Proof history digest:
Recovery plan digest:
Operation identity:
Atomic commit result:
```
