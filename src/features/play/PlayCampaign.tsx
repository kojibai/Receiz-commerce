"use client";

import { useState } from "react";
import { Icons } from "@/components/icons";
import { Button, StatusPill } from "@/components/ui";
import { cx } from "@/lib/utils";
import { gameTiles, initialPlayState, movePlayer } from "@/features/play/game-state";

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

  const handleMove = (index: number) => {
    setState((current) => {
      const next = movePlayer(current, index);
      if (!current.completed && next.completed) {
        onComplete?.(next.beans);
      }
      return next;
    });
  };

  return (
    <section className="panel play-panel" id="play">
      <div className="play-header">
        <div>
          <h2>
            <span>Play:</span> {campaignName}
          </h2>
          <p>Collect beans, unlock perks, earn rewards.</p>
        </div>
        <div className="play-stats">
          <StatusPill tone="pink">🔥 {state.streak}x streak</StatusPill>
          <StatusPill tone="neutral">☕ {state.beans} beans</StatusPill>
          <StatusPill tone="gold">🏆 Level {state.level}</StatusPill>
        </div>
      </div>

      <div className="game-grid" role="grid" aria-label={`${campaignName} reward game`}>
        {gameTiles.map((tile, index) => {
          const isPlayer = index === state.playerIndex;
          const collected = state.collected.includes(tile.id);
          return (
            <button
              aria-label={
                isPlayer
                  ? "Current player tile"
                  : tile.kind === "proof"
                    ? "Seal bonus tile"
                    : `${tile.kind} tile`
              }
              className={cx("game-tile", `tile-${tile.kind}`, isPlayer && "tile-player")}
              key={tile.id}
              onClick={() => handleMove(index)}
              type="button"
            >
              {isPlayer ? "🧍" : tile.kind === "bean" && !collected ? "🫘" : null}
              {!isPlayer && tile.kind === "reward" ? "🎁" : null}
              {!isPlayer && tile.kind === "mug" ? "☕" : null}
              {!isPlayer && tile.kind === "bag" ? "🛍" : null}
              {!isPlayer && tile.kind === "leaf" ? "🍃" : null}
              {!isPlayer && tile.kind === "proof" ? "SEAL" : null}
              {!isPlayer && tile.kind === "locked" ? <Icons.lock size={17} /> : null}
              {!isPlayer && tile.kind === "bonus" ? tile.label : null}
            </button>
          );
        })}
      </div>

      <div className="game-legend">
        <span>
          <i className="legend-you" /> You
        </span>
        <span>🫘 Collectible</span>
        <span>🎁 Reward</span>
        <span>
          <Icons.lock size={14} /> Locked
        </span>
        <Button variant="outline" onClick={() => setState(initialPlayState)}>
          Reset play
        </Button>
      </div>
    </section>
  );
}
