# Receiz Wilds Live Multiplayer Design

## Product boundary

This specification defines the first complete live multiplayer slice for Receiz Wilds. Every authenticated player enters a shared regional room, sees nearby players on the same world coordinate system, can exchange moderated messages, can issue or decline a battle challenge, and can complete a server-authoritative card battle. Friendly battles ship immediately. Voluntarily escrowed verified-card stakes are fully specified but remain capability-locked until Receiz exposes an atomic ownership exchange primitive. Wallet, credit-card, or cash-equivalent wagering remains disabled behind a compliance lock and is not part of this release.

The playable loop is: explore the shared map, notice a nearby verified explorer, communicate or challenge them, agree to battle terms, play a deterministic server-authoritative card battle, receive a proof-sealed result, and return to exploration with progression or an atomic card transfer.

## Approaches considered

### Selected: Receiz SDK regional proof rooms

The client talks only to same-origin Wilds multiplayer routes. Those routes use the installed `@receiz/sdk` as the only external state, identity, proof, event, and settlement integration. Each region is a durable URL-addressed Receiz app-state projection. Receiz ID and Connect authorize writes; public app-state reads recover room truth across devices and cold starts; local SDK proof memory retains the last admitted prefix for immediate recovery. A bounded server hot cache may coalesce heartbeats and accelerate reads, but it is never authority and may be discarded at any time.

Room snapshots are published through `receiz.appState.publish` with an idempotency key derived from the region and room revision. Clients recover through `appState.restoreByUrl` or the existing adapter equivalent. Accepted challenges, battle revisions, escrow locks, moderation events, and settlements append durable proof records through Receiz audit, Connect, app-state, and public-store rails. Card battle results carry a Sports-compatible event-proof projection. This keeps the entire external system on Receiz infrastructure without Supabase, Redis, a custom database, or a separate WebSocket service.

### Rejected: custom WebSocket service

A dedicated WebSocket server offers excellent latency and full control, but it adds another deployable, connection routing, scaling, persistence, and operational monitoring before the first shared-world slice proves its value.

### Rejected: browser polling only

Polling a process-global Next.js map is simple, but it loses state on restart and cannot reliably span serverless instances. It is acceptable only as the development adapter, not as the production authority.

### Rejected: third-party realtime database

Supabase, Redis, hosted pub/sub, and similar services duplicate authority already provided by Receiz public app-state, proof append, identity, and settlement rails. They are intentionally excluded.

## Identity and trust

- Multiplayer requires a verified Receiz ID. A browser-generated guest identifier may enter a clearly labeled local practice room but cannot chat publicly, challenge another account, or stake cards.
- Server routes derive the actor from the Receiz session. Client-supplied actor IDs are ignored.
- Presence exposes only the Receiz handle, chosen explorer style, active verified card summary, position, heading, status, and last-seen time. Email, wallet balance, proof secrets, and complete inventory are never broadcast.
- Every card used or staked is checked with `verifyAnyWildsCard`, must belong to the actor, and is pinned to its exact proof digest for the full match.

## Regional world and presence

- The infinite deterministic world is partitioned into square 48×48 world-unit regions. The room key is `wilds:{tenant}:{regionX}:{regionZ}`.
- The client sends position and heading to the same-origin session route at no more than four updates per second and only after meaningful movement. The server rejects impossible teleports beyond 12 units per second unless the player changed regions through a valid boundary crossing. The server coalesces accepted presence into a new Receiz room projection no more than once per second per region.
- Presence expires after 15 seconds without a heartbeat. The client marks a player reconnecting after 6 seconds and removes them after expiry. A cold server restores the latest Receiz room projection before applying new heartbeats.
- The server returns only players in the current region and its eight neighbors. The client renders at most 24 nearest remote explorers, interpolating between accepted positions so network jitter does not create teleporting avatars.
- Remote players use the existing explorer grammar with a distinct nameplate, active-card affinity glow, availability icon, and reduced geometry detail. Decorative map markers are not introduced.
- Selecting a nearby explorer opens a compact interaction sheet. Chat and challenge controls are available inside 10 world units; the UI explains when a player is too far away, busy, private, or offline.

## Chat and safety

