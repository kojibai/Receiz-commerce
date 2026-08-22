# Receiz v122 Constitutional Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the application to Receiz v122 and make every maintained v122 SDK/MCP/AI-skill outcome applicable to this product lawful, visible, tested, and mechanically unable to treat representation as source authority.

**Architecture:** Keep `src/lib/receiz/adapter.ts` as the only application SDK-client construction boundary, add primitive-specific v122 modules for authority reporting and edge custody, and expose subject, mandate, world, multi-world, and value operations through typed product routes and surfaces. Generated contracts, static scans, negative tests, MCP parity, independent verification, and a v122 release lock make authority bypass release-blocking.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript 5.6+, Node test runner, pnpm 10.29.1, `@receiz/sdk@122.0.0`, `@receiz/mcp-server@122.0.0`, `@receiz/ai-skills@122.0.0`.

**Spec:** `docs/superpowers/specs/2026-08-21-receiz-v122-constitutional-integration-design.md`

## Global Constraints

- Pin SDK, MCP, and AI skills exactly to `122.0.0`; no Receiz package overrides.
- Require registry digest `ed65956a16dd5f0d76d04db2f4a651fc43eb0a71cef64afd53576aa782dc9896`.
- Require operation-matrix digest `bd1d7ccf1543e2484df68e3025c7376f8ae37cafe1ca0d7c9cd9f52f6342b325`.
- Exact native Record -> Seal bytes and independently verified admitted history remain stronger than SDK, MCP, AI, server, database, session, index, receipt, cache, and UI.
- MCP responses always remain non-authoritative and report `mcpAuthority: false`.
- AI may reason, speak, and propose intent; only typed SDK command or atomic transaction admission may mutate canonical state.
- Every expected failure and conflict must report zero writes.
- Private world plaintext and private access material remain at the edge.
- Settlement and Reserve are distinct Phi rails; only `amountPhiMicro` moves and USD remains a pinned projection.
- Follow test-driven development for every behavior change: failing test, observed failure, minimal implementation, passing test, refactor.
- Do not weaken a test, hide package skew, invent authority, or claim completion before the v122 release lock passes.
- This execution stays inline; the current session instruction does not authorize subagent delegation.

---

### Task 1: Coordinated v122 package and generated-contract migration

**Files:**
- Modify: `package.json`
- Modify: `pnpm-lock.yaml`
- Modify: `receiz.app.json`
- Modify: `receiz.constitution.json`
- Modify: `receiz.generated.json`
- Modify: `receiz/receiz.adapter.ts`
- Modify: `receiz/receiz.boundaries.ts`
- Modify: `receiz/receiz.browser.ts`
- Modify: `receiz/receiz.conformance.test.ts`
- Modify: `receiz/receiz.environment.ts`
- Modify: `receiz/receiz.extensions.types.ts`
- Modify: `receiz/receiz.public-store.ts`
- Modify: `receiz/receiz.server.ts`
- Create: `receiz.migration.v121-v122.json`
- Create: `scripts/receiz-v122-migration-verify.mjs`
- Create: `scripts/receiz-v122-release-lock.mjs`
- Replace mechanically from package: `ai-skills/**`
- Create: `tests/receiz-v122-constitution.test.ts`
- Delete: `tests/receiz-v121-constitution.test.ts`
- Modify: `tests/receiz-app-contract.test.ts`

**Interfaces:**
- Consumes: published v122 package identities and the approved constitutional design.
- Produces: installed v122 packages, current generated app matrix, aligned local AI skills, `pnpm receiz:migrate:verify`, and `pnpm receiz:release-lock`.

- [ ] **Step 1: Rename the v121 constitutional test and make package identity assertions fail against the installed v121 packages**

Create `tests/receiz-v122-constitution.test.ts` from the v121 test and replace its identity assertions with:

```ts
import {
  RECEIZ_MCP_TOOLS,
  RECEIZ_V122_MCP_TOOL_NAMES,
} from "@receiz/mcp-server";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const V122_REGISTRY = "ed65956a16dd5f0d76d04db2f4a651fc43eb0a71cef64afd53576aa782dc9896";
const V122_MATRIX = "bd1d7ccf1543e2484df68e3025c7376f8ae37cafe1ca0d7c9cd9f52f6342b325";

describe("Receiz v122 coordinated identity", () => {
  it("pins SDK, registry, matrix, MCP, and AI skills to one current identity", () => {
    const skills = JSON.parse(readFileSync("ai-skills/skills.json", "utf8"));
    assert.equal(RECEIZ_SDK_VERSION, "122.0.0");
    assert.equal(RECEIZ_GENERATED_V122_REGISTRY_DIGEST, V122_REGISTRY);
    assert.equal(RECEIZ_CURRENT_APPLICATION_OPERATION_MATRIX_DIGEST, V122_MATRIX);
    assert.equal(skills.version, "122.0.0");
    assert.equal(skills.registryDigest, V122_REGISTRY);
    assert.equal(skills.operationMatrixDigest, V122_MATRIX);
    assert.equal(RECEIZ_V122_MCP_TOOL_NAMES.length, 19);
    const names = new Set(RECEIZ_MCP_TOOLS.map((tool) => tool.name));
    for (const name of RECEIZ_V122_MCP_TOOL_NAMES) assert.equal(names.has(name), true, name);
  });
});
```

