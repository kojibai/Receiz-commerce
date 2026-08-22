import { RECEIZ_V123_DOCTRINE } from "./doctrine";

export const RECEIZ_V123_CONTRACT = Object.freeze({
  sdkVersion: "123.0.0" as const,
  registryDigest: "945a581d1fc49c2dc18fbe8c129771ef464b8a58b96188bce561e88ae8b6ceeb" as const,
  operationMatrixDigest: "e08cec3e3ad22c20ddd6c08169ece19f094c366214d6d6b4dc432cd97558e2c5" as const,
  applicationOperationCount: 36 as const,
  mcpToolCount: 141 as const,
  aiSkillCount: 42 as const,
  mcpTools: Object.freeze(RECEIZ_V123_DOCTRINE.map((entry) => entry.mcpTool)),
  authority: Object.freeze({
    strongerTruth: "exact-receiz-proof-object" as const,
    mcpAuthority: false as const,
    representationCanAuthorize: false as const,
    institutionIndependentVerification: true as const,
    projectionOnly: true as const,
  }),
});
