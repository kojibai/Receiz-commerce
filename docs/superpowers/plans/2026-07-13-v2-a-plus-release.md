# Receiz Commerce OS v2 A+ Release Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship an honest `2.0.0` release whose Exchange, hosting/domain payments, game, state recovery, accessibility, performance, security, and release evidence meet the approved v2 design.

**Architecture:** Financial and ownership mutations are server commands backed by Receiz settlement and proof-state publication; the browser is a projection. Exchange data carries provenance and freshness instead of simulated “live” claims. Receiz Wilds uses deterministic state reducers, stable non-overlapping geometry, adaptive rendering, and proof-backed progression. Release status is derived from executable gates, never marketing copy.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, `@receiz/sdk@99.0.0`, React Three Fiber, Three.js, Node test runner, ESLint, Receiz public-store proof state.

## Global Constraints

- Users remain on `receiz.app`, the merchant subdomain, or the merchant custom domain for identity, payment, proof verification, Exchange, and recovery.
- Wallet funds apply first; credit-card funding covers only the remaining amount.
- No ownership, hosting plan, or custom-domain activation occurs before confirmed settlement.
- A value labeled live must expose source, observed timestamp, freshness state, and recovery path.
- Seeded or simulated values are labeled demo data and cannot appear as live in production mode.
- Every financial mutation is idempotent and produces an auditable Receiz receipt.
- `package.json` remains `1.0.0` until all release gates in Task 7 pass.
- Preserve the existing design system and responsive storefront/admin patterns.
- The game uses original Receiz Wilds characters, art direction, language, and mechanics.

---

### Task 1: Truthful Exchange Provenance and Production Gating

**Files:**
- Modify: `src/types/domain.ts`
- Modify: `src/lib/storefront/proof-exchange.ts`
- Modify: `src/data/seed.ts`
- Modify: `src/features/storefront/PublicStorefront.tsx`
- Test: `tests/proof-exchange.test.ts`
- Test: `tests/exchange-truth-contract.test.ts`

**Interfaces:**
- Produces: `ExchangeMarketDataStatus`, `ExchangePriceSource`, and `exchangeMarketTruth(asset, now)`.
- Consumes: settled trade timestamps and seller ask records already stored in `ExchangeAsset`.

- [ ] **Step 1: Write the failing truth-contract tests**

Add tests asserting that a newly listed asset reports `seller_ask`, a settled asset reports `settled_trade`, stale data reports `stale`, and seeded markets use `demo` rather than `live` labels.

- [ ] **Step 2: Run the tests and verify RED**

Run: `pnpm test`

Expected: FAIL because provenance/freshness fields and truthful UI labels do not exist.

- [ ] **Step 3: Add provenance and freshness types**

Add explicit source, observed-at, freshness, and environment fields to Exchange projections. Derive price from the best stored ask or last settled trade; never calculate synthetic movement.

- [ ] **Step 4: Replace production-facing simulated labels**

Change seeded append tape, liquidity, volume, and charts to display “Demo market” unless backed by stored settlement events. Replace “Deterministic value” with “Seller reference value” or “Last settled price” as appropriate.

- [ ] **Step 5: Run focused and full verification**

Run: `pnpm test && pnpm typecheck && pnpm lint`

Expected: all commands exit 0.

- [ ] **Step 6: Commit**

```bash
git add src/types/domain.ts src/lib/storefront/proof-exchange.ts src/data/seed.ts src/features/storefront/PublicStorefront.tsx tests/proof-exchange.test.ts tests/exchange-truth-contract.test.ts
git commit -m "feat: expose truthful Exchange market provenance"
```

### Task 2: Durable Hosting and Domain Payment Recovery

**Files:**
- Create: `src/lib/hosting/platform-operation.ts`
- Create: `src/lib/hosting/platform-operation-store.ts`
- Modify: `app/api/hosting/route.ts`
- Modify: `app/api/receiz/webhook/route.ts`
- Modify: `src/lib/hosting/platform-billing.ts`
- Test: `tests/platform-operation.test.ts`
- Test: `tests/hosting-webhook-recovery.test.ts`

**Interfaces:**
- Produces: `PlatformOperation`, `createPlatformOperation`, `settlePlatformOperation`, `platformOperationFromWebhook`, and `PlatformOperationStore`.
- Consumes: Receiz checkout reference IDs, receipt IDs, signed webhook payloads, and existing hosting/domain commands.

- [ ] **Step 1: Write failing operation-state tests**

Cover pending card funding, settled replay, duplicate webhook delivery, mismatched amount/tenant rejection, and terminal failure without activation.

- [ ] **Step 2: Run the tests and verify RED**

Run: `pnpm test`

Expected: FAIL because no durable platform-operation model exists.

- [ ] **Step 3: Implement the pure operation state machine**

Model `pending_payment`, `settled`, `applying`, `applied`, and `failed` with immutable transitions. Require operation kind, target, amount, merchant, tenant host, idempotency key, checkout session, and timestamps.

