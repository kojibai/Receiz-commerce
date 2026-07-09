---
name: receiz-proof-skill
description: Use when an agent must verify, inspect, explain, or report on Receiz proof objects, cards, packs, products, posts, receipts, vaults, profiles, marketplace listings, live sports objects, or offline proof artifacts.
---

# receiz-proof-skill

Receiz proof inspection starts from the artifact, manifest, proof bundle, verified append, or admitted local register. Do not start from a database row, marketplace card, UI state, or model memory.

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
3. Verify or validate using SDK validators, MCP read tools, local manifest inspection, or artifact verification.
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

Use MCP only when a live agent host has the Receiz MCP server available. Prefer read-only tools for verification. Use `receiz_verify_offline_file` for local JSON manifest payloads, `receiz_verify_asset` or `receiz_asset_by_url` for public proof URLs, `receiz_card_history` for Sports card memory, and `receiz_pitch_proof_by_witness_id` for pitch witnesses. If the MCP tool is unavailable, say what can be reasoned from available data and what still needs MCP or live verification. See [resources/mcp-tool-map.md](resources/mcp-tool-map.md).

## SDK Usage Rules

Use SDK validators and projectors for local proof objects: `assertReceizAssetManifest`, `assertReceizSportsCardManifest`, `assertReceizWebhookEvent`, `projectReceizAssetManifest`, `projectReceizSportsCardManifest`, `createReceizProofMemory`, and `receizProofMemoryAdditionsQuery`. Use `receiz.verification.verifyArtifact(file)` when artifact bytes need Receiz verification. See [resources/sdk-reference.md](resources/sdk-reference.md).

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
