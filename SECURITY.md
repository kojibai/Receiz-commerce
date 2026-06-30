# Security

## Supported Versions

The public template tracks the current `main` branch and the pinned package versions in `pnpm-lock.yaml`.

## Reporting Vulnerabilities

Report vulnerabilities privately to the Receiz.app maintainers before public disclosure.

Include:

- Affected route, component, or SDK rail
- Reproduction steps
- Expected impact
- Whether the issue affects identity, checkout, wallet, domains, webhooks, or proof verification

## Secret Handling

Never commit:

- `RECEIZ_CLIENT_SECRET`
- `RECEIZ_ACCESS_TOKEN`
- `RECEIZ_CONNECT_ACCESS_TOKEN`
- `RECEIZ_WEBHOOK_SECRET`
- `VERCEL_API_TOKEN`
- `.env.local`
- Receiz identity key files or private identity artifacts

OIDC login generates per-user Receiz access tokens at callback time. Normal deployments should not use static Receiz access tokens.

## Tenant Isolation

The app scopes browser state and Receiz session cookies by host context:

- `receiz.app` is the platform/admin scope.
- `*.receiz.app` is a merchant storefront scope.
- Custom domains are merchant storefront scopes.

Checkout must use the buyer's scoped Receiz session for that host. Platform/server tokens must not be used as buyer payment credentials.
