# App Patterns

## No-Db Storefront

1. Resolve public store by host.
2. Render the returned `storeStateRecord` immediately.
3. Show proof, product, media, seller, and claim affordances from the record.
4. Let admin save publish a new public-store append.
5. Store the known append head when returned.

## Product Page

Use a product proof object or public-store product record as the first paint. Link to verify/source material. Do not prove ownership or stock from the visual product tile alone.

## Marketplace

A marketplace is a projection over proof objects, ownership state, settlement state, and public store state. Use public reads and proof query for discovery, but keep object verification available per item.

## Pack Opening App

Preview may be deterministic. Issuance requires verified pack receipt, pack ID, reward lane, card claims, and append state. Do not issue cards from preview alone.

## Profile Vault

Render owned proof objects as proof objects. Preserve custody, transfer, certify, inspect, sell, verify, share, and source affordances. Do not call the vault a content grid.

## QR Entry Flow

QR routes should carry claim or proof entry. They can open the app, resolve a proof object or pack route, and ask the user to confirm claim/open actions before appending truth.
