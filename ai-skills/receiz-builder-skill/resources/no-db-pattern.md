# No-Db Pattern

Receiz apps can use public proof rails and durable app-state projections without a traditional app database.

## Correct Shape

```txt
public store/app-state projection -> first paint
proof object or identity proof -> authority
SDK publish rail -> append new projection
known head -> ask only for verified additions
```

## When A Database Is Allowed

A database may index, search, cache, or decorate proof truth when the user explicitly asks for one or the app needs lower-authority operational data. It must not become final authority over proof, ownership, settlement, profile, product, receipt, card, pack, or verification truth.

## Write Path

If a user edits a storefront or product:

1. Build the new store state.
2. Sign with merchant identity proof when available, or use delegated publish for agent/server operation.
3. Publish through Receiz public-store/app-state rails.
4. Save returned append coordinates or known head.
5. Re-render from the returned projection or next resolved public state.

## Forbidden Shape

```txt
form submit -> DB row -> UI says product exists -> proof added later
```

The Receiz shape appends proof-native truth or public projection first, then weaker indexes mirror it.
