"use client";

import dynamic from "next/dynamic";
import { Icons } from "@/components/icons";
import { Button, StatusPill } from "@/components/ui";
import {
  applyWildsInput,
  initialPlayState,
  missionCards,
  restorePlayState,
  serializePlayState,
  selectedAsset,
  selectedCard,
  type PlayState,
  type WildsInput
} from "@/features/play/game-state";
import { useEffect, useState } from "react";
import type { PortableCardAsset } from "@/features/play/portable-card";
import { WildsCaptureReward } from "@/features/play/WildsCaptureReward";
import { WildsInventory } from "@/features/play/WildsInventory";
import { WildsBattle } from "@/features/play/WildsBattle";
import { WildsTransformation } from "@/features/play/WildsTransformation";
import { WildsChildCeremony } from "@/features/play/WildsChildCeremony";
import { WildsMultiplayer } from "@/features/play/WildsMultiplayer";
import { useWildsMultiplayer } from "@/features/play/use-wilds-multiplayer";
import { useWildsWorld } from "@/features/play/use-wilds-world";
import { WildsAudioSettings } from "@/features/play/WildsAudioSettings";
import { useWildsPresentation } from "@/features/play/use-wilds-presentation";
import { selectWildsQualityProfile } from "@/features/play/wilds-quality-profile";
import { projectWorldProgression } from "@/features/play/world-progression";
import { WildsCommandDock, type WildsCommandItem } from "@/features/play/WildsCommandDock";
import { WildsWorldMap } from "@/features/play/WildsWorldMap";
import { WildsWorldControls } from "@/features/play/WildsWorldControls";
import { WildsLandmarkExperience } from "@/features/play/WildsLandmarkExperience";
import { normalizeWildsMovementMode, WILDS_MOVEMENT_MODE_KEY, type WildsMovementMode } from "@/features/play/wilds-movement";
import { resolveWildsContextAction } from "@/features/play/wilds-context-action";
import { landmarkAtPosition, WILDS_FLAGSHIP_LANDMARKS, type WildsLandmarkId } from "@/features/play/wilds-landmarks";
import { evaluateLandmarkAccess, type WildsLandmarkProgress } from "@/features/play/wilds-landmark-access";
import type { RiftTravelGrant } from "@/features/play/wilds-rift-travel";
import { createWildsPlayerVault, reconcileWildsPlayerVault } from "@/features/play/wilds-player-vault";
import { initialWildsWorldProjection } from "@/features/play/wilds-world-state";
import { bossAudioCue, ecologyAudioCue, normalizeWildsAudioSettings, settlementAudioCue } from "@/features/play/wilds-audio";
import { WildsLivingWorldHud } from "@/features/play/WildsLivingWorldHud";
import { WildsSettlementExperience } from "@/features/play/WildsSettlementExperience";
import { createWildsCivicEvent, normalizeWildsCivicActorId, projectWildsCivicHistory } from "@/features/play/wilds-civic-history";
import { WildsEcologyExperience } from "@/features/play/WildsEcologyExperience";
import { createWildsEcologyReceipt } from "@/features/play/wilds-ecology-history";
import { WildsRaidExperience } from "@/features/play/WildsRaidExperience";
import { projectWildsRaidRoles } from "@/features/play/wilds-raid-roles";
import { createWildsRaidReceipt } from "@/features/play/wilds-raid-history";
import type { WildsRaidEncounterState, WildsRaidIntent } from "@/features/play/wilds-raid-encounter";
import type { WildsBossFamilyId } from "@/features/play/wilds-boss-ecology";

const WILDS_SAVE_KEY = "receiz:wilds:save:v2";
const WILDS_AVATAR_KEY = "receiz:wilds:explorer:v1";
const WILDS_ACHIEVEMENTS_KEY = "receiz:wilds:landmark-unlocks:v1";

function currentWildsQualityProfile() {
  if (typeof window === "undefined") {
    return selectWildsQualityProfile({ width: 390, reducedMotion: false });
  }
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const deviceMemory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  return selectWildsQualityProfile({
    width: window.innerWidth,
    hardwareConcurrency: navigator.hardwareConcurrency,
    deviceMemory,
    reducedMotion
  });
}

const WildsWorldCanvas = dynamic(
  () => import("@/features/play/WildsWorldCanvas").then((mod) => mod.WildsWorldCanvas),
  {
    ssr: false,
    loading: () => <div className="wilds-canvas-fallback" aria-label="Loading 3D world" />
  }
);