- [ ] **Step 4: Persist operation records through Receiz proof state**

Store the pending operation before opening embedded card funding. Recover it by reference ID during webhook handling and publish the terminal result after activation.

- [ ] **Step 5: Resume hosting/domain commands from signed webhooks**

Verify amount, merchant, tenant, operation kind, and settlement status. Apply a hosting plan or register a domain exactly once; record partial failure for retry without collecting payment again.

- [ ] **Step 6: Run focused and full verification**

Run: `pnpm test && pnpm typecheck && pnpm lint`

Expected: all commands exit 0 and duplicate webhooks do not repeat activation.

- [ ] **Step 7: Commit**

```bash
git add src/lib/hosting/platform-operation.ts src/lib/hosting/platform-operation-store.ts src/lib/hosting/platform-billing.ts app/api/hosting/route.ts app/api/receiz/webhook/route.ts tests/platform-operation.test.ts tests/hosting-webhook-recovery.test.ts
git commit -m "feat: recover platform payments from webhooks"
```

### Task 3: Stable Receiz Wilds Rendering

**Files:**
- Modify: `src/features/play/WildsWorldCanvas.tsx`
- Create: `src/features/play/render-quality.ts`
- Modify: `src/features/play/PlayCampaign.tsx`
- Test: `tests/game-render-contract.test.ts`
- Test: `tests/game-render-quality.test.ts`

**Interfaces:**
- Produces: `wildsRenderQuality(input)` and stable terrain-layer constants.
- Consumes: viewport width, device pixel ratio, reduced-motion preference, and WebGL capability.

- [ ] **Step 1: Write failing render-contract tests**

Assert unique terrain heights, no nested transform writers for creature vertical position, capped mobile DPR, reduced-motion support, context-loss fallback, and stable canvas remount identity.

- [ ] **Step 2: Run the tests and verify RED**

Run: `pnpm test`

Expected: FAIL on overlapping terrain and missing adaptive quality.

- [ ] **Step 3: Remove z-fighting and competing transforms**

Replace coplanar ring/plane layers with non-overlapping path meshes or larger vertical separation. Give one animation owner responsibility for each transform.

- [ ] **Step 4: Add adaptive rendering and recovery**

Cap DPR and shadow resolution on mobile, pause offscreen animation, respect reduced motion, and show a useful fallback after WebGL context loss.

- [ ] **Step 5: Browser-verify desktop and mobile frames**

Capture stable frames before and after movement. Verify no black wedges, striped terrain, blank canvas, console errors, or clipped controls.

- [ ] **Step 6: Run full verification and commit**

Run: `pnpm test && pnpm typecheck && pnpm lint && pnpm build`

Commit: `fix: stabilize Receiz Wilds rendering`.

### Task 4: Advanced Receiz Wilds Progression Foundation

**Files:**
- Create: `src/features/play/wilds-domain.ts`
- Create: `src/features/play/wilds-save.ts`
- Create: `src/features/play/wilds-encounter.ts`
- Modify: `src/features/play/game-state.ts`
- Modify: `src/features/play/PlayCampaign.tsx`
- Modify: `src/features/play/WildsWorldCanvas.tsx`
- Modify: `src/lib/storage/use-template-store.ts`
- Test: `tests/wilds-domain.test.ts`
- Test: `tests/wilds-save.test.ts`
- Test: `tests/wilds-encounter.test.ts`

**Interfaces:**
- Produces: versioned `WildsSaveV2`, deterministic `advanceEncounter`, zone unlock rules, companion progression, squad selection, quest state, and proof-event projection.
- Consumes: tenant identity, campaign configuration, proof events, reward definitions, and verified owned assets.

- [ ] **Step 1: Write failing deterministic-domain tests**

Cover zone unlocks, energy limits, companion XP/leveling, three-member squads, tactical role advantages, encounter victory/defeat, reward idempotency, and migration from the current local state.

- [ ] **Step 2: Run the tests and verify RED**

Run: `pnpm test`

Expected: FAIL because the v2 domain and save schema do not exist.

- [ ] **Step 3: Implement versioned progression and encounters**

Keep gameplay deterministic and pure. Separate world traversal, encounter resolution, reward minting, and persistence so each can be tested independently.

- [ ] **Step 4: Publish game progress as proof-backed state**

Persist milestone events and reward ownership through the same tenant proof-state rails. Keep transient animation/input state local.

- [ ] **Step 5: Integrate original premium assets and audio**

Use generated or licensed original Receiz Wilds assets after credential probing. Add user-gesture audio unlock, mute controls, ambience, discovery, mission, reward, and failure cues.

- [ ] **Step 6: Browser playtest the full loop**

Verify exploration, discovery, squad selection, encounter, failure/retry, reward, reload recovery, keyboard, touch, and reduced-motion behavior.

