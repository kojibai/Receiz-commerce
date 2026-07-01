import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { receizOidcScopesFromEnv } from "../src/lib/receiz/oauth-scopes.js";

describe("Receiz OIDC scopes", () => {
  it("requests the full Receiz Commerce Cloud scopes by default", () => {
    const scopes = receizOidcScopesFromEnv({});

    assert.equal(scopes.includes("receiz:record"), true);
    assert.equal(scopes.includes("offline_access"), true);
    assert.equal(scopes.includes("receiz:wallet.read"), true);
    assert.equal(scopes.includes("receiz:payments.create"), true);
    assert.equal(scopes.includes("receiz:app_state.read"), true);
    assert.equal(scopes.includes("receiz:app_state.write"), true);
    assert.equal(scopes.includes("receiz:notes.read"), true);
    assert.equal(new Set(scopes).size, scopes.length);
    assert.equal(scopes.includes("receiz:twin.read"), true);
    assert.equal(scopes.includes("receiz:twin.write"), true);
    assert.equal(scopes.includes("receiz:world.read"), true);
    assert.equal(scopes.includes("receiz:world.write"), true);
  });

  it("can opt out of Twin and World scopes for older Receiz OIDC clients", () => {
    const scopes = receizOidcScopesFromEnv({
      RECEIZ_ENABLE_TWIN_SCOPES: "false",
      RECEIZ_ENABLE_WORLD_SCOPES: "false"
    });

    assert.equal(scopes.includes("receiz:record"), true);
    assert.equal(scopes.includes("receiz:twin.read"), false);
    assert.equal(scopes.includes("receiz:twin.write"), false);
    assert.equal(scopes.includes("receiz:world.read"), false);
    assert.equal(scopes.includes("receiz:world.write"), false);
  });
});
