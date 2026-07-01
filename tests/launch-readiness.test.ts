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
    dnsResolved: true,
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

  it("builds a sequenced no-code merchant launch guide", () => {
    const draft = readyState();
    draft.receiz.connected = false;
    draft.auth.receizId.connected = false;
    draft.auth.receizId.localProofVerified = false;
    draft.products = [];
    draft.collections = [];
    draft.pages = draft.pages.map((page) => ({ ...page, published: false }));
    draft.blogPosts = [];
    draft.rewardRules = [];
    draft.checkout.mode = "mock";
    draft.hosting.customDomain = {
      domain: "",
      status: "pending",
      sslStatus: "unknown",
      verified: false,
      liveUrl: ""
    };
    draft.hosting.published = false;
    draft.hosting.lastPublishedAt = "";

    const readiness = buildLaunchReadiness(draft);

    assert.deepEqual(
      readiness.launchGuide.map((step) => step.id),
      ["receiz_id", "brand", "catalog", "content", "rewards", "checkout", "domains", "publish"]
    );
    assert.equal(readiness.launchGuide.filter((step) => step.status === "current").length, 1);
    assert.equal(readiness.launchGuide[0]?.status, "current");
    assert.equal(readiness.launchGuide[0]?.title, "Sign in with Receiz ID");
    assert.equal(readiness.launchGuide[1]?.status, "queued");
    assert.ok(readiness.launchGuide[2]?.description.includes("products"));
  });

  it("marks every guide step done for an elite-ready launch", () => {
    const readiness = buildLaunchReadiness(readyState());

    assert.equal(readiness.score, 100);
    assert.equal(readiness.launchGuide.every((step) => step.status === "done"), true);
  });

  it("does not mark sandbox checkout as production-ready", () => {
    const sandbox = readyState();
    sandbox.checkout.mode = "mock";
    sandbox.checkout.label = "Receiz sandbox";

    const readiness = buildLaunchReadiness(sandbox);
    const checkout = readiness.categories.find((category) => category.id === "checkout");
    const checkoutStep = readiness.launchGuide.find((step) => step.id === "checkout");

    assert.ok(checkout);
    assert.equal(checkout.status, "blocked");
    assert.equal(checkoutStep?.status, "current");
    assert.equal(readiness.score < 100, true);
  });

  it("does not keep a brand blocker after valid brand fields are saved", () => {
    const draft = readyState();
    draft.publish.checklist = draft.publish.checklist.map((item) =>
      item.id === "brand" ? { ...item, complete: false } : item
    );
    draft.brand.name = "BJK Lock Studio";
    draft.brand.logoText = "bjk";

    const readiness = buildLaunchReadiness(draft);

    assert.equal(readiness.blockers.some((blocker) => blocker.id === "brand"), false);
    assert.equal(readiness.launchGuide.find((step) => step.id === "brand")?.complete, true);
  });

  it("does not keep a checkout blocker after Receiz checkout is enabled", () => {
    const draft = readyState();
    draft.publish.checklist = draft.publish.checklist.map((item) =>
      item.id === "checkout" ? { ...item, complete: false } : item
    );
    draft.checkout.mode = "live";
    draft.checkout.label = "Receiz checkout";

    const readiness = buildLaunchReadiness(draft);

    assert.equal(readiness.blockers.some((blocker) => blocker.id === "checkout_live"), false);
    assert.equal(readiness.launchGuide.find((step) => step.id === "checkout")?.complete, true);
  });

  it("does not mark a custom domain ready until public DNS propagation is proven", () => {
    const draft = readyState();
    draft.hosting.customDomain = {
      domain: "shop.bjk.ceo",
      status: "active",
      sslStatus: "valid",
      verified: true,
      dnsResolved: false,
      liveUrl: "https://shop.bjk.ceo"
    };

    const readiness = buildLaunchReadiness(draft);

    assert.equal(
      readiness.categories
        .find((category) => category.id === "domains")
        ?.checks.find((check) => check.id === "custom_domain")?.complete,
      false
    );
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
