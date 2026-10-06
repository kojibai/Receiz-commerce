"use client";

import { receizBase64UrlEncode, sha256ReceizBytes } from "@receiz/sdk";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui";
import { ProofFilePicker } from "@/components/ProofFilePicker";
import { signReceizProofAuthorityChallengeAtEdgeV123 } from "@/lib/receiz/v123/consent";
import { inAppPermissionEntryPurpose, readInAppPermissionIdentity, type InAppPermissionPurpose, type inAppPermissionChallenge } from "@/lib/receiz/in-app-permission";

export function ReceizProofPermission() {
  const dialog = useRef<HTMLDialogElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const passphraseInput = useRef<HTMLInputElement>(null);
  const [purpose, setPurpose] = useState<InAppPermissionPurpose>("platform_billing");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [passphrase, setPassphrase] = useState("");
  const [message, setMessage] = useState("");
  const [selectedFileName, setSelectedFileName] = useState("");
  const [passphraseRequired, setPassphraseRequired] = useState(false);
  useEffect(() => { if (passphraseRequired) passphraseInput.current?.focus(); }, [passphraseRequired]);
  useEffect(() => {
    const open = (event: Event) => {
      const requested = (event as CustomEvent).detail?.purpose ?? new URLSearchParams(window.location.search).get("receiz_purpose");
      setPurpose(inAppPermissionEntryPurpose(requested, window.location.pathname.startsWith("/admin") ? "platform" : "tenant"));
      setConsent(false); setMessage("");
      if (!dialog.current?.open) dialog.current?.showModal();
    };
    window.addEventListener("receiz:permission-required", open);
    if (new URLSearchParams(window.location.search).get("receiz_identity") === "required") open(new Event("open"));
    return () => window.removeEventListener("receiz:permission-required", open);
  }, []);
  async function authorize() {
    const artifact = fileInput.current?.files?.[0];
    if (!artifact || !consent || busy) return;
    setBusy(true); setMessage("Verifying your Identity Seal…");
    try {
      if (artifact.size > 2_000_000) throw new Error("This Identity Seal is too large. Choose the original identity file.");
      const bytes = new Uint8Array(await artifact.arrayBuffer());
      const identity = await readInAppPermissionIdentity(bytes);
      if (identity.crypto.privateKeyPkcs8CiphertextB64u && !passphrase) {
        setPassphraseRequired(true);
        setMessage("This Identity Seal needs its passphrase to connect.");
        return;
      }
      const artifactDigest = await sha256ReceizBytes(bytes);
      const challengeResponse = await fetch(`/api/auth/receiz/proof?${new URLSearchParams({ purpose, artifactDigest })}`, { cache: "no-store" });
      const permission = await challengeResponse.json() as Awaited<ReturnType<typeof inAppPermissionChallenge>> & { ok: boolean; error?: string };
      if (!challengeResponse.ok || !permission.ok) throw new Error(permission.error ?? "Unable to prepare this app’s permission.");
      const challenge = await signReceizProofAuthorityChallengeAtEdgeV123({ artifact: bytes, challenge: permission.challenge,
        applicationId: permission.applicationId, scopes: permission.scopes, ...(passphrase ? { passphrase } : {}) });
      setPassphrase("");
      const response = await fetch("/api/auth/receiz/proof", { method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ purpose, applicationId: permission.applicationId, artifactB64u: receizBase64UrlEncode(bytes), challenge }) });
      const result = await response.json();
      if (!response.ok || result.ok !== true) throw new Error(result.message ?? "This Identity Seal could not authorize the app.");
      window.dispatchEvent(new Event("receiz:permission-ready"));
      setMessage("Connected. You can continue your purchase or account upgrade.");
    } catch (error) {
      const code = error instanceof Error ? error.message : "";
      if (code === "receiz_key_decrypt_failed" || code === "receiz_key_legacy_passphrase_required") {
        setPassphraseRequired(true);
        setMessage(passphrase ? "That passphrase could not unlock this seal. Please try again." : "This Identity Seal needs its passphrase to connect.");
      } else setMessage(code === "encrypted_identity_seal_required" ? "Use your encrypted Identity Seal for this connection. A seal containing an unencrypted signing key stays on your device."
        : code === "verified_identity_seal_required" ? "Choose the complete Identity Seal with its verified carried account proof."
        : code || "Unable to connect this Identity Seal.");
    }
    finally { setBusy(false); }
  }
  return (
    <dialog ref={dialog} className="receiz-proof-permission" aria-labelledby="receiz-proof-permission-title"
      onClose={() => { setPassphrase(""); setPassphraseRequired(false); setConsent(false); setSelectedFileName(""); if (fileInput.current) fileInput.current.value = ""; }}>
      <div className="receiz-proof-permission-content">
        <h2 id="receiz-proof-permission-title">Connect your Identity Seal</h2>
        <p>Use your verified Receiz identity in this app. Permission lasts up to five minutes; each purchase has its own confirmation.</p>
        <ProofFilePicker label="Encrypted Identity Seal" fileName={selectedFileName} inputRef={fileInput} disabled={busy}
          onChange={(file) => { setSelectedFileName(file?.name ?? ""); setPassphrase(""); setPassphraseRequired(false); setConsent(false); setMessage(""); }} />
        {passphraseRequired ? <label>Seal passphrase<input ref={passphraseInput} autoComplete="current-password" type="password" value={passphrase} onChange={(event) => setPassphrase(event.target.value)} /></label> : null}
        <label className="receiz-proof-consent"><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} />
          <span>I allow this app to read my identity {purpose === "store_manage" ? "and publish my store records" : "and wallet balance"} for this connection.</span>
        </label>
        {message ? <p role="status">{message}</p> : null}
        <div className="receiz-proof-permission-actions">
          <Button disabled={busy} onClick={() => dialog.current?.close()} variant="outline">Close</Button>
          <Button disabled={!selectedFileName || !consent || busy} onClick={() => void authorize()} variant="primary">{busy ? "Connecting…" : "Connect in this app"}</Button>
        </div>
      </div>
    </dialog>
  );
}
