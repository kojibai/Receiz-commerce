import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../../", import.meta.url));
const skillRoot = fileURLToPath(new URL("../", import.meta.url));
const read = (path) => readFileSync(path.startsWith("ai-skills/") ? `${skillRoot}${path.slice("ai-skills/".length)}` : `${root}${path}`, "utf8");
const hasRepositorySources = existsSync(`${root}packages/receiz-sdk/src/index.ts`)
  && existsSync(`${root}packages/receiz-mcp-server/src/index.ts`);
const inventory = JSON.parse(read("ai-skills/skills.json"));
const failures = [];
const requireMatch = (text, expression, label) => assert.ok(expression.test(text), label);
const check = (label, test) => {
  try { test(); } catch (error) { failures.push(`${label}: ${error.message}`); }
};

check("current guidance matches coordinated distribution metadata", () => {
  const readme = read("ai-skills/README.md");
  assert.ok(readme.includes(`The \`${inventory.version}\` package at release coordinate \`v${inventory.version}\``), "AI package header is not the current source/package target");
  for (const coordinate of [inventory.registryDigest, inventory.operationMatrixDigest]) {
    assert.ok(readme.includes(coordinate), `AI current binding is missing ${coordinate}`);
  }
  const manifest = JSON.parse(read("ai-skills/receiz-proof-authority/manifest.json"));
  assert.ok(readme.includes(`SDK/MCP range \`${manifest.requires.sdk}\``), "AI README package compatibility range drift");
  const paths = ["ai-skills/README.md", ...(hasRepositorySources ? ["packages/receiz-sdk/README.md", "packages/receiz-mcp-server/README.md"] : [])];
  for (const path of paths) {
    const text = read(path);
    assert.ok(text.includes(`${inventory.sdkPublicFunctionInventory.functions.length} callable exports`), `${path}: public export count drift`);
    assert.ok(text.includes(`${inventory.sdkClientCapabilityInventory.length}-method client inventory`), `${path}: client method count drift`);
    assert.ok(text.includes(`${inventory.currentMcpTools.length} explicit tools`), `${path}: current MCP count drift`);
  }
  if (hasRepositorySources) {
    for (const [path, packageName] of [["packages/receiz-sdk/README.md", "@receiz/sdk"], ["packages/receiz-mcp-server/README.md", "@receiz/mcp-server"]]) {
      assert.ok(read(path).includes(`Current package: \`${packageName}@${inventory.version}\``), `${path}: current package header drift`);
    }
    assert.ok(read("packages/receiz-sdk/docs/offline-sealing.md").includes(`Install \`@receiz/sdk@${inventory.version}\``), "offline setup pin drift");
    for (const guide of ["offline-sealing", "local-subject-runtime", "historical-http"]) {
      const canonical = read(`packages/receiz-sdk/docs/${guide}.md`);
      for (const copy of [`ai-skills/resources/${guide}.md`, `ai-skills/receiz-mcp-agent-skill/resources/${guide}.md`]) {
        assert.equal(read(copy), canonical, `${copy}: current guide copy drift`);
      }
    }
  }
});

for (const skill of ["receiz-proof-authority", "receiz-mcp-agent-skill", "receiz-commerce-skill", "receiz-build-production-system"]) {
  check(`${skill} registered application binding`, () => {
    const text = read(`ai-skills/${skill}/SKILL.md`);
    requireMatch(text, /RECEIZ_APPLICATION_ID/, "missing configured application coordinate");
    requireMatch(text, /exact registered OIDC client ID/, "missing exact registered ID law");
    requireMatch(text, /client secret/i, "missing secret/identity distinction");
    requireMatch(text, /registered-native-session\.md/, "missing runnable prerequisite example");
  });
}

check("native-session example covers the real prerequisites", () => {
  const text = read("ai-skills/receiz-proof-authority/examples/registered-native-session.md");
  for (const term of ["rc_PtuBxB_Gbm9OkFeflZiwCz-d", "identity.signLoginProof", "identity.exchangeProofAuthority", "sources.publishSealedSourceV124", "runtime.openAuthoritySessionV124", "runtime.qualifyV124", "receiz:subjects.write", "receiz:domains.write", "receiz:domains.read", "authoritySessionHandle: null", "audience: applicationId", "source-publication", "verified-replay", "revoked", "nonce replay", "zero-write", "live integration"]) {
    assert.ok(text.includes(term), `missing ${term}`);
  }
  requireMatch(text, /fresh.*challenge/i, "missing fresh challenge boundary");
  requireMatch(text, /no.*(lowercas|normaliz)|never.*(lowercas|normaliz)/i, "missing exact-byte preservation");
  requireMatch(text, /client secrets.*server-side/i, "missing server-only secret custody");
});

