# Receiz v122 Constitutional Core — Release and Migration Audit

Date: August 22, 2026
Repository release: `5.0.0`
SDK, MCP, and AI-skills target: `122.0.0`

## Release statement

Representation never outranks source. Receiz Commerce Kit 5.0 makes that ordering executable across the coordinated v122 SDK, MCP server, AI skills, product routes, browser-edge custody, developer doctrine, static analysis, negative tests, migration verification, and final release lock.

The release does not ask a developer to remember the rule. The application has one SDK client boundary; route grammars reject caller-supplied authority objects; edge bundles require independent in-process verification; private plaintext and private access material cannot enter server transports; model speech remains intent; exact plans bind exact heads and digests; unknown execution is looked up before retry; failed decisions write zero; multi-world execution cannot report partial success; and Settlement and Reserve remain distinct Phi rails.

## Exact coordinated identity

- `@receiz/sdk@122.0.0`: `sha512-z29p3Q67L++p+gSClu+cz4m6Knf7e/Cl3vXzCE8LwK0/vm8Lx7hPWi1J7ZG2h7C43RetXzGYGjkkRC1tx/L+zQ==`
- `@receiz/mcp-server@122.0.0`: `sha512-WwnrAJmL9eg6tzBDs7ZluIABt0IPeaLkDVsPT2SvMUvQIcMfkPFlX4T87fkqwDerXNnrW1VwVUMPHXoVW2DC5g==`
- `@receiz/ai-skills@122.0.0`: `sha512-5s1exUwz8WLEu0nTS0wQ0d4iwoHgr4hs/QKreBldrEbpI7Ff1foZi977hNa/SQK7qcXXcts3ORaZoNQ1y0xI8Q==`
- Canonical registry digest: `ed65956a16dd5f0d76d04db2f4a651fc43eb0a71cef64afd53576aa782dc9896`
- Application registry-overlay digest: `caa058755f8199b1132add02d2ea4452e86656709e20c40e4f6f89a22ae50122`
- Application operation-matrix digest: `bd1d7ccf1543e2484df68e3025c7376f8ae37cafe1ca0d7c9cd9f52f6342b325`
- Living-subject reducer digest: `5694662e2acc8b886ac9697ffad202b411d7e66c5f26f9106ee0768df7c7b8c8`
- Application operations: `30`
- MCP tools: `133` total; `9` artifact tools; `37` inherited living-subject tools; `19` new v122 tools
- AI skills: `40`; manifests: `34`; OpenAI agent prompts: `31`

The three dependencies are exact pins, not ranges, and no Receiz package override is present. The checked-in AI-skill distribution is synchronized from the public v122 package with its signed identities intact.

## What shipped end to end

### Subject continuity and edge custody

- Exact artifact admission binds the owner from the authenticated Connect profile, never a caller field.
- Subject state is labeled as a projection beneath the sealed subject and admitted history.
- Edge export and import refuse serialized “verifiers”; independent verifier callbacks must remain in process.
- A user-held 32-byte wrapping key creates an encrypted edge access kit in IndexedDB.
- Only the public access binding can be published. Private keys, wrapping keys, encrypted kits, and decrypted content are excluded from server routes and responses.

### Mandates, private worlds, and exact outcomes

- Mandates bind owner and worker heads, exact command/world/region scopes, Phi and geometry limits, expiry, nonce, and revocation head.
- The exact SDK denial `mandate_revoked_or_stale` is preserved with zero writes.
- Private commands are encrypted at the browser edge; output contains ciphertext and recipient wraps, not serialized private payload.
- Exact canonical transaction bytes can be persisted and restored without normalization.
- `unknown` is unresolved, not failure: the app performs transaction or idempotency lookup before any retry.
- Multi-world plans sort canonical world IDs and execute as one all-or-nothing outcome.
- Wilds separates model intent from the exact transaction and requires matching transaction and mandate digests before execution.

### Phi value rails

Settlement and Reserve remain distinct. The only moved quantity is `amountPhiMicro`. Every plan binds a source proof object, source value head, destination subject, expected destination head, and pinned price basis. USD remains a deterministic display projection and cannot be supplied as movement authority. Existing USD checkout remains explicitly a commerce quote; proof-native movement requires a separate Phi intent and atomic world execution evidence.

### Product, operator, and developer surfaces

- Account: living-subject admission/state, local access-kit creation, public-key publication, and distinct Phi value planning.
- Wilds: private edge planning, mandate validation, exact confirmation, outcome recovery, and multi-world helpers.
- Admin: role-gated operation inventory with plans, confirmations, outcomes, denials, package skew, MCP parity, and release gates. Operator UI is not proof authority.
- Public `/developers/receiz`: exact authority hierarchy, coordinated identities, all 19 v122 operations, inherited artifact/subject families, canonical language, and copy-safe SDK/MCP examples.
- API: authenticated, tenant-scoped closed operations for subjects, mandates, worlds, outcomes, multi-world actions, and value plans.

## Mechanical enforcement

