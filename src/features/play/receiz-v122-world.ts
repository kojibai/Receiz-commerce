import {
  planReceizPrivateCommandV122,
  validateReceizMandateUseV122,
} from "@receiz/sdk";

export const planWildsPrivateCommand = planReceizPrivateCommandV122;
export const validateWildsMandateUse = validateReceizMandateUseV122;

export type WildsModelIntent = Readonly<{
  kind: string;
  prose: string;
  modelAuthority: false;
}>;

export type WildsExactExecutionConfirmation = Readonly<{
  transactionDigest: string;
  mandateDigest: string | null;
  confirmed: true;
}>;

export function confirmWildsExactExecution(
  expected: Readonly<{ transactionDigest: string; mandateDigest: string | null }>,
  supplied: Readonly<{ transactionDigest: string; mandateDigest: string | null }>,
): WildsExactExecutionConfirmation {
  if (expected.transactionDigest !== supplied.transactionDigest || expected.mandateDigest !== supplied.mandateDigest) {
    throw new Error("wilds_exact_execution_confirmation_mismatch");
  }
  return Object.freeze({ ...expected, confirmed: true });
}
