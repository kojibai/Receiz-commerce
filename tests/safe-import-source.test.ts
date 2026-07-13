import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isPublicIpAddress, validatedPublicImportUrl } from "../src/lib/import/safe-source.js";

describe("safe commerce import source", () => {
  it("rejects loopback, private, link-local, and unsupported URLs", async () => {
    for (const url of [
      "http://127.0.0.1/admin",
      "http://10.0.0.1/metadata",
      "http://169.254.169.254/latest/meta-data",
      "http://[::1]/",
      "file:///etc/passwd"
    ]) {
      await assert.rejects(() => validatedPublicImportUrl(url));
    }
  });

  it("classifies public and non-public IP literals", () => {
    assert.equal(isPublicIpAddress("8.8.8.8"), true);
    assert.equal(isPublicIpAddress("1.1.1.1"), true);
    assert.equal(isPublicIpAddress("192.168.1.1"), false);
    assert.equal(isPublicIpAddress("::1"), false);
  });
});
