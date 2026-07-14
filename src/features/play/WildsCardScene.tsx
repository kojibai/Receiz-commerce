"use client";

import { useRef, useState } from "react";
import type { PortableCardAsset } from "./portable-card";
import { WildsCard } from "./WildsCard";
import { WildsCardBack } from "./WildsCardBack";

export function WildsCardScene({ asset, origin, qr }: { asset: PortableCardAsset; origin: string; qr: string }) {
  const scene = useRef<HTMLDivElement>(null);
  const [flipped, setFlipped] = useState(false);
  return (
    <div
      className="wilds-card-scene"
      onPointerLeave={() => scene.current?.style.setProperty("--tilt-x", "0deg")}
      onPointerMove={(event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        scene.current?.style.setProperty("--tilt-y", `${((event.clientX - rect.left) / rect.width - 0.5) * 12}deg`);
        scene.current?.style.setProperty("--tilt-x", `${((event.clientY - rect.top) / rect.height - 0.5) * -9}deg`);
      }}
      ref={scene}
    >
      <div className="wilds-card-orbit" aria-hidden="true"><i /><i /><i /></div>
      <div className="wilds-card-float">
        <div className={`wilds-card-flipper${flipped ? " is-flipped" : ""}`}>
          <div className="wilds-card-face wilds-card-face-front"><WildsCard asset={asset} /></div>
          <div className="wilds-card-face wilds-card-face-back"><WildsCardBack asset={asset} origin={origin} qr={qr} /></div>
        </div>
      </div>
      <button aria-label={flipped ? "Show card front" : "Show card back"} aria-pressed={flipped} className="wilds-card-flip-control" onClick={() => setFlipped((value) => !value)} type="button">{flipped ? "Front" : "Flip card"}</button>
    </div>
  );
}
