import { NextRequest, NextResponse } from "next/server";
import { createReceizCommerceAdapter } from "@/lib/receiz/adapter";
import { receizRequestSession } from "@/lib/receiz/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const noStoreHeaders = {
  "cache-control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  pragma: "no-cache",
  expires: "0"
};

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Receiz media upload failed";
}

function optionalString(value: FormDataEntryValue | null) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function optionalMetadata(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || !value.trim()) return undefined;

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
  const accessToken = session.accessToken;

  if (!accessToken) {
    return NextResponse.json(
      {
        ok: false,
        error: "receiz_access_token_required",
        message: "Receiz media upload needs an authenticated Receiz session."
      },
      { status: 401, headers: noStoreHeaders }
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

  if (!(file instanceof Blob)) {
    return NextResponse.json(
      { ok: false, error: "media_file_required", message: "Media upload requires a file." },
      { status: 400, headers: noStoreHeaders }
    );
  }

  const receiz = createReceizCommerceAdapter({
    baseUrl: process.env.RECEIZ_BASE_URL,
    accessToken
  });

  try {
    const result = await receiz.uploadMedia(file, {
      tenantHost: optionalString(form.get("tenantHost")),
      purpose: optionalString(form.get("purpose")),
      filename: optionalString(form.get("filename")),
      idempotencyKey: optionalString(form.get("idempotencyKey")),
      metadata: optionalMetadata(form.get("metadata"))
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
