# Mobile Game Controls Dedicated Space Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the 3D world, compact world controls, Wilds command dock, and storefront navigation separate non-overlapping mobile rows.

**Architecture:** Bound the Play pane above the storefront navigation and convert the mobile Wilds panel into nested height-aware grids. Return the command system to normal flow, assign a compact 68px world-control row, and let only the 3D stage consume flexible remaining height.

**Tech Stack:** CSS, Node test runner, Playwright CLI

## Global Constraints

- The compact 44px global header and 20px Play heading remain unchanged.
- The Wilds command system must not use fixed positioning on mobile.
- The trackpad is no larger than 68px on short mobile screens.
- The 3D stage is the only flexible-height gameplay row.
- Adjacent world controls, command dock, and storefront navigation never intersect and retain at least 8px physical separation where separate panels meet.
- All existing accessible names, actions, modal sheets, and close controls remain unchanged.

---

### Task 1: Replace Overlay Positioning with Dedicated Rows

**Files:**
- Modify: `app/globals.css`
- Modify: `tests/mobile-layout-css.test.ts`
- Modify: `tests/wilds-render-contract.test.ts`

**Interfaces:**
- Consumes: `.mobile-play-pane`, `.mobile-play-wrap`, `.wilds-play-panel`, `.wilds-shell`, `.wilds-world`, `.wilds-stage`, `.wilds-screen-controls`, `.wilds-trackpad`, and `.wilds-command-system`.
- Produces: A bounded four-region vertical layout with no mobile fixed positioning on the Wilds command system.

- [ ] **Step 1: Write failing dedicated-space contracts**

Replace the fixed-dock assertions with:

```ts
assert.doesNotMatch(css, /\.mobile-play-wrap \.wilds-command-system\s*\{[^}]*position:\s*fixed/s);
assert.match(css, /\.mobile-play-pane\s*\{[^}]*bottom:\s*calc\(var\(--mobile-app-nav-bottom\) \+ var\(--mobile-app-nav-height\) \+ 8px\)[^}]*overflow:\s*hidden/s);
assert.match(css, /\.mobile-play-wrap \.wilds-shell\s*\{[^}]*grid-template-rows:\s*minmax\(0, 1fr\) auto[^}]*height:\s*100%/s);
assert.match(css, /\.mobile-play-wrap \.wilds-world\s*\{[^}]*grid-template-rows:\s*minmax\(0, 1fr\) 68px/s);
assert.match(css, /\.mobile-play-wrap \.wilds-stage\s*\{[^}]*min-height:\s*0/s);
assert.match(css, /\.mobile-play-wrap \.wilds-trackpad\s*\{[^}]*width:\s*68px;[^}]*height:\s*68px/s);
```

- [ ] **Step 2: Run focused tests and verify RED**

Run:

```bash
node --test tests/mobile-layout-css.test.ts tests/wilds-render-contract.test.ts
```

Expected: FAIL because the command system is still fixed and the world/control rows are not height-constrained.

- [ ] **Step 3: Implement the bounded row layout**

Within the mobile media query, replace the fixed overlay rules with:

```css
.mobile-play-pane {
  bottom: calc(var(--mobile-app-nav-bottom) + var(--mobile-app-nav-height) + 8px);
  padding-bottom: 0;
  overflow: hidden;
}
.mobile-play-wrap {
  flex: 1 1 auto;
  min-height: 0;
  padding-bottom: 0;
  overflow: hidden;
}
.mobile-play-wrap .wilds-play-panel { height: 100%; }
.mobile-play-wrap .wilds-shell {
  grid-template-rows: minmax(0, 1fr) auto;
  height: 100%;
  min-height: 0;
}
.mobile-play-wrap .wilds-world {
  grid-template-rows: minmax(0, 1fr) 68px;
  min-height: 0;
}
.mobile-play-wrap .wilds-stage { min-height: 0; }
.mobile-play-wrap .wilds-command-system { position: static; }
.mobile-play-wrap .wilds-screen-controls { height: 68px; }
.mobile-play-wrap .wilds-trackpad { width: 68px; height: 68px; }
.mobile-play-wrap .wilds-screen-controls .wilds-action { min-height: 32px; }
```

Reduce the trackpad ring and knob proportionally. Remove the Play-pane transform exception that only existed to support viewport-fixed descendants.

- [ ] **Step 4: Run focused and full automated checks**

Run sequentially:

```bash
node --test tests/mobile-layout-css.test.ts tests/wilds-render-contract.test.ts
pnpm test
pnpm typecheck
pnpm lint
pnpm build
```

Expected: all tests pass; typecheck, lint, and production build exit successfully.

- [ ] **Step 5: Verify both real mobile viewports**

At 375×667 and 390×844, measure the stage, world controls, command dock, and app navigation. Confirm zero rectangle intersection between adjacent regions, at least 8px between the command dock and app navigation, a trackpad no larger than 68px, clickable action and command buttons, and zero console errors. Open, scroll, and close the Card Vault.

- [ ] **Step 6: Commit**

```bash
git add app/globals.css tests/mobile-layout-css.test.ts tests/wilds-render-contract.test.ts
git commit -m "fix: reserve mobile space for every game control"
```
