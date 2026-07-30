// @receiz-generated receiz.app.contract.v1
// Developer-editable below documented extension points.

import type { JsonObject, ReceizPublicStorePublishInput, ReceizPublicStoreResolveInput } from "@receiz/sdk";
import { receizProjectAdapter } from "./receiz.adapter";
export const restoreReceizPublicStore = (input: ReceizPublicStoreResolveInput) => receizProjectAdapter.publicClient().publicStore.resolve(input);
export const publishReceizPublicStore = (token: string, input: ReceizPublicStorePublishInput<JsonObject>, idempotencyKey: string) =>
  receizProjectAdapter.delegatedClient(token).publicStore.publish(input, { idempotencyKey });
