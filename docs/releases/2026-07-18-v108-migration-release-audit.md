# Receiz Commerce Kit v4.1.0 / SDK v108 Release Audit

Date: 2026-07-18

## Release identity

- Application release: `4.1.0`
- Receiz SDK: `108.0.0`
- Receiz MCP server: `108.0.0`
- Receiz AI skills: `108.0.0`
- Canonical v108 registry digest: `126ca9283fee4ef4c398dbcb958e861cbea191724fdab8eb08df55ff0c14bb79`
- Application overlay registry digest: `9845ede0ec127aaa7321599c25c3e7a1cf65cd3ac4019886fe022a51945b1986`

## Supply-chain custody

The release pins the three official v108 package archives in `vendor/` and verifies their npm-published SHA-512 integrity before admission:

- `@receiz/sdk`: `sha512-LP4bZ/y4Wh8LLtdGMTRg3NeWdeS8PMyBXOWD+pNGXH3XqNgMArP4oGMiibjU7fNCG4YUhyC1QSMmeIOIU7k4Dg==`
- `@receiz/mcp-server`: `sha512-F/PwPmjkAAm9hygxSnZN+lU3BfFTNvHpivV5T//o9HxuXDHyPmnSYJBkHGZFShJmQE6i7xNzwtiUBLOeZOZ5OA==`
- `@receiz/ai-skills`: `sha512-/bOGln1erqOyJuO3z1hjaE5KhgMHepcgbcahgqBb/W6BVfsRLZe8INDpZDaJt6iOxqQGW0awzNhtfqHrP24zCA==`

## Continuity and provenance guarantees

- The migration does not rewrite historical receipts, artifacts, or causal history.
- Artifact payloads are extracted only after SDK verification succeeds.
- Imported state is decoded only from verified payload bytes; sealed container bytes never enter the domain parser.
- Artifact round trips preserve complete SDK-issued custody bytes.
- Cross-platform bearer claims preserve identity, payload, provenance root, prior history, and unknown namespaced fields.
- Causal checkpoints bind history to the canonical v108 registry and the application constitution overlay.
- Legacy v107 operations remain available only through explicit historical paths and are not current defaults.

## Verification evidence

The final release gate executes the following checks from a clean working tree candidate:

- secret scan
- 744 automated tests
- TypeScript typecheck
- lint
- production build
- 31 AI skill doctrine validations
- SDK/MCP/AI-skills exact-version and lockfile validation
- read-only v107-to-v108 migration verification
- 13 SDK conformance checks
- v108 release lock, including package integrity, registry chaining, artifact laws, current MCP tools, and executable skill manifests

The authoritative machine-readable migration attestation is `receiz.migration.v107-v108.json`. The release lock is a build admission control; sealed Receiz proof objects remain the stronger runtime truth.
