import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { commerceEventFromUnknown } from "../src/lib/receiz/proof-state.js";
import {
  commerceWebhookAuthorityIsComplete,
  explicitWebhookEventId,
  webhookTimestampIsFresh
} from "../src/lib/receiz/webhook-security.js";

describe("Receiz webhook security", () => {
  it("accepts only a short timestamp window", () => {
    const now = Date.parse("2026-07-13T12:00:00.000Z");
    assert.equal(webhookTimestampIsFresh(String(now / 1000), now), true);
    assert.equal(webhookTimestampIsFresh(String((now - 6 * 60_000) / 1000), now), false);
    assert.equal(webhookTimestampIsFresh(String((now + 60_000) / 1000), now), false);
  });

  it("requires explicit event, tenant, merchant, receipt, and positive settlement value", () => {
    const payload = {
      type: "payment.settled",
      data: {
        payment_id: "pay_1",
        tenant_host: "merchant.receiz.app",
        merchant_receiz_id: "merchant.receiz.id",
        amount_cents: 1800
      }
    };
    const event = commerceEventFromUnknown(payload, "fallback.receiz.app");
    assert.ok(event);
    assert.equal(commerceWebhookAuthorityIsComplete(event, explicitWebhookEventId(payload)), true);
    assert.equal(commerceWebhookAuthorityIsComplete({ ...event, merchantReceizId: "" }, "pay_1"), false);
    assert.equal(commerceWebhookAuthorityIsComplete({ ...event, data: { ...event.data, receiptId: undefined } }, "pay_1"), false);
  });
});
