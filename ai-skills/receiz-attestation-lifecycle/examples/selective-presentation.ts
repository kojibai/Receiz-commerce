import {
  createReceizCredentialPresentationV125,
  verifyReceizCredentialPresentationV125,
  type ReceizClaimSetV125,
  type ReceizCredentialPresentationSourceV125,
} from "@receiz/sdk";
import { membershipDomain } from "./domain-definition.js";

export async function presentMembership(
  claimSet: ReceizClaimSetV125,
  verifiedCredential: ReceizCredentialPresentationSourceV125,
  selectedKai: string,
) {
  const presentation = await createReceizCredentialPresentationV125({
    domain: membershipDomain,
    claimSet,
    credential: verifiedCredential,
    disclose: ["membership-level"],
    selectedKai,
  });
  return verifyReceizCredentialPresentationV125({
    domain: membershipDomain,
    presentation,
    selectedKai,
  });
}
