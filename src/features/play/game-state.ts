export type GameTileKind = "empty" | "path" | "player" | "bean" | "reward" | "proof" | "locked" | "bonus" | "mug" | "bag" | "leaf";

export type GameTile = {
  id: string;
  kind: GameTileKind;
  label?: string;
};

export type PlayState = {
  playerIndex: number;
  beans: number;
  streak: number;
  level: number;
  collected: string[];
  completed: boolean;
};

export const initialPlayState: PlayState = {
  playerIndex: 0,
  beans: 18,
  streak: 2,
  level: 2,
  collected: [],
  completed: false
};

export const gameTiles: GameTile[] = [
  { id: "t0", kind: "player" },
  { id: "t1", kind: "path" },
  { id: "t2", kind: "path" },
  { id: "t3", kind: "path" },
  { id: "t4", kind: "bean" },
  { id: "t5", kind: "empty" },
  { id: "t6", kind: "empty" },
  { id: "t7", kind: "mug" },
  { id: "t8", kind: "path" },
  { id: "t9", kind: "empty" },
  { id: "t10", kind: "reward" },
  { id: "t11", kind: "path" },
  { id: "t12", kind: "empty" },
  { id: "t13", kind: "bean" },
  { id: "t14", kind: "path" },
  { id: "t15", kind: "empty" },
  { id: "t16", kind: "path" },
  { id: "t17", kind: "leaf" },
  { id: "t18", kind: "path" },
  { id: "t19", kind: "bean" },
  { id: "t20", kind: "path" },
  { id: "t21", kind: "empty" },
  { id: "t22", kind: "empty" },
  { id: "t23", kind: "empty" },
  { id: "t24", kind: "empty" },
  { id: "t25", kind: "empty" },
  { id: "t26", kind: "bonus", label: "+2" },
  { id: "t27", kind: "path" },
  { id: "t28", kind: "proof" },
  { id: "t29", kind: "locked" },
  { id: "t30", kind: "empty" },
  { id: "t31", kind: "reward" }
];

export function movePlayer(state: PlayState, nextIndex: number): PlayState {
  if (nextIndex < 0 || nextIndex >= gameTiles.length) return state;
  if (gameTiles[nextIndex].kind === "locked") return state;

  const tile = gameTiles[nextIndex];
  const collected = state.collected.includes(tile.id)
    ? state.collected
    : [...state.collected, tile.id];

  const beanGain =
    tile.kind === "bean" ? 1 : tile.kind === "bonus" ? 2 : tile.kind === "proof" ? 3 : 0;
  const completed = tile.kind === "reward" || state.beans + beanGain >= 24;

  return {
    ...state,
    playerIndex: nextIndex,
    beans: state.beans + beanGain,
    collected,
    completed
  };
}
