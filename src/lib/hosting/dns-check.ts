import { resolve4, resolve6, resolveCname } from "node:dns/promises";

export type PublicDnsCheck = {
  resolved: boolean;
  records: string[];
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
