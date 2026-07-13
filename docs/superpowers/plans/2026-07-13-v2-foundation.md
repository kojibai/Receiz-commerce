# Receiz Commerce OS v2 Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the Receiz SDK/MCP contract to 99.0.0, clear the production dependency advisory, and make merchant theme publication durable and globally recoverable across tabs, routes, subdomains, and custom domains.

**Architecture:** Keep `@receiz/sdk` behind the existing adapter. Extract the existing full-store publication transaction from the React action object into one reusable callback, then call that transaction from both `Publish changes` and `Publish theme`. Platform browser storage remains an offline projection; a successful theme publication returns and adopts the authoritative published Receiz state, while storage events rehydrate other platform tabs.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, Node test runner, `@receiz/sdk@99.0.0`, `@receiz/mcp-server@99.0.0` documentation contract, Receiz public-store proof rails.

## Global Constraints

- Hosted audience: independent operators through organizations of roughly 100 staff.
- Browser state is a projection; published Receiz state is authority.
- A value labeled live must have a source, timestamp, freshness state, and recovery path.
- AI operates; proof authorizes.
- The adapter remains the only application import boundary for `@receiz/sdk`.
- Theme publication must match across reload, tabs, routes, subdomain, and custom domain.
- No simulated behavior may be relabeled as production behavior.
- Do not bump the application package to `2.0.0` until all v2 release gates pass.

---

## File structure

- `package.json`: SDK version and PostCSS security override.
- `pnpm-lock.yaml`: resolved 99.0.0 SDK and patched PostCSS graph.
- `tests/sdk-version.test.ts`: supported SDK/MCP version contract.
- `src/lib/storage/workspace-sync.ts`: pure cross-tab adoption policy and storage event parser.
- `tests/workspace-sync.test.ts`: cross-tab and malformed-event behavior.
- `src/lib/storage/use-template-store.ts`: reusable publish transaction, authoritative theme publish, storage-event rehydration.
- `src/features/admin/BrandPanel.tsx`: truthful `Publish theme` copy and pending/success states.
- `tests/theme-publication.test.ts`: publication semantics and UI contract regression.
- `README.md`, `RELEASE_NOTES.md`, `docs/SDK_RAILS.md`, `docs/DEVELOPER_KERNEL.md`, `ai-skills/**`: pinned SDK/MCP documentation.

### Task 1: Upgrade and pin the SDK compatibility pair

**Files:**
- Modify: `package.json`
- Modify: `pnpm-lock.yaml`
- Create: `tests/sdk-version.test.ts`

**Interfaces:**
- Consumes: `RECEIZ_SDK_VERSION` exported by `@receiz/sdk`.
- Produces: a repository contract that the installed SDK is `99.0.0` and docs use MCP `99.0.0`.

- [ ] **Step 1: Write the failing version test**

```ts
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { RECEIZ_SDK_VERSION } from "@receiz/sdk";

describe("Receiz v2 dependency contract", () => {
  it("pins the supported SDK and MCP pair to 99.0.0", () => {
    const pkg = JSON.parse(readFileSync("package.json", "utf8")) as {
      dependencies: Record<string, string>;
      pnpm?: { overrides?: Record<string, string> };
    };
    const readme = readFileSync("README.md", "utf8");

    assert.equal(RECEIZ_SDK_VERSION, "99.0.0");
    assert.equal(pkg.dependencies["@receiz/sdk"], "^99.0.0");
    assert.equal(pkg.pnpm?.overrides?.postcss, ">=8.5.10");
    assert.match(readme, /@receiz\/mcp-server@99\.0\.0/);
  });
});
```

- [ ] **Step 2: Run the test and verify the 98.0.0 failure**

Run: `pnpm test`

Expected: FAIL because `RECEIZ_SDK_VERSION` and `package.json` still resolve 98.0.0.

- [ ] **Step 3: Upgrade the SDK and patch PostCSS**

Run: `pnpm add @receiz/sdk@^99.0.0`

Add to `package.json`:

```json
"pnpm": {
  "overrides": {
    "postcss": ">=8.5.10"
  }
}
```

Run: `pnpm install`

- [ ] **Step 4: Run compatibility verification**

Run: `pnpm test && pnpm typecheck && pnpm receiz:doctor && pnpm audit --prod`

Expected: all commands exit 0; doctor reports SDK 99.0.0; audit reports no production advisories.

