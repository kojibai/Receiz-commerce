import { canonicalizeReceizV122, createReceizProofAuthorityChallenge, readReceizIdentityArtifact, receizBase64UrlDecode, sha256ReceizBytes } from "@receiz/sdk";
import { createReceizCommerceAdapter } from "../receiz/adapter";
import { readInAppPermissionIdentity } from "../receiz/in-app-permission";
import { signReceizProofAuthorityChallengeAtEdgeV123 } from "../receiz/v123/consent";
import { readNativeReserveExecutionRequest } from "./native-reserve-request";
import type { NativeReserveQuote } from "./native-reserve-execution";
import { nativeReserveConsentDigest, nativeReserveScopes } from "./native-reserve-consent";
import { merchantCheckoutUsername } from "./payment-contract";

export type NativeReserveExecutionTransport = Readonly<{
  preparation: NonNullable<Awaited<ReturnType<typeof readNativeReserveExecutionRequest>>>["preparation"];
  authority: Record<string, unknown> & { proofArtifactB64u: string };
  recoverOnly?: boolean;
}>;

/** Inspect original coordinates without opening a live capability or creating
 * another challenge. The server still independently admits every complete
 * source before accepting a committed recovery; this inspection is not payment. */
export async function inspectPreparedReservePaymentForQuote(transport: NativeReserveExecutionTransport, quote: NativeReserveQuote) {
  const input = await readNativeReserveExecutionRequest(transport);
  if (!input) throw new Error("reserve_checkout_preparation_required");
  const adapter = createReceizCommerceAdapter({ applicationId: quote.applicationId });
  const set = input.preparation.transitionSet;
  const inspections = await Promise.all(set.members.map(member => adapter.v125.value.edge.inspect(member.operationPlan,
    { participantId: member.participantId, expectedRail: "reserve" })));
  const sender = inspections.find(value => value.role === "sender");
  const receiver = inspections.find(value => value.role === "receiver");
  if (set.applicationId !== quote.applicationId || !sender || !receiver ||
    inspections.some(value => value.plan.applicationId !== quote.applicationId || value.plan.exactPlanDigest !== set.exactPlanDigest ||
      canonicalizeReceizV122(value.plan) !== canonicalizeReceizV122(sender.plan)) ||
    sender.intent.idempotencyKey !== `${quote.idempotencyKey}:reserve` ||
    sender.intent.quotedUsdCents !== String(quote.funding.walletAppliedUsdCents)) throw new Error("reserve_checkout_quote_mismatch");
  const identities = await Promise.all(set.members.map(member => readReceizIdentityArtifact(receizBase64UrlDecode(member.identityArtifact.exactBytesB64u))));
  const buyer = identities[set.members.findIndex(member => member.participantId === sender.participantId)];
  const merchant = identities[set.members.findIndex(member => member.participantId === receiver.participantId)];
  const identity = await readInAppPermissionIdentity(receizBase64UrlDecode(transport.authority.proofArtifactB64u));
  if (identity.owner.uid !== quote.buyerUserId || identity.keyId !== buyer.keyId ||
    buyer.owner.uid !== quote.buyerUserId || !buyer.owner.username ||
    merchantCheckoutUsername(buyer.owner.username) !== merchantCheckoutUsername(quote.buyerReceizId)) throw new Error("reserve_checkout_buyer_mismatch");
  const recipientHandle = quote.recipientUserId.trim().replace(/^@/, "").replace(/\.receiz\.id$/i, "").toLowerCase();
  if (!merchant.owner.username || merchantCheckoutUsername(merchant.owner.username) !== quote.merchantUsername ||
    (merchant.owner.uid !== quote.recipientUserId && recipientHandle !== quote.merchantUsername)) throw new Error("reserve_checkout_receiver_mismatch");
  return { input, adapter, identity };
}

/** A complete SDK preparation is transport, not an admitted transaction.
 * Reopen its exact sources locally before signing this purchase's permission;
 * the server independently repeats SDK verification before any execution. */
export async function authorizePreparedReservePayment(file: File, quote: NativeReserveQuote, passphrase?: string, recoverOnly = false): Promise<NativeReserveExecutionTransport> {
  if (!file.size || file.size > 300_000) throw new Error("Choose the complete prepared Reserve transfer, up to 300 KB.");
  const transport = JSON.parse(await file.text()) as NativeReserveExecutionTransport;
  const { input, adapter, identity } = await inspectPreparedReservePaymentForQuote(transport, quote);
  if (recoverOnly) return { ...transport, recoverOnly: true };
  const verified = await adapter.v125.value.edge.verifyTransitionSet(input.preparation.transitionSet, { audience: quote.applicationId });
  if (verified.operationPlan.semanticIdempotencyKey !== `${quote.idempotencyKey}:reserve`) {
    throw new Error("This Reserve transfer belongs to another purchase. Choose the original transfer for this payment.");
  }
  const artifact = receizBase64UrlDecode(transport.authority.proofArtifactB64u);
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
