import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

const MAX_IMPORT_REDIRECTS = 3;
export const MAX_IMPORT_BYTES = 1_000_000;

function privateIpv4(address: string) {
  const parts = address.split(".").map(Number);
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return true;
  const [a, b] = parts;
  return a === 0 || a === 10 || a === 127 || a >= 224 || (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127);
}

function privateIpv6(address: string) {
  const normalized = address.toLowerCase().split("%")[0]!;
  return normalized === "::" || normalized === "::1" || normalized.startsWith("fc") || normalized.startsWith("fd") ||
    normalized.startsWith("fe8") || normalized.startsWith("fe9") || normalized.startsWith("fea") || normalized.startsWith("feb") ||
    normalized.startsWith("::ffff:127.") || normalized.startsWith("::ffff:10.") || normalized.startsWith("::ffff:192.168.");
}

export function isPublicIpAddress(address: string) {
  const family = isIP(address);
  if (family === 4) return !privateIpv4(address);
  if (family === 6) return !privateIpv6(address);
  return false;
}

export async function validatedPublicImportUrl(value: string) {
  const url = new URL(value);
  if (url.protocol !== "https:" && url.protocol !== "http:") throw new Error("import_url_protocol_invalid");
  if (url.username || url.password || url.port && !["80", "443"].includes(url.port)) {
    throw new Error("import_url_authority_invalid");
  }
  const addresses = isIP(url.hostname)
    ? [{ address: url.hostname }]
    : await lookup(url.hostname, { all: true, verbatim: true });
  if (!addresses.length || addresses.some(({ address }) => !isPublicIpAddress(address))) {
    throw new Error("import_url_private_network_rejected");
  }
  return url;
}

async function boundedResponseText(response: Response) {
  const declared = Number(response.headers.get("content-length") ?? 0);
  if (declared > MAX_IMPORT_BYTES) throw new Error("import_source_too_large");
  if (!response.body) return "";
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > MAX_IMPORT_BYTES) {
      await reader.cancel();
      throw new Error("import_source_too_large");
    }
    chunks.push(value);
  }
  return new TextDecoder().decode(Buffer.concat(chunks));
}

export async function fetchPublicImportSource(value: string, userAgent: string) {
  let url = await validatedPublicImportUrl(value);
  for (let redirect = 0; redirect <= MAX_IMPORT_REDIRECTS; redirect += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12_000);
    try {
      const response = await fetch(url, {
        headers: { accept: "application/json,text/csv,text/html;q=0.9", "user-agent": userAgent },
        redirect: "manual",
        signal: controller.signal
      });
      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get("location");
        if (!location || redirect === MAX_IMPORT_REDIRECTS) throw new Error("import_redirect_invalid");
        url = await validatedPublicImportUrl(new URL(location, url).toString());
        continue;
      }
      if (!response.ok) throw new Error(`Source returned ${response.status}`);
      return boundedResponseText(response);
    } finally {
      clearTimeout(timeout);
    }
  }
  throw new Error("import_redirect_invalid");
}
