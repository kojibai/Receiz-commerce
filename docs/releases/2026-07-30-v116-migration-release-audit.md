# Receiz v116 Migration and Release Audit

Date: July 30, 2026

## Scope

Receiz Commerce Kit `4.8.0` aligns with the coordinated public `116.0.0` SDK, MCP server, and AI-skills packages. The application overlay chains to canonical registry digest `9bf61fcf4541edf565bb2ded252e35a976a3ca7c9176dea0f1ffac74ce192a80`; its attested digest is `6ed8c780d743452fe4398836e496b931f40755878e1fd43295583b4dc5a374a5`. The sixteen-operation application matrix digest is `ec5829eeec039c1f4885d056b8cd6cf6506d08547cee58daa229ecbd44155420`.

The SDK-generated integration preview `e220382b2c240d63134c6144eaab026fa7b1d046ddbc5007c067a9f1fed3b11a` was explicitly confirmed and applied. It performed seventeen repository writes. It did not migrate production data, deploy the application, publish packages, rewrite witnessed history, or change a database.

## Published package evidence

- `@receiz/sdk@116.0.0`: `sha512-0Xla7lyOtSKxkN0frJJLhtvvK4TblQFAUU5hfpJq2G80zuWWnOEKfBtAgeQrdxWGUQkEV48WXih/QL1zfQu7/g==`
- `@receiz/mcp-server@116.0.0`: `sha512-IkdW5s4Wt5FMyQEZY49I3YK7IWVtxUdvrWtNig2tlgv/4qaSoNg1F39hG0aVxoJ1D4HzpH0wLxhjFjhjJnr3cg==`
- `@receiz/ai-skills@116.0.0`: `sha512-DXRTe0hWruAiLL1a3iUbPnIlfK+dj9mOmSQZTByQIkcuKlZEYJ0L7u93hAz3bwZxP00b3j/mtIQAnttQ3x4lqg==`

The checked-in `ai-skills/` tree matches the published v116 archive except for the package manifest intentionally excluded from the repository skill root.

## Production-ready evidence

- SDK version: `116.0.0`
- Registry digest: `9bf61fcf4541edf565bb2ded252e35a976a3ca7c9176dea0f1ffac74ce192a80`
- Artifact law version: `113.0.0` with `ARTIFACT-001` through `ARTIFACT-030`
- Artifact carrier: `receiz.native-record-seal`
- Signature version: `Signature V4`
- Artifact digest: independently recomputed by the SDK conformance fixture
- Payload digest: bound to the enclosing sealed artifact by the SDK conformance fixture
- Owner and claim binding: passing conformance evidence
- Independent verification result: passing local verifier and conformance evidence
- Cross-platform round-trip result: retained historical compatibility suite
- Legacy compatibility result: historical v112/v113 artifact and conformance vectors retained
- Release-lock result: passing
- Network calls during verification: `0`
- Local verifier result: passing SDK conformance report
- Admission verdict: explicit typed admission verdicts retained
- Permitted actions: explicit and non-authoritative until current capability verification
- Proof history digest: independently derived by causal-history tests
- Recovery plan digest: deterministic SDK plan identity
- Operation identity: plan identity remains distinct from attempt identity
- Atomic commit result: named-domain expected-head acceptance remains atomic

## Authority and exclusions

Sealed proof objects and verified local history remain stronger than the SDK, MCP, server, database, session, token, AI output, receipt, acceptance report, and UI projection. The release does not call an inner payload an artifact, does not repack Record → Seal bytes, does not grant authority from structural JSON, and does not serialize runtime custody across a process boundary.

This repository release performs no production deployment, data migration, package publication, tag replacement, or external-effect delivery. Manual mobile, tenant-host, checkout, domain, and credentialed production smoke verification remain deployment gates rather than claims made by this source release.

## Qualification

The final source state passed `pnpm release:check`, including:

- tracked-file secret scan across 949 files
- complete automated test suite
- TypeScript typecheck, lint, and production build
- SDK doctor with no missing requirements or warnings
- app check with no blocking findings
- v114-to-v116 migration verification with no pending actions
- CLI lifecycle verification
- v116 release lock, including exact public package-integrity checks
- SDK conformance with 15 passing checks, no failures, no network calls, and no database writes
- validation of all 32 checked-in AI skills against the public v116 package

The conformance evidence digest is `798b482ae0aee31684ff020b12c8ef6ac13816bf4ab1bd33bab955b705996456`.
