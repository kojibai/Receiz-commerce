# Compact Vault Action Controls Design

## Goal

Make the Card Vault popover's Import, Save Vault, and Fusion controls substantially smaller and more tasteful without reducing usability or changing their behavior.

## Design

Inside the vault popover, the three icon-only actions become a compact, right-aligned cluster instead of three stretched grid columns. Each control has a 36px visible squircle with restrained padding, border, and icon sizing. Its layout box remains at least 44px square so touch interaction stays comfortable on mobile. Existing accessible names, tooltips, disabled states, focus treatment, and click behavior remain unchanged.

The compact presentation applies at desktop and mobile popover sizes. The standalone inventory outside the popover retains its current labeled controls. Feedback messages continue to occupy their own full-width row below the header content.

## Alternatives Considered

- Keep the three-column row but reduce its height: simpler, but the controls still look oversized because each button stretches horizontally.
- Use 44px visible buttons: safe and conventional, but not a meaningful enough reduction from the current 50–52px controls.
- Use 36px visible controls with 44px layout targets: selected because it delivers the refined appearance while preserving mobile usability.

## Verification

- A render contract protects the compact cluster, 36px visible treatment, and 44px minimum target.
- Browser verification at 390×844 confirms that the cluster is balanced, not truncated, and fully tappable.
- Existing tests, typecheck, lint, and production build remain green.
