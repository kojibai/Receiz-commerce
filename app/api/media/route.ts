import { NextRequest, NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { hostContextFromHost } from "@/lib/hosting/host-context";
import { platform } from "@/lib/platform";
import { createReceizCommerceAdapter } from "@/lib/receiz/adapter";
import { loadReceizConnectProfile } from "@/lib/receiz/connect-profile";
import { receizRequestSession } from "@/lib/receiz/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const noStoreHeaders = {
  "cache-control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  pragma: "no-cache",
  expires: "0"
};
const MAX_MEDIA_BYTES = 10 * 1024 * 1024;
const ALLOWED_MEDIA_TYPES = new Set(["image/avif", "image/gif", "image/jpeg", "image/png", "image/webp"]);

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Receiz media upload failed";
}

function optionalString(value: FormDataEntryValue | null) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function optionalMetadata(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || !value.trim()) return undefined;
  if (Buffer.byteLength(value, "utf8") > 16_384) return undefined;

  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : undefined;
  } catch {
    return undefined;
  }
}

export async function POST(request: NextRequest) {
  const session = receizRequestSession(request);
  const accessToken = session.cookieAccessToken;
  const requestHost = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? platform.domain;
  const hostContext = hostContextFromHost(requestHost);

  if (!accessToken || session.sessionScope !== hostContext.storageKey) {
    return NextResponse.json(
      {
        ok: false,
        error: "receiz_access_token_required",
        message: "Receiz media upload needs an authenticated Receiz session."
      },
      { status: 401, headers: noStoreHeaders }
    );
  }
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_MEDIA_BYTES + 64_000) {
    return NextResponse.json(
      { ok: false, error: "media_file_too_large", message: "Media uploads are limited to 10 MB." },
      { status: 413, headers: noStoreHeaders }
    );
  }

  let form: FormData;

  try {
    form = await request.formData();
  } catch {
    return NextResponse.json(
      { ok: false, error: "invalid_media_form", message: "Media upload form could not be read." },
      { status: 400, headers: noStoreHeaders }
    );
  }

  const file = form.get("file");

  if (!(file instanceof Blob) || !file.size) {
    return NextResponse.json(
      { ok: false, error: "media_file_required", message: "Media upload requires a file." },
      { status: 400, headers: noStoreHeaders }
    );
  }
  if (file.size > MAX_MEDIA_BYTES) {
    return NextResponse.json(
      { ok: false, error: "media_file_too_large", message: "Media uploads are limited to 10 MB." },
      { status: 413, headers: noStoreHeaders }
    );
  }
  if (!ALLOWED_MEDIA_TYPES.has(file.type.toLowerCase())) {
    return NextResponse.json(
      { ok: false, error: "media_type_not_allowed", message: "Upload a supported image file." },
      { status: 415, headers: noStoreHeaders }
    );
  }

  const profile = await loadReceizConnectProfile(accessToken).catch(() => null);
  if (!profile?.handle) {
    return NextResponse.json(
      { ok: false, error: "receiz_identity_unavailable", message: "The authenticated Receiz identity could not be loaded." },
      { status: 401, headers: noStoreHeaders }
    );
  }
  const tenantHost = hostContext.tenantHost ?? hostContext.host;
  const digest = createHash("sha256").update(Buffer.from(await file.arrayBuffer())).digest("hex");
  const purpose = optionalString(form.get("purpose")) ?? "storefront_media";
  const idempotencyKey = `receiz-media:${createHash("sha256")
    .update(`${profile.handle}:${tenantHost}:${purpose}:${digest}`)
    .digest("hex")}`;

  const receiz = createReceizCommerceAdapter({
    baseUrl: process.env.RECEIZ_BASE_URL,
    accessToken
  });

  try {
    const result = await receiz.uploadMedia(file, {
      tenantHost,
      purpose,
      filename: optionalString(form.get("filename")),
      idempotencyKey,
      metadata: {
        ...optionalMetadata(form.get("metadata")),
        tenantHost,
        actorReceizId: profile.handle,
        sourceSha256: digest
      }
    });

    return NextResponse.json(result, { headers: noStoreHeaders });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: "receiz_media_upload_failed",
        message: errorMessage(error)
      },
      { status: 502, headers: noStoreHeaders }
    );
  }
}
