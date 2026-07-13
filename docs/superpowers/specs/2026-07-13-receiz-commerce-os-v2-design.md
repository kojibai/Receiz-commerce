# Receiz Commerce OS 2.0 Design

**Date:** 2026-07-13  
**Status:** Proposed for implementation  
**Release:** `2.0.0`  
**SDK target:** `@receiz/sdk@99.0.0`  
**MCP target:** `@receiz/mcp-server@99.0.0`

## Product decision

Receiz Commerce OS 2.0 is the complete proof-native commerce operating system for independent operators, creators, small teams, growing brands, service businesses, retailers, restaurants, and practical multi-location organizations. The hosted product is optimized for organizations from one operator through roughly 100 staff.

The repository remains an enterprise-grade, forkable kernel. Enterprise buyers can fork the application, replace or extend adapters, add internal policies, and operate their own deployment. Version 2 does not add enterprise procurement complexity to the hosted product. SAML/SCIM administration, negotiated billing, custom SLA consoles, legal holds, and deeply nested corporate hierarchies are outside this release.

The promise is:

> Launch simply, run seriously, grow without replatforming, and fork the proof-native stack when complete control becomes necessary.

Version 3 may expand the proven platform into a horizontal business OS. Version 2 remains focused on the merchant revenue lifecycle.

## Experience principles

1. **Simple by default, deep on demand.** New merchants see the minimum path to first revenue. Advanced operations appear when the business enables them or reaches the relevant state.
2. **One commercial truth.** Products, inventory, orders, payments, ownership, rewards, exchange events, and audit history resolve from durable Receiz proof and settlement rails. Browser state is only a projection.
3. **No fake live data.** A value labeled live must have a timestamp, source, freshness state, and recovery path. Seeded or simulated values are labeled demo data and cannot appear in production mode.
4. **AI operates; proof authorizes.** AI can explain, draft, reconcile, and execute within explicit scopes. It cannot invent authority, settlement, ownership, or compliance truth.
5. **A growing business never migrates products.** Capabilities, locations, roles, and automation expand inside the same workspace and proof history.
6. **Forkability is a feature.** Stable adapters, schemas, events, fixtures, diagnostics, and extension contracts are part of the product.

## Current baseline audit

The baseline was evaluated from repository inspection, fresh desktop/mobile screenshots, live interaction, and release commands on 2026-07-13.

