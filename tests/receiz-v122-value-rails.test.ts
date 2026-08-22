import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { planReceizValue } from "../src/lib/receiz/v122/value-request";

describe("Receiz v122 value rails", () => {
  it("plans Settlement in Phi and keeps USD subordinate", async () => {
    const intent = await planReceizValue({
      rail: "settlement",
      amountPhiMicro: "2500000",
      sourceProofObjectId: "proof-1",
      sourceValueHead: "value-head-1",
      destinationSubjectId: "subject-2",
      expectedDestinationHead: "subject-head-2",
      usdPerPhiMicrocents: "200",
      priceBasis: { source: "canonical-receiz-price", kai: "13730000" },
    });
    assert.equal(intent.rail, "settlement");
    assert.equal(intent.amountPhiMicro, "2500000");
    assert.equal(typeof intent.quotedUsdCents, "string");
  });

  it("keeps Reserve distinct and rejects USD as movement authority", async () => {
    const reserve = await planReceizValue({
      rail: "reserve",
      amountPhiMicro: "1",
      sourceProofObjectId: "proof-1",
      sourceValueHead: "value-head-1",
      destinationSubjectId: "subject-2",
      expectedDestinationHead: "subject-head-2",
      usdPerPhiMicrocents: "200",
      priceBasis: { source: "canonical-receiz-price", kai: "13730000" },
    });
    assert.equal(reserve.rail, "reserve");
    await assert.rejects(
      planReceizValue({ rail: "reserve", amountUsdCents: "500" } as never),
      /amountPhiMicro/,
    );
  });
});
