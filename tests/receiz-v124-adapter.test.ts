import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createReceizCommerceAdapter } from "../src/lib/receiz/adapter";

describe("Receiz v124 SDK adapter", () => {
  it("exposes every published remote production-runtime rail", () => {
    const v124 = createReceizCommerceAdapter({ fetchImpl: async () => new Response() }).v124;
    assert.deepEqual(Object.keys(v124.execution), ["planAtomicOperationV124", "stage", "stagePrepared", "execute", "resolve", "resolveByIdempotencyKey", "cancel"]);
    assert.deepEqual(Object.keys(v124.runtime), ["openAuthoritySessionV124", "refreshAuthoritySessionV124", "closeAuthoritySessionV124", "qualifyV124"]);
    assert.deepEqual(Object.keys(v124.domains), ["verifiedAdditionsV124", "verifiedReplayV124", "verifiedCheckpointV124", "verifiedPrivateAdditionsV124", "exportVerifiedReplayProofObjectV124", "restoreVerifiedReplayProofObjectV124"]);
    assert.equal(typeof v124.subjects.resolveNamespacesV124, "function");
    assert.equal(typeof v124.identity.resolvePublicRecipientV124, "function");
    assert.equal(typeof v124.sources.publishSealedSourceV124, "function");
  });

  it("exposes canonical local Kai, challenge, world, value, transport, recipient, and portable helpers", () => {
    const v124 = createReceizCommerceAdapter({ fetchImpl: async () => new Response() }).v124;
    assert.equal(typeof v124.kai.now, "function");
    assert.equal(typeof v124.kai.fromSealedPulse, "function");
    assert.equal(typeof v124.proofAuthority.createChallenge, "function");
    assert.equal(typeof v124.value.planLocatorBoundIntent, "function");
    assert.equal(typeof v124.recipient.normalizeAlias, "function");
    assert.equal(Object.keys(v124.world).length, 9);
    assert.equal(Object.keys(v124.transport).length, 3);
    assert.equal(Object.keys(v124.portable).length, 6);
  });

  it("exposes the complete public material URL and composite transport surface", () => {
    const material = createReceizCommerceAdapter({ fetchImpl: async () => new Response() }).v124.material;
    assert.deepEqual(Object.keys(material), [
      "encodeCapsuleBytes",
      "encodeCapsule",
      "decodeCapsuleBytes",
      "decodeCapsule",
      "readCapsuleFromUrl",
      "presentedLinkForVerification",
      "openVerifiedUrl",
      "createPlayableObjectUrl",
      "buildCompositeTransport",
      "verifyCompositeManifest",
      "reconstructCompositeCapsule",
      "readCompositePackageDigest",
      "assertCompositeHeadUrl",
      "publishCompositeTransport",
      "resolveCompositeTransport",
      "createCompositePresentationUrl",
    ]);
  });
});
