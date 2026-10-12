import { createReceizClient, receizBase64UrlEncode, sha256ReceizBytes } from "@receiz/sdk";
import { readReceizProofValueTransactionsV129, verifyReceizProofValueReplayV129, verifyReceizProofValueSaleRecoveryV129 } from "@receiz/sdk/valuation";
import assert from "node:assert/strict";
import { describe, it } from "node:test";

describe("v129 payment and delivery evidence boundary", () => {
  it("preserves the exact registered application ID when the SDK plans a local Reserve intent", async () => {
    const applicationId = "rc_AbCdEfGhIjKlMnOpQrStUvWx";
    let requests = 0;
    const client = createReceizClient({ applicationId, fetchImpl: async () => { requests++; throw new Error("unexpected_network"); } });
    // Diagnostic fixture heads are not admitted funds or a live transaction.
    const plan = await client.value.edge.planReserve({ applicationId, sourceProofObjectId: "fixture:source",
      sourceValueHead: "11".repeat(32), destinationSubjectId: "fixture:merchant", expectedDestinationHead: "22".repeat(32),
      amountPhiMicro: "9000000", usdPerPhiMicrocents: "100000000", priceBasis: { schema: "fixture.price-basis.v1" },
      idempotencyKey: "fixture:payment", attemptId: "fixture:attempt" });
    assert.equal(plan.plan.applicationId, applicationId);
    assert.equal(plan.authority.planIsTransactionAuthority, false);
    assert.equal(requests, 0);
  });

  it("reports missing held history without inventing a paid sale or ownership change", async () => {
    const result = await readReceizProofValueTransactionsV129({});
    assert.deepEqual(result.completedSales, []);
    assert.deepEqual(result.ownershipChanges, []);
    assert.deepEqual(result.incompleteHistory, [{ code: "proof-history-unavailable", assetId: null, reference: null }]);
  });

  it("rejects an unsigned paid-and-delivered record as a public completed-sale source", async () => {
    const bytes = new TextEncoder().encode(JSON.stringify({ paid: true, delivered: true, merchant: "bjklock", amountUsd: "49.00" }));
    const digest = await sha256ReceizBytes(bytes);
    await assert.rejects(verifyReceizProofValueSaleRecoveryV129({ schema: "receiz.proof-value-public-sale-recovery.v129",
      applicationId: "receiz-commerce-kit", audience: "receiz-commerce-kit", domainId: "commerce:sales",
      sourceArtifact: { schema: "receiz.sealed-artifact-bytes.v124", exactBytesB64u: receizBase64UrlEncode(bytes),
        artifactSha256: digest, payloadSha256: digest, filename: "unsigned-sale.json", mimeType: "application/json" } }));
  });

  it("keeps a caller-created replay invalid with zero writes", async () => {
    const result = await verifyReceizProofValueReplayV129({ schema: "receiz.proof-value-replay.v129",
      sdkVersion: "129.0.0", paid: true, valuePhiMicro: "49000000" });
    assert.equal(result.status, "invalid-replay");
    assert.equal(result.writesPerformed, 0);
  });
});
