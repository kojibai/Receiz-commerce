"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Icons } from "@/components/icons";
import type { AdventureCardCondition } from "../adventure/card-condition";
import type { PortableCardAsset } from "../portable-card";
import type { WildsWorldEcologyProjection } from "../wilds-world-state";
import type { WildsSettlementWorldMode } from "../WildsSettlementEnvironment";
import { projectMarketCard, type MarketCardCapability } from "./card-role";
import { sealMarketMortalConsent, type MarketMortalConsent } from "./consequences";
import { generateMarketBoard, type MarketContractDefinition } from "./contract-director";
import { createMarketNegotiation, type MarketTerms } from "./negotiation-resolver";
import type { MarketReceipt } from "./receipt";
import { createMarketRuntime, stepMarketRuntime, type MarketRuntimeState } from "./runtime";
import { marketTranscript } from "./transcript";
import { WayfarerMarketControls, type MarketControlIntent } from "./WayfarerMarketControls";
import { WayfarerMarketScene } from "./WayfarerMarketScene";
import type { MarketAudioSignal } from "../audio/wilds-audio-director";

type Stage = "board" | "active" | "publishing" | "result";

export function WayfarerMarketExperience({
  cards, conditions, guestId, marketSquadAssetIds, onAudioEvent, onExit, onReceipt, onSquadChange,
  participantCount, site, worldMode,
}: {
  cards: readonly PortableCardAsset[];
  conditions: Readonly<Record<string, AdventureCardCondition>>;
  guestId: string | null;
  marketSquadAssetIds: readonly string[];
  onAudioEvent: (signal: MarketAudioSignal) => void;
  onExit: () => void;
  onReceipt: (receipt: MarketReceipt) => void;
  onSquadChange: (assetIds: string[]) => void;
  participantCount: number;
  site: WildsWorldEcologyProjection;
  worldMode: WildsSettlementWorldMode;
}) {
  const playable = useMemo(() => cards.flatMap((card) => {
    try { return [projectMarketCard(card, conditions[card.id]!)]; } catch { return []; }
  }), [cards, conditions]);
  const [selectedIds, setSelectedIds] = useState<string[]>(() => marketSquadAssetIds.filter((id) => playable.some((card) => card.assetId === id)).slice(0, 3));
  const [mortal, setMortal] = useState(false);
  const squad = useMemo(() => selectedIds.map((id) => playable.find((card) => card.assetId === id)).filter((card): card is MarketCardCapability => Boolean(card)), [playable, selectedIds]);
  const sourceSite = useMemo(() => ({ ...site, schema: "receiz.wilds_ecology_site.v1" as const }), [site]);
  const board = useMemo(() => squad.length ? generateMarketBoard({ site: sourceSite, pulse: site.activatesAt, squad, history: [], mortal }) : null, [mortal, site.activatesAt, sourceSite, squad]);
  const [contractIndex, setContractIndex] = useState(0);
  const [acknowledgedRisk, setAcknowledgedRisk] = useState(false);
  const [acknowledgedFinality, setAcknowledgedFinality] = useState(false);
  const [contract, setContract] = useState<MarketContractDefinition | null>(null);
  const [baselineTerms, setBaselineTerms] = useState<MarketTerms | null>(null);
  const [runtime, setRuntime] = useState<MarketRuntimeState | null>(null);
  const runtimeRef = useRef<MarketRuntimeState | null>(null);
  const contractRef = useRef<MarketContractDefinition | null>(null);
  const lastAudioSequenceRef = useRef(-1);
  const [consent, setConsent] = useState<MarketMortalConsent | null>(null);
  const [stage, setStage] = useState<Stage>("board");
  const [paused, setPaused] = useState(false);
  const [message, setMessage] = useState("Choose cards whose real abilities solve the contract—not just its headline.");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { runtimeRef.current = runtime; }, [runtime]);
  useEffect(() => { contractRef.current = contract; }, [contract]);
  useEffect(() => {
    if (!runtime) {
      onAudioEvent({ phase: "board", squadElements: squad.map((card) => card.element), risk: mortal ? "mortal" : "standard", paused });
      return;
    }
    const latest = runtime.sequence !== lastAudioSequenceRef.current ? runtime.events.at(-1) : null;
    lastAudioSequenceRef.current = runtime.sequence;
    const eventKind = latest?.kind === "intelligence.gathered" ? "inspected"
      : latest?.kind === "negotiation.succeeded" || latest?.kind === "negotiation.failed" || latest?.kind === "negotiation.accepted" ? "negotiated"
        : latest?.kind ?? null;
    const active = runtime.squad.find((card) => card.assetId === runtime.activeAssetId);
    onAudioEvent({
      phase: runtime.phase,
      eventKind,
      element: active?.element,
      squadElements: runtime.squad.map((card) => card.element),
      risk: contract?.risk ?? (mortal ? "mortal" : "standard"),
      terminalReason: runtime.terminalReason === "extracted" ? "player-extracted" : runtime.terminalReason === "contract-failed" ? null : runtime.terminalReason,
      paused,
    });
  }, [contract?.risk, mortal, onAudioEvent, paused, runtime, squad]);

  const toggleCard = (assetId: string) => {
    setSelectedIds((current) => current.includes(assetId) ? current.filter((id) => id !== assetId) : current.length < 3 ? [...current, assetId] : current);
  };

  const enterContract = () => {
    const selected = board?.contracts[contractIndex];
    if (!selected || squad.length < selected.minCards || squad.length > selected.maxCards) return;
    if (selected.risk === "mortal" && (!acknowledgedRisk || !acknowledgedFinality)) return;
    const terms = createMarketNegotiation(selected).terms;
    const next = createMarketRuntime(selected, terms, squad);
    setContract(selected);
    setBaselineTerms(terms);
    setRuntime(next);
    setConsent(selected.risk === "mortal" ? sealMarketMortalConsent(selected, new Date().toISOString()) : null);
    onSquadChange(selectedIds);
    setStage("active");
    setMessage("Scout the glowing evidence, negotiate exact terms, then execute the route with position and timing.");
  };

  const dispatchIntent = useCallback((intent: MarketControlIntent) => {
    const current = runtimeRef.current;
    const definition = contractRef.current;
    if (!current || !definition || paused || ["result", "extracted", "defeated"].includes(current.phase)) return;
    try {
      const next = stepMarketRuntime(current, { ...intent, sequence: current.sequence + 1, tick: current.tick + 1 } as Parameters<typeof stepMarketRuntime>[1], definition);
      runtimeRef.current = next;
      setRuntime(next);
      setError(null);
      setMessage(next.events.at(-1)?.detail ?? message);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message.replaceAll("_", " ") : "That move could not resolve.");
    }
  }, [message, paused]);

  useEffect(() => {
    if (stage !== "active") return;
    const onKey = (event: KeyboardEvent) => {
      if (event.repeat) return;
      if (event.key.toLowerCase() === "p") { setPaused((value) => !value); return; }
      const move = event.key.toLowerCase() === "w" ? { x: 0, z: -1 } : event.key.toLowerCase() === "s" ? { x: 0, z: 1 } : event.key.toLowerCase() === "a" ? { x: -1, z: 0 } : event.key.toLowerCase() === "d" ? { x: 1, z: 0 } : null;
      if (move) dispatchIntent({ kind: "move", vector: move });
      if (event.key.toLowerCase() === "q") dispatchIntent({ kind: "guard", timingOffsetMs: 0 });
      if (event.key.toLowerCase() === "e") {
        const current = runtimeRef.current;
        const definition = contractRef.current;
        if (current && definition && (current.phase === "intelligence" || current.phase === "negotiation")) {
          const target = definition.intelligence
            .filter((node) => !current.intelligenceIds.includes(node.id))
            .sort((left, right) => Math.hypot(left.position.x - current.player.x, left.position.z - current.player.z) - Math.hypot(right.position.x - current.player.x, right.position.z - current.player.z))[0];
          if (target) dispatchIntent({ kind: "inspect", targetId: target.id });
        } else {
          const objective = current?.objectives.find((value) => !value.complete);
          if (objective) dispatchIntent({ kind: "role-action", verb: objective.requiredVerb, timingOffsetMs: 0 });
        }
      }
      if (event.key.toLowerCase() === "r") {
        const current = runtimeRef.current;
        const active = current?.squad.find((card) => card.assetId === current.activeAssetId);
        const abilityName = active?.abilities[0]?.name;
        if (abilityName) dispatchIntent({ kind: "ability", abilityName, timingOffsetMs: 0 });
      }
      if (event.code === "Space") { event.preventDefault(); dispatchIntent({ kind: "dodge", vector: { x: 1, z: 0 }, timingOffsetMs: 0 }); }
      const index = Number(event.key) - 1;
      const assetId = runtimeRef.current?.squad[index]?.assetId;
      if (assetId && assetId !== runtimeRef.current?.activeAssetId) dispatchIntent({ kind: "switch", assetId });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dispatchIntent, stage]);

  const publish = async () => {
    if (!runtime || !contract || !baselineTerms) return;
    setStage("publishing");
    setError(null);
    try {
      const response = await fetch("/api/wilds/market", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          guestId,
          idempotencyKey: `market:${runtime.id}:${runtime.sequence}`,
          cards: selectedIds.map((id) => cards.find((card) => card.id === id)!),
          priorConditions: Object.fromEntries(selectedIds.map((id) => [id, conditions[id]])),
          contract,
          terms: baselineTerms,
          transcript: marketTranscript(runtime),
          mortalConsent: consent,
        }),
      });
      const body = await response.json() as { ok: boolean; receipt?: MarketReceipt; error?: string };
      if (!response.ok || !body.ok) throw new Error(body.error ?? "market_publication_failed");
      if (body.receipt) onReceipt(body.receipt);
      setStage("result");
      setMessage(body.receipt ? "Receiz admitted the replay. Every consequence is now canonical." : "Practice replay verified locally. Nothing permanent was published.");
    } catch (cause) {
      setStage("active");
      setError(cause instanceof Error ? cause.message : "Publication failed without changing your cards.");
    }
  };

  if (typeof document === "undefined") return null;
  const selectedContract = board?.contracts[contractIndex] ?? null;
  const terminal = runtime && ["result", "extracted", "defeated"].includes(runtime.phase);
  return createPortal(<section aria-label="Wayfarer Merchant Circuit" aria-modal="true" className="wayfarer-market-experience" role="dialog">
    <header className="wayfarer-market-header">
      <div><span>{worldMode === "receiz_live" ? "RECEIZ LIVE CARAVAN" : "LOCAL PRACTICE CARAVAN"}</span><h2>Wayfarer Merchant Circuit</h2></div>
      <div className="wayfarer-market-presence"><Icons.users size={16} /><b>{Math.max(1, participantCount)}</b><small>AT MARKET</small></div>
      {runtime ? <div className="wayfarer-market-cargo"><span>CARGO</span><b>{runtime.cargoIntegrity}</b></div> : null}
      <button aria-label="Leave Wayfarer Market" className="wayfarer-market-close" onClick={onExit} type="button"><Icons.close size={20} /></button>
    </header>

    {stage === "board" ? <main className="wayfarer-market-board">
      <section className="market-squad-rail">
        <div className="market-section-title"><span>01</span><div><b>Build the working crew</b><small>1–3 cards · exact proofs and persistent condition</small></div></div>
        <div className="market-card-slots">{playable.map((card) => {
          const source = cards.find((value) => value.id === card.assetId)!;
          const selected = selectedIds.includes(card.assetId);
          return <button aria-pressed={selected} className={`market-card-slot${selected ? " is-selected" : ""}`} key={card.assetId} onClick={() => toggleCard(card.assetId)} type="button">
            <span>{source.manifest.name.slice(0, 2).toUpperCase()}</span><div><b>{source.manifest.name}</b><small>{card.roles.join(" · ")}</small><code>{card.proofDigest.slice(7, 17)}</code></div>
            <dl><div><dt>POW</dt><dd>{card.stats.power}</dd></div><div><dt>GRD</dt><dd>{card.stats.guard}</dd></div><div><dt>SPD</dt><dd>{card.stats.speed}</dd></div><div><dt>BND</dt><dd>{card.stats.bond}</dd></div></dl>
            <em>{[...card.verbs].slice(0, 4).join(" / ")}</em>
          </button>;
        })}</div>
        <label className="market-mortal-toggle"><input checked={mortal} disabled={squad.length < 2} onChange={(event) => { setMortal(event.target.checked); setAcknowledgedRisk(false); setAcknowledgedFinality(false); }} type="checkbox" /><span><b>Mortal Caravan</b><small>Requires 2–3 cards. Replay-proven squad defeat can permanently kill them.</small></span></label>
      </section>
      <section className="market-contract-board">
        <div className="market-section-title"><span>02</span><div><b>Read the board</b><small>Three deterministic offers, built for this exact crew</small></div></div>
        <div className="market-contracts">{board?.contracts.map((offer, index) => <button aria-pressed={contractIndex === index} className={`market-contract${contractIndex === index ? " is-selected" : ""}`} key={offer.id} onClick={() => setContractIndex(index)} type="button">
          <span>{offer.risk.toUpperCase()} · {offer.family}</span><h3>{offer.merchant.name}</h3><p>{offer.merchant.temperament} · pressure {offer.merchant.pressure}</p>
          <ul>{offer.demand.map((fact) => <li key={fact.id}>{fact.kind} × {fact.pressure}</li>)}</ul>
          <footer><b>{offer.rewardBands.at(-1)?.cardXp} XP</b><small>{offer.hazards[0]?.kind.replaceAll("-", " ")} · {offer.minCards}–{offer.maxCards} cards</small></footer>
        </button>)}</div>
        {selectedContract?.risk === "mortal" ? <div className="market-mortal-disclosure">
          <strong>Permanent-death disclosure</strong>
          <label><input checked={acknowledgedRisk} onChange={(event) => setAcknowledgedRisk(event.target.checked)} type="checkbox" /> I understand every selected card is at risk.</label>
          <label><input checked={acknowledgedFinality} onChange={(event) => setAcknowledgedFinality(event.target.checked)} type="checkbox" /> I understand death is irreversible.</label>
        </div> : null}
        <button className="market-enter-contract" disabled={!selectedContract || squad.length < selectedContract.minCards || (selectedContract.risk === "mortal" && (!acknowledgedRisk || !acknowledgedFinality))} onClick={enterContract} type="button">Enter {selectedContract?.family ?? "contract"}<span>Pin crew proofs and open the physical route</span></button>
      </section>
    </main> : runtime && contract ? <main className="wayfarer-market-runtime">
      <div className="market-scene"><WayfarerMarketScene contract={contract} state={runtime} /></div>
      <aside className="market-runtime-hud">
        <div className="market-objective-cluster"><span>{runtime.phase.toUpperCase()}</span><b>{contract.family} for {contract.merchant.name}</b><small>{runtime.objectives.filter((value) => value.complete).length}/{runtime.objectives.length} objectives · route {runtime.terms.routeId.split(":").at(-1)}</small></div>
        <div className="market-card-cluster">{runtime.squad.map((card, index) => <button className={card.assetId === runtime.activeAssetId ? "is-active" : ""} disabled={card.assetId === runtime.activeAssetId || runtime.cards[card.assetId]!.health <= 0} key={card.assetId} onClick={() => dispatchIntent({ kind: "switch", assetId: card.assetId })} type="button"><kbd>{index + 1}</kbd><span><b>{cards.find((value) => value.id === card.assetId)?.manifest.name}</b><i style={{ "--health": `${runtime.cards[card.assetId]!.health / runtime.cards[card.assetId]!.maxHealth * 100}%` } as React.CSSProperties} /></span><small>{runtime.cards[card.assetId]!.stamina}</small></button>)}</div>
        <div aria-live="polite" className={`market-event-strip${error ? " is-error" : ""}`}>{error ?? message}</div>
        {runtime.phase === "intelligence" || runtime.phase === "negotiation" ? <div className="market-negotiation-dock">
          {contract.intelligence.filter((node) => !runtime.intelligenceIds.includes(node.id)).map((node) => <button key={node.id} onClick={() => dispatchIntent({ kind: "inspect", targetId: node.id })} type="button">Inspect {node.label}</button>)}
          <button onClick={() => dispatchIntent({ kind: "negotiate", action: { kind: "commit" } })} type="button">Commit shown terms</button>
          <button onClick={() => dispatchIntent({ kind: "negotiate", action: { kind: "counter", term: "reward", timingOffsetMs: 0 } })} type="button">Counter reward</button>
        </div> : null}
        <div className="market-runtime-actions">
          <button onClick={() => setPaused((value) => !value)} type="button">{paused ? "Resume" : "Pause"}</button>
          {!terminal ? <button onClick={() => dispatchIntent({ kind: "extract" })} type="button">Extract safely</button> : <button disabled={stage === "publishing"} onClick={() => void publish()} type="button">{stage === "publishing" ? "Verifying replay…" : stage === "result" ? "Replay admitted" : "Seal outcome"}</button>}
          {stage === "result" ? <button onClick={onExit} type="button">Return to world</button> : null}
        </div>
      </aside>
      <WayfarerMarketControls disabled={paused || Boolean(terminal)} onIntent={dispatchIntent} state={runtime} />
      {paused ? <div className="market-pause-overlay"><span>CARAVAN PAUSED</span><h3>Your proof-pinned state is held.</h3><button onClick={() => setPaused(false)} type="button">Resume contract</button></div> : null}
    </main> : null}
  </section>, document.body);
}
