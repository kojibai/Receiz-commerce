# Mobile Play Bars Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Compact the two mobile header rows and keep the Wilds command dock fixed at least 8px above the app navigation on every small-screen height.

**Architecture:** Give the Play pane a dedicated class for scoped heading compression. Define shared mobile app-navigation geometry in CSS, use it for both the fixed bottom navigation and the fixed Wilds command system, and reserve matching Play-pane bottom space so content is not obscured.

**Tech Stack:** React, TypeScript, CSS, Node test runner, Playwright CLI

## Global Constraints

- The mobile brand/profile header is no taller than 44px.
- The Play heading row is no taller than 20px without changing other pane headings.
- The Wilds command bar remains fixed and always visible at least 8px above the app navigation.
- Safe-area insets remain part of both bars' bottom geometry.
- Existing command and navigation labels, touch targets, focus states, badges, sheets, and actions remain unchanged.
- Browser verification covers 390×844 and 375×667.

---

### Task 1: Add a Dedicated Mobile Play Pane Hook

**Files:**
- Modify: `src/features/storefront/PublicStorefront.tsx`
- Test: `tests/mobile-layout-css.test.ts`

**Interfaces:**
- Consumes: `MobilePane`'s existing `active`, `action`, `children`, and `title` props.
- Produces: An optional `className?: string` prop and a `mobile-play-pane` class on the Play pane section.

- [ ] **Step 1: Write the failing markup contract**

Add a source assertion:

```ts
assert.match(storefront, /<MobilePane active=\{active\} action=\{<StatusPill tone="pink">Game on<\/StatusPill>\} className="mobile-play-pane" title="Play">/);
```

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```bash
node --test tests/mobile-layout-css.test.ts
```

Expected: FAIL because `MobilePane` does not yet accept or render a `className`.

- [ ] **Step 3: Implement the class hook**

Add `className?: string` to `MobilePane`, combine it with the active class, and pass `className="mobile-play-pane"` from `MobilePlayPanel`:

```tsx
function MobilePane({ active, children, className, title, action }: {
  active: boolean;
  children: ReactNode;
  className?: string;
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <section aria-hidden={!active} className={["mobile-pane", active && "active", className].filter(Boolean).join(" ")}>
```

- [ ] **Step 4: Run the focused test and verify GREEN**

Run `node --test tests/mobile-layout-css.test.ts`.

Expected: PASS.

### Task 2: Compact Headers and Fix the Wilds Dock

**Files:**
- Modify: `app/globals.css`
- Modify: `tests/mobile-layout-css.test.ts`
- Modify: `tests/wilds-render-contract.test.ts`

**Interfaces:**
- Consumes: `.mobile-header`, `.mobile-play-pane`, `.bottom-nav`, `.mobile-play-wrap`, and `.wilds-command-system`.
- Produces: Shared `--mobile-app-nav-bottom` and `--mobile-app-nav-height` geometry plus fixed Wilds dock placement.

- [ ] **Step 1: Write failing geometry contracts**

Assert that mobile CSS defines the shared navigation variables, a 44px header, a 20px Play heading, and fixed command placement:

```ts
assert.match(css, /\.commerce-app\s*\{[^}]*--mobile-app-nav-bottom:\s*max\(8px, env\(safe-area-inset-bottom\)\)[^}]*--mobile-app-nav-height:\s*56px/s);
assert.match(css, /\.mobile-header\s*\{[^}]*height:\s*44px/s);
assert.match(css, /\.mobile-play-pane \.mobile-pane-heading\s*\{[^}]*min-height:\s*20px[^}]*height:\s*20px/s);
assert.match(css, /\.mobile-play-wrap \.wilds-command-system\s*\{[^}]*position:\s*fixed[^}]*bottom:\s*calc\(var\(--mobile-app-nav-bottom\) \+ var\(--mobile-app-nav-height\) \+ 8px\)/s);
```

Remove or update old assertions that require 50/46px header minima and a generic 26px pane heading.

- [ ] **Step 2: Run focused tests and verify RED**

Run:

```bash
node --test tests/mobile-layout-css.test.ts tests/wilds-render-contract.test.ts
```

Expected: FAIL because the current dock remains in flow and the current headers are taller.

- [ ] **Step 3: Implement the minimal responsive CSS**

Within the mobile media query:

```css
.commerce-app {
  --mobile-app-nav-bottom: max(8px, env(safe-area-inset-bottom));
  --mobile-app-nav-height: 56px;
}
.mobile-header {
  height: 44px;
  min-height: 44px;
  padding-block: 2px;
}
.mobile-header .brand-mark { width: 34px; height: 34px; }
.mobile-header > .icon-button { width: 36px; height: 36px; }
.mobile-play-pane .mobile-pane-heading { min-height: 20px; height: 20px; }
.mobile-play-pane .mobile-pane-heading h2 { font-size: 16px; }
.mobile-play-pane .mobile-pane-heading .status-pill { min-height: 18px; padding: 2px 7px; font-size: 9px; }
.mobile-play-pane.active { transform: none; }
.mobile-play-wrap { padding-bottom: calc(var(--mobile-app-nav-height) + 80px); }
.mobile-play-wrap .wilds-command-system {
  position: fixed;
  right: 18px;
  bottom: calc(var(--mobile-app-nav-bottom) + var(--mobile-app-nav-height) + 8px);
  left: 18px;
  z-index: 49;
}
.bottom-nav { bottom: var(--mobile-app-nav-bottom); min-height: var(--mobile-app-nav-height); }
```

Update the ≤390px overrides so they do not restore taller header dimensions. Keep the global app-navigation z-index at 50 and command sheets at their existing overlay z-index.

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

- [ ] **Step 5: Verify real mobile geometry**

At both 390×844 and 375×667, measure bounding rectangles and confirm:

- `.mobile-header` height is at most 44px.
- `.mobile-play-pane .mobile-pane-heading` height is at most 20px.
- `.bottom-nav` top minus `.wilds-command-dock` bottom is at least 8px.
- Both bars and the profile button are clickable and untruncated.
- The Card Vault sheet opens, scrolls, and closes without collision.
- The console contains no errors.

- [ ] **Step 6: Commit**

```bash
git add src/features/storefront/PublicStorefront.tsx app/globals.css tests/mobile-layout-css.test.ts tests/wilds-render-contract.test.ts
git commit -m "fix: separate mobile Wilds and app navigation bars"
```
