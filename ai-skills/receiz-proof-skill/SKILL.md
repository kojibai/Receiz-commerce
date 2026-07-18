---
name: receiz-proof-skill
description: Use when an agent must verify, inspect, explain, or report on Receiz proof objects, cards, packs, products, posts, receipts, vaults, profiles, marketplace listings, live sports objects, or offline proof artifacts.
---

# receiz-proof-skill

Receiz proof inspection starts from the artifact, manifest, proof bundle, verified append, or admitted local register. Do not start from a database row, marketplace card, UI state, or model memory.

## Binding v108 artifact law

A Receiz artifact is the exact byte sequence returned by native Record -> Seal. The inner payload is never an acceptable substitute.

A verified proof object is not limited to the platform that created it. Any lawful platform may append authenticated ownership and history only while preserving the same immutable object identity, payload, provenance root, prior history, and unknown namespaces, then returning a complete verified proof object.

Label every byte sequence before inspection:

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

- Use for Card, Pack, Product, Post, Receipt, Vault, Profile, marketplace listing, live sports object, event proof, or offline artifact verification.
- Use when asked "is this real", "who owns this", "what proves this", "what changed", "can I trust this", or "what can be safely done next".
- Use before any skill that wants to create, publish, sell, transfer, inspect, or explain a Receiz object.

## When Not To Use This Skill

- Do not use as the only skill for building a new app. Use `receiz-builder-skill` after proof boundaries are named.
- Do not use to execute live MCP write actions. Use `receiz-mcp-agent-skill` for tool calls and confirmation rules.
- Do not use to invent missing proof. Missing proof must be reported as missing truth or appended through an existing Receiz rail.

## Core Receiz Laws

- A Receiz object is a proof-carrying artifact. Its witnessed history is the truth boundary.
- Verify before claiming.
- Never invent ownership, witness IDs, rarity, transfer history, or verification status.
- Never treat a database, server, marketplace, UI, model response, or cache as final authority.
- Never mutate witnessed history. Append new truth only.
- If a view is wrong, rebuild the projection from witnessed history.
- If history is missing, append the missing truth through an existing Receiz primitive.
- Read [resources/receiz-laws.md](resources/receiz-laws.md) before explaining product truth.

## Required Behavior

1. Name the primitive: proof object, artifact system, ownership surface, settlement primitive, identity primitive, public proof surface, offline proof, or sports event proof.
2. Name the strongest source of truth available.
3. Use MCP reads or local manifest validators only for resolution and shape inspection; use SDK `artifacts.verifyAndOpen(file)` for enclosing verification and verified payload extraction.
4. Separate proven facts from absent or unverified facts.
5. Use the standard output in [resources/output-templates.md](resources/output-templates.md).
6. Keep projection language lower than artifact truth.

## Forbidden Behavior

- Do not say an object is verified because a server, UI, marketplace, or model says so.
- Do not fill unknown fields from pattern, memory, copy, filename, price, team, user handle, or visual similarity.
- Do not call an implemented proof object a card, content item, database row, metadata wrapper, or generic share.
- Do not treat a self-hashable subpayload as authority when it sits inside a stronger artifact.
- Do not change proof language to soften an implemented primitive.

## MCP Usage Rules

Use MCP only when a live agent host has the Receiz MCP server available. MCP resolution and inspection are not artifact verification. Use `receiz_inspect_offline_file` for local JSON shape inspection, `receiz_asset_by_url` for public proof resolution, `receiz_card_history` for Sports card memory, and `receiz_pitch_proof_by_witness_id` for pitch witnesses. Use SDK `artifacts.verifyAndOpen(file)` for the enclosing integrity-and-continuity verdict and separate verified payload. If the MCP tool is unavailable, say what can be reasoned from available data and what still needs SDK verification. See [resources/mcp-tool-map.md](resources/mcp-tool-map.md).

## SDK Usage Rules

Use SDK validators and projectors only on verified payload bytes: `assertReceizAssetManifest`, `assertReceizSportsCardManifest`, `assertReceizWebhookEvent`, `projectReceizAssetManifest`, `projectReceizSportsCardManifest`, `createReceizProofMemory`, and `receizProofMemoryAdditionsQuery`. Use `receiz.artifacts.verifyAndOpen(file)` before extraction. See [resources/sdk-reference.md](resources/sdk-reference.md).

## Output Format

Use the verified object format exactly:

```md
## Verified Object
Object:
Status:
Identity:
Current controller / owner:
Proof present:
Witness history:
Provenance:
Media:
Transfer state:
What is proven:
What is not proven:
Safe next action:
```

## Safety And Security Boundaries

Read-only verification is safe when it does not expose private payloads. Writes, transfers, settlement actions, publishing, or proof appends require explicit user confirmation and an existing Receiz write rail. Never request or print private keys, bearer tokens, passphrases, private proof material, or hidden recovery payloads.

## Examples

- [Verify card](examples/verify-card.md)
- [Verify product](examples/verify-product.md)
- [Verify post](examples/verify-post.md)
- [Verify pack](examples/verify-pack.md)
- [Verify vault](examples/verify-vault.md)

Load resources as needed:

- [Receiz laws](resources/receiz-laws.md)
- [Proof object model](resources/proof-object-model.md)
- [Verification flow](resources/verification-flow.md)
- [Output templates](resources/output-templates.md)
- [Failure modes](resources/failure-modes.md)
- [MCP tool map](resources/mcp-tool-map.md)
- [SDK reference](resources/sdk-reference.md)
