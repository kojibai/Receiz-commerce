import type { StoreStateRecordInput } from "../../src/lib/receiz/proof-state.js";

type AppendFixture = Pick<StoreStateRecordInput, "recordedAt">;

export function receizAppendFixture(recordedAt: string, _kaiUpulse?: string | number): AppendFixture {
  return {
    recordedAt
  };
}
