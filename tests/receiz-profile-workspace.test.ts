import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  receizProfileMatchesWorkspace,
  receizProfileOwnerKey
} from "../src/lib/storage/receiz-profile-workspace.js";
import { baseState } from "./support/commerce-state.js";

describe("Receiz profile workspace ownership", () => {
  it("uses the Receiz handle as the stable workspace owner key when available", () => {
    assert.equal(
      receizProfileOwnerKey({
        id: "receiz-user-row-123",
        email: "bj@example.com",
        handle: "bjklock.receiz.id"
      }),
      "bjklock.receiz.id"
    );
  });

  it("does not reset a merchant workspace when the profile id changes but the proof handle matches", () => {
    const state = {
      ...baseState(),
      brand: { ...baseState().brand, name: "Limited Drop With" },
      hosting: {
        ...baseState().hosting,
        tenantSlug: "bjklock",
        subdomain: "bjklock.receiz.app",
        merchantReceizId: "bjklock.receiz.id"
      },
      auth: {
        ...baseState().auth,
        workspaceOwnerId: "old-profile-row-id",
        receizId: {
          ...baseState().auth.receizId,
          connected: true,
          handle: "bjklock.receiz.id",
          displayName: "BJ Klock"
        }
      }
    };

    assert.equal(
      receizProfileMatchesWorkspace(state, {
        id: "new-profile-row-id",
        email: "bj@example.com",
        handle: "bjklock.receiz.id"
      }),
      true
    );
  });

  it("requires a fresh merchant workspace for the untouched demo owner", () => {
    assert.equal(
      receizProfileMatchesWorkspace(baseState(), {
        id: "bj-profile",
        handle: "bjklock.receiz.id"
      }),
      false
    );
  });

  it("does not let an opaque delegated profile reset a locally verified merchant workspace", () => {
    const state = {
      ...baseState(),
      hosting: {
        ...baseState().hosting,
        tenantSlug: "bjklock",
        subdomain: "bjklock.receiz.app",
        merchantReceizId: "bjklock.receiz.id"
      },
      auth: {
        ...baseState().auth,
        workspaceOwnerId: "bjklock.receiz.id",
        receizId: {
          ...baseState().auth.receizId,
          connected: true,
          handle: "bjklock.receiz.id",
          displayName: "BJ Klock",
          localProofVerified: true
        }
      }
    };

    assert.equal(
      receizProfileMatchesWorkspace(state, {
        id: "receiz-session-row-without-handle"
      }),
      true
    );
  });
});
