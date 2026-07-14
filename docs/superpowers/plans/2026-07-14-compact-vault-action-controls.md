# Compact Vault Action Controls Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Card Vault popover's stretched action row with a tasteful compact icon cluster while preserving accessible mobile touch targets and all existing behavior.

**Architecture:** Keep `WildsInventory` markup and action handlers unchanged. Refine only the popover-scoped CSS so the visual controls are 36px squircles centered within 44px layout targets, then protect the treatment with the existing render-contract test and verify it in a narrow real-browser viewport.

**Tech Stack:** React, TypeScript, CSS, Node test runner, Playwright CLI

## Global Constraints

- Import, Save Vault, and Fusion remain icon-only inside the vault popover.
- Each control has a 36px visible squircle within a layout box at least 44px square.
- The controls form a compact right-aligned cluster on desktop and mobile.
- Existing accessible names, tooltips, disabled states, focus treatment, and action behavior remain unchanged.
- Standalone inventory controls outside the popover remain unchanged.

---

### Task 1: Compact the Vault Action Cluster

**Files:**
- Modify: `tests/wilds-render-contract.test.ts`
- Modify: `app/globals.css`

**Interfaces:**
- Consumes: Existing `.wilds-command-sheet-content .wilds-vault-actions` and `.wilds-import-card` selectors.
- Produces: A right-aligned three-control cluster with 44px layout tracks and 36px visible button surfaces.

- [ ] **Step 1: Write the failing render contract**

Add assertions to the restored-vault-controls test:

```ts
assert.match(css, /\.wilds-command-sheet-content \.wilds-vault-actions\s*\{[^}]*grid-template-columns:\s*repeat\(3, 44px\)[^}]*justify-content:\s*end/s);
assert.match(css, /\.wilds-command-sheet-content \.wilds-import-card\s*\{[^}]*width:\s*36px[^}]*min-height:\s*36px[^}]*margin:\s*4px/s);
assert.doesNotMatch(css, /\.wilds-command-sheet-content \.wilds-inventory > header \.wilds-import-card\s*\{[^}]*width:\s*100%/s);
```

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```bash
node --test tests/wilds-render-contract.test.ts
```

Expected: FAIL because the current popover styles use flexible one-third columns, 50–52px controls, and a mobile `width: 100%` override.

- [ ] **Step 3: Implement the minimal popover-scoped CSS**

Replace the stretched action rules with:

```css
.wilds-command-sheet-content .wilds-vault-actions {
  display: grid;
  grid-template-columns: repeat(3, 44px);
  justify-content: end;
  gap: 4px;
}
.wilds-command-sheet-content .wilds-import-card {
  width: 36px;
  min-width: 36px;
  min-height: 36px;
  margin: 4px;
  justify-content: center;
  padding: 0;
  border-radius: 11px;
  text-align: center;
}
.wilds-command-sheet-content .wilds-import-card svg { width: 16px; }
```

Remove the mobile `width: 100%` and `min-height: 52px` overrides. Keep the hidden labels and all non-popover rules intact.

- [ ] **Step 4: Run the focused and full automated checks**

Run:

```bash
node --test tests/wilds-render-contract.test.ts
pnpm test
pnpm typecheck
pnpm lint
pnpm build
```

Expected: the focused contract and full suite pass; typecheck, lint, and production build exit successfully.

- [ ] **Step 5: Verify narrow mobile presentation**

At 390×844, open the Card Vault and confirm:

- The three buttons form a compact right-aligned cluster.
- Each visible surface is 36×36px and each grid track is 44px wide.
- Import opens the file chooser, disabled states remain legible, and no content is truncated.
- The sheet and close button remain fully scrollable and reachable.

- [ ] **Step 6: Commit**

```bash
git add app/globals.css tests/wilds-render-contract.test.ts
git commit -m "style: compact Wilds vault action controls"
```
