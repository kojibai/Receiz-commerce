# Receiz v110 Migration and Release Audit

Date: 2026-07-18

## Outcome

Receiz Commerce Kit `4.3.0` is aligned to the coordinated `110.0.0` SDK, MCP server, and AI-skills release. The application registry overlay chains to canonical v110 digest `824aa4af849c4840ba94535798eab36e45d514703b6ae0cd30d4aa53f3c896e4`; its attested digest is `4cca397486d41fd7b79ed553315e88c4dcc7b0f0158b808f16c58efceabfc57d`.

The migration performed no database change and rewrote no witnessed history. Historical sealed artifacts, receipts, registry records, and prior migration attestations remain unchanged.

## Official package custody

- `@receiz/sdk@110.0.0`: `sha512-sQ2NWKFJBVr321cpHYPgyjlnWFEmjwU/a7mHWTyWprgOdQMz0odkwVWRRhFKGX+hLDIbpOIz7E0QcYArWOv3KQ==`
- `@receiz/mcp-server@110.0.0`: `sha512-+/cCjruSzYw2wFjjDKhe14HXvP5pfdgXS/jsIChZBk2eyXPCbwlAb10K149Xl+1ZFaWGdTaPClqp9I82UWRWbw==`
- `@receiz/ai-skills@110.0.0`: `sha512-rcDDDs4Bz94wFV5HSWoc12X7YQY5iRitLaw2ryVPOonVMW13Wi2v9v7fniQ5y0aV+YuAtivojSWtonkfWkFroA==`

The checked-in `ai-skills/` doctrine matches the published v110 archive, excluding only its package manifest.

## Constitutional alignment

The app overlay retains its existing commerce and Wilds laws and adds canonical `ARTIFACT-012` through `ARTIFACT-015`. Admission verifies exact enclosing bytes before classification. Bearer recovery cannot escalate authority. Recovery commits require an SDK-issued plan, verified capability, stable idempotency key, and one atomic unit of work. Proof explanations and recovery plans remain non-authoritative.

## Verification

Release qualification runs:

- `pnpm receiz:migrate:verify`
- `pnpm receiz:check`
- `pnpm validate:ai-skills`
- `pnpm typecheck`
- `pnpm receiz:release-lock`
- `pnpm release:check`

The full release gate covers the tracked-file secret scan, complete automated test suite, typecheck, official v110 app inspection, conformance, migration and CLI verification, release lock, 31-skill validation, lint, production build, and SDK doctor.