- [ ] **Step 5: Commit the dependency upgrade**

```bash
git add package.json pnpm-lock.yaml tests/sdk-version.test.ts
git commit -m "build: upgrade Receiz SDK to 99"
```

### Task 2: Add pure cross-tab workspace synchronization

**Files:**
- Create: `src/lib/storage/workspace-sync.ts`
- Create: `tests/workspace-sync.test.ts`

**Interfaces:**
- Consumes: `HostContext`, `CommerceState`, browser `StorageEvent` fields.
- Produces: `externalWorkspaceState(event, hostContext, fallback): CommerceState | null`.

- [ ] **Step 1: Write failing synchronization tests**

```ts
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { hostContextFromHost } from "../src/lib/hosting/host-context.js";
import { externalWorkspaceState } from "../src/lib/storage/workspace-sync.js";
import { baseState } from "./support/commerce-state.js";

describe("workspace cross-tab sync", () => {
  it("adopts a newer platform workspace written under the active key", () => {
    const context = hostContextFromHost("receiz.app");
    const next = { ...baseState(), brand: { ...baseState().brand, secondaryColor: "#3155ff" } };
    const result = externalWorkspaceState(
      { key: context.storageKey, newValue: JSON.stringify(next) },
      context,
      baseState()
    );
    assert.equal(result?.brand.secondaryColor, "#3155ff");
  });

  it("ignores tenant session storage and malformed writes", () => {
    const tenant = hostContextFromHost("shop.receiz.app");
    assert.equal(externalWorkspaceState({ key: tenant.storageKey, newValue: "{}" }, tenant, baseState()), null);
    assert.equal(externalWorkspaceState({ key: "wrong", newValue: "{" }, hostContextFromHost("receiz.app"), baseState()), null);
  });
});
```

- [ ] **Step 2: Run the test and verify the missing-module failure**

Run: `pnpm test`

Expected: FAIL because `workspace-sync.ts` does not exist.

- [ ] **Step 3: Implement the pure synchronization policy**

```ts
import type { HostContext } from "../hosting/host-context";
import type { CommerceState } from "../../types/domain";
import { selectClientInitialState } from "./client-state";

export type WorkspaceStorageEvent = { key: string | null; newValue: string | null };

export function externalWorkspaceState(
  event: WorkspaceStorageEvent,
  hostContext: HostContext,
  fallback: CommerceState
) {
  if (hostContext.surface !== "platform" || event.key !== hostContext.storageKey || !event.newValue) return null;
  try {
    return selectClientInitialState(hostContext, fallback, { scoped: event.newValue, base: null });
  } catch {
    return null;
  }
}
```

- [ ] **Step 4: Verify synchronization tests**

Run: `pnpm test`

Expected: PASS with both new cases green.

- [ ] **Step 5: Commit the synchronization primitive**

```bash
git add src/lib/storage/workspace-sync.ts tests/workspace-sync.test.ts
git commit -m "feat: synchronize merchant workspace tabs"
```

### Task 3: Extract one authoritative publish transaction

**Files:**
- Modify: `src/lib/storage/use-template-store.ts`
- Create: `tests/theme-publication.test.ts`

**Interfaces:**
- Consumes: current `CommerceState`, proof authority, `prepareHostingStoreStateRequestBody`, `/api/hosting` publish response.
- Produces: `publishWorkspace(options): Promise<boolean>` where options carries feedback id and user-facing messages.

- [ ] **Step 1: Write the failing source contract test**

```ts
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

describe("theme publication contract", () => {
  it("uses the same durable publication transaction for store and theme", () => {
    const source = readFileSync("src/lib/storage/use-template-store.ts", "utf8");
    assert.match(source, /const publishWorkspace = useCallback/);
    assert.match(source, /publishWorkspace\(\{[\s\S]*feedbackId: "publish"/);
    assert.match(source, /publishWorkspace\(\{[\s\S]*feedbackId: "brand\.saveTheme"/);
    assert.doesNotMatch(source, /saveTheme\(\)\s*\{\s*setActionFeedback\("brand\.saveTheme", "success"/);
  });
});
```

- [ ] **Step 2: Run the test and verify it fails on local-only save**

Run: `pnpm test`

Expected: FAIL because no shared `publishWorkspace` callback exists and `saveTheme` immediately reports success.

- [ ] **Step 3: Extract the existing publication body into a callback**

