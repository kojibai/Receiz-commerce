# Offline Verification Law

Offline verification is a Receiz proof primitive.

## Law

- Sealed artifact truth can be verified without waiting for a server.
- Known verified local truth must be used immediately.
- Network checks may append, compare, or discover additions.
- Network checks may not erase sealed local proof.
- Durable local truth is not cache.
- Offline Note genesis starts from the verified `receiz.account.state.v3`
  Receiz Key/Identity proof, locally verifies one Reserve-debit account
  successor and one equal whole-value held-bound Note genesis, then activates
  that exact Note in qualified custody.
- Supabase, server, database, session, and publication may project those
  successors later. They do not gate or release genesis, authorize issuance,
  establish Settlement, or replace the carried Reserve proof.
- A qualified Offline Note transition settles at exact local receiver
  activation; later publication distributes the already-settled history.
- A consumed Note predecessor remains authentic evidence and has no Send
  authority.
- SDK, CLI, HTTP, MCP, AI, server, database, session, identity labels, and
  account projections cannot replace the verified `receiz.account.state.v3`
  Reserve source, qualified irreversible custody, or the canonical whole-value
  successor.

## Required Language

Say "offline proof", "sealed artifact truth", "local verified truth", and "artifact-over-server" when those boundaries apply.

Do not say "fallback", "best effort", "cached copy", or "offline preview" as product truth.
