# Contributing

Receiz.app Commerce Cloud is an open-source reference implementation for building proof-sealed commerce with `@receiz/sdk`.

## Local Development

```bash
pnpm install
pnpm dev
```

Before opening a pull request, run:

```bash
pnpm typecheck
pnpm lint
pnpm build
```

## Product Principles

- Use Receiz SDK rails for identity, checkout, wallet, proof, settlement, and public proof integrations.
- Do not add Stripe, Supabase, or another database as product truth.
- Proof objects, identity artifacts, verified appends, ownership appends, and settlement ledger rows are stronger truth than app-local projections.
- Keep tenant storefronts scoped by host. `receiz.app` is the platform/admin surface; `*.receiz.app` and custom domains are merchant storefront surfaces.
- Keep mobile admin flows touch-friendly and single-view where possible.

## Coding Standards

- Follow existing App Router patterns.
- Keep server secrets server-only. Never expose access tokens, client secrets, webhook secrets, or Vercel API tokens through `NEXT_PUBLIC_*`.
- Add UI only when it works. Buttons in admin should open a builder, save state, or route somewhere useful.
- Gate experimental SDK namespaces behind explicit capability flags until the installed SDK exposes typed support.

## Pull Requests

Include:

- What changed
- Which Receiz SDK rails are affected
- Verification output for `pnpm typecheck`, `pnpm lint`, and `pnpm build`
- Screenshots for visible desktop/mobile changes