| Scale | Current grade | Evidence | A+ requirement |
| --- | --- | --- | --- |
| Product differentiation | A- | Proof-native identity, ownership, rewards, publishing, offline tools, SDK and MCP form a distinctive foundation. | Make proof visibly useful in every core merchant workflow and remove demo-only claims. |
| Merchant time-to-value | B | Twin launch, import, seed data, readiness, and publishing are strong. The first screen still asks users to understand too much. | A role-aware setup that reaches a published, payable offer in under ten minutes with resumable progress. |
| Information architecture | C+ | Desktop storefront/admin surfaces expose storefront, operations, exchange, play, proof, and developer concepts together. | Task-based navigation, progressive capability activation, command search, and role-specific home views. |
| Visual polish | B+ | Mobile storefront and admin are cohesive and responsive. Dense desktop screens and repeated card treatment weaken hierarchy. | Clear density system, stronger visual rhythm, consistent empty/loading/error states, and screenshot-level QA across breakpoints. |
| Mobile experience | A- | Mobile storefront and launch console are purpose-built rather than collapsed desktop layouts. | Complete every revenue and recovery workflow on touch devices with 44px targets and no hidden critical data. |
| Accessibility | B- provisional | Semantic headings, labeled inputs, named navigation, and button roles are present. Full keyboard, screen-reader, contrast, zoom, and motion testing is not yet complete. | WCAG 2.2 AA automated and manual gates, visible focus, live-region state changes, reflow at 400% zoom, and reduced motion. |
| Core commerce breadth | B- | Catalog, checkout, orders, customers, content, rewards, hosting, domains, imports, and proof projection exist. Several serious operating workflows are templated or shallow. | Variants, inventory ledger, fulfillment, returns/refunds, subscriptions, tax, discounts, gift cards, customer segments, marketing, and operational reporting work end to end. |
| Exchange integrity | D | Proof-object upload works, but pricing, order books, trades, liquidity, ownership, and wallet balances are local deterministic projections. | Durable verified listings, real wallet/card settlement, persistent orders/trades/ownership, sourced valuation, recovery, and reconciliation. |
| State durability | C+ | Published store state has proof-backed recovery, while platform drafts rely heavily on browser storage. Theme save is not global publish. | Versioned server-side drafts, optimistic concurrency, autosave state, cross-tab sync, durable global theme publishing, and recovery diagnostics. |
| SDK architecture | A- | Receiz calls are concentrated behind a typed adapter and doctor reports all requested rails available. | Upgrade to 99.0.0, add compatibility tests, expose exchange/state capabilities, and pin the supported SDK/MCP pair. |
| MCP and AI operations | B | Skills, MCP guidance, Twin launch, doctor, and operator language exist. Most merchant operations are not yet safe agent workflows. | Typed tools, dry-run plans, confirmations, idempotency, permission checks, audit receipts, undo/compensation, and operator evaluation suites. |
| Security baseline | B | Secret scan passes; OAuth state and proof authority tests are strong. The dependency audit reports one moderate PostCSS advisory. This is not an exhaustive security scan. | Zero known high/moderate production advisories, repository threat model, exhaustive scan, tenant authorization matrix, abuse tests, CSP, rate limits, webhook replay protection, and incident runbooks. |
| Reliability and recovery | B | Idempotency, proof memory, public-state recovery, guarded release checks, and webhook normalization are substantial. | Durable jobs, dead-letter recovery, settlement reconciliation, SLOs, tracing, backups, chaos tests, and explicit partial-failure UX. |
| Performance | B- provisional | The app is responsive locally, but desktop ships very dense surfaces and 3D modules. A production Lighthouse/RUM baseline has not been completed. | Route budgets, dynamic heavy-module loading, Core Web Vitals budgets, real-user monitoring, and 95th-percentile API targets. |
| Developer experience | A- | Documentation, fixtures, tests, doctor, rails map, offline tools, and release guard are unusually strong. | 99.0.0 migration guide, extension examples, generated API contracts, enterprise fork guide, and one-command conformance environment. |
| Enterprise forkability | B+ | Adapter boundaries, proof schemas, docs, and public repository structure are strong. Some major modules are monolithic. | Stable extension contracts, modular state domains, migration/version policy, reference deployment architecture, and customization tests. |
| Test and release discipline | A- | 181 tests pass; typecheck, lint, secret scan, and doctor pass. | Add browser E2E, accessibility, visual regression, contract, load, security, recovery, and live sandbox settlement gates. |

### Fresh verification results

- `pnpm test`: 181 passed, 0 failed.
- `pnpm typecheck`: passed.
- `pnpm lint`: passed.
- `pnpm secret:scan`: passed across 329 tracked files.
- `pnpm receiz:doctor`: `ok: true`, no missing rails, no warnings.
- `pnpm audit --prod`: one moderate advisory, `postcss <8.5.10` through Next.js.
- Latest registry releases: `@receiz/sdk@99.0.0` and `@receiz/mcp-server@99.0.0`.

## Version 2 product architecture

### 1. Adaptive merchant workspace

The workspace begins with five stable jobs:

- Home: today, blockers, money movement, and recommended actions.
- Sell: catalog, offers, channels, inventory, and storefront.
- Operate: orders, fulfillment, returns, subscriptions, and locations.
- Grow: customers, segments, rewards, campaigns, content, and analytics.
- Money: wallet, payments, payouts, taxes, disputes, and Exchange.

Settings contains brand, team, permissions, domains, integrations, developer tools, and portability. Proof details remain available contextually and in an audit explorer; they do not compete with the merchant's primary job.

Setup records business model, sales channels, fulfillment model, team size, locations, and goals. This determines initial navigation and checklist content. Capabilities are reversible configuration, not separate products or forks.

Roles include owner, administrator, operator, fulfillment, finance, marketer, support, and developer. Every privileged action is checked on the server and recorded with actor, tenant, source, request id, and proof/settlement result.

### 2. Durable workspace state

Browser storage becomes an offline cache, never the only home of merchant configuration.

Each tenant has:

- a versioned private draft record;
- an immutable published storefront head;
- append-only operational events;
- an optimistic version/ETag;
- timestamps and actor identity;
- schema and migration version;
- last successful sync and recoverable pending mutations.

Edits update local UI immediately and enqueue an idempotent server mutation. The UI shows `Saving`, `Saved`, `Offline`, `Conflict`, or `Publish required`. Conflicts compare versions and offer an explicit merge or reload path. Cross-tab state uses a storage event or `BroadcastChannel` invalidation, followed by authoritative revalidation.

