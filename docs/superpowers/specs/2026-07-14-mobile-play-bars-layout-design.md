# Mobile Play Bars Layout Design

## Goal

Recover vertical space at the top of the mobile storefront and keep the Wilds command bar fully visible above the app navigation on every supported small-screen height.

## Current Evidence

At 390×844, the global brand/profile header measures 48px and the `Play / Game on` row measures 24px. The Wilds command bar overlaps the fixed app navigation by 4.9px. At 375×667, normal document flow pushes the command bar 71.5px into and beyond the app navigation. The fixed app navigation and the in-flow Wilds bar currently use separate spacing assumptions, so the existing 86px wrapper padding cannot guarantee clearance.

## Layout Design

The mobile brand/profile header becomes a compact 44px row. The brand mark and profile button use smaller visible surfaces while retaining clear, centered icons and readable store identity text. The change applies to the mobile storefront header across app sections so the top chrome remains consistent.

The Play panel receives a dedicated class so only its heading can be compressed without changing headings on Store, Exchange, Rewards, Assets, or Account. Its `Play / Game on` row becomes 20px tall with proportionally reduced title and status-pill styling.

The Wilds command system leaves normal document flow on mobile and becomes fixed above the app navigation. Both bars use shared CSS geometry for the app-navigation bottom inset and height. The Wilds bar sits at least 8px above the app navigation, including device safe-area insets, and remains horizontally centered within the mobile content margins. Its existing icon controls and touch-target sizes remain unchanged.

The Play panel reserves enough bottom space for both fixed bars so scrollable game content does not finish underneath them. Command sheets remain fixed overlays and retain their existing header clearance, scrolling, close control, and safe-area behavior.

## Alternatives Considered

- A sticky Wilds bar within the Play pane could follow scrolling but still depends on the pane's content height and fails on very short screens.
- Increasing wrapper padding while leaving the bar in flow would reduce overlap at one viewport but retain the same fragile relationship between content height and fixed navigation.
- A fixed Wilds bar based on shared app-navigation geometry is selected because it guarantees consistent separation independent of viewport height or game content length.

## Accessibility and Interaction

- Existing Wilds command touch targets, labels, focus states, and badge values remain unchanged.
- The brand and profile controls remain fully visible and reachable.
- The global app navigation retains its current targets, labels, and safe-area offset.
- The Wilds command bar never intercepts app-navigation taps because the bars have a physical gap rather than overlap resolved only by z-index.

## Verification

- A render contract protects the dedicated Play pane class, compact header dimensions, shared bottom-navigation geometry, fixed Wilds command placement, and minimum 8px separation.
- Browser verification covers 390×844 and 375×667 viewports.
- At both sizes, measured Wilds-command clearance above the app navigation must be at least 8px, the global header must be no taller than 44px, and the Play heading must be no taller than 20px.
- Browser verification also checks that the command bar, app navigation, profile button, and vault close control remain clickable with no truncation or console errors.
- The full automated test suite, typecheck, lint, and production build remain clean.
