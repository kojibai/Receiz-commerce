import { RECEIZ_V122_DOCTRINE } from "./doctrine";

export const RECEIZ_V122_CONTRACT = Object.freeze({
  sdkVersion: "122.0.0" as const,
  registryDigest: "ed65956a16dd5f0d76d04db2f4a651fc43eb0a71cef64afd53576aa782dc9896" as const,
  operationMatrixDigest: "bd1d7ccf1543e2484df68e3025c7376f8ae37cafe1ca0d7c9cd9f52f6342b325" as const,
  mcpTools: Object.freeze(RECEIZ_V122_DOCTRINE.map((entry) => entry.mcpTool)),
  authority: Object.freeze({
    strongerTruth: "sealed-receiz-proof-object" as const,
    mcpAuthority: false as const,
    representationCanAuthorize: false as const,
    projectionOnly: true as const,
  }),
});
