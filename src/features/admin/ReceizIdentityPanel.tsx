"use client";

import { Icons } from "@/components/icons";
import { Button, Panel, SectionHeader, StatusPill } from "@/components/ui";
import type { ReceizIdState } from "@/types/domain";

export function ReceizIdentityPanel({
  receizId,
  artifactInputId = "receiz-identity-artifact",
  onCreate,
  onRestoreArtifact,
  onSignIn
}: {
  receizId: ReceizIdState;
  artifactInputId?: string;
  onCreate: () => void;
  onRestoreArtifact: (file: File) => void | Promise<void>;
  onSignIn: () => void;
}) {
  const modeLabel =
    receizId.loginMode === "new_receiz_id"
      ? "New ID"
      : receizId.loginMode === "restored_identity_artifact"
        ? "Restored artifact"
        : "Existing ID";

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
      <div className="identity-proof-strip">
        <div>
          <span>Account image</span>
          <strong>{receizId.accountImageLabel}</strong>
        </div>
        <div>
          <span>Artifact</span>
          <strong>{receizId.artifactKind.replace(/_/g, " ")}</strong>
        </div>
        <div>
          <span>Local proof</span>
          <strong>{receizId.localProofVerified ? "Verified" : receizId.portableStateStatus}</strong>
        </div>
      </div>
      <div className="restore-source-row" aria-label="Receiz identity restore sources">
        {receizId.restoreSources.map((source) => (
          <span key={source}>{source}</span>
        ))}
      </div>
      <div className="settings-list identity-settings">
        <div><span>One-click login</span><strong>{receizId.oneClickLogin ? "Enabled" : "Off"}</strong></div>
        <div><span>Existing Receiz IDs</span><strong>{receizId.existingIdsSupported ? "Accepted" : "Off"}</strong></div>
        <div><span>Mode</span><strong>{modeLabel}</strong></div>
        <div><span>SDK helpers</span><strong>{receizId.sdkHelpers.length}</strong></div>
      </div>
      {receizId.connected ? null : (
        <div className="identity-actions">
          <Button onClick={onSignIn} variant="primary">
            Continue with Receiz ID
          </Button>
          <Button onClick={onCreate} variant="outline">
            Create Receiz ID
          </Button>
        </div>
      )}
      <div className="identity-restore-row">
        <label className="button button-outline" htmlFor={artifactInputId}>
          Restore Key or Seal
        </label>
        <input
          accept=".json,image/png,image/jpeg,image/webp"
          id={artifactInputId}
          onChange={(event) => {
            const file = event.currentTarget.files?.[0];
            if (file) {
              void onRestoreArtifact(file);
              event.currentTarget.value = "";
            }
          }}
          type="file"
        />
        <p>Reads the Receiz Key, Identity Record image, or Identity Seal image locally before continuity.</p>
      </div>
    </Panel>
  );
}
