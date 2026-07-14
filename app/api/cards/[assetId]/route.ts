import { NextRequest, NextResponse } from "next/server";
import type { JsonObject } from "@receiz/sdk";
import { admitPublicWildsCard, parsePublicWildsCardRecord, resolveLocalPublicWildsCard } from "@/features/play/public-card-registry";
import type { PortableCardAsset } from "@/features/play/portable-card";
import { createReceizCommerceAdapter } from "@/lib/receiz/adapter";
import { receizRequestSession } from "@/lib/receiz/session";
import { platform } from "@/lib/platform";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function publicOrigin(request: NextRequest) {
  const forwardedHost = request.headers.get("x-forwarded-host");
  const host = forwardedHost ?? request.headers.get("host") ?? new URL(request.url).host;
  const forwardedProto = request.headers.get("x-forwarded-proto");
  const protocol = forwardedProto ?? new URL(request.url).protocol.replace(":", "");
  return `${protocol}://${host}`;
}

export async function POST(request: NextRequest, context: { params: Promise<{ assetId: string }> }) {
  const { assetId } = await context.params;
  const body = await request.json().catch(() => null) as { asset?: PortableCardAsset } | null;
  if (!body?.asset || body.asset.id !== assetId) return NextResponse.json({ ok: false, error: "wilds_public_card_id_mismatch" }, { status: 400 });

  let record;
  try {
    record = admitPublicWildsCard(body.asset, `${publicOrigin(request)}/cards/${encodeURIComponent(assetId)}`);
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "wilds_public_card_invalid" }, { status: 422 });
  }

  const session = receizRequestSession(request);
  let published = false;
  if (session.accessToken) {
    try {
      const host = new URL(record.sourceUrl).host;
      const result = await createReceizCommerceAdapter({ accessToken: session.accessToken }).publishPublicStore({
        tenantHost: host,
        merchantReceizId: record.asset.manifest.ownerReceizId,
        title: `${record.asset.manifest.name} living card`,
        sourceUrl: record.sourceUrl,
        namespace: `wilds-card:${record.assetId}`,
        projectionState: "published",
        platform: platform.productName,
        state: record as unknown as JsonObject
      }, { idempotencyKey: `wilds-card:${record.assetId}:${record.asset.proof.digest}` });
      published = !(result && typeof result === "object" && "ok" in result && result.ok === false);
    } catch {
      published = false;
    }
  }
  return NextResponse.json({ ok: true, published, record });
}

export async function GET(request: NextRequest, context: { params: Promise<{ assetId: string }> }) {
  const { assetId } = await context.params;
  const local = resolveLocalPublicWildsCard(assetId);
  if (local) return NextResponse.json({ ok: true, record: local });

  const sourceUrl = `${publicOrigin(request)}/cards/${encodeURIComponent(assetId)}`;
  try {
    const recovered = parsePublicWildsCardRecord(await createReceizCommerceAdapter().readAppStateByUrl(sourceUrl));
    if (recovered?.assetId === assetId) return NextResponse.json({ ok: true, record: recovered });
  } catch {
    // A fresh device may be offline or the public Receiz projection may not exist yet.
  }
  return NextResponse.json({ ok: false, error: "wilds_public_card_not_found" }, { status: 404 });
}
