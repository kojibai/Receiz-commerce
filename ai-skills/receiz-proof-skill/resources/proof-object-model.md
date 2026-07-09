# Proof Object Model

## Required Shape

A Receiz proof object carries enough structure to be inspected or recomputed without letting a weaker layer become authority.

Core fields and evidence may include:

- deterministic identity such as asset ID, collectible ID, proof ID, claim hash, witness ID, or Receiz ID
- sealed payload, proof bundle, manifest, signature, hash, wireproof, or integrity material
- provenance, source snapshot, owner/custody, or chain state
- media or attached payload
- append, transfer, settlement, event, or verification history
- Kai/Klok coordinate such as `kaiPulseEternal`, `kai_upulse`, or known proof head
- verify URL, inspect behavior, local validator, or offline verifier

## Implemented SDK Payloads

- `receiz.asset_manifest.v1`: asset ID, asset type, `receiz.proof_bundle`, owner, media, appends, settlement, links.
- `receiz.sports_arena.card_manifest.v1`: sport, collectible ID, claim hash, card, ownership, value basis, append summary, event proof summary, links.
- `receiz.webhook_event.v1`: delivery envelope for append, transfer, score, event proof, wallet, note, market, or profile visibility events. Verify the underlying proof object before treating the event as product truth.
- `receiz.sdk.proof_register.v1`: admitted local proof memory with a known head for append-only sync.

## Projection Rule

Projection is display preparation. It is not proof authority. Use projectors to render rows, title, media, owner label, value, score, append counts, and verify links after validation.

## Subpayload Rule

When a subpayload is embedded inside a stronger artifact, verify the stronger artifact first. A subpayload hash validates deterministic projection only. Ownership, access, transfer, settlement, and public proof bind to the enclosing stronger primitive unless Receiz law defines the subpayload as its own sealed proof object.