Add static named imports for `RECEIZ_GENERATED_V122_REGISTRY_DIGEST` and `RECEIZ_SDK_VERSION` from the v122 root runtime entrypoint, and `RECEIZ_CURRENT_APPLICATION_OPERATION_MATRIX_DIGEST` from the v122 compiler entrypoint. Keeping the compiler symbol on the compiler entrypoint is part of the assertion.

- [ ] **Step 2: Run the focused test and observe the version failure**

Run: `node --import tsx --test tests/receiz-v122-constitution.test.ts`

Expected: FAIL because `RECEIZ_SDK_VERSION` is `121.0.0` or the v122 export is absent.

- [ ] **Step 3: Install the exact published packages and align scripts**

Run: `pnpm add -E @receiz/sdk@122.0.0 @receiz/mcp-server@122.0.0 @receiz/ai-skills@122.0.0`

Update `package.json`:

```json
{
  "version": "4.13.0",
  "scripts": {
    "receiz:check": "receiz app check --target 122.0.0 --json",
    "receiz:migrate:verify": "node scripts/receiz-v122-migration-verify.mjs --root .",
    "receiz:release-lock": "node scripts/receiz-v122-release-lock.mjs",
    "receiz:authority-scan": "node scripts/receiz-v122-authority-scan.mjs"
  }
}
```

Copy the published skill distribution without deleting unrelated files:

```bash
rsync -a --exclude package.json node_modules/@receiz/ai-skills/ ai-skills/
```

Run `receiz app upgrade --root . --target 122.0.0 --json`, record the exact read-only plan, then use the CLI's exact preview digest confirmation to regenerate only the declared contract files. Do not hand-author generated files or accept a preview with authority-bypass findings.

- [ ] **Step 4: Add a v121-to-v122 migration attestation and verifier**

Create `receiz.migration.v121-v122.json` with exact package integrities, registry/matrix digests, zero history rewrites, zero production data migration, and these mandatory v122 assertions:

```json
{
  "schema": "receiz.repository.v121-v122.migration-attestation.v1",
  "sourceVersion": "121.0.0",
  "targetVersion": "122.0.0",
  "canonicalRegistryDigest": "ed65956a16dd5f0d76d04db2f4a651fc43eb0a71cef64afd53576aa782dc9896",
  "operationMatrixDigest": "bd1d7ccf1543e2484df68e3025c7376f8ae37cafe1ca0d7c9cd9f52f6342b325",
  "historyRewritten": false,
  "productionDataMigrated": false,
  "representationCanOutrankSource": false,
  "privateWorldPlaintextLeavesEdge": false,
  "failedDecisionsWriteZero": true,
  "settlementAndReserveRemainDistinct": true,
  "usdIsMovedAuthority": false,
  "publicPackageIntegrities": {
    "@receiz/sdk": "sha512-z29p3Q67L++p+gSClu+cz4m6Knf7e/Cl3vXzCE8LwK0/vm8Lx7hPWi1J7ZG2h7C43RetXzGYGjkkRC1tx/L+zQ==",
    "@receiz/mcp-server": "sha512-WwnrAJmL9eg6tzBDs7ZluIABt0IPeaLkDVsPT2SvMUvQIcMfkPFlX4T87fkqwDerXNnrW1VwVUMPHXoVW2DC5g==",
    "@receiz/ai-skills": "sha512-5s1exUwz8WLEu0nTS0wQ0d4iwoHgr4hs/QKreBldrEbpI7Ff1foZi977hNa/SQK7qcXXcts3ORaZoNQ1y0xI8Q=="
  }
}
```

Implement `scripts/receiz-v122-migration-verify.mjs` by adapting the v121 verifier to require `122.0.0`, the v122 digests, all 19 `RECEIZ_V122_MCP_TOOL_NAMES`, 40 skills, and zero pending upgrade actions.

- [ ] **Step 5: Run the identity, migration, app-contract, and AI-skill checks**

Run:

```bash
node --import tsx --test tests/receiz-v122-constitution.test.ts tests/receiz-app-contract.test.ts
pnpm validate:ai-skills
pnpm receiz:migrate:verify
```

Expected: PASS with exact v122 identities and no history rewrite.

- [ ] **Step 6: Commit the coordinated migration**

```bash
git add package.json pnpm-lock.yaml receiz.app.json receiz.constitution.json receiz.generated.json receiz ai-skills receiz.migration.v121-v122.json scripts/receiz-v122-migration-verify.mjs scripts/receiz-v122-release-lock.mjs tests/receiz-v121-constitution.test.ts tests/receiz-v122-constitution.test.ts tests/receiz-app-contract.test.ts
git commit -m "release: migrate constitutional core to Receiz v122"
```

---

### Task 2: Canonical v122 capability catalog and representation boundary

**Files:**
- Create: `src/lib/receiz/v122/contract.ts`
- Create: `src/lib/receiz/v122/authority-report.ts`
- Create: `tests/receiz-v122-contract.test.ts`

**Interfaces:**
- Consumes: v122 SDK registry/matrix exports and MCP tool names.
- Produces: `RECEIZ_V122_CONTRACT`, `ReceizAuthorityReport`, `projectionReport`, and `zeroWriteReport`.

- [ ] **Step 1: Write failing contract and representation tests**

