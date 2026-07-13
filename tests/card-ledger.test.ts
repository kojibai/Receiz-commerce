import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  acceptCardTrade,
  emptyCardLedger,
  listLedgerCard,
  proposeCardTrade,
  registerLedgerCard,
  sendLedgerCard
} from "../src/lib/exchange/card-ledger";
import { sealCollectedCard } from "../src/features/play/portable-card.js";

describe("Wilds card ownership ledger", () => {
  const aliceOne = sealCollectedCard({ formId: "mintcub-1", ownerReceizId: "alice", encounterId: "a1", capturedAt: "2026-07-13T12:00:00.000Z" });
  const aliceTwo = sealCollectedCard({ formId: "voltray-1", ownerReceizId: "alice", encounterId: "a2", capturedAt: "2026-07-13T12:01:00.000Z" });
  const bobOne = sealCollectedCard({ formId: "ledgerfox-1", ownerReceizId: "bob", encounterId: "b1", capturedAt: "2026-07-13T12:02:00.000Z" });

  it("registers verified cards and lists only cards owned by the actor", () => {
    let ledger = registerLedgerCard(emptyCardLedger, { actorId: "alice", card: aliceOne, at: "2026-07-13T13:00:00.000Z" });
    ledger = listLedgerCard(ledger, { actorId: "alice", assetId: aliceOne.id, priceCents: 2500, at: "2026-07-13T13:01:00.000Z" });

    assert.equal(ledger.cards[aliceOne.id]?.ownerId, "alice");
    assert.equal(ledger.listings.at(-1)?.assetId, aliceOne.id);
    assert.throws(() => listLedgerCard(ledger, { actorId: "bob", assetId: aliceOne.id, priceCents: 2500, at: "2026-07-13T13:02:00.000Z" }), /owner/);
  });

  it("atomically accepts a multi-card trade proposed by another user", () => {
    let ledger = emptyCardLedger;
    for (const [actorId, card] of [["alice", aliceOne], ["alice", aliceTwo], ["bob", bobOne]] as const) {
      ledger = registerLedgerCard(ledger, { actorId, card, at: "2026-07-13T13:00:00.000Z" });
    }
    ledger = proposeCardTrade(ledger, {
      proposerId: "alice",
      ownerId: "bob",
      offeredAssetIds: [aliceOne.id, aliceTwo.id],
      requestedAssetIds: [bobOne.id],
      at: "2026-07-13T13:03:00.000Z"
    });
    const offer = ledger.offers.at(-1)!;
    ledger = acceptCardTrade(ledger, { actorId: "bob", offerId: offer.id, at: "2026-07-13T13:04:00.000Z" });

    assert.equal(ledger.cards[aliceOne.id]?.ownerId, "bob");
    assert.equal(ledger.cards[aliceTwo.id]?.ownerId, "bob");
    assert.equal(ledger.cards[bobOne.id]?.ownerId, "alice");
    assert.equal(ledger.offers.at(-1)?.status, "accepted");
  });

  it("sends a verified card directly to a username or email recipient", () => {
    const registered = registerLedgerCard(emptyCardLedger, { actorId: "alice", card: aliceOne, at: "2026-07-13T13:00:00.000Z" });
    const sent = sendLedgerCard(registered, { actorId: "alice", assetId: aliceOne.id, recipient: "collector@example.com", at: "2026-07-13T13:05:00.000Z" });

    assert.equal(sent.cards[aliceOne.id]?.ownerId, "collector@example.com");
    assert.equal(sent.operations.at(-1)?.type, "send");
  });
});
