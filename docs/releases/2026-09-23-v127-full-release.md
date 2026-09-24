# Receiz Commerce Kit v5.3.0 — Receiz v127

Release date: September 23, 2026

Application: `5.3.0` · SDK/MCP/AI: `127.0.0` · constitutional ruleset: `127.0.0`

## What changed

This release upgrades the complete published Receiz dependency set from v126 to v127, updates the application's executable contracts, and publishes a new application release. Exact dependencies and npm integrity values are pinned in `pnpm-lock.yaml` and `receiz.migration.v126.0.0-v127.0.0.json`.

- **SDK:** `@receiz/sdk@127.0.0`.
- **MCP:** `@receiz/mcp-server@127.0.0`, exposing 330 tools (up from 221), including all 26 retained v124-group tools.
- **AI doctrine:** `@receiz/ai-skills@127.0.0`, mirrored byte-for-byte except the package manifest: 43 skills, 37 manifests, 34 agent prompts. The upstream summary counts now match the actual entries.
- **Application contract:** 60 operations with the v127 compatibility range, registry, and matrix. SDK-generated capabilities and boundaries are regenerated.
- **App constitution:** inherits current SDK laws, retains six app-specific runtime authority laws, and requires the v127 package coordinate for current-release defaults. Law identifiers remain unique.
- **Release tooling:** new v127 inspection, migration verification, and release-lock scripts; current CLI checks and identity tests target v127. Prior release documents and attestations remain historical records.

## Exact release identity

| Coordinate | Value |
| --- | --- |
| Compatible SDK | `>=127.0.0 <128.0.0` |
| Canonical registry | `8d0b5b839d02d9efbd4306cc99410595a183705c2670b76d2567eaaaade99065` |
| Operation matrix | `eadd171a45fcc51e275a1c57de1eb8e67614757a5723d141793641edf7207a10` |
| App registry | `d1526fce85ba5e5cf259686ba0377d3c72b87040acc99a63a92eea6baf210315` |

## V127 capabilities and integration boundaries

The installed SDK exposes offline sealing (`@receiz/sdk/offline`), private Node sealing custody (`@receiz/sdk/offline/node`), offline Kai proof generation (`@receiz/sdk/offline/kai` and `/node`), and the durable local subject host (`@receiz/sdk/subjects/node`). These are installed capabilities, not automatically provisioned application services. Device enrollment is explicit; this release does not enroll a device, create private keys, admit an identity, or configure a local subject directory. Offline sealing needs the published proving resources and enrolled device custody. A local subject host needs a genuine admitted identity and sealed source artifacts.

The existing `createReceizCommerceAdapter(options)` forwards the SDK's typed options, so integrators may supply a genuine local `subjectRuntime` or an explicit historical compatibility host. Node-only entrypoints are not imported into the browser adapter. Existing modern v122/v123/v124 adapter interfaces, trusted-host WeakMap custody, qualification-before-mutation, idempotent outcome recovery, and verified material playback are retained.

V127 disables historical Connect HTTP methods by default, including legacy customer, merchant, domain, media, and some commerce operations. An injected fetch implementation does not enable historical Connect. Such methods require `legacyConnectTransport: "http"` and an explicit noncanonical host that actually implements them; `https://receiz.com` cannot be selected as that compatibility host. Historical V120 subject methods require a local runtime or explicitly selected historical transport. These fail-closed defaults are retained and tested. Capability reports must determine availability; method presence is not production readiness.

## Upstream issues and reviewed exceptions

The integration scanner still interprets text in its own published AI function catalogs as executable application code. V127 also flags a dynamic import in its published offline-sealing tutorial. The release check separately reports raw upstream results and reviewed findings. Exceptions require exact finding/file combinations and byte equality with the installed package. The single reviewed upgrade action is a nondestructive manual compiler-import suggestion for that unchanged tutorial. Unknown actions, application-source paths, changed published bytes, or destructive actions remain blocking.

The raw SDK check therefore still reports these upstream documentation findings. The repository's `pnpm receiz:check` adds the bounded review and does not modify the installed package or suppress arbitrary findings. Regression tests cover changed content, extra paths, unknown findings/actions, and destructive actions.

The previously recorded streaming-verifier public-export gap remains in v127. The app retains its no-deep-import boundary. The old AI summary-count issue is marked resolved by the v127 package.

## Upgrade and rollback

Install with `pnpm install --frozen-lockfile`, then run `pnpm release:check`. Deployments must preserve their existing environment and identity/proof custody. Historical host integrations must opt in explicitly through SDK options; do not enable compatibility mode merely to hide an unavailable production route.

No witnessed history or production data is rewritten. Existing protocol identifiers and historical release evidence are preserved. To roll back application code, restore the preceding commit `06f774ef` and its frozen lockfile in a separate deployment; retain all subsequently created proof objects and append-only history. Do not reinterpret v127 authority as an older runtime's admitted custody.

## Verification

The release gate runs secret scanning, the full test suite, TypeScript checking, reviewed integration checks, SDK conformance, CLI lifecycle checks, migration verification, release lock, AI validation, lint, production build, and SDK doctor. Measured results:

- `pnpm release:check`: passed, including **814 tests, zero failures**, TypeScript, conformance, migration/release lock, AI validation, lint, production build (29 pages), and doctor.
- SDK doctor: `ok: true`, with no missing items, warnings, or fixes.
- Final current-package law regression: six tests passed, including rejection of v126 as the current release.
- Production browser check of `/developers/receiz`: correct v127 release identity and capability counts; no browser console warnings or errors.
- Fresh whole-change review: no actionable correctness/security findings or release blockers.
- `git diff --check`: passed.

Existing nonblocking diagnostics remain: an image-element lint warning in MaterialProofViewer and upstream web-worker dynamic-dependency build warnings through snarkjs. Reviewed upstream documentation scanner exceptions are described above. These results verify the repository release; they do not claim deployment or provisioning of production services.
