# Receiz v119 Migration and Release Audit

Date: August 14, 2026

## Scope

Receiz Commerce Kit `4.10.0` aligns with the coordinated public `119.0.0` SDK, MCP server, and AI-skills packages. The application overlay chains to canonical registry digest `49c167a437ec7c0e486412dd62c54af4abdf94eda1ebc18d263a027d105cecd9`; its attested digest is `a792de4e7ba4acbf784082cfb153695991c4667e7dfb7d9bcb9c71452294e86f`. The sixteen-operation application matrix digest is `53cf9d6862b2396e2fe7864f8607c00c4e3b6e31b082ab5c5c8dff088fcb52c1`.

The official SDK upgrade planner reported the integration compliant with zero actions and zero repository writes. No permit digest was emitted because no SDK apply operation was proposed. This source migration did not migrate production data, deploy the application, publish packages, rewrite witnessed history, or change a database.

## Published package evidence

- `@receiz/sdk@119.0.0`: `sha512-vngyBn1dXcd/U7iUnMYeFKYJTsFje2YOzEbqWR0+c6sbNXaeQysEdEE9LWrhBlLoMtC0Vvl9ec46D2bFeaOlAw==`
- `@receiz/mcp-server@119.0.0`: `sha512-pLeKOMTD2vijTjsZcH93oX2bB6Kf0UEx/E3NpzO5gFeLhlOySlvKyd0SD3g5flT0Abl6FfaGSQuYlfH8XZCyTg==`
- `@receiz/ai-skills@119.0.0`: `sha512-qsLCUq6e+kVA3n5355mM25aChHGovOr09HWyubDt3xFc0W6VZiuBEbV2DmLewjShxNRErDO4X2vVsdnv3uQUeg==`

The checked-in `ai-skills/` tree matches the published v119 archive except for the package manifest intentionally excluded from the repository skill root.

## Production-ready evidence

- SDK version: `119.0.0`
- Registry digest: `49c167a437ec7c0e486412dd62c54af4abdf94eda1ebc18d263a027d105cecd9`
- Artifact law version: `119.0.0`, containing `ARTIFACT-001` through `ARTIFACT-030` and eighteen named continuity laws
- Artifact carrier: `receiz.native-record-seal`
- Signature version: `Signature V4`
- Artifact digest: independently recomputed by the SDK conformance fixture
- Payload digest: bound to the enclosing sealed artifact by the SDK conformance fixture
- Owner and claim binding: required by passing conformance evidence
- Independent verification result: passing local verifier and conformance evidence
- Cross-platform round-trip result: retained historical compatibility suite
- Legacy compatibility result: historical artifact and conformance vectors retained
- Release-lock result: required passing gate
- Network calls during verification: `0`
- Local verifier result: passing SDK conformance report
- Admission verdict: explicit typed admission verdicts retained
- Permitted actions: explicit and non-authoritative until current capability verification
- Proof history digest: independently derived by causal-history tests
- Recovery plan digest: deterministic SDK plan identity
- Operation identity: plan identity remains distinct from attempt identity
- Atomic commit result: named-domain expected-head acceptance remains atomic
- Recursive continuity: highest verified Kai head selection, exact-append Merkle commitment, and sparse Fibonacci ancestry
- Sports-card admission: verified enclosing proof object required

## Authority and exclusions

Sealed proof objects and verified local history remain stronger than the SDK, MCP, server, database, session, token, AI output, receipt, acceptance report, and UI projection. Kai selects the causal head, Merkle commits exact appends, and Fibonacci carries sparse ancestry; none of those projections replaces enclosing sealed-proof authority. This release does not call an inner payload an artifact, repack Record → Seal bytes, grant authority from structural JSON, or serialize runtime custody across a process boundary.

This repository release performs no production deployment, data migration, package publication, tag replacement, or external-effect delivery. Manual mobile, tenant-host, checkout, domain, and credentialed production smoke verification remain deployment gates rather than claims made by this source release.

## Qualification

The final source state passed `pnpm release:check`, including:

- tracked-file secret scan across 972 files
- complete automated suite with 750 passing tests and no failures
- TypeScript typecheck, lint, and production build
- SDK doctor with no missing requirements or warnings
- app integration check with no blocking findings
- v118-to-v119 migration verification with no pending actions or writes
- CLI lifecycle verification
- v119 release lock, including exact public package-integrity checks
- SDK conformance with 15 passing checks, no failures, no network calls, and no database writes
- validation of all 32 checked-in AI skills against the public v119 package
- adoption of the v119 `reserve_funding` manifest type at the local domain boundary

The conformance evidence digest is `00a5d6126da5f0353dd9d45c496d4cd17cb561af6914cbde8db8c85d93cb09b2`.
