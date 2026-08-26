"use client";

import type { ReceizPlayableMaterialKind } from "@receiz/sdk";
import { useEffect, useState } from "react";
import { StatusPill } from "@/components/ui";
import { createReceizCommerceAdapter } from "@/lib/receiz/adapter";

type VerifiedMaterial = Readonly<{
  objectUrl: string;
  kind: ReceizPlayableMaterialKind;
  filename: string;
  mimeType: string;
  artifactSha256: string;
  payloadSha256: string;
  canonicalReceizUrl: string;
}>;

function MaterialPlayer({ material }: { material: VerifiedMaterial }) {
  if (material.kind === "image") return <img alt={material.filename} className="proof-material-player" src={material.objectUrl} />;
  if (material.kind === "audio") return <audio className="proof-material-player" controls src={material.objectUrl} />;
  if (material.kind === "video") return <video className="proof-material-player" controls src={material.objectUrl} />;
  if (material.kind === "pdf" || material.kind === "text") {
    return <iframe className="proof-material-player" sandbox="" src={material.objectUrl} title={material.filename} />;
  }
  return <a className="button button-primary" download={material.filename} href={material.objectUrl}>Download verified material</a>;
}

export function MaterialProofViewer() {
  const [status, setStatus] = useState<"absent" | "verifying" | "verified" | "failed">("absent");
  const [message, setMessage] = useState("");
  const [material, setMaterial] = useState<VerifiedMaterial | null>(null);

  useEffect(() => {
    const fragment = new URLSearchParams(window.location.hash.slice(1));
    if (!fragment.has("material")) return;

    let active = true;
    let revoke: (() => void) | null = null;
    setStatus("verifying");
    setMessage("Reconstructing and verifying the sealed proof object before playback.");

    const materialApi = createReceizCommerceAdapter().v124.material;
    void materialApi.openVerifiedUrl(window.location.href).then((verified) => {
      if (!active) return;
      const playable = materialApi.createPlayableObjectUrl(verified);
      revoke = () => playable.revoke();
      setMaterial(Object.freeze({
        objectUrl: playable.url,
        kind: playable.kind,
        filename: playable.filename,
        mimeType: playable.mimeType,
        artifactSha256: verified.sealedArtifactSha256,
        payloadSha256: verified.payloadSha256,
        canonicalReceizUrl: verified.canonicalReceizUrl,
      }));
      setStatus("verified");
      setMessage("The enclosing proof object and exact native payload passed local SDK verification.");
    }).catch((error) => {
      if (!active) return;
      setStatus("failed");
      setMessage(error instanceof Error ? error.message : "The carried material could not be verified.");
    });

    return () => {
      active = false;
      revoke?.();
    };
  }, []);

  if (status === "absent") return null;

  return (
    <section aria-live="polite" className="proof-material-verification">
      <StatusPill tone={status === "verified" ? "green" : status === "failed" ? "pink" : "neutral"}>
        {status === "verified" ? "Verified material" : status === "failed" ? "Verification failed" : "Verifying material"}
      </StatusPill>
      <h2>Content-bearing Receiz proof</h2>
      <p>{message}</p>
      {material ? (
        <>
          <MaterialPlayer material={material} />
          <dl className="definition-list">
            <div><dt>File</dt><dd>{material.filename}</dd></div>
            <div><dt>Media</dt><dd>{material.mimeType}</dd></div>
            <div><dt>Artifact SHA-256</dt><dd>{material.artifactSha256}</dd></div>
            <div><dt>Payload SHA-256</dt><dd>{material.payloadSha256}</dd></div>
          </dl>
          <a href={material.canonicalReceizUrl} rel="noreferrer" target="_blank">Open canonical Receiz proof</a>
        </>
      ) : null}
      <p><strong>Representation never outranks source.</strong> This player is a projection beneath the verified sealed proof object.</p>
    </section>
  );
}
