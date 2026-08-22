import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { RECEIZ_V122_CONTRACT } from "../src/lib/receiz/v122/contract";
import { projectionReport, zeroWriteReport } from "../src/lib/receiz/v122/authority-report";

describe("Receiz v122 representation boundary", () => {
  it("maps all 19 v122 MCP tools without granting MCP authority", () => {
    assert.equal(RECEIZ_V122_CONTRACT.mcpTools.length, 19);
    assert.equal(RECEIZ_V122_CONTRACT.sdkVersion, "122.0.0");
    assert.equal(RECEIZ_V122_CONTRACT.authority.strongerTruth, "sealed-receiz-proof-object");
    assert.equal(RECEIZ_V122_CONTRACT.authority.mcpAuthority, false);
    assert.equal(RECEIZ_V122_CONTRACT.authority.representationCanAuthorize, false);
  });

  it("marks projections as unproven and failures as zero-write", () => {
    assert.deepEqual(projectionReport("receiz.subject.state.v122", "server-projection"), {
      primitive: "receiz.subject.state.v122",
      actionClass: "projection",
      source: "server-projection",
      mcpAuthority: false,
      proven: false,
      writes: 0,
    });
    assert.deepEqual(zeroWriteReport("receiz.world.transaction.v122", "participant_head_mismatch"), {
      primitive: "receiz.world.transaction.v122",
      actionClass: "commit",
      source: "receiz-sdk",
      mcpAuthority: false,
      proven: false,
      writes: 0,
      denialCode: "participant_head_mismatch",
    });
  });
});
