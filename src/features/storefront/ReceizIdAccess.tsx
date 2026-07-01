"use client";

import { Icons } from "@/components/icons";
import { OfficialReceizLoginButton, Panel, SectionHeader, StatusPill } from "@/components/ui";
import { ReceizAccountManagementPills, ReceizRecoveryPills } from "@/features/storefront/ReceizRecoveryPills";
import type { ReceizIdState } from "@/types/domain";

export function ReceizIdAccess({
  onCreateReceizId,
  onExistingReceizId,
  onAttachPbiRecovery,
  onDownloadIdentitySeal,
  onRestoreArtifact,
  receizId,
  showUploadFallback
}: {
  onAttachPbiRecovery: () => void | Promise<void>;
  onCreateReceizId: () => void | Promise<void>;
  onDownloadIdentitySeal: () => void | Promise<void>;
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
      {receizId.connected ? (
        <ReceizAccountManagementPills
          onAttachPbi={onAttachPbiRecovery}
          onDownloadIdentitySeal={onDownloadIdentitySeal}
        />
      ) : null}
      {receizId.connected ? null : (
        <>
        <div className="identity-actions account-login-actions">
          <OfficialReceizLoginButton onClick={onExistingReceizId} />
        </div>
        {showUploadFallback ? (
          <ReceizRecoveryPills
            inputId="storefront-receiz-identity-artifact"
            onPbiRecovery={onCreateReceizId}
            onRestoreArtifact={onRestoreArtifact}
          />
        ) : null}
        </>
      )}
    </Panel>
  );
}
