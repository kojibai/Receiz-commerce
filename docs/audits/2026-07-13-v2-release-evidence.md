# Receiz Commerce OS 2.0.0 Release Evidence

Date: July 13, 2026

Release unit: repository

Application version: `2.0.0`

SDK: `@receiz/sdk@99.0.0`

## Automated evidence

- `pnpm test`: 228/228 tests pass after the v2 release contract was added.
- `pnpm typecheck`: passes.
- `pnpm lint`: passes.
- `pnpm build`: production build passes.
- `pnpm secret:scan`: passes across tracked files.
- `pnpm receiz:doctor`: SDK `99.0.0`, no missing capabilities, no warnings in the configured release environment.
- `pnpm release:check`: passes the frozen aggregate gate.

The suite covers authoritative checkout quoting, wallet/card settlement, failed-transfer rejection, durable platform operations, embedded same-surface payment, Exchange listing authority and market truth, webhook admission, safe imports, OAuth flow binding, global theme publication, tenant recovery, game persistence, renderer stability, compact controls, and streamed-world behavior.

## Security evidence

A repository security campaign against the pre-fix v2 candidate found trust-boundary risks in checkout, Exchange, hosting, import, media, webhook, OAuth, and request-origin handling. Commit `b9107997` applies the stop-ship fixes and adds regression contracts. Because repository HEAD changed during remediation, that original scan could not be finalized against the new immutable target; a clean scan of the final release commit remains a release-operator action before creating a public tag.

## Manual and environment-dependent evidence

The game and primary mobile surfaces were exercised in a real browser during the implementation campaign, including drag movement, compact controls, terrain streaming, and renderer diagnostics. The automated build reported a stable production route graph.

No real-money charge was executed in this coding session. Before production traffic, operators must run controlled wallet-only, card-only, wallet-plus-card, Exchange, and merchant-upgrade transactions with configured accounts and verify the resulting receipts, ownership appends, merchant settlement, platform settlement, refunds, and retry behavior. Passing local tests is not represented as live processor certification.

## Rollback and ownership

- Roll back the application and environment together; do not delete proof history.
- Disable webhook delivery while reverting incompatible application code.
- Preserve durable operation intents so an idempotent forward deployment can reconcile paid-but-not-activated operations.
- The deploying operator owns credential configuration, DNS propagation, live payment certification, telemetry, and the final immutable security rescan.
