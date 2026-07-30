// @receiz-generated receiz.app.contract.v1
// Regenerate with receiz app apply; do not edit directly.

import { createReceizClient } from "@receiz/sdk";
export function createReceizBrowserClient() {
  return createReceizClient({ baseUrl: process.env.NEXT_PUBLIC_RECEIZ_BASE_URL ?? "https://receiz.com" });
}
