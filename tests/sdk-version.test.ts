import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { RECEIZ_SDK_VERSION } from "@receiz/sdk";

describe("Receiz v2 dependency contract", () => {
  it("pins the supported v104 SDK, MCP, AI skills, and vendored publication bridge", () => {
    const pkg = JSON.parse(readFileSync("package.json", "utf8")) as {
      dependencies: Record<string, string>;
      scripts?: Record<string, string>;
      pnpm?: { overrides?: Record<string, string> };
    };

    assert.equal(RECEIZ_SDK_VERSION, "104.0.0");
    assert.equal(pkg.dependencies["@receiz/sdk"], "104.0.0");
    assert.equal(pkg.dependencies["@receiz/mcp-server"], "104.0.0");
    assert.equal(pkg.dependencies["@receiz/ai-skills"], "104.0.0");
    assert.equal(pkg.scripts?.["receiz:check"], "receiz app check --target 104.0.0 --json");
    assert.equal(pkg.scripts?.["validate:ai-skills"], "node --import tsx ai-skills/scripts/validate-skills.ts");
    assert.equal(pkg.pnpm?.overrides?.postcss, ">=8.5.10");
    assert.equal(pkg.pnpm?.overrides?.["@receiz/sdk"], "file:vendor/receiz-sdk-104.0.0.tgz");
    assert.equal(pkg.pnpm?.overrides?.["@receiz/mcp-server"], "file:vendor/receiz-mcp-server-104.0.0.tgz");
    assert.equal(pkg.pnpm?.overrides?.["@receiz/ai-skills"], "file:vendor/receiz-ai-skills-104.0.0.tgz");
  });

  it("documents the supported MCP pair and authoritative theme publication", () => {
    const readme = readFileSync("README.md", "utf8");
    const rails = readFileSync("docs/SDK_RAILS.md", "utf8");
    const skillsReadme = readFileSync("ai-skills/README.md", "utf8");
    const mcpToolMap = readFileSync("ai-skills/receiz-mcp-agent-skill/resources/mcp-tool-map.md", "utf8");
    const adapter = readFileSync("src/lib/receiz/adapter.ts", "utf8");

    assert.match(readme, /@receiz\/mcp-server@104\.0\.0/);
    assert.match(readme, /@receiz\/ai-skills@104\.0\.0/);
    assert.match(readme, /Publish theme/);
    assert.match(rails, /@receiz\/sdk@104\.0\.0/);
    assert.match(rails, /authoritative public-store revision/);
    assert.match(rails, /native Record projection before sealing/);
    assert.match(skillsReadme, /published as `@receiz\/ai-skills`/);
    assert.match(mcpToolMap, /receiz_inspect_offline_file/);
    assert.doesNotMatch(mcpToolMap, new RegExp(["receiz", "verify", "offline", "file"].join("_")));
    assert.match(adapter, /createProofObject/);
    assert.match(adapter, /ReceizProofObjectCreateInput/);
    assert.doesNotMatch(adapter, /ReceizPortableAsset/);
    assert.doesNotMatch(adapter, /sealArtifact/);
  });

  it("keeps the v104 Node-only compiler outside browser bundles", () => {
    const nextConfig = readFileSync("next.config.mjs", "utf8");

    assert.match(nextConfig, /NormalModuleReplacementPlugin\(\/\^node:\//);
    assert.match(nextConfig, /"fs\/promises": false/);
    assert.match(nextConfig, /crypto: false/);
  });
});
