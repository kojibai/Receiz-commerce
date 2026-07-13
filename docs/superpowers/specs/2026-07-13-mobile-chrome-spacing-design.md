# Mobile Chrome Spacing Design

## Goal

Remove the empty band above the floating mobile toolbar and reduce the mobile header's vertical footprint without sacrificing bottom safe-area clearance or access to the final scrollable content.

## Layout contract

- The bottom toolbar remains fixed, inset, rounded, translucent, and visually floating.
- The active mobile pane extends behind the toolbar instead of ending above a reserved toolbar band.
- The pane receives bottom scroll padding equal to the toolbar footprint plus the device safe-area inset. This clearance appears only when the user reaches the end of the content; it does not create a permanent white band above the toolbar.
- The toolbar keeps clearance below it through its existing bottom inset and the device safe area.
- The mobile header uses a smaller brand mark, tighter padding, reduced type, and a compact account control. Store identity and proof status remain readable.
- The layout applies across the existing mobile breakpoint, with an additional narrow-phone refinement at 390px.

## Accessibility and interaction

- Toolbar buttons retain their current labels, hit targets, active state, and five-column arrangement.
- Content remains scrollable behind the toolbar, while the final control can scroll fully above it.
- Safe-area handling continues to support devices with a home indicator.

## Verification

- Add a CSS contract test that rejects the old viewport calculation reserving a toolbar band.
- Assert the expanded stage height, bottom scroll padding, compact header sizing, and safe-area-aware toolbar inset.
- Verify at 390x844 in the rendered storefront: no blank band above the toolbar, clearance below it, shorter header, no clipping, and responsive toolbar interaction.
- Run the full test suite and TypeScript typecheck.