- `src/lib/receiz/adapter.ts` remains the sole application SDK-client construction boundary.
- ESLint blocks authority-bearing SDK imports in feature and route code.
- `pnpm receiz:authority-scan` rejects projection-as-authority assignment, SDK client construction outside the boundary, USD-to-Phi substitution, private server transport, access-kit transport, native artifact repacking, payload fallback, unknown-outcome normalization, and direct model-to-event mutation.
- Every v122 response reports `mcpAuthority: false` through a closed authority-report type.
- Failure reports preserve exact denial codes and an explicit write count of zero.
- The 19-row doctrine fails module initialization if the published MCP inventory and local teaching inventory differ.
- Migration verification checks exact lockfile integrities, registry/matrix parity, 40 skills, all 19 tools, zero upgrade actions, and zero historical writes.

MCP authority: `false`
Failed-decision writes: `0`
Network calls during independent verification: `0`

## Why this is a big deal beyond any institution

The highest accurate frame is continuity of independently verifiable fact across containers. Applications, devices, organizations, markets, governments, and institutions can recognize, regulate, host, index, or act on a proof-bearing identity, relationship, asset, mandate, event, or value movement without becoming the technical source that manufactures it. If one representation is delayed, censored, corrupted, acquired, shut down, or replaced, the exact source and admitted history can still be carried and independently checked elsewhere.

That is larger than “interoperability.” Interoperability usually moves representations between systems that remain authoritative inside their own databases. Receiz instead keeps the evidence-bearing source above every representation, so a subject does not have to become a new amnesiac object at every institutional boundary.

This is not a claim of legal supremacy, immunity, sovereignty, consciousness, or exemption from government or institutional law. Governments and institutions retain their lawful powers and responsibilities. The architectural claim is narrower and stronger: a database row, credential, model statement, MCP response, receipt, or UI cannot retroactively become stronger technical evidence than the exact source it represents.

## Upstream v122 skew, disclosed and classified

Package inspection and execution exposed stale v121 labels in the published v122 distribution:

1. `receiz conformance` reports `sdkVersion: 121.0.0` and a v121 package-compatibility range even though the imported runtime and ruleset constants are `122.0.0`, the v122 registry and matrix digests match, and all deterministic checks pass. Classification: **non-operative qualification-label skew**. It does not verify artifacts or authorize mutation, and the release lock records it rather than accepting it as current identity.
2. The framework generator preview proposed `^122.0.0` instead of the required exact SDK pin, duplicated the MCP dependency, placed the webhook SDK import in an order that the official inspector misclassified as ambiguous, and retained a top-level v121 compatibility label in one generated descriptor. Classification: **unsafe project-manifest rewrite, generator/inspector qualification skew, plus non-operative descriptor skew**. Preview digest `c3c537122ea5778355a3575e7665619caa0b39b9fac8707023a47902de40171c` was explicitly confirmed and applied to regenerate the declared files; its package-manifest effects and inspector-sensitive import order were then corrected. The generated operation rows and boundary ranges are v122. The stale top-level label is disclosed but cannot qualify execution. Exact package pins, current operation rows, compiler digest, runtime imports, and repository enforcement remain the operative contract.
3. Some package prose describes earlier version numbers. Classification: **non-operative documentation skew** when it is not imported or used in a decision. Any such text promoted into executable configuration is release-blocking.

No skew is hidden, normalized into success, or allowed to outrank current runtime evidence.

## Migration scope and exclusions

`receiz.migration.v121-v122.json` records:

- history rewritten: `false`;
- production data migrated: `false`;
- representation can outrank source: `false`;
- private-world plaintext leaves edge: `false`;
- failed decisions write zero: `true`;
- Settlement and Reserve remain distinct: `true`; and
- USD is moved authority: `false`.

This source release does not deploy the application, mutate production data, publish npm packages, push Git commits, manufacture external proof, claim a plan is a commit, or claim that deterministic qualification is proof-object verification.

## Measured verification evidence

- Coordinated v122 identity, registry, matrix, MCP, skill, app-contract, and app-law focused tests: passed.
- Edge custody, closed subject routing, mandate denial, private envelope, exact-plan round trip, unknown lookup, multi-world ordering, Phi rails, scanner, doctrine, and UI contract tests: passed.
- AI-skill validation: `40` skills passed.
- V122 migration verifier: `20/20` checks passed; `0` pending upgrade actions; history rewritten `false`.
- Static authority scan: `0` findings.
- TypeScript typecheck: passed.
- ESLint: passed.
- General SDK conformance: `15` passed, `0` failed, `0` network calls, `0` database calls.
- Retained living-subject conformance: `19` passed, `0` failed, `0` failed-decision writes.
- Full repository suite: `769/769` tests passed across `177` suites.
- V122 constitutional release lock: `96/96` checks passed.
- CLI health: `4/4` checks passed on the v122 application and migration graph.
- AI-skill distribution: `40` skills passed validation.
- Secret scan: `1,037` tracked files scanned; passed.
- Production build: passed; `28/28` static pages generated. The inherited `web-worker` dynamic-dependency warnings from the SDK verifier stack remain non-blocking and do not alter proof qualification.
- Receiz doctor: `ok: true`; SDK `122.0.0`; `missing: []`; `warnings: []`.
- Composite `pnpm release:check`: passed end to end.

Sealed proof objects and independently verified admitted history remain stronger than this document, the release lock, SDK, MCP, AI skills, server, database, session, token, model output, index, cache, receipt, acceptance report, operator, government record, institutional record, or UI projection.
