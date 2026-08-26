import {
  assertReceizMaterialCompositeHeadUrl,
  buildReceizMaterialCompositeTransport,
  createReceizCompositeMaterialPresentationUrl,
  createReceizPlayableMaterialObjectUrl,
  decodeReceizMaterialCapsule,
  decodeReceizMaterialCapsuleBytes,
  encodeReceizMaterialCapsule,
  encodeReceizMaterialCapsuleBytes,
  openVerifiedReceizMaterialUrl,
  publishReceizMaterialCompositeTransport,
  readReceizMaterialCapsuleFromUrl,
  readReceizMaterialCompositePackageDigest,
  receizMaterialPresentedLinkForVerification,
  reconstructReceizMaterialCompositeCapsule,
  resolveReceizMaterialCompositeTransport,
  verifyReceizMaterialCompositeManifest,
} from "@receiz/sdk";

export const RECEIZ_V124_MATERIAL = Object.freeze({
  encodeCapsuleBytes: encodeReceizMaterialCapsuleBytes,
  encodeCapsule: encodeReceizMaterialCapsule,
  decodeCapsuleBytes: decodeReceizMaterialCapsuleBytes,
  decodeCapsule: decodeReceizMaterialCapsule,
  readCapsuleFromUrl: readReceizMaterialCapsuleFromUrl,
  presentedLinkForVerification: receizMaterialPresentedLinkForVerification,
  openVerifiedUrl: openVerifiedReceizMaterialUrl,
  createPlayableObjectUrl: createReceizPlayableMaterialObjectUrl,
  buildCompositeTransport: buildReceizMaterialCompositeTransport,
  verifyCompositeManifest: verifyReceizMaterialCompositeManifest,
  reconstructCompositeCapsule: reconstructReceizMaterialCompositeCapsule,
  readCompositePackageDigest: readReceizMaterialCompositePackageDigest,
  assertCompositeHeadUrl: assertReceizMaterialCompositeHeadUrl,
  publishCompositeTransport: publishReceizMaterialCompositeTransport,
  resolveCompositeTransport: resolveReceizMaterialCompositeTransport,
  createCompositePresentationUrl: createReceizCompositeMaterialPresentationUrl,
});

export type ReceizV124MaterialAdapter = typeof RECEIZ_V124_MATERIAL;
