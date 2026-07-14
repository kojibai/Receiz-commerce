# Wilds Mobile Command Dock Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the vertically expanding Wilds support panels with a four-icon command dock and accessible bottom sheets, while making the vault compact and horizontally swipeable.

**Architecture:** `PlayCampaign` retains authoritative game state and supplies content to a focused `WildsCommandDock` component. `WildsCommandDock` owns selection, dialog dismissal, focus restoration, and swipe-down behavior; `WildsInventory` independently owns responsive four/eight-card pagination and horizontal page swiping. Existing game intents and card proof behavior remain unchanged.

**Tech Stack:** Next.js 15, React 19, TypeScript, existing icon library, CSS, Node test runner.

## Global Constraints

- The dock contains Mission, Rewards, Deck, and Vault only.
- Mission and Rewards show fixed-width percentage badges integrated with their icons; Vault shows the live card count as an upper-right superscript badge.
- Only one bottom sheet may be open at once.
- Mobile vault pages contain four cards; wider layouts contain eight.
- Swipe gestures supplement, but never replace, buttons and keyboard access.
- Preserve every existing mission, reward, deck, vault, proof, listing, fusion, growth, and download behavior.
- Use existing Wilds colors, materials, icons, state, and game intents; add no dependency or route.

---

### Task 1: Command Dock Interaction Component

**Files:**
- Create: `src/features/play/WildsCommandDock.tsx`
- Test: `tests/wilds-command-dock.test.ts`

**Interfaces:**
- Produces: `WildsCommandKey = "mission" | "rewards" | "deck" | "vault"`.
- Produces: `WildsCommandItem { key, label, icon, badge?, content }`.
- Produces: `WildsCommandDock({ items }: { items: readonly WildsCommandItem[] })`.

- [ ] **Step 1: Write the failing component contract test**

Assert that the source defines the four command keys, `role="dialog"`, `aria-modal="true"`, `aria-controls`, `aria-pressed`, Escape handling, focus restoration, backdrop dismissal, and pointer-cancel/lost-capture handling.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `npx tsx --test tests/wilds-command-dock.test.ts`
Expected: FAIL because `WildsCommandDock.tsx` does not exist.

- [ ] **Step 3: Implement the dock and sheet**

Create one stateful component with one active key, four icon buttons, fixed-width badge spans, one conditionally rendered sheet, a labelled dialog heading, close button, backdrop button, Escape listener, focus return, body scroll containment, and a drag handle that closes after a downward gesture exceeding 72 pixels. Handle `pointerup`, `pointercancel`, and `lostpointercapture`; do not duplicate game state.

- [ ] **Step 4: Run the focused test and verify GREEN**

Run: `npx tsx --test tests/wilds-command-dock.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/play/WildsCommandDock.tsx tests/wilds-command-dock.test.ts
git commit -m "feat: add Wilds command dock sheets"
```

### Task 2: Replace Expanding Panels With Dock Content

**Files:**
- Modify: `src/features/play/PlayCampaign.tsx`
- Modify: `tests/wilds-render-contract.test.ts`

**Interfaces:**
- Consumes: `WildsCommandDock` and `WildsCommandItem` from Task 1.
- Preserves: existing `dispatch(input: WildsInput)` and `WildsInventory` callbacks.

- [ ] **Step 1: Write the failing campaign contract test**

Require `WildsCommandDock`, exactly the Mission/Rewards/Deck/Vault item keys, mission badge `${state.missionProgress}%`, rewards badge based on ready state or remaining progress, Vault badge `${state.inventory.length}`, existing `select-asset`, and `WildsInventory`. Reject legacy `<details className="wilds-mission-card">`, `<details className="wilds-command-tray`, and `<details className="wilds-inventory-tray">` markup.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `npx tsx --test tests/wilds-render-contract.test.ts`
Expected: FAIL on missing dock integration and remaining legacy details.

- [ ] **Step 3: Move existing content into command items**

Build four `WildsCommandItem` entries in `PlayCampaign`. Reuse current mission chapter/event/progress markup, reward cards, deck card buttons, and `WildsInventory`; pass existing icons from `Icons`. Mission badge is `state.missionProgress%`; Rewards badge is `100%` when rewards exist, otherwise `state.missionProgress%`; Vault badge is the unshortened `state.inventory.length` value in a bounded superscript container. Remove the old command aside, economy grid, reset button placement, and inventory details wrapper; keep Reset World as a compact action inside Mission.

- [ ] **Step 4: Run the focused test and verify GREEN**

Run: `npx tsx --test tests/wilds-render-contract.test.ts tests/wilds-command-dock.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/play/PlayCampaign.tsx tests/wilds-render-contract.test.ts
git commit -m "feat: move Wilds commands into bottom sheets"
```

### Task 3: Responsive Swipeable Vault Pagination

