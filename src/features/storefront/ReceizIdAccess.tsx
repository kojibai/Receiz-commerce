"use client";

import { Icons } from "@/components/icons";
import { Button, Panel, SectionHeader, StatusPill } from "@/components/ui";
import type { ReceizIdState } from "@/types/domain";

export function ReceizIdAccess({
  receizId,
  onCreate,
  onSignIn
}: {
  receizId: ReceizIdState;
  onCreate: () => void;
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
          <p>Use an existing Receiz ID or create one to own rewards, assets, orders, and benefits.</p>
        </div>
      </div>
      <div className="identity-actions">
        <Button onClick={onSignIn} variant="primary">
          Continue
        </Button>
        <Button onClick={onCreate} variant="outline">
          Create ID
        </Button>
      </div>
    </Panel>
  );
}
