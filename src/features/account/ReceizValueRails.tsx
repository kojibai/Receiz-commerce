"use client";

import { useRef, useState } from "react";
import { Button, Panel, SectionHeader, StatusPill } from "@/components/ui";
import { ProofFilePicker } from "@/components/ProofFilePicker";
import { paymentProofUsdLabel, verifyHeldPaymentProof, type HeldPaymentProof } from "@/lib/checkout/held-payment-proof";

export function ReceizValueRails() {
  const fileInput = useRef<HTMLInputElement>(null);
  const verifyingRef = useRef(false);
  const [file, setFile] = useState<File | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [proof, setProof] = useState<HeldPaymentProof | null>(null);
  const [error, setError] = useState("");

  const verify = async () => {
    if (!file || verifyingRef.current) return;
    verifyingRef.current = true;
    setVerifying(true);
    setProof(null);
    setError("");
    try {
      setProof(await verifyHeldPaymentProof(file, process.env.NEXT_PUBLIC_RECEIZ_APPLICATION_ID || "receiz-commerce-kit"));
    } catch {
      setError("This file could not be verified as a complete payment proof for this app. Choose the original SDK payment recovery containing both participants and all carried sources.");
    } finally {
      verifyingRef.current = false;
      setVerifying(false);
    }
  };

  return (
    <Panel>
      <SectionHeader title="Your payment proofs" action={<StatusPill tone={proof ? "green" : "neutral"}>{proof ? "Movement verified" : "Choose a proof"}</StatusPill>} />
      <p>Open a payment proof you already hold. Receiz verifies its complete source and both participants here on your device.</p>
      <div className="simple-list">
        <ProofFilePicker label="Payment recovery" fileName={file?.name ?? ""} inputRef={fileInput} disabled={verifying}
          accept="application/json,.json" onChange={(selected) => { setFile(selected); setProof(null); setError(""); }} />
        <Button disabled={!file || verifying} onClick={() => void verify()} type="button">{verifying ? "Verifying payment proof…" : "Verify payment proof"}</Button>
        {error ? <p role="alert">{error}</p> : null}
        {proof ? <div role="status" aria-live="polite">
          <div className="simple-row"><span>Payment rail</span><strong>{proof.sender.rail === "reserve" ? "Reserve" : "Settlement"}</strong></div>
          <div className="simple-row"><span>Transferred value</span><strong>{proof.sender.intent.amountPhiMicro} micro-Phi</strong></div>
          <div className="simple-row"><span>USD display at payment</span><strong>{paymentProofUsdLabel(proof.sender.intent.quotedUsdCents)}</strong></div>
          <div className="simple-row"><span>Sender proof</span><StatusPill tone="green">Verified</StatusPill></div>
          <div className="simple-row"><span>Receiver proof</span><StatusPill tone="green">Verified</StatusPill></div>
          <p>Order delivery and account access require their corresponding proofs.</p>
        </div> : null}
      </div>
    </Panel>
  );
}
