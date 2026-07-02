import type { CommerceState } from "@/types/domain";

export type ReceizProfileWorkspaceIdentity = {
  id?: string;
  email?: string;
  handle?: string;
};

function cleanAlias(value: string | undefined | null) {
  return value?.trim().replace(/^@/, "").toLowerCase() || "";
}

function handleAliases(value: string | undefined | null) {
  const clean = cleanAlias(value);
  if (!clean) return [];

  const base = clean.replace(/\.receiz\.id$/i, "");
  return Array.from(new Set([clean, clean.includes(".") ? clean : `${clean}.receiz.id`, base].filter(Boolean)));
}

function addAliases(target: Set<string>, value: string | undefined | null) {
  const clean = cleanAlias(value);
  if (clean) target.add(clean);

  for (const alias of handleAliases(value)) {
    target.add(alias);
  }
}

export function receizProfileOwnerKey(profile: ReceizProfileWorkspaceIdentity, fallback = "receiz-account") {
  return handleAliases(profile.handle)[0] || cleanAlias(profile.id) || cleanAlias(profile.email) || fallback;
}

export function receizProfileMatchesWorkspace(
  state: Pick<CommerceState, "auth" | "hosting">,
  profile: ReceizProfileWorkspaceIdentity
) {
  const profileAliases = new Set<string>();
  const workspaceAliases = new Set<string>();

  addAliases(profileAliases, profile.handle);
  addAliases(profileAliases, profile.id);
  addAliases(profileAliases, profile.email);

  addAliases(workspaceAliases, state.auth.workspaceOwnerId);
  addAliases(workspaceAliases, state.auth.receizId.connected ? state.auth.receizId.handle : null);
  addAliases(workspaceAliases, state.hosting.merchantReceizId);
  addAliases(workspaceAliases, state.auth.admin.email);
  addAliases(workspaceAliases, state.auth.customer.receizHandle);
  addAliases(workspaceAliases, state.auth.customer.email);

  for (const alias of profileAliases) {
    if (workspaceAliases.has(alias)) return true;
  }

  const profileHasPortableOwnerAlias = handleAliases(profile.handle).length > 0 || Boolean(cleanAlias(profile.email));
  if (
    !profileHasPortableOwnerAlias &&
    state.auth.receizId.connected &&
    state.auth.receizId.localProofVerified &&
    Boolean(state.auth.workspaceOwnerId)
  ) {
    return true;
  }

  return false;
}
