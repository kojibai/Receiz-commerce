# Security

Receiz Commerce Kit handles identity, proof, checkout, wallet, domains, media, and tenant state. Treat security reports carefully and privately.

## Supported Versions

The public template tracks the current `main` branch and the pinned package versions in `pnpm-lock.yaml`.

## Reporting Vulnerabilities

Report vulnerabilities privately to the Receiz.app maintainers before public disclosure.

Include:

- Affected route, component, SDK rail, or MCP workflow.
- Reproduction steps.
- Expected impact.
- Whether the issue affects identity, checkout, wallet, domains, media, webhooks, proof verification, tenant isolation, or release tooling.
- Any logs or screenshots with secrets removed.

Do not open a public issue for suspected vulnerabilities.

## Secret Handling

Never commit:

- `RECEIZ_CLIENT_SECRET`
- `RECEIZ_ACCESS_TOKEN`
- `RECEIZ_CONNECT_ACCESS_TOKEN`
- `RECEIZ_WEBHOOK_SECRET`
- `RECEIZ_CHECKOUT_WEBHOOK_SECRET`
- `RECEIZ_PROOF_WEBHOOK_SECRET`
- `RECEIZ_HOSTING_WEBHOOK_SECRET`
- `VERCEL_API_TOKEN`
- `.env.local`
- `.vercel`
- Receiz identity key files
- Private identity artifacts

OIDC login generates per-user Receiz access tokens at callback time. Normal deployments should not require static Receiz access tokens.

Run before release:

```bash
pnpm secret:scan
```

## Server-Only Values

Never expose these with a `NEXT_PUBLIC_` prefix:

- Receiz client secrets.
- Receiz access or connect tokens.
- Webhook secrets.
- Vercel API tokens.
- Identity key material.

Public env values should be limited to browser-safe mode flags, site URLs, and feature flags.

## Tenant Isolation

The app scopes browser state and Receiz session cookies by host context:

- `receiz.app` is the platform/admin scope.
- `*.receiz.app` is a merchant storefront scope.
- Custom domains are merchant storefront scopes.

Checkout must use the buyer's scoped Receiz session for that host. Platform/server tokens must not be used as buyer payment credentials.

## Proof Authority

Security-sensitive decisions should derive from verified proof objects, verified appends, ownership appends, settlement ledger rows, or scoped delegated permission beneath proof. Timestamps, local storage, framework caches, Vercel memory, and response order are not authority.

## Webhooks

Webhook handlers must verify signatures before admitting events. Webhook transport authenticity does not replace proof verification for the underlying event or object.
