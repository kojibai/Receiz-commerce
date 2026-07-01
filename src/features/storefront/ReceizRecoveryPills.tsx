"use client";

import { Icons } from "@/components/icons";
import { cx } from "@/lib/utils";

export function ReceizRecoveryPills({
  className,
  inputId,
  onPbiRecovery,
  onRestoreArtifact
}: {
  className?: string;
  inputId: string;
  onPbiRecovery: () => void | Promise<void>;
  onRestoreArtifact: (file: File) => void | Promise<void>;
}) {
  return (
    <div aria-label="Receiz ID recovery options" className={cx("account-recovery-pills", className)}>
      <button className="account-recovery-pill" onClick={() => void onPbiRecovery()} type="button">
        <Icons.lock size={14} />
        <span>PBI recovery</span>
      </button>
      <label className="account-recovery-pill" htmlFor={inputId}>
        <Icons.image size={14} />
        <span>Identity Seal</span>
      </label>
      <input
        accept=".json,image/png,image/jpeg,image/webp"
        id={inputId}
        onChange={(event) => {
          const file = event.currentTarget.files?.[0];
          if (file) void onRestoreArtifact(file);
          event.currentTarget.value = "";
        }}
        type="file"
      />
    </div>
  );
}

export function ReceizAccountManagementPills({
  className,
  onAttachPbi,
  onDownloadIdentitySeal
}: {
  className?: string;
  onAttachPbi: () => void | Promise<void>;
  onDownloadIdentitySeal: () => void | Promise<void>;
}) {
  return (
    <div aria-label="Receiz ID account tools" className={cx("account-recovery-pills", className)}>
      <button className="account-recovery-pill" onClick={() => void onAttachPbi()} type="button">
        <Icons.lock size={14} />
        <span>Attach PBI</span>
      </button>
      <button className="account-recovery-pill" onClick={() => void onDownloadIdentitySeal()} type="button">
        <Icons.image size={14} />
        <span>Download Seal</span>
      </button>
    </div>
  );
}
