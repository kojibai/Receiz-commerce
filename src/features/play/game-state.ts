export type GameAction = "explore" | "train" | "mission";
export type MoveDirection = "north" | "south" | "west" | "east";
export type WildsInput =
  | { type: "move"; direction: MoveDirection }
  | { type: "discover" }
  | { type: "train"; cardId?: string }
  | { type: "mission" }
  | { type: "select-card"; cardId: string }
  | { type: "reset" };

export type Vec3 = readonly [number, number, number];

export type CreatureCard = {
  id: string;
  name: string;
  species: string;
  role: string;
  power: number;
  rarity: "starter" | "rare" | "epic";
  color: string;
  accent: string;
  position: Vec3;
  businessLogic: string;
};

export type HabitatNode = {
  id: string;
  label: string;
  position: Vec3;
  tone: "grove" | "spark" | "trade" | "reward" | "gate";
};

export type MissionCard = {
  id: string;
  title: string;
  reward: string;
  requirement: string;
};

export type RewardCard = {
  id: string;
  title: string;
  businessUse: string;
  value: string;
};

export type PlayState = {
  activeAction: GameAction;
  beans: number;
  cardXp: number;
  challenge: number;
  completed: boolean;
  discoveredCardIds: string[];
  energy: number;
  lastEvent: string;
  level: number;
  missionProgress: number;
  player: {
    x: number;
    z: number;
  };
  rewardCards: RewardCard[];
  selectedCardId: string;
  streak: number;
};

export const worldBounds = {
  min: -4.2,
  max: 4.2,
  step: 1.05
} as const;

export const creatureCards: CreatureCard[] = [
  {
    id: "mintcub",
    name: "Mintcub",
    species: "Grove companion",
    role: "Heals mission fatigue and protects streaks.",
    power: 92,
    rarity: "starter",
    color: "#38d989",
    accent: "#f5d36c",
    position: [-2.8, 0, -1.4],
    businessLogic: "Free add-on, streak saver, welcome perk"
  },
  {
    id: "voltray",
    name: "Voltray",
    species: "Spark courier",
    role: "Adds speed bursts and higher rare-card odds.",
    power: 88,
    rarity: "rare",
    color: "#ff7667",
    accent: "#ffd15c",
    position: [1.6, 0, -2.1],
    businessLogic: "Flash sale, timed coupon, event multiplier"
  },
  {
    id: "ledgerfox",
    name: "Ledgerfox",
    species: "Market scout",
    role: "Finds hidden coupons and tradeable reward cards.",
    power: 76,
    rarity: "rare",
    color: "#62c8ff",
    accent: "#37d688",
    position: [-0.4, 0, 1.5],
    businessLogic: "Coupon finder, loyalty upgrade, proof trade"
  },
  {
    id: "titanseal",
    name: "Titanseal",
    species: "Vault guardian",
    role: "Unlocks boss missions and premium brand rewards.",
    power: 97,
    rarity: "epic",
    color: "#c7ec5a",
    accent: "#ff8a48",
    position: [3.1, 0, 1.2],
    businessLogic: "VIP coupon, limited drop, high-value access"
  }
];

export const habitatNodes: HabitatNode[] = [
  { id: "grove", label: "Mint Grove", position: [-3.2, 0, -1.7], tone: "grove" },
  { id: "spark-den", label: "Spark Den", position: [1.3, 0, -2.4], tone: "spark" },
  { id: "trade-crossing", label: "Trade Crossing", position: [-0.7, 0, 1.8], tone: "trade" },
  { id: "reward-nest", label: "Reward Nest", position: [1.7, 0, 2.8], tone: "reward" },
  { id: "titan-gate", label: "Titan Gate", position: [3.4, 0, 1.5], tone: "gate" }
];

export const missionCards: MissionCard[] = [
  {
    id: "daily-expedition",
    title: "Daily Wild Expedition",
    reward: "Brandable reward card",
    requirement: "Discover one companion and play a mission."
  },
  {
    id: "bond-training",
    title: "Train 3 companion cards",
    reward: "+450 beans",
    requirement: "Use card powers to raise mission progress."
  },
  {
    id: "titan-challenge",
    title: "Clear the Titan Gate",
    reward: "Custom coupon slot",
    requirement: "Bring a trained card into the gate mission."
  }
];

export const initialPlayState: PlayState = {
  activeAction: "explore",
  beans: 28,
  cardXp: 136,
  challenge: 42,
  completed: false,
  discoveredCardIds: ["mintcub"],
  energy: 84,
  lastEvent: "Mintcub joined your deck. Walk near another wild companion.",
  level: 7,
  missionProgress: 38,
  player: {
    x: -2.15,
    z: -0.85
  },
  rewardCards: [],
  selectedCardId: "mintcub",
  streak: 9
};

export function selectedCard(state: PlayState) {
  return creatureCards.find((card) => card.id === state.selectedCardId) ?? creatureCards[0];
}

export function discoveredCards(state: PlayState) {
  return creatureCards.filter((card) => state.discoveredCardIds.includes(card.id));
}

