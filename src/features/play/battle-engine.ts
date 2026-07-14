import { canonicalPortableCardJson, sha256PortableBasis } from "./portable-card";

export type BattleParticipantInput = {
  assetId?: string;
  formId?: string;
  name: string;
  health: number;
  power: number;
  guard: number;
  speed: number;
};

export type BattleFighter = {
  id: string;
  name: string;
  hp: number;
  maxHp: number;
  hpRatio: number;
  energy: number;
  power: number;
  guard: number;
  speed: number;
};

export type BattlePhase = "player_turn" | "wild_turn" | "capture_ready" | "captured" | "fled" | "defeated";
export type BattleAction =
  | { type: "ability"; slot: 0 | 1 }
  | { type: "guard" }
  | { type: "switch"; player: BattleParticipantInput }
  | { type: "capture" };

export type BattleTranscriptEntry = {
  turn: number;
  action: BattleAction["type"];
  detail: string;
  playerHp: number;
  wildHp: number;
};

export type BattleState = {
  encounterSeed: string;
  phase: BattlePhase;
  turn: number;
  player: BattleFighter;
  wild: BattleFighter;
  transcript: BattleTranscriptEntry[];
};

function fighter(input: BattleParticipantInput, fallbackId: string): BattleFighter {
  const maxHp = Math.max(1, Math.round(input.health));
  return {
    id: input.assetId ?? input.formId ?? fallbackId,
    name: input.name,
    hp: maxHp,
    maxHp,
    hpRatio: 1,
    energy: 50,
    power: Math.max(1, Math.round(input.power)),
    guard: Math.max(0, Math.round(input.guard)),
    speed: Math.max(1, Math.round(input.speed))
  };
}

function withHp(target: BattleFighter, hp: number) {
  const nextHp = Math.max(0, Math.min(target.maxHp, Math.round(hp)));
  return { ...target, hp: nextHp, hpRatio: nextHp / target.maxHp };
}

function roll(state: BattleState, action: string) {
  const digest = sha256PortableBasis(canonicalPortableCardJson({
    encounterSeed: state.encounterSeed,
    turn: state.turn,
    actorId: state.player.id,
    action,
    transcriptDigest: battleTranscriptDigest(state)
  }));
  return Number.parseInt(digest.slice(7, 15), 16) / 0xffffffff;
}

function entry(state: BattleState, action: BattleAction["type"], detail: string, player: BattleFighter, wild: BattleFighter) {
  return [...state.transcript, { turn: state.turn, action, detail, playerHp: player.hp, wildHp: wild.hp }];
}

export function startWildBattle(input: {
  encounterSeed: string;
  player: BattleParticipantInput;
  wild: BattleParticipantInput;
}): BattleState {
  return {
    encounterSeed: input.encounterSeed,
    phase: "player_turn",
    turn: 1,
    player: fighter(input.player, "player"),
    wild: fighter(input.wild, "wild"),
    transcript: []
  };
}

export function battleTranscriptDigest(state: BattleState) {
  return sha256PortableBasis(canonicalPortableCardJson(state.transcript));
}

function wildCounter(state: BattleState, player: BattleFighter, wild: BattleFighter, guarded: boolean) {
  const variance = Math.floor(roll(state, `wild:${guarded ? "guarded" : "open"}`) * 4);
  const raw = 8 + Math.floor(wild.power * 0.18) - Math.floor(player.guard * 0.08) + variance;
  const damage = Math.max(2, Math.round(raw * (guarded ? 0.42 : 1)));
  return withHp(player, player.hp - damage);
}

export function applyBattleAction(state: BattleState, action: BattleAction): BattleState {
  if (state.phase === "captured" || state.phase === "fled" || state.phase === "defeated") return state;
  if (action.type === "capture" && state.wild.hpRatio > 0.3) return state;

  if (action.type === "switch") {
    const player = fighter(action.player, "player");
    const afterCounter = wildCounter(state, player, state.wild, false);
    const phase = afterCounter.hp === 0 ? "defeated" : state.wild.hpRatio <= 0.3 ? "capture_ready" : "player_turn";
    return { ...state, phase, turn: state.turn + 1, player: afterCounter, transcript: entry(state, "switch", `Switched to ${player.name}.`, afterCounter, state.wild) };
  }

  if (action.type === "capture") {
    const chance = state.wild.hpRatio <= 0.15 ? 1 : 0.58 + (0.3 - state.wild.hpRatio) * 1.4;
    if (roll(state, "capture") <= chance) {
      return { ...state, phase: "captured", transcript: entry(state, "capture", "Capture locked.", state.player, state.wild) };
    }
    const player = wildCounter(state, state.player, state.wild, false);
    return {
      ...state,
      phase: player.hp === 0 ? "defeated" : "capture_ready",
      turn: state.turn + 1,
      player,
      transcript: entry(state, "capture", "The wild creature broke free.", player, state.wild)
    };
  }

  if (action.type === "guard") {
    const energized = { ...state.player, energy: Math.min(50, state.player.energy + 16) };
    const player = wildCounter(state, energized, state.wild, true);
    return {
      ...state,
      phase: player.hp === 0 ? "defeated" : state.wild.hpRatio <= 0.3 ? "capture_ready" : "player_turn",
      turn: state.turn + 1,
      player,
      transcript: entry(state, "guard", "Guarded and recovered energy.", player, state.wild)
    };
  }

  const cost = action.slot === 0 ? 12 : 18;
  if (state.player.energy < cost) return state;
  const variance = Math.floor(roll(state, `ability:${action.slot}`) * 4);
  const critical = roll(state, `critical:${action.slot}`) > 0.88;
  const raw = 8 + Math.floor(state.player.power * (action.slot === 0 ? 0.18 : 0.24)) - Math.floor(state.wild.guard * 0.08) + variance;
  const damage = Math.max(3, Math.round(raw * (critical ? 1.45 : 1)));
  const wild = withHp(state.wild, state.wild.hp - damage);
  const spent = { ...state.player, energy: state.player.energy - cost };
  if (wild.hp === 0) {
    return { ...state, phase: "fled", turn: state.turn + 1, player: spent, wild, transcript: entry(state, "ability", "The wild creature was knocked out and fled.", spent, wild) };
  }
  const player = wildCounter(state, spent, wild, false);
  const recovered = { ...player, energy: Math.min(50, player.energy + 4) };
  const phase = player.hp === 0 ? "defeated" : wild.hpRatio <= 0.3 ? "capture_ready" : "player_turn";
  return {
    ...state,
    phase,
    turn: state.turn + 1,
    player: recovered,
    wild,
    transcript: entry(state, "ability", `${critical ? "Critical " : ""}ability dealt ${damage}.`, recovered, wild)
  };
}
