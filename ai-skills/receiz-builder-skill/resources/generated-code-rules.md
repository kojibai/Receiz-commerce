# Generated Code Rules

## Must Do

- Import from public SDK exports only.
- Keep SDK responses typed as projections unless the underlying proof object or append is verified.
- Use idempotency keys for retryable writes.
- Ask for explicit confirmation before writes, transfers, settlement actions, public publishes, or proof appends.
- Preserve verify/source links and proof object identity in UI.
- Keep durable proof memory scoped by owner, app, route, or tenant.
- Use public store/app-state rails for no-db storefronts.

## Must Not Do

- Do not call private SDK helpers or raw internal API routes when a client method exists.
- Do not invent schemas, tool names, issuers, rarity levels, ownership states, or receipt IDs.
- Do not create a parallel auth model that downgrades Receiz ID, PBI, Receiz Key, Identity Record, or Identity Seal.
- Do not make UI cache, React state, database rows, or model memory final authority.
- Do not hide verification behind a preview or share page.

## Generated Output Must Say

- which primitive is carried
- which SDK rails are used
- what remains unverified
- what requires a live bearer token or user confirmation
- which checks were run
