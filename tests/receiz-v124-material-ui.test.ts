import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

describe("Receiz v124.0.3 material proof presentation", () => {
  it("verifies URL-carried material before creating a playable browser projection", () => {
    const source = readFileSync("src/features/verify/MaterialProofViewer.tsx", "utf8");
    assert.match(source, /openVerifiedUrl\(window\.location\.href\)/);
    assert.match(source, /createPlayableObjectUrl\(verified\)/);
    assert.match(source, /playable\.revoke\(\)/);
    assert.match(source, /canonicalReceizUrl/);
    assert.match(source, /<iframe[^>]+sandbox=""/);
    assert.match(source, /Representation never outranks source/);
    assert.doesNotMatch(source, /receizKaiNow/);
  });

  it("mounts the material viewer on the existing local verification surface", () => {
    const source = readFileSync("src/features/verify/ProofVerifier.tsx", "utf8");
    assert.match(source, /<MaterialProofViewer\s*\/>/);
  });
});
