import { readReceizIdentityArtifact, receizBase64UrlDecode, type ReceizOpenAuthoritySessionInputV124 } from "@receiz/sdk";
import { readInAppPermissionIdentity } from "../receiz/in-app-permission";
import type { NativeReservePreparation, NativeReserveQuote } from "./native-reserve-execution";
import type { PaymentContinuation } from "./payment-continuation";

export function isPendingReserveSession(id: string) {
  return id.startsWith("reserve-pending:") || id.startsWith("reserve-card-pending:");
}

export function reserveContext(continuation: PaymentContinuation | null | undefined) {
  return {
    originalReserveQuote: continuation?.context.nativeReserveQuote as NativeReserveQuote | undefined,
    reservePaymentToken: typeof continuation?.context.reservePaymentToken === "string" ? continuation.context.reservePaymentToken : undefined,
  };
}

/** Transport is input to canonical SDK verification, never a runtime handle.
 * Signing keys/passphrases must stay at the edge; only encrypted identity bytes
 * and its already signed, explicitly consented challenge enter the API. */
export async function readNativeReserveExecutionRequest(value: unknown) {
  if (value === undefined) return undefined;
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("reserve_checkout_preparation_required");
  const input = value as Record<string, unknown>;
  if (new TextEncoder().encode(JSON.stringify(input)).byteLength > 550_000) throw new Error("reserve_execution_source_too_large");
  if (!input.preparation || !input.authority || typeof input.authority !== "object" || Array.isArray(input.authority)) {
    throw new Error("reserve_checkout_preparation_required");
  }
  const authority = input.authority as Record<string, unknown>;
  if ("passphrase" in authority || "privateKey" in authority || "proofArtifact" in authority ||
    typeof authority.proofArtifactB64u !== "string" || authority.proofArtifactB64u.length > 750_000) {
    throw new Error("reserve_checkout_encrypted_identity_required");
  }
  const proofArtifact = receizBase64UrlDecode(authority.proofArtifactB64u);
  await readInAppPermissionIdentity(proofArtifact);
  const preparation = input.preparation as NativeReservePreparation;
  if (!Array.isArray(preparation.transitionSet?.members) || preparation.transitionSet.members.length !== 2) throw new Error("reserve_checkout_participants_invalid");
  for (const member of preparation.transitionSet.members) {
    const identity = await readReceizIdentityArtifact(receizBase64UrlDecode(member.identityArtifact.exactBytesB64u));
    if (identity.crypto.privateKeyPkcs8B64u) throw new Error("reserve_checkout_encrypted_identity_required");
  }
  const { proofArtifactB64u: _transport, ...fields } = authority;
  return { preparation: input.preparation as NativeReservePreparation,
    authority: { ...fields, proofArtifact } as Omit<ReceizOpenAuthoritySessionInputV124, "applicationId" | "audience">,
    recoverOnly: input.recoverOnly === true };
}