check("proof-authority reference keeps actual auth helper signatures", () => {
  const text = read("ai-skills/receiz-proof-authority/references/sdk-map.md");
  for (const signature of ["client.auth.grantedScopes()", "client.auth.scopesForRails(...rails)", "client.auth.missingScopesForRails(...rails)", "client.auth.canUseRails(...rails)"]) {
    assert.ok(text.includes(signature), `missing ${signature}`);
  }
  for (const inventedSignature of ["grantedScopes(authority)", "scopesForRails(rails)", "missingScopesForRails(grantedScopes", "canUseRails(grantedScopes"]) {
    assert.ok(!text.includes(inventedSignature), `unsupported signature ${inventedSignature}`);
  }
});

check("purchase evidence remains distinct", () => {
  const text = read("ai-skills/receiz-commerce-skill/examples/create-no-db-store.md");
  for (const term of ["wallet credit", "shortfall", "quote", "payment", "bearer artifact", "claimBearerAsset", "seller proceeds", "concurrent", "reload", "live integration"]) {
    assert.ok(text.includes(term), `missing ${term}`);
  }
  requireMatch(text, /successful card checkout alone does not establish an asset purchase or ownership transfer/i, "checkout is not purchase/custody evidence");
  requireMatch(text, /duplicate.*(funding|payment|delivery)/i, "missing retry/concurrency boundary");
});

check("current SDK/MCP setup docs preserve registration and source authority", () => {
  if (!hasRepositorySources) return;
  for (const path of ["packages/receiz-sdk/README.md", "packages/receiz-sdk/docs/app-registration-token-lifecycle.md", "packages/receiz-sdk/docs/app-runtime-commerce-cloud.md", "packages/receiz-sdk/docs/copy-paste-integrations.md", "packages/receiz-mcp-server/README.md"]) {
    const text = read(path);
    requireMatch(text, /RECEIZ_APPLICATION_ID/, `${path}: missing configured coordinate`);
    requireMatch(text, /exact registered OIDC client ID/, `${path}: missing exact registration binding`);
    requireMatch(text, /registered-native-runtime\.md/, `${path}: missing current native prerequisite guide`);
  }
  const text = read("packages/receiz-sdk/docs/registered-native-runtime.md");
  for (const term of ["client.identity.exchangeProofAuthority", "client.sources.publishSealedSourceV124", "client.runtime.openAuthoritySessionV124", "client.runtime.qualifyV124", "client.domains.verifiedReplayV124", "live integration", "revoked", "nonce replay", "zero-write"]) {
    assert.ok(text.includes(term), `native runtime guide: missing ${term}`);
  }
  const commerce = read("packages/receiz-sdk/docs/app-runtime-commerce-cloud.md");
  requireMatch(commerce, /wallet_settlement_execution_required/, "current commerce doc must state zero wallet application");
  assert.ok(!commerce.includes("Settlement truth still belongs to the Connect/payment and wallet rails returned by the backend"), "backend cannot outrank settlement source");
});

check("full-library financial scope is distinct from the restricted ChatGPT plugin", () => {
  for (const path of ["ai-skills/receiz-mcp-agent-skill/SKILL.md", "ai-skills/receiz-commerce-skill/SKILL.md", "ai-skills/receiz-commerce-skill/examples/create-no-db-store.md"]) {
    const text = read(path);
    requireMatch(text, /full MCP library supports financial workflows/i, `${path}: missing full-library financial capability`);
    requireMatch(text, /ChatGPT Marketplace plugin.*nonfinancial|nonfinancial.*ChatGPT Marketplace plugin/i, `${path}: missing plugin-only restriction`);
    assert.ok(text.includes("receiz_commerce_one_click_checkout"), `${path}: missing real checkout adapter`);
    assert.ok(text.includes("receiz_v123_value_execute_settlement"), `${path}: missing real Settlement adapter`);
  }
});

