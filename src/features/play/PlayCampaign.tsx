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
  type MoveDirection,
  type PlayState,
  type WildsInput
} from "@/features/play/game-state";
import { useEffect, useState } from "react";

const WILDS_SAVE_KEY = "receiz:wilds:save:v2";

const WildsWorldCanvas = dynamic(
  () => import("@/features/play/WildsWorldCanvas").then((mod) => mod.WildsWorldCanvas),
  {
    ssr: false,
    loading: () => <div className="wilds-canvas-fallback" aria-label="Loading 3D world" />
  }
);

const moveButtons: Array<{
  direction: MoveDirection;
  label: string;
  Icon: typeof Icons.chevronUp;
}> = [
  { direction: "north", label: "Move north", Icon: Icons.chevronUp },
  { direction: "west", label: "Move west", Icon: Icons.chevronLeft },
  { direction: "east", label: "Move east", Icon: Icons.chevronRight },
  { direction: "south", label: "Move south", Icon: Icons.chevronDown }
];

export function PlayCampaign({
  campaignName = "Reward Challenge",
  enabled,
  onComplete
}: {
  campaignName?: string;
  enabled: boolean;
  onComplete?: (beans: number) => void;
}) {
  const [state, setState] = useState(() => typeof window === "undefined" ? initialPlayState : restorePlayState(window.localStorage.getItem(WILDS_SAVE_KEY)));
  const activeMission = missionCards[state.completedMissionIds.length % missionCards.length];
  const activeCard = selectedCard(state);
  const deckCards = discoveredCards(state);
  const nearest = nearestCreature(state);
  const discoveryReady = canDiscover(state);
  const activeProgress = state.companionProgress[activeCard.id] ?? { level: 1, xp: 0, bond: 0 };

  useEffect(() => {
    try {
      window.localStorage.setItem(WILDS_SAVE_KEY, serializePlayState(state));
    } catch {
      // The game remains playable when browser persistence is unavailable.
    }
  }, [state]);

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
        const next = applyWildsInput(current, input);
        if (!current.completed && next.completed) onComplete?.(next.beans);
        return next;
      });
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onComplete]);

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
      const next = applyWildsInput(current, input);
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
                  <small>{state.worldRank} · {activeCard.name} L{activeProgress.level}</small>
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

            <div className="wilds-dpad">
              {moveButtons.map(({ direction, label, Icon }) => (
                <button
                  aria-label={label}
                  className={`wilds-move-${direction}`}
                  key={direction}
                  onClick={() => dispatch({ type: "move", direction })}
                  type="button"
                >
                  <Icon size={18} />
                </button>
              ))}
            </div>

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
    </section>
  );
}
