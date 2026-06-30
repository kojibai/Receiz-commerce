import { seedCommerceState } from "@/data/seed";
import { receizCommerceAdapter } from "@/lib/receiz/adapter";
import { getConfiguredSiteOrigin, getReceizRedirectUri } from "@/lib/url";

export const mockAuth = {
  getCurrentUser() {
    return seedCommerceState.auth.customer;
  },
  getReceizIdState() {
    return seedCommerceState.auth.receizId;
  },
  getReceizIdAuthorizeUrl(origin = getConfiguredSiteOrigin()) {
    return receizCommerceAdapter.buildReceizIdAuthorizeUrl({
      clientId: process.env.RECEIZ_CLIENT_ID ?? "receiz-app-commerce-demo",
      redirectUri: getReceizRedirectUri(origin),
      codeChallenge: "demo-code-challenge",
      usernameHint: seedCommerceState.auth.receizId.handle
    });
  },
  signIn(kind: "admin" | "customer") {
    return kind === "admin" ? seedCommerceState.auth.admin : seedCommerceState.auth.customer;
  },
  signInWithReceizId() {
    return {
      ok: true,
      account: seedCommerceState.auth.receizId
    };
  },
  createReceizId() {
    return receizCommerceAdapter.createReceizId({
      username: seedCommerceState.brand.logoText,
      displayName: seedCommerceState.brand.name,
      next: "/admin"
    });
  },
  signOut() {
    return { ok: true };
  },
  requireAdmin() {
    return seedCommerceState.auth.admin;
  },
  requireCustomer() {
    return seedCommerceState.auth.customer;
  }
};
