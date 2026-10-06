"use client";

import { FileKey2, Upload } from "lucide-react";
import { useId, type RefObject } from "react";

export function ProofFilePicker({ label, fileName, inputRef, onChange, disabled = false, accept }: {
  label: string;
  fileName: string;
  inputRef: RefObject<HTMLInputElement | null>;
  onChange: (file: File | null) => void;
  disabled?: boolean;
  accept?: string;
}) {
  const labelId = useId();
  return (
    <div className="receiz-proof-file-field">
      <span id={labelId}>{label}</span>
      <input ref={inputRef} hidden type="file" accept={accept} disabled={disabled} aria-labelledby={labelId}
        onChange={(event) => onChange(event.target.files?.[0] ?? null)} />
      <button type="button" className={`receiz-proof-file-picker${fileName ? " has-file" : ""}`} disabled={disabled}
        aria-label={`${fileName ? "Change" : "Choose"} ${label} file`} onClick={() => inputRef.current?.click()}>
        <span className="receiz-proof-file-icon"><FileKey2 aria-hidden="true" size={22} strokeWidth={1.6} /></span>
        <span className="receiz-proof-file-copy">
          <strong>{fileName || `Choose your ${label}`}</strong>
          <span>{fileName ? "Ready to verify · choose another" : "Select the original file from your device"}</span>
        </span>
        <span className="receiz-proof-file-action"><Upload aria-hidden="true" size={16} /><span>{fileName ? "Change" : "Browse"}</span></span>
      </button>
    </div>
  );
}
