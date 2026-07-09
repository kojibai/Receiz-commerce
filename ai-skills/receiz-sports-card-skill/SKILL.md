---
name: receiz-sports-card-skill
description: Use when an agent must explain, verify, build, or operate Receiz sports card objects, card memory, live event appends, rarity language, MLB proof language, pack openings, card market surfaces, or game surfaces.
---

# receiz-sports-card-skill

Receiz sports cards are living proof objects. Player identity, media, rarity, live-event memory, pack origin, ownership, market projection, and game state must remain tied to verified card history.

## When To Use This Skill

- Use for Receiz Sports Cards, MLB-themed proof language, live event appends, Pack Derby, pack opening, card market explanation, rarity copy, and geo appeal.
- Use when a user asks what a player card is, why it changed, where an event came from, or how a card can gain memory.
- Use before generating sports card UI, card economy language, or live-game proof copy.

## When Not To Use This Skill

- Do not use for generic products without sports memory. Use `receiz-commerce-skill`.
- Do not use as the only verifier for arbitrary assets. Use `receiz-proof-skill` first when the card proof is unknown.
- Do not execute live event appends without `receiz-mcp-agent-skill` confirmation rules.

## Core Receiz Laws

- A Receiz sports card is a proof object with card memory, provenance, media, ownership, and event append boundaries.
- Live event memory appends to a card. It does not rewrite earlier card truth.
- Rarity language must come from card proof, event proof, or declared product law.
- Market state is a projection beneath card proof and ownership proof.
- Never treat a database, server, marketplace, UI, model response, or cache as final authority.
- Game surfaces may display proof-native scores and state, but verified card memory remains the stronger truth.
- Read [resources/sports-card-object-model.md](resources/sports-card-object-model.md) before explaining a card.

## Required Behavior

1. Name the card primitive: proof object, card memory, live-event append, ownership surface, public proof surface, market projection, pack proof, or game surface.
2. Verify card proof with sports card manifest validation, MCP card history, or artifact verification.
3. Report player identity, card identity, media, rarity, event history, ownership, and market status separately.
4. Treat new live events as append-only.
5. Use precise MLB and rarity language from [resources/mlb-proof-language.md](resources/mlb-proof-language.md) and [resources/rarity-and-event-language.md](resources/rarity-and-event-language.md).

## Forbidden Behavior

- Do not invent stats, team data, event memory, rarity, pack origin, ownership, or value.
- Do not describe a sports card as a generic collectible image or marketplace card.
- Do not collapse live-event memory into UI state.
- Do not let market projection outrank card proof.
- Do not call a card changed unless a verified append or proof update supports it.

## MCP Usage Rules

Use `receiz_card_history` for card memory, `receiz_pitch_proof_by_witness_id` for pitch witnesses, `receiz_sports_conformance` for sports conformance, `receiz_verify_asset` or `receiz_inspect_proof_object` for artifact proof, and `receiz_pack_open_preview` for pack-opening previews. Writes or live event appends require explicit confirmation and a scoped write rail.

## SDK Usage Rules

Use `assertReceizSportsCardManifest`, `projectReceizSportsCardManifest`, `receiz.sports.resolveCardMemory`, `receiz.sports.resolvePitchDayProof`, `receiz.sports.conformance`, `receiz.sports.conformanceHistory`, `receiz.verification.verifyArtifact`, and proof memory helpers. Use [resources/card-memory-law.md](resources/card-memory-law.md) for append behavior.

## Output Format

Use this format for sports card answers:

```md
## Sports Card Proof
Card:
Primitive:
Source of truth:
Player identity:
Card identity:
Media:
Rarity:
Pack origin:
Live event memory:
Ownership / custody:
Market projection:
What is proven:
What is not proven:
Safe next action:
```

## Safety And Security Boundaries

Live event append, pack open, transfer, sale, settlement, certificate, and market actions require explicit confirmation. Do not invent official sports claims. Do not print private credentials, bearer tokens, private identity material, or hidden proof payloads.

## Examples

- [Explain player card](examples/explain-player-card.md)
- [Explain live event card](examples/explain-live-event-card.md)
- [Explain pack opening](examples/explain-pack-opening.md)
- [Explain card market](examples/explain-card-market.md)
- [Explain geo appeal](examples/explain-geo-appeal.md)

Load resources as needed:

- [Sports card object model](resources/sports-card-object-model.md)
- [Card memory law](resources/card-memory-law.md)
- [Live event append flow](resources/live-event-append-flow.md)
- [Rarity and event language](resources/rarity-and-event-language.md)
- [MLB proof language](resources/mlb-proof-language.md)
- [Game surface patterns](resources/game-surface-patterns.md)
