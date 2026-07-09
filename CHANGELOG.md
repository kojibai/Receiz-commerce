# Changelog

All notable changes to Receiz Commerce Kit will be documented here.

## 1.0.0 - General Availability

Receiz Commerce Kit is now the first official, production-shaped release of the proof-sealed commerce application and forkable `@receiz/sdk` kernel.

- Released the full Receiz Commerce Cloud product surface: mobile storefront, customer account, no-code merchant admin, products, pages, blog, rewards, assets, exchange, play loop, checkout, fulfillment, hosting, billing, domains, media, publish, tenant recovery, and launch readiness.
- Established the Receiz proof authority model across the app: Receiz ID, identity artifacts, verified proof objects, proof memory, signed public-store publish, app-state recovery, Kai coordinates, commerce events, settlement metadata, and webhook admission.
- Centralized the SDK contract behind `src/lib/receiz/adapter.ts`, covering identity, proof memory, verification, public proof, public-store/app-state, wallet, checkout, customers, merchants, commerce, rewards, media, domains, events, search, permissions, jobs, audit, risk, compliance, portability, notifications, releases, Twin, and World rails.
- Added a merchant launch path that supports Receiz ID create/continue/restore, local Identity Seal export, platform profile hydration, store-scoped customer sessions, free `*.receiz.app` hosting, custom-domain verification, wallet-first billing, and proof-authorized publish.
- Added wallet-first checkout with card fallback metadata, merchant settlement routing, order/customer/fulfillment projection, shipping completion, commerce webhook admission, and proof-memory projection back into admin and account surfaces.
- Added durable media handling for publish payloads, including inline image compression, Receiz media upload, media proof references, request-size protection, and cold-start-safe published image URLs.
- Introduced the AI operator layer: Receiz MCP diagnostics, Twin/World-assisted launch and content workflows, SDK doctor/capability checks, import normalization, proof-aware operator guidance, and the rule that AI may operate supported rails but never becomes proof authority.
- Added content and growth rails: Twin-assisted launch and content drafting, import paths for Shopify, WordPress, WooCommerce, Wix/generic HTML, CSV, and JSON, blog/page/product builders, and a playable 3D Receiz Wilds reward module.
- Added release operations: SDK doctor, capability checks, guarded Next runtime, tracked-file secret scan, release gate orchestration, CI, issue templates, security/support/contribution docs, and a public release playbook.

## 0.1.0 - Public Release Candidate

- Released a full working Receiz Commerce Cloud product surface: storefront, account, admin, checkout, rewards, assets, domains, publish, and launch readiness.
- Framed the repository as a forkable `@receiz/sdk` kernel for proof-sealed commerce, rewards, marketplaces, content commerce, games, and agent-operated SaaS.
- Documented SDK/MCP architecture, proof authority, Kai ordering, public-store publish, tenant recovery, and release gates.
- Added public repository hygiene: CI workflow, issue templates, PR template, support guide, code of conduct, security guide, changelog, release playbook, and secret scan.
