import { canonicalizeReceizV122, type ReceizSettledEdgeValueTransferV125 } from "@receiz/sdk";
import { createReceizCommerceAdapter } from "../receiz/adapter";

export const MAX_HELD_PAYMENT_PROOF_BYTES = 64 * 1024 * 1024;

export type HeldPaymentProof = Readonly<{
  sender: ReceizSettledEdgeValueTransferV125;
  receiver: ReceizSettledEdgeValueTransferV125;
}>;

/** Open the complete SDK recovery, including every carried transition source.
 * This read-only ceremony neither plans nor submits a financial operation.
 * Its result is movement evidence, not an order or platform entitlement. */
export async function verifyHeldPaymentProof(
  file: Pick<Blob, "size" | "arrayBuffer">,
  applicationId: string,
): Promise<HeldPaymentProof> {
  if (!applicationId.trim()) throw new Error("payment_proof_application_required");
  if (file.size <= 0 || file.size > MAX_HELD_PAYMENT_PROOF_BYTES) throw new Error("payment_proof_size_invalid");
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (bytes.byteLength !== file.size) throw new Error("payment_proof_bytes_incomplete");
  let recovery: unknown;
  try {
    recovery = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  } catch {
    throw new Error("payment_proof_recovery_file_required");
  }
  if (!recovery || typeof recovery !== "object" || Array.isArray(recovery) ||
    !("transitionSet" in recovery)) throw new Error("payment_proof_recovery_file_required");

  // The existing SDK pins proof roots and reopens all enclosing sources.
  // No website session, projection lookup, or arbitrary verifier is used.
  const edge = createReceizCommerceAdapter({ applicationId, fetchImpl: async () => {
    throw new Error("payment_proof_verification_must_stay_local");
  } }).v125.value.edge;
  const verified = await edge.verifyTransitionSet(recovery.transitionSet, { audience: applicationId });
  const domain = verified.operationPlan.domainId;
  const rail = domain === "value:reserve" ? "reserve" : domain === "value:settlement" ? "settlement" : null;
  if (!rail || verified.members.length !== 2) throw new Error("payment_proof_value_participants_required");
  const inspections = [];
  for (const member of verified.members) {
    inspections.push(await edge.inspect(verified.operationPlan, { participantId: member.participantId, expectedRail: rail }));
  }
  const senderInspection = inspections.find((inspection) => inspection.role === "sender");
  const receiverInspection = inspections.find((inspection) => inspection.role === "receiver");
  if (!senderInspection || !receiverInspection) throw new Error("payment_proof_value_participants_required");

  // Both parties reopen the same full native recovery. A JSON receipt, a paid
  // flag, a single valid member, or a different participant cannot stand in.
  const sender = await (rail === "reserve" ? edge.confirmReserveSend : edge.confirmSettlementSend)(recovery, {
    applicationId, participantId: senderInspection.participantId,
  });
  const receiver = await (rail === "reserve" ? edge.receiveReserve : edge.receiveSettlement)(recovery, {
    applicationId, participantId: receiverInspection.participantId,
  });
  if (canonicalizeReceizV122(sender.intent) !== canonicalizeReceizV122(receiver.intent)) {
    throw new Error("payment_proof_participant_intent_mismatch");
  }
  return Object.freeze({ sender, receiver });
}

export function paymentProofUsdLabel(usdCents: string) {
  if (!/^\d+$/.test(usdCents)) throw new Error("payment_proof_display_amount_invalid");
  const amount = BigInt(usdCents);
  return `$${amount / 100n}.${(amount % 100n).toString().padStart(2, "0")}`;
}
