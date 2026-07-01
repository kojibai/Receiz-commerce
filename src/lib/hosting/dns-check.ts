import { resolve4, resolve6, resolveCname } from "node:dns/promises";

export type PublicDnsCheck = {
  resolved: boolean;
  records: string[];
  expectedRecords?: string[];
  error?: string;
};

export async function checkPublicDns(hostname: string): Promise<PublicDnsCheck> {
  const checks = await Promise.allSettled([
    resolveCname(hostname),
    resolve4(hostname),
    resolve6(hostname)
  ]);
  const records = checks.flatMap((result) => (result.status === "fulfilled" ? result.value : []));

  if (records.length > 0) {
    return { resolved: true, records };
  }

  const error = checks
    .map((result) => (result.status === "rejected" ? result.reason : null))
    .filter(Boolean)
    .map((reason) => (reason instanceof Error ? reason.message : String(reason)))
    .find(Boolean);

  return {
    resolved: false,
    records: [],
    error
  };
}

function normalizeDnsRecord(value: string) {
  return value.trim().toLowerCase().replace(/\.$/, "");
}

function isApexDomain(hostname: string) {
  return hostname.trim().split(".").filter(Boolean).length === 2;
}

export function receizCustomDomainCnameTarget() {
  return process.env.RECEIZ_CUSTOM_DOMAIN_CNAME_TARGET ??
    process.env.NEXT_PUBLIC_RECEIZ_CUSTOM_DOMAIN_CNAME_TARGET ??
    "custom.receiz.app";
}

export function expectedVercelDnsRecordsForDomain(hostname: string) {
  return isApexDomain(hostname)
    ? [process.env.VERCEL_APEX_A_RECORD ?? "76.76.21.21"]
    : [receizCustomDomainCnameTarget()];
}

export async function checkVercelDomainDns(hostname: string): Promise<PublicDnsCheck> {
  const check = await checkPublicDns(hostname);
  const expectedRecords = expectedVercelDnsRecordsForDomain(hostname);
  const normalizedRecords = new Set(check.records.map(normalizeDnsRecord));
  const resolved = expectedRecords.some((record) => normalizedRecords.has(normalizeDnsRecord(record)));

  return {
    ...check,
    resolved,
    expectedRecords,
    error: resolved
      ? undefined
      : check.error ?? `DNS has not propagated to ${expectedRecords.join(" or ")}`
  };
}