export function PlayCampaign({
  campaignName = "Reward Challenge",
  enabled,
  onComplete,
  ownerReceizId = "wilds.player.receiz.id",
  onListAsset
}: {
  campaignName?: string;
  enabled: boolean;
  onComplete?: (beans: number) => void;
  ownerReceizId?: string;
  onListAsset?: (asset: PortableCardAsset, priceCents: number) => Promise<PortableCardAsset | null>;
}) {
  const [state, setState] = useState(initialPlayState);
  const [saveRestored, setSaveRestored] = useState(false);
  const [rewardAsset, setRewardAsset] = useState<PortableCardAsset | null>(null);
  const [avatarStyle, setAvatarStyle] = useState<"female" | "male" | null>(null);
  const [qualityProfile, setQualityProfile] = useState(currentWildsQualityProfile);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const [cameraHeading, setCameraHeading] = useState(0);
  const [movementMode, setMovementMode] = useState<WildsMovementMode>("walk");
  const [activeLandmarkId, setActiveLandmarkId] = useState<WildsLandmarkId | null>(null);
  const [activeEcologySiteId, setActiveEcologySiteId] = useState<string | null>(null);
  const [activeRaid, setActiveRaid] = useState<{ bossId: string; roundId: string; placement: "fighter" | "support"; connected: boolean } | null>(null);
  const [raidReturnPosition, setRaidReturnPosition] = useState<{ x: number; z: number } | null>(null);
  const [raidBusyIntent, setRaidBusyIntent] = useState<WildsRaidIntent["type"] | null>(null);
  const [landmarkUnlocks, setLandmarkUnlocks] = useState<string[]>([]);
  const [riftError, setRiftError] = useState("");
  const activeMission = missionCards[state.completedMissionIds.length % missionCards.length];
  const worldProgression = projectWorldProgression(state.worldMastery);
  const activeCard = selectedCard(state);
  const activeAsset = selectedAsset(state);
  const deckCards = state.inventory;
  const activeProgress = state.companionProgress[activeCard.id] ?? { level: 1, xp: 0, bond: 0 };
  const multiplayer = useWildsMultiplayer({
    enabled: enabled && Boolean(avatarStyle) && Boolean(activeAsset),
    style: avatarStyle ?? "female",
    position: state.player,
    activeCard: activeAsset
  });
  const livingWorld = useWildsWorld({
    enabled: enabled && Boolean(avatarStyle),
    guestId: multiplayer.guestId,
    activeCard: activeAsset
  });
  const presentation = useWildsPresentation({
    encounter: {
      phase: state.encounter.phase,
      proximity: state.encounter.phase === "idle" ? "cold" : state.encounter.proximity
    },
    enabled: enabled && Boolean(avatarStyle)
  });
  const createVaultPlayer = () => {
    const exportedAt = new Date().toISOString();
    return createWildsPlayerVault({
      playerId: ownerReceizId,
      exportedAt,
      playState: state,
      settings: { avatarStyle, movementMode, audio: { ...presentation.audioSettings } },
      personalEvents: state.achievements.map((id) => ({ eventId: `achievement:${id}`, kind: "achievement.earned", occurredAt: exportedAt })),
      canonicalCursor: {
        worldId: "wilds:global:v3",
        revision: livingWorld.snapshot?.revision ?? 0,
        eventId: livingWorld.snapshot?.cursor?.eventId ?? null
      },
      receipts: state.inventory.map((asset) => ({ eventId: asset.id, digest: asset.proof.digest }))
    });
  };

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => {
      setQualityProfile(currentWildsQualityProfile());
      setReducedMotion(preference.matches);
    };
    update();
    window.addEventListener("resize", update);
    preference.addEventListener("change", update);
    return () => {
      window.removeEventListener("resize", update);
      preference.removeEventListener("change", update);
    };
  }, []);

  useEffect(() => {
    const restored = restorePlayState(window.localStorage.getItem(WILDS_SAVE_KEY));
    const params = new URLSearchParams(window.location.search);
    const joinRoom = params.get("wildsJoin");
    const joinX = Number(params.get("wildsX"));
    const joinZ = Number(params.get("wildsZ"));
    setState(/^invite:[a-f0-9]{16}$/.test(joinRoom ?? "") && Number.isFinite(joinX) && Number.isFinite(joinZ)
      ? { ...restored, player: { x: joinX + 1.4, z: joinZ + 1.4 }, lastEvent: "Invite signal found. You joined the shared trail beside its sender." }
      : restored);
    const savedAvatar = window.localStorage.getItem(WILDS_AVATAR_KEY);
    if (savedAvatar === "female" || savedAvatar === "male") setAvatarStyle(savedAvatar);
    try {
      const savedUnlocks = JSON.parse(window.localStorage.getItem(WILDS_ACHIEVEMENTS_KEY) ?? "[]");
      if (Array.isArray(savedUnlocks)) setLandmarkUnlocks(savedUnlocks.filter((item): item is string => typeof item === "string").slice(0, 64));
    } catch {
      // Landmark progression starts clean when local storage is malformed.
    }
    setMovementMode(normalizeWildsMovementMode(window.localStorage.getItem(WILDS_MOVEMENT_MODE_KEY)));
    setSaveRestored(true);
  }, []);

  useEffect(() => {
    if (!saveRestored) return;
    try {
      window.localStorage.setItem(WILDS_MOVEMENT_MODE_KEY, movementMode);
    } catch {
      // Movement mode remains active for this session when storage is unavailable.
    }
  }, [movementMode, saveRestored]);

  useEffect(() => {
    if (!saveRestored) return;
    try {
      window.localStorage.setItem(WILDS_SAVE_KEY, serializePlayState(state));
    } catch {
      // The game remains playable when browser persistence is unavailable.
    }
  }, [saveRestored, state]);

  useEffect(() => {
    if (state.encounter.phase === "battle_intro") {
      const timer = window.setTimeout(() => setState((current) => applyWildsInput(current, { type: "start-battle", at: new Date().toISOString() })), 650);
      return () => window.clearTimeout(timer);
    }
    const delay = state.encounter.phase === "emerging" ? 1_050 : state.encounter.phase === "capsule" ? 1_250 : state.encounter.phase === "sealed" ? 700 : null;
    if (delay === null) return;
    const timer = window.setTimeout(() => {
      setState((current) => applyWildsInput(current, { type: "advance-encounter", at: new Date().toISOString() }));
    }, delay);
    return () => window.clearTimeout(timer);
  }, [state.encounter.phase]);

  useEffect(() => {
    if (state.encounter.phase !== "revealed" || !state.encounter.assetId) return;
    const assetId = state.encounter.assetId;
    const asset = state.inventory.find((candidate) => candidate.id === assetId) ?? null;
    setRewardAsset(asset);
  }, [state.encounter, state.inventory]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!avatarStyle) return;
      const target = event.target as HTMLElement | null;
      if (target?.matches("input, textarea, select, button, [contenteditable='true']")) return;
      const key = event.key.toLowerCase();
      const input: WildsInput | null =
        key === "arrowup" || key === "w" ? { type: "move", direction: "north" }
          : key === "arrowdown" || key === "s" ? { type: "move", direction: "south" }
            : key === "arrowleft" || key === "a" ? { type: "move", direction: "west" }
              : key === "arrowright" || key === "d" ? { type: "move", direction: "east" }
                : key === "t" ? { type: "train", at: new Date().toISOString() }
                    : key === "m" ? { type: "mission" }
                      : key === "r" ? { type: "rest" }
                        : null;
      if (!input) return;
      event.preventDefault();
      setState((current) => {
        const next = applyWildsInput(current, input);
        if (!current.completed && next.completed) onComplete?.(next.beans);
        return next;
      });
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [avatarStyle, onComplete, ownerReceizId]);

  if (!enabled) {
    return (
      <section className="panel play-disabled">
        <div>
          <h2>Game module is off</h2>
          <p>This store still works as proof-sealed commerce without the game layer.</p>
        </div>
        <StatusPill tone="neutral">Optional</StatusPill>
      </section>
    );
  }

  const dispatch = (input: WildsInput) => {
    if (!avatarStyle) return;
    setState((current) => {
      const next = applyWildsInput(current, input);
      if (!current.completed && next.completed) {
        onComplete?.(next.beans);
      }
      return next;
    });
  };
  const discoveryActive = state.encounter.phase === "idle" || state.encounter.phase === "searching" || state.encounter.phase === "hint";
  const activeProximity = state.encounter.phase === "idle" ? "cold" : state.encounter.proximity ?? "cold";
  const proximityLabel = state.encounter.phase === "idle"
    ? "Tap terrain to scan"
    : `${activeProximity}${state.encounter.trend ? ` · ${state.encounter.trend}` : ""}`;
  const currentLandmark = landmarkAtPosition(state.player);
  const civic = projectWildsCivicHistory(state.civicEvents);
  const civicActorId = normalizeWildsCivicActorId(ownerReceizId);
  const settlementWorldMode = livingWorld.mode === "receiz_live" ? "receiz_live" : livingWorld.mode === "local_practice" ? "local_practice" : "connecting";
  const discoveredLandmarkIds: WildsLandmarkId[] = civic.completedSourceIds.includes("settlement:wayfinder-hollow")
    ? ["hearttree-sanctum", "wayfinder-hollow"]
    : ["hearttree-sanctum"];
  const landmarkProgress: WildsLandmarkProgress = {
    verifiedCardCount: state.inventory.length,
    activeCardLevel: activeProgress.level,
    achievementIds: landmarkUnlocks,
    partySize: multiplayer.remotePlayers.length + 1
  };
  const currentLandmarkAccess = currentLandmark ? evaluateLandmarkAccess(currentLandmark, landmarkProgress) : null;
  const nearbyLivingSite = Object.values(livingWorld.snapshot?.sites ?? {})
    .map((site) => ({ site, distance: Math.hypot(site.position.x - state.player.x, site.position.z - state.player.z) }))
    .filter(({ site, distance }) => Boolean(site.bossId) && site.phase !== "memorialized" && site.phase !== "expired" && distance <= site.radius + 8)
    .sort((left, right) => left.distance - right.distance)[0] ?? null;
  const nearbyLivingBoss = nearbyLivingSite?.site.bossId ? livingWorld.snapshot?.bosses[nearbyLivingSite.site.bossId] : null;
  const nearbyEcology = Object.values(livingWorld.snapshot?.ecologySites ?? {})
    .map((site) => ({ site, distance: Math.hypot(site.position.x - state.player.x, site.position.z - state.player.z) }))
    .filter(({ site, distance }) => (site.phase === "foreshadowed" || site.phase === "discovered" || site.phase === "active") && distance <= site.radius)
    .sort((left, right) => left.distance - right.distance)[0] ?? null;
  const activeEcologySite = activeEcologySiteId ? livingWorld.snapshot?.ecologySites[activeEcologySiteId] ?? null : null;
  const activeRaidBoss = activeRaid ? livingWorld.snapshot?.bosses[activeRaid.bossId] ?? null : null;
  const activeRaidRound = activeRaid ? livingWorld.snapshot?.raids[activeRaid.roundId] ?? null : null;
  const activeRaidEncounter = activeRaidRound && typeof activeRaidRound.encounter === "object" ? activeRaidRound.encounter as WildsRaidEncounterState : null;
  const activeRaidRoles = activeAsset ? projectWildsRaidRoles(activeAsset) : null;
  const basePulse = resolveWildsContextAction({
    pendingReward: Boolean(rewardAsset),
    landmark: currentLandmark,
    secretId: state.encounter.phase === "hint" ? state.encounter.hotspotId ?? null : null,
    selectedPlayer: multiplayer.selectedPlayer
      ? { playerId: multiplayer.selectedPlayer.playerId, handle: multiplayer.selectedPlayer.handle }
      : null,
    joinableActivity: nearbyLivingBoss && nearbyLivingBoss.phase !== "defeated" ? { id: nearbyLivingBoss.id, name: "shared boss raid" } : null
  });
  const pulse = nearbyEcology && (basePulse.kind === "scan" || basePulse.kind === "greet")
    ? { kind: "join" as const, label: `${nearbyEcology.site.phase === "foreshadowed" ? "Discover" : "Enter"} ${nearbyEcology.site.name}`, activityId: nearbyEcology.site.id }
    : basePulse;
  const visiblePulse = pulse.kind === "enter" && currentLandmarkAccess && !currentLandmarkAccess.allowed
    ? { ...pulse, label: `Inspect sealed ${currentLandmark?.name ?? "landmark"}` }
    : pulse;
  const activatePulse = () => {
    if (pulse.kind === "enter") {
      if (pulse.landmarkId === "wayfinder-hollow") {
        if (!civic.completedSourceIds.includes("settlement:wayfinder-hollow")) {
          dispatch({
            type: "record-civic-event",
            event: createWildsCivicEvent({
              settlementId: "wayfinder-hollow",
              actorId: civicActorId,
              kind: "settlement.discovered",
              sourceId: "settlement:wayfinder-hollow",
              occurredAt: new Date().toISOString(),
              cardProofDigest: null,
              reputation: 3
            })
          });
        }
        presentation.playCue(settlementAudioCue("arrival"));
      }
      setActiveLandmarkId(pulse.landmarkId);
      return;
    }
    if (pulse.kind === "join") {
      if (pulse.activityId.startsWith("ecology:")) {
        const ecology = livingWorld.snapshot?.ecologySites[pulse.activityId];
        if (!ecology || !nearbyEcology || nearbyEcology.site.id !== ecology.id) return;
        if (ecology.phase !== "foreshadowed") {
          presentation.playCue(ecologyAudioCue("discovered", ecology.familyId));
          setActiveEcologySiteId(ecology.id);
          return;
        }
        void livingWorld.discoverEcology(ecology.id, state.player).then((projection) => {
          const admitted = projection.ecologySites[ecology.id];
          const cursor = projection.cursor;
          if (!admitted || !cursor) throw new Error("wilds_ecology_discovery_receipt_missing");
          dispatch({
            type: "record-ecology-event",
            event: createWildsEcologyReceipt({
              actorId: civicActorId,
              siteId: admitted.id,
              familyId: admitted.familyId,
              kind: "site.discovered",
              sourceEventId: cursor.eventId,
              occurredAt: cursor.pulse,
              canonicalRevision: projection.revision,
              mastery: 1,
              cardProofDigest: null
            })
          });
          presentation.playCue(ecologyAudioCue("discovered", admitted.familyId));
          setActiveEcologySiteId(admitted.id);
        }).catch((error) => setRiftError(error instanceof Error ? error.message : "wilds_ecology_discovery_failed"));
        return;
      }
      const round = Object.values(livingWorld.snapshot?.raids ?? {}).find((candidate) => candidate.bossId === pulse.activityId && candidate.phase !== "settled" && candidate.phase !== "expired");
      if (!round) { setRiftError("wilds_world_raid_missing"); return; }
      setRaidReturnPosition({ ...state.player });
      void livingWorld.enterRaid(pulse.activityId, round.id, state.player).then((projection) => {
        const admitted = projection.raids[round.id];
        if (!admitted) throw new Error("wilds_raid_admission_missing");
        const squads = Array.isArray(admitted.squads) ? admitted.squads as string[][] : [];
        const placement = squads.some((squad) => squad.includes(multiplayer.guestId)) ? "fighter" : "support";
        setActiveRaid({ bossId: pulse.activityId, roundId: round.id, placement, connected: true });
        if (nearbyLivingBoss?.familyId) presentation.playCue(bossAudioCue("telegraph", nearbyLivingBoss.familyId as WildsBossFamilyId));
      }).catch((error) => setRiftError(error instanceof Error ? error.message : "wilds_raid_join_failed"));
      return;
    }
    if (pulse.kind === "collect" || pulse.kind === "greet") return;
    dispatch({
      type: "search-point",
      x: state.player.x,
      z: state.player.z,
      searchedAt: new Date().toISOString(),
      ownerReceizId
    });
  };
  const riftTo = async (destination: { x: number; z: number }) => {
    setRiftError("");
    try {
      const response = await fetch("/api/wilds/rift", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          roomKey: multiplayer.roomKey,
          guestId: multiplayer.guestId,
          source: state.player,
          destination,
          idempotencyKey: `rift:${crypto.randomUUID()}`
        })
      });
      const result = await response.json().catch(() => null) as { ok?: boolean; grant?: RiftTravelGrant; error?: string } | null;
      if (!response.ok || !result?.ok || !result.grant) throw new Error(result?.error ?? "wilds_rift_failed");
      dispatch({
        type: "apply-rift-grant",
        grant: result.grant,
        playerId: result.grant.playerId
      });
      multiplayer.selectPlayer(null);
      setActiveLandmarkId(null);
      setMapOpen(false);
    } catch (error) {
      setRiftError(error instanceof Error ? error.message : "wilds_rift_failed");
    }
  };
  const commandItems: readonly WildsCommandItem[] = [
    {
      key: "mission",
      label: "World Mission",
      icon: <Icons.trophy size={21} />,
      badge: `${state.missionProgress}%`,
      content: (
        <div className="wilds-command-content wilds-mission-content">
          <div className="wilds-command-content-lead">
            <span><small>Current mission</small><strong>{activeMission.title}</strong></span>
            <b>{state.missionProgress}%</b>
          </div>
          <div className="wilds-world-chapter">
            <span>
              <small>Chapter {worldProgression.chapterIndex + 1} · Cycle {worldProgression.cycle}</small>
              <strong>{worldProgression.chapter.name}</strong>
            </span>
            <b>{worldProgression.chapter.element}</b>
            <p>{worldProgression.chapter.objective}</p>
            <div className="wilds-progress" aria-label={`${worldProgression.chapterMastery}% chapter mastery`}>
              <span style={{ width: `${worldProgression.chapterMastery}%` }} />
            </div>
            <span className="wilds-world-event">
              <small>Live world event</small>
              <strong>{worldProgression.worldEvent.name}</strong>
              <em>{worldProgression.worldEvent.objective}</em>
            </span>
            <small>Permanent mastery {state.worldMastery} · Next realm at {worldProgression.nextChapterAt}</small>
          </div>
          <p>{activeMission.requirement}</p>
          <div className="wilds-progress" aria-label={`${state.missionProgress}% mission progress`}>
            <span style={{ width: `${state.missionProgress}%` }} />
          </div>
          <strong className="wilds-command-reward-label">{activeMission.reward}</strong>
          <div className="wilds-economy-grid">
            <div><span>Deck</span><strong>{deckCards.length}/∞</strong></div>
            <div><span>Near</span><strong>{state.encounter.phase === "idle" ? "Hidden" : state.encounter.phase}</strong></div>
            <div><span>Titan Gate</span><strong>{state.bossUnlocked ? "Open" : "Locked"}</strong></div>
          </div>
          <Button className="wilds-reset" variant="outline" onClick={() => dispatch({ type: "reset" })}>Reset world</Button>
        </div>
      )
    },
    {
      key: "rewards",
      label: "Rewards",
      icon: <Icons.gift size={21} />,
      badge: state.rewardCards.length ? "100%" : `${state.missionProgress}%`,
      content: (
        <div className="wilds-command-content wilds-reward-card">
          <div className="wilds-command-content-lead">
            <span><small>Portable reward</small><strong>{state.rewardCards.length ? `${state.rewardCards.length} reward ready` : "Locked merchant card"}</strong></span>
            <b>{state.rewardCards.length ? "Ready" : `${Math.max(0, 100 - state.missionProgress)}% left`}</b>
          </div>
          {state.rewardCards.length ? state.rewardCards.map((reward) => (
            <div key={reward.id}><strong>{reward.title}</strong><p>{reward.businessUse}</p><b>{reward.value}</b></div>
          )) : (
            <div><strong>Clear the world mission</strong><p>Mint a portable card businesses can map to coupons, access, perks, or custom proof logic.</p></div>
          )}
        </div>
      )
    },
    {
      key: "deck",
      label: "Active Deck",
      icon: <Icons.assets size={21} />,
      content: (
        <div className="wilds-command-content">
          <div className="wilds-command-content-lead">
            <span><small>Active leader</small><strong>{activeAsset?.manifest.name ?? activeCard.name}</strong></span>
            <b>{deckCards.length}/∞</b>
          </div>
          <div className="wilds-squad-list" aria-label="Collected companion cards">
            {deckCards.map((card) => (
              <button
                aria-pressed={state.selectedAssetId === card.id}
                className="wilds-squad-card"
                key={card.id}
                onClick={() => dispatch({ type: "select-asset", assetId: card.id })}
                type="button"
              >
                <span style={{ background: card.manifest.variant.traits.palette.primary }}>{card.manifest.name.slice(0, 2).toUpperCase()}</span>
                <div><strong>{card.manifest.name}</strong><small>Stage {card.manifest.stage} · Level {state.companionProgress[card.manifest.familyId]?.level ?? 1} · Bond {state.companionProgress[card.manifest.familyId]?.bond ?? 0}</small></div>
                <b>{card.manifest.stats.power}</b>
                <div className="wilds-mini-charge" aria-label={`${card.manifest.stats.power}% power`}><i style={{ width: `${card.manifest.stats.power}%` }} /></div>
              </button>
            ))}
          </div>
        </div>
      )
    },
    {
      key: "vault",
      label: "Card Vault",
      icon: <Icons.box size={21} />,
      badge: state.inventory.length,
      content: (
        <div className="wilds-command-content wilds-vault-command-content">
          <div className="wilds-vault-sheet-heading"><small>Portable card vault</small><strong>{state.inventory.length} sealed {state.inventory.length === 1 ? "card" : "cards"}</strong></div>
          <WildsInventory
            state={state}
            onInput={dispatch}
            onListAsset={onListAsset}
            createVaultPlayer={createVaultPlayer}
            onRestorePlayerVault={(player) => {
              try {
                const restored = reconcileWildsPlayerVault({
                  local: state,
                  restored: player,
                  canonical: livingWorld.snapshot ?? initialWildsWorldProjection(),
                  actorId: ownerReceizId
                });
                setState(restored.state);
                setAvatarStyle(player.settings.avatarStyle);
                setMovementMode(player.settings.movementMode);
                presentation.setAudioSettings(normalizeWildsAudioSettings(player.settings.audio));
                setRiftError(restored.warnings.length ? "Vault restored. Live world facts were reconciled." : "Vault and player history restored.");
              } catch (error) {
                setRiftError(error instanceof Error ? error.message : "wilds_player_vault_restore_failed");
              }
            }}
          />
        </div>
      )
    }
  ];

  return (
    <section className="panel play-panel wilds-play-panel" id="play">
      <div className="play-header wilds-header">
        <div>
          <h2>
            <span>Play:</span> Receiz Wilds
          </h2>
          <p>{campaignName} is now a playable 3D creature-card world: discover companions, build a deck, run missions, and unlock portable merchant rewards.</p>
        </div>
        <div className="play-stats wilds-stat-strip" aria-label="Current game stats">
          <StatusPill tone="pink">{state.streak}x streak</StatusPill>
          <StatusPill tone="neutral">{state.beans} beans</StatusPill>
          <StatusPill tone="gold">Level {state.level}</StatusPill>
        </div>
      </div>

      <div className="wilds-shell wilds-playable-shell">
        <div className="wilds-world">
          <div
            className={`wilds-stage${state.encounter.phase === "hint" ? ` signal-${state.encounter.proximity}` : ""}${multiplayer.activeBattle ? " pvp-active" : ""}`}
            aria-label="Receiz Wilds playable 3D world"
          >
            <WildsWorldCanvas
              state={state}
              avatarStyle={avatarStyle ?? "female"}
              remotePlayers={multiplayer.remotePlayers}
              qualityProfile={qualityProfile}
              searchEnabled={discoveryActive && Boolean(avatarStyle)}
              livingWorld={livingWorld.snapshot}
              worldMode={settlementWorldMode}
              onCameraHeadingChange={setCameraHeading}
              onSelectPlayer={multiplayer.selectPlayer}
              onSearchPoint={(point) => {
                dispatch({ type: "search-point", ...point, searchedAt: new Date().toISOString(), ownerReceizId });
              }}
            />

            {avatarStyle ? <WildsMultiplayer multiplayer={multiplayer} position={state.player} /> : null}
            {avatarStyle ? <WildsLivingWorldHud player={state.player} world={livingWorld} /> : null}
            <div className="wilds-utility-cluster">
              <WildsAudioSettings
                onChange={presentation.setAudioSettings}
                onUnlock={() => { void presentation.unlockAudio(); }}
                ready={presentation.audioReady}
                settings={presentation.audioSettings}
              />
              <button aria-label="Open world map" className="wilds-map-trigger" onClick={() => setMapOpen(true)} title="Open world map" type="button">
                <Icons.globe aria-hidden="true" size={20} />
              </button>
            </div>

            {state.battle && ["player_turn", "capture_ready", "fled", "defeated"].includes(state.encounter.phase) ? (
              <WildsBattle
                battle={state.battle}
                inventory={state.inventory}
                onAction={(action) => dispatch({ type: "battle-action", action })}
                onDismiss={() => dispatch({ type: "dismiss-reveal" })}
              />
            ) : null}

            {!avatarStyle ? (
              <div className="wilds-avatar-select" role="dialog" aria-labelledby="wilds-avatar-title" aria-modal="true">
                <div className="wilds-avatar-select-card">
                  <span className="eyebrow">Your journey begins</span>
                  <h3 id="wilds-avatar-title">Choose your explorer</h3>
                  <p>You’ll see your explorer from behind as you walk, search, battle, and capture.</p>
                  <div className="wilds-avatar-options">
                    {(["female", "male"] as const).map((choice) => (
                      <button
                        key={choice}
                        className={`wilds-avatar-option ${choice}`}
                        onClick={() => {
                          setAvatarStyle(choice);
                          try { window.localStorage.setItem(WILDS_AVATAR_KEY, choice); } catch { /* selection remains active for this session */ }
                        }}
                        type="button"
                      >
                        <span className="wilds-avatar-preview" aria-hidden="true"><i /><b /><em /></span>
                        <strong>{choice === "female" ? "Female explorer" : "Male explorer"}</strong>
                        <small>Select and enter the Wilds</small>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}

            <div className="wilds-hud-top">
              <div className="wilds-player-chip">
                <span className="wilds-avatar">RZ</span>
                <div>
                  <strong>Wilds scout</strong>
                  <small>{state.worldRank} · {activeAsset?.manifest.name ?? activeCard.name} L{activeProgress.level}</small>
                  <span className="wilds-coordinate-badges" aria-label={`World coordinates X ${Math.round(state.player.x)}, Z ${Math.round(state.player.z)}`}>
                    <b>X {Math.round(state.player.x)}</b><b>Z {Math.round(state.player.z)}</b>
                  </span>
                </div>
              </div>
              <div className="wilds-resource-strip">
                <span>{state.cardXp} card XP</span>
                <span>{state.energy}% energy</span>
                <span>{state.challenge}% challenge</span>
                <span>{state.combo}x combo</span>
              </div>
            </div>

            <div className="wilds-mission-meter" aria-label={`${state.missionProgress}% mission progress`}>
              <strong>{state.missionProgress}%</strong>
              <span>mission</span>
            </div>

            <div className="runner-card runner-primary">
              <span className="runner-core" />
              <div>
                <strong>{state.encounter.phase === "hint" ? `Signal ${proximityLabel}` : "Discovery on"}</strong>
                <small>{state.encounter.phase === "hint" ? "Keep tapping around the clue." : "Tap terrain repeatedly to scan."}</small>
              </div>
            </div>

            {discoveryActive ? <div className={`wilds-search-reticle ${state.encounter.phase === "idle" ? "" : activeProximity}`} aria-live="polite">{proximityLabel}</div> : null}

            <div className="wilds-event-toast" aria-live="polite">
              {riftError || (activeLandmarkId ? `${currentLandmark?.name ?? "Landmark"} entrance awakened.` : state.lastEvent)}
            </div>
          </div>

          <WildsWorldControls
            activeAction={state.activeAction}
            activeCardName={activeCard.name}
            cameraHeading={cameraHeading}
            movementMode={movementMode}
            onInput={dispatch}
            onMission={() => dispatch({ type: "mission" })}
            onMovementModeChange={setMovementMode}
            onPulse={activatePulse}
            onRest={() => dispatch({ type: "rest" })}
            onTrain={() => dispatch({ type: "train", at: new Date().toISOString() })}
            pulse={visiblePulse}
          />
        </div>

        <WildsCommandDock items={commandItems} />
      </div>
      <WildsWorldMap
        currentPosition={state.player}
        discoveredLandmarkIds={discoveredLandmarkIds}
        guestId={multiplayer.guestId}
        missionProgress={state.missionProgress}
        onClose={() => setMapOpen(false)}
        onRift={riftTo}
        open={mapOpen}
        qualityProfile={qualityProfile}
        reducedMotion={reducedMotion}
        remotePlayers={multiplayer.remotePlayers}
        worldMastery={state.worldMastery}
        landmarkProgress={landmarkProgress}
        livingWorld={livingWorld.snapshot}
        ecologyKnowledge={state.ecologyKnowledge}
        bossKnowledge={state.bossKnowledge}
      />
      <WildsLandmarkExperience
        access={activeLandmarkId && activeLandmarkId !== "wayfinder-hollow" ? evaluateLandmarkAccess(WILDS_FLAGSHIP_LANDMARKS.find((item) => item.id === activeLandmarkId)!, landmarkProgress) : null}
        card={activeAsset}
        landmarkId={activeLandmarkId === "wayfinder-hollow" ? null : activeLandmarkId}
        onExit={() => setActiveLandmarkId(null)}
        onUnlock={(unlockId) => setLandmarkUnlocks((current) => {
          const next = Array.from(new Set([...current, unlockId])).slice(0, 64);
          try { window.localStorage.setItem(WILDS_ACHIEVEMENTS_KEY, JSON.stringify(next)); } catch { /* progression remains active for this session */ }
          return next;
        })}
      />
      <WildsSettlementExperience
        actorId={civicActorId}
        card={activeAsset}
        civic={civic}
        livingWorld={livingWorld.snapshot}
        onAudioCue={presentation.playCue}
        onCivicEvent={(event) => dispatch({ type: "record-civic-event", event })}
        onExit={() => setActiveLandmarkId(null)}
        open={activeLandmarkId === "wayfinder-hollow"}
        remotePlayers={multiplayer.remotePlayers}
        worldMode={settlementWorldMode}
      />
      <WildsEcologyExperience
        card={activeAsset}
        onExit={() => setActiveEcologySiteId(null)}
        onSubmit={async ({ siteId, amount }) => {
          const projection = await livingWorld.contributeEcology(siteId, state.player, amount);
          const admitted = projection.ecologySites[siteId];
          const cursor = projection.cursor;
          if (!admitted || !cursor || !activeAsset) throw new Error("wilds_ecology_contribution_receipt_missing");
          dispatch({
            type: "record-ecology-event",
            event: createWildsEcologyReceipt({
              actorId: civicActorId,
              siteId: admitted.id,
              familyId: admitted.familyId,
              kind: "activity.accepted",
              sourceEventId: cursor.eventId,
              occurredAt: cursor.pulse,
              canonicalRevision: projection.revision,
              mastery: amount,
              cardProofDigest: activeAsset.proof.digest
            })
          });
          presentation.playCue(ecologyAudioCue(admitted.phase === "aftermath" ? "resolved" : "step", admitted.familyId));
        }}
        open={Boolean(activeEcologySite)}
        participantCount={(activeEcologySite?.participantIds.length ?? 0) + 1}
        site={activeEcologySite}
        worldMode={settlementWorldMode}
      />
      <WildsRaidExperience
        boss={activeRaidBoss}
        busyIntent={raidBusyIntent}
        canonical={livingWorld.mode === "receiz_live"}
        cardName={activeAsset?.manifest.name ?? activeCard.name}
        connected={activeRaid?.connected ?? false}
        encounter={activeRaidEncounter}
        error={livingWorld.error || riftError || null}
        onAction={(intent) => {
          if (!activeRaid || !activeAsset || !activeRaidBoss || !activeRaidRoles) return;
          setRaidBusyIntent(intent);
          void livingWorld.actRaid(activeRaid.bossId, activeRaid.roundId, intent).then((projection) => {
            const boss = projection.bosses[activeRaid.bossId];
            const round = projection.raids[activeRaid.roundId];
            const cursor = projection.cursor;
            if (!boss || !round || !cursor) throw new Error("wilds_raid_receipt_missing");
            const encounter = round.encounter as WildsRaidEncounterState | undefined;
            const impact = encounter?.actions.at(-1)?.impact ?? 0;
            dispatch({
              type: "record-raid-event",
              event: createWildsRaidReceipt({
                actorId: civicActorId,
                bossId: boss.id,
                familyId: boss.familyId as WildsBossFamilyId,
                roundId: round.id,
                actionId: `action:${cursor.eventId}`,
                sourceEventId: cursor.eventId,
                kind: "action",
                role: activeRaidRoles.primary,
                placement: activeRaid.placement,
                contributionBand: impact >= 1_400 ? "legendary" : impact >= 900 ? "strong" : impact >= 400 ? "steady" : "light",
                result: boss.phase === "defeated" ? "victory" : "accepted",
                revision: projection.revision,
                occurredAt: cursor.pulse,
                cardProofDigest: activeAsset.proof.digest
              })
            });
            presentation.playCue(bossAudioCue(boss.phase === "defeated" ? "defeat" : boss.phase === "transforming" ? "transform" : boss.phase === "vulnerable" ? "vulnerable" : "action", boss.familyId as WildsBossFamilyId));
          }).catch((error) => setRiftError(error instanceof Error ? error.message : "wilds_raid_action_failed")).finally(() => setRaidBusyIntent(null));
        }}
        onClose={() => {
          if (!activeRaid) return;
          void livingWorld.retreatRaid(activeRaid.bossId, activeRaid.roundId).catch(() => undefined);
          if (raidReturnPosition) setState((current) => ({ ...current, player: raidReturnPosition }));
          setActiveRaid(null);
          setRaidReturnPosition(null);
        }}
        onLease={(status) => {
          if (!activeRaid) return;
          void livingWorld.leaseRaid(activeRaid.bossId, activeRaid.roundId, status).then(() => setActiveRaid((current) => current ? { ...current, connected: status === "connected" } : current)).catch((error) => setRiftError(error instanceof Error ? error.message : "wilds_raid_lease_failed"));
        }}
        onRetreat={() => {
          if (!activeRaid) return;
          void livingWorld.retreatRaid(activeRaid.bossId, activeRaid.roundId).finally(() => {
            if (raidReturnPosition) setState((current) => ({ ...current, player: raidReturnPosition }));
            setActiveRaid(null);
            setRaidReturnPosition(null);
          });
        }}
        open={Boolean(activeRaid && activeRaidBoss && activeRaidRound)}
        placement={activeRaid?.placement ?? "support"}
        raid={activeRaidRound}
        role={activeRaidRoles?.primary ?? "steward"}
      />
      <WildsCaptureReward asset={rewardAsset} onClose={() => {
        setRewardAsset(null);
        dispatch({ type: "dismiss-reveal" });
      }} />
      <WildsTransformation state={state} onInput={dispatch} />
      <WildsChildCeremony state={state} onInput={dispatch} />
    </section>
  );
}
