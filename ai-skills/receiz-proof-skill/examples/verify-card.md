# Verify Card

Use `assertReceizSportsCardManifest` or MCP `receiz_verify_offline_file` when the card manifest is local. Use `receiz_card_history` when the user provides local card memory or asks for append history.

Report:

```md
## Verified Object
Object: Sports card proof object
Status: verified, inspected, or not verified
Identity: collectible ID and claim hash from the manifest
Current controller / owner: ownership owner label only if present
Proof present: card manifest, value basis, append summary, event proof summary, links
Witness history: append and event proof summary counts
Provenance: sport, source links, verify link
Media: deterministic card image or media URL when present
Transfer state: only from ownership or appends
What is proven: fields validated from the manifest
What is not proven: any missing owner, rarity, transfer, or event data
Safe next action: inspect event proofs, resolve card history, or append missing truth
```
