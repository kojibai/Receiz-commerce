import assert from "node:assert/strict";
import { it } from "node:test";
import {
  createEdgeAccessKit,
  edgeKitStorageKey,
  loadEdgeAccessKit,
  storeEdgeAccessKit,
  type ReceizEdgeCustodyStore,
} from "../src/lib/receiz/v122/edge-custody";

it("creates an encrypted edge kit while returning only the public binding for publication", async () => {
  const wrappingKey = new Uint8Array(32).fill(7);
  const result = await createEdgeAccessKit({
    subjectId: "subject-1",
    subjectHead: "head-1",
    edgeWrappingKey: wrappingKey,
  });
  assert.equal(result.publicBinding.schema, "receiz.subject.access-public-key.v122");
  assert.equal(result.accessKit.schema, "receiz.subject.edge-access-kit.v122");
  assert.equal("encryptedPrivateKeyB64u" in result.publicBinding, false);
  assert.equal(edgeKitStorageKey("subject-1"), "receiz:v122:edge-access-kit:subject-1");

  const values = new Map<string, string>();
  const store: ReceizEdgeCustodyStore = {
    put: async (key, value) => { values.set(key, value); },
    get: async (key) => values.get(key) ?? null,
  };
  await storeEdgeAccessKit(store, "subject-1", result.accessKit);
  assert.deepEqual(await loadEdgeAccessKit(store, "subject-1"), result.accessKit);
  assert.equal(values.has(edgeKitStorageKey("subject-1")), true);
});
