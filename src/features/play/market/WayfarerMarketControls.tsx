"use client";

import type { MarketInput, MarketRuntimeState } from "./runtime";

export type MarketControlIntent = MarketInput extends infer Value
  ? Value extends MarketInput ? Omit<Value, "sequence" | "tick"> : never
  : never;

export function WayfarerMarketControls({ disabled, onIntent, state }: {
  disabled?: boolean;
  onIntent: (intent: MarketControlIntent) => void;
  state: MarketRuntimeState;
}) {
  const active = state.squad.find((card) => card.assetId === state.activeAssetId)!;
  const objective = state.objectives.find((value) => !value.complete);
  const verb = objective?.requiredVerb ?? [...active.verbs][0] ?? "inspect";
  const ability = active.abilities[0]?.name;
  return <div aria-label="Wayfarer controls" className="market-mobile-controls">
    <div className="market-move-pad">
      <button aria-label="Move forward" className="market-control move-north" disabled={disabled} onClick={() => onIntent({ kind: "move", vector: { x: 0, z: -1 } })} type="button">▲</button>
      <button aria-label="Move left" className="market-control" disabled={disabled} onClick={() => onIntent({ kind: "move", vector: { x: -1, z: 0 } })} type="button">◀</button>
      <button aria-label="Move back" className="market-control" disabled={disabled} onClick={() => onIntent({ kind: "move", vector: { x: 0, z: 1 } })} type="button">▼</button>
      <button aria-label="Move right" className="market-control" disabled={disabled} onClick={() => onIntent({ kind: "move", vector: { x: 1, z: 0 } })} type="button">▶</button>
    </div>
    <div className="market-action-pad">
      <button className="market-control is-guard" disabled={disabled || state.phase !== "execution"} onClick={() => onIntent({ kind: "guard", timingOffsetMs: 0 })} type="button"><b>Q</b><span>Guard</span></button>
      <button className="market-control is-dodge" disabled={disabled || state.phase !== "execution"} onClick={() => onIntent({ kind: "dodge", vector: { x: 1, z: 0 }, timingOffsetMs: 0 })} type="button"><b>␣</b><span>Dodge</span></button>
      <button className="market-control is-action" disabled={disabled || state.phase !== "execution" || !objective} onClick={() => onIntent({ kind: "role-action", verb, timingOffsetMs: 0 })} type="button"><b>E</b><span>{verb.replaceAll("-", " ")}</span></button>
      <button className="market-control is-ability" disabled={disabled || state.phase !== "execution" || !ability} onClick={() => ability && onIntent({ kind: "ability", abilityName: ability, timingOffsetMs: 0 })} type="button"><b>R</b><span>{ability ?? "Ability"}</span></button>
    </div>
  </div>;
}
