// @receiz-generated receiz.app.contract.v1
// Developer-editable below documented extension points.

import { createReceizProofMemory, type ReceizProofMemoryStorage } from "@receiz/sdk";
export function openReceizProofMemory(ownerId: string, storage: ReceizProofMemoryStorage) {
  return createReceizProofMemory({ ownerId, storage });
}
export const receizProofMemoryLaw = "first-admission-then-append-forever" as const;
