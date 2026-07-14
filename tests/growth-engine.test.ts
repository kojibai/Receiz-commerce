import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  applyGrowthEvent,
  ascensionRequirements,
  buildTransformationCandidate,
  characterQuest,
  growthReadiness,
  nextGrowthRequirements
} from "../src/features/play/growth-engine.js";
import { admitLegacyCard, emptyLivingGrowth } from "../src/features/play/living-card-proof.js";
import { evolvePortableCard, sealCollectedCard } from "../src/features/play/portable-card.js";

const T0 = "2026-07-13T15:00:00.000Z";
const T1 = "2026-07-14T15:00:00.000Z";
const T2 = "2026-07-15T15:00:00.000Z";

function stageThreeCard() {
  const legacy = sealCollectedCard({ formId: "mintcub-1", ownerReceizId: "player.receiz.id", encounterId: "growth-engine", capturedAt: T0 });
  const living = admitLegacyCard(legacy, T0);
  const stageTwo = evolvePortableCard({ previous: living, nextFormId: "mintcub-2", evolvedAt: T1 });
  return evolvePortableCard({ previous: stageTwo, nextFormId: "mintcub-3", evolvedAt: T2 });
}

describe("Wilds earned growth engine", () => {
  it("deduplicates authoritative progress events", () => {
    const start = emptyLivingGrowth(20);
    const event = {
      eventId: "battle:boss:1",
      path: "battle" as const,
      amount: 12,
      occurredAt: T2,
      achievementId: "boss_victory_1"
    };

    const once = applyGrowthEvent(start, event);
    const twice = applyGrowthEvent(once, event);

    assert.equal(once.paths.battle, 12);
    assert.deepEqual(once.achievementIds, ["boss_victory_1"]);
    assert.deepEqual(twice, once);
  });

  it("requires bond, an unused achievement, a character quest, a catalyst, and recovery", () => {
    const card = stageThreeCard();
    const requirements = nextGrowthRequirements(card, T2);
    assert.equal(requirements.mode, "ascension");
    assert.equal(requirements.ascensionRank, 1);
    assert.ok(requirements.bond > card.manifest.revisions.at(-1)!.growth.bond);

    const missing = growthReadiness(card, { progress: emptyLivingGrowth(0), catalystIds: [] }, T2);
    assert.equal(missing.ready, false);
    assert.deepEqual(new Set(missing.missing), new Set(["bond", "achievement", "character_quest", "catalyst"]));

    const readyProgress = {
      ...emptyLivingGrowth(requirements.bond),
      achievementIds: ["boss_victory_1"],
      completedQuestIds: [requirements.quest.id]
    };
    const ready = growthReadiness(card, {
      progress: readyProgress,
      catalystIds: [`ascension:tier:${requirements.catalystTier}:earned`]
    }, T2);

    assert.equal(ready.ready, true);
    assert.deepEqual(ready.missing, []);
    assert.equal(ready.selectedAchievementId, "boss_victory_1");
    const candidate = buildTransformationCandidate(card, ready, T2);
    assert.equal(candidate.ascensionRank, 1);
    assert.equal(candidate.achievementId, "boss_victory_1");
    assert.equal(candidate.questId, requirements.quest.id);
    assert.match(candidate.catalystId, new RegExp(`^ascension:tier:${requirements.catalystTier}:`));
  });

  it("does not reuse achievements or let elapsed time create progress", () => {
    const card = stageThreeCard();
    const requirements = nextGrowthRequirements(card, T2);
    const progress = {
      ...emptyLivingGrowth(requirements.bond),
      achievementIds: ["boss_victory_1"],
      consumedAchievementIds: ["boss_victory_1"],
      completedQuestIds: [requirements.quest.id],
      recoveryUntil: "2026-07-16T15:00:00.000Z"
    };
    const context = { progress, catalystIds: [`ascension:tier:${requirements.catalystTier}:earned`] };

    const now = growthReadiness(card, context, T2);
    const later = growthReadiness(card, context, "2026-07-17T15:00:00.000Z");

    assert.ok(now.missing.includes("achievement"));
    assert.ok(now.missing.includes("recovery"));
    assert.ok(later.missing.includes("achievement"));
    assert.equal(later.missing.includes("recovery"), false);
    assert.equal(later.ready, false);
  });

  it("generates deterministic playable quests and finite high-rank requirements", () => {
    const card = stageThreeCard();
    assert.deepEqual(characterQuest(card, 27), characterQuest(card, 27));
    assert.match(characterQuest(card, 27).eventKind, /^(battle_win|ability_mastery|habitat_discovery|active_travel|bond_moment|descendant_milestone)$/);

    const high = ascensionRequirements(10_000);
    assert.equal(Number.isFinite(high.bond), true);
    assert.equal(Number.isFinite(high.recoveryMs), true);
    assert.ok(high.recoveryMs <= 7 * 24 * 60 * 60 * 1000);
  });
});
