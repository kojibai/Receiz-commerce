# Set up an independent fork

Each fork owns its Receiz application registration, platform receiving account, deployment and public store hosts. Merchants connect their own Receiz identities. Customer purchases pay the published merchant; account upgrades and in-app hosting renewals pay the fork's configured platform receiver. A receiver does not supply a spending wallet for someone else's payment.

## Local setup and your application registration

```sh
cp .env.example .env.local
pnpm install
pnpm dev
```

Register your application in the [Receiz developer console](https://receiz.com/developers). Preserve the issued public client ID exactly and configure the client secret on the server. Configure allowed origins and any compatibility callback for your own deployment. Normal merchant and customer permission is granted by verifying and signing the user's Identity Seal inside this app; it does not navigate them to Receiz.com.

Keep `.env.local`, `.vercel`, OAuth capabilities, Identity Seals and private payment files out of Git. The repository ignores local environment files and Vercel links. Link the fork to your own Vercel project; do not copy another operator's project link or credentials.

Set these public deployment values to your own platform. `NEXT_PUBLIC_PLATFORM_DOMAIN` is a hostname, without a scheme, path or port. The site URL is a complete URL. `NEXT_PUBLIC_*` settings are included in the browser build and require a rebuild when changed.

```dotenv
NEXT_PUBLIC_PLATFORM_NAME=Example Commerce
NEXT_PUBLIC_PLATFORM_DOMAIN=commerce.example
NEXT_PUBLIC_DEFAULT_SUBDOMAIN=demo.commerce.example
NEXT_PUBLIC_SITE_URL=https://commerce.example
RECEIZ_ID_CALLBACK_URL=https://commerce.example/api/auth/receiz/callback
RECEIZ_CLIENT_ID=<your issued public client ID>
RECEIZ_CLIENT_SECRET=<configure securely on the server>
RECEIZ_OAUTH_STATE_SECRET=<your independent random secret of at least 32 bytes>
```

A blank platform name/domain retains the template's Receiz.app branding. A blank default subdomain derives `boost.<your platform domain>`. A default subdomain on a different platform is rejected. New merchant workspaces, tenant routing and domain setup use the configured platform root.

The native application namespace is separate from the OAuth client ID. Choose one namespace for your fork before creating application-bound payment sources, and keep its server, browser and audience settings consistent:

```dotenv
RECEIZ_APPLICATION_ID=com.example.commerce
NEXT_PUBLIC_RECEIZ_APPLICATION_ID=com.example.commerce
RECEIZ_RUNTIME_AUDIENCE=com.example.commerce
```

These strings bind existing SDK operations. They do not create an admitted identity, source proof, capability or qualified runtime. Changing the namespace cannot migrate proof already issued for a different application.

## Direct MCP and AI skills

Use the pinned local `@receiz/mcp-server` command and matching AI skills described in the README. The direct MCP is a separate host from the ChatGPT connector and from this app's Vercel functions. Configure that host's `RECEIZ_APPLICATION_ID` for the exact application/audience carried by its sources; do not rewrite the issued OAuth client ID or assume Vercel variables configure the agent process.

The installed MCP supports the trusted custody module `RECEIZ_V124_MATERIAL_HOST_MODULE`. That module resolves complete held sources and SDK session material behind opaque references and can persist recovered material outside model output. Each fork must provide its own custody and actual runtime qualification for the operations it enables. A profile, balance or tool listing alone does not grant financial authority. The marketplace connector's financial exclusions remain in force; the template does not modify an operator's installed MCP profile.

## Platform fees and merchant payments

```dotenv
NEXT_PUBLIC_RECEIZ_MODE=live
NEXT_PUBLIC_CHECKOUT_MODE=receiz
RECEIZ_CHECKOUT_MODE=receiz
RECEIZ_BASE_URL=https://receiz.com
RECEIZ_PLATFORM_BILLING_MODE=live
RECEIZ_PLATFORM_USERNAME=<your receiving Receiz username>
RECEIZ_PLATFORM_ACCOUNT_ID=<your corresponding Receiz account UID>
RECEIZ_PRO_PLAN_USD=49.00
RECEIZ_SCALE_PLAN_USD=199.00
RECEIZ_CUSTOM_DOMAIN_SETUP_USD=0.00
```

The example environment leaves the platform receiver blank. Live paid upgrades require your configured receiver; they cannot silently pay the original repository operator. Keep pricing and receiver credentials server-side. Sandbox billing does not establish a paid month.

Storefront checkout resolves the receiving merchant from that store's published proof state. Do not use a platform service token as a customer wallet or replace the buyer with the fee receiver. Static app tokens are optional only for services explicitly issued that authority; normal users receive separate short-lived, purpose-bound permission after local proof verification.

Cards use Receiz's existing embedded payment surface and Stripe integration. A fork does not need to add Stripe, Supabase or another payment/database dependency. Paid account access follows independent recovery of the original payment. Renewal is a user-selected additional month inside the app, rather than a recurring card subscription.

## Domain and webhook setup

Attach your platform root and wildcard domain to your deployment and use the DNS records that deployment provides. Configure your own `VERCEL_PROJECT_ID`, team and server-side API authority only if you enable Vercel domain automation. Set `RECEIZ_CUSTOM_DOMAIN_CNAME_TARGET` to your deployment's custom-domain target instead of inheriting `custom.receiz.app`.

If you register Receiz webhooks, use your own `RECEIZ_WEBHOOK_URL`, tenant host and endpoint secrets. Blank webhook URL/host values derive from your configured public site URL; the registration script requires a deployed HTTPS origin and never defaults to the original operator's site. Webhooks coordinate changes; a callback or browser success message alone cannot establish a settled purchase. Secret rotation affects retained encrypted payment coordinates, so preserve existing recovery custody during rotation.

## Current payment boundary and validation

The SDK, MCP server and AI skills are pinned together at 128.0.0. No Receiz main-repository change, SDK modification or new package version is needed to use the methods already integrated here. An MCP host's application binding, custody and actual exposed tools are configured independently of the app's Vercel environment. Installing the ChatGPT connector or configuring an OAuth client does not by itself qualify financial execution.

Guest and unfunded-wallet card checkout, original-session recovery and in-app monthly billing use the Receiz merchant payment surface. Native Reserve orchestration verifies both participants, executes one exact admitted SDK plan, retains its complete recovery, and charges only the pinned card remainder. Ambiguous attempts resolve by original idempotency coordinates before retry; expired-card replacement happens only from an explicit checkout action after verifying the original card session.

**Automatic Reserve preparation is still unfinished in this repository.** The current Reserve entry accepts a complete prepared sender/receiver transfer and original price basis. An Identity Seal, an OAuth secret or a balance response alone does not supply that preparation. The fork owner must integrate the participants' actual admitted sources and custody before advertising automatic wallet-first payment. Native private order/entitlement journals, split cancellation/compensation and live acceptance also remain release requirements. See [payment integration status](payment-integration-status.md) and [the proof-native payment contract](payments-proof-native-contract.md).

```sh
pnpm test
pnpm typecheck
pnpm lint
pnpm receiz:release-lock
pnpm build
```

Passing local tests is distinct from production qualification. Before enabling paid commerce, verify your own guest card purchase, Reserve-only purchase, Reserve/card split, interrupted card recovery, repeated completion, restart recovery, merchant order access and account upgrade. Retain exact proof and payment outcomes from that acceptance run.
