"use client";

import { Icons } from "@/components/icons";
import { Button, Panel, SectionHeader, StatusPill } from "@/components/ui";
import type { ReceizIdState } from "@/types/domain";

export function ReceizIdAccess({
  onCreateReceizId,
  onExistingReceizId,
  onRestoreArtifact,
  receizId,
  showUploadFallback
}: {
  onCreateReceizId: () => void | Promise<void>;
  onExistingReceizId: () => void | Promise<void>;
  onRestoreArtifact: (file: File) => void | Promise<void>;
  receizId: ReceizIdState;
  showUploadFallback: boolean;
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
        <>
        <div className="identity-actions identity-choice-actions">
          <Button onClick={onExistingReceizId} variant="primary">
            <Icons.image size={17} />
            Existing Receiz ID
          </Button>
          <Button onClick={onCreateReceizId} variant="outline">
            <Icons.receiz size={17} />
            New Receiz ID
          </Button>
        </div>
        {showUploadFallback ? (
          <div className="identity-upload-fallback">
            <label className="button button-outline" htmlFor="storefront-receiz-identity-artifact">
              <Icons.image size={17} />
              Upload Identity Seal
            </label>
            <input
              accept=".json,image/png,image/jpeg,image/webp"
              id="storefront-receiz-identity-artifact"
              onChange={(event) => {
                const file = event.currentTarget.files?.[0];
                if (file) void onRestoreArtifact(file);
                event.currentTarget.value = "";
              }}
              type="file"
            />
            <p>Use an Identity Seal image, Identity Record image, or Receiz Key from this device.</p>
          </div>
        ) : null}
        </>
      )}
    </Panel>
  );
}
