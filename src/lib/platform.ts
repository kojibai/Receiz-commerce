import { resolvePlatformConfiguration } from "./platform-config";

const configuredPlatform = resolvePlatformConfiguration({
  name: process.env.NEXT_PUBLIC_PLATFORM_NAME,
  domain: process.env.NEXT_PUBLIC_PLATFORM_DOMAIN,
  defaultSubdomain: process.env.NEXT_PUBLIC_DEFAULT_SUBDOMAIN,
});

export const platform = {
  ...configuredPlatform,
  studioName: "Launch Studio",
  repoLabel: "Clone template",
  tagline: "Launch proof-sealed ecommerce in seconds.",
  customDomainLabel: "Paid custom domain hosting",
  systemOfRecord: "Receiz proof objects",
  rails: [
    "Receiz ID",
    "Identity artifacts",
    "Receiz checkout",
    "Proof objects",
    "Wallet ledger",
    "Receized assets"
  ]
} as const;
