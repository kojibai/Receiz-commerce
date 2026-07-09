"use client";

import { useState } from "react";
import { Icons } from "@/components/icons";
import { Button, StatusPill } from "@/components/ui";
import { cx } from "@/lib/utils";
import {
  arenaNodes,
  initialPlayState,
  missionCards,
  runGameAction,
  squadCards,
  type ArenaNodeKind,
  type GameAction
} from "@/features/play/game-state";

const actionButtons: Array<{
  id: GameAction;
  label: string;
  meta: string;
  Icon: typeof Icons.game;
}> = [
  { id: "explore", label: "Explore", meta: "Find wilds", Icon: Icons.game },
  { id: "train", label: "Train", meta: "Power card", Icon: Icons.sparkle },
  { id: "mission", label: "Mission", meta: "Play deck", Icon: Icons.trophy }
];

const nodeIcons: Record<ArenaNodeKind, typeof Icons.seal> = {
  proof: Icons.seal,
  boost: Icons.sparkle,
  market: Icons.store,
  reward: Icons.gift,
  boss: Icons.trophy,
  shield: Icons.lock
};

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

  const triggerAction = (action: GameAction) => {
    setState((current) => {
      const next = runGameAction(current, action);
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
          <p>{campaignName} becomes a branded 3D creature world where players discover companions, collect cards, run missions, and unlock merchant rewards.</p>
        </div>
        <div className="play-stats wilds-stat-strip" aria-label="Current run stats">
          <StatusPill tone="pink">{state.streak}x streak</StatusPill>
          <StatusPill tone="neutral">{state.beans} beans</StatusPill>
          <StatusPill tone="gold">Level {state.level}</StatusPill>
        </div>
      </div>

      <div className="wilds-shell">
        <div className="wilds-world">
          <div className="wilds-screen" role="region" aria-label="Receiz Wilds 3D creature collection world render">
            <div className="wilds-skyline" aria-hidden="true">
              <span />
              <span />
              <span />
              <span />
              <span />
            </div>

            <div className="wilds-hud-top">
              <div className="wilds-player-chip">
                <span className="wilds-avatar">RZ</span>
                <div>
                  <strong>Wilds scout</strong>
                  <small>Card deck ready</small>
                </div>
              </div>
              <div className="wilds-resource-strip">
                <span>{state.proofShards} card XP</span>
                <span>{state.energy}% energy</span>
                <span>{state.heat}% challenge</span>
              </div>
            </div>

            <div className="wilds-combo-meter" aria-label={`${state.combo} combo`}>
              <strong>{state.combo}</strong>
              <span>combo</span>
            </div>

            <div className="wilds-lanes" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>

            {arenaNodes.map((node) => {
              const NodeIcon = nodeIcons[node.kind];

              return (
                <button
                  aria-label={`${node.label} ${node.value}`}
                  className={cx("arena-node", `arena-node-${node.kind}`, node.active && "active")}
                  key={node.id}
                  onClick={() => triggerAction(node.kind === "boss" ? "mission" : node.kind === "boost" ? "train" : "explore")}
                  style={{ left: `${node.x}%`, top: `${node.y}%` }}
                  type="button"
                >
                  <span>
                    <NodeIcon size={18} />
                  </span>
                  <strong>{node.label}</strong>
                  <small>{node.value}</small>
                </button>
              );
            })}

            <div className="runner-card runner-primary">
              <span className="runner-core" />
              <div>
                <strong>Active companion card</strong>
                <small>Mintcub can heal perks during missions</small>
              </div>
            </div>
            <div className="runner-card runner-support">
              <Icons.seal size={17} />
              <span>Portable reward card armed</span>
            </div>
          </div>

          <div className="wilds-action-dock" aria-label="Game actions">
            {actionButtons.map(({ id, label, meta, Icon }) => (
              <button
                className={cx("wilds-action", state.activeAction === id && "active")}
                key={id}
                onClick={() => triggerAction(id)}
                type="button"
              >
                <Icon size={20} />
                <span>
                  <strong>{label}</strong>
                  <small>{meta}</small>
                </span>
              </button>
            ))}
          </div>
        </div>

        <aside className="wilds-command-panel" aria-label="Run strategy">
          <div className="wilds-mission-card">
            <span>World mission</span>
            <strong>{activeMission.title}</strong>
            <p>{activeMission.reward}</p>
            <div className="wilds-progress" aria-label={`${activeMission.progress}% event progress`}>
              <span style={{ width: `${activeMission.progress}%` }} />
            </div>
          </div>

          <div className="wilds-squad-list">
            {squadCards.map((card) => (
              <div className="wilds-squad-card" key={card.id}>
                <span>{card.name.slice(0, 2).toUpperCase()}</span>
                <div>
                  <strong>{card.name}</strong>
                  <small>{card.role}</small>
                </div>
                <b>{card.power}</b>
                <div className="wilds-mini-charge" aria-label={`${card.charge}% charged`}>
                  <i style={{ width: `${card.charge}%` }} />
                </div>
              </div>
            ))}
          </div>

          <div className="wilds-economy-grid">
            <div>
              <span>Next spawn</span>
              <strong>00:18</strong>
            </div>
            <div>
              <span>Card odds</span>
              <strong>42%</strong>
            </div>
            <div>
              <span>Reward</span>
              <strong>+312</strong>
            </div>
          </div>

          <Button className="wilds-reset" variant="outline" onClick={() => setState(initialPlayState)}>
            Reset world
          </Button>
        </aside>
      </div>
    </section>
  );
}
