# Wilds Mobile Command Dock Design

## Outcome

Keep the playable world, movement control, and every supporting game command inside one refined mobile viewport. Replace the vertically expanding Mission, Rewards, Deck, and Vault panels with a compact four-icon command dock. Each command opens as a focused bottom sheet over the game rather than pushing the page downward.

## Interaction Model

- The dock contains four familiar icon buttons: Mission, Rewards, Deck, and Vault.
- Buttons retain accessible names and tooltips, but visible labels are omitted on compact mobile layouts.
- Mission and Rewards display their current percentage as a compact numeric badge or progress ring integrated into the icon; Vault displays the live number of owned cards as a small superscript-style badge at the icon's upper-right corner. These values never widen the dock or become separate body text.
- Tapping an inactive command opens its sheet. Tapping the active command, the backdrop, the close button, or dragging the sheet down closes it.
- Opening one command closes the previous command; only one sheet exists at a time.
- The sheet enters from the bottom with restrained spring motion and respects reduced-motion preferences.
- The sheet uses a drag handle, rounded upper corners, a dimmed non-blocking world backdrop, body-scroll containment, Escape dismissal, and focus restoration to the originating dock button.
- The dock remains reachable above the storefront navigation and device safe-area inset.

## Content

### Mission

Shows current chapter, cycle, element, objective, mission progress, world event, permanent mastery, and reward. Existing game-state calculations remain authoritative.

### Rewards

Shows locked progress or earned portable rewards with their business use and value. Existing reward state remains authoritative.

### Deck

Shows every owned card as a compact horizontally scrollable roster. Selecting a card immediately dispatches the existing `select-asset` intent and updates the active leader.

### Vault

Preserves import, export, fusion, filtering, card selection, standalone view, portable download, listing, evolution, and growth actions.

- Mobile pages contain four cards in a two-by-two grid.
- Wider layouts contain eight cards per page.
- Horizontal swipe changes pages without triggering accidental card selection.
- Previous/next icon controls and compact page dots provide equivalent non-swipe navigation.
- Page position resets when search or rarity filters change and clamps when inventory size changes.
- Selecting a card reveals its full card and actions within the same scroll-contained sheet.

## Visual Direction

Use the existing Wilds dark glass, mint, gold, and coral system. The dock is a compact floating glass capsule with four equal 44-pixel-or-larger touch targets, crisp existing icon-library glyphs, active glow, pressed depth, focus ring, and tasteful fixed-width percentage badges where meaningful. The sheet is visually subordinate to the world and avoids dashboard-like nested cards.

## Responsive Behavior

- Mobile: dock sits directly beneath the movement control; sheets use the available height up to the top HUD safe zone and scroll internally.
- Tablet and desktop: the same dock and sheet interaction remains consistent, with a wider centered sheet and eight-card vault pages.
- Portrait and landscape layouts respect `env(safe-area-inset-bottom)` and never place controls beneath the storefront toolbar.

## Accessibility and Input

- Icon buttons expose descriptive `aria-label`, `aria-pressed`, and `aria-controls` relationships.
- The active sheet uses dialog semantics, has a labelled heading, supports Escape, and restores focus on close.
- Pointer drag handles `pointerup`, `pointercancel`, and lost capture safely.
- Swipe is supplemental; all actions remain keyboard and button accessible.
- Touch targets are at least 44 CSS pixels where practical.

## Component Boundaries

- `WildsCommandDock` owns active-command selection and dock button semantics.
- `WildsCommandSheet` owns overlay, dismissal, focus, swipe-down, and safe-area behavior.
- `PlayCampaign` supplies existing mission, reward, deck, and vault content and dispatches existing game intents.
- `WildsInventory` owns responsive page sizing and horizontal page swipe without duplicating inventory rules.

## Verification

- Contract tests first for the four commands, single-sheet behavior, dialog semantics, and responsive vault page sizes.
- Interaction tests for open/switch/close, Escape, backdrop, focus restoration, deck selection, and vault page navigation.
- Mobile screenshots for default gameplay, each sheet, and vault card detail.
- Desktop screenshot for the centered sheet.
- Check longest values, empty vault, one card, more than one page, filtered results, safe areas, reduced motion, and console errors.
- Run the full test suite, typecheck, lint, and production build.

## Non-Goals

- No changes to game progression, card proof, exchange settlement, capture flow, or movement mechanics.
- No new routes or replacement artwork.
- No removal of existing vault capabilities.
