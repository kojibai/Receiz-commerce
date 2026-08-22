import {
  planReceizReserveV122,
  planReceizSettlementV122,
  validateReceizValueIntentV122,
  type ReceizValueRailV122,
  type ReceizWorldValueIntentV122,
} from "@receiz/sdk";

export type ReceizValuePlanInput = Readonly<{
  rail: ReceizValueRailV122;
  amountPhiMicro: string;
  sourceProofObjectId: string;
  sourceValueHead: string;
  destinationSubjectId: string;
  expectedDestinationHead: string;
  usdPerPhiMicrocents: string;
  priceBasis: unknown;
}>;

function positiveDecimal(value: unknown, field: string): string {
  if (typeof value !== "string" || !/^[0-9]+$/.test(value) || BigInt(value) <= 0n) throw new Error(`${field}_positive_decimal_required`);
  return value;
}

function required(value: unknown, field: string): string {
  if (typeof value !== "string" || !value.trim()) throw new Error(`${field}_required`);
  return value.trim();
}

export async function planReceizValue(input: ReceizValuePlanInput): Promise<ReceizWorldValueIntentV122> {
  const raw = input as ReceizValuePlanInput & Record<string, unknown>;
  if ("amountUsdCents" in raw) throw new Error("amountPhiMicro_is_the_only_movement_authority");
  if (input.rail !== "settlement" && input.rail !== "reserve") throw new Error("receiz_value_rail_invalid");
  if (input.priceBasis === undefined) throw new Error("priceBasis_required");
  const planInput = Object.freeze({
    amountPhiMicro: positiveDecimal(input.amountPhiMicro, "amountPhiMicro"),
    sourceProofObjectId: required(input.sourceProofObjectId, "sourceProofObjectId"),
    sourceValueHead: required(input.sourceValueHead, "sourceValueHead"),
    destinationSubjectId: required(input.destinationSubjectId, "destinationSubjectId"),
    expectedDestinationHead: required(input.expectedDestinationHead, "expectedDestinationHead"),
    usdPerPhiMicrocents: positiveDecimal(input.usdPerPhiMicrocents, "usdPerPhiMicrocents"),
    priceBasis: input.priceBasis,
  });
  const intent = input.rail === "settlement"
    ? await planReceizSettlementV122(planInput)
    : await planReceizReserveV122(planInput);
  if (!(await validateReceizValueIntentV122(intent))) throw new Error("receiz_value_intent_invalid");
  return intent;
}