```ts
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { RECEIZ_V122_CONTRACT } from "../src/lib/receiz/v122/contract";
import { projectionReport, zeroWriteReport } from "../src/lib/receiz/v122/authority-report";

describe("Receiz v122 representation boundary", () => {
  it("maps all 19 v122 MCP tools without granting MCP authority", () => {
    assert.equal(RECEIZ_V122_CONTRACT.mcpTools.length, 19);
    assert.equal(RECEIZ_V122_CONTRACT.authority.strongerTruth, "sealed-receiz-proof-object");
    assert.equal(RECEIZ_V122_CONTRACT.authority.mcpAuthority, false);
  });

  it("marks projections as unproven and failures as zero-write", () => {
    assert.deepEqual(projectionReport("receiz.subject.state.v122", "server-projection"), {
      primitive: "receiz.subject.state.v122",
      actionClass: "projection",
      source: "server-projection",
      mcpAuthority: false,
      proven: false,
      writes: 0,
    });
    assert.equal(zeroWriteReport("receiz.world.transaction.v122", "participant_head_mismatch").writes, 0);
  });
});
```

- [ ] **Step 2: Run the focused tests and observe missing-module failures**

Run: `node --import tsx --test tests/receiz-v122-contract.test.ts`

Expected: FAIL because `src/lib/receiz/v122/contract.ts` does not exist.

- [ ] **Step 3: Implement the immutable contract and reports**

`contract.ts` must import current identities from the packages and freeze the exact tool inventory:

```ts
import { RECEIZ_V122_MCP_TOOL_NAMES } from "@receiz/mcp-server";

export const RECEIZ_V122_CONTRACT = Object.freeze({
  sdkVersion: RECEIZ_SDK_VERSION,
  registryDigest: RECEIZ_GENERATED_V122_REGISTRY_DIGEST,
  operationMatrixDigest: RECEIZ_CURRENT_APPLICATION_OPERATION_MATRIX_DIGEST,
  mcpTools: Object.freeze([...RECEIZ_V122_MCP_TOOL_NAMES]),
  authority: Object.freeze({
    strongerTruth: "sealed-receiz-proof-object" as const,
    mcpAuthority: false as const,
    representationCanAuthorize: false as const,
  }),
});
```

Use static named imports for `RECEIZ_GENERATED_V122_REGISTRY_DIGEST` and `RECEIZ_SDK_VERSION` from the root runtime entrypoint, and for `RECEIZ_CURRENT_APPLICATION_OPERATION_MATRIX_DIGEST` from the compiler entrypoint. Do not use a namespace, default, or dynamic SDK import.

`authority-report.ts` must use a closed union and never accept an authority object from callers:

```ts
export type ReceizActionClass = "read" | "preview" | "plan" | "stage" | "commit" | "projection";

export type ReceizAuthorityReport = Readonly<{
  primitive: string;
  actionClass: ReceizActionClass;
  source: string;
  mcpAuthority: false;
  proven: boolean;
  writes: 0 | 1;
  denialCode?: string;
}>;

export const projectionReport = (primitive: string, source: string): ReceizAuthorityReport => Object.freeze({
  primitive,
  actionClass: "projection",
  source,
  mcpAuthority: false,
  proven: false,
  writes: 0,
});

export const zeroWriteReport = (primitive: string, denialCode: string): ReceizAuthorityReport => Object.freeze({
  primitive,
  actionClass: "commit",
  source: "canonical-v122-sdk",
  mcpAuthority: false,
  proven: false,
  writes: 0,
  denialCode,
});
```

- [ ] **Step 4: Run tests and commit**

Run: `node --import tsx --test tests/receiz-v122-contract.test.ts`

Expected: PASS.

```bash
git add src/lib/receiz/v122 tests/receiz-v122-contract.test.ts
git commit -m "feat: add v122 constitutional capability contract"
```

---

### Task 3: Primitive-specific SDK adapter surface

**Files:**
- Modify: `src/lib/receiz/adapter.ts`
- Create: `tests/receiz-v122-adapter.test.ts`

**Interfaces:**
- Consumes: `ReceizClient` v122 subjects, subjectMandates, world, and value namespaces.
- Produces: `adapter.v122.subjects`, `adapter.v122.mandates`, `adapter.v122.world`, and `adapter.v122.value` with bound functions.

- [ ] **Step 1: Write a failing adapter-surface test**

```ts
import assert from "node:assert/strict";
import { it } from "node:test";
import { createReceizCommerceAdapter } from "../src/lib/receiz/adapter";

it("exposes every v122 primitive through the sole SDK client boundary", () => {
  const adapter = createReceizCommerceAdapter({ baseUrl: "https://receiz.invalid" });
  assert.equal(typeof adapter.v122.subjects.admit, "function");
  assert.equal(typeof adapter.v122.subjects.exportEdgeBundle, "function");
  assert.equal(typeof adapter.v122.mandates.issue, "function");
  assert.equal(typeof adapter.v122.world.planPrivateCommand, "function");
  assert.equal(typeof adapter.v122.world.executeMultiWorldTransaction, "function");
  assert.equal(typeof adapter.v122.value.planSettlement, "function");
  assert.equal(typeof adapter.v122.value.planReserve, "function");
});
```

- [ ] **Step 2: Run the test and observe `v122` is absent**

Run: `node --import tsx --test tests/receiz-v122-adapter.test.ts`

Expected: FAIL because `adapter.v122` is undefined.

- [ ] **Step 3: Add exact nested adapter types and bound implementations**

Add this interface shape to `ReceizCommerceAdapter`:

