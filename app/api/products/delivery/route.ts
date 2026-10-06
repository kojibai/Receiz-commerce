import { NextRequest, NextResponse } from "next/server";
import { holdProductDeliverySource, MAX_DELIVERY_SOURCE_BYTES } from "@/lib/delivery/native-delivery";
import { hostContextFromHost } from "@/lib/hosting/host-context";
import { createReceizCommerceAdapter } from "@/lib/receiz/adapter";
import { loadReceizConnectProfile } from "@/lib/receiz/connect-profile";
import { receizAuthorityRequired, receizRequestSession } from "@/lib/receiz/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers = { "cache-control": "no-store" };

export async function POST(request: NextRequest) {
  const host = hostContextFromHost(request.headers.get("x-forwarded-host") ?? request.headers.get("host"));
  const session = receizRequestSession(request);
  if (!session.cookieAccessToken || session.sessionScope !== host.storageKey) {
    return NextResponse.json(receizAuthorityRequired("/admin", "store_manage"), { status: 401, headers });
  }
  if (request.headers.get("sec-fetch-site") === "cross-site") return NextResponse.json({ ok: false, error: "delivery_origin_invalid" }, { status: 403, headers });
  if (Number(request.headers.get("content-length")) > MAX_DELIVERY_SOURCE_BYTES + 16_384) {
    return NextResponse.json({ ok: false, error: "delivery_source_size_invalid", message: "Choose a complete sealed proof file up to 256 KB." }, { status: 413, headers });
  }
  try {
    const form = await request.formData();
    const file = form.get("file"), productId = form.get("productId"), merchantReceizId = form.get("merchantReceizId");
    if (!(file instanceof File) || typeof productId !== "string" || !/^[a-zA-Z0-9._:-]{1,128}$/.test(productId) || typeof merchantReceizId !== "string") {
      throw new Error("delivery_source_required");
    }
    const profile = await loadReceizConnectProfile(session.cookieAccessToken);
    if (!profile?.handle || profile.handle !== merchantReceizId) return NextResponse.json(receizAuthorityRequired("/admin", "store_manage"), { status: 401, headers });
    const source = await holdProductDeliverySource({
      receiz: createReceizCommerceAdapter({ baseUrl: process.env.RECEIZ_BASE_URL }), file,
      binding: { productId, merchantReceizId: profile.handle }
    });
    return NextResponse.json({ ok: true, source }, { headers });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "delivery_source_invalid",
      message: "Attach the complete native Receiz proof file owned by your store identity, up to 256 KB." }, { status: 422, headers });
  }
}
