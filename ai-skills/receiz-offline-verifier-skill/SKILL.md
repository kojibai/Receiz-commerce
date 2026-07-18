---
name: receiz-offline-verifier-skill
description: Use when an agent must verify, explain, debug, or build Receiz offline verification for local files, sealed artifacts, manifests, embedded proof, airplane-mode workflows, or artifact-over-server truth boundaries.
---

# receiz-offline-verifier-skill

Offline verification is a Receiz primitive. It verifies artifact truth without requiring the server, database, session, or marketplace to answer first.

## Binding v108 artifact law

A Receiz artifact is the exact byte sequence returned by native Record -> Seal. The inner payload is never an acceptable substitute.

A verified proof object is not limited to the platform that created it. Any lawful platform may append authenticated ownership and history only while preserving the same immutable object identity, payload, provenance root, prior history, and unknown namespaces, then returning a complete verified proof object.

Label every byte sequence before offline verification:

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
2. Load the active signed v108 registry and `ARTIFACT-001` through `ARTIFACT-010`.
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
```

## When To Use This Skill

- Use for local proof files, sealed artifacts, offline verifier flows, airplane-mode explanations, artifact-over-server questions, and verification failure debugging.
- Use when the user asks whether a Receiz object remains verifiable without network access.
- Use before building local verifier UI or offline proof diagnostics.

## When Not To Use This Skill

- Do not use to publish, transfer, sell, or append proof. Use `receiz-mcp-agent-skill` for writes.
- Do not use for commerce language unless paired with `receiz-commerce-skill`.
- Do not use to bypass access controls or expose private payloads.

## Core Receiz Laws

- Offline proof is not fallback mode. It is a proof primitive.
- Artifact truth outranks server, database, session, and UI state.
- Verify the enclosing artifact before trusting embedded subpayloads.
- A failed server lookup does not make sealed artifact truth false.
- Never treat a database, server, marketplace, UI, model response, or cache as final authority.
- If offline verification fails, report the exact failed boundary.
- Read [resources/offline-verification-law.md](resources/offline-verification-law.md) before explaining offline proof.

## Required Behavior

1. Identify artifact type and strongest available local proof.
2. Verify local bytes or manifest with SDK/MCP/local verifier mechanics.
3. Validate enclosing artifact before parsing embedded payloads.
4. Report pass, fail, or incomplete evidence with exact boundary.
5. Keep network checks as append or comparison, never as stronger truth than sealed proof.
6. Use [resources/verifier-flow.md](resources/verifier-flow.md) for the step order.

## Forbidden Behavior

- Do not call offline proof a fallback, cache, preview, or degraded mode.
- Do not require a server round trip before admitting known artifact truth.
- Do not trust an embedded subpayload when the enclosing artifact fails.
- Do not expose private identity, recovery, or sealed private payload contents.
- Do not claim failure globally when only a specific verifier boundary failed.

## MCP Usage Rules

Use `receiz_inspect_offline_file` for local JSON manifest shape inspection and `receiz_inspect_proof_object` or `receiz_asset_by_id` when public proof resolution is available. MCP inspection is not verification. Use SDK `artifacts.verifyAndOpen(file)` or the downloadable verifier for enclosing integrity, continuity, and separately returned verified payload. If MCP is unavailable, name the exact local SDK or file evidence still available.

## SDK Usage Rules

Use `receiz.artifacts.verifyAndOpen(file)` before giving `opened.verifiedPayload.bytes` to `assertReceizProofBundle`, `assertReceizAssetManifest`, `assertReceizSportsCardManifest`, `readReceizIdentityArtifact`, `verifyReceizIdentityLoginProof`, proof register helpers, proof memory helpers, or offline proof queue helpers. See [resources/artifact-over-server.md](resources/artifact-over-server.md).

## Output Format

Use this format:

```md
## Offline Verification
Artifact:
Primitive:
Verification mode:
Strongest source of truth:
Enclosing proof:
Embedded payload:
Result:
Failed boundary:
Network dependency:
Safe next action:
```

## Safety And Security Boundaries

Never print private keys, passphrases, bearer tokens, private identity artifact payloads, or recovery material. Do not upload private artifacts unless the user explicitly asks and the target verifier is trusted. Offline verification may inspect local proof, but private contents remain private.

## Examples

- [Verify offline asset](examples/verify-offline-asset.md)
- [Explain offline proof](examples/explain-offline-proof.md)
- [Debug verification failure](examples/debug-verification-failure.md)

Load resources as needed:

- [Offline verification law](resources/offline-verification-law.md)
- [Verifier flow](resources/verifier-flow.md)
- [Artifact over server](resources/artifact-over-server.md)
- [Airplane mode principle](resources/airplane-mode-principle.md)
- [Security boundaries](resources/security-boundaries.md)