```ts
v122: Readonly<{
  subjects: Readonly<Pick<ReceizClient["subjects"], "admit" | "state" | "exportEdgeBundle" | "importEdgeBundle" | "accessBinding" | "publishAccessKey">>;
  mandates: Readonly<Pick<ReceizClient["subjectMandates"], "issue" | "state" | "revoke">>;
  world: Readonly<Pick<ReceizClient["world"], "planPrivateCommand" | "planAccessAppend" | "validateTransaction" | "executeTransactionV122" | "execution" | "executionByIdempotencyKey" | "additionsV122" | "planMultiWorldTransaction" | "executeMultiWorldTransaction">>;
  value: Readonly<Pick<ReceizClient["value"], "planSettlement" | "planReserve" | "quoteDisplayUsd" | "validateDisplayPrice" | "validateIntent">>;
}>;
```

Construct `v122` with wrappers such as `admit: (input) => client.subjects.admit(input)` so no method loses its receiver. Do not expose a second raw client or accept serializable verification, capability, receipt, or admission shapes.

- [ ] **Step 4: Run adapter and existing capability-boundary tests**

Run:

```bash
node --import tsx --test tests/receiz-v122-adapter.test.ts tests/receiz-capabilities.test.ts
pnpm typecheck
```

Expected: PASS with no `createReceizClient` call added outside the approved adapter/generated boundaries.

- [ ] **Step 5: Commit**

```bash
git add src/lib/receiz/adapter.ts tests/receiz-v122-adapter.test.ts
git commit -m "feat: expose v122 SDK primitives through Receiz adapter"
```

---

### Task 4: Edge custody and living-subject continuity

**Files:**
- Create: `src/lib/receiz/v122/edge-custody.ts`
- Create: `src/lib/receiz/v122/subject-request.ts`
- Create: `app/api/receiz/v122/subjects/route.ts`
- Create: `src/features/account/ReceizSubjectContinuity.tsx`
- Modify: `src/features/account/AccountDashboard.tsx`
- Create: `tests/receiz-v122-edge-custody.test.ts`
- Create: `tests/receiz-v122-subject-route.test.ts`

**Interfaces:**
- Consumes: exact artifact files, authenticated Receiz session identity, `adapter.v122.subjects`, and SDK edge access helpers.
- Produces: `createEdgeAccessKit`, `storeEdgeAccessKit`, `loadEdgeAccessKit`, subject admit/state/export/import/access-binding/publish operations, and the account continuity surface.

- [ ] **Step 1: Write failing edge-custody tests**

```ts
import assert from "node:assert/strict";
import { it } from "node:test";
import { createEdgeAccessKit, edgeKitStorageKey } from "../src/lib/receiz/v122/edge-custody";

it("creates an encrypted edge kit while returning only the public binding for publication", async () => {
  const wrappingKey = new Uint8Array(32).fill(7);
  const result = await createEdgeAccessKit({
    subjectId: "subject-1",
    subjectHead: "head-1",
    edgeWrappingKey: wrappingKey,
  });
  assert.equal(result.publicBinding.schema, "receiz.subject.access-public-key.v122");
  assert.equal(result.accessKit.schema, "receiz.subject.edge-access-kit.v122");
  assert.equal("encryptedPrivateKeyB64u" in result.publicBinding, false);
  assert.equal(edgeKitStorageKey("subject-1"), "receiz:v122:edge-access-kit:subject-1");
});
```

- [ ] **Step 2: Run the test and observe the missing edge module**

Run: `node --import tsx --test tests/receiz-v122-edge-custody.test.ts`

Expected: FAIL because `edge-custody.ts` does not exist.

- [ ] **Step 3: Implement edge-only access-key creation and storage separation**

Use `createReceizSubjectAccessKeyV122` directly for local cryptography. Export only the public binding to network callers. Store the encrypted kit in IndexedDB through a small `ReceizEdgeCustodyStore` interface; do not place it in application state, server routes, logs, or the browser admission ledger.

```ts
export const edgeKitStorageKey = (subjectId: string) => `receiz:v122:edge-access-kit:${subjectId}`;

export const createEdgeAccessKit = createReceizSubjectAccessKeyV122;

export type ReceizEdgeCustodyStore = Readonly<{
  put(subjectId: string, encryptedKitJson: string): Promise<void>;
  get(subjectId: string): Promise<string | null>;
}>;
```

Import `createReceizSubjectAccessKeyV122` as a static named root-runtime symbol in the production file.

- [ ] **Step 4: Write failing subject-route tests for authenticated owner binding and zero-write conflicts**

Test multipart admission uses the authenticated Connect profile handle instead of a caller-supplied owner, exact idempotency keys are required, state responses are labeled projections, and SDK failures preserve `writes: 0`. Test GET actions for state/access binding and POST actions for admit/import/export/publish binding with closed discriminated unions.

The parser's public operation type is exact and contains no authority-bearing receipt, verification, capability, or admission field:

```ts
export type ReceizSubjectRouteOperation =
  | Readonly<{ action: "state"; subjectId: string }>
  | Readonly<{ action: "accessBinding"; subjectId: string }>
  | Readonly<{ action: "admit"; artifact: File; idempotencyKey: string }>
  | Readonly<{ action: "exportEdgeBundle"; subjectId: string }>
  | Readonly<{ action: "importEdgeBundle"; bundle: ReceizSubjectEdgeBundleV122 }>
  | Readonly<{ action: "publishAccessKey"; publicBinding: ReceizSubjectAccessPublicBindingV122; expectedAccessKeyHead: string | null }>;
```

