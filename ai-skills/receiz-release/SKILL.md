---
name: receiz-release
description: Use when qualifying, locking, packaging, attesting, or preparing publication of a coordinated Receiz release.
---

# receiz-release

Require package, registry, verifier, migration, conformance, security, performance, documentation, and attestation parity. Receiz is a proof-native artifact system; this skill operates beneath sealed proof and verified local history.

## Binding v111 artifact law

A Receiz artifact is the exact byte sequence returned by native Record -> Seal. The inner payload is never an acceptable substitute.

A verified proof object is not limited to the platform that created it. Any lawful platform may append authenticated ownership and history only while preserving the same immutable object identity, payload, provenance root, prior history, and unknown namespaces, then returning a complete verified proof object.

Label every release fixture byte sequence:

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

Independently hash the saved bytes and require equality with `sealedArtifact.artifactSha256`. Require `verification.ok`, `integrity.ok`, carrier `native-record-seal`, Signature V4, owner, claim, and verify-path agreement. Reopen the exact saved file with `verifyAndOpen`, then prove a different Receiz application preserves identity, cards, history, receipts, and unknown namespaces. Require SDK, MCP, and AI packages to report the same v111 registry digest and artifact-law version before release qualification.

## Twelve-step artifact workflow

1. Label the input bytes as `payload`; never call them an artifact.
2. Load the active signed v111 registry and `ARTIFACT-001` through `ARTIFACT-010`.
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

## v111 unified admission and recovery

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

## Constitutional workflow

1. Inspect the repository and installed SDK version.
2. Load the active signed registry and applicable constitutional laws.
3. Identify every authority boundary affected by the change.
4. Write the implementation contract before implementation.
5. Implement canonical changes only through SDK commands.
6. Add law, mutation, replay, and compatibility tests.
7. Run MCP conformance checks.
8. Require independent verifier evidence.
9. Refuse completion until the release lock passes.

Focused outcome: Require package, registry, verifier, migration, conformance, security, performance, documentation, and attestation parity.

## Machine contract

Read [manifest.json](manifest.json) before acting. Its package range, ruleset, active registry digest requirement, laws, allowed tools, forbidden operations, evidence, escalation conditions, and autonomous-authority ceiling are executable constraints. Use plan/permit/execute for any admitted command and obtain explicit confirmation for the exact permit digest. The skill and MCP context are never proof authority.

## Quick reference

| Boundary | Required result |
|---|---|
| Stronger truth | Sealed artifact and verified local history remain above SDK, MCP, server, DB, session, and UI projections. |
| Mutation | Canonical state changes only through an allowed SDK operation after enclosing-proof verification; ownership and history appends must be authenticated, append-only, and reverified without a receipt prerequisite. |
| Evidence | MCP output and agent assertions do not count; independent verification and release-lock evidence do. |
| Escalation | Stop on digest skew, authority bypass, missing capability, ambiguous migration, or absent independent evidence. |

## Common mistakes

- Treating a larger or newer server snapshot as permission to replace stronger admitted truth.
- Calling an MCP plan, simulation, hash, model response, or passing UI check verification.
- Appending ownership or history without enclosing-proof verification, authenticated authority, prior-history preservation, and output reverification.
- Marking the task complete while required evidence is missing.

## Completion refusal

Refuse completion when any manifest input, law, test, conformance result, independent-verifier result, or release-lock result is absent or failing. Never reduce the evidence list, change a test to bless a visible regression, invent authority, or accept “the AI said it is valid” as evidence.

## Example

Request: Require package, registry, verifier, migration, conformance, security, performance, documentation, and attestation parity.

Return a written implementation contract and read-only plan first. Execute only allowed commands after exact confirmation, then report registry digest, laws, authority, tests, independent evidence, release-lock status, and the exact remaining boundary.

## v111 artifact-derived authority

Engineers remain free to build whatever they choose, but conforming Receiz receivers recognize authority only when every authority-bearing value is provably derived from independently verified artifact truth. Custom JavaScript objects, callbacks, normalized histories, local receipts, server rows, sessions, MCP memory, and AI explanations remain application data or inspection material; their shape never creates Receiz authority.

Admission must retain and canonically reverify the exact enclosing artifact bytes under the complete frozen verifier context. Recovery-authoritative history requires explicit independently verified evidence roots and fails closed on divergent verified heads. Canonical identity and `canSign` require enclosing-owner binding, identity-owner binding, key identity, and a domain-separated private-key challenge. Recovery planning re-derives state from verified admission and verified history.

Deterministic plan identity and unique execution-attempt identity are separate. MCP may reuse a confirmation digest only while the identical attempt is actively pending; committed and failed attempts are terminal and require a fresh confirmation. Expected authority failures are structured, immutable, machine-readable, and report zero writes.

Historical sealed proof objects remain exact-byte verifiable evidence. Historical runtime admissions, histories, capabilities, plans, or confirmations cannot authorize a current v111 receiver; re-admit the historical artifact's exact bytes under the current verifier.
