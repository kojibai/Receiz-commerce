# Receiz v109 Migration and Release Audit

Date: 2026-07-18

## Outcome

Receiz Commerce Kit `4.2.0` is aligned to the coordinated `109.0.0` SDK, MCP server, and AI-skills release. The application registry overlay chains to canonical v109 digest `17f76b37c9fcd46f710239b5c1660b03cc34ec64bed30d1cc45c18d5d40eab70`; its attested digest is `0e2b42437cdf493fa2f01f4433a0837beaa316b03492905049e3638ddf51a4d0`.

The migration performed no database change and rewrote no witnessed history. Historical sealed artifacts, receipts, registry records, and the v107→v108 attestation remain unchanged.

## Official package custody

- `@receiz/sdk@109.0.0`: `sha512-1a/v66zJgWA5E065L4JHlIi87FzQPVy9fUwRhTbBRsN3ObMt8GKzhhDSwXoj37CIkDO7bNZ1wiGdtj7JNUJSAw==`
- `@receiz/mcp-server@109.0.0`: `sha512-gqJap6tFwohM/DmTaZxl4fP5jBmPRX+RRcZRvmyWbKaSsW5UIRNNexVCKp3WOKhTskRk/wzhQaRQ3VwTLLJiqg==`
- `@receiz/ai-skills@109.0.0`: `sha512-ntvb74RcKDYwRh1uZmxnzpHkpCBvrPguxm9NJk+Liv8ozIpVYyjsQsIuywG2ffzKUzJAC62WswmaVN7eMVq0hQ==`

The checked-in `ai-skills/` doctrine matches the published v109 archive, excluding only its package manifest.

## Constitutional alignment

The app overlay retains its existing commerce and Wilds laws and adds canonical `ARTIFACT-011`. SDK artifact verification or opening must not require weaker network, session, database, registry, or server state. Verification remains local and precedes extraction; sealed proof-object truth remains stronger than SDK, MCP, AI, server, database, session, and UI projections.

## Verification

The following completed successfully:

- `pnpm receiz:migrate:verify`
- `pnpm receiz:check`
- `pnpm validate:ai-skills`
- `pnpm typecheck`
- `pnpm receiz:release-lock`
- `pnpm release:check`

The full release gate passed the tracked-file secret scan, complete automated test suite, typecheck, official v109 app inspection, conformance, migration and CLI verification, release lock, 31-skill validation, lint, production build, and SDK doctor. The production build completed with the upstream SDK Groth16 dynamic-dependency warning and no build failure.
