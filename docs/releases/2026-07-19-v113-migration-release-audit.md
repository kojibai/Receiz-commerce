# Receiz v113 Migration and Release Audit

Date: July 19, 2026

## Scope

Receiz Commerce Kit `4.6.0` is aligned with the coordinated official `113.0.0` SDK, MCP server, and AI-skills release. The application registry overlay chains to canonical v113 digest `4c4aa85f9785d205dcf7e4e5109837a83f8c3bf8e166130ae7e87353f299c637`; its attested digest is `e76dc371d342af25367c38fda7c62652a3e6a6c1480c8a18a7b9aa5bb85c9682`. The current eleven-operation matrix digest is `091ab9e6b3acb05283510a19754e53c637dbd96b47b499a524dc44c34f8e783b`.

## Published package evidence

- `@receiz/sdk@113.0.0`: `sha512-fslzEqnxxb+80tKGj/iJThFZtj6LQFvUewE2cPajhHr40Q1NKF8WGjj5iMcSH1LixjogYjBM0gOdc9ga87W92Q==`
- `@receiz/mcp-server@113.0.0`: `sha512-UkuAo/z4uV8X/kh/s5c1xjVhUFPl9DT53eLHzrHKoihAwo237H7aT9u93oTQXjA0rG8B8ZZ8yYQHNSm3WSfd1Q==`
- `@receiz/ai-skills@113.0.0`: `sha512-WUxBnJdMrSKRrDe/9/UM5/ic6jaWeyxw+cPm1+WgRgz+SkI9zg5nT/JyaIBEGzR6BWGKo2nkGLRSONOeHztoaQ==`

The checked-in `ai-skills/` tree matches the published v113 archive except for its package manifest, which is intentionally not copied into the repository skill root.

## Authority alignment

- Added `artifact.global.resolve` and `artifact.offline.reconcile` to the complete application operation matrix.
- Exposed the provider-neutral remote coordination domain through an explicit caller-supplied Connect token.
- Preserved known-artifact first paint and independently reverified every remote artifact and causal addition.
- Kept resolution and planning read-only, staging immutable and non-accepting, and commitment atomic against the expected named-domain head.
- Preserved sibling and namespace divergence without last-write-wins, timestamp selection, silent merge, or rebase.
- Kept accepted-head status distinct from external-effect delivery and retained indeterminate attempts for explicit resolution.
- Pinned the executable v113 verification, archive, history, namespace, reconciliation, and resource limits.
- Preserved sealed proof objects and verified history as stronger truth than tokens, databases, sessions, MCP, AI, receipts, reports, and UI projections.

## Qualification contract

The release is complete only when `pnpm release:check`, `pnpm receiz:migrate:verify`, `pnpm receiz:cli:check`, `pnpm receiz:release-lock`, and `pnpm validate:ai-skills` pass. The v112 migration attestation and release audit remain immutable historical evidence.
