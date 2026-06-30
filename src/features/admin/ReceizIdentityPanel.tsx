"use client";

import { Icons } from "@/components/icons";
import { Button, Panel, SectionHeader, StatusPill } from "@/components/ui";
import type { ReceizIdState } from "@/types/domain";

export function ReceizIdentityPanel({
  receizId,
  onCreate,
  onSignIn
}: {
  receizId: ReceizIdState;
  onCreate: () => void;
  onSignIn: () => void;
}) {
  return (
    <Panel className="admin-panel identity-panel">
      <SectionHeader
        title="Receiz ID"
        action={<StatusPill tone={receizId.connected ? "green" : "neutral"}>{receizId.statusLabel}</StatusPill>}
      />
      <div className="identity-card">
        <span className="identity-icon">
          <Icons.receiz size={24} />
        </span>
        <div>
          <strong>{receizId.handle}</strong>
          <p>{receizId.displayName}</p>
        </div>
      </div>
      <div className="settings-list identity-settings">
        <div><span>One-click login</span><strong>{receizId.oneClickLogin ? "Enabled" : "Off"}</strong></div>
        <div><span>Existing Receiz IDs</span><strong>{receizId.existingIdsSupported ? "Accepted" : "Off"}</strong></div>
        <div><span>Mode</span><strong>{receizId.loginMode === "existing_receiz_id" ? "Existing ID" : "New ID"}</strong></div>
        <div><span>SDK helpers</span><strong>{receizId.sdkHelpers.length}</strong></div>
      </div>
      <div className="identity-actions">
        <Button onClick={onSignIn} variant="primary">
          Continue with Receiz ID
        </Button>
        <Button onClick={onCreate} variant="outline">
          Create Receiz ID
        </Button>
      </div>
    </Panel>
  );
}
