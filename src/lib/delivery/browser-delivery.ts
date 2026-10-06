import { createReceizCommerceAdapter } from "../receiz/adapter";

export type DeliveredProofFile = {
  productId: string; title: string; bytes: string; filename: string; mimeType: string; artifactSha256: string;
};

/** Downloads only SDK-issued artifacts reopened from the complete exact bytes.
 * A delivery response or successful payment is never itself proof authority. */
export async function downloadPurchasedProofFiles(files: DeliveredProofFile[], merchantReceizId: string) {
  if (!Array.isArray(files) || !files.length || files.length > 100) throw new Error("delivery_files_invalid");
  const receiz = createReceizCommerceAdapter();
  const openedFiles = [];
  for (const file of files) {
    if (typeof file.bytes !== "string" || file.bytes.length > 360_000 || !/^[a-f0-9]{64}$/.test(file.artifactSha256)) {
      throw new Error("delivery_file_invalid");
    }
    const binary = atob(file.bytes);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index++) bytes[index] = binary.charCodeAt(index);
    const hash = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", bytes.buffer))).map(byte => byte.toString(16).padStart(2, "0")).join("");
    if (hash !== file.artifactSha256) throw new Error("delivery_file_digest_mismatch");
    const opened = await receiz.verifyAndOpenArtifact(new File([bytes.buffer], file.filename, { type: file.mimeType }));
    if (opened.sealedArtifact.kind !== "receiz.native-record-seal") throw new Error("delivery_native_source_required");
    if (opened.sealedArtifact.continuity.ownerReceizId !== merchantReceizId) throw new Error("delivery_file_owner_mismatch");
    if (opened.sealedArtifact.artifactSha256 !== hash) throw new Error("delivery_file_digest_mismatch");
    openedFiles.push(opened.sealedArtifact);
  }
  for (const artifact of openedFiles) {
    const evidence = await receiz.downloadArtifact(artifact);
    if (!evidence.ok || evidence.artifactSha256 !== artifact.artifactSha256) throw new Error("delivery_download_failed");
  }
}