### 3. Global brand and theme behavior

The current `Save theme` action only marks a local checklist event. In version 2:

1. Every brand control updates a draft preview instantly.
2. Autosave persists the complete normalized `BrandConfig` to the private tenant draft.
3. `Save theme` is removed or renamed `Save draft`; it cannot imply public visibility.
4. `Publish theme` writes a signed published-state revision and invalidates all storefront projections.
5. The response returns the authoritative brand, revision, published timestamp, proof head, and affected hosts.
6. Public storefronts revalidate by tenant and host, including custom domains.
7. Reload, another browser tab, another device, subdomain, and custom domain all resolve the same published palette.
8. Invalid colors, unreadable contrast pairs, and unsupported fonts are rejected before publish with actionable fixes.

The theme is applied at the app-shell root so dialogs, overlays, account, checkout, admin preview, storefront routes, and generated metadata share the same tokens.

### 4. Serious commerce operations

Version 2 completes the merchant lifecycle:

- Products: variants, options, SKUs, bundles, digital delivery, services, access, subscriptions, media, SEO, costs, and proof policy.
- Inventory: location balances, reservations, adjustments, transfers, low-stock rules, backorders, and append-only inventory events.
- Orders: payment, fraud/risk state, fulfillment, shipment tracking, pickup, cancellation, returns, exchanges, refunds, notes, and customer communication.
- Customers: unified identity, addresses, consent, segments, lifetime value, activity, rewards, support history, and portable proof.
- Pricing: discounts, automatic promotions, gift cards, credits, taxes, shipping rules, subscriptions, trials, and proration.
- Money: wallet, card delta, payouts, fees, refunds, disputes, settlement reconciliation, and exportable books.
- Growth: content, email/notification campaigns, abandoned checkout, loyalty, referrals, cohorts, attribution, and experiments.
- Analytics: revenue, margin, conversion, retention, inventory, fulfillment, rewards, channel, and location views with source/freshness metadata.
- Operations: locations, staff roles, approvals, webhooks, integrations, imports, exports, audit, recovery, and incident state.

### 5. Real Receiz Exchange

The Exchange becomes a durable market for eligible Receiz proof objects.

#### Asset ingestion

Users can add an asset by file upload, URL, wallet selection, proof id, or MCP action. The ingestion service:

1. parses the artifact locally when possible;
2. verifies its signature, hash, proof chain, schema, owner, custody, revocation state, and latest known head through the SDK;
3. resolves the canonical proof object and manifest;
4. applies tenant and market eligibility policy;
5. checks that the actor can list or fractionalize it;
6. stores only verified canonical fields plus the source receipt;
7. rejects unverifiable, revoked, duplicated, unsupported, or unauthorized objects.

Products may create proof objects before listing, but a product id alone can never masquerade as a verified Exchange asset.

#### Value and price truth

The UI distinguishes:

- **Reference value:** owner appraisal, signed third-party appraisal, oracle input, or another named source with timestamp and confidence.
- **Listing price:** the seller's signed ask.
- **Market price:** the most recent settled trade.
- **Indicative price:** current best bid/ask midpoint when no recent trade exists.

No algorithmically invented movement is labeled live. Every displayed price includes source, timestamp, currency, and freshness. Stale or disputed values are visibly marked.

#### Orders and matching

Buy and sell orders are durable signed records with tenant, market, asset, side, quantity, limit price, time-in-force, actor, status, idempotency key, and proof head. The matching engine applies deterministic price-time priority. Partial fills create separate immutable fill records. Cancellation and expiration are explicit events.

The order book is projected from open durable orders. The trade tape is projected only from settled fills. Charts are rebuilt from settled fills and cannot be mutated by the client.

#### Wallet-first settlement with card delta

For a buy:

1. Revalidate the asset, order, seller ownership, market status, and buyer permission.
2. Lock the quote for a short expiry and reserve the matched quantity.
3. Read the buyer's real Receiz wallet balance.
4. Calculate `walletApplied = min(walletAvailable, total)` and `cardDelta = total - walletApplied` in integer minor units.
5. Reserve wallet funds if the rail supports reservations. Otherwise do not transfer wallet funds until the card portion is confirmed.
6. Create Receiz hosted checkout only for `cardDelta`; Receiz remains the card-data boundary.
7. On verified card webhook completion, execute the wallet transfer, seller settlement, fees, and ownership append using stable idempotency keys.
8. Mark the fill settled only after all required rails return durable receipts.
9. Mint or append buyer ownership proof, release the seller quantity, update the order book, and publish the settlement event.
10. Reconcile interrupted states with a durable job. Compensation releases reservations and never fabricates a completed trade.