- [ ] **Step 5: Implement subject request parsing, route handlers, and account UI**

The route must obtain `receizRequestSession`, require the tenant-scoped access token, load the Connect profile, construct the adapter with that token, and call only the matching `adapter.v122.subjects` primitive. It must never accept a verification result, receipt, owner proof, capability, or state object as authority.

The account surface displays:

- exact subject/proof/head identifiers;
- source versus projection status;
- admit exact proof object;
- export and independently verify edge bundle;
- import verified bundle;
- create encrypted access kit locally;
- publish only the public binding;
- zero-write denial evidence.

- [ ] **Step 6: Run subject tests, typecheck, and commit**

Run:

```bash
node --import tsx --test tests/receiz-v122-edge-custody.test.ts tests/receiz-v122-subject-route.test.ts
pnpm typecheck
```

Expected: PASS; private access-kit material never appears in route output.

```bash
git add src/lib/receiz/v122/edge-custody.ts src/lib/receiz/v122/subject-request.ts app/api/receiz/v122/subjects/route.ts src/features/account/ReceizSubjectContinuity.tsx src/features/account/AccountDashboard.tsx tests/receiz-v122-edge-custody.test.ts tests/receiz-v122-subject-route.test.ts
git commit -m "feat: add v122 living-subject edge continuity"
```

---

### Task 5: Mandates, private worlds, exact outcomes, and multi-world atomicity

**Files:**
- Create: `src/lib/receiz/v122/world-request.ts`
- Create: `app/api/receiz/v122/mandates/route.ts`
- Create: `app/api/receiz/v122/world/route.ts`
- Create: `src/features/play/receiz-v122-world.ts`
- Modify: `src/features/play/use-wilds-world.ts`
- Create: `tests/receiz-v122-mandates.test.ts`
- Create: `tests/receiz-v122-world.test.ts`

**Interfaces:**
- Consumes: exact subject/world heads, edge-planned private envelopes, exact persisted transactions, mandate digests, and `adapter.v122` world/mandate primitives.
- Produces: typed mandate issue/state/revoke, private planning, validation, execution, lookup-before-retry, additions, and multi-world plan/execute paths.

- [ ] **Step 1: Write failing mandate-law tests**

```ts
import assert from "node:assert/strict";
import { it } from "node:test";
import { validateWildsMandateUse } from "../src/features/play/receiz-v122-world";

it("revocation-head mismatch rejects autonomous execution with zero writes", async () => {
  const mandate = await createReceizSubjectMandateV122({
    ownerSubjectId: "owner",
    workerSubjectId: "worker",
    allowedCommandKinds: ["wilds.explore"],
    worldIds: ["world-a"],
    regionIds: ["region-a"],
    maximumResourcePhiMicro: "1000",
    maximumGeometryUnits: "25",
    expiresAtKai: "500",
    nonce: "nonce-1",
    expectedOwnerHead: "owner-head",
    expectedWorkerHead: "worker-head",
    revocationHead: "revocation-1",
  });
  const result = await validateWildsMandateUse({
    mandate,
    commandKind: "wilds.explore",
    worldId: "world-a",
    regionId: "region-a",
    resourcePhiMicro: "1",
    geometryUnits: "1",
    currentKai: "100",
    ownerHead: "owner-head",
    workerHead: "worker-head",
    revocationHead: "revocation-2",
  });
  assert.deepEqual(result, { ok: false, code: "mandate_revoked", writesOnFailure: 0 });
});
```

Import `createReceizSubjectMandateV122` as a static named root-runtime symbol in the test file.

- [ ] **Step 2: Run the mandate test and capture the exact SDK denial code**

Run: `node --import tsx --test tests/receiz-v122-mandates.test.ts`

Expected: FAIL only if the published SDK denial code differs; update the expected literal to the exact SDK output, never normalize the SDK result.

- [ ] **Step 3: Write failing private-world and recovery tests**

Tests must prove:

- `planPrivateCommand` output contains ciphertext and recipient wraps but no serialized private payload;
- exact planned transaction bytes round-trip through `persistReceizExactPlannedTransaction` and `restoreReceizExactPlannedTransaction`;
- `unknown` execution invokes `execution` or `executionByIdempotencyKey` before retry;
- stale participant/world heads produce zero writes;
- multi-world planning sorts canonical world IDs and rejects partial execution.

- [ ] **Step 4: Implement closed route operations and Wilds integration**

Use distinct discriminants:

```ts
export type ReceizWorldOperation =
  | Readonly<{ action: "validate"; transaction: ReceizWorldTransactionV122 }>
  | Readonly<{ action: "execute"; transaction: ReceizWorldTransactionV122 }>
  | Readonly<{ action: "execution"; worldId: string; transactionId: string }>
  | Readonly<{ action: "executionByIdempotency"; worldId: string; idempotencyKey: string }>
  | Readonly<{ action: "additions"; worldId: string; afterHead?: string }>
  | Readonly<{ action: "planMultiWorld"; worlds: ReceizMultiWorldTransactionV122["worlds"]; idempotencyKey: string }>
  | Readonly<{ action: "executeMultiWorld"; plan: ReceizMultiWorldTransactionV122 }>;
```

