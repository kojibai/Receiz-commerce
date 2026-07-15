"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Icons } from "@/components/icons";
import { applyHearttreeIntent, createHearttreeTrial, type HearttreeIntent } from "./hearttree-trial";
import type { PortableCardAsset } from "./portable-card";
import { WILDS_FLAGSHIP_LANDMARKS, type WildsLandmarkId } from "./wilds-landmarks";

export function WildsLandmarkExperience({
  card,
  landmarkId,
  onExit
}: {
  card: PortableCardAsset | null;
  landmarkId: WildsLandmarkId | null;
  onExit: () => void;
}) {
  const landmark = WILDS_FLAGSHIP_LANDMARKS.find((item) => item.id === landmarkId) ?? null;
  const seed = useMemo(() => landmark && card ? `${landmark.id}:${card.proof.digest}` : "", [card, landmark]);
  const [trial, setTrial] = useState(() => card ? createHearttreeTrial(seed || "hearttree", card) : null);

  useEffect(() => {
    setTrial(landmark?.id === "hearttree-sanctum" && card ? createHearttreeTrial(seed, card) : null);
  }, [card, landmark?.id, seed]);

  useEffect(() => {
    if (!landmark) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (trial && trial.phase !== "result" && !window.confirm("Leave the active Hearttree trial and return to the world?")) return;
      onExit();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [landmark, onExit, trial]);

  if (!landmark || typeof document === "undefined") return null;
  const act = (intent: HearttreeIntent) => setTrial((current) => current ? applyHearttreeIntent(current, intent) : current);
  const latestEvent = trial?.events.at(-1)?.message ?? "Pulse the sanctuary to reveal the memory path.";

  return createPortal(
    <section aria-labelledby="wilds-landmark-title" aria-modal="true" className="wilds-landmark-experience hearttree" role="dialog">
      <header className="wilds-landmark-header">
        <div><span className="eyebrow">Enterable landmark · mastery</span><h2 id="wilds-landmark-title">Hearttree Sanctum</h2></div>
        <button aria-label="Return to world" onClick={onExit} type="button"><Icons.close aria-hidden="true" size={19} /></button>
      </header>

      <div className="wilds-hearttree-world" aria-label="Hearttree trial chamber">
        <div className="wilds-hearttree-aurora" aria-hidden="true" />
        <div className="wilds-hearttree-trunk" aria-hidden="true"><i /><i /><i /></div>
        <div className="wilds-hearttree-orbit" aria-hidden="true"><i /><i /><i /></div>
        <div className="wilds-hearttree-status">
          <span>{trial?.phase === "result" ? "Mastery sealed" : trial?.phase === "master" ? "Root Master encounter" : "Memory path"}</span>
          <strong>{trial?.phase === "master" ? `Guard ${trial.guard}/3` : trial?.phase === "result" ? trial.reward?.label : trial?.chamberOrder[trial.chamber]}</strong>
          <p aria-live="polite">{latestEvent}</p>
        </div>
        {card ? (
          <div className="wilds-hearttree-card-pin"><span style={{ background: card.manifest.variant.traits.palette.primary }}>{card.manifest.name.slice(0, 2).toUpperCase()}</span><div><small>Verified companion</small><strong>{card.manifest.name}</strong><code>{card.proof.digest.slice(7, 19)}</code></div></div>
        ) : <div className="wilds-hearttree-card-pin"><strong>A verified card is required</strong></div>}
      </div>

      <footer className="wilds-landmark-actions">
        {trial?.phase === "result" ? (
          <button className="wilds-landmark-primary" onClick={onExit} type="button"><Icons.globe aria-hidden="true" size={18} /><span><strong>Return to world</strong><small>Achievement secured to this trial</small></span></button>
        ) : (
          <>
            <button aria-label="Pulse memory" onClick={() => act("pulse")} type="button"><Icons.pulse aria-hidden="true" size={18} /><span><strong>Pulse</strong><small>Reveal</small></span></button>
            <button aria-label="Advance through chamber" disabled={!trial?.clueRevealed} onClick={() => act("north")} type="button"><Icons.walk aria-hidden="true" size={18} /><span><strong>Advance</strong><small>Follow clue</small></span></button>
            <button aria-label="Guard with active card" disabled={trial?.phase !== "master"} onClick={() => act("guard")} type="button"><Icons.seal aria-hidden="true" size={18} /><span><strong>Guard</strong><small>Remember</small></span></button>
            <button aria-label="Use signature ability" disabled={trial?.phase !== "master" || trial.guard < 1} onClick={() => act("ability:0")} type="button"><Icons.sparkle aria-hidden="true" size={18} /><span><strong>Awaken</strong><small>Signature</small></span></button>
          </>
        )}
      </footer>
    </section>,
    document.body
  );
}
