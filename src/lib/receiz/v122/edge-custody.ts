import {
  createReceizSubjectAccessKeyV122,
  type ReceizSubjectAccessKitV122,
} from "@receiz/sdk";

export const edgeKitStorageKey = (subjectId: string) => `receiz:v122:edge-access-kit:${subjectId}`;

export const createEdgeAccessKit = createReceizSubjectAccessKeyV122;

export type ReceizEdgeCustodyStore = Readonly<{
  put(key: string, encryptedKitJson: string): Promise<void>;
  get(key: string): Promise<string | null>;
}>;

function parseStoredAccessKit(subjectId: string, value: string): ReceizSubjectAccessKitV122 {
  const parsed: unknown = JSON.parse(value);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("receiz_edge_access_kit_invalid");
  const kit = parsed as Record<string, unknown>;
  const binding = kit.binding;
  if (
    kit.schema !== "receiz.subject.edge-access-kit.v122"
    || typeof kit.nonceB64u !== "string"
    || typeof kit.encryptedPrivateKeyB64u !== "string"
    || typeof kit.kitDigest !== "string"
    || !binding
    || typeof binding !== "object"
    || Array.isArray(binding)
    || (binding as Record<string, unknown>).subjectId !== subjectId
  ) throw new Error("receiz_edge_access_kit_invalid");
  return parsed as ReceizSubjectAccessKitV122;
}

export async function storeEdgeAccessKit(
  store: ReceizEdgeCustodyStore,
  subjectId: string,
  accessKit: ReceizSubjectAccessKitV122,
): Promise<void> {
  if (accessKit.binding.subjectId !== subjectId) throw new Error("receiz_edge_access_kit_subject_mismatch");
  await store.put(edgeKitStorageKey(subjectId), JSON.stringify(accessKit));
}

export async function loadEdgeAccessKit(
  store: ReceizEdgeCustodyStore,
  subjectId: string,
): Promise<ReceizSubjectAccessKitV122 | null> {
  const stored = await store.get(edgeKitStorageKey(subjectId));
  return stored === null ? null : parseStoredAccessKit(subjectId, stored);
}
