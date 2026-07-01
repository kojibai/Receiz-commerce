# Production Readiness 100 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the app from a strong Receiz commerce template into an explicit production launch system for both developer clones and no-code merchants.

**Architecture:** Add a pure launch-readiness domain model that scores a `CommerceState` against Receiz SDK, proof, storefront, checkout, domain, business, and operations requirements. Render that model in admin as a click-oriented command center and document the same gates for developers cloning the repo.

**Tech Stack:** Next.js App Router, React 19, TypeScript, `@receiz/sdk@97.5.0`, Node test runner, existing CSS/component primitives.

---

### Task 1: Launch Readiness Domain Model

**Files:**
- Create: `src/lib/launch/readiness.ts`
- Test: `tests/launch-readiness.test.ts`
- Modify: `tsconfig.test.json`

- [ ] **Step 1: Write the failing test**

```ts
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { seedCommerceState } from "../src/data/seed.js";
import { buildLaunchReadiness } from "../src/lib/launch/readiness.js";

describe("launch readiness", () => {
  it("grades the seeded production store as elite-ready", () => {
    const readiness = buildLaunchReadiness(seedCommerceState);

    assert.equal(readiness.score, 100);
    assert.equal(readiness.grade, "A+");
    assert.equal(readiness.blockers.length, 0);
    assert.equal(readiness.categories.every((category) => category.score === 100), true);
    assert.equal(readiness.categories.some((category) => category.id === "developer_sdk"), true);
    assert.equal(readiness.nextActions.length > 0, true);
  });

  it("surfaces clear blockers for a new incomplete merchant store", () => {
    const draft = structuredClone(seedCommerceState);
    draft.hosting.published = false;
    draft.auth.receizId.connected = false;
    draft.checkout.mode = "mock";
    draft.products = [];
    draft.rewardRules = [];
    draft.hosting.customDomain.verified = false;
    draft.hosting.customDomain.status = "needs_dns";

    const readiness = buildLaunchReadiness(draft);

    assert.equal(readiness.score < 100, true);
    assert.equal(readiness.grade === "A+" || readiness.grade === "A", false);
    assert.deepEqual(
      readiness.blockers.map((blocker) => blocker.id),
      [
        "receiz_identity",
        "catalog",
        "checkout_live",
        "custom_domain",
        "publish"
      ]
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test`

Expected: TypeScript fails because `src/lib/launch/readiness.ts` does not exist.

- [ ] **Step 3: Write minimal implementation**

Create `src/lib/launch/readiness.ts` with exported types and `buildLaunchReadiness(state: CommerceState): LaunchReadiness`.

The model must:
- Produce seven categories: `developer_sdk`, `no_code_setup`, `receiz_identity`, `catalog`, `checkout`, `domains`, `production_ops`.
- Score each category from completed checks.
- Build `blockers` from incomplete critical checks.
- Return `score`, `grade`, `categories`, `blockers`, and `nextActions`.
- Treat the existing seed state as 100/100.

- [ ] **Step 4: Include the module in test TypeScript config**

Add `src/lib/launch/readiness.ts` and `src/data/seed.ts` to `tsconfig.test.json`.

- [ ] **Step 5: Run tests to verify green**

Run: `pnpm test`

Expected: all tests pass.

### Task 2: Admin Launch Command Center

**Files:**
- Create: `src/features/admin/LaunchReadinessPanel.tsx`
- Modify: `src/features/admin/AdminStudio.tsx`
- Modify: `app/globals.css`

- [ ] **Step 1: Write a focused test for render-safe content**

Add assertions to `tests/launch-readiness.test.ts` that `buildLaunchReadiness(seedCommerceState)` exposes category labels and next actions suitable for a no-code admin panel.

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test`

Expected: failure if labels/actions are missing from the readiness model.

- [ ] **Step 3: Create `LaunchReadinessPanel`**

The panel must show:
- Overall score and grade.
- Category rows with score, status, and action label.
- Critical blockers when present.
- “Developer clone rails” facts from the readiness model so clone builders learn the SDK rails in-app.

- [ ] **Step 4: Mount in desktop and mobile admin launch surfaces**

Import `LaunchReadinessPanel` in `AdminStudio.tsx`.

Place it:
- After `TwinLaunchPanel` in the desktop admin grid.
- After the mobile snapshot in the launch mobile pane.

- [ ] **Step 5: Style without disrupting existing layout**

Add responsive CSS for:
- `.launch-readiness-panel`
- `.readiness-score-card`
- `.readiness-category-list`
- `.readiness-category-row`
- `.readiness-blockers`
- `.readiness-sdk-rails`

- [ ] **Step 6: Verify**

Run: `pnpm typecheck` and `pnpm test`.

Expected: both pass.

### Task 3: Clone And Production Readiness Guide

**Files:**
- Create: `docs/PRODUCTION_READINESS.md`
- Modify: `README.md`

- [ ] **Step 1: Write docs grounded in code paths**

Create a guide with:
- What the app is for: developer clone template and no-code production commerce app.
- The Receiz authority rule from MCP: MCP is tooling; SDK/API/proof rails are truth.
- 100/100 release gates: SDK scopes, Receiz ID, public-store publish, app-state recovery, media upload, checkout, domains, webhooks, threat model, UX/a11y, observability.
- Code path map for each gate.
- Commands: `pnpm receiz:doctor`, `pnpm test`, `pnpm typecheck`.

- [ ] **Step 2: Link guide from README**

Add a short “Production Readiness” section near SDK Doctor/MCP.

- [ ] **Step 3: Verify docs references**

Run: `rg -n "PRODUCTION_READINESS|LaunchReadiness|buildLaunchReadiness|receiz:doctor" README.md docs src tests`.

Expected: the new guide and app code are discoverable.

### Task 4: Final Verification

**Files:**
- No new files.

- [ ] **Step 1: Run full verification**

Run:
- `pnpm test`
- `pnpm typecheck`
- `RECEIZ_DOCTOR_TENANT_HOST=boost.receiz.app pnpm receiz:doctor`

- [ ] **Step 2: Review git diff**

Run: `git diff --stat` and `git diff --check`.

Expected: no whitespace errors; diff limited to readiness model, admin panel, CSS, tests, and docs.
