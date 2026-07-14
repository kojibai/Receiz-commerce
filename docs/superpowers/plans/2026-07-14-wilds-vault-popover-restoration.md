# Wilds Vault Popover Restoration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore complete vault controls and reliable mobile scrolling in the Card Vault popover, and reuse the exact standalone two-sided card scene for the selected card.

**Architecture:** Keep `WildsInventory` as the owner of vault operations and replace its front-only selected-card render with `WildsCardScene`. Generate the standalone QR inputs locally in the inventory with the same `qrcode` and `standaloneCardUrl` contract used by `WildsCardPage`. Fix the command sheet's grid sizing and add scoped responsive vault styles so one outer sheet body scrolls while the card back retains its contained inner scroll.

**Tech Stack:** Next.js 15, React 19, TypeScript, CSS, Node test runner, QRCode.

## Global Constraints

- Reuse `WildsCardScene` and `WildsCardBack`; do not create a vault-only back or duplicate flip behavior.
- Preserve upload verification, portable PNG proof formats, game progression, fusion, evolution, listing, and public-card routing.
- Use the labels `Import card or vault`, `Save vault image`, and `Save card image`.
- All mobile labels remain visible and may wrap; no icon-only replacement, clipping, or ellipsis.
- Preserve sheet dismissal, focus restoration, drag-to-close, inventory paging/swiping, and safe-area behavior.

---

### Task 1: Lock in the restored vault contract

**Files:**
- Modify: `tests/wilds-render-contract.test.ts`
- Test: `tests/wilds-render-contract.test.ts`

**Interfaces:**
- Consumes: existing source-contract test helpers and project files.
- Produces: regression coverage for restored actions, exact card-scene reuse, QR inputs, and scroll/layout CSS.

- [ ] **Step 1: Write the failing contract assertions**

Extend the inventory/rendering test with assertions equivalent to:

```ts
assert.match(inventory, /import QRCode from "qrcode"/);
assert.match(inventory, /standaloneCardUrl/);
assert.match(inventory, /<WildsCardScene asset=\{selected\} origin=\{origin\} qr=\{qr\}/);
assert.match(inventory, />Import card or vault</);
assert.match(inventory, />Save vault image</);
assert.match(inventory, />Save card image</);
assert.match(inventory, /setVaultMessage/);
assert.doesNotMatch(inventory, /<WildsCard asset=\{selected\}/);
assert.doesNotMatch(css, /\.wilds-command-sheet-content \.wilds-inventory > header \{ display: none; \}/);
assert.match(css, /\.wilds-command-sheet\s*\{[^}]*grid-template-rows:\s*auto auto minmax\(0, 1fr\)/s);
assert.match(css, /\.wilds-command-sheet-content\s*\{[^}]*overflow-y:\s*auto/s);
assert.match(css, /\.wilds-command-sheet-content \.wilds-vault-actions\s*\{[^}]*grid-template-columns/s);
assert.match(css, /\.wilds-command-sheet-content \.wilds-import-card span\s*\{[^}]*white-space:\s*normal/s);
```

- [ ] **Step 2: Run the contract test and verify RED**

Run: `pnpm test`

Expected: FAIL in the Wilds rendering contract because `WildsInventory` still uses `WildsCard`, old download/import labels, no vault failure status, the header is hidden, and the sheet has no explicit bounded content row.

- [ ] **Step 3: Commit the failing contract test**

```bash
git add tests/wilds-render-contract.test.ts
git commit -m "test: cover restored Wilds vault popover"
```

### Task 2: Restore actions and exact standalone card flipping

**Files:**
- Modify: `src/features/play/WildsInventory.tsx`
- Test: `tests/wilds-render-contract.test.ts`

**Interfaces:**
- Consumes: `WildsCardScene({ asset, origin, qr })`, `standaloneCardUrl(assetId, origin)`, `downloadPortableCard`, and `downloadPortableVault`.
- Produces: full vault action header, `vaultMessage` feedback, and selected-card scene with exact standalone back.

- [ ] **Step 1: Add standalone scene inputs**

Replace the direct `WildsCard` import with `QRCode`, `standaloneCardUrl`, and `WildsCardScene`. Add state:

```ts
const [vaultMessage, setVaultMessage] = useState("");
const [origin, setOrigin] = useState("https://receiz.app");
const [qr, setQr] = useState("");
```

Add effects that set `origin` from `window.location.origin` and regenerate the selected card QR without preventing rendering on failure:

```ts
useEffect(() => { setOrigin(window.location.origin); }, []);
useEffect(() => {
  if (!selected) { setQr(""); return; }
  let active = true;
  void QRCode.toDataURL(standaloneCardUrl(selected.id, origin), {
    errorCorrectionLevel: "M", margin: 4, width: 160
  }).then((value) => { if (active) setQr(value); }).catch(() => { if (active) setQr(""); });
  return () => { active = false; };
}, [origin, selected]);
```

- [ ] **Step 2: Restore and relabel all header actions**

Keep the existing file input verification logic and the familiar `Import card or vault` wording, alongside `Save vault image` and `Fuse cards`. Wrap vault download in `try/catch`:

