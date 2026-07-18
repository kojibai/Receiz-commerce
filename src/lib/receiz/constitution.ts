import registryPayload from "../../../receiz.constitution.json" with { type: "json" };
import {
  RECEIZ_RULESET_VERSION,
  RECEIZ_V109_REGISTRY_DIGEST,
  createReceizCausalCheckpoint,
  createReceizAdmissionEngine,
  createReceizCausalHistory,
  digestReceizConstitution,
  evaluateReceizLawSet,
  verifyReceizCausalCheckpoint,
  validateReceizConstitutionRegistry,
  type ReceizConstitutionPhase,
  type ReceizConstitutionRegistry,
} from "@receiz/sdk";

const validation = validateReceizConstitutionRegistry(registryPayload);

if (!validation.ok) {
  throw new Error(`RECEIZ_V109_APP_REGISTRY_INVALID:${validation.issues.join(",")}`);
}

export const RECEIZ_APP_CONSTITUTION: ReceizConstitutionRegistry = validation.value;

export async function verifyReceizAppConstitution(): Promise<Readonly<{
  ok: boolean;
  registryDigest: string;
  appRegistryDigest: string;
  rulesetVersion: string;
}>> {
  const registryDigest = await digestReceizConstitution(RECEIZ_APP_CONSTITUTION);
  return {
    ok: RECEIZ_APP_CONSTITUTION.previousRegistryDigest === RECEIZ_V109_REGISTRY_DIGEST && RECEIZ_APP_CONSTITUTION.version === RECEIZ_RULESET_VERSION,
    registryDigest: RECEIZ_V109_REGISTRY_DIGEST,
    appRegistryDigest: registryDigest,
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
  return createReceizCausalHistory({ ...options, registryDigest: RECEIZ_V109_REGISTRY_DIGEST });
}

export function checkpointReceizAppCausalHistory(
  history: ReturnType<typeof createReceizAppCausalHistory>,
) {
  return createReceizCausalCheckpoint(history);
}

export function verifyReceizAppCausalCheckpoint(
  checkpoint: Parameters<typeof verifyReceizCausalCheckpoint>[0],
  history: ReturnType<typeof createReceizAppCausalHistory>,
) {
  return verifyReceizCausalCheckpoint(checkpoint, history);
}