**Files:**
- Create: `src/features/play/inventory-pagination.ts`
- Modify: `src/features/play/WildsInventory.tsx`
- Create: `tests/inventory-pagination.test.ts`
- Modify: `tests/wilds-render-contract.test.ts`

**Interfaces:**
- Produces: `inventoryPageSize(compact: boolean): 4 | 8`.
- Produces: `clampInventoryPage(page: number, itemCount: number, pageSize: number): number`.
- `WildsInventory` consumes a `matchMedia("(max-width: 820px)")` compact state.

- [ ] **Step 1: Write failing pagination unit tests**

Test exact four/eight page sizes and page clamping for empty, reduced, and multi-page results. Add a render contract requiring pointer-based horizontal swipe, page dots, previous/next accessible labels, and pointer-cancel/lost-capture handling.

- [ ] **Step 2: Run the focused tests and verify RED**

Run: `npx tsx --test tests/inventory-pagination.test.ts tests/wilds-render-contract.test.ts`
Expected: FAIL because the helper and swipe contract do not exist.

- [ ] **Step 3: Implement responsive page sizing and swipe navigation**

Add the pure helpers. In `WildsInventory`, track compact media state, clamp page in an effect when match count or page size changes, show four or eight matches, and add a swipe surface with a 48-pixel horizontal threshold. Ignore mostly vertical gestures, handle cancellation/lost capture, prevent accidental selection after a successful page swipe, add previous/next icon buttons and one page-dot button per page.

- [ ] **Step 4: Run the focused tests and verify GREEN**

Run: `npx tsx --test tests/inventory-pagination.test.ts tests/wilds-render-contract.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/play/inventory-pagination.ts src/features/play/WildsInventory.tsx tests/inventory-pagination.test.ts tests/wilds-render-contract.test.ts
git commit -m "feat: add swipeable compact Wilds vault pages"
```

### Task 4: Premium Responsive Styling

**Files:**
- Modify: `app/globals.css`
- Modify: `tests/wilds-render-contract.test.ts`

**Interfaces:**
- Styles: `.wilds-command-dock`, `.wilds-command-button`, `.wilds-command-badge`, `.wilds-command-backdrop`, `.wilds-command-sheet`, `.wilds-command-handle`, `.wilds-vault-page-dots`.

- [ ] **Step 1: Write the failing visual contract assertions**

Require a four-column dock, at least 44-pixel button targets, fixed-width numeric badges, fixed sheet positioning, safe-area bottom padding, bounded internal scrolling, active/focus/pressed states, backdrop blur, reduced-motion override, two-column mobile vault grid, and four-column wider vault grid.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `npx tsx --test tests/wilds-render-contract.test.ts`
Expected: FAIL on missing dock and sheet CSS selectors.

- [ ] **Step 3: Implement the styles**

Use the existing dark glass, mint, gold, coral, radius, and shadow tokens. Keep the dock centered beneath movement controls. Place the sheet above the storefront toolbar and safe area, cap it at `min(78dvh, 720px)`, scroll content internally, and avoid covering the top HUD. Use a compact two-by-two mobile vault grid and four-by-two wider grid. Add restrained transform/opacity transitions and disable them under `prefers-reduced-motion`.

- [ ] **Step 4: Run the focused test and verify GREEN**

Run: `npx tsx --test tests/wilds-render-contract.test.ts tests/wilds-command-dock.test.ts tests/inventory-pagination.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app/globals.css tests/wilds-render-contract.test.ts
git commit -m "style: polish Wilds command dock and vault sheets"
```

### Task 5: Full Verification and Visual QA

**Files:**
- Modify only if verification identifies a scoped defect.

**Interfaces:**
- No new interfaces.

- [ ] **Step 1: Run repository verification**

Run: `pnpm test && pnpm run typecheck && pnpm run lint && pnpm run build`
Expected: all tests pass, typecheck/lint are clean, and the production build exits 0.

- [ ] **Step 2: Verify mobile interactions in the approved browser**

At a phone viewport, capture default gameplay plus Mission, Rewards, Deck, Vault grid, and selected-card states. Verify open/switch/close, percentage badge fit, Escape, backdrop, swipe-down, horizontal vault paging, page dots, safe-area clearance, and no console errors.

- [ ] **Step 3: Verify desktop fit**

Capture the centered dock and one open sheet at desktop width. Confirm eight-card paging, bounded sheet width, internal scrolling, and unobstructed top HUD.

- [ ] **Step 4: Final commit if QA required fixes**

```bash
git add app/globals.css src/features/play/PlayCampaign.tsx src/features/play/WildsCommandDock.tsx src/features/play/WildsInventory.tsx src/features/play/inventory-pagination.ts tests/wilds-command-dock.test.ts tests/inventory-pagination.test.ts tests/wilds-render-contract.test.ts
git commit -m "fix: finish Wilds command dock QA"
```
