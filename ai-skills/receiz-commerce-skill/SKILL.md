---
name: receiz-commerce-skill
description: Use when an agent must create, explain, inspect, or verify Receiz commerce surfaces, product proof objects, storefronts, no-database stores, checkout boundaries, buyer/seller language, product ownership, or receipt proof.
---

# receiz-commerce-skill

Receiz commerce is proof-native commerce. A product page, storefront, order view, receipt, certificate, note, or resale route must preserve product proof, ownership state, settlement state, and public proof surfaces.

## When To Use This Skill

- Use for product proof pages, storefronts, marketplace listings, checkout explanations, buyer/seller copy, no-database stores, receipt proof, and ownership verification.
- Use when an agent is asked to build a commerce app with the Receiz SDK or MCP tools.
- Use before writing purchase, transfer, certificate, note, receipt, or seller-facing language.

## When Not To Use This Skill

- Do not use this as the only verifier for a raw artifact. Use `receiz-proof-skill` first when the object itself has not been verified.
- Do not use this for sports card memory rules. Use `receiz-sports-card-skill` for live-event card logic.
- Do not use this to execute checkout, transfer, or settlement actions without `receiz-mcp-agent-skill` confirmation rules.

## Core Receiz Laws

- Commerce objects are proof objects with product, ownership, provenance, media, and settlement boundaries.
- A storefront projection is weaker than the product proof object it presents.
- A buyer receives a proof-bearing object or receipt boundary, not a generic order row.
- A seller presents ownership, custody, and transfer conditions directly.
- Never treat a database, server, marketplace, UI, model response, or cache as final authority.
- Settlement language must distinguish purchase route, funded event, certificate value, note value, reserve state, and display price.
- Read [resources/commerce-object-model.md](resources/commerce-object-model.md) before generating commerce behavior.

## Required Behavior

1. Name the product primitive: proof object, ownership surface, settlement primitive, public proof surface, certificate, note, receipt, or storefront projection.
2. Verify the product object or public proof URL before making ownership or provenance claims.
3. Separate product proof from checkout mechanics and receipt projection.
4. Use no-database patterns only when artifact truth and SDK/MCP rails remain the source of truth.
5. Use buyer and seller language from [resources/seller-buyer-language.md](resources/seller-buyer-language.md).
6. Preserve explicit confirmation before checkout, transfer, certificate, note, or receipt append actions.

## Forbidden Behavior

- Do not call a product proof object merely a listing, card, catalog item, SKU, or content record.
- Do not treat checkout completion as stronger than sealed artifact truth or verified receipt proof.
- Do not invent ownership, price, seller authority, buyer custody, or transfer status.
- Do not build a storefront that requires a database before showing known verified product truth.
- Do not imply that marketplace visibility proves ownership.

## MCP Usage Rules

Use MCP read tools to resolve and inspect product proof first: `receiz_asset_by_url`, `receiz_asset_by_id`, `receiz_inspect_proof_object`, and `receiz_public_store_resolve`. Resolution and inspection are not verification. Use SDK `verification.verifyArtifact(file)` for the integrity-and-continuity verdict. Use `receiz_public_store_publish`, `receiz_sandbox_seed_store`, or `receiz_sandbox_checkout` only when the user explicitly asks for a write or sandbox action and confirms the exact inputs. See [resources/product-proof-flow.md](resources/product-proof-flow.md).

## SDK Usage Rules

Use `createReceizClient` and the commerce, public store, verification, app state, payments, and connect rails. Prefer `receiz.publicStore.resolve`, `receiz.publicStore.publish`, `receiz.verification.verifyArtifact`, `receiz.connect.checkout`, `receiz.connect.checkoutSession`, `receiz.commerce`, `receiz.payments`, `assertReceizAssetManifest`, and `projectReceizAssetManifest` as documented in [resources/storefront-patterns.md](resources/storefront-patterns.md).

## Output Format

Use this structure for commerce answers:

```md
## Commerce Proof Surface
Object:
Commerce primitive:
Source of truth:
Product proof:
Ownership / custody:
Seller claim:
Buyer action:
Settlement boundary:
Receipt or certificate boundary:
What is proven:
What is not proven:
Safe next action:
```

## Safety And Security Boundaries

Checkout, transfer, certificate issue, note issue, receipt append, seller onboarding, payment, and refund actions are value-affecting. They require explicit confirmation, scoped delegated access, and the existing Receiz rail. Never print bearer tokens, payment credentials, private keys, private identity files, or hidden recovery material.

## Examples

- [Create product page](examples/create-product-page.md)
- [Create no-database store](examples/create-no-db-store.md)
- [Verify product ownership](examples/verify-product-ownership.md)
- [Explain Receiz commerce](examples/explain-receiz-commerce.md)

Load resources as needed:

- [Commerce object model](resources/commerce-object-model.md)
- [Product proof flow](resources/product-proof-flow.md)
- [Storefront patterns](resources/storefront-patterns.md)
- [Order and receipt boundaries](resources/order-and-receipt-boundaries.md)
- [Seller buyer language](resources/seller-buyer-language.md)
- [Conversion copy patterns](resources/conversion-copy-patterns.md)