- Chat is opt-in per account and defaults off for accounts without a recorded preference.
- The first slice supports nearby room messages and direct challenge messages. Messages are limited to 280 characters, six messages per 10 seconds, and a 50-message visible buffer.
- Server validation removes control characters, rejects URLs and obvious contact-sharing patterns, and records moderation status. The client provides mute, block, and report actions. Blocked players cannot message, challenge, or appear as interaction candidates, though their anonymous collision-free world presence may remain.
- Reports contain actor IDs, message or challenge IDs, timestamps, and proof digests and append through the Receiz audit rail; they do not contain wallet credentials or full card proof payloads.

## Challenge lifecycle

A challenge is an append-only state machine:

`offered → accepted → locked → active → settled`

It may instead end as `declined`, `expired`, `cancelled`, or `void`.

- The challenger selects friendly mode and one active verified card. Card-stake mode becomes selectable only when the Receiz capability response confirms atomic ownership exchange; it then permits one owned verified card per player as the stake.
- The opponent sees both active-card summaries, exact stake cards, rules, and expiry before accepting.
- Offers expire after 45 seconds. Either player may cancel before acceptance. After acceptance, neither player may change the pinned cards.
- A player may participate in only one accepted or active challenge at a time.
- Cash, wallet, and credit-card controls appear as `Compliance locked` and cannot create a challenge or payment intent.

## Server-authoritative PvP battle

- A new pure `pvp-battle-engine` reuses the existing card stat projection but models two human participants instead of a human and wild creature.
- The server creates a deterministic seed from challenge ID, both pinned proof digests, and accepted timestamp. Each player starts with their selected card’s sealed health, power, guard, and speed.
- Each turn has a 20-second decision window. Players submit one signed intent: first ability, second ability, guard, or switch to another predeclared verified deck card. No capture action exists in PvP.
- The server accepts at most one intent per player per turn, resolves both after both arrive or the deadline expires, orders equal-priority actions by speed and deterministic tie-break, appends the transcript entry, and publishes the next revision.
- Missing an action produces guard. Three consecutive missed turns forfeits. Disconnect gives a 30-second reconnect grace period before forfeit.
- A match ends when one legal deck has no conscious cards, a player forfeits, or the server voids an invalid state. The result includes winner, reason, transcript digest, pinned card proofs, and server sequence.
- Only server-issued match revisions change the multiplayer UI. Optimistic client animations may play, but they reconcile to the authoritative revision.

## Card escrow and settlement

- Friendly matches never change ownership.
- Card-stake acceptance creates an escrow record pinning one verified card from each owner. The cards remain visible in inventory but become unavailable for listing, sending, fusion, evolution, or another match.
- Settlement transfers both staked cards atomically to the winner through the existing Receiz store-state ownership ledger semantics, then appends a Receiz proof result. If proof verification, ownership, or publication fails, settlement remains pending and neither card is released to either side until retry or a server void restores both owners.
- Draws and void matches release both cards without transfer. Duplicate settlement keys are idempotent.
- The client never performs ownership transfer directly and never treats animation completion as settlement.

## API and Receiz SDK boundaries

Same-origin routes:

- `POST /api/wilds/multiplayer/session`: join or heartbeat with accepted position and privacy state.
- `GET /api/wilds/multiplayer/snapshot`: nearby presence, messages, challenges, and active match revisions after a Receiz room-revision cursor. The route supports bounded long polling so interpolation remains live without a separate WebSocket provider.
- `POST /api/wilds/multiplayer/message`: submit, mute, block, or report.
- `POST /api/wilds/multiplayer/challenge`: offer, accept, decline, or cancel.
- `POST /api/wilds/multiplayer/battle`: submit one turn intent or reconnect.

All mutations require the Receiz session, validate bounded JSON payloads, return monotonic Receiz room revisions, and use idempotency keys. `ReceizMultiplayerLedger` is the only server persistence boundary. It publishes public sanitized room projections with `receiz.appState.publish`, restores them by URL, appends authority-sensitive events through delegated Receiz audit or Connect actions, records battle outcomes as proof/event projections, and projects ownership settlement through the existing Receiz store-state append rail. Clients always recover authoritative state through the snapshot route; an in-memory value is only a verified hot projection of the latest admitted Receiz revision.

Receiz app-state records stay under the SDK's 2 MiB and 50-record feed limits. Each region projection is compact and bounded: 24 visible presences, 50 sanitized room messages, 20 open challenges, one summary per active match, and append anchors for older proof history. Completed transcripts and settlement proofs live in their own URL-addressed proof records instead of expanding the room projection forever.

