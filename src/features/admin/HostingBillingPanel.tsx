"use client";

import { Icons } from "@/components/icons";
import { Button, Panel, SectionHeader, StatusPill } from "@/components/ui";
import type { BillingConfig, HostingConfig } from "@/types/domain";
import { platform } from "@/lib/platform";

export function HostingBillingPanel({
  billing,
  hosting,
  onAddPayment,
  onSelectPlan
}: {
  billing: BillingConfig;
  hosting: HostingConfig;
  onAddPayment: (label: string) => void;
  onSelectPlan: (plan: HostingConfig["plan"]) => void;
}) {
  return (
    <Panel className="admin-panel hosting-billing-panel">
      <SectionHeader
        title="Hosting billing"
        action={<StatusPill tone={billing.status === "active" ? "green" : "gold"}>{billing.status}</StatusPill>}
      />
      <div className="billing-summary">
        <span className="billing-icon">
          <Icons.creditCard size={22} />
        </span>
        <div>
          <strong>{billing.monthlyTotalLabel}</strong>
          <p>{billing.paymentMethodLabel}</p>
        </div>
        <Button onClick={() => onAddPayment("Receiz wallet + card fallback")} variant="outline">
          Connect billing
        </Button>
      </div>
      <div className="plan-choice-list">
        {billing.plans.map((plan) => (
          <button
            className={hosting.plan === plan.id ? "plan-choice active" : "plan-choice"}
            key={plan.id}
            onClick={() => onSelectPlan(plan.id)}
            type="button"
          >
            <span>
              <strong>{plan.name}</strong>
              {plan.recommended ? <em>Recommended</em> : null}
            </span>
            <b>{plan.priceLabel}</b>
            <small>{plan.description}</small>
          </button>
        ))}
      </div>
      <div className="settings-list">
        {billing.invoices[0] ? (
          <div>
            <span>Latest invoice</span>
            <strong>{billing.invoices[0].amountLabel} · {billing.invoices[0].status}</strong>
          </div>
        ) : null}
        <div><span>Trial</span><strong>{billing.trialEndsAt}</strong></div>
        <div><span>{platform.freeSubdomainLabel}</span><strong>{hosting.subdomain}</strong></div>
        <div><span>{platform.customDomainLabel}</span><strong>{hosting.customDomain.domain}</strong></div>
        <div><span>Live URL</span><strong>{hosting.liveUrl}</strong></div>
        <div><span>Merchant Receiz account</span><strong>{hosting.merchantReceizId}</strong></div>
      </div>
    </Panel>
  );
}
