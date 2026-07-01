import { receizOidcScopesForRails, type ReceizRailScopeKey } from "@receiz/sdk";

const RECEIZ_APP_RAILS: ReceizRailScopeKey[] = [
  "identity",
  "proofStore",
  "wallet",
  "payments",
  "publicStore",
  "commerce",
  "rewards",
  "customers",
  "merchants",
  "media",
  "domains",
  "events",
  "search",
  "permissions",
  "jobs",
  "audit",
  "risk",
  "compliance",
  "portability",
  "notifications",
  "offline",
  "releases"
];

const RECEIZ_NOTE_SCOPES = ["receiz:notes.mint", "receiz:notes.claim", "receiz:notes.read"];

function uniqueScopes(scopes: string[]) {
  return Array.from(new Set(scopes));
}

export const RECEIZ_BASE_OIDC_SCOPES = [
  "offline_access",
  ...receizOidcScopesForRails(...RECEIZ_APP_RAILS),
  ...RECEIZ_NOTE_SCOPES
];

export const RECEIZ_TWIN_OIDC_SCOPES = ["receiz:twin.read", "receiz:twin.write"];

function enabled(value: string | undefined) {
  return value === "1" || value === "true";
}

export function receizOidcScopesFromEnv(env: Partial<Record<string, string | undefined>>) {
  const scopes = enabled(env.RECEIZ_ENABLE_TWIN_SCOPES)
    ? [...RECEIZ_BASE_OIDC_SCOPES, ...RECEIZ_TWIN_OIDC_SCOPES]
    : RECEIZ_BASE_OIDC_SCOPES;

  return uniqueScopes(scopes);
}
