"use client";

import { useRef } from "react";
import type { PortableCardAsset } from "./portable-card";
import { WildsCard } from "./WildsCard";

export function WildsCardScene({ asset }: { asset: PortableCardAsset }) {
  const scene = useRef<HTMLDivElement>(null);
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
      <div className="wilds-card-float"><WildsCard asset={asset} /></div>
    </div>
  );
}