Add before the `actions` memo:

```ts
type PublishWorkspaceOptions = {
  feedbackId: "publish" | "brand.saveTheme";
  pendingMessage: string;
  successMessage: string;
  eventDetail: string;
};

const publishWorkspace = useCallback(async (options: PublishWorkspaceOptions) => {
  if (!(await ensureMerchantProofAuthority("publish"))) {
    setActionFeedback(options.feedbackId, "error", "Create or restore a verified Receiz proof object in app");
    return false;
  }

  setActionFeedback(options.feedbackId, "pending", options.pendingMessage);
  const publishHostContext = currentHostContext();
  const publishRequestState = stateWithCurrentMerchantReceizAccount({
    ...stateRef.current,
    hosting: { ...stateRef.current.hosting, published: true, lastPublishedAt: "now" }
  });

  markPendingPublish(publishHostContext.storageKey);
  setState((current) => ({
    ...current,
    proofEvents: [makeEvent("SITE_PUBLISHED", options.eventDetail), ...current.proofEvents]
  }));

  try {
    const result = await postJson<{
      hosting: CommerceState["hosting"];
      state?: Partial<CommerceState>;
      storeStateSync?: StoreStateSyncResponse;
    }>(
      "/api/hosting",
      await prepareHostingStoreStateRequestBody("publish", publishRequestState, merchantProof(publishRequestState)),
      { deferAuthorityRedirect: true, maxBodyChars: HOSTING_PUBLISH_REQUEST_BODY_MAX_CHARS }
    );

    const syncError = storeStateSyncError(result.storeStateSync);
    const syncPending = storeStateSyncPending(result.storeStateSync);
    clearPendingPublish(publishHostContext.storageKey);

    if (syncError || syncPending) {
      const message = syncError || result.storeStateSync?.warning || "Receiz public-store sync is pending; publish is not durable yet.";
      setActionFeedback(options.feedbackId, "error", message);
      setState((latest) => ({
        ...latest,
        proofEvents: [makeEvent("SITE_PUBLISHED", message), ...latest.proofEvents]
      }));
      return false;
    }

    setActionFeedback(options.feedbackId, "success", options.successMessage);
    setState((latest) => ({
      ...mergePublishedPublicState(latest, result.state, result.hosting),
      proofEvents: [makeEvent("SITE_PUBLISHED", options.eventDetail), ...latest.proofEvents]
    }));
    return true;
  } catch (error) {
    clearPendingPublish(publishHostContext.storageKey);
    const message = error instanceof ReceizAuthorityRequiredError
      ? "Receiz proof object required to publish"
      : error instanceof Error
        ? error.message
        : "Publish sync failed";
    setActionFeedback(options.feedbackId, "error", message);
    setState((latest) => ({
      ...latest,
      proofEvents: [makeEvent("SITE_PUBLISHED", message), ...latest.proofEvents]
    }));
    return false;
  }
}, [ensureMerchantProofAuthority, merchantProof, setActionFeedback]);
```

Replace the two action bodies with:

```ts
saveTheme() {
  return publishWorkspace({
    feedbackId: "brand.saveTheme",
    pendingMessage: "Publishing theme",
    successMessage: "Theme published everywhere",
    eventDetail: "Theme published to Receiz proof rails"
  });
},
publish() {
  return publishWorkspace({
    feedbackId: "publish",
    pendingMessage: "Publishing store",
    successMessage: "Store published",
    eventDetail: "Store published to Receiz proof rails"
  });
},
```

Add `publishWorkspace` to the action memo dependencies.

- [ ] **Step 4: Verify durable publication semantics**

Run: `pnpm test && pnpm typecheck && pnpm lint`

Expected: all commands pass; no local-only success branch remains.

- [ ] **Step 5: Commit the shared publication transaction**

```bash
git add src/lib/storage/use-template-store.ts tests/theme-publication.test.ts
git commit -m "fix: publish theme through durable Receiz state"
```

### Task 4: Wire truthful theme UI and cross-tab adoption

**Files:**
- Modify: `src/features/admin/BrandPanel.tsx`
- Modify: `src/lib/storage/use-template-store.ts`
- Modify: `tests/theme-publication.test.ts`

**Interfaces:**
- Consumes: `externalWorkspaceState`, `ActionFeedbackState`.
- Produces: truthful pending/success theme control and platform-tab rehydration.

