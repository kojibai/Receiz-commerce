import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildReceizConnectEntryUrl } from "../src/lib/receiz/connect-url.js";

describe("Receiz Connect entry URL", () => {
  it("wraps OIDC authorize URLs in an absolute Receiz sign-in URL", () => {
    const authorizeUrl = "https://receiz.com/api/oidc/authorize?response_type=code&client_id=rc_test&redirect_uri=https%3A%2F%2Freceiz.app%2Fapi%2Fauth%2Freceiz%2Fcallback";

    const entryUrl = new URL(buildReceizConnectEntryUrl(authorizeUrl));

    assert.equal(entryUrl.origin, "https://receiz.com");
    assert.equal(entryUrl.pathname, "/signin");
    assert.equal(entryUrl.searchParams.get("lane"), "connect");
    assert.equal(entryUrl.searchParams.get("next"), authorizeUrl);
  });

  it("rejects relative authorize URLs before they reach Next redirects", () => {
    assert.throws(() => buildReceizConnectEntryUrl("/api/oidc/authorize"), /absolute Receiz authorize URL/);
  });
});