```ts
onClick={async () => {
  setVaultMessage("Preparing portable vault image…");
  try {
    await downloadPortableVault(state.inventory);
    setVaultMessage("Vault image saved with every verified card sealed inside.");
  } catch (error) {
    setVaultMessage(error instanceof Error ? `Vault save failed: ${error.message}` : "Vault save failed. Try again from this browser.");
  }
}}
```

Render `vaultMessage` with `role="status"` alongside the existing import feedback.

- [ ] **Step 3: Replace the front-only card and relabel card save**

Replace:

```tsx
<WildsCard asset={selected} />
```

with:

```tsx
<WildsCardScene asset={selected} origin={origin} qr={qr} />
```

Keep the existing `downloadPortableCard` error handling and change its visible label to `Save card image`.

- [ ] **Step 4: Run tests and verify GREEN for behavior contracts**

Run: `pnpm test`

Expected: remaining failures only concern CSS assertions from Task 1; TypeScript compilation succeeds for the new scene and QR integration.

- [ ] **Step 5: Commit the behavior change**

```bash
git add src/features/play/WildsInventory.tsx
git commit -m "feat: restore vault actions and card flipping"
```

### Task 3: Make the popover scroll reliably and polish mobile layout

**Files:**
- Modify: `app/globals.css`
- Test: `tests/wilds-render-contract.test.ts`

**Interfaces:**
- Consumes: existing `.wilds-command-sheet`, `.wilds-command-sheet-content`, `.wilds-inventory`, `.wilds-vault-actions`, and `.wilds-card-scene` elements.
- Produces: one bounded outer scroll area, visible wrapping actions, and a correctly scaled selected-card scene.

- [ ] **Step 1: Bound the sheet's scroll row**

Add `grid-template-rows: auto auto minmax(0, 1fr)` to `.wilds-command-sheet`. Change the content region to explicit vertical scrolling and touch momentum:

```css
.wilds-command-sheet-content {
  min-height: 0;
  overflow-x: hidden;
  overflow-y: auto;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
}
```

- [ ] **Step 2: Reveal and style the complete vault header in sheet context**

Remove the rule that hides `.wilds-command-sheet-content .wilds-inventory > header`. Add scoped styles:

```css
.wilds-command-sheet-content .wilds-inventory > header {
  grid-template-columns: minmax(0, 1fr);
  align-items: stretch;
}
.wilds-command-sheet-content .wilds-vault-actions {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}
.wilds-command-sheet-content .wilds-import-card {
  min-width: 0;
  min-height: 48px;
  justify-content: center;
  text-align: center;
}
.wilds-command-sheet-content .wilds-import-card span {
  overflow: visible;
  text-overflow: clip;
  white-space: normal;
}
```

- [ ] **Step 3: Fit the standalone card scene inside vault detail**

Add vault-scoped sizing that retains the physical aspect ratio without standalone-page viewport dimensions:

```css
.wilds-inventory-detail .wilds-card-scene {
  width: min(100%, 380px);
  min-height: 0;
  aspect-ratio: 5 / 7;
}
.wilds-inventory-detail .wilds-card-float { height: 100%; }
```

At `max-width: 560px`, use two action columns, make the last action span both columns when odd, force search/filter to one column, keep all labels visible, and ensure the sheet's bottom inset remains above navigation.

- [ ] **Step 4: Run the focused and full checks**

Run: `pnpm test`

Expected: PASS.

Run: `pnpm typecheck`

Expected: PASS with no TypeScript errors.

Run: `pnpm lint`

Expected: PASS with no new lint errors.

- [ ] **Step 5: Commit the responsive layout**

```bash
git add app/globals.css tests/wilds-render-contract.test.ts
git commit -m "fix: make Wilds vault popover fully scrollable"
```

### Task 4: Browser verification and final regression check

**Files:**
- Modify if required by observed defects: `src/features/play/WildsInventory.tsx`, `app/globals.css`, `tests/wilds-render-contract.test.ts`

**Interfaces:**
- Consumes: completed vault popover and existing local dev server workflow.
- Produces: verified mobile and desktop interaction with no console errors.

- [ ] **Step 1: Start the app and inspect mobile portrait**

Run: `pnpm dev`

Open the Wilds world at a narrow phone viewport. Open Card Vault and verify the action labels, vertical scroll from header through growth controls, card selection, page buttons/swipe, front/back flip, and back-face internal scroll.

- [ ] **Step 2: Inspect short landscape and desktop**

Verify no action or selected-card controls are truncated, the sheet clears bottom navigation and safe areas, and desktop remains centered and scrollable.

- [ ] **Step 3: Check functional actions and console**

Exercise upload chooser activation, save-vault image, save-card image, standalone link, and any enabled selection/evolution/listing controls. Confirm success/error feedback remains visible and the browser console has no new errors.

- [ ] **Step 4: Fix only observed in-scope defects test-first**

For each defect, add a failing assertion to `tests/wilds-render-contract.test.ts`, run `pnpm test` to see the expected failure, apply the smallest source/CSS fix, and rerun until green.

- [ ] **Step 5: Run final verification and commit**

Run: `pnpm test && pnpm typecheck && pnpm lint && pnpm build`

Expected: all commands PASS.

```bash
git add src/features/play/WildsInventory.tsx app/globals.css tests/wilds-render-contract.test.ts
git commit -m "test: verify restored Wilds vault experience"
```
