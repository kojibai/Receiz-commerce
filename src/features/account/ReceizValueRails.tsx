"use client";

import { digestReceizCanonicalV122, receizOidcScopesForRails, type ReceizWorldValueIntentV122 } from "@receiz/sdk";
import { useRef, useState } from "react";
import { Button, Panel, SectionHeader, StatusPill } from "@/components/ui";
import { parseReceizProofAuthorityChallengeUnsignedV123, signReceizProofAuthorityChallengeAtEdgeV123 } from "@/lib/receiz/v123/consent";
import {
  createReceizProofAuthorityEdgeRuntimeV123,
  createReceizProofAuthoritySessionV123,
  type ReceizProofAuthoritySummaryV123,
} from "@/lib/receiz/v123/proof-authority";
import { createReceizValueExecutionCoordinatorV123, type ReceizExactValueIntentStoreV123 } from "@/lib/receiz/v123/value-execution";

const applicationId = process.env.NEXT_PUBLIC_RECEIZ_APPLICATION_ID?.trim() || "receiz-commerce-kit";

function browserIntentStore(): ReceizExactValueIntentStoreV123 {
  return Object.freeze({
    async put(key, exactIntentJson) {
      localStorage.setItem(key, exactIntentJson);
    },
    async get(key) {
      return localStorage.getItem(key);
    },
  });
}

