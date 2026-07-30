// @receiz-generated receiz.app.contract.v1
// Regenerate with receiz app apply; do not edit directly.

import "server-only";
import { createReceizClient } from "@receiz/sdk";
import { receizEnvironment } from "./receiz.environment";
export function createReceizServerClient(accessToken?: string) {
  const env = receizEnvironment();
  return createReceizClient({ baseUrl: env.RECEIZ_BASE_URL, ...(accessToken ? { accessToken } : {}) });
}