- [ ] **Step 1: Extend the failing UI contract test**

```ts
it("labels theme publication truthfully", () => {
  const panel = readFileSync("src/features/admin/BrandPanel.tsx", "utf8");
  assert.match(panel, /Publishing theme/);
  assert.match(panel, /Theme published/);
  assert.match(panel, />Publish theme</);
});
```

- [ ] **Step 2: Run the test and verify the old Save theme copy fails**

Run: `pnpm test`

Expected: FAIL because the button still says `Save theme` and `Saved`.

- [ ] **Step 3: Add platform storage-event adoption**

Import `externalWorkspaceState` and add this effect after hydration:

```ts
useEffect(() => {
  if (!hydrated || hostContext.surface !== "platform") return;
  const onStorage = (event: StorageEvent) => {
    setState((current) => externalWorkspaceState(event, hostContext, current) ?? current);
  };
  window.addEventListener("storage", onStorage);
  return () => window.removeEventListener("storage", onStorage);
}, [hostContext, hydrated]);
```

- [ ] **Step 4: Update theme action copy**

```tsx
{saveFeedback?.status === "pending"
  ? "Publishing theme"
  : saveFeedback?.status === "success"
    ? "Theme published"
    : "Publish theme"}
```

- [ ] **Step 5: Verify behavior and commit**

Run: `pnpm test && pnpm typecheck && pnpm lint`

Expected: all commands pass.

```bash
git add src/features/admin/BrandPanel.tsx src/lib/storage/use-template-store.ts tests/theme-publication.test.ts
git commit -m "feat: sync published themes across workspaces"
```

### Task 5: Update SDK/MCP documentation and release evidence

**Files:**
- Modify: `README.md`
- Modify: `RELEASE_NOTES.md`
- Modify: `docs/SDK_RAILS.md`
- Modify: `docs/DEVELOPER_KERNEL.md`
- Modify: matching version references under `ai-skills/`

**Interfaces:**
- Consumes: SDK/MCP compatibility pair and theme publication behavior.
- Produces: consistent 99.0.0 setup and truthful persistence guidance.

- [ ] **Step 1: Replace all product SDK/MCP 98.0.0 references**

Run: `rg -l '98\.0\.0' README.md RELEASE_NOTES.md docs ai-skills`

Change supported configuration examples to:

```toml
args = ["-y", "@receiz/mcp-server@99.0.0"]
```

Document that `Publish theme` writes the authoritative public-store revision while local edits remain previews until publication succeeds.

- [ ] **Step 2: Verify no stale supported-version references remain**

Run: `rg -n '98\.0\.0|@receiz/mcp-server@98' README.md RELEASE_NOTES.md docs ai-skills`

Expected: no stale current-version guidance; historical changelog entries may remain only when clearly labeled historical.

- [ ] **Step 3: Run the complete foundation gate**

Run: `pnpm secret:scan && pnpm test && pnpm typecheck && pnpm lint && pnpm build && pnpm receiz:doctor && pnpm audit --prod`

Expected: every command exits 0; 0 test failures; doctor uses 99.0.0; audit has 0 production advisories.

- [ ] **Step 4: Browser verification**

Run the app and verify in the in-app browser:

1. Change all five brand colors.
2. Confirm admin and preview update immediately.
3. Press `Publish theme` and observe pending then success.
4. Reload `/admin`; confirm the values remain.
5. Open `/` in a second tab; confirm the published palette matches.
6. Verify the tenant subdomain and custom-domain projection responses contain the same `BrandConfig`.
7. Capture desktop and 390x844 mobile screenshots; verify no overflow, stale labels, or inaccessible status-only color.

- [ ] **Step 5: Commit documentation and evidence**

```bash
git add README.md RELEASE_NOTES.md docs/SDK_RAILS.md docs/DEVELOPER_KERNEL.md ai-skills
git commit -m "docs: publish SDK 99 foundation guidance"
```

## Plan self-review

- Spec coverage: this plan intentionally covers delivery slice 1 only. Merchant-core, real Exchange, AI operations, and A+ release programs require separate implementation plans after the foundation is green.
- Placeholder scan: every code-producing step includes the exact interface and required behavior; the publish extraction explicitly preserves the already-implemented transaction order rather than inventing a second transaction.
- Type consistency: `publishWorkspace`, `PublishWorkspaceOptions`, and `externalWorkspaceState` use the same names in all consuming tasks.
