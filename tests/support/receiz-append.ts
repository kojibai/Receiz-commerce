import type { StoreStateRecordInput } from "../../src/lib/receiz/proof-state.js";

type AppendFixture = Pick<
  StoreStateRecordInput,
  "recordedAt" | "updatedKaiUpulse" | "appendAnchorId" | "appendProof"
>;

export function receizAppendFixture(recordedAt: string, kaiUpulse?: string | number): AppendFixture {
  const updatedKaiUpulse = kaiUpulse ?? recordedAt.replace(/[^0-9]/g, "");
  const appendAnchorId = `anchor-${String(updatedKaiUpulse).replace(/[^0-9a-z]/gi, "")}`;

  return {
    recordedAt,
    updatedKaiUpulse,
    appendAnchorId,
    appendProof: {
      kind: "receiz.proof_bundle",
      kaiPulseEternal: String(updatedKaiUpulse),
      kaiKlok: String(updatedKaiUpulse),
      anchorId: appendAnchorId,
      ts: recordedAt
    }
  };
}
