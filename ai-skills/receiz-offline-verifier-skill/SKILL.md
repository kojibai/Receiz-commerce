---
name: receiz-offline-verifier-skill
description: Use when an agent must verify, explain, debug, or build Receiz offline verification for local files, sealed artifacts, manifests, embedded proof, airplane-mode workflows, or artifact-over-server truth boundaries.
---

# receiz-offline-verifier-skill

Offline verification is a Receiz primitive. It verifies artifact truth without requiring the server, database, session, or marketplace to answer first.

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

Use `receiz_verify_offline_file` for local JSON manifest payloads and `receiz_verify_asset`, `receiz_inspect_proof_object`, or `receiz_asset_by_id` when public proof resolution is available. Treat MCP as a verification tool, not as proof authority. If MCP is unavailable, name the exact local SDK or file evidence still available.

## SDK Usage Rules

Use `receiz.verification.verifyArtifact(file)`, `assertReceizProofBundle`, `assertReceizAssetManifest`, `assertReceizSportsCardManifest`, `readReceizIdentityArtifact`, `verifyReceizIdentityLoginProof`, proof register helpers, proof memory helpers, and offline proof queue helpers. See [resources/artifact-over-server.md](resources/artifact-over-server.md).

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
