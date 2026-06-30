"use client";

import { Icons } from "@/components/icons";
import { Button, Panel, SectionHeader, StatusPill } from "@/components/ui";
import type { ReceizIdState } from "@/types/domain";

export function ReceizIdAccess({
  receizId,
  onSignIn
}: {
  receizId: ReceizIdState;
  onSignIn: () => void;
}) {
  return (
    <Panel className="receiz-id-panel">
      <SectionHeader title="Receiz ID" action={<StatusPill tone="green">One click</StatusPill>} />
      <div className="receiz-id-card">
        <span className="identity-icon">
          <Icons.receiz size={22} />
        </span>
        <div>
          <strong>{receizId.handle}</strong>
          <p>
            {receizId.connected
              ? "Receiz ID is connected for rewards, assets, orders, and benefits."
              : "Continue with Receiz ID to own rewards, assets, orders, and benefits for this store."}
          </p>
        </div>
      </div>
      {receizId.connected ? null : (
        <div className="identity-actions">
          <Button onClick={onSignIn} variant="primary">
            Continue with Receiz ID
          </Button>
        </div>
      )}
    </Panel>
  );
}
