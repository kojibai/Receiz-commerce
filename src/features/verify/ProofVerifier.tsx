"use client";

import { useState } from "react";
import type { DocumentVerifyResponse } from "@receiz/sdk";
import { createReceizCommerceAdapter } from "@/lib/receiz/adapter";
import { Button, Panel, StatusPill } from "@/components/ui";

export function ProofVerifier({ claim, pulse }: { claim?: string; pulse?: string }) {
  const [result, setResult] = useState<DocumentVerifyResponse | null>(null);
  const [message, setMessage] = useState("Choose a Receiz proof object to verify it locally on this surface.");

  return (
    <Panel className="verify-surface-panel">
      <div className="section-heading">
        <div>
          <StatusPill tone={result?.ok ? "green" : "neutral"}>{result?.ok ? "Verified" : "Local verification"}</StatusPill>
          <h1>Verify a Receiz proof object</h1>
          <p>{message}</p>
        </div>
      </div>
      {claim ? (
        <dl className="definition-list">
          <div><dt>Claim</dt><dd>{claim}</dd></div>
          {pulse ? <div><dt>Kai pulse</dt><dd>{pulse}</dd></div> : null}
        </dl>
      ) : null}
      <label className="button button-primary" htmlFor="proof-verifier-file">
        Choose proof object
      </label>
      <input
        hidden
        id="proof-verifier-file"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (!file) return;
          setMessage(`Verifying ${file.name}`);
          void createReceizCommerceAdapter().verifyArtifact(file).then((verification) => {
            setResult(verification);
            setMessage(
              verification.ok
                ? `${file.name} passed Receiz SDK verification on this device.`
                : verification.errors.filter(Boolean).join(", ") || `${file.name} could not be verified.`
            );
          }).catch((error) => {
            setResult(null);
            setMessage(error instanceof Error ? error.message : "Proof verification failed");
          });
        }}
        type="file"
      />
      <Button onClick={() => history.back()} variant="outline">Return to your workspace</Button>
      {result ? (
        <div className="proof-verification-result" role="status">
          <strong>{result.ok ? "Cryptographic checks passed" : "Verification failed"}</strong>
          <span>{result.kind || "Receiz proof object"}</span>
          {result.warnings.length ? <span>{result.warnings.join(" · ")}</span> : null}
        </div>
      ) : null}
    </Panel>
  );
}
