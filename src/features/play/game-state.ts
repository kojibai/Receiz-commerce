export type GameAction = "explore" | "train" | "mission";

export type ArenaNodeKind = "proof" | "boost" | "market" | "reward" | "boss" | "shield";

export type ArenaNode = {
  id: string;
  kind: ArenaNodeKind;
  label: string;
  value: string;
  x: number;
  y: number;
  active?: boolean;
};

export type SquadCard = {
  id: string;
  name: string;
  role: string;
  power: string;
  charge: number;
};

export type MissionCard = {
  id: string;
  title: string;
  reward: string;
  progress: number;
};

export type PlayState = {
  activeAction: GameAction;
  beans: number;
  combo: number;
  completed: boolean;
  energy: number;
  heat: number;
  level: number;
  proofShards: number;
  streak: number;
};

const actionEffects: Record<
  GameAction,
  {
    beans: number;
    combo: number;
    energy: number;
    heat: number;
    proofShards: number;
  }
> = {
  explore: {
    beans: 3,
    combo: 1,
    energy: -7,
    heat: 5,
    proofShards: 3
  },
  train: {
    beans: 6,
    combo: 2,
    energy: -10,
    heat: 9,
    proofShards: 5
  },
  mission: {
    beans: 10,
    combo: 4,
    energy: -16,
    heat: 15,
    proofShards: 9
  }
};

export const initialPlayState: PlayState = {
  activeAction: "train",
  beans: 28,
  combo: 17,
  completed: false,
  energy: 84,
  heat: 42,
  level: 7,
  proofShards: 136,
  streak: 9
};

export const arenaNodes: ArenaNode[] = [
  { id: "mint-grove", kind: "proof", label: "Grove", value: "Mintcub", x: 14, y: 62 },
  { id: "spark-den", kind: "boost", label: "Den", value: "Voltray", x: 27, y: 34, active: true },
  { id: "market-crossing", kind: "market", label: "Trade", value: "Hub", x: 43, y: 55 },
  { id: "reward-nest", kind: "reward", label: "Nest", value: "Rare", x: 58, y: 42 },
  { id: "seal-ruins", kind: "shield", label: "Ruins", value: "Shield", x: 69, y: 68 },
  { id: "boss-gate", kind: "boss", label: "Gate", value: "Titan", x: 84, y: 42, active: true }
];

export const squadCards: SquadCard[] = [
  { id: "mintcub", name: "Mintcub", role: "Heal perks", power: "92", charge: 82 },
  { id: "voltray", name: "Voltray", role: "Speed burst", power: "88", charge: 66 },
  { id: "ledgerfox", name: "Ledgerfox", role: "Coupon finder", power: "76", charge: 54 }
];

export const missionCards: MissionCard[] = [
  { id: "daily-expedition", title: "Daily Wild Expedition", reward: "Brandable reward card", progress: 72 },
  { id: "bond-training", title: "Train 3 companion cards", reward: "+450 beans", progress: 57 },
  { id: "titan-challenge", title: "Clear the Titan Gate", reward: "Custom coupon slot", progress: 44 }
];

export function runGameAction(state: PlayState, action: GameAction): PlayState {
  const effect = actionEffects[action];
  const nextBeans = state.beans + effect.beans;
  const nextEnergy = Math.max(0, Math.min(100, state.energy + effect.energy + 4));
  const nextHeat = Math.max(0, Math.min(100, state.heat + effect.heat - 3));
  const nextCombo = Math.min(99, state.combo + effect.combo);
  const nextProofShards = state.proofShards + effect.proofShards;

  return {
    ...state,
    activeAction: action,
    beans: nextBeans,
    combo: nextCombo,
    completed: state.completed || nextBeans >= 40 || nextCombo >= 30,
    energy: nextEnergy,
    heat: nextHeat,
    level: nextProofShards >= 150 ? Math.max(state.level, 8) : state.level,
    proofShards: nextProofShards,
    streak: state.streak + 1
  };
}
