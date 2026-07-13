"use client";

import dynamic from "next/dynamic";
import { Icons } from "@/components/icons";
import { Button, StatusPill } from "@/components/ui";
import { cx } from "@/lib/utils";
import {
  applyWildsInput,
  canDiscover,
  discoveredCards,
  initialPlayState,
  missionCards,
  nearestCreature,
  restorePlayState,
  serializePlayState,
  selectedCard,
  type PlayState,
  type WildsInput
} from "@/features/play/game-state";
import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import type { PortableCardAsset } from "@/features/play/portable-card";
import { WildsCaptureReward } from "@/features/play/WildsCaptureReward";
import { WildsInventory } from "@/features/play/WildsInventory";

const WILDS_SAVE_KEY = "receiz:wilds:save:v2";

const WildsWorldCanvas = dynamic(
  () => import("@/features/play/WildsWorldCanvas").then((mod) => mod.WildsWorldCanvas),
  {
    ssr: false,
    loading: () => <div className="wilds-canvas-fallback" aria-label="Loading 3D world" />
  }
);

function WildsTrackpad({ onInput }: { onInput: (input: WildsInput) => void }) {
  const vectorRef = useRef({ x: 0, z: 0 });
  const [active, setActive] = useState(false);
  const [knob, setKnob] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!active) return;
    const timer = window.setInterval(() => {
      const vector = vectorRef.current;
      if (Math.hypot(vector.x, vector.z) >= 0.08) {
        onInput({ type: "move-vector", x: vector.x, z: vector.z });
      }
    }, 45);
    return () => window.clearInterval(timer);
  }, [active, onInput]);

  const updateVector = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const radius = Math.max(1, Math.min(rect.width, rect.height) * 0.42);
    const rawX = event.clientX - (rect.left + rect.width / 2);
    const rawY = event.clientY - (rect.top + rect.height / 2);
    const magnitude = Math.hypot(rawX, rawY);
    const clampScale = magnitude > radius ? radius / magnitude : 1;
    const x = rawX * clampScale;
    const y = rawY * clampScale;
    vectorRef.current = { x: x / radius, z: y / radius };
    setKnob({ x, y });
  };

  const release = (event: ReactPointerEvent<HTMLButtonElement>) => {
    try {
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
    } catch {
      // Pointer capture is an enhancement; releasing still stops movement.
    }
    vectorRef.current = { x: 0, z: 0 };
    setKnob({ x: 0, y: 0 });
    setActive(false);
  };

  return (
    <button
      aria-label="Movement trackpad. Hold and drag in any direction to travel."
      className={cx("wilds-trackpad", active && "active")}
      onPointerCancel={release}
      onPointerDown={(event) => {
        updateVector(event);
        setActive(true);
        try {
          event.currentTarget.setPointerCapture(event.pointerId);
        } catch {
          // Some embedded browsers do not expose pointer capture.
        }
      }}
      onPointerMove={(event) => {
        let captured = false;
        try {
          captured = event.currentTarget.hasPointerCapture(event.pointerId);
        } catch {
          captured = false;
        }
        if (active || captured) updateVector(event);
      }}
      onPointerUp={release}
      title="Hold and drag to move"
      type="button"
    >
      <span className="wilds-trackpad-ring" />
      <span className="wilds-trackpad-knob" style={{ transform: `translate(${knob.x}px, ${knob.y}px)` }} />
    </button>
  );
}

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
  const activeMission = missionCards[state.completedMissionIds.length % missionCards.length];
  const activeCard = selectedCard(state);
  const deckCards = discoveredCards(state);
  const nearest = nearestCreature(state);
  const discoveryReady = canDiscover(state);
  const activeProgress = state.companionProgress[activeCard.id] ?? { level: 1, xp: 0, bond: 0 };

  useEffect(() => {
    setState(restorePlayState(window.localStorage.getItem(WILDS_SAVE_KEY)));
    setSaveRestored(true);
  }, []);

  useEffect(() => {
    if (!saveRestored) return;
    try {
      window.localStorage.setItem(WILDS_SAVE_KEY, serializePlayState(state));
    } catch {
      // The game remains playable when browser persistence is unavailable.
    }
  }, [saveRestored, state]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.matches("input, textarea, select, button, [contenteditable='true']")) return;
      const key = event.key.toLowerCase();
      const input: WildsInput | null =
        key === "arrowup" || key === "w" ? { type: "move", direction: "north" }
          : key === "arrowdown" || key === "s" ? { type: "move", direction: "south" }
            : key === "arrowleft" || key === "a" ? { type: "move", direction: "west" }
              : key === "arrowright" || key === "d" ? { type: "move", direction: "east" }
                : key === " " ? { type: "discover" }
                  : key === "t" ? { type: "train" }
                    : key === "m" ? { type: "mission" }
                      : key === "r" ? { type: "rest" }
                        : null;
      if (!input) return;
      event.preventDefault();
      setState((current) => {
        const effectiveInput: WildsInput = input.type === "discover"
          ? {
              type: "capture",
              encounterId: `${nearestCreature(current).card.id}:${Math.round(current.player.x * 100)}:${Math.round(current.player.z * 100)}:${Date.now()}`,
              capturedAt: new Date().toISOString(),
              ownerReceizId
            }
          : input;
        const next = applyWildsInput(current, effectiveInput);
        if (next.inventory.length > current.inventory.length) setRewardAsset(next.inventory.at(-1) ?? null);
        if (!current.completed && next.completed) onComplete?.(next.beans);
        return next;
      });
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onComplete, ownerReceizId]);

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
    setState((current) => {
      const effectiveInput: WildsInput = input.type === "discover"
        ? {
            type: "capture",
            encounterId: `${nearestCreature(current).card.id}:${Math.round(current.player.x * 100)}:${Math.round(current.player.z * 100)}:${Date.now()}`,
            capturedAt: new Date().toISOString(),
            ownerReceizId
          }
        : input;
      const next = applyWildsInput(current, effectiveInput);
      if (next.inventory.length > current.inventory.length) setRewardAsset(next.inventory.at(-1) ?? null);
      if (!current.completed && next.completed) {
        onComplete?.(next.beans);
      }
      return next;
    });
  };

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
          <div className="wilds-stage" aria-label="Receiz Wilds playable 3D world">
            <WildsWorldCanvas state={state} onInput={dispatch} />

            <div className="wilds-hud-top">
              <div className="wilds-player-chip">
                <span className="wilds-avatar">RZ</span>
                <div>
                  <strong>Wilds scout</strong>
                  <small>{state.worldRank} · {activeCard.name} L{activeProgress.level} · X{Math.round(state.player.x)} Z{Math.round(state.player.z)}</small>
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
                <strong>{discoveryReady ? "Wild companion nearby" : "Active companion card"}</strong>
                <small>{discoveryReady ? `${nearest.card.name} can join your deck.` : activeCard.role}</small>
              </div>
            </div>

            <div className="wilds-event-toast" aria-live="polite">
              {state.lastEvent}
            </div>
          </div>

          <div className="wilds-screen-controls" aria-label="World controls">
            <div className="wilds-screen-actions" aria-label="Explore actions">
              <button
                className={cx("wilds-action", state.activeAction === "explore" && "active", discoveryReady && "ready")}
                onClick={() => dispatch({ type: "discover" })}
                aria-label={discoveryReady ? `Discover ${nearest.card.name}` : "Discover companion"}
                title={discoveryReady ? `Discover ${nearest.card.name}` : "Discover companion"}
                type="button"
              >
                <Icons.game size={20} />
              </button>
              <button
                className="wilds-action"
                onClick={() => dispatch({ type: "rest" })}
                aria-label="Make camp and recover energy"
                title="Camp: recover energy"
                type="button"
              >
                <Icons.home size={20} />
              </button>
            </div>

            <WildsTrackpad onInput={dispatch} />

            <div className="wilds-screen-actions" aria-label="Progression actions">
              <button
                className={cx("wilds-action", state.activeAction === "train" && "active")}
                onClick={() => dispatch({ type: "train" })}
                aria-label={`Train ${activeCard.name}`}
                title={`Train ${activeCard.name}`}
                type="button"
              >
                <Icons.sparkle size={20} />
              </button>
              <button
                className={cx("wilds-action", state.activeAction === "mission" && "active")}
                onClick={() => dispatch({ type: "mission" })}
                aria-label="Run world mission"
                title="Run world mission"
                type="button"
              >
                <Icons.trophy size={20} />
              </button>
            </div>
          </div>
        </div>

        <aside className="wilds-command-panel" aria-label="Deck and mission strategy">
          <details className="wilds-mission-card">
            <summary>
              <span>
                <small>World mission</small>
                <strong>{activeMission.title}</strong>
              </span>
              <b>{state.missionProgress}%</b>
              <Icons.chevronDown aria-hidden="true" size={18} />
            </summary>
            <div className="wilds-mission-details">
              <p>{activeMission.requirement}</p>
              <div className="wilds-progress" aria-label={`${state.missionProgress}% mission progress`}>
                <span style={{ width: `${state.missionProgress}%` }} />
              </div>
              <b>{activeMission.reward}</b>
            </div>
          </details>

          <div className="wilds-reward-card">
            <span>Portable reward</span>
            {state.rewardCards.length ? (
              state.rewardCards.map((reward) => (
                <div key={reward.id}>
                  <strong>{reward.title}</strong>
                  <p>{reward.businessUse}</p>
                  <b>{reward.value}</b>
                </div>
              ))
            ) : (
              <div>
                <strong>Locked merchant card</strong>
                <p>Clear the mission to mint a card businesses can map to coupons, access, perks, or custom proof logic.</p>
                <b>{Math.max(0, 100 - state.missionProgress)}% left</b>
              </div>
            )}
          </div>

          <div className="wilds-squad-list" aria-label="Collected companion cards">
            {deckCards.map((card) => (
              <button
                aria-pressed={state.selectedCardId === card.id}
                className="wilds-squad-card"
                key={card.id}
                onClick={() => dispatch({ type: "select-card", cardId: card.id })}
                type="button"
              >
                <span style={{ background: card.color }}>{card.name.slice(0, 2).toUpperCase()}</span>
                <div>
                  <strong>{card.name}</strong>
                  <small>Level {state.companionProgress[card.id]?.level ?? 1} · Bond {state.companionProgress[card.id]?.bond ?? 0}</small>
                </div>
                <b>{card.power}</b>
                <div className="wilds-mini-charge" aria-label={`${card.power}% power`}>
                  <i style={{ width: `${card.power}%` }} />
                </div>
              </button>
            ))}
          </div>

          <div className="wilds-economy-grid">
            <div>
              <span>Deck</span>
              <strong>{deckCards.length}/4</strong>
            </div>
            <div>
              <span>Near</span>
              <strong>{nearest.card.name}</strong>
            </div>
            <div>
              <span>Titan Gate</span>
              <strong>{state.bossUnlocked ? "Open" : "Locked"}</strong>
            </div>
          </div>

          <Button className="wilds-reset" variant="outline" onClick={() => dispatch({ type: "reset" })}>
            Reset world
          </Button>
        </aside>
      </div>
      <WildsInventory state={state} onInput={dispatch} onListAsset={onListAsset} />
      <WildsCaptureReward asset={rewardAsset} onClose={() => setRewardAsset(null)} />
    </section>
  );
}
