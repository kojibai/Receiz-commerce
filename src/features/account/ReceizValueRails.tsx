"use client";

import { useState } from "react";
import { Button, Panel, SectionHeader, StatusPill } from "@/components/ui";

export function ReceizValueRails({ connected }: { connected: boolean }) {
  const [rail, setRail] = useState<"settlement" | "reserve">("settlement");
  const [amountPhiMicro, setAmountPhiMicro] = useState("1");
  const [sourceProofObjectId, setSourceProofObjectId] = useState("");
  const [sourceValueHead, setSourceValueHead] = useState("");
  const [destinationSubjectId, setDestinationSubjectId] = useState("");
  const [expectedDestinationHead, setExpectedDestinationHead] = useState("");
  const [evidence, setEvidence] = useState("No Phi intent planned.");

  const plan = async () => {
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
      }),
    });
    setEvidence(JSON.stringify(await response.json(), null, 2));
  };

  return (
    <Panel>
      <SectionHeader title="Phi value rails" action={<StatusPill tone="green">Plan only</StatusPill>} />
      <p>Settlement and Reserve are distinct. Phi is the moved quantity; USD is only a deterministic display projection.</p>
      <div className="simple-list">
        <label className="simple-row"><span>Rail</span><select onChange={(event) => setRail(event.target.value as "settlement" | "reserve")} value={rail}><option value="settlement">Settlement</option><option value="reserve">Reserve</option></select></label>
        <label className="simple-row"><span>Amount (Phi micro)</span><input inputMode="numeric" onChange={(event) => setAmountPhiMicro(event.target.value)} value={amountPhiMicro} /></label>
        <label className="simple-row"><span>Source proof object</span><input onChange={(event) => setSourceProofObjectId(event.target.value)} value={sourceProofObjectId} /></label>
        <label className="simple-row"><span>Source value head</span><input onChange={(event) => setSourceValueHead(event.target.value)} value={sourceValueHead} /></label>
        <label className="simple-row"><span>Destination subject</span><input onChange={(event) => setDestinationSubjectId(event.target.value)} value={destinationSubjectId} /></label>
        <label className="simple-row"><span>Expected destination head</span><input onChange={(event) => setExpectedDestinationHead(event.target.value)} value={expectedDestinationHead} /></label>
        <Button disabled={!connected} onClick={() => void plan()} type="button">Plan {rail} intent</Button>
        <pre style={{ overflow: "auto", whiteSpace: "pre-wrap" }}>{evidence}</pre>
      </div>
    </Panel>
  );
}
