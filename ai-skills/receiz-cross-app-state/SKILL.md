---
name: receiz-cross-app-state
description: Use when carrying verified namespaced account state between Receiz applications without a shared app database or identity fork.
---

# Receiz Cross-App State

Continue the same Receiz identity across applications by restoring portable account truth and appending isolated namespaces. Cross-app continuation is an identity primitive, not session sharing.

## Binding v113 artifact law

A Receiz artifact is the exact byte sequence returned by native Record -> Seal. The inner payload is never an acceptable substitute.

A verified proof object is not limited to the platform that created it. Any lawful platform may append authenticated ownership and history only while preserving the same immutable object identity, payload, provenance root, prior history, and unknown namespaces, then returning a complete verified proof object.

Label every byte sequence before cross-app use:

- `payload`: application bytes exposed separately only after the enclosing artifact verifies.
- `sealed artifact`: the indivisible SDK-issued Record -> Seal bytes carrying integrity, Signature V4, owner, claim, verify path, provenance, and payload binding.

## Required SDK artifact workflow

The exact v113 application-operation inventory is `receiz.artifact.verify`, `receiz.artifact.admit`, `receiz.artifact.append.plan`, `receiz.identity.capability.sign`, `receiz.artifact.transition.seal`, `receiz.artifact.transition.stage`, `receiz.artifact.transition.commit`, `receiz.admission.command.execute`, `receiz.public-proof.projection.locate`, `receiz.artifact.global.resolve`, and `receiz.artifact.offline.reconcile`. These identifiers describe the application authority matrix; they do not create authority.

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
2. Load the active canonical v113 registry and `ARTIFACT-001` through `ARTIFACT-030`.
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

- `receiz_artifact_verify`
- `receiz_artifact_admit`
- `receiz_artifact_append_plan`
- `receiz_artifact_transition_seal_and_stage`
- `receiz_artifact_transition_commit`
- `receiz_artifact_global_resolve`
- `receiz_artifact_reconcile_plan`
- `receiz_artifact_reconcile_stage`
- `receiz_artifact_reconcile_commit`

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

Call `receiz_artifact_verify`, obtain current profile membership through `receiz_artifact_admit`, create the zero-write plan with `receiz_artifact_append_plan`, seal and durably stage through `receiz_artifact_transition_seal_and_stage`, and finish with `receiz_artifact_transition_commit`. MCP cannot read or rewrite another application namespace directly, and every step remains beneath the SDK-custodied exact-byte authority chain.

## Emulator fixture

Run current native artifact round-trip, destination reopen, namespace-preservation, and artifact-substitution rejection contracts. Historical obsolete-versioned reconcile fixtures are archival evidence only.

## v113 unified admission and recovery

First call `verifyReceizArtifact(file)`. Then call `receiz.artifacts.admit(verification, profileOptions)` in the same runtime. Admission reports profile membership and primitive-specific assessments; it does not authorize an operation. Verified actor evidence exists only after identity-profile admission, never from a caller constraint or structural object.

Call `verifyReceizArtifact(file)`, then `receiz.artifacts.admit(verification, profileOptions)`, and pass the runtime-custodied admission, verified history, actor evidence, registry law, named commit domain, event, expected head, and idempotency identity to `planArtifactAppend`. Planning performs zero writes and preserves unknown namespaces byte-for-byte.

Seal and durably stage the plan-bound candidate before commit. Commit independently resolves and reverifies the staged bytes inside the named domain, then advances the head atomically. A receipt reports acceptance and cannot re-enter any authority-bearing API.

- Never admit a card-only payload as a Receiz artifact.
- Never treat an explanation as proof authority.
- Never accept raw capability JSON as recovery authority.
- Never hide mutation inside admission or append planning.

Current MCP parity is exactly `receiz_artifact_verify`, `receiz_artifact_admit`, `receiz_artifact_append_plan`, `receiz_artifact_transition_seal_and_stage`, `receiz_artifact_transition_commit`, `receiz_artifact_global_resolve`, `receiz_artifact_reconcile_plan`, `receiz_artifact_reconcile_stage`, and `receiz_artifact_reconcile_commit`. The first five are preserved as the historical v112 compatibility inventory, not as a second current inventory.

Required completion evidence:

```md
Admission verdict:
Permitted actions:
Proof history digest:
Recovery plan digest:
Operation identity:
Atomic commit result:
```

## v113 artifact-derived authority

Engineers remain free to build whatever they choose, but conforming Receiz receivers recognize authority only when every authority-bearing value is provably derived from independently verified artifact truth. Custom JavaScript objects, callbacks, normalized histories, local receipts, server rows, sessions, MCP memory, and AI explanations remain application data or inspection material; their shape never creates Receiz authority.

Admission begins from runtime-custodied verification of the exact enclosing artifact bytes under the complete frozen verifier context. Verified history and actor evidence remain same-runtime objects and fail closed on divergence or structural reconstruction. Identity Seal signing uses a locally held Ed25519 or P-256 key and emits a signed capability claim; only current verification of that claim against the exact plan produces capability authority.

Deterministic plan identity and unique execution-attempt identity are separate. MCP may reuse a confirmation digest only while the identical attempt is actively pending; committed and failed attempts are terminal and require a fresh confirmation. Expected authority failures are structured, immutable, machine-readable, and report zero writes.

Historical sealed proof objects remain exact-byte verifiable evidence. Historical runtime admissions, histories, actors, capabilities, plans, candidates, stores, or confirmations cannot authorize a current v113 receiver; exact bytes crossing a process require `reverify-exact-bytes`, followed by current profile admission and `same-runtime-custody` through plan, capability, seal, stage, independent byte resolution, atomic named-domain acceptance, and report-only receipt.
