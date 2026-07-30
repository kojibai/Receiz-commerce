// @receiz-generated receiz.app.contract.v1
// Developer-editable below documented extension points.

import { createReceizServerClient } from "./receiz.server";
import { receizExtensions } from "./receiz.extensions";
export const receizProjectAdapter = {
  publicClient: () => createReceizServerClient(),
  delegatedClient: (token: string) => createReceizServerClient(token),
  authority: "sealed-receiz-proof-object" as const,
  extensions: receizExtensions,
};
