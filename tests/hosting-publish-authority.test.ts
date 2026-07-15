import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, it } from "node:test";

describe("hosting publish authority route", () => {
  it("preserves signed Identity Seal publishing without weakening other hosting actions", async () => {
    const route = await readFile(resolve(process.cwd(), "app/api/hosting/route.ts"), "utf8");

    assert.match(route, /merchantSignedPublishProofFromState/);
    assert.match(route, /action !== "publish" && \(!payerAccessToken \|\| requestSession\.sessionScope !== hostContext\.storageKey\)/);
    assert.match(route, /proof:\s*\{\s*keyFile: merchantAuthority\.localIdentity\?\.keyFile,\s*passphrase: merchantAuthority\.localIdentity\?\.passphrase/);
  });
});
