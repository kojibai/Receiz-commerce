"use client";

import { useMemo, useState } from "react";
import { creatureForm } from "./creature-catalog";
import { downloadPortableCard } from "./card-export";
import type { PlayState, WildsInput } from "./game-state";
import { WildsCard } from "./WildsCard";

const INVENTORY_PAGE_SIZE = 36;

export function WildsInventory({
  state,
  onInput,
  onListAsset
}: {
  state: PlayState;
  onInput: (input: WildsInput) => void;
  onListAsset?: (asset: PlayState["inventory"][number], priceCents: number) => Promise<PlayState["inventory"][number] | null>;
}) {
  const [query, setQuery] = useState("");
  const [rarity, setRarity] = useState("all");
  const [page, setPage] = useState(0);
  const [selectedId, setSelectedId] = useState(state.inventory.at(-1)?.id ?? "");
  const [priceUsd, setPriceUsd] = useState("25.00");
  const [listing, setListing] = useState(false);
  const [listingMessage, setListingMessage] = useState("");
  const matches = useMemo(() => state.inventory.filter((asset) => {
    const form = creatureForm(asset.manifest.formId);
    if (!form) return false;
    const haystack = `${form.name} ${form.species} ${form.habitat} ${form.abilities.map((ability) => ability.name).join(" ")} ${form.cardNumber}`.toLowerCase();
    return haystack.includes(query.trim().toLowerCase()) && (rarity === "all" || form.rarity === rarity);
  }), [query, rarity, state.inventory]);
  const pages = Math.max(1, Math.ceil(matches.length / INVENTORY_PAGE_SIZE));
  const visible = matches.slice(page * INVENTORY_PAGE_SIZE, page * INVENTORY_PAGE_SIZE + INVENTORY_PAGE_SIZE);
  const selected = state.inventory.find((asset) => asset.id === selectedId) ?? visible[0] ?? state.inventory[0];
  const selectedForm = selected ? creatureForm(selected.manifest.formId) : null;
  const progress = selectedForm ? state.companionProgress[selectedForm.familyId] ?? { level: 1, xp: 0, bond: 0 } : null;
  const next = selectedForm && selectedForm.stage < 3 ? creatureForm(`${selectedForm.familyId}-${selectedForm.stage + 1}`) : null;
  const canEvolve = Boolean(next && progress && progress.level >= next.evolution.level && progress.bond >= next.evolution.bond);

  return (
    <section className="wilds-inventory" aria-label="Portable creature card inventory">
      <header><div><span>Portable collection</span><h3>Wilds Inventory</h3><p>{state.inventory.length} sealed forms · 750 in the complete set</p></div></header>
      <div className="wilds-inventory-toolbar">
        <input aria-label="Search creature cards" onChange={(event) => { setQuery(event.target.value); setPage(0); }} placeholder="Search creatures, habitats, abilities…" type="search" value={query} />
        <select aria-label="Filter card rarity" onChange={(event) => { setRarity(event.target.value); setPage(0); }} value={rarity}>
          <option value="all">All rarities</option><option value="trail">Trail</option><option value="uncommon">Uncommon</option><option value="rare">Rare</option><option value="mythic">Mythic</option><option value="eternal">Eternal</option>
        </select>
      </div>
      <div className="wilds-inventory-layout">
        <div className="wilds-inventory-grid">
          {visible.map((asset) => {
            const form = creatureForm(asset.manifest.formId)!;
            return <button aria-pressed={selected?.id === asset.id} key={asset.id} onClick={() => setSelectedId(asset.id)} type="button"><span style={{ background: form.palette.primary }}>{form.name.slice(0, 2).toUpperCase()}</span><strong>{form.name}</strong><small>Stage {form.stage} · {form.rarity}</small><b>{asset.status === "sealed_local" ? "Offline sealed" : "Verified"}</b></button>;
          })}
          {!visible.length ? <p className="wilds-inventory-empty">No collected cards match this search.</p> : null}
        </div>
        {selected && selectedForm ? (
          <aside className="wilds-inventory-detail">
            <WildsCard asset={selected} />
            <div className="wilds-inventory-actions">
              <button className="button button-primary" onClick={() => void downloadPortableCard(selected)} type="button">Download portable PNG</button>
              {onListAsset && selected.status !== "listed" ? (
                <div className="wilds-listing-control">
                  <label>List price <span>$</span><input aria-label="Wilds card listing price" inputMode="decimal" min="0.01" onChange={(event) => setPriceUsd(event.target.value)} step="0.01" type="number" value={priceUsd} /></label>
                  <button
                    className="button button-outline"
                    disabled={listing || !Number.isFinite(Number(priceUsd)) || Number(priceUsd) <= 0}
                    onClick={async () => {
                      setListing(true);
                      setListingMessage("Running Receiz offline verifier…");
                      const listed = await onListAsset(selected, Math.round(Number(priceUsd) * 100));
                      setListing(false);
                      if (!listed?.synchronizedAt) {
                        setListingMessage("Card was not listed. Check your Receiz ID and try again.");
                        return;
                      }
                      onInput({ type: "mark-listed", assetId: selected.id, synchronizedAt: listed.synchronizedAt });
                      setListingMessage("Verified and listed on this Exchange.");
                    }}
                    type="button"
                  >{listing ? "Verifying…" : "Verify + list on Exchange"}</button>
                </div>
              ) : selected.status === "listed" ? <span className="wilds-apex-label">Listed on Exchange</span> : null}
              {next ? <button className="button button-outline" disabled={!canEvolve} onClick={() => onInput({ type: "evolve", assetId: selected.id, evolvedAt: new Date().toISOString() })} type="button">{canEvolve ? `Evolve into ${next.name}` : `Needs L${next.evolution.level} · Bond ${next.evolution.bond}`}</button> : <span className="wilds-apex-label">Apex form reached</span>}
              {listingMessage ? <p aria-live="polite">{listingMessage}</p> : null}
            </div>
          </aside>
        ) : null}
      </div>
      <footer><button disabled={page === 0} onClick={() => setPage((value) => Math.max(0, value - 1))} type="button">Previous</button><span>Page {page + 1} of {pages}</span><button disabled={page + 1 >= pages} onClick={() => setPage((value) => Math.min(pages - 1, value + 1))} type="button">Next</button></footer>
    </section>
  );
}
