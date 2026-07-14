# Mobile Game Controls Dedicated Space Design

## Goal

Eliminate every overlap among the 3D world, D-pad and game actions, Wilds command dock, and storefront app navigation on mobile.

## Root Cause

The previous correction fixed the Wilds command dock above the storefront navigation. However, making the dock fixed removed it from layout while the D-pad and game actions remained in the same screen region. At 375×667, the 62px dock covers all 62px of its intersection with the 82px D-pad and covers the full 36px action-button row. Wrapper padding cannot move these controls because the game stage and control row have their own sizing rules.

## Layout Design

The mobile Play pane reserves all space above the fixed storefront navigation and its 8px safety gap. Inside that reserved area, the Wilds panel becomes a height-constrained grid with two major rows: the game world and the command dock. The command dock returns to normal document layout, so it physically occupies its own row and cannot cover gameplay.

The game world becomes a nested two-row grid. The 3D stage receives the flexible `minmax(0, 1fr)` row and therefore absorbs all height reductions. The world-control row receives a fixed compact height. On mobile, the trackpad/D-pad shrinks from 82px to 68px and the action buttons use a compact 32px visible height while preserving their accessible names and usable horizontal targets.

The resulting vertical order is always:

1. 3D world viewport
2. D-pad and game actions
3. Wilds command dock
4. Storefront app navigation

Every adjacent region has at least 8px of physical separation. No z-index arrangement is used to disguise an overlap.

## Short and Standard Screens

At 375×667, the 3D world becomes shorter so the compact 68px control row, 62px command dock, and 56px app navigation remain simultaneously visible. At 390×844, the 3D world expands into the additional available height while the three control regions retain stable dimensions.

The compact 44px global header and 20px `Play / Game on` row remain unchanged.

## Sheets and Interaction

Wilds command sheets remain fixed modal overlays because opening a mission, reward, deck, or vault intentionally replaces the current interaction layer. The Card Vault remains scrollable with its close control clear of the top header. Closing a sheet restores the dedicated-row gameplay layout.

## Verification

- Render contracts reject fixed positioning on the mobile Wilds command system and require dedicated grid rows.
- At 375×667 and 390×844, browser measurements must show zero intersection between the world-control row and command dock, plus at least 8px between the command dock and storefront navigation.
- The trackpad measures no more than 68px on the short viewport and all four game action buttons remain clickable.
- Scrolling or interacting with the world cannot move one control region over another.
- The vault opens, scrolls, and closes correctly.
- The full test suite, typecheck, lint, and production build remain clean.
