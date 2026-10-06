"use client";

import { useEffect, useRef, useState } from "react";
import { ProofFilePicker } from "@/components/ProofFilePicker";
import { Button } from "@/components/ui";
import { authorizePreparedReservePayment, type NativeReserveExecutionTransport } from "@/lib/checkout/browser-reserve-payment";
import type { NativeReserveQuote } from "@/lib/checkout/native-reserve-execution";

export function NativeReservePayment({ quote, onReady, recoverOnly = false }: { quote: NativeReserveQuote; onReady: (input: NativeReserveExecutionTransport) => void; recoverOnly?: boolean }) {
  const fileInput = useRef<HTMLInputElement>(null);
  const passphraseInput = useRef<HTMLInputElement>(null);
  const [filename, setFilename] = useState("");
  const [passphrase, setPassphrase] = useState("");
  const [passphraseRequired, setPassphraseRequired] = useState(false);
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  useEffect(() => { if (passphraseRequired) passphraseInput.current?.focus(); }, [passphraseRequired]);

  async function authorize() {
    const file = fileInput.current?.files?.[0];
    if (!file || (!consent && !recoverOnly) || busy) return;
    setBusy(true); setMessage("Verifying the complete Reserve transfer…");
    try {
      const input = await authorizePreparedReservePayment(file, quote, passphrase || undefined, recoverOnly);
      setPassphrase("");
      onReady(input);
    } catch (error) {
      const code = error instanceof Error ? error.message : "Reserve payment could not be opened.";
      if (code === "receiz_key_decrypt_failed" || code === "receiz_key_legacy_passphrase_required") {
        setPassphraseRequired(true);
        setMessage(passphrase ? "That passphrase could not unlock this seal. Try again." : "This seal needs its passphrase to authorize the payment.");
      } else setMessage(code);
    } finally { setBusy(false); }
  }

  return <div className="native-reserve-payment">
    <p>{recoverOnly ? "Open the original transfer to check its outcome. This check does not submit another Reserve payment." : "Choose the complete Reserve transfer prepared for this purchase. Your purchase and its card remainder stay in this app."}</p>
    <ProofFilePicker label="Prepared Reserve transfer" fileName={filename} inputRef={fileInput} disabled={busy}
      onChange={file => { setFilename(file?.name ?? ""); setPassphrase(""); setPassphraseRequired(false); setConsent(false); setMessage(""); }} />
    {passphraseRequired ? <label>Seal passphrase<input type="password" autoComplete="current-password" ref={passphraseInput}
      value={passphrase} onChange={event => setPassphrase(event.target.value)} /></label> : null}
    {!recoverOnly ? <label className="receiz-proof-consent"><input type="checkbox" checked={consent} onChange={event => setConsent(event.target.checked)} />
      <span>Pay ${(quote.funding.walletAppliedUsdCents / 100).toFixed(2)} from my Reserve to {quote.merchantUsername} for this purchase.
        {quote.funding.cardDeltaUsdCents > 0 ? ` I will confirm the $${(quote.funding.cardDeltaUsdCents / 100).toFixed(2)} card remainder next.` : ""}
        {" "}If card payment is interrupted, retain this purchase and continue it to finish.</span>
    </label> : null}
    {message ? <p role="status">{message}</p> : null}
    <Button variant="primary" disabled={!filename || (!consent && !recoverOnly) || busy} onClick={() => void authorize()}>{busy ? "Verifying…" : recoverOnly ? "Check original Reserve payment" : "Authorize Reserve payment"}</Button>
  </div>;
}
