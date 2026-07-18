---
name: receiz-app-builder-skill
description: Use when starting, integrating, upgrading, diagnosing, or repairing a TypeScript or Next.js repository that uses Receiz application contracts, SDK compiler commands, generated files, or MCP app tools.
---

# receiz-app-builder-skill

Build and upgrade Receiz applications from one typed contract. The compiler is
integration tooling beneath Receiz proof truth; inspection is not verification.

## Binding v108 artifact law

A Receiz artifact is the exact byte sequence returned by native Record -> Seal. The inner payload is never an acceptable substitute.

A verified proof object is not limited to the platform that created it. Any lawful platform may append authenticated ownership and history only while preserving the same immutable object identity, payload, provenance root, prior history, and unknown namespaces, then returning a complete verified proof object.

Label every byte sequence generated or consumed by the application:

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

- Use for `defineReceizApp`, `receiz.app.contract.v1`, or `receiz app` commands.
- Use when adding Receiz to an existing repository or changing feature rails.
- Use for deterministic integration plans, generated-file repair, and upgrades.
- Use before calling Receiz MCP application compiler tools.

## When Not To Use This Skill

- Do not use repository inspection to verify an artifact.
- Do not use it to invent proof objects, owners, continuity, or settlement.
- Do not bypass `receiz-proof-skill` for byte-bearing artifact verification.

## Core Receiz Laws

- Never treat a database, server, marketplace, UI, model response, or cache as final authority.
- The sealed proof object remains stronger than SDK, compiler, MCP, AI, and repository state.
- Proof-object creation uses authenticated native Record before Seal.
- Existing witnessed history is never rewritten; append missing truth and rebuild incorrect projections.
- MCP inspection is not verification and MCP never becomes proof authority.

## Required Behavior

Select the package boundary first: universal runtime from `@receiz/sdk`, React bindings from `@receiz/sdk/react`, Node-only app compiler APIs from `@receiz/sdk/compiler`, and sandbox/conformance support from `@receiz/sdk/testing`.

1. Inspect the explicit repository root with `receiz_project_inspect` or `receiz app inspect`.
2. Identify intended features and create or update the contract with `defineReceizApp` or `receiz_app_contract_create`.
3. Compile a read-only plan with `compileReceizAppContract`, `receiz_app_plan`, or `receiz app plan`.
4. Explain scopes, authority boundaries, findings, and every proposed file.
5. Obtain explicit confirmation for the exact preview digest before mutation.
6. Apply the smallest safe change set with `receiz_app_apply` or `receiz app apply`.
7. Run generated conformance, `receiz conformance`, and repository tests.
8. Reinspect with `receiz_app_check` and report exact evidence.
9. Use `receiz_app_upgrade` for version-aware upgrades and `receiz_app_explain` for findings.
10. Report remaining manual work and blocked authority without claiming completion.

Read [resources/workflow.md](resources/workflow.md) for new, existing, feature-change,
upgrade, diagnosis, and repair routes.

## Forbidden Behavior

- Never invent APIs, tools, scopes, proof IDs, owners, settlement, verification results, authorization, or completed file changes.
- Never write outside the explicit repository root or follow a symlink outside it.
- Never overwrite unmarked application code.
- Never put tokens, keys, identity artifacts, webhook secrets, or recovery material in code, plans, fixtures, logs, or MCP output.
- Never add a traditional database as proof authority.
- Never claim a plan, inspection, hash, MCP lookup, or successful compile verified a proof object.

## MCP Usage Rules

Use the documented tools listed in
[resources/workflow.md](resources/workflow.md). Inspection, contract proposals,
planning, checking, upgrade planning, and explanation are read-only.
`receiz_app_apply` returns a preview first and requires the exact digest as
explicit confirmation. Every response must retain the MCP authority boundary.
Use `receiz_app_repair` for confirmed deterministic repair, `receiz_scope_explain` for canonical scopes, `receiz_release_qualify` for read-only release evidence, `receiz_proof_trace` only with canonical artifact bytes for a verdict, and `receiz_webhook_replay` only after signature verification and exact confirmation.

## SDK Usage Rules

Import `defineReceizApp`, `validateReceizAppContract`,
`compileReceizAppContract`, `inspectReceizProject`,
`planReceizIntegration`, `checkReceizIntegration`, `planReceizUpgrade`, and
`explainReceizIntegrationFinding` from `@receiz/sdk/compiler`. Artifact verification remains
`artifacts.verifyAndOpen`; creation and download remain `assets.createProofObject`
and `artifacts.download` on the SDK's authenticated native Record-before-Seal rail.

## Output Format

```md
Contract:
Repository evidence:
Features and scopes:
Authority boundary:
Read-only findings:
Proposed files:
Preview digest:
Confirmation status:
Checks run:
Remaining manual work:
What is proven:
What is not proven:
```

## Safety And Security Boundaries

Read [resources/authority-boundaries.md](resources/authority-boundaries.md).
Stop when a required delegated permission, identity proof, capability, or user
decision is unavailable. Report the blocked boundary; do not fabricate it.
Generated browser code may contain public origins but never server credentials.
`receiz.extensions.ts` is developer-owned and create-once; regeneration must never overwrite it. Emulator evidence is `sandboxVerified`, never a production verified verdict.

## Examples

- [Commerce](examples/commerce.md)
- [Marketplace](examples/marketplace.md)
- [Persistent world](examples/persistent-world.md)
- [AI-operated application](examples/ai-operated.md)
- [Profile or portfolio](examples/profile-portfolio.md)
- [Content publishing](examples/content-publishing.md)
- [Proof verifier](examples/proof-verifier.md)
- [Minimal proof object](examples/minimal-proof-object.md)

Resources:

- [Workflow](resources/workflow.md)
- [Authority boundaries](resources/authority-boundaries.md)
- [Generated-file repair](resources/generated-file-repair.md)
- [Upgrade rules](resources/upgrade-rules.md)
