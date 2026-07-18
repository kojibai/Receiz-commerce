# Receiz v111 Migration and Release Audit

Date: 2026-07-18

## Outcome

Receiz Commerce Kit `4.4.0` is aligned to the official coordinated `111.0.0` SDK, MCP server, and AI-skills release. The application registry overlay chains to canonical v111 digest `cf02d0bce6ad1541cfe84e27bfb1036777b29616bf8a1e5aeafb899a945e359a`; its attested digest is `7c23da3f0ded830a7c4fc7282fb1cf26088ec9787390c21f8b7ce0536a097412`.

The migration changes no database schema or API behavior and rewrites no witnessed history. Historical sealed artifacts, receipts, registry records, and prior migration attestations remain unchanged.

## Official package custody

- `@receiz/sdk@111.0.0`: `sha512-j0T0mtC5WKOF7P6t2sv9dBtX2RMkKvmCyHRxiZQ52Uu+tLFuYzaC+myzBHwOW+MQQlSyHRqyAqqwz0Wn6LjIQg==`
- `@receiz/mcp-server@111.0.0`: `sha512-UYlwD+tfqlp5h5jnissBJtiKm7jGOAGAH2G96Oz2O+NhFHDOaA10hWpY1zUVQKClsuae8d5rJyeq7qW7m1mLgA==`
- `@receiz/ai-skills@111.0.0`: `sha512-ZPO14qVOM9OWspvpec7VpDz5x28Ap77wEoNSZyVitDicP41M7KnSsywfexv02SRZGtNSLNQyQg6SbS/gX9L+/Q==`

The checked-in `ai-skills/` doctrine matches the published v111 archive, excluding only its package manifest.

## Constitutional alignment

The app overlay retains all prior commerce, Wilds, and artifact laws and adds canonical `ARTIFACT-016` through `ARTIFACT-020`. Authority is independently derived from canonical exact bytes; recovered history requires independent stronger evidence roots; canonical identity requires complete signing evidence; current operations reject stale registry authority; and terminal MCP attempts cannot reuse confirmation.

## Verification

Release qualification runs:

- `pnpm receiz:migrate:verify`
- `pnpm receiz:check`
- `pnpm validate:ai-skills`
- `pnpm typecheck`
- `pnpm receiz:release-lock`
- `pnpm release:check`

The full release gate covers the tracked-file secret scan, complete automated test suite, typecheck, official v111 app inspection, conformance, migration and CLI verification, release lock, 31-skill validation, lint, production build, and SDK doctor.
