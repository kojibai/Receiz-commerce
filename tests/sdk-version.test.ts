import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { RECEIZ_SDK_VERSION } from "@receiz/sdk";

describe("Receiz v2 dependency contract", () => {
  it("pins the supported SDK and patched production dependency graph", () => {
    const pkg = JSON.parse(readFileSync("package.json", "utf8")) as {
      dependencies: Record<string, string>;
      pnpm?: { overrides?: Record<string, string> };
    };

    assert.equal(RECEIZ_SDK_VERSION, "100.0.0");
    assert.equal(pkg.dependencies["@receiz/sdk"], "^100.0.0");
    assert.equal(pkg.pnpm?.overrides?.postcss, ">=8.5.10");
  });

  it("documents the supported MCP pair and authoritative theme publication", () => {
    const readme = readFileSync("README.md", "utf8");
    const rails = readFileSync("docs/SDK_RAILS.md", "utf8");

    assert.match(readme, /@receiz\/mcp-server@100\.0\.0/);
    assert.match(readme, /Publish theme/);
    assert.match(rails, /@receiz\/sdk@100\.0\.0/);
    assert.match(rails, /authoritative public-store revision/);
  });
});
