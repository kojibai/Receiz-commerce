# Migrating to v2.0.0

Version 2.0.0 is a repository release targeting `@receiz/sdk@99.0.0`. It strengthens the authority model for checkout, Exchange, hosting, domains, OAuth, and public state. Existing v1 browser workspaces are read through the current store migration and remain drafts until the merchant explicitly publishes them.

## Required changes

1. Install with the committed lockfile and use Node 20.18 or newer.
2. Configure `RECEIZ_CLIENT_ID`, `RECEIZ_CLIENT_SECRET`, and a separate random `RECEIZ_OAUTH_STATE_SECRET` of at least 32 bytes.
3. Configure the Receiz webhook secret before enabling webhook delivery. The route now fails closed when the secret is missing and rejects stale timestamps.
4. Log in again after deployment. OAuth state and cross-host completion tickets are now bound to a one-time browser flow nonce, so v1 in-flight callbacks are intentionally invalid.
5. Republish each merchant workspace. This writes the current theme and complete storefront as one versioned proof record so subdomains and custom domains recover the same global state.
6. Exercise wallet, embedded card, Exchange, and platform-upgrade flows in the configured Receiz environment. Submitted prices, recipients, owners, and paid flags are ignored; the server derives them from published state and durable intents.

## API behavior changes

- Checkout accepts cart line identities and quantities. It no longer trusts a client total, merchant, settlement recipient, or payment outcome.
- Exchange listing requires a verified Receiz proof artifact whose owner matches the authenticated seller. Uploads are size-bounded and the stored asset identity comes from verification.
- Exchange purchases and merchant upgrades become active only after matching settlement evidence. A rejected wallet transfer cannot produce paid state.
- Hosting, publish, media, and import mutations require scoped browser authorization. Import URLs are revalidated across redirects and cannot target private or link-local networks.
- OAuth callback origins are derived from the request host unless trusted proxy headers are explicitly enabled.

## Data and UX compatibility

- The v1 workspace schema is migrated locally without silently publishing it.
- Existing storefront content, products, rewards, assets, and game state are preserved where valid.
- Theme changes show locally as a draft and become global only through Publish; other tabs revalidate after publication.
- Receiz Wilds v2 saves are versioned and corrupted saves are rejected instead of partially applied.

## Deployment sequence

1. Back up environment configuration and export any critical merchant proof artifacts.
2. Deploy to staging with `NEXT_PUBLIC_RECEIZ_MODE=live` only when live Receiz credentials are present.
3. Run `pnpm release:check` and `pnpm audit --prod`.
4. Complete the manual smoke test in `docs/PRODUCTION_READINESS.md` on `receiz.app`, one subdomain, and one custom domain.
5. Validate one wallet-only payment, one card-only payment, one split wallet/card payment, one Exchange settlement, and one merchant platform upgrade using controlled test accounts.
6. Deploy production, republish merchant workspaces, and watch webhook, settlement, and tenant-recovery telemetry.

## Rollback

Roll back the application commit and environment as one unit. Do not rewrite or delete v2 proof records. A v1 deployment may ignore newer fields, while the Receiz proof history remains available for a forward recovery. Revoke any exposed credentials, stop webhook delivery during the rollback window, and restore the last known-good deployment before resuming settlement.
