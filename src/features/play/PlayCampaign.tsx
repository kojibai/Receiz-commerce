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
  selectedCard,
  type MoveDirection,
  type PlayState,
  type WildsInput
} from "@/features/play/game-state";
import { useState } from "react";

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
  const [state, setState] = useState(initialPlayState);
  const activeMission = missionCards[state.streak % missionCards.length];
  const activeCard = selectedCard(state);
  const deckCards = discoveredCards(state);
  const nearest = nearestCreature(state);
  const discoveryReady = canDiscover(state);

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
                  <small>{activeCard.name} leading</small>
                </div>
              </div>
              <div className="wilds-resource-strip">
                <span>{state.cardXp} card XP</span>
                <span>{state.energy}% energy</span>
                <span>{state.challenge}% challenge</span>
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

          <div className="wilds-control-deck" aria-label="World controls">
            <div className="wilds-dpad">
              {moveButtons.map(({ direction, label, Icon }) => (
                <button
                  aria-label={label}
                  className={`wilds-move-${direction}`}
                  key={direction}
                  onClick={() => dispatch({ type: "move", direction })}
                  type="button"
                >
                  <Icon size={20} />
                </button>
              ))}
            </div>

            <div className="wilds-action-dock" aria-label="Game actions">
              <button
                className={cx("wilds-action", state.activeAction === "explore" && "active", discoveryReady && "ready")}
                onClick={() => dispatch({ type: "discover" })}
                type="button"
              >
                <Icons.game size={20} />
                <span>
                  <strong>Discover</strong>
                  <small>{discoveryReady ? nearest.card.name : "Move closer"}</small>
                </span>
              </button>
              <button
                className={cx("wilds-action", state.activeAction === "train" && "active")}
                onClick={() => dispatch({ type: "train" })}
                type="button"
              >
                <Icons.sparkle size={20} />
                <span>
                  <strong>Train</strong>
                  <small>{activeCard.name}</small>
                </span>
              </button>
              <button
                className={cx("wilds-action", state.activeAction === "mission" && "active")}
                onClick={() => dispatch({ type: "mission" })}
                type="button"
              >
                <Icons.trophy size={20} />
                <span>
                  <strong>Mission</strong>
                  <small>Play deck</small>
                </span>
              </button>
            </div>
          </div>
        </div>

        <aside className="wilds-command-panel" aria-label="Deck and mission strategy">
          <div className="wilds-mission-card">
            <span>World mission</span>
            <strong>{activeMission.title}</strong>
            <p>{activeMission.requirement}</p>
            <div className="wilds-progress" aria-label={`${state.missionProgress}% mission progress`}>
              <span style={{ width: `${state.missionProgress}%` }} />
            </div>
            <b>{activeMission.reward}</b>
          </div>

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
                  <small>{card.businessLogic}</small>
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
              <span>Reward</span>
              <strong>{state.rewardCards.length ? "Owned" : "Locked"}</strong>
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
