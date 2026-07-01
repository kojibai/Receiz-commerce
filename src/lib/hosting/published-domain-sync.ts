import type { CommerceState, HostingConfig } from "../../types/domain";
import { buildPublishedCommerceState, type PublishOwner } from "./published-state";

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function hasPublishedHosting(
  input: unknown
): input is Record<string, unknown> & { hosting: Record<string, unknown> & { published: true } } {
  return isRecord(input) && isRecord(input.hosting) && input.hosting.published === true;
}

export function buildPublishedStateForHostingSync(
  base: CommerceState,
  submittedState: unknown,
  hosting: HostingConfig,
  owner: PublishOwner = {}
) {
  if (!hasPublishedHosting(submittedState)) return null;

  const submittedHosting = submittedState.hosting;
  const subdomainStatus = isRecord(submittedHosting.subdomainStatus)
    ? submittedHosting.subdomainStatus
    : {};
  const customDomain = isRecord(submittedHosting.customDomain)
    ? submittedHosting.customDomain
    : {};

  return buildPublishedCommerceState(
    base,
    {
      ...submittedState,
      hosting: {
        ...submittedHosting,
        ...hosting,
        subdomainStatus: {
          ...subdomainStatus,
          ...hosting.subdomainStatus
        },
        customDomain: {
          ...customDomain,
          ...hosting.customDomain
        },
        published: true,
        lastPublishedAt: hosting.lastPublishedAt || submittedHosting.lastPublishedAt || "now"
      }
    },
    owner
  );
}