For a sell, ownership and available quantity are verified and reserved before the order opens. Proceeds settle to the seller's Receiz wallet/payout path after the fill becomes final.

#### Persistence and recovery

Exchange assets, markets, orders, fills, liquidity positions, price points, ownership, settlement receipts, and known heads live behind server routes and the Receiz adapter. Client state contains projections only. Refreshing, changing device, cold starting, or opening through another host rebuilds the same market state.

Every mutation requires authentication, tenant scope, authorization, idempotency, validation, rate limits, and an auditable Receiz receipt. MCP tools call the same application service commands as the UI.

#### Market safety

Version 2 includes market pause, asset suspension, stale-price limits, maximum order size, duplicate-order protection, settlement timeout, webhook replay defense, wallet/card mismatch handling, and operator reconciliation. Jurisdictional, securities, money-transmission, tax, and consumer-protection requirements must be reviewed before enabling real-money public markets; feature flags can restrict Exchange to supported asset classes and tenants.

### 6. AI operator, MCP, and skills

The AI operator is a command layer over typed application services.

Each tool declares required scope, tenant, input schema, output schema, idempotency behavior, confirmation class, and audit event. Read actions may execute immediately. Draft actions show a diff. Financial, destructive, publishing, permission, and external-message actions require a preview and explicit confirmation unless an approved policy grants bounded automation.

Initial skill families:

- Launch: create a store plan, import a catalog, configure a theme, and prepare launch blockers.
- Merchandising: draft products, collections, bundles, promotions, and content.
- Operations: triage orders, inventory, fulfillment, returns, and exceptions.
- Growth: segment customers, draft campaigns, analyze cohorts, and recommend experiments.
- Finance: explain settlements, reconcile wallet/card splits, prepare exports, and identify anomalies.
- Exchange: verify assets, prepare listings, preview orders, inspect market state, and reconcile settlement; placing or cancelling orders requires confirmation.
- Developer: doctor, capability checks, migration, fixtures, conformance, and release evidence.

Agent evaluations test scope denial, prompt injection resistance, confirmation enforcement, idempotency, stale state, partial failure, and receipt accuracy.

### 7. SDK and MCP upgrade

The application upgrades from `@receiz/sdk@98.0.0` to `99.0.0`. Documentation and examples pin `@receiz/mcp-server@99.0.0`. The adapter remains the only direct SDK boundary for application code.

The upgrade requires:

- dependency and lockfile update;
- export/type compatibility inventory;
- adapter compile and contract tests;
- doctor version assertion;
- documentation, release notes, example config, and AI-skill reference updates;
- live sandbox checks for identity, proof verification, public-store publish/recovery, wallet, checkout, media, domains, and app state;
- an explicit SDK/MCP compatibility matrix.

### 8. Modular implementation boundaries

The 3,400-line template store and 2,000-line storefront are split by business domain without changing behavior first:

- workspace and draft persistence;
- brand and publishing;
- catalog and inventory;
- customers and identity;
- checkout, orders, and fulfillment;
- rewards and campaigns;
- Exchange commands and projections;
- hosting and domains;
- AI/MCP commands;
- shared app shell and navigation.

Each domain owns types, pure reducers/projectors, service commands, route handlers, and tests. React hooks compose these services rather than contain business transactions.

## Error and recovery design

Every async workflow exposes pending, success, retryable failure, terminal failure, and recovery state. Messages say what happened, whether money or public state changed, and the next safe action.

Financial and publishing operations use idempotency keys and durable operation records. Webhook processing records event ids and rejects duplicates. Jobs retry with bounded exponential backoff and dead-letter visibility. Operators can inspect and resume incomplete settlement or publishing operations without editing raw data.

Offline edits remain queued with visible status. Financial, ownership, permission, and publish mutations require connectivity and fresh authority.

## Accessibility target

The release target is WCAG 2.2 AA for merchant and customer workflows. Required gates cover keyboard-only use, screen-reader names and state, focus restoration, contrast, target size, error association, live updates, motion preferences, 200% text scaling, 400% zoom/reflow, and mobile orientation.

