"use client";

import { useState } from "react";
import { InlineActionFeedback } from "@/components/ActionFeedback";
import { Icons } from "@/components/icons";
import { Button, StatusPill } from "@/components/ui";
import type { ActionFeedbackState } from "@/types/action-feedback";
import type { CustomerAccount, Order } from "@/types/domain";

type ShippingDraft = NonNullable<Order["shipping"]>;

function initialShipping(customer: CustomerAccount, order: Order): ShippingDraft {
  const shipping = order.shipping ?? customer.shippingAddress;

  return {
    name: shipping?.name ?? customer.name,
    email: shipping?.email ?? customer.email,
    line1: shipping?.line1 ?? "",
    line2: shipping?.line2 ?? "",
    city: shipping?.city ?? "",
    region: shipping?.region ?? "",
    postalCode: shipping?.postalCode ?? "",
    country: shipping?.country ?? "US"
  };
}

export function ShippingDetailsForm({
  customer,
  feedback,
  onSave,
  order
}: {
  customer: CustomerAccount;
  feedback?: ActionFeedbackState;
  onSave: (orderId: string, shipping: ShippingDraft) => void;
  order: Order;
}) {
  const [draft, setDraft] = useState<ShippingDraft>(() => initialShipping(customer, order));
  const updateDraft = (field: keyof ShippingDraft, value: string) => setDraft((current) => ({ ...current, [field]: value }));

  return (
    <form
      className="shipping-details-form"
      onSubmit={(event) => {
        event.preventDefault();
        onSave(order.id, draft);
      }}
    >
      <div className="shipping-details-heading">
        <div>
          <span>Paid order #{order.id}</span>
          <strong>Shipping needed</strong>
        </div>
        <StatusPill tone="gold">After payment</StatusPill>
      </div>
      <div className="shipping-details-grid">
        <label>
          <span>Name</span>
          <input value={draft.name} onChange={(event) => updateDraft("name", event.target.value)} autoComplete="shipping name" />
        </label>
        <label>
          <span>Email</span>
          <input value={draft.email} onChange={(event) => updateDraft("email", event.target.value)} autoComplete="email" />
        </label>
        <label className="shipping-details-wide">
          <span>Address</span>
          <input value={draft.line1} onChange={(event) => updateDraft("line1", event.target.value)} autoComplete="shipping address-line1" />
        </label>
        <label className="shipping-details-wide">
          <span>Apartment, suite, etc.</span>
          <input value={draft.line2 ?? ""} onChange={(event) => updateDraft("line2", event.target.value)} autoComplete="shipping address-line2" />
        </label>
        <label>
          <span>City</span>
          <input value={draft.city} onChange={(event) => updateDraft("city", event.target.value)} autoComplete="shipping address-level2" />
        </label>
        <label>
          <span>State</span>
          <input value={draft.region} onChange={(event) => updateDraft("region", event.target.value)} autoComplete="shipping address-level1" />
        </label>
        <label>
          <span>Postal</span>
          <input value={draft.postalCode} onChange={(event) => updateDraft("postalCode", event.target.value)} autoComplete="shipping postal-code" />
        </label>
        <label>
          <span>Country</span>
          <input value={draft.country} onChange={(event) => updateDraft("country", event.target.value)} autoComplete="shipping country" />
        </label>
      </div>
      <Button type="submit" variant="primary">
        <Icons.package size={16} />
        Save shipping
      </Button>
      <InlineActionFeedback feedback={feedback} />
    </form>
  );
}