check("current financial adapters preserve real arguments and sealed custody", () => {
  const text = read("ai-skills/receiz-mcp-agent-skill/resources/full-financial-tool-map.md");
  for (const term of ["receiz_connect_wallet", "receiz_connect_transfer", "receiz_connect_checkout", "receiz_connect_checkout_session", "receiz_payments_embedded_checkout", "receiz_connect_note_download", "receiz_bearer_artifact_claim", "artifactReference", "confirmationDigest", "single-use", "verifyAndOpen", "claimBearerAsset", "wallet_note_receiving_seal_required", "receiz:notes.read", "receiz:wallet.transfer", "live integration", "receiz/financialCredentials", "enclosing-note-bound"]) {
    assert.ok(text.includes(term), `missing ${term}`);
  }
  requireMatch(text, /private.*(bytes|artifact)|(?:bytes|artifact).*private/i, "missing private exact-byte custody");
  requireMatch(text, /legacy.*note.*token/i, "legacy token claims must remain distinct from canonical artifact claim");
  for (const unsupportedTool of ["receiz_connect_note_claim", "receiz_payments_embedded_note_claim"]) {
    assert.ok(!text.includes(unsupportedTool), `unsupported raw-token adapter ${unsupportedTool}`);
  }
  const toolMap = read("ai-skills/receiz-mcp-agent-skill/resources/mcp-tool-map.md");
  assert.ok(!toolMap.includes("exposes no direct profile-mutation or bearer-claim adapter"), "old blanket bearer adapter exclusion contradicts current source");
});

check("documented native MCP adapters are implemented", () => {
  const paths = ["ai-skills/receiz-proof-authority/examples/registered-native-session.md", "ai-skills/receiz-mcp-agent-skill/examples/agent-build-app.md", "ai-skills/receiz-commerce-skill/examples/create-no-db-store.md", "ai-skills/receiz-mcp-agent-skill/resources/full-financial-tool-map.md"];
  const currentTools = new Set(inventory.currentMcpTools);
  const source = hasRepositorySources ? ["packages/receiz-mcp-server/src/index.ts", "packages/receiz-mcp-server/src/v123Operations.ts", "packages/receiz-mcp-server/src/v124Operations.ts", "packages/receiz-mcp-server/src/v125Operations.ts", "packages/receiz-mcp-server/src/v127SdkOperations.ts", "packages/receiz-mcp-server/src/financialArtifactOperations.ts"].map(read).join("\n") : null;
  for (const path of paths) {
    const text = read(path);
    for (const match of text.matchAll(/`(receiz_[a-z0-9_]+)`/g)) {
      assert.ok(currentTools.has(match[1]), `${path}: tool ${match[1]} excluded from current inventory`);
      if (source) assert.ok(source.includes(`"${match[1]}"`), `${path}: unsupported tool ${match[1]}`);
    }
  }
});

check("SDK method references resolve to the canonical client", () => {
  const text = read("ai-skills/receiz-proof-authority/examples/registered-native-session.md");
  const currentMethods = new Set(inventory.sdkClientCapabilityInventory);
  const source = hasRepositorySources ? read("packages/receiz-sdk/src/index.ts") : null;
  for (const match of text.matchAll(/(?:client|unsignedClient)\.(identity|sources|runtime|domains|auth)\.([A-Za-z0-9]+)/g)) {
    assert.ok(currentMethods.has(`${match[1]}.${match[2]}`), `method excluded from current inventory: ${match[1]}.${match[2]}`);
    if (!source) continue;
    const railStart = source.indexOf(`readonly ${match[1]} = {`);
    assert.ok(railStart >= 0, `missing rail ${match[1]}`);
    const railEnd = source.indexOf("\n  };", railStart);
    assert.ok(source.slice(railStart, railEnd).includes(`${match[2]}:`), `unsupported method ${match[1]}.${match[2]}`);
  }
});

if (failures.length) {
  console.error(failures.join("\n"));
  process.exitCode = 1;
} else {
  console.log(`Registered application guidance: exact ID, native prerequisites, current adapters, full financial scope, and staged purchase evidence passed.${hasRepositorySources ? " SDK/MCP source and current guide audit passed." : " SDK/MCP source and guide audit requires the repository checkout."}`);
}
