export type HostingRenewalPeriod = Readonly<{ startsAt: string; paidThrough: string }>;

export const HOSTING_RENEWAL_WINDOW_MS = 14 * 24 * 60 * 60 * 1000;

/** Calendar policy for the hosting service, never Phi valuation or Kai proof. */
export function oneHostingMonth(startsAt: string): HostingRenewalPeriod {
  const start = new Date(startsAt);
  if (!Number.isFinite(start.getTime()) || start.toISOString() !== startsAt) throw new Error("hosting_period_invalid");
  const end = new Date(start);
  end.setUTCDate(1);
  end.setUTCMonth(end.getUTCMonth() + 1);
  const lastDay = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth() + 1, 0)).getUTCDate();
  end.setUTCDate(Math.min(start.getUTCDate(), lastDay));
  return Object.freeze({ startsAt, paidThrough: end.toISOString() });
}

export function validateHostingRenewalPeriod(value: unknown): HostingRenewalPeriod {
  if (!value || typeof value !== "object" || Array.isArray(value) || !("startsAt" in value) ||
    !("paidThrough" in value) || typeof value.startsAt !== "string" || typeof value.paidThrough !== "string") {
    throw new Error("hosting_period_invalid");
  }
  const expected = oneHostingMonth(value.startsAt);
  if (expected.paidThrough !== value.paidThrough) throw new Error("hosting_period_invalid");
  return expected;
}

export function nextHostingRenewalPeriod(previous?: HostingRenewalPeriod, now = Date.now()): HostingRenewalPeriod {
  if (!Number.isSafeInteger(now) || now <= 0) throw new Error("hosting_period_invalid");
  const previousEnd = previous ? Date.parse(validateHostingRenewalPeriod(previous).paidThrough) : 0;
  if (previousEnd - now > HOSTING_RENEWAL_WINDOW_MS) throw new Error("hosting_renewal_too_early");
  return oneHostingMonth(new Date(Math.max(now, previousEnd)).toISOString());
}

export function hostingPeriodStatus(period: HostingRenewalPeriod, now = Date.now()) {
  const validated = validateHostingRenewalPeriod(period);
  return now < Date.parse(validated.startsAt) ? "scheduled" as const
    : now < Date.parse(validated.paidThrough) ? "active" as const : "past_due" as const;
}