export function nearestCreature(state: Pick<PlayState, "player">) {
  return creatureCards
    .map((card) => ({
      card,
      distance: distance2d(state.player, { x: card.position[0], z: card.position[2] })
    }))
    .sort((a, b) => a.distance - b.distance)[0];
}

export function canDiscover(state: PlayState) {
  const nearest = nearestCreature(state);
  return Boolean(nearest && nearest.distance <= 1.25 && !state.discoveredCardIds.includes(nearest.card.id));
}

export function applyWildsInput(state: PlayState, input: WildsInput): PlayState {
  if (input.type === "reset") return initialPlayState;

  if (input.type === "select-card") {
    if (!state.discoveredCardIds.includes(input.cardId)) return state;
    return {
      ...state,
      selectedCardId: input.cardId,
      lastEvent: `${cardName(input.cardId)} is now leading your deck.`
    };
  }

  if (input.type === "move") {
    const nextPlayer = movePlayer(state.player, input.direction);
    const nearest = nearestCreature({ player: nextPlayer });
    const nearbyText =
      nearest.distance <= 1.25
        ? `${nearest.card.name} is within discovery range.`
        : "Explore the wilds and look for companion signals.";

    return {
      ...state,
      activeAction: "explore",
      energy: Math.max(0, state.energy - 1),
      lastEvent: nearbyText,
      player: nextPlayer
    };
  }

  if (input.type === "discover") {
    const nearest = nearestCreature(state);
    if (!nearest || nearest.distance > 1.25) {
      return {
        ...state,
        activeAction: "explore",
        lastEvent: "Move closer to a wild companion before discovering."
      };
    }

    if (state.discoveredCardIds.includes(nearest.card.id)) {
      return {
        ...state,
        activeAction: "explore",
        selectedCardId: nearest.card.id,
        lastEvent: `${nearest.card.name} is already in your deck.`
      };
    }

    const nextDiscovered = [...state.discoveredCardIds, nearest.card.id];
    return {
      ...state,
      activeAction: "explore",
      beans: state.beans + 6,
      cardXp: state.cardXp + 12,
      discoveredCardIds: nextDiscovered,
      lastEvent: `${nearest.card.name} card collected. ${nearest.card.businessLogic}.`,
      level: nextDiscovered.length >= 3 ? Math.max(state.level, 8) : state.level,
      missionProgress: Math.min(100, state.missionProgress + 12),
      selectedCardId: nearest.card.id,
      streak: state.streak + 1
    };
  }

  if (input.type === "train") {
    const targetCardId = input.cardId ?? state.selectedCardId;
    if (!state.discoveredCardIds.includes(targetCardId)) return state;

    return {
      ...state,
      activeAction: "train",
      beans: state.beans + 4,
      cardXp: state.cardXp + 10,
      challenge: Math.min(100, state.challenge + 4),
      energy: Math.max(0, state.energy - 6),
      lastEvent: `${cardName(targetCardId)} powered up. Mission cards hit harder now.`,
      missionProgress: Math.min(100, state.missionProgress + 9),
      selectedCardId: targetCardId,
      streak: state.streak + 1
    };
  }

  const progressGain = 16 + discoveredCards(state).length * 4 + Math.floor(selectedCard(state).power / 24);
  const nextProgress = Math.min(100, state.missionProgress + progressGain);
  const earnedReward = nextProgress >= 100 && !state.rewardCards.some((reward) => reward.id === "merchant-perk");

  return {
    ...state,
    activeAction: "mission",
    beans: state.beans + 10,
    cardXp: state.cardXp + 18,
    challenge: Math.min(100, state.challenge + 7),
    completed: state.completed || earnedReward,
    energy: Math.max(0, state.energy - 10),
    lastEvent: earnedReward
      ? "Mission cleared. A brandable merchant reward card is now portable."
      : `${selectedCard(state).name} played a mission power.`,
    level: earnedReward ? Math.max(state.level, 9) : state.level,
    missionProgress: nextProgress,
    rewardCards: earnedReward
      ? [
          ...state.rewardCards,
          {
            id: "merchant-perk",
            title: "Boost Coffee Wild Perk",
            businessUse: "Merchant can map this to a coupon, VIP access, free item, or custom proof reward.",
            value: "Customizable"
          }
        ]
      : state.rewardCards,
    streak: state.streak + 1
  };
}

function movePlayer(player: PlayState["player"], direction: MoveDirection) {
  const next = { ...player };

  if (direction === "north") next.z -= worldBounds.step;
  if (direction === "south") next.z += worldBounds.step;
  if (direction === "west") next.x -= worldBounds.step;
  if (direction === "east") next.x += worldBounds.step;

  return {
    x: clamp(next.x, worldBounds.min, worldBounds.max),
    z: clamp(next.z, worldBounds.min, worldBounds.max)
  };
}

function distance2d(a: { x: number; z: number }, b: { x: number; z: number }) {
  return Math.hypot(a.x - b.x, a.z - b.z);
}

function cardName(cardId: string) {
  return creatureCards.find((card) => card.id === cardId)?.name ?? "Companion";
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}
