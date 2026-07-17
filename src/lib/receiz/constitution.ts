import registryPayload from "../../../receiz.constitution.json" with { type: "json" };
import {
  RECEIZ_RULESET_VERSION,
  RECEIZ_V107_REGISTRY_DIGEST,
  createReceizAdmissionEngine,
  createReceizCausalHistory,
  digestReceizConstitution,
  evaluateReceizLawSet,
  validateReceizConstitutionRegistry,
  type ReceizConstitutionPhase,
  type ReceizConstitutionRegistry,
} from "@receiz/sdk";

const validation = validateReceizConstitutionRegistry(registryPayload);

if (!validation.ok) {
  throw new Error(`RECEIZ_V107_REGISTRY_INVALID:${validation.issues.join(",")}`);
}

export const RECEIZ_APP_CONSTITUTION: ReceizConstitutionRegistry = validation.value;

export async function verifyReceizAppConstitution(): Promise<Readonly<{
  ok: boolean;
  registryDigest: string;
  rulesetVersion: string;
}>> {
  const registryDigest = await digestReceizConstitution(RECEIZ_APP_CONSTITUTION);
  return {
    ok: registryDigest === RECEIZ_V107_REGISTRY_DIGEST && RECEIZ_APP_CONSTITUTION.version === RECEIZ_RULESET_VERSION,
    registryDigest,
    rulesetVersion: RECEIZ_RULESET_VERSION,
  };
}

export function evaluateReceizAppLaws(input: Readonly<{
  phase: ReceizConstitutionPhase;
  context: unknown;
  budget?: number;
}>) {
  return evaluateReceizLawSet({
    registry: RECEIZ_APP_CONSTITUTION,
    phase: input.phase,
    context: input.context,
    budget: input.budget ?? 1_000,
  });
}

export function createReceizAppAdmissionEngine(
  options: Omit<Parameters<typeof createReceizAdmissionEngine>[0], "registry">,
) {
  return createReceizAdmissionEngine({ ...options, registry: RECEIZ_APP_CONSTITUTION });
}

export function createReceizAppCausalHistory(
  options: Omit<Parameters<typeof createReceizCausalHistory>[0], "registryDigest">,
) {
  return createReceizCausalHistory({ ...options, registryDigest: RECEIZ_V107_REGISTRY_DIGEST });
}
