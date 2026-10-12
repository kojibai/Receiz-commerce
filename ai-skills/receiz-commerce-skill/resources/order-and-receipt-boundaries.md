# Order And Receipt Boundaries

Orders, receipts, certificates, and notes are separate proof boundaries.

## Order

An order is a purchase route state. It may show buyer intent, checkout session, status, and merchant processing, but it is not stronger than receipt proof or artifact truth.

## Receipt

A receipt is proof-bearing when it includes deterministic identity, payload, provenance, and inspection or verification behavior. Do not claim receipt proof until that boundary exists.

## Certificate

A certificate is a proof object that can carry value or certification state. Do not describe it as a listing.

## Note

A note issue route is a settlement primitive. Do not downgrade it to checkout copy or a balance display.

## Reporting

Always separate:

- What the buyer selected.
- What the seller claims.
- What checkout attempted.
- What settlement or receipt proof exists.
- What remains unverified.

Funding, payment, seller proceeds, bearer artifact delivery, buyer claim/custody, and asset use each need separate verifiable evidence. A successful card checkout alone does not establish an asset purchase or ownership transfer. Verify actual admitted wallet credit before resuming review/approval of a shortfall-funded purchase. Preserve idempotent recovery across return, reload, retries, lost responses, concurrent buyers, and stale custody without duplicate charges or ownership.

See the [live commerce evidence sequence](../examples/create-no-db-store.md). Qualified operations and healthy dependencies are required alongside actual deployed requests; method/tool presence, generated configuration, and sandbox fixtures prove no live settlement or delivery result.