export function ReceizValueRails({ connected }: { connected: boolean }) {
  const [rail, setRail] = useState<"settlement" | "reserve">("settlement");
  const [amountPhiMicro, setAmountPhiMicro] = useState("1");
  const [sourceProofObjectId, setSourceProofObjectId] = useState("");
  const [sourceValueHead, setSourceValueHead] = useState("");
  const [destinationSubjectId, setDestinationSubjectId] = useState("");
  const [expectedDestinationHead, setExpectedDestinationHead] = useState("");
  const [passphrase, setPassphrase] = useState("");
  const [consented, setConsented] = useState(false);
  const [authoritySummary, setAuthoritySummary] = useState<ReceizProofAuthoritySummaryV123 | null>(null);
  const [plannedIntent, setPlannedIntent] = useState<ReceizWorldValueIntentV122 | null>(null);
  const [evidence, setEvidence] = useState("No Phi intent planned.");
  const artifactRef = useRef<HTMLInputElement>(null);
  const challengeRef = useRef<HTMLInputElement>(null);
  const sessionRef = useRef<ReturnType<typeof createReceizProofAuthoritySessionV123> | null>(null);
  const coordinatorRef = useRef<ReturnType<typeof createReceizValueExecutionCoordinatorV123> | null>(null);

  if (!sessionRef.current) {
    sessionRef.current = createReceizProofAuthoritySessionV123(createReceizProofAuthorityEdgeRuntimeV123());
    coordinatorRef.current = createReceizValueExecutionCoordinatorV123(browserIntentStore(), sessionRef.current);
  }

  const authorize = async () => {
    try {
      const artifact = artifactRef.current?.files?.[0];
      const challengeFile = challengeRef.current?.files?.[0];
      if (!artifact || !challengeFile) throw new Error("Exact identity proof object and exact application challenge are required.");
      if (!consented) throw new Error("Explicit consent is required before signing the application-bound challenge.");
      const unsigned = parseReceizProofAuthorityChallengeUnsignedV123(JSON.parse(await challengeFile.text()), applicationId);
      const scopes = receizOidcScopesForRails(rail);
      const challenge = await signReceizProofAuthorityChallengeAtEdgeV123({
        artifact,
        challenge: unsigned,
        applicationId,
        scopes,
        ...(passphrase ? { passphrase } : {}),
      });
      const summary = await sessionRef.current!.authorize({ artifact, challenge, applicationId, rail });
      setAuthoritySummary(summary);
      setEvidence(JSON.stringify({
        authorized: true,
        authorityDigest: summary.authorityDigest,
        grantedScopes: summary.grantedScopes,
        bearerReturnedToUi: false,
        proofObjectRemainsAuthority: true,
      }, null, 2));
    } catch (error) {
      setEvidence(error instanceof Error ? error.message : "Proof authority exchange failed.");
    }
  };

  const plan = async () => {
    const idempotencyKey = `account-value:${await digestReceizCanonicalV122({
      rail,
      amountPhiMicro,
      sourceProofObjectId,
      sourceValueHead,
      destinationSubjectId,
      expectedDestinationHead,
    })}`;
    const response = await fetch("/api/receiz/v122/value", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        rail,
        amountPhiMicro,
        sourceProofObjectId,
        sourceValueHead,
        destinationSubjectId,
        expectedDestinationHead,
        usdPerPhiMicrocents: "1",
        priceBasis: { source: "account-explicit-preview", pinned: true },
        idempotencyKey,
      }),
    });
    const body = await response.json() as { data?: ReceizWorldValueIntentV122 };
    setPlannedIntent(body.data ?? null);
    setEvidence(JSON.stringify(body, null, 2));
  };

  const execute = async () => {
    if (!plannedIntent || !authoritySummary) return setEvidence("Plan exact Phi and establish proof authority first.");
    try {
      const result = await coordinatorRef.current!.execute(plannedIntent);
      setEvidence(JSON.stringify({ ...result, authorityReturned: false, receiptIsProofAuthority: false }, null, 2));
    } catch (error) {
      setEvidence(error instanceof Error ? error.message : "Value execution failed.");
    }
  };

  const recover = async () => {
    if (!plannedIntent?.idempotencyKey) return setEvidence("No exact idempotency key is available for recovery.");
    try {
      const outcome = await coordinatorRef.current!.recover(plannedIntent.idempotencyKey);
      setEvidence(JSON.stringify({ outcome, authorityReturned: false }, null, 2));
    } catch (error) {
      setEvidence(error instanceof Error ? error.message : "Value recovery failed.");
    }
  };

  return (
    <Panel>
      <SectionHeader title="Phi value execution" action={<StatusPill tone={authoritySummary ? "green" : "neutral"}>{authoritySummary ? "Authority held in memory only" : "Proof required"}</StatusPill>} />
      <p>Settlement and Reserve are distinct. Phi is the moved quantity; USD is only a deterministic display projection. The enclosing proof object remains stronger than every capability, receipt, server, database, and screen.</p>
      <div className="simple-list">
        <label className="simple-row"><span>Rail</span><select onChange={(event) => { setRail(event.target.value as "settlement" | "reserve"); setAuthoritySummary(null); sessionRef.current?.clear(); }} value={rail}><option value="settlement">Settlement</option><option value="reserve">Reserve</option></select></label>
        <label className="simple-row"><span>Exact identity proof object</span><input ref={artifactRef} type="file" /></label>
        <label className="simple-row"><span>Exact application challenge</span><input accept="application/json,.json" ref={challengeRef} type="file" /></label>
        <label className="simple-row"><span>Artifact passphrase, if required</span><input autoComplete="current-password" onChange={(event) => setPassphrase(event.target.value)} type="password" value={passphrase} /></label>
        <label className="simple-row"><span>I give explicit consent to the exact application-bound challenge and minimum {rail} scopes.</span><input checked={consented} onChange={(event) => setConsented(event.target.checked)} type="checkbox" /></label>
        <Button disabled={!connected || !consented} onClick={() => void authorize()} type="button">Verify object and establish scoped authority</Button>
        <label className="simple-row"><span>Amount (Phi micro)</span><input inputMode="numeric" onChange={(event) => setAmountPhiMicro(event.target.value)} value={amountPhiMicro} /></label>
        <label className="simple-row"><span>Source proof object</span><input onChange={(event) => setSourceProofObjectId(event.target.value)} value={sourceProofObjectId} /></label>
        <label className="simple-row"><span>Source value head</span><input onChange={(event) => setSourceValueHead(event.target.value)} value={sourceValueHead} /></label>
        <label className="simple-row"><span>Destination subject</span><input onChange={(event) => setDestinationSubjectId(event.target.value)} value={destinationSubjectId} /></label>
        <label className="simple-row"><span>Expected destination head</span><input onChange={(event) => setExpectedDestinationHead(event.target.value)} value={expectedDestinationHead} /></label>
        <Button disabled={!connected} onClick={() => void plan()} type="button">Plan exact {rail} intent</Button>
        <Button disabled={!connected || !authoritySummary || !plannedIntent} onClick={() => void execute()} type="button">Execute exact Phi</Button>
        <Button disabled={!connected || !authoritySummary || !plannedIntent?.idempotencyKey} onClick={() => void recover()} type="button">Recover exact outcome</Button>
        <pre style={{ overflow: "auto", whiteSpace: "pre-wrap" }}>{evidence}</pre>
      </div>
    </Panel>
  );
}
