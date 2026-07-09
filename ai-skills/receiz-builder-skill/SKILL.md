---
name: receiz-builder-skill
description: Use when an agent must build or modify Receiz-native apps, storefronts, marketplaces, proof pages, pack apps, profile vaults, claim flows, QR entry flows, templates, or custom domain apps with the Receiz SDK.
---

# receiz-builder-skill

Build Receiz apps from proof objects, durable public projections, proof memory, identity primitives, and append-only sync. Do not downgrade Receiz into a CRUD app.

## When To Use This Skill

- Use for no-db storefronts, product pages, marketplaces, pack opening apps, profile vaults, proof pages, claim flows, QR entry flows, custom domains, subdomains, and template apps.
- Use when generating app code that imports `@receiz/sdk` or `@receiz/sdk/react`.
- Use when an AI must choose SDK rails for public store, app state, checkout, media, identity, wallet, sports, or offline queues.

## When Not To Use This Skill

- Do not use as the only verifier for an existing object. Use `receiz-proof-skill` first.
- Do not use to call MCP tools directly. Use `receiz-mcp-agent-skill`.
- Do not use to invent app backend tables when Receiz public store, app-state projection, proof memory, or signed publish already satisfies the behavior.

## Core Receiz Laws

- A generated Receiz app must not downgrade Receiz into a normal CRUD app.
- The app may use projections, caches, and UI state, but the proof object remains the authority.
- Generated apps should not require a traditional database unless the user explicitly asks for one.
- Never treat a database, server, marketplace, UI, model response, or cache as final authority.
- SDK is for building. MCP is for agent tool access. Skills are operating doctrine.
- If known verified truth exists, first-paint it and ask only for verified additions after the known head.

## Required Behavior

1. Identify the primitive the app carries: proof, identity, ownership, settlement, public proof, store, pack, profile, or offline verification.
2. Select SDK rails from [resources/sdk-quickstart.md](resources/sdk-quickstart.md).
3. First-paint public store/app-state/proof memory before background sync.
4. Use `publicStore.resolve` for cold storefront recovery.
5. Use `publicStore.publishWithIdentityProof` when merchant proof owns the publish boundary.
6. Use delegated writes only for agent/server tasks that need delegated permission.
7. Keep generated code rules from [resources/generated-code-rules.md](resources/generated-code-rules.md).

## Forbidden Behavior

- Do not make DB rows the canonical product, order, proof, receipt, card, profile, or ownership truth.
- Do not add a new verifier, issuer, token, signature, or registry before reusing implemented Receiz primitives.
- Do not block deterministic first paint on session lookup, DB refresh, global sync, or marketplace reconstruction when public proof truth is available.
- Do not call durable proof memory a cache.
- Do not hide verify links, source links, owner/custody state, or proof rows.

## MCP Usage Rules

MCP is optional for app building. Use it to inspect capabilities, required scopes, runtime blueprints, public store state, and templates when a live MCP host is available. Never hallucinate unavailable MCP tools. See `receiz-mcp-agent-skill` for tool execution and confirmation rules.

## SDK Usage Rules

Use `createReceizClient`, `publicStore.resolve`, `publicStore.publish`, `publicStore.publishWithIdentityProof`, `appState.resolve`, `appState.publish`, `proofMemory`, `identity.ensureTenantSession`, `commerce.oneClickCheckout`, `media.upload`, `wallet.publicLedger`, `sports.resolveCardMemory`, `offline.createQueue`, and React helpers from `@receiz/sdk/react` as needed. See [resources/sdk-quickstart.md](resources/sdk-quickstart.md).

## Output Format

For generated apps, end with:

```md
Primitive carried:
Source of truth:
SDK rails used:
MCP rails used:
First-paint plan:
Append/enrichment plan:
No-db boundary:
User confirmation needed:
Checks to run:
```

## Safety And Security Boundaries

Do not print tokens, passphrases, private keys, or private identity artifact contents. Do not execute settlement, transfer, publish, or public-state write actions without explicit user confirmation. Keep access tokens as delegated permissions beneath identity proof, not proof authority.

## Examples

- [Create storefront](examples/create-storefront.md)
- [Create marketplace](examples/create-marketplace.md)
- [Create proof page](examples/create-proof-page.md)
- [Create pack app](examples/create-pack-app.md)
- [Create profile vault](examples/create-profile-vault.md)

Resources:

- [SDK quickstart](resources/sdk-quickstart.md)
- [App patterns](resources/app-patterns.md)
- [No-db pattern](resources/no-db-pattern.md)
- [Proof-native UI patterns](resources/proof-native-ui-patterns.md)
- [Deployment checklist](resources/deployment-checklist.md)
- [Generated code rules](resources/generated-code-rules.md)
