# Receiz v118 Migration and Release Audit

Date: August 1, 2026

## Scope

Receiz Commerce Kit `4.9.0` aligns with the coordinated public `118.0.0` SDK, MCP server, and AI-skills packages. The application overlay chains to canonical registry digest `c284bd39a891c1a828b532523bd548507570819c32e307d79b8043f06d2d3360`; its attested digest is `a87218abf03e01a0cd1943ad8420bc14a5313b9ec0b9efcc8f0715a5d10f5d05`. The sixteen-operation application matrix digest is `153b2472830567ec3b445c2c1b4102e4c036ed4c45cc374d40d0079096a40f54`.

The SDK-generated integration preview `a51de97f887b58eaf949623a4b3bb87a1b527922581cb57241e6f067b8d1feb3` was explicitly confirmed and applied. It performed six repository writes. It did not migrate production data, deploy the application, publish packages, rewrite witnessed history, or change a database.

## Published package evidence

- `@receiz/sdk@118.0.0`: `sha512-MgcgjTW3PpVGAlQaBnU1ZYSsjntV/J68AFth1KzeRN2GmeyMNKjIfwTz79VrPbp7qr4aPfH6XL5UW8WC23b34w==`
- `@receiz/mcp-server@118.0.0`: `sha512-a7j2Tz2I0WAjRGPRoHEJHaEsGue9/8UDlCTfL0nvM3QHdMbnVorYXhYZV3sUuqL+bF8+RDhbo1xAWnxTTZ6YYg==`
- `@receiz/ai-skills@118.0.0`: `sha512-ETQURcQlepcg0c7Z1xcwqapT6FFfFIM6YOBlWvvYoQzU2yOmQ9ONtKl8e8S982rvFMyt2oD5coSORrk+aNcAdw==`

The checked-in `ai-skills/` tree matches the published v118 archive except for the package manifest intentionally excluded from the repository skill root.

## Production-ready evidence

- SDK version: `118.0.0`
- Registry digest: `c284bd39a891c1a828b532523bd548507570819c32e307d79b8043f06d2d3360`
- Artifact law version: `118.0.0`, containing `ARTIFACT-001` through `ARTIFACT-030` and fourteen named continuity laws
- Artifact carrier: `receiz.native-record-seal`
- Signature version: `Signature V4`
- Artifact digest: independently recomputed by the SDK conformance fixture
- Payload digest: bound to the enclosing sealed artifact by the SDK conformance fixture
- Owner and claim binding: required by passing conformance evidence
- Independent verification result: passing local verifier and conformance evidence
- Cross-platform round-trip result: retained historical compatibility suite
- Legacy compatibility result: historical artifact and conformance vectors retained
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

Sealed proof objects and verified local history remain stronger than the SDK, MCP, server, database, session, token, AI output, receipt, acceptance report, and UI projection. This release does not call an inner payload an artifact, repack Record → Seal bytes, grant authority from structural JSON, or serialize runtime custody across a process boundary.

This repository release performs no production deployment, data migration, package publication, tag replacement, or external-effect delivery. Manual mobile, tenant-host, checkout, domain, and credentialed production smoke verification remain deployment gates rather than claims made by this source release.

## Qualification

The final source state passed `pnpm release:check`, including:

- tracked-file secret scan across 968 files
- complete automated test suite
- TypeScript typecheck, lint, and production build
- SDK doctor with no missing requirements or warnings
- app check with no blocking findings
- v116-to-v118 migration verification with no pending actions
- CLI lifecycle verification
- v118 release lock, including exact public package-integrity checks
- SDK conformance with 15 passing checks, no failures, no network calls, and no database writes
- validation of all 32 checked-in AI skills against the public v118 package

The conformance evidence digest is `74924b324ad0e31f79d7264e6667f7a4dfc7136f0db58137c3f12bc7de9763d7`.
