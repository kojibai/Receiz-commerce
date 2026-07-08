# Contributing

Receiz Commerce Kit is an open-source reference implementation for building proof-sealed products with `@receiz/sdk`, Receiz proof objects, and Receiz MCP.

Contributions are welcome when they preserve the kernel: Receiz proof remains the source of truth, SDK calls stay behind a clear boundary, and tenant/customer authority stays scoped.

## Local Development

```bash
pnpm install
pnpm dev
```

Useful routes:

- Storefront: `http://localhost:3000`
- Admin: `http://localhost:3000/admin`
- Account: `http://localhost:3000/account`

## Before Opening A Pull Request

Run:

```bash
pnpm release:check
pnpm secret:scan
```

If your change is UI-visible, include mobile and desktop screenshots or a clear visual QA note.

## Product Principles

- Use Receiz SDK rails for identity, checkout, wallet, proof, settlement, public state, domains, media, rewards, assets, and operations.
- Do not add Stripe, Supabase, Shopify, Redis, Vercel memory, or browser storage as product truth.
- Proof objects, identity artifacts, verified appends, ownership appends, and settlement ledger rows outrank app-local projections.
- Keep tenant storefronts scoped by host. `receiz.app` is the platform/admin surface; `*.receiz.app` and custom domains are merchant storefront surfaces.
- Keep server secrets server-only. Never expose access tokens, client secrets, webhook secrets, identity key files, or Vercel API tokens through `NEXT_PUBLIC_*`.
- Gate experimental SDK namespaces behind explicit capability flags until the installed SDK and OIDC client expose typed support.
- Keep mobile admin flows touch-friendly and readable at 390px and 430px widths.

## SDK Boundary Rules

- Put new Receiz calls in `src/lib/receiz/adapter.ts` or a narrow helper under `src/lib/receiz/`.
- Update `docs/SDK_RAILS.md` when you add, remove, or change an SDK rail.
- Update `src/lib/receiz/oauth-scopes.ts` when new OIDC scopes are needed.
- Update `.env.example` and README when new env variables are required.
- Add tests for proof ordering, tenant scoping, checkout authority, publish recovery, or domain behavior when those areas change.

## Pull Request Checklist

Include:

- What changed.
- Which Receiz SDK rails are affected.
- How proof authority is preserved.
- Any tenant/session/security implications.
- Verification output for `pnpm release:check` and `pnpm secret:scan`.
- Screenshots or visual QA notes for visible changes.

## Issue Triage

When opening an issue, include:

- Route, feature, or SDK rail.
- Expected behavior.
- Actual behavior.
- Reproduction steps.
- Relevant env mode without secret values.
- Screenshots for UI issues.

Security issues should not be filed publicly. Follow `SECURITY.md`.
