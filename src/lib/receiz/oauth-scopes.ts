export const RECEIZ_BASE_OIDC_SCOPES = [
  "openid",
  "profile",
  "email",
  "offline_access",
  "receiz:record",
  "receiz:seal",
  "receiz:verify",
  "receiz:wallet.read",
  "receiz:wallet.transfer",
  "receiz:payments.create",
  "receiz:payments.read",
  "receiz:notes.mint",
  "receiz:notes.claim",
  "receiz:notes.read"
];

export const RECEIZ_TWIN_OIDC_SCOPES = ["receiz:twin.read", "receiz:twin.write"];

function enabled(value: string | undefined) {
  return value === "1" || value === "true";
}

export function receizOidcScopesFromEnv(env: Partial<Record<string, string | undefined>>) {
  return enabled(env.RECEIZ_ENABLE_TWIN_SCOPES)
    ? [...RECEIZ_BASE_OIDC_SCOPES, ...RECEIZ_TWIN_OIDC_SCOPES]
    : RECEIZ_BASE_OIDC_SCOPES;
}
