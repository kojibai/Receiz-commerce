"use client";

import { useId, useState } from "react";
import { Icons } from "@/components/icons";
import { IMAGE_UPLOAD_ACCEPT, readImageFileAsDataUrl } from "@/lib/media/image-upload";

export function ImageUploadField({
  label,
  onChange,
  value
}: {
  label: string;
  onChange: (value: string | null) => void;
  value: string | null | undefined;
}) {
  const id = useId();
  const [error, setError] = useState("");

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setError("");

    try {
      onChange(await readImageFileAsDataUrl(file));
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Image upload failed");
    }
  };

  return (
    <div className="image-upload-field">
      <span>{label}</span>
      <div className="image-upload-row">
        <label className="image-upload-drop" htmlFor={id}>
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img alt="" src={value} />
          ) : (
            <Icons.image size={22} />
          )}
          <strong>{value ? "Change image" : "Add image"}</strong>
          <small>Camera roll or files</small>
          <input
            accept={IMAGE_UPLOAD_ACCEPT}
            id={id}
            onChange={(event) => void handleFile(event.target.files?.[0])}
            type="file"
          />
        </label>
        <label className="image-url-fallback">
          <span>URL fallback</span>
          <input
            placeholder="https://..."
            value={value?.startsWith("data:") ? "" : value ?? ""}
            onChange={(event) => onChange(event.target.value.trim() || null)}
          />
        </label>
      </div>
      {value ? (
        <button className="link-button image-clear-button" onClick={() => onChange(null)} type="button">
          Remove image
        </button>
      ) : null}
      {error ? <p className="image-upload-error">{error}</p> : null}
    </div>
  );
}
