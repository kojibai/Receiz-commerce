import { readFileSync } from "node:fs";
import { join } from "node:path";
import { platform } from "../platform";
import type { DomainDnsRecord, DomainStatus, DomainVerificationRecord } from "@/types/domain";
import { receizCustomDomainCnameTarget } from "./dns-check";
import type { PublicDnsCheck } from "./dns-check";

type VercelProjectDomain = {
  name: string;
  apexName?: string;
  projectId?: string;
  verified?: boolean | string;
  verification?: DomainVerificationRecord[];
  error?: {
    code?: string;
    message?: string;
  };
};

type VercelDomainConfig = {
  apiToken: string;
  projectId: string;
  teamId?: string;
  teamSlug?: string;
};

type VercelProjectLink = {
  projectId?: string;
  orgId?: string;
};

export class VercelDomainError extends Error {
  status: number;
  payload: unknown;

  constructor(message: string, status = 500, payload: unknown = null) {
    super(message);
    this.name = "VercelDomainError";
    this.status = status;
    this.payload = payload;
  }
}

function readVercelProjectLink(): VercelProjectLink {
  try {
    return JSON.parse(readFileSync(join(process.cwd(), ".vercel", "project.json"), "utf8")) as VercelProjectLink;
  } catch {
    return {};
  }
}

export function getVercelDomainConfig(): VercelDomainConfig | null {
  const projectLink = readVercelProjectLink();
  const apiToken = process.env.VERCEL_API_TOKEN ?? process.env.VERCEL_TOKEN;
  const projectId = process.env.VERCEL_PROJECT_ID ?? process.env.VERCEL_PROJECT_NAME ?? projectLink.projectId;

  if (!apiToken || !projectId) return null;

  return {
    apiToken,
    projectId,
    teamId: process.env.VERCEL_TEAM_ID ?? projectLink.orgId,
    teamSlug: process.env.VERCEL_TEAM_SLUG
  };
}

export function hasVercelDomainConfig() {
  return Boolean(getVercelDomainConfig());
}

function projectQuery(config: VercelDomainConfig) {
  const params = new URLSearchParams();
  if (config.teamId) params.set("teamId", config.teamId);
  if (config.teamSlug) params.set("slug", config.teamSlug);
  const query = params.toString();
  return query ? `?${query}` : "";
}

function encodeVercelPathSegment(value: string) {
  return encodeURIComponent(value).replace(/\*/g, "%2A");
}

async function requestVercelDomain<T>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const config = getVercelDomainConfig();

  if (!config) {
    throw new VercelDomainError("Missing Vercel domain env vars.", 428, {
      required: ["VERCEL_API_TOKEN", "VERCEL_PROJECT_ID"],
      optional: ["VERCEL_TEAM_ID", "VERCEL_TEAM_SLUG"]
    });
  }

  const response = await fetch(`https://api.vercel.com${path}`, {
    ...init,
    headers: {
      accept: "application/json",
      authorization: `Bearer ${config.apiToken}`,
      ...(init.body ? { "content-type": "application/json" } : {}),
      ...init.headers
    }
  });
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      typeof payload === "object" &&
      payload &&
      "error" in payload &&
      typeof payload.error === "object" &&
      payload.error &&
      "message" in payload.error
        ? String(payload.error.message)
        : `Vercel domain API failed with ${response.status}`;

    throw new VercelDomainError(message, response.status, payload);
  }

  return payload as T;
}

export async function getProjectDomain(domain: string) {
  const config = getVercelDomainConfig();
  if (!config) {
    throw new VercelDomainError("Missing Vercel domain env vars.", 428);
  }

  return requestVercelDomain<VercelProjectDomain>(
    `/v9/projects/${encodeVercelPathSegment(config.projectId)}/domains/${encodeVercelPathSegment(domain)}${projectQuery(config)}`
  );
}

export async function addProjectDomain(domain: string) {
  const config = getVercelDomainConfig();
  if (!config) {
    throw new VercelDomainError("Missing Vercel domain env vars.", 428);
  }

  try {
    return await requestVercelDomain<VercelProjectDomain>(
      `/v10/projects/${encodeVercelPathSegment(config.projectId)}/domains${projectQuery(config)}`,
      {
        method: "POST",
        body: JSON.stringify({ name: domain, gitBranch: null })
      }
    );
  } catch (error) {
    if (error instanceof VercelDomainError && (error.status === 400 || error.status === 409)) {
      return getProjectDomain(domain);
    }

    throw error;
  }
}

export async function verifyProjectDomain(domain: string) {
  const config = getVercelDomainConfig();
  if (!config) {
    throw new VercelDomainError("Missing Vercel domain env vars.", 428);
  }

  return requestVercelDomain<VercelProjectDomain>(
    `/v9/projects/${encodeVercelPathSegment(config.projectId)}/domains/${encodeVercelPathSegment(domain)}/verify${projectQuery(config)}`,
    { method: "POST" }
  );
}

