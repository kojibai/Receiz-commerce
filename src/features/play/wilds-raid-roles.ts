import { canonicalPortableCardJson, sha256PortableBasis, verifiedPortableCardPin, type PortableCardAsset } from "./portable-card";

export const WILDS_RAID_CARD_ROLES = ["vanguard", "striker", "warden", "resonator", "wayfinder", "steward"] as const;
export type WildsRaidCardRole = (typeof WILDS_RAID_CARD_ROLES)[number];

export type WildsRaidRoleProjection = {
  primary: WildsRaidCardRole;
  secondary: WildsRaidCardRole;
  potency: Record<WildsRaidCardRole, number>;
  assetId: string;
  proofDigest: string;
};

export function projectWildsRaidRoles(card: PortableCardAsset): WildsRaidRoleProjection {
  const pin = verifiedPortableCardPin(card);
  const { health, power, guard, speed, bond } = card.manifest.stats;
  const potency: Record<WildsRaidCardRole, number> = {
    vanguard: health + guard * 2,
    striker: power * 2 + speed,
    warden: guard * 2 + bond,
    resonator: bond * 2 + power,
    wayfinder: speed * 2 + bond,
    steward: bond * 2 + health
  };
  const tieDigest = sha256PortableBasis(canonicalPortableCardJson({ proofDigest: pin.proofDigest, purpose: "wilds.raid.roles.v1" }));
  const ranked = [...WILDS_RAID_CARD_ROLES].sort((left, right) => {
    const difference = potency[right] - potency[left];
    if (difference !== 0) return difference;
    const leftIndex = WILDS_RAID_CARD_ROLES.indexOf(left);
    const rightIndex = WILDS_RAID_CARD_ROLES.indexOf(right);
    return tieDigest.slice(7 + leftIndex * 4, 11 + leftIndex * 4).localeCompare(tieDigest.slice(7 + rightIndex * 4, 11 + rightIndex * 4));
  });
  return { primary: ranked[0]!, secondary: ranked[1]!, potency, assetId: pin.assetId, proofDigest: pin.proofDigest };
}
