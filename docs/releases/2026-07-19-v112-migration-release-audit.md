# Receiz v112 Migration and Release Audit

Date: July 19, 2026

## Result

Receiz Commerce Kit `4.5.0` is aligned to the coordinated official `112.0.0` SDK, MCP server, and AI-skills release. The application registry overlay chains to canonical v112 digest `1356f8122d0b5fcbe891d7e6ed1e75faca827f15d63d1ed5d950664e11c146ee`; its attested digest is `df3dfedef631fb997a7212aa9a847cb966f02ff3a4bf71dec56d2d3bd29d1f88`.

Existing sealed proof objects, receipts, migration attestations, and witnessed history were preserved. Writes performed against application or proof databases: `0`.

## Official package evidence

- `@receiz/sdk@112.0.0`: `sha512-xak1lr5Ho1ywmDRA0+dXAOTM7GvTor7grvjWCbTpgTuJ+B3QW46VSYHFq2B+N6DmwKSYgtGgGsdqz1+8+QBdMQ==`
- `@receiz/mcp-server@112.0.0`: `sha512-BpAgNCxlDgKJn42+CTRf0d1yhrykM7Q+t5dpoqEyNn09ozB33KQhwP+8/lvg4bdimiS4zrVAi5tCwxEpxU5MZA==`
- `@receiz/ai-skills@112.0.0`: `sha512-zw0RtkXxdCBNKngIFxNh3E56H432L1oBAbQFBnVPYfWjn4cdOXTJ7VpZKD9yIh+Z7lN5JFlSdF+xYb5jEoQkRA==`

The checked-in `ai-skills/` doctrine matches the published v112 archive, excluding only its package manifest.

## Authority alignment

- Declared the exact nine-operation v112 application authority matrix.
- Chained the app overlay to the package-embedded v112 registry and adopted `ARTIFACT-021` through `ARTIFACT-030`.
- Migrated local artifact verification to typed `verified-artifact`, `invalid`, and `unsupported` outcomes.
- Preserved verify-before-admit profile boundaries and same-runtime custody.
- Bound portable transitions to verified predecessor, history, actor, registry law, plan, capability, sealer, staged bytes, and named commit domain.
- Kept commit coordination and registry-derived external effects outside the portable transition digest.
- Required durable staging, independent byte resolution and reverification, atomic acceptance, and report-only receipts.
- Replaced the fourteen retired coordinated MCP operations with the five current artifact tools.

## Verification evidence

- Official app upgrade inspection: compliant, no pending actions.
- SDK conformance: `15` passed, `0` failed, zero network and database calls.
- Application tests: `748` passed, `0` failed.
- V112 release lock: package, integrity, registry, thirty-law, MCP, AI-skill, lockfile, and conformance checks passed.
- Full release qualification additionally covers secret scan, typecheck, lint, guarded production build, and SDK doctor.

Release locks, migration reports, plans, staged references, and receipts remain non-authoritative reports. Sealed proof objects and atomically accepted artifact history remain stronger truth.
