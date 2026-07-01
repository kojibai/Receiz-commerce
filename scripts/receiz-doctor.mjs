import { RECEIZ_SDK_VERSION, createReceizClient, receizOidcScopesForRails } from "@receiz/sdk";
import { existsSync, readFileSync } from "node:fs";

for (const file of [".env.local", ".env"]) {
  if (!existsSync(file)) continue;

  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const index = trimmed.indexOf("=");
    const key = trimmed.slice(0, index).trim();
    const rawValue = trimmed.slice(index + 1).trim();
    if (!key || process.env[key] !== undefined) continue;
    process.env[key] = rawValue.replace(/^["']|["']$/g, "");
  }
}

const rails = [
  "identity",
  "proofStore",
  "wallet",
  "payments",
  "appState",
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
  "releases",
  "twin"
];

function disabled(value) {
  return value === "0" || value === "false";
}

function unique(values) {
  return [...new Set(values)];
}

const scopes = unique([
  "offline_access",
  ...receizOidcScopesForRails(...rails),
  "receiz:notes.mint",
  "receiz:notes.claim",
  "receiz:notes.read",
  ...(disabled(process.env.RECEIZ_ENABLE_WORLD_SCOPES) ? [] : ["receiz:world.read", "receiz:world.write"]),
  ...(disabled(process.env.RECEIZ_ENABLE_TWIN_SCOPES) ? [] : ["receiz:twin.read", "receiz:twin.write"])
]);

const baseUrl = process.env.RECEIZ_BASE_URL || "https://receiz.com";
const accessToken = process.env.RECEIZ_ACCESS_TOKEN || process.env.RECEIZ_CONNECT_ACCESS_TOKEN || "";
const tenantHost =
  process.env.RECEIZ_DOCTOR_TENANT_HOST ||
  process.env.NEXT_PUBLIC_DEFAULT_SUBDOMAIN ||
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/^https?:\/\//, "") ||
  "receiz.app";
const callbackUrl =
  process.env.RECEIZ_ID_CALLBACK_URL ||
  (process.env.NEXT_PUBLIC_SITE_URL ? `${process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "")}/api/auth/receiz/callback` : undefined);

const client = createReceizClient({
  baseUrl,
  accessToken: accessToken || undefined
});

try {
  const [doctor, capabilities] = await Promise.all([
    client.doctor({ tenantHost, callbackUrl, scopes }),
    client.capabilities({ tenantHost, callbackUrl, scopes })
  ]);

  console.log(
    JSON.stringify(
      {
        ok: doctor.ok,
        sdkVersion: RECEIZ_SDK_VERSION,
        baseUrl,
        tenantHost,
        callbackUrl,
        hasDelegatedAccessToken: Boolean(accessToken),
        requestedScopes: scopes,
        missing: doctor.missing,
        warnings: doctor.warnings,
        fixes: doctor.fixes,
        capabilities: capabilities.capabilities
      },
      null,
      2
    )
  );
} catch (error) {
  console.error(
    JSON.stringify(
      {
        ok: false,
        sdkVersion: RECEIZ_SDK_VERSION,
        baseUrl,
        tenantHost,
        callbackUrl,
        hasDelegatedAccessToken: Boolean(accessToken),
        error: error instanceof Error ? error.message : "Receiz doctor failed"
      },
      null,
      2
    )
  );
  process.exitCode = 1;
}
