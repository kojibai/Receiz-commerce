import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { RECEIZ_SDK_VERSION } from "@receiz/sdk";

describe("Receiz v2 dependency contract", () => {
  it("pins the supported v102 SDK, MCP, AI skills, and patched production dependency graph", () => {
    const pkg = JSON.parse(readFileSync("package.json", "utf8")) as {
      dependencies: Record<string, string>;
      scripts?: Record<string, string>;
      pnpm?: { overrides?: Record<string, string> };
    };

    assert.equal(RECEIZ_SDK_VERSION, "102.0.0");
    assert.equal(pkg.dependencies["@receiz/sdk"], "^102.0.0");
    assert.equal(pkg.dependencies["@receiz/mcp-server"], "^102.0.0");
    assert.equal(pkg.dependencies["@receiz/ai-skills"], "^102.0.0");
    assert.equal(pkg.scripts?.["validate:ai-skills"], "node --import tsx ai-skills/scripts/validate-skills.ts");
    assert.equal(pkg.pnpm?.overrides?.postcss, ">=8.5.10");
  });

  it("documents the supported MCP pair and authoritative theme publication", () => {
    const readme = readFileSync("README.md", "utf8");
    const rails = readFileSync("docs/SDK_RAILS.md", "utf8");
    const skillsReadme = readFileSync("ai-skills/README.md", "utf8");
    const mcpToolMap = readFileSync("ai-skills/receiz-mcp-agent-skill/resources/mcp-tool-map.md", "utf8");
    const adapter = readFileSync("src/lib/receiz/adapter.ts", "utf8");

    assert.match(readme, /@receiz\/mcp-server@102\.0\.0/);
    assert.match(readme, /@receiz\/ai-skills@102\.0\.0/);
    assert.match(readme, /Publish theme/);
    assert.match(rails, /@receiz\/sdk@102\.0\.0/);
    assert.match(rails, /authoritative public-store revision/);
    assert.match(skillsReadme, /published as `@receiz\/ai-skills`/);
    assert.match(mcpToolMap, /receiz_inspect_offline_file/);
    assert.doesNotMatch(mcpToolMap, /receiz_verify_offline_file/);
    assert.match(adapter, /createProofObject/);
    assert.doesNotMatch(adapter, /sealArtifact/);
  });
});