## Receiz SDK additions that benefit every realtime developer

The installed SDK is sufficient to ship shared presence, chat, friendly challenges, deterministic battles, durable room recovery, audit history, and proof-projected results without any third party. Three small first-party primitives would materially strengthen the platform and unlock stake custody without app-specific workarounds:

1. `appState.appendRecord(record, { expectedHead, idempotencyKey })`: a compare-and-append mutation that returns the new Kai/append head or a typed `head_conflict`. This prevents two concurrent region writers from overwriting one another and is broadly useful for collaborative apps, games, auctions, and inventories.
2. `appState.streamByNamespace(namespace, { afterKaiUpulse, signal })`: an async-iterable server-sent event stream of verified additions. The current `restoreByUrl`, namespace reads, Events API, and bounded long polling are enough for correctness; this primitive reduces latency and repeated reads while keeping the append ledger authoritative.
3. `assets.escrowExchange({ assetIdsByOwner, winnerReceizId, reason, proofDigest }, { idempotencyKey })`: one atomic custody primitive that verifies current ownership, locks the exact proof revisions, and either transfers every asset or none. A generalized `ownership.exchange` name is equally suitable. Card-stake mode remains disabled until this primitive or an equivalent atomic Receiz ownership operation exists.

A typed `eventProof.create()` helper would also improve developer ergonomics for battle, tournament, achievement, and lineage proofs, but it is not a release blocker because the current app-state, audit append, Connect record, and proof projection rails can carry the same sealed event record.

## Client experience

- A compact `LIVE` control shows connection quality and nearby-player count without consuming the game viewport.
- Remote explorers appear only when the server confirms presence; their positions interpolate smoothly and nameplates remain readable without covering discovery clues.
- Tapping a remote explorer opens the interaction sheet. Accepting a challenge transitions both players into the existing premium battle presentation adapted for two card teams.
- The match result ceremony shows the proof-sealed transcript digest, progression, and settlement status. Card-stake winners do not see the new card as owned until the server confirms atomic settlement.
- Loss of realtime transport changes the badge to reconnecting, freezes remote interpolation, preserves the local discovery game, and disables new multiplayer mutations until recovery.

## Error handling and abuse resistance

- All payloads have explicit length, count, numeric, and enum bounds.
- Position spoofing, replayed intents, stale challenge revisions, foreign cards, modified proofs, duplicate actions, and duplicate settlement requests are rejected server-side.
- Rate limits exist for heartbeats, snapshots, messages, challenges, reports, and battle intents.
- Local development uses Receiz SDK in-memory proof memory for admitted history and the same validation and state transitions as production. When delegated Receiz access is unavailable, the UI labels the room `Local practice`; it never represents that fallback as a globally shared or stake-capable room.
- The UI distinguishes offline, reconnecting, declined, expired, forfeit, settlement pending, void, and compliance-locked states with actionable copy.

## Verification

- Pure tests cover region calculation, visibility bounds, presence expiry, movement validation, moderation, challenge transitions, deterministic PvP replay, deadlines, forfeit, exact card pinning, escrow conflicts, idempotent settlement, draw release, and tamper rejection.
- Route tests prove session-derived authority and bounded payloads.
- Two independent browser contexts must see each other move, exchange an allowed message, challenge and accept, complete a deterministic friendly battle, and recover after a refresh.
- When the Receiz atomic ownership-exchange capability is available, a card-stake browser test must lock both cards, settle once, update both inventories, and preserve the proof transcript. Until then, a capability test proves the control remains locked and creates no custody mutation.
- Desktop and mobile browser checks cover avatar selection, proximity interaction, battle controls, reconnecting, blocked-player behavior, and no console errors.
- Lint, typecheck, the complete unit suite, and the production Next build must pass.

## Explicitly deferred regulated wagering

Wallet balances, credit-card funds, cash-equivalent prizes, pooled stakes, rake, odds, and paid tournament entry are not activated by this design. A later specification must define jurisdiction controls, age and identity verification, geofencing, responsible-play controls, licensing, custody, chargebacks, AML/KYC obligations, tax reporting, dispute handling, and provider approval before any such control becomes operational.
