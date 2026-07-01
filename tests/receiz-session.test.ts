import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { receizAccessTokenFromRequest, receizRequestSession } from "../src/lib/receiz/session.js";

function requestWithCookies(cookies: Record<string, string> = {}) {
  return {
    cookies: {
      get(name: string) {
        const value = cookies[name];
        return value ? { value } : undefined;
      }
    }
  } as never;
}

const previousReceizAccessToken = process.env.RECEIZ_ACCESS_TOKEN;
const previousReceizConnectAccessToken = process.env.RECEIZ_CONNECT_ACCESS_TOKEN;

function restoreEnv(name: "RECEIZ_ACCESS_TOKEN" | "RECEIZ_CONNECT_ACCESS_TOKEN", value: string | undefined) {
  if (value === undefined) {
    delete process.env[name];
  } else {
    process.env[name] = value;
  }
}

afterEach(() => {
  restoreEnv("RECEIZ_ACCESS_TOKEN", previousReceizAccessToken);
  restoreEnv("RECEIZ_CONNECT_ACCESS_TOKEN", previousReceizConnectAccessToken);
});

describe("Receiz request session", () => {
  it("uses the delegated server token when no browser cookie exists", () => {
    delete process.env.RECEIZ_ACCESS_TOKEN;
    process.env.RECEIZ_CONNECT_ACCESS_TOKEN = "delegated-token";

    const session = receizRequestSession(requestWithCookies());

    assert.equal(session.accessToken, "delegated-token");
    assert.equal(session.source, "delegated");
    assert.equal(receizAccessTokenFromRequest(requestWithCookies()), "delegated-token");
  });

  it("keeps the browser cookie token ahead of delegated fallback tokens", () => {
    process.env.RECEIZ_CONNECT_ACCESS_TOKEN = "delegated-token";

    const session = receizRequestSession(requestWithCookies({
      receiz_access_token: "cookie-token",
      receiz_session_scope: "receiz-app-commerce-state-v1:platform"
    }));

    assert.equal(session.accessToken, "cookie-token");
    assert.equal(session.cookieAccessToken, "cookie-token");
    assert.equal(session.delegatedAccessToken, "delegated-token");
    assert.equal(session.sessionScope, "receiz-app-commerce-state-v1:platform");
    assert.equal(session.source, "cookie");
  });
});
