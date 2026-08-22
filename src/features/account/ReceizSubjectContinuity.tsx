"use client";

import { useRef, useState } from "react";
import { Button, Panel, SectionHeader, StatusPill } from "@/components/ui";
import { createEdgeAccessKit, storeEdgeAccessKit, type ReceizEdgeCustodyStore } from "@/lib/receiz/v122/edge-custody";

type PublicBinding = Awaited<ReturnType<typeof createEdgeAccessKit>>["publicBinding"];

function indexedDbCustody(): ReceizEdgeCustodyStore {
  const database = () => new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open("receiz-v122-edge-custody", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("encrypted-kits");
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  return {
    async put(key, value) {
      const db = await database();
      await new Promise<void>((resolve, reject) => {
        const transaction = db.transaction("encrypted-kits", "readwrite");
        transaction.objectStore("encrypted-kits").put(value, key);
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
      });
      db.close();
    },
    async get(key) {
      const db = await database();
      const value = await new Promise<unknown>((resolve, reject) => {
        const request = db.transaction("encrypted-kits").objectStore("encrypted-kits").get(key);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      db.close();
      return typeof value === "string" ? value : null;
    },
  };
}

export function ReceizSubjectContinuity({ connected }: { connected: boolean }) {
  const [subjectId, setSubjectId] = useState("");
  const [subjectHead, setSubjectHead] = useState("");
  const [evidence, setEvidence] = useState("No subject operation attempted.");
  const [publicBinding, setPublicBinding] = useState<PublicBinding | null>(null);
  const artifactRef = useRef<HTMLInputElement>(null);
  const wrappingKeyRef = useRef<HTMLInputElement>(null);

  const readJson = async (response: Response) => {
    const body = await response.json() as Record<string, unknown>;
    setEvidence(JSON.stringify(body, null, 2));
    return body;
  };

  const admit = async () => {
    const artifact = artifactRef.current?.files?.[0];
    if (!artifact) return setEvidence("Choose the exact Receiz proof object first.");
    const form = new FormData();
    form.set("action", "admit");
    form.set("artifact", artifact);
    form.set("idempotencyKey", `subject-admit:${artifact.name}:${artifact.size}`);
    const body = await readJson(await fetch("/api/receiz/v122/subjects", { method: "POST", body: form }));
    const data = body.data as Record<string, unknown> | undefined;
    if (typeof data?.subjectId === "string") setSubjectId(data.subjectId);
    if (typeof data?.head === "string") setSubjectHead(data.head);
  };

  const inspect = async () => {
    if (!subjectId) return setEvidence("Enter an exact subject ID.");
    await readJson(await fetch(`/api/receiz/v122/subjects?action=state&subjectId=${encodeURIComponent(subjectId)}`, { cache: "no-store" }));
  };

  const createAccess = async () => {
    const file = wrappingKeyRef.current?.files?.[0];
    if (!subjectId || !subjectHead || !file) return setEvidence("Subject ID, exact head, and a user-held 32-byte wrapping-key file are required.");
    const edgeWrappingKey = new Uint8Array(await file.arrayBuffer());
    if (edgeWrappingKey.byteLength !== 32) return setEvidence("The wrapping-key file must contain exactly 32 bytes.");
    const result = await createEdgeAccessKit({ subjectId, subjectHead, edgeWrappingKey });
    await storeEdgeAccessKit(indexedDbCustody(), subjectId, result.accessKit);
    setPublicBinding(result.publicBinding);
    setEvidence(JSON.stringify({ publicBinding: result.publicBinding, privateKitStoredAtEdge: true, privateKitReturned: false }, null, 2));
  };

  const publishAccess = async () => {
    if (!publicBinding) return setEvidence("Create the edge kit first. Only its public binding will be sent.");
    await readJson(await fetch("/api/receiz/v122/subjects", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "publishAccessKey", publicBinding, expectedAccessKeyHead: null }),
    }));
  };

  return (
    <Panel>
      <SectionHeader title="Living subject continuity" action={<StatusPill tone={connected ? "green" : "neutral"}>{connected ? "Source-bound" : "Sign in"}</StatusPill>} />
      <p>Exact proof bytes and independently admitted history outrank every server, MCP response, receipt, cache, and screen below.</p>
      <div className="simple-list">
        <label className="simple-row"><span>Exact proof object</span><input ref={artifactRef} type="file" /></label>
        <Button disabled={!connected} onClick={() => void admit()} type="button">Admit exact subject proof</Button>
        <label className="simple-row"><span>Subject ID</span><input onChange={(event) => setSubjectId(event.target.value)} value={subjectId} /></label>
        <label className="simple-row"><span>Exact subject head</span><input onChange={(event) => setSubjectHead(event.target.value)} value={subjectHead} /></label>
        <Button disabled={!connected} onClick={() => void inspect()} type="button">Read projection beneath source</Button>
        <label className="simple-row"><span>User-held 32-byte wrapping key</span><input ref={wrappingKeyRef} type="file" /></label>
        <Button disabled={!connected} onClick={() => void createAccess()} type="button">Create encrypted access kit at edge</Button>
        <Button disabled={!connected || !publicBinding} onClick={() => void publishAccess()} type="button">Publish public binding only</Button>
        <pre style={{ overflow: "auto", whiteSpace: "pre-wrap" }}>{evidence}</pre>
      </div>
    </Panel>
  );
}
