# Wilds Vault Popover Restoration Design

## Outcome

Restore the Card Vault command popover to feature parity with the former dropdown vault while making the experience polished and fully usable on mobile. The popover must scroll reliably, show every vault action without clipped labels, and let the selected card on its stand flip through the exact standalone front-and-back experience.

## Interaction Model

- The Card Vault command continues to open in the existing Wilds command sheet.
- The sheet uses a viewport-safe grid with a bounded content row and one vertically scrollable body.
- The sheet body contains the complete vault experience; no vault header or action group is hidden in popover context.
- Scrolling remains contained within the sheet so the world behind it does not move.
- The close button, backdrop dismissal, Escape behavior, focus restoration, and drag-to-close behavior remain unchanged.
- Horizontal swipes on the vault grid continue to change card pages without selecting a card accidentally.
- Horizontal swipes or direct activation on the selected card flip its complete physical card between front and back.

## Restored Vault Capabilities

The popover preserves every capability available in the former dropdown vault:

- Upload one or more verified card PNGs.
- Upload a verified vault PNG.
- Save the complete portable vault image.
- Save the selected portable card image.
- Fuse eligible cards without removing either parent.
- Search cards and filter by rarity.
- Select cards and navigate paginated vault results by swipe, previous/next buttons, and page dots.
- Set the selected card as the active deck leader.
- Open the selected card's standalone page.
- Verify and list eligible cards on the Exchange.
- Evolve eligible cards and inspect or perform growth and ascension actions.
- Show import, save, verification, listing, and error status messages in context.

User-facing action labels use direct language: `Upload card or vault`, `Save vault image`, and `Save card image`. Existing verification and portable PNG behavior remains authoritative; this work changes presentation and access, not the proof format.

## Selected Card Experience

The vault detail reuses `WildsCardScene` rather than recreating flip behavior inside `WildsInventory`.

- The front is the existing full collectible card.
- The back is the existing standalone `WildsCardBack`, including living-card dossier details, verification state, proof information, lineage, and the exact-card QR link.
- The same tap/click, keyboard, and horizontal-swipe interactions used by the standalone card apply in the vault.
- Front and back preserve the standalone scene's accessibility state, inert inactive face, reduced-motion behavior, and gesture threshold.
- QR generation uses the current origin and selected asset ID so it resolves to the same exact standalone card route.
- The back face keeps its own contained detail scroll without breaking the outer sheet scroll.

## Mobile Layout

On narrow screens, content follows this order:

1. Vault identity and restored action controls.
2. Import/save/fusion feedback.
3. Search and rarity filters.
4. Card grid and page controls.
5. Selected flippable card scene.
6. Selected-card actions, listing, evolution, and growth controls.

The primary action group becomes a polished wrapping grid with large touch targets. Labels remain visible and may wrap onto two lines; they are never replaced by icon-only controls or clipped with ellipses. Inputs and buttons use the full available width when needed. The sheet accounts for the command dock, storefront toolbar, device safe areas, and small landscape viewports.

The selected card scene scales to the available width while preserving its physical card aspect ratio and enough height for both faces. The card back's internal scroll remains discoverable and usable by touch.

Tablet and desktop keep the same capabilities with a wider centered sheet. The inventory may use the roomier responsive arrangement where available, but must retain one clear scroll owner and must not reintroduce truncation.

## Component Boundaries

- `WildsCommandSheet` and its styles own the bounded dialog layout, viewport sizing, and outer scroll region.
- `WildsInventory` owns vault controls, importing, saving, filtering, paging, selection, fusion, listing, evolution, growth, and status messages.
- `WildsCardScene` remains the single source of truth for two-sided card interaction.
- `WildsCardBack` remains the single source of truth for standalone proof and dossier content.
- A small reusable QR/origin adapter may be added if needed so the inventory can supply the same inputs as the standalone page without copying its data or gesture logic.
- Existing card export, vault export, verification, game-state, and exchange functions remain unchanged unless a test exposes a narrowly scoped integration defect.

## Error Handling

- Invalid or tampered uploads retain the existing rejection behavior and visible explanation.
- Save-card failures retain the existing actionable message.
- Save-vault failures receive an equivalent visible status instead of failing silently.
- Missing QR generation must not prevent the card from rendering or flipping; the back renders without the QR until it becomes available.
- Empty and filtered-empty vault states remain usable, and upload controls remain available.

## Verification

Tests are written before implementation changes and cover:

- The vault header and all former capabilities remain rendered inside command-sheet context.
- The selected vault card uses `WildsCardScene`, with the existing standalone front/back component contract intact.
- Upload card/vault, save vault image, and save card image controls have explicit accessible names.
- The command sheet uses a bounded grid row and a vertically scrollable content region.
- Mobile vault actions wrap without hidden labels, ellipsis, or icon-only substitutions.
- Existing responsive page sizing, page clamping, swipe behavior, filtering, selection, and action controls remain present.
- Save-vault and save-card success/failure feedback remains visible.

Browser verification covers a narrow mobile viewport, a short landscape viewport, and desktop. It checks the empty vault, one card, more than one page, front/back flipping, back-face scrolling, outer sheet scrolling from top to bottom, all restored actions, safe-area clearance, keyboard focus, reduced motion, and console errors.

## Non-Goals

- No changes to card or vault proof formats.
- No changes to game progression, card stats, fusion economics, evolution requirements, exchange settlement, or public-card routing.
- No separate vault-only card back.
- No embedded standalone page or duplicated standalone navigation inside the vault.
- No unrelated redesign of the other Mission, Rewards, or Deck command sheets.