function routingDnsRecordForDomain(domain: string): DomainDnsRecord {
  const apex = domain.split(".").length === 2;

  if (apex) {
    const value = process.env.VERCEL_APEX_A_RECORD ?? "76.76.21.21";
    return {
      type: "A",
      host: domain,
      value,
      label: `Point ${domain} to ${value}`
    };
  }

  const value = receizCustomDomainCnameTarget();
  return {
    type: "CNAME",
    host: domain,
    value,
    label: `Point ${domain} to ${value}`
  };
}

function instructionForDnsRecord(record: DomainDnsRecord) {
  if (record.type === "A" || record.type === "CNAME") {
    return `Point ${record.host} ${record.type} to ${record.value}`;
  }

  return `Add ${record.type} record ${record.host} with value ${record.value}`;
}

export function dnsRecordsForDomain(domain: string, verification: DomainVerificationRecord[] = []) {
  const verificationRecords = verification.map((record) => ({
    type: record.type,
    host: record.domain,
    value: record.value,
    label: `Add ${record.type} record for ${record.domain}`
  }));

  return [...verificationRecords, routingDnsRecordForDomain(domain)];
}

export function dnsInstructionsForDomain(domain: string, verification: DomainVerificationRecord[] = []) {
  return dnsRecordsForDomain(domain, verification).map(instructionForDnsRecord);
}

export function wildcardDomainStatusFromVercel(domain: string, vercelDomain: VercelProjectDomain): DomainStatus {
  const verified = vercelDomain.verified === true || vercelDomain.verified === "true";
  const verification = vercelDomain.verification ?? [];

  return {
    domain,
    status: verified ? "active" : "needs_dns",
    sslStatus: verified ? "valid" : "pending",
    verified,
    liveUrl: `https://${domain}`,
    verification,
    dnsInstructions: verified
      ? []
      : [
          `Add *.${platform.domain} to the Vercel project domains.`,
          `Point wildcard DNS *.${platform.domain} to ${process.env.VERCEL_CNAME_TARGET ?? "cname.vercel-dns-0.com"}`,
          ...verification.map((record) => `Add ${record.type} record ${record.domain} with value ${record.value}`)
        ],
    lastCheckedAt: new Date().toISOString(),
    message: verified ? "Wildcard hosting verified" : "Wildcard DNS or domain verification required"
  };
}

export function customDomainStatusFromVercel(
  domain: string,
  vercelDomain: VercelProjectDomain,
  dnsCheck?: PublicDnsCheck
): DomainStatus {
  const vercelVerified = vercelDomain.verified === true || vercelDomain.verified === "true";
  const dnsResolved = dnsCheck?.resolved === true;
  const verified = vercelVerified && dnsResolved;
  const verification = vercelDomain.verification ?? [];
  const dnsRecords = dnsRecordsForDomain(domain, verification);
  const dnsInstructions = dnsInstructionsForDomain(domain, verification);

  return {
    domain,
    status: verified ? "active" : "needs_dns",
    sslStatus: verified ? "valid" : "pending",
    verified,
    dnsResolved,
    liveUrl: `https://${domain}`,
    verification,
    dnsRecords: verified ? [] : dnsRecords,
    dnsInstructions: verified ? [] : dnsInstructions,
    lastCheckedAt: new Date().toISOString(),
    message: verified
      ? "Domain verified, DNS propagated, and SSL ready"
      : vercelVerified
        ? `Vercel domain is verified, but DNS has not propagated to ${dnsCheck?.expectedRecords?.join(" or ") ?? "Vercel"} yet`
        : "Add the DNS records, then verify again"
  };
}

export function missingVercelEnvDomainStatus(domain: string): DomainStatus {
  const projectLink = readVercelProjectLink();
  const missing = [
    process.env.VERCEL_API_TOKEN || process.env.VERCEL_TOKEN ? "" : "VERCEL_API_TOKEN",
    process.env.VERCEL_PROJECT_ID || process.env.VERCEL_PROJECT_NAME || projectLink.projectId ? "" : "VERCEL_PROJECT_ID"
  ].filter(Boolean);

  return {
    domain,
    status: "needs_vercel_env",
    sslStatus: "unknown",
    verified: false,
    liveUrl: `https://${domain}`,
    dnsRecords: dnsRecordsForDomain(domain),
    dnsInstructions: [
      `Set ${missing.join(" and ") || "Vercel domain automation env vars"} in Vercel env vars.`,
      `Add ${platform.domain} and *.${platform.domain} to this Vercel project for instant subdomains.`,
      `Point wildcard DNS *.${platform.domain} to ${process.env.VERCEL_CNAME_TARGET ?? "cname.vercel-dns-0.com"}.`
    ],
    lastCheckedAt: new Date().toISOString(),
    message: "Vercel domain automation is not configured"
  };
}
