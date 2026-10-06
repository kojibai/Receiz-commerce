import { NextRequest, NextResponse } from "next/server.js";
import { hostContextFromHost } from "@/lib/hosting/host-context";
import { getRequestOrigin } from "@/lib/url";
import { inAppPermissionEntryPath, inAppPermissionEntryPurpose } from "@/lib/receiz/in-app-permission";

export const runtime = "nodejs";

// Remote permission comes from a verified Identity Seal and explicit in-app
// consent through identity.exchangeProofAuthority, without leaving this app.
export async function GET(request: NextRequest) {
  const context = hostContextFromHost(request.headers.get("x-forwarded-host") ?? request.headers.get("host"));
  const purpose = inAppPermissionEntryPurpose(request.nextUrl.searchParams.get("purpose"), context.surface);
  return NextResponse.redirect(new URL(inAppPermissionEntryPath(purpose), getRequestOrigin(request)));
}
