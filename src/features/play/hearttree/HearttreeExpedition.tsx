"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { PortableCardAsset } from "../portable-card";
import { emptyHearttreeCondition, projectHearttreeCard, type HearttreeCardCondition } from "./card-capability";
import type { HearttreeMortalConsent } from "./consequences";
import { generateHearttreeExpedition, type HearttreeExpeditionDefinition } from "./expedition-director";
import type { HearttreeReceipt } from "./receipt";
import { createHearttreeRuntime, stepHearttreeRuntime, type HearttreeInput, type HearttreeRuntimeState } from "./runtime";
import { hearttreeTranscript } from "./transcript";
import { HearttreeControls } from "./HearttreeControls";
import { HearttreeScene } from "./HearttreeScene";

type InputIntent = HearttreeInput extends infer Value ? Value extends HearttreeInput ? Omit<Value, "sequence" | "tick"> : never : never;
type WorldMode = "receiz_live" | "local_practice" | "connecting";

export function HearttreeExpedition({
  cards,
  conditions,
  guestId,
  initialSquadAssetIds,
  onExit,
  onReceipt,
  onSquadChange,
  onUnlock,
  worldMode
}: {
  cards: readonly PortableCardAsset[];
  conditions: Readonly<Record<string, HearttreeCardCondition>>;
  guestId: string;
  initialSquadAssetIds: readonly string[];
  onExit: () => void;
  onReceipt: (receipt: HearttreeReceipt) => void;
  onSquadChange: (assetIds: string[]) => void;
  onUnlock: (unlockId: string) => void;
  worldMode: WorldMode;
}) {
  const available = useMemo(() => cards.filter((card) => conditions[card.id]?.life !== "dead"), [cards, conditions]);
  const [selectedIds, setSelectedIds] = useState(() => initialSquadAssetIds.filter((id) => available.some((card) => card.id === id)).slice(0, 3));
  const [mortal, setMortal] = useState(false);
  const [mortalAcknowledged, setMortalAcknowledged] = useState(false);
  const [definition, setDefinition] = useState<HearttreeExpeditionDefinition | null>(null);
  const [runtime, setRuntime] = useState<HearttreeRuntimeState | null>(null);
  const [caption, setCaption] = useState("Choose one to three living cards. Every stat, ability, injury, and proof pin changes the expedition.");
  const [paused, setPaused] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publication, setPublication] = useState<"idle" | "canonical" | "practice" | "failed">("idle");
  const reducedMotion = useReducedMotion();
  const selectedCards = available.filter((card) => selectedIds.includes(card.id));
  const squad = useMemo(() => selectedCards.map((card) => projectHearttreeCard(card, conditions[card.id] ?? emptyHearttreeCondition(card.id))), [conditions, selectedCards]);

  const toggleCard = (assetId: string) => {
    const next = selectedIds.includes(assetId) ? selectedIds.filter((id) => id !== assetId) : selectedIds.length < 3 ? [...selectedIds, assetId] : selectedIds;
    if (!next.length) return;
    setSelectedIds(next);
    onSquadChange(next); // hearttree-select-squad is adopted by the owning reducer.
  };

  const begin = () => {
    if (!squad.length || (mortal && !mortalAcknowledged)) return;
    const nextDefinition = generateHearttreeExpedition({
      seed: `hearttree-ui:${squad.map((card) => card.proofDigest).join(":")}:${mortal}`,
      squad,
      history: [],
      mortal
    });
    setDefinition(nextDefinition);
    setRuntime(createHearttreeRuntime(nextDefinition, squad));
    setCaption(`Entered ${nextDefinition.chambers[0]!.name}. Navigate to the living objective; timing and card choice determine the outcome.`);
  };

  const onIntent = useCallback((intent: InputIntent) => {
    if (paused) return;
    setRuntime((current) => {
      if (!current) return current;
      try {
        const next = stepHearttreeRuntime(current, { ...intent, sequence: current.sequence + 1, tick: current.tick + 1 } as HearttreeInput);
        const last = next.events.at(-1);
        setCaption(last?.detail ?? `${intent.kind} resolved from the active card's real capability.`);
        return next;
      } catch (error) {
        setCaption(error instanceof Error ? readableError(error.message) : "The Hearttree rejected that action.");
        return current;
      }
    });
  }, [paused]);

  useEffect(() => {
    if (!runtime || runtime.phase === "result" || runtime.phase === "extracted" || runtime.phase === "defeated") return;
    const keydown = (event: KeyboardEvent) => {
      if (event.repeat && !["w", "a", "s", "d", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)) return;
      const moves: Record<string, { x: number; z: number }> = { w: { x: 0, z: -1 }, ArrowUp: { x: 0, z: -1 }, s: { x: 0, z: 1 }, ArrowDown: { x: 0, z: 1 }, a: { x: -1, z: 0 }, ArrowLeft: { x: -1, z: 0 }, d: { x: 1, z: 0 }, ArrowRight: { x: 1, z: 0 } };
      if (moves[event.key]) onIntent({ kind: "move", vector: moves[event.key]! });
      else if (event.key === " ") onIntent({ kind: "dodge", vector: { x: 1, z: 0 }, timingOffsetMs: 0 });
      else if (event.key.toLowerCase() === "e") onIntent({ kind: "interact" });
      else if (event.key.toLowerCase() === "q") onIntent({ kind: "guard", timingOffsetMs: 0 });
      else return;
      event.preventDefault();
    };
    window.addEventListener("keydown", keydown);
    return () => window.removeEventListener("keydown", keydown);
  }, [onIntent, runtime]);

  const publish = async () => {
    if (!runtime || !definition || publishing) return;
    setPublishing(true);
    try {
      const mortalConsent: HearttreeMortalConsent | null = mortal ? {
        schema: "receiz.wilds.hearttree_mortal_consent.v1",
        expeditionId: definition.id,
        accepted: true,
        consequence: "permanent-death",
        squadPins: definition.squadPins,
        acceptedAt: new Date().toISOString()
      } : null;
      const response = await fetch("/api/wilds/hearttree", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          guestId,
          idempotencyKey: `hearttree-${hearttreeTranscript(runtime).digest.slice(7, 31)}`,
          cards: selectedCards,
          priorConditions: Object.fromEntries(selectedCards.map((card) => [card.id, conditions[card.id] ?? emptyHearttreeCondition(card.id)])),
          definition,
          transcript: hearttreeTranscript(runtime),
          mortalConsent
        })
      });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.error ?? "hearttree_publication_failed");
      if (result.receipt) {
        onReceipt(result.receipt as HearttreeReceipt);
        setPublication("canonical");
      } else {
        setPublication("practice");
      }
      if (runtime.terminalReason === "completed") onUnlock("hearttree-awakened");
      setCaption(result.receipt ? "Canonical Receiz receipt adopted. Every consequence is now permanent." : "Practice replay verified. No XP, injury, upgrade, or death was adopted.");
    } catch {
      setPublication("failed");
      setCaption("Publication failed. No reward, injury, upgrade, or death was adopted.");
    } finally {
      setPublishing(false);
    }
  };

  if (!runtime || !definition) return <section className="hearttree-expedition hearttree-squad-gate" aria-label="Hearttree squad gate">
    <header><div><small>Proof-pinned expedition</small><h3>Choose the cards that will shape the Hearttree</h3></div><button aria-label="Return to world" onClick={onExit}>×</button></header>
    <div className="hearttree-squad-list">{available.map((card) => {
      const condition = conditions[card.id] ?? emptyHearttreeCondition(card.id);
      const capability = projectHearttreeCard(card, condition);
      const selected = selectedIds.includes(card.id);
      return <button aria-pressed={selected} className={selected ? "is-selected" : ""} key={card.id} onClick={() => toggleCard(card.id)}>
        <span style={{ background: card.manifest.variant.traits.palette.primary }}>{card.manifest.name.slice(0, 2).toUpperCase()}</span>
        <div><strong>{card.manifest.name}</strong><small>{capability.element} · {capability.roles.join(" / ")}</small><em>{capability.abilityNames.join(" · ")}</em><code>{card.proof.digest.slice(7, 21)}</code></div>
        <b>{capability.stats.power} PWR<br />{capability.stats.speed} SPD</b>
      </button>;
    })}</div>
    <div className="hearttree-risk-panel">
      <label><input checked={mortal} onChange={(event) => { setMortal(event.target.checked); setMortalAcknowledged(false); }} type="checkbox" /> Enter the optional Mortal Heart</label>
      {mortal ? <label className="is-mortal"><input checked={mortalAcknowledged} onChange={(event) => setMortalAcknowledged(event.target.checked)} type="checkbox" /> I understand permanent-death is irreversible for: {selectedCards.map((card) => card.manifest.name).join(", ")}</label> : <p>Standard expeditions can injure cards, but cannot kill them.</p>}
    </div>
    <p className="hearttree-caption" aria-live="polite">{caption}</p>
    <footer><span>{selectedIds.length}/3 cards · {worldMode === "receiz_live" ? "Canonical Receiz world" : "Local practice"}</span><button disabled={!selectedIds.length || (mortal && !mortalAcknowledged)} onClick={begin}>Pin squad and enter</button></footer>
  </section>;

  const active = runtime.cards[runtime.activeAssetId]!;
  const terminal = ["result", "extracted", "defeated"].includes(runtime.phase);
  return <section className="hearttree-expedition is-active" aria-label="Hearttree expedition">
    <HearttreeScene cards={selectedCards} definition={definition} reducedMotion={reducedMotion} runtime={runtime} />
    <div className="hearttree-hud">
      <div className="hearttree-objective"><small>{runtime.phase} · chamber {runtime.chamberIndex + 1}/4</small><strong>{definition.chambers[runtime.chamberIndex]?.name ?? "Expedition result"}</strong><span>{runtime.objective.complete ? "Objective complete" : `Reach ${runtime.objective.id.split(":").at(-1)}`}</span></div>
      <div className="hearttree-vitals"><span><i style={{ width: `${active.health / active.maxHealth * 100}%` }} />Health {active.health}/{active.maxHealth}</span><span><i style={{ width: `${active.stamina}%` }} />Stamina {active.stamina}</span></div>
      <button className="hearttree-pause" aria-label={paused ? "Resume expedition" : "Pause expedition"} onClick={() => setPaused((value) => !value)}>{paused ? "▶" : "Ⅱ"}</button>
    </div>
    <p className="hearttree-caption" aria-live="polite">{caption}</p>
    {!terminal && !paused ? <HearttreeControls cards={selectedCards} onIntent={onIntent} runtime={runtime} squad={squad} /> : null}
    {paused ? <div className="hearttree-overlay"><strong>Expedition paused</strong><button onClick={() => setPaused(false)}>Resume</button><button onClick={onExit}>Return to world</button></div> : null}
    {terminal ? <div className="hearttree-overlay result"><small>{runtime.terminalReason}</small><strong>{runtime.phase === "defeated" ? "The squad fell" : runtime.phase === "extracted" ? "Extraction secured" : "The Heart remembers"}</strong><p>{publication === "canonical" ? "Canonical receipt adopted." : publication === "practice" ? "Practice result—no persistent consequences." : "Result is pending authoritative replay and publication."}</p><button disabled={publishing || publication === "canonical" || publication === "practice"} onClick={publish}>{publishing ? "Replaying…" : worldMode === "receiz_live" ? "Verify and seal result" : "Verify practice replay"}</button><button onClick={onExit}>Return to world</button></div> : null}
  </section>;
}

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return reduced;
}

function readableError(error: string) {
  if (error.includes("out_of_range")) return "Move closer to the living objective before attuning.";
  if (error.includes("cooldown")) return "That exact card ability is still recovering.";
  if (error.includes("stamina")) return "The active card needs stamina. Switch cards or create breathing room.";
  if (error.includes("master_active")) return "The Root Master still stands. Read its guard and use the right card ability.";
  return error.replaceAll("hearttree_", "").replaceAll("_", " ");
}
