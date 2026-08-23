# Receiz v124.0.1 Production Runtime Release Design

**Application release:** 5.2.0  
**Package release:** 124.0.1  
**Ruleset:** 124.0.0

## Outcome

This release moves the application from v123 lawful-action primitives to the
complete v124 production runtime: canonical Kai, canonical identity challenges,
short-lived server-custodied authority sessions, durable atomic execution,
unknown-outcome recovery, authenticated public and private replay, checkpoints,
portable replay proof objects, exact-head namespaces, privacy-safe recipient
resolution, locator-bound Phi intent, and sealed-source publication.

The governing order is unchanged and release-blocking:

`sealed source/proof object > verified SDK runtime custody > authenticated remote projection > database/session/handle/receipt > MCP/AI/UI statement`

No government, company, institution, server, database, SDK, MCP server, agent,
or interface is made sovereign by this integration. The institution-independent
property is technical: an exact sealed source can be verified without accepting
an institution's representation as the source of truth. Applicable law and
legitimate institutional obligations still apply.

## Exact release coordinates

- `@receiz/sdk@124.0.1`
- `@receiz/mcp-server@124.0.1`
- `@receiz/ai-skills@124.0.1`
- ruleset `124.0.0`
- compatible range `>=124.0.0 <125.0.0`
- canonical registry `d02429151b0bcebdaeb89485792e377afc55130f9a25e07982c1c88221314247`
- operation matrix `540d1c1bf39f1b288b257c79a6e020bdcc5e587fc9b7dbf6b7aaa5d082e20ad5`
- 53 application operations, 163 MCP tools, 22 v124 MCP tools
- 42 AI skills, 36 manifests, 33 OpenAI agent prompts

The patch package version and the constitutional ruleset are intentionally
different. Code must never infer a ruleset from the package version.

## Runtime boundaries

### SDK adapter

`createReceizCommerceAdapter` exposes a frozen `v124` surface containing every
published v124 client method. The adapter binds SDK functions; it does not
reimplement verification, planning, transport authentication, or authority.

### Runtime custody

Authority sessions and durable execution handles are held by a trusted runtime
coordinator. External callers receive opaque process-local references only.
Persisted session projections may be supplied back to the canonical SDK refresh
or close path, which revalidates the signed response; JSON never mints custody.
Refresh rotates custody. Close consumes it.

### Atomic execution

The application requires a successful operational qualification before staging
or execution. It persists the exact SDK plan before staging, holds the exact SDK
handle, and executes or cancels only with a custodied active authority session.
An `unknown` outcome is resolved by execution ID or semantic idempotency key;
the application never manufactures a replacement plan or retries the mutation.
Every failed decision remains zero-write.

### Replay and sealed publication

Authenticated additions, replay, checkpoints, and private additions remain SDK
results beneath sealed source truth. Private exact additions stay in trusted-host
custody. Replay export is an unsealed, non-authoritative candidate. It must pass
the canonical Record -> Seal ceremony and admission before sealed restoration.
Source publication accepts a complete portable sealed artifact; publication
receipts and database records never replace it.

### Recipient and value privacy

Public recipient resolution uses a normalized alias, explicit purpose, operation
nonce, active session, distributed rate limit, and a one-use encrypted locator.
The destination identity and head remain server-side. Phi intent is planned by
the SDK and bound to that exact locator. USD remains display-only and Settlement
and Reserve remain distinct rails.

### MCP and AI skills

The local AI-skill tree is an exact mirror of the published package, excluding
its package manifest. Tool permission is granted only where a published skill
manifest lists the exact tool. The complete build skill may use all 22 v124
tools; focused proof-authority, value-execution, and deterministic-replay skills
receive only their published subsets. Tool presence and agent prose are never
operational or proof authority.

## Product surfaces

- `/developers/receiz` publishes the full 22-tool SDK/MCP/AI/custody map.
- `/api/receiz/v124/runtime` exposes read-only qualification and Kai reports;
  reports are explicitly non-authoritative.
- Server modules expose the full v124 orchestration contract for authenticated
  app workflows without returning private additions, exact artifacts, sessions,
  or handles to a model or browser projection.
- Existing v122 and v123 paths remain available for compatible historical flows.

## Release gates

The release fails if package identity, lockfile integrity, registry chain,
operation matrix, AI-skill parity, tool grants, adapter coverage, custody rules,
source-first doctrine, negative authority scan, migration evidence, focused
integration tests, typecheck, lint, build, or conformance diverges. Live service
availability is reported separately by v124 qualification; method presence is
not reported as production readiness.
