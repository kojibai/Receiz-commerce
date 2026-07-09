---
name: receiz-distribution-skill
description: Use when an agent must create, explain, or operate Receiz QR activation, Pack Derby, venue activation, restaurant or bar playbooks, affiliate boundaries, staff scripts, conversion language, or physical-to-proof distribution.
---

# receiz-distribution-skill

Receiz distribution turns physical attention into proof-native activation. QR codes, venue posters, Pack Derby, affiliate routes, and staff scripts must preserve proof identity, consent, settlement boundaries, and public proof surfaces.

## When To Use This Skill

- Use for bar flyers, restaurant activation, venue one-pagers, Pack Derby explanation, QR activation, affiliate copy, staff scripts, and conversion language.
- Use when distribution copy must explain proof objects to buyers, collectors, venues, or staff.
- Use before creating physical activation materials tied to Receiz proof or sports cards.

## When Not To Use This Skill

- Do not use to verify a specific object. Use `receiz-proof-skill` or `receiz-offline-verifier-skill`.
- Do not use to execute writes, checkout, transfers, or pack opens without `receiz-mcp-agent-skill`.
- Do not use to claim venue partnership, official league status, or affiliate terms unless proof or user-supplied terms establish them.

## Core Receiz Laws

- QR activation points to proof-native rails; the QR itself is not the proof authority.
- Pack Derby and venue surfaces must preserve card proof, pack proof, event proof, and settlement boundaries.
- Staff language must not invent ownership, value, rarity, or official endorsement.
- Conversion copy must invite inspection, not hide proof.
- Never treat a database, server, marketplace, UI, model response, or cache as final authority.
- Affiliate and venue routes are distribution mechanics beneath proof truth.
- Read [resources/qr-activation-flow.md](resources/qr-activation-flow.md) before creating activation copy.

## Required Behavior

1. Name the activation primitive: public proof surface, QR activation, Pack Derby, venue route, affiliate route, proof object, or settlement route.
2. Identify what the QR or physical material opens.
3. Separate promotional copy from verified proof claims.
4. Include staff-safe language and buyer-safe action.
5. Require confirmation for pack open, purchase, transfer, settlement, or publish actions.
6. Use [resources/conversion-language.md](resources/conversion-language.md) for public copy.

## Forbidden Behavior

- Do not imply the QR code itself proves ownership, rarity, or value.
- Do not call a Pack Derby result verified without proof or event append.
- Do not invent venue partnership, prize terms, buyer eligibility, affiliate rates, or official sports status.
- Do not bury proof inspection behind hype copy.
- Do not use distribution mechanics as source of truth.

## MCP Usage Rules

Use `receiz_marketplace_template_generate`, `receiz_pack_open_preview`, `receiz_asset_by_url`, `receiz_inspect_proof_object`, `receiz_public_store_resolve`, and sandbox tools when planning activation. Write actions, pack opens, checkout, public store publishing, or affiliate changes require explicit confirmation and scoped delegated access.

## SDK Usage Rules

Use SDK public proof, public store, app state, connect checkout, sports, sandbox, verification, and proof memory rails. Use `createReceizClient`, `receiz.publicStore.resolve`, `receiz.verification.verifyArtifact`, `receiz.sports.resolveCardMemory`, `receiz.connect.checkout`, and sandbox helpers only within the proof boundaries described in [resources/venue-playbook.md](resources/venue-playbook.md).

## Output Format

Use this structure:

```md
## Distribution Plan
Activation:
Primitive:
Audience:
Proof target:
QR destination:
Venue or affiliate boundary:
Staff script:
Buyer action:
Value-affecting actions:
What is proven:
What is promotional:
```

## Safety And Security Boundaries

Do not print credentials, bearer tokens, private keys, private identity payloads, venue private terms, or buyer private data. Purchases, pack opens, transfers, settlement, and affiliate changes require explicit confirmation and exact target identity.

## Examples

- [Create bar flyer copy](examples/create-bar-flyer-copy.md)
- [Create venue one pager](examples/create-venue-one-pager.md)
- [Explain Pack Derby](examples/explain-pack-derby.md)
- [Create restaurant activation](examples/create-restaurant-activation.md)

Load resources as needed:

- [QR activation flow](resources/qr-activation-flow.md)
- [Pack Derby model](resources/pack-derby-model.md)
- [Venue playbook](resources/venue-playbook.md)
- [Affiliate boundaries](resources/affiliate-boundaries.md)
- [Staff training script](resources/staff-training-script.md)
- [Conversion language](resources/conversion-language.md)