Private planning remains in `src/features/play/receiz-v122-world.ts` at the browser edge. The server route refuses `privatePayload`, private keys, edge wrapping keys, access kits, and decrypted envelope content. Wilds displays model intent separately from the exact transaction plan and requires explicit confirmation of the plan/mandate digest before execution.

The recovery helper must return `committed` or `zero-write` directly and resolve `unknown` before permitting a retry. It must never map `unknown` to failure.

- [ ] **Step 5: Run world, Wilds, type, and privacy tests**

Run:

```bash
node --import tsx --test tests/receiz-v122-mandates.test.ts tests/receiz-v122-world.test.ts
pnpm typecheck
```

Expected: PASS with no private plaintext in server request fixtures and no partial multi-world success.

- [ ] **Step 6: Commit**

```bash
git add src/lib/receiz/v122/world-request.ts app/api/receiz/v122/mandates/route.ts app/api/receiz/v122/world/route.ts src/features/play/receiz-v122-world.ts src/features/play/use-wilds-world.ts tests/receiz-v122-mandates.test.ts tests/receiz-v122-world.test.ts
git commit -m "feat: enforce v122 mandate and world execution law"
```

---

### Task 6: Settlement and Reserve Phi value rails

**Files:**
- Create: `src/lib/receiz/v122/value-request.ts`
- Create: `app/api/receiz/v122/value/route.ts`
- Create: `src/features/account/ReceizValueRails.tsx`
- Modify: `src/features/account/AccountDashboard.tsx`
- Modify: `src/lib/checkout/receiz-settlement.ts`
- Create: `tests/receiz-v122-value-rails.test.ts`

**Interfaces:**
- Consumes: source proof/head, destination subject/head, Phi amount, canonical price basis, and one explicit rail.
- Produces: `planReceizValue`, `ReceizValueRails` UI, atomic value-intent attachment, and deterministic USD display validation.

- [ ] **Step 1: Write failing Phi-only movement tests**

```ts
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { planReceizValue } from "../src/lib/receiz/v122/value-request";

describe("Receiz v122 value rails", () => {
  it("plans Settlement in Phi and keeps USD subordinate", async () => {
    const intent = await planReceizValue({
      rail: "settlement",
      amountPhiMicro: "2500000",
      sourceProofObjectId: "proof-1",
      sourceValueHead: "value-head-1",
      destinationSubjectId: "subject-2",
      expectedDestinationHead: "subject-head-2",
      usdPerPhiMicrocents: "200",
      priceBasis: { source: "canonical-receiz-price", kai: "13730000" },
    });
    assert.equal(intent.rail, "settlement");
    assert.equal(intent.amountPhiMicro, "2500000");
    assert.equal(typeof intent.quotedUsdCents, "string");
  });

  it("rejects USD as movement authority", async () => {
    await assert.rejects(
      planReceizValue({ rail: "reserve", amountUsdCents: "500" } as never),
      /amountPhiMicro/,
    );
  });
});
```

- [ ] **Step 2: Run the tests and observe the missing value planner**

Run: `node --import tsx --test tests/receiz-v122-value-rails.test.ts`

Expected: FAIL because `value-request.ts` does not exist.

- [ ] **Step 3: Implement the explicit rail planner and route**

`planReceizValue` accepts a discriminated `rail` and dispatches only to `planReceizSettlementV122` or `planReceizReserveV122`. Reject missing/zero/negative/non-decimal Phi, missing proof/head bindings, and any `amountUsdCents` property before planning. Validate the returned intent with `validateReceizValueIntentV122`.

The server route calls `adapter.v122.value.planSettlement` or `.planReserve`, returns a plan report with `mcpAuthority: false`, and never reports movement as committed. Committed value is represented only after an authenticated world execution receipt validates the same `valueIntentDigest` atomically.

- [ ] **Step 4: Add account and checkout representation**

The account component labels Settlement and Reserve separately, shows Phi as the moved quantity, and marks USD as `deterministic display projection`. Update checkout settlement copy and types so existing USD checkout remains a commerce quote while any v122 proof-native value movement requires an explicit Phi intent and source proof/head.

- [ ] **Step 5: Run value, checkout, and type tests**

Run:

```bash
node --import tsx --test tests/receiz-v122-value-rails.test.ts tests/receiz-settlement.test.ts tests/checkout-authority.test.ts
pnpm typecheck
```

Expected: PASS; no value route accepts USD as moved authority.

- [ ] **Step 6: Commit**

```bash
git add src/lib/receiz/v122/value-request.ts app/api/receiz/v122/value/route.ts src/features/account/ReceizValueRails.tsx src/features/account/AccountDashboard.tsx src/lib/checkout/receiz-settlement.ts tests/receiz-v122-value-rails.test.ts
git commit -m "feat: add distinct v122 Phi value rails"
```

---

### Task 7: Static constitutional enforcement and negative law suite

**Files:**
- Create: `scripts/receiz-v122-authority-scan.mjs`
- Create: `tests/receiz-v122-authority-scan.test.ts`
- Modify: `tests/receiz-capabilities.test.ts`
- Modify: `eslint.config.mjs`

**Interfaces:**
- Consumes: repository source and the list of approved SDK boundary files.
- Produces: deterministic JSON scan report and release-blocking lint/test failures.

- [ ] **Step 1: Write failing scanner fixture tests**

