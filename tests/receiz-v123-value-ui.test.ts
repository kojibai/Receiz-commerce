import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { it } from "node:test";

it("keeps manual heads, invented pricing, and financial submission out of held-proof verification", () => {
  const source = readFileSync("src/features/account/ReceizValueRails.tsx", "utf8");
  const verifier = readFileSync("src/lib/checkout/held-payment-proof.ts", "utf8");
  assert.doesNotMatch(source, /(?:setSourceValueHead|setAmountPhiMicro|account-explicit-preview|usdPerPhiMicrocents|Execute exact Phi)/);
  assert.doesNotMatch(source + verifier, /(?:\.executeReserve\(|\.executeSettlement\(|\.planReserve\(|\.planSettlement\()/);
  assert.doesNotMatch(source + verifier, /(?:localStorage\.setItem|accessToken|JSON\.stringify\(authoritySummary)/);
});