- [ ] **Step 7: Run full verification and commit**

Run: `pnpm test && pnpm typecheck && pnpm lint && pnpm build`.

Commit: `feat: add Receiz Wilds v2 progression`.

### Task 5: Accessibility, Performance, and Security Gates

**Files:**
- Create: `scripts/release-accessibility-check.mjs`
- Create: `scripts/release-route-budget.mjs`
- Create: `scripts/release-security-contract.mjs`
- Modify: `package.json`
- Modify: `middleware.ts`
- Modify: `app/globals.css`
- Test: `tests/release-quality-gates.test.ts`

**Interfaces:**
- Produces: `test:a11y`, `test:route-budgets`, and `test:security-contract` release scripts.
- Consumes: production build output, route manifests, security headers, browser DOM, and current UI routes.

- [ ] **Step 1: Write failing release-gate contract tests**

Assert the scripts exist, are wired into `release:check`, and fail on missing CSP, oversized routes, missing focus visibility, and motion without a reduced-motion override.

- [ ] **Step 2: Run tests and verify RED**

Run: `pnpm test`

Expected: FAIL because the release scripts are not registered.

- [ ] **Step 3: Implement the smallest enforceable gates**

Add strict security headers with required payment/frame exceptions, route-size budgets, keyboard/focus/reflow checks, and reduced-motion CSS. Do not claim full WCAG compliance from automation alone.

- [ ] **Step 4: Run gates and commit**

Run: `pnpm test:a11y && pnpm test:route-budgets && pnpm test:security-contract`.

Commit: `test: add v2 release quality gates`.

### Task 6: Release Evidence and Final Scorecard

**Files:**
- Create: `docs/audits/2026-07-13-commerce-os-v2-release.md`
- Create: `output/release-v2/` screenshots and command evidence
- Modify: `docs/PRODUCTION_READINESS.md`
- Modify: `docs/OPEN_SOURCE_RELEASE.md`

**Interfaces:**
- Produces: a reproducible evidence report with every command, screenshot, limitation, and grade.
- Consumes: Tasks 1–5 outputs.

- [ ] **Step 1: Run every release command**

Run: `pnpm test && pnpm typecheck && pnpm lint && pnpm build && pnpm secret:scan && pnpm audit --prod && pnpm receiz:doctor && pnpm release:check`.

- [ ] **Step 2: Capture browser evidence**

Capture admin, storefront, checkout funding, Exchange upload/trade/reload, hosting plan funding/recovery, custom-domain funding/recovery, game exploration/encounter/reward, account, error, empty, and reduced-motion states on desktop and mobile.

- [ ] **Step 3: Complete the scorecards**

Grade every approved product scale and the mandatory ten-category Three.js visual scorecard. Record automatic failures and remaining legal/manual-testing limits.

- [ ] **Step 4: Commit**

Commit: `docs: add Receiz Commerce OS v2 release evidence`.

### Task 7: Version 2.0.0 Release

**Files:**
- Modify: `package.json`
- Modify: `pnpm-lock.yaml`
- Modify: `README.md`
- Modify: `RELEASE_NOTES.md`
- Create: `docs/MIGRATING_TO_V2.md`
- Test: `tests/v2-release-contract.test.ts`

**Interfaces:**
- Produces: the final `2.0.0` package and migration contract.
- Consumes: a fully green Task 6 evidence report with no unresolved automatic failures.

- [ ] **Step 1: Write the failing version contract**

Assert package and lockfile version `2.0.0`, SDK/MCP `99.0.0`, migration documentation, release notes, and all release commands.

- [ ] **Step 2: Verify RED**

Run: `pnpm test`

Expected: FAIL while package version remains `1.0.0`.

- [ ] **Step 3: Confirm every prerequisite**

Do not continue if Task 6 reports an automatic failure, financial recovery gap, simulated live claim, browser error, security failure, or failed live-sandbox settlement.

- [ ] **Step 4: Bump and document version 2.0.0**

Update package metadata, lockfile, README, release notes, and migration guide.

- [ ] **Step 5: Run the frozen release gate**

Run: `pnpm release:check`.

Expected: exit 0 with the package frozen at `2.0.0`.

- [ ] **Step 6: Commit**

```bash
git add package.json pnpm-lock.yaml README.md RELEASE_NOTES.md docs/MIGRATING_TO_V2.md tests/v2-release-contract.test.ts
git commit -m "release: Receiz Commerce OS 2.0.0"
```

## Self-Review

- Spec coverage: all remaining baseline gaps are assigned to Tasks 1–7; full serious-business breadth beyond the approved v2 list remains a post-v2 modular expansion rather than a fake release claim.
- Placeholder scan: no TBD/TODO placeholders remain.
- Type consistency: Exchange truth, platform operations, Wilds saves, and release scripts are introduced before their consumers.
- Release safety: the version bump is last and explicitly blocked by failed financial, browser, security, or truthfulness gates.