```ts
import assert from "node:assert/strict";
import { it } from "node:test";
import { scanReceizV122Authority } from "../scripts/receiz-v122-authority-scan.mjs";

it("rejects representation used as source authority", () => {
  const findings = scanReceizV122Authority(`
    state.ownerId = apiProjection.ownerId;
    const amountPhiMicro = body.amountUsdCents;
    await execute({ privatePayload: body.privatePayload });
  `, "fixture.ts");
  assert.deepEqual(findings.map((finding) => finding.code).sort(), [
    "PRIVATE_WORLD_PLAINTEXT_TRANSPORT_FORBIDDEN",
    "PROJECTION_AS_AUTHORITY_FORBIDDEN",
    "USD_AS_MOVED_AUTHORITY_FORBIDDEN",
  ]);
});
```

- [ ] **Step 2: Run the scanner test and observe the missing script**

Run: `node --import tsx --test tests/receiz-v122-authority-scan.test.ts`

Expected: FAIL because the scanner module does not exist.

- [ ] **Step 3: Implement deterministic source scanning and import restrictions**

The scanner must emit stable findings for:

- SDK client construction outside `src/lib/receiz/adapter.ts` and approved generated `receiz/` files;
- direct canonical state assignment from projection/receipt/MCP/session/cache values;
- payload fallback, native artifact repacking, or artifact-to-payload-parser misuse;
- USD assigned to Phi authority;
- private plaintext or access kits in server transports;
- last-write-wins, timestamp-as-head, silent divergence, or unknown-outcome normalization;
- AI/model output appended directly as an event.

Add ESLint `no-restricted-imports` overrides so feature and route files cannot import `createReceizClient`, commit primitives, or authority constructors directly from `@receiz/sdk`.

- [ ] **Step 4: Add repository-wide negative assertions**

Extend `tests/receiz-capabilities.test.ts` to assert every source route uses the adapter, every v122 MCP name is mapped in `RECEIZ_V122_CONTRACT`, every authority report hardcodes `mcpAuthority: false`, and no API response calls a projection `verified` unless exact SDK verification evidence is present.

- [ ] **Step 5: Run scanner, lint, tests, and commit**

Run:

```bash
pnpm receiz:authority-scan
pnpm lint
node --import tsx --test tests/receiz-v122-authority-scan.test.ts tests/receiz-capabilities.test.ts
```

Expected: PASS with zero blocking findings.

```bash
git add scripts/receiz-v122-authority-scan.mjs tests/receiz-v122-authority-scan.test.ts tests/receiz-capabilities.test.ts eslint.config.mjs
git commit -m "test: make Receiz authority bypass release-blocking"
```

---

### Task 8: Developer doctrine and role-gated Receiz operations surface

**Files:**
- Create: `src/lib/receiz/v122/doctrine.ts`
- Create: `app/developers/receiz/page.tsx`
- Create: `src/features/admin/ReceizOperationsPanel.tsx`
- Modify: `src/features/admin/AdminStudio.tsx`
- Modify: `middleware.ts`
- Create: `tests/receiz-v122-doctrine.test.ts`
- Create: `tests/receiz-v122-operations-ui.test.ts`

**Interfaces:**
- Consumes: `RECEIZ_V122_CONTRACT`, primitive route metadata, AI-skill names, and release evidence.
- Produces: `RECEIZ_V122_DOCTRINE`, a public executable doctrine page, and a role-gated operator evidence surface.

- [ ] **Step 1: Write failing doctrine-completeness tests**

```ts
import assert from "node:assert/strict";
import { it } from "node:test";
import { RECEIZ_V122_DOCTRINE } from "../src/lib/receiz/v122/doctrine";

it("teaches every v122 MCP operation with source-first evidence", () => {
  assert.equal(RECEIZ_V122_DOCTRINE.length, 19);
  for (const entry of RECEIZ_V122_DOCTRINE) {
    assert.equal(entry.mcpAuthority, false);
    assert.ok(entry.strongestSource.length > 0);
    assert.ok(entry.sdkOperation.length > 0);
    assert.ok(entry.mcpTool.startsWith("receiz_v122_"));
    assert.ok(entry.prohibitedShortcut.length > 0);
    assert.ok(entry.requiredEvidence.length > 0);
  }
});
```

- [ ] **Step 2: Run the doctrine test and observe the missing module**

Run: `node --import tsx --test tests/receiz-v122-doctrine.test.ts`

Expected: FAIL because `doctrine.ts` does not exist.

- [ ] **Step 3: Implement the exact 19-row doctrine catalog**

Each row must include:

```ts
export type ReceizDoctrineEntry = Readonly<{
  domain: "subject" | "world" | "mandate" | "multi-world" | "value";
  strongestSource: string;
  sdkOperation: string;
  mcpTool: string;
  aiSkill: string;
  actionClass: "read" | "plan" | "write";
  mcpAuthority: false;
  prohibitedShortcut: string;
  requiredEvidence: readonly string[];
}>;
```

Populate one row for each exact name in `RECEIZ_V122_MCP_TOOL_NAMES`; fail module initialization if names differ or a duplicate/missing row exists.

- [ ] **Step 4: Build public doctrine and operator evidence UI**

`/developers/receiz` must render the authority hierarchy, exact v122 identities, source/projection distinction, all 19 new operations, the nine artifact tools, inherited subject/Twin/world/bearer families, canonical language, copy-paste SDK/MCP examples, and release evidence. Examples are imported from tested modules so documentation cannot drift from code.

