"use client";

import { creatureForm } from "./creature-catalog";
import type { PortableCardAsset } from "./portable-card";

export function WildsCard({ asset, compact = false }: { asset: PortableCardAsset; compact?: boolean }) {
  const form = creatureForm(asset.manifest.formId);
  if (!form) return null;
  const stats = [
    ["Health", form.stats.health],
    ["Power", form.stats.power],
    ["Guard", form.stats.guard],
    ["Speed", form.stats.speed],
    ["Bond", form.stats.bond]
  ] as const;
  return (
    <article
      aria-label={`${form.name}, Stage ${form.stage}, ${form.rarity} Wilds card`}
      className={`wilds-collectible-card foil-${form.foil}${compact ? " compact" : ""}`}
      style={{ "--card-primary": form.palette.primary, "--card-accent": form.palette.accent, "--card-glow": form.palette.glow } as React.CSSProperties}
    >
      <div className="wilds-card-foil" aria-hidden="true" />
      <header>
        <div><strong>{form.name}</strong><span>{form.species}</span></div>
        <div><b>STAGE {form.stage}</b><small>{form.cardNumber}</small></div>
      </header>
      <div className={`wilds-card-art body-${form.anatomy.body} detail-${form.anatomy.detail}`} aria-label={`${form.name} creature artwork`} role="img">
        <span className="wilds-card-creature-core" />
        <i className="wilds-card-creature-detail left" /><i className="wilds-card-creature-detail right" />
        <em className="wilds-card-eye left" /><em className="wilds-card-eye right" />
      </div>
      <div className="wilds-card-rarity"><span>{form.rarity}</span><b>{form.foil}</b></div>
      <dl className="wilds-card-stats">
        {stats.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
      </dl>
      <div className="wilds-card-abilities">
        {form.abilities.map((ability) => <div key={ability.name}><strong>{ability.name}</strong><b>{ability.power}</b><p>{ability.text}</p></div>)}
      </div>
      <footer>
        <span>{asset.status.replace("_", " ")}</span>
        <code title={asset.proof.digest}>{asset.proof.digest.slice(7, 19)}</code>
      </footer>
    </article>
  );
}
