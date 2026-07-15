export const WILDS_MOVEMENT_MODE_KEY = "receiz:wilds:movement-mode:v1";

export type WildsMovementMode = "walk" | "run";

export function normalizeWildsMovementMode(value: unknown): WildsMovementMode {
  return value === "run" ? "run" : "walk";
}

export function movementScale(mode: WildsMovementMode) {
  return mode === "run" ? 1.25 : 1;
}
