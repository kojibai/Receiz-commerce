export type WildsLandmarkId = "hearttree-sanctum" | "arena-of-echoes" | "prism-arcade";

export type WildsLandmarkDefinition = {
  id: WildsLandmarkId;
  name: string;
  subtitle: string;
  kind: "mastery" | "competition" | "arcade";
  position: { x: number; z: number };
  radius: number;
  accent: string;
  icon: "tree" | "trophy" | "sparkles";
  occupancy: "solo" | "public" | "matchmade";
  cardRequired: boolean;
};

export const WILDS_FLAGSHIP_LANDMARKS: readonly WildsLandmarkDefinition[] = [
  {
    id: "hearttree-sanctum",
    name: "Hearttree Sanctum",
    subtitle: "Awaken the history inside your cards",
    kind: "mastery",
    position: { x: 0, z: 0 },
    radius: 6,
    accent: "#71e8c3",
    icon: "tree",
    occupancy: "solo",
    cardRequired: true
  },
  {
    id: "arena-of-echoes",
    name: "Arena of Echoes",
    subtitle: "Meet, compete, and seal every victory",
    kind: "competition",
    position: { x: 144, z: -96 },
    radius: 8,
    accent: "#f7c948",
    icon: "trophy",
    occupancy: "matchmade",
    cardRequired: true
  },
  {
    id: "prism-arcade",
    name: "Prism Arcade",
    subtitle: "Cooperative worlds hidden inside light",
    kind: "arcade",
    position: { x: -144, z: 96 },
    radius: 8,
    accent: "#ff72bf",
    icon: "sparkles",
    occupancy: "public",
    cardRequired: true
  }
] as const;

export function landmarkAtPosition(position: { x: number; z: number }) {
  return WILDS_FLAGSHIP_LANDMARKS.find((landmark) => (
    Math.hypot(landmark.position.x - position.x, landmark.position.z - position.z) <= landmark.radius
  )) ?? null;
}