Financial totals and Exchange state cannot rely on color alone. Price direction includes text and symbols. Charts include concise accessible summaries and data tables.

## Performance and observability targets

- Storefront LCP p75 below 2.5 seconds on mobile production traffic.
- INP p75 below 200 ms and CLS p75 below 0.1.
- Initial storefront JavaScript budget below 220 KB compressed, excluding interaction-loaded 3D/game modules.
- Read API p95 below 500 ms and mutation acknowledgement p95 below 800 ms, excluding external settlement completion.
- Every server mutation has request id, tenant, actor, duration, result, and safe error class.
- Settlement and publish workflows expose success rate, latency, retries, stuck operations, and reconciliation outcomes.

## Security and privacy gates

- Resolve all known high and moderate production dependency advisories.
- Complete repository threat model and exhaustive security scan before release.
- Enforce authorization server-side for every tenant resource and mutation.
- Test cross-tenant access denial for UI, API, SDK, MCP, webhooks, jobs, and exports.
- Add CSP, secure headers, request-size limits, rate limits, abuse controls, and safe redirect allowlists.
- Verify webhook signatures against raw bodies, enforce timestamp tolerance, and persist replay ids.
- Never expose access tokens, identity key material, full payment data, or sensitive customer fields in logs, model prompts, analytics, or client projections.
- Define retention, deletion, export, consent, and AI-data boundaries.

## Test and release gates

Version 2 cannot ship until all of the following pass:

1. Unit and type tests for every domain command and projector.
2. SDK 99 contract tests and doctor checks.
3. Browser E2E for setup, brand publish, product creation, checkout, fulfillment, refund, reward, domain publish, proof upload, Exchange listing, wallet/card trade, reload recovery, and reconciliation.
4. Visual regression at desktop, tablet, and representative mobile sizes.
5. Automated accessibility plus manual keyboard and screen-reader journeys.
6. Cross-tenant authorization and webhook replay suites.
7. Load tests for storefront reads, order creation, webhook bursts, and Exchange matching.
8. Recovery tests for network loss, duplicate requests, card abandonment, webhook delay, wallet failure, stale quote, publish conflict, and process restart.
9. Production build, secret scan, dependency audit, SDK doctor, release conformance, and migration verification.
10. A release evidence bundle that records exact versions, commands, results, known deviations, rollback plan, and operator runbooks.

## Migration strategy

Version 1 browser state is read through an explicit migration into versioned workspace drafts. The migration preserves merchant content and published state while removing template-only seed material. It never silently publishes migrated drafts.

Exchange seed markets are marked demo and excluded from production projections. Existing locally created Exchange events are not promoted to real settlement history. Verified source artifacts may be re-imported, but listings and trades must be recreated through the durable v2 commands.

The release uses capability flags so brand persistence and SDK 99 can ship before the full Exchange. Schema changes are backward readable during the migration window. Rollback does not delete v2 proof or settlement receipts.

## Delivery slices

1. **Foundation:** SDK/MCP 99, dependency security fix, modular state boundary, versioned drafts, global theme publish, telemetry, and browser E2E harness.
2. **Merchant core:** adaptive navigation, onboarding, catalog variants, inventory, orders, fulfillment, returns/refunds, customers, and finance projections.
3. **Real Exchange:** canonical proof ingestion, durable market services, sourced pricing, order matching, wallet/card settlement, ownership append, recovery, and operator controls.
4. **AI operations:** typed MCP commands, confirmations, audit, skills, evaluations, and guided merchant workflows.
5. **A+ release:** accessibility, performance, visual polish, security, load, recovery, documentation, enterprise fork guide, and release evidence.

Each slice must leave the application releasable and cannot relabel simulated behavior as production behavior.

## Success criteria

Version 2 is successful when:

- a first-time merchant can publish a branded, payable store in under ten minutes;
- the chosen theme is identical after reload, across devices, tabs, routes, subdomain, and custom domain;
- a verified eligible proof object can be listed, bought with wallet-first/card-delta funding, settled, recovered, and verified after a cold start;
- every displayed financial or market fact identifies its source and freshness;
- a growing team can operate orders, inventory, customers, fulfillment, returns, rewards, finance, and locations without leaving the product;
- AI completes common workflows safely through the same authorized services as the UI;
- the repository passes the complete release gates and remains straightforward to fork and extend.

