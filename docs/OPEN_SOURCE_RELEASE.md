# Open-Source Release Checklist

Use this before tagging or announcing the public template.

## Required Gates

- `pnpm typecheck`
- `pnpm lint`
- `pnpm build`
- Mobile admin visual QA at 390px and 430px widths
- Tenant storefront QA on a subdomain host
- Platform admin QA on `receiz.app`
- Checkout QA:
  - Logged-out customer is sent to Receiz ID login
  - Logged-in customer uses scoped Receiz session for that host
  - Receiz wallet-first checkout request includes card fallback metadata
  - Merchant settlement metadata points to the merchant Receiz ID
  - Order/customer projections appear in admin
- Domain QA:
  - Free subdomain is saved and served
  - Published subdomain `/api/store` returns saved tenant content with `proofMemory.entries > 0`
  - Custom domain is added to Vercel
  - DNS instructions are visible when DNS is missing
- Docs QA:
  - `.env.example` matches README
  - No static Receiz token is documented as required for normal OIDC login
  - Receiz Twin/World content buttons are documented as hidden until SDK capability is enabled

## Public Repo Hygiene

- `LICENSE` present
- `CONTRIBUTING.md` present
- `SECURITY.md` present
- `.env.local` ignored and not committed
- `.vercel` ignored and not committed
- No screenshots or generated artifacts that contain secrets
- Package name, description, and README match the public project

## Receiz SDK Rails Demonstrated

- Receiz ID OIDC login and callback
- Receiz identity artifact restore
- Receiz wallet projection
- Receiz checkout session creation
- Receiz Connect transfer for platform fees
- Receiz Connect record for hosting/content events
- Receiz webhook signature helpers in adapter
- Receiz proof memory helpers in adapter
- Receiz public proof and manifest projection helpers in adapter

## Capability Flags

Receiz Twin/World content assistance is intentionally hidden on the frontend unless one of these is enabled and the installed SDK exposes the matching namespace:

```bash
NEXT_PUBLIC_RECEIZ_TWIN_ENABLED=true
NEXT_PUBLIC_RECEIZ_WORLD_ENABLED=true
```

Leave both unset until the installed `@receiz/sdk` exposes the typed Twin/World namespace required by production content generation.
