import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildLaunchReadiness } from "../src/lib/launch/readiness.js";
import { baseState } from "./support/commerce-state.js";

function readyState() {
  const state = baseState();
  state.hosting.customDomain = {
    domain: "www.boostcoffee.com",
    status: "ready",
    sslStatus: "valid",
    verified: true,
    liveUrl: "https://www.boostcoffee.com"
  };
  state.collections = [
    {
      id: "featured",
      name: "Featured",
      slug: "featured",
      productIds: ["coffee-pack"],
      published: true
    }
  ];
  state.orders = [
    {
      id: "1001",
      customerId: "customer",
      customerEmail: "customer@example.com",
      totalLabel: "$18.00",
      status: "settled",
      itemCount: 1,
      sealed: true,
      createdAt: "2026-07-01T00:00:00.000Z",
      merchantReceizId: "boost.receiz.id",
      tenantHost: "boost.receiz.app",
      paymentRail: "receiz_checkout",
      settlementStatus: "settled"
    }
  ];
  state.rewardRules = [
    {
      id: "purchase-reward",
      label: "Purchase reward",
      trigger: "Proof-sealed order completed",
      rewardId: "reward-1",
      active: true
    }
  ];
  state.proofEvents = [
    {
      id: "proof-1",
      type: "ORDER_VERIFIED",
      title: "ORDER_VERIFIED",
      detail: "Order #1001 sealed",
      status: "verified",
      timestampLabel: "now"
    }
  ];
  state.auth.receizId.sdkHelpers = [
    "createReceizIdIdentity",
    "buildReceizIdContinueRequest",
    "projectReceizIdentityAccount",
    "readReceizIdentityArtifact",
    "verifyReceizIdentityLoginProof",
    "signReceizIdentityLoginProof"
  ];
  state.publish.checklist = [
    "brand",
    "pages",
    "products",
    "rewards",
    "receiz",
    "checkout",
    "domain"
  ].map((id) => ({ id, label: id, complete: true }));

  return state;
}

describe("launch readiness", () => {
  it("grades the seeded production store as elite-ready", () => {
    const readiness = buildLaunchReadiness(readyState());

    assert.equal(readiness.score, 100);
    assert.equal(readiness.grade, "A+");
    assert.equal(readiness.blockers.length, 0);
    assert.equal(readiness.categories.every((category) => category.score === 100), true);
    assert.equal(readiness.categories.some((category) => category.id === "developer_sdk"), true);
    assert.equal(readiness.nextActions.length > 0, true);
  });

  it("exposes audience guidance for no-code merchants and developer clones", () => {
    const readiness = buildLaunchReadiness(readyState());

    assert.deepEqual(
      readiness.audiences.map((audience) => audience.id),
      ["merchant", "developer"]
    );
    assert.equal(readiness.audiences[0]?.label, "No-code merchant");
    assert.equal(readiness.audiences[1]?.label, "Developer clone");
    assert.ok(readiness.audiences[0]?.summary.includes("button"));
    assert.ok(readiness.audiences[1]?.summary.includes("@receiz/sdk"));
  });

  it("points production operators at the isolated release check", () => {
    const readiness = buildLaunchReadiness(readyState());
    const productionOps = readiness.categories.find((category) => category.id === "production_ops");

    assert.ok(productionOps);
    assert.equal(productionOps.actionLabel, "Run pnpm release:check before deploy.");
    assert.deepEqual(readiness.nextActions, [
      "Run pnpm release:check before production deploy.",
      "Publish the store-state record through Receiz after merchant edits."
    ]);
  });

  it("surfaces clear blockers for a new incomplete merchant store", () => {
    const draft = readyState();
    draft.hosting.published = false;
    draft.receiz.connected = false;
    draft.auth.receizId.connected = false;
    draft.checkout.mode = "mock";
    draft.publish.checklist = draft.publish.checklist.map((item) =>
      item.id === "checkout" ? { ...item, complete: false } : item
    );
    draft.products = [];
    draft.rewardRules = [];
    draft.hosting.customDomain.verified = false;
    draft.hosting.customDomain.status = "needs_dns";

    const readiness = buildLaunchReadiness(draft);

    assert.equal(readiness.score < 100, true);
    assert.equal(readiness.grade === "A+" || readiness.grade === "A", false);
    assert.deepEqual(
      readiness.blockers.map((blocker) => blocker.id),
      ["receiz_identity", "catalog", "checkout_live", "custom_domain", "publish"]
    );
  });
});
