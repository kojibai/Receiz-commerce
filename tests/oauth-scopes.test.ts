import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { receizOidcScopesFromEnv } from "../src/lib/receiz/oauth-scopes.js";

describe("Receiz OIDC scopes", () => {
  it("does not request Twin scopes by default", () => {
    const scopes = receizOidcScopesFromEnv({});

    assert.equal(scopes.includes("receiz:record"), true);
    assert.equal(scopes.includes("offline_access"), true);
    assert.equal(scopes.includes("receiz:wallet.read"), true);
    assert.equal(scopes.includes("receiz:payments.create"), true);
    assert.equal(scopes.includes("receiz:notes.read"), true);
    assert.equal(new Set(scopes).size, scopes.length);
    assert.equal(scopes.includes("receiz:twin.read"), false);
    assert.equal(scopes.includes("receiz:twin.write"), false);
  });

  it("can opt into Twin scopes when the Receiz OIDC client allows them", () => {
    const scopes = receizOidcScopesFromEnv({ RECEIZ_ENABLE_TWIN_SCOPES: "true" });

    assert.equal(scopes.includes("receiz:twin.read"), true);
    assert.equal(scopes.includes("receiz:twin.write"), true);
  });
});
