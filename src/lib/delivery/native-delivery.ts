import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import type { ProductDeliverySource } from "../../types/domain";
import type { ReceizCommerceAdapter } from "../receiz/adapter";
import { receizOAuthSecret } from "../receiz/oauth-state";

export const MAX_DELIVERY_SOURCE_BYTES = 256 * 1024;
const MAX_SOURCE_TOKEN_CHARS = 500_000;
const PURPOSE = "receiz-storefront-exact-delivery-source:v1";
export type DeliveryBinding = { productId: string; merchantReceizId: string };

function key(secret: string) {
  if (Buffer.byteLength(secret) < 32) throw new Error("delivery_secret_required");
  return createHash("sha256").update(PURPOSE).update("\0").update(secret).digest();
}
function aad(binding: DeliveryBinding) {
  if (Object.values(binding).some(value => typeof value !== "string" || !value.trim())) throw new Error("delivery_binding_required");
  return Buffer.from(JSON.stringify([PURPOSE, binding.productId, binding.merchantReceizId]));
}
function digest(bytes: Uint8Array) { return createHash("sha256").update(bytes).digest("hex"); }
function safeFilename(value: string) { return value.replace(/[\x00-\x1f\x7f/\\]/g, "_").slice(0, 180) || "purchased.receized"; }

/** Requires the actual SDK verifier, including its same-runtime artifact brand.
 * Envelopes and metadata never replace verification of the complete source. */
async function verifySource(receiz: ReceizCommerceAdapter, file: File, binding: DeliveryBinding) {
  if (!file.size || file.size > MAX_DELIVERY_SOURCE_BYTES) throw new Error("delivery_source_size_invalid");
  const exactBytes = new Uint8Array(await file.arrayBuffer());
  const opened = await receiz.verifyAndOpenArtifact(file);
  const artifact = opened.sealedArtifact;
  if (artifact.kind !== "receiz.native-record-seal") throw new Error("delivery_native_source_required");
  if (artifact.continuity.ownerReceizId !== binding.merchantReceizId) throw new Error("delivery_source_owner_mismatch");
  if (digest(exactBytes) !== artifact.artifactSha256 ||
      digest(new Uint8Array(await artifact.artifact.arrayBuffer())) !== artifact.artifactSha256 ||
      digest(opened.verifiedPayload.bytes) !== artifact.payloadSha256 ||
      opened.verifiedPayload.sha256 !== artifact.payloadSha256) throw new Error("delivery_source_digest_mismatch");
  return { exactBytes, artifact };
}

/** Holds the complete source as an encrypted SDK capsule inside the store's
 * existing proof-state transport. No new storage service or payload fallback. */
export async function holdProductDeliverySource(input: {
  receiz: ReceizCommerceAdapter; file: File; binding: DeliveryBinding; secret?: string;
}): Promise<ProductDeliverySource> {
  const { exactBytes, artifact } = await verifySource(input.receiz, input.file, input.binding);
  const filename = safeFilename(input.file.name);
  const mimeType = artifact.mimeType;
  const capsule = input.receiz.v124.material.encodeCapsuleBytes({ exactArtifactBytes: exactBytes, filename, mimeType });
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(input.secret ?? receizOAuthSecret()), iv);
  cipher.setAAD(aad(input.binding));
  const encrypted = Buffer.concat([cipher.update(capsule), cipher.final()]);
  const token = ["ds1", iv.toString("base64url"), encrypted.toString("base64url"), cipher.getAuthTag().toString("base64url")].join(".");
  if (token.length > MAX_SOURCE_TOKEN_CHARS) throw new Error("delivery_source_size_invalid");
  return { schema: "receiz.app.product_delivery_source.v1", token, filename, mimeType, size: exactBytes.byteLength,
    artifactSha256: artifact.artifactSha256, payloadSha256: artifact.payloadSha256, ownerReceizId: artifact.continuity.ownerReceizId };
}

/** Only called after the original SDK payment was checked. Every process
 * reopens the complete exact artifact through the SDK; no serialized admission. */
export async function openProductDeliverySource(input: {
  receiz: ReceizCommerceAdapter; source: ProductDeliverySource; binding: DeliveryBinding; secret?: string;
}) {
  const { source, binding } = input;
  if (!source || source.schema !== "receiz.app.product_delivery_source.v1" || typeof source.token !== "string" ||
    source.token.length > MAX_SOURCE_TOKEN_CHARS) throw new Error("delivery_source_invalid");
  const parts = source.token.split(".");
  if (parts.length !== 4 || parts[0] !== "ds1" || parts.slice(1).some(part => !/^[A-Za-z0-9_-]+$/.test(part))) throw new Error("delivery_source_invalid");
  let capsule: ReturnType<ReceizCommerceAdapter["v124"]["material"]["decodeCapsuleBytes"]>;
  try {
    const iv = Buffer.from(parts[1], "base64url"), tag = Buffer.from(parts[3], "base64url");
    if (iv.length !== 12 || tag.length !== 16) throw new Error("invalid_envelope");
    const decipher = createDecipheriv("aes-256-gcm", key(input.secret ?? receizOAuthSecret()), iv);
    decipher.setAAD(aad(binding)); decipher.setAuthTag(tag);
    capsule = input.receiz.v124.material.decodeCapsuleBytes(Buffer.concat([decipher.update(Buffer.from(parts[2], "base64url")), decipher.final()]));
  } catch { throw new Error("delivery_source_invalid"); }
  if (capsule.exactArtifactBytes.byteLength !== source.size || digest(capsule.exactArtifactBytes) !== source.artifactSha256 ||
    capsule.filename !== source.filename || capsule.mimeType !== source.mimeType || source.ownerReceizId !== binding.merchantReceizId) {
    throw new Error("delivery_source_digest_mismatch");
  }
  const bytes = new Uint8Array(capsule.exactArtifactBytes);
  const file = new File([bytes.buffer], capsule.filename, { type: capsule.mimeType });
  const { artifact } = await verifySource(input.receiz, file, binding);
  if (artifact.payloadSha256 !== source.payloadSha256) throw new Error("delivery_source_digest_mismatch");
  return { bytes, filename: capsule.filename, mimeType: capsule.mimeType, artifactSha256: artifact.artifactSha256 };
}
