import { createReceizProofAuthorityChallenge, receizBase64UrlDecode, sha256ReceizBytes } from "@receiz/sdk";
import { createReceizCommerceAdapter } from "../receiz/adapter";
import { readInAppPermissionIdentity } from "../receiz/in-app-permission";
import { signReceizProofAuthorityChallengeAtEdgeV123 } from "../receiz/v123/consent";
import { readNativeReserveExecutionRequest } from "./native-reserve-request";
import type { NativeReserveQuote } from "./native-reserve-execution";
import { nativeReserveConsentDigest, nativeReserveScopes } from "./native-reserve-consent";

export type NativeReserveExecutionTransport = Readonly<{
  preparation: NonNullable<Awaited<ReturnType<typeof readNativeReserveExecutionRequest>>>["preparation"];
  authority: Record<string, unknown> & { proofArtifactB64u: string };
  recoverOnly?: boolean;
}>;

/** A complete SDK preparation is transport, not an admitted transaction.
 * Reopen its exact sources locally before signing this purchase's permission;
 * the server independently repeats SDK verification before any execution. */
export async function authorizePreparedReservePayment(file: File, quote: NativeReserveQuote, passphrase?: string, recoverOnly = false): Promise<NativeReserveExecutionTransport> {
  if (!file.size || file.size > 300_000) throw new Error("Choose the complete prepared Reserve transfer, up to 300 KB.");
  const transport = JSON.parse(await file.text()) as NativeReserveExecutionTransport;
  const input = await readNativeReserveExecutionRequest(transport);
  if (!input) throw new Error("Choose the complete prepared Reserve transfer.");
  const adapter = createReceizCommerceAdapter({ applicationId: quote.applicationId });
  if (recoverOnly) return { ...transport, recoverOnly: true };
  const verified = await adapter.v125.value.edge.verifyTransitionSet(input.preparation.transitionSet, { audience: quote.applicationId });
  if (verified.operationPlan.semanticIdempotencyKey !== `${quote.idempotencyKey}:reserve`) {
    throw new Error("This Reserve transfer belongs to another purchase. Choose the original transfer for this payment.");
  }
  const artifact = receizBase64UrlDecode(transport.authority.proofArtifactB64u);
  const identity = await readInAppPermissionIdentity(artifact);
  if (identity.owner.uid !== quote.buyerUserId) throw new Error("Use the original buyer’s Identity Seal.");
  const scopes = nativeReserveScopes();
  const artifactDigest = await sha256ReceizBytes(artifact);
  const consentStatementDigest = await nativeReserveConsentDigest(quote, verified.operationPlan.exactPlanDigest);
  const { challenge } = createReceizProofAuthorityChallenge({ applicationId: quote.applicationId, artifactDigest,
    scopes, consentStatementDigest, ttlPulses: 30 });
  const signedChallenge = await signReceizProofAuthorityChallengeAtEdgeV123({ artifact, challenge,
    applicationId: quote.applicationId, scopes, ...(passphrase ? { passphrase } : {}) });
  return { preparation: transport.preparation,
    authority: { ...transport.authority, signedChallenge, requestedRails: ["reserve"], requiredNamespaces: input.authority.requiredNamespaces } };
}
