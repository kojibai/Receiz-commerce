import { emptyAdventureCondition, type AdventureCardCondition } from "../../src/features/play/adventure/card-condition";
import { createArenaLivingRevision } from "../../src/features/play/arena/living-revision";
import { sealCollectedCard } from "../../src/features/play/portable-card";

export function arenaFixtureCard(formId: string, suffix = formId) {
  return sealCollectedCard({ formId, ownerReceizId: "arena.player", encounterId: `arena-${suffix}`, capturedAt: "2026-07-16T21:00:00.000Z" });
}

export function arenaFixtureRevision(card: ReturnType<typeof arenaFixtureCard>, condition: AdventureCardCondition = emptyAdventureCondition(card.id)) {
  return createArenaLivingRevision({
    assetId: card.id, eventId: `arena:event:genesis:${card.manifest.formId}`, rulesetId: "wilds.arena.v1",
    occurredAt: "2026-07-16T21:01:00.000Z", condition,
    scarIds: [], relationshipIds: [], achievementIds: [], evolutionIds: [], matchReceiptDigests: [],
  });
}
