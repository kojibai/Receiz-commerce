import {
  compressInlineImageDataUrlForPublish,
  PUBLISH_INLINE_MEDIA_ITEM_MAX_CHARS
} from "../receiz/publish-payload-media";

export const IMAGE_UPLOAD_ACCEPT = "image/*";
export const DEFAULT_IMAGE_UPLOAD_MAX_BYTES = 5 * 1024 * 1024;
export const DEFAULT_STORED_IMAGE_MAX_CHARS = PUBLISH_INLINE_MEDIA_ITEM_MAX_CHARS;

export type ImageValidationOptions = {
  maxBytes?: number;
};

export type ImageValidationResult =
  | { ok: true }
  | { ok: false; message: string };

export function validateImageFile(
  file: Pick<File, "size" | "type" | "name">,
  options: ImageValidationOptions = {}
): ImageValidationResult {
  const maxBytes = options.maxBytes ?? DEFAULT_IMAGE_UPLOAD_MAX_BYTES;
  const type = file.type.toLowerCase();
  const name = file.name.toLowerCase();
  const isImage = type.startsWith("image/") || /\.(png|jpe?g|webp|gif|avif|svg)$/i.test(name);

  if (!isImage) {
    return { ok: false, message: "Choose an image file from your camera roll or files." };
  }

  if (file.size > maxBytes) {
    return { ok: false, message: `Image must be ${Math.round(maxBytes / 1024 / 1024)}MB or smaller.` };
  }

  return { ok: true };
}

export function readImageFileAsDataUrl(
  file: File,
  options: ImageValidationOptions = {}
): Promise<string> {
  const validation = validateImageFile(file, options);
  if (!validation.ok) return Promise.reject(new Error(validation.message));

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", async () => {
      if (typeof reader.result === "string") {
        const dataUrl = reader.result;

        try {
          resolve(
            (await compressInlineImageDataUrlForPublish(dataUrl, ["browser", "imageUpload"], DEFAULT_STORED_IMAGE_MAX_CHARS)) ??
              dataUrl
          );
        } catch {
          resolve(dataUrl);
        }
      } else {
        reject(new Error("Could not read image file."));
      }
    });
    reader.addEventListener("error", () => reject(new Error("Could not read image file.")));
    reader.readAsDataURL(file);
  });
}
