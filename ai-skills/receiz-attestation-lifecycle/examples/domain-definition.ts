import {
  RECEIZ_CURRENT_REGISTRY_DIGEST,
  parseReceizAttestationDomainV125,
} from "@receiz/sdk";

export const membershipDomain = parseReceizAttestationDomainV125({
  schema: "receiz.attestation.domain.v125",
  domainId: "example.membership",
  credentialTypes: ["example.membership.member"],
  claimSchemas: [{
    name: "membership-level",
    schemaId: "example.claim.membership-level",
    schemaVersion: 1,
    valueType: "string",
    disclosure: "selective",
    issuerPolicy: "example.policy.membership-issuer",
    verifierPolicy: "example.policy.membership-verifier",
  }],
  evidenceRequirements: [{
    evidenceType: "example.membership-evidence",
    classification: "selective",
    minimumCount: 1,
    verifierBinding: "receiz.artifact-admission.v112",
    evaluatorPolicy: "example.policy.membership-evaluator",
  }],
  evaluationRules: [{
    ruleId: "example.rule.membership",
    evidenceType: "example.membership-evidence",
    operator: "minimum-count",
    threshold: 1,
    satisfiedOutcomeCode: "evaluation.passed",
    unsatisfiedOutcomeCode: "evaluation.failed",
  }],
  outcomeCodes: ["evaluation.failed", "evaluation.passed"],
  actorRoles: [
    { role: "applicant", allowedActions: ["submitted", "withdrawn"] },
    { role: "issuer", allowedActions: ["issued", "expired"] },
  ],
  workflow: { automatedEvaluation: false, humanReview: false, minimumApprovers: 0, applicationWindowKai: "1000", evaluatorImplementationDigest: null },
  reviewPolicy: { satisfiedOutcomeCode: "evaluation.passed", unsatisfiedOutcomeCode: "evaluation.failed" },
  lifecycle: { renewable: true, suspendable: true, revocable: true, replaceable: true },
  consent: { required: true, binding: "accepted-proof-head" },
  visibility: { publicClaims: "public", selectiveClaims: "consent-bound", privateClaims: "commitment-only", evidence: "reference-only" },
  constitutionalLawIds: ["artifact.verify-before-extract", "authority.proof-object-first"],
  registryDigest: RECEIZ_CURRENT_REGISTRY_DIGEST,
  authority: { definitionIsProofAuthority: false, strongerTruth: "sealed-receiz-proof-object" },
});
