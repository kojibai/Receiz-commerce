import { NextRequest, NextResponse } from "next/server";
import { hostContextFromHost } from "@/lib/hosting/host-context";
import { platform } from "@/lib/platform";
import { createReceizCommerceAdapter } from "@/lib/receiz/adapter";
import { commerceEventFromUnknown } from "@/lib/receiz/proof-state";
import { getServerProofStateStore } from "@/lib/receiz/proof-state-store";
import { mockStorage } from "@/lib/storage/mock-storage";

export const runtime = "nodejs";

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unknown webhook error";
}

async function verifyWebhookBody(bodyText: string, request: NextRequest) {
  const secret = process.env.RECEIZ_WEBHOOK_SECRET;
  if (!secret) return { ok: true, mode: "unsigned_dev" };

  const signature = request.headers.get("x-receiz-signature") ?? "";
  const timestamp = request.headers.get("x-receiz-timestamp") ?? "";
  if (!signature || !timestamp) return { ok: false, error: "missing_signature" };

  const receiz = createReceizCommerceAdapter({
    baseUrl: process.env.RECEIZ_BASE_URL
  });
  const ok = await receiz.verifyWebhookSignature({
    secret,
    timestamp,
    signature,
    body: bodyText
  });

  return ok ? { ok: true, mode: "signed" } : { ok: false, error: "invalid_signature" };
}

export async function POST(request: NextRequest) {
  const bodyText = await request.text();
  const signature = await verifyWebhookBody(bodyText, request);

  if (!signature.ok) {
    return NextResponse.json({ ok: false, error: signature.error }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(bodyText);
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? platform.domain;
  const hostContext = hostContextFromHost(host);
  const event = commerceEventFromUnknown(payload, hostContext.tenantHost ?? hostContext.host);

  if (!event) {
    return NextResponse.json({ ok: false, error: "unsupported_webhook_payload" }, { status: 400 });
  }

  try {
    const proofStore = await getServerProofStateStore(event.merchantReceizId || "receiz-app-commerce");
    const result = await proofStore.admitCommerceEvent(mockStorage.getState(), event);

    return NextResponse.json({
      ok: true,
      signature,
      admitted: result.admitted,
      eventId: event.id,
      proofMemory: {
        knownHead: proofStore.knownHead(100),
        entries: proofStore.snapshot().head.count
      }
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: "webhook_admission_failed",
        message: errorMessage(error)
      },
      { status: 500 }
    );
  }
}
