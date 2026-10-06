import { canonicalizeReceizV122 } from "@receiz/sdk";
import type { EmbeddedPaymentSession } from "../../types/embedded-payment";
import { inspectPreparedReservePaymentForQuote, type NativeReserveExecutionTransport } from "./browser-reserve-payment";

export async function retainBrowserReserveAttempt(pending: EmbeddedPaymentSession | null,
  input: NativeReserveExecutionTransport | undefined, persist: (payment: EmbeddedPaymentSession) => boolean) {
  if (!pending?.reserveRequest) {
    if (input) throw new Error("reserve_checkout_original_quote_required");
    return undefined;
  }
  const original = pending.reserveAttempt;
  if (pending.reserveResolutionRequired && original) {
    if (input && (canonicalizeReceizV122(input.preparation) !== canonicalizeReceizV122(original.preparation) ||
      input.authority.proofArtifactB64u !== original.authority.proofArtifactB64u)) throw new Error("reserve_checkout_original_attempt_required");
    await inspectPreparedReservePaymentForQuote(original, pending.reserveRequest);
    return { ...original, recoverOnly: true };
  }
  if (!input) return undefined;
  await inspectPreparedReservePaymentForQuote(input, pending.reserveRequest);
  const recovering = input.recoverOnly === true || pending.reserveResolutionRequired === true;
  const retained = { ...structuredClone(input), recoverOnly: true };
  if (!persist({ ...pending, reserveResolutionRequired: true, reserveAttempt: retained })) {
    throw new Error("Save the original payment coordinates on this device before authorizing Reserve.");
  }
  return { ...input, recoverOnly: recovering };
}
