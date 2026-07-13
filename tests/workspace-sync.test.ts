import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { hostContextFromHost } from "../src/lib/hosting/host-context.js";
import { externalWorkspaceState } from "../src/lib/storage/workspace-sync.js";
import { baseState } from "./support/commerce-state.js";

describe("workspace cross-tab sync", () => {
  it("adopts a platform workspace written under the active storage key", () => {
    const context = hostContextFromHost("receiz.app");
    const fallback = baseState();
    const next = {
      ...fallback,
      brand: { ...fallback.brand, secondaryColor: "#3155ff" }
    };

    const result = externalWorkspaceState(
      { key: context.storageKey, newValue: JSON.stringify(next) },
      context,
      fallback
    );

    assert.equal(result?.brand.secondaryColor, "#3155ff");
  });

  it("ignores tenant session storage, unrelated keys, deletions, and malformed writes", () => {
    const platform = hostContextFromHost("receiz.app");
    const tenant = hostContextFromHost("shop.receiz.app");
    const fallback = baseState();

    assert.equal(
      externalWorkspaceState({ key: tenant.storageKey, newValue: JSON.stringify(fallback) }, tenant, fallback),
      null
    );
    assert.equal(externalWorkspaceState({ key: "wrong", newValue: JSON.stringify(fallback) }, platform, fallback), null);
    assert.equal(externalWorkspaceState({ key: platform.storageKey, newValue: null }, platform, fallback), null);
    assert.equal(externalWorkspaceState({ key: platform.storageKey, newValue: "{" }, platform, fallback), null);
  });
});
