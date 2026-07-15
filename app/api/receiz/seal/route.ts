import { NextRequest, NextResponse } from "next/server";
import { RECEIZ_DEFAULT_BASE_URL } from "@receiz/sdk";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function upstreamBaseUrl() {
  return (process.env.RECEIZ_BASE_URL || RECEIZ_DEFAULT_BASE_URL).replace(/\/+$/, "");
}

export async function POST(request: NextRequest) {
  const input = await request.formData().catch(() => null);
  const file = input?.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ ok: false, error: "receiz_seal_file_required" }, { status: 400 });
  }

  const form = new FormData();
  form.set("file", file, file.name);
  form.set("visualStamp", "0");

  let response: Response;
  try {
    response = await fetch(`${upstreamBaseUrl()}/api/document-seal`, {
      method: "POST",
      body: form,
      cache: "no-store"
    });
  } catch {
    return NextResponse.json({ ok: false, error: "receiz_seal_unavailable" }, { status: 502 });
  }

  if (!response.ok) {
    const payload = await response.json().catch(() => null) as { error?: string; message?: string } | null;
    return NextResponse.json(
      { ok: false, error: payload?.error || payload?.message || "receiz_seal_failed" },
      { status: response.status >= 400 && response.status < 500 ? response.status : 502 }
    );
  }

  const bytes = await response.arrayBuffer();
  if (!bytes.byteLength) {
    return NextResponse.json({ ok: false, error: "receiz_seal_empty" }, { status: 502 });
  }

  const headers = new Headers({
    "cache-control": "no-store, max-age=0",
    "content-type": response.headers.get("content-type") || "application/octet-stream"
  });
  const disposition = response.headers.get("content-disposition");
  if (disposition) headers.set("content-disposition", disposition);
  for (const name of ["x-receiz-anchor-id", "x-receiz-basis-sha256", "x-receiz-verify-path"]) {
    const value = response.headers.get(name);
    if (value) headers.set(name, value);
  }

  return new Response(bytes, { status: 200, headers });
}
