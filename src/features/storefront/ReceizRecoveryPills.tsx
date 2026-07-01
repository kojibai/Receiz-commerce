"use client";

import { Icons } from "@/components/icons";
import { cx } from "@/lib/utils";

export function ReceizRecoveryPills({
  className,
  inputId,
  onRestoreArtifact
}: {
  className?: string;
  inputId: string;
  onRestoreArtifact: (file: File) => void | Promise<void>;
}) {
  return (
    <div aria-label="Receiz ID recovery options" className={cx("account-recovery-pills", className)}>
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
  onDownloadIdentitySeal
}: {
  className?: string;
  onDownloadIdentitySeal: () => void | Promise<void>;
}) {
  return (
    <div aria-label="Receiz ID account tools" className={cx("account-recovery-pills", className)}>
      <button className="account-recovery-pill" onClick={() => void onDownloadIdentitySeal()} type="button">
        <Icons.image size={14} />
        <span>Download Seal</span>
      </button>
    </div>
  );
}
