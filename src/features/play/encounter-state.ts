import type { HotspotCover, HotspotSearchResult } from "./hidden-hotspots";

export type EncounterPhase = "idle" | "searching" | "hint" | "emerging" | "capsule" | "sealed" | "revealed";

export type IdleEncounterState = { phase: "idle" };

export type ActiveEncounterState = {
  phase: Exclude<EncounterPhase, "idle">;
  searchedAt: string;
  searchPoint: { x: number; z: number };
  ownerReceizId: string;
  hotspotId?: string;
  familyId?: string;
  formId?: string;
  cover?: HotspotCover;
  direction?: { x: number; z: number };
  assetId?: string;
};

export type EncounterState = IdleEncounterState | ActiveEncounterState;

export const idleEncounterState: IdleEncounterState = { phase: "idle" };

export function encounterFromSearch(
  result: HotspotSearchResult,
  searchPoint: { x: number; z: number },
  searchedAt: string,
  ownerReceizId: string
): EncounterState {
  const shared = { searchedAt, searchPoint: { ...searchPoint }, ownerReceizId };
  if (result.kind === "empty") return { phase: "searching", ...shared };
  const hotspot = {
    hotspotId: result.hotspot.id,
    familyId: result.hotspot.familyId,
    formId: result.hotspot.formId,
    cover: result.hotspot.cover
  };
  if (result.kind === "hit") return { phase: "emerging", ...shared, ...hotspot };
  if (result.kind === "near_miss") return { phase: "hint", ...shared, ...hotspot, direction: { ...result.direction } };
  return { phase: "hint", ...shared, ...hotspot };
}

export function isCapturableEncounter(
  encounter: EncounterState
): encounter is ActiveEncounterState & Required<Pick<ActiveEncounterState, "hotspotId" | "familyId" | "formId" | "cover">> {
  return (
    encounter.phase !== "idle" &&
    (encounter.phase === "emerging" || encounter.phase === "capsule" || encounter.phase === "sealed" || encounter.phase === "revealed") &&
    Boolean(encounter.hotspotId && encounter.familyId && encounter.formId && encounter.cover)
  );
}
