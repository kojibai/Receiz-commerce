import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

describe("Receiz v105 capability discovery", () => {
  it("derives optional UI rails from the canonical SDK descriptor", () => {
    const source = readFileSync("src/lib/receiz/capabilities.ts", "utf8");

    assert.match(source, /describeReceizCapabilities/);
    assert.doesNotMatch(source, /createReceizClient|sdkNamespaceReady/);
  });
});
