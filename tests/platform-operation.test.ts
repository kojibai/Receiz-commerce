import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  platformOperationMetadata,
  platformOperationIdFromWebhook,
  platformOperationIntentFromUnknown,
  settledPlatformOperationFromWebhook,
  stateWithSettledPlatformOperation
} from "../src/lib/hosting/platform-operation.js";
import { baseState } from "./support/commerce-state.js";

const operation = {
  id: "receiz-app:hosting-plan:boost.receiz.id:pro",
  kind: "hosting_plan" as const,
  merchantReceizId: "boost.receiz.id",
  tenantHost: "boost.receiz.app",
  amountUsd: "49.00",
  recipientUserId: "receiz-platform-admin",
  plan: "pro" as const
};

describe("durable platform operations", () => {
  it("serializes the complete continuation into Receiz settlement metadata", () => {
    assert.deepEqual(platformOperationMetadata(operation), {
      schema: "receiz.app.platform_operation.v1",
      operationId: operation.id,
      operationKind: "hosting_plan",
      merchantReceizId: "boost.receiz.id",
      tenantHost: "boost.receiz.app",
      expectedAmountUsd: "49.00",
      recipientUserId: "receiz-platform-admin",
      plan: "pro"
    });
  });

  it("accepts only a settled webhook matching amount and platform recipient", () => {
    const parsed = settledPlatformOperationFromWebhook(
      {
        type: "payment.settled",
        created_at: "2026-07-13T15:00:00.000Z",
        data: {
          payment_id: "pay_platform_1",
          amount_cents: 4900,
          recipient_user_id: "receiz-platform-admin",
          metadata: platformOperationMetadata(operation)
        }
      },
      { recipientUserId: "receiz-platform-admin" }
    );

    assert.ok(parsed);
    assert.equal(parsed.receiptId, "pay_platform_1");
    assert.equal(parsed.plan, "pro");
    assert.equal(parsed.settledAt, "2026-07-13T15:00:00.000Z");
  });

  it("rejects pending, amount-mismatched, and recipient-mismatched callbacks", () => {
    const payload = {
      type: "payment.created",
      data: {
        payment_id: "pay_platform_1",
        amount_cents: 4900,
        recipient_user_id: "receiz-platform-admin",
        metadata: platformOperationMetadata(operation)
      }
    };

    assert.equal(settledPlatformOperationFromWebhook(payload, { recipientUserId: "receiz-platform-admin" }), null);
    assert.equal(settledPlatformOperationFromWebhook({ ...payload, type: "payment.settled", data: { ...payload.data, amount_cents: 4800 } }, { recipientUserId: "receiz-platform-admin" }), null);
    assert.equal(settledPlatformOperationFromWebhook({ ...payload, type: "payment.settled" }, { recipientUserId: "another-admin" }), null);
  });

  it("recovers wallet-only continuations from the durable operation intent", () => {
    assert.equal(platformOperationIdFromWebhook({
      type: "wallet.transfer.completed",
      data: { client_nonce: `${operation.id}:wallet` }
    }), operation.id);
    assert.deepEqual(
      platformOperationIntentFromUnknown({
        schema: "receiz.app.platform_operation.v1",
        event: "platform.operation.intent.created",
        data: platformOperationMetadata(operation)
      }),
      operation
    );
  });

  it("activates a paid plan exactly once from the signed settlement", () => {
    const settled = {
      ...operation,
      receiptId: "pay_platform_1",
      settledAt: "2026-07-13T15:00:00.000Z"
    };
    const first = stateWithSettledPlatformOperation(baseState(), settled);
    const second = stateWithSettledPlatformOperation(first, settled);

    assert.equal(first.hosting.plan, "pro");
    assert.equal(first.billing.status, "active");
    assert.equal(first.billing.paymentMethodLabel, "Receiz live billing");
    assert.equal(first.proofEvents[0]?.id, "platform-operation:pay_platform_1");
    assert.deepEqual(second, first);
  });
});
