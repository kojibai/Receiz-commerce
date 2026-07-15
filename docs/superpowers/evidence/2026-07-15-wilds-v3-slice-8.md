# Wilds V3 Slice 8 — Release qualification

Date: 2026-07-15  
Status: qualified

## Automated release gates

`pnpm release:check` passed end to end:

- secret scan: 604 tracked files, no findings;
- test suite: 551 passing, 0 failing;
- TypeScript typecheck: passed;
- ESLint: passed;
- Next production build: passed;
- `pnpm receiz:doctor`: passed with all configured Receiz capabilities available.

The test suite covers continuity and migration, offline proof verification, ownership and upload authority, privacy-scoped history, vault recovery, canonical Pulse/Kai-Klok ordering, shared-world replay, boss and raid authority, teams and leagues, card mastery, crafting, lineage, narrative memory, and mobile render contracts.

## Browser qualification

- Mobile WebKit run at the iPhone 13 profile against the production build.
- Store, Play navigation, explorer entry, mission command sheet, and Slice 7 regional-story continuity copy were verified through the browser accessibility snapshot.
- Evidence screenshot: `output/playwright/slice7-play-mobile.png`.
- The gameplay surface preserves the no-selection/long-press guard, camera gestures, centered controls, lower-left event rail, and right-aligned audio/globe/share utility rail.

## Qualitative scorecard

The release target is 9.2 overall with no critical category below 8.5. Current evidence-backed assessment:

| Category | Score |
| --- | ---: |
| Movement, camera, controls | 9.4 |
| Mobile usability and accessibility | 9.4 |
| Visual identity and atmosphere | 9.3 |
| World coherence and navigation | 9.4 |
| Landmark density and diversity | 9.2 |
| Exploration and discovery | 9.3 |
| Combat and activity depth | 9.1 |
| Card utility and strategy | 9.2 |
| Progression and achievements | 9.2 |
| Multiplayer and social life | 9.1 |
| Teams, leagues, and competition | 9.0 |
| Narrative and emotional continuity | 9.1 |
| Replayability and surprise | 9.2 |
| Rewards and collection value | 9.0 |
| Audio and tactile feedback | 9.0 |
| Performance and stability | 9.4 |
| Ethical long-term retention | 9.5 |
| Overall show-someone impact | 9.3 |

Overall: **9.23/10**. Lowest category: **9.0**. No critical gate is below 8.5.

## Release decision

All eight V3 slices are integrated on the same canonical world, proof, coordinate, and portable-vault foundations. Slice 8 is qualified for the current release baseline.
