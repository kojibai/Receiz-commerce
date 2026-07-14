import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { applyBattleAction, battleGrowthAwards, battleTranscriptDigest, elementEffectiveness, startWildBattle } from "../src/features/play/battle-engine";

const input = {
  encounterSeed: "hotspot:0:0:1",
  player: { assetId: "wilds:player", name: "SealCub", element: "Grove", health: 82, power: 44, guard: 40, speed: 48 },
  wild: { formId: "voltray-1", name: "Voltray", element: "Tide", health: 76, power: 39, guard: 31, speed: 45 }
};

describe("Wilds deterministic battle engine", () => {
  it("starts and replays the same battle deterministically", () => {
    const first = startWildBattle(input);
    const replay = startWildBattle(input);
    assert.deepEqual(replay, first);
    assert.equal(first.phase, "player_turn");
    assert.equal(battleTranscriptDigest(first), battleTranscriptDigest(replay));
  });

  it("spends energy, resolves turns, and unlocks capture below thirty percent", () => {
    let battle = startWildBattle(input);
    const startingEnergy = battle.player.energy;
    battle = applyBattleAction(battle, { type: "ability", slot: 0 });
    assert.ok(battle.player.energy < startingEnergy);
    for (let turn = 0; turn < 20 && battle.phase !== "capture_ready" && battle.phase !== "fled"; turn += 1) {
      battle = applyBattleAction(battle, battle.player.energy >= 12 ? { type: "ability", slot: 0 } : { type: "guard" });
    }
    assert.equal(battle.phase, "capture_ready");
    assert.ok(battle.wild.hpRatio <= 0.3 && battle.wild.hp > 0);
  });

  it("blocks capture while strong and makes knockout cause a flee", () => {
    const first = startWildBattle(input);
    assert.equal(applyBattleAction(first, { type: "capture" }), first);
    const risky = { ...first, wild: { ...first.wild, hp: 1, hpRatio: 1 / first.wild.maxHp } };
    assert.equal(applyBattleAction(risky, { type: "ability", slot: 1 }).phase, "fled");
  });

  it("guards incoming damage and can switch to another verified card", () => {
    const first = startWildBattle(input);
    const guarded = applyBattleAction(first, { type: "guard" });
    assert.ok(guarded.player.hp > 0);
    const switched = applyBattleAction(guarded, {
      type: "switch",
      player: { assetId: "wilds:second", name: "Ledgerfox", health: 70, power: 37, guard: 45, speed: 52 }
    });
    assert.equal(switched.player.id, "wilds:second");
    assert.equal(switched.transcript.at(-1)?.action, "switch");
  });

  it("summarizes authoritative growth only when a wild is weakened for capture", () => {
    let battle = startWildBattle(input);
    const before = battle;
    for (let turn = 0; turn < 20 && battle.phase === "player_turn"; turn += 1) {
      battle = applyBattleAction(battle, battle.player.energy >= 12 ? { type: "ability", slot: 0 } : { type: "guard" });
    }

    assert.deepEqual(battleGrowthAwards(before, applyBattleAction(before, { type: "guard" })), []);
    assert.equal(battle.phase, "capture_ready");
    assert.equal(battleGrowthAwards(before, battle).some((award) => award.kind === "battle_win"), true);
    assert.equal(battleGrowthAwards(before, battle).some((award) => award.kind === "ability_mastery"), true);
  });

  it("uses a readable six-element advantage grammar", () => {
    assert.equal(elementEffectiveness("Grove", "Tide"), 1.35);
    assert.equal(elementEffectiveness("Tide", "Grove"), 0.75);
    assert.equal(elementEffectiveness("Spark", "Stone"), 1.35);
    assert.equal(elementEffectiveness("Prism", "Ember"), 1);
  });

  it("telegraphs deterministic wild intent and rewards focus timing", () => {
    const first = startWildBattle(input);
    assert.deepEqual(first.intent, startWildBattle(input).intent);
    assert.match(first.intent.label, /Strike|Break|Recover/);

    const focused = applyBattleAction(first, { type: "focus" });
    assert.equal(focused.player.focus, 1);
    assert.equal(focused.player.combo, 1);
    assert.equal(focused.transcript.at(-1)?.action, "focus");
    assert.deepEqual(focused.intent, applyBattleAction(startWildBattle(input), { type: "focus" }).intent);
  });

  it("applies bounded elemental conditions and consumes focus for guard break", () => {
    let battle = startWildBattle(input);
    battle = applyBattleAction(battle, { type: "focus" });
    battle = applyBattleAction(battle, { type: "focus" });
    const burst = applyBattleAction(battle, { type: "ability", slot: 1 });
    assert.equal(burst.player.focus, 0);
    assert.ok(burst.wild.conditions.some((condition) => condition.kind === "guard_broken"));
    assert.ok(burst.wild.conditions.every((condition) => condition.turns >= 1 && condition.turns <= 2));
  });
});