The admin panel shows plans, stages, confirmations, outcomes, denials, MCP parity, package skew, and release gates. It never labels the operator UI as proof authority and never sends a write until the exact plan/tool/input/effect confirmation is visible.

Keep `/admin` role-gated through existing middleware. The public doctrine page is read-only and requires no credentials.

- [ ] **Step 5: Run UI contract tests and commit**

Run:

```bash
node --import tsx --test tests/receiz-v122-doctrine.test.ts tests/receiz-v122-operations-ui.test.ts tests/account-route-session.test.ts
pnpm typecheck
```

Expected: PASS with 19 unique rows and no source/representation language inversion.

```bash
git add src/lib/receiz/v122/doctrine.ts app/developers/receiz/page.tsx src/features/admin/ReceizOperationsPanel.tsx src/features/admin/AdminStudio.tsx middleware.ts tests/receiz-v122-doctrine.test.ts tests/receiz-v122-operations-ui.test.ts
git commit -m "docs: ship executable Receiz v122 developer doctrine"
```

---

### Task 9: Release narrative, independent evidence, and final release lock

**Files:**
- Modify: `README.md`
- Modify: `.env.example`
- Modify: `docs/SDK_RAILS.md`
- Create: `docs/releases/2026-08-21-v122-constitutional-core-release.md`
- Modify: `scripts/receiz-v122-release-lock.mjs`
- Modify: `tests/release-guard.test.ts`

**Interfaces:**
- Consumes: all prior task outputs and verification commands.
- Produces: a complete v122 release audit, final release lock, and one final commit ready for the user to push.

- [ ] **Step 1: Write failing release-document assertions**

Extend `tests/release-guard.test.ts` to require:

```ts
const releaseText = readFileSync("docs/releases/2026-08-21-v122-constitutional-core-release.md", "utf8");
for (const marker of [
  "122.0.0",
  "ed65956a16dd5f0d76d04db2f4a651fc43eb0a71cef64afd53576aa782dc9896",
  "bd1d7ccf1543e2484df68e3025c7376f8ae37cafe1ca0d7c9cd9f52f6342b325",
  "Representation never outranks source",
  "Network calls during independent verification: `0`",
  "MCP authority: `false`",
  "Failed-decision writes: `0`",
  "Settlement and Reserve remain distinct",
]) assert.equal(releaseText.includes(marker), true, marker);
```

- [ ] **Step 2: Run the release test and observe the missing audit**

Run: `node --import tsx --test tests/release-guard.test.ts`

Expected: FAIL because the v122 release audit does not exist.

- [ ] **Step 3: Write the release documentation from measured evidence**

Document:

- exact package identities and integrities;
- registry, matrix, reducer, MCP, and AI-skill parity;
- all product and operator surfaces released;
- source-first authority and the prohibition on representation outranking source;
- exact private-edge, zero-write, replay, multi-world, and Phi-rail evidence;
- why independently verifiable portable proof matters across applications, devices, organizations, markets, governments, and institutions without making legal supremacy claims;
- the published package's stale prose/descriptor findings, classified as operative or non-operative from actual conformance evidence;
- every command run and its measured result.

- [ ] **Step 4: Complete the v122 release lock**

The release lock must check exact package integrities, 40-skill tree parity, 30-operation matrix parity, nine artifact tools, 37 inherited living-subject tools, all 19 v122 tools, authority scan, generated contract parity, migration attestation, independent verifier, conformance, zero-write failures, private-edge exclusion, lookup-before-retry, multi-world atomicity, Phi-rail separation, doctrine completeness, and release-document markers.

It must exit nonzero on any mismatch and report:

```json
{
  "schema": "receiz.app.v122.release-lock.v1",
  "ok": true,
  "releaseVersion": "122.0.0",
  "registryDigest": "ed65956a16dd5f0d76d04db2f4a651fc43eb0a71cef64afd53576aa782dc9896",
  "operationMatrixDigest": "bd1d7ccf1543e2484df68e3025c7376f8ae37cafe1ca0d7c9cd9f52f6342b325",
  "authority": {
    "strongerTruth": "sealed-receiz-proof-object",
    "mcpAuthority": false,
    "representationCanOutrankSource": false,
    "networkCallsDuringIndependentVerification": 0,
    "failedDecisionWrites": 0
  }
}
```

- [ ] **Step 5: Run focused gates, then the full release gate**

Run in order:

```bash
pnpm validate:ai-skills
pnpm receiz:authority-scan
pnpm receiz:check
pnpm receiz:conformance
pnpm receiz:migrate:verify
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm receiz:release-lock
pnpm release:check
```

Expected: every command exits `0`; independent verification reports zero network calls; conformance and negative paths report zero writes; the build emits no authority warnings.

- [ ] **Step 6: Inspect the final diff and commit**

Run:

```bash
git diff --check
git status --short
git diff --stat HEAD~8..HEAD
```

Verify no unrelated user files changed, no secrets are present, and no generated artifact/caches are staged.

```bash
git add README.md .env.example docs/SDK_RAILS.md docs/releases/2026-08-21-v122-constitutional-core-release.md scripts/receiz-v122-release-lock.mjs tests/release-guard.test.ts
git commit -m "release: document and lock Receiz v122 constitutional core"
```

- [ ] **Step 7: Report the exact handoff**

Report commit hashes, changed product surfaces, exact package/digest identities, verification counts, any non-operative upstream documentation skew, and the current branch. Do not push; the user explicitly said they will push.
