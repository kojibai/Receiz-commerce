import {
  RECEIZ_V107_REGISTRY_DIGEST,
  createReceizCausalRecord,
  digestReceizConstitution,
  evaluateReceizLawSet,
  validateReceizConstitutionRegistry,
  type ReceizConstitutionRegistry,
} from "@receiz/sdk";
import { createReceizConstitutionalContext, scanReceizAuthorityBypass } from "@receiz/mcp-server";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { describe, it } from "node:test";
import {
  RECEIZ_APP_CONSTITUTION,
  createReceizAppCausalHistory,
  evaluateReceizAppLaws,
  verifyReceizAppConstitution,
} from "../src/lib/receiz/constitution";

const registry = JSON.parse(readFileSync("receiz.constitution.json", "utf8")) as ReceizConstitutionRegistry;

describe("Receiz v107 constitutional alignment", () => {
  it("pins the exact validated registry digest used by SDK, MCP, and the app", async () => {
    assert.equal(validateReceizConstitutionRegistry(registry).ok, true);
    assert.equal(await digestReceizConstitution(registry), RECEIZ_V107_REGISTRY_DIGEST);
    const context = createReceizConstitutionalContext({
      registryDigest: RECEIZ_V107_REGISTRY_DIGEST,
      applicableLaws: registry.laws.map((law) => law.id),
      authorityBoundary: { profile: "global-shared", tenantRequired: true },
      stateMachine: { initial: "claimed", states: ["claimed", "admitted", "denied"], transitions: [{ command: "wilds.arena.sync", from: "claimed", to: "admitted" }] },
      allowedCommands: ["wilds.arena.sync"],
    });
    assert.equal(context.registryDigest, RECEIZ_V107_REGISTRY_DIGEST);
    assert.deepEqual(context.forbiddenMutations, ["direct-state-write", "history-rewrite", "authority-bypass"]);
    assert.deepEqual(await verifyReceizAppConstitution(), {
      ok: true,
      registryDigest: RECEIZ_V107_REGISTRY_DIGEST,
      rulesetVersion: "107.0.0",
    });
    assert.equal(RECEIZ_APP_CONSTITUTION.version, "107.0.0");
  });

  it("enforces retirement and command-only mutation through executable law", async () => {
    const retirement = await evaluateReceizLawSet({ registry, phase: "merge", budget: 100, context: { previous: { life: "dead" }, proposed: { life: "alive" }, mutation: { mode: "admitted-command" } } });
    assert.equal(retirement.allowed, false);
    assert.equal(retirement.denials.some((denial) => denial.code === "RETIREMENT_IS_FINAL"), true);
    const direct = await evaluateReceizLawSet({ registry, phase: "command", budget: 100, context: { tenant: { id: "tenant-1" }, mutation: { mode: "direct-write" } } });
    assert.equal(direct.allowed, false);
    assert.equal(direct.denials.some((denial) => denial.code === "DIRECT_STATE_WRITE_FORBIDDEN"), true);
    const appDecision = await evaluateReceizAppLaws({ phase: "command", context: { mutation: { mode: "direct-write" } } });
    assert.equal(appDecision.allowed, false);
  });

  it("binds causal history to the same v107 registry and rejects unverified receipts", async () => {
    const history = createReceizAppCausalHistory({ verifyAdmissionReceipt: () => false });
    assert.equal(history.registryDigest, RECEIZ_V107_REGISTRY_DIGEST);
    assert.deepEqual(history.records(), []);
    assert.deepEqual(history.heads(), []);
    assert.equal(await history.historyRoot(), await digestReceizConstitution({ schema: "receiz.causal.history-root.v1", registryDigest: RECEIZ_V107_REGISTRY_DIGEST, records: [], heads: [] }));
    const record = await createReceizCausalRecord({
      registryDigest: RECEIZ_V107_REGISTRY_DIGEST,
      aggregateId: "card:living-1",
      kaiPulse: "1",
      parentDigests: [],
      receipt: { schema: "receiz.admission.receipt.v1", commandId: "unverified" },
      event: { type: "asset.alive", assetId: "living-1" },
    });
    await assert.rejects(history.import(record), /CAUSAL_ADMISSION_UNVERIFIED/);
  });

  it("ships all constitutional MCP operations and all machine-readable production skills", () => {
    const mcp = readFileSync("node_modules/@receiz/mcp-server/dist/index.js", "utf8");
    for (const tool of ["receiz_architecture_inspect", "receiz_law_coverage", "receiz_command_simulate", "receiz_receipt_replay", "receiz_history_trace", "receiz_merge_simulate", "receiz_bypass_scan", "receiz_conformance_run", "receiz_release_verify", "receiz_mcp_execute_command"]) assert.match(mcp, new RegExp(tool));
    for (const skill of ["receiz-architecture", "receiz-authority-security", "receiz-build-production-system", "receiz-causal-sync", "receiz-command-builder", "receiz-constitutional-laws", "receiz-deterministic-replay", "receiz-domain-builder", "receiz-migrations", "receiz-observability", "receiz-offline-first", "receiz-performance", "receiz-portable-artifacts", "receiz-release", "receiz-testing"]) {
      assert.equal(existsSync(`node_modules/@receiz/ai-skills/${skill}/SKILL.md`), true);
      assert.equal(existsSync(`node_modules/@receiz/ai-skills/${skill}/manifest.json`), true);
    }
  });

  it("detects direct authority bypasses instead of normalizing them", () => {
    const result = scanReceizAuthorityBypass("state.ownerId = claimedOwner; history.splice(0, 1);");
    assert.equal(result.ok, false);
    assert.equal(result.findings.length > 0, true);
  });
});
