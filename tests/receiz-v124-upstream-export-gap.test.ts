import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { createRequire } from "node:module";
import { describe, it } from "node:test";

const require = createRequire(import.meta.url);
const packageJsonPath = require.resolve("@receiz/sdk/package.json");
const packageRoot = dirname(packageJsonPath);
const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));
const rootTypes = readFileSync(join(packageRoot, "dist/index.d.ts"), "utf8");
const canonicalTypes = readFileSync(join(packageRoot, "dist/verifier/canonical.d.ts"), "utf8");
const verificationLimits = readFileSync(join(packageRoot, "dist/verificationLimits.js"), "utf8");

describe("Receiz v124.0.3 upstream streaming-verifier export gap", () => {
  it("records the confirmed package boundary as a private next-release requirement", () => {
    assert.equal(packageJson.version, "124.0.3");
    assert.match(canonicalTypes, /verifyReceizTrailerFileStreaming/);
    assert.match(canonicalTypes, /validateReceizExactByteVerification/);
    assert.doesNotMatch(rootTypes, /verifyReceizTrailerFileStreaming/);
    assert.doesNotMatch(rootTypes, /validateReceizExactByteVerification/);
    assert.equal(packageJson.exports["./verifier"], undefined);
    assert.match(verificationLimits, /exactArtifactBytes:\s*16 \* MEBIBYTE/);

    const tracker = JSON.parse(readFileSync("receiz.upstream-gaps.json", "utf8"));
    const gap = tracker.gaps.find((entry: { id: string }) => entry.id === "sdk.streaming-verifier-public-export");
    assert.equal(gap.observedPackage, "@receiz/sdk@124.0.3");
    assert.equal(gap.nextReleaseRequired, true);
    assert.equal(gap.publicDocumentation, false);
  });

  it("cannot import the undeclared verifier subpath as an outside consumer", async () => {
    const consumerImport = new Function("specifier", "return import(specifier)") as (specifier: string) => Promise<unknown>;
    await assert.rejects(consumerImport("@receiz/sdk/verifier"), (error: NodeJS.ErrnoException) => error.code === "ERR_PACKAGE_PATH_NOT_EXPORTED");
  });
});
